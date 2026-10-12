---
id: FORMULE-PROPRIETARIE
tipo: regola
ambito: formule-proprietarie-loto-hub
stato: Vivente
confidenza: Alta
owner: Agent
aggiornato: 2026-09-29
evidenza:
  - docs/logiche_proprietarie.md:1
  - utils/bleManager.ts:11
  - utils/haversine.ts:8
  - utils/levelUtils.ts:79
  - utils/BackgroundLocationTask.ts:11
  - supabase/pure_cloud_queries/19_reimposta_mete_consigliate_e_aggiorna_get_pois_rpc.sql:1
  - supabase/schema/introspection.sql:1
  - .agents/rules/master_business_brief.md:22
---

# Formule Proprietarie — la fonte unica

> **Questo documento sostituisce `docs/logiche_proprietarie.md` e gli altri cinque file che se ne
> contendono il contenuto.** Non li cancello: li dichiaro superati. Finche' due documenti
> descrivono la stessa formula, uno dei due è sbagliato, e quello che perde è l'agente della
> sessione dopo, che non sa quale leggere.

## Perche' questo documento esiste

Le formule di L.O.T.O. HUB sono state scritte **sette volte** in sette file diversi, con valori
diversi. E il file che doveva contenerle tutte, `HEALTH_CHECK_FORMULAS_REPORT.md`, **non esiste
più**: `docs/ENGINEERING_SYNC_HANDOFF.md:27` lo cita come "le formule esatte per Haversine,
Filtro Cinematico, CO2 Istituzionale, Density Proxy BLE", e
`INVENTARIO_DOCUMENTAZIONE.md:178` lo conferma come link rotto.

Il risultato e' che l'unico posto dove una formula e' scritta per bene a volte e' un **vecchio
log di chat**. Non e' un modo di tenere un brevetto.

## La regola dei tre colonne

Ogni formula qui ha tre cose, e se manca una delle tre la formula **non e' documentata**, e' solo
una intenzione:

| Colonna | Domanda che risponde |
|---|---|
| **Codice** | Quale file e quale riga la implementano, davvero |
| **Origine** | Quale documento la descrive |
| **Verdetto** | Se le due cose coincidono |

I verdetti sono cinque, e non sono generosi:

| Verdetto | Significato |
|---|---|
| `CONFERMATO` | Il codice fa quello che il doc dice, con quei valori |
| `DISCORDANTE` | Il codice esiste ma i valori o la logica **non** coincidono |
| `PARZIALE` | Una parte esiste, la parte che manca no |
| `NON IMPLEMENTATA` | Solo prosa. Nessun codice, in nessun file |
| `DEPRECATA` | Il documento stesso la dichiara fuori uso |

Una formula `NON IMPLEMENTATA` non è un bug: è una specificazione. Si scrive, si decide, si
implementa — ma **non si racconta come se fosse viva**.

---

# 1. Geospaziali e validazione

## 1.1 Formula di Haversine — `CONFERMATO`, con due difetti

```
a = sin²(Δφ/2) + cos φ1 ⋅ cos φ2 ⋅ sin²(Δλ/2)
c = 2 ⋅ atan2(√a, √(1−a))
d = R ⋅ c
```

| | |
|---|---|
| **Codice** | `utils/haversine.ts:8` (`calculateDistance`, formattata) e `:31` (`calculateDistanceRaw`, numerica) |
| **Origine** | `docs/logiche_proprietarie.md:13-17` |
| **Verdetto** | `CONFERMATO` sul testo della formula |

**Difetto 1 — due copie con unità diverse.** `utils/haversine.ts:8` usa `R = 6371e3` (metri, e
restituisce metri). `context/TenantContext.tsx:71` usa `R = 6371` (chilometri, e restituisce
chilometri). Non è un errore: sono due consumatori diversi. Ma il doc ne descrive **una sola**,
quindi chi lo legge non sa che esiste l'altra. Nota che `TenantContext` ha **riscritto da zero**
la funzione invece di importarla: due copie da tenere allineate a mano.

**Difetto 2 — la controparte backend non esiste.** `docs/logiche_proprietarie.md:10` dichiara una
RPC `get_distance` in Supabase. **Non è in nessuna delle 11 migration né in nessuno dei 63
export.** Se esiste nel cloud, è una quinta fonte fuori catena; se non esiste, il doc mente.
Da chiudere con `Q18`.

## 1.2 Triangolo di Convalida — `PARZIALE`

Tre fattori: NFC, GPS entro 50–100 m, densità BLE.

