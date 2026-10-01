---
id: VALUTAZIONE-PROGETTO
tipo: analisi
ambito: valutazione-onesta-di-fattibilita-del-progetto-loto-hub
stato: Bozza
confidenza: Media
owner: Agent
aggiornato: 2026-09-30
evidenza:
  - docs_v2/loto-hub-architettura-sistema-master-2026.md:1
  - docs_v2/tooling/autorita.json:1
  - supabase/migrations/20260930210000_fix_impact_transactions_schema.sql:1
  - app/(tabs)/index.tsx:583
---

# Valutazione del progetto: struttura, esperienza, business

> Questa non è una relazione di avanzamento. È una valutazione onesta, scritta da chi ha
> passato gli ultimi giorni a leggere il vostro codice invece a scrivere funzionalità. Se ti
> serviva una risposta rassicurante, questa non lo è. Ma una risposta vaga sarebbe stata più
> inutile, e il progetto merita una valutazione vera.
>
> Mi appoggio a fatti misurati, non a impressioni. Dove non ho dati, lo dico.

---

## 1. La risposta in tre righe

**Struttura: sì, ci arriviamo, ma costa.** Non è un progetto rotto, è un progetto *senza
storia scritta*. Il database reale è più avanti del repository, non indietro: questo è una
condizione recoverable, non un vicolo cieco.

**Esperienza utente: oggi non funziona, e il motivo è preciso.** Il check-in è rotto per un
errore di una colonna. Non è un problema di design, non è un problema di tempo. È una
divergenza tra ciò che il codice crede e ciò che il database è. Si sistema.

**Business: qui la risposta è diversa, e dipende da cosa vendi davvero.** I dati che raccogli
sono *stimati*, non *misurati*. Questo è un punto che va detto prima di costruire ancora.

---

## 2. Struttura: che voto diamo e perché

### Cosa ho misurato

Il 30/09 ho confrontato le tabelle realmente presenti nel tuo cloud con i `CREATE TABLE` del
repository. Il risultato è il fatto più importante di tutta la valutazione:

| | |
|---|---|
| tabelle nel cloud | **25** |
| create dalle migration del repository | **4** |
| mai definite in nessun file del repo | 3 (`badges`, `crowd_predictions`, `loto_squads`) |
| definite solo in file d'archivio o dismessi | le altre 18 |

Tradotto: **il tuo repository non sa costruire il tuo database.** Non in parte. Non "in
dettaglio". Non lo sa fare.

### Però questa è una buona notizia, e il motivo è preciso

Il database **esiste ed è sano**. Venticinque tabelle con relazioni, indici, spatial. Non è un
progetto abbandonato a metà: è un progetto il cui database è stato costruito e poi *non
tracciato*.

Questa distinzione cambia tutto:

- Se il DB fosse rotto o vuoto, il lavoro sarebbe ricostruire da zero.
- Se il DB è sano ma non tracciato, il lavoro è **esportare e allineare**.

Il primo è un progetto. Il secondo è un'attività di una settimana, se fatta con metodo.

E il metodo esiste già. Le 25 tabelle sono proprio l'inventario che ti serve. Non devi
cercare di ricostruire cosa dovrebbe esserci: **te l'ho già misurato**.

### L'evidenza che mi ha fatto cambiare idea sul progetto

Il fatto che `impact_transactions` esistesse con uno schema *diverso* — `hash` invece di
`receipt_hash`, `id` UUID invece che bigserial — è la prova che il lavoro è stato fatto ma a
mano, nel SQL Editor, senza passare dal repository.

È una notizia mista. Significa che c'è stato lavoro reale che non ha lasciato traccia. Ma
significa anche che **il database è stato costruito da qualcuno che sapeva cosa stava
facendo**, perché quegli schemi non sono casuali: hanno `tenant_id`, `action_type`, `poi_id`,
tipi scelti con criterio. Non è roba buttata a caso.

Quindi: il progetto è stato fatto bene e documentato male. È una malattia curatevole.

### Il debito tecnico reale, valutato onestamente

Non voglio farti leggere "tutto risolto". Questi sono i problemi veri, in ordine di gravità:

1. **Il check-in è rotto adesso.** `ERROR 42703`. L'utente non può fare la cosa principale
   che l'app fa. Questo non è un dettaglio, è il prodotto.
