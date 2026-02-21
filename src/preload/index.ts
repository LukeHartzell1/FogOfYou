import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  getPersonas: () => ipcRenderer.invoke('get-personas'),
  savePersona: (persona: any) => ipcRenderer.invoke('save-persona', persona),
  deletePersona: (id: string) => ipcRenderer.invoke('delete-persona', id),
  startAgent: (personaId: string) => ipcRenderer.invoke('start-agent', personaId),
  stopAgent: (personaId: string) => ipcRenderer.invoke('stop-agent', personaId),
  onAgentActivity: (callback: (activity: any) => void) => {
    const subscription = (_event: any, activity: any) => callback(activity)
    ipcRenderer.on('agent-activity', subscription)
    return () => ipcRenderer.removeListener('agent-activity', subscription)
  },
  getMetrics: () => ipcRenderer.invoke('get-metrics'),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: any) => ipcRenderer.invoke('save-settings', settings)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
