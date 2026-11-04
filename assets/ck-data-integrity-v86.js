/* ConceptKnot v112 — guarded 10-year personal backups and restore.
 * One browser turn, synchronous writes, best-effort rollback on partial failure.
 * This is not a cross-tab transactional database. No network or remote sync.
 */
(function(){
'use strict';
const MAX_FILE=16*1024*1024;
const KEY_LIMITS=Object.freeze({
 'ck10-exam-final-v1':250000,
 'ck11-final-page-count':8,
 'ck80-explain-drafts-v1':3500000,
 'ck81-review-workbench-v1':1000000,
 'ck82-exam-sessions-v1':2300000,
 'ck83-personal-concept-links-v1':5200000,
 'ck84-study-plan-v1':20000,
 'ck84-personal-materials-v1':2400000,
 'ck115-manual-device-verification-v1':50000,
 'ck118-personal-ocr-draft-v1':120000,
 'ck120-ocr-page-drafts-v1':1800000
});
const BAD='학습기록 백업에 유효하지 않은 자료가 있습니다.';
const isObject=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const has=(obj,k)=>Object.prototype.hasOwnProperty.call(obj,k);
const toUnique=arr=>[...new Set(arr)];
function validateMain(data,defaults){
 if(!isObject(data)||!isObject(defaults)||!['estate','civil'].includes(data.subject))throw Error('학습기록 본문/과목 구조 오류');
 const required=['answers','quizAnswers','flashVisits'];
 if(required.some(k=>!isObject(data[k])))throw Error('기존 학습기록 필수 항목이 누락되었습니다.');
 const obj={...defaults};
 for(const k of Object.keys(defaults)){
  if(!has(data,k))continue;
  const value=data[k],template=defaults[k];
  if(Array.isArray(template)&&!Array.isArray(value))throw Error('배열 기록 형식 오류: '+k);
  if(isObject(template)&&!isObject(value))throw Error('객체 기록 형식 오류: '+k);
  if(typeof template==='string'&&typeof value!=='string')throw Error('문자열 기록 형식 오류: '+k);
  if(typeof template==='number'&&(!Number.isFinite(value)))throw Error('숫자 기록 형식 오류: '+k);
  if(typeof template==='boolean'&&typeof value!=='boolean')throw Error('선택 설정 형식 오류: '+k);
  obj[k]=value;
 }
 return obj;
}
function validateFinal(value){
 const a=JSON.parse(value);
 if(!Array.isArray(a)||a.length!==5||a.some(row=>!Array.isArray(row)||row.length!==2))return false;
 return value.length<=KEY_LIMITS['ck10-exam-final-v1'];
}
function validateDraft(value){
 const x=JSON.parse(value);
 if(!isObject(x)||Object.keys(x).length>800)return false;
 for(const [id,v] of Object.entries(x)){
  if(!/^20(?:1[6-9]|2[0-5])-(?:[1-9]|[1-7]\d|80)$/.test(id)||!isObject(v))return false;
  // Keep legacy partial user drafts readable while prohibiting automatic
  // publication or malformed option structures in a restore.
  if(v.published===true||v.status==='published')return false;
  if(typeof v.summaryEasy!=='undefined'&&typeof v.summaryEasy!=='string')return false;
  if(typeof v.answerReason!=='undefined'&&typeof v.answerReason!=='string')return false;
  if(typeof v.evidence!=='undefined'&&typeof v.evidence!=='string')return false;
  if(v.options!==undefined&&(!Array.isArray(v.options)||v.options.length!==5||
    v.options.some((opt,i)=>!isObject(opt)||opt.no!==i+1||
      !['unreviewed','true','false','unknown'].includes(opt.verdict)||
      (opt.source!==undefined&&(typeof opt.source!=='string'||opt.source.length>260)))))return false;
 }
 return true;
}
function validationMethod(key){
 const map={
  'ck81-review-workbench-v1':()=>window.CK81Workbench?.sanitizeProgress,
  'ck82-exam-sessions-v1':()=>window.CK82FullExam?.cleanStore,
  'ck83-personal-concept-links-v1':()=>window.CK83Links?.sanitize,
  'ck84-study-plan-v1':()=>window.CK84Plan?.sanitize,
  'ck84-personal-materials-v1':()=>window.CK84Materials?.sanitize,
  'ck115-manual-device-verification-v1':()=>window.CK115QA?.sanitize,
  'ck118-personal-ocr-draft-v1':()=>window.CK118OCR?.sanitize,
  'ck120-ocr-page-drafts-v1':()=>window.CK118OCR?.sanitizePageStore
 };
 return map[key]?.();
}
function validateExtra(key,value){
 if(!has(KEY_LIMITS,key))throw Error('지원하지 않는 개인 기록 키: '+key);
 if(typeof value!=='string'||value.length>KEY_LIMITS[key])throw Error('개인 기록 용량/형식 오류: '+key);
 if(key==='ck11-final-page-count')return /^[1-5]$/.test(value);
 try{
  if(key==='ck10-exam-final-v1')return validateFinal(value);
  if(key==='ck80-explain-drafts-v1')return validateDraft(value);
  const check=validationMethod(key);
  if(typeof check!=='function')throw Error('복원 검사기를 불러오지 못했습니다: '+key);
  return Boolean(check(JSON.parse(value)));
 }catch(e){if(String(e.message).includes('검사기'))throw e;return false;}
}
function stage(data,defaults,keys=Object.keys(KEY_LIMITS)){
 const state=validateMain(data,defaults);
 if(data.__ck79Extras!==undefined&&(!isObject(data.__ck79Extras)||
  data.__ck79Extras.format!==1||!isObject(data.__ck79Extras.local)))throw Error('추가 학습기록 백업 구조가 유효하지 않습니다.');
 const local=data.__ck79Extras?.local||{},entries=[];
 const allowed=new Set(keys);
 for(const k of Object.keys(local)){
  if(!has(KEY_LIMITS,k))throw Error('현재 버전에서 지원하지 않는 백업 키가 있습니다: '+k+' · 자동 삭제하지 않았습니다.');
  if(!allowed.has(k))throw Error('이 백업은 선택한 복원 범위 밖의 기록을 포함합니다: '+k);
  if(!validateExtra(k,local[k]))throw Error('추가 학습기록의 검증 실패: '+k);
  entries.push([k,local[k]]);
 }
 return {state,entries,mainKey:'recallgraph-first-exam-v1',
  summary:{main:'학습 답안·노트',extras:entries.map(([k])=>k),bytes:JSON.stringify(data).length}};
}
function transaction(entries,storage=localStorage){
 if(!Array.isArray(entries)||entries.some(x=>!Array.isArray(x)||x.length!==2||
  typeof x[0]!=='string'||typeof x[1]!=='string'))throw Error('복원 저장자료 형식 오류');
 const unique=toUnique(entries.map(x=>x[0]));
 if(unique.length!==entries.length)throw Error('중복 백업 키가 있습니다.');
 const before=new Map(),changed=[];
 try{
  for(const key of unique)before.set(key,storage.getItem(key));
  for(const [key,value] of entries){
   changed.push(key); // Include the failing key in rollback if custom storage throws after a write.
   storage.setItem(key,value);
  }
  return {ok:true,changed:changed.slice(),rolledBack:[],rollbackFailures:[]};
 }catch(err){
  const rollbackFailures=[],rolledBack=[];
  for(const key of changed.reverse()){
   try{
    const prior=before.get(key);
    if(prior===null)storage.removeItem(key);
    else storage.setItem(key,prior);
    rolledBack.push(key);
   }catch(_){rollbackFailures.push(key);}
  }
  return {ok:false,reason:String(err?.message||err),rolledBack,rollbackFailures};
 }
}
function apply(prepared,storage=localStorage){
 if(!prepared||!isObject(prepared.state)||!Array.isArray(prepared.entries)||!prepared.mainKey)throw Error('검증되지 않은 백업입니다.');
 if(prepared.mainKey!=='recallgraph-first-exam-v1'||prepared.entries.some(([key])=>!has(KEY_LIMITS,key)))
  throw Error('복원 범위와 학습기록 키가 일치하지 않습니다.');
 const entries=prepared.entries.concat([[prepared.mainKey,JSON.stringify(prepared.state)]]);
 return transaction(entries,storage);
}
function restoreExtras(data,keys,storage=localStorage){
 if(data?.__ck79Extras==null)return {ok:true,changed:[],rollbackFailures:[]};
 const extra=data.__ck79Extras;
 if(!isObject(extra)||extra.format!==1||!isObject(extra.local))throw Error('추가 기록 백업 구조 오류');
 const entries=[],selected=new Set(keys||Object.keys(KEY_LIMITS));
 for(const [key,raw] of Object.entries(extra.local)){
  if(!has(KEY_LIMITS,key))throw Error('지원하지 않는 추가 기록이 있습니다: '+key);
  if(!selected.has(key))throw Error('선택한 복원 범위 밖의 기록이 있습니다: '+key);
  if(!validateExtra(key,raw))throw Error('추가 개인 기록 검증 실패: '+key);
  entries.push([key,raw]);
 }
 return transaction(entries,storage);
}
function validateRestoreFile(file){
 if(!file||typeof file.size!=='number'||file.size<1||file.size>MAX_FILE)throw Error('백업 파일은 16MB 이하 JSON이어야 합니다.');
 return true;
}
window.CK86Integrity=Object.freeze({validateMain,validateExtra,stage,apply,transaction,restoreExtras,
 validateRestoreFile,MAX_FILE,keyLimits:KEY_LIMITS,getStatus:()=>({scope:'browser-only',rollback:'best-effort'})});
})();