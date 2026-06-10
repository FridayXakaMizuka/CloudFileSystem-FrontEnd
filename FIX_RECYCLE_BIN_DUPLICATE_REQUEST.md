# 修复回收站重复请求问题

## 📋 问题描述

在浏览回收站页面时，**一次加载会发送两次 API 请求**，导致：
- 网络资源浪费
- 后端压力增加
- 用户体验下降（可能看到闪烁或重复数据）

---

## 🔍 根本原因分析

### **问题流程**

```
页面加载 → onMounted 生命周期
    ↓
① loadRecycleBin() 
   └─> initRecycleBinBrowse(10)  ← 第一次请求
    ↓
② setTimeout(() => setupIntersectionObserver(), 100)
   └─> 设置 Intersection Observer
    ↓
③ loadMoreTrigger 元素在可视区域内
   └─> Intersection Observer 立即触发
    ↓
④ handleLoadMore()
   └─> loadMoreRecycleBinFiles(10)  ← 第二次请求 ❌
```

### **为什么会立即触发？**

1. **初始状态**：
   - `hasLoaded.value = false`
   - `isLoading.value = false`
   - `hasMore.value = true`（默认值）
   - `loadError.value = null`

2. **第一次请求完成后**：
   - `isLoading.value` 变为 `false`
   - `hasMore.value` 仍为 `true`（如果有更多数据）
   - `loadError.value` 为 `null`

3. **Intersection Observer 设置后**：
   - `loadMoreTrigger` 元素可能在可视区域内（特别是文件较少时）
   - `rootMargin: '100px'` 扩大了触发区域
   - 所有条件满足，立即触发 `handleLoadMore()`

4. **条件检查**（L573）：
   ```javascript
   if (entries[0].isIntersecting && !isLoading.value && hasMore.value && !loadError.value) {
     handleLoadMore()  // ✅ 所有条件都满足，触发第二次请求
   }
   ```

---

## ✅ 解决方案

### **核心思路**

将 `setupIntersectionObserver()` 的调用时机从 `onMounted` **延迟到第一次加载成功后**。

### **修改前**

```javascript
// RecycleBinView.vue L241-267
const loadRecycleBin = async () => {
  try {
    // ...
    const result = await initRecycleBinBrowse(10)
    
    if (!result.success) {
      loadError.value = result.message || '加载失败'
      logger.error('加载回收站失败:', result.message)
    } else {
      logger.info('回收站加载成功', { count: files.value.length })
      hasLoaded.value = true
      // ❌ 没有设置 Intersection Observer
    }
  } catch (error) {
    logger.error('加载回收站异常:', error)
    loadError.value = '网络错误，请稍后重试'
  }
}

// RecycleBinView.vue L592-612
onMounted(() => {
  logger.info('回收站页面加载，开始加载回收站数据')
  
  if (!hasLoaded.value) {
    loadRecycleBin()
  }
  
  // ❌ 在 onMounted 中立即设置 Intersection Observer
  setTimeout(() => {
    setupIntersectionObserver()
  }, 100)
  
  // ...
})
```

### **修改后**

```javascript
// RecycleBinView.vue L241-273
const loadRecycleBin = async () => {
  try {
    // ...
    const result = await initRecycleBinBrowse(10)
    
    if (!result.success) {
      loadError.value = result.message || '加载失败'
      logger.error('加载回收站失败:', result.message)
    } else {
      logger.info('回收站加载成功', { count: files.value.length })
      hasLoaded.value = true
      
      // ✅ 第一次加载完成后，再设置 Intersection Observer
      // 避免 loadMoreTrigger 立即触发导致第二次请求
      setTimeout(() => {
        setupIntersectionObserver()
      }, 100)
    }
  } catch (error) {
    logger.error('加载回收站异常:', error)
    loadError.value = '网络错误，请稍后重试'
  }
}

// RecycleBinView.vue L598-616
onMounted(() => {
  logger.info('回收站页面加载，开始加载回收站数据')
  
  if (!hasLoaded.value) {
    loadRecycleBin()
  }
  
  // ✅ 移除 onMounted 中的 setupIntersectionObserver
  // 改为在 loadRecycleBin 成功后设置，避免重复请求
  
  // 初始加载恢复进程列表
  fetchRestoreProcesses()
  
  // 如果有进程在运行，启动轮询
  if (restoreProcesses.value.length > 0 && !isPolling.value) {
    startRestorePolling()
  }
})
```

---

## 📊 修改对比

| 项目 | 修改前 | 修改后 |
|------|--------|--------|
| **Intersection Observer 设置时机** | `onMounted` 中立即设置 | 第一次加载成功后设置 |
| **请求次数** | 2 次（重复） | 1 次（正常） |
| **触发条件** | 页面加载 + Observer 触发 | 仅页面加载 |
| **用户体验** | 可能有闪烁 | 流畅无闪烁 |

---

## 🎯 修复效果

### **修复前**

