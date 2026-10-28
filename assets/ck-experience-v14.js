/* ConceptKnot v14 — unobtrusive night mode, persistent Pomodoro and measured chalk caret.
 * Pure client-side UI, no API tokens / timers in the server / saved text uploads.
 */
(function(){
'use strict';
const themeKey='conceptknot-theme-v14';
const root=document.documentElement;
let mode='light';
try{mode=localStorage.getItem(themeKey)==='dark'?'dark':'light'}catch(e){}
function themeApply(next){
 mode=next==='dark'?'dark':'light';
 root.dataset.ckTheme=mode;root.style.colorScheme=mode;
 try{localStorage.setItem(themeKey,mode)}catch(e){}
 document.querySelectorAll('[data-ck14-theme]').forEach(b=>{
  b.setAttribute('aria-pressed',String(mode==='dark'));
  b.setAttribute('aria-label',mode==='dark'?'라이트 모드 켜기':'다크 모드 켜기');
  b.title=mode==='dark'?'밝은 화면으로':'어두운 화면으로';
 });
}
themeApply(mode);
const clock=seconds=>{
 const s=Math.max(0,Math.ceil(Number(seconds)||0));
 return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
};
let pop=null;
function ensurePopover(){
 if(pop)return pop;
 pop=document.createElement('section');
 pop.id='ck14-pomodoro';
 pop.className='ck14-pomodoro';
 pop.setAttribute('role','dialog');pop.setAttribute('aria-label','뽀모도로 집중 및 휴식 타이머');
 pop.hidden=true;
 pop.innerHTML=[
  '<header class="ck14-pomo-head"><strong>뽀모도로</strong><button type="button" data-ck14-pomo-close aria-label="타이머 닫기">×</button></header>',
  '<div class="ck14-pomo-ring"><span data-ck14-pomo-phase>집중</span><strong data-ck14-pomo-time>25:00</strong><small data-ck14-pomo-completed>완료 0회</small></div>',
  '<div class="ck14-pomo-config">',
  ' <label>집중 <input type="number" data-ck14-pomo-minutes="focus" min="5" max="180" step="1" inputmode="numeric" value="25">분</label>',
  ' <label>휴식 <input type="number" data-ck14-pomo-minutes="break" min="1" max="60" step="1" inputmode="numeric" value="5">분</label>',
  '</div>',
  '<div class="ck14-pomo-actions">',
  ' <button type="button" data-ck14-pomo-action="toggle">집중 시작</button>',
  ' <button type="button" data-ck14-pomo-action="reset">초기화</button>',
  ' <button type="button" data-ck14-pomo-action="skip">다음 단계</button>',
  '</div>',
  '<p class="ck14-pomo-caption">집중 완료 후 휴식으로 전환됩니다. 시작은 직접 선택하세요. 진행 시간은 탭을 바꾸거나 새로고침해도 유지됩니다.</p>'
 ].join('');
 document.body.append(pop);
 return pop;
}
function pano(){
 const api=window.CKPomo;
 if(!api?.snapshot)return null;
 try{return api.snapshot()}catch(e){return null}
}
function updateClock(){
 const s=pano();if(!s)return;
 document.querySelectorAll('[data-ck14-clock]').forEach(node=>{
  const val=clock(s.remaining);
  if(node.textContent!==val)node.textContent=val;
 });
 document.querySelectorAll('[data-ck14-pomo-toggle]').forEach(btn=>{
  btn.title=(s.phase==='break'?'휴식':'집중')+' · '+clock(s.remaining);
  btn.setAttribute('aria-expanded',String(Boolean(pop&&!pop.hidden)));
  btn.classList.toggle('ck14-pomo-running',s.running);
 });
 // Keep the original home timer and the ribbon tied to the very same deadline.
 const homeDisplay=document.getElementById('timer-display');
 if(homeDisplay)homeDisplay.textContent=clock(s.remaining);
 const homeAction=document.querySelector('[data-action="timer-toggle"]');
 if(homeAction)homeAction.textContent=s.running?'일시정지':s.phase==='break'?'휴식 시작':'집중 시작';
 const homeTitle=homeDisplay?.closest('.panel')?.querySelector('.panel-head h3');
 if(homeTitle)homeTitle.textContent='뽀모도로 · '+(s.phase==='break'?'휴식':'집중');
 if(!pop)return;
 const phase=pop.querySelector('[data-ck14-pomo-phase]');
 const time=pop.querySelector('[data-ck14-pomo-time]');
 const completed=pop.querySelector('[data-ck14-pomo-completed]');
 if(phase)phase.textContent=s.phase==='break'?'휴식':'집중';
 if(time)time.textContent=clock(s.remaining);
 if(completed)completed.textContent='완료 '+s.completed+'회';
 const focus=pop.querySelector('[data-ck14-pomo-minutes="focus"]'),rest=pop.querySelector('[data-ck14-pomo-minutes="break"]');
 if(focus&&document.activeElement!==focus)focus.value=String(s.focusMinutes);
 if(rest&&document.activeElement!==rest)rest.value=String(s.breakMinutes);
 const toggle=pop.querySelector('[data-ck14-pomo-action="toggle"]');
 if(toggle)toggle.textContent=s.running?'일시정지':s.phase==='break'?'휴식 시작':'집중 시작';
 const circle=pop.querySelector('.ck14-pomo-ring');
 if(circle){
  const done=s.duration?Math.max(0,Math.min(1,1-s.remaining/s.duration)):0;
  circle.style.setProperty('--ck14-progress',(done*100).toFixed(2)+'%');
  circle.dataset.phase=s.phase;
 }
}
function togglePopover(){
 const element=ensurePopover();
 element.hidden=!element.hidden;
 updateClock();
 if(!element.hidden)element.querySelector('[data-ck14-pomo-action="toggle"]')?.focus({preventScroll:true});
}
function closePopover(){if(!pop)return;pop.hidden=true;updateClock()}
let caretFrame=0;
function scheduleCaret(){
 if(caretFrame)return;
 caretFrame=requestAnimationFrame(()=>{caretFrame=0;drawChalkCaret()});
}
function drawChalkCaret(){
 const field=document.querySelector('.ck-v7-board .ck-v7-writing-surface .chalk-editor[data-chalk-kind="notes"]');
 if(!field)return;
 const textarea=field.querySelector('textarea'),mirror=field.querySelector('.chalk-mirror');
 if(!textarea||!mirror)return;
 let visual=field.querySelector('.ck14-mirror-caret');
 if(!visual){
  visual=document.createElement('span');visual.className='ck14-mirror-caret';
  visual.setAttribute('aria-hidden','true');field.append(visual);
 }
 const spen=Boolean(field.closest('.ck9-spen-active'))||
  field.closest('.ck-v7-board')?.querySelector('[data-ck9-spen="toggle"]')?.getAttribute('aria-pressed')==='true';
 if(document.activeElement!==textarea||spen||textarea.selectionStart!==textarea.selectionEnd){
  visual.hidden=true;field.classList.remove('ck14-mirror-caret-on');return;
 }
 const glyphs=Array.from(mirror.querySelectorAll('.chalk-letter'));
 const sel=Math.max(0,Math.min(textarea.selectionStart,textarea.value.length));
 const range=document.createRange();let found=false,remaining=sel;
 for(const glyph of glyphs){
  const node=glyph.firstChild;
  if(!node||node.nodeType!==Node.TEXT_NODE)continue;
  const size=node.textContent.length;
  if(remaining<=size){
   range.setStart(node,remaining);range.collapse(true);found=true;break;
  }
  remaining-=size;
 }
 let rect=null;
 if(found){
  const list=range.getClientRects();rect=list.length?list[list.length-1]:range.getBoundingClientRect();
 }
 const surface=field.getBoundingClientRect();
 const style=getComputedStyle(textarea);
 const glyphSize=parseFloat(style.fontSize)||18;
 const pad=parseFloat(getComputedStyle(mirror).paddingLeft)||0;
 const padTop=parseFloat(getComputedStyle(mirror).paddingTop)||0;
 const caretH=Math.max(12,Math.min(45,glyphSize*1.55));
 const left=rect&&Number.isFinite(rect.left)&&rect.height>0?rect.left-surface.left:mirror.getBoundingClientRect().left-surface.left+pad;
 const top=rect&&Number.isFinite(rect.top)&&rect.height>0?rect.top-surface.top:mirror.getBoundingClientRect().top-surface.top+padTop;
 visual.style.left=Math.max(0,left)+'px';
 visual.style.top=Math.max(0,top)+'px';
 visual.style.height=caretH+'px';
 visual.hidden=false;field.classList.add('ck14-mirror-caret-on');
}
document.addEventListener('click',event=>{
 const target=event.target.closest?.('[data-ck14-theme],[data-ck14-pomo-toggle],[data-ck14-pomo-close],[data-ck14-pomo-action]');
 if(!target){
  if(pop&&!pop.hidden&&!event.target.closest?.('#ck14-pomodoro'))closePopover();
  return;
 }
 if(target.hasAttribute('data-ck14-theme')){
  event.preventDefault();themeApply(mode==='dark'?'light':'dark');return;
 }
 if(target.hasAttribute('data-ck14-pomo-toggle')){
  event.preventDefault();togglePopover();return;
 }
 if(target.hasAttribute('data-ck14-pomo-close')){
  event.preventDefault();closePopover();return;
 }
 const action=target.dataset.ck14PomoAction;
 if(action&&window.CKPomo){
  event.preventDefault();window.CKPomo[action]?.();
  updateClock();
 }
});
document.addEventListener('change',event=>{
 const field=event.target.closest?.('[data-ck14-pomo-minutes]');
 if(!field)return;
 const type=field.dataset.ck14PomoMinutes;
 if(window.CKPomo?.configure?.(type,field.value))updateClock();
});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&pop&&!pop.hidden)closePopover()});
for(const eventName of ['input','keyup','pointerup','focusin','click','compositionend']){
 document.addEventListener(eventName,event=>{
  if(event.target.closest?.('.ck-v7-writing-surface .chalk-editor')||
     event.target.matches?.('[data-ck10-font]'))scheduleCaret();
 },eventName==='input');
}
document.addEventListener('selectionchange',()=>{
 if(document.activeElement?.matches?.('.ck-v7-writing-surface .chalk-editor textarea'))scheduleCaret();
});
window.addEventListener('resize',scheduleCaret,{passive:true});
document.fonts?.ready?.then(scheduleCaret).catch(()=>{});
window.addEventListener('ck:pomodoro-complete',event=>{
 updateClock();
 if(pop&&!pop.hidden){
  const status=pop.querySelector('.ck14-pomo-caption');
  if(status)status.textContent=event.detail?.phase==='focus'?
   '집중 완료! 휴식 시작을 누르세요.':'휴식 완료! 다시 집중할 차례입니다.';
 }
});
function observe(){
 const main=document.getElementById('main');
 if(main&&typeof MutationObserver==='function'){
  const observer=new MutationObserver(()=>{
   requestAnimationFrame(()=>{themeApply(mode);updateClock();scheduleCaret()});
  });
  observer.observe(main,{childList:true});
 }
 themeApply(mode);updateClock();scheduleCaret();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observe,{once:true});
else observe();
setInterval(updateClock,1000);
})();
