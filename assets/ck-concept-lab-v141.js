/* ConceptKnot v141 P6-B interactive vector concept laboratory.
 * Isolated opt-in storage; no WebGL, no AI hallucinated source links.
 */
(function(){
 'use strict';
 const math=window.CK141GraphMath;
 if(!math)return;
 const KEY='ck141-concept-lab-v1';
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fmt=n=>Number(n).toLocaleString('ko-KR',{maximumFractionDigits:2});
 const clamp=(n,l,h)=>Math.max(l,Math.min(h,n));
 let history=math.createHistory(),storeEnabled=false,saveMessage='저장하지 않음 (이 화면의 메모리에서만 유지)';
 let relation={x:1,k:2},relationPrevious={x:1,k:2},relationDrag=null,relPast=[],relFuture=[];
 let drag=null,sliderOpen=false,framePending=false,frameRoot=null,compareBase=false,level='beginner',gestureMode='shift';
 let practiceRound=null,practiceGrade=null,practiceApplied=false,practiceSerial=0,practiceSolved=0,practiceCorrect=0;
 function restore(){
  try{
   const s=localStorage.getItem(KEY);
   if(!s||s.length>90000)return;
   const obj=JSON.parse(s);
   if(obj?.version!==1||obj.optIn!==true||!obj.session)return;
   history=math.createHistory(obj.session);
   if(obj.relation&&Number.isFinite(obj.relation.k)&&Number.isFinite(obj.relation.x)&&
    obj.relation.k>=1&&obj.relation.k<=3&&obj.relation.x>=.5&&obj.relation.x<=3){
    relation={...obj.relation};relationPrevious={...obj.relation};
   }
   level=obj.level==='advanced'?'advanced':'beginner';
   gestur���q�^