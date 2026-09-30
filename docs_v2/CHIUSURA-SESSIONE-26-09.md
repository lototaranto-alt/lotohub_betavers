---
id: CHIUSURA-SESSIONE-26-09
tipo: analisi
ambito: passaggio-di-sessione-per-ripresa-lavora
stato: Vivente
confidenza: Alta
owner: Agent
aggiornato: 2026-09-26
evidenza:
  - docs_v2/ULTIMO-MIGLIO-BLOCKS.md:1
  - docs_v2/FORMA-DEFINITIVA.md:1
  - app/_layout.tsx:58
---

# Chiusura sessione — ripresa fra ~6 ore

> Niente è stato committato. Niente è stato pushato. Il blocco 0 è applicato in locale. Nessun
> processo lasciato in piedi. Questo file è il punto di ripresa.

---

## 1. Cosa è stato fatto in questa sessione

**Blocco 0 — chiuso (Deep Recovery).** `app/_layout.tsx`, un solo file, +25/−23. `npx tsc --noEmit`
pulito su tutto il progetto. Cosa cambiato in sostanza:

- eliminato `AsyncStorage.clear()` da tutti i rami di autenticazione;
- un errore di rete ora porta **solo** in modalità offline, senza creare account;
- un profilo assente (`PGRST116`) non crea più un anonimo: marca `loto_profile_missing` e attende
  il L.O.T.O. Pass;
- eliminata la rimozione della chiave `supabase-auth-token` (chiave inesistente; la sessione sta
  sotto `sb-<ref>-auth-token`);
- il flag onboarding viene letto dallo storage anche nel ramo offline.

Non ancora provato a runtime: serve un device con Metro e un test di avvio, che è il Blocco 5.

