/* ConceptKnot P6-B v149. Curve-aware pointer geometry and reversible per-figure lesson state.
 * Schematic SVG coordinates are NEVER official exam quantities or market statistics.
 */
(function(root,factory){
 'use strict';const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.CK149GraphMotion=api;
})(typeof window==='object'?window:null,function(){
 'use strict';
 const clamp=(n,min,max)=>Math.min(max,Math.max(min,Number(n)||0));
 const round=n=>Math.round(clamp(n,0,100));
 const direction=c=>Number(c?.shift)<0?-1:1;
 const SIZE={width:560,height:348};
 const defaultSnapshot=(chart,value=0)=>{
  const sign=direction(chart),v=round(value);
  return {value:v,sign,demand:v,supply:v,demandSign:sign,supplySign:sign,
   demandSlope:100,supplySlope:100};
 };
 const copy=s=>({...s});
 const same=(a,b)=>a&&b&&['value','sign','demand','supply','demandSign','supplySign',
  'demandSlope','supplySlope']
  .every(k=>a[k]===b[k]);
 function timeline(chart,initial=0){
  let current=defaultSnapshot(chart,initial),past=[],future=[];
  return {
   get state(){return copy(current)},
   get canUndo(){return past.length>0},
   get canRedo(){return future.length>0},
   get pastCount(){return past.length},
   get futureCount(){return future.length},
   set(s){current=copy(s);return copy(current)},
   commit(before){
    if(!same(before,current)){past.push(copy(before));if(past.length>80)past.shift();future=[];return true}
    return false;
   },
   undo(){if(!past.length)return null;future.push(copy(current));current=past.pop();return copy(current)},
   redo(){if(!future.length)return null;past.push(copy(current));current=future.pop();return copy(current)},
   reset(){const original=defaultSnapshot(chart,0);const was=copy(current);current=original;this.commit(was);return copy(current)}
  };
 }
 function boxPoint(event,rect){
  if(!rect||!Number.isFinite(rect.width)||!Number.isFinite(rect.height)||rect.width<=0||rect.height<=0)return null;
  const scale=Math.min(rect.width/SIZE.width,rect.height/SIZE.height);
  if(!(scale>0))return null;
  const x=(Number(event.clientX)-rect.left-(rect.width-SIZE.width*scale)/2)/scale;
  const y=(Number(event.clientY)-rect.top-(rect.height-SIZE.height*scale)/2)/scale;
  return Number.isFinite(x)&&Number.isFinite(y)?{x,y,scale}:null;
 }
 const segdist=(x,y,a,b)=>{
  const dx=b[0]-a[0],dy=b[1]-a[1];
  const t=clamp(((x-a[0])*dx+(y-a[1])*dy)/Math.max(.000001,dx*dx+dy*dy),0,1);
  return Math.hypot(x-a[0]-dx*t,y-a[1]-dy*t);
 };
 const polylines=chart=>{
  const c=chart||{},type=c.type;
  const demand=[[100,86],[485,286]],supply=[[110,300],[480,80]];
  if(type==='elasticity')return [{kind:'curve',points:[[135,142],[460,220]]},{kind:'curve',points:[[285,65],[320,310]]}];
  if(type==='distance')return [{kind:'curve',points:Array.from({length:30},(_,i)=>{
   const t=i/29,u=1-t;return [u*u*120+2*u*t*255+t*t*485,u*u*85+2*u*t*225+t*t*295];})}];
  if(type==='stock')return [{kind:'curve',points:[[112,260],[210,234],[300,203],[387,176],[472,147]]},
   {kind:'curve',points:[[112,270],[210,270],[210,245],[300,245],[300,224],[387,224],[387,210],[472,210]]}];
  const all=[{kind:'demand',points:demand},{kind:'supply',points:supply}];
  if(type==='along')return all.slice(0,1);
  if(type==='demand')return all.slice(0,1);
  if(type==='supply')return all.slice(1);
  return all;
 };
 function nearest(svg,event,chart){
  if(!svg||!event||!chart)return null;
  const rect=svg.getBoundingClientRect?.(),p=boxPoint(event,rect);if(!p)return null;
  const threshold=event.pointerType==='mouse'?20:35;
  const allowed=polylines(chart).map(x=>x.kind);
  let best=null;
  // Sample the rendered path when the browser provides its geometry. CSS transforms
  // are included by getScreenCTM, so old and new line positions are both hit-testable.
  const paths=Array.from(svg.querySelectorAll?.('.ck21-curve')||[]);
  for(let pathIndex=0;pathIndex<paths.length;pathIndex++){
   const path=paths[pathIndex];
   if(path.closest?.('.ck149-previous-curves'))continue; // Ghost is read-only.
   const kind=chart.type==='elasticity'||chart.type==='distance'||chart.type==='stock'?'curve':
    path.classList?.contains?.('supply')?'supply':'demand';
   if(!allowed.includes(kind))continue;
   if(!path.getTotalLength||!path.getPointAtLength||!path.getScreenCTM)continue;
   try{
    const length=path.getTotalLength(),m=path.getScreenCTM();
    if(!(length>0)||!m)continue;
    const convert=u=>{const point=path.getPointAtLength(length*u);
      return [m.a*point.x+m.c*point.y+m.e,m.b*point.x+m.d*point.y+m.f]};
    let a=convert(0);
    for(let i=1;i<=56;i++){
     const b=convert(i/56),d=segdist(event.clientX,event.clientY,a,b);
     if(!best||d<best.distancePx)best={kind,distancePx:d,pathIndex};
     a=b;
    }
   }catch{}
  }
  // Static fallback supports older SVG implementations and deterministic tests.
  if(!best){
   for(const [pathIndex,line] of polylines(chart).entries()){
    let a=line.points[0];
    for(let i=1;i<line.points.length;i++){
     const b=line.points[i],d=segdist(p.x,p.y,a,b)*p.scale;
     if(!best||d<best.distancePx)best={kind:line.kind,distancePx:d,pathIndex};
     a=b;
    }
   }
  }
  if(!best||best.distancePx>threshold)return null;
  return {...best,pointerX:p.x,pointerY:p.y};
 }
 /* v156: slope is an SVG-coordinate visual parameter, not an elasticity
  * coefficient or measured change in market prices. Separate from translation.
  * Keep the original center fixed when tilting a line so the learner can
  * distinguish a pivot from a parallel shift.
  */
 const BASE_CURVES=Object.freeze({
  demand:Object.freeze({x1:100,y1:86,x2:485,y2:286}),
  supply:Object.freeze({x1:110,y1:300,x2:480,y2:80})
 });
 const slopePercent=(snapshot,target)=>clamp(Number(snapshot?.[target+'Slope']??100),55,160);
 function curveGeometry(target,snapshot){
  const b=BASE_CURVES[target];if(!b)return null;
  const f=slopePercent(snapshot,target)/100;
  const cx=(b.x1+b.x2)/2,cy=(b.y1+b.y2)/2;
  const y1=cy+(b.y1-cy)*f,y2=cy+(b.y2-cy)*f;
  return {x1:b.x1,y1,x2:b.x2,y2,
   cx,cy,slope:(y2-y1)/(b.x2-b.x1),factor:f,
   d:'M '+b.x1+' '+y1.toFixed(2)+' L '+b.x2+' '+y2.toFixed(2)};
 }
 function adjustSlope(snapshot,chart,target,deltaPercent){
  if(!snapshot||!chart||!Number.isFinite(deltaPercent)||
   !['demand','supply','both'].includes(chart.type))return null;
  const kind=chart.type==='both'?(target==='supply'?'supply':'demand'):chart.type;
  const next=copy(snapshot);
  next[kind+'Slope']=Math.round(slopePercent(snapshot,kind)+deltaPercent);
  next[kind+'Slope']=clamp(next[kind+'Slope'],55,160);
  return next;
 }
 function drag(snapshot,chart,kind,start,event,rect){
  const p=boxPoint(event,rect),first=boxPoint(start,rect);
  if(!p||!first||!snapshot)return null;
  const dx=p.x-first.x,dy=p.y-first.y;
  if(kind==='slope-demand'||kind==='slope-supply'){
   const target=kind.slice(6);
   // The slope handle is at the right endpoint: screen Y changes represent
   // a pivot about the original curve center, never a parallel translation.
   const delta=(target==='demand'?dy:-dy)*100/
    (target==='demand'?100:110);
   return adjustSlope(snapshot,chart,target,delta);
  }
  if(chart.type==='demand'||chart.type==='supply'||chart.type==='both'){
   const target=chart.type==='both'?(kind==='supply'?'supply':'demand'):chart.type;
   const slope=target==='supply'?-220/370:200/385;
   const delta= Math.abs(dx)>=Math.abs(dy)*.6?dx:-dy/slope;
   const factor=100/Math.max(1,Math.abs(Number(chart.shift)||65));
   const original=chart.type==='both'?snapshot[target]:snapshot.value;
   const origSign=chart.type==='both'?snapshot[target+'Sign']:snapshot.sign;
   const signed=clamp(origSign*original+delta*factor,-100,100);
   const sign=signed<0?-1:signed>0?1:origSign;
   const value=round(Math.abs(signed)),next=copy(snapshot);
   if(chart.type==='both'){
    next[target]=value;next[target+'Sign']=sign;next.value=Math.max(next.demand,next.supply);
   }else{next.value=value;next.sign=sign;next[target]=value;next[target+'Sign']=sign;}
   return next;
  }
  // All other figures have movable observation points, not fabricated
  // slope/elasticity changes. Vertical gestures are available for S Pen.
  const delta=Math.abs(dx)>=Math.abs(dy)*.7?dx/320*100:-dy/215*100;
  return {...snapshot,value:round(snapshot.value+delta)};
 }
 /* v155: signed, accessible schematic-step controls (not market statistics). */
 function nudge(snapshot,chart,target,step){
  if(!snapshot||!chart||!Number.isFinite(step))return null;
  const next=copy(snapshot),amount=clamp(step,-100,100);
  if(['demand','supply','both'].includes(chart.type)){
   const which=chart.type==='both'?(target==='supply'?'supply':'demand'):chart.type;
   const previous=(next[which+'Sign']||next.sign||direction(chart))*(next[which]||0);
   const signed=clamp(previous+amount,-100,100);
   const sign=signed<0?-1:signed>0?1:next[which+'Sign']||next.sign||direction(chart);
   next[which]=round(Math.abs(signed));next[which+'Sign']=sign;
   if(chart.type==='both')next.value=Math.max(next.demand,next.supply);
   else{next.value=next[which];next.sign=sign}
  }else next.value=round(next.value+amount);
  return next;
 }
 function offsets(chart,s){
  const extent=Math.abs(Number(chart.shift)||55);
  if(chart.type==='demand')return {demand:s.sign*s.value/100*extent,supply:0};
  if(chart.type==='supply')return {demand:0,supply:s.sign*s.value/100*extent};
  if(chart.type==='both')return {demand:s.demandSign*s.demand/100*extent,supply:s.supplySign*s.supply/100*extent};
  return {demand:0,supply:0};
 }
 function equilibrium(d,s,state){
  const D=curveGeometry('demand',state),S=curveGeometry('supply',state);
  // In screen coordinates: y=cy+m*(x-cx-dx). Recompute the actual crossing
  // after a slope pivot; do not keep using a hard-coded baseline intersection.
  const x=(S.cy-D.cy+D.slope*(D.cx+d)-S.slope*(S.cx+s))/(D.slope-S.slope);
  return {x,y:D.cy+D.slope*(x-D.cx-d)};
 }
 function outcome(chart,s){
  const shift=offsets(chart,s),start=equilibrium(0,0),
   end=equilibrium(shift.demand,shift.supply,s);
  // Ignore sub-pixel intersection noise introduced by diagram rounding.
  const name=n=>n>1?'증가':n< -1?'감소':'불변';
  const demandSlope=slopePercent(s,'demand'),supplySlope=slopePercent(s,'supply');
  return {demand:shift.demand,supply:shift.supply,start,end,
   quantity:name(end.x-start.x),price:name(start.y-end.y),
   demandSlope,supplySlope,
   slopeChanged:demandSlope!==100||supplySlope!==100,
   schematic:true};
 }
 /* Observation-only charts must teach the right relationship. Do not
  * suggest an equilibrium price when the figure is PV, rent, policy or stock.
  * The marker percentage is merely lesson progress, never observed data.
  */
 const OBSERVATION_LESSONS=Object.freeze({
  'price-along':[
   '재화 자신의 가격만 달라지면 수요곡선은 그대로이며, 곡선 위의 수요량만 이동합니다.',
   '다른 조건이 같을 때 수요법칙에서 가격과 수요량은 역방향입니다. 재화의 가격 자체 변화는 수요의 증가(곡선 이동)와 구별합니다.',
   '기출 함정: 가격 하락에 따른 수요량 증가를 수요곡선 자체가 우측 이동했다고 답하지 않습니다.'
  ],
  'elasticity':[
   '같은 가격 변화라도 소비자가 얼마나 크게 반응하는지 비교하는 그림입니다. 선이 가파른지로 정확한 탄력성을 읽을 수는 없습니다.',
   '가격탄력성 Ed=(수요량 변화율)/(가격 변화율)의 절댓값으로 비교합니다. 곡선 기울기는 좌표 단위에 따라 달라집니다.',
   '기출 함정: 기울기 숫자 하나만 보고 탄력적·비탄력적이라고 확정하지 않습니다.'
  ],
  'ceiling':[
   '최고가격이 시장균형보다 낮게 묶이면 사고 싶은 양이 팔려는 양보다 많아 부족이 생길 수 있습니다.',
   '수요·공급의 다른 조건이 같을 때 실효성 있는 최고가격제는 P상한 < P균형, Qd > Qs가 됩니다. 상한이 균형 이상이면 비구속적일 수 있습니다.',
   '기출 함정: 모든 최고가격제가 반드시 초과수요를 만든다고 단정하면 안 됩니다.'
  ],
  'cobweb':[
   '농산물처럼 생산 결정부터 공급까지 시차가 있으면 지난 가격을 참고해 생산량이 정해질 수 있습니다.',
   '단순 거미집모형은 당기 공급이 전기 가격에 반응하고 가격 조정이 시차를 가집니다. 조정 경로의 수렴·발산은 수요·공급 기울기 관계에 좌우됩니다.',
   '기출 함정: 시차가 있다는 사실만으로 반드시 수렴하거나 발산한다고 판단하지 않습니다.'
  ],
  'rent-distance':[
   '도심과 멀수록 접근성이 떨어져 지불하려는 지대가 낮아지는 전형적인 예시입니다.',
   '입찰지대곡선은 거리 증가에 따른 통근·운송비 부담과 접근 편익의 변화를 반영합니다. 동일 조건의 단순 모델에서 거리가 커지면 지대는 낮아질 수 있습니다.',
   '기출 함정: 실제 도시의 모든 지역에서 지대가 거리 하나만으로 결정된다고 단정하지 않습니다.'
  ],
  'present-value':[
   '같은 미래 금액을 받더라도 할인율이 높아질수록 오늘의 가치는 줄어듭니다.',
   '미래가치 FV>0, 기간 n>0일 때 현재가치 PV=FV/(1+r)^n. 나머지 조건이 같으면 할인율 r 증가와 현재가치 PV는 반대 방향입니다.',
   '기출 함정: 할인율과 미래금액을 동시에 바꾸어 놓고 할인율 효과만이라고 단정하지 않습니다.'
  ],
  'stock-flow':[
   '현재 쌓여 있는 주택 수는 저량, 일정 기간 새로 공급된 주택 수는 유량입니다.',
   '저량의 단위는 특정 시점의 잔고이고 유량의 단위는 기간당 크기입니다. 재고 변화 = 유입 - 유출(같은 기간 기준)처럼 시간 차원을 맞추어야 합니다.',
   '기출 함정: 재고주택과 연간 신축량을 같은 단위인 것처럼 단순 비교하지 않습니다.'
  ],
  'cap-rate':[
   '수익이 그대로라면 환원율이 높아질수록 수익가격은 낮아집니다.',
   '직접환원법에서 수익가격 V=NOI/R. NOI>0, R>0이면 환원율 R과 수익가격 V는 반비례합니다. NOI가 함께 변하면 한 변수의 효과만으로 결론 내리지 않습니다.',
   '기출 함정: 소득·순영업소득이 고정됐다는 조건을 먼저 확인합니다.'
  ],
  'huff':[
   '점포의 매력도가 같다면 멀리 있는 점포는 가까운 점포보다 선택하기 어려운 경향이 있습니다.',
   '허프모형은 점포별 매력도와 거리저항을 통해 각 점포의 상대적 선택확률을 정합니다. 실제 확률은 경쟁 점포 전체의 유인력에도 좌우됩니다.',
   '기출 함정: 거리 하나만으로 실제 방문확률을 계산하거나 확정하지 않습니다.'
  ]
 });
 function explainObservation(chart,s){
  const base=OBSERVATION_LESSONS[chart.id]||
   ['선 위의 관찰점을 조작하면서 관계를 비교합니다.',
    '이 도식은 방향·조건 비교를 위한 학습 그림이며 실제 시장 데이터의 측정치가 아닙니다.',
    '원본 문항의 전제조건을 먼저 확인하고 도식 진행률을 실제 변화율로 읽지 않습니다.'];
  const progress=round(s.value),changed=progress>0;
  const baseline=(chart.title?'「'+chart.title+'」 관찰. ':'')+
   (chart.question?'기존 질문: '+chart.question+' ':'')+
   (chart.answer?'기존 학습 답: '+chart.answer+' ':'');
  return {action:changed?'곡선 위 관찰점 이동':'관찰 시작 전',
   moved:changed,tilted:false,shifted:'관찰점 '+progress+' / 100 단계',
   slope:'관찰 진행률은 실제 가격·수익률·거래량 변화율이 아닙니다.',
   equilibrium:'교점 변화를 계산하는 도식이 아닙니다.',
   easy:base[0]+' '+(changed?'움직인 지점과 처음 지점을 비교하세요.':'관찰점을 움직여 변화를 확인하세요.'),
   advanced:base[1],
   exam:baseline+base[2],
   original:'관찰 시작점',now:'관찰 단계 '+progress,schematic:true};
 }
 function explain(chart,s){
  if(!chart||!s)return null;
  if(!['demand','supply','both'].includes(chart.type))
   return explainObservation(chart,s);
  const out=outcome(chart,s),shift=offsets(chart,s);
  const slopeD=out.demandSlope,slopeS=out.supplySlope;
  const activeD=Math.abs(shift.demand)>1e-3,activeS=Math.abs(shift.supply)>1e-3;
  const verb=n=>n>0?'오른쪽 증가':n<0?'왼쪽 감소':'위치 유지';
  const moved=activeD||activeS;
  const shifted='수요 D는 '+verb(shift.demand)+', 공급 S는 '+verb(shift.supply);
  const tilted=out.slopeChanged;
  const action=!moved&&!tilted?'원래 조건 그대로':
   (moved?'평행이동':'')+(moved&&tilted?' + ':'')+(tilted?'기울기 변경':'');
  const outcomeText='도식상 균형가격 '+out.price+' · 균형거래량 '+out.quantity;
  const simple=(!moved&&!tilted?
    '이전 E₀와 현재 E₁이 같습니다. 조건을 하나씩 변경해 결과를 비교하세요.':
    (moved?'곡선 위치가 변하면 두 곡선이 만나는 위치도 달라집니다. '+
      shifted+'. '+outcomeText+'. ':
      '곡선의 중앙 위치는 고정하고 끝점을 기울였습니다. 같은 가로 이동에 대한 세로 반응이 달라집니다. ')+
     (tilted?'기울기를 바꿨다고 자동으로 수요량이나 공급량이 증가했다는 뜻은 아닙니다. ':
      '기울기는 그대로이므로 선 전체가 같은 방향으로 평행하게 움직입니다. '));
  const concept='수요의 소득·인구·대체재 변화나 공급의 생산비·기술 변화는 '+
   '곡선 자체의 이동을 설명할 수 있습니다. 해당 재화 자체의 가격 변화는 '+
   '기존 곡선 위 이동이며, 별도의 원인 없이 곡선이 평행이동했다고 보지 않습니다.';
  const baselineExample=(chart.title?'「'+chart.title+'」 예시. ':'')+
   (chart.question?'기본 질문: '+chart.question+' ':'')+
   (chart.answer?'원래 조건의 학습 설명: '+chart.answer+' ':'');
  const exerciseCaution=moved||tilted?
   '지금 사용자가 직접 만든 도식은 원래 예시 조건과 다를 수 있으므로, '+
   '원래 조건에서의 답을 현재 변형 상황에 그대로 적용하지 마세요. ':'';
  const directionalRule=tilted?
   '기울기까지 변경했으므로 가격·수량 방향은 두 직선의 새 교점을 계산해야 합니다. ':
   (activeD&&!activeS?
    '공급 불변의 수요 증가면 균형가격·수량이 함께 증가하고, 수요 감소면 함께 감소합니다. ':
    activeS&&!activeD?
    '수요 불변의 공급 증가면 균형가격은 하락·수량은 증가하고, 공급 감소면 반대로 움직입니다. ':
    activeD&&activeS?
    '수요와 공급이 같이 이동하면 가격 변화 방향은 상대적 크기에 따라 달라집니다. ':
    '한 변수씩 바꾸어 원래 조건과 비교하는 연습입니다. ');
  const slope='도식의 D선 기울기 '+slopeD+'%, S선 기울기 '+slopeS+
   '% (원본 그림 기울기 100 기준, 실제 수요·가격 변화율이 아님).';
  const advanced='선형 도식에서 균형은 D(P,Q)와 S(P,Q)가 만나는 교점이며 '+
   '각 직선의 기울기·절편·평행이동 폭을 반영해 다시 계산합니다. '+slope+' '+
   '경제학적 가격탄력성은 (수량 변화율)/(가격 변화율)로 계산합니다. '+
   '기울기 또는 기울기 변경 % 하나만으로 탄력성을 확정할 수 없습니다. '+
   '두 곡선이 동시에 움직이거나 기울기도 바뀌면 한쪽 조건만의 효과로 결과를 일반화하면 안 됩니다.';
  return {action,moved,tilted,shifted,slope,equilibrium:outcomeText,
   easy:simple+' '+directionalRule,advanced,
   exam:baselineExample+exerciseCaution+concept,
   original:'E₀: '+out.start.x.toFixed(1)+','+out.start.y.toFixed(1),
   now:'E₁: '+out.end.x.toFixed(1)+','+out.end.y.toFixed(1),
   schematic:true};
 }
 return Object.freeze({SIZE,round,direction,defaultSnapshot,copy,same,timeline,
  boxPoint,polylines,nearest,drag,nudge,adjustSlope,slopePercent,
  curveGeometry,offsets,equilibrium,outcome,explain});
});