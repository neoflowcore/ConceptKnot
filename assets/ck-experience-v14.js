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
 if(root.dataset.ckTheme!==mode)root.dataset.ckTheme=mode;root.style.colorScheme='only light'; // App CSS owns both themes; disable browser auto-dark recoloring.
 root.style.setProperty('--ck-native-color-scheme',mode);
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
  '<div class="ck14-pomo-config" aria-label="단일 집중·휴식 시간">',
  ' <label>집중 <input type="number" data-ck14-pomo-minutes="focus" min="5" max="180" step="1" inputmode="numeric" value="25">분</label>',
  ' <label>휴식 <input type="number" data-ck14-pomo-minutes="break" min="1" max="60" step="1" inputmode="numeric" value="5">분</label>',
  '</div>',
  '<section class="ck19-pomo-program" aria-labelledby="ck19-pomo-title">',
  ' <div class="ck19-pomo-program-head"><strong id="ck19-pomo-title">연속 학습 세트</strong><label for="ck19-program-count">세트 수 <select id="ck19-program-count" data-ck19-program-count>'+Array.from({length:5},(_,i)=>'<option value="'+(i+1)+'">'+(i+1)+'세트</option>').join('')+'</select></label></div>',
  ' <div class="ck19-pomo-program-rows" data-ck19-program-rows>'+Array.from({length:5},(_,i)=>'<div class="ck19-pomo-program-row" data-ck19-program-row="'+i+'"><span>'+(i+1)+'세트</span><label>집중 <input type="number" data-ck19-program-focus="'+i+'" min="5" max="180" step="1" value="50" aria-label="'+(i+1)+'세트 집중 시간(분)">분</label><label>휴식 <input type="number" data-ck19-program-rest="'+i+'" min="1" max="60" step="1" value="5" aria-label="'+(i+1)+'세트 휴식 시간(분)">분</label></div>').join('')+'</div>',
  ' <p class="ck19-pomo-program-note" data-ck19-program-note aria-live="polite">세트별 집중·휴식을 설정하고 연속 시작하세요. 마지막 세트 후에는 휴식을 생략합니다.</p>',
  ' <div class="ck19-pomo-program-actions"><button type="button" data-ck19-program="start">▶ 세트 연속 시작</button><button type="button" data-ck19-program="stop">세트 중지</button></div>',
  '</section>',
  '<div class="ck14-pomo-actions">',
  ' <button type="button" data-ck14-pomo-action="toggle">집중 시작</button>',
  ' <button type="button" data-ck14-pomo-action="reset">초기화</button>',
  ' <button type="button" data-ck14-pomo-action="skip">다음 단계</button>',
  '</div>',
  ''
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
 renderPomoProgram(s);
 if(circle){
  const done=s.duration?Math.max(0,Math.min(1,1-s.remaining/s.duration)):0;
  circle.style.setProperty('--ck14-progress',(done*100).toFixed(2)+'%');
  circle.dataset.phase=s.phase;
 }
}

