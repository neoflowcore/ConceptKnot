'use strict';
/* v139 verified 1-click AI cache simulator. No network, large download, or real speaker. */
const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto'),vm=require('node:vm');
const fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../assets/ck-tts-model-manager-v139.js'),'utf8');
const root={};vm.runInNewContext(source,{window:root,URL,Response,Uint8Array,Uint32Array});
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const revision='aafc6e32416a594460b32413efc49d7fe4ce6d46';
const base='/models/tts/supertonic-3/'+revision+'/';
const names=['onnx/duration_predictor.onnx','onnx/text_encoder.onnx','onnx/vector_estimator.onnx','onnx/vocoder.onnx','onnx/tts.json','onnx/unicode_indexer.json','voice_styles/F1.json','voice_styles/F2.json'];
const content=name=>Buffer.from('sample '+name);
const manifest=ready=>({schema:1,distributionReady:ready,revision,basePath:base,files:names.map(path=>({path,bytes:content(path).length,sha256:sha(content(path))}))});
function fakeCacheStorage(){
 const maps=new Map();
 return {async keys(){return [...maps.keys()]},async open(name){if(!maps.has(name))maps.set(name,new Map());const items=maps.get(name);return {
  async match(k){const v=items.get(k);return v?new Response(v,{headers:{'content-type':'application/json'}}):undefined;},
  async put(k,response){items.set(k,Buffer.from(await response.arrayBuffer()));},
  async delete(k){return items.delete(k)}
 };},async delete(name){return maps.delete(name)},maps};
}
function fixture({ready=true,corrupt='',metered=false}={}){
 const state=manifest(ready),store=fakeCacheStorage(),seen=[];
 const fetcher=async(url,opts)=>{
  seen.push({url,opts});
  if(url.endsWith('/models/tts/manifest.json'))return new Response(JSON.stringify(state),{headers:{'content-type':'application/json'}});
  const p=url.replace('https://demo.example'+base,'');
  return new Response(corrupt===p?Buffer.from('corrupt'):content(p),{headers:{'content-type':'application/octet-stream'}});
 };
 const model=root.CK139ModelManager.create({origin:'https://demo.example',fetcher,cacheStorage:store,
  connection:()=>metered?{type:'cellular'}:null,quota:()=>Promise.resolve({quota:1e9,usage:0})});
 return {model,seen,store,state};
}
test('incremental SHA-256 matches Node crypto at block boundaries',()=>{
 for(const len of [0,1,2,55,56,57,63,64,65,127,128,129,333,100000]){
  const b=crypto.randomBytes(len),h=root.CK139ModelManager.createSHA256();
  for(let i=0;i<len;i+=17)h.absorb(b.subarray(i,i+17));
  assert.equal(h.hex(),sha(b),'length='+len);
 }
});
test('unhosted manifest never permits fake model download',async()=>{
 const f=fixture({ready:false}),s=await f.model.status();
 assert.equal(s.ready,false);assert.equal(s.phase,'not-hosted');assert.equal(f.store.maps.size,0);
 await assert.rejects(()=>f.model.prepare({consent:true}),/모델 자체 호스팅/);
 assert.equal(f.seen.length,2);
});
test('consent required before requests',async()=>{
 const f=fixture();await assert.rejects(()=>f.model.prepare(),/명시적 동의/);
 assert.equal(f.seen.length,0);assert.equal(f.store.maps.size,0);
});
test('cellular and data saver block model requests by default',async()=>{
 const f=fixture({metered:true});await assert.rejects(()=>f.model.prepare({consent:true}),/셀룰러/);
 assert.equal(f.seen.length,0);
});
test('tampered file refuses ready state and deletes only model cache',async()=>{
 const f=fixture({corrupt:'onnx/vocoder.onnx'});
 await assert.rejects(()=>f.model.prepare({consent:true}),/SHA-256 불일치/);
 assert.equal(f.store.maps.size,0);assert.equal(f.model.getState().phase,'error');
});
test('validated cache reused without new binaries',async()=>{
 const f=fixture(),steps=[],r=await f.model.prepare({consent:true,onProgress:x=>steps.push(x)});
 assert.equal(r.ready,true);assert.equal(steps.at(-1).done,true);
 const before=f.seen.length,stat=await f.model.status();
 assert.equal(stat.ready,true);assert.equal(f.seen.length,before+1,'only manifest fetched');
 assert.equal(f.model.readyBase,'https://demo.example'+base);
 const after=f.seen.length,r2=await f.model.prepare({consent:true});
 assert.equal(r2.ready,true);assert.equal(f.seen.length,after+1,'repeat preparation reads manifest, no weights');
 assert.equal(f.store.maps.size,1);
});
