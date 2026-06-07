<template>
  <!-- 文件浏览主容器 -->
  <div class="browse-container">
    <!-- 浏览页面头部：包含标题和工具栏 -->
    <div class="browse-header">
      <!-- 内容容器：包含左侧信息和右侧工具栏 -->
      <div class="header-content-box">
        <!-- 左侧：页面标题、空间使用情况 -->
        <div class="header-left">
          <div class="title-wrapper">
            <h2 class="title">文件浏览</h2>
            <!-- 返回上一级按钮 -->
            <button class="btn-back" @click="handleGoBack" title="返回上一级">
              <span class="back-icon">⬆</span>
              <span class="back-text-full">返回上一级</span>
              <span class="back-text-short"></span>
            </button>
            <!-- 视图切换开关（竖屏时显示在标题右侧） -->
            <div class="view-toggle-switch-mobile" @click="toggleView">
              <div class="switch-track">
                <div class="switch-icons">
                  <span class="icon-grid" :class="{ active: viewMode === 'grid' }">⊞</span>
                  <span class="icon-list" :class="{ active: viewMode === 'list' }">☰</span>
                </div>
                <div class="switch-slider" :class="{ 'slider-right': viewMode === 'list' }"></div>
              </div>
            </div>
          </div>
          <div class="storage-info">
            <div class="storage-bar">
              <div class="storage-used" :style="{ width: storagePercentage + '%' }"></div>
            </div>
            <span class="storage-text">{{ storageUsed }} / {{ storageTotal }}</span>
          </div>
        </div>
        <!-- 右侧：工具栏按钮组 -->
        <div class="toolbar">
          <!-- 视图切换开关 -->
          <div class="view-toggle-switch" @click="toggleView">
            <div class="switch-track">
              <div class="switch-icons">
                <span class="icon-grid" :class="{ active: viewMode === 'grid' }">⊞</span>
                <span class="icon-list" :class="{ active: viewMode === 'list' }">☰</span>
              </div>
              <div class="switch-slider" :class="{ 'slider-right': viewMode === 'list' }"></div>
            </div>
          </div>
          <!-- 操作按钮组 -->
          <div class="action-buttons-wrapper">
            <!-- 上传文件按钮 -->
            <button class="btn btn-upload" @click="handleUpload">
              <span class="icon">⬆️</span>
              上传文件
            </button>
            <!-- 新建文件夹按钮 -->
            <button class="btn btn-new-folder" @click="handleNewFolder">
              <span class="icon">📁</span>
              新建文件夹
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 搜索框区域 -->
    <div class="search-section">
      <div class="search-box">
        <!-- 视图切换开关（竖屏时显示在搜索框左侧） -->
        <div class="view-toggle-switch-search" @click="toggleView">
          <div class="switch-track">
            <div class="switch-icons">
              <span class="icon-grid" :class="{ active: viewMode === 'grid' }">⊞</span>
              <span class="icon-list" :class="{ active: viewMode === 'list' }">☰</span>
            </div>
            <div class="switch-slider" :class="{ 'slider-right': viewMode === 'list' }"></div>
          </div>
        </div>
        <input 
          type="text" 
          v-model="searchKeyword"
          placeholder="搜索文件或文件夹..." 
          class="search-input"
          @keyup.enter="handleSearch"
        />
        <button class="btn btn-search" @click="handleSearch">
          <span class="icon">🔍</span>
          搜索
        </button>
      </div>
    </div>

    <!-- 文件列表区域 -->
    <div class="file-list">
      <!-- 空状态提示：当没有文件且不在创建文件夹时显示 -->
      <div v-if="files.length === 0 && !isCreatingFolder" class="empty-state">
        <div class="empty-icon">📂</div>
        <p>暂无文件</p>
      </div>

      <!-- 网格视图：当选择网格模式时显示（包括正在创建文件夹的情况） -->
      <div v-else-if="viewMode === 'grid'" class="file-grid">
        <!-- 新建文件夹输入框（在第一个位置） -->
        <div v-if="isCreatingFolder" class="file-item creating-folder-item">
          <div class="file-icon">📁</div>
          <div class="file-info">
            <input 
              ref="newFolderInputRef"
              v-model="newFolderName"
              type="text"
              class="folder-name-input"
              @blur="confirmCreateFolder"
              @keyup.enter="confirmCreateFolder"
              @keyup.esc="cancelCreateFolder"
            />
          </div>
        </div>
        
        <!-- 遍历渲染每个文件项 -->
        <div
            v-for="file in files"
            :key="file.id"
            class="file-item"
            @dblclick="handleFileAction(file)"
        ><!-- 双击文件执行操作 -->
          <!-- 文件图标：根据文件类型显示不同图标 -->
          <div class="file-icon">
            {{ getFileIcon(file.type) }}
          </div>
          <!-- 文件信息：名称和元数据 -->
          <div class="file-info">
            <p class="file-name">{{ file.name }}</p>
            <p class="file-meta">{{ file.type === 'folder' ? '--' : formatFileSize(file.size) }} · {{ formatDateTime(file.updatedAt) }}</p>
          </div>
          <!-- 文件操作按钮：下载和删除（悬停时显示） -->
          <div class="file-actions">
            <button class="action-btn" @click.stop="handleDownload(file)" title="下载">
              ⬇️
            </button>
            <button class="action-btn" @click.stop="handleDelete(file)" title="删除">
              🗑️
            </button>
          </div>
        </div>
      </div>

      <!-- 列表视图：当选择列表模式时显示（包括正在创建文件夹的情况） -->
      <div v-else class="table-wrapper">
        <table class="file-table">
          <thead>
            <tr>
              <th class="col-icon"></th>
              <th class="col-name" @click="handleSort(0)" style="cursor: pointer;">
                名称
                <span v-if="sortedBy === 0" class="sort-indicator">{{ order === 0 ? '↑' : '↓' }}</span>
              </th>
              <th class="col-size" @click="handleSort(1)" style="cursor: pointer;">
                大小
                <span v-if="sortedBy === 1" class="sort-indicator">{{ order === 0 ? '↑' : '↓' }}</span>
              </th>
              <th class="col-created" @click="handleSort(2)" style="cursor: pointer;">
                创建时间
                <span v-if="sortedBy === 2" class="sort-indicator">{{ order === 0 ? '↑' : '↓' }}</span>
              </th>
              <th class="col-date" @click="handleSort(3)" style="cursor: pointer;">
                修改时间
                <span v-if="sortedBy === 3" class="sort-indicator">{{ order === 0 ? '↑' : '↓' }}</span>
              </th>
              <th class="col-actions">操作</th>
            </tr>
          </thead>
          <tbody>
            <!-- 新建文件夹输入框（在第一个位置） -->
            <tr v-if="isCreatingFolder" class="file-row creating-folder-row">
              <td class="col-icon">
                <div class="file-icon">📁</div>
              </td>
              <td class="col-name" colspan="5">
                <input 
                  ref="newFolderInputRef"
                  v-model="newFolderName"
                  type="text"
                  class="folder-name-input table-input"
                  @blur="confirmCreateFolder"
                  @keyup.enter="confirmCreateFolder"
                  @keyup.esc="cancelCreateFolder"
                />
              </td>
            </tr>
            
            <tr
              v-for="file in files"
              :key="file.id"
              class="file-row"
              @dblclick="handleFileAction(file)"
            >
              <!-- 文件图标列 -->
              <td class="col-icon">
                <div class="file-icon">
                  {{ getFileIcon(file.type) }}
                </div>
              </td>
              
              <!-- 文件名称列 -->
              <td class="col-name">
                <div class="file-name-cell">
                  <span class="file-name">{{ file.name }}</span>
                  <span class="file-type-badge">{{ getFileTypeLabel(file.type) }}</span>
                </div>
              </td>
              
              <!-- 文件大小列 -->
              <td class="col-size">
                <span class="size-text">{{ file.type === 'folder' ? '--' : formatFileSize(file.size) }}</span>
              </td>
              
              <!-- 创建时间列 -->
              <td class="col-created">
                <span class="time-text">{{ formatDateTime(file.createdAt) }}</span>
              </td>
              
              <!-- 修改时间列 -->
              <td class="col-date">
                <span class="time-text">{{ formatDateTime(file.updatedAt) }}</span>
              </td>
              
              <!-- 操作列 -->
              <td class="col-actions">
                <div class="action-buttons">
                  <button 
                    class="action-btn btn-download" 
                    @click.stop="handleDownload(file)"
                    title="下载"
                  >
                    <span class="btn-icon">⬇️</span>
                    <span class="btn-text">下载</span>
                  </button>
                  <button 
                    class="action-btn btn-delete" 
                    @click.stop="handleDelete(file)"
                    title="删除"
                  >
                    <span class="btn-icon">🗑️</span>
                    <span class="btn-text">删除</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- ✅ 加载更多/到底提示 - 移动到 file-list 内部 -->
      <div ref="loadMoreTrigger" class="load-more-trigger">
        <div v-if="isLoading" class="loading-indicator">
          <span class="loading-spinner">⏳</span>
          <span>加载中...</span>
        </div>
        <div v-else-if="!hasMore && files.length > 0" class="end-indicator">
          <span>已经到底啦~ 🎉</span>
        </div>
        <div v-else-if="loadError" class="error-indicator">
          <span>⚠️ {{ loadError }}</span>
          <button @click="handleRetryLoad" class="btn-retry">重试</button>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { createLogger } from '@/utils/logger'
