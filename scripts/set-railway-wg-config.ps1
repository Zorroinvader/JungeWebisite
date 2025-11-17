# PowerShell Script to set WG_CONFIG in Railway
# Usage: .\scripts\set-railway-wg-config.ps1

Write-Host "Setting WG_CONFIG in Railway..." -ForegroundColor Cyan

# Check if railway CLI is installed
$railwayInstalled = Get-Command railway -ErrorAction SilentlyContinue
if (-not $railwayInstalled) {
    Write-Host "Railway CLI not found. Installing..." -ForegroundColor Yellow
    npm i -g @railway/cli
}

# Check if we're in a Railway project
$railwayLinked = Test-Path .railway
if (-not $railwayLinked) {
    Write-Host "Not linked to Railway project. Linking..." -ForegroundColor Yellow
    railway link
}

# Read the config file
$configPath = "src/services/wg_config.conf"
if (-not (Test-Path $configPath)) {
    Write-Host "Error: $configPath not found!" -ForegroundColor Red
    exit 1
}

$config = Get-Content $configPath -Raw

# Set the variable
Write-Host "Setting WG_CONFIG variable..." -ForegroundColor Cyan
railway variables set WG_CONFIG="$config"

Write-Host "✅ WG_CONFIG set successfully!" -ForegroundColor Green
Write-Host "You may need to redeploy for changes to take effect." -ForegroundColor Yellow

