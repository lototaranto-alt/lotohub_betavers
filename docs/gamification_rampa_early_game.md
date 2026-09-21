<!-- Stato: Bozza -->
<!-- Scopo: Definisce la rampa dei primi 10 livelli (progressive disclosure): quanti POI visibili, quali sezioni si sbloccano, quanta XP assegnare, come incatenare le modali, e il gancio della futura feature di gruppo per bonus XP. -->
<!-- SSOT: utils/levelUtils.ts (soglie), docs/gamification_hooks_analisi.md §7.2 (economia XP), docs/gamification_struttura_narrativa.md (tier) -->
<!-- Owner: gamification -->
<!-- Ultimo aggiornamento: 2026-09-21 -->

# Rampa Early-Game — Primi 10 Livelli (Il Risveglio del Seme)

> Questo documento risponde a: *"come si deve sentire l'esperienza nei primi 10 livelli, quanti POI mostro alla volta e quando sblocco le sezioni, senza sovraccaricare la cognizione dell'utente?"*

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

`KEY_LEVELS` dentro questo arco: **1 → 2 → 5** (gli altri scattano a 11/20/21/30/31/41).

### 1.2 Economia XP per azione (`gamification_hooks_analisi.md` §7.2)
| Azione | XP |
|---|---|
| Check-in POI | `base_xp` (default 15, seed prod 30–50) |
| Sblocco storia/media | +30 |
| Eco-Passi | 100 m = +5 |
| Itinerario pianificato | POI × 10 |
| Evento | +10 |
| Badge (es. Sentinella) | +50 |

**Stima tempo reale (a ~40 XP/check-in + 1 media):**
- LV2 (30 XP) = **1 check-in**
- LV3 (90 XP) = 2–3 check-in
- LV4 (180 XP) = 4–5 check-in
- LV5 (300 XP) = **7–8 check-in ≈ 1–2 ore** (allineato alla soglia di apprendimento già certificata)
- LV10 (1350 XP) = ~30–34 check-in
- LV11 (1650 XP) = ~40 check-in → Rank ESPLORATORE

### 1.3 Stato reale della Mappa oggi (`app/(tabs)/map.tsx`)
- POI caricati: **tutti** da `vw_pois_frontend` (esclusi `nodo_civico` e `concierge`). **Manca qualsiasi gate di livello.**
- Layer di default: **`'monument'`** (`map.tsx:70`) → al primo avvio l'utente vede solo **Monumenti + Fontane** (le fontane sono "sempre visibili", `map.tsx:183`).
- Popolamento reale seed (`supabase/seed_alpha_pois.sql`): **monument 27 · museum 13 · park 127 · attraction 10 · fountain 2** = 179 POI.
- Filtro client per categoria (dropdown) → l'utente può passare a "Tutti" ma deve saperlo fare.

> **Esito:** oggi la mappa "tiene già basso il carico cognitivo" all'avvio (solo monumenti+fontane), ma **non in modo progressivo**: tutte le 5 categorie sono disponibili nel dropdown fin dal giorno 1. Il carico cresce per *scelta manuale* dell'utente, non per *progressione*.

### 1.4 Gate sezioni attuali (`utils/levelUtils.ts`)
| Sezione | Livello | Note |
|---|---|---|
| Eventi Pubblici | **LV2** (`EVENTS_UNLOCK_LEVEL`) | badge "LV.2" non bloccante (`index.tsx`) |
| Community | **LV5** (`COMMUNITY_UNLOCK_LEVEL`) | tab bloccato con `FeatureLockSheet` "??? (LV.5)" |
| Co-Experience (squad) | **LV20** (`CO_EXPERIENCE_UNLOCK_LEVEL`) | `FeatureLockSheet` "??? (LV.20)" |

