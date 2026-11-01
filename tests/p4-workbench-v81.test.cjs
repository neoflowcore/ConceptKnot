'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('v81 workbench is wired and syntactically valid',()=>{
 const html=read('index.html'),js=read('assets/ck-study-workbench-v81.js'),css=read('assets/ck-study-workbench-v81.css');
 assert.ok(html.includes('ck-study-workbench-v81.js?v=81'));
 assert.ok(html.includes('ck-study-workbench-v81.css?v=81'));
 assert.match(js,/ck81-review-workbench-v1/);assert.match(js,/CK79Study/);assert.match(js,/CK78Analysis/);
 assert.match(js,/sanitizeProgress/);assert.match(js,/personal-unpublished-workbench/);assert.match(js,/encodeCsvCell/);
 assert.match(css,/ck81-matrix/);new vm.Script(js);
});
test('no automated builds and existing official inputs untouched',()=>{
 assert.equal(fs.existsSync(path.join(root,'.github','workflows')),false);
 assert.equal(JSON.parse(read('vercel.json')).git.deploymentEnabled,false);
 assert.match(read('sw.js'),/conceptknot-study-v81-workbench/);
 assert.match(read('sw.js'),/ck-study-workbench-v81.js/);
});
