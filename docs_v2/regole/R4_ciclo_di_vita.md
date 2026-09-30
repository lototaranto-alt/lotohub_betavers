---
id: R4
tipo: regola
ambito: ciclo-di-vita-di-un-documento
stato: Vivente
confidenza: Alta
owner: Agent
aggiornato: 2026-09-26
evidenza:
  - docs/FINE_SESSIONE_PROTOCOLLO.md (il protocollo di chiusura esiste gia' nella v1, FASE 1-5)
  - ../INVENTARIO_DOCUMENTAZIONE.md sezione 5 (stati dichiarati nell'indice ma assenti nei file)
---

# R4 - Ciclo di vita: come un documento nasce, vive e muore

> Risponde a: "quando correggo un doc, devo cambiarne anche lo stato? chi lo dichiara Vivente?"

---

## 1. I tre stati

| Stato | Significato | Si consulta per | Si aggiorna |
|---|---|---|---|
| **Vivente** | la fonte corrente dell'ambito. Se un altro documento ne parla, **linka** questo | prendere decisioni | sì |
| **Bozza** | discussione o proposta non ancora costruita. Non e' vincolante | capire le opzioni | sì |
| **Storico** | istantanea datata o contenuto superato. Non e' piu' vincolante | capire come si e' arrivati a una decisione | **no**: si appende una nota e basta |

**Il default e' Bozza.** Un documento nasce Bozza e diventa Vivente solo dopo una verifica.
Questo e' l'inverso della v1, dove l'indice dichiarava `Vivente` per 30 documenti di cui 40 su 45
non avevano nemmeno il blocco di stato: lo stato era dichiarato **fuori** dai file, quindi non
controllabile e inaffidabile. Qui lo stato e' **dentro** il file, e il validatore lo legge.

## 2. Le transizioni

```
                 +-----------+
                 |  Bozza    |   nasce ogni idea, anche incompleta
                 +-----+-----+
                       |  verifica su codice (R2) + ratifica (R1)
                       v
   superata da     +-------------+
   un altro doc -->|   Vivente    |  unica casa dell'ambito
   o da DECISIONI  +------+------+
                       |
                       |  il codice cambia, o una decisione la supera
                       v
                 +-------------+
                 |  Storico    |  congelato, con link al successore
                 +-------------+
```

**Le transizioni consentite sono solo queste tre.** Non si torna da Storico a Vivente: un documento
superato che torna attivo significa che la documentazione precedente non era mai stata verificata,
e il caso va registrato come decisione, non risolto con una freccia.

**Nessun documento viene cancellato.** In v1 la memoria del percorso si e' persa perche' gli agenti
hanno preferito sostituire che archiviare. Un documento che sparisce non lascia traccia del proprio
errore, e l'errore torna sotto una forma diversa.

## 3. Quando un documento diventa Storico

Quando una delle tre cose accade:

1. **Il codice lo ha smentito.** Esempio reale: `docs/LOTO_HUB_SSOT_DEFINITIVO.md` descrive
   `esg_raw_logs`, che non e' mai esistita. Non si corregge silenziosamente: si marca Storico e in
   `A1_fondazione.md` si scrive la smentita con la prova. Il file originale resta leggibile, con la
   smentita accanto.
2. **Un altro documento ne ha preso l'ambito.** Il documento vecchio va in Storico con un link al
   nuovo. I due non si sovrapongono piu'.
3. **Una decisione in `DECISIONI.md` lo ha superato.** Serve l'esito della decisione, non il
   silenzio.

## 4. Il registro delle decisioni

`DECISIONI.md` e' il punto in cui il dubbio smette di essere un dubbio. Una decisione passa tre
fasi, e resta visibile in tutte e tre:

| Fase | Significato | Nella tabella |
|---|---|---|
| `aperta` | la domanda e' posta, le opzioni sono elencate, **manca la tua risposta** | `aperta` + opzioni + chi decide |
| `presa` | hai deciso. Si scrive cosa e perche' | `presa` + esito |
| `applicata` | la decisione e' riflessa nel codice, con il `file:linea` che lo dimostra | `applicata` + prova |

Una decisione `presa` che non e' mai arrivata nel codice e' una decisione non eseguita. Il passaggio
alla terza fase e' quello che rende il registro una fonte di verita' e non un diario delle intenzioni.

**Regola che viene da `AGENTS.md` §1 e che questo registro rende visibile:** nessuna decisione su
modello di business, privacy o dati viene presa dall'agente. L'agente propone, tu decidi, il
codice dimostra.

## 5. La cadenza

Non c'e' una scadenza fissa: un documento Vivente invecchia quando il codice che descrive cambia.
La verifica si fa in tre momenti, che sono anche quelli che gia' esistono nel progetto:

1. **A fine sessione** (`FINE_SESSIONE_PROTOCOLLO.md` v1, FASE 5): si aggiorna cio' che e' cambiato
   e si esegue il validatore
2. **Prima di una modifica che tocca piu' aree**: si rileggono le aree coinvolte
3. **Prima di un rilascio**: tutte le aree `Vivente` con `confidenza: Media` o `Bassa` diventano
   il lavoro della sessione

La regola pratica: **un'area non viene toccata da un intervento se la sua area non e' stata
riletta.** Il costo e' minimo e previene l'errore tipico della v1: implementare qualcosa e
scoprire dopo che il doc che lo descriveva era sbagliato da tre settimane.

## 6. Trattamento dei documenti preesistenti (v1)

La v1 non viene convertita. Per ogni file di `docs/` vale una di tre etichette, assegnata in
`INVENTARIO_DOCUMENTAZIONE.md` e non rivalutata qui:

- **VIGENTE ma in v1** -> resta in v1, ma ogni riferimento passa da v2 al file v2 corrispondente
- **SUPERSEDUTO** -> in v1 resta com'e', in v2 c'e' la smentita con la prova
- **STORICO** -> congelato, non si piu' modificare

Nessun file v1 viene cancellato o riscritto. La memoria del percorso vale quanto l'errore che ha
generato.

---

*Regola R4. Nato Bozza, diventa Vivente solo se verificato, muore in Storico ma non sparisce.*
