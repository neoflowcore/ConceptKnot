'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(base,p),'utf8');
function memoryStore(initial={}){
 const map=new Map(Object.entries(initial));
 return {getItem:k=>map.has(k)?map.get(k):null,
  setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k),has:k=>map.has(k)};
}
function smallBank(){
 return Object.fromEntries(Array.from({length:3},(_,i)=>{const n=i+1;return ['2025-'+n,
  {id:'2025-'+n,year:2025,number:n,subject:'estate',verified:true,question:'질문 '+n,
   options:['A','B','C','D','E'],correct:[2]}]}));
}
function reviewApp(storage=memoryStore(),reviews={}){
 const calls=[],bank=smallBank(),w={RECALL_OFFICIAL:bank,sessionStorage:storage,
  addEventListener(){},CK79Study:{snapshot:()=>({review:reviews,mistakes:[]}),
   markRecall:(id,outcome)=>{calls.push([id,outcome]);reviews[id]={updatedAt:Date.now(),result:outcome};return true;}},
  CK86ExamBridge:{getDue:()=>({rows:Object.keys(bank).map(id=>({id,at:1,source:'v82-official-mock'})),
   due:3,futureRows:[],cleared:[],future:0})}},
  d={readyState:'loading',addEventListener(){},getElementById(){return null},
   querySelector(){return null},body:{}};
 vm.runInNewContext(read('assets/ck-study-review-v79.js'),
  {window:w,document:d,Date,Intl,Blob,URL,setTimeout,requestAnimationFrame(){}});
 return {app:w.CK79Review,calls,window:w};
}
test('All v99 changed JavaScript modules parse',()=>{
 for(const name of ['ck-study-review-v79.js','ck-data-integrity-v86.js','ck-study-analytics-v83.js','ck-data-diagnostics-v88.js'])
  new vm.Script(read('assets/'+name));
 new vm.Script(read('sw.js'));
});
test('Focus stores a session after starting and revealing',()=>{
 const storage=memoryStore(),{app}=reviewApp(storage);
 assert.equal(app.beginFocus(10),3);assert.equal(app.revealFocus(),true);
 assert.equal(JSON.parse(storage.getItem('ck99-focus-session-v1')).revealed,true);
});
test('Hidden answer cannot be graded',()=>{
 const {app,calls}=reviewApp();app.beginFocus();assert.equal(app.answerFocus('remember'),false);assert.equal(calls.length,0);
});
test('Skip moves forward without saving a recall result',()=>{
 const {app,calls}=reviewApp();app.beginFocus();
 assert.equal(app.skipFocus(),true);assert.equal(app.focusStatus().stats.skip,1);assert.equal(calls.length,0);
});
test('Pause/resume survives same-tab reload and preserves stats',()=>{
 const storage=memoryStore(),reviews={},a=reviewApp(storage,reviews).app;
 a.beginFocus();a.revealFocus();assert.equal(a.answerFocus('again'),true);
 a.skipFocus();a.pauseFocus();
 const b=reviewApp(storage,reviews).app;
 assert.equal(b.focusStatus().paused,true);assert.equal(b.focusStatus().index,2);
 assert.equal(b.resumeFocus(),true);assert.equal(b.focusStatus().active,true);
});
test('Completed focus can be exited without touching persisted recall',()=>{
 const storage=memoryStore(),reviews={},a=reviewApp(storage,reviews).app;
 a.beginFocus();a.revealFocus();a.answerFocus('remember');a.finishFocus();
 assert.equal(storage.has('ck99-focus-session-v1'),false);
 assert.equal(reviews['2025-1'].result,'remember');
});
test('Pending review written before crash is reconciled after reload',()=>{
 const storage=memoryStore(),reviews={},a=reviewApp(storage,reviews).app;
 a.beginFocus();a.revealFocus();
 const raw=JSON.parse(storage.getItem('ck99-focus-session-v1'));
 raw.pending={id:'2025-1',outcome:'remember',at:Date.now()-2000};
 storage.setItem('ck99-focus-session-v1',JSON.stringify(raw));
 reviews['2025-1']={result:'remember',updatedAt:Date.now()};
 const b=reviewApp(storage,reviews).app;
 assert.equal(b.focusStatus().index,1);
 assert.equal(b.focusStatus().stats.remember,1);
});
test('Uncommitted pending review is not counted',()=>{
 const storage=memoryStore(),reviews={},a=reviewApp(storage,reviews).app;
 a.beginFocus();
 const raw=JSON.parse(storage.getItem('ck99-focus-session-v1'));
 raw.pending={id:'2025-1',outcome:'again',at:Date.now()-2000};
 storage.setItem('ck99-focus-session-v1',JSON.stringify(raw));
 const b=reviewApp(storage,reviews).app;
 assert.equal(b.focusStatus().index,0);assert.equal(b.focusStatus().stats.again,0);
});
test('Malformed temporary session is rejected without writing a main record',()=>{
 const storage=memoryStore({'ck99-focus-session-v1':JSON.stringify({version:1,index:-1})});
 const {app}=reviewApp(storage);
 assert.equal(app.focusStatus().active,false);
 assert.match(app.focusStatus().storageIssue,/손상/);
});
test('A rejected new empty focus preserves a paused existing one',()=>{
 const storage=memoryStore(),reviews={},r=reviewApp(storage,reviews),a=r.app;
 a.beginFocus();a.pauseFocus();
 for(const id of Object.keys(r.window.RECALL_OFFICIAL))delete r.window.RECALL_OFFICIAL[id];
 assert.equal(a.beginFocus(),0);
 assert.equal(a.focusStatus().paused,true);
 assert.equal(a.focusStatus().total,3);
 assert.ok(storage.getItem('ck99-focus-session-v1'));
});
test('Recall storage still works if sessionStorage is unavailable',()=>{
 const w={},d={readyState:'loading',addEventListener(){},getElementById(){return null}};
 const bank=smallBank(),calls=[];
 Object.assign(w,{RECALL_OFFICIAL:bank,addEventListener(){},
 CK79Study:{snapshot:()=>({review:{},mistakes:[]}),markRecall:(id,outcome)=>{calls.push([id,outcome]);return true}},
 CK86ExamBridge:{getDue:()=>({rows:[{id:'2025-1',at:1}],futureRows:[],cleared:[],due:1,future:0})}});
 vm.runInNewContext(read('assets/ck-study-review-v79.js'),{window:w,document:d,Date,Intl});
 const app=w.CK79Review;app.beginFocus();app.revealFocus();
 assert.equal(app.answerFocus('remember'),true);assert.equal(calls.length,1);
});
test('Backup recovery rejects unknown extras and permits 16MB files',()=>{
 const w={};vm.runInNewContext(read('assets/ck-data-integrity-v86.js'),{window:w});
 const v=w.CK86Integrity;assert.equal(v.MAX_FILE,16*1024*1024);
 assert.throws(()=>v.restoreExtras({__ck79Extras:{format:1,local:{unknown:'{}'}}},undefined,memoryStore()),/지원하지 않는/);
});
test('Backup recovery rolls back a key even after a failing write',()=>{
 const w={};vm.runInNewContext(read('assets/ck-data-integrity-v86.js'),{window:w});
 const db=new Map([['before','original']]),storage={
 getItem:k=>db.get(k)||null,
 setItem:(k,v)=>{db.set(k,v);if(k==='fails')throw Error('after write');},
 removeItem:k=>db.delete(k)};
 const r=w.CK86Integrity.transaction([['before','new'],['fails','x']],storage);
 assert.equal(r.ok,false);assert.equal(db.get('before'),'original');assert.equal(db.has('fails'),false);
});
test('Official 10-year bank audit is exact and read-only',()=>{
 const {auditOfficialBank}=require('../scripts/audit-official-bank.cjs');
 const files=['data/official-2016-2020.json','data/official-2021-2025.json']
  .map(p=>JSON.parse(read(p)));
 const out=auditOfficialBank(files);
 assert.equal(out.records,800);assert.equal(out.optionTexts,4000);
 assert.equal(out.issues.length,0);assert.equal(out.visualReviewed+out.visualUnreviewed+out.visualUnknown,800);
});
test('Manual-only deployment remains configured',()=>{
 assert.equal(JSON.parse(read('vercel.json')).git.deploymentEnabled,false);
 assert.equal(fs.existsSync(path.join(base,'.github/workflows')),false);
});

