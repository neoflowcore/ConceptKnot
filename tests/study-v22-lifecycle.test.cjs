const {test}=require('node:test');
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
test('garden pauses on study, blur and hidden; resumes only at landing focus',()=>{
 const listeners={},docListeners={},classes=new Set();let plays=0,pauses=0;
 const animation={playState:'running',pause(){this.playState='paused';pauses++},play(){this.playState='running';plays++}};
 const el={dataset:{},style:{},getAnimations:()=>[animation]};
 const doc={readyState:'complete',hidden:false,body:{dataset:{ckV8Tab:'landing'},classList:{toggle(k,v){v?classes.add(k):classes.delete(k)}}},documentElement:{dataset:{}},getElementById:()=>el,addEventListener:(k,f)=>docListeners[k]=f};
 const win={matchMedia:()=>({matches:false,addEventListener(){}}),addEventListener:(k,f)=>listeners[k]=f};
 vm.runInNewContext(read('assets/ck-gpu-guard-v21.js'),{window:win,document:doc,MutationObserver:class{observe(){}}});
 assert.equal(win.CK21Garden.getState().active,true);
 doc.body.dataset.ckV8Tab='quiz';listeners['ck:scene-activity']();assert.equal(animation.playState,'paused');assert.equal(el.style.visibility,'hidden');
 doc.body.dataset.ckV8Tab='landing';listeners['ck:scene-activity']();assert.equal(animation.playState,'running');
 listeners.blur();assert.equal(win.CK21Garden.getState().active,false);assert.equal(animation.playState,'paused');
 listeners.focus();assert.equal(animation.playState,'running');doc.hidden=true;docListeners.visibilitychange();assert.equal(animation.playState,'paused');
 assert.equal(pauses,3);assert.equal(plays,2);
});
test('new scripts and inline scripts parse; mobile lock and fallback removal wired',()=>{
 const html=read('index.html');for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi))new vm.Script(m[1]);
 for(const p of ['assets/ck-mobile-board-v21.js','assets/ck-study-extensions-v10.js'])new vm.Script(read(p));
 assert.match(read('assets/ck-mobile-board-v21.js'),/next===locked/);
 assert.match(read('experience-v21.css'),/body.ck22-pen-locked\{position:fixed/);
 assert.match(read('experience-v21.css'),/\.ck-v8-art::after\{content:none!important\}/);
 assert.equal(JSON.parse(read('vercel.json')).git.deploymentEnabled,false);
});
test('five inverse-stem sets each contain 80 distinct-source questions and complementary answer combinations',()=>{
 const records=Object.fromEntries(JSON.parse(read('data/official-2021-2025.json')).map(r=>[r.id,r]));const window={};
 vm.runInNewContext(read('assets/ck-mock-judge-v21.js'),{window});
 for(let set=1;set<=5;set++)for(const subject of ['estate','civil']){
  const qs=window.CK21Judge.build(set,subject,records);assert.equal(qs.length,40);
  assert.equal(new Set(qs.map(q=>q.sourceYear+'-'+q.sourceNumber)).size,40);
  for(const q of qs){
   const r=records[q.sourceYear+'-'+q.sourceNumber];assert.equal(q.a.length,5);assert.equal(q.omissions[q.ok-1],r.correct[0]-1);
   assert.equal(q.a[q.ok-1].split(', ').length,4);
   for(const [i,option] of r.options.entries())assert.ok(q.q.includes('보기 '+['A','B','C','D','E'][i]+'. '+option));
   assert.ok(!q.q.includes('최종정답으로 인정된 선지인가'));
  }
 }
});
test('400 legacy drafts remain separate from 400 verified questions and answer memorization',()=>{
 const file=JSON.parse(read('data/official-2016-2020-extracted.json')),window={};vm.runInNewContext(read('assets/ck-exam-drafts-v22.js'),{window});
 assert.equal(file.entries.length,400);assert.equal(Object.keys(window.CK22_EXAM_DRAFTS).length,400);
 for(let year=2016;year<=2020;year++){
  const rows=file.entries.filter(r=>r.year===year);assert.equal(rows.length,80);assert.equal(new Set(rows.map(r=>r.number)).size,80);
  for(const r of rows){assert.equal(r.verified,false);assert.equal(r.correct.length,0);assert.equal(r.options.length,5);assert.ok(r.question.trim());assert.ok(r.options.every(s=>s.trim()));assert.match(r.paperSha256,/^[0-9a-f]{64}$/)}
 }
 assert.equal(JSON.parse(read('data/official-2021-2025.json')).length,400);
 const html=read('index.html');const speech=html.slice(html.indexOf('function officialEntry'),html.indexOf('function practiceSpeech'));
 assert.ok(!speech.includes('CK22_EXAM_DRAFTS'));
});
test('PDF resize callback tolerates detached host and schedules only connected documents',()=>{
 const source=read('assets/ck-pdf-workspace-v15.js');
 const callback=source.slice(source.indexOf('const resize=new ResizeObserver('),source.indexOf('  resize.observe(scroller);'))+'resize.callback();';
 const s={host:null,pdf:{},zoom:1,paintToken:0};let paints=0;
 const run=()=>vm.runInNewContext(callback,{s,schedulePaint:()=>paints++,ResizeObserver:class{constructor(callback){this.callback=callback}}});
 assert.doesNotThrow(run);assert.equal(paints,0);
 s.host={isConnected:false};run();assert.equal(paints,0);
 s.host={isConnected:true};run();assert.equal(paints,1);
 assert.match(source,/if\(!host\)\{if\(session\)\{session.resizeObserver\?\.disconnect\(\)/);
});
