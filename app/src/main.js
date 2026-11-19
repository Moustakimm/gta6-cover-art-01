// Cover Bay: wires the poster editor. Three photo slots, a layout, a colour
// grade, per-panel caption chips, badges and stickers, and a caption become a
// multi-panel cover on the preview canvas; Export draws the same cover at
// full post size (1080x1080, 1080x1350 or 1920x1080) and downloads it as a
// PNG. A `?shot=` query sets up a fixed scene for a screenshot instead
// (./shots.js).
import { drawCover, panelRects } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const $ = (id) => document.getElementById(id);
const SIZES = { square: [1080, 1080], portrait: [1080, 1350], wide: [1920, 1080] };

const state = {
  layout: 'poster',
  grade: 'sunset',
  titleStyle: 'sunset',
  title: 'Neon Bay',
  subtitle: 'One last score',
  sizeKey: 'wide',
  captions: [
    'Neon Bay — 2:47 AM · one last score',
    'The Pier — midnight · meet me there',
    'Boulevard — golden hour · no way back',
  ],
  badges: { stickers: true, seal: true, wanted: true },
  photos: [null, null, null],
  panels: [
    { photo: 0, zoom: 1.05, panX: 0, panY: 0, flip: false, anchor: 'top' },
    { photo: 1, zoom: 1.15, panX: 0, panY: 0, flip: false, anchor: 'top' },
    { photo: 0, zoom: 1.15, panX: 0, panY: 0, flip: false, anchor: 'top' },
  ],
  selectedPanel: 0,
};

/** One-click looks: layout + grade + lettering that go together. */
const PRESETS = {
  'Sunset classic': { layout: 'poster', grade: 'sunset', titleStyle: 'sunset' },
  'Neon night': { layout: 'trio', grade: 'neon', titleStyle: 'neon' },
  'Midnight heist': { layout: 'duo', grade: 'midnight', titleStyle: 'block' },
  'Palm getaway': { layout: 'mosaic', grade: 'palm', titleStyle: 'sunset' },
};

function panelCount() {
  return state.layout === 'single' ? 1 : 3;
}

function redraw() {
  const [w, h] = SIZES[state.sizeKey];
  canvas.width = w;
  canvas.height = h;
  drawCover(canvas, state);
  syncPanelControls();
}

/** Keeps the per-panel sliders and readouts in step with the selected panel. */
function syncPanelControls() {
  const panel = state.panels[state.selectedPanel];
  if (!panel) return;
  $('panelLabel').textContent = `Panel ${state.selectedPanel + 1} of ${panelCount()}`;
  $('panelPhoto').value = String(panel.photo);
  $('zoom').value = panel.zoom;
  $('panX').value = panel.panX;
  $('panY').value = panel.panY;
  $('zoomOut').textContent = `${Math.round(panel.zoom * 100)}%`;
  $('panXOut').textContent = `${panel.panX}`;
  $('panYOut').textContent = `${panel.panY}`;
  $('faceSafe').checked = panel.anchor === 'top';
  document.querySelectorAll('.panel-pick').forEach((b) => {
    b.classList.toggle('active', Number(b.dataset.panel) === state.selectedPanel);
  });
}

/** Applies a preset look and mirrors it back into the controls. */
function applyPreset(name) {
  const p = PRESETS[name];
  if (!p) return;
  state.layout = p.layout;
  state.grade = p.grade;
  state.titleStyle = p.titleStyle;
  state.selectedPanel = 0;
  document.querySelector(`input[name="layout"][value="${p.layout}"]`).checked = true;
  $('grade').value = p.grade;
  $('titleStyle').value = p.titleStyle;
  status.textContent = `Preset applied: ${name}.`;
  redraw();
}

