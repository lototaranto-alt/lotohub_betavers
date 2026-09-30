---
id: TEMPLATE-AREA
tipo: template
stato: Vivente
confidenza: Alta
owner: Agent
aggiornato: 2026-09-26
evidenza: []
---

# Template - Area

> Copia questo file in `aree/A<N>_<nome>.md` e compila tutto. Se un campo non lo sai, scrivi
> `da decidere`: è un risultato, non una lacuna. Cancellalo solo dopo averlo deciso in `DECISIONI.md`.
>
> **Ricorda:** `evidenza: []` con `confidenza: Alta` fa fallire il validatore. È voluto.

```yaml
---
id: A<N>                      # univoco, mai riciclato dopo l'archiviazione
tipo: area
ambito: <dominio-verbale-univoco>   # il token che impedisce a un altro doc di rivendicare l'area
stato: Bozza                 # default: Bozza. Diventa Vivente solo dopo verifica (R4)
confidenza: Bassa            # Alta | Media | Bassa
owner: Agent
aggiornato: YYYY-MM-DD
evidenza:
  - percorso/del/file.ts:12
  - percorso/dell altro/file.md
---
```

---

# A<N> - Titolo dell'area

Una riga: l'area risponde a **questa** domanda. Se la domanda non e' quella che ti interessa,
l'area sbaglia a esistere.

## 1. Cosa dice il codice

Verificato in questa sessione. Ogni riga con `file:linea`.

| Affermazione | Verdetto | Prova |
|---|---|---|
| _es:_ la cadenza e' ogni 2 livelli | VERIFICATA | `utils/levelUtils.ts:17-21` |
| _es:_ il cap anti-flood e' 3 carte | SMENTITA | `components/X.tsx:43-49` |
| _es:_ i backup email esistono | NON VERIFICATA | nessun `signInWithPassword` in `app/`: nessun modulo email |

Cosa **non** e' stato verificato, detto chiaramente:

- _es:_ la logica di calcolo CO2 - non ho seguito il percorso dentro `SincroAvventura.ts`

## 2. Cosa dice la documentazione

Le voci documentate, con il verdetto di conformita'. Quando un doc mente, si scrive **perche'**
e con la prova: e' la parte che vale.

| Documento | Cosa afferma | Conformita' |
|---|---|---|
| `docs/xxx.md` | _es:_ | VERIFICATA / SMENTITA (prova) |

## 3. Direzione

Dove va l'area e **cosa la governa**. Se non e' deciso:

> **direzione: da decidere.** Nessuna decisione registrata. Le opzioni sono in `DECISIONI.md` (D<n>).

Quando e' deciso, la direzione si scrive come una conseguenza, non come un desiderio:

> L'area va verso **X**. La regola che la governa e' **Y** (`file:linea`), decisa il `<data>`
> in `DECISIONI.md` (D<n>). Il criterio per fermarsi e' **Z**.

## 4. Buchi e rischi

L'obbligo piu' importante del documento. Se un'area e' senza rischi, non e' stata guardata.

| Buco / rischio | Gravita' | Effetto se resta aperto |
|---|---|---|
| _es:_ la catena non e' atomica | Blocker | doppio XP con richieste concorrenti |
| _es:_ nessun backfill | Blocker | le righe esistenti restano invisibili ai query |

## 5. Cosa NON fare in questa area

Le trappole gia' individuate. Questa sezione risparmia a chi arriva dopo di riscoprirle.

- Non applicare `docs/xxx.sql`: la funzione ha la stessa firma ma semantica opposta
- Non fidarti di `<nome file>`: punta a una tabella che non esiste

## 6. Prossima verifica

La singola azione che farebbe salire `confidenza` di questa area. Una riga.

> Applicare `supabase/migrations/xxx.sql` sul cloud e rileggere le viste: passa a Alta.

---

*Area A<N>. Verificata il <data>. Conformita' a `docs_v2/regole/R2_evidenza_e_verdetto.md`.*
