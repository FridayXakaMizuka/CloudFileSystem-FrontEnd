/**
 * Electron API 类型声明
 * 用于 TypeScript 支持和 IDE 智能提示
 */

/**
 * Electron 客户端信息
 */
interface ElectronClientInfo {
  platform: string          // 'win32' | 'linux' | 'darwin'
  arch: string              // 'x64' | 'arm64'
  electronVersion: string
  chromeVersion: string
  nodeVersion: string
  isElectron: boolean
}

/**
 * Electron API 接口
 */
interface ElectronAPI {
  /**
   * 获取客户端详细信息
   */
  getClientInfo(): Promise<ElectronClientInfo>
  
  /**
   * 是否为 Electron 环境
   */
  isElectron: boolean
}

/**
 * 扩展 Window 接口
 */
declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

export {}
