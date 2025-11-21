# PowerShell Script to test the check-devices Edge Function
# Usage: .\scripts\test-edge-function.ps1

# Get Supabase URL and Anon Key from environment or .env file
$supabaseUrl = $env:REACT_APP_SUPABASE_URL
$supabaseAnonKey = $env:REACT_APP_SUPABASE_ANON_KEY

# If not in environment, try to read from .env file
if (-not $supabaseUrl -or -not $supabaseAnonKey) {
    $envPath = ".env"
    if (Test-Path $envPath) {
        Get-Content $envPath | ForEach-Object {
            if ($_ -match '^REACT_APP_SUPABASE_URL=(.+)$') {
                $supabaseUrl = $matches[1].Trim('"').Trim("'")
            }
            if ($_ -match '^REACT_APP_SUPABASE_ANON_KEY=(.+)$') {
                $supabaseAnonKey = $matches[1].Trim('"').Trim("'")
            }
        }
    }
}

if (-not $supabaseUrl -or -not $supabaseAnonKey) {
    Write-Host "Error: Supabase URL or Anon Key not found!" -ForegroundColor Red
    Write-Host "Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY" -ForegroundColor Yellow
    Write-Host "Or add them to your .env file" -ForegroundColor Yellow
    exit 1
}

# Edge Function endpoint
$edgeFunctionUrl = "$supabaseUrl/functions/v1/check-devices"

Write-Host "=== Testing check-devices Edge Function ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Supabase URL: $supabaseUrl" -ForegroundColor Gray
Write-Host "Edge Function: $edgeFunctionUrl" -ForegroundColor Gray
Write-Host ""

# Test request
Write-Host "Sending POST request..." -ForegroundColor Yellow

try {
    $headers = @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $supabaseAnonKey"
    }

    $body = @{
        name = "Functions"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri $edgeFunctionUrl -Method POST -Headers $headers -Body $body -ErrorAction Stop

    Write-Host "=== Response ===" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 10) -ForegroundColor White
    Write-Host ""

    # Display formatted results
    if ($response.success) {
        Write-Host "Status: SUCCESS" -ForegroundColor Green
        Write-Host "Has New Devices: $($response.has_new_devices)" -ForegroundColor $(if ($response.has_new_devices) { "Red" } else { "Green" })
        Write-Host "Is Occupied: $($response.is_occupied)" -ForegroundColor $(if ($response.is_occupied) { "Red" } else { "Green" })
        Write-Host "Message: $($response.message)" -ForegroundColor White
        Write-Host "Device Count: $($response.device_count)" -ForegroundColor White
        Write-Host "Timestamp: $($response.timestamp)" -ForegroundColor Gray
        
        if ($response.devices -and $response.devices.Count -gt 0) {
            Write-Host ""
            Write-Host "New Devices:" -ForegroundColor Yellow
            $response.devices | ForEach-Object {
                Write-Host "  - $($_.hostname) ($($_.ip))" -ForegroundColor White
            }
        }
    } else {
        Write-Host "Status: FAILED" -ForegroundColor Red
        if ($response.error) {
            Write-Host "Error: $($response.error)" -ForegroundColor Red
        }
    }

} catch {
    Write-Host "=== Error ===" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "Error Message: $($_.Exception.Message)" -ForegroundColor Red
    
    # Try to get error details from response
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Cyan

