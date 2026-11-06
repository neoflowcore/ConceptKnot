/* ConceptKnot v118 — opt-in Korean OCR with local-only editable research drafts.
 * This is NOT an authoritative transcription or official question import.
 * External CDN requests are for Tesseract code/language files, never user image uploads.
 */
(function(){
'use strict';
const KEY='ck118-personal-ocr-draft-v1',PAGE_KEY='ck120-ocr-page-drafts-v1';
const PAGE_MAX=90,PAGE_TEXT_MAX=45000,PAGE_STORE_LIMIT=1500000;
const LIB_URL='https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/tesseract.min.js';
const MAX_TEXT=80000,MAX_IMAGE=12*1024*1024,MAX_SOURCE_PIXELS=24000000,MAX_OCR_PIXELS=3000000;
let panel=null,host=null,frame=0,libPromise=null,worker=null;
let jobId=0,working=false,dirty=false,timer=0,lastRaw=null,issue='',draft=read();
const choices=['png','jpg','jpeg','webp','bmp'];
const safeSource=x=>String(x||'').slice(0,180).replace(/[\r\n\t]/g,' ');
let pageRaw=null,pageIssue='',pageStore=readPageStore();
function empty(){return {schemaVersion:1,source:'',text:'',updatedAt:0}}
function sanitize(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||value.schemaVersion!==1||
  typeof value.source!=='string'||value.source.length>180||typeof value.text!=='string'||
  value.text.length>MAX_TEXT||!Number.isFinite(value.updatedAt)||value.updatedAt<0||
  value.updatedAt>Date.now()+86400000)return null;
 return {schemaVersion:1,source:value.source,text:value.text,updatedAt:value.updatedAt};
}
function read(){
 try{
  const raw=localStorage.getItem(KEY);
  if(raw===null){lastRaw=null;issue='';return empty()}
  const parsed=sanitize(JSON.parse(raw));
  if(!parsed){issue='이전 OCR 초안 형식이 손상되어 원본 덮어쓰기를 차단했습니다.';lastRaw=raw;return empty()}
  lastRaw=raw;issue='';return parsed;
 }catch{
  issue='OCR 초안 저장소를 읽을 수 없어 덮어쓰기를 차단했습니다.';return empty();
 }
}
function status(message){
 const element=panel?.querySelector('[data-ck118-status]');
 if(element)element.textContent=message;
}
function setText(source,text){
 if(!panel)return;
 const area=panel.querySelector('[data-ck118-text]');
 if(!area)return;
 area.value=String(text||'').slice(0,MAX_TEXT);
 panel.querySelector('[data-ck118-source]').textContent='출처: '+safeSource(source);
 panel.dataset.ck118Source=safeSource(source);
 panel.dataset.ck120DocKey=draftPageKey(safeSource(source));
 panel.dataset.ck120Selected='';
 dirty=true;flush();
 preview();
}
function gather(){
 const input=panel?.querySelector('[data-ck118-text]');
 return {schemaVersion:1,source:safeSource(panel?.dataset.ck118Source||draft.source),
  text:(input?.value||'').slice(0,MAX_TEXT),updatedAt:Date.now()};
}
function flush(){
 if(!dirty)return true;
 clearTimeout(timer);timer=0;
 if(issue){status(issue+' 먼저 화면 초안을 TXT로 보존하세요.');return false}
 const next=sanitize(gather());if(!next)return false;
 try{
  if(localStorage.getItem(KEY)!==lastRaw){
   issue='다른 탭에서 OCR 초안을 수정했습니다. 자동 덮어쓰기를 차단했습니다.';
   status(issue+' TXT로 보존하세요.');return false;
  }
  const raw=JSON.stringify(next);
  localStorage.setItem(KEY,raw);
  lastRaw=raw;draft=next;dirty=false;
  status('내 OCR 초안을 이 브라우저에 저장했습니다. 원본 PDF·공식 정답 데이터는 변경하지 않았습니다.');
  return true;
 }catch{
  status('저장 공간·권한 오류입니다. 현재 초안을 TXT로 내려받아 보존하세요.');
  return false;
 }
}
function parseOptions(value){
 const text=String(value||'').replace(/\r\n?/g,'\n');
 const lines=text.split('\n');
 const out=[],marks={'①':1,'②':2,'③':3,'④':4,'⑤':5};
 for(let i=0;i<lines.length;i++){
  const line=lines[i].trim();
  const match=line.match(/^([①②③④⑤])\s*(.*)$/)||line.match(/^([1-5])[.)]\s+(.+)$/);
  if(!match)continue;
  const number=marks[match[1]]||Number(match[1]),value=String(match[2]||'').trim();
  if(value)out.push({number,text:value,line:i+1});
  if(out.length>=100)break;
 }
 const counts=new Set(out.map(x=>x.number));
 return {options:out,total:out.length,unique:counts.size,complete:counts.size===5&&out.length===5};
}
function preview(){
 if(!panel)return;
 const area=panel.querySelector('[data-ck118-text]');
 const result=parseOptions(area?.value);
 const target=panel.querySelector('[data-ck118-options]');
 if(!target)return;
 target.textContent=result.total?
  '분리 후보 '+result.total+'개 · 서로 다른 선지 번호 '+result.unique+'/5 · '+
  (result.complete?'①~⑤ 각 1개 감지':'수동 원문 대조 필요')+'\n'+
  result.options.slice(0,15).map(q=>q.number+'번 (OCR '+q.line+'행) '+q.text).join('\n'):
  '①~⑤ 선지 후보 없음. 글씨가 흐리거나 OCR이 틀렸을 수 있습니다.';
}
function loadLib(){
 if(window.Tesseract?.createWorker)return Promise.resolve(window.Tesseract);
 if(libPromise)return libPromise;
 libPromise=new Promise((resolve,reject)=>{
  const script=document.createElement('script');
  script.src=LIB_URL;script.async=true;script.crossOrigin='anonymous';
  script.onload=()=>window.Tesseract?.createWorker?
   resolve(window.Tesseract):reject(Error('OCR 엔진을 사용할 수 없습니다.'));
  script.onerror=()=>reject(Error('OCR 엔진 다운로드 실패. 인터넷 연결을 확인하세요.'));
  document.head.appendChild(script);
 }).catch(err=>{libPromise=null;throw err});
 return libPromise;
}
function buttons(disabled){
 if(!panel)return;
 panel.querySelectorAll('[data-ck118-scan]').forEach(b=>b.disabled=disabled);
 const imageInput=panel.querySelector('[data-ck118-file]');if(imageInput)imageInput.disabled=disabled;
 const cancel=panel.querySelector('[data-ck118-cancel]');
 if(cancel)cancel.disabled=!disabled;
}
function cancel(reason='OCR 중단'){
 if(!working&&!worker)return jobId;
 const id=++jobId,old=worker;worker=null;
 working=false;buttons(false);
 if(old){try{Promise.resolve(old.terminate()).catch(()=>{})}catch{}}
 status(reason+' · 이전 인식 결과가 화면에 반영되지 않도록 중단했습니다.');
 return id;
}
function validImage(file){
 if(!file||file.size<=0||file.size>MAX_IMAGE)return false;
 const ext=(file.name||'').split('.').pop().toLowerCase();
 return /^image\/(png|jpeg|webp|bmp)$/.test(file.type||'')||
  (file.type===''&&choices.includes(ext));
}
async function prepareImage(file){
 if(!validImage(file))throw Error('PNG/JPG/WebP/BMP 이미지 12MB 이하만 인식할 수 있습니다.');
 if(typeof createImageBitmap!=='function')
  throw Error('브라우저가 안전한 이미지 크기 검사를 지원하지 않습니다.');
 const image=await createImageBitmap(file);
 try{
  const width=Number(image.width),height=Number(image.height);
  if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0||
   width*height>MAX_SOURCE_PIXELS)
   throw Error('원본 이미지가 2,400만 화소를 초과합니다. 해상도를 줄인 뒤 다시 선택하세요.');
  const scale=Math.min(1,1800/width,2200/height,Math.sqrt(MAX_OCR_PIXELS/(width*height)));
  const canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.floor(width*scale));
  canvas.height=Math.max(1,Math.floor(height*scale));
  const ctx=canvas.getContext('2d');
  if(!ctx)throw Error('OCR 이미지 변환 캔버스를 만들지 못했습니다.');
  ctx.drawImage(image,0,0,canvas.width,canvas.height);
  return canvas;
 }finally{try{image.close?.()}catch{}}
}
async function recognize(kind,file){
 if(working||!panel?.isConnected)return false;
 const input=panel.querySelector('[data-ck118-text]');
 if(input?.value.trim()&&!window.confirm?.('현재 OCR 초안을 다른 결과로 교체할까요? 기존 초안은 먼저 TXT로 보관하는 것이 안전합니다.'))return false;
 const self=panel,scope=host,run=++jobId;
 working=true;buttons(true);
 let currentWorker=null;
 try{
  let inputImage=null,source='';
  if(kind==='image'){
   if(!validImage(file))throw Error('PNG/JPG/WebP/BMP 이미지 12MB 이하를 선택하세요.');
   inputImage=await prepareImage(file);
   if(run!==jobId||self!==panel||scope!==host)return false;
   source='이미지 '+safeSource(file.name);
  }else{
   const info=window.CKPDF15?.getState?.();
   if(!info||!info.pages)throw Error('먼저 원본 PDF를 열고 로딩을 완료하세요.');
   const page=info.page+(kind==='right'?1:0);
   if(kind==='right'&&(!info.spread||page>info.pages))throw Error('오른쪽 페이지 펼쳐보기를 먼저 켜세요.');
   status('PDF '+page+'쪽을 OCR용으로 렌더링합니다.');
   const snapshot=await window.CKPDF15.renderOcrPage(page);
   if(run!==jobId||self!==panel||scope!==host)return false;
   inputImage=snapshot.canvas;source='PDF '+snapshot.year+'년 '+snapshot.page+'쪽';
  }
  status('한국어·영어 OCR 엔진과 언어 파일을 확인합니다. 최초 실행은 인터넷이 필요합니다.');
  const lib=await loadLib();
  if(run!==jobId||self!==panel||scope!==host)return false;
  let displayed=-1;
  currentWorker=await lib.createWorker(['kor','eng'],1,{logger:entry=>{
   if(run!==jobId||!panel?.isConnected||!entry)return;
   const percent=Math.max(0,Math.min(100,Math.round((entry.progress||0)*100/10)*10));
   if(percent!==displayed){displayed=percent;status('OCR 처리 중 · '+String(entry.status||'인식')+' '+percent+'%');}
  }});
  if(run!==jobId||self!==panel||scope!==host)return false;
  worker=currentWorker;
  const output=await currentWorker.recognize(inputImage);
  if(run!==jobId||self!==panel||scope!==host)return false;
  const text=String(output?.data?.text||'').slice(0,MAX_TEXT);
  if(!text.trim()){status('인식된 문자가 없습니다. 원문이 너무 흐리거나 스캔 방향이 맞지 않을 수 있습니다.');return false}
  setText(source,text);
  status('OCR 검토 초안 · '+text.length+'자. 문제와 선지, 수식, 도표를 원본과 직접 대조하세요. 공식 기출에는 반영되지 않습니다.');
  return true;
 }catch(err){
  if(run===jobId&&self===panel)status('OCR 오류: '+String(err?.message||err));
  return false;
 }finally{
  if(worker===currentWorker)worker=null;
  if(currentWorker){try{await currentWorker.terminate()}catch{}}
  if(run===jobId){
   working=false;buttons(false);
  }
 }
}

