---
id: A6
tipo: area
ambito: posizionamento-monetizzazione-e-canale-commerciale
stato: Bozza
confidenza: Bassa
owner: Agent
aggiornato: 2026-09-26
evidenza:
  - .agents/AGENTS.md:24
  - .agents/AGENTS.md:25
  - ../INVENTARIO_DOCUMENTAZIONE.md:60
---

# A6 - Commerciale: a chi si vende e con quale modello

> Risponde a: "qual e' il modello economico, a chi si vende, e la documentazione commerciale
> regge?"

`confidenza: Bassa` per il motivo dichiarato in §5: **il modello commerciale e' documentato in
modo frammentato e contraddittorio**, e la verifica richiede una decisione tua che non ho preso.
Non e' che non lo abbia letto: e' che non posso dichiararlo conforme senza di te.

---

## 1. Cosa dice il codice

Poche righe, ma decisive: il modello commerciale e' codificato in come il dato viene prodotto e
esposto, non in un documento.

| Fatto | Prova | Conseguenza commerciale |
|---|---|---|
| Il dato e' **passivo**: nessun sensore, solo geofencing GPS e NFC NTAG424 | `AGENTS.md` §2 | COGS hardware azzerato per il Comune: e' l'argomento che chiude la trattativa B2G |
| Il target pagante sono le **agenzie dati e turismo**, non i Comuni ne' i locali | `AGENTS.md` §5 | si vendono licenze a chi ha gia' i contratti pubblici, non ai Comuni |
| La **Shadow Validation** calcola la CO2 in locale (ISPRA/DEFRA) e campiona il **1%** via API esterne | `AGENTS.md` §5 | autorvolezza scientifica con COGS zero. E' la risposta obbligata a chi chiede "come garantite i dati" |
| Il ledger e' **immutabile** (`impact_transactions`) | `AGENTS.md` §7 | il dato e' **certificabile**. Senza immutabilita' non c'e' vendita B2B |
| Gli aggregati DaaS esistono con **griglia 110 m e bucket 15 min** | vedi A4 | e' il formato vendibile: GeoJSON a Enti e agenzie |
| L'esposizione ha **gate `is_loto_admin()` e revoca ad `anon`** | A4 | il partner non legge il DB: legge un report |
| Il partner interagisce via **bot WhatsApp**, non con una dashboard | A4, `src/app/download/page.tsx` | **Zero-UI**: nessun costo di supporto per l'esercente |
| Nessun upload di contenuti utente, nessuna recensione pubblica | `AGENTS.md` §4, legge Vault Mode | azzera il rischio legale di moderazione e i costi Cloud |

**Il dato che rende il modello vendibile e' la combinazione di due righe:** il dato e' passivo
(costo zero) e immutabile (certificabile). Tolli l'immutabilita' e non hai un prodotto, hai un
report plausibile.

## 2. Cosa dice la documentazione

Qui il disordine e' al suo massimo. Tre documenti, due versioni divergenti, nessuno indicizzato.

### `root/STRATEGIA_COMMERCIALE.md` (3.0 KB) - il piu' specifico, e non e' indicizzato

Contiene cose che **non trovo in nessun altro documento**:

- **Rete Doc (Doc Creativity)** come ombrello legale e fiscale in fase 0-to-1: azzera i costi di
  costituzione di una S.r.l. prima di validare il fatturato ricorrente
- **Posizionamento "SaaS White-Label di secondo livello"**: non in competizione frontale con
  InnovaPuglia, Exprivia, TIM Enterprise, AlmavivA, che fanno i macro-appalti
- **Clienti diretti = software house e agenzie** che hanno gia' i contratti per i portali turistici
  dei Comuni pugliesi
- **Proposta di valore**: licenza "chiavi in mano" e Zero-Code per vincere bandi Smart City senza
  costi di R&D
