'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('v87 changed scripts parse and integrate',()=>{
 for(const x of ['ck-exam-bridge-v86.js','ck-study-analytics-v83.js','ck-study-materials-v84.js'])new vm.Script(read('assets/'+x));
 assert.match(read('sw.js'),/conceptknot-study-v87-record-safety/);
 assert.match(read('assets/ck-exam-bridge-v86.js'),/latest=new Map/);
 assert.match(read('assets/ck-study-analytics-v83.js'),/correct\.map\(Number\)\.includes\(answer\)/);
 assert.match(read('assets/ck-study-materials-v84.js'),/storageIssue/);
});
test('manual deployment remains off',()=>{
 assert.equal(JSON.parse(read('vercel.json')).git.deploymentEnabled,false);
 assert.equal(fs.existsSync(path.join(__dirname,'..','.github','workflows')),false);
});
