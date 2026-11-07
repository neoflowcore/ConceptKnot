/* ConceptKnot v115 — source & browser-event smoke checks.
 * Run manually: node --test tests/v115-mobile-qa-storage.test.cjs
 * Never executed by GitHub Actions (no workflow configured).
 */
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const read=p=>fs.readFileSync(path.resolve(__dirname,'..',p),'utf8');

test('header is anchored from first paint and drag script is loaded, not merely precached',()=>{
 const html=read('index.html');
 assert.match(html,/class="ck-v7-global-nav ck105-anchored-tools"/);
 assert.match(html,/class="ck-v7-nav-pill ck4-unified"/);
 assert.match(html,/<\/nav>\s*<\/div><div class="ck-v7-date-pill">/);
 assert.match(html,/<script src="\.\/assets\/ck-nav-drag-v56\.js\?v=115" defer><\/script>/);
 assert.match(html,/data-ck56-nav-style="1"/);
 assert.match(html,/ck-manual-qa-v115\.js\?v=130/);
 assert.match(html,/ck-manual-qa-v115\.css\?v=115/);
 assert.match(html,/ck-full-exam-v82\.js\?v=134/);
 assert.match(html,/ck-data-integrity-v86\.js\?v=120/);
});

test('mobile swipe, rapid intentional tap, retarget click and ribbon replacement are isolated',()=>{
 let active=null,observer=null,now=1000;
 const frames=[];
 const main={querySelector:()=>active};
 const document={
  querySelector:()=>({}),getElementById:id=>id==='main'?main:null
 };
 const window={matchMedia:()=>({matches:false})};
 class Resizer{constructor(callback){this.callback=callback}observe(){}disconnect(){}}
 class Mutator{constructor(callback){observer=callback}observe(){}}
 const sandbox={window,document,ResizeObserver:Resizer,MutationObserver:Mutator,
  requestAnimationFrame:fn=>(frames.push(fn),frames.length),
  cancelAnimationFrame(){},setTimeout(){},performance:{now:()=>now}};
 function mk(offset=620){
  const events={};
  const pill={scrollLeft:0,scrollWidth:1020,clientWidth:300,isConnected:true,
   classList:{add(){},remove(){}},contains:t=>t?.pill===pill,
   addEventListener:(name,cb)=>((events[name]??=[]).push(cb)),
   querySelector:sel=>sel==='.board-tabs'?{}:sel==='.ck-v7-logo'?{}:
    sel==='.board-tab.active'?tab:null,
   querySelectorAll:sel=>sel==='.board-tab[data-go]'?[tab]:[],
   getBoundingClientRect:()=>({left:0,right:300}),
   fire(name,props={}){
    const e={pointerId:11,pointerType:'touch',clientX:95,clientY:50,
     button:0,detail:1,target:tab,
     preventDefault(){this.prevented=true},stopImmediatePropagation(){this.stopped=true},
     ...props};
    for(const handler of events[name]||[]){if(e.stopped)break;handler(e)}
    return e;
   }};
  const tab={pill,dataset:{go:'wrong'},
   closest:s=>s==='[data-go]'||s==='.board-tab[data-go]'?tab:null,
   getBoundingClientRect:()=>({left:offset-pill.scrollLeft,right:offset-pill.scrollLeft+60})};
  return {pill,tab};
 }
 const first=mk(590),second=mk(620);active=first.pill;
 vm.runInNewContext(read('assets/ck-nav-drag-v56.js'),sandbox);
 first.pill.scrollLeft=510;first.pill.fire('scroll');
 const position=first.tab.getBoundingClientRect().left;
 first.pill.fire('pointerdown',{target:first.tab,clientX:96});
 first.pill.fire('pointerup',{target:first.tab,clientX:97});
 first.pill.fire('click',{target:first.tab});
 first.pill.isConnected=false;active=second.pill;observer();
 while(frames.length){for(const fn of frames.splice(0))fn(now)}
 assert.equal(second.tab.getBoundingClientRect().left,position);
 now=2000;
 second.pill.fire('pointerdown',{target:second.tab,clientX:100});
 second.pill.fire('pointerup',{target:second.tab,clientX:101});
 const home={dataset:{go:'home'},closest:()=>home};
 assert.equal(second.pill.fire('click',{target:home}).prevented,true);
 second.pill.fire('pointerdown',{target:second.tab,clientX:100});
 second.pill.fire('pointermove',{target:second.tab,clientX:12,clientY:52});
 second.pill.scrollLeft=330;second.pill.fire('scroll');
 second.pill.fire('pointerup',{target:second.tab,clientX:12,clientY:52});
 assert.equal(second.pill.fire('click',{target:second.tab}).stopped,true);
 now+=30; // A genuinely new touch starts before the old 380ms window finishes.
 second.pill.fire('pointerdown',{target:second.tab,clientX:90});
 second.pill.fire('pointerup',{target:second.tab,clientX:91});
 assert.notEqual(second.pill.fire('click',{target:second.tab}).stopped,true);
 // A tab pointer-down can be re-targeted to the logo/empty rail after a layout shift.
 second.pill.fire('pointerdown',{target:second.tab,clientX:90});
 second.pill.fire('pointerup',{target:second.tab,clientX:91});
 const unrelated={closest:()=>null};
 const accidental=second.pill.fire('click',{target:unrelated});
 assert.equal(accidental.prevented,true,'re-targeted logo click should not navigate home');
 assert.equal(accidental.stopped,true);
 const third=mk(620);second.pill.isConnected=false;active=third.pill;observer();
 while(frames.length){for(const fn of frames.splice(0))fn(now)}
 assert.equal(third.pill.scrollLeft,330);
});

