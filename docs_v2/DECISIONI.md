---
id: DECISIONI
tipo: decisione
ambito: registro-delle-decisioni-aperte-e-presa
stato: Vivente
confidenza: Alta
owner: utente
aggiornato: 2026-09-30
evidenza:
  - INVENTARIO_DOCUMENTAZIONE.md:104
  - docs_v2/aree/A1_fondazione.md:88
  - docs_v2/aree/A2_gamification.md:110
  - docs_v2/aree/A3_dati_e_sql.md:118
  - docs_v2/aree/A4_dashboard_daas.md:104
  - docs_v2/aree/A6_commerciale.md:96
  - supabase/migrations/20260929160000_restore_proximity_gate.sql:243
  - supabase/migrations/20260929160000_restore_proximity_gate.sql:104
  - supabase/migrations/20260925120000_admin_dashboard_hardening.sql:110
---

# Registro delle decisioni

> Ogni riga qui e' un punto in cui la documentazione **non puo' decidere da sola**. E' il luogo dove
> il dubbio smette di essere un'incertezza e diventa una domanda con delle opzioni.

**Chi decide:** l'utente. L'agente propone e verifica sul codice (`AGENTS.md` §1 e §7).
**Le tre fasi:** `aperta` -> `presa` -> `applicata`. Solo la terza e' una verifica reale: richiede
un `file:linea`. Il formato e' in `docs_v2/template/DECISIONE.md`.

---

## Indice

| # | Titolo | Stato | Blocca | Area |
|---|---|---|---|---|
| D1 | Quale dei quattro "SSOT" sopravvive | `applicata` | — | A1 |
| D2 | Dove vanno i 7 file .md della root del repo | `aperta` | la deduplica e l'indice | A1 |
| D3 | `knowledge_recovery_guide.md` ha 3 link rotti | `aperta` | la guida per una sessione nuova | A1 |
| D4 | Applicare ora i 4 blocker della catena canonica | **`parziale`** | il check-in end-to-end | A3 |
| D5 | Lo scan NFC da solo deve funzionare? | `applicata` (opzione 2) | — | A3 |
| D6 | Il check-in accredita PTI? | `applicata` | — | A3 |
| D7 | Il cap di 3 carte anti-flood: obbligo o design? | `aperta` | la qualita' della progressione | A2 |
| D8 | Le 3 direzioni commerciali di A6 | `aperta` | la vendita | A6 |
| D9 | `vw_pois_frontend` esiste nel cloud o manca? | `aperta` | Home e Mappa, e la riproducibilita' dell'ambiente | A7 |
| D10 | S1-S2: struttura di validazione a 4 tier + campo `poi.tier` | `aperta` | la scalabilita' della struttura finale | A7 |
| D11 | S3: `rank` e tier narrativo sono due cose distinte? | `applicata` | — | **A8** |
| D12 | S4: griglia 110 m e soglia k-anonimita' sono complementari? | `applicata` (opzione 1) | — | A4 |
| D13 | Come il partner sblocca i feedback Echo: su WhatsApp o su dashboard? | `aperta` | il funnel di upgrade | DOCTRINA-ECHO |
| D14 | Disambiguazione di `tier` in tre termini distinti | `applicata` | — | **A8** |
| D15 | Nome ufficiale del progetto | `applicata` | — | **A8** |

---

## D1 - Quale dei quattro "SSOT" sopravvive

| campo | valore |
|---|---|
| **Stato** | `applicata` |
| **Chi decide** | utente |
| **Aperta il** | 2026-09-26 |
| **Chiusa il** | 2026-09-30 |
| **Esito** | **Tre strati distinti.** `AGENTS.md` = principi, `LOTO_ENGINEERING_MANIFESTO.md` = ingegneria, `LOTO_HUB_MASTERPLAN.md` = prodotto. Gli altri tre passati a `Storico` con banner. |
| **Prova** | I quattro documenti di luglio hanno tutti il banner `ARCHIVIO. Documento storico` a riga 3 · il file canonico e' `docs_v2/loto-hub-architettura-sistema-master-2026.md`, registrato in `autorita.json` dominio `modello-prodotto` |

### Domanda
Quale documento e' l'unica fonte di verita' per i principi e per l'ingegneria?

### Opzioni

