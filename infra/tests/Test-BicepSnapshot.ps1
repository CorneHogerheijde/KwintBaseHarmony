#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Validates infra/main.bicep has not drifted from the committed snapshot.

.DESCRIPTION
    Uses the native Bicep CLI snapshot command (v0.36.1+) to compare the current
    Bicep template against the committed baseline at infra/main.test.snapshot.json.

    To update the baseline after an intentional Bicep change, run:
      bicep snapshot infra/main.test.bicepparam --mode overwrite
    then commit infra/main.test.snapshot.json.

    Requires the Bicep CLI:
      https://github.com/Azure/bicep/releases (v0.36.1+)

.EXAMPLE
    pwsh -NoProfile -File infra/tests/Test-BicepSnapshot.ps1
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if (-not (Get-Command bicep -ErrorAction SilentlyContinue)) {
    Write-Error "bicep CLI not found. Install v0.36.1+ from https://github.com/Azure/bicep/releases"
    exit 1
}

$paramsFile = Resolve-Path (Join-Path $PSScriptRoot '../main.test.bicepparam')
$snapshotFile = Join-Path $PSScriptRoot '../main.test.snapshot.json'

Write-Host "Validating : $paramsFile"
Write-Host "Baseline   : $(Resolve-Path $snapshotFile)"
Write-Host ""

bicep snapshot $paramsFile --mode validate

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Snapshot drift detected. If the change is intentional, update the baseline:" -ForegroundColor Yellow
    Write-Host "  bicep snapshot infra/main.test.bicepparam --mode overwrite" -ForegroundColor Yellow
    Write-Host "Then commit infra/main.test.snapshot.json." -ForegroundColor Yellow
    exit 1
}

Write-Host "No drift detected." -ForegroundColor Green
exit 0
