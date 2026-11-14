import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { Store } from './store';
import { Scheduler } from './scheduler';
import { OverlayController } from './overlay';
import { TrayController } from './tray';
import { createPopoverWindow } from './popover';
import { createSipWindow, createSettingsWindow, createHeadsupWindow } from './windows';
import { lockScreen } from './lock';
import type { BreakKind, PopoverState, Settings } from '../shared/types';

if (process.platform === 'darwin' && app.dock) app.dock.hide();

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  main();
}

async function main(): Promise<void> {
  await app.whenReady();

  const store = await Store.open();
  const scheduler = new Scheduler(store.settings);
  const tray = new TrayController();

  app.setLoginItemSettings({ openAtLogin: store.settings.launchAtLogin });

  let popover: BrowserWindow | null = null;
  let sipWin: BrowserWindow | null = null;
  let settingsWin: BrowserWindow | null = null;
  let headsupWin: BrowserWindow | null = null;
  let paused = false;
  let pausedUntil: number | null = null;

  function closePopover(): void {
    if (popover && !popover.isDestroyed()) popover.hide();
  }
  function openPopover(): void {
    if (!popover || popover.isDestroyed()) {
      popover = createPopoverWindow();
      popover.on('blur', closePopover);
      popover.on('closed', () => { popover = null; });
    }
    tray.anchor(popover);
    popover.show();
    popover.focus();
  }
  function togglePopover(): void {
    if (popover && !popover.isDestroyed() && popover.isVisible()) {
      closePopover();
    } else {
      openPopover();
    }
  }
  tray.init(togglePopover);

  const overlay = new OverlayController(store, {
    onComplete: async (k) => {
      await store.recordBreak(k, 'taken');
      scheduler.reschedule(k);
      pushPopover();
    },
    onSkip: async (k) => {
      await store.recordBreak(k, 'skipped');
      scheduler.reschedule(k);
      pushPopover();
    },
    onOverride: async (ev) => {
      await store.recordOverride(ev);
    },
    onSnooze: async () => {
      await store.recordSnooze();
      scheduler.snooze(5);
      pushPopover();
    },
    onSip: async () => {
      await store.bumpSip();
      pushPopover();
    },
    onLock: () => lockScreen()
  });

  scheduler.on('fire', (kind: BreakKind) => {
    if (headsupWin && !headsupWin.isDestroyed()) {
      headsupWin.destroy();
      headsupWin = null;
    }
    if (kind === 'water') {
      // Water is the gentle one — open the sip window instead of a
      // full-screen overlay. Reschedule when the window closes.
      if (!sipWin || sipWin.isDestroyed()) {
        sipWin = createSipWindow();
        sipWin.on('closed', () => {
          sipWin = null;
          scheduler.reschedule('water');
          pushPopover();
        });
      } else {
        sipWin.show();
        sipWin.focus();
      }
      return;
    }
    const copy = BREAK_COPY[kind];
    const length = store.settings.lengths[kind];
    if (store.settings.lockOnBreak) lockScreen();
    overlay.show(kind, copy.title, copy.body, length);
  });

  scheduler.on('headsup', (kind: BreakKind, secondsUntil: number) => {
    if (overlay.active()) return;
    if (headsupWin && !headsupWin.isDestroyed()) headsupWin.destroy();
    const snoozesLeft = Math.max(0, store.settings.snoozesPerDay - store.today().snoozesUsed);
    headsupWin = createHeadsupWindow({ kind, secondsUntil, snoozesLeft });
    headsupWin.on('closed', () => { headsupWin = null; });
  });

  scheduler.start();

  const refresh = (): void => {
    const { next } = scheduler.state();
    const mins = Math.max(0, Math.round((next.at - Date.now()) / 60_000));
    tray.setCountdown(mins);
    pushPopover();
  };
  refresh();
  setInterval(refresh, 15_000);

  // ---------------- IPC ----------------

  function pushPopover(): void {
    const s = snapshotPopover();
    for (const win of [popover, settingsWin, sipWin]) {
      if (win && !win.isDestroyed()) {
        win.webContents.send('popover:state', s);
      }
    }
  }

  function snapshotPopover(): PopoverState {
    if (paused && pausedUntil && Date.now() >= pausedUntil) {
      paused = false;
      pausedUntil = null;
    }
    const { next, following } = scheduler.state();
    return {
      nextBreakAt: next.at,
      nextBreakKind: next.kind,
      followingBreakAt: following.at,
      followingBreakKind: following.kind,
      counts: store.today(),
      settings: store.settings,
      paused,
      pausedUntil
    };
  }

  ipcMain.handle('popover:getState', () => snapshotPopover());
  ipcMain.handle('popover:takeSip', async () => (await store.bumpSip()));
  ipcMain.handle('popover:startNow', () => {
    const { next } = scheduler.state();
    scheduler.fireNow(next.kind);
  });
  ipcMain.handle('popover:startStretch', () => {
    scheduler.fireNow('stretch');
  });
  ipcMain.handle('popover:pause1h', () => {
    // Toggle. If paused, resume immediately; otherwise pause 1 hour.
    if (paused) {
      paused = false;
      pausedUntil = null;
      scheduler.setPaused(false);
    } else {
      paused = true;
      pausedUntil = Date.now() + 60 * 60_000;
      scheduler.setPaused(true, pausedUntil);
    }
    pushPopover();
  });
  ipcMain.handle('popover:openSip', () => {
    if (!sipWin || sipWin.isDestroyed()) {
      sipWin = createSipWindow();
      sipWin.on('closed', () => { sipWin = null; });
    } else {
      sipWin.show();
      sipWin.focus();
    }
  });
  ipcMain.handle('popover:openSettings', () => {
    if (!settingsWin || settingsWin.isDestroyed()) {
      settingsWin = createSettingsWindow();
      settingsWin.on('closed', () => { settingsWin = null; });
    } else {
      settingsWin.show();
      settingsWin.focus();
    }
  });
  ipcMain.handle('popover:updateSettings', async (_e, patch: Partial<Settings>) => {
    const s = await store.updateSettings(patch);
    scheduler.updateSettings(s);
    if (typeof patch.launchAtLogin === 'boolean') {
      app.setLoginItemSettings({ openAtLogin: patch.launchAtLogin });
    }
    pushPopover();
    return s;
  });

  // Overlay IPC
  ipcMain.handle('overlay:complete', () => overlay.complete());
  ipcMain.handle('overlay:skip', () => overlay.skip());
  ipcMain.handle('overlay:override', () => overlay.override('esc-hold'));
  ipcMain.handle('overlay:snooze', async () => {
    await store.recordSnooze();
    scheduler.snooze(5);
    overlay.skip();
  });
  ipcMain.handle('overlay:lock', () => lockScreen());
  ipcMain.handle('overlay:sip', async () => { await store.bumpSip(); pushPopover(); });

  // Sip window
  ipcMain.handle('sip:close', () => {
    if (sipWin && !sipWin.isDestroyed()) sipWin.close();
  });

  // Heads-up window
  ipcMain.handle('headsup:startNow', () => {
    const { next } = scheduler.state();
    scheduler.fireNow(next.kind);
    if (headsupWin && !headsupWin.isDestroyed()) headsupWin.destroy();
  });
  ipcMain.handle('headsup:snooze', async (_e, minutes: number) => {
    await store.recordSnooze();
    scheduler.snooze(minutes);
    if (headsupWin && !headsupWin.isDestroyed()) headsupWin.destroy();
    pushPopover();
  });
  ipcMain.handle('headsup:close', () => {
    if (headsupWin && !headsupWin.isDestroyed()) headsupWin.destroy();
  });

  // Settings window: export + delete
  ipcMain.handle('settings:exportData', async () => {
    const parent = settingsWin ?? undefined;
    const result = await dialog.showSaveDialog(parent!, {
      title: 'Export Desk Reset data',
      defaultPath: `desk-reset-export-${new Date().toISOString().slice(0, 10)}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }]
    });
    if (result.canceled || !result.filePath) return;
    const json = await store.exportJSON();
    await fs.writeFile(result.filePath, json, 'utf8');
    shell.showItemInFolder(result.filePath);
  });
  ipcMain.handle('settings:deleteAll', async () => {
    await store.deleteAll();
    scheduler.updateSettings(store.settings);
    scheduler.resetAll();
    pushPopover();
  });
  ipcMain.handle('settings:close', () => {
    if (settingsWin && !settingsWin.isDestroyed()) settingsWin.close();
  });

  app.on('window-all-closed', () => {
    // Keep running as a menu-bar app; do nothing.
  });
}

const BREAK_COPY: Record<BreakKind, { title: string; body: string }> = {
  eye: {
    title: 'Eyes to the horizon',
    body: 'Look at something far away until the countdown ends. Let your shoulders drop.'
  },
  stretch: {
    title: 'Stretch for a moment',
    body: 'A few easy desk stretches. Move gently and stop if anything hurts.'
  },
  long: {
    title: 'Stand up and move',
    body: 'Step away from the screen. Walk a little. Take a sip of water when you come back.'
  },
  // Water doesn't use the overlay; the sip window opens instead.
  water: { title: 'Take a sip', body: 'A small sip every break adds up.' }
};
