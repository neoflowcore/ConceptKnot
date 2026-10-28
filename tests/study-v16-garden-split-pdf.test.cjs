'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('index.html'),nav=read('assets/ck-navigation-v5.js'),
 css=read('experience-v16.css'),split=read('assets/ck-layout-v16.js'),
 land=read('assets/ck-landscape3d.js'),lion=read('assets/ck-pointing-cub-v16.js'),
 sw=read('sw.js'),vercel=JSON.parse(read('vercel.json'));
test('logo opens separate landing scene; Today tab opens cards',()=>{
 assert.match(html,/landing:'CONCEPTKNOT 첫 화면'/);
 assert.match(html,/view:'landing'/);
 assert.match(html,/renderers=\{landing:\(\)=>'',home:renderHome/);
 assert.match(html,/class="ck-v7-logo" data-go="landing"/);
 assert.match(html,/\['home','오늘의 학습'\]/);
 assert.match(nav,/\['landing','CONCEPTKNOT'\],\['home','오늘의 학습'\]/);
 assert.match(nav,/if\(id==='landing'\)/);
 assert.doesNotMatch(nav,/e\.stopPropagation\(\);homeToStudy=false/);
 assert.match(css,/body\[data-ck-v8-tab="landing"\] #main \.ck-v7-stage/);
});
test('cards float up through a Gaussian glass panel, background stays mounted',()=>{
 assert.match(html,/document\.documentElement\.classList\.add\('ck16-reveal'\)/);
 assert.doesNotMatch(html,/document\.startViewTransition\(commit\)/);
 assert.match(css,/ck16-sheet-rise \.52s/);
 assert.match(css,/translate3d\(0,69px,0\)/);
 assert.match(css,/backdrop-filter:blur\(19px\)/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(nav,/view\(\)!=='landing'/);
});
test('independent red pencil lion models a real press cycle on 3D scene',()=>{
 assert.match(land,/import \{ buildSleepingCub \}/);
 assert.match(land,/import \{ buildPencilCub \}/);
 assert.match(land,/scenes\.pressCub=buildPencilCub/);
 assert.match(land,/scenes\.pressCub\?\.animate\(playTime\)/);
 assert.match(lion,/CylinderGeometry\(\.195,\.195,1\.02,6\)/);
 assert.match(lion,/stub\.position\.y=1\.17-\.14\*push/);
 assert.match(lion,/Math\.sin\(cycle\)/);
 assert.match(lion,/pencilPointingDown:true/);
});
test('two-card panels get a light gray accessible draggable divider',()=>{
 assert.match(html,/data-ck16-split-grid="exam"/);
 assert.match(html,/data-ck16-split aria-label="PDF와 OMR 카드 좌우 너비 조절"/);
 assert.match(split,/\.exam-layout,\.dashboard-grid,\.theory-layout,\.settings-grid,\.compact-grid,\.quiz-layout/);
 assert.match(split,/setPointerCapture/);
 assert.match(split,/aria-valuenow/);
 assert.match(split,/localStorage\.setItem\(PREFIX/);
 assert.match(split,/e\.stopImmediatePropagation\(\)/);
 assert.match(css,/ck16-column-divider::before/);
 assert.match(css,/grid-template-columns:minmax\(0,var\(--ck16-left,55%\)\) 12px minmax\(0,1fr\)/);
});
test('2016–2025 official PDFs have fixed host allowlist, same-origin path and browser fallback',()=>{
 assert.equal(vercel.git.deploymentEnabled,false);
 assert.equal(vercel.rewrites.length,10);
 const years=vercel.rewrites.map(r=>Number(r.source.split('/').pop())).sort((a,b)=>a-b);
 assert.deepEqual(years,Array.from({length:10},(_,i)=>2016+i));
 for(const r of vercel.rewrites){
  assert.match(r.source,/^\/exam-pdf\/20(1[6-9]|2[0-5])$/);
  assert.match(r.destination,/^https:\/\/gosi24\.com\/wp-content\/uploads\/2026\/10\/20\d\d-exam-2996-[a-z0-9]+\.pdf$/);
 }
 assert.match(html,/data-ck15-pdf-source=".*\/exam-pdf\/\$\{yr\}/);
 assert.match(html,/iframe title="\$\{yr\}년 원문 PDF 기본 보기"/);
});
test('new modules and inline scripts parse and SW cache is upgraded',()=>{
 new vm.Script(split);
 const threeModule=land.replace(/^import .*;$/gm,'');
 new vm.Script(threeModule);
 new vm.Script(lion.replace('export function','function'));
 for(const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(match[1]);
 assert.match(sw,/conceptknot-study-v16/);
 assert.match(sw,/experience-v16\.css/);
 assert.match(sw,/ck-pointing-cub-v16\.js/);
 assert.match(sw,/ck-layout-v16\.js/);
});
