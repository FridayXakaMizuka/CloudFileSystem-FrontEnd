/**
 * Capacitor API 类型声明
 * 用于 TypeScript 支持和 IDE 智能提示
 */

/**
 * Capacitor 平台信息
 */
interface CapacitorPlatformInfo {
  platform: 'android' | 'ios' | 'web'
  isNative: boolean
  isAndroid: boolean
  isIOS: boolean
  isWeb: boolean
}

/**
 * Capacitor 全局对象
 */
interface CapacitorGlobal {
  isNativePlatform(): boolean
  getPlatform(): string
  Plugins: any
}

/**
 * 扩展 Window 接口
 */
declare global {
  interface Window {
    Capacitor?: CapacitorGlobal
  }
}

export {}
