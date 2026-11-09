/* ConceptKnot v148: offline, pure three-stage explanations for all economics figures. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.CK148LearningSteps=api;})(typeof window==='object'?window:null,function(){
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=n=>Math.max(0,Math.min(100,Math.round(Number(n)||0)));
const DATA=Object.freeze({
 'price-along':{ex:['집값이 내려가면 같은 수요곡선 위에서 사려는 주택 수가 늘 수 있습니다.'],rule:'수요량 Qd=f(P)에서 자기 가격 P만 변하면 수요곡선 자체는 그대로입니다.'},
 'demand-income':{ex:['정상재에서 소득이 늘면 같은 가격에도 집을 사고 싶은 사람이 늘어납니다.','정상재에서 소득이 줄면 같은 가격에 구매하려는 사람이 줄어듭니다.'],rule:'정상재의 소득 증가 → 수요 우측 이동. 단, 열등재는 소득 효과가 반대일 수 있습니다.'},
 'demand-down':{ex:['전입 인구가 늘면 같은 가격의 주택 수요가 늘어날 수 있습니다.','지역 인구가 줄면 같은 가격에 주택을 원하는 가구가 줄어듭니다.'],rule:'다른 조건이 일정할 때 수요 증가/감소는 D곡선 전체가 우측/좌측으로 이동하는 것입니다.'},
 'demand-substitute':{ex:['대체 주택 가격이 오르면 해당 주택의 수요가 늘 수 있습니다.','대체 주택 가격이 내려가면 해당 주택의 수요가 줄 수 있습니다.'],rule:'교차가격탄력성 Eab=(dQa/dPb)×(Pb/Qa). 대체재라면 일반적으로 양(+)입니다.'},
 'supply-cost':{ex:['건축비가 내려가면 같은 가격에서 공급 가능한 주택이 늘어납니다.','건축 자재비가 높아지면 같은 가격에서 공급 가능한 주택이 줄어듭니다.'],rule:'생산비용 상승은 공급의 비가격 요인으로 S곡선을 왼쪽으로 이동시킵니다.'},
 'supply-tech':{ex:['시공기술이 발전하면 같은 비용으로 더 많은 주택을 공급할 수 있습니다.','시공 효율이 떨어지면 같은 가격에서 공급이 줄어듭니다.'],rule:'생산기술 향상은 한계비용을 낮춰 같은 가격에서의 공급량을 늘릴 수 있습니다.'},
 'equilibrium-demand':{ex:['구매하려는 사람이 늘고 공급이 그대로면 매수 경쟁이 커집니다.','구매자가 줄면 같은 공급에서 새 시장균형이 아래쪽으로 움직입니다.'],rule:'공급 고정 시 D↑이면 P*↑·Q*↑, D↓이면 P*↓·Q*↓입니다.'},
 'equilibrium-supply':{ex:['새 주택 공급이 늘면 구매자가 선택할 수 있는 물건이 많아집니다.','공급 차질이 생기면 같은 수요에서 주택이 부족해집니다.'],rule:'수요 고정 시 S↑이면 P*↓·Q*↑, S↓이면 P*↑·Q*↓입니다.'},
 'both-shift':{ex:['구매자는 늘고 공급도 증가할 때 거래량은 늘더라도 가격 방향은 한 가지가 아닙니다.'],rule:'수요·공급이 함께 증가하면 균형거래량은 증가하나 균형가격은 상대 이동폭과 기울기에 따라 다릅니다.'},
 elasticity:{ex:['똑같이 가격이 올라가도 대체재가 많은 상품은 구매량이 더 크게 반응할 수 있습니다.'],rule:'수요의 점탄력성 |Ed|=|(dQ/dP)×(P/Q)|. 그림의 외형 기울기만으로 값을 확정할 수 없습니다.'},
 ceiling:{ex:['시장균형보다 낮은 가격상한이 실제 적용되면 구매 희망에 비해 공급이 부족할 수 있습니다.'],rule:'실효적 최고가격 Pmax<P*에서는 Qd(Pmax)>Qs(Pmax), 부족분은 Qd−Qs입니다.'},
 cobweb:{ex:['작년 가격을 보고 올해 생산을 늘리면 내년의 공급과 가격이 뒤늦게 달라질 수 있습니다.'],rule:'공급에 시차가 있는 거미집모형의 수렴·발산은 공급·수요 가격반응과 기울기 관계에 달려 있습니다.'},
 'rent-distance':{ex:['교통·접근 조건이 같다면 도심에서 멀어질수록 지불할 수 있는 지대가 낮아질 수 있습니다.'],rule:'선형 입찰지대의 단순 가정은 R(d)=R0−td (t>0)입니다. 실제 도시에는 다른 조건도 작용합니다.'},
 'present-value':{ex:['1년 후 받을 110만 원은 할인율 10%에서 현재 100만 원, 20%에서 약 91.67만 원입니다.'],rule:'PV=FV/(1+r)^n (FV>0,n>0,r>−1). 미래금액·기간 일정 시 할인율과 현재가치는 반대 방향입니다.'},
 'stock-flow':{ex:['연초 주택 100채에 신축 20채, 철거 5채면 연말 주택 재고는 115채입니다.'],rule:'기말 재고=기초 재고+기간 유입−기간 유출. 저량은 특정 시점, 유량은 기간 단위입니다.'},
 'cap-rate':{ex:['순영업소득 연 1천만 원이면 환원율 5%에서 2억 원, 10%에서 1억 원으로 평가됩니다.'],rule:'직접환원법은 V=NOI/R (R>0). 순영업소득 일정 시 환원율과 가치는 반비례합니다.'},
 huff:{ex:['점포 매력도와 경쟁조건이 일정하면 그 점포까지 거리가 멀수록 선택 유인이 줄어듭니다.'],rule:'허프모형 Pi=(Si/di^β)/Σ(Sj/dj^β). 선택확률은 다른 경쟁점포와의 상대적 유인력을 반영합니다.'}
});
// The dual diagram is a pair of independently grabbable schematic curves.
// Only one curve may be moved; do not reuse the original both-shift exam answer.
function explainDual(state){
 const d=Number(state.demandSign||1)*Number(state.demand||0),
  s=Number(state.supplySign||1)*Number(state.supply||0);
 const change=n=>n>0?'증가':n<0?'감소':'불변';
 const dd=change(d),ss=change(s),hasD=d!==0,hasS=s!==0;
 let concept,example;
 if(!hasD&&!hasS){
  concept='수요곡선과 공급곡선은 모두 원래 위치입니다. 각 선을 잡아 이동해 보세요.';
  example='집을 사려는 사람과 새집 공급이 아직 바뀌지 않은 출발 상황입니다.';
 }else if(hasD&&!hasS){
  concept='수요 '+dd+'·공급 불변 → 균형가격 '+dd+'·균형거래량 '+dd+'.';
  example=d>0?'구매 희망자만 증가하고 공급 주택 수는 그대로인 상황입니다.':
   '구매 희망자만 감소하고 공급 주택 수는 그대로인 상황입니다.';
 }else if(!hasD&&hasS){
  concept='공급 '+ss+'·수요 불변 → 균형가격 '+(s>0?'하락':'상승')+
   '·균형거래량 '+ss+'.';
  example=s>0?'신축 공급만 늘고 구매 희망자는 그대로인 상황입니다.':
   '공급 차질만 생기고 구매 희망자는 그대로인 상황입니다.';
 }else if(d>0&&s>0){
  concept='수요와 공급 모두 증가 → 균형거래량 증가, 균형가격은 두 이동폭에 따라 달라집니다.';
  example='전입 가구와 신축 주택이 함께 늘어나는 지역을 떠올려 보세요.';
 }else if(d<0&&s<0){
  concept='수요와 공급 모두 감소 → 균형거래량 감소, 균형가격은 이동폭에 따라 달라집니다.';
  example='거주 수요가 줄고 신규 공급도 위축되는 지역의 사례입니다.';
 }else if(d>0&&s<0){
  concept='수요 증가·공급 감소 → 균형가격 상승, 균형거래량 방향은 이동폭에 따라 달라집니다.';
  example='살 사람은 늘지만 공사 차질로 새집 공급이 줄어드는 상황입니다.';
 }else{
  concept='수요 감소·공급 증가 → 균형가격 하락, 균형거래량 방향은 이동폭에 따라 달라집니다.';
  example='구매 희망자는 줄고 신규 주택 공급은 늘어나는 상황입니다.';
 }
 const describe=n=>n>0?'우측 '+Math.abs(n)+'%':n<0?'좌측 '+Math.abs(n)+'%':'변화 없음';
 return {concept,example,after:'E₁ · 수요 '+describe(d)+' · 공급 '+describe(s),
  advanced:'수요와 공급의 상대적 이동폭 및 기울기에 따라 새 교점이 달라집니다. '+ 
   '화면의 조작 진행률은 가상 도식의 이동 비중이며 경제지표 변화율이 아닙니다.',
  warning:'원래 기출의 동시 증가 조건과 다른 방향을 선택했다면 원문 정답을 그대로 적용하면 안 됩니다.'};
}
function legacy(chart,progress,sign,motion){
 if(!chart||!Object.hasOwn(DATA,chart.id))return null;
 const p=clamp(progress),meta=DATA[chart.id],shifted=chart.type==='demand'||chart.type==='supply';
 const d=sign===-1?-1:sign===1?1:Number(chart.shift)<0?-1:1;
 const original=Number(chart.shift)<0?-1:1;
 let concept=chart.answer||chart.title,warning='도식 이동 단계는 경제지표·기출 원문 수치가 아닙니다.';
 let after=p?'도식 조작 '+p+'%':'원래 조건 · 이동 없음';
 let example=meta.ex[0];
 if(shifted){
  const curve=chart.type==='demand'?'수요곡선 D':'공급곡선 S';
  const side=d<0?'왼쪽':'오른쪽',moved=curve+' '+side+' 이동';
  if(p===0){concept='변화 전: '+curve+'은 원래 위치에 있습니다. 비가격 요인이 변하는 실험을 해보세요.';}
  else if(d===original){concept=moved+'. '+chart.answer;}
  else{concept=moved+'. 기존 설명과 반대 조건을 가정한 비교 실험입니다.';warning='반대 방향 실험을 원래 기출문제의 조건이나 정답으로 받아들이지 마세요.';}
  if(p>0){concept+=' 다른 곡선 고정 시 '+(chart.type==='demand'?(d>0?'균형가격↑·거래량↑':'균형가격↓·거래량↓'):(d>0?'균형가격↓·거래량↑':'균형가격↑·거래량↓'))+'.';}
  after=p?moved+' · 도식 조작 '+p+'%':'원래 조건 · 이동 없음';
  example=meta.ex[d<0?1:0]||meta.ex[0];
 }else if(p===0){concept='변화 전: '+chart.title+'의 기준 상태입니다. 도형을 움직여 이후 변화를 관찰해 보세요.';}
 else if(chart.id==='price-along')concept='가격 하락에 따른 같은 수요곡선 위 수요량 증가입니다. 수요곡선 자체는 그대로입니다.';
 else if(chart.id==='both-shift')concept='수요와 공급의 동시 이동입니다. 거래량은 증가할 수 있으나 가격은 상대적인 이동 폭에 따라 결정됩니다.';
 const special=chart.type==='both'&&motion?explainDual(motion):null;
 return {title:chart.title,before:'E₀ · 기준 도식',after:special?.after||'E₁ · '+after,
  concept:special?.concept||concept,example:special?.example||example,
  advanced:special?.advanced||meta.rule,warning:special?.warning||warning,
  note:'도식 진행률은 학습용 표현입니다. 검수되지 않은 공식 기출 해설로 해석하지 마세요.'};
}
function comparison(v){
 if(!v)return null;
 return {title:v.tag||'조작 전후 비교',before:'E₀ · 변경 전',after:'E₁ · 변경 후',
  concept:(v.cause||'곡선을 움직여 보세요.')+(v.changed&&v.changed!=='없음'?' 바뀐 조건: '+v.changed+'.':''),
  example:v.example||'생활 속 상황을 확인하세요.',
  advanced:v.rule||'경제학 원리와 공식으로 결과를 해석하세요.',
  warning:v.trap||'다른 조건 일정 여부를 확인하세요.',
  note:v.scope||'공식 기출 답안을 대신하지 않는 학습용 모델입니다.'};
}
function render(model){
 if(!model)return '';
 const card=(n,name,content,caution)=>'<article class="ck148-tier" data-ck148-tier="'+n+'">'+
  '<span class="ck148-number" aria-hidden="true">'+n+'</span><div class="ck148-tier-text">'+
  '<h5>'+name+'</h5><p>'+esc(content)+'</p>'+(caution?'<p class="ck148-caution">'+esc(caution)+'</p>':'')+'</div></article>';
 return '<section class="ck148-learning" aria-label="개념 쉬운 예시 심화 3단계 해설">'+
  '<div class="ck148-states" aria-label="그래프 변화 전후">'+
  '<div><span>변화 전 E₀</span><strong>'+esc(model.before)+'</strong></div>'+
  '<span class="ck148-arrow" aria-hidden="true">→</span>'+
  '<div><span>변화 후 E₁</span><strong>'+esc(model.after)+'</strong></div></div>'+
  '<div class="ck148-tiers">'+card(1,'개념',model.concept)+card(2,'쉬운 예시',model.example)+card(3,'심화',model.advanced,model.warning)+'</div>'+
  '<small>'+esc(model.note||'학습용 개념 모델입니다.')+'</small></section>';
}
return Object.freeze({legacy,comparison,render,ids:Object.freeze(Object.keys(DATA))});
});