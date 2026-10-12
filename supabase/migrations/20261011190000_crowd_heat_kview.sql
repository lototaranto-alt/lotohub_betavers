-- =============================================================================
--  L.O.T.O. Map - Crowd/BLE: superficie di lettura aggregata k-anonima
-- =============================================================================
--  tipo: migration feature (Fase 1) - ponte "crowd -> heat"
--  data: 11/10/2026
--
--  Contesto (diagnosi 11/10, script 43):
--    - `crowd_predictions` ha RLS ON, 0 policy, 0 grant -> la tabella raw e'
--      CHIUSA e resta chiusa: nessun grant/policy aggiunto qui.
--    - L'ingresso del dato passa dalla RPC `process_crowd_radar`
--      (SECURITY DEFINER, M5+M11): identita' da auth.uid(), cap, doppia
--      convalida, `confidence_score` calcolata. Il client (utils/bleManager.ts)
--      e' stato riallineato a chiamare quella RPC invece dell'INSERT diretto.
--
--  Cosa fa questa migration (idempotente):
--    1. Crea la vista `vw_poi_crowd_now`: aggrega `crowd_predictions` su una
--       finestra di 60 minuti, per POI. Espone SOLO conteggi aggregati
--       (reporters distinti, devices, last_seen): nessun reporter_id, nessun MAC.
--    2. La vista non e' `security_invoker`: gira come owner (postgres) e quindi
--       legge oltre la RLS della tabella raw, senza concedere lettura diretta.
--       La tabella raw non viene toccata.
--
--  k-anonimato: `HAVING count(distinct reporter_id) >= 1` per il TEST pilota.
--    >>> DA ALZARE (proposta: >= 3) PRIMA della produzione. <<<
--
--  Perche' qui (bridge): la mappa fara' "fusione pesata" =
--    heat check-in (gia' presente, map.tsx) + boost crowd (da questa vista).
--
--  DOPO l'apply: diagnostica_fase1/44_crowd_ble_post_apply.sql
-- =============================================================================

BEGIN;

CREATE OR REPLACE VIEW public.vw_poi_crowd_now AS
SELECT
    cp.poi_id,
    count(DISTINCT cp.reporter_id) AS reporters,
    sum(cp.raw_count)              AS devices,
    max(cp.certified_count)        AS certified,
    max(cp.created_at)             AS last_seen
FROM public.crowd_predictions cp
WHERE cp.created_at > now() - interval '60 minutes'
GROUP BY cp.poi_id
HAVING count(DISTINCT cp.reporter_id) >= 1;

GRANT SELECT ON public.vw_poi_crowd_now TO authenticated, anon;

COMMIT;
