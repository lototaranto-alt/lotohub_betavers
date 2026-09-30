---
id: ANONIMATO-E-INTEGRITA-LEDGER
tipo: analisi
ambito: privacy-daa-s-e-integrita-del-ledger
stato: Vivente
confidenza: Alta
owner: Agent
aggiornato: 2026-09-27
evidenza:
  - supabase/pure_cloud_queries/62_untitled_query.sql:1
  - supabase/pure_cloud_queries/54_untitled_query.sql:1
  - supabase/pure_cloud_queries/56_untitled_query.sql:1
  - supabase/pure_cloud_queries/53_untitled_query.sql:1
  - supabase/migrations/20260925120000_admin_dashboard_hardening.sql:113
  - supabase/migrations/20260925120000_admin_dashboard_hardening.sql:266
  - supabase/migrations/20260927090000_scan_chain_shadowban_and_ledger.sql:1
  - app/(tabs)/index.tsx:597
  - utils/dbAggregation.ts:35
  - .agents/rules/master_business_brief.md:23
---

# Anonimato, integrita del ledger e piano dei fix

> Documento nato perche il limite di scorrimento della chat rendeva impossibile tenere insieme
> l'analisi e le correzioni. Tutto quello che segue e' gia' stato detto a voce; qui e' scritto una
> volta sola, con le prove accanto, e con indicate le cose che **non** si sa ancora.
>
> **Regola di lettura.** Ogni riga e' o una riga letta dal cloud, o una riga letta dal codice, o
> un'inferenza marcata come tale. Le inferenze non sono promosse a fatti. Dove il documento dice
> "non verificato", il lavoro non è finito.

---

## 1. Le correzioni di questo turno

Sono tre, e ognuna ribalta un'affermazione precedente. Le metto per prime perché cambiano il
quadro, e scriverle in fondo avrebbe dato per scontato un mondo che non esiste.

### 1.1 Il `GRANT ALL` ha un autore, e il commento dice il contrario di quello che fa

`supabase/pure_cloud_queries/62_untitled_query.sql`, query intitolata *"FIX BUG MAPPA: VISTA
FRONTEND MANCANTE"`, termina con:

```sql
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
```

Il commento sopra è: *"Riapplichiamo esplicitamente i permessi per sicurezza"*.

Questa è, con alta probabilità, **l'origine dei `GRANT ALL` che Q7 e Q14a hanno trovato** su
`impact_transactions`, `profiles` e `vw_collective_impact` per `anon` e `authenticated`. Non e' un
errore concettuale rimasto senza spiegazione: e' un comando pensato per il contrario di quello che
fa, eseguito con l'intento di fare il contrario di quello che faceva.

Da segnare come **inferenza forte, non come fatto**: la corrispondenza e' evidente ma non
provata. La prova si chiude con la tabella dei grant, e con `Q15`.

### 1.2 `vw_pois_frontend` e `scans` non sono orfane: sono fuori dalla catena

Avevo trattato questi oggetti come orfani, cioe' senza corpo noto. **Errore.** Hanno un corpo, e il
corpo e' in `supabase/pure_cloud_queries/`:

- `62_untitled_query.sql` ricrea `vw_pois_frontend` con `p_pois` piu' `p_iva`, `p.pec`,
  `p.tenant_id` e i `ST_Y`/`ST_X` per decodificare il PostGIS.
- `53_untitled_query.sql` e `56_untitled_query.sql` creano `scans`, con il commento
  *"Crea tabella scans fittizia se non esiste"*.

La differenza non e' cosmetica. "Orfano" vuol dire che il codice non e' da nessuna parte.
"Fuori dalla catena" vuol dire che il codice c'e', ma in un posto dove nessuno lo esegue e nessuno
lo versiona: `supabase/pure_cloud_queries/` contiene **72 file**, di cui **63 export del SQL Editor**
in formato JSON, e non e' una directory che un runner di migration guarda. Il rischio non e' la
perdita, e' la **deriva**: il cloud puo' essere stato modificato venti volte e il repository non lo sa.

**La data e' la parte grave, e non l'avevo calcolata.** I 63 export portano dentro il JSON il
proprio `updated_at`: vanno dal **2026-04-13 al 2026-07-15**. La prima migration in
`supabase/migrations/` e' `20260715191000_SEED_DATA.sql`, cioe' **2026-07-15**: lo stesso giorno
dell'ultimo export. La catena di migration **comincia quando il lavoro da pannello finisce**, e non
lo precede. Quasi tutta la provenienza dello schema e' di aprile-luglio e sta fuori dalla catena.

