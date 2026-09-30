---
id: REPORT-SINCRONIZZAZIONE
tipo: analisi
ambito: snapshot-stato-sincronizzazione-agente-26-09
stato: Storico
confidenza: Alta
owner: Agent
aggiornato: 2026-09-26
evidenza:
  - utils/levelUtils.ts:13
  - loto-admin-v2/src/middleware.ts:1
---

<!-- Stato: Storico -->
<!-- Scopo: questo documento risponde a: "cosa ha effettivamente sincronizzato l'agente sul progetto L.O.T.O. Map, dove vive il lavoro e cosa resta aperto" -->
<!-- SSOT: questo file e' un'istantanea datata; lo stato corrente del progetto vive in docs/NEXT_SESSION_HANDOFF.md, docs/codici_morti.md e nel log Git -->
<!-- Owner: Agent / sincronizzazione -->
<!-- Ultimo aggiornamento: 2026-09-26 -->

---
id: REPORT-SINCRONIZZAZIONE
tipo: analisi
ambito: snapshot-stato-sincronizzazione-agente-26-09
stato: Storico
confidenza: Alta
owner: Agent
aggiornato: 2026-09-26
evidenza:
  - utils/levelUtils.ts:13
  - loto-admin-v2/src/middleware.ts:1
---

# REPORT SINCRONIZZAZIONE — L.O.T.O. Map (snapshot 26/09/2026)

> Documento di stato della sincronizzazione. **Non e' SSOT**: per lo stato corrente del cantiere
> valgono `docs/NEXT_SESSION_HANDOFF.md` (append-only), `docs/codici_morti.md` e il log Git di `C:\loto_app`.
> Se questo file e una category-C snapshot: si appende, non si riscrive.

---

## 1. Risposta in una riga

Il lavoro **non e' mai stato perso**: vive tutto in `C:\loto_app` (repo git canonico, 145 commit avanti
su `main`, HEAD `bb0fa37`). La perdita di contesto delle ultime sessioni era causata dal fatto che
**questa sessione opencode e' ancorata a un percorso worktree vuoto e morto**, non dal progetto.

---

## 2. Dove vive il lavoro (finding critico)

| Percorso | Stato | Ruolo |
|---|---|---|
| `C:\loto_app` | **REPO REALE** — git, branch `fix/ripristino-lavoro-15-set-selective`, HEAD `bb0fa37` | unico posto per edit + commit + build |
| `C:\loto_app\loto-admin-v2` | Progetto Next.js autonomo (dashboard admin) | committato dentro il repo madre |
| `C:\loto_app\android` | build Gradle canonica | `gradlew assembleRelease` (regola AGENTS.md §8) |
| `C:\Users\Sem\.gemini\antigravity\worktrees\loto-app-fresh\fix-conversation-stuck-issue` | **VUOTO — 0 file** | worktree annidato eliminato il 24/09 (handoff riga 4). E' la directory da cui parte opencode: **puntamento morto** |
| `C:\Users\Sem\Desktop\loto-app-prerelease` | git con **1 solo commit** `13a834b "Init for EAS"` | clone vuoto, NON e' il progetto. Fuorviante |
| `C:\Users\Sem\loto-app\loto-app-fresh` | non e' un repo git | fork Aprilile, ignorare |

**Azione risolutiva:** rilanciare opencode con la directory di lavoro impostata a `C:\loto_app`.
Fino a allora ogni sessione riparte da un path vuoto e rischia di ripetere la stessa perdita di contesto.

---

## 3. Metodica di sincronizzazione applicata (gerarchia di affidabilita')

Le cronologie di file hanno gia' mentito in questa sessione (la `.git` di `loto-app-prerelease`
"risultava" del 25/09 per mtime di directory, ma il reflog dice 11/09 22:40 — artefatto creato da un
`git status` stesso). Quindi la triangolazione e' stata fatta **per contenuto, non per timestamp**.

| Tier | Fonte | Uso |
|---|---|---|
| **A** | contenuto: SQL, codice, reflog, config, `.agents/AGENTS.md` | **verdetto** |
| **B** | doc di handoff scritti dall'agente | ipotesi da verificare |
| **C** | mtime, nomi di file/cartelle | **mai usati come prova** |

Doc di riferimento letti e usati come SSOT: `docs/README.md` (criterio di documentazione),
`docs/FINE_SESSIONE_PROTOCOLLO.md` (PFS), `docs/NEXT_SESSION_HANDOFF.md`, `SESSION_BOOTSTRAP_RICOSTRUZIONE.md`,
`docs/codici_morti.md`, `docs/coerenza_ecosistema.md`, `.agents/AGENTS.md`.

---

## 4. Cosa e' stato sincronizzato, per area

