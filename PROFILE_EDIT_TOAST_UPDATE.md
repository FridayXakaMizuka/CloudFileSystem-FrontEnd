# ProfileEditView Toast 消息提示改造

## 改造概述

将 ProfileEditView 中除了密码修改确认框（`confirm`）之外的所有 `alert` 消息替换为 Element UI 风格的 Toast 消息提示。

## 改造范围

### ✅ 已替换的消息类型

1. **验证错误消息** - 使用 `showError()`
2. **成功消息** - 使用 `showSuccess()`
3. **系统错误消息** - 使用 `showError()`

### ⚠️ 保留的阻塞式交互

1. **`goBack()` 中的确认框** - 保留 `confirm()`，因为需要用户明确确认是否放弃未保存的更改
2. **`cancelEdit()` 中的确认框** - 保留 `confirm()`，因为需要用户确认是否放弃修改

---

## 详细修改清单

### 1. 字段保存函数 (`saveField`)

#### 1.1 验证错误
```javascript
// ❌ 修改前
if (validationError) {
  alert(validationError.message)
  return
}

// ✅ 修改后
if (validationError) {
  showError(validationError.message)
  return
}
```

#### 1.2 未登录错误
```javascript
// ❌ 修改前
if (!token) {
  alert('用户未登录，请重新登录')
  router.push('/login')
  return
}

// ✅ 修改后
if (!token) {
  showError('用户未登录，请重新登录')
  router.push('/login')
  return
}
```

#### 1.3 昵称修改
```javascript
// 检查未变化
if (newNickname === userInfo.value.nickname) {
  showError('昵称未发生变化')  // ✅
  return
}

// 成功
if (response.ok && result.success === true) {
  showSuccess(result.message || '昵称修改成功！')  // ✅
  // ...
} else {
  showError(result.message || '昵称修改失败')  // ✅
}
```

#### 1.4 邮箱修改
```javascript
// 检查未变化
if (newEmail === userInfo.value.email) {
  showError('邮箱未发生变化')  // ✅
  return
}

// 验证码为空
if (!emailCode || emailCode.trim() === '') {
  showError('请输入邮箱验证码')  // ✅
  return
}

// 未发送验证码
if (!emailSessionId.value) {
  showError('请先发送邮箱验证码')  // ✅
  return
}

// RSA 密钥加载失败
if (!emailRsaPublicKey.value) {
  showError('系统初始化失败，请刷新页面重试')  // ✅
  return
}

// 成功
if (response.ok && result.success === true) {
  showSuccess(result.message || '邮箱修改成功！')  // ✅
  // ...
} else {
  showError(result.message || '邮箱修改失败')  // ✅
}
```

#### 1.5 手机号修改
```javascript
// 检查未变化
if (newPhone === userInfo.value.phone) {
  showError('手机号未发生变化')  // ✅
  return
}

// 验证码为空
if (!phoneCode || phoneCode.trim() === '') {
  showError('请输入手机验证码')  // ✅
  return
}

// 未发送验证码
if (!phoneSessionId.value) {
  showError('请先发送手机验证码')  // ✅
  return
}

// RSA 密钥加载失败
if (!phoneRsaPublicKey.value) {
  showError('系统初始化失败，请刷新页面重试')  // ✅
  return
}

// 成功
if (response.ok && result.success === true) {
  showSuccess(result.message || '手机号修改成功！')  // ✅
  // ...
} else {
  showError(result.message || '手机号修改失败')  // ✅
}
```

#### 1.6 网络错误
```javascript
// ❌ 修改前
catch (error) {
  logger.error('修改失败:', error)
  alert('网络错误，请稍后重试')
}

// ✅ 修改后
catch (error) {
  logger.error('修改失败:', error)
  showError('网络错误，请稍后重试')
}
```

---

### 2. 头像上传 (`handleAvatarChange`)

```javascript
// ❌ 修改前
alert(result.message || '头像设置成功！')
logger.info('头像上传成功', result)
} catch (error) {
  logger.error('头像上传失败:', error)
  alert('头像上传失败：' + error.message)

// ✅ 修改后
showSuccess(result.message || '头像设置成功！')
logger.info('头像上传成功', result)
} catch (error) {
  logger.error('头像上传失败:', error)
  showError('头像上传失败：' + error.message)
```

---

### 3. 旧版表单验证 (`validateForm`)

虽然这个函数目前未被调用，但为了代码整洁也进行了替换：

