# 头像上传功能使用指南

## 概述

头像上传功能已完全集成到系统中，支持：
- ✅ 文件验证（格式、大小）
- ✅ 分片上传（大文件支持）
- ✅ 秒传检测（相同文件直接返回）
- ✅ 进度回调（实时显示进度）
- ✅ 自动设置（上传成功后自动更新数据库）
- ✅ 本地缓存（24小时有效期）

## 文件大小限制

**最大头像大小：5MB**

支持的图片格式：
- JPG/JPEG
- PNG
- GIF
- WebP

## API 接口

### 1. 文件上传接口（复用通用上传）

#### 初始化上传
```http
POST /api/file/upload/init
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "fileName": "avatar.png",
  "fileSize": 102400,
  "md5": "d41d8cd98f00b204e9800998ecf8427e",
  "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "mimeType": "image/png",
  "totalChunks": 1
}
```

#### 上传分片
```http
POST /api/file/upload/chunk?uploadId=xxx&chunkIndex=0
Authorization: Bearer {JWT_TOKEN}
Content-Type: multipart/form-data

file: [binary data]
```

#### 合并分片
```http
POST /api/file/upload/merge
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "uploadId": "xxx",
  "fileName": "avatar.png",
  "md5": "...",
  "sha256": "..."
}
```

### 2. 设置头像接口

```http
GET /api/profile/avatar/set?avatar=/api/file/download/abc123_avatar.png
Authorization: Bearer {JWT_TOKEN}
```

**响应：**
```json
{
  "code": 200,
  "success": true,
  "message": "头像设置成功"
}
```

## 使用方法

### 方式一：在 ProfileEditView 中使用（推荐）

用户界面已经集成，只需点击头像区域选择图片即可。

**操作流程：**
1. 进入个人信息页面
2. 点击"头像设置"选项卡
3. 点击头像预览区域
4. 选择图片文件（≤5MB）
5. 自动上传并设置

**用户体验：**
- 自动验证文件格式和大小
- 显示上传进度
- 上传成功后立即显示新头像
- 失败时显示错误提示

### 方式二：编程方式使用

```javascript
import { uploadAndSetAvatar } from '@/utils/avatar'

// HTML: <input type="file" @change="handleAvatarUpload" accept="image/*" />

const handleAvatarUpload = async (event) => {
  const file = event.target.files[0]
  
  if (!file) return
  
  try {
    // 上传并设置头像
    const result = await uploadAndSetAvatar(file, (progress) => {
      console.log(`上传进度: ${progress}%`)
      // 可以更新进度条 UI
    })
    
    console.log('头像设置成功:', result)
    alert(result.message)
  } catch (error) {
    console.error('头像上传失败:', error)
    alert('上传失败: ' + error.message)
  }
}
```

### 方式三：手动控制每个步骤

```javascript
import { 
  validateAvatarFile, 
  uploadFile, 
  setAvatarToServer,
  updateAvatarCache 
} from '@/utils/avatar'

const manualUpload = async (file) => {
  // 1. 验证文件
  const validation = validateAvatarFile(file)
  if (!validation.valid) {
    throw new Error(validation.message)
  }
  
  // 2. 上传文件
  const uploadResult = await uploadFile(file, {
    chunkSize: 2 * 1024 * 1024, // 2MB 分片
    onProgress: (progress) => {
      console.log(`进度: ${progress}%`)
    }
  })
  
  // 3. 设置头像到数据库
  await setAvatarToServer(uploadResult.filePath)
  
  // 4. 更新本地缓存
  const reader = new FileReader()
  reader.onload = (e) => {
    const base64Data = e.target.result.split(',')[1]
    updateAvatarCache(base64Data)
  }
  reader.readAsDataURL(file)
  
  return uploadResult
}
```

## 工作流程

```
用户选择图片
    ↓
验证文件格式和大小（≤5MB）
    ↓
计算文件哈希（MD5 + SHA256）
    ↓
初始化上传任务
    ↓
后端判断是否秒传？
    ├─ 是 → 直接返回文件路径
    └─ 否 → 分片上传
            ↓
        上传所有分片
            ↓
        合并分片
            ↓
        返回文件路径
            ↓
设置头像到数据库（GET /set）
    ↓
更新本地缓存（Base64）
    ↓
刷新头像显示 ✅
```

## 代码示例

### Vue 组件中集成

