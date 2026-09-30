-- =============================================================================
-- 20260930180000_process_esg_impact.sql
--
-- Riporta nella catena ufficiale una funzione che il client chiama a ogni
-- check-in e che esisteva solo in supabase/archive_scattered_sql/.
-- Vedi docs_v2/loto-hub-architettura-sistema-master-2026.md sezione 5.
--
-- LA FIRMA NELL'ARCHIVIO NON ACCETTA LA CHIAMATA DEL CLIENT.
-- L'archivio definiva:
--   process_esg_impact(p_co2, p_liters, p_tokens, p_xp, p_party_size,
--                      p_user_id, p_hash)
-- ma index.tsx la invocava così:
--   supabase.rpc('process_esg_impact', { user_id, p_co2, p_liters, p_tokens,
--                                        p_xp, p_takeaway, p_party_size })
-- Due incompatibilità, entrambe fatali:
--   1. il client manda `user_id`, la funzione dichiarava `p_user_id`
--   2. il client manda `p_takeaway`, che non esisteva nella firma
-- Postgres risolve gli argomenti per NOME: la chiamata non poteva risolversi.
-- Nessun errore applicativo, nessun allarme: solo "Impossibile completare la
-- scansione" all'utente (index.tsx:606).
--
-- Due correzioni rispetto all'archivio, non cosmetiche:
--
--   p_user_id -> auth.uid(). L'archivio accettava l'id di QUALSIASI utente:
--   un utente autenticato poteva accreditare XP, CO2 e token a un terzo
--   semplicemente passando un altro UUID. E' lo stesso difetto di
--   get_poi_vetrina, gia' corretto il 30/09, e per la stessa ragione.
--
--   p_party_size neutralizzato. Il client inviava il valore come
--   moltiplicatore degli importi, senza alcun tetto lato server: bastava
--   inviare 1000000 per amplificare CO2 e litri di un milione di volte.
--   Ora LEAST(GREATEST(p_party_size,1),1) restituisce sempre 1. Il valore
--   richiesto resta nel registro come party_size_reported.
--
--   search_path fissato. Vedere la nota su pg_temp nel migration 20260930120000.
--
-- Cosa NON e' risolto qui, e va detto perche' il file esiste:
--   gli importi p_co2, p_liters, p_tokens e p_xp arrivano ancora dal client
--   e non hanno tetto. Con questa funzione attiva, un client modificato puo'
--   chiamarla da solo, senza check-in, e accreditarsi a se stesso qualunque
--   cifra. Neutralizzare party_size chiude l'amplificatore, non la forgia.
--   La soluzione e' rendere questa funzione interna (REVOKE EXECUTE da
--   authenticated) e lasciare che scan_poi_gps, che calcola gli importi sul
--   server, sia l'unico ingresso pubblico. Vedi docs_v2/tooling/autorita.json,
--   dominio 'gate-prossimita-attivo'. Fino ad allora non e' chiuso.
--
-- SULLA TABELLA: impact_transactions non aveva un CREATE TABLE in nessuna
-- delle migration ufficiali, solo in due file d'archivio. Il repository non
-- riproduceva la tabella che il motore di impatto usa come registro. Creata
-- qui, con lo stesso nome e le stesse colonne che gli archivi usavano.
--
-- SUL DOPPIO CONTEGGIO: scan_poi_gps assegna gia' total_xp, total_co2 e
-- total_tokens (20260929160000 righe 274-276). Se in futuro il client
-- collegasse scan_poi_gps a questo percorso, ogni check-in conterebbe due
-- volte. Oggi non succede, e per un motivo preciso: scan_poi_gps non ha
-- chiamanti vivi (l'unico e' OfflineQueueManager.ts:140, dentro una coda che
-- gestisce solo UNLOCK_MEDIA). Non e' un motivo per dormirci sopra: e' il
-- primo pezzo a cadere se qualcuno riapre la coda. Vedi la nota in coda.
--
-- idempo'ente per definizione: nessuna UPDATE se l'utente non esiste,
-- nessuna riga se l'impatto e' tutto a zero.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Tabella registro. Append-only per scelta: nessun record di impatto
--    viene corretto, perche' i report DaaS si vendono come audit trail.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.impact_transactions (
  id            BIGSERIAL PRIMARY KEY,
  profile_id    UUID    NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receipt_hash  TEXT,
  co2_saved     NUMERIC NOT NULL DEFAULT 0,
  liters_saved  INTEGER NOT NULL DEFAULT 0,
  tokens_earned INTEGER NOT NULL DEFAULT 0,
  xp_earned     INTEGER NOT NULL DEFAULT 0,
  is_takeaway   BOOLEAN NOT NULL DEFAULT false,
  party_size_reported INTEGER NOT NULL DEFAULT 1,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.impact_transactions IS
  'Registro append-only degli impatti. Non e' correggibile: i report DaaS '
  'vengono venduti come audit trail certificato (CSRD, ISO 14083).';
