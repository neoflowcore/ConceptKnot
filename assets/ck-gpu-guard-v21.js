/* ConceptKnot v21 — hard-stop visual background on any study tab.
 * Not a global animation killer: user-requested chart playback, S Pen, timer,
 * scrolling, and accessibility remain usable.
 */
(function(){
 'use strict';
 let paused=0,activeLast=null,focused=true;
 const media=window.matchMedia?.('(prefers-reduced-motion: reduce)');
 const active=()=>document.body?.dataset.ckV8Tab==='landing'&&focused&&!document.hidden&&!media?.matches;
 const scene=()=>document.getElementById('ck-v8-ambient');
 function sync(){
  const on=active(),el=scene();
  if(on===activeLast&&el?.dataset.ck22Synced===String(on))return;
  if(el)el.dataset.ck22Synced=String(on);
  activeLast=on;
  document.documentElement.dataset.ck21Garden=on?'running':'suspended';
  document.body?.classList.toggle('ck21-garden-suspended',!on);
  if(!el)return;
  el.style.visibility=on?'visible':'hidden';
  el.style.pointerEvents='none';
  // Pause actual SVG/CSS/WAAPI animations, not only the parent animation flag.
  if(typeof el.getAnimations==='function'){
   let count=0;
   try{for(const a of el.getAnimations({subtree:true})){
    if(!on&&a.playState==='running'){a.pause();count++;}
    else if(on&&a.playState==='paused')a.play();
   }}catch(err){}
   if(!on)paused+=count;
  }
  window.CK21Garden?.onChange?.(on);
 }
 function boot(){
  const body=document.body;if(!body)return;
  new MutationObserver(sync).observe(body,{attributes:true,attributeFilter:['data-ck-v8-tab']});
  document.addEventListener('visibilitychange',sync);
  window.addEventListener('ck:scene-activity',sync);
  window.addEventListener('blur',()=>{focused=false;sync()});
  window.addEventListener('focus',()=>{focused=true;sync()});
  media?.addEventListener?.('change',sync);
  sync();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
 window.CK21Garden=Object.freeze({
  getState:()=>({active:active(),mode:document.documentElement.dataset.ck21Garden||'unknown',pausedAnimations:paused,webgl:window.CK3DPerformance?.getState?.()||null}),
  forceSync:sync
 });
})();