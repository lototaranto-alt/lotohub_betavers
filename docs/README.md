# L.O.T.O. HUB — Documentazione: Architettura, Criterio e Indice

> **File di ingresso della Documentazione.** Prima di creare o modificare un documento, leggi qui il criterio: **tutte le nuove doc devono rispettare la tassonomia, il blocco di metadati e la regola "una casa, una voce".**
> Ultimo aggiornamento: 2026-09-21.

---

## 1. Il criterio in 5 regole

1. **UNA COSA, UNA CASA (SSOT).** Ogni argomento vive in UN SOLO documento. Gli altri documenti lo *linkano* invece di copiarlo. Se una conoscenza è richiesta in più doc, va nel doc-SSOT e altrove si cita il link.
2. **OGNI DOC RISPONDE A UNA DOMANDA.** All'inizio di ogni documento c'è lo **Scopo** (una riga): *"questo documento risponde a: …"*. Se la domanda cambia troppo, il documento va diviso.
3. **BLOCCO METADATI OBBLIGATORIO.** Ogni `.md` di questa cartella inizia con:
   ```
   <!-- Stato: Vivente | Bozza | Storico -->
   <!-- Scopo: <una riga> -->
   <!-- SSOT: <file che contiene la versione "vera" di questo argomento> -->
   <!-- Owner: <area> -->
   <!-- Ultimo aggiornamento: YYYY-MM-DD -->
   ```
   - **Vivente** = si consulta/aggiorna ed è la fonte corrente.
   - **Bozza** = discussione/proposta non ancora costruita.
   - **Storico** = cronaca/verbatim passato, non si aggiorna (si linka, non si copia).
4. **SNAPSHOT ≠ REGOLA.** `*_HANDOFF`, `REPORT`, `storico_*` sono **istantanee datate**: si appendono nuove sezioni, non si riscrivono, e non sono mai SSOT.
5. **NOMI RICORSIVI.** `AREA_concetto.md` (es. `gamification_experience.md`, `audio_feedback.md`). Le aree di alto livello stanno in `docs/`; le sotto-aree in sottocartelle (`docs/commercial/`).

## 2. Tassonomia (categorie)

| Categoria | Domanda che risponde | Cosa ci finisce |
|---|---|---|
| **A — Fondazione** | "Qual è il modello di business/architettura/logica proprietaria?" | Masterplan, manifesti, SSOT, schema DB, logiche e formule, baseline |
| **B — Specifiche & Design** | "Come deve essere costruita questa interfaccia/esperienza?" | Spec UX, spec feature, narrativa/tier, gamification design, copy |
| **C — Stato & Tracciamento** | "Cosa è fatto, cosa manca, cosa è stato deciso?" | Report di stato, handoff, task/plan, dead code, QA |
| **D — Analisi & Ricerca** | "Perché facciamo così / cosa dicono i dati e i competitor?" | Analisi hook, modelli, radiografie, brainstorming |
| **E — Guide & Storico** | "Dove trovo X? Chi ha detto cosa e quando?" | Indici, recovery guide, storico chat |
| **F — Business & Commerciale** | "Come si vende e come si opera con i partner?" | Playbook, spec bot B2B, doc operative |

## 3. Indice dei documenti

### A — Fondazione
| Doc | Stato | Scopo |
|---|---|---|
| `LOTO_HUB_MASTERPLAN.md` / `_BETA` | Storico/Bozza | Visione prodotto nelle sue due fasi |
| `LOTO_ENGINEERING_MANIFESTO.md` | Vivente | Principi ingegneristici vincolanti |
| `LOTO_HUB_SSOT_DEFINITIVO.md` | Vivente | SSOT concettuale di prodotto/dati |
| `schema_architecture.md` | Vivente | Architettura DB (tabelle/viste/RPC) |
| `logiche_proprietarie.md` | Vivente | Formule e motori proprietari (Haversine, XP/PTI, ESG) |
| `pre_gamification_baseline.md` | Storico | Baseline pre-gamification |
| `quadratura_logica_ecosistema.md` | Storico | Coerenza FASE 1-4 dell'ecosistema |
| `coerenza_ecosistema.md` | Vivente | Decisioni allineate tra app, vault e PTI |
| `architettura_core_1_2_3.md` | Storico | Bozza architetturale evolutiva |
| `architettura_definitiva_beta.md` | Storico | Bozza architetturale beta |
| `ENGINEERING_SYNC_HANDOFF.md` | Storico | Handoff sincronizzazione engineering |
| `ARCHITECTURE_GUIDELINES.md` (root) | Vivente | Linee guida tecniche di codice |
| `AGENTS.md` (root) | Vivente | Vincoli operativi e valori di progetto |

### B — Specifiche & Design
| Doc | Stato | Scopo |
|---|---|---|
| `ux_onboarding_specs.md` | Vivente | Spec onboarding, livellamento, sblocco UI, vault |
| `UX_GPS_STARTUP_GUIDELINES.md` | Vivente | Linee guida GPS/primo avvio/mappa |
| `gamification_struttura_narrativa.md` | Vivente | Tier narrativi 5x10, nomi e tono |
| `gamification_experience.md` | **Nuovo (Vivente)** | L'esperienza gamification complessiva + scenari + decisioni (es. Fog of War) |
| `audio_feedback.md` | **Nuovo (Vivente)** | Gestione completa dei feedback audio/SFX |
| `WHATSAPP_BOT_SPECS.md` | Vivente | Spec bot B2B e template (complementare a `commercial/whatsapp_bot_architecture.md`) |
| `gamification_auth_plan.md` | Bozza | Piano auth/gamification |
| `walkthrough.md` | Storico | Demo della dashboard |

### C — Stato & Tracciamento
| Doc | Stato | Scopo |
|---|---|---|
| `REPORT_GAMIFICATION_STATUS.md` | **Vivente (SSOT di stato)** | PARTE A-B-C-D: realizzato, discusso, linee guida G, diario decisioni |
| `NEXT_SESSION_HANDOFF.md` | Storico (appendere) | Istantanee di fine sessione |
| `task.md` / `implementation_plan.md` | Storico | Piani passati a quadranti/boutique |
| `QA_DEMO_FINAL_POLISH.md` | Vivente | Checklist QA, blocker build EAS, fallback offline |
| `codici_morti.md` | Vivente | Dead code registrato (archivio, non si ripristina) |
| `sfoltimento_concettuale.md` | Storico | Sfoltimento concetti |
| `radiography_loto_hub.md` | Storico | Radiografia tecnica del progetto |

### D — Analisi & Ricerca
| Doc | Stato | Scopo |
|---|---|---|
| `gamification_hooks_analisi.md` | Vivente | Hook psicologici verificati sul codice + economia XP per azione |
| `analisi_modello_b.md` | Storico | Analisi di un modello alternativo |
| `brainstorming_impatto_collettivo.md` | Storico | Brainstorming motore impatto collettivo |

### E — Guide & Storico
| Doc | Stato | Scopo |
|---|---|---|
| `knowledge_recovery_guide.md` | Vivente | Dove cercare cosa nel progetto |
| `storico_chat_vecchia.md` | Storico | Verbatim delle vecchie sessioni (referenza, non si tocca) |
| `README.md` | **Questo file (Vivente)** | Criterio + indice |

### F — Business & Commerciale (`docs/commercial/`)
| Doc | Stato | Scopo |
|---|---|---|
| `commercial_playbook.md` | Vivente | Playbook vendita protocollo e certificazione ESG |
| `partner_operative_documentation.md` | Vivente | Documentazione operativa partner |
| `whatsapp_bot_architecture.md` | Vivente | Architettura bot B2B (integrazione `WHATSAPP_BOT_SPECS`) |

---

## 4. Workflow di creazione/modifica

1. Verifica su questo file che l'argomento non esista già (regola 1).
2. Cerca lo **Scopo** giusto → assegna la **Categoria** (A-F) → scegli il **nome**.
3. Copia il **blocco metadati** (regola 3) e compilalo.
4. Scrivi SOLO ciò che risponde alla domanda dello Scopo; il resto si linka.
5. Aggiorna l'indice di questo file (nuova riga) e il `knowledge_recovery_guide.md` se l'area è nuova.
6. Le decisioni cambiate di stato vanno marcate nel `REPORT_GAMIFICATION_STATUS.md` (PARTE A/B/D).