### 1.5 Catena modali oggi (`utils/levelUtils.ts` + `components/GamificationTransitionManager.tsx`)
- `buildLevelUpEvents()` accoda **1 carta LEVEL_UP + 1 carta WHISPER per OGNI livello superato**, incluso il jump multiplo (se sali da LV1 a LV3 in un colpo → 2 level-up + 2 whisper = 4 modali).
- Esiste già la coda serializzata (`queueEvents`) e i tre tipi carta: **LEVEL_UP / WHISPER / BADGE**.
- Le sezioni sbloccate si pres entano oggi come `FeatureLockSheet` **in negativo** ("si svelerà al LV."), non come apertura festosa.

---

## 2. Principio guida (anti-sovraccarico cognitivo)

> **Una novità per volta, e solo quando l'utente è pronto.**
> Ogni livello del primo decennio deve offrire **ESATTAMENTE UNA novità percepibile**: un nuovo pezzo di mappa, una nuova sezione, o un nuovo strumento. Mai due strappi cognitivi nella stessa soglia.

Regole derivate:
1. **POI: mai più di una categoria nuova per livello-soglia.** La mappa parte da Monumenti+Fontane (≈29 POI) e cresce a "gocce" (una categoria per soglia chiave), replicando il "carico graduale" di un ristorante che srotola il menù.
2. **Sezioni: si sbloccano solo su `KEY_LEVELS`** (già 2 e 5 in questo arco). Niente sezioni nuove su livelli "di riempimento".
3. **Modali: massimo 3 carte in catena per guadagno.** Più livelli in un colpo → 1 carta LEVEL_UP aggregata + solo i WHISPER dei KEY_LEVELS attraversati.
4. **Calma narrativa:** un Whisper a ogni livello singolo nell'arco 1-10, ma quando il livello non è chiave il tono è breve (una riga), non una modale a pieno schermo.

---

## 3. La rampa proposta (LV1-10)

| LV | XP cumul. | Cosa si sblocca (POI/Sezioni/Strumenti) | Carta finale della catena modale | Coerenza lore (`LevelUpLore.ts`) |
|---|---|---|---|---|
| **1** | 0 | **Il Seme.** Mappa base: SOLO Monumenti + Fontane (≈29 POI). Onboarding + prima scansione guidata. | Onboarding → LevelUp 1 (senza whisper esteso) | "il seme che sto per affidare alla terra" |
| **2** | 30 | **Eventi Pubblici** visibili sull'home (badge già presente) + filtro **Attraction** nella mappa (10 POI) | LevelUp 2 → Whisper "La voce" → **reveal "La Città parla ora"** (Eventi) | "Eventi e Comunità ora ti appartengono" ✔ |
| 3 | 90 | **Strumento Percorsi** (creazione itinerario) — il dropdown resta invariato | LevelUp 3 + Whisper breve | "Hai sbloccato la creazione di percorsi" ✔ |
| 4 | 180 | **Refill Fontane** preso di pari passo (la fontana era già visibile); nessuna nuova categoria | LevelUp 4 + Whisper breve | "cerca la tua prima fontanella" ✔ |
| **5** | 300 | **Community** (tab sbloccato) + **filtro Museum** sulla mappa (13 POI) + prima **metrica CO₂** visibile nel Profilo | LevelUp 5 → Whisper → **reveal "La Porta della Città"** (Community) | "Hai registrato la prima metrica di CO₂" ✔ |
| 6 | 450 | Nessuna novità cognitiva: la Mappa può segnalare "lucchetti" (media vault) su luoghi storici | LevelUp 6 + Whisper breve | "i lucchetti non sono limiti, ma promesse" ✔ |
| 7 | 630 | Nessuna nuova sezione: cenni di "rete" (identità) | LevelUp 7 + Whisper breve | "identità si sta tessendo" ✔ |
| 8 | 840 | Nessuna nuova sezione: passaggio da visitatore a custode | LevelUp 8 + Whisper breve | "da semplice visitatore a custode" ✔ |
| 9 | 1080 | Nessuna nuova sezione: pre-annuncio del primo grande traguardo | LevelUp 9 + Whisper breve | "preparati a distinguerti tra i fondatori" ✔ |
| **10** | 1350 | **Capstone del Tier:** filtro **Park** (127 POI = il grosso del verde) + modale-rito di passaggio al Tier 2 | LevelUp 10 → **Rito: "Il Risveglio del Seme è compiuto"** → teaser **ESPLORATORE (LV11)** | "il mare ti chiama: le Radici Sommerse aspettano" ✔ |
| **11** | 1650 | Rank **ESPLORATORE** + dropdown "Tutti" pieno (verde ora accessibile pienamente) | LevelUp Rank (carta speciale già esistente) | "Le Radici Sommerse ti accolgono" ✔ |

