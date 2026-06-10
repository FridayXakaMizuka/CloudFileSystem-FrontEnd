# 回收站浏览 API Redis 优化前端适配说明

## 📋 修改概述

根据 `RECYCLE_BIN_BROWSE_REDIS_FRONTEND_GUIDE.md` 文档，前端已完成回收站浏览 API 的适配，以支持后端 Redis 优化。

**核心变更：**
- ✅ API 路径从 `/files/recycle` 改为 `/files/recycle/browse`
- ✅ 游标参数从 `lastChildrenNode/lastChildrenType` 改为 `lastBatchId`
- ✅ 移除 `currentNodeId`、`sortedBy`、`order` 参数（后端 Redis 已处理排序）
- ✅ 默认每页数量从 50 改为 20
- ✅ 响应数据结构保持兼容（`children` 和 `pagination`）

---

## 🔧 主要修改

### 1. browseRecycleBin 函数

**文件**: `src/utils/directory.js` - L429

#### 修改前

```javascript
export async function browseRecycleBin(params) {
  const {
    currentNodeId,        // ❌ 移除
    maxPageSize = 50,     // ❌ 默认值 50
    lastChildrenNode = null,   // ❌ 旧游标
    lastChildrenType = null,   // ❌ 旧游标类型
    sortedBy = 0,         // ❌ 移除（Redis 已处理）
    order = 0             // ❌ 移除（Redis 已处理）
  } = params

  const queryParams = new URLSearchParams({
    currentNodeId: currentNodeId.toString(),  // ❌ 移除
    maxPageSize: maxPageSize.toString(),
    sortedBy: sortedBy.toString(),            // ❌ 移除
    order: order.toString()                   // ❌ 移除
  })

  if (lastChildrenNode !== null && lastChildrenNode !== undefined) {
    queryParams.append('lastChildrenNode', lastChildrenNode.toString())  // ❌ 移除
  }
  
  if (lastChildrenType) {
    queryParams.append('lastChildrenType', lastChildrenType)  // ❌ 移除
  }

  const url = `${BASE_API_URL}/files/recycle?${queryParams.toString()}`  // ❌ 旧路径
}
```

#### 修改后

```javascript
export async function browseRecycleBin(params) {
  const {
    maxPageSize = 20,     // ✅ 默认值 20
    lastBatchId = null    // ✅ 新游标
  } = params

  const queryParams = new URLSearchParams({
    maxPageSize: maxPageSize.toString()
  })

  // ✅ 添加可选参数：游标锚点
  if (lastBatchId) {
    queryParams.append('lastBatchId', lastBatchId)
  }

  const url = `${BASE_API_URL}/files/recycle/browse?${queryParams.toString()}`  // ✅ 新路径
}
```

---

### 2. initRecycleBinBrowse 函数

**文件**: `src/utils/directory.js` - L512

#### 修改前

```javascript
export async function initRecycleBinBrowse(maxPageSize = 50) {
  recycleBinState.reset()
  
  // ❌ 检查回收站ID
  const recycleBinId = getRecycleBinId()
  if (!recycleBinId) {
    logger.error('回收站ID为空')
    return { success: false, message: '回收站ID为空，请重新登录' }
  }

  recycleBinState.isLoading = true

  try {
    const result = await browseRecycleBin({
      currentNodeId: recycleBinId,  // ❌ 移除
      maxPageSize,
      sortedBy: recycleBinState.sortedBy,  // ❌ 移除
      order: recycleBinState.order          // ❌ 移除
    })

    if (result.success) {
      const pagination = result.data.pagination
      recycleBinState.updateCursor(
        pagination.lastChildrenNode,   // ❌ 旧游标
        pagination.lastChildrenType,   // ❌ 旧游标类型
        pagination.isEnd
      )
      // ...
    }
  }
}
```

#### 修改后

