# EC2 Instance Status Check Script
# Checks if EC2 instance is running or shutting down

$ec2Ip = "54.235.232.105"
$ec2Host = "ec2-54-235-232-105.compute-1.amazonaws.com"
$sshKey = "X:\Keys\JC_Devices.pem"

Write-Host "=== EC2 Instance Status Check ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Ping (Basic connectivity)
Write-Host "1. Testing Instance Connectivity..." -ForegroundColor Yellow
try {
    $pingResult = Test-Connection -ComputerName $ec2Ip -Count 4 -ErrorAction Stop
    Write-Host "   ✅ Instance is reachable (responding to ping)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Instance is NOT reachable" -ForegroundColor Red
    Write-Host "   → Instance might be stopped or terminated" -ForegroundColor Yellow
    Write-Host "   → Check AWS Console: EC2 Dashboard -> Instances" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Test 2: SSH Connection
Write-Host "2. Testing SSH Connection..." -ForegroundColor Yellow
try {
    # Try to connect via SSH (timeout after 5 seconds)
    $sshTest = ssh -i $sshKey -o ConnectTimeout=5 -o BatchMode=yes ubuntu@$ec2Host "echo 'SSH_OK'" 2>&1
    
    if ($sshTest -like "*SSH_OK*") {
        Write-Host "   ✅ SSH connection successful" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  SSH connection failed or timeout" -ForegroundColor Yellow
        Write-Host "   Output: $sshTest" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ SSH connection error: $_" -ForegroundColor Red
    Write-Host "   → Connection might be reset during device check" -ForegroundColor Yellow
}

Write-Host ""

# Test 3: Port 8000
Write-Host "3. Testing Service Port (8000)..." -ForegroundColor Yellow
try {
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    $connect = $tcpClient.BeginConnect($ec2Ip, 8000, $null, $null)
    $wait = $connect.AsyncWaitHandle.WaitOne(5000, $false)
    
    if ($wait) {
        $tcpClient.EndConnect($connect)
        Write-Host "   ✅ Port 8000 is open (service is running)" -ForegroundColor Green
        $tcpClient.Close()
    } else {
        Write-Host "   ❌ Port 8000 connection timeout" -ForegroundColor Red
        Write-Host "   → Service might be down" -ForegroundColor Yellow
        $tcpClient.Close()
    }
} catch {
    Write-Host "   ❌ Port 8000 connection failed: $_" -ForegroundColor Red
    Write-Host "   → Service might have crashed" -ForegroundColor Yellow
}

Write-Host ""

# Test 4: Health Endpoint
Write-Host "4. Testing Health Endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://${ec2Ip}:8000/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   ✅ Health endpoint responded" -ForegroundColor Green
    Write-Host "   Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Health endpoint failed: $_" -ForegroundColor Red
    if ($_.Exception.Message -like "*timeout*") {
        Write-Host "   → Service might be hanging or overloaded" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=== Recommendations ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "If instance is unreachable:" -ForegroundColor Yellow
Write-Host "  1. Check AWS Console: EC2 Dashboard -> Instances" -ForegroundColor White
Write-Host "  2. Verify Instance State is 'running'" -ForegroundColor White
Write-Host "  3. Check Instance Status Checks (2/2 checks passed)" -ForegroundColor White
Write-Host ""
Write-Host "If SSH disconnects during device check:" -ForegroundColor Yellow
Write-Host "  1. Instance might be shutting down due to:" -ForegroundColor White
Write-Host "     - Termination Protection not enabled" -ForegroundColor Gray
Write-Host "     - Spot Instance being terminated" -ForegroundColor Gray
Write-Host "     - Service crash causing system issues" -ForegroundColor Gray
Write-Host "     - Out of memory/CPU issues" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Enable Termination Protection (AWS Console):" -ForegroundColor White
Write-Host "     - EC2 Dashboard -> Instances -> Select Instance" -ForegroundColor Gray
Write-Host "     - Actions -> Instance State -> Change termination protection" -ForegroundColor Gray
Write-Host "     - Enable termination protection" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Check Service Logs (via SSH):" -ForegroundColor White
Write-Host "     ssh -i `"$sshKey`" ubuntu@$ec2Host" -ForegroundColor Gray
Write-Host "     sudo journalctl -u fritz-service -n 100" -ForegroundColor Gray


