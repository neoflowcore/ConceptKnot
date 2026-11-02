'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('v86 source parses and is integrated',()=>{
 for(const p of ['assets/ck-data-integrity-v86.js','assets/ck-exam-bridge-v86.js','assets/ck-full-exam-v82.js','assets/ck-study-review-v79.js'])new vm.Script(read(p));
 const html=read('index.html');
 assert.ok(html.includes('ck-data-integrity-v86.js?v=86'));
 assert.ok(html.includes('ck-exam-bridge-v86.js?v=86'));
 assert.match(html,/CK86Integrity\.stage/);assert.match(html,/CK86Integrity\.apply/);
 assert.match(read('assets/ck-study-review-v79.js'),/CK86ExamBridge\?\.pending/);
});
test('no builds or automated deployment',()=>{
 assert.match(read('sw.js'),/conceptknot-study-v86-restore-bridge/);
 assert.equal(JSON.parse(read('vercel.json')).git.deploymentEnabled,false);
 assert.equal(fs.existsSync(path.join(__dirname,'..','.github','workflows')),false);
});
