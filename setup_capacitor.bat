@echo off
chcp 65001 >nul
echo ========================================
echo   Capacitor 移动端配置 - 快速开始
echo ========================================
echo.

echo [步骤 1/5] 检查 Node.js 版本...
node --version
if %errorlevel% neq 0 (
    echo ✗ 未检测到 Node.js，请先安装 Node.js
    pause
    exit /b 1
)
echo ✓ Node.js 已安装
echo.

echo [步骤 2/5] 安装 Capacitor 依赖...
echo 这可能需要几分钟时间...
npm install @capacitor/core @capacitor/cli --save-dev
npm install @capacitor/android @capacitor/ios --save-dev
if %errorlevel% neq 0 (
    echo ✗ 依赖安装失败
    pause
    exit /b 1
)
echo ✓ 依赖安装成功
echo.

echo [步骤 3/5] 初始化 Capacitor...
npx cap init CloudFileSystem com.cloudfilesystem.app --web-dir=dist
if %errorlevel% neq 0 (
    echo ⚠ Capacitor 初始化警告（可以忽略，配置文件已创建）
)
echo ✓ Capacitor 配置完成
echo.

echo [步骤 4/5] 构建 Web 应用...
call npm run build
if %errorlevel% neq 0 (
    echo ✗ 构建失败
    pause
    exit /b 1
)
echo ✓ 构建成功
echo.

echo [步骤 5/5] 验证配置...
if exist "capacitor.config.json" (
    echo ✓ capacitor.config.json 存在
) else (
    echo ✗ capacitor.config.json 不存在
)
echo.

echo ========================================
echo   配置完成！
echo ========================================
echo.
echo 接下来你可以：
echo.
echo 1. 添加 Android 平台：
echo    npm run cap:add:android
echo.
echo 2. 添加 iOS 平台（需要 macOS）：
echo    npm run cap:add:ios
echo.
echo 3. 同步项目到原生平台：
echo    npm run cap:sync
echo.
echo 4. 打开 Android Studio：
echo    npm run cap:open:android
echo.
echo 5. 打开 Xcode（macOS）：
echo    npm run cap:open:ios
echo.
echo ========================================
echo   详细文档：
echo ========================================
echo.
echo - CAPACITOR_SETUP_GUIDE.md     完整配置指南
echo - CAPACITOR_SETUP_SUMMARY.md   配置总结
echo.
pause
