---
id: FORMA-DEFINITIVA
tipo: analisi
ambito: forma-definitiva-dell-app-e-dello-sviluppo-percorso-al-primo-euro
stato: Vivente
confidenza: Alta
owner: Agent
aggiornato: 2026-09-26
evidenza:
  - docs_v2/MODELLO_OPERATIVO.md:1
  - docs_v2/MODELLO_PREDITTIVO.md:1
  - docs_v2/BRIEFING-AGENTE.md:1
  - docs_v2/PianoOperativo-26-09.md:1
---

# La forma definitiva

> Scopo di questo documento: dire **che forma ha il progetto e come si arriva al primo euro**,
> a partire dall'unica cosa che sappiamo essere vera — *l'app ha parti funzionanti e si avvia
> esattamente come l'hai codificata*.

Non è un piano di feature. È la riduzione di ciò che hai a quattro mesi di lavoro down a ciò che
manca davvero.

---

## 1. L'ancora, e perché è più forte di tutta la documentazione

Hai detto: *«l'unica verità che conosco è che l'app sembra abbia parti funzionanti e si avvia
correttamente per come l'avevo codificata»*.

Questo non è un resoconto modesto. È **l'evidenza di massima autorità disponibile**, e per la
gerarchia del `MODELLO_PREDITTIVO` sta sopra l'archivio, sopra i documenti e sopra qualsiasi
analisi automatica. Per il criterio **C8** ("il codice batte il documento") l'eco più forte è
l'app in funzione, non il sorgente.

Tre conseguenze operative, che ribaltano la sensazione di disordine:

1. **Non c'è un'app da rifare.** C'è un'app che funziona e ha intorno un perimetro non dichiarato.
2. **Il disordine che senti non è nel codice.** È fra tre cose che nessuno ha collegato: il DB che
   gira, i documenti che descrivono il DB, e le tue scelte di prodotto.
3. **Il lavoro non è andato perso.** È andato avanti senza essere dichiarato. È un problema di
   scrittura, non di sostanza.

Da qui in poi costruisco tutto su questa base.

---

## 2. La diagnosi in una riga

Quattro mesi di sviluppo concentrati su **S1, lo strumento**. Il ricavo sta in **S3 e S4**, e per
arrivarci manca una cosa sola: **che l'aria fra quello che hai scritto e quello che esista venga
chiusa.**

Quell'aria ha una dimensione misurabile. Sono **otto condizioni di coesione**
(`MODELLO_OPERATIVO` §4), più **una riga di codice difettosa** che ogni giorno crea nuovi buchi
(§5 qui sotto: il Deep Recovery in `app/_layout.tsx`). Otto più uno, non ottantuno.

---

## 3. Tre strati, e basta

La forma definitiva è fatta di tre strati. Ogni attività, ogni decisione, ogni task va in uno dei
tre. Se non sta in nessuno, non va fatto.

```
┌──────────────────────────────────────────────────────────────┐
│  STRATO 3 — IL CANALE                                       │
│  Un partner con un tag. Un'agenzia con un bando.             │
│  Non è codice. È l'unica cosa che genera denaro.             │
├──────────────────────────────────────────────────────────────┤
│  STRATO 2 — LA CATENA                                        │
│  Le 8 condizioni di coesione fra app, DB e modello.          │
│  Quasi tutte SQL o decisioni. Il vero backlog.               │
├──────────────────────────────────────────────────────────────┤
│  STRATO 1 — IL BANCO DI PROVA                                │
│  Ciò che è dimostrabilmente funzionante.                     │
│  Non si tocca, non si rifattorizza, non si "migliora".       │
└──────────────────────────────────────────────────────────────┘
```

### Strato 1 — Il banco di prova (protetto)

Da quanto verificato oggi, **funziona**:

| Cosa | Prova |
|---|---|
| L'app si avvia ed è coerente col repo | bundle del device = 14.856.404 byte, identico a quello ricostruito |
| Home e mappa ricevono i POI | `vw_pois_frontend` esiste e risponde con righe reali |
| Metriche e rituali quotidiani | `vw_user_dashboard_metrics` risponde |
| Scansione in strada, con XP e avanzamenti | test tuo, riferito più volte |
| Progressione 50 livelli / 5 rank | soglie in `utils/levelUtils.ts` |
| Onboarding GPS e sensori | permessi concessi, hardware gate riscritto |

**Regola dello strato 1: nessuna refactor, nessuna "miglioria", nessun rinnovamento finché lo
strato 2 non è vuoto.** È il principio che tiene insieme la tua sanità mentale più di qualsiasi
altro: la parte che funziona smette di essere un argomento aperto.

