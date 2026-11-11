/* v158 policy ceiling/floor comparisons: Node-only, no browser or external resources. */
'use strict';
const {test}=require('node:test');
const A=require('node:assert/strict');
const math=require('../assets/ck-policy-math-v158.js');
test('schematic D/S intersection is finite and inside the diagram',()=>{
  A.ok(math.equilibrium.x>180&&math.equilibrium.x<400);
  A.ok(math.equilibrium.y>120&&math.equilibrium.y<270);
});
test('binding ceiling is BELOW equilibrium price and shows shortage Qd > Qs',()=>{
  const a=math.evaluate('ceiling',250);
  A.equal(a.kind,'shortage');A.equal(a.binding,true);
  A.ok(a.quantityDemand>a.quantitySupply);
  A.ok(a.size>0);A.equal(a.pricePosition,'below');A.equal(a.schematic,true);
});
test('binding floor is ABOVE equilibrium price and shows surplus Qs > Qd',()=>{
  const a=math.evaluate('floor',125);
  A.equal(a.kind,'surplus');A.equal(a.binding,true);
  A.ok(a.quantitySupply>a.quantityDemand);
  A.ok(a.size>0);A.equal(a.pricePosition,'above');
});
test('nonbinding ceiling/floor never claim shortage or surplus',()=>{
  const below=math.evaluate('ceiling',125),above=math.evaluate('floor',260);
  for(const a of [below,above]){A.equal(a.kind,'none');A.equal(a.binding,false);A.equal(a.size,0)}
});
test('the exact equilibrium never counts as a binding policy',()=>{
  for(const mode of ['ceiling','floor']){
    const a=math.evaluate(mode,math.equilibrium.y);
    A.equal(a.kind,'none');A.equal(a.binding,false);
  }
});
test('invalid input is rejected and extreme pointers are clamped',()=>{
  A.throws(()=>math.evaluate('anything',170),RangeError);
  A.throws(()=>math.evaluate('ceiling',NaN),RangeError);
  A.throws(()=>math.evaluate('floor','bad'),RangeError);
  A.equal(math.evaluate('floor',-100).y,math.limits.minY);
  A.equal(math.evaluate('ceiling',9999).y,math.limits.maxY);
});
test('a policy update is pure and cannot change a previously returned state',()=>{
  const a=math.evaluate('ceiling',240),b=math.evaluate('ceiling',260);
  A.notEqual(a.y,b.y);A.equal(a.y,240);
  A.equal(Object.isFrozen(a),true);
});
