/* v88 personal data diagnostics — read-only until explicit download. */
(function(){
'use strict';
const items=[['recallgraph-first-exam-v1','학습기록'],['ck10-exam-final-v1','최종 정리본'],['ck11-final-page-count','정리본 페이지'],['ck80-explain-drafts-v1','개인 해설'],['ck81-review-workbench-v1','해설 작업대'],['ck82-exam-sessions-v1','실전 기록'],['ck83-personal-concept-links-v1','개념 연결'],['ck84-study-plan-v1','학습계획'],['ck84-personal-materials-v1','개인 교재'],
 ['ck115-manual-device-verification-v1','수기 실기검증표'],
 ['ck118-personal-ocr-draft-v1','개인 OCR 단일 초안'],
 ['ck120-ocr-page-drafts-v1','OCR 페이지별 초안 보관함']];
const safe=s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
function inspect(storage=localStorage){
 return items.map(([key,name])=>{
  try{
   const raw=storage.getItem(key);
   if(raw===null)return {key,name,status:'empty',bytes:0};
   if(key==='ck11-final-page-count')
    return {key,name,status:/^[1-5]$/.test(raw)?'ok':'invalid',bytes:raw.length};
   const data=JSON.parse(raw);
   const validArray=key==='ck10-exam-final-v1';
   if(validArray){
    const valid=Array.isArray(data)&&data.length===5&&data.every(p=>Array.isArray(p)&&p.length===2);
    return {key,name,status:valid?'ok':'invalid',bytes:raw.length};
   }
   if(!data||typeof data!=='object'||Array.isArray(data))return {key,name,status:'invalid',bytes:raw.length};
   const methods={
    'recallgraph-first-exam-v1':()=>['estate','civil'].includes(data.subject)&&
      data.answers&&typeof data.answers==='object'&&!Array.isArray(data.answers)&&
      data.quizAnswers&&typeof data.quizAnswers==='object'&&!Array.isArray(data.quizAnswers)&&
      data.flashVisits&&typeof data.flashVisits==='object'&&!Array.isArray(data.flashVisits),
    'ck80-explain-drafts-v1':()=>Object.entries(data).length<=800&&
      Object.entries(data).every(([id,v])=>/^20(?:1[6-9]|2[0-5])-(?:[1-9]|[1-7]\d|80)$/.test(id)&&
        v&&typeof v==='object'&&!Array.isArray(v))&&
      (!window.CK86Integrity?.validateExtra||window.CK86Integrity.validateExtra(key,raw)),
    'ck81-review-workbench-v1':()=>window.CK81Workbench?.sanitizeProgress?.(data),
    'ck82-exam-sessions-v1':()=>window.CK82FullExam?.cleanStore?.(data),
    'ck83-personal-concept-links-v1':()=>window.CK83Links?.sanitize?.(data),
    'ck84-study-plan-v1':()=>window.CK84Plan?.sanitize?.(data),
    'ck84-personal-materials-v1':()=>window.CK84Materials?.sanitize?.(data),
    'ck115-manual-device-verification-v1':()=>window.CK115QA?.sanitize?.(data),
    'ck118-personal-ocr-draft-v1':()=>window.CK118OCR?.sanitize?.(data),
    'ck120-ocr-page-drafts-v1':()=>window.CK118OCR?.sanitizePageStore?.(data)
   };
   const valid=methods[key]?Boolean(methods[key]()):true;
   return {key,name,status:valid?'ok':'invalid',bytes:raw.length};
  }catch{return {key,name,status:'invalid',bytes:0};}
 });
}

/* v105: personal evidence readiness never changes the official answer bank. */
const canonicalId=id=>/^20(?:1[6-9]|2[0-5])-(?:[1-9]|[1-7]\d|80)$/.test(String(id||''));
function reviewRows(records=window.RECALL_OFFICIAL||{},links=window.CK83Links?.getRecords?.()||{}){
 const rows=[];
 for(const [id,q] of Object.entries(records||{})){
  if(!canonicalId(id)||q?.verified!==true||q.id!==id)continue;
  const year=Number(id.split('-')[0]),number=Number(id.split('-')[1]);
  const saved=links?.[id]||{},notes=saved.optionNotes||{};
  const options=Array.from({length:5},(_,i)=>notes[i+1]||{});
  const assessed=options.filter(n=>['true','false','conditional'].includes(n.assessment)).length;
  const reasoned=options.filter(n=>String(n.reason||'').trim()).length;
  const sourced=options.filter(n=>String(n.source||'').trim()).length;
  const values=[q.checks?.primaryText?.score,q.checks?.primaryText?.ocrScore].filter(Number.isFinite);
  const score=values.length?Math.min(...values):null;
  const special=q.correct?.length===5?'전원정답 인정':q.correct?.length>1?'복수정답 인정':'일반';
  const visual=q.checks?.visualReview===true?'시각검토 표시':
   q.checks?.visualReview===false?'미검토 표시':'검토 표시 없음';
  const diagrams=Array.isArray(q.diagrams)&&q.diagrams.length>0;
  const low=score!==null&&score<.9;
  const priority=(visual!=='시각검토 표시'?5:0)+(low?10:0)+(score===null?2:0)+
   (special!=='일반'?8:0)+(diagrams?4:0)+(sourced<5?3:0);
  rows.push({id,year,number,subject:q.subject,assessed,reasoned,sourced,
   linked:Array.isArray(saved.conceptIds)?saved.conceptIds.length:0,
   visual,score,low,special,diagrams,priority,
   accepted:Array.isArray(q.correct)?q.correct.join('/'):'' ,
   paperUrl:typeof q.paperUrl==='string'&&/^https:\/\/[a-z0-9.-]+\//i.test(q.paperUrl)?q.paperUrl:''});
 }
 return rows.sort((a,b)=>b.year-a.year||a.number-b.number);
}
function reviewMatrix(rows=reviewRows()){
 return Array.from({length:10},(_,i)=>2025-i).map(year=>{
  const r=rows.filter(x=>x.year===year);
  return {year,count:r.length,visual:r.filter(x=>x.visual==='시각검토 표시').length,
   assessed:r.reduce((n,x)=>n+x.assessed,0),sourced:r.reduce((n,x)=>n+x.sourced,0),
   low:r.filter(x=>x.low).length,special:r.filter(x=>x.special!=='일반').length};
 });
}
function csvCell(value){
 const text=String(value??'').replace(/[\r\n\t]+/g,' ').trim();
 return '"'+(/^[=+\-@]/.test(text)?"'"+text:text).replace(/"/g,'""')+'"';
}
function makeReviewCsv(rows=reviewRows()){
 const head=['문항ID','연도','문항번호','과목','채점 인정','인정정답','시각검토 메타',
  'OCR/원문 유사도','그림/표','내 선지판단 수(5)','내 이유 수(5)','내 출처 수(5)',
  '내 연결개념 수','대조 우선점','원문 PDF'];
 return [head.map(csvCell).join(','),...rows.map(r=>[r.id,r.year,r.number,
  r.subject==='estate'?'학개론':'민법',r.special,r.accepted,r.visual,
  r.score===null?'미기재':r.score.toFixed(3),r.diagrams?'있음':'없음',
  r.assessed,r.reasoned,r.sourced,r.linked,r.priority,r.paperUrl
 ].map(csvCell).join(','))].join('\r\n')+'\r\n';
}
let auditExporting=false,notice='';
async function exportReviewCsv(){
 if(auditExporting)return false;
 auditExporting=true;notice='전체 등록 상태를 확인 중입니다.';
 const feedback=()=>{const el=root?.querySelector('[data-v105-status]');if(el)el.textContent=notice;};
 feedback();
 try{
  if(window.CK89OfficialBank?.loadAll)await window.CK89OfficialBank.loadAll();
  const quality=bankQuality(),rows=reviewRows();
  if(quality.total!==800||quality.structured!==800||rows.length!==800){
   notice='800문항 전부 구조 등록되지 않아 부분 CSV를 내보내지 않았습니다.';
   feedback();return false;
  }
  const blob=new Blob(['\uFEFF',makeReviewCsv(rows)],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='ConceptKnot_10개년_원문검토_개인진행.csv';
  document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),2500);
  notice='800문항 CSV 저장 완료 · 개인 작업표이며 법령/해설 공식 검수 완료 표시가 아닙니다.';
  feedback();return true;
 }catch(e){notice='내보내기 실패: '+(e?.message||'확인 필요');feedback();return false;}
 finally{auditExporting=false;}
}

function bankQuality(records=window.RECALL_OFFICIAL||{}){
 const result={total:0,structured:0,visualReviewed:0,visualUnreviewed:0,visualUnknown:0,
  multikey:0,allAccepted:0,lowTextSimilarity:0,missingTextSimilarity:0,years:{}};
 for(const [id,q] of Object.entries(records||{})){
  if(!/^20(?:1[6-9]|2[0-5])-(?:[1-9]|[1-7]\d|80)$/.test(id)||!q||typeof q!=='object')continue;
  const [year,number]=id.split('-').map(Number);
  result.total++;result.years[year]=(result.years[year]||0)+1;
  if(q.verified===true&&q.year===year&&q.number===number&&
   q.subject===(number<=40?'estate':'civil')&&
   typeof q.question==='string'&&q.question.trim()&&
   Array.isArray(q.options)&&q.options.length===5&&q.options.every(x=>typeof x==='string'&&x.trim())&&
   Array.isArray(q.correct)&&q.correct.length&&q.correct.every(x=>Number.isInteger(Number(x))&&Number(x)>=1&&Number(x)<=5))
   result.structured++;
  const similarities=[q.checks?.primaryText?.score,q.checks?.primaryText?.ocrScore].filter(Number.isFinite);
  if(!similarities.length)result.missingTextSimilarity++;
  else if(Math.min(...similarities)<0.9)result.lowTextSimilarity++;
  if(q.checks?.visualReview===true)result.visualReviewed++;
  else if(q.checks?.visualReview===false)result.visualUnreviewed++;
  else result.visualUnknown++;
  if(Array.isArray(q.correct)&&q.correct.length>1)result.multikey++;
  if(Array.isArray(q.correct)&&q.correct.length===5)result.allAccepted++;
 }
 return result;
}
function visualQueue({year=2025,limit=12,records=window.RECALL_OFFICIAL||{},mode='all'}={}){
 const y=Number(year),count=Math.max(1,Math.min(80,Number(limit)||12));
 if(!Number.isInteger(y)||y<2016||y>2025)return [];
 const similarity=q=>{
  const values=[q.checks?.primaryText?.score,q.checks?.primaryText?.ocrScore].filter(Number.isFinite);
  return values.length?Math.min(...values):null;
 };
 const eligible=q=>{
  if(q?.verified!==true||q.year!==y||!Number.isInteger(q.number)||q.number<1||q.number>80)return false;
  const low=(similarity(q)!==null&&similarity(q)<0.9);
  if(mode==='low-text')return low;
  if(mode==='unreviewed')return q.checks?.visualReview!==true;
  return q.checks?.visualReview!==true||low;
 };
 const priority=q=>{
  const value=similarity(q);
  return (value!==null&&value<0.9?10:0)+
   (q.checks?.visualReview===undefined?5:0)+
   (q.checks?.visualReview===false?3:0)+
   (q.correct?.length>1?8:0)+
   (Array.isArray(q.diagrams)&&q.diagrams.length?4:0);
 };
 return Object.values(records).filter(eligible)
  .sort((a,b)=>priority(b)-priority(a)||a.number-b.number)
  .slice(0,count).map(q=>{
   const textScore=similarity(q);
   return {id:q.id,year:q.year,number:q.number,subject:q.subject,
    hasDiagrams:Array.isArray(q.diagrams)&&q.diagrams.length>0,
    missingReviewFlag:q.checks?.visualReview===undefined,
    visualReviewed:q.checks?.visualReview===true,
    lowTextSimilarity:textScore!==null&&textScore<0.9,textScore,
    multipleAccepted:Array.isArray(q.correct)&&q.correct.length>1,
    question:String(q.question||'').replace(/\s+/g,' ').slice(0,110),
    paperUrl:typeof q.paperUrl==='string'&&/^https:\/\/[A-Za-z0-9.-]+\//.test(q.paperUrl)?q.paperUrl:''
   };
  });
}
let queueYear=2025,queueMode='all',queueLoadingYear=null,queueLoadPromise=null,queueLoadError='';
function loadOlderYear(year){
 const y=Number(year);
 if(!Number.isInteger(y)||y<2016||y>2020||
  window.RECALL_OFFICIAL?.[y+'-1']?.verified===true)return Promise.resolve(true);
 if(!window.CK89OfficialBank?.loadYear)return Promise.resolve(false);
 if(queueLoadingYear!==null)return queueLoadingYear===y?(queueLoadPromise||Promise.resolve(false)):
  (queueLoadPromise||Promise.resolve(false)).then(()=>loadOlderYear(y));
 queueLoadingYear=y;queueLoadError='';render();
 queueLoadPromise=Promise.resolve().then(()=>window.CK89OfficialBank.loadYear(y))
 .then(()=>{queueLoadError='';return true;})
 .catch(err=>{queueLoadError='과거 공식 기출 자료를 불러오지 못했습니다: '+(err?.message||err);return false;})
 .finally(()=>{queueLoadingYear=null;queueLoadPromise=null;render();});
 return queueLoadPromise;
}


function exportVisualQueue(year=queueYear){
 const list=visualQueue({year,limit:80,mode:queueMode});
 const lines=['ConceptKnot '+year+'년 공식 기출 원문 시각 검토 후보',
  '자동 추출 목록 · 공식 원문/법령 검토 완료 증빙이 아닙니다.',
  '검토 대기 문항 '+list.length+'건',''];
 for(const row of list)lines.push(row.id+' · '+(row.subject==='estate'?'학개론':'민법')+
  (row.hasDiagrams?' · 그림·도표 확인 필요':'')+
  (row.multipleAccepted?' · 복수/전원정답 인정':'')+
  (row.visualReviewed?' · 시각 검토 표시 있음':row.missingReviewFlag?' · 검토 표시 없음':' · 미검토 표시')+
  (row.lowTextSimilarity?' · 유사도 '+row.textScore.toFixed(3)+' (원본 재대조 후보)':'')+
  '\n'+row.question+'\n'+(row.paperUrl||'공식 PDF 링크 없음')+'\n');
 try{const file=new Blob(['\uFEFF',lines.join('\n')],{type:'text/plain;charset=utf-8'});
  const url=URL.createObjectURL(file),a=document.createElement('a');
  a.href=url;a.download='ConceptKnot_원문검수후보_'+year+'.txt';
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2500);return true;
 }catch{return false;}
}
function downloadRaw(){
 // A recovery backup must NEVER silently substitute null for inaccessible existing records.
 // Read twice to detect a cross-tab modification during the capture window.
 let data;
 try{
  data={schemaVersion:1,kind:'raw-recovery-only-not-direct-import',
   capturedAt:new Date().toISOString(),captureConsistency:'double-read',records:{}};
  for(const [key] of items)data.records[key]=localStorage.getItem(key);
  for(const [key] of items){
   if(data.records[key]!==localStorage.getItem(key))
    throw Error('다른 탭에서 '+key+' 기록이 변경됐습니다. 다시 백업하세요.');
  }
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='ConceptKnot_원본복구용_'+new Date().toISOString().slice(0,10)+'.json';
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
  const notice=root?.querySelector('[data-v122-raw-status]');
  if(notice)notice.textContent='12종 원본을 두 번 대조해 백업을 요청했습니다. 다운로드 목록에서 파일을 확인하세요.';
  return true;
 }catch(error){
  const notice=root?.querySelector('[data-v122-raw-status]');
  if(notice)notice.textContent='원본 백업 중단 · '+String(error?.message||error).slice(0,200)+
   ' · 누락된 기록을 빈 값으로 저장하지 않았습니다.';
  return false;
 }
}
/* v127: explicitly triggered, read-only inventory of the CURRENT SW cache.
 * A matching cache is a minimum offline prerequisite, not proof of full app operation. */
const OFFLINE_CACHE='conceptknot-study-v131-mixed-review-queue';
const OFFLINE_MINIMUM=Object.freeze([
 './index.html',
 './assets/ck-data-diagnostics-v88.js?v=130',
 './assets/ck-data-diagnostics-v88.css?v=125',
 './assets/ck-manual-qa-v115.js?v=130',
 './assets/ck-study-links-v83.js?v=115',
 './assets/ck-study-editor-v80.js?v=127',
 './assets/ck-data-integrity-v86.js?v=120',
 './assets/ck-official-bank-v89.js?v=89',
 './assets/ck-full-exam-v82.js?v=115',
 './data/official-2016-2020.json',
 './data/official-2021-2025.json'
]);
const MIXED_OFFLINE=Object.freeze(['./assets/ck-mixed-mock-v129.js?v=130','./assets/ck-mixed-mock-v129.css?v=130']);
const REVIEW_OFFLINE=Object.freeze(['./assets/ck-mixed-review-v131.js?v=131','./assets/ck-mixed-review-v131.css?v=131']);
async function offlineHealth(cacheStorage,controlled=false){
 if(!cacheStorage?.keys||!cacheStorage?.open)
  return {supported:false,installed:false,controlled:Boolean(controlled),cached:0,
   required:OFFLINE_MINIMUM.length,missing:OFFLINE_MINIMUM.slice(),ready:false,mixedCached:0,mixedRequired:MIXED_OFFLINE.length,mixedReady:false,reviewCached:0,reviewRequired:REVIEW_OFFLINE.length,reviewReady:false};
 const keys=await cacheStorage.keys();
 if(!keys.includes(OFFLINE_CACHE))
  return {supported:true,installed:false,controlled:Boolean(controlled),cached:0,
   required:OFFLINE_MINIMUM.length,missing:OFFLINE_MINIMUM.slice(),ready:false,mixedCached:0,mixedRequired:MIXED_OFFLINE.length,mixedReady:false,reviewCached:0,reviewRequired:REVIEW_OFFLINE.length,reviewReady:false};
 // Opening only after keys confirms its existence avoids creating a misleading empty cache.
 const current=await cacheStorage.open(OFFLINE_CACHE);
 const matches=await Promise.all(OFFLINE_MINIMUM.map(async path=>{
  const response=await current.match(path);
  if(!response?.ok)return false;
  // HTTP 200 is not enough: an HTML error response must not count as JS/CSS/JSON.
  const type=String(response.headers?.get?.('content-type')||'').toLowerCase();
  if(path.endsWith('.html'))return !type||type.includes('text/html');
  return !type.includes('text/html');
 }));
 const missing=OFFLINE_MINIMUM.filter((_,i)=>!matches[i]);
 const mixedMatches=await Promise.all(MIXED_OFFLINE.map(async path=>{
  const response=await current.match(path);
  if(!response?.ok)return false;
  return !/text\/html/i.test(String(response.headers?.get?.('content-type')||''));
 }));
 const mixedCached=mixedMatches.filter(Boolean).length;
 const reviewChecks=await Promise.all(REVIEW_OFFLINE.map(async path=>{
  const response=await current.match(path);
  if(!response?.ok)return false;
  return !/text\/html/i.test(String(response.headers?.get?.('content-type')||''));
 }));
 const reviewCached=reviewChecks.filter(Boolean).length;
 return {supported:true,installed:true,controlled:Boolean(controlled),
  cached:OFFLINE_MINIMUM.length-missing.length,required:OFFLINE_MINIMUM.length,
  missing,ready:missing.length===0&&Boolean(controlled),mixedCached,
  mixedRequired:MIXED_OFFLINE.length,mixedReady:mixedCached===MIXED_OFFLINE.length&&Boolean(controlled),
  reviewCached,reviewRequired:REVIEW_OFFLINE.length,reviewReady:reviewCached===REVIEW_OFFLINE.length&&Boolean(controlled)};
}
/* Ask the currently controlling SW which generation it actually runs.
 * No caches are modified, no page navigation, and no network requests.
 * Older workers without the handshake remain 'unknown', never verified. */
async function controllerCacheInfo(){
 const controller=window.navigator?.serviceWorker?.controller;
 if(!controller)return {controlled:false,cache:''};
 if(typeof window.MessageChannel!=='function')return {controlled:true,cache:''};
 return new Promise(resolve=>{
  const channel=new window.MessageChannel();
  let finished=false;
  const finish=cache=>{
   if(finished)return;finished=true;
   clearTimeout(timeout);
   try{channel.port1.close();channel.port2.close()}catch{}
   resolve({controlled:true,cache});
  };
  const timeout=setTimeout(()=>finish(''),1200);
  channel.port1.onmessage=event=>{
   const payload=event.data;
   finish(payload?.app==='ConceptKnot'&&typeof payload.cache==='string'?payload.cache:'');
  };
  try{controller.postMessage({type:'CK_SW_VERSION_PING'},[channel.port2])}
  catch{finish('')}
 });
}
async function runOfflineHealth(){
 const host=root?.querySelector('[data-v125-offline]'),button=host?.querySelector('[data-v125-offline-run]'),
  message=host?.querySelector('[data-v125-offline-status]');
 if(!button||!message)return false;
 button.disabled=true;message.textContent='이 기기의 현재 오프라인 캐시 상태를 읽고 있습니다. 네트워크로 전송하지 않습니다.';
 try{
  const controller=await controllerCacheInfo();
  const activeCurrent=controller.cache===OFFLINE_CACHE;
  const result=await offlineHealth(window.caches,activeCurrent);
  message.textContent=!result.supported?'브라우저에서 캐시 읽기를 지원하지 않습니다.':
   !result.installed?'v131 오프라인 캐시 없음 · 아직 미배포 또는 설치 미완료입니다.':
   '현재 캐시의 필수 파일 '+result.cached+'/'+result.required+'개 · '+
   (activeCurrent?'현재 v131 서비스워커가 이 탭을 제어함':controller.controlled?
    '구형 또는 응답 없는 서비스워커가 제어 중 · 현재 세대 확인 불가':'서비스워커가 이 탭을 제어하지 않음')+
   (result.missing.length?' · 미저장: '+result.missing.slice(0,3).map(x=>x.split('/').pop()).join(', ')+
    (result.missing.length>3?' 외 '+(result.missing.length-3)+'개':''):
    ' · 최소 파일 목록 충족. '+(activeCurrent?'현재 SW 세대도 일치. ':'SW 세대 미확인. ')+
    '혼합 5세트 자산 '+result.mixedCached+'/'+result.mixedRequired+'개 · '+
    (result.mixedReady?'혼합 세트 JS/CSS 확보(문항 데이터·기기 동작은 별도 확인)':'혼합 세트 오프라인 준비 미확인')+
    ' · 약점 복습 JS/CSS '+result.reviewCached+'/'+result.reviewRequired+'개 · '+
    (result.reviewReady?'복습 자산 준비':'복습 자산 준비 미확인')+
    ' · 실제 기기 동작은 별도 검사');
  return result.ready;
 }catch(error){
  message.textContent='캐시 상태를 읽을 수 없습니다: '+String(error?.message||error).slice(0,160)+
   ' · 기존 브라우저 데이터를 삭제하지 마세요.';
  return false;
 }finally{button.disabled=false;}
}

let root=null;
function render(){
 if(!root)return;
 const wasOpen=root.querySelector('.ck88-review-queue')?.open===true;
 const matrixOpen=root.querySelector('.ck88-audit-matrix')?.open===true;
 const values=inspect(),problem=values.filter(x=>x.status==='invalid'),quality=bankQuality(),queue=visualQueue({year:queueYear,mode:queueMode});
 root.querySelector('[data-v88-body]').innerHTML='<p>읽기 전용 검사 · 데이터를 초기화하거나 수정하지 않습니다. 손상 기록은 복원 전 원본을 보존하세요.</p>'+
 '<p><strong>공식 기출 등록 구조: '+quality.structured+'/'+quality.total+'문항</strong> · 10개년 목표 800문항 · 시각 검토 명시 '+quality.visualReviewed+'건 / 미검토 표시 '+quality.visualUnreviewed+'건 / 표시 없음 '+quality.visualUnknown+'건</p>'+
 '<p>특수 정답 '+quality.multikey+'건(복수정답 '+(quality.multikey-quality.allAccepted)+'건, 전원정답 '+quality.allAccepted+'건) · OCR/텍스트 유사도 0.90 미만 '+quality.lowTextSimilarity+'건 · 점수 미기재 '+quality.missingTextSimilarity+'건. 낮은 유사도는 자동 오류 판정이 아닌 원문 대조 우선순위입니다.</p>'+
 '<p>구조 등록·채점 인정은 선지별 법령/원문 전문가 검수 완료와 다릅니다. '+
 '2026-11-01 저장소 해설 보고서에서는 최근 5개년 400문항 중 개인/초기 해설 초안 32건, 출처 검수 완료 0건으로 기록되어 있습니다. 이 수치는 실시간 검수 진행률이 아닙니다.</p>'+
 '<details class="ck88-review-queue"><summary>원문 시각 검토 후보 · 연도별 우선 12문항 (읽기 전용)</summary>'+
 '<label>시험연도 <select data-v88-year>'+Array.from({length:10},(_,i)=>2025-i).map(year=>
 '<option value="'+year+'"'+(queueYear===year?' selected':'')+'>'+year+'년</option>').join('')+'</select></label>'+
 '<label>우선순위 <select data-v88-queue-mode>'+
 ['all','unreviewed','low-text'].map((x,i)=>'<option value="'+x+'"'+(queueMode===x?' selected':'')+'>'+
 ['시각 미검토 + 낮은 유사도','시각 미검토','텍스트 유사도 0.90 미만'][i]+'</option>').join('')+
 '</select></label>'+
 '<p>공식 PDF의 표·수식·그림 및 당시 법령을 대조하세요. 검수 완료 표시가 있더라도 유사도가 낮으면 재검토 후보가 될 수 있습니다. 유사도는 오류 확정이 아닙니다.</p>'+
 '<button type="button" data-v88-review-export>해당 연도 검토 후보 TXT</button>'+
 '<div class="ck88-review-list">'+(queue.length?queue.map(q=>
 '<div><strong>'+safe(q.id)+' · '+(q.subject==='estate'?'학개론':'민법')+'</strong>'+
 '<span>'+safe(q.question)+'</span>'+
 '<small>'+(q.hasDiagrams?'그림 포함 · ':'')+(q.visualReviewed?'시각 검토 표시 있음':q.missingReviewFlag?'시각 검수 표시 없음':'시각 미검토 표시')+
 (q.lowTextSimilarity?' · 텍스트 유사도 '+q.textScore.toFixed(3):'')+
 (q.multipleAccepted?' · 복수/전원정답':'')+'</small>'+
 '<button type="button" data-v88-open="'+safe(q.id)+'">해당 공식 문항 열기</button>'+
 (q.paperUrl?'<a href="'+safe(q.paperUrl)+'" target="_blank" rel="noopener noreferrer">시험 원문 PDF</a>':'')+
 '</div>').join(''):'<p role="status">'+safe(queueLoadError|| (queueLoadingYear===queueYear?'과거 기출을 불러오는 중입니다.':'선택한 조건에 해당하는 문항이 없거나 공식 은행 로딩 전입니다.'))+'</p>')+'</div></details>'+
 '<div class="ck88-rows">'+values.map(x=>'<div><strong>'+safe(x.name)+'</strong><span>'+
 (x.status==='ok'?'정상 형식':x.status==='empty'?'저장 기록 없음':'손상 의심 · 덮어쓰기 금지')+
 ' · '+x.bytes+'자</span></div>').join('')+'</div>'+
 '<p role="status">'+(problem.length?'검사가 필요한 기록 '+problem.length+'종 · 원본을 먼저 저장하세요.':'구조 오류 감지 없음. 실제 기기 동작 검증은 별도입니다.')+'</p>';

 const table=reviewMatrix();
 const audit=document.createElement('details');audit.className='ck88-audit-matrix';
 audit.innerHTML='<summary>10개년 원문·선지 근거 검토 준비도 · 개인 작업표</summary>'+
  '<p>시각검토 표시는 공식 파일의 메타데이터, 선지 판단과 출처는 개인 기록입니다. 내용의 법령 적합성이나 전문가 검수를 보증하지 않습니다.</p>'+
  '<button type="button" data-v105-export>10개년 800문항 검토용 CSV</button>'+
  '<p data-v105-status role="status">'+safe(notice)+'</p>'+
  '<div class="ck88-audit-years">'+table.map(x=>'<div><strong>'+x.year+'년 · '+x.count+'/80</strong>'+
  '<span>시각검토 표시 '+x.visual+'/80 · 낮은 텍스트 유사도 '+x.low+'건</span>'+
  '<span>내 선지판단 '+x.assessed+'/400 · 출처 '+x.sourced+'/400 · 특수정답 '+x.special+'건</span>'+
  '<button type="button" data-v105-year="'+x.year+'">해당 연도 원문 검토 후보</button></div>').join('')+
  '</div>';
 root.querySelector('[data-v88-body]').append(audit);
 if(matrixOpen)audit.open=true;

 if(wasOpen)root.querySelector('.ck88-review-queue').open=true;
}

/* v121: explicit click only, static evidence structure inspection. No writes to official question files. */
const AUDIT_FILES=[
 './data/official-2016-2020.json','./data/official-2021-2025.json',
 './data/explanations/official-2021.json','./data/explanations/official-2022.json',
 './data/explanations/official-2023.json','./data/explanations/official-2024.json',
 './data/explanations/official-2025.json'
];
let auditBusy=false,auditResult=null,auditError='';
function auditStatic(bundles,explanations){
 const errors=[],byYear={},questions=new Map(),ids=new Set();
 const add=message=>{if(errors.length<70)errors.push(message);};
 let issueCount=0;
 const issue=message=>{issueCount++;add(message)};
 for(let y=2016;y<=2025;y++)byYear[y]={year:y,total:0,estate:0,civil:0,specialAll:0,specialMulti:0};
 if(!Array.isArray(bundles)||bundles.length!==2||bundles.some(x=>!Array.isArray(x))){
  return {ok:false,issueCount:1,errors:['공식 문제 번들 구조를 읽지 못했습니다.']};
 }
 const rows=[...bundles[0],...bundles[1]];
 for(const q of rows){
  if(!q||typeof q!=='object'){issue('문항 항목이 객체가 아닙니다.');continue}
  const id=String(q.id||''),year=Number(q.year),number=Number(q.number);
  if(!Number.isInteger(year)||year<2016||year>2025||!Number.isInteger(number)||number<1||number>80){
   issue('연도·문항번호 범위 오류: '+id);continue;
  }
  const group=byYear[year];group.total++;
  if(q.subject==='estate')group.estate++;else if(q.subject==='civil')group.civil++;
  if(q.id!==year+'-'+number||ids.has(id))issue('문항 ID 불일치·중복: '+id);
  ids.add(id);questions.set(id,q);
  if(q.subject!==(number<=40?'estate':'civil'))issue('과목 구분 불일치: '+id);
  if(q.verified!==true||typeof q.question!=='string'||q.question.trim().length<5||
   !Array.isArray(q.options)||q.options.length!==5||
   q.options.some(v=>typeof v!=='string'||!v.trim()))issue('문항/5선지 구조 오류: '+id);
  if(!Array.isArray(q.correct)||q.correct.length===0||q.correct.length>5||
   new Set(q.correct).size!==q.correct.length||
   q.correct.some(v=>!Number.isInteger(v)||v<1||v>5))issue('정답 배열 오류: '+id);
  if(typeof q.originalUrl!=='string'||!q.originalUrl.startsWith('https://'))
   issue('출처 링크 누락: '+id);
  if(q.correct?.length===5)group.specialAll++;
  else if(q.correct?.length>=2&&q.correct?.length<=4)group.specialMulti++;
 }
 for(let y=2016;y<=2025;y++){
  const x=byYear[y];
  if(x.total!==80||x.estate!==40||x.civil!==40)
   issue(y+'년 80문항/학개론40/민법40 구성 불일치: '+JSON.stringify(x));
 }
 let explanationCount=0,draft=0,unstarted=0,published=0,sourceChecked=0,reasonReviewed=0,
  fullOptionVerdicts=0,reasonDrafts=0;
 if(!Array.isArray(explanations)||explanations.length!==5)
  issue('최근 5개년 해설 번들 수가 5개가 아닙니다.');
 else for(let i=0;i<5;i++){
  const year=2021+i,bundle=explanations[i],seen=new Set();
  if(!bundle||bundle.year!==year||bundle.originalAnswersProtected!==true||
   !Array.isArray(bundle.records)||bundle.records.length!==80){
   issue(year+'년 해설 번들 형식·80건 구성 오류');continue;
  }
  for(const row of bundle.records){
   explanationCount++;
   if(!row||typeof row!=='object'){issue(year+'년 빈 해설 항목');continue}
   const id=row.questionId,q=questions.get(id);
   if(typeof id!=='string'||seen.has(id)||!q||q.year!==year||row.examYear!==year||
    row.number!==q.number||row.subject!==q.subject||
    JSON.stringify(row.officialAnswer)!==JSON.stringify(q.correct)){
    issue('해설-원문 연결 오류: '+String(id));continue;
   }
   seen.add(id);
   if(!Array.isArray(row.options)||row.options.length!==5||
    row.options.some((opt,n)=>opt?.no!==n+1))issue('해설의 5개 선지 번호 오류: '+id);
   const quality=row.quality||{};
   if(quality.status==='draft')draft++;
   else if(quality.status==='unstarted')unstarted++;
   else if(quality.status==='published')published++;
   else issue('해설 검토 단계 값 오류: '+id);
   if(quality.sourceChecked===true)sourceChecked++;
   if(quality.reasonReviewed===true)reasonReviewed++;
   if(quality.optionVerdictsReviewed===5)fullOptionVerdicts++;
   if(typeof row.answerReason==='string'&&row.answerReason.trim())reasonDrafts++;
   if(quality.status==='published'&&
    !(quality.reasonReviewed===true&&quality.sourceChecked===true&&
      quality.optionVerdictsReviewed===5&&row.options.every(opt=>opt.sourceChecked===true&&
       ['true','false','conditional'].includes(opt.verdict))))
     issue('출처·근거·선지 검수 없이 published로 표시됨: '+id);
  }
 }
 if(rows.length!==800||ids.size!==800)issue('등록 문항 800개/고유 ID가 일치하지 않습니다.');
 if(explanationCount!==400)issue('2021~2025 해설이 총 400개가 아닙니다.');
 const totals=Object.values(byYear).reduce((acc,x)=>{
  acc.allAccepted+=x.specialAll;acc.multiple+=x.specialMulti;return acc;
 },{allAccepted:0,multiple:0});
 return {ok:issueCount===0,issueCount,errors,officialCount:rows.length,uniqueIds:ids.size,
  explanationCount,draft,unstarted,published,sourceChecked,reasonReviewed,
  fullOptionVerdicts,reasonDrafts,totals,years:Object.values(byYear)};
}
function auditText(report){
 if(!report)return '검사 결과 없음';
 const lines=['ConceptKnot 원문/해설 구조 감사',
  '브라우저에서 JSON 구조만 검사. 법령·판례·출처 진위 전문가 검증 완료 아님.',
  '검사일: '+new Date().toISOString(),'구조 오류: '+report.issueCount,
  '공식 원문 등록: '+report.officialCount+' (고유 ID '+report.uniqueIds+')',
  '최근 해설: '+report.explanationCount+' · 초안 '+report.draft+
   ' · 미작성 '+report.unstarted+' · 검토공개 '+report.published,
  '해설 출처 검수: '+report.sourceChecked+' · 이유 검토: '+report.reasonReviewed+
   ' · 5선지 검토: '+report.fullOptionVerdicts,
  '전원정답 인정: '+report.totals.allAccepted+' · 2~4개 복수정답 인정: '+report.totals.multiple,''];
 for(const row of report.years)lines.push(
  row.year+' | '+row.total+'/80 | 학개론 '+row.estate+'/40 | 민법 '+row.civil+
  '/40 | 전원정답 '+row.specialAll+' | 복수정답 '+row.specialMulti);
 if(report.errors.length)lines.push('','검사 오류 (최대 70건 표시)',...report.errors);
 return lines.join('\n');
}
function renderAudit(){
 const area=root?.querySelector('[data-v121-audit]');
 if(!area)return;
 const status=area.querySelector('[data-v121-status]'),output=area.querySelector('[data-v121-result]');
 const trigger=area.querySelector('[data-v121-run]'),save=area.querySelector('[data-v121-export]');
 if(trigger)trigger.disabled=auditBusy;
 if(save)save.disabled=!auditResult;
 if(status)status.textContent=auditBusy?'7개 등록·해설 JSON 파일을 읽고 있습니다.':
  auditError||(!auditResult?'사용자가 검사 버튼을 눌렀을 때만 실행합니다.':
  '구조 불일치 '+auditResult.issueCount+'건 · 이것은 원문 법령·해설 내용 검수가 아닙니다.');
 if(!output)return;
 output.replaceChildren();
 if(!auditResult)return;
 const summary=document.createElement('p');
 summary.textContent='등록 문항 '+auditResult.officialCount+'/800 (고유 ID '+
  auditResult.uniqueIds+') · 해설 '+auditResult.explanationCount+'/400 · 초안 '+
  auditResult.draft+' · 미작성 '+auditResult.unstarted+' · 전문가 검수 완료 상태 '+
  auditResult.published;
 output.append(summary);
 const explain=document.createElement('p');
 explain.textContent='해설 출처 검수 '+auditResult.sourceChecked+'/400 · 이유 검토 '+
  auditResult.reasonReviewed+'/400 · 전체 5선지 검토 '+auditResult.fullOptionVerdicts+
  '/400 · 전원정답 인정 '+auditResult.totals.allAccepted+
  '건 · 복수정답 인정 '+auditResult.totals.multiple+'건';
 output.append(explain);
 const table=document.createElement('div');table.className='ck121-audit-table';
 for(const item of auditResult.years){
  const row=document.createElement('p');row.textContent=item.year+'년 '+item.total+
   '/80 · 학개론 '+item.estate+'/40 · 민법 '+item.civil+'/40';
  table.appendChild(row);
 }
 output.append(table);
 if(auditResult.issueCount){
  const warn=document.createElement('p');
  warn.textContent='구조 오류 '+auditResult.issueCount+'건: '+auditResult.errors.slice(0,3).join(' / ');
  warn.setAttribute('role','alert');output.append(warn);
 }
}
async function runAudit(){
 if(auditBusy)return false;
 auditBusy=true;auditError='';auditResult=null;renderAudit();
 try{
  const loaded=await Promise.all(AUDIT_FILES.map(async path=>{
   const response=await fetch(path,{cache:'no-store'});
   if(!response.ok)throw Error(path+' HTTP '+response.status);
   const declared=Number(response.headers?.get?.('content-length')||0);
   if(declared>2500000)throw Error(path+' 파일이 검사 용량 제한을 초과했습니다');
   const text=await response.text();
   if(text.length>2500000)throw Error(path+' 파일이 검사 용량 제한을 초과했습니다');
   return JSON.parse(text);
  }));
  auditResult=auditStatic(loaded.slice(0,2),loaded.slice(2));
  return auditResult.ok;
 }catch(error){
  auditError='원본 검사 실패: '+String(error?.message||error).slice(0,240);
  return false;
 }finally{
  auditBusy=false;renderAudit();
 }
}
function saveAudit(){
 if(!auditResult)return false;
 try{
  const blob=new Blob(['\uFEFF'+auditText(auditResult)],{type:'text/plain;charset=utf-8'});
  const url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download='ConceptKnot_공식문항_구조감사_'+new Date().toISOString().slice(0,10)+'.txt';
  document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),2000);
  return true;
 }catch{auditError='결과 TXT를 저장할 수 없습니다.';renderAudit();return false}
}

/* v122: explicitly requested, read-only cross review of TWO INDEPENDENT personal
 * evidence stores. A recorded source or an agreeing verdict is never official proof.
 * No personal entry is copied between CK83 and CK80 or written to canonical files. */
let crossReport=null,crossBusy=false,crossError='',crossFilter='missing',crossYear='all',crossPage=0;
let expandedEvidenceId='',packetCount=5;
const chosenEvidenceIds=new Set();
const CROSS_PAGE=16;
const textPresent=x=>typeof x==='string'&&Boolean(x.trim());
function crossEvidenceAudit(bank=window.RECALL_OFFICIAL||{},
 links=window.CK83Links?.getRecords?.()||{},
 drafts=window.CK80Editorial?.getRecords?.()||{}){
 const totals={questions:0,options:0,missingQuestion:0,ck83Assessed:0,ck83Reasons:0,
  ck83Sources:0,ck80Assessed:0,ck80Reasons:0,ck80Sources:0,
  neitherSource:0,verdictConflicts:0,sourceDifferences:0,personalReady:0,
  allAccepted:0,multipleAccepted:0};
 const years=Array.from({length:10},(_,i)=>2016+i).map(year=>({
  year,questions:0,ck83Sources:0,ck80Sources:0,neitherSource:0,verdictConflicts:0,personalReady:0
 }));
 const byYear=new Map(years.map(row=>[row.year,row])),rows=[];
 for(let year=2016;year<=2025;year++)for(let number=1;number<=80;number++){
  const id=year+'-'+number,q=bank[id],yearRow=byYear.get(year);
  if(!q||q.id!==id||q.year!==year||q.number!==number||q.verified!==true||
   q.subject!==(number<=40?'estate':'civil')||
   typeof q.question!=='string'||q.question.trim().length<5||
   !Array.isArray(q.options)||q.options.length!==5||
   q.options.some(option=>typeof option!=='string'||!option.trim())||
   !Array.isArray(q.correct)||q.correct.length<1||q.correct.length>5||
   new Set(q.correct.map(Number)).size!==q.correct.length||
   q.correct.some(n=>!Number.isInteger(Number(n))||Number(n)<1||Number(n)>5)){
   totals.missingQuestion++;continue;
  }
  totals.questions++;totals.options+=5;yearRow.questions++;
  const notes=links?.[id]?.optionNotes||{};
  const draft=Array.isArray(drafts?.[id]?.options)?drafts[id].options:[];
  const special=q.correct.length===5?'all':q.correct.length>1?'multi':'normal';
  if(special==='all')totals.allAccepted++;
  if(special==='multi')totals.multipleAccepted++;
  let aSource=0,bSource=0,missing=0,conflicts=0,different=0,complete=0;
  const missingIndices=[],conflictIndices=[],differentIndices=[];
  for(let k=1;k<=5;k++){
   const a=notes[String(k)]||{},b=draft[k-1]?.no===k?draft[k-1]:{};
   const av=String(a.assessment||''),bv=String(b.verdict||'');
   const aReason=textPresent(a.reason),bReason=textPresent(b.why);
   const as=textPresent(a.source),bs=textPresent(b.source);
   const aAssessed=['true','false','conditional'].includes(av);
   const bAssessed=['true','false','unknown'].includes(bv);
   if(aAssessed)totals.ck83Assessed++;
   if(bAssessed)totals.ck80Assessed++;
   if(aReason)totals.ck83Reasons++;
   if(bReason)totals.ck80Reasons++;
   if(as){aSource++;totals.ck83Sources++;yearRow.ck83Sources++;}
   if(bs){bSource++;totals.ck80Sources++;yearRow.ck80Sources++;}
   if(!as&&!bs){missing++;missingIndices.push(k);totals.neitherSource++;yearRow.neitherSource++;}
   if(['true','false'].includes(av)&&['true','false'].includes(bv)&&av!==bv){
    conflicts++;conflictIndices.push(k);totals.verdictConflicts++;yearRow.verdictConflicts++;
   }
   // Different citations are a reconciliation prompt, not necessarily an error.
   if(as&&bs&&String(a.source).normalize('NFKC').replace(/\s+/g,' ').trim()!==
     String(b.source).normalize('NFKC').replace(/\s+/g,' ').trim()){
    different++;differentIndices.push(k);totals.sourceDifferences++;
   }
   if((aAssessed&&aReason&&as)||(bAssessed&&bReason&&bs))complete++;
  }
  if(complete===5&&!conflicts){totals.personalReady++;yearRow.personalReady++;}
  rows.push({id,year,number,subject:q.subject,special,ck83Sources:aSource,
   ck80Sources:bSource,missing,conflicts,different,complete,missingIndices,conflictIndices,differentIndices,
   paperUrl:typeof q.originalUrl==='string'&&q.originalUrl.startsWith('https://')?q.originalUrl:''});
 }
 return {totals,years,rows,complete:totals.questions===800&&totals.options===4000};
}
function freezeCrossReport(report){
 for(const row of report.rows){
  Object.freeze(row.missingIndices);Object.freeze(row.conflictIndices);
  Object.freeze(row.differentIndices);Object.freeze(row);
 }
 report.years.forEach(Object.freeze);
 Object.freeze(report.totals);Object.freeze(report.years);Object.freeze(report.rows);
 return Object.freeze(report);
}

/* v124: two personal stores never overwrite each other and never become official proof. */
function optionEvidenceDetails(id, bank=window.RECALL_OFFICIAL||{},
 links=window.CK83Links?.getRecords?.()||{},drafts=window.CK80Editorial?.getRecords?.()||{}){
 if(!canonicalId(id))return null;
 const q=bank[id],year=Number(id.split('-')[0]),number=Number(id.split('-')[1]);
 if(!q||q.id!==id||q.year!==year||q.number!==number||q.verified!==true||
  q.subject!==(number<=40?'estate':'civil')||
  typeof q.question!=='string'||q.question.trim().length<5||
  !Array.isArray(q.options)||q.options.length!==5||
  q.options.some(option=>typeof option!=='string'||!option.trim())||
  !Array.isArray(q.correct)||!q.correct.length||q.correct.length>5||
  new Set(q.correct.map(Number)).size!==q.correct.length||
  q.correct.some(n=>!Number.isInteger(Number(n))||Number(n)<1||Number(n)>5))return null;
 const notes=links?.[id]?.optionNotes||{},draft=Array.isArray(drafts?.[id]?.options)?drafts[id].options:[];
 const accepted=q.correct.map(Number);
 return q.options.map((option,i)=>{
  const no=i+1,a=notes[String(no)]||{},b=draft[i]?.no===no?draft[i]:{};
  const verdict83=['true','false','conditional'].includes(a.assessment)?a.assessment:'unreviewed';
  const verdict80=['true','false','unknown'].includes(b.verdict)?b.verdict:'unreviewed';
  const source83=String(a.source||''),source80=String(b.source||'');
  return {no,option:String(option),accepted:accepted.includes(no),verdict83,verdict80,
   source83,source80,reason83:String(a.reason||''),reason80:String(b.why||''),
   missing:!source83.trim()&&!source80.trim(),
   conflict:['true','false'].includes(verdict83)&&['true','false'].includes(verdict80)&&verdict83!==verdict80,
   different:!!source83.trim()&&!!source80.trim()&&source83.normalize('NFKC').replace(/\s+/g,' ').trim()!==
    source80.normalize('NFKC').replace(/\s+/g,' ').trim()};
 });
}
function makeCrossPacket(ids,bank=window.RECALL_OFFICIAL||{},
 links=window.CK83Links?.getRecords?.()||{},drafts=window.CK80Editorial?.getRecords?.()||{}){
 if(!Array.isArray(ids)||!ids.length||ids.length>5||new Set(ids).size!==ids.length)return null;
 const clean=x=>String(x??'').replace(/[\u0000-\u001f\u007f]/g,' ').slice(0,6000);
 const lines=['ConceptKnot · 개인 선지 근거 검토 패킷',
  '이 패킷은 법령·판례·원문에 대한 공식 검수 완료 증빙이 아닙니다.',
  '공식 채점 인정 번호는 선택지의 참/거짓을 뜻하지 않습니다.',
  'CK83·CK80은 서로 독립된 개인 기록입니다.',''];
 for(const id of ids){
  const choices=optionEvidenceDetails(id,bank,links,drafts);if(!choices)return null;
  const q=bank[id],special=q.correct.length===5?'전원정답 인정':
   q.correct.length>1?'복수정답 인정':'일반';
  lines.push('================================================',
   id+' · '+(q.subject==='estate'?'부동산학개론':'민법 및 민사특별법')+' · '+special,
   '채점 인정: '+q.correct.join('/'),'문제: '+clean(q.question),
   '원문 PDF: '+clean(q.originalUrl||q.paperUrl||'미기재'),'');
  for(const choice of choices){
   lines.push('①②③④⑤'[choice.no-1]+' '+clean(choice.option),
    ' · 공식 채점: '+(choice.accepted?'인정':'미인정'),
    ' · CK83 개인 판단: '+choice.verdict83+' / 출처: '+clean(choice.source83||'미입력'),
    ' · CK83 이유: '+clean(choice.reason83||'미입력'),
    ' · CK80 개인 판단: '+choice.verdict80+' / 출처: '+clean(choice.source80||'미입력'),
    ' · CK80 이유: '+clean(choice.reason80||'미입력'),
    ' · 검토 후보: '+([choice.missing?'양쪽 출처 없음':null,
     choice.conflict?'두 개인 기록의 참/거짓 다름':null,
     choice.different?'출처 문구 차이':null].filter(Boolean).join(' · ')||'원문 확인 후 기록'),'');
  }
  lines.push('원문 PDF 쪽수 및 시험 당시 시행일 직접 검토: __________________','');
 }
 return lines.join('\n')+'\n';
}
function appendEvidenceDetail(card,id,bank,links,drafts){
 const entries=optionEvidenceDetails(id,bank,links,drafts);if(!entries)return;
 const outer=document.createElement('div');outer.className='ck124-option-details';
 const notice=document.createElement('p');notice.textContent='①~⑤ 개인 기록 상세 비교 · 공식 검수 완료 아님';
 outer.append(notice);
 const label={true:'참(개인)',false:'거짓(개인)',conditional:'조건·시기 확인',unknown:'판정 보류',unreviewed:'미판단'};
 for(const e of entries){
  const sec=document.createElement('section');sec.className='ck124-option';
  if(e.conflict||e.different)sec.classList.add('ck124-option-attention');
  const heading=document.createElement('strong');
  heading.textContent='선지 '+e.no+(e.accepted?' · 채점 인정':' · 채점 미인정');
  const option=document.createElement('p');option.textContent=e.option;
  sec.append(heading,option);
  for(const info of ['CK83: '+label[e.verdict83]+' · 출처 '+(e.source83.trim()||'없음')+
    ' · 이유 '+(e.reason83.trim()||'없음'),
   'CK80: '+label[e.verdict80]+' · 출처 '+(e.source80.trim()||'없음')+
    ' · 이유 '+(e.reason80.trim()||'없음')]){
    const p=document.createElement('p');p.textContent=info;sec.append(p);
  }
  if(e.conflict||e.different||e.missing){
   const warning=document.createElement('small');
   warning.textContent=[e.missing?'양쪽 출처 미입력':null,
    e.conflict?'개인 진위판정 불일치':null,e.different?'개인 출처 문구 차이':null].filter(Boolean).join(' · ');
   sec.append(warning);
  }
  outer.append(sec);
 }
 card.append(outer);
}

function crossRows(report=crossReport){
 if(!report)return [];
 const chosen=report.rows.filter(r=>(crossYear==='all'||String(r.year)===crossYear)&&(
  crossFilter==='all'||crossFilter==='missing'&&r.missing>0||
  crossFilter==='conflict'&&r.conflicts>0||
  crossFilter==='citation'&&r.different>0||
  crossFilter==='special'&&r.special!=='normal'||
  crossFilter==='ready'&&r.complete===5&&!r.conflicts
 ));
 return chosen.sort((a,b)=>b.conflicts-a.conflicts||b.missing-a.missing||
  (b.special!=='normal')-(a.special!=='normal')||b.year-a.year||a.number-b.number);
}
function makeCrossCsv(report=crossReport){
 if(!report||!report.complete)return '';
 const header=['개인 기록 교차 점검 · 자동 공식 검증 아님','문항 ID','연도','번호',
  '과목','정답 인정 유형','CK83 출처(5)','CK80 출처(5)','두곳 모두 출처없음(5)',
  '판정 불일치(5)','출처 문구 차이(5)','개인 검토 입력 충족(5)',
  '미출처 선지 번호','판정 불일치 선지 번호','출처 상이 선지 번호','공식 PDF'];
 const data=[header.map(csvCell).join(',')];
 for(const row of report.rows)data.push([
  '개인 참고용 · 미검수',row.id,row.year,row.number,
  row.subject==='estate'?'학개론':'민법',
  row.special==='all'?'전원정답 인정':row.special==='multi'?'복수정답 인정':'일반',
  row.ck83Sources,row.ck80Sources,row.missing,row.conflicts,row.different,row.complete,
  row.missingIndices.join('/'),row.conflictIndices.join('/'),row.differentIndices.join('/'),row.paperUrl
 ].map(csvCell).join(','));
 return data.join('\r\n')+'\r\n';
}
function crossStatus(message){
 crossError=String(message||'').slice(0,260);renderCrossAudit();
}
function renderCrossAudit(){
 const host=root?.querySelector('[data-v122-cross]');
 if(!host)return;
 const status=host.querySelector('[data-v122-status]'),body=host.querySelector('[data-v122-result]');
 const run=host.querySelector('[data-v122-run]'),exportButton=host.querySelector('[data-v122-export]');
 if(run)run.disabled=crossBusy;
 if(exportButton)exportButton.disabled=!crossReport?.complete;
 if(status)status.textContent=crossBusy?'개인 저장소와 공식 800문항을 읽고 있습니다.':
  crossError||(!crossReport?'버튼을 눌러 저장된 개인 출처만 읽기 전용으로 비교합니다.':
  '구조 '+(crossReport.complete?'800/800':'부분 로딩')+' · 공식 정답과 선지 진위는 검증하지 않았습니다.');
 if(!body)return;
 body.replaceChildren();
 if(!crossReport)return;
 const t=crossReport.totals;
 const summary=document.createElement('p');
 summary.textContent='공식 등록 '+t.questions+'/800문항 · CK83 출처 '+t.ck83Sources+
  '/4000 · CK80 개인 초안 출처 '+t.ck80Sources+
  '/4000 · 양쪽 모두 출처 없음 '+t.neitherSource+'/4000선지';
 body.append(summary);
 const caution=document.createElement('p');
 caution.textContent='두 개인 기록의 참/거짓 판정 불일치 '+t.verdictConflicts+
  '선지 · 서로 다른 출처 문구 '+t.sourceDifferences+
  '선지(오류 확정 아님) · 검토 입력만 갖춘 개인 문항 '+t.personalReady+
  '/800(법령·판례 검증 및 게시 완료와 무관).';
 body.append(caution);
 const matrix=document.createElement('div');matrix.className='ck121-audit-table';
 for(const item of crossReport.years){
  const cell=document.createElement('p');
  cell.textContent=item.year+'년 '+item.questions+'/80 · 출처 CK83 '+item.ck83Sources+
   '/400, CK80 '+item.ck80Sources+'/400 · 둘 다 없음 '+item.neitherSource+
   ' · 판단 차이 '+item.verdictConflicts;
  matrix.append(cell);
 }
 body.append(matrix);
 const selector=document.createElement('div');selector.className='ck122-cross-filters';
 selector.innerHTML='<label>유형 <select data-v122-filter>'+
  [['missing','두 저장소 모두 출처 없음'],['conflict','서로 다른 진위판정'],
   ['citation','출처 문구 차이'],['special','복수·전원정답'],['ready','개인 입력 5/5'],['all','전체 문항']]
   .map(([v,label])=>'<option value="'+v+'"'+(crossFilter===v?' selected':'')+'>'+label+'</option>').join('')+
  '</select></label><label>연도 <select data-v122-year><option value="all">전체 10개년</option>'+
  Array.from({length:10},(_,i)=>2025-i).map(y=>
   '<option value="'+y+'"'+(crossYear===String(y)?' selected':'')+'>'+y+'년</option>').join('')+
  '</select></label>';
 body.append(selector);
 const tools=document.createElement('div');tools.className='ck124-packet-toolbar';
 tools.innerHTML='<label>TXT 문항 수 <select data-v124-count>'+
  [1,3,5].map(n=>'<option value="'+n+'"'+(packetCount===n?' selected':'')+'>'+n+'문항</option>').join('')+
  '</select></label><button type="button" data-v124-packet>개인 선지 근거 TXT</button>'+
  '<button type="button" data-v124-clear>선택 초기화</button>';
 const pickNote=document.createElement('span');
 pickNote.textContent='선택 '+chosenEvidenceIds.size+'/5 · 미선택 시 현재 필터의 상위 '+packetCount+'문항';
 tools.append(pickNote);body.append(tools);
 const list=crossRows(),last=Math.max(0,Math.ceil(list.length/CROSS_PAGE)-1);
 crossPage=Math.max(0,Math.min(crossPage,last));
 const counter=document.createElement('p');counter.textContent='현재 조건 '+list.length+
  '문항 · '+(crossPage+1)+'/'+(last+1)+'쪽';body.append(counter);
 const cards=document.createElement('div');cards.className='ck122-cross-list';
 for(const row of list.slice(crossPage*CROSS_PAGE,(crossPage+1)*CROSS_PAGE)){
  const card=document.createElement('div');
  card.innerHTML='<strong>'+safe(row.id)+' · '+(row.subject==='estate'?'학개론':'민법')+
   '</strong><small>CK83 출처 '+row.ck83Sources+'/5 · CK80 출처 '+row.ck80Sources+
   '/5 · 양쪽 모두 미출처 '+row.missing+' · 판단 차이 '+row.conflicts+
   ' · 미출처 선지 '+(row.missingIndices.join('/')||'-')+
   ' · 판단 충돌 선지 '+(row.conflictIndices.join('/')||'-')+
   (row.special==='all'?' · 전원정답 인정':row.special==='multi'?' · 복수정답 인정':'')+
   '</small><div class="ck124-card-actions"><label><input type="checkbox" data-v124-pick="'+safe(row.id)+'"'+
   (chosenEvidenceIds.has(row.id)?' checked':'')+'>TXT 선택</label>'+
   '<button type="button" data-v124-expand="'+safe(row.id)+'" aria-expanded="'+(expandedEvidenceId===row.id)+'">'+
   (expandedEvidenceId===row.id?'①~⑤ 비교 접기':'①~⑤ 상세 비교')+'</button>'+
   '<button type="button" data-v122-open="'+safe(row.id)+'">CK83 선지 메모</button>'+ 
   '<button type="button" data-v124-editor="'+safe(row.id)+'">CK80 해설 초안</button></div>';
  if(expandedEvidenceId===row.id)appendEvidenceDetail(card,row.id,window.RECALL_OFFICIAL,
   window.CK83Links?.getRecords?.()||{},window.CK80Editorial?.getRecords?.()||{});
  cards.append(card);
 }
 if(!list.length){const empty=document.createElement('p');
  empty.textContent='현재 필터에 해당하는 문항이 없습니다. 개인 출처의 진위를 검증했다는 의미가 아닙니다.';
  cards.append(empty);}
 body.append(cards);
 const pager=document.createElement('div');pager.className='ck122-cross-pages';
 pager.innerHTML='<button type="button" data-v122-page="prev"'+(crossPage===0?' disabled':'')+
  '>이전</button><span>'+(crossPage+1)+' / '+(last+1)+'</span>'+
  '<button type="button" data-v122-page="next"'+(crossPage>=last?' disabled':'')+'>다음</button>';
 body.append(pager);
}
async function runCrossAudit(){
 if(crossBusy)return false;
 crossBusy=true;crossReport=null;crossError='';renderCrossAudit();
 try{
  if(!window.CK89OfficialBank?.loadAll)throw Error('공식 10개년 자료 로더가 준비되지 않았습니다.');
  await window.CK89OfficialBank.loadAll();
  const links=window.CK83Links,editor=window.CK80Editorial;
  if(!links?.getRecords||!editor?.getRecords)
   throw Error('두 개인 근거 저장소가 준비되지 않았습니다.');
  const ls=links.getStatus?.()||{},es=editor.getStatus?.()||{};
  if(ls.storageIssue||ls.storageConflict||es.storageIssue)
   throw Error('개인 기록 저장소에 손상 또는 탭 충돌이 있어 점검을 중단했습니다. 먼저 원본을 백업하세요.');
  if(ls.unsavedEdits||editor.hasUnsavedChanges?.())
   throw Error('저장되지 않은 개인 기록이 있습니다. 먼저 저장하거나 복사하세요.');
  const report=crossEvidenceAudit(window.RECALL_OFFICIAL,links.getRecords(),editor.getRecords());
  if(!report.complete)throw Error('공식 문제 '+report.totals.questions+'/800문항: 부분 자료로 교차보고서를 만들지 않았습니다.');
  crossReport=freezeCrossReport(report);crossPage=0;expandedEvidenceId='';chosenEvidenceIds.clear();return true;
 }catch(e){crossError='교차 검사 실패: '+String(e?.message||e).slice(0,210);return false;}
 finally{crossBusy=false;renderCrossAudit();}
}
/* Export only a fresh, complete, collision-free 800-question snapshot. */
function crossReportFresh(){
 if(!crossReport?.complete||crossBusy)return false;
 try{
  const links=window.CK83Links,editor=window.CK80Editorial;
  const ls=links?.getStatus?.()||{},es=editor?.getStatus?.()||{};
  if(!links?.getRecords||!editor?.getRecords||ls.storageIssue||ls.storageConflict||
   ls.unsavedEdits||es.storageIssue||editor.hasUnsavedChanges?.()){
   crossReport=null;chosenEvidenceIds.clear();expandedEvidenceId='';
   crossStatus('미저장 개인 입력·저장소 충돌·손상 기록이 있습니다. 먼저 저장 또는 백업하고 다시 검사하세요.');
   return false;
  }
  const live83=links.getRecords();
  // A second tab may have written before our storage event arrived.
  const raw83=localStorage.getItem('ck83-personal-concept-links-v1');
  const clean83=raw83===null?{records:{}}:links.sanitize?.(JSON.parse(raw83));
  if(!clean83||JSON.stringify(clean83.records)!==JSON.stringify(live83)){
   crossReport=null;chosenEvidenceIds.clear();expandedEvidenceId='';
   crossStatus('다른 탭의 선지 메모 변경이 확인됐습니다. 원본 보존 후 새로고침하세요.');
   return false;
  }
  const live=crossEvidenceAudit(window.RECALL_OFFICIAL,live83,editor.getRecords());
  if(!live.complete||JSON.stringify(live)!==JSON.stringify(crossReport)){
   crossReport=null;chosenEvidenceIds.clear();expandedEvidenceId='';
   crossStatus('기존 검사 결과와 현재 공식 문제/개인 메모가 다릅니다. 다시 검사해 주세요.');
   return false;
  }
  return true;
 }catch(e){
  crossReport=null;chosenEvidenceIds.clear();expandedEvidenceId='';
  crossStatus('검사 유효성 재확인 실패 · '+String(e?.message||e).slice(0,180));
  return false;
 }
}
function saveCrossFile(body,mime,filename){
 if(typeof body!=='string'||!body)return false;
 try{
  const file=new Blob(['\uFEFF',body],{type:mime+';charset=utf-8'});
  const url=URL.createObjectURL(file),a=document.createElement('a');
  a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),2500);return true;
 }catch(error){crossStatus('파일 다운로드 실패 · '+String(error?.message||error));return false;}
}
function exportCrossCsv(){
 if(!crossReportFresh())return false;
 const ok=saveCrossFile(makeCrossCsv(crossReport),'text/csv',
  'ConceptKnot_개인선지근거_교차점검_'+new Date().toISOString().slice(0,10)+'.csv');
 if(ok)crossStatus('800문항 CSV 다운로드 요청 완료 · 정답/법령 독립 검수 완료는 아닙니다.');
 return ok;
}
function exportCrossPacket(){
 if(!crossReportFresh())return false;
 const ids=chosenEvidenceIds.size?[...chosenEvidenceIds]:crossRows().slice(0,packetCount).map(q=>q.id);
 if(!ids.length){crossStatus('현재 필터에 문항이 없습니다. 조건을 변경하세요.');return false;}
 const body=makeCrossPacket(ids,window.RECALL_OFFICIAL,
  window.CK83Links.getRecords(),window.CK80Editorial.getRecords());
 if(!body){crossStatus('공식 기출 원문이 누락되어 부분 패킷 생성을 차단했습니다.');return false;}
 const ok=saveCrossFile(body,'text/plain',
  'ConceptKnot_근거검토패킷_'+ids.length+'문항_'+new Date().toISOString().slice(0,10)+'.txt');
 if(ok)crossStatus(ids.length+'문항 TXT 저장 요청 · 개인 근거는 공식 검수 상태로 승격되지 않습니다.');
 return ok;
}

