# EC2 Instance Shutdown Diagnostic
# Checks if instance is actually shutting down or just SSH disconnecting

$ec2Ip = "54.235.232.105"
$ec2Host = "ec2-54-235-232-105.compute-1.amazonaws.com"

Write-Host "=== EC2 Instance Shutdown Diagnostic ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Ping test (repeated)
Write-Host "1. Testing Instance Connectivity (Multiple Times)..." -ForegroundColor Yellow
for ($i = 1; $i -le 5; $i++) {
    Start-Sleep -Seconds 2
    try {
        $pingResult = Test-Connection -ComputerName $ec2Ip -Count 1 -ErrorAction Stop -Quiet
        if ($pingResult) {
            Write-Host "   ✅ Ping $i/5: Instance is reachable" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Ping $i/5: Instance is NOT reachable" -ForegroundColor Red
            Write-Host "   → Instance might be shutting down" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "   ❌ Ping $i/5: Failed - $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "2. Checking AWS Console Status..." -ForegroundColor Yellow
Write-Host "   → Go to: AWS Console -> EC2 -> Instances" -ForegroundColor Gray
Write-Host "   → Select instance: ec2-54-235-232-105.compute-1.amazonaws.com" -ForegroundColor Gray
Write-Host "   → Check:" -ForegroundColor Gray
Write-Host "     - Instance State (should be 'running')" -ForegroundColor Gray
Write-Host "     - Status Checks (should be 2/2 checks passed)" -ForegroundColor Gray
Write-Host "     - Status: Checks tab -> System status check" -ForegroundColor Gray
Write-Host ""

Write-Host "=== Possible Causes ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Instance is Terminating (Termination Protection OFF)" -ForegroundColor Yellow
Write-Host "   Fix: Enable Termination Protection" -ForegroundColor White
Write-Host "   AWS Console -> EC2 -> Instances -> Select Instance" -ForegroundColor Gray
Write-Host "   Actions -> Instance State -> Change termination protection" -ForegroundColor Gray
Write-Host "   Enable termination protection" -ForegroundColor Gray
Write-Host ""

Write-Host "2. System is Rebooting (Check CloudWatch Logs)" -ForegroundColor Yellow
Write-Host "   Fix: Check System Logs via AWS Console" -ForegroundColor White
Write-Host "   EC2 Dashboard -> Instances -> Select Instance" -ForegroundColor Gray
Write-Host "   Actions -> Monitor and troubleshoot -> Get system log" -ForegroundColor Gray
Write-Host ""

Write-Host "3. SSH Daemon Crashed" -ForegroundColor Yellow
Write-Host "   Fix: Instance should auto-restart SSH daemon" -ForegroundColor White
Write-Host "   Wait 1-2 minutes, then try SSH again" -ForegroundColor Gray
Write-Host ""

Write-Host "4. Network Issue (Temporary)" -ForegroundColor Yellow
Write-Host "   Fix: Wait and retry" -ForegroundColor White
Write-Host ""

Write-Host "=== Immediate Actions ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Check AWS Console NOW:" -ForegroundColor Yellow
Write-Host "   - Is instance state 'running'?" -ForegroundColor White
Write-Host "   - Are status checks passed?" -ForegroundColor White
Write-Host ""
Write-Host "2. Enable Termination Protection (if not enabled):" -ForegroundColor Yellow
Write-Host "   - AWS Console -> EC2 -> Instances" -ForegroundColor White
Write-Host "   - Select instance -> Actions -> Instance State" -ForegroundColor White
Write-Host "   - Change termination protection -> Enable" -ForegroundColor White
Write-Host ""
Write-Host "3. Check System Logs:" -ForegroundColor Yellow
Write-Host "   - AWS Console -> EC2 -> Instances -> Select Instance" -ForegroundColor White
Write-Host "   - Actions -> Monitor and troubleshoot -> Get system log" -ForegroundColor White
Write-Host "   - Look for: 'shutdown', 'terminated', 'reboot', 'kernel panic'" -ForegroundColor White


