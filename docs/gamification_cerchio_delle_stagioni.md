# 🪷 Il Cerchio delle Stagioni — Retention Engine L.O.T.O.
*Design di un ecosistema di gratificazione a 4 anelli temporali (giornaliero · collezione · settimanale · mensile).*
Data: 23/09 — Stato: **DISCUSSO** (analisi + design, da validare con l'utente PRIMA dell'ingegnerizzazione).

> **Regole rispettate (skill + linee guida segmento):**
> - XP = unica via a livelli, avatar e Whisper · PTI = bene comune, **mai** progressione.
> - Nomenclatura Badge Tematici (nessun metallo). Livelli 1-50, 5 Tier, niente Prestigio.
> - Zero-Coercition (G2): nessuna classifica, nessun PvP, nessun mayorship territoriale.
> - Popup personalizzati LOTO, mai notifiche di sistema (G7). Palette `useTheme()` (G6).

---

## 1. Il Quadro: temporal pacing a 4 anelli

Pokémon GO vive perché ha **4 anelli temporali sovrapposti**. LOTO oggi ha solo il primo. Gli anelli:

| Anello | Nome | Cadenza | Motivo psicologico | Stato |
|---|---|---|---|---|
| δ | **Premio del Giorno** | 24h | Zeigarnik + chiusura (ricompensa definita) | 🟡 da completare (il Fiore c'è, il premio no) |
| 1 | **Erbario Urbano** | giorni\mesi | Collection (possesso per categoria, "città = dex reale") | 🟡 nuovo |
| 2 | **Rugiada** | 7 giorni | Loss-Aversion (streak che appassisce) | 🟡 nuovo (F5 sbloccato senza economia PTI) |
| 3 | **Festa del Loto** | mensile | FOMO gentile + rituale collettivo oggettivo | 🟡 nuovo |

**Principio guida:** ogni anello fa leva su un ricordo emozionale diverso e **non dipende dagli altri** —
anche chi completa solo 1 petalo al giorno resta nel gioco (bassa soglia = vita costante, target più ampio di PoGO).

---

## 2. Anello δ — Premio del Giorno (completa il loop già costruito)

### Diagnosi
`FioreDeiTrePetali.tsx` ha 3 petali (🟢 2km/1kg CO₂ · 🟡 1 check-in · 🔵 sfida curata). Ma **completarli oggi non dà nulla di tangibile**: la frase "Il Loto fiorisce passo dopo passo" è l'unico feedback. Senza ricompensa finale il terzo petalo è psicologicamente depotenziato e il loop non si chiude.

### Design
- **Nuovo stato "Fiore in Piena Fioritura"**: quando i 3 petali sono completi, il Fiore cambia (glow `#D4AF37`, animazione petali — riuso del pattern icona-lotus `#3B5F31`/`#D4AF37` già in Home).
- **Bottone "Cogli il Fiore"** → apre il **Whisper del Giorno** (contenuto curato per tenant, no UGC: SSOT come `DAILY_CHALLENGES`).
- **Economia XP** (coerente con `gamification_hooks_analisi` §7.2):
  - Whisper del Giorno letto → **+30 XP** (stessa taglia di "sblocco storia/media +30").
  - **1 volta al giorno** (diff anti-farming di 100%: la ricompensa del giorno non è cumulabile).
- **Whisper del Giorno ≠ Whisper del POI**: il primo è un "pensiero della città" (nuovo contenuto quotidiano curato); il secondo resta legato al luogo.

### UX (flusso)
```
3 petali completati → Fiore glow + bottone "Cogli il Fiore"
   → modale Whisper del Giorno (palette LOTO, stile level-up)
   → +30 XP (con level-up/eventi via buildLevelUpEvents esistente)
   → domani il ciclo ricomincia (Zeigarnik: nuovo petalo 🔵 diverso)
```

### Vincoli
- 🚫 Niente premier giornaliero "spin" alla PoGO: ricompensa solo se l'utente ha **vissuto** la città (i 3 petali).
- 🚫 Il Whisper non dà PTI.

---

## 3. Anello 1 — L'Erbario Urbano (Collection / il Dex della città)

### Diagnosi
Il conteggio "Scoperte" oggi è un numero. Non c'è **possesso categorizzato** → niente motivo di tornare per *collezionare*.

### Design: possesso per categoria biologica urbana
Le categorie POI della città diventano "famiglie dell'Erbario". Solo quelle **oggettive dal DB** (`pois.category`/`layer_name`), mappate come:

| Famiglia Erbario | Categorie POI seed (Lecce) | Suggestions |
|---|---|---|
| 🏛 **I Sassi** (monumenti) | `monument` | completare tutte le chiese/piazze |
| 💧 **Le Fonti** | `fontane`-affini | 29 fontane → famiglia numerosa |
| 🌿 **I Giardini** | `park`/`garden` | respiro verde |
| 🏺 **I Musei** | `museum` | cultura lenta |
| 🔮 **I Segreti** | `secret` (raro) | "specie rara" — il gancio FOMO |

### Meccanica
- Ogni POI vissuto (`user_pois`) illumina la **sagoma** nella pagina famiglia; i non scoperti restano **sagome scure + nome velato** (riuso Fog of War, niente leak dei segreti).
- **Badge Tematici per famiglia** completata (nuovi, stile `badgesCatalog.ts`):
  - *Badge Custode delle Fonti* · *Badge Custode dei Sassi* · *Badge Custode dei Giardini* · *Badge Custode dei Musei*
  - **Badge Cacciatore di Segreti** (tutti i `secret` visitati) → +50 XP (taglia badge esistente).
  - Premio narrativo: completare una famiglia → **1 Whisper raro** dedicato (curato, +30 XP).
- **Dashboard Erbario** dentro il **Diario di Bordo** (hub `ProfileModal` tab diario già aperto dal lotus-glow): sezione "Erbario" con le sagome per famiglia e % completamento.

### Perché vince su PoGO e Foursquare
- PoGO: dex è fantasia. Qui il "dex" è **la tua città vera** → completare "Tutte le Fonti di Taranto" ha valore identitario.
- Foursquare: punti senza significato. Qui ogni famiglia esaurita lascia un **Badge Tematico** + una storia.
- Nessun leaderboard: il *suo* Erbario è completo, non "il più completo".

### Economia XP (riepilogo)
| Azione | XP |
|---|---|
| Badge famiglia completata | +50 |
| Whisper raro da famiglia completa | +30 |
| Badge Cacciatore di Segreti | +50 |
| (Scoperta singola) | già conteggiata dal check-in base_xp — **zero XP doppio** |

### Nota dati
- Zero nuove tabelle: dipende da `user_pois` + `pois` esistenti (anti-spoofing già registra `user_pois`).
- **Anti-ricompensa**: i segreti rari non devono essere ingegnerizzabili via `user_pois` manuale → già coperto da `scan_poi_gps` (cooldown 12h, anti-dirift, filtro cinematico G8).

---

## 4. Anello 2 — La Rugiada (Streak 7 giorni, senza economia PTI)

### Diagnosi (da NEXT_SESSION_HANDOFF)
F5 era **congelato perché i PTI "non sono spendibili"** e il design originale lo legava a freeze-a-pagamento (G12). Ma la streak **non necessita di PTI**: si può costruire sopra la giornata del Fiore (anello δ). Il solo pre-requisito aperto resta **misurare il ritmo XP reale** prima di calibrare le soglie (handoff task #4).

### Design
- **Sigillo Settimanale**: 7 giorni di fila con **≥1 petalo completato** (non tutti e 3 — soglia bassa per target ampio) → nuovo **Badge Rugiada** settimanale + **Whisper di fine settimana** (curato, +30 XP).
- **Loss-Aversion visiva**: se un giorno manca il petalo, il Fiore **"appassisce"** (petali grigi + testo "La Rugiada è svanita") — nessuna punizione XP, solo perdita percepita.
- **Reset a 0 al buco**; niente freeze (niente economia PTI: al contrario del design F5 originale, qui **non si paga per congelare**).
- **Contatore nel Diario di Bordo**: "Settimana a Loto spiegato · X/7".

### Economia XP
| Azione | XP |
|---|---|
| Badge Rugiada di settimana | +50 |
| Whisper di fine settimana | +30 |
| Totale massimo/settimana dalla Rugiada | +80 |

**Sostenibilità della curva:** +80 a settimana ≈ 2-3 check-in. Coerente con ritmo target (`LV5=300XP` ≈ 1-2h). *Da riverificare con misura runtime.*

---

## 5. Anello 3 — La Festa del Loto (rituale mensile, senza raid)

### Design
- **1 weekend/mese**: il Comune/Partner attiva un **Rito di Stagione** su POI dedicati (layer `secret` o `temporary-event`) — *zero nuovi tipi di contenuto*, riusando `tenant_events`/`pois` esistenti.
- **Due componenti, entrambe NON competitive:**
  1. **Rito individuale**: visitare il POI segreto del mese → Badge Stagionale (nome poetico per stagione, es. "Rito dell'Equinozio") + Whisper stagionale.
  2. **Sfida collettiva oggettiva**: soglia di check-in della città sul POI ("Il Loto è fiorito 500 volte questo weekend") — conta dal **ledger** (`impact_transactions`/`user_pois`, niente voti social G9). Superata → PTI alla **Barra Civica** (la città "guadagna" insieme, non il giocatore singolo).
- **Coerenza regole**: il Rito di Stagione completa la famiglia `secret` dell'Erbario → anello 1 e 3 **si alimentano a vicenda** senza duplicare XP.

### Economia XP / PTI
| Azione | XP / PTI |
|---|---|
| Visita POI del Rito (check-in) | base_xp POI (come sempre) |
| Badge Stagionale | +50 XP |
| Whisper stagionale | +30 XP |
| Sfida collettiva superata | → **PTI alla Barra Civica collettiva** (livello utente intatto, Regola d'Oro) |

### Vincoli
- 🚫 Niente timer di racing, niente premio "il primo che".
- 🚫 Nessun nuovo contenuto UGC: solo 1 Whisper + 1 badge curati al mese (costo produzione team bassissimo).

---

## 6. Economia XP integrata (riepilogo consolidato)

| Azione | XP | Anello |
|---|---|---|
| Check-in NFC/scan POI | `base_xp` (def 15; seed 30-50) | base |
| Sblocco storia/media POI | +30 | base |
| Eco-Passi | 100 m = 5 XP (e 1 PTI) | base |
| Itinerario pianificato | POI × 10 | base |
| Evento pubblico | +10 | base |
| **Whisper del Giorno (Fiore completo)** | **+30** (1×/giorno) | δ |
| **Badge Famiglia Erbario** | **+50** | 1 |
| **Whisper raro famiglia** | **+30** | 1 |
| **Badge Cacciatore di Segreti** | **+50** | 1 |
| **Badge Rugiada settimanale** | **+50** | 2 |
| **Whisper fine settimana** | **+30** | 2 |
| **Badge Stagionale (Festa)** | **+50** | 3 |
| **Whisper stagionale** | **+30** | 3 |

> **Misura obbligatoria (pre-req F5/#4 handoff):** registrare a runtime per 1-2 settimane l'XP reale per azione
> (check-in effettivi, base_xp di produzione, giorni in cui l'utente completa il Fiore) → calibrare le soglie
> sopra della curva SSOT. **Nessuna delle XP sopra va committata come definitiva prima della misura.**

---

## 7. Conformità con le linee guida esistenti (verifica)

| G | Vincolo | Conforme? |
|---|---|---|
| G1 | SSOT progresso (XP→livello→rank) | ✅ XP integrate nel flusso `buildLevelUpEvents` esistente |
| G2 | Zero-Coercition (no classifica/PvP/leaderboard) | ✅ nessuna componente comparativa pubblica |
| G3 | PTI non separabili / non per livelli | ✅ i PTI vanno solo alla Barra Civica (Festa del Loto) |
| G5 | Economia XP per azione documentata | ✅ sezione 6 (SSOT, in attesa di misura) |
| G7 | Popup personalizzati, mai notifiche sistema | ✅ tutte le modali LOTO, pattern esistenti |
| G8 | Anti-farming/anti-spoofing | ✅ nessuna ricompensa diretta legata a `user_pois` manuale; check-in sempre via RPC |
| G9 | Whisper curati, no UGC | ✅ contenuti nuovi tutti curati/SSOT |
| G12 | Economia di burn PTI congelata | ✅ Rugiada NON tocca PTI (ridefinita rispetto a F5 storico) |
| G13 | Retention quotidiana Zeigarnik | ✅ anello δ la rafforza (premio definito) |
| G14 | Loss-Aversion Streak | ✅ anello 2 la realizza senza PTI |
| G15 | Curiosità spaziale Fog of War | ✅ Erbario la estende alle sagome |

---

## 9. Hub del Diario di Bordo — architettura unica dei 4 anelli

> **Vincolo utente (23/09):** *tutte* le esperienze di gamification vanno **contenute nella sezione Diario utente**
> (`ProfileModal` → tab `diario`), con attenzione al design dell'intero contenuto per ottimizzare e dare
> **coerenza al sistema**. Nessun anello apre una schermata parallela: il Diario è l'unico luogo.

### 9.1 Layout wireframe (top → bottom)

```
┌──────────────────────────────────────────────┐
│  🔝 [FIORE DI OGGI]                 (anello δ)│  ← ritual quotidiano (già presente)
│      + stato "Fioritura" + Cogli il Fiore     │
│  ───────────────────────────────────────────  │
│  🌧 [Rugiada · X/7 · gocce]           (anello 2)│  ← strip sotto il Fiore (loss-aversion
│                                                    accanto al loop che la genera)
│  ═══ IL TUO PERCORSO CITTADINO ═════════════  │  ← eyebrow micro-sezione (esistente)
│  🌿 [Erbario]  % per famiglia        (anello 1)│  ← NUOVA zoneCard (apre sub-schermata)
│  📷 [Memorie]                      (LV6)     │  ← esistente
│  🔁 [Nebbia della Memoria · toggle]           │  ← esistente (opzione mappa, in coda
│                                                 alle zone, non più in mezzo)
│  ═══ IL RITO DEL MESE ═════════════════════  │  ← NUOVO eyebrow micro-sezione
│  🪷 [Festa del Loto]                 (anello 3)│  ← NUOVA card evento (bannera stagionale)
│  ───────────────────────────────────────────  │
│  👥 [Co-Experience]                  (LV20)   │  ← esistente, chiude il Diario
└──────────────────────────────────────────────┘
```

### 9.2 Micro-sezioni temporali (coerenza narrativa)

Il Diario si legge **per cadenza temporale**, non per feature:

| Micro-sezione (eyebrow) | Contenuto | Anello |
|---|---|---|
| *(nessuno — rituale aperto)* | Fiore di Oggi + strip Rugiada | δ + 2 |
| **IL TUO PERCORSO CITTADINO** | Erbario · Memorie · Nebbia | 1 (+esistenti) |
| **IL RITO DEL MESE** | Festa del Loto | 3 |
| *(nessuno — chiusura)* | Co-Experience | esistente LV20 |

> La Rugiada **non** ha eyebrow: è figlia visiva del Fiore (stessa cadenza giornaliero→settimanale),
> resta incollata al suo piede per non frammentare il rituale.
>
> **Scoperte/Vault rimosso dal Diario** (decisione utente 23/09): l'ingresso al Vault multimediale vive
> **solo in Home** (`index.tsx:767-769`) — zero doppioni, zero ridondanza.

### 9.3 Sistema di card (anatomia condivisa — coerenza forzata)

Tutte le zone card del Diario condividono **la stessa anatomia** (pattern già esistente in `zoneCard`):

```
┌─ zoneCard ────────────────────────────────┐
│ [zoneIcon 48×48]  Titolo                  │
│  colore fisso      Descrizione 1 riga     │
│                    (accessorio a destra)  │
└───────────────────────────────────────────┘
```

**Tre tipi di accessorio a destra, zero varianti:**

| Tipo | Accessorio | Usato da |
|---|---|---|
| `chevron` | `>` (apre sub-schermata) | Erbario |
| `tag` | `ATTIVA` / `??? (LV.X)` | Memorie, Co-Experience |
| `progress` | `x/7`, `%`, `3/5` | Rugiada (strip), Erbario (in-card se compatto) |

**Palette zone (fissa, `useTheme()` per surface/border, colore icona hardcoded coerente allo stile attuale):**

| Zona | Colore icona | Fonte |
|---|---|---|
| Fiore (card propria) | `#4CAF50` / `#D4AF37` / `#2A9D8F` (3 petali) | `FioreDeiTrePetali.tsx` |
| Rugiada (strip) | `#2A9D8F` (acqua, stessa famiglia petalo 🔵) | nuovo |
| Erbario | `#3B5F31` (verde foglia) | nuovo |
| Memorie | `#DFAB55` / locked `#6B6B6B` | esistente |
| Festa del Loto | `#D4AF37` (oro rituale, unica card evento) | nuovo |
| Co-Experience | `#1A3621` / locked `#6B6B6B` | esistente |

### 9.4 Regole di ottimizzazione del contenuto

1. **Massimo 1 sub-schermata per anello**: l'Erbario si apre **dentro** il Diario (stessa `Modal`/push
   con back che torna al tab `diario`), non crea un nuovo tab. La Festa del Loto apre un `FeatureSheet`
   stagionale (pattern `FeatureLockSheet` già esistente).
2. **Progressività ≠ gating dei POI**: le zone non spariscono per livello — solo i **tag `??? (LV.X)`**
   (G18 già deciso). Nuove card Erbario e Festa: **visibili sempre**, contentuto sbloccato per contesto.
3. **Niente ridondanza**: il Vault multimediale ("Scoperte") vive **solo in Home** — rimosso dal Diario
   (decisione utente). Il Diario non duplica ingressi già presenti altrove.
4. **Nebbia della Memoria in coda**: è un'impostazione mappa, non un'esperienza — si sposta **dopo**
   le zone esperienziali per non spezzare il flusso "vivere → collezionare → rito → insieme".
5. **Un solo rumore visivo**: solo il Fiore ha animazione/glow. Le altre card restano statiche
   (zero animazioni concorrenti → il Diario non diventa un casinò).
6. **Copy**: ogni card desc = 1 riga, tono poetico/ecologico (Eco-Boutique). Eyebrow = micro-sezione
   mai ripetuto due volte. Niente emoji nel copy runtime (solo nei commenti/doc).

### 9.5 Dipendenze di implementazione (aggiornamento fase B)

- `components/ProfileModal.tsx` → ristrutturazione tab `diario` in micro-sezioni (9.2) + nuove card
  Erbario/Festa + rimozione card Scoperte + spostamento toggle Nebbia.
- Nuovi componenti **interni** al Diario: `ErbarioCard.tsx`, `RugiadaStrip.tsx`, `FestaDelLotoCard.tsx`
  (tutti consumano dati da `useGamification()` + `user_pois`, nessun fetch duplicato).
- Sub-schermata Erbario: `ErbarioSheet.tsx` (modal LOTO, palette `useTheme()`, back → Diario).
- Test di coerenza: checklist visiva — stessa altezza card, stesso padding, stessa tipografia
  (`zoneTitle`/`zoneDesc` esistenti), nessun font nuovo.

---

## 8. Piano di implementazione suggerito (per validazione)

| Fase | Contenuto | Dipendenze | Costo |
|---|---|---|---|
| **A** | Anello δ: stato "Fiore in Piena Fioritura" + Whisper del Giorno + bottone "Cogli il Fiore" + +30 XP | `FioreDeiTrePetali.tsx`, tabella `whispers`/SSOT daily | Basso |
| **B0** | **Hub Diario** (sezione 9): micro-sezioni + spostamento Nebbia + `RugiadaStrip` placeholder | `ProfileModal.tsx` | Basso |
| **B** | Anello 1: `ErbarioCard` + `ErbarioSheet` nel Diario (sagome per famiglia, %) + badge Custode/Cacciatore | `user_pois`+`pois`, `badgesCatalog.ts`, fase B0 | Medio |
| **C** | Anello 2: conteggio streak "≥1 petalo/giorno" + appassimento visivo + Badge/Whisper settimanale | Anello A, fase B0, `AsyncStorage` per streak | Basso |
| **D** | Anello 3: `FestaDelLotoCard` + Rito mensile + soglia collettiva + Badge stagionale | Anello 1, fase B0, `tenant_events`, verifica `sblocca_media` (migration_v20) | Medio |
| **P0** | **Misura ritmo XP runtime** (log 1-2 settimane) — *gate per calibrare B/C/D* | nessuna | Basso |

### Pre-requisiti trasversali da chiudere in parallelo
1. Migration `migration_v21_fix_scan_co2.sql` **applicata sul cloud** (base per XP/co2 reali). 
2. Studiare il ritmo XP per capire dove inserire le nuove XP **senza inflazionare la curva**.
3. Decisione utente su ogni Badge/Whisper nuovo (contenuti curati, no UGC).

---

*Documento di design. Nessuna modifica al codice. Da validare: (a) soglie XP, (b) nomi famiglia/Erbario,
(c) estensione a più tenant, (d) costo contenuti curati mensili.*