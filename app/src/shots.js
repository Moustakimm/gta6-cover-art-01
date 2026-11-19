// Fixed scenes for screenshots: ?shot=editor shows the page with sample photos
// loaded; ?shot=cover shows one exported cover alone, full-bleed.
// Query: layout, grade, style, size (WxH), title, subtitle, photo, photo2.
// window.__shotReady is set once the cover is painted.
export async function runShot(shot, query, setup) {
  const size = (query.get('size') || '1920x1080').split('x');
  const state = {
    layout: query.get('layout') || 'poster',
    grade: query.get('grade') || 'sunset',
    titleStyle: query.get('style') || 'block',
    title: query.get('title') || 'Neon Bay',
    subtitle: query.get('subtitle') || 'One last score',
    width: Number(size[0]) || 1920,
    height: Number(size[1]) || 1080,
    photo: query.get('photo') || 'boulevard',
    photo2: query.get('photo2') || 'pier',
  };
  if (shot === 'cover') document.body.classList.add('shot-cover');
  await setup(state);
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
