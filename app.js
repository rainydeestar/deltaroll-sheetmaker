/* ============================================================
   ICON MANIFEST
   List every filename you drop into assets/icons/ here. Each
   one becomes an option in every icon picker in the sidebar.
   ============================================================ */
const ICON_MANIFEST = [
  'icontest.png',
  'armor.png',
  'axe.png',
  'dot.png',
  'glove.png',
  'scarf.png',
  'sword.png',
  'soul_courage.png',
];
const ICON_DIR = 'assets/icons/';
const WEAPON_BIG_ICON_MANIFEST = [
  'big_glove.png',
];
const WEAPON_BIG_ICON_DIR = 'assets/weapon-big/';
const IMAGE_EXTENSIONS = /\.(?:png|jpe?g|gif|webp|avif)$/i;

async function discoverIcons(directory, manifest) {
  try {
    const response = await fetch(directory, { cache: 'no-store' });
    if (!response.ok) return;

    const html = await response.text();
    const discovered = [...new DOMParser().parseFromString(html, 'text/html').querySelectorAll('a[href]')]
      .map((link) => link.getAttribute('href'))
      .filter((href) => href && IMAGE_EXTENSIONS.test(href))
      .map((href) => decodeURIComponent(href.split('/').pop()))
      .filter(Boolean);

    manifest.push(...discovered.filter((name) => !manifest.includes(name)));
  } catch (e) {
    // Static file hosting may not expose directory listings; use the fallback manifest.
  }
}

/* ============================================================
   LAYOUT
   Every coordinate below was measured directly off the reference
   PNGs (diffing the filled example against the empty template,
   pixel by pixel) — not eyeballed. Canvas stays at native 583x1248,
   matching the source art 1:1, no scaling anywhere.
   ============================================================ */
const LAYOUT = {
  canvas: { w: 583, h: 1248 },
  assets: {
    frame: 'assets/frame.png',
    heartFull: 'assets/icons/heart_full.png',
    heartEmpty: 'assets/icons/heart_empty.png',
    guts: 'assets/icons/guts.png',
  },
  colors: {
    white: '#ffffff',
    gray: '#808080',
    placeholder: '#000000', // fallback fill for any icon slot with nothing picked yet
  },
  font: { family: 'Determination Sans Web', size: 32, fallback: 'monospace' },

  header: {
    portrait: { x: 91, y: 90, w: 20, h: 24 },
    name: { centerX: 102, y: 60 },
    title: { x: 185, y: 42 },
    desc: { x: 185, y: 75, maxWidth: 363, lineHeight: 33, maxLines: 3 },
  },

  skills: {
    order: ['brawn', 'finesse', 'intellect', 'perception', 'charm'],
    startY: 179, rowH: 38,
    heartX: [203, 225, 247], heartW: 20, heartH: 20,
  },

  equip: {
    weaponBig: { x: 291, y: 167, w: 26, h: 36 }, // the one exception size
    rows: {
      weapon: { iconX: 332, iconY: 177, textY: 179 },
      armor: { iconX: 332, iconY: 209, textY: 211 },
      trinket: { iconX: 332, iconY: 241, textY: 243 },
    },
    iconW: 20, iconH: 24, textX: 354,
  },

  items: {
    count: 10, startY: 313, rowH: 30,
    iconX: 293, iconW: 20, iconH: 24, textX: 313, dashEndX: 548,
  },

  stats: {
    attack: { iconX: 27, iconY: 403, iconW: 20, iconH: 24, valueY: 405 },
    defense: { valueY: 435 },
    magic: { valueY: 465 },
    speed: { valueY: 495 },
    valueRightX: 263,
    custom: { startY: 523, rowH: 30, iconX: 27, iconW: 20, iconH: 24, labelX: 53 },
    guts: { x: 241, y: 583, w: 20, h: 24, step: 20 },
  },

  spells: {
    count: 6, startY: 663, rowH: 94,
    nameX: 32, percentRightX: 549,
    descX: 31, descDy: 32, descMaxWidth: 501, descLineHeight: 24, descMaxLines: 2,
  },
};

