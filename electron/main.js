import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow

// 创建主窗口
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, '../build/icon.png'),
  })

  // 开发环境加载 Vite 服务器
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    // 打开开发者工具
    mainWindow.webContents.openDevTools()
  } else {
    // 生产环境加载打包后的文件
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // 窗口关闭时清理
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// 应用准备就绪时创建窗口
app.whenReady().then(() => {
  createWindow()

  // macOS 特殊处理：点击 dock 图标重新打开窗口
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// 所有窗口关闭时退出应用（Windows/Linux）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC 通信：获取客户端信息
ipcMain.handle('get-client-info', () => {
  return {
    platform: process.platform, // 'win32', 'linux', 'darwin'
    arch: process.arch, // 'x64', 'arm64'
    electronVersion: process.versions.electron,
    chromeVersion: process.versions.chrome,
    nodeVersion: process.versions.node,
    isElectron: true,
  }
})
