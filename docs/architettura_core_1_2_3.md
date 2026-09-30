# 🌳 Architettura Core: I 3 Pilastri (Allineamento Definitivo)

> ## ARCHIVIO. Documento storico, non e' fonte di autorita'.
>
> **Demotato il 30/09/2026.** Si dichiarava definitivo e si contendeva l'autorita' con altri
> documenti. Il file canonico di questo progetto e'
> `docs_v2/loto-hub-architettura-sistema-master-2026.md`; l'indice di chi dice il vero e'
> `docs_v2/tooling/autorita.json`.
>
> Il testo originale e' integro qui sotto. **Se contraddice l'architettura attuale, vale
> l'architettura attuale.** Non e' stato cancellato: un archivio che si cancella non e' un archivio.


Questo documento traccia la verità assoluta basata su `AGENTS.md` e sugli script di sistema, ripulita da speculazioni o derive commerciali inesatte.

---

## 1. Sicurezza e Calcolo Veloce in DB (XP vs PTI)
Tutto il peso del calcolo è spostato sul backend per garantire velocità, sicurezza e **zero peso sul client dell'utente**.

*   **Il Ruolo del Database:** La tabella `public.profiles` custodisce i contatori `total_xp` (Progressione Culturale) e `total_tokens` (Contributo Civico/PTI). L'app non altera mai questi numeri direttamente.
*   **Edge Functions & RPC:** L'app invia log passivi. È il motore `process_esg_impact` (nel backend) che calcola il reale impatto, approva la transazione sicura (`impact_transactions`) e aggiorna i saldi. In parallelo, l'RPC `calculate_user_level` traduce matematicamente l'XP in livello per lo sblocco progressivo della Vetrina.

---

## 2. Identificazione Zero-PII al Primo Avvio
Niente contesti React complessi o "useAuth" tradizionali. Il fulcro è **l'identificazione anonima totale**.

*   **La Direttiva Assoluta (`AGENTS.md`):** Mai chiedere Email, Nome o Telefono. Il sistema si basa sull'onboarding passivo.
*   **Generazione Fantasma (Script 06):** Al primo avvio, Supabase o il client genera un UUID anonimo. L'utente entra in app istantaneamente ("Download & Play").
*   **L.O.T.O. Pass (QR Code):** L'unica via di fuga per il salvataggio o il ripristino del profilo non è il cloud con password, ma la generazione di un QR Code univoco salvato nella galleria del dispositivo.

---

## 3. Proof of Action e Validazione (I Principi Reali)
Nessuna "logica inesistente" di portafogli che scalano crediti a ogni passo. Il "calpestio" si basa su un patto di fiducia e presenza fisica (Triangolo di Convalida).

*   **Fattore Hardware (Zero-IoT):** Si usano Tag fisici (NTAG424 crittografati). Nessun beacon alimentato, nessun costo vivo per l'esercente o il Comune.
*   **Fattore Spaziale (GPS):** Calcolo della tolleranza tramite la formula di Haversine, per rimediare al rimbalzo dei satelliti nei vicoli stretti dei centri storici.
*   **Ombrello B2B (I Custodi):** L'app verifica che il turista sia realmente lì. Questa garanzia (Shadow Validation / Proof of Action) è il prodotto stesso che offriamo ai Partner: traffico reale e verificato per gli obiettivi civici, senza finte recensioni o frodi, gestito in ottica "Zero-UI" per l'esercente.
