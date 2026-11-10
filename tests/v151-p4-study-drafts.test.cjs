/* ConceptKnot P4 v151-v152: source-locked study-draft QA (NOT professional legal verification). */
'use strict';
const {test}=require('node:test'),A=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.resolve(__dirname,'..');
const raw=p=>fs.readFileSync(path.join(base,p),'utf8');
const json=p=>JSON.parse(raw(p));
const years=[2021,2022,2023,2024,2025];
const bank=json('data/official-2021-2025.json');
const questions=new Map(bank.map(q=>[q.id,q]));
const recs=years.flatMap(y=>json('data/explanations/official-'+y+'.json').records);
const recMap=new Map(recs.map(r=>[r.questionId,r]));
const new2024=[1,2,3,4,5,6,7,8,10,13,15,16,17,18,19,21,22,24,28,29,31,32,33,34,35,37,38,39,40];
const new2025=[2,3,4,13,14,15,17,18,20,22,23,24,33,35,36,37,38,39,40];
test('400 canonical 5-option official records and answer keys remain unchanged',()=>{
 A.equal(bank.length,400);A.equal(recs.length,400);A.equal(recMap.size,400);
 let i=0;
 for(const r of recs){
  const q=questions.get(r.questionId);
  A.ok(q,r.questionId);A.equal(q.year,r.examYear);
  A.equal(q.number,r.number);A.equal(q.subject,r.subject);
  A.deepEqual(r.officialAnswer,q.correct);
  A.equal(r.options.length,5);
  A.equal(q.options.length,5);
  A.equal(r.quality.answerKeyChecked,true);
  for(let n=0;n<5;n++){
   A.equal(r.options[n].no,n+1);A.equal(r.options[n].verdict,'unreviewed');
   A.equal(r.options[n].sourceChecked,false);
   A.equal(r.options[n].why,'');
   i++;
  }
 }
 A.equal(i,2000);
});
test('48 new study rationales are substantive, traceable and never human-approved',()=>{
 A.equal(new2024.length,29);A.equal(new2025.length,19);
 for(const [year,ids] of [[2024,new2024],[2025,new2025]])for(const n of ids){
  const id=year+'-'+n,r=recMap.get(id);
  A.equal(r.quality.status,'draft',id);
  A.ok(r.summaryEasy.length>=18,id);
  A.ok(r.answerReason.length>=55,id);
  A.ok(r.traps.some(x=>x.text.length>=18&&x.verified===false),id);
  A.equal(r.quality.reasonReviewed,false);
  A.equal(r.quality.sourceChecked,false);
  A.equal(r.quality.optionVerdictsReviewed,0);
  A.equal(r.quality.reviewedBy,null);
  A.equal(r.quality.reviewedAt,null);
  A.ok(r.sourceRefs.some(x=>x.type==='officialNotice'),id);
  A.ok(r.options.some(x=>x.draftReason?.trim()),id);
  if(year===2025)A.equal(r.options.filter(x=>x.draftReason?.trim()).length,5,id);
  if(year===2024)A.ok(r.options.filter(x=>x.draftReason?.trim()).length>=1,id);
  for(const x of r.sourceRefs.filter(x=>x.type==='studyReferenceCandidate')){
   A.match(x.url,/^https:\/\//);A.equal(x.verified,false);
  }
 }
});
test('2024/2025 estate 80/80 remain drafted; current P4 v154 counts 400/0',()=>{
 const a=years.flatMap(y=>json('data/explanations/official-'+y+'.json').records);
 A.equal(a.filter(r=>r.quality.status==='draft').length,400);
 A.equal(a.filter(r=>r.quality.status==='unstarted').length,0);
 A.equal(a.filter(r=>r.quality.status==='verified'||r.quality.status==='published').length,0);
 A.equal(a.filter(r=>r.subject==='estate'&&r.examYear>=2024&&r.quality.status==='draft').length,80);
 A.equal(a.filter(r=>r.subject==='civil'&&r.quality.status==='unstarted').length,0);
 A.equal(a.filter(r=>r.examYear<=2023&&r.quality.status==='unstarted').length,0);
 A.equal(a.filter(r=>r.specialAnswer!=='normal').length,7);
});
test('actual math cross-check: five financial and appraisal numerics',()=>{
 const examples=[
 ['2025-37',5000000*1.05*.95*1.08*1.60,8618400,'8,618,400'],
 ['2025-39',1400000*1.25*200*(1-6/50),308000000,'308,000,000'],
 ['2024-28',300*50000*12+(300*190000-35000000)*.1*6,193200000,'19,320'],
 ['2024-29',Math.min(500000000*.7,60000000*.6/.1)-50000000,300000000,'3억 원'],
 ['2024-37',(625000000*.8/200)*1.04*1.1*100,286000000,'286,000,000']
 ];
 for(const [id,n,want,token] of examples){
  A.ok(Math.abs(n-want)<1e-4,id+' '+n);
  A.ok(recMap.get(id).answerReason.includes(token),id+' explanation must show expected calculation');
  A.ok(recMap.get(id).officialAnswer.length===1);
 }
});
test('P4 audit separates existing 48 estate drafts from all 400 study drafts',()=>{
 const {evaluate}=require('../scripts/audit-p4-v152.cjs'),x=evaluate();
 A.deepEqual(x.issues,[]);A.equal(x.counts.total,400);
 A.equal(x.counts.answerKeyMatches,400);
 A.equal(x.counts.draft,400);A.equal(x.counts.unstarted,0);
 A.equal(x.counts.optionDraftNotes,664);A.equal(x.counts.optionsTotal,2000);
 for(const k of ['sourceChecked','reasonReviewed','published','optionVerified'])A.equal(x.counts[k],0,k);
 A.equal(x.counts.byYearSubject['2024-estate'].draft,40);
 A.equal(x.counts.byYearSubject['2025-estate'].draft,40);
 A.ok(x.special.length===7);A.ok(x.priorityQueueTotal>=160);
 A.ok(x.queue.every(q=>Array.isArray(q.acceptedAnswers)&&q.flags.length));
});
test('P4 dashboard totals and fresh PWA cache paths match source version',()=>{
 const report=json('data/reports/recent-five-coverage.json');
 const p4=json('data/reports/analysis-candidates-v78.json');
 A.equal(report.draftCount,400);A.equal(report.unstartedCount,0);A.equal(report.reasonDraftCount,400);
 A.equal(report.publishedCount,0);
 A.equal(p4.reviewStages.draft,400);A.equal(p4.reviewStages.unstarted,0);
 A.equal(p4.reviewStages.published,0);A.equal(p4.seedOptionReasonDrafts,664);
 const sw=raw('sw.js'),html=raw('index.html');
 A.match(html,/ck-release" content="v156-p6b-tilt-parallel-comparative-lesson"/);
 A.match(sw,/conceptknot-study-v156-curve-slope-before-after/);
 for(const year of years){
  A.ok(sw.includes('./data/explanations/official-'+year+'.json?v=154'));
 }
 A.ok(sw.includes('analysis-candidates-v78.json?v=154'));
 A.ok(raw('assets/ck-study-workbench-v81.js').includes("'.json?v=154'"));
 A.ok(raw('assets/ck-study-editor-v80.js').includes("'.json?v=154'"));
 A.ok(raw('assets/ck-study-p4-v78.js').includes('analysis-candidates-v78.json?v=154'));
 const critical=sw.match(/const CRITICAL=\[([\s\S]*?)\];/);
 A.ok(critical);A.equal((critical[1].match(/'\.\//g)||[]).length,11);
 A.equal(json('vercel.json').git.deploymentEnabled,false);
 A.equal(fs.existsSync(path.join(base,'.github/workflows')),false);
});
