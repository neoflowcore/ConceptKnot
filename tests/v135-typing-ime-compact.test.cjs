/* v135: static + pure IME input checks. Run manually, no CI or artifacts.
 * node --test tests/v135-typing-ime-compact.test.cjs
 */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const js=read('assets/ck-typing-layout-v31.js'),html=read('index.html');
test('HTML embeds exactly the current compositional typing engine',()=>{
 assert.equal(html.split(js).length-1,1);
 new vm.Script(js);
 for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
});
test('IME displays the changing syllable instead of freezing or counting it as an error',()=>{
 assert.doesNotMatch(js,/if\(area\.__ck31Composing\)return/);
 for(const marker of ['compositionstart','compositionupdate','compositionend',
  'insertCompositionText','scheduleCompositionPreview','ck62-composing','composingUnit','followNormalCaret']){
  assert.ok(js.includes(marker),marker);
 }
 assert.match(js,/if\(record\.text!==field\.value\)/);
 assert.match(js,/record\.colors=chalkReconcile/);
 assert.match(js,/lastComposition!==compositionId/);
 assert.match(js,/lastLaidOutText!==value/);
});
test('native IME selection maps UTF-16 offsets to completed NFC grapheme positions',()=>{
 const begin=js.indexOf('function composingRange('),end=js.indexOf('function locateLine(',begin);
 assert.ok(begin>0&&end>begin);
 const run=new Function('caretIndex','letters','chars',
  js.slice(begin,end)+'return composingRange;')(
  area=>Array.from(area.value.slice(0,area.selectionStart).normalize('NFC')).length,
  v=>Array.from(v.normalize('NFC')).filter(c=>/[\p{L}\p{M}\p{Nd}]/u.test(c)),
  v=>Array.from(v.normalize('NFC')));
 const area={value:'법',selectionStart:1,__ck31CompositionStart:0,__ck31Composing:true};
 assert.equal(JSON.stringify(run(area,'normal')),'{"start":0,"end":1}');
 area.value='ㄷ법';area.selectionStart=2;area.__ck31CompositionStart=1;
 assert.equal(JSON.stringify(run(area,'normal')),'{"start":1,"end":2}');
 assert.equal(run({...area,__ck31Composing:false},'normal'),null);
});
test('stats move beneath mode buttons while IDs, progress, per-mode drafts and local records remain intact',()=>{
 const css=read('assets/ck-typing-precision-v62.css');
 assert.match(html,/ck135-compact-stats/);
 assert.match(html,/html=html\.replace\(anchor,metrics\+anchor\)/);
 for(const id of ['ck-v7-stat-time','ck-v7-stat-cpm','ck-v7-stat-accuracy','ck-v7-stat-count','ck-v3-completion-text','ck62-progress'])
  assert.match(html,new RegExp(id));
 assert.match(css,/\.ck135-compact-stats/);
 assert.match(css,/\.ck62-follow-caret/);
 assert.match(css,/\.ck62-composing/);
 assert.match(js,/ckTypingDrafts/);
 assert.doesNotMatch(js,/localStorage\.(?:clear|removeItem)/);
});
test('cache URLs advance atomically without enabling Git automation or deployment',()=>{
 const sw=read('sw.js'),diag=read('assets/ck-data-diagnostics-v88.js');
 for(const name of ['conceptknot-study-v136-nav-voice-plan','ck-data-diagnostics-v88.js?v=136'])
  assert.ok(sw.includes(name)&&diag.includes(name),name);
 for(const name of ['ck-typing-layout-v31.js?v=135','ck-typing-precision-v62.css?v=135'])
  assert.ok(sw.includes(name)&&html.includes(name),name);
 assert.equal(JSON.parse(read('vercel.json')).git.deploymentEnabled,false);
});