/* ============================================================
   DATA MODEL
   ============================================================ */
function blankCharacter(name) {
  return {
    name: name || 'New Character',
    title: '',
    description: '',
    portraitIcon: '',
    skills: { brawn: 0, finesse: 0, intellect: 0, perception: 0, charm: 0 },
    equip: {
      weapon: { icon: '', bigIcon: '', name: '' },
      armor: { icon: '', name: '' },
      trinket: { icon: '', name: '' },
    },
    items: Array.from({ length: 10 }, () => ({ icon: '', name: '' })),
    stats: {
      attack: { icon: '', value: '' },
      defense: { value: '' },
      magic: { value: '' },
      speed: { value: '' },
      custom: [{ icon: '', label: '', value: '' }, { icon: '', label: '', value: '' }],
      guts: 0,
    },
    spells: Array.from({ length: 6 }, () => ({ name: '', percent: '', description: '' })),
  };
}

// Matches the reference mockup exactly, so you can export this one and
// diff it pixel-for-pixel against the example PNG to sanity-check the renderer.
function demoCharacter() {
  const c = blankCharacter('Melanie');
  c.title = 'LV9 — Legendary Hero';
  c.description = 'Fends fate through the power of fists and friendship.';
  c.skills = { brawn: 3, finesse: 0, intellect: 0, perception: 0, charm: 2 };
  c.equip.weapon.name = 'Weapon';
  c.equip.armor.name = 'Armor';
  c.equip.trinket.name = 'Trinket';
  c.items = c.items.map((it, i) => (i < 5 ? { icon: '', name: 'PlaceholderObject' } : it));
  c.stats.attack.value = '999';
  c.stats.defense.value = '99';
  c.stats.magic.value = '9';
  c.stats.speed.value = '999';
  c.stats.custom[0] = { icon: '', label: 'Placeholder', value: '99' };
  c.stats.custom[1] = { icon: '', label: 'Placeholder', value: '999' };
  c.stats.guts = 3;
  c.spells = c.spells.map((s, i) => ({
    name: 'Rude Buster',
    percent: i === 0 ? '00%' : '100%',
    description: 'Fling a target within 12 squares 2 + MG squares in a direction of your choosing.',
  }));
  return c;
}

/* ============================================================
   STORAGE
   ============================================================ */
const STORE_KEY = 'pixelCharSheets_v2';
function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* corrupt storage, fall through */ }
  return { activeIndex: 0, characters: [demoCharacter()] };
}
function saveState() { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }

let state = loadState();
function activeChar() { return state.characters[state.activeIndex]; }

/* ============================================================
   IMAGE CACHE
   ============================================================ */
const imgCache = new Map();
function loadImage(src) {
  if (!src) return Promise.resolve(null);
  if (imgCache.has(src)) return Promise.resolve(imgCache.get(src));
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { imgCache.set(src, img); resolve(img); };
    img.onerror = () => { imgCache.set(src, null); resolve(null); };
    img.src = src;
  });
}

/* ============================================================
   CANVAS RENDERING
   ============================================================ */
const canvas = document.getElementById('sheet');
const ctx = canvas.getContext('2d');

