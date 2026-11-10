/* ConceptKnot v149 · direct-grip, undo/redo, comparative equilibrium and data safety.
 * Run manually: node --test tests/v149-grip-and-replay.test.cjs
 */
'use strict';
const {test}=require('node:test');
const A=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const M=require('../assets/ck-graph-motion-v149.js');
const E=require('../assets/ck-three-step-v148.js');
const read=f=>fs.readFileSync(f,'utf8');
const windowCharts={};vm.runInNewContext(read('assets/ck-charts-v21.js'),{window:windowCharts});
const charts=windowCharts.CK21Charts.charts;
const chart=id=>{const c=charts.find(c=>c.id===id);A.ok(c,id);return c;};
const rect={left:0,top:0,width:560,height:348};
const point=(x,y,kind='touch')=>({clientX:x,clientY:y,pointerType:kind});
test('all 17 diagrams offer a meaningful line/curve hit-target',()=>{
 A.equal(charts.length,17);
 for(const c of charts){
  const line=M.polylines(c)[0],start=line.points[0],end=line.points[1];
  A.ok(M.nearest({getBoundingClientRect:()=>rect},point((start[0]+end[0])/2,(start[1]+end[1])/2),c),c.id);
  A.equal(M.nearest({getBoundingClientRect:()=>rect},point(10,10,'mouse'),c),null,c.id);
 }
});
test('SVG letterboxing and mobile touch use CSS pixel distance',()=>{
 const c=chart('demand-income'),mobile={left:5,top:10,width:330,height:210};
 const scale=Math.min(mobile.width/560,mobile.height/348);
 const centerX=5+(330-560*scale)/2+300*scale,centerY=10+(210-348*scale)/2+190*scale;
 const near=M.nearest({getBoundingClientRect:()=>mobile},point(centerX+6,centerY+5),c);
 A.equal(near.kind,'demand');A.ok(near.distancePx<35);
 A.equal(M.nearest({getBoundingClientRect:()=>mobile},point(5,10,'mouse'),c),null);
 A.ok(M.boxPoint(point(centerX,centerY),mobile));
 A.equal(M.boxPoint(point(0,0),{left:0,top:0,width:0,height:0}),null);
});
test('demand/supply drags follow the grabbed curve, including vertical gestures',()=>{
 const c=chart('demand-income'),base=M.defaultSnapshot(c);
 const after=M.drag(base,c,'demand',point(300,190),point(332.5,190),rect);
 A.equal(after.value,50);A.equal(after.sign,1);
 const reverse=M.drag(base,c,'demand',point(300,190),point(260,190),rect);
 A.ok(reverse.value>0);A.equal(reverse.sign,-1);
 const up=M.drag(base,c,'demand',point(300,190),point(300,171),rect);
 A.ok(up.value>0);A.equal(up.sign,1);
 const supply=chart('supply-cost');
 const supplyUp=M.drag(M.defaultSnapshot(supply),supply,'supply',point(300,190),point(300,177),rect);
 A.equal(supplyUp.sign,-1);
 A.equal(M.drag(base,c,'demand',point(300,190),point(300,171),{width:0,height:0}),null);
});
test('independent demand/supply gestures retain the other curve and equilibria',()=>{
 const c=chart('both-shift'),initial=M.defaultSnapshot(c);
 const d=M.drag(initial,c,'demand',point(300,190),point(327.5,190),rect);
 A.equal(d.demand,50);A.equal(d.supply,0);
 A.equal(d.value,50);A.equal(M.outcome(c,d).price,'증가');
 const s=M.drag(d,c,'supply',point(300,190),point(327.5,190),rect);
 A.equal(s.demand,50);A.equal(s.supply,50);A.equal(M.outcome(c,s).price,'불변');
 A.equal(M.outcome(c,s).quantity,'증가');
 const natural=M.outcome(chart('demand-income'),M.defaultSnapshot(chart('demand-income'),100));
 const expected=windowCharts.CK21Charts.equilibriumPoint(65,0);
 A.ok(Math.abs(natural.end.x-expected.x)<1e-8);
 A.ok(Math.abs(natural.end.y-expected.y)<1e-8);
});
test('undo/redo/reset is per figure and capped without writing localStorage',()=>{
 const c=chart('demand-income'),t=M.timeline(c);
 const s=t.state,changed=M.drag(s,c,'demand',point(300,190),point(320,190),rect);
 t.set(changed);A.equal(t.commit(s),true);
 A.equal(t.pastCount,1);A.equal(t.canRedo,false);
 const v=t.state.value;A.ok(v>0);
 const undone=t.undo();A.equal(undone.value,0);A.equal(t.canRedo,true);
 A.equal(t.redo().value,v);A.equal(t.reset().value,0);
 A.equal(t.undo().value,v);
 for(let i=0;i<120;i++){const before=t.state;t.set({...before,value:i%2?1:2});t.commit(before);}
 A.equal(t.pastCount,80);
 const second=M.timeline(chart('supply-tech'));A.equal(second.pastCount,0);
});
test('dual market lessons follow each selected curve, not always the original prompt',()=>{
 const c=chart('both-shift'),base=M.defaultSnapshot(c);
 const onlyD={...base,value:55,demand:55,supply:0};
 const d=E.legacy(c,55,1,onlyD);
 A.match(d.concept,/수요 증가·공급 불변/);
 A.match(d.example,/구매 희망자만/);
 A.match(d.after,/공급 변화 없음/);
 const onlyS={...base,value:55,demand:0,supply:55};
 const s=E.legacy(c,55,1,onlyS);
 A.match(s.concept,/공급 증가·수요 불변/);
 A.match(s.concept,/가격 하락/);
 const opposite={...base,value:55,demand:55,supply:55,supplySign:-1};
 const diff=E.legacy(c,55,1,opposite);
 A.match(diff.concept,/수요 증가·공급 감소/);A.match(diff.concept,/가격 상승/);
 A.match(E.render(diff),/data-ck148-tier="3"/);
 A.match(E.legacy(c,55).advanced,/상대 이동폭/);
});
function simulated(){
 const hooks={};const windows={};const buttons={undo:{disabled:true},redo:{disabled:true}};
 const group=(kind)=>({dataset:{ck149Target:kind},classList:{add(){},remove(){}},
  style:{values:{},setProperty(k,v){this.values[k]=v}}});
 const demand=group('demand'),supply=group('supply'),moving=group('moving');
 const status={textContent:''},cards={innerHTML:''},slider={value:'0'},
  details={textContent:''},notes={textContent:''},eq={textContent:''};
 const svg={setPointerCapture(){},releasePointerCapture(){},getBoundingClientRect(){return rect;},
  setAttribute(){},querySelector(k){if(k==='.ck21-equilibrium-moving')return moving;return null;},
  querySelectorAll(k){return k==='[data-ck149-target]'?[demand,supply]:[]},
  classList:{add(){}},closest(k){return k==='.ck21-chart-section'?root:null}};
 let content=null,toolbar=null;
 const actions={querySelector(){return null},append(){}};
 const controls={querySelector(k){return k==='[data-ck79-chart-modes]'?content:null},append(x){content=x}};
 const root={classList:{add(){},remove(){},toggle(){}},
  querySelector(k){
   if(k==='svg.ck21-chart-svg'||k==='.ck21-chart-svg')return svg;
   if(k==='.ck76-chart-control')return controls;
   if(k==='[data-ck79-chart-modes]')return content;
   if(k==='.ck21-chart-actions')return actions;
   if(k==='[data-ck76-chart-scrub]')return slider;
   if(k==='[data-ck79-chart-note]')return notes;
   if(k==='.ck21-chart-explanation')return details;
   if(k==='[data-ck148-legacy]')return cards;
   if(k==='[data-ck149-current]')return status;
   if(k==='[data-ck149-tools]')return toolbar;
   if(k==='[data-ck149-action="undo"]')return buttons.undo;
   if(k==='[data-ck149-action="redo"]')return buttons.redo;
   if(k==='.ck21-eq-after')return eq;
   return null;
  },
  querySelectorAll(){return []}
 };
 const doc={readyState:'complete',head:null,body:null,hidden:false,
  querySelector(k){return k==='.ck21-chart-section'?root:null},
  getElementById(){return null},
  createElement(){return {dataset:{},setAttribute(){},className:'',innerHTML:'',type:'button',append(){toolbar=this}}},
  createElementNS(){return {setAttribute(){},querySelector(){return null},innerHTML:''}},
  addEventListener(type,fn,opt){(hooks[type]??=[]).push({fn,opt})}
 };
 const w={CK149GraphMotion:M,CK148LearningSteps:E,addEventListener(type,fn){(windows[type]??=[]).push(fn)},
  CK21Charts:windowCharts.CK21Charts,CK76Search:{applyScrub(){}},MutationObserver:null};
 const i=charts.findIndex(x=>x.id==='demand-income');w.CK21Charts.choose(i);
 const ctx={window:w,document:doc,requestAnimationFrame(fn){fn()}};
 vm.runInNewContext(read('assets/ck-graph-direct-v149.js'),ctx);
 vm.runInNewContext(read('assets/ck-study-charts-v79.js'),ctx);
 function fire(type,e){
  const handlers=hooks[type]||[];
  for(const {fn} of handlers){if(e._stop)break;fn(e)}
 }
 const mk=(x,y,id=1)=>({target:{closest(k){if(k==='[data-ck155-grip]')return x>250&&x<360?{dataset:{ck155Grip:'demand',ck155PathIndex:'0'}}:null;return k==='.ck21-chart-section svg.ck21-chart-svg'?svg:null}},
  pointerType:'touch',clientX:x,clientY:y,pointerId:id,button:0,isPrimary:true,
  cancelable:true,preventDefault(){this.prevented=true},stopImmediatePropagation(){this._stop=true}});
 const action=name=>({target:{closest(k){if(k.includes('[data-ck149-action]'))
   return {dataset:{ck149Action:name},closest(){return root}};return null;}}});
 return {w,root,cards,buttons,notes,svg,moving,fire,mk,action,windows};
}
test('full UI pointerdown near a curve updates state, levels and supports undo/redo',()=>{
 const app=simulated(),s=app.w.CK149GraphEnhance;
 A.equal(s.getState().value,0);
 const miss=app.mk(20,20);app.fire('pointerdown',miss);A.equal(miss.prevented,undefined);
 const down=app.mk(300,190);app.fire('pointerdown',down);A.equal(down.prevented,true);
 app.fire('pointermove',app.mk(332.5,190));app.fire('pointerup',app.mk(332.5,190));
 A.equal(s.getState().value,50);A.equal(s.getState().past,1);
 A.match(app.cards.innerHTML,/data-ck148-tier="1"/);
 A.match(app.cards.innerHTML,/data-ck148-tier="2"/);
 A.match(app.cards.innerHTML,/data-ck148-tier="3"/);
 A.equal(app.buttons.undo.disabled,false);
 app.fire('click',app.action('undo'));A.equal(s.getState().value,0);
 app.fire('click',app.action('redo'));A.equal(s.getState().value,50);
});
test('pointercancel or blur restores prior state, not official exam records',()=>{
 const app=simulated(),s=app.w.CK149GraphEnhance;
 const down=app.mk(300,190);app.fire('pointerdown',down);
 app.fire('pointermove',app.mk(327,190));
 A.ok(s.getState().value>0);
 app.fire('pointercancel',app.mk(327,190));
 A.equal(s.getState().value,0);A.equal(s.getState().past,0);
 app.fire('pointerdown',app.mk(300,190));app.fire('pointermove',app.mk(327,190));
 for(const fn of app.windows.blur||[])fn();
 A.equal(s.getState().value,0);
});
test('dropping the pen after chart navigation cancels its uncommitted movement',()=>{
 const app=simulated(),ui=app.w.CK149GraphEnhance;
 const baseChart=app.w.CK21Charts.getState().selected;
 app.fire('pointerdown',app.mk(300,190));app.fire('pointermove',app.mk(327,190));
 A.ok(ui.getState().value>0);
 const other=charts.findIndex(c=>c.id==='supply-cost');app.w.CK21Charts.choose(other);
 app.fire('pointercancel',app.mk(327,190));
 app.w.CK21Charts.choose(baseChart);
 A.equal(ui.getState().value,0);
 A.equal(ui.getState().past,0);
});
test('ghost reference curves are never interactive grip targets',()=>{
 const live={classList:{contains(k){return k==='demand'}},closest(){return null},
  getTotalLength(){return 100},getPointAtLength(t){return {x:100+t*3,y:86+t*1.55}},
  getScreenCTM(){return {a:1,b:0,c:0,d:1,e:0,f:0}}};
 const ghost={...live,closest(k){return k==='.ck149-previous-curves'?{}:null},
  getPointAtLength(t){return {x:300,y:190}}};
 const svg={getBoundingClientRect:()=>rect,querySelectorAll(){return [ghost,live]}};
 const got=M.nearest(svg,point(300,190),chart('demand-income'));
 A.ok(got);A.equal(got.pathIndex,1);
});
test('version, current file contents and original records are protected',()=>{
 const html=read('index.html'),sw=read('sw.js'),glue=read('assets/ck-study-charts-v79.js');
 const files=['ck-graph-motion-v149.js?v=149','ck-graph-direct-v149.js?v=150',
  'ck-graph-direct-v149.css?v=149','ck-study-charts-v79.js?v=150'];
 for(const f of files){A.ok(html.includes(f)||f.endsWith('ck-study-charts-v79.js?v=150'),f);A.ok(sw.includes(f==='ck-study-charts-v79.js?v=150'?'ck-study-charts-v79.js?v=153':f),f)}
 A.match(html,/ck-release" content="v152-p4-160-new-study-drafts"/);
 A.match(sw,/const CACHE='conceptknot-study-v155-multiphase-direct-grips'/);
 A.match(glue,/CK149GraphEnhance/);
 const critical=sw.match(/const CRITICAL=\[([\s\S]*?)\];/);
 A.equal([...critical[1].matchAll(/'\.\/[^']+'/g)].length,11);
 A.equal(JSON.parse(read('data/official-2016-2020.json')).length,400);
 A.equal(JSON.parse(read('data/official-2021-2025.json')).length,400);
 A.equal(JSON.parse(read('vercel.json')).git.deploymentEnabled,false);
 A.equal(fs.existsSync('.github/workflows'),false);
});
