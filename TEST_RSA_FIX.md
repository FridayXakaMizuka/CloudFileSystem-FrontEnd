# RSA 密钥验证修复测试指南

## 🎯 修复内容

**问题**: 
1. 当后端返回 `valid: false` 但包含新密钥对时，前端错误地丢弃了新密钥
2. 前端在验证时没有发送 publicKey，只发送了 sessionId

**解决方案**: 
1. 修改 `getValidatedRSAKey()` 函数，使其能够正确处理后端返回的新密钥对并自动更新 Cookie
2. 将 RSA 公钥也保存到 Cookie 中
3. 在验证请求中同时发送 sessionId 和 publicKey

## ✅ 测试步骤

### 1. 清除现有 Cookie

在浏览器控制台执行：
```javascript
// 清除所有相关 Cookie
document.cookie.split(";").forEach(function(c) { 
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
});
console.log('✅ Cookie 已清除');
```

### 2. 首次访问登录页面

1. 打开浏览器开发者工具（F12）
2. 切换到 Console 标签页
3. 访问登录页面 `http://localhost:5173/login`
4. 观察控制台输出

**预期日志**:
```
登录页面：开始初始化RSA密钥...
开始从 Cookie 读取并验证 RSA 密钥...
❌ Cookie 中没有 sessionId，需要重新获取密钥
登录页面：Cookie验证失败，重新获取RSA密钥
🔑 开始获取RSA公钥...
📥 响应状态: 200
📥 响应OK: true
📋 响应数据: {publicKey: "...", sessionId: "..."}
✅ RSA公钥获取成功
✅ sessionId 已保存到 Cookie
✅ publicKey 已保存到 Cookie
登录页面：已获取新的RSA密钥
登录页面：RSA密钥初始化完成
```

### 3. 刷新页面（密钥仍然有效）

按 F5 或 Ctrl+R 刷新页面

**预期日志**:
```
登录页面：开始初始化RSA密钥...
开始从 Cookie 读取并验证 RSA 密钥...
✅ 从 Cookie 读取到 sessionId: xxx-xxx-xxx
✅ 从 Cookie 读取到 publicKey (长度): 392
📤 验证请求将包含 sessionId 和 publicKey
📡 正在向后端验证密钥有效性...
📥 验证响应状态: 200
📋 密钥验证响应数据: {valid: true, publicKey: "..."}
✅ RSA 密钥有效，使用 Cookie 中的 sessionId
登录页面：使用Cookie中验证通过的RSA密钥
登录页面：RSA密钥初始化完成
```

### 4. 刷新页面（模拟密钥失效）

**方法 A**: 等待后端会话超时（如果有配置）

**方法 B**: 手动删除后端会话数据（如果可访问）

**方法 C**: 修改代码临时测试（见下方）

**预期日志**（密钥失效时）:
```
登录页面：开始初始化RSA密钥...
开始从 Cookie 读取并验证 RSA 密钥...
✅ 从 Cookie 读取到 sessionId: a1b2c3d4-e5f6-7890-abcd-ef1234567890
✅ 从 Cookie 读取到 publicKey (长度): 392
📤 验证请求将包含 sessionId 和 publicKey
📡 正在向后端验证密钥有效性...
📥 验证响应状态: 200
📋 密钥验证响应数据: {
  valid: false, 
  publicKey: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEB...",
  sessionId: "f9e8d7c6-b5a4-3210-fedc-ba9876543210"
}
🔄 RSA 密钥已失效，使用后端返回的新密钥对
   - 旧 sessionId: a1b2c3d4-e5f6-7890-abcd-ef1234567890
   - 新 sessionId: f9e8d7c6-b5a4-3210-fedc-ba9876543210
✅ 新密钥对已更新到 Cookie
登录页面：使用Cookie中验证通过的RSA密钥
登录页面：RSA密钥初始化完成
```

**关键点**: 
- ✅ 看到 `✅ 从 Cookie 读取到 publicKey (长度): 392`
- ✅ 看到 `📤 验证请求将包含 sessionId 和 publicKey`
- ✅ 看到 `🔄 RSA 密钥已失效，使用后端返回的新密钥对`
- ✅ 看到新旧 sessionId 的对比
- ✅ 看到 `✅ 新密钥对已更新到 Cookie`
- ✅ **没有**看到重新调用 `/api/auth/rsa-key` 接口

