/* v86: derived, idempotent exam-to-recall queue. No duplicate persistence. */
(function(){
'use strict';
const official=()=>window.RECALL_OFFICIAL||{};
function pending(at=Date.now()){
 const attempts=window.CK82FullExam?.getAttempts?.()||[],review=window.CK79Study?.snapshot?.().review||{};
 const rows=new Map();
 for(const exam of attempts){
  if(exam?.status!=='submitted'||!Number.isFinite(exam.year)||!Array.isArray(exam.answers))continue;
  for(let i=0;i<80;i++){
   const id=exam.year+'-'+(i+1),q=official()[id],selected=exam.answers[i];
   if(!q?.verified)continue;
   const correct=selected!==null&&q.correct?.includes(selected);
   if(correct)continue;
   const next=Number(review[id]?.nextAt)||0;
   if(next>at)continue;
   if(!rows.has(id))rows.set(id,{id,reason:selected===null?'실전 미응답':'실전 오답',
    at:Number(exam.submittedAt)||0,source:'v82-official-mock'});
  }
 }
 return [...rows.values()].sort((a,b)=>b.at-a.at||a.id.localeCompare(b.id));
}
window.CK86ExamBridge=Object.freeze({pending,reconcile:()=>({pending:pending().length})});
})();