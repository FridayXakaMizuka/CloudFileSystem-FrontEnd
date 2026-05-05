/**
 * 客户端环境检测工具
 * 用于判断当前运行环境（浏览器 / Electron / 移动端等）
 */

import { createLogger } from './logger'

const logger = createLogger('ClientDetector')

/**
 * 客户端类型枚举
 */
export const ClientType = {
  BROWSER: 'browser',        // 浏览器
  ELECTRON: 'electron',      // Electron PC 客户端
  ANDROID: 'android',        // Android 客户端
  IOS: 'ios',                // iOS 客户端
  UNKNOWN: 'unknown',        // 未知
}

/**
 * 平台信息接口
 */
export class ClientInfo {
  constructor() {
    this.type = ClientType.UNKNOWN
    this.platform = ''
    this.userAgent = navigator.userAgent
    this.isElectron = false
    this.isMobile = false
    this.electronVersion = null
    this.chromeVersion = null
    this.nodeVersion = null
  }
}

/**
 * 检测是否为 Electron 环境
 */
const isElectronEnvironment = () => {
  // 方法1：检查 window.electronAPI（我们的预加载脚本注入的）
  if (typeof window !== 'undefined' && window.electronAPI) {
    return true
  }
  
  // 方法2：检查 userAgent
  if (typeof navigator !== 'undefined') {
    return navigator.userAgent.toLowerCase().includes('electron')
  }
  
  return false
}

/**
 * 检测是否为移动端
 */
const isMobileEnvironment = () => {
  if (typeof navigator !== 'undefined') {
    const ua = navigator.userAgent.toLowerCase()
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua)
  }
  return false
}

/**
 * 检测具体平台
 */
const detectPlatform = () => {
  if (typeof navigator === 'undefined') {
    return ''
  }
  
  const ua = navigator.userAgent.toLowerCase()
  const platform = navigator.platform?.toLowerCase() || ''
  
  if (ua.includes('win')) return 'windows'
  if (ua.includes('mac')) return 'macos'
  if (ua.includes('linux')) return 'linux'
  if (ua.includes('android')) return 'android'
  if (/iphone|ipad|ipod/.test(ua)) return 'ios'
  
  return platform || 'unknown'
}

/**
 * 获取客户端信息（同步版本，用于快速判断）
 */
export const getClientInfoSync = () => {
  const info = new ClientInfo()
  
  info.isElectron = isElectronEnvironment()
  info.isMobile = isMobileEnvironment()
  info.platform = detectPlatform()
  
  if (info.isElectron) {
    info.type = ClientType.ELECTRON
  } else if (info.isMobile) {
    if (info.platform === 'android') {
      info.type = ClientType.ANDROID
    } else if (info.platform === 'ios') {
      info.type = ClientType.IOS
    } else {
      info.type = ClientType.MOBILE
    }
  } else {
    info.type = ClientType.BROWSER
  }
  
  logger.debug('客户端信息（同步）:', {
    type: info.type,
    platform: info.platform,
    isElectron: info.isElectron,
    isMobile: info.isMobile,
  })
  
  return info
}

/**
 * 获取详细的客户端信息（异步版本，Electron 环境下可获取更多信息）
 */
export const getClientInfo = async () => {
  const info = getClientInfoSync()
  
  // 如果是 Electron 环境，尝试获取更详细的信息
  if (info.isElectron && typeof window !== 'undefined' && window.electronAPI) {
    try {
      const electronDetails = await window.electronAPI.getClientInfo()
      info.electronVersion = electronDetails.electronVersion
      info.chromeVersion = electronDetails.chromeVersion
      info.nodeVersion = electronDetails.nodeVersion
      
      logger.info('Electron 详细信息:', electronDetails)
    } catch (error) {
      logger.warn('获取 Electron 详细信息失败:', error)
    }
  }
  
  logger.info('完整客户端信息:', info)
  return info
}

/**
 * 获取用于 API 请求的客户端标识
 * 这个值会随 JWT 令牌一起发送到后端
 */
export const getClientIdentifier = () => {
  const info = getClientInfoSync()
  
  // 构建客户端标识字符串
  let identifier = info.type
  
  if (info.type === ClientType.ELECTRON) {
    // Electron: electron-windows-x64 或 electron-linux-arm64
    identifier = `electron-${info.platform}-${navigator.userAgentData?.platform || 'unknown'}`
  } else if (info.type === ClientType.BROWSER) {
    // 浏览器: browser-chrome-windows 或 browser-safari-macos
    const browser = detectBrowser()
    identifier = `browser-${browser.name.toLowerCase()}-${info.platform}`
  } else if (info.type === ClientType.ANDROID) {
    identifier = 'android-app'
  } else if (info.type === ClientType.IOS) {
    identifier = 'ios-app'
  }
  
  return identifier
}

/**
 * 获取当前设备的详细信息（用于设备管理）
 */
