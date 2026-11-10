/* ConceptKnot v145 — touch/S Pen input and visible explanation tests (manual only).
 * Run manually with: node --test tests/v145-touch-gesture-fix.test.cjs
 */
'use strict';
const {test}=require('node:test'),A=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const geometry=require('../assets/ck-concept-gesture-v145.js');
const model=require('../assets/ck-concept-math-v141.js');
const theory=require('../assets/ck-theory-models-v142.js');
function sandbox(){
 const events={};
 const window={addEventListener(){},requestAnimationFrame(f){f();return 1}};
 const document={hidden:false,addEventListener(type,fn,opts){(events[type]??=[]).push({fn,opts});},
  createElement(){return {dataset:{},isConnected:true,innerHTML:'',setAttribute(){},querySelector(){return null},querySelectorAll(){return []}};}};
 const storage={getItem(){return null},setItem(){},removeItem(){}};
 const ctx={window,document,localStorage:storage};
 for(const f of ['assets/ck-concept-math-v141.js','assets/ck-theory-models-v142.js',
  'assets/ck-concept-coach-v143.js','assets/ck-concept-gesture-v145.js',
  'assets/ck-concept-transition-v144.js','assets/ck-concept-transition-view-v144.js',
  'assets/ck-concept-lab-v141.js','assets/ck-theory-v142.js'])
  vm.runInNewContext(read(f),ctx,{filename:f});
 const fire=(type,e)=>{for(const {fn} of events[type]||[])fn(e);};
 return {window,document,events,fire};
}
function root(){return {dataset:{},isConnected:true,innerHTML:'',querySelector(){return null},querySelectorAll(){return []},setAttribute(){}};}
const event=(target,id,x,y)=>({target,pointerType:'touch',pointerId:id,button:0,isPrimary:true,
 clientX:x,clientY:y,cancelable:true,defaultPrevented:false,
 preventDefault(){this.defaultPrevented=true;}});
