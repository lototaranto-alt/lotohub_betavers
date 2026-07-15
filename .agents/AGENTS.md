# L.O.T.O. HUB - CORE PHILOSOPHY & AGENT RULES

As an AI working on the L.O.T.O. HUB project, you MUST strictly adhere to the following architectural and business principles in every code change, UI design, or architectural decision.

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

## 5. MVP Target (Taranto 2026)
- Keep implementations Lean. Avoid creating complex, costly real-time external API calls (e.g., live AI validations or expensive CO2 tracking APIs per user). 
- Use "Shadow Validation": calculate CO2 locally using ISPRA/DEFRA coefficients, and only sample 1% via external APIs to maintain scientific authority while dropping COGS to zero.
