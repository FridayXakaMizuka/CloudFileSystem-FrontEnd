# 密码修改功能完整实现指南

## 📋 概述

本次实现完善了 ProfileEditView 中的密码修改功能，包括：
1. 点击"修改"时自动获取 RSA 公钥（优先从 Cookie）
2. 保存时使用 RSA 加密新旧密码
3. 发送 POST 请求到 `/profile/password/set`
4. 成功后清除 JWT 令牌并跳转到登录页面

## 🎯 接口设计

### 后端接口规范

**接口地址**: `POST /profile/password/set`

**请求头**:
```
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>
```

**请求体**:
```json
{
  "sessionId": "RSA会话ID",
  "oldPassword": "RSA加密后的旧密码",
  "newPassword": "RSA加密后的新密码"
}
```

**成功响应**:
```json
{
  "code": 200,
  "success": true,
  "message": "密码修改成功"
}
```

**失败响应**:
```json
{
  "code": 400,
  "success": false,
  "message": "错误信息"
}
```

## 🔧 前端实现

### 1. API 配置更新

**文件**: `src/config/api.js`

在 `PROFILE_API` 中添加密码修改接口：

```javascript
export const PROFILE_API = {
  // ... 其他接口
  
  // 修改密码
  CHANGE_PASSWORD: `${BASE_API_URL}/profile/password/set`,
  
  // ... 其他接口
}
```

### 2. ProfileEditView 导入更新

**文件**: `src/views/ProfileEditView.vue`

添加必要的导入：

```javascript
import { clearAuthInfo } from '@/utils/auth'
import { PROFILE_API } from '@/config/api'
```

### 3. 点击"修改"时获取 RSA 密钥

**函数**: `startEdit(field)`

当用户点击密码管理的"修改"按钮时，立即获取 RSA 密钥：

```javascript
const startEdit = async (field) => {
  // ... 其他逻辑
  
  if (field === 'password') {
    editForm.value.oldPassword = ''
    editForm.value.newPassword = ''
    editForm.value.confirmPassword = ''
    isPasswordVerified.value = false
    initialPasswordError.value = ''
    
    // ✅ 点击密码修改时，立即获取 RSA 密钥（优先从 Cookie）
    logger.info('开始编辑密码，获取 RSA 密钥...')
    await loadRsaKey()
  }
  
  logger.info(`开始编辑${field}`)
}
```

**loadRsaKey 函数逻辑**（已存在）：
```javascript
const loadRsaKey = async () => {
  if (isRsaKeyLoading.value) {
    logger.debug('RSA 密钥正在加载中，跳过重复请求')
    return
  }
  
  isRsaKeyLoading.value = true
  
  try {
    logger.info('开始获取 RSA 公钥...')
    
    // ✅ 优先从 Cookie 读取并验证
    const validatedKey = await getValidatedRSAKey()
    if (validatedKey) {
      rsaPublicKey.value = validatedKey.publicKey
      sessionId.value = validatedKey.sessionId
      logger.info('RSA 密钥从 Cookie 加载成功')
      return
    }
    
    // Cookie 中没有有效密钥，重新获取
    logger.info('Cookie 中无有效密钥，重新获取...')
    const keyData = await fetchRSAKey()
    rsaPublicKey.value = keyData.publicKey
    sessionId.value = keyData.sessionId
    logger.info('RSA 公钥获取成功')
  } catch (error) {
    logger.error('获取 RSA 公钥失败:', error)
    alert('系统初始化失败，请刷新页面重试')
  } finally {
    isRsaKeyLoading.value = false
  }
}
```

### 4. 保存密码时的完整流程

**函数**: `saveField(field)`

当用户点击"保存"按钮时：

