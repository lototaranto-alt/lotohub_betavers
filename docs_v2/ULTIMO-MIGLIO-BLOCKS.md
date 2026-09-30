---
id: ULTIMO-MIGLIO-BLOCKS
tipo: analisi
ambito: blocchi-di-lavoro-per-chiudere-la-struttura
stato: Vivente
confidenza: Alta
owner: Agent
aggiornato: 2026-09-26
evidenza:
  - docs_v2/FORMA-DEFINITIVA.md:1
  - docs_v2/PianoOperativo-26-09.md:1
  - app/_layout.tsx:58
  - components/LotoPassRecoveryScanner.tsx:55
---

# L'ultimo miglio, a blocchi

Piano operativo per chiudere la struttura. **Un blocco alla volta, con verifica, e non si passa
al successivo prima che il precedente sia chiuso e provato.**

Due regole che vengono prima di tutto:

- **`docs_v2/` non si committa** e non è fonte di verità. È materiale di consultazione.
  Le dichiarazioni in `docs_v2` sono **ipotesi** finché non sono state verificate sul codice o sul
  cloud. Il Blocco 1 esiste per questo.
- **Il cloud non si interroga più col refresh token del device.** Supabase lo ruota a ogni uso e
  bruciarlo innesca il Deep Recovery del Blocco 0. Per il cloud: SQL editor, o un accesso
  `service_role` esplicito, o chiedere a te.

---

## Sequenza e dipendenze

```
Blocco 0  Fermare la perdita di dati          ← ATTIVO: distrugge dati, ogni giorno
    │
Blocco 1  Collaudare l'archivio               ← cosa crediamo davvero
    │
    ├── Blocco 2  DB riproducibile (D9)
    └── Blocco 3  Coesione dell'app
              │
              └── Blocco 4  Catena di scansione (dipende da D5, D6)
                        │
                        └── Blocco 5  Prova sul campo
```

Il Blocco 0 sta per primo e non è un giudizio di valore: **era l'unico blocco che, senza lavoro da
parte nostra, continuava a creare problemi.** È risolto nel codice dal 29/09, non è ancora in un
commit. Tutti gli altri aspettano.

---

## Blocco 0 — Fermare la perdita di dati

**Stato: ~~da fare~~ CHIUSO e VERIFICATO A RUNTIME il 2026-09-29. Non è committato.**

**La verifica.** Non è più una lettura del codice: è stata misurata su un dispositivo. Con Wi-Fi e
dati realmente spenti, l'app è stata riavviata e il suo stato locale letto prima e dopo. Risultato:
stesso `user_id` (`9f22d449…`), stesso `created_at`, **nessun** account nuovo, **nessuna** chiave
cancellata (13 → 13), 5 UUID distinti invariati. Il warn è comparso sul logcat, quindi il ramo
di errore ha davvero eseguito e non è stato solo dedotto.

Il contatore delle identità abbandonate è **fermo**: le cinque esistenti sono la firma di cicli
avvenuti prima del fix. Il meccanismo non si riproduce più. Dettaglio e metodo in
[`VERIFICA-RUNTIME-2026-09-29.md`](VERIFICA-RUNTIME-2026-09-29.md).

`AsyncStorage.clear()` **non esiste più** in nessun file di `app/`, `components/`, `utils/`,
`context`. I cinque `profile_id` abbandonati non possono più prodursi da quel percorso: restano
i `removeItem` mirati di `profile.tsx:146-149` (un reset esplicito, voluto), `_layout.tsx:84`
(`loto_profile_missing`) e i due di `MobilityContext` / `PoiDetailSheet:158`, tutti su singole chiavi.

La correzione c'è, ed è fatta bene. `app/_layout.tsx`, ramo di errore:

```ts
// INVARIANTE: un errore di rete non cancella lo stato locale e non crea un account nuovo.
// L'identita' resta quella corrente; si entra solo in modalita' offline.
console.warn('[Auth] Sessione non disponibile, avvio in modalita offline:', err.message);
setAuthError(err.message);
```

Cioè: errore di rete → si entra in modalità offline, e l'identità corrente resta quella. Il
documento del 26/09 è **superato** su questo punto. Verificare con:

```
rg "AsyncStorage\.clear" app components utils context
```

