/**
 * 用户信息管理工具
 * 统一管理用户个人信息的获取和缓存
 */

import { getToken } from './auth'
import { createLogger } from './logger'
import { PROFILE_API, BASE_API_URL } from '@/config/api'
import { uploadFile } from './fileUpload'

const logger = createLogger('UserInfoManager')

// SessionStorage 键名
const USER_INFO_CACHE_KEY = 'user_info_cache'
const USER_INFO_TIMESTAMP_KEY = 'user_info_cache_timestamp'

// 头像文件大小限制：5MB
const MAX_AVATAR_SIZE = 5 * 1024 * 1024

/**
 * 从后端获取所有个人信息
 * @returns {Promise<Object|null>} 用户信息对象或 null
 */
export const fetchAllUserInfo = async () => {
  try {
    const token = getToken()
    if (!token) {
      logger.warn('未找到 JWT 令牌')
      return null
    }
    
    logger.info('开始获取所有个人信息...')
    
    const response = await fetch(PROFILE_API.GET_ALL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result = await response.json()
    logger.info('获取个人信息响应:', result)
    
    // 检查响应是否成功
    if (result.code === 200 && result.success === true && result.data) {
      const data = result.data
      
      // 构建用户信息对象
      const userInfo = {
        avatar: data.avatar || '',
        nickname: data.nickname || '',
        email: data.email || '',
        phone: data.phone || '',
        storageUsed: data.storage_used !== undefined 
          ? `${(parseFloat(data.storage_used) / (1024 * 1024 * 1024)).toFixed(2)} GB`
          : '0 GB',
        storageTotal: data.storage_quota !== undefined
          ? `${(parseFloat(data.storage_quota) / (1024 * 1024 * 1024)).toFixed(2)} GB`
          : '10 GB',
        storageUsedBytes: data.storage_used || 0,
        storageQuotaBytes: data.storage_quota || 0
      }
      
      // 缓存到 sessionStorage
      cacheUserInfo(userInfo)
      
      logger.info('个人信息获取并缓存成功')
      return userInfo
    } else {
      logger.warn('获取个人信息失败:', result.message)
      return null
    }
  } catch (error) {
    logger.error('获取个人信息失败:', error)
    return null
  }
}

/**
 * 缓存用户信息到 sessionStorage
 * @param {Object} userInfo - 用户信息对象
 */
export const cacheUserInfo = (userInfo) => {
  try {
    sessionStorage.setItem(USER_INFO_CACHE_KEY, JSON.stringify(userInfo))
    sessionStorage.setItem(USER_INFO_TIMESTAMP_KEY, Date.now().toString())
    logger.debug('用户信息已缓存到 sessionStorage')
  } catch (error) {
    logger.error('缓存用户信息失败:', error)
  }
}

/**
 * 从 sessionStorage 获取缓存的用户信息
 * @returns {Object|null} 用户信息对象或 null
 */
export const getCachedUserInfo = () => {
  try {
    const cached = sessionStorage.getItem(USER_INFO_CACHE_KEY)
    const timestamp = sessionStorage.getItem(USER_INFO_TIMESTAMP_KEY)
    
    if (!cached || !timestamp) {
      logger.debug('未找到缓存的用户信息')
      return null
    }
    
    const userInfo = JSON.parse(cached)
    const cacheTime = parseInt(timestamp)
    const age = Date.now() - cacheTime
    
    logger.debug(`缓存的用户信息年龄: ${age}ms`)
    return userInfo
  } catch (error) {
    logger.error('读取缓存用户信息失败:', error)
    return null
  }
}

/**
 * 清除缓存的用户信息
 */
export const clearUserInfoCache = () => {
  try {
    sessionStorage.removeItem(USER_INFO_CACHE_KEY)
    sessionStorage.removeItem(USER_INFO_TIMESTAMP_KEY)
    logger.debug('已清除用户信息缓存')
  } catch (error) {
    logger.error('清除用户信息缓存失败:', error)
  }
}

/**
 * 获取用户信息（优先从缓存，缓存不存在则从后端获取）
 * @param {boolean} forceRefresh - 是否强制刷新
 * @returns {Promise<Object|null>} 用户信息对象或 null
 */
export const getUserInfo = async (forceRefresh = false) => {
  // 如果不强制刷新，先尝试从缓存获取
  if (!forceRefresh) {
    const cached = getCachedUserInfo()
    if (cached) {
      logger.info('使用缓存的用户信息')
      return cached
    }
  }
  
  // 从后端获取
  logger.info('从后端获取用户信息')
  return await fetchAllUserInfo()
}

/**
 * 更新用户信息的某个字段
 * @param {string} field - 字段名
 * @param {*} value - 新值
 */
export const updateUserInfoField = (field, value) => {
  try {
    const cached = getCachedUserInfo()
    if (cached) {
      cached[field] = value
      cacheUserInfo(cached)
      logger.debug(`用户信息字段 ${field} 已更新`)
    }
  } catch (error) {
    logger.error('更新用户信息字段失败:', error)
  }
}

// ==================== 头像相关功能 ====================

/**
 * 将相对路径转换为完整的 URL
 * @param {string} url - 可能是相对路径或完整 URL
 * @returns {string} 完整的 URL
 */
export const getFullAvatarUrl = (url) => {
  if (!url) return ''
  
  // 如果已经是完整 URL，直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  
  // 如果是相对路径，拼接 BASE_API_URL
  return `${BASE_API_URL}${url}`
}

/**
 * 通过 fetch 加载需要认证的头像图片
 * @param {string} imageUrl - 图片 URL
 * @returns {Promise<string>} Blob URL
 */
export const loadAuthenticatedImage = async (imageUrl) => {
  const token = getToken()
  if (!token) {
    throw new Error('未找到 JWT 令牌')
  }

  const response = await fetch(imageUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (!response.ok) {
    throw new Error(`加载头像失败: HTTP ${response.status}`)
  }

  const blob = await response.blob()
  return URL.createObjectURL(blob)
}

/**
 * 从 profile 缓存中获取头像 URL
 * @returns {string|null} 头像 URL 或 null
 */
export const getAvatarFromProfileCache = () => {
  try {
    const cachedUserInfo = getCachedUserInfo()
    if (cachedUserInfo && cachedUserInfo.avatar) {
      logger.debug('从 profile 缓存中获取头像:', cachedUserInfo.avatar)
      return cachedUserInfo.avatar
    }
    logger.debug('profile 缓存中没有头像信息')
    return null
  } catch (error) {
    logger.error('从 profile 缓存获取头像失败:', error)
    return null
  }
}

/**
 * 获取用户头像（直接从 profile 缓存读取）
 * @returns {string|null} 完整的头像 URL 或 null
 */
export const getUserAvatar = () => {
  const avatarPath = getAvatarFromProfileCache()
  if (avatarPath) {
    return getFullAvatarUrl(avatarPath)
  }
  return null
}

/**
 * 验证头像文件
 * @param {File} file - 文件对象
 * @returns {Object} 验证结果 { valid: boolean, message: string }
 */
export const validateAvatarFile = (file) => {
  // 检查文件类型
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      message: '只支持 JPG、PNG、GIF、WebP 格式的图片'
    }
  }

  // 检查文件大小
  if (file.size > MAX_AVATAR_SIZE) {
    return {
      valid: false,
      message: `头像大小不能超过 ${MAX_AVATAR_SIZE / 1024 / 1024}MB`
    }
  }

  return { valid: true, message: '' }
}