| # | Opzione | Pro | Contro | Prova |
|---|---|---|---|---|
| 1 | **Tre strati distinti** (raccomandata): `AGENTS.md` = principi, `LOTO_ENGINEERING_MANIFESTO.md` = ingegneria, `LOTO_HUB_MASTERPLAN.md` = prodotto. Gli altri 3 passano a Storico | rispetta i tre domini reali; i divieti del manifesto sono gia' verificati nel codice | richiede di dichiarare superati 2 documenti che si auto-dichiiarano "definitivi" | `AGENTS.md:5`; manifesto conforme al codice; `LOTO_HUB_SSOT_DEFINITIVO.md` smentito |
| 2 | **Un solo SSOT** (es. solo `LOTO_HUB_SSOT_DEFINITIVO.md`) | massima semplicita' | **non sostenibile**: quel documento descrive `esg_raw_logs` (tabella inesistente) e un backup email revocato | `esg_raw_logs`: 0 occorrenze in `app/`, `components/`, `utils/`, `types/` |
| 3 | **Dichiara 4 SSOT paralleli** e basta | nessuna riorganizzazione | il problema resta identico: e' lo stato attuale | 4 dichiarazioni in conflitto, vedi `docs_v2/regole/R1_autorita.md` §3 |

### Raccomandazione
Opzione 1. E' l'unica che non richiede di riscrivere contenuti e non perde nulla: i documenti
superati restano leggibili con un link al successore. **Non posso applicarla da solo** perche'
`root/LOTO_HUB_MASTER_CONTEXT.md` contiene una "DIRETTIVA DI SISTEMA PER L'IA" che mi vieta di
modificarlo, e perche' dichiarare superato un documento che si dichiara "definitivo" e' una tua
decisione (R1 §5).

---

## D2 - Dove vanno i 7 file .md della root del repo

| campo | valore |
|---|---|
| **Stato** | `aperta` |
| **Chi decide** | utente |
| **Aperta il** | 2026-09-26 |
| **Blocca** | la deduplica. 5 dei 7 file non sono indicizzati da nessuna parte |

### Opzioni

| # | File | Proposta | Prova |
|---|---|---|---|
| 1 | `rules.md` | **promuovere** in `docs_v2/regole/R5_protocollo_skeleton.md` e collegarlo a R1 | contiene il protocollo `[PARSE] -> [SKELETON] -> [HALT] -> [COMPILE]`, oggi invisibile |
| 2 | `STRATEGIA_COMMERCIALE.md` | **promuovere** in `docs_v2/aree/A6_commerciale.md` come fonte, poi archiviare l'originale | il documento piu' specifico dell'area, non indicizzato |
| 3 | `PLAYBOOK_COMMERCIALE.md` | **reconciliare** con `docs/commercial/commercial_playbook.md` (0/22 righe comuni) | due redazioni divergenti dello stesso argomento |
| 4 | `SESSION_BOOTSTRAP_RICOSTRUZIONE.md` | **archiviare** mantenendo risolvibili i riferimenti di `codici_morti.md` (§6/§7/§10) | punta al worktree vuoto e a un branch superato |
| 5 | `README.md` | **sostituire** con un README vero del progetto | oggi e' il template Expo ("Welcome to your Expo app"), non modificato |
| 6 | `task.md` (1 byte) | **archiviare** | file vuoto; l'originale utile e' `docs/task.md` (1253 byte) |
| 7 | `LOTO_HUB_MASTER_CONTEXT.md` | **archiviare** come Storico | duplica i dogmi del manifesto (D1 opzione 1) |

### Raccomandazione
Le 7 proposte sono indipendenti e ognuna e' reversibile. Procedere per lotti, non tutte insieme.

---

## D3 - `knowledge_recovery_guide.md` ha 3 link rotti

| campo | valore |
|---|---|
| **Stato** | `aperta` |
| **Chi decide** | utente |
| **Aperta il** | 2026-09-26 |
| **Blocca** | la guida che una sessione nuova apre per prima |

### Opzioni

| # | Opzione | Pro | Contro |
|---|---|---|---|
| 1 | **Rifarlo da zero** sull'indice reale, con i 6 ambiti di `docs_v2` come indice | una guida sola, coerente col v2 | costo: rileggere 45 file |
| 2 | **Archiviarlo** e usare `docs/README.md` come unica guida d'ingresso | zero lavoro, una fonte sola | `docs/README.md` ha l'indice incompleto (7 file mancanti) |
| 3 | Correggere solo i 3 link rotti | minimo | tiene viva una guida che punta a documenti di 4 mesi fa |

### Dato di fatto
`icapital_peeripato_strategy.md` ha **0 occorrenze in tutto il repository**. Gli altri due
(`loto_hub_development_update.md`, `mockups_recap_strategy.md`) non esistono in `docs/`.
La guida rimanda a tre vicoli ciechi.

---

## D4 - I 4 blocker della catena canonica: correggere ora o registrare come debito

