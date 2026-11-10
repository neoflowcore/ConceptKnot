/* previous: conceptknot-study-v137-native-voice-guard */
/* previous generations: conceptknot-study-v137-native-voice-guard, conceptknot-study-v138-unified-voice-queue */
/* previous core: conceptknot-study-v139-managed-model-guard */
const CACHE='conceptknot-study-v152-p4-160-new-study-drafts';const ASSETS=['./assets/ck-tts-model-manager-v139.js?v=139','./assets/ck-voice-controller-v138.js?v=138','./assets/ck-exam-hub-v133.js?v=134','./assets/ck-exam-hub-v133.css?v=133','./assets/ck-mixed-review-v131.js?v=140','./assets/ck-mixed-review-v131.css?v=131','./assets/ck-mixed-mock-v129.js?v=134','./assets/ck-mixed-mock-v129.css?v=130','./assets/ck-manual-qa-v115.js?v=130','./assets/ck-manual-qa-v115.css?v=115','./assets/ck-evidence-queue-v111.js?v=114','./assets/ck-evidence-queue-v111.css?v=114','./assets/ck-official-bank-v89.js?v=89','./data/official-2016-2020.json','./data/official-2021-2025.json','./assets/ck-data-diagnostics-v88.css?v=125','./assets/ck-data-diagnostics-v88.js?v=140','./assets/ck-data-integrity-v86.js?v=120','./assets/ck-exam-bridge-v86.js?v=86','./assets/ck-study-plan-v84.js?v=84','./assets/ck-study-materials-v84.js?v=128','./assets/ck-study-tools-v84.css?v=84','./assets/ck-study-recall-v83.js?v=83','./assets/ck-study-links-v83.js?v=115','./assets/ck-study-analytics-v83.js?v=117','./assets/ck-study-intelligence-v83.css?v=83','./assets/ck-full-exam-v82.js?v=140','./assets/ck-full-exam-v82.css?v=82','./assets/ck-study-workbench-v81.js?v=112','./assets/ck-study-workbench-v81.css?v=104','./assets/ck-study-editor-v80.js?v=127','./assets/ck-study-editor-v80.css?v=113','./assets/ck-study-review-v79.js?v=79','./assets/ck-study-review-v79.css?v=79','./assets/ck-study-final-v79.js?v=79','./assets/ck-study-final-v79.css?v=79','./assets/ck-three-step-v148.js?v=149','./assets/ck-graph-motion-v149.js?v=149','./assets/ck-graph-direct-v149.js?v=150','./assets/ck-graph-direct-v149.css?v=149','./assets/ck-three-step-v148.css?v=148','./assets/ck-study-charts-v79.js?v=150','./assets/ck-learning-scenarios-v150.js?v=150','./assets/ck-scenario-ui-v150.js?v=150','./assets/ck-scenario-ui-v150.css?v=150','./assets/ck-concept-math-v141.js?v=141','./assets/ck-concept-coach-v143.js?v=143','./assets/ck-concept-gesture-v145.js?v=145','./assets/ck-concept-transition-v144.js?v=145','./assets/ck-concept-transition-view-v144.js?v=148','./assets/ck-concept-lab-v141.js?v=150','./assets/ck-concept-lab-v141.css?v=142','./assets/ck-theory-models-v142.js?v=142','./assets/ck-theory-v142.js?v=150','./assets/ck-theory-v142.css?v=142','./assets/ck-concept-intuition-v143.css?v=143','./assets/ck-concept-transition-v144.css?v=144','./assets/ck-concept-touch-fix-v145.css?v=145','./assets/ck-study-charts-v79.css?v=145','./assets/ck-study-p4-v78.js?v=114','./assets/ck-study-p4-v78.css?v=111','./data/reports/analysis-candidates-v78.json?v=152','./assets/ck-study-p6-v76.js?v=76','./assets/ck-study-p6-v76.css?v=76','./data/reports/recent-five-coverage.json','./assets/ck-logo-owl-brown-lime-big-pencil-v65.png','./assets/ck-logo-owl-brown-lime-v62.png','./assets/ck-pen-input-v60.js?v=142','./assets/ck-nav-drag-v56.js?v=128','./assets/ck-pdf-workspace-v15.js?v=118','./assets/ck-ocr-v118.js?v=127','./assets/ck-ocr-v118.css?v=120','./assets/ck-pdf-tools-v117.css?v=117','./assets/ck-pen-scope-v59.css','./assets/ck-study-extensions-v10.js?v=59','./assets/ck-mobile-board-v21.js?v=59','./assets/ck-theme-parity-v58.css?v=61','./assets/ck-experience-v14.js','./assets/ck-dot-landing-v57.js?v=132','./assets/ck-dot-landing-v57.css','./assets/ck-dot-landing-dark-v74.css?v=75','./assets/ck-nav-single-row-v56.css','./assets/ck-dot-landing-v54.js','./assets/ck-dot-landing-v54.css','./assets/ck-dot-landing-v53.js','./assets/ck-dot-landing-v53.css','./assets/ck-dot-lion-front-v53.webp','./assets/ck-dot-lion-closed-v53.webp','./assets/ck-dot-lion-sleep-v53.webp','./assets/ck-dot-study-still-v53.webp','./assets/ck-dot-landing-v50.js','./assets/ck-dot-landing-v50.css','./assets/ck-dot-landing-v49.js','./assets/ck-dot-landing-v49.css','./assets/ck-dot-lion-closed-v49.webp','./assets/ck-dot-owl-tight-v49.webp','./assets/ck-dot-landing-v48.js','./assets/ck-dot-landing-v48.css','./assets/ck-dot-landing-v47.js','./assets/ck-dot-landing-v47.css','./assets/ck-dot-lion-front-v47.webp','./assets/ck-dot-lion-sleep-v47.webp','./assets/ck-dot-owl-v47.webp','./assets/ck-dot-cumulus-v47.webp','./assets/ck-dot-landing-v1.js','./assets/ck-dot-landing-v1.css','./assets/sky-reference-v44.png','./assets/ck-color-picker-v43.js','./assets/ck-rail3d-v42.mjs','./vendor/three.module.min.js','./assets/ck-mascot-kit-v33.js','./assets/ck-face-atlas-v35.js','./assets/ck-garden-25d-v36.js','./assets/ck-garden-25d-v36.css','./assets/garden-clean-v37.webp','./assets/bird-v37.webp','./assets/ck-legacy-motion-v37.js','./assets/cub-pencil-v36.webp','./assets/cub-sleep-v36.webp','./experience-v26.css','./assets/ck-official-legacy-v23.js','./experience-v21.css?v=114','./assets/ck-charts-v21.js?v=149','./assets/ck-gpu-guard-v21.js?v=128','./assets/ck-mobile-board-v21.js','./assets/ck-mock-judge-v21.js','./assets/ck-logo-v21.svg','./experience-v20.css','./assets/ck-visual40-v20.js','./assets/ck-mock-v20.js','./experience-v19.css','./assets/ck-pdf-night-v19.js','./assets/ck-shortcuts-v19.js?v=136','./assets/ck-typing-layout-v31.js?v=135','./assets/ck-typing-modes-v61.css?v=61','./assets/ck-typing-precision-v62.css?v=135','./assets/ck-board-compact-v63.css?v=63','./assets/ck-note-context-v64.css?v=64','./assets/ck-note-context-v64.js?v=64','./assets/ck-board-stability-v65.css?v=65','./assets/ck-official-explain-v30.js','./neural-tts.mjs','./vendor/supertonic-helper.mjs','./experience-v17.css','./assets/ck-display-v17.js','./','./index.html','./clay-workspace.css','./design-locked-v1.css','./design-v2-glass.css?v=61','./ui-fix-v3.css','./home-scroll-v5.css?v=61','./workspace-glass-v6.css','./assets/ck-playground-fallback-v6.css','./assets/ck-playground-fallback-v6.svg','./assets/ck-navigation-v5.js?v=136','./assets/ck-experience-v9.js','./experience-v9.css','./experience-v10.css','./experience-v13.css','./experience-v14.css','./experience-v15.css','./experience-v16.css','./assets/ck-layout-v16.js','./assets/ck-experience-v14.js','./assets/ck-study-extensions-v10.js','./assets/ck-brand-chatgpt.svg','./assets/ck-brand-gemini.svg','./assets/ck-brand-claude.svg','./assets/ck-landscape-textured-v2.svg','./assets/ck-design-hills.svg','./manifest.webmanifest','./icon-192.png','./icon-512.png','./data/explanations/official-2021.json?v=152','./data/explanations/official-2022.json?v=152','./data/explanations/official-2023.json?v=152','./data/explanations/official-2024.json?v=152','./data/explanations/official-2025.json?v=152','./data/concept-taxonomy-v1.json','./data/concept-occurrences-v1.json']; 
const HOT=["./assets/ck-tts-model-manager-v139.js?v=139","./assets/ck-voice-controller-v138.js?v=138","./assets/ck-exam-hub-v133.js?v=134","./assets/ck-exam-hub-v133.css?v=133","./assets/ck-mixed-review-v131.js?v=140","./assets/ck-mixed-review-v131.css?v=131","./assets/ck-mixed-mock-v129.js?v=134","./assets/ck-mixed-mock-v129.css?v=130","./assets/ck-pen-input-v60.js?v=142","./assets/ck-display-v17.js","./assets/ck-visual40-v20.js","./assets/ck-mock-v20.js","./assets/ck-official-legacy-v23.js","./assets/ck-charts-v21.js?v=149","./assets/ck-mock-judge-v21.js","./assets/ck-gpu-guard-v21.js?v=128","./assets/ck-mobile-board-v21.js?v=59","./assets/ck-navigation-v5.js?v=136","./assets/ck-nav-drag-v56.js?v=128","./assets/ck-manual-qa-v115.js?v=130","./assets/ck-manual-qa-v115.css?v=115","./assets/ck-legacy-motion-v37.js","./assets/ck-dot-landing-v57.js?v=132","./assets/ck-garden-25d-v36.js?v=132","./assets/ck-experience-v9.js","./assets/ck-study-extensions-v10.js?v=59","./assets/ck-study-p6-v76.js?v=76","./assets/ck-study-p4-v78.js?v=114","./assets/ck-study-review-v79.js?v=79","./assets/ck-study-final-v79.js?v=79","./assets/ck-three-step-v148.js?v=149","./assets/ck-three-step-v148.css?v=148","./assets/ck-graph-motion-v149.js?v=149","./assets/ck-graph-direct-v149.js?v=150","./assets/ck-graph-direct-v149.css?v=149","./assets/ck-study-charts-v79.js?v=150","./assets/ck-concept-math-v141.js?v=141","./assets/ck-concept-coach-v143.js?v=143","./assets/ck-concept-gesture-v145.js?v=145","./assets/ck-concept-transition-v144.js?v=145","./assets/ck-concept-transition-view-v144.js?v=148","./assets/ck-concept-lab-v141.js?v=148","./assets/ck-concept-lab-v141.css?v=142","./assets/ck-theory-models-v142.js?v=142","./assets/ck-theory-v142.js?v=148","./assets/ck-theory-v142.css?v=142","./assets/ck-concept-intuition-v143.css?v=143","./assets/ck-concept-transition-v144.css?v=144","./assets/ck-concept-touch-fix-v145.css?v=145","./assets/ck-study-editor-v80.js?v=127","./assets/ck-study-workbench-v81.js?v=112","./assets/ck-official-bank-v89.js?v=89","./assets/ck-full-exam-v82.js?v=140","./assets/ck-study-recall-v83.js?v=83","./assets/ck-study-links-v83.js?v=115","./assets/ck-study-analytics-v83.js?v=117","./assets/ck-study-plan-v84.js?v=84","./assets/ck-study-materials-v84.js?v=128","./assets/ck-data-integrity-v86.js?v=120","./assets/ck-exam-bridge-v86.js?v=86","./assets/ck-data-diagnostics-v88.js?v=140","./assets/ck-experience-v14.js","./assets/ck-pdf-workspace-v15.js?v=118","./assets/ck-ocr-v118.js?v=127","./assets/ck-ocr-v118.css?v=120","./assets/ck-pdf-tools-v117.css?v=117","./assets/ck-layout-v16.js","./assets/ck-pdf-night-v19.js","./assets/ck-shortcuts-v19.js?v=136","./assets/ck-official-explain-v30.js","./clay-workspace.css","./design-locked-v1.css","./design-v2-glass.css?v=61","./ui-fix-v3.css","./home-scroll-v5.css?v=61","./workspace-glass-v6.css","./experience-v9.css","./experience-v10.css","./assets/ck-playground-fallback-v6.css","./experience-v13.css","./experience-v14.css","./experience-v15.css","./experience-v16.css","./experience-v17.css","./experience-v19.css","./experience-v20.css","./experience-v21.css?v=114","./experience-v26.css","./assets/ck-typing-modes-v61.css?v=61","./assets/ck-garden-25d-v36.css","./assets/ck-dot-landing-v57.css","./assets/ck-nav-single-row-v56.css","./assets/ck-theme-parity-v58.css?v=61","./assets/ck-pen-scope-v59.css","./assets/ck-typing-precision-v62.css?v=135","./assets/ck-study-p6-v76.css?v=76","./assets/ck-study-p4-v78.css?v=111","./assets/ck-study-review-v79.css?v=79","./assets/ck-study-final-v79.css?v=79","./assets/ck-study-charts-v79.css?v=145","./assets/ck-study-editor-v80.css?v=113","./assets/ck-study-workbench-v81.css?v=104","./assets/ck-full-exam-v82.css?v=82","./assets/ck-study-intelligence-v83.css?v=83","./assets/ck-study-tools-v84.css?v=84","./assets/ck-board-compact-v63.css?v=63","./assets/ck-note-context-v64.css?v=64","./assets/ck-board-stability-v65.css?v=65","./assets/ck-dot-landing-dark-v74.css?v=75","./assets/ck-data-diagnostics-v88.css?v=125","./data/official-2016-2020.json','./data/official-2021-2025.json","./data/explanations/official-2021.json?v=152","./data/explanations/official-2022.json?v=152","./data/explanations/official-2023.json?v=152","./data/explanations/official-2024.json?v=152","./data/explanations/official-2025.json?v=152","./data/concept-taxonomy-v1.json","./data/concept-occurrences-v1.json","./manifest.webmanifest","./icon-192.png","./icon-512.png"];
/* Minimum core that must be available before replacing a working older offline generation.
 * Optional assets remain best effort; a failed core fetch blocks SW activation. */
