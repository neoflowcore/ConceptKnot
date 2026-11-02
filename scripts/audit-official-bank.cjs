/* ConceptKnot v99: read-only structural quality audit for official A-form papers.
 * Usage: node scripts/audit-official-bank.cjs [--json]
 * Does not update questions, answers, checked flags, backups or deployment.
 */
'use strict';
function auditOfficialBank(sources){
 const records=Array.isArray(sources)?sources.flatMap(x=>Array.isArray(x)?x:[]):[];
 const issues=[],seen=new Set(),years={};
 const stats={records:records.length,optionTexts:0,verifiedFlagged:0,
  visualReviewed:0,visualUnreviewed:0,visualUnknown:0,
  multipleAccepted:0,allAccepted:0,missingOriginalUrl:0,missingPaperUrl:0,
  lowTextSimilarity:0,missingTextSimilarity:0,acceptedTextMismatch:0,
  years,issues};
 const validId=id=>/^20(?:1[6-9]|2[0-5])-(?:[1-9]|[1-7]\d|80)$/.test(id);
 for(let year=2016;year<=2025;year++)years[year]={total:0,estate:0,civil:0,verified:0};
 for(const q of records){
  const id=q?.id;
  if(typeof id!=='string'||!validId(id)){issues.push('잘못된 문항 ID: '+String(id));continue;}
  if(seen.has(id))issues.push('중복 문항 ID: '+id);
  seen.add(id);
  const [year,num]=id.split('-').map(Number);
  const y=years[year];y.total++;
  const expectedSubject=num<=40?'estate':'civil';
  if(q.year!==year||q.number!==num||q.subject!==expectedSubject)
   issues.push('연도/문항번호/과목 오류: '+id);
  y[expectedSubject]++;
  if(q.verified===true){stats.verifiedFlagged++;y.verified++;}
  else issues.push('구조 확인 플래그 없음: '+id);
  if(typeof q.question!=='string'||!q.question.trim())issues.push('질문 비어 있음: '+id);
  if(!Array.isArray(q.options)||q.options.length!==5||
   q.options.some(option=>typeof option!=='string'||!option.trim()))
    issues.push('선지 5개 구조 오류: '+id);
  else stats.optionTexts+=q.options.length;
  if(!Array.isArray(q.correct)||!q.correct.length||q.correct.length>5||
   new Set(q.correct).size!==q.correct.length||
   q.correct.some(n=>!Number.isInteger(n)||n<1||n>5))
    issues.push('정답 인정 번호 오류: '+id);
  else{
   if(q.correct.length>1)stats.multipleAccepted++;
   if(q.correct.length===5)stats.allAccepted++;
  }
  const similarities=[q.checks?.primaryText?.score,q.checks?.primaryText?.ocrScore].filter(Number.isFinite);
  if(!similarities.length)stats.missingTextSimilarity++;
  else if(Math.min(...similarities)<0.9)stats.lowTextSimilarity++;
  if(Array.isArray(q.acceptedText)&&q.acceptedText.length&&Array.isArray(q.correct)&&Array.isArray(q.options)){
   const selected=q.correct.map(n=>q.options[n-1]);
   if(selected.length!==q.acceptedText.length||
    selected.some((text,i)=>String(text||'').trim()!==String(q.acceptedText[i]||'').trim()))
    stats.acceptedTextMismatch++;
  }
  if(q.checks?.visualReview===true)stats.visualReviewed++;
  else if(q.checks?.visualReview===false)stats.visualUnreviewed++;
  else stats.visualUnknown++;
  if(typeof q.originalUrl!=='string'||!q.originalUrl)stats.missingOriginalUrl++;
  if(typeof q.paperUrl!=='string'||!q.paperUrl)stats.missingPaperUrl++;
 }
 for(let year=2016;year<=2025;year++){
  for(let num=1;num<=80;num++)if(!seen.has(year+'-'+num))issues.push('누락 문항: '+year+'-'+num);
  if(years[year].total!==80||years[year].estate!==40||years[year].civil!==40)
   issues.push('연도별 40+40 구조 불일치: '+year);
 }
 return stats;
}
module.exports={auditOfficialBank};
if(require.main===module){
 const fs=require('node:fs'),path=require('node:path');
 const base=path.resolve(__dirname,'..');
 const items=['data/official-2016-2020.json','data/official-2021-2025.json']
  .map(p=>JSON.parse(fs.readFileSync(path.join(base,p),'utf8')));
 const report=auditOfficialBank(items);
 if(process.argv.includes('--json'))process.stdout.write(JSON.stringify(report,null,2)+'\n');
 else{
  process.stdout.write('ConceptKnot 공식 기출 구조 감사 (법령/원문 내용 감수 아님)\n');
  for(const [k,v] of Object.entries(report))if(k!=='issues'&&k!=='years')process.stdout.write(k+': '+v+'\n');
  process.stdout.write('구조 오류: '+report.issues.length+'건\n');
  if(report.issues.length)process.stdout.write(report.issues.slice(0,30).join('\n')+'\n');
 }
 if(report.issues.length)process.exitCode=1;
}
