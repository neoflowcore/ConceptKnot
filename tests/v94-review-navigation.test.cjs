'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const base=path.resolve(__dirname,'..'),read=name=>fs.readFileSync(path.join(base,name),'utf8');
test('v94 modules parse and preserve manual deployment',()=>{
 for(const file of ['assets/ck-study-links-v83.js','assets/ck-study-review-v79.js'])new vm.Script(read(file));
 assert.equal(JSON.parse(read('vercel.json')).git.deploymentEnabled,false);
 assert.equal(fs.existsSync(path.join(base,'.github','workflows')),false);
});
test('review links into five-option rationale and never writes official bank',()=>{
 const links=read('assets/ck-study-links-v83.js'),review=read('assets/ck-study-review-v79.js');
 assert.match(links,/function confirmDiscard/);
 assert.match(links,/storageConflict=true/);
 assert.match(links,/function openQuestion\(id\)/);
 assert.match(review,/data-ck79-edit/);
 assert.match(review,/CK83Links\?\.openQuestion/);
 assert.doesNotMatch(links,/RECALL_OFFICIAL\s*=/);
});
test('persisted personal notes and official scoring remain separate',()=>{
 const links=read('assets/ck-study-links-v83.js');
 assert.match(links,/personal-unpublished-concept-links/);
 assert.match(links,/optionNotes:collectOptionNotes/);
 assert.match(links,/assessments=new Set/);
});