function mount(){
 const exists=document.getElementById('ck88-data-diagnostics');if(exists){root=exists;return;}
 const host=document.getElementById('main');if(!host)return;
 root=document.createElement('section');root.id='ck88-data-diagnostics';root.className='ck88-diagnostics';
 root.innerHTML='<div class="ck88-head"><strong>내 학습 데이터 안전 점검</strong><button type="button" data-v88-refresh>진단 새로고침</button>'+
 '<button type="button" data-v88-raw>12종 원본 백업 내려받기</button></div><p data-v122-raw-status role="status"></p><div data-v88-body></div>'+
 '<details class="ck88-audit-matrix ck121-static-audit" data-v121-audit>'+
 '<summary>공식 800문항·해설 400건 구조 점검 (수동 실행)</summary>'+
 '<p>저장소 내 7개 JSON을 버튼 클릭 시에만 읽습니다. 정답 진위·법령·판례의 전문 검수는 별개입니다.</p>'+
 '<button type="button" data-v121-run>원문·해설 구조 검사</button>'+
 '<button type="button" data-v121-export disabled>검사 결과 TXT</button>'+
 '<p data-v121-status role="status"></p><div data-v121-result></div></details>'+ 
  '<details class="ck88-audit-matrix ck122-cross-audit" data-v122-cross>'+ 
  '<summary>800문항 · 4,000선지 개인 근거 교차점검 (수동 실행)</summary>'+ 
  '<p>CK83 선지 근거와 CK80 해설 초안은 독립된 개인 기록입니다. 출처 누락·판정 불일치를 비교하며 공식 검수로 승격하지 않습니다.</p>'+ 
  '<button type="button" data-v122-run>저장된 개인 근거 교차 검사</button>'+ 
  '<button type="button" data-v122-export disabled>800문항 점검 CSV</button>'+ 
  '<p data-v122-status role="status"></p><div data-v122-result></div></details>'+
 '<details class="ck88-audit-matrix ck125-offline-health" data-v125-offline>'+
 '<summary>오프라인 필수 파일 준비도 · 수동 읽기 전용</summary>'+
 '<p>버튼을 누르면 현재 브라우저의 v125 캐시에 있는 최소 11개 파일만 확인합니다. 모든 기능이 오프라인에서 작동한다는 보증은 아닙니다.</p>'+
 '<button type="button" data-v125-offline-run>이 기기의 오프라인 캐시 검사</button>'+
 '<p role="status" data-v125-offline-status>미검사 · 온라인에서 최신 버전을 연 뒤 확인하세요.</p></details>';
 host.append(root);render();renderAudit();renderCrossAudit();
}
document.addEventListener('click',event=>{
 const t=event.target.closest?.('[data-v88-refresh],[data-v88-raw],[data-v88-open],[data-v88-review-export]');
 if(!t||!document.getElementById('ck88-data-diagnostics')?.contains(t))return;
 if(t.hasAttribute('data-v88-raw'))downloadRaw();
 else if(t.hasAttribute('data-v88-review-export'))exportVisualQueue();
 else if(t.hasAttribute('data-v88-open')){
  const id=t.dataset.v88Open,q=window.RECALL_OFFICIAL?.[id];
  if(q?.verified===true&&q.year===Number(id.split('-')[0])&&q.number===Number(id.split('-')[1])){
   if(q.year>=2021&&window.CK78Analysis?.open)window.CK78Analysis.open(q.year,q.number,t);
   else window.CK76Study?.openQuestion?.(q.year,q.number,q.subject);
  }
 }else render();
});
document.addEventListener('click',event=>{
 const button=event.target?.closest?.('[data-v121-run],[data-v121-export]');
 if(!button||!document.getElementById('ck88-data-diagnostics')?.contains(button))return;
 event.preventDefault();
 if(button.hasAttribute('data-v121-run')){runAudit();return}
 if(button.hasAttribute('data-v121-export'))saveAudit();
});

