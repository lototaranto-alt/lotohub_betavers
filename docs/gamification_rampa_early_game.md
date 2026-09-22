<!-- Stato: Vivente -->
<!-- Scopo: Definisce la rampa dei primi 10 livelli (progressive disclosure): i POI sono SEMPRE tutti consultabili (mai gate da XP), si decidono le sezioni sbloccate, la gestione anti-flood delle modali concatenate e il gancio della futura feature di gruppo per bonus XP. -->
<!-- SSOT: utils/levelUtils.ts (soglie), docs/gamification_hooks_analisi.md §7.2 (economia XP), docs/gamification_struttura_narrativa.md (tier) -->
<!-- Owner: gamification -->
<!-- Ultimo aggiornamento: 2026-09-22 -->

# Rampa Early-Game — Primi 10 Livelli (Il Risveglio del Seme)

> Questo documento risponde a: *"come si deve sentire l'esperienza nei primi 10 livelli, senza sovraccaricare la cognizione dell'utente?"*

## 0. DECISIONI UTENTE (21/09 + 22/09, verbatim)

**21/09:**
1. **POI e categorie NON si toccano**: *"i p.o.i e le categorie non vanno toccate è gia tutto ok cosi, i p.o.i non si sbloccano con xp"*.
2. **POI sempre sbloccati**: *"i p.o.i sono sempre sbloccati non seguono gli exp"*. Il filtro default resta **Monumenti** (già `map.tsx`) e l'utente scopre da sé il tasto per cambiare i filtri.
3. **Nessun badge "nuovo strato"** e niente gate categorie.
4. **Rito LV10**: sì, modale celebrativa dedicata di passaggio al Tier 2.

**22/09 (cadenza "ogni 2 livelli" — scelta in Q&A tool):**
5. **Cadenza RIGIDA**: 1 sezione per ogni **livello pari** — *"arrivare a sbloccare le sezioni ogni 2 lv... sbloccando le sezioni più interne un pò per volta per rendere capibile l'avanzamento dell'esperienza utente"*.
6. **Griglia scelta**: LV2 **Eventi** · LV4 **Itinerari/Percorsi** · LV6 **Diario/curation (Visioni Sospese)** · LV8 **Community** · LV10 **Rito** · LV20 **Co-Experience** (invariato).
7. **Community → LV8** (da LV5) per pura cadenza pari; il LV5 resta **KEY_LEVEL narrativo** (whisper + CO₂ nel Profilo, nessuna sezione).
8. **LV3, LV4, LV6, LV8**: whisper ancorati alla sezione che si apre al pari successivo (no promesse anticipate).

