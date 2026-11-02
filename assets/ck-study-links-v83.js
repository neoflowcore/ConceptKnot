/* ConceptKnot v83 many-to-many concept notes: personal choices, never official verified frequency. */
(function(){
'use strict';
const KEY='ck83-personal-concept-links-v1',MAX=800;
const validId=id=>/^20(?:1[6-9]|2[0-5])-(?:[1-9]|[1-7]\d|80)$/.test(String(id||''));
const validConcept=id=>/^(estate|civil)\.[a-z0-9.-]{1,90}$/.test(String(id||''));
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const official=()=>window.RECALL_OFFICIAL||{};
const empty=()=>({schemaVersion:1,scope:'personal-unpublished-concept-links',records:{}});
function sanitize(raw){
 if(raw?.schemaVersion!==1||raw.scope!=='personal-unpublished-concept-links'||
  !raw.records||typeof raw.records!=='object'||Array.isArray(raw.records))return null;
 const rows=Object.entries(raw.records);if(rows.length>MAX)return null;
 const clean=empty();
 for(const [id,row] of rows){
  const q=official()[id];
  if(!validId(id)||q?.verified!==true||!row||!Array.isArray(row.conceptIds)||
   row.conceptIds.length>10||new Set(row.conceptIds).size!==row.conceptIds.length||
   row.conceptIds.some(c=>!validConcept(c)||!c.startsWith(q.subject+'.'))||
   typeof row.evidence!=='string'||row.evidence.length>1200)return null;
  clean.records[id]={conceptIds:[...row.conceptIds],evidence:row.evidence,
   updatedAt:Math.max(0,Math.min(Date.now()+86400000,Number(row.updatedAt)||0))};
 }
 return clean;
}
function read(){try{return sanitize(JSON.parse(localStorage.getItem(KEY)||'null'))||empty();}catch{return empty();}}
let state=read(),taxonomy=null,candidates=null,loading=null,root=null,expanded=false,selectedId='2025-1',selectedConcept='',status='',queued=false;
function persist(next){
 const clean=sanitize(next);if(!clean)return false;
 try{localStorage.setItem(KEY,JSON.stringify(clean));state=clean;document.dispatchEvent(new Event('ck:personal-links-updated'));return true;}catch{return false;}
}
function records(){return JSON.parse(JSON.stringify(state.records));}
function getLink(id){return state.records[id]?JSON.parse(JSON.stringify(state.records[id])):null;}
function linked(conceptId){
 return Object.keys(state.records).filter(id=>state.records[id].conceptIds.includes(conceptId)&&official()[id]?.verified===true)
  .map(id=>official()[id]).sort((a,b)=>b.year-a.year||a.number-b.number);
}
async function load(){
 if(taxonomy)return taxonomy;
 if(loading)return loading;
 loading=Promise.all([
  fetch('./data/concept-taxonomy-v1.json',{cache:'force-cache'}).then(r=>{if(!r.ok)throw Error('taxonomy HTTP '+r.status);return r.json();}),
  fetch('./data/concept-occurrences-v1.json',{cache:'force-cache'}).then(r=>r.ok?r.json():null).catch(()=>null)
 ]).then(([a,b])=>{
  if(!Array.isArray(a.concepts)||a.concepts.length<20)throw Error('개념 분류 데이터 손상');
  taxonomy=new Map(a.concepts.filter(c=>validConcept(c.id)&&c.label).map(c=>[c.id,c]));
  candidates=new Map((b?.occurrences||[]).map(c=>[c.questionId,(c.candidateConceptIds||[]).filter(validConcept)]));
  return taxonomy;
 }).finally(()=>loading=null);
 return loading;
}
const title=id=>{const q=official()[id];return q?.verified?q.year+'년 '+q.number+'번 · '+(q.subject==='estate'?'학개론':'민법'):String(id);};
function choices(id,query=''){
 const q=official()[id];if(!q||!taxonomy)return '';
 const selected=new Set(state.records[id]?.conceptIds||[]);
 const needle=String(query).normalize('NFKC').toLowerCase().trim();
 return [...taxonomy.values()].filter(c=>c.subject===q.subject&&(!needle||String(c.label+' '+(c.aliases||[]).join(' ')).normalize('NFKC').toLowerCase().includes(needle))).map(c=>
  '<label class="ck83-link-chip"><input type="checkbox" data-ck83-concept="'+esc(c.id)+'"'+(selected.has(c.id)?' checked':'')+
  '><span>'+esc(c.label)+'</span></label>').join('')||'<p>일치하는 개념이 없습니다.</p>';
}
function editor(id){
 const q=official()[id];
 if(q?.verified!==true)return '<p>공식 등록 문항을 선택하세요.</p>';
 const saved=state.records[id]||{evidence:''};
 const candidate=(candidates?.get(id)||[]).filter(c=>taxonomy?.has(c)&&c.startsWith(q.subject+'.'));
 return '<div class="ck83-link-editor" data-ck83-editor="'+esc(id)+'"><h4>'+esc(title(id))+' · 개념 연결</h4>'+
 '<p>개인 학습 연결만 저장합니다. 자동 후보는 공식 출제개념이나 검증된 빈도가 아닙니다.</p>'+
 (candidate.length?'<div class="ck83-link-candidates"><small>키워드 후보 · 클릭해도 저장 전까지 반영되지 않음</small>'+
 candidate.map(c=>'<button type="button" data-ck83-add="'+esc(c)+'">'+esc(taxonomy.get(c).label)+'</button>').join('')+'</div>':'')+
 '<label>개념 검색 <input type="search" data-ck83-query maxlength="80" placeholder="명칭 또는 키워드"></label>'+
 '<div class="ck83-link-choices" data-ck83-choices>'+choices(id)+'</div>'+
 '<label>교재 페이지·원문·근거 메모 <textarea rows="2" maxlength="1200" data-ck83-evidence>'+esc(saved.evidence)+'</textarea></label>'+
 '<div class="ck83-link-actions"><button type="button" data-ck83-save>내 연결 저장</button>'+
 '<button type="button" data-ck83-delete>연결 삭제</button><span data-ck83-message role="status"></span></div></div>';
}
function mount(){
 const existing=document.getElementById('ck83-link-tools');
 if(existing){root=existing;return;}
 const host=document.getElementById('ck76-search')||document.getElementById('ck81-workbench')||document.getElementById('main');
 if(!host)return;
 root=document.createElement('section');root.id='ck83-link-tools';root.className='ck83-link-tools';
 root.innerHTML='<div class="ck83-link-head"><strong>기출 ↔ 개념 다중 연결</strong>'+
 '<button type="button" data-ck83-toggle aria-expanded="false">개인 연결 열기</button></div>'+
 '<div data-ck83-body hidden></div>';
 if(host.id==='main')host.prepend(root);else host.after(root);
}
function paint(){
 const body=root?.querySelector('[data-ck83-body]');if(!body||!expanded)return;
 const q=official()[selectedId],all=taxonomy?[...taxonomy.values()]:[];
 if(!all.some(c=>c.id===selectedConcept))selectedConcept=all[0]?.id||'';
 const matched=linked(selectedConcept);
 body.innerHTML='<p class="ck83-link-note">한 문항 최대 10개 개념 · 본인 확인·근거 메모 · 공식 출제 빈도와 분리</p>'+
 '<div class="ck83-link-selectors"><label>연도 <select data-ck83-year>'+
 Array.from({length:10},(_,i)=>2025-i).map(y=>'<option value="'+y+'"'+(q?.year===y?' selected':'')+'>'+y+'</option>').join('')+
 '</select></label><label>문항 <select data-ck83-number>'+
 Array.from({length:80},(_,i)=>i+1).map(n=>'<option value="'+n+'"'+(q?.number===n?' selected':'')+'>'+n+'</option>').join('')+
 '</select></label></div>'+
 '<div data-ck83-editor-slot>'+(taxonomy?editor(selectedId):'<p>개념 분류를 불러오는 중입니다.</p>')+'</div>'+
 '<div class="ck83-link-inverse"><h4>내 개념 연결 역검색 · '+Object.keys(state.records).length+'문항</h4>'+
 '<label>개념 <select data-ck83-inverse>'+all.map(c=>'<option value="'+esc(c.id)+'"'+(c.id===selectedConcept?' selected':'')+'>'+esc(c.label)+'</option>').join('')+'</select></label>'+
 '<div class="ck83-link-results">'+(matched.length?matched.slice(0,100).map(q=>
  '<button type="button" data-ck83-open="'+esc(q.id)+'">'+esc(title(q.id))+'</button>').join(''):'<p>이 개념에 직접 연결된 문항이 없습니다.</p>')+'</div></div>'+
 '<div class="ck83-link-io"><button type="button" data-ck83-export>개인 연결 JSON 백업</button>'+
 '<button type="button" data-ck83-import>JSON 복원</button><input type="file" data-ck83-file hidden accept=".json,application/json">'+
 '<span data-ck83-status role="status">'+esc(status)+'</span></div>';
}
function toggle(){
 expanded=!expanded;
 const button=root?.querySelector('[data-ck83-toggle]'),body=root?.querySelector('[data-ck83-body]');
 if(button){button.setAttribute('aria-expanded',String(expanded));button.textContent=expanded?'개인 연결 접기':'개인 연결 열기';}
 if(body)body.hidden=!expanded;
 if(expanded){paint();load().then(paint).catch(e=>{status='개념 파일 오류: '+e.message;paint();});}
}
function modal(){
 const dialog=document.getElementById('ck78-analysis-dialog'),id=dialog?.dataset.ck78Current;
 if(!dialog?.open||!official()[id]?.verified||!dialog.querySelector('.ck78-modal-scroll'))return;
 const scroll=dialog.querySelector('.ck78-modal-scroll');
 if(scroll.querySelector('[data-ck83-editor="'+id+'"]'))return;
 scroll.querySelectorAll('.ck83-modal-links').forEach(x=>x.remove());
 const section=document.createElement('section');section.className='ck83-modal-links';
 section.innerHTML=taxonomy?editor(id):'<p>개념 연결을 준비하는 중입니다.</p>';
 const before=scroll.querySelector('.ck78-notes')||scroll.querySelector('.ck78-modal-source');
 if(before)before.before(section);else scroll.append(section);
 if(!taxonomy)load().then(()=>{if(section.isConnected&&dialog.dataset.ck78Current===id)section.innerHTML=editor(id);}).catch(()=>{section.textContent='개념 목록을 읽지 못했습니다.';});
}
function actionMessage(e,text){const span=e?.querySelector('[data-ck83-message]')||root?.querySelector('[data-ck83-status]');if(span)span.textContent=text;status=text;}
function save(e){
 const id=e?.dataset.ck83Editor,q=official()[id];if(!q?.verified||!taxonomy)return;
 const concepts=[...e.querySelectorAll('[data-ck83-concept]:checked')].map(x=>x.dataset.ck83Concept);
 if(concepts.length>10||concepts.some(x=>taxonomy.get(x)?.subject!==q.subject)){
  actionMessage(e,'개념은 같은 과목에서 최대 10개만 선택하세요.');return;
 }
 const record={conceptIds:concepts,evidence:String(e.querySelector('[data-ck83-evidence]')?.value||'').trim().slice(0,1200),updatedAt:Date.now()};
 if(!persist({...state,records:{...state.records,[id]:record}})){actionMessage(e,'저장 실패 · 브라우저 용량을 확인하세요.');return;}
 actionMessage(e,'개인 개념 연결을 저장했습니다. 공식 검수와 구별됩니다.');
}
function remove(e){
 const id=e?.dataset.ck83Editor;
 if(!state.records[id]||!window.confirm?.(title(id)+'의 개인 개념 연결을 삭제할까요?'))return;
 const r={...state.records};delete r[id];if(persist({...state,records:r})){actionMessage(e,'개인 연결 삭제됨');e.querySelectorAll('[data-ck83-concept]').forEach(x=>x.checked=false);}
}
function download(){
 const blob=new Blob(['\uFEFF',JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='ConceptKnot_개인개념연결_'+new Date().toISOString().slice(0,10)+'.json';
 document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2500);
}
async function restore(file){
 if(!file||file.size>1024*1024){status='JSON 용량은 최대 1MB입니다.';paint();return;}
 try{
  await load();
  const data=sanitize(JSON.parse((await file.text()).replace(/^\uFEFF/,'')));
  if(!data||Object.values(data.records).some(row=>row.conceptIds.some(id=>!taxonomy.has(id))))throw Error('문항·개념 데이터 형식 오류');
  const overlap=Object.keys(data.records).filter(id=>state.records[id]).length;
  if(overlap&&!window.confirm?.('기존 '+overlap+'개 문항의 연결을 교체할까요?'))return;
  if(!persist({...state,records:{...state.records,...data.records}}))throw Error('저장공간 부족');
  status='개념 연결 '+Object.keys(data.records).length+'문항 복원 완료';paint();
 }catch(e){status='복원 실패: '+e.message;paint();}
}
document.addEventListener('click',event=>{
 const t=event.target.closest?.('[data-ck83-toggle],[data-ck83-save],[data-ck83-delete],[data-ck83-add],'+
 '[data-ck83-open],[data-ck83-export],[data-ck83-import]');
 if(!t)return;
 const e=t.closest('[data-ck83-editor]');
 if(t.hasAttribute('data-ck83-toggle')){toggle();return;}
 if(t.hasAttribute('data-ck83-save')){save(e);return;}
 if(t.hasAttribute('data-ck83-delete')){remove(e);return;}
 if(t.hasAttribute('data-ck83-add')){
  const box=e?.querySelector('[data-ck83-concept="'+t.dataset.ck83Add+'"]');
  if(box){box.checked=true;actionMessage(e,'후보가 선택되었습니다. 원문 대조 후 저장하세요.');}return;
 }
 if(t.hasAttribute('data-ck83-open')){
  const q=official()[t.dataset.ck83Open];if(!q?.verified)return;
  selectedId=q.id;
  if(q.year>=2021)window.CK78Analysis?.open?.(q.year,q.number);
  else window.CK76Study?.openQuestion?.(q.year,q.number,q.subject);
  if(expanded)paint();return;
 }
 if(t.hasAttribute('data-ck83-export')){download();return;}
 if(t.hasAttribute('data-ck83-import'))root?.querySelector('[data-ck83-file]')?.click();
});
document.addEventListener('change',event=>{
 const t=event.target;
 if(t.matches?.('[data-ck83-year],[data-ck83-number]')){
  selectedId=Number(root?.querySelector('[data-ck83-year]')?.value)+'-'+Number(root?.querySelector('[data-ck83-number]')?.value);
  paint();return;
 }
 if(t.matches?.('[data-ck83-inverse]')){selectedConcept=t.value;paint();}
 if(t.matches?.('[data-ck83-file]'))restore(t.files?.[0]).finally(()=>{t.value='';});
});
document.addEventListener('input',event=>{
 const t=event.target;if(!t.matches?.('[data-ck83-query]'))return;
 const e=t.closest('[data-ck83-editor]'),box=e?.querySelector('[data-ck83-choices]');
 if(box)box.innerHTML=choices(e.dataset.ck83Editor,t.value);
});
document.addEventListener('storage',e=>{if(e.key===KEY){state=read();if(expanded)paint();modal();}});
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;mount();modal();});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
const main=document.getElementById('main');
if(main&&window.MutationObserver)new MutationObserver(changes=>{
 if(!document.getElementById('ck83-link-tools')&&changes.some(c=>c.addedNodes.length))schedule();
}).observe(main,{subtree:true,childList:true});
if(window.MutationObserver)new MutationObserver(changes=>{
 const d=document.getElementById('ck78-analysis-dialog');
 if(!d?.open)return;
 if(!d.querySelector('[data-ck83-editor="'+d.dataset.ck78Current+'"]')&&
  changes.some(c=>[...c.addedNodes].some(n=>n.nodeType===1&&(n.matches?.('.ck78-modal-scroll')||n.querySelector?.('.ck78-modal-scroll')))))schedule();
}).observe(document.body,{childList:true,subtree:true});
window.CK83Links=Object.freeze({sanitize,getRecords:records,getLink,linkedQuestions:linked,
 getStatus:()=>({linked:Object.keys(state.records).length,concepts:taxonomy?.size||0,expanded}),
 open:()=>{mount();if(root&&!expanded)toggle();}});
})();