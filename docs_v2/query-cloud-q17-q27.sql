-- =============================================================================
--  SCRIPT BATCH - 7 domande aperte, una sola esecuzione
-- =============================================================================
--  Tutte le query sono di SOLA LETTURA. Nessuna scrive, nessuna modifica.
--  Copia TUTTO questo file ed eseguilo in Supabase > SQL Editor.
--
--  Copre: Q17, Q18, Q19, Q20, Q22, Q26, Q27
--  Non copre: Q4 e Q8, che sono state decise a voce il 30/09 e non hanno
--             bisogno di query.
--
--  NOTA SULLE LETTERE: le "Q" sono domande aperte registrate nei documenti.
--  Sono un'altra cosa rispetto alle query di diagnostica, che si chiamano "D".
--  Q17 = domanda 17. La query che la risolve e' la prima sotto.
-- =============================================================================


-- =============================================================================
--  Q17 - tenants.id: e' un UUID o un testo?
--  Perche' conta: index.tsx:286 filtra tenants.id con uno slug. Se la colonna
--  e' UUID, il filtro non matcha niente e la ricerca restituisce ZERO RIGHE
--  senza mostrare alcun errore. E' A7-T7.
-- =============================================================================

SELECT
  column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_schema='public' AND table_name='tenants' AND column_name='id'
UNION ALL
SELECT
  'righe_esempi', 'valori', string_agg(coalesce(id::text,'(null)'), ' | ')
FROM (SELECT id FROM public.tenants LIMIT 3) t;

--  LEGGI: se data_type = 'uuid' e gli esempi sono UUID, il filtro per slug di
--  index.tsx:286 non puo' funzionare. Se data_type = 'text' e gli esempi sono
--  slug, il codice ha ragione e il problema e' un altro.


-- =============================================================================
--  Q18 - Esiste una RPC get_distance in public?
--  Perche' conta: docs/logiche_proprietarie.md:10 la da' per esistente.
--  Se non esiste, la distanza e' calcolata solo lato client e il backend non
--  puo' validare niente: e' il cuore di Q24/A3-T12.
-- =============================================================================

SELECT
  count(*) FILTER (WHERE p.proname = 'get_distance') AS esiste_get_distance,
  count(*) FILTER (WHERE p.proname ILIKE '%distance%') AS qualsiasi_variante,
  string_agg(DISTINCT p.proname, ', ')                 AS nomi_trovati
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public';

--  LEGGI: esiste_get_distance = 0 e nomi_trovati vuoto significa che la
--  funzione NON esiste e la documentazione menteva. Qualsiasi altro valore va
--  letto con il nome accanto.


-- =============================================================================
--  Q19 - Esistono saveCoordinatesAtInstallation / getCoordinatesAtFirstScan?
--  Sono i nomi del Double GPS Handshake in docs/logiche_proprietarie.md:29-43
--  e non compaiono in nessun file del repository. Se non esistono nel cloud,
--  quel meccanismo e' documentato ma mai stato scritto. A1-T14.
-- =============================================================================

SELECT p.proname,
       n.nspname AS schema,
       pg_get_function_identity_arguments(p.oid) AS argomenti
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.proname ILIKE '%Coordinates%'
   OR p.proname ILIKE '%Installation%'
   OR p.proname ILIKE '%FirstScan%'
ORDER BY p.proname;

--  LEGGI: zero righe = il Double GPS Handshake non esiste. Non e' "da
--  implementare", e' "da scrivere da zero", se si vuole.


-- =============================================================================
--  Q20 - Quali sono i valori reali delle soglie 1/5/10 in award_civic_pti?
--  I numeri sono citati nei documenti ma la funzione sta nei 63 export.
--  Si legge il corpo e si isolano i confronti. A1-T15.
-- =============================================================================

SELECT prosrc
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.proname = 'award_civic_pti' AND n.nspname = 'public';

--  LEGGI: cerca i tre numeri dentro il testo. Confrontali con 1, 5 e 10.
--  Se i confronti sono altri, i numeri documentati sono sbagliati.
--  Se la funzione non esiste, non tornera' nessuna riga.

--  Se il corpo e' lungo, per isolare solo i confronti:
--  SELECT prosrc FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
--  WHERE p.proname='award_civic_pti' AND n.nspname='public';
--  e poi leggere a occhio le righe con '<', '>' o '>='.


-- =============================================================================
--  Q22 - crowd_predictions esiste nel cloud?
--  Perche' conta: l'app ci scrive dentro (utils/bleManager.ts:150) ma non c'e'
--  un CREATE TABLE in nessuna migration ne' in nessuno dei 63 export.
--  Se manca, l'errore e' ingoiato da un try/catch e la heatmap resta vuota in
--  silenzio. A1-T17.
-- =============================================================================

