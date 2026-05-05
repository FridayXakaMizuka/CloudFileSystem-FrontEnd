# 头像认证加载问题修复

## 问题描述

**错误信息：**
```
Unsafe attempt to load URL http://localhost:8835/file/download/xxx.jpg 
from frame with URL chrome-error://chromewebdata/. 
Domains, protocols and ports must match.
```

**原因分析：**

1. **图片下载接口需要 JWT Token 认证**
2. **`<img>` 标签无法携带 Authorization 头**
3. 浏览器阻止了未认证的跨域图片请求

---

## 解决方案

使用 **fetch + Blob URL** 的方式加载需要认证的头像图片。

### 工作流程

```
1. 获取头像 URL（相对路径）
   ↓
2. 转换为完整 URL
   http://localhost:8835/file/download/xxx.jpg
   ↓
3. 使用 fetch 携带 JWT Token 请求
   fetch(url, { headers: { 'Authorization': 'Bearer xxx' } })
   ↓
4. 将响应转换为 Blob
   const blob = await response.blob()
   ↓
5. 创建 Blob URL
   const blobUrl = URL.createObjectURL(blob)
   → blob:http://localhost:2310/xxx-xxx-xxx
   ↓
6. <img> 标签使用 Blob URL
   <img src="blob:http://localhost:2310/xxx-xxx-xxx">
   ↓
7. 组件卸载时清理 Blob URL
   URL.revokeObjectURL(blobUrl)
```

---

## 代码实现

### 1. `src/utils/avatar.js` - 新增认证加载函数

```javascript
/**
 * 通过 fetch 加载需要认证的头像图片
 * @param {string} imageUrl - 图片 URL
 * @returns {Promise<string>} Blob URL
 */
export const loadAuthenticatedImage = async (imageUrl) => {
  const token = getToken()
  if (!token) {
    throw new Error('未找到 JWT 令牌')
  }

  logger.debug('加载需要认证的头像:', imageUrl)

  const response = await fetch(imageUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (!response.ok) {
    throw new Error(`加载头像失败: HTTP ${response.status}`)
  }

  // 将响应转换为 Blob
  const blob = await response.blob()
  
  // 创建 Blob URL
  const blobUrl = URL.createObjectURL(blob)
  
  logger.debug('头像加载成功，Blob URL 已创建')
  
  return blobUrl
}
```

### 2. `src/views/DashBoardView.vue` - 使用认证加载

```javascript
import { getUserAvatar, loadAuthenticatedImage } from '@/utils/avatar'

const loadUserAvatar = async () => {
  try {
    const avatarUrl = await getUserAvatar()
    
    if (avatarUrl) {
      // ✅ 使用 fetch 加载需要认证的头像
      const blobUrl = await loadAuthenticatedImage(avatarUrl)
      userAvatar.value = blobUrl
    }
  } catch (error) {
    logger.error('加载头像失败:', error)
    userAvatar.value = ''
  }
}

// 组件卸载时清理
onUnmounted(() => {
  if (userAvatar.value && userAvatar.value.startsWith('blob:')) {
    URL.revokeObjectURL(userAvatar.value)
  }
})
```

### 3. `src/views/ProfileEditView.vue` - 使用认证加载

```javascript
import { getUserAvatar, loadAuthenticatedImage } from '@/utils/avatar'

const loadUserAvatar = async () => {
  try {
    const avatarUrl = await getUserAvatar()
    
    if (avatarUrl) {
      // ✅ 使用 fetch 加载需要认证的头像
      const blobUrl = await loadAuthenticatedImage(avatarUrl)
      previewAvatar.value = blobUrl
    }
  } catch (error) {
    logger.error('加载头像失败:', error)
  }
}

// 组件卸载前清理
onBeforeUnmount(() => {
  if (previewAvatar.value && previewAvatar.value.startsWith('blob:')) {
    URL.revokeObjectURL(previewAvatar.value)
  }
})
```

---

## 技术细节

### Blob URL vs Data URL

| 特性 | Blob URL | Data URL (Base64) |
|------|----------|-------------------|
| 格式 | `blob:http://...` | `data:image/png;base64,...` |
| 大小 | 引用内存，不增加 HTML 大小 | 增大约 33% |
| 性能 | ✅ 快（二进制数据） | ❌ 慢（需要解码） |
| 内存 | 需要手动释放 | 自动管理 |
| 缓存 | 浏览器不缓存 | 嵌入 HTML |
| 适用场景 | 大文件、需要认证 | 小图标、无需认证 |

### 内存管理

**重要：** 必须在使用完后调用 `URL.revokeObjectURL()` 释放内存。

```javascript
// ✅ 正确做法
onUnmounted(() => {
  if (avatarUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(avatarUrl.value)
  }
})

// ❌ 错误做法 - 会导致内存泄漏
// 不调用 revokeObjectURL
```

---

## 优势对比

### 方案一：后端公开访问（不推荐）

```java
// 后端配置：头像文件无需认证
@Configuration
public class SecurityConfig {
    @Override
    public void configure(WebSecurity web) {
        web.ignoring().antMatchers("/api/file/download/**");
    }
}
```

**优点：**
- 前端实现简单
- 可以直接使用 `<img src="url">`

**缺点：**
- ❌ 安全性差（任何人都可以访问）
- ❌ 无法控制访问权限
- ❌ 可能被恶意爬取

### 方案二：Fetch + Blob URL（✅ 推荐）

**优点：**
- ✅ 安全性高（需要 JWT Token）
- ✅ 可以控制访问权限
- ✅ 支持细粒度的授权
- ✅ 性能好（二进制传输）

