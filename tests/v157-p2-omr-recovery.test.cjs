/* v157 P2/P3/P5 recovery regression. Manual Node tests only. */
'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
function fakeBoard(){
 const docListeners={},winListeners={},store=new Map(),classes=new Set();
 const makeStyle=()=>({values:{},setProperty(k,v){this.values[k]=v},removeProperty(k){delete this.values[k]}});
 const handle={values:{},setAttribute(k,v){this.values[k]=v},
  setPointerCapture(id){this.captured=id},releasePointerCapture(id){this.released=id}};
 const board={dataset:{ckV7Key:'test'},style:makeStyle(),querySelector:q=>q==='[data-ck21-board-resize]'?handle:null};
 const doc={readyState:'loading',hidden:false,
  body:{classList:{add:k=>classes.add(k),remove:k=>classes.delete(k)},style:makeStyle()},
  getElementById:id=>id==='main'?{}:null,
  querySelector:q=>q==='#main .ck-v7-board'?board:null,
  addEventListener:(kind,fn)=>{docListeners[kind]=fn}};
 const win={addEventListener:(kind,fn)=>{winListeners[kind]=fn}};
 const storage={getItem:k=>store.get(k)??null,setItem:(k,v)=>{store.set(k,v)}};
 class MO{observe(){}}
 vm.runInNewContext(read('assets/ck-mobile-board-v21.js'),
  {document:doc,window:win,localStorage:storage,MutationObserver:MO,Date});
 docListeners.DOMContentLoaded();
 const send=(kind,id,y,opts={})=>{
  let prevented=0;
  const event={type:kind,pointerId:id,clientY:y,pointerType:opts.pointerType||'touch',
   isPrimary:opts.isPrimary??true,cancelable:true,
   preventDefault:()=>prevented++,
   target:{closest:k=>k==='[data-ck21-board-resize]'?
    (opts.onHandle===false?null:handle):
    k==='.ck-v7-writing-surface'&&opts.penWriting?{}:null}};
  if(!docListeners[kind])throw Error('missing listener '+kind);
  docListeners[kind](event);
  return prevented;
 };
 return {send,docListeners,winListeners,doc,win,handle,board,classes,store,api:win.CK21Board};
}
test('P2 board multi-touch cannot steal first active height pointer',()=>{
 const f=fakeBoard();
 f.send('pointerdown',41,140);
 f.send('pointermove',41,210);A.equal(f.api.getState().extend,70);
 f.send('pointerdown',42,220,{isPrimary:false});
 f.send('pointermove',42,300);A.equal(f.api.getState().extend,70);
 f.send('pointermove',41,250);A.equal(f.api.getState().extend,110);
 f.send('pointerup',41,250);
 A.equal(f.store.get('ck21-board-extend'),'110');
 A.equal(f.api.getState().dragging,false);
});
test('P2 canceled resize rolls back and does not persist accidental height',()=>{
 const f=fakeBoard();
 f.send('pointerdown',1,100);f.send('pointermove',1,270);
 A.equal(f.api.getState().extend,170);
 f.send('pointercancel',1,270);
 A.equal(f.api.getState().extend,0);
 A.equal(f.store.has('ck21-board-extend'),false);
});
test('P2 blur rolls back active resize and clears orphaned pen CSS state',()=>{
 const f=fakeBoard();
 f.send('pointerdown',3,100);
 f.send('pointermove',3,220);
 f.send('pointerdown',4,190,{pointerType:'pen',onHandle:false,penWriting:true});
 A.equal(f.classes.has('ck21-stylus-writing'),true);
 f.winListeners.blur();
 A.equal(f.api.getState().extend,0);
 A.equal(f.classes.has('ck21-stylus-writing'),false);
 A.equal(f.api.getState().dragging,false);
});
function fakeIme(){
 const listeners={},frames=[];
 class E{constructor(type,options){this.type=type;this.bubbles=options?.bubbles}}
 const win={requestAnimationFrame:f=>(frames.push(f),frames.length),Event:E,
  document:{addEventListener:(name,fn)=>listeners[name]=fn}};
 vm.runInNewContext(read('assets/ck-typing-ime-guard-v155.js'),{window:win});
 const field={tagName:'TEXTAREA',value:'가',isConnected:true,__ck31Composing:false,
  events:[],closest:()=>({}),dispatchEvent(e){this.events.push(e.type);listeners.input({target:this})}};
 return {listeners,frames,field,api:win.CK155TypingImeGuard};
}
test('P2 late Hangul last syllable after native input is reconciled just once',()=>{
 const f=fakeIme(),{listeners,field,frames}=f;
 listeners.compositionstart({target:field});
 listeners.compositionend({target:field});
 listeners.input({target:field});  // native final event, but still value '가'
 field.value='각';              // IME silently commits a later letter
 frames.shift()();
 A.deepEqual(field.events,['input']);A.equal(f.api.getStats().recovered,1);
});
test('P2 correct native final input and new composition do not double-fire',()=>{
 const f=fakeIme(),{listeners,field,frames}=f;
 listeners.compositionstart({target:field});
 listeners.compositionend({target:field});
 field.value='강';listeners.input({target:field});
 frames.shift()();A.equal(field.events.length,0);
 listeners.compositionstart({target:field});
 listeners.compositionend({target:field});
 field.value='강아';listeners.compositionstart({target:field});
 frames.shift()();A.equal(field.events.length,0);
});
function fakeOfficial(initial=null){
 const KEY='ck82-exam-sessions-v1',store=new Map(initial?[[KEY,JSON.stringify(initial)]]:[]);
 const evDoc={},evWin={};
 const bank={};
 for(let i=1;i<=80;i++){
  const id='2025-'+i;
  bank[id]={id,year:2025,verified:true,question:id+' 공식문항',
   subject:i<=40?'estate':'civil',options:['1','2','3','4','5'],correct:[1]};
 }
 const doc={hidden:false,readyState:'loading',addEventListener:(k,fn)=>evDoc[k]=fn,
  getElementById:()=>null,querySelector:()=>null,dispatchEvent(){}};
 const win={RECALL_OFFICIAL:bank,confirm:()=>true,addEventListener:(k,fn)=>evWin[k]=fn,
  clearInterval(){},setInterval:()=>11};
 const localStorage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)};
 const ctx={window:win,document:doc,localStorage,setInterval:()=>11,clearInterval:()=>{},
  requestAnimationFrame:()=>{},setTimeout:()=>{},Date,Promise,Intl,
  Event:class{constructor(type){this.type=type}}};
 vm.runInNewContext(read('assets/ck-full-exam-v82.js'),ctx);
 const api=win.CK82FullExam;
 return {api,store,KEY,evDoc,evWin,bank};
}
function submitted(api,start=Date.now()-120000,year=2025){
 const a=api.newAttempt(year,start);
 return {...a,status:'submitted',submittedAt:start+30000,remainingMs:0,
  reason:'manual',score:{estate:0,civil:0,total:0,average:0,passed:false}};
}
const own=obj=>JSON.parse(JSON.stringify(obj));
test('P3/P5 official merge retains local paused OMR, merges submitted history',()=>{
 const f=fakeOfficial(),a=submitted(f.api),b=submitted(f.api,a.startedAt-20000);
 const unsent=f.api.newAttempt(2025,Date.now()-5000);unsent.status='paused';
 unsent.answers[8]=4;unsent.flags[14]=true;
 const local={schemaVersion:1,revision:3,active:unsent,history:[a]};
 const incoming={schemaVersion:1,revision:6,active:null,history:[b]};
 const merged=own(f.api.mergeRestore(local,incoming));
 A.equal(merged.active.answers[8],4);A.equal(merged.active.flags[14],true);
 A.equal(merged.active.status,'paused');A.equal(merged.history.length,2);
 A.equal(local.history.length,1);A.equal(incoming.history.length,1);
});
test('P3/P5 official merge deduplicates identical submissions',()=>{
 const f=fakeOfficial(),a=submitted(f.api);
 const s={schemaVersion:1,revision:0,active:null,history:[a]};
 A.equal(f.api.mergeRestore(s,s).history.length,1);
});
test('P3/P5 official merge rejects conflicting identities and overflow, never drops a session',()=>{
 const f=fakeOfficial(),a=submitted(f.api);
 const b=own(a);b.answers[0]=3;
 const pack=history=>({schemaVersion:1,revision:1,active:null,history});
 A.throws(()=>f.api.mergeRestore(pack([a]),pack([b])),/서로 다른 답안/);
 const list=Array.from({length:20},(_,i)=>submitted(f.api,a.startedAt-i*80000));
 const extra=submitted(f.api,a.startedAt-22*80000);
 A.throws(()=>f.api.mergeRestore(pack(list),pack([extra])),/한도 20/);
 A.equal(list.length,20);
});
test('P3/P5 official import refuses stale storage and preserves original raw',async()=>{
 const f=fakeOfficial(),api=f.api,base=api.newAttempt(2025);
 const pack={schemaVersion:1,revision:1,active:null,history:[submitted(api)]};
 f.store.set(f.KEY,JSON.stringify(pack)); // another tab changes after page init
 const result=await api.importBackupFile({size:200,text:async()=>JSON.stringify(pack)});
 A.equal(result,false);
 A.equal(f.store.get(f.KEY),JSON.stringify(pack));
});
test('P3/P5 official UI exposes backup and restore without auto-writing data',()=>{
 const js=read('assets/ck-full-exam-v82.js');
 for(const attr of ['data-ck82-backup','data-ck82-import','data-ck82-import-file'])
  A.ok(js.includes(attr));
 A.ok(js.includes('localStorage.getItem(KEY)!==initial'));
 A.ok(js.includes('mergeRestore(state,incoming)'));
});

