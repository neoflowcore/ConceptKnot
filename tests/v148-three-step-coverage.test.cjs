/* ConceptKnot v148: 17 schematic charts + 3 lab topics + 6 numeric scenes.
 * Manual local tests only. No Actions, no installation artifact.
 */
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const read=path=>fs.readFileSync(path,'utf8');
const steps=require('../assets/ck-three-step-v148.js');
const math=require('../assets/ck-concept-math-v141.js');
const models=require('../assets/ck-theory-models-v142.js');
const changes=require('../assets/ck-concept-transition-v144.js');
const chartSource=read('assets/ck-charts-v21.js');
const chartWindow={};vm.runInNewContext(chartSource,{window:chartWindow});
const charts=chartWindow.CK21Charts.charts;
test('all 17 original diagram topics have three distinct visible explanations',()=>{
 assert.equal(charts.length,17);assert.equal(steps.ids.length,17);
 assert.deepEqual([...steps.ids].sort(),[...charts.map(x=>x.id)].sort());
 for(const chart of charts){
  const before=steps.legacy(chart,0),after=steps.legacy(chart,75);
  assert.ok(before&&after,chart.id);
  for(const key of ['concept','example','advanced','warning','before','after'])
   assert.ok(after[key]&&typeof after[key]==='string',chart.id+': '+key);
  assert.notEqual(before.after,after.after,chart.id);
  const html=steps.render(after);
  for(const i of [1,2,3])assert.match(html,new RegExp('data-ck148-tier="'+i+'"'),chart.id);
  for(const label of ['개념','쉬운 예시','심화','변화 전 E₀','변화 후 E₁'])
   assert.ok(html.includes(label),chart.id+': '+label);
  assert.ok(!html.includes('undefined')&&!html.includes('NaN'),chart.id);
 }
});
test('direction-reversed demand and supply graphs do not assert original exam answer',()=>{
 for(const id of ['demand-income','demand-down','demand-substitute','supply-cost','supply-tech','equilibrium-demand','equilibrium-supply']){
  const chart=charts.find(x=>x.id===id);
  const natural=Number(chart.shift)<0?-1:1;
  const same=steps.legacy(chart,60,natural);
  const opposite=steps.legacy(chart,60,-natural);
  assert.notEqual(same.concept,opposite.concept,id);
  assert.match(opposite.concept,/반대 조건/);
  assert.match(opposite.warning,/기출문제/);
  assert.match(opposite.after,/왼쪽|오른쪽/);
 }
});
test('diagram explanation avoids fabricated numeric market equilibrium',()=>{
 const both=steps.legacy(charts.find(c=>c.id==='both-shift'),75);
 assert.match(both.advanced,/상대 이동폭/);
 assert.doesNotMatch(both.concept,/반드시 가격 상승/);
 const pt=steps.legacy(charts.find(c=>c.id==='price-along'),88);
 assert.match(pt.concept,/곡선 위/);
 const stock=steps.legacy(charts.find(c=>c.id==='stock-flow'),70);
 assert.match(stock.advanced,/기초 재고/);
 assert.match(steps.legacy(charts.find(c=>c.id==='cap-rate'),50).advanced,/NOI\/R/);
 assert.match(steps.legacy(charts.find(c=>c.id==='present-value'),50).advanced,/PV=FV/);
 for(const c of charts){const x=steps.legacy(c,30);assert.match(x.note,/학습용/);}
});
test('three-layer render is escaped and cannot inject HTML from question text',()=>{
 const html=steps.render({before:'<img src=x>',after:'E1',concept:'<script>alert(1)</script>',
  example:'" onmouseover=evil',advanced:'x > y',warning:"'danger",note:'& note'});
 assert.doesNotMatch(html,/<script>|<img|onmouseover=evil"/);
 assert.match(html,/&lt;script&gt;/);assert.match(html,/x &gt; y/);
 assert.match(html,/&amp; note/);
});
function browserView(){
 const ctx={window:{CK148LearningSteps:steps}};
 vm.runInNewContext(read('assets/ck-concept-transition-view-v144.js'),ctx);
 return ctx.window.CK144ChangeView;
}
test('real comparison renderer displays all three stages for three graph topics',()=>{
 const view=browserView();
 const variants=[
  changes.market(math.BASE,math.transition(math.BASE,'set-demand',20),math,'market'),
  changes.market(math.BASE,math.transition(math.BASE,'change-price-point',30),math,'elasticity'),
  changes.market(null,null,math,'relation',{x:1,k:2},{x:2,k:2})
 ];
 for(const v of variants){
  const html=view.render(v,'beginner');
  assert.match(html,/class="ck144-change-board"/);
  assert.match(html,/class="ck145-deep"/);
  assert.match(html,/전 E₀/);assert.match(html,/후 E₁/);
  assert.match(html,/data-ck148-tier="1"/);
  assert.match(html,/data-ck148-tier="2"/);
  assert.match(html,/data-ck148-tier="3"/);
  assert.match(html,/심화/);
  assert.match(html,/변경한 조건/);
 }
});
test('six numerical diagram scenes render updated before/after three-stage explanations',()=>{
 const view=browserView();
 for(const id of models.ids){
  const initial=models.initial(id);
  const before=changes.theory(id,initial,initial,models);
  const controlKey=Object.keys(models.S[id].f)[0];
  const f=models.S[id].f[controlKey];
  const next=models.set(id,initial,controlKey,initial[controlKey]+f[3]);
  assert.ok(next,id);
  const after=changes.theory(id,initial,next,models);
  for(const scene of [before,after]){
   const html=view.render(scene,'beginner');
   assert.match(html,/data-ck148-tier="1"/,id);
   assert.match(html,/data-ck148-tier="2"/,id);
   assert.match(html,/data-ck148-tier="3"/,id);
   assert.match(html,/변화 전 E₀/);
   assert.match(html,/변화 후 E₁/);
   assert.match(html,/기본이론/);
   assert.match(html,/ck144-metrics/);
  }
 }
});
test('legacy graph scrub updates all visible cards together without any page scroll control',()=>{
 const hooks={},calls=[];let selection=charts.findIndex(c=>c.id==='demand-income');
 const content={innerHTML:''},note={textContent:''},description={textContent:''};
 const slider={value:'0'},svg={classList:{add(){}},setAttribute(){},querySelector(){return null}};
 const actions={querySelector(){return null},append(el){calls.push('action')}};
 let added;
 const controls={querySelector(){return null},append(el){added=el}};
 const root={querySelector(s){
  if(s==='.ck76-chart-control')return controls;
  if(s==='.ck21-chart-actions')return actions;
  if(s==='svg.ck21-chart-svg'||s==='.ck21-chart-svg')return svg;
  if(s==='[data-ck76-chart-scrub]')return slider;
  if(s==='[data-ck79-chart-note]')return note;
  if(s==='.ck21-chart-explanation')return description;
  if(s==='[data-ck148-legacy]')return content;
  return null;
 },querySelectorAll(){return []}};
 const window={CK148LearningSteps:steps,
  CK21Charts:{charts,getState(){return {selected:selection,phase:false}}},
  CK76Search:{applyScrub(r,p){calls.push(p)}},MutationObserver:null,addEventListener(){}};
 const document={readyState:'complete',head:null,body:null,
  querySelector(s){return s==='.ck21-chart-section'?root:null},
  getElementById(){return null},addEventListener(s,fn){(hooks[s]??=[]).push(fn)},
  createElement(){return {dataset:{},setAttribute(){},type:'button',innerHTML:''}}
 };
 vm.runInNewContext(read('assets/ck-study-charts-v79.js'),{window,document,requestAnimationFrame(f){f()}});
 assert.match(added.innerHTML,/data-ck148-legacy/);
 assert.match(content.innerHTML,/data-ck148-tier="1"/);
 const original=content.innerHTML;
 window.CK79Charts.update(70,{direction:1});
 assert.notEqual(content.innerHTML,original);
 assert.match(content.innerHTML,/도식 조작 70%/);
 assert.match(content.innerHTML,/같은 가격에도 집을 사고/);
 window.CK79Charts.update(70,{direction:-1});
 assert.match(content.innerHTML,/반대 조건/);
 assert.match(content.innerHTML,/소득이 줄면/);
 assert.match(note.textContent,/기출 원래 조건/);
 assert.ok(calls.some(c=>c===70));
 assert.ok(hooks.pointerdown.length);
});
test('release offline routes and asset ordering do not enable CI or alter official records',()=>{
 const html=read('index.html'),sw=read('sw.js');
 const glue=read('assets/ck-study-charts-v79.js');
 assert.ok(html.indexOf('ck-three-step-v148.js?v=149')<html.indexOf('ck-study-charts-v79.js?v=150'));
 assert.match(html,/ck-release" content="v152-p4-160-new-study-drafts"/);
 assert.match(sw,/conceptknot-study-v155-multiphase-direct-grips/);
 assert.match(glue,/data-ck148-legacy/);
 for(const file of ['ck-three-step-v148.js?v=149','ck-three-step-v148.css?v=148',
  'ck-study-charts-v79.js?v=150','ck-concept-transition-view-v144.js?v=148'])
  assert.ok(sw.includes(file==='ck-study-charts-v79.js?v=150'?'ck-study-charts-v79.js?v=153':file),file);
 const core=sw.match(/const CRITICAL=\[([\s\S]*?)\];/);
 assert.ok(core);assert.equal([...core[1].matchAll(/'\.\/[^']+'/g)].length,11);
 assert.equal(JSON.parse(read('data/official-2016-2020.json')).length,400);
 assert.equal(JSON.parse(read('data/official-2021-2025.json')).length,400);
 assert.equal(JSON.parse(read('vercel.json')).git.deploymentEnabled,false);
 assert.equal(fs.existsSync('.github/workflows'),false);
});
