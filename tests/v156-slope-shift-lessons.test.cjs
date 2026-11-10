/* ConceptKnot v156: manually run Node tests; no CI workflows. */
'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs');
const M=require('../assets/ck-graph-motion-v149.js'),read=p=>fs.readFileSync(p,'utf8');
const both={id:'both-shift',type:'both',shift:65,title:'수요와 공급 동시 이동',question:'가격을 확정할 수 있을까?',answer:'상대 이동 폭을 보세요.'};
const market=type=>({...both,type});
const near=(a,b)=>A.ok(Math.abs(a-b)<1e-8,String(a)+' != '+String(b));
test('initial D/S geometry remains original; no static data mutation',()=>{
 const d=M.curveGeometry('demand'),s=M.curveGeometry('supply');
 A.equal(d.d,'M 100 86.00 L 485 286.00');A.equal(s.d,'M 110 300.00 L 480 80.00');
 near(d.cx,292.5);near(d.cy,186);near(s.cx,295);near(s.cy,190);
 A.equal(M.curveGeometry('invalid'),null);
});
test('only demand slope changes around fixed midpoint; supply untouched',()=>{
 const a=M.defaultSnapshot(both),b=M.adjustSlope(a,both,'demand',35),d=M.curveGeometry('demand',b);
 A.equal(b.demandSlope,135);A.equal(b.supplySlope,100);
 A.equal(M.offsets(both,b).demand,0);
 near(d.cx,292.5);near((d.y1+d.y2)/2,186);
 A.ok(d.y1<86&&d.y2>286);A.equal(a.demandSlope,100);
});
test('supply slope changes around fixed midpoint independently',()=>{
 const a=M.defaultSnapshot(both),b=M.adjustSlope(a,both,'supply',-30);
 A.equal(b.supplySlope,70);A.equal(b.demandSlope,100);
 near(M.curveGeometry('supply',b).cy,190);
 A.ok(M.curveGeometry('supply',b).y1<300);
 near(M.curveGeometry('demand',b).y1,86);
});
test('clamp extreme slope, validate input and retain demand/supply orientation',()=>{
 const a=M.defaultSnapshot(both);
 A.equal(M.adjustSlope(a,both,'demand',-999).demandSlope,55);
 A.equal(M.adjustSlope(a,both,'supply',999).supplySlope,160);
 A.equal(M.adjustSlope(a,both,'supply',NaN),null);
 A.equal(M.adjustSlope(a,{type:'stock'},'demand',10),null);
 for(const k of [55,100,160]){
  const s={...a,demandSlope:k,supplySlope:k};
  A.ok(M.curveGeometry('demand',s).slope>0);
  A.ok(M.curveGeometry('supply',s).slope<0);
 }
});
test('touch slope handle changes angle without translating either curve',()=>{
 const a=M.defaultSnapshot(both),r={left:0,top:0,width:560,height:348};
 const b=M.drag(a,both,'slope-demand',{clientX:485,clientY:286},{clientX:485,clientY:316},r);
 A.equal(b.demandSlope,130);A.equal(b.demand,0);A.equal(b.supply,0);
 const c=M.drag(a,both,'slope-supply',{clientX:480,clientY:80},{clientX:480,clientY:47},r);
 A.equal(c.supplySlope,130);A.equal(c.demandSlope,100);
});
test('slope pivot recomputes E1; subpixel noise never becomes a price claim',()=>{
 const a=M.defaultSnapshot(both),start=M.outcome(both,a),end=M.outcome(both,M.adjustSlope(a,both,'demand',30));
 near(start.start.x,start.end.x);near(start.start.y,start.end.y);
 A.notEqual(end.end.x,start.end.x);A.equal(end.slopeChanged,true);
 A.equal(end.price,'불변');A.equal(end.quantity,'불변');
});
test('own-demand and own-supply translation directions remain correct',()=>{
 const a=M.defaultSnapshot(both);
 const pairs=[
  ['demand',50,'증가','증가'],['demand',-50,'감소','감소'],
  ['supply',50,'감소','증가'],['supply',-50,'증가','감소']];
 for(const [type,step,price,quantity] of pairs){
  const c=market(type),s=M.nudge(a,c,type,step),out=M.outcome(c,s);
  A.equal(out.price,price);A.equal(out.quantity,quantity);
 }
});
test('history records slopes and signed shifts with undo redo reset',()=>{
 const h=M.timeline(both),a=h.state,b=M.adjustSlope(a,both,'supply',30);
 h.set(b);A.equal(h.commit(a),true);
 const c=M.nudge(h.state,both,'demand',-20);
 h.set(c);A.equal(h.commit(b),true);A.equal(h.state.demandSign,-1);
 A.deepEqual(h.undo(),b);A.deepEqual(h.undo(),a);
 A.deepEqual(h.redo(),b);A.deepEqual(h.redo(),c);
 A.equal(h.reset().supplySlope,100);
});
test('easy and advanced explanations distinguish slope, shift and elasticity',()=>{
 const a=M.defaultSnapshot(both),b=M.adjustSlope(a,both,'demand',15),x=M.explain(both,b);
 A.match(x.action,/기울기 변경/);A.match(x.easy,/중앙 위치는 고정/);
 A.match(x.advanced,/가격탄력성/);A.match(x.slope,/실제 수요·가격 변화율이 아님/);
 A.match(x.exam,/원래 조건의 학습 설명/);A.match(x.exam,/그대로 적용하지 마세요/);
 A.equal(x.schematic,true);
});
test('economic exam explanation distinguishes own-price along-curve movement',()=>{
 const c=market('demand'),x=M.explain(c,M.nudge(M.defaultSnapshot(c),c,'demand',40));
 A.match(x.exam,/해당 재화 자체의 가격 변화/);
 A.match(x.exam,/기존 곡선 위 이동/);
 A.match(x.easy,/공급 불변의 수요 증가/);
});
test('simultaneous shift and slope cannot generalize one-sided demand answer',()=>{
 const a=M.nudge(M.defaultSnapshot(both),both,'demand',40);
 const b=M.nudge(a,both,'supply',20),c=M.adjustSlope(b,both,'supply',20);
 const x=M.explain(both,c);
 A.match(x.action,/평행이동 \+ 기울기 변경/);
 A.match(x.easy,/새 교점을 계산해야/);
 A.match(x.advanced,/두 곡선이 동시에 움직이거나 기울기도 바뀌면/);
});
test('UI includes draggable endpoints, accessible controls, before/after theory and mobile pan',()=>{
 const src=read('assets/ck-graph-direct-v149.js'),css=read('assets/ck-graph-direct-v149.css');
 for(const token of ['data-ck156-slope="-15"','data-ck156-slope="15"',
  'data-ck156-slope-handle','data-ck156-easy','data-ck156-advanced',
  'data-ck156-exam','data-ck156-action','data-ck156-status'])
  A.ok(src.includes(token),'missing '+token);
 A.match(src,/path\?\.setAttribute\?\.\('d',shape\.d\)/);
 A.match(css,/touch-action:pan-y/);
 A.match(css,/ck156-slope-handle\{[\s\S]*?touch-action:none/);
 A.match(src,/setPointerCapture/);
});
test('slope math has no user data write, CI trigger or background animation',()=>{
 const src=read('assets/ck-graph-direct-v149.js')+read('assets/ck-graph-motion-v149.js');
 A.doesNotMatch(src,/localStorage\.setItem|sessionStorage\.setItem|fetch\(|setInterval\(/);
 A.equal(fs.existsSync('.github/workflows'),false);
 A.equal(JSON.parse(read('vercel.json')).git.deploymentEnabled,false);
});

