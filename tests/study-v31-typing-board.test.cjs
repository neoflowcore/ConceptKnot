'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
function harness(settings={}){
 const listeners={},record={text:''},state={view:'typing',typingPick:0,subject:'estate',typingHistory:[],ck31EnterRequired:true,ck31SpaceRequired:true,...settings};
 const source={id:'type-1',fact:'문제\n\n정답',t:'연습'};
 const mirror={innerHTML:'',scrollHeight:240,classList:{add(){}},style:{setProperty(){}},querySelector(){return null}};
 const field={tagName:'TEXTAREA',value:'',selectionStart:0,selectionEnd:0,style:{},focus(){},dispatchEvent(){},closest(){}};
 const editor={querySelector:sel=>sel==='.chalk-mirror'?mirror:field,style:{setProperty(){}}};
 field.closest=sel=>sel==='.chalk-editor'?editor:sel.includes('ck-v7-input')?field:null;
 const document={addEventListener:(name,fn)=>(listeners[name]??=[]).push(fn),getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[]};
 const window={};const globals={document,window,state,Date,Event:class{constructor(type){this.type=type;this.bubbles=true}},
  typingGhost(){},typingStats(){return{hit:0,seconds:0,cpm:0,accuracy:100}},typingFeedback(){},
  typingConcept:()=>source,chalkRecord:()=>record,typingItems:()=>[source],chalkState:()=>({practice:{[source.id]:record}}),
  save(){},typingHistoryHtml:()=>'',esc:s=>String(s),clock:s=>String(s)};
 const html=read('index.html');
 const deployed=html.split('/* CK32 typing extension: executes inside the study engine lexical scope. */\n')[1]?.split('\nrender();setInterval(timerTick,500);')[0];
 assert.ok(deployed,'typing extension must execute within study engine scope');
 assert.equal(deployed.trim(),read('assets/ck-typing-layout-v31.js').trim());
 assert.doesNotMatch(html,/<script src="[^"]*ck-typing-layout-v31/);
 vm.runInNewContext(deployed,globals);
 function fire(key){let prevented=0;for(const fn of listeners.keydown||[])fn({key,keyCode:13,target:field,isComposing:false,ctrlKey:false,altKey:false,metaKey:false,shiftKey:false,preventDefault(){prevented++},stopImmediatePropagation(){}});return prevented}
 return {state,record,field,source,api:window.CK31Typing,fire,mirror,listeners};
}
test('default-on Space and Enter match and optional-off skips work',()=>{
 const t=harness(),m=t.api.mapText;
 assert.equal(m('가 나',{text:'가 나'}).done,true);
 assert.equal(m('가 나',{text:'가나'}).done,false);
 assert.equal(m('문제\n\n정답',{text:'문제정답'}).done,false);
 t.state.ck31SpaceRequired=false;
 assert.equal(m('가 나',{text:'가나'}).done,true);
 t.state.ck31EnterRequired=false;
 assert.equal(m('문제\n\n정답',{text:'문제정답'}).done,true);
});
test('Enter on unfinished question skips only question without fake completion',()=>{
 const t=harness();t.record.text='문';t.field.value='문';t.field.selectionStart=1;t.field.selectionEnd=1;
 assert.equal(t.fire('Enter'),1);assert.equal(t.record.text,'문');
 assert.equal(t.record.ck31AnswerOnly,true);assert.equal(t.record.ck31JumpAt,1);
 const m=t.api.mapText(t.source.fact,{...t.record,text:'문정답'});
 assert.equal(m.done,true);assert.equal(m.answerOnly,true);assert.equal(t.record.recorded,undefined);
});
test('Enter on fully typed question inserts paragraph separator once',()=>{
 const t=harness();t.record.text='문제';t.field.value='문제';t.field.selectionStart=2;t.field.selectionEnd=2;
 assert.equal(t.fire('Enter'),1);assert.equal(t.field.value,'문제\n\n');
 assert.notEqual(t.record.ck31AnswerOnly,true);
});
test('disabling Space and Enter blocks keys',()=>{
 const t=harness({ck31EnterRequired:false,ck31SpaceRequired:false});
 assert.equal(t.fire(' '),1);assert.equal(t.fire('Enter'),1);assert.equal(t.record.text,'');
});
test('target positions stay independent of typos',()=>{
 const t=harness(),m=t.api.mapText;assert.equal(m('가 나',{text:'가 나'}).target.join(''),m('가 나',{text:'가 다'}).target.join(''));
 assert.match(read('assets/ck-typing-layout-v31.js'),/mirror\.innerHTML=target\.map\(/);
 assert.doesNotMatch(read('assets/ck-typing-layout-v31.js'),/ck-v3-just-typed/);
});
test('board control order and Ctrl-only arrows',()=>{
 const html=read('index.html'),css=read('experience-v26.css');
 const rail=html.slice(html.indexOf('class="ck6-center-rail"'));
 const seq=['data-ck-v7-resize','data-ck6-swap','data-ck31-board-bottom','data-ck31-board-collapse','ck13-ai-rail'];
 let last=-1;for(const term of seq){const at=rail.indexOf(term);assert.ok(at>last,'rail order: '+term);last=at}
 assert.match(html,/ck31BoardBottom:false,ck31BoardCollapsed:false/);
 assert.match(html,/!e\.ctrlKey\|\|e\.altKey\|\|e\.metaKey\|\|e\.shiftKey/);
 assert.match(css,/ck31-board-bottom/);assert.match(css,/ck31-board-collapsed/);
 assert.match(read('assets/ck-shortcuts-v19.js'),/e\.altKey&&e\.shiftKey&&!e\.ctrlKey&&!e\.metaKey/);
 assert.match(read('assets/ck-navigation-v5.js'),/!e\.ctrlKey\|\|e\.altKey\|\|e\.metaKey\|\|e\.shiftKey/);
 assert.equal(JSON.parse(read('vercel.json')).git.deploymentEnabled,false);
});
test('source scripts parse without installed toolchain',()=>{
 const html=read('index.html');
 for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
 for(const f of ['assets/ck-typing-layout-v31.js','assets/ck-shortcuts-v19.js','assets/ck-navigation-v5.js','sw.js'])new vm.Script(read(f));
 assert.match(read('sw.js'),/conceptknot-study-v37/);
});

test('deployed click listeners toggle input rules and move the existing board in four directions',()=>{
 const t=harness(),classes=new Set();
 const stage={classList:{toggle(k,on){on?classes.add(k):classes.delete(k)}},querySelector(){return null}};
 function click(attr,value){const control={dataset:{ck31Typekey:value},hasAttribute:k=>k===attr,closest:()=>stage};
  for(const fn of t.listeners.click||[])fn({target:{closest:sel=>sel.includes('['+attr+']')?control:null},preventDefault(){},stopImmediatePropagation(){}});}
 click('data-ck31-typekey','enter');assert.equal(t.state.ck31EnterRequired,false);
 click('data-ck31-typekey','space');assert.equal(t.state.ck31SpaceRequired,false);
 click('data-ck31-board-bottom');assert.equal(classes.has('ck31-board-bottom'),true);
 click('data-ck32-board-top');assert.equal(classes.has('ck32-board-top'),true);assert.equal(classes.has('ck31-board-bottom'),false);
 click('data-ck31-board-collapse');assert.equal(classes.has('ck31-board-collapsed'),true);
 click('data-ck31-board-collapse');assert.equal(classes.has('ck31-board-collapsed'),false);
 click('data-ck32-board-top');assert.equal(classes.has('ck32-board-top'),false);
});
