# Loto Map - CORE PHILOSOPHY & AGENT RULES

As an AI working on the Loto Map project, you MUST strictly adhere to the following architectural and business principles in every code change, UI design, or architectural decision.

## 1. Zero-PII & Privacy Absolute
- **NEVER** build or suggest forms that ask the user for Email, Name, or Phone Number inside the app.
- The app operates entirely anonymously. 
- The only backup method allowed is the **L.O.T.O. Pass (QR Code saved to the device gallery)**.

## 2. Zero-IoT (NFC & GPS Only)
- The platform is designed to require **NO expensive hardware** for the municipalities (B2G) or businesses (B2B).
- Validations (Proof of Action) are done strictly via **GPS geofencing** and **Encrypted NFC Tags (NTAG424)**.
- QR Codes are only used as a fallback for users without NFC readers.

## 3. Optimistic UI & Offline-First
- Tourist areas (museums, historic centers) have poor connectivity.
- **NEVER** use blocking loading spinners for core actions (like scanning a tag or unlocking a premium media).
- Interactions must update the UI instantly (Optimistic UI) and sync via a background OfflineQueueManager.

## 4. Gamification Asimmetrica
- Users cannot leave public reviews to avoid TripAdvisor-style toxicity. They leave anonymous "Whispers" that only the B2B partner can read.
- The map and destinations are "Soft-sorted" mathematically to deflate crowded areas and route users to less congested partner locations.

## 5. MVP Target (Agenzie Dati e Turismo)
- **TARGET PAGANTE:** Il target finale pagante di L.O.T.O. HUB NON sono i singoli locali e NON sono direttamente i Comuni. Vendiamo l'infrastruttura TSaaSI alle **Agenzie che trattano con le Amministrazioni Pubbliche** e alle **Agenzie del settore Dati e Turismo**.
- **IL PRODOTTO:** Forniamo a queste agenzie la rete passiva (Zero-IoT) che cattura dati ambientali e flussi turistici anonimi per le loro strategie territoriali e reportistica.
- Keep implementations Lean. Avoid creating complex, costly real-time external API calls (e.g., live AI validations or expensive CO2 tracking APIs per user).
- Use 'Shadow Validation': calculate CO2 locally using ISPRA/DEFRA coefficients, and only sample 1% via external APIs to maintain scientific authority while dropping COGS to zero.

## 6. Sviluppo Cross-Platform (iOS & Android)
- **Design Architetturale:** Tutta la codifica passata, presente e futura deve essere **Cross-Platform**.
- **Consapevolezza Nativa:** Non forzare un'unica soluzione se danneggia una piattaforma. Sfrutta l'ecosistema nativo quando necessario (es. *CoreMotion/HealthKit* per background iOS e *Foreground Services* per background Android).
- **Parit di Funzioni:** L'utente iOS e l'utente Android devono godere della stessa identica esperienza (es. Sincro-Avventura), anche se il codice "sotto il cofano" usa motori diversi.

## 7. ASSOLUTO RIGORE ARCHITETTURALE (ESG & B2B)
- **SEMPRE, SEMPRE, SEMPRE, SEMPRE, SEMPRE:** L'architettura del Database Ã¨ la singola fonte di veritÃ  (SSOT) e non deve MAI essere inquinata o forzata per accomodare codice frontend pigro.
- Il sistema e i suoi dati DEVONO rimanere **CERTIFICABILI per l'ESG e le vendite B2B**. 
- Dati ambientali (es. CO2) vanno in Ledger Immutabili (es. impact_transactions) e non vengono sovrascritti nei profili. 
- Il frontend deve rimanere leggero ("Zero-Code layer"): carica i pesi complessi solo in Lazy-Loading (Modali) e si affida a Viste (Views) e RPC performanti.
- Ogni script o funzione introdotta deve rispecchiare millimetricamente l'ingegnerizzazione scalabile esistente, verificando prima i dati reali, le relazioni (Foreign Keys/Cascades) e i tipi corretti.


## 8. COMPILAZIONE LOCALE (JDK / GRADLE)
- **MAI** suggerire all'utente di usare eas build o comandi cloud per generare l'APK di test.
- **L'Agente DEVE** occuparsi in autonomia della compilazione usando gli strumenti nativi (JDK/Gradle) presenti sul PC dell'utente.
- Il progetto è già "Precompilato" (la cartella ndroid esiste).
- Per generare l'APK, l'Agente deve usare il tool un_command in background: cd C:\loto_app\android; .\gradlew assembleRelease
- Al termine, l'APK generato si troverà in C:\loto_app\android\app\build\outputs\apk\release\app-release.apk.
