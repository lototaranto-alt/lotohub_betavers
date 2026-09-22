# 📋 REPORT STATO E LABORATORIO — Segmento Gamification L.O.T.O. HUB

> **Scopo:** Resoconto esportabile di tutto il lavoro elaborato sul segmento gamification,
> con separazione netta tra **REALIZZATO** (in produzione/lavoro) e **DISCUSSO** (analizzato, deciso ma NON ancora costruito).
> Include le **linee guida del segmento** con il loro stato puntuale (realizzata / discussa / da fare).
> Data snapshot: 20/09 — Branch: `fix/ripristino-lavoro-15-set-selective` (worktree `fix-conversation-stuck-issue`).

---

## ⚙ PARTE A — REALIZZATO (codice verificato, `npx tsc --noEmit` pulito)

### A.1 Committato (storia `git log` recente)

| Commit | Contenuto |
|---|---|
| `ee904a6` | **Lint pulito** — 19 warning rimossi (dead code `map.tsx`, `ProfileModal`, `import/first` `levelUtils`) |
| `16d5460` | **RELEASE 1.0.2** — bump `app.json` (version 1.0.2, versionCode 4, buildNumber 4); APK locale generato e verificato (`com.lotohub.app` v4/1.0.2, 212 MB) |
| `d1afd36` `3739ac4` | **G18 cadenza** — SSOT `SECTION_UNLOCK_LEVELS` [2,4,6,8] + `UNLOCK_REVEALS` 4 voci; gate `map.tsx` via `useGamification().level`; zona Memorie LV6 `ProfileModal`; lore LV2/3/4/6/8 |
| `b6bf361` `1655788` | **G18** — anti-flood `buildLevelUpEvents`, carte REVEAL+RITO in `GamificationTransitionManager`, `GamificationEvent` SSOT dedup; docs Vivente |
| `de6e4c6` | Home: cornice avatar evolutiva `getAvatarFrameStyle` (avanza a ogni livello, aura per tier) + check-in senza "reload brutale" |
| `f24d5a3` | SSOT rank/XP nel context-store, catalogo badge unico, barra di progresso verso il rank |
| `0510c1d` | Scheda POI aperta al tap sulla mappa (`onSelected`) |
| `f7ea103` | Versione allineata 1.0.1 (SSOT, versionCode 3) |
| `5f9c9a6` `563bcd4` `5222ae0` | SSOT DB dump eseguibile (`dump-db.ps1`), tipi TS generati, gitignore cache/artefatti |
| `5d06354` | RPC `process_crowd_radar` (certificato ESG crowd) |
| `9d67e1d` | Livello con `calculateLevel` SSOT (curva apprendimento), rimosso dead code barra XP, badge Liv.5 Cittadino Attivo uniforme |
| `5ca30ae` | Naming anonimo VIAGGIATORE, ranghi reali nel level-up, level ProfileModal, mojibake, gate GPS manuale |
| `741291c` `73bdc75` | Ripristino lavoro 15-set dallo stash; ranghi allineati, Eco-Passi, Anti-Drift 20m/15m, tab bar insets |
| `28f6c30` | Gate permessi GPS/Bluetooth con pre-prompt privacy-first |
| `b98642f` `351db51` `3431387` | Ranghi ufficiali allineati a `levelUtils`; BLE Crowd Radar Fence; flusso Scheda Trofeo dopo check-in |
| `4fde326` | **FASE 0** — gate tab reattivo, toggle batteria Eco-Passi, unlock media via RPC `sblocca_media`, LevelUpLore, migration_v20 |
| `65909a8` | **F3** — `KEY_LEVELS` SSOT, `FeatureLockSheet`, preview lock Community (LV.5) e Co-Experience (LV.20) |

### A.2 In working tree (modificato ma non ancora committato) — 20/09

