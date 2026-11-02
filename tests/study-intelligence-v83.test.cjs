'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('v83 modules and integration are present and parse',()=>{
 const html=read('index.html');
 const names=['ck-study-recall-v83.js','ck-study-links-v83.js','ck-study-analytics-v83.js'];
 for(const name of names){assert.ok(html.includes(name+'?v=83'));new vm.Script(read('assets/'+name));}
 assert.ok(html.includes('ck-study-intelligence-v83.css?v=83'));
 assert.match(html,/ck83RecallEvents/);
 assert.match(html,/CK83Recall\?\.schedule/);
 assert.match(html,/CK83Links\?\.sanitize/);
 assert.match(read('assets/ck-full-exam-v82.js'),/getAttempts/);
});
test('v83 recall and official source boundaries remain explicit',()=>{
 const recall=read('assets/ck-study-recall-v83.js');
 assert.match(recall,/MAX_EVENTS=1200/);
 assert.match(recall,/Math\.min\(MAX_DAYS\*1440/);
 const links=read('assets/ck-study-links-v83.js');
 assert.match(links,/MAX=800/);
 assert.match(links,/personal-unpublished-concept-links/);
 const analysis=read('assets/ck-study-analytics-v83.js');
 assert.match(analysis,/weakConcepts/);
 assert.match(analysis,/CK82FullExam/);
});
test('no workflow or Vercel automatic build and versioned SW',()=>{
 assert.equal(fs.existsSync(path.join(root,'.github','workflows')),false);
 assert.equal(JSON.parse(read('vercel.json')).git.deploymentEnabled,false);
 assert.match(read('sw.js'),/conceptknot-study-v83-study-intelligence/);
});