### 4.1 Recovery del codice 7-15 settembre (16-19/09) — CONCLUSO
- L'agent precedente (Antigravity) aveva perso il lavoro con un `git restore` del 15/09 sera (~20:30).
- Ricostruzione per triangolazione: `CHAT_EXPORT_SEP7_SEP15.md` + `LOTO_DB_PRODUCTION_MAP.md` +
  `PERFECT_STATE_BLUEPRINT.md` + `GAMIFICATION_SYNC_BUNDLE.md` + `TRIANGOLAZIONE_FIX_CORE.md` + APK release.
- Script SQL di recupero archiviati in `supabase/pure_cloud_queries/` (79 script) e replicati in byte-identita'.
- Bundle di sicurezza: `C:\loto_app\loto_backup_20260916.bundle`.
- **Stato: superato.** L'utente stesso ha confermato il 25/09: "abbiamo superato il punto di recupero codice".
  Da qui in avanti il lavoro e' **sincronizzazione di un ecosistema funzionante**, non archaeology.

### 4.2 App mobile L.O.T.O. Map (20-24/09) — AMPIAMENTE AVANZATA
Commits rappresentativi (`C:\loto_app`, ramo corrente):
- `bc37c59` metriche impatto dal ledger reale (G16) · `db0a01d` Diario di Bordo + Fog of War (G17)
- `b6bf361` anti-flood modali, REVEAL sezioni, rito LV10 (G18)
- `d1afd36` cadenza sblocco sezioni ogni 2 livelli (Eventi LV2 / Itinerari LV4 / Memorie LV6 / Community LV8)
- `ee904a6` pulizia 19 warning lint · `16d5460` release 1.0.2 (versionCode 4)
- `c72e785` onboarding sensori GPS, `LotoHardwareGate` riscritto (elimina la notifica nativa all'avvio)
- `eee4598` REVEAL "Esplora la Sezione" con navigazione reale
- `8815fcf` feed community REALE senza polling + header 331px + cleanup emoji/mojibake
- **Release 1.0.2 gia' buildata e installata**: `C:\loto_app\android\app\build\outputs\apk\release\app-release.apk` (212 MB, `com.lotohub.app` v4).

### 4.3 Dashboard Admin DaaS (25/09) — CODIFICATA E COMMITTATA
Progetto Next.js in `C:\loto_app\loto-admin-v2`, deploy Vercel.

| Componente | File |
|---|---|
| Login + sessione server | `src/app/login/{page,login-form}.tsx`, `src/lib/supabase-server.ts` |
| Gate ruolo lato server | `src/middleware.ts` |
| Layout dashboard | `src/app/(dashboard)/{layout,page}.tsx`, `src/components/{Sidebar,LogoutButton}.tsx` |
| Report DaaS | `src/app/(dashboard)/daas/page.tsx` (576 righe) + `src/lib/daas.ts` |
| Landing download | `src/app/download/page.tsx` |
| Privacy / Zero-UI Partner | `src/app/privacy/page.tsx` |

Commits: `e69492f` (dashboard DaaS) e `bb0fa37` (hardening: auth + ruolo + viste SQL con `tenant_id`,
soglia k-anonimity sulla heatmap, separazione impatto civico PTI vs check-in turistici).
Totale hardening: **17 file, +1124/-91**.

### 4.4 Database Supabase — CATENA CANONICA IN COSTRUZIONE
- SSOT check-in: `supabase/migrations/20260926120000_scan_chain_canonical.sql` (440 righe, **non committata**).
- Hardening viste DaaS: `supabase/migrations/20260925120000_admin_dashboard_hardening.sql` (381 righe, committata, **mai applicata su cloud**).
- Project ref Supabase: `fsuolbwsvpgiglwcaffh` · account admin: `loto.taranto@gmail.com`.
- `.env` copiato in `loto-admin-v2/.env` il 25/09 con autorizzazione esplicita dell'utente.

---

## 5. Stato Git al 26/09 (verificato, non da mtime)

```
branch : fix/ripristino-lavoro-15-set-selective
HEAD   : bb0fa37  feat(admin): secure DaaS dashboard and privacy views
main   : 47b597c  [origin/main: ahead 145]
stash  : 2 (wip-lore-locale-pre-sync, withNotifee config)
```

**Lavoro NON committato (7 file):**
- Modificati: `app/(tabs)/index.tsx` (+9/-2), `docs/codici_morti.md` (+35/-1)
- Non tracciati: `utils/dbAggregation.ts`, `supabase/migrations/20260926120000_scan_chain_canonical.sql`,
  `supabase/migration_v22_daas_vendite.sql`, `migration_v23_prestige_card_metrics.sql`, `migration_v24_app_telemetry.sql`,
  3 PNG logo in `assets/images/`

**PUSH MAI ESEGUITO — rilievo ad alta importanza:**
`git ls-remote --heads origin` restituisce solo `feature/auth-backup`, `feature/gamification-rpc`, `main`.
Il branch corrente risulta `[gone]` lato remoto. **Il push richiesto il 25/09 per innescaree il deploy
Vercel NON e' andato a buon fine** (la sessione e' terminata subito dopo la richiesta). Da rifare:
```
git push -u origin fix/ripristino-lavoro-15-set-selective
```

