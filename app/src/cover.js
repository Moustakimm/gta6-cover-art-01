// Cover Bay cover renderer: draws a multi-panel GTA-poster-style cover on a
// canvas. Every panel is a photo the user placed, cropped and positioned;
// the title block, sun, palms, caption chips, stickers, gold seal and colour
// grade are drawn by hand here. No Rockstar logo, artwork or font is used
// anywhere: the lettering is plain bold system sans with a hand-drawn outline
// and shadow, and the "script" subtitle is an italic serif.
const GRADES = {
  sunset: { skyTop: '#2b1055', skyMid: '#ff7e5f', skyBot: '#feb47b', tint: 'rgba(255,110,80,0.28)', sun: '#ffd166', accent: '#ff5e8a', frame: '#fff3e0' },
  neon: { skyTop: '#0d0221', skyMid: '#7b2ff7', skyBot: '#ff2fb3', tint: 'rgba(255,47,179,0.22)', sun: '#00f0ff', accent: '#00f0ff', frame: '#e0fbff' },
  midnight: { skyTop: '#050914', skyMid: '#1b2a6b', skyBot: '#c94b7c', tint: 'rgba(80,90,220,0.25)', sun: '#f4f1de', accent: '#8ecae6', frame: '#dbe7ff' },
  palm: { skyTop: '#013a3a', skyMid: '#0f7b6c', skyBot: '#f9c74f', tint: 'rgba(20,180,140,0.20)', sun: '#ffe066', accent: '#f9c74f', frame: '#fff8d6' },
};

/** Panel rectangles for a layout, in canvas pixels, with white gutters. */
export function panelRects(layout, w, h) {
  const g = Math.max(6, Math.round(w * 0.008));
  if (layout === 'trio') {
    const pw = (w - g * 4) / 3;
    return [0, 1, 2].map((i) => ({ x: g + i * (pw + g), y: g, w: pw, h: h - g * 2 }));
  }
  if (layout === 'duo') {
    const lw = (w - g * 3) * 0.62;
    const rw = w - g * 3 - lw;
    const rh = (h - g * 3) / 2;
    return [
      { x: g, y: g, w: lw, h: h - g * 2 },
      { x: g * 2 + lw, y: g, w: rw, h: rh },
      { x: g * 2 + lw, y: g * 2 + rh, w: rw, h: rh },
    ];
  }
  if (layout === 'hero-left') {
    const lw = (w - g * 3) * 0.62;
    const rw = w - g * 3 - lw;
    const rh = (h - g * 3) / 2;
    return [
      { x: g, y: g, w: lw, h: h - g * 2 },
      { x: g * 2 + lw, y: g, w: rw, h: rh },
      { x: g * 2 + lw, y: g * 2 + rh, w: rw, h: rh },
    ];
  }
  if (layout === 'strip') {
    const innerH = h - g * 4;
    const h1 = innerH * 0.5;
    const h2 = innerH * 0.25;
    const h3 = innerH - h1 - h2;
    return [
      { x: g, y: g, w: w - g * 2, h: h1 },
      { x: g, y: g * 2 + h1, w: w - g * 2, h: h2 },
      { x: g, y: g * 3 + h1 + h2, w: w - g * 2, h: h3 },
    ];
  }
  if (layout === 'mosaic') {
    const topH = (h - g * 3) * 0.62;
    const botH = h - g * 3 - topH;
    const lw = (w - g * 3) * 0.62;
    const rw = w - g * 3 - lw;
    return [
      { x: g, y: g, w: lw, h: topH },
      { x: g * 2 + lw, y: g, w: rw, h: topH },
      { x: g, y: g * 2 + topH, w: w - g * 2, h: botH },
    ];
  }
  if (layout === 'single') return [{ x: g, y: g, w: w - g * 2, h: h - g * 2 }];
  // poster: one wide hero on top, two panels below.
  const heroH = (h - g * 3) * 0.62;
  const botH = h - g * 3 - heroH;
  const bw = (w - g * 3) / 2;
  return [
    { x: g, y: g, w: w - g * 2, h: heroH },
    { x: g, y: g * 2 + heroH, w: bw, h: botH },
    { x: g * 2 + bw, y: g * 2 + heroH, w: bw, h: botH },
  ];
}

