/* v128 typed-caret & low-GPU lifecycle checks. Execute manually:
 * node --test tests/v128-typing-viewport-gpu.test.cjs
 * No browser hardware claims, CI workflows, builds or network access.
 */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const BASE=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(BASE,p),'utf8');
const html=read('index.html'),source=read('assets/ck-typing-layout-v31.js'),gpu=read('assets/ck-gpu-guard-v21.js');
function painters(){
 const start=source.indexOf('function paintNormal('),end=source.indexOf('typingGhost=function',start);
 assert.ok(start>0&&end>start);
 const cache=new WeakMap(),lookup=[];
 const locateLine=(mirror,selector)=>{
  lookup.push(selector);return {rect:{left:30,right:60},base:{left:10},height:24,top:4};
 };
 const pure=new Function('mirrorCache','caretIndex','locateLine','esc','glyphClass','printable','document',
  source.slice(start,end)+'return {paintNormal,paintLetters};');
 const fun=pure(cache,area=>area.selectionStart,locateLine,s=>String(s),()=>'ck62-char',
  /^[\p{L}\p{M}\p{Nd}]$/u,{createElement:()=>({dataset:{}})});
 return {cache,lookup,...fun};
}
test('standalone and embedded typing implementations stay byte-for-byte identical',()=>{
 assert.ok(html.includes(source),'runtime uses the inlined source, not standalone file');
 assert.equal(html.split(source).length-1,1);
 new vm.Script(source);
});
test('normal typing caret is remeasured when viewport width changes but text does not',()=>{
 const {cache,lookup,paintNormal}=painters();
 const mirror={clientWidth:300,innerHTML:'',style:{setProperty(){}},
  querySelectorAll:()=>[],
  querySelector:selector=>selector==='.ck62-live'?{insertBefore(){},appendChild(){}}:
   selector==='[data-ck62-anchor]'?{}:null};
 const input={value:'AB',selectionStart:2};
 const model={target:['A','B'],typed:['A','B'],mapped:new Map([[0,{ok:true}],[1,{ok:true}]])};
 paintNormal(model,mirror,input,'q');
 cache.get(mirror).layoutWidth=300;
 const first=lookup.length;
 mirror.clientWidth=220;
 paintNormal(model,mirror,input,'q');
 assert.equal(lookup.length,first+1);
});
test('letters-only typing caret reflows after responsive wrap without new keystrokes',()=>{
 const {cache,lookup,paintLetters}=painters();
 const mirror={clientWidth:300,innerHTML:'',style:{setProperty(){}},
  querySelectorAll:()=>[],querySelector:()=>null};
 const input={value:'A',selectionStart:1};
 const model={target:['A','B'],typed:['A'],positions:[0,1],mapped:new Map([[0,{ok:true,typed:'A'}]])};
 paintLetters(model,mirror,input,'q');
 cache.get(mirror).layoutWidth=300;
 const first=lookup.length;
 mirror.clientWidth=210;
 paintLetters(model,mirror,input,'q');
 assert.equal(lookup.length,first+1);
});
test('viewport and virtual keyboard resize schedule one caret refresh only in typing',()=>{
 const begin=source.indexOf('let ck31ResizeFrame=0;'),end=source.indexOf('window.CK31Typing=',begin);
 assert.ok(begin>0&&end>begin);
 const binds={},frames=[],typing={view:'typing'},editor={};
 let ghosts=0;
 const win={addEventListener:(event,fn)=>{binds[event]=fn},
  visualViewport:{addEventListener:(event,fn)=>{binds['visual-'+event]=fn}}};
 const doc={querySelector:()=>editor},raf=fn=>(frames.push(fn),frames.length);
 const get=new Function('window','document','requestAnimationFrame','state','typingGhost',
  source.slice(begin,end)+'return scheduleTypingCaretResize;');
 get(win,doc,raf,typing,()=>{ghosts++});
 binds.resize();binds['visual-resize']();
 assert.equal(frames.length,1,'one frame for simultaneous viewport events');
 frames.shift()();assert.equal(ghosts,1);
 typing.view='exam';binds.resize();assert.equal(frames.length,0);
});
test('background landing animation does not restart when a blurred window becomes visible',()=>{
 const events={},winEvents={},el={style:{},dataset:{},getAnimations:()=>[]};
 let hasFocus=false;
 const document={readyState:'complete',hidden:false,hasFocus:()=>hasFocus,
  body:{dataset:{ckV8Tab:'landing'},classList:{toggle(){}}},
  documentElement:{dataset:{}},
  getElementById:()=>el,addEventListener:(type,cb)=>{events[type]=cb}};
 const window={matchMedia:()=>({matches:false,addEventListener(){}}),
  addEventListener:(type,cb)=>{winEvents[type]=cb}};
 vm.runInNewContext(gpu,{window,document,MutationObserver:class{observe(){}}});
 assert.equal(window.CK21Garden.getState().active,false);
 hasFocus=true;winEvents.focus();assert.equal(window.CK21Garden.getState().active,true);
 hasFocus=false;winEvents.blur();events.visibilitychange();
 assert.equal(window.CK21Garden.getState().active,false);
 document.body.dataset.ckV8Tab='exam';
 winEvents['ck:scene-activity']();
 assert.equal(window.CK21Garden.getState().active,false);
});
test('v128 asset cache and service-worker runtime generation remain in sync',()=>{
 const sw=read('sw.js'),diag=read('assets/ck-data-diagnostics-v88.js');
 assert.match(sw,/conceptknot-study-v130-fixed-paper-integrity/);
 assert.match(diag,/conceptknot-study-v130-fixed-paper-integrity/);
 for(const name of ['ck-gpu-guard-v21.js?v=128','ck-manual-qa-v115.js?v=130',
  'ck-data-diagnostics-v88.js?v=130']){
  assert.ok(html.includes(name),'HTML missing '+name);
  assert.ok(sw.includes(name),'SW missing '+name);
 }
 assert.ok(html.includes(source));
});
test('manual verification and deployment economy are unchanged',()=>{
 const qa=read('assets/ck-manual-qa-v115.js');
 assert.equal((qa.match(/\{id:'[-a-z0-9]+',group:/g)||[]).length,28);
 assert.match(qa,/실기검증표 v129/);
 assert.equal(JSON.parse(read('vercel.json')).git.deploymentEnabled,false);
 assert.equal(fs.existsSync(path.join(BASE,'.github','workflows')),false);
});
