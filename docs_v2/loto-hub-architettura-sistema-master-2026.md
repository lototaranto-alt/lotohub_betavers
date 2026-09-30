---
id: ARCHITETTURA-MASTER-2026
tipo: analisi
ambito: architettura-di-sistema-e-specifiche-funzionali
stato: Vivente
confidenza: Alta
owner: Agent
aggiornato: 2026-09-30
evidenza:
  - supabase/migrations/20260929160000_restore_proximity_gate.sql:106
  - supabase/migrations/20260930120000_vault_security_and_search_path.sql:1
  - supabase/migrations/20260926120000_scan_chain_canonical.sql:325
  - utils/levelUtils.ts:13
  - utils/OfflineQueueManager.ts:117
  - docs_v2/VERIFICA-RUNTIME-2026-09-29.md:1
---

# L.O.T.O. HUB — Architettura di Sistema Master (2026)

> **Come va letto questo documento.** È la versione pulita dell'architettura: contiene **solo ciò
> che è stato verificato**, con il riferimento al file e alla riga. Dove un'implementazione non è
> ancora confermata, la sezione lo dice in una riga invece di presentarla come un fatto.
>
> È nato il 30/09/2026 sostituendo il blueprint che si chiamava "MASTER BLUEPRINT & SSOT DEFINITIVO",
> conteneva due affermazioni risultate false, ed è conservato per il confronto storico in
> [`loto-hub-master-blueprint-ssot-2026.md`](loto-hub-master-blueprint-ssot-2026.md).
>
> **Il limite che non si aggira:** il cloud non è ispezionabile dall'agente. Ogni riga che riguarda
> il database è vera *se e solo se* la query di verifica è stata eseguita e l'output è stato letto.
> Le query stanno in [`diagnostica-gate-vault.sql`](diagnostica-gate-vault.sql) e
> [`query-cloud-q17-q27.sql`](query-cloud-q17-q27.sql).

---

## 1. Il modello: TSaaSI

**L.O.T.O. HUB** è un'infrastruttura tecnologica e civica per gestire, redistribuire e gamificare i
flussi turistici e la fruizione urbana. Il fine non è la gamification: è **misurare e
ridistribuire**. Il gioco è lo strumento di partecipazione che rende la misura accettata dai
cittadini.

Per le Amministrazioni e i Partner B2B espone strumenti **DaaS** (Data as a Service): la heatmap dei
flussi e i report di impatto ambientale.

### 1.1 I quattro principi

**Zero-IoT.** L'interazione fisica sul territorio avviene tramite tag NFC passivi e crittografati
(chip **NTAG424 SDM**): nessun sensore da installare, nessuna manutenzione, costi marginali
nulti. *Stato:* l'SDK esiste in `utils/nfcManager.ts` e la validazione lato server in
`validate_ntag424_sdm` (`20260926120000_scan_chain_canonical.sql:325`). **Non è verificato a
runtime**: `nfcManager.ts` non ha chiamanti. Esiste, non è collegato. `A5-T6`.

**Zero-PII (privacy assoluta).** L'utente accede in modo anonimo: l'identità è un UUID in
`auth.users`, nessuna email, nessun telefono, nessun dato personale raccolto. *Stato: verificato a
runtime il 29/09/2026.* L'identità sopravvive alla perdita di rete, il ciclo che prima generava un
profilo nuovo a ogni avvio offline è rimosso (`app/_layout.tsx`, `A3-T13`). Il contatore dei
profili è stabile a 5.

**Motore Camaleone (multi-tenancy dinamica).** L'interfaccia adatta grafiche, loghi, temi, mappa e
sponsor in tempo reale in base alle coordinate del dispositivo (geofencing su `tenants` e
`territories`) o al tag NFC letto. *Stato:* funzionante; resta aperta `Q17` su `tenants.id`, che se è
UUID rende silenziosamente inefficace il filtro per slug di `index.tsx:286`.