/** Loads an image from a URL, resolving to the image once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function loadSlot(slot, url, label) {
  state.photos[slot] = await loadImage(url);
  $(`slot${slot + 1}Name`).textContent = label;
  redraw();
}

async function loadSamples() {
  await loadSlot(0, 'samples/boulevard.jpg', 'boulevard.jpg');
  await loadSlot(1, 'samples/pier.jpg', 'pier.jpg');
  status.textContent = 'Sample photos loaded — swap them for your own below.';
}

// Photo slots: each file input fills one slot, and every panel picks a slot.
[0, 1, 2].forEach((slot) => {
  $(`photo${slot + 1}`).addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    await loadSlot(slot, URL.createObjectURL(file), file.name);
    status.textContent = `Photo ${slot + 1} loaded: ${file.name}`;
  });
});
$('loadSamples').addEventListener('click', loadSamples);

// Layout, grade, lettering and size.
document.querySelectorAll('input[name="layout"]').forEach((r) => {
  r.addEventListener('change', () => { state.layout = r.value; state.selectedPanel = 0; redraw(); });
});
$('grade').addEventListener('change', (e) => { state.grade = e.target.value; redraw(); });
$('titleStyle').addEventListener('change', (e) => { state.titleStyle = e.target.value; redraw(); });
$('size').addEventListener('change', (e) => { state.sizeKey = e.target.value; redraw(); });
$('title').addEventListener('input', (e) => { state.title = e.target.value; redraw(); });
$('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; redraw(); });

// Look presets.
document.querySelectorAll('.preset').forEach((b) => {
  b.addEventListener('click', () => applyPreset(b.dataset.preset));
});

// Per-panel caption chips: "PLACE — time · hook".
[0, 1, 2].forEach((i) => {
  $(`caption${i + 1}`).addEventListener('input', (e) => {
    state.captions[i] = e.target.value;
    redraw();
  });
});

// Badges and stickers toggles.
$('badgeStickers').addEventListener('change', (e) => { state.badges.stickers = e.target.checked; redraw(); });
$('badgeSeal').addEventListener('change', (e) => { state.badges.seal = e.target.checked; redraw(); });
$('badgeWanted').addEventListener('change', (e) => { state.badges.wanted = e.target.checked; redraw(); });

// Per-panel editing: click a panel on the preview, or use the picker buttons.
document.querySelectorAll('.panel-pick').forEach((b) => {
  b.addEventListener('click', () => { state.selectedPanel = Number(b.dataset.panel); syncPanelControls(); });
});
canvas.addEventListener('click', (e) => {
  const box = canvas.getBoundingClientRect();
  const x = (e.clientX - box.left) / box.width * canvas.width;
  const y = (e.clientY - box.top) / box.height * canvas.height;
  const rects = panelRects(state.layout, canvas.width, canvas.height);
  const hit = rects.findIndex((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
  if (hit >= 0) { state.selectedPanel = hit; syncPanelControls(); }
});
$('panelPhoto').addEventListener('change', (e) => {
  state.panels[state.selectedPanel].photo = Number(e.target.value);
  redraw();
});
$('zoom').addEventListener('input', (e) => { state.panels[state.selectedPanel].zoom = Number(e.target.value); redraw(); });
$('panX').addEventListener('input', (e) => { state.panels[state.selectedPanel].panX = Number(e.target.value); redraw(); });
$('panY').addEventListener('input', (e) => { state.panels[state.selectedPanel].panY = Number(e.target.value); redraw(); });
$('flip').addEventListener('click', () => {
  const panel = state.panels[state.selectedPanel];
  panel.flip = !panel.flip;
  redraw();
});
$('faceSafe').addEventListener('change', (e) => {
  state.panels[state.selectedPanel].anchor = e.target.checked ? 'top' : 'center';
  redraw();
});
$('resetPanel').addEventListener('click', () => {
  const i = state.selectedPanel;
  state.panels[i] = { photo: i === 1 ? 1 : 0, zoom: i === 0 ? 1.05 : 1.15, panX: 0, panY: 0, flip: false, anchor: 'top' };
  status.textContent = `Panel ${i + 1} reset to its default crop.`;
  redraw();
});

/** Exports the cover at full size as a PNG download. */
export function exportCover() {
  const [w, h] = SIZES[state.sizeKey];
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  drawCover(off, state);
  return new Promise((resolve) => {
    off.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `cover-bay-${w}x${h}.png`;
      a.click();
      status.textContent = `Saved cover-bay-${w}x${h}.png`;
      resolve(blob);
    }, 'image/png');
  });
}
$('export').addEventListener('click', exportCover);

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), async (scene) => {
    state.layout = scene.layout;
    state.grade = scene.grade;
    state.titleStyle = scene.titleStyle;
    state.title = scene.title;
    state.subtitle = scene.subtitle;
    $('title').value = scene.title;
    $('subtitle').value = scene.subtitle;
    document.querySelector(`input[name="layout"][value="${scene.layout}"]`).checked = true;
    $('grade').value = scene.grade;
    $('titleStyle').value = scene.titleStyle;
    const sizeKey = Object.keys(SIZES).find((k) => SIZES[k][0] === scene.width && SIZES[k][1] === scene.height) || 'wide';
    state.sizeKey = sizeKey;
    $('size').value = sizeKey;
    state.photos[0] = await loadImage(`samples/${scene.photo}.jpg`);
    state.photos[1] = await loadImage(`samples/${scene.photo2}.jpg`);
    $('slot1Name').textContent = `${scene.photo}.jpg`;
    $('slot2Name').textContent = `${scene.photo2}.jpg`;
    redraw();
  });
} else {
  loadSamples().then(() => { status.textContent = 'Sample photos loaded — swap them for your own.'; });
}
