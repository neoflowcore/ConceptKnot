'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('header fixed right cluster has independent sibling structure',()=>{
 const nav=read('assets/ck-navigation-v5.js'),css=read('assets/ck-dot-landing-v57.css');
 assert.match(nav,/date\.parentElement!==bar\)bar\.append\(date\)/);
 assert.doesNotMatch(nav,/pill\.append\(date\)/);
 assert.match(css,/ck105-anchored-tools > \.ck-v7-date-pill/);
 assert.match(css,/flex:1 1 0%!important/);
});
test('10-year personal audit rows preserve official bank and sanitize CSV cells',()=>{
 const q={id:'2025-1',year:2025,number:1,subject:'estate',verified:true,correct:[1,3],options:['A','B','C','D','E'],question:'Q',checks:{primaryText:{score:.78}}};
 const w={RECALL_OFFICIAL:{'2025-1':q},CK83Links:{getRecords:()=>({'2025-1':{conceptIds:[],optionNotes:{1:{assessment:'true',reason:'r',source:'pdf'}}}})},addEventListener(){}};
 const doc={addEventListener(){},getElementById(){return null}};
 vm.runInNewContext(read('assets/ck-data-diagnostics-v88.js'),{window:w,document:doc,Date});
 const api=w.CK88Diagnostics,rows=api.reviewRows();
 assert.equal(rows.length,1);assert.equal(rows[0].special,'복수정답 인정');
 assert.equal(rows[0].low,true);assert.equal(rows[0].sourced,1);
 assert.equal(api.reviewMatrix(rows).length,10);
 assert.equal(api.csvCell('=1+1'),'"\\'=1+1"');
 assert.match(api.makeReviewCsv(rows),/내 출처 수/);
 assert.deepEqual(q.correct,[1,3]);
});
test('export never emits incomplete registered bank or invokes automatic Actions',()=>{
 const code=read('assets/ck-data-diagnostics-v88.js');
 assert.match(code,/quality\.total!==800\|\|quality\.structured!==800\|\|rows\.length!==800/);
 assert.match(read('sw.js'),/conceptknot-study-v105-nav-and-source-review/);
 assert.equal(JSON.parse(read('vercel.json')).git.deploymentEnabled,false);
});
