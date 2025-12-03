# PowerShell Script to format WG_CONFIG for Railway
# This creates a single-line version with \n for Railway Variables

$configPath = "config/wg_config.conf"

if (-not (Test-Path $configPath)) {
    Write-Host "Error: $configPath not found!" -ForegroundColor Red
    exit 1
}

# Read the config file
$config = Get-Content $configPath -Raw

# Replace actual newlines with \n
$formatted = $config -replace "`r?`n", "\n"

Write-Host "`n=== Copy this value to Railway WG_CONFIG variable ===" -ForegroundColor Green
Write-Host $formatted -ForegroundColor Cyan
Write-Host "`n=== End of value ===" -ForegroundColor Green
Write-Host "`nTip: Copy the text above and paste it into Railway Variables → WG_CONFIG" -ForegroundColor Yellow

# Also copy to clipboard (Windows)
if (Get-Command Set-Clipboard -ErrorAction SilentlyContinue) {
    $formatted | Set-Clipboard
    Write-Host "✅ Value copied to clipboard!" -ForegroundColor Green
}

