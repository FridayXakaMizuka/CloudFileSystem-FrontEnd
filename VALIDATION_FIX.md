# 验证逻辑修复 - 保存时验证指定字段

## 问题描述

**现象**：
- 同时打开邮箱和手机号的编辑模式
- 先打开邮箱编辑，再打开手机号编辑
- 点击邮箱的"保存"按钮
- **错误结果**：提示手机号的验证错误（如"请输入手机验证码"）

**根本原因**：
`saveField()` 函数调用 `validateField()`，而 `validateField()` 验证的是**最后一个激活的字段**，不是要保存的字段。

```javascript
// ❌ 错误的逻辑
const saveField = async (field) => {
  validateField()  // 验证最后一个激活的字段
  if (fieldError.value) {
    alert(fieldError.value.message)  // 可能显示其他字段的错误
    return
  }
  // ...
}
```

## 修复方案

### 1. 新增 `validateSpecificField` 函数

创建一个新的验证函数，可以验证**指定的字段**：

```javascript
/**
 * 验证指定字段
 * @param {string} field - 要验证的字段名
 * @returns {Object|string} 验证错误对象或空字符串
 */
const validateSpecificField = (field) => {
  switch (field) {
    case 'nickname':
      const nickname = editForm.value.nickname
      if (!nickname.trim()) {
        return { field: 'nickname', message: '昵称不能为空' }
      } else if (nickname.length > 20) {
        return { field: 'nickname', message: '昵称不能超过20个字符' }
      }
      return ''
    
    case 'email':
      const email = editForm.value.email
      const emailCode = editForm.value.emailVerificationCode
      
      if (!email) {
        return ''
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
          return { field: 'email', message: '请输入有效的邮箱地址' }
        } else if (!emailCode) {
          return { field: 'emailVerificationCode', message: '请输入邮箱验证码' }
        } else if (!emailSessionId.value) {
          return { field: 'emailVerificationCode', message: '请先发送验证码' }
        }
      }
      return ''
    
    case 'phone':
      const phone = editForm.value.phone
      const phoneCode = editForm.value.phoneVerificationCode
      
      if (!phone) {
        return ''
      } else {
        const phoneRegex = /^1[3-9]\d{9}$/
        if (!phoneRegex.test(phone)) {
          return { field: 'phone', message: '请输入有效的11位手机号' }
        } else if (!phoneCode) {
          return { field: 'phoneVerificationCode', message: '请输入手机验证码' }
        } else if (!phoneSessionId.value) {
          return { field: 'phoneVerificationCode', message: '请先发送验证码' }
        }
      }
      return ''
    
    case 'password':
      const newPassword = editForm.value.newPassword
      const confirmPassword = editForm.value.confirmPassword
      
      if (!newPassword) {
        return { field: 'newPassword', message: '新密码不能为空' }
      } else if (newPassword.length < 6 || newPassword.length > 14) {
        return { field: 'newPassword', message: '密码长度应在6-14位之间' }
      } else if (/[^a-zA-Z0-9_]/.test(newPassword)) {
        return { field: 'newPassword', message: '密码只能包含字母、数字和下划线' }
      }
      
      if (confirmPassword && newPassword !== confirmPassword) {
        return { field: 'confirmPassword', message: '两次输入的密码不一致' }
      }
      
      return ''
    
    default:
      return ''
  }
}
```

**特点**：
- ✅ 接收 `field` 参数，验证指定字段
- ✅ 返回验证结果（错误对象或空字符串）
- ✅ 不修改全局状态（`fieldError.value`）
- ✅ 可复用，支持任意字段验证

### 2. 重构 `validateField` 函数

将原有的验证逻辑提取到 `validateSpecificField`，`validateField` 只负责实时更新错误提示：

```javascript
/**
 * 验证当前字段（用于实时验证）
 */
const validateField = () => {
  // 如果没有正在编辑的字段，清空错误
  if (editingFields.value.size === 0) {
    fieldError.value = ''
    return
  }
  
  // 获取最后一个激活的字段进行验证（用于显示错误）
  const fields = Array.from(editingFields.value)
  const lastField = fields[fields.length - 1]
  
  // 调用新的验证函数
  fieldError.value = validateSpecificField(lastField)
}
```

