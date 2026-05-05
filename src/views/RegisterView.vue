<template>
  <!-- 注册页面主容器 -->
  <div class="register-container">
    <!-- 背景图片层 -->
    <div class="background-layer">
      <img :src="randomImage" alt="Background" class="bg-image" @load="onImageLoad" />
      <div v-if="!imageLoaded" class="image-loading">加载中...</div>
    </div>

    <!-- 顶部标题栏 -->
    <header class="header">
      <div class="header-left">
        <h1 class="title">注册</h1>
      </div>
      <div class="header-right">
        <button class="btn btn-back" @click="handleBackToLogin">
          <span class="icon">←</span>
          返回登录
        </button>
      </div>
    </header>

    <!-- 注册表单区域 -->
    <main class="main-content">
      <div class="form-wrapper">
        <form @submit.prevent="handleRegister" class="register-form">
          <!-- 昵称输入 -->
          <div class="form-group">
            <label for="nickname">
              <span class="label-icon">👤</span>
              昵称
            </label>
            <input
                type="text"
                id="nickname"
                v-model="registerForm.nickname"
                placeholder="请输入昵称（字母开头，只含字母、数字和下划线）"
                required
                autocomplete="nickname"
            />
            <p v-if="registerForm.nickname && !isValidNickname(registerForm.nickname)" class="error-message">
              昵称必须以字母开头，只含数字、字母和下划线
            </p>
          </div>

          <!-- 邮箱和验证码输入 -->
          <div class="form-group">
            <label>
              <span class="label-icon">📧</span>
              邮箱地址
            </label>
            <input
                type="email"
                id="email"
                v-model="registerForm.email"
                placeholder="请输入邮箱地址"
                required
                autocomplete="email"
                @blur="handleEmailBlur"
            />
            <div class="verification-row">
              <input
                  type="text"
                  id="verificationCode"
                  v-model="registerForm.verificationCode"
                  placeholder="请输入验证码"
                  required
                  maxlength="6"
                  class="verification-code-input"
              />
              <button 
                type="button" 
                class="btn-verify-code" 
                :disabled="!isEmailValid || isSendingCode || countdownTimer.isRunning()"
                @click="handleSendVerificationCode"
              >
                {{ isSendingCode ? '发送中...' : (countdownTimer.isRunning() ? `${emailCountdownRemaining}s` : '发送验证码') }}
              </button>
            </div>
            <p v-if="emailError" class="error-message">{{ emailError }}</p>
          </div>

          <!-- 手机号输入 -->
          <div class="form-group">
            <label>
              <span class="label-icon">📱</span>
              手机号
            </label>
            <input
                type="tel"
                id="phone"
                v-model="registerForm.phone"
                placeholder="请输入手机号（可选）"
                autocomplete="tel"
                maxlength="11"
                @blur="handlePhoneBlur"
            />
            <div class="verification-row">
              <input
                  type="text"
                  id="phoneVerificationCode"
                  v-model="registerForm.phoneVerificationCode"
                  placeholder="请输入验证码"
                  :required="!!registerForm.phone && registerForm.phone.trim() !== ''"
                  maxlength="6"
                  class="verification-code-input"
              />
              <button 
                type="button" 
                class="btn-verify-code" 
                :disabled="!isPhoneValid || isSendingPhoneCode || phoneCountdownTimer.isRunning()"
                @click="handleSendPhoneVerificationCode"
              >
                {{ isSendingPhoneCode ? '发送中...' : (phoneCountdownTimer.isRunning() ? `${phoneCountdownRemaining}s` : '发送验证码') }}
              </button>
            </div>
            <p v-if="phoneError" class="error-message">{{ phoneError }}</p>
          </div>

          <!-- 密码输入 -->
          <div class="form-group">
            <label for="password">
              <span class="label-icon">🔒</span>
              密码
            </label>
            <input
                type="password"
                id="password"
                v-model="registerForm.password"
                placeholder="请输入密码（6-14位）"
                required
                minlength="6"
                maxlength="14"
                autocomplete="new-password"
                @blur="handlePasswordBlur"
                @focus="handlePasswordFocus"
            />
          </div>


          <!-- 确认密码 -->
          <div class="form-group">
            <label for="confirmPassword">
              <span class="label-icon">🔒</span>
              确认密码
            </label>
            <input
                type="password"
                id="confirmPassword"
                v-model="registerForm.confirmPassword"
                placeholder="请再次输入密码"
                required
                autocomplete="new-password"
                @blur="handleConfirmPasswordBlur"
                @focus="handleConfirmPasswordFocus"
            />
            <p v-if="passwordError" class="error-message">{{ passwordError }}</p>
            <p v-if="passwordTooShortOrTooLong && passwordBlurred && confirmPasswordBlurred" class="error-message">{{ passwordTooShortOrTooLong }}</p>

          </div>

          <!-- 安全问题 -->
          <div class="form-group">
            <label for="securityQuestion">
              <span class="label-icon">❓</span>
              安全问题
            </label>
            <select id="securityQuestion" v-model="registerForm.securityQuestion" required>
              <option value="" disabled>请选择安全问题</option>
              <option v-for="question in securityQuestions" :key="question.id" :value="question.id">
                {{ question.questionText }}
              </option>
            </select>
          </div>

          <!-- 安全问题答案 -->
          <div class="form-group">
            <label for="securityAnswer">
              <span class="label-icon">✏️</span>
              安全问题答案
            </label>
            <input
                type="text"
                id="securityAnswer"
                v-model="registerForm.securityAnswer"
                placeholder="请输入安全问题答案"
                required
            />
          </div>

          <!-- 确认注册按钮 -->
          <div class="button-group">
            <button type="submit" class="btn btn-submit" :disabled="isLoading || !isFormValid">
              {{ isLoading ? '注册中...' : '确认注册' }}
            </button>
          </div>
        </form>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { fetchRSAKey, encryptPassword } from '@/utils/rsa'
