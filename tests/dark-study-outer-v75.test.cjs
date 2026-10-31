'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const css=read('assets/ck-dot-landing-dark-v74.css');
const html=read('index.html'),sw=read('sw.js');
test('every study tab uses the dark landing background when dark theme enabled',()=>{
 assert.match(css,/html\[data-ck-theme="dark"\] body:not\(\[data-ck-v8-tab="landing"\]\)\s*\{\s*background-color:var\(--ck74-night-paper,#111518\)!important;\s*background-image:none!important;/);
 assert.match(css,/--ck74-night-paper:#111518/);
});
test('light mode and interior card palettes are unchanged by the v75 patch',()=>{
 const last=css.split('/* v75 — Only the OUTSIDE background')[1];
 assert.ok(last);
 assert.doesNotMatch(last,/data-ck-theme="light"/);
 assert.doesNotMatch(last,/#main|\.ck-v7-content|\.ck-v7-nav-pill/);
 assert.match(read('assets/ck-theme-parity-v58.css'),/background-color:var\(--ck17-study-background,#A58A73\)!important/);
});
test('updated theme stylesheet is loaded after the old theme sheet and offline-cached',()=>{
 assert.ok(html.indexOf('ck-dot-landing-dark-v74.css?v=75')>html.indexOf('ck-theme-parity-v58.css'));
 assert.match(sw,/conceptknot-study-v75-study-charcoal/);
 assert.match(sw,/ck-dot-landing-dark-v74\.css\?v=75/);
 assert.equal(JSON.parse(read('vercel.json')).git.deploymentEnabled,false);
});