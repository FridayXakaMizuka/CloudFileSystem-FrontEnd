<template>
  <!-- 二次验证页面主容器 -->
  <div class="two-factor-auth-container">
    <!-- 背景图片层 -->
    <div class="background-layer">
      <img :src="randomImage" alt="Background" class="bg-image" @load="onImageLoad" />
      <div v-if="!imageLoaded" class="image-loading">加载中...</div>
    </div>

    <!-- 顶部标题栏 -->
    <header class="header">
      <div class="header-left">
        <h1 class="title">二次验证</h1>
      </div>
      <div class="header-right">
        <button class="btn btn-back" @click="handleBackToLogin">
          <span class="icon">←</span>
          返回登录
        </button>
      </div>
    </header>

    <!-- 验证表单区域 -->
    <main class="main-content">
      <div class="form-wrapper">
        <!-- 第一步：选择验证方式 -->
        <transition name="slide-left" mode="out-in">
          <div v-if="currentStep === 1" class="auth-form step1" key="step1">
            <h2 class="step-title">请选择验证方式</h2>
            
            <!-- 显示用户ID -->
            <div v-if="userInfo.userId" class="user-id-display">
              <span class="id-label">用户ID：</span>
              <span class="id-value">{{ userInfo.userId }}</span>
            </div>
            
            <!-- 显示密保问题（如果后端提供） -->
            <div v-if="securityQuestion" class="security-question-display">
              <span class="question-label">密保问题：</span>
              <span class="question-value">{{ securityQuestion }}</span>
            </div>
            
            <div class="verification-methods">
              <!-- 邮箱验证 -->
              <button 
                class="btn-verify-method" 
                @click="selectVerifyMethod('email')"
                :disabled="!userInfo.email"
                :class="{ 'disabled': !userInfo.email }"
              >
                <span class="method-icon">📧</span>
                <div class="method-info">
                  <div class="method-name">邮箱验证</div>
                  <div class="method-value">{{ userInfo.email ? maskEmail(userInfo.email) : '未设置邮箱' }}</div>
                </div>
              </button>

              <!-- 手机验证 -->
              <button 
                class="btn-verify-method" 
                @click="selectVerifyMethod('phone')"
                :disabled="!userInfo.phone"
                :class="{ 'disabled': !userInfo.phone }"
              >
                <span class="method-icon">📱</span>
                <div class="method-info">
                  <div class="method-name">手机验证</div>
                  <div class="method-value">{{ userInfo.phone ? maskPhone(userInfo.phone) : '未设置手机' }}</div>
                </div>
              </button>

              <!-- 密保问题验证 -->
              <button 
                class="btn-verify-method" 
                @click="selectVerifyMethod('security')"
                :disabled="!securityQuestion"
                :class="{ 'disabled': !securityQuestion }"
              >
                <span class="method-icon">❓</span>
                <div class="method-info">
                  <div class="method-name">密保问题</div>
                  <div class="method-value">{{ securityQuestion || '未设置密保问题' }}</div>
                </div>
              </button>
            </div>

            <!-- 按钮组 -->
            <div class="button-group button-group-single">
              <button class="btn btn-prev" @click="handleBackToLogin">
                返回登录
              </button>
            </div>
          </div>

          <!-- 第二步：验证身份 -->
          <div v-else-if="currentStep === 2" class="auth-form step2" key="step2">
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
                    v-model="verifyForm.verificationCode"
                    placeholder="请输入6位验证码"
                    maxlength="6"
                    class="verification-code-input"
                  />
                  <button 
                    type="button"
                    class="btn-resend"
                    :disabled="countdownTimer.isRunning()"
                    @click="sendVerificationCodeHandler"
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
                    v-model="verifyForm.verificationCode"
                    placeholder="请输入6位验证码"
                    maxlength="6"
                    class="verification-code-input"
                  />
                  <button 
                    type="button"
                    class="btn-resend"
                    :disabled="countdownTimer.isRunning()"
                    @click="sendVerificationCodeHandler"
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
                  <div class="info-value">{{ securityQuestion }}</div>
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
                  v-model="verifyForm.securityAnswer"
                  placeholder="请输入密保问题答案"
                  class="security-answer-input"
                />
              </div>
            </div>
            
            <!-- 错误提示 -->
            <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
            
            <!-- 按钮组 -->
            <div class="button-group">
              <button class="btn btn-prev" @click="handlePrevStep">
                上一步
              </button>
              <button 
                class="btn btn-verify" 
                @click="handleVerify"
                :disabled="!canProceedToNext || isLoading"
              >
                {{ isLoading ? '验证中...' : '验证' }}
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
import { useRouter, useRoute } from 'vue-router'
import { createLogger } from '@/utils/logger'
import { CountdownTimer } from '@/utils/email'
import { sendVerificationCode } from '@/utils/email'
import { sendPhoneVerificationCode } from '@/utils/phone'
import { AUTH_API } from '@/config/api'
import { fetchRSAKey } from '@/utils/rsa'
import { getSessionId, createNewSessionId, clearSessionId } from '@/utils/sessionId'
import { getCookie, setCookie, deleteCookie } from '@/utils/cookie'
import { encryptPassword } from '@/utils/rsa'
import { saveAuthInfo } from '@/utils/auth'
import { fetchAllUserInfo } from '@/utils/userInfo'
import { addAllRequestHeaders } from '@/utils/requestHeaders'
import { showSuccess, showError } from '@/utils/toast'

