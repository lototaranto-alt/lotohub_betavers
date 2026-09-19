# SESSIONE ORIENTAMENTO — RICOSTRUZIONE GAMIFICATION L.O.T.O. HUB

> File di bootstrap per avviare (o riavviare) una sessione di ricostruzione del codice
> della camminata 7-15 settembre. Copia questo file nell'agent che gestisce il progetto
> e parti da QUI, non da zero.

## 1. SCOPO

Ricostruire per MATCH (non inventare) il flusso di lavoro 7-15 settembre: allineare il
ramo di recupero corrente alle "parti buone" del ramo di riferimento, in modo byte-identico
tra i due repository, senza introdurre design nuovi.

## 2. PERCORSI CHIAVE

- Worktree di lavoro:
  `C:\Users\Sem\.gemini\antigravity\worktrees\loto-app-fresh\fix-conversation-stuck-issue`
  - branch corrente: `fix/ripristino-lavoro-15-set-selective`
- Progetto reale (da allineare OGNI volta, byte-identico):
  `C:\loto_app`
  - branch corrente: `recovery/ricostruzione-7-15-set`
- **CRONOLOGIA CHAT 7-15 SET (VERIFICATA, esiste)**:
  `c:\Users\Sem\.gemini\antigravity\brain\edf3a8e6-785a-4c0a-adf8-ccecfa355d1b\CHAT_EXPORT_SEP7_SEP15.md`
  - Se una sessione non lo trova: cercare con `glob **/CHAT_EXPORT_SEP7_SEP15.md`
    sotto `c:\Users\Sem\.gemini\antigravity\brain\`
- Backup integrale pre-recovery: `C:\loto_app\loto_backup_20260916.bundle`
- APK non tracciato (da NON toccare): `C:\loto_app\Loto-Hub-Alpha.apk`

## 3. MODELLO GAMIFICATION BERSAGLIO (regole fisse, non negoziabili)

1. **Livello**: soglia di apprendimento per i primi 10 livelli, con curva in
   `utils/levelUtils.ts` (`LEVEL_THRESHOLDS`):
   1→30, 2→90, 3→180, 4→300, 5→450, 6→630, 7→840, 8→1080, 9→1350, 10→1650.
2. **Rank**: scatta OGNI 10 livelli:
   - 1-10 TURISTA OCCASIONALE
   - 11-20 ESPLORATORE
   - 21-30 CUSTODE DELLA CITTÀ
   - 31-40 EROE DEL MARE
   - 41-50 LEGGENDA L.O.T.O.
   (`getRankInfo` in levelUtils.ts è la fonte unica).
3. **Badge**: si ottengono con AZIONI SPECIFICHE (es. sblocca 3 P.O.I., scansiona 1 POI,
   5 kg CO2, 3 eventi civici, 3 itinerari). NON esistono badge "raggiungi livello X" se non
   diversamente deciso. => DOMANDA APERTA B sotto (rimozione `badge_level_5`).

## 4. INVENTARIO BRANCH (Cosa contiene ogni ramo)

- `main` (`47b597c`, 16/09) — **SUITE GAMIFICATION COMPLETA (riferimento "parti buone")**:
  `utils/levelUtils.ts`, `utils/LevelUpLore.ts`, `context/GamificationContext.tsx`,
  `components/GamificationTransitionManager.tsx`, `components/XpToast.tsx`,
  `components/SingleBadgeSheet.tsx` (badge-azioni), `components/BadgeCollectionModal.tsx`,
  `components/LevelUpModal.tsx`, `docs/gamification_struttura_narrativa.md`,
  `docs/gamification_auth_plan.md`, `docs/pre_gamification_baseline.md`,
  `docs/db_migrations/02_gamification_and_events.sql`, `supabase/migration_v19_gamification_vetrina.sql`
- `next/debug-session` (`c609539`, 17/09) — stessa suite + `components/PoiTrophyPassport.tsx`
  e `PoiTrophyPassport.backup.tsx`
- `origin/feature/gamification-rpc` — SOLO subset obsoleto (explore.tsx, XpToast, SQL)
- `origin/reconstruction-beta`, `feature/pure-production*` — nessun file gamification
- Rami di RICOSTRUZIONE correnti: `fix/ripristino-lavoro-15-set-selective` (worktree)
  e `recovery/ricostruzione-7-15-set` (C:\loto_app) — da allineare a `main`

## 5. STATO ALLINEAMENTO CORRENTE (commit eseguiti, alberi identici)

Worktree `fix/ripristino-lavoro-15-set-selective`:
`741291c` (FASE 1: icone/VIAGGIATORE/accenti) → `5ca30ae` (naming VIAGGIATORE, ranghi level-up,
level ProfileModal, gate GPS, mojibake) → `9d67e1d` (calculateLevel SSOT, dead code XP, badge Liv.5 Cittadino Attivo uniforme)

C:\loto_app `recovery/ricostruzione-7-15-set`:
`443f6a6` → `02e5add` → `5aafc74` (stesse modifiche, SHA256 identici a ogni passo, `npx tsc --noEmit` exit 0)

Working tree puliti in entrambi; round-trip di verifica: `npx tsc --noEmit` + `git diff --check`.

## 6. CHECKLIST FILE DA ALLINEARE (estrazione da `main` → rami di recupero)

1. `utils/levelUtils.ts` — curva apprendimento + rank ogni 10 (fonte `calculateLevel`/`getLevelProgress`)
2. `utils/LevelUpLore.ts` — lore/whisper per livello
3. `context/GamificationContext.tsx` — contesto level/badge/XP
4. `components/GamificationTransitionManager.tsx` — eventi level-up/rank
5. `components/XpToast.tsx` — toast XP
6. `components/SingleBadgeSheet.tsx` — badge da AZIONI (sblocca 3 P.O.I., ecc.)
7. `components/BadgeCollectionModal.tsx` — catalogo badge-azioni
8. `components/LevelUpModal.tsx` — da validare: usato o dead code (asset assenti in alcuni rami)
9. `components/PoiTrophyPassport.tsx` — (esiste solo in `next/debug-session`)
10. Docs design: `docs/gamification_struttura_narrativa.md` + `gamification_auth_plan.md` + `pre_gamification_baseline.md`
11. SQL: `docs/db_migrations/02_gamification_and_events.sql` + `supabase/migration_v19_gamification_vetrina.sql`

## 7. CONFERME APERTE (da chiedere all'utente prima di procedere)

- **A)** Ramo di riferimento = `main` (o `next/debug-session`)? File identici tra loro; `main` = stato 16/09.
- **B)** Modello badge SOLO da azioni → rimuovere il badge `badge_level_5` ("raggiungi Lv.5",
  ora "Cittadino Attivo") dal catalogo? (È il punto di confusione cronologica segnalato.)
- **C)** versionCode: `app.json` 3/1.0.1 vs `android/app/build.gradle` 2/1.0.0.
- **D)** Rimozione dead code: `components/LevelUpModal.tsx` + `.temp_profile_modal.tsx`.

## 8. REGOLE OPERATIVE (accumulate nelle sessioni)

- Lingua UI: ITALIANO; stringhe via `locales/it.json` + `DICTIONARY` di `app/(tabs)/index.tsx`.
- Anonimo/fallback = "VIAGGIATORE" (MAI "ESPLORATORE"/"CITTADINO ATTIVO"); "Esploratore" è un RANK legittimo (11-20).
- Niente push (token locale bloccato per `recovery/*`, `next/*`, `feature/*`): solo commit locali.
- Notifica keep-awake "Eco-Passi Attivi/…" in `utils/SincroAvventura.ts:60,86,92`,
  canale `sincro-avventura`, plugin `./withNotifee.js` — test runtime da fare su device.
- Gate GPS/BLE: `getForegroundPermissionsAsync` di default, `request` SOLO su azione utente
  (`components/LotoHardwareGate.tsx`).
- Verifica obbligatoria dopo ogni modifica: `npx tsc --noEmit` + `git diff --check` +
  round-trip byte-identico (SHA256) verso C:\loto_app, poi commit in ENTRAMBI con stesso messaggio.

## 9. FASI PROSSIME (flusso suggerito)

1) Ottenere conferme A/B/C/D. 2) Estrarre da `main` i file della checklist §6.
3) Ricostruire/merge nel ramo di recupero (worktree). 4) Allineare C:\loto_app byte-identico.
5) tsc + diff --check. 6) Commit in entrambi. 7) Build APK + test runtime notifica Eco-Passi.

## 10. VERDETTO "BUNDLE = STATO FINALE PERFETTO" (analisi critica, 17/09)

Attestazione dell'altro agent ("11 file mai toccati dal git restore, solo index.tsx era distrutto"):
**PARZIALMENTE ATTENDIBILE — contenuto sì, "perfetto/pronto" no.**

CONFERMATO (verifica byte-level vs ramo di recupero):
- I 9 file sorgente del bundle sono IDENTICI a quelli del nostro ramo (levelUtils, LevelUpLore,
  GamificationContext, GamificationTransitionManager, XpToast, SingleBadgeSheet,
  BadgeCollectionModal, LevelUpModal, PoiTrophyPassport) -> "stato finale" vero per il FRONTEND.
- "Solo index.tsx era distrutto" coerente con la FASE 1; re-hook GIÀ fatto e verificato:
  PoiTrophyPassport 500ms, XpToast, SingleBadgeSheet, Provider in _layout,
  useGamification+buildLevelUpEvents in PoiDetailSheet:151-156, level-up con calculateLevel SSOT.
- `main` = snapshot VECCHIO (rank TURISTA CURIOSO/CITTADINO ATTIVO/CUSTODE URBANO/EROE JONICO):
  NON è il riferimento; il riferimento finale è il bundle + il nostro ramo di recupero.

NON AFFIDABILE (trovato con verifica diretta):
- LevelUpModal NON pronto: assets `assets/images/ranks/rank*.jpg` INESISTENTI (Test-Path=False);
  nomi file VECCHI (turista_curioso/cittadino_attivo/custode_urbano/eroe_jonico). NON riagganciare
  (romperebbe il build). È dead code (non importato in nessun punto).
- SQL del bundle incoerente col SSOT frontend: `migration_v19_gamification_vetrina.sql` curva
  `3+FLOOR((xp-40)/150)`, `02_gamification_and_events.sql` badge `eco_warrior/pioniere/custode`
  (500/1000/1500 XP) -> NON coincidono con la curva livello 30/90/180/300/450... di levelUtils.
  Tenere SOLO come archivio, NON applicare.
- `GamificationEvent` DUPLICATO (definito in context/GamificationContext.tsx e in GTM, shape
  diverse): compila (structural typing) ma è ridondanza.
- LevelUpLore copre solo livelli 1-30 (31-50 -> getLoreForLevel null, ok ma non "completo").
- Docs di flusso: "Turista Anonimo" (auth_plan) e "Rango Argento" (desc badge) precedono il
  naming finale (VIAGGIATORE; rank senza Argento). Informativi, non normativi.
- Provenienza "mai toccati dal reset": non verificabile dal repo (i file stavano nell'altro
  workspace, non in main). Verità dimostrata = congruenza di CONTENUTO, non di storia.

CONSEGUENZA: il ramo di recupero è GIÀ allineato al bundle; nessuna estrazione aggiuntiva.
Non riagganciare LevelUpModal. SQL come archivio. Decisioni ancora aperte §7.