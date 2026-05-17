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
            <button
                class="tab-item"
                :class="{ active: currentField === 'security' }"
                @click="switchField('security')"
            >
              <span class="tab-icon">❓</span>
              <span class="tab-text">密保问题</span>
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

          <!-- 密保问题编辑 -->
          <div id="section-security" :class="['tab-pane', { 'active': currentField === 'security' }]">
            <div class="content-card">
              <h2 class="card-title">
                <span class="icon">❓</span>
                修改密保问题
              </h2>
              
              <!-- 旧密保问题答案 -->
              <div class="form-group">
                <label for="old-security-answer">
                  <span class="label-icon">🔐</span>
                  旧密保问题答案
                </label>
                <input
                    type="text"
                    id="old-security-answer"
                    v-model="oldSecurityAnswer"
                    placeholder="请输入当前密保问题的答案"
                    @input="handleInput"
                />
                <p v-if="oldAnswerError" class="error-message">
                  {{ oldAnswerError }}
                </p>
              </div>
              
              <!-- 新密保问题选择 -->
              <div class="form-group">
                <label for="security-question-select">
                  <span class="label-icon">❓</span>
                  选择新密保问题
                </label>
                <select
                    id="security-question-select"
                    v-model="selectedQuestionId"
                    class="security-question-select"
                    @change="handleInput"
                >
                  <option value="">请选择密保问题</option>
                  <option v-for="question in securityQuestions" :key="question.id" :value="question.id">
                    {{ question.question }}
                  </option>
                </select>
              </div>
              
              <!-- 新密保问题答案 -->
              <div class="form-group">
                <label for="new-security-answer">
                  <span class="label-icon">✏️</span>
                  新密保问题答案
                </label>
                <input
                    type="text"
                    id="new-security-answer"
                    v-model="editValue"
                    placeholder="请输入新密保问题的答案"
                    @input="handleInput"
                />
                <p v-if="errorMessage" class="error-message">
                  {{ errorMessage }}
                </p>
              </div>
              
              <div class="security-tip">
                <span class="tip-icon">⚠️</span>
                修改密保问题需要验证旧答案，请确保您记得当前的密保问题答案
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
import { USER_API, PROFILE_API } from '@/config/api'

const logger = createLogger('EditFieldView')
const router = useRouter()
const route = useRoute()

// 当前字段
const currentField = ref('nickname')

// 内容区域引用
const contentArea = ref(null)

// 表单数据
const editValue = ref('')  // 新密保问题答案（用于 security 字段）
const oldSecurityAnswer = ref('')  // 旧密保问题答案
const selectedQuestionId = ref('')  // 选中的新问题 ID
const originalValue = ref('')
const isSaving = ref(false)
const errorMessage = ref('')
const oldAnswerError = ref('')  // 旧答案错误提示

// 页面标题
const pageTitle = computed(() => {
  const titles = {
    nickname: '修改昵称',
    email: '修改邮箱',
    phone: '修改手机号',
    password: '修改密码',
    security: '修改密保问题'
  }
  return titles[currentField.value] || '编辑信息'
})

// 密保问题列表
const securityQuestions = ref([])

// 验证是否有效
const isValid = computed(() => {
  if (currentField.value === 'security') {
    // 密保问题需要验证：旧答案、新问题ID、新答案
    return !errorMessage.value && 
           !oldAnswerError.value && 
           oldSecurityAnswer.value.trim() !== '' &&
           selectedQuestionId.value !== '' &&
           editValue.value.trim() !== ''
  }
  return !errorMessage.value && editValue.value !== originalValue.value && editValue.value.trim() !== ''
})

/**
 * 切换字段
 */
