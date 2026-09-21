# 🧭 TRIANGOLAZIONE GAMIFICATION — Ganci Psicologici & Fix (Analisi Verificata sul Codice)

> **Scopo:** Leggere e validare prima di implementare.
> **Metodo:** I concetti dei doc (`BIG_TECH_PSYCHOLOGY_HOOKS`, `GAMIFICATION_EXPERIENCE_ENGINE`,
> `gamification_levelup_experience`, `LOTO_Analisi_Piattaforme_Testo_Unico`) sono stati incrociati
> con lo **stato REALE del codice** (SSOT: `utils/levelUtils.ts`, `context/GamificationContext.tsx`,
> `utils/badgesCatalog.ts`, `app/(tabs)/_layout.tsx`, `app/(tabs)/index.tsx`). Il testo di partenza
> non è stato preso per buono: ogni voce riporta cosa esiste già e cosa manca.

---

## 1. TABELLA HOOK → STATO REALE

| # | Hook (da Big Tech) | Fonte | Stato nel codice | Verdetto |
|---|---|---|---|---|
| 1 | **Zeigarnik / Anelli** (Apple Fitness) — "fiore a 3 petali giornaliero" | DOC 1 | Nessun ritorno quotidiano presente | **MANCA** — gancio di retention più forte |
| 2 | **Loss-Aversion / Streak** (Duolingo) — "Rugiada" 7 giorni + freeze con PTI | DOC 1 | Nessuna sequenza giorni | **MANCA** — zero codice |
| 3 | **Fog of War** (Zenly) — nebbia sulla mappa che si dirada camminando | DOC 1 | Mapbox v10 attiva, nessuna maschera | **MANCA** — costo medio, payoff alto |
| 4 | **Kudos/Risonanza** (Strava) — notifica "15 esploratori hanno risuonato" | DOC 1 | Whisper anonimi ESISTONO (`PoiDetailSheet`), ma **nessun loop di ritorno/push** | **METÀ** |
| 5 | **PvE anti-Foursquare, barra Impatto Collettivo, Golden POI, Halo NFC** | DOC 2 | Filosofia rispettata (nessun Sindaco, no PvP); barra impatto e Golden POI **non presenti** nella UI | **PARZIALE** |
| 6 | **Level-Up a 2 fasi: Esplosione + Pillola Narrativa** | DOC 3 | Implementato in `GamificationTransitionManager` (LEVEL_UP + WHISPER) + lore `LevelUpLore.ts` | **PRESENTE** |
| 7 | **Pillole narrative livelli 11-30** (testi Terra/Acqua/Linfa) | DOC 3 | Lore copre solo 1-30 in `LevelUpLore`; testi 31-50 → null (ok, non bloccante) | **PRESENTE** |
| 8 | **unlockFeature a livelli chiave → tab segreto nella bottom bar** | Nota utente | Community GIÀ gate a LV5 con **popup bloccante** (`_layout.tsx:184`) | **PRESENTE MA CON FATTO** (vedi F1-F3) |

---

## 2. VERIFICHE SUI COMPETITOR (conferme, da NON toccare)

- **Foursquare**: le falle (PvP tossico, GPS always-on, PII) sono già evitate dal design: tap NFC attivo, zero-PII, no Sindaci. ✅ Confermato ok.
- **MUV Game**: il tracciamento lineare (casa→lavoro) è già evaso coi "Nodi" (Proof of Action NFC). ✅ Confermato ok.
- **Loquis**: l'errore "drive-by" è già evaso (audio/premium si sblocca SOLO dopo tap NFC). ✅ Confermato ok.

**Conclusione competitor:** il posizionamento non cambia. Il lavoro è **iniettare i ganci mancanti** (tabella 1) e correggere i fix sotto.

---

## 3. 🔧 FIX SU FEATURE GIÀ IN POSSESSO

### F1 — Tab gate REATTIVO (Bloccante: va fatto PRIMA di tutto)
**Problema:** `app/(tabs)/_layout.tsx:37-54` carica `userLevel` **UNA sola volta al mount** con una fetch a Supabase. Con il check-in "senza reload brutale" l'utente sale di livello in sessione ma `userLevel` resta vecchio → il gate Community non si apre e l'unlockFeature non può scattare.
**Fix:** leggere il livello dall'SSOT già reattivo `useGamification().level` (o `levelProgress.currentLevel`) invece della fetch una tantum.

