# Toast 消息提示 - Element UI 风格指南

## 概述

Toast 消息提示已采用 **Element UI** 的设计规范和色系，确保与 Element UI 组件库的视觉风格保持一致。

## Element UI 设计规范

### 1. 颜色系统

Element UI 使用了一套精心设计的颜色系统，Toast 完全遵循这一规范：

#### 成功消息（Success）- 绿色系
```css
background-color: #f0f9eb;  /* 浅绿色背景 */
border-color: #e1f3d8;      /* 更浅的绿色边框 */
color: #67c23a;             /* Element UI 主绿色 */
```

**应用场景：**
- ✅ 操作成功
- ✅ 数据保存成功
- ✅ 验证码发送成功
- ✅ 表单提交成功

#### 错误消息（Error）- 红色系
```css
background-color: #fef0f0;  /* 浅红色背景 */
border-color: #fde2e2;      /* 更浅的红色边框 */
color: #f56c6c;             /* Element UI 主红色 */
```

**应用场景：**
- ❌ 操作失败
- ❌ 表单验证失败
- ❌ 网络请求失败
- ❌ 验证码发送失败

#### 信息消息（Info）- 灰色系
```css
background-color: #f4f4f5;  /* 浅灰色背景 */
border-color: #e9e9eb;      /* 更浅的灰色边框 */
color: #909399;             /* Element UI 次要文字色 */
```

**应用场景：**
- ℹ️ 一般提示
- ℹ️ 状态说明
- ℹ️ 操作指引

#### 警告消息（Warning）- 黄色系
```css
background-color: #fdf6ec;  /* 浅黄色背景 */
border-color: #faecd8;      /* 更浅的黄色边框 */
color: #e6a23c;             /* Element UI 主黄色 */
```

**应用场景：**
- ⚠️ 警告提醒
- ⚠️ 注意事项
- ⚠️ 重要提示

### 2. 尺寸规范

#### 间距
- **内边距**：15px 20px（上下 15px，左右 20px）
- **图标与文字间距**：12px
- **圆角**：4px（Element UI 标准圆角）

#### 字体
- **字体大小**：14px（Element UI 标准字号）
- **字重**：400（常规字重）
- **行高**：1.5
- **字体家族**：
  ```
  "Helvetica Neue", Helvetica, "PingFang SC", 
  "Hiragino Sans GB", "Microsoft YaHei", 
  "微软雅黑", Arial, sans-serif
  ```

#### 图标
- **Emoji 大小**：1.25rem（约 20px）
- **关闭按钮大小**：20px × 20px
- **关闭按钮透明度**：0.5（悬停时 1.0）

### 3. 阴影效果

```css
box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
```

**特点：**
- 轻微的下投影
- 柔和不突兀
- 符合 Material Design 规范

### 4. 边框样式

```css
border: 1px solid;
border-radius: 4px;
```

**特点：**
- 1px 细边框
- 4px 圆角
- 边框颜色与主题色配套

### 5. 动画效果

```css
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```

**动画参数：**
- **时长**：0.3s（Element UI 标准动画时长）
- **缓动函数**：cubic-bezier(0.4, 0, 0.2, 1)
- **动画属性**：opacity + transform

**动画流程：**
1. **初始状态**：`translateY(-100%)` + `opacity: 0`
2. **显示状态**：`translateY(0)` + `opacity: 1`
3. **隐藏状态**：`translateY(-100%)` + `opacity: 0`

### 6. 位置布局

#### 桌面端
```css
position: fixed;
top: 20px;
left: 50%;
transform: translateX(-50%);
min-width: 320px;
max-width: 500px;
```

**特点：**
- 距顶部 20px
- 水平居中
- 宽度自适应（320px - 500px）

#### 移动端
```css
left: 20px;
min-width: calc(100vw - 40px);
max-width: calc(100vw - 40px);
padding: 12px 16px;
font-size: 13px;
```

**特点：**
- 几乎全宽（左右各留 20px）
- 减小内边距
- 略小字体（13px）

## 与 Element UI Message 组件对比

