/* ConceptKnot v144 P6-B3: shared, accessible before/after semantic view. */
(function(root,factory){
 'use strict';const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.CK144ChangeView=api;
})(typeof window==='object'?window:null,function(){
 'use strict';
 const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function render(v,level='beginner',openOverride){
  if(!v)return '';
  const metrics=Array.isArray(v.metrics)?v.metrics.slice(0,6):[];
  const rows=metrics.map(m=>'<tr><th scope="row">'+escape(m.label)+'</th>'+
   '<td>'+escape(m.before)+'</td><td>'+escape(m.after)+'</td>'+
   '<td class="ck144-change-'+escape(m.change==='증가'?'up':m.change==='감소'?'down':'flat')+'">'+escape(m.change)+'</td></tr>').join('');
  return '<section class="ck144-change-board" aria-label="조작 전후 이론 비교">'+
   '<header class="ck144-board-head"><span>지금 조작한 방식</span>'+
    '<strong data-ck144-operation>'+escape(v.operation)+'</strong>'+
    '<span class="ck144-theory-tag" data-kind="'+escape(v.kind)+'">'+escape(v.tag)+'</span></header>'+
   '<div class="ck145-easy"><strong>쉽게 이해하기 · '+escape(v.tag)+'</strong>'+
    '<p>'+escape(v.example)+'</p><p>'+escape(v.cause)+'</p></div>'+
   '<details class="ck145-deep" '+((openOverride===true||(openOverride===undefined&&level==='advanced'))?'open':'')+'>'+
    '<summary>심화 해설 열기 · 가격·수량·기울기 전후 계산</summary>'+
   '<div class="ck144-before-after">'+
    '<div class="ck144-condition"><span>변경한 조건</span><strong>'+escape(v.changed)+'</strong></div>'+
    '<div class="ck144-condition"><span>그대로 둔 조건</span><strong>'+escape(v.constant)+'</strong></div></div>'+
   (rows?'<div class="ck144-metrics-scroll"><table class="ck144-metrics"><caption>변화 전과 변화 후의 수치 비교</caption>'+
    '<thead><tr><th scope="col">비교 항목</th><th scope="col">전 E₀</th><th scope="col">후 E₁</th><th scope="col">방향</th></tr></thead>'+
    '<tbody>'+rows+'</tbody></table></div>':'')+
   '<div class="ck144-explanations"><p><strong>경제학적 변화 원인</strong> '+escape(v.cause)+'</p>'+
    '<p><strong>연결되는 기본이론</strong> '+escape(v.rule)+'</p>'+
    '<p><strong>생활 속 예시</strong> '+escape(v.example)+'</p>'+
    '<p><strong>기출에서 헷갈리는 점</strong> '+escape(v.trap)+'</p></div>'+
   '<small class="ck144-model-note">'+escape(v.scope||'학습용 예시')+'</small></details></section>';
 }
 return Object.freeze({render});
});
