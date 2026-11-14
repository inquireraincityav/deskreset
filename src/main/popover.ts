import { BrowserWindow } from 'electron';
import { join } from 'node:path';

export function createPopoverWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 340,
    height: 480,
    show: false,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    hasShadow: true,
    vibrancy: 'popover',
    webPreferences: {
      preload: join(__dirname, '../preload/popover.js'),
      contextIsolation: true,
      sandbox: true
    }
  });
  win.setAlwaysOnTop(true, 'pop-up-menu'); // above the backdrop

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(`${process.env.ELECTRON_RENDERER_URL}/popover/index.html`);
  } else {
    win.loadFile(join(__dirname, '../renderer/popover/index.html'));
  }
  return win;
}
