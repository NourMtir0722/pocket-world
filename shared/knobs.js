// Every knob of a world lives in one schema; the panel is generated from it (same idea and look as Builderland).
// A share link stores only the values that differ from the defaults.
const WORDS = ['meadow', 'harbor', 'lantern', 'maple', 'tide', 'ember', 'willow', 'pebble', 'comet', 'fjord', 'orchard', 'dune', 'moss', 'aurora', 'kite', 'clover', 'thimble', 'cove'];
export const randomSeed = () => `${WORDS[Math.floor(Math.random() * WORDS.length)]}-${Math.floor(Math.random() * 900 + 100)}`;
export const hashSeed = (s) => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };

export function defaults(schema) { return Object.fromEntries(schema.map((k) => [k.key, k.default])); }
export function clean(schema, values = {}) {
  const out = defaults(schema);
  for (const k of schema) {
    const v = values[k.key]; if (v === undefined || v === null) continue;
    if (k.type === 'range') out[k.key] = Math.min(k.max, Math.max(k.min, Number(v)));
    else if (k.type === 'toggle') out[k.key] = !!v;
    else if (k.type === 'select') out[k.key] = k.options.includes(v) ? v : k.default;
    else out[k.key] = String(v);
  }
  return out;
}
export function readShared(schema) {
  try { const w = new URLSearchParams(location.search).get('w'); return w ? clean(schema, JSON.parse(w)) : defaults(schema); }
  catch { return defaults(schema); }
}
export function shareUrl(schema, values, page) {
  const d = defaults(schema), diff = Object.fromEntries(Object.entries(values).filter(([k, v]) => d[k] !== v));
  const q = Object.keys(diff).length ? '?w=' + encodeURIComponent(JSON.stringify(diff)) : '';
  return window.parent !== window ? `${location.origin}/${q}#${page}` : `${location.origin}${location.pathname}${q}`;
}

