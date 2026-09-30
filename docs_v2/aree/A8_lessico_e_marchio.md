---
id: A8
tipo: area
ambito: lessico-ufficiale-marchio-e-disambiguazione-termini
stato: Vivente
confidenza: Alta
owner: Agent
aggiornato: 2026-09-30
evidenza:
  - app.json:3
  - app.json:25
  - utils/levelUtils.ts:288
  - utils/LevelUpLore.ts:6
  - components/B2BFeedbackModal.tsx:28
  - components/CivicDashboard.tsx:35
  - app/_layout.tsx:232
  - locales/it.json:6
  - locales/en.json:6
---

# A8 - Il lessico: un nome, un significato

> Risponde a: "che cosa si chiama ogni cosa, e chi ha il diritto di cambiare un nome?"

Questa area è nata il 30/09/2026 perché la triangolazione dei documenti di luglio ha trovato che il
mescolamento dei concetti **non era distribuito a caso**: nove collisioni su ventiquattro concetti
verificati, e sette di queste erano la stessa parola con due significati. Un documento che
descrive il sistema non può risolvere una collisione di nomi, perché la riproduce. Serve un posto
dove la parola ha un solo significato, e quel posto è questo.

---

## 1. Cosa dice il codice

### 1.1 La disambiguazione di `tier` — decisione presa il 30/09

La parola `tier` indicava **tre oggetti diversi** nel progetto. È stato deciso di separarli, e la
separazione è conforme a come il codice è già scritto:

| termine | cosa indica | dove vive | quante unità |
|---|---|---|---|
| **`frame`** | layout grafico dell'avatar: bordo, aura, ombra | `utils/levelUtils.ts:242-310` (`getAvatarFrameStyle`) | 5 |
| **`lore_tier`** | livello narrativo: il racconto che accompagna il blocco | `utils/LevelUpLore.ts:6-7` | 5 |
| **`poi.tier`** | livello di validazione e di monetizzazione del singolo POI | non esiste ancora:decisione `D10` in `DECISIONI.md` | 4 (previsti) |

Il codice già li tiene separati **per funzione**: `getAvatarFrameStyle` non legge il lore, e
`LevelUpLore` non legge i frame. La collisione era solo nei documenti, dove tutte e tre si
chiamavano "tier".

**Il difetto che la separazione non risolve da sola, e che va scritto qui perché
`levelUtils.ts` è la SSOT e non può continuing a contraddirsi:**

```
utils/levelUtils.ts:10    //  11 Radici Sommerse            <- nome del blocco 11-20
utils/levelUtils.ts:288   //  Tier 2: Le Radici Antiche (Liv 11-20)   <- stesso blocco, altro nome
utils/LevelUpLore.ts:6    //  11-20 Le Radici Sommerse        <- il lore usa il primo nome
```

Lo stesso intervallo di livelli ha due nomi **nello stesso file**. `levelUtils.ts:10` e
`levelUtils.ts:288` si contraddicono a 278 righe di distanza, e nessun type check lo segnala
perché sono due stringhe in due commenti.

Gli altri quattro blocchi concordano: `Linfa Vitale` (`levelUtils.ts:276` e `LevelUpLore.ts:6`),
`Respiro Urbano`, `Fioritura del Loto`, `Risveglio del Seme`. **La divergenza è una sola, e
proprio sul blocco che ospita il rank `Esploratore`** (`levelUtils.ts:90-99`).

### 1.2 Il marchio è in due stati diversi nella stessa app

| dove | cosa dice |
|---|---|
| `app.json:3` | `"name": "LOTO MAP"` |
| `app.json:4` | `"slug": "loto-app-fresh"` |
| `app.json:22,35` | `com.lotohub.app` |
| `app.json:25,26,87,99,105,116` | **`"L.O.T.O. HUB"`** in tutte le stringhe di permesso |
| `app.json:27` | **`"L'O.T.O. HUB"`** — refuso, in `NSMotionUsageDescription` |
| `.agents/AGENTS.md:1` | `Loto Map` |
| `.agents/rules/master_business_brief.md:19` | `**Nome:** L.O.T.O. HUB` |

Le stringhe di `app.json:25-116` sono **le uniche che l'utente dell'app legge per intero**: sono i
dialoghi di permesso di iOS e Android. Il nome ufficiale non era mai arrivato lì.

### 1.3 Quattro parole per l'oggetto fisico sul territorio

Il tag NFC non ha un nome solo:

