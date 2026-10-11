-- =============================================================================
--  L.O.T.O. Map - M16: `events` — policy SELECT pubblica (fog of war / eventi)
-- =============================================================================
--  tipo: migration policy (Fase 1)
--  data: 09/10/2026
--
--  Decisioni (09/10):
--    - SELECT pubblica su `events`, `USING (true)`: visualizzazione aperta a
--      tutti senza login (confermata dall'utente). E' la stessa intenzione
--      della storica "Tutti possono vedere gli eventi" (migration_v6/...).
--    - Nessuna policy INSERT/UPDATE/DELETE: 0 scritture client su `events`
--      (grep 09/10); grant DML restano NO.
--    - Il precheck 38 ha mostrato che anon/authenticated non hanno NESSUN
--      grant in SELECT: POLICY + GRANT servono entrambi.
--    - Le policy si SOSTITUISCONO (DROP esplicito prima del CREATE).
--
--  Prima: diagnostica_fase1/38 (eseguito: rls=true, 0 policy, grant NO).
--  Dopo : diagnostica_fase1/39_m16_events_post_apply.sql
-- =============================================================================

BEGIN;

GRANT SELECT ON public.events TO anon, authenticated;

DROP POLICY IF EXISTS "events_read_public" ON public.events;
CREATE POLICY "events_read_public"
  ON public.events FOR SELECT
  USING (true);

COMMIT;