```vue
<template>
  <div class="avatar-upload">
    <!-- 头像预览 -->
    <div class="avatar-preview" @click="triggerFileInput">
      <img v-if="avatarUrl" :src="avatarUrl" alt="头像" />
      <div v-else class="placeholder">{{ avatarLetter }}</div>
      <div class="overlay">点击更换</div>
    </div>
    
    <!-- 隐藏的文件输入 -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      @change="handleAvatarChange"
      style="display: none"
    />
    
    <!-- 上传进度 -->
    <div v-if="uploading" class="progress-bar">
      <div class="progress-fill" :style="{ width: progress + '%' }"></div>
      <span>{{ progress }}%</span>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { uploadAndSetAvatar, base64ToDataUrl } from '@/utils/avatar'

const fileInput = ref(null)
const avatarUrl = ref('')
const uploading = ref(false)
const progress = ref(0)

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleAvatarChange = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  uploading.value = true
  progress.value = 0
  
  try {
    await uploadAndSetAvatar(file, (p) => {
      progress.value = p
    })
    
    // 从缓存读取新头像
    const cached = localStorage.getItem('user_avatar_cache')
    if (cached) {
      avatarUrl.value = base64ToDataUrl(cached)
    }
    
    alert('头像设置成功！')
  } catch (error) {
    alert('上传失败: ' + error.message)
  } finally {
    uploading.value = false
  }
}
</script>
```

## 错误处理

### 常见错误及解决方案

| 错误信息 | 原因 | 解决方案 |
|---------|------|---------|
| 只支持 JPG、PNG、GIF、WebP 格式的图片 | 文件格式不支持 | 转换为支持的格式 |
| 头像大小不能超过 5MB | 文件过大 | 压缩图片或选择更小的图片 |
| 未找到 JWT 令牌 | 未登录或 Token 过期 | 重新登录 |
| 文件上传失败 | 网络问题或服务器错误 | 检查网络连接，重试 |
| 设置头像失败 | 后端接口错误 | 检查后端服务状态 |

### 错误处理示例

```javascript
try {
  await uploadAndSetAvatar(file)
} catch (error) {
  if (error.message.includes('JWT')) {
    // Token 过期，跳转登录
    router.push('/login')
  } else if (error.message.includes('5MB')) {
    // 文件太大，提示用户压缩
    alert('请选择小于 5MB 的图片')
  } else {
    // 其他错误
    alert('上传失败: ' + error.message)
  }
}
```

## 性能优化

### 1. 分片大小选择

头像通常较小（≤5MB），建议使用较小的分片：

```javascript
await uploadAndSetAvatar(file, {
  chunkSize: 2 * 1024 * 1024, // 2MB 分片
  // ...
})
```

### 2. 秒传优化

相同文件第二次上传会触发秒传，无需实际上传：

```javascript
const result = await uploadAndSetAvatar(file)
if (result.quickUpload) {
  console.log('秒传成功，无需上传')
}
```

### 3. 缓存策略

- 本地缓存有效期：24小时
- 退出登录时清除缓存
- 上传新头像后自动更新缓存

## 日志输出

### 成功流程

```
[2026-04-27 15:30:25.123] [INFO] [Avatar] 验证头像文件...
[2026-04-27 15:30:25.124] [INFO] [Avatar] 文件验证通过 { fileName: "avatar.png", fileSize: 102400, mimeType: "image/png" }
[2026-04-27 15:30:25.125] [INFO] [Avatar] 开始上传头像文件...
[2026-04-27 15:30:25.456] [DEBUG] [Avatar] 头像上传进度: 50%
[2026-04-27 15:30:25.789] [INFO] [Avatar] 头像文件上传成功 { filePath: "/api/file/download/xxx" }
[2026-04-27 15:30:25.790] [INFO] [Avatar] 设置头像到数据库...
[2026-04-27 15:30:26.123] [INFO] [Avatar] 头像设置成功
[2026-04-27 15:30:26.124] [INFO] [Avatar] 更新本地头像缓存...
[2026-04-27 15:30:26.125] [INFO] [Avatar] 头像上传和设置完成
```

### 失败流程

```
[2026-04-27 15:30:25.123] [INFO] [Avatar] 验证头像文件...
[2026-04-27 15:30:25.124] [ERROR] [Avatar] 头像上传失败: Error: 头像大小不能超过 5MB
```

## 相关文件

- `src/utils/avatar.js` - 头像管理工具
- `src/utils/fileUpload.js` - 文件上传工具
- `src/config/api.js` - API 配置
- `src/views/ProfileEditView.vue` - 个人信息编辑页面

## 注意事项

1. **必须安装 spark-md5**
   ```bash
   npm install spark-md5
   ```

2. **文件大小限制**
   - 前端限制：5MB
   - 后端可能也有大小限制，需保持一致

3. **图片格式**
   - 推荐使用 PNG 或 JPG
   - GIF 和 WebP 也支持

4. **网络要求**
   - 需要稳定的网络连接
   - 弱网环境下建议显示进度条

5. **安全性**
   - 所有请求都携带 JWT Token
   - 文件哈希用于验证完整性
   - 后端应再次验证文件大小和格式

---

**最后更新**: 2026-04-27  
**维护者**: 开发团队
