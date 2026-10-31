'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8'),script=fs.readFileSync('assets/ck-note-context-v64.js','utf8'),css=fs.readFileSync('assets/ck-note-context-v64.css','utf8'),sw=fs.readFileSync('sw.js','utf8');
test('note menu embedded script and source match; every inline script parses',()=>{
 const segment=html.split('/* CK64 selection menu: executes inside the study engine lexical scope. */')[1]?.split('render();setInterval(timerTick,500);')[0];
 assert.equal(segment.trim(),script.trim());
 for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
 new vm.Script(script);
});
test('selected characters have persistent bold and custom color arrays with edit reconciliation',()=>{
 assert.match(html,/r\.ck64BoldChars=chalkReconcile\(r\.text,text/);
 assert.match(html,/r\.ck64ColorHex=chalkReconcile\(r\.text,text/);
 assert.match(script,/selection\.from/);assert.match(script,/selection\.to/);
 assert.match(script,/const previousPaint=chalkPaint/);
 assert.match(script,/span\.classList\.add\('ck64-selection-bold'\)/);
 assert.match(script,/span\.style\.setProperty\('color',hex,'important'\)/);
 assert.match(css,/-webkit-text-stroke:\.68px/);
});
test('menu actions operate on a selection only and do not intercept SPen',()=>{
 assert.match(script,/if\(!Number\.isInteger\(from\)\|\|!Number\.isInteger\(to\)\|\|from===to\)return/);
 assert.match(script,/area\.closest\('\.ck9-spen-active'\)/);
 for(const action of ['bold','copy','paste','close'])assert.match(script,new RegExp("data-ck64-action="+String.fromCharCode(34)+action));
 assert.match(script,/navigator\.clipboard\.writeText/);
 assert.match(script,/navigator\.clipboard\.readText/);
 assert.match(script,/setRangeText\(text,sel\.from,sel\.to,'end'\)/);
 assert.match(script,/dispatchEvent\(new Event\('input'/);
 assert.match(script,/Ctrl\+C/);assert.match(script,/Ctrl\+V/);
 assert.match(script,/event\.key==='Escape'/);
});
test('theme, menu position and offline cache are wired',()=>{
 assert.match(css,/html\[data-ck-theme="dark"\]/);
 assert.match(css,/position:fixed!important/);
 assert.match(script,/requestId\+\+/);
 assert.match(script,/placeMenu\(event\)/);
 assert.match(html,/ck-note-context-v64\.css\?v=64/);
 assert.match(sw,/conceptknot-study-v72-note-context/);
 assert.match(sw,/ck-note-context-v64\.css\?v=64/);
 assert.equal(JSON.parse(fs.readFileSync('vercel.json','utf8')).git.deploymentEnabled,false);
});