### F2 — Loop di ritorno "Risonanza Civica"
**Problema:** l'utente lascia un Whisper ma non riceve MAI la botta di dopamina del riconoscimento ("La tua traccia ha risuonato con N esploratori oggi").
**Fix:** count incrociato su `whispers`/`user_pois` + push locale (canale notifee `sincro-avventura` già disponibile) a fine giornata o a intervalli.

### F3 — Sostituire il popup "Sezione Chiusa 🔒"
**Problema:** `Alert` ripetuto ad ogni tap su Community (< LV5) = frustrazione, segnala solo divieto.
**Fix:** tab sempre visibile ma in "preview lockata" (icona sbiadita/grigia + label "??? (LV.X)"), stesso pattern già usato da `ProfileModal` per Co-Experience ("??? (LV.20)"). L'unlock a LV raggiunto è festeggiato dal livello-up.

---

## 4. ✨ FEATURE NUOVE (per impatto)

### F4 — Il Fiore a 3 Petali (Zeigarnik) — HOME
- 3 micro-azioni giornaliere colorano 3 petali: 🟢 2km a piedi (o 1kg CO₂), 🟡 1 check-in NFC, 🔵 1 Whisper/scoop narrativo.
- L'utente apre l'app la sera per "chiudere l'ultimo petalo".
- Posto: home sopra la mappa (zona `index.tsx`), leggero, nessun server.

### F5 — La Rugiada / Streak (Loss-Aversion) + Economy Burner
- 7 giorni di fila → moltiplicatore passivo di PTI.
- Salto di un giorno → il fiore "appassisce", contatore a zero.
- **Freeze** della giornata pagando PTI: crea l'economia circolare di burn (i token non servono solo per sconti fisici).
- ⚠️ **Pre-requisito da validare (F6-ricerca):** il ritmo XP reale deve essere coerente con la curva (`LV5=300XP`) raggiungibile in ~1-2h di esplorazione, altrimenti streak e petali collassano. Prima di costruire F5 va misurato l'XP effettivo per check-in/scansione.

### F6 — Fog of War (Curiosità spaziale)
- Maschera/nebbia artistica su Mapbox; un raggio di ~50m attorno al cursore utente dirada la nebbia in modo permanente.
- Trasforma il camminare in gioco di scoperta ("vicoli sconosciuti").
- Nota: è il più costoso dei tre; la mappa usa già `heatScores` per il "calore", infrastruttura compatibile.

---

## 5. 🎨 VINCOLO STILISTICO (Richiesto dall'utente)

Tutte le modali — incluse quelle di **unlockFeature** (F1/F3) e Level-Up — vanno personalizzate in **stile e palette LOTO MAP**. Riferimenti disponibili:

- **Palette Freemium (default)** — `context/ThemeContext.tsx:6-16`:
  - background `#FDF8F2` (Crema) · surface `#FFFFFF` · text `#1A1C1E` (Ebano)
  - primary `#5F713D` (Verde Oliva) · secondary `#C36B4D` (Terracotta) · accent `#D9A05B` (Sabbia Dorata)
- **Palette Elite (premium)** — `ThemeContext.tsx:18-28`: dark neo-futurista (bg `#0A0F14`, primary neon cyan `#00F0FF`, magenta `#FF00FF`).
- **LOTO_PALETTE mappa** — `constants/MapConfig.ts:38` (GREEN `#4A5D23` etc.).
- **Pattern glassmorphism** già usato in `GamificationTransitionManager` e `LevelUpModal` (BlurView + bordi gold `#D4AF37`).

**Quindi:** qualsiasi nuova modale (unlock tab, reveal, streak, petali) deve usare `useTheme()` e NON colori hard-coded estranei, per restare in stile con le esistenti.

---

## 6. CONSIGLIATO DA FARE (Aggiornato alla priorità)

1. **F1** — gate reattivo (bloccante, costo ~30 min, zero rischio).
2. **Ricerca ritmo XP** (quanto XP = 1 check-in oggi) prima di F4/F5.
3. **F3** — preview lockata al posto dell'Alert (coerente col vincolo stilistico §5).
4. **F4 → F5 → F6** in quest'ordine (impatto/costo).
5. **F2** — loop Risonanza (push).

