# 头像接口修改说明

## 修改概述

将获取头像的接口从 **POST** 改为 **GET**，返回值从 **Base64 数据** 改为 **URL 链接**。

---

## 修改内容

### 1. API 接口变更

#### 修改前
```http
POST /api/profile/avatar/get
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

// 响应
{
  "code": 200,
  "success": true,
  "message": "获取成功",
  "avatar": "iVBORw0KGgoAAAANSUhEUgAA..."  // Base64 数据
}
```

#### 修改后
```http
GET /api/profile/avatar/get
Authorization: Bearer {JWT_TOKEN}

// 响应
{
  "code": 200,
  "success": true,
  "message": "获取成功",
  "avatarUrl": "/api/file/download/abc123_avatar.png"  // URL 链接
}
```

---

## 代码变更

### 1. `src/utils/avatar.js`

#### 修改 `fetchAvatarFromServer` 函数

**变更前：**
```javascript
const response = await fetch(PROFILE_API.GET_AVATAR, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})

if (result.success && result.code === 200 && result.avatar) {
  localStorage.setItem(AVATAR_CACHE_KEY, result.avatar)
  return result.avatar  // Base64
}
```

**变更后：**
```javascript
const response = await fetch(PROFILE_API.GET_AVATAR, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
})

if (result.success && result.code === 200 && result.avatarUrl) {
  localStorage.setItem(AVATAR_CACHE_KEY, result.avatarUrl)
  return result.avatarUrl  // URL
}
```

#### 修改 `uploadAndSetAvatar` 函数

**变更前：**
```javascript
// 4. 读取文件为 Base64 并更新本地缓存
const reader = new FileReader()
return new Promise((resolve, reject) => {
  reader.onload = (e) => {
    const base64Data = e.target.result.split(',')[1]
    updateAvatarCache(base64Data)
    resolve(result)
  }
  reader.readAsDataURL(file)
})
```

**变更后：**
```javascript
// 4. 更新本地缓存（缓存头像 URL）
updateAvatarCache(uploadResult.filePath)

return {
  success: true,
  filePath: uploadResult.filePath,
  quickUpload: uploadResult.quickUpload,
  message: '头像设置成功'
}
```

### 2. `src/views/DashBoardView.vue`

**变更前：**
```javascript
import { getUserAvatar, base64ToDataUrl, clearAvatarCache } from '@/utils/avatar'

const loadUserAvatar = async () => {
  const avatarData = await getUserAvatar()
  if (avatarData) {
    userAvatar.value = base64ToDataUrl(avatarData)  // 转换 Base64
  }
}
```

**变更后：**
```javascript
import { getUserAvatar, clearAvatarCache } from '@/utils/avatar'

const loadUserAvatar = async () => {
  const avatarUrl = await getUserAvatar()
  if (avatarUrl) {
    userAvatar.value = avatarUrl  // 直接使用 URL
  }
}
```

### 3. `src/views/ProfileEditView.vue`

**变更前：**
```javascript
import { getUserAvatar, uploadAndSetAvatar, base64ToDataUrl } from '@/utils/avatar'

const loadUserAvatar = async () => {
  const avatarData = await getUserAvatar()
  if (avatarData) {
    previewAvatar.value = base64ToDataUrl(avatarData)
  }
}

const handleAvatarChange = async (event) => {
  const result = await uploadAndSetAvatar(file)
  previewAvatar.value = base64ToDataUrl(
    localStorage.getItem('user_avatar_cache') || ''
  )
}
```

**变更后：**
```javascript
import { getUserAvatar, uploadAndSetAvatar } from '@/utils/avatar'

const loadUserAvatar = async () => {
  const avatarUrl = await getUserAvatar()
  if (avatarUrl) {
    previewAvatar.value = avatarUrl  // 直接使用 URL
  }
}

const handleAvatarChange = async (event) => {
  const result = await uploadAndSetAvatar(file)
  previewAvatar.value = result.filePath  // 使用返回的文件路径
}
```

---

