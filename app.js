/* ---------- 1. Assets ----------
   Put your pixel art here. If a file is missing, the renderer falls back
   to a plain rectangle so you can keep working before the art exists. */
const ASSETS = {
  frame:    'assets/frame.png',    // full-canvas border/background, 320x180
  portrait: 'assets/portrait.png', // fallback shown if a character has no `portrait` of its own
};

function loadImage(src){
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null); // missing file -> null, we draw a fallback instead
    img.src = src;
  });
}

/* ---------- 2. Data ----------
   Everything about your characters lives in one array, saved to
   localStorage so it survives closing the tab. Add fields here (e.g.
   `notes`, `inventory`) and then read them in render() below. */
const STORE_KEY = 'pixelSheets';

function loadState(){
  try{
    const raw = localStorage.getItem(STORE_KEY);
    if(raw) return JSON.parse(raw);
  }catch(e){ /* ignore corrupt storage */ }
  return {
    activeIndex: 0,
    characters: [ blankCharacter('Your Character') ]
  };
}
function saveState(){ localStorage.setItem(STORE_KEY, JSON.stringify(state)); }

function blankCharacter(name){
  return {
    name: name || 'New Character',
    subtitle: '',
    portrait: '', // optional per-character image path, e.g. 'assets/aria.png'
    hp: { current: 10, max: 10 },
    stats: [ { label: 'STR', value: '10' }, { label: 'AGI', value: '10' } ],
  };
}

let state = loadState();
let assetImages = {};

function activeChar(){ return state.characters[state.activeIndex]; }

/* ---------- 3. Canvas rendering ----------
   Native resolution is 320x180 on purpose: keep it low and let CSS scale
   it up (see style.css `image-rendering:pixelated`) so everything stays
   crisp instead of blurry. */
const canvas = document.getElementById('sheet');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

