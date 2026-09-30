---
id: RICOSTRUZIONE
tipo: analisi
ambito: ricostruzione-dalla-documentazione-sparsa
stato: Vivente
confidenza: Media
owner: Agent
aggiornato: 2026-09-26
evidenza:
  - brain/edf3a8e6-785a-4c0a-adf8-ccecfa355d1b/PERFECT_STATE_BLUEPRINT.md
  - brain/ad0b58e2-544c-4569-9d42-d0cca1625133/LOTO_4_TIER_ARCHITECTURE.md
  - brain/fb161e9d-9c2c-4652-bb90-544173968410/logiche_proprietarie.md
  - utils/levelUtils.ts:13
  - utils/levelUtils.ts:149
  - app/(tabs)/index.tsx:370
  - app/(tabs)/map.tsx:131
---

# Ricostruzione della documentazione sparsa

> Risponde a: "che cosa intendevano i documenti sparsi, e quanto di quell'intento esiste davvero?"

Confidenza **Media**, dichiarata perche' due limiti non aggirabili sono in §6. Questo documento
**non duplica** i contenuti: ricostruisce e dichiara i verdetti. I dettagli per area stanno in
`aree/`.

---

## 1. Perimetro della ricostruzione

| Sorgente | File | Doc di progetto unici | Ruolo |
|---|---|---|---|
| `C:\Users\Sem\.gemini\antigravity\brain\` (41 cartelle) | 1.252 | 780 | **fonte primaria**: i documenti di lavoro, incluse le chat |
| `Desktop\doc loto\` | 590 | 331 | copie di lavoro, in parte sovrapposte |
| `Desktop\doc loto\LOTO_DOCS_MASTER\` | 472 | 251 | **copie datate** dell'archivio "archivist" |
| `C:\loto_app\docs\` + root | 45 | 45 | v1, gia' inventariata |

Dopo deduplicazione per nome e dimensione: **579 documenti unici**. 275 esistono in piu' di una copia.
**Nessun file e' stato spostato, rinominato o cancellato**: la ricostruzione e' di sola lettura.

**Il rumore era reale e rilevante:** 471 file sono documentazione di terze parti — regole ESLint,
documentazione `undici`/`expo-updates`, licenze. In `LOTO_DOCS_MASTER` circa il 70% non e' LOTO.
Esempio verificato: `[DB]_migrations_2026-08-25.md` e' in realta documentazione **expo-updates del
2022**, non una migration del progetto.

**Il suffisso `_YYYY-MM-DD` e' rumore.** `LOTO_DOCS_MASTER\[UI]_LOTO_HUB_MASTER_VISION_2026-08-23.md`
e' una copia byte-identica del file in `brain`: la data e' falsa. Questo conferma la regola R2 §1 e
rende ogni data nel nome inutilizzabile come prova.

## 2. Le tre fonti primarie

### F1 - `PERFECT_STATE_BLUEPRINT.md` (15 settembre)
Il documento piu' recente **per data interna** ("THE PERFECT PUZZLE (15 SETTEMBRE)"), successivo a
tutti i suffissi d'agosto. Contiene il rebranding completo e la tabella dei termini. **Non e' mai
stato portato in `docs_v1`** ed e' la ragione principale per cui la documentazione risulta obsoleta:
descrive la versione corretta del progetto, che nessuno ha mai importato.

### F2 - `LOTO_4_TIER_ARCHITECTURE.md`
L'unico che risolve **per segmentazione** il vincolo Zero-IoT, e l'unico che dichiara la separazione
fra cio' che e' gratis e cio' che si fattura. E' la base della proposta strutturale in A7.

### F3 - `loto_architecture_patamu_dossier.md`
L'unico con analisi competitiva storica (*"Foursquare uccide la batteria usando il GPS in
background"*), la gerarchia della verita' fra NFC e BLE, il check-in retroattivo, e l'**unico piano
di proprieta' intellettuale** dell'intero archivio (marchio Patamu, marca temporale eIDAS).

## 3. Cosa la ricostruzione ha cambiato rispetto a `docs_v1`

| Punto | `docs_v1` dice | La ricostruzione dice |
|---|---|---|
| Marchio | "L.O.T.O. HUB" ovunque | **LOTO MAP** ("Life On The Outside – Co-Experience Engine"), ribaltato il 15/09. Il package e ancora `com.lotohub.app` |
| Termine | "Sincro-Avventura" | **Eco-Passi**, perche' l'app misura km, non passi |
| Utente anonimo | "Esploratore" | **VIAGGIATORE**: la rinomina e' dovuta alla collisione con il Rank 2 |
| Rank 4 | "Eroe Jonico" | **Eroe del Mare** |
| Anti-cheat | una soglia sola (130 km/h) | **due soglie distinte**: 130 km/h = shadowban anti-spoofing, 20 km/h = filtro cinematico. Nessun documento le distingue |
| Validazione POI | triangolo NFC+GPS+BLE su tutti i POI | **4 tier**: solo i POI partner hanno NFC. I POI culturali sono GPS-only |
| XP per check-in | 15 / 50 / "xp_reward" | il codice usa `pois.xp_reward` (10/30/50/100) con fallback 15: **nessun documento e' corretto** |

## 4. I cinque risultati che contano

### R1 - Il "Whisper" sono due oggetti diversi, mai disambiguati
Il nome indica sia la **pilocola narrativa** che si sblocca salendo di livello (reward, leggibile solo
da chi sale), sia il **feedback anonimo B2B** ("Echoes"), che solo il partner del POI puo' leggere.
Sono entita' diverse, con regole opposte, e condividono un nome. E' il difetto di nomenclatura piu'
costoso: ogni lettore deve ricostruire quale dei due sia in gioco.

### R2 - La struttura a 4 tier e' la chiave della scalabilita'
`L2` prevede **POI importati da OpenStreetMap in poche ore, con solo geofencing a 30 m, nessun NFC
installato**: *"possiamo importare migliaia di P.O.I."*. E' l'unica via per escalare a un'intera citta
senza costo marginale, e l'unica compatibile con Zero-IoT e con C2. Dettagli in A7.

### R3 - Il rebobbiaggio e' stato scritto e poi non importato
La tabella dei termini vecchi -> nuovi esiste, completa, nel blueprint del 15/09. Nessun documento in
`docs/` la contiene. Tutta la v1 descrive ancora "LOTO HUB". Chi riprende oggi il lavoro dalla v1
costruisce un prodotto con il nome sbagliato.

### R4 - Due terzi della documentazione descrive strutture mai esistite
`vw_pois_frontend`, `scans`, `b2b_feedbacks`, `loto_squads`, `poi_ble_fingerprints`,
`crowd_predictions`, `calculated_speed_kmh`, la tabella `territories`, il cooldown 12h in forma
indicizzata, `vw_admin_checkins_analytics` in forma stabile. Sono descritte con sicurezza, alcune
marcate "[x] VERIFICATO", e non esistono. **Il rischio maggiore e' che qualcuno le implementi.**

### R5 - Il documento piu' ricco di contenuto commerciale e' irraggiungibile
`STRATEGIA_COMMERCIALE.md` contiene Rete Doc, il posizionamento di secondo livello, e il gancio CSRD
per MSC e Costa Crociere. **Non e' indicizzato da nessuna parte.** Esistono tre redazioni
inconciliati del modello economico (vedi A6).

## 5. Rettifiche alle analisi automatizzate del 26/09

Un'analisi che sbaglia e non lo dichiara e' inutile. Tre affermazioni sono risultate false e sono
corrette qui.

| Affermazione iniziale | Rettifica | Prova |
|---|---|---|
| "il cooldown 12h non e' implementato, 0 hit" | **esiste** nella catena canonica: `v_cooldown_hours CONSTANT NUMERIC := 12` (riga 132), usato a riga 193. Non e' applicato su cloud, ma e' scritto | `migrations/20260926120000_scan_chain_canonical.sql:132,193` |
| "`vw_admin_pois` e `vw_admin_checkins_analytics`: 0 hit, non esistono" | **esistono entrambe** nelle migration | `migrations/20260925120000_admin_dashboard_hardening.sql` |
| "`calculated_speed_kmh`: 0 hit, non esiste" | **esiste**, colonna aggiunta dalla catena canonica: `ADD COLUMN IF NOT EXISTS calculated_speed_kmh DOUBLE PRECISION` | `migrations/20260926120000_scan_chain_canonical.sql:54` |
| "`vw_pois_frontend` non esiste: vista fantasma" | **esiste** in 12 file di `archive_scattered_sql/` e `pure_cloud_queries/`. Il problema reale e' diverso e peggiore: **non e' versionata in nessuna migration** | `archive_scattered_sql/FIX_MAP_VIEW.sql:11` e altri 11 |
| "`scans` non esiste" | confermato: nessuna tabella. Compare solo come valore enum in un CHECK di `collective_goals` | - |
| "`b2b_feedbacks` e `territories`: 0 hit" | **esistono entrambe** nelle migration | `migrations/20260822_create_b2b_feedbacks.sql:5` |

**Metodo, dichiarato perche' ha un costo:** cinque delle sei rettifiche hanno la stessa causa. La
prima ricerca usava glob che non ricorrevano nelle sottocartelle, o confrontavano la root di
`supabase/` con gli archivi senza dirlo. **Un "0 hit" che non specifica il glob e' indistinguibile da
una ricerca fatta male.** Per questo `tooling/verifica_coerenza.py` distingue tre casi e li dichiara
tutti: *inesistente*, *esistente ma solo in archivio*, *esistente e versionato*.

## 6. Il ritrovamento piu' importante

**Due oggetti che il frontend interroga e che non sono versionati nelle migration.** Sono due
problemi **diversi**, e distinguerli cambia la soluzione.

### 6.1 `vw_collective_impact` — interrogata e non definita

| | |
|---|---|
| Usata in | `app/(tabs)/community.tsx:99`, `app/(tabs)/index.tsx:451` |
| Commento nel codice | `community.tsx:96`: *"la SSOT"* |
| Definizioni in `supabase/migrations/` | **0** |
| Definizioni in tutto `supabase/` | **0** (unico accenno: `schema/introspection.sql`) |

Se non esiste nel cloud, la **bacheca cooperativa** e le **statistiche collettive della Home**
leggono il fallback. E' il caso peggiore: il commento nel codice la dichiara la fonte di verita'.

### 6.2 `vw_pois_frontend` — esiste, ma solo fuori dalle migration

**Qui ho sbagliato, e va detto chiaramente.** Avevo scritto *"0 definizioni in tutto `supabase/`"*:
non e' vero. La verifica corretta:

| Dove | Definizioni |
|---|---|
| `supabase/migrations/` | **0** |
| `supabase/archive_scattered_sql/` | 5 (`fix_colors_and_view`, `FIX_MAP_VIEW`, `LOTO_RESURRECTION_FULL`, `RESTORE_LOTO_MASTER`, `SPRINT_3_ALL_IN_ONE`) |
| `supabase/pure_cloud_queries/` | 7 |
| Usata in | `app/(tabs)/map.tsx:131`, `app/(tabs)/index.tsx:370` |

Quindi la vista **esiste ed e' stata applicata a mano** al cloud. Il problema non e' che manchi: e' che
**non e' versionata**. Nessuna migration la definisce, quindi chi ricrea un ambiente da zero ottiene
un'app senza POI, e nessun controllo automatico la collauderebbe.

**L'azione corretta non e' "scrivere la vista": e' migrare la definizione dall'archivio in una
migration canonica**, con la stessa revoca ad `anon` delle altre. Ho sbagliato perche' la mia prima
ricerca usava un glob che non ricorreva nelle sottocartelle: e' esattamente la regola **AP7** che
avevo appena scritto, e che non avevo applicato a me stesso.

### 6.3 La diagnosi di fondo

I due casi insieme dicono una cosa sola: **esiste lavoro fatto direttamente dal pannello Supabase che
non e' passato da Git.** Lo avevi osservato tu il 19/09: *"molte operazioni al DB sono state fatte dal
pannello web di Supabase (out-of-band)"*. Il rischio non e' teorico: **due schermate dell'app
dipendono da oggetti che il repository non sa di possedere.**

**Non ho accesso al cloud per decidere quale dei due casi sia.** E' l'introspezione col piu' alto
valore di tutto il progetto e va in `DECISIONI.md` (D9).

## 7. Limiti dichiarati

- **Nessuna introspezione del DB cloud.** Tutte le affermazioni sullo schema vengono dal codice nel
  repo, non dal database. La divergenza possibile e' esattamente il punto di R6.
- **Nessun test funzionale.** Le verifiche sono letture di file e ricerche di pattern.
- **Le 4 "killer feature" non sono state valutate.** Una e' stata trovata in collisione diretta con
  Zero-IoT (cfr. A1, legge 2) e un'altra con il divieto di dati fittizi.
- **Confidenza Media non perche' l'analisi sia debole, ma perche' il cloud non e' stato
  interrogato.** Se `vw_pois_frontend` esiste, questa ricostruzione sale a Alta su tutto il resto.

---

*Ricostruzione del 26/09/2026 su 579 documenti unici, tre fonti esterne, in sola lettura. Nessun
file esterno e' stato modificato, spostato o cancellato.*
