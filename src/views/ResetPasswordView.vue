<template>
  <!-- 重置密码页面主容器 -->
  <div class="reset-password-container">
    <!-- 背景图片层 -->
    <div class="background-layer">
      <img :src="randomImage" alt="Background" class="bg-image" @load="onImageLoad" />
      <div v-if="!imageLoaded" class="image-loading">加载中...</div>
    </div>

    <!-- 顶部标题栏 -->
    <header class="header">
      <div class="header-left">
        <h1 class="title">重置密码</h1>
      </div>
      <div class="header-right">
        <button class="btn btn-back" @click="handleBackToLogin">
          <span class="icon">←</span>
          返回登录
        </button>
      </div>
    </header>

    <!-- 重置密码表单区域 -->
    <main class="main-content">
      <div class="form-wrapper">
        <!-- 第一步：输入用户ID或邮箱 -->
        <transition name="slide-left" mode="out-in">
          <form v-if="currentStep === 1" @submit.prevent="handleNextStep" class="reset-form" key="step1">
            <!-- 用户ID或邮箱输入 -->
            <div class="form-group">
              <label for="userIdOrEmail">
                <span class="label-icon">👤</span>
                用户ID或邮箱
              </label>
              <input
                  type="text"
                  id="userIdOrEmail"
                  v-model="resetForm.userIdOrEmail"
                  placeholder="请输入用户ID或邮箱地址"
                  required
                  autocomplete="username"
                  @input="handleInput"
              />
              <p v-if="inputError" class="error-message">{{ inputError }}</p>
            </div>

            <!-- 下一步按钮 -->
            <div class="button-group">
              <button type="submit" class="btn btn-next" :disabled="!isValid || isLoading">
                {{ isLoading ? '查询中...' : '下一步' }}
              </button>
            </div>
          </form>

          <!-- 第二步：选择验证方式 -->
          <div v-else-if="currentStep === 2" class="reset-form step2" key="step2">
            <h2 class="step-title">请选择验证方式</h2>
            
            <!-- 显示用户ID -->
            <div v-if="userInfo.id" class="user-id-display">
              <span class="id-label">当前ID：</span>
              <span class="id-value">{{ userInfo.id }}</span>
            </div>
            
            <div class="verification-methods">
              <!-- 邮箱验证 -->
              <button 
                v-if="userInfo.email" 
                class="btn-verify-method" 
                @click="selectVerifyMethod('email')"
              >
                <span class="method-icon">📧</span>
                <div class="method-info">
                  <div class="method-name">邮箱验证</div>
                  <div class="method-value">{{ maskEmail(userInfo.email) }}</div>
                </div>
              </button>

              <!-- 手机验证 -->
              <button 
                v-if="userInfo.phone" 
                class="btn-verify-method" 
                @click="selectVerifyMethod('phone')"
              >
                <span class="method-icon">📱</span>
                <div class="method-info">
                  <div class="method-name">手机验证</div>
                  <div class="method-value">{{ maskPhone(userInfo.phone) }}</div>
                </div>
              </button>

              <!-- 密保问题验证 -->
              <button 
                v-if="userInfo.securityQuestion" 
                class="btn-verify-method" 
                @click="selectVerifyMethod('security')"
              >
                <span class="method-icon">❓</span>
                <div class="method-info">
                  <div class="method-name">密保问题</div>
                  <div class="method-value">{{ userInfo.securityQuestionText }}</div>
                </div>
              </button>
            </div>

            <!-- 按钮组（只保留上一步） -->
            <div class="button-group button-group-single">
              <button class="btn btn-prev" @click="handlePrevStep">
                上一步
              </button>
            </div>
          </div>

          <!-- 第三步：验证身份 -->
          <div v-else-if="currentStep === 3" class="reset-form step3" key="step3">
            <h2 class="step-title">验证身份</h2>
            
            <!-- 邮箱验证 -->
            <div v-if="verifyMethod === 'email'" class="verify-section">
              <div class="verify-info">
                <span class="info-icon">📧</span>
                <div class="info-text">
                  <div class="info-label">邮箱验证</div>
                  <div class="info-value">验证码已发送至 {{ maskEmail(userInfo.email) }}</div>
                </div>
              </div>
              
              <div class="form-group">
                <label for="verification-code">
                  <span class="label-icon">🔢</span>
                  验证码
                </label>
                <div class="verification-input-group">
                  <input
                    type="text"
                    id="verification-code"
                    v-model="resetForm.verificationCode"
                    placeholder="请输入6位验证码"
                    maxlength="6"
                    class="verification-code-input"
                  />
                  <button 
                    type="button"
                    class="btn-resend"
                    :disabled="countdownTimer.isRunning()"
                    @click="sendVerificationCode"
                  >
                    {{ countdownTimer.isRunning() ? `${remaining}s` : '重新发送' }}
                  </button>
                </div>
              </div>
            </div>
            
            <!-- 手机验证 -->
            <div v-else-if="verifyMethod === 'phone'" class="verify-section">
              <div class="verify-info">
                <span class="info-icon">📱</span>
                <div class="info-text">
                  <div class="info-label">手机验证</div>
                  <div class="info-value">验证码已发送至 {{ maskPhone(userInfo.phone) }}</div>
                </div>
              </div>
              
              <div class="form-group">
                <label for="phone-verification-code">
                  <span class="label-icon">🔢</span>
                  验证码
                </label>
                <div class="verification-input-group">
                  <input
                    type="text"
                    id="phone-verification-code"
                    v-model="resetForm.verificationCode"
                    placeholder="请输入6位验证码"
                    maxlength="6"
                    class="verification-code-input"
                  />
                  <button 
                    type="button"
                    class="btn-resend"
                    :disabled="countdownTimer.isRunning()"
                    @click="sendVerificationCode"
                  >
                    {{ countdownTimer.isRunning() ? `${remaining}s` : '重新发送' }}
                  </button>
                </div>
              </div>
            </div>
            
            <!-- 密保问题验证 -->
            <div v-else-if="verifyMethod === 'security'" class="verify-section">
              <div class="verify-info">
                <span class="info-icon">❓</span>
                <div class="info-text">
                  <div class="info-label">密保问题</div>
                  <div class="info-value">{{ userInfo.securityQuestionText }}</div>
                </div>
              </div>
              
              <div class="form-group">
                <label for="security-answer">
                  <span class="label-icon">✏️</span>
                  答案
                </label>
                <input
                  type="text"
                  id="security-answer"
                  v-model="resetForm.securityAnswer"
                  placeholder="请输入密保问题答案"
                  class="security-answer-input"
                />
              </div>
            </div>
            
            <!-- 按钮组 -->
            <div class="button-group button-group-vertical">
              <button 
                class="btn btn-next" 
                @click="handleVerify"
                :disabled="!canProceedToNext || isLoading"
              >
                {{ isLoading ? '验证中...' : '下一步' }}
              </button>
              <button class="btn btn-prev" @click="handlePrevStepFromVerify">
                上一步
              </button>
            </div>
          </div>

          <!-- 第四步：设置新密码 -->
          <div v-else-if="currentStep === 4" class="reset-form step4" key="step4">
            <h2 class="step-title">设置新密码</h2>
            
            <div class="form-group">
              <label for="new-password">
                <span class="label-icon">🔒</span>
                新密码
              </label>
              <input
                type="password"
                id="new-password"
                v-model="resetForm.newPassword"
                placeholder="请输入新密码（6-14位）"
                minlength="6"
                maxlength="14"
              />
              <p v-if="passwordError" class="error-message">{{ passwordError }}</p>
            </div>
            
            <div class="form-group">
              <label for="confirm-password">
                <span class="label-icon">🔒</span>
                确认密码
              </label>
              <input
                type="password"
                id="confirm-password"
                v-model="resetForm.confirmPassword"
                placeholder="请再次输入新密码"
              />
              <p v-if="confirmPasswordError" class="error-message">{{ confirmPasswordError }}</p>
            </div>
            
            <div class="button-group button-group-vertical">
              <button 
                class="btn btn-next" 
                @click="handleResetPassword"
                :disabled="!canResetPassword || isLoading"
              >
                {{ isLoading ? '重置中...' : '确认重置' }}
              </button>
              <button class="btn btn-prev" @click="handlePrevStepFromReset">
                上一步
              </button>
            </div>
          </div>
        </transition>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { createLogger } from '@/utils/logger'
