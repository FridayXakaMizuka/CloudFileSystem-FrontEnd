# Toast 消息提示 - 快速参考

## 导入

```javascript
import { showSuccess, showError, showInfo, showWarning } from '@/utils/toast'
```

## API

### 快捷方法

```javascript
showSuccess(message, duration?)  // 成功消息（绿色）
showError(message, duration?)    // 错误消息（红色）
showInfo(message, duration?)     // 信息消息（蓝色）
showWarning(message, duration?)  // 警告消息（黄色）
```

### 通用方法

```javascript
showToast(message, type?, duration?)
// type: 'success' | 'error' | 'info' | 'warning'
// duration: 毫秒，默认 3000
```

### 清除所有

```javascript
clearAllToasts()  // 立即清除所有消息
```

## 常用示例

### 验证码发送

```javascript
// 成功
showSuccess('邮箱验证码已发送')
showSuccess('手机验证码已发送')

// 失败
showError('邮箱验证码发送失败')
showError('手机验证码发送失败')

// 验证错误
showError('请输入有效的邮箱地址')
showError('请输入有效的11位手机号')

// 网络错误
showError('网络错误，请稍后重试')
```

### 表单操作

```javascript
// 保存成功
showSuccess('保存成功')

// 保存失败
showError('保存失败，请重试')

// 验证失败
showError('请填写必填字段')
```

### 自定义时长

```javascript
// 短消息：2 秒
showSuccess('复制成功', 2000)

// 长消息：5 秒
showInfo('这是一条较长的消息', 5000)
```

## 消息类型对照

| 方法 | 颜色 | 图标 | 用途 |
|------|------|------|------|
| `showSuccess()` | 绿色 | ✓ | 操作成功 |
| `showError()` | 红色 | ✕ | 错误/失败 |
| `showInfo()` | 蓝色 | ℹ | 信息提示 |
| `showWarning()` | 黄色 | ⚠ | 警告提醒 |

## 替换 alert

```javascript
// ❌ 修改前（阻塞）
alert('操作成功')
alert('操作失败')
alert('请输入有效信息')

// ✅ 修改后（非阻塞）
showSuccess('操作成功')
showError('操作失败')
showError('请输入有效信息')
```

## 特性

- ✅ 非阻塞，不中断用户操作
- ✅ 自动关闭（默认 3 秒）
- ✅ 手动关闭（× 按钮）
- ✅ 悬停暂停
- ✅ 消息队列
- ✅ 响应式设计
- ✅ XSS 防护

## 位置

- **桌面端**：右上角（20px, 20px）
- **移动端**：顶部全宽（10px 边距）

## 完整示例

```javascript
import { showSuccess, showError } from '@/utils/toast'

const handleSubmit = async () => {
  // 验证
  if (!formData.email) {
    showError('请输入邮箱地址')
    return
  }
  
  try {
    const result = await api.submit(formData)
    
    if (result.success) {
      showSuccess('提交成功')
      router.back()
    } else {
      showError(result.message || '提交失败')
    }
  } catch (error) {
    showError('网络错误，请稍后重试')
  }
}
```

## 相关文件

- **工具**：`src/utils/toast.js`
- **样式**：`src/assets/main.css`
- **指南**：`TOAST_USAGE_GUIDE.md`
- **总结**：`TOAST_IMPLEMENTATION_SUMMARY.md`
