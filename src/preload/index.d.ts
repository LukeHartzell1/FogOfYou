import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getPersonas: () => Promise<any[]>
      savePersona: (persona: any) => Promise<any>
      deletePersona: (id: string) => Promise<void>
      startAgent: (personaId: string) => Promise<void>
      stopAgent: (personaId: string) => Promise<void>
      onAgentActivity: (callback: (activity: any) => void) => () => void
      getMetrics: () => Promise<any>
      getSettings: () => Promise<any>
      saveSettings: (settings: any) => Promise<any>
    }
  }
}
