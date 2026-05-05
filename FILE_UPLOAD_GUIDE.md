# 文件上传工具使用指南

## 概述

`fileUpload.js` 提供了完整的文件上传功能，支持：
- ✅ 分片上传（大文件分割上传）
- ✅ 秒传（相同文件直接返回路径）
- ✅ 断点续传（中断后继续上传）
- ✅ 进度回调（实时显示上传进度）
- ✅ 哈希计算（MD5 + SHA256）

## 安装依赖

需要安装 `spark-md5` 库来计算 MD5 哈希：

```bash
npm install spark-md5
```

## API 接口

### 1. 初始化上传任务

**接口**: `POST /api/file/upload/init`

**请求体**:
```json
{
  "fileName": "example.pdf",
  "fileSize": 10485760,
  "md5": "d41d8cd98f00b204e9800998ecf8427e",
  "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "mimeType": "application/pdf",
  "totalChunks": 10
}
```

**响应**:
```json
{
  "code": 200,
  "success": true,
  "message": "上传任务创建成功",
  "uploadId": "550e8400-e29b-41d4-a716-446655440000",
  "needUpload": true,
  "uploadedChunks": 0
}
```

### 2. 上传分片

**接口**: `POST /api/file/upload/chunk?uploadId=xxx&chunkIndex=0`

**请求**: multipart/form-data
```
file: [binary data]
```

**响应**:
```json
{
  "code": 200,
  "success": true,
  "message": "分片上传成功",
  "uploadedChunks": 1,
  "chunkStatus": [true, false, false, ...]
}
```

### 3. 合并分片

**接口**: `POST /api/file/upload/merge`

**请求体**:
```json
{
  "uploadId": "550e8400-e29b-41d4-a716-446655440000",
  "fileName": "example.pdf",
  "md5": "d41d8cd98f00b204e9800998ecf8427e",
  "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
}
```

**响应**:
```json
{
  "code": 200,
  "success": true,
  "message": "文件上传成功",
  "filePath": "/api/file/download/abc123_example.pdf"
}
```

### 4. 查询上传进度

**接口**: `GET /api/file/upload/progress/{uploadId}`

**响应**:
```json
{
  "code": 200,
  "success": true,
  "message": "查询成功",
  "uploadedChunks": 5,
  "chunkStatus": [true, true, true, true, true, false, ...]
}
```

## 使用方法

### 基础用法

```javascript
import { uploadFile } from '@/utils/fileUpload'

// HTML: <input type="file" id="fileInput" />

const fileInput = document.getElementById('fileInput')
const file = fileInput.files[0]

try {
  const result = await uploadFile(file)
  
  if (result.quickUpload) {
    console.log('秒传成功！', result.filePath)
  } else {
    console.log('上传成功！', result.filePath)
  }
} catch (error) {
  console.error('上传失败:', error)
}
```

### 带进度回调

```javascript
import { uploadFile } from '@/utils/fileUpload'

const result = await uploadFile(file, {
  // 自定义分片大小（默认 5MB）
  chunkSize: 10 * 1024 * 1024, // 10MB
  
  // 进度回调（0-100）
  onProgress: (progress) => {
    console.log(`上传进度: ${progress}%`)
    // 更新进度条
    progressBar.value = progress
  },
  
  // 分片完成回调
  onChunkComplete: (current, total) => {
    console.log(`已上传 ${current}/${total} 个分片`)
  }
})
```

### Vue 组件中使用

```vue
<template>
  <div class="upload-component">
    <input 
      type="file" 
      @change="handleFileSelect" 
      ref="fileInput"
    />
    
    <div v-if="uploading" class="progress-bar">
      <div 
        class="progress-fill" 
        :style="{ width: progress + '%' }"
      ></div>
      <span>{{ progress }}%</span>
    </div>
    
    <button @click="startUpload" :disabled="!selectedFile || uploading">
      {{ uploading ? '上传中...' : '开始上传' }}
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { uploadFile } from '@/utils/fileUpload'

const fileInput = ref(null)
const selectedFile = ref(null)
const uploading = ref(false)
const progress = ref(0)

const handleFileSelect = (event) => {
  selectedFile.value = event.target.files[0]
  progress.value = 0
}

const startUpload = async () => {
  if (!selectedFile.value) return
  
  uploading.value = true
  
  try {
    const result = await uploadFile(selectedFile.value, {
      onProgress: (p) => {
        progress.value = p
      }
    })
    
    alert(result.message)
    
    if (result.quickUpload) {
      console.log('秒传成功:', result.filePath)
    } else {
      console.log('上传成功:', result.filePath)
    }
  } catch (error) {
    alert('上传失败: ' + error.message)
  } finally {
    uploading.value = false
  }
}
</script>
```

### 头像上传（特殊场景）

