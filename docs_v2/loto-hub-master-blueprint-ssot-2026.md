---
id: BLUEPRINT-VISIONE-2026
tipo: analisi
ambito: visione-prodotto-e-specifiche-funzionali
stato: Bozza
confidenza: Media
owner: Agent
aggiornato: 2026-09-29
evidenza:
  - supabase/migrations/20260927090000_scan_chain_shadowban_and_ledger.sql:149
  - supabase/migrations/20260925120000_admin_dashboard_hardening.sql:81
  - supabase/migrations/20260926120000_scan_chain_canonical.sql:325
  - supabase/ORIGINAL_MASTER_RESTORE.sql:1472
  - utils/levelUtils.ts:13
---

# L.O.T.O. HUB — Visione e Specifiche Funzionali (2026)

> ## ⚠️ Perché questo documento non è il SSOT
>
> Un tempo questo file si chiamava **"MASTER BLUEPRINT & SSOT DEFINITIVO"**. Il 29/09 è stato
> **demotato**, e la ragione va scritta qui, non altrove.
>
> Non perché il progetto sia sbagliato, ma perché **due sue affermazioni si sono rivelate false**:
>
> | dove | cosa afferma | cosa ho verificato |
> |---|---|---|
> | §2.2 | `scan_poi_gps` "verifica la posizione del dispositivo" | nel codice in produzione **non esiste alcun controllo di distanza**. La riga che lo aggiunge è la migration `20260929160000_restore_proximity_gate.sql`, in attesa di essere applicata al cloud |
> | §2.2 | la logica di validazione "risiede **interamente**" in funzioni PL/pgSQL lato server | `utils/levelUtils.ts` esporta **17 funzioni**, e la curva dei livelli non ha alcuna autorità lato server |
>
> Un documento che si dichiara *definitivo* mentre contiene affermazioni non verificate è la causa
> diretta dei quattro giorni spesi a correggere `docs/LOTO_HUB_SSOT_DEFINITIVO.md`. È esattamente il
> meccanismo che [`METODICA.md`](METODICA.md) §1 vieta: **il codice è l'unica autorità.**
>
> **Cosa resta valido, e va tenuto:** tutta la §1 e tutta la §3. Visione, principi architetturali,
> soft-sorting, Shadow Validation, economia civica. Sono roba buona, e non l'avevamo scritta noi.
>
> **Cosa va trattato come ipotesi:** tutta la §2 (architettura implementata) e la §4 (roadmap), fino
> che non ciascuna riga ha un `file:linea` che la conferma. La roadmap è superata da
> [`PIANO-DECISIONE.md`](PIANO-DECISIONE.md), che è costruita sullo stato reale del codice.

*Visione, architettura di riferimento e specifiche funzionali — con l'implementazione verificata a parte.*

---

## 🏛️ 1. Visione & Architettura Core

### 1.1 Modello TSaaSI (Tourism Sustainable as a Service Institutional)
**L.O.T.O. HUB** è un'infrastruttura tecnologica e civica concepita per gestire, redistribuire e gamificare i flussi turistici e la fruizione urbana. Trasforma il territorio in un'esperienza interattiva senza la necessità di installare costosi sensori sul campo, offrendo alle Amministrazioni e ai Partner B2B strumenti DaaS (Data as a Service) per la misurazione dell'impatto e la gestione delle presenze.

### 1.2 Principi Architetturali Fondamentali
* **Approccio "Zero-IoT":** L'interazione fisica sul territorio avviene tramite tag NFC passivi e crittografati (chip **NTAG424 SDM**) ad altissima resistenza ed economico "trashware", azzerando i costi di manutenzione e installazione hardware.
* **Autenticazione "Zero-PII" (Privacy Assoluta):** L'utente accede in modalità totalmente anonima. L'identità è ancorata ad un UUID univoco in `auth.users`. Nessuna raccolta di mail, numeri di telefono o dati sensibili, garantendo piena conformità al GDPR (Privacy by Design & Default).
* **Motore "Camaleonte" (Multi-Tenancy Dinamico):** L'interfaccia dell'applicazione React Native / Expo adatta grafiche, loghi, temi, mappa dei P.O.I. e sponsor in tempo reale basandosi sulle coordinate geografiche (Geofencing via `tenants` e `territories`) o sul tag NFC scansionato.
* **Architettura "Offline-First":** Grazie all'**OfflineQueueManager**, l'app garantisce la continuità d'uso anche in assenza di segnale di rete (es. mare, campagne o vicoli). Le azioni vengono salvate e crittografate localmente accompagnate dal timestamp generato lato client (`client_timestamp`), per poi essere sincronizzate automaticamente con Supabase al ripristino della connessione.

