---
id: R5
tipo: regola
ambito: criteri-di-scelta-strutturale-e-priorita-delle-evidenze
stato: Vivente
confidenza: Alta
owner: Agent
aggiornato: 2026-09-26
evidenza:
  - brain/edf3a8e6/CORE_MECHANICS.md
  - brain/fb161e9d/logiche_proprietarie.md
  - brain/ad0b58e2/LOTO_4_TIER_ARCHITECTURE.md
  - .agents/AGENTS.md:5
  - .agents/AGENTS.md:36
---

# R5 - I criteri che il progetto ha sempre applicato, e come si sceglie fra documenti che si contraddicono

> Risponde a: "dato che la documentazione si contraddice, **come** si sceglie? E quale gerarchia
> applicare quando due opzioni sono entrambe plausibili?"

Questa regola e' l'unica che si ricava da 579 documenti analizzati. Non e' quello che il progetto
*dice* di fare: e' quello che il progetto *ha fatto*, controllando le rinunce.

---

## 1. I dieci criteri che il progetto ha dimostrato di seguire

Ogni criterio e' supportato da almeno una decisione effettivamente presa. Un criterio senza una
decisione che lo dimostra non e' un criterio: e' una frase.

### C1 - La rinuncia batte l'aggiunta
Il progetto ha **motivato** piu' di quanto ha costruito, e la motivazione ha quasi sempre vinto.
Le rinunce documentate: niente UGC (motivo: *"costi di storage non sostenibili, complessita' legali
GDPR sui volti"*), niente recensioni pubbliche (motivo: *"tossicita' B2B"*), niente classifica
pubblica (motivo: *"nessuna competizione tra utenti"*), niente dashboard per il partner (motivo:
*"attrito tecnologico"*), niente N build (motivo: *"azzerare i costi di manutenzione"*), niente
richiesta camera/galleria all'avvio, nessun NFC sui monumenti pubblici (motivo: *"collo di bottiglia
hardware"*).

**Test:** se una funzione richiede hardware costoso, registrazione obbligatoria o viola la privacy,
la risposta di default e' **no**. La regola e' scritta in `knowledge_recovery_guide.md` e coincide
con `AGENTS.md` §1, §2, §3.

### C2 - Il costo marginale zero e' il pilastro, non un obiettivo
Zero-IoT, Shadow Validation con campionamento all'1%, nessuna API esterna per la CO2, un solo binario
universale. Questo non e' un risparmio: e' **il modello**. Un euro di costo marginale per utente
distrugge la proposizione di valore per l'agenzia, che è `AGENTS.md` §5.

**Test:** "quanto costa questo in scala?" Se la risposta non e' zero oggi e marginale domani, la
funzione va tagliata o accodata.

### C3 - Il database e' la SSOT, il frontend non calcola
Ripetuto in ogni documento di architettura: *"il frontend e' stupido"*, *"la UI non deve mai
calcolare i propri XP"*. **Violato ripetutamente nel codice** — da ultimo con `utils/dbAggregation.ts`
e i valori XP hardcoded in 6 file (vedi A2).

**Test:** nessuna formula di business nel componente. Se serve un dato, si chiede a una vista o a
una RPC.

### C4 - Zero-Coercion: nessuna competizione, nessuna gerarchia tra utenti
Nessuna classifica, nessun PvP, nessun "mayorship" territoriale, nessuna penalita' per il
principiante. Ogni volta che un documento ha proposto competizione e' stato negato: la "Classifica di
Condotta" di `technical_business_analysis` e' stata respinta dal Masterplan dichiarato "APPROVATO E
CONGELATO".

**Test:** nessuna funzione deve mettere due utenti in relazione gerarchica o competitivo.

### C5 - Zero-PII non e' un parametro, e' un vincolo di architettura
Non "preferiamo", non "dove possibile". Il backup via email e' stato documentato a luglio
(`LOTO_HUB_SSOT_DEFINITIVO.md` §1 "Opzione B") e **rimosso il 21/09** (`bc37c59`) con la tua frase:
*"per mantenere l'app purissima, velocissima e inattaccabile dal punto di vista legale sulla
privacy. Solo QR Code locale"*.

**Test:** se una funzione richiede PII, la funzione si progetta diversamente. Non si chiede il
permesso di farlo.

### C6 - La progressiva disclosure governa l'UI, ma non il contenuto
Le sezioni si aprono con i livelli; i **POI restano sempre consultabili**. Gate per livello solo sui
**media** (`required_level`). E' la differenza tra "protezione del contenuto" e "protezione
dell'esplorazione": la seconda non e' ammessa.

### C7 - Il target pagante e' l'agenzia, mai il Comune
Quattro documenti su quattro dicono *"non vendiamo ai Comuni, vendiamo a chi ha i contratti dei
Comuni"*. Un solo documento (`master_blueprint`) dice *"fatturazione diretta alle municipalizzate"*:
e' l'eccezione, non la regola.

### C8 - Il codice batte il documento, sempre
Verificato 8 volte in questa analisi. Esempio canonico: quattro documenti descrivono 3, 4, 5 o 10
tier; il codice ne ha **5** rank da 10, e il codice era gia' corretto il 15/09.

### C9 - Niente segreti nei nomi
I materiali metallici (Bronzo, Argento, Oro, Platino) sono stati **esclusi dai nomi** per scelta
esplicita: *"come da regole, e' stato accuratamente omesso qualsiasi riferimento a materiali
comuni"*. E' una scelta di positioning, non una dimenticanza.

### C10 - Ogni argomento ha una casa
Violato in modo sistematico in v1, e' la causa di questo intervento. E' la Legge 1.

### C11 - Ciò che gira nel cloud è dichiarato in Git
*Critero aggiunto il 26/09/2026, su proposta di `PianoOperativo-26-09.md` §8, verificato e
adottato qui come unico luogo dei criteri.*

Un oggetto che funziona in produzione ma che nessuna `supabase/migrations/` definisce **non è un
asset: è un debito**. Test: *"c'è un oggetto in produzione che non è in nessuna migration?"*. Se sì,
non è un dettaglio.

**Verificato con due casi reali:** `vw_pois_frontend` e `vw_collective_impact` esistono nel cloud,
entrambe interrogate dal frontend, **zero definizioni in `supabase/migrations/`**. Una ricostruzione
fedele dell'ambiente è oggi impossibile.

### C12 - Una sessione che finisce senza commit è una sessione fallita
*Critero aggiunto il 26/09/2026, su proposta di `PianoOperativo-26-09.md` §8, verificato e
adottato qui.*

Test: *"se il disco si cancellasse adesso, ho perso qualcosa?"*.

**Estensione verificata il 26/09, che rende il criterio più grave di quanto sembrasse:** `android/`
è in `.gitignore` (riga 44: `/android`). `git ls-files android` restituisce **0 file**. Quindi:

- `android/app/build.gradle` — che contiene `versionName "1.0.7"` e `versionCode 9` — **non è in Git**
- L'intero progetto di build Gradle, che è ciò che produce l'APK, **non è versionato**
- La build **non è riproducibile dal repository**: serve un `expo prebuild` che rigenera tutto

Questo non è un caso isolato: è la prova che **C12 senza C11 non basta**. Il file era sul disco, non
perso, ma nessuno lo aveva mai versionato. Il rischio è identico, il dolo è zero.

### C13 - Lo stato corrente si legge dal file, mai da un commit
*Critero aggiunto il 26/09/2026, su un mio errore.*

Questo criterio nasce da un errore mio, dichiarato. In `A5_app_mobile.md` avevo scritto *"Release
corrente: 1.0.2, versionCode 4"* citando il messaggio di commit `16d5460`. Il file dice altro:

| Fonte | Dice |
|---|---|
| `git show 16d5460` (messaggio di commit) | 1.0.2, versionCode 4 |
| `android/app/build.gradle` (**il file**) | **`versionName "1.0.7"`, `versionCode 9`** |
| `app.json` (**il file**) | **`version: 1.0.7`** |

Il mio verdetto era sbagliato perché avevo trattato un messaggio di commit come una prova di stato
corrente. Un commit descrive **un momento**, e il momento più recente non è il presente.

Test: *"ho letto il file o ho letto qualcuno che lo aveva letto prima?"*. Vale per versioni, conteggi,
stati di feature, nomi di file. E vale per i **miei stessi documenti**: se `docs_v2` dice una cosa e il
file ne dice un'altra, **il file ha ragione e il documento è da correggere** — che è C8 applicato a me.

---

## 1bis. Nota sul collocamento dei criteri

I criteri vivono **solo qui**. `PianoOperativo-26-09.md` §8 li ha proposti: sono stati verificati e
adottati in questa regola, che ne diventa l'unica casa (Legge 1, criterio C10). Quel documento li
cita, non li possiede.

---

## 2. Come si sceglie fra due documenti che si contraddicono

Ordine rigido, applicato in sequenza. La prima regola che produce un verdetto vince.

| # | Test | Esempio applicato in questa ricostruzione |
|---|---|---|
| 1 | **Il codice esiste?** Se si', il codice vince | 5 rank da 10 (codice) batte 3, 4, 5 e 10 tier (documenti) |
| 2 | **Il codice e' stato applicato?** Se e' solo committato e non applicato, il codice dice l'intenzione, non il fatto | cooldown 12h: definito nella catena canonica, non ancora applicato su cloud |
| 3 | **Qual e' piu' recente NEL TESTO?** Non nel nome del file: in questo progetto i suffissi `_YYYY-MM-DD` mentono | 5 rank da 10 confermati da una chat dell'8/09 *e* del 15/09 |
| 4 | **Quante fonti indipendenti lo sostengono?** | 3 documenti dicono BLE 3 secondi, 1 dice 5: vince 3 |
| 5 | **Il documento che si dichiara SSOT e' smentito?** Se si', perde l'autorita' e il contenuto | `LOTO_HUB_SSOT_DEFINITIVO.md` perde per `esg_raw_logs` e per il backup email |
| 6 | **Il codice e' in contraddizione con se stesso?** Allora e' un bug, e il codice non decide | la detection level-up doppia: nessuna delle due vie e' corretta per definizione |

**Se i test finiscono senza verdetto**, il conflitto si dichiara e va in `DECISIONI.md`. Non si
sceglie a caso e non si media: la media delle opzioni sbagliate e' un'opzione sbagliata.

## 3. Le tre regole che rendono l'analisi ripetibile

**a) Mai un documento senza una data interna.** Se non c'e', non si usa per la priorita'. E' il caso
di `LOTO_DB_PRODUCTION_MAP.md`, che pure si dichiara SSOT: e' stato usato per la struttura, non
per la priorita'.

**b) Mai un documento che si dichiara SSOT senza verifica.** Quattro documenti lo fanno. Il titolo
non e' una prova. Verifica sempre il primo oggetto citato contro il codice.

**c) Ogni volta che l'analisi sbaglia, la correzione resta.** Un errore corretto e non riportato
torna. Per questo le rettifiche del 26/09 sono in `RICOSTRUZIONE.md` §5.

## 4. Cosa succede se nessun criterio si applica

La domanda non e' *"quale documento e' giusto?"* ma **"quale struttura regge i criteri C1-C10?"**.

Si genera una nuova opzione. E' il caso della struttura di validazione: nessun documento coincide
con l'implementazione, e la risposta non era recuperare il documento giusto ma derivare la
struttura che rispetta C1, C2, C6 e C8 insieme. Il risultato e' in
`docs_v2/aree/A7_struttura_esperienza.md`.

**Questa e' la parte che "impara": non si cerca il documento vincente, si cerca la struttura la cui
esistenza e' giustificata dai criteri che il progetto ha gia' dimostrato di seguire.**

---

*Regola R5. I criteri sono ricavati dalle rinunce, non dalle dichiarazioni. Un criterio che nessuna
decisione ha mai applicato non e' un criterio del progetto.*
