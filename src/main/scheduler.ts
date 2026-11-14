import { EventEmitter } from 'node:events';
import { powerMonitor } from 'electron';
import type { BreakKind, Settings } from '../shared/types';

// The scheduler decides when the next break fires. It tracks three
// independent timers (eye, stretch, long) and emits 'fire' with whichever
// is due next. Idle time counts as a natural break and resets the timers.

export class Scheduler extends EventEmitter {
  private settings: Settings;
  private nextAt: Record<BreakKind, number>;
  private tickHandle: NodeJS.Timeout | null = null;
  private paused = false;
  private pausedUntil: number | null = null;
  private suppressed = false; // true while a break is active
  private headsupShownFor: { kind: BreakKind; at: number } | null = null;

  constructor(settings: Settings) {
    super();
    this.settings = settings;
    const now = Date.now();
    this.nextAt = {
      eye: now + settings.intervals.eye * 60_000,
      stretch: now + settings.intervals.stretch * 60_000,
      long: now + settings.intervals.long * 60_000
    };
  }

  start(): void {
    if (this.tickHandle) return;
    this.tickHandle = setInterval(() => this.tick(), 1_000);
  }

  stop(): void {
    if (this.tickHandle) clearInterval(this.tickHandle);
    this.tickHandle = null;
  }

  updateSettings(s: Settings): void {
    this.settings = s;
  }

  setPaused(paused: boolean, until: number | null = null): void {
    this.paused = paused;
    this.pausedUntil = until;
    if (!paused) this.resetAll(); // treat pause-end as fresh start
  }

  // Called after a break ends (taken, skipped, or overridden) so the
  // next instance of that kind schedules again.
  reschedule(kind: BreakKind): void {
    this.nextAt[kind] = Date.now() + this.settings.intervals[kind] * 60_000;
    this.suppressed = false;
    this.headsupShownFor = null;
  }

  snooze(minutes: number): void {
    // Push every pending break forward.
    for (const k of ['eye', 'stretch', 'long'] as BreakKind[]) {
      this.nextAt[k] = Math.max(this.nextAt[k], Date.now() + minutes * 60_000);
    }
    this.headsupShownFor = null;
  }

  // Force the next instance of a kind to fire right now (used by
  // "Start a break now" in the popover and heads-up).
  fireNow(kind: BreakKind): void {
    this.nextAt[kind] = Date.now();
    this.headsupShownFor = null;
  }

  // The user was idle long enough to count as a natural break.
  resetAll(): void {
    const now = Date.now();
    this.nextAt.eye = now + this.settings.intervals.eye * 60_000;
    this.nextAt.stretch = now + this.settings.intervals.stretch * 60_000;
    this.nextAt.long = now + this.settings.intervals.long * 60_000;
  }

  state(): { next: { kind: BreakKind; at: number }; following: { kind: BreakKind; at: number } } {
    const entries = (Object.keys(this.nextAt) as BreakKind[])
      .map((k) => ({ kind: k, at: this.nextAt[k] }))
      .sort((a, b) => a.at - b.at);
    return { next: entries[0], following: entries[1] };
  }

  private withinWorkingHours(now = new Date()): boolean {
    const wh = this.settings.workingHours;
    if (!wh.enabled) return true;
    const m = now.getHours() * 60 + now.getMinutes();
    return m >= wh.startMin && m < wh.endMin;
  }

  private tick(): void {
    if (this.suppressed) return;
    const now = Date.now();
    if (this.paused) {
      if (this.pausedUntil && now >= this.pausedUntil) {
        this.setPaused(false);
      } else {
        return;
      }
    }
    if (!this.withinWorkingHours()) return;

    // Idle detection — if the user has been idle longer than the eye
    // interval, treat it as a natural break.
    const idleSec = powerMonitor.getSystemIdleTime();
    if (idleSec >= this.settings.intervals.eye * 60) {
      this.resetAll();
      return;
    }

    const { next } = this.state();
    if (now >= next.at) {
      this.suppressed = true;
      this.emit('fire', next.kind);
    } else if (next.at - now <= 10_000) {
      const already = this.headsupShownFor;
      if (!already || already.kind !== next.kind || already.at !== next.at) {
        this.headsupShownFor = { kind: next.kind, at: next.at };
        this.emit('headsup', next.kind, Math.max(0, Math.ceil((next.at - now) / 1000)));
      }
    }
  }
}
