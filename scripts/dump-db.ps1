<#
.SYNOPSIS
  L.O.T.O. HUB Estrazione schema DB (SSOT eseguibile), generazione tipi TS e baseline migrazioni.

.DESCRIPTION
  Sorgente di verita' del database Supabase. NIENTE copia-incolla manuale dal pannello.

  Modalita':
    Schema        -> supabase/schema/schema_dump.sql
                     (tabelle + vincoli + funzioni + viste + POLICY RLS + GRANT).
    Data          -> supabase/schema/data_dump.sql   (SOLO dati di riferimento; NON committare se contiene PII).
    Types         -> types/database.ts               (tipi generati, da passare a createClient<Database>).
    Diff          -> confronto schema remoto vs supabase/migrations (rileva drift out-of-band).
    Baseline      -> crea la migrazione baseline in supabase/migrations/ (<timestamp>_remote_schema.sql).
    All           -> Schema + Types + Diff.
    Introspection -> scrive supabase/schema/introspection.sql (pack di query per il fallback manuale,
                     NON richiede connessione).

  Backend:
    Cli     usa Supabase CLI via `npx supabase` (consigliato per Types/Diff/Baseline).
    PgDump  usa `pg_dump` con la connection string (richiede $env:SUPABASE_DB_URL).
    Auto    PgDump se esiste pg_dump ed e' impostata la URL, altrimenti Cli.

  Sicurezza:
    - La connection string NON va incisa nello script: usare la variabile d'ambiente
      $env:SUPABASE_DB_URL (oppure $env:DATABASE_URL).
    - Prima di eseguire una modalita' che scrive sul DB remoto (Diff/Baseline) verificare il progetto.
    - Data dump: contiene geolocalizzazioni/PII. Il file e' volutamente gitignorato.

.EXAMPLE
  # 1) Primo setup CLI (una volta sola)
  npx supabase login
  npx supabase link --project-ref <PROJECT_REF>

  # 2) Dump schema + tipi + drift
  .\scripts\dump-db.ps1 -Mode All -ProjectRef <PROJECT_REF>

.EXAMPLE
  # Solo pg_dump, con URL da variabile d'ambiente
  $env:SUPABASE_DB_URL = "postgresql://postgres:<pw>@db.<ref>.supabase.co:5432/postgres"
  .\scripts\dump-db.ps1 -Mode Schema -Backend PgDump

.EXAMPLE
  # Fallback senza connessione: genera il file di query da incollare nel SQL Editor
  .\scripts\dump-db.ps1 -Mode Introspection
#>

[CmdletBinding()]
param(
    [ValidateSet('Schema', 'Data', 'Types', 'Diff', 'Baseline', 'All', 'Introspection')]
    [string]$Mode = 'Schema',

    [ValidateSet('Auto', 'Cli', 'PgDump')]
    [string]$Backend = 'Auto',

    [string]$ProjectRef = $env:SUPABASE_PROJECT_REF,

    [string]$DbUrl = $(if ($env:SUPABASE_DB_URL) { $env:SUPABASE_DB_URL } else { $env:DATABASE_URL }),

    [string]$SchemaName = 'public'
)

$ErrorActionPreference = 'Stop'

# --- Percorsi ---
$RepoRoot   = Split-Path -Parent $PSScriptRoot
$SchemaDir  = Join-Path $RepoRoot 'supabase\schema'
$TypesDir   = Join-Path $RepoRoot 'types'
$SchemaOut  = Join-Path $SchemaDir 'schema_dump.sql'
$DataOut    = Join-Path $SchemaDir 'data_dump.sql'
$TypesOut   = Join-Path $TypesDir  'database.ts'
$IntroOut   = Join-Path $SchemaDir 'introspection.sql'

foreach ($d in @($SchemaDir, $TypesDir)) {
    if (-not (Test-Path -LiteralPath $d)) { New-Item -ItemType Directory -Force -Path $d | Out-Null }
}

function Write-Info  ($m) { Write-Host "[dump-db] $m" -ForegroundColor Cyan }
function Write-Warn2 ($m) { Write-Host "[dump-db] ATTENZIONE: $m" -ForegroundColor Yellow }
function Write-Err   ($m) { Write-Host "[dump-db] ERRORE: $m" -ForegroundColor Red }

function Push-EnvAway {
    # La Supabase CLI (Deno dotenv) crash se ./.env ha BOM UTF-8 (visto nel repo: EF BB BF + porzione UTF-16LE).
    # La disattiviamo temporaneamente solo intorno alle chiamate CLI, poi la ripristiniamo.
    if (-not (Test-Path -LiteralPath (Join-Path $RepoRoot '.env'))) { return $false }
    $head = [System.IO.File]::ReadAllBytes((Join-Path $RepoRoot '.env'))
    if ($head.Length -lt 3) { return $false }
    if ($head[0] -eq 0xEF -and $head[1] -eq 0xBB -and $head[2] -eq 0xBF) {
        Rename-Item -LiteralPath (Join-Path $RepoRoot '.env') -NewName '.env.cli-backup'
        Write-Warn2 ".env ha un BOM UTF-8 non parsabile dalla CLI: disattivato temporaneamente, verra' ripristinato."
        return $true
    }
    return $false
}

