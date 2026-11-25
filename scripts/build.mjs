// Copies the site into ./dist for deploying. There is no bundling: the pages load plain ES modules.
import { cpSync, mkdirSync, rmSync } from 'node:fs';

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist/blender', { recursive: true });
for (const f of ['index.html', 'lowpoly.html', 'transform.html', 'paper.html']) cpSync(f, `dist/${f}`);
cpSync('shared', 'dist/shared', { recursive: true });
cpSync('blender/paper-cube-trim.mp4', 'dist/blender/paper-cube-trim.mp4');
console.log('built ./dist');
