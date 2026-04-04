# Quick check: is PostgreSQL accepting connections on this Windows machine?
# Usage (PowerShell): .\scripts\check-postgres-windows.ps1
# See DEPLOYMENT.md section 3 (Windows).

param(
    [string]$Host = "127.0.0.1",
    [int]$Port = 5432
)

Write-Host "Checking TCP $Host`:$Port ..."
try {
    $r = Test-NetConnection -ComputerName $Host -Port $Port -WarningAction SilentlyContinue
    if ($r.TcpTestSucceeded) {
        Write-Host "OK: something is listening on $Host`:$Port (likely PostgreSQL)." -ForegroundColor Green
        exit 0
    }
} catch {
    # Older PowerShell / restricted environments
}

Write-Host "FAIL: nothing reachable on $Host`:$Port." -ForegroundColor Red
Write-Host "Start the PostgreSQL Windows service (services.msc) or fix install/port. See DEPLOYMENT.md §3."
exit 1
