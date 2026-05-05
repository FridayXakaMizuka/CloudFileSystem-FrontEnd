@echo off
chcp 65001 >nul

REM Change to script directory
cd /d "%~dp0"

echo ========================================
echo HTTPS Setup for Development
echo ========================================
echo.

REM Check if mkcert is installed
where mkcert >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] mkcert is not installed
    echo.
    echo Please install mkcert first:
    echo   Chocolatey: choco install mkcert
    echo   Scoop: scoop install mkcert
    echo   Download: https://github.com/FiloSottile/mkcert/releases
    echo.
    echo After installation, run: mkcert -install
    echo.
    pause
    exit /b 1
)

echo [OK] mkcert is installed
mkcert -version
echo.

REM Check if CAROOT exists (CA installed)
mkcert -CAROOT >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARN] Local CA may not be installed
    echo.
    echo Attempting to install local CA...
    echo You may need to grant administrator privileges.
    echo.
    mkcert -install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install local CA
        echo.
        echo Please run this script as Administrator:
        echo Right-click setup_https.bat -^> Run as administrator
        echo.
        pause
        exit /b 1
    )
    echo [OK] Local CA installed
    echo.
) else (
    echo [OK] Local CA is installed
    echo.
)

REM Get local IP address
echo [Step 1] Getting local IP address...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set MY_IP=%%a
    goto :ip_found
)
:ip_found
echo Local IP:%MY_IP:~1%
echo.

REM Create certs directory
echo [Step 2] Creating certificates directory...
if not exist certs mkdir certs
echo [OK] Directory created
echo.

REM Generate SSL certificate
echo [Step 3] Generating SSL certificate...
echo Certificate will be generated for:
echo   - localhost
echo   - 127.0.0.1
echo   - %MY_IP:~1%
echo   - ::1
echo.

mkcert -key-file certs/key.pem -cert-file certs/cert.pem ^
  localhost ^
  127.0.0.1 ^
  %MY_IP:~1% ^
  ::1

if %errorlevel% equ 0 (
    echo [OK] Certificate generated successfully
    echo.
    
    REM Verify files exist
    if not exist certs\cert.pem (
        echo [ERROR] cert.pem was not created
        goto :generate_failed
    )
    
    if not exist certs\key.pem (
        echo [ERROR] key.pem was not created
        goto :generate_failed
    )
    
    REM Display file sizes
    for %%I in (certs\cert.pem) do echo      cert.pem: %%~zI bytes
    for %%I in (certs\key.pem) do echo      key.pem: %%~zI bytes
    echo.
    
    REM Display certificate info
    echo [Step 4] Certificate information:
    openssl x509 -in certs/cert.pem -noout -subject -dates 2>nul
    if %errorlevel% neq 0 (
        echo [WARN] Cannot display certificate details (OpenSSL may not be installed)
    )
    echo.
    
    echo ========================================
    echo [SUCCESS] HTTPS setup completed!
    echo ========================================
    echo.
    echo Next steps:
    echo 1. Backend should use HTTP (not HTTPS)
    echo 2. vite.config.js is already configured
    echo 3. Run: npm run dev
    echo 4. Access: https://localhost:2310
    echo          https://%MY_IP:~1%:2310
    echo.
    echo Notes:
    echo - Certificate valid for 3 months
    echo - Regenerate if IP changes
    echo - See DEV_HTTPS_HTTP_MIXED_CONFIG.md for details
    echo.
    goto :end
) else (
    goto :generate_failed
)

:generate_failed
echo [ERROR] Certificate generation failed
echo.
echo Possible reasons:
echo 1. mkcert -install was not run (run it first)
echo 2. No administrator privileges
echo 3. Antivirus blocking certificate creation
echo 4. Insufficient disk space
echo.
echo Troubleshooting:
echo - Run: diagnose_https.bat (for detailed diagnostics)
echo - Try running as Administrator
echo - Check if mkcert -CAROOT returns a valid path
echo.
goto :end

:end
pause
