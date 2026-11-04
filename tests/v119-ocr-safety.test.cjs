/* ConceptKnot v119: OCR cancellation and mobile memory safety.
 * Manual-only: node --test tests/v119-ocr-safety.test.cjs
 */
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=()=>fs.readFileSync(path.join(__dirname,'..','assets','ck-ocr-v118.js'),'utf8');
function between(a,b){
 const text=source(),x=text.indexOf(a),y=text.indexOf(b,x+a.length);
 assert.ok(x>=0&&y>x,a);return text.slice(x,y);
}
test('large JPEG is downsampled in browser to bounded OCR canvas',async()=>{
 const drawing=[],closed=[];
 const fn=new Function('validImage','createImageBitmap','MAX_SOURCE_PIXELS','MAX_OCR_PIXELS','document',
  between('async function prepareImage(file){','async function recognize(kind,file){')+
  'return prepareImage')(()=>true,async()=>({width:5000,height:4000,close:()=>closed.push(true)}),
  24000000,3000000,{createElement:()=>({width:0,height:0,
   getContext:()=>({drawImage:(...a)=>drawing.push(a)})})});
 const c=await fn({size:300000,name:'study.jpg',type:'image/jpeg'});
 assert.ok(c.width<=1800);assert.ok(c.height<=2200);
 assert.ok(c.width*c.height<=3000000);
 assert.equal(drawing.length,1);assert.equal(closed.length,1);
});
test('source over 24 megapixels rejected and bitmap memory released',async()=>{
 let closed=0;const fn=new Function('validImage','createImageBitmap','MAX_SOURCE_PIXELS','MAX_OCR_PIXELS','document',
  between('async function prepareImage(file){','async function recognize(kind,file){')+
  'return prepareImage')(()=>true,async()=>({width:8000,height:6000,close:()=>closed++}),
  24000000,3000000,{createElement:()=>({getContext:()=>({drawImage(){}})})});
 await assert.rejects(()=>fn({size:1000000,name:'oversize.png',type:'image/png'}),/2,400만 화소/);
 assert.equal(closed,1);
});
test('cancelled job makes UI available and terminates active worker',()=>{
 const code=between("function cancel(reason='OCR 중단'){","function validImage(file){");
 let run=2,working=true,terminated=0,enabled=false;
 const canceller=new Function('state','buttons','status',code.replace(/jobId/g,'state.jobId').replace(/worker/g,'state.worker').replace(/working/g,'state.working')+
  "return cancel;")({jobId:run,working,worker:{terminate:()=>{terminated++}}},
  disabled=>{enabled=disabled===false},()=>{});
 assert.equal(canceller(),3);assert.equal(terminated,1);assert.equal(enabled,true);
 const src=source(),find=src.indexOf('currentWorker=await lib.createWorker');
 assert.ok(find>0);
 const check=src.indexOf('if(run!==jobId||self!==panel||scope!==host)return false;',find);
 const assign=src.indexOf('worker=currentWorker;',find);
 assert.ok(check>find&&assign>check,'stale worker must not overwrite current worker');
 assert.doesNotMatch(src,/else if\(!worker\)\{\s*working=false/);
});
test('versioned code is linked once in HTML, twice in service worker asset lists',()=>{
 const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
 const sw=fs.readFileSync(path.join(__dirname,'..','sw.js'),'utf8');
 assert.match(html,/ck-ocr-v118\.js\?v=120/);
 assert.equal((sw.match(/ck-ocr-v118\.js\?v=120/g)||[]).length,2);
 assert.match(sw,/conceptknot-study-v121-structure-evidence/);
 assert.match(source(),/createWorker\(\['kor','eng'\]/);
});
