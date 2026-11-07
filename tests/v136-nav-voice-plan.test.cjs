/* ConceptKnot v136: manual navigation and TTS plan assertions.
 * node --test tests/v136-nav-voice-plan.test.cjs
 * No CI, build, deployment or audio playback is launched by this test.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {test}=require('node:test'),assert=require('node:assert/strict');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const expected=['home','theory','visual','typing','reverse','quiz','calc','exam','venn','listen','wrong','plan','final'];
function names(source,label){
 const m=source.match(new RegExp('const '+label+'=\\[([\\s\\S]*?)\\];'));
 assert.ok(m,'Missing '+label+' list');
 return [...m[1].matchAll(/\['([^']+)','([^']+)'\]/g)].map(v=>[v[1],v[2]]);
}
test('visible nav shows 도형차트 followed immediately by 음성학습, preserving IDs',()=>{
 const html=read('index.html'),nav=names(html,'designNav');
 assert.deepEqual(nav.map(v=>v[0]),expected);
 assert.equal(nav[8][1],'도형차트');
 assert.equal(nav[9][1],'음성학습');
 assert.equal(nav.length,13);
 assert.match(html,/listen:'음성학습'/);
 assert.match(html,/venn:'도형차트'/);
});
test('mobile pager and Ctrl KeyTips use the same order as displayed tabs',()=>{
 const nav=names(read('assets/ck-navigation-v5.js'),'pages');
 const keys=names(read('assets/ck-shortcuts-v19.js'),'routes');
 assert.deepEqual(nav.map(v=>v[0]),['landing',...expected]);
 assert.deepEqual(keys.map(v=>v[0]),expected);
 assert.equal(keys[8][1],'도형차트');
 assert.equal(keys[9][1],'음성학습');
 for(const file of ['assets/ck-navigation-v5.js','assets/ck-shortcuts-v19.js']){
  new vm.Script(read(file),{filename:file});
 }
});
test('rendered JS links match v136 source and fresh service worker generation',()=>{
 const html=read('index.html'),sw=read('sw.js'),diag=read('assets/ck-data-diagnostics-v88.js');
 for(const asset of ['ck-navigation-v5.js?v=136','ck-shortcuts-v19.js?v=136','ck-data-diagnostics-v88.js?v=137']){
  assert.ok(html.includes(asset),'HTML missing '+asset);
  assert.ok(sw.includes(asset),'SW missing '+asset);
 }
 assert.match(sw,/conceptknot-study-v137-native-voice-guard/);
 assert.match(diag,/conceptknot-study-v137-native-voice-guard/);
 for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
});
test('written TTS redesign respects original data and states what is NOT yet implemented',()=>{
 const s=read('docs/V136_TTS_REBUILD_MASTER_PLAN.md');
 assert.match(s,/OpenRAIL-M/);
 assert.match(s,/380 MB/);
 assert.match(s,/음성학습/);
 assert.match(s,/여성 음성 준비/);
 assert.match(s,/RECALL_OFFICIAL/);
 assert.match(s,/기술적으로 불가능/);
 assert.match(s,/T1~T6는 계획 단계/);
 assert.match(read('neural-tts.mjs'),/huggingface\.co/);
 assert.equal(JSON.parse(read('vercel.json')).git.deploymentEnabled,false);
});
