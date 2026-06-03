<template>
  <div class="dashboard-container">
    <header class="header">
      <div class="header-left">
        <!-- 用户头像 -->
        <div class="user-avatar" @click="handleAvatarClick">
          <img
              v-if="userAvatar"
              :src="userAvatar"
              alt="用户头像"
              class="avatar-img"
              @error="handleImageError"
          />
          <div v-else class="avatar-default" :style="{ backgroundColor: avatarColor }">
            {{ avatarLetter }}
          </div>
        </div>
        <h1 class="welcome-text">欢迎，{{ username }}！</h1>
      </div>
      <div class="header-right">
        <button class="btn btn-info" @click="goToProfile">
          <span class="icon">👤</span>
          个人信息
        </button>
        <button class="btn btn-logout" @click="handleLogout">
          <span class="icon">🚪</span>
          退出
        </button>
      </div>
    </header>

    <main class="main-content">
      <!-- 左侧导航栏（横屏显示，竖屏时通过手势/头像点击触发） -->
      <aside 
        class="sidebar" 
        :class="{ 'sidebar-open': sidebarOpen }"
      >
        <nav class="nav-menu">
          <button
              class="nav-item"
              :class="{ active: currentView === 'browse' }"
              @click="selectView('browse')"
          >
            <span class="nav-icon">📁</span>
            <span class="nav-text">浏览</span>
          </button>
          <button
              class="nav-item"
              :class="{ active: currentView === 'transfer' }"
              @click="selectView('transfer')"
          >
            <span class="nav-icon">📊</span>
            <span class="nav-text">传输</span>
          </button>
          <button
              class="nav-item"
              :class="{ active: currentView === 'recycle' }"
              @click="selectView('recycle')"
          >
            <span class="nav-icon">♻️</span>
            <span class="nav-text">回收站</span>
          </button>
        </nav>
      </aside>

      <!-- 侧边栏遮罩层（点击空白处关闭侧边栏） -->
      <div
          v-if="sidebarOpen"
          class="sidebar-overlay"
          @click="closeSidebar"
      ></div>

      <section class="content-area">
        <BrowseView v-if="currentView === 'browse'" />
        <TransferView v-if="currentView === 'transfer'" />
        <RecycleBinView v-if="currentView === 'recycle'" />
      </section>
    </main>



    <div v-if="showInfoModal" class="modal-overlay" @click="closeUserInfo">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>个人信息</h2>
          <button class="close-btn" @click="closeUserInfo">×</button>
        </div>
        <div class="modal-body">
          <div class="info-item">
            <label>用户名：</label>
            <span>{{ username }}</span>
          </div>
          <div class="info-item">
            <label>账号状态：</label>
            <span class="status-active">正常</span>
          </div>
          <div class="info-item">
            <label>注册时间：</label>
            <span>2024-01-01</span>
          </div>
          <div class="info-item">
            <label>存储空间：</label>
            <span>5.2 GB / 10 GB</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, onMounted, computed, onUnmounted, onActivated} from 'vue'
import { useRouter, onBeforeRouteUpdate } from 'vue-router'
import BrowseView from './BrowseView.vue'
import TransferView from './TransferView.vue'
import RecycleBinView from './RecycleBinView.vue'
import { getUserInfo, clearAuthInfo, getToken, resetUserInfo } from '@/utils/auth'
import { createLogger } from '@/utils/logger'
import { getFullAvatarUrl, loadAuthenticatedImage, clearUserInfoCache, getCachedUserInfo } from '@/utils/userInfo'
import { clearCurrentNodeId } from '@/utils/directory'

const logger = createLogger('DashboardView')

const router = useRouter()
const currentView = ref('browse')
const showInfoModal = ref(false)
const userAvatar = ref('')
const sidebarOpen = ref(false)

/**
 * 响应式变量：用于触发重新渲染
 */
const refreshTrigger = ref(0)

/**
 * 获取用户名（每次访问都从缓存中实时读取）
 */
const getUsername = () => {
  // ✅ 通过访问 trigger 来强制 Vue 追踪依赖
  void refreshTrigger.value
  
  const cachedUserInfo = getCachedUserInfo()
  return cachedUserInfo?.nickname || '用户'
}

/**
 * 计算属性：用户名（自动响应缓存变化）
 */
const username = computed(() => getUsername())

/**
 * 刷新用户名显示（触发重新计算）
 */
const refreshUsername = () => {
  refreshTrigger.value++
  logger.info('刷新用户名显示')
}

/**
 * 更新用户名（从后端获取最新数据并刷新显示）
 */
