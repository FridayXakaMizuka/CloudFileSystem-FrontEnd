<template>
  <div class="edit-field-container">
    <!-- 标题栏 -->
    <header class="header">
      <div class="header-left">
        <button class="btn-back" @click="goBack">
          <span class="icon">←</span>
          返回
        </button>
        <h1 class="page-title">{{ pageTitle }}</h1>
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
                :class="{ active: currentField === 'nickname' }"
                @click="switchField('nickname')"
            >
              <span class="tab-icon">👤</span>
              <span class="tab-text">昵称</span>
            </button>
            <button
                class="tab-item"
                :class="{ active: currentField === 'email' }"
                @click="switchField('email')"
            >
              <span class="tab-icon">📧</span>
              <span class="tab-text">邮箱</span>
            </button>
            <button
                class="tab-item"
                :class="{ active: currentField === 'phone' }"
                @click="switchField('phone')"
            >
              <span class="tab-icon">📱</span>
              <span class="tab-text">手机号</span>
            </button>
            <button
                class="tab-item"
                :class="{ active: currentField === 'password' }"
                @click="switchField('password')"
            >
              <span class="tab-icon">🔒</span>
              <span class="tab-text">密码</span>
            </button>
          </nav>
        </aside>

        <!-- 右侧内容区域 -->
        <section class="tab-content-area" ref="contentArea">
          <!-- 昵称编辑 -->
          <div id="section-nickname" :class="['tab-pane', { 'active': currentField === 'nickname' }]">
            <div class="content-card">
              <h2 class="card-title">
                <span class="icon">✏️</span>
                修改昵称
              </h2>
              <div class="form-group">
                <label for="edit-nickname">
                  <span class="label-icon">👤</span>
                  昵称
                </label>
                <input
                    type="text"
                    id="edit-nickname"
                    v-model="editValue"
                    placeholder="请输入昵称"
                    maxlength="20"
                    @input="handleInput"
                />
                <p v-if="errorMessage" class="error-message">
                  {{ errorMessage }}
                </p>
                <p class="char-count">{{ editValue.length }}/20</p>
              </div>
              <div class="button-group">
                <button class="btn btn-cancel" @click="goBack">
                  取消
                </button>
                <button class="btn btn-save" @click="handleSave" :disabled="isSaving || !isValid">
                  {{ isSaving ? '保存中...' : '保存' }}
                </button>
              </div>
            </div>
          </div>

          <!-- 邮箱编辑 -->
          <div id="section-email" :class="['tab-pane', { 'active': currentField === 'email' }]">
            <div class="content-card">
              <h2 class="card-title">
                <span class="icon">📧</span>
                修改邮箱
              </h2>
              <div class="form-group">
                <label for="edit-email">
                  <span class="label-icon">📧</span>
                  邮箱地址
                </label>
                <input
                    type="email"
                    id="edit-email"
                    v-model="editValue"
                    placeholder="请输入邮箱地址"
                    @input="handleInput"
                />
                <p v-if="errorMessage" class="error-message">
                  {{ errorMessage }}
                </p>
              </div>
              <div class="button-group">
                <button class="btn btn-cancel" @click="goBack">
                  取消
                </button>
                <button class="btn btn-save" @click="handleSave" :disabled="isSaving || !isValid">
                  {{ isSaving ? '保存中...' : '保存' }}
                </button>
              </div>
            </div>
          </div>

          <!-- 手机号编辑 -->
          <div id="section-phone" :class="['tab-pane', { 'active': currentField === 'phone' }]">
            <div class="content-card">
              <h2 class="card-title">
                <span class="icon">📱</span>
                修改手机号
              </h2>
              <div class="form-group">
                <label for="edit-phone">
                  <span class="label-icon">📱</span>
                  手机号
                </label>
                <input
                    type="tel"
                    id="edit-phone"
                    v-model="editValue"
                    placeholder="请输入手机号"
                    maxlength="11"
                    @input="handleInput"
                />
                <p v-if="errorMessage" class="error-message">
                  {{ errorMessage }}
                </p>
              </div>
              <div class="button-group">
                <button class="btn btn-cancel" @click="goBack">
                  取消
                </button>
                <button class="btn btn-save" @click="handleSave" :disabled="isSaving || !isValid">
                  {{ isSaving ? '保存中...' : '保存' }}
                </button>
              </div>
            </div>
          </div>

          <!-- 密码编辑 -->
          <div id="section-password" :class="['tab-pane', { 'active': currentField === 'password' }]">
            <div class="content-card">
              <h2 class="card-title">
                <span class="icon">🔒</span>
                修改密码
              </h2>
              <div class="form-group">
                <label for="edit-password">
                  <span class="label-icon">🔑</span>
                  新密码
                </label>
                <input
                    type="password"
                    id="edit-password"
                    v-model="editValue"
                    placeholder="请输入新密码（6-14位）"
                    minlength="6"
                    maxlength="14"
                    @input="handleInput"
                />
                <p v-if="errorMessage" class="error-message">
                  {{ errorMessage }}
                </p>
              </div>
              <div class="security-tip">
                <span class="tip-icon">🔐</span>
                密码只能包含字母、数字和下划线，长度为6-14位
              </div>
              <div class="button-group">
                <button class="btn btn-cancel" @click="goBack">
                  取消
                </button>
                <button class="btn btn-save" @click="handleSave" :disabled="isSaving || !isValid">
                  {{ isSaving ? '保存中...' : '保存' }}
                </button>
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
import { useRouter, useRoute } from 'vue-router'
import { createLogger } from '@/utils/logger'
import { getToken } from '@/utils/auth'
import { USER_API } from '@/config/api'

