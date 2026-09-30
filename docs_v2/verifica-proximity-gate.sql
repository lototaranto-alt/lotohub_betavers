-- =============================================================================
--  VERIFICA DEL PROXIMITY GATE
--  Eseguire DOPO aver applicato 20260929160000_restore_proximity_gate.sql
--  Tutte le query sono di sola lettura. Nessuna scrive.
-- =============================================================================
--  COME USARE
--  1. Apri questo file e copi TUTTO.
--  2. Incolla in Supabase > SQL Editor.
--  3. Esegui la QUERY 1 (le altre due si eseguono una alla volta).
--  4. Confronta con "ATTESO" qui sotto.
-- =============================================================================


--  -----------------------------------------------------------------------------
--  QUERY 1 - Il gate e' dentro? (questa e' l'unica che conta)
--  -----------------------------------------------------------------------------

SELECT
  (prosrc LIKE '%v_dist_poi_m > v_radius_m%')       AS proximity_gate,
  (prosrc LIKE '%ST_Distance%')                      AS calcola_distanza,
  (prosrc LIKE '%SET search_path%')                 AS search_path_sicuro,
  (prosrc LIKE '%search_path = public, pg_temp%')   AS percorso_esatto,
  (prosecdef)                                        AS security_definer,
  length(prosrc)                                     AS caratteri
FROM pg_proc
WHERE proname = 'scan_poi_gps'
  AND pronamespace = 'public'::regnamespace;

--  ATTESO:
--    proximity_gate     = true   <-- IL GATE E' INSERITO. Questa e' la riga che conta.
--    calcola_distanza   = true
--    search_path_sicuro = true
--    percorso_esatto    = true
--    security_definer   = true
--    caratteri          > 8000   (la nuova funzione e' molto piu' grossa della vecchia)
--
--  NOTA: l'editor puo' mostrare true/false come t/f oppure 1/0. E' la stessa cosa.
--
--  SE ESCE UNA RIGA VUOTA
--    Significa che in public non esiste nessuna scan_poi_gps. Non e' un errore di
--    scrittura, e' una situazione diversa: fermati e riferiscila, non riapplicare.
--
--  SE "caratteri" E' PICCOLO (es. 1500)
--    Significa che la funzione VECCHIA e' ancora al suo posto e l'operazione non
--    e' entrata. Riapplica il file .sql della migration, una volta sola.
--
--  ATTENZIONE - trappola:
--    NON cercare la parola "haversine". Nel file non compare mai: la distanza e'
--    calcolata con ST_Distance di PostGIS, che e' piu' preciso di haversine perche'
--    tiene conto della curvatura del pianeta. Cercarla fa pensare che sia fallito.


--  -----------------------------------------------------------------------------
--  QUERY 2 - Quanto e' il raggio ammesso?
--  Legge il raggio dalla funzione viva, per capire se hai ereditato i 50 m.
--  Esegui SOLO dopo che la Query 1 ha risposto tutto true.
--  -----------------------------------------------------------------------------

SELECT
  substring(prosrc from 'v_default_radius_m[^\n]*')  AS raggio_di_default,
  substring(prosrc from 'checkin_radius[^\n]*')        AS legge_il_raggio_del_poi,
  substring(prosrc from 'v_dist_poi_m[^\n]*')          AS calcolo_distanza
FROM pg_proc
WHERE proname = 'scan_poi_gps'
  AND pronamespace = 'public'::regnamespace;

--  ATTESO:
--    raggio_di_default    contiene 50
--    legge_il_raggio_del_poi   contiene COALESCE   (il POI puo' avere un raggio suo)
--    calcolo_distanza     contiene ST_Distance


--  -----------------------------------------------------------------------------
--  QUERY 3 - Le colonne che la funzione TOCCA DAVVERO su user_pois
--  La versione precedente di questa query chiedeva 'coords' ed era SBAGLIATA:
--  coords non deve stare su user_pois, la funzione lo legge da pois (vedi Q4).
--  Qui si chiedono le colonne reali, fra cui lat e lng, che servono al
--  controllo anti-velocita'. Se mancano, la funzione va in errore a RUNTIME.
--  -----------------------------------------------------------------------------

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'user_pois'
  AND column_name IN ('profile_id', 'poi_id', 'visited_at',
                      'is_shadowbanned', 'lat', 'lng')
ORDER BY column_name;

--  ATTESO: 6 righe. In particolare devono esserci 'lat' e 'lng'.
--  Se 'lat' o 'lng' MANCANDO, la funzione creata va in errore al primo check-in.
--  In quel caso la prossima mossa e' applicare la patch di sotto, non testare.


--  -----------------------------------------------------------------------------
--  QUERY 4 - Le coordinate del POI, da cui dipende tutto il gate
--  Il gate calcola la distanza con ST_Distance(v_user_geog, v_poi_data.coords).
--  Se 'coords' non esiste su pois, il gate non puo' funzionare in nessun modo.
--  Questa e' la dipendenza singola piu' importante di tutta la funzione.
--  -----------------------------------------------------------------------------

SELECT
  EXISTS (SELECT 1 FROM information_schema.columns
          WHERE table_schema='public' AND table_name='pois'
            AND column_name='coords')  AS pois_ha_coords,
  EXISTS (SELECT 1 FROM pg_extension
          WHERE extname = 'postgis')    AS postgis_installato;

--  ATTESO: entrambe true.
--  postgis_installato = false spiegherebbe perche' la funzione non puo' girare
--  con ST_Distance, e va segnalato subito.


--  -----------------------------------------------------------------------------
--  PATCH - solo se la Query 3 mostra che 'lat' o 'lng' mancano
--  Non eseguire questa sezione se la Query 3 ha risposto 6 righe.
--  Aggiunge le due colonne e NON tocca nessun dato gia' scritto.
--  Nota: la colonna 26/09 le creava, ma se quella migration non e' mai stata
--  applicata al cloud non esistono. E' esattamente il caso che questa patch copre.
--  -----------------------------------------------------------------------------

--  ALTER TABLE public.user_pois
--      ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION,
--      ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
--
--  SELECT column_name FROM information_schema.columns
--  WHERE table_name='user_pois' AND column_name IN ('lat','lng');
--  -- atteso: 2 righe, lat e lng


-- =============================================================================
--  DOPO LA VERIFICA - Il test vero, sul telefono.
--  Query 1 tutta true e' il gate installato. Ma "installato" non vuol dire
--  "provato". Serve che succeda, in mano, questo:
--
--  A) CHECK-IN VICINO - stai fisicamente dentro il raggio di un POI
--     Deve riuscire. Se fallisce, il gate e' troppo stretto o le coordinate
--     non arrivano.
--
--  B) CHECK-IN LONTANO - simula una posizione a 50 km dal POI
--     Deve essere RESPINTO. E' il caso che non esisteva prima di oggi.
--
--  C) LA RIGA NON SI SCRIVE - il test piu' importante dei tre
--     Conta le righe in user_pois PRIMA del test B, poi di nuovo DOPO.
--     Se il numero e' identico, il gate ha respinto senza scrivere niente.
--     Se e' aumentato di uno, il gate ha lasciato passare la posizione falsa
--     e l'abbiamo scritta nella heatmap che si vende alla PA.
--
--  Per A e B servono due POI: uno dove sei davvero, uno lontano. Se il tenant
--  non ha un POI abbastanza vicino, A e C aspettano. B puo' farlo subito.
-- =============================================================================
