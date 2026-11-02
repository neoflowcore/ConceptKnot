/* ConceptKnot v83 personal analytics: 7/30-day study history and self-linked concept performance. 
 * Only measured local actions are counted. No predicted pass probability.
 */
(function(){
'use strict';
const DAY=86400000,KST=9*3600000;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const validTime=v=>Number.isFinite(Number(v))&&Number(v)>0;
const dayKey=t=>new Date(Number(t)+KST).toISOString().slice(0,10);
const bank=()=>window.RECALL_OFFICIAL||{};
let root=null,shown=false,period=7,filterSubject='all',scheduled=false,lastReport=null;
const snapshot=()=>window.CK79Study?.snapshot?.()||{};
const attempts=()=>window.CK82FullExam?.getAttempts?.()||[];
const mappings=()=>window.CK83Links?.getRecords?.()||{};
function recallFor(history,period,now){
 const since=now-period*DAY;
 const rows=(Array.isArray(history)?history:[]).filter(x=>validTime(x.at)&&x.at>=since&&x.at<=now);
 return {count:rows.length,remembered:rows.filter(x=>x.outcome==='remember').length,
  unique:new Set(rows.map(x=>x.id)).size};
}
function compute({study={},sessions=[],links={},official=bank(),now=Date.now(),days=7,subject='all'}={}){
 const n=[7,30].includes(Number(days))?Number(days):7;
 const today=Math.floor((now+KST)/DAY)*DAY;
 const dayKeys=Array.from({length:n},(_,i)=>new Date(today-(n-i-1)*DAY).toISOString().slice(0,10));
 const from=today-(n-1)*DAY;
 const inRange=t=>validTime(t)&&Number(t)+KST>=from&&Number(t)<=now;
 const histories=(Array.isArray(sessions)?sessions:[]).filter(a=>a?.status==='submitted'&&
  Array.isArray(a.answers)&&a.answers.length===80&&inRange(a.submittedAt));
 const typed=(Array.isArray(study.typing)?study.typing:[]).filter(x=>inRange(x.at)&&
  (subject==='all'||x.subject===subject));
 const recalls=(Array.isArray(study.recallEvents)?study.recallEvents:[]).filter(x=>inRange(x.at)&&
  (subject==='all'||official[x.id]?.subject===subject));
 const dayMap=Object.fromEntries(dayKeys.map(day=>[day,{day,typed:0,recalls:0,exams:0}]));
 typed.forEach(x=>{const d=dayKey(x.at);if(dayMap[d])dayMap[d].typed++;});
 recalls.forEach(x=>{const d=dayKey(x.at);if(dayMap[d])dayMap[d].recalls++;});
 histories.forEach(x=>{const d=dayKey(x.submittedAt);if(dayMap[d])dayMap[d].exams++;});
 const outcomes={correct:0,answered:0,wrong:0,blank:0};
 const statsBySubject={estate:{correct:0,answered:0,score:[]},civil:{correct:0,answered:0,score:[]}};
 const concept=new Map(),perQuestion=new Map();
 for(const exam of histories){
  const year=Number(exam.year);
  for(let i=0;i<80;i++){
   const q=official[year+'-'+(i+1)],answer=exam.answers[i],sub=i<40?'estate':'civil';
   if(!q?.verified||(subject!=='all'&&sub!==subject))continue;
   if(answer===null||answer===undefined){outcomes.blank++;continue;}
   if(!Number.isInteger(answer)||answer<1||answer>5)continue;
   const correct=Array.isArray(q.correct)&&q.correct.map(Number).includes(answer);
   outcomes.answered++;statsBySubject[sub].answered++;
   if(correct){outcomes.correct++;statsBySubject[sub].correct++;}
   else{outcomes.wrong++;}
   const id=q.id,history=perQuestion.get(id)||[];
   history.push({at:exam.submittedAt,correct});perQuestion.set(id,history);
   for(const c of links[id]?.conceptIds||[]){
    const entry=concept.get(c)||{id:c,correct:0,answered:0,questions:new Set()};
    entry.answered++;if(correct)entry.correct++;
    entry.questions.add(id);concept.set(c,entry);
   }
  }
  if(subject==='all'||subject==='estate')statsBySubject.estate.score.push(Number(exam.score?.estate)||0);
  if(subject==='all'||subject==='civil')statsBySubject.civil.score.push(Number(exam.score?.civil)||0);
 }
 let improved=0,regressed=0,repeatQuestions=0;
 for(const seq of perQuestion.values()){
  if(seq.length<2)continue;
  const ordered=seq.slice().sort((a,b)=>a.at-b.at);
  repeatQuestions++;
  if(!ordered[0].correct&&ordered.at(-1).correct)improved++;
  if(ordered[0].correct&&!ordered.at(-1).correct)regressed++;
 }
 const weakConcepts=[...concept.values()].map(c=>({id:c.id,correct:c.correct,answered:c.answered,
  accuracy:Math.round(c.correct*100/c.answered),questions:c.questions.size}))
  .sort((a,b)=>a.accuracy-b.accuracy||b.answered-a.answered||a.id.localeCompare(b.id));
 const dueIds=new Set(Object.entries(study.review||{}).filter(([id,row])=>official[id]?.verified&&
  (subject==='all'||official[id]?.subject===subject)&&Number(row?.nextAt)>0&&row.nextAt<=now).map(([id])=>id));
 for(const r of window.CK86ExamBridge?.pending?.(now)||[]){
  if(official[r.id]?.verified&&(subject==='all'||official[r.id]?.subject===subject))dueIds.add(r.id);
 }
 const due=dueIds.size;
 const average=values=>values.length?Number((values.reduce((a,b)=>a+b,0)/values.length).toFixed(1)):null;
 return {
  days:n,subject,from:dayKeys[0],to:dayKeys.at(-1),daily:dayKeys.map(d=>dayMap[d]),
  sessions:histories.length,recallCount:recalls.length,recallSuccess:recalls.filter(x=>x.outcome==='remember').length,
  recallUnique:new Set(recalls.map(x=>x.id)).size,typingCount:typed.length,
  typingAccuracy:average(typed.map(x=>Number(x.accuracy)).filter(Number.isFinite)),
  typingCpm:average(typed.map(x=>Number(x.cpm)).filter(Number.isFinite)),
  answered:outcomes.answered,correct:outcomes.correct,wrong:outcomes.wrong,blank:outcomes.blank,
  accuracy:outcomes.answered?Math.round(outcomes.correct*100/outcomes.answered):null,
  averageEstate:average(statsBySubject.estate.score),
  averageCivil:average(statsBySubject.civil.score),
  repeatQuestions,improved,regressed,due,weakConcepts,
  conceptSample:weakConcepts.reduce((sum,x)=>sum+x.answered,0)
 };
}
function barChart(report){
 const data=report.daily,values=data.map(x=>x.typed+x.recalls+x.exams),max=Math.max(1,...values);
 return '<div class="ck83-activity-chart" aria-label="'+report.days+'일간 일별 활동 횟수">'+
 data.map((x,i)=>{
  const v=values[i],height=v?Math.max(5,Math.round(v/max*100)):0;
  const label=(report.days===7||i%5===0||i===data.length-1)?x.day.slice(5):'';
  return '<div class="ck83-activity-cell" title="'+x.day+' · 회상 '+x.recalls+', 타이핑 '+x.typed+', 실전 제출 '+x.exams+
  '"><div class="ck83-activity-bar" style="height:'+height+'%"></div><small>'+esc(label)+'</small></div>';
 }).join('')+'</div><p class="ck83-chart-note">일별 활동 횟수 합계(회상·타이핑 완료·모의고사 제출)입니다. 공부한 시간이나 실력 향상 수치는 아닙니다.</p>';
}
function statusCount(v,suffix=''){return v===null?'자료 없음':String(v)+suffix;}
function renderReport(report){
 const counts=[
  ['실전 제출',report.sessions+'회'],['회상 연습',report.recallCount+'회'],
  ['타이핑 완주',report.typingCount+'회'],['기록된 문항 정답률',statusCount(report.accuracy,'%')],
  ['학개론 평균 점수',statusCount(report.averageEstate,'점')],['민법 평균 점수',statusCount(report.averageCivil,'점')],
  ['반복 풀이 개선',report.improved+' / '+report.repeatQuestions+'문항'],['복습 시점 도래',report.due+'문항']
 ];
 const labelMap=window.CK83Links?.getLabels?.()||{};
 const weak=report.weakConcepts.slice(0,12);
 return '<p class="ck83-analytics-warning">다음 수치는 이 브라우저에 기록된 학습 활동만 반영합니다. 미검수 개념 후보·법령·해설을 성적에 반영하지 않으며 합격 확률을 예측하지 않습니다.</p>'+
 '<dl class="ck83-analytics-stats">'+counts.map(([name,value])=>'<div><dt>'+esc(name)+'</dt><dd>'+esc(value)+'</dd></div>').join('')+'</dl>'+
 '<section class="ck83-analytics-section"><h4>일별 학습 활동 · '+report.from+' ~ '+report.to+'</h4>'+barChart(report)+'</section>'+
 '<section class="ck83-analytics-section"><h4>내 문항 ↔ 개념 연결 기반 응답 결과</h4>'+
 (weak.length?'<p>연결한 문제의 실제 응답만 집계합니다. 오답을 개념 전체의 이해 부족으로 단정하지 않습니다.</p>'+
 '<div class="ck83-concept-rows">'+weak.map(c=>
  '<div><strong>'+esc(labelMap[c.id]||c.id)+'</strong><span>정답 '+c.correct+'/'+c.answered+
  ' · '+c.accuracy+'%'+(c.answered<5?' · 표본 부족':'')+'</span></div>').join('')+'</div>':
 '<p>아직 사용자 직접 연결과 제출된 시험 응답의 교집합이 없습니다. 기출 ↔ 개념 연결에서 직접 분류하면 여기서 비교할 수 있습니다.</p>')+'</section>'+
 '<section class="ck83-analytics-section"><h4>인출 기록·타이핑</h4>'+
 '<p>회상 성공 '+report.recallSuccess+'/'+report.recallCount+
 '회 · 서로 다른 회상 문항 '+report.recallUnique+'개 · 평균 타이핑 정확도 '+
 statusCount(report.typingAccuracy,'%')+' · 평균 타수/분 '+statusCount(report.typingCpm)+'</p>'+
 '<p>동일 문항의 첫 기록과 마지막 기록이 있는 경우 개선 '+report.improved+'개, 정답→오답 변화 '+
 report.regressed+'개입니다. 기록 없는 문항의 최초 성적은 추정하지 않습니다.</p></section>';
}
function mount(){
 const exist=document.getElementById('ck83-analytics');
 if(exist){root=exist;return;}
 const host=document.getElementById('ck83-link-tools')||document.getElementById('ck82-full-exam')||
  document.getElementById('ck76-search')||document.getElementById('main');
 if(!host)return;
 root=document.createElement('section');root.id='ck83-analytics';root.className='ck83-analytics';
 root.innerHTML='<div class="ck83-analytics-head"><strong>학습 데이터 분석 · 7/30일</strong>'+
 '<button type="button" data-ck83-stats-toggle aria-expanded="false">통계 열기</button></div>'+
 '<div data-ck83-stats-body hidden></div>';
 if(host.id==='main')host.prepend(root);else host.after(root);
}
function paint(){
 if(!root||!shown)return;
 const body=root.querySelector('[data-ck83-stats-body]');if(!body)return;
 const report=compute({study:snapshot(),sessions:attempts(),links:mappings(),days:period,subject:filterSubject});
 lastReport=report;
 body.innerHTML='<div class="ck83-stats-filters"><div role="group" aria-label="기간">'+
 [7,30].map(n=>'<button type="button" data-ck83-stats-days="'+n+'" aria-pressed="'+(period===n)+'">'+n+'일</button>').join('')+'</div>'+
 '<label>과목 <select data-ck83-stats-subject><option value="all">전체</option>'+
 '<option value="estate"'+(filterSubject==='estate'?' selected':'')+'>부동산학개론</option>'+
 '<option value="civil"'+(filterSubject==='civil'?' selected':'')+'>민법</option></select></label>'+
 '<button type="button" data-ck83-stats-refresh>새로 계산</button>'+
 '<button type="button" data-ck83-stats-copy>통계 요약 복사</button></div>'+
 renderReport(report);
}
function toggle(){
 shown=!shown;
 const body=root?.querySelector('[data-ck83-stats-body]'),button=root?.querySelector('[data-ck83-stats-toggle]');
 if(button){button.setAttribute('aria-expanded',String(shown));button.textContent=shown?'통계 접기':'통계 열기';}
 if(body)body.hidden=!shown;
 if(shown)paint();
}
function copySummary(){
 if(!lastReport)return;
 const r=lastReport;
 const value=['ConceptKnot '+r.days+'일 학습 활동','기간: '+r.from+' ~ '+r.to,
  '모의고사: '+r.sessions+'회','회상: '+r.recallCount+'회','타이핑 완주: '+r.typingCount+'회',
  '문항 정답률: '+statusCount(r.accuracy,'%'),'학개론 평균: '+statusCount(r.averageEstate,'점'),
  '민법 평균: '+statusCount(r.averageCivil,'점'),
  '동일 문항 재도전 개선: '+r.improved+'/'+r.repeatQuestions+'개',
  '주의: 개인 브라우저 기록 기반, 합격 예측 아님.'].join('\n');
 if(navigator.clipboard?.writeText)navigator.clipboard.writeText(value).catch(()=>{});
 else{
  const area=document.createElement('textarea');area.value=value;area.className='ck83-copy-fallback';
  root.append(area);area.focus();area.select();
 }
}
document.addEventListener('click',event=>{
 const t=event.target.closest?.('[data-ck83-stats-toggle],[data-ck83-stats-days],'+
  '[data-ck83-stats-refresh],[data-ck83-stats-copy]');
 if(!t||!root?.contains(t))return;
 if(t.hasAttribute('data-ck83-stats-toggle'))toggle();
 if(t.hasAttribute('data-ck83-stats-days')){period=Number(t.dataset.ck83StatsDays);paint();}
 if(t.hasAttribute('data-ck83-stats-refresh'))paint();
 if(t.hasAttribute('data-ck83-stats-copy'))copySummary();
});
document.addEventListener('change',event=>{
 if(event.target?.matches?.('[data-ck83-stats-subject]')){filterSubject=event.target.value;paint();}
});
document.addEventListener('ck:personal-links-updated',()=>{if(shown)paint();});
window.addEventListener('ck:official-bank-ready',()=>{if(shown)paint();});
window.addEventListener('storage',event=>{
 if(['recallgraph-first-exam-v1','ck82-exam-sessions-v1','ck83-personal-concept-links-v1'].includes(event.key)&&shown)paint();
});
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;mount();});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
const main=document.getElementById('main');
if(main&&window.MutationObserver)new MutationObserver(changes=>{
 if(!document.getElementById('ck83-analytics')&&changes.some(x=>x.addedNodes.length))schedule();
}).observe(main,{childList:true,subtree:true});
window.CK83Analytics=Object.freeze({compute,recallFor,dayKey,getLastReport:()=>lastReport,
 getState:()=>({shown,period,subject:filterSubject}),
 open:()=>{mount();if(root&&!shown)toggle();}});
})();