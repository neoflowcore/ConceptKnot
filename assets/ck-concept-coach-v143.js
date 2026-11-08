/* ConceptKnot P6-B-2 v143 · deterministic intuitive concept coach.
 * Explanation rules are educational examples, not reviewed official exam answers.
 * Pure functions: no DOM, local storage, network or fabricated citations.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.CK143ConceptCoach=api;
})(typeof window==='object'?window:null,function(){
 'use strict';
 const EPS=.000001;
 const n=v=>Number(v);
 const sign=v=>v>EPS?'증가':v< -EPS?'감소':'불변';
 const direction=(v,plus,minus)=>v>EPS?plus:v< -EPS?minus:'변화 없음';
 const diff=(a,b)=>n(b)-n(a);
 const mk=(tag,kind,summary,example,caution,detail='')=>Object.freeze({tag,kind,summary,example,caution,detail});
 function market(topic,before,after,action,math,oldRelation=null,newRelation=null){
  if(topic==='relation'){
   if(!newRelation||!oldRelation)return mk('정비례 · 반비례','neutral','x가 증가하면 정비례 값은 커지고, 같은 계수에서는 반비례 값은 작아집니다.',
    '정비례: 같은 단가에서 수량이 늘면 총비용이 증가합니다. 반비례: 총 작업량을 고정하면 인력이 늘수록 1인당 작업량은 줄어듭니다.',
    '비례는 y/x 일정, 반비례는 x·y 일정입니다.');
   const changedX=diff(oldRelation.x,newRelation.x),changedK=diff(oldRelation.k,newRelation.k);
   if(Math.abs(changedK)>EPS)
    return mk('비례계수 변경','structure','비례관계의 계수 k를 바꾸었습니다. 곡선 자체가 달라지므로 x만 변한 경우와 구별하세요.',
     '한 개당 가격(계수)이 오르면 같은 수량에서도 총액이 달라집니다.',
     'k와 x를 함께 바꾸면 y의 증가·감소는 계산으로 확인해야 합니다.');
   if(Math.abs(changedX)<EPS)return mk('정비례 · 반비례','neutral','점을 끌어서 x를 바꾸어 보세요. 두 관계의 방향이 반대로 나타납니다.',
    '같은 비용 총액을 여러 명이 나누면 1인당 비용은 낮아지는 예시입니다.','비례는 일정한 비율, 반비례는 일정한 곱을 뜻합니다.');
   return mk(changedX>0?'x 증가 → 결과 반대':'x 감소 → 결과 반대','movement',
    '계수 k를 고정하고 x를 '+(changedX>0?'높이자 정비례 y는 증가하고 반비례 y는 감소':'낮추자 정비례 y는 감소하고 반비례 y는 증가')+'했습니다.',
    '정비례: 같은 가격으로 물건을 더 사면 총액이 늘어납니다. 반비례: 같은 일을 더 많은 사람이 나누면 1인당 작업량은 줄어듭니다.',
    '정비례 y/x=k와 반비례 x·y=k가 유지되는지 확인하세요.');
  }
  if(!before||!after||!math)return mk('개념을 선택하세요','neutral','곡선이나 점을 직접 드래그하세요.','생활 예시가 여기에 나타납니다.','다른 조건이 같은지 먼저 확인하세요.');
  const du=diff(before.u,after.u),dv=diff(before.v,after.v);
  const db=diff(before.b,after.b),ds=diff(before.d,after.d);
  const priceMove=diff(before.price,after.price);
  let choice;
  if(Math.abs(priceMove)>EPS&&Math.abs(du)<EPS&&Math.abs(dv)<EPS&&Math.abs(db)<EPS&&Math.abs(ds)<EPS){
   choice=mk(priceMove<0?'수요량 증가':'수요량 감소','movement',
    '상품 자신의 가격만 '+(priceMove<0?'내렸습니다. 같은 수요곡선 위에서 수요량이 증가':'올렸습니다. 같은 수요곡선 위에서 수요량이 감소')+'했습니다. 공급량도 같은 공급곡선 위에서 변합니다.',
    '아파트 가격이 낮아져 그 가격에서 구매하려는 수량이 많아진 상황을 떠올리세요.',
    '곡선 자체가 옮겨진 수요 증가와 구별하세요. 선택 가격은 새 균형가격이 아닙니다.');
  }else if(Math.abs(db)>EPS||Math.abs(ds)>EPS){
   choice=mk('기울기 변화','structure',
    '같은 기준 가격을 고정하고 곡선의 기울기를 바꾸었습니다. 직선의 방향과 균형점이 새로 계산됩니다.',
    '구매자가 가격 변화에 더 민감한 시장과 덜 민감한 시장을 비교하는 연습입니다.',
    '기울기와 가격탄력성은 동일하지 않습니다. 탄력성은 기준 가격과 수량에도 좌우됩니다.');
  }else if(Math.abs(du)>EPS&&Math.abs(dv)>EPS){
   const e0=math.solve(before),e1=math.solve(after);
   const p=e0.ok&&e1.ok?sign(e1.price-e0.price):'계산 불가';
   const q=e0.ok&&e1.ok?sign(e1.quantity-e0.quantity):'계산 불가';
   choice=mk('수요·공급 동시 이동','structure',
    '비가격 요인으로 수요와 공급이 동시에 변했습니다. 현재 모형은 균형가격 '+p+', 균형수량 '+q+'로 계산됩니다.',
    '입주 희망자는 늘고 건축 기술도 좋아지는 상황처럼 두 조건이 함께 달라질 수 있습니다.',
    '가격은 반드시 오르거나 내리는 것이 아닙니다. 상대 이동폭과 기울기에 따라 부호가 달라집니다.');
  }else if(Math.abs(du)>EPS){
   choice=mk(du>0?'수요 증가':'수요 감소','structure',
    '자기 가격이 아닌 요인 때문에 수요곡선 전체가 '+(du>0?'오른쪽':'왼쪽')+'으로 이동했습니다. 공급조건은 고정했습니다.',
    du>0?'정상재라고 가정하면 소득 증가로 같은 가격에서 아파트 구매 희망이 늘어나는 예시입니다.':'그 지역의 주거 선호가 감소하여 같은 가격에서 아파트 구매 희망이 줄어드는 예시입니다.',
    '가격 때문에 한 곡선 위의 점이 움직인 수요량 변화가 아닙니다.');
  }else if(Math.abs(dv)>EPS){
   choice=mk(dv>0?'공급 증가':'공급 감소','structure',
    '자기 가격이 아닌 요인 때문에 공급곡선 전체가 '+(dv>0?'오른쪽':'왼쪽')+'으로 이동했습니다. 수요조건은 고정했습니다.',
    dv>0?'건축 기술이 개선되어 같은 가격에서 더 많은 주택을 공급할 수 있는 예시입니다.':'건축비가 상승하여 같은 가격에서 공급하려는 주택 수가 감소하는 예시입니다.',
    '가격 때문에 한 공급곡선 위에서 공급량이 변한 경우와 구별하세요.');
  }else{
   choice=mk('이전 상태와 비교','neutral','D(수요)·S(공급) 선을 옮기거나 가격점을 위아래로 움직여 보세요.',
    '수요 증가에는 구매자의 선호 변화, 공급 감소에는 건축비 상승을 예로 들 수 있습니다.',
    '곡선 전체 이동과 곡선 위 점 이동은 다릅니다.');
  }
  if(topic==='elasticity'){
   const p=math.point(after,after.price);
   if(p.demandElasticity===null)return mk('점탄력성 계산 불가','warning',
    '현재 가격에서 수요량이 양(+)이 아니므로 이 모형의 점탄력성을 계산할 수 없습니다.',
    '구매하려는 수량이 0인 구간에서는 일반적인 비율 비교를 그대로 적용하기 어렵습니다.',
    '수요량 0에서 나누지 않습니다.',choice.summary);
   const magnitude=Math.abs(p.demandElasticity);
   const tag=magnitude>1+EPS?'탄력적':magnitude<1-EPS?'비탄력적':'단위탄력적';
   const rel= magnitude>1+EPS?'가격 1% 변화에 수요량 변화율의 크기가 1%를 넘는 점입니다.':
    magnitude<1-EPS?'가격 1% 변화에 수요량 변화율의 크기가 1%보다 작은 점입니다.':'가격과 수요량의 변화율 크기가 같은 점입니다.';
   return mk(tag,'movement',rel+' 같은 직선이라도 관측하는 점에 따라 달라집니다.',
    '가격에 민감한 소비와 덜 민감한 소비를 비교해 보세요. 이 도식은 실제 품목의 추정 탄력성이 아닙니다.',
    '탄력성은 기울기 자체가 아니며, 수요 점탄력성은 보통 절댓값으로 비교합니다.',choice.summary);
  }
  return choice;
 }
 function theory(id,before,after,models){
  if(!models?.S?.[id]||!before||!after)return mk('모형을 선택하세요','neutral','곡선과 점을 움직여 보세요.','학습 예시는 실제 시장 관측이 아닙니다.','다른 조건을 고정해야 합니다.');
  const changed=Object.keys(models.S[id].f).filter(k=>Math.abs(diff(before[k],after[k]))>EPS);
  const only=k=>changed.length===1&&changed[0]===k;
  const includes=k=>changed.includes(k);
  const z=models.calc(id,after);
  if(!z)return mk('계산 불가','warning','모형의 허용 범위를 벗어났습니다.','변수의 범위를 확인하세요.','계산되지 않은 결과는 주장하지 않습니다.');
  if(!changed.length)return mk('곡선을 직접 움직여 보세요','neutral',
    '선이나 점을 잡아당기면 지금 일어난 변화가 여기에 즉시 나타납니다.',
    '아파트 시장·기업 비용·생산 가능량처럼 모형마다 다른 조건이 작동합니다.',
    '색이 아니라 점선(이전)과 실선(현재)도 함께 비교하세요.');
  if(id==='budget'){
   if(only('I'))return mk(diff(before.I,after.I)>0?'소득 증가 → 평행이동':'소득 감소 → 평행이동','structure',
    '두 상품 가격을 고정하고 소득만 변해 예산선 전체가 '+(after.I>before.I?'바깥':'안쪽')+'으로 평행 이동했습니다.',
    '월 예산이 늘면 두 상품 모두 전보다 더 많이 구매할 수 있는 선택지가 생깁니다.',
    '소득 변화는 예산선 회전이 아닙니다. 가격과 선호는 그대로입니다.');
   if(only('px'))return mk(diff(before.px,after.px)>0?'X 가격 상승 → 회전':'X 가격 하락 → 회전','structure',
    '소득과 Y 가격을 고정하면 X 절편만 '+(after.px>before.px?'작아지고':'커지고')+' Y 절편은 유지됩니다.',
    '커피 가격만 오르면 같은 예산으로 살 수 있는 커피 수량이 줄지만 다른 상품의 최대 수량은 같습니다.',
    'X 가격 변화는 평행이동이 아니라 Y 절편을 축으로 하는 예산선 회전입니다.');
   if(only('py'))return mk(diff(before.py,after.py)>0?'Y 가격 상승 → 회전':'Y 가격 하락 → 회전','structure',
    '소득과 X 가격을 고정하면 Y 절편만 '+(after.py>before.py?'작아지고':'커지고')+' X 절편은 유지됩니다.',
    '영화표 가격만 올라가면 같은 예산으로 살 수 있는 영화표 수량은 줄어듭니다.',
    'Y 가격 변화는 X 절편을 축으로 하는 예산선 회전입니다.');
   if(only('alpha'))return mk('선호 변화 → 최적점 이동','movement',
    '예산선은 그대로인데 두 재화에 대한 선호 비중이 바뀌어 최적 소비점이 이동했습니다.',
    '총 용돈과 물가가 같아도 영화보다 도서를 더 선호하면 소비 조합이 달라질 수 있습니다.',
    '선호가 달라졌다고 예산선 자체가 이동한 것은 아닙니다.');
   return mk('예산·가격 복합 변화','structure','소득과 가격 등 여러 조건이 함께 변했습니다. 절편을 각각 계산해서 이동과 회전을 구분합니다.',
    '월급 증가와 물가 상승이 동시에 일어나면 구매 가능량은 한 방향으로만 단정할 수 없습니다.',
    '한 변수만 바뀐 비교정태와 복합 상황을 구별하세요.');
  }
  if(id==='ppf'){
   if(only('x')||only('u'))return mk(z.message.includes('불가능')?'생산가능영역 밖':z.message.includes('비효율')?'비효율적 생산':'효율적 생산','movement',
    '자원·기술을 고정한 채 생산점의 위치를 옮겼습니다. 현재 위치는 '+z.message+' 상태입니다.',
    '생산 가능한 스마트폰과 컴퓨터 조합을 선택하는 상황이라고 생각해 보세요.',
    '생산점의 이동과 생산가능곡선 자체의 확장은 다릅니다.');
   if(only('xmax')||only('ymax'))return mk('생산능력 변화','structure','한 재화의 최대 생산능력을 바꿔 생산가능곡선 자체가 변했습니다.',
    '새 설비로 스마트폰 생산 가능량이 늘어난 상황을 모델링한 것입니다.',
    '기술 변화·자원 증가와 기존 곡선 위의 생산점 이동은 구분합니다.');
   return mk('PPF 조건 복합 변화','structure','생산능력·기술 조건과 생산점 위치를 동시에 바꿨습니다.',
    '투자와 생산 배분을 동시에 바꾸면 어느 효과가 더 큰지 별도로 비교해야 합니다.',
    '한계 기회비용은 모형의 곡률에 따라 달라집니다.');
  }
  if(id==='cost'){
   if(only('q'))return mk(Math.abs(after.q-z.optimal)<=.5?'이윤극대 생산량':after.q<z.optimal?'생산량 부족':'생산량 과다','movement',
    '현재 생산량 '+after.q+'은(는) 최적 수량 '+z.optimal+'과(와) 비교됩니다. 다른 비용·수요 조건은 고정했습니다.',
    '한 가게가 판매량을 조절하며 추가 매출과 추가 비용을 비교하는 상황입니다.',
    '내점해 MR=MC와 생산하지 않는 경계해 Q=0을 구별해야 합니다.');
   return mk('비용·수요 조건 변화','structure','한계수입·비용의 조건이 달라져 이윤극대 생산량이 다시 계산됩니다.',
    '인건비 상승이나 소비자의 구매 의사가 바뀌면 유리한 생산량이 달라질 수 있습니다.',
    '이 그래프는 단일 생산자 모형입니다. 완전경쟁 P=MC와 혼동하지 않습니다.');
  }
  if(id==='rent')return mk(only('d')?'도심 거리 증가·감소':'입찰지대 조건 변화',only('d')?'movement':'structure',
   only('d')?'도심에서 거리만 '+(after.d>before.d?'늘었습니다.':'줄었습니다.')+' 다른 조건 일정 시 입찰지대는 '+(z.y>=0?'모형에 따라 재계산됩니다.':'0 아래로 내려갈 수 없습니다.'):'거리저항이나 중심지 지대의 조건이 변했습니다.',
   '교통 접근성이 좋은 곳에 더 높은 임대료를 지불하려는 상황을 단순화한 예시입니다.',
   '실제 지대는 용도·대중교통·규제 등을 함께 고려해야 합니다.');
  if(id==='cobweb')return mk(z.message.includes('발산')?'발산하는 가격 경로':z.message.includes('수렴')?'수렴하는 가격 경로':'중립 진동 경로',
   'movement','생산자는 전기 가격을 보고 공급량을 결정합니다. 현재 경로는 '+z.message+'입니다.',
   '작년 가격을 보고 올해 생산량을 정하는 시장처럼 공급에 시차가 있는 모형입니다.',
   '수렴·발산 여부는 |d/b| 기준입니다. 경계값과 음수 가격 중단 여부를 확인하세요.');
  if(id==='arc'){
   if(z.magnitude===null)return mk('호탄력성 계산 불가','warning','두 가격이 같아 가격 변화율로 나눌 수 없습니다.',
    '가격이 바뀌지 않았을 때 수량 변화만으로 가격탄력성을 계산할 수 없습니다.',
    '분모 0인 경우 값을 임의로 출력하지 않습니다.');
   return mk(z.e>0?'수요법칙 확인 필요':z.magnitude>1+EPS?'탄력적':z.magnitude<1-EPS?'비탄력적':'단위탄력적',
    'movement','두 점의 평균 가격·수량을 기준으로 호탄력성을 계산합니다. 현재 절댓값은 '+z.magnitude+'입니다.',
    '동일한 기간에 상품 가격과 구매량이 달라진 상황을 두 점으로 비교합니다.',
    '두 점이 실제로 같은 수요곡선 위에 있다는 가정이 필요합니다. 점탄력성과 구분합니다.');
  }
  return mk('모형 비교','neutral','변수를 직접 변경해 보세요.','모형의 조건을 확인하세요.','공식 기출 해설과 혼동하지 마세요.');
 }
 return Object.freeze({market,theory,sign});
});
