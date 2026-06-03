/**
 * 目录浏览工具函数
 * 提供浏览目录、游标分页、排序等功能
 */

import { BASE_API_URL } from '@/config/api'
import { createLogger } from './logger'
import { getToken } from './auth'
import { FILE_API } from '@/config/api'
import { reactive } from 'vue'

const logger = createLogger('DirectoryAPI')

// ==================== 状态管理 ====================

/**
 * 获取当前目录节点ID
 * 从 sessionStorage 读取，如果不存在则返回 null
 */
export function getCurrentNodeId() {
  const nodeId = sessionStorage.getItem('currentNodeId')
  return nodeId ? parseInt(nodeId) : null
}

/**
 * 设置当前目录节点ID
 * @param {number} nodeId - 目录节点ID
 */
export function setCurrentNodeId(nodeId) {
  if (nodeId) {
    sessionStorage.setItem('currentNodeId', nodeId.toString())
    logger.info('设置当前目录节点ID:', nodeId)
  } else {
    sessionStorage.removeItem('currentNodeId')
    logger.info('清除当前目录节点ID')
  }
}

/**
 * 清除当前目录节点ID（刷新页面时调用）
 */
export function clearCurrentNodeId() {
  sessionStorage.removeItem('currentNodeId')
  logger.info('已清除当前目录节点ID')
}

// ==================== 浏览状态管理 ====================

/**
 * 浏览状态管理器
 * 维护当前目录的浏览状态，包括分页、排序等信息
 */
class BrowseStateManager {
  constructor() {
    // 使用 reactive 确保响应式
    this.state = reactive({
      // 排除项列表（新建文件/文件夹时添加，刷新清空）
      excludeNewFileIds: [],
      excludeNewFolderIds: [],
      
      // 排序状态
      sortedBy: 0,  // 0=name, 1=size, 2=createdAt, 3=updatedAt
      order: 0,     // 0=asc, 1=desc
      
      // 游标分页状态
      lastChildrenNode: null,
      lastChildrenType: null,
      isEnd: false,
      
      // 文件列表
      files: [],
      
      // 加载状态
      isLoading: false,
      hasMore: true
    })
    
    logger.info('浏览状态管理器已初始化')
  }

  /**
   * 重置所有状态为默认值
   */
  reset() {
    this.state.excludeNewFileIds = []
    this.state.excludeNewFolderIds = []
    this.state.sortedBy = 0
    this.state.order = 0
    this.state.lastChildrenNode = null
    this.state.lastChildrenType = null
    this.state.isEnd = false
    this.state.files = []
    this.state.isLoading = false
    this.state.hasMore = true
    
    logger.info('浏览状态已重置')
  }

  /**
   * 更新排序
   * @param {number} newSortedBy - 新的排序字段
   */
  updateSort(newSortedBy) {
    // 清空排除项
    this.state.excludeNewFileIds = []
    this.state.excludeNewFolderIds = []
    
    // 判断是否切换排序字段
    if (this.state.sortedBy === newSortedBy) {
      // 相同字段，反转排序顺序
      this.state.order = this.state.order === 0 ? 1 : 0
    } else {
      // 不同字段，使用默认排序（升序）
      this.state.sortedBy = newSortedBy
      this.state.order = 0
    }
    
    // 重置游标和列表
    this.state.lastChildrenNode = null
    this.state.lastChildrenType = null
    this.state.isEnd = false
    this.state.files = []
    this.state.hasMore = true
    
    logger.info('排序更新:', { sortedBy: this.state.sortedBy, order: this.state.order })
  }

  /**
   * 添加新文件ID到排除列表
   * TODO: 在“上传文件”功能实现时调用此方法
   * @param {number} fileId - 文件ID
   */
  addExcludeFileId(fileId) {
    if (!this.state.excludeNewFileIds.includes(fileId)) {
      this.state.excludeNewFileIds.push(fileId)
      logger.info('添加排除文件ID:', fileId)
    }
  }

  /**
   * 添加新文件夹ID到排除列表
   * TODO: 在“新建文件夹”功能实现时调用此方法
   * @param {number} folderId - 文件夹ID
   */
  addExcludeFolderId(folderId) {
    if (!this.state.excludeNewFolderIds.includes(folderId)) {
      this.state.excludeNewFolderIds.push(folderId)
      logger.info('添加排除文件夹ID:', folderId)
    }
  }