export const getCurrentDeviceInfo = async () => {
  const info = getClientInfoSync()
  const browser = detectBrowser()
  const os = getOSInfo()
  
  // 获取公网 IP 和属地
  let ipInfo = { ip: '', location: '其它' }
  try {
    logger.info('开始获取公网 IP...')
    
    // 尝试多个 IP 获取 API
    const ipApis = [
      'https://ifconfig.me/ip',
      'https://api.ipify.org?format=json',
      'https://icanhazip.com'
    ]
    
    let publicIP = null
    
    for (const api of ipApis) {
      try {
        logger.info(`尝试从 ${api} 获取 IP...`)
        
        // 使用 AbortController 实现超时控制
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        
        const response = await fetch(api, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'Accept': 'text/plain,application/json'
          }
        })
        
        clearTimeout(timeoutId)
        
        if (response.ok) {
          const text = await response.text()
          
          // 不同 API 返回格式不同
          if (api.includes('ipify')) {
            // {"ip":"203.0.113.45"}
            try {
              const data = JSON.parse(text)
              publicIP = data.ip
            } catch (e) {
              logger.warn(`解析 ${api} 响应失败:`, e.message)
              continue
            }
          } else {
            // 纯文本 IP 地址
            publicIP = text.trim()
          }
          
          if (publicIP && isValidIP(publicIP)) {
            logger.info(`成功获取 IP: ${publicIP} (来自 ${api})`)
            break
          } else {
            logger.warn(`获取的 IP 无效: ${publicIP}`)
            publicIP = null
          }
        } else {
          logger.warn(`${api} 返回错误状态: ${response.status}`)
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          logger.warn(`${api} 请求超时（5秒）`)
        } else {
          logger.warn(`从 ${api} 获取 IP 失败:`, error.message)
        }
        continue
      }
    }
    
    if (!publicIP) {
      logger.warn('所有 IP API 都失败，使用默认值')
      publicIP = '未知'
    }
    
    ipInfo.ip = publicIP
    
    // 如果获取到有效 IP，查询地理位置
    if (publicIP && publicIP !== '未知') {
      try {
        logger.info(`开始查询 IP ${publicIP} 的地理位置...`)
        const location = await queryIPLocation(publicIP)
        ipInfo.location = location
        logger.info('IP 地理位置:', location)
      } catch (error) {
        logger.warn('查询 IP 地理位置失败:', error.message)
        ipInfo.location = '其它'
      }
    }
    
    logger.info('IP 信息获取完成:', ipInfo)
  } catch (error) {
    logger.error('获取 IP 信息失败:', error)
  }
  
  // 构建设备名称
  let deviceName = ''
  if (info.type === ClientType.ELECTRON) {
    deviceName = `Electron ${os.name}`
  } else if (info.type === ClientType.BROWSER) {
    deviceName = `${browser.name} ${os.name}`
  } else if (info.type === ClientType.ANDROID) {
    deviceName = 'Android Device'
  } else if (info.type === ClientType.IOS) {
    deviceName = 'iOS Device'
  }
  
  // 构建浏览器/介质信息
  let browserInfo = ''
  if (info.type === ClientType.ELECTRON) {
    browserInfo = 'Electron'
  } else {
    browserInfo = browser.name
    if (browser.version) {
      browserInfo += ` ${browser.version.split('.')[0]}` // 只显示主版本号
    }
  }
  
  // 构建设备类型信息
  let deviceType = ''
  if (os.name === 'Windows') {
    deviceType = `Windows ${os.version}`
  } else if (os.name === 'macOS') {
    deviceType = `macOS ${os.version}`
  } else if (os.name === 'Linux') {
    deviceType = 'Linux'
  } else if (os.name === 'Android') {
    deviceType = `Android ${os.version}`
  } else if (os.name === 'iOS') {
    deviceType = `iOS ${os.version}`
  } else {
    deviceType = os.name
  }
  
  return {
    browser: browserInfo,
    deviceType: deviceType,
    deviceName: deviceName,
    platform: info.platform,
    clientType: info.type,
    clientIdentifier: getClientIdentifier(),
    ip: ipInfo.ip,
    location: ipInfo.location,
    isCurrentDevice: true, // 标记为当前设备
  }
}

/**
 * 验证 IP 地址格式
 */
const isValidIP = (ip) => {
  // IPv4 正则
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
  // IPv6 正则（简化版）
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/
  
  if (ipv4Regex.test(ip)) {
    // 验证每个段是否在 0-255 之间
    const parts = ip.split('.')
    return parts.every(part => {
      const num = parseInt(part)
      return num >= 0 && num <= 255
    })
  }
  
  return ipv6Regex.test(ip)
}

/**
 * 查询 IP 地理位置
 * 使用免费的 IP 地理位置 API
 */
