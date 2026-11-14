import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('desk', {
  getState: () => ipcRenderer.invoke('popover:getState'),
  onState: (cb: (s: unknown) => void) => {
    ipcRenderer.on('popover:state', (_e, s) => cb(s));
  },
  takeSip: () => ipcRenderer.invoke('popover:takeSip'),
  startNow: () => ipcRenderer.invoke('popover:startNow'),
  pause1h: () => ipcRenderer.invoke('popover:pause1h'),
  updateSettings: (patch: unknown) => ipcRenderer.invoke('popover:updateSettings', patch),
  openSip: () => ipcRenderer.invoke('popover:openSip'),
  openSettings: () => ipcRenderer.invoke('popover:openSettings'),
  startStretch: () => ipcRenderer.invoke('popover:startStretch')
});
