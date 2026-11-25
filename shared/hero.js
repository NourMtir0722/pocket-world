import * as THREE from 'three';

// A website-hero title drawn behind the world: a plane fixed to the camera, far enough back that
// the cube always sits in front of it. Redrawn to fit whenever the window changes shape.
export function addHero({ camera, scene, text = 'Pocket World', sub = '', brightness = 0.9, distance = 34 }) {
  if (!document.querySelector('link[href*="Fredoka"]')) {
    const f = document.createElement('link'); f.rel = 'stylesheet'; f.href = 'https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600&display=swap'; document.head.appendChild(f);
  }
  const canvas = document.createElement('canvas');
  const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace;
  // toneMapped off and slightly under 1.0 so it reads white without tripping the glow pass
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false });
  mat.color.setScalar(brightness);
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  plane.renderOrder = -1; plane.frustumCulled = false;
  camera.add(plane); if (!camera.parent) scene.add(camera);

  function layout() {
    const h = 2 * distance * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), w = h * camera.aspect;
    plane.scale.set(w, h, 1); plane.position.set(0, 0, -distance);
    const W = 2048, Hc = Math.max(256, Math.round(W / camera.aspect));
    canvas.width = W; canvas.height = Hc;
    const g = canvas.getContext('2d');
    g.clearRect(0, 0, W, Hc); g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const lines = camera.aspect < 0.95 ? text.split(' ') : [text];
    let size = lines.length > 1 ? Math.min(W * 0.27, Hc * 0.2) : Math.min(W * 0.17, Hc * 0.34);
    const font = (s, wgt = 600) => `${wgt} ${s}px Fredoka, ui-rounded, system-ui, sans-serif`;
    g.font = font(size);
    const widest = Math.max(...lines.map((l) => g.measureText(l).width));
    if (widest > W * 0.94) { size *= (W * 0.94) / widest; g.font = font(size); }
    const lh = size * 0.92, y0 = Hc * 0.5 - ((lines.length - 1) * lh) / 2;
    lines.forEach((l, i) => g.fillText(l, W / 2, y0 + i * lh));
    if (sub) { g.globalAlpha = 0.75; g.font = font(Math.max(22, size * 0.12), 500); g.fillText(sub, W / 2, y0 + (lines.length - 1) * lh + size * 0.66); g.globalAlpha = 1; }
    tex.needsUpdate = true;
  }
  layout();
  document.fonts?.load('600 120px Fredoka').then(layout).catch(() => {});
  addEventListener('resize', () => setTimeout(layout, 0));
  return { object: plane, layout, setText(t, s = sub) { text = t; sub = s; layout(); } };
}
