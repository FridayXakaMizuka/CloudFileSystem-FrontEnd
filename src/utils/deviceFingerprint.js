/**
 * 设备指纹生成工具
 * 用于生成唯一的设备标识符，增强安全性
 */

import { createLogger } from './logger'
import { getClientInfoSync, ClientType } from './clientDetector'

const logger = createLogger('DeviceFingerprint')

// 设备指纹缓存（会话期间有效）
let fingerprintCache = null

/**
 * 简单的哈希函数（降级方案）
 * @param {string} str - 要哈希的字符串
 * @returns {string} 哈希值
 */
const simpleHash = (str) => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0')
}

/**
 * 使用 Web Crypto API 生成 SHA-256 哈希
 * @param {string} data - 要哈希的数据
 * @returns {Promise<string>} SHA-256 哈希值
 */
const sha256 = async (data) => {
  try {
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    return hashHex
  } catch (error) {
    logger.warn('Web Crypto API 不可用，使用简单哈希:', error.message)
    return simpleHash(data)
  }
}

/**
 * 收集浏览器环境信息
 * @returns {Object} 浏览器信息对象
 */
const collectBrowserInfo = () => {
  if (typeof navigator === 'undefined') {
    return {}
  }

  const info = {
    // 浏览器基本信息
    userAgent: navigator.userAgent,
    language: navigator.language,
    languages: navigator.languages?.join(','),
    platform: navigator.platform,
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: navigator.deviceMemory,
    
    // 屏幕信息
    screenResolution: `${screen.width}x${screen.height}`,
    colorDepth: screen.colorDepth,
    pixelRatio: window.devicePixelRatio,
    
    // 时区信息
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset(),
    
    // Canvas 指纹（简化版）
    canvas: getCanvasFingerprint(),
    
    // WebGL 信息
    webgl: getWebGLInfo(),
  }

  return info
}

/**
 * 获取 Canvas 指纹
 * @returns {string} Canvas 指纹
 */
const getCanvasFingerprint = () => {
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    canvas.width = 200
    canvas.height = 50
    
    // 绘制文本
    ctx.textBaseline = 'top'
    ctx.font = '14px Arial'
    ctx.fillStyle = '#f60'
    ctx.fillRect(125, 1, 62, 20)
    ctx.fillStyle = '#069'
    ctx.fillText('Device Fingerprint', 2, 15)
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)'
    ctx.fillText('Device Fingerprint', 4, 17)
    
    return canvas.toDataURL().slice(-32)
  } catch (error) {
    logger.warn('Canvas 指纹获取失败:', error.message)
    return ''
  }
}

/**
 * 获取 WebGL 信息
 * @returns {string} WebGL 信息
 */
const getWebGLInfo = () => {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    
    if (!gl) {
      return ''
    }
    
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
    if (!debugInfo) {
      return ''
    }
    
    const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
    
    return `${vendor}|${renderer}`
  } catch (error) {
    logger.warn('WebGL 信息获取失败:', error.message)
    return ''
  }
}

/**
 * 收集 Electron 环境信息
 * @returns {Promise<Object>} Electron 信息对象
 */
const collectElectronInfo = async () => {
  const info = {
    type: 'electron',
  }

  try {
    if (window.electronAPI) {
      const electronDetails = await window.electronAPI.getClientInfo()
      info.electronVersion = electronDetails.electronVersion
      info.chromeVersion = electronDetails.chromeVersion
      info.nodeVersion = electronDetails.nodeVersion
      info.platform = electronDetails.platform
      info.arch = electronDetails.arch
    }
  } catch (error) {
    logger.warn('获取 Electron 信息失败:', error.message)
  }

  // 同时收集浏览器信息作为补充
  info.browser = collectBrowserInfo()

  return info
}

/**
 * 收集 Capacitor 移动端信息
 * @returns {Promise<Object>} Capacitor 信息对象
 */
const collectCapacitorInfo = async () => {
  const info = {
    type: 'capacitor',
  }

  try {
    if (window.Capacitor?.Plugins?.Device) {
      const deviceInfo = await window.Capacitor.Plugins.Device.getInfo()
      info.model = deviceInfo.model
      info.platform = deviceInfo.platform
      info.osVersion = deviceInfo.osVersion
      info.manufacturer = deviceInfo.manufacturer
      info.uuid = deviceInfo.uuid
    }
  } catch (error) {
    logger.warn('获取 Capacitor 设备信息失败:', error.message)
  }

  return info
}

/**
 * 将对象转换为字符串
 * @param {Object} obj - 对象
 * @returns {string} 字符串
 */
const objectToString = (obj) => {
  return JSON.stringify(obj, Object.keys(obj).sort())
}

/**
 * 生成设备指纹
 * @returns {Promise<string>} 设备指纹（SHA-256 哈希值）
 */
export const generateDeviceFingerprint = async () => {
  try {
    logger.info('开始生成设备指纹...')

    const clientInfo = getClientInfoSync()
    let deviceData = {}

    // 根据不同环境收集信息
    if (clientInfo.type === ClientType.ELECTRON) {
      // Electron 环境
      deviceData = await collectElectronInfo()
      logger.info('Electron 环境信息已收集')
    } else if (clientInfo.type === ClientType.ANDROID || clientInfo.type === ClientType.IOS) {
      // Capacitor 移动端环境
      deviceData = await collectCapacitorInfo()
      logger.info('Capacitor 环境信息已收集')
    } else {
      // 浏览器环境
      deviceData = {
        type: 'browser',
        ...collectBrowserInfo(),
      }
      logger.info('浏览器环境信息已收集')
    }

    // 将数据转换为字符串
    const dataString = objectToString(deviceData)
    logger.debug('设备数据:', dataString)

    // 生成 SHA-256 哈希
    const fingerprint = await sha256(dataString)
    logger.info('设备指纹生成成功:', fingerprint.substring(0, 16) + '...')

    return fingerprint
  } catch (error) {
    logger.error('生成设备指纹失败:', error)
    // 如果失败，返回一个基于时间戳的临时指纹
    return simpleHash(Date.now().toString() + Math.random().toString())
  }
}

/**
 * 获取设备指纹（带缓存）
 * @param {boolean} forceRefresh - 是否强制刷新
 * @returns {Promise<string>} 设备指纹
 */
export const getDeviceFingerprint = async (forceRefresh = false) => {
  // 如果已有缓存且不强制刷新，直接返回
  if (fingerprintCache && !forceRefresh) {
    logger.debug('使用缓存的设备指纹')
    return fingerprintCache
  }

  // 生成新的设备指纹
  fingerprintCache = await generateDeviceFingerprint()
  return fingerprintCache
}

/**
 * 清除设备指纹缓存
 */
export const clearFingerprintCache = () => {
  fingerprintCache = null
  logger.info('设备指纹缓存已清除')
}

/**
 * 默认导出
 */
export default {
  generateDeviceFingerprint,
  getDeviceFingerprint,
  clearFingerprintCache,
}
