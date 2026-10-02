-- =============================================================================
-- DIAGNOSTICA STRUTTURA COMPLETA - un unico file, un unico output
-- =============================================================================
-- PERCHE' ESISTE.
--   Il cloud ha 25 tabelle, le migration del repo ne creano 4. Ventuno tabelle
--   non sono riproducibili dal repository: non c'è un CREATE TABLE che le
--   descriva. Questo file misura il cloud reale, per intero, in modo che la
--   struttura finale venga definita da una misura e non da un'ipotesi.
--
--   Le 63 query cloud già presenti in docs_v2 restano snapshot e rispondono a
--   domande singole. Questo file risponde a una domanda sola: com'è fatto il
--   database, davvero, adesso.
--
-- COME SI USA.
--   1. Incolla tutto in un colpo solo nel SQL Editor.
--   2. Non fermerti a un errore: qualche sezione può non applicarsi se manca
--      un'estensione. Quelle sezioni restituiscono zero righe, non un errore.
--   3. Riporta l'output INTEGRALE, anche se sembra tanto. Il formato di ogni
--      sezione è già leggibile: una riga per oggetto.
--
-- COSA NON FA, E NON DEVE MAI FARE.
--   Non legge dati utente. M11 conta le righe di auth.users e non ne seleziona
--   una sola: nessuna email, nessun UUID, nessun timestamp di attività esce
--   da questo file. Zero-PII vale anche per la diagnostica.
--
--   Tutte le query sono in sola lettura. Nessuna scrive, nessuna crea, nessuna
--   blocca. Si può eseguire in produzione senza fermare l'app.
-- =============================================================================


-- =============================================================================
-- M0 - Contesto: versione, estensioni, ruoli
-- =============================================================================
SELECT 'M0-contesto' AS sezione,
       current_setting('server_version')      AS postgres,
       current_database()                    AS database,
       (SELECT rolsuper FROM pg_roles WHERE rolname = current_user) AS sei_superuser;

SELECT 'M0-estensioni' AS sezione, extname, extversion
  FROM pg_extension
 ORDER BY extname;

SELECT 'M0-ruoli' AS sezione, rolname, rolsuper, rolbypassrls
  FROM pg_roles
 WHERE rolname IN ('anon','authenticated','service_role','authenticator','postgres','supabase_admin')
 ORDER BY rolname;


-- =============================================================================
-- M1 - Le tabelle: quante sono, RLS attivo?, quante righe hanno
--     Il confronto decisivo: 25 righe qui, 4 CREATE TABLE nel repo.
--     reltuples è una stima del planner, non un COUNT: su tabelle grandi il
--     COUNT blocca e questa diagnostica deve girare in produzione.
-- =============================================================================
SELECT 'M1-tabelle' AS sezione,
       c.relname                                   AS tabella,
       c.relrowsecurity                            AS rls_attivo,
       c.relforcerowsecurity                       AS rls_forzato,
       COALESCE(s.n_live_tup, 0)                   AS righe_stimate,
       pg_size_pretty(pg_total_relation_size(c.oid)) AS dimensione,
       obj_description(c.oid, 'pg_class')          AS commento
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  LEFT JOIN pg_stat_user_tables s ON s.relid = c.oid
 WHERE n.nspname = 'public'
   AND c.relkind IN ('r','p')
 ORDER BY c.relname;


-- =============================================================================
-- M2 - Le colonne di ogni tabella, compattate in una riga per tabella
--     Una riga per tabella invece di una per colonna: 25 tabelle restano
--     leggibili invece di diventare 300 righe da confrontare a mano.
--     Il formato del campo 'schema' è nome:tipo, in ordine di definizione.
-- =============================================================================
SELECT 'M2-schema' AS sezione,
       c.table_name AS tabella,
       string_agg(
         c.column_name || ' ' || c.data_type ||
         CASE WHEN c.is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
         CASE WHEN c.column_default IS NOT NULL THEN ' DEFAULT ' || c.column_default ELSE '' END,
         ' | ' ORDER BY c.ordinal_position
       ) AS schema
  FROM information_schema.columns c
  JOIN information_schema.tables t
    ON t.table_schema = c.table_schema AND t.table_name = c.table_name
 WHERE c.table_schema = 'public'
   AND t.table_type = 'BASE TABLE'
 GROUP BY c.table_name
 ORDER BY c.table_name;


