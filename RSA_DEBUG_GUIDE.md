# RSA 密钥 Cookie 验证问题排查指南

## 🔑 后端接口行为说明

### Cookie 存储内容

前端会在 Cookie 中存储以下信息（有效期 7 天）：
- `sessionId`: 会话 ID
- `rsaPublicKey`: RSA 公钥（URI 编码）

### `/api/auth/is_rsa_valid` 接口的两种响应

#### 情况 1: 密钥有效
```json
{
  "code": 200,
  "success": true,
  "message": "RSA密钥对有效",
  "valid": true,
  "publicKey": "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...",
  "timestamp": 1713945700000
}
```
**前端行为**: 
- 直接使用返回的公钥和 Cookie 中的 sessionId
- 如果后端返回的公钥与 Cookie 中的不同，会更新 Cookie

#### 情况 2: 密钥失效（后端自动刷新）
```json
{
  "code": 200,
  "success": true,
  "message": "RSA密钥对已失效，已生成新的密钥对",
  "valid": false,
  "publicKey": "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEB...",
  "sessionId": "f9e8d7c6-b5a4-3210-fedc-ba9876543210",
  "timestamp": 1713945700000
}
```
**前端行为**: 
- ✅ 自动使用后端返回的新密钥对
- ✅ 自动更新 Cookie 中的 sessionId 和 publicKey
- ✅ 无需重新调用 `/api/auth/rsa-key` 接口
- 🎯 **这是正常行为，不是错误！**

### 验证请求格式

前端发送的验证请求包含：
```json
{
  "sessionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "publicKey": "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA..."
}
```

**注意**: 如果 Cookie 中没有 publicKey，则只发送 sessionId。

## 🔍 问题现象
使用 Cookie 验证 RSA 密钥有效性时一直返回无效。

## 📋 排查步骤

### 1. 检查浏览器控制台日志

打开浏览器开发者工具（F12），查看 Console 标签页，应该看到以下日志：

#### 首次访问（Cookie 中没有 sessionId）
```
🔑 开始获取RSA公钥...
📥 响应状态: 200
📥 响应OK: true
📋 响应数据: {publicKey: "...", sessionId: "..."}
✅ RSA公钥获取成功
✅ sessionId 已保存到 Cookie，页面刷新后可直接读取
```

#### 页面刷新后（从 Cookie 验证）
```
开始从 Cookie 读取并验证 RSA 密钥...
✅ 从 Cookie 读取到 sessionId: xxx-xxx-xxx
📡 正在向后端验证密钥有效性...
📥 验证响应状态: 200
📋 密钥验证响应数据: {valid: true, publicKey: "..."}
✅ RSA 密钥有效，使用 Cookie 中的 sessionId
```

### 2. 常见问题及解决方案

#### 问题 1: Cookie 中没有 sessionId
**症状：**
```
❌ Cookie 中没有 sessionId，需要重新获取密钥
```

**原因：**
- 后端没有正确设置 Cookie
- 前端没有正确保存 Cookie
- Cookie 已过期或被清除

**解决方案：**
1. 检查 `fetchRSAKey` 是否成功获取了 sessionId
2. 在浏览器 Application 标签页查看 Cookies
3. 确认 Cookie 名称是 `sessionId` 或 `JSESSIONID`

#### 问题 2: 验证请求失败
**症状：**
```
❌ 验证请求失败，HTTP 状态码: 404/500/其他
```

**原因：**
- 后端服务未启动
- API 路径错误
- 网络连接问题

**解决方案：**
1. 确认后端服务运行在 `http://localhost:8835`
2. 检查 API 路径 `/api/auth/is_rsa_valid` 是否正确
3. 在 Network 标签页查看请求详情

#### 问题 3: 验证响应中 valid 为 false
**症状：**
```
⚠️ RSA 密钥无效或响应格式错误
   - data.valid: false
   - data.publicKey: 存在/不存在
```

**原因：**
- sessionId 已过期
- sessionId 与后端存储的不匹配
- 后端会话已被销毁

**解决方案：**
1. 清除 Cookie 后重新获取密钥
2. 检查后端会话超时配置
3. 确认前后端 sessionId 一致

#### 问题 4: 验证响应中没有 publicKey
**症状：**
```
⚠️ RSA 密钥无效或响应格式错误
   - data.valid: true
   - data.publicKey: 不存在
```

**原因：**
- 后端响应格式不符合预期
- 后端逻辑错误

**解决方案：**
1. 检查后端 `/api/auth/is_rsa_valid` 接口实现
2. 确认响应包含 `publicKey` 字段
3. 联系后端开发人员修复

