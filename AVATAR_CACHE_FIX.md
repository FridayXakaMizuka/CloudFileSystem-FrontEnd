# 头像缓存格式迁移问题修复

## 问题描述

错误信息：
```
GET data:image/png;base64,/api/file/download/82685bad-b483-4ba3-9539-29b8e45b143c_xxx.jpg net::ERR_INVALID_URL
```

**原因分析：**

在将头像接口从 Base64 改为 URL 后，localStorage 中可能还缓存着旧格式的头像数据。当代码尝试使用这些旧数据时，会出现以下情况：

1. **旧缓存是 Base64 格式**：`iVBORw0KGgoAAAANSUhEUgAA...`
2. **新代码期望 URL 格式**：`/api/file/download/xxx.jpg`
3. **混合导致错误**：如果某个地方仍然调用了 `base64ToDataUrl()`，会将 URL 拼接成 `data:image/png;base64,/api/file/download/...`，这是无效的 URL

---

## 解决方案

### 1. 自动检测并清除旧缓存

在 `getAvatarFromCache()` 函数中添加了格式检测：

```javascript
export const getAvatarFromCache = () => {
  const cachedAvatar = localStorage.getItem(AVATAR_CACHE_KEY)
  const timestamp = localStorage.getItem(AVATAR_TIMESTAMP_KEY)
  
  if (!cachedAvatar || !timestamp) {
    return null
  }
  
  // 检查缓存是否过期
  const now = Date.now()
  const cacheTime = parseInt(timestamp, 10)
  
  if (now - cacheTime > AVATAR_CACHE_EXPIRY) {
    logger.info('头像缓存已过期')
    clearAvatarCache()
    return null
  }
  
  // ✅ 新增：检查是否是旧的 Base64 格式缓存
  if (cachedAvatar.startsWith('data:image') || cachedAvatar.length > 1000) {
    logger.warn('检测到旧的 Base64 格式缓存，已清除')
    clearAvatarCache()
    return null
  }
  
  logger.debug('使用缓存的头像 URL:', cachedAvatar)
  return cachedAvatar
}
```

**检测逻辑：**
- 如果缓存以 `data:image` 开头 → 是 Base64 格式，清除
- 如果缓存长度 > 1000 字符 → 很可能是 Base64（URL 通常较短），清除
- 否则认为是有效的 URL 格式，正常使用

---

## 用户需要做什么？

### 方案一：自动清除（推荐）

刷新页面后，系统会自动检测到旧缓存并清除，然后重新从服务器获取新的 URL 格式头像。

**用户体验：**
1. 第一次刷新：检测到旧缓存，清除，重新加载
2. 后续访问：使用新的 URL 缓存，正常显示

### 方案二：手动清除（可选）

如果希望立即生效，可以手动清除浏览器缓存：

#### 方法 1：清除 localStorage
打开浏览器控制台（F12），执行：
```javascript
localStorage.removeItem('user_avatar_cache')
localStorage.removeItem('user_avatar_timestamp')
location.reload()
```

#### 方法 2：清除所有站点数据
1. 打开浏览器开发者工具（F12）
2. 切换到 "Application" 标签
3. 左侧选择 "Local Storage"
4. 找到 `http://localhost:2310`
5. 删除 `user_avatar_cache` 和 `user_avatar_timestamp`
6. 刷新页面

#### 方法 3：退出登录再登录
退出登录时会调用 `clearAvatarCache()`，自动清除头像缓存。

---

## 技术细节

### 缓存格式对比

#### 旧格式（Base64）
```javascript
// localStorage 中的值
"user_avatar_cache": "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAA..."
// 长度：几千到几万字符
// 使用时：<img src="data:image/png;base64,iVBORw0K...">
```

#### 新格式（URL）
```javascript
// localStorage 中的值
"user_avatar_cache": "/api/file/download/82685bad-b483-4ba3-9539-29b8e45b143c_xxx.jpg"
// 长度：几十到几百字符
// 使用时：<img src="/api/file/download/82685bad-b483-4ba3-9539-29b8e45b143c_xxx.jpg">
```

### 检测条件说明

```javascript
// 条件 1：以 data:image 开头
if (cachedAvatar.startsWith('data:image')) {
  // 明确是 Data URL 格式，肯定是旧缓存
  clearAvatarCache()
}

// 条件 2：长度超过 1000 字符
if (cachedAvatar.length > 1000) {
  // Base64 编码的图片通常很长
  // URL 路径通常很短（< 200 字符）
  // 所以超过 1000 字符很可能是 Base64
  clearAvatarCache()
}
```

---

## 预防措施

### 1. 版本标识（未来改进）

可以在缓存中添加版本标识：

```javascript
const CACHE_VERSION = 'v2'  // v1=Base64, v2=URL

// 保存时
localStorage.setItem('avatar_cache_version', CACHE_VERSION)
localStorage.setItem(AVATAR_CACHE_KEY, avatarUrl)

// 读取时
const version = localStorage.getItem('avatar_cache_version')
if (version !== CACHE_VERSION) {
  // 版本不匹配，清除旧缓存
  clearAvatarCache()
  localStorage.removeItem('avatar_cache_version')
}
```

### 2. 类型检查

```javascript
// 判断是 URL 还是 Base64
const isUrl = (str) => {
  return str.startsWith('/') || str.startsWith('http')
}

const isBase64 = (str) => {
  return str.startsWith('data:image') || /^[A-Za-z0-9+/=]+$/.test(str)
}
```

---

## 相关文件

- ✅ `src/utils/avatar.js` - 添加了缓存格式检测
- ✅ `src/views/DashBoardView.vue` - 使用 URL 格式
- ✅ `src/views/ProfileEditView.vue` - 使用 URL 格式

---

## 测试建议

### 测试场景 1：旧缓存存在
1. 模拟 localStorage 中有 Base64 缓存
2. 刷新页面
3. 预期：自动清除旧缓存，重新从服务器获取 URL

### 测试场景 2：新缓存存在
1. localStorage 中有 URL 缓存
2. 刷新页面
3. 预期：直接使用缓存的 URL，正常显示

### 测试场景 3：无缓存
1. 清除所有缓存
2. 刷新页面
3. 预期：从服务器获取 URL 并缓存

### 测试场景 4：上传新头像
1. 上传新头像
2. 预期：缓存新的 URL，立即显示

---

## 日志输出

### 检测到旧缓存
```
[WARN] [Avatar] 检测到旧的 Base64 格式缓存，已清除
[INFO] [Avatar] 正在从服务器获取头像...
[INFO] [Avatar] 头像获取成功
[DEBUG] [Avatar] 使用缓存的头像 URL: /api/file/download/xxx.jpg
```

### 正常使用新缓存
```
[DEBUG] [Avatar] 使用缓存的头像 URL: /api/file/download/xxx.jpg
```

---

**修复日期**: 2026-04-27  
**问题类型**: 缓存格式迁移  
**影响范围**: 所有已登录用户的首次访问
