# 用户目录ID字段集成测试指南

## 📋 测试概述

本文档说明如何测试前端对 `homeDirectoryId` 和 `recycleBinId` 字段的集成。

---

## ✅ 已完成的修改

### 1. LoginView.vue
**文件位置**: `src/views/LoginView.vue`

**修改内容**:
```javascript
// 登录成功时保存目录ID
const userInfo = {
  userId: result.userId,
  nickname: result.nickname,
  userType: result.userType,
  homeDirectory: result.homeDirectory,
  homeDirectoryId: result.homeDirectoryId,  // ✅ 新增
  recycleBinId: result.recycleBinId         // ✅ 新增
}
```

### 2. TwoFactorAuthView.vue
**文件位置**: `src/views/TwoFactorAuthView.vue`

**修改内容**:
```javascript
// 二次验证成功时保存目录ID
saveAuthInfo(result.token, {
  userId: userInfo.value.userId,
  userType: result.userType,
  homeDirectory: result.homeDirectory,
  homeDirectoryId: result.homeDirectoryId,  // ✅ 新增
  recycleBinId: result.recycleBinId         // ✅ 新增
})
```

### 3. userInfo.js
**文件位置**: `src/utils/userInfo.js`

**修改内容**:
- 在 `fetchAllUserInfo()` 中添加字段解析
- 新增 `getHomeDirectoryId()` 辅助函数
- 新增 `getRecycleBinId()` 辅助函数

```javascript
// 构建用户信息对象
const userInfo = {
  avatar: data.avatar || '',
  nickname: data.nickname || '',
  email: data.email || '',
  phone: data.phone || '',
  securityQuestion: data.securityQuestion || '',
  homeDirectoryId: data.homeDirectoryId || null,  // ✅ 新增
  recycleBinId: data.recycleBinId || null,        // ✅ 新增
  storageUsed: ...,
  storageTotal: ...
}

// 新增辅助函数
export const getHomeDirectoryId = () => { ... }
export const getRecycleBinId = () => { ... }
```

---

## 🧪 测试步骤

### 测试1：普通用户登录（无需二次验证）

#### 步骤：
1. 启动前端应用
2. 打开浏览器控制台（F12）
3. 进入登录页面
4. 输入信任设备的账号密码
5. 点击登录

#### 预期结果：
```javascript
// 控制台日志应该显示：
[LoginView] 登录响应: {
  code: 200,
  success: true,
  requiresTwoFactor: false,
  token: "eyJhbGc...",
  userId: "10001",
  homeDirectoryId: 456,    // ✅ 应该有这个字段
  recycleBinId: 789,       // ✅ 应该有这个字段
  ...
}

// localStorage 中应该保存：
localStorage.getItem('user_info')
// 返回：
{
  "userId": "10001",
  "nickname": "...",
  "userType": "user",
  "homeDirectory": "...",
  "homeDirectoryId": 456,    // ✅ 已保存
  "recycleBinId": 789        // ✅ 已保存
}

// sessionStorage 中应该缓存：
sessionStorage.getItem('user_info_cache')
// 返回：
{
  "avatar": "...",
  "nickname": "...",
  "email": "...",
  "phone": "...",
  "homeDirectoryId": 456,    // ✅ 已缓存
  "recycleBinId": 789,       // ✅ 已缓存
  "storageUsed": "...",
  "storageTotal": "..."
}
```

#### 验证代码：
```javascript
// 在浏览器控制台中运行：
import { getHomeDirectoryId, getRecycleBinId } from '@/utils/userInfo'

console.log('根目录ID:', getHomeDirectoryId())   // 应该输出: 456
console.log('回收站ID:', getRecycleBinId())      // 应该输出: 789
```

---

### 测试2：需要二次验证的登录

#### 步骤：
1. 使用需要二次验证的账号登录
2. 观察是否跳转到二次验证页面
3. 选择验证方式（邮箱/手机/密保问题）
4. 完成验证

#### 预期结果：
```javascript
// 登录响应（需要二次验证）：
{
  code: 200,
  success: true,
  requiresTwoFactor: true,
  userId: "10001",
  email: "u***@example.com",
  phone: "138****8000",
  securityQuestion: "你的出生地是？"
  // ⚠️ 注意：此时没有 homeDirectoryId 和 recycleBinId
}

// 二次验证成功后：
[TwoFactorAuthView] 验证成功响应: {
  code: 200,
  success: true,
  token: "eyJhbGc...",
  userId: 10001,
  homeDirectoryId: 456,    // ✅ 应该有这个字段
  recycleBinId: 789,       // ✅ 应该有这个字段
  expiresAt: "2024-01-08T00:00:00"
}

// localStorage 和 sessionStorage 中应该保存目录ID（同测试1）
```

---

### 测试3：从个人资料接口获取目录ID

#### 步骤：
1. 登录后进入个人信息页面
2. 打开浏览器控制台
3. 观察 `/api/profile/get_all` 请求

