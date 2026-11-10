/* v157 P0 offline readiness: local-only cache and controller evidence, not hardware PASS. */
'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=f=>fs.readFileSync(f,'utf8');
const reportSource=read('assets/ck-data-diagnostics-v88.js');
const start=reportSource.indexOf('const OFFLINE_CACHE='),end=reportSource.indexOf('/* Ask the currently controlling SW',start);
A.ok(start>=0&&end>start);
const ctx={Promise};vm.runInNewContext(reportSource.slice(start,end)+
 '\nthis.check=offlineHealth;this.cache=OFFLINE_CACHE;'+
 'this.list=[...OFFLINE_MINIMUM];this.study=[...P2P6_OFFLINE];',ctx);
const CRIT=Array.from(ctx.list),STUDY=Array.from(ctx.study);
const goodResponse=url=>({ok:true,headers:{get:()=>url.endsWith('.html')?'text/html':
 url.split('?')[0].endsWith('.css')?'text/css':url.split('?')[0].endsWith('.json')?'application/json':'application/javascript'}});
function cacheFixture(omitted=[]){
 const missing=new Set(omitted),items=new Map();
 for(const url of [...CRIT,...STUDY])
  if(!missing.has(url))items.set(url,goodResponse(url));
 const storage={keys:async()=>[ctx.cache],
  open:async name=>{A.equal(name,ctx.cache);return {match:async url=>items.get(url)}}};
 return {storage,items};
}
test('P0 current cache label and exact 11 required, six optional P2/P6 assets',()=>{
 A.equal(ctx.cache,'conceptknot-study-v157-resume-offline-omr-ime');
 A.equal(CRIT.length,11);A.equal(STUDY.length,6);
 const html=read('index.html'),sw=read('sw.js');
 A.ok(html.includes('content="v157-phase-remaining-offline-restore-ime-board"'));
 for(const name of ['ck-full-exam-v82.js','ck-manual-qa-v115.js','ck-data-diagnostics-v88.js',
  'ck-mobile-board-v21.js','ck-study-p6-v76.js'])
  A.ok(html.includes(name+'?v=157'),name);
 for(const name of ['ck-typing-ime-guard-v155.js','ck-study-p6-v76.js','ck-mobile-board-v21.js'])
  A.ok(sw.includes(name+'?v=157'),name);
 A.ok(read('assets/ck-study-p6-v76.js').includes('ck-typing-ime-guard-v155.js?v=157'));
});
test('P0 SW controlled and all 11+6 cached -> two separate ready statuses',async()=>{
 const result=await ctx.check(cacheFixture().storage,true);
 A.equal(result.required,11);A.equal(result.cached,11);
 A.equal(result.ready,true);A.equal(result.studyCached,6);A.equal(result.studyReady,true);
});
test('P0 missing graph offline asset does not falsely mark P2/P6 prepared',async()=>{
 const absent=STUDY[2],result=await ctx.check(cacheFixture([absent]).storage,true);
 A.equal(result.ready,true);
 A.equal(result.studyCached,5);
 A.equal(result.studyReady,false);
});
test('P0 missing or HTML-corrupted core blocks true offline readiness',async()=>{
 const missing=CRIT[8],fixture=cacheFixture([missing]);
 const result=await ctx.check(fixture.storage,true);
 A.equal(result.ready,false);A.equal(result.cached,10);
 const corruption=cacheFixture();
 corruption.items.set(CRIT[7],{ok:true,headers:{get:()=> 'text/html'}});
 const damaged=await ctx.check(corruption.storage,true);
 A.equal(damaged.ready,false);A.ok(damaged.missing.includes(CRIT[7]));
});
test('P0 all assets present but wrong service worker remains unverified',async()=>{
 const result=await ctx.check(cacheFixture().storage,false);
 A.equal(result.cached,11);A.equal(result.studyCached,6);
 A.equal(result.ready,false);A.equal(result.studyReady,false);
});
test('P0 11 core SW source matches live diagnostics exact resource version strings',()=>{
 const sw=read('sw.js');
 for(const p of CRIT)A.ok(sw.includes("'"+p+"'"),'missing core '+p);
 for(const p of STUDY)A.ok(sw.includes(p),'missing optional '+p);
 A.equal(read('vercel.json').includes('"deploymentEnabled": false'),true);
});
test('P0 offline version and warnings are truthful without user hardware confirmation',()=>{
 const s=read('assets/ck-data-diagnostics-v88.js');
 A.ok(s.includes('학습 도구 자산 확보(조작은 별도 검증)'));
 A.ok(s.includes('실제 기기 동작은 별도 검사'));
 A.ok(s.includes('현재 v157 서비스워커가 이 탭을 제어함'));
 A.doesNotMatch(s,/현재 v140 서비스워커가 이 탭을 제어함/);
});

