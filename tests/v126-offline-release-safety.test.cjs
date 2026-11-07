/* v126 focused manual checks — no deployment, CI, or user data writes.
 * node --test tests/v126-offline-release-safety.test.cjs
 */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(base,p),'utf8');
const sw=read('sw.js'),diag=read('assets/ck-data-diagnostics-v88.js');
function worker(){
 const events={},entries=new Map(),writes=[];
 const cache={
  addAll:async items=>{items.forEach(x=>entries.set(x,{ok:true}))},
  match:async request=>entries.get(typeof request==='string'?request:request.url)||null,
  put:async(k,v)=>{writes.push([k,v]);entries.set(typeof k==='string'?k:k.url,v)}
 };
 const caches={open:async()=>cache,keys:async()=>['conceptknot-study-v132-landing-first-boot'],delete:async()=>true};
 const self={location:{href:'https://app.test/sw.js',origin:'https://app.test'},
  addEventListener:(n,fn)=>{events[n]=fn},skipWaiting:async()=>{},clients:{claim:async()=>{}}};
 const ctx={self,caches,URL,console:{warn(){}},Response,
  fetch:async()=>({ok:true,headers:{get:()=> 'application/javascript'},clone(){return this}})};
 vm.runInNewContext(sw,ctx);
 const respond=async(request,result)=>{
  let response,work=[];
  const event={request,respondWith:p=>{response=p},waitUntil:p=>work.push(p)};
  events.fetch(event);
  if(!response)return {unhandled:true};
  const output=await response;await Promise.all(work);return {output,work};
 };
 return {events,entries,writes,cache,ctx,respond};
}
test('current generation is explicitly discoverable by read-only MessageChannel',()=>{
 const {events}=worker();let response;
 events.message({data:{type:'CK_SW_VERSION_PING'},ports:[{postMessage:p=>{response=p}}]});
 assert.equal(response.cache,'conceptknot-study-v132-landing-first-boot');
 assert.equal(response.required,11);
 response=null;events.message({data:{type:'unrelated'},ports:[{postMessage:p=>{response=p}}]});
 assert.equal(response,null);
});
test('CSS / JS HTML fallback is not stored or served as a successful asset',async()=>{
 const w=worker(),url='https://app.test/assets/ck-study-editor-v80.js?v=127';
 w.ctx.fetch=async()=>({ok:true,status:200,headers:{get:()=> 'text/html; charset=utf-8'},
  clone(){return this}});
 const result=await w.respond({url,method:'GET',mode:'cors'});
 assert.equal(result.output.status,503);
 assert.equal(w.writes.length,0);
});
test('real script success waits for cache persistence in event lifetime',async()=>{
 const w=worker(),url='https://app.test/assets/ck-study-editor-v80.js?v=127';
 let finished=false;
 w.cache.put=async()=>{await Promise.resolve();finished=true};
 const result=await w.respond({url,method:'GET',mode:'cors'});
 assert.equal(result.output.ok,true);assert.equal(result.work.length,1);
 assert.equal(finished,true);
});
test('HTML navigation responses are never cached under index if response is JSON',async()=>{
 const w=worker();
 w.ctx.fetch=async()=>({ok:true,status:200,headers:{get:()=> 'application/json'},
  clone(){return this}});
 const r=await w.respond({url:'https://app.test/',method:'GET',mode:'navigate'});
 assert.equal(r.output.ok,true);assert.equal(w.writes.length,0);
});
test('precise asset query match, controller version identity, and lack of guessed PASS',()=>{
 assert.match(diag,/current\.match\(path\)\.then/);
 assert.doesNotMatch(diag,/current\.match\(path,\{ignoreSearch:true\}\)/);
 assert.match(diag,/controllerCacheInfo\(\)/);
 assert.match(diag,/controller\.postMessage\(\{type:'CK_SW_VERSION_PING'\}/);
 assert.match(diag,/const activeCurrent=controller\.cache===OFFLINE_CACHE/);
 assert.match(diag,/offlineHealth\(window\.caches,activeCurrent\)/);
 assert.equal((sw.match(/const CRITICAL=\[([\s\S]*?)\];/)?.[1].match(/'\.\//g)||[]).length,11);
});
test('read-only release preflight references v126 and rejects stale preflight markers',()=>{
 const pre=read('scripts/check-release-readonly.cjs');
 assert.match(pre,/conceptknot-study-v132-landing-first-boot/);
 assert.doesNotMatch(pre,/conceptknot-study-v102-nondestructive-restore/);
 assert.match(pre,/controllerCacheInfo/);
 assert.match(sw,/invalidCoreResponse\(path,response\)/);
 assert.equal(JSON.parse(read('vercel.json')).git.deploymentEnabled,false);
 assert.equal(fs.existsSync(path.join(base,'.github/workflows')),false);
 new vm.Script(sw);new vm.Script(diag);new vm.Script(pre);
});
