# 🧹 Sfoltimento Concettuale: Verso la Documentazione Definitiva

Questo documento serve per "pulire l'argilla". Ho estratto i grandi temi dai vari documenti (Mappa concettuale, Standard Commerciale, ecc.) ed evidenziato le possibili incongruenze o le complessità teoriche. 

Per ogni blocco, dimmi cosa **teniamo**, cosa **modifichiamo** e cosa **eliminiamo (scartiamo)** definitivamente dal progetto reale.

---

## 1. Gamification: XP vs PTI
*   **Nei Documenti:** L'utente guadagna **XP** (per l'esplorazione turistica) e **PTI - Punti Transizione Intelligente** (per le azioni civiche).
*   **Il Dubbio:** Manteniamo due valute separate nel database e nell'interfaccia, oppure abbiamo semplificato tutto sotto un'unica voce (es. solo XP o solo "Tokens")? 
> [!IMPORTANT]
> **Teniamo la doppia valuta (XP + PTI) o unifichiamo?**

## 2. Il Triangolo di Convalida (Anti-Spoofing)
*   **Nei Documenti:** Per certificare la Proof of Action il sistema usa tre fattori: 1. Scansione NFC/QR; 2. Controllo GPS (Haversine); 3. **Scansione Bluetooth (BLE)** in background per misurare l'affollamento (Proxy Ambientale).
*   **Il Dubbio:** Il controllo Bluetooth (BLE) aggiunge molta complessità e richiede permessi invasivi. Era un concept teorico o vogliamo davvero implementarlo nell'app finale?
> [!IMPORTANT]
> **Eliminiamo il controllo Bluetooth e teniamo solo GPS + QR/NFC?**

## 3. Gestione Esercenti: WhatsApp Bot e "I 3 Custodi"
*   **Nei Documenti:** Gli esercenti non hanno nessuna interfaccia web. Fanno tutto tramite un **Bot WhatsApp** (ricarica Wallet, push "Boost", lettura recensioni). Inoltre, vale la "Regola dei 3 Custodi" (massimo 3 partner per finanziare un obiettivo civico).
*   **Il Dubbio:** Il controllo totale via WhatsApp è la via definitiva? La regola dei 3 custodi rimane attiva a livello di database?
> [!IMPORTANT]
> **Confermiamo la gestione 100% via WhatsApp e la regola dei 3 Custodi?**

## 4. Hardware: NTAG424 vs Assenza NFC
*   **Nei Documenti:** Si parla di adesivi fisici NFC crittografati sul territorio.
*   **Nei tuoi messaggi:** Hai detto "spiegati perche usa qr quando non c'è nfc all'utente quale è il focus".
*   **La Sintesi Proposta:** Il tag fisico ha ENTRAMBI: chip NFC e QR Code stampato. L'app offre lo scanner unificato, l'utente usa quello che supporta il suo telefono.
> [!IMPORTANT]
> **È questa la sintesi hardware definitiva?**

## 5. UI: Sblocchi Progressivi e "Crea Percorso"
*   **Nei Documenti:** Il Livello 2 sblocca gli "Eventi", il Livello 3 sblocca "Crea Percorso".
*   **Nei tuoi messaggi:** Hai detto che la scheda "Crea Percorso" nel Diario non funziona e ha un equivalente sulla Mappa.
*   **Il Dubbio:** Eliminiamo definitivamente la scheda "Crea Percorso" dal Diario per snellire l'app e gestiamo la creazione itinerari solo dalla Mappa esplorativa?
> [!IMPORTANT]
> **Rimuoviamo "Crea Percorso" dal Diario?**

---

### Come procedere
Rispondimi punto per punto (es. "1: Unifichiamo in XP", "2: Elimina Bluetooth", ecc.). Una volta sfoltiti questi dubbi, i tuoi documenti diventeranno una guida infallibile e precisa per l'intera architettura.