import { fetchRSAKey, encryptPassword } from '@/utils/rsa'
import { getSessionId, clearSessionId, createNewSessionId } from '@/utils/sessionId'
import { deleteCookie } from '@/utils/cookie'
import { AUTH_API } from '@/config/api'
import { showError, showSuccess } from '@/utils/toast'
import { sendVerificationCode } from '@/utils/email'
import { sendPhoneVerificationCode } from '@/utils/phone'
import { CountdownTimer } from '@/utils/email'

const logger = createLogger('ResetPasswordView')

const router = useRouter()

// 当前步骤
const currentStep = ref(1)

// 验证方式 ('email' | 'phone' | 'security')
const verifyMethod = ref('')

// 表单数据
const resetForm = ref({
  userIdOrEmail: '',      // 第一步输入
  verificationCode: '',   // 第三步：验证码
  securityAnswer: '',     // 第三步：密保答案
  newPassword: '',        // 第四步：新密码
  confirmPassword: ''     // 第四步：确认密码
})

// 用户信息（从后端获取）
const userInfo = ref({
  id: '',
  email: '',
  phone: '',
  securityQuestion: null,
  securityQuestionText: ''
})

// 随机背景图片
const randomImage = ref('')
const imageLoaded = ref(false)

// 输入错误信息
const inputError = ref('')