```javascript
import { uploadFile } from '@/utils/fileUpload'

const uploadAvatar = async (file) => {
  try {
    const result = await uploadFile(file, {
      // 头像文件通常较小，可以使用较小的分片
      chunkSize: 2 * 1024 * 1024, // 2MB
      
      onProgress: (progress) => {
        console.log(`头像上传进度: ${progress}%`)
      }
    })
    
    // 更新头像缓存
    import { updateAvatarCache } from '@/utils/avatar'
    
    // 读取文件为 Base64
    const reader = new FileReader()
    reader.onload = (e) => {
      updateAvatarCache(e.target.result.split(',')[1])
    }
    reader.readAsDataURL(file)
    
    return result.filePath
  } catch (error) {
    console.error('头像上传失败:', error)
    throw error
  }
}
```

### 断点续传

```javascript
import { resumeUpload } from '@/utils/fileUpload'

// 假设之前保存了 uploadId
const savedUploadId = localStorage.getItem('uploadId')

if (savedUploadId) {
  try {
    const result = await resumeUpload(file, savedUploadId, {
      onProgress: (progress) => {
        console.log(`续传进度: ${progress}%`)
      }
    })
    
    console.log('续传成功:', result.filePath)
  } catch (error) {
    console.error('续传失败:', error)
  }
}
```

## 高级用法

### 批量上传

```javascript
import { uploadFile } from '@/utils/fileUpload'

const uploadMultipleFiles = async (files) => {
  const results = []
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    
    try {
      console.log(`上传第 ${i + 1}/${files.length} 个文件...`)
      
      const result = await uploadFile(file, {
        onProgress: (progress) => {
          console.log(`文件 ${i + 1}: ${progress}%`)
        }
      })
      
      results.push({
        fileName: file.name,
        success: true,
        filePath: result.filePath
      })
    } catch (error) {
      results.push({
        fileName: file.name,
        success: false,
        error: error.message
      })
    }
  }
  
  return results
}
```

### 取消上传

```javascript
import { cancelUpload } from '@/utils/fileUpload'

// 注意：当前版本后端可能未实现取消接口
const handleCancel = async (uploadId) => {
  try {
    await cancelUpload(uploadId)
    console.log('上传已取消')
  } catch (error) {
    console.error('取消失败:', error)
  }
}
```

## 错误处理

```javascript
try {
  const result = await uploadFile(file)
} catch (error) {
  // 常见错误类型
  if (error.message.includes('JWT')) {
    alert('请先登录')
  } else if (error.message.includes('网络')) {
    alert('网络连接失败，请检查网络')
  } else if (error.message.includes('秒传')) {
    alert('文件处理异常')
  } else {
    alert('上传失败: ' + error.message)
  }
}
```

## 性能优化建议

### 1. 分片大小选择

| 文件大小 | 推荐分片大小 | 说明 |
|---------|------------|------|
| < 10MB | 2MB | 小文件，减少请求次数 |
| 10-100MB | 5MB | 中等文件，平衡性能 |
| > 100MB | 10MB | 大文件，减少请求开销 |

### 2. 并发控制

当前版本是串行上传分片，如需提升速度可以实现并发：

```javascript
// 并发上传示例（最多 3 个分片同时上传）
const MAX_CONCURRENT = 3

for (let i = 0; i < totalChunks; i += MAX_CONCURRENT) {
  const promises = []
  
  for (let j = 0; j < MAX_CONCURRENT && i + j < totalChunks; j++) {
    const chunkIndex = i + j
    promises.push(uploadChunk({ uploadId, chunkIndex, chunk }))
  }
  
  await Promise.all(promises)
}
```

### 3. 哈希计算优化

对于超大文件，可以只读取部分数据计算哈希：

```javascript
// 采样哈希（牺牲准确性换取速度）
const sampleHash = async (file) => {
  const sampleSize = Math.min(file.size, 1024 * 1024) // 最多 1MB
  const sample = file.slice(0, sampleSize)
  // 计算采样数据的哈希
}
```

## 注意事项

1. **必须安装 spark-md5**
   ```bash
   npm install spark-md5
   ```

2. **浏览器兼容性**
   - 需要支持 `crypto.subtle` API（现代浏览器都支持）
   - IE 不支持，需要使用 polyfill

3. **文件大小限制**
   - 前端无限制
   - 后端可能有最大文件大小限制

4. **网络稳定性**
   - 建议在弱网环境下使用断点续传
   - 可以保存 uploadId 到 localStorage

5. **安全性**
   - 所有请求都携带 JWT Token
   - 哈希值用于验证文件完整性

## 常见问题

### Q: 为什么需要计算两个哈希值？

A: MD5 用于快速比对（秒传），SHA256 用于安全验证（防篡改）。

### Q: 上传中断后怎么办？

A: 使用 `resumeUpload()` 函数，传入之前的 uploadId 即可继续上传。

### Q: 如何显示上传速度？

A: 记录每个分片的上传时间，计算平均速度：

```javascript
let startTime = Date.now()
let uploadedBytes = 0

onChunkComplete: (index, total) => {
  uploadedBytes += chunkSize
  const elapsed = (Date.now() - startTime) / 1000
  const speed = uploadedBytes / elapsed / 1024 / 1024 // MB/s
  console.log(`上传速度: ${speed.toFixed(2)} MB/s`)
}
```

---

**最后更新**: 2026-04-27  
**维护者**: 开发团队
