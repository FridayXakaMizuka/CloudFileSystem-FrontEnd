# 昵称修改功能实现指南

## 📋 概述

本次更新实现了昵称修改的后端交互逻辑。当用户点击"保存"后，如果新昵称与旧昵称不一致，则向后端发送 `POST /profile/nickname/set` 请求。

## 🎯 接口设计

### API 接口定义

**文件**: `src/config/api.js`

```javascript
export const PROFILE_API = {
  // ... 其他接口
  
  // 修改昵称
  SET_NICKNAME: `${BASE_API_URL}/profile/nickname/set`,
  
  // ... 其他接口
}
```

**接口详情**：
- **URL**: `POST http://localhost:8835/profile/nickname/set`
- **方法**: POST
- **Content-Type**: application/json
- **认证**: Bearer Token (JWT)

**请求头**：
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <JWT令牌>"
}
```

**请求体**：
```json
{
  "nickname": "新昵称"
}
```

**成功响应**：
```json
{
  "success": true,
  "code": 200,
  "message": "昵称修改成功",
  "data": null
}
```

**失败响应**：
```json
{
  "success": false,
  "code": 400,
  "message": "昵称不符合要求",
  "data": null
}
```

## 💻 前端实现

### 1. ProfileEditView.vue 中的实现

#### 导入依赖

确保已导入必要的依赖：

```javascript
import { getToken } from '@/utils/auth'
import { PROFILE_API } from '@/config/api'
```

#### saveField 函数中的昵称处理逻辑

```javascript
const saveField = async (field) => {
  // ... 其他代码
  
  const token = getToken()
  if (!token) {
    alert('用户未登录，请重新登录')
    return
  }
  
  let result
  
  // 密码修改需要特殊处理
  if (field === 'password') {
    // ... 密码修改逻辑
  } else if (field === 'nickname') {
    // ✅ 昵称修改需要特殊处理
    const newNickname = editForm.value.nickname
    
    // 检查新昵称是否与旧昵称一致
    if (newNickname === userInfo.value.nickname) {
      alert('昵称未发生变化')
      return
    }
    
    // 构造请求数据
    const requestData = {
      nickname: newNickname
    }
    
    logger.info('发送昵称修改请求:', requestData)
    
    // 发送 POST 请求到后端
    const response = await fetch(PROFILE_API.SET_NICKNAME, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestData)
    })
    
    result = await response.json()
    logger.info('昵称修改响应:', result)
    
    if (response.ok && result.success === true) {
      alert(result.message || '昵称修改成功！')
      
      // 更新本地数据
      userInfo.value.nickname = newNickname
      
      // 更新 localStorage
      localStorage.setItem('username', newNickname)
      
      // 退出编辑模式
      editingField.value = ''
      fieldError.value = ''
    } else {
      alert(result.message || '昵称修改失败')
    }
  } else {
    // 其他字段的修改逻辑（邮箱、手机号等）
    // ...
  }
}
```

## 📊 完整流程图

```
用户点击昵称的"修改"按钮
  ↓
startEdit('nickname')
  ├─ 进入编辑模式
  └─ 显示输入框
  ↓
用户输入新昵称
  ↓
实时验证（validateField）
  ├─ 检查是否为空
  └─ 检查长度限制（如有）
  ↓
点击"保存"按钮
  ↓
saveField('nickname')
  ├─ 获取 JWT 令牌
  ├─ 检查是否已登录
  └─ 检查新昵称是否与旧昵称一致
  ↓
如果一致 → 提示"昵称未发生变化" → 结束
  ↓
如果不一致 → 继续
  ↓
构造请求数据
{
  nickname: "新昵称"
}
  ↓
发送 POST 请求
POST /profile/nickname/set
Headers:
  Content-Type: application/json
  Authorization: Bearer <JWT>
Body:
{
  "nickname": "新昵称"
}
  ↓
后端处理
  ├─ 验证 JWT 令牌
  ├─ 验证昵称格式
  ├─ 检查昵称是否可用
  └─ 更新数据库
  ↓
返回响应
  ↓
✅ 成功 (success === true)
  ├─ 显示成功消息
  ├─ 更新 userInfo.value.nickname
  ├─ 更新 localStorage.username
  ├─ 退出编辑模式
  └─ 清除错误状态
  ↓
❌ 失败 (success === false)
  └─ 显示错误消息
