# 邮箱手机号同时编辑 RSA 密钥冲突修复

## 问题描述

### 现象

当**同时打开邮箱和手机号编辑模式**时，提交邮箱修改会导致后端返回 **500 Internal Server Error**。

**操作步骤**：
1. 点击"邮箱地址"的"修改"按钮 → 获取 RSA 密钥 A
2. 点击"手机号"的"修改"按钮 → 获取 RSA 密钥 B（覆盖密钥 A）
3. 填写邮箱信息和验证码
4. 点击邮箱的"保存"按钮
5. **错误结果**：`POST http://localhost:8835/profile/email/set 500 (Internal Server Error)`

### 根本原因

**RSA 密钥被覆盖导致解密失败**：

```javascript
// ❌ 原来的实现：所有用途共享同一个全局变量
const rsaPublicKey = ref('')  // 全局 RSA 密钥

// 步骤 1: 打开邮箱编辑
await loadRsaKey('email')
rsaPublicKey.value = '密钥A'  // ✅ 邮箱使用密钥 A

// 步骤 2: 打开手机号编辑
await loadRsaKey('phone')
rsaPublicKey.value = '密钥B'  // ❌ 覆盖了密钥 A

// 步骤 3: 保存邮箱
encryptPassword(email, rsaPublicKey.value)  // ❌ 使用密钥 B 加密
// 后端尝试用密钥 A 解密 → 解密失败 → 500 错误
```

**问题分析**：
- 每个用途（email/phone/password）调用 `/auth/rsa-key` 都会生成**不同的密钥对**
- 前端只有一个全局变量 `rsaPublicKey.value`，后获取的会覆盖先前的
- 保存时使用错误的密钥加密，后端无法解密

## 修复方案

### 核心思路

为每个用途维护**独立的 RSA 密钥变量**，避免相互覆盖。

### 1. 新增专用 RSA 密钥变量

```javascript
// RSA 密钥相关
const rsaPublicKey = ref('')  // 全局 RSA 密钥（用于密码修改）
const sessionId = ref('')  // 全局 sessionId
const isRsaKeyLoading = ref(false)

// ✅ 专用 RSA 密钥（用于邮箱和手机号修改）
const emailRsaPublicKey = ref('')  // 邮箱修改专用的 RSA 密钥
const phoneRsaPublicKey = ref('')  // 手机号修改专用的 RSA 密钥
```

### 2. 开始编辑时保存到专用变量

**邮箱编辑**：
```javascript
else if (field === 'email') {
  editForm.value.email = userInfo.value.email || ''
  editForm.value.emailVerificationCode = ''
  
  // 为邮箱修改生成独立的 sessionId
  emailSessionId.value = getOrCreatePurposeSessionId('email')
  
  // 获取 RSA 密钥（使用邮箱用途）并保存到专用变量
  await loadRsaKey('email')
  emailRsaPublicKey.value = rsaPublicKey.value  // ✅ 保存到专用变量
  logger.info('邮箱专用 RSA 密钥已保存')
}
```

**手机号编辑**：
```javascript
else if (field === 'phone') {
  editForm.value.phone = userInfo.value.phone || ''
  editForm.value.phoneVerificationCode = ''
  
  // 为手机号修改生成独立的 sessionId
  phoneSessionId.value = getOrCreatePurposeSessionId('phone')
  
  // 获取 RSA 密钥（使用手机号用途）并保存到专用变量
  await loadRsaKey('phone')
  phoneRsaPublicKey.value = rsaPublicKey.value  // ✅ 保存到专用变量
  logger.info('手机号专用 RSA 密钥已保存')
}
```

### 3. 保存时使用专用密钥

**邮箱保存**：
```javascript
// 检查邮箱专用 RSA 密钥是否存在
if (!emailRsaPublicKey.value) {
  logger.warn('邮箱专用 RSA 密钥未加载，尝试重新获取...')
  await loadRsaKey('email')
  emailRsaPublicKey.value = rsaPublicKey.value  // ✅ 保存到专用变量
  
  if (!emailRsaPublicKey.value) {
    alert('系统初始化失败，请刷新页面重试')
    return
  }
}

// ✅ 使用邮箱专用的 RSA 密钥加密邮箱
const encryptedEmail = encryptPassword(newEmail, emailRsaPublicKey.value)
```

**手机号保存**：
```javascript
// 检查手机号专用 RSA 密钥是否存在
if (!phoneRsaPublicKey.value) {
  logger.warn('手机号专用 RSA 密钥未加载，尝试重新获取...')
  await loadRsaKey('phone')
  phoneRsaPublicKey.value = rsaPublicKey.value  // ✅ 保存到专用变量
  
  if (!phoneRsaPublicKey.value) {
    alert('系统初始化失败，请刷新页面重试')
    return
  }
}

// ✅ 使用手机号专用的 RSA 密钥加密手机号
const encryptedPhone = encryptPassword(newPhone, phoneRsaPublicKey.value)
```

### 4. 清理专用密钥

