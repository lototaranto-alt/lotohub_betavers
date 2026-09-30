---
id: NOTEBOOKLM-BRIEFING
tipo: analisi
ambito: briefing-autonomo-per-la-sessione-notebooklm
stato: Vivente
confidenza: Alta
owner: Agent
aggiornato: 2026-09-29
evidenza:
  - docs_v2/loto_map/00-INDICE-LOTO-MAP.md:1
  - docs_v2/loto_map/03-zero-iot-e-offline.md:1
  - docs_v2/loto_map/04-features-ux-e-gamification.md:1
  - docs_v2/TASKS-PER-AREA.md:1
  - app/_layout.tsx:88
---

# Briefing per la sessione NotebookLM

> **Questo file è autosufficiente.** Non ha bisogno di `docs_v2/`, del repository, o di altro: se
> qualcosa non è scritto qui, per NotebookLM non esiste. Se serve un contesto che manca, è un
> difetto di questo documento.
>
> **Destinatario:** un modello che legge molte fonti e raggruppa. Non gli si chiede di scrivere
> codice, gli si chiede di **vedere un pattern che quattro audit separati non vedono**.
>
> **Come usarlo:** caricare questo file, poi fare le domande della §7, una alla volta.

---

## 1. Che cos'è L.O.T.O. Map, in venti righe

Un'app mobile (React Native / Expo) per la scoperta turistica e il deflusso in una città italiana.
Tre pilastri di prodotto:

1. **L.O.T.O. Pass** — un passegino digitale. L'utente cammina, trova dei POI, e ogni check-in
   validato dà XP e token. Vedi la sezione Community per come sono ridistribuiti.
2. **Zero-IoT** — nessun sensore installato. La "prova di azione" (Proof of Action) nasce da GPS,
   NFC e un density proxy BLE: se l'utente era davvero lì, il credito è reale.
3. **Impatto** — ogni azione validata genera CO₂ risparmiata e finisce in un ledger
   (`impact_transactions`), da cui derivano una heatmap anonima e un report venduto alla PA.

Il DB è Supabase (PostgreSQL + PostGIS). L'app è in TypeScript, circa 1.000 righe per i file
principali. Target: un Comune, un tenant, una città (Taranto, oggi).

## 2. Lo stato della verifica: quattro punti, tutti chiusi

Il team ha verificato **quattro blocchi di funzionalità** del brief di prodotto, uno alla volta,
contro il codice. Ogni claim è stato confrontato con la riga che lo implementa. Esito:

| # | Blocco verificato | Esito |
|---|---|---|
| 1 | Onboarding & identità (Zero-PII) | 2 confermati, 1 rotto |
| 2 | Motore "Camaleonte" (multi-tenancy) | architettura reale, cablaggio a metà |
| 3 | Interazione "Zero-IoT" e sincronizzazione offline | 1 confermato e incompleto, 2 rotti, 1 buco non dichiarato |
| 4 | Features UX avanzate e gamification | 3 su 8 confermati, 2 rotti, 3 non implementati |

**Nessuno dei quattro blocchi è mai stato testato a runtime.** Tutto è verificato per lettura di
codice e da query al cloud. Non c'è mai stato un test su dispositivo.

## 3. La regola con cui è stato giudicato tutto

Cinque esiti, e sono l'unico apparato concettuale che serve per leggere il resto:

| Esito | Significato |
|---|---|
| `CONFERMATO` | il codice lo fa, alla riga indicata |
| `SOVRADIMENSIONATO` | lo fa solo in parte, e il testo promette di più |
| `ROTTO` | non lo fa, o lo fa a metà |
| `PERSA` | esisteva, è stato cancellato, e nessuno se n'è accorto |
| `NON IMPLEMENTATO` | non è mai stato scritto |

Il quinto esito, `PERSA`, è nato durante il terzo audit ed è quello che ha spostato la diagnosi.

---

## 4. Il ritratto che ne emerge

### 4.1 Nessuno di questi difetti produce un errore

È il fatto più importante di questo briefing, e i quattro audit lo hanno trovato separatamente
senza nominarlo.

Ogni sistema rotto **funziona e riporta successo**:

- la funzione che accredita i check-in restituisce `{success: true}` mentre non verifica la
  distanza dal POI;