```javascript
const saveField = async (field) => {
  // 1. 验证表单
  validateField()
  if (fieldError.value) {
    alert(fieldError.value.message)
    return
  }
  
  isSaving.value = true
  
  try {
    const token = getToken()
    if (!token) {
      alert('用户未登录，请重新登录')
      router.push('/login')
      return
    }
    
    // 2. 密码修改特殊处理
    if (field === 'password') {
      // 2.1 检查旧密码是否已验证
      if (!isPasswordVerified.value) {
        alert('请先验证当前密码')
        return
      }
      
      // 2.2 检查 RSA 密钥是否存在
      if (!rsaPublicKey.value || !sessionId.value) {
        logger.warn('RSA 密钥未加载，尝试重新获取...')
        await loadRsaKey()
        
        if (!rsaPublicKey.value || !sessionId.value) {
          alert('系统初始化失败，请刷新页面重试')
          return
        }
      }
      
      // 2.3 使用 RSA 加密新旧密码
      const encryptedOldPassword = encryptPassword(
        editForm.value.oldPassword, 
        rsaPublicKey.value
      )
      const encryptedNewPassword = encryptPassword(
        editForm.value.newPassword, 
        rsaPublicKey.value
      )
      
      // 2.4 构造请求数据
      const requestData = {
        sessionId: sessionId.value,
        oldPassword: encryptedOldPassword,
        newPassword: encryptedNewPassword
      }
      
      logger.info('发送密码修改请求...')
      
      // 2.5 发送 POST 请求到后端
      const response = await fetch(PROFILE_API.CHANGE_PASSWORD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      })
      
      result = await response.json()
      logger.info('密码修改响应:', result)
      
      // 2.6 处理响应
      if (response.ok && result.success === true) {
        alert(result.message || '密码修改成功！请重新登录')
        
        // ✅ 清空 JWT 令牌和认证信息
        clearAuthInfo()
        
        // ✅ 清除 Cookie 中的 RSA 密钥
        deleteCookie('sessionId')
        deleteCookie('rsaPublicKey')
        
        // ✅ 跳转到登录界面
        router.push('/login')
      } else {
        alert(result.message || '密码修改失败')
      }
    } else {
      // 其他字段的修改逻辑...
    }
  } catch (error) {
    logger.error('修改失败:', error)
    alert('网络错误，请稍后重试')
  } finally {
    isSaving.value = false
  }
}
```

## 📊 完整流程图

```
用户点击"密码管理"的"修改"按钮
  ↓
startEdit('password')
  ↓
重置表单字段
  ↓
await loadRsaKey()
  ├─ 优先从 Cookie 读取 sessionId 和 publicKey
  ├─ 调用 getValidatedRSAKey() 验证密钥有效性
  │  ├─ 如果有效 → 直接使用
  │  └─ 如果无效 → 后端返回新密钥对
  └─ 如果 Cookie 中没有 → 调用 fetchRSAKey() 获取新密钥
  ↓
显示三栏输入框：
├─ 旧密码
├─ 新密码
└─ 确认密码
  ↓
用户输入旧密码 → 失焦验证 → isPasswordVerified = true
  ↓
用户输入新密码（实时验证长度 6-14 位）
  ↓
用户输入确认密码（实时验证一致性）
  ↓
用户点击"保存"
  ↓
saveField('password')
  ↓
1. validateField() - 验证表单
   ├─ 新密码不能为空
   ├─ 长度 6-14 位
   └─ 确认密码必须一致
  ↓
2. 检查 isPasswordVerified === true
  ↓
3. 检查 RSA 密钥是否存在
   └─ 如果不存在 → await loadRsaKey()
  ↓
4. RSA 加密密码
   ├─ encryptedOldPassword = encryptPassword(oldPassword, publicKey)
   └─ encryptedNewPassword = encryptPassword(newPassword, publicKey)
  ↓
5. 构造请求数据
   {
     sessionId: "...",
     oldPassword: "加密后的旧密码",
     newPassword: "加密后的新密码"
   }
  ↓
6. 发送 POST 请求
   POST /profile/password/set
   Headers:
   - Content-Type: application/json
   - Authorization: Bearer <JWT_TOKEN>
  ↓
7. 后端处理
   ├─ 验证 JWT 令牌
   ├─ 验证 sessionId
   ├─ 解密旧密码并验证
   ├─ 更新密码
   └─ 返回结果
  ↓
8. 前端处理响应
   ├─ 成功 (success === true)
   │  ├─ 显示成功消息
   │  ├─ clearAuthInfo() - 清除 JWT 令牌
   │  ├─ deleteCookie('sessionId')
   │  ├─ deleteCookie('rsaPublicKey')
   │  └─ router.push('/login') - 跳转登录页
   │
   └─ 失败 (success === false)
      └─ 显示错误消息
```

## 🔐 安全特性

### 1. RSA 加密
- ✅ 旧密码和新密码都使用 RSA 公钥加密
- ✅ 加密后的密码在网络传输中是安全的
- ✅ 只有后端持有私钥可以解密

