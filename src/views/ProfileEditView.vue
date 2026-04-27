<template>
  <div class="profile-edit-container">
    <!-- 标题栏 -->
    <header class="header">
      <div class="header-left">
        <button class="btn-back" @click="goBack">
          <span class="icon">←</span>
          返回
        </button>
        <h1 class="page-title">个人信息</h1>
      </div>
      <div class="header-right">
        <button class="btn btn-save" @click="saveProfile" :disabled="!hasChanges || isSaving">
          <span class="icon">💾</span>
          {{ isSaving ? '保存中...' : '保存' }}
        </button>
      </div>
    </header>

    <!-- 主内容区：左右布局 -->
    <main class="main-content">
      <div class="content-wrapper">
        <!-- 左侧选项卡导航 -->
        <aside class="tabs-sidebar">
          <nav class="tabs-nav">
            <button
                class="tab-item"
                :class="{ active: activeTab === 'avatar' }"
                @click="activeTab = 'avatar'"
            >
              <span class="tab-icon">🖼️</span>
              <span class="tab-text">头像设置</span>
            </button>
            <button
                class="tab-item"
                :class="{ active: activeTab === 'basic' }"
                @click="activeTab = 'basic'"
            >
              <span class="tab-icon">👤</span>
              <span class="tab-text">基本信息</span>
            </button>
            <button
                class="tab-item"
                :class="{ active: activeTab === 'contact' }"
                @click="activeTab = 'contact'"
            >
              <span class="tab-icon">📞</span>
              <span class="tab-text">联系方式</span>
            </button>
            <button
                class="tab-item"
                :class="{ active: activeTab === 'password' }"
                @click="activeTab = 'password'"
            >
              <span class="tab-icon">🔒</span>
              <span class="tab-text">修改密码</span>
            </button>
            <button
                class="tab-item"
                :class="{ active: activeTab === 'info' }"
                @click="activeTab = 'info'"
            >
              <span class="tab-icon">ℹ️</span>
              <span class="tab-text">账号信息</span>
            </button>
          </nav>
        </aside>

        <!-- 右侧内容区域 -->
        <section class="tab-content-area">
          <!-- 头像设置 -->
          <div :class="['tab-pane', { 'active': activeTab === 'avatar' }]">
            <div class="content-card">
              <h2 class="card-title">
                <span class="icon">🖼️</span>
                头像设置
              </h2>
              <div class="avatar-upload">
                <div class="avatar-preview" @click="triggerFileInput">
                  <img
                      v-if="previewAvatar"
                      :src="previewAvatar"
                      alt="头像预览"
                      class="avatar-img"
                  />
                  <div v-else class="avatar-placeholder" :style="{ backgroundColor: avatarColor }">
                    {{ avatarLetter }}
                  </div>
                  <div class="avatar-overlay">
                    <span class="upload-icon">📷</span>
                    <span class="upload-text">点击更换</span>
                  </div>
                </div>
                <input
                    ref="fileInput"
                    type="file"
                    accept="image/*"
                    @change="handleAvatarChange"
                    style="display: none"
                />
                <p class="hint-text">支持 JPG、PNG 格式，文件大小不超过 2MB</p>
              </div>
            </div>
          </div>

          <!-- 基本信息 -->
          <div :class="['tab-pane', { 'active': activeTab === 'basic' }]">
            <div class="content-card">
              <h2 class="card-title">
                <span class="icon">👤</span>
                基本信息
              </h2>
              <div class="form-group">
                <label for="nickname">
                  <span class="label-icon">✏️</span>
                  昵称
                </label>
                <input
                    type="text"
                    id="nickname"
                    v-model="editForm.nickname"
                    placeholder="请输入昵称"
                    maxlength="20"
                    @input="checkChanges"
                />
                <p class="char-count">{{ editForm.nickname.length }}/20</p>
              </div>
            </div>
          </div>

          <!-- 联系方式 -->
          <div :class="['tab-pane', { 'active': activeTab === 'contact' }]">
            <div class="content-card">
              <h2 class="card-title">
                <span class="icon">📞</span>
                联系方式
              </h2>
              <div class="form-group">
                <label for="email">
                  <span class="label-icon">📧</span>
                  邮箱地址
                </label>
                <input
                    type="email"
                    id="email"
                    v-model="editForm.email"
                    placeholder="请输入邮箱地址"
                    @input="checkChanges"
                    @blur="handleEmailBlur"
                />
                <p v-if="emailBlurred && emailError" class="error-message">
                  {{ emailError }}
                </p>
              </div>

              <div class="form-group">
                <label for="phone">
                  <span class="label-icon">📱</span>
                  手机号
                </label>
                <input
                    type="tel"
                    id="phone"
                    v-model="editForm.phone"
                    placeholder="请输入手机号"
                    maxlength="11"
                    @input="checkChanges"
                    @blur="handlePhoneBlur"
                />
                <p v-if="phoneBlurred && phoneError" class="error-message">
                  {{ phoneError }}
                </p>
              </div>
            </div>
          </div>

          <!-- 修改密码 -->
          <div :class="['tab-pane', { 'active': activeTab === 'password' }]">
            <div class="content-card">
              <h2 class="card-title">
                <span class="icon">🔒</span>
                修改密码
              </h2>
              <div class="form-group">
                <label for="oldPassword">
                  <span class="label-icon">🔑</span>
                  当前密码
                </label>
                <input
                    type="password"
                    id="oldPassword"
                    v-model="editForm.oldPassword"
                    placeholder="请输入当前密码"
                    autocomplete="current-password"
                    @input="checkChanges"
                />
              </div>

              <div class="form-group">
                <label for="newPassword">
                  <span class="label-icon">🆕</span>
                  新密码
                </label>
                <input
                    type="password"
                    id="newPassword"
                    v-model="editForm.newPassword"
                    placeholder="请输入新密码（6-14位）"
                    minlength="6"
                    maxlength="14"
                    autocomplete="new-password"
                    @input="checkChanges"
                    @blur="handleNewPasswordBlur"
                />
                <p v-if="newPasswordBlurred && passwordTooShort" class="error-message">
                  {{ passwordTooShort }}
                </p>
                <p v-if="newPasswordBlurred && passwordHasSpecialChars" class="error-message">
                  {{ passwordHasSpecialChars }}
                </p>
              </div>

              <div class="form-group">
                <label for="confirmPassword">
                  <span class="label-icon">✅</span>
                  确认新密码
                </label>
                <input
                    type="password"
                    id="confirmPassword"
                    v-model="editForm.confirmPassword"
                    placeholder="请再次输入新密码"
                    autocomplete="new-password"
                    @input="checkChanges"
                    @blur="handleConfirmPasswordBlur"
                />
                <p v-if="confirmPasswordBlurred && passwordMismatch" class="error-message">
                  {{ passwordMismatch }}
                </p>
              </div>
            </div>
          </div>

          <!-- 账号信息 -->
          <div :class="['tab-pane', { 'active': activeTab === 'info' }]">
            <div class="content-card">
              <h2 class="card-title">
                <span class="icon">ℹ️</span>
                账号信息
              </h2>
              <div class="info-grid">
                <div class="info-item">
                  <label>注册时间</label>
                  <span>{{ registerDate }}</span>
                </div>
                <div class="info-item">
                  <label>账号状态</label>
                  <span class="status-active">正常</span>
                </div>
                <div class="info-item">
                  <label>存储空间</label>
                  <span>5.2 GB / 10 GB</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { createLogger } from '@/utils/logger'

