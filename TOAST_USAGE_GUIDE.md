# Toast 消息提示使用指南

## 概述

Toast 是一个非阻塞的响应式消息提示组件，用于替代传统的 `alert()` 对话框。它不会阻塞主进程，提供更好的用户体验。

## 特性

- ✅ **非阻塞**：不会中断用户操作
- ✅ **响应式动画**：平滑的滑入滑出效果
- ✅ **消息队列**：自动管理多个消息的显示顺序
- ✅ **四种类型**：success、error、info、warning
- ✅ **自动关闭**：默认 3 秒后自动消失
- ✅ **手动关闭**：点击 × 按钮可立即关闭
- ✅ **悬停暂停**：鼠标悬停时暂停自动关闭
- ✅ **移动端适配**：响应式设计，支持各种屏幕尺寸

## 安装与导入

Toast 工具已经集成到项目中，无需额外安装。

```javascript
import { showSuccess, showError, showInfo, showWarning } from '@/utils/toast'
```

## 使用方法

### 1. 成功消息（绿色）

```javascript
showSuccess('邮箱验证码已发送')
showSuccess('操作成功', 2000)  // 自定义显示时长（毫秒）
```

### 2. 错误消息（红色）

```javascript
showError('邮箱验证码发送失败')
showError('网络错误，请稍后重试')
```

### 3. 信息消息（蓝色）

```javascript
showInfo('这是一条提示信息')
```

### 4. 警告消息（黄色）

```javascript
showWarning('请注意检查输入内容')
```

### 5. 通用方法

```javascript
import { showToast } from '@/utils/toast'

showToast('自定义消息', 'success', 3000)
showToast('自定义消息', 'error', 5000)
showToast('自定义消息', 'info', 2000)
showToast('自定义消息', 'warning', 4000)
```

### 6. 清除所有消息

```javascript
import { clearAllToasts } from '@/utils/toast'

clearAllToasts()  // 立即清除所有显示的消息
```

## 实际应用场景

### 场景 1：验证码发送

```javascript
// 修改前（阻塞）
alert('验证码已发送到您的邮箱')

// 修改后（非阻塞）
showSuccess('邮箱验证码已发送')
```

### 场景 2：表单验证失败

```javascript
// 修改前（阻塞）
alert('请输入有效的邮箱地址')

// 修改后（非阻塞）
showError('请输入有效的邮箱地址')
```

### 场景 3：网络错误

```javascript
// 修改前（阻塞）
alert('网络错误，请稍后重试')

// 修改后（非阻塞）
showError('网络错误，请稍后重试')
```

### 场景 4：操作成功

```javascript
// 保存成功后显示提示
if (response.ok) {
  showSuccess('保存成功')
  router.back()
}
```

## 样式说明

### 消息位置
- **桌面端**：右上角（top: 20px, right: 20px）
- **移动端**：顶部全宽（top: 10px, left: 10px, right: 10px）

### 消息尺寸
- **最小宽度**：300px
- **最大宽度**：500px
- **内边距**：16px 20px

### 颜色方案
- **成功（success）**：绿色渐变 `#52c41a` → `#73d13d`
- **错误（error）**：红色渐变 `#ff4d4f` → `#ff6b6b`
- **信息（info）**：蓝色渐变 `#1890ff` → `#40a9ff`
- **警告（warning）**：黄色渐变 `#faad14` → `#ffc107`

### 动画效果
- **进入动画**：从右侧滑入（0.3s）
- **离开动画**：向右侧滑出（0.3s）
- **背景模糊**：backdrop-filter: blur(10px)

## 高级功能

### 消息队列

当同时显示多个消息时，Toast 会自动将它们加入队列，按顺序依次显示：

```javascript
showSuccess('第一条消息')
showError('第二条消息')
showInfo('第三条消息')

// 结果：三条消息会依次显示，每条显示 3 秒
```

### 悬停暂停

鼠标悬停在消息上时，自动关闭会暂停，移开后 1 秒再关闭：

```javascript
// 用户可以将鼠标移到消息上仔细阅读
// 移开鼠标后 1 秒自动关闭
```

### XSS 防护

所有消息内容都会经过 HTML 转义，防止 XSS 攻击：

```javascript
// 安全：特殊字符会被转义
showSuccess('<script>alert("xss")</script>')
// 显示为纯文本，不会执行脚本
```

## 最佳实践

### 1. 选择合适的消息类型

