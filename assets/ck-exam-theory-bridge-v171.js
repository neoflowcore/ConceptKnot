/* ConceptKnot v171: canonical exam -> study theory / interactive graph, candidate links only.
 * Pure matching reads the registered question text, never creates verified tags or writes
 * to score/OMR/answer/personally entered notes. UI state is memory-only.
 */
(function(root,factory){
 'use strict';
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root&&typeof root==='object')root.CK171ExamTheoryBridge=api;
})(typeof window==='object'?window:null,function(root){
 'use strict';
 const RULES=Object.freeze([
  {id:'estate.price-ceiling.shortage',subject:'estate',label:'최고가격제·가격상한',
   words:['최고가격제','최고가격','가격상한','초과수요','임대료 상한'],
   easy:'균형보다 낮게 묶인 가격상한은 원하는 수량이 공급 가능한 수량보다 많아지는 부족을 만들 수 있습니다.',
   example:'임대료 상한이 시장균형보다 낮게 정해졌다면, 그 가격에서 수요량과 공급량을 각각 계산하고 차이를 확인합니다.',
   advanced:'초과수요=Qd(상한가격)−Qs(상한가격). 상한이 균형 이상이면 비구속적일 수 있습니다. 가격하한과 혼동하지 마세요.',
   graph:'market',exampleKind:'price'},
  {id:'estate.elasticity.demand',subject:'estate',label:'수요의 가격탄력성',
   words:['가격탄력성','가격 탄력성','수요의 탄력성','점탄력성','호탄력성','탄력성'],
   easy:'가격이 1% 바뀔 때 수요량이 몇 % 반응하는지를 나타냅니다. 곡선의 기울기만으로 판정하지 않습니다.',
   example:'가격이 하락할 때 수요량이 증가하는 방향을 먼저 확인하고, 변화율의 크기를 따로 비교합니다.',
   advanced:'수요 점탄력성=(dQ/dP)×(P/Q). Q=0이면 정의되지 않을 수 있습니다. 점탄력성과 호탄력성을 구분하세요.',
   graph:'elasticity',exampleKind:'slope'},
  {id:'estate.supply-demand.simultaneous',subject:'estate',label:'수요·공급과 시장균형',
   words:['수요와 공급','수요·공급','수요 및 공급','균형가격','균형수량','균형 거래량','초과공급'],
   easy:'자기 가격 변화는 곡선 위 이동이고, 다른 조건 변화는 수요·공급 곡선 자체의 이동입니다.',
   example:'수요가 증가하고 공급이 그대로라면 일반적인 우하향 수요·우상향 공급 모형에서 균형가격·거래량이 함께 상승합니다.',
   advanced:'선형 모형 Qd=a−bP+u, Qs=c+dP+v의 교점을 계산하세요. 수요·공급이 동시에 바뀌면 변화 방향을 크기에 따라 판정합니다.',
   graph:'market',exampleKind:'demand'},
  {id:'estate.land.demand',subject:'estate',label:'수요와 수요량 구별',
   words:['수요량','수요곡선','수요 법칙','수요법칙','정상재','열등재'],
   easy:'수요는 가격별 구매 의사를 모두 나타내는 곡선이고, 수요량은 특정 가격에서의 한 점입니다.',
   example:'같은 상품 가격이 내려가면 곡선 위 점이 움직입니다. 소비자 소득·선호가 달라지면 곡선 자체가 이동할 수 있습니다.',
   advanced:'Qd=a−bP+u에서 P 변화는 동일 곡선상의 이동, u 변화는 비가격 요인에 의한 곡선 평행이동입니다.',
   graph:'market',exampleKind:'demand'},
  {id:'estate.land.supply',subject:'estate',label:'공급과 공급량 구별',
   words:['공급량','공급곡선','공급법칙','공급 법칙','공급자'],
   easy:'공급은 가격별 판매 계획 전체이고 공급량은 특정 가격에서의 판매 계획 한 점입니다.',
   example:'원자재비 상승은 비용조건이므로 공급곡선을 왼쪽으로 옮길 수 있지만, 상품가격 상승은 곡선 위 이동입니다.',
   advanced:'Qs=c+dP+v에서 P 변화는 공급량 변화, v 변화는 공급 자체의 이동. 다른 조건 일정 가정을 확인하세요.',
   graph:'market',exampleKind:'supply'},
  {id:'estate.investment.npv',subject:'estate',label:'순현재가치·할인',
   words:['순현재가치','현가계수','현재가치','할인율','내부수익률','NPV','IRR'],
   easy:'미래의 현금흐름을 같은 시점의 가치로 바꾼 뒤 투자비를 빼는 계산입니다.',
   example:'여러 해 받는 금액은 연금현가, 마지막 매각금액은 일시불 현가로 구분해 계산합니다.',
   advanced:'NPV=Σ[CFt/(1+r)^t]−초기투자액. 시점·세전/세후·기간별 현금흐름을 혼동하지 마세요.',
   graph:null},
  {id:'estate.location',subject:'estate',label:'상권·입지론',
   words:['중심지이론','컨버스','허프모형','레일리','상권','입지계수','공업입지'],
   easy:'상권·입지모형마다 중심지 규모, 거리, 소비자 접근성 등 설명 변수가 다릅니다.',
   example:'두 도시 사이의 분기점을 구하는 문제에서는 어느 도시에서 잰 거리인지부터 확인합니다.',
   advanced:'인구·거리제곱·원료·노동비 등 각 모형이 사용하는 지표를 대조합니다. 한 모형의 식을 다른 모형에 대입하지 않습니다.',
   graph:null},
  {id:'estate.rent',subject:'estate',label:'지대·입찰지대',
   words:['입찰지대','차액지대','준지대','지대이론','지대곡선'],
   easy:'토지 이용자가 입지나 생산성의 차이 때문에 지불할 수 있는 지대가 달라집니다.',
   example:'중심지와의 거리로 운송비가 늘어나는 경우 입찰 가능한 지대가 달라질 수 있습니다.',
   advanced:'리카도의 생산성 차이, 튀넨의 운송비·거리, 마샬의 준지대를 각각 구분합니다.',
   graph:null},
  {id:'estate.land.physical',subject:'estate',label:'토지의 자연적 특성',
   words:['부증성','부동성','영속성','개별성','인접성'],
   easy:'토지는 위치를 바꾸기 어렵고 같은 자리에 있는 토지를 생산해 늘릴 수 없다는 자연적 특성이 있습니다.',
   example:'시장에서 물건 재고를 늘리듯 같은 위치의 토지 면적을 생산해 낼 수 있는 것은 아닙니다.',
   advanced:'자연적 특성과 이용·병합·분할 같은 인문적 특성은 서로 다른 분류입니다.',
   graph:null},
  {id:'civil.declaration',subject:'civil',label:'의사표시·법률행위',
   words:['의사표시','착오','통정허위표시','통정 허위표시','비진의표시','의사 표시','법률행위'],
   easy:'법률행위의 의사표시가 어떤 의미인지, 진의와 표시가 불일치할 때 어떤 문제가 생기는지 구분합니다.',
   example:'통정허위표시와 비진의표시는 상대방과 합의 여부·상대방 인식 등을 따로 검토해야 합니다.',
   advanced:'무효·취소·제3자 보호는 각 조항의 별도 요건과 출제 당시 법령·판례를 확인해야 합니다. 정답 인정만으로 진위를 단정하지 않습니다.',
   graph:null},
  {id:'civil.ownership',subject:'civil',label:'물권·등기',
   words:['소유권','물권변동','등기','점유','취득시효','저당권','전세권'],
   easy:'물권은 특정 물건에 대한 권리로, 소유권·담보물권과 권리변동의 공시를 구분해야 합니다.',
   example:'같은 물건이라도 등기·점유·선의·악의 등 법률요건에 따라 효과가 달라질 수 있습니다.',
   advanced:'등기의 요부, 제3자 보호, 점유·취득시효의 요건은 정확한 발문과 법령 적용시점을 따로 확인합니다.',
   graph:null},
  {id:'civil.lease',subject:'civil',label:'임대차·계약',
   words:['임대차','계약갱신','갱신청구','차임','임대인','임차인','계약해제','채무불이행'],
   easy:'계약에서 누가 어떤 의무를 지는지, 해제·갱신·대항력 등의 요건을 구분합니다.',
   example:'임대차 문제는 계약 체결, 거주·점유, 갱신 주장, 통지의 시점이 서로 다를 수 있습니다.',
   advanced:'계약갱신권·임대차보호법·민법의 적용 범위와 적용일을 구분하고, 당시 조문·판례를 원문으로 확인해야 합니다.',
   graph:null}
 ]);
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const idOk=s=>/^20(?:1[6-9]|2[0-5])-(?:[1-9]|[1-7]\d|80)$/.test(String(s||''));
 function match(q){
  if(!q||q.verified!==true||!idOk(q.id)||q.id!==q.year+'-'+q.number||
     !['estate','civil'].includes(q.subject)||!Array.isArray(q.options)||q.options.length!==5)return [];
  const prompt=String(q.question||'').normalize('NFKC').toLowerCase();
  const choices=q.options.join(' ').normalize('NFKC').toLowerCase();
  const scores=[];
  for(const rule of RULES){
   if(rule.subject!==q.subject)continue;
   const words=rule.words.map(w=>w.toLowerCase());
   const hits=words.filter(w=>prompt.includes(w)||choices.includes(w));
   if(!hits.length||(!words.some(w=>prompt.includes(w))&&hits.length<2))continue;
   let score=Math.min(10,hits.length)+words.reduce((s,w)=>s+(prompt.includes(w)?5:0),0);
   if(q.subject==='estate'&&rule.graph)score+=1;
   scores.push({...rule,score,reason:hits[0]});
  }
  return scores.sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id)).slice(0,3)
   .map(x=>Object.freeze({...x,candidateOnly:true,expertVerified:false,sourcePdfChecked:false}));
 }
 function panel(q){
  const found=match(q),header='<section class="ck171-exam-theory" data-ck171-panel aria-label="문제와 개념 학습 연결">'+
   '<h3>기출 풀이 → 핵심 이론 → 도형차트</h3>'+
   '<p class="ck171-note">공식 원문에서 찾은 <strong>키워드 기반 학습 추천</strong>입니다. 검증된 개념 출제 빈도나 전문가·법령 검수 결과가 아닙니다.</p>';
  if(!found.length)return header+'<p>이 문제에서 확인된 자동 이론 후보가 없습니다. 기존 원문·해설을 먼저 읽고 키워드로 다시 찾아보세요.</p>'+
   '<button type="button" data-ck171-search="1">10개년 원문 검색</button></section>';
  return header+'<div class="ck171-concepts">'+found.map(r=>'<article>'+
   '<div class="ck171-concept-title"><strong>'+esc(r.label)+'</strong><small>원문 일치: '+esc(r.reason)+'</small></div>'+
   '<p><b>쉬운 설명</b> '+esc(r.easy)+'</p>'+
   '<p><b>예시</b> '+esc(r.example)+'</p>'+
   '<details><summary>심화·주의점</summary><p>'+esc(r.advanced)+'</p></details>'+
   (r.graph?'<button type="button" data-ck171-graph="'+esc(r.id)+'">도형차트에서 직접 움직이기</button>':'')+
   '</article>').join('')+'</div>'+
   '<div class="ck171-foot"><button type="button" data-ck171-search="1">기출 원문으로 관련 개념 검색</button>'+
   '<span>모형의 수치는 가상 예시이며 이 문제의 공식 정답 계산값이 아닙니다.</span></div></section>';
 }
 let context=null,queued=false,observer=null;
 function bankQuestion(id){const q=root?.RECALL_OFFICIAL?.[id];return q?.verified===true&&idOk(q.id)?q:null;}
 function activeGraph(){
  if(!context||typeof document==='undefined')return false;
  const lab=document.getElementById('ck141-concept-lab');
  if(!lab?.isConnected)return false;
  const r=context.rule,topic=r.graph||'market';
  const topicControl=lab.querySelector('[data-ck141-topic="'+topic+'"]');
  if(!context.configured){
   context.configured=true;
   if(topicControl&&topicControl.getAttribute('aria-pressed')!=='true')topicControl.click();
   const mode=lab.querySelector('[data-ck141-mode="compare"]');
   if(mode&&mode.getAttribute('aria-pressed')!=='true')mode.click();
  }
  if(!lab.querySelector('[data-ck171-context]')){
   const q=bankQuestion(context.id);
   if(!q){context=null;return false;}
   const card=document.createElement('section');card.className='ck171-graph-context';card.dataset.ck171Context=context.id;
   card.innerHTML='<strong>'+esc(q.year+'년 '+q.number+'번')+'에서 가져온 이론 실험</strong>'+
    '<p>'+esc(r.label)+' · '+esc(r.example)+'</p>'+
    '<p>아래 그래프는 학습용 가상 모델입니다. 원문 문제의 가격·수량·정답을 재현했다고 보장하지 않습니다.</p>'+
    '<div><button type="button" data-ck171-example="'+esc(r.exampleKind||'demand')+'">가상 상황 적용</button>'+
    '<button type="button" data-ck171-back="'+esc(q.id)+'">이 기출문제로 돌아가기</button></div>';
   const intro=lab.querySelector('.ck141-intro');intro?.after(card);
  }
  return true;
 }
 function decorate(){
  if(typeof document==='undefined')return;
  const dialog=document.getElementById('ck78-analysis-dialog');
  const id=dialog?.dataset.ck78Current;
  if(dialog?.open&&idOk(id)&&!dialog.querySelector('[data-ck171-panel]')){
   const q=bankQuestion(id),anchor=dialog.querySelector('.ck107-learning-flow');
   if(q&&anchor){const wrapper=document.createElement('div');wrapper.innerHTML=panel(q);
    const el=wrapper.firstElementChild;if(el)anchor.after(el);}
  }
  if(context)activeGraph();
 }
 function schedule(){if(queued||typeof document==='undefined')return;
  if(!context&&!document.getElementById('ck78-analysis-dialog')?.open)return;
  queued=true;
  (root?.requestAnimationFrame||((f)=>f()))(()=>{queued=false;decorate();});}
 function openGraph(id,ruleId){
  const q=bankQuestion(id),rule=match(q).find(x=>x.id===ruleId&&x.graph);
  if(!rule)return false;
  if(root?.CK78Analysis?.hasUnsavedNote?.()&&root.CK78Analysis.flushNote?.()===false)return false;
  if(root?.CK80Editorial?.hasUnsavedChanges?.()&&root.CK80Editorial.confirmLeave?.()===false)return false;
  if(root?.CK83Links?.getStatus?.()?.unsavedEdits>0&&root.CK83Links.confirmDiscard?.()===false)return false;
  const nav=document.querySelector('[data-go="venn"]');
  if(!nav)return false;
  const dlg=document.getElementById('ck78-analysis-dialog');
  if(dlg?.open)dlg.close();
  context={id:q.id,rule,configured:false};
  nav.click();schedule();return true;
 }
 if(root&&typeof document!=='undefined'){
  document.addEventListener('click',e=>{
   const graph=e.target.closest?.('[data-ck171-graph]'),search=e.target.closest?.('[data-ck171-search]'),
    demo=e.target.closest?.('[data-ck171-example]'),back=e.target.closest?.('[data-ck171-back]');
   if(graph){
    const dlg=graph.closest('#ck78-analysis-dialog'),id=dlg?.dataset.ck78Current;
    if(!openGraph(id,graph.dataset.ck171Graph)){
     const info=dlg?.querySelector('[data-ck78-status]');if(info)info.textContent='기존 편집 중 내용 또는 그래프 탭 준비 상태를 확인하세요.';
    }return;
   }
   if(search){
    const dlg=search.closest('#ck78-analysis-dialog'),q=bankQuestion(dlg?.dataset.ck78Current);
    const term=match(q)[0]?.reason||'';
    if(root.CK76Search?.open?.()){
     if(dlg?.open)dlg.close();
     const field=document.getElementById('ck76-search-query');if(field&&term){
      field.value=term;field.closest('form')?.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));}
    }return;
   }
   if(demo){
    const lab=demo.closest('#ck141-concept-lab');
    if(lab&&!context)return;
    const btn=lab?.querySelector('[data-ck145-example="'+demo.dataset.ck171Example+'"]');
    btn?.click();schedule();return;
   }
   if(back){
    const q=bankQuestion(back.dataset.ck171Back);
    if(!q)return;
    root.CK78Analysis?.open?.(q.year,q.number,back);
    return;
   }
  });
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{
   schedule();if(root.MutationObserver){observer=new MutationObserver(schedule);observer.observe(document.body,{childList:true,subtree:true});}
  },{once:true});
  else{schedule();if(root.MutationObserver){observer=new MutationObserver(schedule);observer.observe(document.body,{childList:true,subtree:true});}}
 }
 return Object.freeze({RULES,match,panel,openGraph,getContext:()=>context?{questionId:context.id,conceptId:context.rule.id,graphTopic:context.rule.graph}:null,refresh:decorate});
});