function setFont() {
  ctx.font = `${LAYOUT.font.size}px "${LAYOUT.font.family}", ${LAYOUT.font.fallback}`;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
}
function text(str, x, y, color) {
  if (!str) return;
  ctx.fillStyle = color; ctx.textAlign = 'left';
  ctx.fillText(str, x, y - 7);
}
function textRight(str, rightX, y, color) {
  if (!str) return;
  ctx.fillStyle = color; ctx.textAlign = 'right';
  ctx.fillText(str, rightX, y - 7);
  ctx.textAlign = 'left';
}
function textCenter(str, centerX, y, color) {
  if (!str) return;
  ctx.fillStyle = color; ctx.textAlign = 'center';
  ctx.fillText(str, centerX, y - 7);
  ctx.textAlign = 'left';
}
function wrapText(str, x, y, maxWidth, lineHeight, maxLines, color, laterLineOffset = 0) {
  if (!str) return;
  ctx.fillStyle = color; ctx.textAlign = 'left';
  const words = str.split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (ctx.measureText(test).width > maxWidth && cur) { lines.push(cur); cur = w; }
    else cur = test;
  }
  if (cur) lines.push(cur);
  lines.slice(0, maxLines).forEach((l, i) => ctx.fillText(l, x, y - 7 + i * lineHeight + (i > 0 ? laterLineOffset : 0)));
}
function drawIcon(path, x, y, w, h) {
  const img = path ? imgCache.get(path) : null;
  if (img) ctx.drawImage(img, x, y, w, h);
  else { ctx.fillStyle = LAYOUT.colors.placeholder; ctx.fillRect(x, y, w, h); }
}
function drawDash(x, y, endX) {
  ctx.strokeStyle = LAYOUT.colors.gray;
  ctx.lineWidth = 2;
  ctx.setLineDash([12, 2]);
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(endX, y); ctx.stroke();
  ctx.setLineDash([]);
}

async function collectPaths(c) {
  const p = new Set([LAYOUT.assets.frame, LAYOUT.assets.heartFull, LAYOUT.assets.heartEmpty, LAYOUT.assets.guts]);
  if (c.portraitIcon) p.add(c.portraitIcon);
  if (c.equip.weapon.bigIcon) p.add(c.equip.weapon.bigIcon);
  [c.equip.weapon, c.equip.armor, c.equip.trinket].forEach((e) => { if (e.icon) p.add(e.icon); });
  c.items.forEach((it) => { if (it.icon) p.add(it.icon); });
  if (c.stats.attack.icon) p.add(c.stats.attack.icon);
  c.stats.custom.forEach((s) => { if (s.icon) p.add(s.icon); });
  await Promise.all([...p].map(loadImage));
}

