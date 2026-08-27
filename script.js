'use strict';

/* ============================== DATA ============================== */

const templates = [
  { id: 'classic',    name: 'Classic 2×2',     photos: 4, cols: 2, rows: 2, cellAspect: 4 / 3 },
  { id: 'vertical',   name: 'Vertical Strip',  photos: 4, cols: 1, rows: 4, cellAspect: 4 / 3 },
  { id: 'wide',       name: 'Wide Layout',     photos: 2, cols: 1, rows: 2, cellAspect: 16 / 9 },
  { id: 'sixcut',     name: 'Six-Cut',         photos: 6, cols: 2, rows: 3, cellAspect: 4 / 3 },
  { id: 'horizontal', name: 'Horizontal Strip', photos: 3, cols: 3, rows: 1, cellAspect: 3 / 4 },
  { id: 'grid9',      name: 'Grid 3×3',        photos: 9, cols: 3, rows: 3, cellAspect: 1 },
  { id: 'single',     name: 'Single Shot',     photos: 1, cols: 1, rows: 1, cellAspect: 3 / 4 },
];

const filters = [
  { id: 'normal',       name: 'Normal',          css: 'none' },
  { id: 'bw',            name: 'Black & White',   css: 'grayscale(100%)' },
  { id: 'vintage',       name: 'Vintage',         css: 'sepia(55%) contrast(90%) brightness(95%) saturate(120%)' },
  { id: 'sepia',         name: 'Sepia',           css: 'sepia(100%)' },
  { id: 'bright',        name: 'Bright',          css: 'brightness(125%) saturate(110%)' },
  { id: 'cool',          name: 'Cool Tone',       css: 'hue-rotate(150deg) saturate(115%)' },
  { id: 'warm',          name: 'Warm Tone',       css: 'hue-rotate(-20deg) saturate(130%) brightness(105%)' },
  { id: 'retro',         name: 'Retro',           css: 'contrast(115%) saturate(140%) sepia(25%) hue-rotate(-8deg)' },
  { id: 'dreamy',        name: 'Dreamy',          css: 'brightness(112%) contrast(88%) saturate(85%) blur(1px)' },
  { id: 'highcontrast',  name: 'High Contrast',   css: 'contrast(175%) saturate(115%)' },
];

const frames = [
  { id: 'birthday',    name: 'Birthday',    color: '#ff5f8f', bg: '#fff7fb', corner: '🎈', confetti: true },
  { id: 'wedding',      name: 'Wedding',      color: '#c9a95c', bg: '#fffdf7', corner: '💍', double: true },
  { id: 'graduation',   name: 'Graduation',   color: '#1f3a5f', bg: '#f5f8fc', corner: '🎓' },
  { id: 'christmas',    name: 'Christmas',    color: '#c0392b', bg: '#f7fff9', corner: '🎄', dashed: true, altColor: '#2e7d32' },
  { id: 'valentines',   name: "Valentine's",  color: '#e0457b', bg: '#fff5f8', corner: '💖' },
  { id: 'kawaii',       name: 'Kawaii',       color: '#ffb6d9', bg: '#fff8fd', corner: '⭐' },
  { id: 'minimalist',   name: 'Minimalist',   color: '#222222', bg: '#ffffff', corner: '' },
  { id: 'neon',         name: 'Neon',         color: '#20e3ff', bg: '#0a0a12', corner: '', altColor: '#ff2fd0', glow: true },
  { id: 'floral',       name: 'Floral',       color: '#5c8a4a', bg: '#f6fbf2', corner: '🌸' },
  { id: 'travel',       name: 'Travel',       color: '#2f7a8c', bg: '#f2fbfc', corner: '✈️', dashed: true },
];

const stickerGroups = [
  { name: 'Hearts',   items: ['❤️', '💕', '💖', '💗'] },
  { name: 'Stars',    items: ['⭐', '🌟', '✨'] },
  { name: 'Emojis',   items: ['😂', '😍', '😎', '🥳', '😜'] },
  { name: 'Glasses',  items: ['🕶️'] },
  { name: 'Hats',     items: ['🎩', '👒'] },
  { name: 'Speech',   items: ['💬', '🗨️'] },
];

const countdownOptions = [3, 5, 10];

const captureModes = [
  { id: 'auto',   name: 'Automatic', icon: '⏱️', desc: 'Shots advance on their own' },
  { id: 'manual', name: 'Manual',    icon: '🖱️', desc: 'Click when ready, then countdown' },
];

/* Base strip geometry constants (export resolution, px) */
const BASE_W = 1200;
const PADDING = 48;
const GAP = 24;
const FOOTER_H = 140;

