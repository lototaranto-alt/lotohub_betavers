---
id: ARCHITETTURA-MASTER-2026
tipo: analisi
ambito: architettura-di-sistema-e-specifiche-funzionali
stato: Vivente
confidenza: Alta
owner: Agent
aggiornato: 2026-09-30
evidenza:
  - supabase/migrations/20260929160000_restore_proximity_gate.sql:106
  - supabase/migrations/20260930120000_vault_security_and_search_path.sql:1
  - supabase/migrations/20260926120000_scan_chain_canonical.sql:325
  - utils/levelUtils.ts:13
  - utils/OfflineQueueManager.ts:117
  - docs_v2/VERIFICA-RUNTIME-2026-09-29.md:1
---

# L.O.T.O. HUB — Architettura di Sistema Master (2026)

> **Come va letto questo documento.** È la versione pulita dell'architettura: contiene **solo ciò
> che è stato verificato**, con il riferimento al file e alla riga. Dove un'implementazione non è
> ancora confermata, la sezione lo dice in una riga invece di presentarla come un fatto.
>
> È nato il 30/09/2026 sostituendo il blueprint che si chiamava "MASTER BLUEPRINT & SSOT DEFINITIVO",
> conteneva due affermazioni risultate false, ed è conservato per il confronto storico in
> [`loto-hub-master-blueprint-ssot-2026.md`](loto-hub-master-blueprint-ssot-2026.md).
>
> **Il limite che non si aggira:** il cloud non è ispezionabile dall'agente. Ogni riga che riguarda
> il database è vera *se e solo se* la query di verifica è stata eseguita e l'output è stato letto.
> Le query stanno in [`diagnostica-gate-vault.sql`](diagnostica-gate-vault.sql) e
> [`query-cloud-q17-q27.sql`](query-cloud-q17-q27.sql).

---

## 1. Il modello: TSaaSI

**L.O.T.O. HUB** è un'infrastruttura tecnologica e civica per gestire, redistribuire e gamificare i
flussi turistici e la fruizione urbana. Il fine non è la gamification: è **misurare e
ridistribuire**. Il gioco è lo strumento di partecipazione che rende la misura accettata dai
cittadini.

Per le Amministrazioni e i Partner B2B espone strumenti **DaaS** (Data as a Service): la heatmap dei
flussi e i report di impatto ambientale.

### 1.1 I quattro principi

**Zero-IoT.** L'interazione fisica sul territorio avviene tramite tag NFC passivi e crittografati
(chip **NTAG424 SDM**): nessun sensore da installare, nessuna manutenzione, costi marginali
nulti. *Stato:* l'SDK esiste in `utils/nfcManager.ts` e la validazione lato server in
`validate_ntag424_sdm` (`20260926120000_scan_chain_canonical.sql:325`). **Non è verificato a
runtime**: `nfcManager.ts` non ha chiamanti. Esiste, non è collegato. `A5-T6`.

**Zero-PII (privacy assoluta).** L'utente accede in modo anonimo: l'identità è un UUID in
`auth.users`, nessuna email, nessun telefono, nessun dato personale raccolto. *Stato: verificato a
runtime il 29/09/2026.* L'identità sopravvive alla perdita di rete, il ciclo che prima generava un
profilo nuovo a ogni avvio offline è rimosso (`app/_layout.tsx`, `A3-T13`). Il contatore dei
profili è stabile a 5.

**Motore Camaleone (multi-tenancy dinamica).** L'interfaccia adatta grafiche, loghi, temi, mappa e
sponsor in tempo reale in base alle coordinate del dispositivo (geofencing su `tenants` e
`territories`) o al tag NFC letto. *Stato:* funzionante; resta aperta `Q17` su `tenants.id`, che se è
UUID rende silenziosamente inefficace il filtro per slug di `index.tsx:286`.

**Offline-First.** L'app continua a funzionare senza segnale (mare, campagne, vicoli). Le azioni si
accodano localmente e si sincronizzano al ritorno della rete. *Stato parziale, e va detto con
precisione:* la coda esiste (`utils/OfflineQueueManager.ts`) ma **gestisce un solo tipo di azione,
`UNLOCK_MEDIA`** (`OfflineQueueManager.ts:117`). I check-in non si accodano. Il 29/09 la cartella
`loto_vault` sul dispositivo era **vuota**, coerente con una coda mai inizializzata (`A5-T8`).
**L'affermazione "la coda crittografata" non e' ancora sostenuta dall'implementazione.**

---

## 2. Architettura del database