import { createLogger } from '@/utils/logger'
import { deleteCookie } from '@/utils/cookie'
import { AUTH_API } from '@/config/api'
import { sendVerificationCode, CountdownTimer } from '@/utils/email'
import { sendPhoneVerificationCode } from '@/utils/phone'
import { showSuccess, showError } from '@/utils/toast'
import { clearSessionId, isValidNickname, isValidPasswordLength, validatePhone } from '@/utils/sessionId'

const logger = createLogger('RegisterView')

// 路由实例
const router = useRouter()

// 注册表单数据
const registerForm = ref({
  nickname: '',
  email: '',
  phone: '',
  phoneVerificationCode: '',  // 手机号验证码
  password: '',
  confirmPassword: '',
  securityQuestion: '',
  securityAnswer: '',
  verificationCode: ''  // 邮箱验证码
})

// 加载状态
const isLoading = ref(false)

// 背景图片
const randomImage = ref('')
const imageLoaded = ref(false)

// 安全问题列表
const securityQuestions = ref([])

// RSA公钥和会话ID
const rsaPublicKey = ref('')
const sessionId = ref('')

// 密码框失焦状态标记
const passwordBlurred = ref(false)           // 密码框是否已失焦
const confirmPasswordBlurred = ref(false)    // 确认密码框是否已失焦

// 邮箱和手机号失焦状态标记
const emailBlurred = ref(false)
const phoneBlurred = ref(false)

// 邮箱验证码相关
const isSendingCode = ref(false)  // 是否正在发送邮箱验证码
const verificationSessionId = ref('')  // 邮箱验证码会话 ID
const countdownTimer = new CountdownTimer(60)  // 邮箱验证码60秒倒计时
const emailCountdownRemaining = ref(0)  // ✅ 邮箱倒计时剩余时间（响应式）

// 手机号验证码相关
const isSendingPhoneCode = ref(false)  // 是否正在发送手机验证码
const phoneVerificationSessionId = ref('')  // 手机验证码会话 ID
const phoneCountdownTimer = new CountdownTimer(60)  // 手机验证码60秒倒计时
const phoneCountdownRemaining = ref(0)  // ✅ 手机倒计时剩余时间（响应式）

/**
 * 密码框失焦处理
 */
const handlePasswordBlur = () => {
  passwordBlurred.value = true  // 标记为已失焦
}

