# METODO DI LAVORO — L.O.T.O. HUB

Agente principale. 05/10/2026.
Documento dihandoff. Serve ad allineare un agente che legge l'archivio (NotebookLM)
al metodo con cui è stato prodotto il cantiere, così che una divergenza di
metodo non si presenti come divergenza di conclusioni.

Non è un piano, non è una specifica, non sostituisce una misura.
Piano operativo: `PIANO-LAVORO-MODULARE.md`. Perimetro documentale: `TRIAGE-DOCUMENTAZIONE.md`.

---

## 1. Sequenza

**1.1 — Misura prima di modificare.**
Nessuna scrittura su database o codice finché l'oggetto non è stato
misurato con una query di sola lettura. Prima di credere a una funzione, a una
policy o a una colonna, ne leggo il corpo o la condizione reale.

**1.2 — Fase 0 è sola lettura.**
Le misurazioni non scrivono nulla. Le mutazioni non vengono infilate a metà
cantiere: quando la misura è finita, le scritture si raggruppano e si applicano
in un colpo, perché due motivi per tornare indietro nello stesso momento non
sono distinguibili al momento del rollback.

**1.3 — Un modulo, una premessa, un rollback.**
Una correzione di sicurezza non viaggia con una funzionalità. Se una migration
 contiene due ragioni per essere annullata, non si sa quale ripristinare.

**1.4 — Una misura non si rifà.**
Un modulo già misurato non torna nella coda. Se un piano lo ripropone, si
riconosce che è vecchio.

---

## 2. Evidenza

**2.1 — I nomi non sono una fonte.**
Un nome dice cosa dovrebbe fare, il codice dice cosa fa. Divergenze reali
incontrate: una policy chiamata `Allow anon read on media_vault` che chiede
l'utente loggato; un badge promesso all'utente e mai assegnato; un widget che
filtra su `tenant_id`, colonna che non esiste, senza segnalare l'errore.

**2.2 — Non cercare per nome.**
Regola nata dopo quattro errori miei, già registrata in `LOG-LAVORO.md`. Non
cerco un simbolo e do per scontato di averlo trovato: cerco il chiamante, il
parametro e il percorso di scrittura.

**2.3 — Il client non è il server.**
Una validazione fatta in un `.tsx` non è una validazione. Se un'azione si
sblocca con una sottostringa dentro un QR, l'azione non è validata: è
suggerita.

**2.4 — La misura la esegue l'operatore.**
Io scrivo **uno** script per volta. Voi lo eseguite e incollate l'output
grezzo, non riassunto. Gli script diagnostici sono `SELECT` e non vanno salvati.

**2.5 — Se non so, lo dico, e dico donde viene il dato.**
Un'informazione coming da un riassunto invece che da una misura vale come
ipotesi e va etichettata. Non ricostruisco il corpo di una funzione da un
commento o da un nome.

---

## 3. Come si leggono gli oggetti del database

**3.1 — L'RLS è per riga, non per colonna.**
Chiudere le righe non nasconde i nomi delle colonne: lo schema resta esposto.
Per revocare a livello di colonna serve un `GRANT`, non una policy. Quindi
"impermeabile" è una parola che va usata con precisione.

**3.2 — Le policy permissive si sommano.**
Più policy si combinano in OR. Una policy restrittiva non chiude mai una
permissiva: per chiudere serve `DROP POLICY`.

**3.3 — `proacl` a `NULL` non vuol dire "nessun grant".**
Vuol dire ACL di default, e il default di PostgreSQL concede `EXECUTE` a
`PUBLIC`. Una funzione `SECURITY DEFINER` con ACL di default è invocabile da
`anon` e da chiunque abbia la chiave.

**3.4 — `SECURITY DEFINER` senza `search_path` fissato è un vettore.**
Lo schema di ricerca è controllato dal chiamante. Le funzioni corrette del
progetto fissano `SET search_path = public, pg_temp`.

**3.5 — `service_role` bypassa l'RLS.**
Prima di proteggere una tabella con le policy, decido se il percorso
amministrativo le attraversa o le scanna. Se passa per `service_role`, le
policy non sono nel suo percorso e proteggere è un'altra cosa.

**3.6 — La copertura va verificata per elencazione, non per assunzione.**
Chiedersi "esiste una regola che vieta X?" produce metà delle volte "no, non
c'è". La domanda che serve è "quali ruoli possono fare X?", ed è una
enumerazione. Una tabella aperta in scrittura è più grave di una aperta in
lettura.

---

## 4. Numeri

**4.1 — Un fallback hardcoded non è una metrica.**
Un contatore che parte da un valore inventato e non viene aggiornato quando la
query fallisce non è una misura, è una decorazione. Se il dato è importante,
il fallback visibile è un bug.

**4.2 — `if (count)` maschera lo zero.**
Uno zero è falsy: il guard lascia passare il fallback e l'utente vede il numero
inventato proprio nel caso in cui il dato vero sarebbe il più importante.

