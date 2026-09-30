---
id: PIANO-OPERATIVO-26-09
tipo: analisi
ambito: piano-operativo-definitivo-e-stato-ambiente-verificato-26-09
stato: Vivente
confidenza: Alta
owner: Agent
aggiornato: 2026-09-26
evidenza:
  - docs_v2/BRIEFING-AGENTE.md:1
  - docs_v2/DECISIONI.md:1
  - docs_v2/aree/A3_dati_e_sql.md:1
  - supabase/migrations/20260926120000_scan_chain_canonical.sql:1
---

# Piano operativo L.O.T.O. Map — stato verificato e da fare

> Documento di lavoro. **Non sostituisce `DECISIONI.md`**: quello decide, questo esegue.
> Tutto ciò che segue è verificato con gerarchia A (contenuto, runtime, cloud) > B (documenti) >
> C (timestamp, nomi). I timestamp **non** sono mai usati come prova.

---

## 0. Come leggere questo documento

Se leggi solo una cosa, leggi **§2 (ambiente)** e **§5 (piano per fasi)**. Il resto è
approfondimento e correzioni.

Le tre sezioni che contengono novità rispetto a `docs_v2/` sono:

| Sezione | Perché è nuova |
|---|---|
| §3.3 | **Due viste esistono nel cloud e in nessuna migration.** L'ambiente non è riproducibile da Git |
| §4 | Il test che mancava: incrocio frontend ↔ cloud ↔ migration |
| §3.5 | Quattro miei errori corretti, con la correzione esplicita |

---

## 1. Sintesi esecutiva

Il progetto **funziona**. Non è in pezzi e non è bloccato. I test di scansione e i rituali
quotidiani che hai visto funzionare sono reali, non una facciata.

I problemi veri, in ordine di gravità:

1. **L'ambiente non è riproducibile da Git.** Esistono oggetti nel cloud creati dal pannello web
   che non sono in nessuna migration. Se domani un altro computer, o devi ricreare il DB, perdi
   dati. È il problema più serio e nessuno lo aveva nominato.
2. **La documentazione è indietro di 5 versioni.** Il codice è alla 1.0.7, l'handoff scrive
   1.0.2. Il registro di sessione non viene più scritto, ed è la ragione per cui il contesto si
   perde.
3. **Il deploy della dashboard admin non è mai partito** perché il push del branch non è avvenuto.
4. **Quattro blocker nella migration canonica del check-in**, non applicata quindi non attivi.

Nessuno di questi è irreversibile. Richiedono tempo, non decisioni irreversibili.

---

## 2. Ambiente definito

### 2.1 Repository

| Voce | Valore | Come verificato |
|---|---|---|
| Path canonico | `C:\loto_app` | `.git` + 145 commit |
| Branch | `fix/ripristino-lavoro-15-set-selective` | `git branch` |
| HEAD | `bb0fa37` feat(admin): secure DaaS dashboard and privacy views | `git log` |
| `main` | `47b597c`, **ahead 145** su `origin/main` | `git log main..origin/main` |
| Stash | 2 | `git stash list` |
| Worktree vecchio | **morto** | directory annidata eliminata il 24/09 |

**Lavoro non committato (7 file + 3 asset):**

```
 M  app/(tabs)/index.tsx
 M  docs/codici_morti.md
 ?? utils/dbAggregation.ts
 ?? supabase/migrations/20260926120000_scan_chain_canonical.sql
 ?? supabase/migration_v22_daas_vendite.sql
 ?? supabase/migration_v23_prestige_card_metrics.sql
 ?? supabase/migration_v24_app_telemetry.sql
 ?? assets/images/*.png   (3 file)
```

**Push mai eseguito.** `git ls-remote --heads origin` restituisce solo `feature/auth-backup`,
`feature/gamification-rpc`, `main`. Il branch corrente è `[gone]` lato remoto.

### 2.2 Build e dev

