/* v163 source-locked 400-question study publication, 2000-option structural QA. */
'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const parse=p=>JSON.parse(read(p));
const Official=parse('data/official-2021-2025.json'),map=new Map(Official.map(q=>[q.id,q]));
const rows=[2021,2022,2023,2024,2025].flatMap(y=>parse('data/explanations/official-'+y+'.json').records).map(entry=>({q:map.get(entry.questionId),entry}));
const Study=require('../assets/ck-p4-public-study-v163.js');
const deps={optionAudit:require('../assets/ck-p4-option-audit-v160.js'),v161:require('../assets/ck-p4-substantive-v161.js'),v162:require('../assets/ck-p4-substantive-v162.js'),v164:require('../assets/ck-p4-substantive-v164.js')};
const make=x=>Study.build(x,deps),result=make(rows);
test('source-locked 400 question explanations and 2000 choices, five years times two subjects',()=>{
 A.equal(result.ready,true);A.equal(result.questions.length,400);A.equal(result.options.length,2000);
 A.equal(result.stats.structuralOptionsChecked,2000);
 A.equal(result.stats.baselineQuestionFingerprintsChecked,400);
 A.equal(result.stats.questionLevelStudyDrafts,400);
 for(const year of [2021,2022,2023,2024,2025])for(const subject of ['estate','civil'])
  A.equal(result.questions.filter(q=>q.year===year&&q.subject===subject).length,40);
});
test('tiers reflect independent sources and do not manufacture official reviews',()=>{
 A.equal(result.stats.aiOptionCandidates,400);
 A.equal(result.stats.existingOptionCandidates,332);
 A.equal(result.stats.answerContextOnly,166);
 A.equal(result.stats.optionsWithoutIndependentCandidate,1102);
 A.equal(result.stats.allCandidateCoverage,898);
 A.equal(result.stats.expertVerifiedQuestions,0);
 A.equal(result.stats.expertVerifiedOptions,0);
 A.equal(result.stats.officialExplanationsPublished,0);
 A.ok(result.options.every(r=>!r.sourceChecked&&!r.expertReviewed&&!r.officialPublished));
});
test('standalone study TXT includes all 400 original texts and Q-Net distinct notices',()=>{
 const out=Study.exportText(result);A.ok(out.length>350000);
 for(const q of result.questions){
  A.ok(out.includes('=== '+q.year+'년 '+q.number+'번'),q.id);
  A.ok(q.paperNotice.includes('menuType=cst00309'));A.ok(q.finalAnswerNotice.includes('menuType=cst00310'));
 }
 A.match(out,/Q-Net 인증 공식 해설이 아닙니다/);
 A.match(out,/자체 작성 미검수/);
});
test('missing record, stale key, empty own rationale, source swap, altered official ID fail closed',()=>{
 function changed(mutator){const items=structuredClone(rows);mutator(items);return make(items)}
 A.equal(changed(x=>{x[0].entry.officialAnswer=[5]}).ready,false);
 A.equal(changed(x=>{x[0].entry.summaryEasy=''}).ready,false);
 A.equal(changed(x=>{x[0].entry.answerReason=''}).ready,false);
 A.equal(changed(x=>{x[0].q.options[0]=''}).ready,false);
 A.equal(changed(x=>{x[0].q.options[0]+=' [changed]'}).ready,false);
 A.equal(changed(x=>{x[0].q.originalUrl='https://example.invalid/'}).ready,false);
 A.equal(changed(x=>{x[0].entry.quality.status='published'}).ready,false);
 A.equal(Study.exportText(changed(x=>x.pop())),'');
});
test('all changed P4 JS modules parse; previously broken 200-note TXT dispatch is wired',()=>{
 for(const file of ['assets/ck-p4-option-audit-ui-v160.js','assets/ck-study-workbench-v81.js',
  'assets/ck-p4-public-study-v163.js','assets/ck-data-diagnostics-v88.js','assets/ck-manual-qa-v115.js','sw.js']){
  A.doesNotThrow(()=>new vm.Script(read(file),{filename:file}),file);
 }
 const html=read('index.html'),work=read('assets/ck-study-workbench-v81.js'),ui=read('assets/ck-p4-option-audit-ui-v160.js');
 for(const k of ['ck-p4-public-study-v163.js?v=164','ck-p4-public-study-v163.css?v=163',
 'ck-p4-option-audit-ui-v160.js?v=164','ck-study-workbench-v81.js?v=163'])A.ok(html.includes(k),k);
 A.ok(html.indexOf('ck-p4-public-study-v163.js?v=164')<html.indexOf('ck-study-workbench-v81.js?v=163'));
 A.ok(work.includes('data-ck161-ai-txt'));A.ok(work.includes('data-ck163-export'));
 A.ok(work.includes('CK163PublicStudy?.panel?.(rows)'));
 A.ok(ui.includes("'자료: '+n.sources.filter"));
 A.equal(JSON.parse(read('vercel.json')).git.deploymentEnabled,false);
});
test('read-only CLI gates: structure/study PASS, expert/official BLOCKED',()=>{
 const run=gate=>require('node:child_process').spawnSync(process.execPath,['scripts/audit-p4-v163.cjs','--gate='+gate],{encoding:'utf8'});
 const r=run('structure');A.equal(r.status,0,r.stderr);A.equal(JSON.parse(r.stdout).stats.structuralOptionsChecked,2000);
 A.equal(run('study').status,0);
 A.equal(run('expert').status,2);
 A.equal(run('official').status,2);
});
