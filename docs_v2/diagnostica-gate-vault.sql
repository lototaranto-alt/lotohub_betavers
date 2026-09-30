-- =============================================================================
--  DIAGNOSTICA - proximity gate e vault multimediale
--  Tutte le query sono di SOLA LETTURA. Nessuna scrive.
--  Copia TUTTO questo file ed eseguilo in Supabase > SQL Editor.
--  Poi confronta ogni risultato con la sezione ATTESI qui sotto.
-- =============================================================================


--  =============================================================================
--  D1 - DOVE VIVE POSTGIS?  (la piu' importante, leggi sotto)
--  =============================================================================

SELECT
  n.nspname AS schema_postgis,
  e.extversion AS versione
FROM pg_extension e
JOIN pg_namespace n ON n.oid = e.extnamespace
WHERE e.extname = 'postgis';

--  ATTESI: una riga.
--
--  Se schema_postgis = 'public'   -> va bene, ST_Distance si risolve.
--  Se schema_postgis = 'extensions' -> PROBLEMA. Significa che PostGIS sta in uno
--     schema che il nostro SET search_path = public, pg_temp NON include.
--     In quel caso scan_poi_gps va in errore a runtime con
--     "function st_distance does not exist", e il proximity gate non funziona
--     anche se sembra installato.
--     La correzione e' una riga, te la preparo appena mi dici il risultato.
--
--  Nota: non dare per scontato 'public'. Supabase di solito mette le estensioni
--  in 'extensions', ma questo progetto potrebbe averle in public. Per questo la
--  domanda va fatta e non dedotta.


--  =============================================================================
--  D2 - IL GATE E' DAVVERO NELLA FUNZIONE VIVA?
--  =============================================================================

SELECT
  (prosrc LIKE '%v_dist_poi_m > v_radius_m%')      AS proximity_gate,
  (prosrc LIKE '%ST_Distance%')                     AS calcola_distanza,
  (prosrc LIKE '%search_path = public, pg_temp%')   AS search_path_impostato,
  (prosecdef)                                       AS security_definer,
  length(prosrc)                                    AS caratteri
FROM pg_proc
WHERE proname = 'scan_poi_gps'
  AND pronamespace = 'public'::regnamespace;

--  ATTESI: proximity_gate = true, calcola_distanza = true, caratteri > 8000.
--  Se non esce nessuna riga, la funzione non c'e'.


--  =============================================================================
--  D3 - LE COLONNE CHE LA FUNZIONE TOCCA DAVVERO
--  Nota: 'coords' NON deve stare su user_pois. La funzione lo legge da pois (D4).
--  =============================================================================

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'user_pois'
  AND column_name IN ('profile_id', 'poi_id', 'visited_at',
                      'is_shadowbanned', 'lat', 'lng')
ORDER BY column_name;

--  ATTESI: 6 righe. 'lat' e 'lng' sono obbligatorie: senza, l'anti-velocita'
--  va in errore e il check-in fallisce per tutti.


--  =============================================================================
--  D4 - LE COORDINATE DEL POI, da cui dipende tutto il gate
--  =============================================================================

SELECT
  EXISTS (SELECT 1 FROM information_schema.columns
          WHERE table_schema='public' AND table_name='pois'
            AND column_name='coords')   AS pois_ha_coords,
  (SELECT extnamespace::regnamespace::text FROM pg_extension
    WHERE extname='postgis')            AS postgis_schema;

--  ATTESI: pois_ha_coords = true.


--  =============================================================================
--  D5 - IL VAULT: le funzioni appena eseguite sono al loro posto?
--  =============================================================================

SELECT proname,
       (prosrc LIKE '%auth.uid()%')              AS usa_auth_uid,
       (prosrc LIKE '%p_user_id%')               AS accetta_p_user_id,
       (proconfig::text LIKE '%search_path%')    AS search_path_impostato,
       length(prosrc)                            AS caratteri
FROM pg_proc
WHERE proname IN ('get_poi_vetrina', 'sblocca_media', 'calculate_user_level')
  AND pronamespace = 'public'::regnamespace
ORDER BY proname;

--  ATTESI: 3 righe.
--   get_poi_vetrina       usa_auth_uid = FALSE  <-- difetto noto, ancora da correggere
--                          accetta_p_user_id = TRUE <-- buco di sicurezza
--   sblocca_media         usa_auth_uid = TRUE
--   calculate_user_level  search_path_impostato = FALSE <-- difetto noto
--
--  Questo e' lo stato PRIMA della correzione che sto per scrivere. Serve a te
--  come base di confronto: dopo la correzione, get_poi_vetrina non accetterà
--  p_user_id e le tre avranno search_path.


--  =============================================================================
--  D6 - LA CURVA DEI LIVELLI E' DAVVERO UGUALE AL FRONTEND?
--  Confronto i primi 15 livelli. Il frontend usa utils/levelUtils.ts.
--  Se tornano diversi da 0,0 / 30,90 / 90,180 ... la copia e' sbagliata.
--  =============================================================================

WITH curva(livello, min_xp) AS (
  VALUES (1,0),(2,30),(3,90),(4,180),(5,300),(6,450),(7,630),(8,840),(9,1080),
         (10,1350),(11,1650),(12,2080),(13,2540),(14,3030),(15,3550)
)
SELECT c.livello, c.min_xp AS atteso_dal_frontend,
       public.calculate_user_level(c.min_xp) AS restituito_dal_server,
       public.calculate_user_level(c.min_xp) - c.min_xp AS scarto
FROM curva c
ORDER BY c.livello;

--  ATTESI: restituito_dal_server = livello, scarto = 0 su tutte le 15 righe.
--  Se scarto e' diverso da 0, il server ha una curva diversa dal client:
--  e' esattamente il difetto che questa funzione doveva eliminare.


-- =============================================================================
--  DOPO: se D1 dice 'extensions', il proximity gate NON funziona ancora.
--  Non chiudere il blocco B1 prima di aver risolto D1 e fatto un check-in vero.
-- =============================================================================