**resta però una cosa non committata**, e questa sezione non è chiusa finché non lo è: il fix di
`_layout.tsx` sta in `git diff` e non è in un commit (`app/_layout.tsx | 25 +++++, 23 -----`).
Finché resta fuori, il blocco è risolto **solo sulla macchina**.

### Perché era primo

*Documento del 26/09, superato ma conservato perché il ragionamento resta valido.* Ogni volta che
l'app non riusciva a ottenere la sessione al primo tentativo, `app/_layout.tsx:88-94` eseguiva
`AsyncStorage.clear()` e creava un nuovo utente anonimo. I cinque `profile_id` abbandonati trovati
in AsyncStorage erano la firma di cicli già avvenuti, e ogni altra verifica del progetto era fatta
su dati che il sistema continuava a perdere.

### Cosa contiene

1. **Correggere la chiave di sessione** alla riga 76: `supabase-auth-token` non esiste, la sessione
   sta sotto `sb-fsuolbwsvpgiglwcaffh-auth-token`. Correggere il nome, oppure — meglio — usare
   `supabase.auth.signOut()` da solo, che pulisce il suo storage senza sapere come si chiama.
2. **Separare i due errori.** Al momento un errame di rete e un profilo mancante portano allo
   stesso comportamento distruttivo. Devono divergere:
   - errore di rete → **rientro in modalità offline**, nessuna scrittura, nessun nuovo account
     (l'app già prevede un banner "Modalità Offline" più in basso, righe 96-102: quel ramo
     esiste già, ed è il ramo giusto);
   - profilo mancante (`PGRST116`) → **non creare un utente nuovo**: segnalarlo e offrire il
     recupero via L.O.T.O. Pass, che è l'identità progettata.
3. **Eliminare il `clear()` indiscriminato.** Se deve restare una difesa, deve beingere il backup
   del Pass prima di cancellare, non dopo. Meglio ancora: non cancellare nulla e riparare la
   sessione, visto che esiste già `files/loto_vault`.
4. **Loggare il motivo** di ogni reset di identità, con un marcatore in AsyncStorage. Serve per
   distinguere in futuro un bug da un comportamento voluto.

### Criterio di accettazione

- Un test che forza un errore di rete all'avvio **non** cancella nessuna chiave AsyncStorage e non
  cambia `auth.uid`.
- Un test che forza `PGRST116` **non** crea un nuovo anonimo e propone il recupero via Pass.
- Il numero di `profile_id` distinti sul device non cresce a ogni avvio.

### Serve il tuo via

Richiede un go/no-go esplicito prima di toccare `_layout.tsx`, perché cambia il comportamento di
autenticazione. È l'unico blocco che propongo di fare subito, e anche l'unico che propongo di
fare **prima** di qualsiasi altra cosa.

### Rischio se lo salti

Tutto il resto viene fatto su un database che si svuota. Qualsiasi test, misura o report
successivo partirebbe da un dato che non esiste più.

---

## Blocco 1 — Collaudare l'archivio

**Stato:** da fare. **Dimensione:** ~mezza giornata, quasi tutta di lettura.

### Perché

I documenti in `docs_v2` sono stati scritti analizzando documentazione sparsa, e **due sono già
risultati falsi** nel giro di una sessione:

| Affermazione | Stato reale |
|---|---|
| hardening admin "mai applicata" | **non verificabile** con le chiavi disponibili |
| `get_pois` come blocker P0 | **falso**: non è nel percorso POI attivo, errore preesistente |

Un archivio non collaudato non è un archivio: è un insieme di ipotesi con una data. E un agente
che lo tratta come vero viaggia verso conclusioni sbagliate — com'è successo a me con l'identità.

### Cosa contiene

Una tabella di verifica, una riga per affermazione, tre colonne: **fonte, stato, esito**. Le
affermazioni da collaudare per prime:

- Quale versione dell'app corrisponde a quale stato del DB (la documentazione è ferma alla 1.0.2,
  il codice è alla 1.0.7).
- Quali delle 8 condizioni di coesione sono davvero mancanti, e non solo non documentate.
- Se `vw_pois_frontend` e `vw_collective_impact` esistono in qualche forma anche in Git, o solo nel
  pannello web (D9 confermato: solo pannello web).
