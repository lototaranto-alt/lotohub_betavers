---
id: A2
tipo: area
ambito: progressione-utente-livelli-badge-e-sblocco-sezioni
stato: Vivente
confidenza: Alta
owner: Agent
aggiornato: 2026-09-26
evidenza:
  - utils/levelUtils.ts:13
  - utils/levelUtils.ts:17-21
  - utils/levelUtils.ts:24-29
  - utils/levelUtils.ts:38-62
  - utils/levelUtils.ts:132-139
  - utils/levelUtils.ts:315-336
  - components/GamificationTransitionManager.tsx:43-49
  - components/ProfileModal.tsx:245-305
  - context/GamificationContext.tsx:92
---

# A2 - Gamification: progressione, livelli, badge, sblocco sezioni

> Risponde a: "come funziona la progressione dell'utente, dove sta la sua unica fonte di verita',
> e cosa la documentazione sbaglia?"

Questa e' l'area meglio documentata e meglio verificata del progetto. Serve da riferimento per le
altre: mostra il livello di prova che R2 richiede.

---

## 1. Cosa dice il codice

### La SSOT esiste ed e' unica

`utils/levelUtils.ts` e' l'unico posto dove vivono le soglie. Nessun componente ricalcola un
livello: tutti importano da qui.

| Elemento | Riferimento | Contenuto verificato |
|---|---|---|
| `KEY_LEVELS` | `levelUtils.ts:13` | `1, 2, 5, 11, 20, 21, 30, 31, 41` |
| `SECTION_UNLOCK_LEVELS` | `levelUtils.ts:17-21` | 2, 4, 6, 8, 20 |
| `UNLOCK_REVEALS` | `levelUtils.ts:38-62` | 4 voci, ognuna con `target` per la navigazione |
| `calculateLevel()` | `levelUtils.ts:132-139` | unica funzione di calcolo |
| `buildLevelUpEvents()` | `levelUtils.ts:315-336` | costruisce la catena di carte |

Consumatori: `context/GamificationContext.tsx:92` (derivazione del livello),
`app/(tabs)/index.tsx:314-315`, `components/PoiDetailSheet.tsx:151,299,580`, `utils/dbAggregation.ts:64`.

### La cadenza di sblocco e' VERIFICATA

Una sezione ogni 2 livelli, come deciso il 22/09:

| Livello | Sezione | Gate nel codice |
|---|---|---|
| LV2 | Eventi | `app/(tabs)/_layout.tsx:165,181` · `app/(tabs)/map.tsx:373` |
| LV4 | Itinerari | `app/(tabs)/map.tsx:430` (FAB) |
| LV6 | Visioni Sospese / Memorie | `components/ProfileModal.tsx:274-285` |
| LV8 | Community | `app/(tabs)/_layout.tsx:247` |
| LV20 | Co-Experience | `components/ProfileModal.tsx:289-305` |
| LV10 | Rito, `RITO_TIER1_LEVEL` | `levelUtils.ts:33` |

**Nota di accuratezza:** la cadenza e' continua solo da LV2 a LV8. Non ci sono sezioni a
LV10, 12, 14, 16, 18. Se un documento descrive una sezione per ogni livello pari fino a LV20,
sbaglia: le voci in `SECTION_UNLOCK_LEVELS` sono 5, non 10.

### I POI e le categorie NON sono gated da XP

`app/(tabs)/map.tsx:130-137` carica i POI senza filtro di livello; `map.tsx:187-191` filtra solo
per categoria. L'unico gate per livello e' **sui media** (`PoiDetailSheet.tsx:304-305`, via
`required_level`). Coerente con la tua decisione del 22/09: i POI sono sempre consultabili, la
progressione non ne limita l'accesso.

### Il Diario di Bordo esiste ed e' nel Profilo

`components/ProfileModal.tsx:245-250` (titolo), `:253-269` (toggle Nebbia della Memoria),
`:271-287` (Memorie, gate LV6), `:289-305` (Co-Experience, gate LV20). Si apre anche dalla REVEAL
LV6 via `GamificationTransitionManager.tsx:87-90`, consumata in `app/(tabs)/index.tsx:273-280`.

---

## 2. Cosa dice la documentazione

### `docs/gamification_rampa_early_game.md` - il documento piu' affidabile dell'area

**CONFORME al codice.** E' l'unico doc con blocco metadati coerente (`SSOT: utils/levelUtils.ts`)
e le sue affermazioni reggono: cadenza 2/4/6/8, `KEY_LEVELS`, POI non gated, rito LV10.
E' il riferimento per questa area.

