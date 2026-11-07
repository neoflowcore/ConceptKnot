'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs');
const path=require('node:path'),root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const source=read('assets/ck-mixed-mock-v129.js');
const official=Object.fromEntries(Array.from({length:10*80},(_,i)=>{
 const year=2016+Math.floor(i/80),number=i%80+1,id=year+'-'+number;
 return [id,{id,year,number,subject:number<=40?'estate':'civil',verified:true,question:'공식 원문 '+id,
  options:['하나','둘','셋','넷','다섯'],correct:[1],originalUrl:'https://q-net.or.kr/'+id}];
}));
const KEY='ck129-mixed-sessions-v1';
function setup(store=new Map(),bank=official){
 const listeners={},events={},win={RECALL_OFFICIAL:bank,confirm:()=>true,addEventListener:(k,f)=>listeners[k]=f};
 const doc={hidden:false,readyState:'loading',addEventListener:(k,f)=>events[k]=f,
  getElementById:()=>null,querySelector:()=>null,dispatchEvent(){}};
 const storage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)};
 const ctx={window:win,document:doc,localStorage:storage,Date,Promise,Math,Number,Array,Set,Object,String,
  setInterval:()=>123,clearInterval:()=>{},setTimeout:()=>{},requestAnimationFrame:()=>{},Event:class {}};
 vm.runInNewContext(source,ctx);
 return {api:win.CK129MixedMock,store,events,listeners};
}
test('all five mixed sets preserve 40/40 subjects, ten years, and zero duplicated questions',()=>{
 const {api}=setup(),all=[];
 for(let set=1;set<=5;set++){
  const ids=Array.from(api.makeSet(set));
  assert.equal(ids.length,80);assert.equal(new Set(ids).size,80);
  for(let part=0;part<2;part++)for(let year=2016;year<=2025;year++){
   const selected=ids.slice(part*40,part*40+40).filter(x=>x.startsWith(year+'-'));
   assert.equal(selected.length,4,'Year '+year+' in subject '+part);
  }
  assert.equal(api.checkSet(set).ready,true);all.push(...ids);
 }
 assert.equal(new Set(all).size,400);
 assert.deepEqual(Array.from(api.makeSet(3)),Array.from(api.makeSet(3)));
 assert.equal(api.makeSet(0).length,0);
});
test('source validation blocks missing or corrupted official question and answer',()=>{
 const id=setup().api.makeSet(1)[0];
 const corrupted={...official,[id]:{...official[id],correct:[6]}};
 assert.equal(setup(new Map(),corrupted).api.checkSet(1).ready,false);
 const missing={...official};delete missing[id];
 assert.equal(setup(new Map(),missing).api.checkSet(1).ready,false);
});
test('new attempt has 100 minutes, answers persist, pause and resume, submit and history',()=>{
 const ctx=setup(),a=ctx.api;
 assert.equal(a.start(2),true);
 assert.equal(a.getState().active,'running');assert.equal(a.getState().set,2);
 assert.equal(a.getState().remainingMs>5998000,true);
 assert.equal(a.answer(1),true);
 assert.equal(a.goto(45),true);assert.equal(a.flag(),true);assert.equal(a.answer(2),true);
 assert.equal(a.pause(),true);assert.equal(a.getState().active,'paused');
 assert.equal(a.answer(3),false,'paused cannot answer');
 assert.equal(a.resume(),true);
 assert.equal(a.finish('manual'),true);
 assert.equal(a.getState().active,'submitted');assert.equal(a.getState().history,1);
 assert.equal(a.answer(1),false,'submitted immutable');
 const saved=JSON.parse(ctx.store.get(KEY));assert.equal(saved.active.answers[0],1);
 assert.equal(saved.active.answers[45],2);assert.equal(saved.active.flags[45],true);
 assert.equal(saved.active.pauseCount,1);
 const report=a.resultText(saved.active);assert.match(report,/공식 A형 기출/);
 assert.match(report,/오답/);assert.match(report,/미응답/);
});
test('grading 40+40 correct yields 100, under-threshold grade is not passed',()=>{
 const a=setup().api,s=a.createAttempt(1),yes={...s,answers:Array(80).fill(1)};
 const full=a.grade(yes);assert.equal(full.estate,100);assert.equal(full.civil,100);
 assert.equal(full.passed,true);
 const partial={...s,answers:Array.from({length:80},(_,i)=>i<15?1:i>=40&&i<70?1:null)};
 const g=a.grade(partial);assert.equal(g.estate,37.5);assert.equal(g.civil,75);
 assert.equal(g.passed,false);
});
test('special all-accepted and multi-key official answers are handled without changing source',()=>{
 const a=setup().api,s=a.createAttempt(1),id=s.ids[0];
 const original=official[id];const q={...official,[id]:{...original,correct:[1,2,3,4,5]}};
 const testSession={...s,answers:s.answers.slice()};testSession.answers[0]=5;
 assert.equal(a.grade(testSession,q).estateCorrect,1);
 assert.equal(a.grade(testSession,q).allAccepted.includes(id),true);
 testSession.answers[0]=null;
 assert.equal(a.grade(testSession,q).estateCorrect,0);
 assert.equal(a.grade(testSession,q).blank.includes(id),true);
});
test('cross-tab conflict does not replace previously committed answers',()=>{
 const store=new Map(),a=setup(store),b=setup(store);
 assert.equal(a.api.start(1),true);
 assert.equal(b.api.start(2),false);
 assert.equal(JSON.parse(store.get(KEY)).active.set,1);
 assert.equal(b.api.getState().set,1);
 assert.match(b.api.getState().message,/다른 탭/);
});
test('malformed localStorage locks writes, never clears original raw',()=>{
 const store=new Map([[KEY,'{broken-json']]),a=setup(store).api;
 assert.match(a.getState().issue,/손상/);
 assert.equal(a.start(1),false);
 assert.equal(store.get(KEY),'{broken-json');
});
test('source module parses and does not write official bank or CK82 session key',()=>{
 new vm.Script(source);
 assert.doesNotMatch(source,/localStorage\.setItem\(['"]ck82-exam-sessions-v1/);
 assert.equal(source.includes('ck129-mixed-sessions-v1'),true);
});

test('real 10-year A-form data fits all 5 sets and unchanged source answers',()=>{
 const older=JSON.parse(read('data/official-2016-2020.json'));
 const newer=JSON.parse(read('data/official-2021-2025.json'));
 assert.equal(older.length+newer.length,800);
 const all=Object.fromEntries([...older,...newer].map(q=>[q.id,q]));
 const a=setup(new Map(),all).api,seen=new Set();
 for(let set=1;set<=5;set++){
  assert.equal(a.checkSet(set).ready,true);
  for(const id of a.makeSet(set)){assert.equal(seen.has(id),false);seen.add(id);}
 }
 assert.equal(seen.size,400);
});
test('new feature is linked, optional-cached, and does not enable automatic deployment',()=>{
 const html=read('index.html'),sw=read('sw.js'),vc=JSON.parse(read('vercel.json'));
 assert.match(html,/ck-mixed-mock-v129\.js\?v=133/);
 assert.match(html,/ck-mixed-mock-v129\.css\?v=130/);
 assert.match(sw,/ck-mixed-mock-v129\.js\?v=133/);
 assert.match(sw,/ck-mixed-mock-v129\.css\?v=130/);
 assert.match(sw,/conceptknot-study-v133-exam-unified/);
 assert.equal(vc.git.deploymentEnabled,false);
 assert.equal(fs.existsSync(path.join(root,'.github','workflows')),false);
});
test('read-only optional mixed asset diagnostics distinguish 11/11 core from 2/2 mixed ready',async()=>{
 const source=read('assets/ck-data-diagnostics-v88.js');
 const begin=source.indexOf('const OFFLINE_CACHE='),end=source.indexOf('let root=null;',begin);
 assert.ok(begin>=0&&end>begin);
 const api=new Function('window',source.slice(begin,end)+'return {offlineHealth,OFFLINE_CACHE,OFFLINE_MINIMUM,MIXED_OFFLINE}')( { } );
 const responses=new Map(api.OFFLINE_MINIMUM.map(p=>[p,{ok:true,headers:{get:()=>p.endsWith('.html')?'text/html':'application/javascript'}}]));
 const storage={keys:async()=>[api.OFFLINE_CACHE],open:async()=>({match:async p=>responses.get(p)||null})};
 const coreOnly=await api.offlineHealth(storage,true);
 assert.equal(coreOnly.ready,true);assert.equal(coreOnly.mixedReady,false);
 for(const p of api.MIXED_OFFLINE)responses.set(p,{ok:true,headers:{get:()=>p.endsWith('.css')?'text/css':'application/javascript'}});
 const withMixed=await api.offlineHealth(storage,true);
 assert.equal(withMixed.mixedCached,2);assert.equal(withMixed.mixedReady,true);
 responses.set(api.MIXED_OFFLINE[0],{ok:true,headers:{get:()=> 'text/html'}});
 assert.equal((await api.offlineHealth(storage,true)).mixedReady,false);
});

test('mixed exam one-second timer is visible-only and never animates background tabs',()=>{
 assert.match(source,/root\?\.getClientRects\?\.\(\)\.length/);
 assert.match(source,/attributeFilter:\['data-ck-v8-tab'\]/);
 assert.match(source,/window\.addEventListener\('ck:scene-activity',syncTimer\)/);
 assert.match(source,/clearInterval\(clock\)/);
});

test('backup import preserves a currently running local attempt and merges submitted history',async()=>{
 const f=setup(),a=f.api;
 assert.equal(a.start(1),true);assert.equal(a.answer(1),true);assert.equal(a.pause(),true);
 const old=JSON.parse(f.store.get(KEY));
 const fromAnother=setup().api.createAttempt(3);
 const submitted={...fromAnother,status:'submitted',submittedAt:fromAnother.startedAt+2000,
  remainingMs:0,reason:'manual'};
 const bundle={schemaVersion:1,revision:2,active:submitted,history:[submitted]};
 const raw=JSON.stringify(bundle),file={size:raw.length,text:async()=>raw};
 assert.equal(await a.importFile(file),true);
 const restored=JSON.parse(f.store.get(KEY));
 assert.equal(restored.active.set,1);assert.equal(restored.active.status,'paused');
 assert.equal(restored.active.answers[0],1);assert.equal(restored.history.length,1);
 assert.equal(restored.history[0].set,3);assert.equal(old.active.answers[0],1);
});
test('restore rejects two incompatible unfinished attempts without modifying storage',async()=>{
 const f=setup(),a=f.api;
 a.start(1);a.answer(1);
 const before=f.store.get(KEY),other=setup().api.createAttempt(2);
 const bundle={schemaVersion:1,revision:1,active:other,history:[]};
 const raw=JSON.stringify(bundle);
 assert.equal(await a.importFile({size:raw.length,text:async()=>raw}),false);
 assert.equal(f.store.get(KEY),before);
 assert.match(a.getState().message,/미제출 시험/);
});
test('restore rejects history beyond 10 entries instead of silently discarding results',()=>{
 const api=setup().api,one=api.createAttempt(1);
 const old=Array.from({length:10},(_,i)=>({...one,status:'submitted',
  startedAt:one.startedAt+i*1000,submittedAt:one.startedAt+i*1000+500,
  remainingMs:0,reason:'manual'}));
 const next={...old[0],submittedAt:old[0].submittedAt+90000};
 assert.throws(()=>api.mergeRestore({active:null,history:old},{active:null,history:[next]}),/10건/);
});

test('same-start pending exam snapshots with changed flags or timer cannot silently overwrite',()=>{
 const a=setup().api,old=a.createAttempt(1);
 const flags={...old,flags:old.flags.slice()};flags.flags[0]=true;
 assert.throws(()=>a.mergeRestore({active:old,history:[]},{active:flags,history:[]}),/미제출 시험/);
 const paused={...old,status:'paused',remainingMs:old.remainingMs-15000};
 assert.throws(()=>a.mergeRestore({active:old,history:[]},{active:paused,history:[]}),/미제출 시험/);
 assert.equal(a.mergeRestore({active:old,history:[]},{active:old,history:[]}).active,old);
});

test('same-identity submitted backups never silently discard divergent answers',()=>{
 const a=setup().api,one=a.createAttempt(1);
 const x={...one,status:'submitted',submittedAt:one.startedAt+1000,reason:'manual',remainingMs:0};
 const y={...x,answers:x.answers.slice()};y.answers[0]=1;
 assert.throws(()=>a.mergeRestore({active:null,history:[x]},{active:null,history:[y]}),/동일 제출 회차/);
 assert.equal(a.mergeRestore({active:null,history:[x]},{active:null,history:[x]}).history.length,1);
});
