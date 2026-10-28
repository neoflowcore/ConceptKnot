const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const base=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(base,p),'utf8');
function pdfApi(){
 const document={readyState:'loading',addEventListener(){}},window={};
 const code=read('assets/ck-pdf-workspace-v15.js').replace('window.CKPDF15=Object.freeze({','window.__test={act,goPage,strokes,persist,restore,pageMetrics};window.CKPDF15=Object.freeze({');
 const memory=new Map();
 vm.runInNewContext(code,{document,window,localStorage:{getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)},setTimeout,clearTimeout,Map,URL,Blob,console});
 return window.__test;
}
test('spread navigation advances pairs and keeps odd final page reachable',async()=>{
 const api=pdfApi(),removed=[];
 const s={pdf:{numPages:5},page:1,spread:true,host:{isConnected:false,querySelector(){return null},closest(){return null}},paintToken:0,second:{host:{remove(){removed.push(1)}}}};
 await api.goPage(s,3);assert.equal(s.page,3);assert.equal(s.second,null);assert.equal(removed.length,1);
 await api.goPage(s,5);assert.equal(s.page,5);
 await api.goPage(s,99);assert.equal(s.page,5);
 await api.goPage(s,0);assert.equal(s.page,1);
 s.spread=false;await api.goPage(s,2);assert.equal(s.page,2);
});
test('right-page annotations persist separately and restore under their original page',()=>{
 const api=pdfApi(),annotations=Object.create(null);
 const s={year:2025,page:1,annotations,annotationKey:'ck15-ink:2025:official',host:{querySelector(){return null}}};
 const right={...s,page:2};
 api.strokes(s).push({color:'#ff0000',width:2,points:[[.2,.4,.5]]});
 api.strokes(right).push({color:'#0000ff',width:3,points:[[.7,.8,.6]]});
 api.persist(right);
 const restored={year:2025};api.restore(restored);
 assert.equal(restored.annotations['1'][0].color,'#ff0000');
 assert.equal(restored.annotations['2'][0].color,'#0000ff');
});
test('comfort settings clamp saved values and retain distinct page and scenery filters',()=>{
 const memory=new Map([['conceptknot-display-v17',JSON.stringify({saturation:999,brightness:20,hue:-500,contrast:'bad'})]]),properties={};
 const document={documentElement:{style:{setProperty:(k,v)=>properties[k]=v}},readyState:'loading',addEventListener(){}};
 vm.runInNewContext(read('assets/ck-display-v17.js'),{document,window:{addEventListener(){}},localStorage:{getItem:k=>memory.get(k)},requestAnimationFrame(){},console});
 assert.equal(properties['--ck17-bg-saturation'],'1.5');
 assert.equal(properties['--ck17-brightness'],'0.5');
 assert.equal(properties['--ck17-bg-hue'],'-180deg');
 assert.equal(properties['--ck17-contrast'],'1');
});
test('new files and all inline application scripts parse',()=>{
 for(const file of ['assets/ck-display-v17.js','assets/ck-layout-v16.js','assets/ck-pdf-workspace-v15.js','sw.js'])new vm.Script(read(file));
 for(const m of read('index.html').matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
});
