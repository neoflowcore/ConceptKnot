'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('v88 scripts parse and have diagnostics',()=>{
 for(const p of ['ck-study-editor-v80.js','ck-study-workbench-v81.js','ck-study-links-v83.js','ck-study-plan-v84.js','ck-data-diagnostics-v88.js'])new vm.Script(read('assets/'+p));
 assert.match(read('index.html'),/ck-data-diagnostics-v88.js\?v=88/);
});
test('corruption and stale writes are blocked in editors',()=>{
 for(const p of ['ck-study-editor-v80.js','ck-study-workbench-v81.js','ck-study-links-v83.js','ck-study-plan-v84.js']){
  const s=read('assets/'+p);
  assert.match(s,/storageIssue/);
  assert.match(s,/lastRaw/);
 }
 assert.match(read('sw.js'),/conceptknot-study-v88-local-safety/);
 assert.equal(JSON.parse(read('vercel.json')).git.deploymentEnabled,false);
 assert.equal(fs.existsSync(path.join(__dirname,'..','.github','workflows')),false);
});
