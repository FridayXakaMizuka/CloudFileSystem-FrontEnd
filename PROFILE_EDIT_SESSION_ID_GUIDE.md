# ProfileEditView 独立 SessionId 改造指南

## 📋 改造概述

为邮箱、手机号、密码修改三个功能各自生成独立的 sessionId，实现事件级别的会话隔离。

## 🎯 改造目标

1. **邮箱修改**：使用 `sessionId_email` Cookie
2. **手机号修改**：使用 `sessionId_phone` Cookie  
3. **密码修改**：使用 `sessionId_password` Cookie

每个独立的 sessionId：
- 有效期：300秒（5分钟）
- 重置后有效期：295秒
- 过期自动重新生成
- 优先从 Cookie 读取

## 🔧 核心改动

### 1. sessionId.js 工具函数扩展

新增以下函数支持特定用途的 sessionId：

```javascript
// 创建或获取特定用途的 sessionId
getOrCreatePurposeSessionId(purpose)  // purpose: 'email' | 'phone' | 'password'

// 重置特定用途 sessionId 的有效期
resetPurposeSessionIdExpiry(purpose)

// 清除特定用途的 sessionId
clearPurposeSessionId(purpose)

// 创建新的特定用途 sessionId
createNewPurposeSessionId(purpose)
```

**Cookie 命名规则**：
- 邮箱：`sessionId_email` + `sessionTimestamp_email`
- 手机：`sessionId_phone` + `sessionTimestamp_phone`
- 密码：`sessionId_password` + `sessionTimestamp_password`

### 2. email.js 和 phone.js 改造

#### email.js
```javascript
// 修改前
export const sendVerificationCode = async (email) => {
  const sessionId = getSessionId()  // 使用全局 sessionId
  // ...
}

// 修改后
export const sendVerificationCode = async (email, customSessionId = null) => {
  const sessionId = customSessionId || getSessionId()  // 优先使用自定义 sessionId
  // ...
  
  if (response.ok && result.success === true) {
    if (customSessionId) {
      resetPurposeSessionIdExpiry('email')  // 重置邮箱专用 sessionId
    } else {
      resetSessionIdExpiry()  // 重置全局 sessionId
    }
  }
}
```

#### phone.js
同样的改造逻辑，支持传入自定义 sessionId。

### 3. ProfileEditView.vue 改造

#### 状态变量变更
```javascript
// 修改前
const verificationSessionId = ref('')
const phoneVerificationSessionId = ref('')

// 修改后
const emailSessionId = ref('')      // 邮箱修改专用
const phoneSessionId = ref('')      // 手机号修改专用
// 密码修改使用 getOrCreatePurposeSessionId('password') 动态获取
```

#### startEdit 函数
```javascript
const startEdit = async (field) => {
  // ...
  if (field === 'email') {
    editForm.value.email = userInfo.value.email || ''
    editForm.value.emailVerificationCode = ''
    // 为邮箱修改生成独立的 sessionId
    emailSessionId.value = getOrCreatePurposeSessionId('email')
    logger.info('邮箱修改专用 sessionId:', emailSessionId.value)
  } else if (field === 'phone') {
    editForm.value.phone = userInfo.value.phone || ''
    editForm.value.phoneVerificationCode = ''
    // 为手机号修改生成独立的 sessionId
    phoneSessionId.value = getOrCreatePurposeSessionId('phone')
    logger.info('手机号修改专用 sessionId:', phoneSessionId.value)
  } else if (field === 'password') {
    // 为密码修改生成独立的 sessionId
    const passwordSessionId = getOrCreatePurposeSessionId('password')
    logger.info('密码修改专用 sessionId:', passwordSessionId)
    // ...
  }
}
```

#### 发送验证码函数
```javascript
const handleSendVerificationCode = async () => {
  // 确保有邮箱专用的 sessionId
  if (!emailSessionId.value) {
    emailSessionId.value = getOrCreatePurposeSessionId('email')
  }
  
  // 调用发送验证码接口，传入邮箱专用的 sessionId
  const result = await sendVerificationCode(editForm.value.email, emailSessionId.value)
  // ...
}

const handleSendPhoneVerificationCode = async () => {
  // 确保有手机号专用的 sessionId
  if (!phoneSessionId.value) {
    phoneSessionId.value = getOrCreatePurposeSessionId('phone')
  }
  
  // 调用发送验证码接口，传入手机号专用的 sessionId
  const result = await sendPhoneVerificationCode(editForm.value.phone, phoneSessionId.value)
  // ...
}
```

