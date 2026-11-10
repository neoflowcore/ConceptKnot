/* ConceptKnot v144 P6-B3: developer-run tests, no GitHub Actions or artifact generation.
 * Run manually: node --test tests/v144-before-after-graphs.test.cjs
 */
'use strict';
const {test}=require('node:test'),A=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const math=require('../assets/ck-concept-math-v141.js');
const theoryModels=require('../assets/ck-theory-models-v142.js');
const changes=require('../assets/ck-concept-transition-v144.js');
const view=require('../assets/ck-concept-transition-view-v144.js');
const b={...math.BASE};
function metric(s,key){const m=s.metrics.find(m=>m.label===key);A.ok(m,'missing metric '+key);return m;}
test('demand curve parallel movement preserves slope and shifts equilibrium correctly',()=>{
 for(const [u,tag,p,q] of [[20,'수요 증가',30,80],[-20,'수요 감소',20,60]]){
  const next={...b,u},r=changes.market(b,next,math);
  A.equal(r.operation,'곡선 평행이동');A.equal(r.tag,tag);
  A.equal(metric(r,'균형가격 P*').before,'25');
  A.equal(metric(r,'균형가격 P*').after,String(p));
  A.equal(metric(r,'균형거래량 Q*').after,String(q));
  A.equal(next.b,b.b);A.match(r.rule,/곡선 전체/);
  A.match(r.trap,/곡선 이동/);
 }
 for(const [v,tag,p,q] of [[20,'공급 증가',20,80],[-20,'공급 감소',30,60]]){
  const next={...b,v},r=changes.market(b,next,math);
  A.equal(r.tag,tag);A.equal(r.operation,'곡선 평행이동');
  A.equal(metric(r,'균형가격 P*').after,String(p));
  A.equal(metric(r,'균형거래량 Q*').after,String(q));
 }
});
test('slope change rotates demand/supply around P25 preserving Q at the anchor',()=>{
 const d=math.transition(b,'adjust-demand-slope',3);
 const s=math.transition(b,'adjust-supply-slope',3);
 for(const [next,label] of [[d,'수요곡선 기울기 회전'],[s,'공급곡선 기울기 회전']]){
  const r=changes.market(b,next,math);
  A.equal(r.operation,'기울기 회전');A.equal(r.tag,label);
  A.equal(math.point(b,25).qd,math.point(d,25).qd);
  A.equal(math.point(b,25).qs,math.point(s,25).qs);
  A.match(r.rule,/기울기/);A.match(r.trap,/탄력성/);
 }
 A.equal(d.a,145);A.equal(s.c,-5);
});
test('moving price point does not rewrite equilibrium conditions',()=>{
 const next={...b,price:30},r=changes.market(b,next,math);
 A.equal(r.operation,'곡선 위 점 이동');A.equal(r.kind,'movement');
 A.equal(metric(r,'같은 D의 수요량 Qd').after,'60');
 A.equal(metric(r,'같은 S의 공급량 Qs').after,'80');
 A.match(r.rule,/새로운 시장균형이 아닙니다/);
});
test('simultaneous demand/supply change avoids claiming a fixed price direction',()=>{
 const next={...b,u:20,v:20},r=changes.market(b,next,math);
 A.equal(r.tag,'수요·공급 동시 이동');
 A.equal(metric(r,'균형가격 P*').change,'불변');
 A.equal(metric(r,'균형거래량 Q*').change,'증가');
 A.match(r.trap,/이동폭/);
});
test('proportion gives before/after point and coefficient comparisons',()=>{
 const r=changes.market(null,null,math,'relation',{x:1,k:2},{x:2,k:2});
 A.equal(r.operation,'점 이동');
 A.equal(metric(r,'정비례 y').before,'2');A.equal(metric(r,'정비례 y').after,'4');
 A.equal(metric(r,'반비례 y').before,'2');A.equal(metric(r,'반비례 y').after,'1');
 const k=changes.market(null,null,math,'relation',{x:1,k:2},{x:1,k:3});
 A.equal(k.tag,'비례계수 변경');
});
test('budget incomes translate; price changes rotate one intercept around the other',()=>{
 const before=theoryModels.initial('budget');
 const income=changes.theory('budget',before,theoryModels.set('budget',before,'I',160),theoryModels);
 A.equal(income.operation,'평행이동');A.equal(metric(income,'예산선 기울기').change,'불변');
 const x=changes.theory('budget',before,theoryModels.set('budget',before,'px',15),theoryModels);
 A.equal(x.operation,'절편 회전');A.equal(metric(x,'예산선 Y절편').change,'불변');
 const y=changes.theory('budget',before,theoryModels.set('budget',before,'py',15),theoryModels);
 A.equal(y.operation,'절편 회전');A.equal(metric(y,'예산선 X절편').change,'불변');
});
test('theory comparator retains concept-specific assumptions across six scenes',()=>{
 const ids=['budget','ppf','cost','rent','cobweb','arc'];
 for(const id of ids){
  const state=theoryModels.initial(id),r=changes.theory(id,state,state,theoryModels);
  A.ok(r.rule.length>10,id);A.ok(r.constant.length>3,id);
  A.ok(typeof view.render(r)==='string');
 }
 const ppf=theoryModels.initial('ppf'),after=theoryModels.set('ppf',ppf,'x',75);
 A.equal(changes.theory('ppf',ppf,after,theoryModels).operation,'생산점 이동');
});
test('comparison HTML escapes outside inputs and exposes accessible before/after headers',()=>{
 const r=changes.make({operation:'<script>alert(1)</script>',tag:'수요 증가',
  metrics:[{label:'가격',before:'25',after:'30',change:'증가'}]});
 const html=view.render(r);
 A.doesNotMatch(html,/<script>/);A.match(html,/&lt;script&gt;/);
 A.match(html,/scope="col">전 E₀/);A.match(html,/scope="col">후 E₁/);
 A.match(html,/기본이론/);A.match(html,/변경한 조건/);A.match(html,/그대로 둔 조건/);
});
test('actual line drag changes u, rotate toggle changes b, previous state survives release',()=>{
 const listeners={};const events={};
 const window={addEventListener(type,cb){(events[type]??=[]).push(cb);},requestAnimationFrame(cb){cb();return 1}};
 const document={addEventListener(type,cb){(listeners[type]??=[]).push(cb);},
  createElement(){return {dataset:{},isConnected:false,innerHTML:'',setAttribute(){},querySelector(){return null},querySelectorAll(){return []}};}};
 const localStorage={getItem(){return null;},setItem(){},removeItem(){}};
 const ctx={window,document,localStorage};
 for(const f of ['assets/ck-concept-math-v141.js','assets/ck-theory-models-v142.js',
   'assets/ck-concept-coach-v143.js','assets/ck-concept-transition-v144.js',
   'assets/ck-concept-transition-view-v144.js','assets/ck-concept-lab-v141.js',
   'assets/ck-theory-v142.js'])vm.runInNewContext(read(f),ctx,{filename:f});
 const emitter=(type,event)=>{for(const cb of listeners[type]||[])cb(event);};
 const root=document.createElement('section'),chart={isConnected:true,querySelector(){return null;},
  appendChild(el){el.isConnected=true;this.root=el;},append(el){this.appendChild(el);}};
 A.equal(window.CK141ConceptLab.mount(chart),true);
 root.isConnected=true;
 const mounted=chart.root;
 mounted.querySelector=()=>null;mounted.querySelectorAll=()=>[];
 A.match(mounted.innerHTML,/data-ck144-gesture="shift"/);
 A.match(mounted.innerHTML,/ck144-change-board/);
 const stage={getBoundingClientRect(){return {left:0,top:0,width:660,height:400};},
  classList:{add(){},remove(){}},setPointerCapture(){},
  releasePointerCapture(id){emitter('lostpointercapture',{pointerId:id});}};
 const handle={dataset:{ck141Drag:'demand'},closest(selector){
  if(selector.startsWith('#ck141-concept-lab [data-ck141-drag]'))return this;
  if(selector==='.ck141-stage')return stage;
  if(selector==='#ck141-concept-lab')return mounted;
  if(selector==='.ck141-line-hit')return {};
  return null;
 }};
 const down=(id,x,y)=>({target:handle,button:0,pointerId:id,clientX:x,clientY:y,preventDefault(){}});
 emitter('pointerdown',down(1,239,115));
 emitter('pointermove',down(1,306.5,115));
 emitter('pointerup',down(1,306.5,115));
 let state=window.CK141ConceptLab.getState();
 A.equal(state.session.state.u,20);A.equal(state.session.state.b,2);
 A.equal(state.comparison.operation,'곡선 평행이동');
 const button={dataset:{ck144Gesture:'rotate'},closest(selector){if(selector==='#ck141-concept-lab')return mounted;
  if(selector==='[data-ck144-gesture]')return this;return null;}};
 emitter('click',{target:button});
 state=window.CK141ConceptLab.getState();A.equal(state.gestureMode,'rotate');
 emitter('pointerdown',down(2,239,115));
 emitter('pointermove',down(2,171.5,115));
 emitter('pointerup',down(2,171.5,115));
 state=window.CK141ConceptLab.getState();
 A.equal(state.session.state.b,3);
 A.equal(state.session.state.a,145);
 A.equal(state.comparison.operation,'기울기 회전');
 // Releasing the pointer triggers lostpointercapture synchronously in this mock;
 // it must not revert or double-commit a successful rotation.
 A.equal(state.session.past.length,2);
 const other=document.createElement('section'),newChart={isConnected:true,querySelector(){return null;},
  append(el){el.isConnected=true;this.node=el;}};
 A.equal(window.CK142Theory.mount(newChart),true);
 A.match(newChart.node.innerHTML,/ck144-change-board/);
});
test('release is manual-only and offline core 11 unchanged',()=>{
 const html=read('index.html'),sw=read('sw.js'),glue=read('assets/ck-study-charts-v79.js');
 A.match(html,/ck-release" content="v152-p4-160-new-study-drafts"/);
 A.match(html,/ck-study-charts-v79.js\?v=150/);
 for(const name of ['ck-concept-transition-v144.js?v=145','ck-concept-transition-view-v144.js?v=148','ck-concept-transition-v144.css?v=144']){
  A.ok(glue.includes(name));A.ok(sw.includes(name));
 }
 A.match(sw,/conceptknot-study-v152-p4-160-new-study-drafts/);
 const core=sw.match(/const CRITICAL=\[([\s\S]*?)\];/);
 A.ok(core);A.equal([...core[1].matchAll(/'\.\/[^']+'/g)].length,11);
 const vercel=JSON.parse(read('vercel.json'));
 A.equal(vercel.git.deploymentEnabled,false);
 A.equal(fs.existsSync('.github/workflows'),false);
});
