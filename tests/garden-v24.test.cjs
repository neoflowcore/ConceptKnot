const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(__dirname+'/../assets/ck-landscape3d.js','utf8');
function harness(){
 const timers=new Map(),frames=new Map();let id=0;
 const body={dataset:{ckV8Tab:'landing'},classList:{contains:()=>false}};
 const window={devicePixelRatio:2,innerWidth:3840,innerHeight:2160,addEventListener(){}};
 const document={body,hidden:false,readyState:'loading',addEventListener(){}};
 const sandbox={window,document,navigator:{},matchMedia:()=>({matches:false}),setTimeout:(fn,ms)=>{timers.set(++id,{fn,ms});return id},clearTimeout:n=>timers.delete(n),requestAnimationFrame:fn=>{frames.set(++id,fn);return id},cancelAnimationFrame:n=>frames.delete(n),THREE:{MathUtils:{lerp:(a,b,t)=>a+(b-a)*t,clamp:(x,a,b)=>Math.max(a,Math.min(b,x))}},console};
 const api=';globalThis.testApi={queueFrame,cancelFrames,shouldAnimate,sync:synchronizeActivity,resize,finish:()=>{introDone=true},setRenderer:(r)=>{renderer=r;root={clientWidth:3840,clientHeight:2160,dataset:{}};camera={position:{},updateProjectionMatrix(){}}}}';
 vm.runInNewContext(source.replace(/^import .*;$/gm,'')+api,sandbox);
 return {...sandbox,timers,frames,api:sandbox.testApi};
}
test('landing animation remains scheduled after cub settles; study routes and hidden pages cannot schedule GPU work',()=>{
 const h=harness();h.api.queueFrame();assert.equal(h.timers.size,1);
 assert.equal([...h.timers.values()][0].ms,1000/24);
 h.api.queueFrame();assert.equal(h.timers.size,1);
 h.api.cancelFrames();assert.equal(h.timers.size,0);
 h.document.body.dataset.ckV8Tab='exam';h.api.queueFrame();assert.equal(h.timers.size,0);
 h.document.body.dataset.ckV8Tab='landing';h.document.hidden=true;assert.equal(h.api.shouldAnimate(),false);
 h.document.hidden=false;h.api.finish();h.api.queueFrame();assert.equal(h.timers.size,1);
});
test('study transition cancels the garden render loop and shrinks its WebGL buffer; landing resumes',()=>{
 const h=harness(),sizes=[],canvas={style:{}};
 h.api.setRenderer({domElement:canvas,setPixelRatio(){},setSize:(...args)=>sizes.push(args)});
 h.api.sync();assert.equal(canvas.style.display,'block');assert.equal(h.timers.size,1);
 assert.equal(sizes.at(-1)[0],3840);
 h.document.body.dataset.ckV8Tab='home';h.api.sync();
 assert.equal(h.timers.size,0);assert.equal(h.frames.size,0);
 assert.equal(canvas.style.display,'none');assert.equal(sizes.at(-1)[0],1);assert.equal(sizes.at(-1)[1],1);
 h.document.body.dataset.ckV8Tab='landing';h.api.sync();
 assert.equal(canvas.style.display,'block');assert.equal(h.timers.size,1);
 assert.equal(sizes.at(-1)[0],3840);
});
test('4K keeps native CSS resolution instead of stretching a 1.8MP image',()=>{
 const h=harness();let dpr=0,size=[];
 h.api.setRenderer({setPixelRatio:n=>dpr=n,setSize:(...n)=>size=n});
 h.api.resize();
 assert.ok(dpr>=1);assert.ok(3840*2160*dpr*dpr<=16777217);
 assert.equal(size[0],3840);assert.equal(size[1],2160);
});
test('centered smooth cub presses down and holds final scroll cue pose',()=>{
 let cub=fs.readFileSync(__dirname+'/../assets/ck-pointing-cub-v16.js','utf8');
 assert.match(cub,/x=0,z=-11.4/);assert.match(cub,/SphereGeometry\(1,32,24\)/);
 assert.match(cub,/seconds\/3.6/);assert.match(cub,/getPush:/);
 assert.match(source,/antialias:true,powerPreference:'low-power'/);
 assert.match(source,/shadowMap.enabled=false/);
 assert.match(source,/SCROLL DOWN/);
});
