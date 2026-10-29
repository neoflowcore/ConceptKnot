'use strict';
/* Manually run with node --test tests/study-v30-exam-tts.test.cjs.
   No build, install artifact, CI workflow, or network dependency. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('v30 immediate official-exam marking and recent-year guide are wired',()=>{
 const html=read('index.html'),css=read('experience-v26.css');
 const exam=html.slice(html.indexOf('function renderExam(){'),html.indexOf('function examScore('));
 assert.match(exam,/data-ck30-instant/);
 assert.match(exam,/officialInlineHtml\(yr,n,answer,instant,key\)/);
 assert.match(exam,/ck30-recent-year/);
 assert.match(exam,/전원정답 처리/);
 assert.match(html,/if\(!state\.examInstantGrade&&state\.examQuestion<end\)state\.examQuestion\+\+/);
 assert.match(html,/if\(instantToggle\)/);
 assert.match(css,/\.ck30-exam-feedback\.is-correct/);
 assert.match(css,/\.ck30-exam-feedback\.is-wrong/);
 assert.match(css,/\.ck30-exam-feedback\.is-special/);
 assert.match(css,/\.year-tab\.ck30-recent-year/);
});
test('Ctrl alone shows numeric tab KeyTips; Alt+Shift+WASD is preserved',()=>{
 const s=read('assets/ck-shortcuts-v19.js');
 assert.match(s,/if\(e.key==='Control'\)/);
 assert.match(s,/highlight\(!mode\)/);
 assert.match(s,/if\(ctrlDown&&e.ctrlKey\)/);
 assert.match(s,/e.altKey&&e.shiftKey&&!e.ctrlKey&&!e.metaKey/);
 assert.match(s,/if\(mode&&!e.ctrlKey&&!e.altKey&&!e.metaKey\)/);
 assert.doesNotMatch(s,/Alt\+digit selects tab/);
});
test('five-year analysis seeds link only to verified A-form sources',()=>{
 const d=JSON.parse(read('data/official-2021-2025.json'));
 const map=Object.fromEntries(d.map(r=>[r.id,r]));
 const env={window:{},document:{addEventListener(){}},console};
 vm.runInNewContext(read('assets/ck-official-explain-v30.js'),env);
 const info=env.window.CK30Analysis.getInfo();
 assert.equal(info.draftCount,4);
 for(const id of info.ids){assert.ok(map[id]?.verified,id);assert.equal(map[id].options.length,5);}
 assert.match(read('assets/ck-official-explain-v30.js'),/해설 작성 대기/);
 assert.match(read('sw.js'),/ck-official-explain-v30/);
});
test('official audio three modes and AI continuous playback never fall back to native',async()=>{
 const html=read('index.html');
 const code=html.slice(html.indexOf('let ttsToken='),html.indexOf('function render(){',html.indexOf('let ttsToken=')));
 const handlers={},spoken=[],native=[],errors=[];
 const document={addEventListener:(type,fn)=>{(handlers[type]??=[]).push(fn)},getElementById:()=>null,querySelectorAll:()=>[],querySelector:()=>null};
 const window={
  CKNeural:{ready:true,stop(){},speak:async(text,voice,rate)=>{spoken.push({text,voice,rate})},pause(){},setRate(){}},
  speechSynthesis:{cancel(){},getVoices:()=>[{voiceURI:'ko1',name:'Korean',lang:'ko-KR'}],speak:u=>native.push(u),addEventListener(){}},
  SpeechSynthesisUtterance:function(text){this.text=text},addEventListener(){},
  RECALL_OFFICIAL:{'2025-12':{verified:true,question:'가격이 5% 하락하면?',options:['1','2','3','4','8% 증가'],correct:[5]}}
 };
 const state={year:2025,subject:'estate',examQuestion:12,importedKeys:{},
  tts:{engine:'neural',rate:1.5,neuralVoice:'F2',marathonMode:'all',playScope:'all'},spokenTexts:{}};
 const factory=new Function('window','document','state','KEYS','normalKey','subject','quizzes','toast','save','changeView','location','navigator','examRange','SpeechSynthesisUtterance',
  code+'\nreturn {officialSpeech,speechSegments,neuralSpeak,ttsPlay,ttsSettings};');
 const api=factory(window,document,state,{2025:Array.from({length:80},()=>[5])},
  v=>Array.isArray(v)?v:[v],()=>({label:'부동산학개론'}),()=>[],msg=>errors.push(msg),
  ()=>{},()=>errors.push('VIEW CHANGED'),{protocol:'file:'},{},()=>[1,40],window.SpeechSynthesisUtterance);
 const entry=api.officialSpeech(2025,12);
 assert.equal(api.speechSegments([entry],'qa').length,2);
 assert.equal(api.speechSegments([entry],'answer').length,1);
 assert.equal(api.speechSegments([entry],'all').length,6);
 await api.neuralSpeak([entry],{continuous:true,mode:'all',label:'2025년'});
 assert.equal(spoken.length,6);assert.equal(native.length,0);
 spoken.length=0;
 await api.neuralSpeak([entry],{mode:'answer'});
 assert.equal(spoken.length,1);assert.match(spoken[0].text,/정답/);
 assert.equal(errors.includes('VIEW CHANGED'),false);
 assert.match(html,/if\(b\.hasAttribute\('data-tts-exam'\)\)ttsPlay/);
 assert.match(html,/tts-play-scope/);
 assert.match(html,/AI 여성 음성 · Supertonic 3/);
 assert.doesNotMatch(html,/<h3>바로 듣는 창작 연습<\/h3>/);
});
test('old source and manual release policy survive',()=>{
 const html=read('index.html');
 for(const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(match[1]);
 assert.match(read('sw.js'),/conceptknot-study-v30-exam-voice-study/);
 assert.equal(JSON.parse(read('vercel.json')).git.deploymentEnabled,false);
 assert.equal(fs.existsSync(path.join(root,'.github','workflows')),false);
});