| Fattore | Stato |
|---|---|
| GPS con tolleranza | `CONFERMATO` — Haversine, soglie usate in `PoiDetailSheet.tsx:543` |
| Densità BLE | `CONFERMATO` — vedi sezione 2 |
| **NFC con payload crittografato NTAG424** | **`DISCORDANTE`** |

Il claim del crittogramma NTAG424 **non regge**: `app/admin/nfc-setup.tsx:49` usa `NfcTech.Ndef`,
che è NDEF in chiaro, standard e non autenticato. Un tag clonato si clona. Questo è `A1-T2`, e la
riga 22 di `docs/logiche_proprietarie.md` va riscritta.

## 1.3 Double GPS Handshake — `NON VERIFICABILE`

`docs/logiche_proprietarie.md:29-43` presenta due funzioni, `saveCoordinatesAtInstallation()` e
`getCoordinatesAtFirstScan()`. **Questi nomi non compaiono in nessun file del repository.** Il
frammento è pseudo-codice illustrativo, non una specificazione.

Non la classifico `NON IMPLEMENTATA` perché potrebbe esistere con nomi diversi: è semplicemente
non verificabile da quello che c'è. `Q19`.

---

# 2. Density Proxy BLE — `CONFERMATO`

Questa è la formula meglio documentata del progetto, ed è tutta in codice.

| Costante | Valore | Riga | Cosa fa |
|---|---|---|---|
| `BLE_SCAN_DURATION_MS` | **5000** | `:11` | Durata della scansione in foreground |
| `TRUSTED_RSSI_THRESHOLD` | **-75** | `:12` | Soglia di segnale per considerare un device |
| `DECAY_MS` | 72 ore | `:13` | Dimenticanza dei device appresi |
| `PROMOTION_QUORUM` | **5** | `:14` | Volte perché un POI diventi "maturo" |
| `COLD_START_QUORUM` | **2** | `:15` | Quorum ridotto per POI nuovi |

**L'algoritmo, in quattro tempi** (`utils/bleManager.ts`):

```
1. SCANSIONE   startDeviceScan, allowDuplicates: false, 5 s (:77)
                tiene solo i device con rssi >= -75            (:79)

2. DECADIMENTO cancella i device non visti da oltre 72 h       (:99)
                calcola se il POI e' "maturo": un device con
                times_seen >= 5 lo rende maturo                 (:107)
                activeQuorum = 5 se maturo, altrimenti 2       (:112)

3. CLASSIFICAZIONE per ogni device visto:
                times_seen >= activeQuorum -> ANCORA (isIndoorValidated)
                altrimenti               -> FOLLA (crowdCount++)  (:124-128)

4. FINGERPRINT djb2 dei MAC visti, ordinati alfabeticamente e uniti con '|' (:133-139)
```

La parte interessante, e non documentata da nessuna parte, è il **quorum differenziato**: un POI
maturo richiede 5 conferme, uno appena nato ne accetta 2. È un meccanismo anti-spoofing a freddo
che nessun documento descrive, e che è la parte più fragile da perdere.

## Due scoperte che nascono da qui

**`confidence_score` è cablato a 100.** `bleManager.ts:154` scrive `confidence_score: 100` fisso.
Non è un punteggio calcolato: è una costante. Nel database, quella colonna non significa
"quanto siamo sicuri", significa "siamo arrivati". Se un report commerciale la legge come
confidenza, sta leggendo una costante.

**`crowd_predictions` non è definita da nessuna parte.** L'app scrive in
`crowd_predictions` (`:150`), la tabella è in `types/database.ts:240` e viene interrogata da
`supabase/schema/introspection.sql:102`. Ma **non c'è un solo `CREATE TABLE crowd_predictions`**
nelle 11 migration né nei 63 export. La definizione è stata persa. Se la tabella non esiste nel
cloud, l'`INSERT` fallisce e l'errore è catturato da un `try/catch` che scrive solo
`console.log` (`:157-159`): **la folla non arriva mai alla heatmap e nessuno lo vede.**

E la forma della tabella è `(poi_id, reporter_id, raw_count)`: una riga per utente per POI. È
esattamente la forma che il lavoro sull'anonimato ha dichiarato vietata. Va sotto il k-anonimato
di `ANONIMATO-E-INTEGRITA-LEDGER.md` prima di alimentare la heatmap.

---

# 3. Gamification

## 3.1 Dualità XP / PTI — `CONFERMATO`

Due valute separate: **XP** per scoperta e turismo, **PTI** per contributo civico. La separazione
è reale e rispettata in `impact_transactions` (campo `action`).

## 3.2 Progressione a livelli — `CONFERMATO` (e i tier non esistono più)

