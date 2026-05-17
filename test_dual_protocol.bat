@echo off
chcp 65001 >nul

echo ========================================
echo Testing HTTP and HTTPS Dual Protocol
echo ========================================
echo.

cd /d "%~dp0"

echo [Step 1] Checking if servers are running...
echo.
echo Please make sure you have run: npm run dev
echo.
echo Expected output:
echo   - HTTP:  http://localhost:2310
echo   - HTTPS: https://localhost:2311
echo.

pause

echo.
echo [Step 2] Testing HTTP access...
curl -s -o nul -w "HTTP Status: %%{http_code}\n" http://localhost:2310/
if %errorlevel% equ 0 (
    echo [OK] HTTP server is accessible
) else (
    echo [ERROR] HTTP server is NOT accessible
)
echo.

echo [Step 3] Testing HTTPS access...
curl -k -s -o nul -w "HTTPS Status: %%{http_code}\n" https://localhost:2311/
if %errorlevel% equ 0 (
    echo [OK] HTTPS server is accessible
) else (
    echo [ERROR] HTTPS server is NOT accessible
)
echo.

echo [Step 4] Checking certificate files...
if exist certs\cert.pem (
    echo [OK] SSL certificate exists
) else (
    echo [ERROR] SSL certificate NOT found
    echo        Run: .\setup_https.bat
)

if exist certs\key.pem (
    echo [OK] SSL key exists
) else (
    echo [ERROR] SSL key NOT found
    echo        Run: .\setup_https.bat
)
echo.

echo ========================================
echo Access URLs
echo ========================================
echo.
echo HTTP:
echo   - Local:   http://localhost:2310
echo   - Network: http://YOUR_IP:2310
echo.
echo HTTPS:
echo   - Local:   https://localhost:2311
echo   - Network: https://YOUR_IP:2311
echo.
echo Note: Replace YOUR_IP with your actual IP address
echo.
echo To find your IP:
echo   ipconfig ^| findstr IPv4
echo.

pause
