import { Tray, nativeImage, screen, app, BrowserWindow } from 'electron';
import { join } from 'node:path';

// Menu-bar / tray icon with a countdown title. The click handler is
// provided by the caller (so it can drive the popover + backdrop
// together). Anchoring is still handled here.

export class TrayController {
  private tray: Tray | null = null;

  init(onClick: () => void): void {
    const iconPath = app.isPackaged
      ? join(process.resourcesPath, 'trayTemplate.png')
      : join(__dirname, '../../build/trayTemplate.png');
    let img = nativeImage.createFromPath(iconPath);
    if (img.isEmpty()) img = nativeImage.createEmpty();
    img.setTemplateImage(true);
    this.tray = new Tray(img);
    this.tray.setTitle(' — ');
    this.tray.setToolTip('Desk Reset');
    this.tray.on('click', onClick);
    this.tray.on('right-click', onClick);
  }

  setCountdown(minutesUntilNext: number): void {
    if (!this.tray) return;
    const text = minutesUntilNext >= 60
      ? `${Math.floor(minutesUntilNext / 60)}h`
      : `${Math.max(0, Math.round(minutesUntilNext))}m`;
    this.tray.setTitle(' ' + text);
  }

  anchor(win: BrowserWindow): void {
    if (!this.tray) return;
    const b = this.tray.getBounds();
    const [w, h] = win.getSize();
    const display = screen.getDisplayNearestPoint({ x: b.x, y: b.y });
    const x = Math.min(
      Math.max(display.workArea.x, Math.round(b.x + b.width / 2 - w / 2)),
      display.workArea.x + display.workArea.width - w
    );
    const y = b.y + b.height + 6;
    win.setPosition(x, y, false);
  }
}