async function render() {
  const c = activeChar();
  await collectPaths(c);

  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const frame = imgCache.get(LAYOUT.assets.frame);
  if (frame) ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);

  setFont();
  const { white, gray } = LAYOUT.colors;

  // ---- header ----
  drawIcon(c.portraitIcon, LAYOUT.header.portrait.x, LAYOUT.header.portrait.y, LAYOUT.header.portrait.w, LAYOUT.header.portrait.h);
  textCenter(c.name, LAYOUT.header.name.centerX, LAYOUT.header.name.y, white);
  text(c.title, LAYOUT.header.title.x, LAYOUT.header.title.y, white);
  wrapText(c.description, LAYOUT.header.desc.x, LAYOUT.header.desc.y, LAYOUT.header.desc.maxWidth, LAYOUT.header.desc.lineHeight, LAYOUT.header.desc.maxLines, white);

  // ---- skills (hearts) ----
  const heartFull = imgCache.get(LAYOUT.assets.heartFull);
  const heartEmpty = imgCache.get(LAYOUT.assets.heartEmpty);
  LAYOUT.skills.order.forEach((key, i) => {
    const val = Math.max(0, Math.min(3, c.skills[key] || 0));
    const rowY = LAYOUT.skills.startY + i * LAYOUT.skills.rowH;
    for (let h = 0; h < 3; h++) {
      const img = h < val ? heartFull : heartEmpty;
      const x = LAYOUT.skills.heartX[2 - h];
      if (img) ctx.drawImage(img, x, rowY, LAYOUT.skills.heartW, LAYOUT.skills.heartH);
    }
  });

  // ---- equipped ----
  const eq = LAYOUT.equip;
  drawIcon(c.equip.weapon.bigIcon, eq.weaponBig.x, eq.weaponBig.y, eq.weaponBig.w, eq.weaponBig.h);
  drawIcon(c.equip.weapon.icon, eq.rows.weapon.iconX, eq.rows.weapon.iconY, eq.iconW, eq.iconH);
  text(c.equip.weapon.name, eq.textX, eq.rows.weapon.textY, white);
  drawIcon(c.equip.armor.icon, eq.rows.armor.iconX, eq.rows.armor.iconY, eq.iconW, eq.iconH);
  text(c.equip.armor.name, eq.textX, eq.rows.armor.textY, white);
  drawIcon(c.equip.trinket.icon, eq.rows.trinket.iconX, eq.rows.trinket.iconY, eq.iconW, eq.iconH);
  text(c.equip.trinket.name, eq.textX, eq.rows.trinket.textY, white);

  // ---- items ----
  const it = LAYOUT.items;
  for (let i = 0; i < it.count; i++) {
    const item = c.items[i] || { icon: '', name: '' };
    const y = it.startY + i * it.rowH;
    drawIcon(item.icon, it.iconX, y, it.iconW, it.iconH);
    if (item.name) text(item.name, it.textX, y + 2, white);
    else drawDash(it.textX, y + it.iconH / 2, it.dashEndX);
  }

  // ---- stats ----
  const st = LAYOUT.stats;
  drawIcon(c.stats.attack.icon, st.attack.iconX, st.attack.iconY, st.attack.iconW, st.attack.iconH);
  textRight(c.stats.attack.value, st.valueRightX, st.attack.valueY, white);
  textRight(c.stats.defense.value, st.valueRightX, st.defense.valueY, white);
  textRight(c.stats.magic.value, st.valueRightX, st.magic.valueY, white);
  textRight(c.stats.speed.value, st.valueRightX, st.speed.valueY, white);
  c.stats.custom.forEach((cs, i) => {
    const y = st.custom.startY + i * st.custom.rowH;
    drawIcon(cs.icon, st.custom.iconX, y, st.custom.iconW, st.custom.iconH);
    text(cs.label, st.custom.labelX, y + 2, white);
    textRight(cs.value, st.valueRightX, y + 2, white);
  });
  const gutsImg = imgCache.get(LAYOUT.assets.guts);
  const gutsVal = Math.max(0, parseInt(c.stats.guts) || 0);
  for (let i = 0; i < gutsVal; i++) {
    const x = st.guts.x - i * st.guts.step;
    if (gutsImg) ctx.drawImage(gutsImg, x, st.guts.y, st.guts.w, st.guts.h);
    else { ctx.fillStyle = white; ctx.fillRect(x, st.guts.y, st.guts.w, st.guts.h); }
  }

  // ---- spells ----
  const sp = LAYOUT.spells;
  for (let i = 0; i < sp.count; i++) {
    const s = c.spells[i] || { name: '', percent: '', description: '' };
    const y = sp.startY + i * sp.rowH;
    text(s.name, sp.nameX, y, white);
    textRight(s.percent, sp.percentRightX, y, white);
    wrapText(s.description, sp.descX, y + sp.descDy, sp.descMaxWidth, sp.descLineHeight, sp.descMaxLines, gray, 2);
  }
}

let renderPending = false;
function scheduleRender() {
  saveState();
  if (renderPending) return;
  renderPending = true;
  requestAnimationFrame(async () => { renderPending = false; await render(); });
}

/* ============================================================
   FORM BUILDING
   ============================================================ */
const el = (id) => document.getElementById(id);
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function makeField(labelText, value, onInput, opts = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'field-block';
  const lbl = document.createElement('label');
  lbl.className = 'small'; lbl.textContent = labelText;
  const inp = document.createElement(opts.textarea ? 'textarea' : 'input');
  if (!opts.textarea) inp.type = opts.type || 'text';
  if (opts.min !== undefined) inp.min = opts.min;
  if (opts.max !== undefined) inp.max = opts.max;
  inp.value = value ?? '';
  inp.addEventListener('input', () => onInput(inp.value));
  wrap.appendChild(lbl); wrap.appendChild(inp);
  return wrap;
}

