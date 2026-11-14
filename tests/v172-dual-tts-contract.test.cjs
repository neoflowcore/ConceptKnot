'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {create}=require('../assets/ck-reading-queue-v172.js');
const {split}=require('../assets/ck-tts-chunks-v171.js');
test('arbitrary Korean text is read in order, without silently dropping a sentence',async()=>{
 const seen=[],text=('민법 제107조의 요건을 확인합니다. ').repeat(100);
 const q=create({split,synthesize:async s=>s,play:async s=>{seen.push(s)}});
 const state=await q.start(text);
 assert.equal(state.state,'ended');assert.equal(state.cursor,state.total);
 assert.deepEqual(seen,q.getSegments());
 assert.equal(seen.join('').replace(/\s/g,''),text.replace(/\s/g,''));
});
test('temporary synthesis failures retry same segment, not prior successful segments',async()=>{
 const calls=[],heard=[],q=create({split:s=>s.split('|'),maxRetries:2,
  synthesize:async(s,ctx)=>{calls.push([s,ctx.attempt]);if(s==='둘'&&ctx.attempt===0)throw Error('retry');return s;},
  play:async s=>{heard.push(s)}});
 assert.equal((await q.start('하나|둘|셋')).state,'ended');
 assert.deepEqual(heard,['하나','둘','셋']);
 assert.deepEqual(calls,[['하나',0],['둘',0],['둘',1],['셋',0]]);
});
test('persistent failure retains exact cursor and resumes only after explicit request',async()=>{
 let allow=false;const heard=[],q=create({split:s=>s.split('|'),maxRetries:1,
  synthesize:async s=>{if(s==='둘'&&!allow)throw Error('blocked');return s;},play:async s=>heard.push(s)});
 const first=await q.start('하나|둘|셋');assert.equal(first.state,'error');assert.equal(first.cursor,1);
 assert.deepEqual(heard,['하나']);allow=true;
 const second=await q.resume();assert.equal(second.state,'ended');assert.deepEqual(heard,['하나','둘','셋']);
});
test('cancel invalidates in-flight synthesis, preventing stale audio playback',async()=>{
 let release;const heard=[],q=create({split:s=>[s],synthesize:()=>new Promise(resolve=>release=resolve),play:async s=>heard.push(s)});
 const task=q.start('가');q.cancel();release('가');await task;
 assert.deepEqual(heard,[]);assert.equal(q.getState().state,'stopped');
});
