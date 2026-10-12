---
id: FASE2-DISALLINEAMENTO-PROGRESSIONE
tipo: documentazione-fase2
ambito: gamification-progressione-nerrativa
stato: Bozza (blocchi da implementare in Fase 2)
confidenza: Alta (diagnosi su codice), Medio (soluzioni)
owner: Team
aggiornato: 2026-10-12
evidenza:
  - utils/levelUtils.ts:311
  - utils/levelUtils.ts:327
  - utils/LevelUpLore.ts:13
  - components/GamificationTransitionManager.tsx:42
  - components/GamificationTransitionManager.tsx:66
  - components/GamificationTransitionManager.tsx:72
  - components/LevelUpModal.tsx:19
  - app/(tabs)/index.tsx:307
  - app/(tabs)/index.tsx:595
  - app/p/[id].tsx:28
  - app/p/[id].tsx:88
  - app/p/[id].tsx:134
  - components/PoiDetailSheet.tsx:115
  - components/ImpactStatsModal.tsx:68
  - components/ImpactStatsModal.tsx:91
  - components/ProfileModal.tsx:252
  - components/TraguardiModal.tsx:79
  - game: supabase/diagnostica_fase1/LISTA BUG TROVATI.txt
  - app/_layout.tsx:157
---

# Fase 2 — Disallineamento della progressione (lvup · modali/transizioni · cronologia · contatori · lore)

> Blocchi di lavoro **Fase 2** (gamification). La diagnosi sotto è verificata sul codice al
> 12/10/2026; le soluzioni L1–L5 sono proposte da implementare in Fase 2, NON ancora applicate.
> Il collaudo heat/crowd (Fase 1) NON è toccato da questi blocchi.

---

## 1. Il problema in una frase

Lo stesso avanzamento reale (XP → livello) genera **tre sistemi celebrativi paralleli**,
**tre registri di lore** diversi e **nessuna cronologia persistente**: l'utente percepisce
contatori che corrono, carte che si accavallano o spariscono, e una storia (Diario/Cronologia)
che resta muta.

---

## 2. Diagnosi (verificata, con righe)

### A. Tre sistemi celebrativi per lo stesso evento
1. **Coda ufficiale** — SSOT eventi da `buildLevelUpEvents` (`utils/levelUtils.ts:311`),
   emessa via `GamificationContext.queueEvents` (`context/GamificationContext.tsx:63`) →
   `GamificationTransitionManager` (carte LEVEL_UP / WHISPER / REVEAL / RITO / BADGE).
   Usata correttamente da: `PoiDetailSheet.tsx:115-122`, `index.tsx:595-598`, `p/[id].tsx:88-92`.
2. **Tips legacy paralleli** — `app/(tabs)/index.tsx:307-325`: su **qualunque** aumento di XP
   aziona `setIsTipsVisible(true)` per 3 minuti, **fuori dalla coda** → doppia celebrazione
   non ordinata con le carte (sovrapposizione visiva percepita).
3. **Modale morta** — `app/p/[id].tsx:28-30` e `134-149`: `levelUpTitle`/`levelUpMessage`
   MAI valorizzati e `levelUpModalVisible` mai `true`. Se mai diventasse visibile mostrerebbe
   titolo e testo VUOTI. Dead code che viola la SSOT del lore.

### B. Lore in tre registri
1. **SSOT corretta** — `utils/LevelUpLore.ts:13` (`LEVEL_UP_LORE`, 50 voci it/en) → usata
   dalla coda (`levelUtils.ts:327`) e da `TraguardiModal.tsx:79` (galleria livelli).
2. **Legacy incoerente** — `components/LevelUpModal.tsx:19-26` `WHISPERS_DB`: mock con testi
   e tier divergenti ("Cittadini Attivi"). **Non importato da nessun file** → va rimosso.
3. **Whispers per-POI** — tabella DB `whispers`, mostrata come "MISTERI E WHISPERS"
   (`PoiDetailSheet.tsx:173-184, 600-626`). Riusa la parola "Whisper/SUSSURRO" per un
   concetto diverso dalla pillola di livello → percezione di contraddizione narrativa.

### C. Race di accavallamento nelle transizioni
`GamificationTransitionManager.tsx:42-50` (`queueEvents`)  vs  `66-78` (`handleNext`):
una `queueEvents` che arriva durante i **400 ms di fade-out** dell'ultima carta può essere
spazzata da `setQueue([])` (`:72-75`) → **carte che spariscono in modo non deterministico**
(double check-in ravvicinato / whisper durante la chiusura). L'animazione d'ingresso
(`:52-64`, dipende da `[currentIndex, visible]`) non riparte se la coda riceve eventi a riposo.

### D. Cronologia disallineata dalla progressione reale
`ImpactStatsModal.tsx:68,91` ("CRONOLOGIA IMPATTO"/"CRONOLOGIA PUNTI") legge **solo**
`impact_transactions` (co2_saved / tokens_earned). Il **lvup non crea alcuna riga** né nel
Diario (`ProfileModal.tsx:252+` = Fiore del giorno + percorsi AsyncStorage) né in cronologia:
**livello/rank/pillole non compaiono mai nella storia**. Contatori corrono, storia muta.

