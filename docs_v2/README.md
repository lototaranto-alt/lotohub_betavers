---
id: COSTITUZIONE
tipo: costituzione
stato: Vivente
confidenza: Alta
owner: Agent
aggiornato: 2026-09-26
evidenza: []
---

# Costituzione del contesto L.O.T.O. Map (v2)

> Questo e' il **documento radice**. Se lo leggi per primo e hai capito le tre leggi, non hai
> piu' bisogno di leggere altro per orientarti.

---

## 1. Perche' esiste questa v2

`docs/` (v1) contiene 45 documenti nati da 4 agent diversi in 5 mesi. Non e' disordinata per
casualita': ogni agent ha introdotto la propria "Single Source of Truth" e nessuno ha mai
dichiarato superata la versione precedente. Risultato: **quattro documenti che si dichiarano la
verita'**, due dei quali in contraddizione diretta, e una guida di recupero con link a file
inesistenti.

Il danno non e' estetico. Un agente che li legge in ordine diverso arriva a conclusioni diverse,
e quelle conclusioni finiscono nel codice. E' successo: `docs/LOTO_HUB_SSOT_DEFINITIVO.md` descrive
una tabella (`esg_raw_logs`) che non e' mai esistita e un backup via email che e' stato revocato
esplicitamente. Se non lo fermi, il prossimo agente lo implementa.

**Questa v2 non sostituisce `docs/`. La affianca e la rende consultabile per area.**
Nessun file di `docs/` o della root e' stato modificato o cancellato. La v1 resta la memoria del
come siamo arrivati qui; la v2 e' il modo di procedere da adesso.

---

## 2. Le tre leggi

### Legge 1 - Una sola SSOT per ambito
Ogni argomento ha **un** file che lo dichiara. Nessun file puo' rivendicare un ambito gia' coperto.
Se due file vogliono lo stesso ambito, uno dei due e' sbagliato per definizione: vedi `R1`.

### Legge 2 - Ogni affermazione porta la sua prova
Un documento dice **cosa** e **come lo sappiamo**. I tre livelli di evidenza sono in `R2`.
Nessuna affermazione entra in v2 senza almeno un riferimento a codice, migration o log Git.
Una riga con `confidenza: Bassa` e il motivo del dubbio e' **piu' utile** di una riga falsa con
`confidenza: Alta`.

### Legge 3 - Il documento registra anche la direzione
Un doc che dice solo "cosa c'e' adesso" invecchia in tre settimane. Ogni area dichiara
`direzione:` — dove va, e cosa la governa. Se la direzione non e' ancora stata decisa, si scrive
`direzione: da decidere` e la decisione entra in `DECISIONI.md`. IlIGNOTO esplicito batte
l'inferenza.

---

## 3. Come si legge

| Vuoi... | Vai a |
|---|---|
| capire l'organizzazione e le regole | questo file |
| **sapere come si sceglie fra documenti che si contraddicono** | **`regole/R5_criteri_di_scelta.md`** |
| **sapere che cosa intendevano i documenti sparsi nelle cartelle** | **`RICOSTRUZIONE.md`** |
| **sapere che forma deve avere l'app quando e' finita** | **`aree/A7_struttura_esperienza.md`** |
| sapere chi decide in caso di conflitto | `regole/R1_autorita.md` |
| capire come ho stabilito un fatto | `regole/R2_evidenza_e_verdetto.md` |
| scrivere o modificare un documento | `regole/R3_anatomia.md` + `template/AREA.md` |
| sapere come un doc cambia stato | `regole/R4_ciclo_di_vita.md` |
| il quadro di una sola area | `aree/A*.md` |
| cosa e' ancora da decidere | `DECISIONI.md` |
| capire della v1 e del suo disordine | `INVENTARIO_DOCUMENTAZIONE.md` |

---

## 4. Mappa delle aree

| Area | Domanda a cui risponde | Stato | Confidenza |
|---|---|---|---|
| `A1_fondazione.md` | Quali principi sono vincolanti e quale documento li governa? | Vivente | Alta |
| `A2_gamification.md` | Come funziona la progressione e dove sta la sua SSOT? | Vivente | Alta |
| `A3_dati_e_sql.md` | Qual e' la catena dati canonica e quali script sono morti? | Vivente | Media |
| `A4_dashboard_daas.md` | Come sono esposte le viste DaaS e chi puo' leggerle? | Vivente | Alta |
| `A5_app_mobile.md` | Qual e' lo stato dell'app e cosa non e' ancora cablato? | Vivente | Media |
| `A6_commerciale.md` | A chi si vende, con quale modello, qual e' il posizionamento? | Bozza | Bassa |
| **`A7_struttura_esperienza.md`** | **Che forma deve avere l'app quando e' finita, e quali opzioni sono sostenibili?** | **Bozza** | Media |

Documenti di metodo:

| Doc | Domanda a cui risponde |
|---|---|
| `regole/R5_criteri_di_scelta.md` | **I 10 criteri che il progetto ha dimostrato di seguire, e come si sceglie fra documenti che si contraddicono** |
| `RICOSTRUZIONE.md` | Che cosa intendevano i 579 documenti sparsi nelle cartelle, e quanto di quell'intento esiste davvero |

Il dettaglio di ogni area, con prove e direzione, nei file indicati.

---

## 5. Il perimetro

**Dentro** `docs_v2/`: contesto operativo dell'agente. Si aggiorna, si valida, ha un ciclo di vita.
**Fuori** `docs/`: la v1. Si consulta per ricerca storica, non si modifica, non si cita come regola.

Se una domanda riguarda il codice, la risposta sta nel codice. La documentazione serve a
**direzionare la lettura**, non a sostituirla. Se un'area non e' documentata in v2, e' un buco
dichiarato: si scrive `direzione: da documentare` e si mette in `DECISIONI.md`.

---

## 6. Come si estende (la parte che rende tutto scalabile)

Aggiungere un'area e' un'operazione ripetibile, non un evento:

1. Copia `template/AREA.md` in `aree/A<N>_<nome>.md`
2. Compila il frontmatter, **in particolare `ambito:`** (deve essere unico: e' il dominio che
   impedira' a un altro documento di rivendicare la stessa area)
3. Scrivi la direzione. Se non e' decisa, dichiaralo e apri la decisione in `DECISIONI.md`
4. Aggiungi la riga in `MANIFEST.json` e in questo file, sezione 4
5. Esegui il validatore: deve uscire pulito

```powershell
python docs_v2\tooling\validate.py
python docs_v2\tooling\build_manifest.py
```

Il validatore fallisce se manca il frontmatter, se un `ambito:` e' duplicato, se un file del
manifest non esiste, se un documento non e' nel manifest, o se un link relativo e' rotto.
**Questo e' il meccanismo che tiene insieme la struttura quando cresce**, ed e' per questo che il
frontmatter di v2 e' YAML e non commenti HTML: deve essere leggibile da una macchina.

---

## 7. Cosa questo documento non promette

- **Non promette completezza.** Le aree sono seminate con quello che ho verificato. Dove non ho
  verificato, `confidenza: Bassa` o `direzione: da documentare` lo dicono.
- **Non sostituisce il codice.** Se v2 e il codice si contraddicono, **il codice vince** e v2 va
  corretto. Il dubbio si registra in `DECISIONI.md`, non si risolve con un paragrafo.
- **Non autorizza esecuzioni.** Le migration le applichi tu. V2 non contiene comandi da eseguire,
  per principio.

---

*Contesto v2 creato il 2026-09-26. Documento radice. Nessuna modifica a `docs/` o alla root del repo.*