```javascript
export async function initRecycleBinBrowse(maxPageSize = 20) {
  recycleBinState.reset()

  recycleBinState.isLoading = true

  try {
    const result = await browseRecycleBin({
      maxPageSize  // ✅ 只传 maxPageSize
    })

    if (result.success) {
      const pagination = result.data.pagination
      recycleBinState.updateCursor(
        pagination.lastBatchId,  // ✅ 使用 lastBatchId
        null,                     // ✅ nodeType 不再需要
        pagination.isEnd
      )
      // ...
    }
  }
}
```

---

### 3. loadMoreRecycleBinFiles 函数

**文件**: `src/utils/directory.js` - L578

#### 修改前

```javascript
export async function loadMoreRecycleBinFiles(maxPageSize = 50) {
  const state = recycleBinState.getState()
  
  if (state.isLoading || !state.hasMore) {
    return { success: false, message: '...' }
  }

  // ❌ 检查回收站ID
  const recycleBinId = getRecycleBinId()
  if (!recycleBinId) {
    logger.error('回收站ID为空')
    return { success: false, message: '回收站ID为空' }
  }

  recycleBinState.isLoading = true

  try {
    const result = await browseRecycleBin({
      currentNodeId: recycleBinId,           // ❌ 移除
      maxPageSize,
      lastChildrenNode: state.lastChildrenNode,  // ❌ 旧游标
      lastChildrenType: state.lastChildrenType,  // ❌ 旧游标类型
      sortedBy: state.sortedBy,              // ❌ 移除
      order: state.order                      // ❌ 移除
    })

    if (result.success) {
      const pagination = result.data.pagination
      recycleBinState.updateCursor(
        pagination.lastChildrenNode,   // ❌ 旧游标
        pagination.lastChildrenType,   // ❌ 旧游标类型
        pagination.isEnd
      )
      // ...
    }
  }
}
```

#### 修改后

```javascript
export async function loadMoreRecycleBinFiles(maxPageSize = 20) {
  const state = recycleBinState.getState()
  
  if (state.isLoading || !state.hasMore) {
    return { success: false, message: '...' }
  }

  recycleBinState.isLoading = true

  try {
    const result = await browseRecycleBin({
      maxPageSize,
      lastBatchId: state.lastChildrenNode  // ✅ 使用 lastBatchId 作为游标
    })

    if (result.success) {
      const pagination = result.data.pagination
      recycleBinState.updateCursor(
        pagination.lastBatchId,  // ✅ 使用 lastBatchId
        null,                     // ✅ nodeType 不再需要
        pagination.isEnd
      )
      // ...
    }
  }
}
```

---

## 📊 对比总结

| 项目 | 修改前 | 修改后 | 说明 |
|------|--------|--------|------|
| **API 路径** | `/files/recycle` | `/files/recycle/browse` | 符合 RESTful 规范 |
| **默认每页数量** | 50 | 20 | 与文档保持一致 |
| **currentNodeId** | ✅ 必需 | ❌ 移除 | 后端从 JWT 获取用户ID |
| **sortedBy** | ✅ 可选 | ❌ 移除 | Redis 已按删除时间排序 |
| **order** | ✅ 可选 | ❌ 移除 | Redis 固定降序 |
| **lastChildrenNode** | ✅ 游标 | ❌ 移除 | 改用 lastBatchId |
| **lastChildrenType** | ✅ 游标类型 | ❌ 移除 | 不再需要 |
| **lastBatchId** | ❌ 不存在 | ✅ 新游标 | UUID 格式的批次号 |

---

## ✅ 兼容性说明

### 响应数据结构（保持不变）

```json
{
  "code": 200,
  "success": true,
  "message": "操作成功",
  "data": {
    "children": [
      {
        "id": 12345,
        "name": "我的文档",
        "type": "folder",
        "size": 0,
        "createdAt": "2024-06-07T10:00:00",
        "updatedAt": "2024-06-07T10:00:00",
        "deletedAt": "2024-06-07T10:00:00",
        "expiresAt": "2024-07-07T10:00:00",
        "daysRemaining": 30,
        "version": 1,
        "batchId": "550e8400-e29b-41d4-a716-446655440000"
      }
    ],
    "pagination": {
      "lastBatchId": "550e8400-e29b-41d4-a716-446655440000",
      "isEnd": false
    }
  }
}
```

