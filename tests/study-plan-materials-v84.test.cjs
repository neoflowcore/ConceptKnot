'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('v84 scripts parse and reference the same study shell',()=>{
 const html=read('index.html');
 for(const file of ['ck-study-plan-v84.js','ck-study-materials-v84.js']){
  assert.ok(html.includes(file+'?v=84'));new vm.Script(read('assets/'+file));
 }
 assert.ok(html.includes('ck-study-tools-v84.css?v=84'));
 for(const key of ['ck84-study-plan-v1','ck84-personal-materials-v1'])assert.ok(html.includes(key));
 assert.match(html,/CK84Plan\?\.sanitize/);
 assert.match(html,/CK84Materials\?\.sanitize/);
});
test('offline shell and no automated CI workflow',()=>{
 assert.match(read('sw.js'),/conceptknot-study-v84-materials-plan/);
 assert.equal(JSON.parse(read('vercel.json')).git.deploymentEnabled,false);
 assert.equal(fs.existsSync(path.join(__dirname,'..','.github','workflows')),false);
});
