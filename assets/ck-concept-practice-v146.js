/* ConceptKnot v146: deterministic, local-only prediction practice. Never official exam answers. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.CK146ConceptPractice=api;})(typeof window==='object'?window:null,function(){
'use strict';
const CHOICES=Object.freeze(['증가','감소','불변']);
const dir=(a,b)=>b>a+1e-6?'증가':b<a-1e-6?'감소':'불변';
const marketTasks=[
['소득 증가 → 수요 오른쪽 이동','set-demand',20,'ep','균형가격','비가격 요인에 의한 수요 증가이므로 공급곡선 고정 시 균형가격이 오릅니다.'],
['소득 감소 → 수요 왼쪽 이동','set-demand',-20,'eq','균형거래량','수요 감소는 같은 곡선 위의 수요량 감소와 다릅니다.'],
['건축비 상승 → 공급 왼쪽 이동','set-supply',-20,'ep','균형가격','건축비 상승으로 공급이 감소하면 수요 일정 조건에서 균형가격이 상승합니다.'],
['기술 향상 → 공급 오른쪽 이동','set-supply',20,'eq','균형거래량','공급 증가 시 수요 일정 조건에서 균형거래량이 증가합니다.'],
['선은 그대로, 관찰 가격만 상승','change-price-point',5,'qd','동일 수요곡선 위 수요량','가격점만 이동하므로 수요곡선 자체는 움직이지 않습니다.'],
['선은 그대로, 관찰 가격만 하락','change-price-point',-5,'qs','동일 공급곡선 위 공급량','자기 가격이 내려���q�^