const logger = createLogger('ProfileEditView')

const router = useRouter()

// 当前激活的选项卡
const activeTab = ref('avatar')

// 表单数据
const editForm = ref({
  nickname: '',
  email: '',
  phone: '',
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 原始数据（用于检测变化）
const originalData = ref({
  nickname: '',
  email: '',
  phone: '',
  avatar: ''
})

// 头像相关
const previewAvatar = ref('')
const fileInput = ref(null)

// 密码框失焦状态
const newPasswordBlurred = ref(false)
const confirmPasswordBlurred = ref(false)

// 邮箱和手机号失焦状态
const emailBlurred = ref(false)
const phoneBlurred = ref(false)

// 保存状态
const isSaving = ref(false)

// 是否有未保存的更改
const hasChanges = ref(false)

// 注册日期
const registerDate = ref('2024-01-01')

/**
 * 计算属性：获取头像显示的字母
 */
const avatarLetter = computed(() => {
  if (!editForm.value.nickname) return 'U'
  return editForm.value.nickname.charAt(0).toUpperCase()
})

/**
 * 计算属性：根据昵称生成头像背景色
 */
const avatarColor = computed(() => {
  const colors = [
    '#667eea', '#764ba2', '#f093fb', '#f5576c',
    '#4facfe', '#00f2fe', '#43e97b', '#fa709a',
    '#fee140', '#30cfd0', '#a8edea', '#ff9a9e'
  ]
  if (!editForm.value.nickname) return colors[0]

  let hash = 0
  for (let i = 0; i < editForm.value.nickname.length; i++) {
    hash = editForm.value.nickname.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
})

/**
 * 计算属性：密码长度验证
 */
const passwordTooShort = computed(() => {
  const length = editForm.value.newPassword.length
  if (length > 0 && length < 6) {
    return '密码长度至少为6位'
  }
  return ''
})

/**
 * 计算属性：特殊字符验证
 */
const passwordHasSpecialChars = computed(() => {
  const specialChars = /[^a-zA-Z0-9_]/
  if (editForm.value.newPassword && specialChars.test(editForm.value.newPassword)) {
    return '密码只能包含字母、数字和下划线'
  }
  return ''
})

/**
 * 计算属性：密码一致性验证
 */
const passwordMismatch = computed(() => {
  if (editForm.value.confirmPassword &&
      editForm.value.newPassword !== editForm.value.confirmPassword) {
    return '两次输入的密码不一致'
  }
  return ''
})

/**
 * 计算属性：验证邮箱格式
 */
const emailError = computed(() => {
  if (emailBlurred.value && editForm.value.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(editForm.value.email)) {
      return '请输入有效的邮箱地址'
    }
  }
  return ''
})

/**
 * 计算属性：验证手机号格式
 */
const phoneError = computed(() => {
  if (phoneBlurred.value && editForm.value.phone) {
    const phoneRegex = /^1[3-9]\d{9}$/
    if (!phoneRegex.test(editForm.value.phone)) {
      return '请输入有效的11位手机号'
    }
  }
  return ''
})

/**
 * 返回上一页
 */
const goBack = () => {
  if (hasChanges.value) {
    if (confirm('有未保存的更改，确定要离开吗？')) {
      router.back()
    }
  } else {
    router.back()
  }
}

/**
 * 触发文件选择
 */
const triggerFileInput = () => {
  fileInput.value?.click()
}

/**
 * 处理头像文件选择
 */
const handleAvatarChange = (event) => {
  const file = event.target.files[0]
  if (!file) return

  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    alert('请选择图片文件')
    return
  }

  // 验证文件大小（2MB）
  if (file.size > 2 * 1024 * 1024) {
    alert('图片大小不能超过 2MB')
    return
  }

  // 读取文件并预览
  const reader = new FileReader()
  reader.onload = (e) => {
    previewAvatar.value = e.target.result
    checkChanges()
  }
  reader.readAsDataURL(file)
}

/**
 * 新密码框失焦处理
 */
const handleNewPasswordBlur = () => {
  newPasswordBlurred.value = true
}

/**
 * 确认密码框失焦处理
 */
const handleConfirmPasswordBlur = () => {
  confirmPasswordBlurred.value = true
}

/**
 * 邮箱失焦处理
 */
const handleEmailBlur = () => {
  emailBlurred.value = true
}

/**
 * 手机号失焦处理
 */
const handlePhoneBlur = () => {
  phoneBlurred.value = true
}

/**
 * 检查是否有更改
 */
const checkChanges = () => {
  const nicknameChanged = editForm.value.nickname !== originalData.value.nickname
  const emailChanged = editForm.value.email !== originalData.value.email
  const phoneChanged = editForm.value.phone !== originalData.value.phone
  const avatarChanged = previewAvatar.value !== originalData.value.avatar
  const passwordChanged = !!(editForm.value.oldPassword || editForm.value.newPassword || editForm.value.confirmPassword)

  hasChanges.value = nicknameChanged || emailChanged || phoneChanged || avatarChanged || passwordChanged
}

/**
 * 验证表单
 */
const validateForm = () => {
  // 如果修改了密码，需要验证
  if (editForm.value.oldPassword || editForm.value.newPassword || editForm.value.confirmPassword) {
    if (!editForm.value.oldPassword) {
      alert('请输入当前密码')
      return false
    }
    if (!editForm.value.newPassword) {
      alert('请输入新密码')
      return false
    }
    if (editForm.value.newPassword.length < 6 || editForm.value.newPassword.length > 14) {
      alert('新密码长度应在6-14位之间')
      return false
    }
    if (/[^a-zA-Z0-9_]/.test(editForm.value.newPassword)) {
      alert('新密码只能包含字母、数字和下划线')
      return false
    }
    if (editForm.value.newPassword !== editForm.value.confirmPassword) {
      alert('两次输入的新密码不一致')
      return false
    }
  }

  // 验证昵称
  if (!editForm.value.nickname.trim()) {
    alert('昵称不能为空')
    return false
  }

  // 验证邮箱
  if (editForm.value.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(editForm.value.email)) {
      alert('请输入有效的邮箱地址')
      return false
    }
  }

  // 验证手机号
  if (editForm.value.phone) {
    const phoneRegex = /^1[3-9]\d{9}$/
    if (!phoneRegex.test(editForm.value.phone)) {
      alert('请输入有效的11位手机号')
      return false
    }
  }

  return true
}