const updateUsername = async () => {
  try {
    // ✅ 强制从后端获取最新用户信息
    await getUserInfo(true)
    // 获取成功后，触发重新读取缓存
    refreshUsername()
  } catch (error) {
    logger.error('获取用户信息失败:', error)
  }
}

/**
 * 处理头像点击事件（竖屏时打开侧边栏）
 */
const handleAvatarClick = () => {
  const windowWidth = window.innerWidth
  logger.info('头像被点击', { windowWidth, isMobile: windowWidth <= 768 })
  
  // 仅在竖屏（移动端）模式下生效
  if (windowWidth <= 768) {
    openSidebar()
    logger.info('竖屏模式：已打开侧边栏')
  } else {
    logger.debug('横屏模式：头像被点击（不执行操作）')
  }
}

/**
 * 计算属性：获取头像显示的字母（昵称首字符）
 */
const avatarLetter = computed(() => {
  const name = username.value
  if (!name) return 'U'
  return name.charAt(0).toUpperCase()
})

/**
 * 计算属性：根据用户名生成固定的头像背景色
 */
const avatarColor = computed(() => {
  const colors = [
    '#667eea', '#764ba2', '#f093fb', '#f5576c',
    '#4facfe', '#00f2fe', '#43e97b', '#fa709a',
    '#fee140', '#30cfd0', '#a8edea', '#ff9a9e'
  ]
  
  const name = username.value
  if (!name) return colors[0]

  // 根据用户名的字符编码总和选择颜色
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
})

/**
 * 选择视图并关闭侧边栏
 */
const selectView = (view) => {
  currentView.value = view
  sidebarOpen.value = false
}

/**
 * 打开侧边栏
 */
const openSidebar = () => {
  sidebarOpen.value = true
}

/**
 * 关闭侧边栏
 */
const closeSidebar = () => {
  sidebarOpen.value = false
}

// 触摸相关状态
let touchStartX = 0
let touchEndX = 0



/**
 * 处理触摸开始事件
 */
const handleTouchStart = (e) => {
  touchStartX = e.touches[0].clientX
}

/**
 * 处理触摸结束事件（检测从左向右滑动）
 */
const handleTouchEnd = (e) => {
  touchEndX = e.changedTouches[0].clientX
  handleSwipeGesture()
}

/**
 * 处理滑动手势
 */
const handleSwipeGesture = () => {
  const swipeDistance = touchEndX - touchStartX

  // 从左向右滑动超过 50px 且起始位置在左边缘 30px 内
  if (swipeDistance > 50 && touchStartX < 30) {
    openSidebar()
  }

  // 从右向左滑动超过 50px 时关闭侧边栏
  if (swipeDistance < -50 && sidebarOpen.value) {
    closeSidebar()
  }
}

/**
 * 跳转到个人信息编辑页面
 */
const goToProfile = () => {
  router.push('/profile')
}

const closeUserInfo = () => {
  showInfoModal.value = false
}

const handleImageError = () => {
  logger.warn('头像加载失败，使用默认头像')
  userAvatar.value = ''  // 清空头像，自动回退到默认头像
}

const handleLogout = () => {
  if (confirm('确定要退出登录吗？')) {
    clearAuthInfo()
    resetUserInfo(null)  // 重置用户信息，确保完全清除
    clearUserInfoCache()  // 清除用户信息缓存（包括头像）
    clearCurrentNodeId()  // ✅ 清除 currentNodeId（会话级变量）
    router.push('/login')
  }
}

