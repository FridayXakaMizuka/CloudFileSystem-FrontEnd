# RSA 密钥获取优化指南

## 优化概述

本次优化解决了 ProfileEditView 中重复调用 `/auth/rsa-key` 接口的问题。通过利用 `/auth/is_rsa_valid` 接口在验证失败时返回新公钥的特性，避免了不必要的网络请求。

## 修改内容

### 1. 修改 `src/utils/rsa.js`

**函数**: `getStoredRSAKey()`

**优化前**:
- 当验证失败时，直接返回 `null`
- 调用方需要再次调用 `fetchRSAKey()` 获取新公钥
- 导致重复请求 `/auth/rsa-key`

**优化后**:
```javascript
} else {
  logger.info('RSA 密钥验证失败，尝试使用后端返回的新公钥')
  
  // 如果后端返回了新的公钥，使用新公钥
  if (data.publicKey) {
    logger.info('使用后端返回的新公钥')
    
    // 将新公钥保存到 Cookie（有效期7天）
    setCookie('rsaPublicKey', encodeURIComponent(data.publicKey), 7)
    logger.info('新 publicKey 已保存到 Cookie')
    
    // 重置 sessionId 有效期
    resetSessionIdExpiry()
    
    return {
      publicKey: data.publicKey,
      sessionId: sessionId
    }
  }
  
  // 如果没有新公钥，返回 null 表示需要重新获取
  return null
}
```

**关键改进**:
- ✅ 验证失败时检查后端是否返回新公钥
- ✅ 如果有新公钥，直接使用并保存到 Cookie
- ✅ 避免重复调用 `/auth/rsa-key`

### 2. 修改 `src/views/ProfileEditView.vue`

#### 2.1 优化 `loadRsaKey()` 函数

**优化前**:
```javascript
// 先尝试从 Cookie 读取并验证（传入特定用途的 sessionId）
const storedKey = await getStoredRSAKey(purposeSessionId)
if (storedKey) {
  rsaPublicKey.value = storedKey.publicKey
  sessionId.value = storedKey.sessionId
  logger.info('RSA 密钥从 Cookie 加载并验证成功')
  return
}

// Cookie 中没有或验证失败，重新获取
logger.info('Cookie 中无有效密钥，重新获取...')
const keyData = await fetchRSAKey()
```

**优化后**:
```javascript
// 尝试从 Cookie 读取并验证（如果验证失败，getStoredRSAKey 会自动使用后端返回的新公钥）
const storedKey = await getStoredRSAKey(purposeSessionId)
if (storedKey) {
  rsaPublicKey.value = storedKey.publicKey
  sessionId.value = storedKey.sessionId
  logger.info('RSA 密钥加载成功（来自 Cookie 或验证接口返回）')
  return
}

// Cookie 中没有且验证接口也未返回新公钥，才重新获取
logger.info('Cookie 中无有效密钥且验证接口未返回新公钥，重新获取...')
const keyData = await fetchRSAKey()
```

**关键改进**:
- ✅ 更新注释说明 `getStoredRSAKey` 的智能行为
- ✅ 明确只有在验证接口也未返回新公钥时才调用 `fetchRSAKey()`

#### 2.2 修复 `saveField()` 中的 sessionId 传递

**问题**: 
在保存密码、邮箱、手机号时，虽然已经生成了专用的 `purposeSessionId`，但在检查 RSA 密钥时没有传递给 `loadRsaKey()`，导致可能使用错误的 sessionId 进行验证。

**修复**:

1. **密码修改** (第 957 行):
```javascript
// 修复前
await loadRsaKey()

// 修复后
await loadRsaKey(passwordSessionId)
```

2. **邮箱修改** (第 1080 行):
```javascript
// 修复前
await loadRsaKey()

// 修复后
await loadRsaKey(emailSessionId.value)
```

3. **手机号修改** (第 1158 行):
```javascript
// 修复前
await loadRsaKey()

// 修复后
await loadRsaKey(phoneSessionId.value)
```

**关键改进**:
- ✅ 确保使用正确的专用 sessionId 进行 RSA 密钥验证
- ✅ 避免不同用途的 sessionId 混淆

## 工作流程对比

### 优化前的流程

```
用户点击编辑 → startEdit() → loadRsaKey(sessionId)
                                    ↓
                          getStoredRSAKey(sessionId)
                                    ↓
                          调用 /auth/is_rsa_valid
                                    ↓
                          验证失败 → 返回 null
                                    ↓
                          调用 /auth/rsa-key ❌ (重复请求)
                                    ↓
                          获取新公钥
```

### 优化后的流程

```
用户点击编辑 → startEdit() → loadRsaKey(sessionId)
                                    ↓
                          getStoredRSAKey(sessionId)
                                    ↓
                          调用 /auth/is_rsa_valid
                                    ↓
                    ┌───────────────┴───────────────┐
                    ↓                               ↓
              验证成功                        验证失败但返回新公钥
                    ↓                               ↓
              返回公钥                        使用新公钥 ✅
                                              保存到 Cookie
                                              返回公钥
```

## 优势

1. **减少网络请求**: 避免重复调用 `/auth/rsa-key`，每次编辑操作节省一次 HTTP 请求
2. **提高响应速度**: 直接从验证接口获取新公钥，减少等待时间
3. **更好的用户体验**: 更快的加载速度，更流畅的交互
4. **降低服务器负载**: 减少不必要的 API 调用

## 测试建议

### 测试场景 1: 首次编辑（无缓存）
1. 清除浏览器 Cookie
2. 进入个人信息页面
3. 点击"修改"按钮（昵称/邮箱/手机号/密码）
4. 观察网络请求：应该只调用 `/auth/is_rsa_valid`，不应调用 `/auth/rsa-key`

### 测试场景 2: 已有缓存但过期
1. 保留 Cookie 中的公钥
2. 等待 sessionId 过期（或手动删除 sessionId）
3. 点击"修改"按钮
4. 观察网络请求：`/auth/is_rsa_valid` 应返回新公钥，不应再调用 `/auth/rsa-key`

### 测试场景 3: 连续编辑不同字段
1. 先编辑昵称（生成全局 sessionId）
2. 再编辑邮箱（生成邮箱专用 sessionId）
3. 再编辑手机号（生成手机专用 sessionId）
4. 确认每个字段都使用正确的专用 sessionId

### 测试场景 4: 保存操作
1. 进入编辑模式
2. 修改字段内容
3. 点击"保存"
4. 如果 RSA 密钥不存在，应使用对应的专用 sessionId 重新获取

## 注意事项

1. **sessionId 隔离**: 确保不同用途（邮箱、手机号、密码）使用独立的 sessionId
2. **Cookie 管理**: 新公钥会自动保存到 Cookie，有效期 7 天
3. **错误处理**: 如果验证接口既验证失败又没有返回新公钥，才会降级调用 `/auth/rsa-key`
4. **日志监控**: 通过控制台日志可以观察 RSA 密钥的加载来源

## 相关文件

- `src/utils/rsa.js` - RSA 密钥管理工具
- `src/views/ProfileEditView.vue` - 个人信息编辑页面
- `src/config/api.js` - API 配置（包含 VALIDATE_RSA 和 RSA_KEY 接口地址）

## 更新日期

2026-05-02
