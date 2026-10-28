'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const base=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(base,p),'utf8');
const html=read('index.html'),nav=read('assets/ck-navigation-v5.js');
const tool=read('assets/ck-pdf-workspace-v15.js'),caret=read('assets/ck-experience-v14.js');
const css=read('experience-v15.css'),sw=read('sw.js');
test('pomodoro marketing caption fully removed',()=>{
 assert.doesNotMatch(caret,/집중 완료 후 휴식으로 전환됩니다\. 시작은 직접 선택하세요/);
 assert.match(caret,/ck14-pomo-ring/);
});
test('chalk newline caret inserts layout probe after line break, not zero-size newline range',()=>{
 assert.match(caret,/range\.setStartAfter\(glyph\)/);
 assert.match(caret,/glyph\.textContent==='\\n'/);
 assert.match(caret,/range\.insertNode\(probe\)/);
 assert.match(caret,/chosen\?\.normalize\(\)/);
 assert.match(css,/\.chalk-mirror \.chalk-letter/);
 assert.match(css,/font:inherit!important;letter-spacing:inherit!important/);
});
test('dark theme covers visual scenes, quiz question text, stats, buttons, PDF and OMR',()=>{
 assert.match(css,/\.memory-tile svg/);
 assert.match(css,/\.ck-v7-question-body p/);
 assert.match(css,/\.ck-v7-options li/);
 assert.match(css,/\.ck-v7-stat strong/);
 assert.match(css,/\.bubble-opt/);
 assert.match(css,/\.ck15-pdf-tools button/);
 assert.match(css,/html\[data-ck-theme="dark"\]/);
});
test('new Gaussian sheet rise replaces legacy stage crossfade and reveal',()=>{
 assert.match(html,/ck16-reveal/);
 assert.match(read('experience-v16.css'),/ck16-sheet-rise/);
 assert.match(read('experience-v16.css'),/blur\(19px\)/);
 assert.match(read('experience-v16.css'),/\.52s/);
 assert.doesNotMatch(nav,/main\.classList\.add\('ck4-changing'\)/);
 assert.match(nav,/if\(id==='landing'\)/);
});
test('exam OMR follows registered question without duplicate freehand pad',()=>{
 const a=html.indexOf('function renderExam(){'),b=html.indexOf('function examScore(',a);
 const segment=html.slice(a,b);
 assert.ok(segment.includes('class="ck15-pdf-host"'));
 assert.ok(segment.includes('data-ck15-ink-canvas'));
 assert.ok(segment.includes('data-ck15-save'));
 assert.ok(segment.includes('data-ck15-pdf-year'));
 assert.ok(segment.includes('data-ck15-zoom'));
 assert.doesNotMatch(segment,/inkPad\(/);
 assert.match(segment,/\$\{officialInlineHtml\(yr,n\)\}<div class="panel-head">/);
});
test('PDF.js page raster + responsive normalized ink, gestures, fallback & PDF download',()=>{
 assert.match(tool,/pdfjs-dist@6\.3\.289/);
 assert.match(tool,/lib\.getDocument\(\{data:new Uint8Array\(bytes\)\}\)/);
 assert.match(tool,/pdfPage\.render\(\{canvasContext:ctx,viewport,transform\}\)/);
 assert.match(tool,/getCoalescedEvents/);
 assert.match(tool,/event\.pointerType==='pen'/);
 assert.match(tool,/s\.touchPoints\.size>=2/);
 assert.match(tool,/onPointerDown/);
 assert.match(tool,/detail>=2/);
 assert.match(tool,/applyZoom\(s,s\.gesture\.initial\*Math\.exp\(delta\)/);
 assert.match(tool,/PDFLIB_URL/);
 assert.match(tool,/dest\.drawImage\(png/);
 assert.match(tool,/localStorage\.setItem\(s\.annotationKey/);
 assert.match(tool,/fallback\(s,'직접 필기/);
});
test('PDF gestures never trigger mobile tab wheel or global exam hotkeys',()=>{
 assert.match(nav,/\.ck15-pdf-host/);
 assert.match(html,/textarea,select,\.ck15-pdf-host/);
});
test('pointer hit testing uses actual page coordinates',()=>{
 const start=tool.indexOf('function hitTest('),end=tool.indexOf('\nfunction onPointerDown(',start);
 const fn=vm.runInNewContext('('+tool.slice(start,end)+')');
 const box={width:1000,height:1200};
 assert.equal(fn({points:[[.5,.5,.5]]},.503,.501,box),true);
 assert.equal(fn({points:[[.5,.5,.5]]},.9,.9,box),false);
});
test('all dynamic code parses, cache resources are current',()=>{
 for(const [i,m] of [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].entries())new vm.Script(m[1],{filename:'inline'+i});
 new vm.Script(nav);new vm.Script(tool);new vm.Script(caret);
 assert.match(sw,/conceptknot-study-v16/);
 assert.match(sw,/experience-v15\.css/);
 assert.match(sw,/ck-pdf-workspace-v15\.js/);
 assert.match(read('vercel.json'),/"deploymentEnabled": false/);
});
