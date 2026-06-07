# 恢复接口路径修复说明

## 🐛 问题描述

前端在发送还原请求时出现 404 错误：

```
POST https://192.168.31.44:2311/recycle/restore?batchId=67d584b7-8a48-486f-a4b9-e552952aadcf&version=1 
net::ERR_ABORTED 404 (Not Found)
```

**症状**：
- 前端发送请求到 `/recycle/restore`
- 后端返回 404 Not Found
- 后端没有任何日志输出（说明路由未匹配）

---

## 🔍 问题原因

**接口路径不一致**：前端配置的 API 路径与后端实际实现的路径不匹配。

### 对比分析

| 来源 | 接口路径 | 状态 |
|------|---------|------|
| **后端实际实现** | `POST /files/recycle/restore` | ✅ 正确 |
| **前端配置 (修复前)** | `POST /recycle/restore` | ❌ 错误 |
| **FRONTEND_API_GUIDE.md (修复前)** | `POST /recycle/restore` | ❌ 错误 |
| **RECYCLE_BIN_RESTORE_AND_PERMANENT_DELETE_API.md (修复前)** | `POST /recycle/restore` | ❌ 错误 |
| **RESTORE_PROCESS_BACKEND_GUIDE.md** | `POST /files/recycle/restore` | ✅ 正确 |

**根本原因**：
- 大部分文档和前端配置使用了 `/recycle/restore`（缺少 `/files` 前缀）
- 只有 `RESTORE_PROCESS_BACKEND_GUIDE.md` 正确使用了 `/files/recycle/restore`
- 后端 Controller 实际注册的路由是 `/files/recycle/restore`

---

## ✅ 修复方案

### 1. 修改前端 API 配置

**文件**: `src/config/api.js`

```diff
-  //恢复文件/文件夹 (POST /recycle/restore?batchId=&version=)
-  RESTORE: `${BASE_API_URL}/recycle/restore`,
+  //恢复文件/文件夹 (POST /files/recycle/restore?batchId=&version=)
+  RESTORE: `${BASE_API_URL}/files/recycle/restore`,
```

**位置**: L100-101

### 2. 同步更新文档

#### FRONTEND_API_GUIDE.md

```diff
- **接口**: `POST /recycle/restore`
+ **接口**: `POST /files/recycle/restore`
```

**位置**: L348

#### RECYCLE_BIN_RESTORE_AND_PERMANENT_DELETE_API.md

```diff
- **接口**: `POST /recycle/restore`
+ **接口**: `POST /files/recycle/restore`

- curl -X POST "http://localhost:8835/recycle/restore?batchId=this-is-a-UUID1&version=2" \
+ curl -X POST "http://localhost:8835/files/recycle/restore?batchId=this-is-a-UUID1&version=2" \
```

**位置**: L51, L76

#### RECYCLE_BIN_BACKEND_IMPLEMENTATION_GUIDE.md

```diff
- **接口**: `POST /recycle/restore`
+ **接口**: `POST /files/recycle/restore`
```

**位置**: L307

---

## 📋 修复后的完整接口信息

### 恢复节点接口

**接口**: `POST /files/recycle/restore`

**功能**: 从回收站恢复文件或文件夹到原位置或用户根目录

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `batchId` | String | ✅ | 业务操作批次号（UUID格式，从浏览回收站接口获取） |
| `version` | Long | ✅ | 乐观锁版本号（从浏览回收站接口获取） |

**请求示例**:

```bash
curl -X POST "http://localhost:8835/files/recycle/restore?batchId=67d584b7-8a48-486f-a4b9-e552952aadcf&version=1" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

**前端调用示例**:

```javascript
import { FILE_API } from '@/config/api'

// FILE_API.RESTORE = '/files/recycle/restore' (已修复)

const queryParams = new URLSearchParams({
  batchId: '67d584b7-8a48-486f-a4b9-e552952aadcf',
  version: '1'
})

const url = `${FILE_API.RESTORE}?${queryParams.toString()}`
// 结果: /files/recycle/restore?batchId=...&version=...