/** Rounded-rectangle path (a pill when r is half the height). */
function pillPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.arcTo(x + w, y, x + w, y + rr, rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
  ctx.lineTo(x + rr, y + h);
  ctx.arcTo(x, y + h, x, y + h - rr, rr);
  ctx.lineTo(x, y + rr);
  ctx.arcTo(x, y, x + rr, y, rr);
  ctx.closePath();
}

/** Starburst path: `spikes` points, outer and inner radius. */
function starburstPath(ctx, cx, cy, spikes, outer, inner) {
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI * i) / spikes - Math.PI / 2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

/** Draws one photo into a panel rect, cover-fit, with zoom, pan and flip.
 * `panel.anchor` is 'top' (face-safe: the crop keeps the top of the photo,
 * where the head is, instead of centring it) or 'center'. */
export function drawPhotoPanel(ctx, photo, rect, panel) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (!photo) {
    const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
    grad.addColorStop(0, '#3a2b4d');
    grad.addColorStop(1, '#1c1226');
    ctx.fillStyle = grad;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = `600 ${Math.max(14, rect.w * 0.045)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('ADD A PHOTO', rect.x + rect.w / 2, rect.y + rect.h / 2);
    ctx.restore();
    return;
  }
  const base = Math.max(rect.w / photo.naturalWidth, rect.h / photo.naturalHeight);
  const scale = base * (panel.zoom || 1);
  const pw = photo.naturalWidth * scale;
  const ph = photo.naturalHeight * scale;
  // Clamp so the photo always covers the panel, whatever the anchor.
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const minPx = rect.x + rect.w - pw;
  const minPy = rect.y + rect.h - ph;
  const cx = rect.x + (rect.w - pw) / 2 + (panel.panX || 0) * rect.w * 0.01;
  const cyTop = rect.y + (panel.panY || 0) * rect.h * 0.01;
  const cyCenter = rect.y + (rect.h - ph) / 2 + (panel.panY || 0) * rect.h * 0.01;
  const px = clamp(cx, minPx, rect.x);
  const py = clamp(panel.anchor === 'top' ? cyTop : cyCenter, minPy, rect.y);
  if (panel.flip) {
    ctx.translate(rect.x + rect.w / 2, 0);
    ctx.scale(-1, 1);
    ctx.translate(-(rect.x + rect.w / 2), 0);
  }
  ctx.drawImage(photo, px, py, pw, ph);
  ctx.restore();
}

/** Retro striped sun: painted on its own layer so the slits cut the sun only,
 * never the photo underneath, then stamped onto the cover. */
export function drawRetroSun(ctx, cx, cy, r, colour) {
  const layer = document.createElement('canvas');
  layer.width = Math.ceil(r * 2) + 4;
  layer.height = Math.ceil(r * 2) + 4;
  const g = layer.getContext('2d');
  g.fillStyle = colour;
  g.beginPath();
  g.arc(layer.width / 2, layer.height / 2, r, 0, Math.PI * 2);
  g.fill();
  g.globalCompositeOperation = 'destination-out';
  const gap = r * 0.16;
  for (let i = 0; i < 4; i++) {
    const y = layer.height / 2 + r * 0.05 + i * gap;
    g.fillRect(0, y, layer.width, gap * 0.45);
  }
  ctx.drawImage(layer, cx - layer.width / 2, cy - layer.height / 2);
}

/** A simple palm silhouette: a curved trunk and a fan of fronds that arc
 * out from the crown and droop down, like a palm seen against the sunset. */
export function drawPalm(ctx, x, y, s, colour) {
  ctx.save();
  ctx.strokeStyle = colour;
  ctx.fillStyle = colour;
  ctx.lineWidth = Math.max(2, s * 0.05);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + s * 0.06, y - s * 0.55, x + s * 0.22, y - s * 0.92);
  ctx.stroke();
  const topX = x + s * 0.22;
  const topY = y - s * 0.92;
  // Each frond: [control dx, control dy, end dx, end dy] in units of s.
  // Controls reach up and out; ends droop back down past the crown.
  const fronds = [
    [-0.62, -0.30, -0.78, 0.28],
    [-0.48, -0.52, -0.55, 0.05],
    [-0.18, -0.60, -0.22, -0.18],
    [0.14, -0.58, 0.24, -0.14],
    [0.44, -0.48, 0.58, 0.08],
    [0.62, -0.26, 0.80, 0.32],
  ];
  for (const [cx, cy, ex, ey] of fronds) {
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(topX + cx * s, topY + cy * s, topX + ex * s, topY + ey * s);
    ctx.stroke();
  }
  ctx.restore();
}

/** One per-panel caption chip: "PLACE — time · hook", the place in the grade
 * accent, the rest white, on a dark pill with an accent rim. */
export function drawChip(ctx, rect, caption, grade) {
  if (!caption || !caption.trim()) return;
  const text = caption.trim().toUpperCase();
  const pad = Math.max(10, rect.w * 0.015);
  const maxW = rect.w * 0.92;
  let size = Math.max(13, Math.min(rect.w * 0.032, rect.h * 0.085, 40));
  const measure = (font) => {
    ctx.font = font;
    return ctx.measureText(text).width;
  };
  while (size > 12 && measure(`800 ${size}px system-ui, sans-serif`) + pad * 2 > maxW) size -= 1;
  const font = `800 ${size}px system-ui, sans-serif`;
  const tw = measure(font);
  const chipH = size * 1.9;
  const chipW = tw + pad * 2;
  const x = rect.x + Math.max(8, rect.w * 0.02);
  const y = rect.y + rect.h - chipH - Math.max(8, rect.h * 0.04);
  ctx.save();
  pillPath(ctx, x, y, chipW, chipH, chipH / 2);
  ctx.fillStyle = 'rgba(12,7,20,0.88)';
  ctx.fill();
  ctx.strokeStyle = grade.accent;
  ctx.lineWidth = Math.max(2, size * 0.09);
  ctx.stroke();
  // Split the place from the rest at the em dash so it can be accent-coloured.
  const dash = text.indexOf('—');
  const place = dash >= 0 ? text.slice(0, dash).trim() : text;
  const rest = dash >= 0 ? text.slice(dash).trim() : '';
  ctx.font = font;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const cy = y + chipH / 2 + size * 0.04;
  let tx = x + pad;
  ctx.fillStyle = grade.accent;
  ctx.fillText(place, tx, cy);
  if (rest) {
    tx += ctx.measureText(place).width;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(' ' + rest, tx, cy);
  }
  ctx.restore();
}

/** One sticker: a starburst or a pill, slightly rotated, with short text. */
export function drawSticker(ctx, x, y, s, text, fill, ink, rotate, kind) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotate);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let size = s * 0.34;
  const fit = (maxW) => {
    ctx.font = `900 ${size}px system-ui, sans-serif`;
    return ctx.measureText(text).width <= maxW;
  };
  if (kind === 'burst') {
    while (!fit(s * 1.15) && size > 8) size -= 1;
    starburstPath(ctx, 0, 0, 12, s, s * 0.86);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = 'rgba(18,8,31,0.85)';
    ctx.lineWidth = Math.max(2, s * 0.04);
    ctx.stroke();
    ctx.font = `900 ${size}px system-ui, sans-serif`;
    ctx.fillStyle = ink;
    ctx.fillText(text, 0, size * 0.05);
  } else {
    while (!fit(s * 2.4) && size > 8) size -= 1;
    const w = ctx.measureText(text).width + s * 0.55;
    const h = size * 2.1;
    pillPath(ctx, -w / 2, -h / 2, w, h, h / 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = 'rgba(18,8,31,0.7)';
    ctx.lineWidth = Math.max(2, s * 0.04);
    ctx.stroke();
    ctx.font = `900 ${size}px system-ui, sans-serif`;
    ctx.fillStyle = ink;
    ctx.fillText(text, 0, size * 0.05);
  }
  ctx.restore();
}

/** Gold seal: a scalloped gold disc with a star and "EST. 2026". */
export function drawGoldSeal(ctx, x, y, r) {
  ctx.save();
  const grad = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
  grad.addColorStop(0, '#ffe98a');
  grad.addColorStop(0.5, '#f9c74f');
  grad.addColorStop(1, '#b8860b');
  starburstPath(ctx, x, y, 18, r, r * 0.94);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = '#8a5a00';
  ctx.lineWidth = Math.max(2, r * 0.04);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, r * 0.78, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(138,90,0,0.8)';
  ctx.lineWidth = Math.max(1.5, r * 0.03);
  ctx.stroke();
  ctx.fillStyle = '#5a3a00';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${r * 0.62}px system-ui, sans-serif`;
  ctx.fillText('★', x, y - r * 0.14);
  ctx.font = `800 ${r * 0.20}px system-ui, sans-serif`;
  ctx.fillText('EST. 2026', x, y + r * 0.42);
  ctx.restore();
}