const queryIPLocation = async (ip) => {
  try {
    // 方案 1: 使用 ipapi.co（免费，无需 API Key）
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch(`https://ipapi.co/${ip}/json/`, {
        method: 'GET',
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        return formatIpApiLocation(data)
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        logger.warn('ipapi.co 查询失败:', error.message)
      }
    }

    // 方案 2: 使用 ip-api.com（免费，无需 API Key）
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      const response = await fetch(`http://ip-api.com/json/${ip}?lang=zh-CN`, {
        method: 'GET',
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        const data = await response.json()
        if (data.status === 'success') {
          return formatIpApiComLocation(data)
        }
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        logger.warn('ip-api.com 查询失败:', error.message)
      }
    }

    // 方案 3: 使用 ipwho.is（免费，无需 API Key）
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      const response = await fetch(`https://ipwho.is/${ip}`, {
        method: 'GET',
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          return formatIpWhoIsLocation(data)
        }
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        logger.warn('ipwho.is 查询失败:', error.message)
      }
    }
    
    return '其它'
  } catch (error) {
    logger.error('查询 IP 地理位置失败:', error)
    return '其它'
  }
}

/**
 * 格式化 ipapi.co 返回的位置信息
 */
const formatIpApiLocation = (data) => {
  const country = data.country_name || data.country || ''
  const region = data.region || ''
  const city = data.city || ''
  
  // 国外 IP
  if (country && country !== 'China' && country !== 'CN') {
    return translateCountry(country)
  }
  
  // 中国 IP
  if (!region) return '其它'
  
  // 翻译省份和城市（ipapi.co 返回的是拼音）
  const regionCN = translateProvinceCity(region)
  const cityCN = city ? translateProvinceCity(city, region) : ''
  
  // 直辖市
  const municipalities = ['北京市', '上海市', '天津市', '重庆市']
  if (municipalities.includes(regionCN)) {
    return regionCN
  }
  
  // 有城市信息
  if (cityCN) {
    return `${regionCN} ${cityCN}`
  }
  
  // 只有省份
  return regionCN
}

/**
 * 格式化 ip-api.com 返回的位置信息
 */
const formatIpApiComLocation = (data) => {
  const country = data.country || ''
  const region = data.regionName || ''
  const city = data.city || ''
  
  // 国外 IP
  if (country && country !== '中国') {
    return translateCountry(country)
  }
  
  // 中国 IP - ip-api.com 已经返回中文，直接使用
  if (!region) return '其它'
  
  // 直辖市
  const municipalities = ['北京市', '上海市', '天津市', '重庆市']
  if (municipalities.includes(region)) {
    return region
  }
  
  // 有城市信息
  if (city) {
    return `${region} ${city}`
  }
  
  // 只有省份
  return region
}

/**
 * 格式化 ipwho.is 返回的位置信息
 */
const formatIpWhoIsLocation = (data) => {
  const country = data.country || ''
  const region = data.region || ''
  const city = data.city || ''
  
  // 国外 IP
  if (country && country !== 'China' && country !== 'CN') {
    return translateCountry(country)
  }
  
  // 中国 IP
  if (!region) return '其它'
  
  // 翻译省份和城市（ipwho.is 可能返回拼音或英文）
  const regionCN = translateProvinceCity(region)
  const cityCN = city ? translateProvinceCity(city, region) : ''
  
  // 直辖市
  const municipalities = ['北京市', '上海市', '天津市', '重庆市']
  if (municipalities.includes(regionCN)) {
    return regionCN
  }
  
  // 有城市信息
  if (cityCN) {
    return `${regionCN} ${cityCN}`
  }
  
  // 只有省份
  return regionCN
}

/**
 * 翻译国家名称为中文
 */
const translateCountry = (country) => {
  const countryMap = {
    'United States': '美国',
    'USA': '美国',
    'United Kingdom': '英国',
    'UK': '英国',
    'Japan': '日本',
    'South Korea': '韩国',
    'Canada': '加拿大',
    'Australia': '澳大利亚',
    'Germany': '德国',
    'France': '法国',
    'Singapore': '新加坡',
    'Hong Kong': '香港',
    'Taiwan': '台湾',
    'Macau': '澳门',
  }
  
  return countryMap[country] || country || '其它'
}

/**
 * 翻译省份/城市拼音为中文
 * @param {string} text - 要翻译的文本（省份或城市拼音）
 * @param {string} provincePinyin - 可选，省份拼音，用于区分同名城市
 * @returns {string} 翻译后的中文
 */