/**
 * 确认密码框失焦处理
 */
const handleConfirmPasswordBlur = () => {
  confirmPasswordBlurred.value = true  // 标记为已失焦
}

/**
 * 密码框聚焦处理
 */
const handlePasswordFocus = () => {
  // 可选：聚焦时隐藏错误提示
  passwordBlurred.value = false
}

/**
 * 确认密码框聚焦处理
 */
const handleConfirmPasswordFocus = () => {
  // 可选：聚焦时隐藏错误提示
  confirmPasswordBlurred.value = false
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
 * 处理发送邮箱验证码
 */
const handleSendVerificationCode = async () => {
  // 验证邮箱格式
  if (!isEmailValid.value) {
    showError('请输入有效的邮箱地址')
    return
  }

  isSendingCode.value = true

  try {
    logger.info('开始发送邮箱验证码...')

    // 调用发送验证码接口（已自动携带 sessionId）
    const result = await sendVerificationCode(registerForm.value.email)

    if (result.success) {
      logger.info('验证码发送成功')

      // 显示成功消息
      showSuccess(result.message || '邮箱验证码已发送')

      // 启动倒计时
      countdownTimer.start(
        (remaining) => {
          logger.debug(`倒计时: ${remaining}s`)
          emailCountdownRemaining.value = remaining
        },
        () => {
          logger.info('倒计时结束，可以重新发送验证码')
          emailCountdownRemaining.value = 0
        }
      )
    } else {
      // 显示错误消息
      showError(result.message || '邮箱验证码发送失败')
    }
  } catch (error) {
    logger.error('发送验证码异常:', error)
    showError('网络错误，请稍后重试')
  } finally {
    isSendingCode.value = false
  }
}

/**
 * 处理发送手机验证码
 */
const handleSendPhoneVerificationCode = async () => {
  // 验证手机号格式
  if (!isPhoneValid.value) {
    showError('请输入有效的11位手机号')
    return
  }

  isSendingPhoneCode.value = true

  try {
    logger.info('开始发送手机验证码...')

    // 调用发送验证码接口（已自动携带 sessionId）
    const result = await sendPhoneVerificationCode(registerForm.value.phone)

    if (result.success) {
      logger.info('手机验证码发送成功')

      // 显示成功消息
      showSuccess(result.message || '手机验证码已发送')

      // 启动倒计时
      phoneCountdownTimer.start(
        (remaining) => {
          logger.debug(`手机验证码倒计时: ${remaining}s`)
          phoneCountdownRemaining.value = remaining
        },
        () => {
          logger.info('手机验证码倒计时结束，可以重新发送')
          phoneCountdownRemaining.value = 0
        }
      )
    } else {
      // 显示错误消息
      showError(result.message || '手机验证码发送失败')
    }
  } catch (error) {
    logger.error('发送手机验证码异常:', error)
    showError('网络错误，请稍后重试')
  } finally {
    isSendingPhoneCode.value = false
  }
}

/**
 * 获取随机背景图片
 */
const getRandomImage = () => {
  imageLoaded.value = false
  const timestamp = new Date().getTime()
  const width = 1920
  const height = 1080
  randomImage.value = `https://picsum.photos/${width}/${height}?random=${timestamp}`
}

/**
 * 图片加载完成回调
 */
const onImageLoad = () => {
  imageLoaded.value = true
}

/**
 * 计算属性：验证两次密码是否一致
 */
const passwordError = computed(() => {
  if (registerForm.value.confirmPassword &&
      registerForm.value.password !== registerForm.value.confirmPassword) {
    return '两次输入的密码不一致'
  }
  return ''
})

/**
 * 计算属性：验证密码长度是否符合要求
 */
const passwordTooShortOrTooLong = computed(() => {
  if (registerForm.value.password.length < 6 ||
      registerForm.value.password.length > 14) {
    return '密码长度应在6-14位之间'
  }
  return ''
})

/**
 * 计算属性：验证邮箱格式
 */
const emailError = computed(() => {
  if (emailBlurred.value && registerForm.value.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(registerForm.value.email)) {
      return '请输入有效的邮箱地址'
    }
  }
  return ''
})