I 9 file non-JSON (`intro_spett_1..7`, `introspection_badges.sql`) sono un'altra cosa: query di
lettura su `pg_tables` e `information_schema`, con un header che dichiara *"fonte di verita': SOLO il
DB cloud, NON i vecchi .sql"*. Sono ispezione, non DDL. Quindi la directory e' mista: **~63
mutazioni di schema piu' 9 controlli in sola lettura**, e non "tutto DDL" come e' facile supporre.

`62_untitled_query.sql` contiene anche, con un commento che lo dichiara:

```sql
-- Ripristino la colonna tenant_id che era stata creata a mano su Supabase in passato
ALTER TABLE public.pois ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'taranto';
```

E' una prova diretta del fatto che gia' in passato il cloud e' stato modificato a mano. Questo
documento non e' un problema di righe perse: e' un problema di stato non governato.

### 1.3 `process_esg_impact` scrive sul ledger per un `profile_id` passato dall'esterno

Questa e' la piu' seria, ed e' **non verificata**. Va letta come un rischio aperto, non come una
vulnerabilita' confermata.

In `54_untitled_query.sql` e `56_untitled_query.sql`, `process_esg_impact` ha questa firma:

```sql
CREATE OR REPLACE FUNCTION process_esg_impact(
    p_co2 NUMERIC, p_liters INT, p_tokens INT, p_xp INT,
    p_party_size INT, p_user_id UUID, p_hash TEXT
) RETURNS JSON
```

e dentro:

```sql
UPDATE public.profiles SET
    total_co2   = COALESCE(total_co2, 0)   + v_final_co2,
    total_tokens= COALESCE(total_tokens,0)  + v_final_tokens,
    total_xp    = COALESCE(total_xp, 0)    + v_final_xp
WHERE id = p_user_id;

INSERT INTO public.impact_transactions
    (profile_id, receipt_hash, co2_saved, liters_saved, tokens_earned, xp_earned)
VALUES
    (p_user_id, p_hash, v_final_co2, v_final_liters, v_final_tokens, v_final_xp);
```

`SECURITY DEFINER`, e **nessun confronto tra `auth.uid()` e `p_user_id`**.

Se la funzione viva e' uguale, chiunque può chiamare la funzione passando l'`id` di un altro
profilo e scrivere PTI, XP e CO2 su quel profilo. La funzione gira come proprietario, quindi
**bypassa l'RLS della tabella**.

E questo intacca direttamente una conclusione che avevo dato per buona. Avevo detto: *"il ledger è
al sicuro, perché RLS è attivo e non ha policy, quindi `anon` e `authenticated` non vedono
niente"*. Questo vale per l'accesso **diretto alla tabella**. Non vale per una funzione
`SECURITY DEFINER` con l'identita' dell'utente ricevuta come parametro. Le due cose vanno tenute
separate, e la seconda e' aperta.

Perche' resta aperta e non l'ho chiusa: **la firma che chiama l'app non e' quella dell'export.**

```tsx
// app/(tabs)/index.tsx:597
const { error } = await supabase.rpc('process_esg_impact', {
  user_id: userProfile.id,
  p_co2: 0.5 * multiplier,
  p_liters: 5 * multiplier,
  p_tokens: 50,
  p_xp: 50,
  p_takeaway: false,
  p_party_size: multiplier
});
```

Sette argomenti, `p_takeaway` al posto di `p_hash`. Quindi la funzione viva **e' stata modificata
dopo** quegli export, e non in una migration: ho cercato `process_esg_impact` in tutte le migration
in `supabase/migrations/` e **non compare**. La modifica e' avvenuta nel SQL Editor, ancora una
volta fuori dalla catena. Non ho la definizione viva, quindi non posso dire se il controllo c'e' o
no. `Q15` chiude il punto.

---

## 2. k=5: cosa protegge davvero

La soglia `k = 5` compare in **due** viste di
`supabase/migrations/20260925120000_admin_dashboard_hardening.sql`:

- `vw_daas_heatmap_15min`, `HAVING COUNT(DISTINCT profile_id) >= 5` a **riga 113**
- `vw_daas_event_attendance`, `HAVING COUNT(DISTINCT up.profile_id) >= 5` a **riga 266**

