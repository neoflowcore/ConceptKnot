'use strict';
/* v112: manual Node tests only. No CI, network calls, application mutations or artifacts.
 * Run locally with: node --test tests/v112-ten-year-explanation.test.cjs
 */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const dir=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(dir,f),'utf8');
const parse=f=>JSON.parse(read(f));
const source=()=>[...parse('data/official-2016-2020.json'),...parse('data/official-2021-2025.json')];
const official=()=>Object.fromEntries(source().map(q=>[q.id,q]));
function emptyStorage(initial={}){
 const mem=new Map(Object.entries(initial));
 return {mem,getItem:key=>mem.get(key)??null,setItem:(key,value)=>mem.set(key,String(value)),
  removeItem:key=>mem.delete(key)};
}
function boot(backing,bank=official()){
 const win={RECALL_OFFICIAL:bank,addEventListener(){},MutationObserver:null};
 const doc={readyState:'loading',addEventListener(){},getElementById:()=>null,querySelector:()=>null};
 const ctx={window:win,document:doc,localStorage:backing,Date,Intl,
  requestAnimationFrame(){},console:{warn(){}}};
 vm.runInNewContext(read('assets/ck-study-editor-v80.js'),ctx);
 vm.runInNewContext(read('assets/ck-study-workbench-v81.js'),ctx);
 vm.runInNewContext(read('assets/ck-data-integrity-v86.js'),ctx);
 return win;
}
test('official 10-year bank remains immutable and legacy notes can be stored',()=>{
 const rows=source(),years=new Map();
 assert.equal(rows.length,800);
 for(const q of rows){
  years.set(q.year,(years.get(q.year)||0)+1);
  assert.equal(q.options.length,5);assert.ok(q.verified);
 }
 assert.equal(years.size,10);
 for(const [year,count] of years)assert.equal(count,80,String(year));
 const mem=emptyStorage(),app=boot(mem);
 const draft={questionId:'2017-40',status:'draft',examAsOf:'2017',published:false,
  options:Array.from({length:5},(_,i)=>({no:i+1,verdict:'unreviewed',why:''}))};
 assert.ok(app.CK80Editorial.validateImportRecord('2017-40',draft));
 assert.equal(app.CK80Editorial.validateImportRecord('2015-40',draft),null);
 const progress={schemaVersion:1,scope:'personal-unpublished-workbench',
  records:{'2016-1':{status:'researching',bookmark:true,updatedAt:1}}};
 assert.ok(app.CK81Workbench.sanitizeProgress(progress));
 const q=app.RECALL_OFFICIAL['2017-40'];
 const packet=app.CK81Workbench.researchPacket(['2017-40'],
  [{q,entry:null,visualReviewed:false,textScore:null,reasonReviewed:false,canonical:'unavailable'}]);
 assert.match(packet,/선지 5 판정/);
 assert.match(packet,/법령과 현재 법령의 차이/);
 assert.match(packet,/공식 검증 해설 아님/);
});
test('ten-year workbench loads only the five existing explanation files',async()=>{
 const bank=official(),events={},body={append(){}};
 const panel={innerHTML:'',hidden:true,querySelector:()=>null};
 const button={setAttribute(){},textContent:''};
 let created=null;
 const content={append(node){node.parentElement=content;created=node;}};
 const dock={open:false,querySelector:selector=>selector==='.ck103-tools-content'?content:null};
 const main={prepend(node){created=node}};
 const document={readyState:'loading',body,addEventListener:(k,f)=>{events[k]=f;},
  getElementById:id=>id==='main'?main:id==='ck103-tools-dock'?dock:
   id==='ck81-workbench'?created:null,
  createElement:()=>({querySelector:selector=>selector==='[data-ck81-panel]'?panel:
   selector==='[data-ck81-toggle]'?button:null,innerHTML:'',className:'',id:''})};
 const loaded=[];
 const fetch=async url=>{
  const year=Number(url.match(/20\d{2}/)?.[0]);
  assert.ok(year>=2021&&year<=2025,'unseeded older bundle should not be fetched');
  loaded.push(year);
  return {ok:true,json:async()=>parse('data/explanations/official-'+year+'.json')};
 };
 const win={RECALL_OFFICIAL:bank,CK89OfficialBank:{loadAll:async()=>({ready:true,total:800})},
  CK83Links:{getRecords:()=>({'2024-1':{optionNotes:{'1':{source:'law'},'2':{source:'PDF'}}}})},
  CK86ExamBridge:{getDue:()=>({rows:[],future:0})},addEventListener(){}};
 vm.runInNewContext(read('assets/ck-study-workbench-v81.js'),
  {window:win,document,fetch,localStorage:emptyStorage(),Date,Intl,
   requestAnimationFrame(){}});
 win.CK81Workbench.open();
 for(let i=0;i<120;i++)await Promise.resolve();
 assert.equal(win.CK81Workbench.getState().loaded,800);
 assert.equal(win.CK81Workbench.getState().loadErrors,0);
 assert.equal(loaded.length,5);
 assert.match(panel.innerHTML,/data-ck112-packet-txt/);
 assert.equal((panel.innerHTML.match(/data-ck81-matrix="/g)||[]).length,20);
 for(const token of ['10개년 공식 등록 문항</dt><dd>800','최근 5개년 해설 초안</dt><dd>240',
  '2016~2020 해설 미제공</dt><dd>400','내 선지 출처 기록</dt><dd>2/4000',
  '최근 5개년 미작성 해설 160','data-ck81-batch-prompt','no-personal-source']){
   assert.ok(panel.innerHTML.includes(token),token);
 }
});
test('new 800-record backup and previous 400-record format are both valid',()=>{
 const bank=official(),mem=emptyStorage(),app=boot(mem,bank);
 const drafts=Object.fromEntries(source().map(q=>[q.id,{questionId:q.id,status:'draft',
  summaryEasy:'',answerReason:'',published:false,
  options:Array.from({length:5},(_,i)=>({no:i+1,verdict:'unreviewed'}))}]));
 const progress={schemaVersion:1,scope:'personal-unpublished-workbench',
  records:Object.fromEntries(source().map(q=>[q.id,{status:'backlog',bookmark:false,updatedAt:0}]))};
 const k=app.CK86Integrity;
 const d=JSON.stringify(drafts),p=JSON.stringify(progress);
 assert.ok(k.validateExtra('ck80-explain-drafts-v1',d));
 assert.ok(k.validateExtra('ck81-review-workbench-v1',p));
 assert.ok(k.validateExtra('ck80-explain-drafts-v1',JSON.stringify(
  {'2025-1':{summaryEasy:'legacy note'}})));
 assert.equal(k.validateExtra('ck80-explain-drafts-v1',
  JSON.stringify({'2015-1':{summaryEasy:'invalid'}})),false);
 assert.equal(k.validateExtra('ck80-explain-drafts-v1',
  JSON.stringify({'2016-1':{published:true}})),false);
 const base={subject:'estate',answers:{},quizAnswers:{},flashVisits:{}};
 const prepared=k.stage({...base,__ck79Extras:{format:1,local:{
  'ck80-explain-drafts-v1':d,'ck81-review-workbench-v1':p}}},base,
  ['ck80-explain-drafts-v1','ck81-review-workbench-v1']);
 assert.equal(k.apply(prepared,mem).ok,true);
 assert.equal(Object.keys(JSON.parse(mem.getItem('ck80-explain-drafts-v1'))).length,800);
 assert.equal(Object.keys(JSON.parse(mem.getItem('ck81-review-workbench-v1')).records).length,800);
 const fallback=read('index.html');
 assert.match(fallback,/ck80-explain-drafts-v1'\?3500000/);
 assert.match(read('assets/ck-study-editor-v80.js'),/personal-unpublished-2021-2025/);
 assert.match(read('assets/ck-study-editor-v80.js'),/personal-unpublished-2016-2025/);
});
test('quota failure rolls existing data back instead of silently replacing it',()=>{
 const win=boot(emptyStorage()),k=win.CK86Integrity;
 const bytes=new Map([['ck80-explain-drafts-v1','old'],['ck81-review-workbench-v1','old2']]);
 let calls=0;
 const storage={getItem:key=>bytes.get(key)??null,setItem:(key,value)=>{
  calls++;if(calls===2)throw Error('quota');bytes.set(key,value);
 },removeItem:key=>bytes.delete(key)};
 const result=k.transaction([['ck80-explain-drafts-v1','new'],['ck81-review-workbench-v1','new2']],storage);
 assert.equal(result.ok,false);assert.equal(bytes.get('ck80-explain-drafts-v1'),'old');
 assert.equal(bytes.get('ck81-review-workbench-v1'),'old2');
});
test('v112 research-queue TTS reads only selected registered questions',()=>{
 const html=read('index.html'),start=html.indexOf('function ck112ReadSelected(');
 const end=html.indexOf('window.CK76Voice=Object.freeze',start);
 assert.ok(start>0&&end>start);
 const calls=[],stops=[],status=[],speech={status:'ready'};
 const api=new Function('officialAudioEntry','ttsStop','ck76VoiceState','ttsPlay','ck76Voice',
   html.slice(start,end)+';return ck112ReadSelected;')(
  (year,n)=>{
   const id=year+'-'+n;
   if(id==='2024-67')return {id,special:'allAccepted',question:'question',
     options:['a','b','c','d','e'],answers:[]};
   if(id==='2025-1')return {id,special:'normal',question:'question',
     options:['a','b','c','d','e'],answers:['a']};
   throw Error('unloaded');
  },
  ()=>stops.push('stopped'),(state,message)=>status.push(state),
  (items,options)=>calls.push({items,options}),speech);
 const one=api(['2025-1','2024-67'],'qa');
 assert.equal(one.ok,true);assert.equal(one.items,1);assert.equal(one.excluded,1);
 assert.equal(calls.length,1);
 const partial=api(['2025-1','2018-1'],'all');
 assert.equal(partial.ok,false);assert.equal(partial.reason,'incomplete-selection');
 assert.equal(calls.length,1);assert.equal(stops.length,1);
 const full=api(['2024-67'],'all');
 assert.equal(full.ok,true);assert.equal(full.items,1);
 assert.equal(calls.length,2);
 assert.match(read('assets/ck-study-workbench-v81.js'),/data-ck112-voice-batch/);
 assert.match(read('assets/ck-study-workbench-v81.js'),/data-ck112-packet-txt/);
 assert.match(read('assets/ck-evidence-queue-v111.js'),/data-ck112-voice-top/);
 assert.match(html,/playSelected:ck112ReadSelected/);
});
test('personal editorial per-option source remains independent from linked personal notes',()=>{
 const mem=emptyStorage(),bank=official(),app=boot(mem,bank);
 const id='2025-1',record={questionId:id,status:'draft',published:false,
  options:Array.from({length:5},(_,i)=>({no:i+1,verdict:'unreviewed',
   why:'',source:i===0?'=SUM(1,2)':i===1?'판례 2023':''
  }))};
 mem.setItem('ck80-explain-drafts-v1',JSON.stringify({[id]:record}));
 const editorRows=app.CK80Editorial.getRecords();
 assert.equal(editorRows[id].options[0].source,'=SUM(1,2)');
 assert.equal(app.CK86Integrity.validateExtra('ck80-explain-drafts-v1',
   JSON.stringify({[id]:record})),true);
 const invalid=JSON.parse(JSON.stringify(record));invalid.options[0].source='x'.repeat(261);
 assert.equal(app.CK86Integrity.validateExtra('ck80-explain-drafts-v1',
   JSON.stringify({[id]:invalid})),false);
 const links={[id]:{conceptIds:[],optionNotes:{1:{assessment:'true',reason:'개인 메모',source:'민법 100조'}}}};
 const window={RECALL_OFFICIAL:bank,CK83Links:{getRecords:()=>links},
  CK80Editorial:{getRecords:()=>editorRows},addEventListener(){}};
 const doc={readyState:'loading',addEventListener(){},getElementById:()=>null};
 vm.runInNewContext(read('assets/ck-evidence-queue-v111.js'),
  {window,document:doc,requestAnimationFrame(){}});
 const row=window.CK111Evidence.rows().find(x=>x.id===id);
 assert.equal(row.sourced,1);assert.equal(row.draftSourced,2);
 const options=window.CK111Evidence.csvDocument([row],'options');
 assert.match(options,/CK80 해설 초안 출처/);
 assert.match(options,/민법 100조/);
 assert.match(options,/'=SUM\(1,2\)/);
 assert.equal(options.split('\r\n').length-2,5);
 const summary=window.CK111Evidence.summary([row]);
 assert.equal(summary.sources,1);assert.equal(summary.draftSources,2);
 assert.match(read('assets/ck-study-editor-v80.js'),/data-ck80-option-source/);
 assert.match(read('assets/ck-study-editor-v80.css'),/ck80-option-citation/);
 assert.match(read('assets/ck-study-workbench-v81.js'),/draftOptionSources/);
 assert.match(read('assets/ck-evidence-queue-v111.js'),/no-draft-source/);
 assert.match(read('assets/ck-evidence-queue-v111.js'),/data-ck112-voice-top/);
 assert.match(read('assets/ck-evidence-queue-v111.js'),/ck:personal-editor-updated/);
});
test('updated files are syntactically valid and manual-only',()=>{
 const index=read('index.html'),service=read('sw.js');
 for(const f of ['assets/ck-study-editor-v80.js','assets/ck-study-workbench-v81.js',
  'assets/ck-data-integrity-v86.js','assets/ck-evidence-queue-v111.js','sw.js'])
  new vm.Script(read(f));
 for(const m of index.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))
  if(m[1].trim())new vm.Script(m[1]);
 const jsAssetVersion={'ck-study-editor-v80.js':127,'ck-study-workbench-v81.js':112,
  'ck-data-integrity-v86.js':120,'ck-evidence-queue-v111.js':114};
 for(const [f,v] of Object.entries(jsAssetVersion)){
  const token=f+'?v='+v;
  assert.ok(index.includes(token),token+' HTML');
  assert.ok(service.includes(token),token+' SW');
 }
 assert.match(service,/conceptknot-study-v153-case-prediction/);
 assert.match(index,/ck-study-editor-v80\.css\?v=112/);
 assert.match(service,/ck-study-editor-v80\.css\?v=113/);
 assert.equal(parse('vercel.json').git.deploymentEnabled,false);
 assert.equal(fs.existsSync(path.join(dir,'.github/workflows')),false);
});