SELECT
  EXISTS (SELECT 1 FROM information_schema.tables
          WHERE table_schema='public' AND table_name='crowd_predictions')
  AS tabella_esiste,
  EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
          WHERE n.nspname='public'
            AND p.proname ILIKE '%crowd%')
  AS funzioni_crowd_esistono;

--  LEGGI: tabella_esiste = false e funzioni_crowd_esistono = false = la scrittura
--  da utils/bleManager.ts:150 va nel vuoto senza avvisare nessuno.


--  Se esiste, le colonne servono a capire se il client scrive bene:
--  SELECT column_name, data_type, is_nullable
--  FROM information_schema.columns
--  WHERE table_schema='public' AND table_name='crowd_predictions'
--  ORDER BY ordinal_position;

--  E le policy, che determinano se l'app puo' scrivere davvero:
--  SELECT policyname, cmd, roles::text
--  FROM pg_policies
--  WHERE schemaname='public' AND tablename='crowd_predictions';


-- =============================================================================
--  Q26 - profiles.accessibility_mode: BOOLEAN o TEXT?
--          civic_reports: la colonna e' grid_cell o grid_cell_50m?
--  Sono i due disallineamenti che rendono il blocco Accessibilita' e Validazione
--  Community muto. Il primo decide se PoiCard:50 puo' mai essere vero; il
--  secondo decide quale dei due componenti e' corretto e se il trigger
--  trigger_match_report puo' funzionare. A7-T10, A7-T11, A2-T8.
-- =============================================================================

SELECT table_name, column_name, data_type, udt_name, is_nullable
FROM information_schema.columns
WHERE table_schema='public'
  AND (
        (table_name='profiles'      AND column_name ILIKE '%accessib%')
     OR (table_name='civic_reports' AND column_name ILIKE '%grid%')
     OR (table_name='civic_reports' AND column_name ILIKE '%cell%')
  )
ORDER BY table_name, column_name;

--  LEGGI:
--  - profiles: se data_type='boolean' il client che confronta una stringa
--    ('true'/'false') sbaglia sempre. Se data_type='text' il confronto ha
--    senso. La domanda e' ancora aperta: il codice non e' coerente con se stesso.
--  - civic_reports: deve esserci UNA delle due. Se ce sono entrambe, o se il
--    nome e' un terzo, va deciso quale e' quella giusta e il client va
--    allineato. Se non c'e' nessuna, il trigger non puo' funzionare.


-- =============================================================================
--  Q27 - La Validazione Community conosce un soggetto terzo?
--  Perche' conta: la domanda e' se devono partecipare anche le associazioni nodo,
--  o se basta la conferma fra cittadini. Oggi il codice conosce solo il
--  cittadino, quindi il "+25 PTI" promesso non viene assegnato a nessuno.
--  A1-T22, A2-T9.
--  Query: cosa sa il database di chi puo' convalidare.
-- =============================================================================

SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema='public'
  AND table_name IN ('civic_reports','civic_report_validations','profiles')
  AND (column_name ILIKE '%valid%'
    OR column_name ILIKE '%confirm%'
    OR column_name ILIKE '%associaz%'
    OR column_name ILIKE '%validator%'
    OR column_name ILIKE '%status%'
    OR column_name ILIKE '%reward%')
ORDER BY table_name, column_name;

--  LEGGI: se compare una colonna tipo association_id, validator_id o un enum
--  di validatori, il soggetto terzo esiste gia' e va solo usato. Se esiste solo
--  status e un profile_id, il terzo soggetto va progettato, non scoperto.

--  I valori reali di status, se la colonna e' di tipo check o enum:
--  SELECT pg_get_constraintdef(oid) FROM pg_constraint
--  WHERE conrelid='public.civic_reports'::regclass AND contype='c';


-- =============================================================================
--  IN SINTESI - cosa scrivere nei documenti quando hai i risultati
-- =============================================================================
--  Q17 se UUID    -> A7-T7 e' un difetto, index.tsx:286 va corretto
--  Q18 se assente -> la distanza e' solo client, il backend non valida niente
--  Q19 se assente -> il Double GPS Handshake e' solo documentazione
--  Q20 se diversa -> i numeri 1/5/10 dei documenti sono sbagliati
--  Q22 se assente -> la scrittura BLE finisce nel vuoto senza avviso
--  Q26           -> decide se il blocco Accessibilita' e' implementabile
--  Q27           -> decide se il "+25 PTI" ha un destinatario o no
--
--  Nessuna di queste sette si chiude da sola: si chiude scrivendo la risposta
--  accanto alla domanda in TASKS-PER-AREA.md, con la data e la query che l'ha
--  prodotta. E' il criterio di METODICA.md: nessuna affermazione senza prova.
