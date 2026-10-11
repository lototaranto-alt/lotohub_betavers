# PIANO DI LAVORO — 04/10/2026

Documento di lavoro dell'agente del codice. Fuori da `docs_v3`, che non e' piu' di mia
competenza. Questo file sostituisce `LOG-LAVORO.md`, che era la versione corta.

---

## 0. COME LEGGERE QUESTO DOCUMENTO

### La regola che mi ha fatto perdere quattro errori

Non cercare per nome. Per ogni oggetto chiedere tre cose, in quest'ordine:

1. **Chi scrive qui?** Enumerare trigger, funzioni, policy `INSERT`/`UPDATE`.
   Una tabella senza scritture server e' una tabella che il client puo' riempire a piacere.
2. **Chi legge qui?** Enumerare `SELECT`, `.from(...)`, embed, viste.
3. **Cosa c'e' davvero?** Contare righe, guardare la definizione, non il nome.

Un oggetto si considera capito solo quando le tre risposte sono tutte e tre misurate.
Fino ad allora e' un'ipotesi, e va scritta come tale.

### Perche' i commenti non sono una fonte

Cinque casi, tutti verificati in questa sessione:

| # | Dove | Prometteva | Realtà |
|---|---|---|---|
| 1 | `restore_proximity_gate.sql:52-61` | 9999 porta allo shadowban | codice morto, mai raggiunto |
| 2 | `restore_proximity_gate.sql:225` | 9999 = non calcolabile | `IF v_speed_kmh IS NULL` su una var = 0 |
| 3 | `process_crowd_radar` | doppia validazione | media su un solo reporter |
| 4 | `20260926120000:183` | `GREATEST(...,0.01)` protegge | tempo 0 diventa velocita' enorme, va in ban |
| 5 | `docs_v3/catalogo-feature.json` F-SCAN-02 | 9999 non puo' passare come zero | e' esattamente cio' che fa |

Il caso 5 e' il piu' istruttivo: il catalogo cita `:225` come **prova** del claim, e
la riga 225 esiste. Ma e' la riga morta. Ha verificato che la riga ci fosse, non che
si potesse arrivarci. Citare una riga non e' verificare un comportamento.

### Regola per i documenti ricevuti

Nessuna proposta diventa task finche' la sua precondizione non e' misurata nel cloud.
I documenti di analisi si trattano come spunti, non come specifiche.

### Priorita'

`BLOCCANTE` = difetto di sicurezza o perdita di denaro/XP.
`ALTO` = correttezza, il prodotto fa una cosa diversa da quella dichiarata.
`MEDIO` = debito tecnico che costa quando lo si tocca.

---

## 1. LA DOMANDA SULLA CARTELLA `docs_v3`

**Domanda:** ci sono file in `docs_v3/` con materiale gia' presente nel codice, nel DB o altrove?

**Risposta misurata: no, non c'e' duplicazione. E' una ricostruzione indipendente.**

Cosa ho verificato, in ordine:

1. `docs/` e `docs_v2/` non contengono **zero** occorrenze del vocabolario di v3
   (`CONTRADDITTA`, `PRESENTE MA SCOLLEGATA`). Nessuna sovrapposizione di contenuto.
   Il catalogo a 97 righe con verdetti e prove **esiste solo in v3**.
2. I riferimenti `file:linea` del catalogo sono ** accurati**. Verificati a mano:
   - `restore_proximity_gate.sql:169-182` = proximity gate, esatto
   - `components/PoiDetailSheet.tsx:141` = `supabase.rpc('scan_poi_gps')`, esatto
   - `app/p/[id].tsx:78-81` = scrittura `loto_fallback_xp` in AsyncStorage, esatto
   - `app/p/[id].tsx:94-98` = `upsert` grezzo su `user_pois` dal client, esatto
3. `docs_v3/` non contiene codice applicativo ne' oggetti di database. L'unico
   eseguibile e' `tooling/verifica_catalogo.py`, che e' un validatore, non codice di app.

**Perche' pero' non basta cosi':** il catalogo contiene un'affermazione falsa
(F-SCAN-02, vedi sezione 4 T7). E'accurate nel 90% e sbagliato nel punto che piu'
importa. Quindi si puo' usare come indice, **mai** come fonte di verita' senza
riverifica dei numeri di riga che porta.

### Provenienza dei file

