---
id: A9
tipo: area
ambito: forma-dell-app-tab-bar-e-ordine-di-rivelazione
stato: Vivente
confidenza: Alta
owner: Agent
aggiornato: 2026-09-30
evidenza:
  - app/(tabs)/_layout.tsx:106
  - app/(tabs)/_layout.tsx:163
  - app/(tabs)/scan.tsx:5
  - utils/levelUtils.ts:38-62
  - components/GamificationTransitionManager.tsx:44
  - components/GamificationTransitionManager.tsx:81
  - components/FioreDeiTrePetali.tsx:94
  - components/ProfileModal.tsx:236
  - app/(tabs)/index.tsx:670
  - app/(tabs)/index.tsx:723
---

# A9 - La forma dell'esperienza: cosa si vede, in che ordine, e quando

> Risponde a: "quando un utente apre l'app per la prima volta, che cosa trova, e in che ordine
> glielo si fa scoprire?"

**Confine con le altre aree, dichiarato per non creare doppi proprietari.** `A2` possiede la
*meccanica*: quale livello sblocca cosa, e con quali soglie. Questa area possiede la *forma*: dove
la cosa sbloccata compare, in quale ordine, e con quale ritmo. `A7` possiede la validazione del POI
e il percorso. Un concetto che sta in due aree è un conflitto di `ambito:`, e il validatore lo
segnala.

---

## 1. Cosa dice il codice

### 1.1 La tab bar: cinque sezioni, tutte visibili, una sola interdetta

`app/(tabs)/` contiene cinque schermate più il layout. Tutte e cinque sono dichiarate
`<Tabs.Screen>` in ogni stato del livello.

| tab | dichiarata | interdetta | politica di visibilità |
|---|---|---|---|
| `index` (Home) | `_layout.tsx:106` | no | nessuna |
| `map` | `_layout.tsx:115` | no | nessuna |
| `scan` | `_layout.tsx:124` | n/a | `tabBarLabel: () => null`, **pulsante centrale flottante** |
| `community` | `_layout.tsx:161` | **sì** | `tabPress` con `preventDefault()` se `userLevel < COMMUNITY_UNLOCK_LEVEL` (`:165-166`) |
| `profile` | `_layout.tsx:214` | no | nessuna |

**Verificato e contrario a quanto scritto in `A7:108-109`:**

- **Non ci sono 7 route tab.** Sono **5**. `events.tsx` ed `explore.tsx` non esistono come tab.
- **Esiste una politica, ma è un'interdizione, non una rivelazione.** La tab Community è
  dichiarata, disegnata con icona `lock`, etichettata `??? (LV.8)` (`:181`) e al tocco apre
  `FeatureLockSheet` (`:243-248`). Non è nascosta: è **segnalata**.
- **Non esiste nessun `href: null`** in tutto il layout, e nessun conditional rendering su
  `Tabs.Screen`. Le cinque sezioni sono consegnate tutte al primo livello.

La differenza conta. `A7` §5 chiedeva una tab bar a **2 + 1 condizionata**, perché a LV1
l'utente non ha ancora nulla da vedere. Oggi ne vede cinque, e una gli dice che non può toccarla.
Non è rivelazione progressiva: è un'etichetta di locked su una delle cinque.

### 1.2 La scala di sblocco esiste, ma non governa la tab bar

`utils/levelUtils.ts:17-21` fissa sei soglie, e tutte e sei sono implementate:

| livello | sezione | dove il gate agisce |
|---|---|---|
| LV2 | Eventi | `app/(tabs)/map.tsx:373` (pillola filtro), `app/(tabs)/index.tsx:919,927-931` (sezione con overlay) |
| LV4 | Itinerari | `app/(tabs)/map.tsx:430` (FAB) |
| LV6 | Visioni Sospese | `components/ProfileModal.tsx:274-287` |
| LV8 | Community | `app/(tabs)/_layout.tsx:165-166,247` |
| LV10 | Rito | `utils/levelUtils.ts:33,64-67,355-358` — **non è una sezione**, è una carta celebrativa |
| LV20 | Co-Experience | `components/ProfileModal.tsx:289-305` |

**Il canale e la tab bar sono separati.** `app/(tabs)/_layout.tsx:7` importa **una sola** delle sei
soglie, `COMMUNITY_UNLOCK_LEVEL`. Le altre cinque vivono solo come gate interni a una schermata. È
una scelta che regge, ma va dichiarata: **la progressiva disclosure del progetto è sui contenuti,
non sulla navigazione**, e su questo A7 §5 (`S5`) non era d'accordo.

### 1.3 Il ritmo della rivelazione esiste ed è la cosa meglio costruita dell'area

La rivelazione non è nella tab bar: è **nella coda di carte**.

`components/GamificationTransitionManager.tsx:18-23` dichiara cinque tipi di evento:

| tipo | quando | cosa fa per l'utente |
|---|---|---|
| `LEVEL_UP` | una volta per salto | il rango nuovo |
| `WHISPER` | solo sui `KEY_LEVELS` attraversati | la pillola narrativa dalla tabella `whispers` |
| `REVEAL` | solo per soglie di sezione attraversate | **un pulsante che porta alla sezione appena aperta** |
| `RITO` | attraversando LV10 | la carta di capstone |
| `BADGE` | **mai prodotto** | codice morto (`:23,291`) |

Il `REVEAL` è il meccanismo di progressiva disclosure vero, ed è una cosa che nessun documento
descriva: `utils/levelUtils.ts:38-62` (`UNLOCK_REVEALS`) tiene quattro voci, ognuna con un
`target` di rotta, e `GamificationTransitionManager.tsx:81-95,207` lo usa per la navigazione.

**Anti-flood: l'aggregazione c'è, il cap no.**

```
utils/levelUtils.ts:315-360           una sola carta LEVEL_UP per salto; whisper solo sui KEY_LEVELS attraversati
components/GamificationTransitionManager.tsx:44   setQueue(prev => [...prev, ...events])   <- nessun clamp
```

Il caso peggiore, LV1 → LV50, produce **1 + 9 + 4 + 1 = 15 carte in fila**, ognuna con
animazione e un pulsante "Avanti" (`:66-78`). `KEY_LEVELS` ha 9 elementi
(`levelUtils.ts:13`: 1, 2, 5, 11, 20, 21, 30, 31, 41). Il limite esiste solo per costruzione del
produttore, non per codice nella coda.

### 1.4 Il rito quotidiano non scrive niente

`FORMA-DEFINITIVA.md:258` chiama il rito *"il motore di ritenzione, l'unico motivo per cui un
utente torna"*. Nel codice:

```
components/FioreDeiTrePetali.tsx:8-11      WALK_TARGET_M=2000, WALK_ALT_CO2=1, CHECKIN_TARGET=1
components/FioreDeiTrePetali.tsx:21-27     5 DAILY_CHALLENGES a rotazione giornaliera
components/FioreDeiTrePetali.tsx:94-162    il rendering
components/ProfileModal.tsx:236-243        UNICO punto in cui è montato
app/(tabs)/index.tsx:670-683               sulla Home c'è solo l'icona, che apre il Diario
```

**Il Fiore non ha nessun writer.** Nessun claim, nessun `+XP`, nessuna persistenza dello stato del
giorno. È un indicatore di sola lettura, non un rito: se l'utente torna domani, la sfida è di
nuovo quella di oggi e non c'è memoria di averla fatta. Le sue quattro soglie sono cablate a mano
(`:9,11,22-26`) e non dialogano con quelle del server.

Questo è il buco più grave dell'area, perché il rito è l'unico meccanismo di ritenzione che non
richiede dati, partner né canale.

### 1.5 Cinque schermate che i documenti non elencano

| schermata | dove | cosa fa |
|---|---|---|
| **Scheda Trofeo** | `components/PoiTrophyPassport.tsx`, montata a `index.tsx:632-635` | compare 400 ms dopo il check-in, screenshot e salvataggio in galleria |
| **Feed community** | `components/LiveFeedBanner.tsx:4,51` + `CommunityFeedSheet.tsx`, `index.tsx:181-196,834` | fetch on-focus, **zero polling**, dichiarato esplicitamente per le linee guida store |
| **Visioni Sospese** | `components/MemoriesCameraModal.tsx:16-23` | 6 filtri con soglie **ricopiate a mano**: `minLevel: 11/21/31/41` |
| **Archivio Storico** | `components/VaultModal.tsx:23-58` | quadrante 3 della Home, 3 bucket media |
| **Frame avatar** | `utils/levelUtils.ts:242-310`, `index.tsx:734` | bordo, aura e ombra crescono a ogni livello dentro il blocco da 10 |

`MemoriesCameraModal.tsx:19-22` e `components/TraguardiModal.tsx:33` replicano a mano le soglie
che `levelUtils.ts:149-159` già espone: `[1,11,21,31,41]` in entrambi. Se un rank si sposta,
questi due file sbagliano **senza errore TypeScript**.

### 1.6 Un quinto schermo che non si raggiunge

`app/poi/[id].tsx` è una schermata NFC gemella di `app/p/[id].tsx`, interamente mock: `Alert` con
un `setTimeout`, e a riga 16 dichiara *"In una versione completa, qui si farebbe una chiamata al
server"*. Non è dichiarata nello `Stack` di `app/_layout.tsx:155-160`.

`app/admin/nfc-setup.tsx` è invece un route file, quindi **è** nel router, ma `router.push` verso
di lui non esiste in nessun file: lo strumento che emette i tag con `nfc_uid` e `b2b_phone`
(`:70-71`) non ha un ingresso nell'app.

### 1.7 Due difetti di consistenza visiva sulla Home

**La barra XP mente sulla propria percentuale.**