- Se i 4 blocker della scan chain sono tutti e quattro ancora presenti, o se qualcuno è già
  risolto nel codice non tracciato.
- Se `recover_loto_pass` esiste davvero e cosa fa esattamente (serve per il Blocco 0, punto 2).

### Criterio di accettazione

Una tabella in cui ogni riga dice **verificato** o **non verificabile**, con l'evidenza. Nessuna
riga dice "probabilmente".

### Rischio se lo salti

Le decisioni dei blocchi successivi vengono prese su premesse non verificate. È il modo più
economico di lavorare per un progetto che ha già cambiato direzione più volte.

---

## Blocco 2 — Rendere il database riproducibile

**Stato:** da fare. **Prerequisito:** Blocco 1 (le viste vanno prima definite per davvero).
**Dimensione:** ~mezza giornata.

### Perché

Oggi il frontend interroga tre oggetti che non sono in Git: `vw_pois_frontend`,
`vw_collective_impact`, `scan_poi_gps`. Il caso più grave è D9: **`vw_pois_frontend` funziona e
non è versionato.** Funziona *qui*, su *questo* progetto Supabase, e in nessun altro. Una
ricostruzione fedele oggi non è possibile.

### Cosa contiene

1. Catturare le definizioni reali con `pg_get_viewdef` (dal SQL editor: il PostgREST non espone
   `pg_catalog` al client anonimo).
2. Scrivere una migration che le crea, in modo idempotente, senza sovrascrivere quelle già
   presenti.
3. Applicarla **solo dopo** aver confrontato la definizione con quella attiva: se differiscono, la
   differenza è il buco e va capita, non sovrascritta.
4. Applicare la stessa regola a `scan_poi_gps`.
5. Aggiungere il test che manca: **un elenco degli oggetti che il frontend interroga, e un check
   che ognuno abbia una migration che lo crea.** Questo è il criterio C11, reso eseguibile invece
   che dichiarato.

### Criterio di accettazione

Un database vuoto, ricostruito dalle sole migration del repo, contiene tutto ciò che il frontend
interroga. Il test del punto 5 fallisce se si aggiunge un oggetto senza migration.

### Rischio se lo salti

Il progetto non è riproducibile. Nessuno, nemmeno tu fra sei mesi, può ricostruirlo. È la ragione
per cui il lavoro dei prossimi blocchi non deve essere dato per scontato.

---

## Blocco 3 — Coesione dell'app

