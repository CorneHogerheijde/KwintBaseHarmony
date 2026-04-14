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