#### 问题 5: CORS 跨域错误
**症状：**
```
Access to fetch at 'http://localhost:8835/...' from origin 'http://localhost:5173' has been blocked by CORS policy
```

**原因：**
- 后端未配置 CORS
- credentials 配置不正确

**解决方案：**
1. 后端需要设置 `Access-Control-Allow-Credentials: true`
2. 后端需要明确指定允许的源，不能使用 `*`
3. 前端请求必须包含 `credentials: 'include'`

### 3. 手动检查 Cookie

在浏览器控制台执行以下命令：

```javascript
// 查看所有 Cookie
console.log(document.cookie)

// 查看特定 Cookie
import { getCookie } from '@/utils/cookie'
console.log('sessionId:', getCookie('sessionId'))
console.log('JSESSIONID:', getCookie('JSESSIONID'))
```

### 4. 手动清除 Cookie 测试

```javascript
// 清除 sessionId Cookie
import { deleteCookie } from '@/utils/cookie'
deleteCookie('sessionId')
deleteCookie('JSESSIONID')

// 刷新页面重新测试
location.reload()
```

### 5. 检查 Network 请求

1. 打开开发者工具的 Network 标签页
2. 刷新页面
3. 查找以下请求：
   - `rsa-key` - 获取公钥
   - `is_rsa_valid` - 验证密钥

检查每个请求的：
- **Request Headers**: 是否包含 `Cookie: sessionId=xxx`
- **Response Headers**: 是否包含 `Set-Cookie: sessionId=xxx`
- **Response Body**: 返回的数据格式是否正确

## 🛠️ 调试技巧

### 添加断点调试

在 `getValidatedRSAKey` 函数中添加 debugger：

```javascript
export const getValidatedRSAKey = async () => {
  debugger; // 添加这行
  try {
    // ...
  }
}
```

### 临时禁用验证

如果验证一直失败，可以临时修改 `LoginView.vue` 中的 `initRSAKey`：

```javascript
const initRSAKey = async () => {
  try {
    console.log('登录页面：开始初始化RSA密钥...')
    
    // 临时跳过验证，直接获取新密钥
    console.log('登录页面：跳过验证，直接获取RSA密钥')
    const keyData = await fetchRSAKey()
    rsaPublicKey.value = keyData.publicKey
    sessionId.value = keyData.sessionId
    console.log('登录页面：已获取新的RSA密钥')
    
    console.log('登录页面：RSA密钥初始化完成')
    console.log('登录页面：公钥:', rsaPublicKey.value.substring(0, 50) + '...')
    console.log('登录页面：会话ID:', sessionId.value)
  } catch (error) {
    console.error('登录页面：RSA密钥初始化失败:', error)
    alert('系统初始化失败：无法获取RSA密钥')
  }
}
```

## 📞 需要帮助？

如果以上步骤都无法解决问题，请提供以下信息：

1. **完整的控制台日志**（从页面加载到验证失败）
2. **Network 标签页的请求详情**（包括 Request 和 Response）
3. **Application 标签页的 Cookie 信息**
4. **后端服务是否正常运行的确认**
5. **浏览器版本和操作系统信息**

## ✅ 预期行为

正常情况下，应该是这样的流程：

1. **首次访问**：
   - Cookie 中没有 sessionId
   - 调用 `/api/auth/rsa-key` 获取新密钥
   - 自动保存 sessionId 到 Cookie
   - 用户可以正常登录/注册

2. **页面刷新（密钥仍然有效）**：
   - 从 Cookie 读取 sessionId
   - 调用 `/api/auth/is_rsa_valid` 验证
   - 后端返回 `valid: true`
   - 直接使用，无需重新获取
   - 用户体验更流畅

3. **页面刷新（密钥已失效）**：
   - 从 Cookie 读取 sessionId
   - 调用 `/api/auth/is_rsa_valid` 验证
   - 后端返回 `valid: false`，但包含新的密钥对
   - **前端自动使用新密钥对并更新 Cookie**
   - **无需额外请求，用户无感知**
   - 🎯 这是后端的智能刷新机制

4. **异常情况**：
   - 验证接口失败或响应格式错误
   - 自动降级到重新获取密钥
   - 保证系统可用性

## 🔧 代码位置

相关文件：
- `src/utils/cookie.js` - Cookie 管理工具
- `src/utils/rsa.js` - RSA 密钥管理
- `src/views/LoginView.vue` - 登录页面（使用示例）
- `src/views/RegisterView.vue` - 注册页面（使用示例）
