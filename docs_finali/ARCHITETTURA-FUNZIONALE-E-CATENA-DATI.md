---
id: DOC-FINALE-ARCHITETTURA-DATI-2026
tipo: documentazione-definitiva
ambito: architettura-funzionale-e-catena-dati
stato: Definitivo
confidenza: Alta
owner: Team
aggiornato: 2026-10-12
evidenza:
  - utils/bleManager.ts:63
  - utils/bleManager.ts:75
  - utils/bleManager.ts:133
  - utils/bleManager.ts:155
  - utils/bleManager.ts:163
  - supabase/migrations/20261008140000_process_crowd_radar_m5.sql
  - supabase/migrations/20261008160000_process_crowd_radar_no_heat_m11.sql
  - supabase/migrations/20261011190000_crowd_heat_kview.sql:34
  - supabase/migrations/20261011190000_crowd_heat_kview.sql:44
  - supabase/migrations/20261011190000_crowd_heat_kview.sql:46
  - app/(tabs)/map.tsx:83
  - app/(tabs)/map.tsx:218
  - app/(tabs)/map.tsx:224
  - app/(tabs)/map.tsx:238
  - app/(tabs)/map.tsx:244
  - app/(tabs)/map.tsx:329
  - app/(tabs)/map.tsx:376
  - app/(tabs)/map.tsx:381
  - supabase/diagnostica_fase1/43_crowd_ble_precheck.sql
  - supabase/diagnostica_fase1/44_crowd_ble_post_apply.sql
  - app/(tabs)/index.tsx:184
  - utils/communityFeed.ts:24
  - docs_v2/FORMULE-PROPRIETARIE.md
  - docs_v2/ACCETTANZA-RUNTIME-APK.md
---

# L.O.T.O. HUB — Architettura Funzionale e Catena dei Dati (Documento Definitivo)

> ## ⚠️ Regola di lettura
>
> Come da [`METODICA.md`](METODICA.md) §1, **il codice è l'unica autorità.**
> Ogni affermazione in questo documento ha un riferimento `file:linea` nella sezione
> **Evidenza** (frontmatter) o nel corpo del testo. Se una riga non è verificata,
> è esplicitamente marcata come **"da verificare"** oppure **"da fare"**.

*Documento tecnico-pratico: come si articola il progetto e come la catena dei dati
trasforma il telefono del cittadino in un sensore del territorio. Destinato ad essere
allegato alla documentazione finale di prodotto.*

---

## 1. Scopo del documento

Questo documento descrive **come si articola L.O.T.O. HUB Map** in termini di
architettura, processi e catena dei dati, così come è **realmente implementata** alla
data di emissione. Non è una roadmap ideale: è la fotografia verificata del sistema,
costruita mentre la **killer feature** (Crowd/BLE → Heat) è stata portata
dall'idea al funzionamento reale osservato su device.

---

## 2. Visione e principi

- **L.O.T.O. HUB** (TSaaSI — Tourism Sustainable as a Service Institutional):
  infrastruttura tecnologica e civica per gestire, redistribuire e gamificare i
  flussi turistici e la fruizione urbana, **senza installare sensori sul campo**.
- **Il dispositivo dell'utente è il sensore**: converge GPS, BLE e NFC per produrre
  dati di presenza, impatto e comportamento a costo zero di infrastruttura.
- **Principio fondante**: ogni scrittura riconducibile a un utente passa da una
  funzione server autoritativa (RPC `SECURITY DEFINER`); le tabelle grezze restano
  chiuse (RLS senza policy); verso il cliente escono **solo aggregati k-anonimi**.
- **Design practice**: niente valori inventati dal client (il "fondo" heat è un
  conteggio di righe reali, il boost nasce da un evento Realtime; pesi e cap lato server).

---

## 3. Stack e binari di build

