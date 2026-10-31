'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8'),menu=fs.readFileSync('assets/ck-note-context-v64.js','utf8');
const skin=fs.readFileSync('assets/ck-board-stability-v65.css','utf8');
const theme=fs.readFileSync('assets/ck-experience-v14.js','utf8'),mobile=fs.readFileSync('assets/ck-mobile-board-v21.js','utf8');
test('menu stays open for successive bold/color/copy actions',()=>{
 assert.match(menu,/data-ck64-action="done"/);assert.match(menu,/data-ck65-drag-handle/);
 assert.doesNotMatch(menu,/repaint\(\);restore\(\);close\(\)/);
 assert.match(menu,/굵게 적용됨/);assert.match(menu,/색상 변경 완료/);assert.match(menu,/복사 완료/);
 assert.match(menu,/window\.addEventListener\('pointermove',onDragMove/);
 assert.match(menu,/setRangeText\(text,sel\.from,sel\.to,'end'\)/);
});
test('typing does not recreate board canvas unless dimensions actually change',()=>{
 assert.match(html,/if\(canvas\.width===w&&canvas\.height===h\)return/);
 assert.match(skin,/backdrop-filter:none!important/);
 assert.match(skin,/data-ck-v8-tab="typing"/);
});
test('observers ignore nested typing mirror changes',()=>{
 assert.match(theme,/record\.target===main&&record\.type==='childList'/);
 assert.match(mobile,/r\.target===main/);
 assert.doesNotMatch(mobile,/subtree:true/);
});
test('inline code, service worker and deployed assets parse and match',()=>{
 assert.equal(html.split('CK64 selection menu: executes inside the study engine lexical scope. */')[1].split('render();setInterval(timerTick,500);')[0].trim(),menu.trim());
 for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new Function(m[1]);
 for(const code of [menu,theme,mobile,fs.readFileSync('sw.js','utf8')])new Function(code);
 assert.match(fs.readFileSync('sw.js','utf8'),/conceptknot-study-v73-board-stability/);
 assert.equal(JSON.parse(fs.readFileSync('vercel.json','utf8')).git.deploymentEnabled,false);
});
