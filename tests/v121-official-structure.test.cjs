/* ConceptKnot v121 official question & explanation structural audit.
 * Manually run: node --test tests/v121-official-structure.test.cjs
 * Structural checks are NOT independent verification of official law or answer key.
 */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const parse=p=>JSON.parse(read(p));
function bank(){
 return parse('data/official-2016-2020.json').concat(parse('data/official-2021-2025.json'));
}
const options=[1,2,3,4,5];
test('800 registered questions have unique year-number IDs, 5 nonblank options, valid answer sets',()=>{
 const rows=bank(),ids=new Set(),years=new Map();
 assert.equal(rows.length,800);
 for(const q of rows){
  assert.ok(Number.isInteger(q.year)&&q.year>=2016&&q.year<=2025);
  assert.ok(Number.isInteger(q.number)&&q.number>=1&&q.number<=80);
  assert.equal(q.id,q.year+'-'+q.number);
  assert.ok(!ids.has(q.id),'duplicate official ID '+q.id);ids.add(q.id);
  assert.equal(q.subject,q.number<=40?'estate':'civil');
  assert.equal(q.verified,true);
  assert.ok(typeof q.question==='string'&&q.question.trim().length>=5);
  assert.ok(Array.isArray(q.options)&&q.options.length===5&&
    q.options.every(x=>typeof x==='string'&&x.trim()));
  assert.ok(Array.isArray(q.correct)&&q.correct.length>=1&&q.correct.length<=5);
  assert.equal(new Set(q.correct).size,q.correct.length);
  assert.ok(q.correct.every(x=>Number.isInteger(x)&&options.includes(x)));
  assert.ok(typeof q.originalUrl==='string'&&q.originalUrl.startsWith('https://'));
  const y=years.get(q.year)||{total:0,estate:0,civil:0};y.total++;y[q.subject]++;years.set(q.year,y);
 }
 assert.equal(years.size,10);
 for(let y=2016;y<=2025;y++)assert.deepEqual(years.get(y),{total:80,estate:40,civil:40});
});
test('all-accepted and multiple accepted answer-key records remain distinct',()=>{
 const list=bank(),all=list.filter(q=>q.correct.length===5).length;
 const multiple=list.filter(q=>q.correct.length>=2&&q.correct.length<=4).length;
 assert.equal(all,8);assert.equal(multiple,3);
 assert.equal(list.filter(q=>q.correct.length>1).length,all+multiple);
});
test('recent-year 400 explanation IDs and official-answer references match question bank',()=>{
 const official=new Map(bank().map(q=>[q.id,q])),ids=new Set();
 let count=0;
 for(let y=2021;y<=2025;y++){
  const source=parse('data/explanations/official-'+y+'.json');
  assert.equal(source.year,y);
  assert.equal(source.originalAnswersProtected,true);
  assert.ok(Array.isArray(source.records));assert.equal(source.records.length,80);
  for(const entry of source.records){
   const id=entry.questionId;count++;
   assert.ok(!ids.has(id),'duplicate explanation '+id);ids.add(id);
   const question=official.get(id);
   assert.ok(question,'missing official question '+id);
   assert.equal(entry.examYear,y);
   assert.equal(entry.number,question.number);
   assert.equal(entry.subject,question.subject);
   assert.deepEqual(entry.officialAnswer,question.correct);
   assert.equal(entry.options.length,5);
   assert.deepEqual(entry.options.map(x=>x.no),options);
  }
 }
 assert.equal(count,400);
});
test('published explanation records require proof of source, reason and 5 option verdicts',()=>{
 let total=0,submitted=0,unreviewed=0;
 for(let y=2021;y<=2025;y++)for(const item of parse('data/explanations/official-'+y+'.json').records){
  total++;const q=item.quality||{};
  if(q.status==='published'){
   submitted++;
   assert.equal(q.reasonReviewed,true,'reason review required');
   assert.equal(q.sourceChecked,true,'source review required');
   assert.equal(q.optionVerdictsReviewed,5,'all 5 options need review');
   assert.ok(item.options.every(x=>x.sourceChecked===true&&x.verdict!=='unreviewed'));
  }else{
   unreviewed++;
   assert.ok(['draft','unstarted'].includes(q.status),'unknown unapproved state');
  }
 }
 assert.equal(total,400);
 assert.equal(submitted+unreviewed,400);
});
test('diagnostic screen validates OCR page archives and labels distinct special answers',()=>{
 const src=read('assets/ck-data-diagnostics-v88.js');
 const start=src.indexOf('const items='),stop=src.indexOf('/* v105:',start);
 assert.ok(start>=0&&stop>start);
 const ocr={schemaVersion:1,revision:1,items:[{
  id:'1'.repeat(32),source:'PDF 2025년 1쪽',documentKey:'ck15-ink:v118:2025:sha256:'+'b'.repeat(64),
  text:'첫 번째 개인 OCR 페이지',updatedAt:Date.now()
 }]};
 const memories=new Map([['ck120-ocr-page-drafts-v1',JSON.stringify(ocr)]]);
 const inspect=new Function('window','localStorage',src.slice(start,stop)+'return inspect;')({
  CK118OCR:{sanitize:()=>true,sanitizePageStore:x=>x.schemaVersion===1&&Array.isArray(x.items)}
 },{getItem:k=>memories.get(k)??null});
 const statuses=inspect();
 assert.equal(statuses.find(x=>x.key==='ck120-ocr-page-drafts-v1')?.status,'ok');
 assert.equal(statuses.find(x=>x.key==='ck118-personal-ocr-draft-v1')?.status,'empty');
 assert.match(src,/특수 정답 /);
 assert.match(src,/복수정답 /);
 assert.match(src,/전원정답 /);
 assert.match(src,/2026-11-01 저장소 해설 보고서/);
});