function render(){
  const c = activeChar();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // -- background / frame --
  if(assetImages.frame){
    ctx.drawImage(assetImages.frame, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = '#2b2320';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#7a6a52';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
  }

  // -- portrait (per-character image, else the shared fallback, else a box) --
  const portraitImg = assetImages.perCharacter[c.portrait] || assetImages.portrait;
  const px = 10, py = 10, pw = 56, ph = 56;
  if(portraitImg){
    ctx.drawImage(portraitImg, px, py, pw, ph);
  } else {
    ctx.fillStyle = '#44403a';
    ctx.fillRect(px, py, pw, ph);
    ctx.fillStyle = '#c9c3b2';
    ctx.font = '20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText((c.name[0] || '?').toUpperCase(), px + pw / 2, py + ph / 2 + 7);
    ctx.textAlign = 'left';
  }

  // -- name / subtitle --
  const textX = px + pw + 10;
  ctx.fillStyle = '#f2ede0';
  ctx.font = 'bold 13px monospace';
  ctx.fillText(c.name || 'Unnamed', textX, py + 12);
  ctx.fillStyle = '#b8b0a0';
  ctx.font = '10px monospace';
  ctx.fillText(c.subtitle || '', textX, py + 26);

  // -- HP bar: 10 blocky segments, color shifts with percentage --
  const barX = textX, barY = py + 36, barW = 150, segments = 10, gap = 1;
  const pct = c.hp.max > 0 ? Math.max(0, Math.min(1, c.hp.current / c.hp.max)) : 0;
  const filled = Math.round(pct * segments);
  const segW = (barW - gap * (segments - 1)) / segments;
  const hpColor = pct > 0.5 ? '#6fae5c' : pct > 0.25 ? '#c9a23f' : '#b1503f';
  for(let i = 0; i < segments; i++){
    ctx.fillStyle = i < filled ? hpColor : '#33302b';
    ctx.fillRect(barX + i * (segW + gap), barY, segW, 8);
  }
  ctx.fillStyle = '#b8b0a0';
  ctx.font = '9px monospace';
  ctx.fillText(`${c.hp.current}/${c.hp.max}`, barX + barW + 6, barY + 7);

  // -- stats --
  let sy = barY + 20;
  ctx.font = '10px monospace';
  c.stats.forEach((s) => {
    ctx.fillStyle = '#9a9284';
    ctx.fillText(`${s.label || '—'}`, textX, sy);
    ctx.fillStyle = '#f2ede0';
    ctx.fillText(`${s.value || ''}`, textX + 60, sy);
    sy += 13;
  });
}

/* ---------- 4. Export ----------
   Renders at a higher resolution than the live preview so the PNG you
   post to Discord isn't a tiny 320x180 image. Change EXPORT_SCALE if you
   want it bigger or smaller. */
const EXPORT_SCALE = 3;
function downloadPNG(){
  const out = document.createElement('canvas');
  out.width = canvas.width * EXPORT_SCALE;
  out.height = canvas.height * EXPORT_SCALE;
  const octx = out.getContext('2d');
  octx.imageSmoothingEnabled = false;
  octx.drawImage(canvas, 0, 0, out.width, out.height);
  out.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${(activeChar().name || 'character').replace(/\s+/g, '_')}.png`;
    a.click();
  });
}

/* ---------- 5. UI wiring ---------- */
const el = (id) => document.getElementById(id);

function renderCharSelect(){
  const sel = el('charSelect');
  sel.innerHTML = '';
  state.characters.forEach((c, i) => {
    const opt = document.createElement('option');
    opt.value = i; opt.textContent = c.name || 'Unnamed';
    sel.appendChild(opt);
  });
  sel.value = state.activeIndex;
}

function renderStatsList(){
  const box = el('statsList');
  box.innerHTML = '';
  activeChar().stats.forEach((s, i) => {
    const row = document.createElement('div');
    row.className = 'stat-row';
    row.innerHTML = `
      <input data-i="${i}" data-f="label" value="${s.label}" placeholder="Label">
      <input data-i="${i}" data-f="value" value="${s.value}" placeholder="Value">
      <button data-i="${i}" class="del-stat">×</button>`;
    box.appendChild(row);
  });
}

function fillForm(){
  const c = activeChar();
  el('f-name').value = c.name;
  el('f-subtitle').value = c.subtitle;
  el('f-hpCur').value = c.hp.current;
  el('f-hpMax').value = c.hp.max;
  renderStatsList();
}

function refreshAll(){
  renderCharSelect();
  fillForm();
  render();
  saveState();
}

el('f-name').oninput = (e) => { activeChar().name = e.target.value; renderCharSelect(); render(); saveState(); };
el('f-subtitle').oninput = (e) => { activeChar().subtitle = e.target.value; render(); saveState(); };
el('f-hpCur').oninput = (e) => { activeChar().hp.current = parseInt(e.target.value) || 0; render(); saveState(); };
el('f-hpMax').oninput = (e) => { activeChar().hp.max = parseInt(e.target.value) || 0; render(); saveState(); };

el('statsList').oninput = (e) => {
  const i = e.target.dataset.i, f = e.target.dataset.f;
  if(i === undefined) return;
  activeChar().stats[i][f] = e.target.value;
  render(); saveState();
};
el('statsList').onclick = (e) => {
  if(!e.target.classList.contains('del-stat')) return;
  activeChar().stats.splice(e.target.dataset.i, 1);
  renderStatsList(); render(); saveState();
};
el('addStat').onclick = () => {
  activeChar().stats.push({ label: '', value: '' });
  renderStatsList(); render(); saveState();
};

el('charSelect').onchange = (e) => { state.activeIndex = parseInt(e.target.value); refreshAll(); };
el('addChar').onclick = () => {
  state.characters.push(blankCharacter());
  state.activeIndex = state.characters.length - 1;
  refreshAll();
};
el('delChar').onclick = () => {
  if(state.characters.length <= 1) return;
  state.characters.splice(state.activeIndex, 1);
  state.activeIndex = 0;
  refreshAll();
};
el('download').onclick = downloadPNG;

/* ---------- 6. Boot ---------- */
(async function init(){
  const [frame, portrait] = await Promise.all([loadImage(ASSETS.frame), loadImage(ASSETS.portrait)]);
  assetImages = { frame, portrait, perCharacter: {} };

  // Preload any per-character portraits that are actually set.
  await Promise.all(state.characters.map(async (c) => {
    if(c.portrait) assetImages.perCharacter[c.portrait] = await loadImage(c.portrait);
  }));

  refreshAll();
})();
