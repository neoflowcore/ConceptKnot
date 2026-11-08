/* ConceptKnot v141 P6-B deterministic numeric + non-destructive data contract.
 * Run manually: node --test tests/v141-concept-graph.test.cjs
 */
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const M=require('../assets/ck-concept-math-v141.js');
const base=M.copy(M.BASE);
const solve=(s,p,q)=>{const x=M.solve(s);assert.equal(x.ok,true);assert.equal(x.price,p);assert.equal(x.quantity,q)};
test('M01 base equilibrium E0',()=>solve(base,25,70));
test('M02 demand right shifts price and quantity up',()=>{
 const s={...base,u:20};solve(s,30,80);
 assert.match(M.describe(base,s,'set-demand').result,/균형가격 25 → 30/);
});
test('M03 demand left shifts both down',()=>solve({...base,u:-20},20,60));
test('M04 supply right lowers price and raises quantity',()=>solve({...base,v:20},20,80));
test('M05 supply left raises price and lowers quantity',()=>solve({...base,v:-20},30,60));
test('M06 P=30 demand quantity is not an equilibrium',()=>{
 const p=M.point(base,30);assert.equal(p.qd,60);
 assert.match(M.describe(base,{...base,price:30},'change-price-point').caution,/곡선 위/);
});
test('M07 P=30 supply quantity is not an equilibrium',()=>assert.equal(M.point(base,30).qs,80));
test('M08 simultaneous u20 v20 price unchanged',()=>{
 solve({...base,u:20,v:20},25,90);
 assert.match(M.describe(base,{...base,u:20,v:20},'set-demand').caution,/상대적인 이동 폭/);
});
test('M09 demand u40 supply v20 both rise',()=>solve({...base,u:40,v:20},30,100));
test('M10 demand u20 supply v40: quantity up price down',()=>solve({...base,u:20,v:40},20,100));
test('M11 transactional drag/undo/redo/reset and comparison restore',()=>{
 const h=M.createHistory();
 assert.equal(h.begin(),true);assert.equal(h.preview('set-demand',12),true);
 assert.equal(h.preview('set-demand',20),true);assert.equal(h.finish(),true);
 solve(h.state,30,80);solve(h.previous,25,70);
 assert.equal(h.apply('set-supply',20),true);solve(h.state,25,90);
 assert.equal(h.undo(),true);solve(h.state,30,80);
 assert.equal(h.redo(),true);solve(h.state,25,90);
 assert.equal(h.reset(),true);solve(h.state,25,70);
 const exported=h.export(),reloaded=M.createHistory(exported);
 assert.deepEqual(reloaded.state,h.state);assert.deepEqual(reloaded.previous,h.previous);
 assert.equal(reloaded.undo(),true);solve(reloaded.state,25,90);
});
test('M12 tampered state, domain limits, cancellation and safe reload',()=>{
 assert.equal(M.sanitize({...base,b:0}),null);
 assert.equal(M.sanitize({...base,u:Infinity}),null);
 const h=M.createHistory({version:1,state:{...base,b:0},previous:base,action:'invalid',past:[],future:[],mode:'free',topic:'market'});
 solve(h.state,25,70);
 assert.equal(h.apply('set-demand',150),true);assert.equal(h.state.u,80);
 assert.equal(h.begin(),true);assert.equal(h.preview('set-supply',40),true);
 assert.equal(h.cancel(),true);assert.equal(h.state.v,0);
 assert.equal(h.isDragging,false);
 const next=M.createHistory(h.export());assert.deepEqual(next.state,h.state);
 assert.equal(next.export().version,1);
});
test('slope drag rotates at price 25, preserves fixed quantity and changes elasticity',()=>{
 const d=M.transition(base,'adjust-demand-slope',3);
 const s=M.transition(base,'adjust-supply-slope',3);
 assert.equal(M.point(d,25).qd,M.point(base,25).qd);
 assert.equal(M.point(s,25).qs,M.point(base,25).qs);
 assert.notEqual(M.point(d,25).demandElasticity,M.point(base,25).demandElasticity);
});
test('direct and inverse relation preserve ratio/product; invalid domain rejected',()=>{
 const r=M.relation(2,2);assert.equal(r.direct,4);assert.equal(r.inverse,1);
 assert.equal(r.ratio,2);assert.equal(r.product,2);
 assert.equal(M.relation(2,0),null);
});
test('unreviewed candidate, missing evidence and fabricated official links stay blocked',()=>{
 const q={id:'2025-9',verified:true,subject:'estate'};
 const row={questionId:q.id,verificationStatus:'unreviewed',coreConceptIds:[],evidenceIds:[]};
 assert.equal(M.verifiedLink(row,q,'estate.land.demand'),false);
 assert.equal(M.verifiedLink({...row,verificationStatus:'verified',coreConceptIds:['estate.land.demand']},q,'estate.land.demand'),false);
 assert.equal(M.verifiedLink({...row,verificationStatus:'verified',coreConceptIds:['estate.land.demand'],evidenceIds:['source-test']},{...q,verified:false},'estate.land.demand'),false);
});
test('v141 P6-B preserves official bank, weak session keys, legacy charts and no automatic CI',()=>{
 const old=fs.readFileSync('assets/ck-charts-v21.js','utf8');
 const glue=fs.readFileSync('assets/ck-study-charts-v79.js','utf8');
 const lab=fs.readFileSync('assets/ck-concept-lab-v141.js','utf8');
 const css=fs.readFileSync('assets/ck-concept-lab-v141.css','utf8');
 const sw=fs.readFileSync('sw.js','utf8');
 assert.match(glue,/ck141Ensure/);assert.match(glue,/CK141ConceptLab/);
 assert.match(glue,/ck-concept-math-v141/);assert.match(glue,/ck-concept-lab-v141/);
 assert.match(lab,/localStorage\.getItem\(KEY\)/);
 assert.match(lab,/storeEnabled=false/);
 assert.match(lab,/setPointerCapture/);assert.match(lab,/pointercancel/);
 assert.match(lab,/role="slider"/);
 assert.match(css,/@media\(max-width:780px\)/);
 assert.match(old,/const charts=\[/);assert.match(old,/equilibriumPoint/);
 assert.match(sw,/conceptknot-study-v143/);
 assert.doesNotMatch(lab,/localStorage\.(clear|removeItem)\('(?!ck141)/);
 const raw=JSON.parse(fs.readFileSync('data/official-2021-2025.json','utf8'));
 assert.equal(raw.length,400);
});
test('UI JavaScript parses without DOM or network side effects',()=>{
 const lab=fs.readFileSync('assets/ck-concept-lab-v141.js','utf8');
 const context={window:{addEventListener(){}},document:{addEventListener(){}},Event:function(){}};
 vm.runInNewContext(fs.readFileSync('assets/ck-concept-math-v141.js','utf8'),context);
 context.window.CK141GraphMath&&assert.ok(context.window.CK141GraphMath.solve);
 // In this isolated test there is no localStorage: startup must be guarded.
 vm.runInNewContext(lab,context);
 assert.equal(typeof context.window.CK141ConceptLab?.mount,'function');
});
