/* ConceptKnot v123 — long-range analytics, lazy exam clock, safe evidence review.
 * Manual command: node --test tests/v123-long-range-runtime.test.cjs
 * No GitHub Actions or deployment artifacts are created.
 */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const src=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const DAY=86400000,KST=9*3600000;
const validTime=v=>Number.isFinite(Number(v))&&Number(v)>0;
const dayKey=t=>new Date(Number(t)+KST).toISOString().slice(0,10);
const analytic=src('assets/ck-study-analytics-v83.js');
const computeStart=analytic.indexOf('function compute('),chartStart=analytic.indexOf('function barChart(');
assert.ok(computeStart>0&&chartStart>computeStart);
const funcs=new Function('DAY','KST','validTime','dayKey','bank','window',
 analytic.slice(computeStart,chartStart)+'return {compute,aggregateActivity};')(
 DAY,KST,validTime,dayKey,()=>({}),{});
test('7/30/90/365 time ranges have exact day counts and do not invent activity',()=>{
 const now=Date.parse('2026-11-05T10:00:00Z'),study={typing:[
  {at:now-300*DAY,subject:'estate',accuracy:95,cpm:250},
  {at:now-2*DAY,subject:'estate',accuracy:98,cpm:300}
 ]};
 const input={study,sessions:[],links:{},official:{},now};
 const r7=funcs.compute({...input,days:7}),r30=funcs.compute({...input,days:30});
 const r90=funcs.compute({...input,days:90}),r365=funcs.compute({...input,days:365});
 assert.equal(r7.daily.length,7);assert.equal(r30.daily.length,30);
 assert.equal(r90.daily.length,90);assert.equal(r365.daily.length,365);
 assert.equal(r7.typingCount,1);assert.equal(r90.typingCount,1);assert.equal(r365.typingCount,2);
 assert.equal(r365.sessions,0);assert.equal(r365.accuracy,null);
 assert.equal(r365.firstScore,null);assert.equal(r365.scoreDelta,null);
});
test('90-day seven-day intervals and 365-day calendar months preserve original totals',()=>{
 const dates=(count,start)=>Array.from({length:count},(_,i)=>({
  day:new Date(Date.parse(start)+i*DAY).toISOString().slice(0,10),
  typed:1,recalls:i%2,exams:i===0?1:0}));
 const weekly=funcs.aggregateActivity({days:90,daily:dates(90,'2026-08-08T00:00:00Z')});
 assert.equal(weekly.length,13);assert.equal(weekly[0].typed,7);
 assert.equal(weekly[12].typed,6);
 assert.equal(weekly.reduce((n,x)=>n+x.typed,0),90);
 const months=funcs.aggregateActivity({days:365,daily:dates(365,'2025-11-06T00:00:00Z')});
 assert.equal(months.length,13);
 assert.equal(months.reduce((n,x)=>n+x.typed,0),365);
 assert.equal(months.reduce((n,x)=>n+x.exams,0),1);
 const days=funcs.aggregateActivity({days:7,daily:dates(7,'2026-10-30T00:00:00Z')});
 assert.equal(days.length,7);
});
test('concept labels are loaded on explicit analytics open; same-tab exam submission refreshes',()=>{
 const links=src('assets/ck-study-links-v83.js');
 assert.match(links,/loadLabels:load/);assert.match(links,/getLabels:/);
 assert.match(analytic,/function ensureConceptLabels/);
 assert.match(analytic,/ck:exam-submitted/);
 assert.match(analytic,/\[7,30,90,365\]\.map/);
 assert.match(analytic,/aggregateActivity\(r\)/);
});
test('exam timer runs only while active and visible, exact time uses deadlineAt',()=>{
 const exam=src('assets/ck-full-exam-v82.js');
 const bank={};for(let n=1;n<=80;n++)bank['2025-'+n]={
  id:'2025-'+n,year:2025,number:n,verified:true,subject:n<=40?'estate':'civil',
  question:'실전 연습 문항',options:['a','b','c','d','e'],correct:[1]};
 const records=new Map(),domHandlers={},winHandlers={},intervals=[],cleared=[];
 const doc={readyState:'loading',hidden:false,
  addEventListener(n,fn){domHandlers[n]=fn},getElementById(){return null},
  body:{classList:{remove(){}}}};
 const win={RECALL_OFFICIAL:bank,
  addEventListener(n,fn){winHandlers[n]=fn},clearInterval(id){cleared.push(id)}};
 const store={getItem:k=>records.get(k)??null,setItem:(k,v)=>records.set(k,v)};
 vm.runInNewContext(exam,{window:win,document:doc,localStorage:store,
  setInterval:(fn,delay)=>{intervals.push({fn,delay});return intervals.length},
  requestAnimationFrame:()=>1,Event:class{constructor(type){this.type=type;}}});
 const api=win.CK82FullExam;
 assert.ok(api);assert.equal(api.getState().clockTicking,false);
 assert.equal(intervals.length,0,'idle document must not run 1Hz interval');
 assert.equal(api.start(2025),true);assert.equal(api.getState().clockTicking,true);
 assert.equal(intervals.length,1);assert.equal(intervals[0].delay,1000);
 assert.equal(api.pause(),true);assert.equal(api.getState().clockTicking,false);
 assert.deepEqual(cleared,[1]);
 assert.equal(api.resume(),true);assert.equal(intervals.length,2);
 doc.hidden=true;domHandlers.visibilitychange();assert.equal(api.getState().clockTicking,false);
 doc.hidden=false;domHandlers.visibilitychange();assert.equal(api.getState().clockTicking,true);
 assert.equal(api.finish('manual'),true);assert.equal(api.getState().clockTicking,false);
 assert.equal(JSON.parse(records.get('ck82-exam-sessions-v1')).history.length,1);
 assert.equal(intervals.length,3);
 assert.match(exam,/ck:exam-submitted/);
});
test('cross-store review identifies exact option indices while never writing personal answers',()=>{
 const js=src('assets/ck-data-diagnostics-v88.js');
 const start=js.indexOf('function crossEvidenceAudit('),stop=js.indexOf('function crossRows(',start);
 assert.ok(start>0&&stop>start);
 const cross=new Function('window','const textPresent=x=>typeof x==="string"&&!!x.trim();'+
  js.slice(start,stop)+'return crossEvidenceAudit;')({});
 const q={id:'2025-1',year:2025,number:1,verified:true,subject:'estate',
  question:'시뮬레이션',options:['a','b','c','d','e'],correct:[1,2,3,4,5]};
 const a={'2025-1':{optionNotes:{'1':{assessment:'true',source:'원문 1',reason:'메모'}}}};
 const b={'2025-1':{options:[{no:1,verdict:'false',source:'원문 2',why:'메모'}]}};
 const before=[JSON.stringify(a),JSON.stringify(b)];
 const result=cross({'2025-1':q},a,b),row=result.rows[0];
 assert.deepEqual([...row.conflictIndices],[1]);assert.deepEqual([...row.differentIndices],[1]);
 assert.deepEqual([...row.missingIndices],[2,3,4,5]);
 assert.equal(result.complete,false);
 assert.deepEqual([JSON.stringify(a),JSON.stringify(b)],before);
 assert.match(js,/function crossReportFresh\(\)/);
 assert.match(js,/기존 검사 결과와 현재 공식 문제\/개인 메모가 다릅니다/);
});
test('new QA items preserve previous storage schema',()=>{
 const qa=src('assets/ck-manual-qa-v115.js');
 assert.equal([...qa.matchAll(/\{id:'[-a-z0-9]+',group:/g)].length,27);
 assert.match(qa,/id:'annual-stats'/);assert.match(qa,/id:'evidence-cross-800'/);
 assert.match(qa,/id:'exam-idle-clock'/);
 assert.match(qa,/personal-v115-manual-qa/);
});
test('offline cache handles old index query version, no Actions or auto deployment',()=>{
 const sw=src('sw.js'),config=JSON.parse(src('vercel.json'));
 assert.match(sw,/conceptknot-study-v136-nav-voice-plan/);
 assert.match(sw,/ignoreSearch:true/);
 assert.match(sw,/ck-study-analytics-v83\.js\?v=117/);
 assert.match(sw,/ck-full-exam-v82\.js\?v=134/);
 assert.match(sw,/ck-data-diagnostics-v88\.js\?v=125/);
 assert.equal(config.git.deploymentEnabled,false);
 assert.equal(fs.existsSync(path.join(__dirname,'..','.github','workflows')),false);
});