/**
 * 保存个人信息
 */
const saveProfile = async () => {
  if (!validateForm()) {
    return
  }

  isSaving.value = true

  try {
    // 模拟 API 调用延迟
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 保存到 localStorage（实际项目中应该调用后端 API）
    localStorage.setItem('username', editForm.value.nickname)

    if (editForm.value.email) {
      localStorage.setItem('userEmail', editForm.value.email)
    }

    if (editForm.value.phone) {
      localStorage.setItem('userPhone', editForm.value.phone)
    }

    if (previewAvatar.value) {
      localStorage.setItem('userAvatar', previewAvatar.value)
    }

    // 如果修改了密码，这里应该调用后端 API 更新密码
    if (editForm.value.newPassword) {
      logger.info('密码已修改')
      // TODO: 调用后端 API 更新密码
    }

    alert('保存成功！')
    hasChanges.value = false

    // 更新原始数据
    originalData.value.nickname = editForm.value.nickname
    originalData.value.email = editForm.value.email
    originalData.value.phone = editForm.value.phone
    originalData.value.avatar = previewAvatar.value

    // 清空密码字段
    editForm.value.oldPassword = ''
    editForm.value.newPassword = ''
    editForm.value.confirmPassword = ''

    // 重置失焦状态
    newPasswordBlurred.value = false
    confirmPasswordBlurred.value = false

    // 返回上一页
    setTimeout(() => {
      router.back()
    }, 500)
  } catch (error) {
    logger.error('保存失败:', error)
    alert('保存失败，请重试')
  } finally {
    isSaving.value = false
  }
}

