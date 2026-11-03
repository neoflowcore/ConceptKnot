/* v88 personal data diagnostics — read-only until explicit download. */
(function(){
'use strict';
const items=[['recallgraph-first-exam-v1','학습기록'],['ck10-exam-final-v1','최종 정리본'],['ck11-final-page-count','정리본 페이지'],['ck80-explain-drafts-v1','개인 해설'],['ck81-review-workbench-v1','해설 작업대'],['ck82-exam-sessions-v1','실전 기록'],['ck83-personal-concept-links-v1','개념 연결'],['ck84-study-plan-v1','학습계획'],['ck84-personal-materials-v1','개인 교재']];
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
    'ck80-explain-drafts-v1':()=>Object.entries(data).length<=400&&
      Object.entries(data).every(([id,v])=>/^202[1-5]-(?:[1-9]|[1-7]\d|80)$/.test(id)&&
        v&&typeof v==='object'&&!Array.isArray(v)),
    'ck81-review-workbench-v1':()=>window.CK81Workbench?.sanitizeProgress?.(data),
    'ck82-exam-sessions-v1':()=>window.CK82FullExam?.cleanStore?.(data),
    'ck83-personal-concept-links-v1':()=>window.CK83Links?.sanitize?.(data),
    'ck84-study-plan-v1':()=>window.CK84Plan?.sanitize?.(data),
    'ck84-personal-materials-v1':()=>window.CK84Materials?.sanitize?.(data)
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
 const data={schemaVersion:1,kind:'raw-recovery-only-not-direct-import',capturedAt:new Date().toISOString(),records:{}};
 for(const [key] of items){try{data.records[key]=localStorage.getItem(key);}catch{data.records[key]=null;}}
 const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='ConceptKnot_원본복구용_'+new Date().toISOString().slice(0,10)+'.json';
 document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
}
let root=null;
function render(){
 if(!root)return;
 const wasOpen=root.querySelector('.ck88-review-queue')?.open===true;
 const matrixOpen=root.querySelector('.ck88-audit-matrix')?.open===true;
 const values=inspect(),problem=values.filter(x=>x.status==='invalid'),quality=bankQuality(),queue=visualQueue({year:queueYear,mode:queueMode});
 root.querySelector('[data-v88-body]').innerHTML='<p>읽기 전용 검사 · 데이터를 초기화하거나 수정하지 않습니다. 손상 기록은 복원 전 원본을 보존하세요.</p>'+
 '<p><strong>공식 기출 등록 구조: '+quality.structured+'/'+quality.total+'문항</strong> · 10개년 목표 800문항 · 시각 검토 명시 '+quality.visualReviewed+'건 / 미검토 표시 '+quality.visualUnreviewed+'건 / 표시 없음 '+quality.visualUnknown+'건</p>'+
 '<p>복수 인정 '+quality.multikey+'건(전원정답 '+quality.allAccepted+'건 포함) · OCR/텍스트 유사도 0.90 미만 '+quality.lowTextSimilarity+'건 · 점수 미기재 '+quality.missingTextSimilarity+'건. 낮은 유사도는 자동 오류 판정이 아닌 원문 대조 우선순위입니다.</p>'+
 '<p>구조 등록·채점 인정은 선지별 법령/원문 전문가 검수 완료와 다릅니다.</p>'+
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
function mount(){
 const exists=document.getElementById('ck88-data-diagnostics');if(exists){root=exists;return;}
 const host=document.getElementById('main');if(!host)return;
 root=document.createElement('section');root.id='ck88-data-diagnostics';root.className='ck88-diagnostics';
 root.innerHTML='<div class="ck88-head"><strong>내 학습 데이터 안전 점검</strong><button type="button" data-v88-refresh>진단 새로고침</button>'+
 '<button type="button" data-v88-raw>9종 원본 백업 내려받기</button></div><div data-v88-body></div>';
 host.append(root);render();
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
window.CK88Diagnostics=Object.freeze({inspect,bankQuality,visualQueue,exportVisualQueue,loadOlderYear,mount,reviewRows,reviewMatrix,csvCell,makeReviewCsv,exportReviewCsv});
})();