# RSA 密钥获取逻辑简化 - 移除验证接口

## 背景

后端已将 `/auth/is_rsa_valid` 接口移除，统一使用 `/auth/rsa-key` 接口。该接口**不进行 RSA 密钥有效性校验**，每次调用都会**直接生成新的公钥返回**。

## 主要变化

### 1. 后端接口变更

**之前**：
- `/auth/rsa-key` - 获取 RSA 公钥
- `/auth/is_rsa_valid` - 验证 RSA 密钥有效性（验证失败时返回新公钥）

**现在**：
- `/auth/rsa-key` - 获取 RSA 公钥（不进行有效性校验，直接生成新公钥）
- ~~`/auth/is_rsa_valid`~~ - 已移除

### 2. 前端逻辑简化

#### 修改前的问题

之前的实现尝试先验证 Cookie 中的公钥是否有效：
```javascript
// 1. 尝试从 Cookie 读取并验证
const storedKey = await getStoredRSAKey(purposeSessionId)
if (storedKey) {
  // 验证成功，使用缓存的公钥
  return storedKey
}

// 2. 验证失败，重新获取
const keyData = await fetchRSAKey()
return keyData
```

这种方式存在以下问题：
- ❌ 需要调用两个接口（验证 + 获取）
- ❌ 专用 sessionId 和全局 sessionId 混淆
- ❌ 逻辑复杂，需要临时覆盖 Cookie

#### 修改后的方案

现在直接调用 `/auth/rsa-key` 获取新公钥：
```javascript
// 直接获取新公钥（后端不进行有效性校验）
const keyData = await fetchRSAKey(purpose)
return keyData
```

优势：
- ✅ 只需调用一个接口
- ✅ 逻辑简单清晰
- ✅ 无需验证，无需缓存检查
- ✅ 每次都获取最新公钥

## 修改内容

### 1. `src/utils/rsa.js`

#### 1.1 移除 `getStoredRSAKey` 函数

```javascript
// ❌ 已删除
export const getStoredRSAKey = async (customSessionId = null) => { ... }
```

#### 1.2 优化 `fetchRSAKey` 函数

**修改前**：
```javascript
export const fetchRSAKey = async () => {
  const sessionId = getSessionId()  // 只能使用全局 sessionId
  // ...
}
```

**修改后**：
```javascript
export const fetchRSAKey = async (purpose = null) => {
  let sessionId
  if (purpose) {
    // 使用专用 sessionId
    const { getOrCreatePurposeSessionId } = await import('./sessionId')
    sessionId = getOrCreatePurposeSessionId(purpose)
  } else {
    // 使用全局 sessionId
    sessionId = getSessionId()
  }
  
  // 发送请求获取公钥
  const response = await fetch(AUTH_API.RSA_KEY, {
    method: 'POST',
    body: JSON.stringify({ sessionId })
  })
  
  // 重置 sessionId 有效期
  if (purpose) {
    resetPurposeSessionIdExpiry(purpose)
  } else {
    resetSessionIdExpiry()
  }
  
  return { publicKey, sessionId }
}
```

**关键改进**：
- ✅ 支持传入 `purpose` 参数（'email', 'phone', 'password'）
- ✅ 根据用途自动获取对应的专用 sessionId
- ✅ 正确重置对应 sessionId 的有效期

### 2. `src/views/ProfileEditView.vue`

#### 2.1 简化导入

```javascript
// 修改前
import { getStoredRSAKey, fetchRSAKey, encryptPassword } from '@/utils/rsa'
import { setCookie, getCookie, deleteCookie } from '@/utils/cookie'

// 修改后
import { fetchRSAKey, encryptPassword } from '@/utils/rsa'
import { setCookie, deleteCookie } from '@/utils/cookie'
```

#### 2.2 简化 `loadRsaKey` 函数

**修改前**（45 行）：
```javascript
const loadRsaKey = async (purposeSessionId = null) => {
  if (isRsaKeyLoading.value) return
  
  isRsaKeyLoading.value = true
  
  try {
    if (purposeSessionId) {
      // 临时覆盖全局 sessionId
      const originalSessionId = getCookie('sessionId')
      setCookie('sessionId', purposeSessionId, 5 / 1440)
      
      try {
        const keyData = await fetchRSAKey()
        rsaPublicKey.value = keyData.publicKey
        sessionId.value = purposeSessionId
      } finally {
        // 恢复全局 sessionId
        setCookie('sessionId', originalSessionId, 5 / 1440)
      }
      return
    }
    
    // 尝试验证缓存
    const storedKey = await getStoredRSAKey(null)
    if (storedKey) {
      rsaPublicKey.value = storedKey.publicKey
      return
    }
    
    // 重新获取
    const keyData = await fetchRSAKey()
    rsaPublicKey.value = keyData.publicKey
  } catch (error) {
    showError('系统初始化失败，请刷新页面重试')
  } finally {
    isRsaKeyLoading.value = false
  }
}
```

