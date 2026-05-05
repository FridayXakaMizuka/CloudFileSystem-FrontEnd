/**
 * 消息提示工具
 * 提供非阻塞的响应式消息提示功能
 */

import { createLogger } from './logger'

const logger = createLogger('MessageToast')

// 消息队列
const messageQueue = []
let isShowing = false

/**
 * 显示消息提示
 * @param {string} message - 消息内容
 * @param {string} type - 消息类型: 'success' | 'error' | 'info' | 'warning'
 * @param {number} duration - 显示时长（毫秒），默认 3000
 */
export const showToast = (message, type = 'info', duration = 3000) => {
  const toast = {
    id: Date.now() + Math.random(),
    message,
    type,
    duration,
    timestamp: Date.now()
  }

  logger.debug(`显示${type}消息:`, message)

  // 添加到消息队列
  messageQueue.push(toast)

  // 如果当前没有显示的消息，立即显示
  if (!isShowing) {
    showNextToast()
  }

  return toast.id
}

/**
 * 显示下一条消息
 */
const showNextToast = () => {
  if (messageQueue.length === 0) {
    isShowing = false
    return
  }

  isShowing = true
  const toast = messageQueue.shift()

  // 创建 DOM 元素
  const toastElement = createToastElement(toast)
  document.body.appendChild(toastElement)

  // 触发动画
  setTimeout(() => {
    toastElement.classList.add('show')
  }, 10)

  // 设置自动关闭
  setTimeout(() => {
    hideToast(toastElement)
  }, toast.duration)
}

/**
 * 创建消息提示 DOM 元素
 */
const createToastElement = (toast) => {
  const element = document.createElement('div')
  element.className = `app-toast ${toast.type}`
  element.dataset.toastId = toast.id

  // Emoji 图标映射
  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️'
  }

  element.innerHTML = `
    <div class="toast-icon">${icons[toast.type] || icons.info}</div>
    <div class="toast-message">${escapeHtml(toast.message)}</div>
    <button class="toast-close" aria-label="关闭">×</button>
  `

  // 关闭按钮点击事件
  const closeBtn = element.querySelector('.toast-close')
  closeBtn.addEventListener('click', () => {
    hideToast(element)
  })

  // 鼠标悬停时暂停自动关闭
  let autoCloseTimer = null
  element.addEventListener('mouseenter', () => {
    // 清除原有的自动关闭定时器
    clearTimeout(autoCloseTimer)
  })

  element.addEventListener('mouseleave', () => {
    // 重新设置自动关闭
    autoCloseTimer = setTimeout(() => {
      hideToast(element)
    }, 1000)
  })

  return element
}

/**
 * 隐藏消息提示
 */
const hideToast = (element) => {
  if (!element || !document.body.contains(element)) {
    return
  }

  element.classList.remove('show')
  element.classList.add('hide')

  // 等待动画完成后移除 DOM
  setTimeout(() => {
    if (document.body.contains(element)) {
      document.body.removeChild(element)
    }
    // 显示下一条消息
    showNextToast()
  }, 300)
}

/**
 * HTML 转义，防止 XSS
 */
const escapeHtml = (text) => {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/**
 * 快捷方法：成功消息
 */
export const showSuccess = (message, duration = 3000) => {
  return showToast(message, 'success', duration)
}

/**
 * 快捷方法：错误消息
 */
export const showError = (message, duration = 3000) => {
  return showToast(message, 'error', duration)
}

/**
 * 快捷方法：信息消息
 */
export const showInfo = (message, duration = 3000) => {
  return showToast(message, 'info', duration)
}

/**
 * 快捷方法：警告消息
 */
export const showWarning = (message, duration = 3000) => {
  return showToast(message, 'warning', duration)
}

/**
 * 清除所有消息
 */
export const clearAllToasts = () => {
  messageQueue.length = 0
  const toasts = document.querySelectorAll('.app-toast')
  toasts.forEach(toast => {
    if (document.body.contains(toast)) {
      document.body.removeChild(toast)
    }
  })
  isShowing = false
}