import { getCachedUserInfo } from '@/utils/userInfo'
import { showInfo, showSuccess, showError } from '@/utils/toast'
import { 
  browseState, 
  getCurrentNodeId,
  setCurrentNodeId,
  getParentDirectoryId,
  setParentDirectoryId,
  initBrowse,
  loadMoreFiles,
  calculateMaxPageSize,
  createFolder,
  generateSmartFolderName,
  formatDateTime,
  deleteNode
} from '@/utils/directory'

const logger = createLogger('BrowseView')

// 视图模式：'grid' 网格视图，'list' 列表视图
const viewMode = ref(sessionStorage.getItem('browseViewMode') || 'grid')

// 搜索关键词
const searchKeyword = ref('')

// 文件列表数据（从 browseState 获取）
const files = computed(() => browseState.files)

// 加载状态
const isLoading = computed(() => browseState.isLoading)
const hasMore = computed(() => browseState.hasMore)
const loadError = ref(null)

// 排序状态
const sortedBy = computed(() => browseState.sortedBy)
const order = computed(() => browseState.order)

// 存储空间信息
const storageUsed = ref('0 GB')
const storageTotal = ref('10 GB')

//  Intersection Observer for infinite scroll
let observer = null
const loadMoreTrigger = ref(null)

// 新建文件夹相关状态
const isCreatingFolder = ref(false) // 是否正在创建文件夹
const newFolderName = ref('') // 新文件夹名称
const newFolderInputRef = ref(null) // 输入框引用

/**
 * 计算属性：存储空间使用百分比
 */
const storagePercentage = computed(() => {
  const used = parseFloat(storageUsed.value)
  const total = parseFloat(storageTotal.value)
  if (total === 0) return 0
  return Math.min((used / total) * 100, 100)
})

/**
 * 计算maxPageSize
 */
const getMaxPageSize = () => {
  if (viewMode.value === 'list') {
    return 10
  } else {
    // 网格视图：需要计算每行显示数和最后一行空缺
    // 这里简化处理，实际应根据容器宽度动态计算
    const containerWidth = window.innerWidth - 64 // 减去padding
    const itemMinWidth = 190
    const itemsPerRow = Math.floor(containerWidth / (itemMinWidth + 24)) // 24是gap
    const totalItems = files.value.length
    const fullRows = Math.floor(totalItems / itemsPerRow)
    const lastRowItems = totalItems % itemsPerRow
    const emptySlots = lastRowItems > 0 ? itemsPerRow - lastRowItems : 0
    
    return itemsPerRow * 3 + emptySlots
  }
}

/**
 * 初始化加载目录
 */
const loadDirectory = async () => {
  try {
    loadError.value = null
    
    // 检查是否有currentNodeId
    let currentNodeId = getCurrentNodeId()
    
    // 如果没有，尝试从用户信息中获取homeDirectoryId
    if (!currentNodeId) {
      logger.info('未找到currentNodeId，尝试从用户信息获取homeDirectoryId')
      const cachedUserInfo = getCachedUserInfo()
      
      if (cachedUserInfo && cachedUserInfo.homeDirectoryId) {
        currentNodeId = cachedUserInfo.homeDirectoryId
        setCurrentNodeId(currentNodeId)
        logger.info('从用户信息设置currentNodeId:', currentNodeId)
      } else {
        logger.error('无法获取homeDirectoryId')
        loadError.value = '无法获取目录信息，请重新登录'
        return
      }
    }
    
    // 计算maxPageSize
    const maxPageSize = getMaxPageSize()
    
    // 调用初始化浏览
    const result = await initBrowse(maxPageSize)
    
    if (!result.success) {
      loadError.value = result.message || '加载失败'
      logger.error('加载目录失败:', result.message)
    } else {
      logger.info('目录加载成功', { count: files.value.length })
      
      // ✅ 保存当前目录的parentId到sessionStorage（会话级变量）
      if (result.data && result.data.currentNode && result.data.currentNode.parentId !== undefined) {
        const parentId = result.data.currentNode.parentId
        setParentDirectoryId(parentId)
        logger.info('已保存父目录ID:', parentId)
      }
    }
  } catch (error) {
    logger.error('加载目录异常:', error)
    loadError.value = '网络错误，请稍后重试'
  }
}

/**
 * 加载更多
 */
const handleLoadMore = async () => {
  // 检查加载状态
  if (isLoading.value) {
    logger.info('正在加载中，跳过重复请求')
    return
  }
  
  // 检查是否还有更多数据
  if (!hasMore.value) {
    logger.info('没有更多数据可加载', { isEnd: browseState.isEnd })
    return
  }
  
  try {
    loadError.value = null
    const maxPageSize = getMaxPageSize()
    const result = await loadMoreFiles(maxPageSize)
    
    if (!result.success) {
      // 只有在非正常状态下才显示错误
      if (result.message !== '没有更多数据' && result.message !== '正在加载中...') {
        loadError.value = result.message || '加载失败'
        logger.error('加载更多失败:', result.message)
      } else {
        logger.info('加载更多状态:', result.message)
      }
    }
  } catch (error) {
    logger.error('加载更多异常:', error)
    loadError.value = '网络错误，请稍后重试'
  }
}

/**
 * 重试加载
 */