| Strato | Tecnologia | Note verificate |
|---|---|---|
| App (dev) | Expo SDK 54, RN new architecture, Hermes, expo-router | bundle serve Metro su `http://localhost:8081` |
| Mappa | Mapbox GL (`@rnmapbox/maps`, v11) | style `Light`, `logoEnabled` obbligatorio TOS |
| Backend | Supabase (Postgres) | RLS, RPC, Realtime `postgres_changes`, storage |
| Analytics | PostHog | chiavi in `.env` via `EXPO_PUBLIC_*` |
| Build Android | Gradle locale (`android/gradlew.bat assembleRelease`) | **nessun EAS** (deciso 11/10); APK standalone debug-signed |
| Data | `user_pois`, `impact_transactions`, `crowd_predictions`, `vw_poi_crowd_now`, `vw_pois_frontend` | SSOT dello stato |

**Due binari operativi** (deciso 11/10):
- **Device dev** → USB/Metro: sviluppo e diagnostica (log `[BLE Radar]`).
- **Device APK** → build release standalone: collaudo su struttura reale, bundle JS incorporato (212 MB, tutte le ABI, `assets/index.android.bundle`).

---

## 4. La Killer Feature: la catena Crowd/BLE → Heat

È il motore che dà il via all'ingegnerizzazione dei dati e dei processi collaterali:
**il radar BLE conta i device intorno a un Point of Interest e il cerchio di calore
si accende sulla mappa**, con pesi gestiti dalle due vie di dato (check-in e crowd).

### 4.1 Flusso end-to-end (numerato)

```
 1. L'utente apre la scheda di un POI  (components/PoiDetailSheet / app/p/[id])
 2. Partono le scansioni BLE (utils/bleManager.ts)
    · btState / permesso BT verdi; finestra di scansione, filtro RSSI, quorum
    · crowdCount = device univoci visti nella finestra
 3. Il client chiama la RPC:  supabase.rpc('process_crowd_radar', { p_poi_id, p_reporter_id, p_raw_count })
    (utils/bleManager.ts:155; log [BLE Radar] ai cfg 63-170)
 4. La RPC valida (identità da auth.uid(), cap, doppia convalida, confidence 1/2)
    e INSERT in crowd_predictions  (migration M5/M11)
 5. crowd_predictions resta CHIUSA: RLS ON, 0 policy, 0 grant
    (vedi diagnostica 43; la tabella grezza non è leggibile/scrivibile dal client)
 6. Una vista aggregata k-anonima espone il dato verso l'app:
       vw_poi_crowd_now  (migration 20261011190000, riga 34)
       60 min di finestra; reporters/device/certified/last_seen; HAVING count(reporter)>=1
       GRANT SELECT authenticated+anon (riga 46); legge oltre RLS perché owner=postgres
 7. La mappa fonde due termini (app/(tabs)/map.tsx:329):
       heat finale =  heat check-in  +  termine crowd
       (fondo giornaliero + boost 15'×2)   (min(8, device) dal view, refresh 45s)
 8. Mapbox CircleLayer colora il cerchio: grigio (vuoto) → ambra (alto)
    (map.tsx:376-381; scala non allarmante, stop da 0)
```

### 4.2 Gli anelli della catena

| Anello | Chi scrive | Chi legge | Protezione | File:riga |
|---|---|---|---|---|
| BLE Radar | — | client (scansione) | permessi BT | `utils/bleManager.ts:63-170` |
| RPC `process_crowd_radar` | qualsiasi client autenticato | — | `SECURITY DEFINER`, identità da `auth.uid()`, cap, convalida doppia | `20261008140000*`, `20261008160000*` |
| `crowd_predictions` (raw) | solo la RPC | nessuno | RLS ON, 0 policy, 0 grant | `43_crowd_ble_precheck.sql` |
| `vw_poi_crowd_now` (vista) | — | client anon/authenticated | k-anonimo, owner=postgres | `20261011190000_crowd_heat_kview.sql:34-46` |
| Mappa (fusione) | — | client | peso cap lato client per ora (vedi Evoluzioni) | `map.tsx:218-246,329` |
| CircleLayer | — | client | colori prodotto, non allarmanti | `map.tsx:376-381` |

### 4.3 Perché "tabella chiusa + vista aperta"

Il problema che questa architettura risolve (diagnosticato e verificato l'11/10):
il radar originale scriveva con INSERT diretto verso `crowd_predictions`, ma la
tabella aveva RLS ON senza alcuna policy né grant → l'INSERT falliva **in silenzio**
(il client non controllava `{error}`). Il link "dato → heat" era morto dalla nascita.

La soluzione ha due metà:
1. **Canalizzare la scrittura** nell'unica RPC autoritativa (nessun grant aperto: la
   tabella resta impenetrabile a prescindere);
