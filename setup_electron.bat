@echo off
chcp 65001 >nul
echo ========================================
echo   Electron 客户端配置 - 快速开始
echo ========================================
echo.

echo [步骤 1/4] 检查 Node.js 版本...
node --version
if %errorlevel% neq 0 (
    echo ✗ 未检测到 Node.js，请先安装 Node.js
    pause
    exit /b 1
)
echo ✓ Node.js 已安装
echo.

echo [步骤 2/4] 安装 Electron 依赖...
echo 这可能需要几分钟时间，请耐心等待...
npm install electron electron-builder vite-plugin-electron vite-plugin-electron-renderer --save-dev
if %errorlevel% neq 0 (
    echo ✗ 依赖安装失败
    pause
    exit /b 1
)
echo ✓ 依赖安装成功
echo.

echo [步骤 3/4] 验证配置文件...
if exist "electron\main.js" (
    echo ✓ electron/main.js 存在
) else (
    echo ✗ electron/main.js 不存在
)

if exist "electron\preload.js" (
    echo ✓ electron/preload.js 存在
) else (
    echo ✗ electron/preload.js 不存在
)

if exist "src\utils\clientDetector.js" (
    echo ✓ clientDetector.js 存在
) else (
    echo ✗ clientDetector.js 不存在
)

if exist "electron-builder.json" (
    echo ✓ electron-builder.json 存在
) else (
    echo ✗ electron-builder.json 不存在
)
echo.

echo [步骤 4/4] 配置完成！
echo.
echo ========================================
echo   接下来你可以：
echo ========================================
echo.
echo 1. 启动 Electron 开发环境：
echo    npm run electron:dev
echo.
echo 2. 打包 Windows 客户端：
echo    npm run electron:build:win
echo.
echo 3. 打包 Linux 客户端：
echo    npm run electron:build:linux
echo.
echo 4. 打包 macOS 客户端：
echo    npm run electron:build:mac
echo.
echo 5. 测试客户端检测功能：
echo    在浏览器中打开 test_client_detector.html
echo.
echo ========================================
echo   详细文档：
echo ========================================
echo.
echo - ELECTRON_SETUP_GUIDE.md     完整配置指南
echo - ELECTRON_SETUP_SUMMARY.md   配置总结
echo.
pause
