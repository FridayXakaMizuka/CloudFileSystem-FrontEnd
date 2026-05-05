# 重置密码功能前端实现指南（第二步到第四步）

## 概述

本文档详细说明如何在 ResetPasswordView.vue 中实现第二步到第四步的完整逻辑。

---

## 核心设计要点

### 1. SessionId 重新生成策略

**关键原则**：第三步开始时必须重新生成 SessionId

**原因**：
- 防止从第四步回退时使用旧的 SessionId
- 防止从第二步重新进入第三步时 SessionId 冲突
- 确保每次验证流程独立

**实现**：
```javascript
// 在 selectVerifyMethod 函数中
clearSessionId()              // 清除旧的
deleteCookie('rsaPublicKey')  // 清除旧的公钥
const newSessionId = createNewSessionId()  // 生成新的
```

### 2. 验证码发送复用

**邮箱/手机验证码**：复用现有接口
- `/auth/vfcode/email` - 邮箱验证码
- `/auth/vfcode/phone` - 手机验证码

**优势**：
- 无需新增后端接口
- 前端已有完整的倒计时逻辑
- 统一的验证码管理

### 3. RSA 加密要求

**需要加密**：
- ✅ 密保问题答案
- ✅ 新密码
- ✅ 确认密码

**不需要加密**：
- ❌ 验证码（6位数字）
- ❌ SessionId
- ❌ 邮箱/手机号（已在第一步获取）

---

## 数据结构设计

### 组件状态

```javascript
// 当前步骤 (1-4)
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

// 用户信息（从第一步获取）
const userInfo = ref({
  email: '',
  phone: '',
  securityQuestion: null,
  securityQuestionText: ''
})

// SessionId 和 RSA 密钥
const sessionId = ref('')
const rsaPublicKey = ref('')

// 临时令牌（第三步获取，第四步使用）
const resetToken = ref('')

// 加载状态
const isLoading = ref(false)

// 倒计时
const countdownTimer = new CountdownTimer(60)
const remaining = ref(0)
```

---

## 第二步 → 第三步实现

### 选择验证方式函数

```javascript
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
      await sendVerificationCode()
    }
    
  } catch (error) {
    logger.error('初始化验证失败:', error)
    showError('系统初始化失败，请重试')
  } finally {
    isLoading.value = false
  }
}
```

---

## 第三步界面设计

### 模板结构

```vue
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
    <button class="btn btn-prev" @click="handlePrevStepFromVerify">
      上一步
    </button>
    <button 
      class="btn btn-next" 
      @click="handleVerify"
      :disabled="!canProceedToNext"
    >
      {{ isLoading ? '验证中...' : '下一步' }}
    </button>
  </div>
</div>
```

---

## 第三步核心功能

### 1. 发送验证码（邮箱/手机）

```javascript
/**
 * 发送验证码（复用注册时的接口）
 */
const sendVerificationCode = async () => {
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
```

### 2. 验证是否可以进入下一步

```javascript
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
```

### 3. 验证并进入第四步

```javascript
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
      encryptedSecurityAnswer: encryptedAnswer
    })
  })
  
  return await response.json()
}
```

### 4. 从第三步返回第二步

```javascript
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
  
  // 返回第二步
  currentStep.value = 2
  
  logger.info('从第三步返回第二步')
}
```

---

## 第四步界面设计（预览）

```vue
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
    <button class="btn btn-prev" @click="handlePrevStepFromReset">
      上一步
    </button>
    <button 
      class="btn btn-next" 
      @click="handleResetPassword"
      :disabled="!canResetPassword"
    >
      {{ isLoading ? '重置中...' : '确认重置' }}
    </button>
  </div>
</div>
```

---

## 样式补充

```css
/* 第三步表单样式 */
.reset-form.step3 {
  min-height: 450px;
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
```

---

## 完整流程图

```
┌─────────────────────────────────────────────────────────────┐
│                    第二步：选择验证方式                       │
│                                                              │
│  📧 邮箱验证 (u***r@example.com)                             │
│  📱 手机验证 (138****5678)                                   │
│  ❓ 密保问题 (您的出生地是？)                                 │
└──────────────────────┬──────────────────────────────────────┘
                       ↓ 点击验证方式
┌─────────────────────────────────────────────────────────────┐
│              初始化第三步                                     │
│                                                              │
│  1. clearSessionId()                                        │
│  2. deleteCookie('rsaPublicKey')                            │
│  3. createNewSessionId()  ← 生成新的（5分钟有效期）          │
│  4. fetchRSAKey()         ← 获取新公钥                      │
│  5. currentStep = 3                                         │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                    第三步：验证身份                           │
│                                                              │
│  根据选择的验证方式显示不同界面：                              │
│                                                              │
│  邮箱/手机：                                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 验证码已发送至 x***x@example.com                      │  │
│  │ [输入框: 6位验证码] [重新发送按钮]                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  密保问题：                                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 您的出生地是？                                        │  │
│  │ [输入框: 答案]                                         │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  [上一步] [下一步]                                           │
└──────────────────────┬──────────────────────────────────────┘
                       ↓ 点击"下一步"
┌─────────────────────────────────────────────────────────────┐
│              调用验证接口                                     │
│                                                              │
│  邮箱: POST /auth/reset_password/verify/email               │
│  手机: POST /auth/reset_password/verify/phone               │
│  密保: POST /auth/reset_password/verify/security_answer     │
│                                                              │
│  成功后返回 resetToken                                       │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                    第四步：设置新密码                         │
│                                                              │
│  [输入框: 新密码]                                            │
│  [输入框: 确认密码]                                          │
│                                                              │
│  [上一步] [确认重置]                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 关键注意事项

### 1. SessionId 生命周期

```
第二步点击验证方式
  ↓
生成新 SessionId（5分钟）
  ↓
第三步验证
  ↓
验证成功 → 获取 resetToken（10分钟）
  ↓
第四步重置密码
  ↓
重置成功 → 清除所有 SessionId 和 Token
```

### 2. 倒计时管理

- 只在邮箱/手机验证时启动
- 返回第二步时停止并重置
- 重新进入第三步时重新启动

### 3. 数据清理

**从第三步返回第二步时**：
```javascript
countdownTimer.stop()
resetForm.value.verificationCode = ''
resetForm.value.securityAnswer = ''
verifyMethod.value = ''
clearSessionId()
deleteCookie('rsaPublicKey')
```

**重置成功后**：
```javascript
clearSessionId()
deleteCookie('rsaPublicKey')
resetToken.value = ''
router.push('/login')
```

---

## 测试清单

- [ ] 第二步点击不同验证方式能正确跳转到第三步
- [ ] 第三步初始化时生成了新的 SessionId
- [ ] 邮箱/手机验证时自动发送验证码
- [ ] 倒计时功能正常工作
- [ ] 重新发送验证码按钮在倒计时期间禁用
- [ ] 密保问题正确显示
- [ ] 上一步按钮能正确返回第二步
- [ ] 返回第二步时清除了 SessionId 和公钥
- [ ] 验证成功后能获取到 resetToken
- [ ] 验证失败时显示正确的错误消息

---

**文档维护者**: Frontend Team  
**最后更新**: 2026-05-02