#### 保存字段函数
```javascript
const saveField = async (field) => {
  if (field === 'email') {
    const requestData = {
      email: newEmail,
      verificationSessionId: emailSessionId.value,  // 使用邮箱专用 sessionId
      verificationCode: emailCode
    }
    // ...
    
    if (response.ok && result.success === true) {
      // 成功后清除邮箱专用 sessionId
      clearPurposeSessionId('email')
      emailSessionId.value = ''
    }
  } else if (field === 'phone') {
    const requestData = {
      phone: newPhone,
      verificationSessionId: phoneSessionId.value,  // 使用手机号专用 sessionId
      verificationCode: phoneCode
    }
    // ...
    
    if (response.ok && result.success === true) {
      // 成功后清除手机号专用 sessionId
      clearPurposeSessionId('phone')
      phoneSessionId.value = ''
    }
  } else if (field === 'password') {
    const passwordSessionId = getOrCreatePurposeSessionId('password')
    
    const requestData = {
      sessionId: passwordSessionId,  // 使用密码专用 sessionId
      oldPassword: encryptedOldPassword,
      newPassword: encryptedNewPassword
    }
    // ...
    
    if (response.ok && result.success === true) {
      // 成功后清除密码专用 sessionId
      clearPurposeSessionId('password')
    }
  }
}
```

#### cancelEdit 函数
```javascript
const cancelEdit = (field) => {
  // ...
  if (field === 'email') {
    clearPurposeSessionId('email')
    emailSessionId.value = ''
    editForm.value.emailVerificationCode = ''
  }
  
  if (field === 'phone') {
    clearPurposeSessionId('phone')
    phoneSessionId.value = ''
    editForm.value.phoneVerificationCode = ''
  }
}
```

#### isFieldValid 计算属性
```javascript
const isFieldValid = computed(() => {
  // ...
  if (field === 'email') {
    return !fieldError.value && 
           editForm.value.email !== userInfo.value.email &&
           editForm.value.emailVerificationCode &&
           emailSessionId.value  // 检查邮箱专用 sessionId
  } else if (field === 'phone') {
    return !fieldError.value && 
           editForm.value.phone !== userInfo.value.phone &&
           editForm.value.phoneVerificationCode &&
           phoneSessionId.value  // 检查手机号专用 sessionId
  }
})
```

#### validateField 函数
```javascript
const validateField = () => {
  // ...
  case 'email':
    // ...
    } else if (!emailSessionId.value) {
      fieldError.value = { field: 'emailVerificationCode', message: '请先发送验证码' }
    }
    break
  
  case 'phone':
    // ...
    } else if (!phoneSessionId.value) {
      fieldError.value = { field: 'phoneVerificationCode', message: '请先发送验证码' }
    }
    break
}
```

## 📊 工作流程

### 邮箱修改流程
```
用户点击"修改"邮箱
  ↓
startEdit('email')
  ↓
生成 emailSessionId = getOrCreatePurposeSessionId('email')
  ↓
用户输入新邮箱 → 点击"发送验证码"
  ↓
handleSendVerificationCode()
  ↓
sendVerificationCode(email, emailSessionId.value)
  ↓
后端验证 → 返回成功
  ↓
resetPurposeSessionIdExpiry('email')  // 重置有效期为 295s
  ↓
用户输入验证码 → 点击"保存"
  ↓
saveField('email')
  ↓
发送请求携带 verificationSessionId: emailSessionId.value
  ↓
后端验证通过 → 修改成功
  ↓
clearPurposeSessionId('email')  // 清除专用 sessionId
```

### 手机号修改流程
与邮箱修改流程相同，使用 `phoneSessionId`。

### 密码修改流程
```
用户点击"修改"密码
  ↓
startEdit('password')
  ↓
生成 passwordSessionId = getOrCreatePurposeSessionId('password')
  ↓
加载 RSA 密钥
  ↓
用户输入旧密码、新密码、确认密码
  ↓
点击"保存"
  ↓
saveField('password')
  ↓
获取 passwordSessionId = getOrCreatePurposeSessionId('password')
  ↓
RSA 加密密码
  ↓
发送请求携带 sessionId: passwordSessionId
  ↓
后端验证通过 → 修改成功
  ↓
clearPurposeSessionId('password')  // 清除专用 sessionId
  ↓
跳转到登录页面
```

## ✅ 优势

1. **事件隔离**：三个修改操作互不干扰，各自的 sessionId 独立管理
2. **安全性提升**：即使某个 sessionId 泄露，不影响其他操作
3. **精确控制**：可以针对每个操作单独设置有效期和重置策略
4. **向后兼容**：保留了全局 sessionId 机制，其他功能不受影响

## 🔍 调试技巧

在浏览器控制台查看日志：
```
[ProfileEditView] 邮箱修改专用 sessionId: xxx-xxx-xxx
[ProfileEditView] 手机号修改专用 sessionId: yyy-yyy-yyy
[ProfileEditView] 密码修改专用 sessionId: zzz-zzz-zzz
[SessionId] email 的 sessionId 有效期已重置为 295 秒
[SessionId] 已清除 email 的 sessionId
```

在 Application → Cookies 中查看：
- `sessionId_email` - 邮箱修改专用
- `sessionId_phone` - 手机号修改专用
- `sessionId_password` - 密码修改专用
- `sessionId` - 全局 sessionId（用于登录/注册等）

## ⚠️ 注意事项

1. **不要混用**：邮箱修改必须使用 `emailSessionId`，不能使用全局 `sessionId`
2. **及时清理**：操作完成或取消后，务必调用 `clearPurposeSessionId()` 清理
3. **有效期管理**：每次请求成功后会自动重置有效期为 295 秒
4. **过期处理**：如果 sessionId 过期，`getOrCreatePurposeSessionId()` 会自动重新生成