const logger = createLogger('EditFieldView')
const router = useRouter()
const route = useRoute()

// 当前字段
const currentField = ref('nickname')

// 内容区域引用
const contentArea = ref(null)

// 表单数据
const editValue = ref('')
const originalValue = ref('')
const isSaving = ref(false)
const errorMessage = ref('')

// 页面标题
const pageTitle = computed(() => {
  const titles = {
    nickname: '修改昵称',
    email: '修改邮箱',
    phone: '修改手机号',
    password: '修改密码'
  }
  return titles[currentField.value] || '编辑信息'
})

// 验证是否有效
const isValid = computed(() => {
  return !errorMessage.value && editValue.value !== originalValue.value && editValue.value.trim() !== ''
})

/**
 * 切换字段
 */
const switchField = (field) => {
  if (currentField.value === field) return
  
  // 如果有未保存的更改，提示用户
  if (editValue.value !== originalValue.value) {
    if (!confirm('有未保存的更改，确定要切换吗？')) {
      return
    }
  }
  
  currentField.value = field
  loadCurrentValue(field)
}

/**
 * 处理输入
 */
const handleInput = () => {
  validateInput()
}

/**
 * 验证输入
 */
const validateInput = () => {
  const value = editValue.value
  
  switch (currentField.value) {
    case 'nickname':
      if (!value.trim()) {
        errorMessage.value = '昵称不能为空'
      } else if (value.length > 20) {
        errorMessage.value = '昵称不能超过20个字符'
      } else {
        errorMessage.value = ''
      }
      break
    
    case 'email':
      if (!value) {
        errorMessage.value = ''
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) {
          errorMessage.value = '请输入有效的邮箱地址'
        } else {
          errorMessage.value = ''
        }
      }
      break
    
    case 'phone':
      if (!value) {
        errorMessage.value = ''
      } else {
        const phoneRegex = /^1[3-9]\d{9}$/
        if (!phoneRegex.test(value)) {
          errorMessage.value = '请输入有效的11位手机号'
        } else {
          errorMessage.value = ''
        }
      }
      break
    
    case 'password':
      if (!value) {
        errorMessage.value = '密码不能为空'
      } else if (value.length < 6 || value.length > 14) {
        errorMessage.value = '密码长度应在6-14位之间'
      } else if (/[^a-zA-Z0-9_]/.test(value)) {
        errorMessage.value = '密码只能包含字母、数字和下划线'
      } else {
        errorMessage.value = ''
      }
      break
    
    default:
      errorMessage.value = ''
  }
}

/**
 * 返回上一页
 */
const goBack = () => {
  if (editValue.value !== originalValue.value) {
    if (confirm('有未保存的更改，确定要离开吗？')) {
      router.back()
    }
  } else {
    router.back()
  }
}

/**
 * 加载当前值
 */
const loadCurrentValue = (field) => {
  if (field === 'nickname') {
    originalValue.value = localStorage.getItem('username') || ''
  } else if (field === 'email') {
    originalValue.value = localStorage.getItem('userEmail') || ''
  } else if (field === 'phone') {
    originalValue.value = localStorage.getItem('userPhone') || ''
  } else if (field === 'password') {
    originalValue.value = ''
  }
  
  editValue.value = originalValue.value
  errorMessage.value = ''
  logger.info(`加载${field}当前值:`, originalValue.value)
}

/**
 * 保存修改
 */
