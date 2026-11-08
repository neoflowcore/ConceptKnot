/* ConceptKnot v142: read-only official question / concept evidence gates.
 * Never auto-upgrade keyword matches, answer keys, or legal explanations.
 * Usage: node scripts/audit-p6b-source-gates-v142.cjs [--topic market|rent|arc|budget|ppf|cost|cobweb] [--candidates] [--limit 20] [--json]
 */
'use strict';
const TAGS=Object.freeze({
 market:['estate.land.demand','estate.land.supply','estate.supply-demand.simultaneous'],
 elasticity:['estate.elasticity.demand'],
 arc:['estate.elasticity.demand'],
 rent:['estate.rent','estate.location'],
 budget:[],ppf:[],cost:[],cobweb:[]
});
function audit(input,topic='market',showCandidates=false,limit=20){
 if(!Object.hasOwn(TAGS,topic))throw Error('Unknown economic concept');
 if(!input||!Array.isArray(input.occurrences)||!Array.isArray(input.bank)||
   !Array.isArray(input.taxonomy))throw Error('Missing official input');
 const ids=new Set(TAGS[topic]),bank=new Map(input.bank.map(q=>[q.id,q])),
  taxonomy=new Map(input.taxonomy.map(x=>[x.id,x]));
 if(bank.size!==input.bank.length)throw Error('Duplicate official question ID');
 const seen=new Set(),approved=[],candidates=[],unreviewed=[];
 for(const row of input.occurrences){
  if(!row||typeof row.questionId!=='string'||seen.has(row.questionId))
   throw Error('Duplicate/invalid concept occurrence');
  seen.add(row.questionId);
  const q=bank.get(row.questionId);
  if(!q||q.verified!==true||q.subject!=='estate'||
    row.examYear!==q.year||q.id!==row.questionId)continue;
  const verifiedIds=(row.coreConceptIds||[]).filter(id=>ids.has(id));
  const approvedTag=verifiedIds.filter(id=>taxonomy.get(id)?.reviewStatus==='verified');
  const verified=row.verificationStatus==='verified'&&Array.isArray(row.evidenceIds)&&
    row.evidenceIds.length>0&&approvedTag.length>0;
  if(verified){
   approved.push({id:q.id,year:q.year,number:q.number,
    conceptIds:approvedTag,evidenceIds:row.evidenceIds});continue;
  }
  if(row.verificationStatus!=='verified')unreviewed.push(row.questionId);
  if(showCandidates&&Array.isArray(row.candidateConceptIds)&&
    row.candidateConceptIds.some(id=>ids.has(id))){
   candidates.push({id:q.id,year:q.year,number:q.number,
    candidateConceptIds:row.candidateConceptIds.filter(id=>ids.has(id)),status:'UNREVIEWED_CANDIDATE'});
  }
 }
 const result={
  topic,officialQuestions:input.bank.length,occurrenceRows:input.occurrences.length,
  matchedCandidateTags:candidates.length,unreviewedRows:unreviewed.length,
  approvedLinks:approved.length,canPublish:approved.length>0,
  warning:'후보 태그는 공식 기출 연계·전문가 감수 완료의 근거가 아닙니다.',
  approved:approved.slice(0,limit),candidates:candidates.slice(0,limit)
 };
 return result;
}
module.exports={audit,TAGS};
if(require.main===module){
 const fs=require('node:fs'),path=require('node:path');
 const arg=process.argv.slice(2),get=name=>{
  const i=arg.indexOf(name);return i<0?null:arg[i+1];
 };
 const topic=get('--topic')||'market',n=Number(get('--limit')||20);
 if(!Number.isInteger(n)||n<1||n>200)throw Error('Limit must be 1..200');
 const base=path.resolve(__dirname,'..'),read=p=>JSON.parse(fs.readFileSync(path.join(base,p),'utf8'));
 const bank=[...read('data/official-2016-2020.json'),...read('data/official-2021-2025.json')];
 const report=audit({bank,
  occurrences:read('data/concept-occurrences-v1.json').occurrences,
  taxonomy:read('data/concept-taxonomy-v1.json').concepts},
  topic,arg.includes('--candidates'),n);
 if(arg.includes('--json'))process.stdout.write(JSON.stringify(report,null,2)+'\n');
 else{
  process.stdout.write('ConceptKnot P6-B source gate: '+topic+'\n');
  process.stdout.write('기출 등록 '+report.officialQuestions+
   ' · 연결 검토 '+report.occurrenceRows+' · 검증 링크 '+report.approvedLinks+'\n');
  process.stdout.write(report.warning+'\n');
  for(const x of report.approved)process.stdout.write('검증 '+x.id+' : '+x.conceptIds.join(', ')+'\n');
  for(const x of report.candidates)process.stdout.write('미검수 후보 '+x.id+' : '+x.candidateConceptIds.join(', ')+'\n');
 }
}