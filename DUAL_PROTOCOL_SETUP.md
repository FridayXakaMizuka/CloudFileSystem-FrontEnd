# 双协议（HTTP + HTTPS）配置指南

> **最后更新**: 2026-05-06  
> **适用环境**: 开发环境

---

## 📋 概述

本项目支持同时通过 HTTP 和 HTTPS 协议访问前端开发服务器：

- **HTTP**: `http://localhost:2310` 或 `http://<your-ip>:2310`
- **HTTPS**: `https://localhost:2311` 或 `https://<your-ip>:2311`

后端服务仍然使用 HTTP (`http://localhost:8835`)，通过 Vite 代理解决混合内容问题。

---

## 🔧 配置说明

### 1. Vite 配置 (`vite.config.js`)

#### HTTP 服务器（端口 2310）
```javascript
server: {
  port: 2310,
  host: '0.0.0.0', // 允许局域网访问
  proxy: {
    '^/(auth|file|profile|user|transfer)/': {
      target: 'http://localhost:8835',
      changeOrigin: true,
      secure: false, // 允许混合内容
      ws: true, // 支持 WebSocket
    }
  }
}
```

#### HTTPS 服务器（端口 2311）
- 自动检测 `certs/` 目录下的 SSL 证书
- 如果证书存在，自动启动 HTTPS 服务器
- 共享相同的中间件和代理配置
- 支持 WebSocket 升级（WSS）

### 2. API 配置 (`src/config/api.js`)

开发环境下使用**相对路径**，通过 Vite 代理转发：

```javascript
const isDev = import.meta.env.DEV
export const BASE_API_URL = isDev ? '' : 'http://localhost:8835'
```

这样无论前端使用 HTTP 还是 HTTPS，API 请求都会通过代理正确转发到后端。

---

## 🚀 使用方法

### 启动开发服务器

```bash
npm run dev
```

服务器会自动检测 SSL 证书并启动相应的服务：

**场景 1: 证书存在**
```
🔒 HTTPS Server running at:
  - Local:   https://localhost:2311
  - Network: https://192.168.31.187:2311

🌐 HTTP Server running at:
  - Local:   http://localhost:2310
  - Network: http://192.168.31.187:2310
```

**场景 2: 证书不存在**
```
ℹ️  未检测到 SSL 证书，仅使用 HTTP 服务器
💡 提示: 运行 setup_https.bat 生成证书以启用 HTTPS

🌐 HTTP Server running at:
  - Local:   http://localhost:2310
  - Network: http://192.168.31.187:2310
```

### 生成 SSL 证书

如果还没有证书，运行：

```bash
setup_https.bat
```

这会在 `certs/` 目录下生成：
- `cert.pem` - SSL 证书
- `key.pem` - 私钥

---

## 🌐 访问方式

### 本地访问

- HTTP: `http://localhost:2310`
- HTTPS: `https://localhost:2311`

### 局域网访问

1. 获取本机 IP 地址：
   ```bash
   ipconfig
   ```

2. 使用 IP 访问：
   - HTTP: `http://192.168.x.x:2310`
   - HTTPS: `https://192.168.x.x:2311`

### 移动端访问

- 确保手机和电脑在同一局域网
- 使用电脑的 IP 地址访问
- HTTPS 需要信任自签名证书

---

## ⚙️ 代理规则

所有以下路径的请求都会被代理到后端：

- `/auth/*` → `http://localhost:8835/auth/*`
- `/file/*` → `http://localhost:8835/file/*`
- `/profile/*` → `http://localhost:8835/profile/*`
- `/user/*` → `http://localhost:8835/user/*`
- `/transfer/*` → `http://localhost:8835/transfer/*`

### 示例

前端请求：
```javascript
fetch('/auth/login', { ... })
```

实际转发：
```
http://localhost:2310/auth/login → http://localhost:8835/auth/login
https://localhost:2311/auth/login → http://localhost:8835/auth/login
```

---

## 🔒 HTTPS 注意事项

### 1. 自签名证书警告

浏览器会显示"不安全"警告，这是正常的。点击"高级" → "继续访问"即可。

### 2. 混合内容问题

✅ **已解决**：通过 Vite 代理，HTTPS 前端可以安全地访问 HTTP 后端。

❌ **不要这样做**：
```javascript
// 错误：直接在 HTTPS 页面中请求 HTTP 后端
fetch('http://localhost:8835/auth/login') // 会被浏览器阻止
```

✅ **正确做法**：
```javascript
// 正确：使用相对路径，通过代理
fetch('/auth/login') // 自动通过代理转发
```

### 3. Cookie 安全标志

在 HTTPS + IP 地址环境下，Cookie 的 `Secure` 标志可能影响会话保持。如果遇到登录状态丢失问题：

1. 检查后端 Cookie 配置
2. 确保设置了 `SameSite=None` 和 `Secure` 标志
3. 参考文档：`docs/HTTPS_COOKIE_FIX.md`

---

## 🐛 常见问题

### Q1: HTTPS 服务器无法启动

**原因**: 证书文件不存在或损坏

**解决方案**:
```bash
# 重新生成证书
setup_https.bat
```

### Q2: 代理不生效，API 请求失败

**原因**: API 配置使用了完整 URL 而不是相对路径

**解决方案**:
检查 `src/config/api.js`，确保开发环境下 `BASE_API_URL` 为空字符串：
```javascript
export const BASE_API_URL = isDev ? '' : 'http://localhost:8835'
```

### Q3: WebSocket 连接失败

**原因**: WebSocket 升级未正确配置

**解决方案**:
检查 `vite.config.js` 中的 `ws: true` 配置和 `upgrade` 事件处理器。

### Q4: 局域网无法访问

**原因**: 防火墙阻止或后端未监听 `0.0.0.0`

**解决方案**:
1. 配置防火墙允许端口 2310 和 2311
2. 确保后端监听 `0.0.0.0:8835`
3. 参考文档：`docs/LAN_ACCESS_GUIDE.md`

---

## 📝 技术细节

### 为什么需要双协议？

1. **兼容性**: 某些旧设备或网络环境只支持 HTTP
2. **测试需求**: 测试 HTTPS 环境下的功能（如 Cookie、Service Worker）
3. **移动端调试**: 某些移动应用要求 HTTPS
4. **渐进式迁移**: 从 HTTP 逐步迁移到 HTTPS

### 代理工作原理

```
浏览器 (HTTPS)
    ↓
Vite Dev Server (端口 2311)
    ↓ (代理转发)
后端服务器 (HTTP, 端口 8835)
    ↓
响应返回浏览器
```

关键点：
- 浏览器认为在与 HTTPS 服务器通信
- Vite 服务器内部将请求转发到 HTTP 后端
- 浏览器不会检测到混合内容问题

---

## 🔗 相关文档

- [Vite 代理配置指南](./docs/PROXY_CONFIG_GUIDE.md)
- [HTTPS 设置指南](./docs/HTTPS_SETUP_GUIDE.md)
- [局域网访问指南](./docs/LAN_ACCESS_GUIDE.md)
- [HTTPS Cookie 修复](./docs/HTTPS_COOKIE_FIX.md)
- [前端集成指南](./FRONTEND_INTEGRATION_GUIDE.md)

---

**文档结束**
