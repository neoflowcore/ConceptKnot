/* ConceptKnot v112 - complete ten-year offline P4 evidence workbench.
 * Canonical official answers and explanations are read-only.
 * Personal work readiness NEVER represents an official source/legal review.
 */
(function(){
'use strict';
const KEY='ck81-review-workbench-v1',EDITOR='ck80-explain-drafts-v1',MAX=800;
const VALID_STATUS=['backlog','researching','hold','ready'];
const YEARS=Array.from({length:10},(_,i)=>2025-i);
// Only recent years have seeded analysis JSON. Older registered questions can
// receive personal drafts but MUST NOT be mislabeled as verified explanations.
const EXPLANATION_YEARS=[2025,2024,2023,2022,2021];
const SUBJECTS={estate:'부동산학개론',civil:'민법 및 민사특별법'};
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=value=>String(value??'').normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
const isId=id=>/^20(?:1[6-9]|2[0-5])-(?:[1-9]|[1-7]\d|80)$/.test(String(id||''));
const official=()=>window.RECALL_OFFICIAL||{};
let storageIssue='',lastRaw=undefined;
let root=null,shown=false,rows=null,loading=null,loadErrors=0,legacyLoadError='',local=readLocal(),statusMessage='',timer=null;
const view={year:0,subject:'all',stage:'all',search:'',page:0,pageSize:20,sort:'priority'};
let researchBatch=5;
function empty(){return {schemaVersion:1,scope:'personal-unpublished-workbench',records:{}};}
function sanitizeProgress(raw){
 if(!raw||raw.schemaVersion!==1||raw.scope!=='personal-unpublished-workbench'||
   !raw.records||typeof raw.records!=='object'||Array.isArray(raw.records))return null;
 const pairs=Object.entries(raw.records);
 if(pairs.length>MAX||pairs.some(([id,value])=>!isId(id)||!value||typeof value!=='object'||
   !VALID_STATUS.includes(value.status)||typeof value.bookmark!=='boolean'))return null;
 const result=empty();
 for(const [id,r] of pairs){
  result.records[id]={status:r.status,bookmark:r.bookmark,
   updatedAt:Number.isFinite(Number(r.updatedAt))?
    Math.max(0,Math.min(Date.now()+86400000,Number(r.updatedAt))):0};
 }
 return result;
}
function readLocal(){
 try{
  const raw=localStorage.getItem(KEY);
  if(raw===null){storageIssue='';lastRaw=null;return empty();}
  const clean=sanitizeProgress(JSON.parse(raw));
  if(!clean){storageIssue='검토 작업대 저장 데이터가 손상됐습니다. 원본 백업 전 저장을 차단합니다.';return empty();}
  storageIssue='';lastRaw=raw;return clean;
 }catch{storageIssue='검토 작업대 데이터를 읽지 못했습니다. 원본을 보호합니다.';return empty();}
}
function persist(next){
 if(storageIssue)return false;
 const clean=sanitizeProgress(next);if(!clean)return false;
 try{
  if(localStorage.getItem(KEY)!==lastRaw){storageIssue='다른 탭의 기록 변경이 감지됐습니다. 새로고침 후 저장하세요.';return false;}
  const raw=JSON.stringify(clean);localStorage.setItem(KEY,raw);lastRaw=raw;local=clean;return true;
 }catch{return false;}
}
function changeProgress(id,part){
 if(!isId(id)||official()[id]?.verified!==true)return false;
 const previous=local.records[id]||{status:'backlog',bookmark:false,updatedAt:0};
 const updated={status:VALID_STATUS.includes(part.status)?part.status:previous.status,
  bookmark:typeof part.bookmark==='boolean'?part.bookmark:previous.bookmark,updatedAt:Date.now()};
 const next={...local,records:{...local.records,[id]:updated}};
 const saved=persist(next);
 message(saved?'개인 작업 상태 저장됨 · 공식 해설 검수 상태는 바뀌지 않았습니다.':storageIssue||'저장 실패 · 브라우저 저장공간 또는 권한을 확인하세요.');
 return saved;
}
function markResearchBatch(ids){
 if(!Array.isArray(ids)||!ids.length)return {ok:false,count:0};
 const chosen=[...new Set(ids)].filter(id=>isId(id)&&official()[id]?.verified===true).slice(0,5);
 if(!chosen.length)return {ok:false,count:0};
 const next={...local,records:{...local.records}},now=Date.now();
 let changed=0;
 for(const id of chosen){
  const prior=next.records[id]||{status:'backlog',bookmark:false,updatedAt:0};
  if(prior.status==='hold'||prior.status==='ready')continue;
  if(prior.status==='researching'&&prior.bookmark)continue;
  next.records[id]={...prior,status:'researching',bookmark:true,updatedAt:now};
  changed++;
 }
 if(!changed)return {ok:true,count:0};
 const ok=persist(next);
 return {ok,count:ok?changed:0};
}
function personalDrafts(){
 try{const raw=JSON.parse(localStorage.getItem(EDITOR)||'{}');return raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};}
 catch{return {};}
}
function assessDraft(record){
 const d=record&&typeof record==='object'?record:null;
 if(!d)return {done:0,total:8,missing:['15초 설명','정답 논리','근거 출처','선지 ①~⑤'],any:false};
 let done=0,missing=[];
 if(String(d.summaryEasy||'').trim())done++;else missing.push('15초 설명');
 if(String(d.answerReason||'').trim())done++;else missing.push('정답 논리');
 if(String(d.evidence||'').trim())done++;else missing.push('근거 출처');
 for(let i=0;i<5;i++){
  const row=d.options?.[i];
  if(row&&['true','false'].includes(row.verdict)&&String(row.why||'').trim())done++;
  else missing.push('선지 '+(i+1));
 }
 return {done,total:8,missing,any:done>0};
}
function specialAnswer(q){
 const n=Array.isArray(q?.correct)?q.correct.length:0;
 return n===5?'전원정답(채점 인정)':n>1?'복수정답':n===0?'정답 미확인':'일반';
}
function dueIds(){
 const snap=window.CK79Study?.snapshot?.()||{};
 const queue=window.CK86ExamBridge?.getDue?.({
  reviews:snap.review||{},mistakes:snap.mistakes||[],bank:official(),at:Date.now()
 });
 if(queue&&Array.isArray(queue.rows))return {
  due:new Set(queue.rows.map(r=>r.id).filter(isId)),
  mistakes:new Set(queue.rows.filter(r=>r.source==='v82-official-mock'||r.source==='personal-mistake').map(r=>r.id).filter(isId)),
  future:queue.future||0
 };
 return {due:new Set(),mistakes:new Set(),future:0,unavailable:true};
}
function catalog(){
 return Object.values(official()).filter(q=>q&&q.verified===true&&isId(q.id)&&
  Array.isArray(q.options)&&q.options.length===5).sort((a,b)=>b.year-a.year||a.number-b.number);
}
const bundleCache=new Map();
function validExplanationBundle(year,data){
 if(Number(data?.year)!==year||!Array.isArray(data.records)||data.records.length!==80)return false;
 const seen=new Set();
 return data.records.every(entry=>{
  const id=entry?.questionId,q=official()[id];
  if(!isId(id)||!id.startsWith(year+'-')||seen.has(id)||!q||q.verified!==true||
   entry.examYear!==year||entry.number!==q.number||entry.subject!==q.subject||
   !Array.isArray(entry.officialAnswer)||!Array.isArray(q.correct)||
   !Array.isArray(entry.options)||entry.options.length!==5||
   entry.options.some((o,i)=>o?.no!==i+1))return false;
  const listed=entry.officialAnswer.map(Number).sort((a,b)=>a-b).join(',');
  const officialKey=q.correct.map(Number).sort((a,b)=>a-b).join(',');
  if(listed!==officialKey)return false;
  seen.add(id);return true;
 });
}
function load(force=false){
 if(rows&&!force)return Promise.resolve(rows);
 if(loading)return loading;
 loading=(async()=>{
  legacyLoadError='';
  // Keep offline personal progress even when an older source file is unavailable.
  // The official bank validates 400 legacy records before assigning any.
  if(window.CK89OfficialBank?.loadAll){
   try{await window.CK89OfficialBank.loadAll();}
   catch(error){legacyLoadError=String(error?.message||'2016~2020년 자료를 확인하지 못했습니다.');}
  }
  const found=catalog();
  const bundles=await Promise.allSettled(EXPLANATION_YEARS.map(async year=>{
   if(!force&&bundleCache.has(year))return bundleCache.get(year);
   const response=await fetch('./data/explanations/official-'+year+'.json?v=154',
    {cache:force?'reload':'force-cache'});
   if(!response.ok)throw Error('HTTP '+response.status);
   const data=await response.json();
   if(!validExplanationBundle(year,data))throw Error(year+'년 문항·선지·정답 연결 불일치');
   return data.records;
  }));
  loadErrors=0;
  bundles.forEach((result,i)=>{
   const year=EXPLANATION_YEARS[i];
   if(result.status==='fulfilled')bundleCache.set(year,result.value);
   else loadErrors++;
  });
  const byId=new Map();
  for(const records of bundleCache.values())for(const entry of records)
   if(isId(entry.questionId))byId.set(entry.questionId,entry);
  rows=found.map(q=>({q,entry:byId.get(q.id)||null}));
  return rows;
 })().finally(()=>{loading=null;});
 return loading;
}
function enriched(items,drafts=personalDrafts(),study=dueIds(),
 personal=window.CK83Links?.getRecords?.()||{}){
 return items.map(item=>{
  const q=item.q,p=local.records[q.id]||{status:'backlog',bookmark:false,updatedAt:0};
  const notes=personal?.[q.id]?.optionNotes||{};
  const optionNotes=Array.from({length:5},(_,i)=>notes[String(i+1)]||{});
  const ownAssessmentCount=optionNotes.filter(n=>['true','false','conditional'].includes(n.assessment)).length;
  const ownSourceCount=optionNotes.filter(n=>typeof n.source==='string'&&n.source.trim()).length;
  const draft=drafts[q.id],assess=assessDraft(draft);
  const draftSourceCount=Array.isArray(draft?.options)?draft.options.filter(o=>
   typeof o?.source==='string'&&o.source.trim()).length:0;
  const qa=item.entry?.quality||{},scores=[q.checks?.primaryText?.score,q.checks?.primaryText?.ocrScore].filter(Number.isFinite);
  const textScore=scores.length?Math.min(...scores):null;
  const reasonReviewed=qa.reasonReviewed===true&&qa.sourceChecked===true&&
   !!String(item.entry?.answerReason||'').trim();
  const options=item.entry?.options;
  const optionReviewed=qa.optionVerdictsReviewed===5&&qa.sourceChecked===true&&
   Array.isArray(options)&&options.length===5&&
   options.every((x,i)=>x?.no===i+1&&['true','false','conditional'].includes(x.verdict)&&
    x.sourceChecked===true&&!!String(x.why||'').trim());
  return {...item,p,draft,assess,isDue:study.due.has(q.id),isMistake:study.mistakes.has(q.id),
   textScore,visualReviewed:q.checks?.visualReview===true,
   ownAssessmentCount,ownSourceCount,draftSourceCount,
   reasonReviewed,optionReviewed,
   canonical:qa.status||'unavailable'};
 });
}
/* v159 priority hints are never substantive official review. */
function p4PriorityRecord(item){
 return window.CK159P4Review?.row?.(item)||null;
}
function matchingRows(items,filters=view){
 const terms=norm(filters.search).split(' ').filter(Boolean);
 return items.filter(x=>{
  const q=x.q,stage=filters.stage||'all';
  if(filters.year&&Number(filters.year)!==q.year)return false;
  if(filters.subject!=='all'&&filters.subject!==q.subject)return false;
  if(stage==='unstarted'&&!((x.canonical==='unstarted'||x.q.year<=2020)&&!x.draft))return false;
  if(stage==='draft'&&!(x.canonical==='draft'||x.draft))return false;
  if(stage==='incomplete'&&!(x.draft&&x.assess.done<8))return false;
  if(stage==='ready'&&x.p.status!=='ready')return false;
  if(stage==='hold'&&x.p.status!=='hold')return false;
  if(stage==='due'&&!x.isDue)return false;
  if(stage==='bookmark'&&!x.p.bookmark)return false;
  if(stage==='special'&&specialAnswer(q)==='일반')return false;
  const p4Tier={'p4-special':1,'p4-law':2,'p4-calculation':3,'p4-other':4}[stage];
  if(p4Tier&&p4PriorityRecord(x)?.tier!==p4Tier)return false;
  if(stage==='needs-source'&&x.visualReviewed&&x.reasonReviewed)return false;
  if(stage==='low-text'&&!(x.textScore!==null&&x.textScore<0.9))return false;
  if(stage==='not-reason-reviewed'&&x.reasonReviewed)return false;
  if(stage==='no-personal-source'&&x.ownSourceCount===5)return false;
  if(terms.length){
   const text=norm(q.id+' '+q.question+' '+q.options.join(' '));
   if(!terms.every(t=>text.includes(t)))return false;
  }
  return true;
 });
}
function riskScore(item){
 const q=item.q;
 return (item.isDue?12:0)+(item.isMistake?7:0)+
  (specialAnswer(q)!=='일반'?8:0)+(!item.visualReviewed?5:0)+
  (item.textScore!==null&&item.textScore<0.90?6:0)+
  (!item.reasonReviewed?3:0)+(5-Math.min(5,item.ownSourceCount||0))*2+
  (['unstarted','unavailable'].includes(item.canonical)?2:0)+
  (item.p.bookmark?4:0);
}
function sortRows(items,sort=view.sort){
 const sorted=items.slice();
 if(sort==='number')sorted.sort((a,b)=>a.q.year-b.q.year||a.q.number-b.q.number);
 else if(sort==='progress')sorted.sort((a,b)=>b.assess.done-a.assess.done||b.q.year-a.q.year||a.q.number-b.q.number);
 else if(sort==='risk')sorted.sort((a,b)=>riskScore(b)-riskScore(a)||b.q.year-a.q.year||a.q.number-b.q.number);
 else if(sort==='source-priority')sorted.sort((a,b)=>
  (p4PriorityRecord(a)?.tier||5)-(p4PriorityRecord(b)?.tier||5)||
  b.q.year-a.q.year||a.q.number-b.q.number);
 else sorted.sort((a,b)=>Number(b.p.bookmark)-Number(a.p.bookmark)||Number(b.isDue)-Number(a.isDue)||
  b.q.year-a.q.year||a.q.number-b.q.number);
 return sorted;
}
function summary(items){
 const counts={total:items.length,canonicalDraft:0,unstarted:0,legacyUnseeded:0,personal:0,complete:0,
  ready:0,hold:0,due:0,bookmarked:0,missing:0,reviewed:0,
  personalOptionSources:0,personalOptionAssessments:0,personalSourceComplete:0,
  draftOptionSources:0,draftSourceComplete:0,
  reasonReviewed:0,fullyOptionReviewed:0,lowText:0,visualReviewMissing:0};
 items.forEach(x=>{
  if(x.canonical==='draft')counts.canonicalDraft++;
  if(x.canonical==='unstarted')counts.unstarted++;
  if(x.q.year<=2020&&x.canonical==='unavailable')counts.legacyUnseeded++;
  if(x.q.year>=2021&&x.canonical==='unavailable')counts.missing++;
  if(x.draft)counts.personal++;
  if(x.draft&&x.assess.done===8)counts.complete++;
  if(x.p.status==='ready')counts.ready++;
  if(x.p.status==='hold')counts.hold++;
  if(x.p.bookmark)counts.bookmarked++;
  if(x.isDue)counts.due++;
  counts.personalOptionSources+=x.ownSourceCount||0;
  counts.personalOptionAssessments+=x.ownAssessmentCount||0;
  if(x.ownSourceCount===5)counts.personalSourceComplete++;
  counts.draftOptionSources+=x.draftSourceCount||0;
  if(x.draftSourceCount===5)counts.draftSourceComplete++;
  if(x.reasonReviewed)counts.reasonReviewed++;
  if(x.optionReviewed)counts.fullyOptionReviewed++;
  if(x.textScore!==null&&x.textScore<0.9)counts.lowText++;
  if(!x.visualReviewed)counts.visualReviewMissing++;
  counts.reviewed+=x.assess.done;
 });
 return counts;
}
function option(value,label,current){
 return '<option value="'+esc(value)+'"'+(String(value)===String(current)?' selected':'')+'>'+esc(label)+'</option>';
}
function renderMatrix(items){
 return '<div class="ck81-matrix" role="group" aria-label="연도별 과목별 해설 입력 현황">'+
 YEARS.map(year=>['estate','civil'].map(subject=>{
  const sub=items.filter(x=>x.q.year===year&&x.q.subject===subject);
  const active=view.year===year&&view.subject===subject;
  return '<button type="button" class="ck81-matrix-cell" data-ck81-matrix="'+year+'|'+subject+
   '" aria-pressed="'+active+'"><strong>'+year+' · '+(subject==='estate'?'학개론':'민법')+
   '</strong><span>내 초안 '+sub.filter(x=>x.draft).length+'/'+sub.length+
   ' · 기본 초안 '+sub.filter(x=>x.canonical==='draft').length+
   ' · 근거 검수 '+sub.filter(x=>x.reasonReviewed).length+'/'+sub.length+'</span></button>';
 }).join('')).join('')+'</div>';
}
function researchPacket(ids,items=rows,max=5){
 if(!Array.isArray(ids)||!Array.isArray(items))return '';
 const byId=new Map(items.map(item=>[item.q.id,item]));
 const limit=Math.max(1,Math.min(5,Number(max)||5));
 const selected=[...new Set(ids)].filter(id=>isId(id)&&byId.has(id)).slice(0,limit);
 if(!selected.length)return '';
 const lines=[
 'ConceptKnot 10개년 기출 출처·논리 대조 질문 · 공식 검증 해설 아님',
 '원칙: 원문 A형·최종정답 먼저 대조, 시험 당시 기준 법령·판례 확인, 최신 법령과 구분.',
 '선지 ①~⑤의 진위를 독립 검토하고 불확실한 경우 보류하세요.',
 '복수/전원정답 채점 인정 번호와 각 선지 자체의 참·거짓을 혼동하지 마세요.',
 '수식·그림·표, 또는 OCR 텍스트 유사도가 낮으면 원본 PDF 대조 전 단정하지 마세요.',''];
 selected.forEach((id,i)=>{
  const item=byId.get(id),q=item.q,qa=item.entry?.quality||{};
  const references=Array.isArray(item.entry?.sourceRefs)?item.entry.sourceRefs:[];
  lines.push('--- 검토 대상 '+(i+1)+' / '+selected.length+' ---',
   q.year+'년 공인중개사 1차 A형 '+q.number+'번 · '+SUBJECTS[q.subject]+' · '+id,
   '문제 원문 텍스트: '+q.question,
   ...q.options.map((v,j)=>'선지 '+(j+1)+': '+v),
   '공식 채점 인정 번호: '+q.correct.join(', ')+
    (q.correct.length===5?' (전원정답 인정. 선지 모두 참이라는 뜻 아님)':
     q.correct.length>1?' (복수정답 인정)':''),
   '문제 PDF: '+String(q.paperUrl||q.originalUrl||'링크 미기재'),
   'Q-Net 최종정답 공고: '+String(q.answerSourceUrl||window.CK160OptionAudit?.finalAnswerNotice?.(q.year)||'링크 미기재'),
   '시각 검토: '+(item.visualReviewed?'검토 완료 메타':'미검토 또는 미기재')+
   ' / 텍스트 유사도: '+(item.textScore===null?'미기재':item.textScore.toFixed(3)),
   '기본 해설: '+item.canonical+' / 근거 검수: '+(item.reasonReviewed?'표시 있음':'표시 없음'),
   ...references.filter(r=>r&&typeof r.url==='string').slice(0,3)
    .map(r=>'참고 링크 후보 ('+r.type+'): '+r.url),
   '요청: 보기별 사실판단·예외·조문/판례·해당 연도 기준·출처 검토와 최종정답 인정 근거를 분리해 작성.',
   '아래 항목은 기입 템플릿이며, 사실 검증 결과가 아닙니다.',
   ...q.options.map((_,j)=>'선지 '+(j+1)+' 판정 [참/거짓/보류]: | 근거 조문·판례/쪽수: | 시행·판단 기준일: | 검증 상태: 미확인'),
   '정답 인정의 출처 및 정오표 검토: 미확인',
   '시험 당시 법령과 현재 법령의 차이: 미확인','');
 });
 return lines.join('\n');
}
/* v154: offline, read-only audit packet for human comparison.
 * Never export a personal note without an explicit user action, and never
 * reclassify an unreviewed draft/option as a certified explanation.
 */
function draftReviewPacket(ids,items,limit=5){
 const selected=Array.from(new Set((Array.isArray(ids)?ids:[]).filter(isId))).slice(0,Math.min(5,Math.max(1,limit)));
 if(!selected.length||!Array.isArray(items))return '';
 const byId=new Map(items.map(item=>[item.q?.id,item]));
 const lines=['ConceptKnot · 최근 5개년 기출 해설 초안 / 근거 대조 워크시트',
  '상태: 학습용 후보 · 전문 검수 미완료 · 공식 정답표와 선지 진위 판단은 별개',
  '이 문서는 원본 문제와 미검수 초안을 나란히 확인하기 위한 개인 작업 자료입니다.',''];
 for(const id of selected){
  const item=byId.get(id),q=item?.q,r=item?.entry;
  if(!q||!r||r.quality?.status!=='draft')continue;
  if(r.officialAnswer.join(',')!==(q.correct||[]).join(','))continue;
  lines.push('=== '+id+' / '+(SUBJECTS[q.subject]||'과목 미확인')+' ===',
   '원문: '+q.question,
   ...q.options.map((value,i)=>'원문 선지 '+(i+1)+': '+value),
   '공식 채점 인정 번호: '+q.correct.join(', ')+
    (q.correct.length===5?' (전원정답, 선지 진위 전체를 보증하지 않음)':q.correct.length>1?' (복수정답 인정)':''),
   '학습용 요약 초안 [검수 대기]: '+String(r.summaryEasy||''),
   '정답 해설 후보 [검수 대기]: '+String(r.answerReason||''),
   ...((r.traps||[]).filter(x=>x&&typeof x.text==='string')
    .map(x=>'오답 유의점 후보 [검수 대기]: '+x.text)),
   ...r.options.map((v,i)=>'선지 '+(i+1)+' 독립 검수: '+
    (v?.sourceChecked===true&&v?.verdict!=='unreviewed'?'원전 검수 기재':'미검수')+
    (v?.draftReason?' / 후보 설명: '+v.draftReason:' / 후보 설명 미작성')),
   '시험 당시 법령·판례·적용일 검수: '+
    (r.quality?.sourceChecked?'검수 표기 있음 (원전 별도 확인 필요)':'미검수'),
   '원본 문제 PDF: '+String(q.paperUrl||'미기재'),
   'Q-Net 원문 문제지 게시글: '+String(q.originalUrl||'미기재'),
   'Q-Net 최종정답 공고: '+String(window.CK160OptionAudit?.finalAnswerNotice?.(q.year)||'미기재'),
   '사람 검수 작성란: 조문/판례 번호 · 출처 쪽수 · 적용 기준일 · 각 선지 판단 이유 · 검수자/일시',
   '검수자 서명: [미작성] · 게시 가능: [아니오]','');
 }
 return lines.join('\n');
}
function renderRows(items){
 if(!items.length)return '<p class="ck81-empty">조건에 맞는 문항이 없습니다. 필터를 변경하세요.</p>';
 return '<div class="ck81-row-list">'+items.map(x=>{
  const q=x.q,canonical=x.canonical==='draft'?'기본 해설 초안':x.canonical==='unstarted'?
   '기본 해설 미작성':q.year<=2020?'기본 해설 미제공 · 개인 작성 가능':'해설 파일 확인 필요';
  const status=local.records[q.id]?.status||'backlog';
  const verdict=x.draft?' · 내 초안 '+x.assess.done+'/8':'';
  const question=String(q.question||'').replace(/\s+/g,' ').slice(0,170);
  const p4=p4PriorityRecord(x);
  const paper=typeof q.paperUrl==='string'&&/^https:\/\/[A-Za-z0-9.-]+\//.test(q.paperUrl)?q.paperUrl:'';
  const original=typeof q.originalUrl==='string'&&/^https:\/\/[A-Za-z0-9.-]+\//.test(q.originalUrl)?q.originalUrl:'';
  const answer=window.CK160OptionAudit?.finalAnswerNotice?.(q.year)||'';
  return '<article class="ck81-item" data-ck81-id="'+esc(q.id)+'">'+
   '<div class="ck81-item-top"><strong>'+q.year+'년 '+q.number+'번 · '+esc(SUBJECTS[q.subject])+
   '</strong><span>'+esc(canonical)+esc(verdict)+'</span></div>'+
   '<p>'+esc(question)+'</p>'+
   '<div class="ck81-tags">'+
   (x.isDue?'<span>복습 예정</span>':'')+(x.isMistake?'<span>내 오답</span>':'')+
   (specialAnswer(q)!=='일반'?'<span>'+esc(specialAnswer(q))+'</span>':'')+
   (p4?'<span class="ck159-p4-tag">원전검수 '+p4.tier+'단계 · '+esc(window.CK159P4Review.LABEL[p4.tier])+'</span>':'')+
   (!x.visualReviewed?'<span>시각 검토 미확인</span>':'')+
   (x.textScore!==null&&x.textScore<0.9?'<span>원문 유사도 0.90 미만</span>':'')+
   (x.reasonReviewed?'<span>해설 근거 검수 표시</span>':'')+
   (x.textScore!==null&&x.textScore<0.9?'<span>OCR/원문 대조 우선</span>':'')+
   (x.p.status==='ready'?'<span>개인 대조 준비 · 미검수</span>':'')+
   (x.p.status==='hold'?'<span>검토 보류</span>':'')+
   '<span>내 ①~⑤ 출처 '+(x.ownSourceCount||0)+'/5</span>'+
   (x.draft?'<span>내 해설 초안 출처 '+(x.draftSourceCount||0)+'/5</span>':'')+
   '</div><div class="ck81-item-actions">'+
   '<label>내 진행 <select data-ck81-progress="'+esc(q.id)+'" aria-label="'+esc(q.id)+' 개인 검토 진행">'+
   option('backlog','대기',status)+option('researching','근거 확인 중',status)+
   option('hold','검토 보류',status)+option('ready','개인 대조 준비',status)+'</select></label>'+
   '<button type="button" data-ck81-pin="'+esc(q.id)+'" aria-pressed="'+x.p.bookmark+
   '">'+(x.p.bookmark?'★ 중요 해제':'☆ 중요 표시')+'</button>'+
   '<button type="button" data-ck81-open="'+esc(q.id)+'">문항 분석</button>'+
   '<button type="button" data-ck112-voice="'+esc(q.id)+'" aria-label="'+esc(q.id)+' 현재 설정으로 바로 듣기">▶ 바로 듣기</button>'+
   '<button type="button" data-ck81-edit="'+esc(q.id)+'">내 해설 편집</button>'+
   '<button type="button" data-ck81-choice-note="'+esc(q.id)+'">선지별 개인 근거</button>'+
   '<button type="button" data-ck81-prompt="'+esc(q.id)+'">대조 질문 복사</button>'+
   (paper?'<a class="ck81-paper" href="'+esc(paper)+'" target="_blank" rel="noopener noreferrer">시험지 PDF(외부)</a>':'')+
   (original?'<a class="ck81-paper" href="'+esc(original)+'" target="_blank" rel="noopener noreferrer">Q-Net 문제지 공고</a>':'')+
   (answer?'<a class="ck81-paper" href="'+esc(answer)+'" target="_blank" rel="noopener noreferrer">Q-Net 최종정답 공고</a>':'')+
   '</div></article>';
 }).join('')+'</div>';
}
function panel(){return root?.querySelector('[data-ck81-panel]');}
function message(text){
 statusMessage=text;
 const el=root?.querySelector('[data-ck81-status]');
 if(el)el.textContent=text;
}
let recentP4Input=null,recentP4Subset=[];
function recentP4Rows(items){
 if(items!==recentP4Input){recentP4Input=items;recentP4Subset=Array.isArray(items)?items.filter(x=>x?.q?.year>=2021&&x?.q?.year<=2025):[];}
 return recentP4Subset;
}
function render(){
 if(!shown||!panel())return;
 if(!rows){panel().innerHTML='<p role="status">등록 원문과 해설 목록을 확인 중입니다…</p>';return;}
 const data=enriched(rows),totals=summary(data),p4Rows=recentP4Rows(rows);
 const p4=window.CK159P4Review?.snapshot?.(rows);
 const p4Status=p4?.ready?
  '<section class="ck159-p4" aria-label="최근 5개년 공식 기출 원전 검수 우선순위">'+
  '<div class="ck159-p4-head"><strong>최근 5개년 400문항 · 원전 검수 우선순위</strong>'+
  '<small>위험도는 작업 순서용 키워드 분류입니다. 검수 완료/법리 판단이 아닙니다.</small></div>'+
  '<div class="ck159-p4-metrics"><span>특수정답 <b>'+p4.totals.special+'</b></span>'+
  '<span>법령·판례 <b>'+p4.totals.law+'</b></span>'+
  '<span>계산·수치 <b>'+p4.totals.calculation+'</b></span>'+
  '<span>기타 <b>'+p4.totals.other+'</b></span>'+
  '<span>원전 근거 검수 <b>'+p4.totals.sourceReviewed+'/400</b></span>'+
  '<span>선지별 검수 <b>'+p4.totals.optionReviewed+'/2000</b></span></div>'+
  '<p>공식 인정정답과 각 선지의 참/거짓은 별도 검토 대상입니다. 전문가 대조 없이 공식 해설로 게시하지 않습니다.</p>'+
  '<div class="ck159-p4-actions">'+
  '<button type="button" data-ck159-focus>특수정답 7건부터 보기</button>'+
  '<button type="button" data-ck159-p4-csv>400문항 원전 검수표 CSV</button>'+
  '<button type="button" data-ck159-p4-packet>우선 5문항 해설 대조 TXT</button></div></section>':
  '<section class="ck159-p4 ck159-p4-issue" role="status"><strong>P4 원전 검수표 준비 미완료</strong>'+
  '<p>최근 5개년 400문항과 해설 초안의 문항·정답 연결을 확인할 수 없습니다. 잘못된 대조표는 내보내지 않습니다.</p>'+
  '<p>'+esc((p4?.errors||['검수 모듈 로딩 전']).slice(0,4).join(' · '))+'</p></section>';
 const found=sortRows(matchingRows(data));
 const pages=Math.max(1,Math.ceil(found.length/view.pageSize));view.page=Math.min(pages-1,Math.max(0,view.page));
 const batch=found.slice(view.page*view.pageSize,(view.page+1)*view.pageSize);
 panel().innerHTML=
 '<p class="ck81-disclaimer"><strong>개인 검토 작업대 · 공식 검수 결과가 아닙니다.</strong> 입력 충실도는 내용의 정확성, 법령·판례 검증, 출제 빈도 검증을 뜻하지 않습니다. 공식 정답 800건은 변경하지 않습니다.</p>'+
 (legacyLoadError?'<p class="ck81-warning">2016~2020년 문제 자료 확인 중 오류: '+esc(legacyLoadError)+
  ' · 개인 작업 기록을 보호하고 있습니다. <button type="button" data-ck81-retry>원문 다시 불러오기</button></p>':'')+
 (loadErrors?'<p class="ck81-warning">최근 5개년 해설 파일 '+loadErrors+'개 연도를 새로 불러오지 못했습니다. 직전 정상 자료가 있으면 유지하며, 미확인 자료는 검증 완료로 표시하지 않습니다. <button type="button" data-ck81-retry>자료 다시 불러오기</button></p>':'')+
 '<dl class="ck81-totals">'+[
  ['10개년 공식 등록 문항',totals.total],['최근 5개년 해설 초안',totals.canonicalDraft],
  ['2016~2020 해설 미제공',totals.legacyUnseeded],
  ['내 초안',totals.personal],['내 초안 입력 8/8',totals.complete],
  ['내 선지 출처 기록',totals.personalOptionSources+'/4000'],
  ['내 해설 초안 출처',totals.draftOptionSources+'/4000'],
  ['출처 5/5 기록 문항',totals.personalSourceComplete],
  ['내 개인 대조 준비',totals.ready],['복습 대기',totals.due],
  ['공식 해설 근거 검수',totals.reasonReviewed],['선지 5개 출처 검수',totals.fullyOptionReviewed]
 ].map(([name,val])=>'<div><dt>'+esc(name)+'</dt><dd>'+esc(val)+'</dd></div>').join('')+'</dl>'+
 p4Status+(window.CK163PublicStudy?.panel?.(p4Rows)||'')+(window.CK160OptionUI?.panel?.(p4Rows)||'')+renderMatrix(data)+
 '<p class="ck81-disclaimer">개인 초안 입력 8/8은 출처 검증 완료를 의미하지 않으며 개인 출처는 별도 5/5로 확인합니다. 최근 5개년 미작성 해설 '+totals.unstarted+
  '건 · 과거 5개년 기본 해설 미제공 '+totals.legacyUnseeded+
  '건 · 유사도 0.90 미만 '+totals.lowText+'건 · 시각 검토 미완/표시 없음 '+
  totals.visualReviewMissing+'건. 기본 초안과 개인 검토 진행은 공식 근거 감수를 의미하지 않습니다.</p>'+
 '<div class="ck81-controls">'+
 '<label>연도 <select data-ck81-filter="year">'+option(0,'전체',view.year)+
 YEARS.map(y=>option(y,y+'년',view.year)).join('')+'</select></label>'+
 '<label>과목 <select data-ck81-filter="subject">'+option('all','전체',view.subject)+
 option('estate','학개론',view.subject)+option('civil','민법',view.subject)+'</select></label>'+
 '<label>상태 <select data-ck81-filter="stage">'+[
 ['all','전체'],['unstarted','기본 해설 미작성'],['draft','기본/개인 초안'],
 ['incomplete','내 초안 입력 미완'],['ready','내 개인 대조 준비'],['hold','검토 보류'],
 ['due','내 복습 대기'],['bookmark','중요 표시'],['special','복수·전원정답'],
 ['p4-special','P4 특수정답 1순위'],['p4-law','P4 법령·판례 2순위'],
 ['p4-calculation','P4 계산·수치 3순위'],['p4-other','P4 기타 원전대조 4순위'],
 ['not-reason-reviewed','공식 해설 근거 미검수'],['no-personal-source','내 선지 출처 미작성'],
  ['low-text','원문 유사도 0.90 미만'],['needs-source','시각/해설 대조 필요']
 ].map(([v,label])=>option(v,label,view.stage)).join('')+'</select></label>'+
 '<label>정렬 <select data-ck81-filter="sort">'+option('priority','중요·복습 우선',view.sort)+
 option('number','연도/번호순',view.sort)+option('progress','내 입력 많은 순',view.sort)+
 option('risk','검수 위험·복습 우선',view.sort)+
 option('source-priority','P4 원전대조 우선순위',view.sort)+'</select></label>'+
 '<label class="ck81-find">문제·선지 검색 <input type="search" data-ck81-search maxlength="120" value="'+esc(view.search)+
 '" placeholder="키워드 또는 문항 번호"></label>'+
 '</div><div class="ck100-research-tools"><label>묶음 개수 <select data-ck81-batch-size>'+
 [1,3,5].map(n=>option(n,n+'문항',researchBatch)).join('')+'</select></label>'+
 '<button type="button" data-ck81-batch-prompt'+(!batch.length?' disabled':'')+
 '>현재 페이지 상위 '+Math.min(researchBatch,batch.length)+'문항 출처 대조 질문 복사</button>'+
 '<button type="button" data-ck81-batch-queue'+(!batch.length?' disabled':'')+
 '>상위 '+Math.min(researchBatch,batch.length)+'문항 근거 확인 중으로 등록</button>'+
 '<button type="button" data-ck154-review-packet'+(!batch.length?' disabled':'')+
 '>상위 '+Math.min(researchBatch,batch.length)+'문항 해설·근거 대조 TXT</button>'+
 '<button type="button" data-ck112-packet-txt'+(!batch.length?' disabled':'')+
 '>현재 상위 '+Math.min(researchBatch,batch.length)+'문항 질문 TXT 저장</button>'+
 '<button type="button" data-ck112-voice-batch'+(!batch.length?' disabled':'')+
 '>▶ 상위 '+Math.min(researchBatch,batch.length)+'문항 연속 듣기</button>'+
 '<button type="button" data-ck112-voice-stop>■ 음성 정지</button>'+
 '<span>정답·해설은 자동 검증하거나 전송하지 않으며, 선택한 문항의 출처와 검수 상태를 복사합니다.</span></div>'+
 '<div class="ck81-pager"><strong>표시 '+found.length+'건 · '+(view.page+1)+'/'+pages+'쪽</strong>'+
 '<button type="button" data-ck81-page="prev"'+(view.page===0?' disabled':'')+'>이전</button>'+
 '<button type="button" data-ck81-page="next"'+(view.page===pages-1?' disabled':'')+'>다음</button></div>'+
 renderRows(batch)+
 '<div class="ck81-footer"><button type="button" data-ck81-export="csv">현재 목록 CSV</button>'+
 '<button type="button" data-ck81-export="json">내 진행 JSON 백업</button>'+
 '<button type="button" data-ck81-import>내 진행 JSON 복원</button>'+
 '<input type="file" accept=".json,application/json" data-ck81-file hidden>'+
 '<button type="button" data-ck81-clear-filters>필터 초기화</button>'+
 '<span data-ck81-status role="status">'+esc(statusMessage)+'</span></div>'+
 '<p class="ck81-safety">내 해설 내용은 기존 개인 편집기에 저장됩니다. 이 작업대는 진행 순서와 중요 표지만 별도로 저장하며, 공식 문제·정답·법령 및 공개 해설을 수정하지 않습니다.</p>';
}

/* v103: preserve personal-tool DOM in a compact dock instead of prepending to the header. */
const TOOL_DOCK_IDS=['ck76-search','ck79-review','ck81-workbench','ck111-review-queue','ck83-link-tools','ck83-analytics','ck84-materials'];
function ensureToolsDock(){
 const main=document.getElementById('main'),body=document.body;
 if(!main||!body||typeof body.append!=='function')return null;
 let dock=document.getElementById('ck103-tools-dock');
 if(!dock){
  dock=document.createElement('details');
  dock.id='ck103-tools-dock';dock.className='ck103-tools-dock';
  dock.innerHTML='<summary aria-label="학습 검증 및 자료 도구">검증·자료</summary>'+
   '<div class="ck103-tools-content" role="region" aria-label="학습 자료 및 분석 도구"></div>';
  body.append(dock);
  document.addEventListener('pointerdown',event=>{
   if(dock.open&&!dock.contains(event.target))dock.open=false;
  },true);
  if(window.MutationObserver)new MutationObserver(changes=>{
   if(changes.some(change=>change.target?.getAttribute?.('aria-expanded')==='true'))dock.open=true;
  }).observe(dock,{subtree:true,attributes:true,attributeFilter:['aria-expanded']});
 }
 
const content=dock.querySelector('.ck103-tools-content');
if(content&&!content.querySelector('.ck170-qa-hub')){
 const nav=document.createElement('section');nav.className='ck170-qa-hub';
 nav.setAttribute('aria-label','수기 검증 바로가기');
 nav.innerHTML='<div class="ck170-qa-header"><strong>검증센터 · 바로 시작</strong><small>공식·전문가 검수와 구분</small></div>'+
 '<p>아래 항목을 누르면 바로 검사 화면이 열립니다.</p>'+
 '<div class="ck170-qa-actions">'+
 '<button type="button" data-ck170-action="study">① 기출 400문항 해설</button>'+
 '<button type="button" data-ck170-action="options">② 선지 2,000개 검토</button>'+
 '<button type="button" data-ck170-action="offline">③ 오프라인 상태 검사</button>'+
 '<button type="button" data-ck170-action="manual">④ 수기 PASS/FAIL 기록</button></div>'+
 '<div class="ck170-qa-footer"><button type="button" data-ck170-action="all">전체 자료 메뉴</button>'+
 '<span data-ck170-status role="status" aria-live="polite">검사 선택 전 · 직접 확인한 결과만 PASS로 기록하세요.</span></div>';
 content.prepend(nav);
}
return content;
}
function alignToolsDock(){
 const content=ensureToolsDock();
 if(!content)return;
 for(const id of TOOL_DOCK_IDS){
  const node=document.getElementById(id);
  if(node&&node.parentElement!==content)content.append(node);
 }
}

function mount(){
 const host=document.getElementById('main');if(!host)return;
 const existing=document.getElementById('ck81-workbench');
 if(existing){root=existing;alignToolsDock();return;}
 root=document.createElement('section');root.id='ck81-workbench';root.className='ck81-workbench';
 root.innerHTML='<div class="ck81-heading"><div><strong>해설 검토 작업대</strong><small>2016~2025 · 800문항 · 오프라인 개인 관리</small></div>'+
  '<button type="button" data-ck81-toggle aria-expanded="false">작업대 열기</button></div>'+
  '<div data-ck81-panel hidden></div>';
 const content=ensureToolsDock();
 if(content)content.append(root);
 else {
  const previous=document.getElementById('ck79-review')||document.getElementById('ck76-search');
  if(previous?.parentNode)previous.after(root);else host.prepend(root);
 }
 alignToolsDock();
}
function toggle(){
 shown=!shown;
 const button=root.querySelector('[data-ck81-toggle]');
 button.setAttribute('aria-expanded',String(shown));button.textContent=shown?'작업대 접기':'작업대 열기';
 panel().hidden=!shown;
 if(!shown)return;
 render();load().then(()=>{if(shown)render();}).catch(err=>{
  message('해설 목록을 읽는 데 실패했습니다: '+(err?.message||'원인 확인 필요'));
 });
}
function resetFilters(){
 Object.assign(view,{year:0,subject:'all',stage:'all',search:'',page:0,sort:'priority'});render();
}
function encodeCsvCell(value){
 let content=String(value??'').replace(/[\r\n]+/g,' ');
 if(/^[\s]*[=+\-@]/.test(content))content="'"+content;
 return '"'+content.replace(/"/g,'""')+'"';
}
function download(filename,text,mime){
 const blob=new Blob(['\uFEFF',text],{type:mime}),url=URL.createObjectURL(blob);
 const link=document.createElement('a');link.href=url;link.download=filename;
 document.body.appendChild(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),3000);
}
function exportCsv(){
 if(!rows)return;
 const data=sortRows(matchingRows(enriched(rows)));
 if(data.length>800){message('문항 개수 오류: CSV 다운로드를 중단했습니다.');return;}
 const titles=['문항ID','과목','연도','번호','기본 해설 상태','개인 초안 입력/8','개인 진행',
 '공식 해설 근거 검수','선지 5개 출처 검수','시각 검토','원문 유사도','검수 우선 점수',
  '중요 표시','복습 대기','특수정답 처리','문제'];
 const lines=[titles.map(encodeCsvCell).join(',')];
 data.forEach(x=>lines.push([
  x.q.id,SUBJECTS[x.q.subject],x.q.year,x.q.number,x.canonical,x.assess.done,x.p.status,
  x.reasonReviewed?'Y':'N',x.optionReviewed?'Y':'N',x.visualReviewed?'Y':'N',
  x.textScore===null?'미측정':x.textScore.toFixed(3),riskScore(x),x.p.bookmark?'Y':'N',x.isDue?'Y':'N',specialAnswer(x.q),x.q.question
 ].map(encodeCsvCell).join(',')));
 download('ConceptKnot_해설검토목록_'+new Date().toISOString().slice(0,10)+'.csv',
  lines.join('\r\n'),'text/csv;charset=utf-8');
 message('현재 필터에 해당하는 '+data.length+'건을 CSV로 저장했습니다.');
}
function exportJson(){
 download('ConceptKnot_개인검토진행_'+new Date().toISOString().slice(0,10)+'.json',
  JSON.stringify(local,null,2),'application/json;charset=utf-8');
 message('개인 진행·중요 표지만 백업했습니다. 개인 해설 본문은 기존 전체 백업에 포함됩니다.');
}
async function importJson(file){
 if(!file||file.size>1024*1024){message('JSON 파일을 확인하세요(최대 1MB).');return;}
 try{
  const parsed=JSON.parse((await file.text()).replace(/^\uFEFF/,''));
  const clean=sanitizeProgress(parsed);
  if(!clean)throw Error('지원하지 않는 개인 진행 백업 형식');
  const invalid=Object.keys(clean.records).some(id=>official()[id]?.verified!==true);
  if(invalid)throw Error('등록되지 않은 공식 문항 ID가 있습니다.');
  if(!window.CK102Restore?.records)throw Error('안전 복원 모듈을 사용할 수 없습니다.');
  const merged=window.CK102Restore.records(local.records,clean.records);
  if(!merged.changed){
   message('현재보다 새로운 개인 진행 기록이 없습니다. 기존 '+merged.preserved+'건을 유지했습니다.');return;
  }
  if(merged.overlap&&!window.confirm?.('기존 개인 진행 '+merged.overlap+'건과 겹칩니다. '+
   '백업이 더 새로운 '+merged.updated+'건만 갱신하고 '+merged.preserved+
   '건은 현재 기록을 보호합니다. 새 '+merged.added+'건을 추가할까요?'))return;
  if(!persist({...local,records:merged.merged}))throw Error('브라우저 저장공간 또는 다중 탭 변경');
  message('개인 진행: 새 '+merged.added+'건 · 갱신 '+merged.updated+
   '건 · 오래된/동일 '+merged.preserved+'건 유지 · 공식 해설 변경 없음.');
  render();
 }catch(err){message('복원 실패 · '+(err?.message||'JSON 오류'));}
}
async function openQuestion(id,editor,button){
 const q=official()[id];if(!q?.verified)return;
 try{
  if(typeof window.CK78Analysis?.open==='function'){
   const result=await window.CK78Analysis.open(q.year,q.number,button);
   if(result&&editor)document.querySelector('#ck78-analysis-dialog [data-ck80-toggle]')?.click();
  }else window.CK76Study?.openQuestion?.(q.year,q.number,q.subject);
 }catch(err){message('문항을 열지 못했습니다: '+(err?.message||'오류'));}
}
function copyPrompt(id){
 const q=official()[id];if(!q?.verified)return;
 const answer=specialAnswer(q)==='전원정답(채점 인정)'?
  '전원정답 채점 인정(5개 선지가 모두 참이라는 뜻이 아님)':
  '채점 인정 번호 '+(q.correct||[]).join(', ');
 const parts=['공인중개사 1차 '+q.year+'년 A형 '+q.number+'번 · '+(SUBJECTS[q.subject]||''),
  '공식 문제 원문과 최종 정답을 먼저 대조한 뒤, 시험 당시 법령·판례·계산 근거를 각각 검증하세요.',
  '문제: '+q.question,
  ...(q.options||[]).map((value,i)=>(i+1)+') '+value),
  '정답 처리: '+answer,
  '요청: 선택지 각각의 참/거짓 근거, 법조문/판례/기준시점, 예외, 혼동 지점을 출처와 함께 분리해 분석해 주세요.',
  '주의: 이 질문 자체는 검증된 해설이 아닙니다. 복수·전원정답은 선지 진위와 구별하세요.'];
 const text=parts.join('\n');
 const fallback=()=>{
  let field=root.querySelector('[data-ck81-manual-copy]');
  if(!field){field=document.createElement('textarea');field.dataset.ck81ManualCopy='1';field.rows=5;field.className='ck81-copy-box';panel().append(field);}
  field.value=text;field.focus();field.select();message('클립보드 권한이 없으면 아래 선택된 내용을 직접 복사하세요.');
 };
 if(navigator.clipboard?.writeText)navigator.clipboard.writeText(text).then(
  ()=>message('문항 원문·선지·검토 질문이 복사되었습니다.'),fallback);
 else fallback();
}

async function openP4Review(section){
 mount();const dock=document.getElementById('ck103-tools-dock');
 if(dock)dock.open=true;
 if(!shown)toggle();
 await load();
 if(!shown)return false;
 render();
 const block=panel()?.querySelector(section==='study'?'.ck163-publish':'.ck160-option-panel');
 if(!block||block.classList.contains('ck163-error')||block.classList.contains('ck160-option-error'))return false;
 const control=block.querySelector(section==='study'?'[data-ck163-toggle]':'[data-ck160-toggle]');
 if(!control)return false;
 if(control.getAttribute('aria-expanded')!=='true')control.click();
 return true;
}
function showValidationView(mode){
 const dock=document.getElementById('ck103-tools-dock');if(!dock)return;
 dock.open=true;dock.dataset.ck170View=mode;
 for(const button of dock.querySelectorAll('[data-ck170-action]'))
  button.setAttribute('aria-pressed',String(button.dataset.ck170Action===mode));
 const area=dock.querySelector('.ck103-tools-content');if(area)area.scrollTop=0;
}
function validationStatus(value){
 const target=document.querySelector('#ck103-tools-dock [data-ck170-status]');
 if(target)target.textContent=value;
}
document.addEventListener('click',async event=>{
 const target=event.target?.closest?.('[data-ck170-action]'),
  dock=document.getElementById('ck103-tools-dock');
 if(!target||!dock?.contains(target)||target.disabled)return;
 const action=target.dataset.ck170Action;
 if(!['study','options','offline','manual','all'].includes(action))return;
 target.disabled=true;showValidationView(action);
 try{
  if(action==='all'){validationStatus('모든 자료 도구를 표시했습니다. 위의 검사 버튼으로 바로 이동할 수 있습니다.');return;}
  if(action==='manual'){
   const ok=window.CK115QA?.open?.();
   validationStatus(ok?'수기검증표가 열렸습니다. 직접 조작한 항목만 PASS/FAIL로 표시하세요.':'수기검증표를 열 수 없습니다. 새로고침 후 다시 시도하세요.');
   return;
  }
  if(action==='offline'){
   const api=window.CK88Diagnostics;
   if(!api?.offlineHealth||!api?.controllerCacheInfo){validationStatus('오프라인 검사 모듈을 읽지 못했습니다. 새로고침 후 다시 시도하세요.');return;}
   validationStatus('현재 기기의 서비스워커와 파일 캐시를 읽는 중입니다.');
   const controller=await api.controllerCacheInfo(),active=controller?.cache===api.OFFLINE_CACHE;
   const result=await api.offlineHealth(window.caches,active);
   if(!result?.supported){validationStatus('브라우저가 캐시 읽기를 지원하지 않습니다.');return;}
   if(!result.installed){validationStatus('최신 오프라인 캐시가 없습니다. 온라인 새로고침 후 다시 검사하세요.');return;}
   validationStatus('파일 확인 · 필수 '+result.cached+'/'+result.required+
    ' · P4 '+result.p4Cached+'/'+result.p4Required+
    ' · '+(active?'현재 서비스워커 적용':'구형/미확인 서비스워커')+
    ' · '+(result.p4Ready?'P4 자산 준비':'P4 업데이트/누락 확인 필요')+
    ' · 실제 오프라인 조작은 ④에서 직접 검증하세요.');
   return;
  }
  validationStatus('기출 데이터를 불러오는 중입니다...');
  const ok=await openP4Review(action);
  validationStatus(ok?(action==='study'?'400문항 해설을 열었습니다. 연도·과목을 선택하세요.':'2,000선지 검토 화면을 열었습니다. 연도·과목을 선택하세요.')+
   ' 자동 구조검사와 공식·전문가 감수는 다릅니다.':'최근 5개년 자료 연결을 확인할 수 없습니다. 아래 오류 안내를 확인하세요.');
 }catch(error){validationStatus('검사 실행 오류: '+String(error?.message||error).slice(0,160));}
 finally{target.disabled=false;}
});

document.addEventListener('click',event=>{
 const target=event.target.closest?.('[data-ck81-toggle],[data-ck81-matrix],[data-ck81-page],'+
  '[data-ck81-pin],[data-ck81-open],[data-ck81-edit],[data-ck81-choice-note],[data-ck81-prompt],'+
  '[data-ck159-focus],[data-ck159-p4-csv],[data-ck159-p4-packet],'+
  '[data-ck160-toggle],[data-ck160-csv],[data-ck160-txt],[data-ck161-ai-txt],[data-ck160-page],[data-ck160-personal],'+
  '[data-ck163-toggle],[data-ck163-page],[data-ck163-export],[data-ck163-open],'+
  '[data-ck81-export],[data-ck81-import],[data-ck81-clear-filters],[data-ck81-batch-prompt],[data-ck81-batch-queue],[data-ck154-review-packet],[data-ck112-packet-txt],[data-ck112-voice],[data-ck112-voice-batch],[data-ck112-voice-stop],[data-ck81-retry]');
 if(!target||!document.getElementById('ck81-workbench')?.contains(target))return;
 if(target.hasAttribute('data-ck81-toggle')){toggle();return;}
 if(target.hasAttribute('data-ck81-retry')){
  message('해설 자료를 다시 확인하는 중입니다.');
  load(true).then(()=>render()).catch(e=>message('자료 재확인 실패: '+(e?.message||e)));
  return;
 }
 if(target.matches?.('[data-ck160-toggle],[data-ck160-csv],[data-ck160-txt],[data-ck161-ai-txt],[data-ck160-page],[data-ck160-personal]')){
  const opened=id=>{
   if(!window.CK83Links?.openQuestion)throw Error('선지별 개인 근거 편집기 준비 전');
   const task=window.CK83Links.openQuestion(id);
   if(task?.catch)task.catch(error=>message('선지별 근거 편집 실패: '+String(error?.message||error)));
  };
  const res=window.CK160OptionUI?.clicked?.(target,recentP4Rows(rows),download,message,opened);
  if(res?.render)render();
  return;
 }
 if(target.matches?.('[data-ck163-toggle],[data-ck163-page],[data-ck163-export],[data-ck163-open]')){
  const res=window.CK163PublicStudy?.clicked?.(target,recentP4Rows(rows),download,message,(year,number,trigger)=>{
   const opened=window.CK78Analysis?.open?.(year,number,trigger);
   if(opened?.catch)opened.catch(error=>message('학습용 해설 문항 열기 실패: '+String(error?.message||error)));
  });
  if(res?.render)render();return;
 }
 if(target.hasAttribute('data-ck159-focus')){
  view.year=0;view.subject='all';view.stage='p4-special';
  view.sort='source-priority';view.page=0;render();return;
 }
 if(target.hasAttribute('data-ck159-p4-csv')){
  const result=window.CK159P4Review?.snapshot?.(rows);
  if(!result?.ready){message('400문항 원전 연결이 확인되지 않아 CSV 내보내기를 차단했습니다.');return;}
  const content=window.CK159P4Review.csv(result);
  if(!content){message('원전 검수 CSV 생성에 실패했습니다.');return;}
  download('ConceptKnot_P4_원전검수400문항_'+new Date().toISOString().slice(0,10)+'.csv',
   content,'text/csv;charset=utf-8');
  message('공식 인정정답·우선순위·선지 검수 상태가 포함된 400행 CSV를 생성했습니다. 전문가 판정은 미실시입니다.');
  return;
 }
 if(target.hasAttribute('data-ck159-p4-packet')){
  const result=window.CK159P4Review?.snapshot?.(rows);
  if(!result?.ready){message('400문항 원전 연결이 확인되지 않아 TXT 내보내기를 차단했습니다.');return;}
  const ids=result.rows.slice(0,5).map(x=>x.id);
  const content=window.CK159P4Review.packet(result,ids,5);
  if(!content){message('P4 대조 TXT를 생성하지 못했습니다.');return;}
  download('ConceptKnot_P4_우선5문항_근거대조_'+new Date().toISOString().slice(0,10)+'.txt',
   content,'text/plain;charset=utf-8');
  message('특수정답 우선 '+ids.length+'건의 공식 원문/해설 후보 대조 자료를 내보냈습니다. 검수 결과는 변경되지 않습니다.');
  return;
 }
 if(target.hasAttribute('data-ck81-matrix')){
  const [year,subject]=target.dataset.ck81Matrix.split('|');
  if(view.year===Number(year)&&view.subject===subject){view.year=0;view.subject='all';}
  else{view.year=Number(year);view.subject=subject;}
  view.page=0;render();return;
 }
 if(target.hasAttribute('data-ck81-page')){
  view.page+=target.dataset.ck81Page==='next'?1:-1;render();return;
 }
 if(target.hasAttribute('data-ck81-pin')){
  const id=target.dataset.ck81Pin;changeProgress(id,{bookmark:!Boolean(local.records[id]?.bookmark)});
  render();return;
 }
 if(target.hasAttribute('data-ck81-open')){openQuestion(target.dataset.ck81Open,false,target);return;}
 if(target.hasAttribute('data-ck81-edit')){openQuestion(target.dataset.ck81Edit,true,target);return;}
 if(target.hasAttribute('data-ck81-choice-note')){
  const id=target.dataset.ck81ChoiceNote;
  if(!window.CK83Links?.openQuestion){message('선지 근거 편집기가 준비되지 않았습니다.');return;}
  try{
   const opened=window.CK83Links.openQuestion(id);
   if(opened&&typeof opened.catch==='function')opened.catch(err=>message(
    '선지별 개인 근거를 열지 못했습니다: '+(err?.message||err)));
  }catch(err){message('선지별 개인 근거 오류: '+(err?.message||err));}
  return;
 }
 if(target.hasAttribute('data-ck112-voice-batch')){
  const shown=sortRows(matchingRows(enriched(rows||[])))
   .slice(view.page*view.pageSize,(view.page+1)*view.pageSize).slice(0,researchBatch);
  const ids=shown.map(x=>x.q.id);
  if(!ids.length){message('선택한 필터에 읽을 문항이 없습니다.');return;}
  const setting=window.CK76Voice?.getPreferences?.()||{},mode=
   ['qa','answer','all'].includes(setting.mode)?setting.mode:'qa';
  const result=window.CK76Voice?.playSelected?.(ids,mode);
  if(result?.ok)message('개인 검토 상위 '+result.items+'문항 연속 듣기 요청 · 실제 음성 출력을 기기에서 확인하세요.');
  else message(result?.reason==='incomplete-selection'?'일부 공식 원문이 로드되지 않아 연속 읽기를 시작하지 않았습니다.':
   result?.excluded&&!result?.missing?'전원정답 처리 문항은 정답 중심 듣기에서 제외됩니다. 전체 선지 모드로 변경하세요.':
   '문항 연속 재생을 시작하지 못했습니다. 음성 엔진과 공식 원문을 확인하세요.');
  return;
 }
 if(target.hasAttribute('data-ck112-voice-stop')){
  window.CK76Voice?.stop?.();message('음성 정지를 요청했습니다.');return;
 }
 if(target.hasAttribute('data-ck112-voice')){
  const id=target.dataset.ck112Voice,q=official()[id];
  if(!q?.verified){message('공식 문항이 준비되지 않았습니다. 원문을 다시 불러오세요.');return;}
  const settings=window.CK76Voice?.getPreferences?.()||{};
  const mode=['qa','answer','all'].includes(settings.mode)?settings.mode:'qa';
  const result=window.CK76Voice?.playOfficial?.(q.year,q.number,mode,'single');
  if(result?.ok)message('현재 설정('+mode+')으로 '+q.year+'년 '+q.number+'번 음성 재생 요청 · 기기에서 실제 소리를 확인하세요.');
  else message(q.correct.length===5&&mode!=='all'?
   '전원정답 처리 문항은 정답 중심 듣기에서 제외됩니다. 전체 5선지 모드로 변경하세요.':
   '문항 재생에 실패했습니다. 한국어 음성/AI 모델 또는 공식 원문 로딩을 확인하세요.');
  return;
 }
 if(target.hasAttribute('data-ck81-prompt')){copyPrompt(target.dataset.ck81Prompt);return;}
 if(target.hasAttribute('data-ck81-batch-queue')){
  const batch=sortRows(matchingRows(enriched(rows||[])))
   .slice(view.page*view.pageSize,(view.page+1)*view.pageSize)
   .slice(0,researchBatch).map(item=>item.q.id);
  const result=markResearchBatch(batch);
  message(!result.ok?(storageIssue||'개인 연구 목록 저장에 실패했습니다.'):
   result.count?'선택 '+result.count+'문항을 개인 근거 확인 중으로 일괄 기록했습니다.':
   '모두 이미 처리 중이거나 검토 보류/준비 상태여서 변경하지 않았습니다.');
  render();return;
 }
 if(target.hasAttribute('data-ck154-review-packet')){
  const selected=sortRows(matchingRows(enriched(rows||[])))
   .slice(view.page*view.pageSize,(view.page+1)*view.pageSize)
   .slice(0,researchBatch).map(x=>x.q.id);
  const content=draftReviewPacket(selected,rows,researchBatch);
  if(!content){message('현재 목록에 해설 초안이 있는 문항이 없습니다.');return;}
  download('ConceptKnot_미검수해설대조_'+new Date().toISOString().slice(0,10)+'.txt',
   content,'text/plain;charset=utf-8');
  message('학습용 초안과 공식 원문을 분리한 '+selected.length+'문항 대조표를 TXT로 저장했습니다. 검수 결과는 변경되지 않습니다.');
  return;
 }
 if(target.hasAttribute('data-ck112-packet-txt')){
  const batch=sortRows(matchingRows(enriched(rows||[])))
   .slice(view.page*view.pageSize,(view.page+1)*view.pageSize);
  const content=researchPacket(batch.slice(0,researchBatch).map(x=>x.q.id),rows,researchBatch);
  if(!content){message('출력할 공식 기출 문항이 없습니다.');return;}
  download('ConceptKnot_개인해설근거질문_'+new Date().toISOString().slice(0,10)+'.txt',
   content,'text/plain;charset=utf-8');
  message('미검수임을 표시한 '+Math.min(researchBatch,batch.length)+'문항 대조 질문을 TXT로 저장했습니다.');
  return;
 }
 if(target.hasAttribute('data-ck81-batch-prompt')){
  const batch=sortRows(matchingRows(enriched(rows||[])))
   .slice(view.page*view.pageSize,(view.page+1)*view.pageSize);
  const content=researchPacket(batch.slice(0,researchBatch).map(x=>x.q.id),rows,researchBatch);
  if(!content){message('공식 기출 목록이 비어 있어 대조 질문을 만들 수 없습니다.');return;}
  const fallback=()=>{
   let area=panel().querySelector('[data-ck81-manual-copy]');
   if(!area){area=document.createElement('textarea');area.dataset.ck81ManualCopy='1';
    area.className='ck81-copy-box';area.rows=9;panel().append(area);}
   area.value=content;area.focus();area.select();
   message('클립보드 사용이 제한되어 텍스트 상자에 선택된 질문을 표시했습니다.');
  };
  if(navigator.clipboard?.writeText)navigator.clipboard.writeText(content).then(
   ()=>message('대조용 '+Math.min(researchBatch,batch.length)+'문항 질문을 복사했습니다.'),fallback);
  else fallback();
  return;
 }
 if(target.dataset.ck81Export==='csv'){exportCsv();return;}
 if(target.dataset.ck81Export==='json'){exportJson();return;}
 if(target.hasAttribute('data-ck81-import')){panel().querySelector('[data-ck81-file]')?.click();return;}
 if(target.hasAttribute('data-ck81-clear-filters'))resetFilters();
});
document.addEventListener('change',event=>{
 const t=event.target;if(!root?.contains(t))return;
 if(t.matches?.('[data-ck81-filter]')){
  const key=t.dataset.ck81Filter;
  if(['year','subject','stage','sort'].includes(key)){
   view[key]=key==='year'?Number(t.value):t.value;view.page=0;render();
  }
 }
 if(window.CK160OptionUI?.changed?.(t)){render();return;}
 if(window.CK163PublicStudy?.changed?.(t)){render();return;}
 if(t.matches?.('[data-ck81-batch-size]')){researchBatch=[1,3,5].includes(Number(t.value))?Number(t.value):5;return;}
 if(t.matches?.('[data-ck81-progress]')){
  const id=t.dataset.ck81Progress;changeProgress(id,{status:t.value});render();
 }
 if(t.matches?.('[data-ck81-file]')){
  importJson(t.files?.[0]).finally(()=>{t.value='';});
 }
});
document.addEventListener('input',event=>{
 const t=event.target;if(!t.matches?.('[data-ck81-search]')||!root?.contains(t))return;
 view.search=t.value;view.page=0;
 clearTimeout(timer);timer=setTimeout(()=>{
  const pos=t.selectionStart??view.search.length;
  render();
  const next=root.querySelector('[data-ck81-search]');
  next?.focus();try{next?.setSelectionRange(pos,pos);}catch{}
 },150);
});
document.addEventListener('keydown',event=>{
 if(!shown||!root?.contains(event.target)||/INPUT|TEXTAREA|SELECT/.test(event.target?.tagName||''))return;
 if(!event.altKey||!['ArrowRight','ArrowLeft'].includes(event.key))return;
 event.preventDefault();
 view.page+=event.key==='ArrowRight'?1:-1;render();
});
window.addEventListener('ck:official-bank-ready',()=>{
 if(rows?.length<800){rows=null;if(shown)load().then(()=>render()).catch(()=>{});}
});
document.addEventListener('ck:personal-links-updated',()=>{if(shown)render();});
document.addEventListener('ck:personal-editor-updated',()=>{if(shown)render();});
window.addEventListener('storage',event=>{
 if(event.key===KEY){
  const parsed=readLocal();
  if(!storageIssue){local=parsed;if(shown){statusMessage='다른 탭에서 변경된 개인 진행 상태를 다시 읽었습니다.';render();}}
  else if(shown){statusMessage='다른 탭의 저장 기록이 올바르지 않습니다. 원본 보존을 위해 저장을 중단합니다.';render();}
 }else if([EDITOR,'recallgraph-first-exam-v1','ck82-exam-sessions-v1'].includes(event.key)&&shown){
  render();
 }
});
let scheduled=false;
function scheduleMount(){
 if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;mount();});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
const main=document.getElementById('main');
if(main&&window.MutationObserver)new MutationObserver(changes=>{
 if(!changes.some(x=>x.addedNodes.length))return;
 if(!document.getElementById('ck81-workbench'))scheduleMount();
 alignToolsDock();
}).observe(main,{subtree:true,childList:true});
window.CK81Workbench=Object.freeze({sanitizeProgress,assessDraft,specialAnswer,matchingRows,summary,
 riskScore,researchPacket,draftReviewPacket,dueIds,markResearchBatch,p4PriorityRecord,
 getState:()=>({shown,loaded:rows?.length||0,loadErrors,legacyLoadError,
  filters:{...view},progress:Object.keys(local.records).length,storageIssue}),
 open:()=>{mount();const dock=document.getElementById('ck103-tools-dock');if(dock)dock.open=true;if(!shown)toggle();}});
})();