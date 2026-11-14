import type { PopoverState } from '../../shared/types';

interface DeskPopoverAPI {
  getState(): Promise<PopoverState>;
  onState(cb: (s: PopoverState) => void): void;
  takeSip(): Promise<unknown>;
  startNow(): Promise<void>;
  pause1h(): Promise<void>;
  updateSettings(patch: unknown): Promise<unknown>;
  openSip(): Promise<void>;
  openSettings(): Promise<void>;
}
const desk = (window as unknown as { desk: DeskPopoverAPI }).desk;

const KIND_LABEL = { eye: 'Eye break', stretch: 'Stretch break', long: 'Long break' };

const $nc = document.getElementById('next-countdown')!;
const $nk = document.getElementById('next-kind')!;
const $follow = document.getElementById('following')!;
const $breaksN = document.getElementById('breaks-n')!;
const $breaksGoal = document.getElementById('breaks-goal')!;
const $sipsN = document.getElementById('sips-n')!;
const $skipsN = document.getElementById('skips-n')!;

let state: PopoverState | null = null;

function pad(n: number): string { return String(n).padStart(2, '0'); }

function render(): void {
  if (!state) return;
  const ms = Math.max(0, state.nextBreakAt - Date.now());
  const sec = Math.round(ms / 1000);
  $nc.textContent = state.paused ? '⏸︎' : `${pad(Math.floor(sec / 60))}:${pad(sec % 60)}`;
  $nk.textContent = state.paused ? 'Paused' : KIND_LABEL[state.nextBreakKind];

  const fd = new Date(state.followingBreakAt);
  let h = fd.getHours();
  const m = fd.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12; if (h === 0) h = 12;
  $follow.textContent = state.paused
    ? 'Resumes when you unpause.'
    : `${KIND_LABEL[state.followingBreakKind]} at ${h}:${pad(m)} ${ampm}`;

  const c = state.counts;
  const taken = c.breaksTaken.eye + c.breaksTaken.stretch + c.breaksTaken.long;
  const skipped = c.breaksSkipped.eye + c.breaksSkipped.stretch + c.breaksSkipped.long;
  const perDay = Math.round((8 * 60) / state.settings.intervals.eye);
  $breaksN.textContent = String(taken);
  $breaksGoal.textContent = String(perDay);
  $sipsN.textContent = String(c.sips);
  $skipsN.textContent = String(skipped);
}

async function init(): Promise<void> {
  state = await desk.getState();
  render();
  desk.onState((s) => { state = s; render(); });
  setInterval(render, 1000);
}
init();

document.getElementById('take-sip')!.addEventListener('click', () => desk.openSip());
document.getElementById('start-now')!.addEventListener('click', () => desk.startNow());
document.getElementById('pause')!.addEventListener('click', () => desk.pause1h());
document.getElementById('settings')!.addEventListener('click', () => desk.openSettings());