| File | KB | Data | Origine |
|---|---|---|---|
| `storico_chat_vecchia.md` | 390,6 | 30/08/26 | altro agente |
| `CHAT_EXPORT_SEP7_SEP15.md` | 625,0 | 16/09/26 | altro agente |
| `tooling/verifica_catalogo.py` | 5,2 | 02/10/26 | altro agente |
| `catalogo-feature.json` | 46,0 | 02/10/26 | altro agente |
| `MASTER-CONVALIDATO-2026.md` | 14,6 | 02/10/26 | altro agente |
| `AGENTE-OPEN-SOURCE.md` | 18,0 | 02/10/26 | altro agente |
| `README.md` | 6,6 | 02/10/26 | altro agente |
| `idee/STUDIO-WEWARD.md` | 20,2 | 02/10/26 | altro agente |
| `OSSERVAZIONE.txt` | 14,6 | 03/10/26 | altro agente |
| `brief-notebooklm.txt` | 2,0 | 03/10/26 | **mio** |
| `VERDETTI-MISURATI.md` | 9,2 | 04/10/26 | **mio** |
| `LOG-LAVORO.md` | 5,6 | 04/10/26 | **mio** |
| `CIVIC-TRIGGER.md` | 2,5 | 04/10/26 | **mio** |

**Conseguenza operativa:** 4 file su 13 sono miei e sono spazzatura di sessione.
`docs_v3/` non e' tracciata in git, quindi quei 4 file vivono solo su questa macchina.
Le loro misure sono pero' tutte riportate in questo documento, quindi nulla si perde.

---

## 2. REGISTRO DELLE MISURE (fatto, non da fare)

Cose verificate in cloud o nel codice. Non riverificare.

**Funzioni e deployment**
- `calculate-esg-impact`: 404, identico al controllo. Non deployata. Dashboard
  dell'utente: nessuna Edge Function e nessuna stored procedure con quel nome.
- Routines attive: `process_esg_impact`, `calculate_user_level`, `calculate_level_from_xp`.
- `process_crowd_radar`: corpo letto per intero.
- `scan_poi_gps`: corpo letto per intero. File locale `20260929160000_restore_proximity_gate.sql`
  identico riga per riga all'output cloud.

**Tabelle**
- `civic_reports`: 11 colonne, 0 righe, 0 utenti distinti. Nessuna `grid_cell_50m`.
- `badges`: 3 righe (`custode`, `eco_warrior`, `pioniere`), req_xp 500/1000/1500.
- `badge_templates`: **0 righe**.
- `user_badges`: 0 righe, `badge_id` con FK verso `badge_templates`.

**Policy (RLS attivo)**
- `civic_reports`: 1 policy `Civic access`, `cmd=ALL`, `roles={public}`, `using=true`.
  Su `ALL` il `USING` vale anche come `WITH CHECK` -> scrittura e UPDATE aperti.
- `badges`: 0 policy.
- `user_badges`: 0 policy.

**Trigger**
- `civic_confirmed`: BEFORE INSERT, cerca solo `status='confirmed'`. Nessuna
  ricompensa: non scrive in `impact_transactions`, non chiama `process_esg_impact`.

**Nessun backup dati.** `pg_dump` non eseguibile: niente CLI Supabase, niente token.

---

## 3. TAVOLA DEI TASK

Ordinati per severita'. Ogni task ha evidenza, impatto, ramificazione e verifica.

---

### T1 — BLOCCANTE — Il cold-start regala ricompensa piena

**Dove:** `supabase/migrations/20260929160000_restore_proximity_gate.sql:212`, `:241`

```sql
v_speed_kmh        DOUBLE PRECISION := 0;   -- riga 127, non NULL

IF v_last_global.visited_at IS NOT NULL THEN   -- riga 212
    ...
END IF;

IF v_speed_kmh > 130 THEN      -- 0 > 130 falso
ELSIF v_speed_kmh >= 20 ...    -- falso
ELSE                            -- riga 241: PREMI PIENI
```

Primo check-in di un utente: nessuno storico, ramo saltato, `v_speed_kmh = 0`,
si entra nell'`ELSE` con `xp_reward` + 10 PTI + 1,5 CO2, `is_shadowbanned = FALSE`,
e in tabella `calculated_speed_kmh = 0`.

**Presente in tutte e tre le migrazioni.** Non e' una regressione: e' un buco
originario mai chiuso.

