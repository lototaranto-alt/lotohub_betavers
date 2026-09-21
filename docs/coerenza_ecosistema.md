# 🔍 Gerarchia e Coerenza dell'Ecosistema L.O.T.O.

Questo documento mappa la struttura logica del "Motore dell'Impatto" per verificare che tutte le funzioni siano coerenti tra loro e con i principi fondanti (Zero-Coercition, Dualità XP/PTI). 
Ho isolato i vari flussi e messo in evidenza le incongruenze attuali rispetto al modello teorico.

---

## 1. 🚶‍♂️ Flusso di Esplorazione Turistica
**Attore:** Turista / Esploratore
**Azione principale:** Rilevazione del Passaggio (Check-in fisico)

- **Scenari Hardware (Da implementare/Mockare in futuro):**
  - Se `NFC Supportato & Acceso`: L'utente scansiona il NTAG424 -> Deep Link diretto a `app/p/[id].tsx`.
  - Se `NFC Spento`: Prompt del sistema -> "Attiva NFC nelle impostazioni".
  - Se `NFC Non Supportato`: L'app dirotta l'utente sulla Fotocamera -> Scansione QR Code alternativo.
- **Ricompensa per il check-in:** Generazione di **XP (Esperienza)**.
- **Utilità dell'XP:** 
  - Livellamento del profilo (LOTO Explorer -> Voyager -> Master).
  - Collezionismo personale (Medagliere).

## 2. 🏛 Flusso di Accesso Culturale (Vault Multimediale)
**Attore:** Turista / Esploratore
**Azione principale:** Sblocco di file audio/digitali presso i P.O.I.

- **Dinamica Attuale nel Codice:** I file media (`PoiDetailSheet.tsx`) si sbloccano tramite **Level Gate** (`media_vault.required_level`) validato server-side dalla RPC `sblocca_media`. I contenuti contrassegnati `is_premium_only` restano esclusiva completa del profilo ELITE (`profiles.is_premium`).
- **✅ RISOLTO (migration_v20_vault_currency_fix.sql):** La colonna `loto_cost` è stata rimossa: i media non hanno più alcun costo in **LOTO PTI**. La valuta civica resta dedicata esclusivamente all'impatto (Fondo Civico), XP al livellamento (Progressive Disclosure).
- **Offline:** gli sblocchi offline vengono accodati (`OfflineQueueManager`) e validati dal server alla ripresa della connessione (stessi gate Livello + Premium).

## 3. 🌳 Flusso di Impatto Civico
**Attore:** Turista + Partner Etico / Nodo Civico
**Azione principale:** Partecipazione ad azioni collettive.

- **Generazione PTI:** Avviene *solo* tramite azioni di valenza sociale (es. Partecipare a "Plasticaqquà", inviare una Segnalazione Urbana verificata).
- **Destinazione PTI:** Vengono versati direttamente (o automaticamente) nel "Fondo Civico".
- **Visualizzazione:** `CivicDashboard.tsx` mostra la barra riempitiva (es. 10 Alberi). **Nessuna spesa individuale**, il PTI è un punto-impatto cumulativo globale.

## 4. 🤝 Flusso Zero-UI Partner
**Attore:** Custode / Esercente
**Azione principale:** Supporto e Onboarding sicuro.

- **Logica Onboarding:** Il "Double GPS Handshake" convalida in background l'apertura del nodo.
- **Operatività:** Niente dashboard. Il Partner preme "WhatsApp Concierge" per interagire con l'Agenzia L.O.T.O. (Supporto umano, zero software).

---

### Sintesi delle Disconnessioni da sistemare (In futuro):
1. ~~**Vault Multimediale vs Valute:**~~ **RISOLTO in migration_v20** — sblocco = Level Gate + Premium server-side, PTI totalmente sganciati dai media (economia duale rispettata).
2. **UX dello Scanner (Scan Modal):** Strutturare visivamente i tre scenari (NFC On, NFC Off, QR Fallback) per guidare l'utente senza frustrazioni. In Expo Go manterremo i bottoni Mock, ma la logica ad albero dovrà esistere graficamente.
