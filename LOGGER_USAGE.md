# 统一日志工具使用指南

## 概述

本项目已集成统一日志工具 `logger.js`，所有控制台日志输出都采用企业级标准格式，包含时间戳、日志级别和模块名称。

## 日志格式

```
[YYYY-MM-DD HH:mm:ss.SSS] [LEVEL] [Module] message
```

### 示例输出

```
[2026-04-27 14:30:25.123] [INFO] [Auth] JWT 令牌已保存
[2026-04-27 14:30:25.456] [DEBUG] [RSA] 响应状态: 200
[2026-04-27 14:30:25.789] [ERROR] [LoginView] 登录请求失败: Error...
```

## 日志级别

| 级别 | 颜色 | 用途 | 方法 |
|------|------|------|------|
| DEBUG | 灰色 (#999999) | 调试信息，详细的技术细节 | `logger.debug()` |
| INFO | 绿色 (#4CAF50) | 一般信息，重要的业务流程 | `logger.info()` |
| WARN | 橙色 (#FF9800) | 警告信息，潜在的问题 | `logger.warn()` |
| ERROR | 红色 (#F44336) | 错误信息，需要立即关注 | `logger.error()` |

## 使用方法

### 1. 在组件或工具文件中创建日志器

```javascript
import { createLogger } from '@/utils/logger'

const logger = createLogger('ModuleName')
```

### 2. 使用不同级别的日志

```javascript
// Debug 级别 - 用于详细的调试信息
logger.debug('变量值:', someVariable)
logger.debug('API 响应数据:', responseData)

// Info 级别 - 用于重要的业务流程
logger.info('用户登录成功')
logger.info('开始获取数据...')

// Warn 级别 - 用于警告信息
logger.warn('配置文件不存在，使用默认配置')
logger.warn('API 响应缓慢，耗时 2000ms')

// Error 级别 - 用于错误信息
logger.error('网络请求失败:', error)
logger.error('数据解析错误:', errorMessage)
```

### 3. 直接导入单个方法（可选）

```javascript
import { debug, info, warn, error } from '@/utils/logger'

info('Auth', 'JWT 令牌已保存')
error('RSA', '密钥验证失败:', error)
```

## 最佳实践

### ✅ 推荐做法

1. **为每个模块创建专用的日志器**
   ```javascript
   const logger = createLogger('LoginView')
   const logger = createLogger('AuthService')
   ```

2. **选择合适的日志级别**
   - 用户操作、业务流程 → `INFO`
   - API 请求/响应详情 → `DEBUG`
   - 非关键性异常 → `WARN`
   - 导致功能失败的错误 → `ERROR`

3. **提供有意义的上下文信息**
   ```javascript
   // ❌ 不好
   logger.info('请求失败')
   
   // ✅ 好
   logger.error('登录请求失败:', { 
     userId: '10001', 
     error: error.message,
     timestamp: new Date()
   })
   ```

4. **敏感信息脱敏**
   ```javascript
   // ❌ 不要记录完整密码
   logger.debug('密码:', password)
   
   // ✅ 只记录必要信息
   logger.info('用户登录尝试:', { userId: '10001' })
   ```

### ❌ 避免的做法

1. **不要在代码中直接使用 `console.log`**
   ```javascript
   // ❌ 避免
   console.log('测试')
   
   // ✅ 使用
   logger.debug('测试')
   ```

2. **不要过度使用 DEBUG 级别**
   - 只在开发阶段需要时使用
   - 生产环境可以关闭 DEBUG 日志

3. **不要记录大量重复日志**
   ```javascript
   // ❌ 避免在循环中频繁记录
   for (let i = 0; i < 1000; i++) {
     logger.debug('处理第', i, '条数据')
   }
   
   // ✅ 改为汇总信息
   logger.info('数据处理完成，共处理 1000 条')
   ```

## 已集成的模块

以下模块已更新为使用统一日志工具：

- ✅ `src/utils/auth.js` - 认证管理
- ✅ `src/utils/rsa.js` - RSA 加密
- ✅ `src/utils/cookie.js` - Cookie 管理
- ✅ `src/views/LoginView.vue` - 登录页面
- ✅ `src/views/RegisterView.vue` - 注册页面
- ✅ `src/views/DashBoardView.vue` - 仪表盘
- ✅ `src/views/ProfileEditView.vue` - 个人信息编辑

## 浏览器控制台效果

在浏览器控制台中，不同级别的日志会显示不同的颜色：

- 🔵 **DEBUG**: 灰色 - 技术细节
- 🟢 **INFO**: 绿色 - 正常流程
- 🟠 **WARN**: 橙色 - 警告提示
- 🔴 **ERROR**: 红色 - 错误信息

每条日志都带有时间戳和模块名称，方便快速定位问题。

## 未来扩展

可以根据需要添加更多功能：

1. **日志过滤** - 根据级别或模块过滤日志
2. **日志持久化** - 将日志保存到本地存储或发送到服务器
3. **性能监控** - 记录 API 响应时间、页面加载时间等
4. **错误上报** - 自动将 ERROR 级别日志上报到监控系统

---

**最后更新**: 2026-04-27  
**维护者**: 开发团队