---

## 6. Validazione delle 2 migration — esito (26/09, ultimo lavoro svolto)

Le 2 migration = le due nella cartella canonica `supabase/migrations/`.

**Migration 1 — `20260925120000_admin_dashboard_hardening.sql` — APPROVATA.**
Coerente e completa: 4 viste DaaS + telemetria, ciascuna con `REVOKE ALL FROM anon`,
gate `public.is_loto_admin()`, RLS con policy INSERT/SELECT, idempotente, wrappata in `BEGIN/COMMIT`.
Debito minore: la policy INSERT accetta `user_id IS NULL` (telemetria anonima illimitata, nessun rate limit).

**Migration 2 — `20260926120000_scan_chain_canonical.sql` — 4 BLOCKER + 2 HIGH.**

| # | Sev | Difetto |
|---|---|---|
| B1 | Blocker | Nessun `BEGIN`/`COMMIT`: ALTER + 2 CREATE FUNCTION non atomici |
| B2 | Blocker | `EXCEPTION WHEN unique_violation` -> UPDATE: le visite ripetute collassano su una riga. La PK composta `(profile_id, poi_id)` va rimossa, la heatmap DaaS diverrebbe 1 riga per utente x POI per sempre |
| B3 | Blocker | Race condition sul cooldown (check e INSERT non atomici) -> **doppio XP** con richieste concorrenti. Serve `pg_advisory_xact_lock` |
| B4 | Blocker | `profiles.tenant_id` aggiunta senza backfill -> righe esistenti a NULL, invisibili ai query tenant-filtered |
| H1 | High | "FASE 2 neutralizzazione" e' solo commento e cita `mitigation.sql`, **file inesistente**: riapplicare `migration_master_reset.sql` o `anti_spoofing_scan_poi_gps.sql` sovrascrive la funzione canonica |
| H2 | High | `scan_poi` (NFC) diventa finalizzazione GPS: serve una decisione di prodotto (challenge NFC firmato) |

**Ritrovamento aggiuntivo:** `docs/codici_morti.md` condanna v22 e v23 ma **dimentica v24**.
Tutti e tre gli oggetti esistono gia' in versione hardened dentro la migration committata
(`vw_daas_heatmap_15min`, `vw_daas_esg_monthly`, `vw_daas_event_attendance`, `vw_user_dashboard_metrics`,
`app_telemetry_events`, `vw_dev_telemetry_daily`). **Le 3 vanno archiviate insieme e `codici_morti.md` va corretto.**

**Impatto sui 2 fix client (non ancora toccati):**
`utils/dbAggregation.ts:26` interroga `vw_user_dashboard_metrics`, che esiste solo in v23 (morta) e nella
hardening (viva). **Ordine vincolante: hardening -> scan chain -> client.** Senza hardening il fix cade
nel fallback silenzioso: non crasha, ma non fa nulla.
Difetti gia' identificati: commento SSOT che punta a v22/v23/v24, `tenant_id: 'taranto'` e
`app_version: '1.0.2'` hardcoded, doppio `setUserProfile` in `index.tsx:487-490`, `sendSessionStartTelemetry` non awaitata.

---

## 7. Decisioni aperte (spettano all'utente)

1. **I 4 blocker della scan chain: correggere ora o registrare come debito?** Consigliato correggere ora:
   B2 rende inutilizzabile la heatmap DaaS, B3 riapre l'exploit XP che la migration voleva chiudere.
2. **H2 — lo scan NFC da solo deve funzionare?** Se sì serve challenge NFC firmato. Decisione di prodotto
   prima del rilascio.
3. **`impact_transactions.tokens_earned` sempre 0**: il check-in non accredita mai PTI. Confermato o no?
4. **Push del branch su origin** per innescaree il deploy Vercel (vedi §5).
5. **AAB**: da non compilare finche' il cablaggio non e' sicuro. L'utente ha chiesto esplicitamente di
   attendere: le compilazioni EAS gratuite riprendono a inizio ottobre.

---

## 8. Limiti di questa sincronizzazione (dichiarati, non nascosti)

- La memoria conversazionale **non persiste** tra sessioni opencode: la ricostruzione e' stata fatta
  interrogando `~/.local/share/opencode/opencode.db` (43 sessioni, 12 sessioni principali) e confrontando
  con codice, Git e doc. Costo: le battute dell'utente sono state lette dalla cronologia, non "ricordate".
- `docs/` contiene ~30 documenti con **debito di encoding** (virgolette lunghe corrotte in U+FFFD), ereditato
  dalle sessioni Antigravity. Dichiarato in `codici_morti.md §Difetto preesistente`, non ancora ripulito.
- Non ho applicato nulla su Supabase cloud in questa sessione (regola AGENTS.md: le migration le applica l'utente).
- La dashboard admin e' committata ma **non deployata** (vedi push mancante §5).

---

*Generato il 26/09/2026. Repo di riferimento: `C:\loto_app` @ `bb0fa37`.*