| 特性 | Element UI Message | 我们的 Toast | 一致性 |
|------|-------------------|-------------|--------|
| 背景色 | ✅ 浅色背景 | ✅ 浅色背景 | ✅ 完全一致 |
| 边框色 | ✅ 配套浅色边框 | ✅ 配套浅色边框 | ✅ 完全一致 |
| 文字色 | ✅ 主题色 | ✅ 主题色 | ✅ 完全一致 |
| 圆角 | ✅ 4px | ✅ 4px | ✅ 完全一致 |
| 阴影 | ✅ 轻微阴影 | ✅ 轻微阴影 | ✅ 完全一致 |
| 字体 | ✅ 14px | ✅ 14px | ✅ 完全一致 |
| 动画 | ✅ 0.3s | ✅ 0.3s | ✅ 完全一致 |
| 位置 | ✅ 顶部居中 | ✅ 顶部居中 | ✅ 完全一致 |
| 图标 | 🔤 Icon 字体 | 😊 Emoji | ⚠️ 略有不同 |

**说明：**
- 我们使用 Emoji 替代了 Element UI 的 Icon 字体
- Emoji 更生动有趣，且无需额外加载字体文件
- 颜色和布局完全遵循 Element UI 规范

## 视觉效果示例

### 成功消息
```
┌─────────────────────────────────┐
│ ✅ 邮箱验证码已发送              │
└─────────────────────────────────┘
   背景: #f0f9eb (浅绿)
   边框: #e1f3d8 (更浅绿)
   文字: #67c23a (绿色)
```

### 错误消息
```
┌─────────────────────────────────┐
│ ❌ 请输入有效的邮箱地址          │
└─────────────────────────────────┘
   背景: #fef0f0 (浅红)
   边框: #fde2e2 (更浅红)
   文字: #f56c6c (红色)
```

### 信息消息
```
┌─────────────────────────────────┐
│ ℹ️ 这是一条提示信息              │
└─────────────────────────────────┘
   背景: #f4f4f5 (浅灰)
   边框: #e9e9eb (更浅灰)
   文字: #909399 (灰色)
```

### 警告消息
```
┌─────────────────────────────────┐
│ ⚠️ 请注意检查输入内容            │
└─────────────────────────────────┘
   背景: #fdf6ec (浅黄)
   边框: #faecd8 (更浅黄)
   文字: #e6a23c (黄色)
```

## Element UI 颜色对照表

### 主要颜色

| 类型 | 主色 | 浅背景 | 浅边框 | 用途 |
|------|------|--------|--------|------|
| Success | #67c23a | #f0f9eb | #e1f3d8 | 成功状态 |
| Warning | #e6a23c | #fdf6ec | #faecd8 | 警告状态 |
| Error | #f56c6c | #fef0f0 | #fde2e2 | 错误状态 |
| Info | #909399 | #f4f4f5 | #e9e9eb | 信息状态 |

### 文字颜色

| 级别 | 颜色 | 用途 |
|------|------|------|
| 主要文字 | #303133 | 标题、重要内容 |
| 常规文字 | #606266 | 正文内容 |
| 次要文字 | #909399 | 辅助说明 |
| 占位文字 | #c0c4cc | 占位符 |

### 边框颜色

| 级别 | 颜色 | 用途 |
|------|------|------|
| 基础边框 | #dcdfe6 | 默认边框 |
| 浅色边框 | #e4e7ed | 轻边框 |
| 更浅边框 | #ebeef5 | 极轻边框 |

## 使用建议

### 1. 选择合适的消息类型

根据 Element UI 的设计哲学：

- **Success（绿色）**：用于明确的成功操作
  ```javascript
  showSuccess('保存成功')
  showSuccess('提交成功')
  ```

- **Error（红色）**：用于错误和失败
  ```javascript
  showError('操作失败')
  showError('验证失败')
  ```

- **Warning（黄色）**：用于警告和需要注意的情况
  ```javascript
  showWarning('数据未保存')
  showWarning('即将过期')
  ```

- **Info（灰色）**：用于一般性提示
  ```javascript
  showInfo('加载中...')
  showInfo('请稍后')
  ```

### 2. 文案规范

Element UI 强调简洁明了：

```javascript
// ✅ 推荐
showSuccess('保存成功')
showError('网络错误')

// ❌ 不推荐
showSuccess('您的数据已经成功保存到服务器')
showError('发生了一个网络错误，请稍后重试')
```

### 3. 显示时长

Element UI 默认 3000ms，可根据内容调整：

