'use strict';
/* Manual regression run: node --test tests/v111-evidence-tts.test.cjs
 * Intentionally NOT part of any GitHub Actions / auto-deployment workflow. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const json=p=>JSON.parse(read(p));
function evidence(bank,links={}){
 const win={RECALL_OFFICIAL:bank,CK83Links:{getRecords:()=>links},CK78Analysis:{classify:q=>q.diagrams?.length?['visual_original_check']:[]},addEventListener(){}};
 const doc={readyState:'loading',addEventListener(){},getElementById:()=>null};
 vm.runInNewContext(read('assets/ck-evidence-queue-v111.js'),{window:win,document:doc,requestAnimationFrame(){}});
 return win.CK111Evidence;
}
test('all official years contain 800 verified answer records and 4000 option rows',()=>{
 const bank=Object.fromEntries([...json('data/official-2021-2025.json'),...json('data/official-2016-2020.json')].map(q=>[q.id,q]));
 const api=evidence(bank),rows=api.rows(),summary=api.summary(rows);
 assert.equal(rows.length,800);
 assert.ok(api.bankComplete(rows));assert.equal(api.bankComplete(rows.slice(0,799)),false);
 assert.equal(summary.loaded,800);
 assert.equal(rows.filter(q=>q.special==='all').length,8);
 assert.equal(rows.filter(q=>q.special==='multiple').length,3);
 assert.equal(api.csvDocument(rows,'summary').split('\r\n').length-2,800);
 assert.equal(api.csvDocument(rows,'options').split('\r\n').length-2,4000);
});
test('source notes are personal and CSV formula injection is neutralized',()=>{
 const q={id:'2025-1',year:2025,number:1,subject:'estate',verified:true,question:'문항',
  correct:[2],options:['a','b','c','d','e'],diagrams:[],checks:{}};
 const links={'2025-1':{conceptIds:['estate.a'],optionNotes:{'1':{
  assessment:'false',reason:'검토 중',source:'=HYPERLINK("bad")'}}}};
 const api=evidence({'2025-1':q},links),rows=api.rows();
 assert.equal(rows.length,1);assert.equal(rows[0].sourced,1);
 assert.equal(rows[0].ready,false);
 assert.equal(api.csv('=1+2'),'"\'=1+2"');
 assert.match(api.csvDocument(rows,'options'),/'=HYPERLINK/);
 assert.ok(!api.bankComplete(rows));
});
test('P4 analysis uses one request generation to ignore stale years and shows TTS state',()=>{
 const s=read('assets/ck-study-p4-v78.js');
 for(const token of ['openGeneration=0','request=++openGeneration',
  'request!==openGeneration','ck:tts-state','data-ck107-voice-pause','data-ck111-open'])assert.ok(s.includes(token),token);
 new vm.Script(s);
});
test('a partially hydrated 40-item TTS playlist cannot start or leave old audio playing',()=>{
 const html=read('index.html'),start=html.indexOf('function ck107ReadOfficial(');
 const end=html.indexOf('\nfunction ck109ReadDue(',start);
 assert.ok(start>0&&end>start);
 const fn=html.slice(start,end),states=[],spoken=[],stops=[];
 const api=new Function('window','document','officialAudioEntry','ttsStop','ck76VoiceState',
  'ttsPlay','ck76Voice','ck76Segments','ck108Playlist',
  fn+';return ck107ReadOfficial;');
 const win={CK89OfficialBank:{loadYear:()=>Promise.resolve({})}};
 const run=api(win,{getElementById:()=>null},
 (year,n)=>{if(n>1)throw Error('unloaded');
  return {id:year+'-'+n,question:'a',options:['a','b','c','d','e'],answers:['b'],special:'normal'};},
 ()=>stops.push(true),(s,message)=>states.push(s),items=>spoken.push(items),
 {status:'idle'},()=>2,null);
 const result=run(2024,1,'qa','subject');
 assert.equal(result.ok,false);assert.equal(result.reason,'incomplete-bank');
 assert.equal(result.missing,39);assert.equal(spoken.length,0);
 assert.equal(stops.length,1);assert.equal(states.at(-1),'error');
});
test('v111 release is manual-only; all inline scripts parse',()=>{
 const html=read('index.html');
 for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))if(m[1].trim())new vm.Script(m[1]);
 new vm.Script(read('sw.js'));
 assert.match(html,/ck-evidence-queue-v111.js\?v=111/);
 assert.match(read('sw.js'),/conceptknot-study-v111-evidence-tts-corrections/);
 assert.equal(json('vercel.json').git.deploymentEnabled,false);
 assert.equal(fs.existsSync(path.join(root,'.github','workflows')),false);
});
