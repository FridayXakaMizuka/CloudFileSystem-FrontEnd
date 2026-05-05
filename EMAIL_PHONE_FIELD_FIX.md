# 邮箱/手机号修改接口字段名修复

## 问题描述

### 问题 1: 邮箱不能为空

在修改邮箱时，后端返回错误：
```json
{
    "code": 400,
    "success": false,
    "message": "邮箱不能为空"
}
```

### 问题 2: 验证码不能为空

修复字段名后，后端返回新错误：
```json
{
    "code": 400,
    "success": false,
    "message": "验证码不能为空"
}
```

## 问题分析

### 根本原因

前端发送的请求数据**字段名不正确**，且**验证码被错误地加密**。

**后端期望的字段格式**：
- `encryptedEmail` - RSA 加密后的邮箱
- `verificationCode` - **明文验证码**（不加密）
- `sessionId` - 会话 ID

### 对比注册接口

注册时的字段命名（RegisterView.vue 第 613-614 行）：
```javascript
{
  email: registerForm.value.email,           // 未加密的邮箱
  emailVfCode: registerForm.value.verificationCode  // 邮箱验证码（明文）
}
```

修改邮箱时的区别：
- ✅ 邮箱需要 RSA 加密 → `encryptedEmail`
- ✅ 验证码**不需要加密** → `verificationCode`（明文）

## 修复内容

### 1. 字段名修复

#### 邮箱修改接口

**文件**：`src/views/ProfileEditView.vue`

**修改前**（第 1094-1100 行）：
```javascript
const requestData = {
  sessionId: emailSessionId.value,
  email: encryptedEmail,
  verificationCode: encryptedCode
}

logger.info('发送邮箱修改请求（RSA 加密）:', { sessionId: emailSessionId.value })
```

**修改后**：
```javascript
// 使用 RSA 加密邮箱（验证码不加密）
const encryptedEmail = encryptPassword(newEmail, rsaPublicKey.value)

// 构造请求数据（邮箱加密，验证码明文）
const requestData = {
  sessionId: emailSessionId.value,
  encryptedEmail: encryptedEmail,
  verificationCode: emailCode  // ✅ 验证码不加密
}

logger.info('发送邮箱修改请求:', { 
  sessionId: emailSessionId.value,
  encryptedEmail: encryptedEmail.substring(0, 50) + '...',
  verificationCode: emailCode  // 明文显示验证码长度
})
```

#### 手机号修改接口

**修改前**（第 1172-1178 行）：
```javascript
const requestData = {
  sessionId: phoneSessionId.value,
  phone: encryptedPhone,
  verificationCode: encryptedCode
}

logger.info('发送手机号修改请求（RSA 加密）:', { sessionId: phoneSessionId.value })
```

**修改后**：
```javascript
// 使用 RSA 加密手机号（验证码不加密）
const encryptedPhone = encryptPassword(newPhone, rsaPublicKey.value)

// 构造请求数据（手机号加密，验证码明文）
const requestData = {
  sessionId: phoneSessionId.value,
  encryptedPhone: encryptedPhone,
  verificationCode: phoneCode  // ✅ 验证码不加密
}

logger.info('发送手机号修改请求:', { 
  sessionId: phoneSessionId.value,
  encryptedPhone: encryptedPhone.substring(0, 50) + '...',
  verificationCode: phoneCode  // 明文显示验证码长度
})
```

## 字段命名规范

### 统一命名规则

| 场景 | 邮箱字段 | 手机字段 | 验证码字段 |
|------|---------|---------|-----------|
| **注册**（未加密） | `email` | `phone` | `emailVfCode` / `phoneVfCode` |
| **修改**（RSA加密） | `encryptedEmail` | `encryptedPhone` | `verificationCode`（明文） |
| **发送验证码** | `email` | `phone` | - |

### 命名原则

1. **敏感数据需要加密**：
   - 邮箱、手机号、密码等 → 添加 `encrypted` 前缀
   - 例如：`encryptedEmail`, `encryptedPhone`, `encryptedPassword`

2. **验证码不需要加密**：
   - 验证码是一次性短期凭证，由后端验证
   - 直接使用 `verificationCode`（明文）

3. **sessionId 不加密**：
   - sessionId 用于会话跟踪，不需要加密
   - 直接传递明文

## 调试建议

### 1. 查看控制台日志

修改后会输出详细的请求信息：
```
发送邮箱修改请求: {
  sessionId: "xxx",
  encryptedEmail: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A...",
  verificationCode: "123456"  // 明文显示
}
```

### 2. 检查网络请求

打开浏览器开发者工具 → Network 标签：
1. 找到 `/profile/email/set` 请求
2. 查看 Request Payload
3. 确认字段名为 `encryptedEmail` 和 `encryptedVerificationCode`

### 3. 测试流程

**邮箱修改测试**：
1. 进入个人信息页面
2. 点击"邮箱地址"的"修改"按钮
3. 输入新邮箱
4. 点击"发送验证码"
5. 输入收到的验证码
6. 点击"保存"
7. **预期**：修改成功，不再返回"邮箱不能为空"错误

**手机号修改测试**：
1. 进入个人信息页面
2. 点击"手机号"的"修改"按钮
3. 输入新手机号
4. 点击"发送验证码"
5. 输入收到的验证码
6. 点击"保存"
7. **预期**：修改成功

## 相关文件

- `src/views/ProfileEditView.vue`
  - 第 1061-1142 行：邮箱修改逻辑（含验证码检查）
  - 第 1143-1230 行：手机号修改逻辑（含验证码检查）
  - 第 693-719 行：isFieldValid 计算属性

- `src/views/RegisterView.vue`
  - 第 608-622 行：注册请求数据构造（参考）

- `src/utils/email.js`
  - 第 18-80 行：发送邮箱验证码接口

## 修复总结

### 已修复的问题

1. ✅ **字段名错误**：将 `email` 改为 `encryptedEmail`
2. ✅ **验证码不应加密**：使用明文 `verificationCode`，而不是加密后的字段
3. ✅ **验证码空值检查**：在发送请求前验证验证码是否为空
4. ✅ **详细日志输出**：添加调试日志，方便排查问题

### 验证流程

1. 用户输入新邮箱/手机号
2. 点击“发送验证码”
3. 输入收到的验证码
4. 点击“保存”
5. 前端验证：
   - 检查邮箱/手机号是否变化
   - 检查验证码是否为空
   - 检查 sessionId 是否存在
6. RSA 加密邮箱/手机号（**验证码不加密**）
7. 构造请求数据：
   - `encryptedEmail` / `encryptedPhone` - 加密后的敏感数据
   - `verificationCode` - 明文验证码
   - `sessionId` - 会话 ID
8. 发送请求到后端
9. 处理响应

## 更新日期

2026-05-02
