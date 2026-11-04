/* ConceptKnot v113 — personal-editor, evidence CSV and PDF pen lifecycle regression.
 * Local-only Node test; does not trigger Actions or create build artifacts.
 */
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=file=>fs.readFileSync(file,'utf8');

test('4,000-option CSV keeps CK83 and CK80 option evidence in separate correctly indexed columns',()=>{
 const source=read('assets/ck-evidence-queue-v111.js');
 const document={readyState:'loading',addEventListener(){},getElementById(){return null}};
 const window={addEventListener(){}};
 vm.runInNewContext(source,{document,window,requestAnimationFrame:()=>1});
 const q={id:'2025-1',year:2025,number:1,subject:'estate',verified:true,
  question:'공식 문제 예시',options:['첫째','둘째','셋째','넷째','다섯째'],correct:[2],
  originalUrl:'https://example.org/source'};
 const optionNotes=Object.fromEntries([1,2,3,4,5].map(i=>[String(i),{
  assessment:'true',reason:'reason-'+i,source:'source-'+i}]));
 const drafts={'2025-1':{options:[1,2,3,4,5].map(i=>({
  no:i,verdict:'false',why:'draft-reason-'+i,source:'draft-source-'+i}))}};
 const rows=window.CK111Evidence.rows({'2025-1':q},{'2025-1':{optionNotes}},drafts);
 assert.equal(rows.length,1);
 assert.equal(rows[0].sourced,5);
 assert.equal(rows[0].draftSourced,5);
 const csv=window.CK111Evidence.csvDocument(rows,'options').trim().split('\r\n');
 assert.equal(csv.length,6);
 for(let i=1;i<=5;i++){
  const cols=csv[i].match(/"(?:[^"]|"")*"/g).map(x=>x.slice(1,-1).replace(/""/g,'"'));
  assert.equal(cols.length,13);
  assert.equal(cols[6],'true');
  assert.equal(cols[7],'reason-'+i);
  assert.equal(cols[8],'source-'+i);
  assert.equal(cols[9],'false');
  assert.equal(cols[10],'draft-reason-'+i);
  assert.equal(cols[11],'draft-source-'+i);
 }
 assert.match(window.CK111Evidence.csv('=HYPERLINK("x")'),/^"'=/);
 assert.match(source,/data-ck111-export="filtered-options"/);
});

test('collapsing a personal draft never throws away unsaved textarea values',async()=>{
 const source=read('assets/ck-study-editor-v80.js');
 const tail=source.lastIndexOf('})();');
 assert.ok(tail>0);
 const injected=source.slice(0,tail)+
  'window.__unit113={editorHtml,showEditor,confirmLeave,setEditing:v=>{editing=v},isEditing:()=>editing,isOpen:()=>open};'+
  source.slice(tail);
 const workspace={dataset:{},hidden:true,innerHTML:'',textContent:'',
  querySelector:s=>s==='[data-ck80-save]'&&workspace.innerHTML.includes('data-ck80-save')?{}:null};
 const toggle={textContent:'',setAttribute(){}};
 const root={dataset:{ck78Current:'2019-23'},
  querySelector:s=>s==='[data-ck80-workspace]'?workspace:s==='[data-ck80-toggle]'?toggle:null};
 let confirmed=false;
 const document={addEventListener(){},querySelector:s=>s==='#ck78-analysis-dialog'?root:null};
 const window={addEventListener(){},confirm:()=>confirmed,
  RECALL_OFFICIAL:{'2019-23':{verified:true,year:2019,correct:[2]}}};
 const localStorage={getItem(){return null},setItem(){}};
 vm.runInNewContext(injected,{window,document,localStorage,CustomEvent:function(){}});
 const api=window.__unit113;
 const markup=api.editorHtml({questionId:'2019-23',status:'draft',
  summaryEasy:'"quote" and \u0027apostrophe\u0027',
  answerReason:'',options:[],evidence:'',reviewHoldReason:''});
 assert.match(markup,/&quot;quote&quot;/);
 assert.match(markup,/&#39;apostrophe&#39;/);
 await api.showEditor();
 assert.equal(workspace.hidden,false);
 workspace.innerHTML+=' UNSAVED-TEXT';
 api.setEditing(true);
 await api.showEditor();
 assert.equal(workspace.hidden,true);
 assert.equal(api.isEditing(),true);
 await api.showEditor();
 assert.equal(workspace.hidden,false);
 assert.match(workspace.innerHTML,/UNSAVED-TEXT$/);
 assert.equal(api.confirmLeave(),false);
 assert.equal(api.isEditing(),true);
 confirmed=true;
 assert.equal(api.confirmLeave(),true);
 assert.equal(api.isEditing(),false);
 assert.match(source,/beforeunload/);
 assert.match(source,/\.ck-v7-nav-pill \.board-tab/);
});

test('PDF S Pen saves in-flight strokes on page/tool changes without silently exiting pen mode',async()=>{
 const source=read('assets/ck-pdf-workspace-v15.js');
 const injected=source.replace(/\}\)\(\);\s*$/,
  'redrawInk=()=>{};persist=()=>true;paintPdf=async()=>{};window.__unit113={goPage,releaseSecond,updateTool,act};})();');
 const window={addEventListener(){},CKPen60:{contact:e=>e.pointerType==='pen'&&e.pressure>0,eraser:()=>false}};
 const document={readyState:'loading',addEventListener(){}};
 vm.runInNewContext(injected,{window,document,localStorage:{getItem(){return null},setItem(){}},
  performance:{now:()=>100},requestAnimationFrame:()=>1,clearTimeout(){},setTimeout:()=>1});
 const api=window.__unit113;
 const ink={style:{},hasPointerCapture:()=>false,releasePointerCapture(){}};
 const page={getBoundingClientRect:()=>({left:0,top:0,width:400,height:500})};
 const scroller={scrollLeft:0,scrollTop:0};
 const root={isConnected:true,classList:{toggle(){}},
  querySelector:selector=>({
   '[data-ck15-page]':page,'[data-ck15-ink-canvas]':ink,'[data-ck15-scroll]':scroller
  })[selector]||null,querySelectorAll:()=>[]};
 const stroke=([x,y])=>({tool:'pen',color:'#000000',width:2,points:[[x,y,.5]]});
 const s={host:root,penMode:true,strokePointer:4,activeStroke:stroke([.1,.1]),
  eraseDirty:false,annotations:{},redo:{},touchPoints:new Map(),page:1,
  pdf:{numPages:8},tool:'pen',zoom:1,renderTask:null,paintToken:0,baseViewport:null};
 await api.goPage(s,2);
 assert.equal(s.page,2);
 assert.equal(s.penMode,true);
 assert.equal(s.annotations['1'].length,1);
 assert.equal(s.strokePointer,null);
 s.strokePointer=7;s.activeStroke=stroke([.2,.3]);
 api.updateTool(s,'eraser');
 assert.equal(s.penMode,true);
 assert.equal(s.annotations['2'].length,1);
 await api.act(s,{dataset:{ck15Spen:''},setAttribute(){}});
 assert.equal(s.penMode,false);
 const child={...s,host:{...root,remove(){}},page:3,activeStroke:stroke([.5,.5]),
  strokePointer:8,touchPoints:new Map()};
 s.second=child;
 api.releaseSecond(s);
 assert.equal(s.second,null);
 assert.equal(s.annotations['3'].length,1);
});
