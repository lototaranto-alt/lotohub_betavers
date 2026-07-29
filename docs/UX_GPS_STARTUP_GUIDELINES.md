# LOTO Ecosystem - Technical Note: GPS & Primo Avvio

**Destinatario:** AI Design / UI / UX Team (Chat Parallela)
**Contesto:** Gestione dell'esperienza utente al primo avvio (Onboarding) e gestione degli stati di assenza di segnale GPS / Permessi negati.

---

## 1. Architettura Attuale (Backend/Frontend)
Attualmente, l'app richiede in automatico i permessi Foreground all'avvio. La gestione del GPS e del Geofencing in background (necessari per l'accumulo di LOTO PTI e il modulo Cinematico Anti-Spoofing) è legata al modulo `expo-location` e al `TaskManager`.

- **Crash Prevenuti:** Il codice frontend intercetta gli errori di `promise id 0` (quando i servizi di localizzazione di sistema sono fisicamente spenti). L'app **non va in crash**, ma si avvia in modalità degradata (Fallback).
- **Fallback Mappa:** In assenza di GPS, la mappa viene renderizzata ma viene centrata automaticamente sulle coordinate di default del Tenant (es. Centro di Taranto) invece che sulla posizione dell'utente.

## 2. Lo Stato del Problema (La Sfida UX)
Al momento l'app si comporta così se l'utente entra con il GPS spento:
1. Mappa vuota (nessun indicatore utente blu, centrata sul Tenant).
2. Viene lanciato un pop-up nativo (Alert di sistema) chiamato "Ottieni il massimo da L.O.T.O.", che invita gentilmente ad attivare la localizzazione. 

**Obiettivo per il Design Team:**
Sostituire o accompagnare questo comportamento con un'esperienza visiva "Boutique" e meno intrusiva. Il pop-up di sistema è funzionale ma poco elegante.

## 3. Direttive e Concept Richiesti
Si richiede di progettare i seguenti elementi visivi / UX:

### A. "Empty State" Mappa (Boutique Message)
Se la mappa si carica ma il segnale GPS manca, progettare un overlay grafico o una "card" fluttuante sulla mappa.
- **Tone of voice:** Gentile, premium (stile LOTO Boutique).
- **Esempio di copy:** *"Non riusciamo a trovarti. Attiva il GPS per esplorare L.O.T.O."*
- **Azione:** Un bottone elegante per richiamare le impostazioni o triggerare nuovamente la richiesta permessi.

### B. Posizionamento Interruttore Sensori
- Attualmente l'interruttore manuale per accendere/spegnere i "Sensori in Background (LOTO PTI)" è stato spostato nella sezione **"Privacy e Dati (DaaS)"** del menu Impostazioni, per rispettare pienamente il GDPR.
- **Task:** Valutare se l'interruttore necessita di un proprio pannello dedicato ("Hub Sensori") o se va bene mantenerlo integrato nella Privacy.

### C. Check-in NFC (Zero-Click Scenario)
Tenere a mente per l'onboarding che l'NFC **non ha bottoni nell'app**. Lo scenario è un profondo "Deep Link":
- Utente si avvicina al P.O.I. col telefono sbloccato.
- Il chip NFC risveglia l'app e lancia un URL interno.
- La UI deve prevedere solo un'animazione di "Match completato" o "Check-in confermato" che compare in overlay.

---
*Nota per l'AI Design: Non ipotizzare modifiche tecniche ai permessi nativi o ad `expo-location`. Focus unicamente su Layout, Copyscript, Colori e Micro-interazioni (Gestione dell'Empty State).*