/* Photo zoom limits (multiplier on top of the cover-fit base scale) */
const ZOOM_MIN = 1;
const ZOOM_MAX = 3.5;

/* ============================== STATE ============================== */

const state = {
  templateId: 'classic',
  filterId: 'normal',
  frameId: 'minimalist',
  countdown: 3,
  captureMode: 'auto',
  captureSessionId: 0,    // bumped on each new/cancelled capture run to invalidate stale in-flight loops
  stream: null,
  facingMode: 'user',
  capturedCanvases: [],   // raw per-shot canvases (full mirrored frame, filter baked in)
  photos: [],             // per-photo transform state for the editor stage
  frameBgCanvas: null,
  frameFgCanvas: null,
  stageW: BASE_W,
  stageH: BASE_W,
  items: [],              // stickers/text: {id, type, x, y, fontSize, emoji|text, color}
  selectedId: null,
  itemSeq: 0,
};

/* ============================== DOM REFS ============================== */

const el = (id) => document.getElementById(id);

const dom = {
  templateList: el('template-list'),
  filterList: el('filter-list'),
  frameList: el('frame-list'),
  modeList: el('mode-list'),
  countdownList: el('countdown-list'),
  setupError: el('setup-error'),
  btnStart: el('btn-start'),

  screens: {
    setup: el('screen-setup'),
    camera: el('screen-camera'),
    editor: el('screen-editor'),
  },

  video: el('video'),
  cameraStage: el('camera-stage'),
  countdownOverlay: el('countdown-overlay'),
  countdownNumber: el('countdown-number'),
  flashOverlay: el('flash-overlay'),
  shotProgress: el('shot-progress'),
  btnSwitchCamera: el('btn-switch-camera'),
  cameraFilterStrip: el('camera-filter-strip'),
  filterScrollLeft: el('filter-scroll-left'),
  filterScrollRight: el('filter-scroll-right'),
  thumbnailStrip: el('thumbnail-strip'),
  btnTakePhoto: el('btn-take-photo'),
  btnCancelSession: el('btn-cancel-session'),

  stickerTray: el('sticker-tray'),
  textInput: el('text-input'),
  textColor: el('text-color'),
  textSize: el('text-size'),
  btnAddText: el('btn-add-text'),
  stageWrap: el('stage-wrap'),
  stageScaler: el('stage-scaler'),
  stage: el('stage'),
  btnRetake: el('btn-retake'),
  btnDownloadPng: el('btn-download-png'),
  btnDownloadJpg: el('btn-download-jpg'),
  btnNewSession: el('btn-new-session'),
};

/* ============================== SETUP SCREEN ============================== */

function renderLayoutPreview(t) {
  const cells = t.cols * t.rows;
  const wrap = document.createElement('div');
  wrap.className = 'layout-preview';
  wrap.style.gridTemplateColumns = `repeat(${t.cols}, 1fr)`;
  wrap.style.gridTemplateRows = `repeat(${t.rows}, 1fr)`;
  for (let i = 0; i < cells; i++) wrap.appendChild(document.createElement('span'));
  return wrap;
}

function renderOptionCards(container, items, groupKey, opts = {}) {
  container.innerHTML = '';
  items.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'option-card';
    card.dataset.id = item.id != null ? item.id : item;
    if (opts.render) {
      opts.render(card, item);
    } else {
      card.textContent = item;
    }
    card.addEventListener('click', () => selectOption(container, groupKey, card.dataset.id));
    container.appendChild(card);
  });
}

function selectOption(container, groupKey, id) {
  [...container.children].forEach((c) => c.classList.toggle('selected', c.dataset.id === String(id)));
  if (groupKey === 'countdown') {
    state.countdown = Number(id);
  } else {
    state[groupKey] = id;
  }
}

