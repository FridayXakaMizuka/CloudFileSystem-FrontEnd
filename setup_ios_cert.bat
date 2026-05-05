@echo off
chcp 65001 >nul
echo ========================================
echo   Generate iOS Trust Certificate
echo ========================================
echo.

REM Check if cert.pem exists
if not exist "certs\cert.pem" (
    echo [ERROR] certs\cert.pem not found
    echo Please run setup_https.bat first to generate certificates
    pause
    exit /b 1
)

echo [1/2] Copying certificate for iOS...
copy certs\cert.pem certs\cert_for_ios.pem >nul
if errorlevel 1 (
    echo [ERROR] Failed to copy certificate
    pause
    exit /b 1
)
echo [OK] Certificate copied: certs\cert_for_ios.pem
echo.

echo [2/2] Done!
echo.

echo ========================================
echo   iOS Certificate Generation Complete!
echo ========================================
echo.
echo Generated file:
echo   certs\cert_for_ios.pem  - PEM format (for iOS installation)
echo.
echo NOTE: If you need PKCS#12 format (.p12), please install OpenSSL first:
echo   1. Download from: https://slproweb.com/products/Win32OpenSSL.html
echo   2. Install and add to PATH
echo   3. Run: openssl pkcs12 -export -out certs\cert.p12 -inkey certs\key.pem -in certs\cert.pem -passout pass:
echo.
echo ========================================
echo   How to Install Certificate on iOS
echo ========================================
echo.
echo Method 1: Via Local HTTP Server (Recommended)
echo   1. Start a simple HTTP server in current directory:
echo      python -m http.server 8000
echo   2. Visit in iOS Safari:
echo      http://YOUR_COMPUTER_IP:8000/certs/cert_for_ios.pem
echo   3. Tap the file and install
echo   4. Go to Settings - General - VPN ^& Device Management
echo   5. Install the profile
echo   6. Go to Settings - General - About - Certificate Trust Settings
echo   7. Enable full trust for your certificate
echo.
echo Method 2: Via Email
echo   1. Email certs\cert_for_ios.pem as attachment to yourself
echo   2. Open the email on iOS device
echo   3. Tap the attachment and install
echo.
echo Method 3: Via AirDrop (requires Mac)
echo   1. Right-click certs\cert_for_ios.pem on Mac
echo   2. Select "Share" - "AirDrop"
echo   3. Send to your iPhone/iPad
echo   4. Follow installation prompts
echo.
echo ========================================
echo.
pause