test('router blocks unpersisted navigation and pen teardown; direct official deep-link re-renders same tab',()=>{
 const html=read('index.html'),from=html.indexOf('function ck115CanLeave()');
 const to=html.indexOf('function filteredTheory()',from);
 assert.ok(from>0&&to>from);
 const state={view:'home'},names={home:'HOME',wrong:'WRONG'};
 let saves=0,renders=0,pens=0,ok=true,qa=true;
 const window={CK78Analysis:{hasUnsavedNote:()=>false},CK115QA:{flush:()=>qa},
  CK80Editorial:{hasUnsavedChanges:()=>false},CK83Links:{getStatus:()=>({unsavedEdits:0})},
  matchMedia:()=>({matches:true}),dispatchEvent:e=>{
   if(e.type==='ck:pen-deactivate')pens++;
  },scrollTo(){}};
 const document={documentElement:{classList:{remove(){},add(){}}},
  body:{dataset:{ckV8Tab:'home'}}};
 const get=new Function('window','document','state','names','save','render','toast','$','Event',
  'setTimeout','clearTimeout',html.slice(from,to)+';return changeView');
 const route=get(window,document,state,names,()=>{saves++;return ok},
  ()=>renders++,()=>{},()=>null,function E(type){this.type=type},()=>0,()=>{});
 qa=false;assert.equal(route('wrong'),false);assert.equal(pens,0);
 qa=true;ok=false;assert.equal(route('wrong'),false);assert.equal(state.view,'home');
 ok=true;assert.equal(route('wrong'),true);assert.equal(state.view,'wrong');
 assert.equal(pens,1);assert.equal(renders,1);
 const start=html.indexOf('window.CK76Study=Object.freeze({');
 const end=html.indexOf('\nfunction render(){',start);
 assert.ok(start>0&&end>start);
 const examState={view:'exam',year:2025,subject:'estate',examQuestion:1};
 const examWindow={RECALL_OFFICIAL:{'2024-56':{verified:true,subject:'civil'}},
  scrollTo(){},dispatchEvent(e){if(e.type==='ck:pen-deactivate')penCleanups++}};
 let rerenders=0,commits=0,penCleanups=0;
 new Function('window','state','save','render','ck115CanLeave','changeView','Event',
  html.slice(start,end))(examWindow,examState,()=>{commits++;return true},
   ()=>rerenders++,()=>true,()=>{throw Error('should remain in exam')},
   function E(type){this.type=type});
 assert.equal(examWindow.CK76Study.openQuestion(2024,56),true);
 assert.equal(examState.subject,'civil');assert.equal(examState.examQuestion,56);
 assert.equal(commits,1);assert.equal(rerenders,1);assert.equal(penCleanups,1);
});

