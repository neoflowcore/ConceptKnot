/* ConceptKnot v133 — one exam selection surface for three independent legacy engines.
 * Never rewrites CK20/CK82/CK129 answer keys or personal storage formats.
 * Countdown is a separate optional 100-minute session for CK20 practice only.
 */
(function(){
'use strict';
const CLOCK_KEY='ck133-practice-clock-v1',MODE_KEY='ck133-exam-mode-v1',DURATION=100*60*1000;
const types=['mock','mixed','official'];
const labels={mock:'모의고사',mixed:'기출혼합',official:'공식 통합 실전'};
const descriptions={
 mock:'기본 15문항 또는 최근 5개년 기출 응용 모의고사 · 선지 재배열/조합형',
 mixed:'2016~2025 공식 A형에서 고정 배정한 5세트 · 각 80문항 · 100분',
 official:'2016~2025 연도별 공식 A형 · 각 80문항 · 100분'
};
const symbols={
 mock:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h10a3 3 0 0 1 3 3v12H5zM9 8h5M9 12h5M9 16h3M18 15l3-3v8h-3"/></svg>',
 mixed:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h5l5 6h8m0 0-3-3m3 3-3 3M3 18h5l3-4M14 8l3-2h4m0 0-3-3m3 3-3 3"/></svg>',
 official:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v16H5zM9 8h6M9 12h6M9 16h4M3 7h2m-2 5h2m-2 5h2"/></svg>'
};
let root=null,hub=null,clock=null,scheduled=false,note='',timerRaw=null,timer=null,activeMode='mock',initialized=false;
const native=type=>type==='mixed'?window.CK129MixedMock:type==='official'?window.CK82FullExam:null;
const getRoot=type=>document.getElementById(type==='mock'?'ck133-original-practice':type==='mixed'?'ck129-mixed-mocks':'ck82-full-exam');
const toInt=(v,min,max,other)=>{const n=Number(v);return Number.isInteger(n)&&n>=min&&n<=max?n:other;};
function readMode(){
 try{const m=sessionStorage.getItem(MODE_KEY);if(types.includes(m))return m;}catch{}
 const mixed=native('mixed')?.getState?.(),official=native('official')?.getState?.();
 if(['running','paused'].includes(mixed?.active))return 'mixed';
 if(['running','paused'].includes(official?.active))return 'official';
 return 'mock';
}
function savedClock(){
 try{
  const raw=sessionStorage.getItem(CLOCK_KEY);timerRaw=raw;
  if(raw===null)return null;
  if(raw.length>400)return null;
  const x=JSON.parse(raw);
  if(!x||x.version!==1||!['running','paused'].includes(x.status)||
   !Number.isInteger(x.set)||x.set<0||x.set>5||
   !Number.isSafeInteger(x.deadlineAt)||x.deadlineAt<0||
   !Number.isFinite(x.remainingMs)||x.remainingMs<0||x.remainingMs>DURATION)return null;
  return {version:1,status:x.status,set:x.set,deadlineAt:x.deadlineAt,remainingMs:x.remainingMs};
 }catch{return null;}
}
function writeClock(next){
 try{
  if(sessionStorage.getItem(CLOCK_KEY)!==timerRaw){
   timer=savedClock();note='다른 탭 또는 이전 상태에서 타이머가 변경되어 자동 덮어쓰지 않았습니다.';return false;
  }
  const raw=JSON.stringify(next);
  sessionStorage.setItem(CLOCK_KEY,raw);timerRaw=raw;timer=next;return true;
 }catch{note='타이머 저장에 실패했습니다. 기록이 저장되지 않으므로 시계를 다시 확인하세요.';return false;}
}
function practiceRemaining(now=Date.now()){
 if(!timer)return DURATION;
 return timer.status==='running'?Math.max(0,timer.deadlineAt-now):Math.max(0,timer.remainingMs);
}
function minuteClock(ms){
 const sec=Math.ceil(Math.max(0,ms)/1000);
 return Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0');
}
function selected(type){
 const container=getRoot(type);
 if(type==='mock')return toInt(container?.querySelector('.ck20-quiz-sets [aria-pressed="true"]')?.dataset.ck20MockSet,0,5,0);
 if(type==='mixed')return toInt(container?.querySelector('[data-ck129-set]')?.value,1,5,1);
 return toInt(container?.querySelector('[data-ck82-year]')?.value,2016,2025,2025);
}
function readableStatus(type=activeMode){
 if(type==='mock'){
  if(!timer)return '모의고사 타이머 · 시작 전';
  if(timer.status==='paused')return '연습 시간 정지 · '+timer.set+'세트';
  return practiceRemaining()===0?'연습 시간 만료 · 답안 자동 제출 없음':
    '연습 시간 진행 중 · '+timer.set+'세트';
 }
 const status=native(type)?.getState?.()?.active||'none';
 return status==='running'?'실전 진행 중 · 자동 저장':status==='paused'?'실전 일시 정지':
  status==='submitted'?'제출 완료 · 채점 결과 확인':'시험 시작 전';
}
function displayClock(type=activeMode){
 if(type==='mock')return minuteClock(practiceRemaining());
 const s=native(type)?.getState?.();
 return minuteClock(s&&['running','paused'].includes(s.active)?s.remainingMs:
  s?.active==='submitted'?0:DURATION);
}
function pickerValues(type=activeMode){
 if(type==='mock')return Array.from({length:6},(_,i)=>({id:i,name:i===0?'기본 연습 · 15문항':i+'세트 · 80문항'}));
 if(type==='mixed')return Array.from({length:5},(_,i)=>({id:i+1,name:(i+1)+'세트 · 80문항'}));
 return Array.from({length:10},(_,i)=>({id:2025-i,name:(2025-i)+'년 A형'}));
}
function controls(){
 const status=activeMode==='mock'?(timer?.status==='running'&&practiceRemaining()===0?'expired':timer?.status||'new'):
  native(activeMode)?.getState?.()?.active||'none';
 if(activeMode==='mock')return status==='running'?
  '<button type="button" data-ck133-timer="pause">시간 정지</button><button type="button" data-ck133-timer="reset">100분 초기화</button>':
  status==='paused'?
  '<button type="button" data-ck133-timer="resume">시간 재개</button><button type="button" data-ck133-timer="reset">100분 초기화</button>':
  '<button type="button" class="ck133-primary" data-ck133-timer="start">100분 연습 시작</button>'+
  (timer?'<button type="button" data-ck133-timer="reset">초기화</button>':'');
 const hasActive=status!=='none';
 return '<button type="button" class="ck133-primary" data-ck133-start>'+
  (status==='running'||status==='paused'?'새 시험 시작':'새 시험 시작')+'</button>'+
  (hasActive?'<button type="button" data-ck133-open>현재 '+(status==='submitted'?'결과':'시험')+' 열기</button>':'');
}
function render(){
 if(!root?.isConnected||!hub?.isConnected)return;
 root.dataset.ck133Mode=activeMode;
 const choices=pickerValues(),choice=selected(activeMode);
 const group=types.map(type=>'<button type="button" class="ck133-category" data-ck133-category="'+type+
  '" aria-pressed="'+(activeMode===type)+'">'+symbols[type]+'<span>'+labels[type]+'</span></button>').join('');
 hub.innerHTML='<div class="ck133-intro"><h3>시험 유형 선택</h3><p>유형을 고른 후 세트 또는 연도를 선택하세요. 한 번에 한 종류의 시험만 표시됩니다.</p></div>'+
  '<div class="ck133-categories" role="group" aria-label="시험 대분류 3가지">'+group+'</div>'+
  '<div class="ck133-select-panel"><div class="ck133-select-top"><div><strong>'+labels[activeMode]+'</strong><p>'+descriptions[activeMode]+'</p></div>'+
  '<div class="ck133-timer"><small>남은 시간</small><strong role="timer" aria-live="off" data-ck133-clock>'+
  displayClock()+'</strong><span data-ck133-clock-status>'+readableStatus()+'</span></div></div>'+
  '<div class="ck133-set-grid" role="group" aria-label="'+labels[activeMode]+' 세트 또는 연도">'+
  choices.map(o=>'<button type="button" data-ck133-choice="'+o.id+'" aria-pressed="'+(choice===o.id)+'">'+o.name+'</button>').join('')+
  '</div><div class="ck133-commands">'+controls()+'</div>'+
  (note?'<p class="ck133-notice" role="status">'+note+'</p>':'')+
  '<p class="ck133-guide">단축키: 1~5 선지 선택 · Ctrl+← 이전 문제 · Ctrl+→ 다음 문제. 입력창·PDF 필기 중에는 작동하지 않습니다. 진행 중인 공식 시험 시간은 유형을 바꿔도 계속 흐릅니다.</p></div>';
 syncTicker();
}
function refreshClock(){
 if(!hub?.isConnected||!root?.isConnected)return;
 const el=hub.querySelector('[data-ck133-clock]');
 if(el)el.textContent=displayClock();
 const desc=hub.querySelector('[data-ck133-clock-status]');
 if(desc)desc.textContent=readableStatus();
}
function syncTicker(){
 if(clock!==null){clearInterval(clock);clock=null;}
 if(!root?.isConnected||document.hidden)return;
 const running=activeMode==='mock'?timer?.status==='running'&&practiceRemaining()>0:
  native(activeMode)?.getState?.()?.active==='running';
 if(running)clock=setInterval(refreshClock,1000);
}
function mount(){
 const next=document.getElementById('ck133-exam-unified'),slot=document.getElementById('ck133-exam-hub');
 if(!next||!slot){if(clock!==null){clearInterval(clock);clock=null;}root=null;hub=null;return false;}
 if(next===root&&hub===slot&&slot.firstElementChild)return true;
 root=next;hub=slot;
 render();return true;
}
function schedule(){
 if(scheduled)return;scheduled=true;
 requestAnimationFrame(()=>{scheduled=false;mount();refreshClock();});
}
function setMode(type){
 if(!types.includes(type))return false;
 activeMode=type;note='';
 try{sessionStorage.setItem(MODE_KEY,type)}catch{}
 render();
 const current=native(type)?.getState?.();
 if(current&&['running','paused','submitted'].includes(current.active)&&current.expanded===false)
  native(type)?.open?.();
 return true;
}
function choose(value){
 const n=Number(value),rootType=getRoot(activeMode);
 if(activeMode==='mock'){
  if(!Number.isInteger(n)||n<0||n>5)return false;
  const picker=rootType?.querySelector('[data-ck20-mock-set="'+n+'"]');
  if(!picker)return false;
  note='';picker.click();schedule();return true;
 }
 if(activeMode==='mixed'&&(!Number.isInteger(n)||n<1||n>5))return false;
 if(activeMode==='official'&&(!Number.isInteger(n)||n<2016||n>2025))return false;
 const selector=activeMode==='mixed'?'[data-ck129-set]':'[data-ck82-year]';
 const picker=rootType?.querySelector(selector);
 if(!picker)return false;
 picker.value=String(n);
 picker.dispatchEvent(new Event('change',{bubbles:true}));
 note='';render();return true;
}
function startExam(){
 const src=getRoot(activeMode);
 if(!src)return false;
 const btn=src.querySelector(activeMode==='mixed'?'[data-ck129-start]':'[data-ck82-start]');
 if(!btn||btn.disabled){note='시험 기능을 초기화하지 못했습니다. 페이지를 확인하세요.';render();return false;}
 btn.click();note='';render();schedule();return true;
}
function actionClock(op,now=Date.now()){
 if(activeMode!=='mock')return false;
 const set=selected('mock');
 if(op==='start'){
  if(timer&&timer.status==='running'&&practiceRemaining(now)>0){
   if(!window.confirm?.('진행 중인 연습 타이머를 새 100분으로 다시 시작할까요?'))return false;
  }
  if(!writeClock({version:1,status:'running',set,deadlineAt:now+DURATION,remainingMs:DURATION}))return false;
 }else if(op==='pause'){
  if(timer?.status!=='running')return false;
  if(!writeClock({...timer,status:'paused',remainingMs:practiceRemaining(now)}))return false;
 }else if(op==='resume'){
  if(timer?.status!=='paused')return false;
  if(!writeClock({...timer,status:'running',deadlineAt:now+timer.remainingMs}))return false;
 }else if(op==='reset'){
  if(timer?.status==='running'&&practiceRemaining(now)>0&&!window.confirm?.('연습 타이머만 초기화할까요? 문제 답안과 기록은 유지됩니다.'))return false;
  try{
   if(sessionStorage.getItem(CLOCK_KEY)!==timerRaw){timer=savedClock();note='기존 타이머가 변경되어 초기화를 중단했습니다.';render();return false;}
   sessionStorage.removeItem(CLOCK_KEY);timer=null;timerRaw=null;
  }catch{note='타이머 초기화에 실패했습니다.';render();return false;}
 }else return false;
 note='';render();return true;
}
document.addEventListener('click',e=>{
 const button=e.target.closest?.('[data-ck133-category],[data-ck133-choice],[data-ck133-start],[data-ck133-open],[data-ck133-timer]');
 if(!button||!root?.contains(button)||!hub?.contains(button))return;
 e.preventDefault();e.stopPropagation();
 if(button.hasAttribute('data-ck133-category'))setMode(button.dataset.ck133Category);
 else if(button.hasAttribute('data-ck133-choice'))choose(button.dataset.ck133Choice);
 else if(button.hasAttribute('data-ck133-timer'))actionClock(button.dataset.ck133Timer);
 else if(button.hasAttribute('data-ck133-start'))startExam();
 else if(button.hasAttribute('data-ck133-open'))native(activeMode)?.open?.();
 const key=button.dataset.ck133Category?'[data-ck133-category="'+button.dataset.ck133Category+'"]':
  button.dataset.ck133Choice?'[data-ck133-choice="'+button.dataset.ck133Choice+'"]':null;
 if(key)hub?.querySelector(key)?.focus?.({preventScroll:true});
});
document.addEventListener('click',e=>{
 if(!root?.isConnected)return;
 const t=e.target.closest?.('[data-ck129-start],[data-ck129-submit],[data-ck129-pause],[data-ck129-resume],'+
  '[data-ck82-start],[data-ck82-submit],[data-ck82-pause],[data-ck82-resume],[data-ck20-mock-set]');
 if(t&&root.contains(t)&&!hub.contains(t))schedule();
});
document.addEventListener('change',e=>{
 if(root?.contains(e.target)&&e.target.matches?.('[data-ck129-set],[data-ck82-year]'))schedule();
});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule();else syncTicker();});
window.addEventListener('pageshow',schedule);
window.addEventListener('ck:scene-activity',schedule);
document.addEventListener('ck:mixed-mounted',schedule);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});
else schedule();
const main=document.getElementById('main');
if(main&&window.MutationObserver)new MutationObserver(changes=>{
 if(changes.some(x=>Array.from(x.addedNodes||[]).some(el=>el.nodeType===1&&(
  el.id==='ck82-full-exam'||el.id==='ck129-mixed-mocks'||el.id==='ck131-mixed-review'||
  el.id==='ck133-exam-unified'||el.querySelector?.('#ck133-exam-unified')))))schedule();
}).observe(main,{childList:true,subtree:true});
activeMode=readMode();timer=savedClock();initialized=true;
window.CK133ExamHub=Object.freeze({
 getState:()=>({mode:activeMode,set:selected(activeMode),clock:displayClock(),clockStatus:readableStatus(),
  timer:timer?{...timer}:null,mounted:Boolean(root?.isConnected),initialized}),
 setMode,choose,actionClock,mount,refreshClock,minuteClock,practiceRemaining
});
})();