# Security Verification Script for Windows PowerShell
# This script verifies that all security measures are in place

Write-Host ""
Write-Host "=== SECURITY VERIFICATION ===" -ForegroundColor Cyan
Write-Host ""

# Check 1: Source Maps
Write-Host "[1] Checking for source map files..." -ForegroundColor Yellow
$mapFiles = Get-ChildItem -Path "build" -Recurse -Filter "*.map" -ErrorAction SilentlyContinue
if ($mapFiles.Count -eq 0) {
    Write-Host "    [OK] No source map files found (SECURE)" -ForegroundColor Green
    $score = 1
} else {
    Write-Host "    [FAIL] WARNING: Found $($mapFiles.Count) source map files!" -ForegroundColor Red
    $mapFiles | ForEach-Object { Write-Host "      - $($_.FullName)" -ForegroundColor Red }
    $score = 0
}

# Check 2: DevTools Protection in HTML
Write-Host "[2] Checking DevTools protection in index.html..." -ForegroundColor Yellow
$indexContent = Get-Content "build/index.html" -Raw
if ($indexContent -match "contextmenu" -and $indexContent -match "keyCode") {
    Write-Host "    [OK] DevTools protection scripts found (SECURE)" -ForegroundColor Green
    $score += 1
} else {
    Write-Host "    [FAIL] WARNING: DevTools protection not found!" -ForegroundColor Red
}

# Check 3: Console Logs in Production Bundle
Write-Host "[3] Checking for console statements in production bundle..." -ForegroundColor Yellow
$jsFiles = Get-ChildItem -Path "build/static/js" -Filter "*.js" -Exclude "*.LICENSE.txt"
$consoleFound = $false
foreach ($file in $jsFiles) {
    $content = Get-Content $file.FullName -Raw
    if ($content -match "console\.(log|error|warn|debug|info)\(") {
        $consoleFound = $true
        Write-Host "    [FAIL] WARNING: Console statements found in $($file.Name)" -ForegroundColor Red
    }
}
if (-not $consoleFound) {
    Write-Host "    [OK] No console statements found (SECURE)" -ForegroundColor Green
    $score += 1
}

# Check 4: React DevTools Hook Disabled
Write-Host "[4] Checking React DevTools hook disabler..." -ForegroundColor Yellow
if ($indexContent -match "__REACT_DEVTOOLS_GLOBAL_HOOK__") {
    Write-Host "    [OK] React DevTools disabler found (SECURE)" -ForegroundColor Green
    $score += 1
} else {
    Write-Host "    [FAIL] WARNING: React DevTools disabler not found!" -ForegroundColor Red
}

# Check 5: Package.json Configuration
Write-Host "[5] Checking package.json build configuration..." -ForegroundColor Yellow
$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
if ($packageJson.scripts.build -match "GENERATE_SOURCEMAP=false") {
    Write-Host "    [OK] Build script configured correctly (SECURE)" -ForegroundColor Green
    $score += 1
} else {
    Write-Host "    [FAIL] WARNING: Build script not configured for security!" -ForegroundColor Red
}

# Check 6: Babel Configuration
Write-Host "[6] Checking Babel configuration..." -ForegroundColor Yellow
if (Test-Path ".babelrc") {
    $babelConfig = Get-Content ".babelrc" -Raw
    if ($babelConfig -match "transform-remove-console") {
        Write-Host "    [OK] Babel configured to remove console statements (SECURE)" -ForegroundColor Green
        $score += 1
    } else {
        Write-Host "    [FAIL] WARNING: Babel not configured to remove console!" -ForegroundColor Red
    }
} else {
    Write-Host "    [FAIL] WARNING: .babelrc file not found!" -ForegroundColor Red
}

# Summary
Write-Host ""
Write-Host "=== SUMMARY ===" -ForegroundColor Cyan
if ($score -eq 6) {
    Write-Host "Security Score: $score/6" -ForegroundColor Green
    Write-Host ""
    Write-Host "[SUCCESS] All security measures are in place!" -ForegroundColor Green
    Write-Host "Your codebase is protected from casual inspection." -ForegroundColor Green
} elseif ($score -ge 4) {
    Write-Host "Security Score: $score/6" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "[WARNING] Most security measures are in place, but some issues detected." -ForegroundColor Yellow
    Write-Host "Review the warnings above and run 'npm run build' again." -ForegroundColor Yellow
} else {
    Write-Host "Security Score: $score/6" -ForegroundColor Red
    Write-Host ""
    Write-Host "[CRITICAL] Security issues detected!" -ForegroundColor Red
    Write-Host "Please run 'npm run build' to apply security measures." -ForegroundColor Red
}

Write-Host ""
Write-Host "=== RECOMMENDATIONS ===" -ForegroundColor Cyan
Write-Host "- Never commit .env files with sensitive data"
Write-Host "- Use Supabase Row Level Security (RLS) for data protection"
Write-Host "- Keep API keys server-side or in environment variables"
Write-Host "- These measures deter casual users but cannot prevent determined hackers"
Write-Host ""
