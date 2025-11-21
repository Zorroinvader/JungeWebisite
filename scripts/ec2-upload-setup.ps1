# PowerShell script to upload and run EC2 setup script
param(
    [Parameter(Mandatory=$false)]
    [string]$Ec2Ip = "",
    
    [Parameter(Mandatory=$false)]
    [string]$KeyPath = "X:\Keys\JC_Devices.pem"
)

if ([string]::IsNullOrEmpty($Ec2Ip)) {
    Write-Host "=== EC2 Setup Script Uploader ===" -ForegroundColor Cyan
    Write-Host ""
    $Ec2Ip = Read-Host "Enter EC2 Public IP address"
}

if (-not (Test-Path $KeyPath)) {
    Write-Host "ERROR: Key file not found: $KeyPath" -ForegroundColor Red
    Write-Host "Please provide correct path to your .pem file" -ForegroundColor Yellow
    exit 1
}

Write-Host "Uploading setup script to EC2 instance..." -ForegroundColor Yellow
Write-Host "EC2 IP: $Ec2Ip" -ForegroundColor Gray
Write-Host "Key: $KeyPath" -ForegroundColor Gray
Write-Host ""

# Upload setup script
$setupScript = "scripts/ec2-complete-setup.sh"
if (-not (Test-Path $setupScript)) {
    Write-Host "ERROR: Setup script not found: $setupScript" -ForegroundColor Red
    exit 1
}

try {
    scp -i $KeyPath $setupScript ubuntu@${Ec2Ip}:/home/ubuntu/
    Write-Host "✅ Setup script uploaded successfully!" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to upload script: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Connect to EC2 instance:" -ForegroundColor White
Write-Host "   ssh -i `"$KeyPath`" ubuntu@$Ec2Ip" -ForegroundColor Green
Write-Host ""
Write-Host "2. Run the setup script:" -ForegroundColor White
Write-Host "   chmod +x ~/ec2-complete-setup.sh" -ForegroundColor Green
Write-Host "   bash ~/ec2-complete-setup.sh" -ForegroundColor Green
Write-Host ""
Write-Host "The script will prompt you for:" -ForegroundColor Yellow
Write-Host "  - API Key (default: JC!Pferdestall)" -ForegroundColor Gray
Write-Host "  - Port (default: 8000)" -ForegroundColor Gray
Write-Host "  - WireGuard configuration" -ForegroundColor Gray
Write-Host ""
Write-Host "Would you like to connect now? (Y/N)" -ForegroundColor Cyan
$connect = Read-Host

if ($connect -eq "Y" -or $connect -eq "y") {
    Write-Host "Connecting to EC2 instance..." -ForegroundColor Yellow
    ssh -i $KeyPath ubuntu@$Ec2Ip
}

