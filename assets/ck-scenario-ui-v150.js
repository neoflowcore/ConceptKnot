/* ConceptKnot P6-B v150: scenarios with explicit prediction before graph changes.
 * Read-only progress per page; no exam answers, storage, network, or background loops.
 */
(function(){
'use strict';
const DATA=window.CK150Study;if(!DATA)return;
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const stats=new Map();
const stateFor=k=>{if(!stats.has(k))stats.set(k,{index:0,grade:null,solved:0,right:0});return stats.get(k)};
const questions=[
 ['증가','감소','불변','조건에 따라 다름'],
 ['오른쪽 이동','왼쪽 이동','곡선 위 이동','조건에 따라 다름']
];
function target(scope,id){
 if(scope==='legacy'){
  const chart=window.CK21Charts?.charts?.find(x=>x.id===id);
  const s=window.CK149GraphEnhance?.getState?.();
  if(!chart||!s||s.id!==id)return null;
  return {chart,model:s};
 }
 if(scope==='lab'){
  const s=window.CK141ConceptLab?.getState?.();
  return s?.session?.topic===id?{model:id==='relation'?s.relation:s.session.state}:null;
 }
 const s=window.CK142Theory?.getState?.();
 return s?.selected===id?{model:s.session?.[id]?.current}:null;
}
function question(scope,id,index){
 const ctx=target(scope,id);if(!ctx)return null;
 if(scope==='legacy'){
  const chart=ctx.chart,item=DATA.legacy[id]?.[index];if(!item)return null;
  const direction=chart.type==='demand'||chart.type==='supply'||chart.type==='both';
  // The original 17 charts are schematic, not numeric data: do not create false quantities.
  const sign=index===1?-(Math.sign(chart.shift||1)):(Math.sign(chart.shift||1));
  const expected=chart.type==='demand'||chart.type==='supply'?(sign<0?'왼쪽 이동':'오른쪽 이동'):
   chart.type==='both'?(['조건에 따라 다름','조건에 따라 다름','증가','감소','조건에 따라 다름'][index]):chart.type==='along'?'곡선 위 이동':'조건에 따라 다름';
  const both=chart.type==='both'?[
   {demand:65,supply:65,demandSign:1,supplySign:1},
   {demand:65,supply:65,demandSign:-1,supplySign:-1},
   {demand:65,supply:55,demandSign:1,supplySign:-1},
   {demand:55,supply:65,demandSign:-1,supplySign:1},
   {demand:85,supply:50,demandSign:1,supplySign:1}
  ][index]:null;
  return {scope,id,index,title:item,context:'원래 개념: '+chart.question+' / 이번 실험: '+item+'. 가상 도식에서 이동 방향과 조건을 관찰합니다.',expected,
   explanation:chart.answer,choices:chart.type==='both'?questions[0]:questions[1],numeric:false,
   canApply:true,action:{type:'legacy',progress:Math.min(100,20+index*20),
    sign,kind:chart.type,...(both||{})}};
 }
 const math=window.CK141GraphMath,models=window.CK142Models;
 const item=DATA.calc(id,index,ctx.model,math,models);if(!item)return null;
 return {scope,id,index,title:item.title,
  context:item.title+' · '+item.label+' 변화를 제외한 조건을 고정하고 전후를 계산합니다.',
  expected:item.expected,explanation:item.label+' 변화에 따른 값 '+item.before+' → '+item.after+
   '. 원래 수치와 새로운 수치를 직접 비교합니다.',choices:questions[0],numeric:true,
  canApply:JSON.stringify(item.beforeState)!==JSON.stringify(item.afterState),
  action:item.apply,measure:item.label,from:item.before,to:item.after};
}
function ensure(scope,root,id){
 if(!root||!id||!root.isConnected)return;
 const host=scope==='legacy'?root.querySelector('[data-ck79-chart-modes]'):
  scope==='lab'?root.querySelector('.ck141-stage-col'):root.querySelector('.ck142-left');
 if(!host)return;
 let box=host.querySelector('[data-ck150-scope]');
 if(!box){box=document.createElement('section');box.className='ck150-scenarios';
  box.dataset.ck150Scope=scope;box.setAttribute('aria-label','상황별 예시와 정답 예측');
  host.append(box);}
 if(box.dataset.ck150Id!==id){box.dataset.ck150Id=id;draw(box);}
}
function draw(box){
 if(!box||!box.isConnected)return;
 const scope=box.dataset.ck150Scope,id=box.dataset.ck150Id,s=stateFor(scope+':'+id),row=question(scope,id,s.index);
 const tabs=DATA.labels.map((text,i)=>'<button type="button" data-ck150-i="'+i+'" aria-pressed="'+(s.index===i)+'">'+esc(text)+'</button>').join('');
 const main=row?'<div class="ck150-story"><strong>'+esc(row.title)+'</strong><p>'+esc(row.context)+'</p>'+
  '<p><strong>결과를 먼저 예상해 보세요.</strong></p></div>'+
  '<div class="ck150-choices">'+row.choices.map(x=>'<button type="button" data-ck150-choice="'+esc(x)+'"'+(s.grade?' disabled':'')+
   (s.grade?.chosen===x?' aria-pressed="true"':'')+'>'+esc(x)+'</button>').join('')+'</div>'+
  (s.grade?'<div class="ck150-result" role="status"><strong>'+(s.grade.ok?'정답입니다':'다시 확인하세요')+
   ' · '+esc(s.grade.correct)+'</strong><p>'+esc(row.explanation)+'</p></div>':'')+
  '<button type="button" class="ck150-apply" data-ck150-apply'+(row.canApply?'':' disabled')+
  '>예시를 그래프에 적용하고 E₀/E₁ 비교</button>':
  '<p class="ck150-missing">이 조건에서는 계산 가능한 예시가 없습니다. 초기화하거나 다른 사례를 선택해 주세요.</p>';
 box.innerHTML='<div class="ck150-heading"><strong>상황별 개념 학습 · '+esc(id)+'</strong>'+
  '<span>정답 '+s.right+' / '+s.solved+'</span></div>'+
  '<p class="ck150-guide">① 기본 개념 → ② 쉬운 예시 → ③ 심화의 설명을 읽고 아래 상황을 예측하세요. 정답은 선택 후 공개됩니다.</p>'+
  '<div class="ck150-tabs">'+tabs+'<button type="button" data-ck150-random>다른 사례</button></div>'+
  main+'<small class="ck150-note">학습용 가정입니다. 정확한 공식 기출 번호·정답을 임의로 연결하지 않습니다. 도식의 진행률은 실제 가격 변동률이 아닙니다.</small>';
}
function apply(row){
 const action=row?.action;if(!action||!row.canApply)return false;
 if(row.scope==='legacy')return window.CK149GraphEnhance?.applyStudyCase?.(row.id,action)===true;
 if(row.scope==='lab')return window.CK141ConceptLab?.applyStudyCase?.(row.id,action)===true;
 return window.CK142Theory?.applyStudyCase?.(row.id,action)===true;
}
document.addEventListener('click',e=>{
 const btn=e.target.closest?.('[data-ck150-i],[data-ck150-random],[data-ck150-choice],[data-ck150-apply]');
 if(!btn)return;
 const box=btn.closest?.('[data-ck150-scope]');if(!box)return;
 const scope=box.dataset.ck150Scope,id=box.dataset.ck150Id,s=stateFor(scope+':'+id);
 if(btn.dataset.ck150I!==undefined||btn.hasAttribute('data-ck150-random')){
  if(btn.dataset.ck150I!==undefined)s.index=Number(btn.dataset.ck150I);
  else s.index=(s.index+1+Math.floor(Math.random()*4))%5;
  s.grade=null;draw(box);return;
 }
 const row=question(scope,id,s.index);if(!row)return;
 if(btn.dataset.ck150Choice!==undefined){
  if(s.grade)return;const chosen=btn.dataset.ck150Choice;
  if(!row.choices.includes(chosen))return;
  const ok=chosen===row.expected;s.grade={chosen,correct:row.expected,ok};
  s.solved++;if(ok)s.right++;draw(box);return;
 }
 if(btn.hasAttribute('data-ck150-apply')){
  if(apply(row)){s.grade=null;
   const existing=document.querySelector('[data-ck150-scope="'+scope+'"][data-ck150-id="'+id+'"]');
   if(existing?.isConnected){draw(existing);const label=document.createElement('p');
    label.className='ck150-applied';label.textContent='예시 적용 완료. 위 E₀·E₁ 차트와 3단계 이론을 비교하세요.';
    existing.append(label);}
  }
 }
});
window.CK150ScenarioUI=Object.freeze({
 mountLegacy:(root,c)=>ensure('legacy',root,c?.id),
 mountLab:(root,id)=>ensure('lab',root,id),
 mountTheory:(root,id)=>ensure('theory',root,id),
 boot(){const root=document.querySelector('.ck21-chart-section');
  const chart=window.CK21Charts?.charts?.[window.CK21Charts?.getState?.()?.selected||0];
  if(root&&chart)ensure('legacy',root,chart.id);
  const lab=document.getElementById('ck141-concept-lab'),s=window.CK141ConceptLab?.getState?.();
  if(lab&&s)ensure('lab',lab,s.session?.topic);
  const theory=document.getElementById('ck142-theory-studio'),t=window.CK142Theory?.getState?.();
  if(theory&&t)ensure('theory',theory,t.selected);
 },size:DATA.size});
})();
