# 头像 URL 路径问题修复

## 问题描述

**错误现象：**
```
[INFO] [DashboardView] 头像加载成功 /api/file/download/82685bad-b483-4ba3-9539-29b8e45b143c_xxx.jpg
```

头像 URL 可以正确解析，但图片无法显示。

**原因分析：**

后端返回的头像 URL 是相对路径：`/api/file/download/xxx.jpg`

浏览器会尝试从当前前端域名加载：
```
http://localhost:2310/api/file/download/xxx.jpg  ❌ 错误（前端地址）
```

但实际的后端服务在：
```
http://localhost:8835/api/file/download/xxx.jpg  ✅ 正确（后端地址）
```

---

## 解决方案

### 添加 URL 转换工具函数

在 `src/utils/avatar.js` 中添加了 `getFullAvatarUrl()` 函数，自动将相对路径转换为完整的后端 URL。

```javascript
/**
 * 将相对路径转换为完整的 URL
 * @param {string} url - 可能是相对路径或完整 URL
 * @returns {string} 完整的 URL
 */
export const getFullAvatarUrl = (url) => {
  if (!url) return ''
  
  // 如果已经是完整 URL（以 http 开头），直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  
  // 如果是相对路径（以 /api 开头），添加后端基础地址
  if (url.startsWith('/api')) {
    // 移除 /api 前缀，因为 BASE_API_URL 已经包含了 /api
    const path = url.substring(4) // 移除 '/api'
    return `${BASE_API_URL}${path}`
  }
  
  // 其他情况，直接返回
  return url
}
```

**转换逻辑：**

| 输入 | 输出 | 说明 |
|------|------|------|
| `/api/file/download/xxx.jpg` | `http://localhost:8835/file/download/xxx.jpg` | 相对路径 → 完整 URL |
| `http://example.com/xxx.jpg` | `http://example.com/xxx.jpg` | 已是完整 URL，不变 |
| `https://cdn.example.com/xxx.jpg` | `https://cdn.example.com/xxx.jpg` | 已是完整 URL，不变 |

---

## 代码变更

### 1. `src/utils/avatar.js`

#### 新增 `getFullAvatarUrl` 函数

```javascript
import { PROFILE_API, BASE_API_URL } from '@/config/api'

export const getFullAvatarUrl = (url) => {
  if (!url) return ''
  
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  
  if (url.startsWith('/api')) {
    const path = url.substring(4)
    return `${BASE_API_URL}${path}`
  }
  
  return url
}
```

#### 更新 `getUserAvatar` 函数

```javascript
export const getUserAvatar = async () => {
  // 1. 尝试从缓存获取
  const cachedAvatar = getAvatarFromCache()
  if (cachedAvatar) {
    // ✅ 转换为完整 URL
    return getFullAvatarUrl(cachedAvatar)
  }
  
  // 2. 缓存不存在，从服务器获取
  const avatar = await fetchAvatarFromServer()
  if (avatar) {
    // ✅ 转换为完整 URL
    return getFullAvatarUrl(avatar)
  }
  return null
}
```

### 2. `src/views/ProfileEditView.vue`

#### 导入新函数

```javascript
import { getUserAvatar, uploadAndSetAvatar, getFullAvatarUrl } from '@/utils/avatar'
```

#### 上传后使用完整 URL

```javascript
const handleAvatarChange = async (event) => {
  const result = await uploadAndSetAvatar(file)
  
  // ✅ 转换为完整 URL
  previewAvatar.value = getFullAvatarUrl(result.filePath)
}
```

### 3. `src/views/DashBoardView.vue`

#### 导入新函数

```javascript
import { getUserAvatar, getFullAvatarUrl, clearAvatarCache } from '@/utils/avatar'
```

**注意：** DashBoardView 中的 `loadUserAvatar()` 不需要修改，因为 `getUserAvatar()` 已经自动返回完整 URL。

---

## 工作流程

### 修改前

```
后端返回: /api/file/download/xxx.jpg
    ↓
前端缓存: /api/file/download/xxx.jpg
    ↓
<img src="/api/file/download/xxx.jpg">
    ↓
浏览器请求: http://localhost:2310/api/file/download/xxx.jpg  ❌
    ↓
404 Not Found（前端服务器没有这个文件）
```

### 修改后