function emptyPageStore(){return {schemaVersion:1,revision:0,items:[]}}
function sanitizePageStore(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||value.schemaVersion!==1||
  !Number.isSafeInteger(value.revision)||value.revision<0||value.revision>1000000||
  !Array.isArray(value.items)||value.items.length>PAGE_MAX)return null;
 const ids=new Set(),items=[];let size=0;
 for(const item of value.items){
  if(!item||typeof item!=='object'||Array.isArray(item)||
   typeof item.id!=='string'||!/^[0-9a-f-]{24,64}$/i.test(item.id)||ids.has(item.id)||
   typeof item.source!=='string'||item.source.length>180||
   typeof item.documentKey!=='string'||item.documentKey.length>200||
   typeof item.text!=='string'||item.text.length===0||item.text.length>PAGE_TEXT_MAX||
   !Number.isSafeInteger(item.updatedAt)||item.updatedAt<=0||
   item.updatedAt>Date.now()+86400000)return null;
  ids.add(item.id);size+=item.text.length+item.source.length+item.documentKey.length;
  if(size>PAGE_STORE_LIMIT)return null;
  items.push({id:item.id,source:item.source,documentKey:item.documentKey,
   text:item.text,updatedAt:item.updatedAt});
 }
 return {schemaVersion:1,revision:value.revision,items};
}
function readPageStore(){
 try{
  const raw=localStorage.getItem(PAGE_KEY);
  pageRaw=raw;
  if(raw===null){pageIssue='';return emptyPageStore()}
  if(raw.length>PAGE_STORE_LIMIT+200000)throw Error('size');
  const clean=sanitizePageStore(JSON.parse(raw));
  if(!clean)throw Error('schema');
  pageIssue='';return clean;
 }catch{
  pageIssue='페이지별 OCR 초안 보관함을 읽지 못했습니다. 원본을 보존하고 자동 덮어쓰기를 차단했습니다.';
  return emptyPageStore();
 }
}
function commitPageStore(next){
 if(pageIssue){
  status(pageIssue+' 손상 원본 JSON을 먼저 보존하거나 기존 페이지 자료를 새로고침하세요.');
  return false;
 }
 const clean=sanitizePageStore(next);
 if(!clean){status('OCR 페이지 보관 개수·크기·형식 한도를 초과했습니다. 기존 자료를 유지합니다.');return false}
 try{
  if(localStorage.getItem(PAGE_KEY)!==pageRaw){
   pageIssue='다른 브라우저 탭에서 OCR 페이지 보관함이 변경되었습니다. 자동 덮어쓰기를 차단했습니다.';
   status(pageIssue);renderPageQueue();return false;
  }
  const raw=JSON.stringify(clean);
  if(raw.length>PAGE_STORE_LIMIT+200000)throw Error('size');
  localStorage.setItem(PAGE_KEY,raw);
  pageRaw=raw;pageStore=clean;
  renderPageQueue();
  return true;
 }catch{
  status('페이지별 OCR 초안 저장 실패(저장 공간·권한). 현재 초안을 TXT로 보존하세요.');
  return false;
 }
}
function draftPageKey(source){
 if(!source.startsWith('PDF '))return '';
 return String(window.CKPDF15?.getState?.()?.documentKey||'').slice(0,200);
}
function archiveCurrentPage(){
 if(!panel?.isConnected)return false;
 const text=String(panel.querySelector('[data-ck118-text]')?.value||'');
 if(!text.trim()){status('저장할 OCR 초안 텍스트가 없습니다.');return false;}
 if(text.length>PAGE_TEXT_MAX){
  status('한 페이지 초안이 45,000자를 초과합니다. 현재 텍스트를 TXT로 저장하고 나누어 등록하세요.');
  return false;
 }
 if(pageStore.items.length>=PAGE_MAX){
  status('페이지 보관함 최대 90건입니다. 먼저 전체 TXT를 백업한 뒤 불필요한 페이지를 직접 삭제하세요.');
  return false;
 }
 const source=safeSource(panel.dataset.ck118Source||draft.source||'출처 미기록');
 const id=(window.crypto?.randomUUID?.()||
  [Date.now().toString(16).padStart(16,'0'),Math.floor(Math.random()*2**32).toString(16).padStart(8,'0')].join('-'));
 const item={id,source,documentKey:String(panel.dataset.ck120DocKey||'').slice(0,200),text,updatedAt:Date.now()};
 const saved=commitPageStore({schemaVersion:1,revision:pageStore.revision+1,
  items:pageStore.items.concat(item)});
 if(saved)status('OCR 페이지 초안 '+pageStore.items.length+'건째를 별도로 보관했습니다. 공식 기출 데이터에는 반영하지 않았습니다.');
 return saved;
}
function openArchivedPage(id){
 const entry=pageStore.items.find(i=>i.id===id);
 if(!entry||!panel?.isConnected)return false;
 const input=panel.querySelector('[data-ck118-text]');
 if(input?.value&&input.value!==entry.text&&!window.confirm?.(
  '현재 편집 중인 OCR 초안을 보관된 페이지로 교체할까요? 아직 보존하지 않았다면 취소 후 TXT 또는 페이지 보관을 먼저 진행하세요.'))return false;
 setText(entry.source,entry.text);
 panel.dataset.ck120DocKey=entry.documentKey;
 panel.dataset.ck120Selected=id;
 status('페이지 보관함에서 개인 OCR 초안을 불러왔습니다. 내용은 직접 원문과 대조하세요.');
 return true;
}
function deleteArchivedPage(id){
 const item=pageStore.items.find(i=>i.id===id);
 if(!item||!window.confirm?.('보관한 개인 OCR 초안 «'+item.source+'»을(를) 삭제할까요? 삭제 전 전체 TXT 또는 학습 JSON 백업을 권장합니다.'))return false;
 const saved=commitPageStore({schemaVersion:1,revision:pageStore.revision+1,
  items:pageStore.items.filter(i=>i.id!==id)});
 if(saved)status('선택한 개인 OCR 초안 1건을 삭제했습니다. 이 작업은 공식 문제·정답에 영향을 주지 않습니다.');
 return saved;
}
function pageStoreIsCurrent(){
 try{return !pageIssue&&localStorage.getItem(PAGE_KEY)===pageRaw}
 catch{return false}
}
function downloadPageText(){
 if(!pageStore.items.length){status('보관된 페이지별 OCR 초안이 없습니다.');return false;}
 if(!pageStoreIsCurrent()){
  status('다른 탭에서 OCR 보관함을 변경했거나 저장소를 읽지 못했습니다. 최신 기록을 다시 불러온 후 TXT를 생성하세요.');
  return false;
 }
 if(dirty){
  status('현재 편집 중인 OCR 페이지가 아직 저장되지 않았습니다. 먼저 현재 페이지를 보관한 뒤 전체 TXT를 내려받으세요.');
  return false;
 }
 try{
  const lines=['ConceptKnot 개인 OCR 페이지 보관 초안',
   '자동 인식·편집 결과는 검토되지 않았습니다. 공식 시험 원문/정답/해설이 아닙니다.',
   '수식·그림·선지 ①~⑤은 공식 원본과 개별 대조 필요.'];
  for(const [index,item] of pageStore.items.entries()){
   lines.push('','======== '+(index+1)+'번째 개인 초안 ========',
    '출처: '+item.source,'PDF 식별키: '+(item.documentKey||'(이미지 또는 미기록)'),
    '수정 시각: '+new Date(item.updatedAt).toISOString(),'',item.text);
  }
  // A storage event can arrive after a different tab has written. Re-read before download.
  if(!pageStoreIsCurrent()){
   status('내보내기 직전 OCR 보관함이 변경됐습니다. 이전 목록으로 된 TXT를 생성하지 않았습니다.');
   return false;
  }
  const blob=new Blob(['\uFEFF'+lines.join('\n')],{type:'text/plain;charset=utf-8'});
  const url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download='ConceptKnot_OCR_페이지별_검토초안_'+new Date().toISOString().slice(0,10)+'.txt';
  document.body.appendChild(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),3000);
  status('OCR 페이지 '+pageStore.items.length+'건의 TXT 다운로드를 요청했습니다. 파일 저장 여부를 확인하세요.');
  return true;
 }catch{status('OCR 페이지 TXT 저장에 실패했습니다. 페이지별 초안은 로컬에 그대로 있습니다.');return false}
}
function exportPageRaw(){
 if(pageRaw===null){status('보존할 원본 JSON이 없습니다.');return false;}
 try{
  const blob=new Blob([pageRaw],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download='ConceptKnot_OCR_페이지보관_원본_수정금지.json';
  document.body.appendChild(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),3000);return true;
 }catch{return false}
}
function refreshPageStore(){
 pageStore=readPageStore();renderPageQueue();
 status(pageIssue||'현재 브라우저 저장소에서 OCR 페이지 보관함을 다시 불러왔습니다.');
 return !pageIssue;
}
function renderPageQueue(){
 const holder=panel?.querySelector('[data-ck120-page-list]');
 if(!holder)return;
 holder.replaceChildren();
 const info=document.createElement('p');
 info.className='ck120-page-note';
 info.textContent='개인 OCR 초안 '+pageStore.items.length+'/'+PAGE_MAX+'건 · 실전 기출 자동 등록 없음';
 holder.appendChild(info);
 if(pageIssue){
  const warning=document.createElement('p');warning.setAttribute('role','alert');
  warning.textContent=pageIssue;holder.appendChild(warning);
 }
 for(const entry of pageStore.items.slice().reverse()){
  const row=document.createElement('div');row.className='ck120-page-entry';
  const title=document.createElement('strong');
  title.textContent=entry.source+' · '+new Date(entry.updatedAt).toLocaleDateString('ko-KR')+
   ' · '+entry.text.length+'자';
  const openButton=document.createElement('button');openButton.type='button';
  openButton.textContent='불러오기';openButton.dataset.ck120Open=entry.id;
  const deleteButton=document.createElement('button');deleteButton.type='button';
  deleteButton.textContent='삭제';deleteButton.dataset.ck120Delete=entry.id;
  row.append(title,openButton,deleteButton);holder.appendChild(row);
 }
}

