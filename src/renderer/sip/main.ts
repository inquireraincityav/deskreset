// @ts-ignore - plain JS module
import { createSip } from '../_3d/mannequin.js';
import type { PopoverState } from '../../shared/types';

interface DeskSipAPI {
  getState(): Promise<PopoverState>;
  takeSip(): Promise<unknown>;
  close(): Promise<void>;
}
const desk = (window as unknown as { desk: DeskSipAPI }).desk;

const $count = document.getElementById('count')!;
const $dots = document.getElementById('dots')!;
const $btn = document.getElementById('sip-btn') as HTMLButtonElement;
const $close = document.getElementById('close')!;

let sipping = false;
let scene: { sip: (cb?: () => void) => void; dispose: () => void } | null = null;
try {
  scene = createSip(document.getElementById('canvas'));
} catch (e) {
  console.error('3D sip scene failed; continuing without it.', e);
}

function render(count: number): void {
  $count.textContent = String(count);
  $dots.innerHTML = '';
  for (let i = 0; i < 10; i++) {
    const s = document.createElement('span');
    if (i < count) s.className = 'on';
    $dots.appendChild(s);
  }
}

async function refresh(): Promise<void> {
  const state = await desk.getState();
  render(state.counts.sips);
}
refresh();

$btn.addEventListener('click', async () => {
  if (sipping) return;
  sipping = true;
  $btn.disabled = true;
  $btn.textContent = 'Sipping…';
  const finish = async (): Promise<void> => {
    await desk.takeSip();
    await refresh();
    sipping = false;
    $btn.disabled = false;
    $btn.textContent = 'Take a sip';
  };
  if (scene) scene.sip(finish);
  else finish();
});

$close.addEventListener('click', () => desk.close());
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') desk.close(); });
window.addEventListener('beforeunload', () => scene?.dispose());