/**
 * 计算属性：邮箱是否有效（用于控制发送验证码按钮）
 */
const isEmailValid = computed(() => {
  if (!registerForm.value.email) return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(registerForm.value.email)
})

/**
 * 计算属性：验证手机号格式
 */
const phoneError = computed(() => {
  if (phoneBlurred.value && registerForm.value.phone) {
    const phoneRegex = /^1[3-9]\d{9}$/
    if (!phoneRegex.test(registerForm.value.phone)) {
      return '请输入有效的11位手机号'
    }
  }
  return ''
})

/**
 * 计算属性：手机号是否有效（用于控制发送验证码按钮）
 */
const isPhoneValid = computed(() => {
  if (!registerForm.value.phone) return false
  const phoneRegex = /^1[3-9]\d{9}$/
  return phoneRegex.test(registerForm.value.phone)
})

/**
 * 计算属性：表单是否有效
 */
const isFormValid = computed(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const phoneRegex = /^1[3-9]\d{9}$/
  
  // 基本字段验证
  const nicknameValid = registerForm.value.nickname && isValidNickname(registerForm.value.nickname)
  const emailValid = registerForm.value.email && emailRegex.test(registerForm.value.email)
  const passwordValid = registerForm.value.password && 
                       registerForm.value.confirmPassword && 
                       registerForm.value.password === registerForm.value.confirmPassword &&
                       isValidPasswordLength(registerForm.value.password)
  const securityValid = registerForm.value.securityQuestion && registerForm.value.securityAnswer
  const emailCodeValid = registerForm.value.verificationCode
  
  const basicFieldsValid = nicknameValid && emailValid && passwordValid && securityValid && emailCodeValid
  
  if (!basicFieldsValid) {
    logger.debug('表单验证失败 - 基本字段:', {
      nicknameValid,
      emailValid,
      passwordValid,
      securityValid,
      emailCodeValid
    })
    return false
  }
  
  // 如果填写了手机号，则必须填写手机验证码且格式正确
  if (registerForm.value.phone && registerForm.value.phone.trim() !== '') {
    const phoneFormatValid = phoneRegex.test(registerForm.value.phone)
    const phoneCodeValid = registerForm.value.phoneVerificationCode && registerForm.value.phoneVerificationCode.length > 0
    
    if (!phoneFormatValid || !phoneCodeValid) {
      logger.debug('表单验证失败 - 手机号相关:', { phoneFormatValid, phoneCodeValid })
    }
    
    return phoneFormatValid && phoneCodeValid
  }
  
  // 如果未填写手机号，则不需要手机验证码
  logger.debug('表单验证通过')
  return true
})

/**
 * 获取安全问题列表
 */
const fetchSecurityQuestions = async () => {
  try {
    const response = await fetch(AUTH_API.SECURITY_QUESTIONS)
    const data = await response.json()
    
    if (data.success && data.code === 200) {
      logger.info('获取安全问题成功:', data.questions)
      securityQuestions.value = data.questions || []
    } else {
      logger.error('获取安全问题失败:', data.message)
      alert('获取安全问题失败，请刷新页面重试')
    }
  } catch (error) {
    logger.error('请求安全问题接口出错:', error)
    alert('网络错误，无法获取安全问题')
  }
}

/**
 * 初始化RSA密钥（直接获取新公钥）
 */
const initRSAKey = async () => {
  try {
    logger.info('开始初始化RSA密钥...')
    
    // 直接调用 /auth/rsa-key 获取新公钥（后端不进行有效性校验）
    const keyData = await fetchRSAKey()
    rsaPublicKey.value = keyData.publicKey
    sessionId.value = keyData.sessionId
    logger.info('RSA密钥初始化成功')
    
    logger.debug('公钥:', rsaPublicKey.value.substring(0, 50) + '...')
    logger.debug('会话ID:', sessionId.value)
  } catch (error) {
    logger.error('RSA密钥初始化失败:', error)
    showError('系统初始化失败：无法获取RSA密钥。请检查后端服务是否正常运行')
  }
}

/**
 * 处理返回登录页面
 */
const handleBackToLogin = () => {
  logger.info('返回登录页面')
  router.push('/login')
}