-- =============================================================================
-- M3 - Le chiavi esterne
--     Una colonna nullable senza REFERENCES (impact_transactions.profile_id) e'
--     il tipo di dettaglio che fa fallire una INSERT silenziosamente.
-- =============================================================================
SELECT 'M3-fk' AS sezione,
       con.conname        AS vincolo,
       src.relname        AS tabella,
       pg_get_constraintdef(con.oid) AS definizione
  FROM pg_constraint con
  JOIN pg_class src ON src.oid = con.conrelid
  JOIN pg_namespace n ON n.oid = src.relnamespace
 WHERE con.contype = 'f'
   AND n.nspname = 'public'
 ORDER BY src.relname, con.conname;


-- =============================================================================
-- M4 - Gli indici
--     Un indice su (profile_id, poi_id) mancante spiega un check-in lento.
-- =============================================================================
SELECT 'M4-indici' AS sezione,
       t.relname AS tabella,
       i.relname AS indice,
       pg_get_indexdef(x.indexrelid) AS definizione
  FROM pg_index x
  JOIN pg_class i ON i.oid = x.indexrelid
  JOIN pg_class t ON t.oid = x.indrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
 WHERE n.nspname = 'public'
 ORDER BY t.relname, i.relname;


-- =============================================================================
-- M5 - Le funzioni: firma, ritorno, sicurezza, search_path, privilegi
--     La sezione che decide la sicurezza. has_function_privilege è la verita':
--     confrontarla con pg_proc racconta cosa si INTENDEva, questa dice cosa si
--     PUO' fare davvero.
--     Nota attesa: scan_poi_gps eseguibile da authenticated, process_esg_impact
--     solo da service_role. Se process_esg_impact risulta eseguibile da
--     authenticated o anon, il revoke non e' passato.
-- =============================================================================
SELECT 'M5-funzioni' AS sezione,
       p.proname                                          AS funzione,
       pg_get_function_identity_arguments(p.oid)          AS argomenti,
       pg_get_function_result(p.oid)                      AS ritorna,
       p.prosecdef                                        AS security_definer,
       COALESCE(array_to_string(p.proconfig, ','), '(nessuno)') AS search_path,
       has_function_privilege('anon',         p.oid, 'EXECUTE') AS da_anon,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS da_utente,
       has_function_privilege('service_role',  p.oid, 'EXECUTE') AS da_service
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
 ORDER BY p.proname, argomenti;


-- =============================================================================
-- M6 - Le viste
-- =============================================================================
SELECT 'M6-viste' AS sezione,
       c.relname AS vista,
       pg_get_viewdef(c.oid, true) AS definizione
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = 'public'
   AND c.relkind = 'v'
 ORDER BY c.relname;


-- =============================================================================
-- M7 - I trigger
--     updated_at automatico, soft delete, mantenimento del contatore: senza
--     trigger molti comportamenti attesi dal frontend semplicemente non esistono.
-- =============================================================================
SELECT 'M7-trigger' AS sezione,
       t.tgname AS trigger,
       c.relname AS tabella,
       pg_get_triggerdef(t.oid) AS definizione
  FROM pg_trigger t
  JOIN pg_class c ON c.oid = t.tgrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = 'public'
   AND NOT t.tgisinternal
 ORDER BY c.relname, t.tgname;


-- =============================================================================
-- M8 - Le policy RLS, una per riga
--     Una tabella con RLS attivo e zero policy e' un muro: nessun errore, solo
--     zero righe restituite per sempre. E' il fallimento piu' silenzioso che
--     esista, e spiega un'app che "non carica niente" senza nessun log.
-- =============================================================================
SELECT 'M8-policy' AS sezione,
       c.relname AS tabella,
       pol.polname AS policy,
       pol.polcmd  AS comando,
       CASE pol.polcmd WHEN 'r' THEN 'SELECT' WHEN 'a' THEN 'INSERT'
                       WHEN 'w' THEN 'UPDATE' WHEN 'd' THEN 'DELETE'
                       ELSE pol.polcmd::text END AS operazione,
       (SELECT string_agg(r.rolname, ',')
          FROM unnest(pol.polroles) AS rid
          JOIN pg_roles r ON r.oid = rid) AS ruoli,
       pg_get_expr(pol.polqual, pol.polrelid)     AS usando,
       pg_get_expr(pol.polwithcheck, pol.polrelid) AS verifica
  FROM pg_policy pol
  JOIN pg_class c ON c.oid = pol.polrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = 'public'
 ORDER BY c.relname, pol.polname;


-- =============================================================================
-- M9 - I tipi enum e i domini
-- =============================================================================
SELECT 'M9-tipi' AS sezione, t.typname AS tipo, t.typtype AS categoria,
       (SELECT string_agg(e.enumlabel, ' | ' ORDER BY e.enumsortorder)
          FROM pg_enum e WHERE e.enumtypid = t.oid) AS valori
  FROM pg_type t
  JOIN pg_namespace n ON n.oid = t.typnamespace
 WHERE n.nspname = 'public'
   AND t.typtype IN ('e','d')
 ORDER BY t.typname;