In entrambe la soglia è anche una colonna letterale, `5 AS k_anonymity_threshold` (righe 110 e
257): è un valore dichiarato, non calcolato. Se domani la soglia senza toccare le due righe
`HAVING`, il numero mostrato in UI mente. Vanno tenuti insieme.

**Fatto attenuante, che va detto prima delle critiche:** nessuna delle due viste e' esposta al
pubblico. Entrambe sono protette da `WHERE public.is_loto_admin()` (righe 95 e 263) e da
`REVOKE ALL ... FROM anon` (righe 115 e 268). L'esposizione pubblica della heatmap **non esiste**:
il rischio qui e' interno, non pubblico.

Cosa fa bene, in condizioni normali:

- **Sopprime la coda lunga.** Il rischio individuale di un utente in una cella `E >= 1/k` cade
  sotto `1/5`. Per una distribuzione uniforme di `N` utenti su `M` celle, l'utente nel bucket
  peggiore ha identifiabile con probabilita' `1/5` a ogni rilascio: `0,2`.
- **E' una floor, non una promessa.** Se `E > 5`, la cella esce comunque. La soglia e' il
  pavimento, non il tetto.

Cosa **non** fa, ed e' il punto:

- **Non regge il rilascio ripetuto.** Cinque utenti, dieci snapshot: l'insieme non cambia, ma la
  sequenza di celle abitate si puo' filtrare come una traccia. Il rischio non e' `1/5`, e' circa
  `k * (1/k)^(N/k)` per utente: con `k=5` e `N=100` utenti e un'ora di osservazione, l'ordine delle
  comparse stima bene la presenza individuale.
- **Non regge il differencing.** Se gli snapshot sono rilasciati ogni 15 minuti, la differenza fra
  due bucket consecutivi dice chi e' entrato e chi e' uscito. Il differencing e' l'attacco
  canonico contro le griglie aggregate ed e' quello che il modello di minimo 5 non tocca.
- **Non regge la conoscenza laterale del commerciante.** Se chi legge il dato sa in che orario ha
  visto entrare i clienti, la griglia smette di proteggere: il prior è talmente stretto che 5 e' un
  sovraccarico, non una protezione. Nel caso del report commerciante questo e' il rischio
  dominante, non un dettaglio.
- **Non e' una griglia anonima perche' il tempo e' troppo stretto.** Blocchi da 15 minuti dentro
  una griglia di 110 metri: la cella e' piccola e il tempo e' breve. Le due dimensioni si sommano
  male, e il valore di `k` dovrebbe salire con la frequenza di rilascio, non restare fisso.

I 110 metri non sono una scelta di progetto: vengono da `ROUND(lat::numeric, 3)`, cioe' 0,001
gradi, che a Taranto e' circa 111 m. E' un artefatto del arrotondamento, ed e' per questo che la
griglia e' poco piu' grande di un singolo POI.

**Conclusione operativa:** `k=5` regge un singolo rilascio a un istante fisso, e non regge nient'
altro. Per i consumatori istituzionali, dove l'avversario non ha informazioni sulla presenza
individuale, e' accettabile se si aggiunge una **finestra rolling** (per esempio un'ora, non un
singolo blocco) e il rilascio non e' orario. Per i commercianti non e' accettabile cosi': servono
**bucket giornalieri**, che con 5 utenti su una cella non distinguono piu' niente e quindi
diventano sicuri per costruzione, non per parametro.

---

## 3. Il claim commerciale che va corretto

`.agents/rules/master_business_brief.md:23` dice:

> "griglie fisiche di 110 metri e blocchi temporali di 15 minuti, garantendo **l'impossibilita'
> matematica di tracciare il singolo** e una **compliance GDPR al 100%**"

Tre problemi, in ordine di gravita':

1. **"Compliance GDPR al 100%" non e' un'affermazione che si puo' fare.** Nessun sistema e' al
   100%. Va riscritto come descrizione del meccanismo, non come esito.
2. **"Impossibilita' matematica di tracciare il singolo" e' falso per costruzione.** Il
   differencing non richiede nemmeno di uscire dal sistema: e' aritmetica su due righe che il
   sistema ha gia' pubblicato.
3. **Il file e' in `.agents/rules/`, non in `docs/`.** Il claim e' dentro il set di regole che
   l'agente carica a ogni sessione. Non e' un documento da cui si puo' divergere: e' il testo che
   produce le prossime affermazioni sbagliate. Va corretto alla fonte, non in un appendix.

Formulazione accettabile: aggregazione su griglia di circa 110 m e finestre temporali, con soglia
di k-anonimato su ogni rilascio e minimizzazione dei dati esposti ai partner commerciali.

