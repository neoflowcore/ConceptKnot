const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
test('question, A–E statements and response combinations are distinct and escaped',()=>{
 const ctx={esc:s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;')};vm.createContext(ctx);
 vm.runInContext(html.slice(html.indexOf('function quizPromptHtml'),html.indexOf('function renderQuiz')),ctx);
 const out=ctx.quizPromptHtml({q:'옳은 것은?\n\n보기 A. <지문>\n\n보기 B. 두번째',originalOptions:['<지문>','두번째']});
 assert.match(out,/aria-label="문제"/);assert.match(out,/aria-label="보기"/);
 assert.equal((out.match(/&lt;지문>/g)||[]).length,1);
 assert.ok(out.indexOf('</h2>')<out.indexOf('&lt;지문>'));
 assert.doesNotMatch(ctx.quizPromptHtml({q:'일반 문제'}),/ck26-statements/);
 for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))if(m[1].trim())new vm.Script(m[1]);
});
