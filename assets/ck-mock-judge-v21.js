/* Five 80-question inverse-stem practice sets from verified 2021–2025 papers.
 * Preserve all conditions, reverse only an unambiguous right/wrong stem, and
 * ask for the combination of the four complementary options. No answer-key trivia.
 * Exclude best-answer, multiple/all-correct, diagrams and existing combination stems.
 */
(function(){
'use strict';
const cache=new Map(),letters=['A','B','C','D','E'];
const pattern=/(옳지 않은 것은|옳은 것은|틀린 것은|적절하지 않은 것은)\?/;
function eligible(r){return r?.verified===true&&r.year>=2021&&r.year<=2025&&r.correct?.length===1&&r.options?.length===5&&!r.diagrams?.length&&pattern.test(r.question)&&!/가장|모두 고른/.test(r.question)}
function build(set,subject,records){
 const key=set+'/'+subject,prior=cache.get(key);if(prior?.records===records)return prior.list;
 if(!Number.isInteger(set)||set<1||set>5)return [];
 const preferred=2026-set;
 const pool=Object.values(records||{}).filter(r=>r.subject===subject&&eligible(r)).sort((a,b)=>Number(b.year===preferred)-Number(a.year===preferred)||b.year-a.year||a.number-b.number);
 if(pool.length<40)return [];
 const rows=pool.slice(0,Math.max(40,pool.filter(r=>r.year===preferred).length));
 // Fill from a different rotation for each set without duplicate source questions.
 const rest=pool.filter(r=>!rows.includes(r));
 const offset=(set-1)*13%Math.max(1,rest.length);
 const ordered=rows.filter(r=>r.year===preferred).concat(rest.slice(offset),rest.slice(0,offset),rows.filter(r=>r.year!==preferred));
 const selected=[...new Map(ordered.map(r=>[r.id,r])).values()].slice(0,40);
 const list=selected.map((r,i)=>{
  const original=r.correct[0]-1;
  const inverted=r.question.replace(pattern,(_,stem)=>stem==='옳은 것은'?'옳지 않은 보기를 모두 고른 것은?':stem==='적절하지 않은 것은'?'적절한 보기를 모두 고른 것은?':'옳은 보기를 모두 고른 것은?');
  // Every candidate omits exactly one option; the correct candidate omits the old key.
  const omissions=[0,1,2,3,4];const rotate=(set+i)%5;
  const order=omissions.slice(rotate).concat(omissions.slice(0,rotate));
  const ok=order.indexOf(original)+1;
  return Object.freeze({id:'inverse22-'+set+'-'+r.id,s:subject,set,sourceYear:r.year,sourceNumber:r.number,
   topic:r.year+'년 '+r.number+'번 · 옳고 그름 반전 응용',
   q:inverted+'\n\n'+r.options.map((text,n)=>'보기 '+letters[n]+'. '+text).join('\n\n'),
   a:order.map(skip=>letters.filter((_,n)=>n!==skip).join(', ')),correct:[ok],ok,
   why:'원문은 '+r.correct[0]+'번 보기를 최종정답으로 인정합니다. 질문의 옳고 그름을 반대로 바꿨으므로, 원문 정답 '+letters[original]+'를 제외한 네 보기를 함께 선택합니다. 시험 당시의 조건·법령 기준을 유지한 응용문제입니다.',
   verified:true,originalCorrect:r.correct.slice(),originalOptions:r.options.slice(),omissions:order.slice(),sourceNote:'최근 5개년 원문 조건 보존 · 질문 반전 및 조합형 자체 제작 응용'
  });
 });
 cache.set(key,{records,list:Object.freeze(list)});return list;
}
window.CK21Judge=Object.freeze({build,eligible});
})();
