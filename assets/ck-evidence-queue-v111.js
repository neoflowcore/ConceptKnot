/* ConceptKnot v111 · personal 800-question / 4,000-option evidence review queue. */
(function(){
'use strict';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const validId=id=>/^20(?:1[6-9]|2[0-5])-(?:[1-9]|[1-7]\d|80)$/.test(String(id||''));
const hasText=x=>typeof x==='string'&&x.trim().length>0;
const names={estate:'학개론',civil:'민법'};
const PAGE=24;
let panel=null,expanded=false,year='all',subject='all',condition='no-source',page=0,status='',scheduled=false;
function types(q){try{return window.CK78Analysis?.classify?.(q)||[]}catch{return []}}
function rows(bank=window.RECALL_OFFICIAL||{},links=window.CK83Links?.getRecords?.()||{},
 drafts=window.CK80Editorial?.getRecords?.()||{}){
 const data=[];
 for(const [id,q] of Object.entries(bank||{})){
  if(!validId(id)||q?.id!==id||q.verified!==true||!['estate','civil'].includes(q.subject)||
    Number(q.year)!==Number(id.split('-')[0])||Number(q.number)!==Number(id.split('-')[1])||
    !Array.isArray(q.options)||q.options.length!==5||q.options.some(o=>!hasText(o))||
    !Array.isArray(q.correct)||!q.correct.length||q.correct.length>5||
    new Set(q.correct.map(Number)).size!==q.correct.length||
    q.correct.some(n=>!Number.isInteger(Number(n))||Number(n)<1||Number(n)>5))continue;
  const saved=links[id]||{},personal=saved.optionNotes||{};
  const notes=Array.from({length:5},(_,i)=>personal[String(i+1)]||{});
  const assessed=notes.filter(n=>['true','false','conditional'].includes(n.assessment)).length;
  const reasoned=notes.filter(n=>hasText(n.reason)).length;
  const sourced=notes.filter(n=>hasText(n.source)).length;
  // CK83 personal option notes and CK80 editorial draft citations are
  // independent, unpublished sources. Never silently merge or verify either.
  const draft=Object.hasOwn(drafts,id)?drafts[id]:null;
  const draftOptions=Array.isArray(draft?.options)&&draft.options.length===5?
   draft.options: [];
  const draftSourced=draftOptions.filter(n=>hasText(n?.source)).length;
  const concepts=Array.isArray(saved.conceptIds)?saved.conceptIds.length:0;
  const flags=types(q),correct=q.correct.map(Number);
  const special=correct.length===5?'all':correct.length>1?'multiple':'normal';
  const visual=Boolean(q.diagrams?.length)||flags.includes('visual_original_check');
  const calc=flags.includes('calculation_or_numeric'),legal=flags.includes('legal_temporal_review');
  const textScore=Number.isFinite(q.checks?.primaryText?.score)?q.checks.primaryText.score:null;
  const lowText=textScore!==null&&textScore<.9;
  const ready=assessed===5&&reasoned===5&&sourced===5;
  const priority=(5-sourced)*4+(5-reasoned)*2+(5-assessed)+(special!=='normal'?12:0)+
    (visual?8:0)+(legal?6:0)+(calc?4:0)+(lowText?8:0)+(q.checks?.visualReview!==true?3:0);
  const original=String(q.originalUrl||q.paperUrl||'');
  data.push({id,year:Number(q.year),number:Number(q.number),subject:q.subject,
   question:q.question,options:q.options,correct,notes:personal,draftOptions,
   assessed,reasoned,sourced,draftSourced,concepts,flags,special,visual,calc,legal,lowText,ready,priority,
   source:/^https:\/\/[a-z0-9.-]+\//i.test(original)?original:''});
 }
 return data.sort((a,b)=>b.priority-a.priority||b.year-a.year||a.number-b.number);
}
function bankComplete(data){
 return data.length===800&&new Set(data.map(r=>r.id)).size===800&&
  Array.from({length:10},(_,i)=>2016+i).every(y=>data.filter(r=>r.year===y).length===80);
}
function summary(data){
 return {loaded:data.length,done:data.filter(x=>x.ready).length,
  sources:data.reduce((s,x)=>s+x.sourced,0),
  draftSources:data.reduce((s,x)=>s+x.draftSourced,0),
  special:data.filter(x=>x.special!=='normal').length};
}
function matches(r){
 return (year==='all'||String(r.year)===String(year))&&
  (subject==='all'||r.subject===subject)&&(
   condition==='all'||condition==='no-source'&&r.sourced<5||
   condition==='no-draft-source'&&r.draftSourced<5||
   condition==='incomplete'&&!r.ready||condition==='ready'&&r.ready||
   condition==='special'&&r.special!=='normal'||condition==='visual'&&r.visual||
   condition==='calc'&&r.calc||condition==='legal'&&r.legal||condition==='low-text'&&r.lowText);
}
function csv(v){
 const s=String(v??'').replace(/[\r\n\t]+/g,' ').trim();
 return '"'+(/^[=+\-@]/.test(s)?"'"+s:s).replace(/"/g,'""')+'"';
}
function csvDocument(data,kind){
 let head,body;
 if(kind==='options'){
  head=['문항','연도','과목','선지번호','원문 선지','채점 인정(참거짓 아님)',
   '개인 판단','개인 판단 이유(미검수)','CK83 개인 출처(미검수)',
   'CK80 해설 초안 판단(미검수)','CK80 해설 초안 이유(미검수)',
   'CK80 해설 초안 출처(미검수)','출처 URL'];
  body=data.flatMap(r=>r.options.map((option,i)=>{
   const note=r.notes[String(i+1)]||{};
   return [r.id,r.year,names[r.subject],i+1,option,
    r.correct.includes(i+1)?'인정':'미인정',note.assessment||'unreviewed',
    note.reason||'',note.source||'',r.draftOptions?.[i]?.verdict||'unreviewed',
    r.draftOptions?.[i]?.why||'',r.draftOptions?.[i]?.source||'',r.source];
  }));
 }else{
  head=['문항','연도','번호','과목','문제','채점 인정','개념 연결','개인 선지판단 수(5)',
   '개인 판단이유 수(5)','CK83 개인 근거출처 수(5)','CK80 해설 초안 출처 수(5)',
   '개인 기록 5/5(공식 검증 아님)',
   '자동 유형 후보','표/그림 확인 후보','자동 검토 우선점','출처 URL'];
  body=data.map(r=>[r.id,r.year,r.number,names[r.subject],r.question,r.correct.join('/'),
   r.concepts,r.assessed,r.reasoned,r.sourced,r.draftSourced,
   r.ready?'예':'아니오',r.flags.join(' / '),
   r.visual?'확인 필요':'없음',r.priority,r.source]);
 }
 return [head,...body].map(row=>row.map(csv).join(',')).join('\r\n')+'\r\n';
}
function saveCsv(kind){
 const all=rows();
 if(!bankComplete(all)){status='전 연도 각 80문항, 총 800문항이 로드된 경우에만 내보낼 수 있습니다.';paint();return false;}
 const filtered=kind==='filtered'||kind==='filtered-options',options=kind==='options'||kind==='filtered-options';
 const chosen=filtered?all.filter(matches):all;
 if(!chosen.length){status='현재 필터에서 내보낼 검토 대상이 없습니다.';paint();return false;}
 try{
  const blob=new Blob(['\uFEFF',csvDocument(chosen,options?'options':'summary')],{type:'text/csv;charset=utf-8'});
  const uri=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=uri;a.download=filtered?
   (options?'ConceptKnot_필터_선지검토.csv':'ConceptKnot_필터_문항검토.csv'):
   (options?'ConceptKnot_4000선지_개인검토.csv':'ConceptKnot_800문항_개인검토.csv');
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(uri),2500);
  status='개인 검토용 CSV를 저장했습니다. 공식 법령·판례 검증 완료 기록이 아닙니다.';
  paint();return true;
 }catch{status='CSV 다운로드 실패 · 브라우저 권한과 저장 공간을 확인하세요.';paint();return false;}
}
function paint(){
 if(!panel)return;
 const all=rows(),stats=summary(all),matched=all.filter(matches);
 const last=Math.max(1,Math.ceil(matched.length/PAGE));page=Math.max(0,Math.min(page,last-1));
 const selected=matched.slice(page*PAGE,(page+1)*PAGE);
 panel.innerHTML='<details class="ck111-details"'+(expanded?' open':'')+'>'+
 '<summary>선지 근거 검토 대기열 <span>선지 메모 판단·이유·출처 5/5: '+stats.done+'/'+stats.loaded+'문항</span></summary>'+
 '<div class="ck111-body"><p>자동 분류·우선점은 검토 순서의 힌트일 뿐 정답 판단이나 검증된 출제 빈도가 아닙니다. 공식 문제·정답은 변경하지 않습니다.</p>'+
 '<div class="ck111-stats"><span>원문 '+stats.loaded+'/800</span>'+
 '<span>선지 메모 출처 '+stats.sources+'/4000</span>'+
 '<span>해설 초안 출처 '+stats.draftSources+'/4000</span>'+
 '<span>특수정답 '+stats.special+'건</span></div>'+
 '<div class="ck111-actions"><button data-ck111-load type="button">10개년 원문 불러오기</button>'+
 '<button data-ck111-export="summary" type="button">800문항 CSV</button>'+
 '<button data-ck111-export="options" type="button">4,000선지 CSV</button>'+
 '<button data-ck111-export="filtered" type="button">현재 필터 문항 CSV</button>'+
 '<button data-ck111-export="filtered-options" type="button">현재 필터 선지 CSV</button>'+
 '<button data-ck112-workbench type="button">10개년 해설 검토 작업대</button>'+
 '<button data-ck112-voice-top type="button">▶ 현재 페이지 상위 5문항 듣기</button>'+
 '<button data-ck112-voice-stop type="button">■ 음성 정지</button></div>'+
 '<p class="ck111-status" role="status" aria-live="polite">'+esc(status)+'</p>'+
 '<div class="ck111-filters"><label>연도<select data-ck111-year>'+
 '<option value="all">전체</option>'+Array.from({length:10},(_,i)=>2025-i).map(y=>
 '<option value="'+y+'"'+(String(year)===String(y)?' selected':'')+'>'+y+'년</option>').join('')+
 '</select></label><label>과목<select data-ck111-subject>'+
 [['all','전체'],['estate','학개론'],['civil','민법']].map(x=>
 '<option value="'+x[0]+'"'+(subject===x[0]?' selected':'')+'>'+x[1]+'</option>').join('')+
 '</select></label><label>검토 단계<select data-ck111-condition>'+
 [['no-source','선지 메모 출처 미기록'],['no-draft-source','해설 초안 출처 미기록'],
  ['incomplete','개인 판단·이유·출처 미완성'],['special','복수/전원정답'],
 ['visual','그림/표 확인'],['calc','계산/수치'],['legal','법령/판례'],['low-text','텍스트 차이 후보'],
 ['ready','개인 기록 5/5'],['all','전체']].map(x=>
 '<option value="'+x[0]+'"'+(condition===x[0]?' selected':'')+'>'+x[1]+'</option>').join('')+
 '</select></label></div><p class="ck111-count">검토 대상 '+matched.length+'건 · '+(page+1)+'/'+last+'페이지</p>'+
 '<div class="ck111-items">'+(selected.map(r=>
 '<article class="ck111-item"><div class="ck111-head"><strong>'+r.year+'년 '+r.number+'번 · '+names[r.subject]+'</strong>'+
 '<small>우선점 '+r.priority+' · '+(r.special==='all'?'전원정답':r.special==='multiple'?'복수정답':'일반')+'</small></div>'+
 '<p>'+esc(r.question.replace(/\s+/g,' ').slice(0,190))+'</p>'+
 '<div class="ck111-progress"><span>내 판단 '+r.assessed+'/5</span><span>이유 '+r.reasoned+'/5</span>'+
 '<span>선지 메모 출처 '+r.sourced+'/5</span>'+
 '<span>해설 초안 출처 '+r.draftSourced+'/5</span>'+
 (r.visual?'<span>그림/표 대조</span>':'')+'</div>'+
 '<div class="ck111-actions"><button type="button" data-ck111-analyze="'+r.id+'">문항 분석</button>'+
 '<button type="button" data-ck111-edit="'+r.id+'">①~⑤ 개인 근거 작성</button>'+
 '<button type="button" data-ck112-draft="'+r.id+'">내 해설 초안 작성</button>'+
 '<button type="button" data-ck112-voice-row="'+r.id+'">▶ 바로 듣기</button></div></article>'
 ).join('')||'<p>해당 조건의 문항이 없습니다.</p>')+'</div>'+
 '<nav class="ck111-pages" aria-label="검토 대기열 페이지"><button type="button" data-ck111-page="prev"'+
 (page===0?' disabled':'')+'>이전</button><span>'+(page+1)+' / '+last+'</span>'+
 '<button type="button" data-ck111-page="next"'+(page===last-1?' disabled':'')+'>다음</button></nav>'+
 '</div></details>';
 panel.querySelector('details')?.addEventListener('toggle',event=>{expanded=Boolean(event.target.open)});
}
function mount(){
 const prior=document.getElementById('ck111-review-queue');
 if(prior){panel=prior;return panel;}
 const target=document.querySelector('#ck103-tools-dock .ck103-tools-content');
 if(!target)return null;
 panel=document.createElement('section');panel.id='ck111-review-queue';panel.className='ck111-review-queue';
 target.append(panel);paint();return panel;
}
function open(){
 if(!mount())return false;
 const dlg=document.getElementById('ck78-analysis-dialog');
 if(dlg?.open&&window.CK80Editorial?.confirmLeave?.()===false)return false;
 if(dlg?.open)dlg.close();
 const dock=panel.closest?.('#ck103-tools-dock');if(dock)dock.open=true;
 expanded=true;paint();panel.scrollIntoView?.({behavior:'smooth',block:'nearest'});return true;
}
async function loadAll(){
 status='공식 문제 등록 상태 확인 중…';paint();
 try{if(!window.CK89OfficialBank?.loadAll)throw Error('loader unavailable');
  await window.CK89OfficialBank.loadAll();status='공식 문제 등록 상태를 다시 확인했습니다.';}
 catch{status='원문 등록 실패 · 인터넷 연결 또는 공식 데이터 상태를 확인하세요.';}
 paint();
}
function decorate(){
 if(!mount())return;
 const head=document.querySelector('#ck76-search .ck76-search-head');
 if(head&&!head.querySelector('[data-ck111-open]')){
  const b=document.createElement('button');b.type='button';b.dataset.ck111Open='1';
  b.className='ck111-open';b.textContent='선지 근거 검토';head.append(b);
 }
}
document.addEventListener('click',event=>{
 if(event.target.closest?.('[data-ck111-open]')){event.preventDefault();open();return;}
 if(!panel?.contains(event.target))return;
 const b=event.target.closest?.('button');if(!b)return;
 if(b.hasAttribute('data-ck112-workbench')){
  if(!window.CK81Workbench?.open){status='10개년 작업대를 아직 불러오지 못했습니다.';paint();return;}
  window.CK81Workbench.open();return;
 }
 if(b.hasAttribute('data-ck112-voice-stop')){
  window.CK76Voice?.stop?.();status='음성 정지를 요청했습니다.';paint();return;
 }
 if(b.hasAttribute('data-ck112-voice-top')){
  const chosen=rows().filter(matches).slice(page*PAGE,page*PAGE+5).map(x=>x.id);
  const pref=window.CK76Voice?.getPreferences?.()||{},mode=
   ['qa','answer','all'].includes(pref.mode)?pref.mode:'qa';
  const answer=window.CK76Voice?.playSelected?.(chosen,mode);
  status=answer?.ok?'현재 페이지 '+answer.items+'문항 듣기 요청 · 실제 소리를 기기에서 확인하세요.':
   answer?.reason==='incomplete-selection'?'원문 미로딩 문항이 있어 부분 재생을 중단했습니다.':
   '선택 문항 재생 실패 · TTS 설정이나 정답 인정 예외를 확인하세요.';
  paint();return;
 }
 if(b.hasAttribute('data-ck112-voice-row')){
  const id=b.dataset.ck112VoiceRow;
  if(!validId(id))return;
  const [y,n]=id.split('-').map(Number),pref=window.CK76Voice?.getPreferences?.()||{};
  const mode=['qa','answer','all'].includes(pref.mode)?pref.mode:'qa';
  const answer=window.CK76Voice?.playOfficial?.(y,n,mode,'single');
  status=answer?.ok?y+'년 '+n+'번 듣기 요청 · 실제 소리를 기기에서 확인하세요.':
   '문항 재생 실패 · 공식 원문·전원정답 처리·음성 설정을 확인하세요.';
  paint();return;
 }
 if(b.hasAttribute('data-ck111-load')){loadAll();return;}
 if(b.hasAttribute('data-ck111-export')){saveCsv(b.dataset.ck111Export);return;}
 if(b.hasAttribute('data-ck111-page')){page=Math.max(0,page+(b.dataset.ck111Page==='next'?1:-1));paint();return;}
 const id=b.dataset.ck111Analyze||b.dataset.ck111Edit||b.dataset.ck112Draft;
 if(!validId(id))return;
 if(b.hasAttribute('data-ck112-draft')){
  const [y,n]=id.split('-').map(Number);
  if(!window.CK78Analysis?.open){status='문항 분석 화면이 준비되지 않았습니다.';paint();return;}
  Promise.resolve(window.CK78Analysis.open(y,n,b)).then(ok=>{
   if(ok===true){
    const editor=document.querySelector('#ck78-analysis-dialog [data-ck80-toggle]');
    if(editor)editor.click();
    else{status='개인 해설 편집기가 아직 준비되지 않았습니다.';paint();}
   }else{status='해설 편집 진입 실패 · 공식 원문을 다시 확인하세요.';paint();}
  }).catch(()=>{status='해설 편집 진입 중 오류 발생';paint();});
  return;
 }
 if(b.hasAttribute('data-ck111-analyze')){
  const [y,n]=id.split('-').map(Number);
  Promise.resolve(window.CK78Analysis?.open?.(y,n,b)).then(ok=>{
   if(ok===false){status='문항 분석 열기 실패 · 공식 원문을 불러온 뒤 재시도하세요.';paint();}
  }).catch(()=>{status='문항 분석 열기 실패';paint();});
 }else{
  Promise.resolve(window.CK83Links?.openQuestion?.(id)).then(ok=>{
   if(ok===false){status='개인 근거 편집기 열기 실패 · 원문 로딩을 확인하세요.';paint();}
  }).catch(()=>{status='개인 근거 편집기 열기 실패';paint();});
 }
});
document.addEventListener('change',event=>{
 if(!panel?.contains(event.target))return;
 const el=event.target;
 if(el.matches?.('[data-ck111-year]'))year=/^(?:all|201[6-9]|202[0-5])$/.test(el.value)?el.value:'all';
 else if(el.matches?.('[data-ck111-subject]'))subject=['all','estate','civil'].includes(el.value)?el.value:'all';
 else if(el.matches?.('[data-ck111-condition]'))condition=['all','no-source','no-draft-source','incomplete','ready','special','visual','calc','legal','low-text'].includes(el.value)?el.value:'no-source';
 else return;
 page=0;paint();
});
document.addEventListener('ck:personal-links-updated',()=>{if(expanded&&panel?.isConnected)paint();});
document.addEventListener('ck:personal-editor-updated',()=>{if(expanded&&panel?.isConnected)paint();});
window.addEventListener('ck:official-bank-ready',()=>{if(panel?.isConnected)paint();});
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;decorate();});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
const main=document.getElementById('main');
if(main&&window.MutationObserver)new MutationObserver(changes=>{
 if(changes.some(c=>Array.from(c.addedNodes).some(n=>n.nodeType===1&&
 (n.matches?.('#ck103-tools-dock,#ck76-search')||n.querySelector?.('#ck103-tools-dock,#ck76-search')))))schedule();
}).observe(main,{childList:true,subtree:true});
window.CK111Evidence=Object.freeze({rows,bankComplete,summary,csvDocument,csv,open,getState:()=>({expanded,year,subject,condition,page,loaded:rows().length})});
})();
