<template>
  <div class="profile-edit-container">
    <!-- 标题栏 -->
    <header class="header">
      <div class="header-left">
        <button class="btn-back" @click="goBack">
          <span class="icon">←</span>
          返回
        </button>
        <h1 class="page-title">个人信息</h1>
      </div>
    </header>

    <!-- 主内容区：左右布局 -->
    <main class="main-content">
      <div class="content-wrapper">
        <!-- 左侧选项卡导航 -->
        <aside class="tabs-sidebar">
          <nav class="tabs-nav">
            <button
                class="tab-item"
                :class="{ active: activeTab === 'avatar' }"
                @click="scrollToSection('avatar')"
            >
              <span class="tab-icon">🖼️</span>
              <span class="tab-text">头像设置</span>
            </button>
            <button
                class="tab-item"
                :class="{ active: activeTab === 'basic' }"
                @click="scrollToSection('basic')"
            >
              <span class="tab-icon">👤</span>
              <span class="tab-text">基本信息</span>
            </button>
            <button
                class="tab-item"
                :class="{ active: activeTab === 'contact' }"
                @click="scrollToSection('contact')"
            >
              <span class="tab-icon">📞</span>
              <span class="tab-text">联系方式</span>
            </button>
            <button
                class="tab-item"
                :class="{ active: activeTab === 'password' }"
                @click="scrollToSection('password')"
            >
              <span class="tab-icon">🔒</span>
              <span class="tab-text">密码管理</span>
            </button>
            <button
                class="tab-item"
                :class="{ active: activeTab === 'security' }"
                @click="scrollToSection('security')"
            >
              <span class="tab-icon">❓</span>
              <span class="tab-text">密保问题</span>
            </button>
            <button
                class="tab-item"
                :class="{ active: activeTab === 'info' }"
                @click="scrollToSection('info')"
            >
              <span class="tab-icon">ℹ️</span>
              <span class="tab-text">账号信息</span>
            </button>
          </nav>
        </aside>

        <!-- 右侧内容区域 -->
        <section class="tab-content-area" ref="contentArea">
          <!-- 头像设置 -->
          <div id="section-avatar" :class="['tab-pane', { 'active': activeTab === 'avatar' }, { 'highlighted': highlightedSection === 'avatar' }]">
            <div class="content-card">
              <h2 class="card-title">
                <span class="icon">🖼️</span>
                头像设置
              </h2>
              <div class="avatar-upload">
                <div class="avatar-preview" @click="triggerFileInput">
                  <img
                      v-if="previewAvatar"
                      :src="previewAvatar"
                      alt="头像预览"
                      class="avatar-img"
                  />
                  <div v-else class="avatar-placeholder" :style="{ backgroundColor: avatarColor }">
                    {{ avatarLetter }}
                  </div>
                  <div class="avatar-overlay">
                    <span class="upload-icon">📷</span>
                    <span class="upload-text">点击更换</span>
                  </div>
                </div>
                <input
                    ref="fileInput"
                    type="file"
                    accept="image/*"
                    @change="handleAvatarChange"
                    style="display: none"
                />
                <p class="hint-text">支持 JPG、PNG、GIF、WebP 格式，文件大小不超过 5MB</p>
              </div>
            </div>
          </div>

          <!-- 基本信息 -->
          <div id="section-basic" :class="['tab-pane', { 'active': activeTab === 'basic' }, { 'highlighted': highlightedSection === 'basic' }]">
            <div class="content-card">
              <h2 class="card-title">
                <span class="icon">👤</span>
                基本信息
              </h2>
              
              <!-- 昵称编辑模式 -->
              <div v-if="editingFields.has('nickname')" class="edit-mode">
                <div class="form-group">
                  <label for="edit-nickname">
                    <span class="label-icon">✏️</span>
                    昵称
                  </label>
                  <input
                      type="text"
                      id="edit-nickname"
                      v-model="editForm.nickname"
                      placeholder="请输入昵称"
                      maxlength="20"
                      @input="handleInput('nickname')"
                  />
                  <p v-if="fieldError" class="error-message">
                    {{ fieldError }}
                  </p>
                  <p class="char-count">{{ editForm.nickname.length }}/20</p>
                </div>
                <div class="button-group">
                  <button class="btn btn-cancel" @click="cancelEdit('nickname')">
                    取消
                  </button>
                  <button class="btn btn-save" @click="saveField('nickname')" :disabled="isSaving || !isFieldValid('nickname')">
                    {{ isSaving ? '保存中...' : '保存' }}
                  </button>
                </div>
              </div>
              
              <!-- 昵称只读模式 -->
              <div v-if="!editingFields.has('nickname')" class="info-display-item">
                <div class="info-label">
                  <span class="label-icon">✏️</span>
                  昵称
                </div>
                <div class="info-value">
                  <span>{{ userInfo.nickname || '未设置' }}</span>
                  <button class="btn-edit" @click="startEdit('nickname')">
                    <span class="edit-icon">✏️</span>
                    修改
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 联系方式 -->
          <div id="section-contact" :class="['tab-pane', { 'active': activeTab === 'contact' }, { 'highlighted': highlightedSection === 'contact' }]">
            <div class="content-card">
              <h2 class="card-title">
                <span class="icon">📞</span>
                联系方式
              </h2>
              
              <!-- 邮箱编辑模式 -->
              <div v-if="editingFields.has('email')" class="edit-mode">
                <div class="form-group">
                  <label for="edit-email">
                    <span class="label-icon">📧</span>
                    邮箱地址
                  </label>
                  <input
                      type="email"
                      id="edit-email"
                      v-model="editForm.email"
                      placeholder="请输入新邮箱地址"
                      @blur="handleEmailBlur"
                  />
                </div>
                
                <div class="form-group">
                  <label>
                    <span class="label-icon">🔐</span>
                    邮箱验证码
                  </label>
                  <div class="verification-row">
                    <input
                        type="text"
                        id="email-verification-code"
                        v-model="editForm.emailVerificationCode"
                        placeholder="请输入验证码"
                        required
                        maxlength="6"
                        class="verification-code-input"
                    />
                    <button 
                      type="button" 
                      class="btn-verify-code" 
                      :disabled="!isEmailValid || isSendingCode || countdownTimer.isRunning()"
                      @click="handleSendVerificationCode"
                    >
                      {{ isSendingCode ? '发送中...' : (countdownTimer.isRunning() ? `${emailCountdownRemaining}s` : '发送验证码') }}
                    </button>
                  </div>
                  <p v-if="fieldError && fieldError.field === 'emailVerificationCode'" class="error-message">
                    {{ fieldError.message }}
                  </p>
                </div>
                
                <div class="button-group">
                  <button class="btn btn-cancel" @click="cancelEdit('email')">
                    取消
                  </button>
                  <button class="btn btn-save" @click="saveField('email')" :disabled="isSaving || !isFieldValid('email')">
                    {{ isSaving ? '保存中...' : '保存' }}
                  </button>
                </div>
              </div>
              
              <!-- 邮箱只读模式 -->
              <div v-if="!editingFields.has('email')" class="info-display-item">
                <div class="info-label">
                  <span class="label-icon">📧</span>
                  邮箱地址
                </div>
                <div class="info-value">
                  <span>{{ maskEmail(userInfo.email) }}</span>
                  <button class="btn-edit" @click="startEdit('email')">
                    <span class="edit-icon">✏️</span>
                    修改
                  </button>
                </div>
              </div>

              <!-- 手机号编辑模式 -->
              <div v-if="editingFields.has('phone')" class="edit-mode">
                <div class="form-group">
                  <label for="edit-phone">
                    <span class="label-icon">📱</span>
                    手机号
                  </label>
                  <input
                      type="tel"
                      id="edit-phone"
                      v-model="editForm.phone"
                      placeholder="请输入新手机号"
                      maxlength="11"
                      @blur="handlePhoneBlur"
                  />
                </div>
                
                <div class="form-group">
                  <label>
                    <span class="label-icon">🔐</span>
                    手机验证码
                  </label>
                  <div class="verification-row">
                    <input
                        type="text"
                        id="phone-verification-code"
                        v-model="editForm.phoneVerificationCode"
                        placeholder="请输入验证码"
                        required
                        maxlength="6"
                        class="verification-code-input"
                    />
                    <button 
                      type="button" 
                      class="btn-verify-code" 
                      :disabled="!isPhoneValid || isSendingPhoneCode || phoneCountdownTimer.isRunning()"
                      @click="handleSendPhoneVerificationCode"
                    >
                      {{ isSendingPhoneCode ? '发送中...' : (phoneCountdownTimer.isRunning() ? `${phoneCountdownRemaining}s` : '发送验证码') }}
                    </button>
                  </div>
                  <p v-if="fieldError && fieldError.field === 'phoneVerificationCode'" class="error-message">
                    {{ fieldError.message }}
                  </p>
                </div>
                
                <div class="button-group">
                  <button class="btn btn-cancel" @click="cancelEdit('phone')">
                    取消
                  </button>
                  <button class="btn btn-save" @click="saveField('phone')" :disabled="isSaving || !isFieldValid('phone')">
                    {{ isSaving ? '保存中...' : '保存' }}
                  </button>
                </div>
              </div>
              
              <!-- 手机号只读模式 -->
              <div v-if="!editingFields.has('phone')" class="info-display-item">
                <div class="info-label">
                  <span class="label-icon">📱</span>
                  手机号
                </div>
                <div class="info-value">
                  <span>{{ maskPhone(userInfo.phone) }}</span>
                  <button class="btn-edit" @click="startEdit('phone')">
                    <span class="edit-icon">✏️</span>
                    修改
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 密码管理 -->
          <div id="section-password" :class="['tab-pane', { 'active': activeTab === 'password' }, { 'highlighted': highlightedSection === 'password' }]">
            <div class="content-card">
              <h2 class="card-title">
                <span class="icon">🔒</span>
                密码管理
              </h2>
              
              <!-- 密码编辑模式 -->
              <div v-if="editingFields.has('password')" class="edit-mode">
                <div class="form-group">
                  <label for="old-password">
                    <span class="label-icon">🔑</span>
                    旧密码
                  </label>
                  <input
                      type="password"
                      id="old-password"
                      v-model="editForm.oldPassword"
                      placeholder="请输入当前密码"
                  />
                </div>
                
                <div class="form-group">
                  <label for="new-password">
                    <span class="label-icon">🔐</span>
                    新密码
                  </label>
                  <input
                      type="password"
                      id="new-password"
                      v-model="editForm.newPassword"
                      placeholder="请输入新密码（6-14位）"
                      minlength="6"
                      maxlength="14"
                      @input="handleInput('password')"
                  />
                  <p v-if="fieldError && fieldError.field === 'newPassword'" class="error-message">
                    {{ fieldError.message }}
                  </p>
                </div>
                
                <div class="form-group">
                  <label for="confirm-password">
                    <span class="label-icon">✓</span>
                    确认密码
                  </label>
                  <input
                      type="password"
                      id="confirm-password"
                      v-model="editForm.confirmPassword"
                      placeholder="请再次输入新密码"
                      minlength="6"
                      maxlength="14"
                      @input="handleInput('password')"
                  />
                  <p v-if="fieldError && fieldError.field === 'confirmPassword'" class="error-message">
                    {{ fieldError.message }}
                  </p>
                </div>
                
                <div class="button-group">
                  <button class="btn btn-cancel" @click="cancelEdit('password')">
                    取消
                  </button>
                  <button class="btn btn-save" @click="saveField('password')" :disabled="isSaving || !isFieldValid('password')">
                    {{ isSaving ? '保存中...' : '保存' }}
                  </button>
                </div>
              </div>
              
              <!-- 密码只读模式 -->
              <div v-if="!editingFields.has('password')" class="info-display-item">
                <div class="info-label">
                  <span class="label-icon">🔑</span>
                  登录密码
                </div>
                <div class="info-value">
                  <span>••••••••</span>
                  <button class="btn-edit" @click="startEdit('password')">
                    <span class="edit-icon">✏️</span>
                    修改
                  </button>
                </div>
              </div>
              <div v-if="!editingFields.has('password')" class="warning-tip">
                <span class="tip-icon">⚠️</span>
                <span class="tip-text">注意：修改密码后需要重新登录</span>
              </div>
            </div>
          </div>

          <!-- 密保问题 -->
          <div id="section-security" :class="['tab-pane', { 'active': activeTab === 'security' }, { 'highlighted': highlightedSection === 'security' }]">
            <div class="content-card">
              <h2 class="card-title">
                <span class="icon">❓</span>
                密保问题
              </h2>
              
              <!-- 密保问题编辑模式 -->
              <div v-if="editingFields.has('security')" class="edit-mode">
                <div class="form-group">
                  <label for="security-question-select">
                    <span class="label-icon">❓</span>
                    选择密保问题
                  </label>
                  <select
                      id="security-question-select"
                      v-model="editForm.securityQuestionId"
                      class="security-question-select"
                  >
                    <option value="">请选择密保问题</option>
                    <option v-for="question in securityQuestions" :key="question.id" :value="question.id">
                      {{ question.question }}
                    </option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label for="security-answer-input">
                    <span class="label-icon">✏️</span>
                    答案
                  </label>
                  <input
                      type="text"
                      id="security-answer-input"
                      v-model="editForm.securityAnswer"
                      placeholder="请输入密保问题答案"
                      @input="handleInput('security')"
                  />
                </div>
                
                <div class="button-group">
                  <button class="btn btn-cancel" @click="cancelEdit('security')">
                    取消
                  </button>
                  <button class="btn btn-save" @click="saveField('security')" :disabled="isSaving || !isFieldValid('security')">
                    {{ isSaving ? '保存中...' : '保存' }}
                  </button>
                </div>
              </div>
              
              <!-- 密保问题只读模式 -->
              <div v-if="!editingFields.has('security')" class="info-display-item">
                <div class="info-label">
                  <span class="label-icon">❓</span>
                  密保问题
                </div>
                <div class="info-value">
                  <span>{{ userInfo.securityQuestion || '未设置' }}</span>
                  <button class="btn-edit" @click="startEdit('security')">
                    <span class="edit-icon">✏️</span>
                    修改
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 账号信息 -->
          <div id="section-info" :class="['tab-pane', { 'active': activeTab === 'info' }, { 'highlighted': highlightedSection === 'info' }]">
            <div class="content-card">
              <h2 class="card-title">
                <span class="icon">ℹ️</span>
                账号信息
              </h2>
              <div class="info-grid">
                <div class="info-item">
                  <label>注册时间</label>
                  <span>{{ registerDate }}</span>
                </div>
                <div class="info-item">
                  <label>账号状态</label>
                  <span class="status-active">正常</span>
                </div>
                <div class="info-item">
                  <label>存储空间</label>
                  <span>{{ userInfo.storageUsed }} / {{ userInfo.storageTotal }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { createLogger } from '@/utils/logger'
import { uploadAndSetAvatar, getFullAvatarUrl, loadAuthenticatedImage } from '@/utils/userInfo'
import { decodeJWT, getRegisterTimeFromToken, getToken, clearAuthInfo } from '@/utils/auth'
import { fetchRSAKey, encryptPassword } from '@/utils/rsa'
import { setCookie, deleteCookie } from '@/utils/cookie'
import { AUTH_API, PROFILE_API, USER_API } from '@/config/api'
import { getCachedUserInfo, updateUserInfoField } from '@/utils/userInfo'
import { sendVerificationCode, CountdownTimer } from '@/utils/email'
import { sendPhoneVerificationCode } from '@/utils/phone'
import { showSuccess, showError } from '@/utils/toast'
import { clearSessionId, getOrCreatePurposeSessionId, resetPurposeSessionIdExpiry, clearPurposeSessionId } from '@/utils/sessionId'

const logger = createLogger('ProfileEditView')

const router = useRouter()

// 当前激活的选项卡
const activeTab = ref('avatar')

// 高亮显示的区块
const highlightedSection = ref('')

// 内容区域引用
const contentArea = ref(null)

// 滚动防抖定时器
let scrollTimeout = null
let highlightTimeout = null

// 表单数据
const editForm = ref({
  nickname: '',
  email: '',
  emailVerificationCode: '',  // 邮箱验证码
  phone: '',
  phoneVerificationCode: '',  // 手机验证码
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
  securityQuestionId: '',  // 密保问题 ID
  securityAnswer: ''  // 密保答案
})

// 用户信息（从后端获取）
const userInfo = ref({
  nickname: '',
  email: '',
  phone: '',
  securityQuestion: '',  // 密保问题
  registerDate: '',
  accountStatus: '正常',
  storageUsed: '0 GB',
  storageTotal: '10 GB'
})

// 原始数据（用于检测变化）
const originalData = ref({
  nickname: '',
  email: '',
  phone: '',
  avatar: ''
})

// 头像相关
const previewAvatar = ref('')
const fileInput = ref(null)

// 密码框失焦状态
const newPasswordBlurred = ref(false)
const confirmPasswordBlurred = ref(false)

// 邮箱和手机号失焦状态
const emailBlurred = ref(false)
const phoneBlurred = ref(false)

// 邮箱验证码相关
const isSendingCode = ref(false)  // 是否正在发送验证码
const emailSessionId = ref('')  // 邮箱修改专用的 sessionId
const countdownTimer = new CountdownTimer(60)  // 60秒倒计时
const emailCountdownRemaining = ref(0)  // ✅ 邮箱倒计时剩余时间（响应式）

// 手机号验证码相关
const isSendingPhoneCode = ref(false)  // 是否正在发送手机验证码
const phoneSessionId = ref('')  // 手机号修改专用的 sessionId
const phoneCountdownTimer = new CountdownTimer(60)  // 手机验证码60秒倒计时
const phoneCountdownRemaining = ref(0)  // ✅ 手机倒计时剩余时间（响应式）

// 保存状态
const isSaving = ref(false)

// 是否有未保存的更改
const hasChanges = ref(false)

// 注册日期
const registerDate = ref('2024-01-01')

// RSA 密钥相关
const rsaPublicKey = ref('')  // 全局 RSA 密钥（用于密码修改）
const sessionId = ref('')  // 全局 sessionId
const isRsaKeyLoading = ref(false)

// 专用 RSA 密钥（用于邮箱和手机号修改）
const emailRsaPublicKey = ref('')  // 邮箱修改专用的 RSA 密钥
const phoneRsaPublicKey = ref('')  // 手机号修改专用的 RSA 密钥
const securityRsaPublicKey = ref('')  // 密保问题修改专用的 RSA 密钥

// 密保问题列表
const securityQuestions = ref([])

// 字段编辑相关
const editingFields = ref(new Set())  // 当前正在编辑的字段集合
const fieldError = ref('')  // 字段验证错误

// 跟踪已修改但未保存的字段
const modifiedFields = ref(new Set())  // 存储已修改的字段名

/**
 * 计算属性：获取头像显示的字母
 */
const avatarLetter = computed(() => {
  if (!editForm.value.nickname) return 'U'
  return editForm.value.nickname.charAt(0).toUpperCase()
})

/**
 * 计算属性：根据昵称生成头像背景色
 */
const avatarColor = computed(() => {
  const colors = [
    '#667eea', '#764ba2', '#f093fb', '#f5576c',
    '#4facfe', '#00f2fe', '#43e97b', '#fa709a',
    '#fee140', '#30cfd0', '#a8edea', '#ff9a9e'
  ]
  if (!editForm.value.nickname) return colors[0]

  let hash = 0
  for (let i = 0; i < editForm.value.nickname.length; i++) {
    hash = editForm.value.nickname.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
})

/**
 * 计算属性：密码长度验证
 */
const passwordLengthError = computed(() => {
  const length = editForm.value.newPassword.length
  if (length > 0 && length < 6) {
    return '密码长度至少为6位'
  }
  if (length > 14) {
    return '密码长度不能超过14位'
  }
  return ''
})

/**
 * 计算属性：密码一致性验证
 */
const passwordMismatch = computed(() => {
  if (editForm.value.confirmPassword &&
      editForm.value.newPassword !== editForm.value.confirmPassword) {
    return '两次输入的密码不一致'
  }
  return ''
})

/**
 * 计算属性：邮箱是否有效（用于控制发送验证码按钮）
 */
const isEmailValid = computed(() => {
  if (!editForm.value.email) return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(editForm.value.email)
})

/**
 * 计算属性：验证邮箱格式
 */
const emailError = computed(() => {
  if (emailBlurred.value && editForm.value.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(editForm.value.email)) {
      return '请输入有效的邮箱地址'
    }
  }
  return ''
})

/**
 * 计算属性：验证手机号格式
 */
const phoneError = computed(() => {
  if (phoneBlurred.value && editForm.value.phone) {
    const phoneRegex = /^1[3-9]\d{9}$/
    if (!phoneRegex.test(editForm.value.phone)) {
      return '请输入有效的11位手机号'
    }
  }
  return ''
})

/**
 * 计算属性：手机号是否有效（用于控制发送验证码按钮）
 */
const isPhoneValid = computed(() => {
  if (!editForm.value.phone) return false
  const phoneRegex = /^1[3-9]\d{9}$/
  return phoneRegex.test(editForm.value.phone)
})

/**
 * 返回上一页
 */
const goBack = () => {
  if (hasUnsavedChanges.value) {
    if (confirm('有未保存的更改，确定要离开吗？')) {
      router.back()
    }
  } else {
    router.back()
  }
}

/**
 * 邮箱地址打码
 */
const maskEmail = (email) => {
  if (!email) return '未设置'
  const [name, domain] = email.split('@')
  if (!domain) return email
  const maskedName = name.charAt(0) + '***' + name.charAt(name.length - 1)
  return `${maskedName}@${domain}`
}

/**
 * 手机号打码
 */
const maskPhone = (phone) => {
  if (!phone) return '未设置'
  if (phone.length !== 11) return phone
  return phone.substring(0, 3) + '****' + phone.substring(7)
}

/**
 * 跳转到编辑页面
 */
const goToEditPage = (field) => {
  // 将字段名作为查询参数传递
  router.push({
    path: '/profile/edit',
    query: { field: field }
  })
  logger.info(`跳转到编辑页面: ${field}`)
}

/**
 * 计算属性：当前激活的编辑字段（用于兼容性）
 */
const editingField = computed(() => {
  return editingFields.value.size > 0 ? Array.from(editingFields.value)[0] : ''
})

/**
 * 计算属性：字段是否有效（根据传入的 field 参数验证）
 */
const isFieldValid = (field) => {
  if (!field || !editingFields.value.has(field)) return false
  
  // 首先检查是否有错误
  if (fieldError.value && fieldError.value.field === field) return false
  
  if (field === 'password') {
    // 密码需要验证旧密码、新密码和确认密码
    return editForm.value.oldPassword && 
           editForm.value.newPassword && 
           editForm.value.confirmPassword &&
           editForm.value.newPassword === editForm.value.confirmPassword
  } else if (field === 'email') {
    // 邮箱需要验证值和验证码
    return editForm.value.email !== userInfo.value.email &&
           editForm.value.emailVerificationCode &&
           emailSessionId.value
  } else if (field === 'phone') {
    // 手机号需要验证值和验证码
    return editForm.value.phone !== userInfo.value.phone &&
           editForm.value.phoneVerificationCode &&
           phoneSessionId.value
  }
  // 其他字段：有变化即为有效
  return editForm.value[field] !== userInfo.value[field]
}

/**
 * 计算属性：是否有未保存的修改
 */
const hasUnsavedChanges = computed(() => {
  return modifiedFields.value.size > 0
})

/**
 * 开始编辑字段
 */
const startEdit = async (field) => {
  // 如果已经在编辑该字段，直接返回
  if (editingFields.value.has(field)) {
    return
  }
  
  // 添加到编辑集合
  editingFields.value.add(field)
  fieldError.value = ''
  
  // 加载当前值到编辑表单
  if (field === 'nickname') {
    editForm.value.nickname = userInfo.value.nickname || ''
  } else if (field === 'email') {
    editForm.value.email = userInfo.value.email || ''
    editForm.value.emailVerificationCode = ''
    // 为邮箱修改生成独立的 sessionId
    emailSessionId.value = getOrCreatePurposeSessionId('email')
    logger.info('邮箱修改专用 sessionId:', emailSessionId.value)
    
    // 获取 RSA 密钥（使用邮箱用途）并保存到专用变量
    logger.info('开始获取 RSA 密钥用于邮箱修改...')
    await loadRsaKey('email')
    // ✅ 保存邮箱专用的 RSA 密钥
    emailRsaPublicKey.value = rsaPublicKey.value
    logger.info('邮箱专用 RSA 密钥已保存')
  } else if (field === 'phone') {
    editForm.value.phone = userInfo.value.phone || ''
    editForm.value.phoneVerificationCode = ''
    // 为手机号修改生成独立的 sessionId
    phoneSessionId.value = getOrCreatePurposeSessionId('phone')
    logger.info('手机号修改专用 sessionId:', phoneSessionId.value)
    
    // 获取 RSA 密钥（使用手机号用途）并保存到专用变量
    logger.info('开始获取 RSA 密钥用于手机号修改...')
    await loadRsaKey('phone')
    // ✅ 保存手机号专用的 RSA 密钥
    phoneRsaPublicKey.value = rsaPublicKey.value
    logger.info('手机号专用 RSA 密钥已保存')
  } else if (field === 'password') {
    editForm.value.oldPassword = ''
    editForm.value.newPassword = ''
    editForm.value.confirmPassword = ''
    
    // 为密码修改生成独立的 sessionId
    const passwordSessionId = getOrCreatePurposeSessionId('password')
    logger.info('密码修改专用 sessionId:', passwordSessionId)
    
    // 点击密码修改时，立即获取 RSA 密钥（使用密码用途）
    logger.info('开始编辑密码，获取 RSA 密钥...')
    await loadRsaKey('password')
  }
  
  logger.info(`开始编辑${field}`)
}

/**
 * 取消编辑
 */
const cancelEdit = (field) => {
  // 如果该字段已被标记为修改中，询问是否放弃修改
  if (modifiedFields.value.has(field)) {
    if (!confirm('该字段有未保存的修改，确定要放弃吗？')) {
      return
    }
    // 从修改集合中移除
    modifiedFields.value.delete(field)
  }
  
  // 从编辑集合中移除
  editingFields.value.delete(field)
  fieldError.value = ''
  
  // 清理邮箱验证码相关状态
  if (field === 'email') {
    clearPurposeSessionId('email')
    emailSessionId.value = ''
    editForm.value.emailVerificationCode = ''
    emailRsaPublicKey.value = ''  // ✅ 清除邮箱专用 RSA 密钥
    logger.info('已清除邮箱专用 RSA 密钥')
  }
  
  // 清理手机号验证码相关状态
  if (field === 'phone') {
    clearPurposeSessionId('phone')
    phoneSessionId.value = ''
    editForm.value.phoneVerificationCode = ''
    phoneRsaPublicKey.value = ''  // ✅ 清除手机号专用 RSA 密钥
    logger.info('已清除手机号专用 RSA 密钥')
  }
  
  logger.info('取消编辑', field)
}

/**
 * 处理输入（实时验证）
 */
const handleInput = (field) => {
  // 监听输入变化，标记字段为已修改
  if (field) {
    const currentValue = editForm.value[field]
    const originalValue = userInfo.value[field]
    
    if (currentValue !== originalValue) {
      modifiedFields.value.add(field)
    } else {
      modifiedFields.value.delete(field)
    }
  }
  
  validateField()
}

/**
 * 验证指定字段
 */
const validateSpecificField = (field) => {
  switch (field) {
    case 'nickname':
      const nickname = editForm.value.nickname
      if (!nickname.trim()) {
        return { field: 'nickname', message: '昵称不能为空' }
      } else if (nickname.length > 20) {
        return { field: 'nickname', message: '昵称不能超过20个字符' }
      }
      return ''
    
    case 'email':
      const email = editForm.value.email
      const emailCode = editForm.value.emailVerificationCode
      
      if (!email) {
        return ''
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
          return { field: 'email', message: '请输入有效的邮箱地址' }
        } else if (!emailCode) {
          return { field: 'emailVerificationCode', message: '请输入邮箱验证码' }
        } else if (!emailSessionId.value) {
          return { field: 'emailVerificationCode', message: '请先发送验证码' }
        }
      }
      return ''
    
    case 'phone':
      const phone = editForm.value.phone
      const phoneCode = editForm.value.phoneVerificationCode
      
      if (!phone) {
        return ''
      } else {
        const phoneRegex = /^1[3-9]\d{9}$/
        if (!phoneRegex.test(phone)) {
          return { field: 'phone', message: '请输入有效的11位手机号' }
        } else if (!phoneCode) {
          return { field: 'phoneVerificationCode', message: '请输入手机验证码' }
        } else if (!phoneSessionId.value) {
          return { field: 'phoneVerificationCode', message: '请先发送验证码' }
        }
      }
      return ''
    
    case 'password':
      const newPassword = editForm.value.newPassword
      const confirmPassword = editForm.value.confirmPassword
      
      // 验证新密码
      if (!newPassword) {
        return { field: 'newPassword', message: '新密码不能为空' }
      } else if (newPassword.length < 6 || newPassword.length > 14) {
        return { field: 'newPassword', message: '密码长度应在6-14位之间' }
      }
      
      // 验证确认密码
      if (confirmPassword && newPassword !== confirmPassword) {
        return { field: 'confirmPassword', message: '两次输入的密码不一致' }
      }
      
      return ''
    
    default:
      return ''
  }
}