/**
 * 处理注册提交
 */
const handleRegister = async () => {
  if (!isFormValid.value) {
    showError('请填写完整的注册信息')
    return
  }

  // 检查是否已获取公钥和会话ID
  if (!rsaPublicKey.value || !sessionId.value) {
    showError('系统初始化未完成，请稍后重试')
    return
  }

  isLoading.value = true

  try {
    // 使用RSA加密密码
    const encryptedPassword = encryptPassword(registerForm.value.password, rsaPublicKey.value)

    // 构造请求数据（按照新接口格式）
    const registerData = {
      sessionId: sessionId.value,  // 前端生成的 sessionId
      data: [
        {
          nickname: registerForm.value.nickname,
          email: registerForm.value.email,
          emailVfCode: registerForm.value.verificationCode,  // 邮箱验证码
          phone: registerForm.value.phone || '',  // 手机号（可选，空字符串表示未填写）
          phoneVfCode: registerForm.value.phoneVerificationCode || '',  // 手机验证码（可选）
          encryptedPassword: encryptedPassword,
          securityQuestion: parseInt(registerForm.value.securityQuestion),
          securityAnswer: registerForm.value.securityAnswer
        }
      ]
    }

    logger.info('发送注册请求:', registerData)

    // 发送POST请求到后端
    const response = await fetch(AUTH_API.REGISTER, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(registerData)
    })

    const result = await response.json()
    logger.info('注册响应:', result)

    // 按照后端响应格式处理：code=200 且 success=true 表示成功
    if (response.ok && result.code === 200 && result.success === true) {
      // 注册成功
      const userData = result.data && result.data[0]
      
      // 构造注册成功信息
      let successMessage = '✅ 注册成功！\n\n'
      
      if (userData) {
        successMessage += `用户ID: ${userData.id}\n`
        successMessage += `昵称: ${userData.nickname}\n`
      } else {
        successMessage += `昵称: ${registerForm.value.nickname}\n`
      }
      
      successMessage += `邮箱: ${registerForm.value.email}\n`
      
      if (registerForm.value.phone) {
        successMessage += `手机号: ${registerForm.value.phone}\n`
      }
      
      successMessage += `密码: ${registerForm.value.password}\n\n`
      successMessage += '请妥善保管您的账号信息！'
      
      // 使用 alert 显示注册信息
      alert(successMessage)

      // 清除 Cookie 中的 RSA 密钥和 sessionId
      deleteCookie('rsaPublicKey')
      clearSessionId()
      logger.info('已清除 Cookie 中的 RSA 密钥和 sessionId')

      // 跳转到登录页面
      router.push('/login')
    } else {
      // 注册失败，显示错误信息
      showError(result.message || '注册失败，请稍后重试')
    }
  } catch (error) {
    logger.error('注册请求失败:', error)
    showError('网络错误，请稍后重试')
  } finally {
    isLoading.value = false
  }
}

// 组件挂载时获取背景图片、安全问题列表和RSA公钥
onMounted(() => {
  getRandomImage()
  fetchSecurityQuestions()
  
  // 从Cookie读取并验证RSA密钥
  initRSAKey()
})

// 组件卸载时清理定时器
onBeforeUnmount(() => {
  countdownTimer.destroy()
  phoneCountdownTimer.destroy()
  logger.info('已销毁验证码倒计时定时器')
})
</script>

<style scoped>
/* 注册页面主容器：占满整个视口 */
.register-container {
  width: 100vw; /* 视口宽度的 100% */
  height: 100vh; /* 视口高度的 100% */
  position: relative; /* 相对定位 */
  overflow: hidden; /* 隐藏溢出内容 */
}

/* 背景图片层 */
.background-layer {
  position: absolute; /* 绝对定位 */
  top: 0; /* 顶部对齐 */
  left: 0; /* 左侧对齐 */
  width: 100%; /* 宽度 100% */
  height: 100%; /* 高度 100% */
  z-index: 0; /* 层级为 0（最底层） */
}

/* 背景图片 */
.bg-image {
  width: 100%; /* 宽度 100% */
  height: 100%; /* 高度 100% */
  object-fit: cover; /* 保持比例覆盖 */
  filter: blur(8px); /* 模糊效果 8px */
  transform: scale(1.1); /* 放大 1.1 倍避免模糊边缘 */
}

