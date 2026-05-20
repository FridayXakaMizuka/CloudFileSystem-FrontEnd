/**
 * 目录浏览工具函数
 * 提供浏览目录、游标分页、排序等功能
 */

import { BASE_API_URL } from '@/config/api'
import { createLogger } from './logger'

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
    this.reset()
  }

  /**
   * 重置所有状态为默认值
   */
  reset() {
    // 排除项列表（新建文件/文件夹时添加，刷新清空）
    this.excludeNewFileIds = []
    this.excludeNewFolderIds = []
    
    // 排序状态
    this.sortedBy = 0  // 0=name, 1=size, 2=createdAt, 3=updatedAt
    this.order = 0     // 0=asc, 1=desc
    
    // 游标分页状态
    this.lastChildrenNode = null
    this.lastChildrenType = null
    this.isEnd = false
    
    // 文件列表
    this.files = []
    
    // 加载状态
    this.isLoading = false
    this.hasMore = true
    
    logger.info('浏览状态已重置')
  }

  /**
   * 更新排序
   * @param {number} newSortedBy - 新的排序字段
   */
  updateSort(newSortedBy) {
    // 清空排除项
    this.excludeNewFileIds = []
    this.excludeNewFolderIds = []
    
    // 判断是否切换排序字段
    if (this.sortedBy === newSortedBy) {
      // 相同字段，反转排序顺序
      this.order = this.order === 0 ? 1 : 0
    } else {
      // 不同字段，使用默认排序（升序）
      this.sortedBy = newSortedBy
      this.order = 0
    }
    
    // 重置游标和列表
    this.lastChildrenNode = null
    this.lastChildrenType = null
    this.isEnd = false
    this.files = []
    this.hasMore = true
    
    logger.info('排序更新:', { sortedBy: this.sortedBy, order: this.order })
  }

  /**
   * 添加新文件ID到排除列表
   * TODO: 在"上传文件"功能实现时调用此方法
   * @param {number} fileId - 文件ID
   */
  addExcludeFileId(fileId) {
    if (!this.excludeNewFileIds.includes(fileId)) {
      this.excludeNewFileIds.push(fileId)
      logger.info('添加排除文件ID:', fileId)
    }
  }

  /**
   * 添加新文件夹ID到排除列表
   * TODO: 在"新建文件夹"功能实现时调用此方法
   * @param {number} folderId - 文件夹ID
   */
  addExcludeFolderId(folderId) {
    if (!this.excludeNewFolderIds.includes(folderId)) {
      this.excludeNewFolderIds.push(folderId)
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
    this.lastChildrenNode = lastNode
    this.lastChildrenType = lastType
    this.isEnd = isEnd
    this.hasMore = !isEnd
    
    logger.info('游标更新:', { lastNode, lastType, isEnd })
  }

  /**
   * 追加文件列表
   * @param {Array} newFiles - 新文件列表
   */
  appendFiles(newFiles) {
    this.files = [...this.files, ...newFiles]
    logger.info('文件列表追加:', { count: newFiles.length, total: this.files.length })
  }

  /**
   * 替换文件列表（首次加载或刷新时）
   * @param {Array} newFiles - 新文件列表
   */
  setFiles(newFiles) {
    this.files = newFiles
    logger.info('文件列表替换:', { count: newFiles.length })
  }

  /**
   * 获取当前状态快照（用于API请求）
   */
  getState() {
    return {
      excludeNewFileIds: [...this.excludeNewFileIds],
      excludeNewFolderIds: [...this.excludeNewFolderIds],
      sortedBy: this.sortedBy,
      order: this.order,
      lastChildrenNode: this.lastChildrenNode,
      lastChildrenType: this.lastChildrenType,
      isEnd: this.isEnd,
      files: [...this.files],
      isLoading: this.isLoading,
      hasMore: this.hasMore
    }
  }
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
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
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
  if (state.isLoading || !state.hasMore) {
    logger.warn('无法加载更多:', { isLoading: state.isLoading, hasMore: state.hasMore })
    return {
      success: false,
      message: state.isLoading ? '正在加载中...' : '没有更多数据'
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
