# 头像加载问题调试指南

## 当前状态

- ✅ 后端接口可以直接访问并显示图片
- ❌ 前端无法显示头像

## 调试步骤

### 1. 打开浏览器控制台

按 `F12` 打开开发者工具，切换到 **Console** 标签。

### 2. 刷新页面

刷新 Dashboard 或 Profile 页面，观察控制台输出。

### 3. 查看日志输出

应该看到类似以下的日志：

```
[INFO] [DashboardView] 开始加载用户头像...
[DEBUG] [Avatar] 原始头像 URL: /api/file/download/xxx.jpg
[DEBUG] [Avatar] 转换后的完整 URL: http://localhost:8835/file/download/xxx.jpg
[INFO] [DashboardView] 获取到的头像 URL: http://localhost:8835/file/download/xxx.jpg
[INFO] [DashboardView] 开始通过 fetch 加载图片...
[INFO] [Avatar] 开始加载认证头像... http://localhost:8835/file/download/xxx.jpg
[DEBUG] [Avatar] 头像请求响应状态: 200
[DEBUG] [Avatar] 响应 Content-Type: image/jpeg
[DEBUG] [Avatar] Blob 大小: 12345 bytes
[INFO] [Avatar] 头像加载成功，Blob URL: blob:http://localhost:2310/xxx-xxx-xxx
[INFO] [DashboardView] 头像加载成功 blob:http://localhost:2310/xxx-xxx-xxx
=== 头像调试信息 ===
原始 URL: http://localhost:8835/file/download/xxx.jpg
Blob URL: blob:http://localhost:2310/xxx-xxx-xxx
Token: 存在
```

### 4. 检查 Network 标签

切换到 **Network** 标签，查找：

1. **`/api/profile/avatar/get`** - 获取头像信息的请求
   - 状态码应该是 `200`
   - 响应应该包含 `avatarUrl`

2. **`/file/download/xxx.jpg`** - 下载头像图片的请求
   - 状态码应该是 `200`
   - Response Headers 应该包含 `Content-Type: image/jpeg` 或 `image/png`

### 5. 常见错误及解决方案

#### 错误 1：401 Unauthorized

**症状：**
```
[ERROR] [Avatar] 头像请求失败: 401
```

**原因：** JWT Token 无效或过期

**解决：**
1. 检查 localStorage 中的 token
2. 重新登录获取新 token

```javascript
// 在控制台执行
localStorage.getItem('jwt_token')
```

---

#### 错误 2：404 Not Found

**症状：**
```
[ERROR] [Avatar] 头像请求失败: 404
```

**原因：** 头像文件不存在或 URL 路径错误

**解决：**
1. 检查后端返回的 `avatarUrl` 是否正确
2. 确认文件确实存在于服务器

```javascript
// 在控制台测试 URL
fetch('http://localhost:8835/file/download/xxx.jpg', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
}).then(r => console.log('Status:', r.status))
```

---

#### 错误 3：CORS 错误

**症状：**
```
Access to fetch at 'http://localhost:8835/...' from origin 'http://localhost:2310' 
has been blocked by CORS policy
```

**原因：** 后端未配置 CORS

**解决：** 在后端添加 CORS 配置

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("http://localhost:2310")
                .allowedMethods("GET", "POST", "PUT", "DELETE")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
```

---

#### 错误 4：Blob 创建失败

**症状：**
```
[ERROR] [Avatar] 加载头像时发生错误: TypeError: Failed to execute 'createObjectURL' on 'URL'
```

**原因：** 响应不是有效的二进制数据

**解决：**
1. 检查后端是否正确返回图片数据
2. 确认 Content-Type 是图片类型

---

#### 错误 5：URL 转换错误

**症状：**
```
[DEBUG] [Avatar] 原始头像 URL: /api/file/download/xxx.jpg
[DEBUG] [Avatar] 转换后的完整 URL: http://localhost:8835/api/file/download/xxx.jpg
```

注意：这里多了一个 `/api`，导致 URL 变成：
```
http://localhost:8835/api/file/download/xxx.jpg  ❌ 错误
```

应该是：
```
http://localhost:8835/file/download/xxx.jpg  ✅ 正确
```

**解决：** 已修复 `getFullAvatarUrl()` 函数，使用 `replace` 方法替换 `/api` 部分。

---

## 手动测试

### 测试 1：检查 Token

在控制台执行：

```javascript
import { getToken } from '@/utils/auth'
console.log('Token:', getToken())
```

或者直接查看 localStorage：

```javascript
localStorage.getItem('jwt_token')
```

---

### 测试 2：手动获取头像 URL

```javascript
fetch('http://localhost:8835/api/profile/avatar/get', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('jwt_token')
  }
})
.then(r => r.json())
.then(data => console.log('头像信息:', data))
```

预期输出：
```json
{
  "code": 200,
  "success": true,
  "avatarUrl": "/api/file/download/xxx.jpg"
}
```

---

### 测试 3：手动下载图片

```javascript
const avatarUrl = '/api/file/download/xxx.jpg'
const fullUrl = avatarUrl.replace('/api', 'http://localhost:8835')

fetch(fullUrl, {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('jwt_token')
  }
})
.then(r => {
  console.log('Status:', r.status)
  console.log('Content-Type:', r.headers.get('content-type'))
  return r.blob()
})
.then(blob => {
  console.log('Blob size:', blob.size)
  const url = URL.createObjectURL(blob)
  console.log('Blob URL:', url)
  
  // 在新窗口打开
  window.open(url)
})
```

---

### 测试 4：清除缓存后重试

```javascript
// 清除头像缓存
localStorage.removeItem('user_avatar_cache')
localStorage.removeItem('user_avatar_timestamp')

