/* ConceptKnot P6 v79 · interactive SVG scrubbing across the 17 existing study charts.
 * A diagram is an illustrative direction, never a computed official-exam curve.
 */
(function(){
'use strict';
const $=s=>document.querySelector(s);
const clamp=n=>Math.round(Math.max(0,Math.min(100,Number(n)||0)));
const shifted=c=>c?.type==='demand'||c?.type==='supply';
const direction=c=>Number(c?.shift)<0?-1:1;
const names={ '-1':'감소 · 좌측', '1':'증가 · 우측'};
let gesture=null,lastChart=null,lastValue=0,override=null,schedulePending=false;
function active(){
 const root=$('.ck21-chart-section'),state=window.CK21Charts?.getState?.();
 const chart=window.CK21Charts?.charts?.[state?.selected||0];
 return root&&chart?{root,chart,state}:null;
}
function ensureMarker(root,c){
 const svg=root.querySelector('svg.ck21-chart-svg');
 if(!svg)return;
 const needsMarker=!shifted(c)&&c.type!=='both';
 let node=svg.querySelector('[data-ck79-marker]');
 if(!needsMarker){node?.remove();return;}
 if(!node){
  node=document.createElementNS('http://www.w3.org/2000/svg','g');
  node.setAttribute('data-ck79-marker','');
  node.setAttribute('aria-hidden','true');
  node.innerHTML='<line x1="0" y1="0" x2="0" y2="0" stroke="currentColor" stroke-dasharray="4 6" opacity=".6"/>'+
   '<circle cx="0" cy="0" r="7" stroke="currentColor" stroke-width="2" fill="#f3e2b9"/>';
  svg.append(node);
 }
 return node;
}
function markerPosition(c,p){
 const x=118+360*p;
 const type=c.type;
 if(type==='along')return [x,96+185*p];
 if(type==='elasticity')return [x,145+75*p];
 if(type==='ceiling')return [x,247];
 if(type==='stock')return [x,260-110*p];
 if(type==='cobweb')return [145+170*p,270-90*p];
 if(type==='distance')return [x,100+175*p];
 return [x,150+80*p];
}
function applyMarker(root,c,value){
 const node=ensureMarker(root,c);if(!node)return;
 const svg=root.querySelector('.ck21-chart-svg'),p=value/100,[x,y]=markerPosition(c,p);
 const guide=node.querySelector('line'),dot=node.querySelector('circle');
 if(guide){guide.setAttribute('x1',String(x));guide.setAttribute('x2',String(x));
  guide.setAttribute('y1',String(315));guide.setAttribute('y2',String(y));}
 if(dot){dot.setAttribute('cx',String(x));dot.setAttribute('cy',String(y));}
 if(svg)svg.setAttribute('aria-label',c.title+' · 조작 진행 '+value+'% · 학습용 도식');
}
function narrative(c,v,sign){
 const p=clamp(v),base=direction(c);
 if(shifted(c)){
  const kind=c.type==='demand'?'수요곡선':'공급곡선',left=sign<0;
  if(!p)return kind+' 원래 위치. 비가격 요인을 바꾸기 전의 조건을 나타냅니다.';
  if(sign!==base)return '반대 조건을 가정했습니다. '+kind+'이 '+(left?'좌측':'우측')+'으로 이동합니다. 기출 원래 조건과 다르므로 원문의 정답을 그대로 적용하지 마세요.';
  return kind+' '+(left?'좌측':'우측')+' 이동 '+p+'% (도식상 이동 강도) · '+c.answer;
 }
 if(c.type==='both')return p?'수요와 공급이 동시에 변하는 학습 도식 '+p+'% · 거래량은 증가 가능하나 가격 방향은 상대적 이동 폭에 따라 달라져 단정할 수 없습니다.':
  '동시 이동 시작 전입니다. 가격 방향을 임의로 확정하면 안 됩니다.';
 if(!p)return '조건 변화 전 상태. 그래프 안을 드래그하거나 슬라이더를 움직여 개념을 확인하세요.';
 if(c.type==='along')return '자체 가격이 달라지는 상황의 도식상 위치 '+p+'% · 수요곡선은 그대로이고 곡선 위 점(수요량)이 바뀝니다.';
 if(c.type==='elasticity')return '상대적 기울기 비교 위치 '+p+'% · 탄력성은 실제로 수요량 변화율 / 가격 변화율이며, 선의 외형만으로 정확한 수치를 계산하지 않습니다.';
 if(c.type==='ceiling')return '최고가격제 조건 확인 '+p+'% · 균형보다 낮은 가격상한이 실효적이면 초과수요가 발생할 수 있습니다.';
 if(c.type==='cobweb')return '시차에 따른 조정 경로 '+p+'% · 실제 수렴/발산은 공급·수요 기울기 관계로 판단해야 합니다.';
 if(c.type==='stock')return '시점·기간 비교 위치 '+p+'% · 저량은 특정 시점 값, 유량은 일정 기간 값입니다.';
 return '가로축 조건이 증가하는 방향으로 관찰 위치 '+p+'% · '+c.answer+
  ' (위치는 학습용이며 실제 기출 수치/관측값이 아닙니다.)';
}
function update(value,options={}){
 const info=active();if(!info)return;
 const {root,chart:c}=info,p=clamp(value);
 let sign=override;
 if(lastChart!==c.id){lastChart=c.id;override=direction(c);sign=override;}
 if(options.direction===-1||options.direction===1){override=options.direction;sign=override;}
 if(sign!==1&&sign!==-1)sign=direction(c);
 const range=root.querySelector('[data-ck76-chart-scrub]');if(range&&Number(range.value)!==p)range.value=String(p);
 const g=root.querySelectorAll('.ck21-transform-target');
 if(shifted(c))g.forEach(node=>node.dataset.ck76Shift=String(Math.abs(Number(c.shift)||65)*sign));
 window.CK76Search?.applyScrub?.(root,p);
 applyMarker(root,c,p);
 const desc=root.querySelector('.ck21-chart-explanation');if(desc)desc.textContent=narrative(c,p,sign);
 const explanation=root.querySelector('[data-ck79-chart-note]');
 if(explanation)explanation.textContent=narrative(c,p,sign);
 const out=root.querySelector('[data-ck79-chart-percentage]');
 if(out)out.textContent=p+'%';
 for(const b of root.querySelectorAll('[data-ck79-chart-direction]'))
  b.setAttribute('aria-pressed',String(Number(b.dataset.ck79ChartDirection)===sign));
 lastValue=p;
}
function mount(){
 const info=active();if(!info)return;
 const {root,chart:c}=info,controls=root.querySelector('.ck76-chart-control');
 if(!controls||controls.querySelector('[data-ck79-chart-modes]'))return;
 lastChart=c.id;override=direction(c);
 const target=document.createElement('div');target.className='ck79-chart-modes';
 target.dataset.ck79ChartModes='';
 target.innerHTML='<div class="ck79-chart-condition">'+
 (shifted(c)?'<span>조건 조절</span><button type="button" data-ck79-chart-direction="-1">수요·공급 감소</button>'+
  '<button type="button" data-ck79-chart-direction="1">수요·공급 증가</button>':
  '<span>가로축을 드래그하며 개념 비교 · 반대 상황을 확정해석하지 않음</span>')+'</div>'+
 '<p class="ck79-chart-instruction">차트 위 포인터 드래그 ↔ 슬라이더 조작 ↔ 방향키 입력이 동기화됩니다. '+
 '진행률은 실제 경제 지표나 공식 문제지 수치가 아닙니다.</p>'+
 '<p data-ck79-chart-note class="ck79-chart-note" role="status"></p>';
 controls.append(target);
 const svg=root.querySelector('svg.ck21-chart-svg');
 if(svg){svg.classList.add('ck79-chart-draggable');svg.setAttribute('tabindex','0');
  svg.setAttribute('role','slider');svg.setAttribute('aria-valuemin','0');svg.setAttribute('aria-valuemax','100');
  svg.setAttribute('aria-valuenow',String(info.state?.phase?100:0));
 }
 update(info.state?.phase?100:0);
}
function fromPointer(event,svg){
 const rect=svg.getBoundingClientRect();
 if(rect.width<=0)return lastValue;
 const x=(event.clientX-rect.left)*560/rect.width;
 return clamp((x-105)/380*100);
}
function updateAria(){
 const svg=$('.ck21-chart-section svg.ck21-chart-svg');
 if(svg){svg.setAttribute('aria-valuenow',String(lastValue));
  svg.setAttribute('aria-valuetext','학습용 진행 '+lastValue+'퍼센트');}
}
document.addEventListener('pointerdown',e=>{
 const svg=e.target.closest?.('.ck21-chart-section svg.ck21-chart-svg');
 if(!svg||e.button!==0)return;
 gesture={id:e.pointerId,svg};
 try{svg.setPointerCapture(e.pointerId)}catch{}
 svg.closest('.ck21-chart-section')?.classList.add('ck79-chart-dragging');
 update(fromPointer(e,svg));updateAria();
});
document.addEventListener('pointermove',e=>{
 if(!gesture||gesture.id!==e.pointerId)return;
 if(e.cancelable)e.preventDefault();
 update(fromPointer(e,gesture.svg));updateAria();
},{passive:false});
function finish(e){
 if(!gesture||gesture.id!==e.pointerId)return;
 gesture.svg?.closest('.ck21-chart-section')?.classList.remove('ck79-chart-dragging');
 try{gesture.svg?.releasePointerCapture(e.pointerId)}catch{}
 gesture=null;
}
document.addEventListener('pointerup',finish);
document.addEventListener('pointercancel',finish);
document.addEventListener('keydown',e=>{
 const svg=e.target.closest?.('svg.ck79-chart-draggable');
 if(!svg||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
 e.preventDefault();
 const next=e.key==='Home'?0:e.key==='End'?100:lastValue+(e.key==='ArrowLeft'?-5:5);
 update(next);updateAria();
});
document.addEventListener('input',e=>{
 if(!e.target.matches?.('[data-ck76-chart-scrub]'))return;
 update(e.target.value);updateAria();
});
document.addEventListener('click',e=>{
 const sign=e.target.closest?.('[data-ck79-chart-direction]');
 if(sign){update(lastValue,{direction:Number(sign.dataset.ck79ChartDirection)});updateAria();return;}
 if(e.target.closest?.('[data-ck21-play]')){
  const state=window.CK21Charts?.getState?.();
  // Existing play button updates model before this listener; align the slider.
  update(state?.phase?100:0);updateAria();
 }
});
let scheduled=false;
function queueMount(){
 if(scheduled)return;scheduled=true;
 requestAnimationFrame(()=>{scheduled=false;mount()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
const main=document.getElementById('main');
if(main&&window.MutationObserver)new MutationObserver(records=>{
 if(records.some(r=>Array.from(r.addedNodes).some(n=>n.nodeType===1&&
  (n.matches?.('.ck21-chart-section,.ck76-chart-control')||
   n.querySelector?.('.ck21-chart-section,.ck76-chart-control')))))queueMount();
}).observe(main,{subtree:true,childList:true});
window.CK79Charts=Object.freeze({update,narrative,getState:()=>({id:lastChart,value:lastValue,sign:override})});

/* P6-B v141 separately loads the verified numeric model and opt-in laboratory. */
let ck141Promise=null;
function ck141Ensure(){
 if(ck141Promise)return ck141Promise;
 if(!document.head||!document.body)return Promise.resolve(false);
 const css=document.createElement('link');
 css.rel='stylesheet';css.href='./assets/ck-concept-lab-v141.css?v=142';css.dataset.ck141Asset='css';
 document.head.appendChild(css);
 const css142=document.createElement('link');css142.rel='stylesheet';
 css142.href='./assets/ck-theory-v142.css?v=142';css142.dataset.ck142Asset='css';
 document.head.appendChild(css142);
 const load=src=>new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src=src;script.async=false;
  script.onload=resolve;script.onerror=()=>reject(new Error('P6-B failed: '+src));
  document.head.appendChild(script);
 });
 ck141Promise=load('./assets/ck-concept-math-v141.js?v=141')
  .then(()=>load('./assets/ck-concept-lab-v141.js?v=142'))
  .then(async()=>{try{await load('./assets/ck-theory-models-v142.js?v=142');
    await load('./assets/ck-theory-v142.js?v=142');}
    catch{const chart=document.querySelector('.ck21-chart-section');if(chart&&!chart.querySelector('[data-ck142-error]')){
      const msg=document.createElement('p');msg.dataset.ck142Error='';msg.setAttribute('role','status');
      msg.textContent='심화 경제 그래프 모듈을 불러오지 못했습니다. 온라인 재접속 후 다시 시도하세요.';chart.append(msg);
    }}
    const chart=document.querySelector('.ck21-chart-section');if(chart){
      window.CK141ConceptLab?.mount(chart);window.CK142Theory?.mount(chart);
    }return true;})
  .catch(()=>{const chart=document.querySelector('.ck21-chart-section');
   if(chart&&!chart.querySelector('[data-ck141-error]')){
    const msg=document.createElement('p');msg.dataset.ck141Error='';msg.setAttribute('role','alert');
    msg.textContent='개념 그래프 엔진을 불러오지 못했습니다. 온라인에서 새로고침을 시도하세요.';
    chart.append(msg);
   }return false;});
 return ck141Promise;
}
function ck141Mount(){
 const chart=document.querySelector('.ck21-chart-section');
 if(!chart)return;
 ck141Ensure().then(ready=>{if(ready&&chart.isConnected){window.CK141ConceptLab?.mount(chart);window.CK142Theory?.mount(chart);}});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ck141Mount,{once:true});
else ck141Mount();
const ck141Host=document.getElementById('main');
if(ck141Host&&window.MutationObserver)new MutationObserver(changes=>{
 if(changes.some(r=>Array.from(r.addedNodes).some(n=>n.nodeType===1&&
  (n.matches?.('.ck21-chart-section')||n.querySelector?.('.ck21-chart-section')))))ck141Mount();
}).observe(ck141Host,{subtree:true,childList:true});

})();