### `docs/gamification_hooks_analisi.md` - tre affermazioni SMENTITE

| Cosa afferma | Realtà | Prova |
|---|---|---|
| "obiettivi di XP per azione in un unico posto" | **SMENTITA.** Nessun modulo di costanti XP esiste. I valori sono sparsi con fallback diversi: 15, 15, 50, 50, 5, 20/50/100/200 | `PoiDetailSheet.tsx:503`, `ScannedPoisSheet.tsx:60`, `app/p/[id].tsx:75`, `app/(tabs)/index.tsx:73,100,611`, `SincroAvventura.ts:57`, `mockEvents.ts:10,23,36,49` |
| "cap di 3 carte anti-flood" | **SMENTITA.** L'aggregazione c'e', il cap no: nessun clamp in coda. Un salto LV1 -> LV10 produce 1 LEVEL_UP + 2 WHISPER + 4 REVEAL + 1 RITO = **8 carte** | `levelUtils.ts:315-336` aggrega · `GamificationTransitionManager.tsx:43-49` accoda senza limite |
| "il lore esiste solo per i livelli 1-30, 31-50 -> null" | **SMENTITA.** Il lore copre tutti i 50 livelli | `utils/LevelUpLore.ts:14-210` |

Inoltre **riga 131 cita `archive_dead_code/GameAchievementsSheet.tsx`** come "fonte del codice"
per il +50 XP del badge Sentinella. Il file e' in `archive_dead_code/`: un documento che indica
codice morto come fonte non e' verificabile.

### `docs/gamification_cerchio_delle_stagioni.md` - Bozza onesta, ma invisibile

18.6 KB, 23/09, dichiara: *"Stato: **DISCUSSO** (analisi + design, da validare con l'utente PRIMA
dell'ingegnerizzazione)"*. E' l'unico documento dell'area che dichiara di non essere vincolante,
e per questo e' il piu' sicuro. **Non e' pero' indicizzato** in `docs/README.md`, quindi una
sessione nuova non lo trova ed rischia di reinventare il design della retention engine.

### Non verificato in questa sessione

- `docs/GAMIFICATION_EXPERIENCE.md` - ha i metadati, non ne ho controllato le affermazioni
- `docs/gamification_struttura_narrativa.md` - da confrontare con `LevelUpLore.ts`
- `docs/AUDIO_FEEDBACK.md` - da confrontare con la tua decisione del 23/09 "solo haptics"

---

## 3. Direzione

L'area va verso **una sola SSOT numerica, estesa a tutto quello che oggi e' sparso**, e la
decisione che la governa e' gia' presa il 22/09: *"niente calcoli fatti a mano nel frontend, la
Single Source of Truth e' `calculateLevel()`"*.

La direzione ha tre passi, in quest'ordine:

1. **Raccogliere gli obiettivi XP in `levelUtils.ts`.** Oggi il valore per un check-in e' 15 in un
   posto, 50 in un altro, con fallback hardcoded in cinque file. Finche' esiste, "quanta XP serve
   per sbloccare X" non ha una risposta. E' la stessa violazione delle regole 1 e 2 su un dato
   numerico.
2. **Mettere un cap alla coda di carte.** Il cap di 3 e' stato deciso e scritto, ma non
   implementato. Serve un clamp in `GamificationTransitionManager.tsx:43-49`, non un rework.
3. **Unificare la detection del level-up.** Vedi sotto.

## 4. Buchi e rischi