/**
 * 组件挂载时加载用户信息
 */
onMounted(() => {
  const savedUsername = localStorage.getItem('username')
  const savedEmail = localStorage.getItem('userEmail')
  const savedPhone = localStorage.getItem('userPhone')
  const savedAvatar = localStorage.getItem('userAvatar')

  if (savedUsername) {
    editForm.value.nickname = savedUsername
    originalData.value.nickname = savedUsername
  }

  if (savedEmail) {
    editForm.value.email = savedEmail
    originalData.value.email = savedEmail
  }

  if (savedPhone) {
    editForm.value.phone = savedPhone
    originalData.value.phone = savedPhone
  }

  if (savedAvatar) {
    previewAvatar.value = savedAvatar
    originalData.value.avatar = savedAvatar
  }
})
</script>

<style scoped>
/* 主容器：占满整个视口 */
.profile-edit-container {
  width: 100vw; /* 视口宽度的 100% */
  height: 100vh; /* 视口高度的 100% */
  display: flex; /* 启用 Flexbox 布局 */
  flex-direction: column; /* 子元素垂直排列 */
  background-color: #f5f7fa; /* 浅灰色背景 */
}

/* 顶部标题栏 */
.header {
  display: flex; /* 启用 Flexbox 布局 */
  justify-content: space-between; /* 左右两端对齐 */
  align-items: center; /* 垂直居中对齐 */
  padding: 1rem 2rem; /* 上下 16px，左右 32px 内边距 */
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); /* 紫色渐变背景 */
  color: white; /* 白色文字 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); /* 轻微阴影 */
}

