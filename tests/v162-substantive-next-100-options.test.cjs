/* ConceptKnot v162: canonical 20-question 100-option AI candidate batch; no expert approvals. */
'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const bank=JSON.parse(read('data/official-2021-2025.json'));
const byId=new Map(bank.map(q=>[q.id,q]));
const v161=JSON.parse(read('data/research/v161-option-analysis-2025-batch-a.json'));
const sheet=JSON.parse(read('data/research/v162-option-analysis-2025-batch-b.json'));
const oldNote=require('../assets/ck-p4-substantive-v161.js');
const Note=require('../assets/ck-p4-substantive-v162.js');
const audit=require('../assets/ck-p4-option-audit-v160.js');
const explanations=Array.from({length:5},(_,i)=>JSON.parse(read('data/explanations/official-'+(2021+i)+'.json')).records).flat();
const base=audit.build(explanations.map(entry=>({q:byId.get(entry.questionId),entry})));
const full=q=>({questionId:q.id,year:q.year,questionText:q.question,officialAnswers:q.correct.join('/'),optionText:q.options[0],index:1});
test('v162 source-locked IDs, five distinct option narratives and original official answers',()=>{
 const ids=[...Array.from({length:15},(_,i)=>'2025-'+(16+i)),...Array.from({length:5},(_,i)=>'2025-'+(46+i))];
 A.deepEqual(sheet.records.map(r=>r.id),ids);
 A.equal(sheet.stats.questions,20);A.equal(sheet.stats.options,100);
 A.equal(Note.count().sourceRecordCount,20);
 const seen=new Set();
 for(const r of sheet.records){
  const q=byId.get(r.id);A.ok(q,r.id);
  A.equal(q.subject,r.subject);A.equal(q.year,r.year);
  A.deepEqual(r.officialAccepted,q.correct);A.deepEqual(r.optionTexts,q.options);
  A.ok(q.question.startsWith(r.questionTextFingerprint));
  A.equal(r.optionDrafts.length,5);
  A.equal(new Set(r.optionDrafts.map(d=>d.text)).size,5);
  for(let i=0;i<5;i++){
   const d=r.optionDrafts[i],key=r.id+'-'+(i+1);
   A.equal(d.option,i+1);A.ok(d.text.length>=48);
   A.ok(!seen.has(key));seen.add(key);
   const m=Note.get({...full(q),optionText:q.options[i],index:i+1});
   A.ok(m,key);A.equal(m.text,d.text);
   A.equal(m.expertVerdict,'unreviewed');A.equal(m.signedOff,false);
   A.equal(m.pdfCompared,false);A.equal(m.lawAsOfVerified,false);
   A.equal(m.sourcePinpointVerified,false);
  }
 }
 A.equal(seen.size,100);
});
test('fail-closed metadata prevents wrong original question, option, answer, year or incomplete lookup',()=>{
 const q=byId.get('2025-21'),r=full(q);
 A.ok(Note.get(r));A.equal(Note.get({questionId:q.id,index:1}),null);
 A.equal(Note.get({...r,questionText:'틀린 원문'}),null);
 A.equal(Note.get({...r,officialAnswers:'1'}),null);
 A.equal(Note.get({...r,optionText:'변조 선지'}),null);
 A.equal(Note.get({...r,year:2024}),null);
 A.equal(Note.get({...r,index:0}),null);
 A.equal(Note.get({...r,index:6}),null);
 A.equal(Note.get({...r,questionId:'2024-21'}),null);
});
test('five independently recomputed numeric results match source answer options',()=>{
 const checks=[
  ['2025-16',16*100/(100+20+40),'10억원',2],
  ['2025-21',(1000-2*120)-(100+4*120),'180호',4],
  ['2025-27',(8*.05+.4-8*.8*.05)/(8*.2)*100,'30%',3],
  ['2025-28',(800*.90+1000*.85+1200*.80)/(.7*(800*.90+1000*.85+1200*.80)),'1.43',4],
  ['2025-29',2000*.8*6*.9*.5,'4,320만원',2]
 ];
 const expect=[10,180,30,1.4285714285714286,4320];
 for(let i=0;i<checks.length;i++){
  const [id,value,label,correct]=checks[i],q=byId.get(id),r=sheet.records.find(x=>x.id===id);
  A.ok(Math.abs(value-expect[i])<1e-8,id);
  A.equal(q.options[correct-1],label);
  A.deepEqual(q.correct,[correct]);
  A.equal(r.calculation.recomputed,true);
  A.equal(r.calculation.answerOption,correct);
  A.equal(r.calculation.solution,label);
  A.ok(Note.get(full(q)).mathRecomputed);
 }
});
test('existing 100 AI notes remain separate, coverage deduplicates prior 830',()=>{
 A.equal(base.ready,true);A.equal(base.rows.length,2000);
 A.equal(base.stats.optionsWithDraft,830);
 const from=new Set([...v161.records,...sheet.records].flatMap(r=>r.optionDrafts.map(o=>r.id+'-O'+o.option)));
 A.equal(from.size,200);
 const joined=base.rows.filter(r=>r.draftAvailable||from.has(r.id));
 A.equal(joined.length,886);
 A.equal(2000-joined.length,1114);
 const pr=JSON.parse(read('data/reports/v162-ai-batch-progress.json'));
 A.equal(pr.v162.previouslyBlankNowAIDraft,32);
 A.equal(pr.v162.previousExistingCandidateRewritten,68);
 A.equal(pr.after.optionsWithAnyCandidate,886);
 A.equal(pr.after.optionsWithoutCandidate,1114);
 A.equal(pr.after.aiIndependentlyAuthoredOptionDrafts,200);
 A.equal(pr.after.expertSourceReviewedQuestions,0);
 A.equal(pr.after.expertSourceReviewedOptions,0);
 const known=byId.get('2025-3');A.ok(oldNote.get({...full(known),optionText:known.options[2],index:3}));
});
test('Q-Net paper and answer announcements stay distinct, no fake PDF/legal/expert certification',()=>{
 for(const r of sheet.records){
  A.equal(r.sourcePdfRead,false);
  A.equal(r.answerPdfCompared,false);
  A.equal(r.independentExpertSignoff,false);
  A.equal(r.legalAsOfVerified,false);
  A.equal(r.sourcePinpointVerified,false);
  const paper=r.sources.find(x=>x.type==='QNET_PAPER_NOTICE_NOT_PDF');
  const answer=r.sources.find(x=>x.type==='QNET_FINAL_ANSWER_NOTICE_NOT_PDF');
  A.ok(paper.url.includes('menuType=cst00309'));
  A.ok(answer.url.includes('menuType=cst00310'));
  A.notEqual(paper.url,answer.url);
 }
 A.equal(sheet.stats.expertReviewed,0);
 A.equal(sheet.stats.optionVerified,0);
 A.equal(sheet.stats.pdfOriginalVisualCompared,0);
 A.equal(Note.count().expertReviewed,0);
 A.doesNotMatch(read('assets/ck-p4-substantive-v162.js'),/localStorage\.setItem|sourceChecked\s*=\s*true|quality\.status\s*=/);
});
test('P4 UI/HTML/offline counters and manual QA integrate batch B after batch A',()=>{
 const html=read('index.html'),ui=read('assets/ck-p4-option-audit-ui-v160.js');
 const diag=read('assets/ck-data-diagnostics-v88.js'),sw=read('sw.js'),manual=read('assets/ck-manual-qa-v115.js');
 const scripts=['ck-p4-substantive-v161.js?v=161','ck-p4-substantive-v162.js?v=162','ck-p4-option-audit-ui-v160.js?v=164'];
 A.ok(scripts.every(x=>html.includes(x)));
 A.ok(html.indexOf(scripts[0])<html.indexOf(scripts[1]));
 A.ok(html.indexOf(scripts[1])<html.indexOf(scripts[2]));
 A.ok(ui.includes('CK162SubstantiveReview?.get?.(r)'));
 A.ok(ui.includes('r.draftAvailable||Boolean(aiNote(r))'));
 A.ok(ui.includes("state.flag==='missing'&&!r.draftAvailable&&!aiNote(r)"));
 A.ok(ui.includes('AI 포함 전체 근거 후보'));
 A.ok(ui.includes("batch.length+'건_미검수_"));
 A.ok(ui.includes('독립 계산 검산'));
 A.match(diag,/ck-p4-substantive-v162\.js\?v=162/);
 A.match(sw,/ck-p4-substantive-v162\.js\?v=162/);
 A.match(manual,/v162-ai-200-option-notes/);
 A.match(manual,/P4 선택 자산 12\/12/);
 A.ok(diag.includes('conceptknot-study-v164-full-2025-option-notes'));
 A.ok(sw.includes('conceptknot-study-v164-full-2025-option-notes'));
 A.equal(JSON.parse(read('vercel.json')).git.deploymentEnabled,false);
 A.doesNotMatch(ui,/localStorage\.setItem|quality\.sourceChecked\s*=/);
});