---

## 7. DECISIONI UTENTE (Validazione 20/09) — Stato di ogni feature

> Registro delle osservazioni dell'utente: ogni feature è stata validata/corretta. Nulla è "prefissato": ciò che è
> contrassegnato proposto è in attesa di conferma prima di essere ingegnerizzato.

| # | Feature | Verdetto utente | Azione |
|---|---|---|---|
| F1 | Tab gate reattivo | ✅ **OK** — "esperienza più fluida" | **FATTO** (`_layout.tsx` ora legge `useGamification().level`). |
| F2 | Risonanza Civica | ⚠️ **Da strutturare prima con precisione** — rischio moderazione costante se non automatizzabile | Vedi §7.1 |
| F3 | Preview lockata al posto dell'Alert | ✅ **OK** + vincolo: i POPUP vanno **personalizzati in stile LOTO** (mai notifiche di sistema) + **definire i livelli chiave** per la soglia di apprendimento | Vedi §7.2 |
| F4 | Fiore a 3 Petali | ✅ **OK** — obiettivi 🟢 e 🟡 confermati; **🔵 = 3° petalo scelto: B (sfida-quotidiana a rotazione)** | Vedi §7.3 |
| F5 | Rugiada/Streak | ✅ **Base ok** — ⚠️ **i punti non sono spendibili**; economia PTI da brainstorming separato a fine app; pre-req resta misura ritmo XP | Solo analisi XP per ora |
| F6 | Fog of War | ✅ **Zona dedicata confermata:** hub **dentro il Profilo** chiamato **"Diario di Bordo"** | Vedi §7.4 |

### 7.1 F2 — Strutturazione & Rischio moderazione
- Stato REALE verificato: la tabella `whispers` è **contenuto curato dal team** (nessun INSERT UGC lato app: `PoiDetailSheet` la legge solo in lettura). Quindi oggi **nessun contenuto generato dall'utente** → rischio moderazione **BASSO** per il loop di ritorno.
- **Proposta precisa:**
  1. Il count "N esploratori" è calcolato su **azioni oggettive** (utenti che hanno sbloccato/letto la stessa whisper via check-in NFC), NON sul voto social → **nessun testo nuovo da moderare**.
  2. Push locale a intervalli (canale `sincro-avventura` già esistente) con testo **template** (mai contenuto UGC nel push).
  3. **Se in futuro** si aprirà la scrittura UGC dei Whisper → richiede flusso di auto-moderazione (filtro profanità + quarantine admin) PRIMA del rilascio. Da NON fare ora.
- **Decisione presa:** nessuna moderazione manuale richiesta; il loop si fonda su dati oggettivi già presenti in DB.

### 7.2 F3 — Livelli chiave (soglia di apprendimento utente) — CONFERMATO
**Soglia XP per AZIONE (economia verificata nel codice, SSOT):**

| Azione | XP | Fonte codice |
|---|---|---|
| Check-in NFC/scan POI | `base_xp` del POI (default 15; in prod seed: 30-50). Cooldown 12h stesso POI | `scan_poi_gps` (`anti_spoofing_scan_poi_gps.sql:88-92`), `seed_pois.sql` |
| Sblocco storia/media del POI | +30 XP | `index.tsx:69,96` (i18n) |
| Eco-Passi a piedi | 100 m = 5 XP (e 1 PTI) | `SincroAvventura.ts:57` |
| Impatto ESG (ristoranti/bar) | floor(kgCO₂ × 100 + litri × 20) | `calculate-esg-impact/index.ts:42` |
| Itinerario pianificato | POI × 10 XP + bonus mobilità | `create_itinerary` (`pure_cloud_queries/22`) |
| Evento pubblico | `xp_reward` default 10 | schema `events` |
| Badge evento speciale (es. Sentinella) | +50 XP | `GameAchievementsSheet.tsx:87` |

**Derivazioni per la curva di apprendimento** (`LEVEL_THRESHOLDS`, riferimento `LV5=300XP`):

