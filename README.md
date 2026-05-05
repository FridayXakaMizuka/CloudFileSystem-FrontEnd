# CloudFileSystem 前端

基于 Vue 3 + Vite 的云文件系统前端应用，支持 HTTP/HTTPS 双协议访问。

## ✨ 特性

- 🔐 支持 HTTP 和 HTTPS 双协议访问
- 🌐 局域网访问支持
- 🔒 RSA 加密传输
- 📱 多端适配（Web/Electron/Capacitor）
- 🚀 分片上传、秒传、断点续传
- 👤 完整的用户认证和个人资料管理

## 🚀 快速开始

### 环境要求

- Node.js >= 20.19.0
- npm >= 10.x

### 安装依赖

```sh
npm install
```

### 开发模式

**标准启动（HTTP + HTTPS 自动检测）**
```sh
npm run dev
```

服务器会自动启动：
- 🌐 HTTP: `http://localhost:2310`
- 🔒 HTTPS: `https://localhost:2311`（如果证书存在）

**生成 SSL 证书（可选）**
```bash
setup_https.bat
```

### 生产构建

```sh
npm run build
```

### 预览生产构建

```sh
npm run preview
```

## 📖 配置说明

### 双协议访问

本项目支持同时通过 HTTP 和 HTTPS 访问：

| 协议 | 本地地址 | 局域网地址 |
|------|---------|-----------|
| HTTP | http://localhost:2310 | http://\<your-ip\>:2310 |
| HTTPS | https://localhost:2311 | https://\<your-ip\>:2311 |

详细说明请查看：[DUAL_PROTOCOL_SETUP.md](./DUAL_PROTOCOL_SETUP.md)

### 代理配置

开发环境下，所有 API 请求通过 Vite 代理转发到后端：

- `/auth/*` → `http://localhost:8835/auth/*`
- `/file/*` → `http://localhost:8835/file/*`
- `/profile/*` → `http://localhost:8835/profile/*`

这样可以避免混合内容问题（HTTPS 前端访问 HTTP 后端）。

### 环境变量

编辑 `.env.local` 文件配置后端地址：

```env
VITE_BACKEND_HOST=localhost
VITE_BACKEND_PORT=8835
```

## 📁 项目结构

```
CloudFileSystem/
├── src/
│   ├── config/          # 配置文件
│   │   └── api.js       # API 接口配置
│   ├── utils/           # 工具函数
│   │   ├── deviceFingerprint.js  # 设备指纹
│   │   └── requestHeaders.js     # 请求头管理
│   ├── views/           # 页面组件
│   ├── router/          # 路由配置
│   └── App.vue
├── certs/               # SSL 证书
├── docs/                # 文档
├── vite.config.js       # Vite 配置
└── package.json
```

## 🔧 常用命令

### 测试配置

```bash
node test_dual_protocol.js
```

检查双协议配置是否正确。

### Electron 打包

```bash
npm run electron:build
```

### Capacitor 移动端

```bash
npm run capacitor:sync
npm run capacitor:run:android
```

## 📚 文档

完整文档位于 `docs/` 目录：

- [双协议配置指南](./DUAL_PROTOCOL_SETUP.md)
- [前端集成指南](./FRONTEND_INTEGRATION_GUIDE.md)
- [API 配置指南](./docs/API_CONFIG_GUIDE.md)
- [HTTPS 设置指南](./docs/HTTPS_SETUP_GUIDE.md)
- [局域网访问指南](./docs/LAN_ACCESS_GUIDE.md)
- [设备指纹功能](./docs/DEVICE_FINGERPRINT_GUIDE.md)

## 🛠️ 技术栈

- **框架**: Vue 3 (Composition API)
- **构建工具**: Vite
- **路由**: Vue Router
- **加密**: JSEncrypt (RSA), Crypto-JS
- **文件处理**: Spark-MD5
- **多端**: Electron, Capacitor

## 📝 开发注意事项

### 1. API 调用

开发环境下使用相对路径，自动通过代理：

```javascript
// ✅ 正确：使用相对路径
fetch('/auth/login', { ... })

// ❌ 错误：直接使用完整 URL
fetch('http://localhost:8835/auth/login', { ... })
```

### 2. 设备指纹

所有认证请求都需要携带设备指纹：

```javascript
import { addAllRequestHeaders } from '@/utils/requestHeaders'

const headers = new Headers({ 'Content-Type': 'application/json' })
await addAllRequestHeaders(headers)

fetch('/auth/login', {
  method: 'POST',
  headers: headers,
  body: JSON.stringify(data)
})
```

### 3. HTTPS 证书警告

首次访问 HTTPS 时浏览器会显示安全警告，这是正常的（自签名证书）。点击"高级" → "继续访问"即可。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT
