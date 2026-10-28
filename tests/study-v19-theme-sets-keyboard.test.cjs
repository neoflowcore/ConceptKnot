const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

test('v19 app scripts are syntactically valid without a build step',()=>{
 const html=read('index.html');
 let inline=0;
 for(const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)){
  new vm.Script(match[1]);inline++;
 }
 assert.ok(inline>=10);
 for(const file of ['assets/ck-experience-v14.js','assets/ck-shortcuts-v19.js',
  'assets/ck-pdf-night-v19.js','assets/ck-layout-v16.js','assets/ck-pdf-workspace-v15.js','sw.js']){
  new vm.Script(read(file),{filename:file});
 }
 assert.ok(html.includes('experience-v19.css'));
 assert.ok(html.includes('ck-shortcuts-v19.js'));
 assert.ok(html.includes('ck-pdf-night-v19.js'));
});
function engine(){
 const html=read('index.html');
 const start=html.indexOf('function pomoInt(value,lo');
 const end=html.indexOf('function importKeys(text)',start);
 assert.ok(start>0&&end>start);
 let now=1000000000000,renderCount=0;
 const state={
  timerRunning:false,timerRemaining:1500,timerEnd:0,
  pomodoroPhase:'focus',pomodoroFocusSeconds:1500,pomodoroBreakSeconds:300,
  pomodoros:0,dailyTotals:{},pomoProgram:null
 };
 const window={dispatchEvent(){}};
 const create=new Function('state','window','CustomEvent','Date','timerLeft',
  'refreshTimerDisplay','save','render','toast','todayISO',
  html.slice(start,end)+'return {tick:timerTick};');
 const api=create(state,window,class{constructor(type,opts){this.type=type;this.detail=opts.detail;}},
  {now:()=>now},
  ()=>state.timerRunning?Math.max(0,Math.ceil((state.timerEnd-now)/1000)):Math.max(0,state.timerRemaining||0),
  ()=>{},()=>{},()=>{renderCount++},()=>{},()=>'2026-10-29');
 return {state,pomo:window.CKPomo,tick:api.tick,advance:s=>{now+=s*1000},renders:()=>renderCount};
}
test('custom three-set sequence advances through each focus/break pair automatically',()=>{
 const s=engine();
 assert.equal(s.pomo.configureProgram(3,[
  {focus:50,rest:5},{focus:40,rest:10},{focus:30,rest:5}]),true);
 s.pomo.startProgram();
 assert.equal(s.pomo.snapshot().remaining,3000);
 s.advance(3000);s.tick();
 assert.equal(s.pomo.snapshot().phase,'break');
 assert.equal(s.pomo.snapshot().remaining,300);
 s.advance(300);s.tick();
 assert.equal(s.pomo.snapshot().program.index,1);
 assert.equal(s.pomo.snapshot().remaining,2400);
 s.advance(2400);s.tick();
 assert.equal(s.pomo.snapshot().remaining,600);
 s.advance(600);s.tick();
 assert.equal(s.pomo.snapshot().remaining,1800);
 s.advance(1800);s.tick();
 assert.equal(s.pomo.snapshot().program.finished,true);
 assert.equal(s.pomo.snapshot().running,false);
 assert.equal(s.state.pomodoros,3);
});
test('five-set cap and background-throttled timers finish safely',()=>{
 const s=engine();
 assert.equal(s.pomo.configureProgram(100,[{focus:0,rest:0}]),true);
 assert.equal(s.pomo.snapshot().program.count,5);
 assert.equal(s.pomo.snapshot().program.sets[0].focus,5);
 assert.equal(s.pomo.snapshot().program.sets[0].rest,1);
 s.pomo.configureProgram(2,[{focus:5,rest:1},{focus:5,rest:1}]);
 s.pomo.startProgram();
 s.advance(11*60);s.tick();
 assert.equal(s.pomo.snapshot().program.finished,true);
 assert.equal(s.state.pomodoros,2);
 assert.equal(s.renders(),1);
});
test('ordinary pomodoro remains manual and program can be stopped',()=>{
 const s=engine();
 s.pomo.toggle();
 s.advance(25*60);s.tick();
 assert.equal(s.pomo.snapshot().phase,'break');
 assert.equal(s.pomo.snapshot().running,false);
 s.pomo.configureProgram(1,[{focus:50,rest:5}]);
 s.pomo.startProgram();
 assert.equal(s.pomo.snapshot().program.active,true);
 s.pomo.stopProgram();
 assert.equal(s.pomo.snapshot().program.active,false);
 assert.equal(s.pomo.snapshot().running,false);
});
test('PDF dark theme changes only the rendered view, not PDF annotation data',()=>{
 const css=read('experience-v19.css');
 const js=read('assets/ck-pdf-night-v19.js');
 assert.match(css,/canvas\[data-ck15-page-canvas\]/);
 assert.match(css,/filter:invert\(1\)/);
 assert.match(css,/canvas\[data-ck15-ink-canvas\]/);
 assert.match(js,/ck19-pdf-view/);
 assert.doesNotMatch(js,/\.save\(|embedPng|annotations\s*=/);
});
test('keytips and keyboard command scope are explicitly present',()=>{
 const js=read('assets/ck-shortcuts-v19.js');
 assert.match(js,/data-typing-prev/);
 assert.match(js,/data-typing-next/);
 assert.match(js,/letter==='z'\|\|letter==='x'/);
 assert.match(js,/spatialMove\(letter\)/);
 assert.match(js,/isComposing/);
 assert.match(js,/Alt\+Shift\+WASD/);
});
test('push does not create CI or installer builds',()=>{
 const config=JSON.parse(read('vercel.json'));
 assert.equal(config.git.deploymentEnabled,false);
 assert.equal(fs.existsSync(path.join(root,'.github/workflows')),false);
 assert.match(read('sw.js'),/conceptknot-study-v19/);
});
