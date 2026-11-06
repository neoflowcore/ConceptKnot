/* v125 — manually run: node --test tests/v125-tts-offline-core.test.cjs
 * Tests are local, fake-device checks, NOT speaker/GPU/S Pen/Brave verification.
 * No Actions, deployment, EXE/APK/ZIP or automatic storage migration.
 */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const html=read('index.html'),sw=read('sw.js'),diag=read('assets/ck-data-diagnostics-v88.js');
function canonical(){
 const a=html.indexOf('function officialAudioEntry('),b=html.indexOf('function ck76Segments(',a);
 assert.ok(a>0&&b>a);return new Function('window','normalKey',html.slice(a,b)+'return officialAudioEntry;');
}
const mk=(year=2025,n=1,correct=[2])=>({id:year+'-'+n,year,number:n,subject:n<=40?'estate':'civil',
 verified:true,question:'원본 기출문제 질문',options:['원문 ①','원문 ②','원문 ③','원문 ④','원문 ⑤'],correct});
const simpleKey=value=>Array.isArray(value)?value:[value];
function voiceFixture(phrase,engine='native',failOn=null){
 const a=html.indexOf('ttsPlay=function(items,options={}){'),b=html.indexOf('neuralSpeak=async function',a);
 assert.ok(a>0&&b>a);
 const heard=[],states=[],progress=[],bookmark={continuous:true,segmentNumbers:[42]},voice={token:0,position:0,total:0};
 const window={SpeechSynthesisUtterance:class{constructor(text){this.text=text}},
  speechSynthesis:{getVoices:()=>[{lang:'ko-KR',name:'ko Korean',voiceURI:'ko-1'}],
   speak(utterance){
    if(failOn==='blocked'){utterance.onerror({error:'not-allowed'});return;}
    if(failOn!=='never'&&utterance.text.length>85){
     utterance.onerror({error:'text-too-long'});return;
    }
    utterance.onstart();heard.push(utterance.text);utterance.onend();
   },cancel(){}}
 };
 const player=new Function('window','ttsSettings','ttsStop','ck76Voice','ck76VoiceState',
 'ck76Segments','ttsChosenVoice','ck108Finish','ck108Progress','ck76DisplayProgress',
 'ck108Playlist','toast',
 'let ttsPlay=()=>{},ttsUtterance=null,ttsVoices=[],neuralSpeak=()=>{};\n'+
 html.slice(a,b)+'\nreturn ttsPlay;')(
 window,()=>({engine,rate:1.5}),()=>{voice.token++},voice,(name,message)=>states.push([name,message]),
 ()=>[phrase],()=>({lang:'ko-KR',voiceURI:'ko-1'}),
 ()=>states.push(['finished']),index=>progress.push(index),()=>{},bookmark,()=>{});
 return {player,heard,states,bookmark,voice,progress};
}
test('official A-form TTS reads canonical text, not an independently marked personal draft',()=>{
 const official=mk(),lookup={'2025-1':official};
 const fn=canonical()({RECALL_OFFICIAL:lookup},simpleKey);
 const r=fn(2025,1);
 assert.equal(r.question,official.question);assert.deepEqual(r.options,official.options);
 assert.deepEqual(r.answers,['원문 ②']);
 assert.equal(r.special,'normal');
 assert.doesNotMatch(html.slice(html.indexOf('function officialAudioEntry('),
  html.indexOf('function ck76Segments(')),/spokenStore\(\)|officialEntry\(/);
 assert.match(html,/개인 대조문장은 별도 저장되지만 공식 낭독/);
 assert.equal(JSON.stringify(lookup['2025-1']),JSON.stringify(official));
});
test('the actual 800 paper records are all speakable, with 8 all-accepted and 3 multiple',()=>{
 const canonicalRows=[
  ...JSON.parse(read('data/official-2016-2020.json')),
  ...JSON.parse(read('data/official-2021-2025.json'))];
 assert.equal(canonicalRows.length,800);
 const bank=Object.fromEntries(canonicalRows.map(x=>[x.id,x]));
 const f=canonical()({RECALL_OFFICIAL:bank},simpleKey);
 let all=0,multi=0;
 for(const q of canonicalRows){
  const row=f(q.year,q.number);
  assert.equal(row.question,q.question.trim());
  assert.deepEqual(row.options,q.options.map(x=>x.trim()));
  assert.equal(row.answers.length,q.correct.length===5?0:q.correct.length);
  if(row.special==='allAccepted')all++;
  if(row.special==='multiple')multi++;
 }
 assert.equal(all,8);assert.equal(multi,3);
});
test('canonical invalid answer sets, year, subject and missing paper fail rather than fall back',()=>{
 const official=mk(),f=canonical()({RECALL_OFFICIAL:{'2025-1':official}},simpleKey);
 assert.throws(()=>f(2025,2));
 official.correct=[1,1];assert.throws(()=>f(2025,1));
 official.correct=[7];assert.throws(()=>f(2025,1));
 official.correct=[2];official.subject='civil';assert.throws(()=>f(2025,1));
 official.subject='estate';official.year=2024;assert.throws(()=>f(2025,1));
});
test('multiple/all-accepted are grading categories, never five true verdicts',()=>{
 const multiple=mk(2020,79,[2,4]),all=mk(2019,80,[1,2,3,4,5]);
 const f=canonical()({RECALL_OFFICIAL:{'2020-79':multiple,'2019-80':all}},simpleKey);
 assert.equal(f(2020,79).special,'multiple');
 assert.deepEqual(f(2020,79).answers,['원문 ②','원문 ④']);
 assert.equal(f(2019,80).special,'allAccepted');
 assert.deepEqual(f(2019,80).answers,[]);
});
test('native speech text-too-long retries the EXACT phrase with no skipped words',()=>{
 const phrase=Array.from({length:29},(_,i)=>'문장'+(i+1)+'은').join(' ');
 const f=voiceFixture(phrase,'native');
 f.player([{id:'2025-42',question:phrase}],{mode:'qa',__ck107Official:true});
 assert.equal(f.heard.join(' ').replace(/\s+/g,' ').trim(),phrase);
 assert.ok(f.heard.length>1);assert.ok(f.heard.every(x=>x.length<=85));
 assert.equal(f.bookmark.segmentNumbers.length,f.heard.length);
 assert.ok(f.bookmark.segmentNumbers.every(n=>n===42));
 assert.equal(f.states.at(-1)[0],'ended');
});
test('speech permission errors fail visibly without silently skipping to a fake completed status',()=>{
 const f=voiceFixture('음성 재생을 차단한 기기','native','blocked');
 f.player([{id:'2025-42'}],{mode:'qa',__ck107Official:true});
 assert.equal(f.heard.length,0);
 assert.ok(f.states.some(v=>v[0]==='error'));
 assert.ok(!f.states.some(v=>v[0]==='ended'));
});
test('official listen button is read-only; personal save remains an explicit separate action',()=>{
 const a=html.indexOf("if(b.hasAttribute('data-tts-official'))");
 const b=html.indexOf("if(b.hasAttribute('data-tts-official-all'))",a);
 assert.ok(a>=0&&b>a);assert.doesNotMatch(html.slice(a,b),/ttsSaveOfficial\(\)/);
 assert.match(html,/if\(b\.hasAttribute\('data-tts-save'\)\)\{ttsSaveOfficial\(\)/);
 assert.match(html,/typeof window\.speechSynthesis\.addEventListener==='function'/);
 assert.match(html,/try\{ttsVoices=window\.speechSynthesis\.getVoices\(\)\|\|\[\]\}catch/);
});
function serviceWorker(fakeAddAll,fakeFetch){
 const events={},core=new Set(),storage={
  addAll:async files=>{await fakeAddAll(files);files.forEach(file=>core.add(file));},
  put:async()=>{},
  match:async file=>core.has(file)?{ok:true,headers:{get:()=>file.endsWith('.html')?'text/html':'application/javascript'}}:null,
  delete:async file=>core.delete(file)
 };
 const used={skips:0,deleted:0,core:null,optional:0};
 const caches={open:async()=>storage,keys:async()=>['conceptknot-study-v124-evidence-packet-qa'],
  delete:async()=>{used.deleted++;return true}};
 const self={addEventListener:(n,fn)=>events[n]=fn,skipWaiting:async()=>{used.skips++;},
  clients:{claim:async()=>{}},location:{href:'https://app.test/sw.js',origin:'https://app.test'}};
 vm.runInNewContext(sw,{self,caches,console:{warn(){}},
  fetch:async(url)=>{used.optional++;return fakeFetch?fakeFetch(url):{ok:true}},URL:class{},Response:class{}});
 const install=async()=>{let pending;events.install({waitUntil:p=>pending=p});return pending};
 return {events,caches,used,install};
}
test('SW does not activate a new generation when a critical file fails to download',async()=>{
 const s=serviceWorker(async(files)=>{assert.equal(files.length,11);throw Error('network offline')});
 await assert.rejects(s.install(),/network offline/);
 assert.equal(s.used.skips,0);
 assert.equal(s.used.deleted,0);
});
test('SW switches only after 11 critical files are present, optional failure can be recovered online',async()=>{
 let prepared=[];const s=serviceWorker(async files=>{prepared=files;},
  async()=>({ok:false,status:503}));
 await s.install();
 assert.equal(prepared.length,11);
 assert.ok(prepared.includes('./data/official-2021-2025.json'));
 assert.ok(prepared.includes('./data/official-2016-2020.json'));
 assert.equal(s.used.skips,1);
 assert.equal(s.used.deleted,0,'activate is not forced by install itself');
});
function offline(){
 const i=diag.indexOf('const OFFLINE_CACHE='),j=diag.indexOf('let root=null;',i);
 assert.ok(i>0&&j>i);
 return new Function('window',diag.slice(i,j)+'return {offlineHealth,OFFLINE_MINIMUM,OFFLINE_CACHE};')({});
}
test('manual cache inspection is read-only, does not fabricate a cache when missing',async()=>{
 const api=offline();let opened=0;
 const missing={keys:async()=>[],open:async()=>{opened++;throw Error('not allowed')}};
 const r=await api.offlineHealth(missing,true);
 assert.equal(r.installed,false);assert.equal(r.cached,0);assert.equal(opened,0);
 assert.equal(api.OFFLINE_MINIMUM.length,11);
});
test('manual cache inspection reports partial vs complete and does not assert controller version',async()=>{
 const api=offline(),rows=new Set(api.OFFLINE_MINIMUM);
 const cached={keys:async()=>[api.OFFLINE_CACHE],open:async()=>({
  match:async(path)=>rows.has(path)?{ok:true}:null
 })};
 const all=await api.offlineHealth(cached,true);assert.equal(all.cached,11);
 assert.equal(all.ready,true);
 const noController=await api.offlineHealth(cached,false);assert.equal(noController.ready,false);
 rows.delete('./data/official-2016-2020.json');
 const partial=await api.offlineHealth(cached,true);
 assert.equal(partial.cached,10);assert.equal(partial.ready,false);
 assert.deepEqual(partial.missing,['./data/official-2016-2020.json']);
});
test('CRITICAL in SW matches offline health scope; index and SW use identical v125 assets',()=>{
 const api=offline(),idx=sw.indexOf('const CRITICAL=['),end=sw.indexOf('];',idx);
 assert.ok(idx>0&&end>idx);
 const paths=[...sw.slice(idx,end).matchAll(/'(\.\/[^']+)'/g)].map(m=>m[1]);
 assert.deepEqual(paths,[...api.OFFLINE_MINIMUM]);
 for(const suffix of ['ck-data-diagnostics-v88.js?v=128',
 'ck-data-diagnostics-v88.css?v=125','ck-manual-qa-v115.js?v=128']){
  assert.equal(html.split(suffix).length-1,1);
  assert.equal(sw.split(suffix).length-1,3,'ASSETS, HOT, CRITICAL');
 }
 assert.match(diag,/data-v125-offline-run/);
 assert.match(diag,/runOfflineHealth\(\)/);
});
test('legacy manual QA records survive 25 to 27 tasks; automatic deploy remains forbidden',()=>{
 const src=read('assets/ck-manual-qa-v115.js');
 assert.equal([...src.matchAll(/\{id:'[-a-z0-9]+',group:/g)].length,27);
 assert.match(src,/id:'tts-canonical'/);assert.match(src,/id:'offline-core'/);
 assert.match(src,/personal-v115-manual-qa/);
 assert.equal(JSON.parse(read('vercel.json')).git.deploymentEnabled,false);
 assert.equal(fs.existsSync(path.join(__dirname,'..','.github','workflows')),false);
});
test('current HTML inline code and service worker parse without executing browser effects',()=>{
 for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))
  if(m[1].trim())new vm.Script(m[1]);
 new vm.Script(sw);new vm.Script(diag);
});
