'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('v109 due-voice bridge uses real due queue and deduplicates',()=>{
 const html=read('index.html');
 assert.match(html,/function ck109ReadDue\(/);
 assert.match(html,/CK86ExamBridge/);
 assert.match(html,/seen\.has\(id\)/);
 assert.match(html,/playDue:ck109ReadDue/);
 assert.match(html,/data-ck109-due/);
 assert.match(read('assets/ck-study-p4-v78.js'),/data-ck109-due/);
 assert.match(read('sw.js'),/conceptknot-study-v109-due-tts-bridge/);
});
test('v109 source preserves manual-only deployment',()=>{
 assert.equal(JSON.parse(read('vercel.json')).git.deploymentEnabled,false);
 for(const m of read('index.html').matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
 new vm.Script(read('assets/ck-study-p4-v78.js'));
});