### 5. 再次刷新页面（验证新密钥）

再次按 F5 刷新页面

**预期日志**:
```
登录页面：开始初始化RSA密钥...
开始从 Cookie 读取并验证 RSA 密钥...
✅ 从 Cookie 读取到 sessionId: f9e8d7c6-b5a4-3210-fedc-ba9876543210
✅ 从 Cookie 读取到 publicKey (长度): 392
📤 验证请求将包含 sessionId 和 publicKey
📡 正在向后端验证密钥有效性...
📥 验证响应状态: 200
📋 密钥验证响应数据: {valid: true, publicKey: "..."}
✅ RSA 密钥有效，使用 Cookie 中的 sessionId
登录页面：使用Cookie中验证通过的RSA密钥
```

**注意**: sessionId 应该是新的那个 `f9e8d7c6-b5a4-3210-fedc-ba9876543210`

## 🔍 验证要点

### ✅ 成功的标志

1. **首次访问**: 
   - 能正常获取密钥并保存到 Cookie
   - 看到 `✅ sessionId 已保存到 Cookie`
   - 看到 `✅ publicKey 已保存到 Cookie`
   
2. **密钥有效时**: 
   - 从 Cookie 读取到 sessionId 和 publicKey
   - 验证请求包含 sessionId 和 publicKey
   - 直接使用 Cookie 中的密钥，无需重新请求
   
3. **密钥失效时**: 
   - 自动使用后端返回的新密钥对
   - 自动更新 Cookie 中的 sessionId 和 publicKey
   - **不需要**额外调用 `/api/auth/rsa-key`
   
4. **用户体验**: 整个过程流畅，用户无感知

### ❌ 失败的标志

1. 一直看到 `⚠️ RSA 密钥无效或响应格式错误`
2. 每次刷新都重新调用 `/api/auth/rsa-key`
3. 控制台报错或异常
4. 无法正常登录或注册

## 🧪 临时测试代码（可选）

如果你想强制测试密钥失效的情况，可以临时修改 `LoginView.vue`:

```javascript
const initRSAKey = async () => {
  try {
    console.log('登录页面：开始初始化RSA密钥...')
    
    // 临时跳过验证，直接获取新密钥（用于测试）
    const keyData = await fetchRSAKey()
    rsaPublicKey.value = keyData.publicKey
    sessionId.value = keyData.sessionId
    console.log('登录页面：已获取新的RSA密钥')
    
    // 立即使 Cookie 中的 sessionId 失效（通过修改它）
    // 这样下次刷新时会触发密钥失效的逻辑
    console.log('💡 提示：现在刷新页面将测试密钥失效的处理逻辑')
    
  } catch (error) {
    console.error('登录页面：RSA密钥初始化失败:', error)
  }
}
```

## 📊 性能对比

### 修复前
- 密钥失效 → 验证失败（只发送 sessionId）→ 重新调用 `/api/auth/rsa-key` → 2 次网络请求
- 用户体验：稍慢，有额外的网络延迟

### 修复后
- 密钥失效 → 验证返回新密钥（发送 sessionId + publicKey）→ 直接使用 → 1 次网络请求
- Cookie 中存储完整的密钥对信息
- 验证时发送完整信息给后端
- 用户体验：更快，减少了一次网络请求

## 🎉 总结

修复后的行为更符合后端的设计意图：
- 后端在密钥失效时**主动返回新密钥**
- 前端**智能利用**这个新密钥
- Cookie 中存储完整的密钥对信息（sessionId + publicKey）
- 验证时发送完整信息给后端
- 减少了不必要的网络请求
- 提升了用户体验

### 主要改进

1. **Cookie 存储增强**
   - 新增 `rsaPublicKey` Cookie，存储 RSA 公钥（URI 编码）
   - 与 `sessionId` 一起保存，有效期 7 天

2. **验证请求完善**
   - 从 Cookie 读取 sessionId 和 publicKey
   - 同时发送给后端进行验证
   - 符合后端接口规范

3. **自动刷新机制**
   - 密钥失效时自动使用后端返回的新密钥对
   - 自动更新 Cookie 中的 sessionId 和 publicKey
   - 用户无感知，体验流畅

如果测试过程中遇到任何问题，请查看 [RSA_DEBUG_GUIDE.md](./RSA_DEBUG_GUIDE.md) 进行详细排查。