```javascript
// 密码验证
if (!editForm.value.oldPassword) {
  showError('请输入当前密码')  // ✅
  return false
}

if (!editForm.value.newPassword) {
  showError('请输入新密码')  // ✅
  return false
}

if (editForm.value.newPassword.length < 6 || editForm.value.newPassword.length > 14) {
  showError('新密码长度应在6-14位之间')  // ✅
  return false
}

if (/[^a-zA-Z0-9_]/.test(editForm.value.newPassword)) {
  showError('新密码只能包含字母、数字和下划线')  // ✅
  return false
}

if (editForm.value.newPassword !== editForm.value.confirmPassword) {
  showError('两次输入的新密码不一致')  // ✅
  return false
}

// 昵称验证
if (!editForm.value.nickname.trim()) {
  showError('昵称不能为空')  // ✅
  return false
}

// 邮箱验证
if (!emailRegex.test(editForm.value.email)) {
  showError('请输入有效的邮箱地址')  // ✅
  return false
}

// 手机号验证
if (!phoneRegex.test(editForm.value.phone)) {
  showError('请输入有效的11位手机号')  // ✅
  return false
}
```

---

### 4. 旧版保存函数 (`saveProfile`)

同样未被调用，但也进行了替换：

```javascript
// 密码验证提示
if (hasNonAvatarChanges && !isPasswordVerified.value) {
  showError('请先在"修改验证"栏目中验证原密码，才能修改个人信息')  // ✅
  scrollToSection('verification')
  return
}

// 保存成功
showSuccess('保存成功！')  // ✅
hasChanges.value = false

// 保存失败
catch (error) {
  logger.error('保存失败:', error)
  showError('保存失败，请重试')  // ✅
}
```

---

## Toast 工具使用说明

### 导入
```javascript
import { showSuccess, showError } from '@/utils/toast'
```

### API

#### `showSuccess(message, duration?)`
显示成功消息（绿色）
- `message`: 消息内容
- `duration`: 显示时长（毫秒），默认 3000

#### `showError(message, duration?)`
显示错误消息（红色）
- `message`: 消息内容
- `duration`: 显示时长（毫秒），默认 3000

#### `showInfo(message, duration?)`
显示信息消息（蓝色）
- `message`: 消息内容
- `duration`: 显示时长（毫秒），默认 3000

#### `showWarning(message, duration?)`
显示警告消息（橙色）
- `message`: 消息内容
- `duration`: 显示时长（毫秒），默认 3000

### 特性

1. **非阻塞式** - 不会中断用户操作
2. **自动关闭** - 默认 3 秒后自动消失
3. **消息队列** - 多个消息会依次显示
4. **手动关闭** - 点击 × 按钮可立即关闭
5. **悬停暂停** - 鼠标悬停时暂停自动关闭
6. **响应式设计** - 适配移动端和桌面端

---

## 测试场景

### 测试 1: 昵称修改
1. 点击昵称的"修改"按钮
2. 输入新昵称并保存
3. **预期**：✅ 右上角显示绿色 Toast "昵称修改成功！"

### 测试 2: 邮箱修改
1. 点击邮箱的"修改"按钮
2. 输入新邮箱
3. 点击"发送验证码"
4. 输入验证码并保存
5. **预期**：✅ 右上角显示绿色 Toast "邮箱修改成功！"

### 测试 3: 手机号修改
1. 点击手机号的"修改"按钮
2. 输入新手机号
3. 点击"发送验证码"
4. 输入验证码并保存
5. **预期**：✅ 右上角显示绿色 Toast "手机号修改成功！"

### 测试 4: 验证错误
1. 点击昵称的"修改"按钮
2. 清空昵称并保存
3. **预期**：❌ 右上角显示红色 Toast "昵称不能为空"

### 测试 5: 头像上传
1. 点击头像区域
2. 选择一张图片
3. **预期**：✅ 右上角显示绿色 Toast "头像设置成功！"

### 测试 6: 网络错误
1. 断开网络连接
2. 尝试修改任何字段
3. **预期**：❌ 右上角显示红色 Toast "网络错误，请稍后重试"

---

## 相关文件

- [ProfileEditView.vue](file:///C:/Users/ROG/Desktop/develop/FrontEnd/CloudFileSystem/src/views/ProfileEditView.vue)
  - 第 439 行：导入 `showSuccess`, `showError`
  - 第 942-1275 行：`saveField` 函数中的所有 alert 替换
  - 第 1287-1317 行：`handleAvatarChange` 函数中的 alert 替换
  - 第 1638-1688 行：`validateForm` 函数中的 alert 替换
  - 第 1693-1766 行：`saveProfile` 函数中的 alert 替换

- [toast.js](file:///C:/Users/ROG/Desktop/develop/FrontEnd/CloudFileSystem/src/utils/toast.js)
  - Toast 消息提示工具的实现

---

## 更新日期

2026-05-02