test('Read-only visual-review queue prioritizes entries without completed review',()=>{
 const w={addEventListener(){},RECALL_OFFICIAL:{}},d={addEventListener(){},getElementById(){return null}};
 const sources=['data/official-2016-2020.json','data/official-2021-2025.json']
  .map(p=>JSON.parse(read(p)));
 for(const q of sources.flat())w.RECALL_OFFICIAL[q.id]=q;
 vm.runInNewContext(read('assets/ck-data-diagnostics-v88.js'),{window:w,document:d});
 const report=w.CK88Diagnostics.bankQuality(),queue=w.CK88Diagnostics.visualQueue({year:2025,limit:12});
 assert.equal(report.total,800);assert.equal(report.structured,800);assert.equal(queue.length,12);
 assert.ok(queue.every(q=>q.year===2025&&q.id.startsWith('2025-')));
});
test('Analytics TXT is derived from verified answers not stored numeric scores',()=>{
 const bank=Object.fromEntries(Array.from({length:80},(_,i)=>{const n=i+1;return ['2025-'+n,
  {id:'2025-'+n,year:2025,number:n,verified:true,subject:n<=40?'estate':'civil',
   options:['a','b','c','d','e'],correct:[2]}]}));
 const w={RECALL_OFFICIAL:bank,addEventListener(){},
  CK86ExamBridge:{getDue:()=>({due:0,future:0})},
  CK83Links:{reviewSummary:()=>({assessed:3,reasoned:2,sourceLinked:1})}};
 const d={readyState:'loading',addEventListener(){},getElementById(){return null}};
 vm.runInNewContext(read('assets/ck-study-analytics-v83.js'),
  {window:w,document:d,Date,Intl,requestAnimationFrame(){}});
 const now=Date.now(),answers=Array(80).fill(2);answers[0]=5;
 const report=w.CK83Analytics.compute({now,days:7,study:{review:{},mistakes:[]},
  sessions:[{status:'submitted',year:2025,submittedAt:now,answers,score:{estate:0,civil:0}}],official:bank});
 assert.equal(report.averageEstate,97.5);assert.equal(report.averageCivil,100);
 assert.equal(report.correct,79);
 const out=w.CK83Analytics.formatReportTxt(report);
 assert.match(out,/97\.5점/);assert.match(out,/선지별 개인 판단: 3\/4000/);
});
test('Service worker install caps simultaneous optional fetches at four',async()=>{
 const handlers={},cached=new Map(),cache={
  addAll:async a=>{for(const x of a)cached.set(x,true)},
  put:async k=>{cached.set(k,true)}};
 const caches={open:async()=>cache,keys:async()=>[],match:async()=>null};
 let peak=0,pending=0;
 const self={addEventListener:(n,fn)=>handlers[n]=fn,skipWaiting:async()=>{},
  clients:{claim:async()=>{}},location:{href:'https://example.test/sw.js',origin:'https://example.test'}};
 const fetch=async()=>{pending++;peak=Math.max(pending,peak);await Promise.resolve();pending--;return {ok:true,status:200}};
 vm.runInNewContext(read('sw.js'),{self,caches,fetch,URL,console});
 let result;handlers.install({waitUntil:p=>result=p});await result;
 assert.ok(peak<=4);assert.ok(cached.has('./index.html'));
});
test('S Pen press and cancellation reset transient eraser state',()=>{
 const events={},w={addEventListener:(n,f)=>(events['window:'+n]??=[]).push(f)},d={addEventListener:(n,f)=>(events['doc:'+n]??=[]).push(f),hidden:false};
 vm.runInNewContext(read('assets/ck-pen-input-v60.js'),{window:w,document:d});
 const e={pointerType:'pen',pointerId:1,buttons:34,pressure:0,type:'pointerdown'};
 events['doc:pointerdown'].forEach(f=>f(e));assert.equal(w.CKPen60.eraser({...e,buttons:0}),true);
 events['doc:pointercancel'].forEach(f=>f({...e,type:'pointercancel',buttons:0,button:0}));
 assert.equal(w.CKPen60.eraser({...e,buttons:0,button:0}),false);
});

