/* ConceptKnot v31 — stable-position typing with optional Enter/Space,
   answer-only jump, and reversible board docking/collapse.
   This file never re-renders the whole stage when changing board placement. */
(function(){
'use strict';
const goodChar=/^[\p{L}\p{M}\p{Nd}]$/u;
const isEditor=el=>!!el?.closest?.('.ck-v7-input .chalk-editor textarea');
const rawChars=value=>Array.from(String(value??'').normalize('NFC'));
function clean(value){
 return rawChars(value).filter(ch=>goodChar.test(ch)||/\s/u.test(ch)).join('')
  .replace(/[ \t]{2,}/g,' ').replace(/\n{3,}/g,'\n\n');
}
function options(){return {enter:state.ck31EnterRequired!==false,space:state.ck31SpaceRequired!==false};}
function optional(ch,opts){return ch===' '? !opts.space : ch==='\n'? !opts.enter : false;}
function determineAnswerAt(chars){
 for(let i=0;i<chars.length-1;i++)if(chars[i]==='\n'&&chars[i+1]==='\n')return i+2;
 return -1;
}
function mapText(source,record={},settings=options()){
 const target=rawChars(clean(source)),typed=rawChars(clean(record.text));
 const answerAt=determineAnswerAt(target);
 const answerOnly=record.ck31AnswerOnly===true&&answerAt>=0;
 const jump=answerOnly?Math.max(0,Math.min(typed.length,Number(record.ck31JumpAt)||0)):-1;
 let pointer=0,hits=0,over=0;
 const mapped=new Map();
 for(let i=0;i<typed.length;i++){
  if(answerOnly&&i===jump)pointer=answerAt;
  while(pointer<target.length&&optional(target[pointer],settings))pointer++;
  if(pointer>=target.length){over++;continue;}
  const ok=typed[i]===target[pointer];
  mapped.set(pointer,{typed:typed[i],ok});
  if(ok)hits++;
  pointer++;
 }
 if(answerOnly&&jump===typed.length)pointer=answerAt;
 while(pointer<target.length&&optional(target[pointer],settings))pointer++;
 const start=answerOnly?answerAt:0;
 const req=target.map((ch,i)=>i).filter(i=>i>=start&&!optional(target[i],settings));
 const matched=req.filter(i=>mapped.get(i)?.ok).length;
 const relevantTyped=typed.length-(answerOnly?jump:0);
 const extraForMode=[...mapped.keys()].filter(i=>i>=start).length;
 return {
  target,typed,mapped,answerAt,answerOnly,jump,pointer,
  required:req.length,matched,entered:extraForMode,
  hit:hits,accuracy:typed.length?Math.round(hits/typed.length*100):100,
  done:req.length>0&&matched===req.length&&relevantTyped===req.length&&over===0,
  over
 };
}
const oldStats=typingStats;
typingStats=function(input,target,started){
 if(state.view!=='typing')return oldStats(input,target,started);
 const id=typingConcept().id,r=chalkRecord('practice',id);
 const m=mapText(target,{...r,text:input});
 const elapsed=started?Math.max(1,((r.pausedAt||Date.now())-started-(r.pausedTotal||0))/1000):0;
 return {hit:m.hit,seconds:started?Math.round(elapsed):0,
  cpm:elapsed?Math.round(m.typed.length*60/elapsed):0,accuracy:m.accuracy};
};
typingGhost=function(el){
 const c=typingConcept(),r=chalkRecord('practice',c.id);
 const mirror=el.querySelector('.chalk-mirror'),area=el.querySelector('textarea');
 if(!mirror||!area)return;
 if(!c.fact){mirror.innerHTML='<span class="chalk-placeholder">연습할 공식 문항이 없습니다.</span>';area.disabled=true;return;}
 const m=mapText(c.fact,r),target=m.target;
 // Invariant: the glyph sequence/line breaks are independent of typed text.
 // Only their semantic classes change, so the background does not shift.
 mirror.classList.add('ck-v3-line-active','ck31-fixed-underlay');
 mirror.innerHTML=target.map((ch,i)=>{
  if(ch==='\n')return '\n';
  const match=m.mapped.get(i),skipped=m.answerOnly&&i<m.answerAt&&!match;
  const cls=match?(match.ok?'ck-v3-right':'ck-v3-wrong'):
    skipped?'ck31-skipped':optional(ch,options())?'ck31-optional':'ck-v3-pending';
  return '<span class="ck-v3-unit '+cls+'" data-ck31-index="'+i+'">'+
    esc(ch)+'</span>';
 }).join('')+'<span class="ck-v3-caret" aria-hidden="true"></span>';
 const index=Math.min(m.pointer,Math.max(0,target.length-1));
 let cursor=mirror.querySelector('[data-ck31-index="'+index+'"]');
 if(!cursor)cursor=mirror.querySelector('[data-ck31-index="'+Math.max(0,index-1)+'"]');
 if(cursor&&cursor.getBoundingClientRect){
  const rect=cursor.getBoundingClientRect(),base=mirror.getBoundingClientRect();
  mirror.style.setProperty('--ck-v3-caret-x',Math.max(0,rect.left-base.left).toFixed(1)+'px');
  mirror.style.setProperty('--ck-v3-caret-y',Math.max(0,rect.top-base.top).toFixed(1)+'px');
  mirror.style.setProperty('--ck-v3-caret-height',Math.max(16,rect.height||24).toFixed(1)+'px');
  mirror.style.setProperty('--ck-v3-line-top',Math.max(0,rect.top-base.top).toFixed(1)+'px');
  mirror.style.setProperty('--ck-v3-line-height',Math.max(16,rect.height||24).toFixed(1)+'px');
 }
 const height=Math.max(165,mirror.scrollHeight+18);
 el.style.setProperty('min-height',height+'px','important');
 area.style.height=Math.max(120,height-32)+'px';
};
function currentCompletion(){
 const doneIds=new Set((Array.isArray(state.typingHistory)?state.typingHistory:[])
  .filter(x=>x?.subject===state.subject&&!String(x.id).startsWith('answer-only:')).map(x=>x.id));
 let done=0,items=typingItems();
 for(const item of items)if(doneIds.has(item.id)||chalkState().practice[item.id]?.recorded)done++;
 return {done,total:items.length,percentage:items.length?Math.round(done/items.length*100):0};
}
typingFeedback=function(){
 const el=document.getElementById('typing-feedback');
 if(!el||state.view!=='typing')return;
 const c=typingConcept(),r=chalkRecord('practice',c.id),m=mapText(c.fact,r);
 const stats=typingStats(r.text,c.fact,r.started);
 if(!c.fact){el.textContent='문항 원문을 선택하세요.';return;}
 r.entered=m.typed.length;r.errors=m.typed.length-m.hit;r.committed=r.text;
 const mode=m.answerOnly?' · 정답만 타이핑':'';
 el.textContent=m.done?'✓ '+(m.answerOnly?'정답 문장':'문제·정답')+' 입력 완료 · 기록 저장':
  (m.answerOnly?'정답 부분 입력 중 · ':'')+m.matched+' / '+m.required+mode;
 if(m.done){
  const flag=m.answerOnly?'ck31AnswerRecorded':'recorded';
  if(!r[flag]){
   r[flag]=true;r.finalStats={...stats};
   state.typingHistory=Array.isArray(state.typingHistory)?state.typingHistory:[];
   state.typingHistory.push({id:m.answerOnly?'answer-only:'+c.id:c.id,
    label:c.t+(m.answerOnly?' · 정답만':''),mode:m.answerOnly?'answer-only':'full',
    subject:state.subject,at:Date.now(),...stats});
   state.typingHistory=state.typingHistory.slice(-200);
   save();
   const history=document.getElementById('typing-history-list');
   if(history)history.innerHTML=typingHistoryHtml();
  }
 }
 const values={
  'ck-v7-stat-time':clock(stats.seconds),
  'ck-v7-stat-cpm':String(stats.cpm),
  'ck-v7-stat-accuracy':stats.accuracy+'%',
  'ck-v7-stat-count':m.matched+'/'+m.required,
  'ck-v7-typed-count':String(m.matched)
 };
 for(const [id,value]of Object.entries(values)){
  const node=document.getElementById(id);if(node&&node.textContent!==value)node.textContent=value;
 }
 const progress=document.getElementById('ck-v3-progress-fill');
 if(progress)progress.style.setProperty('--ck-v3-progress',Math.min(100,m.required?m.matched/m.required*100:0).toFixed(2)+'%');
 const completion=currentCompletion(),label=document.getElementById('ck-v3-completion-text'),dots=document.getElementById('ck-v3-completion-dots');
 if(label)label.textContent=completion.done+'/'+completion.total;
 if(dots){dots.setAttribute('aria-label',completion.percentage+'% 완료');
  const n=Math.round(18*completion.percentage/100);
  Array.from(dots.children).forEach((dot,i)=>dot.className=i<n?'ck-v3-done':'ck-v3-pending');}
};
function updateKeys(){
 for(const btn of document.querySelectorAll('[data-ck31-typekey]')){
  const on=btn.dataset.ck31Typekey==='enter'?state.ck31EnterRequired!==false:state.ck31SpaceRequired!==false;
  btn.setAttribute('aria-pressed',String(on));
 }
}
function updateDock(stage){
 if(!stage)return;
 stage.classList.toggle('ck31-board-bottom',state.ck31BoardBottom===true);
 stage.classList.toggle('ck32-board-top',state.ck32BoardTop===true);
 stage.classList.toggle('ck31-board-collapsed',state.ck31BoardCollapsed===true);
 const b=stage.querySelector('[data-ck31-board-bottom]'),c=stage.querySelector('[data-ck31-board-collapse]');
 if(b)b.setAttribute('aria-pressed',String(state.ck31BoardBottom===true));
 const drag=stage.querySelector('[data-ck-v7-resize]');
 if(drag)drag.setAttribute('aria-disabled',String(state.ck31BoardBottom===true||state.ck31BoardCollapsed===true));
 if(c){c.setAttribute('aria-pressed',String(state.ck31BoardCollapsed===true));
  c.setAttribute('aria-label',state.ck31BoardCollapsed?'칠판 펼치기':'칠판 접어두기');
  c.title=state.ck31BoardCollapsed?'칠판 펼치기':'칠판 접어두기';}
}
document.addEventListener('click',e=>{
 const key=e.target.closest?.('[data-ck31-typekey]');
 if(key){
  e.preventDefault();e.stopImmediatePropagation();
  if(key.dataset.ck31Typekey==='enter')state.ck31EnterRequired=!(state.ck31EnterRequired!==false);
  else if(key.dataset.ck31Typekey==='space')state.ck31SpaceRequired=!(state.ck31SpaceRequired!==false);
  updateKeys();save();
  const el=document.querySelector('.ck-v7-input .chalk-editor');
  if(el){typingGhost(el);typingFeedback();}
  el?.querySelector('textarea')?.focus({preventScroll:true});
  return;
 }
 const control=e.target.closest?.('[data-ck31-board-bottom],[data-ck31-board-collapse],[data-ck32-board-top]');
 if(!control)return;
 e.preventDefault();e.stopImmediatePropagation();
 const stage=control.closest('.ck-v7-stage');
 if(!stage)return;
 stage.querySelector('.ck-v7-board')?.__ckV7Finish?.();
 if(control.hasAttribute('data-ck31-board-bottom')){state.ck31BoardBottom=!state.ck31BoardBottom;state.ck32BoardTop=false;state.ck31BoardCollapsed=false;}
 else if(control.hasAttribute('data-ck32-board-top')){state.ck32BoardTop=!state.ck32BoardTop;state.ck31BoardBottom=false;state.ck31BoardCollapsed=false;}
 else state.ck31BoardCollapsed=!state.ck31BoardCollapsed;
 const top=stage.querySelector('[data-ck32-board-top]');
 if(top)top.setAttribute('aria-pressed',String(state.ck32BoardTop===true));
 updateDock(stage);save();
},true);
document.addEventListener('keydown',e=>{
 if(state.view!=='typing'||e.isComposing||e.keyCode===229||e.ctrlKey||e.altKey||e.metaKey||e.shiftKey)return;
 const area=e.target;
 if(!isEditor(area)||area.tagName!=='TEXTAREA')return;
 if(e.key===' '&&!options().space){
  e.preventDefault();e.stopImmediatePropagation();return;
 }
 if(e.key!=='Enter')return;
 if(!options().enter){
  e.preventDefault();e.stopImmediatePropagation();return;
 }
 const c=typingConcept(),r=chalkRecord('practice',c.id);
 const m=mapText(c.fact,r),sep=m.answerAt;
 if(sep<0||m.answerOnly||area.selectionStart!==area.selectionEnd||area.selectionStart!==area.value.length)return;
 // One Enter at the end of a completed question enters the answer paragraph.
 // If the question is unfinished, keep typed text and jump to the answer
 // without falsely marking the skipped question as fully typed.
 const questionEnd=sep-2;
 const qNeeded=m.target.map((ch,i)=>i).filter(i=>i<questionEnd&&!optional(m.target[i],options()));
 const finishedQuestion=qNeeded.length>0&&qNeeded.every(i=>m.mapped.get(i)?.ok)&&m.pointer>=questionEnd;
 e.preventDefault();e.stopImmediatePropagation();
 if(finishedQuestion){
  area.value+= '\n\n';
  area.dispatchEvent(new Event('input',{bubbles:true}));
 }else{
  r.ck31AnswerOnly=true;
  r.ck31JumpAt=m.typed.length;
  r.ck31AnswerRecorded=false;
  if(!r.started)r.started=Date.now();
  typingGhost(area.closest('.chalk-editor'));
  typingFeedback();
  save();
 }
},true);
// Keep keyboard control states and fixed original glyphs on every mount.
// No MutationObserver or background animation loop is introduced.
window.CK31Typing=Object.freeze({
 clean,mapText,answerAt:source=>determineAnswerAt(rawChars(clean(source))),
 options:()=>({...options()})
});
})();