function Pop-EnvBack {
    param([bool]$wasMoved)
    if (-not $wasMoved) { return }
    $bak = Join-Path $RepoRoot '.env.cli-backup'
    if (Test-Path -LiteralPath $bak) {
        Rename-Item -LiteralPath $bak -NewName '.env'
        Write-Info ".env ripristinato."
    }
}

function Resolve-Backend {
    param([string]$Requested, [string]$Url)
    if ($Requested -ne 'Auto') { return $Requested }
    $hasPg = [bool](Get-Command pg_dump -ErrorAction SilentlyContinue)
    if ($Url -and $hasPg) { return 'PgDump' }
    return 'Cli'
}

function Get-ConnArgs {
    if (-not [string]::IsNullOrWhiteSpace($DbUrl))   { return @('--db-url', $DbUrl) }
    if (-not [string]::IsNullOrWhiteSpace($ProjectRef)) { return @('--project-ref', $ProjectRef) }
    return @('--linked')
}

function Invoke-Cli {
    param([string[]]$CliArgs)
    $moved = Push-EnvAway
    try {
        Write-Info ("npx supabase " + ($CliArgs -join ' '))
        & npx supabase @CliArgs
        if ($LASTEXITCODE -ne 0) { throw "Comando Supabase CLI fallito (exit $LASTEXITCODE)." }
    } finally {
        Pop-EnvBack $moved
    }
}

function Assert-Linked {
    $hasRef = -not [string]::IsNullOrWhiteSpace($ProjectRef)
    $hasUrl = -not [string]::IsNullOrWhiteSpace($DbUrl)
    if (-not $hasRef -and -not $hasUrl) {
        throw "Serve -ProjectRef (o $env:SUPABASE_PROJECT_REF) oppure -DbUrl / $env:SUPABASE_DB_URL."
    }
}

function Write-IntrospectionFile {
    $sql = @'
-- ============================================================================
-- L.O.T.O. HUB - Pack di introspezione (fallback manuale, SQL Editor)
-- Generato da scripts/dump-db.ps1. Eseguire le sezioni separatamente e salvare
-- i risultati in supabase/schema/. NON e' un dump completo: per la SSOT usare
-- il backend Cli o PgDump.
-- ============================================================================

-- 1) FUNZIONI (corpi completi, incl. SECURITY DEFINER e search_path)
SELECT p.proname AS function_name,
       pg_get_function_identity_arguments(p.oid) AS args,
       p.prosecdef AS security_definer,
       pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.prokind = 'f'
ORDER BY p.proname;

-- 2) POLICY RLS + stato RLS per tabella
SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS rls_forced
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r'
ORDER BY c.relname;

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3) COLONNE (tipi reali, per confrontare col codice)
SELECT table_name, ordinal_position, column_name, data_type, udt_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- 4) VINCOLI (PK, FK, UNIQUE come receipt_hash, CHECK)
SELECT conrelid::regclass AS table_name, conname, contype, pg_get_constraintdef(oid, true) AS definition
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace
ORDER BY conrelid::regclass::text, conname;

-- 5) GRANT espliciti
SELECT table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
ORDER BY table_name, grantee, privilege_type;

-- 6) VISTE e relative definizioni
SELECT table_name, view_definition
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- 7) ESTENSIONI
SELECT extname, extversion FROM pg_extension ORDER BY extname;

-- ============================================================================
-- 8) AUDIT RAPIDO (domande aperte dell'audit integrita' dati)
-- ============================================================================

-- 8a) Esiste profiles.total_co2? (la mappa SSOT dice di NO)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema='public' AND table_name='profiles' AND column_name IN ('total_co2','total_xp','total_tokens','pois_discovered','party_size');

-- 8b) Colonne reali di user_pois (la mappa cita calculated_speed_kmh, is_shadowbanned, xp_awarded, co2_saved)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema='public' AND table_name='user_pois'
ORDER BY ordinal_position;

-- 8c) Quale definizione di scan_poi_gps e' realmente deployata?
SELECT pg_get_functiondef(p.oid) AS scan_poi_gps_definition
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname='public' AND p.proname='scan_poi_gps';

-- 8d) Firme delle RPC chiamate dal client ma senza definizione nel repo
SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname='public' AND p.proname IN
      ('scan_poi','process_crowd_radar','process_esg_impact','sblocca_media','join_squad',
       'recover_loto_pass','validate_ntag424_sdm','rpc_sync_adventure_distance','create_itinerary')
ORDER BY p.proname;

-- 8e) Vincolo UNIQUE anti-double-spend su impact_transactions
SELECT conname, pg_get_constraintdef(oid, true) AS definition
FROM pg_constraint
WHERE connamespace='public'::regnamespace AND conrelid='public.impact_transactions'::regclass;

