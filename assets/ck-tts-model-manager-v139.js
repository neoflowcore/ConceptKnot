/* ConceptKnot 139. Model binaries are never prefetched implicitly.
 * Verified, consent-gated, versioned cache separated from the PWA offline core.
 */
(function(root){
 'use strict';
 const IV=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
 const K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
 const ror=(n,b)=>(n>>>b)|(n<<(32-b));
 class SHA256{
  constructor(){this.h=IV.slice();this.block=new Uint8Array(64);this.used=0;this.total=0;}
  absorb(bytes){
   for(let i=0;i<bytes.length;i++){
    this.block[this.used++]=bytes[i];
    if(this.used===64){this.compress();this.used=0;}
   }
   this.total+=bytes.length;
   return this;
  }
  compress(){
   const w=new Uint32Array(64),b=this.block;
   for(let i=0;i<16;i++){const j=i*4;w[i]=((b[j]<<24)|(b[j+1]<<16)|(b[j+2]<<8)|b[j+3])>>>0;}
   for(let i=16;i<64;i++){
    const a=w[i-15],c=w[i-2];
    w[i]=((ror(c,17)^ror(c,19)^(c>>>10))+w[i-7]+(ror(a,7)^ror(a,18)^(a>>>3))+w[i-16])>>>0;
   }
   let [a,b0,c,d,e,f,g,h]=this.h;
   for(let i=0;i<64;i++){
    const p=(h+(ror(e,6)^ror(e,11)^ror(e,25))+((e&f)^(~e&g))+K[i]+w[i])>>>0;
    const q=((ror(a,2)^ror(a,13)^ror(a,22))+((a&b0)^(a&c)^(b0&c)))>>>0;
    h=g;g=f;f=e;e=(d+p)>>>0;d=c;c=b0;b0=a;a=(p+q)>>>0;
   }
   const t=[a,b0,c,d,e,f,g,h];for(let i=0;i<8;i++)this.h[i]=(this.h[i]+t[i])>>>0;
  }
  hex(){
   const bits=this.total*8;
   this.block[this.used++]=128;
   if(this.used>56){while(this.used<64)this.block[this.used++]=0;this.compress();this.used=0;}
   while(this.used<56)this.block[this.used++]=0;
   const hi=Math.floor(bits/0x100000000),lo=bits>>>0;
   for(let i=0;i<4;i++)this.block[56+i]=(hi>>>(24-i*8))&255;
   for(let i=0;i<4;i++)this.block[60+i]=(lo>>>(24-i*8))&255;
   this.compress();this.used=0;
   return this.h.map(v=>v.toString(16).padStart(8,'0')).join('');
  }
 }
 function inspectManifest(manifest,origin){
  if(!manifest||manifest.schema!==1||manifest.distributionReady!==true)
   return {ok:false,reason:'모델 자체 호스팅 준비 중'};
  if(!/^[a-f0-9]{40}$/.test(String(manifest.revision||'')))return {ok:false,reason:'모델 버전 서명이 없습니다.'};
  const base=String(manifest.basePath||'');
  if(!/^\/models\/tts\/supertonic-3\/[a-f0-9]{40}\/$/.test(base)||!base.includes(manifest.revision))
   return {ok:false,reason:'버전 고정 경로가 올바르지 않습니다.'};
  if(!Array.isArray(manifest.files)||manifest.files.length<8||manifest.files.length>18)
   return {ok:false,reason:'모델 파일 명세가 불완전합니다.'};
  const names=new Set();let bytes=0;
  for(const f of manifest.files){
   if(!f||!/^(onnx\/(duration_predictor|text_encoder|vector_estimator|vocoder)\.onnx|onnx\/(tts|unicode_indexer)\.json|voice_styles\/F[1-5]\.json)$/.test(String(f.path||''))||names.has(f.path)||
      !Number.isSafeInteger(f.bytes)||f.bytes<=0||!/^[a-f0-9]{64}$/.test(String(f.sha256||'')))
    return {ok:false,reason:'모델 파일 체크섬·크기·파일 이름 검증 실패'};
   names.add(f.path);bytes+=f.bytes;
  }
  if(!['duration_predictor','text_encoder','vector_estimator','vocoder'].every(x=>names.has('onnx/'+x+'.onnx'))||
      !names.has('onnx/tts.json')||!names.has('onnx/unicode_indexer.json')||!names.has('voice_styles/F1.json'))
   return {ok:false,reason:'ONNX 필수 구성요소가 누락됐습니다.'};
  if(bytes>650000000)return {ok:false,reason:'모델 크기가 허용 범위를 초과했습니다.'};
  return {ok:true,basePath:new URL(base,origin).href,cacheName:'ck-managed-tts-'+manifest.revision,bytes};
 }
 async function digestResponse(response){
  const hash=new SHA256();let bytes=0;
  if(!response.body?.getReader)throw Error('스트리밍 파일 검증을 지원하지 않습니다.');
  const rd=response.body.getReader();
  try{for(;;){const x=await rd.read();if(x.done)break;hash.absorb(x.value);bytes+=x.value.byteLength;}}
  finally{rd.releaseLock();}
  return {bytes,sha256:hash.hex()};
 }
 function create(options={}){
  const host=options.origin || (typeof location!=='undefined'?location.origin:'https://localhost');
  const fetcher=options.fetcher || ((...args)=>fetch(...args));
  const storage=options.cacheStorage || (typeof caches!=='undefined'?caches:null);
  const connection=options.connection || (()=>typeof navigator!=='undefined'?navigator.connection:null);
  const quota=options.quota || (()=>typeof navigator!=='undefined'?navigator.storage?.estimate?.():null);
  let modelBase='',phase='not-installed',issue='모델 자체 호스팅 준비 중',lastBytes=0;
  const manifestUrl=new URL('/models/tts/manifest.json',host).href;
  async function getManifest(){
   try{
    const response=await fetcher(manifestUrl,{cache:'no-store'});
    if(!response?.ok)throw Error('모델 매니페스트를 가져올 수 없습니다.');
    return response.json();
   }catch(error){
    // A verified user's existing model must remain discoverable when offline.
    if(storage){
     const keys=(await storage.keys()).filter(n=>n.startsWith('ck-managed-tts-'));
     for(const key of keys){
      const receipt=await (await storage.open(key)).match(manifestUrl);
      if(receipt){const data=await receipt.json().catch(()=>null);
       if(data?.manifest&&inspectManifest(data.manifest,host).ok)return data.manifest;}
     }
    }
    throw error;
   }
  }
  async function status(){
   let manifest;
   try{manifest=await getManifest();}catch(err){phase='unavailable';issue=String(err?.message||err);return {ready:false,phase,issue};}
   const proof=inspectManifest(manifest,host);
   if(!proof.ok){phase='not-hosted';issue=proof.reason;return {ready:false,phase,issue};}
   if(!storage){phase='not-supported';issue='이 브라우저는 모델 별도 캐시를 지원하지 않습니다.';return {ready:false,phase,issue};}
   const names=await storage.keys();if(!names.includes(proof.cacheName)){
    phase='not-installed';issue='고음질 음성 모델 다운로드가 필요합니다.';
    return {ready:false,phase,issue,bytes:proof.bytes};
   }
   const cache=await storage.open(proof.cacheName),marker=await cache.match(manifestUrl);
   if(!marker){phase='partial';issue='모델 무결성 확인이 완료되지 않았습니다.';return {ready:false,phase,issue};}
   const receipt=await marker.json().catch(()=>null);
   if(receipt?.revision!==manifest.revision||receipt?.files!==manifest.files.length){phase='partial';issue='모델 버전이 바뀌었습니다.';return {ready:false,phase,issue};}
   for(const f of manifest.files){if(!await cache.match(new URL(f.path,proof.basePath).href)){
    phase='partial';issue='모델 파일이 누락됐습니다: '+f.path;return {ready:false,phase,issue};
   }}
   modelBase=proof.basePath;phase='ready';issue='기기 캐시에 검증된 고음질 모델이 있습니다.';
   return {ready:true,phase,issue,basePath:modelBase,bytes:proof.bytes};
  }
  async function prepare({consent=false,allowMetered=false,onProgress=()=>{}}={}){
   if(consent!==true)throw Error('대용량 모델 다운로드는 명시적 동의가 필요합니다.');
   if(!storage)throw Error('모델 캐시를 지원하지 않는 기기입니다.');
   const cachedNames=await storage.keys();
   if(cachedNames.some(name=>name.startsWith('ck-managed-tts-'))){
    const existing=await status();if(existing.ready)return existing;
   }
   const conn=connection();if(!allowMetered&&(conn?.saveData||conn?.type==='cellular'))
    throw Error('데이터 절약/셀룰러에서는 자동 다운로드하지 않습니다. Wi-Fi 연결을 권장합니다.');
   const manifest=await getManifest(),proof=inspectManifest(manifest,host);
   if(!proof.ok)throw Error(proof.reason);
   const space=await quota();if(space&&Number.isFinite(space.quota)&&Number.isFinite(space.usage)&&
      space.quota-space.usage<proof.bytes*1.15)throw Error('기기 저장 여유 공간이 충분하지 않습니다.');
   phase='downloading';issue='모델 파일 다운로드 및 검증 중';
   const cache=await storage.open(proof.cacheName);
   try{
    for(let i=0;i<manifest.files.length;i++){
     const f=manifest.files[i],url=new URL(f.path,proof.basePath).href;
     onProgress({completed:i,total:manifest.files.length,path:f.path,bytes:f.bytes});
     const response=await fetcher(url,{cache:'no-store',mode:'same-origin'});
     if(!response?.ok||/text\/html/i.test(String(response.headers?.get?.('content-type')||'')))
      throw Error('잘못된 모델 응답: '+f.path);
     const storing=cache.put(url,response.clone());
     const [verified]=await Promise.all([digestResponse(response),storing]);
     if(verified.bytes!==f.bytes||verified.sha256!==f.sha256){await cache.delete(url);throw Error('모델 파일 SHA-256 불일치: '+f.path);}
     lastBytes+=verified.bytes;
    }
    await cache.put(manifestUrl,new Response(JSON.stringify({revision:manifest.revision,files:manifest.files.length,manifest}),
      {headers:{'content-type':'application/json'}}));
    modelBase=proof.basePath;phase='ready';issue='모델 전체 SHA-256 검증 및 캐시 완료';
    onProgress({completed:manifest.files.length,total:manifest.files.length,done:true});
    return {ready:true,bytes:lastBytes,basePath:modelBase};
   }catch(err){
    await storage.delete(proof.cacheName).catch(()=>{});
    phase='error';issue=String(err?.message||err);throw err;
   }
  }
  return Object.freeze({status,prepare,getState:()=>({phase,issue,basePath:modelBase,bytes:lastBytes}),
   get readyBase(){return phase==='ready'?modelBase:''}});
 }
 root.CK139ModelManager=Object.freeze({create,inspectManifest,createSHA256:()=>new SHA256()});
})(typeof window==='object'?window:globalThis);
