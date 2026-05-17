<template>
  <!-- 回收站主容器 -->
  <div class="recycle-bin-container">
    <!-- 回收站头部：包含标题、统计信息和搜索框 -->
    <div class="recycle-header">
      <!-- 上方区域：标题、注释和清空按钮 -->
      <div class="header-top">
        <div class="header-left">
          <h2 class="title">回收站</h2>
          <p class="subtitle">已删除的文件将在30天后自动清除</p>
        </div>
        <div class="header-right">
          <button class="btn btn-clear-all" @click="handleClearAll" :disabled="files.length === 0">
            <span class="icon">🗑️</span>
            清空回收站
          </button>
        </div>
      </div>
      
      <!-- 下方区域：搜索框 -->
      <div class="header-bottom">
        <div class="search-box">
          <input 
            type="text" 
            v-model="searchKeyword"
            placeholder="搜索已删除的文件..." 
            class="search-input"
            @keyup.enter="handleSearch"
          />
          <button class="btn btn-search" @click="handleSearch">
            <span class="icon">🔍</span>
            搜索
          </button>
        </div>
      </div>
    </div>

    <!-- 文件列表区域 -->
    <div class="file-list">
      <!-- 空状态提示：当回收站为空时显示 -->
      <div v-if="files.length === 0" class="empty-state">
        <div class="empty-icon">♻️</div>
        <p>回收站是空的</p>
        <p class="empty-hint">已删除的文件会出现在这里</p>
      </div>

      <!-- 文件列表表格：当有文件时显示 -->
      <div v-else class="table-wrapper">
        <table class="file-table">
          <thead>
            <tr>
              <th class="col-icon"></th>
              <th class="col-name">名称</th>
              <th class="col-size">大小</th>
              <th class="col-created">创建时间</th>
              <th class="col-deleted">删除时间</th>
              <th class="col-actions">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="file in files"
              :key="file.id"
              class="file-row"
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
                  <div class="file-meta-info">
                    <span class="file-type-badge">{{ getFileTypeLabel(file.type) }}</span>
                    <span class="file-size-inline">· {{ formatFileSize(file.size) }}</span>
                  </div>
                </div>
              </td>
              
              <!-- 文件大小列 -->
              <td class="col-size">
                <span class="size-text">{{ formatFileSize(file.size) }}</span>
              </td>
              
              <!-- 创建时间列 -->
              <td class="col-created">
                <span class="time-text">{{ formatDate(file.createdDate) }}</span>
              </td>
              
              <!-- 删除时间列 -->
              <td class="col-deleted">
                <span class="time-text deleted-time">{{ formatDate(file.deletedDate) }}</span>
              </td>
              
              <!-- 操作列 -->
              <td class="col-actions">
                <div class="action-buttons">
                  <button 
                    class="action-btn btn-restore" 
                    @click="handleRestore(file)"
                    title="还原"
                  >
                    <span class="btn-icon">↩️</span>
                    <span class="btn-text">还原</span>
                  </button>
                  <button 
                    class="action-btn btn-delete" 
                    @click="handlePermanentDelete(file)"
                    title="彻底删除"
                  >
                    <span class="btn-icon">❌</span>
                    <span class="btn-text">彻底删除</span>
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
import { ref, onMounted } from 'vue'
import { createLogger } from '@/utils/logger'

const logger = createLogger('RecycleBinView')

// 搜索关键词
const searchKeyword = ref('')

// 回收站文件列表数据（模拟数据）
const files = ref([
  { 
    id: 1, 
    name: '旧项目文档', 
    type: 'folder', 
    size: 0, 
    createdDate: '2024-01-10',
    deletedDate: '2024-01-15' 
  },
  { 
    id: 2, 
    name: '报告草稿.pdf', 
    type: 'pdf', 
    size: 2048576, 
    createdDate: '2024-01-08',
    deletedDate: '2024-01-14' 
  },
  { 
    id: 3, 
    name: '会议记录.docx', 
    type: 'word', 
    size: 524288, 
    createdDate: '2024-01-05',
    deletedDate: '2024-01-13' 
  },
  { 
    id: 4, 
    name: '照片备份', 
    type: 'folder', 
    size: 0, 
    createdDate: '2023-12-20',
    deletedDate: '2024-01-12' 
  },
  { 
    id: 5, 
    name: '演示文稿.pptx', 
    type: 'ppt', 
    size: 5242880, 
    createdDate: '2024-01-03',
    deletedDate: '2024-01-11' 
  },
])

