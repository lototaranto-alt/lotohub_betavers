# ðŸ§¿ L.O.T.O. HUB - MASTER SSOT (Single Source of Truth)

> ## ARCHIVIO. Documento storico, non e' fonte di autorita'.
>
> **Demotato il 30/09/2026.** Questo file si dichiarava definitivo e si contendeva l'architettura del
> sistema con altri tre. E' stato letto riga per riga e confrontato con il codice.
>
> Il testo originale e' integro qui sotto, per il confronto. **Se il contenuto contraddice
> l'architettura attuale, vale l'architettura attuale.**
>
> **File che dice il vero:** `docs_v2/loto-hub-architettura-sistema-master-2026.md`
> **Registro di autorita':** `docs_v2/tooling/autorita.json`
> **Le 5 affermazioni non implementate:** sezione 5 del file canonico.


Questo documento rappresenta la conformazione *definitiva* dell'app L.O.T.O. HUB, ottenuta triangolando i documenti di design, le direttive AGENT, e il lavoro di sviluppo reale. Sostituisce e invalida qualsiasi Master Brief precedente in caso di contraddizioni.

---

## 1. Identificazione e Backup (Il Compromesso Perfetto)
Contrariamente alle vecchie direttive "Zero-PII Assolute", l'app adotta un approccio **Ibrido e Inclusivo** per abbattere le frizioni d'ingresso senza alienare l'utenza tradizionale. La regola d'oro Ã¨ l'**Unificazione del Dato**: non ci sono tabelle separate tra utenti anonimi e registrati.

*   **Accesso "Download & Play":** L'utente scarica l'app ed entra in modo totalmente anonimo istantaneamente (Generazione UUID fantasma). Il suo profilo e tutti i suoi check-in (inviati direttamente alla tabella `esg_raw_logs` su Supabase) sono giÃ  reali e consolidati nel sistema.
*   **Messa in Sicurezza del Profilo (Backup):** Quando l'utente decide di salvare i progressi, *non migra dati nÃ© cambia tabella*. Associa semplicemente un metodo di recupero al suo UUID fantasma esistente. Ha due opzioni paritarie:
    *   *Opzione A (L.O.T.O. Pass):* Generazione di un QR Code e numero univoco. Totalmente anonimo (Niente PII). **Nota: L'app possiede un lettore QR dedicato esclusivamente al ripristino dell'utente**, che ha una logica totalmente separata dallo scanner usato per i luoghi.
    *   *Opzione B (Tradizionale):* Modulo classico con Email e Password, appoggiato a Supabase Auth. (Questa via garantisce l'usabilitÃ  per l'utenza meno tech-savvy).

---

## 2. Gamification e Valute (Calcolo Lato Server)
Nessun calcolo pesante sul telefono dell'utente. Il client Ã¨ leggero.

*   **XP (Esperienza):** Usata per sbloccare i contenuti della Vetrina Culturale P.O.I. (Progressive Disclosure).
*   **Token PTI (Punti Transizione Intelligente):** Token civico usato per le donazioni e l'impatto collettivo. Non viene speso per la cosmesi.
*   **Motore DB:** La funzione PostgreSQL `process_esg_impact` (RPC) su Supabase elabora i log grezzi e aggiorna i saldi in modo sicuro, impedendo frodi o cheat lato client.

---

## 3. Triangolo di Convalida (Proof of Action & Zero-IoT)
L'ecosistema non richiede hardware costoso alimentato.

*   **Segni del Luogo (NFC + QR per Check-in):** Adesivi passivi sul territorio. L'app usa uno Scanner Unificato (diverso da quello del login) capace di leggere sia l'NFC (NTAG424 crittografato) sia il QR Code del luogo (fallback). L'innesco hardware (Tap) elimina il wizard manuale "Party Size" rimuovendo attriti UI.
*   **GPS e Haversine:** La formula matematica su Supabase tollera i "rimbalzi" satellitari nei vicoli storici (es. tolleranza 50m) e blocca i cheat vettoriali (es. spostamenti superiori a 130 km/h).
*   **La Formula Generativa BLE (Dato Convalidato vs Dato Predittivo):** Il Tap hardware innesca una potente architettura di sdoppiamento del dato tramite una micro-scansione BLE in foreground di **5 secondi** (`utils/bleManager.ts:11`, confermato dall'utente il 2026-09-29: i 3 secondi che comparivano qui erano sbagliati).
    *   *Il Dato Primario (Certificato):* Lo scan fisico NFC certifica in modo assoluto l'azione dell'utente e genera il record nella Tabella Primaria del dato ESG da vendere (la "Proof of Action" inconfutabile).
    *   *Filtro Dispositivi Locali:* Durante i 5 secondi, l'algoritmo analizza i segnali e scarta i dispositivi statici (l'hardware fisso del locale o del vicinato) per proteggere la purezza del campione.
    *   *Il Dato Predittivo (Moltiplicatore Proxy):* I dispositivi dinamici rimanenti passano attraverso una formula statistica (media device per utente). Questo calcola il volume predittivo della folla, che va a popolare una **Seconda Tabella** (o colonna) coesistente nel DB. Ãˆ proprio questo dato predittivo che alimenta visivamente la mappa di calore (Heatmap) direttamente in-app.
    *   âš ï¸ **Correzione 2026-09-29:** la "media device per utente" qui descritta **non Ã¨** quella implementata. Il codice conta i device sotto il quorum (`utils/bleManager.ts:124-128`); non calcola alcuna media. E la "Seconda Tabella" Ã¨ `crowd_predictions`, che **non ha un `CREATE TABLE` in nessuna migration nÃ© in nessuno dei 63 export**. Formula completa e difetti in [`FORMULE-PROPRIETARIE.md`](../docs_v2/FORMULE-PROPRIETARIE.md).

