/* ConceptKnot v16 — generic two-card splitter, persisted independently per tab.
 * A real accessible separator (mouse, touch, keyboard, reset on double-click).
 */
(function(){
'use strict';
const PREFIX='ck16-layout:';
const SELECTORS='.exam-layout,.dashboard-grid,.theory-layout,.settings-grid,.compact-grid,.quiz-layout';
const MIN_DESKTOP=940;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
let drag=null,scheduled=0;
function read(k){
 try{const n=Number(localStorage.getItem(PREFIX+k));return Number.isFinite(n)&&n>=5&&n<=95?n:null}catch(e){return null}
}
function save(k,val){try{localStorage.setItem(PREFIX+k,String(val))}catch(e){}}
function childrenOf(el){
 return Array.from(el.children).filter(child=>child.nodeType===1&&!child.matches('[data-ck16-split]'));
}
function defaultWidth(layout){return layout.matches('.exam-layout')?56:layout.matches('.dashboard-grid')?59:50}
function keyFor(layout,index){
 return (document.body.dataset.ckV8Tab||'home')+':'+(layout.dataset.ck16SplitGrid||Array.from(layout.classList).find(v=>v.endsWith('-grid')||v.endsWith('-layout'))||'cards')+':'+index;
}
function limits(el){
 const w=el.getBoundingClientRect().width;
 const other=el.matches('.exam-layout')?90:65;
 const lo=Math.max(5,Math.min(10,90/w*100));
 const hi=Math.min(95,Math.max(85,(w-other-12)/w*100));
 return {lo:Math.min(lo,hi),hi:Math.max(lo,hi)};
}
function apply(layout,value,persist){
 if(!layout)return;
 const {lo,hi}=limits(layout);
 const n=clamp(Number.isFinite(value)?value:defaultWidth(layout),lo,hi);
 layout.style.setProperty('--ck16-left',n.toFixed(1)+'%');
 const bar=layout.querySelector(':scope > [data-ck16-split]');
 if(bar){bar.setAttribute('aria-valuemin',String(Math.round(lo)));bar.setAttribute('aria-valuemax',String(Math.round(hi)));bar.setAttribute('aria-valuenow',String(Math.round(n)));bar.setAttribute('aria-valuetext','왼쪽 '+Math.round(n)+'% · 오른쪽 '+Math.round(100-n)+'%')}
 if(persist)save(layout.dataset.ck16Key,n);
}
function eligible(layout){
 const nodes=childrenOf(layout);
 if(nodes.length!==2)return false;
 if(window.innerWidth<MIN_DESKTOP)return false;
 if(getComputedStyle(layout).display!=='grid')return false;
 const a=nodes[0].getBoundingClientRect(),b=nodes[1].getBoundingClientRect();
 return a.width>90&&b.width>90&&b.left>a.left+35&&Math.abs(b.top-a.top)<18;
}
function makeDivider(){
 const el=document.createElement('div');
 el.className='ck16-column-divider';el.dataset.ck16Split='';
 el.setAttribute('role','separator');el.tabIndex=0;
 el.setAttribute('aria-orientation','vertical');el.setAttribute('aria-valuemin','27');el.setAttribute('aria-valuemax','75');
 el.setAttribute('aria-label','두 카드의 좌우 폭 조절');
 el.title='드래그로 폭 조절 · ← → 키 · 더블클릭 초기화';
 const grip=document.createElement('span');grip.className='ck16-grip';grip.setAttribute('aria-hidden','true');grip.textContent='⋮';
 el.appendChild(grip);return el;
}
function setup(){
 scheduled=0;
 const root=document.getElementById('main');
 if(!root)return;
 const matches=Array.from(root.querySelectorAll(SELECTORS));
 matches.forEach((layout,i)=>{
  const bar=layout.querySelector(':scope > [data-ck16-split]');
  if(!bar){
   if(!eligible(layout))return;
   const nodes=childrenOf(layout);
   nodes[0].after(makeDivider());
  }else if(window.innerWidth>=MIN_DESKTOP && !eligibleRestored(layout)){
   // Existing PDF/OMR divider is a declared part of the markup. Keep it.
  }
  if(childrenOf(layout).length!==2)return;
  layout.classList.add('ck16-split-grid');
  layout.dataset.ck16Key=keyFor(layout,i);
  apply(layout,read(layout.dataset.ck16Key)??defaultWidth(layout),false);
 });
}
function eligibleRestored(layout){
 const nodes=childrenOf(layout);return nodes.length===2&&window.innerWidth>=MIN_DESKTOP;
}
function schedule(){
 if(scheduled)return;
 scheduled=requestAnimationFrame(setup);
}
function dividerOf(e){return e.target?.closest?.('[data-ck16-split]')}
function layoutOf(bar){return bar?.parentElement?.classList.contains('ck16-split-grid')?bar.parentElement:null}
function updatePointer(e){
 if(!drag||drag.pointerId!==e.pointerId)return;
 const rect=drag.layout.getBoundingClientRect();
 const pct=(e.clientX-rect.left)/Math.max(1,rect.width)*100;
 apply(drag.layout,pct,false);e.preventDefault();
}
function finishPointer(e){
 if(!drag||drag.pointerId!==e.pointerId)return;
 const {layout,bar,pointerId}=drag;
 try{if(bar.hasPointerCapture(pointerId))bar.releasePointerCapture(pointerId)}catch(error){}
 drag=null;
 const current=parseFloat(layout.style.getPropertyValue('--ck16-left'));
 if(Number.isFinite(current))apply(layout,current,true);
}
document.addEventListener('pointerdown',e=>{
 const bar=dividerOf(e),layout=layoutOf(bar);
 if(!layout||e.button!==0||window.innerWidth<MIN_DESKTOP)return;
 drag={bar,layout,pointerId:e.pointerId};
 try{bar.setPointerCapture(e.pointerId)}catch(err){}
 bar.focus({preventScroll:true});
 e.preventDefault();e.stopPropagation();
},true);
document.addEventListener('pointermove',updatePointer,true);
document.addEventListener('pointerup',finishPointer,true);
document.addEventListener('pointercancel',finishPointer,true);
document.addEventListener('dblclick',e=>{
 const bar=dividerOf(e),layout=layoutOf(bar);
 if(!layout)return;
 e.preventDefault();e.stopPropagation();
 apply(layout,defaultWidth(layout),true);
},true);
// Capture before exam's left/right question shortcuts.
document.addEventListener('keydown',e=>{
 const bar=dividerOf(e),layout=layoutOf(bar);
 if(!layout)return;
 if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
 e.preventDefault();e.stopImmediatePropagation();
 const now=parseFloat(layout.style.getPropertyValue('--ck16-left'))||defaultWidth(layout);
 const bounds=limits(layout);
 const next=e.key==='Home'?bounds.lo:e.key==='End'?bounds.hi:now+(e.key==='ArrowLeft'?-3:3);
 apply(layout,next,true);
},true);
function boot(){
 const root=document.getElementById('main');
 if(!root)return;
 new MutationObserver(records=>{
  if(records.some(r=>r.target===root))schedule();
 }).observe(root,{childList:true});
 window.addEventListener('resize',schedule,{passive:true});
 schedule();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.CK16Resize=Object.freeze({refresh:schedule});
})();
