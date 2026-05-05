# 头像功能合并到 userInfo.js 指南

## 📋 概述

本次重构将 `avatar.js` 中的头像管理功能合并到 `userInfo.js` 中，并修改头像获取逻辑为**直接从 profile 缓存读取**，不再单独调用 `/profile/avatar/get` 接口。

## 🎯 优化目标

1. **统一用户信息管理** - 所有用户相关信息（包括头像）集中在一个模块
2. **减少网络请求** - 头像从 `/profile/get_all` 返回的缓存中读取，无需额外请求
3. **简化代码结构** - 移除冗余的头像缓存逻辑
4. **提高数据一致性** - 头像与其他用户信息同步更新

## 🔧 主要改动

### 1. userInfo.js 新增功能

**文件**: `src/utils/userInfo.js`

#### 新增导入
```javascript
import { PROFILE_API, BASE_API_URL } from '@/config/api'
import { uploadFile } from './fileUpload'
```

#### 新增常量
```javascript
// 头像文件大小限制：5MB
const MAX_AVATAR_SIZE = 5 * 1024 * 1024
```

#### 新增导出函数

##### 1. getFullAvatarUrl(url)
将相对路径转换为完整的 URL
```javascript
export const getFullAvatarUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  return `${BASE_API_URL}${url}`
}
```

##### 2. loadAuthenticatedImage(imageUrl)
通过 fetch 加载需要认证的头像图片
```javascript
export const loadAuthenticatedImage = async (imageUrl) => {
  const token = getToken()
  if (!token) {
    throw new Error('未找到 JWT 令牌')
  }

  const response = await fetch(imageUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (!response.ok) {
    throw new Error(`加载头像失败: HTTP ${response.status}`)
  }

  const blob = await response.blob()
  return URL.createObjectURL(blob)
}
```

##### 3. getAvatarFromProfileCache() ⭐ 核心函数
从 profile 缓存中获取头像 URL
```javascript
export const getAvatarFromProfileCache = () => {
  try {
    const cachedUserInfo = getCachedUserInfo()
    if (cachedUserInfo && cachedUserInfo.avatar) {
      logger.debug('从 profile 缓存中获取头像:', cachedUserInfo.avatar)
      return cachedUserInfo.avatar
    }
    logger.debug('profile 缓存中没有头像信息')
    return null
  } catch (error) {
    logger.error('从 profile 缓存获取头像失败:', error)
    return null
  }
}
```

##### 4. getUserAvatar() ⭐ 核心函数
获取用户头像（直接从 profile 缓存读取）
```javascript
export const getUserAvatar = () => {
  const avatarPath = getAvatarFromProfileCache()
  if (avatarPath) {
    return getFullAvatarUrl(avatarPath)
  }
  return null
}
```

##### 5. validateAvatarFile(file)
验证头像文件
```javascript
export const validateAvatarFile = (file) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      message: '只支持 JPG、PNG、GIF、WebP 格式的图片'
    }
  }

  if (file.size > MAX_AVATAR_SIZE) {
    return {
      valid: false,
      message: `头像大小不能超过 ${MAX_AVATAR_SIZE / 1024 / 1024}MB`
    }
  }

  return { valid: true, message: '' }
}
```

##### 6. setAvatarToServer(avatarUrl)
设置头像到服务器
```javascript
export const setAvatarToServer = async (avatarUrl) => {
  const token = getToken()
  if (!token) {
    throw new Error('未找到 JWT 令牌')
  }

  const url = `${PROFILE_API.SET_AVATAR}?avatar=${encodeURIComponent(avatarUrl)}`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (!response.ok) {
    throw new Error(`设置头像失败: HTTP ${response.status}`)
  }

  const result = await response.json()

  if (!result.success || result.code !== 200) {
    throw new Error(result.message || '设置头像失败')
  }

  logger.info('头像设置成功')
  return result
}
```

