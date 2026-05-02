# 会话 ID 改造方案 - 接口清单与影响分析

## 📋 改造背景

当前系统使用 **后端生成的会话 ID（sessionId）**，通过 Cookie 存储和管理。需要改为 **前端生成会话 ID**，刷新页面时重置。

### 核心变化

| 项目 | 修改前 | 修改后 |
|------|--------|--------|
| **sessionId 来源** | 后端 `/auth/rsa-key` 接口返回 | 前端生成（UUID） |
| **存储位置** | Cookie + 组件 state | Cookie + 组件 state |
| **生命周期** | 7天（Cookie 有效期） | 页面会话（刷新即重置） |
| **验证机制** | `/auth/is_rsa_valid` 验证 sessionId | 无需验证（前端生成） |

---

## 🔍 涉及的所有接口

### 一、认证相关接口（AUTH_API）

#### 1. 获取 RSA 公钥
- **接口路径**: `GET /auth/rsa-key`
- **修改后**:
  - 请求：
  ```json
      {
          "sessionId": "xxx" // 前端生成
      }
  ```
  - 响应：`{ publicKey: string }`
  - 后端需将 `sessionId` 作为键值将RSA相关信息添加至Redis缓存中


#### 2. 验证 RSA 密钥有效性
- **接口路径**: `POST /auth/is_rsa_valid`
- **修改后**:
  - 请求头：
  ```json
    {
      "sessionId": "xxx",
      "publicKey": "string"
    }
  ```
  - 响应：`{ valid: boolean }`

#### 3. 登录（接口形式不需要修改）
- **接口路径**: `POST /auth/login`
- **当前实现**:
  - 请求：
  ```json
    {
      "sessionId": "xxx",
      "userId": "username",
      "encryptedPassword": "xxx",
      "tokenExpiration": 604800
    }
  ```
  - 响应：`{ code: 200, success: true, token: "jwt", userId: "...", ... }`

#### 4. 注册
- **接口路径**: `POST /auth/register`
- **修改后（⚠️重要：注册逻辑变化）**:
  - 请求：
  ```json
    {
      "sessionId": "xxx",                              // 会话 ID（前端生成，RSA、邮箱验证、手机验证共用）
      "data": [
        {
          "nickname": "string",                        // 用户昵称
          "email": "user@example.com",                 // 邮箱地址(不能为空，不能重复)
          "emailVfCode": "123456",                     // 邮箱验证码
          "phone": "13800138000",                      // 手机号（11位）
          "phoneVfCode": "123456",                     // 手机验证码
          "encryptedPassword": "xxx",                  // RSA 加密后的密码
          "securityQuestion": 1,                       // 安全问题编号（整数）
          "securityAnswer": "string",                  // 安全问题答案
          "verificationCode": "123456",                // 邮箱验证码（6位）
          "phoneVerificationCode": "123456"            // 手机验证码（6位）
        }
      ]
    }
  ```
  - 响应：`{ code: 200, success: true, data: [...] }`
- **需要改动**: ✅ **是**
  - ✅ 请求中仍需携带 `sessionId`
  - ✅ sessionId 改为前端生成并传递
  - ✅ 注册成功后清除 sessionId

#### 5. 获取安全问题列表（不需修改）
- **接口路径**: `GET /auth/security-questions`
- **当前实现**:
  - 请求：无参数
  - 响应：`{ code: 200, success: true, questions: [...] }`

#### 6. 发送邮箱验证码
- **接口路径**: `POST /auth/vfcode/email`
- **修改后**:
  - 请求：
  ```json
    {
      "sessionId": "xxx",
      "email": "user@example.com"
    }
  ```
  - 响应：`{ code: 200, success: true, message: "..." }`

#### 7. 发送手机验证码
- **接口路径**: `POST /auth/vfcode/phone`
- **修改后**:
- 请求：
  ```json
    {
      "sessionId": "xxx",
      "phoneNumber": "13800138000"
    }
  ```
  - 响应：`{ code: 200, success: true, message: "..." }`

---

