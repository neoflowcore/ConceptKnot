/* ConceptKnot v117: manual Node tests; no CI workflow is added.
 * Run after checkout: node --test tests/v117-pdf-ink-tools.test.cjs
 */
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const read=pathName=>fs.readFileSync(path.join(__dirname,'..',pathName),'utf8');
const pdf=()=>read('assets/ck-pdf-workspace-v15.js');
function extract(source,first,after){
 const a=source.indexOf(first),b=source.indexOf(after,a+first.length);
 assert.ok(a>=0&&b>a,'extract: '+first);
 return source.slice(a,b);
}
test('v117 entry point, cache and routing guard linked without automatic deploy',()=>{
 const html=read('index.html'),sw=read('sw.js'),config=JSON.parse(read('vercel.json'));
 assert.match(html,/ck-pdf-workspace-v15\.js\?v=118/);
 assert.match(html,/window\.CKPDF15\?\.canLeave\?\.\(\)===false/);
 assert.match(sw,/conceptknot-study-v121-structure-evidence/);
 assert.equal((sw.match(/ck-pdf-workspace-v15\.js\?v=118/g)||[]).length,2);
 assert.equal((sw.match(/ck-pdf-tools-v117\.css\?v=117/g)||[]).length,2);
 assert.equal(config.git.deploymentEnabled,false);
 assert.ok(!fs.existsSync(path.join(__dirname,'..','.github','workflows')));
});
test('PDF script and stylesheet are valid and selection text is explicitly not OCR',()=>{
 assert.doesNotThrow(()=>new vm.Script(pdf()));
 assert.match(read('assets/ck-pdf-tools-v117.css'),/ck117-pdf-tools/);
 assert.match(pdf(),/스캔 이미지 OCR은 별도 작업/);
 assert.match(pdf(),/저장되지 않은 필기가 있습니다/);
 assert.match(pdf(),/session\.file===file/); // same-name/size reselected files must be reloaded
});
test('strict JSON backup schema rejects wrong file, malicious key and invalid point',()=>{
 const run=extract(pdf(),'function validateInkBackup(','async function pdfFingerprint');
 const validate=new Function('INK_BACKUP_FORMAT','INK_MAX_PAGES','INK_MAX_STROKES','INK_MAX_POINTS','ANNOTATION_PREFIX',
  run+'return validateInkBackup')('conceptknot-pdf-ink',500,12000,400000,'ck15-ink:');
 const sample={format:'conceptknot-pdf-ink',version:1,
  documentKey:'ck15-ink:2025:official',
  annotations:{'1':[{tool:'pen',color:'#112233',width:2,points:[[0.2,0.5,0.5]]}]}};
 assert.equal(validate(sample,90).strokes,1);
 assert.equal(validate({...sample,documentKey:'wrong'},90),null);
 assert.equal(validate(sample,0)?.pages,1); // unknown page count allowed before PDF opens
 assert.equal(validate(sample,0)?.strokes,1);
 assert.equal(validate(sample,0)?.pdfHash,'');
 assert.equal(validate({...sample,annotations:JSON.parse('{"__proto__":[]}')},90),null);
 assert.equal(validate({...sample,annotations:{'1':[{tool:'pen',color:'#112233',width:2,points:[[1.5,0.5,0.5]]}]}},90),null);
 assert.equal(validate({...sample,annotations:{'999':[]}},90),null);
});
test('legacy PDF ink loads correctly but malformed/corrupt records cannot be silently overwritten',()=>{
 const script=extract(pdf(),'function restore(s,keyOverride){','function persist(s){');
 let raw=null;
 const restore=new Function('annotationId','localStorage','clamp','INK_MAX_STROKES',
  script+'return restore;')(()=> 'ck15-ink:2025:official',{getItem:()=>raw},(x,a,b)=>Math.min(b,Math.max(a,x)),12000);
 raw=JSON.stringify({'1':[{tool:'pen',color:'#ff9900',width:3,points:[[.1,.2,.7]]}]});
 const good={};restore(good);
 assert.equal(good.inkIssue,'');assert.equal(good.annotations['1'].length,1);
 raw=JSON.stringify({'2':[{tool:'highlighter',color:'#ff9900',width:40.3,points:[[.1,.2,.7]]}]});
 const legacyHighlighter={};restore(legacyHighlighter);
 assert.equal(legacyHighlighter.inkIssue,'');
 assert.equal(legacyHighlighter.annotations['2'][0].width,40);
 raw='invalid json';const bad={};restore(bad);
 assert.ok(bad.inkIssue);assert.equal(bad.loadedInkRaw,raw);
 raw='{"x":[]}';const wrong={};restore(wrong);
 assert.ok(wrong.inkIssue);
});
test('right-page storage writes to parent and refuses stale cross-tab edits',()=>{
 const code=extract(pdf(),'function persist(s){','function strokes(s){');
 const m=new Map(),storage={getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,v)};
 const persist=new Function('localStorage','alertStatus',code+'return persist;')(storage,()=>{});
 const parent={annotationKey:'PDF',loadedInkRaw:null,inkIssue:'',inkDirty:true,inkBackedUp:false,
  annotations:{'2':[{}]}},right={parent};
 assert.equal(persist(right),true);assert.equal(parent.loadedInkRaw,m.get('PDF'));
 m.set('PDF','other tab');assert.equal(persist(right),false);
 assert.equal(m.get('PDF'),'other tab');assert.ok(parent.inkIssue);assert.equal(parent.inkDirty,true);
});
test('barrel-button pointerup finalizes instead of creating a false pen move',()=>{
 const code=extract(pdf(),'function onPointerUp(s,event){','function updateTool(s,tool){');
 let commits=0,draws=0;
 const end=new Function('window','commitStroke','persist','redrawInk','els','performance',
  code+'return onPointerUp;')({CKPen60:{contact:()=>true}},()=>commits++,()=>{},
  ()=>draws++,()=>null,{now:()=>1000});
 const session={strokePointer:7,touchPoints:new Map(),gesture:null,erasing:null};
 end(session,{pointerId:7,type:'pointerup',pressure:.3,buttons:32,clientX:3,clientY:4});
 assert.equal(session.strokePointer,null);assert.equal(commits,1);assert.equal(draws,1);
});
test('spread toggle tests ink-loss guard before it mutates spread state',()=>{
 const code=extract(pdf(),"if('ck17Spread'in action){","if('ck15Spen'in action){");
 assert.ok(code.indexOf('if(s.inkDirty&&!s.inkBackedUp)')<code.indexOf('s.spread=!s.spread'));
 const pageCode=extract(pdf(),'async function goPage(s,page){','function fallback(s,message){');
 assert.ok(pageCode.indexOf('if(s.inkDirty&&!s.inkBackedUp)')<pageCode.indexOf('s.page='));
});
