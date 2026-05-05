/**
 * 头像管理工具
 * 处理头像的获取、缓存、上传和显示
 */

import { PROFILE_API, BASE_API_URL } from '@/config/api'
import { getToken } from './auth'
import { createLogger } from './logger'
import { uploadFile } from './fileUpload'

const logger = createLogger('Avatar')

const AVATAR_CACHE_KEY = 'user_avatar_cache'
const AVATAR_TIMESTAMP_KEY = 'user_avatar_timestamp'
// 头像缓存有效期：24小时（毫秒）
const AVATAR_CACHE_EXPIRY = 24 * 60 * 60 * 1000
// 头像文件大小限制：5MB
const MAX_AVATAR_SIZE = 5 * 1024 * 1024

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
 * 从后端获取用户头像
 * @returns {Promise<string|null>} 头像 URL 或 null
 */
export const fetchAvatarFromServer = async () => {
  try {
    const token = getToken()
    if (!token) {
      logger.warn('未找到 JWT 令牌')
      return null
    }

    const response = await fetch(PROFILE_API.GET_AVATAR, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      logger.error('获取头像失败:', response.status)
      return null
    }

    const result = await response.json()

    // 直接使用 avatar 字段
    if (result.success && result.code === 200 && result.avatar) {
      // 缓存头像 URL
      localStorage.setItem(AVATAR_CACHE_KEY, result.avatar)
      localStorage.setItem(AVATAR_TIMESTAMP_KEY, Date.now().toString())
      
      return result.avatar
    } else {
      logger.warn('获取头像失败:', result.message)
      return null
    }
  } catch (error) {
    logger.error('获取头像异常:', error)
    return null
  }
}

/**
 * 从本地缓存获取头像
 * @returns {string|null} 头像 URL 或 null
 */
export const getAvatarFromCache = () => {
  const cachedAvatar = localStorage.getItem(AVATAR_CACHE_KEY)
  const timestamp = localStorage.getItem(AVATAR_TIMESTAMP_KEY)
  
  if (!cachedAvatar || !timestamp) {
    return null
  }
  
  // 检查缓存是否过期
  const now = Date.now()
  const cacheTime = parseInt(timestamp, 10)
  
  if (now - cacheTime > AVATAR_CACHE_EXPIRY) {
    logger.info('头像缓存已过期')
    clearAvatarCache()
    return null
  }
  
  // 检查是否是旧的 Base64 格式缓存，如果是则清除
  if (cachedAvatar.startsWith('data:image') || cachedAvatar.length > 1000) {
    logger.warn('检测到旧的 Base64 格式缓存，已清除')
    clearAvatarCache()
    return null
  }
  
  logger.debug('使用缓存的头像 URL:', cachedAvatar)
  return cachedAvatar
}

/**
 * 清除头像缓存
 */
export const clearAvatarCache = () => {
  localStorage.removeItem(AVATAR_CACHE_KEY)
  localStorage.removeItem(AVATAR_TIMESTAMP_KEY)
  logger.debug('头像缓存已清除')
}

/**
 * 获取用户头像（优先从缓存获取，缓存不存在则从服务器获取）
 * @returns {Promise<string|null>} 头像 URL 或 null
 */
export const getUserAvatar = async () => {
  // 1. 尝试从缓存获取
  const cachedAvatar = getAvatarFromCache()
  if (cachedAvatar) {
    return getFullAvatarUrl(cachedAvatar)
  }
  
  // 2. 缓存不存在，从服务器获取
  const avatar = await fetchAvatarFromServer()
  if (avatar) {
    return getFullAvatarUrl(avatar)
  }
  
  return null
}

/**
 * 将 Base64 数据转换为 Data URL
 * @param {string} base64Data - Base64 编码的图片数据
 * @returns {string} Data URL 格式的图片地址
 */
export const base64ToDataUrl = (base64Data) => {
  if (!base64Data) return ''
  
  // 如果已经是 Data URL 格式，直接返回
  if (base64Data.startsWith('data:image')) {
    return base64Data
  }
  
  // 否则添加 PNG 图片前缀
  return `data:image/png;base64,${base64Data}`
}

/**
 * 更新头像缓存（用户上传新头像后调用）
 * @param {string} avatarData - Base64 编码的新头像数据
 */
export const updateAvatarCache = (avatarData) => {
  if (avatarData) {
    localStorage.setItem(AVATAR_CACHE_KEY, avatarData)
    localStorage.setItem(AVATAR_TIMESTAMP_KEY, Date.now().toString())
    logger.info('头像缓存已更新')
  }
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

    // 4. 更新本地缓存（缓存头像 URL）
    logger.info('更新本地头像缓存...')
    updateAvatarCache(uploadResult.filePath)
    
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