### 二、工具函数相关文件

#### 1. `src/utils/rsa.js`

##### 1.1 `fetchRSAKey()` - 获取 RSA 公钥
- **当前功能**: 
  - 调用 `/auth/rsa-key` 获取公钥和 sessionId
  - 将 sessionId 和 publicKey 保存到 Cookie
- **需要改动**: ✅ **是**
  - ❌ 移除从响应中提取 `sessionId` 的逻辑
  - ❌ 移除保存 `sessionId` 到 Cookie 的代码
  - ✅ 保留获取和保存 `publicKey` 的逻辑
  - ✅ 新增：前端生成 sessionId 并返回

**修改示例**:
```javascript
// 修改前
export const fetchRSAKey = async () => {
  const response = await fetch(AUTH_API.RSA_KEY, { credentials: 'include' })
  const data = await response.json()
  
  let sessionId = data.sessionId
  if (!sessionId) {
    sessionId = getSessionIdFromCookie()
  }
  
  setCookie('sessionId', sessionId, 7)
  setCookie('rsaPublicKey', encodeURIComponent(data.publicKey), 7)
  
  return { publicKey: data.publicKey, sessionId: sessionId || '' }
}

// 修改后
export const fetchRSAKey = async () => {
  const response = await fetch(AUTH_API.RSA_KEY, { credentials: 'include' })
  const data = await response.json()
  
  // 前端生成 sessionId
  const sessionId = generateSessionId()
  
  // 只保存 publicKey 到 Cookie
  setCookie('rsaPublicKey', encodeURIComponent(data.publicKey), 7)
  
  return { publicKey: data.publicKey, sessionId }
}
```

##### 1.2 `getValidatedRSAKey()` - 验证 RSA 密钥
- **当前功能**:
  - 从 Cookie 读取 sessionId 和 publicKey
  - 调用 `/auth/is_rsa_valid` 验证密钥有效性
  - 如果无效，使用后端返回的新密钥
- **需要改动**: ✅ **是**
  - ❌ **整个函数可能需要重构或移除**
  - 新方案：直接从 Cookie 读取 publicKey，sessionId 由前端生成
  - 如果仍需验证 publicKey 有效性，可以简化验证逻辑（去掉 sessionId）

**修改建议**:
```javascript
// 方案1：完全移除验证，直接读取
export const getStoredRSAKey = () => {
  const publicKey = getRSAPublicKeyFromCookie()
  if (!publicKey) {
    return null
  }
  
  return {
    publicKey: decodeURIComponent(publicKey),
    sessionId: generateSessionId()  // 每次生成新的
  }
}

// 方案2：保留验证但去掉 sessionId
export const validateAndGetRSAKey = async () => {
  const publicKey = getRSAPublicKeyFromCookie()
  if (!publicKey) {
    return null
  }
  
  // 如果需要验证公钥有效性（可选）
  try {
    const response = await fetch(AUTH_API.VALIDATE_RSA, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicKey: decodeURIComponent(publicKey) })
    })
    
    const data = await response.json()
    if (data.valid) {
      return {
        publicKey: decodeURIComponent(publicKey),
        sessionId: generateSessionId()
      }
    }
  } catch (error) {
    console.error('验证失败:', error)
  }
  
  return null
}
```

##### 1.3 `validateRsaKey()` - 验证 RSA 密钥对
- **当前功能**: 调用 `/auth/is_rsa_valid` 验证密钥
- **需要改动**: ✅ **是**
  - ⚠️ 如果保留了 `VALIDATE_RSA` 接口，需要同步修改
  - 建议：评估是否可以移除此函数

---

#### 2. `src/utils/cookie.js`

##### 2.1 `getSessionIdFromCookie()` - 从 Cookie 读取 sessionId
- **当前功能**: 读取 Cookie 中的 `sessionId`
- **需要改动**: ❌ **废弃**
  - 此函数将不再需要
  - 可以保留但标记为 deprecated