| Area | Contenuto |
|---|---|
| **F1 — Tab gate REATTIVO** (bloccante) | `app/(tabs)/_layout.tsx`: rimosso lo state stale (`useEffect` + fetch Supabase una tantum) → legge `useGamification().level` (SSOT reattivo). Gate Community ora scatta al level-up in sessione. Import inutilizzati rimossi. |
| **UI Level-Up** | `app/(tabs)/index.tsx:660`: avatar +5px in alto (la cornice cresce al level-up senza accavallare la pill del livello). |
| **Toggle Risparmio Batteria** | `utils/SincroAvventura.ts`: `TrackingMode` 'performance'\|'battery' persistito (`@sincro_avventura_battery_saver`); battery = accuracy High · 30s/30m (vs 5s/10m). Delta INVARIATI → dati ESG certificabili. `TipsBoutiqueSheet.tsx`: Switch visibile se Eco-Passi attivo, riavvio tracking al cambio. |
| **Vault-economia (frontend)** | `PoiDetailSheet.tsx` (guard Premium + sblocco via RPC), `app/upgrade.tsx` + hydration `ThemeContext` (persistenza `is_premium`), `types/database.ts` allineati, `OfflineQueueManager` (sblocco offline accodato). |
| **Lore livelli** | `utils/LevelUpLore.ts`: espansione/rifinitura testi narrativi tier 1-30. |
| **F4 — Fiore 3 Petali** (working tree) | `components/FioreDeiTrePetali.tsx` (nuova): card "Fiore di Oggi" su Home tra avatar e quadrante — 🟢 2km a piedi (o 1kg CO₂, `distanceToday`/`co2` da `useGamification`) · 🟡 1 check-in oggi (conteggio `user_pois.visited_at >= oggi` in `index.tsx`, ricalcato su `caricaDati`+`refreshGamification`) · 🔵 sfida-quotidiana a ROTAZIONE curata (5 sfide misurabili dai contatori, indice = giorno dell'anno). Zeigarnik. |
| **F6 — Diario di Bordo + Fog of War** (working tree) | `components/ProfileModal.tsx`: 3° tab **DIARIO** hub nel Profilo — ① Scoperte → apre `VaultModal` ② Memorie → apre `MemoriesCameraModal` ("Visioni Sospese", filtri per livello) ③ Co-Experience → salta al tab squad se LV≥20, altrimenti `FeatureLockSheet`. Toggle **Nebbia della Memoria** persistito (`@loto_fog_of_war`) + effetto sulla Mappa (`app/(tabs)/map.tsx`): POI non ancora scoperti sfumati/ridotti (iconOpacity 0.35, size 1.1, textOpacity 0.25). Fix **G7**: rimosso `alert()` dal tab Co-Experience → `FeatureLockSheet`. |
| **Docs/artefatti** | `docs/gamification_hooks_analisi.md` (nuova, §7 con decisioni + economia XP per azione) · `docs/codici_morti.md` (nuova) · `supabase/migration_v20_vault_currency_fix.sql` (nuova, **NON ancora eseguita**) · `coerenza_ecosistema.md` / `pre_gamification_baseline.md` / `NEXT_SESSION_HANDOFF.md` aggiornati · `write_seed.js` → archiviato in `archive_dead_code/`. |

> **Dead code registrato** (`docs/codici_morti.md`): `write_seed.js` archiviato (contiene `loto_cost` stale + mojibake);
> `LevelUpModal.tsx` non importato (asset `rank*.jpg` da verificare); SQL v19/02 da NON applicare (curve incoerenti con SSOT).

---

## 💬 PARTE B — DISCUSSO (analizzato + deciso, NON ancora costruito)

### B.1 Decisioni CHIUSE, pronte per l'ingegnerizzazione (priorità)

| # | Feature | Decisione presa | Stima costo | Apri |
|---|---|---|---|---|
| F3 | Tab Community "preview lockata" | Sostituire l'Alert "Sezione Chiusa 🔒" con badge icona sbiadita + label "??? (LV.5)" in stile LOTO (stesso pattern `ProfileModal` per "??? (LV.20)") | Basso | ORA |
| K | Costante `KEY_LEVELS` SSOT | Centralizzare `1→2→5→11→20→21→30→31→41` accanto a `levelUtils.ts` (zero numeri magici) | Bassissimo | con F3 |
| F2 | Loop "Risonanza Civica" | Count oggettivo (utenti che hanno sbloccato la stessa whisper) + push template su canale `sincro-avventura`. **Nessuna moderazione manuale** (whisper = contenuto curato, no UGC) | Medio | dopo F6 |

### B.2 Posticipati di concerto con l'utente

| Voce | Stato |
|---|---|
| **Migration** `supabase/migration_v20_vault_currency_fix.sql` su Supabase (cloud+locale) + test end-to-end `sblocca_media` online/offline | **da eseguire** (script pronto, utente ha detto "attendiamo per gli script") |
| **Notifiche Eco-Passi** — capire perché NON escono (canale `sincro-avventura`, plugin `./withNotifee.js`) | debug su device reale |
| **Economia PTI** (spendibilità, moltiplicatore streak F5, freeze a pagamento) | **i punti non sono spendibili**: brainstorming dedicato a fine app |
| **Misura ritmo XP reale** (quanto XP = 1 check-in oggi) | pre-req obbligatorio PRIMA di F5 (streak/petali collassano se curva irreale) |

### B.3 Futuro non ancora avviato

- F5 **Rugiada/Streak** — base approvata, dipende da misura ritmo XP + economia PTI.
- UX Scanner Modal: strutturare visivamente i 3 scenari (NFC On / NFC Off / QR fallback) — `coerenza_ecosistema.md` §2.
- Deploy infrastruttura (Vercel dashboard/landing, APK su Storage) e Bot WhatsApp B2B (report notifiche).

---

## 🎯 PARTE C — LINEE GUIDA DEL SEGMENTO GAMIFICATION (con stato)

> **Nota metodologica:** ogni linea guida riporta lo stato REALE:
> ✅ **Realizzata** (codice verificato) · 🟡 **Discussa** (concetto validato, da costruire) · 🔒 **Congelata/rinviata**.

| # | Linea guida | Stato | Dove/Note |
|---|---|---|---|
| G1 | **SSOT progresso** — rank/XP/livello derivano SOLO da `levelUtils` + `GamificationContext` (nessun doppio calcolo) | ✅ Realizzata | `levelUtils.ts`, `GamificationContext.tsx`; gate tab ora legge l'SSOT (F1) |
| G2 | **Zero-Coercition** — nessuna classifica pubblica, zero PvP, niente recensioni tossiche (Whispers anonimi) | ✅ Realizzata | filosofia di base (AGENTS §4, `coerenza_ecosistema.md`) |
| G3 | **Dualità XP/PTI non interscambiabili** — XP = progressione narrativa; PTI = impatto civico globale, **non spendibili** | ✅ Realizzata | `migration_v20` (pronta): `loto_cost` rimosso dai media |
| G4 | **Progressive Disclosure a livelli chiave** — soglia di apprendimento utente calibrata con la curva | 🟡 Decisa | `KEY_LEVELS` `1→2→5→11→20→21→30→31→41` da centralizzare (F3/K) |
| G5 | **Economia XP per azione documentata e coerente** — check-in NFC, sblocco storia +30, Eco-Passi 100m=5XP, ESG `floor(kgCO₂×100+litri×20)`, itinerario POI×10, evento +10, badge +50 | 🟡 Documentata | tabella certificata in `gamification_hooks_analisi.md` §7.2; **misura runtime in sospeso** |
| G6 | **Vincolo stilistico palette LOTO** — ogni modale unlockFeature usa `useTheme()` + palette freemium/Elite, MAI colori hard-coded estranei; pattern glassmorphism già nei level-up | 🟡 Regola attiva | `ThemeContext.tsx:6-28`, `constants/MapConfig.ts:38`; si applica a F3/F4/F6 |
| G7 | **Popup personalizzati, MAI notifiche di sistema** — richiesta esplicita utente per tutti i pop-up (incl. unlock) | 🟡 Regola attiva | nuova modale unlock in F3 |
| G8 | **Anti-farming / anti-spoofing** — cooldown 12h stesso POI, check velocità (shadowban silente >130km/h, veicolare senza CO₂), gate GPS manuale, Anti-Drift | ✅ Realizzata | `scan_poi_gps` (`anti_spoofing_scan_poi_gps.sql`), gate `28f6c30` |
| G9 | **Whisper curati, no UGC** — niente moderazione manuale necessaria per il loop di ritorno (F2); se in futuro si apre la scrittura UGC → flusso auto-moderazione PRIMA del rilascio | 🟡 Analisi chiusa | `whispers` in sola lettura lato app (`PoiDetailSheet`) |
| G10 | **Privacy by Design** — zero PII, spatial hashing 100×100m (`esg_raw_logs`), solo QR L.O.T.O. Pass come backup | ✅ Realizzata | baseline `pre_gamification_baseline.md` §4 |
| G11 | **Certificabilità ESG/B2B** — dati ambientali in ledger immutabili (`impact_transactions`), sottocampionamento matematico, frontend "zero-code layer" | ✅ Realizzata | AGENTS §7; mondeggi cogenti: batteria saver NON altera i delta |
| G12 | **Economia circolare di burn PTI** (freeze streak, moltiplicatori) | 🔒 Congelata | F5 — brainstorming di fine app (punti non spendibili per ora) |
| G13 | **Retention quotidiana (Zeigarnik)** — Fiore 3 Petali (F4) + sfida-quotidiana | 🟡 Da costruire | dopo F3 |
| G14 | **Loss-Aversion / Streak 7 giorni** — Rugiada (F5) | 🔒 Dipende da ritmo XP | pre-req: misura runtime |
| G15 | **Curiosità spaziale (Fog of War)** — nebbia Mapbox che si dirada ~50m, riusa `heatScores` | 🟡 Da costruire | dentro "Diario di Bordo" (F6) |
| G16 | **Metriche impatto dal ledger, MAI coefficienti inventati nel client** — statistiche (personali e collettive) pescate da `profiles.total_co2` e `vw_collective_impact` (somma reale `impact_transactions`), non calcoli `*0.5/*0.12/*0.15` hard-coded | ✅ Realizzata | `community.tsx` e `profile.tsx` (21/09) |
| G17 | **Backup SOLO QR locale, Zero-PII totale** — nessun backup cloud via email/password: app più leggera e inattaccabile sulla privacy; `recover_loto_pass` (flusso QR) resta l'unico metodo | ✅ Decisa (utente, 21/09) | `profile.tsx` (sezione Backup), `LotoPassCard.tsx`, `LotoPassRecoveryScanner.tsx` |
| G18 | **Rampa early-game: cadenza "ogni 2 livelli"** — i POI sono SEMPRE tutti consultabili (mai gate da XP); si sblocca **1 sezione per livello PARI** (Eventi LV2 · Itinerari LV4 · Visioni Sospese LV6 · **Community LV8** · Rito LV10 · Co-Experience LV20); anti-flood modali (max 3 carte, 1 LEVEL_UP aggregato sui jump, REVEAL≠LOCK, RITO Tier 1). Decisioni e implementazione 21-22/09 | 🟢 Realizzata | `gamification_rampa_early_game.md` (Vivente, cadenza 22/09) |

---

## 🗺 Mappa degli artefatti di riferimento

| File | Ruolo |
|---|---|
| `docs/gamification_hooks_analisi.md` | Triangolazione + fix F1-F6 + **decisioni utente §7** + economia XP/azioni |
| `docs/NEXT_SESSION_HANDOFF.md` | Roadmap operativa sessione per sessione |
| `docs/pre_gamification_baseline.md` | Baseline architetturale (Zero-Coercition, dualità XP/PTI) |
| `docs/coerenza_ecosistema.md` | Gerarchia flussi + disconnessioni da sistemare |
| `docs/codici_morti.md` | Registro dead code / archivi |
| `.agents/AGENTS.md` | Regole SSOT + filosofia core (Zero-PII, Zero-IoT, Offline-First, Goal B2B) |
| `context/GamificationContext.tsx` + `utils/levelUtils.ts` | SSOT progresso (XP→livello→rank) |
| `supabase/migration_v20_vault_currency_fix.sql` | Fix economia duale (**applicata** sul cloud, 21/09) |

---

## 💬 PARTE D — DIARIO DELLA CONVERSAZIONE (terminale, 20/09)

> Origine delle decisioni di PARTE B/C. Le osservazioni utente sono riportate **verbatim** (senza correzioni),
> perché sono le "sottilissime linee guida" da non perdere.

### D.1 Sequenza temporale

| # | Turno | Contenuto | Esito |
|---|---|---|---|
| 1 | Utente: avvio sessione | Richiesta recap dei passaggi in corso (worktree `fix-conversation-stuck-issue`) | Recap fornito da `NEXT_SESSION_HANDOFF.md` (Level-Up UI, Toggle Batteria, analisi hooks) |
| 2 | Utente: "attendiamo per gli script, procedi pure" | Postica gli script DB (migration_v20), chiede di procedere | **F1 realizzato** — gate tab reattivo in `_layout.tsx` con `useGamification().level`; `tsc` pulito |
| 3 | Utente: osservazioni F1-F6 (verbatim sotto) | Validazioni + correzioni di rotta sull'intera roadmap gamification | Analizzate e registrate in `gamification_hooks_analisi.md` §7 |
| 4 | Risposte utente ai quesiti (tool) | F4 petalo = **B** · F6 zona = **hub nel Profilo** · F6 nome = **"Diario di Bordo"** · LV30 = "va inserita assieme a tutte le opzioni che creano questo segmento, es. descrizione soglia exp per azione" | **Economia XP per azione** verificata sul codice e aggiunta a §7.2; LV30 incluso nei KEY_LEVELS |
| 5 | Utente: richiesta report | "raccogli un report che salvi il lavoro elaborato, e lo divida da quello realizzato e quello solo discusso. specie le sottilissime linee guida del segmento gamification" | **Questo documento** (PARTE A/B/C) |
| 6 | Utente: "ok mi riferisco anche della conversazione in questo terminal" | Il diario deve includere i ragionamenti emersi in chat, non solo i doc/git | **PARTE D** (questa sezione) |
| 7 | Utente (21/09): analisi tab Community/Profilo | "il sistema backup utente (LotoPass) non è interamente codificato, manca qualcosa" | **G16/G17** — analisi fatta: metriche inventate (`*0.5/*0.12/*0.15`), form email promesso ma non renderizzato, `recover_loto_pass` solo nell'introspection |
| 8 | Utente (21/09): decisione backup | **"Abbiamo eliminato il backup via email... Solo QR Code locale."** | **G17** — niente form email (dead code rimosso), solo QR; scelta Zero-PII radicale |
| 9 | Utente (21/09, terminale): protocollo fine sessione | "tu continua pure... stabilisci tu tutti i criteri [di fine sessione]" | **PFS** — `docs/FINE_SESSIONE_PROTOCOLLO.md` (FASI 1-5: verifica→ripulisci→salva→registro→riepilogo) |
| 10 | Utente (21/09, terminale): rampa primi 10 livelli | "strutturare le basi: da quanti POI vedere (solo monumenti attualmente) a sezioni tipo community... quante XP per sblocco e tutte le modali concatenate (futuro gruppo = bonus exp)" | **G18** — analisi POI reali (179 seed), design `gamification_rampa_early_game.md` (Bozza, Q1-Q5) |
| 11 | Utente (21/09): risposte Q1-Q5 | POI/categorie **mai toccati** ("i p.o.i  e le categorie non vanno toccate è gia tutto ok cosi"), p.o.i sempre consultabili, nessun badge "nuovo strato", rito LV10 sì, itinerari già a LV2 | **G18 → Vivente** — doc riscritto con le decisioni; anti-flood (1 LEVEL_UP aggregato + whisper solo KEY_LEVELS, max 3 carte) + REVEAL LV2/LV5 + RITO LV10 in `buildLevelUpEvents`/`GamificationTransitionManager`; tipo `GamificationEvent` deduplicato (SSOT manager); lore LV2 corretto ("Comunità" a LV2 → rimandata) |
| 12 | Utente (22/09): cadenza "ogni 2 livelli" | "arrivare a sbloccare le sezioni ogni 2 lv... sbloccando le sezioni più interne un pò per volta per rendere capibile l'avanzamento dell'esperienza utente" → Q&A: **Rigida** (1 sezione/livello pari) · **Community LV8** · **LV5 narrativo** | **G18 cadenza** — SSOT `SECTION_UNLOCK_LEVELS` [2,4,6,8] + `UNLOCK_REVEALS` 4 voci (Eventi/Itin/Memorie/Community); gate `map.tsx` via `useGamification().level` (rimosso `xp>=30` hardcoded); zona Memorie gated LV6 in `ProfileModal`; lore LV2/3/4/6/8 ricalibrati; doc rampa riscritto (sez. 0 + tabella cadenza) |
| 13 | Utente (22/09): "procede tutto ok?" / build | Lancio build → **fail worktree** (`react-native-worklets` `ninja dirty` per path >250 char del worktree) → **fix: build canonica `C:\loto_app\android`** (clone sincronizzato, percorso corto, `local.properties` SDK presente) | **RELEASE 1.0.2** — bundle JS rigenerato (2464 moduli), `BUILD SUCCESSFUL` 9m12s, APK `app-release.apk` 212 MB verificato con `aapt` (versionCode 4 / versionName 1.0.2). **Lezione memorizzata nell'handoff: build sola `C:\loto_app`** |
| 14 | Utente (22/09): "mi fido... procedi pure" per la task lint | L'utente testa l'APK al lavoro; delega il lavoro autonomo sulle task registrate | **Pulizia 19 warning lint completata** (`ee904a6`): `map.tsx` (13, dead code verificato per intento), `ProfileModal.tsx` (5, exhaustive-deps nickname corretta), `levelUtils.ts` (1, import in cima). `eslint` + `tsc` = zero problemi |

### D.2 Osservazioni utente VERBATIM (turno #3)

- **F1:** "ottimo cosi diventa ancora piu fluida l'esperienza utente"
- **F2:** "bella proposta ma da stutturare prima con precisione.questo segmento è da verificare bene perche richia di richiedere una moderazione costante( se non automatizabile)"
- **F3:** "ottimo ( avevo già fatto presente che tutti i pop up dovranno essere personalizati e non come notifiche sistemma . inoltre bisogna identificare quali sono iliv chiave per gestire lasoglia di apprendimento utente."
- **F4:** "ottima ok i primi 2 obiettivi il 3 dobbiamo stabilirlo."
- **F5:** "è un ottima base per parttire con questa feature, attenzione però i punti non sono spendibili.una volta completato l'app valuteremo in braingstorming precisi per ogni segmento come gestire i punti e man mano altri segmenti ."
- **F6:** "ma a questo punto servirebbe una zona che raccolga sicuramente questa modale e altre coaerenti per creare una sezione apposita per attivare la modalità "Avventura-Contenuti" troviamo un nome all'altezza dell'app"

### D.3 Lettura interpretativa (cosa implicano, dedotto e non espresso a parole)

- **F2 su moderazione:** l'utente NON vuole un loop che richieda curatela umana costante. Conclusione registrata:
  applicare il loop di ritorno su **azioni oggettive** (sblocco whisper via check-in), mai su testo UGC; template nei push.
- **F3 su pop-up di sistema:** vincolo RADICALE: tutti i pop-up (incl. unlock e level-up) devono essere modali
  personalizzate in stile/palette LOTO — mai `Alert` di sistema (oggi `_layout.tsx` usa ancora `Alert` per il gate → F3).
- **F3 su livelli chiave:** serve la mappa dei gate di apprendimento PRIMA di toccare la UI → `KEY_LEVELS` SSOT.
- **F4 obiettivo 3 "da stabilire":** il terzo petalo è rimasto volutamente aperto: l'utente ha delegato la proposta,
  ha chiuso su **B (sfida-quotidiana a rotazione)**.
- **F5 punti non spendibili:** la stretta su "non spendibili" rende F5 (streak con freeze a pagamento) NON avviabile oggi
  → economia PTI congelata a brainstorming finale; F5 resta solo "base concettuale".
- **F6 zona dedicata:** la modalità avventura non deve vivere in una modale isolata: ha bisogno di una **sezione/luogo
  stabile** (da qui il "Diario di Bordo" dentro il Profilo) che ospiti F6 + contenuti coerenti.

### D.4 Verifica anti-perdita (item emersi in chat e non dispersi)

| Ragionamento | Stato |
|---|---|
| Esperienza utente più fluida (F1) | ✅ implementato |
| F2: strutturare "prima con precisione" + rischio moderazione | ✅ chiuso in analisi (§7.1) |
| F3: pop-up personalizzati (no notifiche sistema) | 🟡 da fare (F3) |
| F3: identificare livelli chiave per soglia apprendimento | 🟡 chiuse in §7.2 (`KEY_LEVELS` da centralizzare) |
| F4: 3° obiettivo "da stabilire" | ✅ deciso = B |
| F5: punti non spendibili → economia a brainstorming di fine app | 🔒 congelato (registrato G12) |
| F6: sezione/zona dedicata + nome | ✅ deciso = "Diario di Bordo" (hub nel Profilo) |
| LV30 + soglia XP per azione | ✅ economia XP documentata (§7.2) |
| Metriche impatto con coefficienti inventati nel client (0.5/0.12/0.15 kg C()₂) | ✅ spostate su ledger reale (`total_co2`, `vw_collective_impact`) — G16 |
| Backup via email promesso nella UI ma non codificato | ✅ decisione utente: eliminato del tutto, solo QR locale — G17 |

---

*Fine report. Lavoro elaborato (codice + conversazione) salvato separatamente da quello realizzato; le sottili linee guida
del segmento gamification sono tracciate con stato puntuale (PARTE C) e la loro origine è in PARTE D.*