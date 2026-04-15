param(
    [switch]$BackendOnly,
    [switch]$FrontendOnly
)

$ErrorActionPreference = "Stop"

if ($BackendOnly -and $FrontendOnly)
{
    throw "Choose either -BackendOnly or -FrontendOnly, not both."
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $repoRoot "src/backend"
$frontendDir = Join-Path $repoRoot "src/frontend"

# ── Docker Engine ────────────────────────────────────────────────────────────
Write-Host "Checking Docker Engine..."
$dockerReady = $false
for ($attempt = 1; $attempt -le 30; $attempt++)
{
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -eq 0)
    {
        $dockerReady = $true
        break
    }

    if ($attempt -eq 1)
    {
        Write-Host "Docker Engine not running. Attempting to start Docker Desktop..."
        $dockerDesktopPath = "${env:ProgramFiles}\Docker\Docker\Docker Desktop.exe"
        if (Test-Path $dockerDesktopPath)
        {
            Start-Process $dockerDesktopPath
        }
        else
        {
            throw "Docker Desktop not found at '$dockerDesktopPath'. Please start Docker Desktop manually and re-run this script."
        }
    }

    Write-Host "  Waiting for Docker Engine to start (attempt $attempt/30)..."
    Start-Sleep -Seconds 5
}

if (-not $dockerReady)
{
    throw "Docker Engine did not become ready after 150 seconds. Please start Docker Desktop manually and re-run this script."
}

Write-Host "Docker Engine is ready."

# ── PostgreSQL container ─────────────────────────────────────────────────────
Write-Host "Ensuring PostgreSQL container is running..."
Push-Location $repoRoot
try
{
    docker compose up -d postgres 2>&1 | Out-Null
}
finally
{
    Pop-Location
}

Write-Host "Waiting for PostgreSQL to be healthy..."
$pgReady = $false
for ($attempt = 1; $attempt -le 24; $attempt++)
{
    $health = docker inspect --format "{{.State.Health.Status}}" kwintbaseharmony-postgres-1 2>&1
    if ($health -eq "healthy")
    {
        $pgReady = $true
        break
    }
    Write-Host "  PostgreSQL health: $health (attempt $attempt/24)..."
    Start-Sleep -Seconds 5
}

if (-not $pgReady)
{
    throw "PostgreSQL did not become healthy after 120 seconds. Check 'docker compose logs postgres' for details."
}

Write-Host "PostgreSQL is healthy."
Write-Host ""

$backendCommand = @(
    "Set-Location '$backendDir'",
    "`$env:DOTNET_ENVIRONMENT='Development'",
    "dapr run --app-id kwintbaseharmony-api --app-port 5000 --dapr-http-port 3500 --dapr-grpc-port 50001 --resources-path ./components --config ../../.dapr/config.yaml -- dotnet run --no-launch-profile --urls http://localhost:5000"
) -join "; "

$frontendCommand = @(
    "Set-Location '$frontendDir'",
    "`$env:DOTNET_ENVIRONMENT='Development'",
    "dapr run --app-id kwintbaseharmony-frontend --app-port 5051 --dapr-http-port 3510 --dapr-grpc-port 50011 -- dotnet run --no-launch-profile --urls http://localhost:5051"
) -join "; "

if (-not $FrontendOnly)
{
    Start-Process pwsh -ArgumentList "-NoExit", "-Command", $backendCommand | Out-Null
}

if (-not $BackendOnly)
{
    Start-Process pwsh -ArgumentList "-NoExit", "-Command", $frontendCommand | Out-Null
}

Write-Host "Started Dapr app windows for KwintBaseHarmony."
Write-Host "Backend:  http://localhost:5000 (Dapr HTTP: http://localhost:3500)"
Write-Host "Frontend: http://localhost:5051 (Dapr HTTP: http://localhost:3510)"