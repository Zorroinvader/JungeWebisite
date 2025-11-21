# EC2 SSH Troubleshooting Script
# Helps diagnose why SSH connection is failing

param(
    [Parameter(Mandatory=$false)]
    [string]$Ec2Ip = "54.235.232.105",
    
    [Parameter(Mandatory=$false)]
    [string]$Ec2Host = "ec2-54-235-232-105.compute-1.amazonaws.com",
    
    [Parameter(Mandatory=$false)]
    [string]$KeyPath = "X:\Keys\JC_Devices.pem"
)

Write-Host "=== EC2 SSH Troubleshooting ===" -ForegroundColor Cyan
Write-Host ""

# Get current IP
Write-Host "1. Getting your current IP address..." -ForegroundColor Yellow
try {
    $myIp = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing).Content
    Write-Host "   Your IP: $myIp" -ForegroundColor Green
    Write-Host "   → Add this to Security Group: $myIp/32" -ForegroundColor Gray
} catch {
    Write-Host "   ⚠️  Could not get your IP" -ForegroundColor Yellow
    $myIp = "Unknown"
}

Write-Host ""

# Test 1: Ping test
Write-Host "2. Testing connectivity to EC2..." -ForegroundColor Yellow
try {
    $pingResult = Test-Connection -ComputerName $Ec2Ip -Count 2 -ErrorAction Stop -Quiet
    if ($pingResult) {
        Write-Host "   ✅ Ping successful" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Ping failed" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Ping failed: $_" -ForegroundColor Red
    Write-Host "   → This is normal if ICMP is disabled" -ForegroundColor Gray
}

Write-Host ""

# Test 2: Port 22 connectivity
Write-Host "3. Testing Port 22 (SSH) connectivity..." -ForegroundColor Yellow
try {
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    $connect = $tcpClient.BeginConnect($Ec2Ip, 22, $null, $null)
    $wait = $connect.AsyncWaitHandle.WaitOne(5000, $false)
    
    if ($wait) {
        $tcpClient.EndConnect($connect)
        Write-Host "   ✅ Port 22 is open and reachable" -ForegroundColor Green
        $tcpClient.Close()
    } else {
        Write-Host "   ❌ Port 22 connection timeout" -ForegroundColor Red
        Write-Host "   → Security Group likely blocking port 22" -ForegroundColor Yellow
        $tcpClient.Close()
    }
} catch {
    Write-Host "   ❌ Port 22 connection failed: $_" -ForegroundColor Red
    Write-Host "   → Port 22 is likely blocked in Security Group" -ForegroundColor Yellow
}

Write-Host ""

# Test 3: Check key file
Write-Host "4. Checking SSH key file..." -ForegroundColor Yellow
if (Test-Path $KeyPath) {
    $keyInfo = Get-Item $KeyPath
    Write-Host "   ✅ Key file exists: $KeyPath" -ForegroundColor Green
    Write-Host "   Size: $($keyInfo.Length) bytes" -ForegroundColor Gray
} else {
    Write-Host "   ❌ Key file not found: $KeyPath" -ForegroundColor Red
    Write-Host "   → Check the path is correct" -ForegroundColor Yellow
}

Write-Host ""

# Test 4: Try SSH with verbose output
Write-Host "5. Attempting SSH connection (verbose)..." -ForegroundColor Yellow
Write-Host "   Command: ssh -i `"$KeyPath`" -v ubuntu@$Ec2Host" -ForegroundColor Gray
Write-Host ""
Write-Host "   Run this manually to see detailed error:" -ForegroundColor Yellow
Write-Host "   ssh -i `"$KeyPath`" -v ubuntu@$Ec2Host" -ForegroundColor Green
Write-Host ""

Write-Host "=== Action Items ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "If Port 22 test failed:" -ForegroundColor Yellow
Write-Host "  1. AWS Console -> EC2 -> Instances" -ForegroundColor White
Write-Host "  2. Select instance: $Ec2Host" -ForegroundColor White
Write-Host "  3. Security tab -> Security Group -> Edit inbound rules" -ForegroundColor White
Write-Host "  4. Add rule: SSH (22), Source: $myIp/32 or 0.0.0.0/0" -ForegroundColor White
Write-Host "  5. Save rules -> Wait 2 minutes" -ForegroundColor White
Write-Host ""
Write-Host "If key file not found:" -ForegroundColor Yellow
Write-Host "  → Update KeyPath parameter or check file location" -ForegroundColor White
Write-Host ""
Write-Host "Try connecting with IP instead of hostname:" -ForegroundColor Yellow
Write-Host "  ssh -i `"$KeyPath`" ubuntu@$Ec2Ip" -ForegroundColor Green
Write-Host ""
Write-Host "Or try with verbose output to see detailed error:" -ForegroundColor Yellow
Write-Host "  ssh -i `"$KeyPath`" -v ubuntu@$Ec2Ip" -ForegroundColor Green
Write-Host ""