**Logica delle categorie e perché in quest'ordine:**
- **LV1 Monuments+Fontane** = minimo indispensabile (monumenti: il biglietto da visita della città; fontane: rilevanza Zero-PII e Refill).
- **LV2 Attraction** = dinamici, pochi, associati agli Eventi che si sbloccano insieme (coerenza narrativa).
- **LV5 Museum** = cultura profonda, giusto quando l'utente dimostra costanza (300 XP ≈ 1-2h).
- **LV10 Park** = il set più numeroso (127): va dato in coda al Tier, quando l'utente ha già imparato a leggere la mappa. Evita il sovraccarico dei primi minuti e premia la permanenza.

> ⚠️ **Da validare con l'utente:** allineare l'ordine alle priorità B2B/marketing (es. se i Musei chiedono visibilità subito, Museum può sposarsi con LV2 e Attraction con LV5).

---

## 4. Come implementare la visibilità POI (minimo codice, Zero-Code layer)

Proposta **client-only** (nessuna migrazione DB): i POI restano tutti nel DB/SSOT; il *filtro di livello* vive nella mappa con **una costante SSOT** in `utils/levelUtils.ts`:

```ts
export const POI_CATEGORY_UNLOCK_LEVEL: Record<string, number> = {
  monument: 1,   // + fontane sempre visibili (regola esistente)
  attraction: 2, // EVENTS_UNLOCK_LEVEL
  museum: 5,     // COMMUNITY_UNLOCK_LEVEL
  park: 10,      // capstone Tier 1
};
```

- Il dropdown mostra le categorie bloccate come **"??? (LV.n)"** (stesso pattern `FeatureLockSheet`), rispetto al quale il client applica il filtro combinato: `categoryLock.level <= userLevel` OR `category === 'fountain'`.
- Default layer resta `'monument'`; al superamento di una soglia si può accendere un **badge "Nuovo strato"** sul dropdown, non un pop-up.
- Nessuna modifica a `vw_pois_frontend` né al calcolo XP: la SSOT di visibilità è **frontend** (il DB vende poi i dati pieni ai client B2B).

---

## 5. XP assegnate per sblocco (riepilogo quantitativo)

| Sblocco | Soglia XP | Costo in azioni reali (stima prod) |
|---|---|---|
| Eventi | 30 | 1 check-in |
| Percorsi (strumento) | 90 | 2–3 check-in |
| Refill/fontane (facilitazione) | 180 | 4–5 check-in |
| **Community** | 300 | 7–8 check-in (**≈1-2h**) |
| Metrica CO₂ nel Profilo | 300 | idem |
| Lucchetti vault/Memorie | 450 | ~11 check-in |
| **Capstone Tier (Rito)** | 1350 | ~30 check-in |
| **Rank ESPLORATORE** | 1650 | ~40 check-in |

> I valori NON richiedono nuove XP: riusano le soglie `LEVEL_THRESHOLDS` già certificate. La "XP per sblocco" è quindi la **soglia stessa** `minXp` del livello-soglia, mai un numero a parte (zero numeri magici).

---

