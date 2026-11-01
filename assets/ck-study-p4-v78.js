/* ConceptKnot P4/P5: source-bound 800-question analysis viewer.
 * Canonical answers are immutable. Draft rationales never acquire "verified" status.
 * User notes reuse the existing local study state / backup. No external posting.
 */
(function(){
'use strict';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl=url=>/^https:\/\/(?:[\w.-]+)(?:\/|$)/.test(String(url||''))?String(url):'';
const years=new Map(),requests=new Map();
let dialog,trigger=null,selected=null,taxonomy=null;
const names={estate:'부동산학개론',civil:'민법 및 민사특별법'};
const typeNames={select_incorrect:'틀린 지문 찾기',select_correct:'옳은 지문 찾기',
 compound_statements:'ㄱ·ㄴ·ㄷ 진술 조합',calculation_or_numeric:'계산·수치 확인',
 legal_temporal_review:'시험연도 법령 확인',visual_original_check:'그림·표 원문 대조',
 multiple_accepted:'복수정답 인정',all_accepted:'전원정답 처리'};
function lookup(id){const q=window.RECALL_OFFICIAL?.[id];return q?.verified===true?q:null;}
async function dataFor(year){
 if(year<2021||year>2025)return null;
 if(years.has(year))return years.get(year);
 if(requests.has(year))return requests.get(year);
 const promise=fetch('./data/explanations/official-'+year+'.json',{cache:'force-cache'})
  .then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json()})
  .then(payload=>{
   if(payload.year!==year||payload.records?.length!==80)throw Error('해설 데이터 구조 불일치');
   const map=new Map(payload.records.map(x=>[x.questionId,x]));
   years.set(year,map);return map;
  }).finally(()=>requests.delete(year));
 requests.set(year,promise);return promise;
}
async function loadTaxonomy(){
 if(taxonomy)return taxonomy;
 try{const r=await fetch('./data/concept-taxonomy-v1.json',{cache:'force-cache'});
  if(r.ok){const j=await r.json();taxonomy=new Map(j.concepts.map(x=>[x.id,x]));return taxonomy;}
 }catch{}
 return new Map();
}
function modal(){
 if(dialog)return dialog;
 dialog=document.createElement('dialog');dialog.id='ck78-analysis-dialog';
 dialog.className='ck78-analysis-dialog';dialog.setAttribute('aria-labelledby','ck78-heading');
 dialog.addEventListener('click',e=>{
  if(e.target.closest?.('[data-ck78-close]'))dialog.close();
  else if(e.target===dialog)dialog.close();
 });
 dialog.addEventListener('close',()=>{trigger?.focus?.();trigger=null;selected=null});
 document.body.appendChild(dialog);
 return dialog;
}
function keyLabel(q){
 const nums=Array.isArray(q.correct)?q.correct:[];
 return nums.length===5?'전원정답 처리 (1~5번 모두 채점 인정, 모두 참이라는 뜻 아님)':
  nums.map(n=>'①②③④⑤'[Number(n)-1]||n).join(' 또는 ');
}
function related(q,entry){
 const candidate=entry?.candidateConcepts?.[0];
 if(!candidate?.word)return [];
 const keyword=String(candidate.word).normalize('NFKC').toLowerCase();
 const list=Object.values(window.RECALL_OFFICIAL||{}).filter(item=>
  item?.verified&&item.id!==q.id&&item.subject===q.subject&&
  (item.question+' '+item.options.join(' ')).normalize('NFKC').toLowerCase().includes(keyword));
 return list.slice(0,6);
}
function noteText(q){return String(window.CK78Study?.getNote?.(q.id)||'');}
function dialogHtml(q,entry,tx,missing=false){
 const status=entry?.quality?.status||'unstarted',all=q.correct?.length===5,
   multiple=q.correct?.length>1&&!all;
 const header=q.year+'년 '+q.number+'번 · '+(names[q.subject]||q.subject);
 const types=(entry?.questionType||[]).filter(x=>typeNames[x]).map(x=>typeNames[x]);
 const code=entry?.questionId||q.id;
 const draft=status==='draft',published=status==='published';
 const notes=entry?.notes||'';
 const source=safeUrl(q.originalUrl)||'https://www.q-net.or.kr/cst003.do?gId=08&gSite=L&id=cst00309';
 const reasonList=entry?.options||[];
 const candidates=(entry?.candidateConcepts||[]).slice(0,5).map(x=>
  '<span class="ck78-concept" title="자동 키워드 일치 · 검수 전">'+
  esc(tx.get(x.conceptId)?.label||x.word)+' · 후보</span>').join('');
 const similar=related(q,entry);
 return '<div class="ck78-modal-head"><div><small>공식 A형 · 문항 분석 · '+esc(draft?'학습용 해설 초안':'해설 검수 상태')+
  '</small><h2 id="ck78-heading">'+esc(header)+'</h2></div>'+
  '<button type="button" data-ck78-close aria-label="닫기">×</button></div>'+
  '<div class="ck78-modal-scroll">'+
  '<p class="ck78-status-line">최종정답: <strong>'+esc(keyLabel(q))+'</strong></p>'+
  (all||multiple?'<p class="ck78-warning">'+(all?
   '전원정답은 5개 선지가 모두 옳다는 뜻이 아닙니다. 채점 인정과 진위 판단은 분리해 확인하세요.':
   '복수정답으로 인정된 지문은 각각 독립적으로 근거를 검토하세요.')+'</p>':'')+
  '<section class="ck78-raw"><h3>공식 문제 · 원문 대조 필요</h3><p>'+esc(q.question)+'</p>'+
  '<ol class="ck78-options">'+q.options.map((value,i)=>{
   const recognized=q.correct.includes(i+1);
   const draftReason=reasonList[i]?.draftReason;
   return '<li><div><strong class="'+(recognized?'ck78-recognized':'')+'">'+
    '①②③④⑤'[i]+(recognized?' · 채점 인정':' · 채점 미인정')+'</strong>'+
    '<span>'+esc(value)+'</span></div>'+
    (draft&&draftReason?'<p>초안 설명 · 근거 검수 전: '+esc(draftReason)+'</p>':
     '<p>선지 판단 근거: 검수 전 · 자체 복습 메모로 보완</p>')+'</li>';
  }).join('')+'</ol></section>'+
  (draft?'<section class="ck78-draft"><h3>학습용 해설 초안 · 공식 검수 전</h3>'+
    '<p>'+esc(entry.summaryEasy||'')+'</p><p>'+esc(entry.answerReason||'')+'</p>'+
    (entry.traps?.length?'<p>혼동 포인트: '+esc(entry.traps[0].text)+'</p>':'')+
    '</section>':'<section class="ck78-empty"><p>이 문항은 해설 작성·법령·판례 검수가 완료되지 않았습니다. 아래 체크리스트와 메모로 학습을 진행하세요.</p></section>')+
  (missing?'<p class="ck78-warning">연도별 해설 파일을 불러오지 못했습니다. 공식 문제와 최종정답 표시만 사용할 수 있습니다.</p>':'')+
  '<section class="ck78-review"><h3>분석 및 검토 대상</h3>'+
  '<p>'+esc(types.length?types.join(' · '):'정답 근거 · 선지별 판단 · 시험 당시 법령 확인')+'</p>'+
  (notes?'<p>'+esc(notes)+'</p>':'')+
  (entry?.compoundStatements?.length?'<details><summary>ㄱ·ㄴ·ㄷ 원문 진술 '+entry.compoundStatements.length+'개 · 진위 미검수</summary>'+
   '<ol>'+entry.compoundStatements.map(x=>'<li>'+esc(x.key+' · '+x.sourceText)+'</li>').join('')+'</ol></details>':'')+
  (candidates?'<p>개념 연결 후보: '+candidates+'</p>':'<p>검수된 연결 개념은 아직 등록되지 않았습니다.</p>')+
  '<p class="ck78-review-disclaimer">해설 작성 '+(draft?'초안':'대기')+
  ' · 선지별 진위 검수 '+(entry?.quality?.optionVerdictsReviewed||0)+'/5 · 출제 빈도 검수 전 · 현행법과 시험연도 법령 별도 확인</p>'+
  '</section>'+
  '<section class="ck78-notes"><label for="ck78-personal-note">내 풀이·오답 원인 메모 (기존 학습 데이터에 저장)</label>'+
  '<textarea id="ck78-personal-note" maxlength="6000" rows="3" placeholder="근거를 직접 작성하세요.">'+esc(noteText(q))+'</textarea>'+
  '<div class="ck78-note-actions"><button type="button" data-ck78-note-save>메모 저장</button>'+
  '<button type="button" data-ck78-ai-copy>AI 해설 질문 복사</button>'+
  '<span data-ck78-status role="status"></span></div>'+
  '<textarea data-ck78-copy-fallback rows="4" hidden aria-label="AI 질문 수동 복사"></textarea></section>'+
  (similar.length?'<section class="ck78-related"><h3>원문 키워드 일치 · 유사 여부 미검수</h3>'+
   '<div>'+similar.map(p=>'<button type="button" data-ck78-open-question="'+esc(p.id)+'">'+
   p.year+'년 '+p.number+'번</button>').join('')+'</div></section>':'')+
  '<p class="ck78-modal-source"><a href="'+esc(source)+'" target="_blank" rel="noopener noreferrer">Q-Net 공식 원문 · 최신법 여부 별도 확인</a></p>'+
  '</div>'+
  '<footer class="ck78-modal-footer"><button data-ck78-prev type="button" '+(q.number<=1?'disabled':'')+'>← 이전 문항</button>'+
  '<button data-ck78-next type="button" '+(q.number>=80?'disabled':'')+'>다음 문항 →</button>'+
  '<button data-ck78-close type="button">닫기</button></footer>';
}
async function open(year,number,from){
 const id=Number(year)+'-'+Number(number),q=lookup(id);
 if(!q)return false;
 const el=modal();
 if(!el.open){trigger=from||document.activeElement;el.showModal();}
 selected=id;
 el.innerHTML='<p role="status" class="ck78-loading">공식 원문과 해설 검수 상태 확인 중…</p>'+
  '<button type="button" data-ck78-close>닫기</button>';
 let found=null,missing=false,tx=new Map();
 try{const values=await Promise.all([dataFor(q.year),loadTaxonomy()]);
  found=values[0]?.get(q.id)||null;tx=values[1];
 }catch(err){missing=true;}
 if(selected!==id||!el.open)return true;
 el.innerHTML=dialogHtml(q,found,tx,missing);
 el.dataset.ck78Current=id;
 el.querySelector('#ck78-heading')?.focus?.();
 return true;
}
function status(text){const node=dialog?.querySelector('[data-ck78-status]');if(node)node.textContent=text;}
function copyPrompt(){
 const q=lookup(selected);
 if(!q)return;
 const prompt=window.CK31Typing?.buildOfficialPrompt?.(q);
 if(!prompt?.text){status('현재 문항의 AI 질문 생성에 실패했습니다.');return;}
 if(typeof window.CK10?.openDock==='function'){
  window.CK10.openDock('chatgpt');
  const dock=document.getElementById('ck10-ai-question');if(dock)dock.value=prompt.text;
 }
 const fall=dialog.querySelector('[data-ck78-copy-fallback]');
 const fallback=()=>{if(!fall)return;fall.hidden=false;fall.value=prompt.text;fall.focus();fall.select();status('자동 복사가 안 되면 이 영역에서 수동 복사하세요.');};
 if(navigator.clipboard?.writeText){
  navigator.clipboard.writeText(prompt.text).then(()=>status('AI 질문 복사 완료. 선택한 AI 창에 붙여 넣으세요.'),fallback);
 }else{
  let ok=false;try{fall.hidden=false;fall.value=prompt.text;fall.select();ok=document.execCommand('copy');}catch{}
  if(ok){fall.hidden=true;status('AI 질문 복사 완료.');}else fallback();
 }
}
document.addEventListener('click',e=>{
 const button=e.target.closest?.('[data-ck30-analysis],[data-ck78-analysis]');
 if(button){
  e.preventDefault();e.stopImmediatePropagation();
  const y=Number(button.dataset.ck30Year||button.dataset.ck78Year);
  const n=Number(button.dataset.ck30Analysis||button.dataset.ck78Analysis);
  open(y,n,button);return;
 }
},true);
document.addEventListener('click',e=>{
 const target=e.target;
 if(!target?.closest)return;
 if(target.closest('[data-ck78-note-save]')){
  const q=lookup(selected),value=dialog?.querySelector('#ck78-personal-note')?.value;
  if(q&&window.CK78Study?.saveNote?.(q.id,value))status('내 학습 메모 저장됨 · 기존 백업에 포함');
  else status('저장 실패 · 브라우저 저장공간을 확인하세요.');
 }
 if(target.closest('[data-ck78-ai-copy]'))copyPrompt();
 if(target.closest('[data-ck78-prev],[data-ck78-next]')){
  const q=lookup(selected);if(!q)return;
  const direction=target.closest('[data-ck78-next]')?1:-1;
  if(q.number+direction>=1&&q.number+direction<=80)open(q.year,q.number+direction,trigger);
 }
 const jump=target.closest('[data-ck78-open-question]');
 if(jump){
  const q=lookup(jump.dataset.ck78OpenQuestion);
  if(q){dialog?.close();window.CK76Study?.openQuestion?.(q.year,q.number,q.subject);}
 }
 if(target.closest('[data-ck78-review-report]'))showReviewDashboard();
});
async function showReviewDashboard(){
 const el=modal();if(!el.open){trigger=document.activeElement;el.showModal();}
 selected='report';
 el.innerHTML='<p role="status">검수 현황 조회 중…</p><button data-ck78-close>닫기</button>';
 let report={questions:400,withCandidateMatches:0,parsedCompoundStatements:0,
   reviewStages:{unstarted:396,draft:4,published:0},verifiedOptionVerdicts:0,requiredOptionVerdicts:2000};
 try{const response=await fetch('./data/reports/analysis-candidates-v78.json',{cache:'force-cache'});
  if(response.ok)report=await response.json();
 }catch{}
 if(selected!=='report')return;
 const stages=report.reviewStages||{};
 el.innerHTML='<div class="ck78-modal-head"><h2 id="ck78-heading">기출 분석 · 검수 대시보드</h2>'+
  '<button data-ck78-close aria-label="닫기">×</button></div>'+
  '<div class="ck78-modal-scroll"><p>공식 원문 등록 <strong>800문항</strong> · 집중 검수 대상 <strong>'+
  Number(report.questions||400)+'</strong>문항 (2021~2025)</p>'+
  '<dl class="ck78-review-grid">'+[
   ['해설 미작성',stages.unstarted||0],['학습용 초안',stages.draft||0],
   ['검수·발행 완료',stages.published||0],['검증된 선지 판단',Number(report.verifiedOptionVerdicts||0)+' / '+Number(report.requiredOptionVerdicts||2000)],
   ['개념 키워드 후보 문항',report.withCandidateMatches||0],
   ['문제 원문에서 추출된 조합 진술',report.parsedCompoundStatements||0]
  ].map(([label,value])=>'<div><dt>'+esc(label)+'</dt><dd>'+esc(value)+'</dd></div>').join('')+'</dl>'+
  '<p>키워드 후보와 질문 유형은 자동 추출 값입니다. 검수된 출제 빈도, 법령 근거 또는 해설로 간주하지 않습니다.</p>'+
  '<p>최종 해설을 발행하려면 공식 문제지·선지·최종정답·시험연도 법령의 근거를 별도로 검증해야 합니다.</p></div>'+
  '<footer class="ck78-modal-footer"><button data-ck78-close>닫기</button></footer>';
}
let queued=false;
function decorate(){
 const source=document.querySelector('#main .registered-question .listen-controls');
 if(source&&!source.querySelector('[data-ck30-analysis],[data-ck78-analysis]')){
  const state=window.CK76Study?.getExam?.();
  if(state&&lookup(state.year+'-'+state.number)){
   const b=document.createElement('button');b.type='button';
   b.className='btn ck78-explain-trigger';b.dataset.ck78Analysis=String(state.number);
   b.dataset.ck78Year=String(state.year);b.textContent='문항 분석';
   source.appendChild(b);
  }
 }
 const header=document.querySelector('#ck76-search .ck76-search-head');
 if(header&&!header.querySelector('[data-ck78-review-report]')){
  const button=document.createElement('button');button.type='button';
  button.dataset.ck78ReviewReport='1';button.textContent='분석 검수 현황';header.appendChild(button);
 }
}
function schedule(){
 if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;decorate();});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',decorate,{once:true});else decorate();
const root=document.getElementById('main');
if(root&&window.MutationObserver)new MutationObserver(changes=>{
 if(changes.some(x=>Array.from(x.addedNodes).some(node=>node.nodeType===1&&
  (node.matches?.('.ck-v7-stage,.registered-question,#ck76-search')||
   node.querySelector?.('.registered-question,#ck76-search')))))schedule();
}).observe(root,{childList:true,subtree:true});
window.CK78Analysis=Object.freeze({open,showReviewDashboard,lookup,keyLabel,
 getStatus:()=>({status:selected||'idle',opened:Boolean(dialog?.open),loadedYears:[...years.keys()]})});
})();