2. **I crediti si autoassegnano.** `p_co2`, `p_liters`, `p_tokens`, `p_xp` arrivano dal client.
   Neutralizzare `party_size` ha tolto l'amplificatore, ma la quantità resta scritta da chi
   chiede il credito. Se vendi dati di impatto ambientale, questo è il punto su cui
   un cliente enterprise ti blocca al primo audit.
3. **Il proximity gate non gira.** `location_pings` non esiste, il client controlla la
   distanza da solo, il server non partecipa. Il controllo che dovrebbe garantire che il
   check-in avvenga al POI è, oggi, un controllo che l'utente può aggirare con un device
   modificato.
4. **21 tabelle su 25 non sono riproducibili.** Nessuno, all'esterno, può ricostruire il tuo
   database. Questo è un costo operativo, non un bug.
5. **Multi-tenancy e autenticazione non sono chiuse.** Otto domini restano dichiarati
   `vuoto` nel registro.

### Il voto, se devo darlo

Come progetto: **promettente**. L'ambito è giusto, il modello è sensato, il codice mostra
che qualcuno ha pensato alle cose difficili (le transazioni con `search_path` fissato, le
politiche RSL, la logica anti-spoofing ci sono).

Come ingegneria: ** fragile ma recuperabile**. La fragilità non è nel codice, è nella
separazione tra codice e database. È il tipo di debito che si paga male oggi e non si paga
mai, se si affronta adesso che è ancora economico affrontarlo.

---

## 3. Esperienza utente: il check-in può funzionare?

### Il problema attuale

L'utente preme "Check-in" e riceve un errore. Non un errore chiaro: un messaggio generico,
"Impossibile completare la scansione", senza dire perché. Questo è il tipo di errore che
fa perdere un utente per sempre e che non genera una segnalazione, perché sembra un bug e
non un problema strutturale.

### Cosa serve perché l'esperienza sia buona

Non è una questione di UI. È una sequenza, in quest'ordine:

1. **Il check-in torna a funzionare.** Una migration, una colonna. Lo sai già.
2. **Il fallimento spiega sé stesso.** Se il check-in è rifiutato, l'utente deve sapere
   *perché*: troppo lontano, cooldown, profilo non trovato. Oggi non lo sa, e questo genera
   più abbandoni di qualsiasi errore tecnico.
3. **Il gate smette di essere un optional.** Se il check-in vale qualcosa, la vicinanza va
   verificata dal server. Non è un dettaglio di sicurezza: è la differenza fra un gioco e
   una frode.
4. **Il doppio tocco sparisce.** Se passi il check-in a `scan_poi_gps`, che è già scritto e
   fa i conti sul server, l'utente non deve fare nulla di diverso. Il modello giusto è
   invisibile all'utente.

### La risposta onesta

Sì, può funzionare bene. Ma nota una cosa: **l'esperienza utente non è un problema di
design, è un problema di integrità.** Non puoi progettare una bella UI sopra un check-in che
non registra niente. Prima l'integrità, poi la UI. È la sequenza corretta, anche se non è
la più gratificante.

E c'è una buona notizia specifica: il codice per farlo bene c'è già. `scan_poi_gps` calcola
sul server, ha il cooldown, ha l'anti-velocità. Non va riscritto. Va *attivato*.

---

## 4. Business: la domanda che conta davvero

Qui separo due cose che spesso vengono confuse, perché la confusione è costosa.

### Cosa hai oggi

I tuoi dati sono **stime del cliente**. L'utente dice "ho bevuto 5 litri", il server registra
5 litri e calcola CO2 con un fattore che sta nel codice. Il numero che finisce nel report è
derivato da un'auto-dichiarazione.

Questo è legittimo e comune. È quello che fanno la maggior parte delle app di benessere
ambientale. Ma allora il prodotto è un **quadro dei conti personale**, e il dato che vendi
non è una misura.

### Cosa potresti vendere

Un report di impatto ambientale *verificato* è un altro prodotto, con un altro prezzo e un
altro cliente. Richiede tre cose che oggi non hai:

1. **Attribuibilità.** Dimostrare che l'utente era davvero al POI. Serve il proximity gate
   attivo, lato server.
2. **Integrità del dato.** Che il credito non sia autoassegnabile. Serve `scan_poi_gps` come
   unico ingresso.
3. **Metodologia dichiarata.** I fattori di conversione devono essere documentati, versionati
   e citabili. Non basta un numero nel codice.