/* 标题栏左侧 */
.header-left {
  display: flex; /* 启用 Flexbox 布局 */
  align-items: center; /* 垂直居中对齐 */
  gap: 1rem; /* 间距 16px */
}

/* 返回按钮 */
.btn-back {
  display: flex; /* 启用 Flexbox 布局 */
  align-items: center; /* 垂直居中 */
  gap: 0.5rem; /* 图标和文字间距 */
  padding: 0.5rem 1rem; /* 内边距 */
  background: rgba(255, 255, 255, 0.2); /* 半透明白色背景 */
  border: none; /* 无边框 */
  border-radius: 8px; /* 圆角 */
  color: white; /* 白色文字 */
  font-size: 0.95rem; /* 字体大小 */
  cursor: pointer; /* 手型光标 */
  transition: all 0.3s ease; /* 过渡动画 */
  backdrop-filter: blur(10px); /* 背景模糊 */
}

/* 返回按钮悬停效果 */
.btn-back:hover {
  background: rgba(255, 255, 255, 0.3); /* 增加透明度 */
  transform: translateY(-2px); /* 向上移动 */
}

/* 页面标题 */
.page-title {
  font-size: 1.5rem; /* 字体大小 24px */
  font-weight: 600; /* 字体粗细：半粗体 */
  margin: 0; /* 清除默认外边距 */
}

/* 标题栏右侧 */
.header-right {
  display: flex; /* 启用 Flexbox 布局 */
  gap: 1rem; /* 间距 */
}

/* 通用按钮样式 */
.btn {
  display: flex; /* 启用 Flexbox 布局 */
  align-items: center; /* 垂直居中 */
  gap: 0.5rem; /* 图标和文字间距 */
  padding: 0.625rem 1.25rem; /* 内边距 */
  border: none; /* 无边框 */
  border-radius: 8px; /* 圆角 */
  font-size: 0.95rem; /* 字体大小 */
  font-weight: 500; /* 字体粗细：中等 */
  cursor: pointer; /* 手型光标 */
  transition: all 0.3s ease; /* 过渡动画 */
}

/* 保存按钮 */
.btn-save {
  background: white; /* 白色背景 */
  color: #667eea; /* 紫色文字 */
}

/* 保存按钮悬停效果 */
.btn-save:hover:not(:disabled) {
  background: #f8f9fa; /* 浅灰色背景 */
  transform: translateY(-2px); /* 向上移动 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); /* 阴影 */
}

/* 保存按钮禁用状态 */
.btn-save:disabled {
  opacity: 0.6; /* 降低透明度 */
  cursor: not-allowed; /* 禁止光标 */
}

/* 按钮图标 */
.icon {
  font-size: 1.1rem; /* 图标大小 */
}

/* 主内容区域 */
.main-content {
  flex: 1; /* 占据剩余空间 */
  overflow: hidden; /* 隐藏溢出 */
  padding: 2rem; /* 内边距 */
}

