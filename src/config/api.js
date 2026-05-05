/**
 * API 配置
 * 统一管理后端接口地址
 * 
 * 注意：开发环境下使用相对路径，通过 Vite 代理转发到后端
 * 生产环境下需要配置完整的后端地址
 */

// 检测是否为开发环境
const isDev = import.meta.env.DEV

// 基础 API 地址
// 开发环境：使用相对路径，通过 Vite 代理
// 生产环境：使用完整 URL
export const BASE_API_URL = isDev ? '' : 'http://localhost:8835'

// 认证相关接口
export const AUTH_API = {
  // 获取 RSA 公钥
  RSA_KEY: `${BASE_API_URL}/auth/rsa-key`,
  
  // 验证 RSA 密钥有效性
  VALIDATE_RSA: `${BASE_API_URL}/auth/is_rsa_valid`,
  
  // 登录
  LOGIN: `${BASE_API_URL}/auth/login`,
  
  // 注册
  REGISTER: `${BASE_API_URL}/auth/register`,
  
  // 获取安全问题列表
  SECURITY_QUESTIONS: `${BASE_API_URL}/auth/security-questions`,
  
  // 发送邮箱验证码
  SEND_VERIFICATION_CODE: `${BASE_API_URL}/auth/vfcode/email`,
  
  // 发送手机号验证码
  SEND_PHONE_VERIFICATION_CODE: `${BASE_API_URL}/auth/vfcode/phone`,
  
  // 重置密码 - 查找用户
  RESET_PASSWORD_FIND_USER: `${BASE_API_URL}/auth/reset_password/find_user`,
  
  // 重置密码 - 邮箱验证
  RESET_PASSWORD_VERIFY_EMAIL: `${BASE_API_URL}/auth/reset_password/verify/email`,
  
  // 重置密码 - 手机验证
  RESET_PASSWORD_VERIFY_PHONE: `${BASE_API_URL}/auth/reset_password/verify/phone`,
  
  // 重置密码 - 密保问题验证
  RESET_PASSWORD_VERIFY_SECURITY: `${BASE_API_URL}/auth/reset_password/verify/security_answer`,
  
  // 重置密码 - 设置新密码
  RESET_PASSWORD_SET_NEW: `${BASE_API_URL}/auth/reset_password/set_new_password`,
  
  // 重置密码 - 重置密码（最后一步）
  RESET_PASSWORD_RESET: `${BASE_API_URL}/auth/reset_password/reset`
}

// 用户相关接口（示例，可根据需要扩展）
export const USER_API = {
  // 获取用户信息
  PROFILE: `${BASE_API_URL}/user/profile`,
  
  // 更新用户信息
  UPDATE_PROFILE: `${BASE_API_URL}/user/profile`,
  
  // 修改密码
  CHANGE_PASSWORD: `${BASE_API_URL}/user/password`,
  
  // 上传头像
  UPLOAD_AVATAR: `${BASE_API_URL}/user/avatar`
}

// 文件相关接口
export const FILE_API = {
  // 浏览文件
  BROWSE: `${BASE_API_URL}/file/browse`,
  
  // 下载文件
  DOWNLOAD: `${BASE_API_URL}/file/download`,
  
  // 删除文件
  DELETE: `${BASE_API_URL}/file/delete`,
  
  // 创建文件夹
  CREATE_FOLDER: `${BASE_API_URL}/file/folder`,
  
  // 上传相关接口
  UPLOAD: {
    // 初始化上传任务
    INIT: `${BASE_API_URL}/file/upload/init`,
    
    // 上传分片
    CHUNK: `${BASE_API_URL}/file/upload/chunk`,
    
    // 合并分片
    MERGE: `${BASE_API_URL}/file/upload/merge`,
    
    // 查询上传进度
    PROGRESS: `${BASE_API_URL}/file/upload/progress`
  }
}

// 个人资料相关接口
export const PROFILE_API = {
  // 获取头像
  GET_AVATAR: `${BASE_API_URL}/profile/avatar/get`,
  
  // 设置头像
  SET_AVATAR: `${BASE_API_URL}/profile/avatar/set`,
  
  // 上传头像（使用文件上传接口）
  UPLOAD_AVATAR: FILE_API.UPLOAD,
  
  // 删除头像
  DELETE_AVATAR: `${BASE_API_URL}/profile/avatar/delete`,
  
  // 修改密码
  CHANGE_PASSWORD: `${BASE_API_URL}/profile/password/set`,
  
  // 修改邮箱
  SET_EMAIL: `${BASE_API_URL}/profile/email/set`,
  
  // 修改手机号
  SET_PHONE: `${BASE_API_URL}/profile/phone/set`,
  
  // 修改昵称
  SET_NICKNAME: `${BASE_API_URL}/profile/nickname/set`,
  
  // 获取所有个人信息
  GET_ALL: `${BASE_API_URL}/profile/get_all`
}

// 传输相关接口（示例，可根据需要扩展）
export const TRANSFER_API = {
  // 获取传输列表
  LIST: `${BASE_API_URL}/transfer/list`,
  
  // 暂停传输
  PAUSE: `${BASE_API_URL}/transfer/pause`,
  
  // 恢复传输
  RESUME: `${BASE_API_URL}/transfer/resume`,
  
  // 取消传输
  CANCEL: `${BASE_API_URL}/transfer/cancel`
}

/**
 * 创建完整的 API URL
 * @param {string} basePath - 基础路径（如 AUTH_API, USER_API 等）
 * @param {string} endpoint - 端点后缀
 * @returns {string} 完整的 API URL
 */
export const createApiUrl = (basePath, endpoint) => {
  return `${basePath}${endpoint}`
}

/**
 * 默认导出所有 API 配置
 */
export default {
  BASE_API_URL,
  AUTH_API,
  USER_API,
  FILE_API,
  TRANSFER_API,
  createApiUrl
}