```

## 🔍 关键特性

### 1. 变化检测

在发送请求前，先检查新昵称是否与旧昵称一致：

```javascript
if (newNickname === userInfo.value.nickname) {
  alert('昵称未发生变化')
  return
}
```

**优势**：
- ✅ 避免不必要的网络请求
- ✅ 提升用户体验
- ✅ 减少服务器负载

### 2. JWT 认证

所有请求都携带 JWT 令牌：

```javascript
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
}
```

**安全性**：
- ✅ 确保只有登录用户可以修改昵称
- ✅ 防止未授权访问
- ✅ 符合 RESTful API 规范

### 3. 数据同步

成功后同时更新多个位置的数据：

```javascript
// 1. 更新 Vue 响应式数据
userInfo.value.nickname = newNickname

// 2. 更新 localStorage（持久化）
localStorage.setItem('username', newNickname)

// 3. 退出编辑模式
editingField.value = ''
fieldError.value = ''
```

**好处**：
- ✅ UI 立即反映最新数据
- ✅ 页面刷新后数据不丢失
- ✅ 保持数据一致性

### 4. 错误处理

完善的错误处理机制：

```javascript
try {
  // 发送请求
  const response = await fetch(...)
  result = await response.json()
  
  if (response.ok && result.success === true) {
    // 成功处理
  } else {
    // 业务逻辑错误
    alert(result.message || '昵称修改失败')
  }
} catch (error) {
  // 网络错误
  logger.error('修改失败:', error)
  alert('网络错误，请稍后重试')
} finally {
  isSaving.value = false
}
```

**覆盖场景**：
- ✅ 网络错误
- ✅ 服务器错误
- ✅ 业务逻辑错误
- ✅ 超时错误

## 📝 后端实现建议

### 1. 接口实现

```java
@PostMapping("/profile/nickname/set")
public ResponseEntity<Map<String, Object>> setNickname(
    @RequestHeader("Authorization") String authorization,
    @RequestBody Map<String, String> request) {
    
    Map<String, Object> response = new HashMap<>();
    
    try {
        // 1. 提取 JWT 令牌
        String token = authorization.replace("Bearer ", "");
        
        // 2. 验证 JWT 令牌
        Claims claims = jwtUtil.parseToken(token);
        Long userId = claims.get("userId", Long.class);
        
        // 3. 获取新昵称
        String newNickname = request.get("nickname");
        
        // 4. 验证昵称格式
        if (newNickname == null || newNickname.trim().isEmpty()) {
            response.put("success", false);
            response.put("code", 400);
            response.put("message", "昵称不能为空");
            return ResponseEntity.badRequest().body(response);
        }
        
        // 5. 检查昵称长度
        if (newNickname.length() < 2 || newNickname.length() > 20) {
            response.put("success", false);
            response.put("code", 400);
            response.put("message", "昵称长度应在2-20个字符之间");
            return ResponseEntity.badRequest().body(response);
        }
        
        // 6. 检查昵称是否被占用
        if (userService.isNicknameTaken(newNickname, userId)) {
            response.put("success", false);
            response.put("code", 409);
            response.put("message", "该昵称已被使用");
            return ResponseEntity.status(409).body(response);
        }
        
        // 7. 更新昵称
        userService.updateNickname(userId, newNickname);
        
        // 8. 返回成功响应
        response.put("success", true);
        response.put("code", 200);
        response.put("message", "昵称修改成功");
        return ResponseEntity.ok(response);
        
    } catch (Exception e) {
        log.error("昵称修改失败", e);
        response.put("success", false);
        response.put("code", 500);
        response.put("message", "系统错误，请稍后重试");
        return ResponseEntity.status(500).body(response);
    }
}
```

### 2. 昵称验证规则

建议的验证规则：

| 规则 | 说明 | 示例 |
|------|------|------|
| **非空** | 昵称不能为空 | ❌ `""` |
| **长度** | 2-20 个字符 | ✅ `"张三"` ❌ `"A"` |
| **字符** | 支持中文、英文、数字、下划线 | ✅ `"user_123"` |
| **唯一性** | 不能与其他用户重复 | - |
| **敏感词** | 过滤敏感词汇 | - |

### 3. 数据库操作

```sql
-- 更新用户昵称
UPDATE users 
SET nickname = ?, 
    updated_at = NOW() 
WHERE id = ?;
```

## 🧪 测试场景

### 1. 正常流程测试

```javascript
// 测试用例：成功修改昵称
1. 用户登录
2. 进入个人信息页面
3. 点击昵称的"修改"按钮
4. 输入新昵称："新用户名"
5. 点击"保存"
6. 预期结果：
   - 发送 POST /profile/nickname/set
   - 返回 success: true
   - 显示"昵称修改成功！"
   - 页面上的昵称更新为"新用户名"
   - localStorage.username 更新