| campo | valore |
|---|---|
| **Stato** | `parziale` — B1 chiuso, B2 non applicabile, B3 **aperto**, B4 aperto |
| **Chi decide** | utente |
| **Aperta il** | 2026-09-26 |
| **Rivista il** | 2026-09-30 |

### Esito 30/09: due blocker chiusi, due aperti

La domanda originale ("correggere ora o registrare come debito?") ha una risposta diversa per ciascuno,
e **non si può chiudere come risolta**: chiuderla sarebbe riprodurre l'errore che questo registro
serve a prevenire.

| # | Sev | Difetto | Esito | Prova |
|---|---|---|---|---|
| B1 | Blocker | nessun `BEGIN`/`COMMIT` | **CHIUSO** | `20260927090000_scan_chain_shadowban_and_ledger.sql:78,235` · `20260929160000_restore_proximity_gate.sql:104,309` |
| B2 | Blocker | PK composta `(profile_id, poi_id)` | **NON APPLICABILE** | la PK composta esiste su `user_pois` (`supabase/user_pois_schema.sql:12`) e `20260926120000:70-75` dichiara per iscritto di **non** crearla in quella catena. Il vincolo che impedirebbe le visite ripetute era altrove, ed è altrove che è stato messo |
| B3 | Blocker | race condition sul cooldown, doppio XP | **ANCORA APERTO** | `20260929160000` ha la transazione (`BEGIN`/`COMMIT`) ma **zero** `pg_advisory_xact_lock` e **zero** `SELECT ... FOR UPDATE`. Verificato con ricerca su tutto il file |
| B4 | Blocker | `profiles.tenant_id` senza backfill | **ANCORA APERTO** | `20260926120000:87-88` fa `ADD COLUMN` e `:89-90` l'indice, ma **nessun `UPDATE profiles SET tenant_id`**. I 4 `UPDATE public.profiles` presenti nelle migration toccano `admin_role`, `total_xp`, `total_tokens`, `total_co2` — mai `tenant_id`. La colonna è inoltre assente da `types/database.ts` |

**B3 è il più serio dei due rimasti**, perché riapre esattamente l'exploit che la catena esiste per
chiudere: due richieste concorrenti sulla stessa coppia utente/POI superano entrambe il controllo
di cooldown e accreditano due volte.

**Cosa serve per chiuderlo:** un `pg_advisory_xact_lock` sulla chiave `(profile_id, poi_id)` all'
inizio del corpo di `scan_poi_gps`, prima del controllo di cooldown. Una riga. Non si applica al
cloud senza il tuo via esplicito (`METODICA` §5).

### Domanda
`migrations/20260926120000_scan_chain_canonical.sql` ha 4 blocker verificati. Li correggo ora?

| # | Sev | Difetto | Prova |
|---|---|---|---|
| B1 | Blocker | nessun `BEGIN`/`COMMIT` | 0/0, contro 1/1 della hardening |
| B2 | Blocker | PK composta `(profile_id, poi_id)` fa collassare le visite ripetute: la heatmap DaaS diventa 1 riga per utente x POI per sempre | `:221-239` contro l'obiettivo dichiarato a `:70-75` |
| B3 | Blocker | race condition sul cooldown -> **doppio XP** con richieste concorrenti | `:189-227` |
| B4 | Blocker | `profiles.tenant_id` senza backfill -> righe esistenti a NULL, invisibili | `:87-90`, consumer `app/(tabs)/index.tsx:276-286` |

### Raccomandazione
**Correggere ora.** B2 rende inutilizzabile la heatmap DaaS, che e' il prodotto vendibile. B3
riapre esattamente l'exploit che la migration esiste per chiudere: se resta aperto, la migration
ha creato l'impressione di aver risolto qualcosa che non ha risolto. L'alternativa "registrare come
debito" e' legittima solo se e' chiaro perche' e entro quando.

---

## D5 - Lo scan NFC da solo deve funzionare?

| campo | valore |
|---|---|
| **Stato** | `applicata` — **opzione 2: GPS + NFC insieme** |
| **Chi decide** | utente |
| **Aperta il** | 2026-09-26 |
| **Chiusa il** | 2026-09-30 |
| **Prova** | `20260926120000_scan_chain_canonical.sql:345-357` — `scan_poi` richiede una riga in `user_pois` per (utente, POI) negli ultimi 15 minuti, altrimenti `RAISE EXCEPTION` |

### Esito 30/09: l'opzione 2 era gia' scritta, e regge

