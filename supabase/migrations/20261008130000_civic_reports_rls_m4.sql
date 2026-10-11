-- ============================================================================
-- M4 - RLS civic_reports (Fase 1)
-- Data: 08/10/2026
-- Severita': BLOCCANTE - la tabella e' aperta al mondo
-- ============================================================================
-- Difetto misurato (precheck 16 + 17, 08/10):
--   RLS attiva ma UNA sola policy: "Civic access", cmd = ALL,
--   roles = {public}, qual = true, with_check = true
--   -> anon e authenticated leggono, scrivono e CANCELLANO ogni riga
--      di civic_reports. Grant di tabella tutti true (16).
--   Tabella oggi vuota (righe_totali = 0): il danno non si e' ancora
--   manifestato, ma il vettore e' aperto.
--
-- Cosa fa questa migration (ogni passo e' idempotente, rieseguibile):
--   1. ENABLE ROW LEVEL SECURITY su civic_reports (no-op se gia' attiva)
--   2. DROP dinamico di TUTTE le policy su civic_reports
--      (misurata 1 sola, ma il loop copre eventuali doppioni non censite;
--      essendo tutte ricreate sotto, la riesecuzione resta pulita)
--   3. SELECT = D4/R3, decisa 08/10 e registrata come P-D8:
--      l'autore legge i propri report, tutti leggono i confermati
--   4. INSERT = solo la propria riga (auth.uid() = user_id)
--   5. UPDATE = solo i propri report non confermati
--   6. NESSUNA policy DELETE -> RLS nega il DELETE a tutti
--
-- TO authenticated (scelta registrata): l'app non esegue mai query senza
-- sessione (`app/_layout.tsx:66` fa signInAnonymously all'avvio -> tutti i
-- client arrivano con JWT e ruolo `authenticated`). Il ruolo `anon` mantiene
-- i grant di tabella ma non ha policy -> RLS nega tutto.
--
-- Correzione registrata (METODO 7.1): il piano parlava di UPDATE con
-- status = 'pending_match'; il valore che il client scrive e' 'pending'
-- (CivicReportSheet.tsx:50) e su status non esiste nessun CHECK (misurato
-- con 16). Si usa status IN ('pending', 'pending_match') che copre entrambi
-- i valori.
--
-- Confronto tipi (precheck 19, 08/10): user_id = uuid NULLABILE ->
-- auth.uid() = user_id e' un confronto diretto, nessun cast.
-- tenant_id/status/grid_cell: tutti nullable, nessuna guardia sulle righe.
--
-- GATE prima di applyare - TUTTI ESEGUITI E VERDI l'08/10:
--   16 -> RLS on, 1 policy (Civic access ALL), grants auth/anon tutti true,
--         righe_totali = 0, colonna reale grid_cell, nessun CHECK su status
--   17 -> definizione esatta della policy da droppare (backup M3, usata
--         nel ROLLBACK qui sotto)
--   19 -> user_id uuid, tutte le colonne chiave nullable
--   D4/R3 = P-D8 decisa 08/10
--
-- DOPO l'apply: eseguire diagnostica_fase1/18_m4_post_apply_verifica.sql
-- (valori attesi nel commento dello script).
--
-- IMPATTI CLIENT noti (registrati, non sorpresi):
--   - Nessun client fa UPDATE su civic_reports (grep 08/10) -> nessun
--     impatto sul ramo UPDATE
--   - SELECT dei client (community.tsx:105 head-count, CivicDashboard:99):
--     ora vedono solo confermati + propri; tabella vuota -> impatto 0
--   - INSERT CivicReportSheet: dopo M4 passa solo con userId = auth.uid;
--     oggi community.tsx:292 passa userId='' -> gia' rotto prima di M4
--     (CB-17, Fase 2)
--   - INSERT CivicDashboard: rotto per la colonna grid_cell_50m inesistente
--     (CB-17, Fase 2) -> nessun impatto aggiuntivo da M4
--   - anon: da ACCESSO TOTALI a nessun accesso (nessuna policy anon) e'
--     proprio l'obiettivo; l'app anonimo autenticato resta authenticated
--
-- ROLLBACK (definizione esatta dal censimento 17):
--   DROP POLICY "civic_reports_select_own_or_confirmed",
--               "civic_reports_insert_own",
--               "civic_reports_update_own_pending" ON public.civic_reports;
--   CREATE POLICY "Civic access" ON public.civic_reports
--     FOR ALL TO public USING (true) WITH CHECK (true);
--   (RLS resta attiva in entrambi i casi)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. RLS attiva
-- ---------------------------------------------------------------------------
ALTER TABLE public.civic_reports ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 2. Drop dinamico di tutte le policy su civic_reports
--    (misurata: "Civic access" ALL/public/true; il loop copre di piu')
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
      FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename  = 'civic_reports'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.civic_reports', pol.policyname);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 3. SELECT = R3 (P-D8, decisa 08/10): autore + confermati
-- ---------------------------------------------------------------------------
CREATE POLICY "civic_reports_select_own_or_confirmed"
  ON public.civic_reports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR status = 'confirmed');

-- ---------------------------------------------------------------------------
-- 4. INSERT = solo la propria riga
-- ---------------------------------------------------------------------------
CREATE POLICY "civic_reports_insert_own"
  ON public.civic_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 5. UPDATE = solo i propri report non confermati.
--    WITH CHECK = USING: la riga risultante deve restare in pending ->
--    l'autore non puo' portare status a 'confirmed' (self-conferma chiusa
--    anche via UPDATE; nessun client UPDATE esiste oggi, grep 08/10)
-- ---------------------------------------------------------------------------
CREATE POLICY "civic_reports_update_own_pending"
  ON public.civic_reports
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status IN ('pending', 'pending_match'))
  WITH CHECK (auth.uid() = user_id AND status IN ('pending', 'pending_match'));

-- ---------------------------------------------------------------------------
-- 6. Nessuna policy DELETE: con RLS attiva e nessuna policy DELETE,
--    il DELETE e' negato a tutti (grant tabellari invariati: il piano non
--    prevede variazioni di grant; RLS fa da filtro)
-- ---------------------------------------------------------------------------
