# L.O.T.O. HUB: Engineering Sync & Handoff (Backend -> Frontend)

> [!CAUTION]
> **MESSAGGIO PER I FUTURI AGENTI AI:** 
> Non commettete il mio stesso errore. Non tentate di risolvere problemi di logica complessa (XP, Anti-Cheat, Mocks) scrivendo codice React/TypeScript nel Frontend. L'ingegnerizzazione di L.O.T.O. HUB è già **avanzata e delegata interamente al Backend (Supabase).** Leggete questo documento prima di scrivere una singola riga di codice client.

## 1. Il Paradigma "Zero-Trust" del Frontend
Il frontend dell'app L.O.T.O. HUB (`feature/pure-production-v2`) è **stupido per design**. Non ha l'autorità di calcolare nulla. Serve solo come interfaccia per raccogliere input hardware (NFC) e renderizzare i dati elaborati.

*   **Nessun calcolo XP in locale:** L'avanzamento di livello e l'assegnazione dei punti avvengono tramite Trigger e RPC (`task_2_3_gamification.sql`, `MIGRATE_XP_BACKEND.sql`).
*   **Niente controlli Anti-Cheat in locale:** La formula di Haversine (tolleranza 50m) e il Velocity Check (> 130 km/h) per bloccare gli spoofer sono calcolati su Supabase. Il client non può e non deve decidere se un Tap è valido.
*   **Modalità Offline:** Dato che la validazione richiede calcoli real-time sul server, i Tap in assenza di rete devono essere **bloccati** alla radice (mostrando un Toast "Connessione necessaria"), per impedire code di check-in contraffatti.

## 2. La Migrazione dai Mock alla Produzione (SQL-First)
Tutti i dati fittizi presenti in `map.tsx` o `community.tsx` non vanno sostituiti scrivendo altri array o chiamate API complesse sul client. Vanno eliminati a favore delle **Viste (Views)** e **RPC** già modellate nella chat precedente (conversazione `fb161e9d...`):
*   **MIGRATE_MOCKS_TO_DB.sql:** Popola il DB con i POI reali di Taranto.
*   L'app frontend deve semplicemente fare query dirette (es. `supabase.from('vw_pois_frontend').select('*')`) e ascoltare.

## 3. L'Architettura B2B "Zero-Dashboard"
*   **Nessuna Dashboard Web in App:** I partner (Custodi/Nodi Civici) non devono loggarsi sull'app per vedere le statistiche (calpestii, PTI generati).
*   **Bot WhatsApp:** L'intero follow-up avviene passivamente. Le Edge Functions (Webhooks) scattano al raggiungimento di traguardi e sparano messaggi WhatsApp preimpostati ai partner.

## 4. Recap delle Fonti di Verità Esterne
Se avete un vuoto di memoria tecnico su come implementare una determinata formula, **NON inventatela**. Cercate nei log della chat precedente o nei documenti di sistema:
*   `.agents/AGENTS.md` (Zero-PII Assoluto, L.O.T.O. Pass, Identificazione Ibrida scartata).
*   `docs/LOTO_HUB_SSOT_DEFINITIVO.md` (Master Plan).
*   `HEALTH_CHECK_FORMULAS_REPORT.md` (Le formule esatte per Haversine, Filtro Cinematico, CO2 Istituzionale, Density Proxy BLE).

**Fine del Brief.** Se stai per scrivere codice su `app/(tabs)/`, assicurati che non stia violando queste direttive bypassando il backend.
