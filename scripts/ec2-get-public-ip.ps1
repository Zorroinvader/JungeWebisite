# Get EC2 Instance Public IP
param(
    [Parameter(Mandatory=$true)]
    [string]$Ec2Hostname
)

Write-Host "=== Getting EC2 Public IP ===" -ForegroundColor Cyan
Write-Host ""

# Extract IP from hostname if it's a hostname
if ($Ec2Hostname -match "ec2-(\d+-\d+-\d+-\d+)") {
    $Ec2Ip = $Ec2Hostname -replace "ec2-(\d+-\d+-\d+-\d+)\.compute-1\.amazonaws\.com", '$1' -replace "-", "."
    Write-Host "Extracted IP from hostname: $Ec2Ip" -ForegroundColor Yellow
} else {
    $Ec2Ip = $Ec2Hostname
}

Write-Host "EC2 Hostname: $Ec2Hostname" -ForegroundColor White
Write-Host "EC2 IP: $Ec2Ip" -ForegroundColor White
Write-Host ""

# Try to get public IP from metadata (if running on EC2) or test connectivity
Write-Host "Testing connectivity..." -ForegroundColor Yellow
try {
    $pingResult = Test-Connection -ComputerName $Ec2Ip -Count 1 -ErrorAction Stop -Quiet
    if ($pingResult) {
        Write-Host "✅ Instance is reachable at: $Ec2Ip" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Could not ping instance (might be normal if ping is disabled)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== URLs to Update ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "EC2 Service URL:" -ForegroundColor White
Write-Host "  http://$Ec2Ip:8000" -ForegroundColor Green
Write-Host ""
Write-Host "Health Check:" -ForegroundColor White
Write-Host "  http://$Ec2Ip:8000/health" -ForegroundColor Green
Write-Host ""
Write-Host "Check Devices:" -ForegroundColor White
Write-Host "  http://$Ec2Ip:8000/check-devices" -ForegroundColor Green
Write-Host ""
Write-Host "=== Supabase Configuration ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Update FRITZ_SERVICE_URL in Supabase to:" -ForegroundColor Yellow
Write-Host "  http://$Ec2Ip:8000" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANT: Remove any backticks, quotes, or trailing slashes!" -ForegroundColor Red
Write-Host ""

return $Ec2Ip