`docs/logiche_proprietarie.md:72-76` descrive tre tier a 0-99, 100-499, 500+ token, "calcolati
matematicamente in `index.tsx`".

**Nessuna delle due affermazioni è vera.**

1. I tier sono **vietati dal codice**. `utils/LevelUpLore.ts:4`:
   `// - VIETATO: Bronzo/Argento/Oro e ogni riferimento ai PTI come leva di crescita.`
2. In `index.tsx` **non esistono**. Né Bronzo, né Argento, né Voyager, né Master: zero occorrenze
   in tutto `app/`, `components/`, `utils/`, `types/`. Il documento punta a un file dove quel
   codice non c'è mai stato.

### La progressione reale

Una tabella di **50 livelli** in `utils/levelUtils.ts:79-129`, raggruppati in cinque titoli da
dieci livelli:

| Titolo | Livelli | XP per l'ingresso |
|---|---|---|
| TURISTA OCCASIONALE | 1–10 | da 0 a 1350 |
| ESPLORATORE | 11–20 | da 1650 a 6600 |
| CUSTODE DELLA CITTÀ | 21–30 | da 7300 a 16750 |
| EROE DEL MARE | 31–40 | da 17950 a 30100 |
| LEGGENDA L.O.T.O. | 41–50 | fino a 46450 |

`calculateLevel()` (`utils/levelUtils.ts:132`) non calcola nulla: **scorre la tabella dal basso e
restituisce il primo livello il cui `minXp` è superato**.

### Perché va saputo

Dentro ogni blocco da 10 l'incremento è **perfettamente lineare di 30 XP**. Ma ai cambi di titolo
salta in modo irregolare: 300 → 430 → 930 → 1200. Quindi **non è una formula chiusa**, è una
tabella scritta a mano e tarata sul feeling.

Questo è il punto da capire prima di toccarla: non puoi "correggere la progressione" con un
coefficiente, perché non c'è un coefficiente. Ogni riga è una decisione. E dato che i 30 XP a
livello restano costanti per tutta la vita, **il livello 50 arriva a 46450 XP e lì si ferma**:
oltre non c'è niente, e `isMaxLevel` (`:188`) lo gestisce come caso finale.

Le soglie di sblocco contenuto sono separate: `KEY_LEVELS` a `:13`, `SECTION_UNLOCK_LEVELS` a
`:24`. Sono due liste diverse dalla tabella dei livelli, e non vanno confuse.

## 3.3 Soglie civiche 1 / 5 / 10 — `DA VERIFICARE`

`docs/logiche_proprietarie.md:62-65` dà tre conteggi esatti. Le funzioni esistono
(`award_civic_pti`, `award_action_badges`, `award_impact_badges` nei 63 export), ma **i valori non
sono in questo repository**: le definizioni stanno fuori catena. `Q20`.

---

# 4. Motori ESG

## 4.1 Filtro Cinematico — `CONFERMATO`, valore sbagliato nel doc

Scarta i fix GPS inutili per non sporcare il database e non scaricare la batteria.

| Costante | Valore | Riga |
|---|---|---|
| `HYSTERESIS_TIMER_MS` | **10 minuti** | `utils/BackgroundLocationTask.ts:11` |
| `SYNC_THRESHOLD` | **200 metri** | `utils/SincroAvventura.ts:10` |
| Filtro delta | `>= 15 && < 100` metri | `utils/SincroAvventura.ts:177` |

Il vecchio doc non dà valori, e il brief dichiarava **5 minuti**: sono **10**. È `A1-T4`.

Una nota sul `BackgroundLocationTask.ts:20`: il commento dice *"Logica cambio città (omessa per
brevità)"*. Il task è registrato e gira, ma **la logica che dovrebbe contenere è un commento**.
Da non trattare come funzionante.

## 4.2 Moltiplicatore Sponsor — `DEPRECATA`

Già dichiarato fuori uso dal documento stesso (`docs/logiche_proprietarie.md:77-79`): l'impatto
è 1:1. Si mantiene la voce qui solo per evitare che qualcuno lo reimplementi.

## 4.3 Calcolo Griglia — `CONFERMATO`

```js
const gridCell = `${location.latitude.toFixed(3)}_${location.longitude.toFixed(3)}`;
```

Arrotondamento a 3 decimali = celle di circa **110 × 110 m**. È il meccanismo di anonimizzazione
spaziale delle segnalazioni, ed è coerente con la griglia scelta in
`ANONIMATO-E-INTEGRITA-LEDGER.md`. È la formula **più solida** del gruppo, insieme alla Haversine.