  /**
   * 更新游标信息
   * @param {number|null} lastNode - 最后一个节点ID
   * @param {string|null} lastType - 最后一个节点类型
   * @param {boolean} isEnd - 是否到达末尾
   */
  updateCursor(lastNode, lastType, isEnd) {
    this.state.lastChildrenNode = lastNode
    this.state.lastChildrenType = lastType
    this.state.isEnd = isEnd
    this.state.hasMore = !isEnd
    
    logger.info('游标更新:', { lastNode, lastType, isEnd })
  }

  /**
   * 追加文件列表
   * @param {Array} newFiles - 新文件列表
   */
  appendFiles(newFiles) {
    this.state.files = [...this.state.files, ...newFiles]
    logger.info('文件列表追加:', { count: newFiles.length, total: this.state.files.length })
  }

  /**
   * 替换文件列表（首次加载或刷新时）
   * @param {Array} newFiles - 新文件列表
   */
  setFiles(newFiles) {
    this.state.files = newFiles
    logger.info('文件列表替换:', { count: newFiles.length })
  }

  /**
   * 获取当前状态快照（用于API请求）
   */
  getState() {
    return {
      excludeNewFileIds: [...this.state.excludeNewFileIds],
      excludeNewFolderIds: [...this.state.excludeNewFolderIds],
      sortedBy: this.state.sortedBy,
      order: this.state.order,
      lastChildrenNode: this.state.lastChildrenNode,
      lastChildrenType: this.state.lastChildrenType,
      isEnd: this.state.isEnd,
      files: [...this.state.files],
      isLoading: this.state.isLoading,
      hasMore: this.state.hasMore
    }
  }
  
  // 为了保持向后兼容，提供直接访问属性的getter
  get excludeNewFileIds() { return this.state.excludeNewFileIds }
  get excludeNewFolderIds() { return this.state.excludeNewFolderIds }
  get sortedBy() { return this.state.sortedBy }
  get order() { return this.state.order }
  get lastChildrenNode() { return this.state.lastChildrenNode }
  get lastChildrenType() { return this.state.lastChildrenType }
  get isEnd() { return this.state.isEnd }
  get files() { return this.state.files }
  get isLoading() { return this.state.isLoading }
  get hasMore() { return this.state.hasMore }
  
  // 提供直接设置属性的setter（用于isLoading等）
  set isLoading(value) { this.state.isLoading = value }
  set hasMore(value) { this.state.hasMore = value }
}

// 创建全局浏览状态管理器实例
export const browseState = new BrowseStateManager()

// ==================== API 调用 ====================

/**
 * 计算每页最大显示数量
 * @param {string} viewMode - 视图模式：'grid' 或 'list'
 * @param {number} itemsPerRow - 每行显示的项目数（仅网格视图需要）
 * @param {number} emptySlots - 最后一行的空缺数（仅网格视图需要）
 * @returns {number} maxPageSize
 */
export function calculateMaxPageSize(viewMode, itemsPerRow = 0, emptySlots = 0) {
  if (viewMode === 'list') {
    // 列表视图：固定为10
    return 10
  } else {
    // 网格视图：每行显示数 * 3 + 最后一行空缺数
    return itemsPerRow * 3 + emptySlots
  }
}

/**
 * 浏览目录
 * @param {Object} params - 请求参数
 * @param {number} params.currentNodeId - 当前目录节点ID
 * @param {number} params.maxPageSize - 每页最大数量
 * @param {number|null} params.lastChildrenNode - 游标锚点ID
 * @param {string|null} params.lastChildrenType - 游标锚点类型
 * @param {number} params.sortedBy - 排序字段
 * @param {number} params.order - 排序顺序
 * @param {Array} params.excludeNewFileIds - 排除的文件ID列表
 * @param {Array} params.excludeNewFolderIds - 排除的文件夹ID列表
 * @returns {Promise<Object>} 响应数据
 */
export async function browseDirectory(params) {
  const {
    currentNodeId,
    maxPageSize = 50,
    lastChildrenNode = null,
    lastChildrenType = null,
    sortedBy = 0,
    order = 0,
    excludeNewFileIds = [],
    excludeNewFolderIds = []
  } = params

  // 构建查询参数
  const queryParams = new URLSearchParams({
    currentNodeId: currentNodeId.toString(),
    maxPageSize: maxPageSize.toString(),
    sortedBy: sortedBy.toString(),
    order: order.toString()
  })

  // 添加可选参数
  if (lastChildrenNode !== null && lastChildrenNode !== undefined) {
    queryParams.append('lastChildrenNode', lastChildrenNode.toString())
  }
  
  if (lastChildrenType) {
    queryParams.append('lastChildrenType', lastChildrenType)
  }

  if (excludeNewFileIds.length > 0) {
    excludeNewFileIds.forEach(id => {
      queryParams.append('excludeNewFileIds', id.toString())
    })
  }

  if (excludeNewFolderIds.length > 0) {
    excludeNewFolderIds.forEach(id => {
      queryParams.append('excludeNewFolderIds', id.toString())
    })
  }

  const url = `${BASE_API_URL}/files/browse?${queryParams.toString()}`
  
  logger.info('请求浏览目录:', {
    url,
    params: {
      currentNodeId,
      maxPageSize,
      sortedBy,
      order,
      lastChildrenNode,
      lastChildrenType,
      excludeNewFileIds,
      excludeNewFolderIds
    }
  })

  try {
    const token = getToken()
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    
    logger.info('浏览目录响应:', result)

    if (result.code === 200 && result.success) {
      return {
        success: true,
        data: result.data,
        message: result.message
      }
    } else {
      throw new Error(result.message || '获取目录失败')
    }
  } catch (error) {
    logger.error('浏览目录失败:', error)
    return {
      success: false,
      error: error.message,
      message: error.message
    }
  }
}