Il punto 3 è quello che quasi sempre manca e di cui nessuno parla. Un cliente enterprise non
compra "dati di impatto", compra **dati di impatto con una metodologia che può difendere
davanti al proprio revisore**. È la stessa domanda che si fa per un report ESG.

### Il modello di business, letto onestamente

La domanda che ti devi fare è: **a chi vendi?**

- **B2C, all'utente finale.** Il modello è freemium e abbonamento. La vendita dati è un
  effetto collaterale, non il prodotto. Qui il progetto è solido e l'integrità conta
  soprattutto per la fiducia e il ritorno.
- **B2B, alle aziende.** Il modello è abbonamento per il dato. Qui l'integrità *è* il
  prodotto, e ogni punto dei tre sopra è un blocco all'ingresso.

Non sono la stessa azienda. Il codice che hai oggi è a metà strada: ha le feature del primo e
nessuna delle garanzie del secondo.

### La cosa che ti dico con più chiarezza

Non ti sto dicendo "non vendere dati". Ti sto dicendo: **decidi in quale dei due mercati
stai, perché i requisiti sono incompatibili e non puoi ottimizzare per entrambi.** Nel primo
puoi chiudere la settimana prossima e uscire. Nel secondo ti servono i tre punti sopra, e
sono un percorso di mesi, non di sprint.

Questo non è un tetto. È una domanda di strategia, e va posta adesso, perché la risposta
cambia cosa costruisci.

---

## 5. Cosa farei io, in quest'ordine

Non un piano parallelo. Una sequenza, perché ogni passo sblocca il successivo.

1. **Applicare `20260930210000`** e girare V6. Il check-in torna vivo. Questo sblocca tutto
   il resto, perché finché il prodotto è rotto nessun altro lavoro si può vedere.
2. **Attivare `scan_poi_gps`** come unico ingresso e revocare l'esecuzione diretta di
   `process_esg_impact` a `authenticated`. Questo chiude insieme il credito autoassegnato e
   mette il gate sul server. Un passo solo, due problemi.
3. **Allineare le 21 tabelle mancanti** (`A3-T14b`). Non è urgente per l'utente, ma è
   ciò che rende il progetto manutenibile da domani. Con l'esportazione dal cloud, è
   mechanical.
4. **Chiudere autenticazione e multi-tenancy.** Sono le due che, se restano aperte, rendono
   impossibile vendere a un'azienda.
5. **Decidere il mercato** — B2C o B2B — e di conseguenza se la metodologia dei fattori
   diventa deliverable oppure no.

### La cosa che non farei

Non riscriverei l'app. Non toccherei il design. Non aggiungerei feature. Il progetto non ha
un problema di features, ha un problema di integrità fra tre strati: database, backend e
client. Quelle feature, per ora, non le vedo e le aggiungerei dopo.

---

## 6. Conclusione

Il progetto vale la pena di essere portato avanti. La base è reale, l'ambito è giusto e la
direzione è sensata. Il database è più avanti del repository, il che significa che il lavoro
*c'è stato*: non devi inventare un prodotto, devi allineare quello che hai.

Il rischio non è che non si riesca. Il rischio è che si resti nella fase in cui ogni
decisione tecnica è reversible perché niente è ancora solido, e la sicurezza si affronta
"dopo". È la trappola più comune in questo tipo di progetto, e la si evita con una cosa sola:
chiudere prima la sequenza nell'ordine in cui le dipendenze lo richiedono.

Sulla vendita dei dati, la risposta è sì ma con una precisazione che vale più della
valutazione: puoi vendere dati di impatto ambientale stimati subito, e ci sono clienti che
li comprano. Quello che non puoi fare, oggi, è vendere dati che si presentano come verificati
mentre l'attribuzione e l'integrità sono ancora a carico del client che li genera. Non è un
ostacolo legale che ti impedirà di vendere: è una promessa che il prodotto non riesce a
mantenere, e le promesse non mantenute in ambito ESG si trasformano in problemi molto più
costosi di una semplice rinuncia.

---

*Documento generato il 30/09/2026. Le affermazioni sui dati tecnici sono verificate sul
codice e sulle misure del cloud riportate in `loto-hub-architettura-sistema-master-2026.md`.
Le valutazioni su mercato e strategia sono opinioni argomentate, non dati: se una di queste
frasi ti serve per decidere denaro, verifica con qualcuno che il mercato lo conosco davvero.*
