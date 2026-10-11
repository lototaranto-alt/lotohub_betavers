# TRIAGE DOCUMENTAZIONE — 04/10/2026

Classificazione definitiva dei 124 file di documentazione del progetto.
**Nessun file viene spostato o cancellato.** Questo documento dice solo cosa
consultare e cosa no, da qui in avanti.

---

## 1. LA REGOLA

Non l'ho inventata. E' gia' scritta in `.gitignore`, righe 71-75:

> MAPPA-TECNICA-CODICE.md dichiara confidenza "Alta" senza alcuna prova:
> resta in locale come consultazione e non entra nella documentazione di sistema
> finche' non e' verificata riga per riga.

Il progetto ha gia' deciso che **il materiale non verificato non e' consultabile**.
Io ho solo esteso la misura. Tre criteri, in quest'ordine:

1. **Ha provenienza dichiarata?** id, tipo, stato. Un file senza `id` non dice
   quando e' stato scritto ne' quanto vale. Non e' consultabile.
2. **I suoi numeri sono ancora misurabili?** Se il file descrive lo stato di codice
   o DB, si rimisura e si confronta. Il file non e' la fonte, e' lo stimolo a misurare.
3. **Contiene una decisione che solo tu puoi prendere?** Allora vale, e non e'
   riproducibile da nessuna misurazione.

Il fallimento del metodo e' noto e ne conosciamo il prezzo: cinque commenti di
codice promettevano protezioni inesistenti, e il catalogo di v3 ha verificato che
una riga esistesse senza verificare che si potesse arrivarci.

---

## 2. I NUMERI

| Directory | File | Tracciati in git | Con metadati |
|---|---|---|---|
| `docs/` | 42 | 42 | **0** |
| `docs_v2/` | 69 | 68 | 61 |
| `docs_v3/` | 13 | **0** | 4 su 9 utili |
| **totale** | **124** | **110** | **65** |

Il file non tracciato in `docs_v2/` e' `MAPPA-TECNICA-CODICE.md`, escluso
apposta dalla `.gitignore`. Non e' un incidente.

**Il dato che conta:** `docs/` ha **zero** file con frontmatter. Nessuno. E' un
livello pre-v2 senza disciplina di metadati, e per la regola 1 non e' consultabile
in blocco. Non perche' sia sbagliato, ma perche' non dice quando e' stato scritto.

---

## 3. IL DUPLICATO

```
DADEDC8D2AD07676C1AC4602786CF3CC693CB5FB71D6AF299F1EE3C08985A4DA  docs/storico_chat_vecchia.md
DADEDC8D2AD07676C1AC4602786CF3CC693CB5FB71D6AF299F1EE3C08985A4DA  docs_v3/storico_chat_vecchia.md
```

Stesso identico file, 390,6 KB, in due directory. Una copia tracciata in git, una
no. **Non lo tocco** e non lo cancello, perche' una copia tracciata in git ha
contenuto che non so di quale delle due sia. Ma e' la prova che `docs/` e `docs_v3/`
hanno divergenti senza che nessuno lo sapesse.

---

## 4. I TRE SECCHI

### A — CONSULTARE (~25 file, tutti in `docs_v2`, più 4 in `docs_v3`)

Sono la fonte per i task di `PIANO-LAVORO.md`. Niente altro.

**Metodo e regole** — `docs_v2/README.md` (COSTITUZIONE), `regole/R1_autorita.md`,
`R2_evidenza_e_verdetto.md`, `R3_anatomia.md`, `R4_ciclo_di_vita.md`,
`R5_criteri_di_scelta.md`, `METODICA.md`

**Decisioni** — `docs_v2/DECISIONI.md` (30 KB). L'unico posto dove stanno le tue
decisioni. Nessuna misurazione lo sostituisce.

**Registry e validatori** — `tooling/autorita.json` (un file canonico per dominio),
`tooling/validate.py`, `tooling/verifica_coerenza.py`, `tooling/build_manifest.py`,
`MANIFEST.json`

**Indice task** — `docs_v2/TASKS-PER-AREA.md` (45 KB). Mappa su A1-A9.

**Aree utili adesso** — `aree/A3_dati_e_sql.md` (T1, T2, T3, T4, T6, T13),
`aree/A5_app_mobile.md` (T5, T12), `aree/A1_fondazione.md`

**Regole di prodotto non misurabili** — `FORMULE-PROPRIETARIE.md`,
`METE-CONSIGLIATE-SPEC.md`, `MODELLO_PREDITTIVO.md`, `FORMA-DEFINITIVA.md`

**Identita'** — `loto_map/` (5 file): onboarding, motore Camaleonte, zero-IoT,
feature UX. Non e' codice, e' prodotto.

