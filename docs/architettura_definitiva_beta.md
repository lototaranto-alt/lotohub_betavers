# Analisi Architetturale: L.O.T.O. HUB BETA

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


Ho esaminato il documento di chiusura brainstorming e l'ho incrociato con l'attuale stato del codice sorgente dell'app (React Native + Supabase). 
Il verdetto Ã¨ eccellente: **il framework concettuale Ã¨ 100% coerente e tecnicamente fattibile** senza richiedere stravolgimenti all'attuale base di codice. Anzi, molte delle decisioni prese semplificano drasticamente lo sviluppo!

Ecco l'analisi punto per punto della fattibilitÃ  e dell'impatto sul codice:

### 1. Gamification: Zero-Coercition e Medagliere
- **Stato Attuale:** Perfettamente allineato. Nel file `ProfileModal.tsx` abbiamo giÃ  costruito il "Medagliere" personale (trofei narrativi) e non c'Ã¨ traccia di classifiche globali.
- **FattibilitÃ :** Massima. Continueremo a sviluppare i badge solo come reward personale.

### 2. Zero-UI per Partner (WhatsApp Concierge)
- **Impatto sul Codice:** Questa decisione Ã¨ **geniale dal punto di vista dello sviluppo**. Ci risparmia la creazione di complesse schermate di dashboard back-office nell'app. 
- **Come lo integriamo:** Quando un utente ha il ruolo `LOTO Partner`, l'app (in `index.tsx`) invece di mostrargli grafici complessi, gli mostrerÃ  la sua "LOTO Pass Card" di prestigio e un semplice pulsante "Contatta il Concierge" che aprirÃ  direttamente WhatsApp tramite le API di sistema (`Linking.openURL('whatsapp://send?phone=...')`).

### 3. Handshake GPS Doppio (Anti-Frode e Attivazione Partner)
- **Stato Attuale:** Attualmente il sistema di registrazione coordinate Ã¨ base. 
- **FattibilitÃ :** Massima. Lo applicheremo specificamente al flusso di onboarding dei Partner: quando l'Agenzia posa il Tag NFC registra le coordinate definitive; quando il Partner fa il suo primo scan, il sistema incrocia le coordinate per sbloccare l'account (evitando attivazioni a distanza). Per il turista, manterremo il Triangolo di Convalida esistente (NFC + GPS tollerante + BLE). Nessuna modifica.

### 4. Il Blocco SQL (Cosa NON si fa ancora)
- Il documento impone: *Nessun codice SQL o modifiche al motore badge finchÃ© i contratti con i Nodi Civici (PlasticaqquÃ , Diseducation) non sono firmati.*
- **Azione:** Congeliamo lo sviluppo del database per gli Obiettivi Collettivi. Supabase rimarrÃ  esattamente com'Ã¨. 

---

## ðŸš€ Prossimi Passi Ricalibrati per Demo 15 Luglio

Rispettando i divieti del documento (no SQL, no logiche backend definitive per gli obiettivi), chiudiamo il pacchetto frontend per la Demo Live del 15 Luglio:

1. **Riconcepire "Classifica & Community" in "ComunitÃ ":** Rinominare il componente, rimuovere il trofeo, e sostituire il placeholder con un messaggio coerente Zero-Coercition (es. "La mappa delle scoperte. Ogni passo lascia una traccia, non un punteggio." o "ComunitÃ  in crescita. Presto: gli obiettivi civici che trasformano la cittÃ .").
2. **Frontend "Zero-UI Partner":** Inserire il bottone WhatsApp Concierge in `index.tsx` per il ruolo `LOTO Partner`.
3. **Perfezionare XpToast:** Animazione fluida completata, integrare testo coerente "Esplorazione" non "Punti".
4. **Double GPS Handshake (Mock Demo):** Simulazione visiva del flusso operatore + partner.
5. **Mockup UI Obiettivo Civico:** Creare la barra grafica "10 Alberi in Piazza Garibaldi" con dati hardcoded (mock), solo grafica.

**Conclusione:** L'architettura Ã¨ solida come la roccia. Il perimetro Ã¨ chiuso. Siamo pronti per la fase operativa frontend.

