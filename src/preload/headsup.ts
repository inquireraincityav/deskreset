import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('desk', {
  payload(): unknown {
    const hash = decodeURIComponent(location.hash.replace(/^#/, ''));
    try { return hash ? JSON.parse(hash) : {}; } catch { return {}; }
  },
  startNow: () => ipcRenderer.invoke('headsup:startNow'),
  snooze: (minutes: number) => ipcRenderer.invoke('headsup:snooze', minutes),
  close: () => ipcRenderer.invoke('headsup:close')
});
