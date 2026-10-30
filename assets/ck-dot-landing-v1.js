/* ConceptKnot Dot Landing v1: one black/white dot illustration; selected details animate.
   No WebGL, no continuous canvas redraw, and no rasterized full-page animation. */
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const scenePath = './assets/';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const legacy = window.CKLegacyMotion37;
  const state = { host: null, frame: 0, last: 0, time: 0, frames: 0, active: false,
    focus: document.hasFocus(), apples: [], birdHead: null, cloud: null, cloudDots: null,
    lids: null, pupils: null, pecks: 0, lastPeck: -100, peckIndex: -1, birdAngle: 0 };
  const memo = new Map();
  const rng = seed => { let n = seed >>> 0; return () => ((n = (1664525 * n + 1013904223) >>> 0) / 4294967296); };
  const svg = (tag, attrs = {}) => {
    const node = document.createElementNS(NS, tag);
    for (const key of Object.keys(attrs)) node.setAttribute(key, String(attrs[key]));
    return node;
  };
  const part = (parent, tag, attrs) => { const node = svg(tag, attrs); parent.appendChild(node); return node; };
  const addStyle = () => {
    if (document.querySelector('link[data-ck-dot-style]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet'; link.href = scenePath + 'ck-dot-landing-v1.css';
    link.dataset.ckDotStyle = '1'; document.head.appendChild(link);
  };
  function monochromeImage(url, tile, background) {
    if (memo.has(url)) return memo.get(url);
    const promise = new Promise((resolve, reject) => {
      const src = new Image(); src.decoding = 'async';
      src.onload = () => {
        try {
          const w = src.naturalWidth, h = src.naturalHeight;
          if (!w || !h) throw new Error('image has zero dimensions');
          const scratch = document.createElement('canvas'); scratch.width = w; scratch.height = h;
          const input = scratch.getContext('2d', { willReadFrequently: true });
          input.drawImage(src, 0, 0);
          const pixels = input.getImageData(0, 0, w, h).data;
          const output = document.createElement('canvas'); output.width = w; output.height = h;
          const ctx = output.getContext('2d'); ctx.fillStyle = '#111';
          const sample = (x, y) => {
            const index = (Math.min(h - 1, Math.max(0, y)) * w + Math.min(w - 1, Math.max(0, x))) * 4;
            return [pixels[index], pixels[index + 1], pixels[index + 2], pixels[index + 3]];
          };
          for (let y = 0; y < h; y += tile) {
            ctx.beginPath();
            for (let x = 0; x < w; x += tile) {
              const px = x + Math.floor(tile / 2), py = y + Math.floor(tile / 2);
              const [r, g, b, alpha] = sample(px, py);
              if (alpha < 35) continue;
              // Preserve an airy white sky, instead of making the blue photograph a black slab.
              if (background && (py < h * .26 || (py < h * .58 && b > r * 1.13 && b > g * 1.045 && b > 80))) continue;
              const lum = (r * .2126 + g * .7152 + b * .0722) / 255;
              const [nr, ng, nb, na] = sample(px + tile, py + tile);
              const next = (nr * .2126 + ng * .7152 + nb * .0722) / 255;
              const edge = Math.min(1, Math.abs(next - lum) * 2.3);
              let ink = Math.max((1 - lum) * 1.10, edge * .64);
              if (!background && na < 40 && alpha > 150) ink = Math.max(.68, ink);
              if (background && py > h * .56 && g > r * 1.12 && g > b * 1.10) ink *= .36;
              if (ink < .055) continue;
              const radius = Math.min(tile * .48, Math.max(.5, tile * .47 * Math.sqrt(ink)));
              ctx.moveTo(px + radius, py); ctx.arc(px, py, radius, 0, Math.PI * 2);
            }
            ctx.fill();
          }
          resolve(output.toDataURL('image/png'));
          scratch.width = scratch.height = 0; output.width = output.height = 0;
        } catch (error) { reject(error); }
      };
      src.onerror = () => reject(new Error('image failed: ' + url));
      src.src = url;
    });
    memo.set(url, promise);
    return promise;
  }
  function convertAssets() {
    state.host.querySelectorAll('[data-dot-image]').forEach(el => {
      const original = scenePath + el.dataset.dotImage;
      monochromeImage(original, el.dataset.dotImage === 'garden-clean-v37.webp' ? 9 : 4,
        el.dataset.dotImage === 'garden-clean-v37.webp')
        .then(data => { el.src = data; el.classList.add('ck-dot-ready'); })
        .catch(() => { el.src = original; el.classList.add('ck-dot-ready', 'ck-dot-fallback'); });
    });
  }
  function seededCloud() {
    // One connected cumulus silhouette, not three independent cloud illustrations.
    const rand = rng(487196), nodes = [];
    const lobes = [
      [109, 211, 74, 76], [165, 153, 82, 103], [249, 107, 95, 101],
      [353, 104, 105, 106], [449, 153, 87, 88], [503, 210, 70, 62],
      [308, 225, 235, 67]
    ];
    for (let y = 12; y < 282; y += 7) {
      for (let x = 23; x < 580; x += 7) {
        const dx = x + (rand() - .5) * 3, dy = y + (rand() - .5) * 3;
        const inside = lobes.some(l => ((dx - l[0]) / l[2]) ** 2 + ((dy - l[1]) / l[3]) ** 2 < 1);
        if (!inside) continue;
        const shadow = .15 + .63 * (dy / 310) + .18 * (1 - dx / 600) + (rand() - .5) * .25;
        if (rand() > Math.min(.94, shadow + .12)) continue;
        const r = (.5 + rand() * 1.45) * (dy > 225 ? 1.17 : 1);
        nodes.push('M' + dx.toFixed(1) + ' ' + dy.toFixed(1) + 'm' + (-r).toFixed(1) + ' 0a' + r.toFixed(1) + ' ' + r.toFixed(1) + ' 0 1 0 ' + (2 * r).toFixed(1) + ' 0a' + r.toFixed(1) + ' ' + r.toFixed(1) + ' 0 1 0 ' + (-2 * r).toFixed(1) + ' 0');
      }
    }
    const cloud = svg('svg', { class: 'ck-dot-cloud', viewBox: '0 0 600 320', 'aria-hidden': 'true' });
    state.cloud = part(cloud, 'g', { 'data-dot-cloud': '1' });
    part(state.cloud, 'path', { d: nodes.join(''), fill: '#121212', 'fill-rule': 'evenodd' });
    state.cloudDots = part(state.cloud, 'g', { 'data-dot-cloud-micro': '1' });
    for (let i = 0; i < 20; i++) {
      const x = 110 + rand() * 380, y = 105 + rand() * 130;
      part(state.cloudDots, 'circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: (1 + rand() * 1.5).toFixed(1), fill: '#111' });
    }
    return cloud;
  }
  function flower(parent, x, y, s) {
    const group = part(parent, 'g', { class: 'ck-dot-flower', transform: 'translate(' + x + ' ' + y + ') scale(' + s + ')' });
    part(group, 'path', { d: 'M0 0 Q-4 22 0 44 M0 30q-15 -16 -23 -7 M0 27q8 -14 17 -7', stroke: '#181818', 'stroke-width': 1.5, fill: 'none' });
    for (let i = 0; i < 5; i++) {
      const a = i * Math.PI * 2 / 5;
      part(group, 'ellipse', { cx: (Math.cos(a) * 10).toFixed(2), cy: (Math.sin(a) * 10).toFixed(2), rx: 7, ry: 8,
        transform: 'rotate(' + (i * 72 + 90) + ' ' + (Math.cos(a) * 10).toFixed(2) + ' ' + (Math.sin(a) * 10).toFixed(2) + ')',
        fill: '#fff', stroke: '#141414', 'stroke-width': 1.25 });
    }
    part(group, 'circle', { r: 4.3, fill: '#171717' });
  }
  function lineLawn() {
    const ground = svg('svg', { class: 'ck-dot-lawn', viewBox: '0 0 1536 1024', preserveAspectRatio: 'xMidYMid slice', 'aria-hidden': 'true' });
    const matte = 'M0 755 Q220 713 425 772 T842 764 T1236 753 T1536 738 V1024 H0Z';
    part(ground, 'path', { d: matte, fill: '#fff' });
    // Shared curving hillside strokes; deliberately no dots in the turf.
    let contours = '';
    for (let row = 0; row < 22; row++) {
      const y = 760 + row * 13, o = row * .9;
      contours += 'M-15 ' + (y + o) + 'Q190 ' + (y - 33 + o) + ' 390 ' + (y + 8 + o) + 'T800 ' + (y + o) + 'T1200 ' + (y - 9 + o) + 'T1550 ' + (y - 18 + o);
    }
    part(ground, 'path', { d: contours, fill: 'none', stroke: '#767676', 'stroke-opacity': .32, 'stroke-width': .85 });
    const rand = rng(21349); let blades = '';
    for (let i = 0; i < 215; i++) {
      const x = rand() * 1536, y = 760 + rand() * 262, len = 4 + rand() * 14;
      blades += 'M' + x.toFixed(1) + ' ' + y.toFixed(1) + 'q' + (rand() * 5 - 2.5).toFixed(1) + ' ' + (-len * .62).toFixed(1) + ' ' + (rand() * 8 - 4).toFixed(1) + ' ' + (-len).toFixed(1);
    }
    part(ground, 'path', { d: blades, fill: 'none', stroke: '#242424', 'stroke-opacity': .62, 'stroke-width': 1.2, 'stroke-linecap': 'round' });
    // Exactly three flowers: no extra blossoms from the former landscape are visible under the matte.
    flower(ground, 125, 871, 1.15); flower(ground, 779, 943, .83); flower(ground, 1393, 860, 1.05);
    return ground;
  }
  function orbit() {
    const graphic = svg('svg', { class: 'ck-dot-orbit', viewBox: '0 0 1536 1024', preserveAspectRatio: 'xMidYMid slice', 'aria-hidden': 'true' });
    const defs = part(graphic, 'defs');
    const pattern = part(defs, 'pattern', { id: 'ck-dot-apple-fill', width: 8, height: 8, patternUnits: 'userSpaceOnUse' });
    part(pattern, 'circle', { cx: 2.5, cy: 3, r: 2, fill: '#111' });
    const points = legacy && Array.isArray(legacy.points) ? legacy.points : [];
    const stride = Math.max(1, Math.floor(points.length / 130));
    const coords = points.filter((_, i) => i % stride === 0);
    if (coords.length && coords[coords.length - 1] !== points[points.length - 1]) coords.push(points[points.length - 1]);
    const rail = coords.length ? coords.map((p, i) => (i ? 'L' : 'M') + p[0] + ' ' + p[1]).join('') + 'Z' :
      'M336 482 C390 350 636 318 780 343 C1020 379 1130 448 1132 499 C1130 590 830 615 650 603 C460 600 300 540 336 482Z';
    part(graphic, 'path', { d: rail, fill: 'none', stroke: '#131313', 'stroke-width': 1.25 });
    part(graphic, 'path', { d: rail, fill: 'none', stroke: '#161616', 'stroke-width': 8, 'stroke-dasharray': '.45 5.3', 'stroke-linecap': 'round', opacity: .82 });
    state.apples = [];
    for (let i = 0; i < 6; i++) {
      const g = part(graphic, 'g', { class: 'ck-dot-apple', 'data-fruit': i });
      part(g, 'path', { d: 'M0 -13C-13 -25 -28 -14 -28 0C-27 21 -11 31 0 26C14 32 28 17 28 0C28 -17 13 -24 0 -13Z', fill: '#fff', stroke: '#131313', 'stroke-width': 1.4 });
      part(g, 'path', { d: 'M0 -13C-13 -25 -28 -14 -28 0C-27 21 -11 31 0 26C14 32 28 17 28 0C28 -17 13 -24 0 -13Z', fill: 'url(#ck-dot-apple-fill)', opacity: .8 });
      part(g, 'path', { d: 'M0 -15Q-2 -29 5 -31M3 -25Q14 -38 25 -30Q23 -18 3 -25', fill: 'none', stroke: '#171717', 'stroke-width': 2, 'stroke-linejoin': 'round' });
      state.apples.push(g);
    }
    return graphic;
  }
  function bird() {
    const layer = svg('svg', { class: 'ck-dot-bird', viewBox: '0 0 1536 1024', preserveAspectRatio: 'xMidYMid slice', 'aria-hidden': 'true' });
    const g = part(layer, 'g', { transform: 'translate(600 503)' });
    const dots = part(part(g, 'defs'), 'pattern', { id: 'ck-dot-bird-fur', width: 7, height: 7, patternUnits: 'userSpaceOnUse' });
    part(dots, 'circle', { cx: 2, cy: 2, r: 1.35, fill: '#141414' });
    part(g, 'path', { d: 'M-16 84Q52 79 109 84L109 93Q45 91 -16 94Z', stroke: '#171717', 'stroke-width': 1.5, fill: '#fff' });
    part(g, 'path', { d: 'M-11 87H103', stroke: '#222', 'stroke-width': 3, 'stroke-dasharray': '1 4', 'stroke-linecap': 'round' });
    const body = part(g, 'g', { 'data-dot-bird-body': '1' });
    part(body, 'path', { d: 'M25 52Q3 62 14 78Q26 88 37 76Q65 91 72 72Q73 57 62 51Z', fill: 'url(#ck-dot-bird-fur)', stroke: '#111', 'stroke-width': 1.4 });
    part(body, 'path', { d: 'M17 69Q2 58 3 65Q0 78 22 80M32 77L30 85M55 79L60 85', stroke: '#111', 'stroke-width': 2.2, fill: 'none', 'stroke-linecap': 'round' });
    state.birdHead = part(g, 'g', { 'data-dot-bird-head': '1' });
    part(state.birdHead, 'circle', { cx: 45, cy: 37, r: 30, fill: '#fff', stroke: '#151515', 'stroke-width': 1.5 });
    part(state.birdHead, 'circle', { cx: 45, cy: 37, r: 28, fill: 'url(#ck-dot-bird-fur)' });
    part(state.birdHead, 'path', { d: 'M39 11Q33 0 39 -3M46 10Q47 -3 53 -6M29 27Q25 22 23 17', stroke: '#181818', 'stroke-width': 2, fill: 'none', 'stroke-linecap': 'round' });
    part(state.birdHead, 'ellipse', { cx: 35, cy: 38, rx: 6.2, ry: 8.6, fill: '#111' });
    part(state.birdHead, 'ellipse', { cx: 56, cy: 38, rx: 6.2, ry: 8.6, fill: '#111' });
    part(state.birdHead, 'circle', { cx: 37, cy: 35, r: 1.8, fill: '#fff' });
    part(state.birdHead, 'circle', { cx: 58, cy: 35, r: 1.8, fill: '#fff' });
    part(state.birdHead, 'path', { d: 'M43 47Q47 43 52 47L48 55Z', fill: '#121212' });
    return layer;
  }
  function eyes() {
    const layer = svg('svg', { class: 'ck-dot-lion-eyes', viewBox: '0 0 1312 1184', 'aria-hidden': 'true' });
    state.pupils = part(layer, 'g', { 'data-dot-lion-pupils': '1' });
    // Two fine stipple dots react to the gaze; the portrait itself is never displaced.
    part(state.pupils, 'circle', { cx: 567, cy: 393, r: 5.5, fill: '#111' });
    part(state.pupils, 'circle', { cx: 912, cy: 472, r: 5.5, fill: '#111' });
    state.lids = part(layer, 'g', { 'data-dot-lion-blink': '1', opacity: 0 });
    part(state.lids, 'path', { d: 'M488 373C485 275 646 265 663 371C683 486 493 495 488 373ZM834 449C843 346 980 350 1004 445C1023 566 825 564 834 449Z', fill: '#fff', stroke: '#181818', 'stroke-width': 3 });
    part(state.lids, 'path', { d: 'M505 401Q572 445 645 399M850 477Q920 520 988 468', fill: 'none', stroke: '#111', 'stroke-width': 10, 'stroke-linecap': 'round' });
    return layer;
  }
  function makeCub(className, asset, alt, interactive) {
    const node = document.createElement(interactive ? 'button' : 'div');
    node.className = 'ck-dot-cub ' + className;
    if (interactive) { node.type = 'button'; node.setAttribute('aria-label', '아기사자 몽당연필 동작 재생'); }
    const img = document.createElement('img');
    img.dataset.dotImage = asset; img.alt = interactive ? alt : '';
    img.draggable = false; img.decoding = 'async'; node.appendChild(img);
    if (interactive) {
      node.appendChild(eyes());
      node.addEventListener('click', () => { if (reduced.matches) return;
        node.classList.remove('ck-dot-pencil-press'); void node.offsetWidth; node.classList.add('ck-dot-pencil-press'); });
      node.addEventListener('animationend', () => node.classList.remove('ck-dot-pencil-press'));
    }
    return node;
  }
  function scene() {
    const host = state.host;
    host.replaceChildren(); host.classList.remove('ck36-garden'); host.classList.add('ck-dot-landing');
    host.dataset.renderer = 'dot-illustration';
    const backdrop = document.createElement('img'); backdrop.className = 'ck-dot-backdrop';
    backdrop.dataset.dotImage = 'garden-clean-v37.webp'; backdrop.alt = '';
    backdrop.draggable = false; host.appendChild(backdrop);
    host.appendChild(seededCloud());
    host.appendChild(lineLawn());
    host.appendChild(orbit()); host.appendChild(bird());
    host.appendChild(makeCub('ck-dot-main', 'cub-pencil-v36.webp', '몽당연필을 든 웃는 아기사자', true));
    host.appendChild(makeCub('ck-dot-sleep', 'cub-sleep-v36.webp', '상자 위에서 잠든 아기사자', false));
    const scroll = document.createElement('button'); scroll.type = 'button';
    scroll.className = 'ck-dot-scroll'; scroll.textContent = 'SCROLL DOWN ↓';
    scroll.setAttribute('aria-label', '아래로 스크롤하여 학습 시작');
    scroll.addEventListener('click', () => document.querySelector('#main [data-go="home"]')?.click());
    host.appendChild(scroll);
    convertAssets();
  }
  const allowed = () => document.body.dataset.ckV8Tab === 'landing' && !document.hidden && state.focus && !reduced.matches;
  function layout() {
    if (state.host && state.host.clientHeight > 0) state.host.style.setProperty('--ck-dot-viewport-height', Math.min(state.host.clientHeight, window.innerHeight) + 'px');
  }
  function paint(dt) {
    const points = legacy && legacy.points || [];
    const lap = legacy && legacy.lapSeconds || 24;
    const positions = [];
    for (let i = 0; i < state.apples.length; i++) {
      const u = (state.time / lap + i / state.apples.length) % 1;
      let x, y, z;
      if (points.length > 1) {
        const n = u * (points.length - 1), base = Math.floor(n), p = points[base], q = points[Math.min(points.length - 1, base + 1)], f = n - base;
        x = p[0] + (q[0] - p[0]) * f; y = p[1] + (q[1] - p[1]) * f; z = p[2] + (q[2] - p[2]) * f;
      } else { const a = u * Math.PI * 2; x = 760 + 380 * Math.cos(a); y = 475 + 145 * Math.sin(a); z = 2 * Math.sin(a); }
      positions.push({ x, y });
      const size = .84 + (z + 8) / 16 * .21;
      state.apples[i].setAttribute('transform', 'translate(' + x.toFixed(2) + ' ' + y.toFixed(2) + ') scale(' + size.toFixed(3) + ')');
    }
    // One slow drifting dot cloud; its inner accent dots shift a fraction independently.
    if (state.cloud) state.cloud.setAttribute('transform', 'translate(' + (Math.sin(state.time / 32) * 38).toFixed(2) + ' ' + (Math.sin(state.time / 25) * 3).toFixed(2) + ')');
    if (state.cloudDots) state.cloudDots.setAttribute('transform', 'translate(' + (Math.sin(state.time / 7) * 1.5).toFixed(2) + ' 0)');
    const closest = positions.reduce((best, p, index) => {
      const d = Math.hypot(p.x - 673, p.y - 547); return d < best.distance ? { distance: d, index } : best;
    }, { distance: Infinity, index: -1 });
    if (closest.distance < 74 && closest.index !== state.peckIndex && state.time - state.lastPeck > 1.1) {
      state.peckIndex = closest.index; state.lastPeck = state.time; state.pecks++;
    }
    if (closest.distance > 110 && state.time - state.lastPeck > .85) state.peckIndex = -1;
    const progress = (state.time - state.lastPeck) / (legacy && legacy.peckSeconds || .65);
    const peck = progress >= 0 && progress <= 1 ? Math.sin(progress * Math.PI) : 0;
    const target = 28 * peck + Math.sin(state.time * .55) * 1.4;
    state.birdAngle += (target - state.birdAngle) * (1 - Math.exp(-dt * 9));
    state.birdHead?.setAttribute('transform', 'rotate(' + state.birdAngle.toFixed(2) + ' 45 60)');
    const blinkPhase = (state.time + 1.5) % 5.7;
    state.lids?.setAttribute('opacity', blinkPhase < .15 || (blinkPhase > .29 && blinkPhase < .38) ? '1' : '0');
    state.pupils?.setAttribute('transform', 'translate(' + (Math.sin(state.time / 9) * 3).toFixed(2) + ' ' + (Math.sin(state.time / 11) * 1.5).toFixed(2) + ')');
    state.host.dataset.ckDotPecks = String(state.pecks);
  }
  function tick(now) {
    state.frame = 0;
    if (!allowed()) return;
    if (state.last && now - state.last < 1000 / 24) { state.frame = requestAnimationFrame(tick); return; }
    const dt = state.last ? Math.min(.11, (now - state.last) / 1000) : 0;
    state.last = now; state.time += dt; state.frames++; paint(dt);
    state.frame = requestAnimationFrame(tick);
  }
  function sync() {
    const canRun = allowed(); state.active = canRun;
    state.host?.classList.toggle('ck-dot-paused', !canRun);
    if (state.host) state.host.dataset.ckDotActive = String(canRun);
    if (!canRun) { cancelAnimationFrame(state.frame); state.frame = 0; state.last = 0; }
    else if (!state.frame) state.frame = requestAnimationFrame(tick);
  }
  function boot() {
    state.host = document.getElementById('ck-v8-ambient');
    if (!state.host) return;
    addStyle(); scene(); layout(); paint(0);
    new ResizeObserver(layout).observe(state.host);
    window.addEventListener('resize', layout, { passive: true });
    new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ['data-ck-v8-tab'] });
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('ck:scene-activity', sync);
    window.addEventListener('blur', () => { state.focus = false; sync(); });
    window.addEventListener('focus', () => { state.focus = true; sync(); });
    reduced.addEventListener('change', sync);
    window.addEventListener('pagehide', () => { cancelAnimationFrame(state.frame); state.frame = 0; }, { once: true });
    window.CK3DPerformance = Object.freeze({ getState: () => ({ renderer: 'monochrome-dot-svg', active: state.active,
      idle: !state.active, frames: state.frames, landing: document.body.dataset.ckV8Tab === 'landing',
      webgl: false, fpsCap: 24, apples: state.apples.length, flowers: 3, clouds: 1, pecks: state.pecks }) });
    sync();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();