**In sintesi:** la visibilità POI è **sempre piena** (nessuna scoperta legata all'XP); la Progressive Disclosure riguarda SOLO le **sezioni** e i **riti/modali**, scandita da una cadenza prevedibile di un sblocco ogni due livelli. La rampa è *narrativa e di celebrazione*, non di *sblocco contenuti*.

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
- Layer default **`'monument'`** → al primo avvio l'utente vede Monumenti + Fontane (sempre visibili), ma **tutte le categorie sono già consultabili** dal dropdown.
- Popolamento seed (`supabase/seed_alpha_pois.sql`): monument 27 · museum 13 · park 127 · attraction 10 · fountain 2 = 179 POI.
- **Nessuna modifica richiesta qui** (visione utente Q1/Q2).

### 1.4 Gate sezioni reali (`utils/levelUtils.ts`, cadenza pari SSOT `SECTION_UNLOCK_LEVELS`)
| Sezione | Livello | Costante | Note |
|---|---|---|---|
| Eventi Pubblici | **LV2** | `EVENTS_UNLOCK_LEVEL` | pill "Eventi" in mappa + footer Home ("LV.2" non bloccante) |
| Itinerari / Percorsi | **LV4** | `ITINERARIES_UNLOCK_LEVEL` | FAB 3 "Crea Percorso" in mappa (era LV2 hardcoded `xp>=30`) |
| Diario / Visioni Sospese | **LV6** | `DIARY_CURATION_UNLOCK_LEVEL` | zona "Memorie" in Profilo (era sempre aperta); "Scoperte/Vault" invariato |
| Community | **LV8** (era LV5) | `COMMUNITY_UNLOCK_LEVEL` | tab bloccato con `FeatureLockSheet` "??? (LV.8)" |
| Co-Experience (squad) | **LV20** | `CO_EXPERIENCE_UNLOCK_LEVEL` | `FeatureLockSheet` "??? (LV.20)" (invariato) |

### 1.5 Catena modali oggi (`utils/levelUtils.ts` + `components/GamificationTransitionManager.tsx`)
- `buildLevelUpEvents()` accoda **1 carta LEVEL_UP aggregata** al livello finale + **1 WHISPER per KEY_LEVEL attraversato** (anti-flood, max 3 carte).
- Coda serializzata (`queueEvents`) e tipi carta: **LEVEL_UP / WHISPER / REVEAL / RITO / BADGE**.
- **REVEAL** = transizione **festosa in positivo** per ogni soglia pari attraversata (Eventi/Itin/Diario/Community). Il `FeatureLockSheet` resta solo per lo stato "ancora bloccato".

---

## 2. Principio guida (anti-sovraccarico cognitivo)

> **La città non si "sblocca": si celebra.** Tutti i POI sono sempre lì, come una mappa vera. L'XP guida SOLO il viaggio narrativo e l'accesso a un numero ridotto di sezioni, scandito da un ritmo prevedibile (1 nuova sezione ogni 2 livelli).

Regole derivate:
1. **Mai nascondere contenuti dietro l'XP sulla mappa** (vincolo assoluto utente).
2. **Una novità di sezione per livello pari**, dalla più esterna alla più interna: Eventi (passivo) → Itinerari (attivo) → Diario/Memorie (personale) → Community (sociale).
3. **Modali: massimo 3 carte per guadagno**. Salto multi-livello → 1 carta LEVEL_UP aggregata + solo i Whisper dei KEY_LEVELS attraversati + REVEAL delle soglie pari attraversate.
4. **Riti ai capstone**: LV10 = "Il Risveglio del Seme è compiuto", carta dedicata di transizione al Tier 2; Co-Experience resta capstone sociale LV20.

---

## 3. La rampa (cadenza: 1 sezione ogni 2 livelli — decisione 22/09)

| LV | XP cumul. | Cadenza | Novità percepita | Carta della catena modale | Coerenza lore (`LevelUpLore.ts`) |
|---|---|---|---|---|---|
| **1** | 0 | — | **Il Seme.** Onboarding + prima scansione guidata. Mappa: Monumenti+Fontane (default). | Onboarding → LevelUp 1 | "il seme che sto per affidare alla terra" ✔ |
| **2** | 30 | 🎉 pari | **Eventi Pubblici** (pill mappa + footer Home) | LevelUp 2 → Whisper → **REVEAL "La Voce della Città"** | "gli Eventi Pubblici si aggiungono al tuo cammino" ✔ |
| 3 | 90 | voce | Nessuna sezione: whisper di passo | LevelUp 3 + Whisper breve | "ogni passo fuori dalla folla è una firma" ✔ (niente promesse) |
| **4** | 180 | 🎉 pari | **Itinerari / Crea Percorso** (FAB mappa) | LevelUp 4 → Whisper → **REVEAL "Il Tuo Segno sul Territorio"** | "le tue rotte ne sono le scritture" ✔ |
| 5 | 300 | voce | Nessuna sezione: **metrica CO₂ nel Profilo** (KEY_LEVEL narrativo) | LevelUp 5 + Whisper | "Hai registrato la prima metrica di CO₂" ✔ |
| **6** | 450 | 🎉 pari | **Diario: Visioni Sospese** (Memorie/filtri) | LevelUp 6 → Whisper → **REVEAL "La Memoria Prende Colore"** | "i lucchetti... ogni traguardo sblocca una pagina della memoria" ✔ |
| 7 | 630 | voce | Nessuna sezione: rete/identità | LevelUp 7 + Whisper breve | "identità si sta tessendo" ✔ |
| **8** | 840 | 🎉 pari | **Community** si apre | LevelUp 8 → Whisper → **REVEAL "La Porta della Città"** | "la Community si apre a chi ha imparato a leggere il territorio" ✔ |
| 9 | 1080 | voce | Nessuna sezione: pre-annuncio traguardo | LevelUp 9 + Whisper breve | "preparati a distinguerti tra i fondatori" ✔ |
| **10** | 1350 | 🎭 rito | **Capstone del Tier:** RITO di passaggio (nessun nuovo POI: tutto era già visibile) | LevelUp 10 → **RITO: "Il Risveglio del Seme è compiuto"** → teaser ESPLORATORE (LV11) | "il mare ti chiama" ✔ |
| **11** | 1650 | rank | Rank **ESPLORATORE** | LevelUp Rank (carta già esistente) | "Le Radici Sommerse ti accolgono" ✔ |
| **20** | 6600 | capstone | **Co-Experience** (squadra, sincronia) | card dedicata (già presente) | — |

> **Battito della città:** livelli **pari = sviluppo** (una sezione si apre, dalla più esterna alla più interna), livelli **dispari = voce** (solo whisper, spazio per respirare). Co-Experience a LV20 resta il capstone sociale/finale.

---

## 4. XP assegnate per sblocco (riepilogo quantitativo)

| Sblocco | Soglia XP | Costo in azioni reali (stima prod) |
|---|---|---|
| Eventi Pubblici | 30 (LV2) | 1 check-in |
| Itinerari / Percorsi | 180 (LV4) | ~4-5 check-in |
| Diario: Visioni Sospese | 450 (LV6) | ~11 check-in |
| Metrica CO₂ nel Profilo | 300 (LV5) | 7–8 check-in (narrativo, non sezione) |
| **Community** | 840 (LV8) | ~20 check-in |
| Co-Experience (squad) | 6600 (LV20) | progressivo |
| **Rito capstone Tier 1** | 1350 (LV10) | ~30 check-in |
| **Rank ESPLORATORE** | 1650 (LV11) | ~40 check-in |

> I valori NON richiedono nuove XP: riusano le soglie `LEVEL_THRESHOLDS` già certificate (zero numeri magici).

---

## 5. Catena delle modali (regole anti-flood — IMPLEMENTATE 22/09)

Le regole si applicano a `buildLevelUpEvents`/`GamificationTransitionManager`:

1. **Aggregazione jump:** guadagno multi-livello (es. +2) → **1 sola carta LEVEL_UP** al livello finale; i Whisper intermedi compaiono SOLO se attraversano un `KEY_LEVEL` (in questo arco: 2 e 5).
2. **Ordine della catena:** `LEVEL_UP → WHISPER → (se sblocco sezione) REVEAL → (se rito capstone) RITO → (se badge) BADGE`. Massimo **3 carte**.
3. **REVEAL ≠ LOCK:** quando una sezione si sblocca (LV2 Eventi / LV4 Itinerari / LV6 Visioni Sospese / LV8 Community) la transizione è **festosa e in positivo** (nuova carta, palette LOTO) — il `FeatureLockSheet` resta per lo stato "ancora bloccato".
4. **Brevità sui livelli non-pari** (3,5,7,9): whisper breve di supporto, niente modale full-screen.
5. **Mai `Alert` di sistema** (G7): solo modali LOTO.
6. **Rito di capstone LV10**: carta celebrativa dedicata (asset Tier + testo di transizione), non la generica di rank.

## 5bis. Gate implementati per la cadenza (22/09)
- `utils/levelUtils.ts`: costanti SSOT `EVENTS=2 · ITINERARIES=4 · DIARY_CURATION=6 · COMMUNITY=8 · CO_EXPERIENCE=20`; `SECTION_UNLOCK_LEVELS` (ordine pari) + `UNLOCK_REVEALS` esteso (4 voci).
- `buildLevelUpEvents`: REVEAL generalizzata su `SECTION_UNLOCK_LEVELS`.
- `app/(tabs)/map.tsx`: `useGamification().level` (SSOT reattivo, pattern F1) al posto di `xp>=30` hardcoded; pill Eventi=LV2, FAB Crea Percorso=LV4.
- `components/ProfileModal.tsx`: zona "Memorie/Visioni Sospese" gated a LV6 con `FeatureLockSheet` (tag "??? (LV.6)"); Scoperte/Vault invariato.
- `utils/LevelUpLore.ts`: whisper LV2/LV3/LV4/LV6/LV8 ancorati alla cadenza (niente promesse anticipate, Community citata a LV8).

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
- `utils/levelUtils.ts` → **aggregazione jump in `buildLevelUpEvents`** (anti-flood) + **gate cadenza pari SSOT** (implementate 22/09).
- `components/GamificationTransitionManager.tsx` → **carta REVEAL** (sezioni che si aprono) + **carta RITO LV10** (implementate 21/09).
- `components/FeatureLockSheet.tsx` → resta per stati bloccati (Community LV8, Visioni Sospese LV6, Co-Experience LV20).
- `app/(tabs)/map.tsx` → gate Eventi/Itinerari via `useGamification().level` (NON tocca i POI).
- Docs SSOT: `LEVEL_THRESHOLDS` (non modificare).