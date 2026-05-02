# SessionId 清除逻辑完整实现指南

## 📋 概述

本文档详细说明 ProfileEditView 中邮箱、手机号、密码修改功能的 sessionId 清除逻辑，确保在各种场景下都能正确清理会话数据。

---

## ✅ 已实现的清除场景

### 1. **密码修改成功后清除**

**位置**: `ProfileEditView.vue` - `saveField()` 函数（第 983-1000 行）

```javascript
if (response.ok && result.success === true) {
  alert(result.message || '密码修改成功！请重新登录')
  
  // 从修改集合中移除
  modifiedFields.value.delete('password')
  
  // 清空 JWT 令牌和认证信息
  clearAuthInfo()
  
  // 清除 Cookie 中的 RSA 密钥和密码专用 sessionId
  deleteCookie('rsaPublicKey')
  clearPurposeSessionId('password')  // ✅ 清除密码专用 sessionId
  
  // 跳转到登录界面
  router.push('/login')
}
```

**清除内容**：
- ✅ `sessionId_password` Cookie
- ✅ `sessionTimestamp_password` Cookie
- ✅ `rsaPublicKey` Cookie
- ✅ JWT 令牌（通过 `clearAuthInfo()`）

---

### 2. **邮箱修改成功后清除**

**位置**: `ProfileEditView.vue` - `saveField()` 函数（第 1091-1114 行）

```javascript
if (response.ok && result.success === true) {
  alert(result.message || '邮箱修改成功！')
  
  // 更新本地数据
  userInfo.value.email = newEmail
  
  // ✅ 更新 sessionStorage 缓存
  updateUserInfoField('email', newEmail)
  
  // 更新 localStorage
  localStorage.setItem('userEmail', newEmail)
  
  // 从修改集合中移除
  modifiedFields.value.delete('email')
  
  // 退出编辑模式
  editingField.value = ''
  fieldError.value = ''
  clearPurposeSessionId('email')           // ✅ 清除邮箱专用 sessionId
  emailSessionId.value = ''                // ✅ 清空响应式变量
  editForm.value.emailVerificationCode = '' // ✅ 清空验证码输入框
}
```

**清除内容**：
- ✅ `sessionId_email` Cookie
- ✅ `sessionTimestamp_email` Cookie
- ✅ `emailSessionId` 响应式变量
- ✅ `editForm.emailVerificationCode` 表单字段

**注意**：不清除 JWT 令牌，用户保持登录状态

---

### 3. **手机号修改成功后清除**

**位置**: `ProfileEditView.vue` - `saveField()` 函数（第 1154-1177 行）

```javascript
if (response.ok && result.success === true) {
  alert(result.message || '手机号修改成功！')
  
  // 更新本地数据
  userInfo.value.phone = newPhone
  
  // ✅ 更新 sessionStorage 缓存
  updateUserInfoField('phone', newPhone)
  
  // 更新 localStorage
  localStorage.setItem('userPhone', newPhone)
  
  // 从修改集合中移除
  modifiedFields.value.delete('phone')
  
  // 退出编辑模式
  editingFields.value.delete('phone')
  fieldError.value = ''
  clearPurposeSessionId('phone')           // ✅ 清除手机号专用 sessionId
  phoneSessionId.value = ''                // ✅ 清空响应式变量
  editForm.value.phoneVerificationCode = '' // ✅ 清空验证码输入框
}
```

**清除内容**：
- ✅ `sessionId_phone` Cookie
- ✅ `sessionTimestamp_phone` Cookie
- ✅ `phoneSessionId` 响应式变量
- ✅ `editForm.phoneVerificationCode` 表单字段

**注意**：不清除 JWT 令牌，用户保持登录状态

---

### 4. **取消编辑时清除**

**位置**: `ProfileEditView.vue` - `cancelEdit()` 函数（第 775-804 行）

#### 邮箱取消编辑

```javascript
// 清理邮箱验证码相关状态
if (field === 'email') {
  clearPurposeSessionId('email')     // ✅ 清除邮箱专用 sessionId
  emailSessionId.value = ''          // ✅ 清空响应式变量
  editForm.value.emailVerificationCode = '' // ✅ 清空验证码输入框
}
```

#### 手机号取消编辑

```javascript
// 清理手机号验证码相关状态
if (field === 'phone') {
  clearPurposeSessionId('phone')     // ✅ 清除手机号专用 sessionId
  phoneSessionId.value = ''          // ✅ 清空响应式变量
  editForm.value.phoneVerificationCode = '' // ✅ 清空验证码输入框
}
```

**清除内容**：
- ✅ 对应的 sessionId Cookie
- ✅ 对应的 sessionTimestamp Cookie
- ✅ 对应的响应式变量
- ✅ 对应的验证码输入框

---

## 🔧 底层实现

### clearPurposeSessionId 函数

**位置**: `src/utils/sessionId.js`

