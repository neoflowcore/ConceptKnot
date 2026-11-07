/* ConceptKnot v130: source-locked five-set integrity and review UI regression.
 * Manual/local-only: node --test tests/v130-mixed-source-locked-review.test.cjs
 */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm');
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const SOURCE=read('assets/ck-mixed-mock-v129.js'),KEY='ck129-mixed-sessions-v1';
const BANK=Object.fromEntries(Array.from({length:800},(_,i)=>{
 const year=2016+Math.floor(i/80),number=i%80+1,id=year+'-'+number;
 return [id,{id,year,number,subject:number<=40?'estate':'civil',verified:true,
  question:'공식 A형 '+id,options:['선지1','선지2','선지3','선지4','선지5'],
  correct:[1],originalUrl:'https://example.test/paper/'+year}];
}));
function harness({render=false}={}){
 const store=new Map(),events={},calls=[],focused=[];
 const root={isConnected:true,innerHTML:'',getClientRects:()=>[{}],contains:()=>true,
  querySelector:selector=>({focus(){focused.push(selector)}})};
 const host={before(){}};
 const doc={readyState:'loading',hidden:false,
  addEventListener:(name,cb)=>{events[name]=cb},
  dispatchEvent(){},getElementById:name=>name==='ck129-mixed-mocks'?root:
   name==='main'?{}:null,querySelector:()=>host,createElement:()=>root};
 const win={RECALL_OFFICIAL:BANK,confirm:()=>true,addEventListener(){},
  CK78Analysis:{open:(...args)=>{calls.push(['new',...args]);return true}},
  CK76Study:{openQuestion:(...args)=>{calls.push(['old',...args]);return true}}};
 const storage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)};
 vm.runInNewContext(SOURCE,{window:win,document:doc,localStorage:storage,
  requestAnimationFrame:()=>0,setInterval:()=>1,clearInterval(){},setTimeout(){},
  Date,Promise,Math,Number,Array,Set,Object,String,Event:class{}});
 const click=(attribute,value)=>{
  const t={dataset:{[attribute.replace(/^data-/,'').replace(/-([a-z])/g,(_,x)=>x.toUpperCase())]:value},
   hasAttribute:p=>p===attribute};
  events.click({target:{closest:()=>t},preventDefault(){},stopPropagation(){}});
 };
 if(render)win.CK129MixedMock.open();
 return {api:win.CK129MixedMock,root,store,calls,focused,click};
}
test('each paper is a unique deterministic selection from the original ten-year bank',()=>{
 const a=harness().api,all=[];
 for(let set=1;set<=5;set++){
  const ids=Array.from(a.makeSet(set));
  assert.ok(a.matchesFixedPaper(set,ids));
  assert.equal(ids.length,80);assert.equal(new Set(ids).size,80);
  all.push(...ids);
 }
 assert.equal(new Set(all).size,400);
});
test('same format, different order is never treated as an unchanged fixed paper',()=>{
 const a=harness().api,s=a.createAttempt(1);
 const ids=s.ids.slice();[ids[0],ids[1]]=[ids[1],ids[0]];
 assert.ok(a.validIds(ids));assert.equal(a.matchesFixedPaper(1,ids),false);
 assert.equal(a.sanitizeSession({...s,ids}),null);
 assert.equal(a.grade({...s,ids}),null);
});
test('a different valid fixed set cannot be imported under a misleading set number',()=>{
 const a=harness().api,s=a.createAttempt(1),other=a.createAttempt(2);
 assert.equal(a.matchesFixedPaper(1,other.ids),false);
 assert.equal(a.sanitizeSession({...s,ids:other.ids}),null);
 assert.equal(a.cleanStore({schemaVersion:1,revision:0,active:{...s,ids:other.ids},history:[]}),null);
});
test('restoring altered running or submitted paper cannot overwrite trusted local answers',()=>{
 const f=harness(),a=f.api,original=a.createAttempt(1),forged={...original,ids:original.ids.slice()};
 [forged.ids[0],forged.ids[1]]=[forged.ids[1],forged.ids[0]];
 assert.throws(()=>a.mergeRestore({active:original,history:[]},{active:forged,history:[]}),/세트·답안·시간/);
 const submitted={...forged,status:'submitted',submittedAt:original.startedAt+200,
  reason:'manual',remainingMs:0};
 assert.throws(()=>a.mergeRestore({active:original,history:[]},{active:null,history:[submitted]}),/세트·답안·시간/);
});
test('paused attempts cannot change flags or answers until resumed',()=>{
 const f=harness(),a=f.api;
 assert.equal(a.start(1),true);assert.equal(a.flag(),true);
 assert.equal(a.pause(),true);
 const saved=f.store.get(KEY);
 assert.equal(a.flag(),false);assert.equal(a.answer(3),false);
 assert.equal(f.store.get(KEY),saved);
 assert.equal(a.resume(),true);assert.equal(a.flag(),true);
});
test('score filters show exactly the chosen wrong or unanswered rows, without editing session',()=>{
 const f=harness({render:true}),a=f.api;
 a.start(1);a.answer(2);a.goto(1);a.answer(1);a.finish('manual');
 const saved=f.store.get(KEY);
 assert.equal((f.root.innerHTML.match(/class="ck129-result-row"/g)||[]).length,80);
 f.click('data-ck130-filter','wrong');
 assert.equal(a.getState().resultFilter,'wrong');
 assert.equal((f.root.innerHTML.match(/class="ck129-result-row"/g)||[]).length,1);
 f.click('data-ck130-filter','blank');
 assert.equal((f.root.innerHTML.match(/class="ck129-result-row"/g)||[]).length,78);
 assert.equal(f.store.get(KEY),saved);
});
test('filter selection restores keyboard focus to the same pressed result control',()=>{
 const f=harness({render:true}),a=f.api;
 a.start(1);a.finish();
 f.click('data-ck130-filter','wrong');
 assert.equal(f.focused[f.focused.length-1],'[data-ck130-filter="wrong"]');
 f.click('data-ck130-filter','flagged');
 assert.equal(f.focused[f.focused.length-1],'[data-ck130-filter="flagged"]');
});

