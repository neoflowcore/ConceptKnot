const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
function tracker(){const window={addEventListener(){}},document={addEventListener(){}};vm.runInNewContext(fs.readFileSync('assets/ck-pen-input-v60.js','utf8'),{window,document,Map});return window.CKPen60;}
const pen=(type,button,buttons,pressure=0)=>({pointerId:7,pointerType:'pen',type,button,buttons,pressure});
test('hover barrel press stays latched when contact event omits the barrel bit',()=>{
 const p=tracker(),hover=pen('pointerdown',2,2),contact=pen('pointermove',0,1,.6);
 p.observe(hover);assert.equal(p.eraser(hover),true);assert.equal(p.contact(hover),false);
 p.observe(contact);assert.equal(p.eraser(contact),true);assert.equal(p.contact(contact),true);
 const release=pen('pointerup',2,1,.6);p.observe(release);assert.equal(p.eraser(release),false);assert.equal(p.contact(release),true);
});
test('barrel change delivered as pointermove restores normal pen without lifting tip',()=>{
 const p=tracker(),press=pen('pointermove',2,3,.5),release=pen('pointermove',2,1,.5);
 p.observe(press);assert.equal(p.eraser(press),true);p.observe(release);assert.equal(p.eraser(release),false);
});
test('tip lift with barrel held is not a new contact and cancellation clears latch',()=>{
 const p=tracker(),lift=pen('pointerup',0,2,0);p.observe(lift);assert.equal(p.eraser(lift),true);assert.equal(p.contact(lift),false);
 p.observe(pen('pointercancel',-1,0));assert.equal(p.eraser(pen('pointermove',-1,0)),false);
});
test('render restores exact scroll offsets of ribbon and nested tab list',()=>{
 const html=fs.readFileSync('index.html','utf8'),a=html.indexOf("const ribbon=$('#main')"),b=html.indexOf('refreshTimerDisplay();',a);
 const nextTabs={scrollLeft:0},next={scrollLeft:0,querySelector:()=>nextTabs};
 let replaced=false;const old={scrollLeft:473,querySelector:()=>({scrollLeft:81})};
 const main={querySelector:()=>replaced?next:old,set innerHTML(v){replaced=true}};
 vm.runInNewContext(html.slice(a,b),{$:()=>main,boardFrame:x=>x,renderers:{wrong:()=>''},state:{view:'wrong'}});
 assert.equal(next.scrollLeft,473);assert.equal(nextTabs.scrollLeft,81);
});
