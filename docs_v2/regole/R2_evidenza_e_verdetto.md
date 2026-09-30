---
id: R2
tipo: regola
ambito: metodo-di-verdetto-su-evidenza
stato: Vivente
confidenza: Alta
owner: Agent
aggiornato: 2026-09-26
evidenza:
  - ../INVENTARIO_DOCUMENTAZIONE.md sezione 1 (perche' la cronologia ha gia' mentito)
  - sessione 26/09: il mtime di .git di loto-app-prerelease risultava del 25/09, il reflog diceva 11/09 22:40
---

# R2 - Si decide su evidenza, non su cronologia

> Risponde a: "come stabilisco se un'affermazione e' vera?"

---

## 1. Perche' la cronologia e' bandita come prova

Tre fatti reali di questa sessione, per non dimenticare:

1. La cartella `.git` di `Desktop\loto-app-prerelease` risultava modificata il 25/09. Il reflog
   diceva 11/09 22:40. Era un artefatto di mtime creato dal mio stesso `git status`.
2. Il worktree `fix-conversation-stuck-issue` risultava con directory attive a settembre. Era
   **vuota**: 0 file, mai popolata da git. L'mtime diceva che il lavoro era li.
3. I documenti hanno date di modifica tutte uguali al 09/09 11:42:57, lo stesso identico secondo.
   Non e' il momento in cui sono stati scritti: e' il momento in cui sono stati copiati.

**Conclusione:** mtime, dimensione, nome del file e numero di revisioni non provano niente in
questo progetto. Sono rumore. Un verdetto basato su di loro e' un'allucinazione con data.

## 2. I tre livelli di evidenza

| Livello | Fonte | Uso |
|---|---|---|
| **A** | codice in `C:\loto_app`, `.agents/AGENTS.md`, migration in `supabase/`, log Git | **produce il verdetto** |
| **B** | documenti che dichiarano di essere SSOT, handoff, report | generano **ipotesi** da verificare al livello A |
| **C** | mtime, dimensione, nome del file, cartelle, conteggi, "l'ho sentito dire prima" | **mai**. Se e' tutto quello che hai, il verdetto e' `non verificato` |

Il livello B non e' inutile: e' un motore di ricerca. "Secondo `gamification_hooks_analisi.md` la
cadenza e' ogni 2 livelli" e' un'ipotesi; poi si apre `utils/levelUtils.ts:17-21` e si vede se
`SECTION_UNLOCK_LEVELS` dice davvero 2, 4, 6, 8, 20. Il passaggio dal B al A e' il lavoro vero.

## 3. Come si scrive un'affermazione verificabile

Un'affermazione non verificabile non entra in v2. Si riscrive cosi':

- **non** "la gamification e' ben impostata"
- **ma** "la cadenza di sblocco sezioni e' ogni 2 livelli" **+** "prova: `utils/levelUtils.ts:17-21`"

Le tre forme ammesse sono:

| Forma | Significato |
|---|---|
| `VERIFICATA` + riferimento `file:linea` | confermata sul codice in questa sessione |
| `SMENTITA` + riferimento `file:linea` | il codice dice il contrario: va documentato perche' il doc mente |
| `NON VERIFICATA` + motivo | dichiarato, non aggirato. E' un risultato, non una colpa |

Esempio reale, tratto dall'area gamification:

- "Il cap anti-flood e' di 3 carte" -> **SMENTITA**. Il codice non ha clamp: un salto da LV1 a LV10
  produce 1 LEVEL_UP + 2 WHISPER + 4 REVEAL + 1 RITO = 8 carte in coda
  (`components/GamificationTransitionManager.tsx:43-49`).

## 4. `confidenza`: tre valori, e cosa obbliga a dichiarare

Il frontmatter di ogni documento porta `confidenza: Alta | Media | Bassa`.

| Valore | Quando | Cosa e' obbligato a dichiarare |
|---|---|---|
| **Alta** | il contenuto e' verificato su codice o decisioni tue, ed e' completo per l'ambito dichiarato | niente |
| **Media** | il nucleo e' verificato ma ci sono zone non ispezionate | **quali** zone mancano |
| **Bassa** | la documentazione esistente e' contraddittoria o non verificabile, e v2 la riassume con dubbi | **quale** e' il dubbio, in una riga |

Una riga con `confidenza: Bassa` e il dubbio esplicito vale piu' di un documento intero pieno di
affermazioni sicure ma non verificate. Il dubbio dichiarato e' un traguardo: l'inventario
ricostruito senza criteri ne contiene 12, e quelle 12 sono gia' un piano di lavoro.

## 5. Regole pratiche

- **Una riga, una prova.** Se non riesci a scrivere il riferimento `file:linea`, non sei
  sicuro dell'affermazione. Scrivila come `NON VERIFICATA`.
- **Non estendere un verdetto.** Se `A` e `B` coincidono, il verdetto e' su `A`. Se `B` e `C`
  coincidono, non hai un verdetto.
- **Un documento smentito non si cancella.** Si lascia com'e' e si annota la smentita in v2: e'
  la prova che la verifica serve a qualcosa. Un documento che sparisce non lascia traccia del
  proprio errore, e l'errore torna.
- **Non usare le sessioni come fonte.** La cronologia delle chat serve per sapere **cosa e' stato
  chiesto**, non **cosa e' stato fatto**. La differenza e' il motivo per cui questo progetto ha
  una dashboard che mostra zero dati.

## 6. Se l'evidenza contraddice la v1, cosa faccio

Lo registro come `SMENTITA` dentro l'area di competenza, con la prova. Non correggo il file v1:
non e' il mio permesso di scrittura, e correggerlo nasconderebbe l'errore invece di registrarlo.
Se la smentita ha conseguenze sul codice, quella e' una **decisione aperta** e va in
`DECISIONI.md`.

---

*Regola R2. "Non ho trovato" e' un verdetto valido. "Credo che sia cosi" non e' un verdetto.*
