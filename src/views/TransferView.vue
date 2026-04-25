<template>
  <!-- 传输记录主容器 -->
  <div class="transfer-container">
    <!-- 传输页面头部：标题和筛选标签（固定不滚动） -->
    <div class="transfer-header">
      <!-- 页面标题 -->
      <h2 class="title">传输记录</h2>
      <!-- 筛选标签按钮组 -->
      <div class="filter-tabs">
        <!-- 全部记录标签 -->
        <button
            class="tab-btn"
            :class="{ active: filter === 'all' }"
            @click="filter = 'all'"
        > <!-- 动态绑定激活状态 点击切换筛选条件 -->
          全部
        </button>
        <!-- 上传中标签 -->
        <button
            class="tab-btn"
            :class="{ active: filter === 'uploading' }"
            @click="filter = 'uploading'"
        >
          上传中
        </button>
        <!-- 下载中标签 -->
        <button
            class="tab-btn"
            :class="{ active: filter === 'downloading' }"
            @click="filter = 'downloading'"
        >
          下载中
        </button>
        <!-- 已完成标签 -->
        <button
            class="tab-btn"
            :class="{ active: filter === 'completed' }"
            @click="filter = 'completed'"
        >
          已完成
        </button>
      </div>
    </div>

    <!-- 传输记录列表区域（可滚动） -->
    <div class="transfer-list">
      <!-- 空状态提示：当没有记录时显示 -->
      <div v-if="filteredRecords.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <p>暂无传输记录</p>
      </div>

      <!-- 记录列表：当有记录时显示 -->
      <div v-else class="records">
        <!-- 遍历渲染每条传输记录 -->
        <div
            v-for="record in filteredRecords"
            :key="record.id"
            class="record-item"
        >
          <!-- 记录图标：根据类型显示上传或下载图标 -->
          <div class="record-icon">
            {{ record.type === 'upload' ? '⬆️' : '⬇️' }}
          </div>
          <!-- 记录信息：文件名和元数据 -->
          <div class="record-info">
            <p class="record-name">{{ record.fileName }}</p>
            <p class="record-meta">
              {{ formatFileSize(record.size) }} · {{ record.time }}
            </p>
          </div>
          <!-- 记录状态：进度条或状态徽章 -->
          <div class="record-status">
            <!-- 进行中状态：显示进度条 -->
            <div v-if="record.status === 'uploading' || record.status === 'downloading'" class="progress-wrapper">
              <div class="progress-bar">
                <!-- 进度条填充：宽度根据进度动态变化 -->
                <div
                    class="progress-fill"
                    :style="{ width: record.progress + '%' }"
                ></div>
              </div>
              <span class="progress-text">{{ record.progress }}%</span>
            </div>
            <!-- 完成/失败状态：显示状态徽章 -->
            <span v-else class="status-badge" :class="record.status">
              {{ getStatusText(record.status) }}
            </span>
          </div>
          <!-- 记录操作按钮：重试或删除 -->
          <div class="record-actions">
            <!-- 失败记录显示重试按钮 -->
            <button
                v-if="record.status === 'failed'"
                class="retry-btn"
                @click="handleRetry(record)"
            >
              重试
            </button>
            <!-- 完成记录显示删除按钮 -->
            <button
                v-if="record.status === 'completed'"
                class="delete-btn"
                @click="handleDelete(record)"
            >
              删除记录
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup>
import { ref, computed } from 'vue'

// 当前筛选条件（默认显示全部）
const filter = ref('all')

// 传输记录数据（模拟数据）
const records = ref([
  { id: 1, fileName: '项目文档.pdf', type: 'upload', size: 5242880, status: 'completed', progress: 100, time: '2024-01-15 14:30' },
  { id: 2, fileName: '设计稿.psd', type: 'upload', size: 52428800, status: 'uploading', progress: 65, time: '2024-01-15 14:25' },
  { id: 3, fileName: '会议记录.docx', type: 'download', size: 1048576, status: 'completed', progress: 100, time: '2024-01-15 13:20' },
  { id: 4, fileName: '视频教程.mp4', type: 'download', size: 104857600, status: 'downloading', progress: 42, time: '2024-01-15 13:15' },
  { id: 5, fileName: '数据包.zip', type: 'upload', size: 20971520, status: 'failed', progress: 78, time: '2024-01-15 12:10' },
  { id: 6, fileName: '图片素材.jpg', type: 'download', size: 3145728, status: 'completed', progress: 100, time: '2024-01-15 11:05' },
])

/**
 * 计算属性：根据筛选条件过滤记录
 * @returns {Array} 过滤后的记录数组
 */
const filteredRecords = computed(() => {
  if (filter.value === 'all') {
    return records.value
  }
  return records.value.filter(record => record.status === filter.value)
})