/* 图片加载提示 */
.image-loading {
  position: absolute; /* 绝对定位 */
  top: 50%; /* 垂直居中 */
  left: 50%; /* 水平居中 */
  transform: translate(-50%, -50%); /* 精确居中 */
  color: white; /* 白色文字 */
  font-size: 1.2rem; /* 字体大小 19.2px */
  background: rgba(0, 0, 0, 0.5); /* 半透明黑色背景 */
  padding: 1rem 2rem; /* 上下 16px，左右 32px 内边距 */
  border-radius: 8px; /* 圆角 8px */
}

/* 顶部标题栏 */
.header {
  position: relative; /* 相对定位 */
  z-index: 10; /* 层级为 10（在背景之上） */
  display: flex; /* 启用 Flexbox 布局 */
  justify-content: space-between; /* 左右两端对齐 */
  align-items: center; /* 垂直居中对齐 */
  padding: 1.5rem 3rem; /* 上下 24px，左右 48px 内边距 */
  background: rgba(255, 255, 255, 0.95); /* 95% 不透明度白色背景 */
  backdrop-filter: blur(10px); /* 背景模糊效果 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); /* 轻微阴影 */
}

/* 标题栏左侧 */
.header-left {
  display: flex; /* 启用 Flexbox 布局 */
  align-items: center; /* 垂直居中对齐 */
}

/* 页面标题 */
.title {
  margin: 0; /* 清除默认外边距 */
  color: #333; /* 深灰色文字 */
  font-size: 1.75rem; /* 字体大小 28px */
  font-weight: 600; /* 字体粗细：半粗体 */
}

/* 标题栏右侧 */
.header-right {
  display: flex; /* 启用 Flexbox 布局 */
  gap: 1rem; /* 按钮间距 16px */
}

/* 通用按钮样式 */
.btn {
  display: flex; /* 启用 Flexbox 布局 */
  align-items: center; /* 垂直居中对齐图标和文字 */
  justify-content: center;
  gap: 0.5rem; /* 图标和文字间距 8px */
  padding: 0.625rem 1.25rem; /* 上下 10px，左右 20px 内边距 */
  border: none; /* 无边框 */
  border-radius: 8px; /* 圆角 8px */
  font-size: 0.95rem; /* 字体大小约 15px */
  font-weight: 500; /* 字体粗细：中等 */
  cursor: pointer; /* 鼠标悬停时显示手型光标 */
  transition: all 0.3s ease; /* 所有属性变化时的过渡动画 */
}

/* 返回登录按钮 */
.btn-back {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); /* 紫色渐变背景 */
  color: white; /* 白色文字 */
}

/* 返回按钮悬停效果 */
.btn-back:hover {
  transform: translateY(-2px); /* 向上移动 2px */
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); /* 紫色阴影 */
}

/* 按钮图标 */
.icon {
  font-size: 1.1rem; /* 图标大小约 17.6px */
}

/* 主内容区域 */
.main-content {
  position: relative; /* 相对定位 */
  z-index: 10; /* 层级为 10（在背景之上） */
  height: calc(100vh - 80px); /* 高度为视口高度减去标题栏 */
  display: flex; /* 启用 Flexbox 布局 */
  align-items: center; /* 垂直居中对齐 */
  justify-content: center; /* 水平居中对齐 */
  padding: 2rem; /* 四周 64px 内边距 */
  overflow-y: auto; /* 垂直方向可滚动 */
}

/* 表单包装器 */
.form-wrapper {
  width: 100%; /* 宽度 100% */
  max-width: 500px; /* 最大宽度 500px */
  margin: auto 0; /* 垂直居中 */
}

/* 注册表单卡片 */
.register-form {
  background: rgba(255, 255, 255, 0.98); /* 98% 不透明度白色背景 */
  backdrop-filter: blur(10px); /* 背景模糊效果 */
  padding: 2.5rem; /* 四周 40px 内边距 */
  border-radius: 16px; /* 圆角 16px */
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2); /* 深度阴影 */
}