const handleRetryLoad = () => {
  if (files.value.length === 0) {
    // 首次加载失败，重新初始化
    loadDirectory()
  } else {
    // 加载更多失败，重试加载
    handleLoadMore()
  }
}

/**
 * 处理排序点击
 * @param {number} columnSortedBy - 列对应的sortedBy值
 */
const handleSort = async (columnSortedBy) => {
  // 更新排序状态（会自动清空排除项、重置游标）
  browseState.updateSort(columnSortedBy)
  
  // 重新加载
  await loadDirectory()
}

/**
 * 根据文件类型获取对应的图标
 * @param {string} type - 文件类型
 * @returns {string} 对应的 emoji 图标
 */
const getFileIcon = (type) => {
  const icons = {
    folder: '📁',
    pdf: '📄',
    ppt: '📊',
    excel: '📈',
    image: '🖼️',
    video: '🎥',
    audio: '🎵',
    default: '📃'
  }
  return icons[type] || icons.default
}

/**
 * 获取文件类型的中文标签
 * @param {string} type - 文件类型
 * @returns {string} 中文类型标签
 */
const getFileTypeLabel = (type) => {
  const labels = {
    folder: '文件夹',
    pdf: 'PDF文档',
    word: 'Word文档',
    ppt: 'PPT演示',
    excel: 'Excel表格',
    image: '图片',
    video: '视频',
    audio: '音频',
    default: '文件'
  }
  return labels[type] || labels.default
}

/**
 * 切换视图模式
 */
const toggleView = () => {
  viewMode.value = viewMode.value === 'grid' ? 'list' : 'grid'
  // 保存视图模式到 sessionStorage
  sessionStorage.setItem('browseViewMode', viewMode.value)
  logger.info('切换视图模式:', viewMode.value)
}

/**
 * 处理返回上一级操作
 * 检查是否为根目录，若不是则浏览父目录
 */
const handleGoBack = async () => {
  logger.info('返回上一级')
  
  // 1. 检查当前 currentNodeId 是否为 homeDirectoryId（根目录）
  const currentNodeId = getCurrentNodeId()
  const cachedUserInfo = getCachedUserInfo()
  const homeDirectoryId = cachedUserInfo?.homeDirectoryId
  
  if (!homeDirectoryId) {
    logger.error('无法获取 homeDirectoryId')
    return
  }
  
  if (currentNodeId === homeDirectoryId) {
    // ✅ 当前是根目录，弹出提示
    showInfo('已经是第一页啦~')
    logger.info('当前已是根目录，无法返回上一级')
    return
  }
  
  // 2. 获取父目录ID（session级变量）
  const parentId = getParentDirectoryId()
  if (!parentId) {
    logger.warn('无法获取父目录ID')
    showInfo('已经是第一页啦~')
    return
  }
  
  // 3. 更新 currentNodeId 为 parentId，然后重新加载目录
  setCurrentNodeId(parentId)
  logger.info('导航到父目录:', parentId)
  
  // 4. 调用 loadDirectory，它会：
  //    - 使用新的 currentNodeId（即原来的 parentId）发起 /files/browse 请求
  //    - 成功后自动从响应中更新 parentDirectoryId（祖父目录ID）
  await loadDirectory()
}

/**
 * 处理搜索操作
 */
const handleSearch = () => {
  if (!searchKeyword.value.trim()) {
    logger.warn('搜索关键词为空')
    return
  }
  logger.info('执行搜索:', searchKeyword.value)
  // TODO: 实现搜索逻辑
  alert(`搜索：${searchKeyword.value}\n（接口待实现）`)
}

/**
 * 格式化文件大小（字节转换为可读格式）
 * @param {number} bytes - 文件大小（字节）
 * @returns {string} 格式化后的文件大小字符串
 */