/**
 * 验证当前字段（用于实时验证）
 */
const validateField = () => {
  // 如果没有正在编辑的字段，清空错误
  if (editingFields.value.size === 0) {
    fieldError.value = ''
    return
  }
  
  // 获取最后一个激活的字段进行验证（用于显示错误）
  const fields = Array.from(editingFields.value)
  const lastField = fields[fields.length - 1]
  
  fieldError.value = validateSpecificField(lastField)
}

/**
 * 保存字段
 */
const saveField = async (field) => {
  // 验证指定字段（而不是最后一个激活的字段）
  const validationError = validateSpecificField(field)
  if (validationError) {
    showError(validationError.message)
    return
  }
  
  isSaving.value = true
  
  try {
    const token = getToken()
    if (!token) {
      showError('用户未登录，请重新登录')
      router.push('/login')
      return
    }
    
    let result
    
    // 密码修改需要特殊处理
    if (field === 'password') {
      // 获取密码修改专用的 sessionId
      const passwordSessionId = getOrCreatePurposeSessionId('password')
      logger.info('使用密码修改专用 sessionId:', passwordSessionId)
      
      // 检查 RSA 密钥是否存在
      if (!rsaPublicKey.value) {
        logger.warn('RSA 密钥未加载，尝试重新获取...')
        await loadRsaKey('password')
        
        if (!rsaPublicKey.value) {
          showError('系统初始化失败，请刷新页面重试')
          return
        }
      }
      
      // 使用 RSA 加密新旧密码
      const encryptedOldPassword = encryptPassword(editForm.value.oldPassword, rsaPublicKey.value)
      const encryptedNewPassword = encryptPassword(editForm.value.newPassword, rsaPublicKey.value)
      
      // 构造密码修改请求数据
      const requestData = {
        sessionId: passwordSessionId,
        oldPassword: encryptedOldPassword,
        newPassword: encryptedNewPassword
      }
      
      logger.info('发送密码修改请求...')
      
      // 发送 POST 请求到后端
      const response = await fetch(PROFILE_API.CHANGE_PASSWORD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      })
      
      result = await response.json()
      logger.info('密码修改响应:', result)
      
      if (response.ok && result.success === true) {
        // 使用 alert 显示密码修改成功提示
        alert('🔒密码已修改，请重新登录。')
        
        // 从修改集合中移除
        modifiedFields.value.delete('password')
        
        // 清空 JWT 令牌和认证信息
        clearAuthInfo()
        
        // 清除 Cookie 中的 RSA 密钥和密码专用 sessionId
        deleteCookie('rsaPublicKey')
        clearPurposeSessionId('password')
        
        // 跳转到登录界面
        router.push('/login')
      } else {
        showError(result.message || '密码修改失败')
      }
    } else if (field === 'nickname') {
      // 昵称修改需要特殊处理
      const newNickname = editForm.value.nickname
      
      // 检查新昵称是否与旧昵称一致
      if (newNickname === userInfo.value.nickname) {
        showError('昵称未发生变化')
        return
      }
      
      // 构造请求数据
      const requestData = {
        nickname: newNickname
      }
      
      logger.info('发送昵称修改请求:', requestData)
      
      // 发送 POST 请求到后端
      const response = await fetch(PROFILE_API.SET_NICKNAME, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      })
      
      result = await response.json()
      logger.info('昵称修改响应:', result)
      
      if (response.ok && result.success === true) {
        showSuccess(result.message || '昵称修改成功！')
        
        // 更新本地数据
        userInfo.value.nickname = newNickname
        
        // ✅ 更新 sessionStorage 缓存
        updateUserInfoField('nickname', newNickname)
        
        // 更新 localStorage
        localStorage.setItem('username', newNickname)
        
        // 从修改集合中移除
        modifiedFields.value.delete('nickname')
        
        // 退出编辑模式（只关闭当前字段）
        editingFields.value.delete('nickname')
        fieldError.value = ''
      } else {
        showError(result.message || '昵称修改失败')
      }
    } else if (field === 'email') {
      // 邮箱修改需要特殊处理
      const newEmail = editForm.value.email
      const emailCode = editForm.value.emailVerificationCode
      
      logger.info('准备修改邮箱:', {
        newEmail,
        emailCode,
        emailCodeLength: emailCode?.length,
        emailSessionId: emailSessionId.value
      })
      
      // 检查新邮箱是否与旧邮箱一致
      if (newEmail === userInfo.value.email) {
        showError('邮箱未发生变化')
        return
      }
      
      // 检查验证码是否为空
      if (!emailCode || emailCode.trim() === '') {
        showError('请输入邮箱验证码')
        return
      }
      
      // 检查是否已发送验证码
      if (!emailSessionId.value) {
        showError('请先发送邮箱验证码')
        return
      }
      
      // 检查 RSA 密钥是否存在
      if (!emailRsaPublicKey.value) {
        logger.warn('邮箱专用 RSA 密钥未加载，尝试重新获取...')
        await loadRsaKey('email')
        emailRsaPublicKey.value = rsaPublicKey.value  // ✅ 保存到专用变量
        
        if (!emailRsaPublicKey.value) {
          showError('系统初始化失败，请刷新页面重试')
          return
        }
      }
      
      // 使用邮箱专用的 RSA 密钥加密邮箱（验证码不加密）
      const encryptedEmail = encryptPassword(newEmail, emailRsaPublicKey.value)
      
      // 构造请求数据（邮箱加密，验证码明文）
      const requestData = {
        sessionId: emailSessionId.value,
        encryptedEmail: encryptedEmail,
        verificationCode: emailCode  // 验证码不加密
      }
      
      logger.info('发送邮箱修改请求:', { 
        sessionId: emailSessionId.value,
        encryptedEmail: encryptedEmail.substring(0, 50) + '...',
        verificationCode: emailCode  // 明文显示验证码长度
      })
      
      // 发送 POST 请求到 /profile/email/set
      const response = await fetch(PROFILE_API.SET_EMAIL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      })
      
      result = await response.json()
      logger.info('邮箱修改响应:', result)
      
      if (response.ok && result.success === true) {
        showSuccess(result.message || '邮箱修改成功！')
        
        // ✅ 停止邮箱验证码倒计时
        countdownTimer.stop()
        emailCountdownRemaining.value = 0
        logger.info('邮箱修改成功，已停止邮箱验证码倒计时')
        
        // 更新本地数据
        userInfo.value.email = newEmail
        
        // ✅ 更新 sessionStorage 缓存
        updateUserInfoField('email', newEmail)
        
        // 更新 localStorage
        localStorage.setItem('userEmail', newEmail)
        
        // 从修改集合中移除
        modifiedFields.value.delete('email')
        
        // 退出编辑模式（只关闭当前字段）
        editingFields.value.delete('email')
        fieldError.value = ''
        clearPurposeSessionId('email')
        emailSessionId.value = ''
        editForm.value.emailVerificationCode = ''
        emailRsaPublicKey.value = ''  // ✅ 清除邮箱专用 RSA 密钥
        logger.info('已清除邮箱专用 RSA 密钥')
      } else {
        showError(result.message || '邮箱修改失败')
      }
    } else if (field === 'phone') {
      // 手机号修改逻辑
      const newPhone = editForm.value.phone
      const phoneCode = editForm.value.phoneVerificationCode
      
      logger.info('准备修改手机号:', {
        newPhone,
        phoneCode,
        phoneCodeLength: phoneCode?.length,
        phoneSessionId: phoneSessionId.value
      })
      
      // 检查新手机号是否与旧手机号一致
      if (newPhone === userInfo.value.phone) {
        showError('手机号未发生变化')
        return
      }
      
      // 检查验证码是否为空
      if (!phoneCode || phoneCode.trim() === '') {
        showError('请输入手机验证码')
        return
      }
      
      // 检查是否已发送验证码
      if (!phoneSessionId.value) {
        showError('请先发送手机验证码')
        return
      }
      
      // 检查 RSA 密钥是否存在
      if (!phoneRsaPublicKey.value) {
        logger.warn('手机号专用 RSA 密钥未加载，尝试重新获取...')
        await loadRsaKey('phone')
        phoneRsaPublicKey.value = rsaPublicKey.value  // ✅ 保存到专用变量
        
        if (!phoneRsaPublicKey.value) {
          showError('系统初始化失败，请刷新页面重试')
          return
        }
      }
      
      // 使用手机号专用的 RSA 密钥加密手机号（验证码不加密）
      const encryptedPhone = encryptPassword(newPhone, phoneRsaPublicKey.value)
      
      // 构造请求数据（手机号加密，验证码明文）
      const requestData = {
        sessionId: phoneSessionId.value,
        encryptedPhone: encryptedPhone,
        verificationCode: phoneCode  // 验证码不加密
      }
      
      logger.info('发送手机号修改请求:', { 
        sessionId: phoneSessionId.value,
        encryptedPhone: encryptedPhone.substring(0, 50) + '...',
        verificationCode: phoneCode  // 明文显示验证码长度
      })
      
      // 发送 POST 请求到 /profile/phone/set
      const response = await fetch(PROFILE_API.SET_PHONE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      })
      
      result = await response.json()
      logger.info('手机号修改响应:', result)
      
      if (response.ok && result.success === true) {
        showSuccess(result.message || '手机号修改成功！')
        
        // ✅ 停止手机验证码倒计时
        phoneCountdownTimer.stop()
        phoneCountdownRemaining.value = 0
        logger.info('手机号修改成功，已停止手机验证码倒计时')
        
        // 更新本地数据
        userInfo.value.phone = newPhone
        
        // ✅ 更新 sessionStorage 缓存
        updateUserInfoField('phone', newPhone)
        
        // 更新 localStorage
        localStorage.setItem('userPhone', newPhone)
        
        // 从修改集合中移除
        modifiedFields.value.delete('phone')
        
        // 退出编辑模式
        editingFields.value.delete('phone')
        fieldError.value = ''
        clearPurposeSessionId('phone')
        phoneSessionId.value = ''
        editForm.value.phoneVerificationCode = ''
        phoneRsaPublicKey.value = ''  // ✅ 清除手机号专用 RSA 密钥
        logger.info('已清除手机号专用 RSA 密钥')
      } else {
        showError(result.message || '手机号修改失败')
      }
    }
  } catch (error) {
    logger.error('修改失败:', error)
    showError('网络错误，请稍后重试')
  } finally {
    isSaving.value = false
  }
}