test('no-wrong or no-blank filters show a clear empty state rather than a blank screen',()=>{
 const f=harness({render:true}),a=f.api;
 a.start(1);for(let i=0;i<80;i++){a.answer(1);if(i<79)a.goto(i+1);}
 a.finish();
 f.click('data-ck130-filter','wrong');
 assert.match(f.root.innerHTML,/이 세트에는 오답이 없습니다/);
 f.click('data-ck130-filter','blank');
 assert.match(f.root.innerHTML,/이 세트에는 미응답 문항이 없습니다/);
});
test('flagged filter isolates held questions without changing raw exam answers',()=>{
 const f=harness({render:true}),a=f.api;
 a.start(1);a.flag();a.goto(2);a.flag();a.finish();
 const original=f.store.get(KEY);
 f.click('data-ck130-filter','flagged');
 assert.equal((f.root.innerHTML.match(/class="ck129-result-row"/g)||[]).length,2);
 assert.equal(f.store.get(KEY),original);
});
test('a result TXT export rejects a stale cross-tab snapshot before starting download',()=>{
 const f=harness({render:true}),a=f.api;
 a.start(1);a.finish();
 const original=f.store.get(KEY),other=JSON.parse(original);
 other.revision+=1;other.active.answers[0]=3;
 f.store.set(KEY,JSON.stringify(other));
 assert.equal(a.getState().active,'submitted');
 // The click path must refuse before constructing Blob or modifying the user record.
 f.click('data-ck129-export','active');
 assert.match(a.getState().message,/다른 탭의 변경/);
 assert.equal(f.store.get(KEY),JSON.stringify(other));
});

