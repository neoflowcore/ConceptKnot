/* ConceptKnot v159 P4 source-locked priority review. Node tests only; no CI. */
'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs');
const P4=require('../assets/ck-p4-review-priority-v159.js');
const official=JSON.parse(fs.readFileSync('data/official-2021-2025.json','utf8'));
const bank=new Map(official.map(q=>[q.id,q]));
const entries=Array.from({length:5},(_,i)=>
 JSON.parse(fs.readFileSync('data/explanations/official-'+(2021+i)+'.json','utf8')).records).flat();
const items=entries.map(entry=>({q:bank.get(entry.questionId),entry}));
test('P4 400 source-locked recent-five records and priority distribution are stable',()=>{
 const s=P4.snapshot(items);
 A.equal(s.ready,true);A.equal(s.rows.length,400);A.deepEqual(s.errors,[]);
 A.deepEqual([s.totals.special,s.totals.law,s.totals.calculation,s.totals.other],[7,216,57,120]);
 A.equal(s.totals.optionReviewed,0);
 A.equal(s.totals.sourceReviewed,0);
 A.equal(s.totals.reasonReviewed,0);
 A.equal(s.totals.published,0);
});
test('P4 true/false classification is deliberately NOT inferred from answer positions',()=>{
 const row=P4.snapshot(items).rows[0];
 A.ok(row.answer);A.equal(row.reviewedOptions,0);
 A.equal(row.quality,'draft');A.equal(row.sourceReviewed,false);
});
test('P4 missing, duplicate, tampered answer and crossed ID all block export',()=>{
 const tampered=JSON.parse(JSON.stringify(items[0]));
 tampered.entry.officialAnswer=[2];
 for(const bad of [[...items.slice(1)],[...items,items[0]],[tampered,...items.slice(1)]]){
  const snap=P4.snapshot(bad);A.equal(snap.ready,false);
  A.equal(P4.csv(snap),'');A.equal(P4.packet(snap,['2025-1'],1),'');
 }
});
test('P4 no mutation of canonical 400 source rows after reading',()=>{
 const before=JSON.stringify(items);
 const s=P4.snapshot(items);P4.csv(s);P4.packet(s,s.rows.slice(0,5).map(x=>x.id));
 A.equal(JSON.stringify(items),before);
});
test('P4 CSV contains one header and exactly 400 quoted rows without double BOM',()=>{
 const s=P4.snapshot(items),csv=P4.csv(s);
 A.ok(!csv.startsWith('\uFEFF'));
 A.equal(csv.trimEnd().split('\r\n').length,401);
 A.ok(csv.includes('공식게시가능여부'));A.ok(csv.includes('①~⑤ 각각 미확인'));
 A.equal(csv.split('\r\n').at(-1),'');
});
test('P4 formula-like user fields cannot become spreadsheet functions',()=>{
 const one=JSON.parse(JSON.stringify(items[0]));
 one.q.question=' =HYPERLINK("https://example.test")';
 const fixture=[one,...items.slice(1)],s=P4.snapshot(fixture);
 A.equal(s.ready,true);
 const csv=P4.csv(s);
 A.ok(csv.includes('"\' =HYPERLINK('));
});
test('P4 highest-priority five-text packet includes authentic sources, all options and explicit unverified labels',()=>{
 const s=P4.snapshot(items),ids=s.rows.slice(0,5).map(r=>r.id);
 const txt=P4.packet(s,ids,5);
 A.equal(new Set(ids).size,5);A.match(txt,/원문: /);A.match(txt,/선지 5: /);
 A.match(txt,/학습용 해설 후보 \[원전 미검수\]/);A.match(txt,/공식 게시 가능: \[아니오\]/);
 A.equal(P4.packet(s,ids.concat(ids),5),txt);
});
test('P4 workbench integrates review ribbons, filters, queue CSV, TXT with user clicks only',()=>{
 const js=fs.readFileSync('assets/ck-study-workbench-v81.js','utf8'),
  html=fs.readFileSync('index.html','utf8');
 for(const required of ['data-ck159-focus','data-ck159-p4-csv','data-ck159-p4-packet',
  'source-priority','p4-calculation','P4 원전대조 우선순위','p4PriorityRecord'])
  A.ok(js.includes(required),required);
 const first=html.indexOf('ck-p4-review-priority-v159.js?v=159');
 const second=html.indexOf('ck-study-workbench-v81.js?v=170');
 A.ok(first>=0&&second>first,'pure model must load before workbench');
});
