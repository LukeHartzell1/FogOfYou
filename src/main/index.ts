import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { PersonaManager } from './personaManager'
import { agentRunner } from './agentRunner'
import store from './store'
import { scheduler } from './scheduler';
import { Persona } from './types'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC Handlers
  ipcMain.handle('get-personas', () => {
    return PersonaManager.getAll();
  });

  ipcMain.handle('save-persona', (_, persona: Partial<Persona>) => {
    return PersonaManager.save(persona);
  });

  ipcMain.handle('delete-persona', (_, id: string) => {
    PersonaManager.delete(id);
  });

  ipcMain.handle('start-agent', async (_, personaId: string) => {
    const persona = PersonaManager.get(personaId);
    if (persona) {
      await agentRunner.startSession(persona);
      PersonaManager.save({ ...persona, isActive: true });
    }
  });

  ipcMain.handle('stop-agent', async (_, personaId: string) => {
    await agentRunner.stopSession(personaId);
    const persona = PersonaManager.get(personaId);
    if (persona) {
      PersonaManager.save({ ...persona, isActive: false });
    }
  });

  ipcMain.handle('get-metrics', () => {
    return store.get('metrics');
  });

  ipcMain.handle('get-settings', () => {
    return store.get('settings');
  });

  ipcMain.handle('save-settings', (_, settings: any) => {
    store.set('settings', settings);
    return store.get('settings');
  });

  scheduler.start();

  createWindow();

  agentRunner.on('activity', (activity) => {
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send('agent-activity', activity);
    });
  });

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