> *"Il Database è la fonte di verità; il Client è solo una vista reattiva."*
> **Questa regola è un obiettivo architetturale, non lo stato attuale.** Oggi è vera solo in parte:
> vedi §2.3.

### 2.1 Strati

```
┌──────────────────────────────────────────────────────────────────────────┐
│  CLIENT MOBILE (React Native / Expo)                                     │
│   • App Camaleonte (geofencing e multi-tenancy)                          │
│   • Onboarding Zero-PII (UUID anonimo + QR ripristino stato impatto)     │
│   • OfflineQueueManager (coda locale, solo UNLOCK_MEDIA oggi)            │
│   • Soft-sorting accessibilità, Shadow Validation, Sezione Community     │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │ viste e RPC
┌────────────────────────────────────┴─────────────────────────────────────┐
│  SUPABASE                                                                   │
│   • Governance e multi-tenancy: tenants, territories, profiles            │
│   • Ledger ESG immutabile: impact_transactions (append-only)              │
│   • Motore DaaS: vw_daas_heatmap_15min (griglia 110 m, bucket 15 min,     │
│     k ≥ 5, accesso riservato a is_loto_admin)                             │
│   • Estensioni: PostGIS nello schema public (verificato il 30/09, D1)    │
└──────────────────────────────────────────────────────────────────────────┘
```

**Estensioni.** PostGIS vive nello schema **`public`**, verificato il 30/09/2026. È il motivo per cui
tutte le funzioni `SECURITY DEFINER` possono usare `SET search_path = public, pg_temp` senza
dover aggiungere `extensions`: `ST_Distance` si risolve.

**Sicurezza delle funzioni.** Una funzione `SECURITY DEFINER` gira con i privilegi di chi l'ha
creata, quindi il suo `search_path` deve essere fissato. In PostgreSQL `pg_temp` viene cercato
**per primo** se non è nominato esplicitamente: senza elencarlo per ultimo, un utente autenticato
può creare una tabella temporanea che ombra una tabella di `public` dentro una funzione privilegiata.
Per questo la forma usata è `public, pg_temp`, non il solo `public`.

### 2.2 Funzioni di sicurezza e anti-cheat

| funzione | cosa fa | stato |
|---|---|---|
| `scan_poi_gps` | check-in GPS: prossimità, anti-velocità, shadowban, ricompense | **gate ripristinato il 30/09** (`A3-T12`), da verificare con query |
| `calculate_user_level` | curva dei livelli, identica al frontend | **verificato**: 50 soglie, 0 differenze con `utils/levelUtils.ts` (`A3-T9`) |
| `sblocca_media` | sblocca contenuti del Vault in base a livello e premium | corretta: usa `auth.uid()`, con `search_path` |
| `get_poi_vetrina` | catalogo multimediale del POI | **corretta il 30/09**: non accetta più `p_user_id` |
| `validate_ntag424_sdm` | valida la firma crittografica del chip NFC | presente, non verificato a runtime (`A5-T6`) |

**Il proximity gate.** Una riga sola vale tutto il Blocco 1:

```
v_dist_poi_m := ST_Distance(v_user_geog, v_poi_data.coords::geography);
IF v_dist_poi_m > v_radius_m THEN   -- rifiuta
```

Il raggio è per-POI (`checkin_radius`), con un default. Anti-velocità a 130 km/h, cooldown di 12 ore,
shadowban silenzioso e reversibile: sono scelte corrette, e proteggono il **valore** di una visita.
**Ma proteggono il valore di una visita che, senza prossimità, non è avvenuta.** Il gate è la riga che
manca-va ripristinata, perché l'anti-velocità da sola non basta: al primo check-in della vita non
c'è nessuno spostamento precedente da confrontare.

**L'errore che il gate corregge, in una riga.** Il 27/09 `scan_poi_gps` restituiva
`{success: true}` a un utente che poteva essere dall'altra parte dell'Italia. Nessun errore, nessun
avviso. La riga finiva nella heatmap DaaS e nel report che si vende alla PA. Il client controlla
solo `error` (`components/PoiDetailSheet.tsx:147`): il gate deve quindi **sollevare un'eccezione**,
non restituire un flag.

### 2.3 Dove il client è ancora autorevole

Questa sezione esiste perché il documento che precede contraddiceva la realtà, e il progetto non
deve ripeterlo.

