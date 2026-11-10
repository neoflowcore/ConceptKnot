/* ConceptKnot v134 key mapping tests — manually executed, no CI / files written.
 * UI-input isolation and saved OMR integrity are checked without real-device claims.
 */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const index=read('index.html');
const start=index.indexOf('/* v134: consistent 1-5 answers and Ctrl+Left/Right');
const end=index.indexOf("\nwindow.addEventListener('beforeunload'",start);
if(start<0||end<=start)throw Error('v134 shortcut handler missing');
const snippet=index.slice(start,end);
function setup(view='quiz',mode='mock',status='running'){
 const events={},hits=[],state={view},apiData={active:status,expanded:true,position:2};
 const keyboardDoc={
  addEventListener(type,fn){events[type]=fn;},
  querySelectorAll(selector){
   if(!selector.startsWith('#main '))return [];
   const hasMock=selector.includes('data-choice='),hasExam=selector.includes('data-exam-mark=');
   if((view==='quiz'&&mode==='mock'&&hasMock)||(view==='exam'&&hasExam)||view==='reverse'){
    return [{disabled:false,getClientRects:()=>[{}],click:()=>hits.push('option:'+selector)}];
   }
   return [];
  },
  querySelector(selector){
   if(selector.includes('[data-ck129-workspace]')||selector.includes('[data-ck82-workspace]'))
    return {focus:()=>hits.push('focus')};
   if(selector.includes('data-action=')&&(view==='exam'||view==='quiz'&&mode==='mock')){
    if(selector.includes('quiz-')&&view!=='quiz'||selector.includes('exam-')&&view!=='exam')return null;
    return {disabled:false,click:()=>hits.push('nav:'+selector)};
   }
   return null;
  }
 };
 const api={
  getState:()=>({...apiData}),
  answer:n=>{hits.push('mixedAnswer:'+n);return true;},
  goto:n=>{apiData.position=n;hits.push('mixedGoto:'+n);return true;},
  setAnswer:n=>{hits.push('officialAnswer:'+n);return true;},
  navigate:n=>{apiData.position=n;hits.push('officialGoto:'+n);return true;}
 };
 const context={document:keyboardDoc,state,window:{
  CK133ExamHub:{getState:()=>({mode})},CK129MixedMock:api,CK82FullExam:api
 },rs:()=>({mode:'mock'})};
 vm.runInNewContext(snippet,context,{filename:'v134-keyboard-snippet.js'});
 function key(key,opts={}){
  const e={key,ctrlKey:false,shiftKey:false,altKey:false,metaKey:false,repeat:false,
   isComposing:false,keyCode:0,target:{closest:()=>null},
   prevented:false,stopped:false,preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;},
   ...opts};
  events.keydown(e);return e;
 }
 return {key,hits,apiData,context,state};
}
test('mock: digits 1-5 hit visible option; Ctrl arrows use existing previous/next buttons',()=>{
 const s=setup('quiz','mock');
 const e=s.key('3');assert.equal(e.prevented,true);assert.equal(s.hits.filter(v=>v.startsWith('option:')).length,1);
 assert.match(s.hits[0],/data-choice="3"/);
 s.key('ArrowLeft',{ctrlKey:true});s.key('ArrowRight',{ctrlKey:true});
 assert.equal(s.hits.filter(x=>x.startsWith('nav:')).length,2);
 assert.ok(s.hits.some(x=>x.includes('quiz-prev')));
 assert.ok(s.hits.some(x=>x.includes('quiz-next')));
});
test('10-year separate official OMR: digit 5 and both Ctrl arrows use displayed controls',()=>{
 const s=setup('exam');s.key('5');
 assert.ok(s.hits.some(x=>x.includes('data-exam-mark="5"')));
 const left=s.key('ArrowLeft',{ctrlKey:true}),right=s.key('ArrowRight',{ctrlKey:true});
 assert.ok(left.prevented&&right.prevented);
 assert.ok(s.hits.some(x=>x.includes('exam-prev')));
 assert.ok(s.hits.some(x=>x.includes('exam-next')));
});
test('10-year existing plain arrows remain backwards-compatible',()=>{
 const s=setup('exam');s.key('ArrowRight');
 assert.ok(s.hits.some(x=>x.includes('exam-next')));
});
test('mixed exam: any focus in quiz tab can answer and navigate by underlying saved position',()=>{
 const s=setup('quiz','mixed');s.key('4');
 assert.deepEqual(s.hits,['mixedAnswer:4']);
 const e=s.key('ArrowRight',{ctrlKey:true});
 assert.equal(e.prevented,true);
 assert.ok(s.hits.includes('mixedGoto:3'));
 assert.ok(s.hits.includes('focus'));
 assert.equal(s.apiData.position,3);
});
test('official 80-question practice: uses its own answer and navigation API',()=>{
 const s=setup('quiz','official');s.key('1');s.key('ArrowLeft',{ctrlKey:true});
 assert.ok(s.hits.includes('officialAnswer:1'));
 assert.ok(s.hits.includes('officialGoto:1'));
 assert.ok(!s.hits.some(x=>x.startsWith('mixed')));
});
test('submitted, paused and hidden native papers never take a numeric answer',()=>{
 for(const mode of ['mixed','official']){
  for(const status of ['paused','submitted','none']){
   const s=setup('quiz',mode,status);const e=s.key('2');
   assert.equal(e.prevented,false);assert.equal(s.hits.length,0);
  }
  const hidden=setup('quiz',mode);hidden.apiData.expanded=false;hidden.key('2');
  assert.equal(hidden.hits.length,0);
 }
});
test('native navigation guards boundaries, but paused papers may browse',()=>{
 const s=setup('quiz','mixed','paused');
 s.apiData.position=0;s.key('ArrowLeft',{ctrlKey:true});assert.equal(s.hits.length,0);
 s.apiData.position=79;s.key('ArrowRight',{ctrlKey:true});assert.equal(s.hits.length,0);
 s.apiData.position=10;s.key('ArrowLeft',{ctrlKey:true});assert.ok(s.hits.includes('mixedGoto:9'));
});
test('editable fields, PDF canvas, IME, repeats and modifier conflicts block shortcuts',()=>{
 const candidates=[
  {target:{closest:()=>({tagName:'INPUT'})}},
  {target:{closest:()=>({className:'ck15-pdf-host'})}},
  {isComposing:true},{keyCode:229},{repeat:true},{altKey:true},{shiftKey:true},{metaKey:true}
 ];
 for(const options of candidates){
  const s=setup('quiz','mixed');s.key('3',options);s.key('ArrowRight',{...options,ctrlKey:true});
  assert.equal(s.hits.length,0,JSON.stringify(options));
 }
});
test('typing and nonexam routes preserve their own Ctrl navigation; unrelated Ctrl shortcuts untouched',()=>{
 for(const view of ['typing','home','plan','theory']){
  const s=setup(view,'mixed'),e=s.key('ArrowRight',{ctrlKey:true});
  assert.equal(e.prevented,false);assert.equal(s.hits.length,0);
 }
 const s=setup('quiz','mock');s.key('3',{ctrlKey:true});assert.equal(s.hits.length,0);
});
test('native engines export position read-only, without changing session schemas',()=>{
 const official=read('assets/ck-full-exam-v82.js'),mixed=read('assets/ck-mixed-mock-v129.js');
 assert.ok(official.includes('position:active()?.position??null'));
 assert.ok(mixed.includes('position:active()?.position??null'));
 assert.ok(official.includes("const KEY='ck82-exam-sessions-v1'"));
 assert.ok(mixed.includes("const KEY='ck129-mixed-sessions-v1'"));
 new vm.Script(official);new vm.Script(mixed);
});
test('current cache query and manual deployment safety are aligned',()=>{
 const sw=read('sw.js'),diag=read('assets/ck-data-diagnostics-v88.js');
 const config=JSON.parse(read('vercel.json'));
 assert.ok(sw.includes('conceptknot-study-v137-native-voice-guard'));
 assert.ok(diag.includes('conceptknot-study-v137-native-voice-guard'));
 for(const name of ['ck-mixed-mock-v129.js?v=134','ck-full-exam-v82.js?v=157',
  'ck-exam-hub-v133.js?v=134','ck-data-diagnostics-v88.js?v=157']){
  assert.ok(index.includes('./assets/'+name),name+' index');
  assert.ok(sw.includes('./assets/'+name),name+' SW');
 }
 assert.equal(config.git.deploymentEnabled,false);
 assert.equal(fs.existsSync(path.join(root,'.github/workflows')),false);
});