## 4.4 Coefficienti CO₂ — `NON IMPLEMENTATA E NON ATTRIBUITA`

Il brief e il playbook dichiarano "coefficienti statici ISPRA/DEFRA". Nel codice ci sono i numeri
`0,12` / `0,10` / `0,08` negli script del SQL Editor, **senza alcuna fonte** che li giustifichi.
Nessun riferimento a ISPRA o DEFRA esiste in alcun file.

Non sono una formula: sono tre numeri senza padre. Servono una fonte o vanno rimossi. `A1-T5`.

## 4.5 Certificazione a campione all'1% — `NON IMPLEMENTATA`

Dichiarata in **cinque** file, implementata in **zero**:

| File | Riga |
|---|---|
| `.agents/rules/master_business_brief.md` | 22 |
| `.agents/AGENTS.md` | 28 |
| `PLAYBOOK_COMMERCIALE.md` | 9 |
| `docs_v2/BRIEFING-AGENTE.md` | 42 |
| `docs_v2/regole/R5_criteri_di_scelta.md` | 46 |

Nessun campionamento, nessun `Math.random()`, nessuna soglia, nessuna coda di transazioni da
validare. Non c'è niente da portare in `docs_v2`, perché non c'è niente.

**Perché è importante registrarlo qui e non solo come task.** È l'unico claim del progetto che
l'agente rigenera da solo: essendo in `.agents/AGENTS.md`, viene ricaricato a ogni sessione e
riprodotto nelle risposte. Finché resta lì, si auto-ripara. `A1-T1` e `Q9`.

---

# 5. Mete Consigliate — `DECISA, DA IMPLEMENTARE`

**Decisione dell'utente, 2026-09-29: l'algoritmo entra nel prodotto.** Prima di questa data la
risposta era aperta (`Q21`), e la documentazione era ferma a metà: promessa, nessun codice.

Il flag esiste ed è letto: `app/(tabs)/index.tsx:857` fa `filter(p => p.is_recommended)`.
L'unica posto in cui viene **scritto** in tutto il progetto è
`supabase/pure_cloud_queries/19_reimposta_mete_consigliate_e_aggiorna_get_pois_rpc.sql`:

```sql
-- 1. Reimposta il flag is_recommended su alcune mete chiave.
UPDATE public.pois SET is_recommended = true
```

È un `UPDATE` manuale, eseguito a mano dal pannello. Nessuna soglia, nessun raggio, nessun
algoritmo.

L'intento originale è in `docs/storico_chat_vecchia.md:3555` e `:3591-3595`: soft-sorting del
deflusso, soglia all'80% di `loto_quota_max`, redirect dei turisti sui POI culturali vuoti entro
1–2 km. **È un'idea buona** — decongestione, ed è la tesi del report per la PA — e il codice per
farla esiste quasi tutto già.

La specifica è in [`METE-CONSIGLIATE-SPEC.md`](METE-CONSIGLIATE-SPEC.md). In sintesi: le tre colonne
necessarie (`loto_quota_max`, `crowd_level`, `is_recommended`) **esistono già** su `pois` e sono
già nella vista che l'app legge. Manca **solo lo scrittore**.

Una riga da non ripetere: `storico_chat_vecchia.md:3556` spiega lo scaffale vuoto con *"non c'è la
massa critica di turisti, il sistema sta riposando"*. **No.** L'algoritmo non è mai stato scritto.
Lo scaffale era vuoto perché dietro non c'era niente.

---

# 5b. Formule di scansione e anti-spoofing — `CONFERMATE, una PERSA`

Verificate il 2026-09-29 nel punto 3. Dettaglio completo in
[`loto_map/03-zero-iot-e-offline.md`](loto_map/03-zero-iot-e-offline.md).

| Formula | Valore | Origine | Verdetto |
|---|---|---|---|
| Raggio di prossimità | `pois.checkin_radius` per-POI, **non** 80 m cablato | `20260926120000:157-165` | **PERSA** nella versione viva |
| Anti-velocità | >130 km/h shadowban · 20–130 veicolare · <20 pedonale | `20260926120000:178-210` | `CONFERMATO` |
| Cooldown | 12 h sullo stesso POI, senza XP | `20260926120000:187-194` | `CONFERMATO` |
| Presenza per l'accredito | 15 min dalla `scan_poi_gps` | `20260926120000:345-357` | `CONFERMATO` |
| Ricompense | `xp_reward` e `base_co2` **dal POI** | `20260926120000:196-210` | **DISCORDANTI** tra le due versioni |
| NFC NTAG424 | AES-128, `p` (PICCDATA) + `c` (CMAC), chiavi fuori dall'APK | `utils/nfcManager.ts:11` | `CONFERMATO` e **mai chiamato** |

