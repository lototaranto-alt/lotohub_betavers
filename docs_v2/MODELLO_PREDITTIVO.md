---
id: MODELLO-PREDITTIVO
tipo: regola
ambito: come-il-modello-impara-e-si-corregge-dalle-azioni
stato: Vivente
confidenza: Media
owner: Agent
aggiornato: 2026-09-26
evidenza:
  - docs_v2/DOCTRINA-ECHO.md:1
  - docs_v2/RICOSTRUZIONE.md:118
  - docs_v2/regole/R5_criteri_di_scelta.md:1
---

# Modello predittivo: come la struttura impara dalla propria azione

> Risponde a: "come fa il modello a imparare man mano come va strutturato il progetto, invece di
> essere un insieme di documenti che invecchiano?"

Un modello che non cambia dopo un'azione e' un archivio. Questo ha un ciclo, e il ciclo e' gia' stato
eseguito una volta: la correzione della dottrina Echo del 26/09. Da li' la regola.

---

## 1. Il ciclo in cinque fasi

```
[1] SEGNALE      l'utente o il codice contraddicono il modello
        |
        v
[2] VERIFETTA    due letture possibili: e' un errore del doc, o un errore di lettura?
        |
        v
[3] CLASSIFICA   (a) il codice era sbagliato  (b) il doc era sbagliato
        |       (c) il modello era incompleto  (d) era una feature, non un bug
        v
[4] AGGIORNA    la regola permanente che rende il caso (d) o (c) non ripetibile
        |
        v
[5] ESECUTI     lo strumento di verifica controlla che la nuova regola regga davvero
```

**Il punto 4 e' quello che manca in tutti i progetti di documentazione: quasi sempre si corregge il
documento e si basta.** Il risultato e' che lo stesso errore di lettura si ripete, con parole
diverse, ogni due mesi. La correzione che vale e' **quella che rende l'errore impossibile da
ripetere**, non quella che lo riscrive.

## 2. Le quattro classi di verdetto

La fase 3 e' la classificazione, ed e' obbligata. Ogni divergenza fra modello e realta' e' una di
queste quattro, e il trattamento e' diverso.

| Classe | Segnale | Trattamento |
|---|---|---|
| **(a) Il codice aveva un difetto** | il doc descriveva il comportamento giusto | si corregge il codice, il doc resta. `D4` e`D5` sono di questa classe |
| **(b) Il doc aveva un difetto** | il codice fa qualcosa di diverso e giusto | si annota la smentita con la prova, il doc va in `Storico`. `LOTO_HUB_SSOT_DEFINITIVO` e' di questa classe |
| **(c) Il modello era incompleto** | il codice fa qualcosa di giusto **non descritto da nessuna parte** | si scrive la regola nuova. Esempio: nessun documento definiva la struttura a 4 tier con il campo tier |
| **(d) Era una feature, non un difetto** | il codice ha qualcosa che sembra incoerente ma e' una scelta deliberata | **si ricostruisce la dottrina che lo rende giusto**. Questo e' il caso piu' costoso da riconoscere |

**La classe (d) e' quella che l'analisi automatica sbaglia piu' spesso, perche' un difetto e una
feature hanno lo stesso aspetto in un diff.** Il modello non puo' distinguerli da solo: serve
l'utente. Per questo la fase 2 prevede esplicitamente la domanda.

## 3. L'errore della dottrina Echo, analizzato con il ciclo

E' il primo caso reale, e serve da riferimento.

- **[1] SEGNALE.** L'utente: *"i whisper dei feedback che avrebbero lasciato utenti, sempre in
  maniera anonima e non pubblica come TripAdvisor, sarebbe stata una feature che il partner
  custode avrebbe potuto sbloccare col suo premium"*
- **[2] VERIFETTA.** Due letture: (i) la tabella contraddice la dottrina "niente recensioni";
  (ii) la dottrina vieta solo la **pubblicazione**, e il feedback privato col premium e' la feature.
  Il testo di `AGENTS.md` §4 dice *"only the B2B partner can read"*: decide la lettura (ii)
- **[3] CLASSIFICA.** Classe **(d)**: era una feature
- **[4] AGGIORNA.** Creato `DOCTRINA-ECHO.md` con la regola dei tre livelli, e scritta la regola
  permanente: **una divergenza che si spiega piu' semplicemente come feature realizzata che come
  errore, si tratta come feature**
- **[5] ESECUTI.** Rimosso "manca il legame" dai tre punti in cui avevo scritto l'errore

**Il costo dell'errore:** avevo scritto la cosa sbagliata in tre documenti diversi, e l'avevo
presentata come un blocco commerciale. Un errore di lettura presentato con sicurezza e' peggio di
un vuoto: occupa spazio nella decisione.

## 4. Le regole che il modello si e' date finora

Sono derivate dai casi reali, non dalla teoria. Ogni riga ha il caso che l'ha prodotta.

