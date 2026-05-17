/**
 * 测试 HTTPS 服务器配置
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('========================================')
console.log('HTTPS Configuration Test')
console.log('========================================\n')

// 检查证书文件
const certPath = path.resolve(__dirname, 'certs/cert.pem')
const keyPath = path.resolve(__dirname, 'certs/key.pem')

console.log('[1] 检查证书文件...')
console.log('   cert.pem:', fs.existsSync(certPath) ? '✅ 存在' : '❌ 不存在')
console.log('   key.pem:', fs.existsSync(keyPath) ? '✅ 存在' : '❌ 不存在')

if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
  console.log('\n❌ 证书文件缺失，请运行: .\\setup_https.bat')
  process.exit(1)
}

console.log('\n[2] 读取证书内容...')
try {
  const cert = fs.readFileSync(certPath)
  const key = fs.readFileSync(keyPath)
  console.log('   cert.pem 大小:', cert.length, 'bytes')
  console.log('   key.pem 大小:', key.length, 'bytes')
  console.log('   ✅ 证书读取成功')
} catch (error) {
  console.log('   ❌ 证书读取失败:', error.message)
  process.exit(1)
}

console.log('\n[3] 测试创建 HTTPS 服务器...')
import('https').then(async (httpsModule) => {
  try {
    const cert = fs.readFileSync(certPath)
    const key = fs.readFileSync(keyPath)
    
    const testServer = httpsModule.createServer(
      { cert, key },
      (req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/plain' })
        res.end('HTTPS test server is working!')
      }
    )
    
    console.log('   ✅ HTTPS 服务器对象创建成功')
    
    // 尝试监听端口
    testServer.listen(2399, 'localhost', () => {
      console.log('   ✅ HTTPS 服务器成功监听端口 2399')
      console.log('   🌐 访问: https://localhost:2399')
      
      // 测试连接
      import('https').then((httpsTest) => {
        const req = httpsTest.default.request({
          hostname: 'localhost',
          port: 2399,
          path: '/',
          method: 'GET',
          rejectUnauthorized: false
        }, (res) => {
          let data = ''
          res.on('data', (chunk) => { data += chunk })
          res.on('end', () => {
            console.log('\n[4] 测试结果:')
            console.log('   状态码:', res.statusCode)
            console.log('   响应内容:', data)
            console.log('\n✅ 所有测试通过！HTTPS 配置正确。')
            console.log('\n现在请重启开发服务器:')
            console.log('   1. 停止当前服务器 (Ctrl+C)')
            console.log('   2. 运行: npm run dev')
            console.log('   3. 观察控制台输出')
            
            testServer.close()
            process.exit(0)
          })
        })
        
        req.on('error', (error) => {
          console.log('   ❌ 连接测试失败:', error.message)
          testServer.close()
          process.exit(1)
        })
        
        req.end()
      })
    })
    
    testServer.on('error', (error) => {
      console.log('   ❌ 服务器监听失败:', error.message)
      console.log('   可能原因: 端口 2399 已被占用')
      process.exit(1)
    })
    
  } catch (error) {
    console.log('   ❌ 创建服务器失败:', error.message)
    console.log('   错误堆栈:', error.stack)
    process.exit(1)
  }
}).catch(error => {
  console.log('   ❌ 导入 https 模块失败:', error.message)
  process.exit(1)
})