const formatFileSize = (bytes) => {
  if (bytes === 0 || bytes === null || bytes === undefined) return '--'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

/**
 * 处理上传文件操作
 */
const handleUpload = () => {
  // TODO: 实现文件上传功能
  // TODO: 上传成功后，调用 browseState.addExcludeFileId(fileId) 将新文件ID添加到排除列表
  
  alert('上传文件功能待实现')
}

/**
 * 处理新建文件夹操作
 */
const handleNewFolder = async () => {
  // 如果已经在创建中，不重复触发
  if (isCreatingFolder.value) {
    logger.info('已在创建文件夹状态')
    return
  }
  
  // 设置创建状态
  isCreatingFolder.value = true
  newFolderName.value = '新建文件夹'
  
  // 等待 DOM 更新后聚焦输入框
  await nextTick()
  if (newFolderInputRef.value) {
    newFolderInputRef.value.focus()
    newFolderInputRef.value.select()
  }
}

/**
 * 确认创建文件夹（失焦或按回车时调用）
 */
const confirmCreateFolder = async () => {
  // 如果没有名称或正在创建中，取消
  if (!newFolderName.value.trim()) {
    cancelCreateFolder()
    return
  }
  
  try {
    const parentId = getCurrentNodeId()
    if (!parentId) {
      logger.error('无法获取当前目录ID')
      alert('无法获取目录信息，请刷新页面')
      cancelCreateFolder()
      return
    }
    
    // ✅ 智能生成文件夹名称：检查同名并自动添加序号
    const smartFolderName = generateSmartFolderName(newFolderName.value.trim(), files.value)
    
    logger.info('开始创建文件夹:', { parentId, folderName: smartFolderName })
    
    // 调用 API 创建文件夹
    const result = await createFolder(parentId, smartFolderName)
    
    if (result.success) {
      const folderData = result.data
      logger.info('文件夹创建成功:', folderData)
      
      // 将新文件夹 ID 添加到排除列表
      browseState.addExcludeFolderId(folderData.id)
      
      // 在文件列表开头插入新文件夹
      const newFolder = {
        id: folderData.id,
        name: folderData.name,
        type: 'folder',
        size: 0,
        createdAt: folderData.createdAt || new Date().toISOString(),
        updatedAt: folderData.updatedAt || new Date().toISOString(),
        hasChildren: false,
        childCount: 0
      }
      
      // 插入到列表开头
      files.value.unshift(newFolder)
      
      // 重置创建状态
      isCreatingFolder.value = false
      newFolderName.value = ''
      
      logger.info('新文件夹已添加到列表:', newFolder)
    } else {
      logger.error('创建文件夹失败:', result.message)
      alert(`创建文件夹失败：${result.message}`)
      cancelCreateFolder()
    }
  } catch (error) {
    logger.error('创建文件夹异常:', error)
    alert('网络错误，请稍后重试')
    cancelCreateFolder()
  }
}

/**
 * 取消创建文件夹
 */
const cancelCreateFolder = () => {
  isCreatingFolder.value = false
  newFolderName.value = ''
  logger.info('取消创建文件夹')
}

/**
 * 处理文件双击操作（文件夹打开，文件下载）
 * @param {Object} file - 文件对象
 */
const handleFileAction = async (file) => {
  if (file.type === 'folder') {
    // ✅ 打开子文件夹：更新 currentNodeId 并加载该文件夹内容
    logger.info('打开子文件夹:', { name: file.name, id: file.id })
    
    // 1. 设置 currentNodeId 为子文件夹的 ID
    setCurrentNodeId(file.id)
    
    // 2. 调用 loadDirectory 加载子文件夹内容
    //    成功后会自动更新 parentDirectoryId（即当前目录的 ID）
    await loadDirectory()
  } else {
    // 文件双击执行下载
    handleDownload(file)
  }
}

/**
 * 处理文件下载操作
 * @param {Object} file - 文件对象
 */
const handleDownload = (file) => {
  alert(`下载文件：${file.name}`)
}

/**
 * 处理文件删除操作
 * 调用 DELETE /files 接口软删除，成功后从列表中移除
 * @param {Object} file - 文件对象
 */
const handleDelete = async (file) => {
  if (!confirm(`确定要删除 "${file.name}" 吗？\n删除后移入回收站，30天后彻底删除`)) {
    return
  }

  try {
    // 转换 nodeType：文件夹=0，文件=1
    const nodeType = file.type === 'folder' ? 0 : 1
    
    // 获取 version（乐观锁版本号）
    const version = file.version || 0
    
    // 生成唯一的 batchId（UUID格式，用于后端追踪删除进程）
    const batchId = crypto.randomUUID()
    
    logger.info('删除节点:', { nodeId: file.id, nodeType, version, name: file.name, batchId })
    
    const result = await deleteNode(file.id, nodeType, version, batchId)
    
    if (result.success) {
      // 从列表中移除被删除的节点
      browseState.state.files = browseState.state.files.filter(f => f.id !== file.id)
      showSuccess(`"${file.name}" 已移入回收站`)
      logger.info('删除成功:', result.message)
    } else {
      showError(`删除失败：${result.message}`)
      logger.error('删除失败:', result.message)
    }
  } catch (error) {
    showError('网络错误，请稍后重试')
    logger.error('删除节点异常:', error)
  }
}

/**
 * 加载用户存储空间信息（从缓存获取）
 */
const loadStorageInfo = () => {
  try {
    // 从 sessionStorage 缓存中获取用户信息
    const cachedUserInfo = getCachedUserInfo()
    
    if (!cachedUserInfo) {
      logger.warn('未找到缓存的用户信息')
      return
    }
    
    logger.info('从缓存加载存储信息...')
    
    // 更新存储空间信息
    if (cachedUserInfo.storageUsed && cachedUserInfo.storageTotal) {
      storageUsed.value = cachedUserInfo.storageUsed
      storageTotal.value = cachedUserInfo.storageTotal
      logger.info('存储空间信息已加载:', `${storageUsed.value} / ${storageTotal.value}`)
    } else {
      logger.warn('缓存中没有存储信息')
    }
  } catch (error) {
    logger.error('加载存储信息失败:', error)
  }
}

/**
 * 设置Intersection Observer用于无限滚动
 */
const setupIntersectionObserver = () => {
  if (observer) {
    observer.disconnect()
  }
  
  // ✅ 获取 .file-list 容器作为观察的根元素
  const fileListComponent = document.querySelector('.file-list')
  
  observer = new IntersectionObserver((entries) => {
    logger.info('Intersection Observer 触发', {
      isIntersecting: entries[0].isIntersecting,
      isLoading: isLoading.value,
      hasMore: hasMore.value,
      loadError: loadError.value
    })
    
    if (entries[0].isIntersecting && !isLoading.value && hasMore.value && !loadError.value) {
      logger.info('✅ 开始加载更多')
      handleLoadMore()
    } else {
      logger.info('❌ 不满足加载条件')
    }
  }, {
    root: fileListComponent, // ✅ 指定 .file-list 为观察容器
    rootMargin: '100px' // 提前100px开始加载
  })
  
  if (loadMoreTrigger.value) {
    observer.observe(loadMoreTrigger.value)
    logger.info('✅ 已观察 loadMoreTrigger 元素')
  } else {
    logger.warn('⚠️ loadMoreTrigger 元素不存在')
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadStorageInfo()
  loadDirectory()
  
  // 等待DOM更新后设置Intersection Observer
  setTimeout(() => {
    setupIntersectionObserver()
  }, 100)
})

// 组件卸载时清理
onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})
</script>

<style scoped>
/* 浏览容器：占满父容器高度，垂直布局 */
.browse-container {
  height: 100%; /* 继承父容器高度 */
  display: flex; /* 启用 Flexbox 布局 */
  flex-direction: column; /* 子元素垂直排列 */
}

/* 浏览页面头部：标题和工具栏（固定不滚动） */
.browse-header {
  padding: 1.5rem 2rem; /* 内边距 */
  background: white; /* 白色背景 */
  flex-shrink: 0; /* 不允许缩小 */
}

/* 头部内容容器：包含左侧信息和右侧工具栏 */
.header-content-box {
  display: flex; /* 启用 Flexbox 布局 */
  justify-content: space-between; /* 左右两端对齐 */
  align-items: center; /* 垂直居中对齐 */
}

/* 搜索框区域容器 */
.search-section {
  padding: 1rem 2rem; /* 内边距 */
  background: white; /* 白色背景 */
}

/* 头部左侧：标题、存储信息和搜索框 */
.header-left {
  display: flex;
  flex-direction: column; /* 垂直排列 */
  align-items: flex-start; /* 左对齐 */
  gap: 0.75rem;
  flex: 1; /* 占据剩余空间 */
  min-width: 0; /* 允许缩小 */
  padding-right: 2rem; /* 与右侧工具栏保持2rem间隙 */
}

/* 搜索框区域 */
.search-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%; /* 占满整个宽度 */
}

/* 搜索输入框 */
.search-input {
  flex: 1; /* 占据剩余空间 */
  padding: 0.6rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.9rem;
  outline: none;
  transition: all 0.3s ease;
  min-width: 0; /* 允许缩小 */
}

.search-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.search-input::placeholder {
  color: #bbb;
}

/* 搜索按钮 */
.btn-search {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.75rem 1.5rem; /* 与新建文件夹按钮一致 */
  flex-shrink: 0; /* 不缩小 */
  white-space: nowrap; /* 不换行 */
}

/* 页面标题样式 */
.title {
  margin: 0; /* 清除默认外边距 */
  color: #333; /* 深灰色文字 */
  font-size: 1.75rem; /* 字体大小 28px */
  font-weight: 600; /* 字体粗细：半粗体 */
  line-height: 1.5; /* 设置行高，实际高度为 2.625rem */
}

/* 标题包装器（竖屏时包含标题和开关） */
.title-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
}

/* 返回上一级按钮 */
.btn-back {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0 1rem;
  height: 2.625rem; /* 与标题字体高度一致：1.75rem * 1.5 = 2.625rem */
  line-height: 1;
  background: white;
  border: 2px solid #667eea;
  border-radius: 8px;
  color: #667eea;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.btn-back:hover {
  background: #667eea;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.back-icon {
  font-size: 1.1rem;
  font-weight: bold;
}

.back-text-full {
  display: inline;
}

.back-text-short {
  display: none;
}

/* 移动端视图切换开关（竖屏时显示在标题右侧） */
.view-toggle-switch-mobile {
  display: none; /* 横屏时隐藏 */
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;
}

/* 搜索框区域的视图切换开关（竖屏时显示在搜索框左侧） */
.view-toggle-switch-search {
  display: none; /* 默认隐藏 */
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;
}

/* 存储空间信息容器 */
.storage-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%; /* 占满父容器宽度 */
  min-width: 0; /* 允许缩小 */
}

