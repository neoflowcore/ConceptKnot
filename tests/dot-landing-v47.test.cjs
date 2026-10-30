const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const script = read('assets/ck-dot-landing-v47.js');
const css = read('assets/ck-dot-landing-v47.css');
const legacy = read('assets/ck-garden-25d-v36.js');
const sw = read('sw.js');
const art = [
  'assets/ck-dot-lion-front-v47.webp',
  'assets/ck-dot-lion-sleep-v47.webp',
  'assets/ck-dot-owl-v47.webp',
  'assets/ck-dot-cumulus-v47.webp',
];
for(const f of art){
  assert.ok(fs.existsSync(path.join(root,f)),`${f} missing`);
  const buf=fs.readFileSync(path.join(root,f));
  assert.equal(buf.toString('ascii',0,4),'RIFF',`${f} not WEBP RIFF`);
  assert.equal(buf.toString('ascii',8,12),'WEBP',`${f} not WEBP`);
  assert.ok(buf.length > 10000 && buf.length < 150000, `${f} compression size invalid`);
  assert.ok(script.includes(path.basename(f)),`${f} not loaded in renderer`);
  assert.ok(sw.includes(`'./${f}'`),`${f} not pre-cached`);
}
assert.match(script,/state\.owlRig/,'Owl movement rig');
assert.match(script,/state\.owlLids/,'Owl blink group');
assert.match(script,/\['#ea3735', '#85c92f', '#ffc928'\]/,'red-lime-yellow dot palette');
assert.match(script,/data-dot-apple-color/,'fruit color identity');
assert.match(script,/state\.cloudDots/,'selected moving cloud dots');
assert.match(script,/seededCloud\(\)/,'one large cumulonimbus');
assert.match(script,/function lineLawn\(\)/,'line-only grass');
assert.match(script,/flower\(ground, 125/,'exact three flowers');
assert.match(script,/function allowed\(\)/,'landing-only scene update');
assert.ok(!script.includes('import(\'./ck-rail3d-v42'), 'WebGL must remain disabled');
assert.match(css,/\.ck-dot-cub\.ck-dot-cub-v47 > img/,'stipple artwork not converted again');
assert.match(css,/\.ck-dot-paused \*/,'lifecycle pause');
assert.match(css,/prefers-reduced-motion:reduce/,'reduced-motion compliance');
assert.match(legacy,/import\('\.\/ck-dot-landing-v47\.js'\)/,'bootstrap points to new version');
assert.match(sw,/conceptknot-study-v47-owl-cubs-art/,'SW cache version updated');
console.log('ConceptKnot Dot v47 illustration + lifecycle contract: PASS');
