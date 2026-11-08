/* ConceptKnot v144 P6-B3: before / after economic concept explanation engine.
 * Pure deterministic semantics. Illustrative equations, never official exam explanations.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.CK144ChangeExplain=api;
})(typeof window==='object'?window:null,function(){
 'use strict';
 const EPS=1e-8;
 const digits=(x)=>Number.isFinite(x)?Number(x.toFixed(2)).toLocaleString('ko-KR',{maximumFractionDigits:2}):'계산 불가';
 const sg=x=>x>EPS?'증가':x< -EPS?'감소':'불변';
 const arrow=(x,y)=>digits(x)+' → '+digits(y);
 const row=(label,before,after)=>({label,before:digits(before),after:digits(after),change:Number.isFinite(before)&&Number.isFinite(after)?sg(after-before):'계산 불가'});
 const same=(a,b)=>Math.abs(a-b)<EPS;
 function make(o){
  return Object.freeze({
   tag:o.tag||'변화 관찰',kind:o.kind||'neutral',operation:o.operation||'관찰',
   changed:o.changed||'없음',constant:o.constant||'다른 조건 일정',
   cause:o.cause||'그래프를 조작해 보세요.',rule:o.rule||'곡선과 점의 변화를 비교합니다.',
   example:o.example||'학습용 가상 모형입니다.',trap:o.trap||'다른 조건 일정을 확인하세요.',
   before:(o.before||[]).slice(0,6),after:(o.after||[]).slice(0,6),
   metrics:(o.metrics||[]).slice(0,6),legend:'E₀(변화 전) 점선 · E₁(변화 후) 실선',
   scope:'가상 경제 모형 · 검수된 공식 기출 정답/원문 수치가 아닙니다.'
  });
 }
 const eqRows=(math,before,after)=>{
  const a=math.solve(before),b=math.solve(after);
  return a.ok&&b.ok?[row('균형가격 P*',a.price,b.price),row('균형거래량 Q*',a.quantity,b.quantity)]:[];
 };
 function market(before,after,math,topic='market',relationBefore,relationAfter){
  if(topic==='relation'){
   if(!relationBefore||!relationAfter)return make({tag:'비례·반비례',changed:'관측값',cause:'점 x 또는 계수 k를 변경하세요.',rule:'정비례 y=kx는 비율 일정, 반비례 y=k/x는 곱 일정'});
   const b=math.relation(relationBefore.k,relationBefore.x),a=math.relation(relationAfter.k,relationAfter.x);
   const dx=relationAfter.x-relationBefore.x,dk=relationAfter.k-relationBefore.k;
   return make({tag:Math.abs(dk)>EPS?'비례계수 변경':Math.abs(dx)>EPS?'관측점 이동':'기준 상태',
    kind:Math.abs(dk)>EPS?'structure':'movement',operation:Math.abs(dk)>EPS?'기울기·곡률 변화':'점 이동',
    changed:Math.abs(dk)>EPS?'계수 k':'관측 x',constant:Math.abs(dk)>EPS?'x도 변경되었는지 별도 확인':'계수 k 고정',
    cause:Math.abs(dk)>EPS?'계수 k가 변해 같은 x에서의 결과가 달라졌습니다.':'x만 움직였으므로 같은 계수 아래 정비례·반비례 결과가 반대 방향으로 변합니다.',
    rule:'정비례는 y/x=k, 반비례는 x·y=k. 두 관계의 일정한 값이 다릅니다.',
    example:'가격×수량(정비례)과 고정된 작업량÷인원(반비례)을 생각해 보세요.',
    trap:'x와 k가 동시에 바뀌면 두 결과의 방향을 계산 없이 단정하지 않습니다.',
    metrics:[row('관측값 x',relationBefore.x,relationAfter.x),row('비례계수 k',relationBefore.k,relationAfter.k),
     row('정비례 y',b?.direct,a?.direct),row('반비례 y',b?.inverse,a?.inverse)]});
  }
  if(!before||!after||!math)return make({tag:'그래프를 직접 움직이세요'});
  const du=after.u-before.u,dv=after.v-before.v,db=after.b-before.b,ds=after.d-before.d;
  const priceDelta=after.price-before.price;
  const moved=(key)=>!same(before[key],after[key]);
  const structural=['u','v','a','b','c','d'].some(moved);
  const priceOnly=!structural&&!same(priceDelta,0);
  const shiftDemand=!same(du,0),shiftSupply=!same(dv,0);
  const rotateDemand=!same(db,0),rotateSupply=!same(ds,0);
  let operation='관찰',tag='기준 상태',cause='D 또는 S 선을 잡고 이동하거나 기울기 핸들을 끌어 보세요.';
  let changed='없음',constant='수요·공급 조건 그대로';
  let rule='같은 시장에서 다른 조건을 고정한 비교정태 분석입니다.';
  let trap='그래프상의 도식 값은 실제 시장 수치가 아닙니다.',example='아파트 수요와 공급을 학습용 조건으로 단순화했습니다.';
  let kind='neutral',metrics=eqRows(math,before,after);
  if(priceOnly){
   operation='곡선 위 점 이동';tag='가격 변화 → 수요량·공급량 변화';kind='movement';
   changed='선택한 가격점';constant='수요·공급곡선 전체 고정';
   const p0=math.point(before,before.price),p1=math.point(after,after.price);
   metrics=[row('선택 가격 P',p0.price,p1.price),row('같은 D의 수요량 Qd',p0.qd,p1.qd),
    row('같은 S의 공급량 Qs',p0.qs,p1.qs)];
   cause='가격점만 '+sg(priceDelta)+'했습니다. 그래프의 수요·공급곡선은 변하지 않았습니다.';
   rule='자기 가격이 바뀌면 주어진 곡선 위에서 수요량·공급량이 달라집니다. 새로운 시장균형이 아닙니다.';
   example='주택 가격을 낮추면 같은 수요곡선 위에서 구매하려는 수량은 늘어납니다.';
   trap='가격점은 E₁ 균형점이 아닙니다. 곡선의 평행이동(수요 변화)과 다릅니다.';
  }else if(rotateDemand||rotateSupply){
   operation='기울기 회전';kind='structure';
   tag=rotateDemand&&rotateSupply?'두 곡선 기울기 회전':rotateDemand?'수요곡선 기울기 회전':'공급곡선 기울기 회전';
   changed=(rotateDemand?'수요 가격반응계수 b ':'')+(rotateSupply?'공급 가격반응계수 d':'');
   constant='가격 P=25에서의 해당 곡선 수량 유지(모형의 회전축)';
   cause='기준 가격 P=25에 해당하는 점을 고정하고 선을 회전시켰습니다. 같은 가격의 반응계수가 달라집니다.';
   rule='가로축 Q·세로축 P에서 수요 직선의 기울기는 -1/b, 공급 직선의 기울기는 1/d입니다.';
   example='가격이 조금 변할 때 구매량이 더 크게 움직이는 시장과 덜 움직이는 시장을 비교하는 연습입니다.';
   trap='기울기와 가격탄력성은 다릅니다. 탄력성은 기준점 P와 Q까지 포함해 계산합니다.';
   if(rotateDemand)metrics.push(row('수요 반응계수 b',before.b,after.b));
   if(rotateSupply)metrics.push(row('공급 반응계수 d',before.d,after.d));
   metrics.push(row('기준가격 25에서 Qd',math.point(before,25).qd,math.point(after,25).qd));
   metrics.push(row('기준가격 25에서 Qs',math.point(before,25).qs,math.point(after,25).qs));
  }else if(shiftDemand||shiftSupply){
   operation='곡선 평행이동';kind='structure';
   tag=shiftDemand&&shiftSupply?'수요·공급 동시 이동':shiftDemand?(du>0?'수요 증가':'수요 감소'):(dv>0?'공급 증가':'공급 감소');
   changed=shiftDemand&&shiftSupply?'수요와 공급의 비가격 요인':shiftDemand?'수요의 비가격 요인':'공급의 비가격 요인';
   constant=shiftDemand&&shiftSupply?'곡선의 가격반응계수(b,d) 고정':shiftDemand?'공급곡선과 기울기 고정':'수요곡선과 기울기 고정';
   cause=(shiftDemand?'D '+(du>0?'우측':'좌측')+' 이동. ':'')+(shiftSupply?'S '+(dv>0?'우측':'좌측')+' 이동. ':'')+
    '곡선의 모양은 그대로, 같은 가격에서의 수량이 달라졌습니다.';
   rule='자기 가격이 아닌 소득·취향·건축비 등 조건이 달라지면 곡선 전체가 움직입니다.';
   example=shiftDemand&&shiftSupply?'구매 희망자는 늘고 공급 기술도 개선되는 상황을 함께 비교합니다.':
    shiftDemand?'정상재에서 소득 변화로 같은 가격에서도 구매 희망이 늘거나 줄어드는 예시입니다.':
    '건축비나 기술 조건 변화로 같은 가격에서 공급하려는 주택이 달라지는 예시입니다.';
   trap=shiftDemand&&shiftSupply?'두 곡선이 동시 이동하면 균형가격의 방향은 상대 이동폭·기울기에 따라 달라집니다.':
    '곡선 이동(수요·공급 변화)과 같은 곡선 위 점 이동(수요량·공급량 변화)은 다른 개념입니다.';
   if(shiftDemand)metrics.push(row('수요 이동 u',before.u,after.u));
   if(shiftSupply)metrics.push(row('공급 이동 v',before.v,after.v));
  }else if(structural){
   operation='복합 변화';kind='structure';tag='여러 조건 복합 변화';
   changed='절편·기울기 등 복수 조건';constant='원문 기출과 무관한 가상 수치';
   cause='평행이동과 기울기 변화를 함께 적용했습니다.';
   rule='가격·수량의 총변화를 구해도 어느 원인 때문인지 단순 분리할 수는 없습니다.';
   trap='한 변수만 움직였을 때의 방향을 복합 변화에 그대로 적용하지 마세요.';
  }
  if(topic==='elasticity'){
   const p0=math.point(before,before.price),p1=math.point(after,after.price);
   metrics.push(row('수요 점탄력성 |Ed|',p0.demandElasticity===null?null:Math.abs(p0.demandElasticity),p1.demandElasticity===null?null:Math.abs(p1.demandElasticity)));
   rule+=' 수요 점탄력성 |Ed|=b×P/Qd입니다.';
  }
  return make({tag,kind,operation,changed,constant,cause,rule,example,trap,metrics});
 }
 function theory(id,before,after,models){
  if(!models?.S?.[id]||!models.valid(id,before)||!models.valid(id,after))return make({tag:'학습조건 검토',cause:'유효하지 않은 모형을 계산하지 않습니다.'});
  const changes=Object.keys(models.S[id].f).filter(k=>!same(before[k],after[k]));
  const only=k=>changes.length===1&&changes[0]===k;
  const z0=models.calc(id,before),z1=models.calc(id,after);
  const metrics=[];
  let operation='관찰',tag='기준 상태',kind='neutral';
  let changed=changes.map(k=>models.S[id].f[k][4]).join(' · ')||'없음';
  let constant='이외 조건 일정',cause='선·점·절편을 직접 조작하세요.';
  let rule='기본이론: '+models.S[id].theory+' · '+models.S[id].assumption,example='이 수치는 원리 학습을 위한 가상값입니다.';
  let trap='이 모형의 다른 조건 일정 가정을 확인하세요.';
  if(id==='budget'){
   metrics.push(row('예산선 X절편',z0.ix,z1.ix),row('예산선 Y절편',z0.iy,z1.iy),
    row('예산선 기울기',z0.slope,z1.slope),row('최적 소비 X*',z0.x,z1.x),row('최적 소비 Y*',z0.y,z1.y));
   if(only('I')){
    operation='평행이동';kind='structure';tag=after.I>before.I?'소득 증가 → 예산선 바깥 이동':'소득 감소 → 예산선 안쪽 이동';
    constant='X·Y 가격과 선호 α 고정';cause='소득만 바뀌어 두 절편이 같은 비율로 변하고 예산선 기울기는 그대로입니다.';
    rule='소득 변화는 Px/Py를 바꾸지 않아 예산선의 평행이동을 일으킵니다.';
    example='월 예산이 늘면 같은 물가에서 두 상품을 더 많이 살 수 있습니다.';
    trap='평행이동과 상품 한쪽 가격의 변화에 따른 회전을 구분하세요.';
   }else if(only('px')||only('py')){
    operation='절편 회전';kind='structure';
    const x=only('px'),inc=after[x?'px':'py']>before[x?'px':'py'];
    tag=(x?'X':'Y')+'가격 '+(inc?'상승':'하락')+' → 예산선 회전';
    constant=x?'소득·Y가격 고정, Y절편 고정':'소득·X가격 고정, X절편 고정';
    cause=(x?'X':'Y')+' 가격만 변경되어 '+(x?'X':'Y')+' 절편이 '+(inc?'축소':'확대')+'했습니다.';
    rule='한 상품의 가격 변화는 다른 재화의 절편을 회전축으로 삼는 예산선 회전입니다.';
    example=x?'커피만 비싸지면 같은 예산에서 살 수 있는 커피의 최대 잔 수가 줄어듭니다.':'영화표만 비싸지면 살 수 있는 최대 영화표 수가 줄어듭니다.';
    trap='소득 변화에 의한 평행이동과 동일시하면 안 됩니다.';
   }else if(only('alpha')){
    operation='곡선 위 최적점 이동';kind='movement';tag='선호 변화 → 최적점 이동';
    constant='소득·X/Y 가격·예산선 고정';cause='선호비중만 변하여 최적 소비조합이 이동했습니다.';
    rule='예산제약이 같더라도 효용 함수의 선호 비중이 달라지면 접점이 바뀝니다.';
    trap='선호 변화로 예산선이 이동했다고 표현하지 않습니다.';
   }else if(changes.length){
    operation='복합 변화';kind='structure';tag='소득·가격 복합 변화';
    cause='여러 예산 변수와 절편이 동시에 달라졌으므로 어느 한쪽의 회전/평행이동으로 단정할 수 없습니다.';
   }
  }else if(id==='ppf'){
   metrics.push(row('관찰 생산 X',z0.x,z1.x),row('관찰 생산 Y',z0.y,z1.y),
    row('한계 기회비용',z0.mrt,z1.mrt));
   if(changes.every(k=>['x','u'].includes(k))&&changes.length){
    operation='생산점 이동';kind='movement';tag=z1.message.includes('불가능')?'생산 불가능 영역':z1.message.includes('비효율')?'비효율 생산':'효율 생산';
    constant='생산가능곡선의 위치·기술 조건 고정';
    cause='생산점만 움직여 현재 상태가 '+z1.message+'입니다.';
    rule='곡선 위는 효율적 배분, 안쪽은 비효율, 바깥쪽은 현재 자원으로 생산할 수 없습니다.';
    example='같은 자원으로 X 생산을 늘릴 때 Y를 얼마나 포기해야 하는지 봅니다.';
    trap='생산점 이동은 기술발전으로 PPF 자체가 이동한 것과 다릅니다.';
   }else if(changes.length){operation='생산가능곡선 변형';kind='structure';tag='자원·기술 조건 변화';
    cause='최대 생산량·곡선 곡률이 달라져 생산가능영역의 경계가 변했습니다.';
    rule='자원·기술 변화는 생산가능곡선 전체의 위치/형태에 영향을 줍니다.';
    trap='생산량 배분 변화만으로 곡선이 이동한 것처럼 설명하지 않습니다.';
   }
  }else if(id==='cost'){
   metrics.push(row('관찰 생산 Q',z0.x,z1.x),row('관찰 이윤',z0.profit,z1.profit),
    row('최적 생산량 Q*',z0.optimal,z1.optimal));
   if(only('q')){operation='생산점 이동';kind='movement';tag=Math.abs(after.q-z1.optimal)<=.5?'이윤 극대 생산량':after.q<z1.optimal?'과소 생산':'과다 생산';
    constant='수요·비용함수 고정';cause='생산량만 옮겨 이윤곡선과 MR=MC의 상대 위치를 비교했습니다.';
    rule='내점해에서는 MR=MC인 생산량이 이윤을 최대화합니다. 경계해 Q=0도 별도 고려합니다.';
    example='가게가 생산량을 늘릴 때 추가 수입과 추가 비용을 비교합니다.';
    trap='단일 생산자 MR=MC를 완전경쟁 P=MC와 무조건 같은 식으로 사용하지 않습니다.';
   }else if(changes.length){operation='수입·비용곡선 이동';kind='structure';tag='한계수입·비용 조건 변화';
    cause='한계수입과 비용 조건이 바뀌어 최적 생산량이 새로 계산되었습니다.';
    rule='MR과 MC의 교차점은 생산자의 최적 선택을 결정합니다.';
   }
  }else if(id==='rent'){
   metrics.push(row('거리 d',z0.x,z1.x),row('입찰지대 R',z0.y,z1.y));
   if(only('d')){operation='곡선 위 거리점 이동';kind='movement';tag=after.d>before.d?'도심에서 멀어짐':'도심에 가까워짐';
    constant='거리저항·중심지 입찰지대 고정';cause='거리만 바꾸어 해당 지점의 입찰지대를 비교했습니다.';
    rule='이 단순 모형에서는 거리가 늘수록 입찰지대가 감소합니다(0 하한).';
    example='통근 접근성이 좋은 곳에 더 높은 지대를 지불하려는 예입니다.';
    trap='현실의 지가는 용도·규제·교통·환경 요인이 함께 작용합니다.';
   }else if(changes.length){operation='입찰지대곡선 이동/회전';kind='structure';tag='입찰지대 조건 변화';
    cause='중심지 지대나 거리저항이 변해 지대곡선의 절편·기울기가 달라졌습니다.';
   }
  }else if(id==='cobweb'){
   metrics.push(row('균형가격',z0.eqP,z1.eqP),row('균형수량',z0.eqQ,z1.eqQ),
    row('동학 계수 |d/b|',Math.abs(z0.factor),Math.abs(z1.factor)));
   operation=only('p0')?'초기 가격점 이동':changes.length?'거미집 경로 조건 변화':'관찰';
   tag=z1.message.includes('발산')?'발산하는 가격경로':z1.message.includes('수렴')?'수렴하는 가격경로':'중립 진동 경로';
   kind=only('p0')?'movement':'structure';constant='전기 가격을 보고 차기 공급을 결정';
   cause='새 조건의 공급 시차에 따라 가격·수량의 반복 경로를 계산했습니다.';
   rule='거미집 동학은 |d/b|<1이면 수렴, >1이면 발산, =1이면 중립 진동(음수 가격 등 중단 가능).';
   example='작년 농산물 가격을 보고 올해 재배면적을 선택하는 단순 모형입니다.';
   trap='실제 음수 가격이 나오면 반복이 중지되므로 그 뒤의 경로를 단정하지 않습니다.';
  }else if(id==='arc'){
   metrics.push(row('이전 가격 P1',before.p1,after.p1),row('이후 가격 P2',before.p2,after.p2),
    row('호탄력성 절댓값',z0.magnitude,z1.magnitude));
   operation=changes.length?'두 점 사이 호 변화':'관찰';kind='movement';
   tag=z1.magnitude===null?'호탄력성 계산 불가':z1.magnitude>1+EPS?'탄력적':z1.magnitude<1-EPS?'비탄력적':'단위탄력적';
   constant='두 점이 같은 수요곡선 위에 있다는 가정';
   cause='가격·수량 두 점을 중간값 공식에 넣어 변화율 비율을 계산했습니다.';
   rule='호탄력성은 두 점의 중간값을 기준으로 한 변화율 비율이며, 한 점의 점탄력성과 구별합니다.';
   example='가격 변경 전후의 판매량을 평균 기준으로 비교합니다.';
   trap='다른 요인으로 수요곡선 자체가 이동했다면 두 점을 같은 수요곡선으로 취급할 수 없습니다.';
  }
  return make({tag,operation,kind,changed,constant,cause,rule,example,trap,metrics});
 }
 return Object.freeze({market,theory,row,digits,make});
});
