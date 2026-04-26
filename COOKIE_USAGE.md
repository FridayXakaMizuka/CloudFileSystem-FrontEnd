# Cookie 管理使用指南

## 📋 功能概述

本项目已实现完整的Cookie管理功能，支持：
- ✅ 自动保存sessionId到Cookie
- ✅ 页面刷新时自动读取Cookie
- ✅ Cookie验证和密钥复用
- ✅ 7天有效期（可配置）

## 📁 文件结构

Cookie相关功能已提取到独立模块：

```
src/utils/
├── cookie.js      # Cookie管理工具（设置、读取、删除）
└── rsa.js         # RSA加密相关（导入cookie.js中的函数）
```

## 🎯 工作原理

### 1. 获取RSA密钥并保存到Cookie

当调用 `fetchRSAKey()` 时：
```javascript
import { fetchRSAKey } from '@/utils/rsa'

const keyData = await fetchRSAKey()
// 自动将 sessionId 保存到 Cookie（有效期7天）
console.log(keyData.publicKey)  // RSA公钥
console.log(keyData.sessionId)  // 会话ID
```

### 2. 页面刷新时自动读取Cookie

在组件的 `onMounted` 中调用 `initRSAKey()`：
```javascript
import { onMounted, ref } from 'vue'
import { getValidatedRSAKey, fetchRSAKey } from '@/utils/rsa'

const rsaPublicKey = ref('')
const sessionId = ref('')

onMounted(() => {
  initRSAKey()
})

const initRSAKey = async () => {
  try {
    // 1. 尝试从Cookie读取并验证
    const validatedKey = await getValidatedRSAKey()
    
    if (validatedKey) {
      // ✅ 验证成功，直接使用Cookie中的密钥（无需重新请求）
      rsaPublicKey.value = validatedKey.publicKey
      sessionId.value = validatedKey.sessionId
      console.log('使用Cookie中验证通过的RSA密钥')
    } else {
      // ⚠️ 验证失败，重新获取密钥并保存到Cookie
      const keyData = await fetchRSAKey()
      rsaPublicKey.value = keyData.publicKey
      sessionId.value = keyData.sessionId
      console.log('已获取新的RSA密钥并保存到Cookie')
    }
  } catch (error) {
    console.error('RSA密钥初始化失败:', error)
  }
}
```

### 3. 手动操作Cookie

```javascript
import { setCookie, getCookie, deleteCookie } from '@/utils/cookie'

// 设置Cookie（默认7天有效期）
setCookie('myKey', 'myValue')

// 设置Cookie（自定义30天有效期）
setCookie('myKey', 'myValue', 30)

// 读取Cookie
const value = getCookie('myKey')

// 删除Cookie
deleteCookie('myKey')

// 获取sessionId
const sessionId = getSessionIdFromCookie()
```

## 🔄 完整流程示例

```
用户首次访问登录页面
    ↓
onMounted 触发
    ↓
initRSAKey() 调用
    ↓
getValidatedRSAKey() 检查Cookie
    ↓
Cookie中没有sessionId
    ↓
fetchRSAKey() 请求后端获取新密钥
    ↓
后端返回 publicKey 和 sessionId
    ↓
✅ 自动保存到 Cookie（7天有效期）
    ↓
用户可以正常使用

---

用户刷新页面
    ↓
onMounted 再次触发
    ↓
initRSAKey() 调用
    ↓
getValidatedRSAKey() 检查Cookie
    ↓
✅ 找到有效的 sessionId
    ↓
向后端验证密钥有效性
    ↓
验证成功，直接返回密钥
    ↓
✅ 无需重新请求，直接使用Cookie中的密钥
```

## 📝 已集成的页面

以下页面已经实现了Cookie自动读取功能：

1. **LoginView.vue** - 登录页面
   - 位置：`src/views/LoginView.vue`
   - 第175行：`initRSAKey()`

2. **RegisterView.vue** - 注册页面
   - 位置：`src/views/RegisterView.vue`
   - 第480行：`initRSAKey()`

## 🔧 Cookie配置说明

### 默认配置
- **有效期**: 7天
- **路径**: `/`（全站可访问）
- **SameSite**: `Lax`（防止CSRF攻击）
- **HttpOnly**: ❌ 未设置（前端需要读取）

### 修改有效期
在 `fetchRSAKey()` 函数中修改：
```javascript
// 改为30天有效期
setCookie('sessionId', sessionId, 30)
```

## ⚠️ 安全注意事项

1. **XSS防护**: 由于Cookie不是HttpOnly，建议：
   - 实施内容安全策略（CSP）
   - 对用户输入进行严格过滤
   - 避免在Cookie中存储敏感信息

2. **生产环境**: 建议使用HTTPS并添加Secure标志：
   ```javascript
   document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax;Secure`
   ```

3. **敏感数据**: 只存储sessionId，不要存储密码等敏感信息

## 🐛 调试技巧

### 查看Cookie
在浏览器控制台执行：
```javascript
// 查看所有Cookie
console.log(document.cookie)

// 查看特定Cookie
import { getCookie } from '@/utils/cookie'
console.log(getCookie('sessionId'))
```

### 清除Cookie
```javascript
import { deleteCookie } from '@/utils/cookie'
deleteCookie('sessionId')
```

### 查看日志
打开浏览器控制台，可以看到详细的Cookie操作日志：
- `✅ Cookie 已设置: sessionId`
- `✅ sessionId 已保存到 Cookie，页面刷新后可直接读取`
- `开始从 Cookie 读取并验证 RSA 密钥...`
- `✅ RSA 密钥有效，使用 Cookie 中的 sessionId`

## 💡 最佳实践

1. **始终验证Cookie**: 使用前先调用 `getValidatedRSAKey()` 验证
2. **错误处理**: 捕获异常并提供友好的错误提示
3. **降级方案**: Cookie失效时自动重新获取密钥
4. **日志记录**: 保留console.log便于调试

## 📚 API参考

### Cookie 管理工具 (`@/utils/cookie`)

#### setCookie(name, value, days)
设置Cookie
- `name`: Cookie名称
- `value`: Cookie值
- `days`: 过期天数（默认7）

#### getCookie(name)
读取Cookie
- `name`: Cookie名称
- 返回: Cookie值或null

#### deleteCookie(name)
删除Cookie
- `name`: Cookie名称

#### getSessionIdFromCookie()
从Cookie中获取sessionId
- 返回: sessionId或null

### RSA 加密工具 (`@/utils/rsa`)

#### fetchRSAKey()
获取RSA公钥并自动保存到Cookie
- 返回: `{publicKey, sessionId}`

#### getValidatedRSAKey()
从Cookie读取并验证RSA密钥
- 返回: `{publicKey, sessionId}` 或 null

#### validateRsaKey(sessionId, publicKey)
验证RSA密钥对（后端无效时自动返回新密钥）
- 返回: `{sessionId, publicKey}`

#### encryptPassword(password, publicKey)
使用RSA公钥加密密码
- 返回: 加密后的字符串
