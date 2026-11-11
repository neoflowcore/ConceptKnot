/* ConceptKnot v160 — independent option-by-option pre-review (400 x 5).
 * This module NEVER certifies expert source review or proves a choice true/false.
 * Official answer numbers are grading metadata, not a substitute for evidence.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.CK160OptionAudit=api;
})(typeof window==='object'?window:null,function(){
 'use strict';
 const validOption=n=>Number.isInteger(n)&&n>=1&&n<=5;
 const LAW=/법령|법률|법|민법|시행령|규칙|판례|대법원|조문|계약|등기|물권|채권|상속|점유|임대차|취득시효|하자|해제|해지/;
 const CALC=/계산|금액|산정|환원율|탄력성|원리금|수익률|가치|할인|평균|분산|이자|공급량|수요량|몇\s*개|얼마|지수|비율|%|원\/|원\b/;
 const VISUAL=/그림|그래프|표\b|도표|곡선|도식|지도/;
 const COMPOUND=/ㄱ[.,ㆍ\s]|ㄴ[.,ㆍ\s]|ㄷ[.,ㆍ\s]|ㄹ[.,ㆍ\s]/;
 const safeUrl=u=>typeof u==='string'&&/^https:\/\/[a-z0-9.-]+(?:[/?#]|$)/i.test(u)&&!/@/.test(u.split('/')[2]||'')?u:'';
 /* Checked against Q-Net official "최종정답" notices (2021..2025).
  * The official PDF body and option-by-option legal rationale are NOT automatically verified.
  */
 const FINAL_NOTICES=Object.freeze({
  2021:'https://www.q-net.or.kr/cst003.do?artlSeq=5209538&boardId=Q004&gId=08&gSite=L&id=cst00302&menuType=cst00310',
  2022:'https://www.q-net.or.kr/cst003.do?artlSeq=5211208&boardId=Q004&gId=08&gSite=L&id=cst00302&menuType=cst00310',
  2023:'https://www.q-net.or.kr/cst003.do?artlSeq=5212816&boardId=Q004&gId=08&gSite=L&id=cst00302&menuType=cst00310',
  2024:'https://www.q-net.or.kr/cst003.do?artlSeq=5218527&boardId=Q004&gId=08&gSite=L&id=cst00302&menuType=cst00310',
  2025:'https://www.q-net.or.kr/cst003.do?artlSeq=5249925&boardId=Q004&gId=08&gSite=L&id=cst00302&menuType=cst00310'
 });
 const finalAnswerNotice=year=>FINAL_NOTICES[year]||'';
 const sameKey=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.length>0&&
  [...a].sort((x,y)=>x-y).every((n,i)=>validOption(n)&&n===[...b].sort((x,y)=>x-y)[i]);
 function integrity(item){
  const q=item?.q,e=item?.entry;
  if(!q||!e||q.verified!==true||!Number.isInteger(q.year)||q.year<2021||q.year>2025||
   !Number.isInteger(q.number)||q.number<1||q.number>80||
   q.id!==q.year+'-'+q.number||e.questionId!==q.id||
   e.examYear!==q.year||e.number!==q.number||e.subject!==q.subject||
   !['estate','civil'].includes(q.subject)||!sameKey(q.correct,e.officialAnswer)||
   !Array.isArray(q.options)||q.options.length!==5||
   q.options.some(opt=>typeof opt!=='string'||!opt.trim())||
   !Array.isArray(e.options)||e.options.length!==5||e.options.some((opt,i)=>opt?.no!==i+1)||
   !['draft','unstarted'].includes(e.quality?.status))return false;
  return true;
 }
 function questionIntent(q){
  const t=String(q.question||'');
  if(/옳지[\s\n]*않|틀린|잘못된|타당하지[\s\n]*않|해당하지[\s\n]*않|아닌\s*(?:것|경우)/.test(t))return '부정형';
  if(/옳은|맞는|타당한|해당하는\s*것|모두\s*고른|적절한/.test(t))return '긍정형';
  if(/계산|금액|산출|구하|값은/.test(t))return '계산형';
  return '원전 해석형';
 }
 function categories(q,text){
  const all=String(q.question||'')+' '+String(text||'');
  const law=q.subject==='civil'||LAW.test(all),calc=CALC.test(all),visual=VISUAL.test(all)||Boolean(q.diagrams?.length),
   compound=COMPOUND.test(all);
  return {law,calc,visual,compound};
 }
 function guidance(q,opt,meta){
  const flags=[];
  if(meta.special)flags.push('복수·전원정답: 인정번호와 선지진위 분리');
  if(meta.law)flags.push(q.year+'년 시험 시행 당시 법령·판례·예외 대조');
  if(meta.calc)flags.push('수식·단위·부호·반올림 재계산');
  if(meta.visual)flags.push('원본 도표·표·그림 대조');
  if(meta.compound)flags.push('ㄱ·ㄴ·ㄷ 등 각 진술과 조합 분리');
  if(meta.intent==='부정형')flags.push('틀린 선지를 고르는 부정형 발문');
  if(!flags.length)flags.push('개념 정의·반례·기출 연도 기준 확인');
  return flags;
 }
 function optionItem(q,e,i){
  const option=e.options[i],idx=i+1,cats=categories(q,q.options[i]);
  const special=q.correct.length>1||e.specialAnswer!=='normal',accepted=q.correct.includes(idx);
  const meta={...cats,special,intent:questionIntent(q)},flags=guidance(q,option,meta);
  const draft=String(option.draftReason||'').trim();
  const selectedCandidate=accepted&&!draft?String(e.answerReason||'').trim():'';
  const checkSource=option.sourceChecked===true&&
   ['true','false','conditional'].includes(option.verdict)&&String(option.why||'').trim();
  return Object.freeze({
   id:q.id+'-O'+idx,questionId:q.id,year:q.year,number:q.number,subject:q.subject,
   index:idx,questionText:q.question,optionText:q.options[i],
   officialAccepted:accepted,officialAnswers:q.correct.join('/'),special,
   intent:meta.intent,flags,needsLawSource:meta.law,needsCalculation:meta.calc,needsOriginalVisual:meta.visual,
   needsCompoundSplit:meta.compound,sourceRefs:{
    paperNotice:safeUrl(q.originalUrl),paperMirror:safeUrl(q.paperUrl),
    finalAnswerNotice:safeUrl(finalAnswerNotice(q.year)),
    explanationCandidates:(Array.isArray(e.sourceRefs)?e.sourceRefs:[]).filter(x=>x&&safeUrl(x.url))
     .map(x=>({url:safeUrl(x.url),kind:String(x.type||''),verified:x.verified===true})).slice(0,8)
   },
   draftReason:draft||selectedCandidate,
   draftAvailable:Boolean(draft||selectedCandidate),
   sourceCheckMarked:Boolean(checkSource),
   verdict:checkSource?option.verdict:'unreviewed',
   contentReviewed:false, /* Cannot infer real expert examination from data alone. */
   signoffAllowed:false, /* Requires separate independently verified source/evidence/reviewer. */
   summary:accepted?'공식 채점상 인정 번호(선지의 참/거짓 자체는 별도 확인)':
    '공식 채점상 비인정 번호(선지의 참/거짓 자체는 별도 확인)',
   reviewTask:'선지 '+idx+'의 개별 주장, 단서·예외, 발문 방향, 출제 당시 원전 근거, 공식 인정정답을 서로 분리해 확인하세요.'
  });
 }
 function build(items){
  if(!Array.isArray(items))return {ready:false,errors:['문항 배열 없음'],questions:0,rows:[],stats:null};
  const rows=[],errors=[],seen=new Set(),years={};
  for(const item of items){
   if(!integrity(item)){errors.push('문항 또는 정답 불일치: '+String(item?.q?.id||'?'));continue;}
   const q=item.q,e=item.entry;
   if(seen.has(q.id)){errors.push('문항 ID 중복 '+q.id);continue;}
   seen.add(q.id);
   const year=years[q.year]||(years[q.year]={estate:0,civil:0});
   year[q.subject]++;
   for(let i=0;i<5;i++)rows.push(optionItem(q,e,i));
  }
  if(seen.size!==400||items.length!==400)
   errors.push('최근 5개년 400문항 불일치: '+seen.size+'/'+items.length);
  for(let y=2021;y<=2025;y++){
   if(years[y]?.estate!==40||years[y]?.civil!==40)
    errors.push(y+'년 학개론·민법 각 40문항 불일치');
  }
  if(rows.length!==2000||new Set(rows.map(r=>r.id)).size!==rows.length)
   errors.push('독립 검토 선지 2,000개 불일치: '+rows.length);
  const stats=Object.freeze({questions:seen.size,options:rows.length,
   paperNoticeLinks:rows.filter(r=>r.sourceRefs.paperNotice).length/5,
   paperMirrorLinks:rows.filter(r=>r.sourceRefs.paperMirror).length/5,
   finalAnswerLinks:rows.filter(r=>r.sourceRefs.finalAnswerNotice).length/5,
   optionsWithDraft:rows.filter(r=>r.draftAvailable).length,
   optionsWithoutDraft:rows.filter(r=>!r.draftAvailable).length,
   lawOptions:rows.filter(r=>r.needsLawSource).length,
   calculationOptions:rows.filter(r=>r.needsCalculation).length,
   visualOptions:rows.filter(r=>r.needsOriginalVisual).length,
   compoundOptions:rows.filter(r=>r.needsCompoundSplit).length,
   sourceCheckedFlags:rows.filter(r=>r.sourceCheckMarked).length,
   expertVerified:0,published:0});
  return {ready:errors.length===0,errors,questions:seen.size,rows,stats};
 }
 const csvCell=x=>{
  const t=String(x??'').replace(/[\r\n]+/g,' ');
  return '"'+(/^[\s\uFEFF\u200B]*[=+\-@]/.test(t)?"'"+t:t).replace(/"/g,'""')+'"';
 };
 function csv(a){
  if(!a?.ready)return '';
  const cols=['선지감사ID','문항ID','연도','과목','번호','선지번호','문제원문','선지원문','공식인정정답',
   '해당선지채점인정','특수정답','발문방향','검토위험요인','해설후보텍스트_미검수',
   '초안유무','사전원전표시','실제전문가검수','출제당시법령검토','QNet문제지게시글','시험지PDF참고복제본','QNet최종정답공고',
   '독립검수요청','독립판정','근거조문판례','적용기준일','검수자','검수일','게시가능'];
  return [cols,...a.rows.map(r=>[
   r.id,r.questionId,r.year,r.subject,r.number,r.index,r.questionText,r.optionText,
   r.officialAnswers,r.officialAccepted?'Y':'N',r.special?'Y':'N',r.intent,r.flags.join(' · '),
   r.draftReason||'미작성',r.draftAvailable?'Y':'N',
   r.sourceCheckMarked?'표시 존재(추가 대조 필요)':'N',
   'N',r.needsLawSource?'미확인':'비법령문항/불확실',r.sourceRefs.paperNotice||'미기재',
   r.sourceRefs.paperMirror||'미기재',
   r.sourceRefs.finalAnswerNotice||'미기재',r.reviewTask,
   '미검수','미확인','미확인','미작성','미작성','N'
  ])].map(row=>row.map(csvCell).join(',')).join('\r\n')+'\r\n';
 }
 function packet(a,ids,max=5){
  if(!a?.ready||!Array.isArray(ids))return '';
  const wanted=new Set(ids),list=a.rows.filter(r=>wanted.has(r.questionId));
  const selection=[...new Set(list.map(x=>x.questionId))].slice(0,Math.max(1,Math.min(5,Number(max)||5)));
  const out=['ConceptKnot P4 · 2,000선지 개별 원전 검토 준비',
   '공식 인정정답은 최종 채점 정보이고, 선지 진위·시험 당시 법령의 확인 완료를 의미하지 않습니다.',
   '아래 초안은 학습용이며 출처를 직접 대조하지 않은 선지는 절대 검수 완료가 아닙니다.'];
  for(const id of selection){
   const rows=a.rows.filter(r=>r.questionId===id);
   if(rows.length!==5)continue;
   out.push('','=== '+id+' / 공식 채점 인정: '+rows[0].officialAnswers+' ===',rows[0].questionText,
    'Q-Net 공식 문제지 게시글: '+(rows[0].sourceRefs.paperNotice||'미기재'),
    '시험지 PDF 참고복제본(공식 원본 아님): '+(rows[0].sourceRefs.paperMirror||'미기재'),
    '최종정답 공고: '+(rows[0].sourceRefs.finalAnswerNotice||'미기재'));
   for(const o of rows)out.push(
    '선지 '+o.index+' ['+(o.officialAccepted?'채점상 인정':'채점상 비인정')+'] '+o.optionText,
    '검토표시: '+o.flags.join(' · '),
    '기존 학습용 근거 초안: '+(o.draftReason||'미작성'),
    '원전 판정: 미검수 / 조문·판례: 미확인 / 검수자: 미작성');
  }
  return out.join('\n');
 }
 return Object.freeze({integrity,questionIntent,optionItem,build,csv,packet,csvCell,finalAnswerNotice});
});
