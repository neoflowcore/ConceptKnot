/* ConceptKnot v82: full 80-question / 100-minute official-paper practice.
 * Browser-local attempt, never an official scored exam or verified explanation.
 * No background animation, external service, CI, package or build dependency.
 */
(function(){
'use strict';
const KEY='ck82-exam-sessions-v1',VERSION=1,DURATION=100*60*1000,HISTORY_LIMIT=20;
const YEARS=Array.from({length:10},(_,i)=>2025-i);
const MS_MINUTE=60000;
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const bank=()=>window.RECALL_OFFICIAL||{};
const isYear=y=>YEARS.includes(Number(y));
const idsFor=year=>Array.from({length:80},(_,i)=>Number(year)+'-'+(i+1));
const isMark=v=>Number.isInteger(v)&&v>=1&&v<=5;
const cleanAnswers=v=>{
 const a=Array.isArray(v)?v:[];
 return Array.from({length:80},(_,i)=>a[i]===null||a[i]===undefined?null:isMark(a[i])?a[i]:null);
};
const checkBank=year=>{
 if(!isYear(year))return {ok:false,missing:[]};
 const missing=idsFor(year).filter(id=>{
  const q=bank()[id];
  return !q||q.verified!==true||q.options?.length!==5||!q.question||
   !Array.isArray(q.correct)||!q.correct.length||
   q.correct.some(n=>!isMark(Number(n)))||
   q.subject!==(Number(id.slice(id.indexOf('-')+1))<=40?'estate':'civil');
 });
 return {ok:missing.length===0,missing};
};
function sanitizeAttempt(row){
 if(!row||typeof row!=='object'||!isYear(row.year)||!['running','paused','submitted'].includes(row.status)||
  !Array.isArray(row.answers)||row.answers.length!==80||row.answers.some(x=>x!==null&&!isMark(x))||
  !Array.isArray(row.flags)||row.flags.length!==80||row.flags.some(x=>typeof x!=='boolean'))return null;
 const startedAt=Number(row.startedAt),deadlineAt=Number(row.deadlineAt),remainingMs=Number(row.remainingMs);
 if(!Number.isFinite(startedAt)||startedAt<=0||!Number.isFinite(deadlineAt)||
  !Number.isFinite(remainingMs)||remainingMs<0||remainingMs>DURATION)return null;
 const submittedAt=row.status==='submitted'?Number(row.submittedAt):0;
 if(row.status==='submitted'&&(!Number.isFinite(submittedAt)||submittedAt<startedAt))return null;
 const position=Number(row.position)||0;
 return {year:Number(row.year),status:row.status,startedAt,deadlineAt,
  remainingMs,submittedAt,position:Math.max(0,Math.min(79,Math.floor(position))),
  answers:cleanAnswers(row.answers),flags:row.flags.slice(),
  pauseCount:Math.max(0,Math.min(999,Number(row.pauseCount)||0)),
  reason:row.status==='submitted'&&['manual','time'].includes(row.reason)?row.reason:'',
  score:row.status==='submitted'&&row.score&&typeof row.score==='object'?{
    estate:Math.max(0,Math.min(100,Number(row.score.estate)||0)),
    civil:Math.max(0,Math.min(100,Number(row.score.civil)||0)),
    total:Math.max(0,Math.min(80,Number(row.score.total)||0)),
    average:Math.max(0,Math.min(100,Number(row.score.average)||0)),
    passed:row.score.passed===true
  }:null};
}
function cleanStore(data){
 if(!data||data.schemaVersion!==VERSION||!Array.isArray(data.history)||
  data.history.length>HISTORY_LIMIT||data.history.some(x=>!sanitizeAttempt(x)||x.status!=='submitted'))return null;
 const active=data.active===null?null:sanitizeAttempt(data.active);
 if(data.active!==null&&!active)return null;
 return {schemaVersion:VERSION,revision:Number.isInteger(data.revision)&&data.revision>=0?data.revision:0,active,history:data.history.map(sanitizeAttempt)};
}
function empty(){return {schemaVersion:VERSION,revision:0,active:null,history:[]};}
let storageIssue='',loadedRaw=null;
function readStore(){
 try{
  const raw=localStorage.getItem(KEY);
  if(raw===null){storageIssue='';loadedRaw=null;return empty();}
  const value=cleanStore(JSON.parse(raw));
  if(!value){storageIssue='기존 시험 기록이 손상되었습니다. 원본을 보호하기 위해 저장을 차단합니다.';return empty();}
  storageIssue='';loadedRaw=raw;return value;
 }catch{storageIssue='시험 기록을 읽지 못했습니다. 원본을 보호하기 위해 저장을 차단합니다.';return empty();}
}
let state=readStore(),root=null,expanded=false,selectedYear=2025,error='',showHistory=false,historySelection=-1,scheduled=false;
let clockTimer=null;
/* v123: 1Hz clock only while exam runs visibly. Time uses deadlines, not ticks. */
function syncClockTimer(){
 const running=active()?.status==='running'&&!document.hidden;
 if(!running&&clockTimer!==null){window.clearInterval?.(clockTimer);clockTimer=null;}
 if(running&&clockTimer===null)clockTimer=setInterval(tick,1000);
}

function persist(next){
 if(storageIssue){error=storageIssue;return false;}
 const value=cleanStore(next);
 if(!value){error='유효하지 않은 답안 상태입니다. 기존 기록을 유지합니다.';return false;}
 try{
  const raw=localStorage.getItem(KEY);
  // Guard against another tab's same-revision write or deletion.
  if(raw!==loadedRaw){
   const latest=readStore();
   if(storageIssue){error=storageIssue;return false;}
   state=latest;syncClockTimer();
   error='다른 탭에서 시험 기록이 변경되거나 삭제되었습니다. 덮어쓰지 않고 최신 상태를 읽었습니다.';
   if(root?.isConnected)paint();return false;
  }
  value.revision=state.revision+1;
  const updated=JSON.stringify(value);
  localStorage.setItem(KEY,updated);
  loadedRaw=updated;state=value;syncClockTimer();return true;
 }catch{error='저장 실패: 브라우저 공간·권한을 확인하세요. 기존 기록은 유지됩니다.';return false;}
}
function active(){return state.active;}
function remaining(session,now=Date.now()){
 if(!session)return 0;
 if(session.status==='running')return Math.max(0,session.deadlineAt-now);
 if(session.status==='paused')return Math.max(0,session.remainingMs);
 return 0;
}
function fmtClock(ms){
 const seconds=Math.max(0,Math.ceil(ms/1000));
 return String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');
}
function gradeAttempt(session,official=bank()){
 let estateCorrect=0,civilCorrect=0,estateAnswered=0,civilAnswered=0;
 const wrong=[],unanswered=[],correctIds=[],allAccepted=[];
 for(let i=0;i<80;i++){
  const id=session.year+'-'+(i+1),q=official[id],value=session.answers[i];
  const subject=i<40?'estate':'civil';
  if(value!==null){if(subject==='estate')estateAnswered++;else civilAnswered++;}
  if(q?.correct?.length===5)allAccepted.push(id);
  if(value===null){unanswered.push(id);continue;}
  const correct=Array.isArray(q?.correct)?q.correct.map(Number).includes(value):false;
  if(correct){correctIds.push(id);if(subject==='estate')estateCorrect++;else civilCorrect++;}
  else wrong.push(id);
 }
 const estate=estateCorrect*2.5,civil=civilCorrect*2.5,average=(estate+civil)/2;
 return {estate,civil,estateCorrect,civilCorrect,estateAnswered,civilAnswered,
  answered:estateAnswered+civilAnswered,unanswered,wrong,correctIds,allAccepted,
  total:estateCorrect+civilCorrect,average,passed:estate>=40&&civil>=40&&average>=60};
}
function newAttempt(year,now=Date.now()){
 const y=Number(year);
 if(!checkBank(y).ok)return null;
 return {year:y,status:'running',startedAt:now,deadlineAt:now+DURATION,remainingMs:DURATION,
  submittedAt:0,position:0,answers:Array(80).fill(null),flags:Array(80).fill(false),
  pauseCount:0,reason:'',score:null};
}
let loadingYear=null,expiryLoadingYear=null,expiryRetryAt=0;
function start(year=selectedYear){
 const y=Number(year),issue=checkBank(y);
 if(!issue.ok){
  if(y>=2016&&y<=2020&&window.CK89OfficialBank?.loadYear){
   if(loadingYear!==null){message('공식 과거 기출 데이터를 불러오는 중입니다.');return false;}
   const selectedAtRequest=selectedYear;
   loadingYear=y;message(y+'년 공식 문제 80문항을 확인하는 중입니다.');
   window.CK89OfficialBank.loadYear(y).then(()=>{
    loadingYear=null;
    if(selectedYear!==selectedAtRequest){message('선택 연도가 변경되어 이전 시험 자동 시작을 취소했습니다.');return;}
    start(y);
   }).catch(err=>{
    loadingYear=null;message('과거 기출 자료 로딩 실패: '+(err?.message||err)+' · 자료를 확인한 뒤 재시도하세요.');
   });
   return false;
  }
  message('해당 연도 공식 80문항 등록 상태가 불완전합니다. 누락 '+issue.missing.length+'건.');
  return false;
 }
 if(active()?.status!=='submitted'&&active()&&
  !window.confirm?.('진행 중인 시험을 교체하면 현재 미제출 답안은 사라집니다. 새 시험을 시작할까요?'))return false;
 const next=newAttempt(y);
 if(!next||!persist({...state,active:next}))return false;
 expanded=true;showHistory=false;historySelection=-1;error='';paint();focusRegion();
 return true;
}
function saveActive(next){
 if(!next)return false;
 const ok=persist({...state,active:next});
 if(ok){error='';paint();}
 else message(error);
 return ok;
}
function setAnswer(value){
 const s=active();if(!s||s.status!=='running')return false;
 const n=value===null?null:Number(value);if(n!==null&&!isMark(n))return false;
 if(remaining(s)===0){finish('time');return false;}
 const a=s.answers.slice();a[s.position]=n;
 return saveActive({...s,answers:a});
}
function navigate(position){
 const s=active();if(!s)return false;
 if(s.status==='running'&&remaining(s)===0){finish('time');return false;}
 const i=Number(position);if(!Number.isInteger(i)||i<0||i>=80)return false;
 return saveActive({...s,position:i});
}
function setFlag(){
 const s=active();if(!s||s.status==='submitted')return false;
 if(s.status==='running'&&remaining(s)===0){finish('time');return false;}
 const flags=s.flags.slice();flags[s.position]=!flags[s.position];
 return saveActive({...s,flags});
}
function pause(){
 const s=active();if(s?.status!=='running')return false;
 if(remaining(s)===0)return finish('time');
 const left=remaining(s);
 return saveActive({...s,status:'paused',remainingMs:left,pauseCount:s.pauseCount+1});
}
function resume(){
 const s=active();if(s?.status!=='paused')return false;
 return saveActive({...s,status:'running',deadlineAt:Date.now()+s.remainingMs});
}
function finish(reason='manual',now=Date.now()){
 const s=active();if(!s||s.status==='submitted')return false;
 if(!checkBank(s.year).ok){
  message('공식 80문항 등록이 완료될 때까지 채점하지 않습니다.');
  if(s.year<=2020)window.CK89OfficialBank?.loadYear?.(s.year).then(()=>checkExpiry()).catch(e=>message('기출 로딩 오류: '+e.message));
  return false;
 }
 const assessed=gradeAttempt(s),score={
  estate:assessed.estate,civil:assessed.civil,total:assessed.total,
  average:assessed.average,passed:assessed.passed
 };
 const submitted={...s,status:'submitted',submittedAt:now,remainingMs:0,
  reason:reason==='time'||s.status==='running'&&remaining(s,now)===0?'time':'manual',score};
 const next={...state,active:submitted,history:[submitted,...state.history].slice(0,HISTORY_LIMIT)};
 if(!persist(next))return false;
 expanded=true;showHistory=false;historySelection=-1;error='';paint();
 // The bridge owns an idempotent import and never changes canonical official answers.
 window.CK86ExamBridge?.reconcile?.();
 try{document.dispatchEvent(new Event('ck:exam-submitted'));}catch{}
 return true;
}

function checkExpiry(){
 const s=active();
 if(s?.status!=='running'||remaining(s)>0)return;
 if(checkBank(s.year).ok){finish('time');return;}
 if(s.year<=2020&&window.CK89OfficialBank?.loadYear&&expiryLoadingYear!==s.year&&Date.now()>=expiryRetryAt){
  expiryLoadingYear=s.year;
  window.CK89OfficialBank.loadYear(s.year).then(()=>{
   expiryLoadingYear=null;expiryRetryAt=0;
   if(active()?.status==='running')checkExpiry();
  }).catch(e=>{
   expiryLoadingYear=null;expiryRetryAt=Date.now()+30000;
   message('만료 시험 정답 로딩 오류: '+e.message+' · 30초 뒤 다시 확인합니다.');
  });
 }
}
function status(text){const t=root?.querySelector('[data-ck82-notice]');if(t)t.textContent=text;}
function message(text){error=text;status(text);}
function focusRegion(){try{root?.querySelector('[data-ck82-workspace]')?.focus({preventScroll:true});}catch{}}
function timeText(){
 const s=active(),ms=remaining(s);
 return '<span class="ck82-clock" data-ck82-clock role="timer" aria-label="시험 남은 시간">'+fmtClock(ms)+'</span>'+
 (s?.status==='running'?'<span class="ck82-clock-hint">실시간 진행</span>':
  s?.status==='paused'?'<span class="ck82-clock-hint">일시 중단 · 시간 정지</span>':'');
}
function progress(){
 const s=active(),answered=s?.answers.filter(x=>x!==null).length||0;
 const flagged=s?.flags.filter(Boolean).length||0;
 return '<div class="ck82-progress"><span>응답 '+answered+'/80</span><span>미응답 '+(80-answered)+
  '</span><span>보류 '+flagged+'</span><span>과목별 각 40문항 · 2.5점/문항</span></div>';
}
function choicesHtml(q,s){
 return '<div class="ck82-choices" role="group" aria-label="정답 선택">'+
  q.options.map((opt,i)=>{
   const answer=s.answers[s.position],picked=answer===i+1;
   return '<button type="button" class="ck82-option"'+(s.status!=='running'?' disabled':'')+' data-ck82-answer="'+(i+1)+
    '" aria-pressed="'+picked+'"><b>'+'①②③④⑤'[i]+'</b><span>'+esc(opt)+'</span></button>';
  }).join('')+'</div>';
}
function renderOmr(s){
 return '<aside class="ck82-omr" aria-label="80문항 답안지">'+
  ['estate','civil'].map((subject,section)=>{
   const start=section*40;
   return '<section><h4>'+(subject==='estate'?'부동산학개론':'민법 및 민사특별법')+' · '+
    s.answers.slice(start,start+40).filter(x=>x!==null).length+'/40</h4>'+
    '<div class="ck82-omr-grid">'+Array.from({length:40},(_,i)=>{
     const pos=start+i,choice=s.answers[pos],flag=s.flags[pos];
     return '<button type="button" data-ck82-goto="'+pos+'" class="ck82-omr-cell'+
      (choice!==null?' answered':'')+(flag?' flagged':'')+
      (pos===s.position?' current':'')+'" aria-current="'+(pos===s.position?'true':'false')+
      '" title="'+(pos+1)+'번 '+(choice===null?'미응답':choice+'번 선택')+(flag?' · 보류':'')+
      '"><span>'+(pos+1)+'</span>'+(flag?'<small>!</small>':'')+'</button>';
    }).join('')+'</div></section>';
  }).join('')+'</aside>';
}
function renderSession(s){
 const i=s.position,q=bank()[s.year+'-'+(i+1)],canAnswer=s.status==='running';
 if(!q)return '<div role="status"><p>연도별 공식 기출을 불러오는 중입니다. 기존 답안과 남은 시간은 유지됩니다.</p>'+
  '<button type="button" data-ck82-retry-bank="'+s.year+'">자료 다시 불러오기</button></div>';
 return '<div class="ck82-session-head"><div><strong>제'+(s.year-1989)+'회 '+s.year+'년 공식 A형 · 통합 실전</strong>'+
  '<p>시험 기준 연도 법령을 따릅니다. 그림·표·수식은 공식 PDF 원문과 대조하세요.</p></div>'+timeText()+'</div>'+
  progress()+'<div class="ck82-exam-layout"><section class="ck82-question" aria-label="현재 문항">'+
  '<div class="ck82-question-head"><strong>'+(i+1)+' / 80 · '+(i<40?'부동산학개론':'민법 및 민사특별법')+
  '</strong><span>'+esc(s.flags[i]?'검토 보류 표시':'A형 공식 기출')+'</span></div>'+
  '<p class="ck82-stem">'+esc(q.question)+'</p>'+choicesHtml(q,s)+
  '<div class="ck82-question-actions">'+
  '<button type="button" data-ck82-clear'+(!canAnswer?' disabled':'')+'>이 문항 미응답으로</button>'+
  '<button type="button" data-ck82-flag'+(s.status==='submitted'?' disabled':'')+'>'+
    (s.flags[i]?'보류 표시 해제':'검토 보류 표시')+'</button>'+
  '<button type="button" data-ck82-prev'+(i===0?' disabled':'')+'>이전</button>'+
  '<button type="button" data-ck82-next'+(i===79?' disabled':'')+'>다음</button></div>'+
  '<div class="ck82-tips">작업 영역에 초점을 맞춘 뒤 숫자 1~5로 선택, 좌·우 방향키로 문항 이동. 선지 선택 시 정답은 공개하지 않습니다.</div>'+
  '<a class="ck82-original" href="'+esc(/^https:\/\//.test(q.originalUrl||'')?q.originalUrl:'https://www.q-net.or.kr/')+
  '" target="_blank" rel="noopener noreferrer">원문 출처 열기</a>'+
  '</section>'+renderOmr(s)+'</div>'+
  '<div class="ck82-actions">'+
  (s.status==='running'?'<button type="button" data-ck82-pause>중단·시간 정지</button>':
   s.status==='paused'?'<button type="button" data-ck82-resume>시험 재개</button>':'')+
  '<button type="button" data-ck82-submit'+(s.status==='submitted'?' disabled':'')+
  '>80문항 최종 제출</button>'+
  '<button type="button" data-ck82-hide>실전 화면 접기</button></div>'+
  (s.pauseCount>0?'<p class="ck82-warning">중단·재개 '+s.pauseCount+'회: 실제 시험과 동일한 연속 100분 기록은 아닙니다.</p>':'')+
  (s.status==='paused'?'<p class="ck82-warning">시간이 멈춰 있습니다. 다시 시작하기 전에는 답을 변경할 수 없습니다.</p>':'');
}
function renderResult(s,source='active'){
 const issue=checkBank(s.year);
 if(!issue.ok)return '<section class="ck82-result" role="status"><h3>'+s.year+
  '년 공식 문항 확인 중</h3><p>80문항 중 '+issue.missing.length+
  '건을 불러오지 못했습니다. 임시 0점으로 채점하지 않고 기존 시험 응답을 보존합니다.</p>'+
  '<button type="button" data-ck82-retry-bank="'+s.year+'">공식 데이터 다시 불러오기</button></section>';
 const grade=gradeAttempt(s),readable=grade.passed?'연습 기준 합격점 충족':'연습 기준 미달';
 const rows=[['학개론',grade.estate,grade.estateCorrect,grade.estateAnswered],
  ['민법',grade.civil,grade.civilCorrect,grade.civilAnswered]];
 return '<section class="ck82-result" data-ck82-result-source="'+esc(source)+'"><h3>시험 채점 결과 · '+esc(readable)+'</h3>'+
 '<p>과목별 40점 이상, 평균 60점 이상을 동시에 충족해야 합니다. 이 결과는 공식 시험 성적이나 법적 합격 통지가 아닙니다.</p>'+
 '<dl class="ck82-scores">'+rows.map(([name,score,correct,answered])=>'<div><dt>'+name+'</dt><dd>'+
  score.toFixed(1)+'점</dd><small>'+correct+'/40 정답 · '+answered+'/40 응답</small></div>').join('')+
  '<div><dt>총 평균</dt><dd>'+grade.average.toFixed(1)+'점</dd><small>'+grade.total+'/80 정답</small></div></dl>'+
 '<p>응답 '+grade.answered+'/80 · 오답 '+grade.wrong.length+' · 미응답 '+grade.unanswered.length+
 ' · 전원정답 인정 '+grade.allAccepted.length+'건 · '+(s.reason==='time'?'시간 만료 자동 제출':'직접 제출')+
 (s.pauseCount>0?' · 중단 '+s.pauseCount+'회':'')+'</p>'+
 '<p class="ck82-disclaimer">전원정답 문항은 ①~⑤ 모두 채점 인정이지만, 미응답은 정답 처리하지 않습니다. 채점 인정은 각 선지가 모두 참이라는 뜻이 아닙니다.</p>'+
 '<div class="ck82-review-actions"><button type="button" data-ck82-export="'+esc(source)+'">채점 TXT 내려받기</button>'+
 '<button type="button" data-ck82-filter="wrong" aria-pressed="'+(resultFilter==='wrong')+'">오답 문항 보기</button>'+
 '<button type="button" data-ck82-filter="blank" aria-pressed="'+(resultFilter==='blank')+'">미응답 보기</button>'+
 '<button type="button" data-ck82-filter="flagged" aria-pressed="'+(resultFilter==='flagged')+'">보류 표시만 보기</button>'+
 '<button type="button" data-ck82-filter="correct" aria-pressed="'+(resultFilter==='correct')+'">정답 문항 보기</button>'+
 '<button type="button" data-ck82-filter="all" aria-pressed="'+(resultFilter==='all')+'">80문항 전체 보기</button></div>'+
 '<div data-ck82-result-list></div></section>';
}
let resultFilter='wrong';
function historyAt(index){return Number.isInteger(index)&&index>=0&&index<state.history.length?state.history[index]:null;}
function resultSource(source){if(source==='active')return active()?.status==='submitted'?active():null;
 const match=/^history:(\d{1,2})$/.exec(String(source||''));return match?historyAt(Number(match[1])):null;}
function resultItems(s){
 if(!checkBank(s.year).ok)return '<p>공식 80문항 로딩이 완료되면 결과를 표시합니다.</p>';
 const details=gradeAttempt(s);
 const indices=resultFilter==='wrong'?details.wrong.map(id=>Number(id.split('-')[1])-1):
  resultFilter==='blank'?details.unanswered.map(id=>Number(id.split('-')[1])-1):
  resultFilter==='flagged'?Array.from({length:80},(_,i)=>i).filter(i=>s.flags[i]):
  resultFilter==='correct'?details.correctIds.map(id=>Number(id.split('-')[1])-1):
  Array.from({length:80},(_,i)=>i);
 return '<div class="ck82-review-list">'+(!indices.length?'<p>이 분류에 해당하는 문항이 없습니다.</p>':'')+indices.map(i=>{
  const q=bank()[s.year+'-'+(i+1)],n=s.answers[i],correct=q?.correct||[];
  if(!q)return '';
  return '<div class="ck82-review-row"><strong>'+(i+1)+'번 · '+(i<40?'학개론':'민법')+'</strong>'+
   '<span>내 응답: '+(n===null?'미응답':n+'번')+' · 채점 인정: '+
   (correct.length===5?'①~⑤ 전원정답':correct.join(' 또는 ')+'번')+'</span>'+
   '<div class="ck82-result-row-actions"><button type="button" data-ck82-detail="'+esc(q.id)+'">원문·해설 보기</button>'+
 '<button type="button" data-ck82-option-edit="'+esc(q.id)+'">선지별 내 근거</button></div></div>';
 }).join('')+'</div>';
}
function makeResultText(session,official=bank()){
 if(!session||session.status!=='submitted'||!isYear(session.year)||!Array.isArray(session.answers)||
  session.answers.length!==80||!Array.isArray(session.flags)||session.flags.length!==80)return null;
 for(let i=0;i<80;i++){
  const q=official[session.year+'-'+(i+1)];
  if(!q?.verified||!Array.isArray(q.correct)||!q.correct.length||q.options?.length!==5||
   q.correct.some(v=>!isMark(Number(v))))return null;
 }
 const score=gradeAttempt(session,official),at=new Date(session.submittedAt);
 if(!Number.isFinite(at.valueOf()))return null;
 const lines=['ConceptKnot · 공식 기출 80문항 개인 실전연습 (공식 성적표 아님)',
  '시험연도: '+session.year+'년 A형 · 제출: '+at.toISOString(),
  '부동산학개론: '+score.estate.toFixed(1)+'점 ('+score.estateCorrect+'/40)',
  '민법 및 민사특별법: '+score.civil.toFixed(1)+'점 ('+score.civilCorrect+'/40)',
  '평균: '+score.average.toFixed(1)+'점 · 연습 기준 '+(score.passed?'충족':'미충족'),
  '응답 '+score.answered+'/80 · 오답 '+score.wrong.length+' · 미응답 '+score.unanswered.length,
  '제출 방식: '+(session.reason==='time'?'시간 만료':'직접 제출')+' · 중단 '+session.pauseCount+'회',
  '※ 정답 인정 번호는 선지별 참·거짓 판정과 다릅니다. 법령·수식·그림은 시험연도 공식 PDF와 대조하세요.',''];
 for(let i=0;i<80;i++){
  const q=official[session.year+'-'+(i+1)],answer=session.answers[i],accepted=q.correct.map(Number);
  const verdict=answer===null?'미응답':accepted.includes(answer)?'정답':'오답';
  lines.push(String(i+1).padStart(2,'0')+'번 ['+(i<40?'학개론':'민법')+'] 내 답 '+
   (answer===null?'—':answer)+' · 정답 인정 '+accepted.join('/')+' · '+verdict+
   (session.flags[i]?' · 보류 표시':''));
 }
 return lines.join('\n')+'\n';
}
function exportResult(source='active'){
 const session=resultSource(source),body=makeResultText(session);
 if(body===null){message('공식 기출을 모두 불러온 제출 기록에서만 TXT를 내려받을 수 있습니다.');return false;}
 try{
  const file=new Blob(['\uFEFF',body],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(file);
  const link=document.createElement('a');link.href=url;
  link.download='ConceptKnot_80문항_개인채점_'+session.year+'_'+session.submittedAt+'.txt';
  document.body.appendChild(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),2000);message('개인 채점 결과 TXT를 저장했습니다.');return true;
 }catch(e){message('TXT 내려받기 실패: '+(e?.message||e));return false;}
}
function renderHistory(){
 const items=state.history;
 if(!items.length)return '<p>아직 제출한 실전 시험이 없습니다.</p>';
 return '<div class="ck82-history">'+items.map((s,i)=>{
  const complete=checkBank(s.year).ok,score=complete?gradeAttempt(s):null;
  const date=new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(s.submittedAt));
  return '<div><strong>'+date+' · '+s.year+'년</strong><span>'+
   (score?'학개론 '+score.estate+'점 · 민법 '+score.civil+'점 · 평균 '+score.average+'점':'공식 문제 로딩 대기')+
   '</span><span>'+(score?(score.passed?'연습 기준 충족':'미충족'):'기록 유지')+
   ' · '+(s.reason==='time'?'시간 만료':'직접 제출')+'</span>'+
   '<button type="button" data-ck82-history-select="'+i+'" aria-pressed="'+(historySelection===i)+'">상세 결과</button></div>';
 }).join('')+'</div>';
}
function renderLauncher(){
 const s=active(),bankState=window.CK89OfficialBank?.getStatus?.();
 const registered=bankState?.registered||Object.keys(bank()).length;
 const years='<label>연습 기출 연도 <select data-ck82-year aria-label="실전 시험 연도">'+YEARS.map(y=>
  '<option value="'+y+'"'+(selectedYear===y?' selected':'')+'>'+y+'년 공식 A형</option>').join('')+'</select></label>';
 return '<div class="ck82-launch"><div><strong>80문항 · 100분 통합 실전</strong>'+
  '<p>학개론 40문항 + 민법 40문항, A형 최종정답 채점 · 미응답과 보류 표시 · 자동 저장·복원</p>'+
 '<p class="ck82-bank-state" role="status">공식 데이터 '+registered+'/800 문항'+
 (bankState?.loading?' · 이전 연도 확인 중':'')+
 (bankState?.lastError?' · 로딩 오류: '+esc(bankState.lastError):'')+
 '</p></div>'+
  '<div class="ck82-launch-actions">'+years+
  '<button type="button" data-ck82-start>새 시험 시작</button>'+
  (s?'<button type="button" data-ck82-expand>'+(expanded?'시험 화면 접기':s.status==='submitted'?'최근 결과 보기':'진행 중인 시험 열기')+'</button>':'')+
  (state.history.length?'<button type="button" data-ck82-history>성적 기록 '+state.history.length+'건</button>':'')+
  '</div></div>';
}
function paint(){
 if(!root?.isConnected)return;
 const s=active();
 document.body.classList.toggle('ck82-exam-focused',expanded&&Boolean(s));
 root.innerHTML=(storageIssue?'<div class="ck82-warning" role="alert">'+esc(storageIssue)+'<button type="button" data-ck82-raw>손상 기록 원본 내려받기</button></div>':'')+renderLauncher()+
  '<div class="ck82-workspace" data-ck82-workspace tabindex="0"'+(!expanded?' hidden':'')+'>'+
  (expanded&&s?(s.status==='submitted'?renderResult(s):renderSession(s)):
   (expanded?'<p>시험을 시작하면 이곳에 80문항이 표시됩니다.</p>':''))+
  (expanded&&s?.status==='submitted'?'<div class="ck82-actions"><button type="button" data-ck82-new>다른 연도로 새 시험 시작</button></div>':'')+
  '</div>'+
  (showHistory?'<section class="ck82-history-panel"><h3>최근 20회 실전 성적</h3>'+renderHistory()+
  (historyAt(historySelection)?'<div class="ck82-history-detail"><h3>과거 제출 상세 · '+historyAt(historySelection).year+'년</h3>'+renderResult(historyAt(historySelection),'history:'+historySelection)+'</div>':'')+
  '</section>':'')+
  '<p class="ck82-note" data-ck82-notice role="status">'+esc(error)+'</p>';
 root.querySelectorAll('[data-ck82-result-list]').forEach(list=>{
  const source=list.closest('[data-ck82-result-source]')?.dataset.ck82ResultSource||'active';
  const session=resultSource(source);if(session)list.innerHTML=resultItems(session);
 });
}
function mount(){
 const old=document.getElementById('ck82-full-exam');
 if(old){root=old;return;}
 const target=document.querySelector('#main .ck20-quiz-sets');
 if(!target){root=null;document.body.classList.remove('ck82-exam-focused');return;}
 root=document.createElement('section');root.id='ck82-full-exam';root.className='ck82-full-exam';
 target.before(root);
 paint();
}
function tick(){
 if(document.hidden)return;
 checkExpiry();
 const text=root?.querySelector('[data-ck82-clock]');
 if(text){const s=active();if(s&&s.status!=='submitted')text.textContent=fmtClock(remaining(s));}
}
document.addEventListener('click',event=>{
 const t=event.target.closest?.('[data-ck82-start],[data-ck82-expand],[data-ck82-history],[data-ck82-history-select],'+
 '[data-ck82-answer],[data-ck82-goto],[data-ck82-prev],[data-ck82-next],'+
 '[data-ck82-clear],[data-ck82-flag],[data-ck82-pause],[data-ck82-resume],'+
 '[data-ck82-submit],[data-ck82-filter],[data-ck82-export],[data-ck82-detail],[data-ck82-option-edit],[data-ck82-hide],[data-ck82-new],[data-ck82-raw],[data-ck82-retry-bank]');
 if(!t||!root?.contains(t))return;
 event.preventDefault();event.stopPropagation();
 if(t.hasAttribute('data-ck82-raw')){
  try{
   const raw=localStorage.getItem(KEY);if(raw===null)return;
   const blob=new Blob([raw],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob);
   const a=document.createElement('a');a.href=url;a.download='ConceptKnot_시험기록_손상원본.json';
   document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
  }catch{message('원본 내려받기에 실패했습니다. 원본은 수정하지 않았습니다.');}return;
 }
 if(t.hasAttribute('data-ck82-retry-bank')){
  const year=Number(t.dataset.ck82RetryBank);
  if(year<=2020)window.CK89OfficialBank?.loadYear?.(year).then(()=>{error='';paint();})
   .catch(e=>message('공식 기출 파일 재시도 실패: '+e.message));
  else message('최근 5개년 기본 등록 문항이 누락됐습니다. 사이트 파일을 확인하세요.');
  return;
 }
 if(t.hasAttribute('data-ck82-start')){
  start(selectedYear);return;
 }
 if(t.hasAttribute('data-ck82-expand')){
  expanded=!expanded;paint();if(expanded)focusRegion();return;
 }
 if(t.hasAttribute('data-ck82-history')){
  showHistory=!showHistory;if(!showHistory)historySelection=-1;paint();return;
 }
 if(t.hasAttribute('data-ck82-history-select')){
  const i=Number(t.dataset.ck82HistorySelect);historySelection=historyAt(i)?(historySelection===i?-1:i):-1;showHistory=true;paint();return;
 }
 if(t.hasAttribute('data-ck82-export')){exportResult(t.dataset.ck82Export);return;}
 if(t.hasAttribute('data-ck82-answer')){setAnswer(Number(t.dataset.ck82Answer));focusRegion();return;}
 if(t.hasAttribute('data-ck82-goto')){navigate(Number(t.dataset.ck82Goto));focusRegion();return;}
 if(t.hasAttribute('data-ck82-prev')){navigate((active()?.position||0)-1);focusRegion();return;}
 if(t.hasAttribute('data-ck82-next')){navigate((active()?.position||0)+1);focusRegion();return;}
 if(t.hasAttribute('data-ck82-clear')){setAnswer(null);focusRegion();return;}
 if(t.hasAttribute('data-ck82-flag')){setFlag();focusRegion();return;}
 if(t.hasAttribute('data-ck82-pause')){pause();focusRegion();return;}
 if(t.hasAttribute('data-ck82-resume')){resume();focusRegion();return;}
 if(t.hasAttribute('data-ck82-submit')){
  const s=active(),emptyCount=s?.answers.filter(x=>x===null).length||0,unreviewed=s?.flags.filter(Boolean).length||0;
  if(!s||s.status==='submitted')return;
  if(s.status==='running'&&remaining(s)===0){finish('time');return;}
  if(!checkBank(s.year).ok){message('공식 문항 로딩이 완료되면 제출할 수 있습니다.');return;}
  if(s?.status==='submitted')return;
  if(window.confirm?.('실전 시험을 제출할까요? 미응답 '+emptyCount+'건 · 보류 표시 '+
   unreviewed+'건. 제출하면 답안 수정이 불가능합니다.'))finish('manual');
  return;
 }
 if(t.hasAttribute('data-ck82-filter')){resultFilter=t.dataset.ck82Filter;paint();return;}
 if(t.hasAttribute('data-ck82-option-edit')){
  const id=t.dataset.ck82OptionEdit;
  const result=window.CK83Links?.openQuestion?.(id);
  if(result===false)message('개인 근거 편집기를 열지 못했습니다. 공식 문항 로딩 상태를 확인하세요.');
  else if(result&&typeof result.catch==='function')result.catch(e=>message('개인 근거 편집 오류: '+e.message));
  return;
 }
 if(t.hasAttribute('data-ck82-detail')){
  const id=t.dataset.ck82Detail,[year,number]=id.split('-').map(Number);
  if(typeof window.CK78Analysis?.open==='function'&&year>=2021)window.CK78Analysis.open(year,number,t);
  else window.CK76Study?.openQuestion?.(year,number);
  return;
 }
 if(t.hasAttribute('data-ck82-hide')){expanded=false;paint();return;}
 if(t.hasAttribute('data-ck82-new')){expanded=false;paint();return;}
});
document.addEventListener('change',event=>{
 if(event.target.matches?.('[data-ck82-year]')&&root?.contains(event.target)){
  selectedYear=Number(event.target.value);
  if(selectedYear<=2020)window.CK89OfficialBank?.loadYear?.(selectedYear).catch(e=>message('공식 문제 로딩 실패: '+e.message));
 }
});
document.addEventListener('keydown',event=>{
 if(!expanded||!root?.contains(event.target)||event.altKey||event.ctrlKey||event.metaKey||
  /INPUT|TEXTAREA|SELECT/.test(event.target?.tagName||''))return;
 const s=active();if(s?.status!=='running'||event.isComposing||event.repeat||event.keyCode===229)return;
 if(/^[1-5]$/.test(event.key)){event.preventDefault();event.stopImmediatePropagation();setAnswer(Number(event.key));focusRegion();}
 else if(event.key==='ArrowRight'||event.key==='ArrowLeft'){
  event.preventDefault();event.stopImmediatePropagation();
  navigate(s.position+(event.key==='ArrowRight'?1:-1));focusRegion();
 }
},true);
document.addEventListener('visibilitychange',()=>{if(!document.hidden){checkExpiry();if(root?.isConnected)paint();}syncClockTimer();});
window.addEventListener('pageshow',()=>{checkExpiry();syncClockTimer();if(root?.isConnected)paint();});
window.addEventListener('pagehide',()=>{if(clockTimer!==null){window.clearInterval?.(clockTimer);clockTimer=null;}});
window.addEventListener('ck:official-bank-ready',()=>{
 checkExpiry();
 if(root?.isConnected)paint();
});
window.addEventListener('ck:official-bank-error',event=>{
 error='공식 자료를 불러오지 못했습니다: '+(event.detail?.message||'알 수 없는 오류');
 if(root?.isConnected)paint();
});
window.addEventListener('storage',event=>{
 if(event.key===KEY){state=readStore();syncClockTimer();historySelection=-1;error=storageIssue||'다른 탭에서 최신 시험 기록을 불러왔습니다.';if(root?.isConnected)paint();status(error);}
});
function schedule(){
 if(scheduled)return;scheduled=true;
 requestAnimationFrame(()=>{scheduled=false;mount();});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
const main=document.getElementById('main');
if(main&&window.MutationObserver)new MutationObserver(records=>{
 if(!document.getElementById('ck82-full-exam')&&records.some(x=>x.addedNodes.length))schedule();
}).observe(main,{childList:true,subtree:true});
checkExpiry();
syncClockTimer();
window.CK82FullExam=Object.freeze({
 checkBank,cleanStore,sanitizeAttempt,newAttempt,gradeAttempt,remaining,fmtClock,
 getAttempts:()=>state.history.map(x=>JSON.parse(JSON.stringify(x))),
 getState:()=>({active:active()?.status||'none',year:active()?.year||null,history:state.history.length,
  remainingMs:remaining(active()),revision:state.revision,storageIssue,loadingYear,expiryLoadingYear,expanded,historySelection,error,clockTicking:clockTimer!==null}),
 start,setAnswer,navigate,pause,resume,finish,historyAt,resultSource,makeResultText,exportResult,
 open:()=>{checkExpiry();syncClockTimer();mount();if(root&&!expanded){expanded=true;paint();focusRegion();}}
});
})();