/* ConceptKnot v132 landing lifecycle regression; manual/offline Node only.
 * Tests a STUDY-first initial route, later logo return and dynamic import integrity.
 * Does NOT claim a real Brave/Android graphics or GPU measurement.
 */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const DOT=read('assets/ck-dot-landing-v57.js'),GARDEN=read('assets/ck-garden-25d-v36.js');
const BOOT_START=DOT.indexOf('let booted = false;'),BOOT_END=DOT.indexOf("\n  if (document.readyState === 'loading')",BOOT_START);
function harness(initialView='home',existing=false){
 assert.ok(BOOT_START>=0&&BOOT_END>BOOT_START);
 const source=DOT.slice(BOOT_START,BOOT_END);
 let host=existing?{id:'ck-v8-ambient',className:'ck-v8-ambient',dataset:{},setAttribute(){}}:null;
 const calls={prepend:0,scene:0,layout:0,paint:0,sync:0};
 const listeners={};
 const document={hidden:false,body:{dataset:{ckV8Tab:initialView},prepend(node){host=node;calls.prepend++;}},
  getElementById:id=>id==='ck-v8-ambient'?host:null,
  createElement:tag=>({tagName:tag,dataset:{},setAttribute(k,v){this[k]=v;}}),
  addEventListener(){}};
 const window={addEventListener:(name,fn)=>{listeners[name]=fn;}};
 const state={host:null,apples:[],smallClouds:[],noteTufts:[],edgeDots:[]};
 const factory=new Function('document','window','state','addStyle','scene','layout','paint',
  'ResizeObserver','MutationObserver','sync','reduced','cancelAnimationFrame',source+'return boot;');
 const boot=factory(document,window,state,()=>{},()=>{calls.scene++;},
  ()=>{calls.layout++;},()=>{calls.paint++;},class{observe(){}},class{observe(){}},
  ()=>{calls.sync++;state.active=document.body.dataset.ckV8Tab==='landing';},
  {addEventListener(){}},()=>{});
 return {boot,calls,document,window,state,listeners,get host(){return host;}};
}
test('home-first load creates the ambient host before the logo is clicked',()=>{
 const h=harness('home');h.boot();
 assert.equal(h.host?.id,'ck-v8-ambient');
 assert.equal(h.host?.className,'ck-v8-ambient');
 assert.equal(h.host?.['aria-hidden'],'true');
 assert.equal(h.calls.prepend,1);
 assert.equal(h.calls.scene,1);
 assert.equal(h.state.active,false);
});
test('logo return resumes the initialized landing scene without second mount',()=>{
 const h=harness('home');h.boot();h.document.body.dataset.ckV8Tab='landing';
 h.listeners['ck:scene-activity']();
 assert.equal(h.state.active,true);assert.equal(h.calls.scene,1);
 assert.equal(h.calls.sync,2);
});
test('first navigation directly to landing still boots exactly once',()=>{
 const h=harness('landing');h.boot();h.boot();
 assert.equal(h.calls.scene,1);assert.equal(h.calls.prepend,1);
 assert.equal(h.state.active,true);
});
test('existing host is reused and not placed in DOM twice',()=>{
 const h=harness('home',true);h.boot();h.boot();
 assert.equal(h.calls.prepend,0);assert.equal(h.calls.scene,1);
});
test('fallback garden also constructs the scene host if Dot import fails',()=>{
 assert.match(GARDEN,/if\(!host&&document\.body\)/);
 assert.match(GARDEN,/document\.body\.prepend\(host\)/);
 assert.match(GARDEN,/import\('\.\/ck-dot-landing-v57\.js\?v=132'\)/);
 new vm.Script(GARDEN);
 new vm.Script(DOT);
});
test('homepage search remains a real keyboard/click launcher',()=>{
 const search=read('assets/ck-study-p6-v76.js');
 assert.match(DOT,/ck-dot-search-placeholder/);
 assert.match(DOT,/setAttribute\('role', 'button'\)/);
 assert.match(DOT,/setAttribute\('tabindex', '0'\)/);
 assert.match(search,/ck-dot-search-placeholder/);
 assert.match(search,/event\.key==='Enter'|includes\(event\.key\)/);
});
test('HTML/SW/cache use the same v132 import and no auto CI',()=>{
 const html=read('index.html'),sw=read('sw.js'),diag=read('assets/ck-data-diagnostics-v88.js');
 const vc=JSON.parse(read('vercel.json'));
 assert.match(html,/ck-garden-25d-v36\.js\?v=132/);
 assert.match(sw,/ck-garden-25d-v36\.js\?v=132/);
 assert.match(sw,/ck-dot-landing-v57\.js\?v=132/);
 assert.match(sw,/conceptknot-study-v134-exam-keyboard/);
 assert.match(diag,/conceptknot-study-v134-exam-keyboard/);
 assert.equal(vc.git.deploymentEnabled,false);
 assert.equal(fs.existsSync(path.join(ROOT,'.github/workflows')),false);
});
