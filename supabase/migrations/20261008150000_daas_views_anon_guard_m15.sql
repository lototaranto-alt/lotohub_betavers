-- ============================================================================
-- M15 - famiglia DaaS: gate di accesso (anon) sulle 5 viste
-- Data: 08/10/2026
-- Severita': ALTA
-- ============================================================================
-- Stato misurato (precheck 22, 08/10):
--   le 5 viste hanno il guard interno `is_loto_admin()` e NESSUN accesso ad
--   `anon` (anon_select=false su tutte; auth/service_role=true). Corrispondono
--   alla fonte hardened `20260925120000_admin_dashboard_hardening.sql`
--   (righe 116/244/269/330/379: GRANT SELECT TO authenticated, service_role).
--
-- Perche' questa migration (gate, non fix): le script non collaudate
--   migration_v22_daas_vendite.sql / migration_v23_prestige_card_metrics.sql
--   sono rieseguibili (DROP VIEW + CREATE + GRANT) e concedono SELECT ad
--   `anon` su 4 viste (heatmap/esg/attendance/dashboard) -> un loro re-run
--   riaprirebbe `anon`. v24 (telemetry) gia' non concede ad anon.
--   Questa migration e' il gate canonico: riasserisce lo stato sicuro ed e'
--   IDEMPOTENTE (no-op sul cloud attuale), quindi eseguibile in sicurezza
--   anche dopo un eventuale re-run. Il codice non risolve il "chi lancia v22":
--   quello e' un controllo di processo registrato in CB-09.
--
-- Cosa fa (per ognuna delle 5 viste):
--   1. REVOKE ALL FROM anon    (nessun accesso anonimo)
--   2. REVOKE ALL FROM PUBLIC  (difesa: nessun grant di default)
--   3. GRANT SELECT TO authenticated, service_role (stato hardened)
--   NESSUN DROP/CREATE: la definizione delle viste (e il guard) NON e' toccata.
--
-- Limiti:
--   - il guard `is_loto_admin()` resta il single point of failure (SPOF):
--     baseline catturata dal precheck 23 (SECURITY DEFINER, search_path=public,
--     EXECUTE solo a authenticated+service_role, admin_role IN ('admin','analyst')).
--     Piano/contingenza in PIANO M15.
--   - la definizione delle viste non viene modificata qui (M15 verifica, non
--     riscrive).
--
-- DOPO l'apply: eseguire diagnostica_fase1/24_m15_post_apply_verifica.sql
-- (atteso: anon=false su tutte e 5; guard presente su tutte e 5).
--
-- ROLLBACK: nessuna modifica di definizione; per riaprire (sconsigliato)
--   GRANT SELECT ON public.<vista> TO anon.
-- ============================================================================

DO $gate$
DECLARE
  v_vista text;
  v_viste text[] := ARRAY[
    'vw_daas_esg_monthly',
    'vw_daas_event_attendance',
    'vw_daas_heatmap_15min',
    'vw_dev_telemetry_daily',
    'vw_user_dashboard_metrics'
  ];
BEGIN
  FOREACH v_vista IN ARRAY v_viste LOOP
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', v_vista);
    EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC', v_vista);
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated, service_role', v_vista);
  END LOOP;
END;
$gate$;
