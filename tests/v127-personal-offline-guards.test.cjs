/* ConceptKnot v127 focused offline and personal-backup regression tests.
 * Run manually with Node; no CI/Actions, network, deployment, or personal data mutation.
 */
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=name=>fs.readFileSync(path.join(root,name),'utf8');
const SW=read('sw.js'),DIAG=read('assets/ck-data-diagnostics-v88.js');
const GEN='conceptknot-study-v135-typing-ime';
const ORIGIN='https://conceptknot.test';
function mime(path){
 const u=new URL(path,ORIGIN+'/sw.js');
 return /\.html$/i.test(u.pathname)?'text/html':/\.css$/i.test(u.pathname)?'text/css':
  /\.json$/i.test(u.pathname)?'application/json':'application/javascript';
}
function responseFor(path,type){
 return {ok:true,status:200,headers:{get:key=>key==='content-type'?(type||mime(path)):null},
  clone(){return this}};
}
function makeWorker({badCore='',badType='text/html'}={}){
 const events={},records=new Map(),writes=[];
 let skips=0,deletes=0,network=async p=>responseFor(String(p));
 const key=p=>new URL(typeof p==='string'?p:p.url,ORIGIN+'/sw.js').href;
 const cache={
  async addAll(files){
   for(const file of files)records.set(key(file),responseFor(file,file===badCore?badType:null));
  },
  async match(request,options={}){
   const k=key(request);
   if(records.has(k))return records.get(k);
   if(options.ignoreSearch){
    const path=new URL(k).pathname;
    for(const [file,value] of records)if(new URL(file).pathname===path)return value;
   }
   return null;
  },
  async delete(request){return records.delete(key(request))},
  async put(request,value){writes.push(key(request));records.set(key(request),value)}
 };
 const caches={
  open:async()=>cache,keys:async()=>[GEN],
  delete:async()=>{deletes++;return true}
 };
 const self={location:{origin:ORIGIN,href:ORIGIN+'/sw.js'},
  addEventListener:(event,fn)=>{events[event]=fn},
  skipWaiting:async()=>{skips++},clients:{claim:async()=>{}}
 };
 const context={self,caches,fetch:(...args)=>network(...args),URL,Response,console:{warn(){}}};
 vm.runInNewContext(SW,context);
 async function install(){
  let promise;
  events.install({waitUntil:p=>{promise=p}});
  await promise;
 }
 async function request(url){
  const tasks=[];let response;
  const req={url,method:'GET',mode:'cors'};
  events.fetch({request:req,respondWith:p=>{response=p},waitUntil:p=>tasks.push(p)});
  assert.ok(response,'SW should handle the requested path');
  const value=await response;await Promise.all(tasks);
  return value;
 }
 return {install,request,records,writes,events,
  setNetwork:fn=>{network=fn},
  get skips(){return skips},get deletes(){return deletes}};
}
test('v127 worker refuses HTTP 200 HTML instead of a critical JS resource',async()=>{
 const bad='./assets/ck-full-exam-v82.js?v=134';
 const app=makeWorker({badCore:bad});
 await assert.rejects(app.install(),/Invalid critical offline asset/);
 assert.equal(app.skips,0);assert.equal(app.deletes,0);
 assert.equal(app.records.has(new URL(bad,ORIGIN+'/sw.js').href),false);
});
test('v127 worker refuses a JSON response in place of index HTML',async()=>{
 const app=makeWorker({badCore:'./index.html',badType:'application/json'});
 await assert.rejects(app.install(),/Invalid critical offline asset/);
 assert.equal(app.skips,0);
});
test('correct critical resources activate without mandatory optional precache success',async()=>{
 const app=makeWorker();app.setNetwork(async()=>({ok:false,status:503}));
 await app.install();assert.equal(app.skips,1);assert.equal(app.deletes,0);
 assert.ok(app.records.has(ORIGIN+'/data/official-2016-2020.json'));
});
test('offline JS rejects a different query version even from the same cache generation',async()=>{
 const app=makeWorker();
 const old=ORIGIN+'/assets/ck-study-editor-v80.js?v=126';
 const latest=ORIGIN+'/assets/ck-study-editor-v80.js?v=127';
 app.records.set(old,responseFor(old));
 app.setNetwork(async()=>{throw Error('offline')});
 const failed=await app.request(latest);
 assert.equal(failed.status,503,'v126 should not be returned for ?v=127');
 assert.equal(app.records.has(old),true);
 app.records.set(latest,responseFor(latest));
 const restored=await app.request(latest);
 assert.equal(restored.ok,true);
});
test('offline readiness validates content type as well as URL/query and worker generation',async()=>{
 const a=DIAG.indexOf('const OFFLINE_CACHE='),b=DIAG.indexOf('let root=null;',a);
 assert.ok(a>0&&b>a);
 const code=DIAG.slice(a,b);
 const api=new Function('window',code+';return {offlineHealth,OFFLINE_MINIMUM,OFFLINE_CACHE};')({});
 assert.equal(api.OFFLINE_CACHE,GEN);
 const store=new Map(api.OFFLINE_MINIMUM.map(p=>[p,responseFor(p)]));
 const stub={keys:async()=>[GEN],open:async()=>({match:async p=>store.get(p)})};
 const okay=await api.offlineHealth(stub,true);
 assert.equal(okay.cached,11);assert.equal(okay.ready,true);
 const noController=await api.offlineHealth(stub,false);
 assert.equal(noController.ready,false);
 const target='./data/official-2021-2025.json';
 store.set(target,responseFor(target,'text/html'));
 const invalid=await api.offlineHealth(stub,true);
 assert.equal(invalid.cached,10);assert.equal(invalid.ready,false);
 assert.ok(invalid.missing.includes(target));
});
function editorHarness(){
 const listeners={},db=new Map(),clicks=[];
 const key='ck80-explain-drafts-v1';
 db.set(key,JSON.stringify({'2025-1':{questionId:'2025-1',status:'draft',updatedAt:'2026-11-05T12:00:00Z'}}));
 const storage={getItem:k=>db.get(k)??null,setItem:(k,v)=>db.set(k,v)};
 const document={
  addEventListener:(name,fn)=>{(listeners[name]??=[]).push(fn)},
  querySelector:()=>null,
  createElement:()=>({remove(){},click(){clicks.push(true)}}),
  body:{appendChild(){}}
 };
 const window={addEventListener(){},RECALL_OFFICIAL:{}};
 const URL={createObjectURL:()=> 'blob:fake',revokeObjectURL(){}};
 const ctx={window,document,localStorage:storage,Blob:class{},URL,setTimeout:()=>1,CustomEvent:class{}};
 vm.runInNewContext(read('assets/ck-study-editor-v80.js'),ctx);
 return {api:window.CK80Editorial,db,clicks,listeners,key};
}
test('personal explanation JSON export rejects stale tabs before claiming a backup',()=>{
 const m=editorHarness();assert.equal(m.api.count(),1);
 m.db.set(m.key,JSON.stringify({'2025-1':{questionId:'2025-1',status:'draft',updatedAt:'2026-11-06T12:00:00Z'}}));
 assert.equal(m.api.exportJson(),false);
 assert.equal(m.clicks.length,0);
 assert.match(m.api.getStatus().lastStatus,/다른 탭/);
});
test('personal explanation JSON export refuses uncommitted editor input',()=>{
 const m=editorHarness();assert.equal(m.api.count(),1);
 const el={closest:s=>s==='[data-ck80-workspace]'?{}:null,
  matches:s=>s==='textarea,select,input:not([type="file"])'};
 for(const callback of m.listeners.input||[])callback({target:el});
 assert.equal(m.api.getStatus().editing,true);
 assert.equal(m.api.exportJson(),false);assert.equal(m.clicks.length,0);
 assert.match(m.api.getStatus().lastStatus,/저장하지 않은/);
});
test('OCR initializes on an empty browser profile without a stored draft',()=>{
 const window={addEventListener(){}},document={
  readyState:'loading',addEventListener(){},getElementById(){return null}};
 vm.runInNewContext(read('assets/ck-ocr-v118.js'),{
  window,document,localStorage:{getItem:()=>null},setTimeout:()=>1,clearTimeout(){}
 });
 assert.equal(window.CK118OCR.getState().issue,'');
 assert.equal(window.CK118OCR.getPageStatus().count,0);
});
test('OCR page backup detects cross-tab modification without deleting either copy',()=>{
 const data={schemaVersion:1,revision:1,items:[{
  id:'1234567890abcdef12345678',source:'PDF 원문 2쪽',documentKey:'hash',
  text:'OCR 개인 초안',updatedAt:Date.now()
 }]};
 const key='ck120-ocr-page-drafts-v1',raw=JSON.stringify(data),db=new Map([[key,raw]]);
 const window={addEventListener(){}};
 const document={readyState:'loading',addEventListener(){},getElementById(){return null}};
 const storage={getItem:k=>db.get(k)??null};
 vm.runInNewContext(read('assets/ck-ocr-v118.js'),
  {window,document,localStorage:storage,setTimeout:()=>1,clearTimeout(){}});
 assert.equal(window.CK118OCR.pageStoreIsCurrent(),true);
 db.set(key,JSON.stringify({...data,revision:2}));
 assert.equal(window.CK118OCR.pageStoreIsCurrent(),false);
 assert.equal(JSON.parse(db.get(key)).revision,2);
});
test('release remains read-only and cannot run GitHub Actions or Vercel auto-build',()=>{
 const script=read('scripts/check-release-readonly.cjs'),vc=JSON.parse(read('vercel.json'));
 assert.equal(vc.git.deploymentEnabled,false);
 assert.equal(fs.existsSync(path.join(root,'.github/workflows')),false);
 assert.match(script,/conceptknot-study-v135-typing-ime/);
 assert.match(script,/invalidCoreResponse/);
 assert.match(script,/if\(url.search\)return null/);
 new vm.Script(SW);new vm.Script(DIAG);
});
