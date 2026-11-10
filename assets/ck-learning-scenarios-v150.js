/* ConceptKnot P6-B v150: five teaching prompts per graph, no official question IDs. */
(function(root,factory){const x=factory();if(typeof module==='object'&&module.exports)module.exports=x;if(root)root.CK150Study=x;})(typeof window==='object'?window:null,function(){
'use strict';
const labels=['생활 예시','반대 상황','기출형 변형','심화 설명','연습 문제'];
const steps=['증가','감소','불변','조건에 따라 다름'];
const legacy={
'price-along':['가격 인하','가격 인상','수요곡선 위 이동','가격 이외의 조건 변화','가격 하락과 수요 증가 구별'],
'demand-income':['정상재 소득 증가','정상재 소득 감소','열등재의 소득 효과','구매력 향상','수요 증가와 수요량 증가 구별'],
'demand-down':['지역 인구 유출','전입 가구 증가','지역 선호 하락','학군 선호 증가','공급을 고정한 수요 변화'],
'demand-substitute':['대체 지역 가격 상승','대체 지역 가격 하락','대체재 교차탄력성','보완재와 구별','대체 교통수단 요금 상승'],
'supply-cost':['건축 자재비 상승','건축비 하락','시공 임금 상승','공사 금융비용 증가','공급원가와 자기 가격 구별'],
'supply-tech':['공법 효율화','설비 고장','모듈러 공법','공급 생산성 저하','같은 가격에서 공급량 변화'],
'equilibrium-demand':['매수자 유입','매수자 감소','주거 선호 증가','주택 수요 감소','다른 조건 일정 검증'],
'equilibrium-supply':['신축 공급 확대','건축비 급등','공급 규제 완화','공급 차질','균형가격과 거래량 비교'],
'both-shift':['수요·공급 동시 증가','수요·공급 동시 감소','수요 증가·공급 감소','수요 감소·공급 증가','이동폭이 서로 다른 경우'],
elasticity:['대체재 많은 상품','필수재','장기·단기 차이','직선 기울기와 점탄력성','같은 가격변화의 다른 반응'],
ceiling:['균형 아래 최고가격','균형 위 최고가격','최고가격 실효성','초과수요 크기','규제 미적용'],
cobweb:['전기 가격에 공급 반응','조정계수 절댓값 감소','가격 진동 발산','수렴·발산 경계','시차에 따른 생산 조정'],
'rent-distance':['도심에서 멀어짐','도심에 가까워짐','교통비 부담 상승','교통 접근성 개선','용도·규제의 예외'],
'present-value':['할인율 상승','할인율 하락','미래 금액 증가','수령 기간 연장','할인율 0'],
'stock-flow':['신규 주택 공급','재고 주택 철거','거래량 증가만 발생','기간 유량과 시점 저량','기말 주택 재고 계산'],
'cap-rate':['환원율 상승','환원율 하락','순영업소득 상승','운영비 상승','환원율 5%와 10% 비교'],
huff:['점포 거리 증가','점포 거리 감소','점포 매력도 증가','경쟁 점포 매력도 증가','거리만으로 확률 확정 불가']
};
const numeric={
market:[['소득 증가','수요 u',20,'set-demand','price'],['소득 감소','수요 u',-20,'set-demand','quantity'],['건축비 상승','공급 v',-20,'set-supply','price'],['생산성 향상','공급 v',20,'set-supply','price'],['가격만 상승','관찰가격',5,'change-price-point','qd']],
elasticity:[['수요 기울기 증가','수요반응 b',.5,'adjust-demand-slope','qd25'],['수요 기울기 감소','수요반응 b',-.5,'adjust-demand-slope','qd25'],['가격점 상승','관찰가격',5,'change-price-point','absEd'],['가격점 하락','관찰가격',-5,'change-price-point','qd'],['공급반응 증가','공급반응 d',.5,'adjust-supply-slope','qs25']],
relation:[['x 증가','관찰 x',.5,'x','direct'],['x 감소','관찰 x',-.5,'x','inverse'],['k 증가','비례계수 k',.5,'k','direct'],['k 감소','비례계수 k',-.5,'k','inverse'],['반비례 x 증가','관찰 x',.5,'x','product']],
budget:[['소득 증가','예산 I',40,'I','ix'],['소득 감소','예산 I',-20,'I','ix'],['X 가격 상승','X 가격',2,'px','ix'],['Y 가격 상승','Y 가격',2,'py','iy'],['X 선호 증가','선호 α',.1,'alpha','x']],
ppf:[['X 생산능력 증가','X 최대',20,'xmax','xmax'],['Y 생산능력 증가','Y 최대',20,'ymax','ymax'],['X 생산량 증가','X 관찰량',10,'x','y'],['가동률 감소','가동률',-.1,'u','y'],['곡선 휨 변화','γ',.2,'gamma','y']],
cost:[['단위비용 증가','단위비용',10,'c','optimal'],['수요 증가','수요 절편',10,'A','optimal'],['고정비 증가','고정비',50,'F','optimal'],['한계비용 상승','k',.1,'k','optimal'],['관찰량 증가','관찰 생산량',10,'q','profit']],
rent:[['도심에서 멀어짐','거리',2,'d','y'],['도심 가까워짐','거리',-2,'d','y'],['도심 지대 상승','중심지 지대',20,'R0','y'],['교통 저항 증가','거리저항',2,'t','y'],['교통 저항 감소','거리저항',-2,'t','y']],
cobweb:[['공급 반응 증가','공급 d',.5,'d','factor'],['공급 반응 감소','공급 d',-.5,'d','factor'],['수요 반응 증가','수요 b',.5,'b','factor'],['기준 수요 증가','수요 a',10,'a','eqP'],['전기 가격 상승','초기 가격',5,'p0','eqP']],
arc:[['후 수요량 증가','후 수량',5,'q2','magnitude'],['후 수요량 감소','후 수량',-5,'q2','magnitude'],['후 가격 상승','후 가격',5,'p2','magnitude'],['전 가격 상승','전 가격',5,'p1','magnitude'],['전 수요량 상승','전 수량',5,'q1','magnitude']]
};
const outcome=(a,b)=>b>a+1e-6?'증가':b<a-1e-6?'감소':'불변';
function calc(id,option,source,math,models){
 const task=numeric[id]?.[option];if(!task)return null;
 const [title,label,delta,control,metric]=task;
 let a,b,original,next,key=control;
 if(['market','elasticity'].includes(id)){
  if(!math||!source)return null;const ops={ 'set-demand':'u','set-supply':'v','change-price-point':'price','adjust-demand-slope':'b','adjust-supply-slope':'d'};
  const target=ops[control];original=math.sanitize(source);
  if(!original)return null;next=math.transition(original,control,original[target]+delta);if(!next)return null;
  const value=s=>{
   const equilibrium=math.solve(s),point=math.point(s,metric.endsWith('25')?25:s.price);
   if(metric==='price')return equilibrium.ok?equilibrium.price:null;
   if(metric==='quantity')return equilibrium.ok?equilibrium.quantity:null;
   if(metric==='qd25'||metric==='qd')return point.qd;
   if(metric==='qs25')return point.qs;
   if(metric==='absEd')return point.demandElasticity==null?null:Math.abs(point.demandElasticity);
   return null;
  };a=value(original);b=value(next);
 }else if(id==='relation'){
  if(!math||!source)return null;original={x:source.x,k:source.k};next={...original,[control]:original[control]+delta};
  if(next.x<.5||next.x>3||next.k<1||next.k>3)return null;
  const value=s=>math.relation(s.k,s.x)?.[metric];a=value(original);b=value(next);
 }else{
  if(!models?.valid(id,source))return null;original={...source};
  next=models.set(id,original,control,original[control]+delta);if(!next)return null;
  const value=s=>metric==='xmax'||metric==='ymax'?s[metric]:
   metric==='factor'?Math.abs(models.calc(id,s)?.factor):models.calc(id,s)?.[metric];
  a=value(original);b=value(next);
 }
 if(!Number.isFinite(a)||!Number.isFinite(b))return null;
 return {id,index:option,title,label,expected:outcome(a,b),before:a,after:b,
  beforeState:original,afterState:next,apply:{scope:id==='relation'||id==='market'||id==='elasticity'?'lab':'theory',topic:id,control,value:next[key]??next[{ 'set-demand':'u','set-supply':'v','change-price-point':'price','adjust-demand-slope':'b','adjust-supply-slope':'d'}[key]],kind:control}};
}
return Object.freeze({labels,steps,legacy,numeric,calc,outcome,size:130});
});