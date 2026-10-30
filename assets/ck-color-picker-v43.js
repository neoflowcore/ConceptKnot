// One accessible colour editor for PDF ink and custom chalk. CMYK is a screen conversion.
(()=>{
'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const hsv=(h,s,v)=>{const k=n=>(n+h/60)%6,f=n=>v-v*s*Math.max(0,Math.min(k(n),4-k(n),1));return [f(5),f(3),f(1)].map(x=>Math.round(x*255));};
const hex=rgb=>'#'+rgb.map(x=>clamp(Math.round(x),0,255).toString(16).padStart(2,'0')).join('');
let target,dialog,rgb=[231,91,101],hue=0,sat=0,value=1,drag=false;
function fromRGB(next){rgb=next.map(x=>clamp(Math.round(x),0,255));const [r,g,b]=rgb.map(x=>x/255),hi=Math.max(r,g,b),lo=Math.min(r,g,b),d=hi-lo;value=hi;sat=hi?d/hi:0;hue=d?((hi===r?(g-b)/d+(g<b?6:0):hi===g?(b-r)/d+2:(r-g)/d+4)*60):0;}
function refresh(){
 dialog.querySelector('[data-hex]').value=hex(rgb);dialog.querySelector('[data-rgb]').value=rgb.join(', ');
 const [r,g,b]=rgb.map(x=>x/255),k=1-Math.max(r,g,b),c=k===1?0:(1-r-k)/(1-k),m=k===1?0:(1-g-k)/(1-k),y=k===1?0:(1-b-k)/(1-k);
 dialog.querySelector('[data-cmyk]').value=[c,m,y,k].map(x=>Math.round(x*100)).join(', ');
 dialog.querySelector('[data-preview]').style.background=hex(rgb);dialog.querySelector('[data-value]').value=Math.round(value*100);
 const marker=dialog.querySelector('[data-marker]'),angle=hue*Math.PI/180;marker.style.left=(100+sat*96*Math.cos(angle))+'px';marker.style.top=(100+sat*96*Math.sin(angle))+'px';
 dialog.querySelector('[data-error]').textContent='';
}
function paintWheel(){const canvas=dialog.querySelector('canvas'),ctx=canvas.getContext('2d'),data=ctx.createImageData(200,200);for(let y=0;y<200;y++)for(let x=0;x<200;x++){const dx=x-100,dy=y-100,r=Math.hypot(dx,dy)/96;if(r>1)continue;const color=hsv((Math.atan2(dy,dx)*180/Math.PI+360)%360,r,1),i=(y*200+x)*4;data.data.set([...color,Math.min(255,(1-r)*255*40)],i);}ctx.putImageData(data,0,0);}
function wheel(e){const rect=e.currentTarget.getBoundingClientRect(),x=(e.clientX-rect.left)*200/rect.width-100,y=(e.clientY-rect.top)*200/rect.height-100;hue=(Math.atan2(y,x)*180/Math.PI+360)%360;sat=clamp(Math.hypot(x,y)/96,0,1);rgb=hsv(hue,sat,value);refresh();}
function build(){
 dialog=document.createElement('dialog');dialog.className='ck43-color-dialog';dialog.setAttribute('aria-label','색상 직접 선택');
 dialog.innerHTML='<form method="dialog"><header><strong>색상</strong><button value="cancel" aria-label="색상 창 닫기">×</button></header><div class="ck43-wheel"><canvas width="200" height="200" aria-label="원형 색상 선택기"></canvas><i data-marker></i></div><label class="ck43-value">밝기 <input data-value type="range" min="0" max="100" aria-label="색상 밝기"></label><div data-preview class="ck43-preview"></div><label>HEX<input data-hex aria-label="HEX 색상" spellcheck="false"></label><label>RGB<input data-rgb aria-label="RGB 한 번에 입력" placeholder="231, 91, 101"></label><label>CMYK<input data-cmyk aria-label="CMYK 한 번에 입력" placeholder="0, 61, 56, 9"></label><small>RGB 0–255 · CMYK 0–100% (화면 색상 환산)</small><p data-error role="status"></p><footer><button value="cancel">취소</button><button type="button" data-apply>적용</button></footer></form>';
 document.body.append(dialog);paintWheel();const canvas=dialog.querySelector('canvas');canvas.addEventListener('pointerdown',e=>{drag=true;canvas.setPointerCapture(e.pointerId);wheel(e);});canvas.addEventListener('pointermove',e=>{if(drag)wheel(e);});for(const ev of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(ev,()=>drag=false);
 dialog.querySelector('[data-value]').addEventListener('input',e=>{value=Number(e.target.value)/100;rgb=hsv(hue,sat,value);refresh();});
 dialog.addEventListener('change',e=>{
  const el=e.target;let next=null;
  if(el.matches('[data-hex]')&&/^#?[\da-f]{6}$/i.test(el.value.trim())){const s=el.value.trim().replace('#','');next=[0,2,4].map(i=>parseInt(s.slice(i,i+2),16));}
  if(el.matches('[data-rgb],[data-cmyk]')){const a=el.value.trim().replace(/(?:rgb|cmyk)\s*\(/i,'').replace(/[)%]/g,'').split(/[\s,;]+/).map(Number),cmyk=el.hasAttribute('data-cmyk'),max=cmyk?100:255;if(a.length===(cmyk?4:3)&&a.every(x=>Number.isFinite(x)&&x>=0&&x<=max))next=cmyk?a.slice(0,3).map(x=>255*(1-x/100)*(1-a[3]/100)):a;}
  if(next){fromRGB(next);refresh();}else if(el.matches('[data-hex],[data-rgb],[data-cmyk]'))dialog.querySelector('[data-error]').textContent='숫자 범위와 입력 형식을 확인해 주세요.';
 });
 dialog.querySelector('[data-apply]').addEventListener('click',()=>{if(dialog.querySelector('[data-error]').textContent)return;target.value=hex(rgb);target.dispatchEvent(new Event('input',{bubbles:true}));target.dispatchEvent(new Event('change',{bubbles:true}));dialog.close('apply');});
 dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close('cancel');});
 dialog.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.matches('input:not([type=range])')){e.preventDefault();e.target.dispatchEvent(new Event('change',{bubbles:true}));}});
}
document.addEventListener('click',e=>{const input=e.target.closest('input[type="color"]');if(!input)return;e.preventDefault();if(!dialog)build();target=input;fromRGB([1,3,5].map(i=>parseInt(input.value.slice(i,i+2),16)));refresh();dialog.showModal();},true);
})();