2. **Aprire in lettura un solo aggregato k-anonimo**: mai IDs, mai MAC, mai
   reporter singolo visibile — la mappa vede solo "quanto c'è gente".

### 4.4 La scala di colore (specifica prodotto)

| heat | colore | significato |
|---|---|---|
| 0 | `#9CA3AF` grigio tenue | vuoto |
| 6 | `#FCD34D` ambra tenue | tiepido |
| 14 | `#F59E0B` ambra | alto |
| 30 | `#D97706` ambra profonda | molto alto |

Decisione prodotto (12/10): **colori non allarmanti**, niente rosso/allarme;
il raggio parte da 16 e sale a 52 così il "riempimento" è percettibile già a bassi heat.

### 4.5 I tempi del cerchio (cold start e decay) — da valutare in Fase 2

Tempi misurati nel codice al 12/10/2026, da usare come base per ottimizzare il
**cold start** dei cerchi (quanto un POI "si accende" dopo il primo dato):

| Parametro | Valore | Dove | Note cold start |
|---|---|---|---|
| Finestra boost recente | **15 min** | `app/(tabs)/map.tsx:78` | +2 per check-in; il decay riporta al fondo |
| Poll crowd della mappa | **45 s** | `app/(tabs)/map.tsx:248` | la vista crowd si aggiorna al massimo ogni 45 s a schermo a fuoco |
| Finestra vista `vw_poi_crowd_now` | **60 min** | `20261011190000_crowd_heat_kview.sql:34` | oltre 60 min di inattività il termine crowd sparisce dal cerchio |
| Tick decadimento boost | **60 s** | `app/(tabs)/map.tsx:311` | riallinea il punteggio al fondo giornaliero |
| Fondo giornaliero | da inizio giorno | `map.tsx` `heatScores` | non decade: è il volume del giorno |
| Cooldown check-in per POI | **12 h** | RPC `scan_poi_gps` | blocca il "refill" dello stesso POI |
| Raggio check-in | per-POI (`checkin_radius`, default **80 m**; test POIs **500 m**) | `20261009140000_m7_cold_start_no_9999.sql:97,124` | gate di prossimità |

Letenza minima del cold start oggi: un check-in (o una scansione crowd) → max 45 s
(primo poll) prima che il cerchio passi da grigio a tiepido; il boost via Realtime è
immediato se la mappa è aperta.

### 4.6 La via parallela: i check-in (fondo e boost)

- **Fondo giornaliero**: righe `user_pois` di oggi per POI (conteggio reale).
- **Boost recente**: ogni check-in negli ultimi 15 minuti vale **+2**, decade da solo.
- **Realtime**: `postgres_changes` su INSERT `user_pois` → +2 immediato sulla mappa
  aperta (`map.tsx`); il check-in da un altro device si riflette live.
- **Cooldown 12h** per POI; XP e impatto passano da `process_esg_impact` (interna).

---

## 5. Come lavoriamo: il metodo di ingegnerizzazione

