import { app, BrowserWindow, ipcMain, nativeTheme } from 'electron';
import { Store } from './store';
import { Scheduler } from './scheduler';
import { OverlayController } from './overlay';
import { TrayController } from './tray';
import { createPopoverWindow } from './popover';
import { lockScreen } from './lock';
import type { BreakKind, PopoverState, Settings } from '../shared/types';

// Hide from Dock — menu-bar-only.
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

  // Launch at login — mirrors the stored setting.
  app.setLoginItemSettings({ openAtLogin: store.settings.launchAtLogin });

  let popover: BrowserWindow | null = null;
  tray.init(() => {
    popover = createPopoverWindow();
    tray.attachPopover(popover);
    return popover;
  });

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
    const copy = BREAK_COPY[kind];
    const length = store.settings.lengths[kind];
    if (store.settings.lockOnBreak) lockScreen();
    overlay.show(kind, copy.title, copy.body, length);
  });

  scheduler.start();

  // Tray countdown — update every 15s.
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
    if (popover && !popover.isDestroyed()) {
      popover.webContents.send('popover:state', snapshotPopover());
    }
  }

  function snapshotPopover(): PopoverState {
    const { next, following } = scheduler.state();
    return {
      nextBreakAt: next.at,
      nextBreakKind: next.kind,
      followingBreakAt: following.at,
      followingBreakKind: following.kind,
      counts: store.today(),
      settings: store.settings,
      paused: false,
      pausedUntil: null
    };
  }

  ipcMain.handle('popover:getState', () => snapshotPopover());
  ipcMain.handle('popover:takeSip', async () => (await store.bumpSip()));
  ipcMain.handle('popover:startNow', () => {
    const { next } = scheduler.state();
    scheduler.reschedule(next.kind); // shift before showing so the fire path is clean
    const copy = BREAK_COPY[next.kind];
    overlay.show(next.kind, copy.title, copy.body, store.settings.lengths[next.kind]);
  });
  ipcMain.handle('popover:pause1h', () => {
    scheduler.setPaused(true, Date.now() + 60 * 60_000);
    pushPopover();
  });
  ipcMain.handle('popover:updateSettings', async (_e, patch: Partial<Settings>) => {
    const s = await store.updateSettings(patch);
    scheduler.updateSettings(s);
    if (typeof patch.launchAtLogin === 'boolean') {
      app.setLoginItemSettings({ openAtLogin: patch.launchAtLogin });
    }
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
  ipcMain.handle('overlay:sip', async () => await store.bumpSip());

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
  }
};
