---
id: VERIFICHE-PROCESS-ESG-IMPACT
tipo: analisi
ambito: runbook-di-verifica-cloud-per-il-motore-di-impatto
stato: Vivente
confidenza: Alta
owner: Agent
aggiornato: 2026-09-30
evidenza:
  - supabase/migrations/20260930180000_process_esg_impact.sql:149
  - supabase/migrations/20260930180000_process_esg_impact.sql:79
  - app/(tabs)/index.tsx:596
  - docs_v2/tooling/autorita.json:1
---

# Verifiche cloud: motore di impatto `process_esg_impact`

Documento di riferimento per eseguire e leggere le verifiche. Tutto quello che serve
per capire cosa aspettarsi, senza doverlo chiedere in chat.

Migration interessata: `supabase/migrations/20260930180000_process_esg_impact.sql`
**non e' ancora stata applicata al cloud.**

---

## 1. Cosa e' cambiato il 30/09

`p_party_size` era un moltiplicatore degli importi, arrivava dal client e **non aveva
alcun tetto lato server**. Il codice prima era:

```sql
v_co2 := COALESCE(p_co2, 0) * GREATEST(COALESCE(p_party_size, 1), 1);
```

Con `p_party_size = 1000000` bastava inviare quel numero nella chiamata RPC per
amplificare CO2 e litri di un milione di volte.

Ora:

```sql
v_size := LEAST(GREATEST(COALESCE(p_party_size, 1), 1), 1);
v_co2 := COALESCE(p_co2, 0) * v_size;
```

`LEAST(GREATEST(x, 1), 1)` restituisce `1` per qualunque valore di `x`. Il coefficiente
e' morto per costruzione, non per convenzione.

Il parametro **resta accettato** nella firma, per non rompere le chiamate esistenti.

## 2. Perche' la premessa "party_size non e' implementata" regge, ma non basta

Verificato: `party_size` **non e' una colonna di `profiles`** in nessuna delle 7
migration. Il client la legge a `index.tsx:596`:

```ts
const multiplier = userProfile?.party_size || 1;
```

Legge `undefined`, e `|| 1` la trasforma in `1`. Quindi il valore reale e' gia' `1` e la
funzione non e' mai stata amplificata in condizioni normali.

Ma il parametro **resta sul filo della richiesta**: un client modificato non passa dalla
UI, chiama direttamente `supabase.rpc('process_esg_impact', { p_party_size: 999999 })`.
Per questo la neutralizzazione e' stata fatta lato server. Pulire il client non avrebbe
chiuso niente.

Il valore richiesto viene salvato in `impact_transactions.party_size_reported`. Non e' solo
per compatibilita': se un domani la feature Gruppi a Tempo, quella colonna dice quanto il
client chiedeva, e oggi quella informazione non esiste da nessuna parte.

---

## 3. Le verifiche da eseguire

Tutte nel SQL Editor di Supabase, **in ordine**. Dopo aver applicato la migration.

### V1 - la tabella esiste
```sql
SELECT to_regclass('public.impact_transactions') AS tabella;
```
Atteso: `tabella = impact_transactions`

### V2 - la firma e' quella che il client usa
```sql
SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS firma, p.prosecdef
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public' AND p.proname = 'process_esg_impact';
```
Atteso, una sola riga:
`p_co2 numeric, p_liters integer, p_tokens integer, p_xp integer, p_takeaway boolean, p_party_size integer, p_hash text`
e `prosecdef = true`.

Se appare **anche una riga con `p_user_id`**, la versione d'archivio e' ancora viva e va
rimossa a mano.

### V3 - il search_path e' fissato
```sql
SELECT prosecdef, proconfig FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public' AND p.proname = 'process_esg_impact';
```
Atteso: `proconfig` contiene `search_path=public, pg_temp`.

`pg_temp` va in coda, sempre. In PostgreSQL viene cercato per primo se non e' nominato
esplicitamente: con il solo `public`, un utente autenticato puo' creare una tabella
temporanea che ombra una tabella di `public` dentro una funzione privilegiata.

