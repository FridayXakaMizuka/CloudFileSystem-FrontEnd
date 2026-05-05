/**
 * 邮箱验证码工具
 * 处理邮箱验证码的发送和验证
 */

import { createLogger } from './logger'
import { AUTH_API } from '@/config/api'
import { getSessionId, resetSessionIdExpiry, resetPurposeSessionIdExpiry } from './sessionId'

const logger = createLogger('EmailVerification')

/**
 * 发送邮箱验证码
 * @param {string} email - 邮箱地址
 * @param {string} customSessionId - 可选的自定义 sessionId（如果不传则使用全局 sessionId）
 * @returns {Promise<Object>} 返回结果 { success: boolean, message?: string }
 */
export const sendVerificationCode = async (email, customSessionId = null) => {
  try {
    // 验证邮箱格式
    if (!email || !isValidEmail(email)) {
      return {
        success: false,
        message: '请输入有效的邮箱地址'
      }
    }

    logger.info('开始发送邮箱验证码...', email)

    // 获取 sessionId（优先使用自定义的）
    const sessionId = customSessionId || getSessionId()

    // 构造请求数据
    const requestData = {
      sessionId: sessionId,
      email: email
    }

    // 发送 POST 请求
    const response = await fetch(AUTH_API.SEND_VERIFICATION_CODE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    })

    const result = await response.json()
    logger.info('发送验证码响应:', result)

    // 检查响应：code=200 且 success=true 表示成功
    if (response.ok && result.code === 200 && result.success === true) {
      logger.info('验证码发送成功')
      
      // 如果是自定义 sessionId，重置其有效期
      if (customSessionId) {
        resetPurposeSessionIdExpiry('email')
      } else {
        resetSessionIdExpiry()
      }
      
      return {
        success: true,
        message: result.message || '验证码已发送，请查收邮件'
      }
    } else {
      logger.warn('验证码发送失败:', result.message)
      return {
        success: false,
        message: result.message || '验证码发送失败，请稍后重试'
      }
    }
  } catch (error) {
    logger.error('发送验证码请求失败:', error)
    return {
      success: false,
      message: '网络错误，请稍后重试'
    }
  }
}

/**
 * 验证邮箱格式
 * @param {string} email - 邮箱地址
 * @returns {boolean} 是否为有效邮箱
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 倒计时工具类
 * 用于管理验证码发送按钮的倒计时
 */
export class CountdownTimer {
  constructor(duration = 60) {
    this.duration = duration
    this.remaining = 0
    this.timer = null
    this.onTick = null
    this.onComplete = null
  }

  /**
   * 开始倒计时
   * @param {Function} onTick - 每次计时的回调函数 (remaining: number) => void
   * @param {Function} onComplete - 倒计时结束的回调函数 () => void
   */
  start(onTick = null, onComplete = null) {
    // 先停止之前的定时器，防止多个定时器同时运行
    this.stop()
    
    this.remaining = this.duration
    this.onTick = onTick
    this.onComplete = onComplete

    // 立即执行一次
    if (this.onTick) {
      this.onTick(this.remaining)
    }

    // 启动定时器
    this.timer = setInterval(() => {
      this.remaining--

      if (this.onTick) {
        this.onTick(this.remaining)
      }

      if (this.remaining <= 0) {
        this.stop()
        if (this.onComplete) {
          this.onComplete()
        }
      }
    }, 1000)
  }

  /**
   * 停止倒计时
   */
  stop() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    this.remaining = 0
  }

  /**
   * 是否正在倒计时
   * @returns {boolean}
   */
  isRunning() {
    return this.timer !== null
  }

  /**
   * 获取剩余时间
   * @returns {number}
   */
  getRemaining() {
    return this.remaining
  }

  /**
   * 销毁定时器
   */
  destroy() {
    this.stop()
    this.onTick = null
    this.onComplete = null
  }
}
