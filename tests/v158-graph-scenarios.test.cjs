/* ConceptKnot v158: 17-graph scenarios, pure calculations and immutable learning explanations. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const Motion=require('../assets/ck-graph-motion-v149.js');
const ctx={window:{},document:{}};
vm.runInNewContext(fs.readFileSync('assets/ck-charts-v21.js','utf8'),ctx);
const charts=Array.from(ctx.window.CK21Charts.charts);
const market=charts.filter(c=>['demand','supply','both'].includes(c.type));
const observe=charts.filter(c=>!['demand','supply','both'].includes(c.type));
test('original seventeen chart identities remain eight market and nine observation lessons',()=>{
 assert.equal(charts.length,17);assert.equal(market.length,8);assert.equal(observe.length,9);
 assert.equal(new Set(charts.map(c=>c.id)).size,17);
});
test('all seventeen graph lessons provide intuitive everyday examples and advanced theory',()=>{
 for(const c of charts){
  const lesson=Motion.explain(c,Motion.defaultSnapshot(c));
  assert.ok(lesson?.easy?.length>20,c.id);
  assert.ok(lesson?.advanced?.length>20,c.id);
  assert.ok(lesson?.exam?.length>20,c.id);
  assert.ok(lesson?.example?.length>25,c.id);
  assert.equal(lesson.schematic,true,c.id);
 }
});
test('normal-good income increase shifts demand right, raising price and quantity in stylized model',()=>{
 const c=charts.find(c=>c.id==='demand-income'),initial=Motion.defaultSnapshot(c);
 const altered=Motion.scenarioState(c,initial,'income-up');
 assert.equal(altered.demandSign,1);assert.ok(altered.demand>0);
 assert.equal(Motion.outcome(c,altered).price,'증가');
 assert.equal(Motion.outcome(c,altered).quantity,'증가');
 assert.equal(initial.value,0);
});
test('building cost increase shifts supply left, raising price and reducing quantity',()=>{
 const c=charts.find(c=>c.id==='supply-cost'),s=Motion.defaultSnapshot(c);
 const next=Motion.scenarioState(c,s,'cost-up'),out=Motion.outcome(c,next);
 assert.equal(next.supplySign,-1);assert.equal(out.price,'증가');
 assert.equal(out.quantity,'감소');
});
test('technology improvement shifts supply right, reducing price and increasing quantity',()=>{
 const c=charts.find(c=>c.id==='supply-tech'),s=Motion.defaultSnapshot(c);
 const out=Motion.outcome(c,Motion.scenarioState(c,s,'technology-up'));
 assert.equal(out.price,'감소');assert.equal(out.quantity,'증가');
});
test('invalid graph/situation mappings do not mutate state',()=>{
 const c=charts.find(c=>c.id==='demand-income'),s=Motion.defaultSnapshot(c);
 assert.equal(Motion.scenarioState(c,s,'cost-up'),null);
 assert.equal(Motion.scenarioState(c,s,'nonexistent'),null);
 assert.equal(Motion.scenarioState(charts.find(c=>c.id==='ceiling'),s,'income-up'),null);
 assert.equal(s.value,0);
});
test('new scenarios participate in normal undo/redo without writing user records',()=>{
 const c=charts.find(c=>c.id==='both-shift'),timeline=Motion.timeline(c);
 const before=timeline.state,next=Motion.scenarioState(c,before,'technology-up');
 timeline.set(next);assert.equal(timeline.commit(before),true);
 assert.ok(timeline.undo());assert.equal(timeline.state.supply,0);
 assert.ok(timeline.redo());assert.equal(timeline.state.supply,60);
});
test('policy model does not misrepresent actual prices or legal expert review',()=>{
 const code=fs.readFileSync('assets/ck-policy-lab-v158.js','utf8');
 for(const tag of ['data-ck158-outcome','data-ck158-advanced','data-ck158-example',
  'data-ck158-policy-svg','data-ck158-mode="floor"','pointercancel','lostpointercapture'])
  assert.ok(code.includes(tag),tag);
 assert.ok(code.includes('실제 가격·거래량'));
 assert.ok(code.includes('if(document.hidden)'));
});
