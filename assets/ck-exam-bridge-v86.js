/* ConceptKnot v96: one source of truth for due official-question reviews.
 * Records are read-only here. Explicit recall decisions, exams, and manually
 * resolved mistakes are ordered by their time; official bank is never mutated.
 */
(function(){
'use strict';
const official=()=>window.RECALL_OFFICIAL||{};
const safeAt=v=>Number.isFinite(Number(v))&&Number(v)>0?Number(v):0;
const validId=id=>/^20(?:1[6-9]|2[0-5])-(?:[1-9]|[1-7]\d|80)$/.test(String(id||''));
const validQuestion=(id,bank)=>validId(id)&&bank?.[id]?.verified===true&&
 Array.isArray(bank[id].correct)&&bank[id].correct.length>0;
function latestAttempts(attempts=[],bank=official(),at=Date.now()){
 const latest=new Map();
 for(const exam of Array.isArray(attempts)?attempts:[]){
  if(exam?.status!=='submitted'||!Number.isInteger(Number(exam.year))||
   !Array.isArray(exam.answers)||exam.answers.length!==80)continue;
  const submittedAt=safeAt(exam.submittedAt);
  if(!submittedAt||submittedAt>at+86400000)continue;
  for(let i=0;i<80;i++){
   const id=exam.year+'-'+(i+1),q=bank[id];
   if(!validQuestion(id,bank))continue;
   const previous=latest.get(id);
   if(previous&&previous.at>=submittedAt)continue;
   const selected=exam.answers[i];
   const answer=Number.isInteger(selected)&&selected>=1&&selected<=5?selected:null;
   const correct=answer!==null&&q.correct.map(Number).includes(answer);
   latest.set(id,{id,at:submittedAt,correct,blank:answer===null,answer});
  }
 }
 return latest;
}
function getDue({at=Date.now(),attempts=window.CK82FullExam?.getAttempts?.()||[],
 reviews=window.CK79Study?.snapshot?.().review||{},
 mistakes=window.CK79Study?.snapshot?.().mistakes||[],bank=official(),subject='all'}={}){
 const last=latestAttempts(attempts,bank,at);
 const scheduled=reviews&&typeof reviews==='object'&&!Array.isArray(reviews)?reviews:{};
 const mistakesById=new Map();
 for(const m of Array.isArray(mistakes)?mistakes:[]){
  if(m?.type!=='exam')continue;
  const id=String(m.year)+'-'+String(m.number);
  if(!validQuestion(id,bank))continue;
  const ts=safeAt(m.updated);
  if(!mistakesById.has(id)||mistakesById.get(id).at<=ts)
   mistakesById.set(id,{at:ts,resolved:m.resolved===true});
 }
 const allIds=new Set([...last.keys(),...Object.keys(scheduled),...mistakesById.keys()]);
 const rows=[],futureRows=[],cleared=[];
 for(const id of allIds){
  if(!validQuestion(id,bank)||(subject!=='all'&&bank[id].subject!==subject))continue;
  const exam=last.get(id);
  const review=scheduled[id],nextAt=safeAt(review?.nextAt),reviewAt=safeAt(review?.updatedAt);
  const mistake=mistakesById.get(id);
  const events=[];
  if(nextAt)events.push({kind:'review',at:reviewAt,order:3,nextAt});
  if(exam)events.push({kind:'exam',at:exam.at,order:2,exam});
  if(mistake)events.push({kind:'mistake',at:mistake.at,order:1,mistake});
  if(!events.length)continue;
  events.sort((a,b)=>b.at-a.at||b.order-a.order);
  const decision=events[0];
  if(decision.kind==='review'){
   const row={id,at:decision.nextAt,reason:'복습 예약',source:'personal-recall'};
   (decision.nextAt<=at?rows:futureRows).push(row);
  }else if(decision.kind==='exam'){
   if(decision.exam.correct){cleared.push(id);continue;}
   rows.push({id,at:decision.at,reason:decision.exam.blank?'실전 미응답':'실전 오답',
    source:'v82-official-mock',latestAttempt:true});
  }else if(decision.mistake.resolved)cleared.push(id);
  else rows.push({id,at:decision.at,reason:'내 오답',source:'personal-mistake'});
 }
 rows.sort((a,b)=>a.at-b.at||a.id.localeCompare(b.id));
 futureRows.sort((a,b)=>a.at-b.at||a.id.localeCompare(b.id));
 return {rows,futureRows,cleared,due:rows.length,future:futureRows.length,
  latestCount:last.size,source:'latest-personal-decision'};
}
function pending(at=Date.now(),attempts=window.CK82FullExam?.getAttempts?.()||[],
 reviews=window.CK79Study?.snapshot?.().review||{},bank=official()){
 return getDue({at,attempts,reviews,mistakes:[],bank}).rows
  .filter(x=>x.source==='v82-official-mock')
  .sort((a,b)=>b.at-a.at||a.id.localeCompare(b.id));
}
window.CK86ExamBridge=Object.freeze({
 latestAttempts,getDue,pending,
 reconcile:()=>({pending:getDue().due,source:'latest-personal-decision'})
});
})();