/* v19 PDF page night-view: CSS-only visual filter, never mutate original PDF bytes or stored ink. */
(function(){
 'use strict';
 const KEY='ck19-pdf-view';
 const root=document.documentElement;
 let mode='auto',frame=0;
 try{const value=localStorage.getItem(KEY);if(['auto','dark','paper'].includes(value))mode=value}catch(e){}
 root.dataset.ck19PdfView=mode;
 function enabled(){return mode==='dark'||mode==='auto'&&root.dataset.ckTheme==='dark'}
 function refresh(){
  frame=0;
  const buttons=document.querySelectorAll('[data-ck19-pdf-night]');
  buttons.forEach(b=>{
   const dark=enabled();
   b.setAttribute('aria-pressed',String(dark));
   b.setAttribute('aria-label',dark?'PDF 원본 색상으로 보기':'PDF를 어둡게 보기');
   b.title=(dark?'PDF 야간 보기 적용 중 · 클릭하여 원본 색상':'PDF 원본 색상 · 클릭하여 야간 보기')+' · Shift+클릭: 앱 테마 따라가기';
   b.textContent=dark?'☀':'☾';
  });
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(refresh)}
 function attach(){
  const bars=document.querySelectorAll('#main .ck15-pdf-tools');
  bars.forEach(bar=>{
   if(bar.querySelector('[data-ck19-pdf-night]'))return;
   const button=document.createElement('button');
   button.type='button';button.dataset.ck19PdfNight='';
   button.className='ck19-pdf-night';
   const group=bar.querySelector('.ck15-pdf-toolgroup')||bar;
   group.append(button);
  });
  schedule();
 }
 function update(next){
  mode=next;
  root.dataset.ck19PdfView=mode;
  try{localStorage.setItem(KEY,mode)}catch(e){}
  refresh();
 }
 document.addEventListener('click',e=>{
  const button=e.target?.closest?.('[data-ck19-pdf-night]');
  if(!button)return;
  e.preventDefault();e.stopImmediatePropagation();
  if(e.shiftKey)update('auto');
  else update(enabled()?'paper':'dark');
 },true);
 function boot(){
  attach();
  const main=document.getElementById('main');
  if(main&&typeof MutationObserver==='function'){
   new MutationObserver(records=>{
    if(records.some(x=>x.target===main))requestAnimationFrame(attach);
   }).observe(main,{childList:true});
  }
  if(typeof MutationObserver==='function'){
   new MutationObserver(schedule).observe(root,{attributes:true,attributeFilter:['data-ck-theme']});
  }
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
 window.CK19PDFNight=Object.freeze({
  getState:()=>({mode,enabled:enabled()}),
  setMode:value=>{if(['auto','dark','paper'].includes(value))update(value)}
 });
})();