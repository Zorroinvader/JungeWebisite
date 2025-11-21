# Test EC2 Service Connection
# Tests if the EC2 service is reachable from your PC

$ec2Ip = "54.235.232.105"
$ec2Port = 8000
$ec2Url = "http://${ec2Ip}:${ec2Port}"

Write-Host "=== EC2 Connection Test ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Ping (Basic connectivity)
Write-Host "1. Testing Ping..." -ForegroundColor Yellow
try {
    $pingResult = Test-Connection -ComputerName $ec2Ip -Count 2 -ErrorAction Stop
    Write-Host "   ✅ Ping successful" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Ping failed: $_" -ForegroundColor Red
    Write-Host "   → EC2 instance might be down or unreachable" -ForegroundColor Yellow
}

Write-Host ""

# Test 2: Port 8000 connectivity
Write-Host "2. Testing Port $ec2Port connectivity..." -ForegroundColor Yellow
try {
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    $connect = $tcpClient.BeginConnect($ec2Ip, $ec2Port, $null, $null)
    $wait = $connect.AsyncWaitHandle.WaitOne(5000, $false)
    
    if ($wait) {
        $tcpClient.EndConnect($connect)
        Write-Host "   ✅ Port $ec2Port is open" -ForegroundColor Green
        $tcpClient.Close()
    } else {
        Write-Host "   ❌ Port $ec2Port connection timeout" -ForegroundColor Red
        Write-Host "   → Check: EC2 Security Group allows port $ec2Port" -ForegroundColor Yellow
        Write-Host "   → Check: Firewall (ufw) allows port $ec2Port on EC2" -ForegroundColor Yellow
        $tcpClient.Close()
    }
} catch {
    Write-Host "   ❌ Port $ec2Port connection failed: $_" -ForegroundColor Red
    Write-Host "   → Port $ec2Port is likely blocked" -ForegroundColor Yellow
}

Write-Host ""

# Test 3: HTTP Health endpoint
Write-Host "3. Testing HTTP Health Endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "${ec2Url}/health" -Method GET -TimeoutSec 10 -ErrorAction Stop
    Write-Host "   ✅ Health endpoint responded" -ForegroundColor Green
    Write-Host "   Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Health endpoint failed: $_" -ForegroundColor Red
    if ($_.Exception.Response.StatusCode -eq 503) {
        Write-Host "   → Service is running but unhealthy" -ForegroundColor Yellow
    } elseif ($_.Exception.Message -like "*timeout*") {
        Write-Host "   → Connection timeout (service might be slow or blocked)" -ForegroundColor Yellow
    } else {
        Write-Host "   → Service might not be running or port is blocked" -ForegroundColor Yellow
    }
}

Write-Host ""

# Test 4: HTTP Check-devices endpoint (quick test)
Write-Host "4. Testing Check-Devices Endpoint (quick test)..." -ForegroundColor Yellow
try {
    # Check for API key (default to common key if not set)
    $apiKey = $env:FRITZ_SERVICE_API_KEY
    if (-not $apiKey) {
        $apiKey = "JC!Pferdestall"  # Default API key from setup
        Write-Host "   Using default API key (JC!Pferdestall)" -ForegroundColor Gray
    } else {
        Write-Host "   Using API key from FRITZ_SERVICE_API_KEY environment variable" -ForegroundColor Gray
    }
    
    $headers = @{
        'Content-Type' = 'application/json'
    }
    
    # Add Authorization header with API key
    $headers['Authorization'] = "Bearer $apiKey"
    
    $startTime = Get-Date
    $response = Invoke-RestMethod -Uri "${ec2Url}/check-devices" -Method POST -Headers $headers -TimeoutSec 30 -ErrorAction Stop
    $duration = ((Get-Date) - $startTime).TotalSeconds
    
    Write-Host "   ✅ Check-devices endpoint responded in $([math]::Round($duration, 2))s" -ForegroundColor Green
    Write-Host "   Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
    
    if ($duration -gt 20) {
        Write-Host "   ⚠️  WARNING: Response took $([math]::Round($duration, 2))s (might timeout in Edge Function)" -ForegroundColor Yellow
    }
} catch {
    $duration = ((Get-Date) - $startTime).TotalSeconds
    $errorMessage = $_.Exception.Message
    
    # Parse error response if available
    if ($_.Exception.Response) {
        try {
            $errorStream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errorStream)
            $errorBody = $reader.ReadToEnd()
            $errorMessage = $errorBody
        } catch {
            # Ignore if can't read error body
        }
    }
    
    Write-Host "   ❌ Check-devices endpoint failed after $([math]::Round($duration, 2))s: $errorMessage" -ForegroundColor Red
    
    if ($errorMessage -like "*Authorization*" -or $errorMessage -like "*Missing*header*") {
        Write-Host "   → Service requires API key (FRITZ_SERVICE_API_KEY not set or wrong)" -ForegroundColor Yellow
        Write-Host "   → Set API key: `$env:FRITZ_SERVICE_API_KEY = 'YOUR_KEY'" -ForegroundColor Yellow
        Write-Host "   → Check EC2 .env file: FRITZ_SERVICE_API_KEY should match" -ForegroundColor Yellow
    } elseif ($_.Exception.Message -like "*timeout*") {
        Write-Host "   → Service is taking too long (>30s)" -ForegroundColor Yellow
        Write-Host "   → This will also timeout in Edge Function (58s limit)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=== Recommendations ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "If port 8000 is blocked:" -ForegroundColor Yellow
Write-Host "  1. AWS Console -> EC2 -> Security Groups" -ForegroundColor White
Write-Host "  2. Add Inbound Rule: Custom TCP, Port 8000, Source: 0.0.0.0/0" -ForegroundColor White
Write-Host ""
Write-Host "If firewall blocks port 8000:" -ForegroundColor Yellow
Write-Host "  ssh -i `"X:\Keys\JC_Devices.pem`" ubuntu@ec2-54-235-232-105.compute-1.amazonaws.com" -ForegroundColor White
Write-Host "  sudo ufw allow 8000/tcp" -ForegroundColor White
Write-Host "  sudo ufw reload" -ForegroundColor White
Write-Host ""
Write-Host "If service is slow:" -ForegroundColor Yellow
Write-Host "  - Check EC2 logs: sudo journalctl -u fritz-service -n 100" -ForegroundColor White
Write-Host "  - Verify WireGuard optimization is deployed" -ForegroundColor White
Write-Host "  - Check EC2 instance performance (CPU/Memory)" -ForegroundColor White