| Voce | Valore |
|---|---|
| Package | `com.lotohub.app` |
| Versione installata | **1.0.7**, versionCode **9** |
| Coerenza repo | `app.json` e `build.gradle` dicono entrambi 1.0.7/code 9 → **allineati** |
| Tipo | `DEBUGGABLE`, expo-**dev-client**, New Architecture / bridgeless |
| Installato | 24/09 21:04:30 |
| Device | OnePlus CPH2091, **Android 12 / API 31** (app target 36) |
| Permessi | tutti concessi, incluso `ACCESS_BACKGROUND_LOCATION` |

**Il device gira l'ultima versione.** Prova: il bundle Metro ricostruito oggi misura
**14 856 404 byte**, identici al `DevBundle…js` già cacheato sul device. Zero drift fra device e repo.

**Perché l'app restava ferma sulla scheda "dev server":** il dev-client cerca
`http://localhost:8081`, che sul device è il device stesso. Serve il ponte. La sequenza che
funziona:

```powershell
adb reverse tcp:8081 tcp:8081
npx expo start --dev-client          # poi toccare "LOTO MAP :8081" sul telefono
```

Primo bundle (cache fredda) **~118 s / 2591 moduli**. Con cache calda **~10 s**. Non è un blocco:
è il build. Su `adb reverse` mancante l'app fa retry silenzioso all'infinito.

**Avvertenza:** senza Metro l'app resta su schermo col bundle in memoria, ma al prossimo riavvio
torna sulla scheda dev. Va rifatto `adb reverse` a ogni sessione.

### 2.3 Sessione e identità — **rifiuto da risolvere**

| Voce | Valore |
|---|---|
| Tipo sessione | **anonima** (`is_anonymous: true`, `amr: anonymous`) |
| `sub` corrente | `4181f0ac-0ad3-4f76-8efe-03509b38a21b` |
| Refresh | funziona, rinnovato durante l'analisi |

**Cinque UUID distinti** compaiono nelle chiavi AsyncStorage profilate, e **nessuno coincide con
l'`auth.uid` corrente**:

```
749b645c-…  943ddfc0-…  b62e2482-…  dc311c85-…
```

Conseguenza: se una vista viene filtrata per `profile_id = <id in cache>` invece che
`auth.uid()`, ritorna zero righe e il fallback parte **in silenzio, senza errore**. È il modo in
cui "le metriche non arrivano" senza che nulla fallisca. **Da verificare nel codice** quale id usa
`utils/dbAggregation.ts`.

**Secondo problema, certo:** le tre chiavi `loto_fallback_xp`, `loto_fallback_tokens`,
`loto_fallback_pois` che `app/(tabs)/index.tsx` legge con `multiGet` **non esistono**. Il codice fa
`parseInt(undefined)` → `NaN`.

### 2.4 Stato cloud (interrogato con ruolo autenticato)

**Viste — tutte e quattro esistono:**

| Vista | Esiste | In migration? |
|---|---|---|
| `vw_pois_frontend` | **sì** | **NO — creata out-of-band** |
| `vw_collective_impact` | **sì** | **NO — creata out-of-band** |
| `vw_user_dashboard_metrics` | sì | sì (v23 / hardening) |
| `vw_daas_heatmap_15min` | sì | sì (v22 / hardening) |
| `vw_dev_telemetry_daily` | sì | sì (v24 / hardening) |
| `app_telemetry_events` | sì | sì (v24 / hardening) |

**Funzioni:**

| Funzione | Risposta | Lettura corretta |
|---|---|---|
| `get_pois` | `42703 column p.alternative_poi_id does not exist` | **rotta**, eseguita e morta dentro |
| `get_pois_with_status` | `PGRST202` | **ignoto** |
| `scan_poi` | `PGRST202` | **ignoto** |
| `scan_poi_gps` | `PGRST202` | **ignoto** |
| `sblocca_media` | `PGRST202` | **ignoto** |

