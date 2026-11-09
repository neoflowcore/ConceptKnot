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
test('M09 demand u���q�^