```
app/(tabs)/index.tsx:723   larghezza = levelProgress.percent        -> progresso PER LIVELLO, 0-100%
app/(tabs)/index.tsx:726   testo    = {xp} / {nextXp} XP            -> progresso ASSOLUTO
```

A metà livello la barra è al 50% e il testo al 15%. `levelUtils.ts:217` espone già `xpInLevel`,
che serve esattamente a questo, e non viene usato.

**Il deep link non produce carte.** `buildLevelUpEvents` ha un solo produttore di chiamate:
`components/PoiDetailSheet.tsx:48,155,583-585`. Il flusso `app/p/[id].tsx` scrive XP solo in
AsyncStorage (`:78-81`), mostra un `XpToast` (`:104-106`) e **non enqueua nessuna carta**. Un
utente che entra dal tag NFC non vede mai il level-up.

---

## 2. Cosa dice la documentazione

`A7` §5 (`S5`) chiede **2 + 1 condizionata** e dà per mancanti sia la definizione delle sezioni
visibili sia il numero delle route (`A7:108-109`). Entrambe le cose risultano **superate dal
codice**: le sezioni sono 5 e una politica esiste, è solo un'interdizione invece di una
rivelazione.

`docs/radiography_loto_hub.md:14` descrive una navigazione `Home, Mappa, SCAN, Menu` con un
`events.tsx` che non esiste. È un archivio di luglio.

`docs/LOTO_HUB_MASTERPLAN_BETA.md:24` descrive `Home, Profilo, Comunità, Scan` con `map`,
`explore`, `events` come rotte invisibili: le ultime tre non esistono.

Nessun documento descrive la coda di carte, le REVEAL, il RITO, il Fiore, la Scheda Trofeo, il
feed o l'Archivio. **Tutta la coreografia della rivelazione è senza documentazione.**

---

## 3. Direzione

**La progressiva disclosure è reale ma è interamente dentro la coda di carte, non nella
navigazione.** Questo è il fatto da decidere, perché determina se la tab bar si tocca o no.

Le due strade sono incompatibili e vanno scelte una volta:

1. **La rivelazione sta nelle carte, la tab bar è piatta.** Cinque sezioni sempre visibili, la
   progressione agisce sui contenuti. È il codice di oggi, è coerente con C6 di R5, e non costa
   nulla. Da allora `A7` `S5` va scritta come *decisione presa*.
2. **La rivelazione sale alla navigazione.** La tab bar mostra una sezione quando il livello la
   sblocca. È ciò che `A7` propose e che nessun documento ha mai visto funzionare.

Resta il lavoro che le due strade hanno in comune, e che è la parte solida: **il cap sulla coda**
(`GamificationTransitionManager.tsx:44`) e **le soglie ricopiate a mano** in
`MemoriesCameraModal.tsx:19-22` e `TraguardiModal.tsx:33`, che sono copie di `levelUtils.ts:149-159`.

---

## 4. Buchi e rischi

| buco | gravità | effetto |
|---|---|---|
| **Il rito quotidiano non scrive** | **blocker** | il meccanismo dichiarato come motore di ritenzione non ha memoria. Tornare domani non produce nulla |
| **Nessun cap sulla coda di carte** | alto | LV1 → LV50 = 15 modali consecutivi. L'anti-flood è dichiarato da tre documenti e non esiste |
| **La tab bar non ha rivelazione** | alto | 5 sezioni al LV1, una sola interdetta. `A7` `S5` resta aperta perché nessuno ha deciso quale delle due forme sia quella giusta |
| **Soglie di rank duplicate fuori SSOT** | alto | 2 file replicano `[1,11,21,31,41]` a mano. Un cambio di rank li rompe senza errore TypeScript |
| **Il deep link non produce carte** | alto | l'ingresso dal tag NFC, che è il fiore all'occhi del progetto, è l'unico percorso senza level-up, XP o REVEAL |
| **La barra XP mostra due progressi diversi** | medio | 50% e 15% sulla stessa riga. `xpInLevel` esiste e non è usato |
| **`BADGE` mai prodotto** | medio | dichiarato e renderizzato a `GamificationTransitionManager.tsx:291`, nessun `queueEvents` lo emette. Codice morto |
| **`scan.tsx` non si apre mai** | basso | 8 righe, il tocco è intercettato dal `tabBarButton` centrale. Dichiarata come tab, mai renderizzata |
| **`app/poi/[id].tsx` e `nfc-setup.tsx` irraggiungibili** | basso | una schermata mock non dichiarata nello Stack, e lo strumento di emissione tag senza un ingresso |
| **Badge UI doppia** | medio | `BadgeCollectionModal.tsx` e il tab BADGE di `TraguardiModal.tsx:55-56,151` renderizzano la stessa lista. Dettaglio in `A2` §4 |

---

*Area A9, 30/09/2026. Confidenza Alta: verificato sul codice in questa sessione, livello L1. Non
dichiara nulla sul cloud, che non è ispezionabile. Le soglie di sezione sono quelle di `A2`: questa
area non le duplica, ne descrive solo la resa visiva.*