> **`PGRST202` non significa "la funzione non esiste".** Il messaggio è
> *"Searched for the function … without parameters, but no matches were found"*: PostgREST ha
> cercato una versione a zero parametri. Una funzione che ne richiede si risolve così. Per sapere
> se esistono serve chiamarle con i parametri corretti, o leggere `pg_proc`.

### 2.5 Dati utente presenti sul device

Onboarding visto · mobility privata con raggio 30 m · 58 km SincroAvventura · 2 beacon BLE
rilevati · 0 fallback gamification persistiti.

---

## 3. Rilevazioni

### 3.1 Cosa funziona e non va toccato

- **POI.** `vw_pois_frontend` esiste e restituisce righe reali (`Castello Aragonese`, `monument`,
  `layer_name: layer-cultural`). I test finali erano validi.
- **Rituali quotidiani / missioni.** Aggiornati il giorno della verifica.
- **Metriche Home.** Arrivano. `vw_user_dashboard_metrics` risponde.
- **Scansione in strada.** Funzionante. Le transizioni, gli XP e gli avanzamenti erano corretti.

### 3.2 `get_pois` è rotta — ma **non è P0**

Ho inizialmente dichiarato questa priorità P0. **Era sbagliato** e mi correggo: `get_poi` è usata
solo in `app/route-creation-mockup.tsx:51`, una schermata mockup. Nel codice attivo non è nel
percorso Home né Mappa, che usano `vw_pois_frontend`. È un bug reale ma non bloccante.

**Non correggerla d'impulso.** Prima va letta la definizione, per capire se `alternative_poi_id`
era una colonna persa o un riferimento sbagliato.

### 3.3 Il problema serio: oggetti fuori da Git

`vw_pois_frontend` e `vw_collective_impact` sono interrogate dal frontend attivo e **funzionano**,
ma non sono definite in nessuna migration. Sono state create dal pannello web di Supabase.

Questo è **D9, caso 2** — quello che `DECISIONI.md` identifica come il peggiore, perché
funziona. Le conseguenze:

- chiunque crei un ambiente da Git ottiene un'app **senza POI e senza Community**
- nessuno sa perché funzionano, quindi nessuno può modificarle con criterio
- ieri come oggi, il frontend e il DB possono divergere senza che nulla lo segnali

**È la stessa radice della perdita di contesto:** lavoro fatto, non versionato, non tracciato.

**Azione:** catturare le definizioni con `pg_get_viewdef` e scrivere la migration che le porta in
Git. Reversibile, e chiude D9.

### 3.4 I quattro blocker della catena canonica

Confermo i quattro, con lettura indipendente. La migration non è applicata, quindi sono **latenti,
non attivi**.

| # | Difetto | Effetto |
|---|---|---|
| B1 | nessun `BEGIN`/`COMMIT` | stato parziale se il DDL fallisce a metà |
| B2 | `EXCEPTION unique_violation` → `UPDATE` | le visite ripetute collassano: la heatmap DaaS diventa 1 riga per utente×POI **per sempre** |
| B3 | check cooldown e INSERT non atomici | **doppio XP** con richieste concorrenti: l'exploit che la migration vuole chiudere resta aperto |
| B4 | `profiles.tenant_id` senza backfill | righe esistenti a `NULL`, invisibili ai query tenant-filtered |
| H1 | "FASE 2" è solo commento, cita `mitigation.sql` inesistente | riapplicare gli script storici **sovrascrive** la funzione canonica, in silenzio |
| H2 | `scan_poi` (NFC) richiede visita GPS | decisione di **prodotto**, non tecnica |

B2 e B3 vanno corretti: B2 rende inutilizzabile il prodotto vendibile, B3 è
auto-contradittorio rispetto allo scopo della migration.

### 3.5 Correzioni a reports precedenti

Le scrivo perché un errore non dichiarato si eredita.

