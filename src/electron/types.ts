export interface IWindowState {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  isMaximized?: boolean;
}

export interface IPreloadAPI {
  window: {
    minimize: () => void;
    maximize: () => void;
    close: () => void;
  };
}

export interface IElectronAPI extends IPreloadAPI {}

declare global {
  interface Window {
    electronAPI?: IElectronAPI;
  }
}

export type ElectronHandler = IElectronAPI;
