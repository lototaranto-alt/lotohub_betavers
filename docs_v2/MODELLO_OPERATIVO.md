---
id: MODELLO-OPERATIVO
tipo: analisi
ambito: modello-a-segmenti-cohesione-db-e-catena-di-fatturazione
stato: Vivente
confidenza: Alta
owner: Agent
aggiornato: 2026-09-26
evidenza:
  - supabase/00_SETUP_ADMIN_DASHBOARD.sql:47
  - supabase/migrations/20260822_create_b2b_feedbacks.sql:5
  - .agents/AGENTS.md:24
  - .agents/AGENTS.md:25
  - utils/levelUtils.ts:13
  - app/(tabs)/index.tsx:370
  - supabase/migrations/20260926120000_scan_chain_canonical.sql:132
---

# Modello operativo: segmenti, coesione col DB, catena di fatturazione

> Risponde a: "come si mette in fila tutto, e che cosa produce il primo euro?"

Questo documento e' scritto per una decisione concreta, non per una panoramica. Confidenza `Alta`
sulla parte che riguarda il codice e il DB, `Media` sulla parte di mercato, perche' **non ho
intervistato nessun cliente e nessun partner**. Lo dichiaro: nessun documento di questo archivio
contiene un prezzo, un contratto firmato, o un cliente.

---

## 1. Dove sei davvero

Quattro mesi di sviluppo solo. Zero fatturato. Lo stato reale, senza riordinarlo in meglio:

**Quello che esiste e funziona**
- App React Native/Expo, release **1.0.2** buildata (`com.lotohub.app`, 212 MB), installata
- Progressione: **50 livelli, 5 rank**, soglie in una SSOT unica (`utils/levelUtils.ts`)
- **26 tabelle** e **8 viste DaaS/admin** definite nelle migration
- Gamification e onboarding GPS riscritti e verificati su device
- Dashboard admin DaaS costruita e committata (`bb0fa37`, 1124 righe)
- Il modello di business esiste ed e' coerente: Zero-IoT, Shadow Validation 1%, vendita a
  agenzie, zero-PII

**Quello che manca e blocca la vendita**
| Blocco | Conseguenza economica |
|---|---|
| **La catena di check-in non e' applicata su cloud** (4 blocker, `DECISIONI.md` D4) | **non esiste dato**. E il prodotto venduto e' il dato |
| **`vw_pois_frontend` interrogata e non definita** (`DECISIONI.md` D9) | Home e Mappa potrebbero non ricevere POI. O il dato e' nato fuori da Git |
| **Nessun partner con un tag NFC installato** | **zero check-in reali**. Senza check-in non c'e' ledger, senza ledger non c'e' report |
| **Nessuna agenzia in trattativa** | nessun canale, nessun contratto |
| **Nessun prezzo, nessun contratto tipo** | un dato non vendibile non ha un prezzo |

**Il punto che nessun documento dice esplicitamente:** il Blocco 3 e' il piu' difficile e non e'
tecnico. Il progetto ha previsto che l'NFC fosse **solo per i partner B2B** (criterio C1: nessun NFC
sui monumenti pubblici). Bene. Ma significa che **serve un esercente che metta un tag nel suo
locale**, e questo e' una trattativa commerciale, non una riga di codice.

## 2. Il modello a 5 segmenti

Il progetto ha 4 moduli economici documentati. Li riordino in 5 segmenti operativi, perche' un
modello si misura solo se ogni segmento ha **un'entita' del DB che lo rende osservabile** e
**una metrica che ne dimostra il valore**.

| # | Segmento | Chi paga | Sotto-funzioni | Entita' DB | Metrica che ne dimostra il valore | Stato |
|---|---|---|---|---|---|---|
| **S1** | **Visitatore** (turista/esploratore) | paga lui, in-app | Esplora mappa · Check-in GPS/NFC · Progressione · Sblocco media · Diario | `profiles`, `pois`, `user_pois`, `impact_transactions`, `user_unlocked_media`, `user_itineraries` | **check-in/utente/mese** e km per utente | funzionante a livello di codice, **catena non applicata** |
| **S2** | **Custode / Partner** (esercente) | **freemium + premium** | Esposizione del locale · Check-in dei clienti · Ricezione feedback anonimi · Upgrade per leggerli | `pois` (con `tenant_id`), `b2b_feedbacks`, `impact_transactions` | **conversion rate Freemium -> Premium**, e check-in per locale | tabella esiste, **nessun partner installato** |
| **S3** | **Agenzia / System Integrator** | **licenza Zero-Code** | Modulo Proof of Action ESG da innestare nel loro appalto · Installazione · Supporto | `tenants`, `tenant_associations`, `tenant_localizations` | **licenze attive** + referral | **zero trattative**. Niente listino |
| **S4** | **Corporate turistico** (MSC, Costa, TOperator) | **report DaaS** | Report ESG per CSRD · Heatmap 110m/15min · Flussi per evento | `vw_daas_heatmap_15min`, `vw_daas_esg_monthly`, `vw_daas_event_attendance` | **report venduti** e valore per report | viste scritte, **mai applicate**; nessun cliente |
| **S5** | **Operatore interno** (tu) | — | Lettura dati · Diagnostica · Configurazione tenant | `app_telemetry_events`, `vw_admin_pois`, `vw_admin_checkins_analytics`, `admin_alerts` | — | dashboard **non deployata** |

