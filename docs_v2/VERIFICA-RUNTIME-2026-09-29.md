---
id: VERIFICA-RUNTIME-2026-09-29
tipo: analisi
ambito: verifica-runtime-reale-e-su-dispositivo
stato: Vivente
confidenza: Alta
owner: Agent
aggiornato: 2026-09-29
evidenza:
  - app/_layout.tsx:88
  - context/TenantContext.tsx:245
  - supabase/migrations/20260926120000_scan_chain_canonical.sql:157
---

# Verifica runtime del 29/09/2026

> Il primo test su dispositivo della storia del progetto. Fino a oggi nessuna delle affermazioni
> scritte in `docs_v2/` aveva visto l'app funzionare: erano tutte letture di codice e risposte del
> cloud. Qui il metro cambia — un quarto delle osservazioni è **misurata**, il resto no.
>
> Metodo e perimetro in §6. Quello che **non** è stato verificato è elencato in §5, ed è la parte
> importante: questo giro ha chiuso un buco, non li ha aperti tutti.

---

## 1. Il risultato che conta: `A3-T13` è verificato, non più sperato

**Prima dell'era**, dal solo codice: `AsyncStorage.clear()` non esiste più da nessuna parte, e il
ramo di errore di `app/_layout.tsx:88` entra in modalità offline mantenendo l'identità. Era una
lettura, non una prova.

**Ora è una misura.** Il telefono è stato messo offline davvero (Wi-Fi e dati disattivati via
`svc`), l'app riavviata, e lo stato locale letto prima e dopo.

| | prima | dopo |
|---|---|---|
| `user_id` | `9f22d449-1054-42ee-8cce-dc77dd50b8df` | **identico** |
| `created_at` | `2026-09-29T17:44:09Z` | **identico** |
| UUID distinti in AsyncStorage | 5 | **5** |
| chiavi totali in AsyncStorage | 13 | **13** |
| `loto_profile_missing` | assente | assente |

E il ramo di errore ha **realmente eseguito**, non è stato solo dedotto:

```
WARN  [Auth] Sessione non disponibile, avvio in modalita offline: TypeError: Network request failed
```

Quindi: l'app ha perso la rete, ha stampato esattamente il warn previsto, ha **mantenuto
l'identità**, non ha creato un account nuovo e non ha cancellato nulla. Il ciclo di profili
abbandonati che il Blocco 0 descriveva **non si riproduce**.

**Perché conta più di un test verde.** Il difetto non era "l'app non funziona offline". Era
"l'app funziona offline e intanto distrugge il tuo account". È il tipo di buco che nessun test
automatico avrebbe catturato, perché richiede che la rete cada *proprio* nel ramo di errore.

**Confermato anche a monte:** lo stato locale contiene **5 UUID distinti**, coerente con i cinque
`profile_id` abbandonati trovati il 26/09. Sono la firma di cicli avvenuti **prima** del fix. Il
contatore non sale più: è la fine del sintomo.

---

## 2. Due difetti nuovi, trovati solo perché l'app è stata avviata

### 2.1 `Invalid Refresh Token: Already Used` — a ogni avvio, anche online

```
ERROR  [AuthApiError: Invalid Refresh Token: Already Used]
```

Compare a **ogni** avvio, con rete perfettamente funzionante. Un refresh token Supabase vale una
volta sola: se viene usato due volte, il secondo tentativo viene rifiutato. Qui viene rifiutato
**perché è già stato usato**, non perché la rete sia caduta.