const switchField = async (field) => {
  if (currentField.value === field) return
  
  // 如果有未保存的更改，提示用户
  if (editValue.value !== originalValue.value || oldSecurityAnswer.value) {
    if (!confirm('有未保存的更改，确定要切换吗？')) {
      return
    }
  }
  
  currentField.value = field
  await loadCurrentValue(field)
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
  if (currentField.value === 'security') {
    // 密保问题特殊验证
    oldAnswerError.value = ''
    errorMessage.value = ''
    
    if (!oldSecurityAnswer.value.trim()) {
      oldAnswerError.value = '请输入旧密保问题答案'
    }
    
    if (!selectedQuestionId.value) {
      errorMessage.value = '请选择新密保问题'
    } else if (!editValue.value.trim()) {
      errorMessage.value = '请输入新密保问题答案'
    }
    
    return
  }
  
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
  const hasChanges = currentField.value === 'security' 
    ? (oldSecurityAnswer.value || selectedQuestionId.value || editValue.value)
    : (editValue.value !== originalValue.value)
  
  if (hasChanges) {
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
const loadCurrentValue = async (field) => {
  if (field === 'nickname') {
    originalValue.value = localStorage.getItem('username') || ''
  } else if (field === 'email') {
    originalValue.value = localStorage.getItem('userEmail') || ''
  } else if (field === 'phone') {
    originalValue.value = localStorage.getItem('userPhone') || ''
  } else if (field === 'password') {
    originalValue.value = ''
  } else if (field === 'security') {
    // 密保问题需要加载问题列表
    await loadSecurityQuestions()
    oldSecurityAnswer.value = ''
    selectedQuestionId.value = ''
    editValue.value = ''
    errorMessage.value = ''
    oldAnswerError.value = ''
    logger.info('加载密保问题列表')
    return  // 直接返回，不需要设置 editValue
  }
  
  editValue.value = originalValue.value
  errorMessage.value = ''
  logger.info(`加载${field}当前值:`, originalValue.value)
}

/**
 * 加载密保问题列表
 */
const loadSecurityQuestions = async () => {
  try {
    const token = getToken()
    if (!token) {
      logger.error('用户未登录')
      return
    }
    
    logger.info('开始获取密保问题列表...')
    
    const response = await fetch(USER_API.SECURITY_QUESTIONS, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.ok) {
      const result = await response.json()
      logger.info('密保问题列表:', result)
      
      if (result.success && result.data) {
        securityQuestions.value = result.data
        logger.info(`已加载 ${securityQuestions.value.length} 个密保问题`)
      }
    } else {
      logger.error('获取密保问题列表失败:', response.status)
    }
  } catch (error) {
    logger.error('加载密保问题列表失败:', error)
  }
}

/**
 * 保存修改
 */
const handleSave = async () => {
  // 验证
  validateInput()
  if (errorMessage.value || oldAnswerError.value) {
    alert(errorMessage.value || oldAnswerError.value)
    return
  }

  if (currentField.value !== 'security' && editValue.value === originalValue.value) {
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

    let response, result
    
    // 密保问题特殊处理
    if (currentField.value === 'security') {
      // 检查 RSA 密钥
      const rsaKeyResponse = await fetch(USER_API.RSA_KEY, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!rsaKeyResponse.ok) {
        alert('获取加密密钥失败')
        return
      }
      
      const rsaResult = await rsaKeyResponse.json()
      const publicKey = rsaResult.data?.publicKey
      
      if (!publicKey) {
        alert('系统初始化失败，请刷新页面重试')
        return
      }
      
      // 导入 RSA 加密函数
      const { encryptPassword } = await import('@/utils/rsa')
      
      // 加密旧答案和新答案
      const encryptedOldAnswer = encryptPassword(oldSecurityAnswer.value, publicKey)
      const encryptedNewAnswer = encryptPassword(editValue.value, publicKey)
      
      // 构造请求数据
      const requestData = {
        oldSecurityAnswer: encryptedOldAnswer,
        securityQuestionId: parseInt(selectedQuestionId.value),
        newSecurityAnswer: encryptedNewAnswer
      }
      
      logger.info('发送密保问题修改请求:', {
        securityQuestionId: selectedQuestionId.value,
        hasOldAnswer: !!oldSecurityAnswer.value,
        hasNewAnswer: !!editValue.value
      })
      
      // 发送 POST 请求到 /profile/security_question/set
      response = await fetch(PROFILE_API.SET_SECURITY_QUESTION, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      })
      
      result = await response.json()
      logger.info('密保问题修改响应:', result)
    } else {
      // 其他字段的处理
      const requestData = {
        [currentField.value]: editValue.value
      }

      logger.info(`发送${currentField.value}修改请求:`, requestData)

      // 发送请求到后端
      response = await fetch(USER_API.UPDATE_PROFILE, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      })

      result = await response.json()
      logger.info(`${currentField.value}修改响应:`, result)
    }

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
onMounted(async () => {
  // 从路由参数获取字段类型
  const field = route.query.field || 'nickname'
  currentField.value = field
  await loadCurrentValue(field)
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

/* 下拉选择框 */
.security-question-select {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 2px solid #e8e8e8;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  outline: none;
  background: white;
  cursor: pointer;
}

.security-question-select:focus {
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
