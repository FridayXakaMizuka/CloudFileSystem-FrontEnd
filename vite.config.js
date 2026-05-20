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
    {
      name: 'https-server',
      configureServer(server) {
        console.log('\n[Plugin] configureServer called')
        
        const certPath = path.resolve(__dirname, 'certs/cert.pem')
        const keyPath = path.resolve(__dirname, 'certs/key.pem')
        
        if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
          console.log('[Plugin] Certificates found')
          
          try {
            const https = require('https')
            const cert = fs.readFileSync(certPath)
            const key = fs.readFileSync(keyPath)
            
            const httpsServer = https.createServer(
              { cert, key },
              server.middlewares
            )
            
            // 处理 WebSocket upgrade 请求
            httpsServer.on('upgrade', (req, socket, head) => {
              console.log('[HTTPS] WebSocket upgrade request:', req.url)
              // 转发到主 HTTP 服务器的 WebSocket 处理器
              if (server.ws && server.ws.server) {
                server.ws.server.handleUpgrade(req, socket, head, (ws) => {
                  server.ws.server.emit('connection', ws, req)
                })
              } else if (server.httpServer) {
                // 备用方案：直接转发到 HTTP 服务器
                server.httpServer.emit('upgrade', req, socket, head)
              }
            })
            
            httpsServer.listen(2311, '0.0.0.0', () => {
              console.log('\n========================================')
              console.log('🔒 HTTPS Server: https://localhost:2311')
              console.log('🌐 HTTP Server: http://localhost:2310')
              console.log('========================================\n')
            })
            
            httpsServer.on('error', (error) => {
              console.error('[HTTPS Error]', error.message)
            })
          } catch (error) {
            console.error('[Plugin Error]', error.message)
          }
        } else {
          console.log('[Plugin] No certificates found')
        }
      }
    }
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
      // 代理所有 /auth、/file、/files、/profile 等 API 请求到后端
      '^/(auth|file|files|profile|user|transfer)/': {
        target: 'http://localhost:8835',
        changeOrigin: true,
        secure: false, // 允许混合内容（HTTPS前端访问HTTP后端）
        ws: true, // 支持 WebSocket
      }
    }
  }
})