/**
 * 加载更多文件（基于当前状态）
 * @param {number} maxPageSize - 每页最大数量
 * @returns {Promise<Object>} 响应数据
 */
export async function loadMoreFiles(maxPageSize = 50) {
  const state = browseState.getState()
  
  // 检查是否可以加载更多
  if (state.isLoading) {
    logger.info('跳过重复加载请求: 正在加载中', { isLoading: state.isLoading })
    return {
      success: false,
      message: '正在加载中...'
    }
  }
  
  if (!state.hasMore) {
    logger.info('没有更多数据可加载', { isEnd: state.isEnd, hasMore: state.hasMore })
    return {
      success: false,
      message: '没有更多数据'
    }
  }

  // 检查是否有当前节点ID
  const currentNodeId = getCurrentNodeId()
  if (!currentNodeId) {
    logger.error('当前节点ID为空')
    return {
      success: false,
      message: '当前节点ID为空'
    }
  }

  // 设置加载状态
  browseState.isLoading = true

  try {
    const result = await browseDirectory({
      currentNodeId,
      maxPageSize,
      lastChildrenNode: state.lastChildrenNode,
      lastChildrenType: state.lastChildrenType,
      sortedBy: state.sortedBy,
      order: state.order,
      excludeNewFileIds: state.excludeNewFileIds,
      excludeNewFolderIds: state.excludeNewFolderIds
    })

    if (result.success) {
      // 更新游标状态
      const pagination = result.data.pagination
      browseState.updateCursor(
        pagination.lastChildrenNode,
        pagination.lastChildrenType,
        pagination.isEnd
      )
      
      // 追加文件列表
      browseState.appendFiles(result.data.children)
      
      return {
        success: true,
        data: result.data,
        message: '加载成功'
      }
    } else {
      return {
        success: false,
        message: result.message
      }
    }
  } catch (error) {
    logger.error('加载更多失败:', error)
    return {
      success: false,
      error: error.message,
      message: '网络错误，请稍后重试'
    }
  } finally {
    // 清除加载状态
    browseState.isLoading = false
  }
}

/**
 * 初始化浏览（首次加载或刷新时）
 * @param {number} maxPageSize - 每页最大数量
 * @returns {Promise<Object>} 响应数据
 */
export async function initBrowse(maxPageSize = 50) {
  // 重置状态
  browseState.reset()
  
  // 检查是否有当前节点ID
  const currentNodeId = getCurrentNodeId()
  if (!currentNodeId) {
    logger.error('当前节点ID为空')
    return {
      success: false,
      message: '当前节点ID为空，请先获取用户信息'
    }
  }

  // 设置加载状态
  browseState.isLoading = true

  try {
    const result = await browseDirectory({
      currentNodeId,
      maxPageSize,
      sortedBy: browseState.sortedBy,
      order: browseState.order,
      excludeNewFileIds: browseState.excludeNewFileIds,
      excludeNewFolderIds: browseState.excludeNewFolderIds
    })

    if (result.success) {
      // 更新游标状态
      const pagination = result.data.pagination
      browseState.updateCursor(
        pagination.lastChildrenNode,
        pagination.lastChildrenType,
        pagination.isEnd
      )
      
      // 设置文件列表
      browseState.setFiles(result.data.children)
      
      return {
        success: true,
        data: result.data,
        message: '加载成功'
      }
    } else {
      return {
        success: false,
        message: result.message
      }
    }
  } catch (error) {
    logger.error('初始化浏览失败:', error)
    return {
      success: false,
      error: error.message,
      message: '网络错误，请稍后重试'
    }
  } finally {
    // 清除加载状态
    browseState.isLoading = false
  }
}