const translateProvinceCity = (text, provincePinyin = '') => {
  if (!text) return ''
  
  // 直辖市映射
  const municipalityMap = {
    'Beijing': '北京市',
    'Shanghai': '上海市',
    'Tianjin': '天津市',
    'Chongqing': '重庆市',
  }
  
  // 如果已经是中文，直接返回
  if (/[\u4e00-\u9fa5]/.test(text)) {
    return text
  }
  
  // 检查是否是直辖市
  if (municipalityMap[text]) {
    return municipalityMap[text]
  }
  
  // 省份拼音映射（常见省份）
  const provinceMap = {
    'Anhui': '安徽省',
    'Fujian': '福建省',
    'Gansu': '甘肃省',
    'Guangdong': '广东省',
    'Guangxi': '广西壮族自治区',
    'Guizhou': '贵州省',
    'Hainan': '海南省',
    'Hebei': '河北省',
    'Heilongjiang': '黑龙江省',
    'Henan': '河南省',
    'Hubei': '湖北省',
    'Hunan': '湖南省',
    'Jiangsu': '江苏省',
    'Jiangxi': '江西省',
    'Jilin': '吉林省',
    'Liaoning': '辽宁省',
    'Inner Mongolia': '内蒙古自治区',
    'Nei Mongol': '内蒙古自治区',
    'Ningxia': '宁夏回族自治区',
    'Qinghai': '青海省',
    'Shaanxi': '陕西省',
    'Shandong': '山东省',
    'Shanxi': '山西省',
    'Sichuan': '四川省',
    'Yunnan': '云南省',
    'Zhejiang': '浙江省',
    'Tibet': '西藏自治区',
    'Xinjiang': '新疆维吾尔自治区',
  }
  
  // 先尝试匹配省份
  if (provinceMap[text]) {
    return provinceMap[text]
  }
  
  // 自治州/地区映射（地级行政区，非地级市）
  const prefectureMap = {
    // 四川省 (3个自治州)
    'Garze': '甘孜藏族自治州',
    'Ganzi': '甘孜藏族自治州',
    'Aba': '阿坝藏族羌族自治州',
    'Liangshan': '凉山彝族自治州',
    
    // 云南省 (8个自治州)
    'Chuxiong': '楚雄彝族自治州',
    'Honghe': '红河哈尼族彝族自治州',
    'Wenshan': '文山壮族苗族自治州',
    'Xishuangbanna': '西双版纳傣族自治州',
    'Dali': '大理白族自治州',
    'Dehong': '德宏傣族景颇族自治州',
    'Nujiang': '怒江傈僳族自治州',
    'Diqing': '迪庆藏族自治州',
    
    // 贵州省 (3个自治州)
    'Qiandongnan': '黔东南苗族侗族自治州',
    'Qiannan': '黔南布依族苗族自治州',
    'Qianxinan': '黔西南布依族苗族自治州',
    
    // 湖南省 (1个自治州)
    'Xiangxi': '湘西土家族苗族自治州',
    
    // 湖北省 (1个自治州)
    'Enshi': '恩施土家族苗族自治州',
    
    // 吉林省 (1个自治州)
    'Yanbian': '延边朝鲜族自治州',
    
    // 甘肃省 (2个自治州)
    'Linxia': '临夏回族自治州',
    'Gannan': '甘南藏族自治州',
    
    // 青海省 (6个自治州)
    'Haibei': '海北藏族自治州',
    'Hainan': '海南藏族自治州',
    'Huangnan': '黄南藏族自治州',
    'Haixi': '海西蒙古族藏族自治州',
    'Guoluo': '果洛藏族自治州',
    'Yushu': '玉树藏族自治州',
    
    // 新疆维吾尔自治区 (5个自治州)
    'Kizilsu': '克孜勒苏柯尔克孜自治州',
    'Bortala': '博尔塔拉蒙古自治州',
    'Changji': '昌吉回族自治州',
    'Bayingolin': '巴音郭楞蒙古自治州',
    'Ili': '伊犁哈萨克自治州',
    
    // 西藏自治区 (6个地区)
    'Shannan': '山南市',
    'Nyingchi': '林芝市',
    'Chamdo': '昌都市',
    'Nagqu': '那曲市',
    'Ali': '阿里地区',
    'Ngari': '阿里地区',
    
    // 黑龙江省 (1个地区)
    'Daxing\'anling': '大兴安岭地区',
    'Daxinganling': '大兴安岭地区',
    
    // 内蒙古自治区 (3个盟)
    'Hinggan': '兴安盟',
    'Xilingol': '锡林郭勒盟',
    'Alxa': '阿拉善盟',
  }
  
  // 检查是否是自治州/地区
  if (prefectureMap[text]) {
    return prefectureMap[text]
  }
  
  // 城市拼音映射（全国地级市）
  // 注意：某些城市拼音相同但属于不同省份，需要通过省份来区分
  const cityMap = {
    // 北京市
    'Beijing': '北京市',
    
    // 上海市
    'Shanghai': '上海市',
    
    // 天津市
    'Tianjin': '天津市',
    
    // 重庆市
    'Chongqing': '重庆市',
    
    // 河北省 (11个)
    'Shijiazhuang': '石家庄市',
    'Tangshan': '唐山市',
    'Qinhuangdao': '秦皇岛市',
    'Handan': '邯郸市',
    'Xingtai': '邢台市',
    'Baoding': '保定市',
    'Zhangjiakou': '张家口市',
    'Chengde': '承德市',
    'Cangzhou': '沧州市',
    'Langfang': '廊坊市',
    'Hengshui': '衡水市',
    
    // 山西省 (11个)
    'Taiyuan': '太原市',
    'Datong': '大同市',
    'Yangquan': '阳泉市',
    'Changzhi': '长治市',
    'Jincheng': '晋城市',
    'Shuozhou': '朔州市',
    'Jinzhong': '晋中市',
    'Yuncheng': '运城市',
    'Xinzhou': '忻州市',
    'Linfen': '临汾市',
    'Lvliang': '吕梁市',
    
    // 内蒙古自治区 (9个)
    'Hohhot': '呼和浩特市',
    'Baotou': '包头市',
    'Wuhai': '乌海市',
    'Chifeng': '赤峰市',
    'Tongliao': '通辽市',
    'Ordos': '鄂尔多斯市',
    'Hulunbuir': '呼伦贝尔市',
    'Bayannur': '巴彦淖尔市',
    'Ulanqab': '乌兰察布市',
    
    // 辽宁省 (14个)
    'Shenyang': '沈阳市',
    'Dalian': '大连市',
    'Anshan': '鞍山市',
    'Fushun': '抚顺市',
    'Benxi': '本溪市',
    'Dandong': '丹东市',
    'Jinzhou': '锦州市',
    'Yingkou': '营口市',
    'Fuxin': '阜新市',
    'Liaoyang': '辽阳市',
    'Panjin': '盘锦市',
    'Tieling': '铁岭市',
    'Chaoyang': '朝阳市',
    'Huludao': '葫芦岛市',
    
    // 吉林省 (8个)
    'Changchun': '长春市',
    'Jilin': '吉林市',
    'Siping': '四平市',
    'Liaoyuan': '辽源市',
    'Tonghua': '通化市',
    'Baishan': '白山市',
    'Songyuan': '松原市',
    'Baicheng': '白城市',
    
    // 黑龙江省 (12个)
    'Harbin': '哈尔滨市',
    'Qiqihar': '齐齐哈尔市',
    'Jixi': '鸡西市',
    'Hegang': '鹤岗市',
    'Shuangyashan': '双鸭山市',
    'Daqing': '大庆市',
    // 'Yichun' 已移至 ambiguousCities（黑龙江省伊春市 / 江西省宜春市）
    'Jiamusi': '佳木斯市',
    'Qitaihe': '七台河市',
    'Mudanjiang': '牡丹江市',
    'Heihe': '黑河市',
    'Suihua': '绥化市',
    
    // 江苏省 (13个)
    'Nanjing': '南京市',
    'Wuxi': '无锡市',
    'Xuzhou': '徐州市',
    'Changzhou': '常州市',
    // 'Suzhou' 已移至 ambiguousCities（江苏省苏州市 / 安徽省宿州市）
    'Nantong': '南通市',
    'Lianyungang': '连云港市',
    'Huai\'an': '淮安市',
    'Huaian': '淮安市',
    'Yancheng': '盐城市',
    'Yangzhou': '扬州市',
    'Zhenjiang': '镇江市',
    // 'Taizhou' 已移至 ambiguousCities（江苏省泰州市 / 浙江省台州市）
    'Suqian': '宿迁市',
    
    // 浙江省 (11个)
    'Hangzhou': '杭州市',
    'Ningbo': '宁波市',
    'Wenzhou': '温州市',
    'Jiaxing': '嘉兴市',
    'Huzhou': '湖州市',
    'Shaoxing': '绍兴市',
    'Jinhua': '金华市',
    'Quzhou': '衢州市',
    'Zhoushan': '舟山市',
    // 'Taizhou' 已移至 ambiguousCities（江苏省泰州市 / 浙江省台州市）
    'Lishui': '丽水市',
    
    // 安徽省 (16个)
    'Hefei': '合肥市',
    'Wuhu': '芜湖市',
    'Bengbu': '蚌埠市',
    'Huainan': '淮南市',
    'Ma\'anshan': '马鞍山市',
    'Huaibei': '淮北市',
    'Tongling': '铜陵市',
    'Anqing': '安庆市',
    'Huangshan': '黄山市',
    'Chuzhou': '滁州市',
    'Fuyang': '阜阳市',
    // 'Suzhou' 已移至 ambiguousCities（江苏省苏州市 / 安徽省宿州市）
    'Lu\'an': '六安市',
    'Luan': '六安市',
    'Bozhou': '亳州市',
    'Chizhou': '池州市',
    'Xuancheng': '宣城市',
    
    // 福建省 (9个)
    // 'Fuzhou' 已移至 ambiguousCities（福建省福州市 / 江西省抚州市）
    'Xiamen': '厦门市',
    'Putian': '莆田市',
    'Sanming': '三明市',
    'Quanzhou': '泉州市',
    'Zhangzhou': '漳州市',
    'Nanping': '南平市',
    'Longyan': '龙岩市',
    'Ningde': '宁德市',
    
    // 江西省 (11个)
    'Nanchang': '南昌市',
    'Jingdezhen': '景德镇市',
    'Pingxiang': '萍乡市',
    'Jiujiang': '九江市',
    'Xinyu': '新余市',
    'Yingtan': '鹰潭市',
    'Ganzhou': '赣州市',
    'Ji\'an': '吉安市',
    'Jian': '吉安市',
    // 'Yichun' 已移至 ambiguousCities（黑龙江省伊春市 / 江西省宜春市）
    // 'Fuzhou' 已移至 ambiguousCities（福建省福州市 / 江西省抚州市）
    'Shangrao': '上饶市',
    
    // 山东省 (16个)
    'Jinan': '济南市',
    'Qingdao': '青岛市',
    'Zibo': '淄博市',
    'Zaozhuang': '枣庄市',
    'Dongying': '东营市',
    'Yantai': '烟台市',
    'Weifang': '潍坊市',
    'Jining': '济宁市',
    'Tai\'an': '泰安市',
    'Taian': '泰安市',
    'Weihai': '威海市',
    'Rizhao': '日照市',
    'Laiwu': '莱芜市',
    'Linyi': '临沂市',
    'Dezhou': '德州市',
    'Liaocheng': '聊城市',
    'Binzhou': '滨州市',
    'Heze': '菏泽市',
    
    // 河南省 (17个)
    'Zhengzhou': '郑州市',
    'Kaifeng': '开封市',
    'Luoyang': '洛阳市',
    'Pingdingshan': '平顶山市',
    'Anyang': '安阳市',
    'Hebi': '鹤壁市',
    'Xinxiang': '新乡市',
    'Jiaozuo': '焦作市',
    'Puyang': '濮阳市',
    'Xuchang': '许昌市',
    'Luohe': '漯河市',
    'Sanmenxia': '三门峡市',
    'Nanyang': '南阳市',
    'Shangqiu': '商丘市',
    'Xinyang': '信阳市',
    'Zhoukou': '周口市',
    'Zhumadian': '驻马店市',
    
    // 湖北省 (12个)
    'Wuhan': '武汉市',
    'Huangshi': '黄石市',
    'Shiyan': '十堰市',
    'Yichang': '宜昌市',
    'Xiangyang': '襄阳市',
    'Ezhou': '鄂州市',
    'Jingmen': '荆门市',
    'Xiaogan': '孝感市',
    'Jingzhou': '荆州市',
    'Huanggang': '黄冈市',
    'Xianning': '咸宁市',
    'Suizhou': '随州市',
    
    // 湖南省 (13个)
    'Changsha': '长沙市',
    'Zhuzhou': '株洲市',
    'Xiangtan': '湘潭市',
    'Hengyang': '衡阳市',
    'Shaoyang': '邵阳市',
    'Yueyang': '岳阳市',
    'Changde': '常德市',
    'Zhangjiajie': '张家界市',
    'Yiyang': '益阳市',
    'Chenzhou': '郴州市',
    'Yongzhou': '永州市',
    'Huaihua': '怀化市',
    'Loudi': '娄底市',
    
    // 广东省 (21个)
    'Guangzhou': '广州市',
    'Shaoguan': '韶关市',
    'Shenzhen': '深圳市',
    'Zhuhai': '珠海市',
    'Shantou': '汕头市',
    'Foshan': '佛山市',
    'Jiangmen': '江门市',
    'Zhanjiang': '湛江市',
    'Maoming': '茂名市',
    'Zhaoqing': '肇庆市',
    'Huizhou': '惠州市',
    'Meizhou': '梅州市',
    'Shanwei': '汕尾市',
    'Heyuan': '河源市',
    'Yangjiang': '阳江市',
    'Qingyuan': '清远市',
    'Dongguan': '东莞市',
    'Zhongshan': '中山市',
    'Chaozhou': '潮州市',
    'Jieyang': '揭阳市',
    'Yunfu': '云浮市',
    
    // 广西壮族自治区 (14个)
    'Nanning': '南宁市',
    'Liuzhou': '柳州市',
    'Guilin': '桂林市',
    'Wuzhou': '梧州市',
    'Beihai': '北海市',
    'Fangchenggang': '防城港市',
    'Qinzhou': '钦州市',
    'Guigang': '贵港市',
    // 'Yulin' 已移至 ambiguousCities（陕西省榆林市 / 广西壮族自治区玉林市）
    'Baise': '百色市',
    'Hezhou': '贺州市',
    'Hechi': '河池市',
    'Laibin': '来宾市',
    'Chongzuo': '崇左市',
    
    // 海南省 (4个)
    'Haikou': '海口市',
    'Sanya': '三亚市',
    'Sansha': '三沙市',
    'Danzhou': '儋州市',
    
    // 四川省 (18个)
    'Chengdu': '成都市',
    'Zigong': '自贡市',
    'Panzhihua': '攀枝花市',
    'Luzhou': '泸州市',
    'Deyang': '德阳市',
    'Mianyang': '绵阳市',
    'Guangyuan': '广元市',
    'Suining': '遂宁市',
    // 'Neijiang' 已移至 ambiguousCities
    'Leshan': '乐山市',
    'Nanchong': '南充市',
    'Meishan': '眉山市',
    'Yibin': '宜宾市',
    'Guang\'an': '广安市',
    'Guangan': '广安市',
    'Dazhou': '达州市',
    'Ya\'an': '雅安市',
    'Ya an': '雅安市',
    'Bazhong': '巴中市',
    'Ziyang': '资阳市',
    
    // 贵州省 (6个)
    'Guiyang': '贵阳市',
    'Liupanshui': '六盘水市',
    'Zunyi': '遵义市',
    'Anshun': '安顺市',
    'Bijie': '毕节市',
    'Tongren': '铜仁市',
    
    // 云南省 (8个)
    'Kunming': '昆明市',
    'Qujing': '曲靖市',
    'Yuxi': '玉溪市',
    'Baoshan': '保山市',
    'Zhaotong': '昭通市',
    'Lijiang': '丽江市',
    'Pu\'er': '普洱市',
    'Puer': '普洱市',
    'Lincang': '临沧市',
    
    // 陕西省 (10个)
    "Xi'an": '西安市',
    'Xian': '西安市',
    'Tongchuan': '铜川市',
    'Baoji': '宝鸡市',
    'Xianyang': '咸阳市',
    'Weinan': '渭南市',
    'Yan\'an': '延安市',
    'Yan an': '延安市',
    'Hanzhong': '汉中市',
    // 'Yulin' 已移至 ambiguousCities（陕西省榆林市 / 广西壮族自治区玉林市）
    'Ankang': '安康市',
    'Shangluo': '商洛市',
    
    // 甘肃省 (12个)
    'Lanzhou': '兰州市',
    'Jiayuguan': '嘉峪关市',
    'Jinchang': '金昌市',
    'Baiyin': '白银市',
    'Tianshui': '天水市',
    'Wuwei': '武威市',
    'Zhangye': '张掖市',
    'Pingliang': '平凉市',
    'Jiuquan': '酒泉市',
    'Qingyang': '庆阳市',
    'Dingxi': '定西市',
    'Longnan': '陇南市',
    
    // 青海省 (2个)
    'Xining': '西宁市',
    'Haidong': '海东市',
    
    // 宁夏回族自治区 (5个)
    'Yinchuan': '银川市',
    'Shizuishan': '石嘴山市',
    'Wuzhong': '吴忠市',
    'Guyuan': '固原市',
    'Zhongwei': '中卫市',
    
    // 新疆维吾尔自治区 (4个)
    'Urumqi': '乌鲁木齐市',
    'Karamay': '克拉玛依市',
    'Turpan': '吐鲁番市',
    'Hami': '哈密市',
    
    // 西藏自治区 (2个)
    'Lhasa': '拉萨市',
    'Shigatse': '日喀则市',
  }
  
  // 先尝试匹配省份
  if (provinceMap[text]) {
    return provinceMap[text]
  }
  
  // 处理同名城市（需要通过省份区分）
  const ambiguousCities = {
    'Fuzhou': {
      'Fujian': '福州市',      // 福建省福州市
      'Jiangxi': '抚州市',     // 江西省抚州市
    },
    'Suzhou': {
      'Jiangsu': '苏州市',     // 江苏省苏州市
      'Anhui': '宿州市',       // 安徽省宿州市
    },
    'Yichun': {
      'Heilongjiang': '伊春市', // 黑龙江省伊春市
      'Jiangxi': '宜春市',     // 江西省宜春市
    },
    'Chaoyang': {
      'Liaoning': '朝阳市',    // 辽宁省朝阳市
    },
    'Yulin': {
      'Shaanxi': '榆林市',     // 陕西省榆林市
      'Guangxi': '玉林市',     // 广西壮族自治区玉林市
    },
    'Neijiang': {
      'Sichuan': '内江市',     // 四川省内江市
    },
    'Taizhou': {
      'Zhejiang': '台州市',     // 浙江省台州市
      'Jiangsu': '泰州市',      // 江苏省泰州市
    }
  }
  
  // 检查是否是同名城市
  if (ambiguousCities[text] && provincePinyin) {
    const cityInProvince = ambiguousCities[text][provincePinyin]
    if (cityInProvince) {
      return cityInProvince
    }
  }
  
  // 再尝试匹配城市（唯一拼音的城市）
  if (cityMap[text]) {
    return cityMap[text]
  }
  
  // 如果都不匹配，返回原文（可能是拼音或其他语言）
  return text
}

