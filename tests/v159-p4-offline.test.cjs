/* ConceptKnot v159 P0/P4 offline source-readiness guards. */
'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const source=read('assets/ck-data-diagnostics-v88.js');
const start=source.indexOf('const OFFLINE_CACHE='),stop=source.indexOf('/* Ask the currently controlling SW',start);
A.ok(start>=0&&stop>start);
const ctx={Promise};
vm.runInNewContext(source.slice(start,stop)+
 '\nthis.cache=OFFLINE_CACHE;this.required=[...OFFLINE_MINIMUM];'+
 'this.study=[...P2P6_OFFLINE];this.p4=[...P4_OFFLINE];this.check=offlineHealth;',ctx);
const required=Array.from(ctx.required),study=Array.from(ctx.study),p4=Array.from(ctx.p4);
const response=p=>({ok:true,headers:{get:()=>p.endsWith('.html')?'text/html':
 p.split('?')[0].endsWith('.css')?'text/css':p.split('?')[0].endsWith('.json')?'application/json':'application/javascript'}});
function fixture(missing=[],poison=[]){
 const skipped=new Set(missing),bad=new Set(poison),items=new Map();
 for(const p of [...required,...study,...p4]){
  if(skipped.has(p))continue;
  items.set(p,bad.has(p)?{ok:true,headers:{get:()=> 'text/html'}}:response(p));
 }
 return {keys:async()=>[ctx.cache],open:async key=>{A.equal(key,ctx.cache);
  return {match:async p=>items.get(p)};}};
}
test('P0 v161 preserves original 11 critical and nine P2/P6 optional assets',()=>{
 A.equal(ctx.cache,'conceptknot-study-v167-2021-2023-126-option-drafts');
 A.equal(required.length,11);A.equal(study.length,9);
 A.equal(p4.length,14);
 const html=read('index.html'),sw=read('sw.js');
 A.ok(html.includes('content="v167-2021-2023-126-option-rationales"'));
 for(const p of p4){
  A.ok(sw.includes(p),'missing optional SW '+p);
  A.ok(html.includes(p.slice(2)),'missing P4 HTML '+p);
 }
 A.equal(JSON.parse(read('vercel.json')).git.deploymentEnabled,false);
 A.equal(fs.existsSync('.github/workflows'),false);
});
test('P4 exact eleven assets and current controlling worker are required before reporting ready',async()=>{
 const good=await ctx.check(fixture(),true);
 A.equal(good.ready,true);A.equal(good.studyReady,true);
 A.equal(good.p4Cached,13);A.equal(good.p4Required,13);A.equal(good.p4Ready,true);
 const missing=await ctx.check(fixture([p4[0]]),true);
 A.equal(missing.ready,true);A.equal(missing.p4Cached,12);A.equal(missing.p4Ready,false);
 const untrusted=await ctx.check(fixture([], [p4[2]]),true);
 A.equal(untrusted.p4Ready,false);A.equal(untrusted.p4Cached,12);
 const wrongController=await ctx.check(fixture(),false);
 A.equal(wrongController.p4Ready,false);
});
test('P4 workbench capability check never marks actual device as manually PASS',()=>{
 const diag=read('assets/ck-data-diagnostics-v88.js');
 A.ok(diag.includes('P4 400문항·2,000선지 작업대'));
 A.ok(diag.includes('검수 작업대 오프라인 준비 미확인'));
 A.ok(diag.includes('실제 기기 동작은 별도 검사'));
 const qa=read('assets/ck-manual-qa-v115.js');
 A.ok(qa.includes("id:'v159-p4-source-locked'"));
 A.ok(qa.includes("id:'v159-p4-offline'"));
 A.ok(qa.includes("id:'v160-option-offline'"));
 A.ok(qa.includes("KEY='ck115-manual-device-verification-v1'"));
});
