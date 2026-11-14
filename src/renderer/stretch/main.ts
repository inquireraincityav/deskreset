// @ts-ignore - plain JS module
import { createStretch } from '../_3d/mannequin.js';
import type { OverlayPayload } from '../../shared/types';

interface DeskStretchAPI {
  payload(): OverlayPayload;
  complete(): Promise<void>;
  skip(): Promise<void>;
  override(): Promise<void>;
  snooze(): Promise<void>;
  lock(): Promise<void>;
}
const desk = (window as unknown as { desk: DeskStretchAPI }).desk;
const data = desk.payload();

type Side = 1 | -1;
interface Phase { g: number; id: 'neck' | 'shoulder' | 'twist' | 'wrist'; name: string; side: string; s: Side; cue: string; }

const PHASES: Phase[] = [
  { g: 0, id: 'neck',     name: 'Neck tilt',          side: 'Right side',      s: 1,  cue: 'Drop your right ear toward your right shoulder. Keep both shoulders low and relaxed.' },
  { g: 0, id: 'neck',     name: 'Neck tilt',          side: 'Left side',       s: -1, cue: 'Now drop your left ear toward your left shoulder. Let the weight of your head do the work.' },
  { g: 1, id: 'shoulder', name: 'Shoulder rolls',     side: 'Both shoulders',  s: 1,  cue: 'Lift your shoulders up, then roll them back and down in slow, big circles.' },
  { g: 2, id: 'twist',    name: 'Seated twist',       side: 'Turn right',      s: 1,  cue: 'Sit tall, one hand on the back of your chair. Exhale and turn gently to the right.' },
  { g: 2, id: 'twist',    name: 'Seated twist',       side: 'Turn left',       s: -1, cue: 'Switch hands and turn gently to the left. Keep both feet flat on the floor.' },
  { g: 3, id: 'wrist',    name: 'Wrist and forearm',  side: 'Right hand',      s: 1,  cue: 'Arm straight out, palm facing away. Use your other hand to gently draw the fingers back.' },
  { g: 3, id: 'wrist',    name: 'Wrist and forearm',  side: 'Left hand',       s: -1, cue: 'Switch arms. Keep the elbow straight and draw the fingers back until you feel a mild stretch.' }
];
const PHASE_SEC = 20;
const GROUP_NAMES = ['Neck tilt', 'Shoulder rolls', 'Seated twist', 'Wrist and forearm'];

const $groups = document.getElementById('groups')!;
const $name = document.getElementById('name')!;
const $side = document.getElementById('side-chip')!;
const $cue = document.getElementById('cue')!;
const $ringText = document.getElementById('ring-text')!;
const $ringFill = document.getElementById('ring-fill') as unknown as SVGCircleElement;
const $pause = document.getElementById('pause')!;

let phaseIdx = 0;
let secs = PHASE_SEC;
let paused = false;

function renderGroups(): void {
  const current = PHASES[phaseIdx];
  $groups.innerHTML = '';
  for (let i = 0; i < GROUP_NAMES.length; i++) {
    const cls = i < current.g ? 'done' : i === current.g ? 'active' : '';
    const el = document.createElement('div');
    el.className = 'group';
    el.innerHTML = `<div class="group-bar ${cls}"></div><div class="group-label d ${cls ? 'active' : ''}">${i + 1} · ${GROUP_NAMES[i]}</div>`;
    $groups.appendChild(el);
  }
}

function renderPhase(): void {
  const p = PHASES[phaseIdx];
  $name.textContent = p.name;
  $side.textContent = p.side;
  $cue.textContent = p.cue;
  renderGroups();
  scene?.setPose(p.id, p.s);
}
function renderRing(): void {
  $ringText.textContent = String(secs);
  const circ = 2 * Math.PI * 54;
  const off = circ * (1 - secs / PHASE_SEC);
  $ringFill.style.strokeDashoffset = String(off);
}

function advance(dir: 1 | -1): void {
  phaseIdx = (phaseIdx + dir + PHASES.length) % PHASES.length;
  secs = PHASE_SEC;
  renderPhase();
  renderRing();
}

let scene: { setPose: (id: string, s: number) => void; dispose: () => void } | null = null;
try {
  scene = createStretch(document.getElementById('canvas'));
} catch (e) {
  console.error('3D stage failed; continuing without it.', e);
}

renderPhase();
renderRing();

// Overall break timer — ends when all 7 phases complete (if not paused).
let totalElapsed = 0;
const tick = (): void => {
  if (paused) return;
  secs -= 1;
  totalElapsed += 1;
  if (secs <= 0) {
    if (phaseIdx === PHASES.length - 1) {
      desk.complete();
      clearInterval(timer);
      return;
    }
    advance(1);
  } else {
    renderRing();
  }
};
const timer = setInterval(tick, 1000);

document.getElementById('back')!.addEventListener('click', () => advance(-1));
document.getElementById('next')!.addEventListener('click', () => advance(1));
$pause.addEventListener('click', () => {
  paused = !paused;
  $pause.textContent = paused ? 'Resume' : 'Pause';
});

// Esc behaviour: twice → snooze, hold 5s → override.
let escHoldTimer: number | null = null;
let lastEscTap = 0;
window.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape' || e.repeat) return;
  const now = Date.now();
  if (now - lastEscTap < 1000) { desk.snooze(); lastEscTap = 0; return; }
  lastEscTap = now;
  if (escHoldTimer) window.clearTimeout(escHoldTimer);
  escHoldTimer = window.setTimeout(() => desk.override(), 5000);
});
window.addEventListener('keyup', (e) => {
  if (e.key !== 'Escape') return;
  if (escHoldTimer) { window.clearTimeout(escHoldTimer); escHoldTimer = null; }
});

window.addEventListener('beforeunload', () => {
  scene?.dispose();
  clearInterval(timer);
});