/**
 * 根据文件类型获取对应的图标
 * @param {string} type - 文件类型
 * @returns {string} 对应的 emoji 图标
 */
const getFileIcon = (type) => {
  const icons = {
    folder: '📁',
    pdf: '📄',
    word: '📝',
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
 * 格式化日期
 * @param {string} dateString - 日期字符串
 * @returns {string} 格式化后的日期
 */
const formatDate = (dateString) => {
  if (!dateString) return '--'
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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
 * 处理还原文件操作
 * @param {Object} file - 文件对象
 */
const handleRestore = (file) => {
  logger.info('还原文件:', file.name)
  // TODO: 实现还原接口
  alert(`还原文件：${file.name}\n（接口待实现）`)
  
  // 临时：从列表中移除（模拟还原成功）
  if (confirm(`确定要还原 "${file.name}" 吗？`)) {
    files.value = files.value.filter(f => f.id !== file.id)
  }
}

/**
 * 处理彻底删除文件操作
 * @param {Object} file - 文件对象
 */
const handlePermanentDelete = (file) => {
  logger.info('彻底删除文件:', file.name)
  // TODO: 实现彻底删除接口
  alert(`彻底删除文件：${file.name}\n（接口待实现）`)
  
  // 临时：从列表中移除（模拟删除成功）
  if (confirm(`确定要彻底删除 "${file.name}" 吗？此操作不可恢复！`)) {
    files.value = files.value.filter(f => f.id !== file.id)
  }
}

/**
 * 处理清空回收站操作
 */
const handleClearAll = () => {
  logger.info('清空回收站')
  // TODO: 实现清空回收站接口
  
  if (confirm(`确定要清空回收站吗？共 ${files.value.length} 个文件将被彻底删除，此操作不可恢复！`)) {
    files.value = []
  }
}

onMounted(() => {
  logger.info('回收站页面加载完成')
})
</script>

<style scoped>
/* 回收站容器：占满父容器高度，垂直布局 */
.recycle-bin-container {
  height: 100%; /* 继承父容器高度 */
  display: flex; /* 启用 Flexbox 布局 */
  flex-direction: column; /* 子元素垂直排列 */
}

/* 回收站头部：标题和操作按钮（固定不滚动） */
.recycle-header {
  display: flex; /* 启用 Flexbox 布局 */
  flex-direction: column; /* 垂直排列 */
  padding: 1.5rem 2rem; /* 内边距 */
  background: white; /* 白色背景 */
  border-bottom: 2px solid #f0f0f0; /* 底部边框 */
  flex-shrink: 0; /* 不允许缩小 */
  gap: 1rem; /* 上下区域间距 */
}

/* 头部上方区域：标题、注释和清空按钮 */
.header-top {
  display: flex; /* 启用 Flexbox 布局 */
  justify-content: space-between; /* 左右两端对齐 */
  align-items: center; /* 垂直居中对齐 */
}

/* 头部下方区域：搜索框 */
.header-bottom {
  width: 100%; /* 占满宽度 */
}

/* 头部左侧：标题和副标题 */
.header-left {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* 搜索框区域 */
.search-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
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
  border-color: #ff6b6b;
  box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.1);
}

.search-input::placeholder {
  color: #bbb;
}

/* 搜索按钮 */
.btn-search {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  color: white;
  padding: 0.75rem 1.5rem; /* 与浏览页面一致 */
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

/* 副标题样式 */
.subtitle {
  margin: 0; /* 清除默认外边距 */
  color: #999; /* 灰色文字 */
  font-size: 0.9rem; /* 字体大小 14.4px */
}

/* 头部右侧按钮区域 */
.header-right {
  display: flex;
  gap: 1rem;
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

/* 禁用状态 */
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 清空回收站按钮：红色警告样式 */
.btn-clear-all {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%); /* 红色渐变 */
  color: white; /* 白色文字 */
}

/* 清空按钮悬停效果 */
.btn-clear-all:hover:not(:disabled) {
  transform: translateY(-2px); /* 向上移动 2px */
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4); /* 红色阴影 */
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

/* 空状态主文字 */
.empty-state p {
  font-size: 1.1rem; /* 字体大小 17.6px */
  margin: 0.5rem 0; /* 上下外边距 8px */
}

/* 空状态提示文字 */
.empty-hint {
  font-size: 0.9rem !important; /* 字体大小 14.4px */
  color: #bbb !important; /* 更浅的灰色 */
}

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
  min-width: 800px; /* 最小宽度，防止过度压缩 */
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

/* 文件图标 */
.file-icon {
  font-size: 2rem; /* 图标大小 32px */
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

/* 文件名称 */
.file-name {
  font-weight: 500; /* 字体粗细：中等 */
  color: #333; /* 深灰色文字 */
  word-break: break-word; /* 长单词换行 */
}

/* 文件元信息容器（类型标签 + 大小）*/
.file-meta-info {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-wrap: wrap;
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

/* 内联大小文本（默认隐藏，在特定断点显示）*/
.file-size-inline {
  display: none; /* 默认隐藏 */
  font-size: 0.75rem;
  color: #999;
  white-space: nowrap;
}

/* 大小列 */
.col-size {
  width: 120px; /* 固定宽度 */
  white-space: nowrap; /* 不换行 */
}

/* 大小文本 */
.size-text {
  color: #666; /* 灰色文字 */
  font-size: 0.9rem; /* 字体大小 14.4px */
}

/* 时间列 */
.col-created,
.col-deleted {
  width: 140px; /* 固定宽度 */
  white-space: nowrap; /* 不换行 */
}

/* 时间文本 */
.time-text {
  color: #666; /* 灰色文字 */
  font-size: 0.9rem; /* 字体大小 14.4px */
}

/* 删除时间特殊样式 */
.deleted-time {
  color: #ff6b6b; /* 红色文字 */
}

/* 操作列 */
.col-actions {
  width: 100px; /* 缩小宽度，适应纵向按钮 */
  white-space: nowrap; /* 不换行 */
}

/* 操作按钮组 */
.action-buttons {
  display: flex;
  flex-direction: column; /* 纵向排列 */
  gap: 0.4rem; /* 按钮间距 */
}

/* 操作按钮 */
.action-btn {
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

/* 还原按钮 */
.btn-restore {
  background: #e8f5e9; /* 浅绿色背景 */
  color: #2e7d32; /* 深绿色文字 */
}

.btn-restore:hover {
  background: #c8e6c9; /* 稍深的绿色 */
  transform: translateY(-1px);
}

/* 彻底删除按钮 */
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

/* 移动端响应式适配（550px < 屏幕宽度 ≤ 768px） */
@media (max-width: 768px) and (min-width: 551px) {
  /* 头部保持上下结构 */
  .recycle-header {
    flex-direction: column; /* 垂直排列，保持上下结构 */
    padding: 1rem 1.5rem; /* 内边距与浏览/传输保持一致 */
    gap: 1rem;
  }

  /* 头部上方区域：标题和清空按钮 */
  .header-top {
    width: 100%; /* 占满宽度 */
  }

  /* 头部下方区域：搜索框 */
  .header-bottom {
    width: 100%; /* 占满宽度 */
  }

  /* 头部左侧区域 */
  .header-left {
    flex: 1; /* 占据剩余空间 */
    min-width: 0; /* 允许收缩 */
  }

  /* 搜索框区域调整 */
  .search-box {
    width: 100%;
    flex-direction: row;
    margin-top: 0;
  }

  .search-input {
    flex: 1;
    min-width: auto;
    padding: 0.5rem 0.75rem;
    font-size: 0.85rem;
  }

  .btn-search {
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
    flex-shrink: 0;
  }

  /* 标题大小与浏览/传输保持一致 */
  .title {
    font-size: 1.5rem; /* 增大标题 */
  }

  /* 副标题大小调整 */
  .subtitle {
    font-size: 0.85rem; /* 增大副标题 */
  }

  /* 头部右侧按钮区域 */
  .header-right {
    flex-shrink: 0; /* 不允许缩小 */
  }

  /* 清空按钮大小调整 */
  .btn-clear-all {
    padding: 0.625rem 1.25rem; /* 与浏览/传输按钮一致 */
    font-size: 0.95rem; /* 增大字体 */
  }

  /* 缩小列表内边距 */
  .file-list {
    padding: 1rem; /* 与浏览/传输保持一致 */
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
    padding: 0.75rem 1rem; /* 与浏览/传输保持一致 */
  }

  /* 显示创建时间列 */
  .col-created {
    display: table-cell;
  }

  /* 隐藏大小列（大小已显示在名称列中）*/
  .col-size {
    display: none;
  }

  /* 调整图标列宽度 */
  .col-icon {
    width: 45px; /* 稍微增大 */
  }

  /* 文件图标大小 */
  .file-icon {
    font-size: 1.75rem; /* 增大图标 */
  }

  /* 调整名称列 */
  .col-name {
    min-width: auto; /* 移除最小宽度 */
    max-width: 110px; /* 适当增加宽度 */
  }

  /* 文件名大小调整 */
  .file-name {
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

  /* 显示内联大小文本（与768-930px一致）*/
  .file-size-inline {
    display: inline; /* 显示 */
    font-size: 0.75rem;
    color: #999;
    white-space: nowrap;
  }

  /* 调整删除时间列 */
  .col-deleted {
    width: auto; /* 自动宽度 */
    min-width: 80px;
    max-width: 90px;
  }

  /* 时间文本大小调整 */
  .time-text {
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

  .action-btn {
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
}

/* 超小屏幕（屏幕宽度 ≤ 550px） */
@media (max-width: 550px) {
  /* 头部保持上下结构 */
  .recycle-header {
    flex-direction: column; /* 垂直排列，保持上下结构 */
    padding: 0.75rem 1rem;
    gap: 0.75rem;
  }

  /* 头部上方区域：标题和清空按钮 */
  .header-top {
    width: 100%;
  }

  /* 头部下方区域：搜索框 */
  .header-bottom {
    width: 100%;
  }

  /* 头部左侧区域 */
  .header-left {
    flex: 1;
    min-width: 0;
  }

  /* 搜索框区域调整 */
  .search-box {
    width: 100%;
    flex-direction: row;
    margin-top: 0;
  }

  .search-input {
    flex: 1;
    min-width: auto;
    padding: 0.4rem 0.6rem;
    font-size: 0.8rem;
  }

  .btn-search {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
    flex-shrink: 0;
  }

  /* 标题大小 */
  .title {
    font-size: 1.25rem;
  }

  /* 副标题大小调整 */
  .subtitle {
    font-size: 0.75rem;
  }

  /* 头部右侧按钮区域 */
  .header-right {
    flex-shrink: 0;
  }

  /* 清空按钮大小调整 */
  .btn-clear-all {
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
  }

  /* 缩小列表内边距 */
  .file-list {
    padding: 0.75rem;
  }

  /* 表格包装器 */
  .table-wrapper {
    border-radius: 6px;
    box-shadow: 0 1px 6px rgba(0, 0, 0, 0.08);
  }

  /* 缩小表格最小宽度，允许压缩 */
  .file-table {
    min-width: auto;
    width: 100%;
  }

  /* 缩小表格单元格内边距 */
  .file-table th,
  .file-table td {
    padding: 0.6rem 0.75rem;
  }

  /* 隐藏创建时间列 */
  .col-created {
    display: none;
  }

  /* 隐藏大小列（大小已显示在名称列中）*/
  .col-size {
    display: none;
  }

  /* 调整图标列宽度 */
  .col-icon {
    width: 40px;
  }

  /* 文件图标大小 */
  .file-icon {
    font-size: 1.5rem;
  }

  /* 调整名称列 */
  .col-name {
    min-width: auto;
    max-width: 100px;
  }

  /* 文件名大小调整 */
  .file-name {
    font-size: 0.8rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* 类型标签大小调整 */
  .file-type-badge {
    font-size: 0.65rem;
    padding: 0.1rem 0.3rem;
  }

  /* 显示内联大小文本（与768-930px一致）*/
  .file-size-inline {
    display: inline;
    font-size: 0.7rem;
    color: #999;
    white-space: nowrap;
  }

  /* 调整删除时间列 */
  .col-deleted {
    width: auto;
    min-width: 70px;
    max-width: 80px;
  }

  /* 时间文本大小调整 */
  .time-text {
    font-size: 0.75rem;
  }

  /* 调整操作列 */
  .col-actions {
    width: auto;
    min-width: 90px;
  }

  /* 操作按钮改为纵向排列 */
  .action-buttons {
    flex-direction: column;
    gap: 0.3rem;
  }

  .action-btn {
    width: 100%;
    justify-content: center;
    padding: 0.4rem 0.6rem;
    font-size: 0.75rem;
    white-space: nowrap;
  }

  /* 显示按钮文字 */
  .btn-text {
    display: inline;
  }

  .btn-icon {
    font-size: 0.9rem;
  }

  /* 表头字体大小调整 */
  .file-table th {
    font-size: 0.75rem;
    padding: 0.6rem 0.75rem;
  }

  /* 表体单元格内边距 */
  .file-table td {
    padding: 0.6rem 0.75rem;
  }
}

/* ========== 响应式断点（与浏览界面一致）========== */

/* 中等屏幕（930px < 宽度 ≤ 1100px）：隐藏大小列，显示创建时间和删除时间列 */
@media (max-width: 1100px) and (min-width: 931px) {
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

  /* 隐藏大小列 */
  .col-size {
    display: none;
  }

  /* 文件元信息容器（类型标签 + 大小）*/
  .file-meta-info {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    flex-wrap: wrap;
  }

  /* 调整图标列宽度（比例 0.5/6.5 ≈ 7.69%）*/
  .col-icon {
    width: 8%;
    min-width: 45px;
  }

  /* 文件图标大小 */
  .file-icon {
    font-size: 1.85rem;
  }

  /* 调整名称列（比例 2/6.5 ≈ 30.77%）*/
  .col-name {
    width: 31%;
    min-width: 120px;
  }

  /* 文件名大小调整 */
  .file-name {
    font-size: 0.95rem;
  }

  /* 类型标签大小调整 */
  .file-type-badge {
    font-size: 0.75rem;
  }

  /* 显示内联大小文本（与<930px一致）*/
  .file-size-inline {
    display: inline;
    font-size: 0.75rem;
    color: #999;
    white-space: nowrap;
  }

  /* 调整创建时间列（与删除时间列保持一致，比例 1.5/6.5 ≈ 23.08%）*/
  .col-created {
    width: 23%;
    min-width: 120px;
  }

  /* 调整删除时间列（比例 1.5/6.5 ≈ 23.08%）*/
  .col-deleted {
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

/* 窄屏（768px < 宽度 ≤ 930px）：与550-768px样式一致 */
@media (max-width: 930px) and (min-width: 769px) {
  /* 头部保持上下结构 */
  .recycle-header {
    flex-direction: column; /* 垂直排列，保持上下结构 */
    padding: 1rem 1.5rem; /* 内边距与浏览/传输保持一致 */
    gap: 1rem;
  }

  /* 头部上方区域：标题和清空按钮 */
  .header-top {
    width: 100%; /* 占满宽度 */
  }

  /* 头部下方区域：搜索框 */
  .header-bottom {
    width: 100%; /* 占满宽度 */
  }

  /* 头部左侧区域 */
  .header-left {
    flex: 1; /* 占据剩余空间 */
    min-width: 0; /* 允许收缩 */
  }

  /* 搜索框区域调整 */
  .search-box {
    width: 100%;
    flex-direction: row;
    margin-top: 0;
  }

  .search-input {
    flex: 1;
    min-width: auto;
    padding: 0.5rem 0.75rem;
    font-size: 0.85rem;
  }

  .btn-search {
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
    flex-shrink: 0;
  }

  /* 标题大小与浏览/传输保持一致 */
  .title {
    font-size: 1.5rem; /* 增大标题 */
  }

  /* 副标题大小调整 */
  .subtitle {
    font-size: 0.85rem; /* 增大副标题 */
  }

  /* 头部右侧按钮区域 */
  .header-right {
    flex-shrink: 0; /* 不允许缩小 */
  }

  /* 清空按钮大小调整 */
  .btn-clear-all {
    padding: 0.625rem 1.25rem; /* 与浏览/传输按钮一致 */
    font-size: 0.95rem; /* 增大字体 */
  }

  /* 缩小列表内边距 */
  .file-list {
    padding: 1rem; /* 与浏览/传输保持一致 */
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
    padding: 0.75rem 1rem; /* 与浏览/传输保持一致 */
  }

  /* 显示创建时间列 */
  .col-created {
    display: table-cell;
  }

  /* 隐藏大小列（大小已显示在名称列中）*/
  .col-size {
    display: none;
  }

  /* 调整图标列宽度（10%）*/
  .col-icon {
    width: 10%;
    min-width: 40px;
  }

  /* 文件图标大小 */
  .file-icon {
    font-size: 1.6rem;
  }

  /* 调整名称列（40%）*/
  .col-name {
    width: 40%;
    min-width: 100px;
    max-width: none;
  }

  /* 文件名大小调整 */
  .file-name {
    font-size: 0.85rem;
  }

  /* 类型标签大小调整 */
  .file-type-badge {
    font-size: 0.65rem;
    padding: 0.1rem 0.3rem;
  }

  /* 显示内联大小文本（与550-768px一致）*/
  .file-size-inline {
    display: inline; /* 显示 */
    font-size: 0.75rem;
    color: #999;
    white-space: nowrap;
  }

  /* 调整创建时间列（与删除时间列保持一致，20%）*/
  .col-created {
    width: 20%;
    min-width: 100px;
  }

  /* 调整删除时间列（与创建时间列保持一致，20%）*/
  .col-deleted {
    width: 20%;
    min-width: 100px;
  }

  /* 时间文本大小调整 */
  .time-text {
    font-size: 0.8rem;
  }

  /* 调整操作列（30%）*/
  .col-actions {
    width: 30%;
    min-width: 90px;
  }

  /* 操作按钮改为纵向排列 */
  .action-buttons {
    flex-direction: column; /* 纵向排列 */
    gap: 0.4rem;
  }

  .action-btn {
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
}

/* 移动端列表视图（550px < 屏幕宽度 ≤ 768px）：重新分配列宽比例 */
@media (max-width: 768px) and (min-width: 551px) {
  /* 图标列（比例 0.5/5 = 10%）*/
  .col-icon {
    width: 10%;
    min-width: 40px;
  }

  /* 文件图标大小 */
  .file-icon {
    font-size: 1.6rem;
  }

  /* 名称列（比例 2/5 = 40%）*/
  .col-name {
    width: 40%;
    min-width: 100px;
    max-width: none;
  }

  /* 文件名大小调整 */
  .file-name {
    font-size: 0.85rem;
  }

  /* 类型标签大小调整 */
  .file-type-badge {
    font-size: 0.65rem;
    padding: 0.1rem 0.3rem;
  }

  /* 显示内联大小文本（与768-930px一致）*/
  .file-size-inline {
    display: inline; /* 显示 */
    font-size: 0.75rem;
    color: #999;
    white-space: nowrap;
  }

  /* 隐藏大小列（大小已显示在名称列中）*/
  .col-size {
    display: none;
  }

  /* 操作列（比例 1.5/5 = 30%）*/
  .col-actions {
    width: 30%;
    min-width: 90px;
  }

  /* 操作按钮调整 */
  .action-btn {
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
}

/* 超小屏幕列表视图（屏幕宽度 ≤ 550px）：进一步压缩 */
@media (max-width: 550px) {
  /* 图标列 */
  .col-icon {
    width: 12%;
    min-width: 35px;
  }

  /* 文件图标大小 */
  .file-icon {
    font-size: 1.4rem;
  }

  /* 名称列 */
  .col-name {
    width: 45%;
    min-width: 80px;
    max-width: none;
  }

  /* 文件名大小调整 */
  .file-name {
    font-size: 0.8rem;
  }

  /* 类型标签大小调整 */
  .file-type-badge {
    font-size: 0.6rem;
    padding: 0.08rem 0.25rem;
  }

  /* 显示内联大小文本 */
  .file-size-inline {
    display: inline;
    font-size: 0.7rem;
    color: #999;
    white-space: nowrap;
  }

  /* 隐藏大小列 */
  .col-size {
    display: none;
  }

  /* 操作列 */
  .col-actions {
    width: 43%;
    min-width: 80px;
  }

  /* 操作按钮调整 */
  .action-btn {
    padding: 0.35rem 0.5rem;
    font-size: 0.75rem;
  }

  .btn-icon {
    font-size: 0.85rem;
  }

  /* 表头字体大小调整 */
  .file-table th {
    font-size: 0.75rem;
    padding: 0.5rem 0.6rem;
  }

  /* 表体单元格内边距 */
  .file-table td {
    padding: 0.5rem 0.6rem;
  }
}
</style>
