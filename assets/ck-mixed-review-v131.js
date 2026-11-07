/* ConceptKnot v131: personal, source-locked review of submitted mixed A-form papers.
 * Read-only over ck129 history; no changes to official answers, exam records or notes.
 */
(function(){
'use strict';
const KEY='ck129-mixed-sessions-v1',MAX_BYTES=500000,LIMIT=20;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const mixed=()=>window.CK129MixedMock;
const official=()=>window.RECALL_OFFICIAL||{};
const validId=id=>typeof id==='string'&&/^20(?:1[6-9]|2[0-5])-(?:[1-9]|[1-7]\d|80)$/.test(id);
let root=null,expanded=false,filter='all',selectedId='',guess=null,revealed=false;
let notice='',loading=false,scheduled=false;
function snapshot(){
 const api=mixed();
 if(!api||typeof api.cleanStore!=='function'||typeof api.getState!=='function')
  return {error:'혼합 실전 기록 모듈을 아직 읽을 수 없습니다.'};
 const status=api.getState();
 if(status.issue)return {error:'저장된 혼합 실전 기록에 오류가 있습니다. 먼저 원본 JSON을 백업하세요.'};
 try{
  const raw=localStorage.getItem(KEY);
  if(raw===null)return {raw:null,sessions:[],active:status.active,revision:0};
  if(raw.length>MAX_BYTES)return {error:'기록 용량이 허용 범위를 초과했습니다. 원본을 보존하세요.'};
  const data=api.cleanStore(JSON.parse(raw));
  if(!data||data.revision!==status.revision)
   return {error:'혼합 실전 기록이 다른 탭에서 변경됐거나 형식이 올바르지 않습니다. 최신 탭을 확인하세요.'};
  return {raw,sessions:data.history,active:data.active?.status||'none',revision:data.revision};
 }catch{return {error:'개인 저장소에 접근할 수 없어 복습 분석을 중단했습니다.'};}
}
function summarize(source,records=official()){
 if(!source||source.error)return {ready:false,error:source?.error||'기록을 읽을 수 없습니다.'};
 if(source.active==='running'||source.active==='paused')return {ready:false,error:'미제출 시험 진행 중에는 정답 복습 분석을 제공하지 않습니다.'};
 const api=mixed();
 if(!api||!Array.isArray(source.sessions)||source.sessions.length>10)
  return {ready:false,error:'지원하지 않는 제출 기록 형식입니다.'};
 const unique=new Map(),rows=new Map(),trend=[],subjects=[
  {name:'학개론',total:0,correct:0,wrong:0,blank:0,flagged:0},
  {name:'민법 및 민사특별법',total:0,correct:0,wrong:0,blank:0,flagged:0}
 ];
 for(const item of source.sessions){
  const s=api.sanitizeSession(item);
  if(!s||s.status!=='submitted')return {ready:false,error:'원본 세트/제출 기록이 유효하지 않습니다. 복습 채점을 하지 않습니다.'};
  const key=s.set+':'+s.startedAt+':'+s.submittedAt,signature=JSON.stringify(s);
  if(unique.has(key)){
   if(unique.get(key)!==signature)return {ready:false,error:'서로 다른 답안이 동일한 제출 회차로 기록되어 분석을 중단했습니다.'};
   continue;
  }
  unique.set(key,signature);
  const g=api.grade(s,records);
  if(!g)return {ready:false,needBank:true,error:'공식 A형 80문항과 인정 정답을 모두 확인한 뒤 약점을 계산합니다.'};
  trend.push({set:s.set,time:s.submittedAt,estate:g.estate,civil:g.civil,average:g.average,wrong:g.wrong.length,blank:g.blank.length});
  for(let i=0;i<80;i++){
   const id=s.ids[i],q=records[id],choice=s.answers[i],part=subjects[i<40?0:1];
   const blank=choice===null,correct=!blank&&q.correct.map(Number).includes(choice);
   const wrong=!blank&&!correct,flagged=s.flags[i];
   part.total++;part.correct+=Number(correct);part.wrong+=Number(wrong);
   part.blank+=Number(blank);part.flagged+=Number(flagged);
   let row=rows.get(id);
   if(!row){row={id,seen:0,wrong:0,blank:0,flagged:0,lastAt:0,subject:q.subject};rows.set(id,row);}
   row.seen++;row.wrong+=Number(wrong);row.blank+=Number(blank);
   row.flagged+=Number(flagged);row.lastAt=Math.max(row.lastAt,s.submittedAt);
  }
 }
 const queue=[...rows.values()].filter(r=>r.wrong||r.blank||r.flagged).map(r=>({
  ...r,priority:r.wrong*5+r.blank*3+r.flagged
 })).sort((a,b)=>b.priority-a.priority||b.lastAt-a.lastAt||a.id.localeCompare(b.id));
 trend.sort((a,b)=>a.time-b.time||a.set-b.set);
 return {ready:true,attempts:unique.size,queue,subjects,trend,distinct:rows.size,
  counts:{all:queue.length,wrong:queue.filter(x=>x.wrong).length,
   blank:queue.filter(x=>x.blank).length,flagged:queue.filter(x=>x.flagged).length}};
}
function filtered(report,kind=filter){
 if(!report?.ready)return [];
 const rows=report.queue.filter(r=>kind==='wrong'?r.wrong>0:kind==='blank'?r.blank>0:
  kind==='flagged'?r.flagged>0:true);
 return rows.slice(0,LIMIT);
}
function queueText(report,kind=filter,records=official()){
 if(!report?.ready)return '';
 const list=filtered(report,kind),labels={all:'전체',wrong:'오답',blank:'미응답',flagged:'보류'};
 const lines=[
  'ConceptKnot 개인 혼합 실전 약점 복습 대기열 · '+(labels[kind]||labels.all),
  '공식 A형 원문 재배열 시험에서 사용자가 제출한 기록만 집계. 공식 해설 감수/합격 예측 아님.',
  '제출 이력 '+report.attempts+'회 · 고유 문항 '+report.distinct+'개 · 해당 약점 '+report.counts[kind]+'개 · 최대 '+LIMIT+'개 표시',
  '우선순위 = 오답×5 + 미응답×3 + 보류×1. 동일 문항 재응시 기록은 회차별로 계산.',''
 ];
 for(let i=0;i<list.length;i++){
  const r=list[i],q=records[r.id];
  if(!q||!validId(r.id))return '';
  lines.push((i+1)+'. '+r.id+' · 오답 '+r.wrong+'회 · 미응답 '+r.blank+
   '회 · 보류 '+r.flagged+'회 · 출제 '+r.seen+'회',
   '공식 채점 인정: '+q.correct.map(Number).join('/')+' · 원문: '+q.originalUrl,'');
 }
 return lines.join('\n')+'\n';
}
function statBox(title,part){
 return '<div><small>'+title+'</small><strong>'+part.correct+'/'+part.total+'</strong>'+
  '<span>오답 '+part.wrong+' · 미응답 '+part.blank+' · 보류 '+part.flagged+'</span></div>';
}
function reviewPanel(){
 const src=snapshot();
 if(src.error)return '<p class="ck131-warning" role="alert">'+esc(src.error)+'</p>';
 if(src.active==='running'||src.active==='paused')
  return '<p class="ck131-note">진행 중인 혼합 실전이 있습니다. 정답 노출 방지를 위해 약점 복습은 제출 후에 열립니다.</p>';
 const report=summarize(src);
 if(!report.ready)
  return '<p role="status">'+esc(report.error)+'</p>'+
   (report.needBank?'<button type="button" data-ck131-load'+(loading?' disabled':'')+'>공식 10개년 원문 불러오기</button>':'');
 if(!report.attempts)return '<p class="ck131-note">혼합 실전 1회 이상 제출하면 개인 약점 대기열이 계산됩니다.</p>';
 const selected=filtered(report);
 if(!selected.some(r=>r.id===selectedId)){selectedId=selected[0]?.id||'';guess=null;revealed=false;}
 const current=selected.find(r=>r.id===selectedId);
 let card='';
 if(current){
  const q=official()[current.id],i=selected.indexOf(current);
  const answer=guess===null?'선택 없음':q.correct.map(Number).includes(guess)?'이번 선택은 채점 인정':'이번 선택은 채점 미인정';
  card='<article class="ck131-card" aria-label="약점 문항 다시 풀기"><div class="ck131-card-head">'+
   '<strong>'+(i+1)+'/'+selected.length+' · '+esc(current.id)+'</strong><span>오답 '+current.wrong+
   ' · 미응답 '+current.blank+' · 보류 '+current.flagged+'회</span></div>'+
   '<p class="ck131-stem">'+esc(q.question)+'</p><div class="ck131-choices" role="group" aria-label="복습 답안 선택">'+
   q.options.map((opt,k)=>'<button type="button" data-ck131-choice="'+(k+1)+'" aria-pressed="'+(guess===k+1)+'"'+
    (revealed?' disabled':'')+'><b>'+'①②③④⑤'[k]+'</b><span>'+esc(opt)+'</span></button>').join('')+'</div>'+
   (revealed?'<p class="ck131-feedback" role="status">'+esc(answer)+' · 공식 채점 인정 번호 '+
    esc(q.correct.map(Number).join('/'))+' (법령·선지별 해설 검수와 별개)</p>':
    '<p class="ck131-note">선지 선택 후 정답 확인을 누르세요. 이 복습 답은 시험 기록에 저장하지 않습니다.</p>')+
   '<div class="ck131-actions">'+
   '<button type="button" data-ck131-prev'+(i===0?' disabled':'')+'>이전</button>'+
   '<button type="button" data-ck131-next'+(i===selected.length-1?' disabled':'')+'>다음</button>'+
   (revealed?'<button type="button" data-ck131-reset>다시 풀기</button>':
    '<button type="button" data-ck131-reveal>채점 인정 번호 확인</button>')+
   '<button type="button" data-ck131-open="'+esc(current.id)+'">개인 근거·풀이</button>'+
   '<a href="'+esc(q.originalUrl)+'" target="_blank" rel="noopener noreferrer">공식 PDF 원문</a></div></article>';
 }
 const trend=report.trend.slice(-10).map((t,i)=>
  '<div><small>'+(i+1)+'회 · '+t.set+'세트</small>'+
  '<div class="ck131-trend-track" role="img" aria-label="평균 '+t.average.toFixed(1)+'점">'+
  '<span style="width:'+Math.max(0,Math.min(100,t.average))+'%"></span></div>'+
  '<b>'+t.average.toFixed(1)+'점</b></div>').join('');
 return '<div class="ck131-stats" aria-label="제출 회차별 문항 집계">'+
  statBox('학개론',report.subjects[0])+statBox('민법',report.subjects[1])+
  '<div><small>약점 고유 문항</small><strong>'+report.queue.length+'개</strong>'+
  '<span>제출 '+report.attempts+'회 · 최대 10회 보관</span></div></div>'+
  '<details class="ck131-trend"><summary>실전 평균 점수 흐름 보기 ('+report.trend.length+'회)</summary>'+
   '<div>'+trend+'</div><p>제출 회차의 채점 인정 정답 기준. 미래 성적 예측이 아닙니다.</p></details>'+
  '<div class="ck131-filter" role="group" aria-label="약점 유형 필터">'+
  [['all','전체',report.counts.all],['wrong','오답',report.counts.wrong],['blank','미응답',report.counts.blank],
   ['flagged','보류',report.counts.flagged]].map(([key,name,count])=>
   '<button type="button" data-ck131-filter="'+key+'" aria-pressed="'+(filter===key)+'">'+name+' '+count+'</button>').join('')+'</div>'+
  '<p class="ck131-note">우선순위: 오답×5 · 미응답×3 · 보류×1. 최대 20개를 정렬합니다. 같은 문항을 여러 회차에 제출한 횟수도 반영합니다.</p>'+
  '<div class="ck131-queue" aria-label="약점 복습 문항 목록">'+
   (selected.length?selected.map(r=>
    '<button type="button" data-ck131-pick="'+esc(r.id)+'" aria-pressed="'+(selectedId===r.id)+'">'+esc(r.id)+
    ' <small>오답 '+r.wrong+' · 미응답 '+r.blank+' · 보류 '+r.flagged+'</small></button>').join(''):
    '<p role="status">이 유형의 약점 문항이 없습니다.</p>')+'</div>'+card+
  '<div class="ck131-actions"><button type="button" data-ck131-export'+(selected.length?'':' disabled')+
   '>현재 복습 대기열 TXT</button><small>내 기록을 수정하지 않습니다. 다운로드된 파일을 직접 확인하세요.</small></div>';
}
function paint(){
 if(!root?.isConnected)return;
 const src=snapshot(),count=src.error?'기록 확인 필요':src.sessions.length+'회 제출';
 root.innerHTML='<div class="ck131-heading"><div><strong>개인 약점 분석 · 다시 풀기</strong>'+
  '<p>혼합 5세트 제출 기록 · '+esc(count)+' · 개인 학습용, 공식 해설 검수 아님</p></div>'+
  '<button type="button" data-ck131-toggle aria-expanded="'+expanded+'">'+(expanded?'복습 접기':'복습 열기')+'</button></div>'+
  (notice?'<p class="ck131-notice" role="status">'+esc(notice)+'</p>':'')+
  (expanded?'<div class="ck131-body">'+reviewPanel()+'</div>':'');
}
function openItem(id,trigger){
 const src=snapshot(),report=summarize(src),rows=filtered(report);
 if(!rows.some(r=>r.id===id)||!validId(id)){notice='현재 복습 대기열의 문항만 열 수 있습니다.';paint();return false;}
 const q=official()[id];
 if(!q||!mixed().validQuestion(id,q)){notice='원문 확인이 필요한 문항입니다.';paint();return false;}
 const [year,number]=id.split('-').map(Number);
 try{
  let response;
  if(year>=2021&&typeof window.CK78Analysis?.open==='function')
   response=window.CK78Analysis.open(year,number,trigger);
  else if(typeof window.CK76Study?.openQuestion==='function')
   response=window.CK76Study.openQuestion(year,number,q.subject);
  else {notice='해당 연도의 개인 근거 화면을 찾지 못했습니다.';paint();return false;}
  if(response===false){notice='개인 근거 화면을 열지 못했습니다.';paint();return false;}
  if(response?.catch)response.catch(e=>{notice='검토 화면 오류: '+String(e?.message||e);paint();});
  return true;
 }catch(e){notice='검토 화면 오류: '+String(e?.message||e);paint();return false;}
}
function download(){
 const src=snapshot(),report=summarize(src);
 if(!report.ready||!report.attempts){notice=report.error||'분석 기록이 없습니다.';paint();return false;}
 const text=queueText(report);
 if(!text){notice='대기열 원문 확인이 부족해 내보내지 않았습니다.';paint();return false;}
 try{
  if(localStorage.getItem(KEY)!==src.raw){notice='다른 탭에서 기록이 변경되어 TXT 생성을 중단했습니다.';paint();return false;}
  const file=new Blob(['\uFEFF',text],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(file);
  const a=document.createElement('a');a.href=url;a.download='ConceptKnot_혼합약점복습_'+new Date().toISOString().slice(0,10)+'.txt';
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
  notice='TXT 다운로드를 요청했습니다. 실제 저장된 파일을 확인하세요.';paint();return true;
 }catch{notice='TXT 다운로드 실패. 원본 시험 기록은 변경되지 않았습니다.';paint();return false;}
}
function move(step){
 const list=filtered(summarize(snapshot())),index=list.findIndex(x=>x.id===selectedId);
 if(index<0||index+step<0||index+step>=list.length)return;
 selectedId=list[index+step].id;guess=null;revealed=false;paint();
 root?.querySelector('[data-ck131-prev],[data-ck131-next]')?.focus?.({preventScroll:true});
}
function loadBank(){
 if(loading)return false;
 const loader=window.CK89OfficialBank?.loadAll;
 if(typeof loader!=='function'){notice='공식 10개년 원문 로더가 준비되지 않았습니다.';paint();return false;}
 loading=true;notice='공식 원문을 불러오는 중입니다.';paint();
 Promise.resolve().then(()=>loader()).then(()=>{notice='공식 문항 로드가 끝났습니다. 복습 데이터를 다시 확인합니다.';},
  e=>{notice='공식 원문 로드 실패: '+String(e?.message||e);}).finally(()=>{loading=false;paint();});
 return true;
}
function mount(){
 if(root?.isConnected)return true;
 const host=document.getElementById('ck129-mixed-mocks');
 if(!host||!host.parentElement)return false;
 root=document.createElement('section');root.id='ck131-mixed-review';root.className='ck131-mixed-review';
 host.insertAdjacentElement('afterend',root);paint();return true;
}
function schedule(){
 if(scheduled)return;scheduled=true;
 requestAnimationFrame(()=>{scheduled=false;mount();});
}
document.addEventListener('click',e=>{
 const button=e.target.closest?.('[data-ck131-toggle],[data-ck131-load],[data-ck131-filter],'+
  '[data-ck131-pick],[data-ck131-choice],[data-ck131-reveal],[data-ck131-reset],'+
  '[data-ck131-prev],[data-ck131-next],[data-ck131-open],[data-ck131-export]');
 if(!button||!root?.contains(button))return;
 e.preventDefault();e.stopPropagation();
 if(button.hasAttribute('data-ck131-toggle')){expanded=!expanded;notice='';paint();}
 else if(button.hasAttribute('data-ck131-load'))loadBank();
 else if(button.hasAttribute('data-ck131-filter')){
  const kind=button.dataset.ck131Filter;
  if(['all','wrong','blank','flagged'].includes(kind)){
   filter=kind;selectedId='';guess=null;revealed=false;paint();
   root?.querySelector('[data-ck131-filter="'+kind+'"]')?.focus?.({preventScroll:true});
  }
 }else if(button.hasAttribute('data-ck131-pick')){
  selectedId=button.dataset.ck131Pick;guess=null;revealed=false;paint();
  root?.querySelector('[data-ck131-pick="'+selectedId+'"]')?.focus?.({preventScroll:true});
 }else if(button.hasAttribute('data-ck131-choice')){
  if(revealed)return;
  const n=Number(button.dataset.ck131Choice);
  if(Number.isInteger(n)&&n>=1&&n<=5){
   guess=n;paint();root?.querySelector('[data-ck131-choice="'+n+'"]')?.focus?.({preventScroll:true});
  }
 }else if(button.hasAttribute('data-ck131-reveal')){revealed=true;paint();}
 else if(button.hasAttribute('data-ck131-reset')){guess=null;revealed=false;paint();}
 else if(button.hasAttribute('data-ck131-next'))move(1);
 else if(button.hasAttribute('data-ck131-prev'))move(-1);
 else if(button.hasAttribute('data-ck131-open'))openItem(button.dataset.ck131Open,button);
 else if(button.hasAttribute('data-ck131-export'))download();
});
document.addEventListener('ck:mixed-mounted',schedule);
document.addEventListener('ck:mixed-exam-submitted',()=>{expanded=true;filter='all';selectedId='';guess=null;revealed=false;paint();});
window.addEventListener('storage',e=>{if(e.key!==KEY)return;selectedId='';guess=null;revealed=false;paint();});
window.addEventListener('ck:official-bank-ready',paint);
window.addEventListener('pageshow',()=>{schedule();paint();});
window.addEventListener('ck:scene-activity',schedule);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});
else schedule();
window.CK131MixedReview=Object.freeze({snapshot,summarize,filtered,queueText,getState:()=>({
 expanded,filter,selectedId,guess,revealed,notice,loading}),mount,open:()=>{mount();expanded=true;paint();}});
})();