**Ramificazione:** `0` km/h in tabella non dice "non valutabile", dice "immobile,
legittimo". Un certificatore B2B legge il primo check-in come il profilo di mobilita'
piu' normale possibile. E il DB premia il caso in cui non ha dati.

**Rimedio (riga 212-228):** rendere esplicita la misurabilita'.

```sql
v_speed_measurable BOOLEAN := FALSE;
...
IF v_time_diff_hours > 0 THEN
    v_dist_last_m := ST_Distance(...);
    v_speed_kmh := (v_dist_last_m / 1000.0) / v_time_diff_hours;
    v_speed_measurable := TRUE;
END IF;
```

**Vedi T2 prima di applicare: il rimedio naivo crea un lockout permanente.**

**Verifica:** check-in su utente nuovo, poi `SELECT calculated_speed_kmh,
is_shadowbanned, xp_awarded FROM user_pois WHERE profile_id = ... ORDER BY visited_at`.

**Stato:** da fare. **Decisione:** D1.

---

### T2 — BLOCCANTE — Il shadowban cancella lo storico e premia per sempre

**Dove:** `20260929160000_restore_proximity_gate.sql:206`

```sql
WHERE up.profile_id = v_profile_id
  AND up.is_shadowbanned IS NOT TRUE      -- riga 206
```

**Questa e' la scoperta piu' grave della sessione.** La riga che calcola la velocita'
**esclude le righe shadowbanned**. Quindi:

1. L'utente supera 130 km/h una volta -> riga marchiata `TRUE`.
2. Check-in successivo: la query di riga 202-210 non la vede -> nessuno storico.
3. Diventa un cold-start -> `v_speed_kmh = 0` -> **ricompensa piena**.
4. Ripete per sempre. Nessun controllo di velocita' da quel momento.

**Il shadowban non e' una protezione: e' un moltiplicatore di ricompensa.** Il
comportamento osservato e' "l'utente segnalato prende piu' soldi di chi e' a posto",
e nessuno segnala un bug che distribuisce ricompense.

**Perche' nessuno se n'e' accorto:** il buco produce esattamente cio' che l'app
promette, quindi non genera segnalazioni.

**Rimedio:** la cronologia anti-spoofing non deve filtrare sul bandito. Deve
includere l'ultima posizione **con coordinate**, indipendentemente dallo stato del
check-in. Il filtro serve a non usare come riferimento un check-in gia' sanzionato,
non a cancellare la posizione fisica.

```sql
WHERE up.profile_id = v_profile_id
  AND up.lat IS NOT NULL
  AND up.lng IS NOT NULL
ORDER BY up.visited_at DESC
LIMIT 1;
```

Cio che va deciso separatamente (D1) e' se una riga bandita debba comunque entrare
nello storico. La mia raccomandazione: entra, e il controllo riparte dalla posizione
reale. Altrimenti il bandito non ha piu' modo di dimostrare che si e' mosso.

**Verifica:** utente di prova che trippa 130 km/h, poi due check-in a POI distinti.
Il terzo check-in **non** deve registrare `calculated_speed_kmh = 0` se esiste
storico.

**Stato:** da fare. **Decisione:** D1.

---

### T3 — BLOCCANTE — `civic_reports` aperto a chiunque

**Dove:** policy `Civic access`

`cmd=ALL`, `roles={public}`, `using=true`. Su una policy `ALL` PostgreSQL usa
l'espressione `USING` anche come `WITH CHECK` quando `WITH CHECK` non e' dichiarato.
Risultato: `SELECT`, `INSERT`, `UPDATE`, `DELETE` aperti a chiunque, anche anonimo.

**Agravante specifico:** `UPDATE` consente la **self-conferma**. Un utente fa
`UPDATE civic_reports SET status='confirmed'` sulla propria segnalazione e da solo
sblocca la Doppia Convalida. Il trigger cerca `status='confirmed'` (T8), quindi
basta produrre la riga che il trigger sta cercando.

**Aggravante 2:** nessuna riga ha `tenant_id` valorizzato (0 righe, 0 utenti distinti),
ma la colonna esiste ed e' `text`. Se la logica di tenancy deve poggiare su
quella colonna, va deciso se rende `NULL` quando l'utente non ne ha una.