**Offline-First.** L'app continua a funzionare senza segnale (mare, campagne, vicoli). Le azioni si
accodano localmente e si sincronizzano al ritorno della rete. *Stato parziale, e va detto con
precisione:* la coda esiste (`utils/OfflineQueueManager.ts`) ma **gestisce un solo tipo di azione,
`UNLOCK_MEDIA`** (`OfflineQueueManager.ts:117`). I check-in non si accodano. Il 29/09 la cartella
`loto_vault` sul dispositivo era **vuota**, coerente con una coda mai inizializzata (`A5-T8`).
**L'affermazione "la coda crittografata" non e' ancora sostenuta dall'implementazione.**

---

## 2. Architettura del database

> *"Il Database è la fonte di verità; il Client è solo una vista reattiva."*
> **Questa regola è un obiettivo architetturale, non lo stato attuale.** Oggi è vera solo in parte:
> vedi §2.3.

### 2.1 Strati

```
┌──────────────────────────────────────────────────────────────────────────┐
│  CLIENT MOBILE (React Native / Expo)                                     │
│   • App Camaleonte (geofencing e multi-tenancy)                          │
│   • Onboarding Zero-PII (UUID anonimo + QR ripristino stato impatto)     │
│   • OfflineQueueManager (coda locale, solo UNLOCK_MEDIA oggi)            │
│   • Soft-sorting accessibilità, Shadow Validation, Sezione Community     │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │ viste e RPC
┌────────────────────────────────────┴─────────────────────────────────────┐
│  SUPABASE                                                                   │
│   • Governance e multi-tenancy: tenants, territories, profiles            │
│   • Ledger ESG immutabile: impact_transactions (append-only)              │
│   • Motore DaaS: vw_daas_heatmap_15min (griglia 110 m, bucket 15 min,     │
│     k ≥ 5, accesso riservato a is_loto_admin)                             │
│   • Estensioni: PostGIS nello schema public (verificato il 30/09, D1)    │
└──────────────────────────────────────────────────────────────────────────┘
```

**Estensioni.** PostGIS vive nello schema **`public`**, verificato il 30/09/2026. È il motivo per cui
tutte le funzioni `SECURITY DEFINER` possono usare `SET search_path = public, pg_temp` senza
dover aggiungere `extensions`: `ST_Distance` si risolve.

**Sicurezza delle funzioni.** Una funzione `SECURITY DEFINER` gira con i privilegi di chi l'ha
creata, quindi il suo `search_path` deve essere fissato. In PostgreSQL `pg_temp` viene cercato
**per primo** se non è nominato esplicitamente: senza elencarlo per ultimo, un utente autenticato
può creare una tabella temporanea che ombra una tabella di `public` dentro una funzione privilegiata.
Per questo la forma usata è `public, pg_temp`, non il solo `public`.

### 2.2 Funzioni di sicurezza e anti-cheat

| funzione | cosa fa | stato |
|---|---|---|
| `scan_poi_gps` | check-in GPS: prossimità, anti-velocità, shadowban, ricompense | **gate ripristinato il 30/09** (`A3-T12`), da verificare con query |
| `calculate_user_level` | curva dei livelli, identica al frontend | **verificato**: 50 soglie, 0 differenze con `utils/levelUtils.ts` (`A3-T9`) |
| `sblocca_media` | sblocca contenuti del Vault in base a livello e premium | corretta: usa `auth.uid()`, con `search_path` |
| `get_poi_vetrina` | catalogo multimediale del POI | **corretta il 30/09**: non accetta più `p_user_id` |
| `validate_ntag424_sdm` | valida la firma crittografica del chip NFC | presente, non verificato a runtime (`A5-T6`) |

**Il proximity gate.** Una riga sola vale tutto il Blocco 1:

```
v_dist_poi_m := ST_Distance(v_user_geog, v_poi_data.coords::geography);
IF v_dist_poi_m > v_radius_m THEN   -- rifiuta
```

