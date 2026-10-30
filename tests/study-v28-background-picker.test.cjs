'use strict';
/* Manual, no-build checks for the ConceptKnot background selector. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
function boot(saved){
 const props={},memory=new Map([['conceptknot-display-v17',JSON.stringify(saved||{})]]);
 const doc={documentElement:{style:{setProperty:(k,v)=>props[k]=v}},readyState:'loading',addEventListener(){}};
 const win={addEventListener(){}};
 vm.runInNewContext(read('assets/ck-display-v17.js'),{document:doc,window:win,localStorage:{getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)},requestAnimationFrame(){},console});
 return {props,state:win.CK17Display.getState(),memory};
}
test('original study background and the five existing controls are preserved',()=>{
 const {props,state}=boot({});
 assert.equal(state.preset,'forest');
 assert.equal(props['--ck17-study-background'],'#244651');
 assert.equal(props['--ck17-study-background-dark'],'#0C2630');
 assert.equal(props['--ck17-bg-saturation'],'1');
 assert.equal(props['--ck17-bg-brightness'],'1');
 assert.equal(props['--ck17-bg-hue'],'0deg');
 assert.equal(props['--ck17-brightness'],'1');
 assert.equal(props['--ck17-contrast'],'1');
});
test('saved presets, HEX normalization and malformed-input fallback work',()=>{
 assert.equal(boot({backgroundPreset:'lime'}).props['--ck17-study-background'],'#C5D7AC');
 assert.equal(boot({backgroundPreset:'wood'}).props['--ck17-study-background'],'#A58A73');
 assert.equal(boot({backgroundPreset:'custom',backgroundCustom:'#abc'}).props['--ck17-study-background'],'#AABBCC');
 assert.equal(boot({backgroundPreset:'custom',backgroundCustom:'not-a-color'}).props['--ck17-study-background'],'#AFC4B2');
 assert.equal(boot({backgroundPreset:'__proto__'}).state.preset,'forest');
 const values=boot({saturation:0,backgroundPreset:'wood'}).props;
 assert.notEqual(values['--ck17-study-background'],'#A58A73');
 const legacy=boot({saturation:999,brightness:20,hue:-500,contrast:'bad'}).props;
 assert.equal(legacy['--ck17-bg-saturation'],'1.5');
 assert.equal(legacy['--ck17-brightness'],'0.5');
 assert.equal(legacy['--ck17-bg-hue'],'-180deg');
 assert.equal(legacy['--ck17-contrast'],'1');
});
test('background change is scoped; brand and palette markup are present',()=>{
 const html=read('index.html'),css=read('experience-v26.css'),js=read('assets/ck-display-v17.js');
 assert.match(html,/<span class="ck-brand-wordmark">Concept<b>Knot<\/b><\/span>/);
 assert.match(css,/\.ck-brand-wordmark b\{color:#E35A3F!important/);
 for(const label of ['현재 녹색','파스텔 연두','우드 브라운','사용자 지정'])assert.ok(js.includes(label));
 assert.match(js,/data-background-toggle/);
 assert.match(js,/type="color" name="backgroundCustomPicker"/);
 assert.match(js,/type="text" name="backgroundCustomHex"/);
 const newCss=css.slice(css.indexOf('/* v28:'),css.indexOf('/* v29'));
 assert.match(newCss,/html body:not\(\[data-ck-v8-tab="landing"\]\)/);
 assert.doesNotMatch(newCss,/\.ck-v7-content|\.ck-v7-board/);
 assert.match(read('sw.js'),/conceptknot-study-v38/);
});

test('new scene defaults migrate stock settings and preserve custom adjustments',()=>{
 const stock=boot({saturation:72,backgroundBrightness:92});
 assert.equal(stock.props['--ck17-bg-saturation'],'1');
 assert.equal(stock.props['--ck17-bg-brightness'],'1');
 const custom=boot({saturation:87,backgroundBrightness:96});
 assert.equal(custom.props['--ck17-bg-saturation'],'0.87');
 assert.equal(custom.props['--ck17-bg-brightness'],'0.96');
});