##### 7. uploadAndSetAvatar(file, onProgress)
完整的头像上传和设置流程
```javascript
export const uploadAndSetAvatar = async (file, onProgress = null) => {
  try {
    // 1. 验证文件
    const validation = validateAvatarFile(file)
    if (!validation.valid) {
      throw new Error(validation.message)
    }

    // 2. 上传文件（使用分片上传）
    const uploadResult = await uploadFile(file, {
      chunkSize: 2 * 1024 * 1024,
      onProgress: (progress) => {
        if (onProgress) {
          onProgress(progress)
        }
      }
    })

    if (!uploadResult.success) {
      throw new Error('文件上传失败')
    }

    // 3. 设置头像到数据库
    await setAvatarToServer(uploadResult.filePath)

    // 4. 更新 profile 缓存中的头像信息 ⭐ 关键步骤
    updateUserInfoField('avatar', uploadResult.filePath)
    
    return {
      success: true,
      filePath: uploadResult.filePath,
      quickUpload: uploadResult.quickUpload,
      message: '头像设置成功'
    }
  } catch (error) {
    logger.error('头像上传失败:', error)
    throw error
  }
}
```

##### 8. clearAvatarCache() (已废弃)
```javascript
/**
 * @deprecated 请使用 clearUserInfoCache() 代替
 */
export const clearAvatarCache = () => {
  logger.warn('clearAvatarCache 已废弃，头像现在存储在 profile 缓存中')
}
```

### 2. DashboardView 更新

**文件**: `src/views/DashBoardView.vue`

#### 导入变更
```javascript
// 之前
import { getFullAvatarUrl, loadAuthenticatedImage, clearAvatarCache } from '@/utils/avatar'
import { getCachedUserInfo } from '@/utils/userInfo'

// 现在
import { getFullAvatarUrl, loadAuthenticatedImage, clearUserInfoCache } from '@/utils/userInfo'
```

#### handleLogout 更新
```javascript
const handleLogout = () => {
  if (confirm('确定要退出登录吗？')) {
    clearAuthInfo()
    clearUserInfoCache()  // ✅ 清除用户信息缓存（包括头像）
    router.push('/login')
  }
}
```

#### loadUserAvatar 保持不变
```javascript
const loadUserAvatar = async () => {
  try {
    const cachedUserInfo = getCachedUserInfo()
    
    if (!cachedUserInfo) {
      userAvatar.value = ''
      return
    }
    
    if (cachedUserInfo.avatar) {
      const fullUrl = getFullAvatarUrl(cachedUserInfo.avatar)
      const blobUrl = await loadAuthenticatedImage(fullUrl)
      userAvatar.value = blobUrl
    } else {
      userAvatar.value = ''
    }
  } catch (error) {
    userAvatar.value = ''
  }
}
```

### 3. ProfileEditView 更新

**文件**: `src/views/ProfileEditView.vue`

#### 导入变更
```javascript
// 之前
import { getUserAvatar, uploadAndSetAvatar, getFullAvatarUrl, loadAuthenticatedImage } from '@/utils/avatar'

// 现在
import { uploadAndSetAvatar, getFullAvatarUrl, loadAuthenticatedImage } from '@/utils/userInfo'
```

#### 删除 loadUserAvatar 函数
完全移除了 `loadUserAvatar()` 函数，因为现在头像直接从 `loadUserInfoFromCache()` 中加载。

#### onMounted 简化
```javascript
onMounted(async () => {
  // 从缓存加载用户信息（App.vue 已经获取过）
  const loaded = loadUserInfoFromCache()
  
  // ✅ 不再需要备用方案加载头像
  
  // RSA 密钥不在页面加载时获取，只在需要验证密码时才获取
  // ...
})
```

## 📊 数据流程对比

### 之前的流程
```
应用启动
  ↓
登录成功
  ↓
POST /profile/get_all → 缓存到 sessionStorage
  ├─ avatar
  ├─ nickname
  ├─ email
  └─ ...
  ↓
DashboardView 加载
  ↓
loadUserAvatar()
  ↓
getCachedUserInfo() → 从 sessionStorage 读取 avatar
  ↓
getFullAvatarUrl() → 构建完整 URL
  ↓
loadAuthenticatedImage() → 加载图片
  ↓
显示头像

---

ProfileEditView 加载（备用方案）
  ↓
loadUserInfoFromCache() 失败
  ↓
loadUserAvatar() ← 可能触发
  ↓
getUserAvatar() ← 可能触发
  ↓
getAvatarFromCache() ← localStorage 检查
  ↓
fetchAvatarFromServer() ← 可能触发
  ↓
GET /profile/avatar/get ← ❌ 额外的网络请求
  ↓
缓存到 localStorage
  ↓
返回头像 URL
```