onMounted(async () => {
  const userInfo = getUserInfo()
  if (!userInfo) {
    router.push('/login')
    return
  }
  
  // ✅ 初始化用户名（从后端获取最新数据）
  await updateUsername()
  
  // 加载用户头像
  await loadUserAvatar()

  // 添加触摸事件监听器
  document.addEventListener('touchstart', handleTouchStart, { passive: true })
  document.addEventListener('touchend', handleTouchEnd, { passive: true })
  
  // ✅ 添加 visibilitychange 事件监听器，当页面重新可见时更新用户名
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

/**
 * 路由更新时刷新用户名（当从 ProfileEditView 返回时触发）
 */
onBeforeRouteUpdate(async (to, from, next) => {
  logger.info('路由更新，刷新用户名')
  await updateUsername()
  next()
})

/**
 * 组件激活时刷新用户名（配合 keep-alive 使用）
 */
onActivated(async () => {
  logger.info('组件激活，刷新用户名')
  await updateUsername()
  refreshUsername()  // ✅ 触发刷新
})

/**
 * 处理页面可见性变化（当从其他页面返回时更新用户名）
 */
const handleVisibilityChange = async () => {
  if (document.visibilityState === 'visible') {
    logger.info('页面重新可见，更新用户名')
    await updateUsername()
    refreshUsername()  // ✅ 触发刷新
  }
}

/**
 * 加载用户头像（从缓存的用户信息中获取）
 */
const loadUserAvatar = async () => {
  try {
    // 从 sessionStorage 缓存中获取用户信息
    const cachedUserInfo = getCachedUserInfo()
    
    if (!cachedUserInfo) {
      logger.warn('未找到缓存的用户信息')
      userAvatar.value = ''
      return
    }
    
    logger.info('从缓存加载用户头像...')
    
    // 如果有头像信息，加载头像
    if (cachedUserInfo.avatar) {
      // 获取完整的头像 URL
      const fullUrl = getFullAvatarUrl(cachedUserInfo.avatar)
      
      // 尝试加载需要认证的头像图片
      const blobUrl = await loadAuthenticatedImage(fullUrl)
      if (blobUrl) {
        userAvatar.value = blobUrl
        logger.info('头像加载成功', blobUrl)
      } else {
        // 如果加载失败，使用完整 URL
        userAvatar.value = fullUrl
        logger.warn('Blob 加载失败，使用原始 URL')
      }
    } else {
      logger.info('未找到头像，使用默认头像')
      userAvatar.value = ''
    }
  } catch (error) {
    logger.error('加载头像失败:', error)
    userAvatar.value = ''
  }
}

onUnmounted(() => {
  // 移除触摸事件监听器
  document.removeEventListener('touchstart', handleTouchStart)
  document.removeEventListener('touchend', handleTouchEnd)
  
  // ✅ 移除 visibilitychange 事件监听器
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  
  // 清理 Blob URL，避免内存泄漏
  if (userAvatar.value && userAvatar.value.startsWith('blob:')) {
    URL.revokeObjectURL(userAvatar.value)
    logger.debug('已清理头像 Blob URL')
  }
});
</script>

<style scoped>

/* 左侧导航栏 */
.sidebar {
  width: 200px; /* 固定宽度 200px */
  background: white; /* 白色背景 */
  border-right: 1px solid #e8e8e8; /* 右侧边框 */
  padding: 1.5rem 0; /* 上下 24px 内边距 */
  transition: transform 0.3s ease; /* 平滑过渡动画 */
}

/* 导航菜单容器 */
.nav-menu {
  display: flex; /* 启用 Flexbox 布局 */
  flex-direction: column; /* 子元素垂直排列 */
  gap: 0.5rem; /* 菜单项间距 8px */
}

/* 导航菜单项 */
.nav-item {
  display: flex; /* 启用 Flexbox 布局 */
  align-items: center; /* 垂直居中对齐 */
  gap: 0.75rem; /* 图标和文字间距 12px */
  padding: 0.875rem 1.5rem; /* 上下 14px，左右 24px 内边距 */
  border: none; /* 无边框 */
  background: transparent; /* 透明背景 */
  color: #666; /* 灰色文字 */
  font-size: 1rem; /* 字体大小 16px */
  cursor: pointer; /* 鼠标悬停时显示手型光标 */
  transition: all 0.3s ease; /* 所有属性变化时的过渡动画 */
  text-align: left; /* 文字左对齐 */
  width: 100%; /* 占满父容器宽度 */
}

/* 导航菜单项悬停效果 */
.nav-item:hover {
  background: #f5f7fa; /* 浅灰色背景 */
  color: #667eea; /* 紫色文字 */
}

/* 导航菜单项激活状态 */
.nav-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); /* 紫色渐变背景 */
  color: white; /* 白色文字 */
  border-right: 3px solid #764ba2; /* 右侧 3px 紫色边框 */
}

/* 导航图标样式 */
.nav-icon {
  font-size: 1.25rem; /* 图标大小 20px */
}

/* 导航文字样式 */
.nav-text {
  font-weight: 500; /* 字体粗细：中等 */
}

/* 侧边栏遮罩层（半透明覆盖内容区） */
.sidebar-overlay {
  position: fixed; /* 固定定位 */
  top: 0; /* 顶部对齐 */
  left: 0; /* 左侧对齐 */
  right: 0; /* 右侧对齐 */
  bottom: 0; /* 底部对齐 */
  background: rgba(0, 0, 0, 0.3); /* 30% 透明度的黑色遮罩 */
  z-index: 999; /* 层级：高于内容区，低于侧边栏 */
  backdrop-filter: blur(2px); /* 轻微模糊效果 */
  animation: fadeIn 0.3s ease; /* 淡入动画 */
}