const CRITICAL=[
 './index.html',
 './assets/ck-data-diagnostics-v88.js?v=140',
 './assets/ck-data-diagnostics-v88.css?v=125',
 './assets/ck-manual-qa-v115.js?v=130',
 './assets/ck-study-links-v83.js?v=115',
 './assets/ck-study-editor-v80.js?v=127',
 './assets/ck-data-integrity-v86.js?v=120',
 './assets/ck-official-bank-v89.js?v=89',
 './assets/ck-full-exam-v82.js?v=140',
 './data/official-2016-2020.json',
 './data/official-2021-2025.json'
];
self.addEventListener('install',e=>e.waitUntil((async()=>{
 const cache=await caches.open(CACHE);
 try{
  // Failing here leaves an already-active older service worker in control.
  await cache.addAll(CRITICAL);
  // addAll checks HTTP status, but a CDN rewrite may return HTTP 200 HTML for JS/JSON.
  // Such a cache must never activate as the new offline generation.
  for(const path of CRITICAL){
   const response=await cache.match(path);
   if(!response?.ok||invalidCoreResponse(path,response)){
    try{await cache.delete(path)}catch{}
    throw Error('Invalid critical offline asset: '+path);
   }
  }
 }catch(error){
  console.warn('ConceptKnot: 필수 오프라인 자산 미완료. 구버전 캐시를 보존하며 업데이트 보류.',error);
  throw error;
 }
 const optional=HOT.filter(path=>!CRITICAL.includes(path)&&path!=='./');
 let index=0,failed=0,stored=0;
 const worker=async()=>{
  while(index<optional.length){
   const url=optional[index++];
   try{
    const response=await fetch(url,{cache:'no-cache'});
    if(!response.ok||htmlInsteadOfAsset(url,response))throw Error('Invalid asset '+response.status);
    await cache.put(url,response);stored++;
   }catch{failed++;}
  }
 };
 await Promise.all(Array.from({length:Math.min(4,optional.length)},worker));
 if(failed)console.warn('ConceptKnot: 추가 오프라인 자산 '+failed+'건 누락. 온라인에서 해당 기능을 한 번 열어주세요.');
 await self.skipWaiting();
})()));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('conceptknot-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
/* A read-only handshake: checking a cache entry alone cannot identify the SW controlling this tab. */
self.addEventListener('message',event=>{
 if(event.data?.type!=='CK_SW_VERSION_PING')return;
 try{event.ports?.[0]?.postMessage({app:'ConceptKnot',cache:CACHE,required:CRITICAL.length})}catch{}
});
/* Avoid caching an HTML error/fallback as JavaScript, CSS, or a data JSON file. */
function invalidCoreResponse(path,response){
 const type=String(response?.headers?.get?.('content-type')||'').toLowerCase();
 const url=new URL(path,self.location.href);
 if(/\.html$/i.test(url.pathname))return Boolean(type&&!type.includes('text/html'));
 return htmlInsteadOfAsset(path,response);
}
function htmlInsteadOfAsset(request,response){
 const url=typeof request==='string'?new URL(request,self.location.href):new URL(request.url);
 return /\.(?:js|mjs|css|json|svg|png|webp)$/i.test(url.pathname)&&
  /text\/html/i.test(String(response.headers?.get?.('content-type')||''));
}
const ASSET_PATHS=new Set(ASSETS.map(path=>new URL(path,self.location.href).pathname));
// The 398MB model must never be part of the 11-file PWA core, ASSETS, or HOT.
// Only a separately verified, explicitly consented model cache may serve its bytes.
const MODEL_REVISION='aafc6e32416a594460b32413efc49d7fe4ce6d46';
const MODEL_PATH=new URL('./models/tts/supertonic-3/'+MODEL_REVISION+'/',self.location.href).pathname;
const MODEL_CACHE='ck-managed-tts-'+MODEL_REVISION;
/* v127: never fall back to an incompatible query version or a different generation. */
async function cachedCurrent(request){
 const cache=await caches.open(CACHE);
 const exact=await cache.match(request);
 if(exact)return exact;
 // Versioned URLs are immutable cache identities. Never satisfy ?v=127 from ?v=126.
 const url=new URL(typeof request==='string'?request:request.url,self.location.href);
 if(url.search)return null;
 return (await cache.match(request,{ignoreSearch:true}))||null;
}
const offlineResponse=()=>new Response('현재 버전의 오프라인 자산이 없습니다. 온라인 연결 후 다시 열어 주세요.',
 {status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}});
