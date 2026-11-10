/* v155 cross-phase safety guard. Run manually; no GitHub CI trigger. */
'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const raw=f=>fs.readFileSync(f,'utf8');
test('P6 curves have separate transformed grip targets; empty SVG remains scrollable',()=>{
 const source=raw('assets/ck-graph-direct-v149.js');
 const start=source.indexOf('function ensureGrips('),end=source.indexOf('function sync(',start);
 A.ok(start>0&&end>start);
 const make=tag=>({tag,children:[],attrs:{},dataset:{},
  setAttribute(k,v){this.attrs[k]=String(v);if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,x)=>x.toUpperCase())]=String(v)},
  append(...items){this.children.push(...items)},appendChild(child){this.children.push(child)}});
 const parents=[make('g'),make('g')];
 const paths=parents.map((p,i)=>({dataset:{},parentNode:p,
  closest:()=>null, getAttribute:key=>key==='d'?'M100 86 L485 286':null,
  getTotalLength:()=>100,getPointAtLength:()=>({x:270,y:155}),
  classList:{contains:k=>k===(i===0?'demand':'supply')}}));
 const root={querySelector:()=>({querySelectorAll:()=>paths})};
 const document={createElementNS:(ns,tag)=>{A.equal(ns,'http://www.w3.org/2000/svg');return make(tag)}};
 vm.runInNewContext(source.slice(start,end)+'\nensureGrips(root,chart);ensureGrips(root,chart);',
  {root,chart:{id:'both-shift',type:'both'},document,math:()=>({polylines:()=>[]})});
 for(let i=0;i<2;i++){
  A.equal(parents[i].children.length,1);
  const grip=parents[i].children[0];
  A.equal(grip.attrs['data-ck155-grip'],i===0?'demand':'supply');
  A.equal(grip.attrs.tabindex,'0');
  A.equal(grip.children[1].attrs.r,'17');
  A.equal(paths[i].dataset.ck155Enhanced,'1');
 }
 const css=raw('assets/ck-graph-direct-v149.css');
 A.match(css,/ck21-chart-svg\{touch-action:pan-y/);
 A.match(css,/ck155-grip-corridor\{\s*fill:none;stroke:[\s\S]*?stroke-width:44/);
 A.match(css,/ck155-grip\{touch-action:none/);
 A.match(source,/e.pointerType!=='mouse'&&!grip/);
});
test('P6 signed 10-step D/S movement is independent and history-safe',()=>{
 const M=require('../assets/ck-graph-motion-v149.js');
 const c={id:'both-shift',type:'both',shift:65};
 const origin=M.defaultSnapshot(c),left=M.nudge(origin,c,'demand',-10);
 A.equal(left.demand,10);A.equal(left.demandSign,-1);A.equal(left.supply,0);
 const zero=M.nudge(left,c,'demand',10);
 A.equal(zero.demand,0);
 const right=M.nudge(zero,c,'supply',10);
 A.equal(right.supply,10);A.equal(right.supplySign,1);A.equal(right.demand,0);
 const tr=M.timeline(c);tr.set(right);A.equal(tr.commit(origin),true);
 A.deepEqual(tr.undo(),origin);A.deepEqual(tr.redo(),right);
 const src=raw('assets/ck-graph-direct-v149.js');
 A.match(src,/data-ck155-nudge="-10"/);
 A.match(src,/data-ck155-nudge="10"/);
 A.match(src,/change\(after,info.chart,info.root\);done\(was,info.chart,info.root\)/);
});
test('P2 late IME composition gets one fallback input, native input and unrelated fields stay untouched',()=>{
 const handlers={},frames=[];
 class E{constructor(type,props){this.type=type;this.bubbles=props?.bubbles}}
 const win={document:{addEventListener:(type,fn)=>handlers[type]=fn},Event:E,
  requestAnimationFrame:fn=>(frames.push(fn),frames.length)};
 vm.runInNewContext(raw('assets/ck-typing-ime-guard-v155.js'),{window:win});
 const area={tagName:'TEXTAREA',value:'한',isConnected:true,
  __ck31Composing:false,events:[],closest:()=>({}),
  dispatchEvent(e){this.events.push(e.type);handlers.input({target:this})}};
 handlers.compositionstart({target:area});handlers.compositionend({target:area});
 area.value='한국';frames.shift()();
 A.deepEqual(area.events,['input']);
 handlers.compositionstart({target:area});handlers.compositionend({target:area});
 area.value='한국어';handlers.input({target:area});frames.shift()();
 A.deepEqual(area.events,['input']);
 handlers.compositionstart({target:area});handlers.compositionend({target:area});
 area.isConnected=false;area.value='한국어공부';frames.shift()();
 A.deepEqual(area.events,['input']);
 A.equal(win.CK155TypingImeGuard.getStats().recovered,1);
 A.match(raw('assets/ck-study-p6-v76.js'),/ck-typing-ime-guard-v155.js\?v=155/);
});
test('P3/P5 keyboard supports Ctrl+arrow but excludes IME and editable controls',()=>{
 const full=raw('assets/ck-full-exam-v82.js'),mixed=raw('assets/ck-mixed-mock-v129.js');
 A.match(full,/event\.ctrlKey&&!navKey/);
 A.match(full,/const navKey=event\.key==='ArrowLeft'\|\|event\.key==='ArrowRight'/);
 A.match(mixed,/e.ctrlKey&&!\['ArrowLeft','ArrowRight'\]\.includes\(e.key\)/);
 for(const src of [full,mixed]){A.match(src,/INPUT\|TEXTAREA\|SELECT/);A.match(src,/isComposing/)}
 A.match(full,/100\*60\*1000/);A.match(mixed,/DURATION=6000000/);
});
function workerFixture(options={}){
 const events={},saved=new Map(),logs=[],path='./assets/ck-graph-direct-v149.js?v=150';
 const prior='conceptknot-study-v154-p4-draft-coverage',current='conceptknot-study-v155-multiphase-direct-grips';
 const res=(type='application/javascript')=>({ok:true,status:200,headers:{get:()=>type},clone(){return res(type)}});
 saved.set(prior,new Map([[path,res()]]));
 let skip=0;
 const cacheName=n=>({async addAll(urls){
  if(options.failCore)throw Error('core unavailable');
  for(const url of urls)saved.get(n).set(url,res(url.endsWith('.html')?'text/html':'application/javascript'))
 },async match(url){return saved.get(n).get(url)},
  async put(url,r){saved.get(n).set(url,r)},async delete(url){return saved.get(n).delete(url)}});
 const caches={async keys(){return [...saved.keys()]},
  async open(n){if(!saved.has(n))saved.set(n,new Map());return cacheName(n)},
  async delete(n){return saved.delete(n)}};
 const self={location:{href:'https://app.test/sw.js'},
  addEventListener:(name,fn)=>events[name]=fn,
  skipWaiting:async()=>{skip++},clients:{claim:async()=>true}};
 vm.runInNewContext(raw('sw.js'),{self,URL,caches,fetch:async url=>{
  if(options.failOptional&&url===path)throw Error('optional offline');
  return res(url.endsWith('.json')?'application/json':'application/javascript');
 },console:{warn:(...args)=>logs.push(args.join(' ')),info:(...args)=>logs.push(args.join(' '))}});
 const call=name=>{let result;events[name]({waitUntil:p=>result=p});return result};
 return {call,saved,logs,path,prior,current,skip:()=>skip};
}
test('P0 optional cache failure inherits previously validated assets before deleting older cache',async()=>{
 const w=workerFixture({failOptional:true});
 await w.call('install');
 A.equal(w.skip(),1);
 A.equal(w.saved.get(w.current).get(w.path).ok,true);
 A.ok(w.logs.some(x=>x.includes('보존')));
 await w.call('activate');
 A.equal(w.saved.has(w.prior),false);
 A.equal(w.saved.get(w.current).get(w.path).ok,true);
});
test('P0 critical failure retains old version and never takes control',async()=>{
 const w=workerFixture({failCore:true});
 await A.rejects(w.call('install'),/core unavailable/);
 A.equal(w.skip(),0);A.equal(w.saved.has(w.prior),true);
});
test('P7 checklists remain user-marked and P4 expert checks stay unreviewed',()=>{
 const qa=raw('assets/ck-manual-qa-v115.js'),sw=raw('sw.js'),diag=raw('assets/ck-data-diagnostics-v88.js');
 for(const id of ['chart-grips-v155','chart-nudge-v155','typing-korean-ime-v155','mock-ctrl-arrow-v155','p4-unreviewed-v155','offline-optional-reuse-v155'])A.ok(qa.includes("id:'"+id+"'"));
 A.match(qa,/ck115-manual-device-verification-v1/);
 A.match(qa,/PASS \(직접 확인\)/);
 A.ok(sw.includes('ck-typing-ime-guard-v155.js?v=155'));
 A.match(sw,/conceptknot-study-v155-multiphase-direct-grips/);
 A.match(diag,/conceptknot-study-v155-multiphase-direct-grips/);
 const core=(sw.match(/const CRITICAL=\[([\s\S]*?)\];/)||[])[1];
 A.equal((core.match(/'\.\//g)||[]).length,11);
 const report=JSON.parse(raw('data/reports/recent-five-coverage.json'));
 A.equal(report.draftCount,400);A.equal(report.publishedCount,0);
 A.equal(JSON.parse(raw('vercel.json')).git.deploymentEnabled,false);
 A.equal(fs.existsSync('.github/workflows'),false);
});