| # | Regola | Prodotta da |
|---|---|---|
| **AP1** | Una divergenza che si spiega come feature realizzata si tratta come feature | dottrina Echo |
| **AP2** | Un codice che dice "impossibile" va verificato a mano prima di emettere un verdetto | 3 errori di analisi automatica del 26/09 |
| **AP3** | Le verifiche negative si rilgono prima di diventare conclusioni | dottrina Echo |
| **AP4** | Un documento che si dichiara SSOT e' verificato sul **primo** oggetto che cita | `LOTO_HUB_SSOT_DEFINITIVO` |
| **AP5** | Il suffisso `_YYYY-MM-DD` non e' una data | 275 file duplicati con suffissi falsi |
| **AP6** | Un oggetto che ha 0 definizioni e >=2 usi e' il rischio massimo, non un dettaglio | `vw_pois_frontend` |
| **AP7** | Il confronto fra "0 hit in root" e "0 hit in archivio" va fatto su due glob distinti | `calculated_speed_kmh`, `cooldown` |
| **AP8** | Una colonna con una funzione commerciale ma senza schermo e' un funnel interrotto | `is_premium_unlocked` |
| **AP9** | Il codice che espone un'interfaccia non vuole dire che l'interfaccia e' voluta | 7 route tab, nessuna politica di visibilita' |
| **AP10** | Un errore RPC non e' una prova di assenza | `PGRST202` da una sonda GET senza parametri **non** significa che la funzione non esista: significa che ha parametri obbligatori. Per provare un'assenza serve `pg_proc` |
| **AP11** | Lo stato corrente si legge dal file, mai da un messaggio di commit | `git show 16d5460` diceva 1.0.2; `build.gradle` e `app.json` dicono **1.0.7**. Un commit descrive un momento, e il momento piu' recente non e' il presente (criterio **C13**) |
| **AP12** | Un file che non e' tracciato e' una perdita che non sa di essere tale | `android/` e' in `.gitignore`: `git ls-files android` = **0 file**. La versione e l'intero progetto di build vivono solo su disco, e nessuno lo aveva notato (criterio **C12**) |

## 5. Come il modello prevede, in pratica

Un modello predittivo non prevede il futuro del mercato: **prevede dove il progetto si spacca**.
I punti di rottura sono prevedibili con due soli controlli, ed e' quello che `tooling/verifica_coerenza.py`
esegue a ogni esecuzione:

| Segnale di rottura | Come lo si rileva | Cosa significa |
|---|---|---|
| **Oggetto citato che non esiste** | nome di tabella o vista in un doc, 0 definizioni | stai documentando un'idea |
| **Oggetto che esiste e non e' documentato** | tabella definita in migration, 0 menzioni nei doc | il modello e' indietro sul codice |
| **Numeri che divergono** | soglie, conteggi, nomi diversi fra doc e codice | due versioni della verita' |
| **Decisione aperta da troppi giorni** | `DECISIONI.md` con fase `aperta` | blocco accumulato |
| **Classe (d) non ancora classificata** | divergenza segnalata e non risolta | il rischio di errore di lettura |

**Le prime due righe sono l'unica previsione che conta in questo progetto**, perche' il fallimento
qui non e' un bug: e' costruire la cosa sbagliata con la documentazione sbagliata che te lo dice.

## 6. Cosa il modello NON puo' fare

Dichiaro i limiti, perche' un modello che promette piu' di quanto puo' fa piu' danni.

- **Non prevede il mercato.** Non sa se un'agenzia comprera'. Nessun documento dell'archivio contiene
  un prezzo o un cliente, e non li avro' finche' non li chiedi
- **Non decide al posto tuo.** Le decisioni su privacy, business model e dati restano tue (`AGENTS.md` §1, §7)
- **Non apprende da un singolo caso.** Una regola entra in §4 solo dopo un secondo caso che la
  conferma. Con un caso solo e' un'ipotesi, e sta scritto come tale
- **Non si auto-aggiorna.** Ogni passaggio del ciclo richiede che qualcuno lo faccia. Il modello puo'
  essere applicato, non puo' essere applicato da solo

## 7. Il prossimo passo che rende il modello misurabile

Un test che verifica che le regole AP1-AP9 reggano davvero, cioe' un file che le viola di proposito
come ho fatto col validatore. Serve perche' **un modello predittivo che non e' mai stato falsificato
non e' un modello predittivo**: e' una prosa con una tabella.

Al prossimo giro: `tooling/verifica_coerenza.py` con i casi di rottura della §5, piu' il
collaudo del falso positivo.

---

*Modello predittivo del 26/09/2026. Confidenza Media: 9 regole, di cui 8 derivate da un caso
reale e una (AP1) da un caso che ha corretto il modello stesso. Le previsioni riguardano la
coerenza interna, non il mercato.*