const logger = createLogger('TwoFactorAuth')
const router = useRouter()
const route = useRoute()

// 状态变量
const currentStep = ref(1)
const verifyMethod = ref('')
const isLoading = ref(false)
const imageLoaded = ref(false)
const randomImage = ref('')
const remaining = ref(0)
const errorMessage = ref('')

// 倒计时定时器
const countdownTimer = new CountdownTimer(60)  // 60秒倒计时

// RSA 公钥和 SessionId
const rsaPublicKey = ref('')
const sessionId = ref('')

// 用户信息（从登录响应中获取）
const userInfo = ref({
  userId: '',
  email: '',
  phone: ''
})

// 密保问题（从后端响应中获取）
const securityQuestion = ref('')
const securityQuestionId = ref(null)

// 验证表单
const verifyForm = ref({
  verificationCode: '',
  securityAnswer: ''
})

/**
 * 计算属性：是否可以验证
 */
const canProceedToNext = computed(() => {
  if (verifyMethod.value === 'email' || verifyMethod.value === 'phone') {
    return verifyForm.value.verificationCode.length === 6
  } else if (verifyMethod.value === 'security') {
    return verifyForm.value.securityAnswer.trim().length > 0
  }
  return false
})

/**
 * 图片加载完成
 */
const onImageLoad = () => {
  imageLoaded.value = true
}

/**
 * 获取随机背景图片
 */
