/* ConceptKnot P4 v154: read-only audit of recent five-year explanation readiness.
 * These guards verify canonical A-form answer binding and draft metadata only.
 * NEVER classify an assistant draft as expert-reviewed or officially published.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const {auditExplanations}=require('./audit-explanation-readiness.cjs');
const ROOT=path.resolve(__dirname,'..'),read=f=>JSON.parse(fs.readFileSync(path.join(ROOT,f),'utf8'));
const YEARS=[2021,2022,2023,2024,2025],EXPECTED=Object.freeze({
 2021:{estate:40,civil:40},2022:{estate:40,civil:40},
 2023:{estate:40,civil:40},2024:{estate:40,civil:40},
 2025:{estate:40,civil:40}});
function evaluate(){
 const questions=read('data/official-2021-2025.json');
 const bundles=Object.fromEntries(YEARS.map(y=>[y,read('data/explanations/official-'+y+'.json')]));
 const base=auditExplanations(bundles,questions);
 const all=YEARS.flatMap(y=>bundles[y].records);
 const questionMap=new Map(questions.map(q=>[q.id,q]));
 const counts={total:all.length,draft:0,unstarted:0,sourceChecked:0,reasonReviewed:0,published:0,
  optionsTotal:0,optionDraftNotes:0,optionVerified:0,answerKeyMatches:base.verifiedAnswerMatches,
  byYearSubject:{}};
 const risks={law:0,numerical:0,special:0,missingPrimaryReasonSource:0,missingDraft:0};
 const special=[],issues=[...base.issues],queue=[];
 for(const rec of all){
  const q=questionMap.get(rec.questionId),year=rec.examYear,subject=rec.subject;
  const key=year+'-'+subject,quality=rec.quality||{};
  if(!counts.byYearSubject[key])counts.byYearSubject[key]={draft:0,unstarted:0,verified:0,published:0};
  if(!q||q.year!==year||q.subject!==subject||q.number!==rec.number||
    JSON.stringify([...q.correct].sort())!==JSON.stringify([...rec.officialAnswer].sort())){
   issues.push('canonical question/answer mismatch: '+rec.questionId);continue;
  }
  counts[quality.status]=(counts[quality.status]||0)+1;
  counts.byYearSubject[key][quality.status]=(counts.byYearSubject[key][quality.status]||0)+1;
  if(quality.reasonReviewed===true)counts.reasonReviewed++;
  if(quality.sourceChecked===true)counts.sourceChecked++;
  if(quality.status==='draft'&&(!rec.answerReason?.trim()||!rec.summaryEasy?.trim()))
   issues.push('empty substantive draft: '+rec.questionId);
  if(quality.status==='unstarted'&&(rec.answerReason?.trim()||rec.summaryEasy?.trim()))
   issues.push('unstarted already has explanation: '+rec.questionId);
  let notes=0;
  for(const [i,opt] of (rec.options||[]).entries()){
   counts.optionsTotal++;
   if(opt.no!==i+1||!q.options[i])issues.push('option source mismatch '+rec.questionId);
   if(opt.draftReason?.trim()){counts.optionDraftNotes++;notes++;}
   if(opt.verdict!=='unreviewed'||opt.sourceChecked===true||opt.why?.trim())
    counts.optionVerified++;
  }
  const flags=[];
  if(rec.specialAnswer!=='normal'||q.correct.length>1){
   risks.special++;flags.push('special-answer');
   special.push({id:rec.questionId,acceptedAnswers:q.correct,kind:rec.specialAnswer});
   if(!rec.answerReason?.includes('정답')&&quality.status==='draft')
    issues.push('special-answer draft missing scoring disclaimer '+rec.questionId);
  }
  if(/(?:법령|법률|민법|시행령|규칙|판례|대법원|조문)/.test(q.question||'')){
   risks.law++;flags.push('as-of-law');
  }
  if(/(?:계산|금액|산정|환원율|탄력성|원리금|수익률|가치|몇\s*개|얼마|지수)/.test(q.question||'')){
   risks.numerical++;flags.push('calculation-or-measure');
  }
  if(!rec.sourceRefs?.some(x=>x.verified===true&&x.type!=='officialNotice')){
   risks.missingPrimaryReasonSource++;flags.push('no-verified-explanation-source');
  }
  if(quality.status==='unstarted'){risks.missingDraft++;flags.push('needs-draft');}
  if(quality.status==='unstarted'||flags.includes('special-answer')||flags.includes('as-of-law'))
   queue.push({id:rec.questionId,year,subject,status:quality.status,flags,sourceCandidates:rec.sourceRefs?.filter(x=>x.type==='studyReferenceCandidate')?.length||0,
    optionDraftNotes:notes,acceptedAnswers:q.correct});
 }
 for(const y of YEARS)for(const subject of ['estate','civil']){
  const k=y+'-'+subject,n=EXPECTED[y][subject],row=counts.byYearSubject[k]||{};
  if(row.draft!==n||row.unstarted!==40-n)issues.push('coverage target differs: '+k);
 }
 if(counts.total!==400||counts.draft!==400||counts.unstarted!==0||
    counts.optionsTotal!==2000||counts.optionDraftNotes!==664||counts.answerKeyMatches!==400)
  issues.push('v154 data-count mismatch '+JSON.stringify(counts));
 if(counts.sourceChecked!==0||counts.reasonReviewed!==0||counts.published!==0||
    counts.optionVerified!==0||base.readyForPublication!==0||base.unverifiedPublicationClaims!==0)
  issues.push('unexpected review or publication claim');
 if(special.length!==7)issues.push('special answer count unexpected '+special.length);
 queue.sort((a,b)=>Number(b.flags.includes('special-answer'))-Number(a.flags.includes('special-answer'))||
  Number(b.flags.includes('as-of-law'))-Number(a.flags.includes('as-of-law'))||
  Number(b.flags.includes('needs-draft'))-Number(a.flags.includes('needs-draft'))||
  b.year-a.year||a.id.localeCompare(b.id));
 return {counts,risks,special,issues,queue:queue.slice(0,30),priorityQueueTotal:queue.length,
  notice:'Assistant-authored educational drafts; no independent human expert or effective-date law/precedent sign-off. Official answers are protected separately.'};
}
if(require.main===module){
 const r=evaluate();
 if(process.argv.includes('--json'))console.log(JSON.stringify(r,null,2));
 else console.log('ConceptKnot v154 P4 draft coverage (not reviewed):',JSON.stringify(r.counts),'\\nissues',r.issues.length,
  '\\npriority sample:',r.queue.map(q=>q.id).join(','));
 if(r.issues.length)process.exitCode=1;
}
module.exports={evaluate,EXPECTED};
