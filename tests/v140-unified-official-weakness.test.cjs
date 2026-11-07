/* v140 — official + mixed A-form private review integration, no writes to source banks. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),
 path=require('node:path'),vm=require('node:vm');
const ROOT=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const BANK=Object.fromEntries(Array.from({length:800},(_,i)=>{
 const year=2016+Math.floor(i/80),number=i%80+1,id=year+'-'+number;
 return [id,{id,year,number,subject:number<=40?'estate':'civil',verified:true,
  question:'공식 A형 '+id,options:['①','②','③','④','⑤'],correct:[1],originalUrl:'https://example.test/paper'}];
}));
function fixture(){
 const items=new Map(),events=new Map(),writes=[];
 const storage={getItem:k=>items.has(k)?items.get(k):null,
  setItem(k,v){writes.push(k);items.set(k,String(v))},removeItem:k=>items.delete(k)};
 const document={readyState:'loading',hidden:false,getElementById:()=>null,body:null,
  addEventListener:(type,fn)=>events.set(type,(events.get(type)||[]).concat([fn])),
  dispatchEvent(){}};
 const window={RECALL_OFFICIAL:BANK,addEventListener(){},confirm:()=>true,clearInterval(){}};
 const globals={window,document,localStorage:storage,Date,Number,Math,Set,Array,Object,Promise,
  requestAnimationFrame:()=>0,clearInterval(){},setInterval:()=>0,setTimeout:()=>0,Event:class {}};
 for(const file of ['assets/ck-full-exam-v82.js','assets/ck-mixed-mock-v129.js','assets/ck-mixed-review-v131.js'])
  vm.runInNewContext(read(file),globals,{filename:file});
 return {window,items,writes,storage,events,year:window.CK82FullExam,mixed:window.CK129MixedMock,review:window.CK131MixedReview};
}
test('unsubmitted original source arrays remain hidden even when the other engine submitted',()=>{
 const f=fixture();assert.equal(f.year.start(2025),true);
 assert.equal(f.review.summarize(f.review.snapshot()).ready,false);
 assert.equal(f.review.queueText(f.review.summarize(f.review.snapshot())),'');
 assert.equal(f.year.finish(),true);
 assert.equal(f.mixed.start(1),true);
 assert.equal(f.review.summarize(f.review.snapshot()).ready,false);
});
test('both independent 80-item submissions aggregate without double counting or score trust',()=>{
 const f=fixture();assert.equal(f.year.start(2025),true);
 f.year.setAnswer(2);assert.equal(f.year.finish(),true);
 assert.equal(f.mixed.start(1),true);f.mixed.answer(2);f.mixed.flag();
 assert.equal(f.mixed.finish(),true);
 const before=Object.fromEntries(f.items),w=f.writes.length;
 const summary=f.review.summarize(f.review.snapshot());
 assert.equal(summary.ready,true);
 assert.equal(summary.sources.official,1);assert.equal(summary.sources.mixed,1);
 assert.equal(summary.attempts,2);assert.equal(summary.subjects[0].total,80);
 assert.equal(summary.subjects[1].total,80);
 assert.equal(summary.subjects[0].wrong,2);
 assert.equal(summary.subjects[0].flagged,1);
 assert.equal(summary.subjects[1].blank,80);
 assert.equal(f.review.filtered(summary,'wrong').length,2);
 assert.match(f.review.queueText(summary,'all'),/공식 1/);
 assert.equal(f.writes.length,w);
 assert.deepEqual(Object.fromEntries(f.items),before);
});
test('source invalidation blocks analysis without repairing or wiping any exam record',()=>{
 const f=fixture();f.year.start(2025);f.year.finish();f.mixed.start(1);f.mixed.finish();
 const key='ck82-exam-sessions-v1',tampered=JSON.parse(f.items.get(key));
 tampered.history[0].answers[0]=9;
 const raw=JSON.stringify(tampered);
 f.items.set(key,raw);const before=f.writes.length;
 const snap=f.review.snapshot();
 assert.match(snap.error,/공식/);
 assert.equal(f.review.summarize(snap).ready,false);
 assert.equal(f.items.get(key),raw);assert.equal(f.writes.length,before);
});
test('mixed fixed paper and legacy CK131 API remain protected',()=>{
 const f=fixture();f.mixed.start(1);f.mixed.answer(2);f.mixed.finish();
 const summary=f.review.summarize(f.review.snapshot());
 assert.equal(summary.ready,true);assert.equal(summary.sources.mixed,1);assert.equal(summary.sources.official,0);
 assert.equal(summary.queue[0].priority,5);
 assert.equal(f.review.filtered(summary,'wrong')[0].id,f.mixed.makeSet(1)[0]);
});
test('official missing bank yields explicit pending state rather than guessed scores',()=>{
 const f=fixture();f.year.start(2025);f.year.finish();
 const snap=f.review.snapshot(),bank={...BANK};delete bank['2025-7'];
 // Real CK82 checkBank reads the same window.RECALL_OFFICIAL.
 const q=f.window.RECALL_OFFICIAL['2025-7'];
 delete f.window.RECALL_OFFICIAL['2025-7'];
 const res=f.review.summarize(snap,bank);
 assert.equal(res.ready,false);assert.equal(res.needBank,true);
 f.window.RECALL_OFFICIAL['2025-7']=q;
});
test('paused official flags are read-only, mixed session already has the same gate',()=>{
 const code=read('assets/ck-full-exam-v82.js');
 assert.match(code,/function setFlag\(\)\{\s*const s=active\(\);if\(!s\|\|s\.status!=='running'\)return false;/);
 assert.match(code,/\(!canAnswer\?' disabled':''\)/);
 const f=fixture();f.year.start(2025);f.year.pause();
 assert.equal(f.year.getState().active,'paused');
 const before=f.items.get('ck82-exam-sessions-v1');
 assert.equal(f.year.setAnswer(1),false);
 assert.equal(f.items.get('ck82-exam-sessions-v1'),before);
});
test('existing practice and personal records remain in distinct storage keys',()=>{
 const src=read('assets/ck-mixed-review-v131.js');
 assert.match(src,/ck82-exam-sessions-v1/);
 assert.match(src,/ck129-mixed-sessions-v1/);
 assert.match(src,/localStorage\.getItem\(OFFICIAL_KEY\)!==src\.officialRaw/);
 assert.doesNotMatch(src,/localStorage\.removeItem\(/);
});
