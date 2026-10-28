'use strict';
// Run manually with node tests/experience-v9.cjs; no CI workflows.
const assert=require('node:assert/strict'), fs=require('node:fs'), vm=require('node:vm'), path=require('node:path');
const root=path.resolve(__dirname,'..'),get=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=get('index.html'), scene=get('assets/ck-landscape3d.js'),loop=get('assets/ck-kinetic-garden-v8.js'),
 lion=get('assets/ck-sleeping-cub-v9.js'),clock=get('assets/ck-experience-v9.js'),
 nav=get('assets/ck-navigation-v5.js'),css=get('experience-v9.css'),sw=get('sw.js');
assert.match(html,/ck9SpenMode:false/);
assert.match(html,/data-ck9-spen="toggle"/);
assert.match(html,/data-ck9-spen-tool="highlighter"/);
assert.match(html,/data-ck9-spen-width/);
assert.match(html,/ctx\.globalAlpha=s\.tool==='highlighter'\?\.32:1/);
assert.match(html,/if\(state\.ck9SpenMode\)board\.querySelector/);
assert.match(html,/mobile\?'translate3d\(0,/);
assert.match(html,/experience-v9\.css/);
assert.match(html,/ck-experience-v9\.js/);
assert.match(nav,/if\(!isMobile\(\)\)return;/);
assert.match(nav,/touchstart/);
assert.match(nav,/touchend/);
assert.match(nav,/scrollableChild\(first\.target,dy\)/);
assert.match(clock,/timeZone:'Asia\/Seoul'/);
assert.match(clock,/ck9-second/);
assert.match(clock,/ck9-spen-fullscreen/);
assert.match(css,/--ck9-handle-width:19px/);
assert.match(css,/rotate\(90deg\)/);
assert.match(css,/\.ck9-spen-active/);
assert.match(scene,/buildSleepingCub/);
assert.match(scene,/nearestBall\(b\.beakWorld\)/);
assert.match(scene,/Math\.pow\(Math\.sin\(progress\*Math\.PI\),1\.1\)/);
assert.match(loop,/function nearestBall\(world\)/);
assert.match(lion,/function animate\(time\)/);
assert.match(lion,/freckle/);
assert.match(get('assets/ck-playground-fallback-v6.svg'),/ck9-sleeping-cub/);
assert.match(sw,/conceptknot-living-garden-v9/);
assert.match(sw,/ck-sleeping-cub-v9\.js/);
assert.match(sw,/ck-experience-v9\.js/);
assert.match(get('vercel.json'),/"deploymentEnabled": false/);
for(const [i,m] of [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].entries())
  new vm.Script(m[1],{filename:'inline-'+i+'.js'});
new vm.Script(nav);
new vm.Script(clock);
new vm.Script(scene.replace(/^import\s+.*?;\s*$/gm,''));
new vm.Script(loop.replace(/^export\s+/m,''));
new vm.Script(lion.replace(/^export\s+/m,''));
new vm.Script(sw);
assert.equal(fs.existsSync(path.join(root,'.github','workflows')),false);
console.log('PASS: analog clock, nearby-ball bird peck, sleeping cub with freckles, S Pen controls, mobile vertical swap, native desktop scroll, offline cache.');