/**
 * 触发文件选择
 */
const triggerFileInput = () => {
  fileInput.value?.click()
}

/**
 * 处理头像文件选择（上传并设置）
 */
const handleAvatarChange = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  try {
    // 显示上传中状态
    isSaving.value = true
    
    logger.info('开始上传头像...', file.name)
    
    // 调用上传工具（包含验证、上传、设置全流程）
    const result = await uploadAndSetAvatar(file, (progress) => {
      logger.debug(`头像上传进度: ${progress}%`)
    })
    
    // 更新预览（转换为完整 URL）
    previewAvatar.value = getFullAvatarUrl(result.filePath)
    
    // 更新原始数据
    originalData.value.avatar = previewAvatar.value
    hasChanges.value = false
    
    showSuccess(result.message || '头像设置成功！')
    logger.info('头像上传成功', result)
  } catch (error) {
    logger.error('头像上传失败:', error)
    showError('头像上传失败：' + error.message)
  } finally {
    isSaving.value = false
  }
}

/**
 * 从缓存加载用户信息
 */
const loadUserInfoFromCache = () => {
  try {
    const cachedUserInfo = getCachedUserInfo()
    
    // 检查缓存是否存在（区分 null/undefined 和空对象）
    if (!cachedUserInfo) {
      logger.warn('未找到缓存的用户信息')
      return false
    }
    
    logger.info('从缓存加载用户信息...')
    logger.debug('缓存数据:', cachedUserInfo)
    
    // 更新用户信息（保留空字符串，不覆盖为默认值）
    userInfo.value.nickname = cachedUserInfo.nickname !== undefined ? cachedUserInfo.nickname : ''
    userInfo.value.email = cachedUserInfo.email !== undefined ? cachedUserInfo.email : ''
    userInfo.value.phone = cachedUserInfo.phone !== undefined ? cachedUserInfo.phone : ''
    userInfo.value.storageUsed = cachedUserInfo.storageUsed !== undefined ? cachedUserInfo.storageUsed : '0 GB'
    userInfo.value.storageTotal = cachedUserInfo.storageTotal !== undefined ? cachedUserInfo.storageTotal : '10 GB'
    
    // 更新编辑表单的原始数据
    editForm.value.nickname = userInfo.value.nickname
    editForm.value.email = userInfo.value.email
    editForm.value.phone = userInfo.value.phone
    
    originalData.value.nickname = userInfo.value.nickname
    originalData.value.email = userInfo.value.email
    originalData.value.phone = userInfo.value.phone
    
    // 如果有头像信息，加载头像
    if (cachedUserInfo.avatar) {
      logger.info('检测到头像信息:', cachedUserInfo.avatar)
      
      const fullUrl = getFullAvatarUrl(cachedUserInfo.avatar)
      logger.info('完整头像 URL:', fullUrl)
      
      // 检查 JWT 令牌
      const token = getToken()
      if (!token) {
        logger.error('JWT 令牌不存在，无法加载头像')
        previewAvatar.value = fullUrl
        return true
      }
      
      logger.info('开始加载头像...')
      
      loadAuthenticatedImage(fullUrl)
        .then(blobUrl => {
          logger.info('头像加载成功')
          logger.debug('Blob URL:', blobUrl)
          previewAvatar.value = blobUrl
        })
        .catch(error => {
          logger.error('头像加载失败:', error.message)
          logger.error('错误详情:', error)
          logger.info('尝试使用原始 URL')
          previewAvatar.value = fullUrl
        })
    } else {
      logger.info('缓存中没有头像信息')
    }
    
    logger.info('用户信息加载成功')
    return true
  } catch (error) {
    logger.error('加载用户信息失败:', error)
    return false
  }
}

