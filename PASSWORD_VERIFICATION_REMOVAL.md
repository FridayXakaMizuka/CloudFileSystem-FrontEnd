# 移除旧密码失焦验证功能指南

## 📋 概述

本次更新移除了 ProfileEditView 中旧密码输入框失焦时向后端发起 `/profile/password/is_initial_correct` 请求的功能。现在用户只需在点击"保存"时一次性提交所有信息进行验证和修改。

## 🎯 移除的内容

### 1. API 接口定义

**文件**: `src/config/api.js`

**删除的接口**：
```javascript
// ❌ 已删除
VERIFY_INITIAL_PASSWORD: `${BASE_API_URL}/profile/password/is_initial_correct`
```

### 2. 状态变量

**文件**: `src/views/ProfileEditView.vue`

**删除的状态**：
```javascript
// ❌ 已删除
const isPasswordVerifying = ref(false)
const initialPasswordError = ref('')
const isPasswordVerified = ref(false)
```

### 3. 模板中的事件绑定

**删除的事件**：
```vue
<!-- ❌ 已删除 -->
<input
    type="password"
    id="old-password"
    v-model="editForm.oldPassword"
    @focus="handleOldPasswordFocus"
    @blur="verifyInitialPassword"  <!-- 删除 -->
/>
<p v-if="initialPasswordError" class="error-message">  <!-- 删除 -->
  {{ initialPasswordError }}
</p>
```

**现在的代码**：
```vue
<input
    type="password"
    id="old-password"
    v-model="editForm.oldPassword"
    placeholder="请输入当前密码"
/>
```

### 4. 保存按钮的禁用条件

**之前**：
```vue
<button 
  class="btn btn-save" 
  @click="saveField('password')" 
  :disabled="isSaving || !isFieldValid || !isPasswordVerified">
  <!-- ❌ 删除了 !isPasswordVerified -->
</button>
```

**现在**：
```vue
<button 
  class="btn btn-save" 
  @click="saveField('password')" 
  :disabled="isSaving || !isFieldValid">
  <!-- ✅ 只检查保存状态和字段有效性 -->
</button>
```

### 5. 计算属性更新

**之前**：
```javascript
const isFieldValid = computed(() => {
  if (editingField.value === 'password') {
    return !fieldError.value && 
           editForm.value.oldPassword && 
           editForm.value.newPassword && 
           editForm.value.confirmPassword &&
           isPasswordVerified.value  // ❌ 删除
  }
  return !fieldError.value && editForm.value[editingField.value] !== userInfo.value[editingField.value]
})
```

**现在**：
```javascript
const isFieldValid = computed(() => {
  if (editingField.value === 'password') {
    return !fieldError.value && 
           editForm.value.oldPassword && 
           editForm.value.newPassword && 
           editForm.value.confirmPassword
    // ✅ 不再需要 isPasswordVerified
  }
  return !fieldError.value && editForm.value[editingField.value] !== userInfo.value[editingField.value]
})
```

### 6. startEdit 函数简化

**之前**：
```javascript
else if (field === 'password') {
  editForm.value.oldPassword = ''
  editForm.value.newPassword = ''
  editForm.value.confirmPassword = ''
  isPasswordVerified.value = false      // ❌ 删除
  initialPasswordError.value = ''       // ❌ 删除
  
  await loadRsaKey()
}
```

**现在**：
```javascript
else if (field === 'password') {
  editForm.value.oldPassword = ''
  editForm.value.newPassword = ''
  editForm.value.confirmPassword = ''
  
  await loadRsaKey()  // ✅ 仍然获取 RSA 密钥用于加密
}
```

### 7. saveField 函数简化

**之前**：
```javascript
if (field === 'password') {
  // ❌ 删除了整个验证块
  if (!isPasswordVerified.value) {
    alert('请先验证当前密码')
    return
  }
  
  // 检查 RSA 密钥...
}
```

**现在**：
```javascript
if (field === 'password') {
  // ✅ 直接检查 RSA 密钥
  if (!rsaPublicKey.value || !sessionId.value) {
    logger.warn('RSA 密钥未加载，尝试重新获取...')
    await loadRsaKey()
    
    if (!rsaPublicKey.value || !sessionId.value) {
      alert('系统初始化失败，请刷新页面重试')
      return
    }
  }
  
  // RSA 加密并发送请求...
}
```

### 8. 删除的函数

**完全删除的函数**：
- ❌ `verifyInitialPassword()` - 验证初始密码的函数（约 75 行代码）
- ❌ `handleOldPasswordBlur()` - 旧密码失焦处理函数

**保留的函数**：
- ✅ `handleOldPasswordFocus()` - 旧密码聚焦时加载 RSA 密钥（仍需要）

## 📊 流程对比

### 之前的流程（双重验证）

