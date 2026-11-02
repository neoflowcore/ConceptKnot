'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('v89 ten-year bank is wired and all scripts parse',()=>{
 assert.match(read('index.html'),/ck-official-bank-v89.js\?v=89/);
 for(const file of ['ck-official-bank-v89.js','ck-full-exam-v82.js','ck-study-links-v83.js','ck-study-analytics-v83.js'])new vm.Script(read('assets/'+file));
 assert.match(read('sw.js'),/conceptknot-study-v89-ten-year/);
 assert.match(read('sw.js'),/official-2016-2020.json/);
});
test('static bank validates 400 older records',()=>{
 const q=JSON.parse(read('data/official-2016-2020.json'));
 assert.equal(q.length,400);
 for(const year of [2016,2017,2018,2019,2020])
  assert.equal(q.filter(x=>x.year===year).length,80);
 assert.equal(new Set(q.map(x=>x.id)).size,400);
 assert.equal(JSON.parse(read('vercel.json')).git.deploymentEnabled,false);
 assert.equal(fs.existsSync(path.join(root,'.github','workflows')),false);
});