test('geometric target detects curves on the real mobile SVG size, not exact path pixels',()=>{
 const rect={left:0,top:0,width:330,height:210};
 const center=geometry.pointer({clientX:170,clientY:125},rect);
 A.equal(center.x,340);A.equal(center.y,240);
 const target=geometry.nearestMarket({clientX:170+7,clientY:125+4},rect,model.BASE,'touch');
 A.equal(target?.kind,'demand');
 A.ok(target.distancePx<36);
 const far=geometry.nearestMarket({clientX:325,clientY:14},rect,model.BASE,'touch');
 A.equal(far,null);
 const desktop={left:80,top:110,width:660,height:400};
 A.ok(geometry.nearestMarket({clientX:80+340,clientY:110+240},desktop,model.BASE,'mouse'));
});
test('SVG touch-action blocks native page pan only inside the chart canvas',()=>{
 const css=read('assets/ck-concept-touch-fix-v145.css');
 for(const id of ['ck141-stage','ck141-live-svg','ck142-graph','ck142-svg'])A.ok(css.includes(id));
 A.match(css,/touch-action:none!important/);
 A.doesNotMatch(css,/#main\s*\{[^}]*touch-action:none/);
 A.doesNotMatch(css,/body\s*\{[^}]*touch-action:none/);
 A.match(css,/#main \.ck145-example-buttons button\{[^}]*min-height:44px/);
});
test('tap 7px off the demand line still captures pointer and moves demand, not page scroll',()=>{
 const t=sandbox(),r=root(),chart={isConnected:true,querySelector(){return null},appendChild(x){x.isConnected=true;this.result=x}};
 A.equal(t.window.CK141ConceptLab.mount(chart),true);
 const mounted=chart.result;
 const stage={getBoundingClientRect(){return {left:0,top:0,width:330,height:210};},
  classList:{add(){},remove(){}},setPointerCapture(){},releasePointerCapture(i){t.fire('lostpointercapture',{pointerId:i});},
  closest(sel){return sel==='#ck141-concept-lab'?mounted:null;}};
 const target={closest(sel){return sel==='#ck141-concept-lab .ck141-stage'?stage:null;}};
 const down=event(target,1,177,129);
 t.fire('pointerdown',down);
 A.equal(down.defaultPrevented,true);
 const move=event(target,1,210.75,129);
 t.fire('pointermove',move);
 const during=t.window.CK141ConceptLab.getState();
 A.ok(during.session.state.u>15);
 t.fire('pointerup',move);
 const after=t.window.CK141ConceptLab.getState();
 A.ok(after.session.state.u>15);A.equal(after.session.state.b,2);
 A.equal(after.session.past.length,1);
 A.equal(after.comparison.tag,'수요 증가');
 A.match(mounted.innerHTML,/ck145-live-brief/);
 A.match(mounted.innerHTML,/ck145-example-buttons/);
 A.match(mounted.innerHTML,/ck144-change-board/);
 const opts=t.events.pointerdown.find(x=>x.opts?.capture);
 A.ok(opts);A.equal(opts.opts.passive,false);
});
test('pointercancel rolls back without touching original exam records',()=>{
 const t=sandbox(),mounted=root();const stage={getBoundingClientRect(){return {left:0,top:0,width:660,height:400}},
 classList:{add(){},remove(){}},setPointerCapture(){},releasePointerCapture(){},
 closest(s){return s==='#ck141-concept-lab'?mounted:null;}};
 const target={closest(s){return s==='#ck141-concept-lab .ck141-stage'?stage:null;}};
 const start=event(target,1,340,240);
 t.fire('pointerdown',start);t.fire('pointermove',event(target,1,407.5,240));
 A.equal(t.window.CK141ConceptLab.getState().session.state.u,20);
 t.fire('pointercancel',event(target,1,407.5,240));
 const z=t.window.CK141ConceptLab.getState();
 A.equal(z.session.state.u,0);A.equal(z.session.past.length,0);
 A.equal(z.storeEnabled,false);
});
test('tap outside both chart stages does not hijack scroll',()=>{
 const t=sandbox();
 const outside={closest(){return null;}};
 const e=event(outside,1,20,15);
 t.fire('pointerdown',e);
 A.equal(e.defaultPrevented,false);
});
test('clickable scenario applies one step then explanation and full comparison change',()=>{
 const t=sandbox(),chart={isConnected:true,querySelector(){return null},appendChild(el){this.el=el;}};
 t.window.CK141ConceptLab.mount(chart);
 const mounted=chart.el;
 const button={dataset:{ck145Example:'price'},closest(selector){
  if(selector==='#ck141-concept-lab')return mounted;
  if(selector==='[data-ck145-example]')return this;
  return null;}};
 t.fire('click',{target:button});
 const s=t.window.CK141ConceptLab.getState();
 A.equal(s.session.state.price,30);A.equal(s.comparison.operation,'곡선 위 점 이동');
 A.match(mounted.innerHTML,/같은 D의 수요량/);
 A.match(mounted.innerHTML,/초과공급/);
});
test('touching theory budget line without an SVG handle moves income and preserves undo',()=>{
 const t=sandbox(),r=root(),chart={isConnected:true,querySelector(){return null},append(el){this.el=el;}};
 t.window.CK142Theory.mount(chart);
 const mounted=chart.el;
 const graph={classList:{add(){},remove(){}}};
 const svg={getBoundingClientRect(){return {left:0,top:0,width:630,height:395}},
  closest(sel){if(sel==='#ck142-theory-studio')return mounted;if(sel==='.ck142-graph')return graph;return null;},
  setPointerCapture(){},releasePointerCapture(i){t.fire('lostpointercapture',{pointerId:i});}};
 const target={closest(sel){return sel==='#ck142-theory-studio .ck142-svg'?svg:null;}};
 const down=event(target,8,110,299);t.fire('pointerdown',down);
 A.equal(down.defaultPrevented,true);
 const next=event(target,8,137,299);t.fire('pointermove',next);t.fire('pointerup',next);
 const after=t.window.CK142Theory.getState().session.budget;
 A.ok(after.current.I>120,'I should increase');
 A.equal(after.past.length,1);
 A.match(mounted.innerHTML,/ck145-live-brief/);
});
test('advanced panel is collapsible; easy explanation is visible before any dragging',()=>{
 const V=require('../assets/ck-concept-transition-view-v144.js');
 const C=require('../assets/ck-concept-transition-v144.js');
 const r=C.market(model.BASE,{...model.BASE,price:30},model);
 const easy=V.render(r,'beginner'),hard=V.render(r,'advanced');
 A.match(easy,/class="ck145-easy"/);
 A.match(easy,/전후 수치·조건 더 보기/);
 A.doesNotMatch(easy,/class="ck145-deep" open/);
 A.match(hard,/class="ck145-deep" open/);
 A.match(hard,/초과공급/);
 A.match(hard,/고정된 균형가격/);
});
test('legacy 17 figure SVGs lock touch panning and link to the real calculation studio',()=>{
 const src=read('assets/ck-study-charts-v79.js'),css=read('assets/ck-concept-touch-fix-v145.css');
 A.match(src,/ensureLabShortcut\(root\)/);
 A.match(src,/data-ck145-open-lab/);
 A.match(src,/scrollIntoView/);
 A.match(src,/gesture\.startValue-Math\.round/);
 A.match(src,/capture:true,passive:false/);
 A.match(css,/svg\.ck21-chart-svg\{/);
 A.match(css,/\[data-ck145-open-lab\]/);
});
test('legacy 17 schematic chart scrubber responds to vertical touch without treating it as a precise economic slope',()=>{
 const hooks={},screens=[];
 const chosen={id:'demand-income',title:'수요 증가',type:'demand',shift:65,answer:'수요곡선 오른쪽'};
 const root={classList:{add(){},remove(){}},querySelector(selector){
  if(selector==='.ck76-chart-control')return controls;
  if(selector==='.ck21-chart-actions')return actions;
  if(selector==='svg.ck21-chart-svg'||selector==='.ck21-chart-svg')return svg;
  if(selector==='[data-ck76-chart-scrub]')return slider;
  return null;
 },querySelectorAll(){return []}};
 const controls={querySelector(){return null},append(){}},actions={added:null,querySelector(){return null},append(x){this.added=x}};
 const slider={value:'0'};
 const svg={classList:{add(){}},getBoundingClientRect(){return {left:0,top:0,width:560,height:348}},
  setPointerCapture(){},releasePointerCapture(){},setAttribute(){},querySelector(){return null},
  closest(selector){return selector==='.ck21-chart-section'?root:null}};
 const lab={scrollIntoView(args){screens.push(args)}};
 const window={CK21Charts:{charts:[chosen],getState(){return {selected:0,phase:false}}},
  CK76Search:{applyScrub(r,p){screens.push(p)}},addEventListener(){},MutationObserver:null};
 const document={readyState:'complete',head:null,body:null,
  querySelector(selector){return selector==='.ck21-chart-section'?root:null},
  getElementById(id){return id==='ck141-concept-lab'?lab:null},
  createElement(){return {dataset:{},setAttribute(){},type:'button'}},
  addEventListener(type,fn,opts){(hooks[type]??=[]).push({fn,opts})}};
 vm.runInNewContext(read('assets/ck-study-charts-v79.js'),{window,document,requestAnimationFrame(f){f();}});
 A.ok(actions.added);A.match(actions.added.textContent,/선 직접 이동/);
 const fire=(type,e)=>{for(const h of hooks[type]||[])h.fn(e)};
 const target={closest(selector){return selector==='.ck21-chart-section svg.ck21-chart-svg'?svg:null}};
 const d=event(target,5,300,180);
 fire('pointerdown',d);A.equal(d.defaultPrevented,true);
 const atStart=slider.value;
 fire('pointermove',event(target,5,300,255));
 const atEnd=slider.value;
 A.notEqual(atStart,atEnd);
 fire('pointerup',event(target,5,300,255));
 A.ok(hooks.pointerdown.some(h=>h.opts?.capture===true));
 const jumpTarget={closest(selector){return selector==='[data-ck145-open-lab]'?actions.added:null}};
 fire('click',{target:jumpTarget});
 A.ok(screens.some(x=>typeof x==='object'&&x.block==='start'));
});
test('release cache and version align with no automatic CI or installer build',()=>{
 const html=read('index.html'),sw=read('sw.js'),load=read('assets/ck-study-charts-v79.js');
 const preflight=read('assets/ck-study-charts-v79.css');
 A.match(preflight,/ck21-chart-stage/);A.match(preflight,/touch-action:none!important/);
 A.match(html,/ck-study-charts-v79.css\?v=145/);
 A.match(html,/ck-release" content="v152-p4-160-new-study-drafts"/);
 A.match(html,/ck-study-charts-v79.js\?v=150/);
 for(const name of ['ck-concept-gesture-v145.js?v=145','ck-concept-touch-fix-v145.css?v=145',
  'ck-concept-lab-v141.js?v=150','ck-theory-v142.js?v=150',
  'ck-concept-transition-view-v144.js?v=148']){
  A.ok(sw.includes(name));A.ok(load.includes(name));
 }
 A.match(sw,/conceptknot-study-v152-p4-160-new-study-drafts/);
 const critical=sw.match(/const CRITICAL=\[([\s\S]*?)\];/);
 A.ok(critical);A.equal([...critical[1].matchAll(/'\.\/[^']+'/g)].length,11);
 A.equal(JSON.parse(read('vercel.json')).git.deploymentEnabled,false);
 A.equal(fs.existsSync('.github/workflows'),false);
});
