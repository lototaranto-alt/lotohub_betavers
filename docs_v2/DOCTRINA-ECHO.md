---
id: DOCTRINA-ECHO
tipo: analisi
ambito: dottrina-feedback-privato-del-partner
stato: Vivente
confidenza: Alta
owner: utente
aggiornato: 2026-09-26
evidenza:
  - supabase/migrations/20260822_create_b2b_feedbacks.sql:5
  - supabase/00_SETUP_ADMIN_DASHBOARD.sql:47
  - .agents/AGENTS.md:20
---

# La dottrina Echo: il feedback privato che il partner sbloccola col Premium

> Risponde a: "il divieto di recensioni pubblici e la tabella `b2b_feedbacks` con `rating` e
> `comment` sono in contraddizione?"

**No. Non lo sono.** Io avevo sbagliato a leggerli come un conflitto, e la correzione e' registrata
qui perche' il modo sbagliato di leggerlo ricomincia.

---

## 1. La distinzione che manca

Il progetto vieta una cosa sola, con un nome preciso: la **recensione pubblica** fra utenti, quella
che mette un utente nella posizione di giudicare un altro e che può essere letta da chiunque.
`AGENTS.md` §4 lo dice: *"Users cannot leave public reviews to avoid TripAdvisor-style toxicity.
They leave anonymous Whispers that only the B2B partner can read."*

La parola chiave e' **only the B2B partner can read**. Il divieto riguarda la **pubblicazione**,
non il **feedback**.

| | Feedback pubblico (vietato) | Echo privato (previsto) |
|---|---|---|
| Chi lo lascia | qualunque utente su qualunque POI | un utente che ha visitato il POI del partner |
| Chi lo legge | chiunque, anche i concorrenti | **solo il partner proprietario del POI** |
| Effetto sul partner | danno commerciale: recensioni negative che lui non puo' rimuovere | **conversione**: vede la domanda e la sblocca |
| Esistenza | bandito per scelta architetturale | **implementato in tabella** |

Quindi le colonne `rating` e `comment` di `b2b_feedbacks` **non sono un relitto**: sono il prodotto.
La colonna `is_premium_unlocked` esiste perche' il partner **deve poter passare da Freemium a
Premium per leggere cio' che gli utenti hanno scritto**. E' il funnel di vendita a S2, e funziona
solo se il partner ha un motivo per pagare.

## 2. La regola dei tre livelli

E' questa la dottrina operativa, e la ricostruisco dai documenti e dallo schema:

**Livello 1 — l'utente scrive, il partner non vede**
L'utente visita il POI, lascia un punteggio e un commento. Il commento finisce in tabella.
Il partner Freemium vede solo il **conteggio**, non il testo. Motivo: il testo e' la moneta.

**Livello 2 — il partner sblocca col Premium**
`is_premium_unlocked = true` fa comparire il testo al partner. E' l'acquisto: "500 Crediti - 50 EUR",
"1200 Crediti - 100 EUR" secondo i listini del progetto.

**Livello 3 — gli altri utenti non possono commentare**
Un altro utente che visita lo stesso POI **non puo' rispondere** a quel commento. Puo' solo
toccare la **Risonanza**, un kudos aptico con push all'autore (meccanismo preso da Strava).
Questo e' il livello che chiude il cerchio e rende il sistema non tossico per costruzione, non per
moderazione.

**Il risultato:** esiste un tasso di conversione misurabile — quanti partner passano da Freemium a
Premium **leggendo i feedback oscurati**. E' l'unico funnel di upsell dell'app, ed e' interamente
privato.

## 3. Perche' regge il filtro Zero-UI

`AGENTS.md` §5 impone al partner B2B di non avere interfacce complesse: il bot WhatsApp. Il vincolo
sembra in conflitto con "il partner deve sbloccare i feedback per pagare".

**Si risolve cosi':** il Premium non richiede un portale. Richiede al massimo un messaggio WhatsApp
con il link di sblocco, e la lettura avviene dove gia' riceve i suoi dati. La dashboard admin
(LOTO MAP admin) **non e' il cruscotto del partner**: e' lo strumento tuo per monitorare il sistema.
Confondere le due cose e' l'errore da evitare, perche' porta a costruire un'area operativi per
l'esercente che il progetto ha escluso.

## 4. Cosa resta incoerente davvero

Corretta la dottrina, rimangono tre cose concrete, non filosofiche:

| Incoerenza | Stato |
|---|---|
| `is_premium_unlocked` **non ha schermo**: il partner non ha dove leggere | aperto |
| Il **canale** per sbloccare: WhatsApp o dashboard? Non deciso | aperto (`DECISIONI.md` D13) |
| Se il partner Premium ha accesso **continuo** o **a richiesta** (per non tenere la tariffa attiva)? | aperto (`DECISIONI.md` D13) |

## 5. Cosa questo documento insegna al modello

**Una divergenza fra documentazione e codice non e' automaticamente un errore di uno dei due.**
Puo' essere che io abbia letto male la dottrina. Il modello deve verificare, e quando la verifica
dà' **due letture possibili**, chiedere invece di dichiarare.

E' esattamente la regola che vale per la triangolazione: **un'anomalia che si spiega in modo
piu' semplice come feature realizzata che come errore, si tratta come feature.** Io avevo scritto
"manca il legame", e il legame c'era: era la decisione sul Premium che non avevo ricostruito.

Il costo di quell'errore e' stato alto perche' avevo scritto che "manca il legame" in tre posti.
**Le verifiche negative vanno sempre rilette prima di diventare conclusioni.**

---

*Dottrina Echo. Correzione del 26/09/2026, su segnalazione dell'utente. Il modello di riferimento
per la prediczione e' `docs_v2/MODELLO_PREDITTIVO.md`.*
