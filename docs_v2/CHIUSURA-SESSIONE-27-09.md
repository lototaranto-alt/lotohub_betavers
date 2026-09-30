---
id: CHIUSURA-SESSIONE-27-09
tipo: analisi
ambito: passaggio-di-sessione-per-ripresa-lavora
stato: Vivente
confidenza: Alta
owner: Agent
aggiornato: 2026-09-27
evidenza:
  - docs_v2/ANONIMATO-E-INTEGRITA-LEDGER.md:1
  - app/(tabs)/index.tsx:597
  - .agents/rules/master_business_brief.md:23
  - supabase/migrations/20260925120000_admin_dashboard_hardening.sql:113
  - supabase/pure_cloud_queries/62_untitled_query.sql:1
---

# Chiusura sessione 27-09 — il prossimo passo è una query, non un file

> Niente committato, niente pushato, nessuna scrittura sul cloud. `npx tsc --noEmit` pulito,
> validatore `docs_v2` pulito su 33 documenti. Questo file e' il punto di ripresa.

---

## 1. La prima cosa da fare, ed e' una query

**Non cominciare dal codice.** La prossima sessione si apre con `Q15`, e da li' dipende tutto il
resto. Senza la risposta non si sa se la catena GPS e' deployabile.

Nel dashboard Supabase, SQL Editor, sul project `fsuolbwsvpgiglwcaffh`:

```sql
SELECT p.proname,
       pg_get_function_identity_arguments(p.oid) AS args,
       p.prosecdef AS security_definer,
       pg_get_functiondef(p.oid) AS corpo
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('process_esg_impact', 'scan_poi_gps', 'recover_loto_pass')
ORDER BY 1, 2;
```

Il giudizio si da' su `corpo`, non su `args`:

- `security_definer = true` **e** il corpo confronta `auth.uid()` con l'utente ricevuto: sicuro,
  si procede con il piano.
- `security_definer = true` e il corpo **non** contiene `auth.uid()`: il ledger e' scrivibile da
  chiunque, per un profilo arbitrario. **La catena GPS non si deploya** finche' il controllo non
  c'e'. Punto 3 del piano bloccato.
- `security_definer = false`: rientra nel perimetro RLS, chiudi, si procede.

Il perche' della domanda e' in `docs_v2/ANONIMATO-E-INTEGRITA-LEDGER.md`, sezione 1.3.

---

## 2. Cosa e' stato fatto in questa sessione

**Rimosso il ramo scontrino** da `app/(tabs)/index.tsx`, `executeScan`. Nove righe, indipendenti
dal database. `p_iva`, `receipt_hash` e `receiptHash` non compaiono piu' in alcun file applicativo:
`p_iva` aveva un solo uso a runtime (quel `receiptHash`), `pec` non ne aveva nessuno. Le occorrenze
rimaste sono solo in `types/database.ts` e in `temp_backup_2/`, che non fa parte dell'app.

**Conseguenza da sapere:** `executeScan` ora non ha piu' nessun controllo di idempotenza, quindi
ogni chiamata su uno stesso POI `partner` riassegna 50 PTI e 50 XP. Non e' una regressione: il
controllo non partiva gia', perche' la colonna non esisteva e la `select` tornava `data = null`.
Ora e' pero' **dichiarato** invece che mimetizzato. Il posto giusto per il controllo e' lato
server, un UNIQUE o un check dentro la funzione, per `.agents/AGENTS.md` sezione 7. Va fatto
insieme a `Q15`, perche' `executeScan` chiama proprio `process_esg_impact`.

**Corretto `.agents/rules/master_business_brief.md:23`.** Tolte "impossibilita' matematica di
tracciare il singolo" e "compliance GDPR al 100%". Al loro posto: soglia k >= 5 su ogni rilascio,
il limite del differencing e della conoscenza laterale del commerciante, il divieto di report per
singolo esercizio, i bucket giornalieri per i commercianti, e la distinzione fra Agenzie (cliente
pagante) e Amministrazioni (destinatario finale). Corretti anche due errori di fatto sulla stessa
riga: la heatmap non e' una Materialized View ma una `CREATE VIEW`, e il destinatario era scritto
"PA / Comuni" mentre il cliente pagante sono le Agenzie.