##### 2.2 `setCookie('sessionId', ...)` - 保存 sessionId 到 Cookie
- **当前功能**: 将 sessionId 保存到 Cookie
- **需要改动**: ❌ **移除所有调用**
  - 搜索所有调用此函数的地方并移除

---

#### 3. `src/utils/email.js` - 邮箱验证码

##### 3.1 `sendVerificationCode()` - 发送邮箱验证码
- **当前功能**:
  - 调用 `/auth/vfcode/email` 发送验证码
  - 返回 `{ success, sessionId, message }`
- **需要改动**: ⚠️ **字段重命名**
  - ✅ 将返回的 `sessionId` 改为 `verificationSessionId`
  - 避免与 RSA sessionId 混淆

**修改示例**:
```javascript
// 修改前
return {
  success: true,
  sessionId: result.sessionId,
  message: result.message
}

// 修改后
return {
  success: true,
  verificationSessionId: result.verificationSessionId,  // 后端需配合改名
  message: result.message
}
```

---

#### 4. `src/utils/phone.js` - 手机验证码

##### 4.1 `sendPhoneVerificationCode()` - 发送手机验证码
- **当前功能**:
  - 调用 `/auth/vfcode/phone` 发送验证码
  - 返回 `{ success, sessionId, message }`
- **需要改动**: ⚠️ **字段重命名**
  - ✅ 将返回的 `sessionId` 改为 `phoneVerificationSessionId`

**修改示例**:
```javascript
// 修改前
return {
  success: true,
  sessionId: result.sessionId,
  message: result.message
}

// 修改后
return {
  success: true,
  phoneVerificationSessionId: result.phoneVerificationSessionId,
  message: result.message
}
```

---

### 三、视图组件文件

#### 1. `src/views/LoginView.vue` - 登录页面

##### 1.1 状态变量
```javascript
// 当前代码
const rsaPublicKey = ref('')
const sessionId = ref('')

// 保持不变，但 sessionId 的来源改变
```

##### 1.2 `initRSAKey()` - 初始化 RSA 密钥
- **当前逻辑**:
  1. 调用 `getValidatedRSAKey()` 从 Cookie 验证
  2. 如果失败，调用 `fetchRSAKey()` 重新获取
  3. 保存 `rsaPublicKey` 和 `sessionId` 到组件状态
- **需要改动**: ✅ **是**
  - 修改验证逻辑（去掉 sessionId 验证）
  - sessionId 改为前端生成

**修改要点**:
```javascript
const initRSAKey = async () => {
  try {
    logger.info('开始初始化RSA密钥...')
    
    // 1. 尝试从 Cookie 读取 publicKey
    const storedKey = getRSAPublicKeyFromCookie()
    
    if (storedKey) {
      // 验证成功，使用 Cookie 中的公钥
      rsaPublicKey.value = decodeURIComponent(storedKey)
      sessionId.value = generateSessionId()  // ✅ 前端生成
      logger.info('使用 Cookie 中的 RSA 公钥')
    } else {
      // Cookie 中没有，重新获取
      logger.info('Cookie 中没有公钥，重新获取')
      const keyData = await fetchRSAKey()
      rsaPublicKey.value = keyData.publicKey
      sessionId.value = keyData.sessionId  // ✅ 前端生成
      logger.info('已获取新的 RSA 公钥')
    }
    
    logger.info('RSA密钥初始化完成')
  } catch (error) {
    logger.error('RSA密钥初始化失败:', error)
    showError('系统初始化失败：无法获取RSA密钥')
  }
}
```

##### 1.3 `handleLogin()` - 处理登录
- **当前逻辑**: 使用 `sessionId.value` 构造登录请求
- **需要改动**: ✅ **是**
  - sessionId 已经是前端生成的，直接使用即可
  - 登录成功后清除 sessionId（可选）