/* 内容包装器：左右布局 */
.content-wrapper {
  display: flex; /* 启用 Flexbox 布局 */
  gap: 2rem; /* 左右间距 */
  height: 100%; /* 占满高度 */
  max-width: 1200px; /* 最大宽度 */
  margin: 0 auto; /* 水平居中 */
}

/* 左侧选项卡导航栏 */
.tabs-sidebar {
  width: 220px; /* 固定宽度 */
  background: white; /* 白色背景 */
  border-radius: 16px; /* 圆角 */
  padding: 1.5rem; /* 内边距 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); /* 轻微阴影 */
  flex-shrink: 0; /* 不允许缩小 */
}

/* 选项卡导航容器 */
.tabs-nav {
  display: flex; /* 启用 Flexbox 布局 */
  flex-direction: column; /* 垂直排列 */
  gap: 0.5rem; /* 选项卡间距 */
}

/* 选项卡按钮 */
.tab-item {
  display: flex; /* 启用 Flexbox 布局 */
  align-items: center; /* 垂直居中 */
  gap: 0.75rem; /* 图标和文字间距 */
  padding: 1rem 1.25rem; /* 内边距 */
  border: none; /* 无边框 */
  background: transparent; /* 透明背景 */
  color: #666; /* 灰色文字 */
  font-size: 1rem; /* 字体大小 */
  font-weight: 500; /* 字体粗细：中等 */
  cursor: pointer; /* 手型光标 */
  transition: all 0.3s ease; /* 过渡动画 */
  text-align: left; /* 文字左对齐 */
  width: 100%; /* 占满宽度 */
  border-radius: 8px; /* 圆角 */
}

/* 选项卡悬停效果 */
.tab-item:hover {
  background: #f5f7fa; /* 浅灰色背景 */
  color: #667eea; /* 紫色文字 */
}

/* 选项卡激活状态 */
.tab-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); /* 紫色渐变背景 */
  color: white; /* 白色文字 */
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3); /* 紫色阴影 */
}

/* 选项卡图标 */
.tab-icon {
  font-size: 1.25rem; /* 图标大小 */
}

/* 选项卡文字 */
.tab-text {
  font-weight: 500; /* 字体粗细：中等 */
}

/* 右侧内容区域 */
.tab-content-area {
  flex: 1; /* 占据剩余空间 */
  overflow-y: auto; /* 垂直可滚动 */
}

/* 选项卡面板 */
.tab-pane {
  animation: fadeIn 0.3s ease; /* 淡入动画 */
}

/* 淡入动画 */
@keyframes fadeIn {
  from {
    opacity: 0; /* 初始透明度 */
    transform: translateX(10px); /* 初始位置 */
  }
  to {
    opacity: 1; /* 最终透明度 */
    transform: translateX(0); /* 最终位置 */
  }
}

/* 内容卡片 */
.content-card {
  background: white; /* 白色背景 */
  border-radius: 16px; /* 圆角 */
  padding: 2rem; /* 内边距 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); /* 轻微阴影 */
}

/* 卡片标题 */
.card-title {
  display: flex; /* 启用 Flexbox 布局 */
  align-items: center; /* 垂直居中 */
  gap: 0.75rem; /* 图标和文字间距 */
  font-size: 1.25rem; /* 字体大小 20px */
  font-weight: 600; /* 字体粗细：半粗体 */
  color: #333; /* 深灰色文字 */
  margin: 0 0 1.5rem 0; /* 下边距 */
  padding-bottom: 1rem; /* 底部内边距 */
  border-bottom: 2px solid #f0f0f0; /* 底部分隔线 */
}

/* 头像上传区域 */
.avatar-upload {
  display: flex; /* 启用 Flexbox 布局 */
  flex-direction: column; /* 垂直排列 */
  align-items: center; /* 水平居中 */
  gap: 1rem; /* 间距 */
}