/**
 * 获取 RSA 公钥并保存到 Cookie
 * @param {string} purpose - 可选的用途标识（'email', 'phone', 'password'）
 */
const loadRsaKey = async (purpose = null) => {
  if (isRsaKeyLoading.value) {
    logger.debug('RSA 密钥正在加载中，跳过重复请求')
    return
  }
  
  isRsaKeyLoading.value = true
  
  try {
    logger.info('开始获取 RSA 公钥...', purpose ? `(用途: ${purpose})` : '(全局)')
    
    // 直接调用 /auth/rsa-key 获取新公钥（后端不进行有效性校验）
    const keyData = await fetchRSAKey(purpose)
    rsaPublicKey.value = keyData.publicKey
    sessionId.value = keyData.sessionId
    logger.info('RSA 公钥获取成功')
  } catch (error) {
    logger.error('获取 RSA 公钥失败:', error)
    showError('系统初始化失败，请刷新页面重试')
  } finally {
    isRsaKeyLoading.value = false
  }
}

/**
 * 当前密码框聚焦处理 - 加载 RSA 密钥
 */
const handleOldPasswordFocus = async () => {
  logger.info('当前密码框获得焦点，开始加载 RSA 密钥')
  await loadRsaKey()
}

/**
 * 处理发送邮箱验证码
 */
