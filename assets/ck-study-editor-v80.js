/* ConceptKnot v102: timestamp-aware, non-destructive personal JSON merge.
 * Pure local helper; never writes storage, official keys, network or caches.
 * A missing/untrusted timestamp may add a new item but cannot replace an existing one.
 */
(function(){
'use strict';
const DAY=86400000;
const own=(obj,key)=>Object.prototype.hasOwnProperty.call(obj,key);
const plain=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
function timestamp(value){
 let number=0;
 if(typeof value==='number')number=value;
 else if(typeof value==='string'&&value.trim()){
  number=/^\d+$/.test(value.trim())?Number(value):Date.parse(value);
 }
 return Number.isFinite(number)&&number>0&&number<=Date.now()+DAY?number:0;
}
function records(current,incoming){
 if(!plain(current)||!plain(incoming))throw Error('개인 기록 병합 형식 오류');
 const merged=Object.assign(Object.create(null),current);
 let added=0,updated=0,preserved=0;
 for(const [id,row] of Object.entries(incoming)){
  if(!own(current,id)){merged[id]=row;added++;continue;}
  if(timestamp(row?.updatedAt)>timestamp(current[id]?.updatedAt)){
   merged[id]=row;updated++;
  }else preserved++;
 }
 return {merged,added,updated,preserved,changed:added+updated,
  overlap:updated+preserved};
}
function documents(current,incoming,max=35){
 if(!Array.isArray(current)||!Array.isArray(incoming))throw Error('교재 기록 병합 형식 오류');
 const source=Object.create(null),seen=new Set();
 for(const row of current){
  if(!plain(row)||typeof row.id!=='string'||seen.has(row.id))throw Error('기존 자료 ID가 중복되거나 손상되었습니다.');
  seen.add(row.id);source[row.id]=row;
 }
 const proposal=Object.create(null),newDocs=[];
 let added=0,updated=0,preserved=0;
 const incomingSeen=new Set();
 for(const row of incoming){
  if(!plain(row)||typeof row.id!=='string'||incomingSeen.has(row.id))throw Error('백업 자료 ID가 중복되거나 손상되었습니다.');
  incomingSeen.add(row.id);
  if(!own(source,row.id)){newDocs.push(row);added++;continue;}
  if(timestamp(row.updatedAt)>timestamp(source[row.id]?.updatedAt)){
   proposal[row.id]=row;updated++;
  }else preserved++;
 }
 const merged=[...newDocs,...current.map(row=>own(proposal,row.id)?proposal[row.id]:row)];
 if(merged.length>max)throw Error('자료 병합 후 최대 '+max+'건을 초과합니다.');
 return {merged,added,updated,preserved,changed:added+updated,
  overlap:updated+preserved};
}
window.CK102Restore=Object.freeze({timestamp,records,documents});
})();
/* ConceptKnot P4 editorial desk v112 — full 10-year local source-aware draft workspace.
 * It never alters canonical exam data or labels an unreviewed answer "published".
 */