/**
 * 格式化文件大小（字节转换为可读格式）
 * @param {number} bytes - 文件大小（字节）
 * @returns {string} 格式化后的文件大小字符串
 */
const formatFileSize = (bytes) => {
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

/**
 * 获取状态文本描述
 * @param {string} status - 状态值
 * @returns {string} 状态文本
 */
const getStatusText = (status) => {
  const statusMap = {
    completed: '✓ 已完成',
    failed: '✗ 失败',
    paused: '⏸ 已暂停'
  }
  return statusMap[status] || status
}

/**
 * 处理重试操作（重新开始传输）
 * @param {Object} record - 记录对象
 */
const handleRetry = (record) => {
  // 根据类型设置对应的传输状态
  record.status = record.type === 'upload' ? 'uploading' : 'downloading'
  record.progress = 0 // 重置进度为 0
  alert(`重新开始传输：${record.fileName}`)
}

/**
 * 处理删除记录操作
 * @param {Object} record - 记录对象
 */
const handleDelete = (record) => {
  if (confirm(`确定要删除这条记录吗？`)) {
    // 从列表中过滤掉被删除的记录
    records.value = records.value.filter(r => r.id !== record.id)
  }
}
</script>

<style scoped>
/* 传输容器：占满父容器高度，垂直布局 */
.transfer-container {
  height: 100%; /* 继承父容器高度 */
  display: flex; /* 启用 Flexbox 布局 */
  flex-direction: column; /* 子元素垂直排列 */
}

/* 传输页面头部：标题和筛选标签（固定不滚动） */
.transfer-header {
  padding: 1.5rem 2rem; /* 内边距 */
  background: white; /* 白色背景 */
  border-bottom: 2px solid #f0f0f0; /* 底部边框 */
  flex-shrink: 0; /* 不允许缩小 */
}

/* 页面标题样式 */
.title {
  margin: 0 0 1rem 0; /* 底部外边距 16px */
  color: #333; /* 深灰色文字 */
  font-size: 1.75rem; /* 字体大小 28px */
  font-weight: 600; /* 字体粗细：半粗体 */
}

/* 筛选标签按钮组 */
.filter-tabs {
  display: flex; /* 启用 Flexbox 布局 */
  gap: 0.5rem; /* 标签间距 8px */
  flex-wrap: wrap; /* 允许换行 */
}

/* 标签按钮样式 */
.tab-btn {
  padding: 0.625rem 1.25rem; /* 上下 10px，左右 20px 内边距 */
  border: 2px solid #e0e0e0; /* 2px 浅灰色边框 */
  background: white; /* 白色背景 */
  border-radius: 8px; /* 圆角 8px */
  font-size: 0.9rem; /* 字体大小 14.4px */
  font-weight: 500; /* 字体粗细：中等 */
  cursor: pointer; /* 鼠标悬停时显示手型光标 */
  transition: all 0.3s ease; /* 所有属性变化时的过渡动画 */
  color: #666; /* 灰色文字 */
}

/* 标签按钮悬停效果 */
.tab-btn:hover {
  border-color: #667eea; /* 边框变为紫色 */
  color: #667eea; /* 文字变为紫色 */
}

/* 标签按钮激活状态 */
.tab-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); /* 紫色渐变背景 */
  color: white; /* 白色文字 */
  border-color: transparent; /* 透明边框 */
}

/* 传输记录列表区域：占据剩余空间，可滚动 */
.transfer-list {
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

/* 记录列表容器：垂直排列 */
.records {
  display: flex; /* 启用 Flexbox 布局 */
  flex-direction: column; /* 子元素垂直排列 */
  gap: 1rem; /* 记录间距 16px */
}

/* 单条记录项卡片 */
.record-item {
  background: white; /* 白色背景 */
  border: 2px solid #f0f0f0; /* 2px 浅灰色边框 */
  border-radius: 12px; /* 圆角 12px */
  padding: 1.25rem; /* 四周 20px 内边距 */
  display: flex; /* 启用 Flexbox 布局 */
  align-items: center; /* 垂直居中对齐 */
  gap: 1rem; /* 元素间距 16px */
  transition: all 0.3s ease; /* 所有属性变化时的过渡动画 */
}

/* 记录项悬停效果 */
.record-item:hover {
  border-color: #667eea; /* 边框变为紫色 */
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1); /* 轻微紫色阴影 */
}

/* 记录图标（上传/下载） */
.record-icon {
  font-size: 2rem; /* 图标大小 32px */
  flex-shrink: 0; /* 不允许缩小 */
}

/* 记录信息区域：占据剩余空间 */
.record-info {
  flex: 1; /* 占据剩余空间 */
  min-width: 0; /* 允许内容收缩 */
}