**Perché è più interessante di quanto sembri.** L'app non se ne accorge: ha un `access_token`
ancora valido (scadenza a 18:44 UTC, sessanta minuti dopo la creazione dell'utente), quindi
prosegue come se nulla fosse. L'errore è **rumore che maschera un problema vero**: quando
l'access token scadrà, il refresh fallirà per la ragione sbagliata, e la catena di fallback non
è mai stata esercitata in condizioni sane.

**Non è diagnosticato a fondo.** Due ipotesi restano aperte e servono entrambe le query cloud:
se esistono più client Supabase in concurrenti che ruotano lo stesso token, oppure se un token
rotato viene riscritto due volte in AsyncStorage. Non ho prove per scegliere. La seconda è la più
economica da verificare e la prima è quella che fa danno.

### 2.2 `Tenant resolution error:` con messaggio vuoto

```
ERROR  Tenant resolution error:
```

In `context/TenantContext.tsx:245` il `catch` fa `console.error('Tenant resolution error:', err)`
e l'oggetto `err` è un `TypeError: Network request failed` **con `message` vuota**. L'errore viene
inghiotto e l'app continua, quindi non è un crash: è un difetto di **diagnosabilità**.

**Perché lo metto in lista.** È la stessa firma degli altri 20 difetti di questa raccolta, alla
scala più piccola: l'app fallisce e non lascia nulla con cui capire perché. Un gestore ticket che
legga quel log non può distinguere un timeout da un DNS da un airplane mode. Il rimedio è banale
e vale per tutti i punti: quando un `err` ha messaggio vuoto, registrarne tipo e `cause`.

### 2.3 `loto_vault` è vuota — conferma `A5-T8`

La cartella `files/loto_vault/` esiste sul dispositivo ed è **completamente vuota**, nemmeno un
file temporaneo. Questo conferma per via indiretta quanto sospettato in §3 dell'audit: la coda
offline non è mai stata inizializzata, quindi non ha mai scritto niente. `A5-T8` era dedotto
dall'assenza di chiamate a `init()`; adesso è confermato dallo stato del filesystem del telefono.

---

## 3. Cosa ha confermato la documentazione

Il round non ha prodotto solo sorprese. Tre previsioni si sono rivelate corrette:

- **La degradazione su `get_pois` è pulita.** In assenza di rete l'RPC fallisce e l'app lo registra
  senza crash: `ERRORE RPC get_pois: Network request failed`, nessuna schermata bianca.
- **Il claim centrale dell'audit regge.** La tesi dei quattro punti è *nessuno di questi difetti
  produce un errore*. È risultata vera anche del tutto: l'unico errore strutturale emerso
  (`Tenant resolution error`) è **catturato e non fatale**. L'app è solida e silenziosa mentre
  sbaglia — che è esattamente il problema.
- **Le chiavi di accessibilità sono in chiaro e per-utente.** `loto_mobility_*` esistono e hanno
  valori plausibili: `type` (7 byte), `accessible` (5), `radius` (2), `last_date` (10). Il
  percorso di salvataggio funziona; il problema resta altrove.

---

## 4. Una cosa che il giro ha scoperto e nessun audit poteva vedere

Le chiavi di sessione BLE sono **partizionate per utente**, con l'UUID dentro il nome:

```
loto_known_ble_devices_749b645c-e4e6-45cc-91ac-89ee0ab4ba65     2 byte
loto_known_ble_devices_943ddfc0-0dbb-45ab-87a8-b4226bf3bf65     2 byte
loto_known_ble_devices_b62e2482-3fa0-4f25-8ea7-7ce087e5548e    97 byte
loto_known_ble_devices_dc311c85-9e42-45fb-a9db-a4dbb4ce72ad   289 byte
@checkin_start_749b645c-...                                   13 byte
```

Il Beacon learned appartiene all'utente che lo ha scansionato, non al dispositivo. È una scelta
**corretta**: se l'utente perde la sessione, non eredita i beacon di un altro, e il profilo
anonimo nuovo non eredita crediti. Ciò che la rende un problema è la combinazione con il Blocco 0:
dopo la rotazione d'identità, i beacon della vecchia identità restano **inutilizzabili** e
occupano spazio senza essere recuperabili da nessuna parte.

Non è un bug. È la firma del meccanismo di perdita d'identità, resa visibile.

---

## 5. Cosa **non** è stato verificato — le lacune restanti

Il perimetro di questo giro era lo stato dell'identità e dell'avvio. Non ho toccato il resto, e
non è poco:

- **`A3-T12`, il proximity gate: non verificato.** Serve un check-in reale su un POI fisico. Il
  codice dice che la distanza non viene controllata; a runtime non l'ho confermato. Resta la prova
  che manca.
- **`A7-T10`, banner di accessibilità: non verificato.** Serve aprire un POI con stato sconosciuto
  e guardare. Mai fatto.
- **`A5-T9`, Alert "Errore GPS" in check-in offline: non verificato.** Serve tentare un check-in
  senza rete. Il giro ha provato l'errore di sessione, non quello di check-in.
- **NFC, BLE, coda offline, ledger, gamification: non toccati.** Zero osservazioni.
- **Il comportamento online a sessione scaduta: non verificato.** Il token era ancora valido, e il
  `Invalid Refresh Token` ha mascherato il percorso di refresh. Serve un token scaduto, non
  rotolato.

**Il punto 2.1 rende l'ultima riga la più urgente.** Finché il refresh token fallisce per la
ragione sbagliata, il fallback dell'identità non è mai stato provato in condizioni sane: lo abbiamo
provato **solo** in assenza di rete, che è lo scenario facile.

---

## 6. Metodo, e perché è riproducibile

- Dispositivo: Oppo CPH2091, Android 12, debug wireless su `192.168.1.28:5555`.
- Metro in ascolto su `:8081`; bundle servito tramite `adb reverse`, così il telefono non ha bisogno
  di rete esterna per eseguire il codice sotto test.
- Stato locale letto con `run-as com.lotohub.app cat databases/RKStorage`, che è il database SQLite
  di AsyncStorage, copiato in binario e interrogato in locale. Il trucco conta: con il redirect `>`
  di PowerShell il file esce corrotto e non è un database, va usato `cmd /c`.
- Il test offline ha spento Wi-Fi e dati **via USB**, non via wireless: il tunnel `adb reverse` sta
  sul trasporto USB e sopravvive, così l'app poteva riavviarsi e venire osservata proprio mentre
  era senza rete. La rete è stata riattivata e validata al termine.

**Perché questa infrastruttura vale più del singolo test.** Da ora in poi ogni verifica runtime
della lista costa minuti e non richiede un ambiente nuovo. È il prerequisite mancante da quattro
punti di audit.

---

## In sintesi

Il Blocco 0 non è più un fix sperato: è un comportamento misurato su un dispositivo che ha perso
la rete e ha tenuto l'identità, senza creare nulla e senza cancellare nulla. Le cinque identità
abbandonate sono il ricordo di un'epoca precedente, e il contatore è fermo.

Il giro ha però anche confermato la tesi più scomoda di queste 47 pagine: l'app è solida, e proprio
mentre sbaglia. Un errore di rete produce un warn e prosegue. Un tenant irrisolvibile produce un
errore **senza messaggio** e prosegue. Un check-in fraudolento produrrà `success: true` e
proseguirà. Nessuno di questi si annusa, e per questo nessuno è stato trovato prima di adesso.