- il bottone "SEGNALA" dell'accessibilità è un componente senza handler: si può premere, e non
  succede niente;
- l'utente con mobilità ridotta vede un avviso di accessibilità, ma l'avviso è deciso dal fatto
  che il nome del POI contenga la parola "Castello";
- l'app promette una coda offline e non la svuota mai, e i check-in fatti senza rete vengono
  persi con un messaggio di errore;
- la sezione Community mostra totali coerenti, sommati da un ledger che ha zero righe.

Un fallimento rumoroso si trova in test. Questi si trovano solo leggendo la formula e chiedendosi
**chi la chiama**.

### 4.2 Tre classi di difetto, in ordine di gravità

**Classe 1 — l'architettura c'è, il cablaggio no.**
Codice scritto, provato, commentato, e non collegato a chi dovrebbe usarlo.
- Il modulo crittografico NFC è corretto e completo: estrae i due parametri crittografici dal tag
  e li manda al backend, con le chiavi AES fuori dall'APK. **Non ha un solo richiamato in tutto il
  repository.** Il flusso che l'utente può davvero premere legge il tag in chiaro.
- Il calcolo del tenant da GPS gira, calcola Haversine, e poi scarta il risultato assegnando
  Taranto. Si chiede comunque il permesso GPS per un risultato che viene buttato.
- La funzione di recupero del passaggio esiste e scrive, ma il client legge `data?.success`, mostra
  un Alert e chiude: **la risposta che la funzione produce viene scartata.**

**Classe 2 — un controllo è stato cancellato.** (dal blocco 3, il più grave)
Il controllo di prossimità esisteva, era ben scritto, e aveva un messaggio d'errore esplicito per
l'utente. È sparito quando una migration ha **sostituito il corpo della funzione** per aggiungerci
una tabella ledger. Nessun errore di compilazione, nessun test, nessun avviso. Le cinque occorrenze
del controllo sono diventate una, e quella che resta serve ad altro.

Conseguenza: un utente al primo check-in della vita **non ha controlli**. Nessuna velocità da
calcolare (manca il check-in precedente), nessuna distanza da verificare. Credito accreditato,
riga scritta nel database, e quella riga finisce nella heatmap venduta all'amministrazione.

Le altre tre formule di quel blocco — anti-spoofing a 130 km/h, cooldown di 12 ore, shadowban — sono
tutte corrette. Ma proteggono il *valore* di una visita che, senza il controllo perso, non è
avvenuta.

**Classe 3 — un numero che nessuno scrive.** (dal blocco 4, il più subdolo)
Due componenti leggono due fonti diverse dello stesso stato, e nessuno scrive la seconda:
- l'interruttore di accessibilità dell'utente salva in area di stato locale;
- la scheda del POI legge una **colonna del database che nessuno scrive mai**.

Quindi quel flag è sempre falso, e l'avviso non compare mai. L'interruttore sembra funzionare: cambia
colore. E non cambia niente. Lo stesso documento che nomina l'interruttore chiama anche un campo che
non esiste, con un fallback che decide l'accessibilità dal nome del luogo.

### 4.3 La causa strutturale, e perché non è un caso singolo

**Il livello di maturità decresce con la vicinanza al cliente.**

Il codice applicativo è curato: commenti che spiegano le scelte, invarianti dichiarate, gestione dei
casi limite ragionata. Il livello immediatamente sotto — il database — è il più fragile, perché è
**quello che non entra in Git**.

Le conseguenze sono misurabili:

- il repository contiene **9 migration tracciate**. Il sottosistema multi-tenant, cioè il pezzo che
  dovrebbe rendere il prodotto replicabile senza store, **non c'è in nessuna**: 9 tabelle e 3
  funzioni nascono solo da 63 esportazioni del pannello SQL, mai da una migration;