function initSetupScreen() {
  renderOptionCards(dom.templateList, templates, 'templateId', {
    render: (card, t) => {
      card.appendChild(renderLayoutPreview(t));
      const name = document.createElement('span');
      name.className = 'card-name';
      name.textContent = t.name;
      const sub = document.createElement('span');
      sub.className = 'card-sub';
      sub.textContent = `${t.photos} photo${t.photos === 1 ? '' : 's'}`;
      card.append(name, sub);
    },
  });

  renderOptionCards(dom.filterList, filters, 'filterId', {
    render: (card, f) => {
      const swatch = document.createElement('div');
      swatch.className = 'filter-swatch';
      swatch.style.filter = f.css;
      const name = document.createElement('span');
      name.className = 'card-name';
      name.textContent = f.name;
      card.append(swatch, name);
    },
  });

  renderOptionCards(dom.frameList, frames, 'frameId', {
    render: (card, f) => {
      const icon = document.createElement('span');
      icon.className = 'card-icon';
      icon.textContent = f.corner || '▢';
      const name = document.createElement('span');
      name.className = 'card-name';
      name.textContent = f.name;
      card.append(icon, name);
    },
  });

  renderOptionCards(dom.modeList, captureModes, 'captureMode', {
    render: (card, m) => {
      const icon = document.createElement('span');
      icon.className = 'card-icon';
      icon.textContent = m.icon;
      const name = document.createElement('span');
      name.className = 'card-name';
      name.textContent = m.name;
      const sub = document.createElement('span');
      sub.className = 'card-sub';
      sub.textContent = m.desc;
      card.append(icon, name, sub);
    },
  });

  renderOptionCards(dom.countdownList, countdownOptions, 'countdown', {
    render: (card, secs) => {
      const name = document.createElement('span');
      name.className = 'card-name';
      name.textContent = `${secs}s`;
      card.append(name);
    },
  });

  selectOption(dom.templateList, 'templateId', state.templateId);
  selectOption(dom.filterList, 'filterId', state.filterId);
  selectOption(dom.frameList, 'frameId', state.frameId);
  selectOption(dom.modeList, 'captureMode', state.captureMode);
  selectOption(dom.countdownList, 'countdown', state.countdown);

  dom.btnStart.addEventListener('click', startSession);
}

function getSelectedTemplate() { return templates.find((t) => t.id === state.templateId); }
function getSelectedFilter() { return filters.find((f) => f.id === state.filterId); }
function getSelectedFrame() { return frames.find((f) => f.id === state.frameId); }

/* ============================== SCREEN SWITCHING ============================== */

function showScreen(name) {
  Object.entries(dom.screens).forEach(([key, section]) => {
    section.classList.toggle('active', key === name);
  });
}

/* ============================== CAMERA + CAPTURE ============================== */

function setSetupError(msg) {
  dom.setupError.hidden = !msg;
  dom.setupError.textContent = msg || '';
}

async function startSession() {
  setSetupError('');

  if (!window.isSecureContext) {
    setSetupError('Camera access requires HTTPS or http://localhost. Please run this app from a local server.');
    return;
  }
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    setSetupError('Your browser does not support camera access.');
    return;
  }

  computeStageDimensions();
  resetSessionData();

  dom.btnStart.disabled = true;
  try {
    await openCamera();
  } catch (err) {
    setSetupError('Could not access the camera: ' + err.message);
    dom.btnStart.disabled = false;
    return;
  }
  dom.btnStart.disabled = false;

  showScreen('camera');
  await checkMultiCamera();
  renderCameraFilterStrip();
  runCaptureSequence();
}

async function openCamera() {
  stopCameraStream();
  const constraints = { video: { facingMode: state.facingMode, width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false };
  state.stream = await navigator.mediaDevices.getUserMedia(constraints);
  dom.video.srcObject = state.stream;
  dom.video.style.filter = getSelectedFilter().css;
  await dom.video.play().catch(() => {});
}

function stopCameraStream() {
  if (state.stream) {
    state.stream.getTracks().forEach((t) => t.stop());
    state.stream = null;
  }
}

async function checkMultiCamera() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cams = devices.filter((d) => d.kind === 'videoinput');
    dom.btnSwitchCamera.hidden = cams.length < 2;
  } catch {
    dom.btnSwitchCamera.hidden = true;
  }
}

dom.btnSwitchCamera.addEventListener('click', async () => {
  state.facingMode = state.facingMode === 'user' ? 'environment' : 'user';
  try {
    await openCamera();
    renderCameraFilterStrip(); // rebind filter thumbnails to the new stream
  } catch (err) { console.warn(err); }
});

dom.btnCancelSession.addEventListener('click', () => {
  state.captureSessionId++; // invalidate the in-flight capture loop
  stopCameraStream();
  resetSessionData();
  showScreen('setup');
});

function renderCameraFilterStrip() {
  dom.cameraFilterStrip.innerHTML = '';
  filters.forEach((f) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'filter-chip' + (f.id === state.filterId ? ' selected' : '');

    // a live preview of the actual camera feed with this filter applied,
    // so users can see what it looks like before picking it
    const preview = document.createElement('video');
    preview.className = 'filter-chip-preview';
    preview.muted = true;
    preview.playsInline = true;
    preview.autoplay = true;
    preview.style.filter = f.css;
    if (state.stream) {
      preview.srcObject = state.stream;
      preview.play().catch(() => {});
    }

    const label = document.createElement('span');
    label.className = 'filter-chip-label';
    label.textContent = f.name;

    chip.append(preview, label);
    chip.addEventListener('click', () => {
      state.filterId = f.id;
      dom.video.style.filter = f.css;
      [...dom.cameraFilterStrip.children].forEach((c) => c.classList.remove('selected'));
      chip.classList.add('selected');
    });
    dom.cameraFilterStrip.appendChild(chip);
  });
  updateFilterScrollButtons();
}