/* 存储进度条容器 */
.storage-bar {
  width: 100%;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

/* 已使用存储空间进度条 */
.storage-used {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
  position: relative;
}

/* 存储进度条高使用量警告（超过80%） */
.storage-used.warning {
  background: linear-gradient(90deg, #ffa940 0%, #ff7a45 100%);
}

/* 存储进度条危险提示（超过90%） */
.storage-used.danger {
  background: linear-gradient(90deg, #ff4d4f 0%, #cf1322 100%);
}

/* 存储空间文本 */
.storage-text {
  font-size: 0.875rem;
  color: #666;
  font-weight: 500;
}

/* 文件列表区域：占据剩余空间，可滚动 */
.file-list {
  flex: 1; /* 占据剩余空间 */
  overflow-y: auto; /* 垂直方向可滚动 */
  padding: 2rem; /* 内边距 */
}

/* 工具栏按钮组 */
.toolbar {
  display: flex; /* 启用 Flexbox 布局 */
  gap: 1rem; /* 按钮间距 16px */
  flex-shrink: 0; /* 不缩小，保持内容宽度 */
  white-space: nowrap; /* 不换行 */
}

/* 操作按钮组容器：横屏时横向排列 */
.action-buttons-wrapper {
  display: flex;
  gap: 1rem; /* 按钮间距 1rem */
  margin: 0; /* 无外边距 */
}

/* 通用按钮样式 */
.btn {
  display: flex; /* 启用 Flexbox 布局 */
  align-items: center; /* 垂直居中对齐图标和文字 */
  gap: 0.5rem; /* 图标和文字间距 8px */
  padding: 0.75rem 1.5rem; /* 上下 12px，左右 24px 内边距 */
  border: none; /* 无边框 */
  border-radius: 8px; /* 圆角 8px */
  font-size: 0.95rem; /* 字体大小约 15px */
  font-weight: 500; /* 字体粗细：中等 */
  cursor: pointer; /* 鼠标悬停时显示手型光标 */
  transition: all 0.3s ease; /* 所有属性变化时的过渡动画 */
}

/* 上传文件按钮：紫色渐变背景 */
.btn-upload {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); /* 紫色渐变 */
  color: white; /* 白色文字 */
}

/* 上传按钮悬停效果 */
.btn-upload:hover {
  transform: translateY(-2px); /* 向上移动 2px */
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); /* 紫色阴影 */
}

/* 新建文件夹按钮：白色背景紫色边框 */
.btn-new-folder {
  background: white; /* 白色背景 */
  color: #667eea; /* 紫色文字 */
  border: 2px solid #667eea; /* 2px 紫色边框 */
}

/* 新建文件夹按钮悬停效果 */
.btn-new-folder:hover {
  background: #667eea; /* 变为紫色背景 */
  color: white; /* 变为白色文字 */
  transform: translateY(-2px); /* 向上移动 2px */
}

/* 按钮图标样式 */
.icon {
  font-size: 1.1rem; /* 图标大小约 17.6px */
}

/* 文件列表区域：占据剩余空间，可滚动 */
.file-list {
  flex: 1; /* 占据剩余空间 */
  overflow-y: auto; /* 垂直方向可滚动 */
  padding: 2rem; /* 内边距 */
}

/* 空状态提示：居中显示 */
.empty-state {
  display: flex; /* 启用 Flexbox 布局 */
  flex-direction: column; /* 子元素垂直排列 */
  align-items: center; /* 水平居中对齐 */
  justify-content: center; /* 垂直居中对齐 */
  height: 100%; /* 占满父容器高度 */
  color: #999; /* 灰色文字 */
}

/* 空状态图标 */
.empty-icon {
  font-size: 4rem; /* 图标大小 64px */
  margin-bottom: 1rem; /* 底部外边距 16px */
}

/* 空状态文字 */
.empty-state p {
  font-size: 1.1rem; /* 字体大小 17.6px */
  margin: 0; /* 清除默认外边距 */
}

/* 文件网格布局：自适应列数 */
.file-grid {
  display: grid; /* 启用 Grid 布局 */
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); /* 自动填充，最小 250px，最大均分 */
  gap: 1.5rem; /* 网格间距 24px */
}

/* 单个文件项卡片 */
.file-item {
  background: white; /* 白色背景 */
  border: 2px solid #f0f0f0; /* 2px 浅灰色边框 */
  border-radius: 12px; /* 圆角 12px */
  padding: 1.5rem; /* 四周 24px 内边距 */
  cursor: pointer; /* 鼠标悬停时显示手型光标 */
  transition: all 0.3s ease; /* 所有属性变化时的过渡动画 */
  display: flex; /* 启用 Flexbox 布局 */
  flex-direction: column; /* 子元素垂直排列 */
  position: relative; /* 相对定位 */
}

/* 文件项悬停效果 */
.file-item:hover {
  border-color: #667eea; /* 边框变为紫色 */
  transform: translateY(-4px); /* 向上移动 4px */
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.15); /* 紫色阴影 */
}

/* 文件图标 */
.file-icon {
  font-size: 3rem; /* 图标大小 48px */
  margin-bottom: 1rem; /* 底部外边距 16px */
  text-align: center; /* 文字居中对齐 */
}

/* 文件信息区域：占据剩余空间 */
.file-info {
  flex: 1; /* 占据剩余空间 */
}

/* 文件名称 */
.file-name {
  margin: 0 0 0.5rem 0; /* 底部外边距 8px */
  color: #333; /* 深灰色文字 */
  font-weight: 600; /* 字体粗细：半粗体 */
  font-size: 1rem; /* 字体大小 16px */
  word-break: break-word; /* 长单词换行 */
}

/* 文件元数据（大小和日期） */
.file-meta {
  margin: 0; /* 清除默认外边距 */
  color: #999; /* 灰色文字 */
  font-size: 0.875rem; /* 字体大小 14px */
}

/* 文件操作按钮组：默认隐藏 */
.file-actions {
  display: flex; /* 启用 Flexbox 布局 */
  gap: 0.5rem; /* 按钮间距 8px */
  margin-top: 1rem; /* 顶部外边距 16px */
  opacity: 0; /* 初始透明度为 0（隐藏） */
  transition: opacity 0.3s ease; /* 透明度变化的过渡动画 */
}

/* 文件项悬停时显示操作按钮 */
.file-item:hover .file-actions {
  opacity: 1; /* 透明度设为 1（显示） */
}

/* 操作按钮（下载/删除） */
.action-btn {
  flex: 1; /* 平均分配宽度 */
  padding: 0.5rem; /* 四周 8px 内边距 */
  border: 1px solid #e0e0e0; /* 1px 浅灰色边框 */
  background: white; /* 白色背景 */
  border-radius: 6px; /* 圆角 6px */
  cursor: pointer; /* 鼠标悬停时显示手型光标 */
  transition: all 0.3s ease; /* 所有属性变化时的过渡动画 */
  font-size: 1.1rem; /* 图标大小 17.6px */
}

/* 操作按钮悬停效果 */
.action-btn:hover {
  background: #f5f7fa; /* 浅灰色背景 */
  border-color: #667eea; /* 边框变为紫色 */
}

/* ========== 新建文件夹输入框样式 ========== */

/* 正在创建的文件夹项 */
.creating-folder-item {
  border-color: #667eea !important;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
  animation: pulse-border 1.5s ease-in-out infinite;
}

@keyframes pulse-border {
  0%, 100% {
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(102, 126, 234, 0.2);
  }
}

/* 文件夹名称输入框 */
.folder-name-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 2px solid #667eea;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  outline: none;
  background: white;
  transition: all 0.3s ease;
}