---

## 4. Ecosistema Civico e Modello B2B2G (DaaS & Cold Start)
Il modello non si basa su sconti o coupon, ma sul **Mecenatismo Civico** e sulla "Gamification Inversa". Il turismo smette di consumare il territorio e inizia a rigenerarlo.

*   **Il Nodo Civico (Associazioni):** Ãˆ il punto di partenza dell'MVP. L.O.T.O. si allea con un'associazione locale (es. per ripulire una spiaggia) e definisce un micro-intervento con un budget preciso.
*   **I Custodi (Partner B2B):** Rivolto a tutti i partner, ma con un limite di massimo 3 attivitÃ  commerciali che possono finanziare un singolo obiettivo civico, ottenendo il titolo esclusivo di "Custodi". Accumulano **Badge dedicati** che danno lustro e fanno parlare di loro nella community (future evoluzioni si svilupperanno con i nodi civici).
*   **La Barra Civica (Gamification Protetta):** Quando il turista esplora eventi della community e certifica la sua presenza presso i P.O.I. e i Custodi, guadagna Token Civici (PTI) che riempiono la **Barra Civica** pubblica. Al completamento, si innesca il finanziamento per il micro-intervento.
    *   *Eventi Temporanei (Luogo X):* Per eventi in zone non mappate stabilmente, vengono posizionati 1 o 2 Tag NFC fisici (anche duplicati per smaltire le code) che seguono le stesse logiche di validazione, permettendo al sistema di funzionare ovunque.
*   **Handshake GPS (Zero-UI per i Partner):** L'attivazione dei Partner avviene sul campo stringendo la mano e scansionando il Tag NFC incrociando i GPS (Admin + Partner). Tutta la successiva gestione avviene tramite WhatsApp. Nessuna dashboard.

### Il Motore DaaS, l'Offuscamento e i Report ESG
Questa "macchina generatrice di dati" permette a L.O.T.O. HUB di esportare automaticamente tre tipologie di Report ESG, basati su Materialized Views (es. `daas_anonymous_mobility_features`), garantendo il 100% di conformitÃ  GDPR:

1.  **Report di Decongestione (Per la PA):** Sfruttando la Heatmap Predittiva, genera report sui flussi turistici, indicando i "colli di bottiglia" urbani e l'efficacia delle politiche di deviazione del traffico.
2.  **Report di Impatto Civico (Per i Custodi/Esercenti):** Quantifica il Mecenatismo. Certifica esattamente quanti Token (PTI) sono stati generati dal traffico presso un esercente e li traduce in "Impatto Reale" (es. "Hai finanziato la pulizia di 500mq di litorale"). Ãˆ l'asset perfetto per il bilancio di sostenibilitÃ  aziendale (Certificazione ESG).
3.  **Report di Attivazione (Per le Associazioni):** Misura l'affluenza fisica e certificata (tramite scan hardware) agli eventi temporanei della community.

*   **L'Offuscamento Matematico (La base dei Report):** 
    *   *Grid Spaziale:* Troncamento delle coordinate via `ST_SnapToGrid` su celle rigide di 110 metri.
    *   *Time-Bucketing:* Arrotondamento dei timestamp a scaglioni di 15 minuti.
*   **Heatmap Predittiva (Dalla Scansione alla Mappa):** Il dato predittivo generato dal filtro BLE (Tap NFC diviso per la media statistica dei device) va a popolare direttamente la Seconda Tabella dedicata alla Mappa di Calore turistica, risolvendo istantaneamente il problema del "Cold Start".
*   **Decadimento Temporale:** Il calore visivo sulla Heatmap degrada progressivamente nel tempo, sfumando a zero dopo una finestra fissa di 45 minuti dal check-in.

