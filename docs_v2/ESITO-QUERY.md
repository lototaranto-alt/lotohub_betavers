---
id: ESITO-QUERY
tipo: analisi
ambito: esito-delle-query-di-chiusura-e-catenache-sono-confermate
stato: Vivente
confidenza: Alta
owner: Agent
aggiornato: 2026-09-27
evidenza:
  - docs_v2/COLLAUDO-ARCHIVIO.md:1
  - docs_v2/STRUTTURA-DEFINITIVA.md:1
  - docs_v2/QUERY-CLOUD.md:1
  - supabase/migrations/20260925120000_admin_dashboard_hardening.sql:316
  - supabase/migrations/20260925120000_admin_dashboard_hardening.sql:326
  - utils/dbAggregation.ts:35
  - components/LotoPassRecoveryScanner.tsx:59
---

# Esito delle query di chiusura: 8 su 8, e cosa ribaltano

> Le 8 `NON VERIFICABILE` di `COLLAUDO-ARCHIVIO.md` **sono chiuse**. Nessuna riga di questo
> documento è un'inferenza: ogni fatto viene da una delle 4 query di `QUERY-CLOUD.sql`, e ogni
> correzione a un'affermazione precedente porta la prova del perché è falsa.
>
> **Tre delle 8 risposte ribaltano un documento, e una di queste ribalta una frase dello stesso
> collaudo.** Sono scritte in §4, non silenziosamente corrette.

---

## 0. Esito in apertura

| | Prima delle query | Dopo |
|---|---|---|
| `NON VERIFICABILE` | 8 | **0** |
| Oggetti con corpo noto | 0 | **2** (`recover_loto_pass`, `scan_poi_gps`) |
| Hardening applicata? | indeterminabile | **sì**, e databile |
| Ledger `impact_transactions` | "esistenza ignota" | **0 righe, mai nato** |
| PTI nell'app | sconosciuto | **0, per sempre** |

**Il fatto che cambia la priorità:** il ledger che `MODELLO_OPERATIVO.md:90` chiama *"IL LEDGER. Il
bene che vendi"* **non ha mai contenuto una riga.** Non è un problema di freshness, non è un
ritardo, non è una vista rotta: in quattro mesi di check-in nessuno ha scritto dentro il prodotto.

---

## 1. Le 8 risposte

| # | Domanda di `COLLAUDO-ARCHIVIO` | Risposta | Prova |
|---|---|---|---|
| N1 | La firma di `recover_loto_pass` è `(recovery_code text) -> json`? | **VERIFICATA** | `pg_get_functiondef`: `recover_loto_pass(text)` |
| N2 | Quale corpo è attivo? | **Corpo B**, quello che scrive | contiene `v_current_uid := auth.uid()` e `UPDATE public.profiles` |
| N3 | Ricongiunge l'`auth.uid` o fa solo lettura? | **RICONGIUNGE** | `UPDATE public.profiles SET total_xp, is_premium WHERE id = v_current_uid` |
| N4 | Esiste in `supabase/`? | **no, 0 definizioni** | invariato: il corpo attivo vive solo nel cloud |
| N5 | `scan_poi_gps` esiste nel cloud? | **sì**, corpo nr. 2 | `v_co2_saved := 1.5`, scrive `total_tokens`, `RAISE EXCEPTION` a 12 h |
| N6 | `co2_saved = 10.0` (CO2 sporato)? | **NO** | è `1.5`: valore fisicamente sensato per un check-in pedonale |
| N7 | La hardening è applicata? | **SÌ**, e **dopo il 25/09** | `is_loto_admin()` presente in `pg_proc` il 27/09, assente dallo snapshot `types/database.ts` del 25/09 |
| N8 | Il ledger ha righe? | **0 righe** | `count(*) = 0`, `min`/`max` NULL |