- **成功操作**：使用 `showSuccess()`
  - 表单提交成功
  - 数据保存成功
  - 验证码发送成功

- **错误提示**：使用 `showError()`
  - 表单验证失败
  - 网络请求失败
  - 操作失败

- **一般信息**：使用 `showInfo()`
  - 操作提示
  - 状态说明

- **警告提醒**：使用 `showWarning()`
  - 重要提醒
  - 需要注意的事项

### 2. 简洁明了的消息文案

```javascript
// ✅ 好的做法
showSuccess('邮箱验证码已发送')
showError('请输入有效的邮箱地址')

// ❌ 不好的做法
showSuccess('验证码已经成功发送到您的邮箱，请注意查收')
showError('您输入的邮箱地址格式不正确，请重新输入正确的邮箱地址')
```

### 3. 避免过度使用

```javascript
// ✅ 好的做法：只在关键操作时显示
if (result.success) {
  showSuccess('保存成功')
  router.back()
}

// ❌ 不好的做法：每个步骤都显示
showInfo('正在验证...')
showInfo('验证通过')
showInfo('正在保存...')
showSuccess('保存成功')
```

### 4. 合理的显示时长

```javascript
// 短消息：2 秒
showSuccess('复制成功', 2000)

// 普通消息：3 秒（默认）
showSuccess('保存成功')

// 长消息：5 秒
showInfo('这是一条比较长的消息，需要更多时间阅读', 5000)
```

## 技术实现

### 核心原理

1. **DOM 动态创建**：每次显示消息时动态创建 DOM 元素
2. **CSS 动画**：使用 CSS transition 实现平滑动画
3. **消息队列**：使用数组管理待显示的消息
4. **定时器管理**：自动关闭和悬停暂停功能

### 性能优化

- **单例模式**：同一时间只显示一条消息
- **及时清理**：消息隐藏后立即从 DOM 中移除
- **防抖处理**：避免频繁创建销毁 DOM

## 常见问题

### Q1: 为什么消息不显示？

**A**: 检查以下几点：
1. 是否正确导入了 toast 函数
2. 是否调用了正确的函数（showSuccess/showError 等）
3. 浏览器控制台是否有错误信息

### Q2: 如何同时显示多条消息？

**A**: Toast 采用队列机制，会自动按顺序显示。如果需要同时显示，可以考虑修改源码或使用其他 UI 库。

### Q3: 如何自定义样式？

**A**: 修改 `src/assets/main.css` 中的 `.app-toast` 相关样式。

### Q4: 消息显示时间太短/太长怎么办？

**A**: 传入第二个参数自定义时长：
```javascript
showSuccess('消息内容', 5000)  // 5 秒
```

## 迁移指南

### 从 alert 迁移到 Toast

**步骤 1**：导入 toast 函数
```javascript
import { showSuccess, showError } from '@/utils/toast'
```

**步骤 2**：替换 alert 调用
```javascript
// 修改前
alert('操作成功')
alert('操作失败')

// 修改后
showSuccess('操作成功')
showError('操作失败')
```

**步骤 3**：根据消息性质选择合适的类型
- 成功 → `showSuccess()`
- 失败/错误 → `showError()`
- 提示 → `showInfo()`
- 警告 → `showWarning()`

## 示例代码

### 完整示例：注册页面验证码发送

```javascript
import { showSuccess, showError } from '@/utils/toast'

const handleSendVerificationCode = async () => {
  // 验证邮箱格式
  if (!isEmailValid.value) {
    showError('请输入有效的邮箱地址')
    return
  }

  isSendingCode.value = true

  try {
    const result = await sendVerificationCode(email)

    if (result.success) {
      showSuccess('邮箱验证码已发送')
      // 启动倒计时...
    } else {
      showError(result.message || '邮箱验证码发送失败')
    }
  } catch (error) {
    showError('网络错误，请稍后重试')
  } finally {
    isSendingCode.value = false
  }
}
```

## 相关文件

- **工具文件**：`src/utils/toast.js`
- **样式文件**：`src/assets/main.css`（Toast 样式部分）
- **使用示例**：
  - `src/views/RegisterView.vue`
  - `src/views/ProfileEditView.vue`

## 更新日志

### v1.0.0 (2024-05-01)
- ✅ 初始版本发布
- ✅ 支持四种消息类型
- ✅ 消息队列管理
- ✅ 响应式动画
- ✅ 移动端适配
- ✅ XSS 防护
