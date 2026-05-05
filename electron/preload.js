import { contextBridge, ipcRenderer } from 'electron'

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 获取客户端信息
  getClientInfo: () => ipcRenderer.invoke('get-client-info'),
  
  // 判断是否为 Electron 环境
  isElectron: true,
})