---

## 🗄️ 2. Architettura Database Supabase (Single Source of Truth)

L'infrastruttura backend su Supabase segue la regola rigida: *"Il Database è la fonte di verità; il Client è solo una vista reattiva"*.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       CLIENT MOBILE (React Native / Expo)                   │
│   • App "Camaleonte" (Geofencing & Multi-Tenancy)                           │
│   • Onboarding Zero-PII (UUID Anonimo + QR Ripristino Stato Impatto)        │
│   • OfflineQueueManager (Coda transazioni locali + Client Timestamp)        │
│   • UI/UX: Soft-sorting ♿, Shadow Validation, Sezione Community            │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Reads ONLY from Vistas / Calls RPC
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        BACKEND SUPABASE (Single Source of Truth)            │
│   • Presentation Layer: Viste O(1) (`vw_pois_frontend`, `vw_collective_impact`)│
│   • Security & Anti-Cheat: RPC PL/pgSQL (`scan_poi_gps`, `validate_ntag424`)│
│   • Immutable ESG Ledger: `impact_transactions` (Append-Only Event Sourcing)│
│   • Governance & Multi-Tenancy: `tenants`, `territories`, `profiles`        │
│   • B2B2G DaaS Engine: `vw_daas_heatmap_15min` (Grid 110m, Bucket 15m, k>=5)  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Layer di Presentazione (Presentation Layer)
Il client mobile non interroga mai direttamente le tabelle grezze, ma legge unicamente da Viste pre-ottimizzate con complessità \\(O(1)\\):
* **`vw_pois_frontend`:** Vista geospaziale core che restituisce i Punti di Interesse, l'accessibilità, le categorie e lo stato di affollamento, filtrata per il tenant attivo.
* **`vw_collective_impact`:** Aggregatore in tempo reale delle metriche ESG di sostenibilità (CO₂ risparmiata, acqua preservata, token comunitari).

### 2.2 Sicurezza, Anti-Cheat & RPC (Remote Procedure Calls)
*Claim non verificato — da leggere come intenzione, non come stato del codice. Vedi la tabella in testa.*

* **Posizione della logica.** ⚠️ **Da verificare.** Il testo originale affermava che la logica di
  validazione e sicurezza risiede "interamente" in funzioni PL/pgSQL lato server. **Non è vero.**
  `utils/levelUtils.ts` esporta 17 funzioni client-side, fra cui l'intera curva dei livelli: un
  aggiornamento dell'app può cambiare il livello di utenti che non hanno spostato un XP. `A3-T9`.
* **`scan_poi_gps(p_poi_id, p_lat, p_lon, p_client_timestamp)`:** Verifica la posizione del dispositivo. Se rileva uno spostamento con velocità superiore a **130 km/h** tra due check-in consecutivi, attiva automaticamente il flag `is_shadowbanned` nell'archivio utente per prevenire lo spoofing GPS.
  * ⚠️ **La parte che mancava.** L'anti-velocità richiede un check-in precedente da cui misurare: al
    primo check-in della vita non c'è nulla da confrontare. La **verifica di prossimità vera** —
    essere fisicamente vicino al POI — è stata ripristinata il 29/09/2026 da
    `supabase/migrations/20260929160000_restore_proximity_gate.sql`, che **non risulta ancora
    applicata al cloud**. `A3-T12`.
* **`validate_ntag424_sdm(...)`:** Decodifica e valida la firma crittografica univoca trasmessa dal chip NFC NTAG424, garantendo l'assenza di clonazione degli adesivi.
  * *Presente nel codice* (`20260926120000_scan_chain_canonical.sql:325`), ma **non verificato a
    runtime**: `nfcManager.ts` è un'implementazione NTAG424 corretta e **non ha chiamanti**. Esiste,
    non è collegato. `A5-T6`.
* **`sblocca_media(p_media_id)`:** Sblocca i contenuti del Vault o le "Pillole Whisper" narramente collegate al livello dell'utente.
  * ⚠️ **Da verificare.** Compare soltanto in `ORIGINAL_MASTER_RESTORE.sql:1472`, un file di
    ripristino e non una migration tracciata. Nessuna evidenza che esista nel database vivo.

### 2.3 Ledger ESG Immutabile (`impact_transactions`)
Registro contabile basato su **Append-Only Event Sourcing**. Nessun record di impatto viene sovrascritto o modificato. Ogni check-in o azione ecologica genera un evento contabile immutabile conforme ai requisiti di audit di sostenibilità (CSRD e ISO 14083).