const handleSendVerificationCode = async () => {
  // 验证邮箱格式
  if (!isEmailValid.value) {
    showError('请输入有效的邮箱地址')
    return
  }

  isSendingCode.value = true

  try {
    logger.info('开始发送邮箱验证码...')

    // 确保有邮箱专用的 sessionId
    if (!emailSessionId.value) {
      emailSessionId.value = getOrCreatePurposeSessionId('email')
      logger.info('生成邮箱修改专用 sessionId:', emailSessionId.value)
    }

    // 调用发送验证码接口，传入邮箱专用的 sessionId
    const result = await sendVerificationCode(editForm.value.email, emailSessionId.value)

    if (result.success) {
      logger.info('验证码发送成功')

      // 显示成功消息
      showSuccess(result.message || '邮箱验证码已发送')

      // 启动倒计时
      countdownTimer.start(
        (remaining) => {
          logger.debug(`倒计时: ${remaining}s`)
          emailCountdownRemaining.value = remaining
        },
        () => {
          logger.info('倒计时结束，可以重新发送验证码')
          emailCountdownRemaining.value = 0
        }
      )
    } else {
      // 显示错误消息
      showError(result.message || '邮箱验证码发送失败')
    }
  } catch (error) {
    logger.error('发送验证码异常:', error)
    showError('网络错误，请稍后重试')
  } finally {
    isSendingCode.value = false
  }
}

/**
 * 处理发送手机验证码
 */
const handleSendPhoneVerificationCode = async () => {
  // 验证手机号格式
  const phoneRegex = /^1[3-9]\d{9}$/
  if (!editForm.value.phone || !phoneRegex.test(editForm.value.phone)) {
    showError('请输入有效的11位手机号')
    return
  }

  isSendingPhoneCode.value = true

  try {
    logger.info('开始发送手机验证码...')

    // 确保有手机号专用的 sessionId
    if (!phoneSessionId.value) {
      phoneSessionId.value = getOrCreatePurposeSessionId('phone')
      logger.info('生成手机号修改专用 sessionId:', phoneSessionId.value)
    }

    // 调用发送验证码接口，传入手机号专用的 sessionId
    const result = await sendPhoneVerificationCode(editForm.value.phone, phoneSessionId.value)

    if (result.success) {
      logger.info('手机验证码发送成功')

      // 显示成功消息
      showSuccess(result.message || '手机验证码已发送')

      // 启动倒计时
      phoneCountdownTimer.start(
        (remaining) => {
          logger.debug(`手机验证码倒计时: ${remaining}s`)
          phoneCountdownRemaining.value = remaining
        },
        () => {
          logger.info('手机验证码倒计时结束，可以重新发送')
          phoneCountdownRemaining.value = 0
        }
      )
    } else {
      // 显示错误消息
      showError(result.message || '手机验证码发送失败')
    }
  } catch (error) {
    logger.error('发送手机验证码异常:', error)
    showError('网络错误，请稍后重试')
  } finally {
    isSendingPhoneCode.value = false
  }
}

/**
 * 邮箱失焦处理
 */
const handleEmailBlur = () => {
  emailBlurred.value = true
}

/**
 * 手机号失焦处理
 */
const handlePhoneBlur = () => {
  phoneBlurred.value = true
}

/**
 * 检查是否有更改
 */
const checkChanges = () => {
  const nicknameChanged = editForm.value.nickname !== originalData.value.nickname
  const emailChanged = editForm.value.email !== originalData.value.email
  const phoneChanged = editForm.value.phone !== originalData.value.phone
  const avatarChanged = previewAvatar.value !== originalData.value.avatar
  const passwordChanged = !!(editForm.value.oldPassword || editForm.value.newPassword || editForm.value.confirmPassword)

  hasChanges.value = nicknameChanged || emailChanged || phoneChanged || avatarChanged || passwordChanged
}

/**
 * 滚动到指定区块
 */
const scrollToSection = (section) => {
  const element = document.getElementById(`section-${section}`)
  if (element && contentArea.value) {
    // 清除之前的高亮
    if (highlightTimeout) {
      clearTimeout(highlightTimeout)
    }
    
    // 平滑滚动到目标位置
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    
    // 更新激活的选项卡
    activeTab.value = section
    
    // 获取内容卡片和标题元素
    const contentCard = element.querySelector('.content-card')
    const cardTitle = element.querySelector('.card-title')
    
    // 添加快速过渡类
    if (contentCard) contentCard.classList.add('quick-transition')
    if (cardTitle) cardTitle.classList.add('quick-transition')
    
    // 添加高亮效果
    highlightedSection.value = section
    
    // 0.3秒后移除快速过渡类（高亮显示完成后）
    setTimeout(() => {
      if (contentCard) contentCard.classList.remove('quick-transition')
      if (cardTitle) cardTitle.classList.remove('quick-transition')
    }, 300)
    
    // 1.5秒后开始渐变熄灭（高亮停留 + 快速显示）
    highlightTimeout = setTimeout(() => {
      highlightedSection.value = ''
    }, 1500)
  }
}