test('Legacy manual grade changes stamp resolved mistakes without altering answer data',()=>{
 const html=read('index.html'),needle='if(state.mistakes[id]){state.mistakes[id].resolved=true;state.mistakes[id].updated=Date.now();}';
 assert.ok(html.split(needle).length-1>=3);
 const tags=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/g)];
 for(const [,attrs,source] of tags){
  if(/\bsrc\s*=/.test(attrs)||/type=["']module["']/.test(attrs)||!source.trim())continue;
  new vm.Script(source);
 }
});
test('Latest explicit resolution outranks an older mock mistake',()=>{
 const w={RECALL_OFFICIAL:{'2025-1':{id:'2025-1',year:2025,number:1,verified:true,subject:'estate',options:['a','b','c','d','e'],correct:[2]}}};
 vm.runInNewContext(read('assets/ck-exam-bridge-v86.js'),{window:w,Date});
 const now=Date.now(),attempt={status:'submitted',year:2025,submittedAt:now-3000,answers:[1,...Array(79).fill(null)]};
 const result=w.CK86ExamBridge.getDue({at:now,attempts:[attempt],reviews:{},mistakes:[{type:'exam',year:2025,number:1,updated:now-1000,resolved:true}],bank:w.RECALL_OFFICIAL});
 assert.equal(result.due,0);assert.ok(result.cleared.includes('2025-1'));
});
test('Visual review queue can be exported without editing official record flags',()=>{
 const sample={'2025-1':{id:'2025-1',year:2025,number:1,verified:true,subject:'estate',
  question:'A',correct:[1],options:['a','b','c','d','e'],checks:{visualReview:false}}};
 const w={RECALL_OFFICIAL:sample,addEventListener(){}},d={getElementById(){return null},addEventListener(){}};
 vm.runInNewContext(read('assets/ck-data-diagnostics-v88.js'),{window:w,document:d});
 const list=w.CK88Diagnostics.visualQueue({year:2025,records:sample,limit:80});
 assert.equal(list.length,1);assert.equal(sample['2025-1'].checks.visualReview,false);
 assert.equal(w.CK88Diagnostics.visualQueue({year:2014,records:sample}).length,0);
});
test('Service worker serves previous cached asset on temporary 503',async()=>{
 const handlers={},response={ok:false,status:503},cached={ok:true,status:200};
 const caches={match:async()=>cached,open:async()=>({put:async()=>{},addAll:async()=>{}})};
 const self={addEventListener:(n,fn)=>handlers[n]=fn,location:{href:'https://example.test/sw.js',origin:'https://example.test'}};
 vm.runInNewContext(read('sw.js'),{self,caches,fetch:async()=>response,URL,console});
 const request={url:'https://example.test/assets/ck-study-review-v79.js?v=79',method:'GET',mode:'cors'};
 let resolved;handlers.fetch({request,respondWith:p=>resolved=p});
 assert.equal(await resolved,cached);
});