(function(){
'use strict';
const KEY='ck80-explain-drafts-v1',MAX_RECORDS=800;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const questionId=id=>/^20(?:1[6-9]|2[0-5])-(?:[1-9]|[1-7]\d|80)$/.test(String(id||''));
const MAX={short:450,reason:4000,option:1600,source:260,evidence:1200,hold:550};
const clip=(v,n)=>String(v??'').trim().slice(0,n);
let selected='',record=null,loaded=new Map(),open=false,editing=false,lastStatus='대기';
let storageIssue='',lastRaw=undefined;
const store=()=>{
 try{
  const raw=localStorage.getItem(KEY);
  if(raw===null){if(lastRaw===undefined)lastRaw=null;storageIssue='';return {};}
  const data=JSON.parse(raw);
  if(!data||typeof data!=='object'||Array.isArray(data)){
   storageIssue='개인 해설 초안 저장 형식이 손상되었습니다. 내 데이터에서 원본을 내려받으세요.';
   return {};
  }
  if(lastRaw===undefined)lastRaw=raw;
  storageIssue='';return data;
 }catch{
  storageIssue='개인 해설 초안 저장 내용을 읽지 못했습니다. 기존 데이터를 보호하기 위해 저장을 차단합니다.';
  return {};
 }
};
const count=()=>Object.keys(store()).filter(questionId).length;
function saveToStore(id,draft){
 if(!questionId(id)||!draft||typeof draft!=='object')return false;
 const current=store();
 if(storageIssue||Object.keys(current).filter(questionId).length>=MAX_RECORDS&&
    !Object.prototype.hasOwnProperty.call(current,id))return false;
 try{
  const raw=localStorage.getItem(KEY);
  if(lastRaw!==raw){
   storageIssue='다른 탭에서 해설 초안이 수정되었습니다. 기존 편집본을 백업하고 새로고침해 주세요.';
   return false;
  }
  current[id]=draft;
  const next=JSON.stringify(current);
  localStorage.setItem(KEY,next);lastRaw=next;storageIssue='';return true;
 }catch{return false;}
}
function patchYear(year){
 if(loaded.has(year))return Promise.resolve(loaded.get(year));
 // 2016–2020 have 400 verified questions but NO official explanation JSON.
 // Open an empty personal draft; never fabricate a source-backed answer.
 if(Number.isInteger(year)&&year>=2016&&year<=2020){
  const unseeded=new Map();loaded.set(year,unseeded);return Promise.resolve(unseeded);
 }
 if(!Number.isInteger(year)||year<2021||year>2025)return Promise.reject(Error('지원하지 않는 연도'));
 return fetch('./data/explanations/official-'+year+'.json',{cache:'force-cache'})
  .then(res=>{if(!res.ok)throw Error('문항 데이터 불러오기 '+res.status);return res.json();})
  .then(data=>{
   if(data.year!==year||!Array.isArray(data.records)||data.records.length!==80)
    throw Error('해설 데이터 연도/80건 구조 불일치');
   const ids=new Set();
   for(const entry of data.records){
    const base=q(entry.questionId);
    if(!base||base.year!==year||entry.examYear!==year||entry.number!==base.number||
      entry.subject!==base.subject||ids.has(entry.questionId)||
      !Array.isArray(entry.options)||entry.options.length!==5||
      entry.options.some((o,i)=>o?.no!==i+1)||
      !Array.isArray(entry.officialAnswer)||
      base.correct.slice().map(Number).sort((a,b)=>a-b).join(',')!==
        entry.officialAnswer.slice().map(Number).sort((a,b)=>a-b).join(','))
     throw Error('해설 원문/선지/채점 인정 연결 오류: '+String(entry.questionId));
    ids.add(entry.questionId);
   }
   if(ids.size!==80)throw Error('해설 문항 중복 또는 누락');
   const map=new Map(data.records.map(r=>[r.questionId,r]));loaded.set(year,map);return map;
  });
}
function q(id){const item=window.RECALL_OFFICIAL?.[id];return item?.verified===true?item:null;}
function compareDraft(id,base){
 const user=store()[id];
 if(user?.status==='draft'||user?.status==='review_hold')return user;
 return {questionId:id,status:'draft',summaryEasy:clip(base?.summaryEasy,MAX.short),
  answerReason:clip(base?.answerReason,MAX.reason),
  options:Array.from({length:5},(_,i)=>({
   no:i+1,verdict:'unreviewed',why:clip(base?.options?.[i]?.draftReason,MAX.option),source:''
  })),
  evidence:'',reviewHoldReason:'',examAsOf:id.slice(0,4),
  updatedAt:null,source:'official-question-rooted study draft, not an editorial publication',
  sourceChecked:false,reasonReviewed:false,published:false};
}
function root(){return document.querySelector('#ck78-analysis-dialog');}
function panel(){return root()?.querySelector('[data-ck80-workspace]');}
function setStatus(text){
 lastStatus=text;const node=panel()?.querySelector('[data-ck80-status]');if(node)node.textContent=text;
}
function existing(id,base){return compareDraft(id,base);}

function refreshCoverage(){
 const w=panel(),node=w?.querySelector('[data-ck113-coverage]');
 if(!node)return;
 const fields=selector=>Array.from(w.querySelectorAll(selector));
 const assessed=fields('[data-ck80-option-verdict]').filter(x=>['true','false','unknown'].includes(x.value)).length;
 const reasons=fields('[data-ck80-option-reason]').filter(x=>String(x.value||'').trim()).length;
 const sources=fields('[data-ck80-option-source]').filter(x=>String(x.value||'').trim()).length;
 node.textContent='현재 입력 · 선지 판단 '+assessed+'/5 · 이유 '+reasons+'/5 · 개인 근거 '+sources+'/5 (저장 전에는 반영되지 않음)';
}
function editorHtml(d){
 const item=q(d.questionId),sourceCount=count();
 const sel=(val,label,active)=>'<option value="'+val+'"'+(val===active?' selected':'')+'>'+label+'</option>';
 return '<div class="ck80-editor-summary"><span><strong>개인 검토 초안 '+sourceCount+'개</strong> · 공식 게시 콘텐츠와 분리 저장</span>'+
  (item?.year<=2020?'<p><strong>2016~2020년은 기본 해설 자료가 아직 제공되지 않습니다.</strong> 빈 개인 작성 칸으로 시작하며, 원문·법령·판례 근거를 직접 확인해 기록하세요.</p>':'')+
  '<p>공식 최종정답('+esc(item?.correct?.join(' 또는 ')||'-')+'번)은 수정할 수 없습니다. 선지 판단은 직접 근거를 확인한 경우에만 기록하고, 여기에서 게시 완료로 전환하지 않습니다.</p></div>'+
  '<label>15초 쉬운 설명 <textarea rows="3" data-ck80-field="summaryEasy" maxlength="'+MAX.short+'">'+esc(d.summaryEasy)+'</textarea></label>'+
  '<label>공식 정답에 해당하는 논리 · 출처 대조 전 <textarea rows="5" data-ck80-field="answerReason" maxlength="'+MAX.reason+'">'+esc(d.answerReason)+'</textarea></label>'+
  '<div class="ck80-editor-options"><h4>①~⑤ 선지별 검토</h4>'+
  Array.from({length:5},(_,i)=>{
   const v=d.options?.[i]||{verdict:'unreviewed',why:''};
   return '<div class="ck80-editor-option"><label>선지 '+(i+1)+' ('+
    (item?.correct?.includes(i+1)?'공식 채점 인정':'공식 채점 미인정')+
    ') <select data-ck80-option-verdict="'+i+'">'+
    sel('unreviewed','근거 미검수',v.verdict)+sel('true','참 · 개인 검토',v.verdict)+
    sel('false','거짓 · 개인 검토',v.verdict)+sel('unknown','진위 보류',v.verdict)+
    '</select></label><textarea rows="2" maxlength="'+MAX.option+'" data-ck80-option-reason="'+i+'" '+
    'placeholder="이 지문의 성립 요건과 근거를 적으세요">'+esc(v.why)+'</textarea>'+
    '<label class="ck80-option-citation">개인 근거 출처 · 미검수<textarea rows="2" maxlength="'+MAX.source+'" data-ck80-option-source="'+i+'" '+
    'placeholder="조문·판례번호·원문 PDF 쪽수·시험 당시 시행일 등">'+esc(v.source||'')+'</textarea></label></div>';
  }).join('')+'</div>'+
  '<label>원문·조문·판례 출처 확인 메모 <textarea rows="3" data-ck80-field="evidence" maxlength="'+MAX.evidence+'" '+
  'placeholder="출처 문서, URL, 시험 당시 시행 시점, 대조한 PDF 페이지 등">'+esc(d.evidence)+'</textarea></label>'+
  '<label>편집 상태 <select data-ck80-field="status">'+
    sel('draft','초안(검수 완료 아님)',d.status)+sel('review_hold','근거 확인 필요 · 보류',d.status)+'</select></label>'+
  '<label>검수 보류 사유 <textarea rows="2" data-ck80-field="reviewHoldReason" maxlength="'+MAX.hold+'" '+
    'placeholder="법령 당시 기준/원문 도표/선지 진위 등 미확인 이유">'+esc(d.reviewHoldReason)+'</textarea></label>'+
  '<p class="ck113-editor-coverage" data-ck113-coverage role="status" aria-live="polite">개인 검토 입력 상태</p>'+
  '<div class="ck80-editor-buttons">'+
  '<button type="button" data-ck80-save>내 검토 초안 저장</button>'+
  '<button type="button" data-ck80-export>내 초안 전체 JSON 내보내기</button>'+
  '<button type="button" data-ck80-import>검토 초안 JSON 불러오기</button>'+
  '<input type="file" data-ck80-import-file hidden accept=".json,application/json" />'+
  '<span data-ck80-status role="status">입력한 내용은 저장 버튼을 누르면 이 브라우저에만 저장됩니다.</span></div>';
}
function collect(){
 const w=panel();if(!w||!questionId(selected))return null;
 const get=k=>w.querySelector('[data-ck80-field="'+k+'"]');
 const val=(k,n)=>clip(get(k)?.value,n);
 return {questionId:selected,status:get('status')?.value==='review_hold'?'review_hold':'draft',
  examAsOf:selected.slice(0,4),summaryEasy:val('summaryEasy',MAX.short),
  answerReason:val('answerReason',MAX.reason),
  evidence:val('evidence',MAX.evidence),reviewHoldReason:val('reviewHoldReason',MAX.hold),
  options:Array.from({length:5},(_,i)=>{
   const verdict=w.querySelector('[data-ck80-option-verdict="'+i+'"]')?.value;
   return {no:i+1,verdict:['unreviewed','true','false','unknown'].includes(verdict)?verdict:'unreviewed',
    why:clip(w.querySelector('[data-ck80-option-reason="'+i+'"]')?.value,MAX.option),
    source:clip(w.querySelector('[data-ck80-option-source="'+i+'"]')?.value,MAX.source)};
  }),
  updatedAt:new Date().toISOString(),source:'personal study review; editorial publication never automatic',
  sourceChecked:false,reasonReviewed:false,published:false};
}
function save(){
 const draft=collect();if(!draft)return false;
 if(draft.status==='review_hold'&&!draft.reviewHoldReason){setStatus('보류로 저장하려면 보류 사유를 적어 주세요.');return false;}
 if(!saveToStore(selected,draft)){setStatus(storageIssue||'저장 실패 · 용량 또는 저장 권한 확인 필요');return false;}
 record=draft;editing=false;setStatus('개인 초안 저장됨 · 공식 해설 게시/검수와는 별개입니다.');
 try{document.dispatchEvent(new CustomEvent('ck:personal-editor-updated',{detail:{id:selected}}));}catch{}
 return true;
}
function setVisible(yes){const w=panel();if(!w)return;open=yes;w.hidden=!yes;
 const t=root()?.querySelector('[data-ck80-toggle]');
 if(t){t.textContent=yes?'내 해설 초안 접기':'내 해설 초안 작성/수정';t.setAttribute('aria-expanded',String(yes));}
}
async function showEditor(){
 const r=root(),id=r?.dataset.ck78Current;
 if(!questionId(id)){setVisible(false);return;}
 selected=id;const target=r.querySelector('[data-ck80-workspace]');
 if(!target)return;
 if(target.dataset.ck80For===id&&target.querySelector('[data-ck80-save]')){
  // Folding and unfolding the same draft must not discard unsaved input.
  setVisible(!open);return;
 }
 target.hidden=false;target.textContent='기존 해설 초안을 읽는 중입니다.';
 try{
  const map=await patchYear(Number(id.slice(0,4)));
  if(root()?.dataset.ck78Current!==id)return;
  record=existing(id,map.get(id));target.innerHTML=editorHtml(record);
  target.dataset.ck80For=id;setVisible(true);editing=false;refreshCoverage();
 }catch(e){target.textContent='검토 초안을 열 수 없습니다: '+(e?.message||'읽기 오류');}
}
function filename(){return 'ConceptKnot_해설_개인검토초안_'+new Date().toISOString().slice(0,10)+'.json';}
function exportJson(){
 const drafts=store();
 if(storageIssue){setStatus(storageIssue);return;}
 if(!Object.keys(drafts).length){setStatus('저장한 초안이 아직 없습니다.');return;}
 const body={schemaVersion:'1.0.0',scope:'personal-unpublished-2016-2025',exportedAt:new Date().toISOString(),
  officialSourceUnchanged:true,records:Object.fromEntries(Object.entries(drafts).filter(([id])=>questionId(id)))};
 const bytes=new Blob(['\uFEFF',JSON.stringify(body,null,2)],{type:'application/json'});
 const url=URL.createObjectURL(bytes),link=document.createElement('a');link.href=url;
 link.download=filename();document.body.appendChild(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),3000);setStatus('개인 검토 초안 JSON을 생성했습니다. 공식 콘텐츠가 아닌 개인 작성물입니다.');
}
function validateImportRecord(id,v){
 if(!questionId(id)||!q(id)||!v||typeof v!=='object'||v.published===true||
  !['draft','review_hold'].includes(v.status)||v.questionId!==id||
  !Array.isArray(v.options)||v.options.length!==5)return null;
 if(v.options.some((opt,i)=>opt?.no!==i+1||
  !['unreviewed','true','false','unknown'].includes(opt.verdict)))return null;
 const hold=clip(v.reviewHoldReason,MAX.hold);
 if(v.status==='review_hold'&&!hold)return null;
 const stamp=window.CK102Restore?.timestamp?.(v.updatedAt)||0;
 return {questionId:id,status:v.status,examAsOf:id.slice(0,4),
  summaryEasy:clip(v.summaryEasy,MAX.short),answerReason:clip(v.answerReason,MAX.reason),
  evidence:clip(v.evidence,MAX.evidence),reviewHoldReason:hold,
  options:v.options.map((opt,i)=>({no:i+1,verdict:opt.verdict,why:clip(opt.why,MAX.option),
   source:clip(opt.source,MAX.source)})),
  updatedAt:stamp?new Date(stamp).toISOString():null,source:'personal import, unpublished',
  sourceChecked:false,reasonReviewed:false,published:false};
}
async function importJson(file){
 if(!file||file.size>8*1024*1024){setStatus('JSON 파일을 확인하세요(최대 8MB).');return;}
 if(editing){setStatus('저장하지 않은 해설 편집이 있습니다. 먼저 저장하거나 복사한 뒤 복원하세요.');return;}
 try{
  if(!window.CK102Restore?.records)throw Error('안전 복원 모듈을 불러오지 못했습니다.');
  const raw=await file.text(),data=JSON.parse(raw.replace(/^\uFEFF/,''));
  if(data.schemaVersion!=='1.0.0'||
    !['personal-unpublished-2021-2025','personal-unpublished-2016-2025'].includes(data.scope)||
    !data.records||typeof data.records!=='object'||Array.isArray(data.records))
     throw Error('지원하지 않는 개인 해설 백업 형식입니다.');
  const items=Object.entries(data.records);
  if(items.length>MAX_RECORDS)throw Error('800문항 초과');
  // Load the immutable legacy question bank before validating 2016–2020
  // drafts, otherwise legitimate personal records could be rejected as missing.
  if(items.some(([id])=>/^(?:201[6-9]|2020)-/.test(id))){
   if(!window.CK89OfficialBank?.loadAll)throw Error('과거 5개년 공식 원문을 불러올 수 없습니다.');
   await window.CK89OfficialBank.loadAll();
  }
  const clean=items.map(([id,v])=>[id,validateImportRecord(id,v)]);
  if(clean.some(([id,v])=>!v))throw Error('문항 ID, 상태, 보류 사유 또는 선지 형식이 잘못되었습니다.');
  if(editing)throw Error('백업을 읽는 도중 해설 편집이 시작됐습니다. 복원을 중단했습니다.');
  const prior=store();
  if(storageIssue)throw Error(storageIssue);
  if(localStorage.getItem(KEY)!==lastRaw)throw Error('다른 탭의 변경이 감지되었습니다. 새로고침 후 복원하세요.');
  const change=window.CK102Restore.records(prior,Object.fromEntries(clean));
  if(!change.changed){setStatus('가져올 최신 초안이 없습니다. 현재 '+change.preserved+'건을 보존했습니다.');return;}
  if(change.overlap&&!window.confirm?.('개인 해설 초안 '+change.overlap+'건이 겹칩니다. 새 백업이 더 최신인 '+
    change.updated+'건만 갱신하고 기존 '+change.preserved+'건은 보호합니다. 새 '+change.added+'건을 추가할까요?'))return;
  if(localStorage.getItem(KEY)!==lastRaw||editing)
   throw Error('가져오기 확인 중 다른 탭/편집 상태가 변경됐습니다. 다시 시도하세요.');
  const next=JSON.stringify(change.merged);
  if(next.length>3500000)throw Error('해설 개인 초안 합계 350만 글자 초과. 백업을 나눠 보관하고 기존 기록을 보호하세요.');
  localStorage.setItem(KEY,next);lastRaw=next;storageIssue='';
  setStatus('초안 복원: 새 '+change.added+'건 · 갱신 '+change.updated+
    '건 · 오래된/동일 '+change.preserved+'건 보호. 공식 해설 변경 없음.');
  try{document.dispatchEvent(new CustomEvent('ck:personal-editor-updated',{detail:{id:null}}));}catch{}
  if(questionId(selected)){const w=panel();if(w){w.dataset.ck80For='';setVisible(false);showEditor();}}
 }catch(e){setStatus('가져오기 실패 · '+(e.message||'JSON 형식 확인'));}
}

function confirmLeave(){
 if(!editing)return true;
 if(!window.confirm?.('저장하지 않은 해설 수정이 있습니다. 저장하지 않고 이동할까요?'))return false;
 editing=false;open=false;return true;
}
document.addEventListener('click',e=>{
 const b=e.target.closest?.('[data-ck80-toggle],[data-ck80-save],[data-ck80-export],[data-ck80-import]');
 if(!b)return;
 if(b.hasAttribute('data-ck80-toggle')){showEditor();return;}
 if(b.hasAttribute('data-ck80-save')){save();return;}
 if(b.hasAttribute('data-ck80-export')){exportJson();return;}
 if(b.hasAttribute('data-ck80-import')){panel()?.querySelector('[data-ck80-import-file]')?.click();}
});
document.addEventListener('change',e=>{
 if(!e.target.matches?.('[data-ck80-import-file]'))return;
 importJson(e.target.files?.[0]).finally(()=>{e.target.value='';});
});

function markInput(e){
 if(!e.target.closest?.('[data-ck80-workspace]')||
    !e.target.matches?.('textarea,select,input:not([type="file"])'))return;
 editing=true;refreshCoverage();setStatus('변경 중 · 저장 버튼을 누르세요.');
}
document.addEventListener('input',markInput);
document.addEventListener('change',markInput);

document.addEventListener('click',e=>{
 if(!editing)return;
 const leaving=e.target===root()||
   !!e.target.closest?.('[data-ck78-prev],[data-ck78-next],[data-ck78-close],[data-ck78-open-question],[data-ck78-review-report],[data-ck-v8-tab],.ck-v7-logo,.ck-v7-nav-pill .board-tab,[data-ck4-target],[data-ck4-prev],[data-ck4-next]');
 if(leaving&&!confirmLeave()){e.preventDefault();e.stopImmediatePropagation();}
},true);
// A native dialog can also close via Escape or backdrop without a close-button click.
document.addEventListener('cancel',e=>{
 if(e.target===root()&&!confirmLeave())e.preventDefault();
},true);
window.addEventListener('beforeunload',e=>{
 if(!editing)return;
 e.preventDefault();e.returnValue='';
});
window.CK80Editorial=Object.freeze({count,confirmLeave,hasUnsavedChanges:()=>editing,lookup:id=>store()[id]||null,
 getRecords:()=>store(),validateImportRecord,getStatus:()=>({selected,open,editing,lastStatus,storageIssue})});
})();