// 加载状态
const isLoading = ref(false)

// RSA公钥和会话ID
const rsaPublicKey = ref('')
const sessionId = ref('')

// 临时令牌（第三步获取，第四步使用）
const resetToken = ref('')

// 倒计时
const countdownTimer = new CountdownTimer(60)
const remaining = ref(0)

/**
 * 获取随机背景图片
 */
const getRandomImage = () => {
  imageLoaded.value = false
  const timestamp = new Date().getTime()
  const width = 800
  const height = 600
  // 使用多个图片源，提高成功率
  const imageSources = [
    `https://picsum.photos/${width}/${height}?random=${timestamp}`,
    `https://source.unsplash.com/random/${width}x${height}?nature,technology`,
    `https://loremflickr.com/${width}/${height}/nature`
  ]
  // 默认使用第一个源
  randomImage.value = imageSources[0]
  logger.debug('设置背景图片:', randomImage.value)
}

/**
 * 图片加载完成回调
 */
const onImageLoad = () => {
  imageLoaded.value = true
  logger.debug('背景图片加载成功')
}

/**
 * 图片加载失败回调
 */
const onImageError = () => {
  logger.warn('背景图片加载失败，使用备用图片')
  imageLoaded.value = true
}

/**
 * 验证用户ID格式（10001开始的纯数字）
 */
const isValidUserId = (value) => {
  return /^10001\d*$/.test(value)
}

/**
 * 验证邮箱格式
 */
const isValidEmail = (value) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(value)
}

/**
 * 计算属性：输入是否有效
 */
const isValid = computed(() => {
  const value = resetForm.value.userIdOrEmail.trim()
  if (!value) return false
  
  // 检查是否是有效的用户ID或邮箱
  return isValidUserId(value) || isValidEmail(value)
})

/**
 * 处理输入事件
 */
