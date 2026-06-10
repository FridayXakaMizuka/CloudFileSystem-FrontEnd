# /files/recycle 接口响应精简说明

## 📋 变更概述

为了优化回收站浏览接口的响应性能，我们精简了 `/files/recycle` 接口的返回字段。移除了部分冗余字段，减少了网络传输数据量。

**变更日期**: 2026-06-10  
**影响接口**: `GET /files/recycle`  
**影响范围**: 回收站列表展示页面

---

## 🔧 字段变更详情

### ❌ 移除的字段

以下字段已从响应中移除：

| 字段名 | 类型 | 原用途 | 移除原因 |
|--------|------|--------|----------|
| `updatedAt` | LocalDateTime | 最后更新时间 | 回收站场景下不关注更新操作 |
| `expiresAt` | LocalDateTime | 过期时间 | 可通过 `deletedAt + 30天` 计算 |
| `daysRemaining` | Integer | 剩余天数 | 前端可根据 `deletedAt` 动态计算 |

### ✅ 保留的字段

| 字段名 | 类型 | 说明 | 备注 |
|--------|------|------|------|
| `batchId` | String | 批次号（UUID） | **已调整到第一位** |
| `id` | Long | 节点ID | - |
| `name` | String | 节点名称 | - |
| `type` | String | 节点类型 | "folder" 或 "file" |
| `size` | Long | 文件大小（字节） | 文件夹为 0 |
| `createdAt` | LocalDateTime | 创建时间 | - |
| `deletedAt` | LocalDateTime | 删除时间 | - |
| `version` | Long | 版本号 | 乐观锁使用 |

### 📊 分页信息（无变化）

```json
{
  "pagination": {
    "lastBatchId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "isEnd": false
  }
}
```

---

## 📝 响应示例对比

### 变更前（旧版）

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "children": [
      {
        "id": 5001,
        "name": "重要文档",
        "type": "folder",
        "size": 0,
        "createdAt": "2026-06-01T10:00:00",
        "updatedAt": "2026-06-01T10:00:00",          // ❌ 已移除
        "deletedAt": "2026-06-10T15:30:00",
        "expiresAt": "2026-07-10T15:30:00",           // ❌ 已移除
        "daysRemaining": 30,                          // ❌ 已移除
        "version": 3,
        "batchId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
      }
    ],
    "pagination": {
      "lastBatchId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "isEnd": false
    }
  }
}
```

### 变更后（新版）✅

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "children": [
      {
        "batchId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",  // ✅ 移到第一位
        "id": 5001,
        "name": "重要文档",
        "type": "folder",
        "size": 0,
        "createdAt": "2026-06-01T10:00:00",
        "deletedAt": "2026-06-10T15:30:00",
        "version": 3
      }
    ],
    "pagination": {
      "lastBatchId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "isEnd": false
    }
  }
}
```

---

## 💻 前端适配指南

### 1️⃣ TypeScript/JavaScript 类型定义更新

#### 旧版类型定义
```typescript
interface RecycleBinItem {
  id: number;
  name: string;
  type: 'folder' | 'file';
  size: number;
  createdAt: string;
  updatedAt: string;        // ❌ 删除此行
  deletedAt: string;
  expiresAt: string;        // ❌ 删除此行
  daysRemaining: number;    // ❌ 删除此行
  version: number;
  batchId: string;
}
```

#### 新版类型定义 ✅
```typescript
interface RecycleBinItem {
  batchId: string;          // ✅ 移到第一位
  id: number;
  name: string;
  type: 'folder' | 'folder' | 'file';
  size: number;
  createdAt: string;
  deletedAt: string;
  version: number;
}
```

### 2️⃣ 计算剩余天数（如需要显示）

如果前端仍需要显示"剩余天数"，可以根据 `deletedAt` 动态计算：

