'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('generic JSON study backup carries both v81 and v82 extras',()=>{
 const html=read('index.html');
 const match=html.match(/const ck79ExtraKeys=Object\.freeze\(\[([^\]]+)\]\);/);
 assert.ok(match);
 for(const name of ['ck80-explain-drafts-v1','ck81-review-workbench-v1','ck82-exam-sessions-v1'])
  assert.ok(match[1].includes(name));
 assert.match(html,/CK81Workbench\?\.sanitizeProgress/);
 assert.match(html,/CK82FullExam\?\.cleanStore/);
 assert.match(read('sw.js'),/conceptknot-study-v82-full-exam-backup/);
});
