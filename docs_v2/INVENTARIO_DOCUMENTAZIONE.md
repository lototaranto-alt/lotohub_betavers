---
id: INVENTARIO-V1
tipo: analisi
ambito: verdetto-di-affidabilita-sulla-documentazione-v1
stato: Vivente
confidenza: Alta
owner: Agent
aggiornato: 2026-09-26
evidenza:
  - docs/README.md:1
  - .agents/AGENTS.md:1
---

<!-- Stato: Vivente -->
<!-- Scopo: questo documento risponde a: "quale documento della documentazione L.O.T.O. Map e' attendibile, quale e' obsoleto e quale ti induce in errore" -->
<!-- SSOT: questo file per il verdetto di attendibilita'; il contenuto di ciascun doc resta la sua casa (regola 1 di docs/README.md) -->
<!-- Owner: Agent / documentazione -->
<!-- Ultimo aggiornamento: 2026-09-26 -->

---
id: INVENTARIO-V1
tipo: analisi
ambito: verdetto-di-affidabilita-sulla-documentazione-v1
stato: Vivente
confidenza: Alta
owner: Agent
aggiornato: 2026-09-26
evidenza:
  - docs/README.md:1
  - .agents/AGENTS.md:1
---

# INVENTARIO E VERDETTI DI AFFIDABILITA' DELLA DOCUMENTAZIONE

> **Perche' questo file esiste.** La documentazione di LOTO non e' disordinata per caso: e' il risultato di
> 4 agent diversi in 5 mesi, ognuno con la sua "SSOT". Quattro documenti diversi si dichiarano *la* fonte
> di verita' e due di loro si contraddicono a vicenda. Questo file NON duplica quei contenuti: dà il
> **verdetto** su quale leggere. I contenuti restano nei file loro.

---

## 1. Metodica (per non allucinare)

Nessun verdetto basato su data, nome del file oDimensioni. Ogni riga e' o **codice sorgente**, **contenuto del file**, o **log Git**.

| Tier | Fonte | Uso |
|---|---|---|
| A | codice in `C:\loto_app`, `.agents/AGENTS.md`, migration in `supabase/`, log Git | **verdetto** |
| B | doc che dichiarano di essere SSOT | confronto tra loro, mai prova |
| C | mtime, dimensione, nome del file, numero di revisioni | **mai usati** |