/* 头像预览容器 */
.avatar-preview {
  width: 150px; /* 宽度 */
  height: 150px; /* 高度 */
  border-radius: 50%; /* 圆形 */
  overflow: hidden; /* 隐藏溢出 */
  position: relative; /* 相对定位 */
  cursor: pointer; /* 手型光标 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); /* 阴影 */
  transition: all 0.3s ease; /* 过渡动画 */
}

/* 头像预览悬停效果 */
.avatar-preview:hover {
  transform: scale(1.05); /* 放大 */
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25); /* 加深阴影 */
}

/* 头像图片 */
.avatar-img {
  width: 100%; /* 宽度 100% */
  height: 100%; /* 高度 100% */
  object-fit: cover; /* 保持比例覆盖 */
  display: block; /* 块级元素 */
}

/* 头像占位符（默认头像） */
.avatar-placeholder {
  width: 100%; /* 宽度 100% */
  height: 100%; /* 高度 100% */
  display: flex; /* 启用 Flexbox 布局 */
  align-items: center; /* 垂直居中 */
  justify-content: center; /* 水平居中 */
  color: white; /* 白色文字 */
  font-size: 3.5rem; /* 字体大小 */
  font-weight: 600; /* 字体粗细：半粗体 */
}

/* 头像悬停遮罩层 */
.avatar-overlay {
  position: absolute; /* 绝对定位 */
  top: 0; /* 顶部对齐 */
  left: 0; /* 左侧对齐 */
  right: 0; /* 右侧对齐 */
  bottom: 0; /* 底部对齐 */
  background: rgba(0, 0, 0, 0.5); /* 半透明黑色背景 */
  display: flex; /* 启用 Flexbox 布局 */
  flex-direction: column; /* 垂直排列 */
  align-items: center; /* 水平居中 */
  justify-content: center; /* 垂直居中 */
  opacity: 0; /* 初始隐藏 */
  transition: opacity 0.3s ease; /* 过渡动画 */
  color: white; /* 白色文字 */
}

/* 头像悬停时显示遮罩 */
.avatar-preview:hover .avatar-overlay {
  opacity: 1; /* 显示 */
}

/* 上传图标 */
.upload-icon {
  font-size: 2rem; /* 图标大小 */
  margin-bottom: 0.5rem; /* 下边距 */
}

/* 上传文字 */
.upload-text {
  font-size: 0.875rem; /* 字体大小 */
}

/* 提示文字 */
.hint-text {
  color: #999; /* 灰色文字 */
  font-size: 0.875rem; /* 字体大小 */
  margin: 0; /* 清除外边距 */
}

/* 表单组 */
.form-group {
  margin-bottom: 1.5rem; /* 下边距 */
  position: relative; /* 相对定位 */
}

/* 表单标签 */
.form-group label {
  display: flex; /* 启用 Flexbox 布局 */
  align-items: center; /* 垂直居中 */
  gap: 0.5rem; /* 图标和文字间距 */
  margin-bottom: 0.5rem; /* 下边距 */
  color: #333; /* 深灰色文字 */
  font-weight: 500; /* 字体粗细：中等 */
  font-size: 0.95rem; /* 字体大小 */
}

/* 标签图标 */
.label-icon {
  font-size: 1.1rem; /* 图标大小 */
}

/* 表单输入框 */
.form-group input {
  width: 100%; /* 宽度 100% */
  padding: 0.75rem 1rem; /* 内边距 */
  border: 2px solid #e8e8e8; /* 边框 */
  border-radius: 8px; /* 圆角 */
  font-size: 1rem; /* 字体大小 */
  transition: all 0.3s ease; /* 过渡动画 */
  outline: none; /* 移除默认轮廓 */
}

/* 输入框聚焦效果 */
.form-group input:focus {
  border-color: #667eea; /* 紫色边框 */
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1); /* 紫色光晕 */
}

/* 字符计数 */
.char-count {
  text-align: right; /* 右对齐 */
  color: #999; /* 灰色文字 */
  font-size: 0.875rem; /* 字体大小 */
  margin: 0.25rem 0 0 0; /* 上边距 */
}

