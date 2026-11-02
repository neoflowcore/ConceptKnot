'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=p=>fs.readFileSync(path.resolve(__dirname,'..',p),'utf8');
function boot(bank,loader){
 const window={RECALL_OFFICIAL:bank,addEventListener(){},CK89OfficialBank:loader};
 const document={addEventListener(){},getElementById(){return null}};
 vm.runInNewContext(read('assets/ck-data-diagnostics-v88.js'),{window,document});
 return window.CK88Diagnostics;
}
test('full official bank has 800 structurally registered questions without implying legal review',()=>{
 const data=['data/official-2016-2020.json','data/official-2021-2025.json']
  .flatMap(f=>JSON.parse(read(f)));
 const bank=Object.fromEntries(data.map(x=>[x.id,x])),v=boot(bank).bankQuality();
 assert.equal(v.total,800);assert.equal(v.structured,800);
 assert.equal(v.visualReviewed+v.visualUnreviewed+v.visualUnknown,800);
});
test('low text similarity lists even visually marked records for a second look',()=>{
 const data=JSON.parse(read('data/official-2021-2025.json'));
 const bank=Object.fromEntries(data.map(x=>[x.id,x]));
 const q=boot(bank).visualQueue({year:2025,mode:'low-text',limit:80});
 assert.ok(q.length>0);
 assert.ok(q.some(x=>x.id==='2025-7'&&x.visualReviewed&&x.lowTextSimilarity));
 assert.ok(q.every(x=>x.lowTextSimilarity&&x.year===2025));
});
test('visual review queue leaves completed questions out of the unreviewed filter',()=>{
 const data=JSON.parse(read('data/official-2021-2025.json'));
 const q=boot(Object.fromEntries(data.map(x=>[x.id,x])))
  .visualQueue({year:2025,mode:'unreviewed',limit:80});
 assert.ok(q.length>0);assert.ok(q.every(x=>!x.visualReviewed));
});
test('older bank loads once despite quick year switches',async()=>{
 let done,fetches=0,bank={};
 const engine={loadYear:()=>{fetches++;return new Promise(resolve=>{
  done=()=>{for(let y=2016;y<=2020;y++)bank[y+'-1']={verified:true};resolve(true)};
 })}};
 const app=boot(bank,engine),a=app.loadOlderYear(2016),b=app.loadOlderYear(2019);
 for(let i=0;i<5;i++)await Promise.resolve();
 assert.ok(done);done();
 assert.deepEqual(await Promise.all([a,b]),[true,true]);assert.equal(fetches,1);
});
