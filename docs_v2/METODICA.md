---
id: METODICA
tipo: regola
ambito: metodo-di-lavoro-anticombinazione-e-chiusura-dei-blocchi
stato: Vivente
confidenza: Alta
owner: Agent
aggiornato: 2026-09-29
evidenza:
  - docs_v2/VERIFICA-RUNTIME-2026-09-29.md:1
  - docs_v2/NOTEBOOKLM-BRIEFING.md:1
  - docs_v2/loto_map/03-zero-iot-e-offline.md:1
  - utils/levelUtils.ts:13
---

# Metodica: come lavoriamo senza raccontarci storie

> Questo documento nasce da un problema preciso, non da burocrazia. Quattro audit hanno prodotto 46
> pagine, e quasi tutte le affermazioni iniziali erano **false**. Non perché sbagliassimo a leggere,
> ma perché stavamo descrivendo un'intenzione invece di un comportamento. Questo file è la
> correzione strutturale di quel modo di lavorare.
>
> Vale per me e per te. Se una riga qui contraddice quello che ci viene comodo, la riga ha ragione.

---

## 1. La regola che tiene insieme tutto

**Il codice è l'unica autorità. I documenti sono ipotesi con le spallucce.**

Quando codice e documentazione si contraddicono, **il codice ha ragione per definizione** e il
documento è sbagliato. Non "da valutare": sbagliato. Il documento non è una fonte, è un'ipotesi
scritta da qualcuno — spesso da noi — che non ha più controllato la realtà.

Conseguenza operativa, non filosofica: **non si scrive mai un'affermazione che non si possa
risalire a un `file:linea`.** Se non c'è il `file:linea`, l'affermazione non entra nel documento.
Nessuna eccezione, nemmeno per le cose "evidenti".

L'ordine di autorità, dal più forte al più debole:

| | fonte | perché vale |
|---|---|---|
| 1 | **codice in esecuzione** | l'unica cosa che produce un comportamento |
| 2 | **migration applicate al cloud** | il DB reale, non quello su carta |
| 3 | **query al cloud** | fatte davvero, con l'output letto |
| 4 | **migration scritte ma non applicate** | intenzione, non realtà |
| 5 | **export JSON** | ignoti, non verificati |
| 6 | **documentazione** |(ipotesi) |

Il punto 6 è l'ultimo per un motivo che abbiamo imparato a caro: un documento del 26/09 diceva che il
Blocco 0 era aperto, e aveva ragione. Ma i documenti di allora dicevano anche che l'app faceva
check-in con controllo di prossimità, e avevano torto.

---

## 2. La scala della verifica — e l'obbligo di sapere a che piano sei

Non tutte le affermazioni valgono lo stesso, e il difetto più comune è presentarle come se valessero
tutte uguali. Ogni claim vive a un piano, e **il piano va scritto**.

| piano | cosa hai fatto | costo | esempio reale |
|---|---|---|---|
| **L0 — letto** | hai letto il codice | minuti | "la funzione non controlla la distanza" |
| **L1 — tracciato** | hai seguito il chiamante e i suoi consumer | un'ora | "il client legge solo `new_total_xp`" |
| **L2 — chiesto al cloud** | hai lanciato la query e letto l'output | un accesso | "`tenants.id` è un UUID" |
| **L3 — eseguito** | l'hai visto succedere | una sessione | "offline l'app tiene l'identità" |

**Regola:** un documento non presenta mai un claim di piano basso con la confidenza di uno alto. Il
`Blocco 0` era a L0 per giorni e la cosa giusta da dire era "risolto ma non verificato" — che è
stato scritto, ed è stato corretto solo quando è salito a L3.

**Il test che distingue L3 da L0:** riesci a produrre un numero che, se fosse falso, ti farebbe
 cambiare idea? "Ha una guardia" è L0. "Il contatore delle identità è 5 prima e 5 dopo" è L3. Il primo
non può falsificare nulla, il secondo sì.

---

## 3. Le sette bugie che la documentazione racconta

Queste non sono ipotesi: sono le sette forme che hanno assunto le frasi false di questi giorni.
Quando una frase ti suona familiare, è probabilmente una di queste.

1. **"Il codice c'è."** — c'è, e non è chiamato da nessuna parte. `nfcManager.ts` è
   un'implementazione NTAG424 corretta, con zero chiamanti. *Esiste* non vuol dire *funziona*.

2. **"È salvato."** — sì, e nessuno lo legge. Il flag di accessibilità finisce in AsyncStorage e il
   banner decide con un'altra fonte. Scrivere e leggere sono due righe in due posti diversi.

3. **"È implementato."** — è in una migration **mai applicata**. Tre delle quattro locali non sono
   mai state eseguite: il codice è perfetto e non esiste.

4. **"È configurabile."** — è un numero cablato. `1.5` di CO2, `2` XP veicolare, `1` PTI: valori
   letterali che nessun amministratore può riconciliare con la configurazione del POI.

5. **"Il server valida."** — la formula è nel client, e il client è controllato dall'utente. La
   curva dei livelli vive in `levelUtils.ts`: un aggiornamento dell'app cambia il livello di utenti
   che non hanno spostato un XP.

6. **"Restituisce success."** — restituiva `status: 'success'` **sempre**, anche su uno shadowban. E
   il client guardava solo `error`, quindi `success` non era neppure guardato. *Nessuno dei due
   mentiva sul campo che l'altro non leggeva.*

7. **"Non genera errori, quindi va bene."** — l'assenza di errore è il peggior segnale possibile
   quando l'errore è la verifica. Un check-in da 500 km non solleva nulla: restituisce
   `success: true`.

