@echo off
chcp 65001 >nul

echo ========================================
echo HTTPS Configuration Diagnostic Tool
echo ========================================
echo.

REM Change to script directory
cd /d "%~dp0"

echo [Step 1] Checking SSL certificates...
if exist certs\cert.pem (
    echo [OK] cert.pem exists
    for %%I in (certs\cert.pem) do echo      Size: %%~zI bytes
) else (
    echo [ERROR] cert.pem NOT found
)

if exist certs\key.pem (
    echo [OK] key.pem exists
    for %%I in (certs\key.pem) do echo      Size: %%~zI bytes
) else (
    echo [ERROR] key.pem NOT found
)
echo.

echo [Step 2] Checking mkcert installation...
where mkcert >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] mkcert is installed
    mkcert -version
) else (
    echo [WARN] mkcert is NOT installed
    echo        Install with: choco install mkcert
)
echo.

echo [Step 3] Checking CAROOT...
mkcert -CAROOT >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Local CA is installed
    for /f "delims=" %%i in ('mkcert -CAROOT') do echo      Path: %%i
) else (
    echo [ERROR] Local CA is NOT installed
    echo         Run: mkcert -install
)
echo.

echo [Step 4] Checking certificate validity...
if exist certs\cert.pem (
    openssl x509 -in certs/cert.pem -noout -subject -dates -ext subjectAltName 2>nul
    if %errorlevel% neq 0 (
        echo [WARN] Cannot verify certificate (OpenSSL not available)
    )
)
echo.

echo [Step 5] Getting local IP addresses...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    echo      IP: %%a
)
echo.

echo [Step 6] Checking vite.config.js configuration...
findstr /C:"port: 2310" vite.config.js >nul
if %errorlevel% equ 0 (
    echo [OK] HTTP port configured: 2310
) else (
    echo [ERROR] HTTP port NOT configured correctly
)

findstr /C:"listen(2311" vite.config.js >nul
if %errorlevel% equ 0 (
    echo [OK] HTTPS port configured: 2311
) else (
    echo [ERROR] HTTPS port NOT configured correctly
)

findstr /C:"secure: false" vite.config.js >nul
if %errorlevel% equ 0 (
    echo [OK] Proxy secure flag set to false
) else (
    echo [WARN] Proxy secure flag may not be set
)
echo.

echo [Step 7] Checking API configuration...
findstr /C:"BASE_API_URL = isDev ? ''" src\config\api.js >nul
if %errorlevel% equ 0 (
    echo [OK] Development mode uses relative paths
) else (
    echo [WARN] API configuration may need review
)
echo.

echo ========================================
echo Diagnostic Complete
echo ========================================
echo.
echo To test HTTPS:
echo   1. Run: npm run dev
echo   2. Access: https://localhost:2311
echo   3. Check browser console for errors
echo.
echo Common issues:
echo   - Certificate expired: Run setup_https.bat again
echo   - Port conflict: Check if ports 2310/2311 are in use
echo   - Browser warning: Click "Advanced" -^> "Proceed anyway"
echo.
pause
