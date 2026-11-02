/* ConceptKnot v81 - offline P4 evidence workbench.
 * Canonical official answers and explanations are read-only.
 * Personal work readiness NEVER represents an official source/legal review.
 */
(function(){
'use strict';
const KEY='ck81-review-workbench-v1',EDITOR='ck80-explain-drafts-v1',MAX=400;
const VALID_STATUS=['backlog','researching','hold','ready'];
const YEARS=[2025,2024,2023,2022,2021];
const SUBJECTS={estate:'부동산학개론',civil:'민법 및 민사특별법'};
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=value=>String(value??'').normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
const isId=id=>/^202[1-5]-(?:[1-9]|[1-7]\d|80)$/.test(String(id||''));
const official=()=>window.RECALL_OFFICIAL||{};
let root=null,shown=false,rows=null,loading=null,loadErrors=0,local=readLocal(),statusMessage='',timer=null;
const view={year:0,subject:'all',stage:'all',search:'',page:0,pageSize:20,sort:'priority'};
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
let storageIssue='',lastRaw=undefined;
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
 const snap=window.CK79Study?.snapshot?.()||{},now=Date.now();
 const due=new Set(),mistakes=new Set();
 for(const [id,r] of Object.entries(snap.review||{})){
  if(isId(id)&&r&&Number(r.nextAt)>0&&Number(r.nextAt)<=now)due.add(id);
 }
 for(const mistake of Array.isArray(snap.mistakes)?snap.mistakes:[]){
  const id=String(mistake?.year||'')+'-'+String(mistake?.number||'');
  if(mistake?.type==='exam'&&!mistake.resolved&&isId(id)){
   mistakes.add(id);
   if(!(Number(snap.review?.[id]?.nextAt)>now))due.add(id);
  }
 }
 return {due,mistakes};
}
function catalog(){
 return Object.values(official()).filter(q=>q&&q.verified===true&&isId(q.id)&&
  Array.isArray(q.options)&&q.options.length===5).sort((a,b)=>b.year-a.year||a.number-b.number);
}
async function load(){
 if(rows)return rows;
 if(loading)return loading;
 loading=(async()=>{
  const found=catalog();
  const bundles=await Promise.allSettled(YEARS.map(year=>
   fetch('./data/explanations/official-'+year+'.json',{cache:'force-cache'})
    .then(response=>{if(!response.ok)throw Error('HTTP '+response.status);return response.json();})
    .then(data=>{if(Number(data.year)!==year||data.records?.length!==80)throw Error('80건 구조 불일치');return data.records;})
  ));
  const byId=new Map();loadErrors=0;
  bundles.forEach(result=>{
   if(result.status!=='fulfilled'){loadErrors++;return;}
   result.value.forEach(item=>{if(isId(item.questionId))byId.set(item.questionId,item);});
  });
  rows=found.map(q=>({q,entry:byId.get(q.id)||null}));
  return rows;
 })().finally(()=>{loading=null;});
 return loading;
}
function enriched(items,drafts=personalDrafts(),study=dueIds()){
 return items.map(item=>{
  const q=item.q,p=local.records[q.id]||{status:'backlog',bookmark:false,updatedAt:0};
  const draft=drafts[q.id],assess=assessDraft(draft);
  return {...item,p,draft,assess,isDue:study.due.has(q.id),isMistake:study.mistakes.has(q.id),
   canonical:item.entry?.quality?.status||'unavailable'};
 });
}
function matchingRows(items,filters=view){
 const terms=norm(filters.search).split(' ').filter(Boolean);
 return items.filter(x=>{
  const q=x.q,stage=filters.stage||'all';
  if(filters.year&&Number(filters.year)!==q.year)return false;
  if(filters.subject!=='all'&&filters.subject!==q.subject)return false;
  if(stage==='unstarted'&&!(x.canonical==='unstarted'&&!x.draft))return false;
  if(stage==='draft'&&!(x.canonical==='draft'||x.draft))return false;
  if(stage==='incomplete'&&!(x.draft&&x.assess.done<8))return false;
  if(stage==='ready'&&x.p.status!=='ready')return false;
  if(stage==='hold'&&x.p.status!=='hold')return false;
  if(stage==='due'&&!x.isDue)return false;
  if(stage==='bookmark'&&!x.p.bookmark)return false;
  if(stage==='special'&&specialAnswer(q)==='일반')return false;
  if(terms.length){
   const text=norm(q.id+' '+q.question+' '+q.options.join(' '));
   if(!terms.every(t=>text.includes(t)))return false;
  }
  return true;
 });
}
function sortRows(items,sort=view.sort){
 const sorted=items.slice();
 if(sort==='number')sorted.sort((a,b)=>a.q.year-b.q.year||a.q.number-b.q.number);
 else if(sort==='progress')sorted.sort((a,b)=>b.assess.done-a.assess.done||b.q.year-a.q.year||a.q.number-b.q.number);
 else sorted.sort((a,b)=>Number(b.p.bookmark)-Number(a.p.bookmark)||Number(b.isDue)-Number(a.isDue)||
  b.q.year-a.q.year||a.q.number-b.q.number);
 return sorted;
}
function summary(items){
 const counts={total:items.length,canonicalDraft:0,unstarted:0,personal:0,complete:0,
  ready:0,hold:0,due:0,bookmarked:0,missing:0,reviewed:0};
 items.forEach(x=>{
  if(x.canonical==='draft')counts.canonicalDraft++;
  if(x.canonical==='unstarted')counts.unstarted++;
  if(x.canonical==='unavailable')counts.missing++;
  if(x.draft)counts.personal++;
  if(x.draft&&x.assess.done===8)counts.complete++;
  if(x.p.status==='ready')counts.ready++;
  if(x.p.status==='hold')counts.hold++;
  if(x.p.bookmark)counts.bookmarked++;
  if(x.isDue)counts.due++;
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
   ' · 기본 초안 '+sub.filter(x=>x.canonical==='draft').length+'</span></button>';
 }).join('')).join('')+'</div>';
}
function renderRows(items){
 if(!items.length)return '<p class="ck81-empty">조건에 맞는 문항이 없습니다. 필터를 변경하세요.</p>';
 return '<div class="ck81-row-list">'+items.map(x=>{
  const q=x.q,canonical=x.canonical==='draft'?'기본 해설 초안':x.canonical==='unstarted'?
   '기본 해설 미작성':'해설 파일 확인 필요';
  const status=local.records[q.id]?.status||'backlog';
  const verdict=x.draft?' · 내 초안 '+x.assess.done+'/8':'';
  const question=String(q.question||'').replace(/\s+/g,' ').slice(0,170);
  return '<article class="ck81-item" data-ck81-id="'+esc(q.id)+'">'+
   '<div class="ck81-item-top"><strong>'+q.year+'년 '+q.number+'번 · '+esc(SUBJECTS[q.subject])+
   '</strong><span>'+esc(canonical)+esc(verdict)+'</span></div>'+
   '<p>'+esc(question)+'</p>'+
   '<div class="ck81-tags">'+
   (x.isDue?'<span>복습 예정</span>':'')+(x.isMistake?'<span>내 오답</span>':'')+
   (specialAnswer(q)!=='일반'?'<span>'+esc(specialAnswer(q))+'</span>':'')+
   (x.p.status==='ready'?'<span>개인 대조 준비 · 미검수</span>':'')+
   (x.p.status==='hold'?'<span>검토 보류</span>':'')+
   '</div><div class="ck81-item-actions">'+
   '<label>내 진행 <select data-ck81-progress="'+esc(q.id)+'" aria-label="'+esc(q.id)+' 개인 검토 진행">'+
   option('backlog','대기',status)+option('researching','근거 확인 중',status)+
   option('hold','검토 보류',status)+option('ready','개인 대조 준비',status)+'</select></label>'+
   '<button type="button" data-ck81-pin="'+esc(q.id)+'" aria-pressed="'+x.p.bookmark+
   '">'+(x.p.bookmark?'★ 중요 해제':'☆ 중요 표시')+'</button>'+
   '<button type="button" data-ck81-open="'+esc(q.id)+'">문항 분석</button>'+
   '<button type="button" data-ck81-edit="'+esc(q.id)+'">내 해설 편집</button>'+
   '<button type="button" data-ck81-prompt="'+esc(q.id)+'">대조 질문 복사</button>'+
   '</div></article>';
 }).join('')+'</div>';
}
function panel(){return root?.querySelector('[data-ck81-panel]');}
function message(text){
 statusMessage=text;
 const el=root?.querySelector('[data-ck81-status]');
 if(el)el.textContent=text;
}
function render(){
 if(!shown||!panel())return;
 if(!rows){panel().innerHTML='<p role="status">등록 원문과 해설 목록을 확인 중입니다…</p>';return;}
 const data=enriched(rows),totals=summary(data);
 const found=sortRows(matchingRows(data));
 const pages=Math.max(1,Math.ceil(found.length/view.pageSize));view.page=Math.min(pages-1,Math.max(0,view.page));
 const batch=found.slice(view.page*view.pageSize,(view.page+1)*view.pageSize);
 panel().innerHTML=
 '<p class="ck81-disclaimer"><strong>개인 검토 작업대 · 공식 검수 결과가 아닙니다.</strong> 입력 충실도는 내용의 정확성, 법령·판례 검증, 출제 빈도 검증을 뜻하지 않습니다. 공식 정답 800건은 변경하지 않습니다.</p>'+
 (loadErrors?'<p class="ck81-warning">해설 파일 '+loadErrors+'개 연도를 불러오지 못했습니다. 해당 문항은 상태를 추정하지 않습니다.</p>':'')+
 '<dl class="ck81-totals">'+[
  ['최근 5개년 기출',totals.total],['기본 해설 초안',totals.canonicalDraft],
  ['내 초안',totals.personal],['내 초안 입력 8/8',totals.complete],
  ['내 개인 대조 준비',totals.ready],['복습 대기',totals.due]
 ].map(([name,val])=>'<div><dt>'+esc(name)+'</dt><dd>'+esc(val)+'</dd></div>').join('')+'</dl>'+
 renderMatrix(data)+
 '<div class="ck81-controls">'+
 '<label>연도 <select data-ck81-filter="year">'+option(0,'전체',view.year)+
 YEARS.map(y=>option(y,y+'년',view.year)).join('')+'</select></label>'+
 '<label>과목 <select data-ck81-filter="subject">'+option('all','전체',view.subject)+
 option('estate','학개론',view.subject)+option('civil','민법',view.subject)+'</select></label>'+
 '<label>상태 <select data-ck81-filter="stage">'+[
 ['all','전체'],['unstarted','기본 해설 미작성'],['draft','기본/개인 초안'],
 ['incomplete','내 초안 입력 미완'],['ready','내 개인 대조 준비'],['hold','검토 보류'],
 ['due','내 복습 대기'],['bookmark','중요 표시'],['special','복수·전원정답']
 ].map(([v,label])=>option(v,label,view.stage)).join('')+'</select></label>'+
 '<label>정렬 <select data-ck81-filter="sort">'+option('priority','중요·복습 우선',view.sort)+
 option('number','연도/번호순',view.sort)+option('progress','내 입력 많은 순',view.sort)+'</select></label>'+
 '<label class="ck81-find">문제·선지 검색 <input type="search" data-ck81-search maxlength="120" value="'+esc(view.search)+
 '" placeholder="키워드 또는 문항 번호"></label>'+
 '</div><div class="ck81-pager"><strong>표시 '+found.length+'건 · '+(view.page+1)+'/'+pages+'쪽</strong>'+
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
function mount(){
 const host=document.getElementById('main');if(!host)return;
 const existing=document.getElementById('ck81-workbench');
 if(existing){root=existing;return;}
 root=document.createElement('section');root.id='ck81-workbench';root.className='ck81-workbench';
 root.innerHTML='<div class="ck81-heading"><div><strong>해설 검토 작업대</strong><small>2021~2025 · 400문항 · 오프라인 개인 관리</small></div>'+
  '<button type="button" data-ck81-toggle aria-expanded="false">작업대 열기</button></div>'+
  '<div data-ck81-panel hidden></div>';
 const previous=document.getElementById('ck79-review')||document.getElementById('ck76-search');
 if(previous?.parentNode)previous.after(root);else host.prepend(root);
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
 const titles=['문항ID','과목','연도','번호','기본 해설 상태','개인 초안 입력/8','개인 진행',
  '중요 표시','복습 대기','특수정답 처리','문제'];
 const lines=[titles.map(encodeCsvCell).join(',')];
 data.forEach(x=>lines.push([
  x.q.id,SUBJECTS[x.q.subject],x.q.year,x.q.number,x.canonical,x.assess.done,
  x.p.status,x.p.bookmark?'Y':'N',x.isDue?'Y':'N',specialAnswer(x.q),x.q.question
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
  const overlap=Object.keys(clean.records).filter(id=>local.records[id]).length;
  if(overlap&&!window.confirm?.('기존 개인 진행 '+overlap+'건이 교체됩니다. 계속할까요?'))return;
  const next={...local,records:{...local.records,...clean.records}};
  if(!persist(next))throw Error('브라우저 저장공간 또는 쓰기 권한 부족');
  message('개인 진행 '+Object.keys(clean.records).length+'건 복원 완료 · 공식 해설은 변경되지 않았습니다.');
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
document.addEventListener('click',event=>{
 const target=event.target.closest?.('[data-ck81-toggle],[data-ck81-matrix],[data-ck81-page],'+
  '[data-ck81-pin],[data-ck81-open],[data-ck81-edit],[data-ck81-prompt],'+
  '[data-ck81-export],[data-ck81-import],[data-ck81-clear-filters]');
 if(!target||!document.getElementById('ck81-workbench')?.contains(target))return;
 if(target.hasAttribute('data-ck81-toggle')){toggle();return;}
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
 if(target.hasAttribute('data-ck81-prompt')){copyPrompt(target.dataset.ck81Prompt);return;}
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
let scheduled=false;
function scheduleMount(){
 if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;mount();});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
const main=document.getElementById('main');
if(main&&window.MutationObserver)new MutationObserver(changes=>{
 if(!document.getElementById('ck81-workbench')&&changes.some(x=>x.addedNodes.length))scheduleMount();
}).observe(main,{subtree:true,childList:true});
window.CK81Workbench=Object.freeze({sanitizeProgress,assessDraft,specialAnswer,matchingRows,summary,
 getState:()=>({shown,loaded:rows?.length||0,loadErrors,filters:{...view},progress:Object.keys(local.records).length,storageIssue}),
 open:()=>{mount();if(!shown)toggle();}});
})();