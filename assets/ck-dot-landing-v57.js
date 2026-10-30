/* ConceptKnot Dot Landing v53: corrected cub artwork, three RGB notes and zero-loop study still.
   No WebGL, no continuous canvas redraw, and no rasterized full-page animation. */
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const scenePath = './assets/';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const legacy = window.CKLegacyMotion37;
  const state = { host: null, frame: 0, last: 0, time: 0, frames: 0, active: false,
    focus: document.hasFocus(), apples: [], owlRig: null, owlLids: null, cloud: null, cloudDots: null,
    lids: null, pupils: null, pecks: 0, lastPeck: -100, peckIndex: -1, birdAngle: 0,
    smallClouds: [], cloudBounds: null, edgeDots: [], noteTufts: [], scroll: null, closedFace: null, rgbDotCount: 0 };
  const memo = new Map();
  const rng = seed => { let n = seed >>> 0; return () => ((n = (1664525 * n + 1013904223) >>> 0) / 4294967296); };
  const svg = (tag, attrs = {}) => {
    const node = document.createElementNS(NS, tag);
    for (const key of Object.keys(attrs)) node.setAttribute(key, String(attrs[key]));
    return node;
  };
  const part = (parent, tag, attrs) => { const node = svg(tag, attrs); parent.appendChild(node); return node; };
  const addStyle = () => {
    if (document.querySelector('link[data-ck-dot-style],link[href="./assets/ck-dot-landing-v57.css"]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet'; link.href = scenePath + 'ck-dot-landing-v57.css';
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
            // Fade heavy background dots over a wide band BEFORE the hillside edge.
            // Preserve mascot and machine details; only the static backdrop is tapered.
            const t = background ? Math.max(0, Math.min(1, (y / h - .52) / .24)) : 0;
            const smooth = t * t * (3 - 2 * t);
            const dotScale = background ? (1 - .99 * smooth) : 1;
            ctx.globalAlpha = background ? (1 - .68 * smooth) : 1;
            ctx.beginPath();
            for (let x = 0; x < w; x += tile) {
              const px = x + Math.floor(tile / 2), py = y + Math.floor(tile / 2);
              const [r, g, b, alpha] = sample(px, py);
              if (alpha < 35) continue;
              // The original blue sky becomes blank white paper; keep only the lower garden silhouettes.
              if (background && (py < h * .43 || (py < h * .60 && b > r * 1.07 && b > g * 1.012 && b > 65))) continue;
              const lum = (r * .2126 + g * .7152 + b * .0722) / 255;
              const [nr, ng, nb, na] = sample(px + tile, py + tile);
              const next = (nr * .2126 + ng * .7152 + nb * .0722) / 255;
              const edge = Math.min(1, Math.abs(next - lum) * 2.3);
              let ink = Math.max((1 - lum) * 1.10, edge * .64);
              if (!background && na < 40 && alpha > 150) ink = Math.max(.68, ink);
              if (background && py > h * .56 && g > r * 1.12 && g > b * 1.10) ink *= .36;
              if (ink < .055) continue;
              const radius = Math.min(tile * .48, Math.max(.5, tile * .47 * Math.sqrt(ink))) * dotScale;
              if (radius < .18) continue;
              ctx.moveTo(px + radius, py); ctx.arc(px, py, radius, 0, Math.PI * 2);
            }
            ctx.fill();
          }
          ctx.globalAlpha = 1;
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
  // A fixed pointillist body, with TWO independent left-to-right cloud trails below it.
  // The clouds are pre-baked SVG paths: only 2 group transforms and the lower-edge
  // motion accents are updated each frame; the full stippled raster never repaints.
  function stampSmallCloud(parent, index, options) {
    const group = part(parent, 'g', { class: 'ck-dot-small-cloud',
      'data-dot-small-cloud': String(index) });
    const random = rng(48200 + index * 379);
    const lobes = [[27,42,29,17],[58,27,31,25],[98,24,35,28],[136,38,33,20],[79,44,71,19]];
    let dots = '';
    for (let y = 3; y <= 66; y += 4.4) {
      for (let x = 0; x <= 174; x += 4.4) {
        const xx=x+(random()-.5)*2.8, yy=y+(random()-.5)*2.8;
        const inside=lobes.some(([cx,cy,rx,ry])=>((xx-cx)/rx)**2+((yy-cy)/ry)**2<1);
        if (!inside || random()<.14) continue;
        const shade = Math.min(1, .47 + (yy/66)*.40 + random()*.25);
        const r = .55 + shade*1.25;
        dots += `M${(xx+r).toFixed(1)} ${yy.toFixed(1)}a${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${(-2*r).toFixed(2)} 0a${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${(2*r).toFixed(2)} 0`;
      }
    }
    part(group, 'path', { d: dots, fill: '#242424', opacity: index ? .77 : .87 });
    state.smallClouds.push({ node: group, width: 174, y: options.y,
      speed: options.speed, offset: options.offset, x: 0, center: 0 });
  }
  function seededCloud() {
    // The large, irregular cumulus retains its original high-detail dot silhouette.
    const cloud = svg('svg', { class: 'ck-dot-cloud', viewBox: '0 0 1244 369',
      preserveAspectRatio: 'xMidYMid meet', 'aria-hidden': 'true' });
    state.cloud = part(cloud, 'g', { 'data-dot-cloud': '1' });
    part(state.cloud, 'image', { href: scenePath + 'ck-dot-cumulus-v47.webp',
      x: 0, y: 0, width: 1244, height: 369 });
    state.cloudDots = part(state.cloud, 'g', { 'data-dot-cloud-micro': '1' });
    const random = rng(47701);
    for (let i = 0; i < 24; i++) {
      const x = 330 + random() * 600, y = 120 + random() * 135;
      part(state.cloudDots, 'circle', { cx: x.toFixed(2), cy: y.toFixed(2),
        r: (.7 + random() * 1.05).toFixed(2), fill: '#151515', opacity: .8 });
    }
    // Sampled from the source artwork's ALPHA edge: preserve the scalloped boundary.
    // Only ~70 extra dots are reactive; the many thousands in the image stay still.
    state.edgeDots = [];
    const edgePoints = [[130,311],[145,310],[160,281],[175,311],[190,310],[205,311],[220,295],[235,311],[250,311],[265,311],[280,311],[295,311],[310,306],[325,311],[340,316],[355,308],[370,305],[385,306],[400,311],[415,305],[430,311],[445,311],[460,306],[475,310],[490,311],[505,311],[520,311],[535,311],[550,311],[565,316],[580,305],[595,311],[610,316],[625,311],[640,310],[655,311],[670,311],[685,311],[700,310],[715,316],[730,311],[745,311],[760,311],[775,311],[790,311],[805,316],[820,316],[835,311],[850,311],[865,306],[880,316],[895,306],[910,305],[925,305],[940,296],[955,312],[970,310],[985,306],[1000,311],[1015,295],[1030,311],[1045,311],[1075,311],[1090,316],[1105,310],[1120,311]];
    for (let i = 0; i < edgePoints.length; i++) {
      const [x,y] = edgePoints[i];
      const node = part(state.cloud, 'circle', { class: 'ck-dot-cumulus-edge-dot',
        cx: x, cy: y, r: (.9+random()*.85).toFixed(2), fill: '#212121', opacity: .84 });
      state.edgeDots.push({ node, x, y, phase: random()*6.28, tintable: i % 3 === 0, index: i });
    }
    state.smallClouds = [];
    stampSmallCloud(cloud, 0, { y: 302, speed: 12.0, offset: 410 });
    stampSmallCloud(cloud, 1, { y: 340, speed: 8.2, offset: 1030 });
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
  function musicNote(parent, x, y, scale, index) {
    const note=part(parent,'g',{class:'ck-dot-music-note', 'data-dot-music-note':String(index),
      transform:`translate(${x} ${y}) scale(${scale}) rotate(${index===1?9:-7})`});
    const staticGroup=part(note,'path',{class:'ck-dot-note-static',fill:'#282828',opacity:.89});
    const mobileGroup=part(note,'g',{class:'ck-dot-note-top','data-dot-note-top':String(index),fill:'#282828'});
    const marks=[], random=rng(4881+index*117);
    for(let py=-46;py<=11;py+=3.1) for(let px=-17;px<=34;px+=3.1){
      const xx=px+(random()-.5)*.8,yy=py+(random()-.5)*.8;
      const head=((xx+4)/14)**2+((yy-1)/8.4)**2<=1;
      const stem=xx>=8&&xx<=12&&yy>=-43&&yy<=1;
      const t=(xx-10)/23, flag=t>=0&&t<=1&&Math.abs(yy-(-43+9*Math.sin(t*Math.PI)+19*t))<3.2;
      if((head||stem||flag)&&random()>.14) marks.push({x:xx,y:yy,r:.72+random()*.82});
    }
    // Exactly one fifth of the existing note dots is eligible for animation.
    const mobileCount=Math.ceil(marks.length*.2);
    const mobile=new Set(marks.map((m,i)=>({i,y:m.y})).sort((a,b)=>a.y-b.y).slice(0,mobileCount).map(a=>a.i));
    let staticPath='';
    for(let i=0;i<marks.length;i++){
      const {x:dx,y:dy,r}=marks[i];
      if(mobile.has(i)){
        part(mobileGroup,'circle',{cx:dx.toFixed(2),cy:dy.toFixed(2),r:r.toFixed(2)});
      } else {
        staticPath += `M${(dx+r).toFixed(1)} ${dy.toFixed(1)}a${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${(-2*r).toFixed(2)} 0a${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${(2*r).toFixed(2)} 0`;
      }
    }
    staticGroup.setAttribute('d',staticPath);
    state.noteTufts.push({node:mobileGroup,x: [140, 285, 1372][index],index,dots:mobileCount,total:marks.length,rgb: '#282828'});
  }
  function lineLawn() {
    const ground = svg('svg', { class: 'ck-dot-lawn', viewBox: '0 0 1536 1024', preserveAspectRatio: 'xMidYMid slice', 'aria-hidden': 'true' });
    const matte = 'M0 755 Q220 713 425 772 T842 764 T1236 753 T1536 738 V1024 H0Z';
    part(ground, 'path', { d: matte, fill: '#fff' });
    // v49: every long curving meadow boundary is a rounded dotted path, never a solid hairline.
    let contours = '';
    for (let row = 0; row < 22; row++) {
      const y = 760 + row * 13, o = row * .9;
      contours += 'M-15 ' + (y + o) + 'Q190 ' + (y - 33 + o) + ' 390 ' + (y + 8 + o) + 'T800 ' + (y + o) + 'T1200 ' + (y - 9 + o) + 'T1550 ' + (y - 18 + o);
    }
    part(ground, 'path', { class: 'ck-dot-contour', d: contours, fill: 'none', stroke: '#666',
      'stroke-opacity': .38, 'stroke-width': 1.75, 'stroke-dasharray': '.01 5.7',
      'stroke-linecap': 'round' });
    // Include the long hillside top edge; it used to be a continuous solid line.
    part(ground, 'path', { class: 'ck-dot-contour',
      d: 'M0 755 Q220 713 425 772 T842 764 T1236 753 T1536 738',
      stroke: '#666', 'stroke-opacity': .32, 'stroke-width': 2.0,
      'stroke-dasharray': '.01 6', 'stroke-linecap': 'round', fill: 'none' });
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
  function notesLayer() {
    // Two notes sit to the awake cub's left and one to the right of the sleeper.
    // Each icon has its own front layer so the cubs cannot occlude the dots.
    const notes=document.createElement('div'); notes.className='ck-dot-notes';
    notes.setAttribute('aria-hidden','true'); state.noteTufts=[];
    const placement=['left-outer','left-inner','right'];
    for(let index=0;index<3;index++) {
      const icon=svg('svg',{class:'ck-dot-note-icon','data-side':placement[index],
        viewBox:'0 0 80 92',preserveAspectRatio:'xMidYMid meet'});
      musicNote(icon,24,66,index===0?1.02:1.00,index);
      notes.appendChild(icon);
    }
    return notes;
  }
  function orbit() {
    const graphic = svg('svg', { class: 'ck-dot-orbit', viewBox: '0 0 1536 1024',
      preserveAspectRatio: 'xMidYMid slice', 'aria-hidden': 'true' });
    const defs = part(graphic, 'defs');
    const palette = ['#ea3735', '#85c92f', '#ffc928']; // red, lime, yellow: dot fills only
    palette.forEach((color, index) => {
      const pat = part(defs, 'pattern', { id: 'ck-dot-apple-fill-v47-' + index,
        width: 7.3, height: 7.3, patternUnits: 'userSpaceOnUse' });
      part(pat, 'circle', { cx: 3.5, cy: 3.5, r: 2.65, fill: color });
      part(pat, 'circle', { cx: 3, cy: 3, r: .45, fill: '#fff', opacity: .5 });
    });
    const points = legacy && Array.isArray(legacy.points) ? legacy.points : [];
    const stride = Math.max(1, Math.floor(points.length / 130));
    const coords = points.filter((_, i) => i % stride === 0);
    if (coords.length && coords[coords.length - 1] !== points[points.length - 1]) coords.push(points[points.length - 1]);
    const rail = coords.length ? coords.map((p, i) => (i ? 'L' : 'M') + p[0] + ' ' + p[1]).join('') + 'Z' :
      'M336 482 C390 350 636 318 780 343 C1020 379 1130 448 1132 499 C1130 590 830 615 650 603 C460 600 300 540 336 482Z';
    part(graphic, 'path', { class: 'ck-dot-orbit-rail', d: rail, fill: 'none', stroke: '#141414',
      'stroke-width': 3.15, 'stroke-dasharray': '.01 5.1', 'stroke-linecap': 'round', opacity: .94 });
    state.apples = [];
    for (let i = 0; i < 6; i++) {
      const g = part(graphic, 'g', { class: 'ck-dot-apple', 'data-fruit': i,
        'data-dot-apple-color': ['red', 'lime', 'yellow'][i % 3] });
      const shape = 'M0 -13C-13 -25 -28 -14 -28 0C-27 21 -11 31 0 26C14 32 28 17 28 0C28 -17 13 -24 0 -13Z';
      part(g, 'path', { d: shape, fill: '#fff', stroke: '#131313', 'stroke-width': 1.25 });
      part(g, 'path', { d: shape, fill: 'url(#ck-dot-apple-fill-v47-' + (i % 3) + ')', opacity: .95 });
      part(g, 'path', { d: 'M0 -15Q-2 -29 5 -31M3 -25Q14 -38 25 -30Q23 -18 3 -25',
        fill: 'none', stroke: '#171717', 'stroke-width': 2, 'stroke-linejoin': 'round' });
      state.apples.push(g);
    }
    return graphic;
  }
  function bird() {
    // The illustrated owl is a genuine high-density pointillist sprite; no cheap repeated SVG dot pattern.
    const layer = svg('svg', { class: 'ck-dot-bird', viewBox: '0 0 1536 1024',
      preserveAspectRatio: 'xMidYMid slice', 'aria-hidden': 'true' });
    const g = part(layer, 'g', { transform: 'translate(600 596)' });
    part(g, 'path', { d: 'M-16 89Q52 84 109 89',
      stroke: '#171717', 'stroke-width': 2.4, 'stroke-dasharray': '.01 5',
      'stroke-linecap': 'round', fill: 'none' });
    part(g, 'path', { d: 'M-11 94H103', stroke: '#222', 'stroke-width': 2.2,
      'stroke-dasharray': '.01 5', 'stroke-linecap': 'round' });
    state.owlRig = part(g, 'g', { 'data-dot-owl-rig': '1' });
    part(state.owlRig, 'image', { href: scenePath + 'ck-dot-owl-tight-v49.webp',
      x: -15, y: -61, width: 122, height: 142 });
    // The forehead is level with the lower-arc fruit at (667, 563); peck tilt is short.
    state.owlLids = part(state.owlRig, 'g', { 'data-dot-owl-blink': '1', opacity: 0 });
    part(state.owlLids, 'ellipse', { cx: 30, cy: -1, rx: 14, ry: 15.5, fill: '#fff' });
    part(state.owlLids, 'ellipse', { cx: 69, cy: -1, rx: 14, ry: 15.5, fill: '#fff' });
    part(state.owlLids, 'path', { d: 'M17 -2Q30 8 43 -2M56 -2Q69 8 82 -2',
      stroke: '#111', 'stroke-width': 2.1, fill: 'none', 'stroke-linecap': 'round' });
    return layer;
  }
  function registeredBlinkFrame() {
    // Both sprites have identical 352x342 dimensions; the eyelids are burned into
    // EXACT original eye bounds. No SVG ellipse masks (which covered face/eyebrows).
    const closed = document.createElement('img');
    closed.className = 'ck-dot-registered-blink';
    closed.src = scenePath + 'ck-dot-lion-closed-v53.webp';
    closed.alt = ''; closed.draggable = false; closed.decoding = 'async';
    closed.loading = 'eager'; closed.setAttribute('aria-hidden', 'true');
    state.closedFace = closed;
    return closed;
  }
  function makeCub(className, asset, alt, interactive) {
    const node = document.createElement(interactive ? 'button' : 'div');
    node.className = 'ck-dot-cub ck-dot-cub-v47 ' + className;
    if (interactive) { node.type = 'button'; node.setAttribute('aria-label', '아기사자 몽당연필 동작 재생'); }
    const img = document.createElement('img');
    img.src = scenePath + asset; img.alt = interactive ? alt : '';
    img.draggable = false; img.decoding = 'async'; img.loading = 'eager';
    node.appendChild(img);
    if (interactive) {
      node.appendChild(registeredBlinkFrame());
      node.addEventListener('click', () => { if (reduced.matches) return;
        node.classList.remove('ck-dot-pencil-press'); void node.offsetWidth;
        node.classList.add('ck-dot-pencil-press'); });
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
    // v54: two lion layers intentionally omitted; preserve all other scenery.
    host.appendChild(notesLayer());
    const search = document.createElement('div');
    search.className = 'ck-dot-search-placeholder';
    search.setAttribute('role', 'search');
    search.setAttribute('aria-label', '전체 검색 (준비 중)');
    search.innerHTML = '<span class="ck-dot-search-help" aria-hidden="true">?</span><span>전체 검색 · 준비 중</span>';
    host.appendChild(search);
    const scroll = document.createElement('button'); scroll.type = 'button';
    scroll.className = 'ck-dot-scroll'; scroll.textContent = 'SCROLL DOWN ↓';
    scroll.setAttribute('aria-label', '아래로 스크롤하여 학습 시작');
    scroll.addEventListener('click', () => document.querySelector('#main [data-go="home"]')?.click());
    host.appendChild(scroll);
    // An actual immutable bitmap is shown when any study tab is selected.
    // Hidden SVGs/cubs never render during study; no frame/canvas work remains.
    const still=document.createElement('img');
    still.className='ck-dot-study-still';
    still.src=scenePath+'ck-dot-study-still-v53.webp';
    still.alt=''; still.decoding='async'; still.loading='eager';
    still.draggable=false; still.setAttribute('aria-hidden','true');
    // Freeze the live scenery itself instead of swapping to a separate still image.
    // The existing RAF cancellation in sync() preserves the precise last frame.
    // host.appendChild(still);
    convertAssets();
  }
  const allowed = () => document.body.dataset.ckV8Tab === 'landing' && !document.hidden && state.focus && !reduced.matches;
  function layout() {
    if (!state.host) return;
    if (state.host.clientHeight > 0) state.host.style.setProperty('--ck-dot-viewport-height', Math.min(state.host.clientHeight, window.innerHeight) + 'px');
    // Express the *actual visible host width* in the cloud SVG's viewBox units.
    // The 1244-unit cloud artwork is centered and smaller than desktop screens;
    // resetting at x=0 used to teleport a cloud while still on screen.
    const sky = state.cloud && state.cloud.ownerSVGElement;
    const rootBox = state.host.getBoundingClientRect?.();
    const skyBox = sky?.getBoundingClientRect?.();
    if (rootBox && skyBox && rootBox.width > 0 && skyBox.width > 0) {
      const scale = 1244 / skyBox.width;
      state.cloudBounds = {
        left: (rootBox.left - skyBox.left) * scale,
        right: (rootBox.right - skyBox.left) * scale
      };
    } else if (!state.cloudBounds) {
      state.cloudBounds = { left: 0, right: 1244 };
    }
  }
  function paintSkyAndNotes() {
    const driftX = Math.sin(state.time/32)*18;
    if(state.cloud) state.cloud.setAttribute('transform',`translate(${driftX.toFixed(2)} ${(Math.sin(state.time/26)*2).toFixed(2)})`);
    if(state.cloudDots) state.cloudDots.setAttribute('transform',`translate(${(Math.sin(state.time/7)*1.2).toFixed(2)} 0)`);
    const bounds = state.cloudBounds || { left: 0, right: 1244 };
    for (const small of state.smallClouds) {
      const margin = 44; // clear BOTH viewport edges before wrapping
      const start = bounds.left - small.width - margin;
      const end = bounds.right + margin;
      const span = end - start;
      // The discontinuity is strictly offscreen. On return, the first dots
      // emerge from the LEFT at their natural density, never as a full sprite.
      const travelled = ((small.offset + state.time * small.speed) % span + span) % span;
      small.x = start + travelled;
      small.center = small.x + small.width * .5;
      small.node.setAttribute('transform', `translate(${small.x.toFixed(2)} ${small.y})`);
      // Soft edge reveal and dissolve (2 opacity writes per frame at most).
      const clamp01 = n => Math.max(0, Math.min(1, n));
      const ease = n => n * n * (3 - 2 * n);
      const arriving = ease(clamp01((small.x + small.width - bounds.left) / (small.width * .9)));
      const leaving = ease(clamp01((bounds.right - small.x) / (small.width * .9)));
      small.node.style.opacity = (.92 * arriving * leaving).toFixed(3);
    }
    // Passing small-cloud lobe: a capped, local lift, like a restrained equalizer.
    // This changes only the bottom rim accents; never distort the underlying raster.
    for(const dot of state.edgeDots){
      let lift=0;
      for(const small of state.smallClouds){
        const t=(dot.x+driftX-small.center)/(small.width*.74);
        const influence=Math.max(0,1-t*t);
        lift=Math.max(lift, Math.pow(influence,2)*(small.y<320?12:9));
      }
      const ripple=lift ? Math.sin(state.time*.85+dot.phase)*1.1 : 0;
      dot.node.setAttribute('cy',(dot.y-lift-ripple).toFixed(2));
      // RGB light-up under each moving cloud, only in the selected edge-dot subset.
      if (dot.tintable && lift > 1.8) {
        const colors=['#ef4348','#42bf67','#4384ee'];
        const colorIndex=(Math.floor(state.time*2.3 + dot.phase + dot.index*.13)%3+3)%3;
        dot.node.setAttribute('fill', colors[colorIndex]);
        dot.node.setAttribute('r', (2.25 + Math.min(1.35,lift*.10)).toFixed(2));
        dot.node.setAttribute('opacity', Math.min(.98,.75+lift*.02).toFixed(2));
      } else if(dot.tintable) {
        dot.node.setAttribute('fill', '#212121');
        dot.node.setAttribute('r', '1.3');
        dot.node.setAttribute('opacity', '.84');
      }
    }
    // RGB signal moves left -> center -> right -> center -> left forever.
    // Only the upper 20% of note dots are live SVG nodes. All other points
    // stay a single static path. A group fill update replaces hundreds of writes.
    const trip=(state.time/5.4)%2;
    const musicPosition=trip<=1 ? trip*2 : (2-trip)*2;
    const rgbColors=['#ef4348','#42bf67','#4384ee'];
    for(const note of state.noteTufts){
      let follow=0;
      for(const small of state.smallClouds){
        const projected=note.x/1536*1244;
        const d=(projected-small.center)/(small.width*1.6);
        follow=Math.max(follow,Math.max(0,1-d*d));
      }
      const y=-.65*Math.sin(state.time*.8+note.index*1.5)-2.2*follow;
      const x=1.3*Math.sin(state.time*.48+note.index+follow);
      note.node.setAttribute('transform',`translate(${x.toFixed(2)} ${y.toFixed(2)})`);
      const distance=Math.abs(musicPosition-note.index);
      const lit=distance<.58;
      const color=lit?rgbColors[(Math.floor(state.time*.96)+note.index)%3]:'#282828';
      if(note.rgb!==color){ note.node.setAttribute('fill',color); note.rgb=color; }
    }
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
      const size = .84 + (z + 8) / 16 * .21;
      positions.push({ x, y, size });
      state.apples[i].setAttribute('transform', 'translate(' + x.toFixed(2) + ' ' + y.toFixed(2) + ') scale(' + size.toFixed(3) + ')');
    }
    paintSkyAndNotes();
    const closest = positions.reduce((best, p, index) => {
      const d = Math.hypot(p.x - 670, p.y - 563); return d < best.distance ? { distance: d, index } : best;
    }, { distance: Infinity, index: -1 });
    if (closest.distance < 57 && closest.index !== state.peckIndex && state.time - state.lastPeck > 1.9) {
      state.peckIndex = closest.index; state.lastPeck = state.time; state.pecks++;
    }
    if (closest.distance > 90 && state.time - state.lastPeck > .85) state.peckIndex = -1;
    const progress = (state.time - state.lastPeck) / (legacy && legacy.peckSeconds || .65);
    const peck = progress >= 0 && progress <= 1 ? Math.sin(progress * Math.PI) : 0;
    // The nearby colored fruit gives a 2 px recoil at forehead contact.
    if (peck > 0 && state.peckIndex === closest.index) {
      const fruit = positions[state.peckIndex];
      state.apples[state.peckIndex]?.setAttribute('transform',
        `translate(${(fruit.x+peck*2.3).toFixed(2)} ${(fruit.y-peck*1.4).toFixed(2)}) scale(${fruit.size.toFixed(3)})`);
    }
    const target = 28 * peck + Math.sin(state.time * .55) * 1.4;
    state.birdAngle += (target - state.birdAngle) * (1 - Math.exp(-dt * 9));
    state.owlRig?.setAttribute('transform', 'translate(' + (peck * 7).toFixed(2) + ' ' + (-peck * 3).toFixed(2) + ') rotate(' + (state.birdAngle*.36).toFixed(2) + ' 48 -18)');
    const owlBlink = (state.time + .9) % 6.7;
    state.owlLids?.setAttribute('opacity', owlBlink < .13 ? '1' : '0');
    const blinkPhase = (state.time + 1.5) % 5.7;
    // Registered transparent cut-out has the same pixel geometry as the open lion.
    // Switch frame for a short double blink; no circles, clipping or eye drift.
    const blinking = blinkPhase < .15 || (blinkPhase > .29 && blinkPhase < .38);
    if (state.closedFace) state.closedFace.style.opacity = blinking ? '1' : '0';
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
    else if (!state.frame) { layout(); state.frame = requestAnimationFrame(tick); }
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
    window.CK3DPerformance = Object.freeze({ getState: () => ({ renderer: 'monochrome-dot-v54-stopped-live-scene', active: state.active,
      idle: !state.active, frames: state.frames, landing: document.body.dataset.ckV8Tab === 'landing',
      webgl: false, fpsCap: 24, apples: state.apples.length, flowers: 3, clouds: 3, pecks: state.pecks,
      staticStudyBackdrop: true, cloudViewportWidth: state.cloudBounds ? state.cloudBounds.right - state.cloudBounds.left : 0,
      smallClouds: state.smallClouds.length, musicNotes: state.noteTufts.length, rgbDots: state.edgeDots.filter(d=>d.tintable).length, movingNoteDots: state.noteTufts.reduce((sum,n)=>sum+n.dots,0) }) });
    sync();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