**4.3 — Il contatore globale non è un contatore di dominio.**
Se l'unità è l'evento, il numero deve essere per quell'evento. Contare tutta la
tabella e mostrarlo come se fosse la partecipazione a qualcosa è un errore di
categoria, non un'approssimazione.

**4.4 — Una metrica dichiarata riservata che finisce in app è un buco ricostruito.**
Il percorso privilegiato va costruito prima, con la stessa forma della strada
pubblica: aggregato server-side, `search_path` fissato, grant al solo ruolo
amministrativo e mai ad `anon`.

---

## 5. Modello e dominio

**5.1 — Un ruolo globale non scala su una responsabilità per tenant.**
Se la responsabilità è per-tenant, l'autorizzazione è una relazione di
appartenenza, non una casella in un enum di ruoli. Aggiungere ruoli per coprire
il caso peggiora lo schema che sembrava pulito.

**5.2 — Non si costruisce un modello su un mockup.**
Se l'oggetto non viene persistito, non è una funzione: è una schermata. Non
gli si costruisce sopra un'infrastruttura pubblica per farlo sembrare vero.

**5.3 — Un canale di contatto non è un'identità.**
Un numero telefonico non è verificato, non è durevole e cambia di mano. Va bene
come dato pubblicato con consenso esplicito; non basta come prova di chi
gestisce un ente.

---

## 6. Criteri di accettazione: si prendono dai documenti di governo

Il progetto ha già scritto delle invarianti testabili. Prima di inventare un
criterio di accettazione, cerco se è già dichiarato.

| Invariante già scritta | Dove | Effetto sul lavoro |
|---|---|---|
| L'app non chiede mai email né nomi, login anonimo | `.agents/rules/master_business_brief.md:34` | `profiles` non deve diventare un archivio PII |
| Aggregazione su griglia ~110 m con soglia k ≥ 5 | `.agents/rules/master_business_brief.md:41` | una tabella con coordinate grezze e lettura aperta non è conforme |
| Agli partner i dati non scendono mai al singolo esercizio | `.agents/rules/master_business_brief.md:42` | i contatori pubblici sono aggregati per definizione |
| Nodo e dati partner entrano dal bot WhatsApp | `.agents/rules/partner_operative_documentation.md:35` | il canale esiste già nella specifica, non va reinventato |
| L'architettura del database è la fonte unica di verità | `.agents/AGENTS.md:36` | il frontend non può motivare una scrittura che il modello non prevede |

**Regola.** Questi documenti sono specifica, non narrativa. Dove dicono una
cosa e il codice fa un'altra, il codice è il difetto: la documentazione non si
riscrive per far quadrare il codice.

---

## 7. Correzioni

**7.1 — Una correzione si dice, nella conversazione successiva.**
Quando un'affermazione mia si rivela sbagliata, la dichiaro esplicitamente e
la ripeto, invece di riscrivere la cronologia. Il lettore deve poter sapere
quale punto del ragionamento era sbagliato e da dove è emerso.

**7.2 — Un modulo il cui presupposto è smentito si rimuove.**
Non si riscrive lo stesso modulo con un altro nome. Un trigger che non esiste,
una colonna che non c'è, una tabella che non è stata inventata: la misura
annulla l'oggetto.

**7.3 — Il risultato è la copertura, non il numero di righe modificate.**
Il valore di questo lavoro è che ogni riga cambiata ha una misura che la
precede e un rollback che la riporta indietro.

---

## 8. Glossario condiviso

Termini usati con significato preciso, per evitare che due agenti parlino di
cose diverse con lo stesso nome.

| Termine | Significato |
|---|---|
| **RLS** | filtra le **righe** per ruolo. Non filtra le colonne |
| **policy permissiva** | `using`/`check` vere, combinate in OR |
| **`SECURITY DEFINER`** | la funzione esegue con i permessi del proprietario |
| **`proacl`** | ACL esplicite. `NULL` = default = `EXECUTE` a `PUBLIC` |
| **`search_path`** | schema risolto dai nomi non qualificati dentro la funzione |
| **`anon` / `authenticated`** | ruoli della chiave pubblica e della sessione utente |
| **`service_role`** | bypassa l'RLS. Non deve stare in un bundle client |
| **cold start** | primo check-in senza posizione precedente, velocità non calcolabile |
| **shadowban** | accettazione senza ricompensa per sospetta frode GPS |
| **`grid_cell`** | aggregazione spaziale. Il dato grezzo è `latitude`/`longitude` |
| **consumer** | ogni punto del codice che legge o scrive un oggetto. Va cercato, non dedotto |

---

## 9. Cosa questo documento non è

Non autorizza scritture. Non sostituisce la misura in corso. Non è un requisito
di prodotto e non ne crea altri: dove serve una decisione di prodotto, la
decisione la prende il committente e io registro la premessa, non la scelgo.