**Stato: corretto il 2026-09-27.** La riga 23 e' stata riscritta: tolte "impossibilita' matematica"
e "compliance GDPR al 100%", aggiunti il limite del differencing e della conoscenza laterale, il
vincolo dei bucket giornalieri per i commercianti, il divieto di report per singolo esercizio, e la
distinzione fra Agenzie (cliente pagante) e Amministrazioni (destinatario finale), come da
`.agents/AGENTS.md` sezione 5. Rimane da fare il passaggio a grid-only della vista, gia' tracciato
al punto 4 del piano.

---

## 4. Il ramo scontrino

**Stato: rimosso il 2026-09-27.** Il blocco e' stato cancellato da `executeScan`. La sezione resta
come record del perche', non come descrizione del codice corrente.

Il ramo eliminato faceva:

```tsx
const { data: existing } = await supabase.from('impact_transactions')
  .select('id').eq('receipt_hash', receiptHash).single();
```

`receipt_hash` **non esiste piu'**. La tabella ha 9 colonne e non e' tra queste. Non e' mai stata
una colonna che il codice anticipava: esisteva, ed e' stata rimossa. La definizione originale in
`54_untitled_query.sql` la aveva, `receipt_hash TEXT UNIQUE`, con `process_esg_impact` che la
valorizzava da `p_hash`. Il codice e' rimasto indietro rispetto a uno schema che e' cambiato.

Il ramo e' rotto due volte, e non una:

1. la `select` su una colonna inesistente **errore**, e `data` resta `null`;
2. il codice non controlla l'errore, fa solo `if (existing)`, quindi **il controllo di duplicato
   non parte mai**.

Il secondo punto e' il peggiore, e sopravvive a qualsiasi fix di schema. Se domani il codice
scontrino invece di rimuoverlo, il dedup dei receipt continua a non funzionare anche dopo aver
restaurato la colonna.

**`p_iva` ha un solo uso in tutta l'app**, ed e' il `receiptHash` di questo ramo. Tolto il ramo,
`p_iva` non e' piu' letta da nessuna parte. `pec` non risulta usata da nessun file. A quel punto
rimuovere le due colonne dalla vista e' sicuro dal lato applicativo. `p_iva` puo' restare nella
tabella: e' la vista che la espone, non la colonna.

**Conseguenza della rimozione, da non dimenticare.** `executeScan` non ha piu' **nessun** controllo
di idempotenza: ogni chiamata riuscita su uno stesso POI `partner` assegna di nuovo 50 PTI e 50 XP.
Non e' una regressione introdotta qui, perche' il guard non partiva gia' (punto 2 sopra: `data`
era `null` perche' la colonna non esiste, quindi `existing` era `null` e l'alert non usciva mai).
La differenza e' che ora la cosa e' **dichiarata** invece che mimetizzata.

Il posto giusto per il controllo non e' questo file. Per `.agents/AGENTS.md` sezione 7, l'idempotenza
e' un vincolo del database: un UNIQUE su `(profile_id, poi_id, data)` o un check dentro la funzione,
non una `select` dal client che peraltro l'RLS rende invisibile. **Va risolta insieme a `Q15`**, perche'
`executeScan` chiama proprio `process_esg_impact`, la funzione sotto indagine.

---

## 5. Il ledger: cosa e' protetto e cosa no

Stato verificato, e le due righe vanno lette insieme.

| | Lettura diretta della tabella | Scrittura via funzione |
|---|---|---|
| RLS su `impact_transactions` | attiva | bypassata se `SECURITY DEFINER` |
| Policy presenti | **zero** | non applicabile |
| `GRANT ALL` su `anon`/`authenticated` | concesso | concesso |
| Esito | nessuna riga visibile, nessuna scrittura | **non determinato, vedi Q15** |

Il `GRANT ALL` e' un accesso senza protezione, ma l'RLS senza policy e' un deny-all. I due si
annullano, quindi **la tabella e' chiusa per accesso diretto**. Questo e' vero e va registrato, ma
non basta a dichiarare il ledger integro: resta il buco delle funzioni `SECURITY DEFINER`, che
passano dal lato proprietario e quindi non incontrano nessuna delle due righe.

