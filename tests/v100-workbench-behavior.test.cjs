'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const code=fs.readFileSync(path.resolve(__dirname,'../assets/ck-study-workbench-v81.js'),'utf8');
function boot(records={}){
 const local=new Map(),events={},writes=[];
 const q=Object.fromEntries([1,2,3,4].map(n=>['2025-'+n,
  {id:'2025-'+n,verified:true,year:2025,number:n,subject:'estate',question:'Q '+n,
   options:['a','b','c','d','e'],correct:[1],paperUrl:'https://example.org/sample.pdf'}]));
 if(Object.keys(records).length)local.set('ck81-review-workbench-v1',JSON.stringify({
  schemaVersion:1,scope:'personal-unpublished-workbench',records}));
 const window={RECALL_OFFICIAL:q,addEventListener:(k,f)=>(events[k]??=[]).push(f),
  CK79Study:{snapshot:()=>({review:{},mistakes:[]})},
  CK86ExamBridge:{getDue:()=>({rows:[{id:'2025-1',source:'v82-official-mock'}],future:0})}};
 const storage={getItem:k=>local.get(k)??null,
  setItem:(k,v)=>{writes.push(k);local.set(k,String(v))}};
 const document={readyState:'loading',addEventListener(){},getElementById(){return null}};
 vm.runInNewContext(code,{window,document,localStorage:storage,Date,Intl});
 return {app:window.CK81Workbench,events,local,storage,writes};
}
test('workbench starts with empty local state and unified review queue',()=>{
 const x=boot();assert.equal(x.app.getState().storageIssue,'');
 assert.deepEqual([...x.app.dueIds().due],['2025-1']);
});
test('batch research marks only waiting records and writes once',()=>{
 const x=boot({'2025-2':{status:'hold',bookmark:false,updatedAt:1},
  '2025-3':{status:'ready',bookmark:false,updatedAt:1}});
 const r=x.app.markResearchBatch(['2025-1','2025-2','2025-3','2025-1']);
 assert.equal(r.count,1);assert.equal(x.writes.length,1);
 const got=JSON.parse(x.local.get('ck81-review-workbench-v1')).records;
 assert.equal(got['2025-1'].status,'researching');
 assert.equal(got['2025-2'].status,'hold');assert.equal(got['2025-3'].status,'ready');
});
test('external update is not overwritten before refresh',()=>{
 const x=boot();x.app.markResearchBatch(['2025-1']);
 x.storage.setItem('ck81-review-workbench-v1','{"from":"another tab"}');
 const r=x.app.markResearchBatch(['2025-4']);
 assert.equal(r.ok,false);
});
test('question packet preserves sources and official answer distinction',()=>{
 const x=boot(),q={id:'2025-1',year:2025,number:1,subject:'estate',
  question:'Question',options:['a','b','c','d','e'],correct:[1,3],
  paperUrl:'https://example.org/paper.pdf'};
 const item={q,p:{bookmark:false},entry:{quality:{status:'draft'}},
  isDue:true,isMistake:false,visualReviewed:false,textScore:.85,
  reasonReviewed:false,canonical:'draft'};
 const result=x.app.researchPacket(['2025-1'],[item]);
 assert.match(result,/복수정답 인정/);assert.match(result,/선지 5:/);
 assert.match(result,/example\.org\/paper\.pdf/);
});
test('research scoring raises overdue and low OCR priorities',()=>{
 const x=boot(),q={correct:[1]};
 const base={q,p:{bookmark:false},isDue:false,isMistake:false,visualReviewed:true,
  textScore:.96,reasonReviewed:true,canonical:'draft'};
 assert.ok(x.app.riskScore({...base,isDue:true})>x.app.riskScore(base));
 assert.ok(x.app.riskScore({...base,textScore:.80})>x.app.riskScore(base));
});

test('cross-tab storage event accepts valid progress and rejects malformed data',()=>{
 const key='ck81-review-workbench-v1',e=boot();
 const other={schemaVersion:1,scope:'personal-unpublished-workbench',
  records:{'2025-4':{status:'researching',bookmark:true,updatedAt:12}}};
 e.storage.setItem(key,JSON.stringify(other));
 for(const listener of e.events.storage||[])listener({key,newValue:JSON.stringify(other)});
 assert.equal(e.app.getState().progress,1);
 assert.equal(e.app.getState().storageIssue,'');
 e.storage.setItem(key,'not-json');
 for(const listener of e.events.storage||[])listener({key,newValue:'not-json'});
 assert.match(e.app.getState().storageIssue,/읽지|손상/);
 assert.equal(e.app.markResearchBatch(['2025-1']).ok,false);
});
