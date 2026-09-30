---
id: A5
tipo: area
ambito: stato-funzionale-app-mobile-e-cantieri-aperti
stato: Vivente
confidenza: Media
owner: Agent
aggiornato: 2026-09-26
evidenza:
  - git:8815fcf
  - git:c72e785
  - git:eee4598
  - git:bc37c59
  - git:b6bf361
  - git:d1afd36
  - git:16d5460
  - git:ee904a6
  - .agents/AGENTS.md:43
  - app/(tabs)/index.tsx:433
---

# A5 - App mobile: stato funzionale e cantieri aperti

> Risponde a: "a che punto e' l'app, cosa e' cablato, cosa e' ancora da fare prima degli store?"

Confidenza **Media**: il percorso e' ricostruibile con alta affidabilita' dal log Git e dai commit,
ma **nessun test di rilascio e' stato eseguito in questa sessione**. Il lavoro non committato del
26/09 non e' stato esaminato riga per riga.

---

## 1. Cosa dice il codice

### Release corrente — **rettificato il 26/09**

Avevo scritto qui *"1.0.2, versionCode 4"* citando il messaggio del commit `16d5460`. **Era
sbagliato**: avevo trattato un messaggio di commit come prova di stato corrente, che e' esattamente
il criterio **C13** che ho scritto dopo aver commesso l'errore.

| Fonte | Dice | Vale |
|---|---|---|
| `android/app/build.gradle:versionCode` | **9** | **si' — e' il file** |
| `android/app/build.gradle:versionName` | **1.0.7** | **si' — e' il file** |
| `app.json:expo.version` | **1.0.7** | **si' — e' il file** |
| `git show 16d5460` (messaggio) | 1.0.2 / 4 | no: descrive un momento |

Quindi: **release `1.0.7`, versionCode 9**. La documentazione in `docs/` e' ferma alla 1.0.2, ed e' il
drift documentale piu' grande del progetto.

**Nota connessa, e piu' grave:** `android/` e' in `.gitignore` (riga 44). `git ls-files android`
restituisce **0 file**. Quindi il `build.gradle` che contiene la versione, e l'intero progetto di
build Gradle, **non sono in Git**. La build non e' riproducibile dal repository. Vedi **C12** in
`docs_v2/regole/R5_criteri_di_scelta.md`.

### Storico delle release (le uniche cifre che restano corrette)

| Commit | Cosa dichiara | Valore come stato corrente |
|---|---|---|
| `16d5460` | 1.0.2 / versionCode 4 | no, e' un momento del passato |
| `a1243dc` | APK 1.0.2 generato e verificato con `aapt` | no, riguarda l'APK di allora |

**Vincolo di build (`AGENTS.md` §8):** la build Gradle **fallisce** se lanciata da un percorso
lungo. Le cause sono gli oggetti `.o` di `react-native-worklets` a 195/250 caratteri, che fanno
andare in errore `ninja: manifest 'build.ninja' still dirty after 100 tries`. **L'unica build
canonica e' `C:\loto_app\android`.** Percorsi lungi non sono un caso da gestire, sono una causa
nota di fallimento.

### Cosa e' cablato (verificato dai commit)

| Area | Commit | Cosa fa |
|---|---|---|
| Impatto dal ledger | `bc37c59` | `community.tsx` legge `vw_collective_impact`; "Esploratori Oggi" al posto di KM Esplorati; `profile.tsx` usa `profiles.total_co2` |
| Backup QR-only | `bc37c59` | rimosso il form email/password da `profile.tsx`. **Verificato: 0 occorrenze di `signUp` / `signInWithPassword` / `createUser`** |
| Diario + Fog of War | `db0a01d` | Diario di Bordo nel Profilo, nebbia sulla mappa |
| Anti-flood + REVEAL + rito | `b6bf361` | 1 LEVEL_UP aggregato, WHISPER solo sui KEY_LEVELS attraversati, REVEAL sezioni, RITO LV10 |
| Cadenza ogni 2 livelli | `d1afd36` | Eventi LV2, Itinerari LV4, Memorie LV6, Community LV8, gate in `map.tsx` via `useGamification().level` |
| Lint pulito | `ee904a6` | 19 warning rimossi: `map.tsx` (13), `ProfileModal.tsx` (5), `levelUtils.ts` (1) |
| Onboarding sensori | `c72e785` | 5° slide onboarding; `LotoHardwareGate` riscritto: **solo** check in sola lettura, mai richiesta spontanea. Elimina la notifica nativa all'avvio |
| REVEAL navigante | `eee4598` | pulsante "Esplora la Sezione" con `router.push` verso la sezione sbloccata |
| Feed reale + header | `8815fcf` | `utils/communityFeed.ts` su `user_pois`+`user_badges`+`impact_transactions`+`profiles`; **nessun `setInterval`** (fetch solo al mount e al focus della tab); header 331px; via il sottotitolo duplicato |