## 优势对比

| 特性 | Base64 方式 | URL 方式 |
|------|------------|---------|
| 响应速度 | ❌ 慢（传输大量数据） | ✅ 快（只传路径） |
| 带宽占用 | ❌ 高（Base64 增大约 33%） | ✅ 低 |
| 缓存效率 | ❌ 差（每次都要传输） | ✅ 好（浏览器自动缓存图片） |
| 存储空间 | ❌ 大（localStorage 限制 5-10MB） | ✅ 小（只存 URL） |
| 图片加载 | ❌ 需要前端转换 | ✅ 浏览器直接加载 |
| CDN 支持 | ❌ 不支持 | ✅ 支持 |
| 后端压力 | ❌ 高（每次都要查询并编码） | ✅ 低（只返回路径） |

---

## 工作流程对比

### 修改前（Base64）
```
前端请求 GET /avatar
    ↓
后端查询数据库
    ↓
读取图片文件
    ↓
转换为 Base64
    ↓
返回 Base64 字符串（可能很大）
    ↓
前端接收并缓存 Base64
    ↓
<img src="data:image/png;base64,iVBORw0K...">
```

### 修改后（URL）
```
前端请求 GET /avatar
    ↓
后端查询数据库
    ↓
返回文件路径 URL
    ↓
前端接收并缓存 URL
    ↓
<img src="/api/file/download/abc123.png">
    ↓
浏览器自动加载图片（可缓存）
```

---

## 注意事项

### 1. 后端需要同步修改

后端接口 `/api/profile/avatar/get` 需要：
- ✅ 改为 GET 方法
- ✅ 移除 Content-Type 要求
- ✅ 返回字段从 `avatar` 改为 `avatarUrl`
- ✅ 返回文件路径而不是 Base64 数据

### 2. 图片访问权限

确保头像文件可以通过 URL 直接访问：
- 如果使用了 JWT 认证，需要在文件下载接口中验证 Token
- 或者将头像文件设置为公开访问

### 3. 缓存策略

- **前端缓存**：localStorage 存储 URL，有效期 24 小时
- **浏览器缓存**：通过 HTTP 缓存头控制图片缓存
- **CDN 缓存**：如果使用 CDN，可以配置更长的缓存时间

### 4. 兼容性

- ✅ 现代浏览器都支持 URL 方式的图片加载
- ✅ 不需要额外的 JavaScript 处理
- ✅ 更好的性能和用户体验

---

## 测试建议

### 1. 功能测试
- [ ] 首次加载头像是否正常显示
- [ ] 上传新头像后是否立即更新
- [ ] 退出登录后重新登录，头像是否正确加载
- [ ] 清除缓存后重新加载，头像是否正常

### 2. 性能测试
- [ ] 比较修改前后的页面加载速度
- [ ] 检查网络请求大小是否减小
- [ ] 验证浏览器是否正确缓存图片

### 3. 兼容性测试
- [ ] Chrome、Firefox、Safari、Edge 测试
- [ ] 移动端浏览器测试
- [ ] 弱网环境下的表现

---

## 回滚方案

如果需要回滚到 Base64 方式：

1. 恢复 `avatar.js` 中的 `fetchAvatarFromServer` 函数
2. 恢复 `DashBoardView.vue` 和 `ProfileEditView.vue` 的 import 和使用逻辑
3. 后端接口改回 POST 方法并返回 Base64

---

## 相关文件清单

### 前端文件
- ✅ `src/utils/avatar.js` - 头像工具函数
- ✅ `src/views/DashBoardView.vue` - 仪表板页面
- ✅ `src/views/ProfileEditView.vue` - 个人信息编辑页面
- ✅ `src/config/api.js` - API 配置（无需修改）

### 后端文件（需同步修改）
- ⚠️ `AvatarController.java` - 头像控制器
- ⚠️ `AvatarService.java` - 头像服务层

---

**修改日期**: 2026-04-27  
**修改人员**: 开发团队  
**影响范围**: 头像获取和显示功能