### V4 - nessuna INSERT diretta consentita
```sql
SELECT policyname, cmd FROM pg_policies
 WHERE schemaname = 'public' AND tablename = 'impact_transactions';
```
Atteso: **una sola** policy, `cmd = SELECT`. Nessun `INSERT`. L'inserimento passa solo
dalla funzione, che e' `SECURITY DEFINER` e controlla l'identita'.

### V5 - prova reale dal client
```sql
SELECT profile_id, co2_saved, liters_saved, tokens_earned, xp_earned, created_at
  FROM public.impact_transactions ORDER BY created_at DESC LIMIT 5;
```
Controllare che il check-in **non** mostri piu' "Impossibile completare la scansione"
(`index.tsx:606`) e che la riga finisca qui.

### V6 - il moltiplicatore e' davvero morto
```sql
SELECT public.process_esg_impact(p_co2 => 1.0, p_liters => 1, p_tokens => 1,
                                 p_xp => 1, p_party_size => 999999);
```
Poi:
```sql
SELECT co2_saved, liters_saved, party_size_reported
  FROM public.impact_transactions ORDER BY created_at DESC LIMIT 1;
```

**Atteso, e questa e' la parte che va capita:**

| colonna | valore | perche' |
|---|---|---|
| `co2_saved` | `1.0` | il `1.0` che hai chiesto, **non** `1000000` |
| `liters_saved` | `1` | idem |
| `party_size_reported` | `999999` | quello che il client **aveva chiesto** |

La riga registra `999999` accanto a `1.0`. **La discrepanza e' il risultato corretto**,
non un bug: mostra in una sola riga cosa il client pretendeva e cosa gli e' stato
concesso. Se `co2_saved` risultasse `1000000`, la neutralizzazione non starebbe
funzionando.

### V7 - anon non puo' eseguire la funzione
```sql
SELECT has_function_privilege('anon',
  'public.process_esg_impact(numeric,integer,integer,integer,boolean,integer,text)',
  'EXECUTE') AS anon_ha_execute;
```
Atteso: `anon_ha_execute = false`.

---

## 4. Cosa NON e' risolto, e va detto prima di dichiarare chiuso

Neutralizzare `party_size` chiude **l'amplificatore**, non **la forgia**.

`p_co2`, `p_liters`, `p_tokens` e `p_xp` arrivano **ancora dal client** e **non hanno
tetto**. Con questa funzione attiva, un client modificato puo' chiamarla da solo, senza
fare nessun check-in, e accreditarsi la cifra che vuole:

```ts
await supabase.rpc('process_esg_impact', { p_xp: 999999, p_tokens: 999999 })
```

Nessun filtro di prossimita', nessun cooldown, nessuna traccia sul percorso reale.

Questa vulnerabilita' e' **viva adesso** e l'ha attivata la migration di ieri: prima la
funzione non esisteva nella catena ufficiale e la chiamata falliva per il mismatch
`user_id` / `p_user_id`. Correggere la firma l'ha resa funzionante, e con lei l'accesso
diretto agli importi arbitrari. Il buco `auth.uid()` corretto ieri era il caso minore:
quello vero non era *a chi* si accredita, era *quanto*.

### La soluzione, quando si vuole affrontarla

`scan_poi_gps` e' l'unico posto dove gli importi sono calcolati **sul server**:

```sql
v_xp_awarded  := COALESCE(v_poi_data.xp_reward, 15);  -- dalla riga del POI
-- 2 se in movimento, 0 se su mezzo motorizzato
v_pti_awarded := 10;
v_co2_saved   := 1.5;
```

Non accetta cifre dal telefono, e filtra prossimita', velocita' e cooldown 12h
(`20260929160000` righe 184-195). E' quindi il posto giusto da cui accreditare.

Il percorso:

1. `REVOKE EXECUTE` su `process_esg_impact` per `authenticated` e `anon`, cosi' diventa
   interna e non e' piu' raggiungibile dal client.
2. `scan_poi_gps` la chiama internamente con gli importi calcolati lato server.
3. Il client chiama **solo** `scan_poi_gps`.
4. `process_esg_impact` diventa l'unico punto esecutivo di scrittura, ma con valori che
   il client non puo' scegliere.

Costo: si toccano le `GRANT`, la firma delle funzioni e il flusso del check-in lato
client. Va fatto **insieme** alle query cloud, o il check-in si rompe.