**Stato:** da fare. **File:** `utils/dbAggregation.ts`, `app/(tabs)/index.tsx`, tab structure.
**Prerequisito:** Blocco 0 chiuso (l'identità deve essere stabile prima di misurare aggregati).

### Cosa contiene

1. **Il `profile_id` usato in `dbAggregation.ts`**: verificare se coincide con `auth.uid` o con
   l'UUID del profilo, e allinearlo. È la causa più probabile dei fallback silenziosi: una
   query che restituisce zero righe non per assenza di dati, ma per id sbagliato.
2. **I fallback che leggono chiavi inesistenti.** `index.tsx` legge `loto_fallback_xp`,
   `loto_fallback_tokens`, `loto_fallback_pois`; nessuna delle tre esiste sul device. Il percorso
   oggi produce `NaN` o `0` e **non è mai stato esercitato**: è nato con l'app e nessuno l'ha
   mai visto funzionare. Va deciso se esiste o se va rimosso: un fallback mai testato è peggio di
   nessun fallback, perché sembra esserci.
3. **La tab bar.** Verificare quante sezioni ci sono e quante ne servono al primo avvio, con i
   criteri del modello (progressive disclosure, non una voce per ogni funzione). Questo è
   l'unico intervento di UI/UX del piano, e non è un rifacimento: è una decisione di scrematura.

### Criterio di accettazione

`dbAggregation` restituisce gli stessi numeri del DB per lo stesso `auth.uid`; nessun fallback
legge chiavi assenti; la tab bar ha tre sezioni e una reason per ognuna.

### Rischio se lo salti

L'app *sembra* funzionare — il numero è sbagliato ma non crasha. Questa è la classe di difetto più
costosa in un progetto che vende dati, perché non si manifesta.

---

## Blocco 4 — Catena di scansione

**Stato:** bloccato in attesa di D5 e D6. **Prerequisiti:** Blocco 0, 1, 2.

### Perché è in fondo, e non è un rimando

La catena di scansione ha quattro blocker noti (transazione assente, `unique_violation` che
collassa le visite, race del cooldown con doppio XP, backfill `profiles.tenant_id`). Ma due delle
decisioni che la governano sono tue e non tecniche, e sono state rimandate a ogni sessione:

- **D5: il tag NFC da solo vale?** Cambia la firma della funzione: si scrive una cosa o l'altra.
- **D6: il check-in accredita PTI?** Cambia il significato del segnale.

**Scrivere la catena prima di queste risposte significa scrivere il codice di una delle due
versioni e scoprire dopo che era l'altra.** È il motivo per cui la catena non è il primo blocco,
nonostante i quattro blocker sembrino urgenti.

### Cosa contiene (dopo le decisioni)

1. Chiudere B1–B4 nella migration `20260926120000_scan_chain_canonical.sql`.
2. Applicare in ordine, in ambiente di prova prima.
3. Verificare che la catena completa regga transazione, unicità, cooldown e tenant.

### Criterio di accettazione

Uno scan reale, eseguito due volte di fila, produce **una sola** visita, **un solo** accredito, e
il test di concorrenza passa.

---

## Blocco 5 — Prova sul campo

**Stato:** da fare, per ultimo. È la verifica che i blocchi 0-4 hanno funzionato **nel mondo** e
non solo in teoria.

### Cosa contiene

Un percorso reale e breve, fatto in strada, con il device: avvio app, verifica della sessione
(stabile, stesso `auth.uid` di prima), scansione, check-in, rituale, riavvio dell'app, verifica
che `auth.uid` **non** sia cambiato e che la progressione sia ancora lì. Poi un secondo riavvio con
rete in modalità aereo, per provare il ramo offline che oggi non esiste.

### Criterio di accettazione

Due riavvii, di cui uno offline, producono lo stesso `auth.uid` e la stessa progressione. È il test
che oggi fallirebbe, ed è l'unico che conta.

### Perché è l'ultimo e non il primo

Farlo adesso significa misurare un sistema che ancora perde dati e attribuisce i check-in a un
identificatore non verificato. Il risultato sarebbe un giudizio sbagliato sulla qualità
dell'app — che è esattamente la trappola in cui sei rimasto per quattro mesi: giudicare il
progetto con strumenti che non misurano ciò che conta.

---

## Costi e sequenza

| Blocco | Dimensione | Precondizione | Rischio se in ritardo |
|---|---|---|---|
| 0 Deep Recovery | ~1 ora | **la tua decisione** | perdita dati continua |
| 1 Collaudo archivio | ~mezza giornata | nessuna | decisioni su premesse false |
| 2 DB riproducibile | ~mezza giornata | Blocco 1 | non riproducibile |
| 3 Coesione app | ~1 giorno | Blocco 0 | numeri silenziosamente sbagliati |
| 4 Scansione | ~1 giorno | D5 + D6 | codice da riscrivere |
| 5 Prova sul campo | ~2 ore | 0-4 chiusi | verdetto sbagliato sull'app |

**Il percorso critico è 0 → 1 → 2 → 3 → 4 → 5.** I blocchi 2 e 3 possono procedere in parallelo
fra loro una volta chiusi 0 e 1.

---

## Due note operative

**ADB.** Il daemon si avvia lentamente e a volte si blocca su una percentuale. Una volta avviato
funziona: per non riavviarlo a ogni comando, usa il percorso assoluto invece di `adb` a richiamo
(`C:\Users\Sem\AppData\Local\Android\Sdk\platform-tools\adb.exe`). Il database dell'app è in
`databases/RKStorage`, non in `files/SQLite/`.

**L'app va chiusa prima di copiare il database locale.** Con l'app in esecuzione la copia risulta
illeggibile (`database disk image is malformed`): è un artefatto della copia a metà scrittura, non
un problema dell'app.

---

*Costruito su `FORMA-DEFINITIVA.md` §5, `MODELLO_OPERATIVO` §4, e sullo stato verificato in
`PianoOperativo-26-09.md`. Confidenza Alta sui blocchi 0 e 2 (codice e oggetti verificati), Media
sui blocchi 3 e 4 (ipotesi di lavoro da confermare nel Blocco 1).*
