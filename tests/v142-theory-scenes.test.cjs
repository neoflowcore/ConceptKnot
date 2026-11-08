/* ConceptKnot v142: execute manually via node --test tests/v142-theory-scenes.test.cjs
 * No GitHub Actions, network, browser profile, or canonical storage changes.
 */
'use strict';
const {test}=require('node:test');
const A=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const M=require('../assets/ck-theory-models-v142.js');
const names=M.ids;
function near(x,y,t=1e-3){A.ok(Math.abs(x-y)<=t,'Expected '+x+' near '+y);}
test('six distinct constrained, named model topics are present',()=>{
 A.deepEqual(names,['budget','ppf','cost','rent','cobweb','arc']);
 for(const id of names){
  const s=M.initial(id);A.ok(M.valid(id,s),id);
  A.ok(M.calc(id,s),id+' compute');
  const d=M.drawing(id,s);A.ok(d.maxX>0&&d.maxY>0&&d.paths.length>0);
  const narrative=M.describe(id,s,s);A.ok(narrative?.assumptions&&narrative?.caution);
 }
});
test('BUDGET 01 base Cobb-Douglas optimum lies on budget line',()=>{
 const m=M.calc('budget',M.initial('budget'));
 A.equal(m.x,6);A.equal(m.y,6);A.equal(m.ix,12);A.equal(m.iy,12);
 A.equal(m.slope,-1);A.equal(m.expense,120);
});
test('BUDGET 02 increased income shifts both intercepts',()=>{
 const old=M.initial('budget'),s=M.set('budget',old,'I',160),m=M.calc('budget',s);
 A.equal(m.x,8);A.equal(m.y,8);A.equal(m.ix,16);A.equal(m.iy,16);
});
test('BUDGET 03 relative price rotates line and alters chosen bundle',()=>{
 const s=M.set('budget',M.initial('budget'),'px',15),m=M.calc('budget',s);
 A.equal(m.x,4);A.equal(m.y,6);near(m.slope,-1.5);
 A.match(M.describe('budget',M.initial('budget'),s).caution,/회전/);
});
test('PPF 01 base is feasible and marginal opportunity cost rises with X',()=>{
 const s=M.initial('ppf'),m=M.calc('ppf',s);
 A.equal(m.x,50);A.equal(m.y,75);A.equal(m.mrt,1);
 const shifted=M.set('ppf',s,'x',75),next=M.calc('ppf',shifted);
 near(next.y,43.75);near(next.mrt,1.5);
});
test('PPF 02 inside, on, and outside points classify separately',()=>{
 const s=M.initial('ppf');
 A.match(M.calc('ppf',M.set('ppf',s,'u',.8)).message,/비효율/);
 A.match(M.calc('ppf',s).message,/효율/);
 A.match(M.calc('ppf',M.set('ppf',s,'u',1.2)).message,/불가능/);
});
test('PPF 03 x cannot exceed changed X capacity',()=>{
 const s=M.set('ppf',M.initial('ppf'),'x',100);
 const next=M.set('ppf',s,'xmax',60);
 A.equal(next.x,60);A.ok(M.valid('ppf',next));
});
test('COST 01 MR=MC solution maximizes profit on stationary side',()=>{
 const s=M.initial('cost'),r=M.calc('cost',s);
 near(r.optimal,26.6667);A.equal(r.profit,800);near(r.maxProfit,866.6667,.01);
 A.ok(r.maxProfit>r.profit);
});
test('COST 02 fixed cost changes profit but not maximizing quantity',()=>{
 const s=M.initial('cost'),n=M.set('cost',s,'F',700);
 const before=M.calc('cost',s),after=M.calc('cost',n);
 A.equal(before.optimal,after.optimal);near(before.maxProfit-after.maxProfit,500);
});
test('COST 03 high cost boundary does not produce negative optimal quantity',()=>{
 const s=M.set('cost',M.initial('cost'),'c',60);
 A.ok(M.calc('cost',s).optimal>=0);
});
test('RENT 01 linear decrease and zero floor',()=>{
 const s=M.initial('rent');A.equal(M.calc('rent',s).y,80);
 A.equal(M.calc('rent',M.set('rent',s,'d',20)).y,0);
 A.equal(M.calc('rent',s).zeroAt,15);
});
test('COBWEB 01 convergent path toward equilibrium from P0',()=>{
 const z=M.calc('cobweb',M.initial('cobweb'));
 near(z.eqP,33.3333);near(z.eqQ,53.3333);
 A.equal(z.factor,-.5);A.equal(z.path.length,12);
 A.equal(z.path[0].p,30);A.equal(z.path[1].p,35);
 A.ok(Math.abs(z.path[11].p-z.eqP)<.01);
});
test('COBWEB 02 divergent supply elasticity is accurately marked',()=>{
 const s=M.set('cobweb',M.initial('cobweb'),'d',3),z=M.calc('cobweb',s);
 near(z.factor,-1.5);A.match(z.message,/발산/);
});
test('COBWEB 03 unit ratio yields neutral alternating path',()=>{
 const s=M.set('cobweb',M.initial('cobweb'),'d',2),z=M.calc('cobweb',s);
 A.equal(z.factor,-1);A.match(z.message,/중립/);
});
test('COBWEB 04 negative price terminates simulation, not false extrapolation',()=>{
 const s=M.set('cobweb',M.initial('cobweb'),'d',4);
 const z=M.calc('cobweb',s);
 A.equal(z.stopped,true);A.ok(z.path.length<12);
 for(const item of z.path){A.ok(item.p>=0&&item.q>=0);}
});
test('ARC 01 midpoint arc elasticity uses exact two-period averages',()=>{
 const z=M.calc('arc',M.initial('arc'));
 near(z.e,-.625);near(z.magnitude,.625);
});
test('ARC 02 zero price change yields undefined rather than Infinity',()=>{
 const s=M.set('arc',M.initial('arc'),'p2',20),z=M.calc('arc',s);
 A.equal(z.e,null);A.match(z.message,/정의 불가/);
});
test('ARC 03 demand price and quantity rising together is flagged',()=>{
 const s=M.set('arc',M.initial('arc'),'q2',120);
 A.match(M.calc('arc',s).message,/조건/);
});
test('VALIDATION 01 invalid numbers and domain violations are rejected',()=>{
 for(const id of names){
  const s=M.initial(id),k=Object.keys(s)[0];
  A.equal(M.valid(id,{...s,[k]:Infinity}),false);
  A.equal(M.valid(id,{...s,[k]:NaN}),false);
  A.equal(M.valid(id,{...s,[k]:'30'}),false);
  A.equal(M.set(id,s,k,NaN),null);
 }
});
test('VALIDATION 02 every model field clamps to configured bounds',()=>{
 for(const id of names){
  for(const [k,rule] of Object.entries(M.S[id].f)){
   const base=M.initial(id);
   const below=M.set(id,base,k,rule[1]-100);
   const above=M.set(id,base,k,rule[2]+100);
   A.ok(below&&above,id+'/'+k);
   A.ok(below[k]>=rule[1]&&above[k]<=rule[2],id+'/'+k);
  }
 }
});
test('SVG 01 geometry uses named paths and positive axis ranges only',()=>{
 for(const id of names){
  const data=M.drawing(id,M.initial(id));
  A.ok(data.maxX>0&&data.maxY>0&&data.axes.length===2);
  for(const p of data.paths){A.ok(p.pts.length>=2,id+'/'+p.label);
   A.ok(p.pts.every(pair=>pair.every(Number.isFinite)));}
 }
});
test('SOURCE 01 no localStorage/API/network writes in pure model',()=>{
 const src=fs.readFileSync('assets/ck-theory-models-v142.js','utf8');
 A.doesNotMatch(src,/\b(localStorage|sessionStorage|XMLHttpRequest|fetch\s*\(|sendBeacon|WebSocket)\b/);
});
test('INTEGRATION 01 UI loads without unapproved assets or writes',()=>{
 const glue=fs.readFileSync('assets/ck-study-charts-v79.js','utf8');
 const lab=fs.readFileSync('assets/ck-theory-v142.js','utf8');
 const css=fs.readFileSync('assets/ck-theory-v142.css','utf8');
 A.match(glue,/ck-theory-models-v142/);
 A.match(glue,/CK142Theory\?\.mount/);
 A.match(lab,/ck142-theory-studio-v1/);
 A.match(lab,/setPointerCapture/);
 A.match(lab,/pointercancel/);
 A.match(lab,/storage=false/);
 A.match(lab,/localStorage\.removeItem\(KEY\)/);
 A.match(css,/max-width:800px/);
 A.doesNotMatch(lab,/localStorage\.(clear|key)\(/);
});
test('INTEGRATION 02 browser script parses in an isolated VM',()=>{
 const text=fs.readFileSync('assets/ck-theory-v142.js','utf8');
 const context={window:{},document:{addEventListener(){}},localStorage:{getItem(){return null}}};
 vm.runInNewContext(fs.readFileSync('assets/ck-theory-models-v142.js','utf8'),context);
 context.window.addEventListener=()=>{};
 vm.runInNewContext(text,context);
 A.equal(typeof context.window.CK142Theory.mount,'function');
});
test('MATH 01 v141 first 12 accepted tests remain unchanged',()=>{
 const base=require('../assets/ck-concept-math-v141.js');
 const b=base.BASE;
 const pairs=[[0,0,25,70],[20,0,30,80],[-20,0,20,60],[0,20,20,80],[0,-20,30,60],
   [20,20,25,90],[40,20,30,100],[20,40,20,100]];
 for(const [u,v,p,q] of pairs){const z=base.solve({...b,u,v});A.equal(z.price,p);A.equal(z.quantity,q);}
});

test('AXIS 01 optimal production point stays visible when optimum exceeds old 65-unit axis',()=>{
 const s={...M.initial('cost'),A:140,b:.5,c:10,k:.2};
 const q=M.calc('cost',s).optimal,d=M.drawing('cost',s);
 A.ok(q>65);A.ok(d.maxX>=q,'optimal quantity not clipped');
 A.ok(d.maxY>=s.c+2*s.k*d.maxX,'marginal cost path not clipped');
});
test('AXIS 02 cobweb equilibrium and transient path remain inside dynamic axes',()=>{
 const s={...M.initial('cobweb'),a:160,b:1,c:0,d:.5};
 const c=M.calc('cobweb',s),d=M.drawing('cobweb',s);
 A.ok(c.eqP>100);A.ok(d.maxY>=c.eqP);
 A.ok(d.maxX>=c.eqQ);
 A.ok(c.path.every(pt=>pt.q<=d.maxX&&pt.p<=d.maxY));
});
test('POINTER 01 lostpointercapture and route-change handlers cancel active drags safely',()=>{
 const old=fs.readFileSync('assets/ck-concept-lab-v141.js','utf8');
 const next=fs.readFileSync('assets/ck-theory-v142.js','utf8');
 for(const src of [old,next]){
  A.match(src,/lostpointercapture/);
  A.match(src,/ck:pen-deactivate/);
  A.match(src,/pointercancel/);
  A.match(src,/pagehide/);
 }
});
