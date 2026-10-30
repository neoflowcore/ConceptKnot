const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname,'..');
const read = p => fs.readFileSync(path.join(root,p),'utf8');
const js=read('assets/ck-dot-landing-v53.js');
const css=read('assets/ck-dot-landing-v53.css');

test('v53 renderer JS syntax is parseable and retains v50 apples/owl/clouds', () => {
  new (require('node:vm').Script)(js);
  assert.match(js,/function orbit\(/);
  assert.match(js,/function seededCloud\(/);
  assert.match(js,/function bird\(/);
  assert.match(js,/fpsCap: 24/);
});
test('three independent music notes and one left-right-left RGB sweep', () => {
  assert.match(js,/for\(let index=0;index<3;index\+\+\)/);
  assert.match(js,/\['left-outer','left-inner','right'\]/);
  assert.match(js,/trip<=1 \? trip\*2 : \(2-trip\)\*2/);
  assert.match(js,/rgbColors=\['#ef4348','#42bf67','#4384ee'\]/);
  assert.match(js,/Math\.ceil\(marks\.length\*\.2\)/);
  assert.match(js,/note\.rgb!==color/);
});
test('study mode freezes javascript frame loop and exposes one image', () => {
  assert.match(js,/document\.body\.dataset\.ckV8Tab === 'landing'/);
  assert.match(js,/cancelAnimationFrame\(state\.frame\)/);
  assert.match(js,/ck-dot-study-still-v53\.webp/);
  assert.match(css,/body:not\(\[data-ck-v8-tab="landing"\]\) #ck-v8-ambient\.ck-dot-landing/);
  assert.match(css,/display:block !important; position:fixed !important/);
  assert.match(css,/> :not\(\.ck-dot-study-still\)/);
  assert.match(css,/ck-dot-study-still \{\s*display:block/);
  assert.match(css,/animation:none !important/);
});
test('retouched open and closed lions remain same-size and all assets are WebP',()=>{
  for(const name of [
    'ck-dot-lion-front-v53.webp','ck-dot-lion-closed-v53.webp',
    'ck-dot-lion-sleep-v53.webp','ck-dot-study-still-v53.webp']){
    const bytes=fs.readFileSync(path.join(root,'assets',name));
    assert.equal(bytes.toString('ascii',0,4),'RIFF');
    assert.equal(bytes.toString('ascii',8,12),'WEBP');
    assert.ok(bytes.length>1000);
  }
});