- 16 trigger e 7 definizioni di tabella esistono solo in file di ripristino mai applicati. Include
  la regola di validazione community fra cittadini, che è **la cosa meglio progettata di tutto il
  progetto** (esclude l'auto-conferma, finestra 7 giorni, controllo dei 50 metri reali) e non gira
  mai;
- la regola che trasforma un check-in in una riga di ledger c'è, è corretta, e **non è quella che
  gira in produzione**.

Se il database venisse ricreato dal repository domani, il prodotto partirebbe senza tenant, senza
validazione community, senza ledger, e con la metà delle feature che il brief promette.

### 4.4 Perché `tsc` non trova niente

Il type-check passa con zero errori mentre l'app legge colonne inesistenti.

Il motivo è preciso e vale per tutto il progetto: **i dati che vengono dal database non sono
coperti dai tipi.** Supabase restituisce `any`, quindi un campo che non esiste nello schema passa
inosservato. È la ragione per cui una colonna di affollamento ha due valori predefiniti diversi
nello stesso file, e la ragione per cui il banner di accessibilità può dipendere da una
sottostringa del nome di un POI senza che nessuno strumento se ne accorga.

Il controllo che funziona è solo quello esplicito: cercare chi scrive e chi legge un campo.

---

## 5. Le formule proprietarie, e perché sono qui dentro

Il team ha dovuto ricostruire da zero le formule del prodotto, perché erano state scritte **sette
volte in sette file diversi con valori diversi**, e il file che doveva contenerle tutte non esiste
più. Uno dei tre documenti originali diceva che la scansione wireless durava 3 secondi: il codice
dice 5. È stato corretto, e la correzione è stata confermata dal product owner.

| Formula | Valore | Stato |
|---|---|---|
| Durata scansione wireless | 5 secondi, soglia RSSI −75, quorum 5, decadimento 72 ore | confermata, e **non usata** dal ramo che la dovrebbe usare |
| Controllo di prossimità | raggio **per-POI** (non 80 m fissati) | **persa** nella versione in produzione |
| Anti-spoofing velocità | >130 km/h ombrello · 20–130 veicolare · <20 pedonale | confermata |
| Cooldown | 12 ore sullo stesso POI, con commento: *"questo è il vero atto di chiusura dell'exploit"* | confermata |
| Presenza per l'accredito | 15 minuti dalla validazione GPS | confermata |
| Progressione a livelli | **50 livelli**, non 3 | confermata, e i 3 tier originali sono vietati |
| Cifratura coefficienti CO₂ | tre numeri senza fonte | dichiarati ISPRA/DEFRA, **non esistono** |
| Campionamento all'1% | dichiarato in cinque file | **mai scritto**, e si auto-ripara a ogni sessione |
| Algoritmo mete consigliate | non esisteva: un `UPDATE` manuale | deciso il 29/09, specifica scritta, **non implementata** |

Due osservazioni che un revisore esterno dovrebbe tenere a mente:

- Le formule di gamification sono **più serie di quanto la documentazione dicesse**, e in più di un
  caso il codice ha ragione e il documento ha torto. Il commento sul cooldown e il 50° livello sono
  esempi.
- Le regole che **proteggono** l'utente e l'amministrazione (anti-spoofing, cooldown, ombrello,
  prossimità) sono scritte bene. Le regole che **incoraggiano** l'uso (campionamento, certificazioni
  campione) sono quelle dichiarate e mai scritte. Il bias è netto e va detto.

---

## 6. Le decisioni che non si possono prendere da soli

**22 aperte, 3 chiuse.** Non sono tecniche: sono di prodotto, e ognuna cambia il lavoro degli altri.
Le prime cinque, in ordine di blocco:

1. **Il proximity gate è stato perso di proposito o per errore?** Prima si ripristina — non
   aspetta una decisione — poi si sceglie il raggio. Il ripristino è il primo intervento in assoluto.
2. **I 63 esport del pannello SQL (aprile–luglio 2026, *prima* della prima migration) sono la fonte
   di verità o spazzatura?** Se sono la verità, il repository non riproduce il database e va
   riscritto. È la decisione più grande della lista.
3. **L'accessibilità è un dato o un'eccedenza?** Tre nomi diversi per la stessa cosa, e una colonna
   che nessuno scrive. Serve una decisione sul ruolo, non una migration.
4. **La coda offline deve poter accreditare check-in retroattivi?** Se sì, la firma della funzione
   cambia. Se no, la coda va limitata a sblocco media e il claim va riscritto.
