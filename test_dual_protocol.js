/**
 * 双协议配置测试脚本
 * 验证 HTTP 和 HTTPS 服务器配置是否正确
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🔍 开始检查双协议配置...\n')

// 1. 检查 SSL 证书
console.log('1️⃣  检查 SSL 证书...')
const certPath = path.resolve(__dirname, 'certs/cert.pem')
const keyPath = path.resolve(__dirname, 'certs/key.pem')

if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  console.log('   ✅ SSL 证书存在')
  console.log(`   - 证书: ${certPath}`)
  console.log(`   - 私钥: ${keyPath}`)
  
  // 检查证书大小
  const certStat = fs.statSync(certPath)
  const keyStat = fs.statSync(keyPath)
  console.log(`   - 证书大小: ${(certStat.size / 1024).toFixed(2)} KB`)
  console.log(`   - 私钥大小: ${(keyStat.size / 1024).toFixed(2)} KB`)
} else {
  console.log('   ⚠️  SSL 证书不存在')
  console.log('   💡 运行 setup_https.bat 生成证书以启用 HTTPS')
}

// 2. 检查 Vite 配置
console.log('\n2️⃣  检查 Vite 配置...')
const viteConfigPath = path.resolve(__dirname, 'vite.config.js')
if (fs.existsSync(viteConfigPath)) {
  const config = fs.readFileSync(viteConfigPath, 'utf-8')
  
  // 检查关键配置项
  const checks = [
    { name: 'host: 0.0.0.0', pattern: /host:\s*['"]0\.0\.0\.0['"]/ },
    { name: 'port: 2310', pattern: /port:\s*2310/ },
    { name: 'proxy 配置', pattern: /proxy:\s*\{/ },
    { name: 'secure: false', pattern: /secure:\s*false/ },
    { name: 'configureServer', pattern: /configureServer/ },
    { name: 'HTTPS 服务器', pattern: /https\.createServer/ }
  ]
  
  checks.forEach(check => {
    if (check.pattern.test(config)) {
      console.log(`   ✅ ${check.name}`)
    } else {
      console.log(`   ❌ ${check.name} - 未找到`)
    }
  })
} else {
  console.log('   ❌ vite.config.js 不存在')
}

// 3. 检查 API 配置
console.log('\n3️⃣  检查 API 配置...')
const apiConfigPath = path.resolve(__dirname, 'src/config/api.js')
if (fs.existsSync(apiConfigPath)) {
  const config = fs.readFileSync(apiConfigPath, 'utf-8')
  
  if (/isDev\s*\?\s*''\s*:/.test(config)) {
    console.log('   ✅ 开发环境使用相对路径（支持代理）')
  } else {
    console.log('   ⚠️  API 配置可能不支持代理')
  }
  
  if (/import\.meta\.env\.DEV/.test(config)) {
    console.log('   ✅ 环境检测已配置')
  } else {
    console.log('   ❌ 缺少环境检测')
  }
} else {
  console.log('   ❌ src/config/api.js 不存在')
}

// 4. 检查 package.json 脚本
console.log('\n4️⃣  检查 npm 脚本...')
const packageJsonPath = path.resolve(__dirname, 'package.json')
if (fs.existsSync(packageJsonPath)) {
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
  
  if (pkg.scripts.dev) {
    console.log(`   ✅ dev: ${pkg.scripts.dev}`)
  }
  
  if (pkg.scripts['dev:https']) {
    console.log(`   ✅ dev:https: ${pkg.scripts['dev:https']}`)
  } else {
    console.log('   ℹ️  dev:https 脚本未定义（可选）')
  }
}

// 5. 端口可用性检查
console.log('\n5️⃣  检查端口占用...')
const net = await import('net')

function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer()
    server.listen(port, () => {
      server.close()
      resolve(true)
    })
    server.on('error', () => {
      resolve(false)
    })
  })
}

const port2310 = await checkPort(2310)
const port2311 = await checkPort(2311)

if (port2310) {
  console.log('   ✅ 端口 2310 (HTTP) 可用')
} else {
  console.log('   ⚠️  端口 2310 (HTTP) 已被占用')
}

if (port2311) {
  console.log('   ✅ 端口 2311 (HTTPS) 可用')
} else {
  console.log('   ⚠️  端口 2311 (HTTPS) 已被占用')
}

// 6. 总结
console.log('\n' + '='.repeat(50))
console.log('📋 配置总结')
console.log('='.repeat(50))

console.log('\n🌐 HTTP 服务器:')
console.log('   - 地址: http://localhost:2310')
console.log('   - 局域网: http://<your-ip>:2310')
console.log('   - 状态: ' + (port2310 ? '✅ 就绪' : '⚠️  端口被占用'))

console.log('\n🔒 HTTPS 服务器:')
if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  console.log('   - 地址: https://localhost:2311')
  console.log('   - 局域网: https://<your-ip>:2311')
  console.log('   - 状态: ' + (port2311 ? '✅ 就绪' : '⚠️  端口被占用'))
} else {
  console.log('   - 状态: ⚠️  需要 SSL 证书')
  console.log('   - 提示: 运行 setup_https.bat 生成证书')
}

console.log('\n🔗 代理配置:')
console.log('   - 后端: http://localhost:8835')
console.log('   - 代理路径: /auth, /file, /profile, /user, /transfer')
console.log('   - 混合内容: ✅ 已允许 (secure: false)')

console.log('\n💡 启动命令:')
console.log('   npm run dev')

console.log('\n✨ 配置检查完成！\n')