test('result review action links to official-year-specific personal evidence editor only',()=>{
 const f=harness({render:true}),a=f.api;
 a.start(1);a.finish();
 const raw=JSON.parse(f.store.get(KEY)),recent=raw.active.ids.find(id=>Number(id.slice(0,4))>=2021),
 older=raw.active.ids.find(id=>Number(id.slice(0,4))<=2020);
 assert.ok(recent&&older);
 f.click('data-ck130-review',recent);
 f.click('data-ck130-review',older);
 assert.equal(f.calls.length,2);
 assert.equal(f.calls[0][0],'new');assert.equal(f.calls[1][0],'old');
 assert.equal(f.store.get(KEY),JSON.stringify(raw),'read-only review must not change session');
});
test('keyboard focus survives answer button re-render and digit shortcut still records a choice',()=>{
 const data=new Map(),listeners={};let focused=0;
 const root={isConnected:true,innerHTML:'',getClientRects:()=>[{}],contains:()=>true,
  querySelector:()=>({focus(){focused++}})};
 const doc={readyState:'loading',hidden:false,
  addEventListener:(type,fn)=>{listeners[type]=fn},getElementById:id=>
    id==='ck129-mixed-mocks'?root:id==='main'?{}:null,
  querySelector:()=>({before(){}}),dispatchEvent(){}};
 const win={RECALL_OFFICIAL:BANK,confirm:()=>true,addEventListener(){}};
 const storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
 vm.runInNewContext(SOURCE,{window:win,document:doc,localStorage:storage,
  requestAnimationFrame:()=>0,setInterval:()=>1,clearInterval(){},setTimeout(){},Event:class{}});
 const api=win.CK129MixedMock;api.open();api.start(1);
 const before=focused;api.answer(2);
 assert.ok(focused>before,'a replaced answer button should not lose all keyboard focus');
 let prevented=0;
 listeners.keydown({target:{tagName:'DIV'},key:'3',keyCode:51,ctrlKey:false,altKey:false,
  metaKey:false,isComposing:false,repeat:false,
  preventDefault(){prevented++},stopImmediatePropagation(){}});
 const saved=JSON.parse(data.get(KEY));
 assert.equal(prevented,1);assert.equal(saved.active.answers[0],3);
});

test('history cards show computed subject scores with honest source-loading fallback',()=>{
 const f=harness({render:true}),a=f.api;
 a.start(1);for(let i=0;i<80;i++){a.answer(1);if(i<79)a.goto(i+1);}
 a.finish();
 f.click('data-ck129-history',undefined);
 assert.match(f.root.innerHTML,/학개론 100.0 \/ 민법 100.0/);
 assert.match(f.root.innerHTML,/평균 100.0/);
 assert.match(f.root.innerHTML,/연습 기준 충족/);
});

test('cross-tab pause stops the visible-only timer even if the workspace is detached',()=>{
 const store=new Map(),events={},callbacks={},root={
  isConnected:true,innerHTML:'',getClientRects:()=>[{}],contains:()=>true,
  querySelector:()=>({focus(){}})};
 let started=0,stopped=0;
 const doc={hidden:false,readyState:'loading',
  addEventListener:(name,cb)=>{events[name]=cb},dispatchEvent(){},
  getElementById:name=>name==='ck129-mixed-mocks'?root:name==='main'?{}:null,
  querySelector:()=>({before(){}})};
 const win={RECALL_OFFICIAL:BANK,confirm:()=>true,
  addEventListener:(name,cb)=>{callbacks[name]=cb}};
 const storage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)};
 vm.runInNewContext(SOURCE,{window:win,document:doc,localStorage:storage,
  requestAnimationFrame:()=>0,setInterval:()=>{started++;return 88},
  clearInterval:()=>{stopped++},setTimeout(){},Event:class{}});
 win.CK129MixedMock.open();
 assert.equal(win.CK129MixedMock.start(1),true);
 assert.equal(started,1);
 root.isConnected=false;
 const newer=JSON.parse(store.get(KEY));
 newer.active.status='paused';newer.active.remainingMs=4000000;newer.revision++;
 store.set(KEY,JSON.stringify(newer));callbacks.storage({key:KEY});
 assert.equal(win.CK129MixedMock.getState().active,'paused');
 assert.equal(stopped,1,'detached tab must not keep the exam clock alive');
});

test('modified mixed JS/CSS use current cache query and auto-deploy stays disabled',()=>{
 const html=read('index.html'),sw=read('sw.js'),vc=JSON.parse(read('vercel.json'));
 assert.match(html,/ck-mixed-mock-v129\.js\?v=133/);
 assert.match(html,/ck-mixed-mock-v129\.css\?v=130/);
 assert.match(sw,/conceptknot-study-v133-exam-unified/);
 assert.equal(vc.git.deploymentEnabled,false);
 assert.equal(fs.existsSync(path.join(ROOT,'.github/workflows')),false);
 new vm.Script(SOURCE);
});