**优势**：
- ✅ 代码复用，减少重复
- ✅ 职责清晰：`validateField` 负责实时更新 UI
- ✅ 易于维护和扩展

### 3. 修改 `saveField` 函数

使用 `validateSpecificField` 验证要保存的字段：

**修改前** ❌：
```javascript
const saveField = async (field) => {
  validateField()  // ❌ 验证最后一个激活的字段
  if (fieldError.value) {
    alert(fieldError.value.message)
    return
  }
  // ...
}
```

**修改后** ✅：
```javascript
const saveField = async (field) => {
  // ✅ 验证指定字段（而不是最后一个激活的字段）
  const validationError = validateSpecificField(field)
  if (validationError) {
    alert(validationError.message)
    return
  }
  // ...
}
```

## 工作流程对比

### 修改前的流程（有问题）

```
用户打开邮箱编辑
  ↓
用户打开手机号编辑（最后一个激活的字段）
  ↓
填写邮箱信息
  ↓
点击邮箱的"保存"
  ↓
saveField('email') 被调用
  ↓
validateField() 验证最后一个字段（手机号）← ❌ 错误
  ↓
fieldError.value = { field: 'phoneVerificationCode', message: '请输入手机验证码' }
  ↓
alert('请输入手机验证码') ← ❌ 显示错误的提示
```

### 修改后的流程（正确）

```
用户打开邮箱编辑
  ↓
用户打开手机号编辑
  ↓
填写邮箱信息
  ↓
点击邮箱的"保存"
  ↓
saveField('email') 被调用
  ↓
validateSpecificField('email') 验证邮箱字段 ← ✅ 正确
  ↓
validationError = '' （验证通过）
  ↓
提交邮箱修改请求
  ↓
✅ 成功
```

## 测试场景

### 测试场景 1: 单独保存邮箱

1. 只打开邮箱编辑模式
2. 输入新邮箱
3. 发送并输入验证码
4. 点击"保存"
5. **预期**：✅ 验证邮箱字段，保存成功

### 测试场景 2: 单独保存手机号

1. 只打开手机号编辑模式
2. 输入新手机号
3. 发送并输入验证码
4. 点击"保存"
5. **预期**：✅ 验证手机号字段，保存成功

### 测试场景 3: 同时编辑，先保存邮箱

1. 打开邮箱编辑模式
2. 打开手机号编辑模式
3. 填写邮箱信息和验证码
4. **不填写**手机号信息
5. 点击邮箱的"保存"
6. **预期**：
   - ✅ 验证邮箱字段（通过）
   - ✅ 提交邮箱修改
   - ✅ 邮箱编辑模式关闭
   - ✅ 手机号编辑模式保持打开
   - ❌ **不会**提示手机号的错误

### 测试场景 4: 同时编辑，先保存手机号

1. 打开邮箱编辑模式
2. 打开手机号编辑模式
3. **不填写**邮箱信息
4. 填写手机号信息和验证码
5. 点击手机号的"保存"
6. **预期**：
   - ✅ 验证手机号字段（通过）
   - ✅ 提交手机号修改
   - ✅ 手机号编辑模式关闭
   - ✅ 邮箱编辑模式保持打开
   - ❌ **不会**提示邮箱的错误

### 测试场景 5: 验证失败的字段

1. 同时打开邮箱和手机号编辑
2. 邮箱填写不完整（缺少验证码）
3. 点击邮箱的"保存"
4. **预期**：
   - ✅ 验证邮箱字段
   - ✅ 提示"请输入邮箱验证码"
   - ❌ **不会**提示手机号的错误

## 相关文件

- `src/views/ProfileEditView.vue`
  - 第 834-923 行：`validateSpecificField` 函数（新增）
  - 第 925-933 行：`validateField` 函数（重构）
  - 第 935-943 行：`saveField` 函数（修改验证逻辑）

## 更新日期

2026-05-02