| # | Cosa avevo detto | Realtà |
|---|---|---|
| 1 | "`vw_prestige_card_metrics` e `vw_daas_vendite` non esistono" | Nomi che **non esistono in nessuna migration**: avevo sondato nomi inventati. I nomi veri esistono tutti |
| 2 | "le RPC mancano, `PGRST202`" | Erano sonde con **anon key**: PostgREST nasconde ciò che il ruolo non vede. Inoltre `PGRST202` = "no match senza parametri", non "assente" |
| 3 | "`get_pois` è P0" | È rotta ma abita solo in una mockup. **Non P0** |
| 4 | "hardening mai applicata" (da `REPORT_SINCRONIZZAZIONE`) | **Indeterminabile** con la anon key: v22/v23/v24 e la hardening creano **gli stessi oggetti**, quindi l'esistenza non distingue nulla. Serve `is_loto_admin()`, che è una funzione |

Il punto 4 è importante: la conclusione "mai applicata" **regge l'ordine di applicazione** e quindi
l'intero piano. Va risolta con un ruolo autenticato, non assunta.

### 3.6 Il documentale

- `docs_v2/` è solido: validatore **pulito**, 23 documenti, 13 ambiti distinti, 0 errori. La
  struttura tiene ed è la parte meglio fatta del lavoro di oggi.
- **Per decisione dell'utente `docs_v2/` non viene committato**: resta materiale di consultazione.
- `docs/NEXT_SESSION_HANDOFF.md` documenta la 1.0.2 mentre il codice è alla **1.0.7**. Il registro
  di fine sessione non viene più scritto: è la causa diretta della perdita di contesto.

---

## 4. Il test mancante

Finora nessuno ha verificato in modo sistematico **che cosa il frontend pretende dal database**.
L'ho ricostruito a mano per tre oggetti. Il test lo rende definitivo ed è **read-only**.

**T5 — incrocio frontend ↔ cloud ↔ migration**

1. estrarre da `app/`, `components/`, `utils/`, `hooks/` tutti i bersagli di `.from(...)` e
   `.rpc(...)`
2. interrogare ciascuno sul cloud con ruolo autenticato (le funzioni con i parametri corretti,
   per evitare il falso `PGRST202`)
3. confrontare con ciò che `supabase/migrations/` crea
4. produrre la lista degli **oggetti fantasma**, ciascuno con la prova

Output atteso, già parzialmente noto: `vw_pois_frontend` e `vw_collective_impact` sono fantasmi
confermati. Il test serve a trovare gli altri e a non ripeterli.

**T6 — baseline di compilazione.** `npx tsc --noEmit` ed `npx expo lint` non sono mai stati
eseguiti in questa sessione, e il protocollo di fine sessione li richiede. Non sappiamo se il
codice attuale compila.

---

## 5. Piano per fasi

### Fase 0 — Definire l'ambiente *(read-only, si può fare subito)*

| | Attività | Stato |
|---|---|---|
| T1 | stato Git, stash, drift vs origin | **fatto** |
| T2 | dev build: client, Metro, `adb reverse`, bundle | **fatto** |
| T3 | runtime: versione, permessi, sessione, AsyncStorage | **fatto** |
| T4 | inventario oggetti cloud | **fatto** (ruolo autenticato) |
| T5 | incrocio frontend ↔ cloud ↔ migration | **da fare** |
| T6 | `tsc --noEmit` + lint | **da fare** |

Nessuna scrittura. È la fase che produce il materiale per tutte le altre.

### Fase 1 — Fermare le perdite *(scrittura, serve ok)*

1. **Portare in Git le due viste orfane.** Prima di tutto, perché il resto è reversibile e questo
   no. Richiede `pg_get_viewdef` e una nuova migration.
2. **Correggere `get_pois`** — dopo averne letto la definizione, non prima.
3. **Push del branch**, se si vuole il deploy della dashboard admin. *Decisione separata: tu hai
   deciso di restare sull'app, quindi resta in coda.*

### Fase 2 — Chiusura dei dubbi sul cloud *(authenticated, read-only)*

