import JSEncrypt from 'jsencrypt'
import { setCookie, getRSAPublicKeyFromCookie } from './cookie'
import { createLogger } from './logger'
import { AUTH_API } from '@/config/api'
import { getSessionId, resetSessionIdExpiry, resetPurposeSessionIdExpiry } from './sessionId'

const logger = createLogger('RSA')

/**
 * 获取RSA公钥（前端生成 sessionId）
 * @param {string} purpose - 可选的用途标识（'email', 'phone', 'password'），用于特定用途
 * @returns {Promise<{publicKey: string, sessionId: string}>}
 */
export const fetchRSAKey = async (purpose = null) => {
  try {
    logger.info('开始获取RSA公钥...', purpose ? `(用途: ${purpose})` : '(全局)')
    
    // 1. 根据用途获取或生成 sessionId
    let sessionId
    if (purpose) {
      // 使用专用 sessionId
      const { getOrCreatePurposeSessionId } = await import('./sessionId')
      sessionId = getOrCreatePurposeSessionId(purpose)
      logger.info(`使用 ${purpose} 专用 sessionId:`, sessionId)
    } else {
      // 使用全局 sessionId
      sessionId = getSessionId()
      logger.info('使用全局 sessionId:', sessionId)
    }
    
    // 2. 发送请求获取公钥（携带 sessionId）
    const response = await fetch(AUTH_API.RSA_KEY, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sessionId })
    })
    
    logger.debug('响应状态:', response.status)
    logger.debug('响应OK:', response.ok)
    
    if (!response.ok) {
      logger.error('获取公钥请求失败，HTTP 状态码:', response.status)
      throw new Error(`获取公钥失败: HTTP ${response.status}`)
    }
    
    const data = await response.json()
    logger.debug('响应数据:', data)
    
    if (data.publicKey) {
      logger.info('RSA公钥获取成功')
      
      // 重置 sessionId 有效期（根据是否使用专用 sessionId）
      if (purpose) {
        resetPurposeSessionIdExpiry(purpose)
      } else {
        resetSessionIdExpiry()
      }
      
      // 将 publicKey 保存到 Cookie（有效期7天）
      setCookie('rsaPublicKey', encodeURIComponent(data.publicKey), 7)
      logger.info('publicKey 已保存到 Cookie')
      
      return {
        publicKey: data.publicKey,
        sessionId: sessionId
      }
    } else {
      const errorMsg = data.message || '获取公钥失败'
      logger.error('获取公钥失败 - 错误信息:', errorMsg)
      logger.error('完整响应:', data)
      throw new Error(errorMsg)
    }
  } catch (error) {
    logger.error('获取RSA公钥请求失败:', error)
    logger.error('错误详情:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    })
    throw error
  }
}



/**
 * 使用RSA加密密码
 * @param {string} password - 原始密码
 * @param {string} publicKey - RSA公钥
 * @returns {string} 加密后的密码
 */
export const encryptPassword = (password, publicKey) => {
  const encrypt = new JSEncrypt()
  encrypt.setPublicKey(publicKey)
  const encrypted = encrypt.encrypt(password)
  
  if (!encrypted) {
    throw new Error('密码加密失败')
  }
  
  return encrypted
}