/* 文件名称 */
.record-name {
  margin: 0 0 0.25rem 0; /* 底部外边距 4px */
  color: #333; /* 深灰色文字 */
  font-weight: 600; /* 字体粗细：半粗体 */
  font-size: 1rem; /* 字体大小 16px */
  white-space: nowrap; /* 不换行 */
  overflow: hidden; /* 隐藏溢出内容 */
  text-overflow: ellipsis; /* 显示省略号 */
}

/* 记录元数据（大小和时间） */
.record-meta {
  margin: 0; /* 清除默认外边距 */
  color: #999; /* 灰色文字 */
  font-size: 0.875rem; /* 字体大小 14px */
}

/* 记录状态区域：固定最小宽度 */
.record-status {
  flex-shrink: 0; /* 不允许缩小 */
  min-width: 150px; /* 最小宽度 150px */
}

/* 进度条容器 */
.progress-wrapper {
  display: flex; /* 启用 Flexbox 布局 */
  align-items: center; /* 垂直居中对齐 */
  gap: 0.75rem; /* 元素间距 12px */
}

/* 进度条轨道 */
.progress-bar {
  flex: 1; /* 占据剩余空间 */
  height: 8px; /* 高度 8px */
  background: #f0f0f0; /* 浅灰色背景 */
  border-radius: 4px; /* 圆角 4px */
  overflow: hidden; /* 隐藏溢出内容 */
}

/* 进度条填充部分 */
.progress-fill {
  height: 100%; /* 高度 100% */
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); /* 紫色渐变 */
  transition: width 0.3s ease; /* 宽度变化的过渡动画 */
  border-radius: 4px; /* 圆角 4px */
}

/* 进度百分比文字 */
.progress-text {
  font-size: 0.875rem; /* 字体大小 14px */
  color: #667eea; /* 紫色文字 */
  font-weight: 600; /* 字体粗细：半粗体 */
  min-width: 40px; /* 最小宽度 40px */
  text-align: right; /* 右对齐 */
}

/* 状态徽章（完成/失败/暂停） */
.status-badge {
  padding: 0.375rem 0.75rem; /* 上下 6px，左右 12px 内边距 */
  border-radius: 6px; /* 圆角 6px */
  font-size: 0.875rem; /* 字体大小 14px */
  font-weight: 600; /* 字体粗细：半粗体 */
  display: inline-block; /* 行内块元素 */
}

/* 完成状态徽章：绿色 */
.status-badge.completed {
  background: #f6ffed; /* 浅绿色背景 */
  color: #52c41a; /* 绿色文字 */
}

/* 失败状态徽章：红色 */
.status-badge.failed {
  background: #fff2f0; /* 浅红色背景 */
  color: #ff4d4f; /* 红色文字 */
}

/* 暂停状态徽章：橙色 */
.status-badge.paused {
  background: #fff7e6; /* 浅橙色背景 */
  color: #fa8c16; /* 橙色文字 */
}

/* 记录操作按钮区域 */
.record-actions {
  flex-shrink: 0; /* 不允许缩小 */
}

/* 重试和删除按钮通用样式 */
.retry-btn,
.delete-btn {
  padding: 0.5rem 1rem; /* 上下 8px，左右 16px 内边距 */
  border: none; /* 无边框 */
  border-radius: 6px; /* 圆角 6px */
  font-size: 0.875rem; /* 字体大小 14px */
  font-weight: 500; /* 字体粗细：中等 */
  cursor: pointer; /* 鼠标悬停时显示手型光标 */
  transition: all 0.3s ease; /* 所有属性变化时的过渡动画 */
}

/* 重试按钮：紫色背景 */
.retry-btn {
  background: #667eea; /* 紫色背景 */
  color: white; /* 白色文字 */
}

/* 重试按钮悬停效果 */
.retry-btn:hover {
  background: #5568d3; /* 深紫色背景 */
  transform: translateY(-2px); /* 向上移动 2px */
}

/* 删除按钮：灰色背景 */
.delete-btn {
  background: #f0f0f0; /* 灰色背景 */
  color: #666; /* 灰色文字 */
}

/* 删除按钮悬停效果 */
.delete-btn:hover {
  background: #ff4d4f; /* 红色背景 */
  color: white; /* 白色文字 */
}

/* 移动端响应式适配（屏幕宽度 ≤ 768px） */
@media (max-width: 768px) {
  /* 记录项改为换行布局 */
  .record-item {
    flex-wrap: wrap; /* 允许换行 */
  }

  /* 状态区域占满宽度，排在第三位 */
  .record-status {
    width: 100%; /* 宽度 100% */
    order: 3; /* 排序第三 */
  }

  /* 操作按钮占满宽度，排在第四位 */
  .record-actions {
    width: 100%; /* 宽度 100% */
    order: 4; /* 排序第四 */
  }
}
</style>
