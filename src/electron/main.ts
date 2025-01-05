import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { WindowManager } from './window-manager';
import * as http from 'http';

// Handle creating/removing shortcuts on Windows when installing/uninstalling
try {
  require('electron-squirrel-startup') && app.quit();
} catch (e) {
  console.warn('electron-squirrel-startup not found, skipping...');
}

class MainProcess {
  private windowManager: WindowManager;
  private devServerPort: number = 3000;

  constructor() {
    this.windowManager = new WindowManager();

    // Quit when all windows are closed
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createWindow();
      }
    });

    // Handle IPC messages
    this.setupIPC();
  }

  private setupIPC() {
    // Window management IPC handlers
    ipcMain.handle('window:minimize', (event) => {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (win) win.minimize();
    });

    ipcMain.handle('window:maximize', (event) => {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (win) {
        if (win.isMaximized()) {
          win.unmaximize();
        } else {
          win.maximize();
        }
      }
    });

    ipcMain.handle('window:close', (event) => {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (win) win.close();
    });
  }

  private async findAvailablePort(startPort: number): Promise<number> {
    const isPortAvailable = (port: number): Promise<boolean> => {
      return new Promise((resolve) => {
        const server = http.createServer();
        server.listen(port, () => {
          server.close(() => resolve(true));
        });
        server.on('error', () => resolve(false));
      });
    };

    let port = startPort;
    while (!(await isPortAvailable(port))) {
      port++;
    }
    return port;
  }

  private async createWindow() {
    if (process.env.NODE_ENV === 'development') {
      this.devServerPort = await this.findAvailablePort(3000);
    }
    await this.windowManager.createMainWindow(this.devServerPort);
  }

  async start() {
    try {
      await app.whenReady();
      await this.createWindow();

      if (process.env.NODE_ENV === 'development') {
        try {
          const { default: installExtension, REACT_DEVELOPER_TOOLS } = require('electron-devtools-installer');
          await installExtension(REACT_DEVELOPER_TOOLS);
        } catch (e) {
          console.error('Failed to install DevTools extension:', e);
        }
      }
    } catch (error) {
      console.error('Error starting application:', error);
      app.quit();
    }
  }
}

// Create and start the main process
const main = new MainProcess();
main.start().catch((error) => {
  console.error('Fatal error:', error);
  app.quit();
});