function updateFilterScrollButtons() {
  const el = dom.cameraFilterStrip;
  const maxScroll = el.scrollWidth - el.clientWidth;
  dom.filterScrollLeft.disabled = el.scrollLeft <= 1;
  dom.filterScrollRight.disabled = el.scrollLeft >= maxScroll - 1;
}

dom.cameraFilterStrip.addEventListener('scroll', updateFilterScrollButtons);
dom.filterScrollLeft.addEventListener('click', () => {
  dom.cameraFilterStrip.scrollBy({ left: -160, behavior: 'smooth' });
});
dom.filterScrollRight.addEventListener('click', () => {
  dom.cameraFilterStrip.scrollBy({ left: 160, behavior: 'smooth' });
});

function computeStageDimensions() {
  const t = getSelectedTemplate();
  const cellW = (BASE_W - PADDING * 2 - GAP * (t.cols - 1)) / t.cols;
  const cellH = cellW / t.cellAspect;
  const photosH = t.rows * cellH + (t.rows - 1) * GAP;
  state.stageW = BASE_W;
  state.stageH = Math.round(PADDING * 2 + photosH + FOOTER_H);
  state._cellW = cellW;
  state._cellH = cellH;
}

function getCellRects(t) {
  const rects = [];
  for (let i = 0; i < t.photos; i++) {
    const col = i % t.cols, row = Math.floor(i / t.cols);
    rects.push({
      x: PADDING + col * (state._cellW + GAP),
      y: PADDING + row * (state._cellH + GAP),
      w: state._cellW,
      h: state._cellH,
    });
  }
  return rects;
}

function resetSessionData() {
  state.capturedCanvases = [];
  state.photos = [];
  state.frameBgCanvas = null;
  state.frameFgCanvas = null;
  state.items = [];
  state.selectedId = null;
  dom.thumbnailStrip.innerHTML = '';
  dom.stage.innerHTML = '';
}

/* -- audio blips (no assets needed) -- */
let audioCtx = null;
function beep(freq, duration, type = 'sine', gain = 0.15) {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = gain;
    osc.connect(g).connect(audioCtx.destination);
    osc.start();
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  } catch { /* audio not available, ignore */ }
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function runCountdown(seconds) {
  dom.countdownOverlay.hidden = false;
  for (let s = seconds; s >= 1; s--) {
    dom.countdownNumber.textContent = s;
    dom.countdownNumber.style.animation = 'none';
    void dom.countdownNumber.offsetWidth;
    dom.countdownNumber.style.animation = '';
    beep(880, 0.12);
    await sleep(1000);
  }
  dom.countdownOverlay.hidden = true;
}

function waitForManualTrigger() {
  return new Promise((resolve) => {
    const handler = () => {
      dom.btnTakePhoto.removeEventListener('click', handler);
      resolve();
    };
    dom.btnTakePhoto.addEventListener('click', handler);
  });
}

function flashAndShutter() {
  dom.flashOverlay.classList.remove('flash');
  void dom.flashOverlay.offsetWidth;
  dom.flashOverlay.classList.add('flash');
  beep(1400, 0.15, 'triangle', 0.2);
}

function captureFullFrame(video, filterCss) {
  const vw = video.videoWidth, vh = video.videoHeight;
  const outW = 1000;
  const outH = Math.round(outW * (vh / vw));
  const c = document.createElement('canvas');
  c.width = outW; c.height = outH;
  const ctx = c.getContext('2d');
  ctx.filter = filterCss;
  ctx.save();
  ctx.translate(outW, 0);
  ctx.scale(-1, 1); // mirror for natural selfie look
  ctx.drawImage(video, 0, 0, vw, vh, 0, 0, outW, outH);
  ctx.restore();
  return c;
}

function updateShotProgress(current, total) {
  dom.shotProgress.textContent = `Photo ${current} of ${total}`;
}