Sulle 5 righe di `user_pois` non si backfilla niente, e la ragione va detta perche' e' una
decisione e non una dimenticanza: `user_pois` non conserva lo scenario di mobilita', quindi dalle 5
righe esistenti **non e' ricostruibile** quale sia stata la PTI storicamente dovuta. Il ledger ha
0 righe e resta a 0 righe: la ripartenza e' pulita, il passato e' perso e non recuperabile.

`user_pois` non ha PK ne' UNIQUE su `(profile_id, poi_id)`, con `id NOT NULL`. E' un problema di
integrita' separato, non bloccante per la catena GPS, e va affrontato per conto suo.

---

## 6. Decisioni di prodito gia' prese

Non sono proposals: sono decisioni, e le scrivo qui perche' i prossimi turni non le
rivalutino da capo.

| Tema | Decisione |
|---|---|
| Agenzie | solo griglie, aggregati e snapshot; **nessun** report per singolo commerciante |
| Heatmap | grid-only, **senza `poi_id`** |
| Report commerciante | calpestio e scan propri, aggregati e anonimizzati, offerti in freemium come gancio premium |
| Tabella `merchants` | **non ora**: nessuna tabella, decisione rinviata a un caso d'uso reale |
| Dati da POI pubblici | **no** |
| Dati di terzi | **no** |
| `DROP` | **no**, per ora |
| Email e password | via: il backup L.O.T.O. Pass e' solo QR |
| `poi_id` sul ledger | **dopo** la catena GPS, non insieme |
| `consent_scope` | previsto per il futuro `merchants`, non applicabile finche' la tabella non esiste |

Il fix `??` -> `||` in `utils/dbAggregation.ts:35` e' **annullato**. Portare la PTI dal fallback
sui `user_pois` quando il ledger e' vuoto maschera il fatto che il ledger non e' alimentato, e
viola l'SSOT. Il vuoto si risolve riempiendo il ledger.

---

## 7. Il piano dei fix, in ordine

L'ordine non e' estetico: 3 dipende da 1, e 4 dipende da 2.

**1. Rimuovere il ramo scontrino. — FATTO il 2026-09-27.** Indipendente dal database, e libera
`p_iva` e `pec`. Eseguito: `p_iva`, `receipt_hash` e `receiptHash` non compaiono piu' in alcun
file applicativo. Resta aperto il punto dell'idempotenza, spostato dove deve stare (server-side,
v. sezione 4).

**2. Chiusura di `vw_pois_frontend`.** Rimuovere `p_iva` e `pec` dall'esposizione. **Vincolo non
risolto:** PostgreSQL non permette di togliere colonne da una vista con il solo `CREATE OR REPLACE
VIEW`, e il vincolo "nessun `DROP`" e' esplicito. Le strade sono rinominare la vista e creare la
nuova, o creare una vista nuova e spostare i consumatori. La seconda e' la piu' pulita, perche'
`map.tsx:131` e' l'unico consumatore noto. Serve una decisione, non una scorciatoia.

**3. Catena GPS.** `20260927090000_scan_chain_shadowban_and_ledger.sql` e' scritta e non
deployata. Fa tre cose: acquisisce `tenant_id` dal POI, filtra `is_shadowbanned` in cooldown e
anti-spoofing globale, scrive il ledger solo per check-in non shadowbanned. Il blocco trigger del
v13 e' stato tolto perche' Q9 ha mostrato che non e' deployato. **Manca la policy SELECT** su
`impact_transactions`, senza la quale `index.tsx:347` continua a leggere zero righe. Ordine:
ledger, poi policy SELECT, poi `poi_id`.

**4. Heatmap grid-only.** Togliere `poi_id` dal `GROUP BY` di `vw_daas_heatmap_15min`. Stesso
vincolo del punto 2, perche' anche qui si toglie una colonna dall'output. Serve inoltre la
decisione su finestra rolling e cadenza, che oggi non c'e'.

---

## 8. Cosa non e' stato fatto

- **Nessuna scrittura sul cloud.** Tutte le query sono state in sola lettura. Nessuna migration
  e' stata applicata.
- **Nessun commit, nessun push.** `docs_v2/` non va committato senza decisione esplicita.
- **Validazione SQL non eseguita.** Il PostgreSQL locale chiede credenziali:
  `fe_sendauth: no password supplied`. La syntax della migration GPS non e' mai stata provata da
  un parser, solo con un controllo strutturale: una `CREATE OR REPLACE FUNCTION`, due `$$`, due
  `INSERT`, `BEGIN`/`COMMIT`, nessun `DROP`/`GRANT`/`VIEW`/`POLICY`.
