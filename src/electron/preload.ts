import { contextBridge, ipcRenderer } from 'electron';
import type { IPreloadAPI } from './types';

const exposeAPI = () => {
  try {
    const api: IPreloadAPI = {
      window: {
        minimize: () => ipcRenderer.invoke('window:minimize'),
        maximize: () => ipcRenderer.invoke('window:maximize'),
        close: () => ipcRenderer.invoke('window:close'),
      },
    };

    // Expose the API to the renderer process
    contextBridge.exposeInMainWorld('electronAPI', api);
    console.log('API exposed successfully');
  } catch (error) {
    console.error('Failed to expose API:', error);
  }
};

// Initialize when the window is ready
const initialize = () => {
  try {
    exposeAPI();
    console.log('Preload script initialized');
  } catch (error) {
    console.error('Preload script initialization failed:', error);
  }
};

// Ensure the DOM is loaded before initializing
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