const handleInput = () => {
  const value = resetForm.value.userIdOrEmail.trim()
  
  // 清空错误信息
  inputError.value = ''
  
  // 如果输入不为空且格式不正确，显示错误提示
  if (value && !isValidUserId(value) && !isValidEmail(value)) {
    // 检查是否是数字但不符合用户ID格式
    if (/^\d+$/.test(value) && !isValidUserId(value)) {
      inputError.value = '用户ID必须以10001开头'
    }
    // 检查是否看起来像邮箱但格式不正确
    else if (value.includes('@') && !isValidEmail(value)) {
      inputError.value = '请输入有效的邮箱地址'
    }
  }
}

/**
 * 处理下一步
 */
const handleNextStep = async () => {
  // 验证输入
  if (!isValid.value) {
    inputError.value = '请输入有效的用户ID或邮箱地址'
    return
  }

  logger.info('准备进行下一步，输入值:', resetForm.value.userIdOrEmail)
  
  isLoading.value = true

  try {
    // 1. 获取 RSA 公钥和 sessionId
    await initRSAKey()
    
    // 2. 加密用户ID或邮箱
    const encryptedValue = encryptPassword(resetForm.value.userIdOrEmail.trim(), rsaPublicKey.value)
    
    logger.info('发送查找用户请求:', {
      sessionId: sessionId.value,
      encryptedValue: encryptedValue.substring(0, 50) + '...'
    })
    
    // 3. 发送 POST 请求到 /auth/reset_password/find_user
    const response = await fetch(AUTH_API.RESET_PASSWORD_FIND_USER, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId: sessionId.value,
        encryptedUserIdOrEmail: encryptedValue
      })
    })
    
    const result = await response.json()
    logger.info('查找用户响应:', result)
    
    // 4. 处理响应
    if (response.ok && result.success === true) {
      // 保存用户信息
      userInfo.value = {
        id: result.id || '',
        email: result.email || '',
        phone: result.phone || '',
        securityQuestion: result.securityQuestion || null,
        securityQuestionText: result.securityQuestionText || ''
      }
      
      logger.info('找到用户，可用验证方式:', {
        userId: userInfo.value.id,
        hasEmail: !!userInfo.value.email,
        hasPhone: !!userInfo.value.phone,
        hasSecurity: !!userInfo.value.securityQuestion
      })
      
      // 跳转到第二步
      currentStep.value = 2
    } else {
      // 显示错误信息
      showError(result.message || '未找到该用户，请检查输入')
    }
  } catch (error) {
    logger.error('查找用户失败:', error)
    showError('网络错误，请稍后重试')
  } finally {
    isLoading.value = false
  }
}

/**
 * 处理上一步
 */
const handlePrevStep = async () => {
  // 返回第一步，重新获取 RSA 公钥
  currentStep.value = 1
  
  // 清空用户信息
  userInfo.value = {
    id: '',
    email: '',
    phone: '',
    securityQuestion: null,
    securityQuestionText: ''
  }
  
  // 清除旧的 sessionId 和公钥
  clearSessionId()
  deleteCookie('rsaPublicKey')
  rsaPublicKey.value = ''
  sessionId.value = ''
  
  logger.info('返回第一步，已清除旧密钥')
  
  // 重新初始化 RSA 密钥
  await initRSAKey()
}

/**
 * 选择验证方式（点击按钮时调用）
 */
const selectVerifyMethod = async (method) => {
  logger.info('选择验证方式:', method)
  
  isLoading.value = true
  
  try {
    // 1. 清除旧的 SessionId 和公钥
    clearSessionId()
    deleteCookie('rsaPublicKey')
    rsaPublicKey.value = ''
    sessionId.value = ''
    
    logger.info('已清除旧的密钥和 SessionId')
    
    // 2. 生成新的 SessionId（有效期5分钟）
    sessionId.value = createNewSessionId()
    logger.info('生成新的 SessionId:', sessionId.value)
    
    // 3. 获取新的 RSA 公钥（所有验证方式都需要）
    const keyData = await fetchRSAKey()
    rsaPublicKey.value = keyData.publicKey
    sessionId.value = keyData.sessionId
    
    logger.info('获取新的 RSA 公钥成功')
    
    // 4. 设置验证方式
    verifyMethod.value = method
    
    // 5. 清空第三步的表单数据
    resetForm.value.verificationCode = ''
    resetForm.value.securityAnswer = ''
    
    // 6. 跳转到第三步
    currentStep.value = 3
    
    // 7. 如果是邮箱或手机，自动发送验证码
    if (method === 'email' || method === 'phone') {
      await sendVerificationCodeHandler()
    }
    
  } catch (error) {
    logger.error('初始化验证失败:', error)
    showError('系统初始化失败，请重试')
  } finally {
    isLoading.value = false
  }
}

