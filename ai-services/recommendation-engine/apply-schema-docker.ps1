# Apply recommendation schema using the MySQL client inside the Docker container.
# Requires: docker compose already up, container name recommendation-engine-mysql
# Run from this folder:  .\apply-schema-docker.ps1
# If you changed password/DB in docker-compose, pass: -Password "..." -Database "exp"

param(
    [string] $Container = "recommendation-engine-mysql",
    [string] $Password = "rootpass",
    [string] $Database = "exp"
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$files = @(
    "schema\001_recommendation_tables.sql"
)

$running = docker ps --filter "name=$Container" --format "{{.Names}}" 2>$null
if (-not $running) {
    Write-Error "Container '$Container' is not running. Run: docker compose up -d"
}

foreach ($f in $files) {
    if (-not (Test-Path $f)) {
        Write-Error "Missing file: $f"
    }
    Write-Host "Applying $f ..."
    Get-Content $f -Raw | docker exec -i $Container mysql -uroot "-p$Password" $Database
    if ($LASTEXITCODE -ne 0) {
        Write-Error "mysql failed on $f (exit $LASTEXITCODE). If FK errors: import main app schema into '$Database' first."
    }
}

Write-Host "Done. Tables should exist in database '$Database'."