function makeIconPicker(labelText, value, onChange, directory = ICON_DIR, manifest = ICON_MANIFEST) {
  const wrap = document.createElement('div');
  wrap.className = 'field-block';
  const lbl = document.createElement('label');
  lbl.className = 'small'; lbl.textContent = labelText;
  const row = document.createElement('div'); row.className = 'icon-field';
  const sel = document.createElement('select');
  const noneOpt = document.createElement('option');
  noneOpt.value = ''; noneOpt.textContent = '— none (placeholder square) —';
  sel.appendChild(noneOpt);
  manifest.forEach((f) => {
    const opt = document.createElement('option');
    opt.value = directory + f; opt.textContent = f;
    sel.appendChild(opt);
  });
  sel.value = value || '';
  const preview = document.createElement('img');
  preview.className = 'icon-preview';
  if (value) preview.src = value;
  sel.addEventListener('change', () => { preview.src = sel.value; onChange(sel.value); });
  row.appendChild(sel); row.appendChild(preview);
  wrap.appendChild(lbl); wrap.appendChild(row);
  return wrap;
}

function buildForm() {
  const c = activeChar();

  const h = el('sec-header'); h.innerHTML = '';
  h.appendChild(makeField('Name', c.name, (v) => { c.name = v; renderCharSelect(); scheduleRender(); }));
  h.appendChild(makeField('Title / level line', c.title, (v) => { c.title = v; scheduleRender(); }));
  h.appendChild(makeField('Description (wraps, up to 3 lines)', c.description, (v) => { c.description = v; scheduleRender(); }, { textarea: true }));
  h.appendChild(makeIconPicker('Portrait icon', c.portraitIcon, (v) => { c.portraitIcon = v; scheduleRender(); }));

  const sk = el('sec-skills'); sk.innerHTML = '';
  const skillLabels = { brawn: 'Brawn', finesse: 'Finesse', intellect: 'Intellect', perception: 'Perception', charm: 'Charm' };
  LAYOUT.skills.order.forEach((key) => {
    sk.appendChild(makeField(`${skillLabels[key]} (0–3)`, c.skills[key], (v) => {
      c.skills[key] = Math.max(0, Math.min(3, parseInt(v) || 0)); scheduleRender();
    }, { type: 'number', min: 0, max: 3 }));
  });

  const eq = el('sec-equip'); eq.innerHTML = '';
  eq.appendChild(makeIconPicker('Weapon large icon', c.equip.weapon.bigIcon, (v) => {
    c.equip.weapon.bigIcon = v; scheduleRender();
  }, WEAPON_BIG_ICON_DIR, WEAPON_BIG_ICON_MANIFEST));
  ['weapon', 'armor', 'trinket'].forEach((key) => {
    eq.appendChild(makeIconPicker(`${cap(key)} icon`, c.equip[key].icon, (v) => { c.equip[key].icon = v; scheduleRender(); }));
    eq.appendChild(makeField(`${cap(key)} name`, c.equip[key].name, (v) => { c.equip[key].name = v; scheduleRender(); }));
  });

  const itSec = el('sec-items'); itSec.innerHTML = '';
  c.items.forEach((item, i) => {
    itSec.appendChild(makeIconPicker(`Item ${i + 1} icon`, item.icon, (v) => { item.icon = v; scheduleRender(); }));
    itSec.appendChild(makeField(`Item ${i + 1} name (blank = empty slot)`, item.name, (v) => { item.name = v; scheduleRender(); }));
  });

  const st = el('sec-stats'); st.innerHTML = '';
  st.appendChild(makeIconPicker('Attack icon', c.stats.attack.icon, (v) => { c.stats.attack.icon = v; scheduleRender(); }));
  st.appendChild(makeField('Attack value', c.stats.attack.value, (v) => { c.stats.attack.value = v; scheduleRender(); }));
  st.appendChild(makeField('Defense value', c.stats.defense.value, (v) => { c.stats.defense.value = v; scheduleRender(); }));
  st.appendChild(makeField('Magic value', c.stats.magic.value, (v) => { c.stats.magic.value = v; scheduleRender(); }));
  st.appendChild(makeField('Speed value', c.stats.speed.value, (v) => { c.stats.speed.value = v; scheduleRender(); }));
  c.stats.custom.forEach((cs, i) => {
    st.appendChild(makeIconPicker(`Custom stat ${i + 1} icon`, cs.icon, (v) => { cs.icon = v; scheduleRender(); }));
    st.appendChild(makeField(`Custom stat ${i + 1} label`, cs.label, (v) => { cs.label = v; scheduleRender(); }));
    st.appendChild(makeField(`Custom stat ${i + 1} value`, cs.value, (v) => { cs.value = v; scheduleRender(); }));
  });
  st.appendChild(makeField('Guts (count, no empty state)', c.stats.guts, (v) => { c.stats.guts = Math.max(0, parseInt(v) || 0); scheduleRender(); }, { type: 'number', min: 0 }));

  const sp = el('sec-spells'); sp.innerHTML = '';
  c.spells.forEach((s, i) => {
    sp.appendChild(makeField(`Spell ${i + 1} name`, s.name, (v) => { s.name = v; scheduleRender(); }));
    sp.appendChild(makeField(`Spell ${i + 1} cost / percent`, s.percent, (v) => { s.percent = v; scheduleRender(); }));
    sp.appendChild(makeField(`Spell ${i + 1} description`, s.description, (v) => { s.description = v; scheduleRender(); }, { textarea: true }));
  });
}