**修改要点**:
```javascript
const handleLogin = async () => {
  // ... 验证逻辑 ...
  
  const loginData = {
    sessionId: sessionId.value,  // ✅ 前端生成的 sessionId
    userId: loginForm.value.username,
    encryptedPassword: encryptedPassword,
    tokenExpiration: 604800
  }
  
  // ... 发送请求 ...
  
  if (result.code === 200 && result.success === true) {
    // 登录成功
    saveAuthInfo(result.token, userInfo)
    
    // ✅ 清除 RSA 相关数据（可选）
    deleteCookie('rsaPublicKey')
    sessionId.value = ''  // 清空 sessionId
    
    router.push('/')
  }
}
```

---

#### 2. `src/views/RegisterView.vue` - 注册页面

##### 2.1 状态变量
```javascript
// 当前代码
const rsaPublicKey = ref('')
const sessionId = ref('')
const verificationSessionId = ref('')  // 邮箱验证码会话 ID
const phoneVerificationSessionId = ref('')  // 手机验证码会话 ID
```

##### 2.2 `initRSAKey()` - 初始化 RSA 密钥
- **需要改动**: ✅ **是**
  - 与 LoginView 相同的修改逻辑

##### 2.3 `handleSendVerificationCode()` - 发送邮箱验证码
- **当前逻辑**:
  ```javascript
  const result = await sendVerificationCode(registerForm.value.email)
  if (result.success) {
    verificationSessionId.value = result.sessionId  // ⚠️ 字段名
  }
  ```
- **需要改动**: ⚠️ **字段重命名**
  ```javascript
  if (result.success) {
    verificationSessionId.value = result.verificationSessionId  // ✅ 改名后
  }
  ```

##### 2.4 `handleSendPhoneVerificationCode()` - 发送手机验证码
- **当前逻辑**:
  ```javascript
  const result = await sendPhoneVerificationCode(registerForm.value.phone)
  if (result.success) {
    phoneVerificationSessionId.value = result.sessionId  // ⚠️ 字段名
  }
  ```
- **需要改动**: ⚠️ **字段重命名**
  ```javascript
  if (result.success) {
    phoneVerificationSessionId.value = result.phoneVerificationSessionId  // ✅ 改名后
  }
  ```

##### 2.5 `handleRegister()` - 处理注册
- **当前逻辑**: 使用三个 sessionId 构造注册请求
- **需要改动**: ✅ **是**
  - `sessionId`: 前端生成的 RSA 会话 ID
  - `verificationSessionId`: 邮箱验证码会话 ID
  - `phoneVerificationSessionId`: 手机验证码会话 ID
  
**修改要点**:
```javascript
const handleRegister = async () => {
  // ... 验证逻辑 ...
  
  const registerData = {
    sessionId: sessionId.value,  // ✅ 前端生成
    verificationSessionId: verificationSessionId.value,
    phoneVerificationSessionId: phoneVerificationSessionId.value,
    data: [...]
  }
  
  // ... 发送请求 ...
  
  if (result.code === 200 && result.success === true) {
    // 注册成功
    deleteCookie('rsaPublicKey')
    sessionId.value = ''  // ✅ 清空
    
    router.push('/login')
  }
}
```

---

### 四、新增工具函数

#### 1. 生成 Session ID

需要在 `src/utils/` 下创建新的工具函数：

**文件**: `src/utils/sessionId.js`

```javascript
/**
 * 生成唯一的会话 ID
 * @returns {string} UUID v4 格式的会话 ID
 */
export const generateSessionId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * 将会话 ID 存储到 sessionStorage（可选，用于跨组件共享）
 * @param {string} sessionId 
 */
export const storeSessionId = (sessionId) => {
  sessionStorage.setItem('rsa_session_id', sessionId)
}

/**
 * 从 sessionStorage 读取会话 ID（可选）
 * @returns {string|null}
 */
export const getStoredSessionId = () => {
  return sessionStorage.getItem('rsa_session_id')
}

/**
 * 清除存储的会话 ID
 */
export const clearSessionId = () => {
  sessionStorage.removeItem('rsa_session_id')
}
```

---

## 📊 改动汇总表格

