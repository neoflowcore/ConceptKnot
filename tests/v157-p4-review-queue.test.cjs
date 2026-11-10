/* v157 expert-review worksheet, never human signoff. */
'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),
 fs=require('node:fs'),cp=require('node:child_process');
const {reviewRows,csv,summary}=require('../scripts/audit-p4-v157.cjs');
test('400 question IDs and canonical source answers are preserved',()=>{
 const rows=reviewRows();
 A.equal(rows.length,400);A.equal(new Set(rows.map(r=>r.id)).size,400);
 const q=JSON.parse(fs.readFileSync('data/official-2021-2025.json','utf8'));
 const map=new Map(q.map(v=>[v.id,v]));
 for(const r of rows){
  A.equal(r.officialAnswer,map.get(r.id).correct.join('/'));
  A.equal(r.qualityStatus,'draft');
  A.equal(r.publishEligible,'N');
  A.equal(r.sourceReview,'N');
  A.equal(r.optionsReviewed,0);
 }
});
test('priority rules isolate seven special answers and protect original grades',()=>{
 const rows=reviewRows(),s=summary(rows);
 A.deepEqual([s.tier1Special,s.tier2Law,s.tier3Calculation,s.tier4Other],[7,216,57,120]);
 A.equal(s.expertSourceReviewed,0);A.equal(s.published,0);
 A.equal(s.lawScreenTotal,219);
 A.equal(s.calculationScreenTotal,63);
 A.equal(rows.filter(r=>r.special==='Y').length,7);
 A.ok(rows.slice(0,7).every(r=>r.priority===1));
});
test('CSV has exactly 400 data rows, formula injection protection and explicit manual checklist',()=>{
 const rows=reviewRows(),text=csv(rows),lines=text.trim().split('\r\n');
 A.equal(lines.length,401);A.ok(lines[0].includes('publishEligible'));
 A.equal((text.match(/원문·시험당시 적용법/g)||[]).length,400);
 A.ok(lines.every(line=>!line.includes('"Y","원문·시험당시 적용법')));
 const child=cp.execFileSync('node',['scripts/audit-p4-v157.cjs','--csv'],{encoding:'utf8'});
 A.ok(child.startsWith('\uFEFF'));A.equal(child.trim().split('\r\n').length,401);
});
test('read-only audit is independent of user storage, code generation, CI and installation files',()=>{
 const script=fs.readFileSync('scripts/audit-p4-v157.cjs','utf8');
 A.doesNotMatch(script,/localStorage|setItem|writeFile|createWriteStream/);
 A.equal(fs.existsSync('.github/workflows'),false);
});