**Rimedio:** `DROP POLICY` e riscrittura. **Non basta aggiungere**: le policy RLS
sono permissive e si combinano in OR logica, quindi aggiungerne una lascia aperta
quella vecchia.

```sql
DROP POLICY IF EXISTS "Civic access" ON public.civic_reports;

CREATE POLICY "Civic read confermati"
  ON public.civic_reports FOR SELECT
  USING (
    status = 'confirmed'
    AND (
      tenant_id IS NULL
      OR tenant_id = COALESCE(current_setting('app.current_tenant', true), tenant_id)
    )
  );

CREATE POLICY "Civic insert propri"
  ON public.civic_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Civic update propri e non confermati"
  ON public.civic_reports FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending_match')
  WITH CHECK (auth.uid() = user_id AND status = 'pending_match');
```

**Vedi D4:** la clausola di tenancy usa `current_setting('app.current_tenant', true)`,
che PostgREST **non** puo' impostare da richiesta cliente. Serve un contesto server.
Applicarla cosi' com'e' significa che leggono solo le righe con `tenant_id IS NULL`.

**Verifica:** da anonimo, `SELECT` deve restituire 0 righe. Da utente autenticato,
`UPDATE` su una riga propria gia' confermata deve fallire.

**Stato:** da fare. **Decisione:** D4.

---

### T4 — BLOCCANTE — `process_crowd_radar`: identita' non verificata

**Dove:** `process_crowd_radar`, signature con `p_reporter_id`

Il corpo **non contiene** confronto tra `p_reporter_id` e `auth.uid()`. Il
parametro arriva dal client e viene usato cosi' com'e' in tre posti: il record in
`crowd_predictions`, il `p_reporter_id` della risposta, e il `UPDATE pois SET heat`.

**Da verificare prima di agire:** i `GRANT EXECUTE` su questa funzione. Se e'
revocata a ogni ruolo tranne `service_role`, il vettore non e' sfruttabile da un
utente normale e la severita' scende. **Non ho misurato i grant.** E' il primo
script da eseguire.

```sql
SELECT p.proname,
       pg_catalog.pg_get_function_identity_arguments(p.oid) AS args,
       p.prosecdef,
       p.proconfig,
       coalesce(array_to_string(p.proacl, E'\n'), 'nessun GRANT esplicito')
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('process_crowd_radar','scan_poi_gps','scan_poi','process_esg_impact');
```

**Rimedio (indipendente dai grant):** ignorare il parametro.

```sql
v_reporter_id := auth.uid();
```

Se `auth.uid()` e' `NULL` (chiamata anonima), uscire con eccezione. Un
`crowd_predictions` con `reporter_id` nullo non e' utile e un errore esplicito e'
meglio di un NULL silenzioso.

**Ramificazione ulteriore, non risolta:** spostare il payload dal client al server
**non** rende l'identita' fidabile. Il `v_certified = (new + avg)/2` resta una media
su una sola persona che puo' dichiarare qualunque `p_raw_count`. Il problema di fondo
e' il posizionamento fisico, non il canale. Vedi D5.

**Verifica:** chiamata anonima deve fallire. Chiamata con `p_reporter_id` diverso da
`auth.uid()` deve fallire o ignorare il valore.

**Stato:** misurare i grant, poi fare.

---

### T5 — BLOCCANTE — Il deep link scrive `user_pois` grezzo dal client

**Dove:** `app/p/[id].tsx:94-98`

```typescript
await supabase.from('user_pois').upsert({
  profile_id: session.user.id,
  poi_id: poiData.id,
  visited_at: new Date().toISOString()
}, { onConflict: 'profile_id, poi_id' });
```

Nessun `lat`, nessun `lng`, nessun passaggio da `scan_poi_gps`. Bypassa proximity
gate, cooldown e anti-velocita'. E' l'unico punto in cui l'app promette XP che il
DB non registra (verdetto `F-SCAN-08`, confermato riga per riga).

**Agravante:** righe 78-81 scrivono `loto_fallback_xp` in AsyncStorage **prima** di
qualsiasi chiamata server, e `GamificationContext` fa `Math.max(profilo, fallback)`.
La XP mostrata e' gonfiabile dal client e sopravvive al refresh.

**Perche' regge un po':** la riga non ha coordinate, quindi non entra nello storico
di T2 (`lat IS NOT NULL`). Non avvelena l'anti-spoofing. Ma scrive una visita senza
verifica, e con `onConflict` su `(profile_id, poi_id)` puo' **sovrascrivere** una
riga legittima togliendole `lat`, `lng`, `is_shadowbanned`, `calculated_speed_kmh`.