Il raggio è per-POI (`checkin_radius`), con un default. Anti-velocità a 130 km/h, cooldown di 12 ore,
shadowban silenzioso e reversibile: sono scelte corrette, e proteggono il **valore** di una visita.
**Ma proteggono il valore di una visita che, senza prossimità, non è avvenuta.** Il gate è la riga che
manca-va ripristinata, perché l'anti-velocità da sola non basta: al primo check-in della vita non
c'è nessuno spostamento precedente da confrontare.

**L'errore che il gate corregge, in una riga.** Il 27/09 `scan_poi_gps` restituiva
`{success: true}` a un utente che poteva essere dall'altra parte dell'Italia. Nessun errore, nessun
avviso. La riga finiva nella heatmap DaaS e nel report che si vende alla PA. Il client controlla
solo `error` (`components/PoiDetailSheet.tsx:147`): il gate deve quindi **sollevare un'eccezione**,
non restituire un flag.

### 2.3 Dove il client è ancora autorevole

Questa sezione esiste perché il documento che precede contraddiceva la realtà, e il progetto non
deve ripeterlo.

| logica | dove sta | rischio |
|---|---|---|
| curva dei livelli | ora **anche** lato server, identica al client | risolto: i due non possono divergere (`A3-T9`) |
| formule CO₂ e distanza nel client | `utils/levelUtils.ts` (17 funzioni esportate) | un aggiornamento dell'app può cambiare un risultato senza toccare il DB |
| soglia di accessibilità | logica sparsa, fonti multiple non allineate | `Q26` decide se è `BOOLEAN` o `TEXT` |

**Non è "la logica risiede interamente lato server".** È una direzione di lavoro, con un primo
passo fatto e altri da fare. Dirlo in tempo è il motivo per cui il gate è stato trovato.

---

## 3. Specifiche funzionali

### 3.1 Soft-Sorting ♿ — accessibilità e deflazione inclusiva

L'algoritmo di navigazione ricalcola i percorsi incrociando accessibilità da **OpenStreetMap**,
schede dei **POI/partner** e segnalazioni dei cittadini. Le segnalazioni diventano ufficiali solo
dopo **convalida sul campo** da associazioni di categoria o nodi territoriali. L'app evita di
creare percorsi "ghetto" e mostra **piccoli banner sintetici di accessibilità** nell'anteprima e
nella scheda del POI, ridistribuendo i flussi verso tappe meno affollate.

*Stato:* il soft-sorting meteo è specificato in `METE-CONSIGLIATE-SPEC.md` e la sua migration
`20260929120000` chiude `Q23`. L'accessibilità è bloccata da `Q26`.

### 3.2 Safe & Fast

Percorso protetto di rientro rapido verso nave, hotel o parcheggio. Originariamente *Panic Mode*,
rinominato per ridurre l'attrito e l'allarme psicologico. **Spostato in backlog**: da ingegnerizzare
in un blocco successivo.

### 3.3 Shadow Validation — ecosostenibilità

L'impatto (CO₂ e risorse salvaguardate) viene calcolato in modo **ottimistico**, mostrato subito e
poi consolidato dal server. Ogni evento finisce in `impact_transactions`, registro **append-only**:
nessun record di impatto viene sovrascritto, come richiedono i requisiti di audit CSRD e ISO 14083.

### 3.4 Sezione Community e Obiettivi Comuni — l'ex L.O.T.O. Pass

È il passaggio che chiude il cerchio economico, e sostituisce la logica di economia individuale.

**Dismissione degli sconti B2B singoli.** La logica dei voucher e degli sconti commerciali individuali
alla cassa dei partner è **eliminata**. Non è una riduzione di funzionalità: è la rimozione di un
meccanismo che si contraddiceva con il modello.

**Economia civica e collettiva.** I punti e i token accumulati **non hanno valore economico
individuale**. Non sonoconvertibili, non spendibili, non cedibili. Chi lo spiega all'utente non sta
limitando qualcosa: sta dicendo che il valore è pubblico.

**Obiettivi Comuni.** I punti di tutti gli utenti confluiscono nella **Sezione Community** e si
sommano per raggiungere e sbloccare progressivamente **Obiettivi Comuni** di impatto civico,
ambientale e sociale per la città e il territorio.

