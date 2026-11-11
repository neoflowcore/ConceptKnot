/* ConceptKnot P4 v159: 400-question, source-locked human review queue.
 * Read-only: no storage mutations, no source truth inference and no auto-publication.
 * Heuristic categories schedule human work; they never classify an option as true.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.CK159P4Review=api;
})(typeof window==='object'?window:null,function(){
 'use strict';
 const LAW=/법령|법률|민법|시행령|규칙|판례|대법원|조문/;
 const CALC=/계산|금액|산정|환원율|탄력성|원리금|수익률|가치|몇\s*개|얼마|지수/;
 const LABEL={1:'특수정답 우선',2:'법령·판례 문구',3:'계산·수치 문구',4:'기타 원전 대조'};
 const hasOwn=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
 const validNo=n=>Number.isInteger(n)&&n>=1&&n<=5;
 const matching=(q,e)=>{
  if(!q||!e||q.verified!==true||q.year<2021||q.year>2025||
   q.id!==e.questionId||q.year!==e.examYear||q.number!==e.number||
   q.subject!==e.subject||!['estate','civil'].includes(q.subject)||
   !Array.isArray(q.correct)||!Array.isArray(e.officialAnswer)||
   !q.correct.length||q.correct.some(n=>!validNo(n))||
   q.correct.length!==e.officialAnswer.length||
   [...q.correct].sort().join(',')!==[...e.officialAnswer].sort().join(',')||
   !Array.isArray(q.options)||q.options.length!==5||
   !Array.isArray(e.options)||e.options.length!==5||
   e.options.some((opt,i)=>opt?.no!==i+1))return false;
  return ['draft','unstarted'].includes(e.quality?.status);
 };
 function tier(q,e){
  const special=q.correct.length!==1||e.specialAnswer!=='normal';
  const text=String(q.question||'');
  const law=LAW.test(text),calculation=CALC.test(text);
  return {tier:special?1:law?2:calculation?3:4,
   special,law,calculation};
 }
 function row(item){
  const q=item?.q,e=item?.entry;
  if(!matching(q,e))return null;
  const signals=tier(q,e);
  const reviewed=e.options.filter(v=>v.sourceChecked===true&&
   ['true','false','conditional'].includes(v.verdict)&&String(v.why||'').trim()).length;
  const reviewSource=Boolean(e.quality?.sourceChecked);
  return Object.freeze({id:q.id,year:q.year,subject:q.subject,number:q.number,
   answer:[...q.correct].sort((a,b)=>a-b).join('/'),...signals,
   reviewedOptions:reviewed,reasonReviewed:e.quality?.reasonReviewed===true&&reviewSource,
   sourceReviewed:reviewSource,quality:e.quality.status,
   question:q,explanation:e,sourceCandidateCount:Array.isArray(e.sourceRefs)?
    e.sourceRefs.filter(s=>s?.type==='studyReferenceCandidate').length:0});
 }
 function snapshot(items){
  if(!Array.isArray(items))return {ready:false,rows:[],errors:['문항 배열 없음'],totals:null};
  const candidates=items.filter(i=>i?.q?.year>=2021&&i?.q?.year<=2025);
  const selected=[],errors=[],used=new Set();
  for(const item of candidates){
   const record=row(item);
   if(!record){errors.push(item?.q?.id||'문항 ID 없음');continue;}
   if(used.has(record.id)){errors.push('중복 '+record.id);continue;}
   used.add(record.id);selected.push(record);
  }
  selected.sort((a,b)=>a.tier-b.tier||b.year-a.year||a.number-b.number);
  if(selected.length!==400||candidates.length!==400)
   errors.push('최근 5개년 전체 400문항 불일치 ('+selected.length+'/'+candidates.length+')');
  const distribution=Array.from({length:4},(_,i)=>selected.filter(r=>r.tier===i+1).length);
  const totals={total:selected.length, special:distribution[0],law:distribution[1],
   calculation:distribution[2],other:distribution[3],
   optionReviewed:selected.reduce((n,x)=>n+x.reviewedOptions,0),
   sourceReviewed:selected.filter(x=>x.sourceReviewed).length,
   reasonReviewed:selected.filter(x=>x.reasonReviewed).length,
   published:selected.filter(x=>x.quality==='published').length};
  return {ready:errors.length===0,rows:selected,errors,totals};
 }
 const csvValue=value=>{
  let s=String(value??'').replace(/[\r\n]+/g,' ');
  if(/^[\s\uFEFF\u200B]*[=+\-@]/.test(s))s="'"+s;
  return '"'+s.replace(/"/g,'""')+'"';
 };
 function csv(result){
  if(!result?.ready)return '';
  const headers=['문항ID','연도','과목','번호','원전검수우선순위','사전위험분류','특수정답','법령문구','계산문구',
   '공식인정정답','근거검수','선지출처검수수','미검수선지수','학습해설상태','자료후보건수',
   '문제원문전체',...Array.from({length:5},(_,i)=>'원문선지'+(i+1)),
   '시험지PDF참조URL','Q-Net문제지공고URL','학습용쉬운설명_미검수','학습용정답근거_미검수',
   '시험당시기준연도',...Array.from({length:5},(_,i)=>'선지'+(i+1)+'_출처검수표시'),
   ...Array.from({length:5},(_,i)=>'선지'+(i+1)+'_해설후보_미검수'),
   '검수자','검수일','시험당시법령판례검토','조문판례원문링크','선지별검수메모','공식게시가능여부'];
  const rows=result.rows.map(r=>[
   r.id,r.year,r.subject,r.number,r.tier,LABEL[r.tier],
   r.special?'Y':'N',r.law?'Y':'N',r.calculation?'Y':'N',r.answer,
   r.sourceReviewed?'Y':'N',r.reviewedOptions,5-r.reviewedOptions,r.quality,
   r.sourceCandidateCount,String(r.question.question||''),
   ...r.question.options.map(value=>String(value??'')),
   String(r.question.paperUrl||'미기재'),
   String(r.question.originalUrl||r.question.answerSourceUrl||'미기재'),
   String(r.explanation.summaryEasy||'미작성'),
   String(r.explanation.answerReason||'미작성'),
   String(r.explanation.examAsOf||r.year),
   ...r.explanation.options.map(opt=>
    opt.sourceChecked===true&&['true','false','conditional'].includes(opt.verdict)&&
     String(opt.why||'').trim()?'검수 표기 존재 (원전 별도 확인 필요)':'미검수'),
   ...r.explanation.options.map(opt=>String(opt.draftReason||'미작성')),
   '미작성','미작성','미확인','미확인','①~⑤ 각각 미확인','N'
  ]);
  return [headers,...rows].map(r=>r.map(csvValue).join(',')).join('\r\n')+'\r\n';
 }
 function packet(result,ids,max=5){
  if(!result?.ready||!Array.isArray(ids))return '';
  const byId=new Map(result.rows.map(x=>[x.id,x]));
  const seen=new Set(),chosen=[];
  for(const id of ids){
   if(!byId.has(id)||seen.has(id))continue;
   chosen.push(byId.get(id));seen.add(id);
   if(chosen.length>=Math.max(1,Math.min(5,Number(max)||5)))break;
  }
  if(!chosen.length)return '';
  const lines=['ConceptKnot · P4 전문가 원전 검수 준비 문서',
   '검수 상태: 미확인. 문제 원문·최종 인정정답과 학습용 해설 후보만 나란히 정리한 자료입니다.',
   '시험 시행 당시 법령/판례와 ①~⑤ 각각의 진위를 검토해야 합니다. 채점 인정정답이 곧 모든 선지의 참/거짓은 아닙니다.'];
  for(const r of chosen){
   const q=r.question,e=r.explanation;
   lines.push('','========== '+r.id+' · '+LABEL[r.tier]+' =========',
    q.year+'년 '+(q.subject==='estate'?'부동산학개론':'민법')+' '+q.number+'번',
    '원문: '+String(q.question||''),
    ...q.options.map((v,i)=>'선지 '+(i+1)+': '+v),
    '공식 최종 인정정답: '+r.answer+(r.special?' (특수 인정정답: 선지 참·거짓과 별도)':''),
    '문제지 원본 후보: '+String(q.paperUrl||'미기재'),
    '최종 정답 공고 후보: '+String(q.originalUrl||'미기재'),
    '학습용 쉬운 설명 후보 [원전 미검수]: '+String(e.summaryEasy||'미작성'),
    '학습용 해설 후보 [원전 미검수]: '+String(e.answerReason||'미작성'),
    ...e.options.map((v,i)=>'선지 '+(i+1)+' 검수 현재 상태: '+
      (v.sourceChecked===true&&['true','false','conditional'].includes(v.verdict)&&String(v.why||'').trim()?'검수 표시 존재 · 별도 원전 확인 필요':'미검수')+
      ' / 기존 작성 후보: '+String(v.draftReason||'없음')),
    '원전 근거 확인: [미확인] · 시험 당시 적용시점: [미확인]',
    '검수자: [미작성] · 선지별 출처 확인: [미확인] · 공식 게시 가능: [아니오]');
  }
  return lines.join('\n');
 }
 return Object.freeze({matching,tier,row,snapshot,csv,packet,LABEL});
});
