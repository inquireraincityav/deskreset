import type { OverlayPayload } from '../../shared/types';

interface DeskOverlayAPI {
  payload(): OverlayPayload;
  complete(): Promise<void>;
  skip(): Promise<void>;
  override(): Promise<void>;
  snooze(): Promise<void>;
  lock(): Promise<void>;
  sip(): Promise<void>;
}
const desk = (window as unknown as { desk: DeskOverlayAPI }).desk;
const data = desk.payload();

const BREAK_LABEL: Record<string, string> = {
  eye: 'Eye break',
  stretch: 'Stretch break',
  long: 'Long break'
};

const $title = document.getElementById('title')!;
const $body = document.getElementById('body')!;
const $eyebrow = document.getElementById('eyebrow')!;
const $clock = document.getElementById('clock')!;
const $countdown = document.getElementById('countdown')!;
const $barFill = document.getElementById('bar-fill')!;
const $skip = document.getElementById('skip') as HTMLButtonElement;
const $skipFill = document.getElementById('skip-fill')!;
const $skipLabel = document.getElementById('skip-label')!;
const $lock = document.getElementById('lock') as HTMLButtonElement;

$title.textContent = data.title;
$body.textContent = data.body;

const taken = data.counts.breaksTaken[data.kind];
const skipped = data.counts.breaksSkipped[data.kind];
const total = taken + skipped + 1;
$eyebrow.textContent = `${BREAK_LABEL[data.kind] ?? 'Break'} · ${total} today`;

const skipsLeft = Math.max(0, data.settings.skipsPerDay - skipped);
if (data.settings.enforcement === 'strict') {
  $skip.hidden = true;
}
if (data.settings.enforcement === 'firm' && skipsLeft <= 0) {
  $skip.hidden = true;
}

// ---- Clock tick ----
function pad(n: number): string { return String(n).padStart(2, '0'); }
function tickClock(): void {
  const d = new Date();
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12; if (h === 0) h = 12;
  $clock.textContent = `${h}:${pad(m)} ${ampm}`;
}
tickClock();
setInterval(tickClock, 15_000);

// ---- Countdown ----
const endsAt = data.startedAt + data.lengthSec * 1000;
function tickCountdown(): void {
  const remaining = Math.max(0, endsAt - Date.now());
  const sec = Math.ceil(remaining / 1000);
  $countdown.textContent = `${pad(Math.floor(sec / 60))}:${pad(sec % 60)}`;
  const pct = 100 * (1 - remaining / (data.lengthSec * 1000));
  ($barFill as HTMLElement).style.width = `${Math.min(100, Math.max(0, pct))}%`;
  if (remaining <= 0) {
    clearInterval(cdHandle);
    desk.complete();
  }
}
tickCountdown();
const cdHandle = setInterval(tickCountdown, 250);

// ---- Hold to skip (Firm mode) ----
const SKIP_HOLD_MS = data.settings.enforcement === 'gentle' ? 0 : 3000;
let skipStart = 0;
let skipHandle: number | null = null;

function startSkipHold(): void {
  if ($skip.hidden) return;
  skipStart = Date.now();
  if (skipHandle) cancelAnimationFrame(skipHandle);
  const step = (): void => {
    const held = Date.now() - skipStart;
    const pct = Math.min(100, (held / Math.max(1, SKIP_HOLD_MS)) * 100);
    ($skipFill as HTMLElement).style.width = `${pct}%`;
    if (held >= SKIP_HOLD_MS) {
      desk.skip();
      return;
    }
    skipHandle = requestAnimationFrame(step);
  };
  skipHandle = requestAnimationFrame(step);
}
function endSkipHold(): void {
  if (skipHandle) cancelAnimationFrame(skipHandle);
  skipHandle = null;
  ($skipFill as HTMLElement).style.width = '0%';
}
$skip.addEventListener('pointerdown', (e) => {
  if (SKIP_HOLD_MS === 0) { desk.skip(); return; }
  (e.target as Element).setPointerCapture?.((e as PointerEvent).pointerId);
  startSkipHold();
});
$skip.addEventListener('pointerup', endSkipHold);
$skip.addEventListener('pointercancel', endSkipHold);
$skip.addEventListener('pointerleave', endSkipHold);

$skipLabel.textContent = data.settings.enforcement === 'gentle' ? 'Skip' : 'Hold to skip';

$lock.addEventListener('click', () => desk.lock());

// ---- Esc behaviour ----
// Hold 5s → emergency override (always works).
// Press twice within 1s → snooze 5 min (counts against daily limit).
let escDown = 0;
let escHoldTimer: number | null = null;
let lastEscTap = 0;

window.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (e.repeat) return;
  const now = Date.now();
  if (now - lastEscTap < 1000) {
    desk.snooze();
    lastEscTap = 0;
    return;
  }
  lastEscTap = now;
  escDown = now;
  if (escHoldTimer) window.clearTimeout(escHoldTimer);
  escHoldTimer = window.setTimeout(() => {
    desk.override();
  }, 5000);
});
window.addEventListener('keyup', (e) => {
  if (e.key !== 'Escape') return;
  if (escHoldTimer) { window.clearTimeout(escHoldTimer); escHoldTimer = null; }
  escDown = 0;
});