/* ============================================================
   CHARACTER SWITCHER + EXPORT
   ============================================================ */
function renderCharSelect() {
  const sel = el('charSelect');
  sel.innerHTML = '';
  state.characters.forEach((c, i) => {
    const opt = document.createElement('option');
    opt.value = i; opt.textContent = c.name || 'Unnamed';
    sel.appendChild(opt);
  });
  sel.value = state.activeIndex;
}

el('charSelect').onchange = (e) => {
  state.activeIndex = parseInt(e.target.value);
  renderCharSelect(); buildForm(); scheduleRender();
};
el('addChar').onclick = () => {
  state.characters.push(blankCharacter());
  state.activeIndex = state.characters.length - 1;
  renderCharSelect(); buildForm(); scheduleRender();
};
el('delChar').onclick = () => {
  if (state.characters.length <= 1) return;
  state.characters.splice(state.activeIndex, 1);
  state.activeIndex = 0;
  renderCharSelect(); buildForm(); scheduleRender();
};
el('download').onclick = () => {
  canvas.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${(activeChar().name || 'character').replace(/\s+/g, '_')}.png`;
    a.click();
  });
};

/* ============================================================
   BOOT
   ============================================================ */
(async function init() {
  try {
    await document.fonts.load(`${LAYOUT.font.size}px "${LAYOUT.font.family}"`);
    if (!document.fonts.check(`${LAYOUT.font.size}px "${LAYOUT.font.family}"`)) throw new Error('not found');
  } catch (e) {
    el('fontWarning').textContent = 'Determination Sans Web not found in assets/fonts/ yet — using a fallback font until you add it.';
  }
  await discoverIcons(ICON_DIR, ICON_MANIFEST);
  await discoverIcons(WEAPON_BIG_ICON_DIR, WEAPON_BIG_ICON_MANIFEST);
  renderCharSelect();
  buildForm();
  await render();
})();
