# Baseline Architetturale (Pre-Gamification)

*Questo documento cristallizza lo stato perfetto, coeso e funzionante del progetto L.O.T.O. HUB esattamente un attimo prima che venissero introdotte le patch distruttive della "Gamification Vetrina" (v19 e finti Master Reset).* 
*Serve come bussola (Punto di Ripristino Logico) per garantire che nessuno sviluppo futuro violi questa armonia.*

---

## 1. Il Paradigma "Zero-Coercition" e la Dualità Economica
L'app si regge su un delicato equilibrio psicologico e strutturale, diviso in due valute non intercambiabili:

1.  **Esperienza (XP):** La valuta del *Turista*. Si guadagna esplorando la città (es. Castello Aragonese = 15 XP, Ipogeo = 100 XP). Serve unicamente per una progressione narrativa intima (sblocco trofei nel Medagliere) e per salire di grado (LOTO Explorer -> Voyager -> Master). NESSUNA classifica pubblica.
2.  **Loto Punti (PTI):** La valuta del *Cittadino/Impatto*. Si guadagna solo partecipando a Nodi Civici (es. Plasticaqquà). Questi punti non si spendono, ma confluiscono in un contatore pubblico (es. "10 Alberi in Piazza") gestito dalla `CivicDashboard`.

**Incoerenza corretta mentalmente:** Il *Vault Multimediale* (audioguide e documenti) NON deve costare PTI (che sono destinati agli alberi), ma deve sbloccarsi gratis al check-in fisico o tramite XP.

---

## 2. Architettura dei Ruoli (`flow_role`)
Tutto il frontend e il database discriminano l'esperienza basandosi sul campo `flow_role` nella tabella `profiles`:

*   **Il Turista (`LOTO Explorer`):** Naviga la mappa, usa il Triangolo di Convalida (NFC Hardware + GPS Tollerante Haversine + BLE Ambientale) per sbloccare i luoghi.
*   **Il Partner (`LOTO Partner`):** Filosofia *Zero-UI*. Nessuna dashboard complessa. Vede solo la sua Tessera Digitale e un enorme bottone "WhatsApp Concierge" per chattare con l'Agenzia L.O.T.O. tramite Deep Link nativo.
    *   *Onboarding Partner:* Regolato dal "Double GPS Handshake" (incrocio tra la coordinata di posa dell'Agenzia e la coordinata del primo scan del Partner).

---

## 3. Lo Stato del Database (Congelamento Selettivo)
L'architettura SQL (che abbiamo ripristinato con il `TRUE_HISTORY_RESTORE.sql` da Aprile a metà Luglio) è solida proprio perché **non fa over-engineering**:

*   **Tabelle Attive e Funzionanti:** `profiles` (con GDPR compliance), `pois` (con `layer_name` vitale per Mapbox e geofencing), `tenant_events`, `media_vault` (per i file criptati come "Segreti Aragonesi").
*   **Tabelle Congelate:** `civic_goals` e logiche crittografiche B2B. Queste sono state *volutamente* non create in SQL, ma gestite tramite Mock Dati iniettati nel frontend (es. `mockInjector.ts`), in attesa della firma dei contratti reali con gli enti civici.

## 4. Privacy by Design (Spatial Hashing)
Nelle segnalazioni civiche (`esg_raw_logs`), la privacy degli utenti è tutelata troncando le coordinate GPS a 3 cifre decimali, creando una "griglia spaziale" di 100x100 metri che impedisce il tracciamento esatto dell'individuo, esponendolo solo agli Admin.

---

### Verdetto
Il codice pre-gamification era un ecosistema elegante. Le patch e il reset hanno tentato di forzare (con classifiche, required_level, is_premium_only nel media vault) un sistema che era nato per essere "Zero-Coercition". Il ripristino di oggi cancella quel debito e ci riporta a questa baseline pura.
