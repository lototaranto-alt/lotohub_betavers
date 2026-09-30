---
id: INDICE-LOTO-MAP
tipo: indice
ambito: loto-map-struttura-a-punti
stato: Vivente
confidenza: Alta
owner: Agent
aggiornato: 2026-09-29
evidenza:
  - docs_v2/loto_map/01-onboarding-identita.md:1
  - app/_layout.tsx:58
  - components/LotoPassRecoveryScanner.tsx:46
---

# L.O.T.O. Map — struttura a punti

> Questa cartella riceve la struttura di L.O.T.O. Map **un punto alla volta**, nella forma in cui
> arriva, e ne verifica ogni affermazione contro il codice prima di registrarla. Un punto non e'
> "documentato" quando e' scritto: e' documentato quando ogni claim ha un esito.

## Perche' esiste

La cartella affianca il lavoro sulla **ricostruzione del DB** (segmenti S0-S6 in
`TASKS-PER-AREA.md`) a quello sul **lato app**. Sono due facce dello stesso oggetto: il DB dice
cosa l'app promette, il codice dice cosa l'app mantiene. Finche' non coincidono, almeno una delle
due racconta una bugia.

C'e' una sessione NotebookLM aperta in parallelo per valutare se il DB vada aggiornato o
riallineato. Questa cartella e' il contralto applicativo: quando arriva un verdetto da lato DB,
qui si verifica che l'app lo sappia davvero.

## Regola di questa cartella

Nessuna claim entra come "vero" senza una riga `path:line`. I tre esiti possibili:

| Esito | Significato |
|---|---|
| **CONFERMATO** | Il codice lo fa, alla riga indicata |
| **SOVRADIMENSIONATO** | Il codice lo fa solo in parte, e il testo promette di piu' |
| **ROTTO** | Il codice non lo fa, o lo fa a meta' |

L'ultimo esito e' il piu' utile di tutti. Un claim "sovradimensionato" che passa per vero e' il
modo piu' economico di costruire un prodotto che non regge.

## Stato dei punti

| # | Punto | Esito | Documento |
|---|---|---|---|
| 1 | Onboarding & Identita' (Zero-PII) | **2 confermati, 1 rotto** | [`01-onboarding-identita.md`](01-onboarding-identita.md) |
| 2 | Il Motore "Camaleonte" (Multi-Tenancy) | **architettura reale, cablaggio a meta'** | [`02-motore-camaleonte.md`](02-motore-camaleonte.md) |
| 3 | Interazione "Zero-IoT" e sincronizzazione offline | **1 confermato e incompleto, 2 rotti, 1 buco non dichiarato** | [`03-zero-iot-e-offline.md`](03-zero-iot-e-offline.md) |
| 4 | Features UX avanzate e gamification | **3 su 8 confermati, 2 rotti, 3 non implementati** | [`04-features-ux-e-gamification.md`](04-features-ux-e-gamification.md) |
| — | Formule e validazione (trasversale) | **4 confermate, 2 discordanti, 3 non implementate** | [`../FORMULE-PROPRIETARIE.md`](../FORMULE-PROPRIETARIE.md) |
| 5 | _in attesa_ | — | — |

## Punti gia' aperti

Dal **punto 1**:

- ~~**`Q16`**~~ — **chiusa il 27/09.** La funzione di recupero nel cloud scrive e ricongiunge
  (`ESITO-QUERY.md:51-52`). Non era un buco di scrittura: era che il client scarta la risposta e
  che la funzione non è in Git.
- **A1-T10** — portare `recover_loto_pass` in Git e far leggere al client la risposta che la
  funzione già produce.
- **A1-T11** — archiviare `components/LotoPassBackupModal.tsx`, che reintroduce email e password e
  non e' importato da nessuna parte viva.

Dal **punto 2**:

- **`Q17`** — `tenants.id` e' un UUID o un testo? Se e' un UUID, una delle tre query sui POI filtra
  una colonna di slug e restituisce zero righe **senza errore**.
- **A7-T4** — l'auto-switch da GPS e' commentato fuori: o si riattiva, o si cancella.
- **A7-T7** — scegliere `id` o `slug` come chiave. Prima questo, poi tutto il resto.
- **A7-T8** — il sottosistema tenant non e' nelle migration. E' la forma piu' concentrata del
  problema S1.

Dal **punto 3**:

- **`Q24`** — il proximity gate è stato perso di proposito o per sostituzione? Prima si ripristina
  (`A3-T12`), poi si decide il raggio.
- **`Q25`** — la coda offline deve poter accreditare check-in retroattivi? Oggi il tempo lo decide
  il server, quindi un check-in offline prometterebbe all'utente qualcosa che il sistema registra in
  modo diverso (`A2-T6`).
- **`A3-T12`** — **la distanza dal POI non viene più controllata.** È il buco più serio emerso
  finora, e non è nel testo del claim: è sparito quando una migration ha riscritto il corpo della
  funzione.
- **`A5-T7`…`A5-T10`** — il ramo NFC è cablato a metà, e la coda offline non crittografata,
  non avviata e senza fallback per i check-in.

Dal **punto 4**:

- **`Q26`** — `profiles.accessibility_mode` è `BOOLEAN` o `TEXT`? E su `civic_reports` la colonna è
  `grid_cell` o `grid_cell_50m`? I due disallineamenti che rendono muti il blocco Accessibilità e la
  Validazione Community.
