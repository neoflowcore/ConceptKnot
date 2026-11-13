/* v156 release boundaries: verified current URLs, immutable source, user-marked QA. */
'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),
 fs=require('node:fs'),cp=require('node:child_process');
const read=p=>fs.readFileSync(p,'utf8');
test('HTML version, PWA generation and all three graph cache query URLs agree',()=>{
 const html=read('index.html'),sw=read('sw.js'),diag=read('assets/ck-data-diagnostics-v88.js');
 A.ok(html.includes('ck-release" content="v165-2024-estate-independent-options"'));
 for(const name of ['ck-graph-motion-v149.js','ck-graph-direct-v149.js',
  'ck-graph-direct-v149.css']){
  const url=name+'?v=158';
  A.ok(html.includes(url),'not in HTML '+url);
  A.ok(sw.includes('./assets/'+url),'not in PWA cache '+url);
 }
 A.ok(sw.includes("const CACHE='conceptknot-study-v165-2024-estate-160-option-notes'"));
 A.ok(diag.includes('conceptknot-study-v165-2024-estate-160-option-notes'));
});
test('manual-install core remains 11 and official 800 source files byte identical to base commit',()=>{
 const sw=read('sw.js'),core=sw.match(/const CRITICAL=\[([\s\S]*?)\];/);
 A.ok(core);A.equal((core[1].match(/'\.\//g)||[]).length,11);
 for(const p of ['data/official-2016-2020.json','data/official-2021-2025.json',
  'data/explanations/official-2021.json','data/explanations/official-2025.json']){
  const head=cp.execFileSync('git',['rev-parse','HEAD:'+p],{encoding:'utf8'}).trim();
  const here=cp.execFileSync('git',['hash-object',p],{encoding:'utf8'}).trim();
  A.equal(here,head,'do not alter source '+p);
 }
});
test('P4 draft content remains unreviewed and cannot be mistaken for expert publication',()=>{
 const c=JSON.parse(read('data/reports/recent-five-coverage.json'));
 A.equal(c.draftCount,400);A.equal(c.publishedCount,0);
 const readme=read('README.md');
 A.match(readme,/해설 초안 400\/400/);
 A.match(readme,/수기 기기검증 NOT_RUN/);
});
test('P7 adds slope/intersection and 17-graph real-device verification without self-certifying',()=>{
 const qa=read('assets/ck-manual-qa-v115.js');
 for(const id of ['graph-slope-touch-v156','graph-slope-shift-v156','graph-before-after-v156'])A.ok(qa.includes("id:'"+id+"'"));
 A.match(qa,/ck115-manual-device-verification-v1/);
 A.match(qa,/PASS \(직접 확인\)/);
 A.equal(JSON.parse(read('vercel.json')).git.deploymentEnabled,false);
 A.equal(fs.existsSync('.github/workflows'),false);
});

