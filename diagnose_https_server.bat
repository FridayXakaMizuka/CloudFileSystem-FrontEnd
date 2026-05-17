@echo off
chcp 65001 >nul

echo ========================================
echo HTTPS Server Diagnostic Tool
echo ========================================
echo.

cd /d "%~dp0"

echo [Step 1] Checking SSL certificate files...
if exist certs\cert.pem (
    echo [OK] cert.pem exists
    for %%I in (certs\cert.pem) do echo      Size: %%~zI bytes
) else (
    echo [ERROR] cert.pem NOT found
    goto :end
)

if exist certs\key.pem (
    echo [OK] key.pem exists
    for %%I in (certs\key.pem) do echo      Size: %%~zI bytes
) else (
    echo [ERROR] key.pem NOT found
    goto :end
)
echo.

echo [Step 2] Checking if dev server is running...
netstat -ano | findstr :2310 >nul
if %errorlevel% equ 0 (
    echo [OK] HTTP server (port 2310) is running
) else (
    echo [WARN] HTTP server (port 2310) is NOT running
    echo        Please run: npm run dev
)

netstat -ano | findstr :2311 >nul
if %errorlevel% equ 0 (
    echo [OK] HTTPS server (port 2311) is running
) else (
    echo [ERROR] HTTPS server (port 2311) is NOT running
    echo.
    echo Possible reasons:
    echo   1. Dev server not started
    echo   2. Certificate loading failed
    echo   3. Port 2311 is already in use
    echo   4. Error in configureServer code
    echo.
    echo Solution:
    echo   1. Stop the current dev server (Ctrl+C)
    echo   2. Run: npm run dev
    echo   3. Check console output for error messages
)
echo.

echo [Step 3] Checking port 2311 status...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :2311') do (
    echo Port 2311 is used by PID: %%a
    tasklist /FI "PID eq %%a" /NH
)
echo.

echo [Step 4] Testing HTTPS connection...
curl -k -s -o nul -w "HTTPS Status Code: %%{http_code}\n" https://localhost:2311/ 2>nul
if %errorlevel% equ 0 (
    echo [OK] HTTPS server responded
) else (
    echo [ERROR] Cannot connect to HTTPS server
)
echo.

echo ========================================
echo Next Steps
echo ========================================
echo.
echo If HTTPS server is not running:
echo   1. Stop current dev server (Ctrl+C)
echo   2. Check vite.config.js for errors
echo   3. Run: npm run dev
echo   4. Watch console output carefully
echo.
echo Expected console output:
echo   🔍 检测到 SSL 证书，正在启动 HTTPS 服务器...
echo   ✅ SSL 证书加载成功
echo   ✅ HTTPS 服务器创建成功
echo   🔒 HTTPS Server running at: https://localhost:2311
echo.

:end
pause
