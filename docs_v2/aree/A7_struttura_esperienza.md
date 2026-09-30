---
id: A7
tipo: area
ambito: struttura-finale-dell-app-esperienza-validazione-e-percorso
stato: Bozza
confidenza: Media
owner: Agent
aggiornato: 2026-09-26
evidenza:
  - brain/ad0b58e2-544c-4569-9d42-d0cca1625133/LOTO_4_TIER_ARCHITECTURE.md
  - brain/edf3a8e6-785a-4c0a-adf8-ccecfa355d1b/PERFECT_STATE_BLUEPRINT.md
  - brain/fb161e9d-9c2c-4652-bb90-544173968410/logiche_proprietarie.md
  - utils/levelUtils.ts:13
  - utils/levelUtils.ts:17-21
  - utils/levelUtils.ts:38-62
  - utils/haversine.ts:1
  - supabase/migrations/20260926120000_scan_chain_canonical.sql:132
  - .agents/AGENTS.md:5
  - .agents/AGENTS.md:36
---

# A7 - La struttura finale dell'app

> Risponde a: "che forma deve avere L.O.T.O. Map quando e' finito, e quali sono le opzioni
> sostenibili per arrivarci?"

Questa e' l'area che applica `R5`: nessun documento esistente descrive la struttura finale, e le
quattro che ci provano si contraddicono. Quindi le opzioni sono **derivate dai criteri che il
progetto ha gia' dimostrato di seguire**, non copiate da un blueprint.

Stato `Bozza` perche' 4 decisioni su 5 restano aperte (§4). Confidenza `Media`: la struttura e'
verificata sul codice, la sua ricostruzione documentale no.

---

## 1. Cosa dice il codice

Lo stato verificato che la struttura finale deve rispettare:

- **5 rank da 10 livelli, su 50 totali** (`levelUtils.ts:13,149`)
- **Scala di sblocco sezioni gia' decisa e implementata**: Eventi LV2, Itinerari LV4, Visioni Sospese
  LV6, Community LV8, Rito LV10, Co-Experience LV20 (`levelUtils.ts:17-21,38-62`)
- **POI non gated da XP**; l'unico gate per livello e' sui media (`required_level`)
- **Cooldown 12h definito nella catena canonica** ma **non applicato su cloud**
  (`migrations/20260926120000_scan_chain_canonical.sql:132`)
- **Geofencing e distanza**: `utils/haversine.ts`; privacy grid `lat.toFixed(3)` = celle 110 m
- **Nessun campo che distinga il tipo di validazione** di un POI: la distinzione esiste solo implicita
- **7 route tab** in `app/(tabs)/`, senza politica di visibilita' documentata

## 2. Cosa dice la documentazione

Quattro documenti propongono quattro architetture di validazione POI diverse. Nessuna coincide con
il codice, e nessuna e' piu' recente delle altre in modo dimostrabile.

| # | Struttura | Fonte | Come tratta i POI | Compatibilita' con C1-C10 |
|---|---|---|---|---|
| **I** | Triangolo uniforme | `master_blueprint` | NFC + GPS + BLE su **tutti** i POI | viola **C2** (costo marginale) e **C1** (NFC pubblico = collo di bottiglia) |
| **II** | NFC solo partner, GPS altrove | `ARCHITETTURA_GPS_SOFT` | NFC solo dove `category='partner'`, dwell 10 min per i monumenti | compatibile |
| **III** | 4 tier per segmentazione | `LOTO_4_TIER_ARCHITECTURE` | vedi sotto | **compatibile, ed e' l'unica scalabile** |
| **IV** | Solo GPS | `sfoltimento_concettuale` | *"eliminiamo il controllo Bluetooth e teniamo solo GPS + QR/NFC?"* | **abbandonata**: nessuna risposta, e il BLE e' gia' codificato |

La III non "vince" perche' e' piu' recente. Vince perche' e' **l'unica che risolve tre problemi
contemporaneamente**: come si scala a una citta intera, come si rispetta Zero-IoT, e come si
distingue il gratis dal fatturabile.

## 3. Direzione: la struttura proposta, 4 tier di validazione

Nessun documento esistente contiene la risposta, quindi e' **derivata** dai criteri di R5. Si
riporta per intero perche' e' la risposta alla domanda "struttura finale".

