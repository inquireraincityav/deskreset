import type { PopoverState, Settings, EnforcementMode } from '../../shared/types';

interface DeskSettingsAPI {
  getState(): Promise<PopoverState>;
  update(patch: Partial<Settings>): Promise<Settings>;
  exportData(): Promise<void>;
  deleteAll(): Promise<void>;
  close(): Promise<void>;
}
const desk = (window as unknown as { desk: DeskSettingsAPI }).desk;

let settings: Settings;

function $(id: string): HTMLElement { return document.getElementById(id)!; }

function hmFromMin(min: number): string {
  const h = Math.floor(min / 60), m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
function minFromHm(hm: string): number {
  const [h, m] = hm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function render(): void {
  // enforcement cards
  document.querySelectorAll<HTMLElement>('.enforce').forEach((el) => {
    el.classList.toggle('selected', el.dataset.mode === settings.enforcement);
  });
  $('skips-val').textContent = String(settings.skipsPerDay);
  $('ieye-val').textContent = String(settings.intervals.eye);
  $('istretch-val').textContent = String(settings.intervals.stretch);
  $('ilong-val').textContent = String(settings.intervals.long);
  setSwitch('lock-toggle', settings.lockOnBreak);
  setSwitch('launch-toggle', settings.launchAtLogin);
  setSwitch('wh-toggle', settings.workingHours.enabled);
  ($('wh-start') as HTMLInputElement).value = hmFromMin(settings.workingHours.startMin);
  ($('wh-end') as HTMLInputElement).value = hmFromMin(settings.workingHours.endMin);
}

function setSwitch(id: string, on: boolean): void {
  $(id).setAttribute('aria-checked', String(on));
}

async function save(patch: Partial<Settings>): Promise<void> {
  settings = await desk.update(patch);
  render();
}

(async (): Promise<void> => {
  const state = await desk.getState();
  settings = state.settings;
  render();
})();

// enforcement
document.querySelectorAll<HTMLElement>('.enforce').forEach((el) => {
  el.addEventListener('click', () => save({ enforcement: el.dataset.mode as EnforcementMode }));
});

// steppers
document.querySelectorAll<HTMLButtonElement>('[data-step]').forEach((b) => {
  b.addEventListener('click', () => {
    const dir = Number(b.dataset.dir);
    const key = b.dataset.step!;
    if (key === 'skips') {
      save({ skipsPerDay: Math.max(0, Math.min(20, settings.skipsPerDay + dir)) });
    } else if (key === 'ieye') {
      save({ intervals: { ...settings.intervals, eye: Math.max(5, Math.min(120, settings.intervals.eye + dir)) } });
    } else if (key === 'istretch') {
      save({ intervals: { ...settings.intervals, stretch: Math.max(15, Math.min(240, settings.intervals.stretch + dir)) } });
    } else if (key === 'ilong') {
      save({ intervals: { ...settings.intervals, long: Math.max(30, Math.min(480, settings.intervals.long + dir)) } });
    }
  });
});

// toggles
$('lock-toggle').addEventListener('click', () => save({ lockOnBreak: !settings.lockOnBreak }));
$('launch-toggle').addEventListener('click', () => save({ launchAtLogin: !settings.launchAtLogin }));
$('wh-toggle').addEventListener('click', () => save({ workingHours: { ...settings.workingHours, enabled: !settings.workingHours.enabled } }));

// times
$('wh-start').addEventListener('change', () => save({ workingHours: { ...settings.workingHours, startMin: minFromHm(($('wh-start') as HTMLInputElement).value) } }));
$('wh-end').addEventListener('change', () => save({ workingHours: { ...settings.workingHours, endMin: minFromHm(($('wh-end') as HTMLInputElement).value) } }));

// export / delete / close
$('export').addEventListener('click', () => desk.exportData());
$('delete').addEventListener('click', () => {
  if (confirm('Delete all Desk Reset data? This cannot be undone.')) desk.deleteAll();
});
$('close').addEventListener('click', () => desk.close());
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') desk.close(); });
