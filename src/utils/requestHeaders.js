/**
 * 请求头管理工具
 * 用于统一添加设备信息、IP信息等请求头
 */

import { createLogger } from './logger'
import { getClientInfoSync, getClientIdentifier, ClientType } from './clientDetector'
import { getDeviceFingerprint } from './deviceFingerprint'

const logger = createLogger('RequestHeaders')

// IP 缓存（5分钟有效期）
let ipCache = {
  ip: null,
  timestamp: 0,
}

const CACHE_DURATION = 5 * 60 * 1000 // 5分钟

/**
 * 获取公网 IP（带缓存）
 * @returns {Promise<string>} 公网 IP 地址
 */
const getPublicIP = async () => {
  const now = Date.now()
  
  // 检查缓存是否有效
  if (ipCache.ip && (now - ipCache.timestamp) < CACHE_DURATION) {
    logger.debug('使用缓存的 IP:', ipCache.ip)
    return ipCache.ip
  }
  
  try {
    logger.info('开始获取公网 IP...')
    
    // 尝试多个 IP 获取 API
    const ipApis = [
      'https://ifconfig.me/ip',
      'https://api.ipify.org?format=json',
      'https://icanhazip.com'
    ]
    
    let publicIP = null
    
    for (const api of ipApis) {
      try {
        logger.debug(`尝试从 ${api} 获取 IP...`)
        
        // 使用 AbortController 实现超时控制
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        
        const response = await fetch(api, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'Accept': 'text/plain,application/json'
          }
        })
        
        clearTimeout(timeoutId)
        
        if (response.ok) {
          const text = await response.text()
          
          // 不同 API 返回格式不同
          if (api.includes('ipify')) {
            // {"ip":"203.0.113.45"}
            try {
              const data = JSON.parse(text)
              publicIP = data.ip
            } catch (e) {
              logger.warn(`解析 ${api} 响应失败:`, e.message)
              continue
            }
          } else {
            // 纯文本 IP 地址
            publicIP = text.trim()
          }
          
          if (publicIP && isValidIP(publicIP)) {
            logger.info(`成功获取 IP: ${publicIP} (来自 ${api})`)
            
            // 更新缓存
            ipCache = {
              ip: publicIP,
              timestamp: now,
            }
            
            break
          } else {
            logger.warn(`获取的 IP 无效: ${publicIP}`)
            publicIP = null
          }
        } else {
          logger.warn(`${api} 返回错误状态: ${response.status}`)
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          logger.warn(`${api} 请求超时（5秒）`)
        } else {
          logger.warn(`从 ${api} 获取 IP 失败:`, error.message)
        }
        continue
      }
    }
    
    if (!publicIP) {
      logger.warn('所有 IP API 都失败')
      return ''
    }
    
    return publicIP
  } catch (error) {
    logger.error('获取 IP 信息失败:', error)
    return ''
  }
}

/**
 * 验证 IP 地址格式
 * @param {string} ip - IP 地址
 * @returns {boolean} 是否为有效 IP
 */
const isValidIP = (ip) => {
  if (!ip || ip === '未知' || ip === 'unknown') {
    return false
  }
  
  // IPv4 正则
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
  // IPv6 正则（简化版）
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/
  
  if (ipv4Regex.test(ip)) {
    // 验证每个段是否在 0-255 之间
    const parts = ip.split('.')
    return parts.every(part => {
      const num = parseInt(part)
      return num >= 0 && num <= 255
    })
  }
  
  return ipv6Regex.test(ip)
}

/**
 * 检测浏览器类型
 * @returns {string} 浏览器名称
 */
const detectBrowser = () => {
  if (typeof navigator === 'undefined') {
    return 'unknown'
  }
  
  const ua = navigator.userAgent.toLowerCase()
  
  if (ua.includes('edg/')) return 'edge'
  if (ua.includes('chrome') && !ua.includes('edg')) return 'chrome'
  if (ua.includes('firefox')) return 'firefox'
  if (ua.includes('safari') && !ua.includes('chrome')) return 'safari'
  if (ua.includes('opera') || ua.includes('opr')) return 'opera'
  
  return 'unknown'
}

