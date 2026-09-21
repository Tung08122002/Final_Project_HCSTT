param([switch]$Setup)
$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
$backendRoot = Join-Path $projectRoot 'backend'
$frontendRoot = Join-Path $projectRoot 'frontend'
$pythonPath = Join-Path $backendRoot '.venv\Scripts\python.exe'
$runtimeRoot = Join-Path $projectRoot '.runtime'
New-Item -ItemType Directory -Force -Path $runtimeRoot | Out-Null
if (-not (Test-Path -LiteralPath (Join-Path $backendRoot '.env'))) {
    Copy-Item -LiteralPath (Join-Path $backendRoot '.env.example') -Destination (Join-Path $backendRoot '.env')
}

if (-not (Test-Path -LiteralPath $pythonPath)) {
    & python -m venv (Join-Path $backendRoot '.venv')
    if ($LASTEXITCODE -ne 0) { throw 'Cannot create Python environment.' }
    $Setup = $true
}
if ($Setup) {
    & $pythonPath -m pip install -r (Join-Path $backendRoot 'requirements.txt')
    if ($LASTEXITCODE -ne 0) { throw 'Backend install failed.' }
}
if ($Setup -or -not (Test-Path -LiteralPath (Join-Path $backendRoot 'data\laptop_advisor.db'))) {
    & $pythonPath (Join-Path $backendRoot 'scripts\setup.py') --excel (Join-Path $projectRoot 'Laptop_data.xlsx')
    if ($LASTEXITCODE -ne 0) { throw 'Database setup failed.' }
}
if ($Setup -or -not (Test-Path -LiteralPath (Join-Path $frontendRoot 'node_modules'))) {
    Push-Location $frontendRoot
    try { & npm.cmd ci; if ($LASTEXITCODE -ne 0) { throw 'Frontend install failed.' } }
    finally { Pop-Location }
}

$started = @()
if (-not (Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue)) {
    $process = Start-Process -FilePath $pythonPath -ArgumentList '-m','uvicorn','app.main:app','--host','127.0.0.1','--port','8000' -WorkingDirectory $backendRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $runtimeRoot 'backend.log') -RedirectStandardError (Join-Path $runtimeRoot 'backend-error.log') -PassThru
    $started += @{ id = $process.Id; marker = $pythonPath }
} else { Write-Host 'Port 8000 already in use; keeping the existing service.' }
if (-not (Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue)) {
    $vitePath = Join-Path $frontendRoot 'node_modules\vite\bin\vite.js'
    $process = Start-Process -FilePath 'node.exe' -ArgumentList ('"' + $vitePath + '"'),'--host','127.0.0.1' -WorkingDirectory $frontendRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $runtimeRoot 'frontend.log') -RedirectStandardError (Join-Path $runtimeRoot 'frontend-error.log') -PassThru
    $started += @{ id = $process.Id; marker = $vitePath }
} else { Write-Host 'Port 5173 already in use; keeping the existing service.' }
$pidFile = Join-Path $runtimeRoot 'processes.json'
$previous = @()
if (Test-Path -LiteralPath $pidFile) { $previous = Get-Content -LiteralPath $pidFile -Raw | ConvertFrom-Json }
ConvertTo-Json -InputObject @($previous + $started) | Set-Content -LiteralPath $pidFile -Encoding UTF8
Write-Host 'Frontend: http://127.0.0.1:5173'
Write-Host 'API docs: http://127.0.0.1:8000/docs'
Write-Host 'Logs: .runtime/   Stop: .\stop-local.ps1'
