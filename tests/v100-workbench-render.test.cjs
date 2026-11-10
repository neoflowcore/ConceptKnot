'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('400-question workbench renders real readiness counts and batch controls',async()=>{
 const bank=Object.fromEntries(JSON.parse(read('data/official-2021-2025.json')).map(q=>[q.id,q]));
 const bundles=Object.fromEntries([2021,2022,2023,2024,2025].map(y=>[y,JSON.parse(read(
  'data/explanations/official-'+y+'.json'))]));
 const panel={innerHTML:'',hidden:true,querySelector(){return null}};
 const button={setAttribute(){},textContent:''},events={};
 const rootNode={querySelector:s=>s==='[data-ck81-panel]'?panel:
  s==='[data-ck81-toggle]'?button:null};
 const host={prepend(node){host.child=node}};
 const document={readyState:'loading',addEventListener:(k,fn)=>{events[k]=fn},
  createElement:()=>rootNode,getElementById:id=>id==='main'?host:
   id==='ck81-workbench'?host.child:null};
 const window={RECALL_OFFICIAL:bank,addEventListener(){},
  CK79Study:{snapshot:()=>({review:{},mistakes:[]})},
  CK86ExamBridge:{getDue:()=>({rows:[],future:0})}};
 const fetch=async url=>({ok:true,json:async()=>bundles[Number(url.match(/20\d\d/)[0])]});
 vm.runInNewContext(read('assets/ck-study-workbench-v81.js'),
  {window,document,localStorage:{getItem(){return null}},fetch,Date,Intl});
 window.CK81Workbench.open();
 for(let i=0;i<90;i++)await Promise.resolve();
 assert.equal(window.CK81Workbench.getState().loaded,400);
 assert.equal(window.CK81Workbench.getState().loadErrors,0);
 assert.match(panel.innerHTML,/미작성 해설 160/);
 assert.match(panel.innerHTML,/data-ck81-batch-prompt/);
 assert.match(panel.innerHTML,/data-ck81-batch-queue/);
 assert.match(panel.innerHTML,/공식 해설 근거 검수/);
});
