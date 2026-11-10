/* ConceptKnot v154 — 160 educational drafts, 400 protected answers, no false verification. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=path=>fs.readFileSync(path,'utf8');
const json=path=>JSON.parse(read(path));
const years=[2021,2022,2023,2024,2025];
const official=json('data/official-2021-2025.json'),bank=new Map(official.map(q=>[q.id,q]));
const records=years.flatMap(year=>json('data/explanations/official-'+year+'.json').records);
const byId=new Map(records.map(r=>[r.questionId,r]));
const audit=require('../scripts/audit-p4-v154.cjs');
test('400 first-exam A-form explanations are individually anchored to canonical keys with no reviewer promotion',()=>{
 assert.equal(official.length,400);assert.equal(records.length,400);assert.equal(byId.size,400);
 let slots=0,special=0,reasons=0;
 for(const r of records){
  const q=bank.get(r.questionId);assert.ok(q,r.questionId);
  assert.equal(r.examYear,q.year);assert.equal(r.number,q.number);
  assert.equal(r.subject,q.subject);assert.deepEqual(r.officialAnswer,q.correct);
  assert.equal(r.quality.status,'draft',r.questionId);
  assert.ok(r.summaryEasy?.length>=15,r.questionId+' summary');
  assert.ok(r.answerReason?.length>=55,r.questionId+' answer');
  assert.equal(r.quality.reasonReviewed,false,r.questionId);
  assert.equal(r.quality.optionVerdictsReviewed,0,r.questionId);
  assert.equal(r.quality.sourceChecked,false,r.questionId);
  assert.equal(r.quality.reviewedBy,null,r.questionId);
  assert.equal(r.quality.reviewedAt,null,r.questionId);
  assert.equal(r.quality.currentLawCheckedAt,null,r.questionId);
  assert.equal(r.options.length,5);
  for(let i=0;i<5;i++){
   const o=r.options[i];assert.equal(o.no,i+1);
   assert.equal(o.verdict,'unreviewed',r.questionId+':'+i);
   assert.equal(o.sourceChecked,false,r.questionId+':'+i);
   assert.equal(o.why,'',r.questionId+':'+i);slots++;
  }
  if(q.correct.length>1)special++;
  if(r.answerReason)reasons++;
 }
 assert.equal(slots,2000);assert.equal(reasons,400);assert.equal(special,7);
});
test('four groups of 40 new explanations have evidence provenance without fictitious citations',()=>{
 const additions=[['2021',1,40,'estate'],['2021',41,80,'civil'],['2022',41,80,'civil'],['2023',41,80,'civil']];
 for(const [year,min,max,subject]of additions){
  const texts=new Set();
  for(let no=min;no<=max;no++){
   const r=byId.get(year+'-'+no);
   assert.ok(r&&r.subject===subject);
   assert.equal(r.explanationSeedProvenance?.kind,'assistant-curated-educational-draft');
   assert.equal(r.explanationSeedProvenance?.expertReviewed,false);
   assert.equal(r.explanationSeedProvenance?.legalEffectiveDateChecked,false);
   assert.equal(r.explanationSeedProvenance?.independentOptionVerdicts,false);
   assert.equal(r.traps.length,1);assert.equal(r.traps[0].verified,false);
   assert.ok(r.traps[0].text.length>=18);
   assert.equal(texts.has(r.answerReason),false,year+'-'+no+' duplicated rationale');
   texts.add(r.answerReason);
  }
  assert.equal(texts.size,40,year+subject);
 }
});
test('10 question/subject blocks have 40 candidate drafts; expert review and publication are unchanged',()=>{
 const r=audit.evaluate();
 assert.deepEqual(r.issues,[]);
 assert.equal(r.counts.total,400);assert.equal(r.counts.draft,400);assert.equal(r.counts.unstarted,0);
 assert.equal(r.counts.optionsTotal,2000);assert.equal(r.counts.optionDraftNotes,664);
 assert.equal(r.counts.answerKeyMatches,400);assert.equal(r.special.length,7);
 assert.equal(r.counts.published,0);assert.equal(r.counts.reasonReviewed,0);
 assert.equal(r.counts.sourceChecked,0);assert.equal(r.counts.optionVerified,0);
 for(const year of years)for(const subject of ['estate','civil'])
  assert.equal(r.counts.byYearSubject[year+'-'+subject].draft,40);
 const report=json('data/reports/recent-five-coverage.json');
 const candidates=json('data/reports/analysis-candidates-v78.json');
 assert.equal(report.draftCount,400);assert.equal(report.reasonDraftCount,400);
 assert.equal(report.unstartedCount,0);assert.equal(report.publishedCount,0);
 assert.equal(report.updatedByP4BatchV154,160);
 assert.equal(candidates.reviewStages.draft,400);assert.equal(candidates.reviewStages.unstarted,0);
 assert.equal(candidates.reviewStages.published,0);assert.equal(candidates.assistantStudyDraftsAddedV154,160);
});
test('2021 economy calculations have source-specific independent checks',()=>{
 const E=id=>byId.get('2021-'+id).answerReason;
 assert.equal(5/10,.5);assert.equal(8/10,.8);
 assert.match(E(4),/0\.5/);assert.match(E(4),/0\.8/);
 assert.ok(4/1>1&&.5/2<1);assert.match(E(6),/4÷1=4/);
 assert.equal(30/(1+Math.sqrt(16/64)),20);assert.match(E(12),/20km/);
 const previous=(100+40)/2.5,next=(200+40)/3;
 assert.equal(next-previous,24);assert.match(E(8),/24만원/);
 assert.equal(120*3.5+1300*.60-1100,100);assert.match(E(19),/100만원/);
 assert.equal(6825/1.05-3800,4725/1.05-1800);
 assert.equal(6825/1.05-3800,2700);assert.match(E(24),/2,700만원/);
 assert.equal((30/90)/(60/190)>1,true);
 assert.equal((30/90)/(50/190)>1,true);
 assert.equal((50/100)/(80/190)>1,true);
 assert.equal(2000+5600*.04,2224); // 만원 단위 이자 224만원 + 원금 2000만원 = 2224만원은 다른 예시로서 본 문제의 최종 값이 아니다
});
test('2021 mortgage amortization, income capitalization and appraisal arithmetic are anchored',()=>{
 const R=id=>byId.get('2021-'+id).answerReason;
 assert.equal(600000000/30,20000000);
 assert.equal(600000000*.04+20000000,44000000);
 assert.equal((600000000-2*20000000)*.04+20000000,42400000);
 assert.match(R(27),/4,240만원/);
 assert.equal(70000000*.95*.6/.1,399000000);
 assert.match(R(38),/3억9,900만원/);
 assert.equal(Math.round(10000000*1.05*1.10*.8*1.5),13860000);
 assert.match(R(40),/13,860,000원/);
});
test('PWA cache and review workbench preserve old HTML compatibility and load v154 questions',()=>{
 const sw=read('sw.js'),wb=read('assets/ck-study-workbench-v81.js');
 const editor=read('assets/ck-study-editor-v80.js'),p4=read('assets/ck-study-p4-v78.js');
 assert.match(sw,/conceptknot-study-v155-multiphase-direct-grips/);
 for(let y=2021;y<=2025;y++){
  assert.ok(sw.includes('official-'+y+'.json?v=154'));
  assert.ok(sw.includes('official-'+y+'.json?v=152'));
 }
 assert.match(wb,/official-'\+year\+'\.json\?v=154/);
 assert.match(editor,/official-'\+year\+'\.json\?v=154/);
 assert.match(p4,/analysis-candidates-v78\.json\?v=154/);
 const c=(sw.match(/const CRITICAL=\[([\s\S]*?)\];/)||[])[1];
 assert.equal((c.match(/'\.\//g)||[]).length,11);
 assert.equal(JSON.parse(read('vercel.json')).git.deploymentEnabled,false);
 assert.equal(fs.existsSync('.github/workflows'),false);
 assert.ok(Buffer.byteLength(read('index.html'))>1000000);
});
test('review packet includes official source, unreviewed draft, five independent verdict slots',()=>{
 const host={addEventListener(){},CK79Study:{snapshot:()=>({review:{},mistakes:[]})},CK86ExamBridge:{getDue:()=>({rows:[],future:0})}};
 const doc={readyState:'loading',addEventListener(){},getElementById(){return null}};
 vm.runInNewContext(read('assets/ck-study-workbench-v81.js'),
 {window:host,document:doc,localStorage:{getItem(){return null}},
  fetch(){throw Error('no network allowed in packet fixture')},requestAnimationFrame(){}});
 const id='2021-77',q=bank.get(id),r=byId.get(id);
 const packet=host.CK81Workbench.draftReviewPacket([id],[{q,entry:r}],5);
 assert.match(packet,/공식 채점 인정 번호: 1, 2, 3, 4, 5/);
 assert.match(packet,/전원정답, 선지 진위 전체를 보증하지 않음/);
 assert.match(packet,/학습용 요약 초안 \[검수 대기\]/);
 assert.match(packet,/정답 해설 후보 \[검수 대기\]/);
 assert.match(packet,/선지 5 독립 검수: 미검수/);
 assert.match(packet,/게시 가능: \[아니오\]/);
 assert.equal(host.CK81Workbench.draftReviewPacket([id,id],[{q,entry:r}],5).match(/=== 2021-77/g).length,1);
});