**Scritto `docs_v2/ANONIMATO-E-INTEGRITA-LEDGER.md`.** Analisi k=5, stato del ledger, piano dei fix
in ordine, indice delle prove.

---

## 3. Le correzioni che cambiano il quadro

Da tenere a mente, perche' ribaltano affermazioni precedenti:

- **Il `GRANT ALL` ha un autore.** `supabase/pure_cloud_queries/62_untitled_query.sql` esegue
  `GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated,
  service_role`, col commento *"Riapplichiamo esplicitamente i permessi per sicurezza"*. E' quasi
  certamente l'origine dei grant trovati su `impact_transactions`, `profiles` e
  `vw_collective_impact`. Inferenza forte, non fatto: si chiude con `Q15`.
- **`vw_pois_frontend` e `scans` non sono orfane.** Sono in `supabase/pure_cloud_queries/`, 42
  export del SQL Editor. Non mancano: sono **fuori dalla catena**, che e' un rischio diverso e
  peggiore, perche' il cloud puo' essere stato modificato senza che il repository lo sappia.
  `62_untitled_query.sql` contiene anche il commento *"Ripristino la colonna tenant_id che era stata
  creata a mano su Supabase in passato"*.
- **La heatmap non e' esposta al pubblico.** `WHERE is_loto_admin()` e `REVOKE ALL FROM anon` in
  entrambe le viste. Il rischio e' interno. Il claim commerciale non ne sapeva niente.
- **Il "ledger e' al sicuro" era vero solo per meta'.** RLS senza policy chiude l'accesso diretto
  alla tabella, ma non chiude una funzione `SECURITY DEFINER` con l'identita' ricevuta come
  parametro. Le due righe vanno tenute separate, ed e' per questo che `Q15` esiste.
- **Due errori miei, gia' corretti:** avevo scritto che `b2b_feedbacks` e' orfana (esiste, in
  `supabase/migrations/20260822_create_b2b_feedbacks.sql`, ero stato troncato dalla ricerca), e che
  `k >= 5` sta a `hardening:316` (sta a **113**, e anche a **266** su una seconda vista).

---

## 3.1 Allucinazioni residue nel brief — NON AUDITATE, DA FARE

Il brief e' stato corretto **solo alla riga 23**. Il resto del file non e' stato verificato, e
contiene almeno cinque affermazioni false o non supportate. Elenco con la prova, perche' la prossima
sessione non deve rifare il lavoro.