/* 表单项组 */
.form-group {
  margin-bottom: 1.5rem; /* 底部外边距 24px */
}

/* 表单项标签 */
.form-group label {
  display: flex; /* 启用 Flexbox 布局 */
  align-items: center; /* 垂直居中对齐 */
  gap: 0.5rem; /* 图标和文字间距 8px */
  margin-bottom: 0.5rem; /* 底部外边距 8px */
  color: #555; /* 灰色文字 */
  font-weight: 500; /* 字体粗细：中等 */
  font-size: 0.95rem; /* 字体大小约 15px */
}

/* 标签图标 */
.label-icon {
  font-size: 1.1rem; /* 图标大小约 17.6px */
}

/* 输入框和下拉框 */
.form-group input,
.form-group select {
  width: 100%; /* 宽度 100% */
  padding: 0.75rem 1rem; /* 上下 12px，左右 16px 内边距 */
  border: 2px solid #e0e0e0; /* 2px 浅灰色边框 */
  border-radius: 8px; /* 圆角 8px */
  font-size: 1rem; /* 字体大小 16px */
  transition: all 0.3s ease; /* 所有属性变化时的过渡动画 */
  box-sizing: border-box; /* 盒模型包含边框和内边距 */
  background: white; /* 白色背景 */
}

/* 输入框聚焦效果 */
.form-group input:focus,
.form-group select:focus {
  outline: none; /* 移除默认轮廓 */
  border-color: #667eea; /* 边框变为紫色 */
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1); /* 紫色光晕 */
}

/* 验证码行（验证码输入框 + 发送按钮） */
.verification-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-top: 0.5rem;
}

/* 验证码输入框 */
.verification-code-input {
  flex: 1;
  min-width: 0;
}

/* 发送验证码按钮 */
.btn-verify-code {
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  min-width: 100px;
}

.btn-verify-code:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-verify-code:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: #ccc;
}

/* 错误提示信息 */
.error-message {
  margin: 0.5rem 0 0 0; /* 顶部外边距 8px */
  color: #ff4d4f; /* 红色文字 */
  font-size: 0.875rem; /* 字体大小 14px */
}

/* 按钮组 */
.button-group {
  margin-top: 2rem; /* 顶部外边距 32px */
}

/* 提交按钮 */
.btn-submit {
  width: 100%; /* 宽度 100% */
  padding: 0.875rem 1.5rem; /* 上下 14px，左右 24px 内边距 */
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); /* 紫色渐变背景 */
  color: white; /* 白色文字 */
  border: none; /* 无边框 */
  border-radius: 8px; /* 圆角 8px */
  font-size: 1rem; /* 字体大小 16px */
  font-weight: 600; /* 字体粗细：半粗体 */
  cursor: pointer; /* 鼠标悬停时显示手型光标 */
  transition: all 0.3s ease; /* 所有属性变化时的过渡动画 */
}

/* 提交按钮悬停效果 */
.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px); /* 向上移动 2px */
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4); /* 紫色阴影 */
}

/* 禁用状态按钮 */
.btn-submit:disabled {
  opacity: 0.6; /* 透明度 60% */
  cursor: not-allowed; /* 禁止光标 */
}

/* 移动端响应式适配（屏幕宽度 ≤ 768px） */
@media (max-width: 768px) {
  /* 缩小标题栏内边距 */
  .header {
    padding: 1rem 1.5rem; /* 上下 16px，左右 24px 内边距 */
  }

  /* 缩小标题文字 */
  .title {
    font-size: 1.5rem; /* 字体大小 24px */
  }

  /* 缩小主内容区内边距 */
  .main-content {
    padding: 2rem 1rem; /* 上下32pm 左右 16px 内边距 */
    height: calc(100vh - 60px); /* 调整高度计算 */
  }

  /* 缩小表单内边距 */
  .register-form {
    padding: 1.5rem; /* 四周 24px 内边距 */
  }

  /* 表单项间距缩小 */
  .form-group {
    margin-bottom: 1rem; /* 底部外边距 16px */
  }

  /* 按钮组间距缩小 */
  .button-group {
    margin-top: 1.5rem; /* 顶部外边距 24px */
  }
}
</style>
