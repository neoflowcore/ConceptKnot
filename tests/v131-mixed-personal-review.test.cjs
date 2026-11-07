/* ConceptKnot v131: independent, local-only personal review regressions. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm');
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const BANK=Object.fromEntries(Array.from({length:800},(_,i)=>{
 const year=2016+Math.floor(i/80),number=i%80+1,id=year+'-'+number;
 return [id,{id,year,number,subject:number<=40?'estate':'civil',verified:true,
  question:'A형 '+id,options:['가','나','다','라','마'],correct:[1],originalUrl:'https://example.test/'+year}];
}));
function setup(){
 const items=new Map(),events={};
 const localStorage={getItem:k=>items.has(k)?items.get(k):null,setItem:(k,v)=>items.set(k,v)};
 const document={readyState:'loading',hidden:false,addEventListener:(k,fn)=>{events[k]=fn;},
  dispatchEvent(){},getElementById:()=>null,querySelector:()=>null,body:null};
 const window={RECALL_OFFICIAL:BANK,addEventListener(){},confirm:()=>true};
 const context={window,document,localStorage,Date,Number,Math,Set,Array,Object,Promise,
  requestAnimationFrame:()=>0,clearInterval(){},setInterval:()=>1,setTimeout:()=>0,Event:class{}};
 vm.runInNewContext(read('assets/ck-mixed-mock-v129.js'),context);
 vm.runInNewContext(read('assets/ck-mixed-review-v131.js'),context);
 return {api:window.CK129MixedMock,review:window.CK131MixedReview,items,window,events};
}
test('no submitted attempts means an empty, source-checked review; no inferred answers',()=>{
 const f=setup(),source=f.review.snapshot(),report=f.review.summarize(source);
 assert.equal(report.ready,true);assert.equal(report.attempts,0);
 assert.equal(report.queue.length,0);assert.equal(report.distinct,0);
});
test('running mixed exam cannot disclose review answer data',()=>{
 const f=setup();assert.equal(f.api.start(1),true);
 const report=f.review.summarize(f.review.snapshot());
 assert.equal(report.ready,false);
 assert.equal(f.review.queueText(report),'');
});
test('submitted answer and omission create priority queue without changing saved answers',()=>{
 const f=setup(),api=f.api;
 assert.equal(api.start(1),true);
 const paper=api.makeSet(1),first=paper[0];
 assert.equal(api.answer(2),true);
 assert.equal(api.flag(),true);
 assert.equal(api.finish('manual'),true);
 const old=f.items.get('ck129-mixed-sessions-v1');
 const report=f.review.summarize(f.review.snapshot());
 assert.equal(report.ready,true);
 assert.equal(report.attempts,1);assert.equal(report.distinct,80);
 assert.equal(report.subjects[0].wrong,1);assert.equal(report.subjects[1].blank,40);
 assert.equal(report.queue[0].id,first);
 assert.equal(report.queue[0].priority,6);
 assert.equal(f.review.filtered(report,'wrong').length,1);
 assert.equal(f.review.filtered(report,'blank').length,20);
 assert.equal(f.review.filtered(report,'flagged').length,1);
 const txt=f.review.queueText(report,'wrong');
 assert.match(txt,/오답 1회/);
 assert.match(txt,/공식 채점 인정/);
 assert.equal(f.items.get('ck129-mixed-sessions-v1'),old);
});
test('invalid fixed paper and tampered stored records stop analysis, no auto rewrite',()=>{
 const f=setup();assert.equal(f.api.start(1),true);assert.equal(f.api.finish(),true);
 const id='ck129-mixed-sessions-v1',raw=f.items.get(id),stored=JSON.parse(raw);
 stored.history[0].ids.reverse();
 f.items.set(id,JSON.stringify(stored));
 const source=f.review.snapshot();
 assert.ok(source.error);
 assert.equal(f.review.summarize(source).ready,false);
 assert.ok(f.items.get(id).includes('"ids"'));
});
test('official records must be loaded and validated; no guessed score',()=>{
 const f=setup();f.api.start(1);f.api.finish();
 const src=f.review.snapshot();
 const missing={...BANK};delete missing[f.api.makeSet(1)[0]];
 const report=f.review.summarize(src,missing);
 assert.equal(report.ready,false);assert.equal(report.needBank,true);
});
test('optional review CSS and JS are linked once and offline SW does not enable Git auto deploy',()=>{
 const html=read('index.html'),sw=read('sw.js'),diag=read('assets/ck-data-diagnostics-v88.js');
 const config=JSON.parse(read('vercel.json'));
 for(const file of ['ck-mixed-review-v131.js?v=133','ck-mixed-review-v131.css?v=131']){
  assert.ok(html.includes('./assets/'+file));assert.ok(sw.includes('./assets/'+file));
 }
 assert.match(sw,/conceptknot-study-v136-nav-voice-plan/);
 assert.match(diag,/conceptknot-study-v136-nav-voice-plan/);
 assert.equal(config.git.deploymentEnabled,false);
 assert.equal(fs.existsSync(path.join(ROOT,'.github','workflows')),false);
});