// Builderland's paper-card look: cream paper, ink outlines, hard shadows, Fredoka.
const CSS = `
.kn, .kn-open { --paper: #FBF5E8; --paper-2: #F3EAD6; --ink: #2B2530; --muted: #7D7164; --green: #6E9A4E; font-family: Fredoka, ui-rounded, system-ui, sans-serif; color: var(--ink); }
.kn-card { background: var(--paper); border: 3px solid var(--ink); border-radius: 14px; box-shadow: 0 4px 0 rgba(43,37,48,.85); }
.kn-btn { border: 2.5px solid var(--ink); background: var(--paper); color: var(--ink); border-radius: 10px; padding: 7px 12px; font: 500 14px Fredoka, system-ui, sans-serif;
  cursor: pointer; box-shadow: 0 3px 0 var(--ink); transition: transform .06s, box-shadow .06s; white-space: nowrap; }
.kn-btn:active { transform: translateY(3px); box-shadow: 0 0 0 var(--ink); }
.kn-btn.go { background: var(--green); color: #FFFDF6; }
.kn-open { position: fixed; top: 16px; right: 16px; z-index: 10; }
html.embed .kn-open { display: none; }
.kn { position: fixed; top: 16px; right: 16px; bottom: 100px; width: 340px; max-width: calc(100vw - 32px); z-index: 10; display: flex; flex-direction: column; overflow: hidden;
  transition: transform .3s cubic-bezier(.2,.8,.2,1), opacity .25s; }
html:not(.embed) .kn { top: 70px; bottom: 16px; }
.kn.closed { transform: translateX(calc(100% + 30px)); opacity: 0; pointer-events: none; }
.kn-head { display: flex; justify-content: space-between; align-items: center; padding: 12px 14px 6px; font-size: 17px; }
.kn-x { border: 0; background: none; font-size: 18px; cursor: pointer; color: var(--ink); }
.kn-tabs { display: flex; flex-wrap: wrap; gap: 4px; padding: 4px 12px 8px; border-bottom: 2px solid rgba(43,37,48,.15); }
.kn-tabs button { border: 2px solid var(--ink); background: var(--paper); border-radius: 8px; padding: 3px 10px; font: 500 13px Fredoka, system-ui, sans-serif; cursor: pointer; color: var(--ink); }
.kn-tabs button[aria-selected=true] { background: var(--ink); color: var(--paper); }
.kn-body { overflow: auto; padding: 8px 14px 14px; flex: 1; }
.kn-tab { display: none; } .kn-tab.on { display: block; }
.kn .ctl { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 2px 10px; padding: 8px 0; border-bottom: 1.5px dashed rgba(43,37,48,.18); font-size: 14px; }
.kn .ctl .val { font-size: 12px; color: var(--muted); font-variant-numeric: tabular-nums; }
.kn .ctl input[type=range] { grid-column: span 2; width: 100%; accent-color: var(--ink); margin: 2px 0 0; }
.kn .ctl select { border: 2px solid var(--ink); border-radius: 8px; background: #fff; padding: 2px 6px; font: 13px Fredoka, system-ui, sans-serif; color: var(--ink); }
.kn .ctl input[type=checkbox] { width: 18px; height: 18px; accent-color: var(--ink); margin: 0; }
.kn-seed { display: flex; gap: 6px; padding: 6px 0 10px; border-bottom: 1.5px dashed rgba(43,37,48,.18); }
.kn-seed input { flex: 1; min-width: 0; border: 2.5px solid var(--ink); border-radius: 10px; padding: 6px 9px; font: 15px ui-monospace, Menlo, monospace; background: #fff; color: var(--ink); outline: none; }
.kn-label { font-size: 12px; color: var(--muted); margin: 6px 0 0; }
.kn-hint { font-size: 12px; color: var(--muted); line-height: 1.45; margin-top: 8px; }
.kn-foot { display: flex; gap: 6px; padding: 10px 14px 14px; border-top: 2px solid rgba(43,37,48,.15); }
.kn-foot .kn-btn { flex: 1; }
@media (max-width: 700px) { .kn { left: 16px; right: 16px; width: auto; top: auto; height: 58vh; bottom: 96px; } html:not(.embed) .kn { top: auto; bottom: 16px; } }
`;

