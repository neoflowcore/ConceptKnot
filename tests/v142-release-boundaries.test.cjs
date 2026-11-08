/* v142 guards: manual node --test tests/v142-release-boundaries.test.cjs */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),crypto=require('node:crypto'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
function gitBlobSha(path){const b=fs.readFileSync(path);
 return crypto.createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');}
test('canonical 800 A-form questions and official concept candidates are byte identical',()=>{
 const unchanged={
  'data/official-2016-2020.json':'a34d8cafd6362111bf01021da800a648604a6a03',
  'data/official-2021-2025.json':'82e0e2e2a0183988523a841c1df2d4b982c73335',
  'data/concept-occurrences-v1.json':'3bee1a1a50532a5b9b9c8edae6ad2639be4707e2',
  'data/explanations/official-2021.json':'32ddb10847a5301bd26098e7ee0a4ca091520d71',
  'data/explanations/official-2022.json':'c2a809729ccee9473b202eae40f9440f8fbccecf',
  'data/explanations/official-2023.json':'69c4b87a07e30eaa7ac7e8f1bcc2ea6a8e2954a0',
  'data/explanations/official-2024.json':'64029c15bbca2bee2bf90ea3edc79fbfe241bb33',
  'data/explanations/official-2025.json':'3f4bd5656645f630875924e787d3410f323a847d'
 };
 for(const [path,sha] of Object.entries(unchanged))assert.equal(gitBlobSha(path),sha,path);
});
test('new P6-B scripts and official short buttons exist under v142 HTML',()=>{
 const html=read('index.html'),sw=read('sw.js'),glue=read('assets/ck-study-charts-v79.js');
 assert.match(html,/ck-release" content="v142-p6b-theory-scenes"/);
 assert.match(html,/ck-study-charts-v79.js\?v=142/);
 assert.match(html,/ck-study-charts-v79.css\?v=142/);
 assert.match(sw,/conceptknot-study-v142-theory-scenes-p6b/);
 for(const name of ['ck-concept-lab-v141.js?v=142','ck-concept-lab-v141.css?v=142',
  'ck-theory-models-v142.js?v=142','ck-theory-v142.js?v=142','ck-theory-v142.css?v=142']){
   assert.ok(sw.includes(name),'missing cache '+name);
 }
 assert.match(glue,/CK141ConceptLab\?\.mount/);
 assert.match(glue,/CK142Theory\?\.mount/);
});
test('no auto deploy, new actions or installer packaging was introduced',()=>{
 const config=JSON.parse(read('vercel.json'));
 assert.equal(config.git.deploymentEnabled,false);
 assert.equal(fs.existsSync('.github/workflows'),false);
 const sw=read('sw.js');
 const critical=sw.match(/const CRITICAL=\[([\s\S]*?)\];/);
 assert.ok(critical);
 assert.equal([...critical[1].matchAll(/'\.\/[^']+'/g)].length,11);
 assert.doesNotMatch(critical[1],/ck-theory|models\/tts\/supertonic-3/);
});
test('pen barrel-release exits eraser without cancelling a contact stroke',()=>{
 const src=read('assets/ck-pen-input-v60.js'),events={};
 const context={window:{addEventListener(){}},document:{addEventListener(type,cb){events[type]=cb;}}};
 vm.runInNewContext(src,context,{filename:'ck-pen-input-v60.js'});
 const pen=context.window.CKPen60;
 const down={pointerType:'pen',pointerId:3,buttons:33,button:5,pressure:.7,type:'pointerdown'};
 pen.observe(down);assert.equal(pen.eraser(down),true);
 const release={...down,buttons:1,button:5,type:'pointerup'};
 pen.observe(release);
 const move={...down,buttons:1,button:0,type:'pointermove'};
 pen.observe(move);assert.equal(pen.eraser(move),false);
 assert.equal(pen.contact(move),true);
 pen.reset();assert.equal(pen.eraser({...move,buttons:0,pressure:0}),false);
});
test('up from tip cannot keep CK9 writing lock from stale pressure; input data retained',()=>{
 const html=read('index.html');
 assert.match(html,/if\(e\.type==='pointerup'&&\[2,5\]\.includes\(e\.button\)/);
 assert.match(html,/const ok=save\(\)/);
 assert.match(html,/document\.body\.classList\.remove\('ck21-stylus-writing'\)/);
 assert.match(html,/window\.addEventListener\('ck:pen-deactivate',disableBoardPen\)/);
});
test('source-gate audit never publishes unreviewed text hits',()=>{
 const {audit}=require('../scripts/audit-p6b-source-gates-v142.cjs');
 const bank=[...JSON.parse(read('data/official-2016-2020.json')),
  ...JSON.parse(read('data/official-2021-2025.json'))];
 const occurrences=JSON.parse(read('data/concept-occurrences-v1.json')).occurrences;
 const taxonomy=JSON.parse(read('data/concept-taxonomy-v1.json')).concepts;
 for(const id of ['market','rent','arc','budget','ppf','cost','cobweb']){
  const r=audit({bank,occurrences,taxonomy},id,true,3);
  assert.equal(r.officialQuestions,800);
  assert.equal(r.occurrenceRows,400);
  assert.equal(r.approvedLinks,0);
  assert.equal(r.canPublish,false);
  assert.ok(r.candidates.every(x=>x.status==='UNREVIEWED_CANDIDATE'));
 }
});
test('source-gate rejects forged published links without official evidence',()=>{
 const {audit}=require('../scripts/audit-p6b-source-gates-v142.cjs');
 const q={id:'2025-10',year:2025,number:10,subject:'estate',verified:true};
 const t={id:'estate.land.demand',reviewStatus:'verified'};
 const o={questionId:q.id,examYear:q.year,verificationStatus:'verified',
  coreConceptIds:['estate.land.demand'],evidenceIds:[],candidateConceptIds:['estate.land.demand']};
 const r=audit({bank:[q],occurrences:[o],taxonomy:[t]},'market',true);
 assert.equal(r.approvedLinks,0);assert.equal(r.canPublish,false);
});
test('all newly introduced JS parses without executing live browser',()=>{
 for(const path of ['assets/ck-concept-math-v141.js','assets/ck-concept-lab-v141.js',
  'assets/ck-theory-models-v142.js','assets/ck-theory-v142.js',
  'assets/ck-study-charts-v79.js','assets/ck-pen-input-v60.js','sw.js',
  'scripts/audit-p6b-source-gates-v142.cjs']){
  new vm.Script(read(path),{filename:path});
 }
});
