# 邮箱手机号修改独立性与缓存同步修复

## 问题描述

### 问题 1: 邮箱和手机号修改互相干扰

**现象**：
- 同时打开邮箱和手机号的编辑模式
- 点击其中一个的“保存”按钮
- **结果**：验证的是最后一个激活的字段，而不是要保存的字段
- **例如**：先打开邮箱编辑，再打开手机号编辑，点击邮箱的“保存”，却提示手机号的错误

**根本原因**：
1. `validateField()` 函数验证的是**最后一个激活的字段**（第 845-846 行）
2. `saveField()` 调用 `validateField()`，导致验证错误的字段
3. `isFieldValid` 是计算属性，只检查第一个编辑字段

### 问题 2: 缓存同步不完整

**现象**：
- 修改邮箱或手机号成功后
- 刷新页面后显示的还是旧值
- 其他页面获取的缓存也是旧值

**根本原因**：
- 虽然调用了 `updateUserInfoField()`，但可能没有正确更新 sessionStorage

## 修复内容

### 1. 将 `isFieldValid` 从计算属性改为函数

**修改前** ❌：
```javascript
const isFieldValid = computed(() => {
  const field = editingField.value  // 只获取第一个字段
  if (!field) return false
  
  if (fieldError.value) return false  // 检查全局错误
  
  // ... 验证逻辑
})
```

**问题**：
- 只能验证第一个编辑字段
- 多个字段同时编辑时，无法分别验证

**修改后** ✅：
```javascript
const isFieldValid = (field) => {
  if (!field || !editingFields.value.has(field)) return false
  
  // 检查该字段的特定错误
  if (fieldError.value && fieldError.value.field === field) return false
  
  if (field === 'password') {
    return editForm.value.oldPassword && 
           editForm.value.newPassword && 
           editForm.value.confirmPassword &&
           editForm.value.newPassword === editForm.value.confirmPassword
  } else if (field === 'email') {
    return editForm.value.email !== userInfo.value.email &&
           editForm.value.emailVerificationCode &&
           emailSessionId.value
  } else if (field === 'phone') {
    return editForm.value.phone !== userInfo.value.phone &&
           editForm.value.phoneVerificationCode &&
           phoneSessionId.value
  }
  return editForm.value[field] !== userInfo.value[field]
}
```

**优势**：
- ✅ 可以分别验证每个字段
- ✅ 支持多个字段同时编辑
- ✅ 错误检查针对特定字段

### 2. 修改按钮的 disabled 绑定

**修改前** ❌：
```vue
<button @click="saveField('email')" :disabled="isSaving || !isFieldValid">
```

**修改后** ✅：
```vue
<button @click="saveField('email')" :disabled="isSaving || !isFieldValid('email')">
```

**所有按钮都已更新**：
- 昵称：`:disabled="isSaving || !isFieldValid('nickname')"`
- 邮箱：`:disabled="isSaving || !isFieldValid('email')"`
- 手机号：`:disabled="isSaving || !isFieldValid('phone')"`
- 密码：`:disabled="isSaving || !isFieldValid('password')"`

### 3. 修复保存成功后退出编辑模式的逻辑

**修改前** ❌：
```javascript
// 昵称修改成功
editingField.value = ''  // 清除所有编辑状态

// 邮箱修改成功
editingField.value = ''  // 清除所有编辑状态

// 手机号修改成功
editingFields.value.delete('phone')  // ✅ 正确做法
```

**修改后** ✅：
```javascript
// 昵称修改成功
editingFields.value.delete('nickname')  // 只关闭当前字段

// 邮箱修改成功
editingFields.value.delete('email')  // 只关闭当前字段

// 手机号修改成功
editingFields.value.delete('phone')  // 保持不变
```

**优势**：
- ✅ 只关闭当前保存的字段
- ✅ 其他正在编辑的字段保持打开状态
- ✅ 支持多个字段独立编辑和保存

### 4. 缓存同步验证

现有的缓存同步逻辑（已正确实现）：

```javascript
// 邮箱修改成功
userInfo.value.email = newEmail
updateUserInfoField('email', newEmail)  // ✅ 更新 sessionStorage
localStorage.setItem('userEmail', newEmail)  // ✅ 更新 localStorage

// 手机号修改成功
userInfo.value.phone = newPhone
updateUserInfoField('phone', newPhone)  // ✅ 更新 sessionStorage
localStorage.setItem('userPhone', newPhone)  // ✅ 更新 localStorage
```

**脱敏显示**（已实现）：
```javascript
// 邮箱打码
const maskEmail = (email) => {
  if (!email) return '未设置'
  const [name, domain] = email.split('@')
  if (!domain) return email
  const maskedName = name.charAt(0) + '***' + name.charAt(name.length - 1)
  return `${maskedName}@${domain}`
}

// 手机号打码
const maskPhone = (phone) => {
  if (!phone) return '未设置'
  if (phone.length !== 11) return phone
  return phone.substring(0, 3) + '****' + phone.substring(7)
}
```