async function runCaptureSequence() {
  // Cancel/Retake don't (and can't cleanly) abort an in-flight async loop mid-await.
  // Each call claims a session id; after every await we check it's still current
  // before touching shared state, so a superseded run becomes an inert no-op
  // instead of pushing extra photos into whatever session is running now.
  const mySession = ++state.captureSessionId;
  const t = getSelectedTemplate();
  const manual = state.captureMode === 'manual';
  updateShotProgress(0, t.photos);
  dom.btnTakePhoto.hidden = !manual;

  try {
    for (let i = 0; i < t.photos; i++) {
      if (mySession !== state.captureSessionId) return;
      updateShotProgress(i + 1, t.photos);
      if (manual) {
        dom.btnTakePhoto.disabled = false;
        await waitForManualTrigger();
        if (mySession !== state.captureSessionId) return;
        dom.btnTakePhoto.disabled = true;
      }
      await runCountdown(state.countdown);
      if (mySession !== state.captureSessionId) return;
      flashAndShutter();
      const shot = captureFullFrame(dom.video, getSelectedFilter().css);
      state.capturedCanvases.push(shot);
      addThumbnail(shot);
      await sleep(350);
    }

    if (mySession !== state.captureSessionId) return;
    dom.btnTakePhoto.hidden = true;
    dom.btnTakePhoto.disabled = false;
    stopCameraStream();
    setupEditorLayers();
    enterEditor();
  } catch (err) {
    if (mySession !== state.captureSessionId) return;
    console.error('Capture sequence failed:', err);
    dom.btnTakePhoto.hidden = true;
    dom.btnTakePhoto.disabled = false;
    dom.countdownOverlay.hidden = true;
    stopCameraStream();
    showScreen('setup');
    setSetupError('Something went wrong while putting your photo strip together (' + (err && err.message ? err.message : err) + '). Please try again — if it keeps happening, let me know this exact message.');
  }
}

function addThumbnail(canvas) {
  const img = document.createElement('img');
  img.src = canvas.toDataURL('image/jpeg', 0.85);
  dom.thumbnailStrip.appendChild(img);
}

/* ============================== EDITOR LAYER SETUP ============================== */

function setupEditorLayers() {
  const t = getSelectedTemplate();
  const frame = getSelectedFrame();
  const W = state.stageW, H = state.stageH;

  const bg = document.createElement('canvas');
  bg.width = W; bg.height = H;
  bg.className = 'frame-layer';
  bg.getContext('2d').fillStyle = frame.bg || '#ffffff';
  bg.getContext('2d').fillRect(0, 0, W, H);
  state.frameBgCanvas = bg;

  const fg = document.createElement('canvas');
  fg.width = W; fg.height = H;
  fg.className = 'frame-layer';
  drawFrameDecoration(fg.getContext('2d'), W, H, frame);
  state.frameFgCanvas = fg;

  const rects = getCellRects(t);
  state.photos = state.capturedCanvases.map((canvas, i) => {
    const photo = { id: 'photo-' + i, canvas, cell: rects[i], srcW: canvas.width, srcH: canvas.height, zoom: ZOOM_MIN, left: 0, top: 0 };
    initPhotoTransform(photo);
    return photo;
  });
}

function roundedRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawFrameDecoration(ctx, W, H, frame) {
  ctx.save();

  if (frame.glow) {
    ctx.shadowColor = frame.color;
    ctx.shadowBlur = 24;
    ctx.lineWidth = 6;
    ctx.strokeStyle = frame.color;
    ctx.strokeRect(14, 14, W - 28, H - 28);
    ctx.shadowColor = frame.altColor || frame.color;
    ctx.lineWidth = 3;
    ctx.strokeRect(22, 22, W - 44, H - 44);
  } else if (frame.double) {
    ctx.strokeStyle = frame.color;
    ctx.lineWidth = 5;
    ctx.strokeRect(12, 12, W - 24, H - 24);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(20, 20, W - 40, H - 40);
  } else if (frame.dashed) {
    ctx.strokeStyle = frame.color;
    ctx.lineWidth = 6;
    ctx.setLineDash([16, 10]);
    ctx.strokeRect(14, 14, W - 28, H - 28);
    ctx.setLineDash([]);
  } else {
    ctx.strokeStyle = frame.color;
    ctx.lineWidth = 8;
    ctx.strokeRect(10, 10, W - 20, H - 20);
  }

  if (frame.confetti) {
    const confettiColors = ['#ff5f8f', '#7c5cff', '#ffd23f', '#20e3ff', '#4ade80'];
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * W;
      const y = Math.random() * H;
      ctx.fillStyle = confettiColors[i % confettiColors.length];
      ctx.beginPath();
      ctx.arc(x, y, 3 + Math.random() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (frame.corner) {
    ctx.font = '38px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const pad = 34;
    ctx.fillText(frame.corner, pad, pad);
    ctx.fillText(frame.corner, W - pad, pad);
    ctx.fillText(frame.corner, pad, H - pad);
    ctx.fillText(frame.corner, W - pad, H - pad);
  }

  ctx.restore();
}

/* ============================== PHOTO CELL TRANSFORM (resize / reframe) ============================== */

function totalScale(photo) { return photo.baseScale * photo.zoom; }

function dispSize(photo) {
  const s = totalScale(photo);
  return { w: photo.srcW * s, h: photo.srcH * s };
}

function initPhotoTransform(photo) {
  photo.baseScale = Math.max(photo.cell.w / photo.srcW, photo.cell.h / photo.srcH);
  photo.zoom = ZOOM_MIN;
  applyCenteredPosition(photo);
}

function applyCenteredPosition(photo) {
  const d = dispSize(photo);
  photo.left = (photo.cell.w - d.w) / 2;
  photo.top = (photo.cell.h - d.h) / 2;
}

function clampPhotoPosition(photo) {
  const d = dispSize(photo);
  const { w, h } = photo.cell;
  photo.left = Math.min(0, Math.max(w - d.w, photo.left));
  photo.top = Math.min(0, Math.max(h - d.h, photo.top));
}

function zoomPhoto(photo, direction) {
  const { w, h } = photo.cell;
  const oldScale = totalScale(photo);
  const centerImgX = (w / 2 - photo.left) / oldScale;
  const centerImgY = (h / 2 - photo.top) / oldScale;

  const factor = direction > 0 ? 1.1 : 0.9;
  photo.zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, photo.zoom * factor));

  const newScale = totalScale(photo);
  photo.left = w / 2 - centerImgX * newScale;
  photo.top = h / 2 - centerImgY * newScale;
  clampPhotoPosition(photo);
}