/**
 * 获取操作系统详细信息
 */
const getOSInfo = () => {
  if (typeof navigator === 'undefined') {
    return { name: 'unknown', version: '' }
  }
  
  const ua = navigator.userAgent
  const platform = navigator.platform?.toLowerCase() || ''
  let name = 'unknown'
  let version = ''
  
  // Windows
  if (ua.includes('Windows NT')) {
    name = 'Windows'
    const ntVersion = ua.match(/Windows NT ([\d.]+)/)?.[1]
    if (ntVersion) {
      const versionMap = {
        '10.0': '10/11',
        '6.3': '8.1',
        '6.2': '8',
        '6.1': '7',
      }
      version = versionMap[ntVersion] || ntVersion
    }
  }
  // macOS
  else if (ua.includes('Mac OS X')) {
    name = 'macOS'
    version = ua.match(/Mac OS X ([\d_]+)/)?.[1]?.replace(/_/g, '.') || ''
  }
  // Linux
  else if (ua.includes('Linux')) {
    name = 'Linux'
    version = ''
  }
  // Android
  else if (ua.includes('Android')) {
    name = 'Android'
    version = ua.match(/Android ([\d.]+)/)?.[1] || ''
  }
  // iOS
  else if (/iPhone|iPad|iPod/.test(ua)) {
    name = 'iOS'
    version = ua.match(/OS ([\d_]+)/)?.[1]?.replace(/_/g, '.') || ''
  }
  
  return { name, version }
}

