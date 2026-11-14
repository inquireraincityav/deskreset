import { exec } from 'node:child_process';

// Real session lock. The login window takes over the display and
// requires the account password to return — the same thing Apple
// menu → Lock Screen does. The app stays running; its overlay is
// already open and reappears, with the live countdown, as soon as
// the user authenticates.
//
// macOS does not let any third-party app draw on top of the login
// window itself, so showing the countdown ON the lock screen is not
// possible. Showing it the moment the user unlocks is what this does.
export function lockScreen(): void {
  if (process.platform === 'darwin') {
    exec('/System/Library/CoreServices/"Menu Extras"/User.menu/Contents/Resources/CGSession -suspend');
  } else if (process.platform === 'win32') {
    exec('rundll32.exe user32.dll,LockWorkStation');
  }
}
