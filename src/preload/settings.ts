import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('desk', {
  getState: () => ipcRenderer.invoke('popover:getState'),
  update: (patch: unknown) => ipcRenderer.invoke('popover:updateSettings', patch),
  exportData: () => ipcRenderer.invoke('settings:exportData'),
  deleteAll: () => ipcRenderer.invoke('settings:deleteAll'),
  close: () => ipcRenderer.invoke('settings:close')
});