*Perché è la parte importante del documento.* I due difetti più gravi trovati in questa codebase
non sono bug di logica: sono bug di modello. Il proximity gate accettava una posizione inventata e la
scriveva nella heatmap venduta alla PA — cioè **un falso claim di impatto**. E `sblocca_media`
accettava l'identità di un altro utente — cioè **un falso diritto su un contenuto**. In entrambi i
casi il sistema produceva una dichiarazione di realtà che non aveva verificato. La Sezione Community
concepisce l'impatto come una cosa che si costruisce insieme e si rende conto insieme: il che
rende obbligatorio che ogni cifra sia vera, perché è la cifra di tutti.

---

### 3.5 La meccanica civica, verificata nel codice

Recuperata dalla lettura dei quattro documenti di luglio e verificata riga per riga. Era assente
qui, ed è la parte che spiega a cosa serve tutto il resto.

**Due valute, due destini, nessuna sovrapposizione.** È la riga che tiene in piedi il modello e la
più facile da rovinare per sbaglio:

| | a cosa serve | chi lo accumula | dove finisce |
|---|---|---|---|
| **XP** (Esperienza) | sbloccare contenuti della Vetrina e i badge narrativi | il **turista**, esplorando POI culturali | resta personale, non muove nulla di pubblico |
| **PTI** (Loto Punti) | il contributo civico | chi partecipa a **eventi e Nodi Civici** | riempie la **Barra Civica**, che è pubblica |

La separazione è **codificata**: `XpToast.tsx:10` dichiara `type?: 'XP' | 'PTI'` e le icone divergono
di proposito, `eco` per i PTI e `stars` per gli XP (`XpToast.tsx:85-86`). Il popup blu è il
turista che esplora, il verde è la persona che agisce. Non è decorazione: è la traduzione visiva
della regola che i PTI non sono di nessuno.

**I Custodi.** Partner B2B che cofinanziano un obiettivo civico, con un tetto di **massimo 3
attività commerciali per obiettivo**, per evitare che un singolo operatore monopolizzi la barra.
Ricevono badge dedicati.

**Eventi Temporanei, o "Luogo X".** Per eventi in zone non mappate si mettono **1 o 2 tag NFC
fisici**, anche duplicati per smaltire le code. È la decisa risposta al "va tutto bene solo dove ci
sono già i dati".

**Handshake GPS doppio, anti-attivazione a distanza.** Due scan e un incrocio di coordinate:
l'operatore posa il tag e registra la coordinata X al momento dello scan; il partner fa il suo primo
tap e il sistema verifica che la sua coordinata Y coincida con X. Solo allora il locale è
autorizzato e si sblocca il concierge. Impedisce di attivare un partner da casa: per un sistema che
misura presenze reali, una presenza non verificata è una cifra inventata.

**Concierge WhatsApp, Zero-UI.** Un partner non impara un software. Vede la sua Pass Card e un
pulsante che apre la chat. Il ruolo è davvero implementato: `index.tsx:652` verifica
`userProfile?.flow_role === 'LOTO Partner'`.

**I tre report DaaS.** L'unica moneta del progetto è la fiducia negli altri, quindi i report sono
articolati per destinatario, non per destinatario generico:
1. **Decongestione** — alla PA: colli di bottiglia e efficacia delle politiche di deviazione traffico.
2. **Impatto Civico** — ai Custodi: quanti PTI ha generato il traffico, tradotti in impatto reale
   ("hai finanziato la pulizia di 500 mq di litorale"). È il pezzo di bilancio per la CSRD.
3. **Attivazione** — alle Associazioni: affluenza fisica certificata agli eventi.

**Il triangolo di convalida, con la sua correzione.** L'idea è giusta e l'implementazione è
diversa da quella documentata. Il Tap certifica l'azione e genera il record ESG primario
(*Proof of Action*). Poi parte una micro-scansione BLE in foreground di **5 secondi**
(`utils/bleManager.ts:11`, `BLE_SCAN_DURATION_MS = 5000`) che separa le *ancore* dagli altri
dispositivi: un device che raggiunge il **quorum** di rilevamenti è hardware di zona e viene
scartato dal conteggio folla, tutto il resto incrementa `crowdCount` (`bleManager.ts:124-128`).