La scelta è già nel codice e non è mai stata registrata. Il tag NFC **non** vale da solo: è una
finalizzazione di una visita GPS già avvenuta. `:359` fa inoltre in modo che `scan_poi` non accrediti
nulla, perché la ricompensa è già stata contabilizzata da `scan_poi_gps`.

**Opzione 3 (challenge firmato) non è stata scelta.** `validate_ntag424_sdm` non ha un
`CREATE FUNCTION` in nessun `.sql` del repository: l'unica occorrenza è un *commento* che la nomina
in `20260926120000:325`. E `utils/nfcManager.ts` non ha un solo import in tutto il codice, e non
parla col chip: fa due regex `[?&]p=` / `[?&]c=` sulla stringa URI NDEF.

**Conseguenza da sapere, non un difetto della decisione:** con l'opzione 2, il ramo NFC è un
secondo pulsante che duplica il primo con un passaggio in meno. `components/PoiDetailSheet.tsx:576`
passa `p_poi_id: poi.id`, cioè il POI già aperto nella scheda, **non** quello codificato nel tag, e
`:565` usa il contenuto del tag solo per distinguere l'evento rifiuti. Finché la crittografia non è
collegata, il claim "il tag è la prova" non è sostenibile: il claim sostenibile è "il tag
conferma". Vedi `autorita.json`, dominio `nfc-zero-iot`, stato `vuoto`.

### Domanda
Nella catena canonica `scan_poi` (NFC) e' diventata una **finalizzazione** che richiede una visita
GPS validata negli ultimi 15 minuti (`:322-326`). Il scan del tag, da solo, deve funzionare?

| # | Opzione | Pro | Contro |
|---|---|---|---|
| 1 | **Il tag da solo vale** | l'esperienza e' quella che l'utente si aspetta: inquadra e riceve | serve un **challenge NFC firmato**: chiunque puo' copiare un tag. Contra l'anti-cheat |
| 2 | **GPS + NFC insieme** (scelta attuale) | anti-cheat solido, prova di presenza fisica | un utente col telefono spento o in risparmio GPS fatica |
| 3 | **Challenge firmato** sul tag, verificato lato server | risolve il punto 1 mantenendo l'anti-cheat | e' lavoro di implementazione, non una riga |

### Raccomandazione
Opzione 3 se il tag deve bastare da solo: e' l'unica che tiene insieme Zero-IoT, anti-cheat e
semplicita' d'uso. **Da decidere prima del rilascio**, perche' cambia la firma delle funzioni.

---

## D6 - Il check-in accredita PTI?

| campo | valore |
|---|---|
| **Stato** | `applicata` — il check-in accredita PTI |
| **Chi dice** | utente |
| **Aperta il** | 2026-09-26 |
| **Chiusa il** | 2026-09-30 |
| **Prova** | `20260929160000_restore_proximity_gate.sql:243` (10 PTI pedonale) · `:239` (1 PTI veicolare) · `:263,267` (scrittura in `impact_transactions.tokens_earned`) · `:275` (accumulo in `profiles.total_tokens`) |

### Esito 30/09: l'opzione 2 era quella giusta, ed era gia' scritta

La domanda era se `tokens_earned = 0` fosse voluto. **Non lo è: il codice accredita, e la versione
che accredita è quella viva.**

| modalita' | PTI | riga |
|---|---|---|
| pedonale (< 20 km/h) | **10** | `:243` |
| veicolare (20-130 km/h) | **1** | `:239` |

E l'economia è coerente con la separazione XP/PTI: il CO₂ resta a zero sul veicolare (`:244`
`v_co2 := 0`), quindi chi arriva in auto non genera CO₂ risparmiata ma accredità comunque il
contributo civico. È la distinzione giusta.

**Una cosa che la chiusura non risolve.** Il "+25 PTI" che l'utente vede alla conferma di una
segnalazione civica è una **stringa**, non una scrittura:
`components/CivicDashboard.tsx:116` e `components/CivicReportSheet.tsx:86`. Nessun writer.
`A2-T9` resta aperto e non è coperto da questa decisione.

### Domanda
La catena canonica inserisce in `impact_transactions` con `tokens_earned = 0`. Il check-in **non
accredita mai PTI**. E' voluto?

| # | Opzione | Prova |
|---|---|---|
| 1 | Voluto: la PTI si accredita solo con azioni civiche | `:189-227` |
| 2 | Non voluto: e' unpezzo dimenticato | nessun riferimento in `A4` o `A6` |

### Nota
Il doc di gamification del 20/09 riporta la tua indicazione *"f5: economia PTI congelata fino a fine
app"*. Se e' questo il criterio, va scritto nel codice con un commento, altrimenti il prossimo
agent lo legge come un bug.

