/* ConceptKnot v83 many-to-many concept notes: personal choices, never official verified frequency. */
(function(){
'use strict';
const KEY='ck83-personal-concept-links-v1',MAX=800,MAX_REASON=600,MAX_SOURCE=180;
const assessments=new Set(['unreviewed','true','false','conditional']);
const isObject=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
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
  const q=official()[id],subject=String(id).split('-')[1]&&Number(id.split('-')[1])<=40?'estate':'civil';
  // 2016-2020 official questions hydrate after the document loads: keep a valid
  // personal backup until the static bank is available, without claiming verification.
  if(!validId(id)||(q&&q.verified!==true)||!row||!Array.isArray(row.conceptIds)||
   row.conceptIds.length>10||new Set(row.conceptIds).size!==row.conceptIds.length||
   row.conceptIds.some(c=>!validConcept(c)||!c.startsWith(subject+'.')||(q&&q.subject!==subject))||
   typeof row.evidence!=='string'||row.evidence.length>1200)return null;
  const rawNotes=row.optionNotes===undefined?{}:row.optionNotes;
  if(!isObject(rawNotes)||Object.keys(rawNotes).length>5)return null;
  const optionNotes={};
  for(const [number,note] of Object.entries(rawNotes)){
   if(!/^[1-5]$/.test(number)||!isObject(note)||!assessments.has(note.assessment)||
    typeof note.reason!=='string'||note.reason.length>MAX_REASON||
    typeof note.source!=='string'||note.source.length>MAX_SOURCE||
    !Number.isFinite(Number(note.updatedAt))||Number(note.updatedAt)<0||
    Number(note.updatedAt)>Date.now()+86400000)return null;
   if(note.assessment!=='unreviewed'||note.reason.trim()||note.source.trim())
    optionNotes[number]={assessment:note.assessment,reason:note.reason,source:note.source,updatedAt:Number(note.updatedAt)};
  }
  clean.records[id]={conceptIds:[...row.conceptIds],evidence:row.evidence,optionNotes,
   updatedAt:Math.max(0,Math.min(Date.now()+86400000,Number(row.updatedAt)||0))};
 }
 return clean;
}
let storageIssue='',lastRaw=undefined;
function read(){
 try{
  const raw=localStorage.getItem(KEY);
  if(raw===null){storageIssue='';lastRaw=null;return empty();}
  const result=sanitize(JSON.parse(raw));
  if(!result){storageIssue='개념 연결 기록이 손상됐습니다. 원본을 보호하기 위해 저장을 차단합니다.';return empty();}
  storageIssue='';lastRaw=raw;return result;
 }catch{storageIssue='개념 연결 기록을 읽지 못했습니다. 저장을 차단합니다.';return empty();}
}
let state=read(),taxonomy=null,candidates=null,loading=null,root=null,expanded=false,selectedId='2025-1',selectedConcept='',status='',queued=false,dirty=false,storageConflict=false;
const unsavedChoices=new Map();
const chosenFor=id=>new Set(unsavedChoices.get(id)||state.records[id]?.conceptIds||[]);
function persist(next){
 if(storageIssue||storageConflict)return false;
 const clean=sanitize(next);if(!clean)return false;
 try{
  if(localStorage.getItem(KEY)!==lastRaw){storageIssue='다른 탭에서 개념 연결을 수정했습니다. 새로고침 후 저장하세요.';return false;}
  const raw=JSON.stringify(clean);localStorage.setItem(KEY,raw);lastRaw=raw;
  state=clean;document.dispatchEvent(new Event('ck:personal-links-updated'));return true;
 }catch{return false;}
}
function records(){return JSON.parse(JSON.stringify(state.records));}
function getLink(id){return state.records[id]?JSON.parse(JSON.stringify(state.records[id])):null;}
function reviewSummary(rows=state.records){
 const years={};let assessed=0,reasoned=0,sourceLinked=0;
 for(let y=2016;y<=2025;y++)years[y]={questions:0,assessed:0,reasoned:0};
 for(const [id,row] of Object.entries(rows||{})){
  if(!validId(id))continue;
  const year=Number(id.split('-')[0]);years[year].questions++;
  for(const note of Object.values(row.optionNotes||{})){
   if(note.assessment!=='unreviewed'){assessed++;years[year].assessed++;}
   if(note.reason.trim()){reasoned++;years[year].reasoned++;}
   if(note.source.trim())sourceLinked++;
  }
 }
 return {questions:Object.values(years).reduce((n,r)=>n+r.questions,0),assessed,reasoned,sourceLinked,totalQuestions:800,totalOptions:4000,years};
}
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
 const selected=chosenFor(id);
 const needle=String(query).normalize('NFKC').toLowerCase().trim();
 return [...taxonomy.values()].filter(c=>c.subject===q.subject&&(!needle||String(c.label+' '+(c.aliases||[]).join(' ')).normalize('NFKC').toLowerCase().includes(needle))).map(c=>
  '<label class="ck83-link-chip"><input type="checkbox" data-ck83-concept="'+esc(c.id)+'"'+(selected.has(c.id)?' checked':'')+
  '><span>'+esc(c.label)+'</span></label>').join('')||'<p>일치하는 개념이 없습니다.</p>';
}
function optionEditor(id){
 const q=official()[id];if(!q?.verified||!Array.isArray(q.options)||q.options.length!==5)return '';
 const saved=state.records[id]?.optionNotes||{};
 const kinds=[['unreviewed','미검토'],['true','참으로 판단'],['false','거짓으로 판단'],['conditional','조건·시험연도 확인 필요']];
 const count=Object.values(saved).filter(x=>x.assessment!=='unreviewed').length;
 return '<details class="ck83-option-panel"><summary>①~⑤ 선지별 개인 판단·근거 ('+count+'/5 기록)</summary>'+
  '<p>정답 인정 번호와 선지 진위는 다릅니다. 판정은 본인 메모이며 공식 검증·법률 자문이 아닙니다. 법령은 시험연도 기준으로 대조하세요.</p>'+
  '<div class="ck83-option-list">'+q.options.map((option,i)=>{
   const index=i+1,n=saved[index]||{assessment:'unreviewed',reason:'',source:''};
   return '<section class="ck83-option-item"><strong>'+['①','②','③','④','⑤'][i]+' '+esc(String(option).slice(0,400))+'</strong>'+
    '<label>개인 판단 <select data-ck83-assess="'+index+'">'+kinds.map(([v,label])=>
     '<option value="'+v+'"'+(n.assessment===v?' selected':'')+'>'+label+'</option>').join('')+'</select></label>'+
    '<label>판단 근거 <textarea rows="2" maxlength="'+MAX_REASON+'" data-ck83-reason="'+index+'" placeholder="시험연도와 근거를 직접 확인하고 기록">'+esc(n.reason||'')+'</textarea></label>'+
    '<label>출처·페이지 <input type="text" maxlength="'+MAX_SOURCE+'" data-ck83-source="'+index+'" value="'+esc(n.source||'')+'" placeholder="법령·판례·교재 페이지"></label></section>';
  }).join('')+'</div></details>';
}
function collectOptionNotes(editor,id){
 const notes={};
 for(let n=1;n<=5;n++){
  const select=editor.querySelector('[data-ck83-assess="'+n+'"]');
  if(!select)return state.records[id]?.optionNotes||{};
  const assessment=assessments.has(select.value)?select.value:'unreviewed';
  const reason=String(editor.querySelector('[data-ck83-reason="'+n+'"]')?.value||'').trim().slice(0,MAX_REASON);
  const source=String(editor.querySelector('[data-ck83-source="'+n+'"]')?.value||'').trim().slice(0,MAX_SOURCE);
  if(assessment!=='unreviewed'||reason||source)notes[n]={assessment,reason,source,updatedAt:Date.now()};
 }
 return notes;
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
 '<label>교재 페이지·원문·근거 메모 <textarea rows="2" maxlength="1200" data-ck83-evidence>'+esc(saved.evidence)+'</textarea></label>'+optionEditor(id)+
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
 const matched=linked(selectedConcept),coverage=reviewSummary();
 body.innerHTML='<p class="ck83-link-note">한 문항 최대 10개 개념 · 본인 확인·근거 메모 · 공식 출제 빈도와 분리</p>'+
 '<div class="ck83-link-selectors"><label>연도 <select data-ck83-year>'+
 Array.from({length:10},(_,i)=>2025-i).map(y=>'<option value="'+y+'"'+(Number(selectedId.split('-')[0])===y?' selected':'')+'>'+y+'</option>').join('')+
 '</select></label><label>문항 <select data-ck83-number>'+
 Array.from({length:80},(_,i)=>i+1).map(n=>'<option value="'+n+'"'+(Number(selectedId.split('-')[1])===n?' selected':'')+'>'+n+'</option>').join('')+
 '</select></label></div>'+
 '<div data-ck83-editor-slot>'+(taxonomy?editor(selectedId):'<p>개념 분류를 불러오는 중입니다.</p>')+'</div>'+
 '<div class="ck83-link-inverse"><h4>내 개념 연결 역검색 · '+Object.keys(state.records).length+'문항</h4><p>선지별 개인 판단 '+coverage.assessed+'/4000 · 근거 메모 '+coverage.reasoned+'건 · 출처 기입 '+coverage.sourceLinked+'건 (공식 검수와 무관)</p>'+
 '<label>개념 <select data-ck83-inverse>'+all.map(c=>'<option value="'+esc(c.id)+'"'+(c.id===selectedConcept?' selected':'')+'>'+esc(c.label)+'</option>').join('')+'</select></label>'+
 '<div class="ck83-link-results">'+(matched.length?matched.slice(0,100).map(q=>
  '<button type="button" data-ck83-open="'+esc(q.id)+'">'+esc(title(q.id))+'</button>').join(''):'<p>이 개념에 직접 연결된 문항이 없습니다.</p>')+'</div></div>'+
 '<div class="ck83-link-io"><button type="button" data-ck83-export>개인 연결 JSON 백업</button>'+
 '<button type="button" data-ck83-import>JSON 복원</button><input type="file" data-ck83-file hidden accept=".json,application/json">'+
 '<span data-ck83-status role="status">'+esc(status)+'</span></div>';
}
function confirmDiscard(){
 if(!dirty&&!unsavedChoices.size)return true;
 if(!window.confirm?.('저장하지 않은 개인 판단·근거가 있습니다. 변경을 버리고 이동할까요?'))return false;
 dirty=false;unsavedChoices.clear();return true;
}
function toggle(){
 if(expanded&&!confirmDiscard())return;
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
 const concepts=[...chosenFor(id)];
 if(concepts.length>10||concepts.some(x=>taxonomy.get(x)?.subject!==q.subject)){
  actionMessage(e,'개념은 같은 과목에서 최대 10개만 선택하세요.');return;
 }
 const record={conceptIds:concepts,evidence:String(e.querySelector('[data-ck83-evidence]')?.value||'').trim().slice(0,1200),
  optionNotes:collectOptionNotes(e,id),updatedAt:Date.now()};
 if(!persist({...state,records:{...state.records,[id]:record}})){actionMessage(e,storageIssue||(storageConflict?'다른 탭에서 기록 변경 · 복사 후 새로고침 필요':'저장 실패 · 저장공간을 확인하세요.'));return;}
 dirty=false;unsavedChoices.delete(id);actionMessage(e,'개인 연결·선지별 판단을 저장했습니다. 공식 검수와 구별됩니다.');
}
function remove(e){
 const id=e?.dataset.ck83Editor;
 if(!state.records[id]||!window.confirm?.(title(id)+'의 개인 개념 연결을 삭제할까요?'))return;
 const r={...state.records};delete r[id];if(persist({...state,records:r})){dirty=false;unsavedChoices.delete(id);actionMessage(e,'개인 연결 삭제됨');e.querySelectorAll('[data-ck83-concept]').forEach(x=>x.checked=false);}
}
function download(){
 const blob=new Blob(['\uFEFF',JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='ConceptKnot_개인개념연결_'+new Date().toISOString().slice(0,10)+'.json';
 document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2500);
}
async function restore(file){
 if(!file||file.size>5*1024*1024){status='JSON 용량은 최대 5MB입니다.';paint();return;}
 if(dirty||unsavedChoices.size||storageConflict){
  status='저장하지 않은 선지 판단 또는 다른 탭 충돌이 있습니다. 먼저 저장하거나 내용을 복사해 주세요.';
  paint();return;
 }
 try{
  await load();
  const data=sanitize(JSON.parse((await file.text()).replace(/^\uFEFF/,'')));
  if(!data||Object.values(data.records).some(row=>row.conceptIds.some(id=>!taxonomy.has(id))))
   throw Error('문항·개념 데이터 형식 오류');
  if(!window.CK102Restore?.records)throw Error('안전 복원 모듈을 불러오지 못했습니다. 기존 기록은 그대로 유지합니다.');
  if(dirty||unsavedChoices.size||storageConflict)throw Error('복원 도중 편집/다른 탭 변경이 발생했습니다.');
  const change=window.CK102Restore.records(state.records,data.records);
  if(!change.changed){
   status='현재보다 최신 개인 연결이 없습니다. '+change.preserved+'건은 그대로 유지했습니다.';
   paint();return;
  }
  if(change.overlap&&!window.confirm?.('겹치는 개인 연결 '+change.overlap+
    '건: 더 새로운 '+change.updated+'건만 교체, '+change.preserved+
    '건은 현재 기록을 보호합니다. 새 문항 '+change.added+'건을 추가할까요?'))return;
  if(!persist({...state,records:change.merged}))throw Error('저장공간 부족 또는 다중 탭 변경 감지');
  dirty=false;unsavedChoices.clear();
  status='개념 연결 복원: 새 '+change.added+'건 · 갱신 '+change.updated+
   '건 · 오래된/동일 '+change.preserved+'건 유지';
  paint();
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
  const id=e?.dataset.ck83Editor,concept=t.dataset.ck83Add,selected=chosenFor(id);
  if(!taxonomy?.has(concept)||taxonomy.get(concept)?.subject!==official()[id]?.subject)return;
  if(selected.size>=10&&!selected.has(concept)){actionMessage(e,'최대 10개 개념까지 선택할 수 있습니다.');return;}
  selected.add(concept);unsavedChoices.set(id,selected);dirty=true;
  const box=e?.querySelector('[data-ck83-concept="'+concept+'"]');
  if(box)box.checked=true;
  actionMessage(e,'임시 선택됨 · 원문 검토 후 저장하세요.');return;
 }
 if(t.hasAttribute('data-ck83-open')){
  const q=official()[t.dataset.ck83Open];if(!q?.verified)return;
  if(!confirmDiscard())return;
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
 if(t.matches?.('[data-ck83-concept]')){
  const e=t.closest('[data-ck83-editor]'),id=e?.dataset.ck83Editor;
  if(!official()[id]?.verified)return;
  const selected=chosenFor(id),concept=t.dataset.ck83Concept;
  if(t.checked){
   if(selected.size>=10&&!selected.has(concept)){t.checked=false;actionMessage(e,'최대 10개 개념입니다.');return;}
   selected.add(concept);
  }else selected.delete(concept);
  unsavedChoices.set(id,selected);dirty=true;return;
 }
 if(t.matches?.('[data-ck83-year],[data-ck83-number]')){
  if(!confirmDiscard()){paint();return;}
  selectedId=Number(root?.querySelector('[data-ck83-year]')?.value)+'-'+Number(root?.querySelector('[data-ck83-number]')?.value);
  if(Number(selectedId.split('-')[0])<2021)
   window.CK89OfficialBank?.loadYear?.(Number(selectedId.split('-')[0])).then(paint)
    .catch(err=>{status='구형 기출 로딩 실패: '+err.message;paint();});
  paint();return;
 }
 if(t.matches?.('[data-ck83-inverse]')){selectedConcept=t.value;paint();}
 if(t.matches?.('[data-ck83-assess]'))dirty=true;
 if(t.matches?.('[data-ck83-file]'))restore(t.files?.[0]).finally(()=>{t.value='';});
});
document.addEventListener('input',event=>{
 const t=event.target;
 if(t.matches?.('[data-ck83-evidence],[data-ck83-reason],[data-ck83-source]')){dirty=true;return;}
 if(!t.matches?.('[data-ck83-query]'))return;
 const e=t.closest('[data-ck83-editor]'),box=e?.querySelector('[data-ck83-choices]');
 if(box)box.innerHTML=choices(e.dataset.ck83Editor,t.value);
});
window.addEventListener('storage',e=>{if(e.key!==KEY)return;
 if(dirty||unsavedChoices.size){storageConflict=true;status='다른 탭의 변경이 감지되어 저장을 차단했습니다. 현재 입력을 복사한 뒤 새로고침하세요.';
  const el=root?.querySelector('[data-ck83-status]');if(el)el.textContent=status;return;}
 state=read();if(expanded)paint();modal();});
window.addEventListener('ck:official-bank-ready',()=>{if(expanded)paint();modal();});
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
function openQuestion(id){
 if(!validId(id))return false;
 const year=Number(id.split('-')[0]);
 const show=()=>{if(!confirmDiscard())return false;selectedId=id;mount();if(!root)return false;
  if(!expanded)toggle();else paint();
  root.scrollIntoView?.({behavior:'smooth',block:'nearest'});return true;};
 if(official()[id]?.verified)return show();
 if(year<=2020&&window.CK89OfficialBank?.loadYear){
  return window.CK89OfficialBank.loadYear(year).then(()=>official()[id]?.verified?show():false)
   .catch(e=>{status='공식 문항 로딩 실패: '+e.message;return false;});
 }
 return false;
}
window.CK83Links=Object.freeze({sanitize,getRecords:records,getLink,linkedQuestions:linked,reviewSummary,openQuestion,
 getStatus:()=>({linked:Object.keys(state.records).length,concepts:taxonomy?.size||0,unsavedEdits:unsavedChoices.size+(dirty?1:0),storageIssue,storageConflict,expanded}),
 open:()=>{mount();if(root&&!expanded)toggle();}});
})();