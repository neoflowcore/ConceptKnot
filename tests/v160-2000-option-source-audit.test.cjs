/* ConceptKnot v160 P4: original 400 questions x five independent options pre-audit. */
'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs');
const read=path=>fs.readFileSync(path,'utf8');
const Audit=require('../assets/ck-p4-option-audit-v160.js');
const q=JSON.parse(read('data/official-2021-2025.json')),
 bank=new Map(q.map(x=>[x.id,x]));
const explanations=Array.from({length:5},(_,i)=>
 JSON.parse(read('data/explanations/official-'+(2021+i)+'.json')).records).flat();
const input=explanations.map(entry=>({q:bank.get(entry.questionId),entry})),audit=Audit.build(input);
test('400 official question records map to 2000 independent option review rows',()=>{
 A.equal(audit.ready,true);A.equal(audit.questions,400);A.equal(audit.rows.length,2000);
 A.equal(new Set(audit.rows.map(x=>x.id)).size,2000);
 A.equal(new Set(audit.rows.map(x=>x.questionId)).size,400);
 A.equal(audit.stats.questions,400);A.equal(audit.stats.options,2000);
 for(let y=2021;y<=2025;y++){
  A.equal(input.filter(x=>x.q.year===y&&x.q.subject==='estate').length,40);
  A.equal(input.filter(x=>x.q.year===y&&x.q.subject==='civil').length,40);
 }
});
test('all 2000 source review candidates preserve facts without creating expert approvals',()=>{
 A.equal(audit.stats.optionsWithDraft,830);
 A.equal(audit.stats.optionsWithoutDraft,1170);
 A.equal(audit.stats.sourceCheckedFlags,0);
 A.equal(audit.stats.expertVerified,0);A.equal(audit.stats.published,0);
 A.equal(audit.stats.paperNoticeLinks,400);
 A.equal(audit.stats.paperMirrorLinks,400);
 A.equal(audit.stats.finalAnswerLinks,400);
 for(const item of audit.rows){
  A.equal(item.contentReviewed,false);A.equal(item.signoffAllowed,false);
  A.match(item.verdict,/^unreviewed$/);
  A.ok(item.questionText);A.ok(item.optionText);A.ok(item.id);
  A.equal(typeof item.officialAccepted,'boolean');
 }
});
test('Q-Net paper notice and final answer notice are distinct for every year',()=>{
 for(let year=2021;year<=2025;year++){
  const group=audit.rows.filter(x=>x.year===year);
  A.equal(group.length,400);
  const r=group[0];
  A.notEqual(r.sourceRefs.paperNotice,r.sourceRefs.finalAnswerNotice);
  A.ok(r.sourceRefs.paperNotice.includes('menuType=cst00309'));
  A.ok(r.sourceRefs.finalAnswerNotice.includes('menuType=cst00310'));
  A.match(r.sourceRefs.finalAnswerNotice,/^https:\/\/www\.q-net\.or\.kr\//);
  A.equal(Audit.finalAnswerNotice(year),r.sourceRefs.finalAnswerNotice);
 }
});
test('missing, duplicated, altered answers or option numbers fail closed',()=>{
 const missing=Audit.build(input.slice(0,-1));
 A.equal(missing.ready,false);A.equal(Audit.csv(missing),'');
 const repeated=Audit.build([...input,input[0]]);
 A.equal(repeated.ready,false);A.equal(Audit.packet(repeated,['2025-1']),'');
 const changed=JSON.parse(JSON.stringify(input[0]));
 changed.entry.officialAnswer=[3];
 const tampered=Audit.build([changed,...input.slice(1)]);
 A.equal(tampered.ready,false);
 const swapped=JSON.parse(JSON.stringify(input[0]));
 swapped.entry.options[0].no=5;
 A.equal(Audit.build([swapped,...input.slice(1)]).ready,false);
});
test('CSV has exactly 2000 quoted rows and prevents spreadsheet injection',()=>{
 const csv=Audit.csv(audit);
 A.equal(csv.split('\r\n').filter(Boolean).length,2001);
 A.match(csv,/QNet문제지게시글/);
 A.match(csv,/QNet최종정답공고/);
 A.match(csv,/시험지PDF참고복제본/);
 A.match(csv,/공식인정정답/);A.match(csv,/실제전문가검수/);
 A.equal(csv.startsWith('\uFEFF'),false);
 const cloned=JSON.parse(JSON.stringify(input[0]));
 cloned.q.options[0]=' =HYPERLINK("https://example.org")';
 const poison=Audit.build([cloned,...input.slice(1)]);
 A.equal(poison.ready,true);
 A.ok(Audit.csv(poison).includes('"\' =HYPERLINK('));
});
test('option packet includes original option 5, draft and explicit unverified status',()=>{
 const id=audit.rows.find(x=>x.special).questionId;
 const packet=Audit.packet(audit,[id,id],5);
 A.match(packet,/선지 5/);
 A.match(packet,/원전 판정: 미검수/);
 A.match(packet,/Q-Net 공식 문제지 게시글/);
 A.match(packet,/최종정답 공고/);
 A.equal(packet.split('=== '+id).length,2);
});
test('v160 model and UI integrate with source priority workbench without writing review state',()=>{
 const html=read('index.html'),workbench=read('assets/ck-study-workbench-v81.js'),
  ui=read('assets/ck-p4-option-audit-ui-v160.js');
 for(const src of ['ck-p4-review-priority-v159.js?v=159','ck-p4-option-audit-v160.js?v=160',
   'ck-p4-option-audit-ui-v160.js?v=162','ck-study-workbench-v81.js?v=160','ck-p4-substantive-v161.js?v=161','ck-p4-substantive-v162.js?v=162']){
  A.ok(html.includes(src),src);
 }
 A.ok(html.indexOf('ck-p4-option-audit-v160.js?v=160')<
  html.indexOf('ck-study-workbench-v81.js?v=160'));
 for(const tag of ['data-ck160-csv','data-ck160-txt','data-ck160-personal','data-ck160-filter'])
  A.ok(ui.includes(tag),tag);
 A.ok(workbench.includes('window.CK160OptionUI?.panel?.(rows)'));
 A.ok(ui.includes('CK161SubstantiveReview'));
 A.ok(html.includes('ck-p4-option-audit-ui-v160.js?v=162'));
 A.doesNotMatch(ui,/localStorage\.setItem|quality\.sourceChecked\s*=/);
 A.doesNotMatch(read('assets/ck-p4-option-audit-v160.js'),/localStorage\.setItem|quality\.status\s*=/);
});