| Tier | Popolazione | Hardware | Chi e' | Cosa produce | Costo marginale |
|---|---|---|---|---|---|
| **L1 — Innesco** | B&B e hotel | QR/NFC passivo in lobby | ospite | il B&B diventa "Promotore", revenue share | ~0 (un solo tag) |
| **L2 — Popolamento** | POI culturali, **importati da OSM** | **nessuno**. Geofence ~30 m | turista | heatmap venduta alle agenzie | **0** |
| **L3 — Mappatura civica** | barriere urbane, luoghi "maleducati" | **nessuno**: doppia segnalazione spontanea da 2 utenti | cittadini | match -> notifica + XP a entrambi | 0 |
| **L4 — Monetizzazione** | POI partner | NFC + GPS + BLE, "Triangolo della Verita'" | cliente del partner | sblocco media, PTI, whisper in chiaro | per transazione |

**Perche' questa e' la risposta e non un'altra:**

1. **E' l'unica che scala.** L2 permette *"importare migliaia di P.O.I. tramite OpenStreetMap in
   poche ore"*. E' la risposta diretta a C2 e alla domanda "come si arriva a un'intera citta".
2. **E' l'unica che produce una linea di ricavo separabile.** Il tier dice chi paga: L4 paga il
   merchant, L2 paga l'agenzia, L1 paga l'hotel. Sono tre prodotti diversi su una sola app.
3. **Rispetta C6.** I POI di L2 sono sempre consultabili: l'utente non "sblocca" la citta, la
   esplora. Il livello non e' un paywall di contenuto.
4. **Rende la 4-Tier una specifica, non un'idea.** Ogni tier ha un criterio tecnico verificabile:
   OSM + geofence, doppia segnalazione, triangolo NFC/GPS/BLE.

**Il costo di questa scelta:** l'app deve sapere in quale tier e' un POI. Il codice attuale non ha
questa distinzione esplicita, solo un flag implicito. E' il lavoro che la scelta implica.

## 4. Le altre tre leve strutturali

### L1 - I livelli: una sola verita', tre nomi distinti
Il codice ha **5 rank da 10 livelli** su 50 (`levelUtils.ts:13,149`). La documentazione ne descrive
**sei** varianti: 4 tier, 20 livelli con 5 rank da 4, 3 rank, 5 tier tematici, 5 frame grafici,
"10 tier certificati". Per C8 il codice vince: **50 livelli, 5 rank da 10**.

Il punto che nessun documento risolve: **`rank`, `tier narrativo` e `frame grafico` sono tre cose
diverse** e oggi si sovrappongono. Le varianti "Il Risveglio del Seme / Le Radici Sommerse / La Linfa
Vitale" (tier narrativo) e "Turista Occasionale / Esploratore / Custode" (rank) descrivono lo stesso
intervallo 1-10 con due nomi diversi. **La struttura finale deve dichiararle distinte**, o il primo
che modifica un nome rompe l'altro.

