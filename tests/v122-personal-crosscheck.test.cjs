/* ConceptKnot v122 personal evidence reconciliation — manually run:
 * node --test tests/v122-personal-crosscheck.test.cjs
 * Personal opinions are NOT independently verified legal explanations.
 */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const source=read('assets/ck-data-diagnostics-v88.js');
const start=source.indexOf('function crossEvidenceAudit(');
const end=source.indexOf('function crossRows(',start);
assert.ok(start>0&&end>start,'v122 cross-audit must be present');
const cross=new Function('window',
 'const textPresent=x=>typeof x==="string"&&Boolean(x.trim());'+
 source.slice(start,end)+'return crossEvidenceAudit;')({});
function official(){
 const rows=new Map();
 for(let y=2016;y<=2025;y++)for(let n=1;n<=80;n++){
  const id=y+'-'+n;
  rows.set(id,{id,year:y,number:n,verified:true,
   subject:n<=40?'estate':'civil',question:'모의 원문',options:['A','B','C','D','E'],
   correct:y===2016&&n===1?[1,2,3,4,5]:y===2025&&n===2?[1,3]:[1]});
 }
 return Object.fromEntries(rows);
}
test('valid v112-era 2016-2020 drafts accepted by read-only diagnostics',()=>{
 assert.match(source,/Object\.entries\(data\)\.length<=800/);
 assert.match(source,/20\(\?:1\[6-9\]\|2\[0-5\]\)/);
 assert.match(source,/CK86Integrity\.validateExtra\(key,raw\)/);
});
test('800 questions and 4000 options audited, with special answers NOT used as truth verdicts',()=>{
 const input=official(),copy=JSON.stringify(input);
 const result=cross(input,{},{});
 assert.equal(result.complete,true);assert.equal(result.totals.questions,800);
 assert.equal(result.totals.options,4000);assert.equal(result.totals.missingQuestion,0);
 assert.equal(result.totals.allAccepted,1);assert.equal(result.totals.multipleAccepted,1);
 assert.equal(result.totals.neitherSource,4000);assert.equal(result.years.length,10);
 assert.equal(result.rows.length,800);assert.equal(JSON.stringify(input),copy);
});
test('two independent option stores, conflicting verdicts and different citations',()=>{
 const bank=official();
 const links={'2016-1':{optionNotes:{
  1:{assessment:'true',reason:'이유 A',source:'출처 A'},
  2:{assessment:'false',reason:'이유 B',source:'출처 B'}
 }}};
 const drafts={'2016-1':{options:[
  {no:1,verdict:'false',why:'이유 C',source:'출처 A'},
  {no:2,verdict:'false',why:'이유 D',source:'출처 D'},
  {no:3,verdict:'unreviewed',why:'',source:''},
  {no:4,verdict:'unreviewed',why:'',source:''},
  {no:5,verdict:'unreviewed',why:'',source:''}
 ]}};
 const before=[JSON.stringify(links),JSON.stringify(drafts)];
 const result=cross(bank,links,drafts);
 assert.equal(result.totals.verdictConflicts,1);
 assert.equal(result.totals.sourceDifferences,1);
 assert.equal(result.totals.ck83Sources,2);assert.equal(result.totals.ck80Sources,2);
 assert.equal(result.totals.neitherSource,3998);
 assert.equal(result.totals.personalReady,0);
 assert.equal(result.years[0].verdictConflicts,1);
 assert.deepEqual([JSON.stringify(links),JSON.stringify(drafts)],before);
});
test('missing canonical record prevents complete report, never silently becomes an official claim',()=>{
 const bank=official();delete bank['2020-80'];
 const result=cross(bank,{},{});
 assert.equal(result.complete,false);assert.equal(result.totals.missingQuestion,1);
 assert.equal(result.totals.options,3995);
});
test('the UI is explicit-click, no writes, CSV hardened and diagnostic backup fail closed',()=>{
 assert.match(source,/data-v122-run>저장된 개인 근거 교차 검사/);
 assert.match(source,/data-v122-export disabled>800문항 점검 CSV/);
 assert.match(source,/if\(ls\.unsavedEdits\|\|editor\.hasUnsavedChanges/);
 assert.match(source,/function invalidateCrossAudit/);
 assert.match(source,/function makeCrossCsv/);
 assert.match(source,/header\.map\(csvCell\)/);
 assert.match(source,/read-only cross review/);
 assert.match(source,/captureConsistency:'double-read'/);
 assert.doesNotMatch(source,/data\.records\[key\]=null/);
 const sw=read('sw.js');
 assert.match(sw,/const CACHE='conceptknot-study-v\d+-/);
 assert.match(sw,/ignoreSearch:true/);
 assert.match(sw,/ck-data-diagnostics-v88\.js\?v=122/);
 const config=JSON.parse(read('vercel.json'));
 assert.equal(config.git.deploymentEnabled,false);
 assert.equal(fs.existsSync(path.join(__dirname,'..','.github','workflows')),false);
});