const getRandomImage = () => {
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
 * 初始化 - 从路由参数获取用户信息和密保问题
 */
const initFromRoute = () => {
  // 从路由 state 获取登录时保存的信息
  const state = history.state
  
  logger.info('========== 二次验证页面初始化 ==========')
  logger.info('路由 state:', state)
  logger.info('路由 state 完整数据:', JSON.stringify(state, null, 2))
  
  if (state && state.userInfo) {
    userInfo.value = state.userInfo
    logger.info('从路由获取用户信息:', userInfo.value)
    logger.info('用户信息完整数据:', JSON.stringify(userInfo.value, null, 2))
  } else {
    logger.error('路由 state 中未找到 userInfo!')
  }
  
  if (state && state.securityQuestion) {
    securityQuestion.value = state.securityQuestion
    logger.info('从路由获取密保问题:', securityQuestion.value)
  } else {
    logger.warn('路由 state 中未找到 securityQuestion')
  }
  
  if (state && state.securityQuestionId !== undefined) {
    securityQuestionId.value = state.securityQuestionId
    logger.info('从路由获取密保问题ID:', securityQuestionId.value)
  } else {
    logger.warn('路由 state 中未找到 securityQuestionId')
  }
  
  // 重要：使用登录时的 sessionId，不要生成新的
  if (state && state.sessionId) {
    sessionId.value = state.sessionId
    logger.info('✅ 使用登录时的 sessionId:', sessionId.value)
  } else {
    logger.error('❌ 路由 state 中未找到 sessionId！')
    logger.error('将无法进行二次验证，请返回登录页重试')
    showError('系统错误：缺少会话信息，请返回登录页重试')
    setTimeout(() => {
      router.push('/login')
    }, 2000)
    return
  }
  
  logger.info('最终用户信息:', {
    userId: userInfo.value.userId,
    email: userInfo.value.email || '(空)',
    phone: userInfo.value.phone || '(空)',
    securityQuestion: securityQuestion.value || '(空)',
    securityQuestionId: securityQuestionId.value,
    sessionId: sessionId.value
  })
  
  // 检查必要字段
  if (!userInfo.value.userId) {
    logger.error('未找到用户 ID，返回登录页')
    showError('系统错误：缺少用户信息')
    router.push('/login')
    return
  }
  
  // 如果 email 和 phone 都为空，提示用户
  if (!userInfo.value.email && !userInfo.value.phone) {
    logger.warn('登录响应中缺少 email 和 phone 字段')
    logger.warn('请检查后端 /auth/login 接口是否正确返回了这些字段')
    showError('系统配置异常：请联系管理员检查后端配置')
  }
  
  logger.info('========== 初始化完成 ==========')
}

/**
 * 选择验证方式
 */
const selectVerifyMethod = async (method) => {
  logger.info('选择验证方式:', method)
  
  isLoading.value = true
  errorMessage.value = ''
  
  try {
    // 1. 调用 /auth/rsa-key 获取 RSA 公钥（使用登录时的 sessionId）
    const keyData = await fetchRSAKey()
    rsaPublicKey.value = keyData.publicKey
    // 注意：不更新 sessionId，继续使用登录时的 sessionId
    logger.info('获取 RSA 公钥成功')
    
    // 2. 设置验证方式
    verifyMethod.value = method
    
    // 3. 清空表单数据
    verifyForm.value.verificationCode = ''
    verifyForm.value.securityAnswer = ''
    
    // 4. 跳转到第二步
    currentStep.value = 2
    
    // 5. 如果是邮箱或手机，自动发送验证码
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
 * 处理上一步
 */
const handlePrevStep = () => {
  currentStep.value = 1
  verifyMethod.value = ''
  verifyForm.value.verificationCode = ''
  verifyForm.value.securityAnswer = ''
  errorMessage.value = ''
  countdownTimer.stop()
  remaining.value = 0
}

/**
 * 返回登录页面
 */
const handleBackToLogin = () => {
  logger.info('返回登录页面')
  router.push('/login')
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
 * 发送验证码（邮箱/手机）- 本地处理器
 */
const sendVerificationCodeHandler = async () => {
  try {
    logger.info(`开始发送${verifyMethod.value}验证码...`)
    
    let result
    if (verifyMethod.value === 'email') {
      result = await sendVerificationCode(userInfo.value.email, sessionId.value)
    } else if (verifyMethod.value === 'phone') {
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
 * 处理验证
 */
const handleVerify = async () => {
  if (!canProceedToNext.value) {
    showError('请填写完整信息')
    return
  }
  
  isLoading.value = true
  errorMessage.value = ''
  
  try {
    let result
    
    if (verifyMethod.value === 'email') {
      // 邮箱验证
      result = await verifyByEmail()
    } else if (verifyMethod.value === 'phone') {
      // 手机验证
      result = await verifyByPhone()
    } else if (verifyMethod.value === 'security') {
      // 密保问题验证
      result = await verifyBySecurityAnswer()
    }
    
    if (result && result.success) {
      // 验证成功，保存认证信息并跳转
      showSuccess(result.message || '验证成功！')
      
      // 保存 JWT 令牌和用户信息
      if (result.token) {
        saveAuthInfo(result.token, {
          userId: userInfo.value.userId,
          userType: result.userType,
          homeDirectory: result.homeDirectory
        })
        
        // 清除 Cookie 中的 RSA 密钥和 sessionId
        deleteCookie('rsaPublicKey')
        clearSessionId()
        
        // 获取所有个人信息并缓存
        logger.info('验证成功，开始获取用户信息...')
        const allUserInfo = await fetchAllUserInfo()
        
        if (allUserInfo) {
          logger.info('用户信息获取成功')
        }
        
        // 跳转到首页
        setTimeout(() => {
          router.push('/')
        }, 1000)
      }
    } else {
      // 验证失败
      errorMessage.value = result?.message || '验证失败，请重试'
      showError(errorMessage.value)
    }
  } catch (error) {
    logger.error('验证异常:', error)
    errorMessage.value = '网络错误，请稍后重试'
    showError(errorMessage.value)
  } finally {
    isLoading.value = false
  }
}

/**
 * 邮箱验证
 */
const verifyByEmail = async () => {
  // 构建请求头
  const headers = new Headers({
    'Content-Type': 'application/json'
  })
  
  // 添加所有请求头（设备信息 + 设备指纹 + IP）
  await addAllRequestHeaders(headers)
  
  const response = await fetch(AUTH_API.VERIFY_EMAIL, {
    method: 'POST',
    credentials: 'include',
    headers: headers,
    body: JSON.stringify({
      sessionId: sessionId.value,
      userId: userInfo.value.userId,
      verificationCode: verifyForm.value.verificationCode
    })
  })
  
  return await response.json()
}

/**
 * 手机验证
 */
const verifyByPhone = async () => {
  const headers = new Headers({
    'Content-Type': 'application/json'
  })
  
  // 添加所有请求头（设备信息 + 设备指纹 + IP）
  await addAllRequestHeaders(headers)
  
  const response = await fetch(AUTH_API.VERIFY_PHONE, {
    method: 'POST',
    credentials: 'include',
    headers: headers,
    body: JSON.stringify({
      sessionId: sessionId.value,
      userId: userInfo.value.userId,
      verificationCode: verifyForm.value.verificationCode
    })
  })
  
  return await response.json()
}

/**
 * 密保问题验证
 */
const verifyBySecurityAnswer = async () => {
  // 加密答案
  const encryptedAnswer = encryptPassword(verifyForm.value.securityAnswer, rsaPublicKey.value)
  
  const headers = new Headers({
    'Content-Type': 'application/json'
  })
  
  // 添加所有请求头（设备信息 + 设备指纹 + IP）
  await addAllRequestHeaders(headers)
  
  const response = await fetch(AUTH_API.VERIFY_SECURITY_ANSWER, {
    method: 'POST',
    credentials: 'include',
    headers: headers,
    body: JSON.stringify({
      sessionId: sessionId.value,
      userId: userInfo.value.userId,
      encryptedAnswer: encryptedAnswer
    })
  })
  
  return await response.json()
}

onMounted(() => {
  getRandomImage()
  initFromRoute()
})
</script>

<style scoped>
.two-factor-auth-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.background-layer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
}

.bg-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
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

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.title {
  color: white;
  font-size: 1.8rem;
  margin: 0;
}

.btn-back {
  padding: 0.6rem 1.2rem;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-back:hover {
  background: rgba(255, 255, 255, 0.3);
}

.main-content {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 100px);
  padding: 2rem;
}

.form-wrapper {
  background: white;
  padding: 2.5rem;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 500px;
}

.step-title {
  text-align: center;
  color: #333;
  margin-bottom: 2rem;
  font-size: 1.5rem;
}

.user-id-display,
.security-question-display {
  background: #f5f7fa;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  text-align: center;
}

.id-label,
.question-label {
  color: #666;
  font-size: 0.9rem;
}

.id-value,
.question-value {
  color: #333;
  font-weight: 600;
  margin-left: 0.5rem;
}

.verification-methods {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.btn-verify-method {
  display: flex;
  align-items: center;
  padding: 1.2rem;
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-verify-method:hover {
  background: #e9ecef;
  border-color: #667eea;
  transform: translateY(-2px);
}

.btn-verify-method.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f8f9fa;
  border-color: #e9ecef;
}

.btn-verify-method.disabled:hover {
  transform: none;
}

.method-icon {
  font-size: 2rem;
  margin-right: 1rem;
}

.method-info {
  flex: 1;
  text-align: left;
}

.method-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.3rem;
}

.method-value {
  font-size: 0.9rem;
  color: #666;
}

.verify-section {
  margin-bottom: 2rem;
}

.verify-info {
  display: flex;
  align-items: center;
  padding: 1rem;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.info-icon {
  font-size: 2rem;
  margin-right: 1rem;
}

.info-label {
  font-size: 0.9rem;
  color: #666;
}

.info-value {
  font-size: 1rem;
  color: #333;
  font-weight: 500;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #555;
  font-weight: 500;
}

.label-icon {
  margin-right: 0.5rem;
}

.verification-input-group {
  display: flex;
  gap: 0.8rem;
}

.verification-code-input,
.security-answer-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.verification-code-input:focus,
.security-answer-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.btn-resend {
  padding: 0.75rem 1.2rem;
  background: #667eea;
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.btn-resend:hover:not(:disabled) {
  background: #5568d3;
}

.btn-resend:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.error-message {
  color: #dc3545;
  font-size: 0.9rem;
  margin-top: 1rem;
  text-align: center;
}

.button-group {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.button-group-single {
  justify-content: center;
}

.btn {
  flex: 1;
  padding: 0.9rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-prev {
  background: #f8f9fa;
  color: #666;
  border: 2px solid #e9ecef;
}

.btn-prev:hover {
  background: #e9ecef;
}

.btn-verify {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-verify:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.btn-verify:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 动画 */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.3s ease;
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