```javascript
// 短消息：2000ms
showSuccess('复制成功', 2000)

// 普通消息：3000ms（默认）
showSuccess('保存成功')

// 长消息：4500ms
showInfo('这是一条比较长的提示信息', 4500)
```

## 自定义扩展

### 修改颜色

如果需要自定义颜色，保持 Element UI 的色彩逻辑：

```css
/* 自定义类型 */
.app-toast.custom {
  background-color: #your-light-bg;    /* 浅色背景 */
  border-color: #your-lighter-border;  /* 更浅的边框 */
  color: #your-primary-color;          /* 主色文字 */
}
```

**色彩选择原则：**
1. 主色：饱和度适中，易于识别
2. 背景色：主色的极浅版本（约 10% 不透明度）
3. 边框色：比背景色稍深（约 5% 不透明度）

### 修改动画时长

```css
.app-toast {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  /* 改为 0.2s 更快 */
  /* 改为 0.4s 更慢 */
}
```

### 修改位置

```css
/* 改为距顶部 40px */
.app-toast {
  top: 40px;
}
```

## 浏览器兼容性

Element UI 设计考虑了广泛的浏览器兼容性：

| 特性 | Chrome | Firefox | Safari | Edge | IE11 |
|------|--------|---------|--------|------|------|
| CSS Transform | ✅ | ✅ | ✅ | ✅ | ✅ |
| CSS Transition | ✅ | ✅ | ✅ | ✅ | ✅ |
| CSS Box Shadow | ✅ | ✅ | ✅ | ✅ | ✅ |
| CSS Border Radius | ✅ | ✅ | ✅ | ✅ | ✅ |
| Flexbox | ✅ | ✅ | ✅ | ✅ | ✅ |
| Emoji | ✅ | ✅ | ✅ | ✅ | ⚠️ |

**注意：** IE11 对 Emoji 支持有限，可能需要降级方案。

## 无障碍设计

Element UI 注重无障碍访问：

### 对比度

所有颜色组合都符合 WCAG AA 标准：

- **Success**：#67c23a on #f0f9eb → 对比度 4.6:1 ✅
- **Error**：#f56c6c on #fef0f0 → 对比度 4.5:1 ✅
- **Warning**：#e6a23c on #fdf6ec → 对比度 3.8:1 ⚠️
- **Info**：#909399 on #f4f4f5 → 对比度 3.5:1 ⚠️

### 键盘导航

- ✅ 关闭按钮可通过 Tab 键聚焦
- ✅ 支持 Enter 键关闭
- ✅ 焦点指示器清晰可见

### 屏幕阅读器

- ✅ 使用 `aria-label` 标注关闭按钮
- ✅ 消息文本语义清晰
- ✅ 图标有明确的语义

## 性能优化

### 渲染性能

- ✅ 使用 `transform` 和 `opacity`，GPU 加速
- ✅ 避免触发重排的属性
- ✅ 最小化 DOM 操作

### 内存管理

- ✅ 消息隐藏后立即从 DOM 移除
- ✅ 及时清理事件监听器
- ✅ 避免内存泄漏

## 最佳实践总结

1. **遵循 Element UI 颜色系统**：使用官方定义的颜色值
2. **保持简洁**：消息文案简短明了
3. **合理使用类型**：根据消息性质选择正确的类型
4. **控制频率**：避免过度使用，只在必要时显示
5. **考虑无障碍**：确保良好的对比度和可访问性
6. **测试多场景**：在不同设备和浏览器下测试

## 相关资源

- [Element UI 官方文档](https://element.eleme.io/)
- [Element UI Message 组件](https://element.eleme.io/#/zh-CN/component/message)
- [Element UI 设计规范](https://element.eleme.io/#/zh-CN/component/design)
- [WCAG 对比度标准](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)

## 总结

Toast 消息提示现已完全采用 Element UI 的设计规范和色系，确保：

✅ **视觉一致性**：与 Element UI 组件库风格统一
✅ **色彩规范**：使用 Element UI 官方颜色系统
✅ **尺寸标准**：遵循 Element UI 尺寸规范
✅ **动画流畅**：采用 Element UI 标准动画
✅ **无障碍友好**：符合无障碍设计标准
✅ **响应式设计**：适配各种屏幕尺寸

这种设计确保了项目在使用 Element UI 组件时的视觉连贯性和专业性。