/**
 * 处理滚动事件，自动更新激活的选项卡
 */
const handleScroll = () => {
  if (scrollTimeout) {
    clearTimeout(scrollTimeout)
  }
  
  scrollTimeout = setTimeout(() => {
    if (!contentArea.value) return
    
    const sections = ['avatar', 'basic', 'contact', 'password', 'verification', 'info']
    const scrollTop = contentArea.value.scrollTop
    
    // 找到当前可见的区块
    for (let i = sections.length - 1; i >= 0; i--) {
      const section = sections[i]
      const element = document.getElementById(`section-${section}`)
      
      if (element) {
        const offsetTop = element.offsetTop
        
        // 如果滚动位置超过该区块的顶部，则激活该区块
        if (scrollTop >= offsetTop - 100) {
          if (activeTab.value !== section) {
            activeTab.value = section
          }
          break
        }
      }
    }
  }, 100)
}

/**
 * 验证表单
 */
const validateForm = () => {
  // 如果修改了密码，需要验证
  if (editForm.value.oldPassword || editForm.value.newPassword || editForm.value.confirmPassword) {
    if (!editForm.value.oldPassword) {
      showError('请输入当前密码')
      return false
    }
    if (!editForm.value.newPassword) {
      showError('请输入新密码')
      return false
    }
    if (editForm.value.newPassword.length < 6 || editForm.value.newPassword.length > 14) {
      showError('新密码长度应在6-14位之间')
      return false
    }
    if (editForm.value.newPassword !== editForm.value.confirmPassword) {
      showError('两次输入的新密码不一致')
      return false
    }
  }

  // 验证昵称
  if (!editForm.value.nickname.trim()) {
    showError('昵称不能为空')
    return false
  }

  // 验证邮箱
  if (editForm.value.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(editForm.value.email)) {
      showError('请输入有效的邮箱地址')
      return false
    }
  }

  // 验证手机号
  if (editForm.value.phone) {
    const phoneRegex = /^1[3-9]\d{9}$/
    if (!phoneRegex.test(editForm.value.phone)) {
      showError('请输入有效的11位手机号')
      return false
    }
  }

  return true
}

/**
 * 保存个人信息
 */
const saveProfile = async () => {
  // 检查是否已验证密码（除头像外的修改都需要验证）
  const hasNonAvatarChanges = editForm.value.nickname !== originalData.value.nickname ||
                              editForm.value.email !== originalData.value.email ||
                              editForm.value.phone !== originalData.value.phone ||
                              editForm.value.newPassword || editForm.value.confirmPassword
  
  if (hasNonAvatarChanges && !isPasswordVerified.value) {
    showError('请先在“修改验证”栏目中验证原密码，才能修改个人信息')
    // 自动滚动到验证栏目
    scrollToSection('verification')
    return
  }
  
  if (!validateForm()) {
    return
  }

  isSaving.value = true

  try {
    // 模拟 API 调用延迟
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 保存到 localStorage（实际项目中应该调用后端 API）
    localStorage.setItem('username', editForm.value.nickname)

    if (editForm.value.email) {
      localStorage.setItem('userEmail', editForm.value.email)
    }

    if (editForm.value.phone) {
      localStorage.setItem('userPhone', editForm.value.phone)
    }

    if (previewAvatar.value) {
      localStorage.setItem('userAvatar', previewAvatar.value)
    }

    // 如果修改了密码，这里应该调用后端 API 更新密码
    if (editForm.value.newPassword) {
      logger.info('密码已修改')
      // TODO: 调用后端 API 更新密码
    }

    showSuccess('保存成功！')
    hasChanges.value = false

    // 更新原始数据
    originalData.value.nickname = editForm.value.nickname
    originalData.value.email = editForm.value.email
    originalData.value.phone = editForm.value.phone
    originalData.value.avatar = previewAvatar.value

    // 清空密码字段
    editForm.value.oldPassword = ''
    editForm.value.newPassword = ''
    editForm.value.confirmPassword = ''

    // 重置失焦状态
    newPasswordBlurred.value = false
    confirmPasswordBlurred.value = false

    // 返回上一页
    setTimeout(() => {
      router.back()
    }, 500)
  } catch (error) {
    logger.error('保存失败:', error)
    showError('保存失败，请重试')
  } finally {
    isSaving.value = false
  }
}

/**
 * 组件挂载时加载用户信息
 */
onMounted(async () => {
  // 从缓存加载用户信息（App.vue 已经获取过）
  let loaded = loadUserInfoFromCache()
  
  // 如果缓存中没有用户信息，从后端获取
  if (!loaded) {
    logger.info('缓存中未找到用户信息，从后端获取...')
    try {
      const allUserInfo = await fetchAllUserInfo()
      if (allUserInfo) {
        logger.info('用户信息获取成功，重新从缓存加载')
        loaded = loadUserInfoFromCache()
      } else {
        logger.error('从后端获取用户信息失败')
        showError('获取用户信息失败，请刷新页面重试')
      }
    } catch (error) {
      logger.error('获取用户信息异常:', error)
      showError('网络错误，请稍后重试')
    }
  }
  
  // 注意：RSA 密钥不在页面加载时获取，只在需要验证密码时才获取
  
  // 解析 JWT 令牌并获取注册时间
  try {
    logger.info('=== JWT 令牌解析开始 ===')
    const registerTimestamp = getRegisterTimeFromToken()
    
    if (registerTimestamp) {
      // 将时间戳转换为日期字符串
      const date = new Date(registerTimestamp)
      const formattedDate = date.getFullYear() + '-' + 
                           String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                           String(date.getDate()).padStart(2, '0')
      registerDate.value = formattedDate
      logger.info('注册时间已设置:', formattedDate)
    } else {
      logger.warn('JWT 中未找到注册时间，使用默认值')
    }
  } catch (error) {
    logger.error('解析 JWT 失败:', error)
  }
  
  // 添加滚动监听
  if (contentArea.value) {
    contentArea.value.addEventListener('scroll', handleScroll)
  }
})

/**
 * 组件卸载前清理
 */
onBeforeUnmount(() => {
  // 清理事件监听
  if (contentArea.value) {
    contentArea.value.removeEventListener('scroll', handleScroll)
  }
  
  // 清理定时器
  if (scrollTimeout) {
    clearTimeout(scrollTimeout)
  }
  if (highlightTimeout) {
    clearTimeout(highlightTimeout)
  }
  
  // 清理验证码倒计时
  countdownTimer.destroy()
  phoneCountdownTimer.destroy()
  logger.info('已销毁验证码倒计时定时器')
  
  // 清理 Blob URL
  if (previewAvatar.value && previewAvatar.value.startsWith('blob:')) {
    URL.revokeObjectURL(previewAvatar.value)
    logger.debug('已清理头像 Blob URL')
  }
  
  // 清除 Cookie 中的 RSA 密钥（离开页面后不再需要）
  deleteCookie('sessionId')
  deleteCookie('rsaPublicKey')
  logger.info('已清除 Cookie 中的 RSA 密钥')
})
</script>

<style scoped>
/* 主容器：占满整个视口 */
.profile-edit-container {
  width: 100vw; /* 视口宽度的 100% */
  height: 100vh; /* 视口高度的 100% */
  display: flex; /* 启用 Flexbox 布局 */
  flex-direction: column; /* 子元素垂直排列 */
  background-color: #f5f7fa; /* 浅灰色背景 */
}

/* 顶部标题栏 */
.header {
  display: flex; /* 启用 Flexbox 布局 */
  justify-content: space-between; /* 左右两端对齐 */
  align-items: center; /* 垂直居中对齐 */
  padding: 1rem 2rem; /* 上下 16px，左右 32px 内边距 */
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); /* 紫色渐变背景 */
  color: white; /* 白色文字 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); /* 轻微阴影 */
}

/* 标题栏左侧 */
.header-left {
  display: flex; /* 启用 Flexbox 布局 */
  align-items: center; /* 垂直居中对齐 */
  gap: 1rem; /* 间距 16px */
}

/* 返回按钮 */
.btn-back {
  display: flex; /* 启用 Flexbox 布局 */
  align-items: center; /* 垂直居中 */
  gap: 0.5rem; /* 图标和文字间距 */
  padding: 0.5rem 1rem; /* 内边距 */
  background: rgba(255, 255, 255, 0.2); /* 半透明白色背景 */
  border: none; /* 无边框 */
  border-radius: 8px; /* 圆角 */
  color: white; /* 白色文字 */
  font-size: 0.95rem; /* 字体大小 */
  cursor: pointer; /* 手型光标 */
  transition: all 0.3s ease; /* 过渡动画 */
  backdrop-filter: blur(10px); /* 背景模糊 */
}

/* 返回按钮悬停效果 */
.btn-back:hover {
  background: rgba(255, 255, 255, 0.3); /* 增加透明度 */
  transform: translateY(-2px); /* 向上移动 */
}

/* 页面标题 */
.page-title {
  font-size: 1.5rem; /* 字体大小 24px */
  font-weight: 600; /* 字体粗细：半粗体 */
  margin: 0; /* 清除默认外边距 */
}

/* 标题栏右侧 */
.header-right {
  display: flex; /* 启用 Flexbox 布局 */
  gap: 1rem; /* 间距 */
}

/* 通用按钮样式 */
.btn {
  display: flex; /* 启用 Flexbox 布局 */
  align-items: center; /* 垂直居中 */
  gap: 0.5rem; /* 图标和文字间距 */
  padding: 0.625rem 1.25rem; /* 内边距 */
  border: none; /* 无边框 */
  border-radius: 8px; /* 圆角 */
  font-size: 0.95rem; /* 字体大小 */
  font-weight: 500; /* 字体粗细：中等 */
  cursor: pointer; /* 手型光标 */
  transition: all 0.3s ease; /* 过渡动画 */
}

