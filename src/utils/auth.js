/**
 * 认证管理工具
 * 处理 JWT 令牌的存储、获取和清理
 */

import { createLogger } from './logger'

const logger = createLogger('Auth')

const TOKEN_KEY = 'jwt_token'
const USER_INFO_KEY = 'user_info'

/**
 * 保存 JWT 令牌和用户信息到 localStorage
 * @param {string} token - JWT 令牌
 * @param {Object} userInfo - 用户信息对象
 */
export const saveAuthInfo = (token, userInfo) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
    logger.info('JWT 令牌已保存')
  }
  if (userInfo) {
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo))
    logger.info('用户信息已保存')
  }
}

/**
 * 获取 JWT 令牌
 * @returns {string|null} JWT 令牌或 null
 */
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY)
}

/**
 * 获取用户信息
 * @returns {Object|null} 用户信息对象或 null
 */
export const getUserInfo = () => {
  const info = localStorage.getItem(USER_INFO_KEY)
  return info ? JSON.parse(info) : null
}

/**
 * 检查用户是否已登录（通过是否存在有效令牌判断）
 * @returns {boolean} 是否已登录
 */
export const isLoggedIn = () => {
  return !!getToken()
}

/**
 * 清除认证信息（退出登录时调用）
 */
export const clearAuthInfo = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_INFO_KEY)
  logger.info('认证信息已清除')
}

/**
 * 创建包含认证头的请求配置
 * @param {Object} config - 原始请求配置
 * @returns {Object} 包含 Authorization 头的配置
 */
export const authHeader = (config = {}) => {
  const token = getToken()
  if (token) {
    return {
      ...config,
      headers: {
        ...config.headers,
        'Authorization': `Bearer ${token}`
      }
    }
  }
  return config
}

/**
 * 解析 JWT 令牌（不验证签名，仅解码 payload）
 * @param {string} token - JWT 令牌
 * @returns {Object|null} 解码后的 payload 或 null
 */
export const decodeJWT = (token) => {
  try {
    if (!token) {
      logger.warn('没有提供 JWT 令牌')
      return null
    }

    // JWT 格式: header.payload.signature
    const parts = token.split('.')
    if (parts.length !== 3) {
      logger.error('无效的 JWT 格式')
      return null
    }

    // 解码 payload（第二部分）
    const payload = parts[1]
    // Base64Url 解码
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )

    const decoded = JSON.parse(jsonPayload)
    logger.info('JWT 令牌解析成功:', decoded)
    return decoded
  } catch (error) {
    logger.error('JWT 令牌解析失败:', error)
    return null
  }
}

/**
 * 从 JWT 令牌中获取注册时间戳
 * @param {string} token - JWT 令牌（可选，默认使用当前存储的令牌）
 * @returns {number|null} 注册时间戳或 null
 */
export const getRegisterTimeFromToken = (token = null) => {
  const jwtToken = token || getToken()
  if (!jwtToken) {
    logger.warn('未找到 JWT 令牌')
    return null
  }

  const decoded = decodeJWT(jwtToken)
  if (!decoded) {
    return null
  }

  // 尝试常见的注册时间字段名（优先使用 registered_at - 毫秒时间戳）
  const registerTime = decoded.registered_at  // 后端新增字段：注册时间的毫秒时间戳
    || decoded.registeredAt
    || decoded.iat  // JWT 标准字段：令牌签发时间（秒级）
    || decoded.registerTime 
    || decoded.register_time 
    || decoded.createdAt 
    || decoded.created_at
    || decoded.regTime
    || decoded.reg_time

  if (registerTime) {
    logger.info('从 JWT 中找到注册时间:', registerTime)
    return registerTime
  } else {
    logger.warn('JWT 中未找到注册时间字段')
    logger.debug('JWT Payload 所有字段:', Object.keys(decoded))
    return null
  }
}
