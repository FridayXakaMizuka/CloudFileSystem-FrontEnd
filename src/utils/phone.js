/**
 * 手机号验证码工具
 * 处理手机号验证码的发送和验证
 */

import { createLogger } from './logger'
import { AUTH_API } from '@/config/api'
import { getSessionId, resetSessionIdExpiry, resetPurposeSessionIdExpiry } from './sessionId'

const logger = createLogger('PhoneVerification')

/**
 * 发送手机号验证码
 * @param {string} phoneNumber - 手机号
 * @param {string} customSessionId - 可选的自定义 sessionId（如果不传则使用全局 sessionId）
 * @returns {Promise<Object>} 返回结果 { success: boolean, message?: string }
 */
export const sendPhoneVerificationCode = async (phoneNumber, customSessionId = null) => {
  try {
    // 验证手机号格式
    if (!phoneNumber || !isValidPhone(phoneNumber)) {
      return {
        success: false,
        message: '请输入有效的11位手机号'
      }
    }

    logger.info('开始发送手机号验证码...', phoneNumber)

    // 获取 sessionId（优先使用自定义的）
    const sessionId = customSessionId || getSessionId()

    // 构造请求数据
    const requestData = {
      sessionId: sessionId,
      phoneNumber: phoneNumber
    }

    // 发送 POST 请求
    const response = await fetch(AUTH_API.SEND_PHONE_VERIFICATION_CODE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    })

    const result = await response.json()
    logger.info('发送手机验证码响应:', result)

    // 检查响应：code=200 且 success=true 表示成功
    if (response.ok && result.code === 200 && result.success === true) {
      logger.info('手机验证码发送成功')
      
      // 如果是自定义 sessionId，重置其有效期
      if (customSessionId) {
        resetPurposeSessionIdExpiry('phone')
      } else {
        resetSessionIdExpiry()
      }
      
      return {
        success: true,
        message: result.message || '验证码已发送，请注意查收'
      }
    } else {
      logger.warn('手机验证码发送失败:', result.message)
      return {
        success: false,
        message: result.message || '验证码发送失败，请稍后重试'
      }
    }
  } catch (error) {
    logger.error('发送手机验证码请求失败:', error)
    return {
      success: false,
      message: '网络错误，请稍后重试'
    }
  }
}

/**
 * 验证手机号格式
 * @param {string} phone - 手机号
 * @returns {boolean} 是否为有效手机号
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^1[3-9]\d{9}$/
  return phoneRegex.test(phone)
}
