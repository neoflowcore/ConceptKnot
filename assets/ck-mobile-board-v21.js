/* ConceptKnot v21 mobile note board: stylus gesture protection and height grip.
 * Uses saved height in localStorage; never overwrites study-note text or ink.
 */
(function(){
'use strict';
const KEY='ck21-board-extend';
let board=null,handle=null,drag=null,extend=0;
try{extend=Math.max(-180,Math.min(750,Number(localStorage.getItem(KEY))||0))}catch{}
const apply=()=>{
 board=document.querySelector('#main .ck-v7-board');
 if(!board)return;
 board.style.setProperty('--ck21-board-extend',extend+'px');
 handle=board.querySelector('[data-ck21-board-resize]');
 if(handle)handle.setAttribute('aria-valuenow',String(extend));
};
const clamp=v=>Math.max(-180,Math.min(750,Math.round(v)));
function save(){try{localStorage.setItem(KEY,String(extend))}catch{}}
document.addEventListener('pointerdown',e=>{
 const target=e.target.closest?.('[data-ck21-board-resize]');
 if(target){
  e.preventDefault();
  drag={id:e.pointerId,from:e.clientY,initial:extend};
  target.setPointerCapture?.(e.pointerId);
  return;
 }
 // Stop mobile panning while a real pen draws on this specific surface.
 if(e.pointerType==='pen'&&e.target.closest?.('.ck-v7-writing-surface')){
  document.body.classList.add('ck21-stylus-writing');
 }
},true);
document.addEventListener('pointermove',e=>{
 if(!drag||drag.id!==e.pointerId)return;
 e.preventDefault();extend=clamp(drag.initial+e.clientY-drag.from);apply();
},{passive:false,capture:true});
function finish(e){
 if(drag&&e.pointerId===drag.id){drag=null;save()}
 if(e.pointerType==='pen')document.body?.classList.remove('ck21-stylus-writing');
}
for(const event of ['pointerup','pointercancel','lostpointercapture'])document.addEventListener(event,finish,true);
document.addEventListener('touchmove',e=>{
 if(document.body?.classList.contains('ck21-stylus-writing')&&
  (e.target?.closest?.('.ck-v7-writing-surface')||e.target?.closest?.('.ck-v7-board'))){
  if(e.cancelable)e.preventDefault();
 }
},{passive:false,capture:true});
document.addEventListener('keydown',e=>{
 if(!e.target.closest?.('[data-ck21-board-resize]'))return;
 if(!['ArrowUp','ArrowDown','Home'].includes(e.key))return;
 e.preventDefault();
 extend=e.key==='Home'?0:clamp(extend+(e.key==='ArrowDown'?20:-20));apply();save();
},true);
function boot(){
 const main=document.getElementById('main');
 if(main)new MutationObserver(records=>{if(records.some(r=>r.target===main))apply()}).observe(main,{childList:true});
 apply();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.CK21Board=Object.freeze({getState:()=>({extend,dragging:!!drag}),setHeight:n=>{extend=clamp(Number(n)||0);apply();save()}});
})();