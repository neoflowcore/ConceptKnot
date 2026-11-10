/* ConceptKnot v152 P4 official-A-form study-rationale expansion. Manual Node, no CI. */
'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),json=p=>JSON.parse(read(p));
const years=[2021,2022,2023,2024,2025],official=json('data/official-2021-2025.json'),officialById=new Map(official.map(x=>[x.id,x]));
const data=years.flatMap(y=>json('data/explanations/official-'+y+'.json').records);
const maps=new Map(data.map(x=>[x.questionId,x]));
test('all 400 official A-form question-answer pairs and 2000 option slots remain source-locked',()=>{
 A.equal(official.length,400);A.equal(data.length,400);A.equal(maps.size,400);
 let optionSlots=0;
 for(const r of data){
  const q=officialById.get(r.questionId);A.ok(q,r.questionId);
  A.equal(r.examYear,q.year);A.equal(r.number,q.number);A.equal(r.subject,q.subject);
  A.deepEqual(r.officialAnswer,q.correct);A.equal(r.options.length,5);
  r.options.forEach((o,i)=>{A.equal(o.no,i+1);A.equal(o.verdict,'unreviewed');A.equal(o.sourceChecked,false);A.equal(o.why,'');optionSlots++});
  A.equal(r.quality.optionVerdictsReviewed,0);A.equal(r.quality.sourceChecked,false);
  A.equal(r.quality.reasonReviewed,false);A.equal(r.quality.reviewedBy,null);A.equal(r.quality.reviewedAt,null);
  A.notEqual(r.quality.status,'published');
 }
 A.equal(optionSlots,2000);
});
test('2022–2025 subject matrix: exactly 160 added substantive exam-specific rationales',()=>{
 const expected={
 '2021-estate':0,'2021-civil':0,'2022-estate':40,'2022-civil':0,'2023-estate':40,'2023-civil':0,
 '2024-estate':40,'2024-civil':40,'2025-estate':40,'2025-civil':40
 };
 let count=0,blank=0,notes=0;
 for(const row of data){
  const key=row.examYear+'-'+row.subject,status=row.quality.status;
  if(status==='draft'){
   count++;A.ok(row.summaryEasy.length>=18,row.questionId);
   A.ok(row.answerReason.length>=55,row.questionId);
   A.ok(row.traps.some(t=>t.text.length>=18&&t.verified===false),row.questionId);
  }else{blank++;A.equal(status,'unstarted');A.equal(row.answerReason,'')}
  notes+=row.options.filter(x=>x.draftReason?.trim()).length;
  A.ok(row.sourceRefs.some(x=>x.type==='officialNotice'&&x.verified===true));
 }
 A.equal(count,240);A.equal(blank,160);A.equal(notes,664);
 for(const [key,drafts] of Object.entries(expected)){
  const [year,subject]=key.split('-');
  A.equal(data.filter(x=>x.examYear===+year&&x.subject===subject&&x.quality.status==='draft').length,drafts,key);
 }
 for(let year=2024;year<=2025;year++)for(let n=41;n<=80;n++){
  const row=maps.get(year+'-'+n);
  A.equal(row.options.filter(x=>x.draftReason?.trim()).length,5,row.questionId);
  A.ok(row.questionType.includes('civil_legal_source_review_required'),row.questionId);
 }
});
test('seven source-defined special answer records stay accepted-key separate from truth judgment',()=>{
 const special=data.filter(x=>x.specialAnswer!=='normal');
 A.equal(special.length,7);
 for(const row of special){
  const q=officialById.get(row.questionId);A.deepEqual(row.officialAnswer,q.correct);
  A.equal(row.quality.optionVerdictsReviewed,0);
  A.ok(row.options.every(o=>o.verdict==='unreviewed'&&!o.sourceChecked));
  if(q.correct.length>1&&row.quality.status==='draft')
   A.ok(/(?:전원|특수|모두|공식)/.test(row.answerReason),row.questionId);
 }
 const allAccepted=['2022-10','2023-15','2023-27','2024-67'];
 for(const id of allAccepted){
  const q=officialById.get(id);A.equal(q.correct.length,5,id);
  A.ok(maps.get(id)?.options.every(o=>o.verdict==='unreviewed'));
 }
});
test('independent numeric examples use all given variables and canonical choices',()=>{
 const calculations=[
 ['2022-5',(-.5*5)+(.3*5)+(.4*5),1,'0.4'],
 ['2022-8',(120+20)/(2+2),35,'P=35'],
 ['2022-12',((12.1-(12.1*.45+4.84*.55))/(1.1**2)),3.3,'3.3억원'],
 ['2022-14',10*(50000/25)/(50000/25+32000/4),2,'2억원'],
 ['2022-25',10000/(1000-500),20,'20'],
 ['2022-26',(700+20000*.03-20000*.4*.05)/(20000*.6)*100,7.5,'7.5%'],
 ['2022-29',54*171.06,9237.24,'9,237만원'],
 ['2022-37',(44000000*.875)/(.6*.05+.4*.1),550000000,'550,000,000원'],
 ['2022-39',800000000/200*.9*1.05*.95*150,538650000,'538,650,000원'],
 ['2023-6',28-22,6,'6만원'],
 ['2023-11',(100/320)/(120/540),1.40625,'1.406'],
 ['2023-18',45000000/(.03+.04+.02),500000000,'500,000,000원'],
 ['2023-22',(50000000*.9*(1-.28))/(500000000*.5*.12),1.08,'1.08'],
 ['2023-23',36000/(6000*.85-500-600-400),10,'10'],
 ['2023-28',(12000-750*10)/(750*(100-60)),.15,'15%'],
 ['2023-35',8000000*1.05*.97*1.50,12222000,'12,222,000원'],
 ['2023-36',1200000*1.5*250*(1-8/50),378000000,'378,000,000원']
 ];
 for(const [id,computed,want,token] of calculations){
  A.ok(Math.abs(computed-want)<.0001,id+' => '+computed+' vs '+want);
  A.ok(maps.get(id).answerReason.includes(token),id+' missing formula result token '+token);
 }
});
test('current P4 audit, workbench, editor and offline cache report 240/400 without faking review',()=>{
 const {evaluate}=require('../scripts/audit-p4-v152.cjs'),audit=evaluate();
 A.deepEqual(audit.issues,[]);
 A.equal(audit.counts.total,400);A.equal(audit.counts.draft,240);A.equal(audit.counts.unstarted,160);
 A.equal(audit.counts.optionsTotal,2000);A.equal(audit.counts.optionDraftNotes,664);
 A.equal(audit.counts.answerKeyMatches,400);A.equal(audit.special.length,7);
 for(const v of ['reasonReviewed','sourceChecked','published','optionVerified'])A.equal(audit.counts[v],0,v);
 const report=json('data/reports/recent-five-coverage.json'),panel=json('data/reports/analysis-candidates-v78.json');
 A.equal(report.draftCount,240);A.equal(report.unstartedCount,160);
 A.equal(report.reasonDraftCount,240);A.equal(report.publishedCount,0);
 A.equal(panel.reviewStages.draft,240);A.equal(panel.reviewStages.unstarted,160);
 A.equal(panel.reviewStages.published,0);A.equal(panel.seedOptionReasonDrafts,664);
 A.ok(read('index.html').includes('v152-p4-160-new-study-drafts'));
 const sw=read('sw.js');A.ok(sw.includes('conceptknot-study-v153-case-prediction'));
 for(const y of years)A.ok(sw.includes('./data/explanations/official-'+y+'.json?v=152'));
 A.ok(sw.includes('analysis-candidates-v78.json?v=152'));
 A.ok(read('assets/ck-study-workbench-v81.js').includes("'.json?v=152'"));
 A.ok(read('assets/ck-study-editor-v80.js').includes("'.json?v=152'"));
 A.ok(read('assets/ck-study-p4-v78.js').includes('analysis-candidates-v78.json?v=152'));
 A.equal(json('vercel.json').git.deploymentEnabled,false);
 A.equal(fs.existsSync(path.join(root,'.github/workflows')),false);
 const critical=sw.match(/const CRITICAL=\[([\s\S]*?)\];/);
 A.ok(critical);A.equal((critical[1].match(/'\.\//g)||[]).length,11);
});
