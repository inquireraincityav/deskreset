import { Tray, nativeImage, BrowserWindow, screen, app } from 'electron';
import { join } from 'node:path';

// Menu-bar / tray icon with a countdown string.
// The popover is a frameless window shown anchored to the tray icon.

export class TrayController {
  private tray: Tray | null = null;
  private popover: BrowserWindow | null = null;

  init(onOpenPopover: () => BrowserWindow): void {
    // 1x1 transparent image as a stand-in icon. Replace with a real
    // template icon in Phase 3 (an eye glyph, template image on macOS so
    // it adapts to menu-bar light/dark).
    const img = nativeImage.createEmpty();
    this.tray = new Tray(img);
    this.tray.setTitle('— ');
    this.tray.setToolTip('Desk Reset');
    this.tray.on('click', () => {
      if (!this.popover || this.popover.isDestroyed()) {
        this.popover = onOpenPopover();
        this.anchorPopover();
      } else if (this.popover.isVisible()) {
        this.popover.hide();
      } else {
        this.anchorPopover();
        this.popover.show();
      }
    });
  }

  setCountdown(minutesUntilNext: number): void {
    if (!this.tray) return;
    const text = minutesUntilNext >= 60
      ? `${Math.floor(minutesUntilNext / 60)}h`
      : `${Math.max(0, Math.round(minutesUntilNext))}m`;
    this.tray.setTitle(text);
  }

  private anchorPopover(): void {
    if (!this.tray || !this.popover) return;
    const b = this.tray.getBounds();
    const [w, h] = this.popover.getSize();
    const display = screen.getDisplayNearestPoint({ x: b.x, y: b.y });
    const x = Math.min(
      Math.max(display.workArea.x, Math.round(b.x + b.width / 2 - w / 2)),
      display.workArea.x + display.workArea.width - w
    );
    const y = b.y + b.height + 6;
    this.popover.setPosition(x, y, false);
  }

  attachPopover(win: BrowserWindow): void {
    this.popover = win;
    win.on('blur', () => win.hide());
    win.on('closed', () => {
      this.popover = null;
    });
  }
}