| Buco | Gravita' | Effetto se resta aperto |
|---|---|---|
| **Detection del level-up doppia** | Blocker | XP guadagnati fuori dal percorso POI **non producono nessuna carta**. `app/(tabs)/index.tsx:313-322` ha un path parallelo che mostra solo `isTipsVisible` per 3 minuti e non enqueua; la catena parte solo da `PoiDetailSheet.tsx:153,583`. Quindi `index.tsx:611` (`p_xp: 50`), `app/p/[id].tsx:75-81` e `SincroAvventura.ts:57` assegnano XP **in silenzio**, senza LEVEL_UP, WHISPER, REVEAL o RITO |
| **XP per azione non centralizzato** | Blocker | 6 file con valori e fallback divergenti: impossibile rispondere "quanto serve per sbloccare" e impossibile correggere un errore di bilanciamento |
| **Nessun cap sulle carte** | Alto | un jump LV1 -> LV10 mostra 8 modali di fila; l'anti-flood e' dichiarato ma non esiste |
| **Soglie rank duplicate fuori SSOT** | Alto | `TraguardiModal.tsx:33` (`[1,11,21,31,41]`) e `MemoriesCameraModal.tsx:19-22` (`minLevel: 11/21/31/41`) ricopiaano `levelUtils.ts:149-159` invece di usare `KEY_LEVELS`. Cambiare `KEY_LEVELS` le lascia fuori sincrono |
| **Badge UI doppia** | Medio | `BadgeCollectionModal.tsx` (aperto da `profile.tsx:447`) e il tab BADGE di `TraguardiModal.tsx:55-56,151` renderizzano la stessa lista `ALL_BADGES` con la stessa `getBadgeProgress`, e condividono `SingleBadgeSheet` |
| **Tipo evento `BADGE` mai prodotto** | Medio | dichiarato in `GamificationTransitionManager.tsx:23` e renderizzato a `:291`, ma nessun `queueEvents([{type:'BADGE'...}])` esiste. I nuovi badge finiscono solo in `SingleBadgeSheet` (`index.tsx:426`): l'evento e' codice morto |
| **`GamificationTransitionManager.tsx:115-121` usa `Alert` di sistema** | Medio | contraddice la regola G7 dichiarata in `GAMIFICATION_EXPERIENCE.md` ("popup personalizzati LOTO, mai notifiche di sistema") |

## 5. Cosa NON fare in questa area

- **Non ricalcolare un livello in un componente.** Importa `calculateLevel()` o
  `getLevelProgress()`. Se ti serve un dato che manca, aggiungilo in `levelUtils.ts`.
- **Non copiare `KEY_LEVELS` in un array locale.** Vedi `TraguardiModal.tsx:33` per l'esempio
  sbagliato da non ripetere.
- **Non fidarti di `archive_dead_code/` come fonte.** Ci sono documenti che lo fanno.
- **Non dare per implementato l'anti-flood.** L'aggregazione c'e', il cap no.

## 6. Codice gamification, con stato

| File | Ruolo | Stato |
|---|---|---|
| `utils/levelUtils.ts` | **SSOT soglie, calcolo, eventi** | vivo |
| `context/GamificationContext.tsx` | store reattivo, monta il manager | vivo |
| `components/GamificationTransitionManager.tsx` | coda carte, REVEAL, rito, condivisione | vivo, **manca il cap** |
| `components/ProfileModal.tsx` | Diario di Bordo, gate LV6 e LV20 | vivo |
| `components/TraguardiModal.tsx` | hub I TUOI TRAGUARDI (livelli/badge/rank) | vivo, **soglie duplicate** |
| `components/BadgeCollectionModal.tsx` | griglia distintivi e missioni | vivo, **UI duplicata** |
| `components/SingleBadgeSheet.tsx` | dettaglio badge con % di progresso | vivo |
| `components/FeatureLockSheet.tsx` | lock misterioso `??? (LV.N)` al posto di Alert | vivo |
| `components/FioreDeiTrePetali.tsx` | loop Zeigarnik, `getTodayChallenge()` | vivo |
| `components/FioreIconaRituale.tsx` | icona-rituale riusa la SSOT del fiore | vivo |
| `components/PoiTrophyPassport.tsx` | scheda trofeo, ViewShot, galleria | vivo |
| `components/PoiDetailSheet.tsx` | check-in e **unico producer** della catena level-up | vivo |
| `components/PoiScannerModal.tsx` | scanner NFC | vivo |
| `components/ScannedPoisSheet.tsx` | POI scansionati | vivo |
| `components/XpToast.tsx` | toast XP non bloccante | vivo |
| `components/MemoriesCameraModal.tsx` | camera Visioni Sospese, 6 filtri gated | vivo, **soglie duplicate** |
| `components/VaultModal.tsx` | vault / scoperte del Diario | vivo |
| `utils/LevelUpLore.ts` | lore 50 livelli, it/en | vivo |
| `utils/badgesCatalog.ts` | catalogo badge e metriche | vivo |
| `utils/badgeAssignment.ts` | assegnazione badge | vivo |
| `components/LevelUpModal.tsx` | **morto**: non importato, sostituito dal manager | archiviare |
| `utils/getAssetUrl.ts` | **morto**: mai importato | archiviare |
| `hooks/use-theme-color.ts`, `hooks/use-color-scheme.web.ts` | **morti**: residui del template expo-router | archiviare |

---

*Area A2 verificata il 26/09/2026. Confidenza Alta sulle soglie e sui gate, Media sui documenti
non ispezionati, esplicitata in §2.*