**模板中使用**：
```vue
<!-- 邮箱只读模式 -->
<div v-if="!editingFields.has('email')" class="info-display-item">
  <div class="info-label">
    <span class="label-icon">📧</span>
    邮箱地址
  </div>
  <div class="info-value">
    <span>{{ maskEmail(userInfo.email) }}</span>  <!-- ✅ 脱敏显示 -->
    <button class="btn-edit" @click="startEdit('email')">
      <span class="edit-icon">✏️</span>
      修改
    </button>
  </div>
</div>

<!-- 手机号只读模式 -->
<div v-if="!editingFields.has('phone')" class="info-display-item">
  <div class="info-label">
    <span class="label-icon">📱</span>
    手机号
  </div>
  <div class="info-value">
    <span>{{ maskPhone(userInfo.phone) }}</span>  <!-- ✅ 脱敏显示 -->
    <button class="btn-edit" @click="startEdit('phone')">
      <span class="edit-icon">✏️</span>
      修改
    </button>
  </div>
</div>
```

## 工作流程对比

### 修改前的流程（有问题）

```
用户打开邮箱编辑
  ↓
用户打开手机号编辑
  ↓
点击邮箱的"保存"
  ↓
isFieldValid 检查第一个字段（可能是邮箱）
  ↓
提交邮箱修改
  ↓
✅ 邮箱修改成功
  ↓
editingField.value = ''  ← ❌ 清除所有编辑状态
  ↓
❌ 手机号编辑也被关闭了
```

### 修改后的流程（正确）

```
用户打开邮箱编辑
  ↓
用户打开手机号编辑
  ↓
点击邮箱的"保存"
  ↓
isFieldValid('email') 检查邮箱字段  ← ✅ 针对性验证
  ↓
提交邮箱修改
  ↓
✅ 邮箱修改成功
  ↓
editingFields.value.delete('email')  ← ✅ 只关闭邮箱
  ↓
✅ 手机号编辑保持打开状态
```

## 测试场景

### 测试场景 1: 独立编辑邮箱

1. 进入个人信息页面
2. 点击"邮箱地址"的"修改"按钮
3. 输入新邮箱
4. 点击"发送验证码"
5. 输入验证码
6. 点击"保存"
7. **预期**：
   - ✅ 邮箱修改成功
   - ✅ 邮箱编辑模式关闭
   - ✅ 显示脱敏后的新邮箱（如 `t***t@example.com`）
   - ✅ 刷新页面后仍显示新邮箱

### 测试场景 2: 独立编辑手机号

1. 进入个人信息页面
2. 点击"手机号"的"修改"按钮
3. 输入新手机号
4. 点击"发送验证码"
5. 输入验证码
6. 点击"保存"
7. **预期**：
   - ✅ 手机号修改成功
   - ✅ 手机号编辑模式关闭
   - ✅ 显示脱敏后的新手机号（如 `138****5678`）
   - ✅ 刷新页面后仍显示新手机号

### 测试场景 3: 同时编辑邮箱和手机号

1. 进入个人信息页面
2. 点击"邮箱地址"的"修改"按钮
3. 点击"手机号"的"修改"按钮
4. **预期**：
   - ✅ 两个编辑模式都打开
   - ✅ 邮箱的保存按钮根据邮箱状态启用/禁用
   - ✅ 手机号的保存按钮根据手机号状态启用/禁用
5. 填写邮箱信息并点击"保存"
6. **预期**：
   - ✅ 邮箱修改成功
   - ✅ 邮箱编辑模式关闭
   - ✅ **手机号编辑模式仍然打开**
7. 填写手机号信息并点击"保存"
8. **预期**：
   - ✅ 手机号修改成功
   - ✅ 手机号编辑模式关闭

### 测试场景 4: 缓存同步验证

1. 修改邮箱成功
2. 刷新页面
3. **预期**：
   - ✅ 显示新的脱敏邮箱
   - ✅ 控制台日志显示从缓存加载了新邮箱
4. 跳转到其他页面（如 Dashboard）
5. **预期**：
   - ✅ 其他页面也能获取到新的邮箱信息

## 相关文件

- `src/views/ProfileEditView.vue`
  - 第 693-718 行：`isFieldValid` 函数（从计算属性改为普通函数）
  - 第 132、212、283、371 行：按钮的 disabled 绑定
  - 第 1055-1057 行：昵称保存后退出编辑模式
  - 第 1145-1150 行：邮箱保存后退出编辑模式
  - 第 1239-1244 行：手机号保存后退出编辑模式
  - 第 654-669 行：邮箱和手机号脱敏函数

- `src/utils/userInfo.js`
  - `updateUserInfoField()` - 更新 sessionStorage 缓存
  - `getCachedUserInfo()` - 从 sessionStorage 读取缓存

## 更新日期

2026-05-02
