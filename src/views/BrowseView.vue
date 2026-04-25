<template>
  <!-- 文件浏览主容器 -->
  <div class="browse-container">
    <!-- 浏览页面头部：包含标题和工具栏 -->
    <div class="browse-header">
      <!-- 页面标题 -->
      <h2 class="title">文件浏览</h2>
      <!-- 工具栏按钮组 -->
      <div class="toolbar">
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

    <!-- 文件列表区域 -->
    <div class="file-list">
      <!-- 空状态提示：当没有文件时显示 -->
      <div v-if="files.length === 0" class="empty-state">
        <div class="empty-icon">📂</div>
        <p>暂无文件</p>
      </div>

      <!-- 文件网格布局：当有文件时显示 -->
      <div v-else class="file-grid">
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
    </div>
  </div>
</template>


<script setup>
import { ref } from 'vue'

// 文件列表数据（模拟数据）
const files = ref([
  { id: 1, name: '工作文档', type: 'folder', size: 0, date: '2024-01-15' },
  { id: 2, name: '项目资料', type: 'folder', size: 0, date: '2024-01-14' },
  { id: 3, name: '报告.pdf', type: 'pdf', size: 2048576, date: '2024-01-13' },
  { id: 4, name: '演示文稿.pptx', type: 'ppt', size: 5242880, date: '2024-01-12' },
  { id: 5, name: '数据表格.xlsx', type: 'excel', size: 1048576, date: '2024-01-11' },
  { id: 6, name: '照片.jpg', type: 'image', size: 3145728, date: '2024-01-10' },
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
  display: flex; /* 启用 Flexbox 布局 */
  justify-content: space-between; /* 左右两端对齐 */
  align-items: center; /* 垂直居中对齐 */
  padding: 1.5rem 2rem; /* 内边距 */
  background: white; /* 白色背景 */
  border-bottom: 2px solid #f0f0f0; /* 底部边框 */
  flex-shrink: 0; /* 不允许缩小 */
}

/* 页面标题样式 */
.title {
  margin: 0; /* 清除默认外边距 */
  color: #333; /* 深灰色文字 */
  font-size: 1.75rem; /* 字体大小 28px */
  font-weight: 600; /* 字体粗细：半粗体 */
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
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); /* 自动填充，最小 250px，最大均分 */
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

/* 移动端响应式适配（屏幕宽度 ≤ 768px） */
@media (max-width: 768px) {
  /* 头部改为垂直布局 */
  .browse-header {
    flex-direction: column; /* 子元素垂直排列 */
    align-items: flex-start; /* 左对齐 */
    gap: 1rem; /* 元素间距 16px */
  }

  /* 工具栏占满宽度 */
  .toolbar {
    width: 100%; /* 宽度 100% */
  }

  /* 按钮平均分配宽度 */
  .btn {
    flex: 1; /* 平均分配宽度 */
    justify-content: center; /* 水平居中对齐 */
  }

  /* 缩小文件网格最小宽度 */
  .file-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); /* 最小 150px */
    gap: 1rem; /* 间距缩小为 16px */
  }

  /* 移动端始终显示操作按钮 */
  .file-actions {
    opacity: 1; /* 透明度设为 1（始终显示） */
  }
}
</style>
