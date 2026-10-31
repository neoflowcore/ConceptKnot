/* ConceptKnot v64: selected-note context dialog, in the study engine lexical scope. */
(function(){
'use strict';
const NOTE_SELECTOR='.ck-v7-board .ck-v7-writing-surface .chalk-editor[data-chalk-kind="notes"] textarea';
const VALID_HEX=/^#[0-9a-f]{6}$/i;
let menu=null,selection=null,requestId=0,drag=null;
const noteField=node=>node?.closest?.(NOTE_SELECTOR)||null;
const validRange=sel=>sel&&sel.area?.isConnected&&sel.editor?.isConnected&&
  sel.from>=0&&sel.to>sel.from&&sel.to<=sel.area.value.length;
function noteRecord(editor){return chalkRecord('notes',editor.dataset.chalkKey);}
function ensureArray(record,name){
 if(!Array.isArray(record[name]))record[name]=[];
 return record[name];
}
const safeLabel=text=>String(text??'').replace(/\s+/g,' ').trim().slice(0,90);
function buildMenu(){
 if(menu)return menu;
 menu=document.createElement('div');
 menu.className='ck64-selection-menu ck65-movable-menu';
 menu.setAttribute('role','dialog');
 menu.setAttribute('aria-label','칠판 선택 글자 편집');
 menu.setAttribute('aria-modal','false');
 menu.setAttribute('tabindex','-1');
 menu.hidden=true;
 const palettes=CHALK_COLORS.map((hex,index)=>'<button type="button" class="ck64-swatch" '+
  'data-ck64-color="'+index+'" aria-label="'+CHALK_NAMES[index]+' 글자 색상" '+
  'title="'+CHALK_NAMES[index]+'" style="--ck64-swatch:'+hex+'"></button>').join('');
 menu.innerHTML='<header class="ck64-menu-head ck65-drag-handle" data-ck65-drag-handle title="이 부분을 드래그해 창 이동"><strong>선택한 글자 <span class="ck65-drag-hint">⋮⋮ 이동</span></strong>'+
  '<button type="button" class="ck64-close" data-ck64-action="close" aria-label="편집 메뉴 닫기">×</button></header>'+
  '<p class="ck64-selection-preview" data-ck64-preview></p>'+
  '<div class="ck64-menu-actions" role="group" aria-label="선택 글자 편집">'+
  '<button type="button" class="ck64-main-button ck64-bold" data-ck64-action="bold" aria-pressed="false" title="선택 부분만 굵게"><b>B</b> 굵게</button>'+
  '<button type="button" class="ck64-main-button" data-ck64-action="copy">복사</button>'+
  '<button type="button" class="ck64-main-button" data-ck64-action="paste">붙여넣기</button></div>'+
  '<div class="ck64-color-row" role="group" aria-label="선택 글자 색깔">'+
  '<span class="ck64-color-label">글자 색상</span><div class="ck64-swatches">'+palettes+'</div>'+
  '<label class="ck64-custom-color" title="선택 글자에 사용자 색상 적용">'+
  '<input type="color" data-ck64-custom-color aria-label="사용자 글자 색상" value="#8ee5ff">'+
  '</label></div>'+
  '<div class="ck64-menu-status" data-ck64-status role="status" aria-live="polite"></div>'+ 
  '<div class="ck65-menu-footer"><small>서식을 연속 적용할 수 있습니다.</small>'+ 
  '<button type="button" class="ck65-done" data-ck64-action="done">완료</button></div>';
 document.body.append(menu);
 // Preserve selection while pressing controls; drag only the title strip.
 menu.addEventListener('pointerdown',event=>{
  if(event.button!==0&&event.pointerType==='mouse')return;
  const handle=event.target.closest?.('[data-ck65-drag-handle]');
  if(handle&&!event.target.closest?.('button,input,a')){
   event.preventDefault();
   const rect=menu.getBoundingClientRect();
   drag={id:event.pointerId,startX:event.clientX,startY:event.clientY,
    left:rect.left,top:rect.top,handle};
   menu.classList.add('ck65-dragging');
   try{handle.setPointerCapture(event.pointerId)}catch{}
   return;
  }
  if(event.target?.matches?.('input[type="color"]'))return;
  event.preventDefault();
 });
 return menu;
}
function close(){
 if(menu){menu.hidden=true;menu.classList.remove('ck65-dragging');}
 drag=null;
 selection=null;
 requestId++;
}
function selectedRecord(){
 if(!validRange(selection)){close();return null;}
 const r=noteRecord(selection.editor);
 if(r.text!==selection.area.value){close();return null;}
 return r;
}
function restore(){
 const sel=selection;
 if(!validRange(sel))return;
 try{
  sel.area.focus({preventScroll:true});
  sel.area.setSelectionRange(sel.from,sel.to);
 }catch{}
}
function setStatus(text){
 if(menu)menu.querySelector('[data-ck64-status]').textContent=text;
}
function updatePreview(){
 if(validRange(selection)&&menu)
  menu.querySelector('[data-ck64-preview]').textContent=safeLabel(
   selection.area.value.slice(selection.from,selection.to));
}
function constrain(left,top){
 const w=menu?.offsetWidth||300,h=menu?.offsetHeight||200,pad=8;
 const vw=Math.max(240,document.documentElement.clientWidth||window.innerWidth);
 const vh=Math.max(240,document.documentElement.clientHeight||window.innerHeight);
 return {left:Math.min(Math.max(pad,left),Math.max(pad,vw-w-pad)),
  top:Math.min(Math.max(pad,top),Math.max(pad,vh-h-pad))};
}
function onDragMove(event){
 if(!drag||event.pointerId!==drag.id||!menu||menu.hidden)return;
 if(event.cancelable)event.preventDefault();
 const point=constrain(drag.left+event.clientX-drag.startX,drag.top+event.clientY-drag.startY);
 menu.style.left=point.left+'px';
 menu.style.top=point.top+'px';
}
function endDrag(event){
 if(!drag||event.pointerId!==drag.id)return;
 const prior=drag;drag=null;
 menu?.classList.remove('ck65-dragging');
 try{if(prior.handle.hasPointerCapture?.(prior.id))prior.handle.releasePointerCapture(prior.id)}catch{}
}
window.addEventListener('pointermove',onDragMove,{passive:false});
window.addEventListener('pointerup',endDrag);
window.addEventListener('pointercancel',endDrag);
window.addEventListener('blur',()=>{if(drag){menu?.classList.remove('ck65-dragging');drag=null;}});
window.addEventListener('resize',()=>{
 if(!menu||menu.hidden)return;
 const rect=menu.getBoundingClientRect(),point=constrain(rect.left,rect.top);
 menu.style.left=point.left+'px';menu.style.top=point.top+'px';
});
function syncBoldButton(){
 if(!validRange(selection)||!menu)return;
 const r=noteRecord(selection.editor),mask=ensureArray(r,'ck64BoldChars');
 let all=true;
 for(let i=selection.from;i<selection.to;i++)if(mask[i]!==true){all=false;break;}
 const button=menu.querySelector('[data-ck64-action="bold"]');
 button.setAttribute('aria-pressed',String(all));
 button.title=all?'선택 글자 굵게 해제':'선택 글자 굵게';
}
function repaint(){
 if(!selection?.editor?.isConnected)return;
 chalkPaint(selection.editor);
 save();
 syncBoldButton();
}
function setBold(){
 const r=selectedRecord();if(!r)return;
 const mask=ensureArray(r,'ck64BoldChars');
 let all=true;
 for(let i=selection.from;i<selection.to;i++)if(mask[i]!==true){all=false;break;}
 requestId++;
 for(let i=selection.from;i<selection.to;i++)mask[i]=!all;
 repaint();restore();
 setStatus(all?'굵게 해제됨 · 다른 서식도 적용할 수 있습니다.':'굵게 적용됨 · 색상도 연속 변경할 수 있습니다.');
}
function setColor(index,custom){
 const r=selectedRecord();if(!r)return;
 let hex=null;
 if(custom!=null){if(!VALID_HEX.test(custom))return;hex=custom.toLowerCase();}
 if(hex===null&&!(Number.isInteger(index)&&index>=0&&index<CHALK_COLORS.length))return;
 if(hex===null&&index===4)hex=CHALK_COLORS[4];
 requestId++;
 const colors=ensureArray(r,'colors'),overrides=ensureArray(r,'ck64ColorHex');
 for(let i=selection.from;i<selection.to;i++){
  if(hex===null){colors[i]=index;overrides[i]=null;}
  else{overrides[i]=hex;}
 }
 repaint();restore();
 setStatus('색상 변경 완료 · 다른 서식도 적용할 수 있습니다.');
}
async function copySelection(){
 const r=selectedRecord();if(!r)return;
 const value=r.text.slice(selection.from,selection.to),id=++requestId;
 try{
  if(!navigator.clipboard?.writeText)throw new Error('unsupported');
  await navigator.clipboard.writeText(value);
  if(id===requestId){restore();setStatus('복사 완료 · 다른 서식도 적용할 수 있습니다.');}
 }catch{
  // Native selection is preserved, so execCommand(copy) is usable on older Brave.
  if(id!==requestId||!validRange(selection))return;
  restore();
  try{if(document.execCommand?.('copy')){setStatus('복사 완료 · 계속 편집할 수 있습니다.');return;}}catch{}
  setStatus('브라우저 복사 권한이 차단되었습니다. Ctrl+C를 사용하세요.');
 }
}
async function pasteSelection(){
 const r=selectedRecord();if(!r)return;
 const id=++requestId;
 try{
  if(!navigator.clipboard?.readText)throw new Error('unsupported');
  const raw=await navigator.clipboard.readText();
  if(id!==requestId||!validRange(selection)||!selection.area.isConnected)return;
  const sel=selection;
  const max=Number(sel.area.maxLength)>0?Number(sel.area.maxLength):12000;
  const allowed=Math.max(0,max-(sel.area.value.length-(sel.to-sel.from)));
  const text=String(raw).slice(0,allowed);
  if(!text){setStatus('붙여넣을 내용이 없거나 글자 수 제한에 도달했습니다.');return;}
  sel.area.focus({preventScroll:true});
  // setRangeText does not dispatch input. Fire it so colors, bold masks and
  // persistence pass through the original note editor input reconciliation.
  sel.area.setRangeText(text,sel.from,sel.to,'end');
  sel.to=sel.from+text.length;
  sel.area.dispatchEvent(new Event('input',{bubbles:true}));
  if(id!==requestId||!validRange(selection))return;
  updatePreview();
  syncBoldButton();
  restore();
  setStatus('붙여넣기 완료 · 붙인 글자에 굵게·색상을 추가할 수 있습니다.');
 }catch{
  if(id!==requestId||!validRange(selection))return;
  restore();
  setStatus('클립보드 접근이 제한되었습니다. Ctrl+V로 붙여넣으세요.');
 }
}
function placeMenu(event){
 if(!menu)return;
 const pad=10;
 const rect=selection.area.getBoundingClientRect();
 const vw=Math.max(240,document.documentElement.clientWidth||window.innerWidth);
 const vh=Math.max(240,document.documentElement.clientHeight||window.innerHeight);
 const width=menu.offsetWidth||300,height=menu.offsetHeight||190;
 const rawX=event.clientX>0?event.clientX:rect.left+Math.min(rect.width*.35,100);
 const rawY=event.clientY>0?event.clientY:rect.top+Math.min(rect.height*.35,75);
 const point=constrain(rawX,rawY);
 menu.style.left=point.left+'px';menu.style.top=point.top+'px';
}
document.addEventListener('contextmenu',event=>{
 const area=noteField(event.target);
 if(!area||area.readOnly||area.disabled||area.closest('.ck9-spen-active'))return;
 const from=area.selectionStart,to=area.selectionEnd;
 if(!Number.isInteger(from)||!Number.isInteger(to)||from===to)return;
 const editor=area.closest('.chalk-editor');
 if(!editor||editor.dataset.chalkKind!=='notes')return;
 event.preventDefault();event.stopPropagation();
 const panel=buildMenu();
 selection={area,editor,from:Math.min(from,to),to:Math.max(from,to)};
 requestId++;
 panel.hidden=false;
 updatePreview();
 panel.querySelector('[data-ck64-custom-color]').value=VALID_HEX.test(state.ck10CustomColor||'')?state.ck10CustomColor:'#8ee5ff';
 panel.querySelector('[data-ck64-status]').textContent='';
 syncBoldButton();
 placeMenu(event);
},true);
// Document capture stops unrelated delegated keyboard/board command handlers.
document.addEventListener('click',event=>{
 if(!menu||menu.hidden)return;
 const action=event.target.closest?.('[data-ck64-action]');
 const swatch=event.target.closest?.('[data-ck64-color]');
 if(menu.contains(event.target)&&(action||swatch)){
  event.preventDefault();event.stopImmediatePropagation();
  if(action){
   const what=action.dataset.ck64Action;
   if(what==='close'||what==='done'){close();return;}
   if(what==='bold'){setBold();return;}
   if(what==='copy'){void copySelection();return;}
   if(what==='paste'){void pasteSelection();return;}
  }
  if(swatch){setColor(Number(swatch.dataset.ck64Color),null);return;}
 }
 if(!menu.contains(event.target))close();
},true);
document.addEventListener('change',event=>{
 if(!menu||menu.hidden||!event.target.matches?.('[data-ck64-custom-color]'))return;
 event.stopPropagation();
 setColor(null,event.target.value);
},true);
document.addEventListener('keydown',event=>{
 if(!menu||menu.hidden)return;
 if(event.key==='Escape'){event.preventDefault();close();}
},true);
document.addEventListener('scroll',event=>{
 if(!menu?.hidden&&event.target!==menu&&(!selection?.area?.isConnected||event.target?.closest?.('.ck-v7-writing-surface')))close();
},true);
// Preserve compatibility with existing plain text drafts; render the selected
// text emphasis using an ink stroke, not font-width changes that break the
// native textarea selection/caret position.
const previousPaint=chalkPaint;
chalkPaint=function(editor,fresh=false){
 previousPaint(editor,fresh);
 if(editor?.dataset?.chalkKind!=='notes'||!editor.closest?.('.ck-v7-board'))return;
 const r=noteRecord(editor),bolds=Array.isArray(r.ck64BoldChars)?r.ck64BoldChars:[],
  overrides=Array.isArray(r.ck64ColorHex)?r.ck64ColorHex:[];
 if(!bolds.length&&!overrides.length)return;
 const spans=editor.querySelector('.chalk-mirror')?.querySelectorAll('.chalk-letter');
 if(!spans?.length)return;
 let at=0;
 for(const span of spans){
  const char=span.textContent||'';
  if(bolds[at]===true)span.classList.add('ck64-selection-bold');
  const hex=overrides[at];
  if(typeof hex==='string'&&VALID_HEX.test(hex))span.style.setProperty('color',hex,'important');
  at+=char.length;
 }
};
window.CK64Notes=Object.freeze({isActive:()=>Boolean(menu&&!menu.hidden),isDragging:()=>Boolean(drag)});
window.CK65Notes=window.CK64Notes;
})();