function exportTxt(){
 const textarea=panel?.querySelector('[data-ck118-text]');
 if(!textarea?.value)return false;
 try{
  const label=panel.dataset.ck118Source||draft.source||'직접 편집';
  const value='ConceptKnot 개인 OCR 검토 초안\n출처: '+label+
   '\n자동 인식 결과는 공식 원문/해설이 아닙니다. 수식·그림·①~⑤ 원문 대조 필수.\n\n'+textarea.value;
  const blob=new Blob(['\uFEFF',value],{type:'text/plain;charset=utf-8'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='ConceptKnot_OCR_검토초안_'+new Date().toISOString().slice(0,10)+'.txt';
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),3000);
  status('OCR 검토 초안 TXT 다운로드를 요청했습니다. 파일이 저장됐는지 확인하세요.');
  return true;
 }catch{status('TXT 다운로드에 실패했습니다. 직접 복사해 보존하세요.');return false}
}
function exportDamaged(){
 try{
  if(lastRaw===null)return false;
  const blob=new Blob([lastRaw],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='ConceptKnot_OCR_손상원본_수정금지.json';
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
  return true;
 }catch{return false}
}
function mount(){
 const next=document.querySelector('#main .ck15-pdf-host');
 if(next===host&&panel?.isConnected)return;
 if(next!==host&&working)cancel('다른 화면으로 이동해 OCR 취소');
 if(dirty)flush();
 host=next||null;panel=null;
 if(!next)return;
 const area=document.createElement('section');
 area.className='ck118-ocr';area.setAttribute('data-ck118-ocr','');
 area.dataset.ck118Source=draft.source||'';
 area.dataset.ck120DocKey=''; // v118 single-draft backups have no trusted PDF fingerprint.
 area.innerHTML='<details><summary><strong>내 이미지·PDF OCR 연구 도구</strong><small>직접 실행 · 공식 검증 아님</small></summary>'+
  '<p>선택한 PDF 한 페이지 또는 개인 이미지 한 장을 한국어·영어로 인식합니다. 초기 엔진/언어 다운로드는 인터넷이 필요합니다. 사용자 이미지의 OCR 인식은 브라우저에서 수행합니다.</p>'+
  '<div class="ck118-ocr-actions">'+
  '<button type="button" data-ck118-scan="left">현재 왼쪽 페이지 OCR</button>'+
  '<button type="button" data-ck118-scan="right">현재 오른쪽 페이지 OCR</button>'+
  '<label>이미지 선택<input type="file" data-ck118-file accept="image/png,image/jpeg,image/webp,image/bmp,.jpg"></label>'+
  '<button type="button" data-ck118-cancel disabled>OCR 중단</button></div>'+
  '<p class="ck118-ocr-status" data-ck118-status role="status">OCR은 사용자가 누를 때만 실행됩니다.</p>'+
  '<label class="ck118-ocr-editor">OCR 검토 초안 (직접 수정 가능)<span data-ck118-source></span>'+
  '<textarea data-ck118-text maxlength="80000" rows="7" spellcheck="false" placeholder="OCR 초안이 이곳에 나타납니다. 문제·5개 선지·수식·그림은 원본을 보고 수정하세요."></textarea></label>'+
  '<div class="ck118-ocr-actions"><button type="button" data-ck118-export>검토 초안 TXT</button>'+
  '<button type="button" data-ck118-preview>①~⑤ 임시 분리</button>'+
  '<button type="button" data-ck118-damaged>손상 원본 JSON 보존</button></div>'+
  '<pre class="ck118-ocr-options" data-ck118-options aria-live="polite"></pre>'+
  '<div class="ck118-ocr-actions"><button type="button" data-ck120-save>이 페이지 초안 보관</button>'+
  '<button type="button" data-ck120-export>보관 페이지 전체 TXT</button>'+
  '<button type="button" data-ck120-refresh>다른 탭 변경 다시 불러오기</button>'+
  '<button type="button" data-ck120-raw>보관함 원본 JSON 백업</button></div>'+
  '<div class="ck120-page-list" data-ck120-page-list role="region" aria-label="개인 OCR 페이지별 보관함"></div>'+
  '<small>OCR 결과는 개인 연구 초안으로 저장됩니다. 공식 800문항·정답·선지 판단·해설을 자동 변경하지 않습니다.</small></details>';
 const anchor=next.querySelector('[data-ck117-pdf-tools]');
 if(anchor?.parentNode)anchor.insertAdjacentElement('afterend',area);
 else next.appendChild(area);
 panel=area;
 panel.querySelector('[data-ck118-text]').value=draft.text;
 panel.querySelector('[data-ck118-source]').textContent='출처: '+(draft.source||'미기록');
 const damaged=panel.querySelector('[data-ck118-damaged]');
 if(damaged)damaged.hidden=!issue;
 if(issue)status(issue+' 기존 초안을 덮어쓰지 않습니다.');
 preview();renderPageQueue();
}
function schedule(){
 if(frame)return;
 frame=requestAnimationFrame(()=>{frame=0;mount();});
}
document.addEventListener('click',event=>{
 const t=event.target?.closest?.('[data-ck118-scan],[data-ck118-cancel],[data-ck118-export],'+
  '[data-ck118-preview],[data-ck118-damaged],[data-ck120-save],[data-ck120-export],'+
  '[data-ck120-refresh],[data-ck120-raw],[data-ck120-open],[data-ck120-delete]');
 if(!t||!panel?.contains(t))return;
 event.preventDefault();
 if(t.hasAttribute('data-ck118-scan')){recognize(t.dataset.ck118Scan);return}
 if(t.hasAttribute('data-ck118-cancel')){cancel();return}
 if(t.hasAttribute('data-ck118-export')){exportTxt();return}
 if(t.hasAttribute('data-ck118-preview')){preview();return}
 if(t.hasAttribute('data-ck118-damaged')){exportDamaged();return}
 if(t.hasAttribute('data-ck120-save')){archiveCurrentPage();return}
 if(t.hasAttribute('data-ck120-export')){downloadPageText();return}
 if(t.hasAttribute('data-ck120-refresh')){refreshPageStore();return}
 if(t.hasAttribute('data-ck120-raw')){exportPageRaw();return}
 if(t.hasAttribute('data-ck120-open')){openArchivedPage(t.dataset.ck120Open);return}
 if(t.hasAttribute('data-ck120-delete')){deleteArchivedPage(t.dataset.ck120Delete);return}
});
document.addEventListener('change',event=>{
 const t=event.target;
 if(!t?.matches?.('[data-ck118-file]')||!panel?.contains(t))return;
 const file=t.files?.[0];t.value='';
 if(file)recognize('image',file);
});
document.addEventListener('input',event=>{
 if(!event.target?.matches?.('[data-ck118-text]')||!panel?.contains(event.target))return;
 dirty=true;clearTimeout(timer);timer=setTimeout(flush,450);preview();
});
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancel('브라우저가 숨겨져 OCR 취소');flush();}});
window.addEventListener('ck:pen-deactivate',()=>cancel('다른 탭 이동으로 OCR 취소'));
window.addEventListener('blur',()=>cancel('브라우저 포커스 해제로 OCR 취소'));
window.addEventListener('storage',event=>{
 if(event.key===PAGE_KEY){
  if(event.newValue!==pageRaw){
   pageIssue='다른 브라우저 탭에서 페이지별 OCR 보관함이 변경되었습니다. 최신 자료를 직접 다시 불러와야 저장할 수 있습니다.';
   renderPageQueue();status(pageIssue);
  }
  return;
 }
 if(event.key!==KEY)return;
 if(dirty){issue='다른 탭이 OCR 초안을 변경했습니다. 현재 입력은 TXT로 보존하세요.';status(issue);return}
 draft=read();if(panel?.isConnected){panel.querySelector('[data-ck118-text]').value=draft.text;panel.dataset.ck118Source=draft.source;preview();}
});
window.addEventListener('beforeunload',event=>{if(dirty&&!flush()){event.preventDefault();event.returnValue='';}});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});
else schedule();
const main=document.getElementById('main');
if(main&&window.MutationObserver)new MutationObserver(changes=>{
 if(changes.some(x=>x.addedNodes?.length||x.removedNodes?.length))schedule();
}).observe(main,{subtree:true,childList:true});
window.CK118OCR=Object.freeze({
 sanitize,sanitizePageStore,parseOptions,flush,cancel,archiveCurrentPage,refreshPageStore,
 pageStoreIsCurrent,
 getPageStatus:()=>({count:pageStore.items.length,issue:pageIssue,revision:pageStore.revision}),
 getState:()=>({working,dirty,issue,source:draft.source,hasDraft:Boolean(draft.text),connected:Boolean(panel?.isConnected)}),
 open:()=>{if(!panel?.isConnected)mount();const details=panel?.querySelector('details');if(details)details.open=true;return Boolean(details)},
 canLeave:()=>flush()
});
})();