**取消编辑时**：
```javascript
const cancelEdit = (field) => {
  // ... 其他清理逻辑
  
  // 清理邮箱验证码相关状态
  if (field === 'email') {
    clearPurposeSessionId('email')
    emailSessionId.value = ''
    editForm.value.emailVerificationCode = ''
    emailRsaPublicKey.value = ''  // ✅ 清除邮箱专用 RSA 密钥
    logger.info('已清除邮箱专用 RSA 密钥')
  }
  
  // 清理手机号验证码相关状态
  if (field === 'phone') {
    clearPurposeSessionId('phone')
    phoneSessionId.value = ''
    editForm.value.phoneVerificationCode = ''
    phoneRsaPublicKey.value = ''  // ✅ 清除手机号专用 RSA 密钥
    logger.info('已清除手机号专用 RSA 密钥')
  }
}
```

**保存成功后**：
```javascript
// 邮箱保存成功
editingFields.value.delete('email')
fieldError.value = ''
clearPurposeSessionId('email')
emailSessionId.value = ''
editForm.value.emailVerificationCode = ''
emailRsaPublicKey.value = ''  // ✅ 清除邮箱专用 RSA 密钥
logger.info('已清除邮箱专用 RSA 密钥')

// 手机号保存成功
editingFields.value.delete('phone')
fieldError.value = ''
clearPurposeSessionId('phone')
phoneSessionId.value = ''
editForm.value.phoneVerificationCode = ''
phoneRsaPublicKey.value = ''  // ✅ 清除手机号专用 RSA 密钥
logger.info('已清除手机号专用 RSA 密钥')
```

## 工作流程对比

### 修改前的流程（有问题）

```
用户打开邮箱编辑
  ↓
loadRsaKey('email')
  ↓
rsaPublicKey.value = 密钥A
  ↓
用户打开手机号编辑
  ↓
loadRsaKey('phone')
  ↓
rsaPublicKey.value = 密钥B ← ❌ 覆盖了密钥A
  ↓
用户点击邮箱的"保存"
  ↓
encryptPassword(email, rsaPublicKey.value)  ← ❌ 使用密钥B
  ↓
后端用密钥A解密 ← ❌ 解密失败
  ↓
500 Internal Server Error ← ❌ 报错
```

### 修改后的流程（正确）

```
用户打开邮箱编辑
  ↓
loadRsaKey('email')
  ↓
rsaPublicKey.value = 密钥A
  ↓
emailRsaPublicKey.value = 密钥A ← ✅ 保存到专用变量
  ↓
用户打开手机号编辑
  ↓
loadRsaKey('phone')
  ↓
rsaPublicKey.value = 密钥B
  ↓
phoneRsaPublicKey.value = 密钥B ← ✅ 保存到专用变量
  ↓
用户点击邮箱的"保存"
  ↓
encryptPassword(email, emailRsaPublicKey.value)  ← ✅ 使用密钥A
  ↓
后端用密钥A解密 ← ✅ 解密成功
  ↓
200 OK ← ✅ 成功
```

## 测试场景

### 测试场景 1: 单独编辑邮箱

1. 只打开邮箱编辑模式
2. 输入新邮箱
3. 发送并输入验证码
4. 点击"保存"
5. **预期**：✅ 使用邮箱专用密钥加密，保存成功

### 测试场景 2: 单独编辑手机号

1. 只打开手机号编辑模式
2. 输入新手机号
3. 发送并输入验证码
4. 点击"保存"
5. **预期**：✅ 使用手机号专用密钥加密，保存成功

### 测试场景 3: 同时编辑，先保存邮箱

1. 打开邮箱编辑模式 → 获取密钥 A
2. 打开手机号编辑模式 → 获取密钥 B
3. 填写邮箱信息和验证码
4. 点击邮箱的"保存"
5. **预期**：
   - ✅ 使用密钥 A 加密邮箱
   - ✅ 后端用密钥 A 解密成功
   - ✅ 邮箱修改成功
   - ✅ 手机号编辑模式保持打开

### 测试场景 4: 同时编辑，先保存手机号

1. 打开邮箱编辑模式 → 获取密钥 A
2. 打开手机号编辑模式 → 获取密钥 B
3. 填写手机号信息和验证码
4. 点击手机号的"保存"
5. **预期**：
   - ✅ 使用密钥 B 加密手机号
   - ✅ 后端用密钥 B 解密成功
   - ✅ 手机号修改成功
   - ✅ 邮箱编辑模式保持打开

### 测试场景 5: 同时编辑，分别保存

1. 打开邮箱编辑模式 → 获取密钥 A
2. 打开手机号编辑模式 → 获取密钥 B
3. 填写邮箱信息和验证码
4. 点击邮箱的"保存" → ✅ 成功
5. 填写手机号信息和验证码
6. 点击手机号的"保存" → ✅ 成功
7. **预期**：两个字段都能独立保存成功

## 相关文件

- `src/views/ProfileEditView.vue`
  - 第 523-530 行：新增专用 RSA 密钥变量
  - 第 743-778 行：开始编辑时保存到专用变量
  - 第 800-822 行：取消编辑时清除专用密钥
  - 第 1090-1103 行：邮箱保存使用专用密钥
  - 第 1184-1197 行：手机号保存使用专用密钥
  - 第 1150-1152 行：邮箱保存成功后清除专用密钥
  - 第 1245-1247 行：手机号保存成功后清除专用密钥

## 更新日期

2026-05-02
