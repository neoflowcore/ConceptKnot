/* ConceptKnot v61: native editing by default; letters-only mode never requires Enter or Space.
   Embedded in the study engine scope so the existing learning records remain intact. */
(function(){
'use strict';
const printable=/^[\p{L}\p{M}\p{Nd}]$/u;
const normalized=value=>String(value??'').replace(/\r\n?/g,'\n').normalize('NFC');
const chars=value=>Array.from(normalized(value));
const letters=value=>chars(value).filter(ch=>printable.test(ch));
const currentMode=()=>state.ckTypingInputMode==='letters'?'letters':'normal';
function mapText(source,record={},settings={}){
 const mode=settings.mode==='letters'||settings.mode==='normal'?settings.mode:currentMode();
 const target=chars(source),typed=mode==='letters'?letters(record.text):chars(record.text);
 const positions=[];
 target.forEach((ch,i)=>{if(mode==='normal'||printable.test(ch))positions.push(i);});
 const mapped=new Map();
 let matched=0;
 typed.forEach((ch,i)=>{
  if(i>=positions.length)return;
  const at=positions[i],ok=ch===target[at];
  mapped.set(at,{typed:ch,ok});
  if(ok)matched++;
 });
 const over=Math.max(0,typed.length-positions.length);
 return {mode,target,typed,positions,mapped,required:positions.length,matched,
  entered:typed.length,over,hit:matched,
  accuracy:typed.length?Math.round(matched/typed.length*100):100,
  done:positions.length>0&&matched===positions.length&&typed.length===positions.length,
  pointer:positions[Math.min(typed.length,positions.length)]??target.length};
}
// Keep independent drafts for each mode. Switching cannot erase a previously typed paragraph.
const draftFields=['text','colors','started','recorded','finalStats','entered','errors','committed','pausedAt','pausedTotal'];
const initialDraft=()=>({text:'',colors:[],started:0,recorded:false,finalStats:null,
 entered:0,errors:0,committed:'',pausedAt:0,pausedTotal:0});
function snapshot(r){
 const d={};
 for(const name of draftFields)d[name]=name==='colors'?Array.isArray(r.colors)?r.colors.slice():[]:r[name];
 return d;
}
function syncDraft(r){
 const wanted=currentMode(),active=r.ckTypingActiveMode||'normal';
 if(active===wanted){r.ckTypingActiveMode=wanted;return r;}
 const drafts=r.ckTypingDrafts&&typeof r.ckTypingDrafts==='object'?r.ckTypingDrafts:{};
 drafts[active]=snapshot(r);
 const next={...initialDraft(),...(drafts[wanted]||{})};
 for(const name of draftFields)r[name]=name==='colors'?Array.isArray(next.colors)?next.colors.slice():[]:next[name];
 r.ckTypingDrafts=drafts;r.ckTypingActiveMode=wanted;
 return r;
}
const oldRecord=chalkRecord;
chalkRecord=function(kind,key){
 const r=oldRecord(kind,key);
 return kind==='practice'&&state.view==='typing'?syncDraft(r):r;
};
const oldStats=typingStats;
typingStats=function(input,target,started){
 if(state.view!=='typing')return oldStats(input,target,started);
 const r=chalkRecord('practice',typingConcept().id),m=mapText(target,{text:input});
 const rawEnd=r.pausedAt||Date.now();
 const elapsed=started?Math.max(1,(rawEnd-started-(r.pausedTotal||0))/1000):0;
 return {hit:m.matched,seconds:started?Math.round(elapsed):0,
  cpm:elapsed?Math.round(m.entered*60/elapsed):0,accuracy:m.accuracy};
};
function cursorForLetters(m,mirror,area){
 const at=typeof area.selectionStart==='number'?area.selectionStart:area.value.length;
 const position=letters(area.value.slice(0,at)).length;
 const index=m.positions[position]??m.positions[m.positions.length-1];
 if(index===undefined)return;
 const node=mirror.querySelector('[data-ck61-index="'+index+'"]');
 if(!node?.getBoundingClientRect)return;
 const rect=node.getBoundingClientRect(),base=mirror.getBoundingClientRect();
 const after=position>=m.positions.length;
 const x=Math.max(0,(after?rect.right:rect.left)-base.left);
 const y=Math.max(0,rect.top-base.top),height=Math.max(16,rect.height||24);
 mirror.style.setProperty('--ck-v3-caret-x',x.toFixed(1)+'px');
 mirror.style.setProperty('--ck-v3-caret-y',y.toFixed(1)+'px');
 mirror.style.setProperty('--ck-v3-caret-height',height.toFixed(1)+'px');
 mirror.style.setProperty('--ck-v3-line-top',y.toFixed(1)+'px');
 mirror.style.setProperty('--ck-v3-line-height',height.toFixed(1)+'px');
}
typingGhost=function(el){
 const c=typingConcept(),r=chalkRecord('practice',c.id);
 const mirror=el?.querySelector('.chalk-mirror'),area=el?.querySelector('textarea');
 if(!mirror||!area)return;
 if(!c.fact){mirror.innerHTML='<span class="chalk-placeholder">연습할 공식 문항이 없습니다.</span>';area.disabled=true;return;}
 const m=mapText(c.fact,r);
 el.classList.toggle('ck61-normal-editor',m.mode==='normal');
 el.classList.toggle('ck61-letters-editor',m.mode==='letters');
 mirror.classList.add('ck31-fixed-underlay');
 mirror.classList.toggle('ck61-normal',m.mode==='normal');
 mirror.classList.toggle('ck61-letters',m.mode==='letters');
 mirror.classList.toggle('ck-v3-line-active',m.mode==='letters');
 if(m.mode==='normal'){
  // The guide has its own layout; input ink does not change its glyph positions.
  const guide='<span class="ck61-guide">'+esc(m.target.join(''))+'</span>';
  const ink=m.typed.map((ch,i)=>{
   if(ch==='\n')return '\n';
   const matched=m.mapped.get(i)?.ok;
   return '<span class="ck61-typed-unit '+(matched?'ck61-correct':'ck61-incorrect')+'">'+esc(ch)+'</span>';
  }).join('');
  mirror.innerHTML=guide+'<span class="ck61-ink-layer">'+ink+'</span>';
 }else{
  mirror.innerHTML=m.target.map((ch,i)=>{
   if(ch==='\n')return '\n';
   const match=m.mapped.get(i),status=match?(match.ok?'ck-v3-right':'ck-v3-wrong'):
    printable.test(ch)?'ck-v3-pending':'ck31-optional';
   return '<span class="ck-v3-unit '+status+' ck61-cell" data-ck61-index="'+i+'">'+
    '<span class="ck61-guide-glyph">'+esc(ch)+'</span>'+
    (match?'<span class="ck61-overwrite">'+esc(match.typed)+'</span>':'')+'</span>';
  }).join('')+'<span class="ck-v3-caret" aria-hidden="true"></span>';
  cursorForLetters(m,mirror,area);
 }
 const inkLayer=mirror.querySelector('.ck61-ink-layer');
 const height=Math.max(165,mirror.scrollHeight,inkLayer?.scrollHeight||0)+18;
 el.style.setProperty('min-height',height+'px','important');
 area.style.height=Math.max(120,height-32)+'px';
};
function completion(){
 const finished=new Set((Array.isArray(state.typingHistory)?state.typingHistory:[])
  .filter(x=>x?.subject===state.subject).map(x=>x.id));
 const items=typingItems(),stored=chalkState().practice;
 let done=0;
 for(const item of items){
  const r=stored[item.id];
  if(finished.has(item.id)||finished.has('letters:'+item.id)||
     r?.recorded||r?.ckTypingDrafts?.normal?.recorded||r?.ckTypingDrafts?.letters?.recorded)done++;
 }
 return {done,total:items.length,percentage:items.length?Math.round(done/items.length*100):0};
}
typingFeedback=function(){
 if(state.view!=='typing')return;
 const el=document.getElementById('typing-feedback');
 if(!el)return;
 const c=typingConcept(),r=chalkRecord('practice',c.id),m=mapText(c.fact,r);
 if(!c.fact){el.textContent='문항 원문을 선택하세요.';return;}
 const s=typingStats(r.text,c.fact,r.started);
 r.entered=m.entered;r.errors=m.entered-m.matched;r.committed=r.text;
 const kind=m.mode==='letters'?'문자만':'일반 입력';
 el.textContent=m.done?'✓ '+kind+' 완료 · 기록 저장':
  m.matched+' / '+m.required+(m.mode==='letters'?' · 공백·줄바꿈 자동 건너뛰기':' · Enter·Space 자유 입력');
 if(m.done&&!r.recorded){
  r.recorded=true;r.finalStats={...s};
  state.typingHistory=Array.isArray(state.typingHistory)?state.typingHistory:[];
  state.typingHistory.push({id:m.mode==='letters'?'letters:'+c.id:c.id,
   label:c.t+(m.mode==='letters'?' · 문자만':''),mode:m.mode,
   subject:state.subject,at:Date.now(),...s});
  state.typingHistory=state.typingHistory.slice(-200);
  save();
  const list=document.getElementById('typing-history-list');
  if(list)list.innerHTML=typingHistoryHtml();
 }
 const values={'ck-v7-stat-time':clock(s.seconds),
  'ck-v7-stat-cpm':String(s.cpm),'ck-v7-stat-accuracy':s.accuracy+'%',
  'ck-v7-stat-count':m.matched+'/'+m.required,'ck-v7-typed-count':String(m.matched)};
 for(const [id,value]of Object.entries(values)){
  const node=document.getElementById(id);if(node&&node.textContent!==value)node.textContent=value;
 }
 const fill=document.getElementById('ck-v3-progress-fill');
 if(fill)fill.style.setProperty('--ck-v3-progress',(m.required?Math.min(100,100*m.matched/m.required):0).toFixed(2)+'%');
 const p=completion(),label=document.getElementById('ck-v3-completion-text'),dots=document.getElementById('ck-v3-completion-dots');
 if(label)label.textContent=p.done+'/'+p.total;
 if(dots){
  dots.setAttribute('aria-label',p.percentage+'% 완료');
  const n=Math.round(18*p.percentage/100);
  Array.from(dots.children).forEach((dot,i)=>dot.className=i<n?'ck-v3-done':'ck-v3-pending');
 }
};
function updateModeButtons(){
 for(const button of document.querySelectorAll('[data-ck-typing-mode]'))
  button.setAttribute('aria-pressed',String(button.dataset.ckTypingMode===currentMode()));
}
function updateDock(stage){
 if(!stage)return;
 stage.classList.toggle('ck31-board-bottom',state.ck31BoardBottom===true);
 stage.classList.toggle('ck32-board-top',state.ck32BoardTop===true);
 stage.classList.toggle('ck31-board-collapsed',state.ck31BoardCollapsed===true);
 const bottom=stage.querySelector('[data-ck31-board-bottom]'),collapse=stage.querySelector('[data-ck31-board-collapse]');
 if(bottom)bottom.setAttribute('aria-pressed',String(state.ck31BoardBottom===true));
 const drag=stage.querySelector('[data-ck-v7-resize]');
 if(drag)drag.setAttribute('aria-disabled',String(state.ck31BoardBottom===true||state.ck31BoardCollapsed===true));
 if(collapse){
  collapse.setAttribute('aria-pressed',String(state.ck31BoardCollapsed===true));
  collapse.setAttribute('aria-label',state.ck31BoardCollapsed?'칠판 펼치기':'칠판 접어두기');
  collapse.title=state.ck31BoardCollapsed?'칠판 펼치기':'칠판 접어두기';
 }
}
document.addEventListener('click',e=>{
 const key=e.target.closest?.('[data-ck-typing-mode]');
 if(key){
  e.preventDefault();e.stopImmediatePropagation();
  const requested=key.dataset.ckTypingMode;
  if(requested!=='normal'&&requested!=='letters')return;
  const source=typingConcept(),prior=chalkRecord('practice',source.id);
  if(currentMode()!==requested){
   // Persist any in-progress draft before restoring the other mode.
   state.ckTypingInputMode=requested;
   const next=chalkRecord('practice',source.id);
   const editor=document.querySelector('.ck-v7-input .chalk-editor');
   if(editor){
    const field=editor.querySelector('textarea');
    if(field){field.value=next.text;field.readOnly=!!next.pausedAt;field.focus({preventScroll:true});}
    typingGhost(editor);typingFeedback();
   }
   save();
  }
  updateModeButtons();
  document.querySelector('.ck-v7-input .chalk-editor textarea')?.focus({preventScroll:true});
  return;
 }
 const control=e.target.closest?.('[data-ck31-board-bottom],[data-ck31-board-collapse],[data-ck32-board-top]');
 if(!control)return;
 e.preventDefault();e.stopImmediatePropagation();
 const stage=control.closest('.ck-v7-stage');
 if(!stage)return;
 stage.querySelector('.ck-v7-board')?.__ckV7Finish?.();
 if(control.hasAttribute('data-ck31-board-bottom')){
  state.ck31BoardBottom=!state.ck31BoardBottom;state.ck32BoardTop=false;state.ck31BoardCollapsed=false;
 }else if(control.hasAttribute('data-ck32-board-top')){
  state.ck32BoardTop=!state.ck32BoardTop;state.ck31BoardBottom=false;state.ck31BoardCollapsed=false;
 }else state.ck31BoardCollapsed=!state.ck31BoardCollapsed;
 const top=stage.querySelector('[data-ck32-board-top]');
 if(top)top.setAttribute('aria-pressed',String(state.ck32BoardTop===true));
 updateDock(stage);save();
},true);
// Native editing is untouched in normal mode: Enter inserts a line, Backspace deletes
// through line boundaries, and cursor movement/selection/undo keep browser semantics.
document.addEventListener('keydown',e=>{
 if(state.view!=='typing'||currentMode()!=='letters'||e.isComposing||e.keyCode===229||
    e.ctrlKey||e.altKey||e.metaKey)return;
 if(e.target?.tagName!=='TEXTAREA'||!e.target.closest?.('.ck-v7-input .chalk-editor'))return;
 if(e.key===' '||e.key==='Enter'){
  e.preventDefault();e.stopImmediatePropagation();
 }
},true);
// beforeinput covers mobile virtual keyboards and on-screen Enter/Space actions.
document.addEventListener('beforeinput',e=>{
 if(state.view!=='typing'||currentMode()!=='letters'||e.isComposing||
    e.target?.tagName!=='TEXTAREA'||!e.target.closest?.('.ck-v7-input .chalk-editor'))return;
 if(e.inputType==='insertParagraph'||e.inputType==='insertLineBreak'||
    (e.inputType==='insertText'&&e.data===' '))e.preventDefault();
},true);
document.addEventListener('keyup',e=>{
 if(state.view!=='typing'||currentMode()!=='letters'||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key))return;
 const area=e.target;
 if(area?.tagName!=='TEXTAREA'||!area.closest?.('.ck-v7-input .chalk-editor'))return;
 const editor=area.closest('.chalk-editor');
 if(editor)typingGhost(editor);
});
document.addEventListener('click',e=>{
 if(state.view!=='typing'||currentMode()!=='letters')return;
 const area=e.target.closest?.('.ck-v7-input .chalk-editor textarea');
 if(area)typingGhost(area.closest('.chalk-editor'));
});
window.CK31Typing=Object.freeze({mapText,mode:currentMode,letters,clean:normalized,
 options:()=>({mode:currentMode(),enter:currentMode()==='normal',space:currentMode()==='normal'})});
})();