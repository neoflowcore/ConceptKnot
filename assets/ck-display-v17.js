/* Five persisted comfort controls, independent background and page filters. */
(function(){
'use strict';
const key='conceptknot-display-v17',root=document.documentElement;
const fields=[
 ['saturation','배경 채도',0,150,72,'%','--ck17-bg-saturation'],
 ['backgroundBrightness','배경 밝기',40,130,92,'%','--ck17-bg-brightness'],
 ['hue','배경 색조',-180,180,0,'°','--ck17-bg-hue'],
 ['brightness','전체 밝기',50,130,100,'%','--ck17-brightness'],
 ['contrast','전체 명암',50,150,100,'%','--ck17-contrast']
];
let values={},dialog,opener,frame=0;
try{values=JSON.parse(localStorage.getItem(key)||'{}')||{}}catch(e){}
function apply(){
 fields.forEach(([id,,min,max,def,unit,css])=>{
  let val=Number(values[id]??def);if(!Number.isFinite(val))val=def;
  values[id]=Math.max(min,Math.min(max,val));
  root.style.setProperty(css,unit==='°'?values[id]+'deg':String(values[id]/100));
  const input=dialog?.querySelector('[name="'+id+'"]'),output=dialog?.querySelector('[data-value="'+id+'"]');
  if(input)input.value=values[id];if(output)output.textContent=values[id]+unit;
 });
}
function ensure(){
 if(dialog)return dialog;
 dialog=document.createElement('dialog');dialog.id='ck17-display-dialog';dialog.setAttribute('aria-labelledby','ck17-display-title');
 dialog.innerHTML='<header><h2 id="ck17-display-title">화면 편안함</h2><button type="button" data-close aria-label="화면 설정 닫기">×</button></header>'+fields.map(([id,label,min,max,def,unit],i)=>(i===0?'<h3>아기사자 바탕화면</h3>':i===3?'<h3>홈페이지 전체</h3>':'')+'<label>'+label+'<output data-value="'+id+'"></output><input type="range" name="'+id+'" min="'+min+'" max="'+max+'" step="1"></label>').join('')+'<footer><button type="button" data-reset>기본값 복원</button></footer>';
 document.body.append(dialog);
 dialog.addEventListener('input',e=>{if(!e.target.matches('input[type=range]'))return;values[e.target.name]=Number(e.target.value);apply();save()});
 dialog.querySelector('[data-close]').onclick=()=>dialog.close();
 dialog.querySelector('[data-reset]').onclick=()=>{values={};apply();save()};
 dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});
 dialog.addEventListener('close',()=>{opener?.setAttribute('aria-expanded','false');opener?.focus()});apply();return dialog;
}
function save(){try{localStorage.setItem(key,JSON.stringify(values))}catch(e){}}
function height(){
 frame=0;const board=document.querySelector('.ck-v7-board:not(.ck9-spen-fullscreen)');
 if(board){const top=Math.max(8,board.getBoundingClientRect().top);root.style.setProperty('--ck17-board-top',top+'px')}
}
function schedule(){if(!frame)frame=requestAnimationFrame(height)}
document.addEventListener('click',e=>{const b=e.target.closest('[data-ck17-display]');if(!b)return;opener=b;ensure().showModal();b.setAttribute('aria-expanded','true')});
apply();
function boot(){const main=document.getElementById('main');if(main)new MutationObserver(schedule).observe(main,{childList:true});schedule()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.addEventListener('resize',schedule,{passive:true});window.visualViewport?.addEventListener('resize',schedule,{passive:true});
})();
