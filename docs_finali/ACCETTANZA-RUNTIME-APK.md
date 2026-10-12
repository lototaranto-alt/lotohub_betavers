# ACCETTANZA RUNTIME — APK RELEASE (da eseguire sul 2° device)

> Documento operativo: elenca le verifiche **in-app** ancora pendenti da eseguire
> sull'APK release standalone (fuori dalla rete di sviluppo). Compila la colonna
> **Esito** e incolla il file compilato in chat.

## Prerequisiti
- APK `release` installato sul device secondario (standalone — NON serve Metro).
- App avviata una volta (login anonimo automatico: `_layout.tsx` `signInAnonymously()`).
- GPS attivo; per il caso NFC/BLE serve l'hardware relativo.
- Se serve un utente "nuovo" per il cold-start (M7), usa un **device con install
  pulita** o cancella i dati app (Impostazioni → App → L.O.T.O. Map → Cancella dati).

## Come riportare
Per ogni voce scrivi: `OK` / `KO` / `parziale` + 1 riga di dettaglio (errore esatto,
screenshot, valore visto). Se puoi, allega lo screenshot della schermata.

---

## M6 — Deep link POI
**Passi**
1. Da browser/messaggio apri un link POI: `lotoappfresh://p/<poi_id>` (oppure scansiona un tag NFC/QR partner).
2. Attendi l'apertura della scheda POI.

**Atteso**
- L'app si apre sulla scheda del POI corretto (`app/p/[id].tsx`).
- Il check-in è disponibile e va a buon fine (percorso `scan_poi_gps`).
- La Home si aggiorna dopo il check-in.

**Esito:** ____

---

## M7 — Cold-start (primo check-in)
**Passi**
1. Con un utente che **non ha mai** fatto check-in, esegui il primo check-in su un POI.
2. Osserva il toast XP e, se puoi, il profilo.

**Atteso**
- Primo check-in **registrato** (nessun blocco), **+20 XP**.
- `calculated_speed_kmh = NULL` (non 9999), `is_shadowbanned = FALSE`.
- Il **secondo** check-in (altro POI) è misurabile (velocità calcolata) e non è più un cold-start.

**Esito:** ____

---

## M9 — Segnalazione civica
**Passi**
1. Apri la segnalazione civica (sheet) e invia una segnalazione con una foto/testo.
2. Attendi la conferma in app.

**Atteso**
- Compare la conferma di invio.
- La riga finisce in `civic_reports` con `status = 'pending_match'` (verifica nel
  pannello Supabase: `select id, status, category from civic_reports order by created_at desc limit 5`).

**Esito:** ____

---

## M10 — Badge da XP
**Passi**
1. Accumula XP fino a superare una soglia badge (oppure usa un utente già oltre soglia).
2. Apri **Profilo** (o esegui l'azione che chiama `claim_badges`).

**Atteso**
- I badge civici compaiono in base a `total_xp` (assegnati via RPC `claim_badges`, non da mock).
- Il contatore badge in Profilo riflette le righe reali di `user_badges`.

**Esito:** ____

---

## M12 — HeatScore / Densità
**Passi**
1. **Un check-in** → il POI resta a fondo/base (nessun boost).
2. **Due check-in ravvicinati su 2 POI DIVERSI** (il cooldown 12h blocca lo stesso POI)
   → il POI con check-in recente mostra il boost (più "caldo").
3. **Attesa ~15 min** → il boost recente **decade** (il POI torna al fondo, non sparisce).
4. **Reload** (riapri la tab mappa) **con storico già presente** → il fondo della
   giornata si riflette (POI con check-in di oggi più caldi).

**Atteso / gate**
- Il decadimento usa l'**ora corrente** (non quella di apertura app).
- **Gate visivo (R2):** l'icona/badge del calore **non copre né sposta** l'etichetta
  del POI (es. "Cattedrale di San Cataldo" deve leggersi per intero).

**Esito:** ____ (per ciascuno dei 4 punti + gate visivo)

---

## M16 — Eventi visibili
**Passi**
1. Apri la Home (sezione eventi) e la tab **Community**.
2. Osserva la lista eventi.

**Atteso**
- Si mostrano **tutti** gli eventi (`event_type` reali: `eco`, `social`), senza
  filtri `web_public`/`nodo_community`.
- Tocca un evento: `EventDetailSheet` mostra i dettagli (uso display di `event_type`).

**Esito:** ____

---

## Note / anomalie
- (libere)

## Dove guardare in caso di KO (pannello Supabase)
- `user_pois` (ultime righe: `xp_awarded`, `calculated_speed_kmh`, `is_shadowbanned`)
- `civic_reports` (`status`)
- `user_badges` + `badges` (badge assegnati)
- `events` (eventi pubblicati, `event_type`)