1. **Misura prima di modificare**: ogni indagine parte da uno script diagnostico che
   produce **un solo result set** (un'osservazione per volta).
2. **Umano = esecutore SQL**: l'agente scrive lo script, l'umano lo incolla nel
   pannello Supabase e restituisce l'output; `diagnostica_fase1/*.sql` sono
   solo-lettura o temp table di sessione (es. 43 richiede "Run without RLS").
3. **Migration idempotenti**: header commentato, `BEGIN; GRANT; DROP POLICY IF
   EXISTS; CREATE POLICY; COMMIT;` (stile `20261009170000_events_policy_m16.sql`).
4. **Destroy dopo l'uso**: le fixture di test hanno cleanup incluso
   (es. `42_m12_fixture_poi.sql` elimina i POI `TEST HeatScore %`).
5. **Vetosecurity**: mai stampare chiavi in log/output; probe REST anon solo su
   colonne (colonna esistente → 401/200, inesistente → 400/42703).
6. **Scoping chirurgico**: si modifica **solo la sezione sotto analisi**; niente
   modifiche parallele ad aree che funzionano (regola operativa dichiarata dall'utente).
7. **Chiusura**: `HANDOFF.md`, `PIANO-LAVORO-MODULARE.md`, manifest (91 voci)
   verificato da `handoff.ps1` + `docs_v2/tooling/validate.py`.

### Fase 1 — ordine M-series (stato alla emissione)

`M14 → M4 → M5 → M15 → M11 → M6 → M7 → M9 → M10 → M16 → M17 → M12 → M13`
(M18 in parallelo). Stato: M5/M11 = RPC crowd autoritativa; M12 = acceptancе
runtime (check-in, cooldown, heat) **aperta e in corso**; M13 (igiene documentale) dopo.

---

## 6. Stato attuale e accettazione (12/10/2026)

| Voce | Esito verificato |
|---|---|
| BLE radar → RPC | `[BLE Radar] rpc OK, certified= 2` (log Metro) |
| Scrittura `crowd_predictions` | confermata (precheck / post-check 44) |
| Vista k-anon | `vw_poi_crowd_now` ESISTE, grant SELECT authenticated/anon |
| Heat cerchio | il cerchio del primo POI test **si è colorato** (Killer feature operativa) |
| Check-in | riuscito, XP assegnata, livello avanzato, cooldown 12h rispettato |
| Feed community | fetch al focus (non realtime); spec corretta "azioni degli altri" |
| Build | APK release standalone ok (gradle locale) |

**Segnalati e da trattare come blocchi separati** (non mischiati a questa catena):
- **Accavallamento modali** livello/transizioni (blocco UI dedicato).
- **Feed community in tempo reale** (oggi = refetch al focus, `index.tsx:184`).
- **Pulizia dati demo** del device 1 (account demo inquinato dai test).
- APK release **ricompilato a collaudo chiuso** per portare la catena BLE sul device 2.

---

## 7. Evoluzioni previste (verso il definitivo finale)

1. **k ≥ 3 in produzione**: la vista nasconde i reporter singoli (k=1 è SOLO test).
2. **Peso crowd non inventabile dal client**: oggi il cap (8) vive nel client;
   spostare soglie e pesi in una funzione/vista server per la regola "nessun valore
   dichiarato dal client".
3. **Fusione calibrata con bound**: uno scaling condiviso (es. crowd/check-in pesati
   per POI e finestra) documentato in [`FORMULE-PROPRIETARIE.md`](FORMULE-PROPRIETARIE.md).
4. **Realtime sul canale crowd** e/o refresh più spinto senza sprechi batteria.
5. **APK firmato/versionato per store** (oggi debug-signed, non per Play).
6. **Igiene documentale (M13)**: consolidare `docs_finali/` come unica fonte
   allegabile, senza mescolare i documenti storici di `docs/` e `docs_v2/`.

---

## 8. Appendice — Riferimenti verificati chiave

- `utils/bleManager.ts:155` — `supabase.rpc('process_crowd_radar', {...})`
- `supabase/migrations/20261011190000_crowd_heat_kview.sql:34,44,46` — vista + k + grant
- `app/(tabs)/map.tsx:218-246` — fetch della vista crowd (focus + timer 45s)
- `app/(tabs)/map.tsx:329` — fusione `check-in + crowd`
- `app/(tabs)/map.tsx:376-381` — CircleLayer scala grigio→ambra
- `supabase/diagnostica_fase1/43_crowd_ble_precheck.sql` — causa radice (RLS chiusa)
- `supabase/diagnostica_fase1/44_crowd_ble_post_apply.sql` — post-apply
- `docs_v2/ACCETTANZA-RUNTIME-APK.md` — collaudo runtime per M6/M7/M9/M10/M12/M16
  (riportato in copia locale qui: [`ACCETTANZA-RUNTIME-APK.md`](ACCETTANZA-RUNTIME-APK.md))
- `docs_v2/FORMULE-PROPRIETARIE.md` — costanti BLE e formula heat
  (riportato in copia locale qui: [`FORMULE-PROPRIETARIE.md`](FORMULE-PROPRIETARIE.md))