**Documenti scritti in `docs_v2/` (consultazione, non committare):**
`FORMA-DEFINITIVA.md`, `ULTIMO-MIGLIO-BLOCKS.md`, `PROMPT-COLLAUDO-ARCHIVIO.md` (prompt per
l'agent del Blocco 1), più questo. Validatore pulito.

**Copia consegnabile del prompt** anche in `brain\...\SUBAGENT_COLLAUDO_ARCHIVIO_PROMPT.md`.

---

## 2. I due APK e perché contano (punto aperto, emerso oggi)

Le release veri **non** erano sul device. Sul device c'era il **debug** via Metro. Sono due linee
distinte e la release è **indietro** rispetto al lavoro di oggi:

| Artefatto | Data | Stato |
|---|---|---|
| `android\app\build\outputs\apk\release\app-release.apk` (211,7 MB) | 24/09 08:38 | ultima release, **senza** Blocco 0 e senza le correzioni non committate |
| `Loto-Hub-Alpha.apk` (212,1 MB) | 16/09 | release precedente |
| `android\app\build\outputs\apk\debug\app-debug.apk` (106,9 MB) | 24/09 20:42 | quello montato sul device |
| `brain\...\Loto_Map_Aggiornato*.apk` ×4 | 12/09 | le più vecchie |

**Conseguenza per l'ultimo miglio:** quando si compilerà l'APK finale, non si parte da
`app-release.apk` così com'è. Va ricostruito da sorgente, includendo il Blocco 0 e **tutto il
lavoro non tracciato** elencato in §4, altrimenti si pubblica un'applicazione che ha ancora il
Deep Recovery e i fallback rotti. E questo è coerente con la tua scelta: APK dopo la struttura.

---

## 3. Il principio che tiene insieme tutto: i documenti sono ipotesi

Hai detto la cosa giusta: i doc in `docs_v2` sono stati elaborati da documentazione sparsa, quindi
**non sono verità**. In una sessione due affermazioni si sono già rivelate false (hardening mai
applicata, `get_pois` come P0). Per questo il Blocco 1 esiste, ed è affidato a un agent esterno con
un prompt a regole ferree (`PROMPT-COLLAUDO-ARCHIVIO.md`) che gli impedisce di prendere i documenti
per verità e gli dà in pasto i fatti già verificati, così non spreca risorse.

Stessa logica vale per `LOTO_DB_PRODUCTION_MAP.md`: è una mappa utile (conferma Zero-PII/LotoPass,
dichiara `vw_pois_frontend` la vista core, `xp_reward` reale e `base_xp`=0), ma è una **descrizione**
del 12/09, non lo stato del DB.

---

## 4. Lavoro non tracciato da non perdere (stato git)

```
 M app/(tabs)/index.tsx
 M app/_layout.tsx          <- Blocco 0 di oggi
 M docs/codici_morti.md
?? assets/images/current_label.png
?? assets/images/logo_anteprima_2.png
?? assets/images/logo_anteprima_finale.png
?? docs_v2/                 <- documenti di sessione, consultazione
?? supabase/migration_v22_daas_vendite.sql
?? supabase/migration_v23_prestige_card_metrics.sql
?? supabase/migration_v24_app_telemetry.sql
?? supabase/migrations/20260926120000_scan_chain_canonical.sql
?? utils/dbAggregation.ts
```

Il punto che hai toccato è esatto: molte di queste implementazioni sono **correzioni fatte e non
documentate bene**. `utils/dbAggregation.ts` e la catena di scansione non tracciata sono esattamente
questo. Sono lavoro reale, esiste, e al momento non è in Git. Chi lo ricostruisce senza questo file
lo perde. Per questo §7 non propone nessun commit automatico: prima lo collauda il Blocco 1, poi
decidi tu cosa tracciare.

---

## 5. Il punto più importante che deve rispondere il Blocco 1

> **Cosa fa esattamente `recover_loto_pass`?** Se ricongiunge l'`auth.uid` corrente a un profilo
> esistente, il Blocco 0 è completo così com'è: il Pass riporta l'utente indipendentemente da
> quanto ho sistemato l'avvio. Se fa solo una lettura, l'identità continua ad avere un meccanismo
> solo manuale e va aggiunto.

Verificato finora: il client (`LotoPassRecoveryScanner.tsx:59`) chiama la RPC e, su successo, mostra
solo un Alert e chiude. **Tutto il ricongiungimento è dentro la funzione sul DB**, non ispezionabile
dal client. Per questo la domanda va posta al DB, non al codice.

---

## 6. Metodo: due cose da non ripetere

- **Non interrogare il cloud col refresh token del device.** Supabase lo ruota a ogni uso, il device
  lo conserva scaduto, e alla prima scadenza l'app entrava in Deep Recovery. Con il Blocco 0
  applicato il danno è ora limitato, ma il metodo resta da evitare: per il cloud usare SQL editor o
  `service_role`.
- **ADB**: il daemon si blocca a volte su una percentuale. Usare il percorso assoluto
  `C:\Users\Sem\AppData\Local\Android\Sdk\platform-tools\adb.exe`. Il DB dell'app è in
  `databases/RKStorage`; con l'app in esecuzione la copia è illeggibile, quindi chiudere l'app prima
  di copiarlo.

---

## 7. Come si riprende, in ordine

1. Leggere l'output del Blocco 1 (l'agent del collaudo), in particolare la tabella di verifica.
2. **Rispondere alla domanda `recover_loto_pass`** (§5): decide se il Blocco 0 è completo.
3. Blocco 2 — rendere riproducibile il DB: catturare con `pg_get_viewdef` le due viste orfane
   (`vw_pois_frontend`, `vw_collective_impact`), scrivere la migration che le crea senza sovrascrivere
   quelle già presenti, e stabilire quale delle due copie di `scan_poi_gps` (una è "fixed", fuori
   repo) sia quella viva in cloud.
4. Blocco 3 — coesione app: allineare il `profile_id` di `dbAggregation.ts` ad `auth.uid`; decidere
   se i fallback `loto_fallback_*` (mai esercitati, chiavi assenti) esistono o vanno rimossi;
   scremare la tab bar.
5. Blocco 4 — catena di scansione, ma **dopo** D5 e D6, che decidono la firma della funzione.
6. Blocco 5 — prova su campo e **solo allora** compilazione dell'APK.

Due decisioni dell'utente che sbloccano il Blocco 4: **il check-in accredita PTI?** (D6) e **il tag
NFC da solo vale?** (D5). Nessuna delle due è tecnica.

---

## 8. Cosa non è stato toccato (per sicurezza)

- Nessun commit, nessun branch, nessun push.
- Nessuna migration applicata al DB, nessuna scrittura sul cloud.
- Nessuna dashboard admin.
- Il Blocco 0 è l'unica modifica al codice applicativo di questa sessione.
- Nessun processo lasciato attivo (adb fermo, nessun Metro).

*Confidenza Alta su Blocco 0 (codice letto, `tsc` pulito) e sugli oggetti DB (query dirette). Media
sulla completezza della catena di scansione e sui fallback, da confermare col Blocco 1.*
