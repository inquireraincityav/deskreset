export {};
interface Payload {
  kind: 'eye' | 'stretch' | 'long';
  secondsUntil: number;
  snoozesLeft: number;
}
interface DeskHeadsupAPI {
  payload(): Payload;
  startNow(): Promise<void>;
  snooze(minutes: number): Promise<void>;
  close(): Promise<void>;
}
const desk = (window as unknown as { desk: DeskHeadsupAPI }).desk;
const p = desk.payload();

const MSG: Record<string, string> = {
  eye: 'Almost time. Your eyes will appreciate this.',
  stretch: 'Stretch break coming. Save your place.',
  long: 'A longer break is up next. Stand, walk, sip.'
};

const $cd = document.getElementById('countdown')!;
const $msg = document.getElementById('message')!;
const $foot = document.getElementById('footer')!;

$msg.textContent = MSG[p.kind] ?? MSG.eye;
$foot.textContent = `${p.snoozesLeft} snoozes left today`;

let sec = p.secondsUntil;
function pad(n: number): string { return String(n).padStart(2, '0'); }
function render(): void {
  $cd.textContent = `00:${pad(Math.max(0, sec))}`;
}
render();
const tick = setInterval(() => {
  sec -= 1;
  render();
  if (sec <= 0) { clearInterval(tick); desk.close(); }
}, 1000);

document.getElementById('start')!.addEventListener('click', () => desk.startNow());
document.querySelectorAll<HTMLButtonElement>('.snooze').forEach((b) => {
  b.addEventListener('click', () => desk.snooze(Number(b.dataset.m)));
});
