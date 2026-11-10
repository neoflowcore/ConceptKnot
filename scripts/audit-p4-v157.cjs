/* ConceptKnot P4 v157 — full 400-record human verification worksheet.
 * This is an audit only. Never changes an official answer, explanation,
 * option verdict or publication state. Flags are screening heuristics, not
 * a legal/academic source check or a verified conclusion.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const YEARS=[2021,2022,2023,2024,2025];
const law=/법령|법률|민법|시행령|규칙|판례|대법원|조문/;
const calc=/계산|금액|산정|환원율|탄력성|원리금|수익률|가치|몇\s*개|얼마|지수/;
function reviewRows(){
 const questions=read('data/official-2021-2025.json');
 const qMap=new Map(questions.map(q=>[q.id,q]));
 if(qMap.size!==400)throw Error('official recent-five record count changed');
 const rows=[];
 for(const year of YEARS){
  const data=read('data/explanations/official-'+year+'.json');
  if(!Array.isArray(data.records)||data.records.length!==80)
   throw Error('unexpected explanation records '+year);
  for(const item of data.records){
   const q=qMap.get(item.questionId);
   if(!q||!Array.isArray(q.correct)||!Array.isArray(item.officialAnswer)||
    q.subject!==item.subject||q.year!==year||q.number!==item.number||
    JSON.stringify([...q.correct].sort())!==JSON.stringify([...item.officialAnswer].sort()))
    throw Error('canonical mismatch: '+item.questionId);
   const text=String(q.question||'');
   const special=item.specialAnswer!=='normal'||q.correct.length>1;
   const hasLaw=law.test(text),calculation=calc.test(text);
   const verifiedSources=(item.sourceRefs||[]).filter(s=>s.verified===true&&s.type!=='officialNotice').length;
   const candidateSources=(item.sourceRefs||[]).filter(s=>s.type==='studyReferenceCandidate').length;
   const verifiedOptionVerdicts=(item.options||[]).filter(opt=>opt.sourceChecked===true&&opt.verdict!=='unreviewed').length;
   const draftOptionNotes=(item.options||[]).filter(opt=>opt.draftReason?.trim()).length;
   if(!Array.isArray(item.options)||item.options.length!==5)
    throw Error('option structure changed: '+item.questionId);
   const grade=item.quality?.status||'unstarted';
   if(!['unstarted','draft'].includes(grade))
    throw Error('unexpected human-published status: '+item.questionId);
   // Priority tiers are human work scheduling only, not legal judgments.
   const tier=special?1:hasLaw?2:calculation?3:4;
   rows.push({
    id:q.id,year,subject:q.subject,number:q.number,officialAnswer:q.correct.join('/'),
    special:special?'Y':'N',lawScreen:hasLaw?'Y':'N',calculationScreen:calculation?'Y':'N',
    candidateSources,verifiedSources,optionDraftNotes:draftOptionNotes,
    optionsReviewed:verifiedOptionVerdicts,qualityStatus:grade,
    priority:tier,sourceReview:item.quality?.sourceChecked===true?'Y':'N',
    publishEligible:'N',checklist:'원문·시험당시 적용법·판례·모든 선지별 출처·검수자·검수일 직접 확인'
   });
  }
 }
 if(rows.length!==400||new Set(rows.map(x=>x.id)).size!==400)
  throw Error('source-locked queue integrity check failed');
 rows.sort((a,b)=>a.priority-b.priority||b.year-a.year||a.number-b.number);
 return rows;
}
const keys=Object.freeze(['id','year','subject','number','officialAnswer','special',
 'lawScreen','calculationScreen','candidateSources','verifiedSources',
 'optionDraftNotes','optionsReviewed','qualityStatus','priority',
 'sourceReview','publishEligible','checklist']);
const cell=v=>{
 const text=String(v??'');
 const safe=/^[=+\-@\t\r]/.test(text)?"'"+text:text;
 return '"'+safe.replace(/"/g,'""')+'"';
};
function csv(rows=reviewRows()){
 return [keys.map(cell).join(','),...rows.map(row=>keys.map(k=>cell(row[k])).join(','))].join('\r\n')+'\r\n';
}
function summary(rows=reviewRows()){
 return {records:rows.length,tier1Special:rows.filter(r=>r.priority===1).length,
  tier2Law:rows.filter(r=>r.priority===2).length,
  tier3Calculation:rows.filter(r=>r.priority===3).length,
  tier4Other:rows.filter(r=>r.priority===4).length,
  lawScreenTotal:rows.filter(r=>r.lawScreen==='Y').length,
  calculationScreenTotal:rows.filter(r=>r.calculationScreen==='Y').length,
  expertSourceReviewed:rows.filter(r=>r.sourceReview==='Y').length,
  published:rows.filter(r=>r.publishEligible==='Y').length,
  notice:'이 표는 원전 검수 우선순위 초안입니다. 실제 학술·법리 검수로 간주하지 않습니다.'};
}
if(require.main===module){
 const rows=reviewRows();
 if(process.argv.includes('--csv'))process.stdout.write('\uFEFF'+csv(rows));
 else process.stdout.write(JSON.stringify(summary(rows),null,2)+'\n');
}
module.exports={reviewRows,csv,summary,keys};

