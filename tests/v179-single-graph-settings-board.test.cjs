/* v179 local smoke contract. Run with node --test tests/v179-single-graph-settings-board.test.cjs */
'use strict';
const {test}=require('node:test');
const A=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=f=>fs.readFileSync(f,'utf8');
const Learn=require('../assets/ck-chart-learning-v179.js');
const Motion=require('../assets/ck-graph-motion-v149.js');
const chartsWindow={};vm.runInNewContext(read('assets/ck-charts-v21.js'),{window:chartsWindow});
const charts=chartsWindow.CK21Charts.charts,problems=chartsWindow.CK21Charts.problems;
test('exactly one interactive base chart per selected topic; 17 charts have three short learning steps',()=>{
 A.equal(charts.length,17);
 for(const c of charts){
  const state=Motion.defaultSnapshot(c,60);
  const model={concept:c.answer,example:'생활 사례',advanced:c.answer};
  const out=['demand','supply','both'].includes(c.type)?Motion.outcome(c,state):null;
  const html=Learn.renderLegacy(c,model,out,state,Motion.explain(c,state),problems);
  for(const step of ['쉬운 예시','심화 설명','적용 문제'])A.ok(html.includes(step),c.id);
  A.equal((html.match(/ck179-step/g)||[]).length,3,c.id);
  A.doesNotMatch(html,/<svg|ck141-live-svg|ck142-svg|ck158-policy-svg/,c.id);
 }
});
test('moving only demand changes the example result and quiz answer according to current geometry',()=>{
 const c=charts.find(x=>x.id==='demand-income');
 const first=Motion.defaultSnapshot(c,0);
 const later={...first,value:60,demand:60,demandSign:1};
 const start=Learn.renderLegacy(c,{concept:'전',example:'출발',advanced:'기본'},
  Motion.outcome(c,first),first,Motion.explain(c,first),problems);
 const after=Learn.renderLegacy(c,{concept:'후',example:'소득 증가',advanced:'수요'},
  Motion.outcome(c,later),later,Motion.explain(c,later),problems);
 A.notEqual(start,after);A.match(after,/균형가격 P/);A.match(after,/거래량 Q/);
 A.match(after,/가상단위/);A.match(after,/실제 가격·기출 수치/);
 const p=Learn.problem(c,Motion.outcome(c,later),later,problems);
 A.equal(p.correct,'상승');
 A.ok(Learn.choose(p.signature,'상승',p.correct));
 A.equal(Learn.get(p.signature).ok,true);
 A.ok(Learn.reset(p.signature));A.equal(Learn.get(p.signature),null);
});
test('observation-only diagrams cannot fabricate measured equilibrium numbers',()=>{
 const c=charts.find(x=>x.id==='present-value');
 const html=Learn.renderLegacy(c,{concept:c.answer,example:'금융 예시',advanced:c.answer},
  null,{value:50},Motion.explain(c,Motion.defaultSnapshot(c,50)),problems);
 A.match(html,/도식 관찰 위치/);
 A.doesNotMatch(html,/균형가격 P|거래량 Q/);
});
test('lesson content is HTML escaped, quiz answers remain temporary and outside official OMR',()=>{
 const c=charts.find(x=>x.id==='rent-distance');
 const html=Learn.renderLegacy(c,{concept:'<script>x</script>',example:'<img src=x>',advanced:'<b>x</b>'},
  null,{value:50},null,problems);
 A.doesNotMatch(html,/<script>|<img|<b>x<\/b>/);
 A.match(html,/&lt;img src=x&gt;/);
 A.doesNotMatch(read('assets/ck-chart-learning-v179.js'),/localStorage|sessionStorage|fetch\(/);
});
test('single chart script, settings dock, and narrow up/down rail are wired',()=>{
 const glue=read('assets/ck-study-charts-v79.js');
 const direct=read('assets/ck-graph-direct-v149.js');
 const style=read('assets/ck-chart-learning-v179.css');
 const dock=read('assets/ck-study-workbench-v81.js');
 const dockCss=read('assets/ck-study-workbench-v81.css');
 const board=read('assets/ck-typing-layout-v31.js');
 A.match(glue,/CK179ChartLearning/);A.match(glue,/ck-chart-learning-v179\.js/);
 A.match(direct,/CK179ChartLearning/);A.match(style,/#ck141-concept-lab/);
 A.match(style,/#ck142-theory-studio/);A.match(style,/\.ck158-policy-lab/);
 A.match(dock,/settingsDockRef/);A.match(dock,/#main \.settings-grid/);
 A.match(dockCss,/body\[data-ck-v8-tab="settings"\]/);
 A.match(dockCss,/max-width:850px/);
 A.match(dockCss,/data-ck6-swap/);A.match(dockCss,/data-ck32-board-top/);
 A.match(dockCss,/data-ck31-board-bottom/);
 A.match(board,/narrow/);A.match(board,/칠판을 본문 위에 배치/);
 A.match(read('docs/V179_SINGLE_CHART_THREE_STAGE_SETTINGS_BOARD.md'),/v178의 설명 단일 축약안을 대체/);
});