- stabilire se la hardening **è** stata applicata → `is_loto_admin()` in `pg_proc`
- stato reale di `scan_poi`, `scan_poi_gps`, `sblocca_media`, `get_pois_with_status`
- definizioni di `vw_pois_frontend` e `vw_collective_impact` (preparazione Fase 1.1)
- quale `profile_id` usa `utils/dbAggregation.ts`: `auth.uid` o la cache

### Fase 3 — Catena canonica del check-in

Ordine vincolante, perché i fix client dipendono dallo schema:

```
correzione B1-B4  ->  hardening  ->  scan chain  ->  client
```

Finché lo schema non è a posto, un fix sul frontend costruisce il **fallback silenzioso**: non
crasha, non fa nulla. Peggio di un errore.

### Fase 4 — I due fix client

`utils/dbAggregation.ts` e `app/(tabs)/index.tsx`. Difetti già noti: commento SSOT che punta a
v22/v23/v24, `tenant_id: 'taranto'` e `app_version: '1.0.2'` hardcodati, doppio `setUserProfile`
in `index.tsx:487-490`, `sendSessionStartTelemetry` non awaitata. Vanno **dopo** la Fase 3.

### Fase 5 — Documentale

- `docs/codici_morti.md`: **sbagliato** su v22/v23 (esistono tutte e tre su cloud) e omette v24
- `docs/NEXT_SESSION_HANDOFF.md`: fermo alla 1.0.2
- riscrivere il protocollo di fine sessione perché **non viene più eseguito** (vedi C12)

### Fase 6 — Decisioni di prodotto

D5, D10, D11, D12, D13. Nessuna dipende da codice. Aspettano te.

---

## 6. Le decisioni aperte

### D9 — `vw_pois_frontend` esiste nel cloud? **Risolta: caso 2**

Esiste, funziona, e **non è in Git**. Creata dal pannello web. È il caso peggiore perché
funziona. `vw_collective_impact` è nella stessa situazione, e non era nel registro.

**Azione:** portare entrambe in una migration.

### Le altre, in sintesi

| # | Domanda | Mio parere |
|---|---|---|
| D1 | quale dei 4 "SSOT" sopravvive | **Opzione 1**, tre strati distinti. Non richiede riscritture |
| D2 | i 7 `.md` della root | procedere **per lotti**. `task.md` (1 byte) e `README.md` (template Expo) sono liberali; il resto va deciso |
| D3 | `knowledge_recovery_guide.md` | **opzione 1**, rifarlo sull'indice reale. Con `docs_v2` ha una base solida |
| D4 | i 4 blocker ora o come debito | **ora**. B2 e B3 sono auto-contradittori se rimandati |
| D5 | NFC da solo deve funzionare? | **Opzione 3**, challenge firmato. È l'unica che tiene Zero-IoT e anti-cheat insieme. Cambia la firma delle funzioni: va deciso prima del rilascio |
| D6 | il check-in accredita PTI? | Se è voluto ("PTI congelata fino a fine app"), **scriverlo nel codice** con un commento. Altrimenti il prossimo agente lo legge come bug |
| D7 | cap di 3 carte anti-flood | **Opzione 2**, priorità alle REVEAL. Sono l'unica con azione richiesta: perderla è la perdita più costosa |
| D8 | le 3 direzioni commerciali | fuori perimetro di questa analisi. Servono prezzi e clienti, che non esistono |
| D10 | validazione a 4 tier + `poi.tier` | **Opzione 1**. È il modo in cui C2 (costo marginale zero) diventa un requisito per singolo POI |
| D11 | `rank` vs tier narrativo | **Opzione 1**, tre livelli distinti. Il tier narrativo è ciò che rende il rank non un numero |
| D12 | griglia 110 m + soglia k | **Opzione 1**, complementari. La soglia è la garanzia, la griglia è il prodotto. Va deciso il valore di k |
| D13 | sblocco feedback Echo | **Opzione 1**, WhatsApp. Coerenza di principio: se il primo posto dove l'esercente incontra il prodotto è una schermata web, il messaggio "non ti serve un software" è già perso |

---

