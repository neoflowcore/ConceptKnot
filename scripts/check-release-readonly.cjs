/* ConceptKnot v100 final read-only preflight.
 * No network, no CI, no cache mutation, no install artifacts, no file writes.
 * Run manually: node scripts/check-release-readonly.cjs
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..'),errors=[];
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const check=(condition,message)=>{if(!condition)errors.push(message);};
function pathsFromHtml(html){
 const scripts=[...html.matchAll(/<script\b[^>]*src=["']([^"']+)/g)].map(x=>x[1]);
 const css=[...html.matchAll(/<link\b[^>]*href=["']([^"']+\.css(?:\?[^"']*)?)["']/g)].map(x=>x[1]);
 return {scripts,css};
}
function nameOf(url){return url.replace(/^\.\//,'').split('?')[0].split('#')[0];}
function isLocal(url){return /^\.\//.test(url);}
function run(){
 const html=read('index.html'),service=read('sw.js'),vc=JSON.parse(read('vercel.json'));
 check(vc.git?.deploymentEnabled===false,'Vercel Git 자동배포가 비활성이 아닙니다.');
 check(!fs.existsSync(path.join(ROOT,'.github/workflows')),'GitHub Actions workflow 디렉터리가 존재합니다.');
 check(service.includes('conceptknot-study-v100-evidence-workbench'),'서비스 워커 캐시 버전 불일치');
 const {scripts,css}=pathsFromHtml(html);
 for(const src of [...scripts,...css]){
  if(!isLocal(src))continue;
  const file=nameOf(src);check(fs.existsSync(path.join(ROOT,file)),'페이지 리소스 누락: '+file);
 }
 let parsed=0;
 for(const src of new Set(scripts.filter(isLocal))){
  const file=nameOf(src);if(!fs.existsSync(path.join(ROOT,file)))continue;
  if(file.endsWith('.mjs'))continue;
  try{new vm.Script(read(file),{filename:file});parsed++;}
  catch(e){errors.push('JS 문법 오류: '+file+' · '+e.message);}
 }
 for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/g)){
  if(/\bsrc\s*=/.test(m[1])||/type=['"]module['"]/.test(m[1])||!m[2].trim())continue;
  try{new vm.Script(m[2]);}catch(e){errors.push('인라인 JS 문법 오류: '+e.message);}
 }
 const assetMatch=service.match(/const ASSETS=(\[[^\n]*\]);/);
 if(!assetMatch)errors.push('SW ASSETS 선언을 분석할 수 없습니다.');
 let cached=0;
 if(assetMatch){
  const refs=[...assetMatch[1].matchAll(/'([^']+)'/g)].map(x=>x[1]);
  cached=refs.length;
  for(const src of refs){
   if(!isLocal(src))continue;
   const file=nameOf(src);if(file&&!fs.existsSync(path.join(ROOT,file)))
    errors.push('SW 캐시 원본 누락: '+file);
  }
 }
 for(const name of ['ck-study-workbench-v81.js','ck-study-workbench-v81.css']){
  check(html.includes('./assets/'+name+'?v=100'),'HTML v100 캐시 갱신 누락: '+name);
  check(service.includes('./assets/'+name+'?v=100'),'SW v100 캐시 갱신 누락: '+name);
 }
 const {auditOfficialBank}=require('./audit-official-bank.cjs');
 const {auditExplanations}=require('./audit-explanation-readiness.cjs');
 const official=[JSON.parse(read('data/official-2016-2020.json')),
  JSON.parse(read('data/official-2021-2025.json'))];
 const o=auditOfficialBank(official);
 const bundles={};
 for(let year=2021;year<=2025;year++)
  bundles[year]=JSON.parse(read('data/explanations/official-'+year+'.json'));
 const explanations=auditExplanations(bundles,official[1]);
 check(o.records===800&&o.issues.length===0,'800문항 공식 기출 구조 오류');
 check(explanations.total===400&&explanations.issues.length===0,'400문항 해설 구조 오류');
 check(explanations.unverifiedPublicationClaims===0,'검증 근거 없는 공개 상태 표시 감지');
 const report={passed:errors.length===0,js:parsed,styles:css.length,swReferences:cached,
  officialRecords:o.records,officialOptions:o.optionTexts,explanationRecords:explanations.total,
  explanationDrafts:explanations.draft,explanationUnstarted:explanations.unstarted,
  reviewedReasons:explanations.reasonReviewed,reviewedOptions:explanations.optionReviewed,
  issues:errors};
 process.stdout.write(JSON.stringify(report,null,2)+'\n');
 if(errors.length)process.exitCode=1;
 return report;
}
module.exports={pathsFromHtml,nameOf,isLocal};
if(require.main===module)run();