| # | Riga | Cosa dice | Cosa c'e' davvero | Gravita' |
|---|---|---|---|---|
| A | 21 | "un **trigger** Anti-Cheat **sul database** **blocca** i check-in se la velocita' GPS supera i 130 km/h" | Non e' un trigger: e' un `IF` **dentro la funzione** `scan_poi_gps`. E la funzione **non e' deployata** (`20260927090000...:166`; `Q9` ha mostrato che il trigger v13 non esiste sul cloud). E non "blocca": sopra 130 km/h fa **shadowban**, la visita resta registrata con XP=0 e CO2=0, esclusa dai DaaS | **alta** |
| B | 22 | "Solo l'1% delle transazioni viene campionato contro le API esterne per validazione" | **Nessuna implementazione.** Nessun sampling in tutto il codice. Peggio: la stessa frase e' in `.agents/AGENTS.md` sezione 5, quindi l'agente la rigenera da sola | **alta** |
| C | 21 | "Tag NFC **Criptati (NTAG424)** ... la crittografia impedisce la clonazione e il Replay Attack" | L'NFC c'e', ma si legge **`NfcTech.Ndef`**, cioe' NDEF standard (`app/admin/nfc-setup.tsx:49`, commento dell'autore: *"Legge tag standard"*). NDEF non e' autenticato: **clonabile e replayabile**. Il crittogramma SUN dell'NTAG424 non e' implementato | **alta** |
| D | 15 | "Timer di Isteresi spaziale di **5 minuti**" | `utils/BackgroundLocationTask.ts:11`: `HYSTERESIS_TIMER_MS = 10 * 60 * 1000`, quindi **10 minuti** | bassa |
| E | 22 | "coefficienti statici (**ISPRA/DEFRA**)" | I coefficienti sono numeri hardcoded senza attribuzione (0,12 / 0,10 / 0,08 negli script del SQL Editor). Nessun riferimento a ISPRA o DEFRA nel codice | media |

Verificato e **vero**, per non rifare: `OfflineQueueManager` esiste davvero
(`utils/OfflineQueueManager.ts`, usato in `components/PoiDetailSheet.tsx`).

Da notare: la riga 16 ("l'app non chiede MAI email") e' vera nell'app viva, ma resta contraddetta
dal componente orfano `components/LotoPassBackupModal.tsx` e dalla colonna `profiles.email`, come
gia' registrato in `docs_v2/ANONIMATO-E-INTEGRITA-LEDGER.md`.

**Perche' conta piu' del GDPR.** Il brief e' in `.agents/rules/`, quindi e' input di sistema per
l'agente. Un claim falso li' non e' un errore di marketing: e' la regola che genera le prossime
affermazioni false, e si autoalimenta. Le righe B e C vanno corrette per prime.

---

## 4. DA FARE — la lista viva e' in `TASKS-PER-AREA.md`

**I task non stanno piu' qui.** Stanno in `docs_v2/TASKS-PER-AREA.md`, che e' l'indice unico: tutti
i subtask divisi per area `A1`-`A7`, con stato, blocchi e le dodici domande aperte. Questa sezione
esiste solo per l'handoff e non duplica niente.

### 4.1 Primo passo, ed e' l'unico che sblocca

- `[!]` **`Q15` — utente.** Query in sezione 1. Decide se `process_esg_impact` e' scrivibile da
  chiunque. **Niente del ramo GPS si fa prima di questo**, e i task che blocca sono `A3-T2`,
  `A2-T2`, `A5-T2`. Se il corpo non contiene `auth.uid()`, aggiungere il controllo non e'
  opzionale: e' il lavoro successivo.

### 4.2 Cosa spostato nell'indice

Tutto il resto. I dodici quesiti per l'utente stanno in `TASKS-PER-AREA.md` sezione 3, ordinati per
quando bloccano: `Q1` conferma di priorita' sul blocco del ledger, `Q2` come togliere colonne dalle
viste, `Q3` se tutti i POI restano pubblici, `Q4` se i 63 export del SQL Editor sono la fonte di
verita'. Rispondere anche solo a `Q1`-`Q4` e la sessione ha gia' una direzione.

### 4.3 Non rifare

- Il ramo scontrino e' **gia' rimosso** (`A2-T1`). Non ricercarlo in `index.tsx`.
- Il claim GDPR e' **gia' corretto** (`A1-T9`).
- Le correzioni della sezione 3 sono **gia' applicate**. Non riaprire `b2b_feedbacks` ne' la
  referenza di `k >= 5`: sono entrambe a posto.
- Non riapplicare `migration_v22/23/24`: duplicano la hardening e fallirebbero rumorosamente.
- Non applicare il fix `??` -> `||` in `utils/dbAggregation.ts:35`: maschera il ledger, viola l'SSOT.
- Non deployare la catena GPS prima di `Q15`.

---

## 5. Due avvertenze sul working tree

**`utils/dbAggregation.ts` non e' tracciato in git, ma `app/(tabs)/index.tsx` lo importa.** Se si
committano solo i file tracciati, la build si rompe. E' un problema di igiene, non di logica:
o si aggiunge il file, o si annulla l'import.

**Le modifiche a `index.tsx` e `app/_layout.tsx` che chiamano `enrichProfileWithDbMetrics` non sono
di questa sessione.** Erano gia' in coda prima di cominciare. Non usarle come riferimento per capire
cosa e' stato fatto adesso.

---

## 6. Cosa non fare

- Non riapplicare `supabase/migration_v22_daas_vendite.sql`, `migration_v23_prestige_card_metrics.sql`
  o `migration_v24_app_telemetry.sql`. Sono duplicati non tracciati di oggetti che stanno gia' nella
  hardening. Usano `CREATE VIEW` senza `OR REPLACE`, quindi fallirebbero rumorosamente: non
  applicarli e' corretto, e il fallimento rumoroso e' una buona difesa.
- Non deployare la catena GPS prima di `Q15`.
- Non committare `docs_v2/` senza decisione esplicita.
- Non applicare il fix `??` -> `||` in `utils/dbAggregation.ts:35`: maschera il ledger e viola l'SSOT.
- Non toccare `impact_transactions` via il client per aggirare l'RLS.
