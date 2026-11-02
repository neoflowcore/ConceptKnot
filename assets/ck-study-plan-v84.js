/* ConceptKnot v84 personal study calendar.
 * Plans are estimates; none of the allocations or inferred weaknesses claim verified mastery.
 * Korean local calendar, safe local storage, no API or timed jobs.
 */
(function(){
'use strict';
const KEY='ck84-study-plan-v1',DAY=86400000,STORAGE_LIMIT=100;
const BANK=()=>window.RECALL_OFFICIAL||{};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const isoValid=s=>{if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(s+'T00:00:00Z');return Number.isFinite(d.valueOf())&&d.toISOString().slice(0,10)===s;};
const dateMs=s=>isoValid(s)?Date.parse(s+'T00:00:00+09:00'):NaN;
const asDate=ms=>new Date(ms+9*3600000).toISOString().slice(0,10);
const todayKst=(now=Date.now())=>asDate(now);
const int=(x,min,max,dft)=>Number.isInteger(Number(x))&&Number(x)>=min&&Number(x)<=max?Number(x):dft;
function defaults(){return {schemaVersion:1,scope:'personal-learning-plan',
 examDate:'',dailyMinutes:150,subjectEstate:50,restWeekdays:[],holidays:[],
 sessionMinutes:50,preferredYear:2025,updatedAt:0};}
function sanitize(raw){
 if(!raw||typeof raw!=='object'||raw.schemaVersion!==1||raw.scope!=='personal-learning-plan')return null;
 const d=defaults(),examDate=raw.examDate==null?'':String(raw.examDate);
 if(examDate&&!isoValid(examDate))return null;
 if(!Array.isArray(raw.restWeekdays)||raw.restWeekdays.length>7||
  raw.restWeekdays.some(n=>!Number.isInteger(n)||n<0||n>6))return null;
 if(!Array.isArray(raw.holidays)||raw.holidays.length>STORAGE_LIMIT||
  raw.holidays.some(x=>!isoValid(x)))return null;
 const fields=[['dailyMinutes',30,600],['subjectEstate',20,80],['sessionMinutes',20,120],['preferredYear',2016,2025]];
 for(const [key,min,max] of fields)if(!Number.isInteger(raw[key])||raw[key]<min||raw[key]>max)return null;
 if(new Set(raw.restWeekdays).size!==raw.restWeekdays.length||new Set(raw.holidays).size!==raw.holidays.length)return null;
 return {...d,examDate,dailyMinutes:raw.dailyMinutes,subjectEstate:raw.subjectEstate,
  sessionMinutes:raw.sessionMinutes,preferredYear:raw.preferredYear,
  restWeekdays:[...raw.restWeekdays].sort((a,b)=>a-b),holidays:[...raw.holidays].sort(),
  updatedAt:Number.isFinite(Number(raw.updatedAt))?Math.max(0,Number(raw.updatedAt)):0};
}
function fromStorage(){
 try{return sanitize(JSON.parse(localStorage.getItem(KEY)||'null'))||defaults();}catch{return defaults();}
}
let settings=fromStorage(),open=false,root=null,status='',showDays=14,queued=false;
function saveSettings(next){
 const data=sanitize(next);if(!data)return false;
 try{localStorage.setItem(KEY,JSON.stringify(data));settings=data;status='개인 학습 설정 저장됨';return true;}
 catch{status='저장 실패: 저장공간 또는 브라우저 권한을 확인하세요.';return false;}
}
function examDateFromMain(){
 const s=window.CK79Study?.snapshot?.();
 return isoValid(s?.examDate)?s.examDate:'';
}
function effectiveConfig(config=settings){
 return config.examDate||!examDateFromMain()?config:{...config,examDate:examDateFromMain()};
}
function studyData(){
 const s=window.CK79Study?.snapshot?.()||{};
 const reviews=s.review&&typeof s.review==='object'?s.review:{};
 const mistakes=(Array.isArray(s.mistakes)?s.mistakes:[]).filter(x=>x?.type==='exam'&&!x.resolved);
 const now=Date.now(),due=Object.entries(reviews).filter(([id,v])=>BANK()[id]?.verified&&Number(v?.nextAt)>0&&Number(v.nextAt)<=now);
 const missed=new Set(mistakes.map(x=>x.year+'-'+x.number));
 const unique=new Set([...due.map(([id])=>id),...missed]);
 const sessions=window.CK82FullExam?.getAttempts?.()||[];
 const scores=sessions.filter(x=>x?.status==='submitted'&&Number.isFinite(x.score?.estate)&&Number.isFinite(x.score?.civil));
 const sums=scores.reduce((v,x)=>({estate:v.estate+x.score.estate,civil:v.civil+x.score.civil}),{estate:0,civil:0});
 return {due:unique.size,dueIds:[...unique].filter(id=>BANK()[id]?.verified),
  mistakes:mistakes.length,examCount:scores.length,
  estateAverage:scores.length?sums.estate/scores.length:null,
  civilAverage:scores.length?sums.civil/scores.length:null,
  recallCount:Object.keys(reviews).length};
}
function kstWeekday(iso){return new Date(iso+'T12:00:00+09:00').getUTCDay();}
function weightedSubject(config,stats,index){
 // Keep user bias authoritative; at most 10 points are shifted by observed weak subjects.
 let bias=config.subjectEstate;
 if(stats.examCount>=2&&stats.estateAverage!=null&&stats.civilAverage!=null){
  const difference=stats.civilAverage-stats.estateAverage;
  bias=Math.max(20,Math.min(80,Math.round(bias+Math.max(-10,Math.min(10,difference/3)))));
 }
 const selected=(index%100)<bias?'estate':'civil';
 return {selected,bias};
}
function compute({config=settings,stats=studyData(),now=Date.now(),days=showDays}={}){
 const cfg=sanitize(config)||defaults(),today=todayKst(now),daysCount=int(days,7,31,14);
 const base=dateMs(today),examDate=cfg.examDate||'',target=dateMs(examDate);
 const daysLeft=Number.isFinite(target)?Math.round((target-base)/DAY):null;
 const horizon=daysLeft===null?daysCount:Math.max(0,Math.min(daysCount,daysLeft));
 const holidaySet=new Set(cfg.holidays),restSet=new Set(cfg.restWeekdays),rows=[];
 const primaryYears=Array.from({length:10},(_,i)=>2025-i);
 let plannedTotal=0,planId=0;
 for(let i=0;i<horizon;i++){
  const iso=asDate(base+i*DAY),weekday=kstWeekday(iso),rest=restSet.has(weekday)||holidaySet.has(iso);
  if(rest){rows.push({date:iso,weekday,rest:true,minutes:0,reason:holidaySet.has(iso)?'지정한 휴일':'정기 휴식일'});continue;}
  const stage=daysLeft===null?'rolling':daysLeft<=14?'final':daysLeft<=60?'practice':'foundation';
  const fatigue=i>0&&i%6===0?0.7:1;
  const minutes=Math.max(20,Math.round(cfg.dailyMinutes*fatigue));
  const dueRemain=Math.max(0,stats.due-Math.round(plannedTotal/7));
  const reviewMinutes=Math.min(Math.floor(minutes*0.4),Math.max(dueRemain?20:10,Math.floor(minutes*(stage==='final'?.35:.25))));
  const questionMinutes=stage==='foundation'?6:stage==='final'?3:4;
  const practiceMinutes=Math.max(0,Math.round(minutes*(stage==='final'?.55:.5)));
  const questionCount=Math.max(1,Math.floor(practiceMinutes/questionMinutes));
  const recallCount=Math.min(Math.max(0,dueRemain),Math.floor(reviewMinutes/3));
  const readingMinutes=Math.max(0,minutes-practiceMinutes-reviewMinutes);
  const choice=weightedSubject(cfg,stats,(planId*37)%100);
  const preferredYear=primaryYears[(planId+Math.max(0,2025-cfg.preferredYear))%primaryYears.length];
  const subjects=choice.selected==='estate'?
   ['부동산학개론','민법·민사특별법']:['민법·민사특별법','부동산학개론'];
  rows.push({date:iso,weekday,rest:false,minutes,stage,subject:choice.selected,subjectLabel:subjects[0],
   year:preferredYear,questionCount,recallCount,readingMinutes,reviewMinutes,practiceMinutes,
   dueRemain,activities:[
    {label:'인출·오답 재확인',minutes:reviewMinutes,count:recallCount},
    {label:preferredYear+'년 기출 문제',minutes:practiceMinutes,count:questionCount},
    {label:'이론·근거·최종노트',minutes:readingMinutes,count:0}
   ]});
  planId++;plannedTotal+=questionCount;
 }
 return {today,examDate:examDate||null,daysLeft,activeDays:rows.filter(x=>!x.rest).length,
  totalMinutes:rows.reduce((sum,x)=>sum+x.minutes,0),plannedQuestions:plannedTotal,days:rows,
  due:stats.due,examCount:stats.examCount,priorityBias:weightedSubject(cfg,stats,0).bias};
}
function niceDay(date){
 const day=kstWeekday(date),labels=['일','월','화','수','목','금','토'];
 return date.slice(5).replace('-','/')+' ('+labels[day]+')';
}
function renderPlan(plan){
 const txt=plan.daysLeft===null?'시험일 미설정 · 향후 학습 일정 예시':
  plan.daysLeft<0?'시험 예정일이 지났습니다. 새로운 시험일을 설정하세요.':
  plan.daysLeft===0?'설정한 시험일 당일 · 복습 계획 종료':'D-'+plan.daysLeft+' · '+plan.examDate+' 시험 예정';
 return '<div class="ck84-plan-summary"><strong>'+esc(txt)+'</strong>'+
  '<span>예상 공부 '+Math.round(plan.totalMinutes/60*10)/10+'시간 · 학습일 '+plan.activeDays+'일 · 문제 배정 '+plan.plannedQuestions+'문항</span>'+
  '<small>이 숫자는 개인 학습 계획치이며 수행 기록 또는 검증된 진도율이 아닙니다. 실제 일정은 매번 최신 기록으로 재계산됩니다.</small></div>'+
  '<div class="ck84-plan-list">'+(plan.days.length?plan.days.map(d=>'<div class="ck84-plan-row">'+
   '<div><strong>'+niceDay(d.date)+'</strong><small>'+esc(d.rest?d.reason:d.subjectLabel)+'</small></div>'+
   (d.rest?'<span>휴식</span>':'<div class="ck84-plan-row-work"><span>'+d.minutes+'분 · '+d.questionCount+'문항 · 회상 최대 '+d.recallCount+'개</span>'+
   '<small>'+d.activities.map(x=>x.label+' '+x.minutes+'분').join(' / ')+'</small>'+
   '<button type="button" data-ck84-start="'+esc(d.date)+'" data-ck84-year="'+d.year+'" data-ck84-subject="'+d.subject+'">기출 시작</button></div>')+
   '</div>').join(''):'<p>배정할 학습일이 없습니다. 시험 날짜 또는 휴식일 설정을 확인하세요.</p>')+'</div>';
}
function render(){
 if(!root||!open)return;
 const body=root.querySelector('[data-ck84-body]');if(!body)return;
 const config=effectiveConfig(),plan=compute({config,days:showDays});
 body.innerHTML='<p class="ck84-notice">시험 예정일·공부시간·휴일·과목 비율을 직접 설정하고 내 복습 대기와 최근 실전 점수의 단순 가중치를 반영합니다. 자동 합격 예측은 제공하지 않습니다.</p>'+
 '<div class="ck84-form">'+
 '<label>시험 예정일 <input type="date" data-ck84-date value="'+esc(config.examDate)+'"></label>'+
 '<label>하루 공부시간 (분) <input type="number" data-ck84-minutes min="30" max="600" step="10" value="'+config.dailyMinutes+'"></label>'+
 '<label>학개론 기본 배정 비율 (%) <input type="number" data-ck84-estate min="20" max="80" step="5" value="'+config.subjectEstate+'"></label>'+
 '<label>집중 한 세트 (분) <select data-ck84-session>'+[25,40,50,60,90].map(n=>'<option value="'+n+'"'+(config.sessionMinutes===n?' selected':'')+'>'+n+'분</option>').join('')+'</select></label>'+
 '<label>원문 기출 시작 연도 <select data-ck84-year>'+Array.from({length:10},(_,i)=>2025-i).map(y=>
  '<option value="'+y+'"'+(config.preferredYear===y?' selected':'')+'>'+y+'년</option>').join('')+'</select></label>'+
 '<label class="ck84-holidays">추가 휴일 날짜 (쉼표·줄바꿈 구분) <textarea rows="2" data-ck84-holidays placeholder="예: 2026-11-10, 2026-11-17">'+esc(config.holidays.join(', '))+'</textarea></label></div>'+
 '<fieldset class="ck84-rest"><legend>매주 쉬는 요일</legend>'+['일','월','화','수','목','금','토'].map((text,i)=>
  '<label><input type="checkbox" data-ck84-rest="'+i+'"'+(config.restWeekdays.includes(i)?' checked':'')+'>'+text+'</label>').join('')+'</fieldset>'+
 '<div class="ck84-actions"><button type="button" data-ck84-save>계획 설정 저장·재계산</button>'+
 '<button type="button" data-ck84-export>일정 TXT 내보내기</button>'+
 '<button type="button" data-ck84-next>범위 '+showDays+'일 전환</button>'+
 '<span data-ck84-status role="status">'+esc(status)+'</span></div>'+renderPlan(plan);
}
function mount(){
 const main=document.getElementById('main');
 if(!main)return;
 const previous=main.querySelector('.ck79-plan-controls');
 if(!previous){root=null;return;}
 const current=document.getElementById('ck84-personal-plan');
 if(current){root=current;return;}
 root=document.createElement('section');root.id='ck84-personal-plan';root.className='ck84-personal-plan';
 root.innerHTML='<div class="ck84-head"><strong>시험일 기반 개인 학습계획</strong>'+
  '<button type="button" data-ck84-toggle aria-expanded="false">학습계획 설정</button></div>'+
  '<div data-ck84-body hidden></div>';
 previous.after(root);
}
function toggle(){
 open=!open;const body=root?.querySelector('[data-ck84-body]'),btn=root?.querySelector('[data-ck84-toggle]');
 if(body)body.hidden=!open;
 if(btn){btn.textContent=open?'계획 설정 접기':'학습계획 설정';btn.setAttribute('aria-expanded',String(open));}
 if(open)render();
}
function collect(){
 const n=root?.querySelector('[data-ck84-body]');if(!n)return null;
 const holidays=String(n.querySelector('[data-ck84-holidays]')?.value||'').split(/[\s,;]+/).filter(Boolean);
 const row={schemaVersion:1,scope:'personal-learning-plan',examDate:n.querySelector('[data-ck84-date]')?.value||'',
  dailyMinutes:Number(n.querySelector('[data-ck84-minutes]')?.value),
  subjectEstate:Number(n.querySelector('[data-ck84-estate]')?.value),
  sessionMinutes:Number(n.querySelector('[data-ck84-session]')?.value),
  preferredYear:Number(n.querySelector('[data-ck84-year]')?.value),
  restWeekdays:[...n.querySelectorAll('[data-ck84-rest]:checked')].map(x=>Number(x.dataset.ck84Rest)),
  holidays:[...new Set(holidays)],updatedAt:Date.now()};
 return sanitize(row);
}
function exportTxt(){
 const plan=compute({config:effectiveConfig(),days:showDays});
 const text=['ConceptKnot 개인 학습계획 · 예상 목표 (수행 기록 아님)',
  '시험일: '+(plan.examDate||'미설정'),'작성일: '+plan.today,'학습일: '+plan.activeDays,
  ...plan.days.map(d=>d.date+' | '+(d.rest?'휴식':d.subjectLabel+' '+d.minutes+'분, 문제 '+d.questionCount+
   '개, 회상 최대 '+d.recallCount+'개, '+d.activities.map(x=>x.label+' '+x.minutes+'분').join('/')))].join('\n');
 const blob=new Blob(['\uFEFF',text],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.download='ConceptKnot_학습계획_'+plan.today+'.txt';a.href=url;document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),2000);
}
document.addEventListener('click',event=>{
 const t=event.target.closest?.('[data-ck84-toggle],[data-ck84-save],[data-ck84-export],[data-ck84-next],[data-ck84-start]');
 if(!t||!document.getElementById('ck84-personal-plan')?.contains(t))return;
 if(t.hasAttribute('data-ck84-toggle')){toggle();return;}
 if(t.hasAttribute('data-ck84-save')){
  const config=collect();
  if(!config){status='설정을 확인하세요. 날짜·공부시간·휴일은 올바른 형식이어야 합니다.';render();return;}
  saveSettings(config);render();return;
 }
 if(t.hasAttribute('data-ck84-export')){exportTxt();return;}
 if(t.hasAttribute('data-ck84-next')){showDays=showDays===14?7:showDays===7?30:14;render();return;}
 if(t.hasAttribute('data-ck84-start')){
  const year=Number(t.dataset.ck84Year),sub=t.dataset.ck84Subject;
  const q=Array.from({length:40},(_,i)=>year+'-'+(sub==='estate'?i+1:i+41)).find(id=>BANK()[id]?.verified);
  if(q){const [y,n]=q.split('-').map(Number);window.CK76Study?.openQuestion?.(y,n,sub);}
 }
});
document.addEventListener('storage',event=>{if(event.key===KEY){settings=fromStorage();if(open)render();}});
function scheduleMount(){
 if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;mount();});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scheduleMount,{once:true});else scheduleMount();
const main=document.getElementById('main');
if(main&&window.MutationObserver)new MutationObserver(changes=>{
 if(changes.some(x=>[...x.addedNodes].some(n=>n.nodeType===1&&
  (n.matches?.('.ck79-plan-controls')||n.querySelector?.('.ck79-plan-controls')))))scheduleMount();
}).observe(main,{subtree:true,childList:true});
window.CK84Plan=Object.freeze({defaults,sanitize,compute,isoValid,todayKst,kstWeekday,
 getState:()=>({open,settings:{...settings},days:showDays}),
 open:()=>{mount();if(root&&!open)toggle();}});
})();