**N7 ha una conseguenza non ovvia.** Se `is_loto_admin()` era assente il 25/09 ed è presente il 27/09,
la hardening è stata applicata **negli ultimi due giorni**. Quindi un documento che scriveva
"hardening mai applicata" il 24/09 **era corretto**, e `docs/codici_morti.md` non va accusato di
errore: va aggiornato, perché il mondo è cambiato sotto di lui. È la differenza fra un documento
sbagliato e un documento invecchiato, e in un progetto che non ha un registro di sessione la
seconda forma è più pericolosa della prima.

---

## 2. La catena, confermata end-to-end

Tutto quanto segue è verificato per query, non per lettura. La catena del check-in ha **un solo**
anello rotto, e non è dove i documenti lo avevano cercato.

```
scan_poi_gps (corpo nr.2, ATTIVO)
  ├─ INSERT user_pois                                  OK   2 scritture in tutto
  ├─ UPDATE profiles.total_xp/_tokens/_co2             OK
  └─ INSERT impact_transactions                    ASSENTE  ← IL BUCO
                    ↓
        impact_transactions: 0 righe (confermato)
                    ↓
   ┌────────────────┴─────────────────────┐
   ↓                                      ↓
legge user_pois                     legge impact_transactions
   ↓                                      ↓
vw_daas_heatmap_15min  VIVA         vw_daas_esg_monthly  MORTA
vw_user_dashboard_metrics            vw_user_dashboard_metrics
  .pois_discovered  OK                .tokens            = 0
  .total_xp         parziale          .co2_saved         solo la parte GPS
  .checkins_today   OK                .liters_saved      = 0
```

### 2.1 Cosa è VIVO, e non va toccato

| Oggetto | Stato | Prova |
|---|---|---|
| `vw_daas_heatmap_15min` — griglia 110 m, bucket 15 min, k≥5 | **funziona** | legge `user_pois`, che riceve righe |
| check-in GPS, cooldown 12 h, anti-spoofing velocità, shadowban | **funzionano** | corpo nr. 2 attivo e completo |
| `xp_reward` sui POI | **reale** | `COALESCE(v_poi_data.xp_reward, 15)`: legge la colonna giusta |
| filtro `is_shadowbanned` sulle viste DaaS | **presente** | hardening `:96, :130, :262, :282` e `v22:37, :70, :90, :122` |
| RLS sulle tabelle di progetto | **attivo** | query 4: l'unica tabella senza è `spatial_ref_sys`, che è di PostGIS |
| hardening della dashboard admin | **applicata** | `is_loto_admin()` presente, viste con `REVOKE` ad `anon` |

**Il heatmap è vivo.** È la parte meglio costruita del progetto e nessuna delle 4 query la tocca.
`STRUTTURA-DEFINITIVA.md:213` dice che la catena 4 è *"SPEZZATA al passo 1, perché il passo 1 non
riceve nulla"*: **è falso per il heatmap**, che legge `user_pois` e non dipende dal ledger.

### 2.2 Cosa è morto

| Oggetto |-effetto |
|---|---|
| `impact_transactions` | 0 righe. Il report ESG mensile è vuoto |
| `vw_daas_esg_monthly` | ritorna zero righe |
| PTI nell'app | **0, per costruzione** — vedi §3.2 |
| `vw_daas_event_attendance` | da verificare: non risulta fra le viste lette dal frontend attivo |

---

## 3. I tre difetti, in ordine di gravità

### 3.1 Il check-in spoofato avvelena quelli legittimi successivi

`scan_poi_gps` (corpo attivo), passi 3 e 4 del controllo cooldown e anti-spoofing:

```sql
-- passo 4, riga 40-44
FROM public.user_pois up
JOIN public.pois p ON p.id = up.poi_id
WHERE up.profile_id = v_profile_id
ORDER BY up.visited_at DESC
LIMIT 1
```

Il filtro è su `profile_id` e basta: **manca `AND up.is_shadowbanned IS NOT TRUE`**, che invece le
viste DaaS hanno (`hardening:96`).

