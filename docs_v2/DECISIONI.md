---
id: DECISIONI
tipo: decisione
ambito: registro-delle-decisioni-aperte-e-presa
stato: Vivente
confidenza: Alta
owner: utente
aggiornato: 2026-09-26
evidenza:
  - INVENTARIO_DOCUMENTAZIONE.md:104
  - docs_v2/aree/A1_fondazione.md:88
  - docs_v2/aree/A2_gamification.md:110
  - docs_v2/aree/A3_dati_e_sql.md:118
  - docs_v2/aree/A4_dashboard_daas.md:104
  - docs_v2/aree/A6_commerciale.md:96
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
| D1 | Quale dei quattro "SSOT" sopravvive | `aperta` | la struttura della documentazione | A1 |
| D2 | Dove vanno i 7 file .md della root del repo | `aperta` | la deduplica e l'indice | A1 |
| D3 | `knowledge_recovery_guide.md` ha 3 link rotti | `aperta` | la guida per una sessione nuova | A1 |
| D4 | Applicare ora i 4 blocker della catena canonica, o registrarli come debito | `aperta` | il check-in end-to-end | A3 |
| D5 | Lo scan NFC da solo deve funzionare? | `aperta` | la validazione del tag | A3 |
| D6 | Il check-in accredita PTI? | `aperta` | l'economia del civismo | A3 |
| D7 | Il cap di 3 carte anti-flood: obbligo o design? | `aperta` | la qualita' della progressione | A2 |
| D8 | Le 3 direzioni commerciali di A6 | `aperta` | la vendita | A6 |
| D9 | `vw_pois_frontend` esiste nel cloud o manca? | `aperta` | Home e Mappa, e la riproducibilita' dell'ambiente | A7 |
| D10 | S1-S2: struttura di validazione a 4 tier + campo `poi.tier` | `aperta` | la scalabilita' della struttura finale | A7 |
| D11 | S3: `rank` e tier narrativo sono due cose distinte? | `aperta` | ogni rename futuro dei rank | A7 |
| D12 | S4: griglia 110 m e soglia k-anonimita' sono complementari? | `aperta` | la vendita del dato e il rischio legale | A7 |
| D13 | Come il partner sblocca i feedback Echo: su WhatsApp o su dashboard? | `aperta` | il funnel di upgrade dell'unico ricavo ricorrente del merchant | DOCTRINA-ECHO |

---

## D1 - Quale dei quattro "SSOT" sopravvive

| campo | valore |
|---|---|
| **Stato** | `aperta` |
| **Chi decide** | utente |
| **Aperta il** | 2026-09-26 |
| **Blocca** | qualsiasi altra riorganizzazione documentale: finche' 4 documenti si dichiarano la SSOT, ogni nuova sessione li legge in ordine diverso |

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
| **Stato** | `aperta` |
| **Chi decide** | utente |
| **Aperta il** | 2026-09-26 |
| **Blocca** | il check-in end-to-end, quindi la release 1.1.0 e la certificazione dei report |

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
| **Stato** | `aperta` |
| **Chi decide** | utente |
| **Aperta il** | 2026-09-26 |
| **Blocca** | la validazione del tag NFC. E' una decisione di prodotto, non tecnica |

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
| **Stato** | `aperta` |
| **Chi dice** | utente |
| **Aperta il** | 2026-09-26 |
| **Blocca** | l'economia del civismo e il senso del token |

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
| **Stato** | `aperta` |
| **Chi decide** | utente |
| **Aperta il** | 2026-09-26 |
| **Blocca** | ogni rename futuro |

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
| **Stato** | `aperta` |
| **Chi decide** | utente |
| **Aperta il** | 2026-09-26 |
| **Blocca** | la vendita del dato DaaS e l'esposizione legale |

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

## Decisioni prese, in attesa di applicazione al codice

*(Nessuna al 26/09. Le prime tre fasi servono a rendere visibile la differenza fra una decisione
presa e una decisione eseguita: il registro non promette nulla, mostra cosa manca.)*

---

*Registro delle decisioni. Una riga per fase. Un `file:linea` per la fase `applicata`.*
