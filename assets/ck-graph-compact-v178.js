/* ConceptKnot v178 — compact, truthful chart result view.
   Never present SVG coordinates as official exam or measured economic values. */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.CK178GraphCompact=api;
})(typeof window==='object'?window:null,function(){
 'use strict';
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const brief=(v,max=110)=>{const s=String(v??'').replace(/\s+/g,' ').trim();return s.length>max?s.slice(0,max-1).trimEnd()+'…':s};
 const num=n=>Number.isFinite(n)&&n>=0&&n<=200?Number(n).toFixed(1):'도식 밖';
 const metric=(name,a,b,change)=>'<div class="ck178-value"><span>'+esc(name)+'</span><strong>'+
  esc(a)+' <i aria-hidden="true">→</i> '+esc(b)+'</strong>'+(change?'<small>'+esc(change)+'</small>':'')+'</div>';
 function renderLegacy(chart,model,outcome,state){
  if(!chart||!model)return '';
  const market=['demand','supply','both'].includes(chart.type);
  let cards='',headline=brief(model.concept,130);
  if(market&&outcome?.start&&outcome?.end){
   // A fixed, explicitly hypothetical axis calibration. Never a market change percentage.
   const xy=p=>({p:(315-Number(p.y))/5,q:(Number(p.x)-55)/5});
   const e0=xy(outcome.start),e1=xy(outcome.end);
   cards=metric('균형가격 P · 가상단위',num(e0.p),num(e1.p),outcome.price)+
     metric('균형거래량 Q · 가상단위',num(e0.q),num(e1.q),outcome.quantity);
   const conditions=[outcome.demand>0?'수요 증가':outcome.demand<0?'수요 감소':null,
     outcome.supply>0?'공급 증가':outcome.supply<0?'공급 감소':null,
     outcome.slopeChanged?'기울기 변경':null].filter(Boolean).join(' · ');
   headline=(conditions||'원래 조건')+' → 가격 '+outcome.price+' · 거래량 '+outcome.quantity;
  }else if(market){
   cards=metric('균형가격','E₀','조작 후 E₁')+metric('균형거래량','E₀','조작 후 E₁');
  }else{
   const p=Math.max(0,Math.min(100,Math.round(Number(state?.value??0)||0)));
   cards=metric('관찰 위치 · 도식 단계','0',String(p),p?'점 이동':'이동 없음');
  }
  const note=market?
   '가상 예시값: SVG 좌표 x=55, y=315를 기준으로 5칸당 1단위 환산. 실제 시장수치·기출 정답이 아닙니다.':
   '관찰 단계는 실제 가격·수익률·거래량 변화율이 아닙니다.';
  return '<section class="ck178-result" data-ck178-summary role="group" aria-label="차트 조작 전후의 간단한 결과">'+
   '<div class="ck178-values">'+cards+'</div><p class="ck178-change">'+esc(headline)+'</p>'+
   '<p class="ck178-example"><b>예시</b> '+esc(brief(model.example))+'</p>'+
   '<small class="ck178-note">'+esc(note)+'</small></section>';
 }
 return Object.freeze({renderLegacy});
});
