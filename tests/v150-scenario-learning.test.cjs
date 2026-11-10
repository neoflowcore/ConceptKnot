/* ConceptKnot v150: manual-only coverage for scenario variants and bound-safe math. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const bank=require('../assets/ck-learning-scenarios-v150.js');
const math=require('../assets/ck-concept-math-v141.js');
const models=require('../assets/ck-theory-models-v142.js');
const raw=x=>fs.readFileSync(x,'utf8');
const win={};vm.runInNewContext(raw('assets/ck-charts-v21.js'),{window:win});
test('26 theory and diagram subjects provide five labeled situations each',()=>{
 assert.equal(win.CK21Charts.charts.length,17);
 assert.equal(Object.keys(bank.legacy).length,17);
 assert.equal(Object.keys(bank.numeric).length,9);
 assert.equal(bank.size,130);
 assert.deepEqual(Object.keys(bank.legacy).sort(),Array.from(win.CK21Charts.charts,x=>x.id).sort());
 assert.deepEqual(Object.keys(bank.numeric).sort(),['market','elasticity','relation',...models.ids].sort());
 for(const [id,v] of Object.entries(bank.legacy)){
  assert.equal(v.length,5,id);
  assert.equal(new Set(v).size,5,id);
 }
 for(const [id,v] of Object.entries(bank.numeric)){
  assert.equal(v.length,5,id);
  assert.equal(new Set(v.map(row=>row[0])).size,5,id);
 }
});
test('45 numeric hypotheticals use the actual graph model and return finite before/after',()=>{
 for(const [id,cases] of Object.entries(bank.numeric))for(let i=0;i<5;i++){
  const state=id==='relation'?{x:1,k:2}:
   id==='market'||id==='elasticity'?{...math.BASE}:models.initial(id);
  const original=JSON.stringify(state),p=bank.calc(id,i,state,math,models);
  assert.ok(p,id+':'+i);
  assert.ok(Number.isFinite(p.before),id+':'+i);
  assert.ok(Number.isFinite(p.after),id+':'+i);
  assert.equal(bank.outcome(p.before,p.after),p.expected,id+':'+i);
  assert.equal(p.apply.topic,id);
  assert.equal(JSON.stringify(state),original,'no mutation '+id+':'+i);
  assert.ok(['증가','감소','불변'].includes(p.expected));
 }
});
test('traps: changed price does not move equilibrium, fixed cost does not change optimal output',()=>{
 const pt=bank.calc('market',4,{...math.BASE},math,models);
 assert.equal(pt.expected,'감소');
 assert.equal(math.solve(pt.beforeState).price,math.solve(pt.afterState).price);
 const slope=bank.calc('elasticity',0,{...math.BASE},math,models);
 assert.equal(slope.expected,'불변');
 const cost=bank.calc('cost',2,models.initial('cost'),math,models);
 assert.equal(cost.expected,'불변');
 const cobweb=bank.calc('cobweb',4,models.initial('cobweb'),math,models);
 assert.equal(cobweb.expected,'불변');
 const relation=bank.calc('relation',4,{x:1,k:2},math,models);
 assert.equal(relation.expected,'불변');
});
test('source and current PWA release contain all scenario learning scripts and correct offline core',()=>{
 const html=raw('index.html'),sw=raw('sw.js'),loader=raw('assets/ck-study-charts-v79.js');
 assert.ok(html.length>1000000,'homepage must not be truncated');
 assert.match(html,/v152-p4-160-new-study-drafts/);
 assert.match(html,/ck-study-charts-v79\.js\?v=150/);
 assert.match(sw,/conceptknot-study-v155-multiphase-direct-grips/);
 const critical=(sw.match(/const CRITICAL=\[([\s\S]*?)\];/)||[])[1];
 assert.ok(critical);
 assert.equal((critical.match(/'\.\//g)||[]).length,11);
 for(const f of ['ck-learning-scenarios-v150.js']){
  assert.ok(sw.includes(f+'?v=150'),f+' cache');
  assert.ok(loader.includes(f+'?v=150'),f+' loader');
 }
 for(const f of ['ck-legacy-rules-v153.js','ck-scenario-quiz-v153.js','ck-scenario-ui-v150.js','ck-scenario-ui-v150.css']){
  assert.ok(sw.includes(f+'?v=153'),f+' cache');
  assert.ok(loader.includes(f+'?v=153'),f+' loader');
 }
 for(const f of ['assets/ck-concept-lab-v141.js','assets/ck-theory-v142.js',
  'assets/ck-graph-direct-v149.js']){
  assert.match(raw(f),/applyStudyCase/);
 }
 assert.equal(JSON.parse(raw('vercel.json')).git.deploymentEnabled,false);
 assert.equal(fs.existsSync('.github/workflows'),false);
});
