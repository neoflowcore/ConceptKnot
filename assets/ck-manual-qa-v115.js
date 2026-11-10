/* ConceptKnot v115 — manual device verification, local and opt-in only.
 * Records user-marked PASS/FAIL/미확인, never self-certifies hardware behaviour.
 * No continuous animation, network writes or background task.
 */
(function(){
'use strict';
const KEY='ck115-manual-device-verification-v1',NOTE_MAX=480;
const choices=['pending','pass','fail','skip'];
const labels={pending:'미확인',pass:'PASS (직접 확인)',fail:'FAIL (재현)',skip:'해당 없음'};
const TASKS=Object.freeze([
 {id:'backup',group:'기록',name:'기존 학습 데이터 JSON 백업·복원 확인'},
 {id:'header',group:'상단 UI',name:'모바일 360px·PC 1024px 설정 메뉴 우측 고정·첫 진입 오늘의 학습→로고 복귀 시 점묘화와 통합 검색 표시'},
 {id:'tabs',group:'상단 UI',name:'탭을 오른쪽으로 넘긴 뒤 오답 복습·학습 계획·정리본 선택 시 가로 위치 유지'},
 {id:'touch',group:'상단 UI',name:'모바일 스와이프·탭 클릭 시 손가락을 올린 탭이 로고·홈·빈 영역으로 잘못 전환되지 않음'},
 {id:'draft',group:'해설',name:'개인 해설 미저장 상태에서 닫기·ESC·이동을 취소하면 입력이 보존됨'},
 {id:'sources',group:'해설',name:'800문항 검색·1~5문항 TXT·①~⑤ 근거 출처가 정확히 대응됨'},
 {id:'notes',group:'해설',name:'내 풀이 메모 자동저장·탭 이동·새로고침 후 다시 읽기'},
 {id:'mock',group:'모의고사',name:'80문항 100분 OMR·과목별 채점·40점 과락·평균 60점 기준 확인'},
 {id:'mixed-sets',group:'모의고사',name:'10개년 혼합 5세트(각 40+40)·100분·정답 보호·고정 순서·채점·백업 병합, 제출 후 약점 우선순위/다시 풀기/근거 이동/TXT 및 진행 중 정답 비노출 확인'},
 {id:'multi-tab',group:'모의고사',name:'다중 브라우저 탭에서 답안 변경 충돌이 기존 답안을 덮지 않음'},
 {id:'tts',group:'음성',name:'한국어 TTS 1.5배속·3모드·40문항·정지/재개 실제 소리 확인'},
 {id:'pen',group:'S Pen',name:'물리 버튼 지우개·탭 이동 자동 해제·손가락 터치 정상 복귀'},
 {id:'pdf',group:'PDF',name:'PDF 두 페이지 펼쳐보기·오른쪽 페이지 필기·도구 전환 후 필기 보존'},
 {id:'chart',group:'그래프',name:'E₀→E₁ 수요·공급 변화 방향 및 예시/일반 결론 구분'},
 {id:'motion',group:'성능',name:'학습 탭에서 배경 애니메이션 정지·GPU 사용량 안정'},
 {id:'dark',group:'디자인',name:'다크모드 배경·탭 바깥 색상·문자 대비 및 화면 회전 확인'},
 {id:'pdf-hash',group:'PDF',name:'다른 PDF가 같은 파일명·용량이어도 필기가 잘못 붙지 않는지 확인'},
 {id:'pdf-legacy',group:'PDF',name:'이전 버전 PDF 필기 확인 후 내용지문 보관함에 보존·복원 확인'},
 {id:'ocr-pdf',group:'OCR',name:'한국어 스캔 PDF 현재쪽 OCR · 처리 중 중단 · 브라우저 숨김시 CPU 종료 확인'},
 {id:'ocr-draft',group:'OCR',name:'이미지 OCR·①~⑤ 초안 분리·편집·새로고침·전체 JSON 백업 및 복원 확인'},
 {id:'ocr-pages',group:'OCR',name:'PDF 1쪽·2쪽 OCR을 페이지별 보관함에 각각 저장하고 불러오기·삭제 확인'},
 {id:'ocr-pages-backup',group:'OCR',name:'페이지별 OCR 보관함 전체 TXT 다운로드와 전체 JSON 백업·복원, 다른 탭 충돌 보호 확인'},
 {id:'annual-stats',group:'통계',name:'7·30·90·365일 전환 시 실제 기록만 표시, 90일은 7일별·365일은 월별 합계/TXT 정합성 확인'},
 {id:'evidence-cross-800',group:'근거',name:'10개년 800문항 교차검사·출처 누락·①~⑤ 판정차이·CSV와 저장 미완료 차단 확인'},
 {id:'exam-idle-clock',group:'성능',name:'시험 미시작·일시중지·브라우저 숨김에서 시험 1초 시계 중지, 복귀 후 남은 시간/답안 유지 확인'},
 {id:'evidence-packet',group:'근거',name:'선지 교차보고 카드에서 ①~⑤ 상세 비교·선택 최대 5문항·TXT 근거 패킷·원본 PDF·미저장 내보내기 차단 직접 확인'},
 {id:'tts-canonical',group:'음성',name:'개인 대조문장과 공식 원문이 다른 경우 공식 TTS는 A형 원문만 낭독하며 긴 문장 오류는 누락 없이 나눠 읽는지 직접 확인'},
 {id:'offline-core',group:'오프라인',name:'v157 필수 캐시 11개·실제 활성 서비스워커 버전 확인·업데이트 중 연결 끊김 시 구버전 보존·오프라인/온라인 복귀 확인'},
 {id:'offline-optional-reuse-v155',group:'오프라인',name:'기존 오프라인 자산 준비 후 일부 선택 다운로드 실패 시 이전 정상 학습 모듈 유지·온라인 재접속 후 갱신 확인'},
 {id:'typing-korean-ime-v155',group:'타이핑',name:'Android Brave 한글 조합 중 빠른 입력/수정/이동, 조합 끝 마지막 글자 누락 없음·커서 위치·타수·정확도 정상 확인'},
 {id:'chart-grips-v155',group:'그래프',name:'Android Brave/S Pen에서 D·S 곡선 동그란 손잡이를 잡아 이동할 때 그림만 변하고 페이지는 이동하지 않음, 빈 SVG 영역에서는 세로 스크롤 가능'},
 {id:'chart-nudge-v155',group:'그래프',name:'수요 D/공급 S 별도 선택 → 왼쪽/오른쪽 10단위 이동 → E₀/E₁ 전후 비교 → Undo/Redo/초기화 모두 일관됨'},
 {id:'mock-ctrl-arrow-v155',group:'모의고사',name:'공식 80문항·기출혼합 5세트에서 숫자 1~5 답안과 Ctrl+←/→ 문항 이동, 입력칸 편집시 단축키 미동작, 시험 타이머 100분 유지'},
 {id:'p4-unreviewed-v155',group:'해설',name:'2021~2025 해설 초안 400건·전문가 검수 0건·선지별 원전검수 0건을 구별하고 최신 원전/판례 검증 없이는 게시되지 않음'},
 {id:'graph-slope-touch-v156',group:'그래프',name:'Android Brave와 S Pen으로 각 D/S 곡선 끝의 노란 손잡이를 위아래 드래그할 때 해당 선의 기울기만 변하고 페이지가 이동하지 않음'},
 {id:'graph-slope-shift-v156',group:'그래프',name:'수요 D·공급 S를 선택해 각각 평행이동·기울기 ±15 조절·E₀/E₁ 교점 재계산·Undo/Redo/초기화가 서로 일치함'},
 {id:'graph-before-after-v156',group:'그래프',name:'쉬운 설명·심화 설명·기출 개념의 비례/반비례 및 가격 변화=곡선 위 이동 구분, 원래 문제 조건과 변경 조건이 섞이지 않는지 확인'},
 {id:'v157-offline-live',group:'오프라인',name:'온라인에서 오프라인 상태 확인을 실행한 뒤 비행기 모드에서 새로고침하여 11개 필수 자산·6개 칠판/그래프 도구와 10개년 문제 로딩을 구분해서 확인'},
 {id:'v157-ime-stylus-recovery',group:'타이핑',name:'Android Brave에서 한글 조합→마지막 자모 지연 반영, 손바닥 접촉으로 칠판 크기 조절 중단, 포인터 취소 시 원래 높이 및 S Pen 자동 해제 확인'},
 {id:'v157-official-json-restore',group:'모의고사',name:'공식 80문항 진행 중 답안 보존 상태로 JSON 백업 병합 복원, 다른 탭 변경/같은 응시 중복/20회 이력 한도 초과는 변경 없이 차단'},
 {id:'v157-visual-p6',group:'그래프',name:'Android/S Pen에서 8개 시장형 곡선의 가운데 D·S 및 끝 노란 기울기 손잡이; 9개 관찰형 그래프 전후 이론·Undo/Redo/키보드·모바일 스크롤 확인'},
 {id:'v157-expert-audit',group:'해설',name:'2021~2025년 학습용 초안 400건 중 법령/판례/선지별 전문가 검수 완료 기록은 0건이며 검증되지 않은 문장을 공식 해설로 게시하지 않는지 확인'}
]);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
let lastRaw=null,issue='',data=read(),panel=null,pending=false,timer=0,dirty=false,status='';
function blank(){return {schemaVersion:1,scope:'personal-v115-manual-qa',updatedAt:0,entries:{}};}
function sanitize(raw){
 if(!plain(raw)||raw.schemaVersion!==1||raw.scope!=='personal-v115-manual-qa'||
   !plain(raw.entries))return null;
 const out=blank();out.updatedAt=Number.isFinite(Number(raw.updatedAt))?
  Math.max(0,Math.min(Date.now()+86400000,Number(raw.updatedAt))):0;
 if(Object.keys(raw.entries).length>TASKS.length)return null;
 for(const [id,entry] of Object.entries(raw.entries)){
  if(!TASKS.some(q=>q.id===id)||!plain(entry)||!choices.includes(entry.status)||
   typeof entry.note!=='string'||entry.note.length>NOTE_MAX)return null;
  out.entries[id]={status:entry.status,note:entry.note};
 }
 return out;
}
function read(){
 try{
  const raw=localStorage.getItem(KEY);
  if(raw===null){lastRaw=null;issue='';return blank();}
  const parsed=sanitize(JSON.parse(raw));
  if(!parsed){issue='실기 검증 기록이 손상되어 덮어쓰기를 차단합니다. 원본을 별도로 백업하세요.';return blank();}
  lastRaw=raw;issue='';return parsed;
 }catch{
  issue='실기 검증 기록을 읽지 못했습니다. 기존 저장 내용을 보호합니다.';return blank();
 }
}
function persist(next){
 if(issue)return false;
 const parsed=sanitize(next);if(!parsed)return false;
 try{
  if(localStorage.getItem(KEY)!==lastRaw){
   issue='다른 탭에서 실기 기록을 변경했습니다. 기존 작성 내용을 복사하고 새로고침하세요.';
   return false;
  }
  const raw=JSON.stringify(parsed);localStorage.setItem(KEY,raw);
  lastRaw=raw;data=parsed;return true;
 }catch{
  status='실기 검증 기록 저장 실패 · 브라우저 저장공간 또는 권한을 확인하세요.';
  return false;
 }
}
function gather(){
 const next=blank();next.updatedAt=Date.now();
 if(!panel)return data;
 for(const task of TASKS){
  const state=panel.querySelector('[data-ck115-check="'+task.id+'"]')?.value||
   data.entries[task.id]?.status||'pending';
  const field=panel.querySelector('[data-ck115-note="'+task.id+'"]');
  const note=field?field.value:(data.entries[task.id]?.note||'');
  next.entries[task.id]={status:choices.includes(state)?state:'pending',note:String(note).slice(0,NOTE_MAX)};
 }
 return next;
}
function summary(source=data){
 const entries=TASKS.map(item=>source.entries[item.id]||{status:'pending'});
 return {total:TASKS.length,pass:entries.filter(x=>x.status==='pass').length,
  fail:entries.filter(x=>x.status==='fail').length,skip:entries.filter(x=>x.status==='skip').length,
  pending:entries.filter(x=>x.status==='pending').length};
}
function announce(message){
 status=message;
 const el=panel?.querySelector('[data-ck115-message]');if(el)el.textContent=message;
}
function updateCounters(){
 if(!panel)return;
 const c=summary(gather());
 const el=panel.querySelector('[data-ck115-counter]');
 if(el)el.textContent='수기 PASS '+c.pass+'/'+c.total+' · FAIL '+c.fail+
  ' · 미확인 '+c.pending+' · 해당 없음 '+c.skip;
}
function flush(){
 if(!dirty)return true;
 clearTimeout(timer);timer=0;
 const next=gather();
 if(!persist(next)){
  announce(issue||status||'저장할 수 없습니다. 현재 내용을 먼저 복사하세요.');
  return false;
 }
 dirty=false;updateCounters();announce('수기 검증 기록을 이 브라우저에 저장했습니다. 공식 검증 결과가 아닙니다.');
 return true;
}
function render(){
 if(!panel)return;
 const oldOpen=panel.querySelector('details')?.open===true;
 const c=summary();
 panel.innerHTML='<details class="ck115-qa-details"'+(oldOpen?' open':'')+'>'+
 '<summary><strong>실기검증표 v157 · 직접 PASS/FAIL 기록</strong><span data-ck115-counter>'+
 '수기 PASS '+c.pass+'/'+c.total+' · FAIL '+c.fail+' · 미확인 '+c.pending+'</span></summary>'+
 '<p class="ck115-qa-warning"><strong>필수 수기 검증:</strong> 이 항목은 자동으로 PASS 처리되지 않습니다. PC와 Android Brave, S Pen을 직접 사용해 재현한 경우에만 표시하세요. 모든 기록은 현재 브라우저에만 보관됩니다.</p>'+
 '<div class="ck115-qa-tools"><button type="button" data-ck115-diagnose>현재 기기 상태 확인</button>'+
 '<button type="button" data-ck115-export>수기 검증 TXT 저장</button>'+
 '<button type="button" data-ck115-clear>검증 표시 초기화</button></div>'+
 '<p class="ck115-qa-diagnostics" data-ck115-diag>실제 환경 확인은 버튼을 눌러 갱신합니다.</p>'+
 '<div class="ck115-qa-items">'+TASKS.map((item,i)=>{
  const saved=data.entries[item.id]||{status:'pending',note:''};
  return '<section class="ck115-qa-item"><div class="ck115-qa-item-heading">'+
   '<strong>'+(i+1)+'. '+esc(item.name)+'</strong><small>'+esc(item.group)+'</small></div>'+
   '<label>직접 확인 결과<select data-ck115-check="'+item.id+'" aria-label="'+esc(item.name)+' 검증 결과">'+
   choices.map(k=>'<option value="'+k+'"'+(k===saved.status?' selected':'')+'>'+labels[k]+'</option>').join('')+
   '</select></label><label>실패 재현 순서·문항 번호·기기 메모'+
   '<textarea data-ck115-note="'+item.id+'" maxlength="'+NOTE_MAX+'" rows="2" placeholder="예: Android Brave / 360px / 2019-23 / 클릭 후 스크롤 위치가 0으로 바뀜">'+
   esc(saved.note)+'</textarea></label></section>';
 }).join('')+'</div><p class="ck115-qa-status" data-ck115-message role="status">'+
 esc(issue||status||'기본 상태는 모두 미확인입니다.')+'</p></details>';
}
function diagnose(){
 if(!panel)return;
 const n=window.CK115Nav?.getState?.()||{},speech=window.CK76Voice?.getState?.()||{};
 const pdf=window.CKPDF15?.getState?.()||{},exam=window.CK82FullExam?.getState?.()||{};
 const pieces=[
  '화면 '+(window.innerWidth||document.documentElement?.clientWidth||'?')+'px',
  '브라우저 '+String(navigator.userAgent||'알 수 없음').slice(0,100),
  '현재 탭 '+(document.body?.dataset.ckV8Tab||'알 수 없음'),
  '상단 가로위치 '+(Number.isFinite(n.left)?Math.round(n.left):'미측정')+'px',
  '음성 '+(speech.status||'미준비'),
  'PDF '+(pdf.page?(pdf.page+'쪽'):'열려 있지 않음'),
  '80문항 시험 '+(exam.active||'미준비'),
  '서비스워커 '+(navigator.serviceWorker?.controller?'제어 중':'제어 확인 안 됨'),
  '포인터 이벤트 '+(typeof window.PointerEvent==='function'?'지원 감지':'지원 미확인'),
  '펜/터치 '+(window.matchMedia?.('(pointer:coarse)')?.matches?'거친 터치 포인터 감지':'기기별 별도 검증'),
  '한글 입력 보완 '+(window.CK155TypingImeGuard?'모듈 활성':'미로드'),
  '도식 전후 비교 '+(window.CK149GraphMotion?.explain?'모듈 활성':'미로드'),
  '기존 시험 JSON 병합 '+(window.CK82FullExam?.mergeRestore?'모듈 활성':'미로드'),
  '아래 PASS/FAIL은 실제 조작 후 사용자가 직접 표기'
 ];
 panel.querySelector('[data-ck115-diag]').textContent=pieces.join(' · ');
}
function exportText(){
 const snap=gather(),c=summary(snap);
 const lines=['ConceptKnot v157 사용자 수기 실기검증표','개인 기기에서 수동으로 표시한 결과; 공식 검증 아님',
  '작성일: '+new Date().toISOString(),'PASS '+c.pass+'/'+c.total+' · FAIL '+c.fail+
  ' · 미확인 '+c.pending+' · 해당 없음 '+c.skip,''];
 TASKS.forEach((task,i)=>{
  const row=snap.entries[task.id]||{status:'pending',note:''};
  lines.push((i+1)+'. ['+labels[row.status]+'] '+task.name,
   '분류: '+task.group,'메모: '+(row.note||'없음'),'');
 });
 try{
  const blob=new Blob(['\uFEFF',lines.join('\n')],{type:'text/plain;charset=utf-8'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='ConceptKnot_v157_수기실기검증_'+new Date().toISOString().slice(0,10)+'.txt';
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),3000);
  announce('TXT 다운로드를 요청했습니다. 현재 입력을 포함하며 실제 파일 저장 여부는 다운로드 목록에서 확인하세요.');
  return true;
 }catch{announce('TXT 내보내기 실패. 브라우저 다운로드 권한을 확인하세요.');return false;}
}
function clearResults(){
 if(!window.confirm?.('수기 검증표의 PASS/FAIL 및 메모만 지우고 다시 시작할까요? 학습기록과 공식 기출은 유지됩니다.'))return false;
 if(!persist(blank())){announce(issue||status||'수기 검증표 초기화 실패');return false;}
 dirty=false;render();announce('수기 검증표만 초기화했습니다. 학습기록은 변경하지 않았습니다.');return true;
}
function mount(){
 const settingsVisible=document.body?.dataset.ckV8Tab==='settings'||
  Boolean(document.querySelector('#main .settings-grid'));
 if(!settingsVisible)return false;
 const slot=document.querySelector('#main .board-content');
 if(!slot)return false;
 const existing=slot.querySelector('#ck115-manual-qa');
 if(existing){panel=existing;return true;}
 panel=document.createElement('section');panel.id='ck115-manual-qa';panel.className='ck115-manual-qa';
 slot.appendChild(panel);render();return true;
}
function schedule(){
 if(pending)return;
 pending=true;requestAnimationFrame(()=>{pending=false;mount();});
}
document.addEventListener('change',event=>{
 const el=event.target;
 if(!panel?.contains(el)||!el.matches?.('[data-ck115-check]'))return;
 dirty=true;updateCounters();flush();
});
document.addEventListener('input',event=>{
 const el=event.target;
 if(!panel?.contains(el)||!el.matches?.('[data-ck115-note]'))return;
 dirty=true;updateCounters();clearTimeout(timer);
 timer=setTimeout(()=>flush(),550);
});
document.addEventListener('click',event=>{
 const t=event.target?.closest?.('[data-ck115-export],[data-ck115-clear],[data-ck115-diagnose]');
 if(!t||!panel?.contains(t))return;
 if(t.hasAttribute('data-ck115-export')){exportText();return;}
 if(t.hasAttribute('data-ck115-clear')){clearResults();return;}
 if(t.hasAttribute('data-ck115-diagnose'))diagnose();
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)flush();});
window.addEventListener('beforeunload',event=>{
 if(dirty&&!flush()){event.preventDefault();event.returnValue='';}
});
window.addEventListener('storage',event=>{
 if(event.key!==KEY)return;
 if(dirty){issue='다른 탭의 실기 검증표 변경이 감지됐습니다. 작성 중 메모를 보존하고 백업하세요.';
  announce(issue);return;}
 data=read();if(panel?.isConnected)render();
});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});
else schedule();
const main=document.getElementById('main');
if(main&&window.MutationObserver)new MutationObserver(changes=>{
 if(changes.some(x=>x.target===main&&x.addedNodes.length))schedule();
}).observe(main,{childList:true});
window.CK115QA=Object.freeze({
 tasks:TASKS.map(x=>({id:x.id,group:x.group,name:x.name})),
 sanitize,summary,flush,mount,diagnose,exportText,
 getState:()=>({...summary(),dirty,issue,connected:Boolean(panel?.isConnected)}),
 open:()=>{if(mount()){const d=panel.querySelector('details');if(d)d.open=true;return true;}return false;}
});
})();
