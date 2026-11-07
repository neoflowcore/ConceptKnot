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
 check(service.includes('conceptknot-study-v135-typing-ime'),'서비스 워커 v135 캐시 버전 불일치');
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
 // Check actual release invariants instead of stale v100 hardcoded query strings.
 const criticalBlock=service.match(/const CRITICAL=\[([\s\S]*?)\];/);
 check(Boolean(criticalBlock),'서비스워커 필수 자산 선언 누락');
 const critical=criticalBlock?[...criticalBlock[1].matchAll(/'(\.\/[^']+)'/g)].map(m=>m[1]):[];
 check(critical.length===11,'필수 오프라인 파일 수가 11개가 아닙니다.');
 const indexHtmlNames=new Set([...scripts,...css].filter(isLocal).map(nameOf));
 for(const src of critical){
  const file=nameOf(src);check(fs.existsSync(path.join(ROOT,file)),'필수 캐시 파일 없음: '+file);
  if(file.endsWith('.js')||file.endsWith('.css'))
   check(indexHtmlNames.has(file),'필수 자산이 HTML에 포함되지 않음: '+file);
  check(service.includes(src),'서비스워커 필수 캐시 주소가 일치하지 않음: '+src);
 }
 check(service.includes("CK_SW_VERSION_PING"),'활성 SW 버전 진단 응답이 없습니다.');
 check(service.includes('e.waitUntil(caches.open(CACHE)'), '네트워크 응답 캐시 쓰기가 생명주기에 연결되지 않았습니다.');
 const diag=read('assets/ck-data-diagnostics-v88.js');
 check(diag.includes('controllerCacheInfo()'),'실제 활성 SW 세대 확인 로직이 없습니다.');
 check(diag.includes('await current.match(path)'),'오프라인 자산 쿼리 버전 정확 비교 누락');
 check(!diag.includes("current.match(path,{ignoreSearch:true})"),'오프라인 진단이 버전 쿼리를 무시합니다.');
 for(const suffix of ['ck-data-diagnostics-v88.js?v=134','ck-data-diagnostics-v88.css?v=125','ck-manual-qa-v115.js?v=130']){
  check(html.includes(suffix),'HTML 진단 자산 누락: '+suffix);
  check(service.includes('./assets/'+suffix),'SW 진단 자산 누락: '+suffix);
 }
 for(const filename of ['ck-mixed-mock-v129.js?v=134','ck-mixed-mock-v129.css?v=130']){
  check(html.includes('./assets/'+filename),'혼합 5세트 HTML 자산 누락: '+filename);
  check(service.includes('./assets/'+filename),'혼합 5세트 오프라인 목록 누락: '+filename);
 }
 for(const filename of ['ck-mixed-review-v131.js?v=133','ck-mixed-review-v131.css?v=131']){
  check(html.includes('./assets/'+filename),'개인 혼합 약점복습 HTML 자산 누락: '+filename);
  check(service.includes('./assets/'+filename),'개인 혼합 약점복습 SW 자산 누락: '+filename);
 }
 const review=read('assets/ck-mixed-review-v131.js');
 check(review.includes('ck129-mixed-sessions-v1'),'개인 혼합 제출 기록 연동 누락');
 check(review.includes('api.sanitizeSession(item)'),'원본 세트 정체성 검증 누락');
 check(review.includes('ck:mixed-exam-submitted'),'제출 직후 복습 갱신 누락');
 check(review.includes('data-ck131-reveal'),'복습 정답 확인 버튼 누락');
 check(review.includes('if(localStorage.getItem(KEY)!==src.raw)'),'다른 탭 내보내기 보호 누락');
 const dot=read('assets/ck-dot-landing-v57.js');
 const garden=read('assets/ck-garden-25d-v36.js');
 check(dot.includes('let booted = false;')&&dot.includes('function ensureHost()'),
  '초기 학습 탭에서 Dot 랜딩 host 복구 경로 없음');
 check(dot.includes("document.body.prepend(host);"),'Dot 랜딩 host 선제 생성 누락');
 check(garden.includes("import('./ck-dot-landing-v57.js?v=132')"),
  'Dot 랜딩 동적 import 버전 불일치');
 check(html.includes('ck-garden-25d-v36.js?v=132'),
  '최신 Dot 런처를 HTML이 불러오지 않음');
 check(service.includes('ck-dot-landing-v57.js?v=132'),
  '최신 Dot 모듈 SW 캐시 누락');
 check(service.includes('ck-garden-25d-v36.js?v=132'),
  '최신 Dot 런처 SW 캐시 누락');
 for(const name of ['ck-exam-hub-v133.js?v=134','ck-exam-hub-v133.css?v=133']){
  check(html.includes('./assets/'+name),'통합 모의고사 UI HTML 참조 누락: '+name);
  check(service.includes('./assets/'+name),'통합 모의고사 오프라인 경로 누락: '+name);
 }
 check(html.includes('id="ck133-exam-unified"'),'통합 모의고사 컨테이너 누락');
 check(html.includes('id="ck133-exam-engine"'),'기존 시험 엔진 공통 마운트 지점 누락');
 check(html.includes('id="ck133-review-anchor"'),'개인 약점 복습 하단 위치 누락');
 const hub=read('assets/ck-exam-hub-v133.js');
 check(hub.includes("types=['mock','mixed','official']"),'모의고사 3대 분류 누락');
 check(hub.includes("CLOCK_KEY='ck133-practice-clock-v1'"),'기본 연습 100분 카운트다운 누락');
 check(hub.includes("remainingMs"),'기존 공식 실전 타이머 연동 누락');
 check(read('assets/ck-mixed-review-v131.js').includes("document.getElementById('ck133-review-anchor')"),
  '약점 복습 후순위 마운트가 연결되지 않음');
 const keyboardMarker='/* v134: consistent 1-5 answers and Ctrl+Left/Right';
 check(html.includes(keyboardMarker),'모의고사·10개년 기출 키보드 통합 핸들러 누락');
 check(html.includes("state.view==='quiz'")&&html.includes("state.view==='exam'"),'두 시험 탭 단축키 구분 누락');
 check(html.includes("e.ctrlKey")&&html.includes("e.stopImmediatePropagation()"),'Ctrl+방향키 충돌 방지 누락');
 check(read('assets/ck-full-exam-v82.js').includes('position:active()?.position??null'),
  '공식 실전 현재 문항 번호 API 누락');
 check(read('assets/ck-mixed-mock-v129.js').includes('position:active()?.position??null'),
  '혼합 실전 현재 문항 번호 API 누락');
 const mixed=read('assets/ck-mixed-mock-v129.js');
 check(mixed.includes('ck129-mixed-sessions-v1'),'혼합 세트 별도 기록 키 누락');
 check(mixed.includes('DURATION=6000000'),'혼합 세트 100분 타이머 규칙 누락');
 check(mixed.includes('makeSet(set)'),'혼합 세트 배정 로직 누락');
 check(mixed.includes('matchesFixedPaper(s.set,s.ids)'),'백업된 고정 문항 순서·세트 소속 검증 누락');
 check(mixed.includes('data-ck130-review'),'혼합 결과 개인 풀이·근거 진입 버튼 누락');
 check(mixed.includes('ck130-result-filters'),'혼합 오답·미응답·보류 필터 UI 누락');
 const cssMixed=read('assets/ck-mixed-mock-v129.css');
 check(cssMixed.includes('.ck130-result-filters'),'혼합 결과 필터 CSS 누락');
 check(service.includes('htmlInsteadOfAsset(e.request,r)'),'HTML 대체 자산 캐시 보호 누락');
 check(service.includes('invalidCoreResponse(path,response)'),'HTTP 200 HTML 필수파일 활성화 방지 누락');
 check(service.includes('if(url.search)return null;'),'쿼리 다른 구버전 자산의 오프라인 폴백 차단 누락');
 check(diag.includes("type.includes('text/html')"),'오프라인 MIME 검사 누락');
 check(!/on:\s*push\b/.test(service),'서비스워커에 불필요한 푸시 이벤트가 포함됨');
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