## La formula che non c'è più

`20260926120000` implementa la prossimità con `checkin_radius`, `ST_Distance` e un messaggio
d'errore esplicito: 5 occorrenze. `20260927090000` **sostituisce il corpo di `scan_poi_gps`** e di 5
ne resta 1 — `ST_Distance` a riga 149, che serve all'anti-velocità. **`checkin_radius` non è più
letto da nessuna parte**, e la versione del 27/09 è quella dichiarata allineata al cloud.

Un utente al primo check-in della vita non ha né velocità da calcolare né prossimità da verificare.
Nessun errore: 15 XP, una riga in `user_pois`, e finisce nella heatmap DaaS. `A3-T12`, `Q24`.

**È la seconda classe di difetto emersa fin qui.** Le altre formule non implementate sono numeri
mancanti. Questa è un controllo **che esisteva ed è stato cancellato da una sostituzione di corpo**,
senza errore di compilazione e senza test. `Q24` decide il raggio; il ripristino non aspetta.

---

# 6. Decisioni già prese

| Data | Decisione | Conseguenza |
|---|---|---|
| 2026-09-29 | **La scansione BLE dura 5 secondi.** Confermata dall'utente per assicurare risultati | Il codice ha ragione. I documenti che dicono **3 secondi** sono sbagliati e vanno corretti: `docs/LOTO_HUB_SSOT_DEFINITIVO.md:31` e `:33` |
| 2026-09-29 | Le formule di `docs/logiche_proprietarie.md` sono ingegneria reale del prodotto, non appunti | Vanno integrate nel codice dove mancano, e dichiarate `NON IMPLEMENTATA` finché non lo sono |

## Documenti che questo file sostituisce

Non cancellati, ma **superati**. Non leggerli per le formule.

| File | Ruolo |
|---|---|
| `docs/logiche_proprietarie.md` | Originale. Sezione 2.2 (Bronzo/Argento/Oro) **da cancellare** |
| `docs/HEALTH_CHECK_FORMULAS_REPORT.md` | **Non esiste.** Link rotto da `ENGINEERING_SYNC_HANDOFF.md:27` |
| `docs/LOTO_HUB_SSOT_DEFINITIVO.md:30-34` | Sezione BLE: i 3 secondi sono errati |
| `docs/architettura_core_1_2_3.md:28` | Coerente con Haversine |
| `docs/storico_chat_vecchia.md:3463-3505` | Unica traccia dell'algoritmo Mete Consigliate. **Non è una specificazione** |
| `.agents/rules/technical_business_analysis.md:7,14` | Formula ibrida, senza valori |
| `LOTO_HUB_MASTER_CONTEXT.md:37` | Tolleranza Haversine 50 m. Coerente |

---

# 7. Le query per chiudere i verdetti aperti

Cinque verdetti restano sospesi. Non servono inventare nulla: **le query che le chiudono sono già
state scritte** in `supabase/schema/introspection.sql`, e nessuno le ha mai eseguite.

| # | Domanda | Sezione |
|---|---|---|
| `Q18` | Esiste una RPC `get_distance` in `public`? | 1.1 |
| `Q19` | Esistono `saveCoordinatesAtInstallation` / `getCoordinatesAtFirstScan`? | 1.3 |
| `Q20` | I valori delle soglie civiche 1/5/10 in `award_civic_pti` | 3.3 |
| `Q21` | **CHIUSA — l'algoritmo entra nel prodotto** (2026-09-29). Specifica in `METE-CONSIGLIATE-SPEC.md`. Resta aperta `Q23`: come si distingue il flag scritto dall'algoritmo da quello scritto a mano | 5 |
| `Q22` | `crowd_predictions`: esiste, e con quali colonne e policy? | 2 |
| `Q24` | Il proximity gate è stato perso di proposito o per sostituzione del corpo? Quale raggio? | 5b |
| `Q25` | La coda offline deve accreditare check-in retroattivi? Serve un `p_visited_at` | 5b |

Il blocco `8` di `introspection.sql` copre gia' `Q18`, `Q19` e `Q22` testualmente: sezione 8d per le
firme delle RPC, 8g per l'esistenza delle tabelle. Basta eseguirlo e salvare il risultato in
`supabase/schema/`.

`Q24` e `Q25` **non** hanno bisogno di cloud per essere aperte: sono state individuate leggendo il
codice, e sono le due decisioni che sbloccano `A3-T12` e `A2-T6`.
