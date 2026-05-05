/**
 * 统一日志工具
 * 提供带时间戳的标准化日志输出格式
 */

// 日志级别
const LOG_LEVELS = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR'
}

// 日志级别对应的颜色（浏览器控制台支持）
const LOG_COLORS = {
  DEBUG: '#999999',
  INFO: '#4CAF50',
  WARN: '#FF9800',
  ERROR: '#F44336'
}

/**
 * 格式化时间戳
 * @returns {string} 格式化的时间字符串 [YYYY-MM-DD HH:mm:ss.SSS]
 */
const formatTimestamp = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0')
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`
}

/**
 * 格式化日志消息
 * @param {string} level - 日志级别
 * @param {string} module - 模块名称
 * @param {string} message - 日志消息
 * @returns {string} 格式化后的日志前缀
 */
const formatLogPrefix = (level, module) => {
  const timestamp = formatTimestamp()
  return `[${timestamp}] [${level}] [${module}]`
}

/**
 * 通用日志方法
 * @param {string} level - 日志级别
 * @param {string} module - 模块名称
 * @param {string|Object} message - 日志消息或对象
 * @param {...*} args - 额外的参数
 */
const log = (level, module, message, ...args) => {
  const prefix = formatLogPrefix(level, module)
  const color = LOG_COLORS[level]
  
  // 在浏览器环境中使用带颜色的日志
  if (typeof window !== 'undefined' && window.console) {
    switch (level) {
      case LOG_LEVELS.DEBUG:
        console.log(`%c${prefix}`, `color: ${color}`, message, ...args)
        break
      case LOG_LEVELS.INFO:
        console.log(`%c${prefix}`, `color: ${color}`, message, ...args)
        break
      case LOG_LEVELS.WARN:
        console.warn(`%c${prefix}`, `color: ${color}`, message, ...args)
        break
      case LOG_LEVELS.ERROR:
        console.error(`%c${prefix}`, `color: ${color}`, message, ...args)
        break
      default:
        console.log(prefix, message, ...args)
    }
  } else {
    // Node.js 环境
    console.log(`${prefix} ${message}`, ...args)
  }
}

/**
 * Debug 级别日志
 * @param {string} module - 模块名称
 * @param {string|Object} message - 日志消息
 * @param {...*} args - 额外的参数
 */
export const debug = (module, message, ...args) => {
  log(LOG_LEVELS.DEBUG, module, message, ...args)
}

/**
 * Info 级别日志
 * @param {string} module - 模块名称
 * @param {string|Object} message - 日志消息
 * @param {...*} args - 额外的参数
 */
export const info = (module, message, ...args) => {
  log(LOG_LEVELS.INFO, module, message, ...args)
}

/**
 * Warn 级别日志
 * @param {string} module - 模块名称
 * @param {string|Object} message - 日志消息
 * @param {...*} args - 额外的参数
 */
export const warn = (module, message, ...args) => {
  log(LOG_LEVELS.WARN, module, message, ...args)
}

/**
 * Error 级别日志
 * @param {string} module - 模块名称
 * @param {string|Object} message - 日志消息
 * @param {...*} args - 额外的参数
 */
export const error = (module, message, ...args) => {
  log(LOG_LEVELS.ERROR, module, message, ...args)
}

/**
 * 创建模块专用的日志器
 * @param {string} moduleName - 模块名称
 * @returns {Object} 包含 debug, info, warn, error 方法的日志器对象
 */
export const createLogger = (moduleName) => {
  return {
    debug: (message, ...args) => debug(moduleName, message, ...args),
    info: (message, ...args) => info(moduleName, message, ...args),
    warn: (message, ...args) => warn(moduleName, message, ...args),
    error: (message, ...args) => error(moduleName, message, ...args)
  }
}

// 默认导出
export default {
  debug,
  info,
  warn,
  error,
  createLogger
}
