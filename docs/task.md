# Task List: Struttura a Quadranti

## 1. Riorganizzazione Tab Bar (`app/(tabs)/_layout.tsx`)
- `[x]` Rimuovere `options.tsx` e la sua voce dalla barra.
- `[x]` Creare file stub per le nuove tab: `community.tsx`.
- `[x]` Riconfigurare `_layout.tsx` per i 5 tab: `index` (Home), `map`, `scan` (Centrato separato), `community`, `profile`.
- `[x]` Staccare visivamente il tasto Scan al centro per farlo sembrare un Floating Action Button.

## 2. Refactoring Home (`app/(tabs)/index.tsx`)
- `[x]` Rimuovere i 3 bottoni rapidi dal fondo.
- `[x]` Spostare Avatar, Livello, Barra XP (progressPerc) nella parte superiore (Header Utente).
- `[x]` Riorganizzare i blocchi: creare un Widget Centrale (Current Quest / Esplora Ora).
- `[x]` Rimodellare la parte bassa in una griglia a 4 quadranti (Indizi, Livello, Mappa, Achievements).
- `[x]` Adattare il tutto allo stile "Eco-Boutique" (colori chiari, serif, elementi smussati).

## 3. Pagine a Scorrimento (Fisarmonica / Netflix style)
- `[x]` In `community.tsx`: Costruire la struttura con scaffali orizzontali e sezioni espandibili per le funzionalità social.
- `[x]` In `profile.tsx`: Fondere il vecchio menu (`options.tsx`) e il profilo. Creare la sezione "Diario" dedicata alla collezione badge e percorsi.
