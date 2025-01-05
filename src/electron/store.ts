import Store from 'electron-store';
import { IWindowState } from './types';

interface StoreSchema {
  windowState: IWindowState;
}

export const store = new Store<StoreSchema>({
  defaults: {
    windowState: {
      width: 1200,
      height: 800,
      x: undefined,
      y: undefined,
      isMaximized: false
    }
  }
});