/* 淡入动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 左侧边缘触发区域已移除 */


/* 头像容器 */
.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;  /* 关键：确保图片也是圆形 */
  cursor: pointer;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  position: relative; /* 相对定位 */
}

.user-avatar:hover {
  transform: scale(1.1); /* 放大 1.1 倍 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25); /* 加深阴影 */
}

/* 自定义头像图片 */
.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;  /* 保持比例，裁剪多余部分 */
  display: block;
}

/* 默认头像 */
.avatar-default {
  width: 100%; /* 宽度 100%，继承父容器 */
  height: 100%; /* 高度 100%，继承父容器 */
  display: flex; /* 启用 Flexbox 布局 */
  align-items: center; /* 垂直居中 */
  justify-content: center; /* 水平居中 */
  color: white; /* 白色文字 */
  font-size: 1.25rem; /* 字体大小 20px */
  font-weight: 600; /* 字体粗细：半粗体 */
}

/* 主容器：占满整个视口，使用 Flexbox 纵向布局 */
.dashboard-container {
  width: 100vw; /* 视口宽度的 100% */
  height: 100vh; /* 视口高度的 100% */
  display: flex; /* 启用 Flexbox 布局 */
  flex-direction: column; /* 子元素垂直排列 */
  background-color: #f5f7fa; /* 浅灰色背景 */
}

/* 顶部标题栏：渐变紫色背景，包含欢迎信息和操作按钮 */
.header {
  display: flex; /* 启用 Flexbox 布局 */
  justify-content: space-between; /* 左右两端对齐 */
  align-items: center; /* 垂直居中对齐 */
  padding: 1rem 2rem; /* 上下 16px，左右 32px 内边距 */
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); /* 紫色渐变背景 */
  color: white; /* 白色文字 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); /* 轻微阴影效果 */
}

/* 标题栏左侧区域 */
.header-left {
  display: flex; /* 启用 Flexbox 布局 */
  align-items: center; /* 垂直居中对齐 */
  gap: 1rem; /* 头像和文字间距 16px */
}

/* 欢迎文字样式 */
.welcome-text {
  font-size: 1.5rem; /* 字体大小 24px */
  font-weight: 600; /* 字体粗细：半粗体 */
  margin: 0; /* 清除默认外边距 */
}

/* 标题栏右侧按钮区域 */
.header-right {
  display: flex; /* 启用 Flexbox 布局 */
  gap: 1rem; /* 按钮之间间距 16px */
}

/* 通用按钮样式 */
.btn {
  display: flex; /* 启用 Flexbox 布局 */
  align-items: center; /* 垂直居中对齐图标和文字 */
  gap: 0.5rem; /* 图标和文字间距 8px */
  padding: 0.625rem 1.25rem; /* 上下 10px，左右 20px 内边距 */
  border: none; /* 无边框 */
  border-radius: 8px; /* 圆角 8px */
  font-size: 0.95rem; /* 字体大小约 15px */
  font-weight: 500; /* 字体粗细：中等 */
  cursor: pointer; /* 鼠标悬停时显示手型光标 */
  transition: all 0.3s ease; /* 所有属性变化时的过渡动画 */
}

/* 个人信息按钮：半透明白色背景 */
.btn-info {
  background: rgba(255, 255, 255, 0.2); /* 20% 透明度的白色背景 */
  color: white; /* 白色文字 */
  backdrop-filter: blur(10px); /* 背景模糊效果 */
}

/* 个人信息按钮悬停效果 */
.btn-info:hover {
  background: rgba(255, 255, 255, 0.3); /* 增加到 30% 透明度 */
  transform: translateY(-2px); /* 向上移动 2px */
}

/* 退出按钮：接近不透明的白色背景 */
.btn-logout {
  background: rgba(255, 255, 255, 0.9); /* 90% 不透明度的白色背景 */
  color: #667eea; /* 紫色文字 */
}

/* 退出按钮悬停效果 */
.btn-logout:hover {
  background: white; /* 纯白色背景 */
  transform: translateY(-2px); /* 向上移动 2px */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); /* 添加阴影 */
}

/* 按钮图标样式 */
.icon {
  font-size: 1.1rem; /* 图标大小约 17.6px */
}

/* 主内容区域：包含侧边栏和内容区 */
.main-content {
  display: flex; /* 启用 Flexbox 布局 */
  flex: 1; /* 占据剩余空间 */
  overflow: hidden; /* 隐藏溢出内容 */
}

