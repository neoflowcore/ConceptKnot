/* ConceptKnot v153 — session-only five-case prediction ledger.
 * No storage, network, OMR, official answers, or timers. Each case counts once.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.CK153Quiz=api;})(typeof window==='object'?window:null,function(){
'use strict';
const make=()=>({index:0,grades:[null,null,null,null,null],verdicts:[null,null,null,null,null],applied:null});
const store=new Map();
function state(scope,id){
 const key=scope+':'+id;
 if(!store.has(key))store.set(key,make());
 return store.get(key);
}
const fingerprint=row=>row?.numeric?
 JSON.stringify([row.scope,row.id,row.index,row.expected,row.from,row.to,row.action?.value,row.action?.kind]):
 JSON.stringify([row?.scope,row?.id,row?.index,row?.expected]);
function visible(s,row){
 if(!s||!row)return null;
 const grade=s.grades[row.index];
 return grade?.signature===fingerprint(row)?grade:null;
}
function select(s,index){
 if(!s||!Number.isInteger(index)||index<0||index>=5)return false;
 s.index=index;s.applied=null;return true;
}
function answer(s,row,choice){
 if(!s||!row||!row.choices?.includes(choice)||visible(s,row))return null;
 const ok=choice===row.expected;
 const grade={chosen:choice,correct:row.expected,ok,signature:fingerprint(row)};
 s.grades[row.index]=grade;
 s.verdicts[row.index]=ok?'correct':'wrong';
 s.applied=null;
 return grade;
}
function summary(s){
 if(!s)return {attempted:0,correct:0,retry:0,remaining:5};
 const attempted=s.verdicts.filter(Boolean).length;
 const correct=s.verdicts.filter(x=>x==='correct').length;
 return {attempted,correct,retry:attempted-correct,remaining:5-attempted};
}
function again(s,row){
 if(!s||!row||!visible(s,row))return false;
 s.grades[row.index]=null;
 s.applied=null;
 return true;
}
function review(s){
 if(!s)return -1;
 for(let d=1;d<=5;d++){const n=(s.index+d)%5;
  if(s.verdicts[n]==='wrong'){s.index=n;s.grades[n]=null;s.applied=null;return n;}
 }
 // Retry the current wrong item if it is the only one.
 if(s.verdicts[s.index]==='wrong'){s.grades[s.index]=null;s.applied=null;return s.index;}
 return -1;
}
function nextUnseen(s){
 if(!s)return -1;
 for(let d=1;d<=5;d++){const n=(s.index+d)%5;
  if(s.verdicts[n]===null){s.index=n;s.applied=null;return n;}
 }return -1;
}
function applied(s,row){
 if(!s||!visible(s,row)||!row?.canApply||!row.action)return false;
 const sig=fingerprint(row);if(s.applied===sig)return false;
 s.applied=sig;return true;
}
function clear(scope,id){store.set(scope+':'+id,make());return store.get(scope+':'+id)}
return Object.freeze({state,select,answer,visible,summary,again,review,nextUnseen,applied,clear,fingerprint,size:5});
});

