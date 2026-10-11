<#
  handoff.ps1 — verifica d'integrita' del manifest di riavvio.

  Uso (da C:\loto_app, in una finestra nuova):
      powershell -ExecutionPolicy Bypass -File .\handoff.ps1
      powershell -ExecutionPolicy Bypass -File .\handoff.ps1 -Lock

  -Lock  fissa l'impronta SHA256 di ogni script di misura in
         supabase/diagnostica_fase0/SHA256SUMS.txt.
         Va rifatto SOLO dopo aver deliberatamente creato o modificato uno
         script, mai per "far tornare verde": quello falsifica la prova.

  Cosa fa:
    1. Legge HANDOFF.md
    2. Estrae il blocco "FILE RICHIESTI" (fonte unica: niente regex sul testo)
    3. Verifica l'esistenza di ogni file dichiarato
    4. Stampa la PROSSIMA AZIONE dichiarata nel manifest

  Convenzione del blocco:
      una riga per file, percorso relativo alla root
      !prefisso  -> gap dichiarato: deve mancare finche' non e' scritto.
                    Quando esiste diventa OK ("gap chiuso"), non un errore.
      # riga      -> commento, ignorata

  Non tocca nessun dato. Non esegue SQL. Non scrive nulla.

  Se qualcosa risulta MANCANTE, il manifest e' corrotto: non fidarti di lui,
  non proseguire, dichiara il problema all'umano.
#>
param([switch]$Lock)

$ErrorActionPreference = 'Continue'
$root = $PSScriptRoot
if (-not $root) { $root = (Get-Location).Path }

$handoff = Join-Path $root 'HANDOFF.md'

Write-Host ''
Write-Host '=== HANDOFF INTEGRITY CHECK ===' -ForegroundColor Cyan
Write-Host ("root: " + $root)
Write-Host ''

if (-not (Test-Path -LiteralPath $handoff)) {
    Write-Host 'CRITICO: HANDOFF.md non trovato.' -ForegroundColor Red
    Write-Host 'Il manifest di riavvio non esiste: non c''e'' protocollo di ripresa.'
    exit 1
}

$lines = Get-Content -LiteralPath $handoff

# --- isola il blocco FILE RICHIESTI -----------------------------------------
$hdrIdx = -1
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match 'FILE RICHIESTI') { $hdrIdx = $i; break }
}

if ($hdrIdx -lt 0) {
    Write-Host 'CRITICO: blocco "FILE RICHIESTI" assente in HANDOFF.md.' -ForegroundColor Red
    Write-Host 'Senza elenco esplicito non c''e'' nulla da verificare: manifest inutilizzabile.'
    exit 1
}

$endIdx = -1
for ($i = $hdrIdx; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '-->') { $endIdx = $i; break }
}

if ($endIdx -lt 0) {
    Write-Host 'CRITICO: chiusura del commento ( --> ) assente nel blocco FILE RICHIESTI.' -ForegroundColor Red
    exit 1
}

$entries = @()
for ($i = $endIdx + 1; $i -lt $lines.Count; $i++) {
    $l = ($lines[$i]).Trim()
    if ($l -eq '' -or $l.StartsWith('#')) { continue }
    $entries += $l
}

if ($entries.Count -eq 0) {
    Write-Host 'CRITICO: blocco FILE RICHIESTI vuoto.' -ForegroundColor Red
    exit 1
}

# --- verifica ----------------------------------------------------------------
$required    = @()
$gaps        = @()
$missing     = @()
$declaredSql = @()
$present     = 0

