# Radiografia dell'Ecosistema L.O.T.O. HUB
*Data: 21 Luglio 2026*

Questo documento cristallizza l'architettura tecnica e concettuale dell'applicazione. Deve essere fornito a qualsiasi "Futuro AI" (me compreso nelle prossime sessioni) per evitare allucinazioni e mantenere il progetto sul binario corretto.

---

## 1. Architettura Frontend (React Native + Expo Router)
L'app utilizza la navigazione basata su file di Expo Router (`app/`).

### Gerarchia Navigazionale
- `app/_layout.tsx`: Root dell'app. Gestisce il Provider Globale, l'inizializzazione e il controllo della sessione (Auth Guard). Qui avviene lo splash screen.
- `app/(tabs)/`: La macro-area dedicata agli utenti loggati.
  - `_layout.tsx`: La Bottom Navigation Bar (Home, Mappa, SCAN, Menu).
  - `index.tsx`: (Home/Vetrina) Il cruscotto principale. Include il Ticker della community, i punteggi impatto e la lista dei P.O.I.
  - `map.tsx`: Mappa interattiva Mapbox con marker custom.
  - `events.tsx`: Calendario/Lista eventi della community.
  - `menu.tsx`: Area impostazioni, salvataggio account (Backup Supabase) e switch A/B UI.

### Gestione dello Stato (Context API)
L'app evita Redux in favore di Context React leggeri e modulari (cartella `context/`):
- `ThemeContext.tsx`: Gestisce i colori (dinamici in base al Tenant/Città) e lo switch `uiMode` ('classic' vs 'gamified').
- `TenantContext.tsx`: Gestisce i dati del Comune/Partner attivo (es. Lecce vs Taranto) scaricandoli dal DB per cambiare logo e testi in tempo reale.
- `MobilityContext.tsx`: Inizializza il "Mobility Wizard" (questionario modale) per capire come si muove l'utente (a piedi, bus, auto) per variare l'accumulo XP.

---

## 2. Architettura Backend (Supabase)
Tutta la persistenza è delegata a Supabase (PostgreSQL + Auth + Storage + Edge Functions). 
Il principio cardine è **Nessun aggiornamento diretto dal client per campi sensibili (XP/PTI)**, si usano procedure RPC.

### Tabelle Core (SQL)
- `profiles`: Contiene i dati utente. Colonne chiave: `flow_role` (LOTO Explorer, LOTO Partner, ecc.), `total_xp`, `total_tokens`, `accessibility_mode`. 
- `pois` (Points of Interest): I luoghi della mappa. Colonne chiave: `latitude`, `longitude`, `category` ('free', 'partner', 'secret'), `is_recommended`, `image_url` (non array JSON per le cover), `layer_name` (per interazioni Mapbox).
- `impact_transactions`: Un registro contabile immutabile (Ledger). Ogni volta che un utente guadagna o spende XP/PTI, si inserisce una riga. Trigger sul DB aggiornano automaticamente i totali in `profiles`.
- `tenant_events`: Eventi creati dai Partner/Comuni per la community.

### Ibrido Cloud-Mock (`utils/mockInjector.ts`)
Molte feature (B2B, Civic Goals di grandi dimensioni come "100 alberi per Taranto") sono simulazioni front-end iniettate tramite `mockInjector.tsx` per motivi di velocità, in attesa dei contratti con le PA reali.

---

## 3. Core Loops & Meccaniche (Zero-Coercition vs Gamification)
L'app ha un doppio binario economico che *non deve mai confondersi*:

1. **Esperienza Personale (XP - Il Turista):**
   - Si guadagna facendo check-in fisici ai P.O.I. tramite il "Triangolo della Verità".
   - Serve a sbloccare livelli (Eco-Navigatore -> Custode -> Eroe) e contenuti segreti/storie.
   - È un percorso *intimo*. Nessuna classifica PvP (Player vs Player) che genera ansia.

2. **Loto Punti Civici (PTI - Il Cittadino):**
   - Si guadagnano premiando le scelte ecologiche (es. spostamento dolce) e partecipando agli eventi (pulizia spiagge).
   - Servono a finanziare i Civic Goals comunitari.
   - È un percorso *collettivo*.

### Il Triangolo della Verità (Validazione Anti-Cheat)
Per fare check-in in un P.O.I., l'utente deve superare 3 controlli (`utils/BackgroundLocationTask.ts` e logica SCAN):
1. **GPS (Haversine):** Controllo software della vicinanza (raggio tollerante).
2. **NFC / QR:** Controllo hardware in loco (toccare la targa L.O.T.O.).
3. **Filtro Cinematico (Background):** Se l'utente si muove a >20km/h, l'app disabilita i check-in per impedire l'accumulo in auto.

---

## 4. Visione Commerciale e Curve di Apprendimento
*Nota Operativa per il Futuro:*
Se il progetto appare "superfluo" in fase di testing, il problema non è l'app, ma l'**Onboarding**.
Il valore di mercato di L.O.T.O. HUB risiede nei dati (Mobility ESG per le PA) e nel marketing geolocalizzato (Drive-to-store per i Partner).
L'utente finale deve percepire l'app come un "Passaporto Magico" della città. La curva di apprendimento va semplificata drasticando le Dashboard e concentrandosi su: *Apri l'app -> Esplora un luogo -> Fai Tap con NFC -> Ottieni una storia e un premio locale.*
