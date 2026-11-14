import { BrowserWindow, screen } from 'electron';
import { join } from 'node:path';

// Translucent, blurred backdrop windows — one per display — shown
// behind the popover so the desktop fades back while the menu is open.
// A click or Escape dismisses the backdrop and the popover together.

export class BackdropController {
  private windows: BrowserWindow[] = [];

  show(onDismiss: () => void): void {
    if (this.windows.length) return;
    const displays = screen.getAllDisplays();
    for (const d of displays) {
      const win = new BrowserWindow({
        x: d.bounds.x,
        y: d.bounds.y,
        width: d.bounds.width,
        height: d.bounds.height,
        frame: false,
        transparent: true,
        resizable: false,
        movable: false,
        minimizable: false,
        maximizable: false,
        fullscreenable: false,
        skipTaskbar: true,
        hasShadow: false,
        focusable: false,            // don't steal focus from the popover
        acceptFirstMouse: true,      // a click dismisses on first press
        vibrancy: 'hud',
        webPreferences: {
          preload: join(__dirname, '../preload/backdrop.js'),
          contextIsolation: true,
          sandbox: true
        }
      });
      win.setAlwaysOnTop(true, 'pop-up-menu'); // below the popover, above apps
      win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

      if (process.env.ELECTRON_RENDERER_URL) {
        win.loadURL(`${process.env.ELECTRON_RENDERER_URL}/backdrop/index.html`);
      } else {
        win.loadFile(join(__dirname, '../renderer/backdrop/index.html'));
      }
      this.windows.push(win);
    }
    this.onDismiss = onDismiss;
  }

  private onDismiss: (() => void) | null = null;

  dismiss(): void {
    const cb = this.onDismiss;
    this.onDismiss = null;
    this.hide();
    cb?.();
  }

  hide(): void {
    for (const w of this.windows) {
      if (!w.isDestroyed()) w.destroy();
    }
    this.windows = [];
  }

  active(): boolean {
    return this.windows.length > 0;
  }
}