- **Acquirenti dei report DaaS = le compagnie di crociera** (Costa Crociere, MSC) e i major tour
  operator, per la **CSRD** (bilancio di sostenibilita' obbligatorio)

Quel ragionamento e' solido e specifico. **E' anche il meno raggiungibile**: nessuno lo trova,
perche' nessun indice lo cita.

### `root/PLAYBOOK_COMMERCIALE.md` vs `docs/commercial/commercial_playbook.md` - due redazioni divergenti

Entrambi trattano il paradigma TSaaSI e i 4 moduli economici (B2B2G, DaaS, B2B, B2C).
**0 righe sostanziali su 22 coincidono.** Non e' un duplicato da fondere meccanicamente: sono due
scritture indipendenti dello stesso argomento, e nessuna delle due e' stata scelta come vigente.

`docs/commercial/commercial_playbook.md` e' piu' recente nel nome del file e citato
nell'indice; il file root e' piu' vicino al modello TSaaSI nella sostanza. **Non ho verificato
l'attualita' dei contenuti**: un verdetto qui sarebbe un'arbitrio, non una verifica.

### `docs/commercial/partner_operative_documentation.md` e `whatsapp_bot_architecture.md` - non verificati

## 3. Direzione

**La direzione non e' decisa, e questa e' la ragione per cui l'area e' `Bozzza` con confidenza
`Bassa`.** Il modello e' coerente e differenziato, ma in tre punti non e' chiaro chi decide:

1. **La priorita' fra DaaS-B2G e DaaS-crociere.** Le agenzie comunali comprano la licenza
   Zero-Code; le crociere comprano il dato ESG. Sono due prodotti con due cicli di vendita
   diversi. `STRATEGIA_COMMERCIALE.md` li mette nello stesso paragrafo senza scegliere
2. **Il ruolo di Rete Doc.** E' un veicolo di fase 0-to-1 o permanente? Se permanente, la
   documentazione legale del progetto e' diversa
3. **La provenienza del CSRD come gancio.** Il paragrafo e' convincente, ma non e' collegato a
   nessuna specifica del prodotto: manca il passaggio da "le crociere devono certificare" a "cosa
   esattamente compriamo e a che prezzo"

La regola che le governa, appena le tre risposte ci saranno, e' gia' scritta in `AGENTS.md` §5:
**target pagante = agenzie dati e turismo**, vendita di **infrastruttura TSaaSI**, non di
software e non di servizi. E la regola che punisce la deviazione piu' comune: se una proposta
richiede di vendere qualcosa di diverso dall'infrastruttura, o di cambiare il target, la proposta
va discussa prima, non dopo.

## 4. Buchi e rischi

| Bucco | Gravita' | Effetto se resta aperto |
|---|---|---|
| **Documentazione commerciale spezzata in 3 pezzi non reconciliati** | Alto | nessuno sa quale vale. In un vendita, due versioni del modello economico significanoche i numeri si contraddicono |
| **Il documento piu' specifico non e' indicizzato** | Alto | `STRATEGIA_COMMERCIALE.md` contiene Rete Doc, il posizionamento di secondo livello e il gancio CSRD. Chi non lo trova, non lo usa |
| **3 direzioni commerciali aperte** | Alto | senza risposta, ogni proposta commerciale resta una preferenza personale |
| **Nessun prezzo, nessun pacchetto, nessun SLA** | Alto | la dashboard mostra *cosa* si vende, non *quanto*. Senza prezzo non c'e' DaaS |
| **Nessun percorso Zero-UI documentato per l'esercente** | Medio | esiste l'architettura (bot WhatsApp) ma non c'e' il doc operativo che dice all'esercente cosa succede quando scansiona |
| **Il CSRD non e' collegato a una specifica** | Medio | un gancio commerciale che non ha un prodotto collegato non si chiude |

## 5. Cosa NON fare in questa area

- **Non trattare nessuna delle tre versioni come vigente.** Non e' deciso. Fino a decisione,
  `STRATEGIA_COMMERCIALE.md` resta il documento piu' ricco di contenuto specifico
- **Non vendere ai Comuni.** Il target e' l'agenzia che ha il contratto. Cambiare interlocutore
  cambia il canale, la legge 5
- **Non vendere software, licenze d'uso o servizi di consulenza.** Si vende infrastruttura TSaaSI
  come servizio. E' la frase che definisce il modello
- **Non promettere report aggregati individuali o nominativi.** Il dato vendibile e' aggregato a
  griglia 110 m e bucket 15 min, e con revoca ad `anon`. Promettere il dato fine significa promettere
  di azzerare l'hardening che A4 ha appena costruito
- **Non aggiungere un costo di build cloud "solo per il DaaS".** Il modello sta interamente nel
  costo marginale zero: un'eccezione qui cancella il vantaggio

## 6. Prossima verifica

Rispondere alle 3 domande di §3. Con le risposte, l'area passa a `Vivente` e i tre documenti si
reconciliano in uno solo, che sara' l'SSOT di questo `ambito`. Il resto dei documenti commerciali
diventa storico con un link.

---

*Area A6 - confidenza Bassa dichiarata. Motivo: modello frammentato in 3 redazioni e 3 direzioni
non decise. Se il modello fosse uniforme, questa area avrebbe confidenza Alta.*
