/* ============================================================
   ICON MANIFEST
   List every filename you drop into assets/icons/ here. Each
   one becomes an option in every icon picker in the sidebar.
   ============================================================ */
const ICON_MANIFEST = [
  'icontest.png',
  'apron.png',
  'armor.png',
  'axe.png',
  'bang.png',
  'blackshard.png',
  'clover.png',
  'decrease.png',
  'dogsmile.png',
  'dot.png',
  'down.png',
  'evil.png',
  'fluff.png',
  'gingerbread.png',
  'glasses.png',
  'glove.png',
  'guts.png',
  'hat.png',
  'heart_empty.png',
  'heart_full.png',
  'ice.png',
  'increase.png',
  'knife.png',
  'lollipop.png',
  'magic.png',
  'ring.png',
  'scarf.png',
  'shoe.png',
  'sleep.png',
  'smile.png',
  'sword.png',
  'up.png',
];
const ICON_DIR = 'assets/icons/';
const CHARACTER_ICON_MANIFEST = [
  'soul_courage.png',
  'soul_monster.png',
  'soul_patience.png',
  'soul_bravery.png',
  'soul_integrity.png',
  'soul_perseverance.png',
  'soul_kindness.png',
  'soul_justice.png',
  'soul_red.png',
  'flower_aqua.png',
  'flower_orange.png',
  'flower_blue.png',
  'flower_purple.png',
  'flower_green.png',
  'flower_yellow.png',
  'flower_golden.png',
];
const CHARACTER_ICON_DIR = 'assets/character/';
const WEAPON_BIG_ICON_MANIFEST = [
  'big_axe.png',
  'big_club.png',
  'big_glove.png',
  'big_gun.png',
  'big_knife.png',
  'big_ring.png',
  'big_scarf.png',
  'big_shoe.png',
  'big_spear.png',
  'big_sword.png',
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
    frameTop: 'assets/frame/frame_top.png',
    frameMiddle: 'assets/frame/frame_middle.png',
    frameBottom: 'assets/frame/frame_bottom.png',
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
    portrait: { x: 90, y: 86, w: 40, h: 48 },
    name: { centerX: 112, y: 55 },
    title: { x: 205, y: 42 },
    desc: { x: 205, y: 75, maxWidth: 343, lineHeight: 33, maxLines: 3 },
  },

  skills: {
    order: ['brawn', 'finesse', 'intellect', 'perception', 'charm'],
    startY: 179, rowH: 38,
    heartX: [203, 225, 247], heartW: 20, heartH: 20,
  },

  equip: {
    weaponBig: { x: 291, y: 167, w: 26, h: 36 }, // the one exception size
    rows: {
      weapon: { iconX: 330, iconY: 177, textY: 179 },
      armor: { iconX: 330, iconY: 209, textY: 211 },
      trinket: { iconX: 330, iconY: 241, textY: 243 },
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
    startY: 663, fixedRowH: 42,
    nameX: 32, percentRightX: 549,
    descX: 31, descDy: 32, descMaxWidth: 501, descLineHeight: 24, descLineGap: 2,
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
const STORE_KEY = 'pixelCharSheet_v1';
const LEGACY_STORE_KEY = 'pixelCharSheets_v2';
function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
    const legacyRaw = localStorage.getItem(LEGACY_STORE_KEY);
    if (legacyRaw) {
      const legacyState = JSON.parse(legacyRaw);
      return legacyState.characters[legacyState.activeIndex] || demoCharacter();
    }
  } catch (e) { /* corrupt storage, fall through */ }
  return demoCharacter();
}
function saveState() { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }

let state = loadState();
function activeChar() { return state; }

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
function wrapLines(str, maxWidth) {
  if (!str || !String(str).trim()) return [];
  const lines = [];
  for (const paragraph of String(str).split(/\r?\n/)) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    let cur = '';
    for (const word of words) {
      const test = cur ? cur + ' ' + word : word;
      if (ctx.measureText(test).width > maxWidth && cur) { lines.push(cur); cur = word; }
      else cur = test;
    }
    lines.push(cur);
  }
  return lines;
}
function drawWrappedLines(lines, x, y, lineHeight, color, laterLineOffset = 0) {
  ctx.fillStyle = color; ctx.textAlign = 'left';
  lines.forEach((line, i) => ctx.fillText(line, x, y - 7 + i * lineHeight + (i > 0 ? laterLineOffset : 0)));
}
function wrapText(str, x, y, maxWidth, lineHeight, maxLines, color, laterLineOffset = 0) {
  drawWrappedLines(wrapLines(str, maxWidth).slice(0, maxLines), x, y, lineHeight, color, laterLineOffset);
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
  const p = new Set([
    LAYOUT.assets.frameTop,
    LAYOUT.assets.frameMiddle,
    LAYOUT.assets.frameBottom,
    LAYOUT.assets.heartFull,
    LAYOUT.assets.heartEmpty,
    LAYOUT.assets.guts,
  ]);
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

  setFont();
  const frameTop = imgCache.get(LAYOUT.assets.frameTop);
  const frameMiddle = imgCache.get(LAYOUT.assets.frameMiddle);
  const frameBottom = imgCache.get(LAYOUT.assets.frameBottom);
  const sp = LAYOUT.spells;
  const populatedSpells = c.spells
    .map((spell) => ({
      spell,
      descriptionLines: wrapLines(spell.description, sp.descMaxWidth),
    }))
    .filter(({ spell }) =>
      [spell.name, spell.percent, spell.description].some((value) => String(value ?? '').trim())
    );
  const spellRowsHeight = populatedSpells.reduce((height, { descriptionLines }) =>
    height + sp.fixedRowH + descriptionLines.length * (sp.descLineHeight + sp.descLineGap), 0);
  const topHeight = frameTop?.height ?? 654;
  const middleHeight = spellRowsHeight;
  const bottomHeight = frameBottom?.height ?? 30;
  canvas.height = topHeight + middleHeight + bottomHeight;

  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (frameTop) ctx.drawImage(frameTop, 0, 0);
  if (frameMiddle) {
    for (let y = topHeight; y < topHeight + middleHeight; y += frameMiddle.height) {
      const sliceHeight = Math.min(frameMiddle.height, topHeight + middleHeight - y);
      ctx.drawImage(frameMiddle, 0, 0, frameMiddle.width, sliceHeight, 0, y, canvas.width, sliceHeight);
    }
  }
  if (frameBottom) ctx.drawImage(frameBottom, 0, topHeight + middleHeight);

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
    text(c.equip.weapon.name || '(Weapon)', eq.textX, eq.rows.weapon.textY, c.equip.weapon.name ? white : gray);
    drawIcon(c.equip.armor.icon, eq.rows.armor.iconX, eq.rows.armor.iconY, eq.iconW, eq.iconH);
    text(c.equip.armor.name || '(Armor)', eq.textX, eq.rows.armor.textY, c.equip.armor.name ? white : gray);
    drawIcon(c.equip.trinket.icon, eq.rows.trinket.iconX, eq.rows.trinket.iconY, eq.iconW, eq.iconH);
    text(c.equip.trinket.name || '(Trinket)', eq.textX, eq.rows.trinket.textY, c.equip.trinket.name ? white : gray);

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
  let spellY = sp.startY;
  populatedSpells.forEach(({ spell, descriptionLines }) => {
    const y = spellY;
    const rowHeight = sp.fixedRowH + descriptionLines.length * (sp.descLineHeight + sp.descLineGap);
    text(spell.name, sp.nameX, y, white);
    textRight(spell.percent, sp.percentRightX, y, white);
    drawWrappedLines(descriptionLines, sp.descX, y + sp.descDy, sp.descLineHeight, gray, sp.descLineGap);
    spellY += rowHeight;
  });
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
  h.appendChild(makeField('Name', c.name, (v) => { c.name = v; scheduleRender(); }));
  h.appendChild(makeField('Title / level line', c.title, (v) => { c.title = v; scheduleRender(); }));
  h.appendChild(makeField('Description (wraps, up to 3 lines)', c.description, (v) => { c.description = v; scheduleRender(); }, { textarea: true }));
  h.appendChild(makeIconPicker('Portrait icon', c.portraitIcon, (v) => { c.portraitIcon = v; scheduleRender(); }, CHARACTER_ICON_DIR, CHARACTER_ICON_MANIFEST));

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
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'spell-remove';
    remove.textContent = 'Remove spell';
    remove.addEventListener('click', () => {
      c.spells.splice(i, 1);
      buildForm();
      scheduleRender();
    });
    sp.appendChild(remove);
  });
  const addSpell = document.createElement('button');
  addSpell.type = 'button';
  addSpell.className = 'spell-add';
  addSpell.textContent = '+ Add spell';
  addSpell.addEventListener('click', () => {
    c.spells.push({ name: '', percent: '', description: '' });
    buildForm();
  });
  sp.appendChild(addSpell);
}

/* ============================================================
   CHARACTER JSON IMPORT + EXPORT
   ============================================================ */