### Strato 2 — La catena (il vero backlog)

| # | Condizione | Tipo | Stato |
|---|---|---|---|
| 1 | `scan_chain_canonical` applicata (B1–B4 chiusi) | SQL | non applicata |
| 2 | `vw_pois_frontend` in Git | SQL | **fuori da Git**, funziona |
| 3 | `vw_collective_impact` in Git | SQL | **fuori da Git**, funziona |
| 4 | hardening applicata (revoca ad `anon` sulle viste DaaS) | SQL | **indeterminata** |
| 5 | check-in che accredita PTI | decisione | aperta (D6) |
| 6 | NFC: decide se il tag basta da solo | decisione | aperta (D5) |
| 7 | `is_premium_unlocked` ha uno schermo | UI | manca |
| 8 | k-anonimità + griglia 110 m, con il valore di k | decisione | aperta (D12) |

Otto voci. **Sei sono SQL o decisioni, non codice.** Il lavoro che ti manca per fatturare è
soprattutto *aria*, non programmazione.

### Strato 3 — Il canale (fuori dalla mia portata, dentro la tua)

Un esercente che metta un tag nel suo locale. Un'agenzia che abbia un bando Smart City. Sono
relazioni con persone e **nessun agente può farle al posto tuo**. È qui che il progetto vince o
perde, e non ha una riga di codice.

---

## 4. Il percorso al primo euro, ridotto all'osso

`MODELLO_OPERATIVO` §7 elenca cosa **non** serve. Applicandolo, il percorso si riduce a cinque
passi, e tre sono di un pomeriggio:

| # | Passo | Che cosa serve davvero | Chi lo fa | Tempo |
|---|---|---|---|---|
| **1** | Chiudi B1–B4 e applichi la scan chain | 4 correzioni SQL, poi applicazione | io + tu | ~1 giorno |
| **2** | Porti in Git le due viste orfane | `pg_get_viewdef` + 1 migration | io + tu | ~2 ore |
| **3** | **Un partner, un tag NFC** | una telefonata a un esercente di Taranto | **solo tu** | una settimana |
| **4** | 5–10 check-in reali in quel locale | il test in strada che hai già fatto | tu | una giornata |
| **5** | Un report a mano, in SQL | una query aggregata + un PDF | io + tu | poche ore |

**Il passo 5 non richiede la dashboard admin.** Un report aggregato a mano è la prova che puoi
mostrare a chiunque, e la dashboard serve dalla decima vendita, non dalla prima.

**Da qui la forma definitiva, in una frase:** il primo euro si chiude con un giorno di SQL, due
ore di migration, una telefonata a un negoziante e una giornata in strada. Non con l'app negli
store, non con la dashboard, non con i 50 livelli di lore.

---

## 5. L'identità: il modello è giusto, l'implementazione ha un buco

**Correzione rispetto alla prima stesura di questo documento.** Avevo trattato l'utente anonimo
come un difetto e la stabilità dell'identità come la decisione mancante. **Era sbagliato.**

L'utente anonimo è il progetto: Zero-PII è un principio architetturale (`AGENTS.md`, criterio C5) e
va mantenuto. E il meccanismo che rende l'anonimato **continuo senza PII esiste già, ed è
implementato**: il **L.O.T.O. Pass**. Il QR del Pass è l'identificatore pseudonimo stabile, e
`recover_loto_pass(recovery_code)` è la funzione che ricongiunge l'utente al proprio storico.
Esistono anche `validate_ntag424_sdm` per il tag NFC, il flusso di scelta del nome, e
`files/loto_vault` sul device come deposito locale. Il modello è **completo e corretto**.

Il problema non è il modello. È che **esistono due meccanismi di identità, e quello automatico
vince su quello progettato.**

| Meccanismo | Dove | Tipo | Effetto |
|---|---|---|---|
| **L.O.T.O. Pass** | `components/LotoPassRecoveryScanner.tsx` → `recover_loto_pass` | **manuale, progettato** | ricongiunge l'utente al suo storico |
| **Deep Recovery** | `app/_layout.tsx:88-94` | **automatico, su errore transitorio** | `AsyncStorage.clear()` + UUID nuovo |

Il Deep Recovery parte da `catch` su **qualsiasi** errore del primo tentativo di autenticazione —
inclusa una semplice interruzione di rete — e fa tre cose distruttive in sequenza:

1. `AsyncStorage.clear()` — spazza **tutto** il locale: progressione, beacon BLE, contesto
   mobilità, riferimenti al Pass, e anche il flag `loto_onboarding_seen` (da cui l'onboarding
   ricompaia).
2. `supabase.auth.signOut()`.
3. `signInAnonymously()` — **nuovo UUID**, che rende orfani nel DB tutti i check-in e le voci di
   ledger già accumulate sotto l'identità precedente.

E c'è un bug che rende il tutto peggiore di quanto sembri, alla riga 76:

```js
await AsyncStorage.removeItem('supabase-auth-token');   // chiave sbagliata: non rimuove nulla
```

supabase-js salva la sessione sotto `sb-<ref>-auth-token` (sul device:
`sb-fsuolbwsvpgiglwcaffh-auth-token`, verificato leggendo il database locale). La chiave
`supabase-auth-token` **non esiste**: la rimozione è un no-op. La riga 77 crea comunque un utente
anonimo nuovo. Il codice crede di aver ripulito lo stato e invece **produce un'orfanino**.

C'è anche un secondo ingresso, più silenzioso: alle righe 72-79, se il profilo non esiste
(`PGRST116`), il codice esce comunque dalla sessione e rientra anonimo. **Una riga di profilo
mancante è sufficiente a far perdere lo storico**, senza che nessun meccanismo di recupero
venga coinvolto.

### Perché questo spiega i cinque UUID

I cinque `profile_id` distinti che ho trovato in AsyncStorage sono la firma di questo ciclo:
ogni Deep Recovery lascia un UUID abbandonato. Sono cinque identità che l'utente ha avuto, e
probabilmente cinque set di dati che non vede più.

Il fatto che sia successo più volte suggerisce che il trigger non è un evento raro: probabilmente
è la rete mobile. Significa che **ogni volta che l'app ha faticato a ottenere la sessione, ha
perso dati** — e l'utente ha potuto interpretarlo come un normale stato vuoto, perché l'app si
presenta comunque come un nuovo utente.

### Nota di metodo, con un avvertimento

Ho scoperto che la mia stessa strategia diagnostica (interrogare il cloud usando il refresh token
del device) **brucia quel token**: Supabase lo ruota a ogni uso, il device lo conserva scaduto, e
alla prima scadenza l'app non riesce a rinnovare la sessione ed entra in Deep Recovery. Ho
interrotto quel metodo prima di causare danni. È anche la misura di quanto sia seria la riga 89.

**La correzione, in una riga:** l'identità non va decisa, va **riparata**. Il modello è giusto;
a farlo fallire è una riga di gestione errori che non ha niente a che fare con l'identità.

---

## 6. Ottimizzare la struttura del codice

Tre difetti strutturali, tutti con prova, e nessuno dei tre è un problema di stile.

### 6.1 Il contratto frontend ↔ database non è dichiarato da nessuna parte

Tre istanze confermate, non tre sospetti:

| Oggetto | Usato da | Definito in |
|---|---|---|
| `vw_pois_frontend` | Home, Mappa | **nessuna migration** (pannello web) |
| `vw_collective_impact` | Community, Home | **nessuna migration** (pannello web) |
| `scan_poi_gps` | `PoiDetailSheet`, `OfflineQueueManager` | migration non tracciata, mai applicata |

È la violazione ripetuta del criterio **C11** che ho proposto in `PianoOperativo-26-09.md §8`. Il
rimedio non è un altro documento: è che **ogni oggetto che il frontend interroga debba avere una
migration che lo crea**, e che la catena di applicazione sia verificabile con un test.

### 6.2 I fallback leggono chiavi che non esistono

`app/(tabs)/index.tsx` legge `loto_fallback_xp`, `loto_fallback_tokens`, `loto_fallback_pois` con
`multiGet`. **Nessuna delle tre esiste** sul device. Il percorso è
`fallbackXp: fbXp ? parseInt(fbXp) : 0`, quindi oggi produce `NaN` o `0` a seconda del ramo.

Non è un difetto di logica. È la prova che **il fallback offline non è mai stato esercitato**,
perché è nato insieme all'app e non è mai stato usato. Va testato, non riscritto a occhio.

### 6.3 Il frontend calcola ciò che dovrebbe calcolare il DB

Criterio **C3**: *"il DB è la SSOT, il frontend non calcola"*. È la ragione per cui l'ordine
`schema prima, client dopo` non è una preferenza di stile: patchare il frontend prima dello schema
costruisce il **fallback silenzioso** — non crasha, non fa nulla, e non lascia traccia.

---

