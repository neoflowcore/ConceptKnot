'use strict';
/* v102 non-destructive restore & cross-tab behavior. Manual Node tests only.
 * No browser, network, GitHub Actions, artifacts, or writes.
 */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const opts=['1','2','3','4','5'];
function mock(initial={}){
 const store=new Map(Object.entries(initial)),handlers={win:{},doc:{}};
 const localStorage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),
  removeItem:k=>store.delete(k)};
 const official={};
 for(let n=1;n<=4;n++)official['2025-'+n]={id:'2025-'+n,year:2025,number:n,
  subject:'estate',question:'Question '+n,options:opts,correct:[1],verified:true};
 const window={RECALL_OFFICIAL:official,addEventListener:(t,f)=>(handlers.win[t]??=[]).push(f),
  CK86ExamBridge:{getDue:()=>({rows:[],future:0})}};
 const document={readyState:'loading',getElementById:()=>null,querySelector:()=>null,
  addEventListener:(t,f)=>(handlers.doc[t]??=[]).push(f)};
 const ctx={window,document,localStorage,Date,Intl,Map,Set,JSON,Math,Promise,
  console:{warn(){}},setTimeout:()=>0,clearTimeout:()=>{},requestAnimationFrame:()=>{},
  Event:class Event{constructor(type){this.type=type}},fetch:async()=>{throw Error('unmocked fetch')}};
 return {ctx,window,document,localStorage,store,handlers,
  run:file=>vm.runInNewContext(read(file),ctx,{filename:file,timeout:1000})};
}
function boot(){
 const e=mock();
 e.run('assets/ck-study-editor-v80.js');
 e.run('assets/ck-study-workbench-v81.js');
 e.run('assets/ck-study-links-v83.js');
 e.run('assets/ck-study-materials-v84.js');
 e.run('assets/ck-study-plan-v84.js');
 return e;
}
test('all v102 modules boot in isolated DOM without startup SyntaxError',()=>{
 const e=boot();
 for(const prop of ['CK102Restore','CK80Editorial','CK81Workbench','CK83Links','CK84Materials','CK84Plan'])
  assert.ok(e.window[prop],prop);
 assert.equal(e.window.CK81Workbench.getState().storageIssue,'');
});
test('shared restore retains newer and equal timestamp; adds new records',()=>{
 const h=boot().window.CK102Restore;
 const r=h.records({a:{updatedAt:100,value:'new'},b:{updatedAt:100,value:'same'}},
  {a:{updatedAt:90,value:'old'},b:{updatedAt:100,value:'bad'},c:{updatedAt:101,value:'add'}});
 assert.equal(r.merged.a.value,'new');
 assert.equal(r.merged.b.value,'same');
 assert.equal(r.merged.c.value,'add');
 assert.deepEqual([r.added,r.updated,r.preserved],[1,0,2]);
});
test('shared restore accepts newer ISO timestamp and rejects unknown fallback',()=>{
 const h=boot().window.CK102Restore;
 const t='2026-11-02T00:00:00.000Z';
 assert.ok(h.timestamp(t)>0);
 assert.equal(h.timestamp('broken'),0);
 const r=h.records({a:{updatedAt:t,value:'new'}},{a:{updatedAt:null,value:'old'}});
 assert.equal(r.merged.a.value,'new');
});
test('document merge is additive, capacity bounded and never downgrades newer notes',()=>{
 const h=boot().window.CK102Restore;
 const r=h.documents([{id:'a',updatedAt:200,note:'new'}],
  [{id:'a',updatedAt:199,note:'old'},{id:'b',updatedAt:201,note:'added'}]);
 assert.equal(r.merged.find(x=>x.id==='a').note,'new');
 assert.equal(r.merged.find(x=>x.id==='b').note,'added');
 assert.throws(()=>h.documents([{id:'a'}],[{id:'b'}],1));
});
test('editor import validator preserves backup timestamps and blocks unreasoned review holds',()=>{
 const e=boot();
 const v={questionId:'2025-1',status:'draft',summaryEasy:'memo',options:opts.map((_,i)=>
  ({no:i+1,verdict:'unreviewed',why:''})),updatedAt:'2026-11-02T08:00:00.000Z'};
 const clean=e.window.CK80Editorial.validateImportRecord('2025-1',v);
 assert.equal(clean.updatedAt,v.updatedAt);
 assert.equal(clean.published,false);
 assert.equal(e.window.CK80Editorial.validateImportRecord('2025-1',
  {...v,status:'review_hold',reviewHoldReason:''}),null);
});
test('workbench research batch still writes once and does not promote canonical review',()=>{
 const e=boot(),result=e.window.CK81Workbench.markResearchBatch(['2025-1','2025-2','2025-1']);
 assert.equal(result.ok,true);
 assert.equal(result.count,2);
 const saved=JSON.parse(e.store.get('ck81-review-workbench-v1'));
 assert.equal(saved.records['2025-1'].status,'researching');
 assert.equal(saved.scope,'personal-unpublished-workbench');
});
test('materials and study plan subscribe to window storage, not document',()=>{
 const e=boot();
 assert.ok((e.handlers.win.storage||[]).length>=2);
 const text=read('assets/ck-study-materials-v84.js')+read('assets/ck-study-plan-v84.js');
 assert.doesNotMatch(text,/document\.addEventListener\('storage'/);
});
test('storage event reloads updated learning plan settings',()=>{
 const e=boot(),plan=e.window.CK84Plan;
 const next={...plan.defaults(),dailyMinutes:210,updatedAt:Date.now()};
 e.localStorage.setItem('ck84-study-plan-v1',JSON.stringify(next));
 for(const listener of e.handlers.win.storage||[])listener({key:'ck84-study-plan-v1'});
 assert.equal(plan.getState().settings.dailyMinutes,210);
});
test('Vercel keeps git auto-deploy disabled; SW warms actual page assets',()=>{
 const vc=JSON.parse(read('vercel.json')),sw=read('sw.js'),html=read('index.html');
 assert.equal(vc.git.deploymentEnabled,false);
 assert.match(sw,/conceptknot-study-v102-nondestructive-restore/);
 const hot=JSON.parse(sw.match(/const HOT=(\[[^\n]*\]);/)[1]);
 const scripts=[...html.matchAll(/<script\b[^>]*src=["']([^"']+)/g)]
  .map(x=>x[1]).filter(x=>x.startsWith('./'));
 for(const src of scripts)assert.ok(hot.includes(src),'missing precache '+src);
});
