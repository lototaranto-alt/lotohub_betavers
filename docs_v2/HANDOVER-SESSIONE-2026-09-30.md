---
id: HANDOVER-SESSIONE-2026-09-30
tipo: analisi
ambito: stato-di-uscita-e-primi-passi-per-la-prossima-sessione
stato: Vivente
confidenza: Alta
owner: Agent
aggiornato: 2026-09-30
evidenza:
  - supabase/migrations/20260930210000_fix_impact_transactions_schema.sql:1
  - docs_v2/VALUTAZIONE-PROGETTO.md:1
  - docs_v2/tooling/autorita.json:1
---

# Chiusura sessione 30/09 — stato e primi passi

Sessione dedicata alla **sicurezza del motore di impatto** e alla **governance**. Il branch è
pulito, tranne due file che sono volutamente **non committati** (vedi §5).

---

## 1. Cosa è stato chiuso

| cosa | stato |
|---|---|
| `p_party_size` neutralizzato con tetto server | chiuso, verificabile |
| `user_id` non più parametro della RPC, arriva da `auth.uid()` | chiuso |
| `search_path` fissato a `public, pg_temp` | chiuso |
| firma RPC allineata al client | chiuso |
| tabella `impact_transactions` riportata nelle migration | chiuso |
| schema di `impact_transactions` allineato al **cloud reale** | chiuso |
| `A3-T14` riaperta: il repo non riproduce il DB | **fatto, ma aperta** |
| `A3-T14b` — allineare le 21 tabelle mancanti | da fare |
| crediti autoassegnati dal client | **aperto** |
| proximity gate attivo lato server | **aperto** |
| `location_pings` mancante | **aperto** |

---

## 2. Il fatto che cambia la prossima sessione

Il database reale **esiste ed è sano**: 25 tabelle, relazioni, indici, spatial. Ma delle 25,
le migration del repository ne creano **4**.

Non è un progetto da ricostruire. È un progetto il cui database è stato costruito e poi non
tracciato. La differenza è che il lavoro c'è già: l'esportazione è meccanica, non è
archeologia.

`impact_transactions` è l'esempio che vale per tutti. Esisteva, aveva uno schema **diverso**,
e la mia `CREATE TABLE IF NOT EXISTS` ha fatto nothing senza segnalare nulla. Da lì la
regola, che vale per `A3-T14b`: **su tabella preesistente la convergenza è
`ALTER TABLE ... ADD COLUMN IF NOT EXISTS`**, e quando repo e cloud divergono la ragione ce la
ha il cloud, perché è l'unica copia reale.

---

## 3. Primo passo, in assoluto

Applicare **`supabase/migrations/20260930210000_fix_impact_transactions_schema.sql`**.

La `20260930180000` era già applicata e Supabase non riesegue una migration registrata: per
questo il correttivo è un file **separato** e non una modifica del primo. Dopo l'applicazione,
girare **C1** (colonne) e **C3** (la chiamata vera dentro `BEGIN`/`ROLLBACK`) in coda al file.

C3 attende: `co2_saved = 1.0` e **non** `1000000`, con `party_size_reported = 999999` nella
stessa riga. Quel contrasto è la prova che il tetto ha funzionato.

**Rollback, non commit.** La funzione scrive davvero sul ledger e tocca i saldi del profilo di
test. `impact_transactions` è append-only per scelta.

### Poi, in ordine

1. **`scan_poi_gps` come unico ingresso pubblico.** Revocare `EXECUTE` su
   `process_esg_impact` a `authenticated`. Un passo solo chiude due problemi aperti: il credito
   autoassegnato e il gate lato server. Il codice c'è già: calcola sul server, ha cooldown e
   anti-velocità. Va **attivato**, non riscritto.
2. **`A3-T14b`** — esportare lo schema reale e allineare le 21 tabelle mancanti.
3. **`types/database.ts`** — ancora obsoleto su `get_poi_vetrina(p_poi_id)` e senza le nuove
   firme.
4. **Autenticazione e multi-tenancy**, gli ultimi due domini `vuoto` che bloccano il B2B.

---

## 4. Query cloud ancora da eseguire

L'agente non ha accesso al cloud: le esegue l'utente e riporta l'output.

| file | cosa chiede |
|---|---|
| `docs_v2/verifica-v6-senza-commenti.sql` | V6, il moltiplicatore. Cinque righe, senza commenti |
| `diagnostica-gate-vault.sql` | D2–D6, eseguita solo D1 |
| `query-cloud-q17-q27.sql` | Q17–Q27: `tenants.id`, `get_distance`, Double GPS Handshake, soglie 1/5/10 |
| `verifica-proximity-gate.sql` | proximity gate |

`Q17` ha un indizio nuovo: **`impact_transactions.tenant_id` è `text`**, non `uuid`. Se
`tenants.id` è coerente, l'errore di risoluzione tenant a `index.tsx:286` non è di sessione ma
di tipo.

---

## 5. File NON committati, e perché

`docs_v2/MAPPA-TECNICA-CODICE.md` e un file temporaneo di sessione restano **non tracciati**.
Il primo è materiale in rigenerazione, non verificato: l'utente lo ha dichiarato non affidabile.
Non entra nella documentazione per la stessa ragione per cui non abbiamo accettato uno schema
`impact_transactions` plausibile ma non misurato.

Se in futuro si vuole committarlo, va prima verificato riga per riga.

---

## 6. Decisione di strategia, ancora aperta

`docs_v2/VALUTAZIONE-PROGETTO.md` conclude che la domanda da decidere è **B2C o B2B**, e che i
requisiti sono incompatibili. Nel B2C si può chiudere presto. Nel B2B servono attribuibilità,
integrità e metodologia documentata, e i primi due sono esattamente i punti 3.1 e 3.2.

Vale la pena decidere **prima** di costruire altro, perché cambia il lavoro da fare.

---

## 7. Stato ambientale

- Nessun processo di progetto attivo. `adb` chiuso.
- Un `node` di Adobe Creative Cloud era in esecuzione: **non è nostro**, lasciato stare.
- Per il test su dispositivo: il server ADB va riavviato, la connessione wireless non è più
  attiva. In caso di cavo, `adb usb` dopo averlo riavviato.

---

## 8. Cosa non è stato toccato, e sta bene così

- **`app/_layout.tsx`** — Zero-PII già committato, nessuna modifica in sessione.
- **Design e UI** — nessuna modifica. Non è il collo di bottiglia.
- **Le 63 query cloud** — restano snapshot. Non vengono eseguite dal client.
- **Feature nuove** — nessuna. Non mancano; manca che le esistenti funzionino.

---

*Sessione chiusa il 30/09/2026. Branch `fix/ripristino-lavoro-15-set-selective`, ultimo commit
`80031d2`.*
