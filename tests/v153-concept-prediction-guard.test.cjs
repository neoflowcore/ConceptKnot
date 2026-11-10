/* ConceptKnot v153 — manual-only regression for 85 semantic cases,
 * five-case quiz, source integrity, mobile-safe graph boundaries.
 */
'use strict';
const {test}=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const R=require('../assets/ck-legacy-rules-v153.js'),Q=require('../assets/ck-scenario-quiz-v153.js');
const M=require('../assets/ck-graph-motion-v149.js');
const DATA=require('../assets/ck-learning-scenarios-v150.js');
const raw=p=>fs.readFileSync(p,'utf8');
const chartWindow={};vm.runInNewContext(raw('assets/ck-charts-v21.js'),{window:chartWindow});
const charts=chartWindow.CK21Charts.charts;
const matches=(expect,actual)=>expect==='증가'?actual==='증가':expect==='감소'?actual==='감소':expect==='불변'?actual==='불변':true;
test('17 chart topics × 5 distinct cases: 85 grounded scenarios have eligible answers',()=>{
 const audit=R.audit();
 a.deepEqual(audit,{topics:17,cases:85,invalid:[]});
 a.equal(Object.keys(R.rules).length,charts.length);
 for(const c of charts)for(let i=0;i<5;i++){
  const row=R.get(c,i,DATA.legacy);
  a.ok(row,c.id+':'+i);
  a.ok(row.title.length>=2&&row.explanation.length>15,c.id+':'+i);
  a.ok(row.context.includes('판단할 대상'),c.id+':'+i);
  a.ok(row.choices.includes(row.expected),c.id+':'+i);
  a.equal(row.canApply,!!row.action,c.id+':'+i);
  if(c.type==='both'&&row.action){
   const snapshot={...M.defaultSnapshot(c),...row.action,
    value:Math.max(row.action.demand,row.action.supply)};
   const expected=M.outcome(c,snapshot).price;
   a.ok(matches(row.expected,expected),c.id+':'+i+' graph: '+expected+' vs '+row.expected);
  }
 }
});
test('qualitative cases do not apply a misleading reversed x movement',()=>{
 for(const c of charts)for(let i=0;i<5;i++){
  const row=R.get(c,i,DATA.legacy);
  if(row.action){
   a.ok(['demand','supply','both'].includes(c.type)||row.action.progress===80,c.id+':'+i);
  }
 }
 const reverse=R.get(charts.find(c=>c.id==='cap-rate'),1,DATA.legacy);
 a.equal(reverse.canApply,false);
 a.equal(reverse.expected,'증가');
 const fixed=R.get(charts.find(c=>c.id==='supply-cost'),4,DATA.legacy);
 a.equal(fixed.canApply,false);a.equal(fixed.expected,'곡선 이동 없음');
});
test('grading once per case, no pre-reveal graph application, and targeted mistake practice',()=>{
 Q.clear('legacy','demand-income');
 const s=Q.state('legacy','demand-income');
 const chart=charts.find(c=>c.id==='demand-income');
 const r0=R.get(chart,0,DATA.legacy);
 a.equal(Q.applied(s,r0),false);
 a.equal(Q.answer(s,r0,'왼쪽 이동').ok,false);
 a.equal(Q.answer(s,r0,'오른쪽 이동'),null);
 a.deepEqual(Q.summary(s),{attempted:1,correct:0,retry:1,remaining:4});
 a.equal(Q.applied(s,r0),true);
 a.equal(Q.applied(s,r0),false);
 a.equal(Q.nextUnseen(s),1);
 const r1=R.get(chart,1,DATA.legacy);
 a.equal(Q.answer(s,r1,'왼쪽 이동').ok,true);
 a.deepEqual(Q.summary(s),{attempted:2,correct:1,retry:1,remaining:3});
 a.equal(Q.review(s),0);
 a.equal(Q.visible(s,r0),null);
 a.equal(Q.answer(s,r0,'오른쪽 이동').ok,true);
 a.deepEqual(Q.summary(s),{attempted:2,correct:2,retry:0,remaining:3});
 a.equal(Q.review(s),-1);
 a.equal(Q.again(s,r0),true);
 a.equal(Q.visible(s,r0),null);
 a.equal(Q.summary(s).attempted,2);
 a.equal(Q.answer(s,r0,'왼쪽 이동').ok,false);
 a.equal(Q.summary(s).attempted,2);
});
test('numeric grade is invalidated when the underlying baseline/model changes',()=>{
 const s=Q.clear('lab','market');
 const row={scope:'lab',id:'market',index:0,expected:'증가',choices:DATA.steps,numeric:true,from:20,to:30,action:{value:22,kind:'set-demand'},canApply:true};
 a.equal(Q.answer(s,row,'증가').ok,true);
 a.ok(Q.visible(s,row));
 a.equal(Q.applied(s,row),true);
 a.equal(Q.visible(s,{...row,to:31}),null);
 a.equal(Q.applied(s,{...row,to:31}),false);
 a.equal(Q.answer(s,{...row,to:31},'증가').ok,true);
 a.equal(Q.summary(s).attempted,1);
});
test('UI requires actual validated grade before graph action and supports review without recording OMR',()=>{
 const ui=raw('assets/ck-scenario-ui-v150.js');
 a.match(ui,/if\(!QUIZ\.visible\(s,row\)\|\|!row\.canApply\|\|!row\.action\)return/);
 a.match(ui,/data-ck150-review/);
 a.match(ui,/data-ck150-again/);
 a.match(ui,/frozen\.set\(k,row\)/);
 a.doesNotMatch(ui,/localStorage|sessionStorage|fetch\s*\(|XMLHttpRequest/);
 a.match(ui,/CK149GraphEnhance\?\.applyStudyCase/);
 a.match(ui,/CK141ConceptLab\?\.applyStudyCase/);
 a.match(ui,/CK142Theory\?\.applyStudyCase/);
});
test('PWA and source guard: optional bundles, original 800, 11 core, no automated CI',()=>{
 const html=raw('index.html'),sw=raw('sw.js'),loader=raw('assets/ck-study-charts-v79.js');
 a.ok(Buffer.byteLength(html,'utf8')>1000000);
 a.match(html,/v152-p4-160-new-study-drafts/);
 a.match(html,/ck-study-charts-v79\.js\?v=150/);
 a.match(sw,/const CACHE='conceptknot-study-v155-multiphase-direct-grips'/);
 const critical=(sw.match(/const CRITICAL=\[([\s\S]*?)\];/)||[])[1];
 a.equal((critical?.match(/'\.\//g)||[]).length,11);
 for(const f of ['ck-legacy-rules-v153.js','ck-scenario-quiz-v153.js','ck-scenario-ui-v150.js','ck-scenario-ui-v150.css']){
  a.ok(sw.includes(f+'?v=153'),f+' worker');
  a.ok(loader.includes(f+'?v=153'),f+' loader');
 }
 a.ok(sw.includes('ck-study-charts-v79.js?v=153'));
 a.equal(JSON.parse(raw('vercel.json')).git.deploymentEnabled,false);
 a.equal(fs.existsSync('.github/workflows'),false);
 for(const f of ['data/official-2016-2020.json','data/official-2021-2025.json']){
  a.ok(fs.statSync(f).size>500000,f);
 }
});

