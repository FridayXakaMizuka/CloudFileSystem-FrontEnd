# RSA 密钥 Cookie 验证 - 方案 1 实施完成

## ✅ 已完成的修改

### 1. Cookie 管理工具增强 (`src/utils/cookie.js`)

**新增功能**:
- `getRSAPublicKeyFromCookie()` - 从 Cookie 中获取 RSA 公钥（支持 URI 解码）

**修改内容**:
```javascript
export const getRSAPublicKeyFromCookie = () => {
  const publicKey = getCookie('rsaPublicKey')
  if (publicKey) {
    try {
      return decodeURIComponent(publicKey)
    } catch (error) {
      console.error('❌ 解码 RSA 公钥失败:', error)
      return null
    }
  }
  return null
}
```

### 2. RSA 工具函数优化 (`src/utils/rsa.js`)

#### 2.1 导入新函数
```javascript
import { setCookie, getSessionIdFromCookie, getRSAPublicKeyFromCookie } from './cookie'
```

#### 2.2 `fetchRSAKey()` 函数改进
**改进点**:
- 同时保存 `sessionId` 和 `publicKey` 到 Cookie
- 对公钥进行 URI 编码，避免特殊字符问题

```javascript
// 将 sessionId 和 publicKey 都保存到 Cookie
if (sessionId) {
  setCookie('sessionId', sessionId, 7)
  console.log('✅ sessionId 已保存到 Cookie')
}

if (data.publicKey) {
  setCookie('rsaPublicKey', encodeURIComponent(data.publicKey), 7)
  console.log('✅ publicKey 已保存到 Cookie')
}
```

#### 2.3 `getValidatedRSAKey()` 函数重构
**改进点**:
1. 从 Cookie 读取 sessionId 和 publicKey
2. 构建包含两者的请求体
3. 发送完整信息给后端验证
4. 自动更新 Cookie 中的密钥对

**关键逻辑**:
```javascript
// 1. 从 Cookie 读取 sessionId 和 publicKey
const sessionId = getSessionIdFromCookie()
const publicKey = getRSAPublicKeyFromCookie()

// 2. 构建请求体
const requestBody = {
  sessionId: sessionId
}

if (publicKey) {
  requestBody.publicKey = publicKey
}

// 3. 发送验证请求
const response = await fetch('http://localhost:8835/api/auth/is_rsa_valid', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(requestBody)
})

// 4. 处理响应并更新 Cookie
if (data.valid === true && data.publicKey) {
  // 如果后端返回了新的公钥，更新 Cookie
  if (data.publicKey !== publicKey) {
    setCookie('rsaPublicKey', encodeURIComponent(data.publicKey), 7)
  }
  return { publicKey: data.publicKey, sessionId: sessionId }
}

if (data.valid === false && data.publicKey && data.sessionId) {
  // 保存新的密钥对到 Cookie
  setCookie('sessionId', data.sessionId, 7)
  setCookie('rsaPublicKey', encodeURIComponent(data.publicKey), 7)
  return { publicKey: data.publicKey, sessionId: data.sessionId }
}
```

### 3. 文档更新

#### 3.1 RSA_DEBUG_GUIDE.md
- 添加 Cookie 存储内容说明
- 添加验证请求格式说明
- 更新预期行为描述

#### 3.2 TEST_RSA_FIX.md
- 更新修复内容说明
- 更新所有测试步骤的预期日志
- 添加验证要点和性能对比

## 📋 Cookie 存储规范

### 存储内容
| Cookie 名称 | 存储内容 | 编码方式 | 有效期 |
|------------|---------|---------|--------|
| `sessionId` | 会话 ID | 无 | 7 天 |
| `rsaPublicKey` | RSA 公钥 | URI 编码 | 7 天 |

### 示例
```javascript
// 设置 Cookie
setCookie('sessionId', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 7)
setCookie('rsaPublicKey', encodeURIComponent('MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8...'), 7)

// 读取 Cookie
const sessionId = getSessionIdFromCookie()
const publicKey = getRSAPublicKeyFromCookie()
```

## 🔄 工作流程

### 首次访问
```
1. 调用 /api/auth/rsa-key 获取密钥对
2. 保存 sessionId 和 publicKey 到 Cookie
3. 用户可以正常登录/注册
```

### 页面刷新（密钥有效）
```
1. 从 Cookie 读取 sessionId 和 publicKey
2. 发送验证请求（包含两者）
3. 后端返回 valid: true
4. 直接使用，无需重新获取
```

### 页面刷新（密钥失效）
```
1. 从 Cookie 读取 sessionId 和 publicKey
2. 发送验证请求（包含两者）
3. 后端返回 valid: false + 新密钥对
4. 自动更新 Cookie 中的 sessionId 和 publicKey
5. 使用新密钥对，用户无感知
```

## 🎯 优势

### 1. 符合后端接口规范
- 验证请求包含完整的 sessionId 和 publicKey
- 与后端期望的请求格式一致

### 2. 减少网络请求
- 密钥失效时不需要额外调用 `/api/auth/rsa-key`
- 一次验证即可完成密钥刷新

### 3. 提升用户体验
- 页面加载更快
- 用户无感知密钥刷新过程
- 更流畅的交互体验

### 4. 更好的可维护性
- Cookie 中存储完整的密钥对信息
- 代码逻辑更清晰
- 便于调试和问题排查

## 🧪 测试验证

### 清除 Cookie 测试
```javascript
// 在浏览器控制台执行
document.cookie.split(";").forEach(function(c) { 
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
});
console.log('✅ Cookie 已清除');
```

### 观察日志
打开浏览器开发者工具（F12），查看 Console 标签页，应该看到：

**首次访问**:
```
✅ sessionId 已保存到 Cookie
✅ publicKey 已保存到 Cookie
```

**页面刷新**:
```
✅ 从 Cookie 读取到 sessionId: xxx
✅ 从 Cookie 读取到 publicKey (长度): 392
📤 验证请求将包含 sessionId 和 publicKey
```

## 📝 相关文件

- `src/utils/cookie.js` - Cookie 管理工具
- `src/utils/rsa.js` - RSA 密钥管理
- `src/views/LoginView.vue` - 登录页面（使用示例）
- `src/views/RegisterView.vue` - 注册页面（使用示例）
- `RSA_DEBUG_GUIDE.md` - 详细排查指南
- `TEST_RSA_FIX.md` - 测试指南
- `CHANGES_SUMMARY.md` - 本文件（修改总结）

## ✨ 下一步

1. **清除浏览器 Cookie**
2. **刷新页面测试**
3. **观察控制台日志**
4. **验证 Network 请求**
5. **确认功能正常**

如有问题，请参考 [RSA_DEBUG_GUIDE.md](./RSA_DEBUG_GUIDE.md) 进行详细排查。