self.addEventListener('fetch',e=>{
 const u=new URL(e.request.url);
 if(e.request.method!=='GET'||u.origin!==self.location.origin)return;
 if(u.pathname.startsWith(MODEL_PATH)){
  // Prefer a previously SHA-256-verified model cache. No cache write in SW.
  e.respondWith((async()=>{
   try{
    if((await caches.keys()).includes(MODEL_CACHE)){
     const model=await caches.open(MODEL_CACHE),response=await model.match(e.request);
     if(response)return response;
    }
    return await fetch(e.request);
   }catch{return offlineResponse();}
  })());
  return;
 }
 if(e.request.mode==='navigate'){
  e.respondWith(fetch(e.request).then(r=>{
   if(r.ok&&(!r.headers?.get?.('content-type')||/text\/html/i.test(r.headers.get('content-type')))){
    const c=r.clone();e.waitUntil(caches.open(CACHE).then(x=>x.put('./index.html',c)).catch(()=>{}));
   }
   return r;
  }).catch(async()=>await cachedCurrent('./index.html')||offlineResponse()));
  return;
 }
 if(ASSET_PATHS.has(u.pathname)){
  e.respondWith(fetch(e.request,{cache:'no-cache'}).then(async r=>{
   if(r.ok&&!htmlInsteadOfAsset(e.request,r)){
    const copy=r.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{}));return r;
   }
   return (await cachedCurrent(e.request))||(r.ok?offlineResponse():r);
  }).catch(async()=>await cachedCurrent(e.request)||offlineResponse()));
 }
});
