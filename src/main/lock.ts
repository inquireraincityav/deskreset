import { exec } from 'node:child_process';

// OS-level lock. On macOS this sleeps the display, which requires the
// account password to come back. (Full session lock via CGSession needs
// a bundled helper; sleep is good enough for Phase 1 and documented.)
export function lockScreen(): void {
  if (process.platform === 'darwin') {
    exec('pmset displaysleepnow');
  } else if (process.platform === 'win32') {
    exec('rundll32.exe user32.dll,LockWorkStation');
  }
}
