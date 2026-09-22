# Fine Sessione (22/09): G18 realizzata (rampa + rito + anti-flood), **RELEASE 1.0.2 BUILT ✔**, **LINT PULITO ✔**

## Raggiunto in questa sessione
- **PULIZIA 19 WARNING LINT (task registrata chiusa)** — commit `ee904a6` "chore(lint)…": `map.tsx` (13: rimosso BOM + import duplicati react-native + dead code `Animated`, `Dimensions`+`width/height`, `startBackgroundTracking`/`stopBackgroundTracking`, `SafeAreaView`, `UserAvatar`, `e` in catch, `setRoutePois`, `eventsEverToggled`), `ProfileModal.tsx` (5: BOM, import duplicati, `Dimensions`, exhaustive-deps `userProfile.nickname` aggiunto alle deps), `levelUtils.ts` (1: `import/first` — import `GamificationEvent` spostato in cima). Ora **`eslint` e `tsc --noEmit` su quei file: ZERO problemi**.
- **RELEASE 1.0.2 diramata:** version bump `app.json` (1.0.2 / versionCode **4** / buildNumber **4**) committato `16d5460`; `android/app/build.gradle` allineato (versionCode 4, versionName "1.0.2").
- **APK generato e VERIFICATO** (`aapt`): `C:\loto_app\android\app\build\outputs\apk\release\app-release.apk` — `com.lotohub.app` versionCode 4 / versionName 1.0.2, **212 MB**, `BUILD SUCCESSFUL` (9m12s, 1270 task, bundle JS 2464 moduli rigenerato). Utente al lavoro con l'APK installato — test in corso.
- **⚠️ BLOCKER BUILD RISOLTO (da memorizzare):** la build GRADLE fallisce nel worktree (path profondissimo `C:\Users\Sem\.gemini\antigravity\worktrees\...` → oggetti .o `react-native-worklets` a 195/250 char → `ninja: manifest 'build.ninja' still dirty after 100 tries`). **La build canonica è SOLO `C:\loto_app\android`** (clone con `origin` = questo worktree, branch `fix/ripristino-lavoro-15-set-selective`, `local.properties` SDK già presente). Flusso: stash modifiche locali → `checkout fix/...-set-selective` → `git -C C:\loto_app pull origin branch` → lancia `.\\gradlew.bat assembleRelease`.
- **G18 → VIVENTE e IMPLEMENTATA:** l'utente ha risposto Q1-Q5 — POI e categorie **mai gated da XP** ("i p.o.i  e le categorie non vanno toccate è gia tutto ok cosi"), POI sempre consultabili, **nessun badge** "nuovo strato", **rito LV10 sì**, **itinerari già a LV2**. `gamification_rampa_early_game.md` riscritto (sez. 0 = decisioni verbatim).
- **Anti-flood modali** in `levelUtils.buildLevelUpEvents`: 1 solo LEVEL_UP aggregato al livello finale, WHISPER solo per i KEY_LEVELS attraversati (max 3 carte), ordine LEVEL_UP→WHISPER→REVEAL→BADGE.
- **Carte nuove** in `GamificationTransitionManager`: `REVEAL` (sezioni aperte: Eventi/Itinerari LV2, Community LV5 — testo SSOT `UNLOCK_REVEALS`) + `RITO` capstone Tier 1 (LV10, card con Condividi). Tipi `GamificationEvent` deduplicati (SSOT = manager).
- **Lore corretto:** LV2 non promette più "Comunità" (rimandata alle REVEAL LV5).
- **Cadenza "ogni 2 livelli" (decisione utente, tool):** 1 sezione per livello PARI — **Eventi LV2 · Itinerari LV4 · Visioni Sospese LV6 · Community LV8 (era LV5) · Rito LV10 · Co-Experience LV20**. LV5 resta KEY_LEVEL narrativo (CO₂ nel Profilo). SSOT `SECTION_UNLOCK_LEVELS` + `UNLOCK_REVEALS` (4 voci); gate `map.tsx` via `useGamification().level` (rimosso `xp>=30` hardcoded, FAB Itinerari LV4); zona Memorie gated LV6 in `ProfileModal`; lore LV2/3/4/6/8 ricalibrati alle soglie reali.
- **Verifiche:** `tsc --noEmit` EXIT 0; eslint ZERO problemi sui file toccati; `git diff --check` pulito.
- Git log sessione: `b6bf361`, `1655788`, `d1afd36`, `3739ac4`, `16d5460`, `a1243dc`, `ee904a6`.

