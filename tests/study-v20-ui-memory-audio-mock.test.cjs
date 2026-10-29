const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=x=>fs.readFileSync(path.join(__dirname,'..',x),'utf8');
const scripts=()=>[...read('index.html').matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
function facts(){
 const w={};const ss=scripts();
 vm.runInNewContext(ss[1][1]+'\n'+ss[2][1]+'\n'+read('assets/ck-mock-v20.js')+'\n'+read('assets/ck-visual40-v20.js'),{window:w});
 return w;
}
test('all inline/new scripts parse and load order includes data before app',()=>{
 const html=read('index.html'),ss=scripts();
 for(const [i,s] of ss.entries())new vm.Script(s[1],{filename:'inline'+i});
 for(const file of ['assets/ck-mock-v20.js','assets/ck-visual40-v20.js','assets/ck-shortcuts-v19.js','assets/ck-pdf-night-v19.js'])
  new vm.Script(read(file),{filename:file});
 assert.ok(html.indexOf('ck-mock-v20.js')<html.indexOf('RECALLGRAPH First-Exam Sprint.'));
 assert.ok(html.indexOf('ck-visual40-v20.js')<html.indexOf('RECALLGRAPH First-Exam Sprint.'));
 assert.ok(html.includes('./experience-v20.css'));
});
test('40 visually distinct concept cues map to verified official questions in correct subject',()=>{
 const f=facts(),concepts=f.RECALL_CONTENT.theory;
 assert.equal(concepts.length,40);
 assert.equal(Object.keys(f.CK20_VISUAL).length,40);
 for(const c of concepts){
  const v=f.CK20_VISUAL[c.id];
  assert.ok(v&&v.left&&v.right&&v.cue&&v.cue.length>12,'cue: '+c.id);
  assert.ok(v.year>=2021&&v.year<=2025,'year: '+c.id);
  assert.ok((c.s==='estate'&&v.number<=40)||(c.s==='civil'&&v.number>40),'subject: '+c.id);
  assert.equal(f.RECALL_OFFICIAL[v.year+'-'+v.number].verified,true,'verified: '+c.id);
 }
});
test('five sets contain 80 questions each, correct answers preserved after every permutation',()=>{
 const f=facts(),all=f.RECALL_OFFICIAL;let total=0,substituteCount=0;
 for(let set=1;set<=5;set++){
  let perSet=0;
  for(const subject of ['estate','civil']){
   const qs=f.CK20_MOCK.build(set,subject,all);
   assert.equal(qs.length,40,'set '+set+' '+subject);
   assert.equal(new Set(qs.map(q=>q.id)).size,40);
   assert.equal(qs,f.CK20_MOCK.build(set,subject,all),'cache/stability');
   for(const q of qs){
    perSet++;total++;
    const original=all[q.sourceYear+'-'+q.sourceNumber];
    assert.equal(q.verified,true);
    assert.equal(q.a.length,5);
    assert.equal(q.q,original.question);
    assert.notDeepEqual([...q.originalOrder],[1,2,3,4,5],'real shuffled option order');
    const oldAnswer=[...original.correct].sort((a,b)=>a-b);
    const restored=Array.from(q.correct,pos=>q.originalOrder[pos-1]).sort((a,b)=>a-b);
    assert.deepEqual(restored,oldAnswer,'answer key remapped: '+q.id);
    for(let opt=1;opt<=5;opt++)assert.equal(f.CK20_MOCK.isCorrect(q,opt),q.correct.includes(opt));
    if(q.sourceYear!==f.CK20_MOCK.years[set-1])substituteCount++;
   }
  }
  assert.equal(perSet,80);
 }
 assert.equal(total,400);
 assert.equal(substituteCount,5,'five all-correct records replaced from other years');
});
test('responsive rules handle narrow panel and v20 dark controls',()=>{
 const css=read('experience-v20.css');
 assert.match(css,/container-type:inline-size/);
 assert.match(css,/@container \(max-width:760px\)/);
 assert.match(css,/grid-template-columns:minmax\(0,1fr\)!important/);
 for(const k of ['.subject-tab .n','.step-round','.pill','.quiz-dot','.ck20-marathon','.ck20-linked-concept','.ck20-visual-stage'])
  assert.ok(css.includes(k),'missing '+k);
});
test('one-click full-year audio stays active across tab render, explicit stop remains',()=>{
 const html=read('index.html');
 assert.match(html,/data-tts-official-all/);
 assert.match(html,/id="tts-marathon-mode"/);
 assert.match(html,/ttsPlay\(items,\{continuous,mode/);
 assert.match(html,/if\(ttsSettings\(\)\.engine==='neural'\)\{neuralSpeak\(items,options\);return\}/);
 assert.match(html,/function render\(\)\{if\(!ttsBatchActive\)ttsStop\(false\)/);
 assert.match(html,/data-tts-stop/);
 assert.match(html,/if\(b\.hasAttribute\('data-tts-official-all'\)\)\{const \[a,z\]=examRange\(\),items=\[\]/);
 assert.match(html,/if\(correct\.length===5\)throw Error/);
 assert.match(html,/function splitSpeechText/);
});
test('service worker version change does not enable git push CI',()=>{
 assert.match(read('sw.js'),/conceptknot-study-v\d+/);
 for(const asset of ['experience-v20.css','ck-mock-v20.js','ck-visual40-v20.js'])
  assert.ok(read('sw.js').includes(asset));
 const vercel=JSON.parse(read('vercel.json'));
 assert.equal(vercel.git.deploymentEnabled,false);
 assert.equal(fs.existsSync(path.resolve(__dirname,'..','.github','workflows')),false);
});
