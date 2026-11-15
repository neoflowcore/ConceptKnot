/* ConceptKnot v179: one interactive chart -> easy example -> deeper rule -> apply.
 * Display-only session answers; no official records or storage keys are written.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root){root.CK179ChartLearning=api;
  root.document?.addEventListener?.('click',function(e){
   const b=e.target?.closest?.('[data-ck179-choice],[data-ck179-retry]');
   const panel=b?.closest?.('[data-ck179-summary]');
   if(!panel)return;
   const key=panel.dataset.ck179Signature;
   if(!key)return;
   if(b.hasAttribute('data-ck179-retry'))api.reset(key);
   else api.choose(key,b.dataset.ck179Choice,panel.dataset.ck179Correct);
   const result=api.get(key);
   for(const btn of panel.querySelectorAll('[data-ck179-choice]')){
    btn.disabled=Boolean(result);
    btn.setAttribute('aria-pressed',String(Boolean(result)&&btn.dataset.ck179Choice===result.choice));
   }
   const feedback=panel.querySelector('[data-ck179-feedback]');
   if(feedback){
    feedback.hidden=!result;
    feedback.textContent=result?(result.ok?'정답입니다. ':'다시 확인하세요. ')+
     '정답: '+panel.dataset.ck179Correct+'. '+panel.dataset.ck179Reason:'';
   }
   const retry=panel.querySelector('[data-ck179-retry]');
   if(retry)retry.hidden=!result;
  });
 }
})(typeof window==='object'?window:null,function(){
 'use strict';
 const picks=new Map();
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const short=(v,max=190)=>{const s=String(v??'').replace(/\s+/g,' ').trim();return s.length>max?s.slice(0,max-1).trimEnd()+'…':s;};
 const numeric=v=>Number.isFinite(v)&&v>=0&&v<=200?Number(v).toFixed(1):'도식 밖';
 const direction=v=>v==='증가'?'상승':v==='감소'?'하락':v==='불변'?'불변':'조건에 따라 다름';
 const metric=(name,a,b,change)=>'<div class="ck179-metric"><span>'+esc(name)+'</span>'+
  '<strong>'+esc(a)+' <i aria-hidden="true">→</i> '+esc(b)+'</strong>'+
  (change?'<small>'+esc(change)+'</small>':'')+'</div>';
 function problem(chart,outcome,state,problems){
  const market=['demand','supply','both'].includes(chart?.type);
  if(market&&outcome?.start&&outcome?.end){
   const expected=direction(outcome.price);
   const signature=[chart.id,Number(state?.value)||0,Number(state?.demand)||0,
    Number(state?.supply)||0,Number(state?.demandSign)||0,Number(state?.supplySign)||0,
    Number(state?.demandSlope)||100,Number(state?.supplySlope)||100,outcome.price,outcome.quantity].join(':');
   return {signature,question:'현재 그림에서 E₀ → E₁ 균형가격의 변화 방향은?',
    choices:['상승','하락','불변','조건에 따라 다름'],correct:expected,
    reason:'지금 그린 두 직선의 가상 교점을 비교한 결과입니다. 수요·공급이 함께 변할 때 일반 법칙과 동일시하지 마세요.'};
  }
  const p=(problems||[]).find(p=>p.chart===chart.id);
  if(p?.a?.length&&Number.isInteger(p.ok)&&p.ok>=1&&p.ok<=p.a.length){
   return {signature:chart.id+':practice',question:p.q,choices:p.a,
    correct:p.a[p.ok-1],reason:p.fast||p.guard||chart.answer};
  }
  return {signature:chart.id+':reflection',question:chart.question,
   choices:[],correct:chart.answer,
   reason:'개념 확인을 위한 원래 도식의 설명입니다. 실제 기출 정답 검증을 의미하지 않습니다.'};
 }
 function renderLegacy(chart,model,outcome,state,lesson,problems,open={}){
  if(!chart||!model)return '';
  const market=['demand','supply','both'].includes(chart.type);
  const p=problem(chart,outcome,state,problems);
  const result=picks.get(p.signature);
  let metrics,note,summary;
  if(market&&outcome?.start&&outcome?.end){
   const unit=point=>({p:(315-Number(point.y))/5,q:(Number(point.x)-86)/5});
   const first=unit(outcome.start),last=unit(outcome.end);
   metrics=metric('균형가격 P · 가상단위',numeric(first.p),numeric(last.p),direction(outcome.price))+
    metric('거래량 Q · 가상단위',numeric(first.q),numeric(last.q),outcome.quantity);
   note='수치는 SVG 그림의 가상 좌표를 환산한 학습 예시로 실제 가격·기출 수치가 아닙니다.';
   summary='가격 '+direction(outcome.price)+' · 거래량 '+outcome.quantity;
  }else if(market){
   metrics=metric('차트 상태','E₀','E₁');
   note='교점 수치가 확정되지 않는 경우 그림만 비교합니다.';
   summary=short(model.concept,100);
  }else{
   const v=Math.max(0,Math.min(100,Math.round(Number(state?.value??0)||0)));
   metrics=metric('도식 관찰 위치','0',String(v),v?'관찰점 이동':'변화 없음');
   note='관찰 단계는 실제 가격·수익률·거래량 변동률이 아닙니다.';
   summary=short(model.concept,105);
  }
  const example=short(lesson?.example||model.example,180);
  const easy=short(lesson?.easy||model.concept,220);
  const advanced=short(market&&lesson?.tilted?
    '수요·공급 직선의 기울기와 절편이 달라지면 새 교점을 다시 계산해야 합니다. 도식 기울기 자체는 가격탄력성이 아닙니다.':
    model.advanced||lesson?.advanced,260);
  const questionChoices=p.choices.length?p.choices.map((c,i)=>
   '<button type="button" data-ck179-choice="'+esc(c)+'"'+
   (result?' disabled':'')+(result?.choice===c?' aria-pressed="true"':'')+'>'+esc(String(i+1)+'. '+c)+'</button>').join(''):
   '<button type="button" data-ck179-choice="'+esc(p.correct)+'"'+(result?' disabled':'')+
   '>답 확인하기</button>';
  const feedback=result?(result.ok?'정답입니다. ':'다시 확인하세요. ')+
   '정답: '+p.correct+'. '+p.reason:'';
  return '<section class="ck179-summary" data-ck179-summary data-ck179-signature="'+esc(p.signature)+
   '" data-ck179-correct="'+esc(p.correct)+'" data-ck179-reason="'+esc(p.reason)+
   '" aria-label="차트 조작에 따른 3단계 학습">'+
   '<div class="ck179-metrics">'+metrics+'</div>'+
   '<p class="ck179-headline" role="status">'+esc(summary)+'</p>'+
   '<article class="ck179-step"><h4><span>1</span> 쉬운 예시</h4>'+
   '<p>'+esc(example)+'</p><p>'+esc(easy)+'</p></article>'+
   '<details class="ck179-step ck179-deep" data-ck179-deep'+(open.deep?' open':'')+'>'+
   '<summary><span>2</span> 심화 설명</summary><p>'+esc(advanced)+'</p></details>'+
   '<details class="ck179-step ck179-quiz" data-ck179-quiz'+(open.quiz?' open':'')+'>'+
   '<summary><span>3</span> 적용 문제 · 직접 확인</summary><p class="ck179-question">'+esc(p.question)+'</p>'+
   '<div class="ck179-choices" role="group" aria-label="적용 문제 정답 선택">'+questionChoices+'</div>'+
   '<p data-ck179-feedback role="status"'+(result?'':' hidden')+'>'+esc(feedback)+'</p>'+
   '<button type="button" data-ck179-retry'+(result?'':' hidden')+'>다시 풀기</button>'+
   '<small>개념 연습문제이며 공식 기출 선지 검수 결과가 아닙니다.</small></details>'+
   '<small class="ck179-footnote">'+esc(note)+'</small></section>';
 }
 function paint(host,chart,model,outcome,state,lesson,problems){
  if(!host||!model)return false;
  const prevDeep=host.querySelector?.('[data-ck179-deep]')?.open===true;
  const prevQuiz=host.querySelector?.('[data-ck179-quiz]')?.open===true;
  const html=renderLegacy(chart,model,outcome,state,lesson,problems,{deep:prevDeep,quiz:prevQuiz});
  if(!html)return false;
  if(host.innerHTML!==html)host.innerHTML=html;
  return true;
 }
 const choose=(key,choice,correct)=>{
  if(!key||picks.has(key))return false;
  picks.set(key,{choice,ok:choice===correct});if(picks.size>80)picks.delete(picks.keys().next().value);
  return true;
 };
 return Object.freeze({renderLegacy,paint,choose,get:key=>picks.get(key)||null,
  reset:key=>picks.delete(key),problem});
});
