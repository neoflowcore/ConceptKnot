/* ConceptKnot v178: run manually from repository root. No CI/artifacts. */
'use strict';
const {test}=require('node:test');
const A=require('node:assert/strict'),fs=require('node:fs');
const C=require('../assets/ck-graph-compact-v178.js');
const M=require('../assets/ck-graph-motion-v149.js');
const read=f=>fs.readFileSync(f,'utf8');
const chart={id:'demand-income',title:'수요 증가',type:'demand',shift:65};
test('market curve movement updates hypothetical before/after price and quantity',()=>{
 const before=M.defaultSnapshot(chart),after={...before,value:60,sign:1,demand:60,demandSign:1};
 const h0=C.renderLegacy(chart,{concept:'조건 전',example:'가상 사례'},M.outcome(chart,before),before);
 const h1=C.renderLegacy(chart,{concept:'조건 후',example:'가상 사례'},M.outcome(chart,after),after);
 A.match(h1,/data-ck178-summary/);A.match(h1,/균형가격 P/);A.match(h1,/균형거래량 Q/);
 A.notEqual(h0,h1);A.match(h1,/수요 증가/);A.match(h1,/가상단위/);
 A.match(h1,/실제 시장수치·기출 정답이 아닙니다/);
});
test('observation charts show position, never invented equilibrium numbers',()=>{
 const html=C.renderLegacy({id:'stock-flow',type:'stock'},{concept:'저량과 유량',example:'재고 100'},null,{value:55});
 A.match(html,/관찰 위치 · 도식 단계/);A.match(html,/>55</);
 A.doesNotMatch(html,/균형가격|균형거래량/);
});
test('all displayed text is escaped',()=>{
 const html=C.renderLegacy({id:'rent-distance',type:'distance'},
  {concept:'<script>bad</script>',example:'<img src=x>'},null,{value:20});
 A.doesNotMatch(html,/<script>|<img/);A.match(html,/&lt;script&gt;/);A.match(html,/&lt;img/);
});
test('old drag engine and math are retained, compact styles remove duplicated panels',()=>{
 const glue=read('assets/ck-study-charts-v79.js'),direct=read('assets/ck-graph-direct-v149.js');
 const css=read('assets/ck-graph-compact-v178.css');
 A.match(glue,/CK178GraphCompact/);A.match(glue,/ck-graph-compact-v178\.js/);
 A.match(direct,/CK178GraphCompact/);A.match(direct,/ck178-extra/);
 A.match(css,/ck141-columns/);A.match(css,/ck142-layout/);
 A.match(read('docs/V178_SINGLE_CHART_COMPACT_PLAN_2026-11-15.md'),/V174_WEB_APP_PAUSE/);
});
