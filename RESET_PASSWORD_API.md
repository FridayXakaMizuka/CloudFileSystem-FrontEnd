# 重置密码接口文档

## 概述

本文档描述重置密码功能的后端接口规范，包括查找用户和后续验证步骤。

---

## 1. 查找用户接口

### 接口信息

- **路径**: `POST /auth/reset_password/find_user`
- **描述**: 根据用户ID或邮箱查找用户，返回可用的验证方式
- **认证**: 不需要（公开接口）

### 请求参数

```json
{
  "sessionId": "string",           // 前端生成的会话ID (UUID v4)
  "encryptedUserIdOrEmail": "string" // RSA加密的用户ID或邮箱
}
```

**字段说明**:
- `sessionId`: 前端通过 `getSessionId()` 生成的 UUID，用于关联RSA密钥
- `encryptedUserIdOrEmail`: 使用RSA公钥加密的用户ID或邮箱地址

### 响应格式

#### 成功响应 (HTTP 200)

```json
{
  "code": 200,
  "success": true,
  "message": "找到用户",
  "id": "10001",                              // 用户ID（字符串格式）
  "email": "user@example.com",              // 用户邮箱（可能为空字符串）
  "phone": "138****5678",                   // 手机号（可能为空字符串）
  "securityQuestion": 1,                    // 密保问题序号（可能为null）
  "securityQuestionText": "您的出生地是？"   // 密保问题文本（可能为空字符串）
}
```

**字段说明**:
- `id`: 用户的唯一标识符（字符串格式），用于前端显示
- `email`: 用户的邮箱地址，如果未设置则为空字符串 `""`
- `phone`: 用户的手机号，如果未设置则为空字符串 `""`
- `securityQuestion`: 密保问题的序号（整数），如果未设置则为 `null`
- `securityQuestionText`: 密保问题的具体文本，如果未设置则为空字符串 `""`

#### 失败响应 (HTTP 400/404)

```json
{
  "code": 404,
  "success": false,
  "message": "未找到该用户，请检查输入"
}
```

**常见错误码**:
- `400`: 请求参数错误（sessionId无效、加密数据格式错误等）
- `404`: 未找到用户
- `500`: 服务器内部错误

### 业务逻辑

1. **验证 sessionId**
   - 检查 sessionId 是否存在且有效（5分钟有效期）
   - 从 Redis/内存中获取对应的 RSA 私钥

2. **解密用户ID或邮箱**
   - 使用 RSA 私钥解密 `encryptedUserIdOrEmail`
   - 判断是用户ID还是邮箱（用户ID为纯数字，邮箱包含@符号）

3. **查询用户**
   - 如果是用户ID：按 ID 查询用户表
   - 如果是邮箱：按邮箱查询用户表

4. **返回验证方式**
   - 检查用户是否设置了邮箱、手机号、密保问题
   - 只返回已设置的验证方式（前端会根据返回值显示对应按钮）

### 示例代码（Node.js/Express）

```javascript
const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// 存储 sessionId 和 RSA 密钥的映射（实际应使用 Redis）
const sessionStore = new Map();

router.post('/auth/reset_password/find_user', async (req, res) => {
  try {
    const { sessionId, encryptedUserIdOrEmail } = req.body;
    
    // 1. 验证 sessionId
    if (!sessionId || !sessionStore.has(sessionId)) {
      return res.status(400).json({
        code: 400,
        success: false,
        message: '无效的会话ID'
      });
    }
    
    // 2. 获取 RSA 私钥
    const privateKey = sessionStore.get(sessionId);
    
    // 3. 解密用户ID或邮箱
    let userIdOrEmail;
    try {
      userIdOrEmail = crypto.privateDecrypt(
        {
          key: privateKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING
        },
        Buffer.from(encryptedUserIdOrEmail, 'base64')
      ).toString('utf-8');
    } catch (error) {
      return res.status(400).json({
        code: 400,
        success: false,
        message: '解密失败'
      });
    }
    
    // 4. 查询用户
    let user;
    if (/^\d+$/.test(userIdOrEmail)) {
      // 用户ID
      user = await User.findById(userIdOrEmail);
    } else {
      // 邮箱
      user = await User.findByEmail(userIdOrEmail);
    }
    
    if (!user) {
      return res.status(404).json({
        code: 404,
        success: false,
        message: '未找到该用户，请检查输入'
      });
    }
    
    // 5. 返回验证方式
    res.json({
      code: 200,
      success: true,
      message: '找到用户',
      email: user.email || '',
      phone: user.phone || '',
      securityQuestion: user.security_question_id || null,
      securityQuestionText: user.security_question_text || ''
    });
    
  } catch (error) {
    console.error('查找用户失败:', error);
    res.status(500).json({
      code: 500,
      success: false,
      message: '服务器内部错误'
    });
  }
});

module.exports = router;
```

