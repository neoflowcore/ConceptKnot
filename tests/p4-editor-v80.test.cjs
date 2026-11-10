'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),parse=p=>JSON.parse(read(p));
test('P4 80 draft explanations and original answers remain unmodified',()=>{
 const map=new Map(parse('data/official-2021-2025.json').map(q=>[q.id,q]));
 let drafts=0,slots=0,published=0;
 for(const year of [2021,2022,2023,2024,2025]){
  const records=parse('data/explanations/official-'+year+'.json').records;assert.equal(records.length,80);
  for(const row of records){
   assert.deepEqual(row.officialAnswer,map.get(row.questionId)?.correct);
   slots+=row.options.length;if(row.quality.status==='draft')drafts++;
   if(row.quality.status==='published')published++;
   assert.equal(row.quality.optionVerdictsReviewed,0);
  }
 }
 assert.equal(drafts,240);assert.equal(slots,2000);assert.equal(published,0);
 const report=parse('data/reports/recent-five-coverage.json');
 assert.equal(report.draftCount,240);assert.equal(report.unstartedCount,160);
});
test('P4 editorial desk is safely scoped and loaded into existing modal',()=>{
 const modal=read('assets/ck-study-p4-v78.js');
 const desk=read('assets/ck-study-editor-v80.js');
 assert.match(modal,/data-ck80-workspace/);
 assert.match(desk,/ck80-explain-drafts-v1/);
 assert.match(desk,/personal-unpublished-2021-2025/);
 assert.match(desk,/published:false/);
 assert.match(desk,/MAX_RECORDS=800/);
 assert.doesNotMatch(desk,/fetch\(.+method\s*:\s*['"]POST/);
 new vm.Script(desk);new vm.Script(modal);
});
test('owl landing search forwards to existing study index',()=>{
 const js=read('assets/ck-study-p6-v76.js');
 assert.match(js,/ck-dot-search-placeholder/);
 assert.match(js,/ck76-search-query/);
 new vm.Script(js);
});
test('no CI, deployment or artifact creation',()=>{
 assert.equal(parse('vercel.json').git.deploymentEnabled,false);
 assert.equal(fs.existsSync(path.join(root,'.github','workflows')),false);
 assert.match(read('sw.js'),/conceptknot-study-v152-p4-160-new-study-drafts/);
 const html=read('index.html');
 assert.match(html,/ck-study-editor-v80.js\?v=127/);
 for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
});
