# EC2 Instance Shutdown Diagnostic Script
# Helps identify why the EC2 instance or service is shutting down after requests

$ec2Host = "ec2-54-235-232-105.compute-1.amazonaws.com"
$sshKey = "X:\Keys\JC_Devices.pem"
$sshUser = "ubuntu"

Write-Host "=== EC2 Shutdown Diagnostic ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "This script helps diagnose why the EC2 instance/service shuts down after requests."
Write-Host ""
Write-Host "IMPORTANT: Run these commands via SSH to EC2:" -ForegroundColor Yellow
Write-Host ""

Write-Host "=== SSH to EC2 ===" -ForegroundColor Yellow
Write-Host "ssh -i `"$sshKey`" ${sshUser}@${ec2Host}" -ForegroundColor Green
Write-Host ""

Write-Host "=== Diagnostic Commands (Run on EC2) ===" -ForegroundColor Yellow
Write-Host ""

Write-Host "1. Check Service Type (MOST COMMON ISSUE):" -ForegroundColor White
Write-Host "   cat /etc/systemd/system/fritz-service.service | grep Type=" -ForegroundColor Gray
Write-Host "   # Should be: Type=simple" -ForegroundColor Gray
Write-Host "   # NOT: Type=oneshot (this stops after execution!)" -ForegroundColor Red
Write-Host ""

Write-Host "2. Check Service Status:" -ForegroundColor White
Write-Host "   sudo systemctl status fritz-service" -ForegroundColor Gray
Write-Host "   sudo systemctl is-enabled fritz-service" -ForegroundColor Gray
Write-Host "   sudo systemctl is-active fritz-service" -ForegroundColor Gray
Write-Host ""

Write-Host "3. Check Service Logs (for crashes):" -ForegroundColor White
Write-Host "   sudo journalctl -u fritz-service -n 100 --no-pager" -ForegroundColor Gray
Write-Host "   # Look for: 'crashed', 'exited', 'failed', 'error'" -ForegroundColor Gray
Write-Host ""

Write-Host "4. Check start.sh Script:" -ForegroundColor White
Write-Host "   cat /fritz-service/start.sh" -ForegroundColor Gray
Write-Host "   # Should use: exec uvicorn ... (NOT just uvicorn ...)" -ForegroundColor Gray
Write-Host "   # Should NOT have: exit" -ForegroundColor Red
Write-Host ""

Write-Host "5. Check if Service Process is Running:" -ForegroundColor White
Write-Host "   ps aux | grep uvicorn" -ForegroundColor Gray
Write-Host "   ps aux | grep fritzWorkerService" -ForegroundColor Gray
Write-Host "   # Should see process running" -ForegroundColor Gray
Write-Host ""

Write-Host "6. Check Port 8000:" -ForegroundColor White
Write-Host "   netstat -tlnp | grep 8000" -ForegroundColor Gray
Write-Host "   ss -tlnp | grep 8000" -ForegroundColor Gray
Write-Host "   # Should show LISTEN on port 8000" -ForegroundColor Gray
Write-Host ""

Write-Host "7. Check AWS Instance Status (AWS Console):" -ForegroundColor White
Write-Host "   - Go to: EC2 Dashboard -> Instances" -ForegroundColor Gray
Write-Host "   - Check: Instance State (should be 'running')" -ForegroundColor Gray
Write-Host "   - Check: Instance Type (should NOT be Spot Instance)" -ForegroundColor Gray
Write-Host "   - Check: Termination Protection (should be enabled)" -ForegroundColor Gray
Write-Host ""

Write-Host "=== Common Issues & Fixes ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "Issue 1: Service Type is 'oneshot'" -ForegroundColor Yellow
Write-Host "  Fix:" -ForegroundColor White
Write-Host "    sudo nano /etc/systemd/system/fritz-service.service" -ForegroundColor Gray
Write-Host "    # Change: Type=oneshot → Type=simple" -ForegroundColor Gray
Write-Host "    sudo systemctl daemon-reload" -ForegroundColor Gray
Write-Host "    sudo systemctl restart fritz-service" -ForegroundColor Gray
Write-Host ""

Write-Host "Issue 2: Service Crashes After Request" -ForegroundColor Yellow
Write-Host "  Check logs:" -ForegroundColor White
Write-Host "    sudo journalctl -u fritz-service -n 100" -ForegroundColor Gray
Write-Host "  Look for Python exceptions or errors" -ForegroundColor Gray
Write-Host ""

Write-Host "Issue 3: start.sh Doesn't Use 'exec'" -ForegroundColor Yellow
Write-Host "  Fix:" -ForegroundColor White
Write-Host "    sudo nano /fritz-service/start.sh" -ForegroundColor Gray
Write-Host "    # Should be: exec uvicorn ..." -ForegroundColor Gray
Write-Host "    # NOT: uvicorn ... (without exec)" -ForegroundColor Gray
Write-Host "    sudo systemctl restart fritz-service" -ForegroundColor Gray
Write-Host ""

Write-Host "Issue 4: AWS Instance Auto-Shutdown" -ForegroundColor Yellow
Write-Host "  Fix (AWS Console):" -ForegroundColor White
Write-Host "    - EC2 Dashboard -> Instances -> Select Instance" -ForegroundColor Gray
Write-Host "    - Actions -> Instance State -> Change termination protection" -ForegroundColor Gray
Write-Host "    - Enable termination protection" -ForegroundColor Gray
Write-Host "    - Also check: Instance is NOT a Spot Instance" -ForegroundColor Gray
Write-Host ""

Write-Host "=== Quick Fix Script (Run on EC2) ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "cat > /tmp/fix-service.sh << 'EOF'" -ForegroundColor Green
Write-Host "#!/bin/bash" -ForegroundColor Gray
Write-Host "# Fix service configuration" -ForegroundColor Gray
Write-Host ""
Write-Host "# 1. Fix service file if Type is wrong" -ForegroundColor Gray
Write-Host "if grep -q 'Type=oneshot' /etc/systemd/system/fritz-service.service; then" -ForegroundColor Gray
Write-Host "  echo 'Fixing service type...'" -ForegroundColor Gray
Write-Host "  sudo sed -i 's/Type=oneshot/Type=simple/' /etc/systemd/system/fritz-service.service" -ForegroundColor Gray
Write-Host "  sudo systemctl daemon-reload" -ForegroundColor Gray
Write-Host "fi" -ForegroundColor Gray
Write-Host ""
Write-Host "# 2. Ensure start.sh uses exec" -ForegroundColor Gray
Write-Host "if ! grep -q '^exec uvicorn' /fritz-service/start.sh; then" -ForegroundColor Gray
Write-Host "  echo 'Fixing start.sh...'" -ForegroundColor Gray
Write-Host "  sudo sed -i 's/^uvicorn/exec uvicorn/' /fritz-service/start.sh" -ForegroundColor Gray
Write-Host "fi" -ForegroundColor Gray
Write-Host ""
Write-Host "# 3. Enable and restart service" -ForegroundColor Gray
Write-Host "sudo systemctl enable fritz-service" -ForegroundColor Gray
Write-Host "sudo systemctl restart fritz-service" -ForegroundColor Gray
Write-Host ""
Write-Host "# 4. Check status" -ForegroundColor Gray
Write-Host "sudo systemctl status fritz-service" -ForegroundColor Gray
Write-Host "EOF" -ForegroundColor Green
Write-Host ""
Write-Host "chmod +x /tmp/fix-service.sh" -ForegroundColor Green
Write-Host "sudo /tmp/fix-service.sh" -ForegroundColor Green
Write-Host ""