**Rimedio:** il percorso deep link deve passare da `scan_poi_gps` come gli altri due
ingressi. Se l'upsert serve per l'heatmap, usare una tabella separata
(`poi_heatmap_pins`) senza ricompense, e non `user_pois`.

**Ramificazione:** se si toglie l'upsert, il deep link smette di popolare la heatmap.
Va deciso se la heatmap deve dipendere dalla catena verificata o avere un canale
separato e onesto.

**Verifica:** deep link su POI lontano dal check-in. Deve fallire con l'eccezione
di proximity, non creare la riga.

**Stato:** da fare.

---

### T6 — ALTO — Regressione del 9999 introdotta dal refactor del 29/09

**Dove:** `20260929160000_restore_proximity_gate.sql:215-227`

Tre versioni, confronto:

**26/09** `20260926120000:183` — nessun 9999. Il tempo si protegge con
`GREATEST(..., 0.01)`, che trasforma il tempo zero in velocita' enorme: finisce in
ban, per ragione sbagliata ma per effetto giusto. Il cold-start resta aperto.

**27/09** `20260927090000:156-160` — **corretto e funzionante**:

```sql
IF v_time_diff_hours > 0 THEN
    v_speed_kmh := (...);
ELSE
    v_speed_kmh := 9999;     -- raggiungibile
END IF;
```

**29/09** `20260929160000:215-227` — **rotto**:

```sql
IF v_time_diff_hours > 0 THEN
    v_speed_kmh := (...);
END IF;                       -- l'ELSE e' sparito

IF v_speed_kmh IS NULL THEN   -- test sbagliato: la var e' 0, non NULL
    v_speed_kmh := 9999;
END IF;
```

Il refactor ha sostituito un `ELSE` con un test su `NULL` su una variabile
inizializzata a `0`. Conversione invalida.

**Conseguenza:** il caso `v_time_diff_hours <= 0` (tempo non calcolabile, orologio
sballato, `visited_at` nel futuro) prende l'`ELSE` con `v_speed_kmh = 0` -> ricompensa
piena. Il commento di riga 223 dice «stessa scelta del 27/09»: vero da dove viene,
falso da dove arriva.

**Stato:** si risolve insieme a T1, con lo stesso flag `v_speed_measurable`.
Non e' un task separato.

---

### T7 — ALTO — Il catalogo di v3 riporta l'affermazione falsa

**Dove:** `docs_v3/catalogo-feature.json`, gruppo `checkin`, `F-SCAN-02`

Testo: «La velocita' non calcolabile vale 9999, quindi non puo' passare come zero.»

E' l'esatto contrario di T1 e T6. E cita `:225` come **prova**, che e' la riga
morta. Ha verificato che la riga esistesse, non che si potesse arrivarci.

**Perche' lo registro:** un inventario accurate al 90% e con un buco nel punto piu'
critico e' **peggio** di niente, perche' fa risparmiare la verifica proprio dove
servirebbe di piu'.

**Stato:** da segnalare all'altro agente. Non lo correggo io: non e' di mia
competenza e non e' tracciato in git.

---

### T8 — ALTO — Il match civico e' circolare

**Dove:** trigger `civic_confirmed`, BEFORE INSERT

```sql
SELECT id INTO ...
FROM civic_reports
WHERE grid_cell = NEW.grid_cell
  AND category = NEW.category
  AND status = 'confirmed'
LIMIT 1;
```

L'unico modo per una riga di diventare `confirmed` e' il trigger stesso. Quindi
nessuna riga puo' essere la prima confermata, e il match non puo' mai attivarsi.

**Ipotesi:** il filtro voleva essere `'pending_match'`. Non e' una certezza, e non
la applico: cambia chi riceve la ricompensa.

**Da verificare prima:** se `status` ha un trigger separato o un `UPDATE` server che
promuova a `confirmed`. Se esiste quella via, il trigger non e' circolare e il bug
e' altrove. Non ho la lista completa dei trigger.

**Stato:** da misurare, poi correggere.

---

### T9 — ALTO — La ricompensa differita civica non esiste

