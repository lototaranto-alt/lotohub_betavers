---
id: FEATURES-UX-E-GAMIFICATION
tipo: analisi
ambito: punto-4-features-ux-avanzate-e-gamification
stato: Vivente
confidenza: Alta
owner: Agent
aggiornato: 2026-09-29
evidenza:
  - components/PoiDetailSheet.tsx:795
  - components/PoiCard.tsx:50
  - components/CivicReportSheet.tsx:42
  - components/CivicDashboard.tsx:79
  - context/MobilityContext.tsx:127
  - supabase/archive_scattered_sql/ULTIMATE_RESTORE.sql:325
---

# Punto 4 — Features UX avanzate e gamification

## 0. Esito in apertura

| Claim | Esito |
|---|---|
| Soft-Sorting: percorsi calcolati su OSM + form cittadini | **NON IMPLEMENTATO** |
| Validazione community con conferma sul campo | **CONFERMATO a metà**, e in una copia che non gira |
| Banner sintetici di accessibilità in anteprima e scheda | **CONFERMATO**, su dati che non arrivano |
| Safe & Fast (ex Panic Mode), da congelare | **CONFERMATO: non esiste proprio** |
| Optimistic UI sull'impatto ambientale | **ROTTO: l'interfaccia è pessimista** |
| Ledger immutabile su `impact_transactions` | **ROTTO, e lo era già** (punto 1) |
| Rimozione sconti B2B individuali | **CONFERMATO** |
| Sezione Community con obiettivi comuni | **PARZIALE**: la bacheca c'è, gli obiettivi no |

Cinque claim su otto. E i due rotti — Optimistic UI e ledger — non sono nuovi difetti: sono
`Q15` e `A5-T2`, cioè lo stesso buco del punto 1 che qui si presenta come feature finita.

---

## 1. Soft-Sorting: due sistemi di accessibilità, nessuno collegato all'altro

Il claim descrive un modale di navigazione che incrocia tre fonti. Verifichiamo cosa ci sia.

### 1.1 Il modale di navigazione non sa cosa sia l'accessibilità

Il modale è `components/RouteSummarySheet.tsx`, montato da `map.tsx:16`. Riceve `mobilityType`
da `useMobility()` (riga 19) e `routePois` da `RouteContext`.

Ho cercato in entrambi i file ogni riferimento a `accessible`, `wheelchair`, `is_accessible`,
`soft`, `sort`, `quota`, `crowd`, `optimiz`. **In `RouteSummarySheet` non c'è nessuna occorrenza.**
In `RouteContext` ci sono due `filter`, entrambi per rimuovere un elemento dalla lista
(`:37`, `:52`), nessuno per accessibilità.

Quindi: il percorso non calcola nulla di accessibile. **Non esiste un algoritmo di soft-sorting.**
Non c'è niente da collegare.

### 1.2 Il flag accessibilità dell'utente non è un flag solo

Qui c'è il difetto più subdolo del punto, perché **due componenti leggono due fonti diverse e
nessuno scrive la seconda**.

Il FAB sulla mappa (`map.tsx:412-416`) chiama `toggleAccessibleMode()`, che scrive in
**AsyncStorage** sotto la chiave `loto_mobility_accessible` (`MobilityContext.tsx:127`).

La card, però, non usa quel flag. `PoiCard.tsx:50`:

```ts
const isAccessibleUser = userProfile?.accessibility_mode === true;
```

legge una **colonna del database**, `profiles.accessibility_mode`. E quel campo:
- **non è in `types/database.ts`** (zero occorrenze, insieme a `difficulty_score`);
- non è nella catena di migration viva;
- **nessuno lo scrive mai** — ho cercato in tutto `app/`, `components/`, `utils/`.

Quindi `isAccessibleUser` è **sempre `false`**, e il banner di avviso non compare **mai**. Il FAB
sembra funzionare (cambia colore) e non cambia niente.

E c'è di più: `accessibility_mode` è dichiarato **`BOOLEAN`** in cinque file
(`migration_v7_wizard.sql:12`, `RESTORE_DEFINITIVO.sql:766`, e tre `*_RESTORE`), ma **`TEXT`** in
`LOTO_RESURRECTION_FULL.sql:23`. Se il cloud ha preso la versione `TEXT`, il confronto
`=== true` in `PoiCard.tsx:50` è sempre falso **per ragione di tipo**, indipendentemente da chi
scriva. `Q26`.

### 1.3 Due nomi di colonna diversi per lo stesso concetto