COMMENT ON COLUMN public.impact_transactions.is_takeaway IS
  'Trasporto proprio o ristorazione. Accumulato perche'' il client lo invia, '
  'ma NON altera i saldi: stabilire se debba ridurli e'' una decisione di '
  'modello, non un dettaglio da indovinare in una migration.';
COMMENT ON COLUMN public.impact_transactions.party_size_reported IS
  'Valore di p_party_size come inviato dal client. Non moltiplica nulla: la '
  'funzione forza un tetto di 1 (vedi neutralizzazione del 30/09). Conservato '
  'solo perche'' se un domani i gruppi si puo'' misurare quanto il client '
  'chiedeva, senza doverlo ricostruire a posteriori.';

CREATE INDEX IF NOT EXISTS idx_impact_transactions_profile
  ON public.impact_transactions (profile_id, created_at DESC);

ALTER TABLE public.impact_transactions ENABLE ROW LEVEL SECURITY;

-- Lettura: l'utente vede il proprio registro, il backend gli report.
DROP POLICY IF EXISTS "Impact transactions readable by owner" ON public.impact_transactions;
CREATE POLICY "Impact transactions readable by owner"
  ON public.impact_transactions
  FOR SELECT
  USING (profile_id = auth.uid());

-- Nessuna INSERT diretta: passa da process_esg_impact, che e' SECURITY
-- DEFINER e quindi controlla l'identita'. Una INSERT pubblica sarebbe un
-- bypass completo del motore di impatto.

