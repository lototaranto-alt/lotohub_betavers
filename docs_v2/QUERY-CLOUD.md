---
id: QUERY-CLOUD
tipo: analisi
ambito: esecuzione-delle-query-di-chiusura-su-cloud
stato: Vivente
confidenza: Alta
owner: Agent
aggiornato: 2026-09-27
evidenza:
  - docs_v2/COLLAUDO-ARCHIVIO.md:1
  - docs_v2/STRUTTURA-DEFINITIVA.md:1
---

# Query di chiusura: le 5 righe che chiudono l'archivio

> ## NON incollare questo file nel SQL Editor
>
> Le prime righe di un `.md` sono frontmatter YAML (`id:`, `tipo:`, `stato:`) e il pannello risponde
> `42601: syntax error at or near "id"`. È quello che è successo.
>
> **Da usare c'è `docs_v2/QUERY-CLOUD.sql`**: contiene le 4 query già pronte, con i commenti che
> spiegano cosa cercare nell'output. Copia da lì, una query alla volta.
>
> Qui sotto trovi le **tabelle che interpretano i risultati**, cioè cosa significa ogni esito.

> **A cosa serve.** Il collaudo ha lasciato 8 `NON VERIFICABILE`. Cinque di quelle sono chiuse da
> cinque query. Sono le uniche: nessuna riga di codice le sostituisce, e nessuna analisi ulteriore
> le può chiudere. Tutto il resto del piano è costruito su ipotesi finché queste non tornano.
>
> **Come si eseguono.** SQL Editor del pannello Supabase, progetto `fsuolbwsvpgiglwcaffh`.
> **In sola lettura.** Nessuna di queste query scrive: sono `select` su `pg_proc`,
> `pg_get_functiondef`, `information_schema` e un `count`.
>
> **Le prime 3 sono obbligatorie. Le ultime 3 chiudono altre tre `NON VERIFICABILE` e costano
> pochi secondi** ciascuna. Se ne fai solo 3, il piano regge lo stesso.
>
> **Avviso del SQL Editor.** Su `impact_transactions` il pannello può mostrare *"This query creates a
> table without enabling Row Level Security"*. **È un falso positivo**: sono tutte `SELECT`, non
> creano niente. Clicca **Run** e non abilitare RLS — vedi §0.

---

## 0. L'avviso su RLS: non cliccarlo

Il SQL Editor può segnalare, sulle query che toccano `impact_transactions`:

```
This query creates a table without enabling Row Level Security.
Clients using anon or authenticated keys may be able to access public.impact_transactions.
```

**Cosa fa davvero:** la query è un `SELECT count(*)`. Non crea tabelle. Il linter sta segnalando una
condizione della tabella che incontra nel testo, non un'azione della query.

**Cosa NON fare:** non spuntare "enable Row Level Security". Faresti eseguire
`ALTER TABLE public.impact_transactions ENABLE ROW LEVEL SECURITY` **senza nessuna policy**, e in
Postgres RLS senza policy è *nega tutto* per `anon` e `authenticated`. `app/(tabs)/index.tsx` legge
`impact_transactions` direttamente dal client: quel `.select()` comincerebbe a tornare zero righe
**senza restituire errore**. È il difetto del fallback silenzioso, introdotto da una riga di
diagnostica.

**Cosa fare:** `Run`, e nulla altro.

**Perché però l'avviso non è inutile:** dice che `impact_transactions` oggi ha RLS **disabilitato**.
Se confermato, la tabella che contiene il ledger ESG è leggibile e scrivibile da chiunque abbia la
anon key, che è pubblica dentro l'app. Per un progetto che si presenta come certificabile ESG e
Zero-PII, è la domanda da chiudere prima di un report venduto. La verifica è la query 6.

---

## 1. `recover_loto_pass` — decide se il Blocco 0 è finito

```sql
select pg_get_functiondef('public.recover_loto_pass(text)'::regprocedure);
```

**Cosa cercare nell'output:** la presenza o l'assenza di `auth.uid()` e di `UPDATE`.

| Se l'output contiene | Significato | Cosa ne segue |
|---|---|---|
| `auth.uid()` **e** `UPDATE` | il ricongiungimento esiste sul DB | il Blocco 0 è completo lato server. Resta da riscrivere il client, che scarta il risultato |
| solo `SELECT`, nessuna `UPDATE` | è il corpo "mock pre-beta" di `MIGRATE_PREBETA_CLEANUP.sql:63-95` | il recupero **non ricongiunge niente**. Va costruito, e l'Alert che promette il ripristino va tolto |
| `42704` / undefined function | la funzione non è nel cloud | l'identità continua **non esiste**. Zero-PII senza Pass = dato perso per sempre |

**Attenzione a un falso positivo:** una funzione può contenere `auth.uid()` in un commento o in un
`RAISE NOTICE` senza usarlo davvero. La prova è che l'`UPDATE` sia su `public.profiles` con un
`WHERE id = <quello che viene da auth.uid()>`.

---

## 2. `scan_poi_gps` — decide il Blocco 4 e il destino del ledger

```sql
select pg_get_functiondef('public.scan_poi_gps(uuid,float8,float8)'::regprocedure);
```

Esistono **5 definizioni con la stessa firma**. Questa query dice quale è viva. Il discriminatore
è il valore numerico, non il nome:

