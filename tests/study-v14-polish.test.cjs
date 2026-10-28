'use strict';
/* Manual local test only; no CI / build artifact. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('index.html'),css=read('experience-v14.css'),js=read('assets/ck-experience-v14.js'),sw=read('sw.js');
const inline=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
test('core and v14 scripts parse, no package/CI automation',()=>{
 assert.ok(inline.length>=5);
 inline.forEach((m,i)=>new vm.Script(m[1],{filename:'inline'+i}));
 new vm.Script(js);
 assert.match(read('vercel.json'),/"deploymentEnabled": false/);
 assert.match(sw,/conceptknot-study-v16/);
 assert.match(sw,/experience-v14.css/);assert.match(sw,/ck-experience-v14.js/);
});
test('ribbon is 80% height, larger tab text, brand matches tab type size',()=>{
 assert.match(css,/--ck5-nav-height:53px/);
 assert.match(css,/min-height:53px!important;height:53px!important/);
 assert.match(css,/font-size:clamp\(11px,calc\(\.77vw \+ 1px\),13px\)!important/);
 assert.match(css,/\.ck-v7-nav-pill\.ck4-unified \.ck-v7-logo/);
 const row=html.slice(html.indexOf('<div class="ck-v7-date-pill">'),html.indexOf('</div></header>',html.indexOf('<div class="ck-v7-date-pill">')));
 assert.ok(row.indexOf('ck14-pomo-launch')<row.indexOf('ck14-theme-toggle'));
 assert.ok(row.indexOf('ck14-theme-toggle')<row.indexOf('<span>▦'));
});
test('board mirrored text shares font metrics and uses measured caret',()=>{
 assert.match(css,/font-size:var\(--ck10-chalk-font,18px\)!important/);
 assert.match(css,/line-height:1\.65!important/);
 assert.match(css,/font-kerning:none!important/);
 assert.match(css,/padding:10px!important/);
 assert.match(css,/ck14-mirror-caret-on/);
 assert.match(js,/document\.createRange\(\)/);
 assert.match(js,/textarea\.selectionStart/);
 assert.match(js,/querySelectorAll\('\.chalk-letter'\)/);
 assert.match(js,/scheduleCaret\(\)/);
 assert.match(js,/document\.fonts\?\.ready/);
});
test('typing is translucent and three starter cards have differentiated ambient halos',()=>{
 assert.match(css,/rgba\(8,27,32,\.78\)/);
 assert.match(css,/backdrop-filter:blur\(14px\)/);
 assert.match(css,/\.quick-grid > \.quick-card:nth-child\(1\)\{--ck14-card-halo:rgba\(246,113,111,\.56\)/);
 assert.match(css,/\.quick-grid > \.quick-card:nth-child\(2\)\{--ck14-card-halo:rgba\(151,119,250,\.56\)/);
 assert.match(css,/\.quick-grid > \.quick-card:nth-child\(3\)\{--ck14-card-halo:rgba\(61,187,167,\.59\)/);
 assert.match(css,/0 0 21px -5px var\(--ck14-card-halo\)/);
});
test('night mode persists locally and content transition is motion-safe',()=>{
 assert.match(js,/localStorage\.getItem\(themeKey\)/);
 assert.match(js,/root\.dataset\.ckTheme=mode/);
 assert.match(css,/html\[data-ck-theme="dark"\]/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(html,/ck16-reveal/);
 assert.match(css,/::view-transition-old\(ck14-workspace\)/);
 assert.match(css,/::view-transition-new\(ck14-workspace\)/);
});
test('Pomodoro focus-to-break-to-focus, presets, totals and deadline persistence',()=>{
 const src=html.slice(html.indexOf('function timerLeft(){'),html.indexOf('function importKeys(text)'));
 assert.ok(src.length>1500&&src.length<12500,'timer code extract');
 const state={pomodoroPhase:'focus',pomodoroFocusSeconds:1500,pomodoroBreakSeconds:300,timerRemaining:1500,timerRunning:false,timerEnd:0,pomodoros:0,dailyTotals:{}};
 const events=[];
 const window={dispatchEvent:event=>events.push(event.detail)};
 const context={state,window,Date,Math,Number,String,Object,save:()=>true,render:()=>{},toast:()=>{},todayISO:()=> '2026-10-29',
 CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail}},
 $:()=>null};
 vm.runInNewContext(src,context);
 const pomo=window.CKPomo;
 assert.equal(pomo.snapshot().remaining,1500);
 pomo.configure('focus',30);assert.equal(pomo.snapshot().focusMinutes,30);
 pomo.configure('focus',25);
 pomo.toggle();assert.equal(pomo.snapshot().running,true);
 state.timerEnd=Date.now()-1000;
 vm.runInNewContext('timerTick()',context);
 assert.equal(pomo.snapshot().phase,'break');
 assert.equal(pomo.snapshot().remaining,300);
 assert.equal(state.pomodoros,1);assert.equal(state.dailyTotals['2026-10-29'],1);
 pomo.toggle();state.timerEnd=Date.now()-1000;
 vm.runInNewContext('timerTick()',context);
 assert.equal(pomo.snapshot().phase,'focus');assert.equal(state.pomodoros,1);
 assert.equal(events.length,2);
 pomo.skip();assert.equal(pomo.snapshot().phase,'break');
 assert.equal(state.pomodoros,1,'skip must not count as completed');
});