**La lettura che conta:** S1 e S2 sono **strumenti**, S3 e S4 sono **ricavi**. Quattro mesi di lavoro
sono andati su S1, che e' lo strumento che rende possibili S3 e S4. Non e' tempo perso, ma il
problema e' che **uno strumento senza il canale non fattura**.

**Nota su S4:** e' il segmento con il miglior rapporto fra sforzo e ricavo, perche' il report si puo'
produrre **a mano con una query** senza dashboard, senza app negli store, senza gamification.

## 3. La catena di fatturazione, passo per passo

Ogni passo indica l'entita' che deve esistere. Se un passo non ha la sua entita' popolata, la catena
si ferma li: e' il punto esatto dove misurare se si sta avanzando.

```
utente visita un POI
        |  components/PoiDetailSheet.tsx
        v
[1] check-in validato ........... user_pois  (via scan_poi_gps / scan_poi)
        |
        v
[2] impatto calcolato .......... impact_transactions   <- IL LEDGER. Il bene che vendi.
        |                        (CO2, distanza, token, anti-spoofing)
        v
[3] aggregazione e privacy ..... vw_daas_heatmap_15min / _esg_monthly
        |                        (griglia 110m, bucket 15min, soglia k)
        v
[4] report DaaS ................ CSV / GeoJSON / PDF
        |
        v
[5] vendita a S4 ............... fattura
        |
        v
[6] ritorno in S2/S3 ........... il partner vede il risultato del proprio investimento
```

**Il punto 2 e' tutto il prodotto.** Se `impact_transactions` e' vuota, la catena e' interrotta e
nessuna delle quattro righe dopo puo' accadere. Non e' un dettaglio tecnico: e' la ragione per cui il
check-in deve funzionare prima di ogni altra cosa.

**Il punto 4 e' la notizia buona:** il primo report si fa a mano. Una query aggregata, un foglio di
calcolo, un PDF. **La dashboard admin non serve per la prima vendita.** Serve per la decima.

## 4. Coesione col DB: il contratto che manca

Cinque segmenti, e per ciascuno c'e' un pezzo di coesione che oggi manca. Sono questi i lavori che
**collegano il codice al modello**, non nuove funzionalita'.

| Segmento | Cosa manca | Perche' blocca |
|---|---|---|
| **S1** | `scan_chain_canonical` applicata: 4 blocker aperti (B1-B4) | senza, `user_pois` e `impact_transactions` restano vuote |
| **S1** | `vw_pois_frontend` definita o sostituita | il frontend la interroga: o non esiste, o non e' in Git |
| **S2** | **`is_premium_unlocked` senza destinatario UI** | la colonna esiste ed implementa un funnel di upgrade che **non ha schermo**: il partner non ha dove guardare |
| **S3** | **manca `tenants.licenza`** (o equivalente) | senza, non puoi dire a un'agenzia cosa ha attivato. La multi-tenancy c'e', la **gestione delle licenze no** |
| **S4** | k-anonimita' e griglia decise insieme (`DECISIONI.md` D12) | la privacy e' il rischio legale della vendita |
| **S4** | hardening applicata su cloud | le viste non hanno revoca ad `anon`: non e' un rischio teorico, e' una lettura aperta |
| **S5** | dashboard deployata | il canale per l'agenzia non esiste |

**Il pattern e' chiaro e incoraggiante:** nessuno di questi blocchi e' una feature. Sono **8
condizioni di coesione**, quasi tutte SQL o decisioni. Il lavoro che manca per fatturare non e'
codice, e' aria fra quello che hai scritto e quello che esiste.

## 5. Triangolazione dei competitor

La documentazione cita 5 concorrenti in tutto, con poche righe ciascuno. **La triangolazione che
chiedi non esiste**, ed e' una lacuna da colmare. Quello che si puo' dire adesso:

| Concorrente | Il suo modello | Dove e' vulnerabile | Cosa fa LOTO di diverso |
|---|---|---|---|
| **Pokemon GO** | engagement puro, 4 anelli temporali sovrapposti, rete virale | non monetizza la PA, non produce un bene vendibile al Comune | e' uno **strumento di misura** che produce un ledger certificabile |
| **Foursquare / Pilgrim** | check-in e notifiche | *"uccide la batteria usando costantemente il GPS in background"* (`loto_architecture_patamu_dossier`) | la rampa di primo livello **e' 0-30 XP**: l'utente non e' incentivato a battere il telefono |
| **TripAdvisor** | recensioni pubbliche, UGC | tossicita' e moderazione, il danno commerciale per chi e' valutato | **no recensioni pubbliche**: il feedback e' anonimo e lo legge solo il partner. Il progetto ha chiamato questo "Safe Zone" |
| **Strava** | social sportivo, kudos | nessun uso istituzionale, nessuna vendita al settore pubblico | la **Risonanza** e' il kudos copiato, ma il dato che genera resta anonimo e aggregato |
| **MSC / Costa / TOperator** | compratori, non concorrenti | sono **loro** il cliente (CSRD) | target diretto: report ESG su scala |

**La posizione che regge, e che e' gia' scritta:** l'unica che serve LOTO e' **l'agenzia che ha il
contratto del Comuni e deve vincere un bando Smart City**. Non il Comune, non il competitor
dell'agenzia. Chi ti compete non e' Pokemon GO: e' **l'altra offerta che l'agenzia porta in gara**.

Questo cambia la domanda: non "quanto e' bello LOTO", ma **"cosa offre l'agenzia in piu' con LOTO,
rispetto a quello che ha gia' ?"**. La risposta e': un modulo ESG gia' pronto, zero sviluppo,
zero sensori da installare, e un dato che puo' allegare alla domanda.

## 6. Il percorso critico verso il primo fatturato

Ordinato per **dipendenza**, non per importanza. Ogni riga e' un prerequisito della successiva.

| # | Passo | Perche' in questa posizione | Come si chiude |
|---|---|---|---|
| **P1** | Applicare `scan_chain_canonical` dopo aver chiuso B1-B4 | **se il check-in non funziona, non esiste ledger, e tutto il resto e' inutile** | 4 correzioni SQL, poi applicazione |
| **P2** | Introspezionare `vw_pois_frontend` | se Home e Mappa non caricano i POI, il check-in non e' nemmeno raggiungibile | 2 query |
| **P3** | **Un partner, un tag NFC** | **il passo piu' difficile: non e' tecnico**. Serve un esercente che accetti | una trattativa. Un solo locale basta |
| **P4** | 5-10 check-in reali quel locale | da 0 a un dato **dimostrabile**: entra la catena 1→2 di §3 | test in strada |
| **P5** | Un report a mano, in SQL | **non serve la dashboard**. E' la prova che puoi mostrare a chiunque | una query aggregata, un PDF |
| **P6** | Un'agenzia a cui mostrare P5 | il canale non e' un deliverable: e' una lista di nomi | lista di 20 agenzie, 5 contatti |
| **P7** | Listino e contratto tipo | *"nessun prezzo"* in tutto l'archivio | Rete Doc copre la parte legale |
| **P8** | Deploy della dashboard | diventa utile dalla seconda/dozzina vendita, non prima | push + Vercel |

**Nota di sequenza.** P1 e P2 sono tecnici e sono tuoi. **P3 e P6 non sono tecnici e non puoi
rimandarli**: sono relazioni con persone. Il rischio maggiore dei prossimi due mesi non e' che il
codice resti indietro, e' che P3 e P6 restino fermi mentre P1 si perfeziona.

## 7. Cosa NON serve per la prima fattura

Elencarlo e' utile quanto elencare cosa serve, perche' protegge il tempo:

- **Non serve l'app negli store.** L'AAB e' per la scalabilita' del consumo, non per vendere
- **Non serve la dashboard.** Un report a mano fa il primo cliente
- **Non serve completare la gamification.** I 5 blocker che troverai dopo sono di S1, non di S2/S3
- **Non serve il logo perfetto.** Non serve l'icona del fiore, non serve la barra xp
- **Non servono i 50 livelli di lore.** Il primo cliente non li leggera'
- **Non serve la documentazione definitiva.** Quella la stai facendo, e va bene: e' un asset per
  quando ci saranno altri, ma non e' un prerequisito di fatturazione

**Da non trascurare pero':** la documentazione che stai costruendo adesso (`docs_v2`) e' esattamente
cio' che serve per **onorare un eventuale cliente tecnico** o **un investitore** o **un team esterno**.
Non produce ricavo, produce credibilita'. E' un bene, ma non va misurato in fatture.

## 8. Il rischio vero, detto chiaramente

Quattro mesi, zero fatturato, e tutto il lavoro concentrato su S1. Il rischio non e' che il
progetto fallisca: e' che **resti a costruire lo strumento senza mai aprire il canale**, e che a
dicembre tu abbia un'app migliore e lo stesso saldo. Il codice non genera fatturato: le persone
sì. P3 e P6 sono le due attivita' che non hanno una riga di codice e sono le uniche che sbloccano
tutto.

---

*Modello operativo del 26/09/2026. Confidenza Alta sulla parte codice/DB, Media sulla parte mercato:
nessun cliente e stato intervistato e l'archivio non contiene prezzi ne contratti.*
