-- =============================================================================
--  L.O.T.O. HUB - M10: la catena dei badge (R1: unificare su `badges`)
-- =============================================================================
--  tipo: migration schema + funzione server (Fase 1)
--  data: 09/10/2026
--
--  Decisioni (09/10):
--    - R1: la FK `user_badges.badge_id` passa da `badge_templates` (tabella
--      MORTA: 0 righe, misurata precheck 35) a `badges` (3 righe reali).
--      Nessuna migrazione di contenuto.
--    - Badge civici 1/5/10 di CivicDashboard: FUORI da M10 (restano costanti
--      client; eventuale persistenza = modulo separato).
--    - Le policy si SOSTITUISCONO, non si aggiungono (stessa regola di M4).
--    - L'assegnazione e' SERVER-SIDE: il client non decide piu'. Rimozione
--      contestuale di utils/badgeAssignment.ts.
--
--  Ordine (gate di coerenza): 1. FK -> 2. RLS/policy -> 3. funzione.
--
--  Prima: diagnostica_fase1/35 (precheck struttura) e 35b (RLS).
--  Dopo : diagnostica_fase1/36_m10_badges_post_apply.sql
--  Rollback: re-apply della FK verso badge_templates se si vuole tornare
--  (badges ad oggi 0 policy semplici), altrimenti ripristino da Git.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. FK: user_badges.badge_id -> badges(id). Nome vincolo reale misurato nel
--    precheck 35 ("user_badges_badge_id_fkey"). DROP esplicito, poi re-ADD.
-- ---------------------------------------------------------------------------
ALTER TABLE public.user_badges
  DROP CONSTRAINT IF EXISTS user_badges_badge_id_fkey;

ALTER TABLE public.user_badges
  ADD CONSTRAINT user_badges_badge_id_fkey
  FOREIGN KEY (badge_id) REFERENCES public.badges(id) ON DELETE CASCADE;

-- ---------------------------------------------------------------------------
-- 2. RLS (idempotente): abilita ovunque. badge_templates viene BLOCCATA
--    (abbandonata): RLS on + nessuna policy = tutto negato; tolti anche i grant
--    di anon/authenticated (difesa in profondita').
-- ---------------------------------------------------------------------------
ALTER TABLE public.badges         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badge_templates ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.badge_templates FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Policy. Su badges: SELECT pubblica (catalogo, come i POI). Su user_badges:
--    SELECT + INSERT solo sulla propria riga (auth.uid() = user_id), pattern M4.
--    Nessuna policy UPDATE/DELETE: nessun client le usa.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "badges_read_catalog" ON public.badges;
CREATE POLICY "badges_read_catalog"
  ON public.badges FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "user_badges_select_own" ON public.user_badges;
CREATE POLICY "user_badges_select_own"
  ON public.user_badges FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_badges_insert_own" ON public.user_badges;
CREATE POLICY "user_badges_insert_own"
  ON public.user_badges FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 4. Assegnazione server-side. Legge profiles.total_xp dal DB (il client non
--    decide), assegna ogni badge raggiunto non ancora posseduto (idempotente
--    grazie al UNIQUE (user_id,badge_id) misurato) e restituisce le righe
--    dell'utente. SECURITY DEFINER + search_path pinnato (pattern M5/M11).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_badges()
RETURNS SETOF public.user_badges
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_uid uuid;
    v_xp  integer;
BEGIN
    v_uid := auth.uid();
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Utente non autenticato';
    END IF;

    SELECT COALESCE(total_xp, 0) INTO v_xp
      FROM public.profiles
     WHERE id = v_uid;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Profilo non trovato';
    END IF;

    -- Incrementale e idempotente: tiene conto dei badge gia' posseduti.
    INSERT INTO public.user_badges (user_id, badge_id)
    SELECT v_uid, b.id
      FROM public.badges b
     WHERE b.req_xp IS NOT NULL
       AND v_xp >= b.req_xp
       AND NOT EXISTS (
           SELECT 1 FROM public.user_badges ub
           WHERE ub.user_id = v_uid AND ub.badge_id = b.id
       )
    ON CONFLICT (user_id, badge_id) DO NOTHING;

    RETURN QUERY
      SELECT ub.id, ub.user_id, ub.badge_id, ub.awarded_at
        FROM public.user_badges ub
       WHERE ub.user_id = v_uid
       ORDER BY ub.awarded_at;
END
$$;

-- Esecuzione: solo autenticati (anon: auth.uid() NULL -> lancia).
REVOKE ALL ON FUNCTION public.claim_badges() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_badges() TO authenticated;

COMMIT;