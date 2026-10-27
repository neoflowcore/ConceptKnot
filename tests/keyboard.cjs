// Local-only shortcut checks. No browser, build, network or CI required.
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(require('path').join(__dirname,'../index.html'),'utf8');
const script=html.slice(html.indexOf("document.addEventListener('keydown',e=>"),html.indexOf("\nwindow.addEventListener('beforeunload'"));
let handler,clicks=0,prevented=0,selector='';
const button={disabled:false,getClientRects:()=>[{}],click:()=>clicks++};
const state={view:'quiz'};
vm.runInNewContext(script,{state,rs:()=>({mode:'practice'}),document:{addEventListener:(name,fn)=>handler=fn,querySelectorAll:s=>(selector=s,[button]),querySelector:s=>(selector=s,button)}});
const fire=(extra={})=>handler({key:'2',target:{closest:()=>null},preventDefault:()=>prevented++,...extra});
for(const view of ['quiz','calc','exam','reverse']){state.view=view;const n=clicks;fire();assert.equal(clicks,n+1);assert.match(selector,/2/);}
for(const extra of [{repeat:true},{isComposing:true},{keyCode:229},{ctrlKey:true},{metaKey:true},{altKey:true},{shiftKey:true},{defaultPrevented:true},{key:'6'},{target:{closest:()=>({})}}]){const n=clicks;fire(extra);assert.equal(clicks,n);}
button.disabled=true;const n=clicks;fire();assert.equal(clicks,n);button.disabled=false;
state.view='exam';fire({key:'ArrowRight'});assert.match(selector,/exam-next/);
state.view='theory';const count=clicks;fire();assert.equal(clicks,count);
assert.equal(prevented,5);
for(const m of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
console.log('PASS: 4 answer routes, typing/IME/modifier/repeat guards, disabled answers, exam navigation, script syntax');
