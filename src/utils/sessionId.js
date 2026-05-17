/**
 * 会话 ID 生成和管理工具
 * 前端生成 UUID v4 格式的 sessionId，存储到 sessionStorage（每个标签页独立）
 * 
 * 重要改进：
 * - 使用 sessionStorage 替代 Cookie，实现浏览器标签页级别的会话隔离
 * - 每个标签页/窗口有独立的 sessionId，避免多实例登录冲突
 * - 关闭标签页后自动清除，提高安全性
 */

import { createLogger } from './logger'

const logger = createLogger('SessionId')

// Session ID 有效期（5分钟，单位：秒）
const SESSION_ID_EXPIRY = 300
// Session ID 重置后的有效期（295秒，比 300 秒少 5 秒作为缓冲）
const SESSION_ID_RESET_EXPIRY = 295

/**
 * 生成 UUID v4 格式的会话 ID
 * @returns {string} UUID v4 格式的会话 ID
 */
export const generateSessionId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * 从 sessionStorage 获取值
 * @param {string} key - 键名
 * @returns {string|null} 值或 null
 */
const getSessionStorage = (key) => {
  try {
    return sessionStorage.getItem(key)
  } catch (error) {
    logger.error(`读取 sessionStorage ${key} 失败:`, error)
    return null
  }
}

/**
 * 向 sessionStorage 设置值
 * @param {string} key - 键名
 * @param {string} value - 值
 */
const setSessionStorage = (key, value) => {
  try {
    sessionStorage.setItem(key, value)
  } catch (error) {
    logger.error(`写入 sessionStorage ${key} 失败:`, error)
  }
}

/**
 * 从 sessionStorage 删除值
 * @param {string} key - 键名
 */
const removeSessionStorage = (key) => {
  try {
    sessionStorage.removeItem(key)
  } catch (error) {
    logger.error(`删除 sessionStorage ${key} 失败:`, error)
  }
}

/**
 * 获取当前会话 ID（从 sessionStorage 读取，如果过期则重新生成）
 * @returns {string} 会话 ID
 */
export const getSessionId = () => {
  try {
    // 从 sessionStorage 读取 sessionId 和创建时间
    const sessionId = getSessionStorage('sessionId')
    const sessionTimestamp = getSessionStorage('sessionTimestamp')
    
    if (!sessionId || !sessionTimestamp) {
      // sessionStorage 中没有，生成新的
      logger.info('sessionStorage 中没有 sessionId，生成新的')
      return createNewSessionId()
    }
    
    // 检查是否过期
    const now = Date.now()
    const createdTime = parseInt(sessionTimestamp, 10)
    const elapsed = (now - createdTime) / 1000 // 转换为秒
    
    if (elapsed >= SESSION_ID_EXPIRY) {
      // 已过期，重新生成
      logger.info(`sessionId 已过期（${elapsed.toFixed(0)}s >= ${SESSION_ID_EXPIRY}s），重新生成`)
      return createNewSessionId()
    }
    
    // 未过期，返回现有的
    logger.debug(`sessionId 有效（已使用 ${elapsed.toFixed(0)}s）`)
    return sessionId
    
  } catch (error) {
    logger.error('获取 sessionId 失败:', error)
    return createNewSessionId()
  }
}

/**
 * 创建新的会话 ID 并保存到 sessionStorage
 * @returns {string} 新生成的会话 ID
 */
export const createNewSessionId = () => {
  const sessionId = generateSessionId()
  const timestamp = Date.now().toString()
  
  // 保存到 sessionStorage（5分钟有效期由前端检查）
  setSessionStorage('sessionId', sessionId)
  setSessionStorage('sessionTimestamp', timestamp)
  
  logger.info('已生成新的 sessionId:', sessionId)
  logger.debug('创建时间戳:', timestamp)
  
  return sessionId
}

/**
 * 清除会话 ID（从 sessionStorage 中删除）
 */
export const clearSessionId = () => {
  removeSessionStorage('sessionId')
  removeSessionStorage('sessionTimestamp')
  logger.info('已清除 sessionId')
}

/**
 * 创建或获取特定用途的会话 ID
 * @param {string} purpose - 用途标识（'email', 'phone', 'password'）
 * @returns {string} 会话 ID
 */
export const getOrCreatePurposeSessionId = (purpose) => {
  try {
    const storageName = `sessionId_${purpose}`
    const timestampName = `sessionTimestamp_${purpose}`
    
    // 从 sessionStorage 读取
    const sessionId = getSessionStorage(storageName)
    const sessionTimestamp = getSessionStorage(timestampName)
    
    if (!sessionId || !sessionTimestamp) {
      // sessionStorage 中没有，生成新的
      logger.info(`sessionStorage 中没有 ${purpose} 的 sessionId，生成新的`)
      return createNewPurposeSessionId(purpose)
    }
    
    // 检查是否过期
    const now = Date.now()
    const createdTime = parseInt(sessionTimestamp, 10)
    const elapsed = (now - createdTime) / 1000 // 转换为秒
    
    if (elapsed >= SESSION_ID_EXPIRY) {
      // 已过期，重新生成
      logger.info(`${purpose} 的 sessionId 已过期（${elapsed.toFixed(0)}s >= ${SESSION_ID_EXPIRY}s），重新生成`)
      return createNewPurposeSessionId(purpose)
    }
    
    // 未过期，返回现有的
    logger.debug(`${purpose} 的 sessionId 有效（已使用 ${elapsed.toFixed(0)}s）`)
    return sessionId
    
  } catch (error) {
    logger.error(`获取 ${purpose} 的 sessionId 失败:`, error)
    return createNewPurposeSessionId(purpose)
  }
}

