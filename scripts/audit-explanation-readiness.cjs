/* ConceptKnot v100: read-only audit for 2021-2025 explanation records.
 * Run: node scripts/audit-explanation-readiness.cjs [--json]
 * Does NOT promote draft claims or edit official question keys.
 */
'use strict';
const YEARS=[2021,2022,2023,2024,2025];
const same=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&
 a.length===b.length&&a.slice().sort((x,y)=>x-y).every((x,i)=>x===b.slice().sort((y,z)=>y-z)[i]);
function auditExplanations(bundles,bankRows){
 const questions=new Map((Array.isArray(bankRows)?bankRows:[]).map(q=>[q.id,q]));
 const summary={total:0,yearCounts:{},unstarted:0,draft:0,otherStatus:0,
  summariesPresent:0,reasonsPresent:0,reasonReviewed:0,
  optionReviewed:0,optionUnreviewed:0,sourceChecked:0,
  readyForPublication:0,unverifiedPublicationClaims:0,
  specialAnswerCount:0,verifiedAnswerMatches:0,
  recordsWithMissingEvidence:0,issues:[]};
 const seen=new Set();
 for(const year of YEARS){
  const bundle=bundles?.[year],records=bundle?.records;
  if(!bundle||Number(bundle.year)!==year||!Array.isArray(records)){
   summary.issues.push('연도 파일 누락 또는 구조 오류: '+year);continue;
  }
  summary.yearCounts[year]=records.length;
  if(records.length!==80)summary.issues.push(year+'년 해설 문항 수 '+records.length+' (80 필요)');
  if(bundle.originalAnswersProtected!==true)
   summary.issues.push(year+'년 공식 정답 보호 플래그 누락');
  for(const r of records){
   const id=r?.questionId,number=r?.number,q=questions.get(id);
   if(!/^202[1-5]-(?:[1-9]|[1-7]\d|80)$/.test(String(id||''))||
      !q||r.examYear!==year||q.year!==year||r.number!==q.number||r.subject!==q.subject){
    summary.issues.push('해설 문항 ID/과목/원문 연결 오류: '+id);continue;
   }
   if(seen.has(id))summary.issues.push('해설 중복: '+id);
   seen.add(id);summary.total++;
   if(same(r.officialAnswer,q.correct))summary.verifiedAnswerMatches++;
   else summary.issues.push('공식 최종답안 불일치: '+id);
   if(!Array.isArray(r.options)||r.options.length!==5||
      r.options.some((x,i)=>x?.no!==i+1))summary.issues.push('해설 선지 구조 오류: '+id);
   const qa=r.quality||{};
   if(qa.status==='unstarted')summary.unstarted++;
   else if(qa.status==='draft')summary.draft++;
   else summary.otherStatus++;
   if(typeof r.summaryEasy==='string'&&r.summaryEasy.trim())summary.summariesPresent++;
   if(typeof r.answerReason==='string'&&r.answerReason.trim())summary.reasonsPresent++;
   if(qa.reasonReviewed===true)summary.reasonReviewed++;
   if(qa.sourceChecked===true)summary.sourceChecked++;
   let reviewed=0,unreviewed=0;
   for(const option of Array.isArray(r.options)?r.options:[]){
    if(option?.verdict==='unreviewed')unreviewed++;
    else if(['true','false','conditional'].includes(option?.verdict)&&
      option?.sourceChecked===true&&String(option?.why||'').trim())reviewed++;
   }
   summary.optionReviewed+=reviewed;summary.optionUnreviewed+=unreviewed;
   const refs=Array.isArray(r.sourceRefs)?r.sourceRefs:[];
   if(!refs.some(x=>typeof x?.url==='string'&&x.url.startsWith('https://')))
    summary.recordsWithMissingEvidence++;
   if(r.specialAnswer&&r.specialAnswer!=='normal')summary.specialAnswerCount++;
   const evidence=qa.reasonReviewed===true&&qa.sourceChecked===true&&
    qa.optionVerdictsReviewed===5&&reviewed===5&&
    !!String(r.answerReason||'').trim()&&refs.some(x=>x?.verified===true);
   if(evidence)summary.readyForPublication++;
   if((qa.status==='verified'||qa.status==='published')&&!evidence)
    summary.unverifiedPublicationClaims++;
  }
 }
 for(const year of YEARS)for(let num=1;num<=80;num++){
  const id=year+'-'+num;if(!seen.has(id))summary.issues.push('해설 미등록: '+id);
 }
 return summary;
}
module.exports={auditExplanations};
if(require.main===module){
 const fs=require('node:fs'),path=require('node:path'),base=path.resolve(__dirname,'..');
 const bank=JSON.parse(fs.readFileSync(path.join(base,'data/official-2021-2025.json'),'utf8'));
 const bundles={};
 for(const y of YEARS)bundles[y]=JSON.parse(fs.readFileSync(
  path.join(base,'data/explanations/official-'+y+'.json'),'utf8'));
 const result=auditExplanations(bundles,bank);
 if(process.argv.includes('--json'))process.stdout.write(JSON.stringify(result,null,2)+'\n');
 else{
  process.stdout.write('ConceptKnot 해설 데이터 준비도 감사 · 내용/법령 실제 감수 아님\n');
  for(const [key,val] of Object.entries(result))if(key!=='issues')process.stdout.write(
   key+': '+(typeof val==='object'?JSON.stringify(val):val)+'\n');
  if(result.issues.length)process.stdout.write('구조 오류 '+result.issues.length+'건\n'+result.issues.slice(0,30).join('\n')+'\n');
 }
 if(result.issues.length||result.unverifiedPublicationClaims)process.exitCode=1;
}
