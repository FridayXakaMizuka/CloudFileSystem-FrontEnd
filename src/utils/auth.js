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