.folder-name-input:focus {
  border-color: #764ba2;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
}

/* 表格中的输入框 */
.folder-name-input.table-input {
  padding: 0.75rem 1rem;
  font-size: 0.95rem;
}

.creating-folder-row {
  background: #f8f9ff;
  animation: highlight-row 1s ease-in-out;
}

@keyframes highlight-row {
  0% {
    background: #e8ebff;
  }
  100% {
    background: #f8f9ff;
  }
}

/* 视图切换开关 */
.view-toggle-switch {
  cursor: pointer;
  user-select: none;
  display: flex; /* 启用 Flexbox */
  align-items: center; /* 垂直居中 */
}

.switch-track {
  position: relative;
  width: 80px;
  height: 40px;
  background: white;
  border: 2px solid #667eea;
  border-radius: 5px; /* 圆角5px */
  overflow: hidden;
  transition: all 0.3s ease;
  box-sizing: border-box; /* 确保边框包含在尺寸内 */
}

.view-toggle-switch:hover .switch-track {
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  /* transform: translateY(-2px); */ /* 取消上浮效果 */
}

.switch-icons {
  position: absolute;
  top: 0;
  left: -1.5px; /* 向左移动2px */
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: space-between; /* 改为space-between确保两端对齐 */
  z-index: 2;
  padding: 0; /* 移除内边距，让图标紧贴边缘 */
}

.switch-icons span {
  font-size: 1.2rem;
  color: #999;
  transition: color 0.3s ease;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px; /* 与滑块宽度一致（轨道一半） */
  height: 40px; /* 与滑块高度一致 */
  flex-shrink: 0; /* 防止收缩 */
}

.switch-icons .active {
  color: white;
  font-weight: bold;
}

.switch-slider {
  position: absolute;
  top: 0px; /* 向上移动1px */
  left: 0px; /* 向左移动2px */
  width: calc(52%); /* 轨道内部宽度的一半 (80px - 2px*2边框) / 2 = 38px */
  height: calc(100%); /* 填满整个高度 */
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 3px; /* 稍微小于轨道圆角 */
  transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  z-index: 1;
  /* margin: 1px; /* 四周留1px边距，避免白边 */
  transform: translateX(-2%); /* 初始位置：左侧，中心在20% (滑块宽度约52%) */
}

.switch-slider.slider-right {
  transform: translateX(96%); /* 移动到右侧，中心在75% (滑块宽度约52%) */
}

/* ========== 列表视图样式 ========== */

/* 表格包装器：支持横向滚动 */
.table-wrapper {
  overflow-x: auto; /* 横向可滚动 */
  background: white; /* 白色背景 */
  border-radius: 12px; /* 圆角 12px */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); /* 轻微阴影 */
}

/* 文件列表表格 */
.file-table {
  width: 100%; /* 宽度 100% */
  border-collapse: collapse; /* 合并边框 */
  min-width: 600px; /* 最小宽度，防止过度压缩 */
}

/* 表头 */
.file-table thead {
  background: #f8f9fa; /* 浅灰色背景 */
  position: sticky; /* 粘性定位 */
  top: 0; /* 固定在顶部 */
  z-index: 10; /* 层级高于表体 */
}

/* 表头单元格 */
.file-table th {
  padding: 1rem 1.5rem; /* 内边距 */
  text-align: left; /* 左对齐 */
  color: #666; /* 灰色文字 */
  font-weight: 600; /* 字体粗细：半粗体 */
  font-size: 0.9rem; /* 字体大小 14.4px */
  border-bottom: 2px solid #e8e8e8; /* 底部边框 */
  white-space: nowrap; /* 不换行 */
  user-select: none; /* 禁止选中文本 */
  transition: background-color 0.2s ease;
}

.file-table th:hover {
  background-color: #f0f0f0;
}

.sort-indicator {
  margin-left: 0.3rem;
  font-size: 0.8rem;
}

/* 表体单元格 */
.file-table td {
  padding: 1rem 1.5rem; /* 内边距 */
  color: #333; /* 深灰色文字 */
  border-bottom: 1px solid #f0f0f0; /* 底部边框 */
  vertical-align: middle; /* 垂直居中对齐 */
}

/* 表格行悬停效果 */
.file-row:hover {
  background: #f8f9fa; /* 浅灰色背景 */
  cursor: pointer; /* 手型光标 */
}

/* 最后一行去除底部边框 */
.file-row:last-child td {
  border-bottom: none;
}

/* 图标列 */
.col-icon {
  width: 6%; /* 比例 0.5/8 = 6.25% */
  text-align: center; /* 居中对齐 */
  min-width: 50px;
}

/* 列表视图中的文件图标 */
.file-table .file-icon {
  font-size: 2rem; /* 图标大小 32px */
  margin-bottom: 0; /* 清除外边距 */
}

/* 名称列 */
.col-name {
  width: 25%; /* 比例 2/8 = 25% */
  min-width: 150px;
}

/* 名称单元格内容 */
.file-name-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

/* 列表视图中的文件名称 */
.file-table .file-name {
  margin: 0; /* 清除外边距 */
  font-weight: 500; /* 字体粗细：中等 */
  color: #333; /* 深灰色文字 */
  word-break: break-word; /* 长单词换行 */
}

/* 文件类型标签 */
.file-type-badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  background: #f0f0f0; /* 浅灰色背景 */
  color: #666; /* 灰色文字 */
  border-radius: 4px; /* 圆角 */
  font-size: 0.75rem; /* 字体大小 12px */
  width: fit-content;
}

/* 大小列 */
.col-size {
  width: 13%; /* 比例 1/8 = 12.5% */
  min-width: 90px;
  white-space: nowrap; /* 不换行 */
}

/* 创建时间列 */
.col-created {
  width: 19%; /* 比例 1.5/8 = 18.75% */
  min-width: 140px;
  white-space: nowrap; /* 不换行 */
}

/* 大小文本 */
.size-text {
  color: #666; /* 灰色文字 */
  font-size: 0.9rem; /* 字体大小 14.4px */
}

/* 时间列 */
.col-date {
  width: 19%; /* 比例 1.5/8 = 18.75% */
  min-width: 140px;
  white-space: nowrap; /* 不换行 */
}

/* 时间文本 */
.time-text {
  color: #666; /* 灰色文字 */
  font-size: 0.9rem; /* 字体大小 14.4px */
}

/* 操作列 */
.col-actions {
  width: 19%; /* 比例 1.5/8 = 18.75% */
  min-width: 150px;
  white-space: nowrap; /* 不换行 */
}

/* 操作按钮组 */
.action-buttons {
  display: flex;
  flex-direction: column; /* 纵向排列 */
  gap: 0.4rem; /* 按钮间距 */
}

/* 列表视图中的操作按钮 */
.file-table .action-btn {
  display: flex;
  align-items: center;
  justify-content: center; /* 居中对齐 */
  gap: 0.4rem;
  padding: 0.5rem 0.75rem;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  width: 100%; /* 占满宽度 */
}

/* 下载按钮 */
.btn-download {
  background: #e3f2fd; /* 浅蓝色背景 */
  color: #1976d2; /* 深蓝色文字 */
}

.btn-download:hover {
  background: #bbdefb; /* 稍深的蓝色 */
  transform: translateY(-1px);
}

