/* ConceptKnot P6: local offline exam search, final-note summaries and chart scrub.
 * No remote AI calls, no reclassification of unreviewed explanations.
 */
(function(){
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize=s=>String(s??'').normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
const records=()=>Object.values(window.RECALL_OFFICIAL||{}).filter(q=>q&&q.verified===true&&q.question&&Array.isArray(q.options));
const labels={estate:'부동산학개론',civil:'민법 및 민사특별법'};
let lastQuery='',lastResults=[],active=false,profile=5;
function ranked(query,opts={}){
 const terms=normalize(query).split(' ').filter(Boolean);
 if(!terms.length)return [];
 const yr=Number(opts.year)||0,subject=opts.subject||'all';
 return records().filter(q=>(!yr||q.year===yr)&&(subject==='all'||q.subject===subject)).map(q=>{
  const title=normalize(q.question),choices=normalize(q.options.join(' '));
  let score=0;
  for(const term of terms){
   const inTitle=title.includes(term),inChoices=choices.includes(term);
   if(!inTitle&&!inChoices)return null;
   score+=inTitle?5:2;
   if(title.startsWith(term))score+=2;
  }
  if(q.year>=2021)score+=.5;
  return {id:q.id,question:q.question,year:q.year,number:q.number,subject:q.subject,
   answers:Array.isArray(q.correct)?q.correct:[],score};
 }).filter(Boolean).sort((a,b)=>b.score-a.score||b.year-a.year||a.number-b.number).slice(0,100);
}
function mount(){
 if(!document.body||document.getElementById('ck76-search'))return;
 const root=document.createElement('section');root.id='ck76-search';root.className='ck76-search';
 root.innerHTML='<div class="ck76-search-head"><strong>기출 통합 검색</strong>'+
  '<button type="button" data-ck76-search-collapse aria-label="검색 접기" aria-expanded="false">검색 열기</button></div>'+
  '<div class="ck76-search-panel" hidden><form data-ck76-search-form>'+
  '<label for="ck76-search-query">공식 10개년 800문항에서 찾기</label>'+
  '<div class="ck76-search-row"><input id="ck76-search-query" type="search" autocomplete="off" placeholder="예: 최고가격제, 취득시효, 수요의 탄력성" maxlength="120" />'+
  '<select id="ck76-search-year" aria-label="검색 연도"><option value="0">전체 연도</option>'+
  Array.from({length:10},(_,i)=>2025-i).map(y=>'<option value="'+y+'">'+y+'년</option>').join('')+'</select>'+
  '<select id="ck76-search-subject" aria-label="과목"><option value="all">전체 과목</option><option value="estate">학개론</option><option value="civil">민법</option></select>'+
  '<button type="submit">검색</button></div></form>'+
  '<p class="ck76-search-status" id="ck76-search-status" role="status">기기 안에 등록된 공식 원문만 검색합니다.</p>'+
  '<div id="ck76-search-results" class="ck76-search-results"></div></div>';
 const target=document.querySelector('#main .ck-v7-nav-pill')||
  document.querySelector('#main .board-tabs')||document.querySelector('#main');
 if(target?.parentNode)target.parentNode.insertBefore(root,target.nextSibling);
 else document.body.prepend(root);
}
function searchUi(){
 const root=document.getElementById('ck76-search'),panel=root?.querySelector('.ck76-search-panel');
 if(!panel)return;
 const input=root.querySelector('#ck76-search-query'),year=root.querySelector('#ck76-search-year'),
  sub=root.querySelector('#ck76-search-subject');
 lastQuery=input?.value||'';
 lastResults=ranked(lastQuery,{year:year?.value,subject:sub?.value});
 const target=root.querySelector('#ck76-search-results'),status=root.querySelector('#ck76-search-status');
 if(status)status.textContent=lastQuery.trim()
  ?'검색 결과 '+lastResults.length+'건'+(lastResults.length===100?' · 상위 100건 표시':'')
  :'검색어를 입력해 주세요.';
 if(target)target.innerHTML=lastResults.map(r=>
  '<article class="ck76-result"><div><small>'+r.year+'년 · '+esc(labels[r.subject]||r.subject)+' · '+r.number+'번</small>'+
  '<p>'+esc(r.question.slice(0,240))+'</p><small>최종정답 처리: '+(r.answers.length===5?'전원정답':r.answers.join(' 또는 ')+'번')+'</small></div>'+
  '<button type="button" data-ck76-open="'+esc(r.id)+'">문제 열기</button></article>').join('')||
   '<p class="ck76-empty">일치하는 문항이 없습니다. 띄어쓰기·검색어를 바꾸거나 필터를 해제하세요.</p>';
}
function openQuestion(id){
 const q=window.RECALL_OFFICIAL?.[id];if(!q?.verified)return false;
 const yearSelect=document.getElementById('tts-year');
 const current=window.CK76Study?.openQuestion;
 if(typeof current==='function')return current(q.year,q.number,q.subject);
 // Keep a safe fallback if study scope is unavailable.
 if(yearSelect){yearSelect.value=String(q.year);yearSelect.dispatchEvent(new Event('change',{bubbles:true}));}
 return false;
}
function injectFinal(){
 const root=document.getElementById('ck10-final-root');
 if(!root||root.querySelector('[data-ck76-note-profile]'))return;
 const anchor=root.querySelector('.ck10-final-actions')||root;
 const wrap=document.createElement('div');wrap.className='ck76-final-tools';
 wrap.innerHTML='<label>최종 암기본 분량 <select data-ck76-note-profile aria-label="최종 노트 분량">'+
  '<option value="1">A4 1장</option><option value="3">A4 3장</option><option value="5" selected>A4 5장</option></select></label>'+
  '<button type="button" data-ck76-note-suggest>내 오답·검수 상태 보기</button>'+
  '<p data-ck76-note-review role="status">내 메모를 덮어쓰지 않습니다. 미검수 해설은 암기본 근거로 사용하지 않습니다.</p>';
 anchor.append(wrap);
}
function suggestNotes(){
 const target=document.querySelector('[data-ck76-note-review]');
 if(!target)return;
 let mistakes=[];
 try{
  const state=JSON.parse(localStorage.getItem('recallgraph-first-exam-v1')||'{}');
  mistakes=Object.values(state.mistakes||{}).filter(x=>x&&!x.resolved);
 }catch{}
 target.textContent='선택 '+profile+'장 · 미해결 오답 '+mistakes.length+
  '건 · 자동 생성된 미검수 법령/해설 없음. 편집 중인 5쪽 원본은 그대로 유지됩니다.';
}
function chartUi(){
 const root=document.querySelector('.ck21-chart-section');
 if(!root||root.querySelector('[data-ck76-chart-scrub]'))return;
 const card=root.querySelector('.ck21-chart-copy')||root;
 const state=window.CK21Charts?.getState?.(),q=window.CK21Charts?.charts?.[state?.selected||0];
 if(!q)return;
 const div=document.createElement('div');div.className='ck76-chart-control';
 div.innerHTML='<label for="ck76-chart-scrub">그래프 진행 단계 <output data-ck76-chart-output>'+(state.phase?'100':'0')+'%</output></label>'+
  '<input type="range" id="ck76-chart-scrub" data-ck76-chart-scrub min="0" max="100" step="1" value="'+(state.phase?100:0)+'" aria-label="차트 이동 진행률">'+
  '<p>슬라이더·방향키로 곡선 이동 정도를 조절합니다. 도표는 원리 설명용이며, 출제 원본 수치를 복제하지 않습니다.</p>';
 card.append(div);
 applyScrub(root,state.phase?100:0);
}
function applyScrub(root,value){
 const amount=Math.min(100,Math.max(0,Number(value)||0)),p=amount/100;
 const range=root.querySelector('[data-ck76-chart-scrub]');
 if(range&&Number(range.value)!==amount)range.value=String(amount);
 const label=root.querySelector('[data-ck76-chart-output]');
 if(label)label.textContent=amount+'%';
 const c=window.CK21Charts?.charts?.[window.CK21Charts?.getState?.().selected||0];
 if(!c)return;
 root.querySelectorAll('.ck21-transform-target').forEach(g=>{
  g.classList.add('ck21-shifted');
  // The base SVG uses --ck21-dx. Scale its numeric shift while preserving sign.
  const full=Number.parseFloat(g.style?.getPropertyValue('--ck21-dx')||'0')||0;
  if(!g.dataset.ck76Shift)g.dataset.ck76Shift=String(full);
  const shift=Number(g.dataset.ck76Shift)||0;
  g.style.setProperty('--ck21-dx',(shift*p)+'px');
 });
 root.querySelectorAll('.ck21-along').forEach(el=>el.classList.toggle('ck21-moved',amount>=50));
 root.querySelectorAll('.ck21-step').forEach(el=>el.classList.toggle('ck21-step-show',amount>=50));
 root.querySelectorAll('.ck21-policy').forEach(el=>el.classList.toggle('ck21-policy-show',amount>=50));
 const explanation=root.querySelector('.ck21-chart-explanation');
 if(explanation)explanation.textContent=amount?c.answer:'곡선을 이동해 개념 변화를 확인하세요.';
}
// Use the existing dot-home search position as the entry point; do not redesign the owl.
document.addEventListener('click',event=>{
 const launcher=event.target.closest?.('.ck-dot-search-placeholder');
 if(!launcher)return;
 event.preventDefault();event.stopImmediatePropagation();
 const home=document.querySelector('#side-nav [data-go="home"],.board-tabs [data-go="home"]');
 if(home)home.click();
 // Navigation mounts the persistent search panel; focus only after rendering.
 requestAnimationFrame(()=>{
  mount();
  const toggle=document.querySelector('#ck76-search [data-ck76-search-collapse]');
  if(toggle?.getAttribute('aria-expanded')!=='true')toggle?.click();
  document.getElementById('ck76-search-query')?.focus();
 });
},true);
document.addEventListener('click',e=>{
 const toggle=e.target.closest?.('[data-ck76-search-collapse]');
 if(toggle){
  const root=document.getElementById('ck76-search'),panel=root?.querySelector('.ck76-search-panel');
  if(panel){panel.hidden=!panel.hidden;toggle.setAttribute('aria-expanded',String(!panel.hidden));toggle.textContent=panel.hidden?'검색 열기':'검색 접기';}
  return;
 }
 const jump=e.target.closest?.('[data-ck76-open]');
 if(jump){openQuestion(jump.dataset.ck76Open);return;}
 const note=e.target.closest?.('[data-ck76-note-suggest]');
 if(note){suggestNotes();return;}
});
document.addEventListener('submit',e=>{
 if(!e.target.matches?.('[data-ck76-search-form]'))return;
 e.preventDefault();searchUi();
});
document.addEventListener('change',e=>{
 if(e.target.matches?.('[data-ck76-note-profile]')){profile=[1,3,5].includes(Number(e.target.value))?Number(e.target.value):5;
  const pages=document.querySelectorAll('#ck10-final-root .ck10-paper');
  pages.forEach((p,i)=>p.hidden=i>=profile);suggestNotes();
 }
 if(e.target.matches?.('#ck76-search-year,#ck76-search-subject'))searchUi();
});
document.addEventListener('input',e=>{
 if(e.target.matches?.('[data-ck76-chart-scrub]'))applyScrub(e.target.closest('.ck21-chart-section'),e.target.value);
});
let scheduled=false;
function decorate(){
 mount();injectFinal();chartUi();
}
function schedule(){
 if(scheduled)return;scheduled=true;
 requestAnimationFrame(()=>{scheduled=false;decorate();});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',decorate,{once:true});
else decorate();
const main=document.getElementById('main');
if(main&&window.MutationObserver)new MutationObserver(changes=>{
 if(changes.some(x=>Array.from(x.addedNodes).some(el=>el.nodeType===1&&
   (el.matches?.('.ck-v7-stage,.ck21-chart-section,#ck10-final-root')||
    el.querySelector?.('.ck21-chart-section,#ck10-final-root')))))schedule();
}).observe(main,{childList:true,subtree:true});
window.CK76Search=Object.freeze({ranked,openQuestion,getState:()=>({query:lastQuery,results:lastResults.length}),applyScrub});
})();
