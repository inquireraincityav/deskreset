import { BrowserWindow, screen } from 'electron';
import { join } from 'node:path';

interface LoadOpts {
  route: 'sip' | 'headsup' | 'settings';
  preload: string;
  hash?: string;
}

function load(win: BrowserWindow, { route, hash }: LoadOpts): void {
  const h = hash ? `#${encodeURIComponent(hash)}` : '';
  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(`${process.env.ELECTRON_RENDERER_URL}/${route}/index.html${h}`);
  } else {
    win.loadFile(join(__dirname, `../renderer/${route}/index.html`), hash ? { hash } : undefined);
  }
}

export function createSipWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 900,
    height: 560,
    show: true,
    frame: false,
    transparent: false,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    title: 'Take a sip',
    webPreferences: {
      preload: join(__dirname, '../preload/sip.js'),
      contextIsolation: true,
      sandbox: true
    }
  });
  load(win, { route: 'sip', preload: 'sip.js' });
  return win;
}

export function createSettingsWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 860,
    height: 760,
    show: true,
    frame: false,
    transparent: false,
    resizable: true,
    minimizable: true,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    title: 'Desk Reset — Settings',
    webPreferences: {
      preload: join(__dirname, '../preload/settings.js'),
      contextIsolation: true,
      sandbox: true
    }
  });
  load(win, { route: 'settings', preload: 'settings.js' });
  return win;
}

export function createHeadsupWindow(payload: { kind: string; secondsUntil: number; snoozesLeft: number }): BrowserWindow {
  const WIDTH = 420;
  const HEIGHT = 200;
  const display = screen.getPrimaryDisplay();
  const { x, y, width } = display.workArea;
  const win = new BrowserWindow({
    x: x + width - WIDTH - 20,
    y: y + 20,
    width: WIDTH,
    height: HEIGHT,
    show: true,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    hasShadow: true,
    focusable: false, // don't steal keyboard focus
    webPreferences: {
      preload: join(__dirname, '../preload/headsup.js'),
      contextIsolation: true,
      sandbox: true
    }
  });
  win.setAlwaysOnTop(true, 'floating');
  load(win, { route: 'headsup', preload: 'headsup.js', hash: JSON.stringify(payload) });
  return win;
}