// 刷新页面
location.reload()
```

---

## 关键代码位置

### 1. URL 转换逻辑

**文件：** `src/utils/avatar.js`

```javascript
export const getFullAvatarUrl = (url) => {
  if (url.startsWith('/api')) {
    // 将 /api 替换为后端地址（不含 /api）
    const fullPath = url.replace('/api', BASE_API_URL.replace('/api', ''))
    return fullPath
  }
  // ...
}
```

**示例：**
- 输入：`/api/file/download/xxx.jpg`
- 输出：`http://localhost:8835/file/download/xxx.jpg`

---

### 2. 图片加载逻辑

**文件：** `src/utils/avatar.js`

```javascript
export const loadAuthenticatedImage = async (imageUrl) => {
  const response = await fetch(imageUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  
  const blob = await response.blob()
  return URL.createObjectURL(blob)
}
```

---

### 3. 组件调用

**文件：** `src/views/DashBoardView.vue`

```javascript
const loadUserAvatar = async () => {
  const avatarUrl = await getUserAvatar()
  const blobUrl = await loadAuthenticatedImage(avatarUrl)
  userAvatar.value = blobUrl
}
```

---

## 快速诊断脚本

在浏览器控制台执行以下脚本，自动诊断问题：

```javascript
(async function diagnoseAvatar() {
  console.log('=== 头像诊断开始 ===\n')
  
  // 1. 检查 Token
  const token = localStorage.getItem('jwt_token')
  console.log('1. Token 检查:')
  console.log('   存在:', !!token)
  if (!token) {
    console.error('   ❌ 错误：未找到 Token，请先登录')
    return
  }
  console.log('   ✅ Token 存在\n')
  
  // 2. 获取头像信息
  console.log('2. 获取头像信息...')
  try {
    const resp1 = await fetch('http://localhost:8835/api/profile/avatar/get', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    console.log('   状态码:', resp1.status)
    
    if (!resp1.ok) {
      console.error('   ❌ 错误：获取头像信息失败')
      return
    }
    
    const data = await resp1.json()
    console.log('   响应数据:', data)
    
    if (!data.avatarUrl) {
      console.warn('   ⚠️ 警告：没有头像 URL')
      return
    }
    
    console.log('   ✅ 获取到头像 URL:', data.avatarUrl, '\n')
    
    // 3. 转换 URL
    const fullUrl = data.avatarUrl.replace('/api', 'http://localhost:8835')
    console.log('3. 转换后的 URL:', fullUrl, '\n')
    
    // 4. 下载图片
    console.log('4. 下载图片...')
    const resp2 = await fetch(fullUrl, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    console.log('   状态码:', resp2.status)
    console.log('   Content-Type:', resp2.headers.get('content-type'))
    
    if (!resp2.ok) {
      console.error('   ❌ 错误：下载图片失败')
      return
    }
    
    const blob = await resp2.blob()
    console.log('   Blob 大小:', blob.size, 'bytes')
    
    const blobUrl = URL.createObjectURL(blob)
    console.log('   Blob URL:', blobUrl)
    console.log('   ✅ 图片下载成功\n')
    
    // 5. 测试结果
    console.log('5. 测试结果:')
    console.log('   在新窗口中打开图片:', blobUrl)
    window.open(blobUrl)
    
    console.log('\n=== 诊断完成 ===')
    console.log('如果图片能正常显示，说明前端代码有问题')
    console.log('如果图片不能显示，说明后端返回的数据有问题')
    
  } catch (error) {
    console.error('诊断过程中出错:', error)
  }
})()
```

---

## 可能的根本原因

根据您描述的"直接在浏览器输入后端的接口可以显示头像"，但前端无法显示，最可能的原因是：

### 1. URL 转换错误（最可能）

**问题：** URL 转换后多了或少了 `/api` 前缀

**检查：** 查看控制台日志中的"转换后的完整 URL"

**修复：** 已更新 `getFullAvatarUrl()` 函数

---

### 2. CORS 配置问题

**问题：** 后端没有允许前端域名的跨域请求

**检查：** Network 标签中是否有 CORS 错误

**修复：** 后端添加 CORS 配置

---

### 3. Cookie/Session 问题

**问题：** 后端依赖 Cookie 认证，但 fetch 默认不发送 Cookie

**检查：** 后端是否使用 Session 而不是 JWT

**修复：** 如果需要 Cookie，添加 `credentials: 'include'`

```javascript
fetch(url, {
  credentials: 'include',  // 发送 Cookie
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

---

### 4. 响应格式问题

**问题：** 后端返回的不是图片数据，而是 JSON 或其他格式

**检查：** Content-Type 是否为 `image/jpeg` 或 `image/png`

**修复：** 确保后端直接返回图片二进制数据

---

## 下一步操作

1. **刷新页面**，查看控制台输出的调试信息
2. **复制完整的日志**，特别是：
   - 原始头像 URL
   - 转换后的完整 URL
   - HTTP 状态码
   - 任何错误信息
3. **告诉我具体的错误信息**，我会帮您进一步排查

---

**更新日期**: 2026-04-29  
**调试重点**: URL 转换、CORS、认证、响应格式