foreach ($e in $entries) {
    $isGap = $e.StartsWith('!')
    $rel   = $e
    if ($isGap) { $rel = $e.Substring(1) }
    if ((-not $isGap) -and $rel.EndsWith('.sql')) { $declaredSql += $rel }
    $p = Join-Path $root ($rel -replace '/', '\')

    if (Test-Path -LiteralPath $p) {
        if ($isGap) {
            Write-Host ("  OK       " + $rel + "  (gap chiuso: ora esiste)") -ForegroundColor Green
        } else {
            Write-Host ("  OK       " + $rel) -ForegroundColor Green
        }
        $present++
    } else {
        if ($isGap) {
            Write-Host ("  DA CREARE " + $rel) -ForegroundColor Yellow
            $gaps += $rel
        } else {
            Write-Host ("  MANCANTE " + $rel) -ForegroundColor Red
            $missing += $rel
        }
    }
}

# --- script NON dichiarati nel manifest --------------------------------------
# Un file creato e non elencato e' un file che nessuno sa di avere: puo'
# contenere una misura che nessuno ha validato, o una scrittura.
$sqlDir = Join-Path $root (Join-Path 'supabase' 'diagnostica_fase0')
Write-Host ''
Write-Host '-- script dichiarati vs presenti --' -ForegroundColor Yellow
$undeclared = @()
if (Test-Path -LiteralPath $sqlDir) {
    foreach ($f in (Get-ChildItem -LiteralPath $sqlDir -Filter '*.sql')) {
        $rel = 'supabase/diagnostica_fase0/' + $f.Name
        if ($declaredSql -notcontains $rel) {
            Write-Host ("  NON DICHIARATO " + $rel) -ForegroundColor Red
            $undeclared += $rel
            $missing += ('non dichiarato: ' + $rel)
        }
    }
    if ($undeclared.Count -eq 0) {
        Write-Host '  tutti gli script sono nel manifest' -ForegroundColor Green
    }
} else {
    Write-Host '  cartella diagnostica assente' -ForegroundColor Red
    $missing += 'supabase/diagnostica_fase0/'
}

# --- impronta degli script di misura -----------------------------------------
# Le misure sono la prova. Un file di misura modificato in silenzio falsifica
# il record: l'impronta rende la modifica rilevabile.
Write-Host ''
Write-Host '-- impronta SHA256 degli script --' -ForegroundColor Yellow

$sqlDir = Join-Path $root (Join-Path 'supabase' 'diagnostica_fase0')
$sums   = Join-Path $sqlDir 'SHA256SUMS.txt'

if (-not (Test-Path -LiteralPath $sqlDir)) {
    Write-Host '  PERCORSO ASSENTE: supabase/diagnostica_fase0' -ForegroundColor Red
    $missing += 'supabase/diagnostica_fase0/'
} elseif ($Lock) {
    $sumLines = @()
    foreach ($f in (Get-ChildItem -LiteralPath $sqlDir -Filter '*.sql' | Sort-Object Name)) {
        $h = (Get-FileHash -LiteralPath $f.FullName -Algorithm SHA256).Hash.ToLower()
        $sumLines += ($h + '  ' + $f.Name)
        Write-Host ("  LORDETTO  " + $f.Name) -ForegroundColor Green
    }
    Set-Content -LiteralPath $sums -Value $sumLines -Encoding ASCII
    Write-Host ("  " + $sums + " scritto.") -ForegroundColor Green
    $present++
} elseif (Test-Path -LiteralPath $sums) {
    $locked = @{}
    foreach ($line in (Get-Content -LiteralPath $sums)) {
        if ($line.Trim() -eq '') { continue }
        $parts = $line -split '\s+', 2
        if ($parts.Count -eq 2) { $locked[$parts[1].Trim()] = $parts[0].ToLower() }
    }
    $now = @{}
    foreach ($f in (Get-ChildItem -LiteralPath $sqlDir -Filter '*.sql')) {
        $now[$f.Name] = (Get-FileHash -LiteralPath $f.FullName -Algorithm SHA256).Hash.ToLower()
    }
    foreach ($k in $locked.Keys) {
        if (-not $now.ContainsKey($k)) {
            Write-Host ("  RIMOSSO   " + $k) -ForegroundColor Red
            $missing += ('SHA256: rimosso ' + $k)
        } elseif ($now[$k] -ne $locked[$k]) {
            Write-Host ("  MODIFICATO " + $k) -ForegroundColor Red
            $missing += ('SHA256: modificato ' + $k)
        } else {
            Write-Host ("  INVARIATO  " + $k) -ForegroundColor Green
        }
    }
    foreach ($k in $now.Keys) {
        if (-not $locked.ContainsKey($k)) {
            Write-Host ("  NUOVO     " + $k) -ForegroundColor Yellow
            $missing += ('SHA256: nuovo, non coperto ' + $k)
        }
    }
    $present++
} else {
    Write-Host '  NESSUNA IMPRONTA: esegui con -Lock per fissarle.' -ForegroundColor Yellow
    $gaps += 'SHA256SUMS.txt (impronte non ancora fissate)'
}

# --- prossima azione ---------------------------------------------------------
Write-Host ''
Write-Host '-- prossima azione (letta dal manifest) --' -ForegroundColor Yellow
$next = $lines | Where-Object { $_ -match 'PROSSIMA AZIONE' } | Select-Object -First 1
if ($next) {
    Write-Host ('  ' + $next.Trim()) -ForegroundColor White
} else {
    Write-Host '  NON DICHIARATA nel manifest.' -ForegroundColor Red
    $missing += '(PROSSIMA AZIONE non dichiarata)'
}

# --- riepilogo ---------------------------------------------------------------
Write-Host ''
Write-Host '=== ESITO ===' -ForegroundColor Cyan
Write-Host ("  file dichiarati: " + $entries.Count)
Write-Host ("  checkpoint ok : " + $present)
Write-Host ("  gap aperti     : " + $gaps.Count)
Write-Host ("  mancanti       : " + $missing.Count)

if ($missing.Count -gt 0) {
    Write-Host ''
    Write-Host '  MANIFEST CORROTTO.' -ForegroundColor Red
    Write-Host '  Non fidarti di HANDOFF.md e non proseguire: dichiara il problema.'
    foreach ($m in $missing) { Write-Host ("    - " + $m) -ForegroundColor Red }
    exit 1
}

if ($gaps.Count -gt 0) {
    Write-Host ''
    Write-Host '  MANIFEST INTEGRO, con lavoro ancora da fare:' -ForegroundColor Yellow
    foreach ($g in $gaps) { Write-Host ("    - " + $g) -ForegroundColor Yellow }
    exit 0
}

Write-Host ''
Write-Host '  MANIFEST INTEGRO. Prosegui con l''ordine di lettura del section 2.' -ForegroundColor Green
exit 0