/** "WANTED ★★★★★" pill, top right. */
export function drawWantedPill(ctx, w, h) {
  const text = 'WANTED ★★★★★';
  let size = Math.max(14, w * 0.017);
  ctx.save();
  ctx.font = `900 ${size}px system-ui, sans-serif`;
  const tw = ctx.measureText(text).width;
  const pad = size * 0.9;
  const chipH = size * 2.0;
  const chipW = tw + pad * 2;
  const x = w - chipW - Math.max(10, w * 0.02);
  const y = Math.max(10, h * 0.035);
  pillPath(ctx, x, y, chipW, chipH, chipH / 2);
  ctx.fillStyle = '#4d0812';
  ctx.fill();
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = Math.max(2, size * 0.1);
  ctx.stroke();
  ctx.font = `900 ${size}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffd166';
  ctx.fillText(text, x + chipW / 2, y + chipH / 2 + size * 0.04);
  ctx.restore();
}

/** The sticker set: six badges scattered around the cover's edges, clear of
 * the title band in the middle. Positions are fractions of the cover size. */
export function drawStickers(ctx, w, h, grade) {
  const u = Math.min(w, h);
  const stickers = [
    { fx: 0.055, fy: 0.16, s: u * 0.055, text: '★ 5 STARS', kind: 'burst', fill: '#ffd166', ink: '#3a2200', rot: -0.12 },
    { fx: 0.945, fy: 0.17, s: u * 0.05, text: 'NEW!', kind: 'burst', fill: '#ff5e8a', ink: '#ffffff', rot: 0.14 },
    { fx: 0.055, fy: 0.44, s: u * 0.042, text: 'VICE CITY', kind: 'pill', fill: '#0d0221', ink: '#00f0ff', rot: -0.06 },
    { fx: 0.945, fy: 0.46, s: u * 0.042, text: '100% ORIGINAL', kind: 'pill', fill: '#fff3e0', ink: '#160a24', rot: 0.07 },
    { fx: 0.13, fy: 0.87, s: u * 0.048, text: 'NO WAY BACK', kind: 'pill', fill: '#ff5e8a', ink: '#ffffff', rot: -0.05 },
    { fx: 0.5, fy: 0.10, s: u * 0.04, text: 'GTA-STYLE', kind: 'pill', fill: '#ffd166', ink: '#3a2200', rot: 0.03 },
  ];
  for (const s of stickers) {
    drawSticker(ctx, s.fx * w, s.fy * h, s.s, s.text, s.fill, s.ink, s.rot, s.kind);
  }
}

/** The title, slashed huge across the art: a gradient (or neon, or block)
 * title, tilted a few degrees, overlapping the panels, with a pink script
 * subtitle and a flourish underneath. */
export function drawTitleBlock(ctx, state, w, h, grade) {
  const title = (state.title || '').trim().toUpperCase();
  const subtitle = (state.subtitle || '').trim();
  if (!title && !subtitle) return;
  ctx.save();
  ctx.translate(w / 2, h * 0.73);
  ctx.rotate(-0.06);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (title) {
    let size = h * 0.17;
    const fit = () => {
      ctx.font = `900 ${size}px system-ui, sans-serif`;
      return ctx.measureText(title).width <= w * 0.94;
    };
    while (!fit() && size > 16) size -= 2;
    ctx.font = `900 ${size}px system-ui, sans-serif`;
    const cy = subtitle ? -size * 0.28 : 0;
    ctx.lineJoin = 'round';
    ctx.lineWidth = size * 0.13;
    ctx.strokeStyle = '#12081f';
    ctx.strokeText(title, 0, cy);
    if (state.titleStyle === 'neon') {
      ctx.shadowColor = grade.accent;
      ctx.shadowBlur = size * 0.45;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(title, 0, cy);
      ctx.shadowBlur = 0;
    } else if (state.titleStyle === 'sunset') {
      const grad = ctx.createLinearGradient(0, cy - size / 2, 0, cy + size / 2);
      grad.addColorStop(0, '#fff7ae');
      grad.addColorStop(0.55, grade.sun);
      grad.addColorStop(1, grade.accent);
      ctx.fillStyle = grad;
      ctx.fillText(title, 0, cy);
    } else {
      ctx.shadowColor = grade.accent;
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = size * 0.07;
      ctx.shadowOffsetY = size * 0.07;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(title, 0, cy);
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }
  }
  if (subtitle) {
    const size = Math.max(16, h * 0.042);
    ctx.font = `italic 700 ${size}px Georgia, 'Times New Roman', serif`;
    ctx.fillStyle = '#ff8fb3';
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 8;
    const sy = title ? size * 2.4 : 0;
    ctx.fillText(subtitle, 0, sy);
    ctx.shadowBlur = 0;
    // Flourish: a short gradient line under the subtitle.
    const sw = ctx.measureText(subtitle).width;
    const fy = sy + size * 1.0;
    const fg = ctx.createLinearGradient(-sw / 2, fy, sw / 2, fy);
    fg.addColorStop(0, 'rgba(255,143,179,0)');
    fg.addColorStop(0.5, '#ff8fb3');
    fg.addColorStop(1, 'rgba(255,143,179,0)');
    ctx.fillStyle = fg;
    ctx.fillRect(-sw / 2, fy - size * 0.06, sw, size * 0.12);
  }
  ctx.restore();
}

/** Draws the whole cover for `state` onto `canvas` at its own pixel size. */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = GRADES[state.grade] || GRADES.sunset;
  const captions = state.captions || [];
  const badges = state.badges || { stickers: true, seal: true, wanted: true };
  const rects = panelRects(state.layout, w, h);
  // White poster frame, then the sky gradient behind the panels.
  ctx.fillStyle = grade.frame;
  ctx.fillRect(0, 0, w, h);
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, grade.skyTop);
  sky.addColorStop(0.55, grade.skyMid);
  sky.addColorStop(1, grade.skyBot);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  rects.forEach((rect, i) => {
    const panel = state.panels[i] || { photo: 0, zoom: 1, panX: 0, panY: 0, flip: false };
    drawPhotoPanel(ctx, state.photos[panel.photo] || null, rect, panel);
    // Warm grade wash over each photo, stronger at the bottom.
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    const wash = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
    wash.addColorStop(0, 'rgba(255,120,90,0)');
    wash.addColorStop(1, grade.tint);
    ctx.fillStyle = wash;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
    // Per-panel caption chip at the panel's bottom edge.
    drawChip(ctx, rect, captions[i], grade);
  });
  // Retro sun and palms on the hero (first) panel, above the photos.
  const hero = rects[0];
  const sunR = Math.min(hero.w, hero.h) * 0.16;
  drawRetroSun(ctx, hero.x + hero.w * 0.80, hero.y + hero.h * 0.22, sunR, grade.sun);
  ctx.globalAlpha = 0.9;
  drawPalm(ctx, hero.x + hero.w * 0.06, hero.y + hero.h * 0.98, Math.min(hero.w, hero.h) * 0.36, '#160a24');
  drawPalm(ctx, hero.x + hero.w * 0.90, hero.y + hero.h * 0.98, Math.min(hero.w, hero.h) * 0.30, '#160a24');
  ctx.globalAlpha = 1;
  // Badges and stickers, then the kicker, then the big slashed title.
  if (badges.stickers) drawStickers(ctx, w, h, grade);
  if (badges.seal) drawGoldSeal(ctx, w * 0.93, h * 0.90, Math.min(w, h) * 0.055);
  if (badges.wanted) drawWantedPill(ctx, w, h);
  // Kicker line at the top left.
  ctx.save();
  ctx.font = `800 ${Math.max(13, w * 0.016)}px system-ui, sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 6;
  ctx.fillText('★  SUNSET CITY  ★', w * 0.03, h * 0.045);
  ctx.restore();
  drawTitleBlock(ctx, state, w, h, grade);
  // Thin outer frame.
  ctx.strokeStyle = grade.frame;
  ctx.lineWidth = Math.max(4, w * 0.006);
  ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, w - ctx.lineWidth, h - ctx.lineWidth);
}