/**
 * 格式化日期时间为可读格式
 * @param {string} isoString - ISO 8601 格式的时间字符串 (例如: "2026-06-03T02:22:40")
 * @returns {string} 格式化后的时间字符串 (例如: "2026-06-03 02:22:40")
 */
export function formatDateTime(isoString) {
  if (!isoString) return '--'
  
  try {
    const date = new Date(isoString)
    
    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      logger.warn('无效的日期格式:', isoString)
      return '--'
    }
    
    // 格式化为 YYYY-MM-DD HH:mm:ss
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  } catch (error) {
    logger.error('日期格式化失败:', error, isoString)
    return '--'
  }
}

/**
 * 智能生成文件夹名称：检查同名并自动添加序号
 * @param {string} baseName - 基础文件夹名称
 * @param {Array} currentFiles - 当前目录下的文件列表
 * @returns {string} 生成的文件夹名称
 */
export function generateSmartFolderName(baseName, currentFiles) {
  // 首先检查是否有同名文件夹
  const hasExactMatch = currentFiles.some(file => 
    file.type === 'folder' && file.name === baseName
  )
  
  // 如果没有同名，直接返回原名称
  if (!hasExactMatch) {
    return baseName
  }
  
  // 有同名，需要查找所有格式为 baseName({num}) 的文件夹
  const pattern = new RegExp(`^${escapeRegExp(baseName)}\\((\\d+)\\)$`)
  const existingNumbers = []
  
  currentFiles.forEach(file => {
    if (file.type === 'folder') {
      const match = file.name.match(pattern)
      if (match) {
        const num = parseInt(match[1], 10)
        if (num >= 2) {
          existingNumbers.push(num)
        }
      }
    }
  })
  
  // 快速排序
  existingNumbers.sort((a, b) => a - b)
  
  logger.info('现有序号列表:', existingNumbers)
  
  // 使用二分法找到第一个空缺的序号
  let firstMissing = findFirstMissingNumber(existingNumbers)
  
  // 如果没找到空缺（说明是连续的），使用最大值+1
  if (firstMissing === null) {
    firstMissing = existingNumbers.length > 0 ? existingNumbers[existingNumbers.length - 1] + 1 : 2
  }
  
  const newName = `${baseName}(${firstMissing})`
  logger.info('生成的新文件夹名称:', newName)
  
  return newName
}

/**
 * 转义正则表达式特殊字符
 * @param {string} str - 需要转义的字符串
 * @returns {string} 转义后的字符串
 */
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * 使用二分法找到第一个空缺的数字
 * @param {number[]} sortedNumbers - 已排序的数字数组（>=2）
 * @returns {number|null} 第一个空缺的数字，如果没有空缺则返回null
 */
function findFirstMissingNumber(sortedNumbers) {
  if (sortedNumbers.length === 0) {
    return 2
  }
  
  // 如果第一个数就大于2，说明2是空缺的
  if (sortedNumbers[0] > 2) {
    return 2
  }
  
  // 使用二分法查找第一个空缺
  let left = 0
  let right = sortedNumbers.length - 1
  
  // 期望的起始值是2
  const expectedStart = 2
  
  while (left < right) {
    const mid = Math.floor((left + right) / 2)
    const expectedValue = expectedStart + mid
    
    if (sortedNumbers[mid] === expectedValue) {
      // 左半部分是连续的，空缺在右半部分
      left = mid + 1
    } else {
      // 左半部分有空缺
      right = mid
    }
  }
  
  // 检查找到的位置是否真的是空缺
  const expectedAtLeft = expectedStart + left
  if (sortedNumbers[left] !== expectedAtLeft) {
    return expectedAtLeft
  }
  
  // 如果没有找到空缺，返回最后一个数+1
  return null
}

/**
 * 创建文件夹
 * @param {number} parentId - 父目录ID
 * @param {string} folderName - 文件夹名称
 * @returns {Promise<Object>} 响应数据
 */
export async function createFolder(parentId, folderName) {
  const url = FILE_API.CREATE_FOLDER
  
  logger.info('请求创建文件夹:', {
    url,
    params: {
      parentId,
      folderName
    }
  })

  try {
    const token = getToken()
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify({
        parentId,
        folderName
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    
    logger.info('创建文件夹响应:', result)

    if (result.code === 200 && result.success) {
      return {
        success: true,
        data: result.data,
        message: result.message
      }
    } else {
      throw new Error(result.message || '创建文件夹失败')
    }
  } catch (error) {
    logger.error('创建文件夹失败:', error)
    return {
      success: false,
      error: error.message,
      message: error.message
    }
  }
}