/**
 * 返回登录页面
 */
const handleBackToLogin = () => {
  logger.info('返回登录页面')
  router.push('/login')
}

/**
 * 初始化RSA密钥
 */
const initRSAKey = async () => {
  try {
    logger.info('开始初始化RSA密钥...')
    
    // 获取 sessionId
    sessionId.value = getSessionId()
    logger.info('使用 sessionId:', sessionId.value)
    
    // 调用 fetchRSAKey 获取公钥
    const keyData = await fetchRSAKey()
    rsaPublicKey.value = keyData.publicKey
    sessionId.value = keyData.sessionId
    
    logger.info('RSA密钥初始化成功')
    logger.debug('公钥:', rsaPublicKey.value.substring(0, 50) + '...')
    logger.debug('会话ID:', sessionId.value)
  } catch (error) {
    logger.error('RSA密钥初始化失败:', error)
    showError('系统初始化失败：无法获取RSA密钥。请检查后端服务是否正常运行')
    throw error
  }
}

/**
 * 邮箱地址打码
 */
const maskEmail = (email) => {
  if (!email) return ''
  const [name, domain] = email.split('@')
  if (!domain) return email
  const maskedName = name.charAt(0) + '***' + name.charAt(name.length - 1)
  return `${maskedName}@${domain}`
}

/**
 * 手机号打码
 */
const maskPhone = (phone) => {
  if (!phone) return ''
  if (phone.length !== 11) return phone
  return phone.substring(0, 3) + '****' + phone.substring(7)
}

/**
 * 发送验证码（邮箱/手机）
 */
const sendVerificationCodeHandler = async () => {
  try {
    logger.info(`开始发送${verifyMethod.value}验证码...`)
    
    let result
    if (verifyMethod.value === 'email') {
      // 调用邮箱验证码接口（复用）
      result = await sendVerificationCode(userInfo.value.email, sessionId.value)
    } else if (verifyMethod.value === 'phone') {
      // 调用手机验证码接口（复用）
      result = await sendPhoneVerificationCode(userInfo.value.phone, sessionId.value)
    }
    
    if (result.success) {
      showSuccess(result.message || '验证码已发送')
      
      // 启动倒计时
      countdownTimer.start(
        (remainingTime) => {
          remaining.value = remainingTime
        },
        () => {
          remaining.value = 0
          logger.info('倒计时结束，可以重新发送')
        }
      )
    } else {
      showError(result.message || '验证码发送失败')
    }
  } catch (error) {
    logger.error('发送验证码异常:', error)
    showError('网络错误，请稍后重试')
  }
}

/**
 * 计算属性：是否可以进入下一步
 */
const canProceedToNext = computed(() => {
  if (verifyMethod.value === 'email' || verifyMethod.value === 'phone') {
    // 邮箱/手机：需要6位验证码
    return resetForm.value.verificationCode.length === 6
  } else if (verifyMethod.value === 'security') {
    // 密保：需要非空答案
    return resetForm.value.securityAnswer.trim().length > 0
  }
  return false
})

/**
 * 处理验证（第三步 → 第四步）
 */
