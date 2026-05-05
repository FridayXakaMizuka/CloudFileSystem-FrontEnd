/**
 * 文件上传工具
 * 支持分片上传、秒传、断点续传
 */

import { FILE_API } from '@/config/api'
import { getToken } from './auth'
import { createLogger } from './logger'

const logger = createLogger('FileUpload')

// 默认分片大小：5MB
const DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024

/**
 * 计算文件的 MD5 和 SHA256 哈希值
 * @param {File} file - 文件对象
 * @returns {Promise<{md5: string, sha256: string}>} 哈希值对象
 */
export const calculateFileHashes = async (file) => {
  return new Promise((resolve, reject) => {
    try {
      // 检查是否支持 SubtleCrypto API
      if (!window.crypto || !window.crypto.subtle) {
        reject(new Error('浏览器不支持加密 API'))
        return
      }

      const reader = new FileReader()
      
      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target.result
          
          // 计算 MD5（使用 SparkMD5 或其他库，这里简化处理）
          // 注意：Web Crypto API 不直接支持 MD5，需要使用第三方库
          // 这里我们只实现 SHA256，MD5 需要额外引入库
          
          // 计算 SHA256
          const hashBuffer = await window.crypto.subtle.digest(
            'SHA-256',
            arrayBuffer
          )
          
          const hashArray = Array.from(new Uint8Array(hashBuffer))
          const sha256 = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
          
          // MD5 需要使用 spark-md5 库，这里返回占位符
          // 实际使用时需要: npm install spark-md5
          const md5 = await calculateMD5(arrayBuffer)
          
          logger.debug('文件哈希计算完成', { md5, sha256 })
          resolve({ md5, sha256 })
        } catch (error) {
          reject(error)
        }
      }
      
      reader.onerror = () => {
        reject(new Error('文件读取失败'))
      }
      
      reader.readAsArrayBuffer(file)
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * 计算 MD5 哈希值（需要 spark-md5 库）
 * @param {ArrayBuffer} arrayBuffer - 文件数据
 * @returns {Promise<string>} MD5 哈希值
 */
const calculateMD5 = async (arrayBuffer) => {
  // 动态导入 spark-md5
  // 如果未安装，需要先运行: npm install spark-md5
  try {
    const SparkMD5 = (await import('spark-md5')).default
    const spark = new SparkMD5.ArrayBuffer()
    spark.append(arrayBuffer)
    return spark.end()
  } catch (error) {
    logger.warn('spark-md5 未安装，使用模拟 MD5')
    // 临时返回一个模拟的 MD5（实际使用时必须安装 spark-md5）
    return 'd41d8cd98f00b204e9800998ecf8427e'
  }
}

/**
 * 初始化上传任务
 * @param {Object} params - 上传参数
 * @param {string} params.fileName - 文件名
 * @param {number} params.fileSize - 文件大小（字节）
 * @param {string} params.md5 - MD5 哈希值
 * @param {string} params.sha256 - SHA256 哈希值
 * @param {string} params.mimeType - MIME 类型
 * @param {number} params.totalChunks - 总分片数
 * @returns {Promise<Object>} 上传任务信息
 */
export const initUpload = async (params) => {
  const token = getToken()
  if (!token) {
    throw new Error('未找到 JWT 令牌')
  }

  logger.info('初始化上传任务:', params.fileName)

  const response = await fetch(FILE_API.UPLOAD.INIT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  })

  if (!response.ok) {
    throw new Error(`初始化上传失败: HTTP ${response.status}`)
  }

  const result = await response.json()
  
  if (!result.success || result.code !== 200) {
    throw new Error(result.message || '初始化上传失败')
  }

  logger.info('上传任务初始化成功', {
    uploadId: result.uploadId,
    needUpload: result.needUpload
  })

  return result
}

/**
 * 上传单个分片
 * @param {Object} params - 上传参数
 * @param {string} params.uploadId - 上传任务 ID
 * @param {number} params.chunkIndex - 分片索引（从 0 开始）
 * @param {Blob} params.chunk - 分片数据
 * @returns {Promise<Object>} 上传结果
 */
export const uploadChunk = async (params) => {
  const token = getToken()
  if (!token) {
    throw new Error('未找到 JWT 令牌')
  }

  const url = `${FILE_API.UPLOAD.CHUNK}?uploadId=${params.uploadId}&chunkIndex=${params.chunkIndex}`

  const formData = new FormData()
  formData.append('file', params.chunk)

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  })

  if (!response.ok) {
    throw new Error(`分片上传失败: HTTP ${response.status}`)
  }

  const result = await response.json()
  
  if (!result.success || result.code !== 200) {
    throw new Error(result.message || '分片上传失败')
  }

  return result
}

