import { BrowserWindow, screen, app } from 'electron';
import { join } from 'node:path';
import type { BreakKind, OverrideEvent } from '../shared/types';
import type { Store } from './store';

// Overlay windows. One per display, covering the whole display, above
// everything including full-screen apps. macOS vibrancy gives us the
// real desktop blur; on Windows 11 backgroundMaterial does the same.
// (Verify these Electron APIs on each release.)

interface OverlayCallbacks {
  onComplete: (kind: BreakKind) => void;
  onSkip: (kind: BreakKind) => void;
  onOverride: (ev: OverrideEvent) => void;
  onSnooze: () => void;
  onSip: () => void;
  onLock: () => void;
}

export class OverlayController {
  private windows: BrowserWindow[] = [];
  private kind: BreakKind | null = null;
  private watchdog: NodeJS.Timeout | null = null;
  private startedAt = 0;
  private lengthSec = 0;

  constructor(private store: Store, private cb: OverlayCallbacks) {}

  show(kind: BreakKind, title: string, body: string, lengthSec: number): void {
    if (this.kind) return;
    this.kind = kind;
    this.startedAt = Date.now();
    this.lengthSec = lengthSec;

    const displays = screen.getAllDisplays();
    for (const d of displays) {
      // Stretch break has its own HTML + preload (bundles three.js).
      // Eye and long break share the simpler overlay.html.
      const useStretch = kind === 'stretch';
      const preloadFile = useStretch ? 'stretch.js' : 'overlay.js';
      const htmlPath = useStretch ? 'stretch/index.html' : 'overlay/index.html';
      const htmlRoute = useStretch ? 'stretch' : 'overlay';

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
        vibrancy: 'under-window', // macOS; harmless elsewhere
        backgroundMaterial: 'acrylic', // Windows 11
        webPreferences: {
          preload: join(__dirname, '../preload/' + preloadFile),
          contextIsolation: true,
          sandbox: true
        }
      });

      win.setAlwaysOnTop(true, 'screen-saver');
      win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

      const payload = encodeURIComponent(JSON.stringify({
        kind,
        title,
        body,
        lengthSec,
        startedAt: this.startedAt,
        counts: this.store.today(),
        settings: this.store.settings
      }));

      if (process.env.ELECTRON_RENDERER_URL) {
        win.loadURL(`${process.env.ELECTRON_RENDERER_URL}/${htmlRoute}/index.html#${payload}`);
      } else {
        win.loadFile(join(__dirname, '../renderer/' + htmlPath), { hash: payload });
      }

      this.windows.push(win);
    }

    // Watchdog: if anything crashes or the renderer never finishes, close
    // the overlays after lengthSec + 15 seconds no matter what.
    const marginMs = lengthSec * 1000 + 15_000;
    this.watchdog = setTimeout(() => {
      if (this.kind) {
        this.cb.onOverride({ at: Date.now(), kind: this.kind, reason: 'crash-watchdog' });
        this.close();
      }
    }, marginMs);
  }

  active(): boolean {
    return this.kind !== null;
  }

  private close(): void {
    if (this.watchdog) clearTimeout(this.watchdog);
    this.watchdog = null;
    for (const w of this.windows) {
      if (!w.isDestroyed()) w.destroy();
    }
    this.windows = [];
    this.kind = null;
  }

  complete(): void {
    const k = this.kind;
    this.close();
    if (k) this.cb.onComplete(k);
  }

  skip(): void {
    const k = this.kind;
    this.close();
    if (k) this.cb.onSkip(k);
  }

  override(reason: OverrideEvent['reason'] = 'esc-hold'): void {
    const k = this.kind;
    if (k) this.cb.onOverride({ at: Date.now(), kind: k, reason });
    this.close();
    if (k) this.cb.onSkip(k); // treat override like a skip for scheduling
  }
}