- **`A7-T10`** — il flag accessibilità dell'utente è **due flag che non si parlano**: il FAB scrive
  in AsyncStorage, la card legge una colonna DB che nessuno scrive. Il banner dell'anteprima non
  compare mai.
- **`A7-T11`** — tre nomi diversi per l'accessibilità del POI, due sistemi disgiunti, nessuno dei due
  in catena viva.
- **`A2-T7`** — la regola di Validazione Community è scritta bene e **non gira**: sta in
  `archive_scattered_sql/`, e nessuno scrive mai `status = 'confirmed'`.
- **`A2-T10`** — la sezione Community **somma** ma non ha **obiettivi** da sbloccare. Manca tutta la
  metà finale.

## Documentazione trasversale

Non e' un punto dell'app, ma tocca tutti i punti, quindi sta qui per non restare orfana:

- **[`../NOTEBOOKLM-BRIEFING.md`](../NOTEBOOKLM-BRIEFING.md)** — **il file da girare a NotebookLM.**
  Autosufficiente per costruzione: contiene i quattro punti, il ritratto che ne emerge, le formule,
  le decisioni aperte e sette domande. Non serve caricare nient'altro.
- **[`../VERIFICA-RUNTIME-2026-09-29.md`](../VERIFICA-RUNTIME-2026-09-29.md)** — **il primo test
  su dispositivo della storia del progetto.** `A3-T13` (Blocco 0) verificato per misura, non per
  lettura: rete spenta davvero, identità misurata prima e dopo. Due difetti nuovi trovati solo
  perché l'app è stata avviata, e la lista di ciò che **non** è stato verificato.
- **[`../loto-hub-master-blueprint-ssot-2026.md`](../loto-hub-master-blueprint-ssot-2026.md)** —
  **la visione del progetto**: TSaaSI, Zero-IoT, Zero-PII, motore camaleone, soft-sorting, Shadow
  Validation, economia civica. *Demotato il 29/09: si chiamava "SSOT DEFINITIVO" e conteneva due
  affermazioni risultate false — la verifica di posizione in `scan_poi_gps` e il fatto che la logica
  risieda "interamente" lato server. §1 e §3 restano valide; §2 e §4 sono da verificare.*
- **[`../METODICA.md`](../METODICA.md)** — **come lavoriamo senza raccontarci storie.** La regola
  che tiene insieme tutto (il codice è l'unica autorità, i documenti sono ipotesi), la scala della
  verifica da L0 a L3 con l'obbligo di sapere a che piano sei, le sette bugie che la documentazione
  racconta, e cosa significa chiudere un blocco con una prova invece che con un'intenzione.
- **[`../PIANO-DECISIONE.md`](../PIANO-DECISIONE.md)** — **l'ordine in cui procedere**, a blocchi, e
  il nodo strategico che lo determina. Cinque passi, con il costo di ciascuno e cosa sblocca. Nessun
  task duplicato: dice *quando*, l'indice dice *cosa*.
- **[`../FORMULE-PROPRIETARIE.md`](../FORMULE-PROPRIETARIE.md)** — la fonte unica delle formule.
  Ogni formula porta tre cose: il codice che la implementa, il documento che la descrive, e un
  verdetto in cinque valori. Esiste perche' le formule erano state scritte **sette volte in sette
  file diversi con valori diversi**, e il file che doveva contenerle tutte
  (`HEALTH_CHECK_FORMULAS_REPORT.md`) non esiste piu'.
- **[`../METE-CONSIGLIATE-SPEC.md`](../METE-CONSIGLIATE-SPEC.md)** — specifica dell'algoritmo di
  deflusso turistico, deciso il 29/09. Le colonne esistono gia' tutte: manca lo scrittore.

## La riga che tiene insieme i quattro punti

I primi due punti hanno la stessa forma: **l'architettura c'è, il cablaggio no.** Nel punto 1 il
recupero non richiama il profilo che lo ha generato. Nel punto 2 il calcolo del tenant gira e il
risultato viene scartato. Non sono due bug, è la stessa classe di difetto: codice che esiste,
provato e scritto, ma non collegato a chi dovrebbe usarlo.

Il punto 3 aggiunge una **seconda classe, più pericolosa**, perché non lascia traccia nel
cablaggio: **un controllo che è stato cancellato.** Il proximity gate esisteva, era scritto bene,
ed è sparito quando una migration ha sostituito il corpo di `scan_poi_gps` per aggiungerci il
ledger. Nessun test, nessun type check, nessun errore: la funzione continua a compilare e a
restituire successo. Il controllo mancante è proprio quello che tiene insieme tutta la
"Proof of Action", e le altre tre formule — anti-velocità, cooldown, shadowban — proteggono il
*valore* di una visita che, senza quello, non è avvenuta.

Il filo che lega i quattro punti, e la cosa da portare a NotebookLM perché la vede meglio di noi:
**nessuno di questi difetti produce un errore.** Sono tutti sistemi che funzionano e che
riportano successo mentre non fanno la cosa che dichiarano. Un fallimento rumoroso si trova in
test; questi si trovano solo leggendo la formula e chiedendosi chi la chiama.

E dal punto 4 emerge una **regola che spiega tutti e quattro i punti**: il livello di maturità
decresce con la vicinanza al cliente. Il codice locale è curato, con commenti che spiegano le
scelte. Il database è il livello più fragile, perché è quello che non entra in Git — 16 trigger, 7
`CREATE TABLE` e `collective_goals` vivono solo in copie di ripristino mai applicate. Ogni claim che
dipende dal DB è a rischio, e non per un caso, ma per una ragione strutturale.

