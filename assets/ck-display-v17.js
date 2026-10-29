/* Five persisted comfort controls, independent background and page filters. */
(function(){
'use strict';
const key='conceptknot-display-v17',root=document.documentElement;
const fields=[
 ['saturation','배경 채도',0,150,100,'%','--ck17-bg-saturation'],
 ['backgroundBrightness','배경 밝기',40,130,100,'%','--ck17-bg-brightness'],
 ['hue','배경 색조',-180,180,0,'°','--ck17-bg-hue'],
 ['brightness','전체 밝기',50,130,100,'%','--ck17-brightness'],
 ['contrast','전체 명암',50,150,100,'%','--ck17-contrast']
];
let values={},dialog,opener,frame=0;

/* v28: study background selection; the five existing comfort sliders remain intact. */
const presets=Object.freeze({
 forest:{label:'현재 녹색',color:'#244651'},
 lime:{label:'파스텔 연두',color:'#C5D7AC'},
 wood:{label:'우드 브라운',color:'#A58A73'}
});
const customDefault='#AFC4B2',forestDark='#0C2630';
function validHex(value){
 const s=String(value??'').trim().replace(/^#/,'');
 if(/^[0-9a-f]{3}$/i.test(s))return '#'+Array.from(s).map(c=>c+c).join('').toUpperCase();
 if(/^[0-9a-f]{6}$/i.test(s))return '#'+s.toUpperCase();
 return null;
}
const chosen=()=>Object.prototype.hasOwnProperty.call(presets,values.backgroundPreset)||values.backgroundPreset==='custom'?values.backgroundPreset:'forest';
const custom=()=>validHex(values.backgroundCustom)||customDefault;
const baseColor=()=>chosen()==='custom'?custom():presets[chosen()].color;
function tint(hex){
 const hue=values.hue||0,sat=values.saturation,bright=values.backgroundBrightness;
 if(hue===0&&sat===100&&bright===100)return hex;
 const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
 const hi=Math.max(...rgb),lo=Math.min(...rgb),delta=hi-lo;
 let h=0,l=(hi+lo)/2,a=0;
 if(delta){
  a=delta/(1-Math.abs(2*l-1));
  h=hi===rgb[0]?((rgb[1]-rgb[2])/delta)%6:hi===rgb[1]?(rgb[2]-rgb[0])/delta+2:(rgb[0]-rgb[1])/delta+4;
  h*=60;
 }
 h=(h+hue+720)%360;
 a=Math.max(0,Math.min(1,a*sat/100));
 l=Math.max(0,Math.min(1,l*bright/100));
 const c=(1-Math.abs(2*l-1))*a,x=c*(1-Math.abs(h/60%2-1)),m=l-c/2;
 const trio=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];
 return '#'+trio.map(v=>Math.round(Math.max(0,Math.min(1,v+m))*255).toString(16).padStart(2,'0')).join('').toUpperCase();
}
function syncStudyColor(){
 values.backgroundPreset=chosen();
 values.backgroundCustom=custom();
 const original=baseColor();
 root.style.setProperty('--ck17-study-background',tint(original));
 root.style.setProperty('--ck17-study-background-dark',tint(chosen()==='forest'?forestDark:original));
 root.style.setProperty('--ck17-selected-background',original);
 if(!dialog)return;
 const toggle=dialog.querySelector('[data-background-toggle]');
 if(toggle)toggle.setAttribute('aria-label','바탕색 변경: '+(chosen()==='custom'?'사용자 지정':presets[chosen()].label));
 for(const b of dialog.querySelectorAll('[data-background-preset]'))b.setAttribute('aria-pressed',String(b.dataset.backgroundPreset===chosen()));
 const area=dialog.querySelector('[data-background-custom]');
 if(area)area.hidden=chosen()!=='custom';
 const wheel=dialog.querySelector('[name="backgroundCustomPicker"]');
 if(wheel)wheel.value=values.backgroundCustom;
 const hex=dialog.querySelector('[name="backgroundCustomHex"]');
 if(hex&&document.activeElement!==hex){hex.value=values.backgroundCustom;hex.removeAttribute('aria-invalid')}
}
function backgroundControls(){
 const buttons=Object.entries(presets).map(([id,data])=>
  '<button type="button" class="ck17-bg-choice" data-background-preset="'+id+'" aria-pressed="false"><span class="ck17-bg-swatch" aria-hidden="true" style="--ck17-swatch:'+data.color+'"></span>'+data.label+'</button>'
 ).join('');
 return '<section id="ck17-background-panel" class="ck17-background-panel" aria-label="학습 화면 바탕색">'+
 '<p class="ck17-bg-help">학습 탭의 바깥 배경만 변경합니다. 학습 카드·칠판 색상은 그대로 유지됩니다.</p>'+
 '<div class="ck17-bg-choices" role="group" aria-label="바탕색 선택">'+buttons+
 '<button type="button" class="ck17-bg-choice" data-background-preset="custom" aria-pressed="false"><span class="ck17-bg-custom-swatch" aria-hidden="true"></span>사용자 지정</button></div>'+
 '<div class="ck17-custom-color" data-background-custom hidden>'+
 '<label for="ck17-background-wheel">원형 색상 선택<input id="ck17-background-wheel" type="color" name="backgroundCustomPicker" aria-label="원형 색상 선택기" value="'+customDefault+'"></label>'+
 '<label for="ck17-background-hex">HEX 색상 번호<input id="ck17-background-hex" type="text" name="backgroundCustomHex" aria-label="16진수 색상 번호" placeholder="#RRGGBB" maxlength="7" autocapitalize="characters" autocomplete="off" spellcheck="false" value="'+customDefault+'"></label>'+
 '</div><span data-background-message class="ck17-bg-message" role="status" aria-live="polite"></span></section>';
}

try{values=JSON.parse(localStorage.getItem(key)||'{}')||{}}catch(e){}
if(values.scenePaletteVersion!==36){
 if(values.saturation==null||(values.saturation===72||values.saturation===110))values.saturation=100;
 if(values.backgroundBrightness==null||(values.backgroundBrightness===92||values.backgroundBrightness===102))values.backgroundBrightness=100;
 values.scenePaletteVersion=36;
 try{localStorage.setItem(key,JSON.stringify(values))}catch{}
}
function apply(){
 fields.forEach(([id,,min,max,def,unit,css])=>{
  let val=Number(values[id]??def);if(!Number.isFinite(val))val=def;
  values[id]=Math.max(min,Math.min(max,val));
  root.style.setProperty(css,unit==='°'?values[id]+'deg':String(values[id]/100));
  const input=dialog?.querySelector('[name="'+id+'"]'),output=dialog?.querySelector('[data-value="'+id+'"]');
  if(input)input.value=values[id];if(output)output.textContent=values[id]+unit;
 });
 syncStudyColor();
}
function ensure(){
 if(dialog)return dialog;
 dialog=document.createElement('dialog');dialog.id='ck17-display-dialog';dialog.setAttribute('aria-labelledby','ck17-display-title');
 dialog.innerHTML='<header><h2 id="ck17-display-title">화면 편안함</h2><div class="ck17-header-actions">'+
 '<button type="button" data-background-toggle class="ck17-bg-toggle" aria-expanded="true" aria-controls="ck17-background-panel" title="학습 바탕색 변경"><span class="ck17-bg-current" aria-hidden="true"></span>바탕색</button>'+
 '<button type="button" data-close aria-label="화면 설정 닫기">×</button></div></header>'+
 backgroundControls()+
 fields.map(([id,label,min,max,def,unit],i)=>(i===0?'<h3>아기사자 바탕화면</h3>':i===3?'<h3>홈페이지 전체</h3>':'')+
 '<label>'+label+'<output data-value="'+id+'"></output><input type="range" name="'+id+'" min="'+min+'" max="'+max+'" step="1"></label>').join('')+
 '<footer><button type="button" data-reset>기본값 복원</button></footer>';
 document.body.append(dialog);
 dialog.addEventListener('input',e=>{
  const t=e.target;
  if(t.matches('input[type=range]')){values[t.name]=Number(t.value);apply();save();return}
  if(t.matches('[name="backgroundCustomPicker"]')){
   const color=validHex(t.value);if(!color)return;
   values.backgroundPreset='custom';values.backgroundCustom=color;apply();save();
   const msg=dialog.querySelector('[data-background-message]');if(msg)msg.textContent='';
  }
  if(t.matches('[name="backgroundCustomHex"]')){
   const color=validHex(t.value);
   if(color){values.backgroundPreset='custom';values.backgroundCustom=color;apply();save()}
   if(color||t.value.length<7)t.removeAttribute('aria-invalid');
   else t.setAttribute('aria-invalid','true');
   const msg=dialog.querySelector('[data-background-message]');if(msg)msg.textContent='';
  }
 });
 dialog.addEventListener('change',e=>{
  const t=e.target;if(!t.matches('[name="backgroundCustomHex"]'))return;
  const color=validHex(t.value),msg=dialog.querySelector('[data-background-message]');
  if(color){values.backgroundPreset='custom';values.backgroundCustom=color;t.value=color;t.removeAttribute('aria-invalid');apply();save();if(msg)msg.textContent=''}
  else{t.setAttribute('aria-invalid','true');if(msg)msg.textContent='HEX는 #RRGGBB 형식으로 입력하세요.'}
 });
 dialog.addEventListener('click',e=>{
  const toggle=e.target.closest('[data-background-toggle]');
  if(toggle){
   const panel=dialog.querySelector('#ck17-background-panel');
   panel.hidden=!panel.hidden;toggle.setAttribute('aria-expanded',String(!panel.hidden));return;
  }
  const btn=e.target.closest('[data-background-preset]');
  if(!btn)return;
  const id=btn.dataset.backgroundPreset;
  if(id!=='custom'&&!Object.prototype.hasOwnProperty.call(presets,id))return;
  values.backgroundPreset=id;apply();save();
  const msg=dialog.querySelector('[data-background-message]');if(msg)msg.textContent='';
 });
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
window.CK17Display=Object.freeze({getState:()=>({preset:chosen(),selectedColor:baseColor(),studyColor:tint(baseColor())})});
})();
