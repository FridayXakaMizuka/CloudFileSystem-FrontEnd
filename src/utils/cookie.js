/**
 * Cookie 管理工具
 * 提供设置、读取、删除 Cookie 的功能
 */

import { createLogger } from './logger'

const logger = createLogger('Cookie')

/**
 * 设置 Cookie
 * @param {string} name - Cookie 名称
 * @param {string} value - Cookie 值
 * @param {number} days - 过期天数（默认7天）
 */
export const setCookie = (name, value, days = 7) => {
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  // localhost 环境下使用 Lax，生产环境建议改为 None;Secure
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`
  logger.debug('Cookie 已设置:', name)
}

/**
 * 从 Cookie 中获取指定名称的值
 * @param {string} name - Cookie 名称
 * @returns {string|null} Cookie 值或 null
 */
export const getCookie = (name) => {
  const cookies = document.cookie.split(';')
  for (let cookie of cookies) {
    const [cookieName, value] = cookie.trim().split('=')
    if (cookieName === name) {
      return value
    }
  }
  return null
}

/**
 * 删除 Cookie
 * @param {string} name - Cookie 名称
 */
export const deleteCookie = (name) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`
  logger.debug('Cookie 已删除:', name)
}

/**
 * 从 Cookie 中获取 sessionId
 * @returns {string|null} sessionId 或 null
 */
export const getSessionIdFromCookie = () => {
  return getCookie('sessionId') || getCookie('JSESSIONID')
}

/**
 * 从 Cookie 中获取 RSA 公钥
 * @returns {string|null} RSA 公钥或 null
 */
export const getRSAPublicKeyFromCookie = () => {
  const publicKey = getCookie('rsaPublicKey')
  if (publicKey) {
    try {
      // 解码 URI 编码的公钥
      return decodeURIComponent(publicKey)
    } catch (error) {
      logger.error('解码 RSA 公钥失败:', error)
      return null
    }
  }
  return null
}

