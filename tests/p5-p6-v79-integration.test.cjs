'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),json=p=>JSON.parse(read(p));
test('v79 syntax and HTML wiring',()=>{
 const html=read('index.html');
 for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
 for(const module of ['review','final','charts']){
  const name='assets/ck-study-'+module+'-v79.js';
  new vm.Script(read(name));
  assert.match(html,new RegExp('ck-study-'+module+'-v79\\\\.js\\\\?v=79'));
 }
});
test('original question bank and official answer coverage unchanged',()=>{
 const records=json('data/official-2021-2025.json');
 assert.equal(records.length,400);assert.equal(new Set(records.map(r=>r.id)).size,400);
 for(const r of records)assert.equal(r.options.length,5);
 for(const y of [2021,2022,2023,2024,2025]){
  const data=json('data/explanations/official-'+y+'.json');
  assert.equal(data.records.length,80);
  for(const e of data.records){
   const original=records.find(x=>x.id===e.questionId);
   assert.ok(original);assert.deepEqual(e.officialAnswer,original.correct);
   assert.notEqual(e.quality.status,'published');
  }
 }
});
test('review schedule and separate final notes are backed up',()=>{
 const html=read('index.html');
 assert.match(html,/ck79Recall:\{\}/);
 assert.match(html,/ck79ExamDate:''/);
 assert.match(html,/window.CK79Study=Object\.freeze/);
 assert.match(html,/ck79Backup\(\)/);
 assert.match(html,/ck79RestoreExtras\(data\)/);
 assert.match(html,/ck10-exam-final-v1/);
 assert.match(html,/function renderPlan\(\)/);
 assert.doesNotMatch(html,/new Date\('2026-10-31T00:00:00\+09:00'\)/);
});
test('one-shot diagram interaction and P6 linked search present',()=>{
 const t=read('assets/ck-study-charts-v79.js');
 assert.match(t,/pointerdown/);assert.match(t,/pointermove/);assert.match(t,/ArrowLeft/);
 assert.match(t,/CK76Search\?\.applyScrub/);
 assert.match(t,/원문의 정답을 그대로 적용하지 마세요/);
 assert.match(read('assets/ck-study-p6-v76.js'),/openQuestion/);
});
test('no actions workflow, no git deployment, no artifact builds',()=>{
 assert.equal(json('vercel.json').git.deploymentEnabled,false);
 assert.equal(fs.existsSync(path.join(root,'.github','workflows')),false);
 assert.match(read('sw.js'),/conceptknot-study-v80-explain-drafts/);
});