/* 错误提示 */
.error-message {
  color: #ff4d4f; /* 红色文字 */
  font-size: 0.875rem; /* 字体大小 */
  margin: 0.25rem 0 0 0; /* 上边距 */
}

/* 信息网格 */
.info-grid {
  display: grid; /* 启用 Grid 布局 */
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); /* 自适应列 */
  gap: 1rem; /* 间距 */
}

/* 信息项 */
.info-item {
  display: flex; /* 启用 Flexbox 布局 */
  flex-direction: column; /* 垂直排列 */
  gap: 0.5rem; /* 间距 */
  padding: 1rem; /* 内边距 */
  background: #f8f9fa; /* 浅灰色背景 */
  border-radius: 8px; /* 圆角 */
}

/* 信息项标签 */
.info-item label {
  color: #666; /* 灰色文字 */
  font-size: 0.875rem; /* 字体大小 */
  font-weight: 500; /* 字体粗细：中等 */
}

/* 信息项值 */
.info-item span {
  color: #333; /* 深灰色文字 */
  font-size: 1rem; /* 字体大小 */
  font-weight: 600; /* 字体粗细：半粗体 */
}

/* 账号状态激活样式 */
.status-active {
  color: #52c41a !important; /* 绿色文字 */
}

/* 移动端响应式适配（竖屏） */
@media (max-width: 768px) {
  /* 缩小标题栏内边距 */
  .header {
    padding: 1rem; /* 四周 16px */
  }

  /* 缩小页面标题 */
  .page-title {
    font-size: 1.2rem; /* 字体大小 */
  }

  /* 缩小主内容区内边距 */
  .main-content {
    padding: 1rem; /* 四周 16px */
    overflow-y: auto; /* 垂直可滚动 */
  }

  /* 内容包装器改为垂直布局 */
  .content-wrapper {
    flex-direction: column; /* 垂直排列 */
    gap: 1rem; /* 间距 */
  }

  /* 隐藏左侧选项卡导航 */
  .tabs-sidebar {
    display: none; /* 完全隐藏 */
  }

  /* 右侧内容区域占满宽度 */
  .tab-content-area {
    width: 100%; /* 全宽 */
    flex: 1; /* 占据剩余空间 */
  }

  /* 显示所有选项卡面板（纵向排列） */
  .tab-pane {
    display: block !important; /* 强制显示所有面板 */
    animation: none; /* 移除动画 */
    margin-bottom: 1rem; /* 面板间距 */
  }

  /* 最后一个面板不需要下边距 */
  .tab-pane:last-child {
    margin-bottom: 0; /* 清除下边距 */
  }

  /* 内容卡片缩小内边距 */
  .content-card {
    padding: 1.5rem; /* 内边距 */
  }

  /* 卡片标题缩小 */
  .card-title {
    font-size: 1.1rem; /* 字体大小 */
    margin-bottom: 1rem; /* 下边距 */
    padding-bottom: 0.75rem; /* 底部内边距 */
  }

  /* 头像预览缩小 */
  .avatar-preview {
    width: 120px; /* 宽度 */
    height: 120px; /* 高度 */
  }

  /* 头像占位符字体缩小 */
  .avatar-placeholder {
    font-size: 3rem; /* 字体大小 */
  }

  /* 表单组间距缩小 */
  .form-group {
    margin-bottom: 1rem; /* 下边距 */
  }

  /* 信息网格改为单列 */
  .info-grid {
    grid-template-columns: 1fr; /* 单列布局 */
  }

  /* 信息项缩小内边距 */
  .info-item {
    padding: 0.75rem; /* 内边距 */
  }
}

/* 横屏适配（landscape） */
@media (min-width: 769px) and (orientation: landscape) {
  /* 确保选项卡侧边栏显示 */
  .tabs-sidebar {
    display: block; /* 显示 */
  }

  /* 只显示激活的选项卡面板 */
  .tab-pane {
    display: none; /* 默认隐藏 */
  }

  .tab-pane.active {
    display: block; /* 只显示激活的面板 */
  }
}
</style>

