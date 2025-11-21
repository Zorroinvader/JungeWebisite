# PowerShell Script to Fix SSH Key Permissions on Windows
# Run this script as Administrator

$keyPath = "X:\Keys\JC_Devices.pem"

Write-Host "=== Fixing SSH Key Permissions ===" -ForegroundColor Cyan
Write-Host "Key Path: $keyPath" -ForegroundColor Yellow
Write-Host ""

# Check if file exists
if (-not (Test-Path $keyPath)) {
    Write-Host "ERROR: Key file not found at: $keyPath" -ForegroundColor Red
    Write-Host "Please update the path in this script." -ForegroundColor Yellow
    exit 1
}

Write-Host "Step 1: Taking ownership of the file..." -ForegroundColor Yellow
try {
    # Take ownership
    takeown /F $keyPath
    Write-Host "✓ Ownership taken" -ForegroundColor Green
} catch {
    Write-Host "⚠ Warning: Could not take ownership (may need admin rights)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 2: Removing inheritance and all permissions..." -ForegroundColor Yellow
try {
    # Remove inheritance and all permissions
    icacls $keyPath /inheritance:r
    Write-Host "✓ Inheritance removed" -ForegroundColor Green
} catch {
    Write-Host "⚠ Error removing inheritance" -ForegroundColor Red
    Write-Host "You may need to run PowerShell as Administrator" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 3: Granting full control to current user only..." -ForegroundColor Yellow
try {
    # Grant full control to current user only
    $currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
    icacls $keyPath /grant "${currentUser}:F"
    Write-Host "✓ Permissions granted to: $currentUser" -ForegroundColor Green
} catch {
    Write-Host "⚠ Error granting permissions" -ForegroundColor Red
}

Write-Host ""
Write-Host "Step 4: Verifying permissions..." -ForegroundColor Yellow
icacls $keyPath

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Green
Write-Host ""
Write-Host "Now try connecting again:" -ForegroundColor Cyan
Write-Host "ssh -i `"X:\Keys\JC_Devices.pem`" ubuntu@ec2-54-221-173-200.compute-1.amazonaws.com" -ForegroundColor White