```
后端返回: /api/file/download/xxx.jpg
    ↓
getFullAvatarUrl() 转换
    ↓
前端缓存: http://localhost:8835/file/download/xxx.jpg
    ↓
<img src="http://localhost:8835/file/download/xxx.jpg">
    ↓
浏览器请求: http://localhost:8835/file/download/xxx.jpg  ✅
    ↓
200 OK（后端服务器返回图片）
```

---

## 测试建议

### 1. 清除旧缓存

打开浏览器控制台（F12），执行：
```javascript
localStorage.removeItem('user_avatar_cache')
localStorage.removeItem('user_avatar_timestamp')
location.reload()
```

### 2. 检查网络请求

1. 打开开发者工具（F12）
2. 切换到 "Network" 标签
3. 刷新页面
4. 查找头像图片请求
5. 确认请求地址是：`http://localhost:8835/file/download/xxx.jpg`

### 3. 验证头像显示

- ✅ Dashboard 页面头像正常显示
- ✅ Profile 页面头像正常显示
- ✅ 上传新头像后立即显示
- ✅ 刷新页面后头像仍然显示

---

## 日志输出

### 成功加载

```
[INFO] [DashboardView] 开始加载用户头像...
[DEBUG] [Avatar] 使用缓存的头像 URL: /api/file/download/xxx.jpg
[INFO] [DashboardView] 头像加载成功 http://localhost:8835/file/download/xxx.jpg
```

### 首次加载（无缓存）

```
[INFO] [DashboardView] 开始加载用户头像...
[INFO] [Avatar] 正在从服务器获取头像...
[INFO] [Avatar] 头像获取成功
[DEBUG] [Avatar] 头像响应数据: { avatarUrl: "/api/file/download/xxx.jpg" }
[INFO] [DashboardView] 头像加载成功 http://localhost:8835/file/download/xxx.jpg
```

---

## 注意事项

### 1. BASE_API_URL 配置

确保 `src/config/api.js` 中的 `BASE_API_URL` 配置正确：

```javascript
export const BASE_API_URL = 'http://localhost:8835/api'
```

### 2. 生产环境配置

在生产环境中，可能需要根据环境变量动态配置：

```javascript
export const BASE_API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8835/api'
```

### 3. CORS 配置

确保后端允许跨域访问图片资源：

```java
@Configuration
public class CorsConfig {
    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();
        config.addAllowedOrigin("http://localhost:2310");
        config.addAllowedMethod("GET");
        config.addAllowedHeader("*");
        // ...
    }
}
```

### 4. 图片访问权限

如果头像需要认证才能访问，需要在文件下载接口中验证 JWT Token。

或者将头像文件设置为公开访问（推荐）。

---

## 相关文件

- ✅ `src/utils/avatar.js` - 添加了 `getFullAvatarUrl()` 函数
- ✅ `src/views/DashBoardView.vue` - 导入并使用新函数
- ✅ `src/views/ProfileEditView.vue` - 导入并使用新函数
- ✅ `src/config/api.js` - 提供 `BASE_API_URL` 常量

---

## 扩展功能

### 支持 CDN

如果未来使用 CDN，只需修改 `getFullAvatarUrl()` 函数：

```javascript
export const getFullAvatarUrl = (url) => {
  if (!url) return ''
  
  // CDN 域名
  const CDN_URL = 'https://cdn.example.com'
  
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  
  if (url.startsWith('/api/file/download')) {
    // 将后端路径转换为 CDN 路径
    const fileId = url.split('/').pop()
    return `${CDN_URL}/avatars/${fileId}`
  }
  
  return url
}
```

### 支持图片缩放

可以添加查询参数来控制图片大小：

```javascript
export const getAvatarUrlWithSize = (url, size = 200) => {
  const fullUrl = getFullAvatarUrl(url)
  if (!fullUrl) return ''
  
  // 添加尺寸参数
  const separator = fullUrl.includes('?') ? '&' : '?'
  return `${fullUrl}${separator}size=${size}`
}

// 使用
const smallAvatar = getAvatarUrlWithSize(avatarUrl, 100)  // 100x100
const largeAvatar = getAvatarUrlWithSize(avatarUrl, 400)  // 400x400
```

---

**修复日期**: 2026-04-29  
**问题类型**: 路径配置  
**影响范围**: 所有头像显示功能