/**
 * 设置头像到服务器
 * @param {string} avatarUrl - 头像文件路径
 * @returns {Promise<Object>} 设置结果
 */
export const setAvatarToServer = async (avatarUrl) => {
  const token = getToken()
  if (!token) {
    throw new Error('未找到 JWT 令牌')
  }

  logger.info('正在设置头像...', avatarUrl)

  const url = `${PROFILE_API.SET_AVATAR}?avatar=${encodeURIComponent(avatarUrl)}`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (!response.ok) {
    throw new Error(`设置头像失败: HTTP ${response.status}`)
  }

  const result = await response.json()

  if (!result.success || result.code !== 200) {
    throw new Error(result.message || '设置头像失败')
  }

  logger.info('头像设置成功')
  return result
}

/**
 * 完整的头像上传和设置流程
 * @param {File} file - 头像文件对象
 * @param {Function} onProgress - 进度回调函数 (progress: number) => void
 * @returns {Promise<Object>} 上传结果
 */
export const uploadAndSetAvatar = async (file, onProgress = null) => {
  try {
    // 1. 验证文件
    logger.info('验证头像文件...')
    const validation = validateAvatarFile(file)
    if (!validation.valid) {
      throw new Error(validation.message)
    }

    logger.info('文件验证通过', {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type
    })

    // 2. 上传文件（使用分片上传）
    logger.info('开始上传头像文件...')
    const uploadResult = await uploadFile(file, {
      chunkSize: 2 * 1024 * 1024, // 头像使用较小的分片 2MB
      onProgress: (progress) => {
        if (onProgress) {
          onProgress(progress)
        }
        logger.debug(`头像上传进度: ${progress}%`)
      }
    })

    if (!uploadResult.success) {
      throw new Error('文件上传失败')
    }

    logger.info('头像文件上传成功', { filePath: uploadResult.filePath })

    // 3. 设置头像到数据库
    logger.info('设置头像到数据库...')
    await setAvatarToServer(uploadResult.filePath)

    // 4. 更新 profile 缓存中的头像信息
    logger.info('更新 profile 缓存中的头像信息...')
    updateUserInfoField('avatar', uploadResult.filePath)
    
    logger.info('头像上传和设置完成')
    
    return {
      success: true,
      filePath: uploadResult.filePath,
      quickUpload: uploadResult.quickUpload,
      message: '头像设置成功'
    }
  } catch (error) {
    logger.error('头像上传失败:', error)
    throw error
  }
}

/**
 * 清除头像缓存（已废弃，头像现在存储在 profile 缓存中）
 * @deprecated 请使用 clearUserInfoCache() 代替
 */
export const clearAvatarCache = () => {
  logger.warn('clearAvatarCache 已废弃，头像现在存储在 profile 缓存中')
  // 为了向后兼容，不清除任何内容
}