/**
 * 添加设备信息到请求头
 * @param {Headers} headers - 现有的请求头
 * @returns {Headers} - 添加了设备信息的请求头
 */
export const addDeviceInfoToHeaders = (headers) => {
  const clientInfo = getClientInfoSync()
  const clientIdentifier = getClientIdentifier()
  
  // 添加客户端类型
  headers.set('X-Client-Type', clientInfo.type)
  
  // 添加客户端标识
  headers.set('X-Client-Identifier', clientIdentifier)
  
  // 添加平台信息
  headers.set('X-Client-Platform', clientInfo.platform)
  
  // 如果是 Electron，添加版本信息
  if (clientInfo.isElectron && window.electronAPI) {
    try {
      const electronDetails = window.electronAPI.getClientInfo()
      if (electronDetails && electronDetails.electronVersion) {
        headers.set('X-Electron-Version', electronDetails.electronVersion)
      }
    } catch (error) {
      logger.warn('获取 Electron 版本失败:', error)
    }
  }
  
  // 如果是浏览器，添加浏览器类型
  if (clientInfo.type === ClientType.BROWSER) {
    const browser = detectBrowser()
    headers.set('X-Browser-Type', browser)
  }
  
  return headers
}

/**
 * 添加 IP 信息到请求头
 * @param {Headers} headers - 现有的请求头
 * @returns {Promise<Headers>} - 添加了 IP 信息的请求头
 */
export const addIPInfoToHeaders = async (headers) => {
  try {
    const publicIP = await getPublicIP()
    
    // 只有当 IP 有效时才设置请求头
    if (publicIP && isValidIP(publicIP)) {
      headers.set('X-Client-IP', publicIP)
      logger.debug('已添加 X-Client-IP 请求头:', publicIP)
    } else {
      logger.debug('IP 无效，跳过添加 X-Client-IP 请求头')
    }
  } catch (error) {
    logger.warn('添加 IP 信息失败:', error)
  }
  
  return headers
}

/**
 * 添加设备指纹到请求头
 * @param {Headers} headers - 现有的请求头
 * @returns {Promise<Headers>} - 添加了设备指纹的请求头
 */
export const addDeviceFingerprintToHeaders = async (headers) => {
  try {
    const fingerprint = await getDeviceFingerprint()
    
    if (fingerprint) {
      headers.set('X-Device-Fingerprint', fingerprint)
      logger.debug('已添加 X-Device-Fingerprint 请求头:', fingerprint.substring(0, 16) + '...')
    }
  } catch (error) {
    logger.warn('添加设备指纹失败:', error)
  }
  
  return headers
}

/**
 * 添加所有请求头（设备信息 + IP 信息 + 设备指纹）
 * @param {Headers} headers - 现有的请求头
 * @returns {Promise<Headers>} - 添加了所有请求头的 Headers 对象
 */
export const addAllRequestHeaders = async (headers) => {
  // 添加设备信息（同步）
  headers = addDeviceInfoToHeaders(headers)
  
  // 添加设备指纹（异步）
  headers = await addDeviceFingerprintToHeaders(headers)
  
  // 添加 IP 信息（异步）
  headers = await addIPInfoToHeaders(headers)
  
  return headers
}

/**
 * 创建带有所有请求头的 Headers 对象
 * @param {Object} customHeaders - 自定义请求头
 * @returns {Promise<Headers>} - 完整的 Headers 对象
 */
export const createHeadersWithAllInfo = async (customHeaders = {}) => {
  const headers = new Headers()
  
  // 添加自定义请求头
  Object.entries(customHeaders).forEach(([key, value]) => {
    if (value) {
      headers.set(key, value)
    }
  })
  
  // 添加设备信息和 IP 信息
  return await addAllRequestHeaders(headers)
}

/**
 * 默认导出
 */
export default {
  addDeviceInfoToHeaders,
  addIPInfoToHeaders,
  addDeviceFingerprintToHeaders,
  addAllRequestHeaders,
  createHeadersWithAllInfo,
}