## 7. Il perimetro del prodotto

Dalla lettura di `BRIEFING-AGENTE.md` e `MODELLO_OPERATIVO.md`, la forma che emerge è coerente e
sostenibile. I punti che vanno tenuti:

- **il prodotto venduto è l'infrastruttura TSaaS**, non il software. Griglia 110 m, bucket 15 min,
  report GeoJSON per agenzie che hanno già i contratti con i Comuni
- **il cliente è l'agenzia dati e turismo**, non il Comune, non l'esercente
- **Zero-IoT**: nessun sensore da installare. geofencing GPS e NFC solo dove c'è un partner
- **Zero-PII**: nessuna email, nessun nome. L'unico backup è un QR in galleria
- **gamification come strumento di ritenzione**, non come prodotto
- il percorso critico verso il primo fatturato **non è di codice**: è un partner e un'agenzia

Da dichiarare con onestà: **non esistono prezzi, clienti o contratti** in nessun documento
dell'archivio. La forma del prodotto è definita; la sua validazione commerciale no.

---

## 8. I criteri

I dieci di `BRIEFING-AGENTE.md` §2 sono giusti così come sono. Ne aggiungerei due, ricavati dalla
perdita di lavoro di oggi e non da una scelta di design:

| # | Criterio | Test rapido |
|---|---|---|
| **C11** | **Ciò che gira nel cloud è dichiarato in Git** | *"c'è un oggetto in produzione che non è in nessuna migration?"* → se sì, non è un dettaglio, è un debito |
| **C12** | **Una sessione che finisce senza commit è una sessione fallita** | *"se il disco si cancellasse adesso, ho perso qualcosa?"* |

C11 e C12 sono ciò che mancava. Tutti gli altri problemi — `docs_v2` non tracciato, viste
orfane, `docs/codici_morti.md` sbagliato — sono conseguenze dirette di non avere questi due.

---

## 9. Cosa non fare

- **Non riapplicare `migration_v22` / `v23` / `v24`.** Fanno `DROP VIEW` senza il gate
  `is_loto_admin()` e con `GRANT` ad `anon`: annullano l'hardening.
- **Non applicare niente da `supabase/` root.** Solo `supabase/migrations/`.
- **Non fidarsi del nome della funzione** per capire quale è quella giusta. Quattro definizioni
  con la stessa firma e semantica opposta.
- **Non creare `UNIQUE (profile_id, poi_id)` su `user_pois`**: imporrebbe "un POI una volta sola
  nella vita" e distruggerebbe check-in ripetuti e heatmap storiche. Il vincolo è il cooldown.
- **Non usare `GPS_CHECKIN` come `action_type`**: il CHECK ammette solo
  `tourist_checkin | civic_action | event | refill | unknown`.
- **Non fidarsi di `docs/codici_morti.md`**: ho verificato che è sbagliato su v22/v23.
- **Non correggere `get_pois` senza averne letto la definizione.**

---

## 10. Domande aperte

1. **`profile_id` usato da `dbAggregation.ts`**: `auth.uid` o la cache? Se è la cache, spiega i
   fallback silenziosi. *(verificabile in lettura, nessuna scrittura)*
2. **`is_loto_admin()` è nel cloud?** È l'unico oggetto unico della hardening e determina l'ordine
   di applicazione. *(richiede SQL Editor o la sessione)*
3. **`scan_poi` e `scan_poi_gps` esistono?** Il fatto che la scansione funzioni in strada
   suggerisce che esiste una versione **non canonica** in uso.
4. **Il device deve restare su dev-client?** Con una release non-debuggable `run-as` non funziona
   e non si legge più lo stato locale. Ha un costo di debug e un vantaggio riproduttivo.

---

*Verificato il 26/09/2026 su `C:\loto_app` @ `bb0fa37`, device CPH2091, Supabase `fsuolbwsvpgiglwcaffh`.
Consultazione: nessuna scrittura al cloud, nessuna modifica al codice e alla documentazione.*
