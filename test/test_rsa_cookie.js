/**
 * RSA 密钥 Cookie 验证 - 快速测试脚本
 * 
 * 使用方法：
 * 1. 打开浏览器开发者工具（F12）
 * 2. 切换到 Console 标签页
 * 3. 复制粘贴以下代码并执行
 */

// ============================================
// 测试 1: 清除所有 Cookie
// ============================================
function clearAllCookies() {
  console.log('🧹 开始清除所有 Cookie...')
  document.cookie.split(";").forEach(function(c) { 
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
  });
  console.log('✅ Cookie 已清除')
  console.log('当前 Cookie:', document.cookie || '(空)')
}

// ============================================
// 测试 2: 查看当前 Cookie 状态
// ============================================
function checkCookieStatus() {
  console.log('📋 当前 Cookie 状态:')
  
  const sessionId = document.cookie.split(';')
    .find(c => c.trim().startsWith('sessionId='))
  
  const rsaPublicKey = document.cookie.split(';')
    .find(c => c.trim().startsWith('rsaPublicKey='))
  
  if (sessionId) {
    const value = sessionId.split('=')[1]
    console.log('✅ sessionId:', value.substring(0, 20) + '...')
  } else {
    console.log('❌ sessionId: 不存在')
  }
  
  if (rsaPublicKey) {
    const value = decodeURIComponent(rsaPublicKey.split('=')[1])
    console.log('✅ rsaPublicKey: 存在 (长度:', value.length, ')')
  } else {
    console.log('❌ rsaPublicKey: 不存在')
  }
}

// ============================================
// 测试 3: 手动设置测试 Cookie
// ============================================
function setTestCookies() {
  console.log('🔧 设置测试 Cookie...')
  
  // 设置测试 sessionId
  const testSessionId = 'test-session-' + Date.now()
  document.cookie = `sessionId=${testSessionId};expires=${new Date(Date.now() + 7*24*60*60*1000).toUTCString()};path=/;SameSite=Lax`
  console.log('✅ sessionId 已设置:', testSessionId)
  
  // 设置测试 publicKey
  const testPublicKey = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA' + Date.now()
  document.cookie = `rsaPublicKey=${encodeURIComponent(testPublicKey)};expires=${new Date(Date.now() + 7*24*60*60*1000).toUTCString()};path=/;SameSite=Lax`
  console.log('✅ rsaPublicKey 已设置 (长度:', testPublicKey.length, ')')
}

// ============================================
// 测试 4: 模拟验证请求
// ============================================
async function testValidationRequest() {
  console.log('📡 测试验证请求...')
  
  // 从 Cookie 读取
  const cookies = document.cookie.split(';')
  let sessionId = null
  let publicKey = null
  
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === 'sessionId') {
      sessionId = value
    } else if (name === 'rsaPublicKey') {
      publicKey = decodeURIComponent(value)
    }
  }
  
  if (!sessionId) {
    console.error('❌ Cookie 中没有 sessionId')
    return
  }
  
  console.log('📤 请求数据:')
  console.log('  sessionId:', sessionId)
  console.log('  publicKey:', publicKey ? '存在 (' + publicKey.length + ' 字符)' : '不存在')
  
  const requestBody = { sessionId }
  if (publicKey) {
    requestBody.publicKey = publicKey
  }
  
  console.log('📤 请求体:', JSON.stringify(requestBody, null, 2))
  
  try {
    const response = await fetch('http://localhost:8835/api/auth/is_rsa_valid', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    })
    
    console.log('📥 响应状态:', response.status)
    
    const data = await response.json()
    console.log('📋 响应数据:', JSON.stringify(data, null, 2))
    
    if (data.valid) {
      console.log('✅ 密钥有效')
    } else {
      console.log('🔄 密钥失效，后端返回新密钥')
      console.log('  新 sessionId:', data.sessionId)
      console.log('  新 publicKey:', data.publicKey ? '存在' : '不存在')
    }
  } catch (error) {
    console.error('❌ 请求失败:', error)
  }
}

// ============================================
// 使用指南
// ============================================
console.log(`
╔═══════════════════════════════════════════════════════════╗
║     RSA 密钥 Cookie 验证 - 快速测试工具                    ║
╚═══════════════════════════════════════════════════════════╝

可用命令:
  1. clearAllCookies()        - 清除所有 Cookie
  2. checkCookieStatus()      - 查看当前 Cookie 状态
  3. setTestCookies()         - 设置测试 Cookie
  4. testValidationRequest()  - 测试验证请求

建议测试流程:
  步骤 1: clearAllCookies()           // 清除现有 Cookie
  步骤 2: 刷新页面                     // 观察首次访问日志
  步骤 3: checkCookieStatus()         // 确认 Cookie 已保存
  步骤 4: 再次刷新页面                 // 观察验证日志
  步骤 5: testValidationRequest()     // 手动测试验证请求

提示: 打开 Network 标签页可以查看详细的请求和响应信息
`)
