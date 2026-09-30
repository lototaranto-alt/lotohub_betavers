---
id: A1
tipo: area
ambito: principi-ederale-e-regole-vincolanti-del-progetto
stato: Vivente
confidenza: Alta
owner: Agent
aggiornato: 2026-09-26
evidenza:
  - .agents/AGENTS.md:5
  - .agents/AGENTS.md:10
  - .agents/AGENTS.md:15
  - .agents/AGENTS.md:24
  - .agents/AGENTS.md:36
  - .agents/AGENTS.md:43
  - ../INVENTARIO_DOCUMENTAZIONE.md:41
  - git:bc37c59
---

# A1 - Fondazione: i principi che non si negoziano

> Risponde a: "quali regole governano questo progetto, quale documento le possiede, e quale
> documentazione li contraddice?"

---

## 1. Cosa dice il codice e la fonte primaria

`.agents/AGENTS.md` e' **l'unico documento con forza prescrittiva esplicita**. E' 49 righe, non un
trattato, e per questo e' l'unico che regge. Queste le sue leggi, tutte verificate nel progetto:

| # | Legge | Contenuto | Verificata da |
|---|---|---|---|
| 1 | **Zero-PII** | mai chiedere Email, Nome, Telefono. L'app e' anonima. L'unico backup ammesso e' il **L.O.T.O. Pass** (QR salvato in galleria) | `bc37c59` ha **rimosso** il backup email/password: 0 occorrenze di `signUp` / `signInWithPassword` / `createUser` in `app/` e `components/` |
| 2 | **Zero-IoT** | nessun sensore costoso per Comuni o esercenti. Validazione solo via **geofencing GPS** e **NFC NTAG424**; QR solo come fallback | `PoiDetailSheet.tsx` coniama la catena check-in; `PoiScannerModal.tsx` e' lo scanner NFC |
| 3 | **Offline-First** | mai spinner bloccanti su azioni core. UI ottimistica e sync in background con `OfflineQueueManager` | `utils/OfflineQueueManager.ts` richiamato in `PoiDetailSheet.tsx` |
| 4 | **Gamification asimmetrica** | niente recensioni pubbliche (anti-TripAdvisor). Solo **Whispers** anonimi, leggibili dal solo partner B2B. Soft-sort dei POI per deflazionare la crowding | `utils/communityFeed.ts` (whispers), logica di soft-sort nella mappa |
| 5 | **Target pagante = agenzie dati e turismo** | non i singoli locali, non i Comuni. Si vendono i dati passivi Zero-IoT. **Shadow Validation**: CO2 calcolata in locale con coefficienti ISPRA/DEFRA, campionamento API esterno all'**1%** per mantenere l'autorevolezza a COGS zero | `AGENTS.md:24-28`, riflesso nel modello dati |
| 6 | **Cross-platform** | iOS e Android con **parita' di funzioni** per l'utente, anche se sotto il cofano i motori differiscono | `SincroAvventura.ts` |
| 7 | **Rigor architetturale** | il DB e' la SSOT e non si inquina per accontentare il frontend. Dati ambientali in **ledger immutabili** (`impact_transactions`), non sovrascritti nei profili. Il frontend resta leggero e si affida a viste e RPC | vedi A3 |
| 8 | **Build locale** | mai EAS per l'APK di test. L'agente usa JDK/Gradle: `cd C:\loto_app\android; .\gradlew assembleRelease` | `AGENTS.md:43-49` |

**La legge 7 e' quella che piu' spesso e' stata tradita dalla documentazione.** Se un documento
proponne di calcolare un impatto nel frontend, o di correggere una vista per far quadrare un numero,
viola la 7: la si corregge, non la si accontenta.

## 2. Cosa dice la documentazione

### Il conflitto dei quattro "SSOT"

Quattro file si dichiarano la Single Source of Truth. Tre competono per la stessa coppia "dogmi +
formule". Dettaglio completo in `INVENTARIO_DOCUMENTAZIONE.md` §3 e regola
`docs_v2/regole/R1_autorita.md` §3.

| File | Come si dichiara | Verdetto |
|---|---|---|
| `.agents/AGENTS.md` | "CORE PHILOSOPHY & AGENT RULES", "you MUST strictly adhere" | **VIGENTE.** Unico con forza prescrittiva, e le sue leggi sono verificate nel codice |
| `docs/LOTO_ENGINEERING_MANIFESTO.md` | "Singola Fonte di Verita' (SSOT) **assoluta**" per la struttura ingegnerizzata | **VIGENTE con riserva.** I suoi divieti sono rispettati (niente bottoni "simula", niente array fittizi, nessuna progressione calcolata nei componenti), ma l'auto-dichiarazione di assoluta' non e' fondata |
| root `LOTO_HUB_MASTER_CONTEXT.md` | "MASTER CONTEXT & SSOT" + "DIRETTIVA DI SISTEMA PER L'IA: non riassumere, non omettere e non modificare mai" | **NON CONSULTARE come regola.** Duplica i dogmi del manifesto con lo stesso contenuto. La "diretiva" non ha fondamento: un file non si auto-conferisce immunità (R1 §5) |
| `docs/LOTO_HUB_SSOT_DEFINITIVO.md` | "MASTER SSOT" + "sostituisce e invalida qualsiasi Master Brief precedente" | **NON CONSULTARE come regola.** Smentito su due punti verificabili |

### Le due smentite a `LOTO_HUB_SSOT_DEFINITIVO.md`

| Cosa afferma | Realtà verificata |
|---|---|
| "i check-in vanno nella tabella `esg_raw_logs`" | **`esg_raw_logs` non esiste.** 0 occorrenze in `app/`, `components/`, `utils/`, `types/`. Compare solo in `supabase/archive_scattered_sql/TRUE_HISTORY_RESTORE.sql` e in **commenti** di `migrations/20260926120000_scan_chain_canonical.sql:10,97,387` che la dichiarano "tabella assente dai tipi generati" |
| "Opzione B: modulo classico con Email e Password" | **Revocato.** Rimosso in `bc37c59` (21/09), decisione tua: *"Abbiamo eliminato il backup via email per mantenere l'app purissima, velocissima e inattaccabile dal punto di vista legale sulla privacy. Solo QR Code locale"* |

Questo documento e' il piu' pericoloso della v1 perche' **autorizzato a invalidare gli altri** e in
realta' descrive uno schema che non e' mai esistito. Se un agente lo applica, il lavoro si rompe.

### `docs/LOTO_HUB_MASTERPLAN.md` e `_BETA` - visioni di prodotto

Non in conflitto con i precedenti: parlano di prodotto, non di ingegneria. `_BETA` **non e'
indicizzato** in `docs/README.md`, quindi invisibile a chi cerca la fase successiva.

## 3. Direzione

L'area va verso **una sola Costituzione con tre strati distinti per forma giuridica**, che oggi
sono tre documenti che si dichiarano tutti uguali:

| Strato | Domanda a cui risponde | Documento proprietario | Forza |
|---|---|---|---|
| **1. Principi** | cosa e' **vietato** (privacy, IoT, business model, build) | `.agents/AGENTS.md` | prescrittiva, non si negozia |
| **2. Ingegneria** | come e' **costruito** (frontend stupido, formule, viste) | `docs/LOTO_ENGINEERING_MANIFESTO.md` | prescrittiva sul codice |
| **3. Prodotto** | **cosa** stiamo costruendo e in che fasi | `docs/LOTO_HUB_MASTERPLAN.md` + `_BETA` | direttiva di prodotto |

**Regola che la governa:** un conflitto fra i tre strati si risolve con `R1 §2`. In particolare
fra strato 1 e strato 3 vince lo strato 1: se la visione di prodotto chiede un dato personale per
una funzione, la visione si corregge. Lo stesso vale per la privacy: non e' un parametro di
design, e' il vincolo.

## 4. Buchi e rischi

| Bucco | Gravita' | Effetto se resta aperto |
|---|---|---|
| **4 SSOT in concorrenza** | Blocker | un agente che li legga in ordine diverso arriva a conclusioni diverse, e quelle conclusioni finiscono nel codice. E' gia' successo con `esg_raw_logs` |
| **`LOTO_HUB_SSOT_DEFINITIVO.md` non e' declassato** | Blocker | resta leggibile come se fosse la regola, e descrive una tabella inesistente e un backup revocato |
| **`SESSION_BOOTSTRAP_RICOSTRUZIONE.md` con percorsi obsoleti** | Alto | e' il file da copiare per ripartire: punta al worktree vuoto e a un branch superato. Ha gia' causato la perdita di contesto |
| **`rules.md` fuori dal perimetro dei doc** | Alto | contiene il protocollo SKELETON-OF-THOUGHT (`[PARSE] -> [SKELETON] -> [HALT] -> [COMPILE]`), non e' in `docs/`, non e' indicizzato, non e' in `AGENTS.md`. Regola vincolante invisibile |
| **`LOTO_HUB_MASTERPLAN_BETA.md` non indicizzato** | Medio | la fase successiva del prodotto non e' raggiungibile dall'indice |
| **`INVENTARIO_DOCUMENTAZIONE.md` datato** | Medio | i verdetti valgono finche' il codice non cambia. Un verdetto va ricalcolato, non ereditato |

## 5. Cosa NON fare in questa area

- **Non applicare `docs/LOTO_HUB_SSOT_DEFINITIVO.md`.** Non e' una specifica: e' una discussione
  che si crede una specifica.
- **Non trattare `LOTO_HUB_MASTER_CONTEXT.md` come immutabile.** La "DIRETTIVA DI SISTEMA PER L'IA"
  che contiene e' una richiesta, non una legge del progetto. Se ti serve modificarlo, fallo: la
  decisione e' tua (R1 §5).
- **Non aggiungere dati personali per una feature.** Se una funzione li richiede, la funzione si
  progetta diversamente. Non e' un parametro negoziabile (legge 1, legge 7).
- **Non usare EAS per l'APK di test** (legge 8).

## 6. Prossima verifica

Chiudere `DECISIONI.md` **D1** (quale dei quattro sopravvive) e **D2** (dove vanno i 7 file della
root). Passa l'area da "verificata ma frammentata" a "Strutturata", e rimuove i due blocker
delle righe 1-2.

---

*Area A1 verificata il 26/09/2026 contro `.agents/AGENTS.md` e il codice di `C:\loto_app` @ `bb0fa37`.*