-- -----------------------------------------------------------------------------
-- 2. Funzione. Nomi dei parametri allineati a quelli che il client manda gia'
--    oggi, meno `user_id`: l'identita' arriva da auth.uid().
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.process_esg_impact(
  p_co2        NUMERIC  DEFAULT 0,
  p_liters     INTEGER  DEFAULT 0,
  p_tokens     INTEGER  DEFAULT 0,
  p_xp         INTEGER  DEFAULT 0,
  p_takeaway   BOOLEAN  DEFAULT false,
  p_party_size INTEGER  DEFAULT 1,
  p_hash       TEXT     DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user   UUID := auth.uid();
  v_co2    NUMERIC;
  v_liters INTEGER;
  v_tokens INTEGER;
  v_xp     INTEGER;
  v_size   INTEGER;
BEGIN
  IF v_user IS NULL THEN
    -- Nessun silenzio: un impatto senza identita' non si puo' attribuire.
    RAISE EXCEPTION 'process_esg_impact: nessuna identita'' in sessione'
      USING ERRCODE = '42501';
  END IF;

  -- NEUTRALIZZAZIONE DEL MOLTIPLICATORE, 30/09.
  -- Il client invia p_party_size, ma la feature "Gruppi a Tempo" non e'
  -- implementata: `party_size` non e' una colonna di profiles in nessuna
  -- migration, quindi il valore arriva gia' a 1. Il parametro resta pero' sul
  -- filo e un client modificato puo' inventarlo.
  -- LEAST(GREATEST(x, 1), 1) restituisce 1 per qualunque x, quindi il
  -- coefficiente e' morto per costruzione e non per convenzione.
  -- Il valore richiesto resta in impact_transactions.party_size_reported:
  -- se un domani i gruppi, si puo' misurare quanto il client chiedeva.
  v_size   := LEAST(GREATEST(COALESCE(p_party_size, 1), 1), 1);

  v_co2    := COALESCE(p_co2, 0)    * v_size;
  v_liters := COALESCE(p_liters, 0) * v_size;
  v_tokens := GREATEST(COALESCE(p_tokens, 0), 0);
  v_xp     := GREATEST(COALESCE(p_xp, 0), 0);

  IF v_co2 = 0 AND v_liters = 0 AND v_tokens = 0 AND v_xp = 0 THEN
    RETURN json_build_object('success', true, 'xp_earned', 0, 'skipped', true);
  END IF;

  -- Saldi sul profilo. L'archivio li aggiornava e va mantenuto: togliere
  -- l'UPDATE lascierebbe il ledger pieno e le soglie di livello ferme.
  UPDATE public.profiles
     SET total_co2         = COALESCE(total_co2, 0)         + v_co2,
         total_liters_water = COALESCE(total_liters_water, 0) + v_liters,
         total_tokens       = COALESCE(total_tokens, 0)       + v_tokens,
         total_xp           = COALESCE(total_xp, 0)           + v_xp
   WHERE id = v_user;

  IF NOT FOUND THEN
    -- Il profilo non esiste: nessun UPDATE, nessuna riga, nessun falso successo.
    RETURN json_build_object('success', false, 'error', 'profilo_inesistente');
  END IF;

  INSERT INTO public.impact_transactions
    (profile_id, receipt_hash, co2_saved, liters_saved, tokens_earned, xp_earned,
     is_takeaway, party_size_reported)
  VALUES
    (v_user, p_hash, v_co2, v_liters, v_tokens, v_xp,
     COALESCE(p_takeaway, false), p_party_size);

  RETURN json_build_object(
    'success',    true,
    'xp_earned',  v_xp,
    'co2_saved',  v_co2,
    'tokens',     v_tokens
  );
END;
$$;

REVOKE ALL ON FUNCTION public.process_esg_impact
  (NUMERIC, INTEGER, INTEGER, INTEGER, BOOLEAN, INTEGER, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_esg_impact
  (NUMERIC, INTEGER, INTEGER, INTEGER, BOOLEAN, INTEGER, TEXT) TO authenticated;

COMMIT;

-- =============================================================================
-- VERIFICA (leggere l'output, non desumere dal fatto che la migration e' passata)
-- =============================================================================
-- V1: la tabella esiste ed e' in sola lettura per l'utente
SELECT to_regclass('public.impact_transactions') AS tabella;
-- atteso: tabella = impact_transactions

-- V2: la funzione ha la firma che il client usa
SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS firma, p.prosecdef
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public' AND p.proname = 'process_esg_impact';
-- atteso: firma = p_co2 numeric, p_liters integer, p_tokens integer,
--          p_xp integer, p_takeaway boolean, p_party_size integer, p_hash text
--          prosecdef = true
-- NOTA: se appare anche una seconda riga con p_user_id, la versione d'archivio
--       e' ancora in vita e va rimossa a mano.

-- V3: il search_path e' fissato (pg_temp in coda, mai solo 'public')
SELECT prosecdef, proconfig
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public' AND p.proname = 'process_esg_impact';
-- atteso: proconfig contiene {search_path=public, pg_temp}

-- V4: nessuna policy permette INSERT diretto sulla tabella
SELECT policyname, cmd, qual, with_check
  FROM pg_policies
 WHERE schemaname = 'public' AND tablename = 'impact_transactions';
-- atteso: una sola policy, cmd = SELECT. Nessun INSERT.

-- V5: prova reale dal client. Controllare che il check-in non mostri piu'
--     "Impossibile completare la scansione" e che la riga finisca nel registro.
SELECT profile_id, co2_saved, liters_saved, tokens_earned, xp_earned, created_at
  FROM public.impact_transactions
 ORDER BY created_at DESC LIMIT 5;

-- V6: il moltiplicatore e' morto. Si prova dal SQL Editor con ruolo anonimo
--     o authenticated, non dalla shell con i privilegi del proprietario.
--     Con p_party_size = 999999 i saldi NON devono cambiare.
SELECT public.process_esg_impact(p_co2 => 1.0, p_liters => 1, p_tokens => 1,
                                 p_xp => 1, p_party_size => 999999);
-- atteso: il registro mostra co2_saved = 1.0 e liters_saved = 1.
--         party_size_reported = 999999, che e' esattamente il punto:
--         si vede cosa il client chiedeva e cosa e' stato concesso.
SELECT co2_saved, liters_saved, party_size_reported
  FROM public.impact_transactions ORDER BY created_at DESC LIMIT 1;

-- V7: la funzione non e' eseguibile da anon.
SELECT has_function_privilege('anon', 'public.process_esg_impact(numeric,integer,integer,integer,boolean,integer,text)', 'EXECUTE') AS anon_ha_execute;
-- atteso: anon_ha_execute = false
