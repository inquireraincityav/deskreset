export type BreakKind = 'eye' | 'stretch' | 'long';
export type EnforcementMode = 'gentle' | 'firm' | 'strict';

export interface Settings {
  enforcement: EnforcementMode;
  intervals: { eye: number; stretch: number; long: number }; // minutes
  lengths: { eye: number; stretch: number; long: number }; // seconds
  skipsPerDay: number;
  snoozesPerDay: number;
  lockOnBreak: boolean;
  launchAtLogin: boolean;
  workingHours: { enabled: boolean; startMin: number; endMin: number }; // minutes since midnight
}

export interface DayCounts {
  date: string; // YYYY-MM-DD
  breaksTaken: Record<BreakKind, number>;
  breaksSkipped: Record<BreakKind, number>;
  snoozesUsed: number;
  sips: number;
}

export interface OverrideEvent {
  at: number; // epoch ms
  kind: BreakKind;
  reason: 'esc-hold' | 'crash-watchdog';
}

export interface PopoverState {
  nextBreakAt: number; // epoch ms
  nextBreakKind: BreakKind;
  followingBreakAt: number;
  followingBreakKind: BreakKind;
  counts: DayCounts;
  settings: Settings;
  paused: boolean;
  pausedUntil: number | null;
}

export interface OverlayPayload {
  kind: BreakKind;
  lengthSec: number;
  startedAt: number;
  title: string;
  body: string;
  counts: DayCounts;
  settings: Settings;
}