const handleVerify = async () => {
  if (!canProceedToNext.value) {
    showError('请填写完整信息')
    return
  }
  
  isLoading.value = true
  
  try {
    let result
    
    if (verifyMethod.value === 'email') {
      // 邮箱验证
      result = await verifyEmail()
    } else if (verifyMethod.value === 'phone') {
      // 手机验证
      result = await verifyPhone()
    } else if (verifyMethod.value === 'security') {
      // 密保验证
      result = await verifySecurity()
    }
    
    if (result.success) {
      // 保存 resetToken
      resetToken.value = result.resetToken
      logger.info('验证成功，获取到 resetToken')
      
      // 跳转到第四步
      currentStep.value = 4
      showSuccess('验证成功')
    } else {
      showError(result.message || '验证失败')
    }
  } catch (error) {
    logger.error('验证失败:', error)
    showError('网络错误，请稍后重试')
  } finally {
    isLoading.value = false
  }
}

/**
 * 邮箱验证
 */
const verifyEmail = async () => {
  const response = await fetch(AUTH_API.RESET_PASSWORD_VERIFY_EMAIL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: sessionId.value,
      email: userInfo.value.email,
      verificationCode: resetForm.value.verificationCode
    })
  })
  
  return await response.json()
}

/**
 * 手机验证
 */
const verifyPhone = async () => {
  const response = await fetch(AUTH_API.RESET_PASSWORD_VERIFY_PHONE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: sessionId.value,
      phone: userInfo.value.phone,
      verificationCode: resetForm.value.verificationCode
    })
  })
  
  return await response.json()
}

/**
 * 密保验证
 */
const verifySecurity = async () => {
  // 1. 加密答案
  const encryptedAnswer = encryptPassword(
    resetForm.value.securityAnswer,
    rsaPublicKey.value
  )
  
  // 2. 发送请求
  const response = await fetch(AUTH_API.RESET_PASSWORD_VERIFY_SECURITY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: sessionId.value,
      userId: userInfo.value.id,
      encryptedSecurityAnswer: encryptedAnswer
    })
  })
  
  return await response.json()
}

/**
 * 从第三步返回第二步
 */
const handlePrevStepFromVerify = () => {
  // 停止倒计时
  countdownTimer.stop()
  remaining.value = 0
  
  // 清空验证相关数据
  resetForm.value.verificationCode = ''
  resetForm.value.securityAnswer = ''
  verifyMethod.value = ''
  
  // 清除 SessionId 和公钥
  clearSessionId()
  deleteCookie('rsaPublicKey')
  rsaPublicKey.value = ''
  sessionId.value = ''
  
  // 清除 resetToken（回退时失效）
  resetToken.value = ''
  
  // 返回第二步
  currentStep.value = 2
  
  logger.info('从第三步返回第二步，resetToken已失效')
}

/**
 * 密码错误提示
 */
const passwordError = computed(() => {
  const pwd = resetForm.value.newPassword
  if (!pwd) return ''
  if (pwd.length < 6 || pwd.length > 14) {
    return '密码长度必须为6-14位'
  }
  return ''
})

/**
 * 确认密码错误提示
 */
const confirmPasswordError = computed(() => {
  const pwd = resetForm.value.newPassword
  const confirm = resetForm.value.confirmPassword
  if (!confirm) return ''
  if (pwd !== confirm) {
    return '两次输入的密码不一致'
  }
  return ''
})

/**
 * 计算属性：是否可以重置密码
 */
const canResetPassword = computed(() => {
  const pwd = resetForm.value.newPassword
  const confirm = resetForm.value.confirmPassword
  
  // 密码长度6-14位
  if (pwd.length < 6 || pwd.length > 14) return false
  
  // 两次密码一致
  if (pwd !== confirm) return false
  
  return true
})

/**
 * 从第四步返回第三步
 */
