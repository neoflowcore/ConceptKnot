/* ConceptKnot v89: safely hydrate 2016–2020 official A-form records.
 * Local static file only; never invent missing records or alter existing keys.
 * A complete 400-record validation is required before publishing any entries.
 */
(function(){
'use strict';
const SOURCE='./data/official-2016-2020.json';
const YEARS=[2016,2017,2018,2019,2020];
let inFlight=null,ready=false,lastError='',loadedAt=0;
const isMark=n=>Number.isInteger(n)&&n>=1&&n<=5;
function validate(data){
 if(!Array.isArray(data)||data.length!==400)throw Error('2016~2020년 공식 자료는 정확히 400문항이어야 합니다.');
 const ids=new Set(),items=Object.create(null),byYear=Object.fromEntries(YEARS.map(y=>[y,0]));
 for(const q of data){
  if(!q||typeof q!=='object'||!YEARS.includes(q.year)||
   !Number.isInteger(q.number)||q.number<1||q.number>80||
   q.id!==q.year+'-'+q.number||ids.has(q.id)||
   q.subject!==(q.number<=40?'estate':'civil')||
   q.verified!==true||typeof q.question!=='string'||q.question.trim().length<5||
   !Array.isArray(q.options)||q.options.length!==5||
   q.options.some(x=>typeof x!=='string'||!x.trim())||
   !Array.isArray(q.correct)||q.correct.length===0||q.correct.length>5||
   new Set(q.correct.map(Number)).size!==q.correct.length||
   q.correct.some(x=>!isMark(Number(x)))||
   typeof q.originalUrl!=='string'||!/^https:\/\//.test(q.originalUrl)){
   throw Error('2016~2020년 데이터의 문항·선지·정답 구조 검증 실패');
  }
  ids.add(q.id);items[q.id]=q;byYear[q.year]++;
 }
 if(YEARS.some(y=>byYear[y]!==80))throw Error('연도별 공식 문항 수가 80개가 아닙니다.');
 return items;
}
function apply(records,destination=window.RECALL_OFFICIAL){
 if(!destination||typeof destination!=='object'||!Object.isExtensible(destination))
  throw Error('공식 문항 레지스트리가 없거나 수정할 수 없습니다.');
 const ids=Object.keys(records);
 if(ids.length!==400||ids.some(id=>Object.prototype.hasOwnProperty.call(destination,id)))
  throw Error('기존 공식 문항과 ID가 충돌합니다. 기존 데이터는 변경하지 않았습니다.');
 Object.assign(destination,records);
 return ids.length;
}
async function loadAll(){
 if(ready)return {ready:true,added:0,total:800};
 if(inFlight)return inFlight;
 inFlight=(async()=>{
  const response=await fetch(SOURCE,{cache:'force-cache'});
  if(!response.ok)throw Error('공식 기출 데이터 요청 실패 (HTTP '+response.status+')');
  const json=await response.json();
  const clean=validate(json);
  const existing=window.RECALL_OFFICIAL||{};
  // If a prior loader has already successfully registered everything, accept it only after full ID verification.
  const count=Object.keys(clean).filter(id=>Object.prototype.hasOwnProperty.call(existing,id)).length;
  if(count===400){
   for(const [id,q] of Object.entries(clean)){
    const record=existing[id];
    if(record?.year!==q.year||record?.number!==q.number||
      JSON.stringify(record.correct.map(Number))!==JSON.stringify(q.correct.map(Number)))
       throw Error('동일 ID의 공식 기출 내용이 다릅니다. 데이터 갱신을 중단했습니다.');
   }
   ready=true;lastError='';loadedAt=Date.now();
   return {ready:true,added:0,total:Object.keys(existing).length};
  }
  if(count!==0)throw Error('이전 공식 기출이 일부만 등록됐습니다. 자동 병합하지 않습니다.');
  const added=apply(clean,existing);
  ready=true;lastError='';loadedAt=Date.now();
  try{window.dispatchEvent(new CustomEvent('ck:official-bank-ready',{detail:{added,total:Object.keys(existing).length}}));}catch{}
  return {ready:true,added,total:Object.keys(existing).length};
 })().catch(error=>{
  lastError=String(error?.message||error);
  try{window.dispatchEvent(new CustomEvent('ck:official-bank-error',{detail:{message:lastError}}));}catch{}
  throw error;
 }).finally(()=>{inFlight=null});
 return inFlight;
}
function loadYear(year){
 const y=Number(year);
 if(!Number.isInteger(y)||y<2016||y>2025)return Promise.reject(Error('지원하지 않는 기출 연도입니다.'));
 if(y>=2021)return Promise.resolve({ready:true,added:0,total:Object.keys(window.RECALL_OFFICIAL||{}).length});
 return loadAll();
}
function getStatus(){
 const all=window.RECALL_OFFICIAL||{};
 return {ready,loading:!!inFlight,registered:Object.keys(all).length,legacyRegistered:
   Object.keys(all).filter(k=>/^(?:2016|2017|2018|2019|2020)-/.test(k)).length,
   source:SOURCE,lastError,loadedAt};
}
window.CK89OfficialBank=Object.freeze({validate,loadAll,loadYear,getStatus,apply});
function bootstrap(){
 // Fetch after initial layout, but without requiring a second user action.
 loadAll().catch(error=>{console.warn('공식 10개년 문제 불러오기 실패:',error.message);});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bootstrap,{once:true});
else bootstrap();
})();