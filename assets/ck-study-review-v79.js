/* P5 v79: personal spaced-recall and honest, candidate-only taxonomy browser.
 * All review progress persists in main ConceptKnot JSON backup via CK79Study.
 */
(function(){
'use strict';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const index=()=>window.RECALL_OFFICIAL||{};
const valid=id=>index()[id]?.verified===true;
const shortQuestion=q=>String(q?.question||'').replace(/\s+/g,' ').slice(0,145);
let open=false,candidates=null,occurrences=null,loading=null,selectedConcept='',subject='all',query='',revealed=new Set(),tab='review',scheduled=false,page=0;
const PAGE_SIZE=24;
const labels={estate:'학개론',civil:'민법'};
const now=()=>Date.now();
const fmt=date=>new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(date));
function localReview(){
 const data=window.CK79Study?.snapshot?.()||{mistakes:[],review:{},scores:{},typing:[]};
 return {mistakes:Array.isArray(data.mistakes)?data.mistakes:[],
  review:data.review&&typeof data.review==='object'?data.review:{},
  scores:data.scores||{},notes:data.notes||{}};
}
function dueReport(){
 const data=localReview();
 return window.CK86ExamBridge?.getDue?.({reviews:data.review,mistakes:data.mistakes,subject})||
  {rows:[],futureRows:[],cleared:[],due:0,future:0,latestCount:0};
}
function dueRows(){return dueReport().rows;}
function mount(){
 const search=document.getElementById('ck76-search'),host=search?.parentNode||document.querySelector('#main');
 if(!host||document.getElementById('ck79-review'))return;
 const node=document.createElement('section');node.id='ck79-review';node.className='ck79-review';
 node.innerHTML='<div class="ck79-review-head"><strong>개념·오답 인출 복습</strong>'+
  '<button type="button" data-ck79-toggle aria-expanded="false">복습 열기</button></div>'+
  '<div data-ck79-body hidden></div>';
 if(search)search.after(node);else host.prepend(node);
}
function row(q,id,reason,review){
 const recognized=q.correct.length===5?'전원정답 채점 인정 · 선지별 진위 별도 검토':
  q.correct.length>1?'복수정답 인정 · '+q.correct.join(' / '):'1개 정답';
 return '<article class="ck79-card" data-ck79-id="'+esc(id)+'">'+
  '<div><small>'+q.year+'년 '+q.number+'번 · '+labels[q.subject]+' · '+esc(reason)+
  (review?.nextAt?' · '+fmt(review.nextAt):'')+'</small><p>'+esc(shortQuestion(q))+'</p></div>'+
  '<div class="ck79-actions"><button type="button" data-ck79-show="'+esc(id)+'">'+(revealed.has(id)?'정답 가리기':'정답 확인')+'</button>'+
  '<button type="button" data-ck79-mark="again" data-ck79-id="'+esc(id)+'">짧게 재복습</button>'+
  '<button type="button" data-ck79-mark="remember" data-ck79-id="'+esc(id)+'">기억했음</button>'+
  '<button type="button" data-ck79-open="'+esc(id)+'">원문 보기</button>'+
  '<button type="button" data-ck79-edit="'+esc(id)+'">선지별 개인 근거 편집</button></div>'+
  (revealed.has(id)?'<p class="ck79-key">공식 채점 처리: '+esc(q.correct.join(' 또는 '))+'번 · '+esc(recognized)+'</p>':'')+
  '</article>';
}
function renderReview(){
 const report=dueReport(),data=localReview();
 const ordered=window.CK83Recall?.rankDue?.(report.rows,data.review,data.mistakes)||report.rows;
 const pages=Math.max(1,Math.ceil(ordered.length/PAGE_SIZE));
 page=Math.max(0,Math.min(page,pages-1));
 const start=page*PAGE_SIZE,shown=ordered.slice(start,start+PAGE_SIZE);
 const future=report.futureRows.slice(0,5);
 const categories=ordered.reduce((acc,r)=>{acc[r.source]=(acc[r.source]||0)+1;return acc;},{});
 return '<div class="ck79-recap"><span>지금 복습 '+report.due+'건</span><span>이후 예약 '+report.future+'건</span>'+
  '<span>실전 오답·미응답 '+(categories['v82-official-mock']||0)+'건 · 기존 오답 '+(categories['personal-mistake']||0)+'건</span>'+
  '<span>최근 정답·해소 반영 '+report.cleared.length+'건</span></div>'+
  '<p class="ck79-review-note">마지막 시험·회상·오답 결정의 시각을 비교합니다. 최근 정답이 오래된 오답을 해소할 수 있으며, 이후 회상 예약이 있으면 그 예약이 우선합니다.</p>'+
  '<div class="ck79-review-list">'+(shown.length?shown.map(r=>row(index()[r.id],r.id,r.reason,data.review[r.id])).join(''):
   '<p>현재 복습 대기 문항이 없습니다. 기출 시험 오답이나 인출 실패가 발생하면 여기에 연결됩니다.</p>')+'</div>'+
  (ordered.length?'<nav class="ck79-review-pages" aria-label="복습 문항 페이지"><span>'+Math.min(start+1,ordered.length)+'–'+
    Math.min(start+shown.length,ordered.length)+' / '+ordered.length+'건 · '+(page+1)+'/'+pages+'쪽</span>'+
    '<button type="button" data-ck79-prevpage'+(page<=0?' disabled':'')+'>이전 24문항</button>'+
    '<button type="button" data-ck79-nextpage'+(page>=pages-1?' disabled':'')+'>다음 24문항</button></nav>':'')+
  (future.length?'<details class="ck79-future"><summary>다가오는 복습 예약 (상위 '+future.length+'건)</summary><ul>'+
    future.map(r=>'<li>'+esc(r.id)+' · '+fmt(r.at)+'</li>').join('')+'</ul></details>':'');
}
async function loadConcepts(){
 if(candidates&&occurrences)return true;
 if(loading)return loading;
 loading=Promise.all([
  fetch('./data/reports/analysis-candidates-v78.json',{cache:'force-cache'}).then(r=>{if(!r.ok)throw Error('분석 보고서 없음');return r.json()}),
  fetch('./data/concept-occurrences-v1.json',{cache:'force-cache'}).then(r=>{if(!r.ok)throw Error('개념 연결 데이터 없음');return r.json()})
 ]).then(([a,b])=>{candidates=a;occurrences=b;return true})
  .catch(e=>{status('개념 후보 데이터를 가져오지 못했습니다: '+e.message);return false})
  .finally(()=>{loading=null});
 return loading;
}
function status(message){
 const el=document.querySelector('#ck79-review [data-ck79-status]');
 if(el)el.textContent=message;
}
function renderConcepts(){
 const list=candidates?.perConceptCandidates||[];
 const filtered=list.filter(r=>(subject==='all'||r.id.startsWith(subject+'.'))&&
  (!query||r.id.toLowerCase().includes(query.toLowerCase())||
   taxonomyLabels[r.id]?.includes(query)));
 const rank=filtered.slice().sort((a,b)=>b.candidates-a.candidates);
 const choices=rank.map(item=>{
  const ids=(occurrences?.occurrences||[]).filter(x=>x.candidateConceptIds?.includes(item.id)).map(x=>x.questionId);
  return '<div class="ck79-concept"><button type="button" data-ck79-concept="'+esc(item.id)+'" '+
   'aria-pressed="'+(selectedConcept===item.id)+'">'+esc(taxonomyLabels[item.id]||item.id)+
   '<small> · 키워드 후보 '+ids.length+'건 / 검수 0건</small></button></div>';
 }).join('');
 const ids=selectedConcept?(occurrences?.occurrences||[]).filter(x=>x.candidateConceptIds?.includes(selectedConcept)).map(x=>x.questionId):[];
 return '<p class="ck79-disclaimer"><strong>검증되지 않은 키워드 탐색 자료입니다.</strong> 다음 숫자는 출제 빈도·적중률이 아니라 문항 원문/선지에서 해당 키워드와 일치한 후보 수입니다.</p>'+
  '<label class="ck79-search-label">개념 검색 <input type="search" data-ck79-concept-search value="'+esc(query)+'" placeholder="예: 점유, 탄력성"></label>'+
  '<div class="ck79-concepts">'+choices+'</div>'+
  (selectedConcept?'<h4>'+esc(taxonomyLabels[selectedConcept]||selectedConcept)+' · 관련 후보 문항 '+ids.length+'건</h4>'+
   '<div class="ck79-linked">'+ids.slice(0,50).filter(valid).map(id=>{const q=index()[id];return '<button type="button" data-ck79-open="'+esc(id)+'">'+
    q.year+'년 '+q.number+'번</button>'}).join('')+'</div>'+
   '<p>동일 키워드가 포함됐다는 사실만 확인되며 실제 출제개념으로 확정된 것은 아닙니다.</p>':'');
}
const taxonomyLabels={
'estate.land.physical':'토지의 자연적 특성','estate.land.economic':'토지의 인문적 특성',
'estate.land.market':'부동산시장','estate.land.demand':'수요와 수요량','estate.land.supply':'공급과 공급량',
'estate.supply-demand.simultaneous':'수요·공급 동시 이동','estate.demand.horizontal-sum':'시장수요 수평합산',
'estate.elasticity.demand':'수요 가격탄력성','estate.price-ceiling.shortage':'최고가격제와 초과수요',
'estate.market.efficiency':'시장 실패와 효율성','estate.location':'입지론','estate.rent':'지대론',
'estate.development':'부동산 개발','estate.investment.cashflow':'투자 현금흐름',
'estate.investment.npv':'NPV·IRR','estate.investment.cap-rate':'환원율·수익가격',
'estate.finance':'부동산 금융','estate.tax':'부동산 세금',
'estate.appraisal.comparison':'거래사례비교법','estate.appraisal.income':'수익환원법',
'civil.general.juristic-act':'법률행위','civil.general.expression':'의사표시',
'civil.general.agent':'대리','civil.general.nullification':'무효와 취소',
'civil.general.conditions':'조건과 기한','civil.general.limitation':'소멸시효',
'civil.real.rights':'물권 총론','civil.real.registration':'등기와 물권변동',
'civil.real.possession':'점유권','civil.real.acquisitive':'취득시효',
'civil.real.easement':'지역권','civil.real.mortgage':'저당권',
'civil.real.provisional':'가등기','civil.contract.formation':'계약 성립',
'civil.contract.performance':'채무불이행','civil.contract.cancellation':'해제·해지',
'civil.contract.sale':'매매','civil.contract.lease':'임대차',
'civil.special.residential':'주택임대차보호법','civil.special.commercial':'상가건물임대차보호법'};
async function paint(){
 const body=document.querySelector('#ck79-review [data-ck79-body]');
 if(!body||!open)return;
 body.hidden=false;
 body.innerHTML='<div class="ck79-filter"><div role="group" aria-label="복습 메뉴">'+
  '<button data-ck79-tab="review" aria-pressed="'+(tab==='review')+'">내 오답·복습</button>'+
  '<button data-ck79-tab="concepts" aria-pressed="'+(tab==='concepts')+'">개념 후보 탐색</button></div>'+
  '<select data-ck79-subject aria-label="과목 필터"><option value="all">전체 과목</option>'+
  '<option value="estate">학개론</option><option value="civil">민법</option></select></div>'+
  '<div class="ck79-panel" data-ck79-panel>'+ (tab==='review'?renderReview():
    candidates&&occurrences?renderConcepts():'<p role="status">개념 연결 후보를 불러오는 중입니다.</p>')+
  '</div><p data-ck79-status role="status" class="ck79-status"></p>';
 const select=body.querySelector('[data-ck79-subject]');if(select)select.value=subject;
 if(tab==='concepts'&&(!candidates||!occurrences)){const ok=await loadConcepts();if(ok&&body.isConnected&&open&&tab==='concepts')paint();}
}
function openQuestion(id){
 if(!valid(id))return;
 const q=index()[id];
 if(q.year>=2021&&window.CK78Analysis?.open)window.CK78Analysis.open(q.year,q.number);
 else window.CK76Study?.openQuestion?.(q.year,q.number,q.subject);
}
document.addEventListener('click',event=>{
 const t=event.target.closest?.('[data-ck79-toggle],[data-ck79-tab],[data-ck79-show],[data-ck79-mark],[data-ck79-open],[data-ck79-edit],[data-ck79-concept],[data-ck79-prevpage],[data-ck79-nextpage]');
 if(!t)return;
 if(t.hasAttribute('data-ck79-toggle')){
  open=!open;t.setAttribute('aria-expanded',String(open));t.textContent=open?'복습 접기':'복습 열기';
  const body=document.querySelector('#ck79-review [data-ck79-body]');if(body)body.hidden=!open;
  if(open)paint();return;
 }
 if(t.hasAttribute('data-ck79-tab')){tab=t.dataset.ck79Tab;page=0;paint();return;}
 if(t.hasAttribute('data-ck79-prevpage')){page=Math.max(0,page-1);paint();return;}
 if(t.hasAttribute('data-ck79-nextpage')){page++;paint();return;}
 if(t.hasAttribute('data-ck79-show')){
  const id=t.dataset.ck79Show;
  if(revealed.has(id))revealed.delete(id);else revealed.add(id);
  paint();return;
 }
 if(t.hasAttribute('data-ck79-mark')){
  const id=t.dataset.ck79Id,outcome=t.dataset.ck79Mark;
  if(window.CK79Study?.markRecall?.(id,outcome)){revealed.delete(id);paint();}
  else status('복습 결과를 저장하지 못했습니다. 저장공간과 문항 상태를 확인하세요.');
  return;
 }
 if(t.hasAttribute('data-ck79-open')){openQuestion(t.dataset.ck79Open);return;}
 if(t.hasAttribute('data-ck79-edit')){window.CK83Links?.openQuestion?.(t.dataset.ck79Edit);return;}
 if(t.hasAttribute('data-ck79-concept')){selectedConcept=t.dataset.ck79Concept;paint();}
});
document.addEventListener('change',e=>{
 if(e.target?.matches?.('[data-ck79-subject]')){subject=e.target.value;page=0;paint();}
});
document.addEventListener('input',e=>{
 if(!e.target?.matches?.('[data-ck79-concept-search]'))return;
 query=e.target.value;
 // Avoid throwing away text focus on every keypress; regenerate only the list.
 const container=document.querySelector('#ck79-review .ck79-panel');
 if(!container)return;
 const first=container.querySelector('[data-ck79-concept-search]');
 const start=first?.selectionStart||query.length,end=first?.selectionEnd||query.length;
 container.innerHTML=renderConcepts();
 const next=container.querySelector('[data-ck79-concept-search]');
 if(next){next.focus();try{next.setSelectionRange(start,end)}catch{}}
});
let observer;
function schedule(){
 if(scheduled)return;scheduled=true;
 requestAnimationFrame(()=>{scheduled=false;mount();if(open)paint();});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
window.addEventListener('ck:official-bank-ready',()=>{if(open)paint();});
const main=document.getElementById('main');
if(main&&window.MutationObserver){observer=new MutationObserver(records=>{
 if(records.some(x=>Array.from(x.addedNodes).some(n=>n.nodeType===1&&(n.matches?.('.ck-v7-stage,#ck76-search')||n.querySelector?.('#ck76-search')))))schedule();
});observer.observe(main,{childList:true,subtree:true});}
window.CK79Review=Object.freeze({dueRows,dueReport,openQuestion,ranked:()=>candidates?.perConceptCandidates||[],getStatus:()=>({open,tab,loaded:Boolean(candidates)})});
})();