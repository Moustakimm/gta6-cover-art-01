// Cover Bay cover renderer: draws a multi-panel GTA-poster-style cover on a
// canvas. Every panel is a photo the user placed, cropped and positioned;
// the title block, sun, palms and colour grade are drawn by hand here.
// No Rockstar logo, artwork or font is used anywhere: the lettering is
// plain bold system sans with a hand-drawn outline and shadow.
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

/** Draws one photo into a panel rect, cover-fit, with zoom, pan and flip. */
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
  const px = rect.x + (rect.w - pw) / 2 + (panel.panX || 0) * rect.w * 0.01;
  const py = rect.y + (rect.h - ph) / 2 + (panel.panY || 0) * rect.h * 0.01;
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

/** Fits the title to the width, then draws it in the chosen lettering style. */
export function drawTitleBlock(ctx, state, w, h, grade) {
  const title = (state.title || '').trim().toUpperCase();
  const subtitle = (state.subtitle || '').trim();
  if (!title && !subtitle) return;
  const bandH = h * 0.20;
  const bandY = h - bandH - Math.max(8, h * 0.012);
  ctx.save();
  // Slanted banner behind the lettering.
  ctx.fillStyle = 'rgba(10,6,20,0.82)';
  ctx.beginPath();
  const skew = w * 0.02;
  ctx.moveTo(skew, bandY);
  ctx.lineTo(w - skew, bandY);
  ctx.lineTo(w - skew * 2, bandY + bandH);
  ctx.lineTo(0, bandY + bandH);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = grade.accent;
  ctx.fillRect(0, bandY, w, Math.max(4, h * 0.006));
  if (title) {
    let size = bandH * 0.52;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const fit = () => {
      ctx.font = `900 ${size}px system-ui, sans-serif`;
      return ctx.measureText(title).width <= w * 0.92;
    };
    while (!fit() && size > 16) size -= 2;
    ctx.font = `900 ${size}px system-ui, sans-serif`;
    const cx = w / 2;
    const cy = subtitle ? bandY + bandH * 0.40 : bandY + bandH * 0.52;
    ctx.lineJoin = 'round';
    ctx.lineWidth = size * 0.14;
    ctx.strokeStyle = '#12081f';
    ctx.strokeText(title, cx, cy);
    if (state.titleStyle === 'neon') {
      ctx.shadowColor = grade.accent;
      ctx.shadowBlur = size * 0.45;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(title, cx, cy);
      ctx.shadowBlur = 0;
    } else if (state.titleStyle === 'sunset') {
      const grad = ctx.createLinearGradient(0, cy - size / 2, 0, cy + size / 2);
      grad.addColorStop(0, '#fff7ae');
      grad.addColorStop(0.55, grade.sun);
      grad.addColorStop(1, grade.accent);
      ctx.fillStyle = grad;
      ctx.fillText(title, cx, cy);
    } else {
      ctx.shadowColor = grade.accent;
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = size * 0.07;
      ctx.shadowOffsetY = size * 0.07;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(title, cx, cy);
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }
  }
  if (subtitle) {
    const size = Math.max(14, bandH * 0.20);
    ctx.font = `700 ${size}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffe9f2';
    ctx.fillText(subtitle.toUpperCase(), w / 2, bandY + bandH * 0.80);
  }
  ctx.restore();
}

/** Draws the whole cover for `state` onto `canvas` at its own pixel size. */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = GRADES[state.grade] || GRADES.sunset;
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
  });
  // Retro sun and palms on the hero (first) panel, above the photos.
  const hero = rects[0];
  const sunR = Math.min(hero.w, hero.h) * 0.16;
  drawRetroSun(ctx, hero.x + hero.w * 0.80, hero.y + hero.h * 0.22, sunR, grade.sun);
  ctx.globalAlpha = 0.9;
  drawPalm(ctx, hero.x + hero.w * 0.06, hero.y + hero.h * 0.98, Math.min(hero.w, hero.h) * 0.36, '#160a24');
  drawPalm(ctx, hero.x + hero.w * 0.90, hero.y + hero.h * 0.98, Math.min(hero.w, hero.h) * 0.30, '#160a24');
  ctx.globalAlpha = 1;
  // Kicker line above the title band.
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
