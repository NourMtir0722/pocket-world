import * as THREE from 'three';

// Time of day for a scene: the sun moves with the hour, a blue moon takes over at night,
// stars fade in, and the background follows a sky palette. Returns how much night there is.
const lerpC = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), t);
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export function makeDaylight({ scene, renderer, sun, hemi, fill, getBloom, sky, shadowSpan = 8, sunPower = 2.6, dayHemi = '#fff6e6' }) {
  const moon = new THREE.DirectionalLight('#9db4ff', 0);
  moon.shadow.mapSize.set(1024, 1024);
  Object.assign(moon.shadow.camera, { left: -shadowSpan, right: shadowSpan, top: shadowSpan, bottom: -shadowSpan, near: 1, far: 40 });
  moon.shadow.bias = -0.0004; moon.shadow.normalBias = 0.02;
  scene.add(moon);
  const stars = (() => {
    const n = 1400, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, r = 45, s = Math.sqrt(1 - u * u);
      pos.set([Math.cos(a) * s * r, u * r, Math.sin(a) * s * r], i * 3); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const p = new THREE.Points(g, new THREE.PointsMaterial({ color: '#ffffff', size: 0.14, transparent: true, opacity: 0, depthWrite: false }));
    scene.add(p); return p;
  })();
  function skyAt(h) {
    for (let i = 1; i < sky.length; i++) if (h <= sky[i][0]) { const [h0, c0] = sky[i - 1], [h1, c1] = sky[i]; return lerpC(c0, c1, (h - h0) / (h1 - h0)); }
    return new THREE.Color(sky[0][1]);
  }
  const state = { night: 0, up: 1 };
  function apply(K) {
    const h = ((K.hour % 24) + 24) % 24;
    const elev = Math.sin((h - 6) / 12 * Math.PI);
    const up = smooth(-0.16, 0.2, elev), night = 1 - smooth(-0.2, 0.08, elev);
    const az = THREE.MathUtils.degToRad(K.sunAngle) + (h - 12) / 12 * Math.PI * 0.85;
    const el = Math.asin(Math.max(0.06, elev)) * 0.92;
    sun.position.set(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az)).multiplyScalar(14);
    sun.color.copy(lerpC('#ff8c4a', '#fff2dc', smooth(0, 0.55, elev)));
    sun.intensity = sunPower * up;
    moon.position.set(-Math.cos(az) * 8, 11, -Math.sin(az) * 8);
    moon.intensity = 1.5 * night;
    sun.castShadow = up > 0.15; moon.castShadow = !sun.castShadow;
    sun.shadow.radius = moon.shadow.radius = K.softness;
    hemi.color.copy(lerpC('#5a6cb0', dayHemi, up));
    hemi.groundColor.copy(lerpC('#262a44', '#3a4570', up));
    hemi.intensity = 0.7 + 0.3 * up;
    if (fill) fill.intensity = 0.3 + 0.5 * up;
    scene.background.copy(skyAt(h));
    stars.material.opacity = night * 0.9;
    renderer.toneMappingExposure = K.exposure * (0.92 + 0.08 * up);
    const b = getBloom?.(); if (b) b.strength = K.glow * (1 + night * 0.8);
    state.night = night; state.up = up;
    return state;
  }
  return { apply, state, moon, stars };
}
