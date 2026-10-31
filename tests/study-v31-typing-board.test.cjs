'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
function harness(settings={}){
 const listeners={},records=new Map(),classes=new Set(),buttons=[];
 const state={view:'typing',typingPick:0,subject:'estate',typingHistory:[],ckTypingInputMode:'normal',...settings};
 const source={id:'type-1',fact:'문제\n\n정답',t:'연습'};
 const style={setProperty(){}};
 const mirror={innerHTML:'',scrollHeight:240,classList:{add(){},toggle(k,on){on?classes.add(k):classes.delete(k);}},
  style,querySelector(){return null}};
 const field={tagName:'TEXTAREA',value:'',selectionStart:0,selectionEnd:0,style:{},focus(){},
  setSelectionRange(a,b){this.selectionStart=a;this.selectionEnd=b;}};
 const editor={querySelector:sel=>sel==='.chalk-mirror'?mirror:field,
  classList:{toggle(k,on){on?classes.add(k):classes.delete(k);}},style};
 field.closest=selector=>{
  if(selector==='.chalk-editor'||selector==='.ck-v7-input .chalk-editor')return editor;
  if(selector==='.ck-v7-input .chalk-editor textarea')return field;
  return null;
 };
 const nodes={'typing-feedback':{textContent:''},'typing-history-list':{innerHTML:''}};
 const document={addEventListener:(name,fn)=>(listeners[name]??=[]).push(fn),
  getElementById:id=>nodes[id]||null,
  querySelector:sel=>sel==='.ck-v7-input .chalk-editor'?editor:
   sel==='.ck-v7-input .chalk-editor textarea'?field:null,
  querySelectorAll:sel=>sel==='[data-ck-typing-mode]'?buttons:[]};
 const globals={document,window:{},state,Date,
  typingGhost(){},typingStats(){return{hit:0,seconds:0,cpm:0,accuracy:100}},typingFeedback(){},
  typingConcept:()=>source,chalkRecord:(_,key)=>{
   if(!records.has(key))records.set(key,{text:'',colors:[]});
   return records.get(key);
  },
  typingItems:()=>[source],chalkState:()=>({practice:Object.fromEntries(records)}),
  save(){},typingHistoryHtml:()=>'',esc:s=>String(s),clock:s=>String(s)};
 const html=read('index.html'),asset=read('assets/ck-typing-layout-v31.js');
 const marker='/* CK32 typing extension: executes inside the study engine lexical scope. */\n';
 const deployed=html.split(marker)[1]?.split('\nrender();setInterval(timerTick,500);')[0];
 assert.ok(deployed,'deployed typing extension must be in study engine scope');
 assert.equal(deployed.trim(),asset.trim(),'source and deployed extension must match');
 vm.runInNewContext(deployed,globals);
 const record=globals.chalkRecord('practice',source.id);
 function fire(key){
  let prevented=0;
  for(const fn of listeners.keydown||[])fn({
   key,keyCode:key==='Enter'?13:0,target:field,isComposing:false,
   ctrlKey:false,altKey:false,metaKey:false,shiftKey:false,
   preventDefault(){prevented++;},stopImmediatePropagation(){}
  });
  return prevented;
 }
 function before(inputType,data=''){
  let prevented=0;
  for(const fn of listeners.beforeinput||[])fn({
   inputType,data,target:field,isComposing:false,preventDefault(){prevented++;}
  });
  return prevented;
 }
 function switchMode(next){
  const btn={dataset:{ckTypingMode:next},setAttribute(){}};
  buttons.push(btn);
  for(const fn of listeners.click||[])fn({
   target:{closest:sel=>sel==='[data-ck-typing-mode]'?btn:null},
   preventDefault(){},stopImmediatePropagation(){}
  });
 }
 return {state,source,record,mirror,field,editor,classes,fire,before,switchMode,
  paint:()=>globals.typingGhost(editor),api:globals.window.CK31Typing,nodes,listeners};
}
test('default normal mode preserves punctuation, spaces and native line breaks',()=>{
 const t=harness(),m=t.api.mapText;
 assert.equal(t.api.mode(),'normal');
 assert.equal(m('가, 나\n다',{text:'가, 나\n다'}).done,true);
 assert.equal(m('가, 나\n다',{text:'가나다'}).done,false);
 assert.equal(m('가 나',{text:'가 나'}).required,3);
 assert.equal(t.fire('Enter'),0,'Enter must be a normal line break');
 assert.equal(t.fire(' '),0,'Space must insert a normal space');
 assert.equal(t.fire('Backspace'),0,'Backspace must not be intercepted');
 assert.equal(t.before('insertParagraph'),0);
 t.record.text='문';t.field.value='문';
 assert.equal(t.record.ck31AnswerOnly,undefined,'Enter must not skip a paragraph');
});
test('letters-only skips all nonletters while Backspace remains active',()=>{
 const t=harness({ckTypingInputMode:'letters'}),m=t.api.mapText;
 assert.equal(t.api.mode(),'letters');
 assert.equal(m('가, 나\n다',{text:'가나다'}).done,true);
 assert.equal(m('가, 나\n다',{text:'가나'}).done,false);
 assert.equal(m('문제\n\n정답',{text:'문제정답'}).done,true);
 assert.equal(t.fire('Enter'),1);assert.equal(t.fire(' '),1);
 assert.equal(t.before('insertParagraph'),1);
 assert.equal(t.before('insertLineBreak'),1);
 assert.equal(t.before('insertText',' '),1);
 assert.equal(t.fire('Backspace'),0);
 t.record.text='문제정답';
 assert.equal(m(t.source.fact,t.record).done,true);
 t.record.text='문제정';
 assert.equal(m(t.source.fact,t.record).done,false);
});
test('separate mode drafts preserve text, chalk colors and time',()=>{
 const t=harness(),r=t.record;
 r.text='문제\n';r.colors=[1,2,2];r.started=100;
 t.switchMode('letters');
 assert.equal(t.state.ckTypingInputMode,'letters');
 assert.equal(r.text,'');
 r.text='문제';r.colors=[3,3];r.started=200;
 t.switchMode('normal');
 assert.equal(r.text,'문제\n');assert.equal(JSON.stringify(r.colors),'[1,2,2]');
 assert.equal(r.started,100);
 t.switchMode('letters');
 assert.equal(r.text,'문제');assert.equal(JSON.stringify(r.colors),'[3,3]');
 assert.equal(r.started,200);assert.equal(t.field.value,'문제');
});
test('actual typed ink overlays an unmoving original guide in both modes',()=>{
 const t=harness();
 t.record.text='가';t.field.value='가';t.paint();
 assert.match(t.mirror.innerHTML,/ck62-guide/);
 assert.match(t.mirror.innerHTML,/ck62-live/);
 assert.match(t.mirror.innerHTML,/ck62-wrong/);
 t.switchMode('letters');
 t.record.text='문제정답';t.field.value='문제정답';t.paint();
 const c=t.api.mapText(t.source.fact,t.record);
 assert.equal(c.done,true);
 assert.equal(c.target.join(''),'문제\n\n정답');
 assert.equal(c.mapped.get(0).typed,'문');
 assert.match(t.mirror.innerHTML,/ck62-cell-source/);
 assert.match(t.mirror.innerHTML,/ck62-cell-input/);
 t.switchMode('normal');
 assert.match(t.mirror.innerHTML,/ck62-live/);
});
test('board docking and collapsing still work',()=>{
 const t=harness();
 function click(attr){const stage={classList:{toggle(k,on){on?t.classes.add(k):t.classes.delete(k)}},querySelector(){return null}};
  const control={hasAttribute:k=>k===attr,closest:()=>stage};
  for(const fn of t.listeners.click||[])fn({
   target:{closest:sel=>sel.includes('['+attr+']')?control:null},
   preventDefault(){},stopImmediatePropagation(){}
  });}
 click('data-ck31-board-bottom');assert.equal(t.classes.has('ck31-board-bottom'),true);
 click('data-ck32-board-top');assert.equal(t.classes.has('ck32-board-top'),true);
 assert.equal(t.classes.has('ck31-board-bottom'),false);
 click('data-ck31-board-collapse');assert.equal(t.classes.has('ck31-board-collapsed'),true);
});
test('UI, IME handling, offline cache and source syntax stay consistent',()=>{
 const html=read('index.html'),css=read('assets/ck-typing-modes-v61.css'),sw=read('sw.js');
 assert.match(html,/ckTypingInputMode:'normal'/);
 assert.match(html,/data-ck-typing-mode="normal"/);
 assert.match(html,/data-ck-typing-mode="letters"/);
 assert.doesNotMatch(html,/data-ck31-typekey/);
 assert.doesNotMatch(html,/ck31EnterRequired|ck31SpaceRequired/);
 assert.match(html,/if\(state\.ckTypingInputMode!=='letters'\)return;/);
 assert.match(html,/const field=e\.target,raw=field\.value,clean=letters\(raw\)\.join\(''\)/);
 assert.match(html,/const field=e\.target,clean=letters\(field\.value\)\.join\(''\)/);
 assert.match(css,/ck61-typing-mode/);assert.match(read('assets/ck-typing-precision-v62.css'),/ck62-live/);
 assert.match(sw,/conceptknot-study-v70-typing-precision/);
 assert.match(sw,/ck-typing-modes-v61.css/);
 assert.equal(JSON.parse(read('vercel.json')).git.deploymentEnabled,false);
 for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
 new vm.Script(read('assets/ck-typing-layout-v31.js'));
});
test('v62 paragraph progress, aligned typography, active line and themed glass',()=>{
 const html=read('index.html'),css=read('assets/ck-typing-precision-v62.css'),script=read('assets/ck-typing-layout-v31.js');
 assert.match(html,/id="ck62-progress"/);
 assert.match(html,/role="progressbar"/);
 assert.match(html,/id="ck62-progress-label"/);
 assert.match(css,/grid-template-columns:minmax\(0,1fr\)/);
 assert.match(css,/ck62-normal/);
 assert.match(css,/ck62-letters/);
 assert.match(css,/font-size:var\(--ck62-font-size\)!important/);
 assert.match(css,/ck62-fixed.ck-v3-line-active::before/);
 assert.match(css,/html:not\(\[data-ck-theme="dark"\]\)/);
 assert.match(css,/html\[data-ck-theme="dark"\]/);
 assert.match(css,/ck62-wrong/);
 assert.match(css,/ck62-cell-input/);
 assert.match(script,/function paintNormal/);
 assert.match(script,/function paintLetters/);
 assert.match(script,/function locateLine/);
 assert.match(script,/ck62-progress-label/);
});
