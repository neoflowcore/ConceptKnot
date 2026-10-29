/* v21 follow-up: transform official-answer recognition into true/false judgment.
 * We deliberately ask about answer-key acceptance, NOT legal correctness of every
 * distractor, because "best answer" examinations can contain conditionally true text.
 */
(function(){
'use strict';
const cache=new Map();
function build(set,subject,records){
 const source=window.CK20_MOCK?.build(set,subject,records)||[];
 const key=set+'/'+subject;
 const saved=cache.get(key);if(saved?.original===source)return saved.list;
 const list=source.map((q,i)=>{
  const rand=((i*17+set*11+q.sourceNumber*3)%5);
  const pick=rand+1,wasRight=Array.isArray(q.correct)?q.correct.includes(pick):q.ok===pick;
  const words=q.a[pick-1];
  return Object.freeze({
   id:'judge-'+q.id,s:q.s,set:q.set,sourceYear:q.sourceYear,sourceNumber:q.sourceNumber,
   topic:q.sourceYear+'년 '+q.sourceNumber+'번 · 정답 선지 판정',
   q:'다음은 '+q.sourceYear+'년 기출 '+q.sourceNumber+'번의 '+pick+'번 변형 보기입니다.\n\n“'+words+'”\n\n이 보기는 해당 연도 A형의 최종정답으로 인정된 선지인가?',
   a:['인정된 정답 선지다','최종정답으로 인정된 선지는 아니다'],
   correct:[wasRight?1:2],ok:wasRight?1:2,
   why:'해당 연도 최종정답 인정 여부 판정입니다. 원문 5개 선지와 조건을 반드시 함께 확인하세요. 선택한 보기의 원래 번호는 '+q.originalOrder[pick-1]+'번입니다.',
   verified:true,sourceNote:'원문 자체의 일반적인 참·거짓을 증명하는 문제가 아니라 공식 정답키 판별형 응용입니다.'
  });
 });
 cache.set(key,{original:source,list:Object.freeze(list)});return list;
}
window.CK21Judge=Object.freeze({build});
})();