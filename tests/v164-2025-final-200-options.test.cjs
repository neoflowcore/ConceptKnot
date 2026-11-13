/* ConceptKnot v164: remaining 2025 200 options, source-locked unverified study rationale checks. */
'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8'),parse=p=>JSON.parse(read(p));
const bank=parse('data/official-2021-2025.json'),byId=new Map(bank.map(q=>[q.id,q]));
const authored=parse('data/research/v164-option-analysis-2025-batch-c.json');
const api=require('../assets/ck-p4-substantive-v164.js'),old=require('../assets/ck-p4-substantive-v161.js'),mid=require('../assets/ck-p4-substantive-v162.js');
const study=require('../assets/ck-p4-public-study-v163.js'),audit=require('../assets/ck-p4-option-audit-v160.js');
const explanations=[2021,2022,2023,2024,2025].flatMap(y=>parse('data/explanations/official-'+y+'.json').records);
const rows=explanations.map(entry=>({q:byId.get(entry.questionId),entry}));
const deps={optionAudit:audit,v161:old,v162:mid,v164:api,v165:require('../assets/ck-p4-substantive-v165.js')};
test('2025 31–40, 51–80 40 canonical questions and 200 individual authored option notes',()=>{
 const expected=[...Array.from({length:10},(_,i)=>31+i),...Array.from({length:30},(_,i)=>51+i)].map(n=>'2025-'+n);
 A.deepEqual(authored.records.map(r=>r.id),expected);
 A.equal(authored.stats.questions,40);A.equal(authored.stats.options,200);A.equal(api.count().options,200);
 A.equal(new Set(expected).size,40);
 const seen=new Set();
 for(const r of authored.records){
  const q=byId.get(r.id);A.ok(q);
  A.equal(r.year,2025);A.equal(r.subject,q.subject);A.deepEqual(r.officialAccepted,q.correct);
  A.deepEqual(r.optionTexts,q.options);A.equal(r.optionDrafts.length,5);A.ok(q.question.startsWith(r.questionTextFingerprint));
  A.equal(r.sourcePdfRead,false);A.equal(r.answerPdfCompared,false);
  A.equal(r.legalAsOfVerified,false);A.equal(r.independentExpertSignoff,false);
  for(let i=0;i<5;i++){
   const d=r.optionDrafts[i],key=r.id+'-'+(i+1);A.ok(!seen.has(key));seen.add(key);
   A.equal(d.option,i+1);A.ok(d.text.trim().length>=45);
   const n=api.get({questionId:q.id,year:q.year,questionText:q.question,officialAnswers:q.correct,optionText:q.options[i],index:i+1});
   A.ok(n,key);A.equal(n.text,d.text);
   A.equal(n.expertVerdict,'unreviewed');A.equal(n.signedOff,false);A.equal(n.lawAsOfVerified,false);A.equal(n.pdfCompared,false);
   A.ok(n.sources.find(s=>s.type==='QNET_PAPER_NOTICE_NOT_PDF'));
   A.ok(n.sources.find(s=>s.type==='QNET_FINAL_ANSWER_NOTICE_NOT_PDF'));
  }
 }
 A.equal(seen.size,200);
});
test('source mismatch fails closed on question, answer, option and year including missing fields',()=>{
 const q=byId.get('2025-31'),input={questionId:q.id,year:q.year,questionText:q.question,officialAnswers:q.correct,optionText:q.options[1],index:2};
 A.ok(api.get(input));
 for(const changed of [{...input,year:2024},{...input,questionText:'wrong'},{...input,officialAnswers:[1]},
  {...input,optionText:'wrong option'},{...input,index:0},{...input,index:6},{...input,questionId:'2025-30'},
  {questionId:q.id,index:2}])A.equal(api.get(changed),null);
});
test('four independent arithmetic recomputations reproduce canonical selected answers',()=>{
 const solutions=[
  ['2025-31',Math.min(40000*.6-5000,(7000*.4/.2)-5000),9000,2],
  ['2025-32',(90000-9*(90000/30))*.03,1890,3],
  ['2025-37',5000000*1.05*.95*1.08*1.6,8618400,4],
  ['2025-39',1400000*200*125/100*(1-6/50),308000000,3]
 ];
 for(const [id,n,expected,key] of solutions){
  A.ok(Math.abs(n-expected)<1e-6,id);
  const q=byId.get(id),r=authored.records.find(x=>x.id===id);
  A.equal(r.calculation.recomputed,true);A.equal(r.calculation.answerOption,key);
  A.deepEqual(q.correct,[key]);A.equal(q.options[key-1],r.calculation.solution);
 }
});
test('2025 all 80 questions now have five candidate texts; 2021–24 blanks remain visible',()=>{
 const out=study.build(rows,deps);
 A.equal(out.ready,true);
 A.equal(out.stats.structuralQuestionsChecked,400);A.equal(out.stats.structuralOptionsChecked,2000);
 A.equal(out.stats.aiOptionCandidates,560);A.equal(out.stats.existingOptionCandidates,332);
 A.equal(out.stats.answerContextOnly,166);A.equal(out.stats.optionsWithoutIndependentCandidate,942);
 A.equal(out.stats.independentCandidateCoverage,892);A.equal(out.stats.allCandidateCoverage,1058);
 A.equal(out.stats.expertVerifiedQuestions,0);A.equal(out.stats.expertVerifiedOptions,0);A.equal(out.stats.officialExplanationsPublished,0);
 for(let n=1;n<=80;n++){
  const q=out.questions.find(x=>x.id==='2025-'+n);
  A.ok(q);A.ok(q.options.every(x=>x.tier==='ai_option_candidate'),q.id);
 }
 const txt=study.exportText(out);A.ok(txt.length>350000);A.match(txt,/자체 작성 미검수/);
});
test('P4 UI, PWA v164 and offline asset counters loaded before workbench',()=>{
 const ui=read('assets/ck-p4-option-audit-ui-v160.js'),html=read('index.html'),
  diag=read('assets/ck-data-diagnostics-v88.js'),sw=read('sw.js'),manual=read('assets/ck-manual-qa-v115.js');
 A.ok(ui.includes('CK164SubstantiveReview?.get?.(r)'));
 A.ok(html.indexOf('ck-p4-substantive-v164.js?v=164')<html.indexOf('ck-p4-option-audit-ui-v160.js?v=165'));
 A.ok(html.indexOf('ck-p4-substantive-v164.js?v=164')<html.indexOf('ck-p4-public-study-v163.js?v=165'));
 A.ok(sw.includes('ck-p4-substantive-v164.js?v=164'));
 A.ok(diag.includes('ck-p4-substantive-v164.js?v=164'));
 A.match(manual,/P4 선택 자산 15\/15/);
 A.ok(html.includes('v170-p4-manual-qa-hub'));
 A.ok(sw.includes('conceptknot-study-v170-p4-manual-qa-hub'));
 A.equal(parse('vercel.json').git.deploymentEnabled,false);
 for(const p of ['assets/ck-p4-substantive-v164.js','assets/ck-p4-public-study-v163.js',
  'assets/ck-p4-option-audit-ui-v160.js','assets/ck-study-workbench-v81.js','sw.js'])
  A.doesNotThrow(()=>new vm.Script(read(p),{filename:p}));
});