-- 8f) user_id vs profile_id: verifica convenzione sulle tabelle chiave
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema='public'
  AND table_name IN ('user_pois','impact_transactions','scans','poi_ble_fingerprints')
  AND column_name IN ('user_id','profile_id')
ORDER BY table_name, column_name;

-- 8g) Esistono le tabelle citate dalla mappa SSOT?
SELECT c.relname AS object_name,
       CASE c.relkind WHEN 'r' THEN 'table' WHEN 'v' THEN 'view' WHEN 'm' THEN 'matview' ELSE c.relkind::text END AS kind
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname='public'
  AND c.relname IN ('scans','loto_squads','crowd_predictions','impact_transactions',
                    'esg_raw_logs','poi_ble_fingerprints','vw_pois_frontend',
                    'vw_collective_impact','vw_admin_checkins_analytics')
ORDER BY c.relname;
'@
    Set-Content -LiteralPath $IntroOut -Value $sql -Encoding UTF8
    Write-Info "Pack introspezione scritto: $IntroOut"
}

$resolved = Resolve-Backend -Requested $Backend -Url $DbUrl
Write-Info "Modalita: $Mode | Backend: $resolved"

if ($Mode -eq 'Introspection') {
    Write-IntrospectionFile
    return
}

switch ($Mode) {

    'Schema' {
        if ($resolved -eq 'PgDump') {
            if ([string]::IsNullOrWhiteSpace($DbUrl)) { throw "Modalita' PgDump richiede -DbUrl." }
            if (-not (Get-Command pg_dump -ErrorAction SilentlyContinue)) { throw "pg_dump non trovato nel PATH." }
            Write-Info "pg_dump --schema-only --schema=$SchemaName -> $SchemaOut"
            & pg_dump $DbUrl --schema-only --no-owner --schema=$SchemaName -f $SchemaOut
            if ($LASTEXITCODE -ne 0) { throw "pg_dump fallito (exit $LASTEXITCODE)." }
        } else {
            Invoke-Cli ((@('db', 'dump', '--schema', $SchemaName, '-f', $SchemaOut)) + (Get-ConnArgs))
        }
        $h = (Get-FileHash -LiteralPath $SchemaOut -Algorithm SHA256).Hash
        Write-Info "Schema dump: $SchemaOut  (SHA256 $($h.Substring(0,16))...)"
    }

    'Data' {
        Write-Warn2 "Il dump dati puo' contenere PII/geolocalizzazioni: NON committare $DataOut."
        if ($resolved -eq 'PgDump') {
            if ([string]::IsNullOrWhiteSpace($DbUrl)) { throw "Modalita' PgDump richiede -DbUrl." }
            & pg_dump $DbUrl --data-only --no-owner --schema=$SchemaName -f $DataOut
            if ($LASTEXITCODE -ne 0) { throw "pg_dump (data) fallito (exit $LASTEXITCODE)." }
        } else {
            Invoke-Cli ((@('db', 'dump', '--data-only', '--schema', $SchemaName, '-f', $DataOut)) + (Get-ConnArgs))
        }
        Write-Info "Data dump: $DataOut"
    }

    'Types' {
        Write-Info "Genero tipi TypeScript -> $TypesOut"
        $args = if ($DbUrl) { @('gen', 'types', 'typescript', '--db-url', $DbUrl, '--schema', $SchemaName) }
                elseif ($ProjectRef) { @('gen', 'types', 'typescript', '--project-id', $ProjectRef, '--schema', $SchemaName) }
                else { @('gen', 'types', 'typescript', '--linked', '--schema', $SchemaName) }
        & npx supabase @args | Set-Content -LiteralPath $TypesOut -Encoding UTF8
        if ($LASTEXITCODE -ne 0) { throw "supabase gen types fallito (exit $LASTEXITCODE)." }
        Write-Info "Tipi generati: $TypesOut"
        Write-Info "Ricorda: in utils/supabase.ts usare createClient<Database>(...) importando da '../types/database'."
    }

    'Diff' {
        Invoke-Cli ((@('db', 'diff')) + (Get-ConnArgs))
        Write-Info "Se compaiono differenze -> modifiche out-of-band: riconciliare via migrazioni."
    }

    'Baseline' {
        $stamp = Get-Date -Format 'yyyyMMddHHmmss'
        Invoke-Cli ((@('db', 'pull', 'remote_baseline', '--schema', $SchemaName)) + (Get-ConnArgs))
        Write-Info "Baseline creata in supabase/migrations (attesa: ${stamp}_remote_baseline.sql)."
        Write-Info "Verificare e committare la migrazione baseline, poi usare SOLO migrazioni versionate."
    }

    'All' {
        & $PSCommandPath -Mode Schema  -Backend $Backend -ProjectRef $ProjectRef -DbUrl $DbUrl -SchemaName $SchemaName
        & $PSCommandPath -Mode Types   -Backend $Backend -ProjectRef $ProjectRef -DbUrl $DbUrl -SchemaName $SchemaName
        & $PSCommandPath -Mode Diff    -Backend $Backend -ProjectRef $ProjectRef -DbUrl $DbUrl -SchemaName $SchemaName
    }
}
