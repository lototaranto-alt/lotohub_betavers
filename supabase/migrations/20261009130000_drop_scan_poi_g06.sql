-- ============================================================================
-- G-06 - Riparazione: drop di public.scan_poi (funzione morta)
-- Data: 09/10/2026
-- Severita': ALTA (rimozione della via ungated di check-in)
-- ============================================================================
-- Perche' si droppa (misurato il 09/10):
--   - precheck 28 + probe REST: public.scan_poi(uuid) e' DEPLOYED MA ROTTO.
--     Il corpo fa:
--         INSERT INTO public.user_pois (profile_id, poi_id, discovered_at) ...
--     ma `user_pois.discovered_at` NON esiste (probe REST -> 400/42703;
--     la colonna reale e' `visited_at`). Ogni chiamata autenticata solleva
--     "column discovered_at does not exist" e il client la cattura a
--     components/PoiDetailSheet.tsx:592.
--     => il percorso NFC/QR Partner NON ha mai potuto riuscire.
--   - La funzione e' anche UNGATED (nessun gate di prossimita', cooldown,
--     anti-speed, nessuna scrittura su impact_transactions) e il suo UPDATE
--     total_xp gira a OGNI chiamata (l'ON CONFLICT DO NOTHING non lo ferma):
--     farming latente se la colonna venisse "riparata" senza gate.
--   - Unico chiamante vivo: components/PoiDetailSheet.tsx:576, ora instradato
--     su `scan_poi_gps` (Riparazione G-06, stessa data). Nessun altro
--     riferimento vivo nel codice (verificato con grep) ne' oggetti DB
--     dipendenti (atteso: 0, misurato dal precheck 30).
--
-- Scelta registrata con l'utente (09/10): "Riparazione + drop del morto".
--   Il pulsante NFC/QR Partner resta (e' il TRIGGER); la convalida e'
--   sempre server-side in `scan_poi_gps` (coordinate + cooldown + anti-speed).
--   Droppare una funzione che non ha mai potuto riuscire non distrugge dati
--   ne' comportamento: rimuove solo l'esposizione (anon + corpo rotto).
--
-- Cosa fa questa migration:
--   DROP FUNCTION IF EXISTS public.scan_poi(uuid);
--   Nessun CASCADE: se per errore esistesse un dipendente, il DROP fallisce
--   invece di propagare la rimozione.
--
-- PRIMA dell'apply: eseguire diagnostica_fase1/30_drop_scan_poi_precheck.sql
--   (atteso: 1 riga, argomenti = p_poi_id uuid, oggetti_che_la_usano = 0).
-- DOPO l'apply: eseguire diagnostica_fase1/31_drop_scan_poi_post_apply.sql
--   (atteso: scan_poi_residue = 0, scan_poi_gps_presente = 1).
-- Verifica indipendente (agente, via REST anon): rpc('scan_poi', {p_poi_id})
--   -> atteso 404 / PGRST202 (funzione non trovata).
--
-- ROLLBACK (ripristino definizione misurata dal precheck 28 - backup M3):
--   eseguire il corpo salvato in
--   supabase/diagnostica_fase1/risultato 28_scan_poi.txt
--   (CREATE OR REPLACE FUNCTION public.scan_poi(p_poi_id uuid) RETURNS json
--    LANGUAGE plpgsql SECURITY DEFINER AS $function$ ... $function$).
--   Nota: il rollback ricrea una funzione rotta (discovered_at). Va usato solo
--   per ripristinare lo stato di fatto, non come fix.
-- ============================================================================

BEGIN;

DROP FUNCTION IF EXISTS public.scan_poi(uuid);

COMMIT;
