---
id: R3
tipo: regola
ambito: anatomia-di-un-artefatto
stato: Vivente
confidenza: Alta
owner: Agent
aggiornato: 2026-09-26
evidenza:
  - docs/README.md sezione 1 regole 1-5 (criterio ereditato dalla v1)
  - ../INVENTARIO_DOCUMENTAZIONE.md sezione 2 (88% dei file v1 senza metadati)
---

# R3 - Anatomia di un documento: la struttura che si replica

> Risponde a: "come scrivo un documento che sia verificabile, estensibile e che un altro agente
> possa aggiornare senza indovinare?"

---

## 1. Il frontmatter

Ogni file di `docs_v2/` inizia con un blocco YAML. In v1 il blocco era in commenti HTML: qui e' YAML
perche' deve essere **leggibile da `tooling/validate.py`**. Una convenzione che nessuno puo'
controllare non e' una convenzione, e' una speranza.

```yaml
---
id: A2                      # identificatore univoco, mai riciclato
tipo: area | regola | costituzione | decisione | template
ambito: <dominio univoco>   # OBBLIGATORIO su aree e regole. E' il token anti-conflitto
stato: Vivente | Bozza | Storico
confidenza: Alta | Media | Bassa
owner: Agent | <area>
aggiornato: YYYY-MM-DD
evidenza:                   # elenco di file:linea che sostengono il contenuto
  - percorso/file.ts:12
  - percorso/altro.md
---
```

**I cinque campi che rendono il sistema intelligente:**

- `ambito` e' il cuore: due documenti con lo stesso `ambito:` sono un errore che il validatore
  segnala. E' il meccanismo che ha fallito in v1, dove l'autorita' dipendeva da chi scriveva per
  ultimo.
- `stato` dice se il documento e' guardabile (`Vivente`), non ancora (`Bozza`), o conservato
  (`Storico`). Le regole di transizione sono in R4.
- `confidenza` impedisce la finzione di completezza. Se e' `Bassa`, il corpo deve dire **perche'**
  in una riga.
- `evidenza` e' l'obbligo di R2 reso meccanico: elenca le prove. Un documento con `evidenza: []`
  e `confidenza: Alta` e' incoerente, e il validatore lo segnala.
- `aggiornato` e' la **data dichiarata dell'ultima verifica**, non il timestamp del file. Due
  righe nella stessa settimana portano date diverse: e' normale, e non e' un difetto.

## 2. Il corpo: quattro sezioni fisse

Un'area risponde sempre alle stesse quattro domande, nello stesso ordine. E' questa costanza a
permettere a un agente di sapere dove guardare.

```markdown
## 1. Cosa dice il codice
Verificato. Elenco di affermazioni con `file:linea`.

## 2. Cosa dice la documentazione
Le voci documentate, con nota di conformita' o smentita.

## 3. Direzione
Dove va l'area e cosa la governa. `da decidere` se non e' stabilito.

## 4. Buchi e rischi
Cosa manca, cosa e' aperto, cosa potrebbe indurre in errore.
```

La sezione 4 non e' un obbligo formale: e' la piu' importante. Un'area senza rischi dichiarati
e' un'area che non e' stata guardata abbastanza.

## 3. Regole di scrittura

| Regola | Motivo |
|---|---|
| Mai piu' di una casa per argomento | v1 ha 4 "SSOT": e' costato |
| Non copiare, collegare | il secondo copia deperisce e contraddice il primo |
| Non scrivere "gestito", "ottimizzato", "implementato" | parole che non distinguono il codice di una sua descrizione |
| Non citare un file esterno senza dirlo | `docs_v2` non sa nulla di `brain\` e `LOTO_DOCS_MASTER` |
| Non inserire comandi da eseguire | le migration le applichi tu: e' una regola di `AGENTS.md`, non una mia scelta |
| Un documento sopra ~300 righe si divide | oltre quella soglia non si rilegge, quindi non si mantiene |
| Se un documento muore, si marca `Storico` e si lascia il link a chi lo sostituisce | perche' chi lo cerca deve trovare il successore |

## 4. Le parole da non usare

Dalla v1, con esempi reali di cosa intendevano davvero:

| Scritto | Verificato invece |
|---|---|
| "gamification implementata" | "cadenza 2/4/6/8/20 in `levelUtils.ts:17-21`" |
| "modali anti-flood" | "aggregazione del level-up in `levelUtils.ts:315-336`; **nessun cap sulle carte**" |
| "SSOT definitivo" | "unico documento con `ambito:` in questo dominio" |
| "dashboard DaaS pronta" | "viste in `20260925120000_admin_dashboard_hardening.sql`, committate in `bb0fa37`, **non applicate su cloud**" |
| "backup protetto" | "solo QR locale da `bc37c59`; email/password rimosse: 0 occorrenze di `signInWithPassword` in `app/`" |

Una frase e' utile se un altro agente puo' **verificarla o confutarla** in un minuto. Se non puo',
e' rumore.

## 5. Perche' YAML e non commenti HTML

Perche' il validatore deve poter rispondere a tre domande che a mano non si controllano:

1. esiste un `ambito:` duplicato? (conflitto di autorita')
2. un documento con `confidenza: Alta` ha `evidenza: []`? (finzione di completezza)
3. un file esiste ma non e' nel manifest? (documentoorfano che nessuno troverebbe)

In v1 nessuna delle tre era controllabile, ed e' esattamente percio' che 45 documenti hanno
potuto divergere senza che nulla lo segnalasse. La differenza non e' lo stile: e' l'automatico.

## 6. Checklist prima di dichiarare finito un documento

- [ ] il frontmatter ha tutti i campi, e `ambito:` e' unico
- [ ] `evidenza:` non e' vuota se `confidenza: Alta`
- [ ] ogni affermazione che sembra certa ha un `file:linea`, o e' marcata `NON VERIFICATA`
- [ ] la sezione 4 elenca almeno un buco o un rischio
- [ ] `direzione:` e` dichiarata, anche se e' "da decidere"
- [ ] nessun comando da eseguire
- [ ] nessun riferimento a un file di cui non ho verificato l'esistenza
- [ ] `python docs_v2\tooling\validate.py` esce con codice 0

---

*Regola R3. La struttura e' la parte che si replica. Il contenuto cambia, la forma no.*
