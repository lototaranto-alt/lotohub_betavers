---
id: TEMPLATE-DECISIONE
tipo: template
stato: Vivente
confidenza: Alta
owner: Agent
aggiornato: 2026-09-26
evidenza: []
---

# Template - Decisione

> Una decisione esiste per far smettere un documento di essere riscritto ogni settimana.
> Copia questo blocco in `DECISIONI.md` e usa **una riga per fase**: la domanda, poi l'esito,
> poi la prova nel codice.

```markdown
## D<n> - <titolo in una riga>

| campo | valore |
|---|---|
| **Stato** | `aperta` |
| **Chi decide** | utente |
| **Aperta il** | YYYY-MM-DD |
| **Blocca** | cosa non si puo' fare finche' resta aperta |

### Domanda
La domanda in una frase, formulata in modo che le risposte siano verificabili.

### Opzioni

| # | Opzione | Pro | Contro | Prova |
|---|---|---|---|---|
| 1 | _es:_ correggere ora | B2 rende inutilizzabile la heatmap | tocca la catena gia' validata | `migrations/x.sql:221-239` |
| 2 | _es:_ registrare come debito | zero rischio immediato | B3 riapre l'exploit XP | `migrations/x.sql:189-227` |

### Raccomandazione
Quale opzione e perche'. Una frase. Se non c'e' raccomandazione, dillo: la decisione e' tua.

### Esito
*(compilato quando lo stato passa a `presa`)*
> **Deciso il <data>:** <opzione N>. Motivo: <perche'>. Effetto atteso: <cosa deve cambiare>.

### Applicazione
*(compilato quando lo stato passa ad `applicata`)*
> **Applicato il <data>.** Prova: `percorso/file.ts:12` mostra <cosa>. Verificato con: <come>.

### Note
Qualsiasi cosa che eviti di riaprire il dibattito. Se una riapertura e' voluta, scrivi **perche'**
prima di riaprirlo.
```

---

## Le tre fasi, e perché non si saltano

| Fase | Significato | Se manca |
|---|---|---|
| `aperta` | la domanda e' posta, le opzioni hanno le prove | la decisione si rifa da capo, come in v1 |
| `presa` | hai deciso, con il motivo | si riscrive la stessa domanda con parole diverse |
| `applicata` | il codice lo dimostra | decisione mai eseguita, archiviata come fatta |

**La fase `applicata` e' l'unica verifica reale.** Un documento che registra `presa` senza
`applicata` racconta un'intenzione. Il passaggio alla terza fase richiede un `file:linea`: se
l'esito e' "il codice e' gia' cosi", il `file:linea` e' la prova che non ho fatto niente e il
problema non esiste.

## Vincoli di redazione

- **Nessuna decisione su privacy, dati o modello di business la prende l'agente.** Proponi, decidi
  tu, verifica il codice. (`AGENTS.md` §1 e §7)
- **Una decisione senza prove non entra.** Ogni riga della tabella opzioni porta un riferimento.
- **Le decisioni superate non si cancellano.** Passano a `superata` con il link alla decisione che
  le ha sostituite: e' l'unico modo per capire perche' il codice fa una cosa che sembrava assurda.
- **Una decisione `applicata` che il codice nega va ri aperta**, non archiviata. Il codice ha ragione
  e la documentazione e' sbagliata.

---

*Template DECISIONE. Una decisione non chiusa e' la causa principale dei documenti che si contraddicono.*