**缺点：**
- 前端实现稍复杂
- 需要手动管理内存

---

## 日志输出

### 成功加载

```
[INFO] [DashboardView] 开始加载用户头像...
[DEBUG] [Avatar] 加载需要认证的头像: http://localhost:8835/file/download/xxx.jpg
[DEBUG] [Avatar] 头像加载成功，Blob URL 已创建
[INFO] [DashboardView] 头像加载成功 blob:http://localhost:2310/xxx-xxx-xxx
```

### 加载失败

```
[INFO] [DashboardView] 开始加载用户头像...
[DEBUG] [Avatar] 加载需要认证的头像: http://localhost:8835/file/download/xxx.jpg
[ERROR] [Avatar] 加载头像失败: Error: 加载头像失败: HTTP 401
[ERROR] [DashboardView] 加载头像失败: Error: 加载头像失败: HTTP 401
```

### 清理 Blob URL

```
[DEBUG] [DashboardView] 已清理头像 Blob URL
```

---

## 注意事项

### 1. 内存泄漏预防

每次创建 Blob URL 后，必须在组件卸载时清理：

```javascript
// DashBoardView.vue
onUnmounted(() => {
  if (userAvatar.value?.startsWith('blob:')) {
    URL.revokeObjectURL(userAvatar.value)
  }
})

// ProfileEditView.vue
onBeforeUnmount(() => {
  if (previewAvatar.value?.startsWith('blob:')) {
    URL.revokeObjectURL(previewAvatar.value)
  }
})
```

### 2. 重复加载处理

如果头像 URL 变化，需要先清理旧的 Blob URL：

```javascript
const updateAvatar = async (newUrl) => {
  // 清理旧的 Blob URL
  if (userAvatar.value?.startsWith('blob:')) {
    URL.revokeObjectURL(userAvatar.value)
  }
  
  // 加载新的头像
  userAvatar.value = await loadAuthenticatedImage(newUrl)
}
```

### 3. 错误处理

```javascript
try {
  const blobUrl = await loadAuthenticatedImage(avatarUrl)
  userAvatar.value = blobUrl
} catch (error) {
  if (error.message.includes('401')) {
    // Token 过期，跳转登录
    router.push('/login')
  } else if (error.message.includes('404')) {
    // 头像不存在，使用默认头像
    userAvatar.value = ''
  } else {
    // 其他错误
    console.error('加载头像失败:', error)
  }
}
```

### 4. 浏览器兼容性

`URL.createObjectURL()` 和 `URL.revokeObjectURL()` 在所有现代浏览器中都支持：
- ✅ Chrome 23+
- ✅ Firefox 19+
- ✅ Safari 6+
- ✅ Edge 12+

---

## 测试建议

### 1. 功能测试

- [ ] Dashboard 页面头像正常显示
- [ ] Profile 页面头像正常显示
- [ ] 上传新头像后立即显示
- [ ] 刷新页面后头像仍然显示
- [ ] 退出登录后清除头像

### 2. 内存测试

1. 打开开发者工具 → Memory 标签
2. 多次切换页面（Dashboard ↔ Profile）
3. 检查是否有内存泄漏
4. 确认 Blob URL 被正确清理

### 3. 网络测试

1. 打开开发者工具 → Network 标签
2. 查找头像请求
3. 确认请求携带了 Authorization 头
4. 确认响应状态为 200

### 4. 安全测试

1. 移除 JWT Token
2. 尝试加载头像
3. 应该返回 401 错误
4. 不应该显示头像

---

## 相关文件

- ✅ `src/utils/avatar.js` - 添加 `loadAuthenticatedImage()` 函数
- ✅ `src/views/DashBoardView.vue` - 使用认证加载 + 清理逻辑
- ✅ `src/views/ProfileEditView.vue` - 使用认证加载 + 清理逻辑

---

## 扩展功能

### 1. 图片缓存优化

可以使用 IndexedDB 缓存 Blob 数据，避免重复请求：

```javascript
// 伪代码
const getCachedAvatar = async (url) => {
  // 1. 检查 IndexedDB 缓存
  const cached = await db.get('avatars', url)
  if (cached) {
    return URL.createObjectURL(cached.blob)
  }
  
  // 2. 从服务器获取
  const blob = await fetchWithAuth(url)
  
  // 3. 存入缓存
  await db.put('avatars', { url, blob, timestamp: Date.now() })
  
  return URL.createObjectURL(blob)
}
```

### 2. 图片预加载

在用户登录时预加载头像：

```javascript
onMounted(async () => {
  // 预加载头像
  const avatarUrl = await getUserAvatar()
  if (avatarUrl) {
    preloadImage(avatarUrl)
  }
})

const preloadImage = async (url) => {
  try {
    const blobUrl = await loadAuthenticatedImage(url)
    // 存储在 Vuex/Pinia 中
    store.commit('SET_AVATAR', blobUrl)
  } catch (error) {
    console.error('预加载头像失败:', error)
  }
}
```

### 3. 图片压缩

对于大头像，可以在前端压缩后再显示：

```javascript
const compressImage = async (blob, maxWidth = 200) => {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const scale = Math.min(maxWidth / img.width, 1)
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      
      canvas.toBlob(resolve, 'image/jpeg', 0.8)
    }
    img.src = URL.createObjectURL(blob)
  })
}
```

---

**修复日期**: 2026-04-29  
**问题类型**: 认证与安全  
**影响范围**: 所有需要认证的头像加载