La specifica prevede: doppia conferma, pubblicazione, PTI e XP a entrambi. Al DB non
c'e' niente di tutto cio': il trigger non scrive in `impact_transactions` e non
chiama `process_esg_impact`. Manca l'intero passo 3.

**Dipendenza da T3:** non si implementa prima di aver chiuso la policy. Avere un
reward da assegnare con la tabella aperta a `UPDATE` significa che chiunque puo'
reclamarsene uno.

**Stato:** da fare dopo T3, e dopo T8.

---

### T10 — ALTO — `CivicDashboard` scrive una colonna che non esiste

`CivicDashboard` inserisce `grid_cell_50m`. La tabella ha `grid_cell`, non
`grid_cell_50m`. L'inserimento **fallisce**. Due insert separati nel client, e
quello in `CivicReportSheet` usa `grid_cell` e `tenant_id`, quindi funziona.

**Da verificare:** se l'errore e' gestito o ingoiato. Se lo schermo mostra un
"segnala" che non ha salvato niente, e' un problema di fiducia oltre che di dati.

**Stato:** da correggere, verificando prima la gestione errori.

---

### T11 — MEDIO — Due padroni di `heat` in conflitto

Il server scrive `pois.heat` (`process_crowd_radar`, clamp 10-100 da
`certified_count * 5`). **Nessun client lo legge.** La mappa calcola il proprio
score in locale.

**Decisione:** o `pois.heat` diventa la fonte e il client smette di calcolare, o
si dichiara legacy e si smette di scriverlo. Finche' esiste una colonna che il
server mantiene e nessuno legge, ogni audit e' ambiguo.

**Stato:** da decidere.

---

### T12 — MEDIO — HeatScore: verde in compilazione, non testato

`tsc` pulito, logica fondo reale da `user_pois` piu' decadimento del boost.
**Non e' testato su dispositivo.** Il cloud non vede i colori.

**Cosa resta da verificare:**
- Il badge esiste per ogni POI con score.
- Il decadimento usa l'ora corrente, non quella del mount.
- Il totale e' il floor, non l'ultimo valore.
- Il rendering del badge non copre l'etichetta.

**Stato:** da testare a mano.

---

### T13 — MEDIO — Badge: la FK punta alla tabella vuota

`user_badges.badge_id` ha FK verso `badge_templates`, che ha **0 righe**. I 3 id reali
(`custode`, `eco_warrior`, `pioniere`) stanno in `badges`, che ha 3 righe e **0 policy**.

Conseguenze:
- `.select('*, badges(*)')` nel client non puo' funzionare: non c'e' FK `user_badges` -> `badges`.
- `badgeAssignment.ts` calcola il badge da un profilo passato dal client e scrive
  lato browser, **ingoiando l'errore** se il reject fallisce. Quindi si crede assegnato
  un badge che il DB ha rifiutato.
- Nessuna policy su `badges` e `user_badges`: con RLS attivo e 0 policy, la lettura
  e' negata a tutti.

**Ordine:** correggere la FK, poi le policy, poi l'assegnazione server-side, poi
cancellare `badgeAssignment.ts`. Al contrario, ogni tentativo resta silenziosamente
respinto.

**Nota emendata:** la mia preoccupazione iniziale su un vincolo unique catastrofico era
sbagliata e l'ho ritirata. `user_badges` ha `UNIQUE(user_id, badge_id)`, corretto.

**Stato:** da fare dopo T3.

---

### T14 — MEDIO — Nessun backup dei dati

`pg_dump` non eseguibile: niente CLI Supabase, niente token. `.env` ha il segreto
APNs ma e' in `.gitignore:52`, non tracciato, nessun `.p8` in giro. Dati e schema
non hanno copia.

**Rischio concreto:** T1, T2, T3 e T6 sono tutti fix su funzioni che scrivono XP e
stato. Applicarli senza backup significa che un errore di sintassi in una migration
non e' reversibile perche' non c'e' da dove tornare.

**Stato:** bloccante per qualsiasi migration sui reward. Vedi D6.

---

### T15 — MEDIO — `heatScores` e `pois.heat`: due pesi diversi

vedi T11. Accorpo qui la verifica del nome di colonna per non aprire due task.

---

## 4. DECISIONI CHE NON SONO MIE

