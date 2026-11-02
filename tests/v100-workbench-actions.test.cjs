'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=p=>fs.readFileSync(path.resolve(__dirname,'..',p),'utf8');
test('v100 workbench bulk queue, per-option link and 16-column CSV are interactive',async()=>{
 const q=JSON.parse(read('data/official-2021-2025.json')),bank=Object.fromEntries(q.map(x=>[x.id,x]));
 const bundles=Object.fromEntries([2021,2022,2023,2024,2025].map(y=>[y,JSON.parse(read(
  'data/explanations/official-'+y+'.json'))]));
 const map=new Map(),events={},panel={innerHTML:'',querySelector(){return null}},button={setAttribute(){},textContent:''};
 let writes=0,linkOpened='',csv='';
 const storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>{writes++;map.set(k,v)}};
 const root={querySelector:s=>s==='[data-ck81-panel]'?panel:
  s==='[data-ck81-toggle]'?button:null,contains(){return true}};
 const host={prepend(x){host.child=x}};
 const document={readyState:'loading',addEventListener:(n,fn)=>events[n]=fn,
  getElementById:n=>n==='main'?host:n==='ck81-workbench'?host.child:null,
  createElement:()=>({click(){},remove(){},setAttribute(){}}),
  body:{appendChild(){}}};
 document.createElement=tag=>tag==='section'?root:{click(){},remove(){}};
 const window={RECALL_OFFICIAL:bank,addEventListener(){},
  CK83Links:{openQuestion:id=>{linkOpened=id;return true}},
  CK79Study:{snapshot:()=>({review:{},mistakes:[]})},
  CK86ExamBridge:{getDue:()=>({rows:[],future:0})}};
 class BlobMock{constructor(parts){this.text=parts.join('');}}
 const URLMock={createObjectURL:blob=>{csv=blob.text;return 'blob:mock'},revokeObjectURL(){}};
 const fetch=async url=>({ok:true,json:async()=>bundles[Number(url.match(/20\d{2}/)[0])]});
 vm.runInNewContext(read('assets/ck-study-workbench-v81.js'),{
  window,document,localStorage:storage,fetch,Blob:BlobMock,URL:URLMock,
  navigator:{},setTimeout:()=>{},Date,Intl});
 window.CK81Workbench.open();
 for(let i=0;i<90;i++)await Promise.resolve();
 const click=(key,dataset={})=>{
  const target={dataset,hasAttribute:k=>k===key,closest(){return this}};
  events.click({target});
 };
 click('data-ck81-batch-queue');
 assert.equal(writes,1);
 assert.equal(Object.keys(JSON.parse(map.get('ck81-review-workbench-v1')).records).length,5);
 click('data-ck81-choice-note',{ck81ChoiceNote:'2025-1'});
 assert.equal(linkOpened,'2025-1');
 click('data-ck81-export',{ck81Export:'csv'});
 const lines=csv.split('\r\n'),columns=line=>(line.match(/"(?:[^"]|"")*"/g)||[]).length;
 assert.equal(columns(lines[0]),16);assert.equal(columns(lines[1]),16);
 assert.match(lines[0],/공식 해설 근거 검수/);
 assert.match(lines[1],/researching/);
});
