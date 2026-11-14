import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('desk', {
  getState: () => ipcRenderer.invoke('popover:getState'),
  takeSip: () => ipcRenderer.invoke('popover:takeSip'),
  close: () => ipcRenderer.invoke('sip:close')
});
