/* v128 focused safety checks for personal study materials.
 * node --test tests/v128-materials-data-guards.test.cjs
 * No CI, user-data mutation, browser hardware or deployment.
 */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const original=fs.readFileSync(path.join(__dirname,'../assets/ck-study-materials-v84.js'),'utf8');
const KEY='ck84-personal-materials-v1';
const blank=()=>({schemaVersion:1,scope:'personal-unpublished-materials',revision:1,documents:[]});
const row=()=>({id:'m12345678',title:'기출 메모',text:'개인 교재 필기',note:'',
 kind:'manual',pages:1,officialRef:'',createdAt:0,updatedAt:1});
function fixture(data=blank(),inject=false){
 const saved=new Map([[KEY,JSON.stringify(data)]]),events={},clicks=[];
 const storage={getItem:k=>saved.get(k)??null,setItem:(k,v)=>saved.set(k,v)};
 const win={addEventListener(){},RECALL_OFFICIAL:{}};
 const document={readyState:'loading',addEventListener:(name,fn)=>{events[name]=fn},
  getElementById:()=>null,createElement:()=>({click:()=>clicks.push(true),remove(){}}),
  body:{appendChild(){}}};
 const URL={createObjectURL:()=> 'blob:local',revokeObjectURL(){}};
 const code=inject?original.replace('window.CK84Materials=Object.freeze({',
  'window.__materialProbe={write,setRoot:value=>{root=value}};window.CK84Materials=Object.freeze({'):original;
 vm.runInNewContext(code,{window:win,document,localStorage:storage,URL,
  Blob:class{},setTimeout:()=>0,requestAnimationFrame:()=>0});
 return {api:win.CK84Materials,probe:win.__materialProbe,saved,storage,clicks,events};
}
test('fresh profile opens materials without fabricating documents',()=>{
 const f=fixture();
 assert.equal(f.api.getState().documents,0);
 assert.equal(f.api.getState().storageIssue,'');
});
test('saved personal materials export from a stable clean snapshot',()=>{
 const f=fixture({...blank(),documents:[row()]});
 assert.equal(f.api.download(),true);
 assert.equal(f.clicks.length,1);
});
test('same revision, changed materials content cannot be silently exported',()=>{
 const f=fixture();
 f.saved.set(KEY,JSON.stringify({...blank(),documents:[row()]}));
 assert.equal(f.api.download(),false);
 assert.equal(f.clicks.length,0);
 assert.equal(JSON.parse(f.saved.get(KEY)).documents.length,1);
});
test('same revision, changed content is rejected during another tab write',()=>{
 const f=fixture(blank(),true);
 f.saved.set(KEY,JSON.stringify({...blank(),documents:[row()]}));
 assert.equal(f.probe.write({...blank(),documents:[]}),false);
 assert.equal(JSON.parse(f.saved.get(KEY)).documents.length,1);
});
test('corrupt JSON refuses export without erasing original bytes',()=>{
 const f=fixture({...blank(),documents:[row()]});
 f.saved.set(KEY,'{BROKEN-RAW');
 assert.equal(f.api.download(),false);
 assert.equal(f.clicks.length,0);
 assert.equal(f.saved.get(KEY),'{BROKEN-RAW');
});
test('unsaved new editor text refuses a truncated JSON backup',()=>{
 const f=fixture(blank(),true);
 f.probe.setRoot({querySelector:sel=>sel==='[data-ck84-mat-title]'?{value:'작성 중'}:{value:''}});
 assert.equal(f.api.download(),false);
 assert.equal(f.clicks.length,0);
});
test('script linked as versioned v128 and not automatically deployed',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),
 sw=fs.readFileSync(path.join(__dirname,'../sw.js'),'utf8'),
 vc=JSON.parse(fs.readFileSync(path.join(__dirname,'../vercel.json'),'utf8'));
 assert.match(html,/ck-study-materials-v84\.js\?v=128/);
 assert.match(sw,/ck-study-materials-v84\.js\?v=128/);
 assert.equal(vc.git.deploymentEnabled,false);
 assert.equal(fs.existsSync(path.join(__dirname,'../.github/workflows')),false);
 new vm.Script(original);
});
