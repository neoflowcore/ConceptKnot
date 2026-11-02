'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{test}=require('node:test');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('integrity-patched modules parse',()=>{
 for(const p of ['assets/ck-full-exam-v82.js','assets/ck-study-links-v83.js','assets/ck-study-plan-v84.js','assets/ck-study-materials-v84.js'])
  new vm.Script(read(p));
});
test('nullable answers, optimistic revision, preserved concept filters',()=>{
 const exam=read('assets/ck-full-exam-v82.js'),links=read('assets/ck-study-links-v83.js');
 assert.match(exam,/value===null\?null:Number\(value\)/);
 assert.match(exam,/latest\.revision!==state\.revision/);
 assert.match(exam,/storageIssue/);
 assert.match(links,/unsavedChoices/);
 assert.match(links,/chosenFor\(id\)/);
});
test('study planner session settings and material input retained',()=>{
 assert.match(read('assets/ck-study-plan-v84.js'),/sessionCount=Math\.max/);
 assert.match(read('assets/ck-study-materials-v84.js'),/unsavedNote/);
 assert.match(read('sw.js'),/conceptknot-study-v85-integrity-fixes/);
 assert.equal(JSON.parse(read('vercel.json')).git.deploymentEnabled,false);
 assert.equal(fs.existsSync(path.join(__dirname,'..','.github','workflows')),false);
});
