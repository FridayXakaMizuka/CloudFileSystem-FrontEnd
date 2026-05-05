/**
 * HTTP 请求工具
 * 统一处理 fetch 请求，自动添加 credentials 和常用配置
 */

import { createLogger } from './logger'

const logger = createLogger('HttpClient')

/**
 * 默认的请求配置
 */
const DEFAULT_OPTIONS = {
  credentials: 'include', // 自动发送和接收 Cookie
  headers: {
    'Content-Type': 'application/json'
  }
}

/**
 * 发起 GET 请求
 * @param {string} url - 请求 URL
 * @param {Object} options - 额外配置
 * @returns {Promise<Response>} fetch 响应对象
 */
export const httpGet = async (url, options = {}) => {
  try {
    logger.debug('GET:', url)
    
    const response = await fetch(url, {
      method: 'GET',
      ...DEFAULT_OPTIONS,
      ...options,
      headers: {
        ...DEFAULT_OPTIONS.headers,
        ...options.headers
      }
    })
    
    return response
  } catch (error) {
    logger.error('GET 请求失败:', url, error)
    throw error
  }
}

/**
 * 发起 POST 请求
 * @param {string} url - 请求 URL
 * @param {Object} data - 请求体数据（会自动 JSON.stringify）
 * @param {Object} options - 额外配置
 * @returns {Promise<Response>} fetch 响应对象
 */
export const httpPost = async (url, data = {}, options = {}) => {
  try {
    logger.debug('POST:', url)
    
    const response = await fetch(url, {
      method: 'POST',
      ...DEFAULT_OPTIONS,
      ...options,
      headers: {
        ...DEFAULT_OPTIONS.headers,
        ...options.headers
      },
      body: JSON.stringify(data)
    })
    
    return response
  } catch (error) {
    logger.error('POST 请求失败:', url, error)
    throw error
  }
}

/**
 * 发起 PUT 请求
 * @param {string} url - 请求 URL
 * @param {Object} data - 请求体数据（会自动 JSON.stringify）
 * @param {Object} options - 额外配置
 * @returns {Promise<Response>} fetch 响应对象
 */
export const httpPut = async (url, data = {}, options = {}) => {
  try {
    logger.debug('PUT:', url)
    
    const response = await fetch(url, {
      method: 'PUT',
      ...DEFAULT_OPTIONS,
      ...options,
      headers: {
        ...DEFAULT_OPTIONS.headers,
        ...options.headers
      },
      body: JSON.stringify(data)
    })
    
    return response
  } catch (error) {
    logger.error('PUT 请求失败:', url, error)
    throw error
  }
}

/**
 * 发起 DELETE 请求
 * @param {string} url - 请求 URL
 * @param {Object} options - 额外配置
 * @returns {Promise<Response>} fetch 响应对象
 */
export const httpDelete = async (url, options = {}) => {
  try {
    logger.debug('DELETE:', url)
    
    const response = await fetch(url, {
      method: 'DELETE',
      ...DEFAULT_OPTIONS,
      ...options,
      headers: {
        ...DEFAULT_OPTIONS.headers,
        ...options.headers
      }
    })
    
    return response
  } catch (error) {
    logger.error('DELETE 请求失败:', url, error)
    throw error
  }
}

/**
 * 解析响应为 JSON
 * @param {Response} response - fetch 响应对象
 * @returns {Promise<Object>} 解析后的 JSON 数据
 */
export const parseJson = async (response) => {
  try {
    return await response.json()
  } catch (error) {
    logger.error('JSON 解析失败:', error)
    throw error
  }
}

/**
 * 检查响应是否成功
 * @param {Response} response - fetch 响应对象
 * @param {Object} result - 解析后的 JSON 数据
 * @returns {boolean} 是否成功
 */
export const checkSuccess = (response, result) => {
  return response.ok && result.success === true && result.code === 200
}

/**
 * 默认导出
 */
export default {
  get: httpGet,
  post: httpPost,
  put: httpPut,
  delete: httpDelete,
  parseJson,
  checkSuccess
}
