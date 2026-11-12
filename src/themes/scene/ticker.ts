// One requestAnimationFrame loop per page, shared by every scene on it. It stops when nothing is
// subscribed and pauses while the tab is hidden.

export type Tick = (dt: number, now: number) => void;

const subscribers = new Set<Tick>();
let frame = 0;
let last = 0;

function loop(now: number) {
  // Clamp so a long frame (e.g. after a hitch) never teleports particles.
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  subscribers.forEach((tick) => tick(dt, now));
  frame = requestAnimationFrame(loop);
}

function start() {
  if (frame || subscribers.size === 0 || document.hidden) return;
  last = performance.now();
  frame = requestAnimationFrame(loop);
}

function stop() {
  cancelAnimationFrame(frame);
  frame = 0;
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
}

export function subscribe(tick: Tick): () => void {
  subscribers.add(tick);
  start();
  return () => {
    subscribers.delete(tick);
    if (subscribers.size === 0) stop();
  };
}
