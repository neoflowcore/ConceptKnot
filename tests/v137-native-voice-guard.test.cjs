/* ConceptKnot v137 native TTS start diagnostics — manual, non-speaker simulation.
 * Run: node --test tests/v137-native-voice-guard.test.cjs
 * No CI, external downloads, installation artifacts, or personal data.
 */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const html=read('index.html');
function fixture({voices=[],behavior='heard',phrases=['한국어 테스트 문장'],throwVoices=false}={}){
 const begin=html.indexOf('ttsPlay=function(items,options={}){'),end=html.indexOf('neuralSpeak=async function',begin);
 assert.ok(begin>0&&end>begin);
 const states=[],heard=[],timers=[],utterances=[],voice={status:'idle',token:0,label:'',total:0,position:0};
 const synth={
  getVoices:()=>{if(throwVoices)throw Error('voice API not yet ready');return voices;},
  cancel(){},
  speak(u){
   utterances.push(u);
   if(behavior==='silent')return;
   if(behavior==='blocked'){u.onerror({error:'not-allowed'});return;}
   if(behavior==='end-without-start'){u.onend();return;}
   u.onstart();heard.push({text:u.text,voice:u.voice,lang:u.lang});u.onend();
  }
 };
 const win={speechSynthesis:synth,SpeechSynthesisUtterance:class{constructor(text){this.text=text;this.voice=null;}}};
 const fun=new Function('window','ttsSettings','ttsStop','ck76Voice','ck76VoiceState',
  'ck76Segments','ttsChosenVoice','ck108Finish','ck108Progress','ck76DisplayProgress',
  'ck108Playlist','setTimeout','clearTimeout',
  'let ttsPlay=()=>{},ttsUtterance=null,ttsVoices=[],neuralSpeak=()=>{};\n'+
  html.slice(begin,end)+'return ttsPlay;');
 const play=fun(win,()=>({engine:'native',rate:1.5}),
  ()=>{voice.token++},voice,(status,reason)=>{states.push({status,reason});voice.status=status},
  ()=>phrases,()=>voices.find(v=>/^ko(?:-|_)/i.test(v.lang)||v.lang==='ko'),
  ()=>states.push({status:'finish-bookmark'}),()=>{},()=>{},null,
  (cb,ms)=>{timers.push({cb,ms});return timers.length},()=>{});
 return {play,states,heard,timers,utterances,synth,voice};
}
test('ko-KR starts on first click even when OS voice list is initially empty',()=>{
 const x=fixture();
 x.play([{}]);
 assert.equal(x.heard.length,1);
 assert.equal(x.heard[0].lang,'ko-KR');
 assert.equal(x.heard[0].voice,null);
 assert.ok(x.states.some(s=>s.status==='speaking'));
 assert.ok(x.states.some(s=>s.status==='ended'));
});
test('voiceschanged has not fired and getVoices throws: request native ko-KR rather than giving up',()=>{
 const x=fixture({throwVoices:true});
 x.play([{}]);
 assert.equal(x.heard.length,1);
 assert.ok(!x.states.some(s=>s.status==='error'));
});
test('known voices exist but none support Korean: report missing locale without foreign-voice silent fallback',()=>{
 const x=fixture({voices:[{lang:'en-US',voiceURI:'en',name:'English'}]});
 x.play([{}]);
 assert.equal(x.heard.length,0);
 assert.ok(x.states.some(s=>s.status==='error'));
 assert.ok(!x.states.some(s=>s.status==='ended'));
});
test('onerror must not be confused with a finished utterance',()=>{
 const x=fixture({behavior:'blocked'});
 x.play([{}]);
 assert.equal(x.heard.length,0);
 assert.ok(x.states.some(s=>s.status==='error'));
 assert.ok(!x.states.some(s=>s.status==='ended'));
});
test('a browser that returns neither onstart nor onerror is marked as a start failure',()=>{
 const x=fixture({behavior:'silent'});
 x.play([{}]);
 assert.equal(x.utterances.length,1);
 assert.equal(x.timers.length,1);
 assert.equal(x.timers[0].ms,7000);
 x.timers[0].cb();
 assert.ok(x.states.some(s=>s.status==='error'));
 assert.ok(!x.states.some(s=>s.status==='ended'));
});
test('an onend event without a matching start cannot falsely complete the playlist',()=>{
 const x=fixture({behavior:'end-without-start'});
 x.play([{}]);
 assert.equal(x.heard.length,0);
 assert.ok(x.states.some(s=>s.status==='error'));
 assert.ok(!x.states.some(s=>s.status==='ended'));
});
test('finite normal playback advances each segment exactly once and closes cleanly',()=>{
 const x=fixture({voices:[{lang:'ko-KR',voiceURI:'ko1',name:'Korean'}],phrases:['첫째','둘째','셋째']});
 x.play([{}]);
 assert.deepEqual(x.heard.map(v=>v.text),['첫째','둘째','셋째']);
 assert.ok(x.heard.every(v=>v.voice.voiceURI==='ko1'));
 assert.equal(x.states.filter(s=>s.status==='ended').length,1);
});
test('TTS guard ships in service worker v137 without enabling automatic CI/deploy',()=>{
 assert.match(html,/startWatchdog=setTimeout/);
 assert.match(html,/utt.voice=ttsChosenVoice\(\)\|\|voice\|\|null/);
 const sw=read('sw.js'),diag=read('assets/ck-data-diagnostics-v88.js');
 assert.match(sw,/conceptknot-study-v137-native-voice-guard/);
 assert.match(diag,/conceptknot-study-v137-native-voice-guard/);
 assert.ok(html.includes('ck-data-diagnostics-v88.js?v=137'));
 assert.equal(JSON.parse(read('vercel.json')).git.deploymentEnabled,false);
 for(const script of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))
  new vm.Script(script[1]);
});