```
用户点击"修改"
  ↓
startEdit('password')
  ├─ 重置表单
  └─ loadRsaKey()
  ↓
显示三栏输入框
  ↓
用户输入旧密码 → 失焦
  ↓
❌ verifyInitialPassword()
  ├─ RSA 加密旧密码
  ├─ POST /profile/password/is_initial_correct
  ├─ 后端验证
  └─ 设置 isPasswordVerified = true
  ↓
用户输入新密码和确认密码
  ↓
点击"保存"
  ↓
检查 isPasswordVerified === true
  ↓
再次 RSA 加密新旧密码
  ↓
POST /profile/password/set
  ↓
成功 → 清除认证信息 → 跳转登录
```

### 现在的流程（单次验证）

```
用户点击"修改"
  ↓
startEdit('password')
  ├─ 重置表单
  └─ loadRsaKey()  // ✅ 仅获取 RSA 密钥用于加密
  ↓
显示三栏输入框
  ↓
用户输入旧密码、新密码、确认密码
  ↓
点击"保存"
  ↓
validateField() - 前端验证
  ├─ 新密码长度 6-14 位
  └─ 确认密码一致
  ↓
检查 RSA 密钥是否存在
  ↓
RSA 加密新旧密码
  ↓
POST /profile/password/set
{
  sessionId: "...",
  oldPassword: "加密后的旧密码",
  newPassword: "加密后的新密码"
}
  ↓
后端验证旧密码并更新
  ↓
成功 → 清除认证信息 → 跳转登录
```

## ✨ 优势

### 1. 减少网络请求
| 操作 | 之前 | 现在 |
|------|------|------|
| 输入旧密码 | 1 次请求（验证） | 0 次 |
| 点击保存 | 1 次请求（修改） | 1 次请求（修改） |
| **总计** | **2 次请求** | **1 次请求** |

### 2. 简化用户体验
- ✅ 无需等待旧密码验证完成
- ✅ 无额外的验证提示弹窗
- ✅ 更流畅的操作流程

### 3. 代码简化
- ❌ 删除了约 100 行代码
- ❌ 删除了 3 个状态变量
- ❌ 删除了 2 个函数
- ❌ 删除了 1 个 API 接口定义

### 4. 保持安全性
- ✅ 旧密码仍然通过 RSA 加密传输
- ✅ 后端仍然验证旧密码的正确性
- ✅ 成功后仍然清除所有认证信息
- ✅ 强制重新登录

## 🔍 关键变更点

### 1. 用户操作流程变化

**之前**：
1. 点击"修改"
2. 输入旧密码
3. **失焦时自动验证** ← 删除
4. 看到"密码验证成功"提示 ← 删除
5. 输入新密码
6. 输入确认密码
7. 点击"保存"

**现在**：
1. 点击"修改"
2. 输入旧密码
3. 输入新密码
4. 输入确认密码
5. 点击"保存"

### 2. 错误处理变化

**之前**：
- 旧密码错误 → 失焦时立即显示错误
- 需要重新输入旧密码并再次失焦验证

**现在**：
- 旧密码错误 → 点击保存时后端返回错误
- 用户可以同时修正所有字段后再次提交

### 3. RSA 密钥使用变化

**之前**：
- 第一次：失焦验证时使用（加密旧密码）
- 第二次：保存修改时使用（加密新旧密码）

**现在**：
- 仅在保存时使用（加密新旧密码）
- 点击"修改"时预加载 RSA 密钥（优化体验）

## 📝 注意事项

### 1. 后端实现
后端需要在 `/profile/password/set` 接口中：
- ✅ 接收 `sessionId`、`oldPassword`（加密）、`newPassword`（加密）
- ✅ 使用 sessionId 查找对应的私钥
- ✅ 解密 oldPassword 并验证
- ✅ 如果旧密码错误，返回错误响应
- ✅ 如果旧密码正确，更新密码并返回成功

### 2. 前端验证
前端仍然进行基本验证：
- ✅ 新密码不能为空
- ✅ 新密码长度 6-14 位
- ✅ 确认密码必须与新密码一致
- ✅ 旧密码不能为空（通过 `isFieldValid` 检查）

### 3. 错误提示
- 后端返回的错误会直接显示给用户
- 例如："当前密码不正确"、"新密码不符合要求"等

## 🎉 总结

通过这次更新：

1. ✅ **简化了用户操作流程** - 从两步验证变为一步提交
2. ✅ **减少了网络请求** - 从 2 次减少到 1 次
3. ✅ **精简了代码** - 删除了约 100 行冗余代码
4. ✅ **保持了安全性** - RSA 加密 + 后端验证
5. ✅ **提升了用户体验** - 更流畅、更快速

现在密码修改功能更加简洁高效，同时保持了完整的安全性！🚀

---

**最后更新**: 2024-05-01  
**版本**: 2.0.0