**修改后**（18 行）：
```javascript
const loadRsaKey = async (purpose = null) => {
  if (isRsaKeyLoading.value) return
  
  isRsaKeyLoading.value = true
  
  try {
    logger.info('开始获取 RSA 公钥...', purpose ? `(用途: ${purpose})` : '(全局)')
    
    // 直接调用 /auth/rsa-key 获取新公钥（后端不进行有效性校验）
    const keyData = await fetchRSAKey(purpose)
    rsaPublicKey.value = keyData.publicKey
    sessionId.value = keyData.sessionId
    logger.info('RSA 公钥获取成功')
  } catch (error) {
    logger.error('获取 RSA 公钥失败:', error)
    showError('系统初始化失败，请刷新页面重试')
  } finally {
    isRsaKeyLoading.value = false
  }
}
```

**代码减少**：45 行 → 18 行（减少 60%）

#### 2.3 更新调用方式

**startEdit 函数**：
```javascript
// 修改前
await loadRsaKey(emailSessionId.value)
await loadRsaKey(phoneSessionId.value)
await loadRsaKey(passwordSessionId)

// 修改后
await loadRsaKey('email')
await loadRsaKey('phone')
await loadRsaKey('password')
```

**saveField 函数**：
```javascript
// 修改前
await loadRsaKey(emailSessionId.value)
await loadRsaKey(phoneSessionId.value)
await loadRsaKey(passwordSessionId)

// 修改后
await loadRsaKey('email')
await loadRsaKey('phone')
await loadRsaKey('password')
```

## 工作流程对比

### 修改前的流程

```
用户点击编辑邮箱
  ↓
生成 emailSessionId
  ↓
调用 loadRsaKey(emailSessionId)
  ↓
临时覆盖全局 sessionId 为 emailSessionId
  ↓
调用 fetchRSAKey() → 获取公钥
  ↓
恢复全局 sessionId
  ↓
保存成功
```

### 修改后的流程

```
用户点击编辑邮箱
  ↓
调用 loadRsaKey('email')
  ↓
fetchRSAKey('email') 自动获取 email 专用 sessionId
  ↓
调用 /auth/rsa-key → 获取新公钥
  ↓
保存成功 ✅
```

## 优势总结

1. ✅ **代码简化**：`loadRsaKey` 函数从 45 行减少到 18 行
2. ✅ **逻辑清晰**：无需验证、无需缓存检查、无需临时覆盖 Cookie
3. ✅ **性能提升**：每次只调用一个接口，减少网络请求
4. ✅ **维护性好**：代码更简洁，易于理解和维护
5. ✅ **正确性高**：避免了 sessionId 混淆的问题

## 注意事项

1. **每次都是新公钥**：由于后端不进行有效性校验，每次调用都会生成新公钥
2. **Cookie 存储**：公钥仍然会保存到 Cookie（有效期 7 天），但不会被复用
3. **sessionId 隔离**：不同用途（email/phone/password）使用独立的 sessionId
4. **有效期重置**：获取公钥后会自动重置对应 sessionId 的有效期

## 测试建议

### 测试场景 1: 编辑邮箱
1. 进入个人信息页面
2. 点击"邮箱地址"的"修改"按钮
3. 观察控制台日志，确认调用了 `/auth/rsa-key`
4. 输入新邮箱和验证码
5. 点击"保存"，确认保存成功

### 测试场景 2: 编辑手机号
1. 进入个人信息页面
2. 点击"手机号"的"修改"按钮
3. 观察控制台日志，确认调用了 `/auth/rsa-key`
4. 输入新手机号和验证码
5. 点击"保存"，确认保存成功

### 测试场景 3: 修改密码
1. 进入个人信息页面
2. 点击"登录密码"的"修改"按钮
3. 观察控制台日志，确认调用了 `/auth/rsa-key`
4. 输入旧密码、新密码、确认密码
5. 点击"保存"，确认保存成功并跳转到登录页

### 测试场景 4: 连续编辑
1. 先编辑邮箱
2. 再编辑手机号
3. 再修改密码
4. 确认每次操作都独立获取了新公钥
5. 确认各操作的 sessionId 互不干扰

## 相关文件

- `src/utils/rsa.js` - RSA 密钥管理工具（简化版）
- `src/views/ProfileEditView.vue` - 个人信息编辑页面（简化版）
- `src/views/LoginView.vue` - 登录页面（已同步简化）
- `src/views/RegisterView.vue` - 注册页面（已同步简化）
- `src/config/api.js` - API 配置（VALIDATE_RSA 已废弃）

## 更新日期

2026-05-02
