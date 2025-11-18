# Test Script für Railway API
# Usage: .\test-api.ps1

# TLS 1.2 aktivieren (für ältere PowerShell Versionen)
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# Update this URL to your VPS IP or domain
$serviceUrl = "http://YOUR_VPS_IP:8000"
$apiKey = "JC!Pferdestall"

Write-Host "=== Testing FritzBox Service ===" -ForegroundColor Cyan
Write-Host "Service URL: $serviceUrl" -ForegroundColor Yellow
Write-Host "API Key: $apiKey" -ForegroundColor Yellow
Write-Host ""

# Test 1: Health Check
Write-Host "1. Testing Health Endpoint..." -ForegroundColor Green
try {
    $health = Invoke-RestMethod -Uri "$serviceUrl/health"
    Write-Host "✅ Health Check erfolgreich!" -ForegroundColor Green
    $health | ConvertTo-Json
} catch {
    Write-Host "❌ Health Check fehlgeschlagen: $_" -ForegroundColor Red
}
Write-Host ""

# Test 2: Root Endpoint
Write-Host "2. Testing Root Endpoint..." -ForegroundColor Green
try {
    $root = Invoke-RestMethod -Uri "$serviceUrl/"
    Write-Host "✅ Root Endpoint erfolgreich!" -ForegroundColor Green
    $root | ConvertTo-Json
} catch {
    Write-Host "❌ Root Endpoint fehlgeschlagen: $_" -ForegroundColor Red
}
Write-Host ""

# Test 3: Check Devices (mit API Key)
Write-Host "3. Testing Check Devices Endpoint..." -ForegroundColor Green
try {
    $devices = Invoke-RestMethod -Uri "$serviceUrl/check-devices" `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $apiKey"
            "Content-Type" = "application/json"
        }
    Write-Host "✅ Check Devices erfolgreich!" -ForegroundColor Green
    $devices | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ Check Devices fehlgeschlagen: $_" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response)" -ForegroundColor Yellow
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    }
}
Write-Host ""

Write-Host "=== Test abgeschlossen ===" -ForegroundColor Cyan

