// Every sound here is synthesised: noise, oscillators and envelopes. No audio files.
export class SoundEngine {
  constructor() {
    const ctx = this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.out = ctx.createGain(); this.out.gain.value = 0.9;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3;
    this.out.connect(comp); comp.connect(ctx.destination);
    this.verb = ctx.createConvolver(); this.verb.buffer = this.impulse(2.6, 2.4);
    const vg = ctx.createGain(); vg.gain.value = 0.5; this.verb.connect(vg); vg.connect(this.out);
    this.noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

    this.wind = this.noiseLayer('bandpass', 420, 0.6, { lfo: 0.07, lfoDepth: 260, target: 'freq' });
    this.sea = this.noiseLayer('lowpass', 520, 0.7, { lfo: 0.11, lfoDepth: 0.5, target: 'gain' });
    this.water = this.noiseLayer('bandpass', 1300, 0.5, { lfo: 5.3, lfoDepth: 0.35, target: 'gain' });
    this.mix = { birds: 0, wind: 0.2, water: 0, sea: 0, night: 0 };
    this.musicProb = 0.4; this.padLevel = 0.7; this.step = 0; this.note = 4;
    this.scale = [261.6, 293.7, 329.6, 392, 440, 523.3, 587.3, 659.3, 784, 880, 1046.5];
    this.chords = [[130.8, 164.8, 196, 246.9], [110, 130.8, 164.8, 196], [87.3, 110, 130.8, 164.8], [98, 123.5, 146.8, 164.8]];
    this.chordIx = 0; this.pad = null;
    this.timer = setInterval(() => this.tick(), 100);
    this.nextPad = 0; this.nextBird = 0; this.nextDrop = 0; this.nextCricket = 0; this.nextNote = 0;
  }
  impulse(sec, decay) {
    const { ctx } = this, len = ctx.sampleRate * sec, b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** decay; }
    return b;
  }
  noiseLayer(type, freq, q, { lfo, lfoDepth, target }) {
    const { ctx } = this;
    const src = ctx.createBufferSource(); src.buffer = this.noiseBuf; src.loop = true;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const shaped = ctx.createGain(); shaped.gain.value = target === 'gain' ? 0.6 : 1;
    const level = ctx.createGain(); level.gain.value = 0;
    src.connect(f); f.connect(shaped); shaped.connect(level); level.connect(this.out);
    const o = ctx.createOscillator(); o.frequency.value = lfo; const og = ctx.createGain(); og.gain.value = lfoDepth;
    o.connect(og); og.connect(target === 'freq' ? f.frequency : shaped.gain); o.start(); src.start();
    return level;
  }
  setTheme(theme) {
    const t = { lowpoly: [0.3, 0.6], paper: [0.5, 0.8], transform: [0.45, 0.8], film: [0.55, 1] }[theme] || [0.4, 0.7];
    [this.musicProb, this.padLevel] = t;
  }
  setMix(m) {
    Object.assign(this.mix, m);
    const now = this.ctx.currentTime, k = 0.4;
    this.wind.gain.setTargetAtTime(this.mix.wind * 0.1, now, k);
    this.sea.gain.setTargetAtTime(this.mix.sea * 0.22, now, k);
    this.water.gain.setTargetAtTime(this.mix.water * 0.11, now, k);
  }
  setMuted(m) { this.out.gain.setTargetAtTime(m ? 0 : 0.9, this.ctx.currentTime, 0.1); }
  resume() { return this.ctx.resume(); }

  // ---------- generative bits ----------
  tick() {
    if (this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime, m = this.mix;
    if (now > this.nextPad) { this.playPad(); this.nextPad = now + 8; }
    if (now > this.nextNote) {
      this.nextNote = now + 0.42;
      if (Math.random() < this.musicProb) {
        this.note = Math.max(0, Math.min(this.scale.length - 1, this.note + Math.round((Math.random() - 0.5) * 4)));
        this.musicBox(this.scale[this.note], 0.05 + Math.random() * 0.03);
      }
    }
    if (m.birds > 0.05 && now > this.nextBird) { this.bird(m.birds); this.nextBird = now + (0.6 + Math.random() * 2.2) / Math.max(0.3, m.birds); }
    if (m.water > 0.1 && now > this.nextDrop) { this.drop(m.water); this.nextDrop = now + (0.08 + Math.random() * 0.4) / m.water; }
    if (m.night > 0.08 && now > this.nextCricket) { this.cricket(m.night); this.nextCricket = now + 0.5 + Math.random() * 0.5; }
  }
  env(node, t, a, peak, dec) { node.gain.setValueAtTime(0.0001, t); node.gain.exponentialRampToValueAtTime(peak, t + a); node.gain.exponentialRampToValueAtTime(0.0001, t + a + dec); }
  voice(freq, type = 'sine') { const o = this.ctx.createOscillator(); o.type = type; o.frequency.value = freq; return o; }
  route(node, dry = 1, wet = 0.4, pan = 0) {
    const p = this.ctx.createStereoPanner(); p.pan.value = pan; node.connect(p);
    const dg = this.ctx.createGain(); dg.gain.value = dry; p.connect(dg); dg.connect(this.out);
    const wg = this.ctx.createGain(); wg.gain.value = wet; p.connect(wg); wg.connect(this.verb);
  }
  musicBox(f, v) {
    const t = this.ctx.currentTime, g = this.ctx.createGain();
    [[1, 1], [2, 0.22], [3.01, 0.08]].forEach(([k, a]) => { const o = this.voice(f * k); const og = this.ctx.createGain(); og.gain.value = a; o.connect(og); og.connect(g); o.start(t); o.stop(t + 2); });
    this.env(g, t, 0.004, v, 1.6); this.route(g, 0.8, 0.7, (Math.random() - 0.5) * 0.6);
  }
  playPad() {
    const t = this.ctx.currentTime, chord = this.chords[this.chordIx++ % this.chords.length];
    const g = this.ctx.createGain(), lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
    g.connect(lp); this.route(lp, 0.7, 0.6);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.022 * this.padLevel, t + 3); g.gain.linearRampToValueAtTime(0.0001, t + 10);
    chord.forEach((f) => { [-4, 4].forEach((det) => { const o = this.voice(f, 'triangle'); o.detune.value = det; o.connect(g); o.start(t); o.stop(t + 10.5); }); });
  }
  bird(level) {
    const t = this.ctx.currentTime, n = 1 + Math.floor(Math.random() * 4), base = 2200 + Math.random() * 1600, pan = Math.random() * 1.6 - 0.8;
    for (let i = 0; i < n; i++) {
      const s = t + i * (0.09 + Math.random() * 0.05), o = this.voice(base), g = this.ctx.createGain();
      o.frequency.setValueAtTime(base, s); o.frequency.exponentialRampToValueAtTime(base * (1.3 + Math.random() * 0.4), s + 0.05); o.frequency.exponentialRampToValueAtTime(base * 0.85, s + 0.1);
      o.connect(g); this.env(g, s, 0.01, 0.05 * level, 0.09); this.route(g, 0.7, 0.5, pan); o.start(s); o.stop(s + 0.15);
    }
  }
  drop(level) {
    const t = this.ctx.currentTime, f = 700 + Math.random() * 1600, o = this.voice(f), g = this.ctx.createGain();
    o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 1.8, t + 0.04);
    o.connect(g); this.env(g, t, 0.003, 0.035 * level, 0.06); this.route(g, 0.6, 0.6, Math.random() * 1.4 - 0.7); o.start(t); o.stop(t + 0.1);
  }
  cricket(level) {
    const t = this.ctx.currentTime, pan = Math.random() * 1.6 - 0.8, f = 4300 + Math.random() * 600;
    for (let i = 0; i < 4; i++) { const s = t + i * 0.045, o = this.voice(f), g = this.ctx.createGain(); o.connect(g); this.env(g, s, 0.004, 0.02 * level, 0.025); this.route(g, 0.7, 0.3, pan); o.start(s); o.stop(s + 0.05); }
  }
  burst(t, dur, type, f0, f1, q, peak, pan = 0, wet = 0.3) {
    const src = this.ctx.createBufferSource(); src.buffer = this.noiseBuf; src.playbackRate.value = 1;
    const f = this.ctx.createBiquadFilter(); f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = this.ctx.createGain(); src.connect(f); f.connect(g); this.env(g, t, Math.min(0.05, dur * 0.3), peak, dur); this.route(g, 1, wet, pan);
    src.start(t, Math.random() * 2); src.stop(t + dur + 0.1);
  }
  sfx(name) {
    if (this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime;
    if (name === 'pop') {
      const o = this.voice(760), g = this.ctx.createGain(); o.frequency.setValueAtTime(760 + Math.random() * 200, t); o.frequency.exponentialRampToValueAtTime(190, t + 0.12);
      o.connect(g); this.env(g, t, 0.004, 0.16, 0.14); this.route(g, 1, 0.3, Math.random() - 0.5); o.start(t); o.stop(t + 0.2);
      this.burst(t, 0.03, 'highpass', 3000, 3000, 0.7, 0.08);
    } else if (name === 'fold' || name === 'unfold') {
      const up = name === 'fold';
      this.burst(t, 0.55, 'bandpass', up ? 900 : 2600, up ? 2600 : 900, 1.2, 0.12);
      for (let i = 0; i < 7; i++) this.burst(t + 0.05 + Math.random() * 0.45, 0.025, 'highpass', 3500, 3500, 0.8, 0.05 + Math.random() * 0.05, Math.random() - 0.5);
    } else if (name === 'scan') {
      this.burst(t, 2.6, 'bandpass', 300, 4200, 2, 0.08, 0, 0.6);
      [0, 4, 7, 11, 14, 19].forEach((st, i) => { const o = this.voice(523.3 * 2 ** (st / 12)), g = this.ctx.createGain(); o.connect(g); const s = t + i * 0.32; this.env(g, s, 0.01, 0.05, 1.4); this.route(g, 0.6, 0.9, (i % 2 ? 0.4 : -0.4)); o.start(s); o.stop(s + 1.6); });
    } else if (name === 'whoosh') {
      this.burst(t, 1.3, 'bandpass', 300, 1600, 1.5, 0.14, 0, 0.4);
    } else if (name === 'splash') {
      this.burst(t, 0.9, 'lowpass', 2400, 500, 0.7, 0.2, 0.2, 0.5);
      for (let i = 0; i < 6; i++) setTimeout(() => this.drop(1), i * 70 + Math.random() * 60);
    } else if (name === 'thump') {
      const o = this.voice(110), g = this.ctx.createGain(); o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(55, t + 0.15);
      o.connect(g); this.env(g, t, 0.005, 0.3, 0.22); this.route(g, 1, 0.2); o.start(t); o.stop(t + 0.3);
      this.burst(t, 0.12, 'lowpass', 600, 200, 0.7, 0.12);
    }
  }
}
