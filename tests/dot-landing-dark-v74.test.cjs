'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const html=read('index.html'),css=read('assets/ck-dot-landing-dark-v74.css'),sw=read('sw.js');
test('dark landing is a charcoal canvas with medium gray stipple',()=>{
 assert.match(css,/--ck74-night-paper:#111518/);
 assert.match(css,/--ck74-night-ink:#737b80/);
 assert.match(css,/html\[data-ck-theme="dark"\] body\[data-ck-v8-tab="landing"\]/);
 assert.match(css,/\.ck-dot-backdrop:not\(\.ck-dot-fallback\)/);
 assert.match(css,/filter:brightness\(0\) invert\(\.55\)/);
 assert.match(css,/mix-blend-mode:screen/);
 assert.match(css,/\.ck-dot-lawn > path:first-of-type/);
 assert.match(css,/\.ck-dot-orbit-rail/);
 assert.match(css,/\.ck-dot-flower/);
});
test('dark-mode overrides are entirely theme scoped and preserve fruit colors',()=>{
 const blocks=css.split('}').map(x=>x.trim()).filter(x=>x.includes('{'));
 for(const b of blocks){if(b.startsWith('@media')||b.startsWith('/*'))continue;assert.match(b,/html\[data-ck-theme="dark"\]/);}
 assert.match(css,/\.ck-dot-apple > path:nth-of-type\(2\)/);
 assert.doesNotMatch(css,/\.ck-dot-apple\s*\{\s*filter:invert/);
});
test('theme is initialized before CSS to prevent a white initial frame',()=>{
 const initial=html.indexOf('id="ck74-theme-before-paint"');
 assert.ok(initial>0&&initial<html.indexOf('ck-dot-landing-v57.css'));
 assert.match(html,/ck-dot-landing-dark-v74\.css\?v=74/);
 assert.match(sw,/conceptknot-study-v74-dot-dark/);
 assert.match(sw,/ck-dot-landing-dark-v74\.css\?v=74/);
 for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
 new vm.Script(sw);
 assert.equal(JSON.parse(read('vercel.json')).git.deploymentEnabled,false);
});