-- =============================================================================
-- M10 - Confronto diretto: cosa il repo sa fare, e cosa il cloud sa fare
--      Le due colonne affiancate sono la domanda A3-T14b in una riga per oggetto.
--      'solo_cloud' = esiste lì e il repo non la riproduce: da esportare.
--      'solo_repo'  = il repo la crea e il cloud non ce l'ha: da capire se è
--                    stata persa o se la versione cloud ha un altro nome.
-- =============================================================================
WITH cloud AS (
  SELECT c.relname AS nome, 'tabella' AS tipo
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public' AND c.relkind IN ('r','p')
  UNION ALL
  SELECT p.proname, 'funzione'
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public'
),
repo AS (
  -- Le definizioni che il repo sa riprodurre: lette dalle CREATE TABLE e
  -- CREATE FUNCTION dei file che compongono la catena ufficiale.
  -- Nomi in elenco, non parsing: sono le tabelle che le migration del repo
  -- creano davvero, misurate il 30/09. Se ne aggiunge una, si aggiunge qui.
  SELECT * FROM (VALUES
    ('profiles','tabella'),
    ('impact_transactions','tabella'),
    ('pois','tabella'),
    ('badges','tabella'),
    ('user_badges','tabella'),
    ('user_pois','tabella'),
    ('tenants','tabella'),
    ('media_content','tabella'),
    ('whispers','tabella'),
    ('events','tabella'),
    ('admin_users','tabella'),
    ('scan_poi_gps','funzione'),
    ('process_esg_impact','funzione'),
    ('sblocca_media','funzione'),
    ('get_poi_vetrina','funzione'),
    ('calculate_user_level','funzione')
  ) AS v(nome, tipo)
)
SELECT 'M10-confronto' AS sezione,
       COALESCE(cl.nome, r.nome) AS oggetto,
       COALESCE(cl.tipo, r.tipo) AS tipo,
       CASE WHEN r.nome IS NULL THEN 'solo_cloud'
            WHEN cl.nome IS NULL THEN 'solo_repo'
            ELSE 'in_entrambi' END AS stato
  FROM cloud cl
  FULL OUTER JOIN repo r ON r.nome = cl.nome AND r.tipo = cl.tipo
 ORDER BY stato, oggetto;


-- =============================================================================
-- M11 - Contatori, senza leggere un dato utente
--      Nessuna SELECT * su auth.users: il numero di righe e nient'altro.
--      Zero-PII vale anche per la diagnostica, e un conteggio basta a distinguere
--      un ambiente vuoto da uno popolato.
--      Se una delle quattro tabelle non esistesse, M11 resterebbe l'unica
--      sezione a fallire: M1 e M12 la mostrerebbero comunque come assente.
-- =============================================================================
SELECT 'M11-contatori' AS sezione,
       (SELECT count(*) FROM auth.users)                 AS utenti_auth,
       (SELECT count(*) FROM public.profiles)            AS profili,
       (SELECT count(*) FROM public.impact_transactions) AS transazioni_ledger,
       (SELECT count(*) FROM public.user_pois)           AS checkin_user_pois;


-- =============================================================================
-- M12 - Le tabelle con RLS attivo e zero policy
--      La tabella M1 dice se RLS è acceso; questa dice se qualcuno può comunque
--      passare. Un tavolo con RLS e nessuna policy restituisce zero righe per
--      sempre, senza un solo messaggio di errore: è il modo più silenzioso in
--      cui un'app muore.
--      Se questa sezione restituisce righe, sono i primi bug da correggere e
--      vanno prima di qualunque altra cosa.
-- =============================================================================
SELECT 'M12-rls-senza-policy' AS sezione,
       c.relname AS tabella_bloccata,
       pg_size_pretty(pg_total_relation_size(c.oid)) AS dimensione
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = 'public'
   AND c.relkind IN ('r','p')
   AND c.relrowsecurity
   AND NOT EXISTS (
     SELECT 1 FROM pg_policy pol WHERE pol.polrelid = c.oid
   )
 ORDER BY c.relname;


-- =============================================================================
-- FINE - 13 sezioni: M0 contesto, M1 tabelle, M2 schema, M3 fk, M4 indici,
--                    M5 funzioni, M6 viste, M7 trigger, M8 policy, M9 tipi,
--                    M10 confronto, M11 contatori, M12 muri RLS.
-- =============================================================================