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
function caretIndex(area,mode){
 const raw=area.value||'',offset=typeof area.selectionStart==='number'?area.selectionStart:raw.length;
 return mode==='letters'?letters(raw.slice(0,offset)).length:chars(raw.slice(0,offset)).length;
}
function locateLine(mirror,selector){
 const el=mirror.querySelector(selector);
 if(!el?.getBoundingClientRect)return false;
 const rect=el.getBoundingClientRect(),base=mirror.getBoundingClientRect();
 const height=parseFloat(getComputedStyle(mirror).lineHeight)||28;
 const top=Math.max(0,rect.top-base.top-(el.classList?.contains('ck62-anchor')?height*.12:0));
 mirror.style.setProperty('--ck-v3-line-top',top.toFixed(1)+'px');
 mirror.style.setProperty('--ck-v3-line-height',Math.max(24,height).toFixed(1)+'px');
 return {rect,base,height,top};
}
const mirrorCache=new WeakMap();
function glyphClass(ch,ok){
 return 'ck62-live-char '+(ch==='\n'?'ck62-newline':ok?'ck62-right':'ck62-wrong');
}
function paintNormal(m,mirror,area,key){
 const target=m.target.join(''),typed=m.typed,position=Math.min(caretIndex(area,'normal'),typed.length);
 let cache=mirrorCache.get(mirror);
 if(!cache||cache.mode!=='normal'||cache.key!==key||cache.target!==target){
  const live=[];
  for(let i=0;i<=typed.length;i++){
   if(i===position)live.push('<span class="ck62-anchor" data-ck62-anchor="1" aria-hidden="true"></span>');
   if(i<typed.length)live.push('<span class="'+glyphClass(typed[i],m.mapped.get(i)?.ok)+
    '" data-ck62-input="'+i+'">'+esc(typed[i])+'</span>');
  }
  // The immutable source is rebuilt only on a new question or mode, never on a keystroke.
  mirror.innerHTML='<div class="ck62-guide">'+esc(target)+'</div><div class="ck62-live">'+live.join('')+'</div>';
  cache={mode:'normal',key,target,lastText:typed.join(''),lastPosition:position,
   nodes:Array.from(mirror.querySelectorAll?.('[data-ck62-input]')||[]),
   live:mirror.querySelector('.ck62-live'),anchor:mirror.querySelector('[data-ck62-anchor]'),
   layoutWidth:null};
  mirrorCache.set(mirror,cache);
  locateLine(mirror,'[data-ck62-anchor]');
  return;
 }
 const value=typed.join('');
 if(value!==cache.lastText&&cache.live){
  for(let i=0;i<typed.length;i++){
   const ch=typed[i],klass=glyphClass(ch,m.mapped.get(i)?.ok);
   let node=cache.nodes[i];
   if(!node){
    node=document.createElement('span');node.dataset.ck62Input=String(i);
    node.textContent=ch;node.className=klass;
    cache.live.appendChild(node);cache.nodes.push(node);
   }else{
    if(node.textContent!==ch)node.textContent=ch;
    if(node.className!==klass)node.className=klass;
   }
  }
  while(cache.nodes.length>typed.length)cache.nodes.pop().remove();
  cache.lastText=value;
 }
 if(position!==cache.lastPosition||value!==cache.lastLaidOutText){
  if(cache.live&&cache.anchor)cache.live.insertBefore(cache.anchor,cache.nodes[position]||null);
  locateLine(mirror,'[data-ck62-anchor]');
  cache.lastPosition=position;cache.lastLaidOutText=value;
 }
}
function paintLetters(m,mirror,area,key){
 const target=m.target.join(''),position=Math.min(caretIndex(area,'letters'),m.positions.length);
 let cache=mirrorCache.get(mirror);
 if(!cache||cache.mode!=='letters'||cache.key!==key||cache.target!==target){
  mirror.innerHTML=m.target.map((ch,i)=>{
   if(ch==='\n')return '\n';
   const match=m.mapped.get(i),status=match?(match.ok?'ck62-right':'ck62-wrong'):
    printable.test(ch)?'ck62-pending':'ck62-separator';
   return '<span class="ck62-cell '+status+'" data-ck62-reference="'+i+'">'+
    '<span class="ck62-cell-source">'+esc(ch)+'</span>'+
    (match?'<span class="ck62-cell-input">'+esc(match.typed)+'</span>':'')+'</span>';
  }).join('')+'<span class="ck-v3-caret" aria-hidden="true"></span>';
  cache={mode:'letters',key,target,lastText:null,lastPosition:null,layoutWidth:null,
   cells:new Map(Array.from(mirror.querySelectorAll?.('[data-ck62-reference]')||[])
    .map(node=>[Number(node.dataset.ck62Reference),node]))};
  mirrorCache.set(mirror,cache);
 }
 const value=m.typed.join('');
 if(cache.lastText!==value){
  for(const at of m.positions){
   const cell=cache.cells.get(at);if(!cell)continue;
   const match=m.mapped.get(at),klass='ck62-cell '+(match?(match.ok?'ck62-right':'ck62-wrong'):'ck62-pending');
   if(cell.className!==klass)cell.className=klass;
   let ink=cell.querySelector('.ck62-cell-input');
   if(match&&!ink){ink=document.createElement('span');ink.className='ck62-cell-input';cell.appendChild(ink);}
   if(ink&&ink.textContent!==(match?.typed||''))ink.textContent=match?.typed||'';
  }
  cache.lastText=value;
 }
 if(cache.lastPosition!==position){
  const index=m.positions[position]??m.positions[m.positions.length-1];
  const line=locateLine(mirror,'[data-ck62-reference="'+index+'"]');
  if(line){
   const {rect,base,height,top}=line,atEnd=position>=m.positions.length;
   mirror.style.setProperty('--ck-v3-caret-x',Math.max(0,(atEnd?rect.right:rect.left)-base.left).toFixed(1)+'px');
   mirror.style.setProperty('--ck-v3-caret-y',top.toFixed(1)+'px');
   mirror.style.setProperty('--ck-v3-caret-height',Math.max(18,height).toFixed(1)+'px');
  }
  cache.lastPosition=position;
 }
}
typingGhost=function(el){
 const c=typingConcept(),r=chalkRecord('practice',c.id);
 const mirror=el?.querySelector('.chalk-mirror'),area=el?.querySelector('textarea');
 if(!mirror||!area)return;
 if(!c.fact){
  if(mirror.dataset?.ck31Empty!=='true')mirror.innerHTML='<span class="chalk-placeholder">연습할 공식 문항이 없습니다.</span>';
  if(mirror.dataset)mirror.dataset.ck31Empty='true';
  area.disabled=true;return;
 }
 if(area.__ck31Composing)return;
 area.disabled=false;
 const m=mapText(c.fact,{text:area.value}),normal=m.mode==='normal',key=String(c.id);
 el.classList.toggle('ck61-normal-editor',normal);
 el.classList.toggle('ck61-letters-editor',!normal);
 el.classList.toggle('ck62-editor',true);
 mirror.classList.add('ck31-fixed-underlay','ck-v3-line-active','ck62-fixed');
 mirror.classList.toggle('ck61-normal',normal);
 mirror.classList.toggle('ck61-letters',!normal);
 mirror.classList.toggle('ck62-normal',normal);
 mirror.classList.toggle('ck62-letters',!normal);
 const before=mirrorCache.get(mirror);
 const rebuild=!before||before.key!==key||before.mode!==m.mode||before.target!==m.target.join('');
 if(normal)paintNormal(m,mirror,area,key);else paintLetters(m,mirror,area,key);
 const cache=mirrorCache.get(mirror),width=mirror.clientWidth||0;
 // Read size only on source/mode/viewport changes, never force a height write per key.
 if(cache&&(rebuild||cache.layoutWidth!==width)){
  const height=Math.max(165,mirror.scrollHeight||0)+32;
  el.style.setProperty('min-height',height+'px','important');
  area.style.height=Math.max(133,height-32)+'px';
  cache.layoutWidth=width;
 }
 syncGeneratedPrompt(c);
}
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
 const entered=Math.min(m.required,m.entered);
 const percentage=m.required?Math.min(100,100*entered/m.required):0;
 const values={'ck-v7-stat-time':clock(s.seconds),
  'ck-v7-stat-cpm':String(s.cpm),'ck-v7-stat-accuracy':s.accuracy+'%',
  'ck-v7-stat-count':entered+'/'+m.required,'ck-v7-typed-count':String(entered)};
 for(const [id,value]of Object.entries(values)){
  const node=document.getElementById(id);if(node&&node.textContent!==value)node.textContent=value;
 }
 const progress=document.getElementById('ck62-progress');
 if(progress){
  progress.style.setProperty('--ck62-progress',percentage.toFixed(2)+'%');
  progress.setAttribute('aria-valuenow',String(Math.round(percentage)));
  progress.setAttribute('aria-valuetext',entered+' / '+m.required+' · '+Math.round(percentage)+'%');
 }
 const progressText=document.getElementById('ck62-progress-label');
 if(progressText)progressText.textContent=entered+' / '+m.required+' · '+Math.round(percentage)+'%';
 const fill=document.getElementById('ck-v3-progress-fill');
 if(fill)fill.style.setProperty('--ck-v3-progress',percentage.toFixed(2)+'%');
 const p=completion(),label=document.getElementById('ck-v3-completion-text'),dots=document.getElementById('ck-v3-completion-dots');
 if(label)label.textContent=p.done+'/'+p.total;
 if(dots){
  dots.setAttribute('aria-label',p.percentage+'% 완료');
  const n=Math.round(18*p.percentage/100);
  Array.from(dots.children).forEach((dot,i)=>dot.className=i<n?'ck-v3-done':'ck-v3-pending');
 }
};
// Use the existing CK10 AI dock: this feature never posts text to a third-party service.
let generatedPrompt=null;
function buildOfficialPrompt(q){
 if(!q||q.verified!==true||!Array.isArray(q.options)||q.options.length!==5||
    q.options.some(v=>typeof v!=='string'||!v.trim())||!q.question?.trim())
  return {error:'이 문항의 공식 문제·5개 선지가 확인되지 않았습니다.'};
 const correct=Array.isArray(q.correct)?q.correct.map(Number):[];
 if(!correct.length||correct.some(n=>!Number.isInteger(n)||n<1||n>5)||new Set(correct).size!==correct.length)
  return {error:'공식 최종정답을 확인할 수 없습니다.'};
 const id=q.id||String(q.year)+'-'+String(q.number),all=correct.length===5,multi=correct.length>1&&!all;
 const subject=q.subject==='civil'?'민법 및 민사특별법':'부동산학개론';
 const answer=all?'전원정답 처리(①~⑤ 모두 채점 인정, 각 선지의 참·거짓과는 별개)':
  correct.map(n=>'①②③④⑤'[n-1]).join(' 또는 ');
 const warning=all?'전원정답은 모든 선지가 참이라는 뜻이 아닙니다. 선지 진위를 알 수 없으면 판단 보류하세요.':
  multi?'복수정답입니다. 인정된 각각의 선택지를 독립적으로 설명하세요.':
  '공식 최종정답 번호와 각 선지의 참·거짓 판단을 구분하세요.';
 const lines=[
  '[ConceptKnot 현재 문항 · AI 해설 요청]',
  '문항 ID: '+id,
  '과목: '+subject,
  '시험 연도: '+String(q.year)+'년 (시험 당시 기준)',
  '문제 원문:\n'+q.question.trim(),
  '5개 선지:\n'+q.options.map((v,i)=>'①②③④⑤'[i]+' '+v.trim()).join('\n'),
  '공식 최종정답 처리: '+answer,
  '특수정답 주의: '+warning,
  q.checks?.visualReview?'표·도형·수식은 공식 문제지 PDF 원본과 반드시 대조하세요.':'',
  '공식 출처: '+(q.originalUrl||'한국산업인력공단 Q-Net 원문 출처 확인 필요'),
  '요청:',
  '1. 정답 근거를 초보자도 이해하도록 쉬운 문장 2~3개로 설명하세요.',
  '2. ①~⑤를 각각 옳음/틀림/판단 보류로 분류하고 판단 근거를 쓰세요. 조합형 진술도 나누어 검토하세요.',
  '3. 일상적인 예시 1개, 자주 빠지는 함정, 시험 직전 암기 한 줄을 제시하세요.',
  '4. 계산문제라면 조건→공식→대입→결과→단위→검산 순서로 제시하세요.',
  '5. 법령·판례는 시험 당시 기준과 현행법을 구분하고 공식 원문 또는 검증 가능한 출처를 명시하세요.',
  '공식 정답 인정과 선지의 실질적 진위는 같지 않을 수 있습니다.',
  '근거를 확인할 수 없으면 추측하거나 판례 번호를 지어내지 말고 판단 보류로 표시하세요.',
  '이 질문에는 사용자 메모·개인 답안이 포함되지 않습니다.'
 ];
 return {sourceId:'official-'+id,text:lines.filter(Boolean).join('\n\n')};
}
function buildPromptForItem(c){
 const id=String(c?.id||''),match=/^official-(\d{4})-(\d{1,2})$/.exec(id);
 if(match){
  const key=match[1]+'-'+Number(match[2]),official=window.RECALL_OFFICIAL?.[key];
  if(!official)return {error:'공식 기출 데이터가 아직 준비되지 않았습니다. 다시 불러온 뒤 시도하세요.'};
  return buildOfficialPrompt(official);
 }
 if(id.startsWith('type-')){
  const q=typeof quizzes==='function'?quizzes().find(x=>x.id===id.slice(5)):null;
  if(!q||!Array.isArray(q.a)||q.a.length!==5)return {error:'연습문제 자료를 확인할 수 없습니다.'};
  const correct=Array.isArray(q.correct)?q.correct:[q.ok];
  return {sourceId:id,text:[
   '[ConceptKnot 창작 연습문제 · AI 설명 요청]','공식 기출이 아닌 학습용 문제입니다.',
   '과목: '+(state.subject==='civil'?'민법 및 민사특별법':'부동산학개론'),
   '문제: '+q.q,'선지:\n'+q.a.map((v,i)=>'①②③④⑤'[i]+' '+v).join('\n'),
   '연습문제 설정 정답: '+correct.map(n=>'①②③④⑤'[Number(n)-1]||'?').join(' 또는 '),
   '쉬운 근거 2~3문장, 선지별 검토, 예시 1개, 함정과 암기 한 줄을 제시하세요.',
   '검증되지 않은 법령·판례·공식은 추측하지 말고 확인 필요로 표시하세요.'
  ].join('\n\n')};
 }
 if(c?.fact)return {sourceId:id,text:[
  '[ConceptKnot 핵심 이론 · AI 설명 요청]','공식 시험 문항이 아닌 학습 노트입니다.',
  '과목: '+(state.subject==='civil'?'민법 및 민사특별법':'부동산학개론'),
  '학습 내용:\n'+c.fact,'쉽게 풀어 설명하고 예시 1개·혼동하는 개념·20초 암기 질문을 만들어 주세요.',
  '법령·판례·계산 근거는 출처를 확인하고 불확실하면 보류하세요.'
 ].join('\n\n')};
 return {error:'현재 선택한 학습 문항이 없습니다.'};
}
function promptStatus(message){
 const status=document.querySelector('[data-ck31-prompt-status]');
 if(status)status.textContent=message;
}
function syncGeneratedPrompt(c){
 if(!generatedPrompt||generatedPrompt.sourceId===c.id)return;
 const area=document.getElementById('ck10-ai-question');
 if(!area||area.value!==generatedPrompt.text){generatedPrompt=null;return;}
 const next=buildPromptForItem(c);
 if(next.error){area.value='';generatedPrompt=null;promptStatus(next.error);return;}
 area.value=next.text;generatedPrompt=next;promptStatus('현재 문항의 질문으로 갱신했습니다.');
}
if(typeof renderTyping==='function'){
 const originalTypingRender=renderTyping;
 renderTyping=function(){
  const html=originalTypingRender();
  return html.replace('<div class="ck-v7-actions-right">',
   '<div class="ck-v7-actions-right"><button type="button" data-ck31-explain-prompt class="ck31-prompt-btn" title="현재 문항의 공식 문제·선지·정답을 AI 질문으로 복사합니다">AI 해설 질문 복사</button><span data-ck31-prompt-status class="ck31-prompt-status" role="status" aria-live="polite"></span>');
 };
}
document.addEventListener('click',e=>{
 const button=e.target.closest?.('[data-ck31-explain-prompt]');
 if(!button||state.view!=='typing')return;
 e.preventDefault();e.stopImmediatePropagation();
 const prompt=buildPromptForItem(typingConcept());
 if(prompt.error){promptStatus(prompt.error);return;}
 if(typeof window.CK10?.openDock==='function')window.CK10.openDock('chatgpt');
 const area=document.getElementById('ck10-ai-question');
 if(area)area.value=prompt.text;
 generatedPrompt=prompt;
 button.textContent='AI 해설 질문 복사';
 const success=()=>{
  if(generatedPrompt?.sourceId!==prompt.sourceId)return;
  button.textContent='복사됨 ✓';
  promptStatus('복사 완료 · AI 창에 붙여 넣어 질문하세요.');
 };
 const failed=()=>{
  if(area){area.focus();area.select();}
  promptStatus('자동 복사 실패 · 열린 질문창에서 직접 선택해 복사하세요.');
 };
 if(typeof navigator!=='undefined'&&typeof navigator.clipboard?.writeText==='function'){
  try{Promise.resolve(navigator.clipboard.writeText(prompt.text)).then(success,failed);}
  catch(err){failed();}
 }else{
  let copied=false;
  try{if(area){area.focus();area.select();copied=!!document.execCommand?.('copy');}}catch(err){}
  if(copied)success();else failed();
 }
},true);
document.addEventListener('compositionstart',e=>{
 const field=e.target;if(state.view!=='typing'||field?.tagName!=='TEXTAREA'||
    !field.closest?.('.ck-v7-input .chalk-editor'))return;
 field.__ck31Composing=true;
 field.closest('.chalk-editor')?.classList.add('ck31-composing');
},true);
document.addEventListener('compositionend',e=>{
 const field=e.target;if(state.view!=='typing'||field?.tagName!=='TEXTAREA'||
    !field.closest?.('.ck-v7-input .chalk-editor'))return;
 field.__ck31Composing=false;
 field.closest('.chalk-editor')?.classList.remove('ck31-composing');
 const editor=field.closest('.chalk-editor');if(editor)typingGhost(editor);
});
document.addEventListener('selectionchange',()=>{
 if(state.view!=='typing')return;
 const field=document.querySelector('.ck-v7-input .chalk-editor textarea');
 if(field&&document.activeElement===field&&!field.__ck31Composing){
  const editor=field.closest('.chalk-editor');if(editor)typingGhost(editor);
 }
});
document.addEventListener('select',refreshCaret,true);
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
function refreshCaret(e){
 if(state.view!=='typing'||e.target?.tagName!=='TEXTAREA'||
    !e.target.closest?.('.ck-v7-input .chalk-editor'))return;
 const editor=e.target.closest('.chalk-editor');
 if(editor)typingGhost(editor);
}
document.addEventListener('keyup',e=>{
 if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','Backspace','Delete'].includes(e.key))return;
 refreshCaret(e);
});
document.addEventListener('mouseup',refreshCaret);
document.addEventListener('compositionend',refreshCaret);
window.CK31Typing=Object.freeze({mapText,mode:currentMode,letters,clean:normalized,buildPromptForItem,buildOfficialPrompt,
 options:()=>({mode:currentMode(),enter:currentMode()==='normal',space:currentMode()==='normal'})});
})();