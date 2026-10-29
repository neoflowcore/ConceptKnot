/* ConceptKnot v19: Excel-like keyboard KeyTips and spatial focus.
   All shortcuts are client-only, do not touch typed records or stage state.
   Tap Ctrl, release, then digit selects tab; Ctrl+Z/X goes previous/next typing item;
   Ctrl+WASD moves between clickable targets (Alt+Shift+WASD fallback).
*/
(function(){
 'use strict';
 const routes=[
  ['home','오늘의 학습'],['theory','핵심 이론'],['visual','그림 연상'],
  ['typing','타이핑'],['listen','문제·정답'],['reverse','기출 → 이론'],
  ['quiz','모의고사'],['calc','계산 집중'],['exam','10개년 기출'],
  ['venn','비교 도형'],['wrong','오답 복습'],['plan','학습 계획'],
  ['final','정리본']
 ];
 const FOCUSABLE='button:not([disabled]),a[href],input:not([disabled]):not([type="hidden"]),textarea:not([disabled]),select:not([disabled]),[role="button"][tabindex],[role="separator"][tabindex]';
 let mode=false,prefix='',digitTimer=0,ctrlUsed=false,ctrlDown=false,shown=null,refreshScheduled=0;
 const view=()=>document.body?.dataset.ckV8Tab||document.querySelector('#main .board-tab.active')?.dataset.go||'home';
 const isEditor=node=>Boolean(node?.closest?.('textarea,input,select,[contenteditable],[role="textbox"]'));
 const printable=key=>/^[0-9]$/.test(key);
 const accessible=el=>{
  if(!el||!el.isConnected||el.disabled||el.matches?.('[aria-hidden="true"],[inert]')||
     el.closest?.('[hidden],[inert],[aria-hidden="true"]'))return false;
  if(!el.getClientRects().length)return false;
  const r=el.getBoundingClientRect(),style=getComputedStyle(el);
  return r.width>=2&&r.height>=2&&style.visibility!=='hidden'&&style.display!=='none';
 };
 function badgeBar(){
  let bar=document.getElementById('ck19-keytip-info');
  if(bar)return bar;
  bar=document.createElement('div');bar.id='ck19-keytip-info';
  bar.setAttribute('role','status');bar.setAttribute('aria-live','polite');
  bar.textContent='Ctrl을 눌렀다 놓고 번호 입력 · 10~13은 숫자 연속 입력 · Esc: 닫기';
  document.body.append(bar);return bar;
 }
 function highlight(on){
  mode=on;
  prefix='';
  clearTimeout(digitTimer);digitTimer=0;
  document.body?.classList.toggle('ck19-keytip-mode',on);
  if(on)badgeBar().textContent='학습 탭 번호를 누르세요 · 1~9 / 10~13 · Esc: 닫기';
 }
 function installBadges(){
  const nav=document.querySelector('#main .ck-v7-nav-pill .board-tabs');
  if(!nav)return;
  for(const [i,item] of routes.entries()){
   const tab=Array.from(nav.querySelectorAll('button.board-tab[data-go]')).find(b=>b.dataset.go===item[0]);
   if(!tab)continue;
   let tip=tab.querySelector('.ck19-keytip');
   if(!tip){tip=document.createElement('span');tip.className='ck19-keytip';tip.setAttribute('aria-hidden','true');tab.append(tip)}
   tip.textContent=String(i+1);
   tab.dataset.ck19Shortcut=String(i+1);
  }
 }
 function jump(n){
  if(!Number.isInteger(n)||n<1||n>routes.length)return;
  const page=routes[n-1][0];
  const btn=Array.from(document.querySelectorAll('#main .board-tab[data-go]')).find(b=>b.dataset.go===page);
  highlight(false);
  if(btn)btn.click();
 }
 function digit(key){
  const bar=badgeBar();
  if(prefix==='1'&&/^[0-3]$/.test(key)){
   clearTimeout(digitTimer);digitTimer=0;
   jump(10+Number(key));return;
  }
  if(prefix==='0'&&/^[1-9]$/.test(key)){
   clearTimeout(digitTimer);digitTimer=0;
   jump(Number(key));return;
  }
  clearTimeout(digitTimer);digitTimer=0;
  prefix='';
  if(key==='1'){
   prefix='1';
   bar.textContent='1: 오늘의 학습 · 이어서 0~3을 누르면 10~13번 탭으로 이동합니다.';
   digitTimer=setTimeout(()=>{if(mode&&prefix==='1')jump(1)},750);
   return;
  }
  if(key==='0'){
   prefix='0';
   bar.textContent='이어서 1~9를 눌러 해당 학습 탭으로 이동합니다.';
   digitTimer=setTimeout(()=>{prefix='';bar.textContent='1~13 중 탭 번호를 입력하세요.'},1500);
   return;
  }
  if(/^[2-9]$/.test(key))jump(Number(key));
 }
 function clearSpatial(){
  if(shown?.isConnected)shown.classList.remove('ck19-spatial-focus');
  shown=null;
 }
 function candidates(){
  return Array.from(document.querySelectorAll(FOCUSABLE)).filter(accessible);
 }
 function center(el){
  const r=el.getBoundingClientRect();
  return {x:r.left+r.width/2,y:r.top+r.height/2};
 }
 function spatialMove(key){
  const eligible=candidates();
  if(!eligible.length)return false;
  const active=document.activeElement;
  let origin=accessible(active)?active:shown&&accessible(shown)?shown:null;
  if(!origin){
   origin=eligible.find(el=>el.closest('#main .ck-v7-content')&&el.getBoundingClientRect().top>=0)
    ||eligible.find(el=>el.closest('#main .ck-v7-content'))||eligible[0];
   clearSpatial();shown=origin;shown.classList.add('ck19-spatial-focus');
   shown.focus({preventScroll:true});shown.scrollIntoView({block:'nearest',inline:'nearest'});
   return true;
  }
  const base=center(origin);
  const direction={w:[0,-1],s:[0,1],a:[-1,0],d:[1,0]}[key];
  if(!direction)return false;
  let best=null,score=Infinity;
  for(const el of eligible){
   if(el===origin)continue;
   const pos=center(el),dx=pos.x-base.x,dy=pos.y-base.y;
   const forward=dx*direction[0]+dy*direction[1];
   if(forward<6)continue;
   const perpendicular=Math.abs(dx*direction[1]-dy*direction[0]);
   // Favor aligned controls on the same line before farther diagonal options.
   const candidate=forward+perpendicular*2.6+Math.hypot(dx,dy)*.12;
   if(candidate<score){score=candidate;best=el}
  }
  if(!best)return false;
  clearSpatial();
  shown=best;best.classList.add('ck19-spatial-focus');
  best.focus({preventScroll:true});
  best.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
  return true;
 }
 function handleKeyboard(e){
  if(e.isComposing||e.key==='Process'||e.keyCode===229)return;
  if(e.key==='Control'){
   ctrlDown=true;ctrlUsed=false;
   // Show KeyTips when Ctrl is tapped; Ctrl+digit is reserved by browsers,
   // so release Ctrl before choosing a number.
   if(!e.repeat&&!e.altKey&&!e.metaKey&&!e.shiftKey&&!isEditor(e.target)){
    e.preventDefault();
    highlight(!mode);
   }
   return;
  }
  if(ctrlDown&&e.ctrlKey){
   ctrlUsed=true;
   // A real Ctrl shortcut takes priority (undo, copy, WASD, Enter, etc.).
   if(mode)highlight(false);
  }
  if(e.key==='Escape'){
   if(mode){e.preventDefault();highlight(false);return}
   if(shown){clearSpatial();if(isEditor(document.activeElement))document.activeElement.blur();return}
  }
  if(mode&&!e.ctrlKey&&!e.altKey&&!e.metaKey){
   if(printable(e.key)){
    e.preventDefault();e.stopImmediatePropagation();digit(e.key);return;
   }
   if(e.key==='Enter'&&prefix==='1'){
    e.preventDefault();e.stopImmediatePropagation();jump(1);return;
   }
   if(e.key==='Tab'){highlight(false);return}
   if(e.key==='Control')return;
  }
  // Browser Ctrl+W may be reserved for closing a tab, so Alt+Shift+WASD
  // is a second, non-reserved option. No shortcuts while IME is composing.
  const letter=String(e.key||'').toLowerCase();
  const controlNav=e.ctrlKey&&!e.altKey&&!e.metaKey&&!e.shiftKey;
  const fallbackNav=e.altKey&&e.shiftKey&&!e.ctrlKey&&!e.metaKey;
  if(view()==='typing'&&controlNav&&(letter==='z'||letter==='x')){
   e.preventDefault();e.stopImmediatePropagation();
   document.querySelector(letter==='z'?'[data-typing-prev]':'[data-typing-next]')?.click();
   return;
  }
  if((controlNav||fallbackNav)&&'wasd'.includes(letter)&&letter.length===1){
   // Ctrl+A preserves Select All inside editable fields. Esc exits a field,
   // or use Alt+Shift+WASD to navigate without stealing editing shortcuts.
   if(controlNav&&isEditor(e.target)&&letter==='a')return;
   const moved=spatialMove(letter);
   if(moved){e.preventDefault();e.stopImmediatePropagation()}
   return;
  }
  if((e.ctrlKey||e.altKey)&&e.key==='Enter'&&shown&&accessible(shown)&&!isEditor(shown)){
   e.preventDefault();shown.click();return;
  }
  if(e.key==='F2'&&!e.ctrlKey&&!e.altKey&&!e.metaKey){
   e.preventDefault();highlight(!mode);
  }
 }
 document.addEventListener('keydown',handleKeyboard,true);
 document.addEventListener('keyup',e=>{if(e.key==='Control'){ctrlDown=false;ctrlUsed=false}},true);
 window.addEventListener('blur',()=>{ctrlDown=false;if(mode)highlight(false)});
 document.addEventListener('pointerdown',()=>{if(mode)highlight(false);clearSpatial()},true);
 document.addEventListener('focusin',e=>{if(shown&&shown!==e.target)clearSpatial()},true);
 function updateBadges(){
  refreshScheduled=0;installBadges();
  if(shown&&!shown.isConnected)shown=null;
 }
 function boot(){
  installBadges();
  const main=document.getElementById('main');
  if(main&&typeof MutationObserver==='function'){
   new MutationObserver(records=>{
    if(records.some(r=>r.target===main)&&!refreshScheduled){
     refreshScheduled=requestAnimationFrame(updateBadges);
    }
   }).observe(main,{childList:true});
  }
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
 window.CK19Keyboard=Object.freeze({routeCount:routes.length,mode:()=>mode,close:()=>highlight(false)});
})();