# DOSSIER TECNICO-STRATEGICO: L.O.T.O. HUB

Questo documento raccoglie le analisi tecniche per i partner commerciali, il Comune o gli investitori.

---

## 🔍 1. La Formula Anti-Cheat: Analisi Tecnica dell'Architettura Ibrida

Il problema principale delle app di "Reward per Azione" è la vulnerabilità alle frodi: l'ecosistema perde valore se gli utenti possono accumulare punti restando sul divano (GPS Spoofing, condivisione di QR Code su WhatsApp). L.O.T.O. HUB risolve questo problema con un'architettura ibrida a validazione multipla.

**Il Sistema di Validazione Primario: NTAG424 DNA (NFC)**
Il pilastro centrale del progetto si basa su microchip crittografici. Ogni "Tap" genera un crittogramma dinamico usa-e-getta (SUN - Secure Unique NFC). È fisicamente impossibile clonarlo o inviarlo a distanza. Affidabilità del dato: **100%**.

**Il Sistema di Fallback: QR Code + Geofencing + BLE (La Formula ibrida)**
Per garantire totale inclusività ai possessori di vecchi smartphone senza NFC, il sistema prevede un QR Code stampato sul presidio. L'anti-cheat per il QR è così strutturato:

1.  **Check GPS (Geofencing Obbligatorio):** Il QR non fornisce punti se l'app non rileva la coordinata GPS esatta del presidio. Nessuna istantanea GPS = nessuno sblocco.
2.  **Firma Ambientale (Radar BLE):** Poiché il GPS può essere falsificato tramite software terzi, l'app innesca una micro-scansione Bluetooth (BLE) invisibile di 3 secondi. Il sistema verifica se i dispositivi fissi del locale (es. Smart TV, POS, Beacon proprietario) sono presenti nel raggio di 10 metri. Il BLE non è falsificabile da remoto.
3.  **Velocity Check:** Il backend incrocia i timestamp. Se un utente scansiona un QR al Castello e 2 minuti dopo ne scansiona un altro a 20 km di distanza, l'account viene sospeso per teletrasporto virtuale.

**Conclusione:** Questa tripla barriera rende il dato di L.O.T.O. (sia per le Heatmap che per la Gamification) uno dei più puri e inquinabili sul mercato turistico.

---

## 🔍 2. Analisi delle Idee: "Lazy Login" e "Classifica di Condotta"

Queste due architetture risolvono due delle metriche più difficili per le startup: l'Attrito Iniziale (Drop-off rate) e la Fedeltà a Lungo Termine (Retention rate).

### 2.1 L'Ottimizzazione dell'Onboarding: Lazy Login (Google/Apple)
*   **Problema:** Costringere un utente a registrarsi (Email, Password, Conferma) prima di fargli vedere il valore dell'app causa un abbandono del 50-60%.
*   **Soluzione (Immediacy-First):** L'utente scarica l'app ed è *immediatamente* operativo. Il server crea un account anonimo ombra (Guest) permettendogli di accumulare punti dal primo secondo.
*   **La Leva del Backup:** Solo quando l'utente avrà accumulato un capitale di valore (LOTO PTI), l'app gli proporrà (nella sezione Profilo) di "Mettere al sicuro la sua cassaforte" loggandosi con Google o Apple in 1-Click. Il sistema fonderà l'account ombra con l'identità reale. L'utente lo farà volentieri perché è motivato dall'avversione alla perdita.

### 2.2 La Retention Invernale: Classifica di Condotta (Civic Leaderboard)
*   **Problema:** Le app turistiche muoiono a Ottobre. Serve un motivo per cui i residenti (studenti, lavoratori) debbano aprire l'app tutti i giorni dell'anno.
*   **Soluzione (Gamification Civica):** Spostare il focus dal "Turismo" alla "Cittadinanza Attiva". L'app premia (con XP e LOTO PTI) le azioni virtuose:
    *   Scegliere la bicicletta al posto dell'auto per andare al lavoro (convalidato da velocità GPS e percorsi).
    *   Mappare barriere architettoniche per l'associazione *Diseducation*.
    *   Fare check-in nei luoghi della cultura.
*   **Il Valore B2G (Business to Government):** La Classifica mostra i "Cittadini del Mese". Il Comune di Taranto avrà interesse istituzionale a premiare pubblicamente questi utenti. L.O.T.O. non è più solo una guida, ma uno strumento di ingegneria sociale positiva per le Amministrazioni Pubbliche.
