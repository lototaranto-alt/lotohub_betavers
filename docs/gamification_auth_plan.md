# Piano Operativo: UX Gamification & Auth

Ho analizzato a fondo la tua checklist e ispezionato i file e i trigger del database. Hai fatto un'ottima radiografia dei problemi nascosti. Ecco le mie risposte e il piano d'azione per collegare tutto in modo perfetto.

## 🎯 Risposte alle tue Domande (Decisioni Strategiche)

### 1. Quale punteggio sblocca i badge? (XP vs PTI)
**La mia raccomandazione: C) Entrambi (Sistema Ibrido).**
- Attualmente hai i **PTI (`total_tokens`)** che misurano l'Impegno Civico (segnalazioni/civic_reports).
- Il check-in (NFC) che abbiamo appena creato produce **XP (`total_xp`)** che misurano l'Esplorazione.
- **Soluzione:** Scriverò un nuovo Trigger SQL sulla tabella `scans` che aggiunge gli XP al profilo a ogni check-in. Aggiornerò anche il motore dei badge in modo che sblocchi i badge della traccia *Impatto/Civica* in base ai PTI, e i badge della traccia *Esplorazione* in base agli XP.

### 2. Il nickname è obbligatorio o opzionale?
**La mia raccomandazione: C) Suggerito ma Opzionale.**
Per rispettare la tua direttiva di "Zero Friction", all'avvio mostreremo un bellissimo modale di "Battesimo" (Gamification Onboarding). L'utente può scegliere il suo nome di battaglia, ma ci sarà un pulsante elegante "Resta nell'Ombra (Salta)". Se salta, il sistema userà il fallback "Turista Anonimo".

### 3. Esiste già il file `upgrade.tsx`?
**Sì.** Ho controllato l'albero delle directory. Il file `app/upgrade.tsx` esiste già ed è pronto a fungere da ponte per la LotoPass e la monetizzazione.

---

## 🛠️ Step di Implementazione Tecnici

### STEP 1: Allineamento Database (Il Motore XP e Badge)
- Verifico il trigger di Auth (`on_auth_user_created`). Attualmente stiamo usando la versione "Bulletproof" che ho iniettato di recente, che funziona alla perfezione per inizializzare il profilo in anonimo (evita crash di RLS).
- Creazione del trigger **`award_xp_on_scan`**: Quando l'app fa INSERT in `scans` dal bottone NFC, questo trigger aumenterà i `total_xp` in `profiles`.
- Aggiornamento del trigger dei **Badge**: Controllerà le soglie (es. 50 XP = Badge Esploratore, 20 PTI = Badge Sentinella).

### STEP 2: Battesimo del Turista (Frontend)
- Creerò in `index.tsx` (o come componente globale) il `NicknameWizard` che si apre subito dopo il `MobilityWizard`, se e solo se il `nickname` nel profilo è nullo o vuoto.

### STEP 3: Il Toast delle Ricompense (Frontend)
- Rimuoverò il banale `Alert.alert("Gamification Check-in")` che abbiamo messo temporaneamente in `explore.tsx`/`index.tsx` e lo sostituirò con una vera notifica "Toast" o un banner in-app accattivante.

> [!IMPORTANT]
> Se questa architettura decisionale (Badge su due binari separati + Nickname opzionale) è in linea con la tua visione, clicca **Proceed**!
> Partirò scrivendo l'SQL per i trigger degli XP/Badge.