- **`Q12` sullo schema reale di `scans` non eseguita.**
- **Stato cloud di `20260825_whatsapp_bot_setup.sql` non verificato.** Il file contiene
  `row_to_json(NEW)` e `row_to_json(OLD)` verso una Edge Function, cioe' l'intera riga POI, e un
  cron alle 20:30 UTC. `b2b_phone` e `b2b_plan` compaiono su `pois` ma non in `types/database.ts`,
  il che suggerisce che il file non sia stato applicato. Non verificato: resta aperto, e non e'
priorita' rispetto a Q15.
- **`b2b_feedbacks` non e' orfana.** Esiste, in
  `supabase/migrations/20260822_create_b2b_feedbacks.sql`. Avevo dedotto il contrario da una
  ricerca troncata. Corretto.

---

## 9. La query che chiude il punto aperto

`Q15`, da eseguire sul project `fsuolbwsvpgiglwcaffh`. Restituisce firma, `SECURITY DEFINER` e
corpo delle tre funzioni calde, cosi' da vedere se `auth.uid()` viene confrontato con l'utente
ricevuto.

```sql
-- Q15: definizioni vive delle funzioni che toccano il ledger
SELECT
    p.proname,
    pg_get_function_identity_arguments(p.oid) AS args,
    pg_get_function_result(p.oid)              AS ritorno,
    p.prosecdef                                AS security_definer,
    p.proconfig
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('process_esg_impact', 'scan_poi_gps', 'recover_loto_pass')
ORDER BY 1, 2;

-- Q15b: il corpo di process_esg_impact, per leggere il controllo di identita'
SELECT pg_get_functiondef(p.oid)
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'process_esg_impact';
```

**Come leggo il risultato, cosi' la risposta non e' un parere:**

- `prosecdef = true` e il corpo contiene `auth.uid()` confrontato con `p_user_id`: sicuro.
- `prosecdef = true` e il corpo **non** contiene `auth.uid()`: il ledger e' scrivibile per un
  profilo arbitrario. Allora la riga 3 della tabella in sezione 5 va riscritta da "non determinato"
  a "vulnerabile", e la catena GPS non si deploya prima di aver aggiunto il controllo.
- `prosecdef = false`: il problema rientra nel perimetro dell'RLS, e la riga 3 va riscritta a
  "chiuso".

Il giudizio va emesso su `Q15b`, non su `Q15`. La firma dice che cosa la funzione accetta, il
corpo dice a chi dà retta.

---

## 10. Indice delle prove

| Affermazione | Prova |
|---|---|
| `GRANT ALL` su tutto lo schema, commento contraddittorio | `supabase/pure_cloud_queries/62_untitled_query.sql` |
| `vw_pois_frontend` con `p_iva` e `pec` | `supabase/pure_cloud_queries/62_untitled_query.sql` |
| `pois.tenant_id` creata a mano sul cloud | `supabase/pure_cloud_queries/62_untitled_query.sql` |
| `receipt_hash` nella definizione originale | `supabase/pure_cloud_queries/54_untitled_query.sql` |
| `process_esg_impact` con `p_user_id` e senza `auth.uid()` | `supabase/pure_cloud_queries/54_untitled_query.sql` |
| `scans` creata fuori dalla catena | `supabase/pure_cloud_queries/53_untitled_query.sql` |
| heatmap con `poi_id` e `k >= 5` | `supabase/migrations/20260925120000_admin_dashboard_hardening.sql:113` |
| stessa soglia sulle presenze eventi | `supabase/migrations/20260925120000_admin_dashboard_hardening.sql:266` |
| heatmap e attendance negate ad `anon`, gate `is_loto_admin()` | `supabase/migrations/20260925120000_admin_dashboard_hardening.sql:115` |
| claim GDPR 100% e "impossibilita' matematica" | `.agents/rules/master_business_brief.md:23` (corretto) |
| lettura `receipt_hash` inesistente | ramo rimosso il 2026-09-27 da `app/(tabs)/index.tsx` |
| chiamata con firma diversa dall'export | `app/(tabs)/index.tsx:597` |
| ledger letto dal client, zero righe per RLS | `app/(tabs)/index.tsx:347` |
| `process_esg_impact` assente da ogni migration | `supabase/migrations/` (ricerca con esito vuoto) |
| fix `??` -> `||` annullato | `utils/dbAggregation.ts:35` |
| `b2b_feedbacks` esiste | `supabase/migrations/20260822_create_b2b_feedbacks.sql` |
