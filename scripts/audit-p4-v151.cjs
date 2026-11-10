/* ConceptKnot P4 v151 — offline draft provenance and review gates.
 * Safe read-only audit; never promotes source verification or expert approval.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const {auditExplanations}=require('./audit-explanation-readiness.cjs');
const root=path.resolve(__dirname,'..'),read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));
const years=[2021,2022,2023,2024,2025];
function evaluate(){
 const questions=read('data/official-2021-2025.json');
 const bundle=Object.fromEntries(years.map(y=>[y,read('data/explanations/official-'+y+'.json')]));
 const source=auditExplanations(bundle,questions);
 const reasons=years.flatMap(y=>bundle[y].records);
 const counts={total:reasons.length,draft:0,unstarted:0,sourceChecked:0,reasonReviewed:0,
  published:0,optionsTotal:0,optionDraftNotes:0,optionVerified:0,
  '2024EstateDraft':0,'2025EstateDraft':0,answerKeyMatches:source.verifiedAnswerMatches};
 const risk={law:0,numerical:0,special:0,uncheckedPrimaryReference:0,blankExplanation:0};
 const issues=[...source.issues],next=[];
 const bank=new Map(questions.map(q=>[q.id,q]));
 for(const rec of reasons){
  const q=bank.get(rec.questionId),quality=rec.quality||{};
  if(!q||JSON.stringify(rec.officialAnswer.map(Number).sort())!==JSON.stringify(q.correct.map(Number).sort()))
   issues.push('answer mismatch '+rec.questionId);
  if(quality.status==='draft')counts.draft++;
  if(quality.status==='unstarted')counts.unstarted++;
  if(quality.status==='published')counts.published++;
  if(quality.sourceChecked===true)counts.sourceChecked++;
  if(quality.reasonReviewed===true)counts.reasonReviewed++;
  if(rec.examYear===2024&&rec.subject==='estate'&&quality.status==='draft')counts['2024EstateDraft']++;
  if(rec.examYear===2025&&rec.subject==='estate'&&quality.status==='draft')counts['2025EstateDraft']++;
  if(quality.status==='draft'&&(!rec.answerReason?.trim()||!rec.summaryEasy?.trim()))
   issues.push('empty substantive draft '+rec.questionId);
  if(quality.status==='unstarted'&&(rec.answerReason?.trim()||rec.summaryEasy?.trim()))
   issues.push('unstarted with filled content '+rec.questionId);
  if(!Array.isArray(rec.options)||rec.options.length!==5)issues.push('bad option count '+rec.questionId);
  for(const o of rec.options||[]){
   counts.optionsTotal++;
   if(o.draftReason?.trim())counts.optionDraftNotes++;
   if(o.verdict!=='unreviewed'||o.sourceChecked===true||o.why?.trim())
    counts.optionVerified++;
  }
  const flags=[];
  if(rec.specialAnswer!=='normal'){risk.special++;flags.push('special-answer');}
  if(/(?:법령|법률|민법|시행령|규칙|판례|대법원|조문)/.test(q?.question||'')){
   risk.law++;flags.push('as-of-law');
  }
  if(/(?:계산|금액|산정|환원율|탄력성|원리금|수익률|가치|몇\s*개|몇\s*명|얼마|지수)/.test(q?.question||'')){
   risk.numerical++;flags.push('calculation-or-measure');
  }
  if(!rec.sourceRefs?.some(x=>x.verified&&x.type!=='officialNotice')){
   risk.uncheckedPrimaryReference++;flags.push('no-verified-legal-basis');
  }
  if(quality.status==='unstarted'){risk.blankExplanation++;flags.push('needs-draft');}
  if(rec.specialAnswer!=='normal'||quality.status==='unstarted')
   next.push({id:rec.questionId,subject:rec.subject,status:quality.status,flags,
    officialAnswers:rec.officialAnswer});
 }
 if(counts.total!==400||counts.draft!==80||counts.unstarted!==320||counts.optionsTotal!==2000||
    counts.optionDraftNotes!==172||counts['2024EstateDraft']!==40||counts['2025EstateDraft']!==40)
  issues.push('v151 count mismatch '+JSON.stringify(counts));
 if(counts.sourceChecked!==0||counts.reasonReviewed!==0||counts.published!==0||counts.optionVerified!==0)
  issues.push('unapproved expert/published status detected');
 if(source.unverifiedPublicationClaims)issues.push('false approval flags: '+source.unverifiedPublicationClaims);
 next.sort((a,b)=>Number(b.flags.includes('special-answer'))-Number(a.flags.includes('special-answer'))||
  Number(b.flags.includes('as-of-law'))-Number(a.flags.includes('as-of-law'))||
  Number(b.flags.includes('needs-draft'))-Number(a.flags.includes('needs-draft'))||
  b.id.localeCompare(a.id));
 return {counts,risk,issues,needsReview:next.length,queue:next.slice(0,20),
  label:'AI 학습용 초안의 구조·채점키 보호 검사이며 법령/판례 전문가 감수가 아닙니다.'};
}
if(require.main===module){
 const result=evaluate(),json=process.argv.includes('--json');
 if(json)console.log(JSON.stringify(result,null,2));
 else console.log('P4 review gate:',JSON.stringify(result.counts),'source issues:',result.issues.length,
  '\\nPriority review queue (first 20):',result.queue.map(x=>x.id).join(', '));
 if(result.issues.length)process.exitCode=1;
}
module.exports={evaluate};
