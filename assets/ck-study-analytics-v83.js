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
 const concept=new Map(),perQuestion=new Map(),yearly=new Map(),trends=[];
 for(const exam of histories){
  const year=Number(exam.year);
  if(!Number.isInteger(year)||year<2016||year>2025)continue;
  const sample={estate:{seen:0,correct:0},civil:{seen:0,correct:0}};
  const group=yearly.get(year)||{year,attempts:0,seen:0,answered:0,correct:0,blank:0};
  group.attempts++;
  for(let i=0;i<80;i++){
   const q=official[year+'-'+(i+1)],answer=exam.answers[i],sub=i<40?'estate':'civil';
   if(!q?.verified||(subject!=='all'&&sub!==subject))continue;
   sample[sub].seen++;group.seen++;
   if(answer===null||answer===undefined){outcomes.blank++;group.blank++;continue;}
   if(!Number.isInteger(answer)||answer<1||answer>5)continue;
   const correct=Array.isArray(q.correct)&&q.correct.map(Number).includes(answer);
   outcomes.answered++;statsBySubject[sub].answered++;group.answered++;
   if(correct){outcomes.correct++;statsBySubject[sub].correct++;sample[sub].correct++;group.correct++;}
   else{outcomes.wrong++;}
   const id=q.id,history=perQuestion.get(id)||[];
   history.push({at:exam.submittedAt,correct});perQuestion.set(id,history);
   for(const c of (Array.isArray(links[id]?.conceptIds)?links[id].conceptIds:[])){
    if(typeof c!=='string')continue;
    const entry=concept.get(c)||{id:c,correct:0,answered:0,questions:new Set()};
    entry.answered++;if(correct)entry.correct++;
    entry.questions.add(id);concept.set(c,entry);
   }
  }
  yearly.set(year,group);
  const estate=sample.estate.seen===40?sample.estate.correct*2.5:null;
  const civil=sample.civil.seen===40?sample.civil.correct*2.5:null;
  if(estate!==null)statsBySubject.estate.score.push(estate);
  if(civil!==null)statsBySubject.civil.score.push(civil);
  if(estate!==null||civil!==null)trends.push({year,at:exam.submittedAt,estate,civil,
   average:estate!==null&&civil!==null?(estate+civil)/2:null,
   passed:estate!==null&&civil!==null?estate>=40&&civil>=40&&(estate+civil)/2>=60:null});

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
 const queue=window.CK86ExamBridge?.getDue?.({at:now,attempts:sessions,
  reviews:study.review||{},mistakes:study.mistakes||[],bank:official,subject})||{due:0,future:0};
 const due=queue.due;
 const optionCoverage=window.CK83Links?.reviewSummary?.()||{assessed:0,reasoned:0,sourceLinked:0,totalOptions:4000};
 const sortedTrends=trends.slice().sort((a,b)=>a.at-b.at);
 const scores=sortedTrends.map(x=>subject==='estate'?x.estate:subject==='civil'?x.civil:x.average).filter(x=>x!==null);
 const firstScore=scores.length?scores[0]:null,lastScore=scores.length?scores.at(-1):null;
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
  repeatQuestions,improved,regressed,due,future:queue.future,weakConcepts,optionCoverage,
  years:[...yearly.values()].filter(x=>x.seen>0).sort((a,b)=>b.year-a.year),
  trends:sortedTrends.slice(-10),firstScore,lastScore,
  scoreDelta:scores.length>=2?Number((lastScore-firstScore).toFixed(1)):null,
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
 const weak=report.weakConcepts.slice(0,12),option=report.optionCoverage||{};
 return '<p class="ck83-analytics-warning">다음 수치는 이 브라우저에 기록된 학습 활동만 반영합니다. 미검수 개념 후보·법령·해설을 성적에 반영하지 않으며 합격 확률을 예측하지 않습니다.</p>'+
 '<dl class="ck83-analytics-stats">'+counts.map(([name,value])=>'<div><dt>'+esc(name)+'</dt><dd>'+esc(value)+'</dd></div>').join('')+'</dl>'+
 '<section class="ck83-analytics-section"><h4>일별 학습 활동 · '+report.from+' ~ '+report.to+'</h4>'+barChart(report)+'</section>'+
 '<section class="ck83-analytics-section"><h4>내 문항 ↔ 개념 연결 기반 응답 결과</h4>'+
 (weak.length?'<p>연결한 문제의 실제 응답만 집계합니다. 오답을 개념 전체의 이해 부족으로 단정하지 않습니다.</p>'+
 '<div class="ck83-concept-rows">'+weak.map(c=>
  '<div><strong>'+esc(labelMap[c.id]||c.id)+'</strong><span>정답 '+c.correct+'/'+c.answered+
  ' · '+c.accuracy+'%'+(c.answered<5?' · 표본 부족':'')+'</span></div>').join('')+'</div>':
 '<p>아직 사용자 직접 연결과 제출된 시험 응답의 교집합이 없습니다. 기출 ↔ 개념 연결에서 직접 분류하면 여기서 비교할 수 있습니다.</p>')+'</section>'+
 '<section class="ck83-analytics-section"><h4>공식 기출 연도별 기록</h4><p>선택 기간에 제출한 시험 중 실제 확인된 문항만 집계합니다.</p>'+
  (report.years.length?'<div class="ck83-yearly-rows">'+report.years.map(x=>
    '<div><strong>'+x.year+'년 공식 기출 · 제출 '+x.attempts+'회</strong><span>답 '+x.answered+'/'+x.seen+
    ' · 정답 '+x.correct+' · '+(x.answered?Math.round(x.correct*100/x.answered)+'%':'응답 없음')+'</span></div>').join('')+'</div>':
    '<p>이 기간에 확인된 공식 기출 응답이 없습니다.</p>')+'</section>'+
 '<section class="ck83-analytics-section"><h4>최근 실전 점수 추이</h4>'+
  (report.trends.length?'<div class="ck83-yearly-rows">'+report.trends.map(x=>
    '<div><strong>'+esc(dayKey(x.at))+' · '+x.year+'년 시험</strong><span>학개론 '+statusCount(x.estate,'점')+
    ' · 민법 '+statusCount(x.civil,'점')+' · 평균 '+statusCount(x.average,'점')+'</span></div>').join('')+'</div>':
    '<p>완전하게 확인된 공식 과목 점수가 없습니다.</p>')+
  '<p>첫 점수 '+statusCount(report.firstScore,'점')+' → 마지막 '+statusCount(report.lastScore,'점')+
  (report.scoreDelta!==null?' · 변화 '+(report.scoreDelta>0?'+':'')+report.scoreDelta+'점':'')+
  ' (표본이 적으면 변화량은 불안정합니다)</p></section>'+
 '<section class="ck83-analytics-section"><h4>4,000개 선지별 개인 검토</h4><p>개인 판단 '+(option.assessed||0)+
  '/4000 · 근거 '+(option.reasoned||0)+'건 · 출처 '+(option.sourceLinked||0)+
  '건. 공식 검증 완료로 집계하지 않습니다.</p></section>'+
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
 '<button type="button" data-ck83-stats-copy>통계 요약 복사</button>'+
  '<button type="button" data-ck83-stats-export>전체 통계 TXT</button></div>'+
 renderReport(report);
}
function toggle(){
 shown=!shown;
 const body=root?.querySelector('[data-ck83-stats-body]'),button=root?.querySelector('[data-ck83-stats-toggle]');
 if(button){button.setAttribute('aria-expanded',String(shown));button.textContent=shown?'통계 접기':'통계 열기';}
 if(body)body.hidden=!shown;
 if(shown)paint();
}
function formatReportTxt(r){
 if(!r)return '';
 const lines=['ConceptKnot 개인 학습 통계 · 공식 시험성적/합격예측 아님',
  '기간: '+r.from+' ~ '+r.to+' ('+r.days+'일) · 과목: '+
   ({all:'전체',estate:'부동산학개론',civil:'민법'}[r.subject]||r.subject),
  '모의고사 제출: '+r.sessions+'회 · 회상: '+r.recallCount+'회 · 타이핑 완주: '+r.typingCount+'회',
  '공식 기출 응답 정답률: '+statusCount(r.accuracy,'%')+' · 정답 '+r.correct+' / 응답 '+r.answered,
  '학개론 평균 점수: '+statusCount(r.averageEstate,'점')+
  ' · 민법 평균 점수: '+statusCount(r.averageCivil,'점'),
  '복습 시점 도래: '+r.due+'건 · 향후 예약: '+r.future+'건',
  '반복 풀이 개선: '+r.improved+' / '+r.repeatQuestions+'문항','',
  '연도별 공식 기출 정답률'];
 for(const x of r.years||[]){
  lines.push(x.year+'년 · 제출 '+x.attempts+'회 · '+x.correct+'/'+x.answered+
   '문항 정답 · '+(x.answered?Math.round(x.correct*100/x.answered)+'%':'응답 없음'));
 }
 if(!(r.years||[]).length)lines.push('기록 없음');
 lines.push('','모의고사 점수 추이');
 for(const x of r.trends||[])lines.push(dayKey(x.at)+' · '+x.year+'년 · 학개론 '+statusCount(x.estate,'점')+
  ' · 민법 '+statusCount(x.civil,'점')+' · 평균 '+statusCount(x.average,'점'));
 if(!(r.trends||[]).length)lines.push('확인된 결과 없음');
 lines.push('','일별 학습 활동');
 for(const x of r.daily||[])lines.push(x.day+' · 회상 '+x.recalls+' · 타이핑 '+x.typed+' · 모의고사 '+x.exams);
 lines.push('','선지별 개인 판단: '+(r.optionCoverage?.assessed||0)+'/4000',
  '판단 근거 입력: '+(r.optionCoverage?.reasoned||0)+'건 · 출처 기록: '+(r.optionCoverage?.sourceLinked||0)+'건',
  '주의: 원문/법령에 대한 공식 감수 결과를 나타내지 않습니다.');
 return lines.join('\n')+'\n';
}
function exportReport(){
 const text=formatReportTxt(lastReport);if(!text)return false;
 try{const file=new Blob(['\uFEFF',text],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(file);
  const link=document.createElement('a');link.href=url;
  link.download='ConceptKnot_학습통계_'+lastReport.days+'일_'+lastReport.to+'.txt';
  document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),2500);return true;
 }catch{return false;}
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
  '[data-ck83-stats-refresh],[data-ck83-stats-copy],[data-ck83-stats-export]');
 if(!t||!root?.contains(t))return;
 if(t.hasAttribute('data-ck83-stats-toggle'))toggle();
 if(t.hasAttribute('data-ck83-stats-days')){period=Number(t.dataset.ck83StatsDays);paint();}
 if(t.hasAttribute('data-ck83-stats-refresh'))paint();
 if(t.hasAttribute('data-ck83-stats-copy'))copySummary();
 if(t.hasAttribute('data-ck83-stats-export'))exportReport();
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
window.CK83Analytics=Object.freeze({compute,recallFor,dayKey,formatReportTxt,exportReport,getLastReport:()=>lastReport,
 getState:()=>({shown,period,subject:filterSubject}),
 open:()=>{mount();if(root&&!shown)toggle();}});
})();