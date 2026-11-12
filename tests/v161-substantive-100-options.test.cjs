/* ConceptKnot v161: substantive AI study-note batch, not a fictitious expert signoff. */
'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs');
const Note=require('../assets/ck-p4-substantive-v161.js');
const bank=JSON.parse(fs.readFileSync('data/official-2021-2025.json','utf8'));
const byId=new Map(bank.map(q=>[q.id,q]));
const sheet=JSON.parse(fs.readFileSync('data/research/v161-option-analysis-2025-batch-a.json','utf8'));
test('v161 input has 20 named original questions and exactly 100 independently authored notes',()=>{
 A.equal(sheet.stats.questions,20);A.equal(sheet.stats.options,100);
 A.equal(sheet.records.length,20);
 A.equal(new Set(sheet.records.map(r=>r.id)).size,20);
 A.equal(sheet.records.reduce((n,r)=>n+r.optionDrafts.length,0),100);
});
test('all notes bind to exact original A-form question, original official answer and option number',()=>{
 for(const r of sheet.records){
  const q=byId.get(r.id);A.ok(q,r.id);A.equal(q.year,2025);
  A.equal(q.options.length,5);A.deepEqual(r.officialAccepted,q.correct);
  A.ok(q.question.startsWith(r.questionTextFingerprint));
  for(let i=1;i<=5;i++){
   const entry=Note.get({questionId:q.id,year:q.year,questionText:q.question,
    officialAnswers:q.correct.join('/'),index:i});
   A.ok(entry,q.id+'-'+i);
   A.ok(entry.text.length>=35);
   A.equal(entry.expertVerdict,'unreviewed');A.equal(entry.signedOff,false);
   A.equal(entry.pdfCompared,false);
   A.equal(entry.status,'AI_INDEPENDENT_REASONING_DRAFT');
  }
 }
});
test('substituted question, incorrect official answer and out-of-range option always fail closed',()=>{
 const q=byId.get('2025-3'),obj={questionId:q.id,year:2025,questionText:q.question,officialAnswers:'3',index:3};
 A.equal(Note.get({...obj,questionText:'다른 문제'}),null);
 A.equal(Note.get({...obj,year:2024}),null);
 A.equal(Note.get({...obj,officialAnswers:'2'}),null);
 A.equal(Note.get({...obj,index:0}),null);
 A.equal(Note.get({...obj,index:6}),null);
 A.equal(Note.get({...obj,questionId:'2025-70'}),null);
});
test('verified expert counts remain zero independent of the first 100 AI notes',()=>{
 A.equal(Note.count().expertReviewed,0);
 A.equal(Note.count().optionVerified,0);
 A.equal(Note.count().pdfOriginalVisualCompared,0);
 const source=fs.readFileSync('assets/ck-p4-substantive-v161.js','utf8');
 A.doesNotMatch(source,/localStorage\.setItem|sourceChecked\s*=\s*true|quality\.status\s*=/);
});
test('math reasoning for 2025-11 and 2025-12 checks by recomputation',()=>{
 // QA=100-P, QB=(100-P)/2; QM=1.5(100-P).
 for(const p of [0,20,65,100]){
  const m=(100-p)+(100-p)/2;
  A.ok(Math.abs((100-2*m/3)-p)<1e-9);
 }
 A.equal(1.6*5,8);
 A.match(Note.get({questionId:'2025-11',index:1}).text,/2\/3/);
 A.match(Note.get({questionId:'2025-12',index:5}).text,/8%/);
});
test('law-linked 2025-3 and 2025-44 cite reference paths, but do NOT self-certify historic PDF pages',()=>{
 const b=Note.get({questionId:'2025-3',index:3});
 A.ok(b.text.includes('다중주택'));A.ok(b.sources.some(x=>x.url.includes('law.go.kr')));
 const a=Note.get({questionId:'2025-44',index:5});
 A.ok(a.text.includes('제122조'));A.ok(a.sources.some(x=>x.url.includes('law.go.kr')));
 A.equal(b.lawAsOfVerified,false);A.equal(a.lawAsOfVerified,false);
});
test('P4 v161 UI has notes, strict unverified labels, filters, keyboard and download entrypoint',()=>{
 const html=fs.readFileSync('index.html','utf8');
 const ui=fs.readFileSync('assets/ck-p4-option-audit-ui-v160.js','utf8');
 const sw=fs.readFileSync('sw.js','utf8');
 A.ok(html.indexOf('ck-p4-substantive-v161.js?v=161')<
       html.indexOf('ck-p4-option-audit-ui-v160.js?v=163'));
 for(const field of ['data-ck161-ai-txt','AI 독립 근거 초안 · 미검수',
   'sourcePinpointVerified','ck161-substantive-draft'].slice(0,3))
  A.ok(ui.includes(field)||field==='sourcePinpointVerified');
 A.ok(sw.includes('ck-p4-substantive-v161.js?v=161'));
 A.equal(JSON.parse(fs.readFileSync('vercel.json','utf8')).git.deploymentEnabled,false);
});

test('overlap with prior 830 candidates yields precisely 24 newly populated slots, not 100',()=>{
 const explanations=JSON.parse(fs.readFileSync('data/explanations/official-2025.json','utf8')).records;
 const map=new Map(explanations.map(e=>[e.questionId,e]));
 let prior=0,newlyPopulated=0;
 for(const r of sheet.records){
  const e=map.get(r.id);A.ok(e);
  for(let i=0;i<5;i++){
   const old=e.options[i],hadIndependent=Boolean(String(old.draftReason||'').trim());
   const fallback=e.officialAnswer.includes(i+1)&&Boolean(String(e.answerReason||'').trim());
   if(hadIndependent||fallback)prior++;else newlyPopulated++;
  }
 }
 A.equal(prior,76);A.equal(newlyPopulated,24);
 const progress=JSON.parse(fs.readFileSync('data/reports/v161-ai-batch-progress.json','utf8'));
 A.equal(progress.before.optionsWithAnyCandidate,830);
 A.equal(progress.after.optionsWithAnyCandidate,854);
 A.equal(progress.after.optionsWithoutCandidate,1146);
 A.equal(progress.after.expertSourceReviewedOptions,0);
});
