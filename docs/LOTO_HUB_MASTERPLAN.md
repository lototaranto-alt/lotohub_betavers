# 📘 L.O.T.O. HUB — BLUEPRINT & MASTERPLAN
**Stato:** 🟢 Congelato e Operativo.

Questo documento è la Bibbia architetturale del progetto L.O.T.O. HUB Beta. Contiene la sintesi di tutte le logiche di business approvate, il modello dati, le specifiche UI/UX e i task di sviluppo futuri (da sbloccare dopo la firma dei contratti).

---

## 1. VISIONE E MODELLO
**Payoff:** *L.O.T.O. HUB — The Co-Xperience Engine*
Il progetto è una piattaforma per Co-Esperienze Territoriali con un modello economico **Zero-Frode**:
- Nessuna trattenuta sulle donazioni.
- Monetizzazione via SaaS/DaaS futuri (vendita dati aggregati e report ESG a PA ed Enti).
- Impatto Civico generato direttamente dai flussi turistici ("Rigenerazione dal Basso").

## 2. PILASTRI ARCHITETTURALI
### 2.1 Zero-UI per Partner
Per abbattere l'attrito tecnologico dei commercianti e gestori, l'app *non* contiene dashboard complesse.
- **Turista:** Interfaccia completa, mappa, XP, NFC, Diario.
- **Partner / Custode Locale:** Quando loggato, vede la sua "Prestige Card" (LOTO Pass) e utilizza un **Concierge WhatsApp** integrato (un pulsante apre direttamente la chat con l'Agency per supporto, fatturazione e richieste).

### 2.2 Gamification Inversa & Anti-Tossicità
- **No Leaderboard Pubbliche:** Nessuna classifica. Nessuna competizione tra utenti.
- **Medagliere (Achievement):** Un pannello privato nel "LOTO Pass" dove gli utenti collezionano trofei narrativi legati a percorsi culturali ed etici.
- **XpToast:** Animazione gamificata ("stile Xbox") in app al momento della scansione per premiare l'esplorazione.

### 2.3 Sicurezza e Zero-Frode (Attivazione Partner)
- **Doppio Handshake GPS (Onboarding):** La vera sicurezza anti-frode interviene all'attivazione di un nuovo Partner. 
  1. *Scan Operatore:* Il nostro operatore (Agency) va sul posto, posa il Segno (Tag NFC) e fa un primo scan di registrazione. Il Database salva le coordinate GPS del luogo in quel preciso istante.
  2. *Scan Partner:* Il proprietario del locale fa il suo primo scan sul Tag. Il sistema verifica se le coordinate del Partner combaciano con quelle registrate dall'operatore. Se c'è il match (Doppio Handshake completato), il Partner viene attivato, ottiene il suo ID sicuro e sblocca l'accesso al Concierge WhatsApp.
- **Turisti:** Per i turisti, si applica un controllo di prossimità più leggero rispetto alle coordinate del P.O.I.
- **NTAG424:** Criptografia hardware sui tag fisici per evitare la clonazione degli URL.

---

## 3. LOGICHE DI BUSINESS: L'IMPATTO COLLETTIVO
Il "Motore Circolare dell'Impatto" guida l'economia dell'app.

1. **Esplorazione Turistica:** Il turista esplora e fa "Rileva Passaggio" sui P.O.I. culturali, ottenendo **XP (Esperienza)** per sé (per sbloccare storie e medaglie).
2. **Azione Civica:** Partecipando a eventi o scansionando Nodi Civici, l'utente ottiene **PTI (Loto Punti)**.
3. **Riempimento Barra Civica:** Sono esclusivamente i **PTI** (non l'XP) a riempire direttamente la **Barra di Progresso Pubblica** (es. "Piantumazione 10 Alberi").
4. **Reward Finale:** Al completamento, il Nodo Civico riceve i fondi/materiali. I turisti che hanno partecipato (versando i loro PTI) ricevono un Badge speciale ("Custode di Piazza Garibaldi").

---

## 4. DIVISIONE TASK (Fase Post-Contratti)
I seguenti Task vanno avviati *esclusivamente* dopo l'ufficializzazione degli accordi con i Nodi Civici.

### SPRINT A: Motore Impatto Collettivo (Database)
- [ ] Creazione tabella `civic_goals` (id, title, description, target_points, current_points, sponsor_id, status).
- [ ] Creazione tabella `user_goal_contributions` (user_id, goal_id, points_contributed).
- [ ] Aggiornamento del trigger SQL `tr_handle_discovery_and_xp`: aggiungere la logica che intercetta i P.O.I. con moltiplicatore e fa l'UPDATE di `current_points` nel `civic_goal` attivo.

### SPRINT B: Frontend Obiettivi Civici (App UI)
- [ ] Creazione componente `CivicProgressBar.tsx` (Barra riempitiva globale).
- [ ] Inserimento della Barra Civica nella `index.tsx` (Home).
- [ ] Aggiornamento animazione: quando `XpToast` scompare, le particelle viaggiano verso la Barra Civica.
- [ ] Aggiunta del campo `sponsor_logo` nel frontend per dare visibilità etica all'azienda co-finanziatrice.

### SPRINT C: Nodi Civici e Validazione sul Campo
- [ ] Distribuzione dei Segni del Luogo fisici (NFC) a *Diseducation* e *TGT/Plasticaqquà*.
- [ ] Attivazione degli account Custodi per i referenti e test del pulsante "WhatsApp Concierge".
- [ ] Test sul campo del **Doppio Handshake GPS** nei vicoli del centro storico (dove il segnale rimbalza) per tarare la sensibilità del blocco spoofing.

---

**DOCUMENTO APPROVATO E CONGELATO.**
*Pronto per il passaggio di consegne al team di sviluppo per le Fasi di Scale-Up.*