Il perimetro e' `docs/` (38 file) + root del repo (7 file) = **45 documenti**. Le fonti esterne
(`Desktop\doc loto`, `LOTO_DOCS_MASTER`, `brain\`) sono rimaste **dimezzate: non le ho toccate** e le
si puo' consultare su richiesta con ricerca mirata, senza lettura integrale.

---

## 2. Sintesi quantitativa

| Metrica | Valore |
|---|---|
| Documenti analizzati | 45 (38 in `docs/`, 7 in root) |
| **Senza blocco metadati** (regola 3 di `docs/README.md`) | **40 su 45 — l'88%** |
| Non citati nell'indice `docs/README.md` | 7 |
| Documenti che si dichiarano "SSOT" | **4, in conflitto** |
| Link a file `.md` inesistenti | 3 (`knowledge_recovery_guide.md`), 17 (`storico_chat_vecchia.md`) |
| Caratteri U+FFFD (encoding corrotto) | **1 solo**, in `codici_morti.md`. Problema molto piu' piccolo del temuto |
| Duplicati byte-identici fra `docs/` e root | 0 (ma 2 argomenti hanno **versioni divergenti**, vedi §4) |

---

## 3. LE 4 TRAPPOLE ATTIVE (documenti che oggi ti inducono in errore)

### T1 - `LOTO_HUB_SSOT_DEFINITIVO.md` — il piu' pericoloso
Si presenta come "conformazione **definitiva**" e dichiara di "sostituire e invalidare qualsiasi
Master Brief precedente". Contiene due affermazioni **smentite dal codice**:

| Cosa dice il doc | Realtà verificata |
|---|---|
| "i check-in (inviati direttamente alla tabella `esg_raw_logs` su Supabase)" | **`esg_raw_logs` non esiste.** 0 occorrenze in `app/`, `components/`, `utils/`, `types/`. Compare solo in `TRUE_HISTORY_RESTORE.sql` e in **commenti** di `migrations/20260926120000_scan_chain_canonical.sql:10,97,387`, che la dichiarano "tabella assente" |
| "**Opzione B (Tradizionale):** Modulo classico con Email e Password" | **Rimosso.** 0 occorrenze di `signUp` / `signInWithPassword` / `createUser` in `app/` e `components/`. Commit `bc37c59` (21/09): *"backup solo QR locale"*. Decisione tua, esplicita: *"Abbiamo eliminato il backup via email per mantenere l'app purissima... Solo QR Code locale"* |

Questo documento è l'unico che osa **contraddire `.agents/AGENTS.md` §1** (Zero-PII assoluto), e lo fa
in una direzione che tu hai già revocato. **Verdetto: da archiviare come Storico, non leggere come regola.**

### T2 - Quattro "SSOT" in concorrenza
| File | Come si dichiara |
|---|---|
| root `LOTO_HUB_MASTER_CONTEXT.md` | "MASTER CONTEXT & SINGLE SOURCE OF TRUTH (SSOT)" + "**DIRETTIVA DI SISTEMA PER L'IA:** non riassumere, non omettere e non modificare mai" |
| `docs/LOTO_HUB_SSOT_DEFINITIVO.md` | "MASTER SSOT" + "sostituisce e invalida qualsiasi Master Brief precedente" |
| `docs/LOTO_ENGINEERING_MANIFESTO.md` | "**Singola Fonte di Verità (SSOT) assoluta** per la struttura ingegnerizzata" |
| `docs/LOTO_HUB_MASTERPLAN.md` (+`_BETA`) | masterplan di prodotto |

Tre di questi competono per la **medesima** coppia "dogmi architetturali + formule". Finché nessuno
viene dichiarato superato, un agente che li legga in ordine diverso arriverà a conclusioni diverse.
**Serving decisione necessaria (vedi §6, D1).**

### T3 - `SESSION_BOOTSTRAP_RICOSTRUZIONE.md` (root) — puntatori obsoleti
È il file che un agente doveva copiare per "riavviare senza partire da zero". I suoi percorsi sono
superati da quelli stessi:
- dichiara il worktree `...\worktrees\loto-app-fresh\fix-conversation-stuck-issue` come cartella di lavoro → **eliminata il 24/09**
- dichiara `C:\loto_app` sul branch `recovery/ricostruzione-7-15-set` → oggi è su `fix/ripristino-lavoro-15-set-selective`
- il suo scopo (ricostruzione 7-15 settembre) è **concluso**: tu stesso hai confermato il 25/09 *"abbiamo superato il punto di recupero codice"*

**Verdetto: le sue informazioni di percorso sono false oggi. Però i §6/§7/§10 sono citati da
`codici_morti.md` come fonte di verifica: va archiviato in modo che quei riferimenti restino risolvibili.**

### T4 - `rules.md` (root) — regola operativa preziosa, invisibile
Contiene il **protocollo SKELETON-OF-THOUGHT** (`[PARSE] → [SKELETON] → [HALT] → [COMPILE]`):
l'agente deve presentare lo scheletro e fermarsi, e scrivere codice solo dopo un tuo "verde" esplicito.
**Non è in `docs/`, non è nell'indice, non è in `.agents/AGENTS.md`.** È una regola vincolante invisibile.
**Verdetto: è il file più sottovalutato del lotto. Va promosso a `docs/` e indicizzato.**

---

## 4. Versioni divergenti dello stesso argomento

`PLAYBOOK_COMMERCIALE.md` (root) e `docs/commercial/commercial_playbook.md` trattano **entrambi** il
paradigma TSaaSI e i 4 moduli economici, ma **0 righe sostanziali su 22 coincidono**. Non è un
duplicato: sono due redazioni in concorrenza. Stesso problema per `STRATEGIA_COMMERCIALE.md`, che
esiste **solo in root** e non è indicizzata, nonostante contenga il posizionamento B2B2G e la
monetizzazione DaaS per MSC/Costa Crociere — cioè il cuore dell'obiettivo commerciale.

**Verdetto: la documentazione commerciale è oggi spezzata in tre pezzi non reconciliati.**

---

## 5. VERDETTI PER AREA

Legenda: **V** = verdetto verificato sul codice · **?** = non ispezionato in profondità,Opening only

### A — Fondazione
| Doc | Verdetto | Prova |
|---|---|---|
| `.agents/AGENTS.md` | **V — VIGENTE, è la regola vera** | contiene Zero-PII, Zero-IoT, Offline-First, B2B2G, cross-platform, e §8 build |
| `LOTO_ENGINEERING_MANIFESTO.md` | **V — VIGENTE** (con riserva) | i suoi divieti sono rispettati (niente bottoni "simula", niente mock in UI), ma pretende di essere "SSOT assoluta" → **T2** |
| `LOTO_HUB_SSOT_DEFINITIVO.md` | **V — OBSOLETO / DA ARCHIVIARE** | **T1**: `esg_raw_logs` inesistente, backup email revocato |
| root `LOTO_HUB_MASTER_CONTEXT.md` | **V — DUPLICATO IN CONFLITTO** | **T2**: medesimi dogmi di `LOTO_ENGINEERING_MANIFESTO` |
| `LOTO_HUB_MASTERPLAN.md` / `_BETA` | **?** | visione di prodotto in due fasi; `_BETA` non è indicizzato |
| `schema_architecture.md` | **?** | va confrontato con lo schema reale del DB (visto §8 dei blocker) |
| `logiche_proprietarie.md` | **?** | contiene le formule; va verificato contro `utils/haversine`, `levelUtils`, `SincroAvventura` |
| `coerenza_ecosistema.md` | **?** | si dichiara di aver "isolato le incongruenze attuali": se non è stato riallineato, è una lista di bug mascherata da analisi |
| `pre_gamification_baseline.md`, `quadratura_logica_ecosistema.md`, `radiography_loto_hub.md`, `sfoltimento_concettuale.md`, `architettura_core_1_2_3.md`, `architettura_definitiva_beta.md` | **? Storico per data** | servono solo come ricerca storica |

### B — Specifiche & Design (gamification) — verdetti verificati sul codice
| Doc | Verdetto | Prova |
|---|---|---|
| `gamification_rampa_early_game.md` | **V — VIGENTE, il piu' affidabile dell'area** | `utils/levelUtils.ts:17-21,24-29,38-62` confermano cadenza 2/4/6/8/20, `SECTION_UNLOCK_LEVELS`, `UNLOCK_REVEALS`; `KEY_LEVELS` a riga 13 |
| `gamification_hooks_analisi.md` | **V — PARZIALMENTE OBSOLETO** | 3 claim smentiti: **(a)** "obiettivi XP in un punto unico" → falso, valori sparsi con fallback diversi (`PoiDetailSheet.tsx:503`, `ScannedPoisSheet.tsx:60`, `app/p/[id].tsx:75`, `SincroAvventura.ts:57`); **(b)** "cap 3 carte anti-flood" → il codice non ha clamp, un salto LV1→LV10 produce 8 carte (`GamificationTransitionManager.tsx:43-49`); **(c)** "lore solo 1-30" → `LevelUpLore.ts:14-210` copre 1-50. Inoltre **riga 131 cita `GameAchievementsSheet.tsx`, che è in `archive_dead_code/`**, come fonte del +50 XP |
| `gamification_cerchio_delle_stagioni.md` | **V — BOZZA onesta, ma non indicizzata** | 18.6 KB, 23/09, dichiara "Stato: **DISCUSSO**... da validare con l'utente PRIMA dell'ingegnerizzazione". **Manca dall'indice**: è l'unico doc che non rischia di essere letto come regola |
| `GAMIFICATION_EXPERIENCE.md` | **V — VIGENTE** (ha i metadati) | mappa dell'esperienza, vincoli testuali |
| `gamification_struttura_narrativa.md` | **?** | da confrontare con `LevelUpLore.ts` |
| `AUDIO_FEEDBACK.md` | **V — VIGENTE** (ha i metadati) | da confrontare con la tua decisione del 23/09 "restiamo solo haptics" |
| `UX_GPS_STARTUP_GUIDELINES.md`, `ux_onboarding_specs.md`, `WHATSAPP_BOT_SPECS.md`, `gamification_auth_plan.md` | **?** | |

### C — Stato & Tracciamento
| Doc | Verdetto | Prova |
|---|---|---|
| `.agents/AGENTS.md` + root `rules.md` | **V — VIGENTE, da fondere in un unico protocollo** | **T4** |
| `FINE_SESSIONE_PROTOCOLLO.md` | **V — VIGENTE** (ha i metadati) | workflow di chiusura, FASE 1-5 |
| `docs/codici_morti.md` | **V — VIGENTE**, ma **incompleto** | 26/09: condanna v22+v23 ma **dimentica v24**, i cui oggetti sono già hardwired in `20260925120000_admin_dashboard_hardening.sql:332,365` |
| `NEXT_SESSION_HANDOFF.md` | **V — STORICO append-only, 23.7 KB** | 8+ istantanee di fine sessione dal 22/09 in avanti. Per costruzione accumula cronologia: **è la trappola T3 più il file di log più grosso** |
| `REPORT_GAMIFICATION_STATUS.md` | **V — DA RIVEDERE** | 26.5 KB dichiarato "SSOT di stato" nella parte A/B/C/D, ma **non ha il blocco metadati** che lo dichiari Vivente |
| `REPORT_SINCRONIZZAZIONE.md` | **V — VIGENTE come snapshot** | 26/09 |
| `QA_DEMO_FINAL_POLISH.md`, `implementation_plan.md`, `task.md` | **?** — `task.md` root è **1 byte**, vuoto | |
| root `README.md` | **V — RUMORE** | template Expo originale non modificato ("Welcome to your Expo app"). Nessun valore per il progetto |
| `docs/storico_chat_vecchia.md` | **V — STORICO, 390 KB** | 17 link interni a file che non esistono più; utilissimo come verbatim, insostenibile come guida |

### D — Analisi & Ricerca
`analisi_modello_b.md`, `brainstorming_impatto_collettivo.md`, `technical_business_analysis.md` (solo in `.agents/rules/`): **?**
`technical_business_analysis.md` è citato da `docs/README.md` ma **non esiste in `docs/`**: vive in `.agents/rules/`.

### E — Guide & Storico
| Doc | Verdetto | Prova |
|---|---|---|
| `docs/README.md` | **V — il criterio è valido, l'indice è incompleto** | 45 file reali contro 38 indicizzati; 40 senza metadati. Le 5 regole vanno tenute, la tassonomia A-F è sensata |
| `knowledge_recovery_guide.md` | **V — ROTTO** | 3 link a file che **non esistono da nessuna parte nel progetto**: `icapital_peeripato_strategy.md` (**0 occorrenze in tutto il repo**), `loto_hub_development_update.md`, `mockups_recap_strategy.md`. È la "mappa del tesoro" che una sessione nuova seguirebbe per prima: rimanda a 3 vicoli ciechi |
| `ENGINEERING_SYNC_HANDOFF.md` | **V — STORICO** (18/08), link rotto a `HEALTH_CHECK_FORMULAS_REPORT.md` | |

### F — Business & Commerciale
| Doc | Verdetto | Prova |
|---|---|---|
| root `STRATEGIA_COMMERCIALE.md` | **V — VIGENTE ma fuori posto** | Rete Doc, B2B2G pugliese, DaaS per MSC/Costa, CSRD. **Non indicizzato** |
| root `PLAYBOOK_COMMERCIALE.md` vs `docs/commercial/commercial_playbook.md` | **V — DUE REDAZIONI DIVERGENTI** (0/22 righe comuni) | vedi §4 |
| `docs/commercial/partner_operative_documentation.md`, `whatsapp_bot_architecture.md` | **?** | |

---

## 6. Decisioni che spettano a te

- **D1 — Quale dei 4 "SSOT" sopravvive?** La mia proposta: `.agents/AGENTS.md` resta la **regola
  vincolante** (è l'unico con forza prescrittiva e contenuto verificato), `LOTO_ENGINEERING_MANIFESTO.md`
  diventa il **SSOT ingegneristico**, gli altri 3 passano a Storico. Serve il tuo via libera perché
  `LOTO_HUB_MASTER_CONTEXT.md` contiene una "DIRETTIVA DI SISTEMA PER L'IA" che non posso ignorare da solo.
- **D2 — Dove vanno i file della root?** 5 dei 7 non sono indicizzati. Proposta: `rules.md` →
  `docs/FINE_SESSIONE_PROTOCOLLO.md` (è un protocollo), `STRATEGIA_COMMERCIALE.md` e
  `PLAYBOOK_COMMERCIALE.md` → `docs/commercial/` con riconciliazione delle due redazioni,
  `README.md` (Expo) e `task.md` (1 byte) → archiviazione, `SESSION_BOOTSTRAP_RICOSTRUZIONE.md` →
  `docs/archive/` mantenendo risolvibili i riferimenti di `codici_morti.md`.
- **D3 — `knowledge_recovery_guide.md` rotto:** lo rifaccio da zero sull'indice reale, o lo archiviando
  in favore di `docs/README.md` come unica guida?

---

## 7. Cosa NON ho fatto (limiti dichiarati)

- **Non ho modificato nessun file di `docs/`** salvo l'iserimento di questo file e l'aggiunta della
  sua riga all'indice. Nessuna archiviazione, nessuno spostamento, nessuna cancellazione.
- **Non ho toccato le fonti esterne** (`Desktop\doc loto`, `LOTO_DOCS_MASTER` con i suoi ~400 file di
  rumore ESLint, i 41 `brain/`): restano intatti e consultabili su richiesta con ricerca mirata.
- **I verdetti marcati `?` non sono stati verificati** sul codice. Non li ho riempiti per symmetria:
  un inventario con mezze veritàsarebbe esattamente il difetto che vogliamo eliminare.
- **Nessuna migration applicata, nessun codice toccato.** Le 4 blocker della scan chain restano aperte
  (vedi `REPORT_SINCRONIZZAZIONE.md` §6) e sono indipendenti da questo intervento.

---

*Verdetti verificati il 26/09/2026 contro `C:\loto_app` @ `bb0fa37`.*
