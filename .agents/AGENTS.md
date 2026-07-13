# L.O.T.O. HUB - L'Enciclopedia dell'Ecosistema (Agent System Rules)

Benvenuto, Agente. Se stai leggendo questo documento, sei stato appena attivato nel workspace del progetto **L.O.T.O. HUB (Sentient Urban Matrix)**. 
Questo file è il tuo database centrale e la tua bussola. Contiene i principi fondamentali, l'architettura logica e i vincoli invalicabili di questo ecosistema. Devi interiorizzare queste regole e non contraddirle mai durante le tue operazioni di codifica, scrittura testi o progettazione UI.

---

## 1. LA FILOSOFIA: "Eco-Boutique" e "Zero-Friction"
L.O.T.O. HUB non è un'app di tracking o un banale social network. È un hub di rigenerazione urbana e gamification progettato per trasformare i cittadini (e i turisti) in *Sea Lovers* e custodi del territorio (es. Taranto).
- **Eco-Boutique:** Il design e il tono di voce devono essere eleganti, misteriosi, poetici e premium. L'ambiente è curato come una boutique, non come un videogioco arcade.
- **Zero-Friction / Zero-Coercion:** L'utente non deve MAI sentirsi forzato o bloccato da interfacce complesse. Ad esempio, la lingua si imposta automaticamente (i18n tramite sistema nativo), non ci sono login forzati invadenti al primo avvio, e l'esplorazione deve essere fluida.

---

## 2. L'ECONOMIA DUALE (Il Vincolo Più Importante)
L'ecosistema si basa su due valute parallele che non si incrociano mai:
- **XP (Esperienza):** È la metrica EGOISTICA / PERSONALE. Si accumula esplorando i P.O.I. Turistici e fisici tramite scan NFC/QR. L'XP serve per:
  - Salire di livello (Livelli 1-50).
  - Sbloccare i "Whisper" narrativi.
  - Sbloccare i contenuti digitali del Vault (Progressive Disclosure).
  - Evolvere il proprio Frame Avatar.
- **PTI (Punti Transizione Intelligente / Loto Punti):** È la metrica ALTRUISTICA / COLLETTIVA. Si accumula tramite azioni civiche (es. volontariato, pulizia spiagge con Plasticaqquà). I PTI servono per:
  - Riempire la Barra Civica Globale nella Civic Dashboard.
  - Finanziamento di progetti reali (es. piantare alberi).
- **⚠️ REGOLA DI FERRO:** Non scrivere MAI, in nessun frammento di codice o testo narrativo, che l'utente usa i PTI per salire di livello, o che spende PTI per comprare qualcosa. I PTI si donano alla città. L'XP fa salire di livello.

---

## 3. LA GAMIFICATION (Livelli, Tier e Badge)
L.O.T.O. HUB implementa una curva di livellamento gratificante e stratificata.
- **Struttura Lineare:** Esistono 50 livelli, divisi in 5 Tier (Tracce Tematiche) da 10 livelli ciascuno:
  1. *Tier 1 (Livelli 1-10):* Il Risveglio del Seme (Terra / Onboarding). Fast-track: richiede pochissimi XP per dare gratificazione immediata.
  2. *Tier 2 (Livelli 11-20):* Le Radici Sommerse (Acqua).
  3. *Tier 3 (Livelli 21-30):* La Linfa Vitale (Comunità / Biodiversità).
  4. *Tier 4 (Livelli 31-40):* Il Respiro Urbano (Aria / Mobilità Dolce).
  5. *Tier 5 (Livelli 41-50):* La Fioritura del Loto (Sintesi / Illuminazione).
- **Niente Prestigio:** Il livello 50 è l'endgame. Non esiste alcun sistema di "Prestige Reset". Non esistono trame ramificate.
- **I Badge Tematici:** Quando l'utente sblocca dei traguardi, riceve medaglie tematiche come *Badge Sentinella (Verde)*, *Esploratore (Blu)*, *Custode (Viola)*.
- **⚠️ REGOLA DI FERRO:** È severamente vietato l'uso di gerarchie metalliche classiche ("Bronzo", "Argento", "Oro"). Non nominarle mai.

---

## 4. LE FUNZIONALITÀ PRINCIPALI (L'Arsenale)
Quando sviluppi nuove feature, ricordati di integrarle con i pilastri esistenti:
- **La Mappa e lo Scan:** Il momento del "Tap" (NFC o QR) è il cuore dell'interazione fisica. Risveglia l'app e genera XP o PTI in base al tipo di nodo.
- **Civic Dashboard (Eventi):** Il cuore dell'attivismo. Qui gli utenti vedono gli eventi locali, la barra di progresso civica alimentata dai PTI, e il contatore della CO2 risparmiata.
- **Vault Digitale (P.O.I.):** I luoghi storici (es. Castello Aragonese) offrono contenuti multimediali (Audio, Testi, 3D). I contenuti base hanno lucchetti del tipo *"Sblocca al Livello X"*. I contenuti esclusivi sono contrassegnati come *"Premium"*.
- **Crea Percorso (La funzione "DOLCE"):** Una feature di routing che permette all'utente di disegnare itinerari (per evitare le folle o cercare zone verdi). La modalità "DOLCE" è un toggle dell'interfaccia (mobilità lenta a impatto zero), NON è un percorso narrativo.

---

## 5. REQUISITI TECNICI E STILE DEL CODICE
- **Stack:** Expo / React Native per il frontend, Supabase (PostgreSQL, Auth) per il backend.
- **Componenti React:** Usa componenti funzionali e Hooks (`useState`, `useEffect`). Sfrutta il `ThemeContext` per gestire i colori dinamicamente.
- **Design System:** Usa Glassmorphism (sfocature, trasparenze). Evita colori primari banali (rosso, blu, verde puro). Usa gradienti eleganti, ombre morbide, e micro-animazioni (Spring animations) per dare vita ai popup e ai bottoni. L'app deve sembrare "viva".
- **Database:** Tutte le logiche proprietarie di distribuzione punti (es. trigger in SQL che assegnano XP o PTI) sono gestite e blindate lato backend su Supabase per evitare cheating.

---

## MANTENERE LA PROMESSA
Il tuo scopo, Agente, è mantenere incontaminata questa visione. Qualsiasi suggerimento, snippet di codice o contenuto generato da te deve essere allineato al 100% con queste regole. Se l'utente ti chiede di inserire una "Medaglia d'Oro" o di "pagare in PTI per sbloccare un video", devi correggere la rotta ricordando le direttive di questo documento. Buon lavoro.
