'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const dir=path.resolve(__dirname,'..');const read=p=>fs.readFileSync(path.join(dir,p),'utf8');
const j=p=>JSON.parse(read(p));
test('official 400 explanation slots match unchanged source',()=>{
 const src=j('data/official-2021-2025.json'),map=new Map(src.map(x=>[x.id,x]));
 assert.equal(src.length,400);
 let total=0,drafts=0,compounds=0,seedReasons=0,candidates=0;
 for(const year of [2025,2024,2023,2022,2021]){
  const x=j('data/explanations/official-'+year+'.json');assert.equal(x.records.length,80);
  for(const r of x.records){
   const q=map.get(r.questionId);assert.ok(q);
   assert.deepEqual(r.officialAnswer,q.correct);
   assert.equal(r.options.length,5);assert.equal(r.quality.optionVerdictsReviewed,0);
   assert.notEqual(r.quality.status,'published');total++;
   if(r.quality.status==='draft')drafts++;
   compounds+=r.compoundStatements.length;
   seedReasons+=r.options.filter(x=>x.draftReason).length;
   if(r.candidateConcepts.length)candidates++;
  }
 }
 assert.equal(total,400);assert.equal(drafts,4);assert.equal(seedReasons,20);
 assert.ok(compounds>0);assert.ok(candidates>300);
});
test('review dashboard separates candidate terms from published content',()=>{
 const r=j('data/reports/analysis-candidates-v78.json');
 assert.equal(r.reviewStages.unstarted,396);assert.equal(r.reviewStages.draft,4);
 assert.equal(r.reviewStages.published,0);
 assert.equal(r.verifiedOptionVerdicts,0);
 assert.equal(r.requiredOptionVerdicts,2000);
 assert.equal(j('data/concept-taxonomy-v1.json').concepts.length,40);
});
test('P4 modal uses source-bound exam keys without auto-promoting rationales',()=>{
 const js=read('assets/ck-study-p4-v78.js');
 assert.match(js,/q\.correct\.includes\(i\+1\)/);
 assert.match(js,/채점 인정과 진위 판단/);
 assert.match(js,/data-ck78-note-save/);
 assert.match(js,/CK78Study\?\.saveNote/);
 assert.match(js,/data-ck78-review-report/);
 assert.match(js,/draftReason/);
 new vm.Script(js);
});
test('P2 through P6 remain wired without automatic build',()=>{
 const html=read('index.html');
 assert.match(html,/window\.CK76Voice=Object\.freeze/);
 assert.match(html,/window\.CK76Study=Object\.freeze/);
 assert.match(html,/window\.CK78Study=Object\.freeze/);
 assert.match(html,/ck-study-p4-v78\.js\?v=78/);
 assert.match(html,/ck-study-p6-v76\.js\?v=76/);
 assert.match(read('sw.js'),/conceptknot-study-v78-p2-p6-analysis/);
 assert.equal(j('vercel.json').git.deploymentEnabled,false);
 assert.equal(fs.existsSync(path.join(dir,'.github','workflows')),false);
 for(const x of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(x[1]);
});
