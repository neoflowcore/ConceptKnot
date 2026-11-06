/* v124 focused manual Node checks. No CI, no browser hardware, no install artifact.
 * node --test tests/v124-evidence-review-packets.test.cjs
 */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const source=read('assets/ck-data-diagnostics-v88.js');
const start=source.indexOf('function optionEvidenceDetails(');
const end=source.indexOf('function appendEvidenceDetail(',start);
assert.ok(start>0&&end>start,'v124 personal detail / packet helpers must exist');
const pure=new Function('window','const canonicalId=id=>/^20(?:1[6-9]|2[0-5])-(?:[1-9]|[1-7]\\d|80)$/.test(id);'+
 source.slice(start,end)+'return {optionEvidenceDetails,makeCrossPacket};')({});
function bank(){
 const out={};
 for(let y=2016;y<=2025;y++)for(let n=1;n<=80;n++){
  const id=y+'-'+n;
  out[id]={id,year:y,number:n,subject:n<=40?'estate':'civil',verified:true,
   question:id+' 테스트 원문',options:['A','B','C','D','E'],correct:y===2016&&n===1?
    [1,2,3,4,5]:y===2020&&n===10?[1,3]:[2],
   originalUrl:'https://www.q-net.or.kr/'};
 }
 return out;
}
test('v123 accidental all-accepted assignment is removed and immutable report is used',()=>{
 assert.doesNotMatch(source,/row\.special\s*=\s*['"]all['"]/);
 assert.match(source,/row\.special==='all'/);
 assert.match(source,/function freezeCrossReport\(report\)/);
 assert.match(source,/crossReport=freezeCrossReport\(report\)/);
 assert.match(source,/Object\.freeze\(row\)/);
 new vm.Script(source);
});
test('per-option detail preserves CK83 and CK80 independence, including grading exceptions',()=>{
 const official=bank(),original=JSON.stringify(official);
 const links={'2016-1':{optionNotes:{'1':{assessment:'true',reason:'A',source:'판례 1'}}}};
 const drafts={'2016-1':{options:[{no:1,verdict:'false',why:'B',source:'판례 2'}]}};
 const choices=pure.optionEvidenceDetails('2016-1',official,links,drafts);
 assert.equal(choices.length,5);assert.equal(choices[0].accepted,true);
 assert.equal(choices[0].conflict,true);assert.equal(choices[0].different,true);
 assert.equal(choices[0].missing,false);assert.equal(choices[1].missing,true);
 assert.equal(choices.filter(x=>x.accepted).length,5);
 assert.equal(choices[0].source83,'판례 1');assert.equal(choices[0].source80,'판례 2');
 assert.equal(JSON.stringify(official),original);
});
test('TXT is source-bound, non-verified, 1/3/5 bounded and rejects invalid inputs',()=>{
 const official=bank();
 const packet=pure.makeCrossPacket(['2016-1','2025-80'],official,{},{});
 assert.ok(packet);assert.match(packet,/2016-1/);
 assert.match(packet,/전원정답 인정/);
 assert.match(packet,/선택지의 참\/거짓/);
 assert.match(packet,/① A/);
 assert.match(packet,/시험 당시 시행일/);
 assert.equal((packet.match(/CK80 개인 판단/g)||[]).length,10);
 assert.equal(pure.makeCrossPacket([],official,{},{}),null);
 assert.equal(pure.makeCrossPacket(['2016-1','2016-1'],official,{},{}),null);
 assert.equal(pure.makeCrossPacket(Array(6).fill(null).map((_,i)=>'2025-'+(i+1)),official,{},{}),null);
 assert.equal(pure.makeCrossPacket(['2015-1'],official,{},{}),null);
 assert.equal(pure.makeCrossPacket(['2016-1','2019-82'],official,{},{}),null);
});
test('packet never promotes a personal verdict to the immutable accepted-answer key',()=>{
 const official=bank();
 const before=JSON.stringify(official['2025-1']);
 const links={'2025-1':{optionNotes:{'1':{assessment:'true',reason:'메모',source:'출처'}}}};
 const drafts={'2025-1':{options:[{no:1,verdict:'false',why:'다른 메모',source:'다른 출처'}]}};
 const txt=pure.makeCrossPacket(['2025-1'],official,links,drafts);
 assert.match(txt,/CK83 개인 판단: true/);
 assert.match(txt,/CK80 개인 판단: false/);
 assert.match(txt,/공식 채점: 미인정/);
 assert.equal(JSON.stringify(official['2025-1']),before);
});
test('run, export and outdated cross-tab state fail closed without automatic writes',async()=>{
 const canonical=bank(),created=[],clicked=[];
 let currentLinks={},currentDrafts={},status={};
 const document={addEventListener(){},getElementById(){return null},
  createElement(tag){return{tagName:tag,click(){clicked.push(this.download)},remove(){}};},
  body:{append(){}}};
 const window={RECALL_OFFICIAL:canonical,addEventListener(){},
  CK89OfficialBank:{loadAll:async()=>({ready:true})},
  CK83Links:{getRecords:()=>currentLinks,getStatus:()=>status,
   sanitize:x=>x},
  CK80Editorial:{getRecords:()=>currentDrafts,getStatus:()=>({}),
   hasUnsavedChanges:()=>false}};
 const localStorage={getItem(){return null;}};
 class Blob{constructor(parts,meta){created.push({text:parts.join(''),meta});}}
 const URL={createObjectURL:()=> 'blob:fake',revokeObjectURL(){}};
 vm.runInNewContext(source,{document,window,localStorage,Blob,URL,setTimeout(){}});
 const api=window.CK88Diagnostics;
 assert.equal(await api.runCrossAudit(),true);
 assert.equal(api.crossReportFresh(),true);
 assert.equal(api.exportCrossPacket(),true);
 assert.equal(created.length,1);
 assert.equal(clicked.length,1);
 assert.match(created[0].text,/2025-/);
 assert.equal(api.exportCrossCsv(),true);
 assert.equal(created.length,2);
 currentLinks={'2025-1':{optionNotes:{'1':{assessment:'true',reason:'A',source:'B'}}}};
 assert.equal(api.exportCrossPacket(),false);
 assert.equal(created.length,2,'stale personal evidence must not generate a new file');
 status={unsavedEdits:1};assert.equal(await api.runCrossAudit(),false);
 assert.equal(created.length,2);
});
test('personal content renders using textContent and never executes as HTML',()=>{
 assert.match(source,/option\.textContent=e\.option/);
 assert.match(source,/p\.textContent=info/);
 assert.match(source,/warning\.textContent=/);
 assert.match(source,/data-v124-pick/);
 assert.match(source,/data-v124-expand/);
 assert.match(source,/data-v124-editor/);
 assert.match(source,/CK78Analysis\.open\(year,number,t\)/);
 assert.match(source,/chosenEvidenceIds\.size<5/);
 assert.match(source,/crossReportFresh\(\)/);
});
test('partial, malformed or duplicate official answer keys fail closed',()=>{
 const canonical=bank();
 const input=JSON.parse(JSON.stringify(canonical));
 const correct=input['2025-1'];correct.correct=[1,1];
 assert.equal(pure.optionEvidenceDetails('2025-1',input,{},{}),null);
 assert.equal(pure.makeCrossPacket(['2025-1'],input,{},{}),null);
 const st=source.indexOf('function crossEvidenceAudit('),end=source.indexOf('function freezeCrossReport(',st);
 const cross=new Function('window','const textPresent=x=>typeof x==="string"&&!!x.trim();'+
  source.slice(st,end)+'return crossEvidenceAudit;')({});
 const report=cross(input,{},{});
 assert.equal(report.complete,false);
 assert.equal(report.totals.missingQuestion,1);
 correct.correct=[2];correct.question=' ';assert.equal(pure.optionEvidenceDetails('2025-1',input,{},{}),null);
 correct.question='테스트 문항 정상';correct.subject='civil';
 assert.equal(pure.optionEvidenceDetails('2025-1',input,{},{}),null);
 assert.deepEqual(canonical['2025-1'].correct,[2]);
});
test('expanded direct human QA tasks and no auto deployment or workflows',()=>{
 const qa=read('assets/ck-manual-qa-v115.js');
 const count=[...qa.matchAll(/\{id:'[-a-z0-9]+',group:/g)].length;
 assert.equal(count,27);
 assert.match(qa,/id:'evidence-packet'/);
 assert.match(qa,/personal-v115-manual-qa/);
 const sw=read('sw.js');
 assert.match(sw,/conceptknot-study-v130-fixed-paper-integrity/);
 assert.equal((sw.match(/ck-data-diagnostics-v88\.js\?v=125/g)||[]).length,3);
 assert.equal((sw.match(/ck-data-diagnostics-v88\.css\?v=125/g)||[]).length,3);
 assert.match(sw,/ignoreSearch:true/);
 assert.equal(JSON.parse(read('vercel.json')).git.deploymentEnabled,false);
 assert.equal(fs.existsSync(path.join(__dirname,'..','.github','workflows')),false);
});


test('rendered 16-card panel retains a frozen snapshot and 5-question selection limit',async()=>{
 class El{
  constructor(tag){this.tag=tag;this.children=[];this.innerHTML='';this.open=false;this.dataset={};this.classList={add(){}};this.isConnected=true;}
  append(...n){this.children.push(...n);}
  replaceChildren(...n){this.children=[...n];}
  querySelector(){return null;}
  contains(){return true;}
 }
 const official=bank(),host=new El('main'),auditArea=new El('details'),crossArea=new El('details'),
  auditOut=new El('div'),crossOut=new El('div'),v88Body=new El('div');
 auditArea.querySelector=x=>x==='[data-v121-result]'?auditOut:new El('control');
 crossArea.querySelector=x=>x==='[data-v122-result]'?crossOut:new El('control');
 const listeners={},downloads=[];
 let editorOpened=0,editorToggled=0,root=null;
 const document={body:{append(){}},readyState:'complete',
  querySelector:sel=>sel==='#ck78-analysis-dialog [data-ck80-toggle]'?{click(){editorToggled++}}:null,
  addEventListener(n,fn){(listeners[n]??=[]).push(fn)},
  getElementById:id=>id==='main'?host:id==='ck88-data-diagnostics'?root:null,
  createElement(tag){
   const e=new El(tag);
   if(tag==='section'&&!root){root=e;e.querySelector=x=>({
    '[data-v88-body]':v88Body,'[data-v121-audit]':auditArea,'[data-v122-cross]':crossArea
   })[x]||null;}
   if(tag==='a'){e.click=()=>downloads.push(e.download);e.remove=()=>{};}
   return e;
  }};
 const window={RECALL_OFFICIAL:official,addEventListener(){},
  CK78Analysis:{open:async()=>{editorOpened++;return true;}},
  CK89OfficialBank:{loadAll:async()=>true},
  CK83Links:{getRecords:()=>({}),getStatus:()=>({}),sanitize:x=>x},
  CK80Editorial:{getRecords:()=>({}),getStatus:()=>({}),hasUnsavedChanges:()=>false}};
 const store={getItem:()=>null};
 class Blob{constructor(parts){this.parts=parts;}}
 const URL={createObjectURL:()=> 'blob:test',revokeObjectURL(){}};
 vm.runInNewContext(source,{document,window,localStorage:store,setTimeout(){},Blob,URL});
 const api=window.CK88Diagnostics;
 api.mount();assert.equal(await api.runCrossAudit(),true);
 const cards=()=>crossOut.children.find(x=>x.className==='ck122-cross-list')?.children||[];
 assert.equal(cards().length,16);
 assert.equal(cards().filter(c=>c.innerHTML.includes('전원정답 인정')).length,1);
 assert.equal(api.crossReportFresh(),true,'UI display may not mutate the report snapshot');
 const fire=(type,name,id,value)=>{
  const t={dataset:name==='data-v124-pick'?{v124Pick:id}:
   name==='data-v124-expand'?{v124Expand:id}:
   name==='data-v124-editor'?{v124Editor:id}:{},checked:value,
   hasAttribute:key=>key===name,
   matches:sel=>sel.includes('['+name+']'),
   closest:sel=>sel.includes('['+name+']')?t:null};
  for(const fn of listeners[type]||[])fn({target:t,preventDefault(){}});
 };
 const ids=cards().slice(0,6).map(c=>/data-v124-pick="([^"]+)"/.exec(c.innerHTML)?.[1]);
 ids.forEach(id=>fire('change','data-v124-pick',id,true));
 const toolbar=crossOut.children.find(x=>x.className==='ck124-packet-toolbar');
 assert.match(toolbar.children.find(x=>x.tag==='span').textContent,/선택 5\/5/);
 fire('click','data-v124-expand',ids[0]);
 const detail=cards()[0].children.find(x=>x.className==='ck124-option-details');
 assert.ok(detail);assert.equal(detail.children.filter(x=>x.tag==='section').length,5);
 fire('click','data-v124-packet');
 assert.equal(downloads.length,1);
 fire('click','data-v124-editor',ids[0]);
 for(let tick=0;tick<12;tick++)await Promise.resolve();
 assert.equal(editorOpened,1,'the protected official dialog should open');
 assert.equal(editorToggled,1,'the personal CK80 editor button should be activated');
 assert.equal(api.crossReportFresh(),true);
});
test('pre-v125 manual QA PASS/FAIL notes load without reset or automatic writes',()=>{
 const key='ck115-manual-device-verification-v1';
 const legacy={schemaVersion:1,scope:'personal-v115-manual-qa',updatedAt:0,
  entries:{tabs:{status:'pass',note:'기존 스크롤 위치 유지'},tts:{status:'fail',note:'실음성 장치 확인 필요'}}};
 const storage={getItem:k=>k===key?JSON.stringify(legacy):null,
  setItem(){throw Error('read-only QA test must never write')},removeItem(){throw Error('must not remove')}};
 const window={addEventListener(){}};
 const document={readyState:'loading',addEventListener(){},getElementById(){return null;}};
 vm.runInNewContext(read('assets/ck-manual-qa-v115.js'),
  {window,document,localStorage:storage,requestAnimationFrame:()=>1});
 const qa=window.CK115QA;
 assert.equal(qa.tasks.length,28);
 assert.equal(qa.getState().pass,1);
 assert.equal(qa.getState().fail,1);
 assert.equal(qa.getState().pending,25);
 assert.ok(qa.sanitize(legacy));
 assert.equal(qa.sanitize({...legacy,entries:{tabs:{status:'ai-pass',note:'invalid'}}}),null);
});
test('entry HTML and service worker load the exact v125 JS/CSS and QA assets',()=>{
 const html=read('index.html'),sw=read('sw.js');
 for(const asset of ['ck-data-diagnostics-v88.js?v=130','ck-data-diagnostics-v88.css?v=125',
   'ck-manual-qa-v115.js?v=130']){
  assert.ok(html.includes(asset),'HTML must include '+asset);
  assert.equal(sw.split(asset).length-1,3,'HOT, ASSETS and CRITICAL must include '+asset);
 }
 assert.ok(html.indexOf('ck-study-editor-v80.js')<html.indexOf('ck-data-diagnostics-v88.js'));
 assert.ok(html.indexOf('ck-study-links-v83.js')<html.indexOf('ck-data-diagnostics-v88.js'));
 assert.ok(html.indexOf('ck-official-bank-v89.js')<html.indexOf('ck-data-diagnostics-v88.js'));
 assert.ok(html.includes("navigator.serviceWorker.register('./sw.js')"));
});
test('offline fallback uses current cache only, with explicit 503 on uncached files',async()=>{
 const source=read('sw.js'),handlers={},cacheNames=[],matchCalls=[];
 const current={async match(request,options){
  matchCalls.push({request,ignoreSearch:options?.ignoreSearch===true});
  const text=String(request?.url||request);
  if(text.includes('index.html'))return {status:200,marker:'current-index'};
  if(options?.ignoreSearch&&text.includes('ck-data-diagnostics-v88.js'))
   return {status:200,marker:'v125-current-js'};
  return null;
 }};
 const caches={open:async name=>{cacheNames.push(name);return current;},
  match:()=>{throw Error('must not search another cache generation')}};
 const self={location:{href:'https://app.local/sw.js',origin:'https://app.local'},
  addEventListener:(name,fn)=>handlers[name]=fn};
 class U{
  constructor(value,base){
   const full=String(value).startsWith('./')?'https://app.local/'+String(value).slice(2):String(value);
   this.origin=full.match(/^https:\/\/[^/]+/)?.[0]||'';
   this.pathname='/'+full.replace(/^https:\/\/[^/]+\//,'').split('?')[0];
  }
 }
 class Response{constructor(body,options){this.body=body;this.status=options?.status??200;}}
 const fetch=()=>Promise.reject(Error('simulated offline'));
 vm.runInNewContext(source,{self,caches,URL:U,Response,fetch});
 async function ask(uri,mode='cors'){
  let result;
  handlers.fetch({request:{url:'https://app.local/'+uri,method:'GET',mode},
   respondWith:p=>{result=p}});
  return await result;
 }
 assert.equal((await ask('assets/ck-data-diagnostics-v88.js?v=121')).marker,'v125-current-js');
 assert.equal((await ask('assets/ck-study-analytics-v83.js?v=117')).status,503);
 assert.equal((await ask('offline','navigate')).marker,'current-index');
 assert.ok(cacheNames.every(name=>name==='conceptknot-study-v130-fixed-paper-integrity'));
 assert.ok(matchCalls.some(x=>x.ignoreSearch));
});