```javascript
/**
 * 清除特定用途的会话 ID
 * @param {string} purpose - 用途标识（'email', 'phone', 'password'）
 */
export const clearPurposeSessionId = (purpose) => {
  const cookieName = `sessionId_${purpose}`
  const timestampName = `sessionTimestamp_${purpose}`
  
  deleteCookie(cookieName)      // 删除 sessionId Cookie
  deleteCookie(timestampName)   // 删除时间戳 Cookie
  logger.info(`已清除 ${purpose} 的 sessionId`)
}
```

**功能**：
- 删除 `sessionId_{purpose}` Cookie
- 删除 `sessionTimestamp_{purpose}` Cookie
- 记录日志

---

## 📊 清除时机总结

| 场景 | 密码 | 邮箱 | 手机号 |
|------|------|------|--------|
| **修改成功** | ✅ 清除 | ✅ 清除 | ✅ 清除 |
| **取消编辑** | ❌ 不适用* | ✅ 清除 | ✅ 清除 |
| **发送验证码失败** | ❌ 不清除 | ❌ 不清除 | ❌ 不清除 |
| **验证失败** | ❌ 不清除 | ❌ 不清除 | ❌ 不清除 |
| **页面卸载** | ❌ 自动过期 | ❌ 自动过期 | ❌ 自动过期 |

*\* 密码修改没有"取消编辑"按钮，只有保存或跳转登录页*

---

## 🎯 设计原则

### 1. **成功即清除**
- ✅ 修改成功后立即清除 sessionId
- ✅ 防止 sessionId 被重复使用
- ✅ 提高安全性

### 2. **取消即清除**
- ✅ 用户主动取消时清除 sessionId
- ✅ 避免无效的 sessionId 占用资源
- ✅ 下次编辑时会生成新的 sessionId

### 3. **失败不清除**
- ✅ 验证失败时保留 sessionId
- ✅ 允许用户重新尝试
- ✅ 避免频繁生成新的 sessionId

### 4. **双重清理**
- ✅ 清除 Cookie 中的 sessionId
- ✅ 清空响应式变量
- ✅ 确保前端状态一致

---

## 🔍 验证方法

### 1. **浏览器开发者工具检查**

打开浏览器开发者工具 → Application → Cookies：

**密码修改前**：
```
sessionId_password: abc123...
sessionTimestamp_password: 1714567890123
```

**密码修改后**：
```
sessionId_password: （已删除）
sessionTimestamp_password: （已删除）
```

**邮箱修改前**：
```
sessionId_email: def456...
sessionTimestamp_email: 1714567890456
```

**邮箱修改后**：
```
sessionId_email: （已删除）
sessionTimestamp_email: （已删除）
```

**手机号修改前**：
```
sessionId_phone: ghi789...
sessionTimestamp_phone: 1714567890789
```

**手机号修改后**：
```
sessionId_phone: （已删除）
sessionTimestamp_phone: （已删除）
```

### 2. **控制台日志检查**

查看浏览器控制台的日志输出：

```javascript
// 密码修改成功
logger.info('密码修改响应:', result)
// 应该看到：已清除 password 的 sessionId

// 邮箱修改成功
logger.info('邮箱修改响应:', result)
// 应该看到：已清除 email 的 sessionId

// 手机号修改成功
logger.info('手机号修改响应:', result)
// 应该看到：已清除 phone 的 sessionId

// 取消编辑
logger.info('取消编辑', field)
// 应该看到：已清除 email/phone 的 sessionId
```

### 3. **代码调试**

在关键位置添加断点：

```javascript
// saveField 函数中
clearPurposeSessionId('email')  // 设置断点
emailSessionId.value = ''       // 设置断点

// cancelEdit 函数中
clearPurposeSessionId('phone')  // 设置断点
phoneSessionId.value = ''       // 设置断点
```

---

## ⚠️ 注意事项

### 1. **不要遗漏清除**
- ✅ 每个成功分支都要清除 sessionId
- ✅ 每个取消操作都要清除 sessionId
- ❌ 不要在失败分支清除 sessionId

### 2. **清除顺序**
```javascript
// 正确的顺序
clearPurposeSessionId('email')  // 1. 先清除 Cookie
emailSessionId.value = ''       // 2. 再清空变量
editForm.value.emailVerificationCode = '' // 3. 最后清空表单
```

### 3. **响应式变量同步**
- ✅ 清除 Cookie 后必须清空响应式变量
- ✅ 确保 Vue 组件的状态与 Cookie 一致
- ❌ 不要只清除 Cookie 而不清空变量

### 4. **表单字段清理**
- ✅ 清除 sessionId 后清空验证码输入框
- ✅ 避免残留的验证码被误用
- ❌ 不要保留旧的验证码

---

## 🧪 测试用例

### 测试 1: 密码修改成功后清除

