/* ConceptKnot v133 unified exam UI regression. Run manually; no network/CI.
 * Code-level harness, not a substitute for Android/Brave/S Pen test.
 */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const JS=read('assets/ck-exam-hub-v133.js');
function harness(mixedState='none',officialState='none'){
 const frames=[],listeners={},local=new Map(),writes=[],engines={},elements={};
 let mockSet=0,mixedSet=1,year=2025,mixedOpened=0,officialOpened=0;
 let clockNow=1_000_000;
 const now=()=>clockNow;
 const store={getItem:key=>local.get(key)||null,setItem:(key,value)=>{local.set(key,value);writes.push(key);},removeItem:key=>local.delete(key)};
 class Element{
  constructor(id){this.id=id;this.isConnected=true;this.dataset={};this.html='';this.firstElementChild=null;}
  set innerHTML(v){this.html=v;this.firstElementChild={};}
  get innerHTML(){return this.html;}
  contains(){return false;}
  querySelector(){return null;}
 }
 for(const id of ['ck133-exam-unified','ck133-exam-hub','ck133-original-practice',
  'ck129-mixed-mocks','ck82-full-exam'])elements[id]=new Element(id);
 const mock=elements['ck133-original-practice'],mixed=elements['ck129-mixed-mocks'],official=elements['ck82-full-exam'];
 mock.querySelector=q=>q.includes('[aria-pressed')?{dataset:{ck20MockSet:String(mockSet)}}:
  q.startsWith('[data-ck20-mock-set=')?{click(){mockSet=Number(q.match(/"(\d+)"/)[1]);}}:null;
 mixed.querySelector=q=>q==='[data-ck129-set]'?{value:String(mixedSet),dispatchEvent(){mixedSet=Number(this.value);}}:null;
 official.querySelector=q=>q==='[data-ck82-year]'?{value:String(year),dispatchEvent(){year=Number(this.value);}}:null;
 engines.mixed={active:mixedState,remainingMs:120000,expanded:false};
 engines.official={active:officialState,remainingMs:300000,expanded:false};
 const window={MutationObserver:class{observe(){}},
  CK129MixedMock:{getState:()=>engines.mixed,open(){mixedOpened++;engines.mixed.expanded=true;}},
  CK82FullExam:{getState:()=>engines.official,open(){officialOpened++;engines.official.expanded=true;}},
  addEventListener(){},confirm:()=>true};
 const document={readyState:'loading',hidden:false,getElementById:id=>elements[id]||null,
  addEventListener:(type,fn)=>{listeners[type]=fn;}};
 const FakeDate=class extends Date {static now(){return clockNow;}};
 const context={window,document,sessionStorage:store,requestAnimationFrame(fn){frames.push(fn);return frames.length;},
  setInterval(){return 1;},clearInterval(){},Event:class {constructor(type,options){this.type=type;this.options=options;}},
  Date:FakeDate,MutationObserver:window.MutationObserver};
 vm.runInNewContext(JS,context,{filename:'ck-exam-hub-v133.js'});
 const flush=()=>{while(frames.length)frames.shift()();};
 listeners.DOMContentLoaded();flush();
 return {api:window.CK133ExamHub,elements,engines,local,writes,now,
  clock(ms){clockNow=ms;},get mockSet(){return mockSet;},get mixedSet(){return mixedSet;},get year(){return year;},
  get mixedOpened(){return mixedOpened;},get officialOpened(){return officialOpened;}};
}
test('single hub owns 3 categories, 6 mock choices, 5 mixed choices and 10 year choices',()=>{
 const p=harness('none','none');
 assert.match(p.elements['ck133-exam-hub'].html,/data-ck133-category="mock"/);
 assert.match(p.elements['ck133-exam-hub'].html,/data-ck133-category="mixed"/);
 assert.match(p.elements['ck133-exam-hub'].html,/data-ck133-category="official"/);
 assert.equal((p.elements['ck133-exam-hub'].html.match(/data-ck133-choice=/g)||[]).length,6);
 p.api.setMode('mixed');
 assert.equal((p.elements['ck133-exam-hub'].html.match(/data-ck133-choice=/g)||[]).length,5);
 p.api.setMode('official');
 assert.equal((p.elements['ck133-exam-hub'].html.match(/data-ck133-choice=/g)||[]).length,10);
});
test('active 100-minute native engines restore the selected mode and mirror remaining time',()=>{
 const p=harness('running','paused');
 assert.equal(p.api.getState().mode,'mixed');
 assert.equal(p.api.getState().clock,'2:00');
 assert.equal(p.api.choose(3),true);assert.equal(p.mixedSet,3);
 assert.equal(p.api.setMode('official'),true);
 assert.equal(p.api.getState().clock,'5:00');
 assert.equal(p.api.choose(2020),true);assert.equal(p.year,2020);
 assert.equal(p.officialOpened,1);
});
test('original 15/80 mock set buttons are reused rather than rewriting answers',()=>{
 const p=harness();p.api.setMode('mock');
 assert.equal(p.api.choose(5),true);
 assert.equal(p.mockSet,5);
 assert.equal(p.api.getState().set,5);
 assert.equal(p.local.has('ck129-mixed-sessions-v1'),false);
});
test('100-minute mock timer runs from a timestamp, pauses, resumes and preserves OMR',()=>{
 const p=harness();p.api.setMode('mock');
 p.api.choose(2);assert.equal(p.api.actionClock('start'),true);
 assert.equal(p.api.getState().clock,'100:00');
 p.clock(1_060_000);assert.equal(p.api.getState().clock,'99:00');
 assert.equal(p.api.actionClock('pause'),true);
 p.clock(1_360_000);assert.equal(p.api.getState().clock,'99:00');
 assert.equal(p.api.actionClock('resume'),true);
 p.clock(1_390_000);assert.equal(p.api.getState().clock,'98:30');
 assert.equal(p.api.actionClock('reset'),true);
 assert.equal(p.api.getState().clock,'100:00');
 assert.ok(p.writes.every(k=>['ck133-practice-clock-v1','ck133-exam-mode-v1'].includes(k)));
});
test('original CK20 / CK82 / CK129 sections mount separately and review follows them all',()=>{
 const html=read('index.html'),start=html.indexOf('function renderQuiz(){'),end=html.indexOf('\nfunction ',start+1);
 const quiz=html.slice(start,end),css=read('assets/ck-exam-hub-v133.css');
 assert.ok(start>0&&end>start);
 for(const value of ['id="ck133-exam-unified"','id="ck133-exam-hub"','id="ck133-exam-engine"',
  'id="ck133-original-practice"','id="ck133-review-anchor"'])
  assert.ok(quiz.includes(value),value);
 assert.match(quiz,/quiz-layout ck20-quiz-layout/);
 assert.match(css,/data-ck133-mode="mock"/);
 assert.match(css,/data-ck133-mode="mixed"/);
 assert.match(css,/data-ck133-mode="official"/);
 assert.ok(read('assets/ck-full-exam-v82.js').includes('#main #ck133-exam-engine'));
 assert.ok(read('assets/ck-mixed-mock-v129.js').includes('#main #ck133-exam-engine'));
 assert.ok(read('assets/ck-mixed-review-v131.js').includes("document.getElementById('ck133-review-anchor')"));
});
test('offline generation and changed native JS URLs are aligned, without automatic builds',()=>{
 const html=read('index.html'),sw=read('sw.js'),diag=read('assets/ck-data-diagnostics-v88.js');
 const config=JSON.parse(read('vercel.json'));
 for(const suffix of ['ck-exam-hub-v133.js?v=134','ck-exam-hub-v133.css?v=133',
  'ck-mixed-mock-v129.js?v=134','ck-full-exam-v82.js?v=134','ck-mixed-review-v131.js?v=133',
  'ck-data-diagnostics-v88.js?v=137']){
  assert.ok(html.includes('./assets/'+suffix),'HTML '+suffix);
  assert.ok(sw.includes('./assets/'+suffix),'SW '+suffix);
 }
 assert.match(sw,/conceptknot-study-v137-native-voice-guard/);
 assert.match(diag,/conceptknot-study-v137-native-voice-guard/);
 assert.equal(config.git.deploymentEnabled,false);
 assert.equal(fs.existsSync(path.join(ROOT,'.github','workflows')),false);
 new vm.Script(JS);
});