| nome | dove | stato |
|---|---|---|
| **Indizi** | `app/_layout.tsx:232`, `components/ScannedPoisSheet.tsx:76,130`, `locales/it.json:26` | **è il nome mostrato all'utente** |
| Nodi Segreti | `app/(tabs)/map.tsx:58`, `components/LotoPermissionModal.tsx:52`, `utils/onboardingContent.ts:11` | vivo, per un altro significato |
| Segno del Luogo | `docs/LOTO_HUB_MASTERPLAN_BETA.md:25` | solo archivio |
| Nodo Civico | `docs/LOTO_HUB_MASTERPLAN.md:39` | solo archivio, e indicava l'evento, non il tag |

**Nessun documento di `docs_v2/` contiene la parola "Indizi".** Il termine che l'utente vede
sull'iPhone quando lo invitano ad avvicinare il telefono non è mai stato documentato.

### 1.4 Quattro nomi per il feedback anonimo

| nome | cosa è | dove |
|---|---|---|
| `whispers` | la pillola narrativa che si sblocca salendo di livello | `components/GamificationTransitionManager.tsx:167,180,204` |
| `b2b_feedbacks` | il feedback anonimo del partner | `supabase/migrations/20260822_create_b2b_feedbacks.sql:5` |
| **Echoes** | il nome dottrinale del feedback, in `DOCTRINA-ECHO.md` | solo documentazione |
| **`partner_insights`** | **la tabella che il codice scrive davvero** | `components/B2BFeedbackModal.tsx:28` |

`b2b_feedbacks` è l'unica delle quattro che ha un `CREATE TABLE` in una migration tracciata.
`partner_insights` non ha **zero definizioni in tutto il repository** ed è il bersaglio della
scrittura. Nell'interfaccia il nome mostrato è un quinto: "Insight Riservato"
(`B2BFeedbackModal.tsx:52`) e "Insight statistico" (`:59`).

Quindi il feedback anonimo ha cinque nomi, e quello che il codice usa non esiste.

### 1.5 Quattro nomi per l'obiettivo civico, e nessuno vivo

| nome | dove |
|---|---|
| `civic_goals` | `components/CivicDashboard.tsx:35` — la tabella che il codice interroga, **0 definizioni** |
| `collective_goals` | `supabase/archive_scattered_sql/ORIGINAL_MASTER_RESTORE.sql:229`, `supabase/pure_cloud_queries/36_untitled_query.sql:1` |
| `goal_participations` | `supabase/migration_master_reset.sql:250` |
| `user_goal_contributions` | `docs/LOTO_HUB_MASTERPLAN.md:50`, come checkbox mai fatto |

E il componente che le interroga, `CivicDashboard.tsx`, **non ha un solo import in tutto il
repository**: è codice morto.

### 1.6 `PTI` ha tre espansioni e due etichette

| forma | dove |
|---|---|
| Loto Punti | `docs/LOTO_HUB_MASTERPLAN.md:39`, `docs_v2/loto-hub-architettura-sistema-master-2026.md:217` |
| Punti Transizione Intelligente | `.agents/skills/gamification_designer/SKILL.md:14`, `docs/LOTO_HUB_SSOT_DEFINITIVO.md:21` |
| Punti | `docs/analisi_modello_b.md:11` |
| etichetta `LOTO PTI` | `locales/it.json:6`, `app/(tabs)/profile.tsx:264` |
| etichetta `LOTO PTS` | `locales/en.json:6`, `app/(tabs)/index.tsx:80` |

La sigla è in inglese ambigua: PTS è "points", PTI non significa niente. Nessun file di codice
spiega cosa sia PTI: la sigla vive senza glossario.

### 1.7 Il rank e il ruolo hanno condiviso un nome

`Esploratore` era il nome del **ruolo** dell'utente anonimo. Il 15/09 è stato rinominato
`VIAGGIATORE` (`app/(tabs)/index.tsx:50,736`, `locales/it.json:3`) per non confondersi con il
rank. Oggi `Esploratore` è un **rank vivo** (`levelUtils.ts:90-99`, `levelUtils.ts:152`) e il
rank 1 si chiama `TURISTA OCCASIONALE` (`levelUtils.ts:80,149`).

Restano tre file che espongono all'utente il vecchio sistema a tre livelli in metallo, che
`utils/LevelUpLore.ts:4` vieta esplicitamente:

```
app/(tabs)/index.tsx:67-69   levelGold/levelSilver/levelBronze = 'EROE DEL MARE'/'CUSTODE DELLA CITTÀ'/'ECO-NAVIGATORE'
locales/it.json:20-22        le stesse tre chiavi, con i tre valori
app/upgrade.tsx:62           'ECO-NAVIGATORE'
```

`ECO-NAVIGATORE` non esiste in nessun rank. Le chiavi non sono mai lette nel JSX, quindi il danno
è latente: il giorno in cui qualcuno le legge, l'app mostra tre livelli inesistenti.

---

## 2. Cosa dice la documentazione

Nessun documento dichiara un lessico. È il vuoto che ha prodotto le nove collisioni: `R3` §2
impone quattro sezioni fisse a ogni area e una di esse è *"Cosa dice il codice"*, ma non prevede
*"Cosa si chiama"*. Il lessico non era un ambito che qualcuno avesse rivendicato, quindi nessuno
lo ha scritto.

La cosa più vicina a un glossario è `docs_v2/RICOSTRUZIONE.md` §3, che registra cinque
ribattezzamenti. Sono tutti confermati dal codice, tranne il primo che è applicato a metà.

---

## 3. Direzione

**Una parola, un significato, una casa.** Tre regole, in ordine di applicazione.

1. **Ogni termine nuovo entra qui prima che nel codice.** Se non è in §1 di questa area, non
   esiste: si può usare un nome provvisorio, ma va dichiarato qui con la data in cui smette di
   essere provvisorio.
2. **Un termine non si riusa.** Se serve un nome nuovo per un oggetto nuovo, non si prende quello
   che già esiste. È la ragione per cui "Indizi", "frame" e "lore_tier" erano disponibili e non
   sono stati usati.
3. **Un cambio di nome è una decisione in `DECISIONI.md`,** non una riga modificata in tre file.
   I sei `loto_fallback_*`, i cinque export e le 275 copie con suffisso falso sono la prova che
   una rinomina non propagata costa più di una decisione.

**Stato delle collisioni dopo questa area:** `tier` separato (decisione del 30/09, applicata alla
documentazione, da applicare al codice quando i campi verranno creati); marchio unificato a
**L.O.T.O. Map (Life On The Outside) Co-Experience**; `Indizi` registrato come nome ufficiale
dell'oggetto fisico; le altre cinque collisioni sono **aperte** e elencate in §4.

---

## 4. Buchi e rischi

| buco | gravità | effetto |
|---|---|---|
| **`levelUtils.ts:10` e `levelUtils.ts:288` si contraddicono** | alto | la SSOT dei livelli ha due nomi per il blocco 11-20. Diverge dal lore. Nessun controllo lo segnala |
| **`civic_goals` non esiste** | alto | `CivicDashboard.tsx:35` interroga una tabella assente; e il componente è comunque morto (0 import) |
| **`partner_insights` non esiste** | alto | il feedback anonimo B2B scrive su una tabella assente, mentre quella che esiste in migration non ha lettori |
| **`b2b_feedbacks` ha 0 lettori nel frontend** | alto | l'unico oggetto B2B versionato è il più vicino al ricavo ricorrente del merchant, ed è scollegato |
| **3 file espongono un sistema a 3 livelli vietato** | medio | `LevelUpLore.ts:4` vieta Bronzo/Argento/Oro; `index.tsx:67-69`, `locales/*.json:20-22`, `upgrade.tsx:62` li espongono. Danno latente, non attivo |
| **`PTI` senza glossario** | medio | sigla ambigua in inglese, tre espansioni in italiano, due etichette (`PTI`/`PTS`) |
| **Cinque nomi per il feedback anonimo** | medio | ogni lettore deve ricostruire quale dei cinque sia in gioco. È il difetto che `RICOSTRUZIONE` R1 aveva contato come due |
| **I 6 permessi dicevano il marchio vecchio** | chiuso 30/09 | corretto in `app.json`; l'etichetta Android segue al prossimo `expo prebuild` |
| **`.agents/rules/master_business_brief.md:19`** | chiuso 30/09 | il file è in `Storico` e il suo testo non si tocca (R4 §2): la correzione è una riga nel banner, non nel corpo |

---

*Area A8, 30/09/2026. Confidenza Alta: tutte le affermazioni sono state lette sul codice in questa
sessione. Il livello di verifica è L1 per i nomi in `.sql` e L0 per quelli che dipendono dal cloud,
che non è ispezionabile.*