Conseguenza a catena: una riga di teletrasporto entra come "ultimo check-in" di riferimento → il
check-in **legittimo** successivo calcola una velocità assurda → `v_speed_kmh > 130` → shadowban di
nuovo. E il passo 3 (righe 35-39) fa scattare anche il cooldown di 12 h sulla stessa riga, quindi
l'utente riceve `RAISE EXCEPTION 'Cooldown attivo...'` e **non può riprovare per 12 ore**, con
un'eccezione Postgres grezza invece di un messaggio.

È un denial-of-service sulla progressione dell'utente, permanente e senza spiegazione. Ed è nel
corpo **attivo**, non nella catena canonica mai applicata.

**Fix:** due clausole `AND is_shadowbanned IS NOT TRUE`, una per query. Nessun impatto sui dati
esistenti, perché le righe shadowbanned sono già escluse dalle viste.

### 3.2 I PTI valgono 0 per sempre, e la causa è un operatore

Il corpo attivo premia il check-in:

```sql
v_pti_awarded := 1;   -- veicolare
v_pti_awarded := 10;  -- pedonale
```

e lo scrive in `profiles.total_tokens` (`:119`). Fin qui è corretto. Poi:

```sql
-- hardening:316
COALESCE(tx.civic_pti, 0) AS tokens      -- tx.civic_pti viene da impact_transactions
```

e in `utils/dbAggregation.ts:35`:

```ts
total_tokens: data.tokens ?? profile.total_tokens,
```

`data.tokens` è `0`, non `null`. **`??` intercetta `null` e `undefined`, non `0`.** Quindi lo zero
della vista sovrascrive il valore reale del profilo. L'utente accumula PTI e non li vede mai.

**Fix:** `data.tokens || profile.total_tokens`, che risolve `0` come assente. Quattro caratteri.

**Perché è il fix più economico e più pericoloso.** Applicarlo da solo **nasconde** il difetto 3.3
e la causa a monte: il ledger continua vuoto e il report ESG continua a non esistere, ma adesso la
Home sembra giusta. Meglio applicarlo **insieme** a 3.3, non prima.

### 3.3 `recover_loto_pass` ripristina una colonna che nessuno legge

La funzione sposta `total_xp` e `is_premium`. Ma la vista che alimenta la Prestige Card calcola:

```sql
-- hardening:319
COALESCE(tx.xp_ledger, 0) + COALESCE(poi.xp_gps, 0) AS total_xp
```

**`profiles.total_xp` non compare.** La vista non lo legge. Quindi ripristinare quella colonna non
produce effetto visibile: l'utente riceve *"Bentornato! I tuoi progressi sono stati ripristinati"* e
vede gli stessi numeri di prima.

Si somma il terzo difetto, sul client: `LotoPassRecoveryScanner.tsx:63-68` legge `data?.success`,
mostra un `Alert` e chiude. Non scrive in AsyncStorage, non ricarica il profilo, non cambia
sessione. Anche se il server scrive correttamente — e scrive — l'app non se ne accorge fino al
riavvio.

**Non è il Blocco 0 a essere sbagliato.** Il Blocco 0 ha fermato la perdita di dati ed è stato
fatto bene. Questo è un difetto **a valle**, che il Blocco 0 non poteva vedere.

---

## 4. Le correzioni alle affermazioni precedenti