/* 保存按钮 */
.btn-save {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); /* 紫色渐变背景 */
  color: white; /* 白色文字 */
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3); /* 紫色阴影 */
}

/* 保存按钮悬停效果 */
.btn-save:hover:not(:disabled) {
  transform: translateY(-2px); /* 向上移动 */
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); /* 增强阴影 */
}

/* 保存按钮禁用状态 */
.btn-save:disabled {
  opacity: 0.5; /* 降低透明度 */
  cursor: not-allowed; /* 禁止光标 */
  background: #e0e0e0; /* 灰色背景 */
  color: #999; /* 灰色文字 */
  box-shadow: none; /* 移除阴影 */
}

/* 按钮图标 */
.icon {
  font-size: 1.1rem; /* 图标大小 */
}

/* 主内容区域 */
.main-content {
  flex: 1; /* 占据剩余空间 */
  overflow: hidden; /* 隐藏溢出 */
  padding: 2rem; /* 内边距 */
}

/* 内容包装器：左右布局 */
.content-wrapper {
  display: flex; /* 启用 Flexbox 布局 */
  gap: 2rem; /* 左右间距 */
  height: 100%; /* 占满高度 */
  max-width: 1200px; /* 最大宽度 */
  margin: 0 auto; /* 水平居中 */
}

/* 左侧选项卡导航栏 */
.tabs-sidebar {
  width: 220px; /* 固定宽度 */
  background: white; /* 白色背景 */
  border-radius: 16px; /* 圆角 */
  padding: 1.5rem; /* 内边距 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); /* 轻微阴影 */
  flex-shrink: 0; /* 不允许缩小 */
}

/* 选项卡导航容器 */
.tabs-nav {
  display: flex; /* 启用 Flexbox 布局 */
  flex-direction: column; /* 垂直排列 */
  gap: 0.5rem; /* 选项卡间距 */
}

/* 选项卡按钮 */
.tab-item {
  display: flex; /* 启用 Flexbox 布局 */
  align-items: center; /* 垂直居中 */
  gap: 0.75rem; /* 图标和文字间距 */
  padding: 1rem 1.25rem; /* 内边距 */
  border: none; /* 无边框 */
  background: transparent; /* 透明背景 */
  color: #666; /* 灰色文字 */
  font-size: 1rem; /* 字体大小 */
  font-weight: 500; /* 字体粗细：中等 */
  cursor: pointer; /* 手型光标 */
  transition: all 0.3s ease; /* 过渡动画 */
  text-align: left; /* 文字左对齐 */
  width: 100%; /* 占满宽度 */
  border-radius: 8px; /* 圆角 */
}

/* 选项卡悬停效果 */
.tab-item:hover {
  background: #f5f7fa; /* 浅灰色背景 */
  color: #667eea; /* 紫色文字 */
}

/* 选项卡激活状态 */
.tab-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); /* 紫色渐变背景 */
  color: white; /* 白色文字 */
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3); /* 紫色阴影 */
}

/* 选项卡图标 */
.tab-icon {
  font-size: 1.25rem; /* 图标大小 */
}

/* 选项卡文字 */
.tab-text {
  font-weight: 500; /* 字体粗细：中等 */
}

/* 右侧内容区域 */
.tab-content-area {
  flex: 1; /* 占据剩余空间 */
  overflow-y: auto; /* 垂直可滚动 */
  overflow-x: hidden; /* 隐藏横向滚动条 */
  min-width: 0; /* 防止内容溢出 */
}

/* 选项卡面板 */
.tab-pane {
  animation: fadeIn 0.3s ease; /* 淡入动画 */
}

/* 淡入动画 */
@keyframes fadeIn {
  from {
    opacity: 0; /* 初始透明度 */
    transform: translateX(10px); /* 初始位置 */
  }
  to {
    opacity: 1; /* 最终透明度 */
    transform: translateX(0); /* 最终位置 */
  }
}

/* 内容卡片 */
.content-card {
  background: white; /* 白色背景 */
  border-radius: 16px; /* 圆角 */
  padding: 2rem; /* 内边距 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); /* 轻微阴影 */
  overflow: hidden; /* 防止内容溢出 */
  max-width: 100%; /* 最大宽度限制 */
  box-sizing: border-box; /* 包含内边距和边框 */
  position: relative; /* 为伪元素定位 */
  transition: box-shadow 1.5s ease-out; /* 阴影慢速过渡 */
}

/* 高亮背景层（使用伪元素） */
.content-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%);
  opacity: 0; /* 默认隐藏 */
  transition: opacity 1.5s ease-out; /* 默认慢速过渡（熄灭） */
  pointer-events: none; /* 不阻挡点击 */
  z-index: 0; /* 在内容下方 */
}

/* 确保内容在伪元素上方 */
.content-card > * {
  position: relative;
  z-index: 1;
}

/* 高亮效果 - 显示背景层 */
.tab-pane.highlighted .content-card::before {
  opacity: 1; /* 显示高亮背景 */
}

/* 高亮效果 - 阴影增强 */
.tab-pane.highlighted .content-card {
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.35);
}

/* 快速过渡类（用于高亮显示时） */
.content-card.quick-transition::before {
  transition: opacity 0.3s ease-out; /* 背景快速过渡 */
}

.content-card.quick-transition {
  transition: box-shadow 0.3s ease-out; /* 阴影快速过渡 */
}

/* 卡片标题 */
.card-title {
  display: flex; /* 启用 Flexbox 布局 */
  align-items: center; /* 垂直居中 */
  gap: 0.75rem; /* 图标和文字间距 */
  font-size: 1.25rem; /* 字体大小 20px */
  font-weight: 600; /* 字体粗细：半粗体 */
  color: #333; /* 深灰色文字 */
  margin: 0 0 1.5rem 0; /* 下边距 */
  padding-bottom: 1rem; /* 底部内边距 */
  border-bottom: 2px solid #f0f0f0; /* 底部分隔线 */
  transition: color 1.5s ease-out, border-bottom-color 1.5s ease-out; /* 默认慢速过渡（熄灭） */
}

/* 高亮效果 - 标题颜色变化 */
.tab-pane.highlighted .card-title {
  color: #667eea;
  border-bottom-color: #667eea;
}

/* 快速过渡类（用于高亮显示时） */
.card-title.quick-transition {
  transition: color 0.3s ease-out, border-bottom-color 0.3s ease-out;
}

/* 头像上传区域 */
.avatar-upload {
  display: flex; /* 启用 Flexbox 布局 */
  flex-direction: column; /* 垂直排列 */
  align-items: center; /* 水平居中 */
  gap: 1rem; /* 间距 */
}

/* 头像预览容器 */
.avatar-preview {
  width: 150px; /* 宽度 */
  height: 150px; /* 高度 */
  border-radius: 50%; /* 圆形 */
  overflow: hidden; /* 隐藏溢出 */
  position: relative; /* 相对定位 */
  cursor: pointer; /* 手型光标 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); /* 阴影 */
  transition: all 0.3s ease; /* 过渡动画 */
}

/* 头像预览悬停效果 */
.avatar-preview:hover {
  transform: scale(1.05); /* 放大 */
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25); /* 加深阴影 */
}

/* 头像图片 */
.avatar-img {
  width: 100%; /* 宽度 100% */
  height: 100%; /* 高度 100% */
  object-fit: cover; /* 保持比例覆盖 */
  display: block; /* 块级元素 */
}

/* 头像占位符（默认头像） */
.avatar-placeholder {
  width: 100%; /* 宽度 100% */
  height: 100%; /* 高度 100% */
  display: flex; /* 启用 Flexbox 布局 */
  align-items: center; /* 垂直居中 */
  justify-content: center; /* 水平居中 */
  color: white; /* 白色文字 */
  font-size: 3.5rem; /* 字体大小 */
  font-weight: 600; /* 字体粗细：半粗体 */
}

/* 头像悬停遮罩层 */
.avatar-overlay {
  position: absolute; /* 绝对定位 */
  top: 0; /* 顶部对齐 */
  left: 0; /* 左侧对齐 */
  right: 0; /* 右侧对齐 */
  bottom: 0; /* 底部对齐 */
  background: rgba(0, 0, 0, 0.5); /* 半透明黑色背景 */
  display: flex; /* 启用 Flexbox 布局 */
  flex-direction: column; /* 垂直排列 */
  align-items: center; /* 水平居中 */
  justify-content: center; /* 垂直居中 */
  opacity: 0; /* 初始隐藏 */
  transition: opacity 0.3s ease; /* 过渡动画 */
  color: white; /* 白色文字 */
}

/* 头像悬停时显示遮罩 */
.avatar-preview:hover .avatar-overlay {
  opacity: 1; /* 显示 */
}

/* 上传图标 */
.upload-icon {
  font-size: 2rem; /* 图标大小 */
  margin-bottom: 0.5rem; /* 下边距 */
}

/* 上传文字 */
.upload-text {
  font-size: 0.875rem; /* 字体大小 */
}

/* 提示文字 */
.hint-text {
  color: #999; /* 灰色文字 */
  font-size: 0.875rem; /* 字体大小 */
  margin: 0; /* 清除外边距 */
}

/* 表单组 */
.form-group {
  margin-bottom: 1.5rem; /* 下边距 */
  position: relative; /* 相对定位 */
}

/* 表单标签 */
.form-group label {
  display: flex; /* 启用 Flexbox 布局 */
  align-items: center; /* 垂直居中 */
  gap: 0.5rem; /* 图标和文字间距 */
  margin-bottom: 0.5rem; /* 下边距 */
  color: #333; /* 深灰色文字 */
  font-weight: 500; /* 字体粗细：中等 */
  font-size: 0.95rem; /* 字体大小 */
}

/* 标签图标 */
.label-icon {
  font-size: 1.1rem; /* 图标大小 */
}

