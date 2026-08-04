# LOTO HUB - Note di Sviluppo: QA Demo Finale & Fallback Offline

Questo documento riassume tutte le implementazioni critiche inserite durante l'ultima fase di lucidatura della Demo (Luglio 2026). Serve come "memoria storica" per mantenere la stabilità dell'ecosistema e istruire futuri agenti sulle logiche proprietarie introdotte.

## 1. Logica di "Hybrid Sync" (Fallback Offline)
Per garantire che la Demo funzioni fluidamente anche senza una connessione internet super-stabile durante le scansioni NFC o Deep Link:
- **State in `index.tsx`**: Oltre al fetching da Supabase, l'app legge delle chiavi locali da `AsyncStorage` (`loto_fallback_xp`, `loto_fallback_tokens`, `loto_fallback_pois`).
- **Risoluzione Conflitti (`Math.max`)**: I contatori in Home mostrano sempre il valore più alto tra quello nel database e quello nel fallback locale: `Math.max(userProfile?.total_tokens || 0, localTokensFallback)`. Questo previene "cali" improvvisi nei contatori se il DB è lento a rispondere.
- **Aggiornamento via Deep Link (`p/[id].tsx`)**: Quando un POI viene scansionato, aggiorniamo simultaneamente sia Supabase (tramite RPC) che `AsyncStorage` per un feedback visivo istantaneo.

## 2. Hard Reset ("Formatta Account")
Il reset dell'account non si limita a cancellare l'utente da Supabase, ma deve **piallare completamente l'AsyncStorage**.
- Implementato in `profile.tsx`: Quando si esegue il logout/reset, vengono rimossi esplicitamente i token (`loto_fallback_tokens`, `loto_fallback_pois`, `loto_fallback_xp`) per evitare "Ghost Data" al successivo accesso.

## 3. Gestione Ranghi e Vetrina Profilo
- La vetrina del profilo utente genera dinamicamente il **Rank Badge** (es. *Turista Occasionale*, *Esploratore*, *Eroe del Mare*) e lo inietta come *primo elemento persistente* in alto a sinistra.
- La logica di calcolo del rango si basa su `userTokens` (`getLevelInfo(userTokens)`).
- Rimossi i mock fittizi: Il Diario Utente (`ProfileModal.tsx`) riceve come prop `userTokens` e `userXp` direttamente dallo State centrale, garantendo assoluta coerenza numerica in tutta l'app.

## 4. Haversine & Geofencing (Risoluzione TypeScript)
- **`calculateDistance`**: Ritorna una stringa formattata (es. "15m", "1.2km") per la UI.
- **`calculateDistanceRaw`**: Ritorna un `number` (metri) ed è *mandatorio* usarla in `index.tsx` per i confronti matematici (es. calcolare se si è a `< 50` metri da un POI, o per il sorting).

## 5. Modulo Segnalazioni Civiche
- Ripristinato e funzionante in `community.tsx`.
- Utilizza il componente `CivicReportSheet` per l'inserimento.
- Rende a schermo le segnalazioni recenti in un carosello orizzontale. Include la logica di blocco anti-spam (Doppia Segnalazione della stessa area vicina) validata lato server tramite RPC in Supabase.

## 6. Stato della Build EAS Android (Current Blocker)
- L'app attualmente fallisce la compilazione in cloud su EAS.
- **Fase del blocco**: `Run gradlew` (Errore Nativo Gradle Android).
- **Azione richiesta**: Analizzare il log di errore esatto di Gradle (estratto dalla dashboard web di Expo.dev) per patchare eventuali conflitti nativi (es. configurazioni Kotlin/Mapbox/Worklets). Non usare la cache EAS fino a risoluzione.