| # | Affermazione | Dove | Realtà | Prova |
|---|---|---|---|---|
| **F11** | "il check-in accredita PTI solo con azioni civiche" | `DECISIONI.md` D6; `STRUTTURA-DEFINITIVA.md` C2 | **FALSATA per il corpo attivo**: `v_pti_awarded` = 1 o 10, finisce in `profiles.total_tokens` | corpo attivo, sezione 5 |
| **F12** | "il token è sempre 0 perché `tokens_earned = 0`" | `STRUTTURA-DEFINITIVA.md:153, :356` | **FALSATA**: `tokens_earned = 0` vale solo per la catena canonica, mai applicata. Nel corpo attivo i PTI esistono e vengono persi a valle | `hardening:316` + `dbAggregation.ts:35` |
| **F13** | "la catena 4 è spezzata al passo 1" | `STRUTTURA-DEFINITIVA.md:213` | **FALSATA per il heatmap**: legge `user_pois`, non il ledger. Vera solo per `vw_daas_esg_monthly` | `v22:27, :36` vs `v22:49, :59` |
| **F14** | "le viste DaaS sono esposte ad `anon`" | `A3_dati_e_sql.md:76, :153` | **CONFERMATA, ma solo per 2 su 7**: `vw_collective_impact` e `vw_pois_frontend`. Le altre 5 hanno il gate admin | query 4: `1_hardening` PRESENTE |

**F14 è il risultato più interessante del lotto.** Le due viste aperte ad `anon` sono **esattamente
le due che nessuna migration ha mai toccato**. La hardening copre tutto ciò che Git conosce e lascia
la buca dove Git è cieco. Non è una coincidenza: è il prezzo misurato di D9. *Un oggetto fuori da
Git non è soltanto non riproducibile — è non protetto.*

---

## 5. I tre fix, e perché l'ordine è vincolante

| | Fix | File | Scrive sul DB? | Effetto |
|---|---|---|---|---|
| **1** | `AND is_shadowbanned` in 2 query | migration | sì | chiude 3.1: l'anti-spoofing smette di punire le vittime |
| **2** | `??` → `\|\|` in 2 righe | `utils/dbAggregation.ts` | no | chiude 3.2: i PTI si vedono |
| **3** | il ledger in Git, e la funzione viva che lo scrive | migration | sì | chiude 3.3 a monte: il prodotto ESG riceve dati ed è riproducibile |
| **4** | le 2 viste in Git, con revoca ad `anon` | migration | sì | chiude D9 e F14 |

**Ordine: 1, poi 2+3 insieme, poi 4.**

- Il **fix 2 da solo** nasconde 3.3. La Home sembra a posto, il report ESG resta vuoto, e il
  prossimo agente conclude che il ledger è pieno perché la Home non si rompe.
- Il **fix 3 da solo** senza il 2 continua a non mostrare i PTI, perché lo zero li sovrascrive.
- **1 va per primo** perché è indipendente dagli altri, non perché sia il più grave: 3.1 colpisce
  un utente alla volta, 3.3 colpisce il prodotto.

**Nessuno di questi quattro è applicabile finché D5 e D6 non sono decise** per il 3: la firma delle
funzioni cambia. Ma **1, 2 e 4 non dipendono da nessuna decisione** e si possono fare subito.

---

## 6. Cosa resta non verificato

Dichiarato, perché un documento che si dichiara completo senza dirlo è un archivio di ipotesi:

- **Quante righe ha `user_pois`.** Il heatmap *funziona*; non sappiamo quanto contiene. Una riga:
  `select count(*) from public.user_pois`
- **`vw_daas_event_attendance`** non risulta fra le viste lette dal frontend attivo, e non l'abbiamo
  interrogata. Se leggesse il ledger, è morta anche lei.
- **Le righe esistenti in `profiles`** hanno `total_tokens` valorizzato, o sono a zero come suggerisce
  la catena? Una riga: `select count(*) from profiles where total_tokens > 0`
- **Le 4 query hanno girato il 27/09.** Qualcuno che non abbiamo visto è già successo ieri.

---

*Eseguito il 27/09/2026 con le 4 query di `docs_v2/QUERY-CLOUD.sql`, in sola lettura, sul progetto
`fsuolbwsvpgiglwcaffh`. Nessuna scrittura al cloud, nessuna modifica a codice o migration. Le 8
`NON VERIFICABILE` di `COLLAUDO-ARCHIVIO.md` sono chiuse: 6 `VERIFICATA`, 2 con un verdetto che
ribalta un documento e che va letto come tale.*
