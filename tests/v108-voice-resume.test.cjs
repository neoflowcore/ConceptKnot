'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=p=>fs.readFileSync(path.resolve(__dirname,'..',p),'utf8');
test('v108 has per-question bookmark and explicit user resume',()=>{
 const h=read('index.html');
 for(const p of ['function ck108Bookmark()','function ck108Progress(index)','function ck108Finish()','function ck108Resume()','playOfficial:ck107ReadOfficial','resume:ck108Resume','data-ck108-resume','ck108Progress(index-1)','ck108Progress(i)'])assert.ok(h.includes(p),p);
 assert.match(h,/n===job\.lastNumber/);
 assert.match(read('assets/ck-study-p4-v78.js'),/data-ck107-voice-resume/);
 assert.match(read('sw.js'),/conceptknot-study-v108-tts-resume/);
});
test('v108 JS parses and never enables Git automatic Vercel deployment',()=>{
 for(const m of read('index.html').matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
 new vm.Script(read('assets/ck-study-p4-v78.js'));
 assert.equal(JSON.parse(read('vercel.json')).git.deploymentEnabled,false);
});