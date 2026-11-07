'use strict';
/* Manual-only integration guards. For standalone 11-case controller suite, see development checkpoint. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('v138 factory script precedes inline app and CK76Voice remains published',()=>{
 const html=read('index.html');
 assert.ok(html.indexOf('ck-voice-controller-v138.js?v=138')<html.indexOf('/* RECALLGRAPH First-Exam Sprint.'));
 assert.match(html,/const ck138Voice=ck138VoiceFactory\?\.create/);
 assert.match(html,/window\.CK76Voice=Object\.freeze/);
 assert.match(html,/if\(!options\.__ck107Official\)ck108Playlist=null/);
 assert.match(html,/ck108Progress\(i\)/);
 for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))if(m[1].trim())new vm.Script(m[1]);
});
test('new controller parses and exposes a per-generation, non-skipping queue',()=>{
 const src=read('assets/ck-voice-controller-v138.js'),ctx={};
 vm.runInNewContext(src,{window:ctx});
 assert.equal(ctx.CKVoiceControllerFactory.version,'138');
 assert.match(src,/text-too-long/);
 assert.match(src,/end-without-start/);
 assert.match(src,/onComplete\?\./);
 assert.match(src,/own !== generation/);
 assert.match(src,/start-timeout/);
});
test('Supertonic playback sends onAudioStart only after source.start',()=>{
 const s=read('neural-tts.mjs');
 assert.match(s,/onAudioStart=null/);
 assert.match(s,/source\.start\(\);if\(version===stopVersion/);
});
test('SW caches new module while preserving existing app data and manual deploy policy',()=>{
 const sw=read('sw.js'),html=read('index.html'),diag=read('assets/ck-data-diagnostics-v88.js');
 assert.match(sw,/conceptknot-study-v138-unified-voice-queue/);
 assert.match(diag,/conceptknot-study-v138-unified-voice-queue/);
 assert.ok(sw.includes("./assets/ck-voice-controller-v138.js?v=138"));
 assert.ok(html.includes("officialAudioEntry"));
 assert.equal(JSON.parse(read('vercel.json')).git.deploymentEnabled,false);
});