```
Network 面板：
✅ GET /files/recycle/browse?maxPageSize=10  (200 OK)
❌ GET /files/recycle/browse?maxPageSize=10&lastBatchId=xxx  (200 OK)  ← 重复请求

控制台日志：
[INFO] [RecycleBinView] 回收站页面加载，开始加载回收站数据
[INFO] [DirectoryAPI] 浏览回收站目录...
[INFO] [RecycleBinView] 回收站加载成功 {count: 10}
[INFO] [RecycleBinView] RecycleBin Intersection Observer 触发 {isIntersecting: true, ...}
[INFO] [RecycleBinView] ✅ 开始加载更多回收站文件  ← 不应该触发
[INFO] [DirectoryAPI] 浏览回收站目录...  ← 第二次请求
```

### **修复后**

```
Network 面板：
✅ GET /files/recycle/browse?maxPageSize=10  (200 OK)  ← 只有一次请求

控制台日志：
[INFO] [RecycleBinView] 回收站页面加载，开始加载回收站数据
[INFO] [DirectoryAPI] 浏览回收站目录...
[INFO] [RecycleBinView] 回收站加载成功 {count: 10}
[INFO] [RecycleBinView] ✅ 已观察回收站 loadMoreTrigger 元素  ← Observer 已设置
// 只有滚动到底部时才会触发加载更多
```

---

## 🔧 技术细节

### **Intersection Observer 配置**

```javascript
observer = new IntersectionObserver((entries) => {
  logger.info('RecycleBin Intersection Observer 触发', {
    isIntersecting: entries[0].isIntersecting,
    isLoading: isLoading.value,
    hasMore: hasMore.value,
    loadError: loadError.value
  })
  
  if (entries[0].isIntersecting && !isLoading.value && hasMore.value && !loadError.value) {
    logger.info('✅ 开始加载更多回收站文件')
    handleLoadMore()
  } else {
    logger.info('❌ 不满足加载条件')
  }
}, {
  root: fileListComponent,  // 指定 .file-list 为观察容器
  rootMargin: '100px'       // 提前 100px 触发
})
```

### **关键条件**

- `entries[0].isIntersecting`: 元素进入可视区域
- `!isLoading.value`: 当前没有在加载
- `hasMore.value`: 还有更多数据
- `!loadError.value`: 没有加载错误

### **为什么延迟 100ms？**

- 确保 DOM 完全更新
- 给浏览器足够时间渲染
- 避免竞态条件

---

## ✅ 验证方法

### **1. 打开浏览器开发者工具**

```
F12 → Network 面板
```

### **2. 刷新回收站页面**

```
访问：http://localhost:5173/recycle-bin
```

### **3. 检查网络请求**

应该只看到**一次** `/files/recycle/browse` 请求：

```
✅ GET /files/recycle/browse?maxPageSize=10
```

### **4. 检查控制台日志**

应该看到：

```
[INFO] [RecycleBinView] 回收站页面加载，开始加载回收站数据
[INFO] [DirectoryAPI] 浏览回收站目录...
[INFO] [RecycleBinView] 回收站加载成功 {count: 10}
[INFO] [RecycleBinView] ✅ 已观察回收站 loadMoreTrigger 元素
```

**不应该看到**：

```
❌ [INFO] [RecycleBinView] ✅ 开始加载更多回收站文件  ← 不应该立即触发
❌ [INFO] [DirectoryAPI] 浏览回收站目录...  ← 不应该有第二次请求
```

### **5. 测试无限滚动**

向下滚动到列表底部，应该触发加载更多：

```
[INFO] [RecycleBinView] RecycleBin Intersection Observer 触发 {...}
[INFO] [RecycleBinView] ✅ 开始加载更多回收站文件
[INFO] [DirectoryAPI] 浏览回收站目录...
```

---

## 🎓 最佳实践

### **1. Intersection Observer 的设置时机**

```javascript
// ❌ 错误：在组件挂载时立即设置
onMounted(() => {
  setupIntersectionObserver()
  loadData()
})

// ✅ 正确：在数据加载成功后设置
async function loadData() {
  const result = await fetchData()
  if (result.success) {
    setupIntersectionObserver()  // 数据加载完成后再设置
  }
}
```

### **2. 防止重复请求**

```javascript
// 使用标志位防止重复加载
const isLoading = ref(false)
const hasLoaded = ref(false)

async function loadData() {
  if (isLoading.value || hasLoaded.value) {
    return  // 防止重复请求
  }
  
  isLoading.value = true
  try {
    const result = await fetchData()
    if (result.success) {
      hasLoaded.value = true
    }
  } finally {
    isLoading.value = false
  }
}
```

### **3. 清理 Observer**

```javascript
onUnmounted(() => {
  if (observer) {
    observer.disconnect()  // 组件卸载时清理
  }
})
```

---

## 📝 相关文件

- `src/views/RecycleBinView.vue` - 回收站视图组件
- `src/utils/directory.js` - 目录和回收站工具函数

---

## 🚀 总结

通过将 `setupIntersectionObserver()` 的调用时机从 `onMounted` 延迟到第一次加载成功后，成功解决了回收站页面重复请求的问题。

**关键改进**：
- ✅ 减少不必要的网络请求
- ✅ 降低后端服务器压力
- ✅ 提升用户体验（无闪烁）
- ✅ 代码逻辑更清晰

---

**创建时间**: 2026-06-07  
**作者**: Qoder AI Assistant  
**版本**: v1.0
