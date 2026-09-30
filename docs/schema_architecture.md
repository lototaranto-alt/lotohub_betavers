# 📐 DRAFT ARCHITETTURA: LOTO MASTER SCHEMA

> ## ARCHIVIO. Documento storico, non e' fonte di autorita'.
>
> **Demotato il 30/09/2026.** Si dichiarava definitivo e si contendeva l'autorita' con altri
> documenti. Il file canonico di questo progetto e'
> `docs_v2/loto-hub-architettura-sistema-master-2026.md`; l'indice di chi dice il vero e'
> `docs_v2/tooling/autorita.json`.
>
> Il testo originale e' integro qui sotto. **Se contraddice l'architettura attuale, vale
> l'architettura attuale.** Non e' stato cancellato: un archivio che si cancella non e' un archivio.


Come richiesto, non sto eseguendo nulla e non sto "inventando" campi. Ho scansionato i vecchi file sparpagliati e ho estratto la gerarchia corretta delle dipendenze per ricreare la beta solida.

Ecco la struttura gerarchica (in ordine di creazione, per non rompere le dipendenze delle chiavi esterne) che andremo a codificare nel file definitivo:

## 1. Tabelle Core (Le fondamenta)
1. `tenants`: L'anagrafica delle città (Taranto, Bari, ecc.).
2. `tenant_localizations`: Le traduzioni per le città.
3. `tenant_associations`: I nodi civici (es. *Diseducation*).
4. `profiles`: Gli utenti (si aggancia al trigger di Auth).

## 2. Tabelle App (Dati operativi)
1. `pois`: I punti di interesse. **[FIX INCLUSO]** Aggiungiamo i campi `tenant_id`, `p_iva` e `pec` che mancavano nell'ultima versione.
2. `scans`: Il registro delle scansioni (NFC/QR).
3. `impact_transactions`: Il ledger economico di LOTO, CO2 e XP.
4. `civic_reports`: Le segnalazioni. **[FIX INCLUSO]** Aggiungeremo i permessi RLS qui in modo che l'API non blocchi la mappa o i caricamenti.

## 3. Motore Gamification (Le tabelle del loop)
*Nota: Questa è la sezione che causava i loop. Assicurandoci che queste tabelle vengano create DOPO le tabelle Core, i loop di dipendenza spariranno.*
1. `badge_templates`: I badge globali.
2. `tenant_badge_overrides`: Le personalizzazioni cittadine dei badge.
3. `user_badges`: I badge sbloccati dagli utenti.
4. `collective_goals` & `goal_participations`: Gli obiettivi collettivi (ESG).

## 4. Media e Vetrina
1. `media_vault`: I contenuti digitali associati ai POI.
2. `user_unlocked_media`: Il registro di chi ha sbloccato cosa usando i LOTO.

## 5. Viste (Views) e Funzioni (RPC)
Le viste e funzioni verranno create per ultime, dato che dipendono da tutte le tabelle sopra.
1. `vw_pois_frontend`: **[FIX INCLUSO]** Ripristineremo questa vista (che la mappa originale usava per decodificare `coords` di PostGIS in `lat`/`lng`) in modo da rimuovere il mio bypass dal frontend.
2. `get_pois()`: Funzione di fallback e per le liste.
3. `process_esg_impact()`: La massiccia funzione che distribuisce punti.
4. `get_poi_vetrina()` & `sblocca_media()`: Le funzioni per la vetrina premium.

---

> [!IMPORTANT]
> **Check di validazione**
> 
> La struttura gerarchica qui sopra rispecchia esattamente il flusso creativo originale. 
> 1. Ti torna questa gerarchia?
> 2. Se mi dai l'ok, procedo a generare fisicamente l'intero script SQL (`MASTER_SCHEMA_BETA.sql`) connettendo questi pezzi originali (con i relativi RLS per le segnalazioni civiche) e te lo sottopongo per il varo finale prima di eseguirlo su Supabase.