## 7. La forma dell'app quando è finita

Dalle leve strutturali (`docs_v2/aree/A7_struttura_esperienza.md`) e dai vincoli C1–C10, la forma
non è ambigua:

- **Tab bar ridotta all'inizio.** Tre sezioni, non sette. Ogni sezione in più al LV1 è un costo di
  comprensione per un utente che ha ancora zero dati.
- **Progressive disclosure sui livelli, mai sui POI.** I POI si consultano sempre; i media si
  sbloccano. È la regola che tiene insieme C6 e la libertà di esplorare.
- **Il rito quotidiano è il motore di ritenzione**, non la mappa. È l'unico motivo per cui un
  utente torna, e non richiede dati, partner né canale.
- **Il successo di un POI non è la ricompensa, è la prova** che il sistema ha misurato qualcosa.
- **Il partner non ha una dashboard.** Ha un bot. Se il primo posto in cui incontra LOTO è una
  schermata web, il messaggio «non ti serve un software» è già perso (D13).
- **Zero-PII ovunque**, e questo è ciò che rende vendibile il dato.

---

## 8. Cosa non serve, detto una volta sola

Per difenderti dal tempo che è il vero costo di questo progetto:

- **L'app negli store.** L'AAB è per la scalabilità del consumo, non per vendere. E i crediti EAS
  riprendono a ottobre.
- **La dashboard admin.** Il primo report si fa a mano. La dashboard serve dalla decima vendita.
- **Completare la gamification.** I 5 blocker che troverai dopo sono di S1.
- **Il logo perfetto.** Non serve l'icona del fiore né la barra XP.
- **I 50 livelli di lore.** Il primo cliente non li leggerà.
- **La documentazione definitiva.** È un asset per quando ci saranno altri, non un prerequisito.

Quello che invece va tenuto: la documentazione che stai costruendo serve a **onorare un cliente
tecnico, un investitore o un team esterno**. Non produce ricavo, produce credibilità. È un bene,
ma non va misurato in fatture.

---

## 9. Il rischio vero

Quattro mesi, zero fatturato, tutto il lavoro su S1. Il rischio non è che il progetto fallisca: è
che **a dicembre tu abbia un'app migliore e lo stesso saldo**, perché P3 e P6 sono fermi mentre P1
si perfeziona.

Il codice non genera fatturato. Le persone sì. Questo documento serve a una cosa sola: farti
vedere che la distanza dal primo euro è molto più piccola di come appare, e che dipende da una
telefonata più che da una migration.

---

## 10. Le decisioni che spettano a te

L'identità **non è più tra queste**: è già stata progettata e va solo riparata (§5). Restano tre
decisioni di prodotto, in ordine di dipendenza. Nessuna è tecnica.

| # | Decisione | Perché prima delle altre |
|---|---|---|
| **1** | **Il check-in accredita PTI?** (D6) | Cambia il significato del segnale: è la differenza fra "l'utente ha toccato una cosa" e "l'utente ha generato valore per un territorio" |
| **2** | **Il tag NFC da solo vale?** (D5) | Cambia la firma delle funzioni: va deciso prima che la catena di scansione venga scritta, non dopo |
| **3** | **Il valore di k nell'anonimato** (D12) | È la soglia che rende il report vendibile a un'agenzia. Un numero, ma va scelto con criterio legale |

## 11. L'ordine è sbagliato, e me ne accorgo ora

Nella prima stesura ho messo il canale al primo posto. **Hai ragione a respingere quella logica:**
non si può chiedere a un esercente di fidarsi di un sistema mentre non è chiaro se conserva i dati
o li perde al primo errore di rete. Vendere, prima di aver chiuso la struttura, significa esporre
un difetto a qualcuno che non ha modo di valutarlo.

Quindi l'ordine è invertito, ed è il tuo ordine a essere giusto:

1. **Chiudere la struttura.** Riparare il Deep Recovery, versionare le viste, applicare la catena
   di scansione.
2. **Poi il canale.** Solo quando è difendibile.

Il blocco di lavoro corrispondente è in `ULTIMO-MIGLIO-BLOCKS.md`.

---

*Costruito su `MODELLO_OPERATIVO` §2, §4, §6, §7, `MODELLO_PREDITTIVO` §2, `BRIEFING-AGENTE` §2–§4,
e sullo stato verificato in `PianoOperativo-26-09.md`. Confidenza Alta sulla parte codice/DB, Media
sulla parte mercato: nessun cliente è stato intervistato e l'archivio non contiene prezzi né
contratti.*