| 文件 | 改动类型 | 改动内容 | 优先级 |
|------|---------|---------|--------|
| **src/config/api.js** | ⚠️ 可选 | 移除 `VALIDATE_RSA` 接口定义（如果不再需要） | P2 |
| **src/utils/sessionId.js** | ✅ 新增 | 创建 sessionId 生成工具 | P0 |
| **src/utils/rsa.js** | ✅ 大量 | 重构 `fetchRSAKey()` 和 `getValidatedRSAKey()` | P0 |
| **src/utils/cookie.js** | ✅ 少量 | 移除 `getSessionIdFromCookie()` 的调用 | P1 |
| **src/utils/email.js** | ⚠️ 字段 | 返回值字段改名 `sessionId` → `verificationSessionId` | P1 |
| **src/utils/phone.js** | ⚠️ 字段 | 返回值字段改名 `sessionId` → `phoneVerificationSessionId` | P1 |
| **src/views/LoginView.vue** | ✅ 中量 | 修改 `initRSAKey()` 逻辑 | P0 |
| **src/views/RegisterView.vue** | ✅ 中量 | 修改 `initRSAKey()` 和验证码处理逻辑 | P0 |

---

## 🎯 实施步骤建议

### 第一阶段：基础准备（P0）

1. ✅ 创建 `src/utils/sessionId.js` - sessionId 生成工具
2. ✅ 修改 `src/utils/rsa.js` - 重构密钥获取逻辑
3. ✅ 修改 `src/views/LoginView.vue` - 适配新的 sessionId 机制
4. ✅ 修改 `src/views/RegisterView.vue` - 适配新的 sessionId 机制

### 第二阶段：字段规范化（P1）

5. ⚠️ 修改 `src/utils/email.js` - 字段重命名
6. ⚠️ 修改 `src/utils/phone.js` - 字段重命名
7. ✅ 清理 `src/utils/cookie.js` - 移除 sessionId 相关代码

### 第三阶段：后端配合（P2）

8. ⚠️ 后端修改 `/auth/rsa-key` 接口 - 移除响应中的 sessionId
9. ⚠️ 后端修改 `/auth/vfcode/email` 接口 - 字段改名
10. ⚠️ 后端修改 `/auth/vfcode/phone` 接口 - 字段改名
11. ⚠️ 评估是否移除 `/auth/is_rsa_valid` 接口

---

## ⚠️ 注意事项

### 1. 向后兼容性

- 如果后端尚未修改，前端需要兼容两种响应格式
- 可以使用条件判断：
  ```javascript
  const sessionId = result.sessionId || result.verificationSessionId || generateSessionId()
  ```

### 2. 测试重点

- ✅ 登录流程测试
- ✅ 注册流程测试
- ✅ 验证码发送测试
- ✅ 页面刷新后 sessionId 重置测试
- ✅ 多标签页场景测试

### 3. 安全性考虑

- 前端生成的 sessionId 需要有足够的随机性（UUID v4）
- sessionId 仅用于关联 RSA 密钥对，不用于身份认证
- 真正的身份认证仍由 JWT 令牌负责

### 4. 调试建议

- 在控制台打印 sessionId 的生成和使用情况
- 验证每次页面刷新后 sessionId 是否变化
- 验证登录/注册请求中携带的 sessionId 是否正确

---

## 📝 总结

本次改造涉及 **7 个文件**，主要分为三类改动：

1. **核心逻辑改动**（P0）：rsa.js、LoginView.vue、RegisterView.vue
2. **字段规范化**（P1）：email.js、phone.js、cookie.js
3. **后端配合**（P2）：3 个接口调整

**关键变化**：
- ❌ 移除：后端生成 sessionId → Cookie 存储 → 验证机制
- ✅ 新增：前端生成 sessionId → 组件状态管理 → 页面刷新重置

**预期收益**：
- ✅ 简化会话管理逻辑
- ✅ 减少 Cookie 依赖
- ✅ 提高页面刷新后的安全性（sessionId 自动重置）
- ✅ 更清晰的责任划分（前端管 sessionId，后端管 RSA 密钥）

---

**文档版本**: v1.0  
**创建时间**: 2026-05-01  
**最后更新**: 2026-05-01
