'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),
 fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const html=read('index.html'),nav=read('assets/ck-navigation-v5.js'),
 css=read('experience-v13.css'),sw=read('sw.js');
test('landscape has no ivory note or marketing cue',()=>{
 assert.doesNotMatch(nav,/한 문제씩, 매일\.|SCROLL TO EXPLORE|<aside class="ck4-note"/);
 assert.match(nav,/section\.replaceChildren\(\)/);
 assert.match(css,/#ck4-cover \.ck4-note/);
});
test('tab headings omit decorative explanations and long copy',()=>{
 assert.match(html,/function titleBlock\(title,subtitle='',label='FIRST EXAM \/ STUDY',extra=''\) \{return /);
 assert.ok(html.includes('<div class="page-intro"><h1>'));
 assert.doesNotMatch(html,/<div class="page-intro"><div><div class="eyebrow">/);
 assert.doesNotMatch(html,/<span class="ticket-line">VISUAL RECALL/);
 assert.doesNotMatch(html,/<span class="ticket-line">QUESTION → CORRECT ANSWER/);
});
test('all three AI native links live on the center divider',()=>{
 const start=html.indexOf('class="ck6-center-rail"'),end=html.indexOf('<div class="board-content ck-v7-content">',start);
 assert.ok(start>0&&end>start);
 const center=html.slice(start,end);
 assert.match(center,/data-ck-v7-resize/);assert.match(center,/data-ck6-swap/);
 assert.match(center,/ck13-ai-rail/);
 for(const id of ['chatgpt','gemini','claude'])assert.match(center,new RegExp('data-ck10-ai="'+id+'" href="https://'));
 assert.equal((html.match(/data-ck10-ai="/g)||[]).length,3);
 assert.match(css,/ck13-ai-rail img/);assert.match(css,/width:19px!important/);
});
test('dark typing uses chalk-white graded letters and transparent input',()=>{
 assert.match(css,/ck-v3-unit\.ck-v3-right/);assert.match(css,/#f5fff4!important/);
 assert.match(css,/ck-v3-unit\.ck-v3-pending/);assert.match(css,/#b7d3cc!important/);
 assert.match(css,/color:transparent!important;-webkit-text-fill-color:transparent!important/);
 assert.match(css,/ck-v3-caret/);
});
test('colored card edges are overridden by ambient-lit borderless glass',()=>{
 assert.match(css,/--ck13-halo/);assert.match(css,/quick-grid > \.quick-card:nth-child\(1\)/);
 assert.match(css,/border:0!important;border-top:0!important;border-left:0!important/);
 assert.match(css,/backdrop-filter:blur\(19px\)/);
});
test('all inline JS parses, stylesheet is last and cache is fresh',()=>{
 assert.match(html,/experience-v13\.css/);assert.match(sw,/conceptknot-study-v13/);
 assert.match(sw,/experience-v13\.css/);
 for(const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(match[1]);
 new vm.Script(nav);
});
