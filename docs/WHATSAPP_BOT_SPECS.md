# L.O.T.O. HUB - B2B WhatsApp Bot (Architecture & UX Specs)

Questo documento contiene le direttive ingegneristiche e di UX/Copywriting per l'Agente Dev incaricato di sviluppare il Bot WhatsApp per i partner B2B (Custodi) di L.O.T.O. HUB.

## 1. Architettura e Vincoli (WhatsApp Cloud API)
L'infrastruttura DEVE rispettare la "Regola delle 24 ore" di Meta. Poiché i report sono asincroni e avviati dal server, si **DEVONO utilizzare esclusivamente Template Message pre-approvati**.

### Stack Tecnologico:
- **Provider**: Meta WhatsApp Cloud API (o Twilio in fase di test).
- **Backend**: Supabase Edge Functions (Deno/TypeScript) + Database Webhooks.
- **Automazione**: Trigger DB per Onboarding immediato + `pg_cron` per Report giornalieri.

## 2. Flusso di Onboarding e Attivazione NFC (Il "Primo Contatto")
*Filosofia Zero-Frizione:* Il partner B2B NON deve mai eseguire configurazioni o inviare codici. L'attivazione fisica dell'NFC viene fatta sul posto dall'Operatore L.O.T.O. tramite la Dashboard Admin.

**Il Trigger di Sistema:**
Quando l'Operatore associa l'UID dell'NFC al profilo del partner nel DB (es. aggiornando la riga in `pois` e inserendo la data di `nfc_activated_at`), Supabase lancia un Webhook/Edge Function immediato che invia il Template di Benvenuto.

### TEMPLATE A: Onboarding (Benvenuto)
**Testo Approvato (con variabili Meta):**
```text
🌿 *Benvenuto in L.O.T.O. HUB, {{1}}!*
Il team ha appena attivato il tuo sensore NFC in sede. Sei ufficialmente nel nostro network.

Salva questo numero in rubrica: da oggi riceverai qui il tuo report giornaliero e i Whisper anonimi dei tuoi visitatori. 
A presto! ✨
```

## 3. Struttura dei Template di Reportistica (UX Copywriting)
Il copy deve essere estremamente conciso, elegante e orientato alla conversione (stile app tier-1).

### TEMPLATE B: Freemium (Focus: Upsell & Curiosità)
**Testo Approvato (con variabili Meta):**
```text
🌿 *L.O.T.O. HUB*
Ciao {{1}}, oggi il tuo avamposto ha generato *{{2}} interazioni* fisiche.
Hai ricevuto *{{3}} nuovi Whisper* (feedback anonimi) dai visitatori.

🔐 _Contenuto protetto. Usa il bottone qui sotto per sbloccare il piano Elite e leggere cosa pensano i turisti del tuo spazio._
```
**Bottoni Interattivi Meta:**
- [ Sblocca Premium ] -> (Invia payload "UPGRADE_REQ")

### TEMPLATE C: Premium (Focus: Valore & Ritenzione)
**Testo Approvato (con variabili Meta):**
```text
🌿 *L.O.T.O. HUB Elite*
Ciao {{1}}, il resoconto di oggi registra *{{2}} interazioni*.

Ecco cosa dicono di te gli ultimi Whisper:
💬 "{{3}}"
💬 "{{4}}"

Continua a ispirare la community. ✨
```

## 4. Gestione del Flusso di Upsell (Webhook Risposte)
**Flusso "Richiesta Premium" (Selettivo):**
1. Il partner tocca il bottone "Sblocca Premium" o scrive "Premium".
2. Il Webhook intercetta la keyword.
3. Il Bot risponde (nella finestra 24h, testo libero): *"Ottima scelta. Il team L.O.T.O. ti contatterà domani mattina per attivare il tuo piano Elite senza interrompere il tuo lavoro."*
4. Il backend logga l'alert nella tabella `admin_alerts`.
5. Nessun flusso di pagamento automatizzato via WhatsApp.

## 5. Logica del Cron Job (Ottimizzazione Query)
1. Esecuzione `pg_cron` alle 20:30.
2. JOIN tra `pois` (category='partner') e `user_pois` (`created_at > NOW() - 24h`) usando conteggi aggregati.
3. Lo script mappa i risultati e lancia richieste POST in parallelo verso Meta.

## 6. STRATEGIA RETENTION E COMMUNITY (L.O.T.O. Alpha)
**Contesto:** Per il lancio di Settembre distribuiremo l'app (APK) fuori dagli store ufficiali. C'è il rischio di perdere il contatto con gli utenti subito dopo il download (churn rate).

**Obiettivo per la Dashboard:** Costruire un modulo per gestire una "Community WhatsApp" che faccia da rete di sicurezza e canale di retention.

**Funzionalità richieste al nuovo Agente:**
- **Modulo Nodi e Custodi:** Creare una sezione nel database/dashboard per catalogare i partner fisici (Custodi dei P.O.I.) e i Nodi della rete, in modo da assegnargli ruoli o gruppi WhatsApp esclusivi (es. "Nodi+").
- **Follow-up Automatico (Bot/Link):** L'infrastruttura deve prevedere che, al primo download o al primo avvio anonimo, l'utente venga spinto (tramite pop-up nell'app o messaggio bot) a entrare in un Gruppo/Community WhatsApp ufficiale di L.O.T.O.
- **Notifiche Ibride:** Poiché Expo Go o le app non ufficiali possono avere limiti con le notifiche push native in background, la Dashboard deve prevedere l'uso della Community WhatsApp come canale principale garantito per inviare news, eventi e raccogliere i feedback dei primi Beta Tester.