/* ============================== EDITOR ============================== */

function enterEditor() {
  dom.stage.innerHTML = '';
  dom.stage.style.width = state.stageW + 'px';
  dom.stage.style.height = state.stageH + 'px';

  dom.stage.appendChild(state.frameBgCanvas);
  state.photos.forEach((photo) => renderPhotoCell(photo));
  dom.stage.appendChild(state.frameFgCanvas);

  dom.stageScaler.style.width = state.stageW + 'px';
  dom.stageScaler.style.height = state.stageH + 'px';

  showScreen('editor');
  requestAnimationFrame(fitStage);
}

function fitStage() {
  const wrap = dom.stageWrap;
  const availW = wrap.clientWidth - 24;
  const availH = wrap.clientHeight - 24;
  const scale = Math.min(availW / state.stageW, availH / state.stageH, 1);
  state.stageScale = scale;
  dom.stageScaler.style.width = (state.stageW * scale) + 'px';
  dom.stageScaler.style.height = (state.stageH * scale) + 'px';
  dom.stage.style.transform = `scale(${scale})`;
  applyChromeScale();
}
window.addEventListener('resize', () => {
  if (dom.screens.editor.classList.contains('active')) fitStage();
});

/* Keeps small UI chrome (delete/resize/reset buttons) a constant on-screen
   size, counteracting the stage's own scale-down so they stay easy to hit
   even when the composed strip is displayed small. */
function applyChromeScale() {
  const factor = state.stageScale ? 1 / state.stageScale : 1;
  dom.stage.querySelectorAll('.item-delete, .item-resize, .cell-reset').forEach((el) => {
    el.style.transform = `scale(${factor})`;
  });
}

function stageLocalPoint(clientX, clientY) {
  const rect = dom.stage.getBoundingClientRect();
  const scale = rect.width / state.stageW;
  return {
    x: (clientX - rect.left) / scale,
    y: (clientY - rect.top) / scale,
  };
}

function updatePhotoCellDom(canvasEl, photo) {
  const d = dispSize(photo);
  canvasEl.style.left = photo.left + 'px';
  canvasEl.style.top = photo.top + 'px';
  canvasEl.style.width = d.w + 'px';
  canvasEl.style.height = d.h + 'px';
}

function renderPhotoCell(photo) {
  const div = document.createElement('div');
  div.className = 'photo-cell';
  div.dataset.id = photo.id;
  div.style.left = photo.cell.x + 'px';
  div.style.top = photo.cell.y + 'px';
  div.style.width = photo.cell.w + 'px';
  div.style.height = photo.cell.h + 'px';

  const canvasEl = photo.canvas;
  updatePhotoCellDom(canvasEl, photo);
  div.appendChild(canvasEl);

  const reset = document.createElement('button');
  reset.type = 'button';
  reset.className = 'cell-reset';
  reset.title = 'Reset framing';
  reset.textContent = '⟲';
  reset.addEventListener('click', (e) => {
    e.stopPropagation();
    photo.zoom = ZOOM_MIN;
    applyCenteredPosition(photo);
    updatePhotoCellDom(canvasEl, photo);
  });
  div.appendChild(reset);

  attachPhotoCellHandlers(div, canvasEl, photo);
  dom.stage.appendChild(div);
  applyChromeScale();
}

