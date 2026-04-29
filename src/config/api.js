/**
 * API 配置
 * 统一管理后端接口地址
 */

// 基础 API 地址
export const BASE_API_URL = 'http://localhost:8835'

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
  SECURITY_QUESTIONS: `${BASE_API_URL}/auth/security-questions`
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
  DELETE_AVATAR: `${BASE_API_URL}/profile/avatar/delete`
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
