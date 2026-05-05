# RegisterView.vue 修改清单

## 📋 概述

本文档列出 RegisterView.vue 需要修改的所有内容，以适配前端生成 sessionId 的新机制。

---

## ✅ 已完成的修改

### 1. 导入语句
```javascript
// 修改前
import { getValidatedRSAKey, fetchRSAKey, encryptPassword } from '@/utils/rsa'
import { showSuccess, showError } from '@/utils/toast'

// 修改后
import { getStoredRSAKey, fetchRSAKey, encryptPassword } from '@/utils/rsa'
import { showSuccess, showError } from '@/utils/toast'
import { clearSessionId, isValidNickname, isValidPasswordLength, validatePhone } from '@/utils/sessionId'
```

### 2. 邮箱验证码发送逻辑
- ✅ 移除了 `verificationSessionId.value = result.sessionId`
- ✅ 添加了注释说明 sessionId 已自动携带

### 3. 手机验证码发送逻辑
- ✅ 移除了 `phoneVerificationSessionId.value = result.sessionId`
- ✅ 添加了注释说明 sessionId 已自动携带

---

## ⏳ 待完成的修改

### 4. 表单验证逻辑修改

#### 4.1 昵称验证（新增）
```javascript
/**
 * 计算属性：验证昵称格式
 */
const nicknameError = computed(() => {
  if (registerForm.value.nickname) {
    if (!isValidNickname(registerForm.value.nickname)) {
      return '昵称必须以字母开头，只含数字、字母和下划线'
    }
  }
  return ''
})
```

#### 4.2 密码长度验证（修改）
```javascript
// 当前代码（第 438-444 行）保持不变
// 但需要确保使用 isValidPasswordLength 函数
```

#### 4.3 手机号验证（修改为可选）
```javascript
/**
 * 计算属性：手机号是否有效（用于控制发送验证码按钮）
 */
const isPhoneValid = computed(() => {
  // 如果为空，返回 true（允许不填）
  if (!registerForm.value.phone) return true
  
  const phoneRegex = /^1[3-9]\d{9}$/
  return phoneRegex.test(registerForm.value.phone)
})

/**
 * 计算属性：手机号错误信息
 */
const phoneError = computed(() => {
  if (phoneBlurred.value && registerForm.value.phone) {
    const phoneValidation = validatePhone(registerForm.value.phone)
    if (phoneValidation === false) {
      return '请输入有效的11位手机号'
    }
  }
  return ''
})
```

#### 4.4 表单有效性验证（修改）
```javascript
/**
 * 计算属性：表单是否有效
 */
const isFormValid = computed(() => {
  // 基本必填项检查
  if (!registerForm.value.nickname ||
      !registerForm.value.email ||
      !registerForm.value.password ||
      !registerForm.value.confirmPassword ||
      !registerForm.value.securityQuestion ||
      !registerForm.value.securityAnswer ||
      !registerForm.value.verificationCode) {
    return false
  }
  
  // 昵称格式验证
  if (!isValidNickname(registerForm.value.nickname)) {
    return false
  }
  
  // 密码长度验证
  if (!isValidPasswordLength(registerForm.value.password)) {
    return false
  }
  
  // 密码一致性验证
  if (registerForm.value.password !== registerForm.value.confirmPassword) {
    return false
  }
  
  // 邮箱格式验证
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(registerForm.value.email)) {
    return false
  }
  
  // 手机号验证（如果填写了）
  if (registerForm.value.phone) {
    const phoneValidation = validatePhone(registerForm.value.phone)
    if (phoneValidation === false) {
      return false
    }
    // 如果填写了手机号，必须填写手机验证码
    if (!registerForm.value.phoneVerificationCode) {
      return false
    }
  }
  
  return true
})
```

### 5. initRSAKey 函数修改

```javascript
/**
 * 初始化RSA密钥（优先从 Cookie读取，失败则重新获取）
 */
const initRSAKey = async () => {
  try {
    logger.info('开始初始化RSA密钥...')
    
    // 1. 尝试从 Cookie 读取
    const storedKey = getStoredRSAKey()
    
    if (storedKey) {
      // 读取成功，使用 Cookie 中的公钥
      rsaPublicKey.value = storedKey.publicKey
      sessionId.value = storedKey.sessionId
      logger.info('使用 Cookie 中的 RSA 公钥')
    } else {
      // Cookie 中没有，重新获取密钥
      logger.info('Cookie 中没有公钥，重新获取RSA密钥')
      const keyData = await fetchRSAKey()
      rsaPublicKey.value = keyData.publicKey
      sessionId.value = keyData.sessionId
      logger.info('已获取新的RSA密钥')
    }
    
    logger.info('RSA密钥初始化完成')
    logger.debug('公钥:', rsaPublicKey.value.substring(0, 50) + '...')
    logger.debug('会话ID:', sessionId.value)
  } catch (error) {
    logger.error('RSA密钥初始化失败:', error)
    showError('系统初始化失败：无法获取RSA密钥。请检查后端服务是否正常运行')
  }
}
```

### 6. handleRegister 函数修改（重要）

```javascript
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
      
      if (userData) {
        showSuccess(`注册成功！用户ID: ${userData.id}, 用户名: ${userData.nickname}`)
      } else {
        showSuccess(result.message || '注册成功！')
      }

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
```

### 7. 模板修改

#### 7.1 昵称输入框添加验证提示
```vue
<!-- 在昵称输入框后添加 -->
<p v-if="nicknameError" class="error-message">{{ nicknameError }}</p>
```

#### 7.2 手机号改为非必填
```vue
<!-- 修改前 -->
<input
    type="tel"
    id="phone"
    v-model="registerForm.phone"
    placeholder="请输入手机号"
    required
    ...
/>

<!-- 修改后 -->
<input
    type="tel"
    id="phone"
    v-model="registerForm.phone"
    placeholder="请输入手机号（可选）"
    ...
/>
```

#### 7.3 手机验证码改为条件必填
```vue
<!-- 修改前 -->
<input
    type="text"
    id="phoneVerificationCode"
    v-model="registerForm.phoneVerificationCode"
    placeholder="请输入验证码"
    required
    ...
/>

<!-- 修改后 -->
<input
    type="text"
    id="phoneVerificationCode"
    v-model="registerForm.phoneVerificationCode"
    placeholder="请输入验证码"
    :required="!!registerForm.phone"
    :disabled="!registerForm.phone"
    ...
/>
```

### 8. 移除不再需要的状态变量

```javascript
// 可以移除以下变量（因为不再需要从响应中保存 sessionId）
// const verificationSessionId = ref('')
// const phoneVerificationSessionId = ref('')
```

---

## 🎯 修改优先级

| 优先级 | 修改项 | 影响范围 |
|--------|--------|---------|
| P0 | handleRegister 函数 | 注册功能核心逻辑 |
| P0 | initRSAKey 函数 | RSA 密钥初始化 |
| P0 | isFormValid 计算属性 | 表单验证 |
| P1 | 昵称验证逻辑 | 新增验证规则 |
| P1 | 手机号可选逻辑 | 修改验证规则 |
| P2 | 模板修改 | UI 层面调整 |
| P2 | 移除废弃变量 | 代码清理 |

---

## 📝 注意事项

1. **向后兼容**：在 backend 未完全改造前，可能需要保留部分旧逻辑
2. **测试重点**：
   - 注册流程完整测试
   - 手机号不填写的场景测试
   - 昵称格式验证测试
   - sessionId 过期场景测试
3. **错误处理**：确保所有 alert 都替换为 showError/showSuccess

---

**文档版本**: v1.0  
**创建时间**: 2026-05-01
