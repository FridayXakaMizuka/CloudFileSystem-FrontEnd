/**
 * 全局 Fetch 拦截器
 * 自动为所有 fetch 请求添加安全请求头
 * 
 * 使用方法：
 * 1. 在 main.js 中导入：import './utils/fetchInterceptor'
 * 2. 所有 fetch 请求会自动添加安全请求头
 * 3. 无需修改现有代码
 */

import { createSecureFetchOptions } from './requestHeaders'
import { createLogger } from './logger'

const logger = createLogger('FetchInterceptor')

// 保存原始的 fetch 函数
const originalFetch = window.fetch

/**
 * 拦截并增强 fetch 函数
 */
window.fetch = async function(url, options = {}) {
  try {
    // 1. 检查是否需要跳过拦截（可选配置）
    if (shouldSkipInterceptor(url, options)) {
      logger.debug('跳过拦截:', url)
      return originalFetch.call(this, url, options)
    }

    // 2. 为请求添加安全请求头
    logger.debug('🔧 拦截器处理请求:', typeof url === 'string' ? url : url.url)
    const secureOptions = await createSecureFetchOptions(options)
    
    // 3. 记录请求日志（开发环境）
    if (import.meta.env.DEV) {
      logger.debug('📤 请求:', {
        method: secureOptions.method || 'GET',
        url: typeof url === 'string' ? url : url.url,
        headers: Object.fromEntries(secureOptions.headers.entries())
      })
    } else {
      // 生产环境也记录关键信息
      logger.info('📤 请求:', {
        url: typeof url === 'string' ? url : url.url,
        hasDeviceFingerprint: secureOptions.headers.has('X-Device-Fingerprint'),
        deviceFingerprint: secureOptions.headers.get('X-Device-Fingerprint')?.substring(0, 16) + '...'
      })
    }

    // 4. 发送请求
    const response = await originalFetch.call(this, url, secureOptions)

    // 5. 记录响应日志（开发环境）
    if (import.meta.env.DEV) {
      logger.debug('📥 响应:', {
        status: response.status,
        url: response.url
      })
    }

    return response

  } catch (error) {
    logger.error('❌ 请求失败:', error)
    throw error
  }
}

/**
 * 判断是否应该跳过拦截
 * @param {string|Request} url - 请求URL
 * @param {Object} options - 请求选项
 * @returns {boolean} 是否跳过
 */
const shouldSkipInterceptor = (url, options) => {
  // 获取请求URL字符串
  const urlString = typeof url === 'string' ? url : url.url
  
  // 可以配置跳过的URL列表
  const skipPatterns = [
    // 跳过外部 IP API（这些 API 不需要安全请求头）
    'https://api.ipify.org',
    'https://api64.ipify.org',
    'https://ifconfig.me',
    'https://icanhazip.com',
    'https://ipapi.co',
    'http://ip-api.com',
    'https://ipwho.is',
  ]

  // 检查是否匹配跳过模式
  return skipPatterns.some(pattern => urlString.includes(pattern))
}

/**
 * 恢复原始 fetch（用于调试或特殊场景）
 */
export const restoreOriginalFetch = () => {
  window.fetch = originalFetch
  logger.info('已恢复原始 fetch')
}

/**
 * 重新应用拦截器
 */
export const reapplyInterceptor = () => {
  window.fetch = window.fetch // 重新赋值
  logger.info('已重新应用拦截器')
}

logger.info('✅ Fetch 拦截器已启用')
logger.info('所有 fetch 请求将自动添加安全请求头')