La settima è la regola generale delle altre sei: **in un sistema senza allarmi, il silenzio non è
una buona notizia.** È il motivo per cui 20 difetti hanno convissero senza che nessuno se ne accorgesse.

---

## 4. Un blocco si chiude solo con una prova, mai con un'intenzione

Ogni blocco ha tre cose scritte **prima** di iniziare, non dopo:

1. **Il difetto, in una frase verificabile.** Non "migliorare l'area civica": "il banner compare per
   un POI con `is_wheelchair_accessible` assente, perché il default è una stringa e non un valore
   assente".

2. **Il criterio di uscita, testabile da qualcuno che non ti crede.** Per il proximity gate è:
   *un check-in entro il raggio riesce, uno fuori dal raggio viene respinto e non scrive righe.* Non
   è "ho aggiunto il controllo".

3. **L'elenco di cosa NON è in scope.** Questo è il margine, ed è la parte che si salta sempre.

### La regola del margine

Il non-scope si scrive **prima**, si rispetta **durante**, e si modifica **solo dichiarandolo**.

La migration del proximity gate ne è l'esempio. Mentre ripristinavo il gate ho trovato che il CO2
era cablato a `1.5` invece di leggere `pois.base_co2` — un difetto vero, documentato, con la riga
esatta. **Non l'ho corretto**, perché sono i numeri che gli utenti hanno già accumulato e cambiarli
di nascosto sposta totali già presenti. È diventato `A3-T15`, con la decisione separata.

Un blocco che cresce mentre lo esegui è un blocco che non finisce. La regola è: **se serve altro,
finisci questo e apri il successivo.** Il costo è una seduta in più; il beneficio è che ogni
risultato è finito e committabile, che è l'unica cosa che rende il lavoro recuperabile.

---

## 5. Le tre cose che non facciamo mai

**Non scriviamo un'attestazione che non abbiamo misurata.** Se non l'abbiamo vista succedere,
diciamo "da verificare" e ci fermiamo. Il prezzo di ammettere un limite è di un'ora. Il prezzo di
promettere quello che non hai visto è `A3-T12`: quattro giorni di documentazione su un bug che la
documentazione precedente aveva negato.

**Non applichiamo niente al cloud senza il tuo via esplicito, ogni volta.** Non "una tantum", non
"tanto per provare". Ogni volta.

**Non facciamo refactor durante un fix.** Il proximity gate non ha toccato `levelUtils.ts`, anche se
passando di lì ho visto cose che vanno sistemate. Refactor e fix insieme rendono il diff
illeggibile, e il diff illeggibile è il luogo dove i difetti sopravvivono.

---

## 6. Il limite che non si può aggirare: il cloud non è ispezionabile

Vale la pena dirlo chiaramente, perché è il buco sotto tutta la metodologia.

**Io non vedo il tuo Supabase.** Posso leggere i 63 export, che però sono di incerta autorità, e le
9 migration tracciate. Non so cosa gira davvero. Quindi:

- ogni claim sullo schema del database è **L2 al massimo**, e spesso è **L0** travestito;
- `Q17`, `Q18`, `Q19`, `Q20`, `Q22`, `Q26`, `Q27` restano aperte **finché non le lanci tu**;
- quando lanci le query, **porta l'output, non la risposta che ti aspetta**.

Questo vale anche per me nei confronti futuri: se ti dico che una colonna è TEXT e tu lanci la query
e risulta UUID, **hai ragione e io ho sbagliato.** È successo e va detto: ho trattato
`pure_cloud_queries/` come se fosse lo schema quando è una lista di interrogazioni mai eseguite.

---

## 7. Il ciclo, in pratica

```
   1. il difetto in una frase verificabile
   2. il criterio di uscita, testabile da chi non ti crede
   3. cosa NON è in scope
        ↓
   4. il fix, più piccolo di quanto serve
        ↓
   5. la misura (L0→L1→L2→L3, e dichiarare dove si è arrivati)
        ↓
   6. il commit
        ↓
   7. cosa è rimasto aperto, scritto
```

Il punto 7 non è un accessorio. **Un blocco chiuso che non elenca cosa ha lasciato aperto è un blocco
che tornerà indietro tra due settimane**, perché il prossimo che lo legge non saprà cosa manca. Ogni
`A3-T15`, ogni `Q17` non risposta, ogni "non verificato" in `VERIFICA-RUNTIME-2026-09-29.md` §5 è
un segnale che la catena non si spezza.

---

## In sintesi

Quattro audit hanno prodotto 47 pagine, e le prime versioni erano sbagliate quasi tutte. Il motivo
non era incapacità: era che stavamo scrivendo **cosa il progetto intendeva** invece di **cosa fa**.

La correzione costa poco e vale molto: una regola sola — *nessuna affermazione senza `file:linea`* —
avrebbe impedito che il proximity gate restasse scoperto per quattro giorni. Il resto di questo
documento serve a rendere quella regola abitudine: sapere a che piano di verifica siamo, sapere
cosa non è in scope, e ammettere i limiti prima che diventino scritte.

Il metro migliore resta quello che ci siamo dati ieri: **l'app che sbaglia in silenzio è il caso
peggiore, perché non lascia tracce.** Un sistema senza allarmi non è un sistema che funziona: è un
sistema che nessuno sta guardando. Questo progetto ne aveva uno. Ora sappiamo guardarlo, e sappiamo
che il prossimo buco sarà visibile solo se qualcuno lo cerca.
