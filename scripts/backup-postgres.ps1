# PostgreSQL logical backup (custom format). Requires pg_dump on PATH (PostgreSQL bin).
# Usage: set DATABASE_URL in the environment, then:
#   powershell -ExecutionPolicy Bypass -File .\scripts\backup-postgres.ps1
# Optional first argument: output directory (default .\backups)

param(
    [string]$OutDir = ".\backups"
)

if (-not $env:DATABASE_URL) {
    Write-Error "DATABASE_URL environment variable is required."
    exit 1
}

if (-not (Get-Command pg_dump -ErrorAction SilentlyContinue)) {
    Write-Error "pg_dump not found. Add PostgreSQL bin to PATH (e.g. C:\Program Files\PostgreSQL\16\bin)."
    exit 1
}

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$file = Join-Path $OutDir "flowforge-$stamp.dump"

& pg_dump --dbname=$env:DATABASE_URL -Fc -f $file
Write-Host "Wrote $file"