> Qui i documenti di luglio si contraddicevano e il codice ha ragione. Si parlava di una "media
> device per utente"; **non esiste**: il codice conta sotto soglia, non fa medie. E la "seconda
> tabella" `crowd_predictions` **non ha un `CREATE TABLE` in nessuna migration**: esiste solo come
> nome in un elenco di introspezione. Il dato predittivo oggi non ha una casa.

---

## 4. Il metro

Il criterio di giudizio di questo progetto non è quante funzioni ha.

> **Un check-in da 500 km non produceva alcun errore: restituiva `success: true`.**
> In un sistema senza allarmi, il silenzio non è una buona notizia: è il peggior segnale
> possibile, perché non lascia tracce.

Quattro audit hanno prodotto 47 documenti, e le prime versioni erano sbagliate quasi tutte. Non per
incapacità: perché si stava descrivendo **un'intenzione** invece di **un comportamento**. Da qui la
regola che tiene insieme tutto, in [`METODICA.md`](METODICA.md): **nessuna affermazione senza
`file:linea`**, e un blocco si chiude solo con una prova, mai con un'intenzione.

Il Blocco 0 è il primo caso in cui la regola ha retto: verificato a runtime il 29/09, non dichiarato
risolto. È la differenza fra un progetto che funziona e uno che qualcuno sta guardando.

---

## 5. Triangolazione dei documenti di luglio

Il 30/09/2026 i quattro documenti che si contendevano l'architettura sono stati letti riga per riga e
confrontati con il codice. Il risultato è la tabella che avrebbe dovuto esistere dal giorno 15 di
luglio, quando il primo di loro è stato scritto e dichiarato "congelato e operativo".

**Cinque affermazioni tecniche risultate non implementate.** Non per errore: perché sono state
scritte come specifica e poi lette come descrizione di qualcosa che esisteva già.

| affermazione | stato reale | prova |
|---|---|---|
| "GPS e Haversine" | impreciso: il gate usa **`ST_Distance`** con PostGIS | `20260929160000_restore_proximity_gate.sql:106` |
| "media device per utente" per il dato predittivo | **non esiste**, il codice conta sotto quorum | `utils/bleManager.ts:124-128` |
| `crowd_predictions` come "seconda tabella" | **nessun `CREATE TABLE`** in alcuna migration | unico riferimento: `supabase/schema/introspection.sql:102`, come nome da ispezionare |
| "l'app usa Mock Dati per simulare questi flussi" | **superato**: l'iniettore è disattivato e non ha import | `utils/mockInjector.ts:4` |
| "Opzione B: modulo classico con Email e Password" | **non implementato**: nessun percorso email/password nell'app | nessun `signUp` né `signInWithPassword` sotto `app/` e `components/` |

**Una scoperta che cambia il perimetro.** `process_esg_impact`, descritta come la RPC che "elabora i
log grezzi e aggiorna i saldi in modo sicuro", **non è nella catena ufficiale delle migration**:
esiste solo in `supabase/archive_scattered_sql/LOTO_RESURRECTION_FULL.sql:148`, un archivio.

E il client la chiama davvero, per ogni check-in:

```ts
// app/(tabs)/index.tsx:597
const { error } = await supabase.rpc('process_esg_impact', {
  user_id: userProfile.id, p_co2: 0.5 * multiplier, p_liters: 5 * multiplier,
  p_tokens: 50, p_xp: 50, p_takeaway: false, p_party_size: multiplier });
```

Quindi ci sono due esiti possibili e **nessuno dei due è buono senza una verifica**. O la funzione
esiste nel database ma non è mai stata committata in una migration, e allora il repo non la
riproduce (`A3-T14` non è chiuso, è chiuso solo per i file che *abbiamo visto*). Oppure non esiste, e
ogni check-in finisce in `Alert.alert("Errore", "Impossibile completare la scansione.")`
(`index.tsx:606`). L'errore è gestito, il che è meglio di niente, ma un utente che scansiona un POI e
si becca un errore non è un utente servito.