function attachPhotoCellHandlers(div, canvasEl, photo) {
  let dragging = false;
  let start = { x: 0, y: 0 };
  let startLeft = 0, startTop = 0;

  div.addEventListener('pointerdown', (e) => {
    dragging = true;
    div.setPointerCapture(e.pointerId);
    const p = stageLocalPoint(e.clientX, e.clientY);
    start.x = p.x; start.y = p.y;
    startLeft = photo.left; startTop = photo.top;
  });

  div.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const p = stageLocalPoint(e.clientX, e.clientY);
    photo.left = startLeft + (p.x - start.x);
    photo.top = startTop + (p.y - start.y);
    clampPhotoPosition(photo);
    updatePhotoCellDom(canvasEl, photo);
  });

  const endDrag = () => { dragging = false; };
  div.addEventListener('pointerup', endDrag);
  div.addEventListener('pointercancel', endDrag);

  div.addEventListener('wheel', (e) => {
    e.preventDefault();
    zoomPhoto(photo, e.deltaY < 0 ? 1 : -1);
    updatePhotoCellDom(canvasEl, photo);
  }, { passive: false });
}

function renderStickerTray() {
  dom.stickerTray.innerHTML = '';
  stickerGroups.forEach((group) => {
    group.items.forEach((emoji) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sticker-btn';
      btn.textContent = emoji;
      btn.title = group.name;
      btn.addEventListener('click', () => addSticker(emoji));
      dom.stickerTray.appendChild(btn);
    });
  });
}

function addSticker(emoji) {
  const item = {
    id: 'item-' + (state.itemSeq++),
    type: 'sticker',
    emoji,
    x: state.stageW / 2,
    y: state.stageH / 2,
    fontSize: 56,
  };
  state.items.push(item);
  renderItem(item);
  selectItem(item.id);
}

function addTextItem() {
  const text = dom.textInput.value.trim();
  if (!text) return;
  const item = {
    id: 'item-' + (state.itemSeq++),
    type: 'text',
    text,
    color: dom.textColor.value,
    fontSize: Number(dom.textSize.value),
    x: state.stageW / 2,
    y: state.stageH - FOOTER_H / 2,
  };
  state.items.push(item);
  renderItem(item);
  selectItem(item.id);
  dom.textInput.value = '';
}
dom.btnAddText.addEventListener('click', addTextItem);

function renderItem(item) {
  const div = document.createElement('div');
  div.className = 'stage-item ' + (item.type === 'sticker' ? 'sticker-item' : 'text-item');
  div.dataset.id = item.id;
  updateItemDom(div, item);

  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'item-delete';
  del.textContent = '✕';
  del.addEventListener('click', (e) => { e.stopPropagation(); deleteItem(item.id); });
  div.appendChild(del);

  const resizeHandle = document.createElement('div');
  resizeHandle.className = 'item-resize';
  resizeHandle.title = 'Drag to resize';
  attachResizeHandler(resizeHandle, div, item);
  div.appendChild(resizeHandle);

  attachDragHandlers(div, item);
  dom.stage.appendChild(div);
  applyChromeScale();
}

function updateItemDom(div, item) {
  div.style.left = item.x + 'px';
  div.style.top = item.y + 'px';
  div.style.fontSize = item.fontSize + 'px';

  [...div.childNodes].forEach((n) => { if (n.nodeType === 3) n.remove(); });
  div.insertBefore(document.createTextNode(item.type === 'sticker' ? item.emoji : item.text), div.firstChild);

  if (item.type === 'text') div.style.color = item.color;
}

function findItemDom(id) { return dom.stage.querySelector(`.stage-item[data-id="${id}"]`); }

function selectItem(id) {
  state.selectedId = id;
  [...dom.stage.querySelectorAll('.stage-item')].forEach((d) => {
    d.classList.toggle('selected', d.dataset.id === id);
  });
}

function deleteItem(id) {
  state.items = state.items.filter((i) => i.id !== id);
  const d = findItemDom(id);
  if (d) d.remove();
  if (state.selectedId === id) state.selectedId = null;
}

