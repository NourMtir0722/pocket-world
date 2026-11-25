// Talk between a world page and the hub that frames it.
// Pages report what the camera is near (for sound) and one-off events; the hub sends commands (fly through).
export const embedded = window.parent !== window;
if (embedded) document.documentElement.classList.add('embed');

export function send(type, data = {}) {
  if (embedded) window.parent.postMessage({ src: 'pw-page', type, ...data }, location.origin);
}
export function onCommand(fn) {
  addEventListener('message', (e) => { if (e.origin === location.origin && e.data?.src === 'pw-hub') fn(e.data); });
}
// keys meant for the hub still work while the 3D view has focus
addEventListener('keydown', (e) => {
  if (!embedded) return;
  if (e.target.closest?.('input, select')) return;
  if (/^[1-4]$/.test(e.key) || ['t', 'T', 'm', 'M', 'c', 'C', 'n', 'N', 'd', 'D'].includes(e.key)) send('key', { key: e.key });
});

// How much of each side of the cube the camera is looking at, and how close it is.
// `local` is the camera position in the cube's own coordinates, `half` the cube's half size.
export function faceWeights(local, half) {
  const d = local.length() || 1;
  const x = local.x / d, y = local.y / d, z = local.z / d;
  const surface = Math.max(Math.abs(local.x), Math.abs(local.y), Math.abs(local.z)) - half;
  const near = 1 / (1 + Math.max(0, surface) / half * 1.3);
  const w = (v) => Math.max(0, v) ** 1.5;
  return { top: w(y), front: w(z), right: w(x), back: w(-z), left: w(-x), near };
}

// Scripted camera moves for the demo: orbit by an angle and scale the viewing distance, eased.
// keepDist: the page sets the distance itself every frame and only reads state.mul.
export function makeDirector({ keepDist = false } = {}) {
  let tw = null; const state = { mul: 1 }, axis = { x: 0, y: 1, z: 0 };
  return {
    state,
    go({ az = 0, mul = state.mul, dur = 2 }) { tw = { az, m0: state.mul, m1: mul, dur: Math.max(0.1, dur), t: 0, done: 0, base: 0 }; },
    update(dt, camera, target) {
      if (!tw) return;
      tw.t = Math.min(1, tw.t + dt / tw.dur);
      const e = tw.t < 0.5 ? 2 * tw.t * tw.t : 1 - (-2 * tw.t + 2) ** 2 / 2;
      const off = camera.position.clone().sub(target);
      off.applyAxisAngle(axis, (e - tw.done) * tw.az); tw.done = e;
      state.mul = tw.m0 + (tw.m1 - tw.m0) * e;
      if (!keepDist) { if (!tw.base) tw.base = off.length() / tw.m0; off.setLength(tw.base * state.mul); }
      camera.position.copy(target).add(off);
      if (tw.t >= 1) tw = null;
    },
  };
}
