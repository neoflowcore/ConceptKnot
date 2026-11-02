'use strict';
const assert=require('node:assert/strict'),{test}=require('node:test'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
function evaluate(file,environment){
 const context=vm.createContext(environment);vm.runInContext(read('assets/'+file),context);return environment.window;
}
test('v90 static integration and source bank completeness',()=>{
 for(const f of ['ck-official-bank-v89.js','ck-full-exam-v82.js','ck-study-review-v79.js','ck-study-plan-v84.js','ck-data-integrity-v86.js','ck-data-diagnostics-v88.js'])
  new vm.Script(read('assets/'+f));
 const old=JSON.parse(read('data/official-2016-2020.json'));
 assert.equal(old.length,400);
 for(const y of [2016,2017,2018,2019,2020])assert.equal(old.filter(q=>q.year===y).length,80);
 assert.match(read('sw.js'),/conceptknot-study-v90-integration/);
 assert.equal(JSON.parse(read('vercel.json')).git.deploymentEnabled,false);
 assert.equal(fs.existsSync(path.join(root,'.github','workflows')),false);
});
test('v90 blocks provisional score, writes under malformed backup',()=>{
 assert.match(read('assets/ck-full-exam-v82.js'),/data-ck82-retry-bank/);
 assert.match(read('assets/ck-full-exam-v82.js'),/공식 문항 확인 중/);
 assert.match(read('assets/ck-full-exam-v82.js'),/event\.isComposing/);
 assert.match(read('assets/ck-data-integrity-v86.js'),/isObject\(template\)&&!isObject\(value\)/);
 assert.match(read('assets/ck-data-diagnostics-v88.js'),/9종 원본 백업/);
});
