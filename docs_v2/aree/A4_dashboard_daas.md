---
id: A4
tipo: area
ambito: dashboard-admin-daas-esposizione-dati-agenzie
stato: Vivente
confidenza: Alta
owner: Agent
aggiornato: 2026-09-26
evidenza:
  - loto-admin-v2/src/app/(dashboard)/daas/page.tsx:1
  - loto-admin-v2/src/lib/daas.ts:1
  - loto-admin-v2/src/middleware.ts:1
  - loto-admin-v2/src/lib/supabase-server.ts:1
  - loto-admin-v2/src/app/login/login-form.tsx:1
  - supabase/migrations/20260925120000_admin_dashboard_hardening.sql:1
  - git:bb0fa37
  - git:e69492f
  - supabase/migrations/20260925120000_admin_dashboard_hardening.sql:332
  - supabase/migrations/20260925120000_admin_dashboard_hardening.sql:365
---

# A4 - Dashboard admin DaaS: esposizione dei dati alle agenzie

> Risponde a: "come sono esposte le viste DaaS, chi puo' leggerle, e la dashboard e' realmente
> in linea?"

Questa e' l'area piu' recente (25/09) e quella con la verifica piu' solida: la protezione e' stata
progettata, non aggiunta dopo.

---

## 1. Cosa dice il codice

### Il progetto

`loto-admin-v2/` dentro il repo madre. Next.js + Tailwind, deploy Vercel, sessione Supabase Auth
lato server.

| Componente | File | Funzione |
|---|---|---|
| Login | `src/app/login/{page,login-form}.tsx` | form di accesso, account admin `loto.taranto@gmail.com` |
| Sessione server | `src/lib/supabase-server.ts` | client Supabase con cookie di sessione. Sostituisce il vecchio `src/lib/supabase.ts`, **rimosso** in `bb0fa37` perche' esponeva la chiave al browser |
| Gate ruolo | `src/middleware.ts` | blocco lato server, prima del rendering |
| Layout | `src/app/(dashboard)/{layout,page}.tsx`, `src/components/{Sidebar,LogoutButton}.tsx` | guscio navigazione |
| Report DaaS | `src/app/(dashboard)/daas/page.tsx` (576 righe) + `src/lib/daas.ts` | le viste, l'aggregazione, la resa |
| Landing | `src/app/download/page.tsx` | pagina pubblica, zero-UI Partner |
| Privacy | `src/app/privacy/page.tsx` | informativa |

### I due commit

| Commit | Data | Contenuto |
|---|---|---|
| `e69492f` | 25/09 19:45 | `feat(admin): add DaaS reports dashboard` - 5 file, +714/-15 |
| `bb0fa37` | 25/09 21:04 | `feat(admin): secure DaaS dashboard and privacy views` - 17 file, **+1124/-91** |

Il secondo e' quello che ha reso la dashboard sicura: e' **HEAD del branch corrente**.

### La protezione: tre livelli, tutti verificati

`supabase/migrations/20260925120000_admin_dashboard_hardening.sql` (381 righe, committata, **non
applicata su cloud**):

| Livello | Cosa fa | Prova |
|---|---|---|
| **Database: revoca** | ogni vista DaaS con `REVOKE ALL FROM anon` + `GRANT SELECT TO authenticated, service_role` | riga 82, 119, 247, 272, 332, 365 |
| **Database: gate** | `public.is_loto_admin()` come unico varco di accesso, con `REVOKE ... FROM PUBLIC` sulla funzione | riga 272 (vista metriche), 332 (telemetria) |
| **RLS** | policy INSERT con `user_id IS NULL OR = auth.uid()`, policy SELECT solo per il proprietario | idem |
| **App: middleware** | controllo sessione e ruolo lato server, prima del rendering | `src/middleware.ts` |

Questo e' il rispetto della **legge 1 di `AGENTS.md`** applicato al backend: il dato non e'
esposto, e il percorso per ottenerlo richiede un ruolo esplicito. Non e' "difficile da ottenere",
e' revocato.

### Zero-UI Partner rispettata

Il partner non vede una dashboard: interagisce via WhatsApp bot. `download/page.tsx` e' una landing
pubblica, non un'area operativa. Coerente con `AGENTS.md` §5 (target = agenzie) e con il modulo B2B
del modello economico.

## 2. Cosa dice la documentazione

`docs/coerenza_ecosistema.md` e' il documento che l'utente ha chiesto di confrontare prima di
procedere, e su cui ha dato il via libera all'intervento. La sequenza che ne e' seguita e'
coerente:

1. **Autenticazione e protezione tramite ruolo** (Zero-UI Partner) -> `bb0fa37`
2. **Viste SQL DaaS con `tenant_id` e soglia k-anonimita' sulla heatmap** (Blindaggio Zero-PII) -> `bb0fa37`
3. **Separazione tra impatto civico (PTI) e check-in turistici** -> `bb0fa37`

Il risultato e' coerente con quanto chiesto: il codice mostra esattamente questi tre interventi.

**Non verificato:** il funzionamento a runtime. La dashboard e' stata compilata (`.next` presente,
`tsconfig.tsbuildinfo` del 25/09 21:02) e i tipi passano, ma **non e' stata messa online**: vedi
il blocker di deployment sotto.

## 3. Direzione

L'area va verso **dati aggregati e minimi, esposti a soglie che rendono il dato non re-identificabile**,
con la griglia a 110 m e il bucket da 15 minuti come regola tecnica, non come parametro di design.

La regola che la governa e' `AGENTS.md` §1 e §7 combinate: i dati ambientali in ledger immutabili
e aggregati, mai in chiaro, mai con PII. E la conseguenza commerciale che rende il modello
vendibile: il prodotto e' l'infrastruttura, e l'infrastruttura si certifica solo se il dato e'
anonimo per costruzione, non per policy.

Direzione in tre passi:

1. **Applicare la hardening su cloud.** Finchè non e' applicata, la dashboard in esecuzione legge
   viste che non hanno il gate. Il codice e' pronto, il DB no
2. **Chiudere il ciclo scrittura -> lettura.** La hardening crea `app_telemetry_events` e
   `vw_dev_telemetry_daily`; il client scrive con `sendSessionStartTelemetry` in
   `app/(tabs)/index.tsx`. Senza la migration lato DB la telemetria va nel fallback
3. **Deploy effettivo.** Vedi §4

## 4. Buchi e rischi

| Buco | Gravita' | Effetto se resta aperto |
|---|---|---|
| **Push a `origin` mai eseguito** | **Blocker** | `git ls-remote --heads origin` restituisce solo `feature/auth-backup`, `feature/gamification-rpc`, `main`. Il branch corrente e' `[gone]`. **Il deploy Vercel richiesto il 25/09 non e' mai avvenuto**: la dashboard non e' online |
| **Hardening mai applicata su cloud** | **Blocker** | le viste in produzione non hanno revoca ad `anon`, non hanno `tenant_id`, non hanno il gate `is_loto_admin()`. Il codice e' pronto, il DB no: e' il caso peggiore, perche' sembra protetto |
| **Policy INSERT accetta `user_id IS NULL`** | Medio | telemetria anonima illimitata, nessun rate limit, nessun vincolo sulla dimensione di `payload`. Non e' un leak di PII, e' log-spam |
| **`v24` non e' in `codici_morti.md`** | Alto | `app_telemetry_events` e `vw_dev_telemetry_daily` hanno tre definizioni: chi riapplica `migration_v24_app_telemetry.sql` annulla la telemetria hardened |
| **DB cloud non introspezionato** | Medio | le viste sono verificate nel SQL che le crea, non nel DB reale. Diventa irrelevante dopo il punto 1 di §3, prima no |
| **2 utenti `tab` che spartiscono la stessa lista** | Basso | `BadgeCollectionModal` e il tab BADGE di `TraguardiModal` duplicano la UI in `loto-admin-v2/src/app/(dashboard)/page.tsx` e `daas/page.tsx`: stessa lista, stesso calcolo di progresso |

## 5. Cosa NON fare in questa area

- **Non usare la chiave anonima per leggere le viste DaaS.** La revoca e' il punto: reintroducirla
  espone i dati aggregati a chiunque abbia la chiave, che e' pubblica per progetto
- **Non applicare `migration_v22/v23/v24_daas_*.sql`.** Vedi A3 §5
- **Non aggiungere un percorso operativo per il partner in questa dashboard.** Il modello e'
  Zero-UI: il partner parla con il bot WhatsApp. Una dashboard per l'esercente e' una reversal
  dell'architettura, non un miglioramento
- **Non esporre identificatori di percorso o timestamp grezzi.** Il valore venduto sta nella
  aggregazione a griglia e bucket: toglierla non rende il dato piu' utile, lo rende non vendibile

## 6. Prossima verifica

Applicare `20260925120000_admin_dashboard_hardening.sql` su cloud, poi eseguire il push del branch
(`git push -u origin fix/ripristino-lavoro-15-set-selective`) e verificare il deploy Vercel. Il
primo chiude il blocker DB, il secondo quello di rilascio.

---

*Area A4 verificata il 26/09/2026. Confidenza Alta su struttura e protezione da codice; il runtime
non e' stato verificato perche' il deploy non e' avvenuto.*