/* 删除按钮 */
.btn-delete {
  background: #ffebee; /* 浅红色背景 */
  color: #c62828; /* 深红色文字 */
}

.btn-delete:hover {
  background: #ffcdd2; /* 稍深的红色 */
  transform: translateY(-1px);
}

/* 按钮图标 */
.btn-icon {
  font-size: 1rem;
}

/* 按钮文字 */
.btn-text {
  display: inline;
}

/* 中等屏幕（930px < 宽度 ≤ 1100px）：仅调整列表视图，显示大小列 */
@media (max-width: 1100px) and (min-width: 931px) {
  /* ========== 列表视图样式调整 ========= */

  /* 缩小列表内边距 */
  .file-list {
    padding: 1.5rem;
  }

  /* 表格包装器 */
  .table-wrapper {
    border-radius: 10px;
  }

  /* 缩小表格最小宽度，允许压缩 */
  .file-table {
    min-width: auto;
    width: 100%;
  }

  /* 缩小表格单元格内边距 */
  .file-table th,
  .file-table td {
    padding: 0.875rem 1.25rem;
  }

  /* 隐藏创建时间列 */
  .col-created {
    display: none;
  }

  /* 调整图标列宽度（比例 0.5/6.5 ≈ 7.69%）*/
  .col-icon {
    width: 8%;
    min-width: 45px;
  }

  /* 文件图标大小 */
  .file-table .file-icon {
    font-size: 1.85rem;
  }

  /* 调整名称列（比例 2/6.5 ≈ 30.77%）*/
  .col-name {
    width: 31%;
    min-width: 120px;
  }

  /* 文件名大小调整 */
  .file-table .file-name {
    font-size: 0.95rem;
  }

  /* 类型标签大小调整 */
  .file-type-badge {
    font-size: 0.75rem;
  }

  /* 调整大小列（比例 1/6.5 ≈ 15.38%）*/
  .col-size {
    width: 15%;
    min-width: 80px;
  }

  /* 大小文本 */
  .size-text {
    font-size: 0.85rem;
  }

  /* 调整修改时间列（比例 1.5/6.5 ≈ 23.08%）*/
  .col-date {
    width: 23%;
    min-width: 120px;
  }

  /* 时间文本大小调整 */
  .time-text {
    font-size: 0.85rem;
  }

  /* 调整操作列（比例 1.5/6.5 ≈ 23.08%）*/
  .col-actions {
    width: 23%;
    min-width: 130px;
  }

  /* 表头字体大小调整 */
  .file-table th {
    font-size: 0.875rem;
  }
}

/* 中等屏幕（885px < 宽度 ≤ 1024px）：返回按钮只显示图标 */
@media (max-width: 1024px) and (min-width: 931px) {
  /* 返回上一级按钮：只显示图标，宽度等于高度 */
  .btn-back {
    padding: 0;
    height: 2.25rem;
    width: 2.25rem; /* 宽度等于高度，形成正方形 */
    justify-content: center; /* 图标居中 */
  }

  .back-text-full {
    display: none;
  }

  .back-text-short {
    display: none;
  }
}

/* 窄屏（768px < 宽度 ≤ 930px）：隐藏修改时间列，显示大小列 */
@media (max-width: 930px) and (min-width: 769px) {
  /* ========== 列表视图样式调整 ========= */

  /* 缩小列表内边距 */
  .file-list {
    padding: 1.5rem;
  }

  /* 表格包装器 */
  .table-wrapper {
    border-radius: 10px;
  }

  /* 缩小表格最小宽度，允许压缩 */
  .file-table {
    min-width: auto;
    width: 100%;
  }

  /* 缩小表格单元格内边距 */
  .file-table th,
  .file-table td {
    padding: 0.875rem 1.25rem;
  }

  /* 隐藏创建时间列 */
  .col-created {
    display: none;
  }

  /* 隐藏修改时间列 */
  .col-date {
    display: none;
  }

  /* 调整图标列宽度（比例 0.5/5 = 10%）*/
  .col-icon {
    width: 10%;
    min-width: 45px;
  }

  /* 文件图标大小 */
  .file-table .file-icon {
    font-size: 1.85rem;
  }

  /* 调整名称列（比例 2/5 = 40%）*/
  .col-name {
    width: 40%;
    min-width: 120px;
  }

  /* 文件名大小调整 */
  .file-table .file-name {
    font-size: 0.95rem;
  }

  /* 类型标签大小调整 */
  .file-type-badge {
    font-size: 0.75rem;
  }

  /* 调整大小列（比例 1/5 = 20%）*/
  .col-size {
    width: 20%;
    min-width: 90px;
  }

  /* 大小文本 */
  .size-text {
    font-size: 0.85rem;
  }

  /* 调整操作列（比例 1.5/5 = 30%）*/
  .col-actions {
    width: 30%;
    min-width: 130px;
  }

  /* 表头字体大小调整 */
  .file-table th {
    font-size: 0.875rem;
  }
}

