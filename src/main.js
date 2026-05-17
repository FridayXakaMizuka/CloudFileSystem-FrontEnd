import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// 启用全局 Fetch 拦截器（自动为所有请求添加安全请求头）
import './utils/fetchInterceptor'

createApp(App).use(router).mount('#app')
