# PowerShell API Test - Richtige Syntax

## Problem

PowerShell hat `curl` als Alias für `Invoke-WebRequest`, aber die Syntax ist anders als Unix curl.

## Lösung: PowerShell-Syntax verwenden

### Option 1: Invoke-WebRequest (PowerShell Native)

```powershell
# POST Request mit Authorization Header
Invoke-WebRequest -Uri "https://adequate-bravery-production-3a76.up.railway.app/check-devices" `
  -Method POST `
  -Headers @{
    "Authorization" = "Bearer JC!Pferdestall"
    "Content-Type" = "application/json"
  }
```

### Option 2: Invoke-RestMethod (Empfohlen für JSON)

```powershell
# POST Request - gibt direkt JSON zurück
$response = Invoke-RestMethod -Uri "https://adequate-bravery-production-3a76.up.railway.app/check-devices" `
  -Method POST `
  -Headers @{
    "Authorization" = "Bearer JC!Pferdestall"
    "Content-Type" = "application/json"
  }

# Zeige Response
$response | ConvertTo-Json
```

### Option 3: curl.exe (Windows curl)

Falls du die echte curl.exe verwendest (nicht das PowerShell Alias):

```powershell
# Verwende curl.exe statt curl
curl.exe -X POST https://adequate-bravery-production-3a76.up.railway.app/check-devices `
  -H "Authorization: Bearer JC!Pferdestall" `
  -H "Content-Type: application/json"
```

## Komplette Test-Beispiele

### Test 1: Health Check (kein API Key nötig)

```powershell
# Einfach
Invoke-RestMethod -Uri "https://adequate-bravery-production-3a76.up.railway.app/health"
```

### Test 2: Check Devices (mit API Key)

```powershell
# Mit API Key
$apiKey = "JC!Pferdestall"
$response = Invoke-RestMethod -Uri "https://adequate-bravery-production-3a76.up.railway.app/check-devices" `
  -Method POST `
  -Headers @{
    "Authorization" = "Bearer $apiKey"
    "Content-Type" = "application/json"
  }

# Zeige Ergebnis
$response | ConvertTo-Json -Depth 10
```

### Test 3: Als Script speichern

Erstelle `test-api.ps1`:

```powershell
# test-api.ps1
$serviceUrl = "https://adequate-bravery-production-3a76.up.railway.app"
$apiKey = "JC!Pferdestall"

Write-Host "Testing Health Endpoint..." -ForegroundColor Cyan
$health = Invoke-RestMethod -Uri "$serviceUrl/health"
$health | ConvertTo-Json

Write-Host "`nTesting Check Devices Endpoint..." -ForegroundColor Cyan
$devices = Invoke-RestMethod -Uri "$serviceUrl/check-devices" `
  -Method POST `
  -Headers @{
    "Authorization" = "Bearer $apiKey"
    "Content-Type" = "application/json"
  }
$devices | ConvertTo-Json -Depth 10
```

Dann ausführen:
```powershell
.\test-api.ps1
```

## Wichtig: API Key in Railway setzen

Bevor du testest, stelle sicher, dass der API Key in Railway gesetzt ist:

1. Railway Dashboard → Service → Variables
2. `FRITZ_SERVICE_API_KEY` = `JC!Pferdestall`

## Fehlerbehebung

### "Invalid API key"
- Prüfe ob `FRITZ_SERVICE_API_KEY` in Railway Variables gesetzt ist
- Prüfe ob der Key identisch ist (Groß-/Kleinschreibung beachten!)

### "Missing Authorization header"
- Stelle sicher, dass der Header korrekt gesetzt ist
- Format: `Authorization: Bearer [key]`

### PowerShell Syntax Fehler
- Verwende Backtick `` ` `` für Zeilenumbrüche
- Oder verwende `Invoke-RestMethod` statt `curl`

