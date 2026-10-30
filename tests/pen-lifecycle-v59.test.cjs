const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
function load(){
 let code=fs.readFileSync('assets/ck-pdf-workspace-v15.js','utf8');
 code=code.replace(/\}\)\(\);\s*$/,`redrawInk=()=>{};persist=()=>true;window.test={penEraser,onPointerDown,onPointerMove,onPointerUp,endPenSession,setPenMode};})();`);
 const window={addEventListener(){}},document={readyState:'loading',addEventListener(){}};
 vm.runInNewContext(code,{window,document,Map,performance:{now:()=>10}});
 return window.test;
}
function state(){
 const ink={setPointerCapture(){},hasPointerCapture:()=>false,releasePointerCapture(){}};
 const page={getBoundingClientRect:()=>({left:0,top:0,width:500,height:700})};
 const scroller={scrollLeft:0,scrollTop:0};
 return {pdf:{},host:{isConnected:true,classList:{toggle(){}},querySelector:s=>({'[data-ck15-page]':page,'[data-ck15-ink-canvas]':ink,'[data-ck15-scroll]':scroller}[s]||null)},tool:'pen',color:'#123456',width:3,page:1,annotations:{},redo:{},touchPoints:new Map(),strokePointer:null,penMode:true};
}
const event=(overrides={})=>({pointerType:'pen',pointerId:1,button:0,buttons:1,pressure:.6,clientX:100,clientY:150,preventDefault(){},...overrides});
test('S Pen barrel and inverted eraser signals, with normal pen and touch excluded',()=>{
 const p=load();for(const v of [{button:2},{buttons:3},{button:5},{buttons:32}])assert.equal(p.penEraser(event(v)),true);
 assert.equal(p.penEraser(event()),false);assert.equal(p.penEraser(event({pointerType:'touch',buttons:3})),false);
});
test('palm movement and release cannot modify or end a pen stroke',()=>{
 const p=load(),s=state();p.onPointerDown(s,event());
 p.onPointerDown(s,event({pointerType:'touch',pointerId:2}));
 p.onPointerMove(s,event({pointerType:'touch',pointerId:2,clientX:400}));
 p.onPointerUp(s,event({pointerType:'touch',pointerId:2}));
 assert.equal(s.strokePointer,1);assert.equal(s.activeStroke.points.length,1);assert.equal(s.touchPoints.size,0);
});
test('barrel press mid-stroke commits ink, erases, then restores pen on release',()=>{
 const p=load(),s=state();p.onPointerDown(s,event());
 p.onPointerMove(s,event({buttons:3,clientX:300}));assert.equal(s.erasing,1);assert.equal(s.activeStroke,null);
 p.onPointerMove(s,event({buttons:1,clientX:350}));assert.equal(s.erasing,null);assert.equal(s.activeStroke.tool,'pen');
 p.onPointerUp(s,event());assert.equal(s.strokePointer,null);assert.equal(s.activeStroke,null);
});
test('leaving a PDF commits unfinished ink and clears mode, capture and gesture state',()=>{
 const p=load(),s=state();p.onPointerDown(s,event());s.touchPoints.set(2,{});s.gesture={type:'pan'};
 p.endPenSession(s);assert.equal(s.penMode,false);assert.equal(s.strokePointer,null);assert.equal(s.activeStroke,null);assert.equal(s.gesture,null);assert.equal(s.touchPoints.size,0);assert.equal(s.annotations['1'].length,1);
});
test('PDF highlighter tool persists with its enlarged stroke width',()=>{
 const p=load(),s=state();s.tool='highlighter';p.onPointerDown(s,event());p.onPointerUp(s,event());
 assert.equal(s.annotations['1'][0].tool,'highlighter');assert.equal(s.annotations['1'][0].width,9.3);
});
test('board auto-off clears saved mode and page-lock classes without changing note content',()=>{
 const html=fs.readFileSync('index.html','utf8'),a=html.indexOf('  function disableBoardPen(){'),b=html.indexOf("  window.addEventListener('ck:pen-deactivate'",a);
 const removed=[],attrs=[],board={__ckV7Finish(){this.finished=true},classList:{remove(...c){removed.push(...c)}},querySelector:s=>s.includes('toolbar')?{hidden:false}:{setAttribute(...v){attrs.push(v)}}};
 const state={ck9SpenMode:true,note:'keep'},body={classList:{remove(...c){removed.push(...c)}},style:{removeProperty(){}}};let saves=0;
 const context={state,document:{querySelectorAll:()=>[board],body},save:()=>saves++};
 vm.runInNewContext(html.slice(a,b)+'disableBoardPen();',context);
 assert.equal(state.ck9SpenMode,false);assert.equal(state.note,'keep');assert.equal(board.finished,true);assert.equal(saves,1);assert.ok(removed.includes('ck22-pen-locked'));assert.deepEqual(attrs,[['aria-pressed','false']]);
});
test('quick repeated S Pen taps draw dots instead of starting PDF zoom gestures',()=>{
 const p=load(),s=state();s.tool='hand';s.lastTap={time:9,x:100,y:150};
 p.onPointerDown(s,event({detail:2}));assert.ok(s.activeStroke);assert.equal(s.gesture,undefined);
});
