<!-- Stato: Vivente -->
<!-- Scopo: Definisce la rampa dei primi 10 livelli (progressive disclosure): i POI sono SEMPRE tutti consultabili (mai gate da XP), si decidono le sezioni sbloccate, la gestione anti-flood delle modali concatenate e il gancio della futura feature di gruppo per bonus XP. -->
<!-- SSOT: utils/levelUtils.ts (soglie), docs/gamification_hooks_analisi.md §7.2 (economia XP), docs/gamification_struttura_narrativa.md (tier) -->
<!-- Owner: gamification -->
<!-- Ultimo aggiornamento: 2026-09-21 -->

# Rampa Early-Game — Primi 10 Livelli (Il Risveglio del Seme)

> Questo documento risponde a: *"come si deve sentire l'esperienza nei primi 10 livelli, senza sovraccaricare la cognizione dell'utente?"*

## 0. DECISIONI UTENTE (21/09, verbatim)

1. **POI e categorie NON si toccano**: *"i p.o.i e le categorie non vanno toccate è gia tutto ok cosi, i p.o.i non si sbloccano con xp"*.
2. **POI sempre sbloccati**: *"i p.o.i sono sempre sbloccati non seguono gli exp"*. Il filtro default resta **Monumenti** (già `map.tsx:70`) e l'utente scopre da sé il tasto per cambiare i filtri: *"devi fare è solo lasciare monumenti in filtri cosi al prim avvio utente non viene sommerso, ma andra a scoprire lui il tasto per cambiare i filtri in mappa"*.
3. **Nessun badge "nuovo strato"** e niente gate categorie: *"nessun badge dato che i p.o.i sono da subito cmq tutti consultabili"*.
4. **Rito LV10**: sì, modale celebrativa dedicata di passaggio al Tier 2.
5. **Itinerari**: lo sblocco è **già a LV2** (non LV3).

