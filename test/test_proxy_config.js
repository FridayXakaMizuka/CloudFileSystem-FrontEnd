/**
 * 代理配置测试脚本
 * 用于验证 Vite 代理是否正确工作
 */

// 检查当前环境
console.log('=== Vite 代理配置测试 ===')
console.log('环境变量 DEV:', import.meta.env.DEV)
console.log('BASE_API_URL:', import.meta.env.BASE_URL || '未设置')

// 导入 API 配置
import { BASE_API_URL, AUTH_API, FILE_API } from '@/config/api.js'

console.log('\n=== API 配置检查 ===')
console.log('BASE_API_URL:', BASE_API_URL)
console.log('AUTH_API.LOGIN:', AUTH_API.LOGIN)
console.log('FILE_API.BROWSE:', FILE_API.BROWSE)

// 验证相对路径
if (import.meta.env.DEV) {
  if (BASE_API_URL === '') {
    console.log('✅ 开发环境配置正确：使用相对路径')
  } else {
    console.log('❌ 开发环境配置错误：应该使用空字符串作为 BASE_API_URL')
  }
} else {
  if (BASE_API_URL === 'http://localhost:8835') {
    console.log('✅ 生产环境配置正确：使用绝对路径')
  } else {
    console.log('⚠️  生产环境配置可能需要检查')
  }
}

console.log('\n=== 代理路由检查 ===')
const proxyRoutes = ['/auth', '/user', '/file', '/profile', '/transfer']
proxyRoutes.forEach(route => {
  console.log(`代理路由: ${route} -> http://localhost:8835${route}`)
})

console.log('\n=== 使用说明 ===')
console.log('1. 启动开发服务器: npm run dev')
console.log('2. 查看本机 IP: ipconfig (Windows) 或 ifconfig (Mac/Linux)')
console.log('3. 在局域网其他设备访问: http://[你的IP]:2310')
console.log('4. 所有 API 请求将通过 Vite 代理转发到后端服务器')
