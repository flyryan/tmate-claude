import { BrowserWindow, app, screen } from 'electron';
import * as path from 'path';
import { IWindowState } from './types';
import { store } from './store';

export class WindowManager {
  private mainWindow: BrowserWindow | null = null;
  private windowState: IWindowState;

  constructor() {
    // Load saved window state
    this.windowState = store.get('windowState');

    // Clean up windows on app quit
    app.on('before-quit', () => {
      if (this.mainWindow) {
        this.mainWindow.removeAllListeners();
      }
    });
  }

  private saveState() {
    if (!this.mainWindow) return;

    const bounds = this.mainWindow.getBounds();
    this.windowState = {
      ...bounds,
      isMaximized: this.mainWindow.isMaximized()
    };
    store.set('windowState', this.windowState);
  }

  private ensureVisibleOnScreen(windowState: IWindowState) {
    const { width, height, x, y } = windowState;
    const displays = screen.getAllDisplays();

    // If x or y is undefined, return default centered position
    if (x === undefined || y === undefined) {
      const primaryDisplay = screen.getPrimaryDisplay();
      const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
      return {
        width: Math.min(1200, screenWidth * 0.9),
        height: Math.min(800, screenHeight * 0.9),
        x: undefined,
        y: undefined
      };
    }

    // Check if the window would be visible on any display
    const visible = displays.some(display => {
      const bounds = display.bounds;
      return (
        x >= bounds.x &&
        y >= bounds.y &&
        (x + (width || 1200)) <= bounds.x + bounds.width &&
        (y + (height || 800)) <= bounds.y + bounds.height
      );
    });

    if (!visible) {
      // Window would be outside all displays, reset to default size and center
      const primaryDisplay = screen.getPrimaryDisplay();
      const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
      return {
        width: Math.min(1200, screenWidth * 0.9),
        height: Math.min(800, screenHeight * 0.9),
        x: undefined,
        y: undefined
      };
    }

    return windowState;
  }

  async createMainWindow(devServerPort: number = 3000): Promise<BrowserWindow> {
    try {
      const preloadPath = path.join(__dirname, 'preload.js');
      console.log('Preload path:', preloadPath);

      // Ensure window state is visible on screen
      const validState = this.ensureVisibleOnScreen(this.windowState);

      console.log('Creating window with state:', validState);

      // Create the browser window with all configurations upfront
      this.mainWindow = new BrowserWindow({
        ...validState,
        minWidth: 800,
        minHeight: 600,
        show: true,
        frame: false,
        titleBarStyle: 'hidden',
        backgroundColor: '#111827', // bg-gray-900
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: false, // Disable sandbox for now
          preload: preloadPath,
          devTools: true,
          webSecurity: true,
          allowRunningInsecureContent: false
        }
      });

      // Set Content Security Policy
      this.mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
        callback({
          responseHeaders: {
            ...details.responseHeaders,
            'Content-Security-Policy': ["default-src 'self' 'unsafe-inline' 'unsafe-eval'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' ws: localhost:*;"]
          }
        });
      });

      console.log('Window created successfully');

      // Restore maximized state if needed
      if (this.windowState?.isMaximized) {
        console.log('Restoring maximized state');
        this.mainWindow.maximize();
      }

      // Track window state changes
      this.mainWindow.on('resize', () => this.saveState());
      this.mainWindow.on('move', () => this.saveState());
      this.mainWindow.on('close', () => this.saveState());

      // Enable remote debugging
      this.mainWindow.webContents.openDevTools();

      // Log any errors
      this.mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error('Failed to load:', errorCode, errorDescription);
      });

      this.mainWindow.webContents.on('crashed', () => {
        console.error('Renderer process crashed');
      });

      this.mainWindow.on('unresponsive', () => {
        console.error('Window became unresponsive');
      });

      // Load the index.html of the app.
      if (process.env.NODE_ENV === 'development') {
        try {
          // In development, load from local dev server
          const url = `http://localhost:5173`;
          console.log(`Loading development URL: ${url}`);
          await this.mainWindow.loadURL(url);
          console.log('Development URL loaded successfully');
        } catch (error) {
          console.error('Failed to load development URL:', error);
          // Attempt to load local file as fallback
          const fallbackPath = path.join(__dirname, '../renderer/index.html');
          console.log('Attempting to load fallback file:', fallbackPath);
          await this.mainWindow.loadFile(fallbackPath);
        }
      } else {
        // In production, load the built file
        const filePath = path.join(__dirname, '../renderer/index.html');
        console.log(`Loading production file: ${filePath}`);
        await this.mainWindow.loadFile(filePath);
      }
    } catch (error) {
      console.error('Error creating window:', error);
      throw error;
    }

    // Show window when ready
    this.mainWindow.once('ready-to-show', () => {
      if (this.mainWindow) {
        this.mainWindow.show();
        this.mainWindow.focus();
      }
    });

    // Handle closed window
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    return this.mainWindow;
  }

  getMainWindow(): BrowserWindow | null {
    return this.mainWindow;
  }
}
