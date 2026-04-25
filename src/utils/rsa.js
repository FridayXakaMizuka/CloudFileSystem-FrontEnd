import JSEncrypt from 'jsencrypt'

/**
 * 获取RSA公钥和会话ID
 * @returns {Promise<{publicKey: string, sessionId: string}>}
 */
export const fetchRSAKey = async () => {
  try {
    console.log('开始获取RSA公钥...')
    const response = await fetch('http://localhost:8835/api/auth/rsa-key')
    
    console.log('响应状态:', response.status)
    console.log('响应OK:', response.ok)
    
    const data = await response.json()
    console.log('响应数据:', data)
    
    if (response.ok && data.publicKey && data.sessionId) {
      console.log('RSA公钥获取成功')
      return {
        publicKey: data.publicKey,
        sessionId: data.sessionId
      }
    } else {
      const errorMsg = data.message || '获取公钥失败'
      console.error('获取公钥失败 - 错误信息:', errorMsg)
      console.error('完整响应:', data)
      throw new Error(errorMsg)
    }
  } catch (error) {
    console.error('获取RSA公钥请求失败:', error)
    console.error('错误详情:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    })
    throw error
  }
}

/**
 * 使用RSA加密密码
 * @param {string} password - 原始密码
 * @param {string} publicKey - RSA公钥
 * @returns {string} 加密后的密码
 */
export const encryptPassword = (password, publicKey) => {
  const encrypt = new JSEncrypt()
  encrypt.setPublicKey(publicKey)
  const encrypted = encrypt.encrypt(password)
  
  if (!encrypted) {
    throw new Error('密码加密失败')
  }
  
  return encrypted
}
