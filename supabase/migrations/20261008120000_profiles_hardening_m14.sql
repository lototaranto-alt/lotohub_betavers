-- ============================================================================
-- M14 - HARDENING profiles (Fase 1)
-- Data: 08/10/2026
-- Severita': BLOCCANTE - primo modulo della Fase 1
-- ============================================================================
-- Difetto misurato (STATO-FASE-0.md 7k, misura 07):
--   authenticated (e anon) ha UPDATE su profiles.admin_role e due policy
--   UPDATE duplicate con qual = (auth.uid() = id) e with_check assente ->
--   UPDATE profiles SET admin_role = 'admin' WHERE id = auth.uid()
--   -> is_loto_admin() = true -> si aprono TUTTE E 5 le viste DaaS.
--
-- Cosa fa questa migration (ogni passo e' idempotente, rieseguibile):
--   1. ENABLE ROW LEVEL SECURITY su profiles (no-op se gia' attiva)
--   2. DROP dinamico di TUTTE le policy SELECT e UPDATE su profiles
--      (i nomi reali non sono nel Git: cloud non riproducibile. Le policy
--      con RLS spenta sono inerti, quindi il drop non cambia nulla finche'
--      non si abilita - e dopo l'ENABLE diventano critiche: vanno via)
--   3. policy proprie: SELECT e UPDATE solo sulla propria riga
--   4. REVOKE della scrittura a livello di tabella + revoca puntuale della
--      colonna admin_role, poi re-GRANT SOLO delle 6 colonne che il client
--      aggiorna davvero (misurato il 08/10 su tutto il codice vivo):
--        nickname, is_premium, total_xp, pois_discovered, total_tokens,
--        expo_push_token
--   5. RPC count_profiles() SECURITY DEFINER per i due conteggi globali
--      (PlasticaqquaEventSheet.tsx:24, loto-admin-v2/(dashboard)/page.tsx:30)
--   6. UNIQUE su profiles.nickname, con guardia che FALLISCE la migration
--      se esistono duplicati (il precheck va fatto con
--      diagnostica_fase1/09_nickname_unici_precheck.sql)
--   7. CHECK del nickname (P-D7: convalida definitiva, 08/10): 3-20 char,
--      lettere/cifre/spazi, niente speciali. Stesso charset di
--      utils/nicknameValidation.ts. Con guardia sulle righe esistenti.
--
-- GATE prima di applyare - TUTTI ESEGUITI E VERDI il 08/10:
--   09  -> gruppi_duplicati = 0  (1 doppione "Save Ks" risolto con 09c;
--         verificato anche via REST: 0 gruppi)
--   09d -> n_violazioni = 0      (1 violazione "Fragolina <emoji>" risolta
--         con 09e; verificata via REST: 0 violazioni)
--   10  -> 11/11 funzioni tocca_profiles = SECURITY DEFINER, nessuna INVOKER
--         (CSV in diagnostica_fase1/; CB-14 chiusa, emergente CB-15)
--   11  -> rls_attivo = true, rls_forzato = false, n_policy = 6,
--         grant auth/anon SELECT+UPDATE tutti true (baseline registrato)
--
-- DOPO l'apply: eseguire diagnostica_fase1/12_m14_post_apply_verifica.sql
-- (valori attesi nel commento dello script).
--
-- IMPATTI CLIENT noti (registrati, non sorpresi):
--   - conteggio globale -> rimpiazzato da count_profiles() nello stesso giro
--   - TouristBaptismModal precheck nickname: con SELECT ristretta legge solo
--     la propria riga -> il precheck non puo' piu' scoprire i doppioni;
--     resta il codice errore 23505 gestito nel catch (stesso messaggio)
--   - ProfileModal salvaNickname: stesso trattamento 23505; in piu' la
--     modifica del nick e' BLOCCATA dopo il primo set (P-D7, decisa 08/10):
--     l'input appare solo se il nickname e' ancora NULL
--   - index.tsx recentUsers (nickname tenant, limit 3) -> ora vede solo se
--     stesso: impatto noto, da registrare (non bloccante, decorativo)
--
-- ROLLBACK:
--   DROP POLICY "profiles_select_own" / "profiles_update_own";
--   DROP FUNCTION public.count_profiles();
--   DROP INDEX / CONSTRAINT nickname univoco;
--   ripristinare i grant precedenti (RWUD per anon+authenticated su tutta
--   la tabella, misurati in Fase 0 1b/3b).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. RLS attiva
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 2. Drop dinamico di tutte le policy SELECT e UPDATE su profiles
--    (i nomi non sono noti: il cloud non e' riproducibile dalle migration)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
      FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename  = 'profiles'
       AND cmd IN ('SELECT', 'UPDATE', 'ALL')
  LOOP
    EXECUTE format('DROP POLICY %I ON public.profiles', pol.policyname);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 3. Policy proprie: si legge e si scrive solo la propria riga
--    (TO authenticated: anon non ha sessione, auth.uid() sara' NULL)
-- ---------------------------------------------------------------------------
CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- 4. Permessi di colonna: niente scrittura "a tabella piena",
--    admin_role revocato esplicitamente, riconcesse solo le 6 colonne
--    che il client aggiorna davvero.
--    REVOKE e' un no-op se il grant non c'e'; il doppio passaggio
--    (tabella + colonna) copre entrambe le forme di grant misurabili.
-- ---------------------------------------------------------------------------
REVOKE UPDATE ON public.profiles FROM anon, authenticated;
REVOKE UPDATE (admin_role) ON public.profiles FROM anon, authenticated;

GRANT UPDATE (nickname, is_premium, total_xp, pois_discovered, total_tokens, expo_push_token)
  ON public.profiles TO authenticated;

-- anon non aggiorna profili: nessun re-GRANT

-- ---------------------------------------------------------------------------
-- 5. count_profiles(): conteggio globale senza aprire la SELECT globale.
--    SECURITY DEFINER con proprietario = chi esegue la migration (postgres,
--    proprietario di profiles -> bypassa RLS). search_path pinnato.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.count_profiles()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT count(*) FROM public.profiles;
$$;

REVOKE ALL ON FUNCTION public.count_profiles() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.count_profiles() TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 6. UNIQUE(nickname) con guardia: se ci sono gia' duplicati la migration
--    fallisce subito, prima di creare il vincolo (nessun danno a metà).
--    NULL resta ripetibile (vincolo UNIQUE: piu' righe senza nickname ok).
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  n_duplicati bigint;
BEGIN
  SELECT count(*) INTO n_duplicati
    FROM (
      SELECT nickname
        FROM public.profiles
       WHERE nickname IS NOT NULL
       GROUP BY nickname
      HAVING count(*) > 1
    ) d;

  IF n_duplicati > 0 THEN
    RAISE EXCEPTION
      'M14 bloccata: % gruppi di nickname duplicati in profiles. Eseguire 09_nickname_unici_precheck.sql e risolvere prima.',
      n_duplicati;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conrelid = 'public.profiles'::regclass
       AND contype  = 'u'
       AND conname  = 'profiles_nickname_key'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_nickname_key UNIQUE (nickname);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 7. CHECK del nickname (P-D7, decisa 08/10): convalida definitiva del nick.
--    Stesso charset/lunghezza di utils/nicknameValidation.ts:
--      3-20 caratteri, lettere (anche accentate), cifre, spazi.
--    Guardia: un CHECK valida TUTTE le righe esistenti -> se anche solo una
--    viola, la migration fallisce qui (precheck: 09d_nickname_charset_precheck).
--    NULL passa (niente nickname = vincolo non violato).
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  n_violazioni bigint;
BEGIN
  SELECT count(*) INTO n_violazioni
    FROM public.profiles
   WHERE nickname IS NOT NULL
     AND NOT (nickname ~ '^[A-Za-z0-9 àèéìòùÀÈÉÌÒÙ]{3,20}$');

  IF n_violazioni > 0 THEN
    RAISE EXCEPTION
      'M14 bloccata: % nickname violano il CHECK charset. Eseguire 09d_nickname_charset_precheck.sql e risolvere prima.',
      n_violazioni;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conrelid = 'public.profiles'::regclass
       AND contype  = 'c'
       AND conname  = 'profiles_nickname_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_nickname_check
      CHECK (nickname ~ '^[A-Za-z0-9 àèéìòùÀÈÉÌÒÙ]{3,20}$');
  END IF;
END $$;
