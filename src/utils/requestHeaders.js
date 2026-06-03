/**
 * 请求头管理工具
 * 用于统一添加设备信息、IP信息等请求头
 */

import { createLogger } from './logger'
import { getClientInfoSync, getClientIdentifier, ClientType } from './clientDetector'
import { getDeviceFingerprint } from './deviceFingerprint'
import axios from 'axios'

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
      { url: 'https://ifconfig.me/ip', type: 'text' },
      { url: 'https://api.ipify.org?format=json', type: 'json' },
      { url: 'https://icanhazip.com', type: 'text' }
    ]
    
    let publicIP = null
    
    // 使用 Promise.race 实现超时控制，确保单个请求不会卡住
    for (const api of ipApis) {
      try {
        logger.debug(`尝试从 ${api.url} 获取 IP...`)
        
        // 创建 Axios 实例，配置超时
        const axiosInstance = axios.create({
          timeout: 3000, // 3秒超时
          headers: {
            'Accept': api.type === 'json' ? 'application/json' : 'text/plain'
          }
        })
        
        // 发起请求
        const response = await axiosInstance.get(api.url)
        
        let extractedIP = null
        
        if (api.type === 'json') {
          // JSON 格式响应
          if (response.data && response.data.ip) {
            extractedIP = response.data.ip
          }
        } else {
          // 纯文本响应
          extractedIP = response.data.trim()
        }
        
        if (extractedIP && isValidIP(extractedIP)) {
          publicIP = extractedIP
          logger.info(`成功获取 IP: ${publicIP} (来自 ${api.url})`)
          
          // 更新缓存
          ipCache = {
            ip: publicIP,
            timestamp: now,
          }
          
          break
        } else {
          logger.warn(`获取的 IP 无效: ${extractedIP}`)
        }
      } catch (error) {
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
          logger.warn(`${api.url} 请求超时（3秒）`)
        } else if (error.code === 'ERR_NETWORK') {
          logger.warn(`${api.url} 网络错误:`, error.message)
        } else {
          logger.warn(`从 ${api.url} 获取 IP 失败:`, error.message)
        }
        // 继续尝试下一个 API
        continue
      }
    }
    
    if (!publicIP) {
      logger.warn('所有 IP API 都失败，返回空字符串')
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
  // 不阻塞主流程，在后台异步获取 IP
  // 使用 .then() 而不是 await，确保立即返回
  getPublicIP().then(publicIP => {
    if (publicIP && isValidIP(publicIP)) {
      headers.set('X-Client-IP', publicIP)
      logger.debug('已添加 X-Client-IP 请求头:', publicIP)
    } else {
      logger.debug('IP 无效或获取失败，跳过添加 X-Client-IP 请求头')
    }
  }).catch(error => {
    logger.warn('添加 IP 信息失败:', error)
  })
  
  // 立即返回，不等待 IP 获取完成
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
