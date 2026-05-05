# API 配置使用指南

## 概述

本项目采用统一的 API 配置管理，所有后端接口地址都在 `src/config/api.js` 中统一定义。这样可以：

1. **集中管理** - 所有接口地址在一处维护
2. **易于切换** - 更换环境只需修改基础 URL
3. **避免硬编码** - 代码中不使用魔法字符串
4. **类型安全** - 使用常量避免拼写错误

## 配置文件位置

```
src/config/api.js
```

## 基础结构

### 1. 基础 API 地址

```javascript
export const BASE_API_URL = 'http://localhost:8835/api'
```

### 2. 按模块分组

```javascript
// 认证相关接口
export const AUTH_API = {
  RSA_KEY: `${BASE_API_URL}/auth/rsa-key`,
  LOGIN: `${BASE_API_URL}/auth/login`,
  REGISTER: `${BASE_API_URL}/auth/register`,
  // ...更多接口
}

// 用户相关接口
export const USER_API = {
  PROFILE: `${BASE_API_URL}/user/profile`,
  // ...更多接口
}
```

## 使用方法

### 方法一：直接使用预定义的接口常量（推荐）

```javascript
import { AUTH_API } from '@/config/api'

// 登录请求
const response = await fetch(AUTH_API.LOGIN, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(loginData)
})
```

### 方法二：动态拼接接口地址

```javascript
import { BASE_API_URL, createApiUrl } from '@/config/api'

// 方式 1: 手动拼接
const url = `${BASE_API_URL}/file/upload`

// 方式 2: 使用工具函数
const url = createApiUrl(BASE_API_URL, '/file/upload')
```

## 已定义的接口

### 认证接口 (AUTH_API)

| 常量 | 接口地址 | 说明 |
|------|---------|------|
| `RSA_KEY` | `/auth/rsa-key` | 获取 RSA 公钥 |
| `VALIDATE_RSA` | `/auth/is_rsa_valid` | 验证 RSA 密钥 |
| `LOGIN` | `/auth/login` | 用户登录 |
| `REGISTER` | `/auth/register` | 用户注册 |
| `SECURITY_QUESTIONS` | `/auth/security-questions` | 获取安全问题 |

### 用户接口 (USER_API)

| 常量 | 接口地址 | 说明 |
|------|---------|------|
| `PROFILE` | `/user/profile` | 获取用户信息 |
| `UPDATE_PROFILE` | `/user/profile` | 更新用户信息 |
| `CHANGE_PASSWORD` | `/user/password` | 修改密码 |
| `UPLOAD_AVATAR` | `/user/avatar` | 上传头像 |

### 文件接口 (FILE_API)

| 常量 | 接口地址 | 说明 |
|------|---------|------|
| `BROWSE` | `/file/browse` | 浏览文件 |
| `UPLOAD` | `/file/upload` | 上传文件 |
| `DOWNLOAD` | `/file/download` | 下载文件 |
| `DELETE` | `/file/delete` | 删除文件 |
| `CREATE_FOLDER` | `/file/folder` | 创建文件夹 |

### 传输接口 (TRANSFER_API)

| 常量 | 接口地址 | 说明 |
|------|---------|------|
| `LIST` | `/transfer/list` | 获取传输列表 |
| `PAUSE` | `/transfer/pause` | 暂停传输 |
| `RESUME` | `/transfer/resume` | 恢复传输 |
| `CANCEL` | `/transfer/cancel` | 取消传输 |

## 添加新接口

### 步骤 1: 在 api.js 中添加接口定义

```javascript
// src/config/api.js

export const NEW_MODULE_API = {
  // 添加新接口
  ACTION_ONE: `${BASE_API_URL}/new-module/action-one`,
  ACTION_TWO: `${BASE_API_URL}/new-module/action-two`,
}
```

### 步骤 2: 在组件中使用

```javascript
import { NEW_MODULE_API } from '@/config/api'

const response = await fetch(NEW_MODULE_API.ACTION_ONE, {
  method: 'POST',
  // ...其他配置
})
```

## 环境切换

如果需要切换到不同的环境（开发、测试、生产），只需修改 `BASE_API_URL`：

```javascript
// 开发环境
export const BASE_API_URL = 'http://localhost:8835/api'

// 测试环境
// export const BASE_API_URL = 'http://test.example.com/api'

// 生产环境
// export const BASE_API_URL = 'https://api.example.com/api'
```

或者使用环境变量：

```javascript
export const BASE_API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8835/api'
```

然后在 `.env` 文件中配置：

```bash
# .env.development
VITE_API_BASE_URL=http://localhost:8835/api

# .env.production
VITE_API_BASE_URL=https://api.example.com/api
```

## 最佳实践

### ✅ 推荐做法

1. **始终使用常量**
   ```javascript
   // ✅ 好
   fetch(AUTH_API.LOGIN)
   
   // ❌ 不好
   fetch('http://localhost:8835/api/auth/login')
   ```

2. **按模块组织接口**
   ```javascript
   // ✅ 好 - 清晰分类
   AUTH_API.LOGIN
   USER_API.PROFILE
   FILE_API.UPLOAD
   
   // ❌ 不好 - 混在一起
   API.LOGIN
   API.PROFILE
   API.UPLOAD
   ```

3. **使用语义化命名**
   ```javascript
   // ✅ 好 - 一目了然
   AUTH_API.SECURITY_QUESTIONS
   
   // ❌ 不好 - 含义不明
   AUTH_API.Questions
   ```

### ❌ 避免的做法

1. **不要在代码中硬编码 URL**
   ```javascript
   // ❌ 避免
   const url = 'http://localhost:8835/api/auth/login'
   
   // ✅ 使用
   const url = AUTH_API.LOGIN
   ```

2. **不要重复定义接口**
   ```javascript
   // ❌ 避免 - 多处定义相同接口
   const loginUrl = 'http://localhost:8835/api/auth/login'
   
   // ✅ 统一使用 api.js 中的定义
   import { AUTH_API } from '@/config/api'
   ```

## 已更新的文件

以下文件已更新为使用统一的 API 配置：

- ✅ `src/utils/rsa.js` - RSA 相关接口
- ✅ `src/views/LoginView.vue` - 登录接口
- ✅ `src/views/RegisterView.vue` - 注册接口和安全问题接口

## 未来扩展

可以根据项目需要继续添加：

1. **更多模块** - 如订单、支付、消息等
2. **版本控制** - 如 `/api/v1/`, `/api/v2/`
3. **Mock 支持** - 开发时使用 Mock 数据
4. **接口文档生成** - 从配置自动生成 API 文档

---

**最后更新**: 2026-04-27  
**维护者**: 开发团队
