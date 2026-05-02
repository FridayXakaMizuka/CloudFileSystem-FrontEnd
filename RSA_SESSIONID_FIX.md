# RSA SessionId 传递问题修复

## 问题描述

在 ProfileEditView.vue 中，当用户编辑邮箱、手机号或密码时，会生成**专用 sessionId**（如 `sessionId_email`、`sessionId_phone`、`sessionId_password`），但在获取 RSA 公钥时存在 sessionId 传递问题。

### 问题根源

1. **ProfileEditView** 调用 `loadRsaKey(emailSessionId.value)` 时，传入的是**专用 sessionId**
2. **rsa.js** 的 `getStoredRSAKey(customSessionId)` 接收这个专用 sessionId
3. 但是 Cookie 中存储的公钥是用**全局 sessionId** (`sessionId`) 获取的
4. 用专用 sessionId 去验证全局公钥时，后端会返回验证失败
5. 虽然验证失败时后端会返回新公钥，但这个新公钥是绑定到**专用 sessionId** 的
6. 问题在于：`fetchRSAKey()` 内部调用 `getSessionId()` 获取的是**全局 sessionId**，不是我们传入的专用 sessionId

### 错误流程

```
用户点击编辑邮箱
  ↓
生成 emailSessionId (sessionId_email)
  ↓
调用 loadRsaKey(emailSessionId)
  ↓
调用 getStoredRSAKey(emailSessionId)
  ↓
用 emailSessionId 验证 Cookie 中的公钥（该公钥是用全局 sessionId 获取的）
  ↓
验证失败 ❌
  ↓
后端返回新公钥（绑定到 emailSessionId）
  ↓
保存成功，但后续保存时可能出现问题
```

## 解决方案

### 核心思路

当传入专用 sessionId 时，**临时覆盖全局 sessionId**，让 `fetchRSAKey()` 使用专用 sessionId 获取公钥，然后恢复原来的全局 sessionId。

### 修改内容

#### 1. 导入 `getCookie` 函数

```javascript
// 修改前
import { setCookie, deleteCookie } from '@/utils/cookie'

// 修改后
import { setCookie, getCookie, deleteCookie } from '@/utils/cookie'
```

#### 2. 优化 `loadRsaKey()` 函数

```javascript
const loadRsaKey = async (purposeSessionId = null) => {
  if (isRsaKeyLoading.value) {
    logger.debug('RSA 密钥正在加载中，跳过重复请求')
    return
  }
  
  isRsaKeyLoading.value = true
  
  try {
    // 如果传入了特定用途的 sessionId，直接使用它获取新公钥
    if (purposeSessionId) {
      logger.info(`使用特定用途 sessionId (${purposeSessionId}) 获取 RSA 公钥...`)
      
      // 直接调用 /auth/rsa-key，但需要临时覆盖全局 sessionId
      const originalSessionId = getCookie('sessionId')
      const originalTimestamp = getCookie('sessionTimestamp')
      
      try {
        // 临时设置全局 sessionId 为专用 sessionId
        setCookie('sessionId', purposeSessionId, 5 / 1440) // 5分钟
        setCookie('sessionTimestamp', Date.now().toString(), 5 / 1440)
        
        // 调用 fetchRSAKey，它会使用当前的全局 sessionId（即我们的专用 sessionId）
        const keyData = await fetchRSAKey()
        rsaPublicKey.value = keyData.publicKey
        sessionId.value = purposeSessionId
        logger.info('RSA 公钥获取成功（专用 sessionId）')
      } finally {
        // 恢复原来的全局 sessionId
        if (originalSessionId) {
          setCookie('sessionId', originalSessionId, 5 / 1440)
          setCookie('sessionTimestamp', originalTimestamp || Date.now().toString(), 5 / 1440)
        }
      }
      return
    }
    
    // 没有传入特定用途的 sessionId，尝试从 Cookie 读取并验证（使用全局 sessionId）
    logger.info('开始获取 RSA 公钥（使用全局 sessionId）')
    const storedKey = await getStoredRSAKey(null)
    if (storedKey) {
      rsaPublicKey.value = storedKey.publicKey
      sessionId.value = storedKey.sessionId
      logger.info('RSA 密钥加载成功（来自 Cookie 或验证接口返回）')
      return
    }
    
    // Cookie 中没有且验证接口也未返回新公钥，才重新获取
    logger.info('Cookie 中无有效密钥且验证接口未返回新公钥，重新获取...')
    const keyData = await fetchRSAKey()
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

### 工作流程

```
用户点击编辑邮箱
  ↓
生成 emailSessionId (sessionId_email)
  ↓
调用 loadRsaKey(emailSessionId)
  ↓
检测到传入专用 sessionId
  ↓
保存当前全局 sessionId
  ↓
临时将全局 sessionId 设置为 emailSessionId
  ↓
调用 fetchRSAKey() → 使用 emailSessionId 获取公钥
  ↓
后端返回绑定到 emailSessionId 的公钥
  ↓
恢复原来的全局 sessionId
  ↓
保存成功 ✅
```

## 优势

1. ✅ **正确的 sessionId 绑定**：确保公钥和 sessionId 正确绑定
2. ✅ **避免验证失败**：不再用专用 sessionId 验证全局公钥
3. ✅ **保持隔离性**：不同用途的 sessionId 互不干扰
4. ✅ **自动恢复**：使用 try-finally 确保全局 sessionId 被正确恢复
5. ✅ **减少请求**：避免了验证失败后的额外请求

## 测试建议

### 测试场景 1: 编辑邮箱
1. 进入个人信息页面
2. 点击"邮箱地址"的"修改"按钮
3. 观察控制台日志，确认使用了邮箱专用 sessionId
4. 输入新邮箱和验证码
5. 点击"保存"，确认保存成功

### 测试场景 2: 编辑手机号
1. 进入个人信息页面
2. 点击"手机号"的"修改"按钮
3. 观察控制台日志，确认使用了手机专用 sessionId
4. 输入新手机号和验证码
5. 点击"保存"，确认保存成功

### 测试场景 3: 修改密码
1. 进入个人信息页面
2. 点击"登录密码"的"修改"按钮
3. 观察控制台日志，确认使用了密码专用 sessionId
4. 输入旧密码、新密码、确认密码
5. 点击"保存"，确认保存成功并跳转到登录页

### 测试场景 4: 连续编辑不同字段
1. 先编辑邮箱（使用邮箱专用 sessionId）
2. 再编辑手机号（使用手机专用 sessionId）
3. 再修改密码（使用密码专用 sessionId）
4. 确认每个操作都使用了正确的专用 sessionId
5. 确认全局 sessionId 在每次操作后都被正确恢复

## 注意事项

1. **临时覆盖**：使用专用 sessionId 时会临时覆盖全局 sessionId，但会在操作完成后立即恢复
2. **异常处理**：使用 try-finally 确保即使发生异常也能恢复全局 sessionId
3. **Cookie 有效期**：临时设置的 Cookie 有效期为 5 分钟，与专用 sessionId 的有效期一致
4. **日志监控**：通过控制台日志可以观察 sessionId 的使用情况

## 相关文件

- `src/views/ProfileEditView.vue` - 个人信息编辑页面
- `src/utils/rsa.js` - RSA 密钥管理工具
- `src/utils/sessionId.js` - SessionId 管理工具
- `src/utils/cookie.js` - Cookie 管理工具

## 更新日期

2026-05-02
