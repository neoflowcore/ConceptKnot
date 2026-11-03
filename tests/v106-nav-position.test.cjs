'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=p=>fs.readFileSync(path.resolve(__dirname,'..',p),'utf8');
test('v106 mobile tap retains the position of a clicked tab after ribbon replacement',()=>{
 let active=null,observer=null,now=100,frames=[],timers=[];
 const brand={},main={querySelector:()=>active},doc={querySelector:()=>({}),getElementById:id=>id==='main'?main:null};
 const sandbox={window:{matchMedia:()=>({matches:false})},document:doc,
  ResizeObserver:class{constructor(fn){}observe(){}disconnect(){}},
  MutationObserver:class{constructor(fn){observer=fn}observe(){}},
  requestAnimationFrame:fn=>{frames.push(fn);return frames.length},cancelAnimationFrame(){},
  setTimeout:fn=>{timers.push(fn);return timers.length},performance:{now:()=>now}};
 function mk(offset=590){
  const events={},pill={scrollLeft:0,scrollWidth:990,clientWidth:310,isConnected:true,
   classList:{add(){},remove(){}},contains:t=>t.pill===pill,
   addEventListener:(type,fn)=>((events[type]??=[]).push(fn)),
   querySelector:s=>s==='.board-tabs'?{}:s==='.ck-v7-logo'?brand:s==='.board-tab.active'?tab:null,
   querySelectorAll:s=>s==='.board-tab[data-go]'?[tab]:[],
   getBoundingClientRect:()=>({left:0,right:310}),
   fire:(type,e={})=>(events[type]||[]).forEach(f=>f(e))};
  const tab={pill,dataset:{go:'wrong'},closest:()=>tab,
   getBoundingClientRect:()=>({left:offset-pill.scrollLeft,right:offset-pill.scrollLeft+52})};
  return {pill,tab};
 }
 const a=mk(),b=mk(620);active=a.pill;
 vm.runInNewContext(read('assets/ck-nav-drag-v56.js'),sandbox);
 a.pill.scrollLeft=510;a.pill.fire('scroll');
 const x=a.tab.getBoundingClientRect().left;
 a.pill.fire('click',{target:a.tab,detail:1});
 a.pill.isConnected=false;active=b.pill;observer();
 while(frames.length)frames.splice(0).forEach(fn=>fn(now));
 assert.equal(b.tab.getBoundingClientRect().left,x);
 assert.equal(b.pill.scrollLeft,540);
 now=2000;b.pill.fire('pointerdown',{pointerType:'touch',button:0});
 b.pill.scrollLeft=300;b.pill.fire('scroll');
 const c=mk(620);b.pill.isConnected=false;active=c.pill;observer();
 while(frames.length)frames.splice(0).forEach(fn=>fn(now));
 assert.equal(c.pill.scrollLeft,300);
 timers.forEach(fn=>fn());assert.equal(c.pill.scrollLeft,300);
});
test('v106 removes auto-centering and keeps push/Actions build disabled',()=>{
 assert.doesNotMatch(read('assets/ck-navigation-v5.js'),/strip\.scrollTo\(/);
 assert.match(read('assets/ck-nav-single-row-v56.css'),/overflow-anchor:none!important/);
 assert.equal(JSON.parse(read('vercel.json')).git.deploymentEnabled,false);
 assert.match(read('sw.js'),/conceptknot-study-v106-keep-active-nav-scroll/);
});