5. **Le Mete Consigliate entrano nel prodotto?** Deciso sì il 29/09, con una colonna che tiene
   insieme algoritmo e campagna manuale, raggio 2 km, anonimato a 5. Manca lo scrittore, e va
   eseguita una migration non ancora applicata.

Il resto copre: forma del credito (l'utente ha diritto di sapere quando è in ombrello?),
periodicità di rilascio dell'anonimato, se le segnalazioni civiche vanno validate anche dalle
associazioni, e se gli Obiettivi Comuni esistono o no.

---

## 7. Le domande da fare a NotebookLM

Una alla volta, in quest'ordine. Le prime quattro sono quelle per cui il modello vede qualcosa che
quattro audit separati non hanno visto.

**Il pattern di fondo**

1. *Quattro audit separati su quattro blocchi diversi hanno prodotto più o meno lo stesso tipo di
   difetto. Qual è la causa strutturale comune, e quali altre classi di difetto ci si aspetterebbe
   di trovare in un repository con questa forma?*
2. *Il repository non riproduce il proprio database. Qual è il modo più economico per rendere
   riproducibile un ambiente che non lo è, senza fermare lo sviluppo dell'app?*
3. *Un controllo di sicurezza è stato cancellato da una sostituzione di corpo di funzione, senza
   errore. Chei controlli preventivi servono a fermare i sistemi che falliscono in silenzio?*

**Il prodotto visto da fuori**

4. *Il brief promette dodici feature. L'implementazione ne soddisfa poche, e quelle che falliscono
   falliscono in silenzio. Qual è il rischio reputazionale e legale, e in particolare cosa cambia
   se il prodotto è venduto a un Comune con dati aggregati per la heatmap?*
5. *Un prodotto con questi presupposti è meglio rifare in modo ordinato o completare il
   esistente? Considera che il codice applicativo è buono e il database è il problema.*

**Il merito delle formule**

6. *Le formule che proteggono il sistema sono scritte bene; quelle che lo promuovono sono dichiarate
   e mai scritte. Qual è il pattern e come si corregge a livello di processo?*
7. *Quali di questi claim, corretti così come sono, reggono bene? Ci sono altri claim sospetti per
   forma, anche senza codice a disposizione?*

## 8. Cosa chiedere che **non** ha risposta

NotebookLM non ha accesso al cloud. Non chiedergli di confermare lo stato del database, i tipi delle
colonne, o quali funzioni esistono: su quelle, la risposta sarebbe inventata. Le domande 2, 3 e 5
sono le uniche sicuramente utili senza accesso; le altre danno una lettura strutturale, che è quello
che serve.

## 9. Vincoli da tenere presenti

- Nessun intervento sul cloud senza autorizzazione esplicita.
- Nessuna `DROP` nelle nuove migration: è un vincolo di progetto, non una preferenza.
- Le agenzie vedono **solo aggregati**. Mai dati di un singolo commerciante. È un vincolo legale,
  non tecnico.
- La heatmap non contiene identificativi di POI, e la soglia di anonimato è 5.
- Nessun dato di terzi è mai stato acquisito. Decisione ferma, da non riaprire senza un caso d'uso
  reale.
- Il recupero dell'identità è chiuso: nessuna email, nessun backup su server. Reinstallare l'app
  perde i progressi, in silenzio. È una decisione presa e va rispettata, o cambiata per iscritto.

## 10. Una nota sul perché di questo file

Il repository contiene 47 documenti di verifica, un indice per area con task stabili, e una fonte
unica per le formule. Sono tenuti bene e sono la base di lavoro.

Ma sono **quattro documenti che descrivono quattro audit separati**, e ognuno chiude con una lista
di task. Il rischio di quella forma è noto: si ottiene un elenco di problemi, non un problema. Un
elenco di ventidue task con priorità compete per l'attenzione con il resto, e il task numero
trentadue non verrà mai fatto.

Questo file esiste per dare a un altro modello **un oggetto solo da guardare**, e chiedergli non
"cosa aggiungerei alla lista" ma **"cosa vedo che questi quattro documenti, presi insieme, non
vedono"**.

Se la risposta è "il livello di maturità decresce verso il database, e il database non è nel
repository", quella conferma una diagnosi che qui è già scritta, e il brainstorming può spostarsi
sulle decisioni. Se è qualcos'altro, è la scoperta che mancava.
