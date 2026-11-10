/* v157 release invariants for the current manual-only production cycle. */
'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs'),cp=require('node:child_process');
const read=p=>fs.readFileSync(p,'utf8');
test('index release, service worker and diagnostics version agree',()=>{
 const html=read('index.html'),sw=read('sw.js'),diag=read('assets/ck-data-diagnostics-v88.js');
 A.ok(html.includes('ck-release" content="v157-phase-remaining-offline-restore-ime-board"'));
 A.ok(sw.includes("const CACHE='conceptknot-study-v157-resume-offline-omr-ime'"));
 A.ok(diag.includes("OFFLINE_CACHE='conceptknot-study-v157-resume-offline-omr-ime'"));
 const assets=[
  'ck-full-exam-v82.js?v=157','ck-mobile-board-v21.js?v=157',
  'ck-manual-qa-v115.js?v=157','ck-data-diagnostics-v88.js?v=157',
  'ck-study-p6-v76.js?v=157','ck-graph-direct-v149.js?v=157',
  'ck-graph-direct-v149.css?v=157'
 ];
 for(const a of assets){
  A.ok(html.includes(a),'missing HTML '+a);
  A.ok(sw.includes(a),'missing SW '+a);
 }
 A.ok(read('assets/ck-study-p6-v76.js').includes('ck-typing-ime-guard-v155.js?v=157'));
});
test('official 800 bank source and 2021–2025 draft explanation source bytes unchanged',()=>{
 const paths=['data/official-2016-2020.json','data/official-2021-2025.json',...Array.from({length:5},(_,i)=>'data/explanations/official-'+(2021+i)+'.json')];
 for(const p of paths){
  const before=cp.execFileSync('git',['rev-parse','HEAD:'+p],{encoding:'utf8'}).trim();
  const after=cp.execFileSync('git',['hash-object',p],{encoding:'utf8'}).trim();
  A.equal(after,before,'official source changed '+p);
 }
 const totals=JSON.parse(read('data/reports/recent-five-coverage.json'));
 A.equal(totals.draftCount,400);A.equal(totals.publishedCount,0);
});
test('P7 manual statuses cannot be auto-marked as hardware PASS by capability diagnosis',()=>{
 const qa=read('assets/ck-manual-qa-v115.js');
 for(const id of ['v157-offline-live','v157-ime-stylus-recovery',
  'v157-official-json-restore','v157-visual-p6','v157-expert-audit'])
   A.ok(qa.includes("id:'"+id+"'"));
 A.ok(qa.includes("key:'ck115-manual-device-verification-v1'")||
  qa.includes("KEY='ck115-manual-device-verification-v1'"));
 A.ok(qa.includes('PASS (직접 확인)'));
 A.ok(qa.includes('아래 PASS/FAIL은 실제 조작 후 사용자가 직접 표기'));
 A.doesNotMatch(qa,/diagnose\([\s\S]*?localStorage\.setItem\([\s\S]*?pass/i);
});
test('scope: no auto deployments, GitHub CI workflows, EXE APK ZIP creation or TTS model download',()=>{
 A.equal(JSON.parse(read('vercel.json')).git.deploymentEnabled,false);
 A.equal(fs.existsSync('.github/workflows'),false);
 const code=['assets/ck-mobile-board-v21.js','assets/ck-typing-ime-guard-v155.js',
  'assets/ck-full-exam-v82.js','scripts/audit-p4-v157.cjs',
  'assets/ck-data-diagnostics-v88.js'].map(read).join('\n');
 A.doesNotMatch(code,/child_process\.exec|spawn\(|downloadModel\(|\.exe\b|\.apk\b|\.zip\b/);
});
test('P6 live-region does not issue continuous screenreader narration per pointermove',()=>{
 const js=read('assets/ck-graph-direct-v149.js');
 A.ok(js.includes('data-ck157-final-status'));
 A.ok(js.includes("function done(before,c,root)"));
 A.ok(js.includes("speech.textContent=lesson.action"));
 A.ok(!js.includes('<p data-ck156-action role="status"></p>'));
 A.ok(read('assets/ck-graph-direct-v149.css').includes('.ck157-sr-status'));
});

