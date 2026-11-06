/* ConceptKnot v120 — opt-in per-page OCR drafts; local-only test suite.
 * Manual command after checkout: node --test tests/v120-ocr-page-queue.test.cjs
 * Not registered as GitHub Actions or an artifact build.
 */
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const source=()=>read('assets/ck-ocr-v118.js');
function slice(start,stop){
 const src=source(),a=src.indexOf(start),b=src.indexOf(stop,a+start.length);
 assert.ok(a>=0&&b>a,'code slice '+start);return src.slice(a,b);
}
const id1='a'.repeat(32),id2='b'.repeat(32);
const item=(id=id1,text='확인하지 않은 개인 선지 ①')=>({
 id,source:'PDF 2025년 2쪽',documentKey:'ck15-ink:v118:2025:sha256:'+'a'.repeat(64),
 text,updatedAt:Date.now()-5000
});
function validator(){
 const code=slice('function sanitizePageStore(value){','function readPageStore(){');
 return new Function('PAGE_MAX','PAGE_TEXT_MAX','PAGE_STORE_LIMIT',code+'return sanitizePageStore;')(90,45000,1500000);
}
test('strict page-queue schema preserves source, SHA-256 and entire manual text',()=>{
 const v=validator(),raw={schemaVersion:1,revision:4,items:[item()]};
 const valid=v(raw);assert.equal(valid?.items[0].text,raw.items[0].text);
 assert.equal(valid.items[0].documentKey,raw.items[0].documentKey);
 assert.equal(valid.revision,4);
 assert.equal(v({...raw,items:[item(),item()]}),null);
 assert.equal(v({...raw,items:[item(id1,'x'.repeat(45001))]}),null);
 assert.equal(v({...raw,items:[item(id2),{...item(),updatedAt:Date.now()+2*86400000}]}),null);
 assert.equal(v({...raw,items:[{...item(),text:''}]}),null);
 assert.equal(v({...raw,items:Array.from({length:91},(_,i)=>item(i.toString(16).padStart(32,'0')))}),null);
 assert.equal(v({...raw,items:[{...item(),documentKey:'x'.repeat(201)}]}),null);
});
function storageFixture(raw=null){
 const db=new Map();if(raw!==null)db.set('pages',raw);
 const storage={
  getItem:key=>db.has(key)?db.get(key):null,
  setItem:(key,value)=>db.set(key,value)
 };
 const notices=[];
 const functions=slice('function emptyPageStore(){','function draftPageKey(source){');
 const harness=new Function('localStorage','PAGE_KEY','PAGE_MAX','PAGE_TEXT_MAX','PAGE_STORE_LIMIT','status','renderPageQueue',
  'let pageRaw=null,pageIssue="";let pageStore;'+functions+
  'pageStore=readPageStore();return {read:readPageStore,commit:commitPageStore,raw:()=>pageRaw,issue:()=>pageIssue,store:()=>pageStore};');
 const state=harness(storage,'pages',90,45000,1500000,m=>notices.push(m),()=>{});
 return {state,storage,db,notices};
}
test('read invalid queue never deletes the raw bytes',()=>{
 const raw='{"schemaVersion":1,"items":INVALID';
 const f=storageFixture(raw);
 assert.equal(f.state.store().items.length,0);
 assert.ok(f.state.issue().includes('보관함을 읽지'));
 assert.equal(f.db.get('pages'),raw);
 assert.equal(f.state.commit({schemaVersion:1,revision:1,items:[]}),false);
 assert.equal(f.db.get('pages'),raw);
});
test('cross-tab change rejects stale edits and keeps concurrent saved text',()=>{
 const f=storageFixture();
 assert.equal(f.state.commit({schemaVersion:1,revision:1,items:[item()]}),true);
 const concurrent=JSON.stringify({schemaVersion:1,revision:2,items:[item(id2,'다른 탭 수정본')]});
 f.storage.setItem('pages',concurrent);
 assert.equal(f.state.commit({schemaVersion:1,revision:2,items:[]}),false);
 assert.equal(f.db.get('pages'),concurrent);
 assert.ok(f.state.issue().includes('다른 브라우저 탭'));
});
test('queue full blocks user page save and does not overwrite oldest page',()=>{
 const src=slice('function archiveCurrentPage(){','function openArchivedPage(');
 const pages={schemaVersion:1,revision:90,items:Array.from({length:90},(_,i)=>item(i.toString(16).padStart(32,'0')))};
 let writes=0,last='';
 const panel={isConnected:true,dataset:{ck118Source:'PDF 2025년 3쪽'},
  querySelector:()=>({value:'OCR 본문'})};
 const archive=new Function('panel','pageStore','PAGE_TEXT_MAX','PAGE_MAX','status','safeSource','draft','draftPageKey','commitPageStore','window',
  src+'return archiveCurrentPage;')(panel,pages,45000,90,m=>last=m,s=>s,{source:''},()=>'',()=>{writes++;return true},{crypto:{randomUUID:()=>id1}});
 assert.equal(archive(),false);assert.equal(writes,0);assert.ok(last.includes('90건'));
});
test('deletion requires explicit confirmation and preserves queue on cancel',()=>{
 const src=slice('function deleteArchivedPage(id){','function downloadPageText(){');
 const pages={schemaVersion:1,revision:1,items:[item()]};
 let writes=0,accepted=false;
 const del=new Function('pageStore','window','commitPageStore','status',
  src+'return deleteArchivedPage;')(pages,{confirm:()=>accepted},()=>{writes++;return true},()=>{});
 assert.equal(del(id1),false);assert.equal(writes,0);
 accepted=true;assert.equal(del(id1),true);assert.equal(writes,1);
 assert.equal(pages.items.length,1,'data not mutated before commit');
});
test('rendered queue text remains textContent, not unsafe HTML',()=>{
 const s=source();
 const rendering=slice('function renderPageQueue(){','function exportTxt(){');
 assert.match(rendering,/title\.textContent=entry\.source/);
 assert.match(rendering,/holder\.replaceChildren\(\)/);
 assert.doesNotMatch(rendering,/innerHTML/);
 assert.match(s,/data-ck120-open/);
 assert.match(s,/data-ck120-delete/);
 assert.match(s,/data-ck120-save/);
});
test('OCR page archive is added to guarded global JSON backup and restore',()=>{
 const integrity=read('assets/ck-data-integrity-v86.js');
 const html=read('index.html');
 const sandbox={window:{CK118OCR:{sanitizePageStore:validator()}}};
 vm.runInNewContext(integrity,sandbox);
 const data={schemaVersion:1,revision:1,items:[item()]};
 assert.equal(sandbox.window.CK86Integrity.validateExtra('ck120-ocr-page-drafts-v1',JSON.stringify(data)),true);
 assert.equal(sandbox.window.CK86Integrity.validateExtra('ck120-ocr-page-drafts-v1',JSON.stringify({...data,revision:-1})),false);
 assert.match(html,/ck120-ocr-page-drafts-v1/);
 assert.match(html,/ck120-ocr-page-drafts-v1'\)\{/);
});
test('v120 assets are cached and release still requires manual deployment',()=>{
 const sw=read('sw.js'),html=read('index.html'),config=JSON.parse(read('vercel.json'));
 assert.match(sw,/conceptknot-study-v127-integrity-guarded-offline/);
 for(const file of ['ck-ocr-v118.js?v=127','ck-ocr-v118.css?v=120','ck-data-integrity-v86.js?v=120']){
  assert.ok(html.includes(file),'HTML missing '+file);
  assert.equal(sw.split(file).length-1,file.startsWith('ck-data-integrity')?3:2,
   'ASSETS/HOT/required offline core must include '+file);
 }
 assert.ok(html.includes('ck-manual-qa-v115.js?v=127'),'HTML loads the current QA version');
 assert.equal(sw.split('ck-manual-qa-v115.js?v=127').length-1,3,
  'current cache must contain the updated QA asset in both lists');
 assert.match(sw,/ignoreSearch:true/);
 assert.equal(config.git.deploymentEnabled,false);
 assert.equal(fs.existsSync(path.join(__dirname,'..','.github','workflows')),false);
});
test('loading a prior PDF draft retains its original SHA-256 identity',()=>{
 const s=slice('function openArchivedPage(id){','function deleteArchivedPage(id){');
 const original=item(),pages={schemaVersion:1,revision:1,items:[original]};
 const panel={isConnected:true,dataset:{ck120DocKey:'CURRENT_OTHER_PDF'},
  querySelector:()=>({value:''})};
 const open=new Function('pageStore','panel','window','setText','status',s+
  'return openArchivedPage;')(pages,panel,{confirm:()=>true},
  ()=>{panel.dataset.ck120DocKey='CURRENT_OTHER_PDF'},()=>{});
 assert.equal(open(original.id),true);
 assert.equal(panel.dataset.ck120DocKey,original.documentKey);
 assert.equal(panel.dataset.ck120Selected,original.id);
 assert.match(source(),/documentKey:String\(panel\.dataset\.ck120DocKey/);
});
test('old local OCR draft sanitizer remains separate and unchanged',()=>{
 const s=source();
 assert.match(s,/const KEY='ck118-personal-ocr-draft-v1',PAGE_KEY='ck120-ocr-page-drafts-v1'/);
 assert.match(s,/window\.CK118OCR=Object\.freeze/);
 assert.match(s,/sanitize,sanitizePageStore,parseOptions/);
 assert.match(s,/공식 800문항·정답·선지 판단·해설을 자동 변경하지 않습니다/);
});