document.addEventListener('click',event=>{
 const t=event.target?.closest?.('[data-v125-offline-run]');
 if(t&&root?.contains(t)){event.preventDefault();runOfflineHealth();}
});
document.addEventListener('click',event=>{
 const t=event.target?.closest?.('[data-v122-run],[data-v122-export],[data-v122-page],[data-v122-open],[data-v124-expand],[data-v124-editor],[data-v124-packet],[data-v124-clear]');
 if(!t||!root?.contains(t))return;
 event.preventDefault();
 if(t.hasAttribute('data-v122-run')){runCrossAudit();return;}
 if(t.hasAttribute('data-v122-export')){exportCrossCsv();return;}
 if(t.hasAttribute('data-v124-packet')){exportCrossPacket();return;}
 if(t.hasAttribute('data-v124-clear')){chosenEvidenceIds.clear();renderCrossAudit();return;}
 if(t.hasAttribute('data-v124-editor')){
  const id=t.dataset.v124Editor;
  if(!canonicalId(id)||!crossReport?.rows?.some(r=>r.id===id))return;
  const [year,number]=id.split('-').map(Number);
  if(typeof window.CK78Analysis?.open!=='function'){
   crossStatus('원문 분석 대화상자가 준비되지 않았습니다. 새로고침 후 다시 확인하세요.');return;
  }
  Promise.resolve().then(()=>window.CK78Analysis.open(year,number,t)).then(ok=>{
   if(ok!==true){
    crossStatus('해설 창 진입이 취소됐습니다. 미저장 입력이나 공식 원문 상태를 확인하세요.');
    return;
   }
   const toggle=document.querySelector('#ck78-analysis-dialog [data-ck80-toggle]');
   if(toggle)toggle.click();
   else crossStatus('해설 편집기가 표시되지 않았습니다. 원문·해설 모듈을 확인하세요.');
  }).catch(e=>crossStatus('개인 해설 창 열기 실패 · '+String(e?.message||e).slice(0,150)));
  return;
 }
 if(t.hasAttribute('data-v124-expand')){
  const id=t.dataset.v124Expand;
  if(canonicalId(id)&&crossReport?.rows?.some(row=>row.id===id)){
   expandedEvidenceId=expandedEvidenceId===id?'':id;renderCrossAudit();
  }
  return;
 }
 if(t.hasAttribute('data-v122-page')){
  crossPage=Math.max(0,crossPage+(t.dataset.v122Page==='next'?1:-1));
  renderCrossAudit();return;
 }
 const id=t.dataset.v122Open;
 if(!canonicalId(id)||!crossReport?.rows?.some(r=>r.id===id))return;
 Promise.resolve().then(()=>window.CK83Links?.openQuestion?.(id)).then(ok=>{
  if(ok===false)crossStatus('선지 메모 창 진입이 취소됐습니다. 미저장 기록과 공식 원문을 확인하세요.');
 }).catch(e=>crossStatus('해당 문항 열기 실패 · '+String(e?.message||e)));
});
document.addEventListener('change',event=>{
 const target=event.target;
 if(!root?.contains(target))return;
 if(target.matches?.('[data-v124-pick]')){
  const id=target.dataset.v124Pick;
  if(!canonicalId(id)||!crossReport?.rows?.some(row=>row.id===id))return;
  if(!target.checked)chosenEvidenceIds.delete(id);
  else if(chosenEvidenceIds.size<5)chosenEvidenceIds.add(id);
  else{target.checked=false;crossStatus('묶음당 최대 5문항을 선택할 수 있습니다.');return;}
  renderCrossAudit();return;
 }
 if(target.matches?.('[data-v124-count]')){
  packetCount=[1,3,5].includes(Number(target.value))?Number(target.value):5;
  renderCrossAudit();return;
 }
 if(target.matches?.('[data-v122-filter]')){
  crossFilter=['missing','conflict','citation','special','ready','all'].includes(target.value)?
   target.value:'missing';crossPage=0;renderCrossAudit();
 }
 if(target.matches?.('[data-v122-year]')){
  crossYear=/^(?:all|201[6-9]|202[0-5])$/.test(target.value)?target.value:'all';
  crossPage=0;renderCrossAudit();
 }
});
function invalidateCrossAudit(){
 if(!crossReport)return;
 crossReport=null;chosenEvidenceIds.clear();expandedEvidenceId='';crossError='개인 기록이 변경됐습니다. 다시 검사 버튼을 눌러 갱신하세요.';
 renderCrossAudit();
}
document.addEventListener('ck:personal-links-updated',invalidateCrossAudit);
document.addEventListener('ck:personal-editor-updated',invalidateCrossAudit);
window.addEventListener('storage',event=>{
 if(['ck83-personal-concept-links-v1','ck80-explain-drafts-v1'].includes(event.key))
  invalidateCrossAudit();
});

