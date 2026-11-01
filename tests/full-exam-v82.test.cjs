'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('integrated exam assets are wired and parse',()=>{
 const html=read('index.html'),js=read('assets/ck-full-exam-v82.js');
 assert.ok(html.includes('ck-full-exam-v82.js?v=82'));
 assert.ok(html.includes('ck-full-exam-v82.css?v=82'));
 assert.match(js,/DURATION=100\*60\*1000/);
 assert.match(js,/HISTORY_LIMIT=20/);
 assert.match(js,/gradeAttempt/);
 assert.match(js,/checkExpiry/);
 assert.match(js,/saveActive/);
 new vm.Script(js);
});
test('exam grader does not change source keys or CI settings',()=>{
 const js=read('assets/ck-full-exam-v82.js');
 assert.match(js,/correct\.map\(Number\)\.includes\(value\)/);
 assert.match(js,/estate>=40&&civil>=40&&average>=60/);
 assert.equal(JSON.parse(read('vercel.json')).git.deploymentEnabled,false);
 assert.equal(fs.existsSync(path.join(root,'.github','workflows')),false);
 assert.match(read('sw.js'),/conceptknot-study-v82-full-exam/);
});