**Da risolvere prima di qualunque altra cosa:** leggere dal cloud se `process_esg_impact` esiste e con
quale firma. Una sola query. Finché quel `?` non è tolto, la promessa "nessun calcolo pesante sul
telefono, il server garantisce i saldi" è una promessa senza corpo che la applichi — che è
esattamente il difetto che ha fatto trovare il proximity gate.

**Il "secondo gate" non è un gate: è una scorciatoia che indebolisce il primo.** Va detto con
precisione, perché a prima vista sembra un filtro e invece è il contrario.

```ts
// app/(tabs)/index.tsx:580
const dist = userLocation ? getDistance(...lat, lon, poi.latitude, poi.longitude) : 999;
if (dist > (poi.checkin_radius || 50)) {          // entra SOLO se sei lontano
  const { data: pings } = await supabase.from('location_pings')
    .eq('poi_id', poi.id)
    .gte('created_at', new Date(Date.now() - 12 * 3600 * 1000).toISOString()).limit(1);
  if (!pings || pings.length === 0) { Alert.alert("Troppo Lontano", ...); return; }
}
```

Il blocco a 12 ore non aggiunge un criterio, **toglie** il criterio: se esiste un ping nelle ultime
12 ore il check-in passa comunque, da qualunque distanza. Non è un cooldown anti-farming, è una
via di fuga. Nella configurazione attuale la distanza minima per chi ha un ping recente è **zero**.

E `location_pings` non ha un `CREATE TABLE` in nessuna delle migration ufficiali: è una tabella che
il codice interroga e che il repository non riproduce.

**Il gate server non gira.** `scan_poi_gps`, la funzione che la migration `20260929160000` ha
ripristinato e che contiene il controllo `ST_Distance`, **non ha un solo chiamante vivo**. L'unico
riferimento nel client è `utils/OfflineQueueManager.ts:140`, dentro la coda che gestisce unicamente
`UNLOCK_MEDIA`. Quindi la migration proximity è applicata, corretta, e non eseguita.

Il controllo di prossimità **attivo** oggi è quello client-side con `getDistance`. La distinzione
conta: il gate server calcola la distanza sul server con PostGIS, dove il client non può mentire
proprio sui numeri che invia. Quello client-side usa coordinate fornite dal telefono, ed è
esattamente il caso in cui la logica va dal lato sbagliato.

**Nota sul `party_size`.** I documenti di luglio davano il wizard Party Size per superato dal Tap.
Non è così: `index.tsx:594` legge ancora `userProfile?.party_size` e lo usa come `multiplier` per
scalare CO₂, litri e token. Il wizard potrebbe essere sparito dall'interfaccia mentre il dato
continua a comandare il calcolo dell'impatto.

**Una precisazione sul modello di identità.** I documenti di luglio descrivevano un modello ibrido,
con UUID anonimo e backup alternativo via email. Il codice implementa **solo** lo UUID anonimo. Il
documento di luglio non era dunque bugiardo sul merito: era semplicemente ahead of the code, e non
lo dichiarava. Zero-PII è quindi corretto come *stato*, non come *compromesso*.

**Una riga che nessuno dei quattro documenti riportava.** `index.tsx:591` intercetta l'esito
"Troppo Lontano" e mostra un avviso all'utente. Esiste dunque un controllo di distanza anche lato
client, indipendente dalla RPC. È rilevante per il Blocco 1 e verificabile subito senza cloud.

**Cosa resta vivo dei documenti di luglio.** La visione di prodotto è solida e quasi tutta
recuperata qui: i tre report DaaS, il tetto dei 3 Custodi, la Barra Civica alimentata dai soli PTI,
gli Eventi Temporanei, l'Handshake GPS doppio, il concierge WhatsApp, la fine delle classifiche
pubbliche. Nessuno di questi è stato buttato via: è stato **verificato e tenuto**.
