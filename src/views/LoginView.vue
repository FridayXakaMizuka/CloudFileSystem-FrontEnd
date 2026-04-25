<template>
  <div class="login-container">
    <div v-if="!isLoggedIn" class="login-wrapper">
      <div class="left-panel">
        <img :src="randomImage" alt="Random Image" class="random-image" @load="onImageLoad" />
        <div v-if="!imageLoaded" class="image-loading">加载中...</div>
      </div>
      <div class="right-panel">
        <div class="login-form">
          <h1 class="title">网盘系统</h1>
          <form @submit.prevent="handleLogin">
            <div class="form-group">
              <label for="username">用户名</label>
              <input
                  type="text"
                  id="username"
                  v-model="loginForm.username"
                  placeholder="请输入用户名"
                  required
                  autocomplete="username"
              />
            </div>
            <div class="form-group">
              <label for="password">密码</label>
              <input
                  type="password"
                  id="password"
                  v-model="loginForm.password"
                  placeholder="请输入密码"
                  required
                  autocomplete="current-password"
              />
            </div>
            <div class="button-group">
              <button type="submit" class="btn btn-login" :disabled="isLoading">
                {{ isLoading ? '登录中...' : '登录' }}
              </button>
              <button type="button" class="btn btn-register" @click="handleRegister" :disabled="isLoading">
                注册
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { fetchRSAKey, encryptPassword } from '@/utils/rsa'

const router = useRouter()
const isLoggedIn = ref(false)
const username = ref('')
const loginForm = ref({
  username: '',
  password: ''
})
const randomImage = ref('')
const imageLoaded = ref(false)
const isLoading = ref(false)

// RSA公钥和会话ID
const rsaPublicKey = ref('')
const sessionId = ref('')

/**
 * 获取随机背景图片
 */
const getRandomImage = () => {
  imageLoaded.value = false
  const timestamp = new Date().getTime()
  const width = 800
  const height = 600
  randomImage.value = `https://picsum.photos/${width}/${height}?random=${timestamp}`
}

/**
 * 图片加载完成回调
 */
const onImageLoad = () => {
  imageLoaded.value = true
}

/**
 * 处理登录提交
 */
const handleLogin = async () => {
  if (!loginForm.value.username || !loginForm.value.password) {
    alert('请输入用户名和密码')
    return
  }

  // 检查是否已获取公钥和会话ID
  if (!rsaPublicKey.value || !sessionId.value) {
    alert('系统初始化未完成，请稍后重试')
    return
  }

  isLoading.value = true

  try {
    // 使用RSA加密密码
    const encryptedPassword = encryptPassword(loginForm.value.password, rsaPublicKey.value)

    // 构造请求数据（按照后端接口格式）
    const loginData = {
      sessionId: sessionId.value,
      userId: loginForm.value.username,
      encryptedPassword: encryptedPassword  // 字段名必须是 encryptedPassword
    }

    console.log('发送登录请求:', loginData)

    // 发送POST请求到后端
    const response = await fetch('http://localhost:8835/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(loginData)
    })

    const result = await response.json()
    console.log('登录响应:', result)

    // 按照后端响应格式处理：code=200 且 success=true 表示成功
    if (response.ok && result.code === 200 && result.success === true) {
      // 登录成功
      username.value = loginForm.value.username
      isLoggedIn.value = true
      localStorage.setItem('isLoggedIn', 'true')
      localStorage.setItem('username', loginForm.value.username)
      
      // 保存用户ID（如果有）
      if (result.userId) {
        localStorage.setItem('userId', result.userId)
      }

      alert(result.message || '登录成功！')
      // 跳转到Dashboard页面
      router.push('/')
    } else {
      // 登录失败，显示错误信息
      alert(result.message || '登录失败，请检查用户名和密码')
    }
  } catch (error) {
    console.error('登录请求失败:', error)
    alert('网络错误，请稍后重试')
  } finally {
    isLoading.value = false
  }
}

/**
 * 处理注册按钮点击，跳转到注册页面
 */
const handleRegister = () => {
  router.push('/register')
}

onMounted(() => {
  getRandomImage()
  const savedLoginState = localStorage.getItem('isLoggedIn')
  const savedUsername = localStorage.getItem('username')
  if (savedLoginState === 'true' && savedUsername) {
    isLoggedIn.value = true
    username.value = savedUsername
  }
  
  // 获取RSA公钥和会话ID
  fetchKey()
})

/**
 * 获取RSA公钥和会话ID
 */
const fetchKey = async () => {
  try {
    console.log('登录页面：开始获取RSA公钥...')
    const keyData = await fetchRSAKey()
    rsaPublicKey.value = keyData.publicKey
    sessionId.value = keyData.sessionId
    console.log('登录页面：获取到公钥:', rsaPublicKey.value.substring(0, 50) + '...')
    console.log('登录页面：会话ID:', sessionId.value)
  } catch (error) {
    console.error('登录页面：获取公钥失败:', error)
    alert('系统初始化失败：无法获取RSA公钥\n\n可能原因：\n1. 后端服务未启动（localhost:8835）\n2. 网络连接问题\n3. CORS跨域配置问题\n\n请检查后端服务是否正常运行')
  }
}

</script>

<style scoped>
.login-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.login-wrapper {
  display: flex;
  width: 100%;
  height: 100vh;
}

.left-panel {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.random-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.3s ease;
}

.image-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 1.2rem;
  background: rgba(0, 0, 0, 0.5);
  padding: 1rem 2rem;
  border-radius: 8px;
}

.right-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.login-form {
  background: white;
  padding: 3rem;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
}

.title {
  text-align: center;
  color: #333;
  margin-bottom: 2rem;
  font-size: 2rem;
  font-weight: 600;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #555;
  font-weight: 500;
  font-size: 0.95rem;
}

.form-group input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.button-group {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.btn {
  flex: 1;
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-login {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-login:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.btn-register {
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
}

.btn-register:hover:not(:disabled) {
  background: #667eea;
  color: white;
  transform: translateY(-2px);
}

.welcome-content h1 {
  color: #333;
  margin-bottom: 1rem;
  font-size: 2rem;
}

.welcome-content p {
  color: #666;
  margin-bottom: 2rem;
  font-size: 1.1rem;
}

@media (max-width: 768px) {
  .login-wrapper {
    flex-direction: column;
  }

  .left-panel {
    height: 30vh;
  }

  .right-panel {
    padding: 1rem;
  }

  .login-form {
    padding: 2rem;
  }

  .button-group {
    flex-direction: column;
  }
}
</style>