### 2.4 DaaS Heatmap Engine (`vw_daas_heatmap_15min`)
Motore analitico per Amministrazioni Pubbliche e grandi Partner B2B:
* Griglia spaziale rettangolare a celle di **110 metri**.
* Bucket temporali di **15 minuti**.
* Soglia di **k-anonimato (k=5)** per impedire la re-identificazione dei singoli cittadini.
* Accesso protetto da sicurezza di livello `is_loto_admin`.

---

## 🎨 3. Specifiche Funzionali UX & Gamification

### 3.1 Soft-Sorting ♿ (Accessibilità & Deflazione Inclusiva)
* **Fonti Dati Integrate:** L'algoritmo di navigazione ricalcola i percorsi incrociando i dati di accessibilità provenienti da **OpenStreetMap (OSM)**, dalle schede informative dei **P.O.I. / partner** e dalle segnalazioni inviate direttamente dai cittadini tramite form dedicato.
* **Validazione Territoriale:** Le segnalazioni dei cittadini inviate dal form si aggregano sul P.O.I. e diventano ufficiali solo a seguito della **convalida sul campo da parte delle associazioni di categoria / nodi territoriali**.
* **UX Inclusiva:** L'esperienza utente evita la creazione di percorsi "ghetto". L'app mostra **piccoli banner sintetici di accessibilità nell'anteprima e nella scheda del P.O.I.**, redistribuendo contemporaneamente i flussi turistici verso tappe meno affollate.

### 3.2 Safe & Fast (ex Panic Mode — Spostato in Backlog)
* **Re-branding:** Rinominato ufficialmente da *Panic Mode* a **Safe & Fast** per azzerare l'attrito e l'allarme psicologico nell'utente.
* **Posizionamento Roadmap:** La funzionalità (percorso protetto di rientro rapido verso nave, hotel o parcheggio) viene **spostata tra le Feature Future (Backlog)**. Verrà ingegnerizzata e posizionata meglio nella UI in un blocco di sviluppo successivo.

### 3.3 Shadow Validation (Ecosostenibilità)
* **Calcolo Reattivo:** L'impatto ambientale (CO₂ e risorse salvaguardate) viene calcolato istantaneamente e mostrato con un'interfaccia **Optimistic UI** (reazione visiva immediata prima della conferma server).
* **Registrazione Immutabile:** L'evento viene inviato e consolidato nella tabella `impact_transactions` su Supabase.

### 3.4 Stato Impatto & Sezione Community (ex L.O.T.O. Pass)
* **Dismissione Sconti B2B Singoli:** Viene completamente eliminata la logica dei voucher e sconti commerciali individuali alla cassa dei partner B2B.
* **Economia Civica e Collettiva:** I punti e i token accumulati **non hanno valore economico individuale**.
* **Sezione Community & Obiettivi Comuni:** I punti di tutti gli utenti confluiscono nella **Sezione Community** dell'app, sommandosi per raggiungere e sbloccare progressivamente **Obiettivi Comuni** di impatto civico, ambientale e sociale per la città e il territorio.

---

## 📅 4. Roadmap di Sviluppo a Blocchi Sequenziali

*Roadmap originale del 2026. **Superata** da [`PIANO-DECISIONE.md`](PIANO-DECISIONE.md), che è
costruita sullo stato reale del codice e sul rischio reale. Qui sotto resta come documento di
intento: i blocchi 1 e 2 sono in parte superati dal lavoro sui blocchi B0–B2.*

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ BLOCCO 1: Consolidamento Database Supabase                                  │
│   • Migration canonica `01_canonical_schema.sql`                             │
│   • Vista `vw_pois_frontend`, RPC `scan_poi_gps` e `impact_transactions`    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ BLOCCO 2: Connessione Client Mobile & Offline                               │
│   • Integrazione `client_timestamp` in OfflineQueueManager.ts               │
│   • Ripristino identità e Stato Impatto anonimo                             │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ BLOCCO 3: Hardware NFC & Validazione Crittografica                          │
│   • Firma NTAG424 SDM e RPC `validate_ntag424_sdm`                          │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ BLOCCO 4: Sezione Community & DaaS Engine                                   │
│   • Obiettivi Comuni della Community                                        │
│   • Dashboard di analisi flussi `vw_daas_heatmap_15min` per PA e B2B        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---
*Visione e specifiche funzionali del progetto. Lo stato reale del codice è in
[`MANIFEST.json`](MANIFEST.json) e nell'area `03-`; l'ordine di lavoro in
[`PIANO-DECISIONE.md`](PIANO-DECISIONE.md).*