### 2. 双重验证
- ✅ **第一重**: 旧密码失焦时验证（`verifyInitialPassword`）
- ✅ **第二重**: 保存时再次验证 `isPasswordVerified` 状态

### 3. 会话管理
- ✅ 密码修改成功后立即清除 JWT 令牌
- ✅ 清除 Cookie 中的 RSA 密钥
- ✅ 强制用户重新登录，确保安全性

### 4. RSA 密钥缓存
- ✅ 优先从 Cookie 读取，避免频繁请求
- ✅ 自动验证密钥有效性
- ✅ 密钥失效时自动刷新

## 📝 关键代码片段

### RSA 加密函数（来自 rsa.js）

```javascript
import JSEncrypt from 'jsencrypt'

export const encryptPassword = (password, publicKey) => {
  const encrypt = new JSEncrypt()
  encrypt.setPublicKey(publicKey)
  const encrypted = encrypt.encrypt(password)
  
  if (!encrypted) {
    throw new Error('密码加密失败')
  }
  
  return encrypted
}
```

### 清除认证信息（来自 auth.js）

```javascript
export const clearAuthInfo = () => {
  localStorage.removeItem('jwt_token')
  localStorage.removeItem('user_info')
  // ... 清除其他认证相关信息
}
```

### 删除 Cookie（来自 cookie.js）

```javascript
export const deleteCookie = (name) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
}
```

## 🧪 测试建议

### 1. 基本功能测试
- [ ] 点击"修改"后正确获取 RSA 密钥
- [ ] 旧密码验证成功
- [ ] 新密码长度验证（6-14位）
- [ ] 确认密码一致性验证
- [ ] 密码修改成功并跳转登录页

### 2. 异常情况测试
- [ ] 旧密码错误时的提示
- [ ] 新密码长度不符合要求
- [ ] 两次密码输入不一致
- [ ] 网络请求失败的处理
- [ ] RSA 密钥获取失败的处理

### 3. 安全性测试
- [ ] 确认密码在网络传输中是加密的
- [ ] 成功后 JWT 令牌被清除
- [ ] Cookie 中的 RSA 密钥被清除
- [ ] 无法在不验证旧密码的情况下修改

### 4. RSA 密钥缓存测试
- [ ] 首次获取密钥并保存到 Cookie
- [ ] 刷新页面后从 Cookie 读取密钥
- [ ] 密钥失效时自动刷新
- [ ] 多个标签页共享同一密钥

## ⚠️ 注意事项

### 1. 后端实现要求
后端需要实现以下逻辑：
```java
@PostMapping("/profile/password/set")
public ResponseEntity<?> changePassword(
    @RequestHeader("Authorization") String token,
    @RequestBody PasswordChangeRequest request
) {
    // 1. 验证 JWT 令牌
    // 2. 从 request 中获取 sessionId
    // 3. 使用 sessionId 查找对应的私钥
    // 4. 解密 oldPassword 并验证
    // 5. 解密 newPassword
    // 6. 更新密码
    // 7. 使当前 JWT 令牌失效（可选）
    // 8. 返回成功响应
}
```

### 2. 请求体结构
```typescript
interface PasswordChangeRequest {
  sessionId: string;      // RSA 会话 ID
  oldPassword: string;    // RSA 加密后的旧密码
  newPassword: string;    // RSA 加密后的新密码
}
```

### 3. 前端依赖
确保已安装以下依赖：
```bash
npm install jsencrypt
```

### 4. 错误处理
所有异步操作都有完善的错误处理：
- RSA 密钥获取失败
- 密码验证失败
- 网络请求失败
- 后端返回错误

## 🎉 总结

通过这次实现：

1. ✅ **完整的密码修改流程** - 从获取密钥到跳转登录
2. ✅ **RSA 加密保护** - 密码在网络传输中完全加密
3. ✅ **双重验证机制** - 确保是合法用户操作
4. ✅ **安全的会话管理** - 修改后立即清除认证信息
5. ✅ **智能密钥缓存** - 优先从 Cookie 读取，减少请求
6. ✅ **完善的错误处理** - 各种异常情况都有处理

现在密码修改功能既安全又易用！🚀

---

**最后更新**: 2024-05-01  
**版本**: 1.0.0
