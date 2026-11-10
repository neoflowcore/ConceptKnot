/* ConceptKnot v21 mobile note board: stylus gesture protection and height grip.
 * Uses saved height in localStorage; never overwrites study-note text or ink.
 */
(function(){
'use strict';
const KEY='ck21-board-extend';
let board=null,handle=null,drag=null,extend=0;
try{extend=Math.max(-180,Math.min(750,Number(localStorage.getItem(KEY))||0))}catch{}
let locked=false;
function syncLock(){
 // Palm rejection belongs to the drawing surface, never the whole document.
 locked=false;
 document.body.classList.remove('ck22-pen-locked');
 document.body.style.removeProperty('top');
}

// v157: never toggle global body locking classes on every height move. That
// caused repaint/flicker and interfered with S Pen drawing during board resize.
const apply=()=>{
 const nextBoard=document.querySelector('#main .ck-v7-board');
 if(board&&nextBoard!==board&&drag){extend=drag.initial;drag=null;}
 board=nextBoard;
 if(!board)return;
 const stampKey='ck22-note-created:'+board.dataset.ckV7Key;
 try{if(!localStorage.getItem(stampKey))localStorage.setItem(stampKey,new Date().toISOString())}catch{}
 board.style.setProperty('--ck21-board-extend',extend+'px');
 handle=board.querySelector('[data-ck21-board-resize]');
 if(handle)handle.setAttribute('aria-valuenow',String(extend));
};
const clamp=v=>Math.max(-180,Math.min(750,Math.round(v)));
function save(){try{localStorage.setItem(KEY,String(extend))}catch{}}
document.addEventListener('pointerdown',e=>{
 const target=e.target.closest?.('[data-ck21-board-resize]');
 if(target){
  // A second finger/palm must never steal the first pointer's resize state.
  if(drag||e.isPrimary===false||(e.pointerType==='mouse'&&e.button!==0))return;
  if(e.cancelable)e.preventDefault();
  drag={id:e.pointerId,from:e.clientY,initial:extend,handle:target};
  try{target.setPointerCapture?.(e.pointerId)}catch{}
  return;
 }
 // Stop mobile panning while a real pen draws on this specific surface.
 if(e.pointerType==='pen'&&e.target.closest?.('.ck-v7-writing-surface')){
  document.body.classList.add('ck21-stylus-writing');
 }
},true);
document.addEventListener('pointermove',e=>{
 if(!drag||drag.id!==e.pointerId)return;
 if(e.cancelable)e.preventDefault();
 extend=clamp(drag.initial+e.clientY-drag.from);apply();
},{passive:false,capture:true});
function finish(e){
 if(drag&&e.pointerId===drag.id){
  const previous=drag;drag=null;
  // A canceled touch (system gesture, palm contact or lost capture) must not
  // persist an accidental height. Commit only on a real pointerup.
  if(e.type!=='pointerup'){extend=previous.initial;apply();}
  else save();
  if(e.type==='pointerup'){
   try{previous.handle?.releasePointerCapture?.(previous.id)}catch{}
  }
 }
 if(e.pointerType==='pen')document.body?.classList.remove('ck21-stylus-writing');
}
for(const event of ['pointerup','pointercancel','lostpointercapture'])document.addEventListener(event,finish,true);
function releaseTransientState(){
 if(drag){extend=drag.initial;drag=null;apply();}
 document.body?.classList.remove('ck21-stylus-writing');
 syncLock();
}
window.addEventListener('blur',releaseTransientState);
document.addEventListener('visibilitychange',()=>{if(document.hidden)releaseTransientState()});
document.addEventListener('keydown',e=>{
 if(!e.target.closest?.('[data-ck21-board-resize]'))return;
 if(!['ArrowUp','ArrowDown','Home'].includes(e.key))return;
 e.preventDefault();
 extend=e.key==='Home'?0:clamp(extend+(e.key==='ArrowDown'?20:-20));apply();save();
},true);
function boot(){
 const main=document.getElementById('main');
 if(main)new MutationObserver(records=>{if(records.some(r=>r.type==='childList'&&r.target===main))apply();}).observe(main,{childList:true});
 window.addEventListener('resize',syncLock);
 window.addEventListener('ck:scene-activity',releaseTransientState);
 syncLock();apply();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.CK21Board=Object.freeze({getState:()=>({extend,dragging:!!drag,scrollLocked:locked}),setHeight:n=>{extend=clamp(Number(n)||0);apply();save()}});
})();