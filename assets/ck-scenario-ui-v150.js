/* ConceptKnot P6-B v153: prediction -> grading -> simulation -> mistake review.
 * Offline, session-only. No exam records, storage, network or background work.
 */
(function(){
'use strict';
const DATA=window.CK150Study, QUIZ=window.CK153Quiz, RULES=window.CK153LegacyRules;
if(!DATA||!QUIZ||!RULES)return;
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const frozen=new Map();
const key=(scope,id)=>scope+':'+id;
function target(scope,id){
 if(scope==='legacy'){
  const chart=window.CK21Charts?.charts?.find(x=>x.id===id);
  const s=window.CK149GraphEnhance?.getState?.();
  return chart&&s?.id===id?{chart,model:s}:null;
 }
 if(scope==='lab'){
  const s=window.CK141ConceptLab?.getState?.();
  return s?.session?.topic===id?{model:id==='relation'?s.relation:s.session.state}:null;
 }
 const s=window.CK142Theory?.getState?.();
 return s?.selected===id?{model:s.session?.[id]?.current}:null;
}
function question(scope,id,index){
 const ctx=target(scope,id);
 if(!ctx)return null;
 if(scope==='legacy')return RULES.get(ctx.chart,index,DATA.legacy);
 const item=DATA.calc(id,index,ctx.model,window.CK141GraphMath,window.CK142Models);
 if(!item)return null;
 return {scope,id,index,title:item.title,
  context:'판단할 대상: '+item.label+' 변화 후의 '+item.id+' 모형 결과. 다른 값은 고정하고 실제 수식으로 E₀와 E₁을 계산합니다.',
  expected:item.expected,explanation:item.label+'에 따른 모형값은 '+Number(item.before.toFixed(4))+' → '+Number(item.after.toFixed(4))+
   '입니다. 바뀐 변수는 '+item.label+'이며, 예상한 증가·감소·불변을 수치로 확인하세요.',
  choices:DATA.steps,numeric:true,canApply:JSON.stringify(item.beforeState)!==JSON.stringify(item.afterState),
  action:item.apply,measure:item.label,from:item.before,to:item.after,
  note:'계산형 학습 모형입니다. 수치·시행령 및 특정 기출 정답의 검수 결과가 아닙니다.'};
}
function rowFor(scope,id,s){
 return frozen.get(key(scope,id))||question(scope,id,s.index);
}
function ensure(scope,root,id){
 if(!root||!id||!root.isConnected)return;
 const host=scope==='legacy'?root.querySelector('[data-ck79-chart-modes]'):
  scope==='lab'?root.querySelector('.ck141-stage-col'):root.querySelector('.ck142-left');
 if(!host)return;
 let box=host.querySelector('[data-ck150-scope]');
 if(!box){
  box=document.createElement('section');box.className='ck150-scenarios';
  box.dataset.ck150Scope=scope;box.setAttribute('aria-label','상황별 예측 채점과 그래프 실험');
  host.append(box);
 }
 if(box.dataset.ck150Id!==id){box.dataset.ck150Id=id;draw(box);}
}
function draw(box){
 if(!box||!box.isConnected)return;
 const scope=box.dataset.ck150Scope,id=box.dataset.ck150Id,
  s=QUIZ.state(scope,id),row=rowFor(scope,id,s),grade=QUIZ.visible(s,row),totals=QUIZ.summary(s);
 const tabs=DATA.labels.map((label,i)=>'<button type="button" data-ck150-i="'+i+'" aria-pressed="'+(s.index===i)+'"'+
  (s.verdicts[i]==='wrong'?' data-ck150-wrong="true"':'')+'>'+
  esc(label)+(s.verdicts[i]==='correct'?' ✓':s.verdicts[i]==='wrong'?' ↻':'')+'</button>').join('');
 let main='';
 if(row){
  const choices=row.choices.map(x=>'<button type="button" data-ck150-choice="'+esc(x)+'"'+
   (grade?' disabled':'')+(grade?.chosen===x?' aria-pressed="true"':'')+'>'+esc(x)+'</button>').join('');
  main='<div class="ck150-story"><strong>'+esc(row.title)+'</strong><p>'+esc(row.context)+'</p>'+
   '<p><strong>'+esc(row.measure||'변화 방향')+'의 결과를 먼저 예상해 보세요.</strong></p></div>'+
   '<div class="ck150-choices" role="group" aria-label="결과 예측 4지선다">'+choices+'</div>'+
   (grade?'<div class="ck150-result" role="status"><strong>'+
     (grade.ok?'예측 성공':'오답 · 개념 다시 확인')+' — 정답: '+esc(grade.correct)+
     '</strong><p>'+esc(row.explanation)+'</p>'+
     (row.note?'<small>'+esc(row.note)+'</small>':'')+'</div>':'')+
   '<button type="button" class="ck150-apply" data-ck150-apply'+
   (!grade||!row.canApply?' disabled':'')+
   '>'+(row.canApply?'채점 후 그래프에 적용하고 E₀/E₁ 비교':'개념 설명 전용 · 그래프 적용 없음')+'</button>'+
   (s.applied===QUIZ.fingerprint(row)?'<p class="ck150-applied" role="status">그래프에 적용했습니다. 이전 E₀와 현재 E₁ 및 3단계 설명을 비교하세요.</p>':'')+
   (grade?'<button type="button" data-ck150-again>같은 상황 다시 풀기</button>':'');
 }else{
  main='<p class="ck150-missing">현재 변수 범위에서 계산할 수 없는 사례입니다. 그래프를 초기화하거나 다른 사례를 선택하세요.</p>';
 }
 const controls='<div class="ck150-review-controls">'+
  '<button type="button" data-ck150-next'+(totals.remaining===0?' disabled':'')+'>다음 미학습 사례</button>'+
  '<button type="button" data-ck150-review'+(totals.retry===0?' disabled':'')+'>오답 다시 풀기</button></div>';
 box.innerHTML='<div class="ck150-heading"><strong>상황별 개념 학습 · '+esc(id)+'</strong>'+
  '<span>정답 '+totals.correct+' / 학습 '+totals.attempted+' / 총 5 · 오답 '+totals.retry+'</span></div>'+
  '<p class="ck150-guide">① 개념 → ② 쉬운 예시 → ③ 심화 → ④ 결과 예측·채점 → ⑤ 전후 그래프 적용 순서입니다.</p>'+
  '<div class="ck150-tabs" role="group" aria-label="사례 다섯 가지">'+tabs+'</div>'+main+controls+
  '<small class="ck150-note">학습용 가정입니다. 공식 기출의 정답·선지 근거를 대신하지 않으며 사용자의 답안이나 개인 자료를 변경하지 않습니다.</small>';
}
function apply(row){
 const a=row?.action;if(!a||!row.canApply)return false;
 if(row.scope==='legacy')return window.CK149GraphEnhance?.applyStudyCase?.(row.id,a)===true;
 if(row.scope==='lab')return window.CK141ConceptLab?.applyStudyCase?.(row.id,a)===true;
 return window.CK142Theory?.applyStudyCase?.(row.id,a)===true;
}
document.addEventListener('click',e=>{
 const btn=e.target.closest?.('[data-ck150-i],[data-ck150-next],[data-ck150-review],[data-ck150-choice],[data-ck150-apply],[data-ck150-again]');
 if(!btn)return;
 const box=btn.closest?.('[data-ck150-scope]');if(!box)return;
 const scope=box.dataset.ck150Scope,id=box.dataset.ck150Id,
  s=QUIZ.state(scope,id),k=key(scope,id);
 if(btn.dataset.ck150I!==undefined||btn.hasAttribute('data-ck150-next')||btn.hasAttribute('data-ck150-review')){
  let ok=false;
  if(btn.dataset.ck150I!==undefined)ok=QUIZ.select(s,Number(btn.dataset.ck150I));
  else if(btn.hasAttribute('data-ck150-next'))ok=QUIZ.nextUnseen(s)>=0;
  else ok=QUIZ.review(s)>=0;
  if(ok){frozen.delete(k);draw(box);}return;
 }
 const row=rowFor(scope,id,s);
 if(!row)return;
 if(btn.dataset.ck150Choice!==undefined){
  const grade=QUIZ.answer(s,row,btn.dataset.ck150Choice);
  if(!grade)return;
  frozen.set(k,row);draw(box);return;
 }
 if(btn.hasAttribute('data-ck150-again')){
  if(QUIZ.again(s,row)){frozen.delete(k);draw(box);}return;
 }
 if(btn.hasAttribute('data-ck150-apply')){
  // No graph change or answer leakage before an actual validated prediction.
  if(!QUIZ.visible(s,row)||!row.canApply||!row.action)return;
  if(s.applied===QUIZ.fingerprint(row))return;
  if(apply(row)){QUIZ.applied(s,row);frozen.set(k,row);draw(box);}
  else{
   const label=document.createElement('p');label.className='ck150-applied';
   label.setAttribute('role','status');
   label.textContent='이 그래프는 이미 같은 상태이거나 조건 적용이 불가능합니다. 초기화 후 다시 시도하세요.';
   box.append(label);
  }
 }
});
window.CK150ScenarioUI=Object.freeze({
 mountLegacy:(root,c)=>ensure('legacy',root,c?.id),
 mountLab:(root,id)=>ensure('lab',root,id),
 mountTheory:(root,id)=>ensure('theory',root,id),
 boot(){
  const root=document.querySelector('.ck21-chart-section');
  const chart=window.CK21Charts?.charts?.[window.CK21Charts?.getState?.()?.selected||0];
  if(root&&chart)ensure('legacy',root,chart.id);
  const lab=document.getElementById('ck141-concept-lab'),s=window.CK141ConceptLab?.getState?.();
  if(lab&&s)ensure('lab',lab,s.session?.topic);
  const theory=document.getElementById('ck142-theory-studio'),t=window.CK142Theory?.getState?.();
  if(theory&&t)ensure('theory',theory,t.selected);
 },size:DATA.size});
})();
