# iOS Certificate Generation Script (PowerShell)
# Usage: Run .\setup_ios_cert.ps1 in PowerShell

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Generate iOS Trust Certificate" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if cert.pem exists
if (-not (Test-Path "certs\cert.pem")) {
    Write-Host "[ERROR] certs\cert.pem not found" -ForegroundColor Red
    Write-Host "Please run setup_https.bat first to generate certificates" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "[1/2] Copying certificate for iOS..." -ForegroundColor Yellow
Copy-Item certs\cert.pem certs\cert_for_ios.pem -Force
Write-Host "[OK] Certificate copied: certs\cert_for_ios.pem" -ForegroundColor Green
Write-Host ""

Write-Host "[2/2] Done!" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  iOS Certificate Generation Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Generated file:" -ForegroundColor White
Write-Host "  certs\cert_for_ios.pem  - PEM format (for iOS installation)" -ForegroundColor Gray
Write-Host ""
Write-Host "NOTE: If you need PKCS#12 format (.p12), please install OpenSSL first:" -ForegroundColor Yellow
Write-Host "  1. Download from: https://slproweb.com/products/Win32OpenSSL.html" -ForegroundColor Gray
Write-Host "  2. Install and add to PATH" -ForegroundColor Gray
Write-Host "  3. Run: openssl pkcs12 -export -out certs\cert.p12 -inkey certs\key.pem -in certs\cert.pem -passout pass:" -ForegroundColor Cyan
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  How to Install Certificate on iOS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Method 1: Via Local HTTP Server (Recommended)" -ForegroundColor Yellow
$computerIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -like "192.168.*"} | Select-Object -First 1).IPAddress
if (-not $computerIP) {
    $computerIP = "YOUR_COMPUTER_IP"
}
Write-Host "  1. Start a simple HTTP server in current directory:" -ForegroundColor Gray
Write-Host "     python -m http.server 8000" -ForegroundColor Cyan
Write-Host "  2. Visit in iOS Safari:" -ForegroundColor Gray
Write-Host "     http://$computerIP`:8000/certs/cert_for_ios.pem" -ForegroundColor Cyan
Write-Host "  3. Tap the file and install" -ForegroundColor Gray
Write-Host "  4. Go to Settings -> General -> VPN & Device Management" -ForegroundColor Gray
Write-Host "  5. Install the profile" -ForegroundColor Gray
Write-Host "  6. Go to Settings -> General -> About -> Certificate Trust Settings" -ForegroundColor Gray
Write-Host "  7. Enable full trust for your certificate" -ForegroundColor Gray
Write-Host ""

Write-Host "Method 2: Via Email" -ForegroundColor Yellow
Write-Host "  1. Email certs\cert_for_ios.pem as attachment to yourself" -ForegroundColor Gray
Write-Host "  2. Open the email on iOS device" -ForegroundColor Gray
Write-Host "  3. Tap the attachment and install" -ForegroundColor Gray
Write-Host ""

Write-Host "Method 3: Via AirDrop (requires Mac)" -ForegroundColor Yellow
Write-Host "  1. Right-click certs\cert_for_ios.pem on Mac" -ForegroundColor Gray
Write-Host "  2. Select 'Share' -> 'AirDrop'" -ForegroundColor Gray
Write-Host "  3. Send to your iPhone/iPad" -ForegroundColor Gray
Write-Host "  4. Follow installation prompts" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

pause
