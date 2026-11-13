/* ConceptKnot P4/P5: source-bound 800-question analysis viewer.
 * Canonical answers are immutable. Draft rationales never acquire "verified" status.
 * User notes reuse the existing local study state / backup. No external posting.
 */
(function(){
'use strict';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl=url=>/^https:\/\/(?:[\w.-]+)(?:\/|$)/.test(String(url||''))?String(url):'';
const years=new Map(),requests=new Map();
let dialog,trigger=null,selected=null,taxonomy=null,openGeneration=0;
let noteDirty=false,noteTimer=0;
const names={estate:'부동산학개론',civil:'민법 및 민사특별법'};
const typeNames={select_incorrect:'틀린 지문 찾기',select_correct:'옳은 지문 찾기',
 compound_statements:'ㄱ·ㄴ·ㄷ 진술 조합',calculation_or_numeric:'계산·수치 확인',
 legal_temporal_review:'시험연도 법령 확인',visual_original_check:'그림·표 원문 대조',
 multiple_accepted:'복수정답 인정',all_accepted:'전원정답 처리'};

/* v107: classifications are review hints, never claims that an option is true. */
function classify(q,entry=null){
 if(!q||typeof q.question!=='string')return [];
 const word=q.question.normalize('NFKC'),hints=(entry?.questionType||[]).filter(t=>typeNames[t]);
 if(/옳지\s*않|틀린|아닌\s*것|잘못된\s*것/.test(word))hints.push('select_incorrect');
 else if(/옳은\s*것|맞는\s*것|타당한\s*것/.test(word))hints.push('select_correct');
 if(/[ㄱ-ㅎ][\s.、)]/.test(word)||/ㄱ.*ㄴ.*ㄷ/.test(word))hints.push('compound_statements');
 if(/계산|산출|수익률|탄력성|현재가치|할인율|평균|분산|원가|공급량|수요량/.test(word))hints.push('calculation_or_numeric');
 if(/그림|그래프|도표|아래\s*표|곡선/.test(word)||q.diagrams?.length)hints.push('visual_original_check');
 if(/판례|법령|법률|민법|법정|개정|시행\s*당시/.test(word))hints.push('legal_temporal_review');
 const keys=Array.isArray(q.correct)?q.correct:[];
 if(keys.length===5)hints.push('all_accepted');
 else if(keys.length>1)hints.push('multiple_accepted');
 return [...new Set(hints)];
}
function personalProgress(q){
 const entry=window.CK83Links?.getLink?.(q?.id)||{};
 const notes=entry.optionNotes||{};
 const all=Array.from({length:5},(_,i)=>notes[String(i+1)]||{});
 return {concepts:Array.isArray(entry.conceptIds)?entry.conceptIds.length:0,
  assessed:all.filter(n=>['true','false','conditional'].includes(n.assessment)).length,
  reasoned:all.filter(n=>String(n.reason||'').trim()).length,
  sourced:all.filter(n=>String(n.source||'').trim()).length};
}
function reviewSteps(q,entry=null){
 const kinds=classify(q,entry);
 const prompts=['문제가 옳은 지문과 틀린 지문 중 무엇을 묻는지 표시하고, 5개 선지의 판단을 각각 기록하세요.',
  '정답 인정과 각 선지의 법적·사실적 진위를 구분하고 시험연도 원문을 대조하세요.',
  '법령·판례·교재의 정확한 조문 또는 페이지를 적고 기준 시행일을 확인하세요.'];
 if(kinds.includes('compound_statements'))prompts.push('ㄱ·ㄴ·ㄷ 진술을 각각 검토한 다음 조합형 보기와 대조하세요.');
 if(kinds.includes('calculation_or_numeric'))prompts.push('주어진 수치·단위·반올림 조건을 표시하고 계산식과 대입 과정을 별도로 검산하세요.');
 if(kinds.includes('visual_original_check'))prompts.push('그림·그래프·표는 텍스트만으로 판단하지 말고 원본 PDF를 확인하세요.');
 if(kinds.includes('all_accepted'))prompts.push('전원정답은 채점상 ①~⑤ 인정이며 5개 선지가 모두 참이라는 뜻이 아닙니다.');
 else if(kinds.includes('multiple_accepted'))prompts.push('복수정답이 인정된 배경과 지문별 옳고 그름을 별개로 검토하세요.');
 return prompts;
}
function learningActions(q,entry){
 const progress=personalProgress(q);
 const steps=reviewSteps(q,entry);
 return '<section class="ck107-learning-flow"><h3>분석 → 선지 근거 → 인출 복습</h3>'+
  '<p class="ck107-review-caption">자동 분류는 검토 후보입니다. 개인 메모도 공식 해설의 검증 상태를 바꾸지 않습니다.</p>'+
  '<div class="ck107-personal-progress"><span>개인 개념 연결 '+progress.concepts+'건</span>'+
   '<span>선지 판단 '+progress.assessed+'/5</span>'+
   '<span>판단 이유 '+progress.reasoned+'/5</span>'+
   '<span>근거 출처 '+progress.sourced+'/5</span></div>'+
  '<details><summary>문항 검토 체크리스트 · '+steps.length+'항목</summary><ol>'+
    steps.map(s=>'<li>'+esc(s)+'</li>').join('')+'</ol></details>'+
  '<div class="ck107-learning-buttons"><button data-ck107-personal-link type="button">선지별 판단·근거 작성</button>'+
  '<button data-ck107-open-exam type="button">원래 기출문제로 이동</button></div></section>';
}
function voiceToolbar(){
 const pref=window.CK76Voice?.getPreferences?.()||{engine:'native',rate:1.5,mode:'qa',neuralVoice:'F1'};
 const bookmark=window.CK76Voice?.getBookmark?.();
 let due=0;try{due=Number(window.CK86ExamBridge?.getDue?.()?.due)||0;}catch{}
 const engine=pref.engine==='neural'?'AI 여성 '+pref.neuralVoice:'기기 한국어 음성';
 const summary='현재 '+engine+' · '+pref.rate+'배 · 개인 복습 대기 '+due+'문항'+
  (bookmark?' · 이어 듣기 '+bookmark.year+'년 '+bookmark.number+'번부터':'');
 return '<section class="ck107-voice-toolbar" aria-label="현재 문항 음성 읽기"><h3>선택한 문항 음성 학습</h3>'+
  '<p>선택한 음성 엔진·배속을 사용합니다. 정답 인정과 선지의 참·거짓은 별개입니다.</p>'+
  '<p class="ck107-voice-preference">'+esc(summary)+'</p>'+
  '<div role="group" aria-label="문제 읽기 방식" class="ck107-voice-buttons">'+
  '<button type="button" data-ck107-voice="qa">▶ 문제 + 정답</button>'+
  '<button type="button" data-ck107-voice="answer">▶ 정답만</button>'+
  '<button type="button" data-ck107-voice="all">▶ 문제 + 5선지</button>'+
  '<button type="button" data-ck107-voice-scope="subject">과목 40문항 연속</button>'+
  '<button type="button" data-ck107-voice-resume>▶ 중단 지점 이어 듣기</button>'+
  '<button type="button" data-ck109-due>▶ 내 오답·복습 대기 듣기</button>'+
  '<button type="button" data-ck111-open>선지 근거 검토 대기열</button>'+
  '<button type="button" data-ck107-voice-pause>일시정지 / 계속</button>'+
  '<button type="button" data-ck107-voice-stop>■ 정지</button>'+ 
  '<button type="button" data-ck107-voice-retry>↻ 끊긴 문장 재시도</button></div>'+
  '<p class="ck107-voice-status" data-ck107-voice-status role="status" aria-live="polite">'+
  '장시간 재생·백그라운드·AI 모델 음색은 실제 기기 검증 전입니다.</p></section>';
}
function yearCoverage(){
 const bank=window.RECALL_OFFICIAL||{};
 const years=Array.from({length:10},(_,i)=>2025-i).map(year=>{
  const entries=Array.from({length:80},(_,i)=>bank[year+'-'+(i+1)]).filter(q=>q?.verified===true);
  return {year,loaded:entries.length,special:entries.filter(q=>q.correct?.length>1).length};
 });
 const count=years.reduce((a,r)=>a+r.loaded,0);
 const personal=window.CK83Links?.reviewSummary?.()||{};
 return '<div class="ck107-coverage"><h3>10개년 원문·개인 근거 등록 현황</h3>'+
  '<p>현재 브라우저에 로드된 공식 문항 '+count+'/800개 · 개인 연결 문항 '+
   Number(personal.questions||0)+'/800개 · 내 선지 출처 기입 '+
   Number(personal.sourceLinked||0)+'/4000개</p>'+
  '<div class="ck107-year-grid">'+years.map(r=>'<div><strong>'+r.year+'년</strong>'+
   '<span>원문 '+r.loaded+'/80 · 특수정답 '+r.special+'건</span></div>').join('')+'</div>'+
  '<p>원문 등록·개인 연결은 해설 및 법령·판례의 전문가 검수 완료를 의미하지 않습니다.</p></div>';
}

function lookup(id){const q=window.RECALL_OFFICIAL?.[id];return q?.verified===true?q:null;}
async function dataFor(year){
 if(year<2021||year>2025)return null;
 if(years.has(year))return years.get(year);
 if(requests.has(year))return requests.get(year);
 const promise=fetch('./data/explanations/official-'+year+'.json',{cache:'force-cache'})
  .then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json()})
  .then(payload=>{
   if(payload.year!==year||payload.records?.length!==80)throw Error('해설 데이터 구조 불일치');
   const map=new Map(payload.records.map(x=>[x.questionId,x]));
   years.set(year,map);return map;
  }).finally(()=>requests.delete(year));
 requests.set(year,promise);return promise;
}
async function loadTaxonomy(){
 if(taxonomy)return taxonomy;
 try{const r=await fetch('./data/concept-taxonomy-v1.json',{cache:'force-cache'});
  if(r.ok){const j=await r.json();taxonomy=new Map(j.concepts.map(x=>[x.id,x]));return taxonomy;}
 }catch{}
 return new Map();
}
function modal(){
 if(dialog)return dialog;
 dialog=document.createElement('dialog');dialog.id='ck78-analysis-dialog';
 dialog.className='ck78-analysis-dialog';dialog.setAttribute('aria-labelledby','ck78-heading');
 dialog.addEventListener('click',e=>{
  if(e.target.closest?.('[data-ck78-close]'))dialog.close();
  else if(e.target===dialog)dialog.close();
 });
 dialog.addEventListener('close',()=>{
  clearTimeout(noteTimer);
  if(noteDirty)flushNote(true);
  openGeneration++;trigger?.focus?.();trigger=null;selected=null;
 });
 document.body.appendChild(dialog);
 return dialog;
}
function keyLabel(q){
 const nums=Array.isArray(q.correct)?q.correct:[];
 return nums.length===5?'전원정답 처리 (1~5번 모두 채점 인정, 모두 참이라는 뜻 아님)':
  nums.map(n=>'①②③④⑤'[Number(n)-1]||n).join(' 또는 ');
}
function related(q,entry){
 const candidate=entry?.candidateConcepts?.[0];
 if(!candidate?.word)return [];
 const keyword=String(candidate.word).normalize('NFKC').toLowerCase();
 const list=Object.values(window.RECALL_OFFICIAL||{}).filter(item=>
  item?.verified&&item.id!==q.id&&item.subject===q.subject&&
  (item.question+' '+item.options.join(' ')).normalize('NFKC').toLowerCase().includes(keyword));
 return list.slice(0,6);
}
function noteText(q){return String(window.CK78Study?.getNote?.(q.id)||'');}
function dialogHtml(q,entry,tx,missing=false){
 const status=entry?.quality?.status||'unstarted',all=q.correct?.length===5,
   multiple=q.correct?.length>1&&!all;
 const header=q.year+'년 '+q.number+'번 · '+(names[q.subject]||q.subject);
 const types=classify(q,entry).map(x=>typeNames[x]);
 const code=entry?.questionId||q.id;
 const draft=status==='draft',published=status==='published';
 const notes=entry?.notes||'';
 const source=safeUrl(q.originalUrl)||'https://www.q-net.or.kr/cst003.do?gId=08&gSite=L&id=cst00309';
 const reasonList=entry?.options||[];
 const candidates=(entry?.candidateConcepts||[]).slice(0,5).map(x=>
  '<span class="ck78-concept" title="자동 키워드 일치 · 검수 전">'+
  esc(tx.get(x.conceptId)?.label||x.word)+' · 후보</span>').join('');
 const similar=related(q,entry);
 return '<div class="ck78-modal-head"><div><small>공식 A형 · 문항 분석 · '+esc(draft?'학습용 해설 초안':'해설 검수 상태')+
  '</small><h2 id="ck78-heading">'+esc(header)+'</h2></div>'+
  '<button type="button" data-ck78-close aria-label="닫기">×</button></div>'+
  '<div class="ck78-modal-scroll">'+
  voiceToolbar()+
  '<p class="ck78-status-line">최종정답: <strong>'+esc(keyLabel(q))+'</strong></p>'+
  (all||multiple?'<p class="ck78-warning">'+(all?
   '전원정답은 5개 선지가 모두 옳다는 뜻이 아닙니다. 채점 인정과 진위 판단은 분리해 확인하세요.':
   '복수정답으로 인정된 지문은 각각 독립적으로 근거를 검토하세요.')+'</p>':'')+
  '<section class="ck78-raw"><h3>공식 문제 · 원문 대조 필요</h3><p>'+esc(q.question)+'</p>'+
  '<ol class="ck78-options">'+q.options.map((value,i)=>{
   const recognized=q.correct.includes(i+1);
   const draftReason=reasonList[i]?.draftReason;
   return '<li><div><strong class="'+(recognized?'ck78-recognized':'')+'">'+
    '①②③④⑤'[i]+(recognized?' · 채점 인정':' · 채점 미인정')+'</strong>'+
    '<span>'+esc(value)+'</span></div>'+
    (draft&&draftReason?'<p>초안 설명 · 근거 검수 전: '+esc(draftReason)+'</p>':
     '<p>선지 판단 근거: 검수 전 · 자체 복습 메모로 보완</p>')+'</li>';
  }).join('')+'</ol></section>'+
  (draft?'<section class="ck78-draft"><h3>학습용 해설 초안 · 공식 검수 전</h3>'+
    '<p>'+esc(entry.summaryEasy||'')+'</p><p>'+esc(entry.answerReason||'')+'</p>'+
    (entry.traps?.length?'<p>혼동 포인트: '+esc(entry.traps[0].text)+'</p>':'')+
    '</section>':'<section class="ck78-empty"><p>이 문항은 해설 작성·법령·판례 검수가 완료되지 않았습니다. 아래 체크리스트와 메모로 학습을 진행하세요.</p></section>')+
  (missing?'<p class="ck78-warning">연도별 해설 파일을 불러오지 못했습니다. 공식 문제와 최종정답 표시만 사용할 수 있습니다.</p>':'')+
  learningActions(q,entry)+
  '<section class="ck78-review"><h3>분석 및 검토 대상</h3>'+
  '<p>'+esc(types.length?types.join(' · '):'정답 근거 · 선지별 판단 · 시험 당시 법령 확인')+'</p>'+
  (notes?'<p>'+esc(notes)+'</p>':'')+
  (entry?.compoundStatements?.length?'<details><summary>ㄱ·ㄴ·ㄷ 원문 진술 '+entry.compoundStatements.length+'개 · 진위 미검수</summary>'+
   '<ol>'+entry.compoundStatements.map(x=>'<li>'+esc(x.key+' · '+x.sourceText)+'</li>').join('')+'</ol></details>':'')+
  (candidates?'<p>개념 연결 후보: '+candidates+'</p>':'<p>검수된 연결 개념은 아직 등록되지 않았습니다.</p>')+
  '<p class="ck78-review-disclaimer">해설 작성 '+(draft?'초안':'대기')+
  ' · 선지별 진위 검수 '+(entry?.quality?.optionVerdictsReviewed||0)+'/5 · 출제 빈도 검수 전 · 현행법과 시험연도 법령 별도 확인</p>'+
  '</section>'+
  '<section class="ck80-editor-entry"><button type="button" data-ck80-toggle aria-expanded="false">내 해설 초안 작성/수정</button><p>공식 자료와 별개로 근거를 확인하면서 작성합니다. 게시/검수 상태는 자동으로 승격되지 않습니다.</p><div data-ck80-workspace hidden></div></section>'+ 
  '<section class="ck78-notes"><label for="ck78-personal-note">내 풀이·오답 원인 메모 (기존 학습 데이터에 저장)</label>'+
  '<textarea id="ck78-personal-note" maxlength="6000" rows="3" placeholder="근거를 직접 작성하세요." aria-label="내 풀이 및 오답 메모 자동 저장">'+esc(noteText(q))+'</textarea>'+
  '<div class="ck78-note-actions"><button type="button" data-ck78-note-save>메모 저장</button>'+
  '<button type="button" data-ck78-ai-copy>AI 해설 질문 복사</button>'+
  '<span data-ck78-status role="status"></span></div>'+
  '<textarea data-ck78-copy-fallback rows="4" hidden aria-label="AI 질문 수동 복사"></textarea></section>'+
  (similar.length?'<section class="ck78-related"><h3>원문 키워드 일치 · 유사 여부 미검수</h3>'+
   '<div>'+similar.map(p=>'<button type="button" data-ck78-open-question="'+esc(p.id)+'">'+
   p.year+'년 '+p.number+'번</button>').join('')+'</div></section>':'')+
  '<p class="ck78-modal-source"><a href="'+esc(source)+'" target="_blank" rel="noopener noreferrer">시험지/원문 참조 링크 · 제공처 확인</a> · '+
  '<a href="https://www.q-net.or.kr/cst003.do?gId=08&amp;gSite=L&amp;id=cst00309" target="_blank" rel="noopener noreferrer">Q-Net 공식 출처 확인</a></p>'+
  '</div>'+
  '<footer class="ck78-modal-footer"><button data-ck78-prev type="button" '+(q.number<=1?'disabled':'')+'>← 이전 문항</button>'+
  '<button data-ck78-next type="button" '+(q.number>=80?'disabled':'')+'>다음 문항 →</button>'+
  '<button data-ck78-close type="button">닫기</button></footer>';
}
async function open(year,number,from){
 const id=Number(year)+'-'+Number(number);
 // Programmatic navigation is subject to the same unsaved-edit guard as clicks.
 if(dialog?.open&&noteDirty&&!flushNote(true))return false;
 if(dialog?.open&&window.CK80Editorial?.hasUnsavedChanges?.()&&
  window.CK80Editorial?.confirmLeave?.()===false)return false;
 if(dialog?.open&&window.CK83Links?.getStatus?.()?.unsavedEdits>0&&
  window.CK83Links?.confirmDiscard?.()===false)return false;
 const request=++openGeneration;
 let q=lookup(id);
 // Older official years are loaded separately; no guessed text if still unavailable.
 if(!q&&Number(year)>=2016&&Number(year)<=2020&&window.CK89OfficialBank?.loadYear){
  try{await window.CK89OfficialBank.loadYear(Number(year));if(request!==openGeneration)return false;q=lookup(id);}catch{return false;}
 }
 if(!q||request!==openGeneration)return false;
 const el=modal();
 if(!el.open){trigger=from||document.activeElement;el.showModal();}
 selected=id;
 el.innerHTML='<p role="status" class="ck78-loading">공식 원문과 해설 검수 상태 확인 중…</p>'+
  '<button type="button" data-ck78-close>닫기</button>';
 let found=null,missing=false,tx=new Map();
 try{const values=await Promise.all([dataFor(q.year),loadTaxonomy()]);
  found=values[0]?.get(q.id)||null;tx=values[1];
 }catch(err){missing=true;}
 if(request!==openGeneration||selected!==id||!el.open)return false;
 el.innerHTML=dialogHtml(q,found,tx,missing);
 el.dataset.ck78Current=id;
 el.querySelector('#ck78-heading')?.focus?.();
 return true;
}
function status(text){const node=dialog?.querySelector('[data-ck78-status]');if(node)node.textContent=text;}
function flushNote(silent=false,force=false){
 if(!noteDirty&&!force)return true;
 const field=dialog?.querySelector('#ck78-personal-note'),q=lookup(selected);
 if(!field||!q)return false;
 let saved=false;
 try{saved=Boolean(window.CK78Study?.saveNote?.(q.id,String(field.value||'').slice(0,6000)));}catch{}
 if(!saved){status('내 풀이 메모 저장 실패 · 내용을 복사해 보관하고 저장 권한을 확인하세요.');return false;}
 noteDirty=false;clearTimeout(noteTimer);
 if(!silent)status('내 풀이 메모 저장 완료 · 기존 학습 백업에 포함됩니다.');
 return true;
}
function saveNoteSoon(){
 clearTimeout(noteTimer);
 noteTimer=setTimeout(()=>flushNote(true),900);
}
document.addEventListener('input',event=>{
 if(event.target?.id!=='ck78-personal-note'||!dialog?.contains(event.target))return;
 noteDirty=true;status('내 풀이 메모 입력 중 · 자동 저장 대기');saveNoteSoon();
});
document.addEventListener('focusout',event=>{
 if(event.target?.id==='ck78-personal-note'&&noteDirty)flushNote(true);
},true);
document.addEventListener('cancel',event=>{
 if(event.target===dialog&&noteDirty&&!flushNote())event.preventDefault();
},true);
document.addEventListener('click',event=>{
 if(!dialog?.open||!noteDirty)return;
 const close=event.target===dialog||event.target?.closest?.('[data-ck78-close],[data-ck78-prev],[data-ck78-next],[data-ck78-open-question],[data-ck107-personal-link],[data-ck107-open-exam],[data-ck111-open],[data-ck81-toggle],.ck-v7-nav-pill .board-tab,.ck-v7-logo,[data-ck4-target],[data-ck4-prev],[data-ck4-next]');
 if(close&&!flushNote(true)){event.preventDefault();event.stopImmediatePropagation();}
},true);
window.addEventListener('beforeunload',event=>{
 if(noteDirty&&!flushNote(true)){event.preventDefault();event.returnValue='';}
});
window.addEventListener('ck:tts-state',event=>{
 if(!dialog?.open)return;
 const el=dialog.querySelector('[data-ck107-voice-status]');if(!el)return;
 const d=event.detail||{};
 const label={idle:'대기',preparing:'준비 중',ready:'준비 완료',speaking:'재생 중',
  paused:'일시정지',stopping:'종료 중',ended:'완료',error:'오류'}[d.status]||'음성';
 el.textContent=label+' · '+(d.message||'')+
  (d.position&&d.total?' · '+d.position+'/'+d.total:'');
});
function copyPrompt(){
 const q=lookup(selected);
 if(!q)return;
 const prompt=window.CK31Typing?.buildOfficialPrompt?.(q);
 if(!prompt?.text){status('현재 문항의 AI 질문 생성에 실패했습니다.');return;}
 if(typeof window.CK10?.openDock==='function'){
  window.CK10.openDock('chatgpt');
  const dock=document.getElementById('ck10-ai-question');if(dock)dock.value=prompt.text;
 }
 const fall=dialog.querySelector('[data-ck78-copy-fallback]');
 const fallback=()=>{if(!fall)return;fall.hidden=false;fall.value=prompt.text;fall.focus();fall.select();status('자동 복사가 안 되면 이 영역에서 수동 복사하세요.');};
 if(navigator.clipboard?.writeText){
  navigator.clipboard.writeText(prompt.text).then(()=>status('AI 질문 복사 완료. 선택한 AI 창에 붙여 넣으세요.'),fallback);
 }else{
  let ok=false;try{fall.hidden=false;fall.value=prompt.text;fall.select();ok=document.execCommand('copy');}catch{}
  if(ok){fall.hidden=true;status('AI 질문 복사 완료.');}else fallback();
 }
}
document.addEventListener('click',e=>{
 const button=e.target.closest?.('[data-ck30-analysis],[data-ck78-analysis]');
 if(button){
  e.preventDefault();e.stopImmediatePropagation();
  const y=Number(button.dataset.ck30Year||button.dataset.ck78Year);
  const n=Number(button.dataset.ck30Analysis||button.dataset.ck78Analysis);
  open(y,n,button);return;
 }
},true);
document.addEventListener('click',e=>{
 const target=e.target;
 if(!target?.closest)return;
 if(target.closest('[data-ck78-note-save]')){
  const q=lookup(selected),value=dialog?.querySelector('#ck78-personal-note')?.value;
  if(q){noteDirty=true;flushNote(false,true);}
  else status('저장 실패 · 현재 문항을 다시 확인하세요.');
 }
 if(target.closest('[data-ck78-ai-copy]'))copyPrompt();
 const voice=target.closest('[data-ck107-voice],[data-ck107-voice-scope],[data-ck107-voice-resume],[data-ck107-voice-pause],[data-ck107-voice-stop],[data-ck107-voice-retry],[data-ck109-due]');
 if(voice&&dialog?.contains(voice)){
  const line=dialog.querySelector('[data-ck107-voice-status]');
  if(voice.hasAttribute('data-ck107-voice-stop')){
   window.CK76Voice?.stop?.();if(line)line.textContent='음성 재생 정지 요청';return;
  }
  if(voice.hasAttribute('data-ck107-voice-pause')){
   window.CK76Voice?.pause?.();return;
  }
  if(voice.hasAttribute('data-ck107-voice-retry')){
   const result=window.CK76Voice?.retryFailed?.();
   if(line)line.textContent=result?.ok?
    '중단된 문장부터 재생을 다시 요청했습니다. 실제 소리는 기기에서 확인하세요.':
    '재시도할 오류 문장이 없습니다. 먼저 해당 문항을 재생하세요.';
   return;
  }
  const q=lookup(selected);
  if(!q){if(line)line.textContent='공식 문항을 불러오지 못했습니다.';return;}
  const mode=voice.dataset.ck107Voice||window.CK76Voice?.getPreferences?.().mode||'qa';
  const scope=voice.hasAttribute('data-ck107-voice-scope')?'subject':'single';
  const result=voice.hasAttribute('data-ck109-due')?
   window.CK76Voice?.playDue?.(window.CK76Voice?.getPreferences?.().mode||'qa',40):
   voice.hasAttribute('data-ck107-voice-resume')?
    window.CK76Voice?.resume?.():window.CK76Voice?.playOfficial?.(q.year,q.number,mode,scope);
  if(line)line.textContent=result?.ok?
   (voice.hasAttribute('data-ck109-due')?'개인 복습 대기열':scope==='subject'||voice.hasAttribute('data-ck107-voice-resume')?'과목 연속 듣기':'현재 문항 듣기')+' 요청 · '+result.items+
    '문항 · 전원정답 제외 '+result.excluded+'건 · 실제 소리는 기기에서 확인':
   '읽을 문항이 없거나 음성 기능이 준비되지 않았습니다. 공식 원문 로딩·TTS 설정을 확인하세요.';
  return;
 }
 if(target.closest('[data-ck107-personal-link]')){
  const q=lookup(selected);
  if(!q)return;
  dialog?.close();
  const result=window.CK83Links?.openQuestion?.(q.id);
  if(!result)window.CK83Links?.open?.();
  return;
 }
 if(target.closest('[data-ck107-open-exam]')){
  const q=lookup(selected);
  if(q){dialog?.close();window.CK76Study?.openQuestion?.(q.year,q.number,q.subject);}
  return;
 }
 if(target.closest('[data-ck78-prev],[data-ck78-next]')){
  const q=lookup(selected);if(!q)return;
  const direction=target.closest('[data-ck78-next]')?1:-1;
  if(q.number+direction>=1&&q.number+direction<=80)open(q.year,q.number+direction,trigger);
 }
 const jump=target.closest('[data-ck78-open-question]');
 if(jump){
  const q=lookup(jump.dataset.ck78OpenQuestion);
  if(q){dialog?.close();window.CK76Study?.openQuestion?.(q.year,q.number,q.subject);}
 }
 if(target.closest('[data-ck78-review-report]'))showReviewDashboard();
});
async function showReviewDashboard(){
 if(dialog?.open&&noteDirty&&!flushNote(true))return false;
 if(dialog?.open&&window.CK80Editorial?.hasUnsavedChanges?.()&&
  window.CK80Editorial?.confirmLeave?.()===false)return false;
 if(dialog?.open&&window.CK83Links?.getStatus?.()?.unsavedEdits>0&&
  window.CK83Links?.confirmDiscard?.()===false)return false;
 openGeneration++;
 const el=modal();if(!el.open){trigger=document.activeElement;el.showModal();}
 selected='report';
 el.innerHTML='<p role="status">검수 현황 조회 중…</p><button data-ck78-close>닫기</button>';
 let report={questions:400,withCandidateMatches:0,parsedCompoundStatements:0,
   reviewStages:{unstarted:'현황 자료 확인 필요',draft:'현황 자료 확인 필요',published:'현황 자료 확인 필요'},verifiedOptionVerdicts:0,requiredOptionVerdicts:2000};
 try{const response=await fetch('./data/reports/analysis-candidates-v78.json?v=154',{cache:'force-cache'});
  if(response.ok)report=await response.json();
 }catch{}
 if(selected!=='report')return;
 const stages=report.reviewStages||{};
 el.innerHTML='<div class="ck78-modal-head"><h2 id="ck78-heading">기출 분석 · 검수 대시보드</h2>'+
  '<button data-ck78-close aria-label="닫기">×</button></div>'+
  '<div class="ck78-modal-scroll"><p>공식 원문 등록 <strong>800문항</strong> · 집중 검수 대상 <strong>'+
  Number(report.questions||400)+'</strong>문항 (2021~2025)</p>'+
  '<dl class="ck78-review-grid">'+[
   ['해설 미작성',stages.unstarted||0],['학습용 초안',stages.draft||0],
   ['검수·발행 완료',stages.published||0],['검증된 선지 판단',Number(report.verifiedOptionVerdicts||0)+' / '+Number(report.requiredOptionVerdicts||2000)],
   ['개념 키워드 후보 문항',report.withCandidateMatches||0],
   ['문제 원문에서 추출된 조합 진술',report.parsedCompoundStatements||0]
  ].map(([label,value])=>'<div><dt>'+esc(label)+'</dt><dd>'+esc(value)+'</dd></div>').join('')+'</dl>'+
  '<p>키워드 후보와 질문 유형은 자동 추출 값입니다. 검수된 출제 빈도, 법령 근거 또는 해설로 간주하지 않습니다.</p>'+
  '<p>최종 해설을 발행하려면 공식 문제지·선지·최종정답·시험연도 법령의 근거를 별도로 검증해야 합니다.</p>'+
  '<button type="button" data-ck111-open>800문항 선지 근거 검토 대기열 열기</button>'+yearCoverage()+'</div>'+
  '<footer class="ck78-modal-footer"><button data-ck78-close>닫기</button></footer>';
}
let queued=false;
function decorate(){
 const source=document.querySelector('#main .registered-question .listen-controls');
 if(source&&!source.querySelector('[data-ck30-analysis],[data-ck78-analysis]')){
  const state=window.CK76Study?.getExam?.();
  if(state&&lookup(state.year+'-'+state.number)){
   const b=document.createElement('button');b.type='button';
   b.className='btn ck78-explain-trigger';b.dataset.ck78Analysis=String(state.number);
   b.dataset.ck78Year=String(state.year);b.textContent='문항 분석';
   source.appendChild(b);
  }
 }
 const header=document.querySelector('#ck76-search .ck76-search-head');
 if(header&&!header.querySelector('[data-ck78-review-report]')){
  const button=document.createElement('button');button.type='button';
  button.dataset.ck78ReviewReport='1';button.textContent='분석 검수 현황';header.appendChild(button);
 }
}
function schedule(){
 if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;decorate();});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',decorate,{once:true});else decorate();
const root=document.getElementById('main');
if(root&&window.MutationObserver)new MutationObserver(changes=>{
 if(changes.some(x=>Array.from(x.addedNodes).some(node=>node.nodeType===1&&
  (node.matches?.('.ck-v7-stage,.registered-question,#ck76-search')||
   node.querySelector?.('.registered-question,#ck76-search')))))schedule();
}).observe(root,{childList:true,subtree:true});
window.CK78Analysis=Object.freeze({open,showReviewDashboard,lookup,keyLabel,classify,reviewSteps,personalProgress,yearCoverage,
 flushNote:()=>flushNote(true),hasUnsavedNote:()=>noteDirty,
 getStatus:()=>({status:selected||'idle',opened:Boolean(dialog?.open),loadedYears:[...years.keys()]})});
})();