document.addEventListener('change',e=>{if(e.target?.matches?.('[data-v88-year]')){queueYear=Number(e.target.value);render();loadOlderYear(queueYear);}
 if(e.target?.matches?.('[data-v88-queue-mode]')){queueMode=['all','unreviewed','low-text'].includes(e.target.value)?e.target.value:'all';render();}});

document.addEventListener('click',event=>{
 const t=event.target.closest?.('[data-v105-export],[data-v105-year]');
 if(!t||!root?.contains(t))return;
 if(t.hasAttribute('data-v105-export')){exportReviewCsv();return;}
 queueYear=Number(t.dataset.v105Year);render();
 const details=root.querySelector('.ck88-review-queue');if(details)details.open=true;
 loadOlderYear(queueYear);
});

const target=document.getElementById('main');
if(target&&window.MutationObserver)new MutationObserver(()=>{
 if(!document.getElementById('ck88-data-diagnostics')&&
  document.querySelector('#main [data-action="backup"]'))mount();
}).observe(target,{childList:true});
window.addEventListener('ck:official-bank-ready',()=>{if(root)render();});
window.CK88Diagnostics=Object.freeze({controllerCacheInfo,inspect,bankQuality,visualQueue,exportVisualQueue,loadOlderYear,mount,reviewRows,reviewMatrix,csvCell,makeReviewCsv,exportReviewCsv,auditStatic,auditText,runAudit,crossEvidenceAudit,makeCrossCsv,runCrossAudit,exportCrossCsv,optionEvidenceDetails,makeCrossPacket,exportCrossPacket,crossReportFresh,offlineHealth,runOfflineHealth,OFFLINE_MINIMUM});
})();