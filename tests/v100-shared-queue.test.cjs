'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=p=>fs.readFileSync(path.resolve(__dirname,'..',p),'utf8');
test('same latest exam and recall decisions feed workbench/review/plan/analytics',()=>{
 const now=Date.now(),bank={};
 for(let i=1;i<=80;i++)bank['2025-'+i]={id:'2025-'+i,year:2025,number:i,
  subject:i<=40?'estate':'civil',verified:true,question:'Q',options:['a','b','c','d','e'],correct:[2]};
 const answers=Array(80).fill(2);answers[0]=1;answers[1]=1;
 const attempts=[{status:'submitted',year:2025,submittedAt:now-5000,answers}];
 const study={review:{'2025-1':{updatedAt:now-1000,nextAt:now+86400000,
  result:'remember'}},mistakes:[],typing:[],recallEvents:[]};
 const window={RECALL_OFFICIAL:bank,addEventListener(){},
  CK79Study:{snapshot:()=>study},
  CK82FullExam:{getAttempts:()=>attempts,checkBank:()=>({ok:true}),gradeAttempt:()=>({estate:0,civil:0})},
  CK83Links:{getRecords:()=>({}),reviewSummary:()=>({assessed:0,reasoned:0,sourceLinked:0})}};
 const document={readyState:'loading',addEventListener(){},getElementById(){return null}};
 const storage={getItem(){return null}};
 for(const f of ['ck-exam-bridge-v86.js','ck-study-review-v79.js','ck-study-plan-v84.js',
  'ck-study-analytics-v83.js','ck-study-workbench-v81.js']){
  vm.runInNewContext(read('assets/'+f),
   {window,document,localStorage:storage,Date,Intl,requestAnimationFrame(){}});
 }
 const bridge=window.CK86ExamBridge.getDue({at:now,attempts,reviews:study.review,mistakes:[],bank});
 const review=window.CK79Review.dueReport(),plan=window.CK84Plan.studyData();
 const stats=window.CK83Analytics.compute({at:now,now,days:7,sessions:attempts,study,
  official:bank,links:{}});
 const work=window.CK81Workbench.dueIds();
 assert.equal(bridge.due,1);assert.equal(bridge.future,1);
 assert.equal(review.due,1);assert.equal(plan.due,1);assert.equal(stats.due,1);
 assert.deepEqual([...work.due],['2025-2']);
 assert.deepEqual([...work.mistakes],['2025-2']);
});
