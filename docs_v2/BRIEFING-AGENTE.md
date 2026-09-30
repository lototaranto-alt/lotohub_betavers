---
id: BRIEFING-AGENTE
tipo: analisi
ambito: pacchetto-di-ingresso-per-un-agente-che-si-sincronizza
stato: Vivente
confidenza: Alta
owner: Agent
aggiornato: 2026-09-26
evidenza:
  - .agents/AGENTS.md:1
  - docs_v2/regole/R5_criteri_di_scelta.md:1
  - docs_v2/MODELLO_OPERATIVO.md:1
  - docs_v2/aree/A7_struttura_esperienza.md:1
---

# Briefing per un agente che si sincronizza su L.O.T.O. Map

> **Come si usa.** Non leggere i 22 documenti di `docs_v2/`. Leggi questo, poi apri **solo** i due
> documenti indicati in §7 per il tema che ti interessa. Questo file esiste per una ragione precisa:
> quattro agent hanno gia' lavorato su questo progetto e ognuno ha riproposto cose che erano state
> **scartate con motivazione**. Il rischio non e' lavorare male: e' rifare il lavoro gia' fatto.

---

## 1. Cos'e' L.O.T.O. Map, in dieci righe

App React Native/Expo (iOS + Android, parita' di funzioni) per la **riscoperta turistica e
culturale** di un territorio. Il modello non e' "un'app con utenti": e' **un sensore passivo che
produce un dato vendibile**.

- **Il dato** e' l'impatto territoriale anonimizzato: flussi, km, CO2 risparmiata, eventi
- **Il prodotto venduto** e' l'infrastruttura TSaaS, non il software: griglia 110 m, bucket 15 min,
  report GeoJSON per agenzie che hanno gia' i contratti dei Comuni
- **Il cliente pagante** sono le **agenzie dati e turismo**, non i Comuni e non i singoli locali
- **Zero-IoT**: nessun sensore da installare per il Comune. Solo geofencing GPS e tag NFC, e **il
  NFC solo dove c'e' un partner** (mai sui monumenti pubblici)
- **Zero-PII**: nessuna email, nessun nome, nessun telefono. L'unico backup e' un QR salvato in
  galleria (il L.O.T.O. Pass)
- **Check-in via GPS/NFC** -> ledger immutabile `impact_transactions` -> aggregazione -> report
- **Gamification**: 50 livelli, 5 rank da 10. E' **strumento di ritenzione**, non il prodotto
- **Il partner non ha dashboard**: interagisce col bot WhatsApp (Zero-UI)
- **Il dato ambientale si calcola in locale** (coefficienti ISPRA/DEFRA) con campionamento API
  esterno all'1%: autorvolezza scientifica a COGS zero
- **Nessuna recensione pubblica e nessun upload utente**: il feedback e' anonimo e privato, e il
  partner lo sbloccola col Premium

## 2. I dieci criteri: non negoziabili, non si ritoccano

Ricavati dalle rinunce effettivamente prese, non dalle dichiarazioni. Se una proposta ne viola
uno, va rifiutata per criterio, non discussa.

| # | Criterio | Test rapido |
|---|---|---|
| **C1** | La rinuncia batte l'aggiunta | *"richiede hardware, registrazione obbligatoria o viola la privacy?"* -> **no** |
| **C2** | Costo marginale zero | *"quanto costa in scala?"* -> deve essere ~0 |
| **C3** | Il DB e' la SSOT, il frontend non calcola | nessuna formula di business in un componente |
| **C4** | Zero-Coercion | nessuna classifica, nessun PvP, nessun mayorship |
| **C5** | Zero-PII e' vincolo architetturale | se serve PII, si progetta diversamente |
| **C6** | Progressive disclosure sui **livelli**, mai sui **POI** | i POI sono sempre consultabili |
| **C7** | Il cliente e' l'agenzia, mai il Comune | interlocutore diretto = chi ha il contratto |
| **C8** | Il codice batte il documento | in caso di conflitto, vince il codice |
| **C9** | Niente segreti nei nomi | niente Bronzo/Argento/Oro/Platino |
| **C10** | Un argomento, una casa | nessuna duplicazione fra documenti |

## 3. Decisioni gia' chiuse: NON riaprire

Chiudere queste richieste fa perdere settimane. Sono chiuse con una motivazione esplicita.

| Decisione | Motivo |
|---|---|
| **Backup solo QR, niente email/password** | rimosso il 21/09. *"per mantenere l'app purissima, velocissima e inattaccabile dal punto di vista legale sulla privacy"* |
| **Nessuna recensione pubblica** | tossicita' e danno commerciale al partner che paga. Sostituita dal feedback anonimo privato |
| **Nessuna classifica** | `technical_business_analysis` la propose, il Masterplan "CONGELATO" la respinse |
| **NFC solo sui POI partner** | sui monumenti pubblici e' un collo di bottiglia hardware. Tolto: *"L'NFC rimarra' un'esclusiva per i B2B Partner"* |
| **50 livelli, 5 rank da 10** | 4 documenti dicevano 3, 4, 5 o 10 tier. Il codice ne ha 5. I documenti sono superati |
| **POI mai gated da XP** | decisione esplicita. L'unico gate per livello e' sui **media** |
| **Nessun polling** | consumo batteria + criteri di validazione degli store. Feed solo al mount e al focus tab |
| **Suoni esclusi dalla release** | tenere solo haptics |
| **Marchio LOTO MAP** | ribranding deciso il 15/09, non importato in `docs/`. **Tutto ciò che dice "LOTO HUB" e' vecchio** |
| **Eco-Passi, non Sincro-Avventura** | l'app misura km, non passi |
| **VIAGGIATORE, non Esploratore** | "Esploratore" e' il Rank 2. La collisione aveva costretto la rinomina |

## 4. Le cinque trappole: sembrano disponibili, non lo sono

Sono state **descritte con sicurezza** nella documentazione, alcune marcate "[x] VERIFICATO", e non
esistono. Implementarle e' il modo piu' rapido per costruire il prodotto sbagliato.

| Trappola | Perche' e' una trappola |
|---|---|
| **`vw_collective_impact`** | **non e' definita da nessuna parte** (0 in tutto `supabase/`), ma il frontend la interroga in `community.tsx:99` e `index.tsx:451`, e un commento nel codice la chiama *"la SSOT"* |
| **`vw_pois_frontend`** | esiste, ma **solo in `archive_scattered_sql/` e `pure_cloud_queries/`: zero in `migrations/`**. Usata da `map.tsx:131` e `index.tsx:370`. Il fix non e' scriverla: e' **migrarla in una migration canonica** |
| **`scans`, `loto_squads`, `crowd_predictions`, `poi_ble_fingerprints`** | mai esistite. Nessuna definizione in alcuna migration |
| **"10 Tier certificati"** | nessun codice corrisponde. Ci sono 5 rank da 10. E' naming impreciso |
| **Classifica di Condotta, L.O.T.O. Nodes, Shadow-Sync mesh** | proposte e respinte. Due delle tre killer feature **violano Zero-IoT** |

## 5. Dove il progetto puo' intervenire davvero

Non e' tutto da rifare. **Cinque leve strutturali aperte**, ciascuna con la decisione che la sblocca:

| Leva | Domanda aperta | Dove |
|---|---|---|
| **Validazione POI** | si adotta la struttura a **4 tier** (L1 innesco B&B / L2 popolamento OSM a costo zero / L3 mappatura civica / L4 monetizzazione NFC)? | `A7` §2 |
| **Il campo `poi.tier`** | senza, la 4-tier resta una prosa | `DECISIONI.md` D10 |
| **`rank` vs tier narrativo** | sono due nomi diversi per lo stesso intervallo 1-10. Vanno distinti? | `DECISIONI.md` D11 |
| **Privacy del dato venduto** | griglia 110 m e soglia k-anonimita': alternative o complementari? | `DECISIONI.md` D12 |
| **Tab bar** | quante sezioni visibili al LV1. Tre documenti, tre risposte diverse | `A7` §3 |

E i **cinque segmenti** con il loro stato: Visitatore (strumento), Custode/Partner (strumento,
converte), Agenzia (ricavo, zero trattative), Corporate turistico (ricavo, zero clienti), Operatore
interno. Dettaglio in `MODELLO_OPERATIVO.md` §2.

## 6. Cosa questo briefing NON sa

Dichiararlo evita di costruirci sopra:

- **Nessun prezzo e nessun cliente.** L'intero archivio (579 documenti) non contiene un listino, un
  contratto o un cliente. La triangolazione dei competitor copre 5 concorrenti in poche righe: e' un
  tavolo, non uno studio
- **Il DB cloud non e' stato interrogato.** Tutto lo schema viene dal codice del repo. Il caso delle
  due viste (§4) si risolve solo con due query
- **Il percorso critico verso il primo fatturato non e' di codice.** P3 e P6 di `MODELLO_OPERATIVO`
  §6 sono trattative con persone: un partner e un'agenzia. Il codice non genera fatturato

## 7. I due documenti da aprire, per tema

| Se ti interessa... | Apri |
|---|---|
| modello di business, segmenti, catena di fatturazione, percorso critico | **`MODELLO_OPERATIVO.md`** |
| che forma deve avere l'app, leve strutturali, opzioni | **`aree/A7_struttura_esperienza.md`** |
| la dottrina del feedback privato e i suoi tre livelli | **`DOCTRINA-ECHO.md`** |
| perche' un documento e' affidabile e uno no | `INVENTARIO_DOCUMENTAZIONE.md` |
| cosa hanno voluto dire i 579 documenti sparsi | `RICOSTRUZIONE.md` |
| perche' il codice batte il documento | `regole/R2_evidenza_e_verdetto.md` |

## 8. Gli strumenti

```powershell
# struttura: frontmatter, ambiti univoci, link, orfani
python docs_v2\tooling\validate.py

# coerenza fra cio' che i documenti dicono e cio' che esiste
python docs_v2\tooling\verifica_coerenza.py

# rigenera l'indice
python docs_v2\tooling\build_manifest.py
```

**`verifica_coerenza.py` segnala 5 oggetti inesistenti e 1 solo-in-archivio.** Non sono bug dello
strumento: sono i risultati di §4. Non correggerli e non implementarli.

---

*Briefing del 26/09/2026. Se un altro agente produce una proposta, il test da applicarle e' una
sola domanda: **viola uno dei dieci criteri?** Se no, la proposta e' legittima anche se contraddice
un documento, perchei documenti sono superati dal codice (C8).*