## 6. Catena delle modali (regole anti-flood)

Le regole si applicano a `buildLevelUpEvents`/`GamificationTransitionManager` per gli eventi in arrivo dentro l'arco 1-10 (e come principio per tutti gli archi):

1. **Aggregazione jump:** guadagno multi-livello (es. +2) → **1 sola carta LEVEL_UP** al livello finale; i Whisper intermedi compaiono SOLO se attraversano un `KEY_LEVEL`.
2. **Ordine della catena:** `LEVEL_UP → WHISPER → (se sblocco sezione) REVEAL → (se badge) BADGE`. Massimo **3 carte**.
3. **REVEAL ≠ LOCK:** quando una sezione si sblocca (LV2/LV5) la transizione è **festosa e in positivo** (nuovo modello di carta, sempre palette LOTO) — il `FeatureLockSheet` resta solo per lo stato "ancora bloccato/in futuro".
4. **Brevità sui livelli non-chiave** (3,4,6,7,8,9): whisper "pillola" di una riga in locale, niente modale full-screen.
5. **Mai `Alert` di sistema** (G7): solo modali LOTO.
6. **Rito di capstone LV10**: carta celebrativa dedicata (stile LevelUp ma con asset Tier + testo di transizione), non la generica di rank.

---

## 7. Feature futura: gruppo / squadra bonus XP (design gancio)

Contesto: `loto_squads` appare nell'introspection (`supabase/schema/introspection.sql:102`); Co-Experience ha già il gate **LV20**.

**Proposta di design (da aprire quando si costruisce Co-Experience):**
- **Bonus squadra** = quando 2+ membri di una squad registrano un check-in allo **stesso POI entro una finestra temporale** (es. 30 min), viene accreditato un **bonus XP extra** raccolto a livello di squadra (es. +10 XP/membro-sincronizzato, cap giornaliero es. 5 volte) → "l'eco di squadra". Aggregato/server-side (Zero-Code layer), mai calcolato nel client.
- **Zero-PII:** il join alla squadra avviene **via QR LOTO Pass locale**, mai email/username.
- **Coerenza narrativa:** il bonus non è "premio di competitività" (niente PvP, G2) ma **coordinazione civica** — i PTI restano non-spendibili e personali; l'XP di squadra alimenta solo la progressione narrativa.
- **SSOT:** nuovi parametri in `levelUtils`/schema dedicato quando la feature entra in ingegnerizzazione (deciso con l'utente, B.3 "Non ancora avviato").

---

## 8. Questioni aperte (da validare con l'utente)

1. **Ordine categorie** (Monuments→Attractions→Museums→Parks) ok? O precede il verde/Musei per necessità B2B?
2. **Capstone LV10 = apertura di Parks (127 POI)** o preferisci tenerlo per il LV11/rank? (Apertura a LV10 "chiude" il Tier con il grande respiro; LV11 lo rende ancora più simbolico.)
3. **Rito LV10**: vuoi una modale speciale dedicata ("Il Risveglio del Seme") o basta il LevelUp standard di rank?
4. **Badge "Nuovo strato"** sul dropdown a ogni sblocco categoria: ok come spunto non invasivo?
5. Sezione **Percorsi**: confermi che è voluto sbloccarla a LV3 (come già recita la lore di livello 3)?

## 9. Schema di riferimento (file coinvolti in caso di implementazione)
- `utils/levelUtils.ts` → aggiungere `POI_CATEGORY_UNLOCK_LEVEL` + aggregazione in `buildLevelUpEvents`.
- `app/(tabs)/map.tsx` → filtro combinato `filteredPois` + label "???" nel dropdown.
- `components/GamificationTransitionManager.tsx` → carta REVEAL + rito LV10 + regole anti-flood.
- `components/FeatureLockSheet.tsx` → resta per stati bloccati.
- Docs SSOT: `LEVEL_THRESHOLDS` (non modificare).