const handleSave = async () => {
  // 验证
  validateInput()
  if (errorMessage.value) {
    alert(errorMessage.value)
    return
  }

  if (editValue.value === originalValue.value) {
    alert('内容未发生变化')
    return
  }

  isSaving.value = true

  try {
    const token = getToken()
    if (!token) {
      alert('用户未登录，请重新登录')
      router.push('/login')
      return
    }

    // 构造请求数据
    const requestData = {
      [currentField.value]: editValue.value
    }

    logger.info(`发送${currentField.value}修改请求:`, requestData)

    // 发送请求到后端
    const response = await fetch(USER_API.UPDATE_PROFILE, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestData)
    })

    const result = await response.json()
    logger.info(`${currentField.value}修改响应:`, result)

    if (response.ok && result.success === true) {
      alert(result.message || '修改成功！')
      
      // 更新 localStorage
      if (currentField.value === 'nickname') {
        localStorage.setItem('username', editValue.value)
      } else if (currentField.value === 'email') {
        localStorage.setItem('userEmail', editValue.value)
      } else if (currentField.value === 'phone') {
        localStorage.setItem('userPhone', editValue.value)
      }
      
      // 返回个人信息页面
      router.back()
    } else {
      alert(result.message || '修改失败')
    }
  } catch (error) {
    logger.error('修改失败:', error)
    alert('网络错误，请稍后重试')
  } finally {
    isSaving.value = false
  }
}

/**
 * 组件挂载时加载当前值
 */
onMounted(() => {
  // 从路由参数获取字段类型
  const field = route.query.field || 'nickname'
  currentField.value = field
  loadCurrentValue(field)
})
</script>

<style scoped>
/* 主容器 */
.edit-field-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
}

/* 标题栏 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* 返回按钮 */
.btn-back {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.btn-back:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

/* 页面标题 */
.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

/* 主内容区 */
.main-content {
  flex: 1;
  overflow: hidden;
}

.content-wrapper {
  display: flex;
  height: 100%;
}

/* 左侧选项卡导航 */
.tabs-sidebar {
  width: 220px;
  background: white;
  border-right: 1px solid #e8e8e8;
  overflow-y: auto;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
}

.tabs-nav {
  padding: 1rem 0;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 1rem 1.5rem;
  border: none;
  background: transparent;
  color: #666;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
  position: relative;
}

.tab-item:hover {
  background: #f5f7fa;
  color: #667eea;
}

.tab-item.active {
  background: linear-gradient(90deg, rgba(102, 126, 234, 0.1) 0%, transparent 100%);
  color: #667eea;
  font-weight: 600;
}

.tab-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
}

.tab-icon {
  font-size: 1.25rem;
}

.tab-text {
  flex: 1;
}

/* 右侧内容区域 */
.tab-content-area {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 2rem;
  min-width: 0;
}

/* 内容卡片 */
.content-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 1.5rem;
  max-width: 800px;
  animation: fadeInUp 0.4s ease;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 卡片标题 */
.card-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 2rem 0;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f0f0f0;
}

.card-title .icon {
  font-size: 1.75rem;
}

/* 表单组 */
.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  color: #333;
  font-weight: 500;
  font-size: 1rem;
}

.label-icon {
  font-size: 1.25rem;
}

.form-group input {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 2px solid #e8e8e8;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  outline: none;
}

.form-group input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* 错误提示 */
.error-message {
  color: #ff4d4f;
  font-size: 0.875rem;
  margin: 0.5rem 0 0 0;
}

/* 字符计数 */
.char-count {
  text-align: right;
  color: #999;
  font-size: 0.875rem;
  margin: 0.5rem 0 0 0;
}

/* 安全提示 */
.security-tip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: #e6f7ff;
  border-left: 4px solid #1890ff;
  border-radius: 4px;
  margin-bottom: 1.5rem;
  color: #096dd9;
  font-size: 0.9rem;
}

.security-tip .tip-icon {
  font-size: 1.25rem;
}

/* 按钮组 */
.button-group {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #f0f0f0;
}

/* 通用按钮 */
.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

/* 取消按钮 */
.btn-cancel {
  background: #f0f0f0;
  color: #666;
}

.btn-cancel:hover {
  background: #e0e0e0;
  transform: translateY(-2px);
}

/* 保存按钮 */
.btn-save {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.btn-save:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #e0e0e0;
  color: #999;
  box-shadow: none;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .header {
    padding: 1rem;
  }

  .page-title {
    font-size: 1.2rem;
  }

  .content-wrapper {
    flex-direction: column;
  }

  .tabs-sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #e8e8e8;
  }

  .tabs-nav {
    display: flex;
    overflow-x: auto;
    padding: 0.5rem;
  }

  .tab-item {
    flex-shrink: 0;
    padding: 0.75rem 1rem;
  }

  .tab-content-area {
    padding: 1rem;
  }

  .content-card {
    padding: 1.5rem;
  }

  .button-group {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
</style>
