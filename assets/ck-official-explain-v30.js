/* ConceptKnot v30 — source-bound first batch of official question analyses.
   Only hand-authored draft entries are present. No guessed explanations.
   This is intentionally independent of the user's saved answers/notes. */
(function(){
'use strict';
const seeds=Object.freeze({
 '2025-9':{
  concept:'수요·공급 동시 이동',level:'draft',
  easy:'공급이 줄면 가격이 올라갑니다. 동시에 수요가 조금 늘어도, 공급 감소 폭이 더 크면 거래량은 줄어듭니다.',
  logic:'공급곡선의 왼쪽 이동이 수요곡선의 오른쪽 이동보다 클 때 가격은 상승하고 거래량은 감소합니다. 주어진 기울기 절댓값 1 조건으로 두 변화 폭을 비교하세요.',
  options:[
   '두 곡선이 오른쪽으로 이동하여 거래량이 증가합니다.',
   '수요 감소 폭이 더 크면 가격이 내려갑니다.',
   '공급 감소 폭이 수요 증가 폭보다 커 거래량이 감소하고 가격은 상승합니다.',
   '공급 증가와 수요 감소는 가격을 내리는 방향입니다.',
   '공급 증가 폭이 더 크면 가격은 내려가고 거래량은 증가합니다.'
  ],
  trap:'가격 상승만 보고 거래량의 증감을 단정하면 안 됩니다.',
  conceptIds:['estate.supply-demand.simultaneous']
 },
 '2025-11':{
  concept:'개별 수요의 수평 합산',level:'draft',
  easy:'시장수요량은 같은 가격에서 A가 사는 수량과 B가 사는 수량을 더한 값입니다.',
  logic:'A: Q=100−P, B: Q=(100−P)/2. 시장 Q=150−1.5P이므로 P=100−(2/3)Q입니다.',
  options:[
   '개별 수요량을 합산해 역함수로 바꾸면 P=100−(2/3)Q입니다.',
   'Q를 P로 정리할 때 분모·계수의 역수를 잘못 적용했습니다.',
   '두 사람의 가격절편 100을 더하는 것이 아닙니다.',
   '가격절편 200과 기울기 모두 계산 결과에 맞지 않습니다.',
   '같은 가격에서 수량을 더하지 않아 절편과 기울기가 맞지 않습니다.'
  ],
  trap:'가격(P)이 아니라 수요량(Q)을 같은 가격에서 합산해야 합니다.',
  conceptIds:['estate.demand.horizontal-sum']
 },
 '2025-12':{
  concept:'수요의 가격탄력성',level:'draft',
  easy:'가격이 5% 내려가고 탄력성이 1.6이면, 수요량은 1.6 × 5% = 8% 늘어납니다.',
  logic:'탄력성은 변화율의 비입니다. 수요의 가격탄력성을 절댓값으로 주었으므로 1.6×5%=8%이고, 가격 하락일 때 우하향 수요곡선의 수요량은 증가합니다.',
  options:[
   '4%는 1.6 × 5%가 아니므로 크기가 다릅니다.',
   '4%라는 크기도 틀리고 가격이 떨어질 때 수요량이 하락한다는 방향도 틀립니다.',
   '수요량 증가 방향은 맞지만 6%가 아니라 8%입니다.',
   '6%라는 크기가 틀리고 수요량 방향도 반대입니다.',
   '8% 증가가 크기와 방향 모두 일치합니다.'
  ],
  trap:'탄력성 절댓값(크기)과 수요량의 증감 방향을 따로 판단하세요.',
  conceptIds:['estate.elasticity.demand']
 },
 '2025-21':{
  concept:'최고가격제와 초과수요',level:'draft',
  easy:'임대료 120만원을 수요식과 공급식에 각각 대입합니다. 원하는 집 760호에서 나오는 집 580호를 빼면 부족한 180호입니다.',
  logic:'Qd=1,000−2×120=760, Qs=100+4×120=580. 초과수요량=760−580=180호.',
  options:[
   '100호는 수요량과 공급량의 차 180호와 다릅니다.',
   '120은 임대료이지 초과수요량이 아닙니다.',
   '150호는 수요량·공급량을 대입한 결과와 다릅니다.',
   '760호−580호=180호이므로 정답입니다.',
   '200호는 계산된 초과수요량이 아닙니다.'
  ],
  trap:'가격상한 수치 자체를 정답으로 고르지 말고 두 함수를 모두 계산하세요.',
  conceptIds:['estate.price-ceiling.shortage']
 }
});
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let dialog,trigger=null;
function ensure(){
 if(dialog)return dialog;
 dialog=document.createElement('dialog');
 dialog.id='ck30-analysis-dialog';dialog.setAttribute('aria-labelledby','ck30-analysis-heading');
 document.body.append(dialog);
 dialog.addEventListener('click',e=>{
  if(e.target.closest('[data-ck30-analysis-close]')){dialog.close();return}
  if(e.target===dialog)dialog.close();
 });
 dialog.addEventListener('close',()=>{trigger?.focus?.();trigger=null});
 return dialog;
}
function open(year,number,button){
 if(year<2021||year>2025||number<1||number>80)return;
 const id=year+'-'+number,source=window.RECALL_OFFICIAL?.[id],draft=seeds[id];
 const finalKeys=Array.isArray(source?.correct)?source.correct:[];
 const trustworthy=source?.verified===true&&finalKeys.length>0;
 const options=draft?.options||[];
 const modal=ensure();trigger=button||document.activeElement;
 const title=escape(year+'년 '+number+'번');
 const yes=trustworthy?finalKeys.length===5?'전원정답 처리':finalKeys.map(v=>v+'번').join(' 또는 '):'공식 최종정답 확인 필요';
 const rationales=draft&&trustworthy&&options.length===5;
 const sourceLink=source?.originalUrl||'https://www.q-net.or.kr/cst003.do?gId=08&gSite=L&id=cst00309';
 modal.innerHTML='<div class="ck30-analysis-head"><div><small>공식 기출 · 해설 초안</small><h2 id="ck30-analysis-heading">'+title+' · '+escape(draft?.concept||'개념 해설 준비 중')+'</h2></div><button type="button" data-ck30-analysis-close aria-label="해설 닫기">×</button></div>'+
 '<p class="ck30-analysis-key">A형 최종정답: <strong>'+escape(yes)+'</strong></p>'+
 (rationales?'<p><strong>쉬운 설명</strong></p><p>'+escape(draft.easy)+'</p><p><strong>왜 정답인가</strong></p><p>'+escape(draft.logic)+'</p>'+
 '<h3>선지별 판단 근거</h3><ol class="ck30-analysis-options">'+options.map((why,i)=>'<li><b class="'+(finalKeys.includes(i+1)?'right':'wrong')+'">'+(i+1)+'번 · '+(finalKeys.includes(i+1)?'정답':'오답')+'</b><span>'+escape(why)+'</span></li>').join('')+'</ol>'+
 '<p class="ck30-analysis-trap"><strong>함정 정리</strong> '+escape(draft.trap)+'</p>':
 '<p>이 문항은 개념·선지별 해설 검수를 진행할 예정입니다. 공식 정답 번호는 표시하지만, 근거가 검증되지 않은 해설은 생성하지 않습니다.</p>')+
 '<p class="ck30-analysis-notice">해설 상태: '+(rationales?'학습용 초안 · 추가 검수 필요':'해설 작성 대기')+' · 해당 연도 시험 기준. 현행 법령·판례 적용은 별도 확인하세요.</p>'+
 '<a class="ck30-analysis-source" href="'+escape(sourceLink)+'" target="_blank" rel="noopener noreferrer">Q-Net 공식 출처 확인 ↗</a>';
 if(!modal.open)modal.showModal();
}
document.addEventListener('click',e=>{
 const btn=e.target.closest('[data-ck30-analysis]');if(!btn)return;
 open(Number(btn.dataset.ck30Year),Number(btn.dataset.ck30Analysis),btn);
});
window.CK30Analysis=Object.freeze({open,getInfo:()=>({yearRange:'2021–2025',draftCount:Object.keys(seeds).length,ids:Object.keys(seeds)})});
})();
