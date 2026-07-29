# 📘 L.O.T.O. HUB — MASTERPLAN & ARCHITETTURA DEL CODICE (BETA VERSION)
**Stato:** 🟢 Operativo (Versione Beta - Demo 15 Luglio)

Questo documento rappresenta la "Bibbia Ingegneristica" e il BluePrint definitivo dell'intero ecosistema codice di **L.O.T.O. HUB**. Descrive fedelmente la conformazione attuale del repository, le logiche di business implementate e le architetture di convalida.

---

## 1. VISIONE & MODELLO ECONOMICO
**Payoff:** *L.O.T.O. HUB — The Co-Xperience Engine*
Il progetto è una piattaforma per Co-Esperienze Territoriali con un modello economico **Zero-Frode**:
- Nessuna trattenuta sulle donazioni.
- Monetizzazione via SaaS/DaaS (vendita dati aggregati e report ESG a PA ed Enti).
- Impatto Civico generato direttamente dai flussi turistici ("Rigenerazione urbana dal Basso").

---

## 2. CONFORMAZIONE DEL CODICE E STRUTTURA DIRECTORY

L'applicazione è sviluppata in **React Native (Expo + TypeScript)** con un backend Serverless gestito su **Supabase**. L'architettura frontend è basata su **Expo Router** (File-based routing).

### 2.1 Navigazione e Routing (`app/`)
Il routing è gestito nativamente dal filesystem. La root contiene lo stack di navigazione principale:
- `app/_layout.tsx`: Root Layout che inizializza il `ThemeContext`, la gestione globale NFC e l'integrazione Supabase Auth.
- `app/(tabs)/_layout.tsx`: Switchboard centrale con menu inferiore ibrido. Comprende sezioni visibili (`Home`, `Profilo`, `Comunità`, `Scan`) e rotte invisibili usate come target di navigazione (`map`, `explore`, `events`).
- `app/p/[id].tsx`: **Entry-point per il Deep Linking NFC**. Modale dinamica a comparsa (Zero-UI friction) che viene lanciata quando il telefono tocca un "Segno del Luogo" (Tag NTAG424).

### 2.2 Componenti Core (`components/`)
I moduli UI sono isolati e altamente riutilizzabili per garantire scalabilità:
- `PoiCard.tsx` / `PoiDetailSheet.tsx`: Logica di visualizzazione dei Punti di Interesse con layout a Tab (Digitale, Info, Eventi).
- `CivicDashboard.tsx`: Dashboard per l'impatto collettivo (Barra Progresso Pubblica per gli obiettivi di rigenerazione).
- `XpToast.tsx`: Componente animato fluttuante per fornire feedback immediato e gamificato durante la conversione (check-in NFC).
- `ProfileModal.tsx` / `LotoPassCard.tsx`: Gestione dell'identità digitale e del Passaporto Turistico.

### 2.3 Utilities e Iniezione Mock (`utils/`)
Per garantire la stabilità della Beta durante le presentazioni senza inquinare il database:
- `mockInjector.ts`: Strato di intercettazione che inietta i P.O.I. fittizi (es. *Mena Mena Mè*, *Diseducation*) e i dati narrativi direttamente in memoria client-side.
- `haversine.ts` / `BackgroundLocationTask.ts`: Matematica geospaziale e tracking passivo (Camaleonte).

---

## 3. I DUE ATTORI: TURISTA vs PARTNER

Il codice discrimina l'interfaccia (UI) e le regole (UX) basandosi sul `flow_role` dell'utente salvato in database.

### 3.1 Il Turista (Esploratore / Sentinella)
- **Gamification Zero-Coercition:** Il codice esclude deliberatamente classifiche pubbliche o dinamiche tossiche. 
  - *La schermata Leaderboard è stata riconcepita in "Comunità" (La mappa delle scoperte).* 
  - La progressione è intima: si sbloccano Badge Narrativi (Medagliere) in `ProfileModal.tsx`.
- **Triangolo di Convalida:** Il Check-In avviene tramite una tolleranza incrociata di 3 fattori:
  1. Lettura hardware NDEF (NFC).
  2. GPS Tollerante (Raggio del Geofence).
  3. Prossimità BLE (Proxy Density tramite Bluetooth Low Energy fittizio per simulare flussi urbani).

### 3.2 Il Partner (Zero-UI)
- **Nessuna Dashboard Complessa:** Un Partner (negoziante o custode civico) non deve imparare a usare software complessi.
- **WhatsApp Concierge:** In `index.tsx`, se il ruolo è `LOTO Partner`, l'interfaccia si spoglia. Mostra solo la LOTO Pass Card e un massiccio bottone che lancia `Linking.openURL` aprendo direttamente la chat WhatsApp con l'Agenzia L.O.T.O. per richieste o reportistiche.
- **Doppio Handshake GPS (Anti-Frode):** Logic flow progettato per l'onboarding:
  - *Fase 1:* L'operatore fissa il tag e registra la coordinata X.
  - *Fase 2:* Il Partner fa il primo tap (Scan) col suo telefono; il sistema valida se la coordinata Y del Partner combacia con X. Solo allora il locale è "Autorizzato".

---

## 4. IL MOTORE DELL'IMPATTO (Cosa succede al Tap)

Quando avviene uno Scan NFC (`app/p/[id].tsx`):
1. **Frontend:** Animazione fluida (Loader 3 secondi) per simulare l'ingaggio hardware.
2. **Animazione XpToast (Duale):** Appare un popup elegante con animazione a molla (Spring). Se lo scan avviene su un P.O.I. Turistico, il turista guadagna **XP (Esperienza)** per la propria progressione narrativa (popup blu). Se lo scan avviene su un Evento o Nodo Civico (es. *Plasticaqquà*), l'utente guadagna **PTI (Contributo / Loto Punti)** (popup verde).
3. **Impatto Civico:** Sono esclusivamente i **PTI (Loto Punti)** guadagnati tramite le azioni civiche ad alimentare la Barra Civica in `CivicDashboard.tsx` (es. *10 Alberi in Piazza Garibaldi*). L'XP resta una metrica puramente personale per l'esplorazione, garantendo una netta separazione tra gioco turistico e impegno sociale.

---

## 5. STATO DEL DATABASE (Supabase SQL)
**Attualmente CONGELATO.**
Tutte le logiche strutturali (RPC per la distanza geospaziale, trigger di gamification base `tr_handle_discovery_and_xp`, tabelle `pois`, `profiles`, `impact_transactions`) sono stabili e funzionanti.

*Blocco SQL Cautelativo:* Come da direttiva, le tabelle specifiche per gli Obiettivi Collettivi reali (`civic_goals`, `user_goal_contributions`) e la logica crittografica dei token B2B sono congelate fino alla firma contrattuale con i Nodi Civici. L'app attuale usa Mock Dati (iniettati via TypeScript) per simulare questi flussi durante i Pitch.

---

**DOCUMENTO MASTER BETA — APPROVATO E CONGELATO.**
*Questo è il framework ingegneristico definitivo che blinda la stabilità del progetto per l'esecuzione della fase go-to-market.*