test('mock exam detects same-revision cross-tab edits and deletion without overwriting',()=>{
 const bank={};
 for(let i=1;i<=80;i++)bank['2025-'+i]={
  verified:true,question:'Q'+i,subject:i<=40?'estate':'civil',
  options:['a','b','c','d','e'],correct:[2]};
 const window={RECALL_OFFICIAL:bank,addEventListener(){}};
 const document={readyState:'loading',hidden:false,addEventListener(){},
  getElementById(){return null},body:{classList:{remove(){}}}};
 const storage=new Map(),localStorage={
  getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)};
 vm.runInNewContext(read('assets/ck-full-exam-v82.js'),{
  window,document,localStorage,requestAnimationFrame:()=>1,
  setTimeout:()=>1,setInterval:()=>1,Blob:function(){},URL:{createObjectURL(){}}});
 const api=window.CK82FullExam;
 assert.equal(api.start(2025),true);
 assert.equal(api.setAnswer(3),true);
 const key='ck82-exam-sessions-v1',raw=JSON.parse(storage.get(key));
 raw.active.answers[0]=4;
 storage.set(key,JSON.stringify(raw));
 assert.equal(api.setAnswer(1),false);
 assert.equal(JSON.parse(storage.get(key)).active.answers[0],4);
 assert.equal(api.setAnswer(1),true);
 storage.delete(key);
 assert.equal(api.setAnswer(5),false);
 assert.equal(storage.has(key),false);
});

test('extended manual QA checks are schema validated and may join the guarded JSON backup',()=>{
 const window={addEventListener(){}},document={
  readyState:'loading',addEventListener(){},getElementById(){return null}};
 const localStorage={getItem(){return null},setItem(){}};
 vm.runInNewContext(read('assets/ck-manual-qa-v115.js'),
  {window,document,localStorage,requestAnimationFrame:()=>1});
 vm.runInNewContext(read('assets/ck-data-integrity-v86.js'),
  {window,localStorage});
 const key='ck115-manual-device-verification-v1';
 assert.equal(window.CK115QA.tasks.length,28);
 const valid={schemaVersion:1,scope:'personal-v115-manual-qa',updatedAt:0,
  entries:{tabs:{status:'fail',note:'360px · wrong tab'}}};
 assert.ok(window.CK115QA.sanitize(valid));
 assert.equal(window.CK86Integrity.validateExtra(key,JSON.stringify(valid)),true);
 const invalid={...valid,entries:{tabs:{status:'pass-by-ai',note:'unverified'}}};
 assert.equal(window.CK115QA.sanitize(invalid),null);
 assert.equal(window.CK86Integrity.validateExtra(key,JSON.stringify(invalid)),false);
 const defaults={subject:'estate',answers:{},quizAnswers:{},flashVisits:{}};
 const payload={...defaults,__ck79Extras:{format:1,local:{[key]:JSON.stringify(valid)}}};
 const prepared=window.CK86Integrity.stage(payload,defaults,[key]);
 assert.equal(prepared.entries.length,1);
 const memory=new Map(),storage={getItem:k=>memory.get(k)??null,
  setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)};
 assert.equal(window.CK86Integrity.apply(prepared,storage).ok,true);
 assert.ok(memory.has('recallgraph-first-exam-v1'));
 assert.ok(memory.has(key));
});

test('offline v115 assets, guarded restore and manual-only deployment configuration',()=>{
 const html=read('index.html'),sw=read('sw.js'),config=JSON.parse(read('vercel.json'));
 assert.equal(config.git.deploymentEnabled,false);
 for(const asset of ['ck-nav-drag-v56.js?v=128','ck-study-links-v83.js?v=115',
  'ck-full-exam-v82.js?v=134','ck-manual-qa-v115.js?v=130',
  'ck-manual-qa-v115.css?v=115','ck-data-integrity-v86.js?v=120',
  'ck-pdf-workspace-v15.js?v=118']){
  assert.ok(html.includes(asset),'HTML: '+asset);
  assert.ok(sw.includes(asset.split('?')[0]),'SW (current version may differ from HTML URL): '+asset);
 }
 assert.match(sw,/conceptknot-study-v129/);
 const pdfIndex=[...html.matchAll(/ck-pdf-workspace-v15\.js(?:\?v=\d+)?/g)].map(x=>x[0]);
 const pdfCache=[...sw.matchAll(/ck-pdf-workspace-v15\.js(?:\?v=\d+)?/g)].map(x=>x[0]);
 assert.deepEqual(pdfIndex,['ck-pdf-workspace-v15.js?v=118']);
 assert.equal(pdfCache.length,2);
 assert.ok(pdfCache.every(x=>x==='ck-pdf-workspace-v15.js?v=118'));
 assert.match(read('assets/ck-study-links-v83.js'),/if\(year\)year.value=parts\[0\]/);
 assert.match(html,/ck115CanLeave\(\)/);
 assert.match(html,/CK115QA\?\.flush\?\.\(\)===false/);
 if(fs.existsSync(path.resolve(__dirname,'../.github/workflows')))
  assert.equal(fs.readdirSync(path.resolve(__dirname,'../.github/workflows')).length,0);
});