/* 表单输入框 */
.form-group input {
  width: 100%; /* 宽度 100% */
  padding: 0.75rem 1rem; /* 内边距 */
  border: 2px solid #e8e8e8; /* 边框 */
  border-radius: 8px; /* 圆角 */
  font-size: 1rem; /* 字体大小 */
  transition: all 0.3s ease; /* 过渡动画 */
  outline: none; /* 移除默认轮廓 */
}

/* 输入框聚焦效果 */
.form-group input:focus {
  border-color: #667eea; /* 紫色边框 */
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1); /* 紫色光晕 */
}

/* 字符计数 */
.char-count {
  text-align: right; /* 右对齐 */
  color: #999; /* 灰色文字 */
  font-size: 0.875rem; /* 字体大小 */
  margin: 0.25rem 0 0 0; /* 上边距 */
}

/* 错误提示 */
.error-message {
  color: #ff4d4f; /* 红色文字 */
  font-size: 0.875rem; /* 字体大小 */
  margin: 0.25rem 0 0 0; /* 上边距 */
}

/* 成功提示 */
.success-message {
  color: #52c41a; /* 绿色文字 */
  font-size: 0.875rem; /* 字体大小 */
  margin: 0.25rem 0 0 0; /* 上边距 */
  font-weight: 500; /* 中等粗细 */
}

/* 信息显示项（只读模式） */
.info-display-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 1rem;
  transition: all 0.3s ease;
}

.info-display-item:hover {
  background: #e9ecef;
  transform: translateX(4px);
}

.info-display-item .info-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #666;
  font-size: 0.95rem;
  font-weight: 500;
}

.info-display-item .info-value {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.info-display-item .info-value span {
  color: #333;
  font-size: 1rem;
  font-weight: 600;
}

/* 编辑模式容器 */
.edit-mode {
  animation: fadeInUp 0.4s ease;
  margin-bottom: 1.5rem; /* 增加底部间距，避免与下一个只读项过近 */
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 表单组 */
.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  color: #333;
  font-weight: 500;
  font-size: 1rem;
}

.form-group input {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 2px solid #e8e8e8;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  outline: none;
}

.form-group input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* 错误提示 */
.error-message {
  color: #ff4d4f;
  font-size: 0.875rem;
  margin: 0.5rem 0 0 0;
}

/* 字符计数 */
.char-count {
  text-align: right;
  color: #999;
  font-size: 0.875rem;
  margin: 0.5rem 0 0 0;
}

/* 验证码行（验证码输入框 + 发送按钮） */
.verification-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-top: 0.5rem;
}

/* 验证码输入框 */
.verification-code-input {
  flex: 1;
  min-width: 0;
}

/* 发送验证码按钮 */
.btn-verify-code {
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  min-width: 100px;
}

.btn-verify-code:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-verify-code:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: #ccc;
}

/* 按钮组 */
.button-group {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f0f0f0;
}

/* 通用按钮 */
.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

/* 取消按钮 */
.btn-cancel {
  background: #f0f0f0;
  color: #666;
}

.btn-cancel:hover {
  background: #e0e0e0;
  transform: translateY(-2px);
}

/* 保存按钮 */
.btn-save {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.btn-save:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #e0e0e0;
  color: #999;
  box-shadow: none;
}

/* 修改按钮 */
.btn-edit {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.btn-edit:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-edit .edit-icon {
  font-size: 0.9rem;
}

/* 安全提示 */
.security-tip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: #e6f7ff;
  border-left: 4px solid #1890ff;
  border-radius: 4px;
  margin-top: 1rem;
  color: #096dd9;
  font-size: 0.9rem;
}

.security-tip .tip-icon {
  font-size: 1.25rem;
}

/* 警告提示框（Element UI WARN 样式） */
.warning-tip {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, #fdf6ec 0%, #faecd8 100%);
  border: 1px solid #e6a23c;
  border-radius: 8px;
  margin-top: 1rem;
  box-shadow: 0 2px 8px rgba(230, 162, 60, 0.15);
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.warning-tip .tip-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.warning-tip .tip-text {
  color: #d46b08;
  font-size: 0.95rem;
  font-weight: 500;
  line-height: 1.5;
}

/* 全局验证警告（位于头像设置与基本信息之间） */
.global-verification-warning {
  margin: 1.5rem 0;
  padding: 1.25rem 1.5rem;
  background: linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%);
  border: 2px solid #ffa940;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(255, 169, 64, 0.2);
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.global-verification-warning .warning-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.global-verification-warning .warning-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.global-verification-warning .warning-text {
  color: #d46b08;
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.5;
}

/* 验证信息 */
.verification-info {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f0f5ff;
  border-left: 4px solid #667eea;
  border-radius: 4px;
}

.verification-info .info-text {
  margin: 0;
  color: #595959;
  font-size: 0.9rem;
  line-height: 1.6;
}

.verification-info .info-icon {
  margin-right: 0.5rem;
}

/* 信息网格 */
.info-grid {
  display: grid; /* 启用 Grid 布局 */
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); /* 自适应列 */
  gap: 1rem; /* 间距 */
}

/* 信息项 */
.info-item {
  display: flex; /* 启用 Flexbox 布局 */
  flex-direction: column; /* 垂直排列 */
  gap: 0.5rem; /* 间距 */
  padding: 1rem; /* 内边距 */
  background: #f8f9fa; /* 浅灰色背景 */
  border-radius: 8px; /* 圆角 */
}

/* 信息项标签 */
.info-item label {
  color: #666; /* 灰色文字 */
  font-size: 0.875rem; /* 字体大小 */
  font-weight: 500; /* 字体粗细：中等 */
}

/* 信息项值 */
.info-item span {
  color: #333; /* 深灰色文字 */
  font-size: 1rem; /* 字体大小 */
  font-weight: 600; /* 字体粗细：半粗体 */
}

/* 账号状态激活样式 */
.status-active {
  color: #52c41a !important; /* 绿色文字 */
}

/* 移动端响应式适配（竖屏） */
@media (max-width: 768px) {
  /* 缩小标题栏内边距 */
  .header {
    padding: 1rem; /* 四周 16px */
  }

  /* 缩小页面标题 */
  .page-title {
    font-size: 1.2rem; /* 字体大小 */
  }

  /* 缩小主内容区内边距 */
  .main-content {
    padding: 1rem; /* 四周 16px */
    overflow-y: auto; /* 垂直可滚动 */
  }

  /* 内容包装器改为垂直布局 */
  .content-wrapper {
    flex-direction: column; /* 垂直排列 */
    gap: 1rem; /* 间距 */
  }

  /* 隐藏左侧选项卡导航 */
  .tabs-sidebar {
    display: none; /* 完全隐藏 */
  }

  /* 右侧内容区域占满宽度 */
  .tab-content-area {
    width: 100%; /* 全宽 */
    flex: 1; /* 占据剩余空间 */
  }

  /* 显示所有选项卡面板（纵向排列） */
  .tab-pane {
    display: block !important; /* 强制显示所有面板 */
    animation: none; /* 移除动画 */
    margin-bottom: 1rem; /* 面板间距 */
  }

  /* 最后一个面板不需要下边距 */
  .tab-pane:last-child {
    margin-bottom: 0; /* 清除下边距 */
  }

  /* 内容卡片缩小内边距 */
  .content-card {
    padding: 1.5rem; /* 内边距 */
  }

  /* 卡片标题缩小 */
  .card-title {
    font-size: 1.1rem; /* 字体大小 */
    margin-bottom: 1rem; /* 下边距 */
    padding-bottom: 0.75rem; /* 底部内边距 */
  }

  /* 头像预览缩小 */
  .avatar-preview {
    width: 120px; /* 宽度 */
    height: 120px; /* 高度 */
  }

  /* 头像占位符字体缩小 */
  .avatar-placeholder {
    font-size: 3rem; /* 字体大小 */
  }

  /* 表单组间距缩小 */
  .form-group {
    margin-bottom: 1rem; /* 下边距 */
  }

  /* 信息网格改为单列 */
  .info-grid {
    grid-template-columns: 1fr; /* 单列布局 */
  }

  /* 信息项缩小内边距 */
  .info-item {
    padding: 0.75rem; /* 内边距 */
  }
}

/* 横屏适配（landscape）- 保留侧边栏 + 堆叠滚动布局 */
@media (min-width: 769px) and (orientation: landscape) {
  /* 显示左侧选项卡导航 */
  .tabs-sidebar {
    display: block; /* 显示侧边栏 */
  }

  /* 内容包装器保持左右布局 */
  .content-wrapper {
    flex-direction: row; /* 水平排列 */
    gap: 2rem; /* 左右间距 */
  }

  /* 右侧内容区域 */
  .tab-content-area {
    flex: 1; /* 占据剩余空间 */
    overflow-y: auto; /* 垂直可滚动 */
  }

  /* 显示所有选项卡面板（纵向排列） */
  .tab-pane {
    display: block !important; /* 强制显示所有面板 */
    animation: none; /* 移除动画 */
    margin-bottom: 1.5rem; /* 面板间距 */
  }

  /* 最后一个面板不需要下边距 */
  .tab-pane:last-child {
    margin-bottom: 0; /* 清除下边距 */
  }

  /* 内容卡片缩小内边距 */
  .content-card {
    padding: 1.5rem; /* 内边距 */
  }

  /* 卡片标题缩小 */
  .card-title {
    font-size: 1.1rem; /* 字体大小 */
    margin-bottom: 1rem; /* 下边距 */
    padding-bottom: 0.75rem; /* 底部内边距 */
  }

  /* 头像预览缩小 */
  .avatar-preview {
    width: 120px; /* 宽度 */
    height: 120px; /* 高度 */
  }

  /* 头像占位符字体缩小 */
  .avatar-placeholder {
    font-size: 3rem; /* 字体大小 */
  }

  /* 表单组间距缩小 */
  .form-group {
    margin-bottom: 1rem; /* 下边距 */
  }

  /* 信息网格改为单列 */
  .info-grid {
    grid-template-columns: 1fr; /* 单列布局 */
  }

  /* 信息项缩小内边距 */
  .info-item {
    padding: 0.75rem; /* 内边距 */
  }
}
</style>