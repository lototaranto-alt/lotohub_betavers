-- ============================================================================
-- FASE 0 - MISURA 4a - DIMENSIONE E SENTINELLE DI scan_poi_gps
-- ============================================================================
-- Sola lettura. Un solo result set, una riga.
--
-- Perche' esiste: il corpo di scan_poi_gps contiene velicita', shadowban e
-- calcolo ESG, e incollarlo intero ha crashato la finestra. Prima di
-- rileggerlo si misura quanto pesa e quali sentinelle contiene.
--
-- Nota sul dossier (06/10): la misura 4, il corpo, e' stata gia' letta e
-- confrontata riga per riga con
-- supabase/migrations/20260929160000_restore_proximity_gate.sql -> DRIFT
-- ESCLUSO. Questo script resta come misura economica e rileggibile: non serve
-- piu' per decidere quante fette fare, ma resta la prova riproducibile del
-- contenuto senza dover reincollare il corpo.
--
-- Colonne e perche' ciascuna esiste:
--   caratteri        dimensione: decidesse ancora quante fette servono
--   search_path      da `proconfig`, NON da `prosrc`: `SET search_path` non
--                    e' nel corpo, e' un'opzione della funzione. Un LIKE su
--                    prosrc torna SEMPRE false (errore del 06/10, correzione
--                    18). ASSENTE = vettore SECURITY DEFINER da incapsulare.
--                    La fonte resta la misura A: `public, pg_temp`.
--   ha_gate_prossimita  il controllo ST_Distance e' ancora nel corpo?
--   init_velocita_zero  `v_speed_kmh DOUBLE PRECISION := 0` -> il ramo 9999
--                    e' morto e il cold start cade nell'ELSE con ricompensa
--                    piena. E' il bug della misura 4.
--   ha_ramo_9999     la sentinella dichiarata nella migrazione esiste ancora?
--   n_9999           quante volte (1 = dichiarato e mai scritto)
--   n_filtri_shadow  volte che compare `is_shadowbanned IS NOT TRUE`:
--                    2 = escluso sia dal cooldown sia dallo storico, 1 = uno
--                    dei due, 0 = nessun filtro
--
-- La lettura si fa su pg_proc, non su un nome qualsiasi: nspname+proname e'
-- il binomio che identifica il corpo effettivamente deployato.
-- ============================================================================

SELECT
  p.proname                                                       AS funzione,
  length(p.prosrc)                                                AS caratteri,
  coalesce(array_to_string(p.proconfig, ', '), 'ASSENTE')        AS search_path,
  p.prosrc LIKE '%v_dist_poi_m > v_radius_m%'                     AS ha_gate_prossimita,
  p.prosrc ~* 'v_speed_kmh[[:space:]]+DOUBLE[[:space:]]+PRECISION[[:space:]]*:?=[[:space:]]*0'
                                                                  AS init_velocita_zero,
  p.prosrc LIKE '%9999%'                                          AS ha_ramo_9999,
  (length(p.prosrc)
   - length(replace(p.prosrc, '9999', ''))) / 4                  AS n_9999,
  (length(p.prosrc)
   - length(replace(p.prosrc, 'is_shadowbanned IS NOT TRUE', '')))
   / length('is_shadowbanned IS NOT TRUE')                        AS n_filtri_shadow
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'scan_poi_gps'
ORDER BY p.oid;
