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
      <!-- 空状态提示：当没有文件时显示 -->
      <div v-if="files.length === 0" class="empty-state">
        <div class="empty-icon">📂</div>
        <p>暂无文件</p>
      </div>

      <!-- 网格视图：当有文件且选择网格模式时显示 -->
      <div v-else-if="viewMode === 'grid'" class="file-grid">
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
            <p class="file-meta">{{ formatFileSize(file.size) }} · {{ file.date }}</p>
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

      <!-- 列表视图：当有文件且选择列表模式时显示 -->
      <div v-else class="table-wrapper">
        <table class="file-table">
          <thead>
            <tr>
              <th class="col-icon"></th>
              <th class="col-name">名称</th>
              <th class="col-size">大小</th>
              <th class="col-created">创建时间</th>
              <th class="col-date">修改时间</th>
              <th class="col-actions">操作</th>
            </tr>
          </thead>
          <tbody>
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
                <span class="size-text">{{ formatFileSize(file.size) }}</span>
              </td>
              
              <!-- 创建时间列 -->
              <td class="col-created">
                <span class="time-text">{{ file.createdDate }}</span>
              </td>
              
              <!-- 修改时间列 -->
              <td class="col-date">
                <span class="time-text">{{ file.date }}</span>
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
    </div>
  </div>
</template>


<script setup>
import { ref, computed, onMounted } from 'vue'
import { createLogger } from '@/utils/logger'
import { getCachedUserInfo } from '@/utils/userInfo'

const logger = createLogger('BrowseView')

// 视图模式：'grid' 网格视图，'list' 列表视图
const viewMode = ref('grid')

// 搜索关键词
const searchKeyword = ref('')

// 文件列表数据（模拟数据）
const files = ref([
  { id: 1, name: '工作文档', type: 'folder', size: 0, date: '2024-01-15', createdDate: '2024-01-10' },
  { id: 2, name: '项目资料', type: 'folder', size: 0, date: '2024-01-14', createdDate: '2024-01-08' },
  { id: 3, name: '报告.pdf', type: 'pdf', size: 2048576, date: '2024-01-13', createdDate: '2024-01-05' },
  { id: 4, name: '演示文稿.pptx', type: 'ppt', size: 5242880, date: '2024-01-12', createdDate: '2024-01-03' },
  { id: 5, name: '数据表格.xlsx', type: 'excel', size: 1048576, date: '2024-01-11', createdDate: '2024-01-01' },
  { id: 6, name: '照片.jpg', type: 'image', size: 3145728, date: '2024-01-10', createdDate: '2023-12-28' },
])

// 存储空间信息
const storageUsed = ref('0 GB')
const storageTotal = ref('10 GB')

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
  logger.info('切换视图模式:', viewMode.value)
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
  if (bytes === 0) return '--'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

/**
 * 处理上传文件操作
 */
const handleUpload = () => {
  alert('上传文件功能待实现')
}

/**
 * 处理新建文件夹操作
 */
const handleNewFolder = () => {
  const name = prompt('请输入文件夹名称：')
  if (name) {
    // 在列表开头插入新文件夹
    files.value.unshift({
      id: Date.now(),
      name: name,
      type: 'folder',
      size: 0,
      date: new Date().toISOString().split('T')[0]
    })
  }
}

/**
 * 处理文件双击操作（文件夹打开，文件下载）
 * @param {Object} file - 文件对象
 */
const handleFileAction = (file) => {
  if (file.type === 'folder') {
    alert(`打开文件夹：${file.name}`)
  } else {
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
 * @param {Object} file - 文件对象
 */
const handleDelete = (file) => {
  if (confirm(`确定要删除 "${file.name}" 吗？`)) {
    // 从列表中过滤掉被删除的文件
    files.value = files.value.filter(f => f.id !== file.id)
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

// 组件挂载时加载存储信息
onMounted(() => {
  loadStorageInfo()
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
}

/* 标题包装器（竖屏时包含标题和开关） */
.title-wrapper {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
}

/* 移动端视图切换开关（竖屏时显示在标题右侧） */
.view-toggle-switch-mobile {
  display: none; /* 横屏时隐藏 */
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
  width: 60px; /* 固定宽度 */
  text-align: center; /* 居中对齐 */
}

/* 列表视图中的文件图标 */
.file-table .file-icon {
  font-size: 2rem; /* 图标大小 32px */
  margin-bottom: 0; /* 清除外边距 */
}

/* 名称列 */
.col-name {
  min-width: 200px; /* 最小宽度 */
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
  width: 120px; /* 固定宽度 */
  white-space: nowrap; /* 不换行 */
}

/* 创建时间列 */
.col-created {
  width: 140px; /* 固定宽度 */
  white-space: nowrap; /* 不换行 */
}

/* 大小文本 */
.size-text {
  color: #666; /* 灰色文字 */
  font-size: 0.9rem; /* 字体大小 14.4px */
}

/* 时间列 */
.col-date {
  width: 140px; /* 固定宽度 */
  white-space: nowrap; /* 不换行 */
}

/* 时间文本 */
.time-text {
  color: #666; /* 灰色文字 */
  font-size: 0.9rem; /* 字体大小 14.4px */
}

/* 操作列 */
.col-actions {
  width: 180px; /* 固定宽度 */
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

/* 移动端与横屏过窄（屏幕宽度 ≤ 885px）响应式适配 */
@media (max-width: 885px) {
  /* 缩小标题栏内边距 */
  .browse-header {
    padding: 1rem; /* 四周 16px 内边距 */
  }

  /* 标题大小调整 */
  .title {
    font-size: 1.5rem;
  }

  /* 标题包装器：竖屏时显示开关 */
  .title-wrapper {
    gap: 0.75rem;
  }

  /* 头部左侧：竖屏时与右侧按钮保持1rem间距 */
  .header-left {
    padding-right: 1rem; /* 与右侧工具栏保持1rem间隙 */
  }

  /* 移动端视图切换开关：竖屏时显示 */
  .view-toggle-switch-mobile {
    display: block;
  }

  /* 横屏视图切换开关：竖屏时隐藏 */
  .view-toggle-switch {
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
</style>
