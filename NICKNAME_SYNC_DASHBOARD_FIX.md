# 昵称修改后 DashboardView 同步显示修复

## 问题描述

**现象**：
- 在 ProfileEditView 中修改昵称并保存成功
- 返回 DashboardView 后，显示的昵称仍然是旧值
- 需要刷新页面才能看到新昵称

**根本原因**：
DashboardView 的 `username` 是一个 `ref` 变量，只在 `onMounted` 时从缓存读取一次，之后不会自动更新。

```javascript
// ❌ 原来的实现：username 是 ref，只读取一次
const username = ref('')

onMounted(async () => {
  const userInfo = getUserInfo()
  if (userInfo) {
    username.value = userInfo.nickname  // 只在挂载时设置
  }
})
```

虽然 ProfileEditView 已经更新了 sessionStorage 缓存和 localStorage，但 DashboardView 不会自动响应这些变化。

## 修复方案

### 核心思路

将 `username` 从 `ref` 改为 **计算属性（computed）**，每次访问时都从最新的缓存中读取。

### 1. 将 username 改为计算属性

**修改前** ❌：
```javascript
const username = ref('')

onMounted(async () => {
  const userInfo = getUserInfo()
  if (userInfo) {
    username.value = userInfo.nickname  // 只设置一次
  }
})
```

**修改后** ✅：
```javascript
/**
 * 计算属性：获取用户名（从缓存中读取）
 */
const username = computed(() => {
  const userInfo = getUserInfo()
  return userInfo?.nickname || '用户'
})
```

**优势**：
- ✅ 每次访问 `username.value` 都会重新调用 `getUserInfo()`
- ✅ 自动响应缓存变化
- ✅ 代码更简洁，不需要手动更新

### 2. 简化 onMounted 逻辑

**修改前** ❌：
```javascript
onMounted(async () => {
  const userInfo = getUserInfo()
  if (userInfo) {
    username.value = userInfo.nickname  // 手动设置
    await loadUserAvatar()
  } else {
    router.push('/login')
  }
  
  // 添加触摸事件监听器...
})
```

**修改后** ✅：
```javascript
onMounted(async () => {
  const userInfo = getUserInfo()
  if (!userInfo) {
    router.push('/login')
    return
  }
  
  // 加载用户头像
  await loadUserAvatar()

  // 添加触摸事件监听器...
})
```

**改进**：
- ✅ 移除了手动设置 `username.value` 的代码
- ✅ 简化了逻辑，更易维护

### 3. 其他相关代码自动适配

由于 `avatarLetter` 和 `avatarColor` 已经是计算属性，它们会自动使用新的 `username`：

```javascript
// avatarLetter 计算属性（已存在）
const avatarLetter = computed(() => {
  const userInfo = getUserInfo()
  const name = userInfo?.nickname || username.value  // ✅ 自动使用新的 username
  if (!name) return 'U'
  return name.charAt(0).toUpperCase()
})

// avatarColor 计算属性（已存在）
const avatarColor = computed(() => {
  const colors = [...]
  const userInfo = getUserInfo()
  const name = userInfo?.nickname || username.value  // ✅ 自动使用新的 username
  if (!name) return colors[0]
  // ...
})
```

## 工作流程对比

### 修改前的流程（有问题）

```
用户在 ProfileEditView 修改昵称
  ↓
updateUserInfoField('nickname', newNickname)  ← 更新 sessionStorage
localStorage.setItem('username', newNickname)  ← 更新 localStorage
  ↓
返回 DashboardView
  ↓
DashboardView 的 username 仍是旧值  ← ❌ 没有自动更新
  ↓
用户看到旧昵称
  ↓
需要手动刷新页面才能看到新昵称  ← ❌ 体验差
```

### 修改后的流程（正确）

```
用户在 ProfileEditView 修改昵称
  ↓
updateUserInfoField('nickname', newNickname)  ← 更新 sessionStorage
localStorage.setItem('username', newNickname)  ← 更新 localStorage
  ↓
返回 DashboardView
  ↓
模板中访问 {{ username }}
  ↓
触发 computed getter
  ↓
getUserInfo() 从 sessionStorage 读取最新缓存  ← ✅ 获取新值
  ↓
返回新昵称
  ↓
用户立即看到新昵称  ← ✅ 无需刷新
```

## 技术细节

### getUserInfo 函数的工作原理

```javascript
// src/utils/userInfo.js
export const getUserInfo = async (forceRefresh = false) => {
  // 如果不强制刷新，先尝试从缓存获取
  if (!forceRefresh) {
    const cached = getCachedUserInfo()  // 从 sessionStorage 读取
    if (cached) {
      logger.info('使用缓存的用户信息')
      return cached  // ✅ 返回最新的缓存数据
    }
  }
  
  // 从后端获取
  logger.info('从后端获取用户信息')
  return await fetchAllUserInfo()
}
```

**关键点**：
- `getCachedUserInfo()` 从 `sessionStorage` 读取
- `updateUserInfoField()` 会更新 `sessionStorage`
- 每次调用 `getUserInfo()` 都会获取最新的缓存数据

### 计算属性的响应式特性

Vue 的计算属性具有以下特性：
1. **惰性求值**：只有在被访问时才计算
2. **缓存结果**：如果依赖没有变化，返回缓存的结果
3. **自动追踪依赖**：当依赖变化时，自动重新计算

在这个场景中：
- `username` 计算属性依赖 `getUserInfo()` 的返回值
- `getUserInfo()` 每次都从 `sessionStorage` 读取最新数据
- 因此每次访问 `username` 都会获取最新值

## 测试场景

### 测试场景 1: 修改昵称后立即查看

1. 在 DashboardView 中看到当前昵称（如"张三"）
2. 点击头像进入 ProfileEditView
3. 修改昵称为"李四"并保存
4. 返回 DashboardView
5. **预期**：✅ 立即显示"李四"，无需刷新页面

### 测试场景 2: 头像字母同步更新

1. 当前昵称为"张三"，头像显示"Z"
2. 修改昵称为"李四"
3. 返回 DashboardView
4. **预期**：
   - ✅ 昵称显示"李四"
   - ✅ 头像字母变为"L"

### 测试场景 3: 头像颜色同步更新

1. 当前昵称为"张三"，头像背景色为紫色
2. 修改昵称为"李四"
3. 返回 DashboardView
4. **预期**：
   - ✅ 昵称显示"李四"
   - ✅ 头像背景色根据新昵称重新计算

### 测试场景 4: 跨页面同步

1. 打开 DashboardView
2. 在新标签页打开 ProfileEditView
3. 修改昵称并保存
4. 切换回 DashboardView 标签页
5. **预期**：✅ 昵称自动更新（因为计算属性每次都会重新读取缓存）

## 相关文件

- `src/views/DashBoardView.vue`
  - 第 122-128 行：将 `username` 改为计算属性
  - 第 270-284 行：简化 `onMounted` 逻辑

- `src/views/ProfileEditView.vue`
  - 第 1060 行：`updateUserInfoField('nickname', newNickname)` 更新缓存
  - 第 1063 行：`localStorage.setItem('username', newNickname)` 更新 localStorage

- `src/utils/userInfo.js`
  - 第 142-155 行：`getUserInfo()` 函数，从缓存读取
  - 第 162-173 行：`updateUserInfoField()` 函数，更新缓存

## 更新日期

2026-05-02