#### 预期结果：
```javascript
// 请求响应：
{
  code: 200,
  success: true,
  message: "获取成功（来自缓存）",
  data: {
    avatar: "/avatars/123.jpg",
    nickname: "用户昵称",
    email: "u***@example.com",
    phone: "138****8000",
    securityQuestion: "你的出生地是？",
    storageQuota: 10737418240,
    storageUsed: 1073741824,
    homeDirectoryId: 456,    // ✅ 应该有这个字段
    recycleBinId: 789        // ✅ 应该有这个字段
  }
}

// sessionStorage 缓存应该包含这两个字段
```

---

### 测试4：辅助函数测试

#### 步骤：
1. 确保已经登录
2. 在浏览器控制台中运行以下代码

#### 测试代码：
```javascript
// 导入辅助函数
import { 
  getHomeDirectoryId, 
  getRecycleBinId,
  getCachedUserInfo 
} from '@/utils/userInfo'

// 测试1：获取根目录ID
const homeDirId = getHomeDirectoryId()
console.log('根目录ID:', homeDirId)
console.assert(homeDirId !== null, '根目录ID不应为null')

// 测试2：获取回收站ID
const recycleBinId = getRecycleBinId()
console.log('回收站ID:', recycleBinId)
console.assert(recycleBinId !== null, '回收站ID不应为null')

// 测试3：检查缓存完整性
const cached = getCachedUserInfo()
console.log('完整缓存数据:', cached)
console.assert(cached.homeDirectoryId === homeDirId, '缓存中的根目录ID应一致')
console.assert(cached.recycleBinId === recycleBinId, '缓存中的回收站ID应一致')

// 测试4：检查localStorage
const localUserInfo = JSON.parse(localStorage.getItem('user_info'))
console.log('localStorage中的用户信息:', localUserInfo)
console.assert(localUserInfo.homeDirectoryId === homeDirId, 'localStorage中的根目录ID应一致')
console.assert(localUserInfo.recycleBinId === recycleBinId, 'localStorage中的回收站ID应一致')

console.log('✅ 所有测试通过！')
```

---

## 🔍 调试技巧

### 1. 检查后端响应
```javascript
// 在 Network 面板中查看：
// - POST /auth/login 的响应
// - POST /auth/verify/email 的响应
// - POST /api/profile/get_all 的响应

// 确认响应中包含：
{
  "homeDirectoryId": 456,
  "recycleBinId": 789
}
```

### 2. 检查存储
```javascript
// 在 Console 面板中运行：
console.log('localStorage user_info:', localStorage.getItem('user_info'))
console.log('sessionStorage cache:', sessionStorage.getItem('user_info_cache'))
```

### 3. 检查日志
```javascript
// 在 Console 面板中过滤日志：
// 输入 "UserInfoManager" 查看用户信息管理相关日志
// 输入 "LoginView" 查看登录相关日志
// 输入 "TwoFactorAuth" 查看二次验证相关日志
```

---

## ⚠️ 常见问题

### 问题1：目录ID为null
**原因**：
- 后端尚未返回这些字段
- 数据库中没有对应的目录记录
- 管理员用户（userId < 10001）

**解决方案**：
```javascript
// 前端应该处理null值
const homeDirId = getHomeDirectoryId()
if (homeDirId) {
  // 正常使用
  navigateToFileManager(homeDirId)
} else {
  // 提示用户或调用初始化接口
  console.warn('您的账户尚未初始化，请联系管理员')
}
```

### 问题2：缓存未更新
**原因**：
- 登录后未调用 `fetchAllUserInfo()`
- sessionStorage 被清除

**解决方案**：
```javascript
// 确保登录后获取最新信息
await fetchAllUserInfo()

// 或者强制刷新
await getUserInfo(true)
```

### 问题3：字段名不一致
**原因**：
- 后端返回的字段名与前端期望不一致

**解决方案**：
```javascript
// 检查后端实际返回的字段名
console.log('后端响应数据:', result)

// 可能需要调整字段映射
homeDirectoryId: data.homeDirectoryId || data.home_directory_id || null
```

---

## 📊 测试检查清单

- [ ] 登录接口返回 `homeDirectoryId` 和 `recycleBinId`
- [ ] 二次验证接口返回 `homeDirectoryId` 和 `recycleBinId`
- [ ] 个人资料接口返回 `homeDirectoryId` 和 `recycleBinId`
- [ ] localStorage 中保存了这两个字段
- [ ] sessionStorage 中缓存了这两个字段
- [ ] `getHomeDirectoryId()` 函数正常工作
- [ ] `getRecycleBinId()` 函数正常工作
- [ ] 页面刷新后仍能正确获取目录ID
- [ ] 退出登录后清除相关缓存
- [ ] 处理null值的边界情况

---

## 🎯 下一步工作

### 前端待实现
1. **文件浏览页面**：使用 `homeDirectoryId` 作为初始目录
2. **回收站页面**：使用 `recycleBinId` 直接访问回收站
3. **目录导航**：基于目录ID构建面包屑导航

### 示例代码：
```javascript
// 在文件浏览页面中使用
import { getHomeDirectoryId } from '@/utils/userInfo'

onMounted(async () => {
  const homeDirId = getHomeDirectoryId()
  if (homeDirId) {
    await loadFolderContents(homeDirId)
  } else {
    showError('无法获取根目录信息')
  }
})
```

---

**文档版本**: v1.0  
**创建日期**: 2026-05-20  
**适用版本**: CloudFileSystem Frontend v2.0+