/* 右侧内容区域 */
.content-area {
  flex: 1; /* 占据剩余空间 */
  padding: 2rem; /* 四周 32px 内边距 */
  overflow-y: auto; /* 垂直方向可滚动 */
}

/* 模态框遮罩层：半透明黑色背景 */
.modal-overlay {
  position: fixed; /* 固定定位 */
  top: 0; /* 顶部对齐 */
  left: 0; /* 左侧对齐 */
  right: 0; /* 右侧对齐 */
  bottom: 0; /* 底部对齐 */
  background: rgba(0, 0, 0, 0.5); /* 50% 透明度的黑色背景 */
  display: flex; /* 启用 Flexbox 布局 */
  align-items: center; /* 垂直居中对齐 */
  justify-content: center; /* 水平居中对齐 */
  z-index: 1000; /* 层级设为 1000，确保在最上层 */
  backdrop-filter: blur(4px); /* 背景模糊效果 */
}

/* 模态框内容容器 */
.modal-content {
  background: white; /* 白色背景 */
  border-radius: 16px; /* 圆角 16px */
  padding: 2rem; /* 四周 32px 内边距 */
  max-width: 500px; /* 最大宽度 500px */
  width: 90%; /* 宽度为父容器的 90% */
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2); /* 深度阴影效果 */
  animation: modalSlideIn 0.3s ease; /* 滑入动画 */
}

/* 模态框滑入动画定义 */
@keyframes modalSlideIn {
  from {
    opacity: 0; /* 初始透明度为 0 */
    transform: translateY(-20px); /* 初始位置向上偏移 20px */
  }
  to {
    opacity: 1; /* 最终透明度为 1 */
    transform: translateY(0); /* 最终位置回到原位 */
  }
}

/* 模态框头部：包含标题和关闭按钮 */
.modal-header {
  display: flex; /* 启用 Flexbox 布局 */
  justify-content: space-between; /* 左右两端对齐 */
  align-items: center; /* 垂直居中对齐 */
  margin-bottom: 1.5rem; /* 底部外边距 24px */
  padding-bottom: 1rem; /* 底部内边距 16px */
  border-bottom: 2px solid #f0f0f0; /* 底部 2px 浅灰色边框 */
}

/* 模态框标题 */
.modal-header h2 {
  margin: 0; /* 清除默认外边距 */
  color: #333; /* 深灰色文字 */
  font-size: 1.5rem; /* 字体大小 24px */
}

/* 关闭按钮 */
.close-btn {
  background: none; /* 无背景 */
  border: none; /* 无边框 */
  font-size: 2rem; /* 字体大小 32px */
  color: #999; /* 灰色文字 */
  cursor: pointer; /* 鼠标悬停时显示手型光标 */
  transition: color 0.3s ease; /* 颜色变化的过渡动画 */
  line-height: 1; /* 行高设为 1 */
}

/* 关闭按钮悬停效果 */
.close-btn:hover {
  color: #333; /* 变为深灰色 */
}

/* 模态框主体内容区域 */
.modal-body {
  display: flex; /* 启用 Flexbox 布局 */
  flex-direction: column; /* 子元素垂直排列 */
  gap: 1rem; /* 信息项间距 16px */
}

/* 单个信息项 */
.info-item {
  display: flex; /* 启用 Flexbox 布局 */
  justify-content: space-between; /* 左右两端对齐（标签和值） */
  padding: 0.75rem; /* 四周 12px 内边距 */
  background: #f8f9fa; /* 浅灰色背景 */
  border-radius: 8px; /* 圆角 8px */
}

/* 信息项标签 */
.info-item label {
  color: #666; /* 灰色文字 */
  font-weight: 500; /* 字体粗细：中等 */
}

/* 信息项值 */
.info-item span {
  color: #333; /* 深灰色文字 */
  font-weight: 600; /* 字体粗细：半粗体 */
}

/* 账号状态激活样式 */
.status-active {
  color: #52c41a !important; /* 绿色文字（强制覆盖） */
}

/* 移动端响应式适配（屏幕宽度 ≤ 768px） */
@media (max-width: 768px) {
  /* 缩小标题栏内边距 */
  .header {
    padding: 1rem; /* 四周 16px 内边距 */
  }

  /* 缩小欢迎文字 */
  .welcome-text {
    font-size: 1.2rem; /* 字体大小 19.2px */
  }

  /* 缩小按钮尺寸 */
  .btn {
    padding: 0.5rem 1rem; /* 上下 8px，左右 16px 内边距 */
    font-size: 0.875rem; /* 字体大小 14px */
  }

  /* 左侧边缘触发区域已移除，改为点击头像触发 */

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


