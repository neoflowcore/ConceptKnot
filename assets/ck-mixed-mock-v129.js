/* ConceptKnot v129 - five 80-question, 100-minute mixed A-form practice sets.
 * Reorders existing official records without editing source question/answer content.
 * Distinct from legally reviewed rewritten ('application') questions.
 */
(function(){
'use strict';
const KEY='ck129-mixed-sessions-v1',VERSION=1,DURATION=6000000,HISTORY_LIMIT=10;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const bank=()=>window.RECALL_OFFICIAL||{};
const validSet=s=>Number.isInteger(s)&&s>=1&&s<=5;
const mark=n=>Number.isInteger(n)&&n>=1&&n<=5;
const empty=()=>({schemaVersion:VERSION,revision:0,active:null,history:[]});
const formId=id=>typeof id==='string'&&/^20(?:1[6-9]|2[0-5])-(?:[1-9]|[1-7]\d|80)$/.test(id);
function makeSet(set){
 if(!validSet(set))return [];
 const parts=[[],[]];
 for(let subject=0;subject<2;subject++){
  for(let year=2016;year<=2025;year++)for(let k=0;k<4;k++){
   const number=subject*40+1+(((set-1)*4+k+(year-2016)*3)%40);
   parts[subject].push(year+'-'+number);
  }
 }
 function shuffle(arr,seed){
  const out=arr.slice();let x=seed>>>0;
  for(let i=out.length-1;i>0;i--){x=(Math.imul(x,1664525)+1013904223)>>>0;
   const j=x%(i+1);[out[i],out[j]]=[out[j],out[i]];}
  return out;
 }
 return shuffle(parts[0],0x9e3779b1^set).concat(shuffle(parts[1],0x85ebca77^set));
}
function validIds(ids){
 return Array.isArray(ids)&&ids.length===80&&new Set(ids).size===80&&ids.every((id,i)=>{
  if(!formId(id))return false;
  const number=Number(id.split('-')[1]);return i<40?number<=40:number>=41;
 });
}
function validQuestion(id,q){
 if(!formId(id)||!q||q.id!==id||q.verified!==true||typeof q.question!=='string'||!q.question.trim()||
  !Array.isArray(q.options)||q.options.length!==5||q.options.some(v=>typeof v!=='string'||!v.trim())||
  !Array.isArray(q.correct)||!q.correct.length||q.correct.length>5||
  q.correct.some(n=>!mark(Number(n)))||new Set(q.correct.map(Number)).size!==q.correct.length||
  typeof q.originalUrl!=='string'||!/^https:\/\//.test(q.originalUrl))return false;
 const [year,number]=id.split('-').map(Number);
 return year===q.year&&number===q.number&&q.subject===(number<=40?'estate':'civil');
}
function checkIds(ids,official=bank()){
 if(!validIds(ids))return {ready:false,missing:[]};
 const missing=ids.filter(id=>!validQuestion(id,official[id]));
 return {ready:missing.length===0,missing};
}
const checkSet=set=>checkIds(makeSet(set));
/* Each published mixed set has an immutable, deterministic question/order map.
 * A valid-looking imported ID list must not impersonate another paper. */
function matchesFixedPaper(set,ids){
 if(!validSet(set)||!validIds(ids))return false;
 const canonical=makeSet(set);
 return canonical.length===80&&canonical.every((id,i)=>id===ids[i]);
}
function sanitizeSession(s){
 if(!s||!matchesFixedPaper(s.set,s.ids)||!['running','paused','submitted'].includes(s.status)||
  !Array.isArray(s.answers)||s.answers.length!==80||s.answers.some(x=>x!==null&&!mark(x))||
  !Array.isArray(s.flags)||s.flags.length!==80||s.flags.some(x=>typeof x!=='boolean')||
  !Number.isSafeInteger(s.startedAt)||s.startedAt<=0||s.startedAt>Date.now()+86400000||
  !Number.isFinite(s.deadlineAt)||s.deadlineAt<=0||
  !Number.isFinite(s.remainingMs)||s.remainingMs<0||s.remainingMs>DURATION||
  !Number.isInteger(s.position)||s.position<0||s.position>79||
  !Number.isInteger(s.pauseCount)||s.pauseCount<0||s.pauseCount>999)return null;
 if(s.status==='submitted'&&(!Number.isSafeInteger(s.submittedAt)||s.submittedAt<s.startedAt))return null;
 return {set:s.set,ids:s.ids.slice(),status:s.status,startedAt:s.startedAt,
  deadlineAt:s.deadlineAt,remainingMs:s.remainingMs,position:s.position,pauseCount:s.pauseCount,
  answers:s.answers.slice(),flags:s.flags.slice(),submittedAt:s.status==='submitted'?s.submittedAt:0,
  reason:s.status==='submitted'&&s.reason==='time'?'time':s.status==='submitted'?'manual':''};
}
function cleanStore(x){
 if(!x||x.schemaVersion!==VERSION||!Number.isSafeInteger(x.revision)||x.revision<0||
  !Array.isArray(x.history)||x.history.length>HISTORY_LIMIT)return null;
 const history=x.history.map(sanitizeSession);
 if(history.some(s=>!s||s.status!=='submitted'))return null;
 const active=x.active===null?null:sanitizeSession(x.active);
 if(x.active!==null&&!active)return null;
 return {schemaVersion:VERSION,revision:x.revision,active,history};
}
let loadedRaw=null,issue='',message='',state=empty(),root=null,expanded=false,selectedSet=1,
 showHistory=false,historyDetail=-1,resultFilter='all',loading=false,clock=null,scheduled=false;
function read(){
 try{const raw=localStorage.getItem(KEY);
  if(raw===null){loadedRaw=null;issue='';return empty();}
  const cleaned=raw.length<=500000?cleanStore(JSON.parse(raw)):null;
  if(!cleaned)throw Error('invalid personal session format');
  loadedRaw=raw;issue='';return cleaned;
 }catch{issue='기존 혼합 실전 기록이 손상됐거나 읽을 수 없습니다. 원본 덮어쓰기를 차단합니다.';return empty();}
}
state=read();
const active=()=>state.active;
const remaining=(s,now=Date.now())=>s?.status==='running'?Math.max(0,s.deadlineAt-now):
 s?.status==='paused'?Math.max(0,s.remainingMs):0;
function clockText(ms){const n=Math.ceil(Math.max(0,ms)/1000);
 return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');}
function syncTimer(){
 const shown=Boolean(root?.isConnected)&&Boolean(root?.getClientRects?.().length);
 const needed=active()?.status==='running'&&expanded&&shown&&!document.hidden;
 if(!needed&&clock!==null){clearInterval(clock);clock=null;}
 if(needed&&clock===null)clock=setInterval(tick,1000);
}
function persist(candidate){
 if(issue){message=issue;return false;}
 const clean=cleanStore(candidate);
 if(!clean){message='기록 형식이 유효하지 않아 저장하지 않았습니다.';return false;}
 try{
  if(localStorage.getItem(KEY)!==loadedRaw){state=read();syncTimer();
   message=issue||'다른 탭에서 답안을 바꿨습니다. 기존 기록을 덮지 않고 최신 상태를 읽었습니다.';
   paint();return false;}
  clean.revision=state.revision+1;
  const raw=JSON.stringify(clean);if(raw.length>500000)throw Error('record too large');
  localStorage.setItem(KEY,raw);loadedRaw=raw;state=clean;message='';syncTimer();return true;
 }catch{message='브라우저 저장 권한/용량 오류입니다. 기존 기록은 보호됩니다.';return false;}
}
function grade(s,official=bank()){
 if(!s||!matchesFixedPaper(s.set,s.ids)||!checkIds(s.ids,official).ready)return null;
 let estateCount=0,civilCount=0,answered=0;
 const wrong=[],blank=[],correct=[],allAccepted=[];
 for(let i=0;i<80;i++){
  const id=s.ids[i],q=official[id],v=s.answers[i];
  if(q.correct.length===5)allAccepted.push(id);
  if(v===null){blank.push(id);continue;}
  answered++;
  if(q.correct.map(Number).includes(v)){
   correct.push(id);if(i<40)estateCount++;else civilCount++;
  }else wrong.push(id);
 }
 const estate=estateCount*2.5,civil=civilCount*2.5,average=(estate+civil)/2;
 return {estate,civil,average,total:estateCount+civilCount,estateCount,civilCount,
  estateCorrect:estateCount,civilCorrect:civilCount,answered,
  wrong,blank,correct,allAccepted,passed:estate>=40&&civil>=40&&average>=60};
}
function createAttempt(set,now=Date.now()){
 const ids=makeSet(set);if(!checkIds(ids).ready)return null;
 return {set,ids,status:'running',startedAt:now,deadlineAt:now+DURATION,remainingMs:DURATION,
  position:0,pauseCount:0,answers:Array(80).fill(null),flags:Array(80).fill(false),submittedAt:0,reason:''};
}
function loadMissing(){
 if(loading)return false;
 const loader=window.CK89OfficialBank?.loadAll;
 if(typeof loader!=='function'){message='10개년 공식 기출 로더를 아직 사용할 수 없습니다.';paint();return false;}
 loading=true;message='10개년 공식 원문을 읽는 중입니다. 완료 후 시작 버튼을 다시 누르세요.';paint();
 Promise.resolve().then(()=>loader()).then(()=>{message='원문 준비 완료. 시작 버튼을 다시 누르세요.';},
  e=>{message='10개년 공식 원문 로드 실패: '+String(e?.message||e);}).finally(()=>{loading=false;paint();});
 return false;
}
function start(set=selectedSet){
 if(!validSet(set))return false;
 if(!checkSet(set).ready)return loadMissing();
 if(active()&&active().status!=='submitted'&&
  !window.confirm?.('현재 혼합 실전의 미제출 답안을 새 시험으로 교체할까요?'))return false;
 const s=createAttempt(set);if(!s||!persist({...state,active:s}))return false;
 selectedSet=set;expanded=true;showHistory=false;historyDetail=-1;resultFilter='all';paint();focus();return true;
}
function saveSession(s){
 if(!s)return false;
 const ok=persist({...state,active:s});
 paint();
 // Repainting replaces the focused answer/OMR button. Restore keyboard focus
 // to the stable workspace so numeric and arrow shortcuts remain usable.
 if(ok&&expanded)focus();
 return ok;
}
function answer(v){const s=active();if(s?.status!=='running')return false;
 if(remaining(s)===0){finish('time');return false;}
 if(v!==null&&!mark(v))return false;
 const answers=s.answers.slice();answers[s.position]=v;return saveSession({...s,answers});
}
function goto(index){const s=active();if(!s||!Number.isInteger(index)||index<0||index>=80)return false;
 if(s.status==='running'&&remaining(s)===0){finish('time');return false;}
 return saveSession({...s,position:index});}
function flag(){const s=active();if(!s||s.status!=='running')return false;
 if(s.status==='running'&&remaining(s)===0){finish('time');return false;}
 const flags=s.flags.slice();flags[s.position]=!flags[s.position];return saveSession({...s,flags});}
function pause(){const s=active();if(s?.status!=='running')return false;
 if(remaining(s)===0)return finish('time');
 return saveSession({...s,status:'paused',remainingMs:remaining(s),pauseCount:s.pauseCount+1});}
function resume(){const s=active();if(s?.status!=='paused')return false;
 return saveSession({...s,status:'running',deadlineAt:Date.now()+s.remainingMs});}
function finish(reason='manual',now=Date.now()){
 const s=active();if(!s||s.status==='submitted')return false;
 if(!checkIds(s.ids).ready){message='원문·정답을 모두 확인하기 전에는 채점하지 않습니다.';loadMissing();return false;}
 const submitted={...s,status:'submitted',submittedAt:now,remainingMs:0,
  reason:reason==='time'||(s.status==='running'&&remaining(s,now)===0)?'time':'manual'};
 if(!persist({...state,active:submitted,history:[submitted,...state.history].slice(0,HISTORY_LIMIT)}))return false;
 expanded=true;historyDetail=-1;showHistory=false;resultFilter='all';paint();
 try{document.dispatchEvent(new Event('ck:mixed-exam-submitted',{detail:{set:s.set}}));}catch{}
 return true;
}
function checkExpired(){const s=active();if(s?.status!=='running'||remaining(s)>0)return false;
 if(!checkIds(s.ids).ready){if(!loading)loadMissing();return false;}return finish('time');}
function tick(){const s=active();if(s?.status!=='running')return;
 if(remaining(s)===0){checkExpired();return;}
 const label=root?.querySelector('[data-ck129-clock]');if(label)label.textContent=clockText(remaining(s));}
const subject=i=>i<40?'학개론':'민법 및 민사특별법';
function questionPanel(s){
 const i=s.position,q=bank()[s.ids[i]];
 if(!validQuestion(s.ids[i],q))return '<p role="status">공식 원문을 불러오는 중입니다. 기존 답안은 보존됩니다.</p>';
 const can=s.status==='running';
 return '<div class="ck129-session-head"><div><strong>혼합 '+s.set+'세트 · '+(i+1)+'/80</strong><small>'+subject(i)+' · '+esc(q.id)+'</small></div>'+
  '<strong data-ck129-clock class="ck129-clock">'+clockText(remaining(s))+'</strong></div>'+
  '<p class="ck129-progress">응답 '+s.answers.filter(x=>x!==null).length+'/80 · 보류 '+s.flags.filter(Boolean).length+
  ' · 중단 '+s.pauseCount+'회</p><div class="ck129-layout"><section class="ck129-question">'+
  '<p class="ck129-stem">'+esc(q.question)+'</p><div class="ck129-options" role="group" aria-label="답안 선택">'+
  q.options.map((opt,k)=>'<button type="button" data-ck129-answer="'+(k+1)+'" aria-pressed="'+(s.answers[i]===k+1)+'"'+
  (can?'':' disabled')+'><b>'+'①②③④⑤'[k]+'</b><span>'+esc(opt)+'</span></button>').join('')+'</div>'+
  '<div class="ck129-actions"><button type="button" data-ck129-clear'+(can?'':' disabled')+'>미응답</button>'+
  '<button type="button" data-ck129-flag'+(can?'':' disabled')+'>'+(s.flags[i]?'보류 해제':'보류 표시')+'</button>'+
  '<button type="button" data-ck129-prev'+(i===0?' disabled':'')+'>이전</button>'+
  '<button type="button" data-ck129-next'+(i===79?' disabled':'')+'>다음</button></div>'+
  '<a href="'+esc(q.originalUrl)+'" target="_blank" rel="noopener noreferrer">공식 문제지 원문 대조</a>'+
  '<p class="ck129-disclaimer">표·그림·수식은 원본 PDF와 대조하세요. 정답은 제출 전 공개하지 않습니다.</p></section>'+
  '<aside class="ck129-omr" aria-label="혼합 80문항 답안지">'+[0,1].map(part=>{
   const off=part*40;
   return '<div><h4>'+subject(off)+'</h4><div class="ck129-grid">'+Array.from({length:40},(_,k)=>{
    const idx=off+k;
    return '<button type="button" data-ck129-goto="'+idx+'" class="'+(s.answers[idx]!==null?'answered ':'')+
     (s.flags[idx]?'flagged ':'')+(idx===s.position?'current':'')+'" aria-current="'+(idx===s.position)+'" title="'+
     (idx+1)+'번 '+(s.answers[idx]===null?'미응답':s.answers[idx]+'번 선택')+'">'+(idx+1)+(s.flags[idx]?'!':'')+'</button>';
   }).join('')+'</div></div>';
  }).join('')+'</aside></div><div class="ck129-actions">'+
  (s.status==='running'?'<button type="button" data-ck129-pause>시간 정지</button>':
   s.status==='paused'?'<button type="button" data-ck129-resume>시험 재개</button>':'')+
  '<button type="button" data-ck129-submit>채점 제출</button><button type="button" data-ck129-collapse>화면 접기</button></div>'+
  (s.status==='paused'?'<p class="ck129-warning">일시 정지 상태: 재개 전 답안 수정 불가.</p>':'')+
  (s.pauseCount?'<p class="ck129-warning">일시 중지가 포함된 기록은 실제 연속 100분 시험과 다릅니다.</p>':'');
}
function resultPanel(s,source='active'){
 const g=grade(s);if(!g)return '<p role="status">원문 80문항을 불러온 다음 채점 내용을 확인할 수 있습니다.</p>';
 return '<div class="ck129-result"><h4>혼합 '+s.set+'세트 결과 · 연습 기준 '+(g.passed?'충족':'미달')+'</h4>'+
  '<p>학개론 40점·민법 40점 이상 및 평균 60점 이상이 기준입니다. 공식 시험 성적은 아닙니다.</p>'+
  '<div class="ck129-scores"><div><small>학개론</small><strong>'+g.estate.toFixed(1)+'점</strong></div>'+
  '<div><small>민법</small><strong>'+g.civil.toFixed(1)+'점</strong></div>'+
  '<div><small>평균</small><strong>'+g.average.toFixed(1)+'점</strong></div></div>'+
  '<p>응답 '+g.answered+'/80 · 오답 '+g.wrong.length+' · 미응답 '+g.blank.length+
  ' · 전원정답 처리 '+g.allAccepted.length+' · 중단 '+s.pauseCount+'회</p>'+
  '<p class="ck129-disclaimer">미응답은 정답으로 채점하지 않습니다. 정답 인정은 선지 진위와 다를 수 있습니다.</p>'+
  '<div class="ck130-result-filters" role="group" aria-label="제출 결과 필터">'+
  [['all','전체 80문항'],['wrong','오답 '+g.wrong.length+'문항'],['blank','미응답 '+g.blank.length+'문항'],['flagged','보류 '+s.flags.filter(Boolean).length+'문항']].map(([key,label])=>
   '<button type="button" data-ck130-filter="'+key+'" aria-pressed="'+(resultFilter===key)+'">'+label+'</button>').join('')+
  '</div><button type="button" data-ck129-export="'+esc(source)+'">개인 결과 TXT</button>'+
  (resultFilter==='wrong'&&!g.wrong.length?'<p role="status">이 세트에는 오답이 없습니다.</p>':'')+
  (resultFilter==='blank'&&!g.blank.length?'<p role="status">이 세트에는 미응답 문항이 없습니다.</p>':'')+
  (resultFilter==='flagged'&&!s.flags.some(Boolean)?'<p role="status">이 세트에는 보류 표시한 문항이 없습니다.</p>':'')+
  '<div class="ck129-result-list">'+
  s.ids.map((id,i)=>{
   const q=bank()[id],answer=s.answers[i],ok=answer!==null&&q.correct.map(Number).includes(answer);
   if(resultFilter==='wrong'&&(answer===null||ok)||resultFilter==='blank'&&answer!==null||resultFilter==='flagged'&&!s.flags[i])return '';
   return '<div class="ck129-result-row"><b>'+(i+1)+'번 '+id+'</b><span>'+(answer===null?'미응답':ok?'정답':'오답')+
    ' · 내 답 '+(answer===null?'—':answer)+' · 인정 '+esc(q.correct.join('/'))+'</span>'+
    '<a href="'+esc(q.originalUrl)+'" target="_blank" rel="noopener noreferrer">원문</a>'+
    '<button type="button" data-ck130-review="'+esc(id)+'">근거·개인 풀이</button></div>';
  }).join('')+'</div></div>';
}
function fromSource(source){if(source==='active')return active()?.status==='submitted'?active():null;
 const m=/^history:(\d{1,2})$/.exec(String(source||'')),i=m?Number(m[1]):-1;
 return i>=0&&i<state.history.length?state.history[i]:null;}
function resultText(s){const g=grade(s);if(!s||s.status!=='submitted'||!g)return null;
 const lines=['ConceptKnot 공식 A형 기출 10개년 혼합 재배열 '+s.set+'세트',
  '새로 만든 변형 문제 아님. 실제 문항·정답·출처 변경 없음. 개인 연습 성적, 공식 성적표 아님.',
  '제출: '+new Date(s.submittedAt).toISOString(),
  '학개론 '+g.estate.toFixed(1)+'점 · 민법 '+g.civil.toFixed(1)+'점 · 평균 '+g.average.toFixed(1)+'점',
  '응답 '+g.answered+'/80 · 중단 '+s.pauseCount+'회',''];
 for(let i=0;i<80;i++){
  const id=s.ids[i],q=bank()[id],v=s.answers[i];
  lines.push((i+1)+'. '+id+' '+subject(i)+' · 내 답 '+(v===null?'미응답':v)+
   ' · 정답 인정 '+q.correct.join('/')+' · '+(v===null?'미응답':q.correct.map(Number).includes(v)?'정답':'오답')+
   (s.flags[i]?' · 보류':'')+' · '+q.originalUrl);
 }
 return lines.join('\n')+'\n';
}
function download(source){
 // Keep exported score rows consistent with the exact browser snapshot.
 try{
  if(issue||localStorage.getItem(KEY)!==loadedRaw){
   message='다른 탭의 변경 또는 손상 기록이 감지되어 결과 TXT를 생성하지 않았습니다. 최신 기록을 확인하세요.';
   paint();return false;
  }
 }catch{
  message='시험 기록 저장소를 읽지 못해 결과 TXT를 생성하지 않았습니다.';
  paint();return false;
 }
 const s=fromSource(source),text=resultText(s);
 if(!text){message='공식 기출을 불러온 제출 기록에서만 결과 TXT를 만들 수 있습니다.';paint();return false;}
 try{const file=new Blob(['\uFEFF',text],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(file);
  const a=document.createElement('a');a.href=url;a.download='ConceptKnot_혼합_'+s.set+'세트_'+s.submittedAt+'.txt';
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
  message='TXT 다운로드 요청 완료. 파일 목록에서 저장 여부를 확인하세요.';paint();return true;
 }catch{message='TXT 생성 실패. 원본 답안은 유지됩니다.';paint();return false;}
}
function backup(){try{const raw=localStorage.getItem(KEY);
 if(raw===null){message='저장된 혼합 실전 원본이 없습니다.';paint();return false;}
 if(localStorage.getItem(KEY)!==raw){message='다른 탭 변경을 감지했습니다. 다시 시도하세요.';paint();return false;}
 const file=new Blob([raw],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(file);
 const a=document.createElement('a');a.href=url;a.download='ConceptKnot_혼합실전_원본보관_'+new Date().toISOString().slice(0,10)+'.json';
 document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
 message='원본 JSON 다운로드를 요청했습니다. 실제 저장 여부를 확인하세요.';paint();return true;
 }catch{message='원본 백업 실패. 기존 기록을 지우지 마세요.';paint();return false;}}
/* Restore is non-destructive: keep a running local exam; merge submitted
 * history by session identity and refuse overflow rather than dropping it. */
function mergeRestore(current,incoming){
 const invalid=pack=>!pack||!Array.isArray(pack.history)||pack.history.some(row=>!sanitizeSession(row))||
  pack.active!==null&&pack.active!==undefined&&!sanitizeSession(pack.active);
 if(invalid(current)||invalid(incoming))
  throw Error('혼합 연습 병합 원본의 세트·답안·시간 형식이 유효하지 않습니다.');
 const seen=new Map(),history=[];
 const add=s=>{
  if(!s||s.status!=='submitted')return;
  const id=s.set+':'+s.startedAt+':'+s.submittedAt;
  if(seen.has(id)){
   if(JSON.stringify(seen.get(id))!==JSON.stringify(s))
    throw Error('동일 제출 회차에서 다른 답안·보류 기록이 발견됐습니다. 두 원본을 별도로 보관하고 병합을 중단하세요.');
   return;
  }
  seen.set(id,s);history.push(s);
 };
 for(const s of current.history)add(s);
 for(const s of incoming.history)add(s);
 add(current.active);add(incoming.active);
 history.sort((a,b)=>b.submittedAt-a.submittedAt);
 if(history.length>HISTORY_LIMIT)throw Error('복원 후 제출 이력이 10건을 초과합니다. 현재 원본과 백업을 분리 보관하세요.');
 const pending=s=>s?.status==='running'||s?.status==='paused';
 const local=current.active,backup=incoming.active;
 if(pending(local)&&pending(backup)&&
  JSON.stringify(local)!==JSON.stringify(backup))
  throw Error('현재 진행 시험과 백업의 미제출 시험이 서로 다릅니다. 기존 기록 손실 방지를 위해 복원을 차단했습니다.');
 let active=local;
 if(pending(backup)&&!pending(local))active=backup;
 else if(!pending(local)&&!pending(backup)&&backup&&
  (!local||backup.submittedAt>local.submittedAt))active=backup;
 return {...current,active,history};
}
async function importFile(file){
 if(!file||file.size>500000){message='혼합 연습 백업 JSON은 500KB 이하만 지원합니다.';paint();return false;}
 if(issue){message=issue+' 먼저 손상 원본 JSON을 별도 저장한 뒤 복원하세요.';paint();return false;}
 try{
  const raw=await file.text(),backup=cleanStore(JSON.parse(raw.replace(/^\uFEFF/,'')));
  if(!backup)throw Error('지원하지 않는 백업 파일 구조입니다.');
  const original=localStorage.getItem(KEY);
  if(original!==loadedRaw)throw Error('백업 읽는 중 다른 탭의 변경이 감지됐습니다. 복원을 취소했습니다.');
  const merged=mergeRestore(state,backup);
  if(JSON.stringify({...merged,revision:0})===JSON.stringify({...state,revision:0})){
   message='복원할 새로운 혼합 연습 기록이 없습니다.';paint();return false;
  }
  if(!window.confirm?.('혼합 실전 백업을 현재 기록과 병합할까요? 진행 중인 답안은 보존하며 10회 한도 초과 시 취소됩니다.'))return false;
  if(original!==localStorage.getItem(KEY))throw Error('확인 중 다른 탭에서 변경됐습니다. 복원하지 않았습니다.');
  if(!persist(merged))return false;
  historyDetail=-1;showHistory=false;
  message='혼합 연습 백업을 병합했습니다. 제출 이력 '+state.history.length+'건과 현재 시험 상태를 확인하세요.';
  paint();return true;
 }catch(e){message='백업 복원 실패 · '+String(e?.message||e);paint();return false;}
}
function focus(){try{root?.querySelector('[data-ck129-workspace]')?.focus({preventScroll:true});}catch{}}
function paint(){
 if(!root?.isConnected)return;
 const s=active(),ready=checkSet(selectedSet).ready;
 root.innerHTML='<div class="ck129-heading"><div><strong>10개년 공식 기출 혼합 5세트</strong>'+
  '<p>세트마다 학개론 40 + 민법 40 · 100분 · 5세트 고정 배정 400문항(세트 간 중복 없음)</p>'+
  '<small>법령 내용을 뒤집어 새로 만든 응용 문항이 아니라 공식 A형 기출 재배열입니다.</small></div>'+
  '<div class="ck129-controls"><label>연습 세트 <select data-ck129-set>'+Array.from({length:5},(_,i)=>
  '<option value="'+(i+1)+'"'+(selectedSet===i+1?' selected':'')+'>'+(i+1)+'세트</option>').join('')+'</select></label>'+
  '<button type="button" data-ck129-start'+(loading?' disabled':'')+'>새 시험 시작</button>'+
  (s?'<button type="button" data-ck129-toggle>'+(expanded?'접기':s.status==='submitted'?'결과 보기':'시험 열기')+'</button>':'')+
  (state.history.length?'<button type="button" data-ck129-history>최근 '+state.history.length+'회</button>':'')+
  '<button type="button" data-ck129-backup>기록 JSON 백업</button>'+
  '<button type="button" data-ck129-import>백업 병합</button>'+
  '<input type="file" data-ck129-import-file accept=".json,application/json" hidden></div></div>'+
  '<p class="ck129-bank">공식 문항 '+Object.keys(bank()).length+'/800 · 선택 세트 '+(ready?'80문항 준비':'원문 확인 필요')+'</p>'+
  (issue?'<p class="ck129-warning" role="alert">'+esc(issue)+'</p>':'')+
  '<p class="ck129-message" role="status">'+esc(message)+'</p>'+
  '<div class="ck129-workspace" data-ck129-workspace tabindex="0"'+(expanded?'':' hidden')+'>'+
  (expanded?s?(s.status==='submitted'?resultPanel(s):questionPanel(s)):'<p>1~5세트에서 선택 후 시작하세요.</p>':'')+'</div>'+
  (showHistory?'<section class="ck129-history"><h4>혼합 실전 최근 10회</h4>'+
  state.history.map((h,i)=>{
   const outcome=grade(h);
   return '<div><strong>'+h.set+'세트 · '+new Date(h.submittedAt).toLocaleDateString('ko-KR')+'</strong>'+
    '<small>'+(outcome?'학개론 '+outcome.estate.toFixed(1)+' / 민법 '+outcome.civil.toFixed(1)+
     ' · 평균 '+outcome.average.toFixed(1)+' · 오답 '+outcome.wrong.length+' · 미응답 '+outcome.blank.length+' · '+(outcome.passed?'연습 기준 충족':'연습 기준 미달'):
     '공식 80문항 로딩 후 채점 결과 확인')+'</small>'+
    '<button type="button" data-ck129-detail="'+i+'">상세 보기</button></div>';
  }).join('')+
  (state.history[historyDetail]?resultPanel(state.history[historyDetail],'history:'+historyDetail):'')+'</section>':'');
 syncTimer();
}
function mount(){const found=document.getElementById('ck129-mixed-mocks');if(found){root=found;return;}
 const target=document.querySelector('#main .ck20-quiz-sets');if(!target)return;
 root=document.createElement('section');root.id='ck129-mixed-mocks';root.className='ck129-mixed-mocks';
 target.before(root);paint();try{document.dispatchEvent(new Event('ck:mixed-mounted'));}catch{}}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;mount();syncTimer();});}
document.addEventListener('click',e=>{
 const btn=e.target.closest?.('[data-ck129-start],[data-ck129-toggle],[data-ck129-history],[data-ck129-backup],[data-ck129-import],'+
 '[data-ck129-answer],[data-ck129-clear],[data-ck129-goto],[data-ck129-next],[data-ck129-prev],'+
 '[data-ck129-flag],[data-ck129-pause],[data-ck129-resume],[data-ck129-submit],'+
 '[data-ck129-collapse],[data-ck129-export],[data-ck129-detail],[data-ck130-filter],[data-ck130-review]');
 if(!btn||!root?.contains(btn))return;e.preventDefault();e.stopPropagation();
 if(btn.hasAttribute('data-ck129-start'))start();
 else if(btn.hasAttribute('data-ck129-toggle')){expanded=!expanded;paint();if(expanded)focus();}
 else if(btn.hasAttribute('data-ck129-history')){showHistory=!showHistory;historyDetail=-1;paint();}
 else if(btn.hasAttribute('data-ck129-backup'))backup();
 else if(btn.hasAttribute('data-ck129-import'))root?.querySelector('[data-ck129-import-file]')?.click();
 else if(btn.hasAttribute('data-ck129-answer'))answer(Number(btn.dataset.ck129Answer));
 else if(btn.hasAttribute('data-ck129-clear'))answer(null);
 else if(btn.hasAttribute('data-ck129-goto'))goto(Number(btn.dataset.ck129Goto));
 else if(btn.hasAttribute('data-ck129-prev'))goto((active()?.position??0)-1);
 else if(btn.hasAttribute('data-ck129-next'))goto((active()?.position??0)+1);
 else if(btn.hasAttribute('data-ck129-flag'))flag();
 else if(btn.hasAttribute('data-ck129-pause'))pause();
 else if(btn.hasAttribute('data-ck129-resume'))resume();
 else if(btn.hasAttribute('data-ck129-collapse')){expanded=false;paint();}
 else if(btn.hasAttribute('data-ck129-detail')){historyDetail=Number(btn.dataset.ck129Detail);paint();}
 else if(btn.hasAttribute('data-ck129-export'))download(btn.dataset.ck129Export);
 else if(btn.hasAttribute('data-ck130-filter')){
  const value=btn.dataset.ck130Filter;
  if(['all','wrong','blank','flagged'].includes(value)){
   resultFilter=value;paint();
   // The pressed filter button is recreated by paint(). Preserve keyboard focus.
   root?.querySelector('[data-ck130-filter="'+value+'"]')?.focus?.({preventScroll:true});
  }
 }else if(btn.hasAttribute('data-ck130-review')){
  const id=btn.dataset.ck130Review;
  if(!formId(id)||!validQuestion(id,bank()[id])){message='공식 문항을 먼저 읽어야 개인 근거 검토를 열 수 있습니다.';paint();return;}
  const [year,number]=id.split('-').map(Number),q=bank()[id];
  let opened=null;
  if(year>=2021&&typeof window.CK78Analysis?.open==='function')
   opened=window.CK78Analysis.open(year,number,btn);
  else if(typeof window.CK76Study?.openQuestion==='function')
   opened=window.CK76Study.openQuestion(year,number,q.subject);
  else {message='문항 검토 화면을 열지 못했습니다. 해당 연도의 공식 원문을 확인하세요.';paint();return;}
  if(opened&&typeof opened.catch==='function')opened.catch(error=>{
   message='개인 근거 검토 연결 오류: '+String(error?.message||error);paint();
  });
 }
 else if(btn.hasAttribute('data-ck129-submit')){
  const s=active();if(!s||s.status==='submitted')return;
  if(s.status==='running'&&remaining(s)===0){finish('time');return;}
  if(window.confirm?.('혼합 '+s.set+'세트 채점 제출? 미응답 '+s.answers.filter(x=>x===null).length+
  ' · 보류 '+s.flags.filter(Boolean).length+' · 제출 후 수정 불가'))finish('manual');
 }
});
document.addEventListener('change',e=>{
 if(!root?.contains(e.target)||!e.target.matches?.('[data-ck129-set]'))return;
 const set=Number(e.target.value);if(validSet(set)){selectedSet=set;message='';paint();}
});
document.addEventListener('change',e=>{
 if(!root?.contains(e.target)||!e.target.matches?.('[data-ck129-import-file]'))return;
 const input=e.target,file=input.files?.[0];
 importFile(file).finally(()=>{input.value='';});
});
document.addEventListener('keydown',e=>{
 if(!expanded||!root?.contains(e.target)||active()?.status!=='running'||
 e.altKey||e.ctrlKey||e.metaKey||e.isComposing||e.repeat||e.keyCode===229||
 /INPUT|TEXTAREA|SELECT/.test(e.target?.tagName||''))return;
 if(/^[1-5]$/.test(e.key)){e.preventDefault();e.stopImmediatePropagation();answer(Number(e.key));}
 else if(e.key==='ArrowLeft'||e.key==='ArrowRight'){
  e.preventDefault();e.stopImmediatePropagation();goto(active().position+(e.key==='ArrowRight'?1:-1));
 }
},true);
document.addEventListener('visibilitychange',()=>{if(!document.hidden){checkExpired();paint();}syncTimer();});
window.addEventListener('pageshow',()=>{checkExpired();paint();syncTimer();});
window.addEventListener('pagehide',()=>{if(clock!==null){clearInterval(clock);clock=null;}});
window.addEventListener('storage',e=>{if(e.key!==KEY)return;state=read();historyDetail=-1;
 // A detached/hidden tab cannot rely on paint() to stop its timer.
 syncTimer();
 message=issue||'다른 탭의 혼합 실전 기록을 불러왔습니다.';paint();});
window.addEventListener('ck:official-bank-ready',()=>{checkExpired();paint();});
window.addEventListener('ck:scene-activity',syncTimer);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});
else schedule();
const main=document.getElementById('main');
if(main&&window.MutationObserver)new MutationObserver(changes=>{
 if(!document.getElementById('ck129-mixed-mocks')&&changes.some(x=>x.addedNodes.length))schedule();
}).observe(main,{subtree:true,childList:true});
if(document.body&&window.MutationObserver)new MutationObserver(syncTimer).observe(
 document.body,{attributes:true,attributeFilter:['data-ck-v8-tab']});
checkExpired();
window.CK129MixedMock=Object.freeze({makeSet,validIds,matchesFixedPaper,validQuestion,checkSet,checkIds,
 sanitizeSession,cleanStore,grade,createAttempt,remaining,clockText,
 getState:()=>({active:active()?.status||'none',set:active()?.set||null,history:state.history.length,resultFilter,
  revision:state.revision,remainingMs:remaining(active()),issue,message,loading,expanded}),
 getAttempts:()=>state.history.map(s=>JSON.parse(JSON.stringify(s))),
 start,answer,goto,flag,pause,resume,finish,resultText,backup,mergeRestore,importFile,
 open:()=>{mount();expanded=true;checkExpired();paint();focus();}
});
})();