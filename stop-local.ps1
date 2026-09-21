$ErrorActionPreference = 'Stop'
$pidFile = Join-Path $PSScriptRoot '.runtime\processes.json'
if (-not (Test-Path -LiteralPath $pidFile)) { Write-Host 'No saved processes.'; exit }
$saved = Get-Content -LiteralPath $pidFile -Raw | ConvertFrom-Json
foreach ($entry in $saved) {
    $process = Get-CimInstance Win32_Process -Filter "ProcessId = $($entry.id)" -ErrorAction SilentlyContinue
    if ($process -and $process.CommandLine -and $process.CommandLine.Contains($entry.marker)) {
        # venv launchers can start a child Python process. Verify children belong to uvicorn.
        Get-CimInstance Win32_Process -Filter "ParentProcessId = $($entry.id)" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -match 'uvicorn app.main:app' } | ForEach-Object { Stop-Process -Id $_.ProcessId -ErrorAction SilentlyContinue }
        Stop-Process -Id $entry.id -ErrorAction SilentlyContinue
        Write-Host "Stopped project process $($entry.id)."
    }
}
Remove-Item -LiteralPath $pidFile
