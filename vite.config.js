import { fileURLToPath, URL } from 'node:url'
import fs from 'fs'
import path from 'path'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// 获取当前目录（ES模块兼容）
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    port: 2310,
    host: '0.0.0.0', // 允许局域网访问
    open: true,
    // HTTP 服务器配置
    proxy: {
      // 代理所有 /auth、/file、/profile 等 API 请求到后端
      '^/(auth|file|profile|user|transfer)/': {
        target: 'http://localhost:8835',
        changeOrigin: true,
        secure: false, // 允许混合内容（HTTPS前端访问HTTP后端）
        ws: true, // 支持 WebSocket
      }
    }
  },
  // 配置额外的 HTTPS 服务器
  configureServer: async (server) => {
    // 如果证书存在，创建 HTTPS 服务器
    const certPath = path.resolve(__dirname, 'certs/cert.pem')
    const keyPath = path.resolve(__dirname, 'certs/key.pem')
    
    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
      try {
        const https = await import('https')
        const cert = fs.readFileSync(certPath)
        const key = fs.readFileSync(keyPath)
        
        // 创建 HTTPS 服务器
        const httpsServer = https.createServer(
          { cert, key },
          server.middlewares
        )
        
        // 处理 WebSocket 升级
        server.httpServer.on('upgrade', (req, socket, head) => {
          if (req.url.startsWith('/wss')) {
            // 转发 wss 请求到主 ws 服务器
            server.ws.server.handleUpgrade(req, socket, head, () => {})
          }
        })
        
        // 监听 HTTPS 端口
        httpsServer.listen(2311, '0.0.0.0', () => {
          console.log('\n🔒 HTTPS Server running at:')
          console.log('  - Local:   https://localhost:2311')
          console.log('  - Network: https://<your-ip>:2311')
          console.log('\n🌐 HTTP Server running at:')
          console.log('  - Local:   http://localhost:2310')
          console.log('  - Network: http://<your-ip>:2310')
        })
      } catch (error) {
        console.warn('⚠️  HTTPS 服务器启动失败:', error.message)
        console.log('ℹ️  仅使用 HTTP 服务器: http://localhost:2310')
      }
    } else {
      console.log('ℹ️  未检测到 SSL 证书，仅使用 HTTP 服务器')
      console.log('💡 提示: 运行 setup_https.bat 生成证书以启用 HTTPS')
    }
  }
})