**In sintesi:** nella mappa la visibilità POI è **sempre piena** (nessuna scoperta legata all'XP); la Progressive Disclosure riguarda SOLO **sezioni** (già presenti) e **riti/modali**. La rampa qui sotto è quindi *narrativa e di celebrazione*, non di *sblocco contenuti*.

---

## 1. Fatti verificati sul codice (base dati della rampa)

### 1.1 Soglie XP reali (`utils/levelUtils.ts`, Tier 1 "TURISTA OCCASIONALE")
| LV | minXp | nextXp | richiesta cumulativa |
|---|---|---|---|
| 1 | 0 | 30 | — |
| 2 | 30 | 90 | 30 |
| 3 | 90 | 180 | 90 |
| 4 | 180 | 300 | 180 |
| 5 | 300 | 450 | 300 |
| 6 | 450 | 630 | 450 |
| 7 | 630 | 840 | 630 |
| 8 | 840 | 1080 | 840 |
| 9 | 1080 | 1350 | 1080 |
| 10 | 1350 | 1650 | 1350 |
| 11 | 1650 | 2080 | 1650 (Rank **ESPLORATORE**) |

Livelli chiave dentro questo arco: **1 → 2 → 5** (gli altri a 11/20/21/30/31/41).

### 1.2 Economia XP per azione (`gamification_hooks_analisi.md` §7.2)
| Azione | XP |
|---|---|
| Check-in POI | `base_xp` (default 15, seed prod 30–50) |
| Sblocco storia/media | +30 |
| Eco-Passi | 100 m = +5 |
| Itinerario pianificato | POI × 10 |
| Evento | +10 |
| Badge (es. Sentinella) | +50 |

**Stima tempo reale (a ~40 XP/check-in + 1 media):** LV5 (300) ≈ **7–8 check-in ≈ 1–2 ore** (soglia di apprendimento certificata); LV10 (1350) ≈ 30–34 check-in; LV11 (1650) ≈ 40 check-in.

### 1.3 Stato reale della Mappa (`app/(tabs)/map.tsx`)
- **Tutti i POI caricati** da `vw_pois_frontend` (esclusi `nodo_civico` e `concierge`); nessun gate di livello.
- Layer default **`'monument'`** (`map.tsx:70`) → al primo avvio l'utente vede Monumenti + Fontane (sempre visibili, `map.tsx:183`), ma **tutte le categorie sono già consultabili** dal dropdown.
- Popolamento seed (`supabase/seed_alpha_pois.sql`): monument 27 · museum 13 · park 127 · attraction 10 · fountain 2 = 179 POI.
- **Nessuna modifica richiesta qui** (visione utente Q1/Q2).

### 1.4 Gate sezioni reali (`utils/levelUtils.ts`)
| Sezione | Livello | Note |
|---|---|---|
| Eventi Pubblici | **LV2** (`EVENTS_UNLOCK_LEVEL`) | badge "LV.2" non bloccante (`index.tsx`) |
| Itinerari / Percorsi | **LV2** | già impostato (decisione utente Q5) |
| Community | **LV5** (`COMMUNITY_UNLOCK_LEVEL`) | tab bloccato con `FeatureLockSheet` "??? (LV.5)" |
| Co-Experience (squad) | **LV20** (`CO_EXPERIENCE_UNLOCK_LEVEL`) | `FeatureLockSheet` "??? (LV.20)" |

### 1.5 Catena modali oggi (`utils/levelUtils.ts` + `components/GamificationTransitionManager.tsx`)
- `buildLevelUpEvents()` accoda **1 carta LEVEL_UP + 1 carta WHISPER per OGNI livello superato**, incluso il jump multiplo (es. LV1→LV3 = 2 level-up + 2 whisper = 4 modali di fila = **overload**).
- Coda serializzata (`queueEvents`) e 3 tipi carta: **LEVEL_UP / WHISPER / BADGE**.
- Le sezioni sbloccate si presentano con `FeatureLockSheet` **in negativo** ("si svelerà al LV."), non come apertura festosa.

---

## 2. Principio guida (anti-sovraccarico cognitivo)

> **La città non si "sblocca": si celebra.** Tutti i POI sono sempre lì, come una mappa vera. L'XP guida SOLO il viaggio narrativo e l'accesso alle sezioni sociali (Eventi/Community/Co-Experience).

Regole derivate:
1. **Mai nascondere contenuti dietro l'XP sulla mappa** (vincolo assoluto utente). La scoperta avviene per *guida del default* (Monumenti) e per *curiosità* (dropdown).
2. **Una novità di sezione per soglia chiave**: Eventi LV2, Community LV5, Co-Experience LV20.
3. **Modali: massimo 3 carte per guadagno**. Salto multi-livello → 1 carta LEVEL_UP aggregata + solo i Whisper dei KEY_LEVELS attraversati.
4. **Riti ai capstone**: LV10 = "Il Risveglio del Seme è compiuto", carta dedicata di transizione al Tier 2.

---

## 3. La rampa (narrativa e celebrazione, NON di sblocco POI)

| LV | XP cumul. | Novità percepita | Carta della catena modale | Coerenza lore (`LevelUpLore.ts`) |
|---|---|---|---|---|
| **1** | 0 | **Il Seme.** Onboarding + prima scansione guidata. Mappa: Monumenti+Fontane (default). | Onboarding → LevelUp 1 | "il seme che sto per affidare alla terra" ✔ |
| **2** | 30 | **Eventi Pubblici + Itinerari** (già a LV2) | LevelUp 2 → Whisper → **REVEAL "La città parla ora"** | "Eventi e Comunità ora ti appartengono" ✔ |
| 3 | 90 | Nessuna novità di sezione: whisper di rotta | LevelUp 3 + Whisper breve | "Hai sbloccato la creazione di percorsi" ✔ (riferita a LV2) |
| 4 | 180 | Refill fontane in evidenza (nessuna nuova sezione) | LevelUp 4 + Whisper breve | "cerca la tua prima fontanella" ✔ |
| **5** | 300 | **Community** si apre + prima **metriche CO₂** nel Profilo | LevelUp 5 → Whisper → **REVEAL "La Porta della Città"** | "Hai registrato la prima metrica di CO₂" ✔ |
| 6 | 450 | Nessuna novità: i lucchetti del vault | LevelUp 6 + Whisper breve | "i lucchetti non sono limiti, ma promesse" ✔ |
| 7 | 630 | Nessuna novità (rete/identità) | LevelUp 7 + Whisper breve | "identità si sta tessendo" ✔ |
| 8 | 840 | Nessuna novità (visitatore→custode) | LevelUp 8 + Whisper breve | "da semplice visitatore a custode" ✔ |
| 9 | 1080 | Nessuna novità: pre-annuncio primo traguardo | LevelUp 9 + Whisper breve | "preparati a distinguerti tra i fondatori" ✔ |
| **10** | 1350 | **Capstone del Tier:** RITO di passaggio (nessun nuovo POI: tutto era già visibile) | LevelUp 10 → **RITO: "Il Risveglio del Seme è compiuto"** → teaser ESPLORATORE (LV11) | "il mare ti chiama: le Radici Sommerse aspettano" ✔ |
| **11** | 1650 | Rank **ESPLORATORE** | LevelUp Rank (carta già esistente) | "Le Radici Sommerse ti accolgono" ✔ |

> ⚠️ **Nota di coerenza:** la lore di livello 2 recita "Eventi e **Comunità** ora ti appartengono" ma Community si sblocca a LV5. Da correggere il testo della lore LV2 per non promettere l'accesso prima del tempo (segnalato, non bloccante).

---

## 4. XP assegnate per sblocco (riepilogo quantitativo)

| Sblocco | Soglia XP | Costo in azioni reali (stima prod) |
|---|---|---|
| Eventi Pubblici | 30 (LV2) | 1 check-in |
| Itinerari / Percorsi | 30 (LV2) | 1 check-in |
| **Community** | 300 (LV5) | 7–8 check-in (**≈1-2h**) |
| Metrica CO₂ nel Profilo | 300 (LV5) | idem |
| Co-Experience (squad) | 6600 (LV20) | progressivo |
| **Rito capstone Tier 1** | 1350 (LV10) | ~30 check-in |
| **Rank ESPLORATORE** | 1650 (LV11) | ~40 check-in |

> I valori NON richiedono nuove XP: riusano le soglie `LEVEL_THRESHOLDS` già certificate (zero numeri magici).

---

## 5. Catena delle modali (regole anti-flood — DA IMPLEMENTARE)

Le regole si applicano a `buildLevelUpEvents`/`GamificationTransitionManager` per mettere ordine nelle modali concatenate:

1. **Aggregazione jump:** guadagno multi-livello (es. +2) → **1 sola carta LEVEL_UP** al livello finale; i Whisper intermedi compaiono SOLO se attraversano un `KEY_LEVEL` (in questo arco: 2 e 5).
2. **Ordine della catena:** `LEVEL_UP → WHISPER → (se sblocco sezione) REVEAL → (se badge) BADGE`. Massimo **3 carte**.
3. **REVEAL ≠ LOCK:** quando una sezione si sblocca (LV2 Eventi / LV5 Community) la transizione è **festosa e in positivo** (nuova carta, palette LOTO) — il `FeatureLockSheet` resta per lo stato "ancora bloccato".
4. **Brevità sui livelli non-chiave** (3,4,6,7,8,9): whisper breve di supporto, niente modale full-screen.
5. **Mai `Alert` di sistema** (G7): solo modali LOTO.
6. **Rito di capstone LV10**: carta celebrativa dedicata (asset Tier + testo di transizione), non la generica di rank.

---

## 6. Feature futura: gruppo / squadra bonus XP (design gancio)

Contesto: `loto_squads` appare nell'introspection (`supabase/schema/introspection.sql:102`); Co-Experience ha già il gate **LV20**.

**Proposta di design (da aprire quando si costruisce Co-Experience):**
- **Bonus squadra** = quando 2+ membri di una squad registrano un check-in allo **stesso POI entro una finestra temporale** (es. 30 min), viene accreditato un **bonus XP extra** raccolto a livello di squadra (es. +10 XP/membro-sincronizzato, cap giornaliero es. 5 volte) → "l'eco di squadra". Aggregato/server-side (Zero-Code layer), mai calcolato nel client.
- **Zero-PII:** join alla squadra **via QR LOTO Pass locale**, mai email/username.
- **Coerenza narrativa:** il bonus non è competitività (niente PvP, G2) ma **coordinazione civica** — i PTI restano non-spendibili e personali; l'XP di squadra alimenta solo la progressione narrativa.
- **SSOT:** nuovi parametri in `levelUtils`/schema dedicato quando la feature entra in ingegnerizzazione (B.3 "Non ancora avviato").

---

## 7. Schema di riferimento (file coinvolti per l'implementazione autorizzata)
- `utils/levelUtils.ts` → **aggregazione jump in `buildLevelUpEvents`** (anti-flood, regola §5.1).
- `components/GamificationTransitionManager.tsx` → **carta REVEAL** (sezioni che si aprono) + **carta RITO LV10** (regole §5.2/§5.6).
- `components/FeatureLockSheet.tsx` → resta per stati bloccati (invariato).
- `app/(tabs)/map.tsx` → **NON modificare** (visione utente).
- Docs SSOT: `LEVEL_THRESHOLDS` (non modificare).