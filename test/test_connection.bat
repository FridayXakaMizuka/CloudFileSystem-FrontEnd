@echo off
chcp 65001 >nul
echo ========================================
echo Frontend-Backend Connection Test
echo ========================================
echo.

REM Get backend host and port from .env.local
set BACKEND_HOST=localhost
set BACKEND_PORT=8835

if exist .env.local (
    for /f "tokens=1,2 delims==" %%a in (.env.local) do (
        if "%%a"=="VITE_BACKEND_HOST" set BACKEND_HOST=%%b
        if "%%a"=="VITE_BACKEND_PORT" set BACKEND_PORT=%%b
    )
)

echo Backend Configuration:
echo   Host: %BACKEND_HOST%
echo   Port: %BACKEND_PORT%
echo   URL: http://%BACKEND_HOST%:%BACKEND_PORT%
echo.

REM Test 1: Check if backend port is listening
echo [Test 1] Checking if backend port %BACKEND_PORT% is listening...
netstat -ano | findstr ":%BACKEND_PORT% " | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Port %BACKEND_PORT% is listening
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%BACKEND_PORT% " ^| findstr "LISTENING"') do (
        echo      PID: %%a
    )
) else (
    echo [ERROR] Port %BACKEND_PORT% is NOT listening
    echo.
    echo Backend server is not running!
    echo Please start your backend server first.
    goto :end
)
echo.

REM Test 2: Try to connect to backend health endpoint
echo [Test 2] Testing backend health endpoint...
curl -s -o nul -w "HTTP Status: %%{http_code}\n" http://%BACKEND_HOST%:%BACKEND_PORT%/auth/health 2>nul
if %errorlevel% equ 0 (
    echo [OK] Backend responded
) else (
    echo [WARN] Cannot reach backend health endpoint
    echo       This may be normal if /auth/health doesn't exist
)
echo.

REM Test 3: Try to get RSA key
echo [Test 3] Testing /auth/rsa-key endpoint...
curl -s http://%BACKEND_HOST%:%BACKEND_PORT%/auth/rsa-key > test_response.json 2>nul
if %errorlevel% equ 0 (
    if exist test_response.json (
        for %%I in (test_response.json) do set SIZE=%%~zI
        if !SIZE! GTR 0 (
            echo [OK] Received response from /auth/rsa-key
            echo      Response size: !SIZE! bytes
            
            REM Show first 200 chars of response
            echo      Preview:
            powershell -Command "Get-Content test_response.json -Raw | Select-Object -First 200"
        ) else (
            echo [ERROR] Empty response from /auth/rsa-key
        )
        del test_response.json
    )
) else (
    echo [ERROR] Failed to connect to /auth/rsa-key
    echo.
    echo Possible issues:
    echo 1. Backend is not running on http://%BACKEND_HOST%:%BACKEND_PORT%
    echo 2. Firewall is blocking the connection
    echo 3. Backend is listening on localhost only (not 0.0.0.0)
)
echo.

REM Test 4: Check frontend configuration
echo [Test 4] Checking frontend configuration...
if exist vite.config.js (
    echo [OK] vite.config.js exists
    
    REM Check if proxy is configured
    findstr /C:"secure: false" vite.config.js >nul 2>&1
    if %errorlevel% equ 0 (
        echo [OK] Proxy secure:false is configured
    ) else (
        echo [WARN] Proxy secure:false not found in vite.config.js
    )
) else (
    echo [ERROR] vite.config.js not found
)
echo.

REM Test 5: Check if certs exist
echo [Test 5] Checking SSL certificates...
if exist certs\cert.pem (
    echo [OK] cert.pem exists
    for %%I in (certs\cert.pem) do echo      Size: %%~zI bytes
) else (
    echo [WARN] cert.pem not found
    echo       Frontend will run on HTTP instead of HTTPS
)

if exist certs\key.pem (
    echo [OK] key.pem exists
    for %%I in (certs\key.pem) do echo      Size: %%~zI bytes
) else (
    echo [WARN] key.pem not found
)
echo.

REM Summary
echo ========================================
echo Summary
echo ========================================
echo.
echo Backend Status:
netstat -ano | findstr ":%BACKEND_PORT% " | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo   ✓ Backend is running on port %BACKEND_PORT%
) else (
    echo   ✗ Backend is NOT running
    echo   → Start your backend server first
)
echo.
echo Frontend Status:
if exist certs\cert.pem (
    echo   ✓ SSL certificates exist
    echo   → Frontend will use HTTPS
) else (
    echo   ✗ SSL certificates missing
    echo   → Run: setup_https.bat
    echo   → Or frontend will use HTTP
)
echo.
echo Next Steps:
echo 1. If backend is not running, start it
echo 2. Run: npm run dev
echo 3. Check browser console for errors
echo 4. Visit: https://localhost:2310 (if certs exist)
echo          or http://localhost:2310 (if no certs)
echo.

:end
pause