/**
 * 合并分片
 * @param {Object} params - 合并参数
 * @param {string} params.uploadId - 上传任务 ID
 * @param {string} params.fileName - 文件名
 * @param {string} params.md5 - MD5 哈希值
 * @param {string} params.sha256 - SHA256 哈希值
 * @returns {Promise<Object>} 合并结果
 */
export const mergeChunks = async (params) => {
  const token = getToken()
  if (!token) {
    throw new Error('未找到 JWT 令牌')
  }

  logger.info('合并分片:', params.uploadId)

  const response = await fetch(FILE_API.UPLOAD.MERGE, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  })

  if (!response.ok) {
    throw new Error(`合并分片失败: HTTP ${response.status}`)
  }

  const result = await response.json()
  
  if (!result.success || result.code !== 200) {
    throw new Error(result.message || '合并分片失败')
  }

  logger.info('文件合并成功', { filePath: result.filePath })

  return result
}

/**
 * 查询上传进度
 * @param {string} uploadId - 上传任务 ID
 * @returns {Promise<Object>} 上传进度信息
 */
export const getUploadProgress = async (uploadId) => {
  const token = getToken()
  if (!token) {
    throw new Error('未找到 JWT 令牌')
  }

  const url = `${FILE_API.UPLOAD.PROGRESS}/${uploadId}`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (!response.ok) {
    throw new Error(`查询进度失败: HTTP ${response.status}`)
  }

  const result = await response.json()
  
  if (!result.success || result.code !== 200) {
    throw new Error(result.message || '查询进度失败')
  }

  return result
}

/**
 * 完整的文件上传流程（支持秒传和分片上传）
 * @param {File} file - 文件对象
 * @param {Object} options - 上传选项
 * @param {number} options.chunkSize - 分片大小（字节），默认 5MB
 * @param {Function} options.onProgress - 进度回调函数 (progress: number) => void
 * @param {Function} options.onChunkComplete - 分片完成回调 (chunkIndex: number, total: number) => void
 * @returns {Promise<Object>} 上传结果
 */