---

## 2. 后续接口规划（待实现）

### 2.1 发送验证码接口

#### 邮箱验证码

- **路径**: `POST /auth/reset_password/send_email_code`
- **请求**:
  ```json
  {
    "sessionId": "string",
    "email": "string"  // 明文邮箱（已从第一步获取）
  }
  ```
- **响应**:
  ```json
  {
    "code": 200,
    "success": true,
    "message": "验证码已发送"
  }
  ```

#### 手机验证码

- **路径**: `POST /auth/reset_password/send_phone_code`
- **请求**:
  ```json
  {
    "sessionId": "string",
    "phone": "string"  // 明文手机号（已从第一步获取）
  }
  ```
- **响应**:
  ```json
  {
    "code": 200,
    "success": true,
    "message": "验证码已发送"
  }
  ```

### 2.2 验证答案接口

#### 邮箱/手机验证码验证

- **路径**: `POST /auth/reset_password/verify_code`
- **请求**:
  ```json
  {
    "sessionId": "string",
    "verificationCode": "string",  // 6位验证码
    "type": "email|phone"          // 验证类型
  }
  ```
- **响应**:
  ```json
  {
    "code": 200,
    "success": true,
    "message": "验证成功",
    "resetToken": "string"  // 用于下一步重置密码的临时令牌
  }
  ```

#### 密保问题验证

- **路径**: `POST /auth/reset_password/verify_security_answer`
- **请求**:
  ```json
  {
    "sessionId": "string",
    "securityAnswer": "string"  // 用户输入的答案
  }
  ```
- **响应**:
  ```json
  {
    "code": 200,
    "success": true,
    "message": "验证成功",
    "resetToken": "string"
  }
  ```

### 2.3 重置密码接口

- **路径**: `POST /auth/reset_password/set_new_password`
- **请求**:
  ```json
  {
    "resetToken": "string",       // 从上一步获取的临时令牌
    "newPassword": "string",      // RSA加密的新密码
    "confirmPassword": "string"   // RSA加密的确认密码
  }
  ```
- **响应**:
  ```json
  {
    "code": 200,
    "success": true,
    "message": "密码重置成功"
  }
  ```

---

## 3. 安全注意事项

### 3.1 SessionId 管理

- SessionId 有效期：**5分钟**（300秒）
- 每次成功请求后重置有效期为 **295秒**
- 登录/注册成功后立即清除 SessionId

### 3.2 RSA 加密

- 所有敏感信息（用户ID、邮箱、密码）必须使用 RSA 加密传输
- 公钥通过 `/auth/rsa-key` 接口获取
- 私钥存储在服务器端，与 SessionId 关联

### 3.3 防暴力破解

- 限制同一 IP 的请求频率（例如：每分钟最多 5 次）
- 验证码错误次数限制（例如：最多尝试 5 次）
- 记录失败的尝试日志

### 3.4 数据脱敏

- 前端显示的邮箱和手机号需要脱敏处理
- 后端日志中不应记录完整的敏感信息

---

## 4. 前端调用流程