Sulla tabella POI esistono due sistemi che non si parlano:

| Nome | Tipo | Dove | Stato |
|---|---|---|---|
| `pois.is_accessible` | `BOOLEAN DEFAULT true` | seed e viste (`20260715191000_SEED_DATA.sql:32`, `00_SETUP_ADMIN_DASHBOARD.sql:20`) | **in migration, zero consumer in `app/`** |
| `pois.is_wheelchair_accessible` | 3 stati | `PoiDetailSheet.tsx:795-811` | **usato dall'app, assente dalla catena viva** |

Il primo esiste nel DB e nessuno lo legge. Il secondo è quello che l'app mostra e **non è in nessuna
migration né in nessuno dei 63 export**. Non esiste un terzo nome, `accessibility_info`, che pure
l'app legge (`:804`) e che non è da nessuna parte.

Perché `tsc` passa senza errori: i campi che mancano sono su un oggetto che arriva da
`supabase` come `any`. **Il type-check non copre i dati che vengono dal database**, quindi qui
non può trovare nulla. È la stessa ragione per cui `crowd_level` ha due default diversi
(`A7-T9`): il tipo statico non vede la realtà del DB.

### 1.4 Il valore di default è scritto a mano sul nome del POI

`PoiCard.tsx:51`:

```ts
const isDifficult = (item.difficulty_score || (item.name?.includes('Castello') ? 80 : 20)) > 70;
```

`difficulty_score` **non esiste** in nessuna tabella. Quindi il fallback parte sempre, e la
difficoltà di un sito è decisa dal fatto che il nome contenga la parola **"Castello"**: 80, quindi
"sì, barriere". Tutti gli altri, 20, quindi "no, accessibile".

Questa riga è da rileggere adesso che hai letto §1.2: **un utente con mobilità ridotta viene
avvisato che un sito è inaccessibile in base a una sottostringa del suo nome**, e non gli viene
avvisato nulla in tutti gli altri casi. Il default silenzioso è "accessibile".

### 1.5 Il banner della scheda: vero, ma con un bottone morto

`PoiDetailSheet.tsx:794-812` è l'unica parte realmente implementata del claim UX, ed è fatta bene:
banner a tre stati (verde / rosso / grigio "Stato Sconosciuto"), icona coerente, e la dicitura
giusta quando non si sa niente — *"Aiuta la community a mappare questo luogo"*.

Ma il bottone **SEGNALA** è un `TouchableOpacity` **senza `onPress`** (righe 808-810). Verificato
guardando le righe: dentro ci sono solo `style` e un `<Text>`. Non è un componente morto per
dimenticanza di un handler, è un bottone che **non fa niente**.

E il claim chiede i banner "nell'anteprima **e** nella scheda". Nell'anteprima non ci sono: c'è il
banner di sfida architettonica di `PoiCard.tsx:77-82`, che è una cosa diversa — un avviso per
utente, non lo stato di accessibilità del luogo. **Le due schermate non mostrano lo stesso dato.**

---

## 2. Validazione community: la regola esiste, e non gira

Qui la notizia buona c'è, ed è una buona notizia rara in questa codebase: **la regola di
conferma fra cittadini è stata scritta bene**.

`check_for_match()` in `supabase/archive_scattered_sql/ULTIMATE_RESTORE.sql:325-359`, agganciata da
`trigger_match_report` (`:362`):

```sql
SELECT id, latitude, longitude INTO match_id, match_lat, match_lng
  FROM civic_reports
 WHERE grid_cell_50m = NEW.grid_cell_50m
   AND category = NEW.category
   AND status IN ('submitted', 'pending_match')
   AND id != NEW.id
   AND user_id != NEW.user_id            -- non ti auto-confermi
   AND created_at > now() - interval '7 days'
 ORDER BY created_at DESC LIMIT 1;

IF match_id IS NOT NULL THEN
    match_distance := SQRT(POWER(NEW.latitude-match_lat,2) + POWER(NEW.longitude-match_lng,2)) * 111000;
    IF match_distance < 50 THEN
        UPDATE civic_reports SET status='confirmed', matched_report_id=NEW.id, match_confidence=0.9 WHERE id=match_id;
        NEW.status := 'confirmed'; ...
```

Cinque proprietà corrette, e non sono banali: la stessa categoria, **esclude il se stesso**
(`user_id != NEW.user_id`), finestra di 7 giorni, controllo esplicito dei 50 m, e la riga
precedente viene aggiornata insieme a quella nuova, non solo la nuova. Il doppio consenso è reale.

