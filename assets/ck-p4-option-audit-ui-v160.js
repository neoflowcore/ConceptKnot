/* ConceptKnot v160: evidence-first 2000-option audit viewer for the existing P4 workbench.
 * UI is read-only until the user explicitly opens personal option notes; never grants expert signoff.
 */
(function(){
'use strict';
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const formatted=n=>Number(n||0).toLocaleString('ko-KR');
const state={open:false,year:0,subject:'all',flag:'missing',page:0,pageSize:20};
let cacheRows=null,cacheResult=null;
function result(rows){
 if(!Array.isArray(rows))return null;
 if(cacheRows!==rows){
  cacheRows=rows;
  cacheResult=window.CK160OptionAudit?.build?.(rows)||null;
 }
 return cacheResult;
}
function aiNote(r){return window.CK164SubstantiveReview?.get?.(r)||window.CK162SubstantiveReview?.get?.(r)||window.CK161SubstantiveReview?.get?.(r)||null}
function matching(a){
 return (a?.rows||[]).filter(r=>
  (!state.year||r.year===state.year)&&
  (state.subject==='all'||r.subject===state.subject)&&
  (state.flag==='all'||
   (state.flag==='missing'&&!r.draftAvailable&&!aiNote(r))||
   (state.flag==='draft'&&r.draftAvailable)||
   (state.flag==='ai'&&aiNote(r))||
   (state.flag==='pending'&&!aiNote(r))||
   (state.flag==='law'&&r.needsLawSource)||
   (state.flag==='math'&&r.needsCalculation)||
   (state.flag==='visual'&&r.needsOriginalVisual)||
   (state.flag==='special'&&r.special)));
}
function options(list,current){
 return list.map(([value,label])=>'<option value="'+escape(value)+'"'+
  (String(current)===String(value)?' selected':'')+'>'+escape(label)+'</option>').join('');
}
function row(r){
 const source=r.sourceRefs||{};
 const note=aiNote(r);
 const refs=note?.sources?.filter(x=>x.type==='POTENTIAL_PRIMARY_LEGAL_OR_REFERENCE_LINK')||[];
 return '<article class="ck160-option-item" data-ck160-option-id="'+escape(r.id)+'">'+
  '<div class="ck160-option-heading"><strong>'+r.year+'년 '+r.number+'번 · '+
   (r.subject==='estate'?'학개론':'민법')+' · 선지 '+r.index+'</strong>'+
   '<small>'+(r.officialAccepted?'공식 채점상 인정':'공식 채점상 비인정')+
   ' · 선지 내용 진위 미검수</small></div>'+
  '<p class="ck160-option-question">'+escape(r.questionText)+'</p>'+
  '<p class="ck160-option-statement">'+r.index+'. '+escape(r.optionText)+'</p>'+
  '<p class="ck160-option-flags">'+escape(r.flags.join(' · '))+'</p>'+
  '<details><summary>'+(r.draftAvailable?'기존 학습용 근거 후보 보기':'선지별 근거 초안 미작성')+
   '</summary><p>'+escape(r.draftReason||'기존 후보 설명이 없습니다. 조문·판례·원문·정의·계산식을 독립적으로 확인해야 합니다.')+
   '</p><p>'+escape(r.reviewTask)+'</p></details>'+
  (note?'<details class="ck161-substantive-draft"><summary>AI 개별 선지 근거 초안 · 원전·전문가 미검수</summary>'+
   '<p>'+escape(note.text)+'</p>'+ 
   (note.calculation?.equation?'<p><strong>독립 계산 검산: </strong>'+escape(note.calculation.equation)+'</p>':'')+
   '<p>출제 당시 법령·판례 전문 및 시험지·정답 PDF의 독립 검수는 별도입니다. 검수 완료나 참·거짓 확정으로 취급하지 않습니다.</p>'+
   (refs.length?'<div class="ck161-draft-refs">'+refs.map((x,i)=>
    '<a href="'+escape(x.url)+'" target="_blank" rel="noopener noreferrer">근거 후보 자료 '+(i+1)+' (새 탭)</a>').join('')+'</div>':'')+
   '</details>':'')+
  '<div class="ck160-option-buttons">'+
   '<button type="button" data-ck160-personal="'+escape(r.questionId)+'">개인 선지 근거 기록</button>'+
   (source.paperNotice?'<a href="'+escape(source.paperNotice)+'" target="_blank" rel="noopener noreferrer">Q-Net 원문 문제지</a>':'')+
   (source.finalAnswerNotice?'<a href="'+escape(source.finalAnswerNotice)+'" target="_blank" rel="noopener noreferrer">최종정답 공고(새 탭)</a>':'')+
   (r.needsLawSource?'<a href="https://www.law.go.kr/" target="_blank" rel="noopener noreferrer">국가법령정보센터 · '+r.year+'년 연혁 확인</a>'+ 
    '<a href="https://glaw.scourt.go.kr/wsjo/intesrch/sjo022.do" target="_blank" rel="noopener noreferrer">대법원 판례검색</a>':'')+
   '</div></article>';
}
function details(a){
 if(!state.open||!a?.ready)return '';
 const filtered=matching(a),pages=Math.max(1,Math.ceil(filtered.length/state.pageSize));
 state.page=Math.min(pages-1,Math.max(0,state.page));
 const showing=filtered.slice(state.page*state.pageSize,(state.page+1)*state.pageSize);
 return '<div class="ck160-option-details">'+
  '<div class="ck160-option-filters">'+
  '<label>연도<select data-ck160-filter="year">'+options([[0,'최근 5개년 전체'],...[2025,2024,2023,2022,2021].map(y=>[y,y+'년'])],state.year)+'</select></label>'+
  '<label>과목<select data-ck160-filter="subject">'+options([['all','전체'],['estate','학개론'],['civil','민법']],state.subject)+'</select></label>'+
  '<label>검토 그룹<select data-ck160-filter="flag">'+
    options([['all','전체 2,000선지'],['missing','근거 초안 누락'],['draft','기존 초안 있음'],
     ['ai','AI 개별 근거 초안 있음'],['pending','AI 개별 근거 미작성'],['law','법령·판례 대조'],['math','수치·계산 재검산'],['visual','원본 그림·표 대조'],['special','복수·전원정답']],state.flag)+
   '</select></label></div>'+
  '<div class="ck160-option-pager"><strong>'+filtered.length+'선지 · '+(state.page+1)+'/'+pages+'쪽</strong>'+
  '<button type="button" data-ck160-page="prev"'+(state.page===0?' disabled':'')+'>이전</button>'+
  '<button type="button" data-ck160-page="next"'+(state.page===pages-1?' disabled':'')+'>다음</button></div>'+
  (showing.length?'<div class="ck160-option-list">'+showing.map(row).join('')+'</div>':
   '<p role="status">현재 필터에 해당하는 선지가 없습니다.</p>')+
  '</div>';
}
function panel(rows){
 const a=result(rows);
 if(!a?.ready)return '<section class="ck160-option-panel ck160-option-error" role="status">'+
  '<strong>독립 선지 2,000건 원전 대조 준비 미완료</strong><p>문항 400건·선지 2,000개 연결이 불완전하여 검수표를 내보내지 않습니다.</p>'+
  '<p>'+escape((a?.errors||['검수 엔진이 로드되지 않았습니다.']).slice(0,4).join(' / '))+'</p></section>';
 const t=a.stats;
 const aiCount=a.rows.filter(r=>aiNote(r)).length;
 const anyCandidate=a.rows.filter(r=>r.draftAvailable||Boolean(aiNote(r))).length;
 return '<section class="ck160-option-panel">'+
  '<header><strong>선지 2,000개 · 개별 원전 검수 준비</strong>'+
   '<small>공식 인정정답은 채점 메타데이터이며 각 선지의 사실·법적 진위 판정이 아닙니다.</small></header>'+
  '<dl class="ck160-option-metrics">'+[
    ['원문·선지 연결',formatted(t.options)+'/2000'],
    ['기존 근거 초안 · 이전 자료',formatted(t.optionsWithDraft)+'/2000'],
    ['AI 포함 전체 근거 후보 · 미검수',formatted(anyCandidate)+'/2000'],
    ['근거 후보 미작성',formatted(t.options-anyCandidate)+'/2000'],
    ['법령·판례 검토 후보',formatted(t.lawOptions)+'선지'],
    ['계산 검토 후보',formatted(t.calculationOptions)+'선지'],
    ['전문가 검수 완료',formatted(t.expertVerified)+'/2000'],
    ['AI 독립 근거 초안 · 미검수',formatted(aiCount)+'/2000']
   ].map(([label,value])=>'<div><dt>'+escape(label)+'</dt><dd>'+escape(value)+'</dd></div>').join('')+
  '</dl><p>시험 당시 적용 법령·판례·수치 근거와 검수자를 확인하지 않은 항목은 검수 완료로 처리하지 않습니다.</p>'+
  '<div class="ck160-option-buttons">'+
   '<button type="button" data-ck160-toggle aria-expanded="'+state.open+'">'+
    (state.open?'개별 선지 목록 접기':'2,000개 선지 하나씩 검토')+'</button>'+
   '<button type="button" data-ck160-csv>2,000개 선지 원전 대조 CSV</button>'+
   '<button type="button" data-ck160-txt>현재 필터 상위 5문항 대조 TXT</button>'+
   '<button type="button" data-ck161-ai-txt'+(!aiCount?' disabled':'')+
   '>AI 독립 근거 초안 '+aiCount+'선지 TXT</button>'+
   '</div>'+details(a)+'</section>';
}
function clicked(t,rows,download,message,openPersonal){
 if(t.hasAttribute('data-ck160-toggle')){state.open=!state.open;state.page=0;return {handled:true,render:true};}
 if(t.hasAttribute('data-ck160-page')){
  state.page+=t.dataset.ck160Page==='next'?1:-1;return {handled:true,render:true};
 }
 if(t.hasAttribute('data-ck160-personal')){
  try{openPersonal?.(t.dataset.ck160Personal)}catch(e){message('개인 선지 노트를 열지 못했습니다: '+String(e?.message||e))}
  return {handled:true,render:false};
 }
 const a=result(rows);
 if(t.hasAttribute('data-ck160-csv')){
  if(!a?.ready){message('공식 400문항 또는 선지 2,000개 원문 연결이 불완전해 CSV를 출력하지 않습니다.');return {handled:true};}
  const content=window.CK160OptionAudit.csv(a);
  if(!content){message('2,000선지 검수표 생성에 실패했습니다.');return {handled:true};}
  download('ConceptKnot_P4_선지2000_근거대조_'+new Date().toISOString().slice(0,10)+'.csv',
   content,'text/csv;charset=utf-8');
  message('선지 2,000개 대조표를 내보냈습니다. 실제 전문가 검수 완료가 아닙니다.');
  return {handled:true};
 }
 if(t.hasAttribute('data-ck161-ai-txt')){
  if(!a?.ready){message('기출 원전 자료 연결이 불완전해 AI 근거 초안을 내보내지 않습니다.');return {handled:true};}
  const batch=a.rows.map(r=>({r,n:aiNote(r)})).filter(x=>x.n);
  if(!batch.length){message('AI 독립 근거 초안이 없습니다.');return {handled:true};}
  const lines=['ConceptKnot v164 · 2025 전체 선지별 AI 학습용 미검수 초안',
   '중요: 공식 원전 PDF·시험 당시 법령 및 판례 전체를 전문가가 검수한 자료가 아닙니다. 모든 선지의 정식 검수 상태는 미검수입니다.',
   '공식 인정답은 채점 정보일 뿐 모든 선지 참/거짓 확정 근거가 아닙니다.'];
  for(const {r,n} of batch)lines.push('',
   r.questionId+' 선지 '+r.index+' · '+(r.officialAccepted?'공식 인정 번호':'비인정 번호'),
   '원문: '+r.optionText,
   'AI 대조 초안: '+n.text,
   (n.calculation?.equation?'계산 검산식: '+n.calculation.equation+' (공식 원본 PDF 대조와 별개)':''),
   '자료: '+n.sources.filter(x=>x.type==='POTENTIAL_PRIMARY_LEGAL_OR_REFERENCE_LINK').map(x=>x.url).join(' · '),
   '원전 PDF 대조: 미완료 / 개별 근거 핀포인트: 미확인 / 전문가 검수: 미완료');
  download('ConceptKnot_v164_AI선지근거_'+batch.length+'건_미검수_'+new Date().toISOString().slice(0,10)+'.txt',
   lines.join('\n'),'text/plain;charset=utf-8');
  message('AI 독립 근거 학습 초안 '+batch.length+'건을 TXT로 내보냈습니다. 수식 자체의 독립 검산 외 전문 원전 검수·공식 해설은 아닙니다.');
  return {handled:true};
 }
 if(t.hasAttribute('data-ck160-txt')){
  if(!a?.ready){message('원문 연결이 불완전해 검토 TXT를 출력하지 않습니다.');return {handled:true};}
  const ids=[...new Set(matching(a).map(r=>r.questionId))].slice(0,5);
  const content=window.CK160OptionAudit.packet(a,ids,5);
  if(!content){message('현재 선택된 문항이 없습니다. 필터를 변경하세요.');return {handled:true};}
  download('ConceptKnot_P4_선지독립검토_'+new Date().toISOString().slice(0,10)+'.txt',
   content,'text/plain;charset=utf-8');
  message('최대 5문항의 ①~⑤ 독립 근거 대조서를 생성했습니다. 실제 검수는 별도로 진행해야 합니다.');
  return {handled:true};
 }
 return {handled:false};
}
function changed(t){
 if(!t.matches?.('[data-ck160-filter]'))return false;
 const k=t.dataset.ck160Filter;
 if(k==='year')state.year=Number(t.value)||0;
 else if(k==='subject'&&['all','estate','civil'].includes(t.value))state.subject=t.value;
 else if(k==='flag'&&['all','missing','draft','law','math','visual','special','ai','pending'].includes(t.value))
  state.flag=t.value;
 state.page=0;return true;
}
window.CK160OptionUI=Object.freeze({panel,result,clicked,changed,getState:()=>({...state})});
})();