```typescript
/**
 * 计算回收站项目剩余天数
 * @param deletedAt 删除时间（ISO 8601 格式）
 * @returns 剩余天数（最多30天）
 */
function calculateDaysRemaining(deletedAt: string): number {
  const deleteTime = new Date(deletedAt).getTime();
  const expireTime = deleteTime + (30 * 24 * 60 * 60 * 1000); // 30天后过期
  const now = Date.now();
  
  const remainingMs = expireTime - now;
  const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
  
  return Math.max(0, remainingDays); // 最少为0
}

// 使用示例
const item: RecycleBinItem = {
  batchId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  id: 5001,
  name: "重要文档",
  type: "folder",
  size: 0,
  createdAt: "2026-06-01T10:00:00",
  deletedAt: "2026-06-10T15:30:00",
  version: 3
};

const daysRemaining = calculateDaysRemaining(item.deletedAt);
console.log(`剩余 ${daysRemaining} 天`); // 输出: 剩余 30 天
```

### 3️⃣ React/Vue 组件适配示例

#### React 示例
```tsx
import React from 'react';

interface RecycleBinItem {
  batchId: string;
  id: number;
  name: string;
  type: 'folder' | 'file';
  size: number;
  createdAt: string;
  deletedAt: string;
  version: number;
}

const RecycleBinItemCard: React.FC<{ item: RecycleBinItem }> = ({ item }) => {
  // 如果需要显示剩余天数，动态计算
  const daysRemaining = React.useMemo(() => {
    const deleteTime = new Date(item.deletedAt).getTime();
    const expireTime = deleteTime + (30 * 24 * 60 * 60 * 1000);
    const now = Date.now();
    const remainingMs = expireTime - now;
    return Math.max(0, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)));
  }, [item.deletedAt]);

  return (
    <div className="recycle-item">
      <div className="item-header">
        <span className="item-name">{item.name}</span>
        <span className="item-type">{item.type === 'folder' ? '📁' : '📄'}</span>
      </div>
      <div className="item-info">
        <span>删除时间: {new Date(item.deletedAt).toLocaleString()}</span>
        {/* 如果需要显示剩余天数 */}
        <span className="days-remaining">剩余 {daysRemaining} 天</span>
      </div>
      <button onClick={() => handleRestore(item.batchId)}>恢复</button>
      <button onClick={() => handlePermanentDelete(item.batchId)}>彻底删除</button>
    </div>
  );
};
```

#### Vue 3 示例
```vue
<template>
  <div class="recycle-item">
    <div class="item-header">
      <span class="item-name">{{ item.name }}</span>
      <span class="item-type">{{ item.type === 'folder' ? '📁' : '📄' }}</span>
    </div>
    <div class="item-info">
      <span>删除时间: {{ formatDate(item.deletedAt) }}</span>
      <!-- 如果需要显示剩余天数 -->
      <span class="days-remaining">剩余 {{ daysRemaining }} 天</span>
    </div>
    <button @click="handleRestore(item.batchId)">恢复</button>
    <button @click="handlePermanentDelete(item.batchId)">彻底删除</button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface RecycleBinItem {
  batchId: string;
  id: number;
  name: string;
  type: 'folder' | 'file';
  size: number;
  createdAt: string;
  deletedAt: string;
  version: number;
}

const props = defineProps<{
  item: RecycleBinItem;
}>();

// 计算剩余天数
const daysRemaining = computed(() => {
  const deleteTime = new Date(props.item.deletedAt).getTime();
  const expireTime = deleteTime + (30 * 24 * 60 * 60 * 1000);
  const now = Date.now();
  const remainingMs = expireTime - now;
  return Math.max(0, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)));
});

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-CN');
};

const handleRestore = (batchId: string) => {
  // 恢复逻辑
};

const handlePermanentDelete = (batchId: string) => {
  // 彻底删除逻辑
};
</script>
```

### 4️⃣ API 调用代码更新