function attachDragHandlers(div, item) {
  let dragging = false;
  let offset = { x: 0, y: 0 };

  div.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    selectItem(item.id);
    dragging = true;
    div.setPointerCapture(e.pointerId);
    const p = stageLocalPoint(e.clientX, e.clientY);
    offset.x = p.x - item.x;
    offset.y = p.y - item.y;
  });

  div.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const p = stageLocalPoint(e.clientX, e.clientY);
    item.x = Math.max(0, Math.min(state.stageW, p.x - offset.x));
    item.y = Math.max(0, Math.min(state.stageH, p.y - offset.y));
    updateItemDom(div, item);
  });

  const endDrag = () => { dragging = false; };
  div.addEventListener('pointerup', endDrag);
  div.addEventListener('pointercancel', endDrag);

  div.addEventListener('wheel', (e) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.92 : 1.08;
    item.fontSize = Math.max(14, Math.min(220, item.fontSize * factor));
    updateItemDom(div, item);
  }, { passive: false });
}

/* Drag-to-resize handle: distance from the item's center controls font
   size, so it works reliably by touch/pointer regardless of how small the
   stage is currently displayed (unlike scroll-to-resize on the item itself). */
function attachResizeHandler(handle, div, item) {
  let resizing = false;
  let startFontSize = item.fontSize;
  let startDist = 1;

  handle.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    selectItem(item.id);
    resizing = true;
    handle.setPointerCapture(e.pointerId);
    const p = stageLocalPoint(e.clientX, e.clientY);
    startFontSize = item.fontSize;
    startDist = Math.max(1, Math.hypot(p.x - item.x, p.y - item.y));
  });

  handle.addEventListener('pointermove', (e) => {
    if (!resizing) return;
    e.stopPropagation();
    const p = stageLocalPoint(e.clientX, e.clientY);
    const dist = Math.hypot(p.x - item.x, p.y - item.y);
    item.fontSize = Math.max(14, Math.min(220, startFontSize * (dist / startDist)));
    updateItemDom(div, item);
  });

  const endResize = (e) => { resizing = false; if (e) e.stopPropagation(); };
  handle.addEventListener('pointerup', endResize);
  handle.addEventListener('pointercancel', endResize);
}

dom.stage.addEventListener('pointerdown', (e) => {
  if (e.target === dom.stage || e.target.classList.contains('frame-layer')) {
    selectItem(null);
  }
});

/* ============================== EXPORT / DOWNLOAD ============================== */

function buildExportCanvas(format) {
  const canvas = document.createElement('canvas');
  canvas.width = state.stageW;
  canvas.height = state.stageH;
  const ctx = canvas.getContext('2d');

  if (format === 'jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(state.frameBgCanvas, 0, 0);

  state.photos.forEach((photo) => {
    const { x, y, w, h } = photo.cell;
    const s = totalScale(photo);
    ctx.save();
    roundedRectPath(ctx, x, y, w, h, 10);
    ctx.clip();
    ctx.drawImage(photo.canvas, x + photo.left, y + photo.top, photo.srcW * s, photo.srcH * s);
    ctx.restore();

    ctx.save();
    roundedRectPath(ctx, x, y, w, h, 10);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.stroke();
    ctx.restore();
  });

  ctx.drawImage(state.frameFgCanvas, 0, 0);

  state.items.forEach((item) => {
    ctx.save();
    ctx.translate(item.x, item.y);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (item.type === 'sticker') {
      ctx.font = `${item.fontSize}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`;
      ctx.fillText(item.emoji, 0, 0);
    } else {
      ctx.font = `600 ${item.fontSize}px "Poppins","Segoe UI",sans-serif`;
      ctx.lineWidth = Math.max(2, item.fontSize * 0.08);
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.strokeText(item.text, 0, 0);
      ctx.fillStyle = item.color;
      ctx.fillText(item.text, 0, 0);
    }
    ctx.restore();
  });

  return canvas;
}

function downloadImage(format) {
  const canvas = buildExportCanvas(format);
  const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const dataUrl = canvas.toDataURL(mime, 0.92);
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `photobooth-${Date.now()}.${format === 'jpeg' ? 'jpg' : 'png'}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

dom.btnDownloadPng.addEventListener('click', () => downloadImage('png'));
dom.btnDownloadJpg.addEventListener('click', () => downloadImage('jpeg'));

/* ============================== RETAKE / NEW SESSION ============================== */

dom.btnRetake.addEventListener('click', async () => {
  resetSessionData();
  showScreen('camera');
  try {
    await openCamera();
    await checkMultiCamera();
    renderCameraFilterStrip();
    runCaptureSequence();
  } catch (err) {
    setSetupError('Could not access the camera: ' + err.message);
    showScreen('setup');
  }
});

dom.btnNewSession.addEventListener('click', () => {
  resetSessionData();
  showScreen('setup');
});

/* ============================== INIT ============================== */

function init() {
  initSetupScreen();
  renderStickerTray();
}

init();
