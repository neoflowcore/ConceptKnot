'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=p=>fs.readFileSync(path.resolve(__dirname,'..',p),'utf8');
test('analysis voice controls use saved mode, rate and resume bookmark',()=>{
 const html=read('index.html'),p4=read('assets/ck-study-p4-v78.js');
 for(const s of ['getPreferences:()=>({engine:ttsSettings().engine','mode:ttsSettings().marathonMode','playDue:ck109ReadDue'])assert.ok(html.includes(s));
 for(const s of ['getPreferences?.().mode','ck107-voice-preference','bookmark.year','getDue?.()?.due'])assert.ok(p4.includes(s));
 assert.match(read('sw.js'),/conceptknot-study-v110-voice-preference-qa/);
});
test('scripts parse and automatic Git deployment is disabled',()=>{
 for(const match of read('index.html').matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(match[1]);
 new vm.Script(read('assets/ck-study-p4-v78.js'));
 assert.equal(JSON.parse(read('vercel.json')).git.deploymentEnabled,false);
});