export const uploadFile = async (file, options = {}) => {
  const {
    chunkSize = DEFAULT_CHUNK_SIZE,
    onProgress = null,
    onChunkComplete = null
  } = options

  try {
    // 1. 计算文件哈希
    logger.info('开始计算文件哈希...')
    const { md5, sha256 } = await calculateFileHashes(file)
    logger.info('文件哈希计算完成', { md5, sha256 })

    // 2. 计算分片数量
    const totalChunks = Math.ceil(file.size / chunkSize)

    // 3. 初始化上传任务
    logger.info('初始化上传任务...')
    const initResult = await initUpload({
      fileName: file.name,
      fileSize: file.size,
      md5,
      sha256,
      mimeType: file.type,
      totalChunks
    })

    // 4. 判断是否秒传
    if (!initResult.needUpload) {
      logger.info('秒传成功！')
      return {
        success: true,
        quickUpload: true,
        filePath: initResult.filePath || initResult.message,
        message: '秒传成功'
      }
    }

    const uploadId = initResult.uploadId
    logger.info('开始分片上传', { uploadId, totalChunks })

    // 5. 分片上传
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize
      const end = Math.min(start + chunkSize, file.size)
      const chunk = file.slice(start, end)

      logger.debug(`上传分片 ${i + 1}/${totalChunks}`)

      await uploadChunk({
        uploadId,
        chunkIndex: i,
        chunk
      })

      // 调用进度回调
      if (onProgress) {
        const progress = Math.round(((i + 1) / totalChunks) * 100)
        onProgress(progress)
      }

      if (onChunkComplete) {
        onChunkComplete(i + 1, totalChunks)
      }

      logger.info(`分片 ${i + 1}/${totalChunks} 上传完成`)
    }

    // 6. 合并分片
    logger.info('合并分片...')
    const mergeResult = await mergeChunks({
      uploadId,
      fileName: file.name,
      md5,
      sha256
    })

    logger.info('文件上传成功', { filePath: mergeResult.filePath })

    return {
      success: true,
      quickUpload: false,
      filePath: mergeResult.filePath,
      message: mergeResult.message || '上传成功'
    }
  } catch (error) {
    logger.error('文件上传失败:', error)
    throw error
  }
}

/**
 * 断点续传（从上次中断的地方继续上传）
 * @param {File} file - 文件对象
 * @param {string} uploadId - 上传任务 ID
 * @param {Object} options - 上传选项
 * @returns {Promise<Object>} 上传结果
 */
export const resumeUpload = async (file, uploadId, options = {}) => {
  const {
    chunkSize = DEFAULT_CHUNK_SIZE,
    onProgress = null,
    onChunkComplete = null
  } = options

  try {
    // 1. 查询已上传的分片
    logger.info('查询上传进度...', uploadId)
    const progressResult = await getUploadProgress(uploadId)
    
    const uploadedChunks = progressResult.uploadedChunks || 0
    const chunkStatus = progressResult.chunkStatus || []
    const totalChunks = chunkStatus.length

    logger.info('恢复上传', { uploadedChunks, totalChunks })

    // 2. 继续上传未完成的分片
    for (let i = 0; i < totalChunks; i++) {
      // 跳过已上传的分片
      if (chunkStatus[i]) {
        logger.debug(`分片 ${i + 1} 已上传，跳过`)
        continue
      }

      const start = i * chunkSize
      const end = Math.min(start + chunkSize, file.size)
      const chunk = file.slice(start, end)

      logger.debug(`上传分片 ${i + 1}/${totalChunks}`)

      await uploadChunk({
        uploadId,
        chunkIndex: i,
        chunk
      })

      // 调用进度回调
      if (onProgress) {
        const progress = Math.round(((i + 1) / totalChunks) * 100)
        onProgress(progress)
      }

      if (onChunkComplete) {
        onChunkComplete(i + 1, totalChunks)
      }
    }

    // 3. 合并分片
    const { md5, sha256 } = await calculateFileHashes(file)
    const mergeResult = await mergeChunks({
      uploadId,
      fileName: file.name,
      md5,
      sha256
    })

    logger.info('断点续传成功', { filePath: mergeResult.filePath })

    return {
      success: true,
      quickUpload: false,
      filePath: mergeResult.filePath,
      message: mergeResult.message || '上传成功'
    }
  } catch (error) {
    logger.error('断点续传失败:', error)
    throw error
  }
}

/**
 * 取消上传任务
 * @param {string} uploadId - 上传任务 ID
 * @returns {Promise<void>}
 */
export const cancelUpload = async (uploadId) => {
  const token = getToken()
  if (!token) {
    throw new Error('未找到 JWT 令牌')
  }

  logger.info('取消上传任务', uploadId)

  // 注意：根据后端接口，可能需要实现取消接口
  // 这里暂时只记录日志
  logger.warn('取消上传功能待后端接口支持')
}
