import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('desk', {
  close: () => ipcRenderer.invoke('backdrop:close')
});
