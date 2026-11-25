import * as THREE from 'three';

// A vertical field of view widened for tall screens, so the world keeps its sides on a phone held upright.
// Wide screens keep the field they asked for; narrower ones get the horizontal view of `minAspect`.
export function fitFov(fov, aspect, minAspect = 1.25, max = 80) {
  if (aspect >= minAspect) return fov;
  const half = Math.atan(Math.tan(THREE.MathUtils.degToRad(fov / 2)) * minAspect / aspect);
  return Math.min(max, THREE.MathUtils.radToDeg(2 * half));
}

// A camera flight through a world. Points and look-targets are in the world's own coordinates,
// so the flight follows the cube wherever it is. The first point is replaced by where the camera is now.
export class Tour {
  constructor({ camera, controls, space, points, targets, duration = 30, fov = 52, onProgress, onEnd }) {
    Object.assign(this, { camera, controls, space, duration, fov, onProgress, onEnd });
    this.points = points; this.targets = targets;
    this.active = false; this.t = 0;
    const at = new URLSearchParams(location.search).get('tour');   // testing: jump into the flight at a fraction
    if (at !== null) setTimeout(() => { this.start(); this.t = Number(at); this.duration = 1e9; }, 300);
  }
  start() {
    const { camera, controls, space } = this;
    this.fov0 = camera.fov; this.near0 = camera.near; this.target0 = controls.target.clone();
    const pts = this.points.map((p) => p.clone()), tgs = this.targets.map((p) => p.clone());
    pts[0] = space.worldToLocal(camera.position.clone());
    tgs[0] = space.worldToLocal(controls.target.clone());
    this.pc = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    this.tc = new THREE.CatmullRomCurve3(tgs, false, 'centripetal');
    controls.enabled = false; camera.near = 0.02;
    this.active = true; this.t = 0;
  }
  update(dt) {
    if (!this.active) return;
    const { camera, space } = this;
    this.t = Math.min(1, this.t + dt / this.duration);
    const e = this.t < 0.5 ? 2 * this.t * this.t : 1 - (-2 * this.t + 2) ** 2 / 2;
    const u = 0.15 * e + 0.85 * this.t;            // mostly steady speed, soft start and stop
    camera.position.copy(space.localToWorld(this.pc.getPoint(u)));
    camera.lookAt(space.localToWorld(this.tc.getPoint(u)));
    const ramp = Math.min(1, this.t / 0.08, (1 - this.t) / 0.08);
    camera.fov = this.fov0 + (fitFov(this.fov, camera.aspect) - this.fov0) * Math.max(0, ramp);
    camera.updateProjectionMatrix();
    this.onProgress?.(u);
    if (this.t >= 1) this.stop();
  }
  stop() {
    if (!this.active) return;
    const { camera, controls } = this;
    this.active = false;
    camera.fov = this.fov0; camera.near = this.near0; camera.updateProjectionMatrix();
    controls.target.copy(this.target0); controls.enabled = true; controls.update();
    this.onEnd?.();
  }
}
