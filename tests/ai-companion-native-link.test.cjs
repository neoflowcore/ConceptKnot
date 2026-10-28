const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const script=fs.readFileSync(path.join(root,'assets/ck-study-extensions-v10.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'experience-v10.css'),'utf8');
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
test('LexLoom-style native provider anchors, safe targets and icon labels',()=>{
 for(const [id,url] of [['chatgpt','https://chatgpt.com/'],['gemini','https://gemini.google.com/app'],['claude','https://claude.ai/new']]){
  assert.ok(html.includes('<a data-ck10-ai="'+id+'" href="'+url+'" target="_blank" rel="noopener noreferrer"'),id);
  assert.ok(css.includes('.ck10-ai-launch a[data-ck10-ai]'));
 }
 assert.doesNotMatch(html,/<button\b[^>]*data-ck10-ai=/);
 assert.ok(html.includes('ck-study-extensions-v10.js'));
});
test('native modifiers never intercepted and no document-wide simulated split',()=>{
 assert.doesNotMatch(script,/document\.addEventListener\('mousedown',e=>\{\s*if\(e\.button!==0\|\|!e\.ctrlKey\|\|!e\.altKey/);
 assert.match(script,/if\(a\.tagName==='A'\)return/);
 assert.match(script,/if\(e\.button!==0\|\|e\.ctrlKey\|\|e\.altKey\|\|e\.metaKey\|\|e\.shiftKey\|\|window\.innerWidth<720\)return/);
 assert.match(script,/if\(externalAI\(icon\.dataset\.ck10Ai\)\)\{e\.preventDefault\(\);e\.stopImmediatePropagation\(\)\}/);
 assert.doesNotMatch(script,/chrome\.tabs|dispatchEvent\(new MouseEvent|<iframe/);
});
test('popup right third and multi-monitor geometry copied from LexLoom',()=>{
 const start=script.indexOf('function companionWindowFeatures(screen){');
 const end=script.indexOf('\nfunction externalAI(id){',start);
 assert.ok(start>=0&&end>start);
 const factory=vm.runInNewContext('('+script.slice(start,end)+')');
 let opts=factory({availWidth:1920,availHeight:1040,availLeft:0,availTop:40});
 assert.match(opts,/width=640/);assert.match(opts,/height=1040/);
 assert.match(opts,/left=1280/);assert.match(opts,/top=40/);
 assert.match(opts,/resizable=yes,scrollbars=yes/);
 opts=factory({availWidth:900,availHeight:700,availLeft:-900,availTop:0});
 assert.match(opts,/width=400/);assert.match(opts,/left=-400/);
 opts=factory({availWidth:300,availHeight:250,availLeft:0,availTop:0});
 assert.match(opts,/width=300/);assert.match(opts,/left=0/);
});
test('script syntax and cache revision are valid',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(sw,/conceptknot-study-v16/);
 assert.match(html,/conceptknot-garden-flow-v16/);
});
