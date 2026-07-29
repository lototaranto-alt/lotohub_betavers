# Piano di Implementazione: Struttura a Quadranti (Stile Boutique)

Ricevuto: Manteniamo il bellissimo e luminoso **Stile Boutique** attuale (verde bosco, beige, font serif) ma ne riorganizziamo la **struttura** prendendo ispirazione dal layout ordinato del mockup.

## Modifiche Architetturali

### 1. Riorganizzazione Bottom Tab Bar (`_layout.tsx`)
Nuova barra di navigazione inferiore:
- `home`: Dashboard principale.
- `map`: Mappa POI.
- `scan`: Tasto centrale (flottante o ben separato) per NFC.
- `community`: Sostituisce la vecchia tab (esplora/eventi). Conterrà scaffali (accordion) in stile Netflix per le dinamiche sociali.
- `profile`: Assorbe il vecchio "Menu" e il Profilo. Conterrà scaffali (accordion) per Impostazioni, Dati utente e il **Diario** (collezione di badge e percorsi generati).

### 2. Strutturazione Home Page (`index.tsx` - Stile Boutique)
Riorganizziamo la vista principale:
- **Header Utente (In alto):** Avatar, "Benvenuto [Nome]", Livello e barra XP, ottimizzati e abbelliti, integrati nell'header "LOTO HUB".
- **Rimozione Bottoni:** Via i 3 enormi bottoni in basso (Esplora, Mappa, Eventi) per pulire il layout, dato che avremo i tab dedicati.
- **Centro (Elemento Eroe):** Un widget principale elegante (es. la prossima tappa o un richiamo all'azione) stile Eco-Boutique.
- **Griglia a 4 Quadranti (In basso):** Riorganizziamo gli Archi e la Prestige Card in una griglia ordinata stile mockup:
  1. Indizi Trovati (progresso)
  2. Progresso Livello (XP)
  3. Mappa Locale (riassunto)
  4. Traguardi Raggiunti (Achievements/Badge)

### 3. Sviluppo Schermate a Fisarmonica
Creeremo componenti "Accordion" riutilizzabili per le pagine `community` e `profile`, permettendo uno scorrimento fluido dei contenuti senza cambi continui di pagina.