**Il lavoro non committato del 26/09** (7 file) aggiunge `utils/dbAggregation.ts` e il suo uso in
`app/(tabs)/index.tsx:433-440,487-490`: arricchisce il profilo con le metriche dal DB e invia
telemetria di avvio sessione. **Non verificato riga per riga in questa sessione.**

### Il vincolo che definisce il prodotto

Nessun polling: la decisione e' tua ed e' motivata. Il polling consuma batteria e i criteri di
validazione degli store ne penalizzano l'uso. Il feed si aggiorna al mount e al focus della tab,
con permanenza prolungata dell'ultimo evento. Questo non e' un limite da colmare: e' una scelta.

## 2. Cosa dice la documentazione

`docs/NEXT_SESSION_HANDOFF.md` e' il registro di 8+ istantanee di fine sessione dal 22/09. E'
il documento piu' utile e piu' pericoloso del progetto:

- **utile:** append-only, ogni sezione porta i commit, le verifiche e le task successive. Ricostruisce
  il percorso con precisione
- **pericoloso:** per costruzione **accumula cronologia**, quindi contiene affermazioni superate
  accanto a quelle valide. E' il primo file che un agente apre e l'ultimo che dovrebbe chiudere

Le ultime tre sezioni (24/09) sono coerenti con i commit. **Non ho verificato le sezioni piu' vecchie.**

`docs/FINE_SESSIONE_PROTOCOLLO.md` e' il workflow di chiusura (FASE 1-5: verifica, pulizia, commit
separati, handoff, riepilogo). Ha i metadati ed e' conforme.

## 3. Direzione

L'area va verso **una release 1.1.0/AAB con il ciclo check-in chiuso end-to-end**, non verso
l'aggiunta di funzioni. Il blocco non e' la gamification: e' che `user_pois` e `impact_transactions`
devono ricevere davvero righe (vedi A3, i 4 blocker).

La regola che la governa e' tua, 25/09: *"non compilare AAB finche' non te lo chiedo. Dobbiamo
essere sicuri che tutto sara' cablato e funzionante. Ad inizio ottobre torneranno le compilazioni
EAS gratuite"*. Quindi: **nessuna AAB senza tua richiesta esplicita**, e le verifiche su device
precedono la compilazione.

Il criterio di arresto e' verificabile: un check-in reale da `PoiDetailSheet` deve scrivere su
`user_pois` e `impact_transactions` e far scattare la catena di carte. Oggi quel percorso e'
interrotto dai 4 blocker di A3.

## 4. Buchi e rischi

| Bucco | Gravita' | Effetto se resta aperto |
|---|---|---|
| **Check-in non verificato end-to-end** | **Blocker** | senza la catena canonica applicata non si puo' affermare che la release funzioni. Il ciclo e' l'unica cosa che conta per la certificazione ESG e per la vendita |
| **7 file non committati** | Alto | `app/(tabs)/index.tsx`, `docs/codici_morti.md` modificati; 5 file non tracciati tra cui `utils/dbAggregation.ts` e `migrations/20260926120000_scan_chain_canonical.sql`. Un `git checkout` perde il lavoro di ieri |
| **Detection level-up doppia** | Blocker | vedi A2 §4: XP assegnati in silenzio senza carte |
| **Badge UI doppia** | Medio | vedi A2 §4 |
| **`Alert` di sistema nel manager** | Medio | `GamificationTransitionManager.tsx:115-121` contraddice G7 |
| **Migliore/esito: nessun test di rilascio in questa sessione** | Alto | lo stato "funzionante" e' quello dichiarato dai commit e dai tuoi report ADB, non una verifica qui |
| **`storico_chat_vecchia.md` 390 KB con 17 link rotti** | Basso | insostenibile come guida; utile come verbatim |

## 5. Cosa NON fare in questa area

- **Non compilare da un percorso lungo.** Solo `C:\loto_app\android`. Vedi §1
- **Non usare EAS per l'APK di test** (`AGENTS.md` §8, esplicito)
- **Non introdurre polling.** Decisione di prodotto, non un debito tecnico
- **Non aggiungere il backup via email.** Rimosso in `bc37c59`, con legge 1
- **Non aggiungere una funzione senza passare da A2.** Se tocca la progressione, la domanda e' se
  la si puo' fare con la SSOT esistente
- **Non fidarti di `NEXT_SESSION_HANDOFF.md` per una decisione.** Usalo per il percorso, non per
  lo stato corrente: A2 e A3 sono le fonti

## 6. Prossima verifica

Chiudere i 4 blocker di A3, poi un check-in reale su device, poi commit del lavoro non tracciato.
L'area resta `Media` finche' nessun test di rilascio e' eseguito qui.

---

*Area A5 verificata il 26/09/2026. Confidenza Media: percorso ricostruito dal log Git con alta
affidabilita', ma nessun test funzionale eseguito in questa sessione.*