### 现在的流程
```
应用启动
  ↓
登录成功
  ↓
POST /profile/get_all → 缓存到 sessionStorage
  ├─ avatar
  ├─ nickname
  ├─ email
  └─ ...
  ↓
DashboardView 加载
  ↓
loadUserAvatar()
  ↓
getCachedUserInfo() → 从 sessionStorage 读取 avatar
  ↓
getFullAvatarUrl() → 构建完整 URL
  ↓
loadAuthenticatedImage() → 加载图片
  ↓
显示头像

---

ProfileEditView 加载
  ↓
loadUserInfoFromCache()
  ↓
getCachedUserInfo() → 从 sessionStorage 读取所有信息
  ├─ avatar → 直接加载
  ├─ nickname
  ├─ email
  └─ storageUsed/Total
  ↓
✅ 无需额外请求，所有数据一次性加载
```

## ✨ 优势

### 1. 减少网络请求
| 场景 | 之前 | 现在 |
|------|------|------|
| 首次登录 | 2 次请求 (get_all + avatar/get) | 1 次请求 (get_all) |
| 刷新页面 | 1-2 次请求 | 0 次请求（从缓存） |
| ProfileEditView | 可能 2-3 次请求 | 0 次请求 |

### 2. 代码简化
- ❌ 删除了 `avatar.js` 中的独立缓存逻辑
- ❌ 删除了 `localStorage` 头像缓存
- ✅ 统一使用 `sessionStorage` 的 profile 缓存
- ✅ 减少了约 100 行重复代码

### 3. 数据一致性
- ✅ 头像与其他用户信息同步更新
- ✅ 上传头像后立即更新 profile 缓存
- ✅ 不会出现头像与用户信息不同步的问题

### 4. 性能提升
- ✅ 减少网络延迟
- ✅ 减少浏览器存储操作
- ✅ 更快的页面加载速度

## 🔄 迁移指南

### 对于其他开发者

如果你的代码中使用了 `avatar.js`，需要进行以下迁移：

#### 1. 更新导入
```javascript
// 之前
import { getUserAvatar, uploadAndSetAvatar } from '@/utils/avatar'

// 现在
import { getUserAvatar, uploadAndSetAvatar } from '@/utils/userInfo'
```

#### 2. 更新清除缓存
```javascript
// 之前
import { clearAvatarCache } from '@/utils/avatar'
clearAvatarCache()

// 现在
import { clearUserInfoCache } from '@/utils/userInfo'
clearUserInfoCache()
```

#### 3. 头像获取方式不变
```javascript
// 仍然可以这样使用
const avatarUrl = getUserAvatar()  // 从 profile 缓存读取
if (avatarUrl) {
  const blobUrl = await loadAuthenticatedImage(avatarUrl)
  // 显示头像
}
```

## 📝 注意事项

### 1. 向后兼容
- `clearAvatarCache()` 函数保留但标记为 `@deprecated`
- 调用时会输出警告日志，但不执行任何操作
- 建议尽快迁移到 `clearUserInfoCache()`

### 2. 缓存位置
- **之前**: 头像缓存在 `localStorage`
- **现在**: 头像缓存在 `sessionStorage` 的 `user_info_cache` 中
- **优势**: 关闭浏览器后自动清除，保证数据时效性

### 3. 上传头像后的更新
上传头像后会自动调用 `updateUserInfoField('avatar', filePath)` 更新 profile 缓存，确保其他页面能立即看到新头像。

### 4. 错误处理
如果 profile 缓存中没有头像信息，`getUserAvatar()` 会返回 `null`，页面应显示默认头像（字母头像）。

## 🎯 总结

通过这次重构：

1. ✅ **合并了头像管理功能** - 从 `avatar.js` 迁移到 `userInfo.js`
2. ✅ **统一了数据来源** - 所有用户信息从 `/profile/get_all` 获取
3. ✅ **消除了冗余请求** - 不再调用 `/profile/avatar/get`
4. ✅ **简化了代码结构** - 减少了约 100 行代码
5. ✅ **提升了性能** - 减少了网络请求和存储操作
6. ✅ **保证了数据一致性** - 头像与用户信息同步更新

现在整个应用的用户信息管理更加统一、高效和可靠！🎉

---

**最后更新**: 2024-05-01  
**版本**: 2.0.0