### 2.1 Ma il trigger non è nella catena viva

`CREATE TRIGGER ... civic_reports` compare in 16 file, e sono **tutti** o in
`archive_scattered_sql/` o dentro i 63 export JSON. **Nessuna migration applicabile.** Come
`recover_loto_pass` nel punto 1: la funzione è nata a mano e non è mai entrata in Git.

Conseguenza diretta e verificabile: **`nessuno scrive mai `status = 'confirmed'`**. Ho cercato in
`app/`, `components/`, `utils/`: le due occorrenze sono entrambe **letture** di uno stato
(`CivicDashboard.tsx:112`, `CivicReportSheet.tsx:59`), nessuna scrittura. Se il trigger non gira,
`status` resta sempre quello messo dall'insert.

E il claim dice che le segnalazioni diventano ufficiali "**secondo le regole del form**" e dopo
"la convalida sul campo **da parte delle associazioni nodo**". Il form non ha nessuna regola di
validazione: scrive `status: 'pending'` e basta (`CivicReportSheet.tsx:50`). La validazione che
esiste è fra cittadini, non delle associazioni. **Le associazioni non compaiono da nessuna parte
in questo flusso.**

### 2.2 Due schemi `civic_reports` in conflitto, e il form sbaglia

`grid_cell_50m` (`ORIGINAL_MASTER_RESTORE.sql:214`, `RESTORE_DEFINITIVO.sql:218`) contro `grid_cell`
(`FIX_5_BUGS.sql:25`).

E i due componenti usano **nomi diversi**:

| Componente | Colonna | Commento nel codice |
|---|---|---|
| `CivicDashboard.tsx:83` | `grid_cell_50m` | — |
| `CivicReportSheet.tsx:47` | `grid_cell` | *"Adattato per coerenza col DB"* |

`CivicReportSheet` è il form principale, ed è quello che scrive sulla colonna che il trigger **non
guarda**. Quindi, se il trigger girasse, `CivicReportSheet` non confermerebbe mai niente: la
condizione `grid_cell_50m = NEW.grid_cell_50m` non può soddisfarsi su una riga che ha la colonna
diversa.

### 2.3 E il nome della colonna mente sul raggio

`grid_cell_50m` con `toFixed(3)`. Tre decimali di grado sono **circa 111 metri**, non 50. Verificato:
`40.4734` → `40.473`, delta 44,5 m; la cella utile è però 0,001° ≈ 111 m.

Quindi la griglia è un'approssimazione grossolana e il nome promette una precisione che non ha.
**Non è un bug**: il trigger controlla i 50 m veri con la distanza euclidea, quindi il risultato è
corretto. Ma il nome della colonna, che compare anche in `idx_civic_reports_grid`, promette una
griglia che non è quella.

### 2.4 Il +25 PTI è una promessa

`CivicReportSheet.tsx:86`: *"Un altro cittadino ha riscontrato lo stesso problema. **+25 PTI bonus!**"*
e `CivicDashboard.tsx:116`: *"(+25 PTI in arrivo)"*.

Nessuna delle due scrive un PTI. Sono stringhe. E i PTI si scrivono in `scan_poi_gps`, che
`:79-90` non chiama. Il "+25 PTI" mostrato al cittadino dopo una conferma che il trigger non
conferma è un premio annunciato e non consegnato.

---

## 3. Safe & Fast (ex Panic Mode)

**Non esiste.** Zero occorrenze di `panic_mode`, `panicMode` o "Panic Mode" in `app/`,
`components/`, `utils/`. L'unica menzione in tutto il repository è in un documento di pitch,
`.agents/rules/master_business_brief.md:29`, che è anche il file che si ricarica a ogni sessione.

La direttiva di sviluppo dice: *"se la logica è già parzialmente presente o codificata nel client,
non è una prioritità di questo blocco: va congelata e spostata nella Roadmap delle Feature
Future"*.

**Non c'è niente da congelare.** Il re-branding da "Panic Mode" a "Safe & Fast" è completo e senza
residui nel codice, perché il nome nuovo non è mai entrato da nessuna parte. La feature è già in
backlog per assenza di implementazione.

`A1-T8`, perché il claim in `master_business_brief.md:29` continua a essere ricaricato a ogni
sessione come se esistesse. **È l'unico punto del blocco che è già risolto**, e l'unico la cui
risposta è "non fare niente". `A1-T21`.

---

## 4. Shadow Validation

### 4.1 Optimistic UI: l'interfaccia è pessimista, non ottimista

Il claim chiede un "feedback reattivo in Optimistic UI". Il codice fa il contrario.

`PoiDetailSheet.tsx:128-165`, il check-in GPS:

1. `await supabase.auth.getUser()` — **attende**
2. `await supabase.from('profiles').select('total_xp')` — **legge il vecchio valore dal server**
3. `await supabase.rpc('scan_poi_gps', ...)` — **attende la scrittura**
4. `const newXp = data.new_total_xp` — **il nuovo valore torna dal server**
5. `calculateLevel(newXp)` e `queueEvents(...)`

Non c'è nessun valore ottimistico: ogni numero mostrato all'utente è **quello che il server ha
appena confermato**. Nessun `setState` ipotetico, nessun `+15` provvisorio, nessun rollback.

Il motivo è che `ImpactStatsModal` legge `userProfile?.total_co2` (`:64`), e l'unica sorgente di quel
numero è il DB. Per essere ottimistico servirebbe calcolare in locale la ricompensa — cosa che il
progetto non fa **apposta**, perché i valori dipendono da mobility type, cooldown e shadowban
calcolati dal server.

**Verdetto: il claim nomina una tecnica che il codice non usa, e usa una tecnica che il claim non
nomina.** Il risultato per l'utente è lo stesso in termini di affidabilità, ed è un risultato
buono: niente numeri che poi tornano indietro. Ma il claim, se preso alla lettera, promette una
reattività che l'app non ha.

### 4.2 Ledger immutabile: la stessa riga vuota del punto 1

Il claim dice: *"Ogni azione validata scrive un record immutabile ed evento-sorgente sulla tabella
`impact_transactions`"*.

Nel codice applicativo, `impact_transactions` compare **solo in lettura**:
- `index.tsx:347` — `.select('*')` per l'elenco utente
- `communityFeed.ts:35` — `.select` per il feed
- `dbAggregation.ts:19` — solo un commento

**Zero scritture.** E la tabella è a **0 righe** nel cloud, verificato in `ESITO-QUERY.md:40-42`, e
`scan_poi_gps` nel cloud non contiene l'`INSERT` (punto 1, `Q15`).

Quindi il claim è falso in due modi indipendenti: il client non scrive (e non dovrebbe, scrive la
funzione), e **la funzione viva non scrive**. Il ledger che si vende come asset non ha mai
contenuto una riga.

Aggiungo una precisazione che nel punto 1 non avevo annotata: l'`INSERT` c'è nella
`20260927090000` (`:150`) e scrive `source_event = 'scan'`, `co2_saved`, `xp_awarded`. Quindi
**l'implementazione esiste ed è giusta**: il problema è che la funzione in cloud non è quella.
`A5-T3` porta la catena dentro la funzione viva e risolve anche questo claim.

### 4.3 "Impatto ambientale calcolato immediatamente"

Il calcolo c'è ed è coerente con quello del punto 2: `user_pois.co2_saved` prende
`pois.base_co2` sul check-in pedonale e **zero** su quello veicolare
(`20260926120000:204-210`). La distinzione è giusta e la confermo anche da qui: chi arriva in
auto non genera CO2 risparmiata.

---

## 5. Sezione Community

### 5.1 Rimozione B2B individuale: `CONFERMATO`

Cercato `voucher`, `sconto`, `discount`, `redeem`, `riscatto`, `coupon` in `app/`, `components/`,
`utils/`: **un solo match**, `utils/mockEvents.ts:37`, ed è il testo descrittivo di un evento
mock ("Sconto Zero-Friction in piazza"). Nessuna logica, nessun riscatto, nessun partner.

Il claim è risolto, e coerente con `A2-T1` (ramo scontrino rimosso) e `A6-T3` (nessun dato di
terzi). **Da non perdere.**

### 5.2 La bacheca c'è, e legge la fonte giusta

`community.tsx:96-111` legge `vw_collective_impact` con un commento che vale la pena citare:

```ts
// somma reale di impact_transactions, mai coefficienti inventati nel client
```

**È la decisione giusta**, ed è l'unico posto del progetto in cui la regola è esplicitata. I
totali community non sono ricalcolati in locale con coefficienti inventati: vengono dalla vista,
che somma il ledger.

Ed è anche il punto più fragile del blocco: **la vista aggrega una tabella che ha 0 righe**
(`A5-T2`, `A3-T1`). Quindi la sezione Community è correttamente costruita su un ledger vuoto.
Non è un bug separato: è lo stesso buco, con un'ulteriore conseguenza. Se `impact_transactions`
resta vuota, la bacheca mostra zero e non c'è modo di distinguerlo da "nessuno ha ancora agito".

### 5.3 Gli obiettivi comuni non esistono

Il claim: *"L'accumulo dei punti si somma per sbloccare e raggiungere Obiettivi Comuni di impatto
sociale, civico e ambientale"*.

Le tabelle esisterebbero, e sono nominate bene: `collective_goals`, `goal_participations`.
Verificato: **`CREATE TABLE` in 7 file del repository, zero nella catena viva.**

E il componente che mostra i traguardi, `TraguardiModal`, non le interroga: prende tutto da props
(`:20` — `userBadges`, `userProfile`) e ha tre tab locali `livelli | badge | rank`. Non c'è nessuna
query a obiettivi collettivi in tutto `app/` e `components/`.

Quindi la somma **esiste** (è la vista), ma **non c'è nulla da sbloccare**. La funzionalità è a
metà: il collettivo è misurato, la ricompensa collettiva no. Manca l'intera metà finale, ed è
quella che dà senso al vincolo "i punti non hanno valore economico individuale".

---

## 6. Il verdetto di sintesi

Quello che il claim chiama **Soft-Sorting** non è una feature da completare: è un algoritmo che
non è mai stato scritto, in un modale che non conosce il concetto che dovrebbe ottimizzare.

Quello che chiama **Validazione Community** è la cosa meglio progettata del blocco, e vive in una
copia di ripristino che non gira, con un form che scrive sulla colonna sbagliata.

E i due claim che presentano come fatti — Optimistic UI e ledger — descrivono un'intenzione, non il
codice. Il ledger è vuoto, l'interfaccia è pessimista.

Tre dei cinque claim qui documentati riguardano cose che **non esistono in nessuna forma**, e due di
quelli riguardano il buco che avevamo già trovato. Il quarto, la validazione community, è l'unico
che merita di essere scritto, e per farlo basta portare in Git quello che c'è già.

**La riga che riassume il punto, e che vale per tutti e quattro:** in questo progetto il livello di
maturità decresce con la vicinanza al cliente. Il codice locale è curato, con commenti che spiegano
le scelte. Il database è il livello più fragile, perché è quello che non entra in Git. Ogni claim di
questo blocco che dipende dal DB è a rischio, e non per un caso: perché il DB vive fuori dal
repository da cui passiamo la metà del tempo.

## 7. Task nuovi

| # | Cosa serve |
|---|---|
| `A7-T10` | **Il flag accessibilità dell'utente è due flag.** Il FAB scrive in AsyncStorage, `PoiCard:50` legge `profiles.accessibility_mode`, che nessuno scrive e che è `BOOLEAN` in 5 file e `TEXT` in un sesto |
| `A7-T11` | **`is_accessible` vs `is_wheelchair_accessible` vs `accessibility_info`**: tre nomi, due sistemi, nessuno in catena viva. Scegliere il nome e scrivere la migration |
| `A7-T12` | **`difficulty_score` non esiste**: `PoiCard:51` decide l'accessibilità dal fatto che il nome contenga "Castello" |
| `A2-T7` | **`trigger_match_report` e `check_for_match()`** esistono in `archive_scattered_sql/`, non in catena viva. Portarli in Git |
| `A2-T8` | **`CivicReportSheet` scrive `grid_cell`, il trigger legge `grid_cell_50m`** |
| `A2-T9` | **Il "+25 PTI" delle conferme non è mai stato assegnato** |
| `A1-T21` | **Panic Mode in `master_business_brief.md:29`**: da rimuovere dal brief, il re-branding è già completo |
| `A2-T10` | **`collective_goals` e `goal_participations`**: la somma c'è, gli obiettivi no. Manca tutta la metà finale |
| `A1-T22` | **Le associazioni nodo non compaiono** nel flusso di validazione. Il claim le nomina, il codice no |

## 8. Domande nuove

- **`Q26`** — `profiles.accessibility_mode` è `BOOLEAN` o `TEXT` nel cloud? Se è `TEXT`, il
  confronto `=== true` in `PoiCard:50` non può mai essere vero. Serve per chiudere `A7-T10`.
- **`Q27`** — Su `civic_reports` la colonna si chiama `grid_cell` o `grid_cell_50m`? Determina
  quale dei due componenti è corretto, e se il trigger può funzionare (`A2-T8`).
