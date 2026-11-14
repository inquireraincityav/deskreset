import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('desk', {
  payload(): unknown {
    const hash = decodeURIComponent(location.hash.replace(/^#/, ''));
    try { return hash ? JSON.parse(hash) : {}; } catch { return {}; }
  },
  complete: () => ipcRenderer.invoke('overlay:complete'),
  skip: () => ipcRenderer.invoke('overlay:skip'),
  override: () => ipcRenderer.invoke('overlay:override'),
  snooze: () => ipcRenderer.invoke('overlay:snooze'),
  lock: () => ipcRenderer.invoke('overlay:lock'),
  sip: () => ipcRenderer.invoke('overlay:sip')
});
