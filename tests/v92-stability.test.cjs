'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=p=>fs.readFileSync(path.resolve(__dirname,'..',p),'utf8');
test('v92 modules compile and no automated build workflows',()=>{
 for(const file of ['ck-study-materials-v84.js','ck-study-review-v79.js','ck-data-diagnostics-v88.js'])new vm.Script(read('assets/'+file));
 new vm.Script(read('sw.js'));
 assert.equal(JSON.parse(read('vercel.json')).git.deploymentEnabled,false);
 assert.equal(fs.existsSync(path.resolve(__dirname,'..','.github/workflows')),false);
});
test('OCR uses five-choice disambiguation and preserves unsaved text after cancellation',()=>{
 const source=read('assets/ck-study-materials-v84.js');
 assert.match(source,/q\.options\.every\(Boolean\)/);
 assert.match(source,/선지 번호 중복/);
 assert.match(source,/if\(cancel\)throw Error/);
 assert.match(source,/병합 후 자료 수 또는 저장 용량 제한 초과/);
});
test('diagnostics accepts two-digit item IDs and latest scoring supersedes old mistake',()=>{
 const inspect=read('assets/ck-data-diagnostics-v88.js');
 assert.ok(inspect.includes('[1-7]\\d|80'));
 assert.ok(!inspect.includes('[1-7]\\\\d|80'));
 const review=read('assets/ck-study-review-v79.js');
 assert.match(review,/const latest=new Map/);
 assert.match(review,/last\?\.correct&&last\.at/);
});
test('offline install commits essential shell without all-or-nothing optional cache',()=>{
 const sw=read('sw.js');
 assert.match(sw,/conceptknot-study-v92-stability/);
 assert.match(sw,/Promise\.allSettled\(optional\.map/);
 assert.match(sw,/cache\.addAll\(essential\)/);
});