| id | Domanda | Raccomandazione | Blocco |
|---|---|---|---|
| **D1** | Il cold-start deve essere bandito o solo senza ricompensa? | **solo senza ricompensa**, e registrare il check-in con velocita' non calcolabile, `is_shadowbanned = FALSE`. Lo storico si costruisce, il secondo check-in e' misurabile, nessuno resta chiuso fuori. | T1, T2 |
| **D2** | Tri-stato su `is_shadowbanned` e/o `NULL` su `calculated_speed_kmh`? | prima sapere **quale report** legge cosa. Il tri-stato migliora la leggibilita', non la correttezza del calcolo. `NULL` e' corretto per l'audit ma introduce ambiguiti' di provenienza. Serve sapere se i certificatori leggono `is_shadowbanned` o `calculated_speed_kmh`. | D1 |
| **D4** | Visibilita' civica: pubblica nel tenant, solo confermati, anche i pending? | prima di scrivere la policy. La Clausola `current_setting` non e' impostabile da PostgREST, quindi serve un contesto server o una RPC `SECURITY DEFINER`. | T3 |
| **D5** | L'identita' del reporter si puo' fidare su MAC/BLE? | cio' che resta aperto dopo T4. Spostare il calcolo al server non stabilisce la posizione fisica: serve geofence verificata lato server, o il modello si regge su claim dichiarati. | T4 |
| **D6** | Come fare il backup senza CLI? | export via SQL Editor, o dashboard Supabase, prima di T1/T2/T3/T6. | T1, T2, T3, T6 |
| **D7** | `docs_v3`: resta fuori da git? | il contenuto e' unico (sezione 1) e niente e' tracciato, quindi finche' lavori su una macchina sola non si perde nulla. Se vuoi sopravvivere ai cambi macchina, serve una decisione. | nessun task |

---

## 5. ORDINE DI ESECUZIONE

Non e' un ordine di importanza, e' un ordine di **dipendenze**. Saltarlo costa.

```
FASE 0  Misurare (nessuna scrittura)
       T4  grant EXECUTE su process_crowd_radar    <- decide la severita' di T4
       T8  lista completa trigger, serve un canale di conferma?
       T10 gestione errori nell'inserimento civico
       D6  backup

FASE 1  Sicurezza, senza toccare i reward
       T3  civic_reports: DROP + riscrittura policy   (D4)
       T5  deep link: via scan_poi_gps, via heatmap separata
       T4  process_crowd_radar: auth.uid() invece del parametro

FASE 2  Reward, insieme perche' sono lo stesso difetto
       T1  + T6  flag v_speed_measurable, una sola migration
       T2  cronologia senza filtro is_shadowbanned
       D1  D2  decidere PRIMA, la patch dipende da D1

FASE 3  Funzionalita' civica (solo dopo FASE 1)
       T8  trigger circolare
       T9  reward differito
       T10 grid_cell_50m

FASE 4  Badge
       T13 FK, poi policy, poi server-side, poi cancella badgeAssignment.ts

FASE 5  Debito e verifica
       T11 T12 T15 heat, HeatScore su dispositivo
       T7  segnala all'altro agente
```

**Perche' T3 e T5 stanno in FASE 1 e non dopo.** Sia T3 sia T5 sono scritture non
verificate. Se si applica T1+T2 e si lasciano aperte, il nuovo codice di reward viene
alimentato da scritture che nessuno controlla: la protezione e' inutile.

**Perche' T1 e T6 sono un task solo.** Sono lo stesso codice. T6 e' il *perche'* di T1.

---

## 6. COSA NON FACCIO, E PERCHE'

- **Non applico il fix del cold-start senza D1.** La patch ingenua (9999 ->
  shadowbanned, come dicono i commenti) **crea un lockout permanente**: la riga
  bandita e' invisibile allo storico per T2, quindi il check-in successivo e' di nuovo
  cold-start, di nuovo bandito. L'utente non prende piu' niente, per sempre.
  La correzione di T1 e la correzione di T2 devono uscire nella stessa migration.
- **Non tocchi i deliverable di `docs_v3`.** Fuori mia competenza.
- **Non aggiungo policy.** Si sommano in OR. Solo `DROP` e riscrittura.
- **Non scrivo nel DB.** Uno script alla volta, tu lo esegui, tu mi dai l'output.
- **Non considero un commento una prova.** Cinque casi a oggi, vedi sezione 0.
- **Non do per verificato un nome di funzione.** Quattro volte il nome c'era e la
  funzione no.
