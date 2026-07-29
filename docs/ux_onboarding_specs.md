# 🛠️ Specifiche UX e Tecniche (Onboarding & Gamification)

Questo documento traduce in logiche di codice le tue ultime direttive sulla UX iniziale dell'utente (dal download dell'app fino al Livello 3) e sulla gestione visiva dei contenuti nel P.O.I.

---

## 1. Localizzazione Automatica (i18n)
*   **Dinamica:** L'utente non deve scegliere la lingua manualmente al primo avvio.
*   **Implementazione:** Utilizzeremo `expo-localization` per leggere le impostazioni native del sistema operativo (`Localization.getLocales()[0].languageCode`).
*   **Effetto:** L'app si adatterà istantaneamente (es. Inglese, Italiano) mostrando i testi e i Whisper tradotti, riducendo l'attrito (Zero-Friction Onboarding).

## 2. La Curva di Livellamento (Fast-Track 1-3)
*   **Dinamica:** I primissimi livelli (1, 2 e 3) servono come tutorial motivazionale. L'utente deve salire di livello velocemente per provare subito la gratificazione e imparare le meccaniche.
*   **Implementazione SQL:** Modificheremo la funzione matematica nel database (`tr_handle_discovery_and_xp`). Invece di una curva lineare, inseriremo una soglia fissa e bassa per i primi 3 livelli:
    *   Livello 1 -> Livello 2: Richiede solo **30 XP** (basta 1-2 check-in).
    *   Livello 2 -> Livello 3: Richiede **60 XP**.
    *   Livello 3 -> Livello 4: Richiede **100 XP**.
    *   Dal Livello 4 in poi, la curva diventa esponenziale (es. +20% XP necessari per ogni livello), richiedendo più dedizione.

## 3. Progressive Disclosure (Sblocco dell'UI)
*   **Dinamica:** Per non sommergere il "Novizio" con troppe opzioni, le funzioni dell'app si svelano man mano che sale dal Livello 1 al 3.
*   **Implementazione Frontend:**
    *   *Livello 1:* Vede solo la Mappa, il Profilo e il tasto Scan.
    *   *Livello 2 (Pop-up):* "Hai sbloccato la Comunità!" -> Appare il tab Eventi/Civic Dashboard con una breve info.
    *   *Livello 3 (Pop-up):* "Sei un Esploratore!" -> Sblocca l'accesso alle funzionalità di routing (Crea Percorso).

## 4. Riorganizzazione Vault Multimediale (P.O.I.)
*   **Dinamica:** I contenuti digitali non devono essere un lungo elenco "piatto", ma devono trasmettere il senso della conquista.
*   **Implementazione in `PoiDetailSheet.tsx`:** 
    *   I contenuti verranno raggruppati in un layout a "schede" visive ordinate per Livello richiesto.
    *   **Contenuti Base:** Visti in chiaro, con un lucchetto e la dicitura *"Sbloccato al Livello X"*. L'utente capisce che giocando aprirà quelle porte. (Non si sbloccano più spendendo punti PTI!).
    *   **Area Strategica Premium:** I contenuti `is_premium` avranno un box dorato in evidenza (in cima o in fondo alla lista), separato dai contenuti standard. La CTA inviterà chiaramente a sottoscrivere il "LOTO Pass Premium" per privilegi esclusivi.