#### Axios 请求示例
```typescript
import axios from 'axios';

interface RecycleBinResponse {
  code: number;
  message: string;
  data: {
    children: RecycleBinItem[];
    pagination: {
      lastBatchId: string | null;
      isEnd: boolean;
    };
  };
}

interface RecycleBinItem {
  batchId: string;
  id: number;
  name: string;
  type: 'folder' | 'file';
  size: number;
  createdAt: string;
  deletedAt: string;
  version: number;
}

/**
 * 获取回收站列表
 * @param maxPageSize 每页数量
 * @param lastBatchId 游标锚点
 */
export async function getRecycleBinList(
  maxPageSize: number = 20,
  lastBatchId?: string
): Promise<RecycleBinResponse> {
  const response = await axios.get('/files/recycle', {
    params: {
      maxPageSize,
      ...(lastBatchId && { lastBatchId }),
    },
  });
  
  return response.data;
}

// 使用示例
const loadRecycleBin = async () => {
  try {
    const result = await getRecycleBinList(20);
    
    // 注意：不再访问 removedFields
    result.data.children.forEach(item => {
      console.log(item.batchId);    // ✅ 正常访问
      console.log(item.id);         // ✅ 正常访问
      console.log(item.name);       // ✅ 正常访问
      // console.log(item.expiresAt);  // ❌ 字段不存在
      // console.log(item.daysRemaining); // ❌ 字段不存在
    });
    
    // 如果需要剩余天数，动态计算
    result.data.children.forEach(item => {
      const daysRemaining = calculateDaysRemaining(item.deletedAt);
      console.log(`剩余 ${daysRemaining} 天`);
    });
    
  } catch (error) {
    console.error('加载回收站失败:', error);
  }
};
```

---

## ⚠️ 注意事项

### 1. 兼容性处理

如果前端代码中仍在使用已移除的字段，会出现 `undefined` 错误。建议：

- **方案 A（推荐）**: 全局搜索并替换所有引用
  ```bash
  # 在项目根目录执行
  grep -r "expiresAt" src/
  grep -r "daysRemaining" src/
  grep -r "updatedAt" src/
  ```

- **方案 B（临时兼容）**: 在接收数据后补充字段
  ```typescript
  // 临时兼容层（不推荐长期使用）
  function normalizeRecycleBinItem(item: any): RecycleBinItem {
    return {
      ...item,
      updatedAt: item.createdAt, // 用 createdAt 替代
      expiresAt: new Date(new Date(item.deletedAt).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      daysRemaining: calculateDaysRemaining(item.deletedAt),
    };
  }
  ```

### 2. 缓存清理

如果前端使用了本地缓存（如 localStorage、IndexedDB），需要清理旧数据：

```typescript
// 清理旧的回收站缓存
localStorage.removeItem('recycleBinCache');
// 或者增加缓存版本号
const CACHE_VERSION = 'v2'; // 从 v1 升级到 v2
```

### 3. 测试检查清单

- [ ] 回收站列表能正常加载
- [ ] 分页功能正常工作（加载更多）
- [ ] 恢复功能正常（使用 batchId）
- [ ] 彻底删除功能正常（使用 batchId）
- [ ] 如果显示了剩余天数，计算是否正确
- [ ] 空回收站状态显示正常
- [ ] 错误处理是否正常

---

## 🎯 优势说明

### 性能提升

1. **减少网络传输**: 每个项目减少约 50-80 字节
   - 假设每页 20 个项目，可减少 ~1-1.6 KB
   
2. **简化数据结构**: 字段更少，解析更快

3. **降低 Redis 存储**: 元数据层 Hash 减少 3 个字段

### 维护性提升

1. **单一数据源**: `daysRemaining` 由前端动态计算，避免前后端不一致
2. **灵活性增强**: 前端可根据需求自定义计算逻辑（如显示"即将过期"标签）

---

## 📞 联系方式

如有问题，请联系后端开发团队。

**文档版本**: v1.0  
**最后更新**: 2026-06-10