/**
 * 创建新的特定用途会话 ID 并保存到 sessionStorage
 * @param {string} purpose - 用途标识（'email', 'phone', 'password'）
 * @returns {string} 新生成的会话 ID
 */
export const createNewPurposeSessionId = (purpose) => {
  const sessionId = generateSessionId()
  const timestamp = Date.now().toString()
  
  const storageName = `sessionId_${purpose}`
  const timestampName = `sessionTimestamp_${purpose}`
  
  // 保存到 sessionStorage（5分钟有效期由前端检查）
  setSessionStorage(storageName, sessionId)
  setSessionStorage(timestampName, timestamp)
  
  logger.info(`已生成新的 ${purpose} sessionId:`, sessionId)
  logger.debug('创建时间戳:', timestamp)
  
  return sessionId
}

/**
 * 重置特定用途会话 ID 的有效期（在请求成功时调用）
 * @param {string} purpose - 用途标识（'email', 'phone', 'password'）
 */
export const resetPurposeSessionIdExpiry = (purpose) => {
  try {
    const storageName = `sessionId_${purpose}`
    const timestampName = `sessionTimestamp_${purpose}`
    
    const sessionId = getSessionStorage(storageName)
    
    if (!sessionId) {
      logger.warn(`没有 ${purpose} 的 sessionId，无法重置有效期`)
      return false
    }
    
    // 更新创建时间戳为当前时间
    const timestamp = Date.now().toString()
    setSessionStorage(storageName, sessionId)
    setSessionStorage(timestampName, timestamp)
    
    logger.info(`${purpose} 的 sessionId 有效期已重置为 ${SESSION_ID_RESET_EXPIRY} 秒`)
    logger.debug('新的时间戳:', timestamp)
    
    return true
  } catch (error) {
    logger.error(`重置 ${purpose} 的 sessionId 有效期失败:`, error)
    return false
  }
}

/**
 * 清除特定用途的会话 ID
 * @param {string} purpose - 用途标识（'email', 'phone', 'password'）
 */
export const clearPurposeSessionId = (purpose) => {
  const storageName = `sessionId_${purpose}`
  const timestampName = `sessionTimestamp_${purpose}`
  
  removeSessionStorage(storageName)
  removeSessionStorage(timestampName)
  logger.info(`已清除 ${purpose} 的 sessionId`)
}

/**
 * 重置会话 ID 的有效期（在 /auth 请求成功时调用）
 * 将 sessionId 的创建时间更新为当前时间，有效期重置为 295 秒
 */
export const resetSessionIdExpiry = () => {
  try {
    const sessionId = getSessionStorage('sessionId')
    
    if (!sessionId) {
      logger.warn('没有 sessionId，无法重置有效期')
      return false
    }
    
    // 更新创建时间戳为当前时间
    const timestamp = Date.now().toString()
    setSessionStorage('sessionId', sessionId)
    setSessionStorage('sessionTimestamp', timestamp)
    
    logger.info(`sessionId 有效期已重置为 ${SESSION_ID_RESET_EXPIRY} 秒`)
    logger.debug('新的时间戳:', timestamp)
    
    return true
  } catch (error) {
    logger.error('重置 sessionId 有效期失败:', error)
    return false
  }
}

/**
 * 验证昵称格式（只含数字、字母和下划线，必须以字母开头）
 * @param {string} nickname - 用户昵称
 * @returns {boolean} 是否符合规范
 */
export const isValidNickname = (nickname) => {
  if (!nickname || nickname.length === 0) {
    return false
  }
  
  // 正则：以字母开头，后面可以是字母、数字或下划线
  const nicknameRegex = /^[a-zA-Z][a-zA-Z0-9_]*$/
  return nicknameRegex.test(nickname)
}

/**
 * 验证密码长度（6-14位，无字符限制）
 * @param {string} password - 密码
 * @returns {boolean} 是否符合长度要求
 */
export const isValidPasswordLength = (password) => {
  if (!password) {
    return false
  }
  
  return password.length >= 6 && password.length <= 14
}

/**
 * 验证手机号格式（可选字段）
 * @param {string} phone - 手机号
 * @returns {boolean|null} true=有效，false=无效，null=未填写（允许）
 */
export const validatePhone = (phone) => {
  // 如果为空，返回 null（表示可选，不验证）
  if (!phone || phone.trim() === '') {
    return null
  }
  
  // 如果不为空，验证格式
  const phoneRegex = /^1[3-9]\d{9}$/
  return phoneRegex.test(phone)
}