### L2 - Le sezioni: la scala e' gia' decisa e verificata
Eventi LV2, Itinerari LV4, Visioni Sospese LV6, Community LV8, Rito LV10, Co-Experience LV20
(`levelUtils.ts:17-21`). E' l'unico pezzo di architettura dell'esperienza che e' **sia deciso che
implementato**. Il problema non e' la scala: e' che la **tab bar** non e' definita. Tre documenti
dicono tre cose diverse (Home/Profilo/Comunita'/Scan · Home/Mappa/Scan/Menu · le 7 route del codice).

### L3 - I dati vendibili: griglia o soglia?
La documentazione fissa **griglia 110 m + bucket 15 min** (`logiche_proprietarie.md`). Il codice
implementa un approccio diverso: **soglia k-anonimita'** nella hardening delle viste DaaS. Non e' che
uno dei due sia sbagliato: sono due strategie diverse per lo stesso problema, e **non e' mai stato
deciso quale si applica**.

## 5. Le cinque decisioni strutturali

| # | Decisione | Opzioni | Raccomandazione | Perche' |
|---|---|---|---|---|
| **S1** | Struttura di validazione POI | I triangolo uniforme / II NFC solo partner / **III 4 tier** | **III** | unica scalabile, unica che separa le linee di ricavo, rispetta C2 |
| **S2** | Il POI e' distretto per tier nel codice? | no / **si, campo esplicito** | **si** | senza, S1 resta una prosa. Un `poi.tier` e' la differenza fra specifica e idea |
| **S3** | `rank` e `tier narrativo` sono la stessa cosa? | si / **no, tre livelli distinti** | **no** | oggi due nomi diversi per lo stesso intervallo 1-10; ogni rename futuro rompe uno dei due |
| **S4** | Soglia di privacy del dato venduto | griglia 110m / k-anonimita' / **entrambe, in livelli** | **entrambe** | la griglia da' la granularita' commerciale, la soglia la garanzia legale. Sono complementari, non alternative |
| **S5** | Tab bar: quante sezioni visibili al LV1 | 4 / 5 / **2** | **2 + 1 condizionata** | C6: al primo livello l'utente vede Mappa e Profilo. Tutto il resto si rivela |

**S5 merita una riga in piu'.** I documenti divergono perche' non hanno applicato C6: una tab bar
con 4 voci non e' "sbloccabile", e' un'interfaccia gia' consegnata. Se al LV1 l'utente vede solo
Mappa e Profilo, la **rivelazione diventa visibile** invece di essere annunciata da una modale. Il
costo e' accettabile, il beneficio e' la progressiva disclosure resa percepibile invece che dichiarata.

## 6. Buchi e rischi

| Buco | Gravita' | Effetto |
|---|---|---|
| **`vw_collective_impact` interrogata e NON definita** | **Blocker** | `app/(tabs)/community.tsx:99` e `app/(tabs)/index.tsx:451` la leggono, e in `community.tsx:96` un commento la chiama *"la SSOT"*. **0 definizioni in tutto `supabase/`**: l'unico accenno e' in `schema/introspection.sql`. Se manca nel cloud, la bacheca cooperativa e le statistiche collettive della Home sono vuote |
| **`vw_pois_frontend` esiste ma NON e' versionata** | **Blocker** | **esiste**: 12 definizioni in `supabase/archive_scattered_sql/` e `pure_cloud_queries/`, **zero in `supabase/migrations/`**. Funziona solo se applicata a mano. Vedi `RICOSTRUZIONE.md` §6 |
| **Nessun campo tier nel codice** | **Blocker per S1** | la struttura proposta non e' implementabile senza decisione sul dove sta il tier |
| **Tab bar mai definita** | Alto | tre documenti, tre risposte. Il codice ha 7 route tab e nessuna politica di visibilita' documentata |
| **`rank` e tier narrativo sovrapposti** | Alto | ogni rename di un nome rompe l'altro senza accorgersene |
| **Griglia vs k-anonimita' mai deciso** | Alto | due strategie di privacy in parallelo, nessuna dichiarata prevalente. In vendita questo e' il rischio legale |
| **Cooldown 12h non applicato** | Alto | definito (`:132`) ma nel ramo non applicato: senza, il check-in ripetuto sullo stesso POI vale XP ogni volta |
| **Visioni Sospese senza asset definitivi** | Medio | i layer sono ricreati in CSS, il bottone fotocamera e' stato rimosso. La funzione e' sospesa a meta' |
| **Whisper 31-50 assenti** | Medio | il lore si ferma a 30: l'end-game e' muto |
| **Riconoscimento ottico: si legge davvero `vw_pois_frontend`?** | Alto | l'analisi automatica ha sbagliato su tre punti in un giorno. **Ogni riga di questo documento va verificata a mano prima di costruirci sopra** |

## 7. Cosa NON fare in questa area

- **Non implementare una struttura descritta in un singolo documento.** Le quattro in campo si
  contraddicono tutte: nessuna e' la risposta. La risposta e' S1-S5
- **Non aggiungere NFC ai POI culturali.** Viola C1 e C2 insieme, e riporta in gioco il collo di
  bottiglia hardware gia' abbandonato
- **Non rinominare un rank senza toccare anche il tier narrativo.** Vedi S3
- **Non fidarti del nome di una tabella o di una vista.** `vw_pois_frontend` lo dimostra: il nome
  esiste in 2 file di frontend e in 0 migration
- **Non espandere la tab bar per "offrire di piu'".** Ogni sezione aggiunta all'inizio e' una
  sezione che la progressiva disclosure non puo' piu' rivelare. Vedi S5

## 8. Prossima verifica

Chiudere S1, S2 e S4, e introspezionare il cloud su `vw_pois_frontend` (`DECISIONI.md` D9, D10, D12).
Con S1 e S2 chiuse l'area passa a `Vivente` e la struttura finale diventa specifica; con
l'introspezione sale a `Alta`.

---

*Area A7. Le opzioni sono derivate dai criteri di R5, non copiate da un blueprint: nessun documento
esistente le contiene, perche' nessuno dei quattro agenti ha mai applicato quei criteri insieme.*
