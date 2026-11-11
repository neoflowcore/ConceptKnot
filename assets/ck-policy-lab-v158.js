/* ConceptKnot v158: policy-price comparison inside the existing ceiling lesson.
 * Illustrative SVG only; never edits official exam answers or personal records.
 */
(function(){
'use strict';
if(typeof window!=='object'||typeof document!=='object')return;
const STORE=new WeakMap();
const math=()=>window.CK158PolicyMath;
let activePointer=null;
const clamp=(n,min,max)=>Math.max(min,Math.min(max,Number(n)||0));
const isPolicy=root=>root&&root.dataset?.ck158PolicyLab!==undefined;
function display(root,committed){
 const state=STORE.get(root),m=math();if(!state||!m)return;
 const current=m.evaluate(state.mode,state.y[state.mode]),eq=current.equilibrium;
 const mode=current.mode,isCeiling=mode==='ceiling',label=isCeiling?'최고가격제':'최저가격제';
 const set=(selector,value)=>{const el=root.querySelector(selector);if(el)el.textContent=value;};
 const attr=(selector,key,value)=>{const el=root.querySelector(selector);if(el)el.setAttribute(key,String(value));};
 const shown=current.binding;
 const result=current.kind==='shortage'?'초과수요(부족)':current.kind==='surplus'?'초과공급(잉여)':'가격규제 비구속';
 const outcome=shown?(label+'가 시장균형 '+(isCeiling?'아래':'위')+'에서 구속력을 가지므로 '+
    (isCeiling?'수요량 Qd > 공급량 Qs':'공급량 Qs > 수요량 Qd')+' · '+result):
    (label+'가 현재 균형을 제한하지 않아 부족·잉여를 새로 만들었다고 볼 수 없습니다.');
 const position=current.pricePosition==='below'?'균형가격보다 낮음':
  current.pricePosition==='above'?'균형가격보다 높음':'균형가격과 같음';
 const comparison='이전 E₀: 규제 없는 시장균형  →  변경 후: '+label+' · '+position+' · '+result;
 const demo=shown?(isCeiling?
  '예: 균형가격이 10인 시장에서 최고가격을 8로 제한하면 사고 싶은 양이 팔려는 양보다 커져 부족이 생깁니다.':
  '예: 균형가격이 10인 시장에서 최저가격을 12로 정하면 팔려는 양이 사려는 양보다 커져 잉여가 생깁니다.'):
  (isCeiling?'예: 균형가격이 10인 시장에서 상한을 12로 정하면 거래가격을 낮추도록 구속하지 않습니다.':
    '예: 균형가격이 10인 시장에서 하한을 8로 정하면 거래가격을 높이도록 구속하지 않습니다.');
 const advanced='기본 조건: 수요·공급곡선과 다른 결정요인은 고정합니다. '+
  (isCeiling?'실효적 최고가격: Pmax < Pe, Qd > Qs. ':
   '실효적 최저가격: Pmin > Pe, Qs > Qd. ')+
  '도식의 좌표·간격은 시험 원문 숫자나 실제 시장 가격이 아니며, 비구속적 규제에서는 위 부등식을 적용하지 않습니다.';
 root.querySelectorAll('[data-ck158-mode]').forEach(b=>{
  b.setAttribute('aria-pressed',String(b.dataset.ck158Mode===mode));
 });
 const range=root.querySelector('[data-ck158-range]');
 if(range){range.value=String(current.y);range.setAttribute('aria-label',label+' 정책 가격선 높이 (화면에서 위쪽일수록 높은 가격)');}
 const group=root.querySelector('[data-ck158-grip]');
 if(group){group.setAttribute('aria-valuenow',String(Math.round(current.y)));
  group.setAttribute('aria-valuetext',label+' · '+position+' · '+result);
  group.setAttribute('aria-label',label+' 정책 가격선. 위아래 방향키로 이동');}
 attr('[data-ck158-price]','y1',current.y);
 attr('[data-ck158-price]','y2',current.y);
 attr('[data-ck158-grip-line]','y1',current.y);
 attr('[data-ck158-grip-line]','y2',current.y);
 attr('[data-ck158-grip-circle]','cy',current.y);
 attr('[data-ck158-price-title]','y',current.y-12);
 set('[data-ck158-price-title]',isCeiling?'최고가격':'최저가격');
 const excess=root.querySelector('[data-ck158-excess]');
 if(excess){excess.setAttribute('x1',String(current.rangeStart));
  excess.setAttribute('x2',String(current.rangeEnd));
  excess.setAttribute('y1',String(current.y+14));
  excess.setAttribute('y2',String(current.y+14));
  excess.setAttribute('visibility',shown?'visible':'hidden');}
 for(const [key,x] of [['demand',current.quantityDemand],['supply',current.quantitySupply]]){
  const guide=root.querySelector('[data-ck158-q-'+key+']');
  if(guide){
   guide.setAttribute('x1',String(x));guide.setAttribute('x2',String(x));
   guide.setAttribute('y1',String(current.y));
   guide.setAttribute('visibility',shown?'visible':'hidden');
  }
  attr('[data-ck158-q-'+key+'-label]','x',x);
  attr('[data-ck158-q-'+key+'-label]','visibility',shown?'visible':'hidden');
 }
 set('[data-ck158-summary]',comparison);
 set('[data-ck158-outcome]',outcome);
 set('[data-ck158-example]',demo);
 set('[data-ck158-advanced]',advanced);
 set('[data-ck158-amount]',shown?'두 수량의 도식 간격 약 '+Math.round(current.size)+' (실제 수량 아님)':'균형에서 벗어난 수량 간격 없음');
 attr('[data-ck158-policy-svg]','aria-label',label+' 비교. '+outcome+'. 위치 조절은 아래 슬라이더 또는 가격선을 사용합니다.');
 if(committed)set('[data-ck158-announcement]',outcome);
}
function pointerY(svg,e){
 const rect=svg.getBoundingClientRect();
 const ratio=Math.min(rect.width/560,rect.height/348);
 if(!(ratio>0))return null;
 const top=(rect.height-348*ratio)/2;
 return clamp(Math.round((e.clientY-rect.top-top)/ratio),100,285);
}
function cancelPointer(rollback){
 if(!activePointer)return;
 const d=activePointer;activePointer=null;
 const s=STORE.get(d.root);
 if(s&&rollback)s.y[d.mode]=d.original;
 try{d.target.releasePointerCapture?.(d.id)}catch{}
 if(d.root.isConnected)display(d.root,true);
}
document.addEventListener('pointermove',e=>{
 const d=activePointer;if(!d||d.id!==e.pointerId)return;
 if(!d.root.isConnected){cancelPointer(true);return;}
 const svg=d.root.querySelector('[data-ck158-policy-svg]');
 const y=svg&&pointerY(svg,e);if(y===null)return;
 const state=STORE.get(d.root);if(!state||state.mode!==d.mode){cancelPointer(true);return;}
 state.y[d.mode]=y;display(d.root,false);
 if(e.cancelable)e.preventDefault();
},{passive:false});
document.addEventListener('pointerup',e=>{if(activePointer?.id===e.pointerId)cancelPointer(false)});
document.addEventListener('pointercancel',e=>{if(activePointer?.id===e.pointerId)cancelPointer(true)});
document.addEventListener('lostpointercapture',e=>{if(activePointer?.id===e.pointerId)cancelPointer(true)});
window.addEventListener('blur',()=>cancelPointer(true));
document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelPointer(true)});
function mount(chartRoot,chart){
 if(!chartRoot||chart?.id!=='ceiling'||!math()?.evaluate)return false;
 const controls=chartRoot.querySelector('[data-ck79-chart-modes]')||
  chartRoot.querySelector('.ck76-chart-control');
 if(!controls||!document.createElement)return false;
 if(controls.querySelector('[data-ck158-policy-lab]'))return true;
 const root=document.createElement('section');
 root.className='ck158-policy-lab';root.dataset.ck158PolicyLab='';
 root.setAttribute('aria-label','최고가격제와 최저가격제 비교 실험실');
 root.innerHTML='<header><strong>가격상한 · 가격하한 직접 비교</strong>'+
  '<small>규제선을 잡아 높낮이를 바꾸세요. 기존 17개 그래프/기출 원문은 그대로 유지됩니다.</small></header>'+
  '<div class="ck158-policy-actions" role="group" aria-label="가격규제 종류 선택">'+
  '<button type="button" data-ck158-mode="ceiling" aria-pressed="true">최고가격제 (상한)</button>'+
  '<button type="button" data-ck158-mode="floor" aria-pressed="false">최저가격제 (하한)</button>'+
  '<button type="button" data-ck158-reset>정책선 초기화</button></div>'+
  '<svg viewBox="0 0 560 348" class="ck158-policy-svg" data-ck158-policy-svg role="img" aria-label="정책 가격선 비교 도식">'+
  '<path class="ck158-axis" d="M86 45 V315 H515"/>'+
  '<path class="ck158-demand" d="M100 86 L485 286"/><path class="ck158-supply" d="M110 300 L480 80"/>'+
  '<text x="465" y="292">D</text><text x="477" y="72">S</text>'+
  '<text x="22" y="43">가격 P</text><text x="443" y="337">수량 Q</text>'+
  '<line class="ck158-baseline" x1="85" y1="'+math().equilibrium.y+'" x2="'+math().equilibrium.x+'" y2="'+math().equilibrium.y+'"/>'+
  '<circle class="ck158-e0" cx="'+math().equilibrium.x+'" cy="'+math().equilibrium.y+'" r="7"/>'+
  '<text x="'+(math().equilibrium.x+10)+'" y="'+(math().equilibrium.y-14)+'">E₀</text>'+
  '<line class="ck158-q-demand" data-ck158-q-demand x1="0" x2="0" y1="0" y2="315"/>'+
  '<line class="ck158-q-supply" data-ck158-q-supply x1="0" x2="0" y1="0" y2="315"/>'+
  '<text data-ck158-q-demand-label x="0" y="326">Qd</text>'+
  '<text data-ck158-q-supply-label x="0" y="326">Qs</text>'+
  '<line class="ck158-excess" data-ck158-excess x1="0" x2="0" y1="0" y2="0"/>'+
  '<g data-ck158-grip role="slider" tabindex="0" aria-valuemin="100" aria-valuemax="285">'+
  '<line class="ck158-price" data-ck158-price x1="87" x2="500" y1="250" y2="250"/>'+
  '<line class="ck158-grip-line" data-ck158-grip-line x1="87" x2="500" y1="250" y2="250"/>'+
  '<circle class="ck158-grip-circle" data-ck158-grip-circle cx="500" cy="250" r="12"/></g>'+
  '<text data-ck158-price-title x="99" y="238">최고가격</text></svg>'+
  '<label class="ck158-range-label">가격선 높이 · 위로 올릴수록 높은 가격'+
  '<input type="range" min="100" max="285" step="1" value="250" data-ck158-range></label>'+
  '<p class="ck158-amount" data-ck158-amount></p>'+
  '<p class="ck158-before-after" data-ck158-summary></p>'+
  '<p class="ck158-outcome" data-ck158-outcome></p>'+
  '<details open><summary>쉬운 설명</summary><p>수요·공급선이 만나는 E₀가 규제 전 균형입니다. 정책선이 균형을 실제로 제한하는지 먼저 확인하세요.</p></details>'+
  '<details open><summary>생활 예시 · 변화 원인</summary><p data-ck158-example></p></details>'+
  '<details><summary>심화 · 부등식과 기출 함정</summary><p data-ck158-advanced></p></details>'+
  '<p class="ck158-caution">도식 좌표와 간격은 실제 가격·거래량 또는 검수된 기출 계산값이 아닙니다.</p>'+
  '<p class="ck158-sr" role="status" aria-live="polite" data-ck158-announcement></p>';
 controls.appendChild(root);
 STORE.set(root,{mode:'ceiling',y:{ceiling:250,floor:125}});
 root.addEventListener('click',e=>{
  const button=e.target.closest?.('[data-ck158-mode],[data-ck158-reset]');
  if(!button||activePointer)return;
  const state=STORE.get(root);
  if(button.dataset.ck158Mode)state.mode=button.dataset.ck158Mode;
  else if(button.hasAttribute('data-ck158-reset'))state.y[state.mode]=state.mode==='ceiling'?250:125;
  display(root,true);
 });
 root.addEventListener('input',e=>{
  if(!e.target.matches?.('[data-ck158-range]')||activePointer)return;
  const state=STORE.get(root);state.y[state.mode]=clamp(e.target.value,100,285);
  display(root,false);
 });
 root.addEventListener('change',e=>{
  if(e.target.matches?.('[data-ck158-range]'))display(root,true);
 });
 root.addEventListener('pointerdown',e=>{
  const target=e.target.closest?.('[data-ck158-grip]');
  if(!target||activePointer||e.isPrimary===false||
   (e.pointerType==='mouse'&&e.button!==0))return;
  const state=STORE.get(root);
  activePointer={id:e.pointerId,root,target,mode:state.mode,original:state.y[state.mode]};
  try{target.setPointerCapture?.(e.pointerId)}catch{}
  if(e.cancelable)e.preventDefault();
 },{passive:false});
 root.addEventListener('keydown',e=>{
  if(!e.target.closest?.('[data-ck158-grip]')||
   e.altKey||e.ctrlKey||e.metaKey)return;
  const keys={ArrowUp:-5,ArrowDown:5,PageUp:-20,PageDown:20};
  if(!Object.hasOwn(keys,e.key)&&e.key!=='Home'&&e.key!=='End')return;
  e.preventDefault();e.stopPropagation();
  const s=STORE.get(root),current=s.y[s.mode];
  s.y[s.mode]=e.key==='Home'?100:e.key==='End'?285:
   clamp(current+keys[e.key],100,285);
  display(root,true);
 });
 display(root,true);
 return true;
}
window.CK158PolicyLab=Object.freeze({mount,ready:true});
})();