const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync('assets/ck-pdf-workspace-v15.js','utf8');
function fn(name,next){return src.slice(src.indexOf('function '+name+'('),src.indexOf('function '+next+'(')).replace(/async\s*$/,'');}
function harness(){
 const rect={left:0,top:0,width:1000,height:1000},ink={getBoundingClientRect:()=>rect,setPointerCapture(){},hasPointerCapture:()=>false},scroller={...ink,scrollLeft:0,scrollTop:0};
 const state={host:{isConnected:true},pdf:{numPages:12},baseViewport:{},page:1,zoom:1,tool:'eraser',touchPoints:new Map(),annotations:[],redo:{}};let saved=0;
 const ctx={Math,Number,performance:{now:()=>100},clamp:(x,a,b)=>Math.max(a,Math.min(b,x)),els:(_,sel)=>sel.includes('scroll')?scroller:ink,strokes:s=>s.annotations,persist:()=>saved++,redrawInk(){},alertStatus(){},pageMetrics(){},schedulePaint(){}};
 vm.createContext(ctx);vm.runInContext(fn('applyZoom','goPage')+fn('pointerPoint','onPointerDown')+fn('onPointerDown','updateTool'),ctx);
 const event=(x,y)=>({clientX:x,clientY:y,pointerId:1,pointerType:'mouse',button:0,preventDefault(){}});
 return {ctx,state,event,saved:()=>saved};
}
test('held eraser sweeps sparse stroke segments and saves once on release',()=>{
 const {ctx,state:s,event,saved}=harness();s.annotations=[{width:2,points:[[.1,.2],[.9,.2]]},{width:2,points:[[.1,.6],[.9,.6]]}];
 ctx.onPointerDown(s,event(500,100));ctx.onPointerMove(s,event(500,700));assert.equal(s.annotations.length,0);assert.equal(saved(),0);ctx.onPointerUp(s,{...event(500,700),type:'pointerup'});assert.equal(saved(),1);
});
test('second held click scrubs linearly down to enlarge and up to shrink',()=>{
 const {ctx,state:s,event}=harness();s.tool='hand';s.lastTap={time:0,x:500,y:500};ctx.onPointerDown(s,event(500,500));assert.equal(s.gesture.type,'zoom');ctx.onPointerMove(s,event(500,720));assert.equal(s.zoom,2);ctx.onPointerMove(s,event(500,390));assert.equal(s.zoom,.5);
 ctx.onPointerUp(s,{...event(500,390),type:'pointerup'});ctx.onPointerUp(s,{...event(500,390),type:'lostpointercapture'});assert.equal(s.lastZoomGestureMoved,true);
});
test('pen eraser button erases instead of adding an ink stroke',()=>{const {ctx,state:s,event}=harness();s.tool='pen';s.annotations=[{width:2,points:[[.5,.5]]}];ctx.onPointerDown(s,{...event(500,500),pointerType:'pen',button:5});assert.equal(s.annotations.length,0);assert.ok(!s.activeStroke);});
