/* ConceptKnot v87: latest-attempt-first review bridge (no writes to official key).
 * A more recent correctly answered examination supersedes an older wrong attempt.
 * An explicit user's spaced-repetition schedule still takes precedence.
 */
(function(){
'use strict';
const official=()=>window.RECALL_OFFICIAL||{};
const keyOf=(year,number)=>String(year)+'-'+String(number);
const safeAt=v=>Number.isFinite(Number(v))&&Number(v)>0?Number(v):0;
function pending(at=Date.now(),attempts=window.CK82FullExam?.getAttempts?.()||[],
 reviews=window.CK79Study?.snapshot?.().review||{},bank=official()){
 const latest=new Map();
 for(const exam of Array.isArray(attempts)?attempts:[]){
  if(exam?.status!=='submitted'||!Number.isInteger(Number(exam.year))||
   !Array.isArray(exam.answers)||exam.answers.length!==80)continue;
  const submittedAt=safeAt(exam.submittedAt);
  if(!submittedAt)continue;
  for(let i=0;i<80;i++){
   const id=keyOf(exam.year,i+1),q=bank[id];
   if(!q?.verified||!Array.isArray(q.correct)||!q.correct.length)continue;
   const previous=latest.get(id);
   if(previous&&previous.at>=submittedAt)continue;
   const selection=exam.answers[i];
   const response=Number.isInteger(selection)&&selection>=1&&selection<=5?selection:null;
   const correct=response!==null&&q.correct.map(Number).includes(response);
   latest.set(id,{id,at:submittedAt,correct,blank:response===null});
  }
 }
 const rows=[];
 for(const item of latest.values()){
  if(item.correct)continue;
  const scheduled=reviews&&typeof reviews==='object'?reviews[item.id]:null;
  // A later deliberate recall assessment controls the next due time.
  const next=Number(scheduled?.nextAt);
  if(safeAt(scheduled?.updatedAt)>=item.at&&Number.isFinite(next)&&next>at)continue;
  rows.push({id:item.id,reason:item.blank?'실전 미응답':'실전 오답',at:item.at,
   source:'v82-official-mock',latestAttempt:true});
 }
 return rows.sort((a,b)=>b.at-a.at||a.id.localeCompare(b.id));
}
window.CK86ExamBridge=Object.freeze({
 pending,reconcile:()=>({pending:pending().length,source:'latest-submitted-attempt'})
});
})();