/* 移动端与横屏过窄（屏幕宽度 ≤ 930px）响应式适配 */
@media (max-width: 930px) {
  /* 缩小标题栏内边距 */
  .browse-header {
    padding: 1rem; /* 四周 16px 内边距 */
  }

  /* 搜索框区域内边距与头部保持一致 */
  .search-section {
    padding: 1rem; /* 四周 16px 内边距 */
  }

  /* 标题大小调整 */
  .title {
    font-size: 1.5rem;
  }

  /* 标题包装器：竖屏时显示开关 */
  .title-wrapper {
    gap: 0.5rem;
  }

  /* 返回上一级按钮：中等屏幕只显示图标 */
  .btn-back {
    padding: 0 0.75rem;
    height: 2.25rem; /* 与缩小后的标题高度匹配 */
  }

  .back-text-full {
    display: none;
  }

  .back-text-short {
    display: none;
  }

  /* 头部左侧：竖屏时与右侧按钮保持1rem间距 */
  .header-left {
    padding-right: 1rem; /* 与右侧工具栏保持1rem间隙 */
  }

  /* 移动端视图切换开关：竖屏时隐藏 */
  .view-toggle-switch-mobile {
    display: none;
  }

  /* 搜索框区域视图切换开关：竖屏时显示 */
  .view-toggle-switch-search {
    display: block;
  }

  /* 搜索框区域开关样式（缩小至与搜索按钮高度一致） */
  .view-toggle-switch-search .switch-track {
    width: 62px; /* 按比例缩小：75px * (33/40) ≈ 62px */
    height: 33px; /* 与搜索按钮高度一致 */
    border-radius: 4px;
    box-sizing: border-box;
  }

  .view-toggle-switch-search .switch-slider {
    width: calc(56%);
    height: calc(100%);
    border-radius: 3px;
    margin: 1px;
    top: -1px;
    left: -3px;
    transform: translateX(0);
  }

  .view-toggle-switch-search .switch-slider.slider-right {
    transform: translateX(90%);
  }

  .view-toggle-switch-search .switch-icons span {
    font-size: 1rem; /* 按比例缩小图标 */
    width: calc(50% - 1px);
    height: 33px; /* 与轨道高度一致 */
  }

  /* 横屏视图切换开关：竖屏时隐藏 */
  .view-toggle-switch {
    display: none;
  }

  /* 返回上一级按钮：小屏幕显示完整文字 */
  .btn-back {
    padding: 0 0.85rem;
    height: 2.25rem; /* 与缩小后的标题高度匹配 */
    font-size: 0.85rem;
  }

  .back-text-full {
    display: inline;
  }

  .back-text-short {
    display: none;
  }

  /* 工具栏：竖屏时纵向排列 */
  .toolbar {
    flex-direction: column; /* 纵向排列 */
    align-items: flex-end; /* 右对齐 */
    gap: 1rem; /* 开关和按钮组间距 */
  }

  /* 操作按钮组容器：竖屏时纵向排列 */
  .action-buttons-wrapper {
    flex-direction: column; /* 纵向排列 */
    gap: 0.5rem; /* 按钮间距 0.5rem */
    width: auto; /* 自适应宽度 */
  }

  /* 竖屏时确保上传和新建按钮高度一致 */
  .btn-upload,
  .btn-new-folder {
    height: 2.75rem; /* 固定高度，确保两个按钮等高 */
    min-height: 2.75rem; /* 最小高度 */
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* 移动端开关轨道样式 */
  .view-toggle-switch-mobile .switch-track {
    width: 60px;
    height: 32px;
    border-radius: 4px;
    box-sizing: border-box;
  }

  .view-toggle-switch-mobile .switch-slider {
    width: calc(56%);
    height: calc(100%);
    border-radius: 3px;
    margin: 1px;
    top: -1px;
    left: -3px;
    transform: translateX(0);
  }

  .view-toggle-switch-mobile .switch-slider.slider-right {
    transform: translateX(90%);
  }

  .view-toggle-switch-mobile .switch-icons span {
    font-size: 1rem;
    width: calc(50% - 1px);
    height: 32px;
  }

  /* 缩小按钮尺寸 */
  .btn {
    padding: 0.5rem 1rem; /* 上下 8px，左右 16px 内边距 */
    font-size: 0.875rem; /* 字体大小 14px */
  }

  /* ========== 竖屏列表视图样式（与回收站保持一致）========== */

  /* 缩小列表内边距 */
  .file-list {
    padding: 1rem; /* 与回收站保持一致 */
  }

  /* 表格包装器 */
  .table-wrapper {
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); /* 增强阴影 */
  }

  /* 缩小表格最小宽度，允许压缩 */
  .file-table {
    min-width: auto; /* 移除最小宽度限制 */
    width: 100%;
  }

  /* 缩小表格单元格内边距 */
  .file-table th,
  .file-table td {
    padding: 0.75rem 1rem; /* 与回收站保持一致 */
  }

  /* 隐藏创建时间列 */
  .col-created {
    display: none;
  }

  /* 隐藏修改时间列 */
  .col-date {
    display: none;
  }

  /* 调整图标列宽度 */
  .col-icon {
    width: 45px; /* 稍微增大 */
  }

  /* 文件图标大小 */
  .file-table .file-icon {
    font-size: 1.75rem; /* 增大图标 */
  }

  /* 调整名称列 */
  .col-name {
    min-width: auto; /* 移除最小宽度 */
    max-width: 110px; /* 适当增加宽度 */
  }

  /* 文件名大小调整 */
  .file-table .file-name {
    font-size: 0.9rem; /* 增大字体 */
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* 类型标签大小调整 */
  .file-type-badge {
    font-size: 0.7rem; /* 增大字体 */
    padding: 0.15rem 0.4rem;
  }

  /* 调整大小列 */
  .col-size {
    width: auto; /* 自动宽度 */
    min-width: 80px;
    max-width: 90px;
  }

  /* 大小文本 */
  .size-text {
    font-size: 0.8rem; /* 增大字体 */
  }

  /* 调整操作列 */
  .col-actions {
    width: auto; /* 自动宽度 */
    min-width: 100px; /* 减小最小宽度 */
  }

  /* 操作按钮改为纵向排列 */
  .action-buttons {
    flex-direction: column; /* 纵向排列 */
    gap: 0.4rem;
  }

  .file-table .action-btn {
    width: 100%; /* 占满宽度 */
    justify-content: center; /* 居中对齐 */
    padding: 0.5rem 0.75rem; /* 增大内边距 */
    font-size: 0.85rem; /* 增大字体 */
    white-space: nowrap;
  }

  /* 显示按钮文字 */
  .btn-text {
    display: inline; /* 显示文字 */
  }

  .btn-icon {
    font-size: 1rem; /* 增大图标 */
  }

  /* 表头字体大小调整 */
  .file-table th {
    font-size: 0.85rem; /* 增大字体 */
    padding: 0.75rem 1rem;
  }

  /* ========== 移动端列表视图样式（≤ 768px）========== */
}

/* 移动端列表视图（屏幕宽度 ≤ 768px）：重新分配列宽比例 */
@media (max-width: 768px) {
  /* 图标列（比例 0.5/5 = 10%）*/
  .col-icon {
    width: 10%;
    min-width: 40px;
  }

  /* 文件图标大小 */
  .file-table .file-icon {
    font-size: 1.6rem;
  }

  /* 名称列（比例 2/5 = 40%）*/
  .col-name {
    width: 40%;
    min-width: 100px;
    max-width: none;
  }

  /* 文件名大小调整 */
  .file-table .file-name {
    font-size: 0.85rem;
  }

  /* 类型标签大小调整 */
  .file-type-badge {
    font-size: 0.65rem;
    padding: 0.1rem 0.3rem;
  }

  /* 大小列（比例 1/5 = 20%）*/
  .col-size {
    width: 20%;
    min-width: 70px;
    max-width: none;
  }

  /* 大小文本 */
  .size-text {
    font-size: 0.75rem;
  }

  /* 操作列（比例 1.5/5 = 30%）*/
  .col-actions {
    width: 30%;
    min-width: 90px;
  }

  /* 操作按钮调整 */
  .file-table .action-btn {
    padding: 0.4rem 0.6rem;
    font-size: 0.8rem;
  }

  .btn-icon {
    font-size: 0.9rem;
  }

  /* 表头字体大小调整 */
  .file-table th {
    font-size: 0.8rem;
    padding: 0.6rem 0.8rem;
  }

  /* 表体单元格内边距 */
  .file-table td {
    padding: 0.6rem 0.8rem;
  }

  /* 移动端侧边栏：默认隐藏在屏幕左侧外 */
  .sidebar {
    position: fixed; /* 固定定位 */
    left: 0; /* 左侧对齐 */
    top: 0; /* 顶部对齐 */
    bottom: 0; /* 底部对齐 */
    width: 250px; /* 宽度 250px */
    z-index: 1000; /* 层级最高，高于遮罩层 */
    transform: translateX(-100%); /* 默认向左移出屏幕 */
    box-shadow: 2px 0 12px rgba(0, 0, 0, 0.15); /* 右侧阴影 */
  }

  /* 侧边栏打开状态 */
  .sidebar.sidebar-open {
    transform: translateX(0); /* 移回屏幕内 */
  }

  /* 缩小内容区内边距 */
  .content-area {
    padding: 0; /* 清除内边距（由子组件控制） */
  }
}

/* ========== 加载更多控件样式 ========== */

.load-more-trigger {
  padding: 2rem;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80px;
}

.loading-indicator,
.end-indicator,
.error-indicator {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #666;
  font-size: 0.95rem;
}

.loading-spinner {
  display: inline-block;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.btn-retry {
  padding: 0.4rem 1rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.3s ease;
}

.btn-retry:hover {
  background: #5568d3;
  transform: translateY(-1px);
}
</style>
