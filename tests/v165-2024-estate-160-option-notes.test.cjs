/* v165: 2024 부동산학개론 1~40번 신규 160개 개별 AI 해설 — 원전·전문가 미검독. */
'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8'),parse=p=>JSON.parse(read(p));
const bank=parse('data/official-2021-2025.json'),byId=new Map(bank.map(q=>[q.id,q]));
const all=[2021,2022,2023,2024,2025].flatMap(y=>parse('data/explanations/official-'+y+'.json').records);
const em=new Map(all.map(e=>[e.questionId,e])),rows=all.map(entry=>({q:byId.get(entry.questionId),entry}));
const audit=require('../assets/ck-p4-option-audit-v160.js');
const old=require('../assets/ck-p4-substantive-v161.js'),mid=require('../assets/ck-p4-substantive-v162.js');
const before=require('../assets/ck-p4-substantive-v164.js'),newDraft=require('../assets/ck-p4-substantive-v165.js');
const Study=require('../assets/ck-p4-public-study-v163.js');
const packet=parse('data/research/v165-option-analysis-2024-estate-160.json');
const depend={optionAudit:audit,v161:old,v162:mid,v164:before,v165:newDraft};
const output=Study.build(rows,depend);
test('40 canonical 2024 estate questions add exactly 160 specific new explanations without replacing existing 240 choices',()=>{
 A.equal(packet.stats.questions,40);A.equal(packet.stats.options,160);
 A.equal(newDraft.count().sourceRecordCount,40);
 A.deepEqual(packet.records.map(x=>x.id),Array.from({length:40},(_,i)=>'2024-'+(i+1)));
 const seen=new Set();
 for(const r of packet.records){
  const q=byId.get(r.id),ex=em.get(r.id);
  A.ok(q);A.equal(q.year,2024);A.equal(q.subject,'estate');A.equal(r.year,q.year);
  A.deepEqual(r.officialAccepted,q.correct);
  A.deepEqual(r.optionTexts,q.options);A.equal(r.optionDrafts.length,4);
  A.ok(q.question.startsWith(r.questionTextFingerprint));
  A.equal(r.sourcePdfRead,false);A.equal(r.answerPdfCompared,false);
  A.equal(r.lawAsOfVerified,false);A.equal(r.independentExpertSignoff,false);
  A.equal(ex.options.length,5);A.equal(ex.officialAnswer.length,1);
  const missed=[1,2,3,4,5].filter(i=>!ex.options[i-1].draftReason?.trim()&&!ex.officialAnswer.includes(i));
  A.deepEqual(r.optionDrafts.map(x=>x.option).sort(),missed,r.id);
  for(const d of r.optionDrafts){
   const key=r.id+'-'+d.option;A.ok(!seen.has(key));seen.add(key);
   A.ok(d.text.length>=52);A.equal(d.status,'AI_OPTION_SPECIFIC_STUDY_DRAFT');
   const input={questionId:q.id,year:q.year,questionText:q.question,officialAnswers:q.correct,
    optionText:q.options[d.option-1],index:d.option};
   const note=newDraft.get(input);A.ok(note,key);A.equal(note.text,d.text);
   A.equal(note.expertVerdict,'unreviewed');A.equal(note.signedOff,false);
   A.equal(note.pdfCompared,false);A.equal(note.lawAsOfVerified,false);
   A.ok(note.sources.some(x=>x.type==='QNET_PAPER_NOTICE_NOT_PDF'));
   A.ok(note.sources.some(x=>x.type==='QNET_FINAL_ANSWER_NOTICE_NOT_PDF'));
  }
  const selected=q.correct[0];
  A.equal(newDraft.get({questionId:q.id,year:q.year,questionText:q.question,
   officialAnswers:q.correct,optionText:q.options[selected-1],index:selected}),null,
   'Existing correct answer rationale must not be overwritten');
 }
 A.equal(seen.size,160);
});
test('2024 source mismatch fail-closed across all fields including unchanged option and year',()=>{
 const q=byId.get('2024-9'),input={questionId:q.id,year:q.year,questionText:q.question,
  officialAnswers:q.correct,optionText:q.options[1],index:2};
 A.ok(newDraft.get(input));
 for(const change of [
  {...input,year:2025},{...input,questionText:'바뀐 원문'},{...input,officialAnswers:[2]},
  {...input,optionText:'fake option'},{...input,index:0},{...input,index:6},
  {...input,questionId:'2024-8'}, {questionId:q.id,index:2}
 ])A.equal(newDraft.get(change),null);
});
test('10 independent recomputations match year-2024 math/decision keys',()=>{
 const math={
  9:{expected:0.7,key:1,actual:-.9*2+.5*5},
  11:{expected:160,key:2,actual:1400/1.75-800/1.25},
  14:{expected:30,key:4,actual:45/(1+Math.sqrt(21/84))},
  17:{expected:2,key:3,actual:(14.3-(14.3*.6+8.8*.4))/1.1},
  23:{expected:10,key:4,actual:60000/(7000-500+100-(200+100+100+200))},
  24:{expected:Math.sqrt(18),key:3,actual:Math.sqrt(.25*(14-8)**2+.5*(8-8)**2+.25*(2-8)**2)},
  28:{expected:19320,key:2,actual:300*5*12+(300*19-3500)*.1*6},
  29:{expected:3,key:3,actual:Math.min(5*.7,6000*.6/.1/10000)-.5},
  36:{expected:7,key:1,actual:(50000000*(1-.1-.2)/500000000)*100},
  37:{expected:286000000,key:2,actual:625000000*.8/200*1.04*1.10*100}
 };
 A.equal(Object.keys(math).length,packet.stats.calculationQuestions);
 for(const [num,{expected,key,actual}] of Object.entries(math)){
  A.ok(Math.abs(expected-actual)<1e-6,'recompute '+num);
  const q=byId.get('2024-'+num),r=packet.records.find(x=>x.id===q.id);
  A.deepEqual(q.correct,[key]);A.equal(r.calculation.answerOption,key);
  A.equal(r.calculation.recomputed,true);A.ok(r.calculation.expression.length>=30);
 }
});
test('2024 complete five-option candidates with separate 2025, earlier 2021–23 unfinished, expert zero',()=>{
 A.equal(output.ready,true);A.equal(output.stats.structuralQuestionsChecked,400);
 A.equal(output.stats.structuralOptionsChecked,2000);
 A.equal(output.stats.aiOptionCandidates,560);A.equal(output.stats.existingOptionCandidates,332);
 A.equal(output.stats.answerContextOnly,166);A.equal(output.stats.optionsWithoutIndependentCandidate,942);
 A.equal(output.stats.independentCandidateCoverage,892);A.equal(output.stats.allCandidateCoverage,1058);
 A.equal(output.stats.year2024FiveOptionCandidateQuestions,80);
 A.equal(output.stats.year2025FiveOptionAIDraftQuestions,80);
 A.equal(output.stats.expertVerifiedOptions,0);A.equal(output.stats.officialExplanationsPublished,0);
 A.equal(output.questions.filter(q=>q.year===2024&&q.subject==='estate'&&q.options.every(o=>o.tier!=='no_independent_reason')).length,40);
 A.equal(output.questions.filter(q=>q.year===2024&&q.subject==='civil'&&q.options.every(o=>o.tier!=='no_independent_reason')).length,40);
 A.equal(output.options.filter(x=>x.year<=2023&&x.tier==='no_independent_reason').length,942);
 const txt=Study.exportText(output);
 A.equal((txt.match(/^=== 202[1-5]년/gm)||[]).length,400);
 A.equal((txt.match(/^선지 [1-5] \[/gm)||[]).length,2000);
});
test('v165 P4 UI, caching and manual QA all carry the same version and no auto-deploy',()=>{
 const html=read('index.html'),ui=read('assets/ck-p4-option-audit-ui-v160.js');
 const sw=read('sw.js'),diag=read('assets/ck-data-diagnostics-v88.js'),qa=read('assets/ck-manual-qa-v115.js');
 A.ok(ui.includes('CK165SubstantiveReview?.get?.(r)'));
 A.ok(html.indexOf('ck-p4-substantive-v165.js?v=165')<html.indexOf('ck-p4-option-audit-ui-v160.js?v=165'));
 A.ok(html.indexOf('ck-p4-substantive-v165.js?v=165')<html.indexOf('ck-p4-public-study-v163.js?v=165'));
 A.ok(sw.includes('ck-p4-substantive-v165.js?v=165'));
 A.ok(diag.includes('ck-p4-substantive-v165.js?v=165'));
 A.match(qa,/P4 선택 자산 15\/15/);
 A.ok(html.includes('v171-p4-mvp-tts-theory-graph'));
 A.ok(sw.includes('conceptknot-study-v171-p4-mvp-tts-theory-graph'));
 const cfg=parse('vercel.json');A.equal(cfg.git.deploymentEnabled,false);
 A.ok(cfg.buildCommand.length<=256);A.ok(cfg.buildCommand.includes('verify-p4-release-v171.cjs'));
 for(const p of ['assets/ck-p4-substantive-v165.js','assets/ck-p4-public-study-v163.js',
 'assets/ck-p4-option-audit-ui-v160.js','assets/ck-study-workbench-v81.js','sw.js'])
  A.doesNotThrow(()=>new vm.Script(read(p),{filename:p}));
});
