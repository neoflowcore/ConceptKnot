'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=path=>fs.readFileSync(path,'utf8');
const html=read('index.html');
const css=read('assets/ck-board-compact-v63.css');
const sw=read('sw.js');
test('notes start at regular font weight and B is the only explicit bold switch',()=>{
 assert.match(html,/ck10FontSize:18,ck63NoteBold:false/);
 assert.match(html,/state\.ck63NoteBold=state\.ck63NoteBold===true/);
 assert.match(html,/ck-v7-board \$\{state\.ck63NoteBold\?'ck63-note-bold '/);
 assert.match(html,/class="ck63-bold-toggle"/);
 assert.match(html,/data-ck63-note-bold aria-label="칠판 글씨 굵게"/);
 assert.match(css,/--ck63-note-weight:400/);
 assert.match(css,/--ck63-note-weight:700/);
 assert.match(css,/\.chalk-editor textarea,[\s\S]*?font-weight:var\(--ck63-note-weight,400\)!important/);
 assert.match(css,/\.chalk-mirror \.chalk-letter/);
});
test('B click toggles live DOM and saved preference without rerender or touching note text',()=>{
 const start=html.indexOf('  // Note typography is a presentation preference.');
 const end=html.indexOf("  document.documentElement.style.setProperty('--ck10-chalk-font'",start);
 assert.ok(start>0&&end>start);
 const listeners=[],events=[],classes=new Set(),attrs={};
 let saved=0,focus=0;const state={ck63NoteBold:false,ck9SpenMode:false,memo:'보존'};
 const field={focus(options){assert.equal(options.preventScroll,true);focus++}};
 const board={classList:{toggle(cls,on){on?classes.add(cls):classes.delete(cls)}},querySelector(sel){assert.match(sel,/textarea/);return field}};
 const button={closest(sel){assert.equal(sel,'.ck-v7-board');return board},
  setAttribute(k,v){attrs[k]=v}};
 const document={addEventListener(name,cb,capture){listeners.push({name,cb,capture})},
  dispatchEvent(e){events.push(e.type)}};
 const ctx={document,state,save(){saved++},Event:class{constructor(type){this.type=type;}}};
 vm.runInNewContext(html.slice(start,end),ctx);
 assert.equal(listeners.length,1);assert.equal(listeners[0].capture,true);
 function click(){const call=()=>{let prevention=0,stop=0;
  listeners[0].cb({target:{closest:sel=>sel==='[data-ck63-note-bold]'?button:null},
   preventDefault(){prevention++},stopImmediatePropagation(){stop++}});
  assert.equal(prevention,1);assert.equal(stop,1);};call();}
 click();assert.equal(state.ck63NoteBold,true);
 assert.equal(attrs['aria-pressed'],'true');assert(classes.has('ck63-note-bold'));
 click();assert.equal(state.ck63NoteBold,false);
 assert.equal(attrs['aria-pressed'],'false');assert(!classes.has('ck63-note-bold'));
 assert.equal(state.memo,'보존');assert.equal(saved,2);
 assert.equal(focus,2);assert.deepEqual(events,['selectionchange','selectionchange']);
 state.ck9SpenMode=true;click();assert.equal(focus,2,'SPen should not steal keyboard focus');
});
test('board header disappears at actual board width without removing export functionality',()=>{
 assert.match(css,/container:ck63-board \/ inline-size/);
 assert.match(css,/@container ck63-board \(max-width:275px\)/);
 assert.match(css,/\.ck-v7-board-caption,[\s\S]*?\.ck21-board-title-row,[\s\S]*?\.ck-v7-board-small\{[\s\S]*?display:none!important/);
 assert.match(html,/data-ck-v7-command="txt"/);
 assert.match(html,/data-ck-v7-command="pdf"/);
 assert.match(html,/ck-v7-board-heading/);
 assert.match(html,/const min=86;/,'extreme drag range remains available');
});
test('compact toolbar wraps without horizontal scrolling; font slider is last',()=>{
 assert.match(css,/flex-wrap:wrap!important/);
 assert.match(css,/overflow:visible!important/);
 assert.match(css,/scrollbar-width:none!important/);
 assert.match(css,/\.ck-v7-toolrow \.ck10-font\{[\s\S]*?order:99!important/);
 assert.match(css,/@container ck63-board \(max-width:156px\)/);
 assert.match(css,/\.ck-v7-writing-surface\s*\{[\s\S]*?overflow-x:hidden!important/);
 const start=html.indexOf('class="ck-v7-toolrow ck21-toolrow"');
 const end=html.indexOf('</div>',start);
 assert.ok(start>0&&end>start);
 const toolbar=html.slice(start,end);
 const font=toolbar.indexOf('data-ck10-font');
 const json=toolbar.indexOf('data-ck-v7-command="export"');
 const bold=toolbar.indexOf('data-ck63-note-bold');
 const spen=toolbar.indexOf('data-ck9-spen="toggle"');
 assert.ok(spen>=0&&bold>spen,'B stays beside S Pen');
 assert.ok(font>json,'slider is AFTER other functions');
 assert.match(css,/ck21-spen-tools:not\(\[hidden\]\) label/);
});
test('no global automatic deployments or binary artifacts',()=>{
 assert.match(html,/ck-board-compact-v63\.css\?v=63/);
 assert.match(sw,/conceptknot-study-v71-note-compact/);
 assert.match(sw,/ck-board-compact-v63\.css\?v=63/);
 assert.equal(JSON.parse(read('vercel.json')).git.deploymentEnabled,false);
 for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)){
  new vm.Script(m[1]);
 }
 new vm.Script(sw);
});