| logica | dove sta | rischio |
|---|---|---|
| curva dei livelli | ora **anche** lato server, identica al client | risolto: i due non possono divergere (`A3-T9`) |
| formule CO₂ e distanza nel client | `utils/levelUtils.ts` (17 funzioni esportate) | un aggiornamento dell'app può cambiare un risultato senza toccare il DB |
| soglia di accessibilità | logica sparsa, fonti multiple non allineate | `Q26` decide se è `BOOLEAN` o `TEXT` |

**Non è "la logica risiede interamente lato server".** È una direzione di lavoro, con un primo
passo fatto e altri da fare. Dirlo in tempo è il motivo per cui il gate è stato trovato.

---

## 3. Specifiche funzionali

### 3.1 Soft-Sorting ♿ — accessibilità e deflazione inclusiva

L'algoritmo di navigazione ricalcola i percorsi incrociando accessibilità da **OpenStreetMap**,
schede dei **POI/partner** e segnalazioni dei cittadini. Le segnalazioni diventano ufficiali solo
dopo **convalida sul campo** da associazioni di categoria o nodi territoriali. L'app evita di
creare percorsi "ghetto" e mostra **piccoli banner sintetici di accessibilità** nell'anteprima e
nella scheda del POI, ridistribuendo i flussi verso tappe meno affollate.

*Stato:* il soft-sorting meteo è specificato in `METE-CONSIGLIATE-SPEC.md` e la sua migration
`20260929120000` chiude `Q23`. L'accessibilità è bloccata da `Q26`.

### 3.2 Safe & Fast

Percorso protetto di rientro rapido verso nave, hotel o parcheggio. Originariamente *Panic Mode*,
rinominato per ridurre l'attrito e l'allarme psicologico. **Spostato in backlog**: da ingegnerizzare
in un blocco successivo.

### 3.3 Shadow Validation — ecosostenibilità

L'impatto (CO₂ e risorse salvaguardate) viene calcolato in modo **ottimistico**, mostrato subito e
poi consolidato dal server. Ogni evento finisce in `impact_transactions`, registro **append-only**:
nessun record di impatto viene sovrascritto, come richiedono i requisiti di audit CSRD e ISO 14083.

### 3.4 Sezione Community e Obiettivi Comuni — l'ex L.O.T.O. Pass

È il passaggio che chiude il cerchio economico, e sostituisce la logica di economia individuale.

**Dismissione degli sconti B2B singoli.** La logica dei voucher e degli sconti commerciali individuali
alla cassa dei partner è **eliminata**. Non è una riduzione di funzionalità: è la rimozione di un
meccanismo che si contraddiceva con il modello.

**Economia civica e collettiva.** I punti e i token accumulati **non hanno valore economico
individuale**. Non sonoconvertibili, non spendibili, non cedibili. Chi lo spiega all'utente non sta
limitando qualcosa: sta dicendo che il valore è pubblico.

**Obiettivi Comuni.** I punti di tutti gli utenti confluiscono nella **Sezione Community** e si
sommano per raggiungere e sbloccare progressivamente **Obiettivi Comuni** di impatto civico,
ambientale e sociale per la città e il territorio.

*Perché è la parte importante del documento.* I due difetti più gravi trovati in questa codebase
non sono bug di logica: sono bug di modello. Il proximity gate accettava una posizione inventata e la
scriveva nella heatmap venduta alla PA — cioè **un falso claim di impatto**. E `sblocca_media`
accettava l'identità di un altro utente — cioè **un falso diritto su un contenuto**. In entrambi i
casi il sistema produceva una dichiarazione di realtà che non aveva verificato. La Sezione Community
concepisce l'impatto come una cosa che si costruisce insieme e si rende conto insieme: il che
rende obbligatorio che ogni cifra sia vera, perché è la cifra di tutti.

---

## 4. Il metro

Il criterio di giudizio di questo progetto non è quante funzioni ha.

> **Un check-in da 500 km non produceva alcun errore: restituiva `success: true`.**
> In un sistema senza allarmi, il silenzio non è una buona notizia: è il peggior segnale
> possibile, perché non lascia tracce.

Quattro audit hanno prodotto 47 documenti, e le prime versioni erano sbagliate quasi tutte. Non per
incapacità: perché si stava descrivendo **un'intenzione** invece di **un comportamento**. Da qui la
regola che tiene insieme tutto, in [`METODICA.md`](METODICA.md): **nessuna affermazione senza
`file:linea`**, e un blocco si chiude solo con una prova, mai con un'intenzione.

Il Blocco 0 è il primo caso in cui la regola ha retto: verificato a runtime il 29/09, non dichiarato
risolto. È la differenza fra un progetto che funziona e uno che qualcuno sta guardando.
