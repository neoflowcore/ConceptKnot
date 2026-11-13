/* v140 - bundled read-only cache and release safety assertions.
 * Not device/offline proof; tests source consistency and no CI artifacts.
 */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const sw=read('sw.js'),diag=read('assets/ck-data-diagnostics-v88.js'),
 html=read('index.html'),config=JSON.parse(read('vercel.json'));
function quotedValues(code,pattern){
 const m=code.match(pattern);assert.ok(m,'missing cache list');
 return [...m[1].matchAll(/'(\.\/[^']+)'/g)].map(x=>x[1]);
}
test('v140 core cache and diagnostic report the same 11 exact URLs',()=>{
 const a=quotedValues(sw,/const CRITICAL=\[([\s\S]*?)\];/);
 const b=quotedValues(diag,/const OFFLINE_MINIMUM=Object\.freeze\(\[([\s\S]*?)\]\);/);
 assert.equal(a.length,11);assert.deepEqual(a,b);
 assert.match(sw,/conceptknot-study-v165-2024-estate-160-option-notes/);
 assert.match(diag,/conceptknot-study-v165-2024-estate-160-option-notes/);
 assert.ok(a.includes('./assets/ck-full-exam-v82.js?v=157'));
 assert.ok(a.includes('./assets/ck-data-diagnostics-v88.js?v=157'));
});
test('new official/mixed review scripts receive v140 cache identities across HTML and worker',()=>{
 for(const k of ['ck-full-exam-v82.js?v=157','ck-mixed-review-v131.js?v=140',
  'ck-data-diagnostics-v88.js?v=157']){
  assert.ok(html.includes(k),'missing HTML '+k);
  assert.ok(sw.includes(k),'missing SW '+k);
 }
 assert.ok(diag.includes('ck-mixed-review-v131.js?v=140'));
});
test('no model weights forced into PWA essential cache; user records untouched',()=>{
 const essential=sw.match(/const CRITICAL=\[([\s\S]*?)\];/)[1];
 assert.doesNotMatch(essential,/models\/tts\/supertonic-3\/|ck-managed-tts/);
 assert.match(sw,/const MODEL_CACHE='ck-managed-tts-'/);
 assert.equal(config.git.deploymentEnabled,false);
 for(const name of ['ck82-exam-sessions-v1','ck129-mixed-sessions-v1']){
  assert.ok(read('assets/ck-mixed-review-v131.js').includes(name));
 }
});
test('new scripts and HTML inline modules parse without executing app code',()=>{
 for(const file of ['sw.js','assets/ck-mixed-review-v131.js','assets/ck-full-exam-v82.js',
  'assets/ck-data-diagnostics-v88.js','scripts/build-explanation-review-packets-v140.cjs'])new vm.Script(read(file));
 for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))
  if(m[1].trim())new vm.Script(m[1]);
});