```
┌─────────────────────────────────────────────────────────────┐
│                     用户访问重置密码页面                      │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│              onMounted: 初始化 RSA 密钥                       │
│                getSessionId()                                │
│                fetchRSAKey()                                 │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│              第一步：输入用户ID或邮箱                          │
│                                                              │
│  用户输入 → 前端验证格式 → 点击"下一步"                       │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│              重新获取 RSA 公钥                                │
│                initRSAKey()                                  │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│              加密并发送请求                                   │
│                                                              │
│  encryptPassword(userIdOrEmail, publicKey)                  │
│  POST /auth/reset_password/find_user                        │
│  Body: { sessionId, encryptedUserIdOrEmail }                │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│              后端返回用户信息                                 │
│                                                              │
│  {                                                           │
│    email: "user@example.com",                               │
│    phone: "13812345678",                                    │
│    securityQuestion: 1,                                     │
│    securityQuestionText: "您的出生地是？"                    │
│  }                                                           │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│              第二步：选择验证方式（左滑动画）                  │
│                                                              │
│  显示可用的验证方式按钮：                                      │
│  - 📧 邮箱验证 (u***r@example.com)                           │
│  - 📱 手机验证 (138****5678)                                 │
│  - ❓ 密保问题 (您的出生地是？)                               │
│                                                              │
│  按钮："上一步" | "下一步（待实现）"                          │
└─────────────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│              点击"上一步"                                     │
│                                                              │
│  - 清空用户信息                                              │
│  - 清除旧的 SessionId 和公钥                                 │
│  - 重新调用 initRSAKey()                                     │
│  - 返回第一步界面                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. 测试用例

### 测试场景 1：通过用户ID查找

**请求**:
```bash
curl -X POST http://localhost:8835/auth/reset_password/find_user \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "encryptedUserIdOrEmail": "BASE64_ENCRYPTED_10001"
  }'
```

**预期响应**:
```json
{
  "code": 200,
  "success": true,
  "message": "找到用户",
  "email": "test@example.com",
  "phone": "13812345678",
  "securityQuestion": 1,
  "securityQuestionText": "您的出生地是？"
}
```

### 测试场景 2：通过邮箱查找

**请求**:
```bash
curl -X POST http://localhost:8835/auth/reset_password/find_user \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "encryptedUserIdOrEmail": "BASE64_ENCRYPTED_test@example.com"
  }'
```

**预期响应**: 同上

### 测试场景 3：用户不存在

**预期响应**:
```json
{
  "code": 404,
  "success": false,
  "message": "未找到该用户，请检查输入"
}
```

### 测试场景 4：SessionId 无效

**预期响应**:
```json
{
  "code": 400,
  "success": false,
  "message": "无效的会话ID"
}
```

---

## 6. 数据库设计参考

### 用户表 (users)

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nickname VARCHAR(50) NOT NULL,
  email VARCHAR(100),
  phone VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  security_question_id INT,
  security_answer_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_email (email),
  INDEX idx_phone (phone)
);
```

### 密保问题表 (security_questions)

```sql
CREATE TABLE security_questions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  question_text VARCHAR(200) NOT NULL
);

-- 示例数据
INSERT INTO security_questions (question_text) VALUES
('您的出生地是？'),
('您第一所学校的名字是？'),
('您最喜欢的颜色是？'),
('您的宠物名字是？');
```

---

## 7. 常见问题

### Q1: 为什么要每次都重新获取 RSA 公钥？

**A**: 
- 确保使用最新的密钥对
- 防止密钥泄露后的重放攻击
- SessionId 过期后需要新的密钥对

### Q2: 为什么返回的手机号和邮箱可能是空的？

**A**: 
- 用户可能未设置手机号或邮箱
- 前端需要根据返回值动态显示可用的验证方式
- 至少需要有一种验证方式可用

### Q3: SessionId 的有效期为什么是 5 分钟？

**A**: 
- 平衡安全性和用户体验
- 足够完成重置密码流程
- 过短会导致频繁重新获取密钥
- 过长会增加安全风险

### Q4: 如何防止恶意用户枚举邮箱？

**A**: 
- 实施 IP 限流（每分钟最多 5 次请求）
- 返回统一的错误消息（不区分"用户不存在"和"密码错误"）
- 记录并监控异常请求模式

---

## 8. 更新日志

| 版本 | 日期 | 更新内容 |
|------|------|---------|
| 1.0 | 2026-05-02 | 初始版本，定义查找用户接口 |

---

**文档维护者**: Frontend Team  
**最后更新**: 2026-05-02
