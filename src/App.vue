<script setup>
import { onMounted } from 'vue'
import { getUserInfo as fetchUserInfo } from '@/utils/userInfo'
import { isLoggedIn } from '@/utils/auth'
import { createLogger } from '@/utils/logger'

const logger = createLogger('App')

/**
 * 应用启动时获取用户信息（只执行一次）
 */
onMounted(async () => {
  // 检查用户是否已登录
  if (isLoggedIn()) {
    logger.info('应用启动，检查用户信息...')
    
    // 优先从缓存获取，缓存不存在才从后端获取
    const userInfo = await fetchUserInfo(false) // 不强制刷新，优先使用缓存
    
    if (userInfo) {
      logger.info('用户信息加载成功:', userInfo.nickname)
    } else {
      logger.warn('用户信息加载失败')
    }
  } else {
    logger.debug('用户未登录，跳过获取用户信息')
  }
})
</script>

<template>
  <router-view />
</template>

<style scoped>
</style>