function downloadFile(contents, filename, type) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function characterJson() {
  const character = activeChar();
  const documentData = {
    format: 'pixel-character-sheet',
    version: 1,
    character,
  };
  return JSON.stringify(documentData, null, 2);
}

function normalizeImportedCharacter(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('The JSON must contain a character object.');
  }
  if (data.format !== undefined) {
    if (data.format !== 'pixel-character-sheet' || data.version !== 1) {
      throw new Error('This character sheet JSON format is not supported.');
    }
    data = data.character;
  } else if (!['name', 'title', 'skills', 'equip', 'items', 'stats', 'spells', 'description']
    .some((key) => Object.hasOwn(data, key))) {
    throw new Error('No character sheet data was found in this JSON.');
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('The JSON must contain a character object.');
  }

  const asText = (value) => typeof value === 'string' || typeof value === 'number' ? String(value) : '';
  const source = data;
  const character = blankCharacter(asText(source.name) || 'New Character');
  character.title = asText(source.title);
  character.description = asText(source.description);
  character.portraitIcon = asText(source.portraitIcon);

  if (source.skills && typeof source.skills === 'object') {
    LAYOUT.skills.order.forEach((key) => {
      character.skills[key] = Math.max(0, Math.min(3, parseInt(source.skills[key], 10) || 0));
    });
  }
  if (source.equip && typeof source.equip === 'object') {
    ['weapon', 'armor', 'trinket'].forEach((key) => {
      const entry = source.equip[key];
      if (!entry || typeof entry !== 'object') return;
      character.equip[key].icon = asText(entry.icon);
      character.equip[key].name = asText(entry.name);
      if (key === 'weapon') character.equip.weapon.bigIcon = asText(entry.bigIcon);
    });
  }
  if (Array.isArray(source.items)) {
    character.items = character.items.map((item, index) => {
      const entry = source.items[index];
      return entry && typeof entry === 'object'
        ? { icon: asText(entry.icon), name: asText(entry.name) }
        : item;
    });
  }
  if (source.stats && typeof source.stats === 'object') {
    ['attack', 'defense', 'magic', 'speed'].forEach((key) => {
      const entry = source.stats[key];
      if (!entry || typeof entry !== 'object') return;
      if (key === 'attack') character.stats.attack.icon = asText(entry.icon);
      character.stats[key].value = asText(entry.value);
    });
    if (Array.isArray(source.stats.custom)) {
      character.stats.custom = character.stats.custom.map((entry, index) => {
        const custom = source.stats.custom[index];
        return custom && typeof custom === 'object'
          ? { icon: asText(custom.icon), label: asText(custom.label), value: asText(custom.value) }
          : entry;
      });
    }
    character.stats.guts = Math.max(0, parseInt(source.stats.guts, 10) || 0);
  }
  if (Array.isArray(source.spells)) {
    character.spells = source.spells
      .filter((spell) => spell && typeof spell === 'object' && !Array.isArray(spell))
      .map((spell) => ({
        name: asText(spell.name),
        percent: asText(spell.percent),
        description: asText(spell.description),
      }));
  }
  return character;
}

el('generateJson').onclick = () => {
  el('sheetJson').value = characterJson();
  el('jsonStatus').textContent = 'JSON generated. Copy it from the text field.';
};
el('copyJson').onclick = async () => {
  const field = el('sheetJson');
  const json = characterJson();
  field.value = json;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(json);
    } else {
      field.focus();
      field.select();
      if (!document.execCommand('copy')) throw new Error('Clipboard unavailable');
    }
    el('jsonStatus').textContent = 'JSON copied to clipboard.';
  } catch (error) {
    field.focus();
    field.select();
    el('jsonStatus').textContent = 'Clipboard unavailable. JSON is selected for copying.';
  }
};
el('loadJson').onclick = () => {
  const status = el('jsonStatus');
  try {
    const imported = normalizeImportedCharacter(JSON.parse(el('sheetJson').value));
    state = imported;
    buildForm();
    scheduleRender();
    status.textContent = `Imported ${imported.name}.`;
  } catch (error) {
    status.textContent = `Import failed: ${error.message}`;
  }
};
el('download').onclick = () => {
  canvas.toBlob((blob) => {
    downloadFile(blob, `${(activeChar().name || 'character').replace(/\s+/g, '_')}.png`, 'image/png');
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
  await discoverIcons(CHARACTER_ICON_DIR, CHARACTER_ICON_MANIFEST);
  await discoverIcons(WEAPON_BIG_ICON_DIR, WEAPON_BIG_ICON_MANIFEST);
  buildForm();
  await render();
})();
