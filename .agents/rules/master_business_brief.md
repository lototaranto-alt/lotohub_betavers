# 🌐 MASTER BRIEF: L.O.T.O. HUB (Allineamento IA Commerciale & Amministrativa)

*(Copia questo testo e incollalo all'inizio di qualsiasi nuova chat Gemini dedicata alla creazione di Slide, Business Plan, Contratti o Marketing).*

---

## 1. IDENTITÀ DEL PROGETTO
**Nome:** L.O.T.O. HUB
**Definizione:** Piattaforma SaaS B2B2G "White-Label" per le Smart Cities. 
**Modello Operativo:** L.O.T.O. HUB è un ecosistema che gamifica il turismo sostenibile. Trasforma ogni spostamento "green" del turista in un'esperienza di gioco (per l'utente) e in un dato statistico prezioso per la governance urbana (per il Comune).
**L'Oceano Blu (TSaaSI):** Abbiamo coniato il paradigma "Tourism Sustainable as a Service Institutional". A differenza dei competitor che offrono hardware costoso (sensori IoT) o si focalizzano sul pendolarismo casa-lavoro (es. MUV), noi offriamo un servizio turistico-culturale senza costi di infrastruttura.

## 2. L'INFRASTRUTTURA TECNOLOGICA (CONSOLIDATA E RESILIENTE)
L'architettura del software è progettata per resistere a carichi anomali e zone d'ombra di rete:
*   **App "Camaleonte" (Zero IoT):** Un'unica applicazione universale (React Native) che cambia veste grafica, logo e contenuti in base ai confini GPS in cui entra l'utente, stabilizzata da un **Timer di Isteresi spaziale di 5 minuti** per evitare l'effetto 'ping-pong' sui confini urbani.
*   **Zero-PII & Privacy Assoluta:** L'app non chiede MAI email o nomi. Il login è anonimo e invisibile. Il Backup (L.O.T.O. Pass) è un QR Code salvato in Galleria.
*   **Optimistic UI & Offline First:** Ideale per centri storici e musei (dove la rete cade). Le transazioni di sblocco avvengono istantaneamente sulla UI, e se manca rete, un `OfflineQueueManager` scarica i contenuti in background non appena il segnale ritorna, evitando frustranti blocchi dell'interfaccia.

## 3. IL MOTORE ECONOMICO E LE DIFESE ANTI-FRODE
Il business si regge su uno scambio di valore "Win-Win-Win" super-protetto:
*   **Per il Turista (Gamification Protetta):** Visita i POI e scansiona **Tag NFC Criptati (NTAG424)**. Sottolineiamo sempre che questi tag sono letteralmente *"adesivi a bassissimo costo"* da applicare in giro per la città. Questo blinda in modo assoluto la percezione del modello "Zero IoT" (nessun hardware costoso da mantenere per il Comune). La crittografia impedisce la clonazione dei tag e il "Replay Attack" da casa. Inoltre, un **trigger Anti-Cheat** sul database blocca i check-in se la velocità GPS supera i 130 km/h (blocco finti GPS).
*   **Shadow Validation (Zero Costi API):** Per calcolare la CO2 evitata senza dissanguare le finanze aziendali con API a pagamento, usiamo un algoritmo interno basato su coefficienti statici (ISPRA/DEFRA). Solo l'1% delle transazioni viene campionato contro le API esterne per validazione, annientando i costi operativi (COGS) mantenendo l'autorevolezza scientifica contro il greenwashing.
*   **Per la PA / Comuni (DaaS):** L.O.T.O. Hub fornisce "Heatmap" generate tramite Materialized Views che aggregano le posizioni su **griglie fisiche di 110 metri e blocchi temporali di 15 minuti**, garantendo l'impossibilità matematica di tracciare il singolo e una compliance GDPR al 100%. **Punto Vendita Cruciale:** Questo DaaS serve concretamente alla PA per *gestire e deflazionare il flusso turistico*, spalmando l'economia municipale in modo uniforme e decongestionando i punti iper-affollati. L'app usa i dati per ridirigere le persone verso partner (B2B) in aree meno note della città.

## 4. SICUREZZA, INCLUSIVITÀ E UTILITÀ CIVICA
*   **Panic Mode & Routing di Sicurezza:** Fornisce ai crocieristi e turisti percorsi di rientro "Safe & Fast" verso la Nave/Hotel in caso di ritardi.
*   **Accessibilità (Soft-sorting ♿):** Il sistema ri-priorizza l'esplorazione mettendo in guardia sulle barriere architettoniche senza frustrare la scoperta.

## 5. OBIETTIVO ATTUALE (MVP & Go-To-Market)
Abbiamo congelato le funzionalità iper-complesse (come i calcoli calorici o validazioni AI in tempo reale) per adottare un approccio **Lean**. L'obiettivo è lanciare il Prototipo Finale negli Store su **Taranto (Giochi del Mediterraneo 2026)** da usare come dimostratore fisico per siglare partnership commerciali. 
**Disclaimer IA (SCUDO):** Nelle simulazioni di Business Plan, ricorda sempre di basarti su questo MVP. Evita le allucinazioni: NON inserire costi operativi fittizi (COGS) per chiamate API costose, perché l'MVP lavora con validazione "Shadow" interna e Zero-IoT, abbattendo radicalmente le uscite di bilancio.

---
**Istruzione per l'IA:** *Hai appena acquisito l'infrastruttura completa e la strategia commerciale di L.O.T.O. Hub. Da questo momento, adatta le tue risposte (Pitch, Slide, Business Plan) esattamente a questo paradigma.*
