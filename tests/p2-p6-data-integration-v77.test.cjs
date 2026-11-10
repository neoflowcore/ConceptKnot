'use strict';
/* P2-P6 static integration checks; run manually in final consolidated local test. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const j=p=>JSON.parse(read(p));
test('all official 400 remain unchanged and explanation records are 80 per year',()=>{
 const bank=j('data/official-2021-2025.json'),originals=new Map(bank.map(q=>[q.id,q]));
 assert.equal(bank.length,400);
 let drafts=0,published=0,slots=0,specials=0;
 for(const year of [2025,2024,2023,2022,2021]){
  const file=j('data/explanations/official-'+year+'.json');
  assert.equal(file.records.length,80);
  for(const row of file.records){
   const original=originals.get(row.questionId);
   assert.ok(original,row.questionId);
   assert.deepEqual(row.officialAnswer,original.correct);
   assert.equal(row.options.length,5);
   assert.equal(row.quality.answerKeyChecked,Boolean(original.checks?.answerPdfChecked));
   assert.notEqual(row.quality.status,'published');
   if(row.specialAnswer!=='normal')specials++;
   if(row.quality.status==='draft')drafts++;
   if(row.quality.status==='published')published++;
   slots+=row.options.length;
  }
 }
 assert.equal(drafts,80);assert.equal(published,0);assert.equal(slots,2000);assert.equal(specials,7);
 const report=j('data/reports/recent-five-coverage.json');
 assert.equal(report.optionVerdictsReviewed,0);
 assert.equal(report.publishedCount,0);
 assert.equal(report.totalQuestions,400);
});
test('P2 native and neural sessions are cancellation-aware and preserve explicit choice',()=>{
 const html=read('index.html');
 assert.match(html,/window\.CK76Voice=Object\.freeze/);
 assert.match(html,/function officialAudioEntry/);
 assert.match(html,/special:all\?'allAccepted'/);
 assert.match(html,/voiceTogglePause\(\);return;/);
 assert.match(html,/ck76Voice\.token\+\+/);
 assert.match(html,/AI 여성 음성 선택됨 · 준비 버튼/);
 assert.doesNotMatch(html,/if\(id==='tts-engine'\)\{[^}]+loadNeural\(\)/);
});
test('P6 search index only uses registered bank; no network or personal uploads',()=>{
 const asset=read('assets/ck-study-p6-v76.js');
 assert.match(asset,/Object\.values\(window\.RECALL_OFFICIAL/);
 assert.match(asset,/q\.verified===true/);
 assert.match(asset,/CK76Study\?\.openQuestion/);
 assert.doesNotMatch(asset,/fetch\s*\(|XMLHttpRequest|sendBeacon/);
 assert.match(asset,/data-ck76-chart-scrub/);
 assert.match(asset,/ck76-note-profile/);
 assert.match(read('index.html'),/ck-study-p6-v76\.js\?v=76/);
 new vm.Script(asset);
});
test('design and deployment policy remain stable',()=>{
 const v=j('vercel.json');
 assert.equal(v.git.deploymentEnabled,false);
 assert.equal(fs.existsSync(path.join(root,'.github','workflows')),false);
 assert.match(read('sw.js'),/conceptknot-study-v151-p4-source-locked-study-drafts/);
 const html=read('index.html');
 for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
});
