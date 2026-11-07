'use strict';
/* Fake-device queue tests. Not hardware, OS speaker, or female-voice acceptance. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const code=fs.readFileSync(path.join(__dirname,'../assets/ck-voice-controller-v138.js'),'utf8');
function fixture({voices=[],behavior='ok'}={}){
 const timers=new Map(),heard=[],states=[],progress=[],done=[],splits=[];
 let nextId=0,stops=0;
 const clock={set(fn,ms){const id=++nextId;timers.set(id,{fn,ms});return id;},clear(id){timers.delete(id);}};
 const synth={getVoices:()=>voices,cancel(){stops++;},pause(){},resume(){},speak(u){
  heard.push(u);
  if(behavior==='silent'||behavior==='manual')return;
  if(behavior==='blocked'){u.onerror({error:'not-allowed'});return;}
  if(behavior==='no-start'){u.onend();return;}
  if(behavior==='too-long'&&u.text.length>85){u.onerror({error:'text-too-long'});return;}
  u.onstart();u.onend();
 }};
 const window={};vm.runInNewContext(code,{window,globalThis:window});
 const c=window.CKVoiceControllerFactory.create({clock,synthesis:()=>synth,
  newUtterance:text=>({text}),getVoices:()=>synth.getVoices(),
  selectVoice:()=>voices.find(v=>String(v.lang).toLowerCase().startsWith('ko')),
  onState:s=>states.push(s),onStart:(i,t)=>progress.push([i,t]),onDone:s=>done.push(s),
  onSplit:(i,p)=>splits.push([i,p])});
 return {c,synth,heard,states,progress,done,timers,splits,get stops(){return stops;}};
}
test('empty voice list asks ko-KR immediately and only completes with start+end',()=>{
 const x=fixture();x.c.play({segments:['첫째','둘째']});
 assert.equal(x.c.getState().status,'ended');assert.equal(x.c.getState().completed,2);
 assert.deepEqual(x.progress.map(p=>p[1]),['첫째','둘째']);
 assert.equal(x.heard[0].lang,'ko-KR');assert.equal(x.heard[0].voice,null);assert.equal(x.done.length,1);
});
test('foreign-only voice fails visibly without a false success',()=>{
 const x=fixture({voices:[{lang:'en-US'}]});
 assert.equal(x.c.play({segments:['안녕']}).ok,false);
 assert.equal(x.c.getState().status,'error');assert.equal(x.heard.length,0);
});
test('silent engine watchdog does not advance a failed segment',()=>{
 const x=fixture({behavior:'silent'});x.c.play({segments:['가','나']});
 const t=[...x.timers.values()];assert.equal(t.length,1);assert.equal(t[0].ms,7000);t[0].fn();
 assert.equal(x.c.getState().status,'error');assert.equal(x.c.getState().completed,0);assert.equal(x.done.length,0);
});
test('end-without-start and not-allowed do not complete',()=>{
 for(const behavior of ['blocked','no-start']){
  const x=fixture({behavior});x.c.play({segments:['안녕']});
  assert.equal(x.c.getState().status,'error');assert.equal(x.c.getState().completed,0);
 }
});
test('too-long splits and retries exactly the same words',()=>{
 const phrase=Array.from({length:35},(_,i)=>'문장'+(i+1)+'은').join(' ');
 const x=fixture({behavior:'too-long'});x.c.play({segments:[phrase]});
 const success=x.heard.filter(u=>u.text.length<=85);
 assert.equal(success.map(u=>u.text).join(' ').replace(/\s+/g,' '),phrase);
 assert.equal(x.c.getState().completed,success.length);assert.ok(x.splits.length>=1);
});
test('stop invalidates stale utterance callbacks',()=>{
 const x=fixture({behavior:'manual'});x.c.play({segments:['가','나']});
 const old=x.heard[0];x.c.stop(true);old.onstart();old.onend();
 assert.equal(x.progress.length,0);assert.equal(x.done.length,0);assert.equal(x.c.getState().status,'idle');
});
test('40 segments have exactly-once starts and a single finish at 1.5x',()=>{
 const x=fixture({voices:[{lang:'ko-KR'}]});
 x.c.play({segments:Array.from({length:40},(_,i)=>'문항 '+(i+1)),rate:1.5});
 assert.equal(x.heard.length,40);assert.ok(x.heard.every(v=>v.rate===1.5));
 assert.equal(x.done.length,1);assert.equal(x.c.getState().completed,40);
});
test('pause defers next utterance until explicit resume',()=>{
 const x=fixture({behavior:'manual'});x.c.play({segments:['첫','둘']});
 const first=x.heard[0];first.onstart();assert.equal(x.c.togglePause(),true);first.onend();
 assert.equal(x.heard.length,1);assert.equal(x.c.getState().status,'paused');
 x.c.togglePause();assert.equal(x.heard.length,2);x.heard[1].onstart();x.heard[1].onend();
 assert.equal(x.c.getState().status,'ended');
});
test('AI requires actual ready engine before any audio job',()=>{
 const x=fixture();const r=x.c.play({engine:'neural',segments:['안녕']});
 assert.equal(r.ok,false);assert.equal(x.c.getState().status,'error');assert.equal(x.heard.length,0);
});
test('AI completes only after real audio-start callback',async()=>{
 const root={};vm.runInNewContext(code,{window:root,globalThis:root});
 const done=[];let count=0;
 const c=root.CKVoiceControllerFactory.create({aiReady:()=>true,
  speakAI:async(t,rate,onStart)=>{count++;onStart();},onDone:s=>done.push(s)});
 c.play({segments:['가','나'],engine:'neural'});
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(count,2);assert.equal(done.length,1);assert.equal(c.getState().status,'ended');
});
test('AI late completion after stop cannot finish old queue',async()=>{
 const root={};vm.runInNewContext(code,{window:root,globalThis:root});
 const done=[];let finish;
 const c=root.CKVoiceControllerFactory.create({aiReady:()=>true,
  speakAI:()=>new Promise(resolve=>{finish=resolve;}),onDone:s=>done.push(s)});
 c.play({segments:['지연','둘'],engine:'neural'});c.stop(true);
 finish();await new Promise(resolve=>setImmediate(resolve));
 assert.equal(done.length,0);assert.equal(c.getState().status,'idle');
});
