/* ConceptKnot v170: manual QA navigation and fail-closed five-year P4 scoping. */
'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8'),parse=p=>JSON.parse(read(p));
const bank=parse('data/official-2021-2025.json'),byId=new Map(bank.map(q=>[q.id,q]));
const explanation=[2021,2022,2023,2024,2025].flatMap(y=>parse('data/explanations/official-'+y+'.json').records);
const recent=explanation.map(entry=>({q:byId.get(entry.questionId),entry}));
const audit=require('../assets/ck-p4-option-audit-v160.js');
const study=require('../assets/ck-p4-public-study-v163.js');
const deps={optionAudit:audit,v161:require('../assets/ck-p4-substantive-v161.js'),
 v162:require('../assets/ck-p4-substantive-v162.js'),
 v164:require('../assets/ck-p4-substantive-v164.js'),
 v165:require('../assets/ck-p4-substantive-v165.js'),
 v167:require('../assets/ck-p4-substantive-v167.js'),
 v168:require('../assets/ck-p4-substantive-v168.js')};
test('P4 strictly accepts 2021-2025 400, rejects legacy 2020 contamination without altering original bank',()=>{
 A.equal(recent.length,400);
 const valid=audit.build(recent);
 A.equal(valid.ready,true,valid.errors?.join(' / '));
 A.equal(valid.rows.length,2000);
 const legacy={q:{id:'2020-1',year:2020,number:1,verified:true},entry:null};
 const invalid=audit.build([...recent,legacy]);
 A.equal(invalid.ready,false);
 A.ok(invalid.errors.some(x=>x.includes('2020-1')));
 const publicResult=study.build(recent,deps);
 A.equal(publicResult.ready,true,publicResult.errors?.join(' / '));
 A.equal(publicResult.stats.structuralOptionsChecked,2000);
 A.equal(publicResult.stats.aiOptionCandidates,808);
 A.equal(publicResult.stats.optionsWithoutIndependentCandidate,714);
 A.equal(publicResult.stats.expertVerifiedOptions,0);
});
test('workbench uses the selected five-year subset in BOTH P4 viewers AND their click handlers',()=>{
 const source=read('assets/ck-study-workbench-v81.js');
 A.match(source,/recentP4Subset=Array\.isArray\(items\)\?items\.filter\(x=>x\?\.q\?\.year>=2021&&x\?\.q\?\.year<=2025\)/);
 A.match(source,/CK163PublicStudy\?\.panel\?\.\(p4Rows\)/);
 A.match(source,/CK160OptionUI\?\.panel\?\.\(p4Rows\)/);
 A.match(source,/CK163PublicStudy\?\.clicked\?\.\(target,recentP4Rows\(rows\)/);
 A.match(source,/CK160OptionUI\?\.clicked\?\.\(target,recentP4Rows\(rows\)/);
 A.match(source,/async function openP4Review\(section\)/);
 A.doesNotMatch(source,/CK163PublicStudy\?\.panel\?\.\(rows\)/);
 A.doesNotMatch(source,/CK160OptionUI\?\.panel\?\.\(rows\)/);
});
test('verification drawer provides direct one-click study, 2000-option, offline and manual PASS/FAIL paths',()=>{
 const ui=read('assets/ck-study-workbench-v81.js');
 const qa=read('assets/ck-manual-qa-v115.js');
 const css=read('assets/ck-study-workbench-v81.css');
 const qaCss=read('assets/ck-manual-qa-v115.css');
 for(const item of ['study','options','offline','manual','all'])
  A.ok(ui.includes('data-ck170-action="'+item+'"'));
 A.ok(ui.includes('검증·자료'));
 A.ok(ui.includes('api.controllerCacheInfo()'));
 A.ok(ui.includes('api.offlineHealth(window.caches,active)'));
 A.ok(ui.includes("실제 오프라인 조작은 ④에서 직접 검증하세요"));
 A.ok(qa.includes("document.querySelector('#ck103-tools-dock .ck103-tools-content')"));
 A.ok(qa.includes('open:()=>{if(mount(true))'));
 A.ok(qa.includes("filterMode='p4'"));
 A.ok(qa.includes("data-ck115-filter"));
 A.ok(qa.includes('getState:()=>({...summary(),dirty,issue'));
 A.ok(css.includes('position:sticky'));
 A.ok(css.includes('data-ck170-view="manual"'));
 A.ok(qaCss.includes(':is(#main,#ck103-tools-dock)'));
 A.ok(qaCss.includes('data-ck115-p4="false"'));
 A.ok(qa.includes("ck115-manual-device-verification-v1"));
});
test('versioned read-only offline / SPA release and manual deploy guards are coherent',()=>{
 const html=read('index.html'),sw=read('sw.js'),diag=read('assets/ck-data-diagnostics-v88.js'),
  cfg=parse('vercel.json');
 A.ok(html.includes('ck-release" content="v171-p4-mvp-tts-theory-graph"'));
 const cache='conceptknot-study-v171-p4-mvp-tts-theory-graph';
 A.ok(sw.includes("const CACHE='"+cache+"'"));
 A.ok(diag.includes("OFFLINE_CACHE='"+cache+"'"));
 for(const asset of ['ck-study-workbench-v81.js?v=170','ck-study-workbench-v81.css?v=170',
   'ck-manual-qa-v115.js?v=170','ck-manual-qa-v115.css?v=170','ck-data-diagnostics-v88.js?v=170']){
  A.ok(html.includes(asset),'HTML missing '+asset);
  A.ok(sw.includes(asset),'SW missing '+asset);
 }
 A.ok(diag.includes('ck-study-workbench-v81.js?v=170'));
 A.ok(diag.includes('ck-manual-qa-v115.js?v=170'));
 A.ok(diag.includes('OFFLINE_CACHE});'));
 A.equal(cfg.git.deploymentEnabled,false);
 A.ok(cfg.buildCommand.includes('verify-p4-release-v171.cjs'));
 A.equal(fs.existsSync('.github/workflows'),false);
 for(const path of ['assets/ck-study-workbench-v81.js','assets/ck-manual-qa-v115.js',
    'assets/ck-data-diagnostics-v88.js','sw.js'])
  A.doesNotThrow(()=>new vm.Script(read(path),{filename:path}));
});