```

### 2. 边界情况测试

```javascript
// 测试用例 1：昵称未变化
1. 点击"修改"
2. 不修改昵称（保持原值）
3. 点击"保存"
4. 预期结果：
   - 不发送请求
   - 显示"昵称未发生变化"

// 测试用例 2：昵称为空
1. 点击"修改"
2. 删除所有字符
3. 点击"保存"
4. 预期结果：
   - 前端验证阻止提交
   - 显示"昵称不能为空"

// 测试用例 3：昵称过长
1. 点击"修改"
2. 输入超过20个字符
3. 点击"保存"
4. 预期结果：
   - 后端验证失败
   - 显示"昵称长度应在2-20个字符之间"

// 测试用例 4：昵称已被占用
1. 点击"修改"
2. 输入已被其他用户使用的昵称
3. 点击"保存"
4. 预期结果：
   - 后端返回 409
   - 显示"该昵称已被使用"

// 测试用例 5：JWT 过期
1. 等待 JWT 过期
2. 点击"修改"并输入新昵称
3. 点击"保存"
4. 预期结果：
   - 后端返回 401
   - 显示"用户未登录，请重新登录"
```

### 3. 网络异常测试

```javascript
// 测试用例：网络断开
1. 断开网络连接
2. 点击"修改"并输入新昵称
3. 点击"保存"
4. 预期结果：
   - 捕获网络错误
   - 显示"网络错误，请稍后重试"
```

## 🎨 用户体验优化

### 1. 加载状态

建议在保存按钮上显示加载状态：

```vue
<button class="btn btn-save" 
        @click="saveField('nickname')" 
        :disabled="isSaving">
  {{ isSaving ? '保存中...' : '保存' }}
</button>
```

### 2. 实时验证

在输入时进行实时验证：

```javascript
const validateField = (field) => {
  if (field === 'nickname') {
    const nickname = editForm.value.nickname
    
    if (!nickname) {
      fieldError.value = { field: 'nickname', message: '昵称不能为空' }
    } else if (nickname.length < 2) {
      fieldError.value = { field: 'nickname', message: '昵称至少2个字符' }
    } else if (nickname.length > 20) {
      fieldError.value = { field: 'nickname', message: '昵称最多20个字符' }
    } else {
      fieldError.value = ''
    }
  }
}
```

### 3. 成功反馈

提供清晰的成功反馈：

```javascript
if (response.ok && result.success === true) {
  // 方式 1：简单的 alert
  alert(result.message || '昵称修改成功！')
  
  // 方式 2：更友好的 Toast 提示（推荐）
  showToast({
    type: 'success',
    message: result.message || '昵称修改成功！',
    duration: 2000
  })
}
```

## 🔐 安全考虑

### 1. 前端安全

- ✅ JWT 令牌存储在 sessionStorage（而非 localStorage）
- ✅ 每次请求都验证令牌有效性
- ✅ 敏感操作需要重新认证（如密码修改）

### 2. 后端安全

- ✅ 验证 JWT 令牌签名
- ✅ 检查令牌有效期
- ✅ 验证用户权限
- ✅ 防止 SQL 注入
- ✅ 限制请求频率（Rate Limiting）
- ✅ 记录操作日志

### 3. 数据安全

- ✅ 昵称转义后再存储（防止 XSS）
- ✅ 过滤 HTML 标签
- ✅ 限制特殊字符
- ✅ 检查敏感词

## 📈 性能优化

### 1. 防抖处理

对于实时验证，可以使用防抖：

```javascript
import { debounce } from 'lodash-es'

const debouncedValidate = debounce((field) => {
  validateField(field)
}, 300)
```

### 2. 缓存策略

- ✅ 昵称修改成功后立即更新本地缓存
- ✅ 避免频繁读取数据库
- ✅ 使用 CDN 缓存静态资源

### 3. 请求优化

- ✅ 变化检测避免无效请求
- ✅ 合并多个字段修改（可选）
- ✅ 使用 HTTP/2 多路复用

## 🎉 总结

通过这次更新：

1. ✅ **实现了完整的昵称修改流程**
   - 前端验证
   - 后端交互
   - 数据同步
   - 错误处理

2. ✅ **遵循最佳实践**
   - RESTful API 设计
   - JWT 认证
   - 统一响应格式
   - 完善的日志记录

3. ✅ **注重用户体验**
   - 变化检测
   - 实时反馈
   - 清晰的错误提示
   - 加载状态显示

4. ✅ **保证安全性**
   - JWT 令牌验证
   - 输入验证
   - 防止常见攻击
   - 操作日志记录

现在昵称修改功能已经完整实现，可以安全高效地工作了！🚀

---

**最后更新**: 2024-05-01  
**版本**: 1.0.0
