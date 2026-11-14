import type { Settings, DayCounts } from './types';

export const DEFAULT_SETTINGS: Settings = {
  enforcement: 'firm',
  intervals: { eye: 20, stretch: 60, long: 120 },
  lengths: { eye: 20, stretch: 140, long: 300 },
  skipsPerDay: 2,
  snoozesPerDay: 3,
  lockOnBreak: false,
  launchAtLogin: true,
  workingHours: { enabled: false, startMin: 9 * 60, endMin: 18 * 60 }
};

export function emptyCounts(date: string): DayCounts {
  return {
    date,
    breaksTaken: { eye: 0, stretch: 0, long: 0 },
    breaksSkipped: { eye: 0, stretch: 0, long: 0 },
    snoozesUsed: 0,
    sips: 0
  };
}

export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
