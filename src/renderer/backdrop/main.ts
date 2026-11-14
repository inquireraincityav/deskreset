export {};
interface DeskBackdropAPI { close(): Promise<void>; }
const desk = (window as unknown as { desk: DeskBackdropAPI }).desk;

// Click anywhere or press Escape to dismiss.
window.addEventListener('mousedown', () => desk.close());
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') desk.close(); });