---

## D7 - Il cap di 3 carte anti-flood: obbligo o design?

| campo | valore |
|---|---|
| **Stato** | `aperta` |
| **Chi decide** | utente |
| **Aperta il** | 2026-09-26 |
| **Blocca** | l'esperienza di level-up su salti multipli |

### Domanda
`docs/gamification_rampa_early_game.md` descrive un cap di 3 carte anti-flood. Il codice **non ha
clamp**: un salto LV1 -> LV10 produce 1 LEVEL_UP + 2 WHISPER + 4 REVEAL + 1 RITO = **8 carte** in
coda (`components/GamificationTransitionManager.tsx:43-49`). L'aggregazione c'e', il cap no.

| # | Opzione | Pro | Contro |
|---|---|---|---|
| 1 | **Implementare il cap a 3** come da specifica | rispetta la specifica scritta | una REVEAL importante potrebbe non essere mostrata |
| 2 | **Cap piu' alto, con priorita'**: le REVEAL non si perdono, si accodano i WHISPER | l'utente vede le sezioni che ha sbloccato | piu' carte in coda |
| 3 | **Nessun cap**, il doc e' sbagliato | fedele al codice | 8 modali consecutivi: esattamente cio' che l'anti-flood voleva evitare |

### Raccomandazione
Opzione 2. Le REVEAL sono l'unica parte con **azione richiesta** (il pulsante "Esplora la Sezione"):
perdere quella perche' la coda e' piena e' la perdita piu' costosa. I WHISPER sono informativi e
possono essere aggregati.

---

## D8 - Le tre direzioni commerciali di A6

| campo | valore |
|---|---|
| **Stato** | `aperta` |
| **Chi decide** | utente |
| **Aperta il** | 2026-09-26 |
| **Blocca** | la vendita. L'area `A6_commerciale.md` resta `Bozzza` con confidenza `Bassa` finche' non rispondi |

### Le tre domande

1. **Priorita' fra DaaS-B2G (agenzie comunali) e DaaS-crociere (CSRD)?** Sono due prodotti con due
   cicli di vendita diversi: la licenza Zero-Code e' un B2B software, il dato ESG e' un B2B
   dati. Nessun documento sceglie
2. **Rete Doc: veicolo di fase 0-to-1 o permanente?** Cambia la documentazione legale del progetto
3. **Il CSRD e' collegato a un prodotto specifico?** Il gancio e' convincente ma non e' agganciato
   a una specifica, e senza prodotto non si chiude

### Nota
`AGENTS.md` §5 fissa il vincolo: si vendono **agenzie dati e turismo**, e si vende
**infrastruttura TSaaSI**, non software o servizi. Queste risposte devono stare dentro quel
perimetro. Se una di esse lo richiede, e' una discussione, non un allineamento.

---

## D9 - `vw_pois_frontend` esiste nel cloud o manca?