## Prossime Task (in ordine)
1. **RPC `recover_loto_pass`:** verifica sul DB cloud (introspection §8d) — in attesa risposta utente.
2. QA finale manuale su APK 1.0.2 (in corso da parte dell'utente): catena modali su jump multipli (es. LV3→LV5) con cadenza 2/4/6/8; rito LV10; gate Memorie LV6 e Community LV8.

---

# Fine Sessione (21/09 serale): G16/G17 realizzate, PFS attivo, G18 rampa primi 10 livelli (Bozza)

## Raggiunto in questa sessione (terminale)
- **G16 (impatto dal ledger):** `community.tsx` legge `vw_collective_impact` (checkins/co2/explorers/pti/water)
  + `civic_reports`; "Esploratori Oggi" al posto di KM Esplorati. `profile.tsx` usa `profiles.total_co2`.
- **G17 (backup QR-only):** rimosso dead code form email/password (`profile.tsx`), descrizione Zero-PII;
  fix apici pre-esistenti; verifica `npx tsc --noEmit` EXIT 0 + eslint 0 errori (6 warning pre-esistenti).
- **PFS (Fine Sessione Protocollo):** nuovo `docs/FINE_SESSIONE_PROTOCOLLO.md` — FASE 1-5 obbligatorie
  (verifica tsc/eslint/diff → ripulisci → commit separati → handoff/report → riepilogo). Da seguire a OGNI chiusura.
- **G18 (design Bozza):** `docs/gamification_rampa_early_game.md` — rampa LV1-10 con POI reali
  (M+Fontane 29 → Attractions LV2 → Museums LV5 → Parks LV10), KP per sblocco sulla soglia SSOT,
  regole anti-flood modali (max 3 carte, aggregazione jump, REVEAL≠LOCK), gancio feature gruppo (bonus squadra).
- **Docs cronologici aggiornati:** REPORT PARTE C (G18) + diario turni 9-10; README indice (2 righe nuove);
  knowledge_recovery_guide nota serale.

## Prossime Task (in ordine)
1. **Validare G18 (utente):** rispondere alle 5 domande aperte in `gamification_rampa_early_game.md` §8
   (ordine categorie, capstone LV10, rito LV10, badge "Nuovo strato", LV3 Percorsi).
2. **Implementare (dopo ok):** `POI_CATEGORY_UNLOCK_LEVEL` in `levelUtils.ts` + filtro `map.tsx` + label "???"
   nel dropdown; carta REVEAL e rito LV10 in `GamificationTransitionManager`; aggregazione jump in `buildLevelUpEvents`.
3. **RPC `recover_loto_pass`:** verificare sul DB cloud se esiste (introspection §8d) — in attesa risposta utente.
4. **Version bump 1.0.2 / versionCode 4 + build EAS AAB** (dopo QA checklist) — blocker gradle da ri-testare.

---

# Fine Sessione (20/09 serale): F1 reattivo, Decisioni F2-F6 chiuse, REPORT completo creato

## Raggiunto in questa sessione (terminale)
- **F1 (bloccante):** gate tab reattivo in `app/(tabs)/_layout.tsx` — rimosso lo state stale
  (`useEffect` + fetch Supabase una tantum) in favore di `useGamification().level` (SSOT reattivo).
  Il gate Community ora scatta al level-up in sessione senza reload. Verifica `npx tsc --noEmit` pulito.
- **Decisioni utente F2-F6 CHIUSE** e registrate in `docs/gamification_hooks_analisi.md` §7:
  - F2 = loop oggettivo senza moderazione manuale (whispers curati, no UGC) · F3 = preview lockata stile LOTO +
    livelli chiave `1→2→5→11→20→21→30→31→41` (LV30 incluso) · F4 = 3° petalo **B (sfida quotidiana)** ·
    F6 = hub **"Diario di Bordo"** nel Profilo · F5 = economia PTI congelata fino a fine app.
  - Aggiunta **economia XP per azione** verificata sul codice (§7.2) → soglia apprendimento calcolata
    (LV5 ≈ 1-2h di esplorazione).
- **REPORT creato:** `docs/REPORT_GAMIFICATION_STATUS.md` — quadratura **REALIZZATO (Parte A)** vs
  **DISCUSSO (Parte B)** + **linee guida segmento gamification G1-G15 con stato** (Parte C) +
  **diario completo della conversazione** (Parte D, osservazioni verbatim + interpretazione + verifica anti-perdita).
- **UI Level-Up (task 4):** avatar home spostato di 5px in alto (`app/(tabs)/index.tsx:660`).
- **Toggle Risparmio Batteria (task 3):** `TrackingMode` in `SincroAvventura.ts` (battery 30s/30m, delta
  matematici INVARIATI → dati ESG certificabili) + Switch in `TipsBoutiqueSheet.tsx`.
- **Vault-economia (frontend v20):** `PoiDetailSheet`, `upgrade.tsx`, `ThemeContext` (persistenza `is_premium`),
  `types/database.ts`, `OfflineQueueManager`; `LevelUpLore.ts` rifinita.
- Verifiche: `npx tsc --noEmit` pulito; lint solo issue pre-esistenti; `git diff --check` ok.

## Prossime Task (in ordine, prossima sessione parte dal punto 1)
1. **Da implementare (il nuovo bloccante):** **F3** — preview lockata in stile LOTO al posto dell'Alert Community
   (pattern "??? (LV.5)" come `ProfileModal`), usando `useGamification().level` + costante **`KEY_LEVELS`**
   centralizzata in `utils/levelUtils.ts` (`1→2→5→11→20→21→30→31→41`). Riferimento: REPORT Parte B.1.
2. **DB:** applicare `supabase/migration_v20_vault_currency_fix.sql` su Supabase (cloud + locale);
   testare poi sblocco media end-to-end (online/offline) con RPC `sblocca_media`. (Posticipato assieme all'utente.)
3. **Notifiche Eco-Passi:** capire perché NON escono (`utils/SincroAvventura.ts`, plugin `./withNotifee.js`,
   canale `sincro-avventura`). Test su device reale. (Posticipato assieme all'utente.)
4. **Dopo F3:** F4 (Fiore 3 Petali, petalo 🔵 = sfida-quotidiana) → F6 (zona "Diario di Bordo": Scoperte/Vault+Fog of War ·
   Memorie · Co-Experience) → F2 (loop Risonanza Civica su canale `sincro-avventura`).
5. **Regola follow-up:** ogni task va ingegnerizzata e rianalizzata per convalidare la coerenza con la SSOT (AGENTS.md §7)
   prima di essere realizzata; modali in stile/palette LOTO (useTheme, mai colori hard-coded e mai notifiche di sistema).

---

# Fine Sessione: Completamento Modulo D, Debug Matrix & Landing Page Vercel

## Obiettivi Raggiunti in Questa Sessione
1. **Risoluzione Problemi Supabase (SQL Sync):**
   - Individuata la causa degli errori sulla Admin Dashboard: il DB in cloud mancava delle colonne e tabelle create negli script locali.
   - Generato e fatto eseguire con successo lo script unificato `admin_dash_setup.sql` su Supabase. Tutte le dashboard ora comunicano correttamente.

2. **Modulo D: Profili e Analitiche Check-in:**
   - Creata la pagina `/profiles` con lista utenti e funzioni interattive di **Anti-Cheat** (Azzeramento Token) e **Moderazione** (Ban/Sban).
   - Creata la pagina `/checkins` (Mappe di calore) basata sulla nuova vista `vw_admin_checkins_analytics` per contare i passaggi fisici (NFC) per ogni POI.

3. **Infrastruttura di Debug & Reportistica (Scheda Tecnica):**
   - Generata l'architettura per il `Global Debug Hub` (errori NFC, code offline, anti-cheat trigger) e la `Reportistica Segmentata` (B2C, B2B, Performance).

4. **Landing Page Turistica (MVP su Vercel):**
   - Implementate le specifiche di `LANDING_PAGE_SPECS.md` utilizzando i *Route Groups* di Next.js 14.
   - Creata la homepage pubblica (`/`) in stile Glassmorphism/Nature, separata dall'Admin Layout (che rimane su `/pois`, `/events`, ecc.).
   - Inserito il *Device Detection* client-side per mostrare il download APK su Android e il badge "Coming Soon" su iOS.

## Punto della Situazione per il Futuro (Next Session)
Quando riavvieremo i lavori:
1. **Analisi Codice**: Faremo un code review profondo dei layout e delle pagine per assicurarci che tutto sia robusto prima del deploy.
2. **Setup Vercel**: Se pronto, configureremo il deploy della dashboard/landing su Vercel e caricheremo l'APK su Supabase Storage.
3. **Bot WhatsApp B2B**: Avvio dello sviluppo del microservizio Node.js per i report.

*Nessun server locale è rimasto in esecuzione. Progetto salvato e pronto per la prossima sessione.*

---

# Fine Sessione (19/09): Vault-Economia → Level Gate

## Raggiunto in questa sessione
- Migration `supabase/migration_v20_vault_currency_fix.sql` pronta ma **NON applicata al DB**:
  `media_vault` senza `loto_cost`, `sblocca_media` a gate Livello+Premium via RPC,
  `calculate_user_level` allineata ALLA SSOT `utils/levelUtils.ts`, `get_poi_vetrina` riparata.
- Frontend allineato: Offline Unlock via RPC (`OfflineQueueManager`), guard Premium in
  `PoiDetailSheet`, persistenza `profiles.is_premium` (`app/upgrade.tsx` + `ThemeContext` hydration),
  tipi DB allineati (`types/database.ts`), emoji bonus corretti.
- Verifica: `npx tsc --noEmit` pulito; `expo lint` solo issue pre-esistenti.
- Archiviato `write_seed.js` → `archive_dead_code/` e registrato in `docs/codici_morti.md`.

## Prossime Task (in ordine)
1. **DB:** applicare `supabase/migration_v20_vault_currency_fix.sql` su Supabase (cloud + locale);
   testare poi lo sblocco media end-to-end (online/offline) con la nuova RPC `sblocca_media`.
2. **Notifiche Eco-Passi:** capire perché NON escono. Punti runtime:
   `utils/SincroAvventura.ts:60,86,92` (title "Eco-Passi Attivi/…", canale `sincro-avventura`),
   plugin `./withNotifee.js` (`app.json:138`). Test su device reale (principalmente Android).
3. **Nota di sviluppo (da valutare):** aggiungere un toggle ON/OFF per il risparmio batteria
   durante il tracking Eco-Passi.
4. **UI Level-Up:** quando scatta il glow del level-up la cornice avatar cresce di qualche px:
   alzare di 4-5 px da sopra la modale che indica il livello (LevelUpModal). Prima di riagganciarla,
   verificare lo stato degli asset `assets/images/ranks/rank*.jpg`.
5. **Regola follow-up:** ogni task di questa lista va ingegnerizzata e rianalizzata per convalidare
   la coerenza con la SSOT (AGENTS.md §7) prima di essere realizzata.
