/* ConceptKnot v168: no independent-source/expert verification implied by AI draft counts. */
'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const parse=p=>JSON.parse(fs.readFileSync(p,'utf8')),read=p=>fs.readFileSync(p,'utf8');
const bank=parse('data/official-2021-2025.json'),byId=new Map(bank.map(q=>[q.id,q]));
const explanations=[2021,2022,2023,2024,2025].flatMap(y=>parse('data/explanations/official-'+y+'.json').records);
const existing=new Map(explanations.map(e=>[e.questionId,e]));
const packet=parse('data/research/v168-2021-2023-estate-122-option-candidates.json');
const v168=require('../assets/ck-p4-substantive-v168.js'),study=require('../assets/ck-p4-public-study-v163.js');
const deps={optionAudit:require('../assets/ck-p4-option-audit-v160.js'),
 v161:require('../assets/ck-p4-substantive-v161.js'),v162:require('../assets/ck-p4-substantive-v162.js'),
 v164:require('../assets/ck-p4-substantive-v164.js'),v165:require('../assets/ck-p4-substantive-v165.js'),
 v167:require('../assets/ck-p4-substantive-v167.js'),v168};
test('122 drafts source-match exact question/option/answer and preserve legacy original notes',()=>{
 A.equal(packet.questions,28);A.equal(packet.options,122);A.equal(packet.records.length,28);
 const seen=new Set(),years={2021:0,2022:0,2023:0};
 for(const r of packet.records){
  const q=byId.get(r.id),e=existing.get(r.id);A.ok(q&&e,r.id);
  A.equal(q.year,r.year);A.equal(q.subject,'estate');A.equal(q.question,r.questionText);
  A.deepEqual(q.correct,r.officialAccepted);A.deepEqual(q.options,r.optionTexts);
  A.equal(r.sourcePdfRead,false);A.equal(r.answerPdfCompared,false);A.equal(r.lawAsOfVerified,false);
  A.equal(r.independentExpertSignoff,false);
  for(const note of r.optionDrafts){
   const id=r.id+':'+note.option;A.ok(!seen.has(id),id);seen.add(id);
   A.equal((e.options[note.option-1].draftReason||'').trim(),'');
   A.ok(note.text.length>=60);A.equal(note.expertVerdict,'unreviewed');
   const inp={questionId:q.id,year:q.year,questionText:q.question,officialAnswers:q.correct,
    index:note.option,optionText:q.options[note.option-1]};
   A.equal(v168.get(inp)?.text,note.text,id);
   for(const forged of [{...inp,optionText:'tampered'}, {...inp,questionText:q.question+' '},
      {...inp,officialAnswers:[0]}, {...inp,year:2025},{...inp,index:0}])
    A.equal(v168.get(forged),null,id+' source drift rejected');
   years[q.year]++;
  }
 }
 A.equal(seen.size,122);A.deepEqual(years,{2021:50,2022:36,2023:36});
 A.deepEqual(v168.count().yearCounts,{2021:50,2022:36,2023:36});
});
test('v168 candidate coverage is distinct from human expert signoff',()=>{
 const rows=explanations.map(entry=>({q:byId.get(entry.questionId),entry}));
 const r=study.build(rows,deps);A.equal(r.ready,true,r.errors?.join(' | '));
 A.equal(r.stats.structuralQuestionsChecked,400);A.equal(r.stats.structuralOptionsChecked,2000);
 A.equal(r.stats.questionLevelStudyDrafts,400);A.equal(r.stats.aiOptionCandidates,808);
 A.equal(r.stats.existingOptionCandidates,332);A.equal(r.stats.answerContextOnly,146);
 A.equal(r.stats.optionsWithoutIndependentCandidate,714);A.equal(r.stats.allCandidateCoverage,1286);
 A.equal(r.stats.independentCandidateCoverage,1140);
 for(const [year,num] of [[2021,100],[2022,72],[2023,76],[2024,160],[2025,400]])
  A.equal(r.options.filter(x=>x.year===year&&x.tier==='ai_option_candidate').length,num);
 A.equal(r.stats.expertVerifiedQuestions,0);A.equal(r.stats.expertVerifiedOptions,0);
 A.equal(r.stats.officialExplanationsPublished,0);A.equal(r.stats.officialPdfAttachmentsRead,0);
});
test('numerical study examples are independently recomputed',()=>{
 const close=(v,w)=>A.ok(Math.abs(v-w)<1e-8,`${v} != ${w}`);
 close(20,30/(1+Math.sqrt(16/64)));
 close(100,120*3.5+1300*.6-1100);
 close(2,(50000/25)/(50000/25+32000/4)*10);
 close(1,[30,50,60,100,80].filter((v,i)=>v/320>[80,90,110,120,140][i]/540).length);
 close(3,30*((750/25)/(750/25+2500/100+500/25)-(750/5)/(750/5+2500/10+500/5)));
 close(5,(4500/(.03+.04+.02))/10000);
});
test('v168 HTML, offline, manual QA and production release are version-locked and nonautomatic',()=>{
 const h=read('index.html'),sw=read('sw.js'),d=read('assets/ck-data-diagnostics-v88.js');
 const ui=read('assets/ck-p4-option-audit-ui-v160.js'),qa=read('assets/ck-manual-qa-v115.js');
 const script='ck-p4-substantive-v168.js?v=168';
 A.ok(h.includes(script));A.ok(sw.includes(script));A.ok(d.includes(script));
 A.ok(h.indexOf(script)<h.indexOf('ck-p4-option-audit-ui-v160.js?v=165'));
 A.ok(h.indexOf(script)<h.indexOf('ck-p4-public-study-v163.js?v=165'));
 A.ok(h.includes('content="v168-2021-2023-122-option-rationales"'));
 A.ok(sw.includes('conceptknot-study-v168-2021-2023-122-option-drafts'));
 A.ok(d.includes('conceptknot-study-v168-2021-2023-122-option-drafts'));
 A.ok(ui.includes('CK168SubstantiveReview?.get?.(r)'));
 A.ok(qa.includes('P4 선택 자산 15/15'));
 A.equal(parse('vercel.json').git.deploymentEnabled,false);
 A.ok(parse('vercel.json').buildCommand.includes('verify-p4-release-v168.cjs'));
 for(const file of ['assets/ck-p4-substantive-v168.js','assets/ck-p4-public-study-v163.js',
  'assets/ck-p4-option-audit-ui-v160.js','assets/ck-data-diagnostics-v88.js','sw.js'])
  A.doesNotThrow(()=>new vm.Script(read(file),{filename:file}));
});