| campo | valore |
|---|---|
| **Stato** | `aperta` |
| **Chi decide** | utente (serve un'introspezione) |
| **Aperta il** | 2026-09-26 |
| **Blocca** | la Home, la Mappa, e la riproducibilita' dell'ambiente |

### Domanda
Il frontend interroga `vw_pois_frontend` in due punti attivi, ma la vista non e' definita in nessuna
migration del repository. **Esiste nel DB cloud?**

| # | Caso | Conseguenza |
|---|---|---|
| 1 | **Non esiste nel cloud** | Home e Mappa non ricevono POI da questa rotta. Difetto funzionale gia' visibile |
| 2 | **Esiste, creata out-of-band dal pannello** | **manca da Git**: non e' versionata, non e' migrabile, e chiunque crei un ambiente da zero ottiene un'app senza POI. E' il caso peggiore perche' funziona |

### Come si risolve
Un'interrogazione in SQL Editor, in tre righe:
```sql
select table_name from information_schema.views where table_name = 'vw_pois_frontend';
select schemaname, viewname from pg_views where viewname = 'vw_pois_frontend';
```
Se risponde, il passo successivo e' **portarla in una migration** con revoca ad `anon` come tutte le
altre viste. Se non risponde, va scritta e applicata.

### Nota
L'utente ha gia' osservato la causa: *"molte operazioni al DB sono state fatte dal pannello web di
Supabase (out-of-band)"*. Se il caso e' 2, il problema e' piu' ampio di questa vista.

---

## D10 - S1+S2: struttura di validazione a 4 tier

| campo | valore |
|---|---|
| **Stato** | `aperta` |
| **Chi decide** | utente |
| **Aperta il** | 2026-09-26 |
| **Blocca** | la scalabilita'. Senza questa, l'app resta un prototipo per un numero chiuso di POI partner |

### Opzioni
| # | Struttura | Pro | Contro |
|---|---|---|---|
| 1 | **4 tier (L1 innesco / L2 popolamento OSM / L3 mappatura civica / L4 monetizzazione)** | l'unica che scala a una citta intera a costo marginale zero; separa tre linee di ricavo; rispetta Zero-IoT | richiede un campo `poi.tier` esplicito |
| 2 | Triangolo NFC+GPS+BLE su tutti i POI | uniforme, nessuna classificazione | viola il criterio C2: costo marginale per ogni POI pubblico |
| 3 | NFC solo partner, GPS per il resto | semplice | non distingue chi e' gratis e chi e' fatturabile, quindi non guida il pricing |

### Raccomandazione
Opzione 1, piu' il campo `poi.tier` (S2). Il tier e' la meta' del criterio C2 applicata a un
singolo POI: distingue il costo marginale zero dal costo per transazione. Dettagli in
`docs_v2/aree/A7_struttura_esperienza.md` §2.

---

## D11 - S3: `rank` e tier narrativo sono la stessa cosa?

| campo | valore |
|---|---|
| **Stato** | `applicata` — **tre livelli distinti**, decisione del 30/09 |
| **Chi decide** | utente |
| **Aperta il** | 2026-09-26 |
| **Chiusa il** | 2026-09-30 |
| **Prova** | [`A8_lessico_e_marchio.md`](aree/A8_lessico_e_marchio.md) §1.1 |

### Esito 30/09: la domanda era sottostimata, ed e' chiusa al livello giusto

La domanda chiedeva se `rank` e tier narrativo fossero due viste dello stesso oggetto. Sono **cinque
vocabolari distinti**, non due, e la separazione è già conforme al codice:

| termine | cosa indica | dove |
|---|---|---|
| **rank** | progressione: 5 blocchi da 10 su 50 livelli | `utils/levelUtils.ts:80-129,148-160` |
| **`lore_tier`** | livello narrativo: il racconto del blocco | `utils/LevelUpLore.ts:6-7` |
| **`frame`** | layout grafico dell'avatar: bordo, aura, ombra | `utils/levelUtils.ts:242-310` |
| **stemma** | simbolo del blocco: `explore`, `shield`, `security`, `anchor`, `public` | `utils/levelUtils.ts:80-129` |
| **filtri Visioni Sospese** | 6, con soglie tutte diverse | `components/MemoriesCameraModal.tsx:16-23` |

**Il nome riservato per la validazione del POI è `poi.tier`** e non ha niente a che fare con questi
cinque: è la `D10`, resta aperta, e il campo non esiste ancora.

### Difetto scoperto chiudendo questa decisione

`utils/levelUtils.ts` si contraddice da solo. Lo stesso blocco di livelli ha due nomi **nello stesso
file**:

```
:10    //  11 Radici Sommerse
:288   //  Tier 2: Le Radici Antiche (Liv 11-20)
```

E il lore sceglie il primo (`utils/LevelUpLore.ts:6`). Nessun type check lo segnala: sono due
stringhe in due commenti. Gli altri quattro blocchi concordano, quindi la divergenza è una sola —
ma è sul blocco che ospita il rank `Esploratore`.

### Domanda
Oggi l'intervallo 1-10 ha **due nomi diversi**: come rank "Turista Occasionale"
(`levelUtils.ts:149`) e come tier narrativo "Il Risveglio del Seme"
(`docs/gamification_struttura_narrativa.md`). Sono due viste dello stesso oggetto, oppure due livelli
distinti?

| # | Opzione | Pro | Contro |
|---|---|---|---|
| 1 | **Tre livelli distinti**: rank (progressione) / tier narrativo (lore) / frame (grafica) | ogni nome ha una funzione; i rename non si rompono | tre vocabolari da mantenere |
| 2 | Un solo nome per intervallo | meno manutenzione | perde sia il lore narrativo sia la semantica della progressione |

### Raccomandazione
Opzione 1. Il tier narrativo e' quello che rende il rank non un numero. Senza la separazione, chi
cambia "Custode della Citta" per non confonderlo con un ruolo civico reale rompe anche il racconto
del Risveglio del Seme.

---

## D12 - S4: griglia 110 m e soglia k-anonimita'

| campo | valore |
|---|---|
| **Stato** | `applicata` — **opzione 1: complementari, in due livelli** |
| **Chi decide** | utente |
| **Aperta il** | 2026-09-26 |
| **Chiusa il** | 2026-09-30 — **era gia' decisa nel codice da almeno 25 giorni** |
| **Prova** | `20260925120000_admin_dashboard_hardening.sql:86-87` (griglia) · `:88-89` (bucket 15 min) · `:110` (`k=5`) · `:113` (`HAVING COUNT(DISTINCT profile_id) >= 5`) |

### Esito 30/09: la decisione era gia' stata presa, e non registrata

Questa e' la decisione che meglio dimostra perche' il registro esiste. Le due strategia non erano
alternative: **erano gia' complementari nella stessa vista**, e la domanda restava aperta.

| livello | cosa fa | riga |
|---|---|---|
| aggregazione commerciale | `ROUND(lat::numeric, 3)` / `ROUND(lng::numeric, 3)` | `:86-87` |
| granularita' temporale | `DATE_TRUNC('hour', visited_at) + INTERVAL '15 min' * (minute / 15)` | `:88-89` |
| **garanzia minima** | `HAVING COUNT(DISTINCT profile_id) >= 5` | `:113` |

Quindi: **la griglia da' la granularita' commerciale, la soglia e' la garanzia legale.** Il valore di
k è **5**, e il codice lo dichiara in tre posti senza che nessuna decisione lo coprisse.

**Correzione necessaria al testo della domanda.** La griglia non è "110 m": è
`ROUND(x, 3)` = 0,001°, che a Taranto vale circa **111 m in latitudine e 85 m in longitudine**. Il
"110 m" compare in almeno quindici documenti ed è un'approssimazione, non una specifica. `ST_SnapToGrid`
non compare mai in `supabase/migrations/`.

Lo stesso `k = 5` è riusato in `20260929120000_mete_consigliate_soft_sorting.sql:103` per le Mete
Consigliate. Un solo k in tutto il prodotto, come deve essere.

### Domanda
La documentazione fissa **griglia 110 m + bucket 15 min**; il codice implementa **soglia
k-anonimita'** sulle viste DaaS. Sono due strategie alternative per la privacy, o due livelli
complementari?

| # | Opzione | Pro | Contro |
|---|---|---|---|
| 1 | **Complementari, in due livelli**: la griglia per l'aggregazione commerciale, la soglia come **garanzia minima** sotto la quale la cella non e' pubblicata | risolve il rischio di re-identificazione dichiarato ma mai auditato (bassa densita', notte, centri storici) | da definire il valore di k |
| 2 | Solo griglia | semplice, in documentazione | non protegge dalla re-identificazione su dati sparsi |
| 3 | Solo soglia | gia' implementata | riduce la granularita' commerciale |

### Raccomandazione
Opzione 1. Il rischio dichiarato in `mvp_go_to_market_strategy` (*"impossibilita' matematica"*) non e'
stato mai sottoposto a verifica. Una griglia 110 m di notte in un centro storico puo' contenere una
persona. La soglia e' la garanzia, la griglia e' il prodotto.

---

## D13 - Come il partner sblocca i feedback Echo

| campo | valore |
|---|---|
| **Stato** | `aperta` |
| **Chi decide** | utente |
| **Aperta il** | 2026-09-26 |
| **Blocca** | l'unico ricavo ricorrente del merchant. `is_premium_unlocked` esiste in tabella ma non ha schermo |

### Domanda
Il partner Freemium vede il **conteggio** dei feedback, non il testo. Per leggerli deve passare al
Premium. **Dove avviene lo sblocco?**

| # | Opzione | Pro | Contro |
|---|---|---|---|
| 1 | **Bot WhatsApp**, come tutto il resto del canale partner | coerente con Zero-UI (`AGENTS.md` §5): nessuna interfaccia complessa per l'esercente | il testo dei feedback in un messaggio e' scomodo da leggere |
| 2 | **Mini-schermata web** per il partner | il testo si legge bene, si puo' filtrare per categoria | reintroduce un'interfaccia per il partner, che il progetto ha escluso |
| 3 | **Entrambe**: sblocco via WhatsApp, lettura su scheda semplice | la conversione resta a zero attrito e la lettura e' decente | due pezzi da costruire |

### Raccomandazione
Opzione 1, e perche' e' una scelta di coerenza piu' che di comodita': se il primo posto in cui
l'esercente incontra il prodotto e' una schermata web, il messaggio "non hai bisogno di un software"
e' gia' perso. Lo sblocco via WhatsApp **usa il canale che esiste gia'** e la lista crediti che i
documenti hanno gia' definito (500 crediti / 50 EUR, 1200 / 100 EUR, sblocco whisper 5 crediti).
La lettura la si risolve con un messaggio che contiene il link, e la formattazione in chat la
risolve per il caso d'uso reale: il partner vuole capire se il servizio e' buono, non gestire 300
recensioni.

---

## D14 - Disambiguazione di `tier` in tre termini distinti

| campo | valore |
|---|---|
| **Stato** | `applicata` |
| **Chi decide** | utente |
| **Aperta il** | 2026-09-30 |
| **Esito** | `frame` per il layout grafico UI · `poi.tier` per la validazione del POI · `lore_tier` per il livello narrativo |
| **Prova** | [`A8_lessico_e_marchio.md`](aree/A8_lessico_e_marchio.md) §1.1 e §3 |

### Perche' e' una decisione e non una costruzione

La separazione e' gia' conforme al codice: `getAvatarFrameStyle` non legge il lore, `LevelUpLore` non
legge i frame. La collisione era **solo nei documenti**, dove tutti e tre si chiamavano "tier", e si
era infiltrata in `A7` §5 e in `D10`/`D11`.

La conseguenza dichiarata e' che **la compatibilita' con le note precedenti di `A7`, `D10` e `D11` e'
ufficialmente superata**: se in un documento vecchio "tier" non e' specificato, non e' leggibile.

### Cosa resta da fare nel codice

`frame` e `lore_tier` non hanno un campo: sono funzioni, e il nome giusto sta nel nome della funzione.
`poi.tier` invece **non esiste** e va creato: e' il campo senza il quale la struttura a 4 tier resta
prosa. Resta `D10`, che questa decisione non chiude.

---

## D15 - Nome ufficiale del progetto

| campo | valore |
|---|---|
| **Stato** | `applicata` |
| **Chi decide** | utente |
| **Aperta il** | 2026-09-30 |
| **Esito** | **L.O.T.O. Map (Life On The Outside) Co-Experience** |
| **Prova** | `app.json:3` · `android/app/src/main/res/values/strings.xml:2` · [`A8_lessico_e_marchio.md`](aree/A8_lessico_e_marchio.md) §1.2 |

### Cosa e' stato corretto

Il marchio era in due stati diversi nella stessa app: `expo.name` diceva `LOTO MAP` e le **sei
stringhe di permesso** dicevano `L.O.T.O. HUB` — che sono esattamente le uniche stringhe che l'utente
legge per intero, perché sono i dialoghi di permesso di iOS e Android. Una delle sei aveva anche un
refuso, `L'O.T.O. HUB` (`app.json:27`).

Corretti: `app.json:3` e le sei stringhe, `strings.xml:2`, e una riga nel banner di
`.agents/rules/master_business_brief.md`, che è in `Storico` e non può essere riscritto nel corpo
(`R4` §2).

### Cosa NON e' stato corretto, e perche'

`com.lotohub.app` resta. Il package identifier è un identificativo di installazione: cambiarlo
significa disinstallare l'app su ogni dispositivo e perdere le chiavi di firma. Non è un nome
mostrato, è un indirizzo. Se lo si vuole cambiare è una decisione separata e va pianificata.

**Da notare:** `android/` è in `.gitignore` (`R5`, criterio C12). La modifica a `strings.xml` esiste
solo su disco e non è versionata. Se il disco si cancella, quel nome torna indietro.

---

## Decisioni chiuse al 30/09, e cosa resta aperto

| esito | decisioni | cosa le ha chiuse |
|---|---|---|
| `applicata` | D1, D5, D6, D11, D12, D14, D15 | il codice, o una tua decisione esplicita |
| `parziale` | D4 | 2 blocker su 4; **B3 e B4 restano aperti** |
| `aperta` | D2, D3, D7, D8, D9, D10, D13 | — |

**Cinque decisioni aperte da quattro giorni che dipendono dal cloud**, e che nessuna può chiudere
l'agente: `D9` (`vw_pois_frontend` esiste?), `D10` (campo `poi.tier`), `D13` (canale di sblocco dei
feedback), più `Q17` (`tenants.id` UUID o testo) e `Q26` (`accessibility_mode` BOOLEAN o TEXT).
Sono in `QUERY-CLOUD.md` e `diagnostica-gate-vault.sql`.

**Il fatto che conta, per il metodo:** cinque decisioni erano rimaste aperte perché il codice le
aveva gia' prese senza che nessuno le registrasse. Non è un difetto di chi decide: è il costo di non
avere un registro che venga aggiornato quando il codice si muove. `METODICA.md` §4 e `autorita.json`
esistono per quello.

---

*Registro delle decisioni. Una riga per fase. Un `file:linea` per la fase `applicata`.*
