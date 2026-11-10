/* ConceptKnot P6-B v149 — event-safe grip, observation and compare for 17 schematic charts.
 * Opt-in free/session-only. Leaves exam OMR, records, service worker and S Pen editor untouched.
 */
(function(){
'use strict';
const math=()=>window.CK149GraphMotion;
const active=()=>{
 const state=window.CK21Charts?.getState?.(),chart=window.CK21Charts?.charts?.[state?.selected||0];
 const root=document.querySelector('.ck21-chart-section');
 return root&&chart?{root,chart,phase:state.phase}:null;
};
const tracks=new Map();
const selectedPaths=new Map();
let drag=null,sliderDraft=null,writing=false,selectedCurve='demand';
const trackFor=(c,phase=false)=>{
 if(!tracks.has(c.id)&&math()?.timeline)tracks.set(c.id,math().timeline(c,phase?100:0));
 return tracks.get(c.id)||null;
};
const apply=(state,root,c)=>{
 const track=trackFor(c),snap=state||track?.state;
 if(!snap)return;
 writing=true;
 try{window.CK79Charts?.update?.(snap.value,{direction:snap.sign})}finally{writing=false}
 // A live update from the old chart engine may replace its own children.
 sync(root,c,snap);
};
const fmt=n=>Number(n).toFixed(1);
function observedPoint(svg,c,progress){
 const model=math(),index=selectedPaths.get(c.id)||0;
 const curves=Array.from(svg.querySelectorAll?.('.ck21-curve')||[]).filter(path=>!path.closest?.('.ck149-previous-curves'));
 const path=curves[index]||curves[0];
 if(path?.getTotalLength&&path?.getPointAtLength){
  try{const n=path.getTotalLength(),p=path.getPointAtLength(n*progress);
   if(n>0&&Number.isFinite(p.x)&&Number.isFinite(p.y))return [p.x,p.y];
  }catch{}
 }
 const line=model?.polylines(c)?.[index]||model?.polylines(c)?.[0];
 if(!line||line.points.length<2)return null;
 const lengths=line.points.slice(1).map((p,i)=>Math.hypot(p[0]-line.points[i][0],p[1]-line.points[i][1]));
 const total=lengths.reduce((a,b)=>a+b,0);let traveled=total*progress;
 for(let i=0;i<lengths.length;i++){
  const segment=lengths[i];
  if(traveled<=segment||i===lengths.length-1){
   const t=segment?Math.max(0,Math.min(1,traveled/segment)):0;
   const a=line.points[i],b=line.points[i+1];
   return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
  }
  traveled-=segment;
 }
 return line.points[0];
}
function overlayMarker(root,c,snap){
 if(['demand','supply','both'].includes(c.type))return;
 const svg=root.querySelector?.('.ck21-chart-svg');
 if(!svg||!document.createElementNS)return;
 let g=svg.querySelector?.('[data-ck149-original-observation]');
 if(!g){
  g=document.createElementNS('http://www.w3.org/2000/svg','g');
  g.setAttribute('data-ck149-original-observation','');
  g.setAttribute('aria-hidden','true');
  g.innerHTML='<circle data-ck149-begin cx="118" cy="96" r="6"/>'+
   '<text data-ck149-begin-label x="128" y="90">E₀</text>'+
   '<text data-ck149-now x="128" y="90">E₁</text>';
  svg.append?.(g);
 }
 const start=observedPoint(svg,c,0)||[118,150],
  current=observedPoint(svg,c,snap.value/100)||start;
 const beg=g.querySelector?.('[data-ck149-begin]'),
  label=g.querySelector?.('[data-ck149-begin-label]');
 beg?.setAttribute('cx',String(start[0]));beg?.setAttribute('cy',String(start[1]));
 label?.setAttribute('x',String(start[0]+11));label?.setAttribute('y',String(start[1]-10));
 const text=g.querySelector?.('[data-ck149-now]');
 if(text){text.setAttribute('x',String(current[0]+10));text.setAttribute('y',String(current[1]-10));
  text.setAttribute('visibility',snap.value>0?'visible':'hidden');}
 g.setAttribute?.('visibility',snap.value>0?'visible':'hidden');
 const moving=svg.querySelector?.('[data-ck79-marker]');
 if(moving){
  const dot=moving.querySelector?.('circle'),guide=moving.querySelector?.('line');
  dot?.setAttribute('cx',String(current[0]));dot?.setAttribute('cy',String(current[1]));
  guide?.setAttribute('x1',String(current[0]));guide?.setAttribute('x2',String(current[0]));
  guide?.setAttribute('y2',String(current[1]));
 }
}
function markerArrow(svg,from,to){
 if(!svg||!document.createElementNS)return;
 let p=svg.querySelector?.('[data-ck149-equilibrium-arrow]');
 if(!p){p=document.createElementNS('http://www.w3.org/2000/svg','path');
  p.setAttribute('data-ck149-equilibrium-arrow','');
  p.setAttribute('aria-hidden','true');svg.append?.(p);
 }
 p.setAttribute('d','M '+fmt(from.x)+' '+fmt(from.y)+' L '+fmt(to.x)+' '+fmt(to.y));
 p.setAttribute('visibility',Math.hypot(to.x-from.x,to.y-from.y)>.5?'visible':'hidden');
}
function sync(root,c,state){
 if(!root||!c||!state)return;
 const m=math(),p=state.value,sign=state.sign;
 const canvas=root.querySelector?.('svg.ck21-chart-svg');
 if(m&&canvas){
  if(['demand','supply','both'].includes(c.type)){
   const next=m.outcome(c,state),curves=canvas.querySelectorAll?.('[data-ck149-target]')||[];
   for(const group of curves){
    const key=group.dataset?.ck149Target;
    if(key!=='demand'&&key!=='supply')continue;
    const shift=next[key];
    group.style?.setProperty?.('--ck21-dx',fmt(shift)+'px');
    if(Math.abs(shift)>.01)group.classList?.add?.('ck21-shifted');
    else group.classList?.remove?.('ck21-shifted');
   }
   const e1=canvas.querySelector?.('.ck21-equilibrium-moving');
   if(e1){e1.style?.setProperty?.('--ck21-dx',fmt(next.end.x-next.start.x)+'px');
    e1.style?.setProperty?.('--ck21-dy',fmt(next.end.y-next.start.y)+'px');
    if(Math.abs(next.end.x-next.start.x)+Math.abs(next.end.y-next.start.y)>.01)e1.classList?.add?.('ck21-shifted');
    else e1.classList?.remove?.('ck21-shifted');
   }
   markerArrow(canvas,next.start,next.end);
   const eq=root.querySelector?.('.ck21-eq-after');
   if(eq)eq.textContent='그림상 균형가격 '+next.price+' · 균형거래량 '+next.quantity+
    ' (실제 시장 수치가 아닌 도식 비교입니다.)';
  }else overlayMarker(root,c,state);
  canvas.setAttribute?.('aria-valuenow',String(p));
  canvas.setAttribute?.('aria-valuetext',c.type==='both'?
   '수요 '+state.demand+'퍼센트, 공급 '+state.supply+'퍼센트. 가상 도식입니다':
   '전후 도식 '+p+'퍼센트'+(['demand','supply'].includes(c.type)?' · '+(sign>0?'오른쪽':'왼쪽')+' 이동':' · 곡선 위 관찰'));
 }
 root.classList?.toggle?.('ck149-moved',p>0);
 root.classList?.toggle?.('ck21-revealed',p>0);
 const cards=root.querySelector?.('[data-ck148-legacy]');
 const steps=window.CK148LearningSteps;
 if(cards&&steps&&m&&c.type==='both'){
  const model=steps.legacy(c,p,sign,state);
  if(model)cards.innerHTML=steps.render(model);
 }
 const stepOut=root.querySelector?.('[data-ck149-current]');
 if(stepOut)stepOut.textContent=c.type==='both'?
  '수요 '+state.demand+'% / 공급 '+state.supply+'%':
  (['demand','supply'].includes(c.type)?(sign>0?'오른쪽 ':'왼쪽 '):'관찰점 ')+p+'%';
 const tr=trackFor(c),undo=root.querySelector?.('[data-ck149-action="undo"]'),
  redo=root.querySelector?.('[data-ck149-action="redo"]');
 if(undo)undo.disabled=!tr?.canUndo;
 if(redo)redo.disabled=!tr?.canRedo;
 root.querySelectorAll?.('[data-ck149-select]')?.forEach?.(b=>
  b.setAttribute?.('aria-pressed',String(b.dataset.ck149Select===selectedCurve)));
 window.CK150ScenarioUI?.mountLegacy?.(root,c);
}
function mount(root,c){
 if(!root||!c)return;
 const tr=trackFor(c,Boolean(window.CK21Charts?.getState?.()?.phase));
 const controls=root.querySelector?.('[data-ck79-chart-modes]');
 if(controls&&!controls.querySelector?.('[data-ck149-tools]')&&document.createElement){
  const tools=document.createElement('div');tools.className='ck149-tools';tools.dataset.ck149Tools='';
  tools.innerHTML='<div class="ck149-tools-row" role="group" aria-label="도식 실험 되돌리기">'+
   '<button type="button" data-ck149-action="undo">↶ 이전</button>'+
   '<button type="button" data-ck149-action="redo">↷ 다시</button>'+
   '<button type="button" data-ck149-action="reset">초기화</button></div>'+
   (c.type==='both'?'<div class="ck149-tools-row" role="group" aria-label="함께 이동하는 선 선택">'+
    '<button type="button" data-ck149-select="demand" aria-pressed="true">수요 D 선</button>'+
    '<button type="button" data-ck149-select="supply" aria-pressed="false">공급 S 선</button></div>':'')+
   '<p class="ck149-tools-status"><strong>직접 조작</strong> 선이나 곡선 위 점을 잡고 이동하세요.'+
   ' 빈 공간은 조작 시작 지점이 아닙니다. <output data-ck149-current></output></p>'+
   '<small>이전 점선 · 현재 실선 / 도식 진행률은 실제 가격 변동률이 아닙니다.</small>';
  controls.append?.(tools);
 }
 if(tr?.state){
  const current=window.CK79Charts?.getState?.();
  if(current?.value!==tr.state.value||current?.sign!==tr.state.sign)apply(tr.state,root,c);
  else sync(root,c,tr.state);
 }
}
function afterUpdate(info,obs){
 const c=info?.chart,root=info?.root;if(!c||!root)return;
 const tr=trackFor(c,info.state?.phase),m=math();if(!tr||!m)return;
 // Initial paint of a newly created tab must not erase that figure's previous state.
 const initialPaint=!root.querySelector?.('[data-ck149-tools]');
 if(!writing&&!initialPaint){
  const s=tr.state,p=m.round(obs.value),sign=obs.sign;
  s.value=p;s.sign=sign;
  if(c.type==='both'){s.demand=p;s.supply=p;s.demandSign=sign;s.supplySign=sign;}
  else if(c.type==='demand'||c.type==='supply'){
   s[c.type]=p;s[c.type+'Sign']=sign;
  }
  tr.set(s);
 }
 sync(root,c,tr.state);
}
function change(s,c,root){
 const tr=trackFor(c),old=tr?.state;
 if(!tr||!s)return;
 tr.set(s);apply(s,root,c);
 return old;
}
function done(before,c,root){
 const tr=trackFor(c);if(tr&&before)tr.commit(before);
 if(tr)sync(root,c,tr.state);
}
function cancel(){
 if(!drag)return;
 const current=drag;drag=null;
 current.svg?.closest?.('.ck21-chart-section')?.classList?.remove?.('ck79-chart-dragging','ck149-grabbing');
 const track=tracks.get(current.id);track?.set(current.start);
 const info=active();
 if(info?.chart.id===current.id)apply(current.start,info.root,info.chart);
 try{current.svg?.releasePointerCapture?.(current.pointerId)}catch{}
}
document.addEventListener('pointerdown',e=>{
 const svg=e.target.closest?.('.ck21-chart-section svg.ck21-chart-svg');
 if(!svg||drag||e.isPrimary===false||(e.pointerType==='mouse'&&e.button!==0))return;
 const info=active(),m=math();if(!m||!info)return;
 const hit=m.nearest(svg,e,info.chart);
 if(!hit)return; // No grab: sliders and the surrounding page still work.
 const tr=trackFor(info.chart,info.phase);if(!tr)return;
 drag={svg,pointerId:e.pointerId,id:info.chart.id,kind:hit.kind,
  start:tr.state,first:{clientX:e.clientX,clientY:e.clientY,pointerType:e.pointerType}};
 if(hit.kind==='demand'||hit.kind==='supply')selectedCurve=hit.kind;
 selectedPaths.set(info.chart.id,hit.pathIndex||0);
 try{svg.setPointerCapture?.(e.pointerId)}catch{}
 svg.closest?.('.ck21-chart-section')?.classList?.add?.('ck79-chart-dragging','ck149-grabbing');
 if(e.cancelable)e.preventDefault();
},{capture:true,passive:false});
document.addEventListener('pointermove',e=>{
 if(!drag||e.pointerId!==drag.pointerId)return;
 const info=active(),m=math();
 if(!info||info.chart.id!==drag.id||!m){cancel();return}
 const next=m.drag(drag.start,info.chart,drag.kind,drag.first,e,drag.svg.getBoundingClientRect());
 if(next)change(next,info.chart,info.root);
 if(e.cancelable)e.preventDefault();
},{passive:false});
document.addEventListener('pointerup',e=>{
 if(!drag||e.pointerId!==drag.pointerId)return;
 const d=drag;drag=null;
 const info=active();
 if(info&&info.chart.id===d.id)done(d.start,info.chart,info.root);
 else tracks.get(d.id)?.set(d.start); // Route change cancels uncommitted stroke.
 d.svg?.closest?.('.ck21-chart-section')?.classList?.remove?.('ck79-chart-dragging','ck149-grabbing');
 try{d.svg?.releasePointerCapture?.(d.pointerId)}catch{}
});
document.addEventListener('pointercancel',e=>{if(drag&&drag.pointerId===e.pointerId)cancel()});
document.addEventListener('lostpointercapture',e=>{if(drag&&drag.pointerId===e.pointerId)cancel()});
window.addEventListener?.('blur',cancel);
document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel()});
document.addEventListener('click',e=>{
 const target=e.target.closest?.('[data-ck149-action],[data-ck149-select]');if(!target)return;
 const info=active();if(!info)return;
 const root=target.closest?.('.ck21-chart-section');if(root&&root!==info.root)return;
 const tr=trackFor(info.chart);if(!tr)return;
 const select=target.dataset.ck149Select;
 if(select){selectedCurve=select;sync(info.root,info.chart,tr.state);return}
 const action=target.dataset.ck149Action,was=tr.state;
 if(action==='undo'){const old=tr.undo();if(old)apply(old,info.root,info.chart)}
 if(action==='redo'){const next=tr.redo();if(next)apply(next,info.root,info.chart)}
 if(action==='reset'){const orig=tr.reset();apply(orig,info.root,info.chart)}
 sync(info.root,info.chart,tr.state);
});
document.addEventListener('keydown',e=>{
 const svg=e.target.closest?.('svg.ck79-chart-draggable');
 if(!svg||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
 if(e.altKey||e.metaKey||e.ctrlKey)return;
 const info=active(),tr=info&&trackFor(info.chart),m=math();if(!tr||!m)return;
 const start=tr.state;
 let target=e.key==='Home'?0:e.key==='End'?100:start.value+(e.key==='ArrowLeft'?-5:5);
 target=m.round(target);
 let next={...start,value:target};
 if(info.chart.type==='both'){
  next[selectedCurve]=target;next.value=Math.max(next.demand,next.supply);
 }else if(info.chart.type==='demand'||info.chart.type==='supply')next[info.chart.type]=target;
 change(next,info.chart,info.root);done(start,info.chart,info.root);
 e.preventDefault();e.stopImmediatePropagation?.();
},{capture:true});
document.addEventListener('input',e=>{
 if(!e.target.matches?.('[data-ck76-chart-scrub]'))return;
 const info=active(),tr=info&&trackFor(info.chart);
 if(tr&&!sliderDraft)sliderDraft={id:info.chart.id,start:tr.state};
},{capture:true});
document.addEventListener('change',e=>{
 if(!e.target.matches?.('[data-ck76-chart-scrub]')||!sliderDraft)return;
 const info=active();if(info&&info.chart.id===sliderDraft.id)done(sliderDraft.start,info.chart,info.root);
 sliderDraft=null;
});
document.addEventListener('click',e=>{
 const b=e.target.closest?.('[data-ck79-chart-direction],[data-ck21-play]');
 if(!b)return;
 const info=active(),tr=info&&trackFor(info.chart);if(!tr)return;
 const before=tr.state;
 // The old click handler runs later; commit after its update in a microtask.
 Promise.resolve().then(()=>{const now=active();if(now&&now.chart.id===info.chart.id)done(before,now.chart,now.root)});
},{capture:true});
function applyStudyCase(chartId,action){
 const info=active(),m=math();if(!info||info.chart.id!==chartId||!action||drag||sliderDraft||!m)return false;
 const tr=trackFor(info.chart);if(!tr)return false;
 const before=tr.state,p=m.round(action.progress),next={...before,value:p};
 if(['demand','supply'].includes(info.chart.type)){
  if(![-1,1].includes(action.sign))return false;
  next.sign=action.sign;next[info.chart.type]=p;next[info.chart.type+'Sign']=next.sign;
 }else if(info.chart.type==='both'){
  for(const side of ['demand','supply']){
   if(!Number.isFinite(action[side])||![-1,1].includes(action[side+'Sign']))return false;
   next[side]=m.round(action[side]);next[side+'Sign']=action[side+'Sign'];
  }
  next.value=Math.max(next.demand,next.supply);next.sign=next.demandSign;
 }
 if(JSON.stringify(next)===JSON.stringify(before))return false;
 change(next,info.chart,info.root);done(before,info.chart,info.root);return true;
}
const api=Object.freeze({enabled:true,mount,afterUpdate,cancel,applyStudyCase,getState:()=>{
 const info=active(),tr=info&&trackFor(info.chart);return tr?
  {id:info.chart.id,...tr.state,past:tr.pastCount,future:tr.futureCount,selectedCurve}:null;
},getAll:()=>[...tracks.keys()]});
window.CK149GraphEnhance=api;
})();