// schema items: { key, label, type: range|select|toggle|text, group, min, max, step, options, labels, default, live, format }
export function makePanel({ schema, values, page, onChange, onToggle }) {
  if (!document.querySelector('link[href*="Fredoka"]')) {
    const f = document.createElement('link'); f.rel = 'stylesheet'; f.href = 'https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600&display=swap'; document.head.appendChild(f);
  }
  const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
  const opener = document.createElement('button'); opener.className = 'kn-open kn-btn'; opener.textContent = '⚙ Customize';
  const panel = document.createElement('aside'); panel.className = 'kn kn-card closed'; panel.setAttribute('aria-label', 'Customize your world');
  panel.innerHTML = '<div class="kn-head"><strong>Customize your world</strong><button class="kn-x" aria-label="Close">✕</button></div><div class="kn-tabs" role="tablist"></div><div class="kn-body"></div><div class="kn-foot"></div>';
  document.body.append(opener, panel);
  const tabs = panel.querySelector('.kn-tabs'), body = panel.querySelector('.kn-body'), foot = panel.querySelector('.kn-foot');
  const inputs = {}, pages = {};
  const fmt = (k, v) => (k.format ? k.format(v) : k.step && k.step < 1 ? Number(v).toFixed(2).replace(/0$/, '') : v);

  function showTab(g) {
    for (const [name, el] of Object.entries(pages)) el.classList.toggle('on', name === g);
    tabs.querySelectorAll('button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.g === g)));
  }
  for (const k of schema) {
    if (k.type === 'text') continue;
    if (!pages[k.group]) {
      const pg = document.createElement('div'); pg.className = 'kn-tab'; pages[k.group] = pg; body.append(pg);
      const b = document.createElement('button'); b.textContent = k.group; b.dataset.g = k.group; b.setAttribute('role', 'tab'); b.onclick = () => showTab(k.group); tabs.append(b);
    }
    const row = document.createElement('div'); row.className = 'ctl';
    const label = document.createElement('label'); label.textContent = k.label; label.htmlFor = 'kn-' + k.key;
    let input, out;
    if (k.type === 'range') {
      input = Object.assign(document.createElement('input'), { type: 'range', min: k.min, max: k.max, step: k.step ?? 1, value: values[k.key] });
      out = document.createElement('span'); out.className = 'val'; out.textContent = fmt(k, values[k.key]);
      input.oninput = () => { const v = Number(input.value); out.textContent = fmt(k, v); onChange(k, v); };
      row.append(label, out, input);
    } else if (k.type === 'select') {
      input = document.createElement('select');
      k.options.forEach((o) => input.append(new Option(k.labels?.[o] ?? o[0].toUpperCase() + o.slice(1), o)));
      input.value = values[k.key]; input.onchange = () => onChange(k, input.value);
      row.append(label, input);
    } else {
      input = Object.assign(document.createElement('input'), { type: 'checkbox', checked: values[k.key] });
      input.onchange = () => onChange(k, input.checked);
      row.append(label, input);
    }
    input.id = 'kn-' + k.key; inputs[k.key] = { input, out, k };
    pages[k.group].append(row);
  }
  // the seed sits at the top of the first tab, like Builderland's seed field
  const seedKey = schema.find((k) => k.type === 'text');
  const first = Object.values(pages)[0];
  let seedInput = null;
  if (seedKey && first) {
    const lab = document.createElement('div'); lab.className = 'kn-label'; lab.textContent = 'Seed (same seed, same world)';
    const row = document.createElement('div'); row.className = 'kn-seed';
    seedInput = Object.assign(document.createElement('input'), { value: values[seedKey.key], spellcheck: false });
    seedInput.setAttribute('aria-label', 'Seed');
    const roll = Object.assign(document.createElement('button'), { className: 'kn-btn', textContent: '🎲' }); roll.title = 'New seed';
    seedInput.onchange = () => onChange(seedKey, seedInput.value.trim() || seedKey.default);
    roll.onclick = () => { seedInput.value = randomSeed(); onChange(seedKey, seedInput.value); };
    row.append(seedInput, roll); first.prepend(lab, row);
    inputs[seedKey.key] = { input: seedInput, k: seedKey };
  }
  const reroll = Object.assign(document.createElement('button'), { className: 'kn-btn go', textContent: '🎲 Reroll' });
  const copy = Object.assign(document.createElement('button'), { className: 'kn-btn', textContent: 'Copy link' });
  const reset = Object.assign(document.createElement('button'), { className: 'kn-btn', textContent: 'Reset' });
  reroll.onclick = () => { const s = randomSeed(); if (seedInput) seedInput.value = s; onChange(seedKey, s); };
  copy.onclick = async () => {
    const url = shareUrl(schema, values, page);
    try { await navigator.clipboard.writeText(url); copy.textContent = 'Copied ✓'; } catch { prompt('Copy this link', url); }
    setTimeout(() => (copy.textContent = 'Copy link'), 1400);
  };
  reset.onclick = () => { const d = defaults(schema); for (const k of schema) set(k.key, d[k.key], true); };
  foot.append(reroll, copy, reset);
  showTab(Object.keys(pages)[0]);

  function set(key, v, notify = false) {
    const it = inputs[key]; if (!it) return;
    if (it.input.type === 'checkbox') it.input.checked = v; else it.input.value = v;
    if (it.out) it.out.textContent = fmt(it.k, v);
    if (notify) onChange(it.k, v);
  }
  function toggle(open = panel.classList.contains('closed')) { panel.classList.toggle('closed', !open); onToggle?.(open); return open; }
  opener.onclick = () => toggle();
  panel.querySelector('.kn-x').onclick = () => toggle(false);
  if (new URLSearchParams(location.search).has('panel')) toggle(true);
  return { set, toggle, panel, showTab };
}