### E. Contatori stale dopo lvup da deep-link
`app/p/[id].tsx:88-98`: coda le carte ma **non chiama `refreshGamification()`** → i contatori
restano ai valori vecchi fino al focus successivo.

---

## 3. Soluzione proposta (blocchi Fase 2)

| Blocco | Contenuto | Rischio |
|---|---|---|
| **L1** | Unificare la celebrazione: estirpare i Tips paralleli di `index.tsx:307-325` (o convertirli in carta in coda). | Basso |
| **L2** | Rimuovere modale morta `p/[id].tsx:28-30,134-149` + file legacy `LevelUpModal.tsx` (+ `WHISPERS_DB`). | Basso |
| **L3** | Hardening coda: guardia `isDraining` in `queueEvents` + flush corretto al fade-out finale (fix carte perse/accavallate). | Basso |
| **L4** | Cronologia collegata: evento persistente di progressione (livello+rank+pillola) scrivibile sia dal client che, preferibilmente, da RPC lato server; letto da `ImpactStats`/`Diario`. | Medio (tocca Supabase + client) |
| **L5** | Coerenza narrativa: riordinare i nomi "pillola di livello" vs "Misteri" POI; documentare in `FORMULE-PROPRIETARIE.md`. | Basso |

Ordine consigliato: **L3 → L1 → L2** (vincolo `tsc`), poi **L5**, infine **L4** (blocco
dati). Da fare in parallelo: audit contatori di sezione (`LISTA BUG` riga 7).

---

## 4. Mapping della "LISTA BUG TROVATI" (12/10)

Riga dal file `supabase/diagnostica_fase1/LISTA BUG TROVATI.txt` → azione Fase 2:

| # | Segnalazione | Destino |
|---|---|---|
| 1 | Banner feed community deve contare tutte le azioni in modale + tempi già elaborati | F2 – feed realtime (vedi §5 nota) |
| 2 | Desincronizzazione lvup ecc. | **Questo documento §2–§3** |
| 3 | Eco-passi device 2: notifica resta in caricamento, non sincronizza | F2 – da diagnosticare (mobility/sensor) |
| 4 | Mappa LV4 "Crea Itinerario": sezione sbloccata ma tap non apre nulla | F2 – da localizzare il bottone; screen `route-creation-mockup` ESISTE (`app/_layout.tsx:157`), pero' su APK device 2 congelato va ricordinato con la release corrente |
| 5 | Avviso POI in vicinanza + anti-accavallamento avvisi in raggio cella | **Non presente nel codice attivo né in `archive_dead_code`** → da recuperare nei doc storici, poi decidere se adottarlo (potenziale arricchimento dati/sezioni) |
| 6 | Contatori modali di sezione: leggeri disallineamenti | F2 – audit contatori |
| 7 | CO₂ "generose": rischio di falsare l'ecosistema | F2 – calibrazione metriche |
| 8 | Diario: titolo ancora "Hub" + Fiore di oggi non conta bene le azioni | F2 – copia veloce |
| 9 | Vibrazione/altro: `LISTA` a 9 righe | — |

> Nota spec (riga 1): il feed community oggi legge `user_pois`/`user_badges`/`impact_transactions`
> solo al focus (`account` `utils/communityFeed.ts`; `index.tsx:184`). "Tutte le azioni + tempi
> già elaborati" = portarlo allo spec (realtime/subscription) nel blocco feed di F2.

---

## 5. Esito della finestra POI test (12/10) — verifica crowd/BLE

| Verifica | Esito |
|---|---|
| **45** — `vw_poi_crowd_now` (baseline) | TEST HeatScore **B**: devices=3 · reporters=1 · certified=3 · 12:14; TEST HeatScore **A**: devices=1 · reporters=1 · certified=1 · 12:13 |
| TEST B check-in | **Bocciato per distanza** ("troppo distante dal POI test B", raggio 500 m) → comportamento atteso, non bug |
| **46** — `crowd_predictions` raw multi-BLE | TEST B: **1 scansione** (13:44) · 1 reporter · **1 device** · certified 1 · confidence 1. Lettura operativa: la scansione della finestra POI test ha visto **1 solo device BLE** (niente multi-BLE in raggio al momento); «certified 1 / confidence 1» = riga **non validata** (pattern non raggiunto). Le righe di B delle 12:xx viste in V1 risultano **scadute** (finestra 60 min chiusa alle 12:44) → conferma in vivo del decay crowd del §4.5 |

> Nota schema: la RPC scrive in `crowd_predictions` le colonne `raw_count`, `certified_count`,
> `confidence_score`; il `certified` della vista è `max(certified_count)`.
> (`20261008160000_process_crowd_radar_no_heat_m11.sql:77-92`)

---

## 6. Collegamenti
- Documento di riferimento architettura/catena dati: `../ARCHITETTURA-FUNZIONALE-E-CATENA-DATI.md`
  (in particolare **§4.5 I tempi del cerchio — cold start**).
- Formule/proprietà: `../FORMULE-PROPRIETARIE.md` (da aggiornare con L5).