| Segnale nell'output | Corpo attivo | Conseguenza |
|---|---|---|
| `v_co2_saved := 10.0` | nr. 1, `rpc_scan_poi_gps.sql` | **il CO2 è sporato di un fattore ~7.** `10.0` non ha senso fisico per un check-in |
| `1.5` **e** `total_tokens` | nr. 2, `rpc_scan_poi_gps_fixed.sql` | il più probabile. Scrive `user_pois` + `profiles`, **niente ledger** |
| `'cooldown_hours'` nel `RETURN` | nr. 5, catena canonica | non applicata. Se è questa, la catena è già quella buona |

**La riga da cercare in tutti e tre i casi:**

```
INSERT INTO public.impact_transactions
```

Se **non c'è**, il ledger non riceve niente e la catena 1 è spizzata al passo 2. È il risultato
più probabile, e quello con la conseguenza più grossa.

---

## 3. Il ledger — la domanda da 4 mesi di check-in

```sql
select count(*) as righe_ledger, max(created_at) as ultima_riga from public.impact_transactions;
```

| Output | Lettura |
|---|---|
| `0` | **la catena 1 non ha mai prodotto il bene vendibile.** Tutto il downstream DaaS è pronto e vuoto |
| `> 0` con `ultima_riga` del ~22/09 | il ledger funzionava e si è fermato. Data e corpo attivo si incrociano con la query 2 |
| `> 0` con `ultima_riga` recente | il corpo attivo scrive il ledger. La catena 1 è integra e il problema è altrove |

---

## 4. `is_loto_admin` — dice se la hardening del 25/09 è stata applicata

```sql
select proname from pg_proc where proname = 'is_loto_admin';
```

Una riga. Chiude `COLLAUDO-ARCHIVIO.md:80` e `:96`.

- **torna la riga** → la hardening **è** applicata. Le viste DaaS hanno il gate admin e la revoca
  ad `anon`. **Non riapplicare mai `migration_v22/v23/v24`**: fanno `DROP VIEW` senza il gate.
- **non torna nulla** → la hardening **non** è applicata, e le viste in produzione sono quelle di
  `v22/v23`. Va applicata la hardening, che è già in Git e non è mai stata eseguita.

Attenzione: lo snapshot `types/database.ts` è del **25/09** e la hardening è committata lo stesso
giorno. L'assenza in quello snapshot è un indizio, non una prova. Per questo la query.

---

## 5. Le viste sono ancora aperte ad `anon`? — privacy del dato vendibile

```sql
select table_name, grantee
from information_schema.role_table_grants
where table_schema = 'public' and table_name like 'vw_%'
order by table_name, grantee;
```

Non una sì/no: un elenco. Serve a leggere **quali** viste DaaS sono pubbliche.

Se `vw_daas_heatmap_15min` o `vw_daas_esg_monthly` compaiono con `grantee = 'anon'`, il dato
aggregato che si intende vendere alle agenzie è **leggibile da chiunque abbia la anon key**, che
è pubblica nell'app. Non è una ipotesi: è ciò che fanno `GRANT ... TO anon` in `migration_v22:26,48,107`
e `migration_v23:29`.

---

## 6. Quali tabelle non hanno RLS? — il ledger è esposto?

```sql
select c.relname as tabella, c.relrowsecurity as rls_attivo,
       (select count(*) from pg_policies p where p.schemaname='public' and p.tablename=c.relname) as policy
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by c.relrowsecurity, c.relname;
```

Un elenco, non una sì/no. `relrowsecurity = false` significa RLS **disabilitato**.

Leggi le righe in due modi:

- **`rls_attivo = false` e `policy = 0`** → la tabella è aperta a `anon` e `authenticated`, che
  sono le chiavi che viaggiano dentro l'app. Chiunque le abbia può leggere **e scrivere**.
- **`rls_attivo = true` e `policy = 0`** → RLS attivo senza policy: *nega tutto*. È la condizione
  in cui si cade se si lascia passare quell'avviso.

Le due righe da guardare per prime, se sono in elenco: `impact_transactions` (il ledger, la
promessa ESG) e `profiles` ( contiene `total_xp`, `total_co2`, `total_tokens`).

Non è un difetto da corregere qui: è un dato da mettere in `DECISIONI.md`, perché la risposta
("ledger append-only ma leggibile, o ledger chiuso") è una decisione di prodotto e riguarda
l'accesso dell'agenzia ai dati del proprio territorio.

---

## 7. Come incollare l'esito

Nel pannello, il risultato si copia dalla griglia. **Incolla qui l'output grezzo**, anche in
ritaglio: le parti che servono sono

- per la query 1 e la 2: le righe con `INSERT`, `UPDATE`, `auth.uid()`, `v_co2_saved`
- per la query 3: i due numeri
- per la query 4: la riga o il vuoto
- per la query 5: l'elenco `table_name` / `grantee`

Non serve il resto. Non serve spiegare nulla: l'ho già scritto io sopra.

---

## 8. Cosa non fare mentre le esegui

- **Non applicare nessuna migration** mentre aspettiamo. L'ordine conta: prima i fatti, poi
  `B1`-`B4`, poi una sola applicazione.
- **Non usare il refresh token del device** per reachere il cloud: Supabase lo ruota a ogni uso e
  bruciarlo innesca il Deep Recovery. Da qui si usa solo il SQL Editor, che non tocca le chiavi
  dell'app.
- **Non fidarti del nome della funzione.** Cinque definizioni, una sola firma, semantica opposta.
  È il motivo per cui queste query esistono.

---

*Runbook del 27/09/2026. Derivato da `COLLAUDO-ARCHIVIO.md` §3, §6 e `STRUTTURA-DEFINITIVA.md` §3.1.
Cinque query, zero scritture. Nessuna riga di questo file è un'ipotesi: ogni output ha una tabella
che lo interpreta.*
