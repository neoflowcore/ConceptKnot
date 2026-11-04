/* ConceptKnot v118: content-addressed PDF ink and opt-in Korean OCR.
 * Execute manually: node --test tests/v118-pdf-fingerprint-ocr.test.cjs
 * No CI workflows, installers, online OCR, auto-write to official bank.
 */
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const pdf=()=>read('assets/ck-pdf-workspace-v15.js');
const ocr=()=>read('assets/ck-ocr-v118.js');
function extract(src,head,tail){
 const a=src.indexOf(head),b=src.indexOf(tail,a+head.length);
 assert.ok(a>=0&&b>a,'Missing source region: '+head);
 return src.slice(a,b);
}
function lookup(options={}){
 const data=new Map();
 const storage={getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,v)};
 const alerts=[],prompts=[];
 const fingerprint=async bytes=>String(bytes.hash||'');
 const restore=(s,key)=>{s.annotationKey=key;s.loadedInkRaw=storage.getItem(key);
  s.inkIssue='';s.annotations=s.loadedInkRaw?JSON.parse(s.loadedInkRaw):{};
 };
 const fn=new Function('annotationId','ANNOTATION_PREFIX','alertStatus',
 'pdfFingerprint','restore','localStorage','window','Object',
 extract(pdf(),'async function selectFileInkIdentity(','async function renderOcrPage(')+
 'return selectFileInkIdentity;')(()=> 'ck15-ink:2025:file:my.pdf:1024','ck15-ink:',
  (s,m)=>alerts.push(m),fingerprint,restore,storage,
  {confirm:message=>(prompts.push(message),options.confirm===true)},Object);
 const make=()=>({file:{name:'my.pdf',size:1024},year:2025,documentToken:1,
  host:{isConnected:true},loadedInkRaw:null,annotations:{},inkIssue:''});
 return {fn,make,storage,data,alerts,prompts};
}
test('v118 assets and manual deployment-only configuration are linked',()=>{
 const html=read('index.html'),sw=read('sw.js'),vercel=JSON.parse(read('vercel.json'));
 for(const asset of ['ck-pdf-workspace-v15.js?v=118','ck-ocr-v118.js?v=120',
  'ck-ocr-v118.css?v=120','ck-manual-qa-v115.js?v=120','ck-data-integrity-v86.js?v=120']){
  assert.ok(html.includes(asset),'missing HTML '+asset);
  assert.ok(sw.includes(asset),'missing SW '+asset);
 }
 assert.match(sw,/conceptknot-study-v120-ocr-page-queue/);
 assert.equal(vercel.git.deploymentEnabled,false);
 assert.equal(fs.existsSync(path.join(__dirname,'..','.github','workflows')),false);
});
test('two different PDFs with same name/size get different SHA-256 ink keys',async()=>{
 const e=lookup(),a=e.make(),b=e.make();
 assert.equal(await e.fn(a,{hash:'a'.repeat(64)},1),true);
 assert.equal(await e.fn(b,{hash:'b'.repeat(64)},1),true);
 assert.notEqual(a.annotationKey,b.annotationKey);
 assert.match(a.annotationKey,/sha256:a{64}/);
 assert.equal(a.loadedInkRaw,null);
 assert.equal(b.loadedInkRaw,null);
});
test('unavailable hash blocks unsafe file-key auto-saving',async()=>{
 const e=lookup(),s=e.make();
 assert.equal(await e.fn(s,{hash:''},1),true);
 assert.ok(s.inkIssue.includes('중단'));
 assert.equal(s.annotationKey,'ck15-ink:2025:unverified-session');
});
test('legacy annotations migrate only on explicit user confirmation',async()=>{
 const confirmed=lookup({confirm:true});
 const old='ck15-ink:2025:file:my.pdf:1024',legacyInk=JSON.stringify({'1':[
  {tool:'pen',color:'#ffffff',width:2,points:[[.1,.2,.5]]}]});
 confirmed.storage.setItem(old,legacyInk);
 const s=confirmed.make();
 assert.equal(await confirmed.fn(s,{hash:'c'.repeat(64)},1),true);
 assert.equal(confirmed.prompts.length,1);
 assert.equal(confirmed.storage.getItem(old),legacyInk,'old raw must stay untouched');
 assert.ok(confirmed.storage.getItem(s.annotationKey));
 assert.equal(s.migratedLegacy,true);
 const denied=lookup({confirm:false});
 denied.storage.setItem(old,legacyInk);
 const t=denied.make();
 assert.equal(await denied.fn(t,{hash:'d'.repeat(64)},1),true);
 assert.equal(denied.storage.getItem(t.annotationKey),null);
 assert.equal(denied.storage.getItem(old),legacyInk);
});
test('OCR rendering accepts one PDF page and caps image pixel dimensions',async()=>{
 const canvas={width:0,height:0,getContext:()=>({})};
 const pdfDoc={numPages:3,getPage:async()=>({
  getViewport:({scale})=>({width:1900*scale,height:2800*scale}),
  render:()=>({promise:Promise.resolve()})
 })};
 const owner={pdf:pdfDoc,host:{isConnected:true},documentToken:2,year:2025,annotationKey:'safe'};
 const fn=new Function('session','document',
  extract(pdf(),'async function renderOcrPage(','function backupDamagedInk(')+
  'return renderOcrPage;')(owner,{createElement:()=>canvas});
 const out=await fn(2);
 assert.equal(out.page,2);assert.equal(out.year,2025);
 assert.ok(canvas.width<=1600&&canvas.height<=2000);
 assert.ok(canvas.width*canvas.height<=3000000);
 await assert.rejects(()=>fn(4),/페이지 번호/);
});
test('OCR tentative option splitting never writes official questions',()=>{
 const src=ocr(),code=extract(src,'function parseOptions(','function preview(');
 const parse=new Function(code+'return parseOptions;')();
 const result=parse('① 첫째\n② 둘째\n③ 셋째\n④ 넷째\n⑤ 다섯째');
 assert.equal(result.complete,true);assert.equal(result.options.length,5);
 const incomplete=parse('① 하나\n② 둘\n② 둘 다시\n④ 넷');
 assert.equal(incomplete.complete,false);
 assert.match(src,/공식 800문항·정답·선지 판단·해설을 자동 변경하지 않습니다/);
 assert.doesNotMatch(src,/fetch\([^)]*image/);
});
test('OCR draft validator refuses corrupt or excessive text',()=>{
 const s=ocr(),fn=new Function('MAX_TEXT',extract(s,'function sanitize(value){','function read(){')+'return sanitize;')(80000);
 const valid={schemaVersion:1,source:'my.png',text:'가나다',updatedAt:0};
 assert.ok(fn(valid));
 assert.equal(fn({...valid,text:'a'.repeat(80001)}),null);
 assert.equal(fn({...valid,source:'x'.repeat(181)}),null);
 assert.equal(fn({...valid,schemaVersion:2}),null);
});
test('guarded global backup accepts OCR draft key but rejects invalid payload',()=>{
 const s=read('assets/ck-data-integrity-v86.js');
 const context={window:{CK118OCR:{sanitize:v=>v?.schemaVersion===1&&typeof v.text==='string'}}};
 require('node:vm').runInNewContext(s,context);
 const raw=JSON.stringify({schemaVersion:1,source:'test',text:'가나다',updatedAt:0});
 assert.equal(context.window.CK86Integrity.validateExtra('ck118-personal-ocr-draft-v1',raw),true);
 assert.equal(context.window.CK86Integrity.validateExtra('ck118-personal-ocr-draft-v1','{}'),false);
 assert.match(read('index.html'),/ck118-personal-ocr-draft-v1/);
});
test('PDF replacement blocked before inline study engine when unsaved',()=>{
 const s=pdf(),start=s.indexOf("document.addEventListener('change',e=>{");
 assert.ok(start>0);
 const chunk=s.slice(start,start+760);
 assert.match(chunk,/session\.inkDirty&&!session\.inkBackedUp/);
 assert.match(chunk,/e\.stopImmediatePropagation\(\)/);
 assert.match(chunk,/e\.target\.value=''/);
});