/**
 * 检测浏览器类型和版本
 */
const detectBrowser = () => {
  if (typeof navigator === 'undefined') {
    return { name: 'unknown', version: '' }
  }
  
  const ua = navigator.userAgent
  let name = 'unknown'
  let version = ''
  
  // Chrome/Edge/Opera 都包含 'Chrome'
  if (ua.includes('Edg/')) {
    name = 'Edge'
    version = ua.match(/Edg\/([\d.]+)/)?.[1] || ''
  } else if (ua.includes('OPR/') || ua.includes('Opera/')) {
    name = 'Opera'
    version = ua.match(/(?:OPR|Opera)\/([\d.]+)/)?.[1] || ''
  } else if (ua.includes('Chrome')) {
    name = 'Chrome'
    version = ua.match(/Chrome\/([\d.]+)/)?.[1] || ''
  } else if (ua.includes('Firefox')) {
    name = 'Firefox'
    version = ua.match(/Firefox\/([\d.]+)/)?.[1] || ''
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    name = 'Safari'
    version = ua.match(/Version\/([\d.]+)/)?.[1] || ''
  }
  
  return { name, version }
}

/**
 * 获取移动端应用版本（同步版本）
 * @returns {string|null} 应用版本号
 */
const getAppVersionSync = () => {
  try {
    // Electron 环境
    if (window.electronAPI && window.electronAPI.getAppVersion) {
      return window.electronAPI.getAppVersion()
    }
    
    // Web 环境：从 meta 标签获取
    const metaTag = document.querySelector('meta[name="version"]')
    if (metaTag) {
      return metaTag.getAttribute('content')
    }
    
    return null
  } catch (error) {
    logger.warn('获取应用版本失败:', error)
    return null
  }
}

