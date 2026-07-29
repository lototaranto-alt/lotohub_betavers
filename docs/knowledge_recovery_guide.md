# Guida al Recupero Concettuale (L.O.T.O. HUB)

Questo documento serve come "Mappa del Tesoro" per recuperare qualsiasi concetto, logica di business o frammento di codice che abbiamo sviluppato nella chat precedente. Se un concetto sembra perso o poco chiaro, questa è la bussola per ritrovarlo.

## 1. La Libreria dei Documenti (Dove cercare cosa)
I documenti generati nella chat bloccata non sono semplici appunti, ma veri e propri "Libretti di Istruzione" (Technical Briefs). Li abbiamo organizzati per macro-aree:

### 💼 Area Business & Strategia (B2B2G)
Se hai dubbi su *come vendere l'app* o *perché una feature esiste a livello commerciale*, consulta:
- **`master_business_brief.md`**: Il cuore assoluto. Spiega l'Oceano Blu (TSaaSI), la differenza con i competitor, il DaaS (Heatmap) e la logica "Zero-IoT" con gli NFC.
- **`partner_operative_documentation.md`**: Spiega come acquisire i P.O.I. Pilota reali (Esercenti) usando il modello Freemium via WhatsApp.
- **`icapital_peeripato_strategy.md`**: L'allineamento politico/finanziario. Spiega i 5 pilastri del progetto per i bandi (Innovazione Frugale, Due Testimoni, Identità Mediterranea).

### 🏗️ Area Architettura & Codice
Se devi ricordare *come funziona* una specifica logica tecnica, consulta:
- **`mockups_recap_strategy.md`**: Fondamentale per la fase attuale (Expo Go). Elenca tutti i mockup presenti nell'app (es. Mappa, Eventi, Percorsi) e la strategia per collegarli a Supabase.
- **`technical_business_analysis.md`**: Spiega a fondo le barriere anti-cheat (NFC crittografato, Radar BLE 10m, Geofencing, Velocity Check) e il "Lazy Login".
- **`loto_hub_development_update.md`**: La sintesi tecnica del Motore Multi-Tenant (come `TenantContext` e `RouteContext` lavorano insieme per separare Turismo e Community).

---

## 2. Come Recuperare i Concetti dalla Chat Bloccata
I documenti coprono la strategia, ma le **"viscere"** del ragionamento (il *perché* abbiamo scritto una riga di codice in un certo modo) sono sepolte nei log della chat bloccata.

**Il Metodo di Recupero (Per l'Agente AI):**
Qualsiasi agente AI (come me) può recuperare frammenti esatti della vecchia conversazione utilizzando lo strumento di ricerca sui log. 

**Istruzioni da dare all'IA in caso di vuoto di memoria:**
> *"Usa i tuoi strumenti per cercare la parola chiave [ES: 'filtri mappa' o 'algoritmo due testimoni'] all'interno del file `transcript.jsonl` situato nella cartella brain della conversazione bloccata `9254e7ba-ac1f-4704-a0d4-fb0c858252fa`."*

Questo comando forza l'Agente a "leggere nella mente" della sessione precedente, riportando a galla esattamente le riflessioni fatte in quel momento, senza allucinazioni.

---

> [!TIP]
> **Regola Aurea per lo Sviluppo Futuro**
> Prima di implementare una nuova feature importante, controlla sempre il `mockups_recap_strategy.md` e il `master_business_brief.md`. Se la feature richiede hardware costoso, registrazione obbligatoria o viola la privacy (tracciamento background), *scartala*. Deve rispettare l'Innovazione Frugale e il TSaaSI.
