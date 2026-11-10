/* v157 P0 service worker runtime: offline navigation, strict version, HTML poisoning guard. */
'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const script=fs.readFileSync('sw.js','utf8'),base='https://conceptknot.vercel.app/';
const canonical=input=>new URL(typeof input==='string'?input:input.url,base).href;
function Response(body='',options={}){
 this.ok=(options.status??200)>=200&&(options.status??200)<300;
 this.status=options.status??200;
 const headers=options.headers||{};
 this.headers={get:name=>headers[name]||headers[name.toLowerCase()]||null};
 this.body=body;
 this.clone=()=>new Response(this.body,{status:this.status,headers});
}
function fixture(){
 const handlers={},names=new Map();let offline=false,htmlPoison=false,skip=0,claim=0;
 const current='conceptknot-study-v157-resume-offline-omr-ime';
 const responseFor=input=>{
  const path=new URL(canonical(input)).pathname;
  const ct=path.endsWith('.html')?'text/html':path.endsWith('.json')?'application/json':
   path.endsWith('.css')?'text/css':'application/javascript';
  return new Response(path,{headers:{'content-type':ct}});
 };
 const caches={
  keys:async()=>[...names.keys()],
  open:async name=>{
   if(!names.has(name))names.set(name,new Map());
   const records=names.get(name);
   return {
    async addAll(paths){for(const path of paths)records.set(canonical(path),responseFor(path));},
    async match(input,options={}){
     if(options.ignoreSearch){
      const wanted=new URL(canonical(input)).pathname;
      for(const [url,resp] of records)if(new URL(url).pathname===wanted)return resp;
      return undefined;
     }
     return records.get(canonical(input))
    },
    async put(input,resp){records.set(canonical(input),resp)},
    async delete(input){return records.delete(canonical(input))}
   };
  },
  async delete(name){return names.delete(name)}
 };
 const self={
  location:{origin:'https://conceptknot.vercel.app',href:base+'sw.js'},
  addEventListener:(type,fn)=>handlers[type]=fn,
  skipWaiting:async()=>{skip++},
  clients:{claim:async()=>{claim++}}
 };
 const context={URL,Response,self,caches,
  console:{warn:()=>{},info:()=>{}},
  fetch:async request=>{
   if(offline)throw Error('offline');
   const uri=canonical(request);
   if(htmlPoison&&uri.includes('ck-full-exam-v82.js'))
    return new Response('<html>Error</html>',{headers:{'content-type':'text/html'}});
   return responseFor(request);
  }};
 vm.runInNewContext(script,context);
 async function install(){
  let p;handlers.install({waitUntil:promise=>{p=promise}});await p
 }
 async function activate(){
  let p;handlers.activate({waitUntil:promise=>{p=promise}});await p
 }
 async function request(path,mode='same-origin'){
  const r={url:canonical(path),method:'GET',mode};
  let p,wait;
  handlers.fetch({request:r,respondWith:promise=>p=promise,waitUntil:promise=>wait=promise});
  if(!p)return null;
  const result=await p;
  if(wait)await wait;
  return result;
 }
 return {install,activate,request,caches,names,
  offline:value=>{offline=value},poison:value=>{htmlPoison=value},
  skip:()=>skip,claim:()=>claim,current};
}
test('P0 offline critical JS and navigation HTML load from exact v157 cache',async()=>{
 const w=fixture();await w.install();await w.activate();
 A.equal(w.skip(),1);A.equal(w.claim(),1);
 w.offline(true);
 const js=await w.request('./assets/ck-full-exam-v82.js?v=157');
 const html=await w.request('./index.html','navigate');
 A.equal(js.status,200);A.equal(js.headers.get('content-type'),'application/javascript');
 A.equal(html.status,200);A.equal(html.headers.get('content-type'),'text/html');
});
test('P0 offline unknown v156 JS query never silently maps to v157 JS cache',async()=>{
 const w=fixture();await w.install();w.offline(true);
 const out=await w.request('./assets/ck-full-exam-v82.js?v=156');
 A.equal(out.status,503);A.match(out.body,/오프라인 자산이 없습니다/);
});
test('P0 online HTML masquerading as JS cannot poison a cached valid v157 asset',async()=>{
 const w=fixture();await w.install();w.poison(true);
 const out=await w.request('./assets/ck-full-exam-v82.js?v=157');
 A.equal(out.status,200);A.equal(out.headers.get('content-type'),'application/javascript');
 w.offline(true);
 const again=await w.request('./assets/ck-full-exam-v82.js?v=157');
 A.equal(again.headers.get('content-type'),'application/javascript');
});
test('P0 unrelated external request is not intercepted or cached',async()=>{
 const w=fixture();await w.install();
 A.equal(await w.request('https://example.org/x.js'),null);
});