test('manual 7-file audit reports 800+400 structures, distinct special answers and explicit unreviewed explanations',()=>{
 const script=read('assets/ck-data-diagnostics-v88.js');
 const start=script.indexOf('function auditStatic('),end=script.indexOf('function auditText(',start);
 assert.ok(start>=0&&end>start);
 const check=new Function(script.slice(start,end)+'return auditStatic;')();
 const bundles=[parse('data/official-2016-2020.json'),parse('data/official-2021-2025.json')];
 const explanations=Array.from({length:5},(_,n)=>parse('data/explanations/official-'+(2021+n)+'.json'));
 const result=check(bundles,explanations);
 assert.equal(result.ok,true);
 assert.equal(result.issueCount,0);
 assert.equal(result.officialCount,800);
 assert.equal(result.uniqueIds,800);
 assert.equal(result.explanationCount,400);
 assert.equal(result.draft,240);
 assert.equal(result.unstarted,160);
 assert.equal(result.published,0);
 assert.equal(result.sourceChecked,0);
 assert.deepEqual(result.totals,{allAccepted:8,multiple:3});
 const bad=JSON.parse(JSON.stringify(explanations));
 bad[4].records[0].quality.status='published';
 const denied=check(bundles,bad);
 assert.ok(denied.issueCount>0);
 assert.ok(denied.errors.some(x=>x.includes('published')));
});
test('audit UI fetches only on explicit button and safely formats the result',()=>{
 const src=read('assets/ck-data-diagnostics-v88.js');
 assert.match(src,/data-v121-run>원문·해설 구조 검사/);
 assert.match(src,/data-v121-export disabled>검사 결과 TXT/);
 assert.match(src,/if\(button\.hasAttribute\('data-v121-run'\)\)\{runAudit\(\)/);
 assert.match(src,/function auditText\(report\)/);
 assert.match(src,/summary\.textContent=/);
 assert.match(src,/output\.replaceChildren\(\)/);
 assert.match(src,/7개 JSON을 버튼 클릭 시에만/);
 assert.doesNotMatch(src,/fetch\([^)]*\{method:'POST'/);
 assert.match(src,/12종 원본 백업 내려받기/);
});
test('audit code never mutates canonical data, auto runs CI or installation artifact build',()=>{
 const config=parse('vercel.json');assert.equal(config.git.deploymentEnabled,false);
 assert.equal(fs.existsSync(path.join(__dirname,'..','.github','workflows')),false);
 const diag=read('assets/ck-data-diagnostics-v88.js');
 assert.match(diag,/읽기 전용 검사/);
 assert.doesNotMatch(diag,/fetch\([^)]*POST/);
});