**Architettura di sistema** — `loto-hub-architettura-sistema-master-2026.md`,
`loto-hub-master-blueprint-ssot-2026.md` (quest'ultimo `stato=Bozza`)

**Strumenti SQL riusabili** — i 10 file `.sql` in `docs_v2/`:
`diagnostica-gate-vault.sql`, `diagnostica-schema-impatto.sql`,
`diagnostica-struttura-completa.sql`, `FIX-BLOCK.sql`, `QUERY-CLOUD.sql`,
`query-cloud-q17-q27.sql`, `verifica-colonne-profiles.sql`,
`verifica-proximity-gate.sql`, `verifica-v6-multiplicatore.sql`,
`verifica-v6-senza-commenti.sql`

**GPS e UX** — `docs/UX_GPS_STARTUP_GUIDELINES.md`. L'unico file di `docs/` che
serve ai task correnti, perche' descrive regole di startup GPS e non stato di codice.

**Pista v3** — `docs_v3/README.md`, `MASTER-CONVALIDATO-2026.md`,
`catalogo-feature.json`, `tooling/verifica_catalogo.py`. Contenuto unico, non
duplicato altrove. Con la caveat che F-SCAN-02 e' falso (vedi `PIANO-LAVORO.md` T7).

---

### B — CONSULTARE UNA VOLTA, POI MISURARE (~35 file)

Descrivono stato di codice o DB. Utili per orientarsi, **zero autorita'**. Se un
numero e' necessario, si rimisura e si usa il nuovo.

- `docs_v2/`: `STRUTTURA-DEFINITIVA.md`, `RICOSTRUZIONE.md`, `COLLAUDO-ARCHIVIO.md`,
  `INVENTARIO_DOCUMENTAZIONE.md`, `REPORT-SINCRONIZZAZIONE.md` (`stato=Storico`),
  `ANONIMATO-E-INTEGRITA-LEDGER.md`, `ULTIMO-MIGLIO-BLOCKS.md`,
  `VERIFICA-RUNTIME-2026-09-29.md`, `VERIFICHE-PROCESS-ESG-IMPACT.md`,
  `ESITO-QUERY.md`, `QUERY-CLOUD.md`, `MODELLO_OPERATIVO.md`, `PIANO-DECISIONE.md`,
  `PianoOperativo-26-09.md`, `VALUTAZIONE-PROGETTO.md` (`stato=Bozza`),
  `DOCTRINA-ECHO.md`, `PROMPT-COLLAUDO-ARCHIVIO.md`, `aree/A2`, `A4`, `A6`
  (`Bozza`), `A7` (`Bozza`), `A8`, `A9`, `loto_map/04`
- `docs_v2/MAPPA-TECNICA-CODICE.md` — **escluso di proposito** dalla `.gitignore`
  perche' dichiara confidenza "Alta" senza prova. Si legge solo come elenco di cose
  da verificare.
- `docs/`: `codici_morti.md` (utile a T11), `radiography_loto_hub.md`,
  `REPORT_GAMIFICATION_STATUS.md`, `LOTO_HUB_SSOT_DEFINITIVO.md`,
  `db_migrations/02_gamification_and_events.sql`, `db_migrations/03_demo_seed_data.sql`
- intent di prodotto in `docs/`: `gamification_cerchio_delle_stagioni.md`,
  `GAMIFICATION_EXPERIENCE.md`, `gamification_hooks_analisi.md`,
  `gamification_rampa_early_game.md`

---

### C — NON CONSULTARE MAI (~20 file)

Chat, log di sessione, materiale esterno non verificato, e i miei file. Restano
dov'erano, non li apro piu'.

**Trascrizioni e log**
- `docs/storico_chat_vecchia.md` + `docs_v3/storico_chat_vecchia.md` (identici, 390,6 KB)
- `docs_v3/CHAT_EXPORT_SEP7_SEP15.md` (625 KB)
- `docs/NEXT_SESSION_HANDOFF.md`, `ENGINEERING_SYNC_HANDOFF.md`,
  `FINE_SESSIONE_PROTOCOLLO.md`, `knowledge_recovery_guide.md`
- `docs_v2/CHIUSURA-SESSIONE-26-09.md`, `CHIUSURA-SESSIONE-27-09.md`,
  `HANDOVER-SESSIONE-2026-09-30.md`
- `docs_v3/LOG-LAVORO.md`

**Materiale esterno**
- `docs_v3/OSSERVAZIONE.txt` (note NotebookLM)
- `docs_v3/brief-notebooklm.txt`
- `docs_v2/NOTEBOOKLM-BRIEFING.md`

**Proposte non verificate**
- `docs_v3/AGENTE-OPEN-SOURCE.md` (`stato=Bozza`)
- `docs_v3/idee/STUDIO-WEWARD.md` (`stato=Bozza`)
- `docs_v2/BRIEFING-AGENTE.md`

**Miei, contenuto gia' migrato in `PIANO-LAVORO.md`**
- `docs_v3/VERDETTI-MISURATI.md`, `docs_v3/CIVIC-TRIGGER.md`

---

### D — LASCIARE DOV'È (il resto)

Tutti i file di concettualizzazione in `docs/` che non hanno supersessione misurata:
`analisi_modello_b.md`, `architettura_core_1_2_3.md`,
`architettura_definitiva_beta.md`, `AUDIO_FEEDBACK.md`,
`brainstorming_impatto_collettivo.md`, `coerenza_ecosistema.md`,
`commercial/` (3), `implementation_plan.md`, `pre_gamification_baseline.md`,
`QA_DEMO_FINAL_POLISH.md`, `quadratura_logica_ecosistema.md`,
`schema_architecture.md`, `sfoltimento_concettuale.md`, `task.md`,
`ux_onboarding_specs.md`, `walkthrough.md`, `WHATSAPP_BOT_SPECS.md`,
`LOTO_HUB_MASTERPLAN.md`, `LOTO_HUB_MASTERPLAN_BETA.md`,
`LOTO_ENGINEERING_MANIFESTO.md`, `logiche_proprietarie.md`,
`gamification_auth_plan.md`, `gamification_struttura_narrativa.md`,
`docs/README.md`, `docs_v2/template/` (2), `docs_v2/FORMA-DEFINITIVA.md` *(in A)*.

Non li apro perche' non hanno contributo misurabile a nessun task aperto. Se un
giorno ne serve uno, si rilegge allora. Non prima.

---

## 5. LA DUPLICAZIONE, UNA VOLTA PER TUTTE

Rispondo alla domanda che hai fatto, che era: **c'è roba in `docs_v3` che esiste già
altrove?**

**No. E i due strati non si sovrappongono.**

| Verifica | Esito |
|---|---|
| `docs/` e `docs_v2/` contengono il vocabolario di v3 (`CONTRADDITTA`, `PRESENTE MA SCOLLEGATA`) | **zero occorrenze** |
| Riferimenti `file:linea` di `catalogo-feature.json` | **3 verificati a mano, 3 corretti** |
| Codice applicativo o oggetti DB dentro `docs_v3/` | **nessuno**, solo `verifica_catalogo.py` |
| Unica duplicazione trovata | `storico_chat_vecchia.md`, identico in `docs/` e `docs_v3/` |

Quindi `docs_v3/` **non aggiunge un quarto strato di verita'**. Aggiunge un indice
di 97 feature con verdetto e prova, che non esiste altrove. E' utile. Non e'
però affidabile senza riverifica, e il suo unico errore e' proprio nel punto piu'
critico della sessione.

**I tre strati hanno ruoli diversi e non si pestano:**
- `docs/` — originale, nessun metadato, in gran parte concettualizzazione superata
- `docs_v2/` — sistema e decisioni, l'unico con metadati e validatori
- `docs_v3/` — inventario di cosa funziona, unico, non canonico

---

## 6. COSA CAMBIA, IN PRATICA

1. Il mio set di consulto scende da **124 file a circa 29**. I 4 di `docs_v3` sono
   un indice, non una fonte.
2. `docs/` esce dal perimetro di lavoro, tranne `UX_GPS_STARTUP_GUIDELINES.md` e
   `codici_morti.md`.
3. I 10 file `.sql` di `docs_v2/` sono **strumenti**, non documentazione. Vanno
   eseguiti, non letti. Sono il modo piu' economico di misurare.
4. `DECISIONI.md` e i file di identita' sono i piu' importanti di `docs_v2`, e
   sono gli unici che nessuna misurazione sostituisce.

## 7. COSA NON FACCIO

- Non sposto, non cancello, non rinomino. Tutto resta dove e'.
- Non creo piu' file in `docs_v3/`, e non metto mano ai suoi deliverable.
- Non aggiungo un quarto livello. Il precedente e' costato quattro documenti che si
  contendono la verita'; il quinto peggiorerebbe il problema invece di risolverlo.
- Non confondo l'essere tracciato in git con l'essere vero. `docs_v3/` non e' tracciata
  e il suo contenuto e' unico: si vede che tracciamento e verita' sono due cose
  diverse, e il progetto lo ha gia' dimostrato con `MAPPA-TECNICA-CODICE.md`.