| Livello | XP cumul. | Stima sforzo (a ~15-30 XP/check-in) |
|---|---|---|
| LV2 | 30 | ~1-2 check-in (primo quarto d'ora) |
| LV5 | 300 | ~10-15 check-in ≈ **1-2h di esplorazione** ✅ coerente col doc |
| LV11 | 1.650 | ~2-3 giornate di scoperta |
| LV20 | 6.600 | traguardo Co-Experience (settimane) |
| LV30 | 16.750 | seconda soglia Community/evento speciale (**CONFERMATO dall'utente**) |
| LV41 | 31.600 | Rank massimo LEGGENDA |

> **Nota (ritmo XP, pre-req F5):** i valori sopra vanno **misurati a runtime** con log reali prima di costruire
> streak/Fiore, per confermare che il ritmo reale corrisponda alla curva (in caso contrario si calibrano
> `base_xp` dei POI o i bonus, non la curva).

**Mappa SSOT verificata nel codice dei gate ESISTENTI (tutte già live, solo alcune con popup da sostituire):**

| Live | Unlock (verificato nel codice) | Dove | Stile attuale |
|---|---|---|---|
| LV1 | Easy entry: mappa sempre accessibile | `_layout.tsx:134` | ✅ ok |
| LV1 | Filtri camera base ("Naturale"/"Bisso") | `MemoriesCameraModal.tsx:17-18` | ✅ |
| LV2 | Eventi Pubblici visibili (badge "LV.2") | `index.tsx:845` | badge non bloccante ✅ |
| LV5 | **Community** | `_layout.tsx:162` | Alert bloccante ❌ → **F3** |
| LV11 | Rank ESPLORATORE + filtro "Geometrie Spartane" | `MemoriesCameraModal:19` | ✅ |
| LV20 | **Co-Experience** (pattern "??? (LV.20)") | `ProfileModal.tsx:88-89` | ✅ già preview lockata (modello PER F3) |
| LV21 | Rank CUSTODE + filtro "La Linfa del Loto" | `MemoriesCameraModal:20` | ✅ |
| LV30 | **Nuovo:** seconda soglia Community/evento speciale | da definire | — |
| LV31 | Rank EROE DEL MARE + filtro "Ombre del Borgo" | `MemoriesCameraModal:21` | ✅ |
| LV41 | Rank LEGGENDA L.O.T.O. + filtro "Sigillo dei Due Mari" | `MemoriesCameraModal:22` | ✅ |
| per-media | `required_level` contenuti segreti (DB-driven) | `PoiDetailSheet.tsx:305,685` | Alert ✅ coerente |

**Decisione presa:** livelli chiave SSOT `1 → 2 → 5 → 11 → 20 → 21 → 30 → 31 → 41`, da centralizzare in una
costante `KEY_LEVELS` accanto a `levelUtils.ts` (nessun numero magico nel codice) → F3 e i futuri unlock usano UNA fonte.

### 7.3 F4 — Proposta confermata per il 3° petalo (🔵)
- Confermati: 🟢 2km a piedi (o 1kg CO₂) · 🟡 1 check-in NFC.
- **3° petalo — SCELTO (opzione B): sfida-quotidiana a rotazione.** Pool statico di micro-sfide
  ("visita un POI con targa NFC in un quartiere nuovo", "sblocca una memoria", "attiva un Eco-Passo", ...);
  nessun contenuto narrativo dipendente, costo basso, massimo effetto Zeigarnik/retention.

### 7.4 F6 — ZONA "DIARIO DI BORDO" (CONFERMATO)
- **Nome scelto:** **Diario di Bordo**. **Posizione:** **hub dentro il Profilo** (nessuna nuova tab).
- Raccolglie (palette LOTO, `useTheme()`, zero notifiche di sistema):
  ① *Scoperte* — Vault + attivazione Fog of War (toggle nebbia) ·
  ② *Memorie* — MemoriesCamera (filtri per rank) ·
  ③ *Co-Experience* — se LV≥20, altrimenti card "??? LV.20" (pattern esistente `ProfileModal`).
- Da ingegnerizzare insieme a F3/F4 (stessa schermata hub → stessi stili → stessa SSOT `KEY_LEVELS`).

*Stato: documento di analisi. F1 implementato; decisioni utente F2-F6 registrate in §7 con economia XP per azione.
Prossimo passo ingegnerizzabile: F3 (preview lockata) con `KEY_LEVELS` centralizzata.*