**关键点**：
- ✅ `children` 数组结构不变
- ✅ `pagination.lastBatchId` 字段已存在（之前可能未使用）
- ✅ 所有业务字段保持不变
- ✅ 前端 UI 层无需修改

---

## 🎯 性能提升

根据文档，后端 Redis 优化带来的性能提升：

| 指标 | 优化前（MySQL） | 优化后（Redis） | 提升倍数 |
|------|----------------|----------------|----------|
| 平均响应时间 | 50-200ms | 5-10ms | **10-20x** |
| P95 响应时间 | 300ms | 20ms | **15x** |
| 并发支撑（QPS） | 500-1000 | 10000+ | **20x** |
| 数据库负载 | 高 | 低 | **10x 降低** |

---

## 🧪 测试建议

### 1. 功能测试

- [ ] 首次加载回收站列表（不传 `lastBatchId`）
- [ ] 加载更多（传入 `lastBatchId`）
- [ ] 最后一页检测（`isEnd: true`）
- [ ] 空回收站处理
- [ ] 网络错误处理

### 2. 性能测试

- [ ] 测量首次加载时间（应 < 50ms）
- [ ] 测量加载更多时间（应 < 50ms）
- [ ] 观察浏览器 Network 面板的响应时间

### 3. 兼容性测试

- [ ] Chrome / Edge
- [ ] Firefox
- [ ] Safari
- [ ] 移动端浏览器

---

## 📝 注意事项

### 1. 游标分页特性

- ❌ **不要缓存 `lastBatchId`**，每次翻页都使用上一次响应中的值
- ✅ **首次请求不传 `lastBatchId`**，从第一页开始
- ✅ **检查 `isEnd` 字段**，判断是否还有更多数据

### 2. 错误处理

- 如果 Redis 不可用，后端会自动降级到 MySQL
- 前端无需特殊处理，响应格式保持一致
- 建议添加重试机制（最多 3 次）

### 3. 调试技巧

**浏览器开发者工具**：
- 打开 Network 面板
- 过滤 `/files/recycle/browse` 请求
- 查看响应时间和数据结构

**预期日志**：
```
[INFO] [DirectoryAPI] 请求浏览回收站: { url: '/files/recycle/browse?maxPageSize=20', params: { maxPageSize: 20, lastBatchId: null } }
[INFO] [DirectoryAPI] 浏览回收站响应: { code: 200, success: true, data: { children: [...], pagination: {...} } }
```

---

## 🔗 相关文档

- [RECYCLE_BIN_BROWSE_REDIS_FRONTEND_GUIDE.md](file://C:\Users\ROG\Desktop\develop\FrontEnd\CloudFileSystem\RECYCLE_BIN_BROWSE_REDIS_FRONTEND_GUIDE.md) - 完整的 Redis 优化指南
- [FRONTEND_API_GUIDE.md](file://C:\Users\ROG\Desktop\develop\FrontEnd\CloudFileSystem\FRONTEND_API_GUIDE.md) - 前端 API 接口文档

---

## ✅ 修改完成清单

- [x] 修改 `browseRecycleBin` 函数（API 路径和参数）
- [x] 修改 `initRecycleBinBrowse` 函数（移除 nodeId 检查）
- [x] 修改 `loadMoreRecycleBinFiles` 函数（使用 lastBatchId）
- [x] 验证无编译错误
- [x] 创建适配说明文档

---

**修改日期**: 2026-06-07  
**修改人员**: AI Assistant  
**影响范围**: 回收站浏览功能  
**测试状态**: 待前端重新编译后测试