```javascript
// 步骤 1: 点击密码修改
startEdit('password')

// 步骤 2: 填写新旧密码
editForm.value.oldPassword = 'old123'
editForm.value.newPassword = 'new456'
editForm.value.confirmPassword = 'new456'

// 步骤 3: 点击保存
await saveField('password')

// 验证 1: Cookie 中不应有 sessionId_password
const cookieValue = document.cookie.match(/sessionId_password=([^;]+)/)
console.assert(cookieValue === null, 'sessionId_password 应该被清除')

// 验证 2: rsaPublicKey 也应该被清除
const rsaKey = document.cookie.match(/rsaPublicKey=([^;]+)/)
console.assert(rsaKey === null, 'rsaPublicKey 应该被清除')
```

### 测试 2: 邮箱修改成功后清除

```javascript
// 步骤 1: 点击邮箱修改
startEdit('email')

// 步骤 2: 发送验证码
await handleSendVerificationCode()

// 步骤 3: 填写新邮箱和验证码
editForm.value.email = 'new@example.com'
editForm.value.emailVerificationCode = '123456'

// 步骤 4: 点击保存
await saveField('email')

// 验证 1: Cookie 中不应有 sessionId_email
const cookieValue = document.cookie.match(/sessionId_email=([^;]+)/)
console.assert(cookieValue === null, 'sessionId_email 应该被清除')

// 验证 2: emailSessionId 应该为空
console.assert(emailSessionId.value === '', 'emailSessionId 应该为空')

// 验证 3: 验证码输入框应该为空
console.assert(editForm.value.emailVerificationCode === '', '验证码应该被清空')
```

### 测试 3: 手机号修改成功后清除

```javascript
// 步骤 1: 点击手机号修改
startEdit('phone')

// 步骤 2: 发送验证码
await handleSendPhoneVerificationCode()

// 步骤 3: 填写新手机号和验证码
editForm.value.phone = '13800138000'
editForm.value.phoneVerificationCode = '123456'

// 步骤 4: 点击保存
await saveField('phone')

// 验证 1: Cookie 中不应有 sessionId_phone
const cookieValue = document.cookie.match(/sessionId_phone=([^;]+)/)
console.assert(cookieValue === null, 'sessionId_phone 应该被清除')

// 验证 2: phoneSessionId 应该为空
console.assert(phoneSessionId.value === '', 'phoneSessionId 应该为空')

// 验证 3: 验证码输入框应该为空
console.assert(editForm.value.phoneVerificationCode === '', '验证码应该被清空')
```

### 测试 4: 取消编辑时清除

```javascript
// 步骤 1: 点击邮箱修改
startEdit('email')

// 步骤 2: 发送验证码
await handleSendVerificationCode()

// 步骤 3: 点击取消
cancelEdit('email')

// 验证 1: Cookie 中不应有 sessionId_email
const cookieValue = document.cookie.match(/sessionId_email=([^;]+)/)
console.assert(cookieValue === null, 'sessionId_email 应该被清除')

// 验证 2: emailSessionId 应该为空
console.assert(emailSessionId.value === '', 'emailSessionId 应该为空')
```

---

## 📝 常见问题

### Q1: 为什么失败时不清除 sessionId？

**A**: 因为用户可能需要重新尝试，保留 sessionId 可以：
- 避免频繁生成新的 sessionId
- 允许用户使用同一个验证码重试
- 减少后端会话管理的压力

### Q2: 为什么要同时清除 Cookie 和响应式变量？

**A**: 为了确保前端状态的一致性：
- Cookie 是持久化存储
- 响应式变量是运行时状态
- 两者必须同步，否则会导致状态不一致

### Q3: 为什么不使用全局 sessionId？

**A**: 独立 sessionId 的好处：
- 事件隔离：不同操作互不影响
- 安全性更高：一个 sessionId 泄露不会影响其他操作
- 便于管理：可以单独清除某个操作的 sessionId

### Q4: 如果用户刷新页面会怎样？

**A**: 
- Cookie 中的 sessionId 仍然存在（除非已过期）
- 响应式变量会被重置为空
- 下次编辑时会调用 `getOrCreatePurposeSessionId()` 读取或生成新的 sessionId

---

## ✅ 完成清单

- [x] 密码修改成功后清除 `sessionId_password`
- [x] 邮箱修改成功后清除 `sessionId_email`
- [x] 手机号修改成功后清除 `sessionId_phone`
- [x] 邮箱取消编辑时清除 `sessionId_email`
- [x] 手机号取消编辑时清除 `sessionId_phone`
- [x] 清除 Cookie 中的 sessionId
- [x] 清除 Cookie 中的 sessionTimestamp
- [x] 清空响应式变量（`emailSessionId`, `phoneSessionId`）
- [x] 清空验证码输入框
- [x] 导入 `clearPurposeSessionId` 函数
- [x] 添加日志记录
- [x] 编写测试用例
- [x] 创建文档

---

## 📚 相关文件

- **视图文件**: `src/views/ProfileEditView.vue`
- **SessionId 工具**: `src/utils/sessionId.js`
- **Cookie 工具**: `src/utils/cookie.js`
- **API 配置**: `src/config/api.js`

---

**最后更新**: 2026-05-01  
**版本**: v1.0  
**作者**: Lingma AI Assistant