/**
 * 获取移动端应用版本（异步版本，支持 Capacitor）
 * @returns {Promise<string|null>} 应用版本号
 */
export const getAppVersion = async () => {
  try {
    // Capacitor 环境
    if (window.Capacitor?.Plugins?.App) {
      const info = await window.Capacitor.Plugins.App.getInfo()
      return info.version || null
    }
    
    // 其他环境使用同步版本
    return getAppVersionSync()
  } catch (error) {
    logger.warn('获取应用版本失败:', error)
    return null
  }
}

/**
 * 将客户端信息添加到请求头
 * @param {Headers} headers - 现有的请求头
 * @returns {Headers} - 添加了客户端信息的请求头
 */
export const addClientInfoToHeaders = (headers) => {
  const clientInfo = getClientInfoSync()
  const clientIdentifier = getClientIdentifier()
  
  // 添加客户端类型
  headers.set('X-Client-Type', clientInfo.type)
  
  // 添加客户端标识
  headers.set('X-Client-Identifier', clientIdentifier)
  
  // 添加平台信息
  headers.set('X-Client-Platform', clientInfo.platform)
  
  // 如果是 Electron，添加版本信息
  if (clientInfo.isElectron && clientInfo.electronVersion) {
    headers.set('X-Electron-Version', clientInfo.electronVersion)
  }
  
  // 如果是浏览器，添加浏览器类型
  if (clientInfo.type === ClientType.BROWSER) {
    const browser = detectBrowser()
    headers.set('X-Browser-Type', browser)
  }
  
  // 如果是移动端，添加应用版本（同步版本）
  if (clientInfo.type === ClientType.ANDROID || clientInfo.type === ClientType.IOS) {
    const appVersion = getAppVersionSync()
    if (appVersion) {
      headers.set('X-App-Version', appVersion)
    }
  }
  
  return headers
}

/**
 * 默认导出
 */
export default {
  ClientType,
  ClientInfo,
  getClientInfoSync,
  getClientInfo,
  getClientIdentifier,
  getCurrentDeviceInfo,
  getAppVersion,
  addClientInfoToHeaders,
}