function renderPomoProgram(s){
 if(!pop||!s.program)return;
 const p=s.program;
 const count=pop.querySelector('[data-ck19-program-count]');
 if(count&&document.activeElement!==count)count.value=String(p.count);
 if(count)count.disabled=p.active;
 pop.querySelectorAll('[data-ck19-program-row]').forEach(row=>{
  const idx=Number(row.dataset.ck19ProgramRow);
  row.hidden=idx>=p.count;
  row.classList.toggle('ck19-pomo-program-current',p.active&&idx===p.index);
 });
 for(let idx=0;idx<5;idx++){
  const config=p.sets[idx]||{focus:50,rest:5};
  for(const [kind,value] of [['focus',config.focus],['rest',config.rest]]){
   const input=pop.querySelector('[data-ck19-program-'+kind+'="'+idx+'"]');
   if(input){
    input.disabled=p.active;
    if(input!==document.activeElement)input.value=String(value);
   }
  }
 }
 const status=pop.querySelector('[data-ck19-program-note]');
 if(status)status.textContent=p.active?
  '진행 중 '+(p.index+1)+' / '+p.count+'세트 · '+(s.phase==='break'?'휴식':'집중')+' · 종료까지 자동 진행됩니다.':
  p.finished?p.count+'세트 완료! 다음 학습을 시작할 때 새로 실행하세요.':
  '최대 5세트. 각 세트의 집중·휴식 시간을 지정할 수 있습니다. 마지막 집중 뒤에는 휴식 없이 종료합니다.';
 const start=pop.querySelector('[data-ck19-program="start"]');
 const stop=pop.querySelector('[data-ck19-program="stop"]');
 if(start)start.disabled=p.active;
 if(stop)stop.disabled=!p.active;
 const single=pop.querySelectorAll('[data-ck14-pomo-minutes]');
 single.forEach(x=>x.disabled=p.active);
 const phase=pop.querySelector('[data-ck14-pomo-phase]');
 if(phase)phase.textContent=(s.phase==='break'?'휴식':'집중')+(p.active?' · '+(p.index+1)+'/'+p.count+'세트':'');
}
function savePomoProgramFromFields(){
 const api=window.CKPomo;
 const popover=ensurePopover();
 const count=Number(popover.querySelector('[data-ck19-program-count]')?.value)||3;
 const previous=api?.snapshot?.()?.program;
 const sets=Array.from({length:5},(_,i)=>({
  focus:Number(popover.querySelector('[data-ck19-program-focus="'+i+'"]')?.value)||previous?.sets?.[i]?.focus||50,
  rest:Number(popover.querySelector('[data-ck19-program-rest="'+i+'"]')?.value)||previous?.sets?.[i]?.rest||5
 }));
 return api?.configureProgram?.(count,sets)===true;
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
 const caretOffset=Math.max(0,Math.min(textarea.selectionStart,textarea.value.length));
 const glyphs=Array.from(mirror.querySelectorAll('.chalk-letter'));
 const range=document.createRange();let found=false,used=0,chosen=null;
 for(const glyph of glyphs){
  // Textarea selection offsets are UTF-16 units (Korean + surrogate pairs).
  const length=glyph.textContent.length;
  if(caretOffset<=used+length){
   const offset=Math.min(length,Math.max(0,caretOffset-used));
   const node=glyph.firstChild;
   if(node?.nodeType===Node.TEXT_NODE){
    // A collapsed Range on a newline has a zero-size rect; put a probe
    // after that glyph to measure the beginning of the following line.
    if(offset===length&&glyph.textContent==='\n')range.setStartAfter(glyph);
    else range.setStart(node,offset);
    range.collapse(true);chosen=glyph;found=true;
   }
   break;
  }
  used+=length;
 }
 if(!found&&glyphs.length){
  chosen=glyphs[glyphs.length-1];
  range.setStartAfter(chosen);range.collapse(true);found=true;
 }
 let rect=null;
 if(found){
  const probe=document.createElement('span');
  probe.className='ck15-caret-probe';probe.textContent='\u200b';
  probe.style.cssText='display:inline-block;width:0;height:1em;vertical-align:baseline;overflow:hidden;line-height:1;white-space:pre';
  try{
   range.insertNode(probe);
   const measured=probe.getBoundingClientRect();
   if(Number.isFinite(measured.left)&&Number.isFinite(measured.top)&&measured.height>0)rect=measured;
  }finally{
   probe.remove();chosen?.normalize();
  }
 }
 const base=field.getBoundingClientRect(),mir=mirror.getBoundingClientRect();
 const style=getComputedStyle(textarea),font=parseFloat(style.fontSize)||18;
 const mirrorStyle=getComputedStyle(mirror);
 const padX=parseFloat(mirrorStyle.paddingLeft)||0,padY=parseFloat(mirrorStyle.paddingTop)||0;
 const top=rect?rect.top-base.top:mir.top-base.top+padY;
 const left=rect?rect.left-base.left:mir.left-base.left+padX;
 visual.style.left=Math.max(0,left)+'px';
 visual.style.top=Math.max(0,top)+'px';
 visual.style.height=Math.max(13,Math.min(48,font*1.65))+'px';
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

document.addEventListener('click',event=>{
 const btn=event.target.closest?.('[data-ck19-program]');
 if(!btn)return;
 event.preventDefault();
 if(btn.dataset.ck19Program==='start'){
  if(!savePomoProgramFromFields())return;
  window.CKPomo?.startProgram?.();
 }else if(btn.dataset.ck19Program==='stop'){
  window.CKPomo?.stopProgram?.();
 }
 updateClock();
});
document.addEventListener('change',event=>{
 if(!event.target.matches?.('[data-ck19-program-count],[data-ck19-program-focus],[data-ck19-program-rest]'))return;
 if(savePomoProgramFromFields())updateClock();
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
  const observer=new MutationObserver(records=>{
   if(!records.some(record=>record.target===main&&record.type==='childList'))return;
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

/* Wordmark exit tracks route state rather than replaying on every study render. */
(()=>{
 function initBrandExit(){
  const body=document.body;let previous=body.getAttribute('data-ck-v8-tab'),timer;
  new MutationObserver(()=>{
   const next=body.getAttribute('data-ck-v8-tab');
   if(next===previous)return;
   clearTimeout(timer);body.classList.remove('ck67-brand-closing');
   if(previous==='landing'&&next!=='landing'){
    body.classList.add('ck67-brand-closing');
    timer=setTimeout(()=>body.classList.remove('ck67-brand-closing'),420);
   }
   previous=next;
  }).observe(body,{attributes:true,attributeFilter:['data-ck-v8-tab']});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initBrandExit,{once:true});else initBrandExit();
})();
