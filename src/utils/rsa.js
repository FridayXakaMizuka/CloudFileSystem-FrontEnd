import JSEncrypt from 'jsencrypt'
import { setCookie, getSessionIdFromCookie, getRSAPublicKeyFromCookie } from './cookie'
import { createLogger } from './logger'

const logger = createLogger('RSA')

/**
 * 获取RSA公钥（不请求新密钥，仅从后端获取公钥）
 * @returns {Promise<{publicKey: string, sessionId: string}>}
 */
export const fetchRSAKey = async () => {
  try {
    logger.info('开始获取RSA公钥...')
    const response = await fetch('http://localhost:8835/api/auth/rsa-key', {
      credentials: 'include'  // 允许发送和接收 Cookie
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
      
      // 优先从响应中获取 sessionId，如果没有则从 Cookie 中读取
      let sessionId = data.sessionId
      if (!sessionId) {
        sessionId = getSessionIdFromCookie()
        logger.debug('从 Cookie 中读取到 sessionId:', sessionId)
      }
      
      // 将 sessionId 和 publicKey 都保存到 Cookie（有效期7天），实现页面刷新后自动读取
      if (sessionId) {
        setCookie('sessionId', sessionId, 7)
        logger.info('sessionId 已保存到 Cookie')
      }
      
      if (data.publicKey) {
        // 对公钥进行 URI 编码，避免特殊字符问题
        setCookie('rsaPublicKey', encodeURIComponent(data.publicKey), 7)
        logger.info('publicKey 已保存到 Cookie')
      }
      
      return {
        publicKey: data.publicKey,
        sessionId: sessionId || ''
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
 * 从 Cookie 读取 sessionId 并验证密钥有效性
 * @returns {Promise<{publicKey: string, sessionId: string}|null>} 验证成功返回密钥对，失败返回 null
 */
export const getValidatedRSAKey = async () => {
  try {
    logger.info('开始从 Cookie 读取并验证 RSA 密钥...')
    
    // 1. 从 Cookie 读取 sessionId 和 publicKey
    const sessionId = getSessionIdFromCookie()
    const publicKey = getRSAPublicKeyFromCookie()
    
    if (!sessionId) {
      logger.info('Cookie 中没有 sessionId，需要重新获取密钥')
      return null
    }
    
    logger.info('从 Cookie 读取到 sessionId:', sessionId)
    if (publicKey) {
      logger.info('从 Cookie 读取到 publicKey (长度):', publicKey.length)
    } else {
      logger.warn('Cookie 中没有 publicKey')
    }
    
    // 2. 构建请求体
    const requestBody = {
      sessionId: sessionId
    }
    
    // 如果有公钥，则加入请求体
    if (publicKey) {
      requestBody.publicKey = publicKey
      logger.debug('验证请求将包含 sessionId 和 publicKey')
    } else {
      logger.debug('验证请求只包含 sessionId')
    }
    
    // 3. 发送验证请求
    logger.info('正在向后端验证密钥有效性...')
    const response = await fetch('http://localhost:8835/api/auth/is_rsa_valid', {
      method: 'POST',
      credentials: 'include',  // 自动携带 Cookie
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })
    
    logger.debug('验证响应状态:', response.status)
    
    if (!response.ok) {
      logger.error('验证请求失败，HTTP 状态码:', response.status)
      return null
    }
    
    const data = await response.json()
    logger.debug('密钥验证响应数据:', data)
    
    // 情况1: 密钥有效，直接使用
    if (data.valid === true && data.publicKey) {
      logger.info('RSA 密钥有效，使用 Cookie 中的 sessionId')
      
      // 如果后端返回了新的公钥，更新 Cookie
      if (data.publicKey !== publicKey) {
        setCookie('rsaPublicKey', encodeURIComponent(data.publicKey), 7)
        logger.info('已更新 Cookie 中的 publicKey')
      }
      
      return {
        publicKey: data.publicKey,
        sessionId: sessionId
      }
    }
    
    // 情况2: 密钥无效，但后端返回了新的密钥对（后端自动刷新机制）
    if (data.valid === false && data.publicKey && data.sessionId) {
      logger.info('RSA 密钥已失效，使用后端返回的新密钥对')
      logger.debug('旧 sessionId:', sessionId)
      logger.debug('新 sessionId:', data.sessionId)
      
      // 保存新的 sessionId 和 publicKey 到 Cookie
      setCookie('sessionId', data.sessionId, 7)
      setCookie('rsaPublicKey', encodeURIComponent(data.publicKey), 7)
      logger.info('新密钥对已更新到 Cookie')
      
      return {
        publicKey: data.publicKey,
        sessionId: data.sessionId
      }
    }
    
    // 情况3: 其他异常情况
    logger.warn('RSA 密钥验证异常，需要重新获取')
    logger.warn('data.valid:', data.valid)
    logger.warn('data.publicKey:', data.publicKey ? '存在' : '不存在')
    logger.warn('data.sessionId:', data.sessionId ? '存在' : '不存在')
    logger.warn('完整响应:', data)
    return null
    
  } catch (error) {
    logger.error('验证 RSA 密钥时发生异常:', error)
    logger.error('错误名称:', error.name)
    logger.error('错误消息:', error.message)
    logger.error('错误堆栈:', error.stack)
    return null
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

/**
 * 验证RSA密钥对有效性（后端在密钥无效时会自动返回新密钥）
 * @param {string} sessionId - 会话ID
 * @param {string} publicKey - RSA公钥（可选，如果提供则用于验证）
 * @returns {Promise<{sessionId: string, publicKey: string}>} 返回有效的会话ID和公钥（可能是新的）
 */
export const validateRsaKey = async (sessionId, publicKey) => {
  try {
    logger.info('开始验证RSA密钥对...')
    const requestBody = {
      sessionId: sessionId
    }
    
    // 如果提供了公钥，则加入请求体进行验证
    if (publicKey) {
      requestBody.publicKey = publicKey
    }
    
    const response = await fetch('http://localhost:8835/api/auth/is_rsa_valid', {
      method: 'POST',
      credentials: 'include',  // 自动携带 Cookie
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    const data = await response.json()
    logger.debug('RSA密钥验证响应:', data)

    if (data.valid) {
      logger.info('RSA密钥对有效，继续使用原有密钥')
      return { 
        sessionId: data.sessionId || sessionId,
        publicKey: data.publicKey || publicKey 
      }
    } else {
      logger.warn('RSA密钥对无效，后端已返回新密钥')
      
      // 优先使用后端返回的新密钥信息
      const newSessionId = data.sessionId || getSessionIdFromCookie()
      const newPublicKey = data.publicKey
      
      if (!newPublicKey) {
        throw new Error('后端未返回新的公钥')
      }
      
      logger.info('使用后端返回的新密钥')
      return {
        sessionId: newSessionId,
        publicKey: newPublicKey
      }
    }
  } catch (error) {
    logger.error('验证RSA密钥对失败:', error)
    throw error
  }
}
