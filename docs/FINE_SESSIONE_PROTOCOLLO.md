<!-- Stato: Vivente -->
<!-- Scopo: Definisce il workflow obbligatorio di fine sessione per valorizzare e verificare il lavoro, evitare errori silenziosi e garantire un riferimento cronologico ripristinabile. -->
<!-- SSOT: questo file -->
<!-- Owner: workspace/processi -->
<!-- Ultimo aggiornamento: 2026-09-21 -->

# Protocollo di Fine Sessione (PFS)

> Questo protocollo risponde a: *"come chiudo ogni sessione di lavoro in modo che il lavoro sia verificato,
> salvato, datato e facile da riprendere?"*. Va eseguito **ogni volta che una sessione termina** (o a checkpoint
> di consegna), in autonomia dall'agente, senza dipendere da input dell'utente.

## Fasi (in ordine, obbligatorie)

### FASE 1 — VERIFICO (rigore prima di tutto)
1. **Type check:** `npx tsc --noEmit` → deve uscire `TSC_EXIT=0`. Se errori, si correggono PRIMA di proseguire.
2. **Lint sui file toccati:** `npx eslint <file-modificati>` → **nessun errore nuovo**. Gli avvisi pre-esistenti
   (warning) sono tollerati e vanno elencati nel report; gli errori (lint) mai.
3. **Diff review:** `git diff --stat` e `git diff` per i file toccati: solo file **intenzionali**, nessun file
   generato/cache (`node_modules`, `.expo`, `supabase/.temp`), nessun segreto.
4. **Whitespace:** `git diff --check` (nessun cambiamento di fine riga involontario).

### FASE 2 — RIPULISCO (niente debiti nascosti)
1. **Codice morto:** rimuovere ciò che introduce (non ciò che è pre-esistente e già archiviato).
2. **Vincoli SSOT:** ogni numero "magico" nuovo va centralizzato (es. `KEY_LEVELS`/`levelUtils.ts`);
   mai colori/valori hard-coded quando esiste la costante di riferimento.
3. **Regole di progetto (AGENTS.md):** Zero-PII, Zero-IoT, Offline-First, DB=SSOT, no `Alert` di sistema (G7), palette LOTO.
4. Eventuali residui NON risolvibili ora vanno **registrati** (non rimossi) in `REPORT_GAMIFICATION_STATUS.md` o in `codici_morti.md`.

### FASE 3 — SALVO (commit puliti e separati)
1. **Commit per tipo:** (a) codice/feature, (b) documentazione. Mai un commit con solo meta-files modificati in mezzo.
2. Commit **solo** dei file intenzionali (`git add` esplicito, mai `git add -A`).
3. Messaggio conciso in stile repo (es. `fix(gamification): …` / `docs: …`), niente sezioni vuote.
4. Mai push/PR se non richiesto.

### FASE 4 — REGISTRO (riferimento cronologico)
1. **`docs/NEXT_SESSION_HANDOFF.md`:** aggiungere IN CIMA la nuova sezione `# Fine Sessione (GG/MM …)` con
   "Raggiunto" / "Prossime Task" (appendere, mai riscrivere le sezioni passate).
2. **`docs/REPORT_GAMIFICATION_STATUS.md`:** aggiornare il diario (PARTE D) con i turni della sessione e
   segnare le linee guida G cambiate di stato (PARTE C).
3. **`docs/README.md`:** aggiornare l'indice se ci sono doc nuovi (regola "una casa, una voce").
4. **`docs/knowledge_recovery_guide.md`:** nota all'indice se l'area è nuova.

### FASE 5 — STIMO & RIEPILOGO (valorizzazione)
1. Riepilogo finale per l'utente in 3 blocchi: **FATTO** (codice + decisioni, con commit hash) ·
   **VERIFICATO** (TSC/lint/diff, con esiti) · **PROSSIMO PASSO** (task successiva chiara da riprendere).
2. Lo stato di avanzamento globale (% verso l'obiettivo AAB/Play Console) viene ricalcolato a ogni riepilogo.

## Checklist compatta (da usare nel messaggio finale)
```
✅ TSC pulito (TSC_EXIT=0)
✅ ESLint: 0 errori nuovi sui file toccati
✅ Diff rispetta scope (git diff --check ok, no file generati)
✅ Commit: <hash> codice · <hash> docs
✅ Handoff aggiornato (NEXT_SESSION_HANDOFF.md) + REPORT + README indice
⚠️ Debiti registrati: <elenco>
```

## Eccezioni
- Se l'utente è assente e un fix richiede una **decisione di design** non ancora autorizzata, NON si implementa:
  si scrive il doc-proposta (Bozza) e si registra la decisione come "attesa".
- Se il compelling (es. build EAS) blocca il commit, si segnala come **bloccato** nel riepilogo senza forzare.