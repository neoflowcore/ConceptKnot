/* ConceptKnot v20 – five deterministic past-paper-derived practice sets.
 * 5 sets x 80 questions (40/subject), from verified official records 2021–2025.
 * This is an option-order and presentation variant, not a newly authored stem.
 * The item cites its own source; all-correct questions are replaced, and
 * multiple accepted answers remain valid after shuffling.
 */
(function(){
'use strict';
const YEARS=[2025,2024,2023,2022,2021];
const cache=new Map();
function accepted(record){
 if(!record||record.verified!==true||!record.question?.trim()||
    !Array.isArray(record.options)||record.options.length!==5||
    record.options.some(x=>typeof x!=='string'||!x.trim()))return [];
 const result=Array.isArray(record.correct)?record.correct:[record.correct];
 if(!result.length||result.some(n=>!Number.isInteger(Number(n))||Number(n)<1||Number(n)>5))return [];
 return [...new Set(result.map(Number))].sort((a,b)=>a-b);
}
function mixIndex(seed){
 let n=seed>>>0;
 return ()=>{n^=n<<13;n^=n>>>17;n^=n<<5;return (n>>>0)/4294967296};
}
function shuffle(record,set,year,number){
 const order=[0,1,2,3,4];
 const rand=mixIndex((set*2654435761+year*137+number*1031)>>>0);
 for(let i=order.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[order[i],order[j]]=[order[j],order[i]]}
 // If a theoretical fixed-point permutation occurs, shift so this is a real variant.
 if(order.every((n,i)=>n===i))order.push(order.shift());
 const acceptedOld=accepted(record);
 const correct=order.reduce((list,original,i)=>(acceptedOld.includes(original+1)&&list.push(i+1),list),[]);
 return {order,correct,options:order.map(i=>record.options[i])};
}
function make(set,subject,records){
 const n=Number(set);
 if(!Number.isInteger(n)||n<1||n>5||!['estate','civil'].includes(subject))return [];
 const year=YEARS[n-1], start=subject==='estate'?1:41, end=start+39;
 const key=n+'/'+subject;
 const cached=cache.get(key);
 if(cached&&cached.records===records)return cached.list;
 const list=[];
 for(let number=start;number<=end;number++){
  let sourceYear=year,record=records[year+'-'+number],keys=accepted(record);
  // A record where all five are accepted cannot teach discrimination.
  // Replace by the same question number from another recent year; disclose year.
  if(keys.length===5||!keys.length){
   for(const fallback of YEARS){
    if(fallback===year)continue;
    const candidate=records[fallback+'-'+number];
    const acceptedCandidate=accepted(candidate);
    if(acceptedCandidate.length&&acceptedCandidate.length<5){
     sourceYear=fallback;record=candidate;keys=acceptedCandidate;break;
    }
   }
  }
  if(keys.length===5||!keys.length)continue;
  const variant=shuffle(record,n,sourceYear,number);
  list.push(Object.freeze({
    id:'mock-'+n+'-'+sourceYear+'-'+number,
    s:subject,set:n,sourceYear,sourceNumber:number,
    topic:sourceYear+'년 '+number+'번 · 출제조건 유지·선지 변형',
    q:record.question,
    a:variant.options,
    ok:variant.correct[0],
    correct:Object.freeze(variant.correct),
    // Original option indexes after scrambling allow objective key verification.
    originalOrder:Object.freeze(variant.order.map(x=>x+1)),
    why:sourceYear+'년 '+number+'번 A형의 검증된 정답 선지를 재배열했습니다. 정답: '+variant.correct.map(v=>v+'번').join(' 또는 ')+'. 원문과 해설은 공식 시험지에서 다시 확인하세요.',
    originalSource:record.originalUrl||record.paperUrl||'',
    verified:true
  }));
 }
 cache.set(key,{records,list:Object.freeze(list)});
 return list;
}
window.CK20_MOCK=Object.freeze({
 years:Object.freeze(YEARS.slice()),
 build:make,
 isCorrect:(q,choice)=>Array.isArray(q?.correct)?q.correct.includes(Number(choice)):Number(q?.ok)===Number(choice),
 answer:(q)=>Array.isArray(q?.correct)?q.correct.join(' 또는 '):String(q?.ok||'')
});
})();