const handlePrevStepFromReset = () => {
  // 清空密码相关数据
  resetForm.value.newPassword = ''
  resetForm.value.confirmPassword = ''
  
  // 清除 resetToken（回退时失效）
  resetToken.value = ''
  
  // 清除 SessionId 和公钥
  clearSessionId()
  deleteCookie('rsaPublicKey')
  rsaPublicKey.value = ''
  sessionId.value = ''
  
  // 停止倒计时（如果在运行）
  countdownTimer.stop()
  remaining.value = 0
  
  // 清空验证相关数据
  resetForm.value.verificationCode = ''
  resetForm.value.securityAnswer = ''
  verifyMethod.value = ''
  
  // 返回第二步（而不是第三步），让用户重新选择验证方式
  currentStep.value = 2
  
  logger.info('从第四步返回第二步，所有状态已清除')
}

/**
 * 处理重置密码（最后一步）
 */
const handleResetPassword = async () => {
  if (!canResetPassword.value) {
    showError('请检查密码格式')
    return
  }
  
  // 检查 resetToken 是否存在
  if (!resetToken.value) {
    showError('验证令牌已失效，请重新验证')
    // 返回第二步重新开始
    currentStep.value = 2
    resetToken.value = ''
    return
  }
  
  isLoading.value = true
  
  try {
    logger.info('开始重置密码...')
    
    // 1. 生成新的 SessionId
    clearSessionId()
    deleteCookie('rsaPublicKey')
    sessionId.value = createNewSessionId()
    logger.info('生成新的 SessionId:', sessionId.value)
    
    // 2. 获取新的 RSA 公钥
    const keyData = await fetchRSAKey()
    rsaPublicKey.value = keyData.publicKey
    sessionId.value = keyData.sessionId
    logger.info('获取新的 RSA 公钥成功')
    
    // 3. 加密新密码
    const encryptedPassword = encryptPassword(
      resetForm.value.newPassword,
      rsaPublicKey.value
    )
    logger.info('密码加密完成')
    
    // 4. 发送重置密码请求
    const response = await fetch(AUTH_API.RESET_PASSWORD_RESET, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resetToken.value}`  // 携带 JWT 令牌
      },
      body: JSON.stringify({
        sessionId: sessionId.value,
        encryptedNewPassword: encryptedPassword
      })
    })
    
    const result = await response.json()
    logger.info('重置密码响应:', result)
    
    // 5. 处理响应
    if (response.ok && result.success === true) {
      // 清除所有敏感数据前先保存需要显示的信息
      const userId = userInfo.value.id
      const newPassword = resetForm.value.newPassword
      
      // 清除所有敏感数据
      clearSessionId()
      deleteCookie('rsaPublicKey')
      resetToken.value = ''
      rsaPublicKey.value = ''
      sessionId.value = ''
      
      // 弹出 alert 消息框，显示用户名和新密码
      const message = `密码重置成功！\n\n用户名：${userId}\n新密码：${newPassword}\n\n请妥善保管您的密码，建议立即记录。`
      alert(message)
      
      logger.info('密码重置成功，已显示 alert 提示')
      
      // 跳转到登录页面
      router.push('/login')
    } else {
      showError(result.message || '密码重置失败，请稍后重试')
      
      // 重置失败，清除 resetToken
      resetToken.value = ''
    }
  } catch (error) {
    logger.error('重置密码失败:', error)
    showError('网络错误，请稍后重试')
    
    // 出错时也清除 resetToken
    resetToken.value = ''
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  getRandomImage()
  
  // 页面加载时清除可能存在的旧 resetToken
  // （因为刷新页面后 JWT 令牌应该失效）
  if (resetToken.value) {
    logger.info('检测到旧的 resetToken，已清除')
    resetToken.value = ''
  }
})
</script>

<style scoped>
/* 主容器 */
.reset-password-container {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
}

/* 背景图片层 */
.background-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.bg-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: blur(8px); /* 模糊效果 8px */
  transform: scale(1.1); /* 放大 1.1 倍避免模糊边缘 */
  transition: opacity 0.3s ease;
}

.image-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 1.2rem;
  background: rgba(0, 0, 0, 0.5);
  padding: 1rem 2rem;
  border-radius: 8px;
}

/* 顶部标题栏 */
.header {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
}

.title {
  color: white;
  font-size: 1.75rem;
  font-weight: 600;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
}

/* 返回按钮 */
.btn-back {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: white;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.btn-back:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
}

.btn-back .icon {
  font-size: 1.1rem;
}

/* 主内容区 */
.main-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  min-height: calc(100vh - 80px);
}

/* 表单包装器 */
.form-wrapper {
  width: 100%;
  max-width: 500px;
}

/* 重置密码表单 */
.reset-form {
  background: rgba(255, 255, 255, 0.98); /* 98% 不透明度白色背景 */
  backdrop-filter: blur(10px); /* 背景模糊效果 */
  padding: 3rem;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  animation: fadeInUp 0.5s ease;
}

/* 第二步表单样式 */
.reset-form.step2 {
  min-height: 400px;
}

/* 第三步表单样式 */
.reset-form.step3 {
  min-height: 450px;
}

/* 第四步表单样式 */
.reset-form.step4 {
  min-height: 400px;
}

/* 步骤标题 */
.step-title {
  text-align: center;
  color: #333;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 2rem 0;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f0f0f0;
}

/* 用户ID显示 */
.user-id-display {
  text-align: center;
  padding: 0.75rem 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
}

.id-label {
  color: #666;
  font-weight: 500;
}

.id-value {
  color: #667eea;
  font-weight: 600;
  font-family: 'Courier New', monospace;
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

/* 表单组 */
.form-group {
  margin-bottom: 2rem;
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
  box-sizing: border-box;
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

/* 按钮组 */
.button-group {
  margin-top: 2rem;
}

/* 下一步按钮 */
.btn-next {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-next:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

.btn-next:active:not(:disabled) {
  transform: translateY(0);
}

.btn-next:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #e0e0e0;
  color: #999;
  box-shadow: none;
}

/* 上一步按钮 */
.btn-prev {
  width: 100%;
  padding: 1rem;
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-prev:hover {
  background: #667eea;
  color: white;
  transform: translateY(-2px);
}

/* 垂直按钮组 */
.button-group-vertical {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 2rem;
}

/* 单个按钮组 */
.button-group-single {
  margin-top: 2rem;
}

/* 验证信息区域 */
.verify-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: #e6f7ff;
  border-left: 4px solid #1890ff;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.info-icon {
  font-size: 2.5rem;
}

.info-text {
  flex: 1;
}

.info-label {
  color: #333;
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.info-value {
  color: #666;
  font-size: 0.95rem;
}

/* 验证码输入组 */
.verification-input-group {
  display: flex;
  gap: 1rem;
}

.verification-code-input {
  flex: 1;
}

.btn-resend {
  padding: 0.875rem 1.5rem;
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.btn-resend:hover:not(:disabled) {
  background: #667eea;
  color: white;
}

.btn-resend:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  border-color: #d9d9d9;
  color: #999;
}

/* 密保答案输入框 */
.security-answer-input {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 2px solid #e8e8e8;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.security-answer-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* 验证方式列表 */
.verification-methods {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

/* 验证方式按钮 */
.btn-verify-method {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  background: #f8f9fa;
  border: 2px solid #e8e8e8;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
}

.btn-verify-method:hover {
  background: #e6f7ff;
  border-color: #667eea;
  transform: translateX(5px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.method-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.method-info {
  flex: 1;
}

.method-name {
  color: #333;
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.method-value {
  color: #666;
  font-size: 0.9rem;
}

/* 滑动动画 */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.4s ease;
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(50px);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-50px);
}

/* 移动端响应式适配 */
@media (max-width: 768px) {
  .header {
    padding: 1rem;
  }

  .title {
    font-size: 1.4rem;
  }

  .btn-back {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
  }

  .main-content {
    padding: 1rem;
  }

  .reset-form {
    padding: 2rem;
  }
}
</style>
