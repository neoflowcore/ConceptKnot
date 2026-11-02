/* ConceptKnot v83 adaptive recall — local, explainable heuristic, not a scientifically validated scheduler. */
(function(){
'use strict';
const MINUTE=60000,DAY=86400000,MAX_EVENTS=1200,MAX_DAYS=28;
const normalizedOutcome=value=>value==='remember'?'remember':value==='again'?'again':null;
const validId=id=>/^20(?:1[6-9]|2[0-5])-(?:[1-9]|[1-7]\d|80)$/.test(String(id||''));
const toEvents=events=>Array.isArray(events)?events.filter(e=>
 e&&validId(e.id)&&normalizedOutcome(e.outcome)&&Number.isFinite(Number(e.at))&&
 Number(e.at)>0).slice(-MAX_EVENTS):[];
function historyFor(id,events,limit=8){
 return toEvents(events).filter(e=>e.id===id).slice(-limit);
}
function schedule({id,outcome,previous,history=[],now=Date.now()}={}){
 if(!validId(id)||!normalizedOutcome(outcome)||!Number.isFinite(now)||now<=0)return null;
 const recent=historyFor(id,history,6),priorFail=recent.filter(e=>e.outcome==='again').length;
 const last=recent.at(-1),streak=outcome==='again'?0:Math.min(6,Math.max(0,Number(previous?.streak)||0)+1);
 const reviewed=Math.max(0,Number(previous?.reviewed)||0)+1;
 let minutes;
 let reason;
 if(outcome==='again'){
  minutes=priorFail>=2?10:15;
  reason=priorFail>=2?'최근 반복 인출 실패 · 짧은 재도전':'인출 실패 · 짧은 재도전';
 }else{
  const base=[0,1,3,6,12,20,28][streak]||1;
  const ratio=recent.length?priorFail/recent.length:0;
  let factor=ratio>=0.5?0.5:ratio>0?0.75:1;
  // Success directly after a failed recall should not jump to a long interval.
  if(last?.outcome==='again')factor=Math.min(factor,0.5);
  minutes=Math.max(12*60,Math.round(base*factor*24*60));
  minutes=Math.min(MAX_DAYS*1440,minutes);
  reason=factor<1?'이전 오답을 고려한 단축 간격':'연속 회상 성공에 따른 간격 확대';
 }
 const nextAt=now+minutes*MINUTE;
 return {nextAt,updatedAt:now,streak,reviewed,result:outcome,
  intervalMinutes:minutes,algorithm:'ck83-adaptive-local-v1',reason};
}
function pushEvent(events,event){
 if(!event||!validId(event.id)||!normalizedOutcome(event.outcome)||!Number.isFinite(Number(event.at))||Number(event.at)<=0)return toEvents(events);
 return toEvents(events).concat({
  id:event.id,at:Number(event.at),outcome:event.outcome,
  intervalMinutes:Math.max(0,Number(event.intervalMinutes)||0)
 }).slice(-MAX_EVENTS);
}
function rankDue(rows,review={},mistakes=[],now=Date.now()){
 if(!Array.isArray(rows))return [];
 const errorIds=new Set((Array.isArray(mistakes)?mistakes:[]).filter(x=>x?.type==='exam'&&!x.resolved)
  .map(x=>String(x.year)+'-'+String(x.number)));
 return rows.slice().sort((a,b)=>{
  const score=x=>{
   const planned=Number(review[x.id]?.nextAt)||0;
   const overdue=planned?Math.max(0,(now-planned)/DAY):0;
   const fail=review[x.id]?.result==='again'?4:0;
   const mistake=errorIds.has(x.id)?2:0;
   return fail+mistake+Math.min(5,overdue);
  };
  return score(b)-score(a)||Number(a.at||0)-Number(b.at||0)||String(a.id).localeCompare(String(b.id));
 });
}
function summarize(events,now=Date.now(),days=7){
 const from=now-Math.max(1,Math.min(365,Number(days)||7))*DAY;
 const filtered=toEvents(events).filter(x=>x.at>=from&&x.at<=now);
 const failed=filtered.filter(x=>x.outcome==='again').length;
 return {attempts:filtered.length,remembered:filtered.length-failed,forgotten:failed,
  recallRate:filtered.length?Math.round((filtered.length-failed)*100/filtered.length):null,
  uniqueQuestions:new Set(filtered.map(x=>x.id)).size};
}
window.CK83Recall=Object.freeze({schedule,pushEvent,rankDue,summarize,historyFor,validId,
 getStatus:()=>({algorithm:'ck83-adaptive-local-v1',maxEvents:MAX_EVENTS,maxIntervalDays:MAX_DAYS})});
})();