const response = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
})
```

---

## 🧪 验证步骤

### 1. 检查前端配置

```bash
# 查看 api.js 中的 RESTORE 配置
grep -n "RESTORE:" src/config/api.js
```

**预期输出**:
```
101:  RESTORE: `${BASE_API_URL}/files/recycle/restore`,
104:  RESTORE_PROCESSES: `${BASE_API_URL}/files/recycle/restore/processes`,
```

### 2. 测试恢复功能

1. 打开浏览器开发者工具（F12）
2. 切换到 Network 标签
3. 在回收站页面点击"还原"按钮
4. 观察请求 URL

**预期结果**:
```
Request URL: https://192.168.31.44:2311/files/recycle/restore?batchId=...&version=...
Status Code: 200 OK (或其他成功状态码)
```

**不应该再出现**:
```
❌ Request URL: .../recycle/restore (缺少 /files)
❌ Status Code: 404 Not Found
```

### 3. 检查后端日志

后端应该能够接收到请求并输出日志：

```
[INFO] 收到恢复节点请求: batchId=67d584b7-8a48-486f-a4b9-e552952aadcf, version=1
[INFO] 开始异步恢复任务...
```

---

## 🎯 相关接口路径规范

为了保持一致性，所有文件相关的接口都应该以 `/files` 为前缀：

| 功能 | 接口路径 | 方法 |
|------|---------|------|
| 浏览目录 | `/files/browse` | GET |
| 浏览回收站 | `/files/recycle` | GET |
| 搜索文件 | `/files/search` | GET |
| 搜索回收站 | `/files/recycle/search` | GET |
| 创建文件夹 | `/files/folder` | POST |
| 删除节点 | `/files/delete` | DELETE |
| 彻底删除 | `/files/delete/permanent` | DELETE |
| **恢复节点** | **`/files/recycle/restore`** | **POST** |
| 获取恢复进程 | `/files/recycle/restore/processes` | GET |

**注意**: 
- ✅ 所有文件操作都在 `/files` 命名空间下
- ❌ 不要使用 `/recycle/restore`（缺少 `/files` 前缀）
- ❌ 不要使用 `/api/recycle/restore`（多余的 `/api` 前缀）

---

## 📝 经验教训

### 1. 接口路径规范

**建议**：
- 建立统一的 API 路径规范文档
- 所有接口按功能模块分组（如 `/files/*`, `/auth/*`, `/profile/*`）
- 前端和后端共享同一份接口定义（可使用 OpenAPI/Swagger）

### 2. 文档同步

**问题**：
- 多个文档中存在不一致的接口路径
- 文档更新不及时，导致开发人员困惑

**改进**：
- 使用单一事实来源（Single Source of Truth）
- 文档自动化生成（从代码注释或 Swagger 注解）
- 定期审查和更新文档

### 3. 前端配置管理

**最佳实践**：
- 所有 API 路径集中管理（如 `src/config/api.js`）
- 使用常量而不是硬编码字符串
- 添加注释说明完整的请求格式

```javascript
// ✅ 好的做法
export const FILE_API = {
  RESTORE: `${BASE_API_URL}/files/recycle/restore`  // POST /files/recycle/restore?batchId=&version=
}

// ❌ 不好的做法
fetch('/recycle/restore')  // 硬编码，容易出错
```

### 4. 测试覆盖

**建议添加**：
- API 路径单元测试
- 集成测试验证前后端连通性
- E2E 测试覆盖关键业务流程

---

## 🔗 相关文件

### 前端文件
- `src/config/api.js` - API 配置（L101）
- `src/utils/directory.js` - 恢复函数实现（L1091）
- `src/views/RecycleBinView.vue` - 回收站视图（L466）

### 文档文件
- `FRONTEND_API_GUIDE.md` - 前端接口指南（L348）
- `RECYCLE_BIN_RESTORE_AND_PERMANENT_DELETE_API.md` - 恢复和彻底删除文档（L51）
- `RECYCLE_BIN_BACKEND_IMPLEMENTATION_GUIDE.md` - 后端实现指南（L307）
- `RESTORE_PROCESS_BACKEND_GUIDE.md` - 恢复进程文档（L28）✅ 正确

---

## ✅ 修复完成清单

- [x] 修复 `src/config/api.js` 中的 RESTORE 路径
- [x] 更新 `FRONTEND_API_GUIDE.md` 文档
- [x] 更新 `RECYCLE_BIN_RESTORE_AND_PERMANENT_DELETE_API.md` 文档
- [x] 更新 `RECYCLE_BIN_BACKEND_IMPLEMENTATION_GUIDE.md` 文档
- [x] 验证无编译错误
- [x] 创建修复说明文档

---

**修复日期**: 2026-06-07  
**修复人员**: AI Assistant  
**影响范围**: 恢复节点功能  
**测试状态**: 待前端重新编译后测试
