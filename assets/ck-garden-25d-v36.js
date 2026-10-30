// Approved artwork compositing. No WebGL, no third-party renderer, no image-wide bobbing.
(function(){
'use strict';
const motion=window.CKLegacyMotion37;
import('./ck-color-picker-v43.js');
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),svgNS='http://www.w3.org/2000/svg';
let rail3d=null;
let host,frame=0,last=0,time=0,frames=0,focused=true,samples=[],apples=[],path,active=false,birdHead,birdBody,peckStarted=-100,peckIndex=-1,headTilt=0,clouds=[],width=1536,pecks=0;
function apple(color,id){return `<g class="ck36-apple" data-fruit="${id}"><defs><radialGradient id="fruit${id}" cx=".3" cy=".22"><stop stop-color="${color[0]}"/><stop offset=".55" stop-color="${color[1]}"/><stop offset="1" stop-color="${color[2]}"/></radialGradient></defs><path d="M0 -14 C-8 -23 -28 -17 -27 1 C-26 20 -13 31 -2 26 Q0 24 3 26 C18 29 29 12 27 -3 C25 -20 10 -22 0 -14Z" fill="url(#fruit${id})"/><path d="M0 -14q-1 -13 5 -19" fill="none" stroke="#815333" stroke-width="4" stroke-linecap="round"/><path d="M3 -21q12 -15 24 -10q-4 16 -24 10" fill="#619d2d"/><ellipse cx="-13" cy="-7" rx="5" ry="8" fill="#fff" opacity=".35" transform="rotate(28 -13 -7)"/></g>`;}
function cloud(id){
 return Array.from({length:5},(_,j)=>`<i style="left:${8+j*17}%;top:${22-Math.sin(j*.83)*9}%;width:${29+(id+j)%3*3}%;height:${49+(j%2)*12}%"></i>`).join('');
}
// Static sculpted cumulus sits behind the drifting cloud layer.
function cumulus(id){
 const lobes=[[60,132,49],[111,104,60],[173,62,59],[226,102,57],[278,133,43],[162,132,77]];
 return `<svg viewBox="0 0 340 210" aria-hidden="true"><defs><radialGradient id="cumulus${id}" cx=".32" cy=".18" r=".85"><stop stop-color="#fffef8"/><stop offset=".4" stop-color="#f9fcff"/><stop offset=".72" stop-color="#d9e4ed"/><stop offset="1" stop-color="#a8bdcf"/></radialGradient><linearGradient id="mist${id}" x2="0" y2="1"><stop stop-color="#e9f1f8" stop-opacity="0"/><stop offset="1" stop-color="#a8c2d6" stop-opacity=".6"/></linearGradient></defs>${lobes.map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="url(#cumulus${id})"/>`).join('')}<ellipse cx="168" cy="165" rx="145" ry="26" fill="url(#mist${id})"/></svg>`;
}
// Bake a lit circular tube into a static SVG mesh. The fruit occludes the whole tube.
function rail(){
 const points=motion.points.filter((_,i)=>i%3===0),count=points.length-1,bands=28,radius=7.2,buckets=new Map();
 const nodes=points.slice(0,count).map((p,i)=>{
  const before=points[(i-1+count)%count],after=points[(i+1)%count],dx=after[0]-before[0],dy=after[1]-before[1],length=Math.hypot(dx,dy)||1;
  return {x:p[0],y:p[1],nx:-dy/length,ny:dx/length,r:radius*(.89+.11*(p[2]+8)/16)};
 });
 const color=(q,nx,ny)=>{
  const front=Math.sqrt(Math.max(0,1-q*q)),diffuse=Math.max(0,-.44*nx*q-.68*ny*q+.58*front);
  const specular=Math.pow(Math.max(0,-.25*nx*q-.39*ny*q+.886*front),18);
  const rim=Math.pow(front,.7),light=.36+.72*diffuse;
  const rgb=[24*light+160*specular+10*rim,148*light+140*specular+16*rim,212*light+110*specular+20*rim];
  return '#'+rgb.map(v=>Math.round(Math.min(255,v)/3)*3).map(v=>v.toString(16).padStart(2,'0')).join('');
 };
 const xy=(p,q)=>`${(p.x+p.nx*p.r*q).toFixed(2)},${(p.y+p.ny*p.r*q).toFixed(2)}`;
 for(let i=0;i<count;i++){
  const a=nodes[i],b=nodes[(i+1)%count];
  for(let j=0;j<bands;j++){
   // Slight strip overlap prevents subpixel light seams, entirely inside tube silhouette.
   const lo=Math.max(-1,-1+2*j/bands-.003),hi=Math.min(1,-1+2*(j+1)/bands+.003),q=(lo+hi)/2;
   const fill=color(q,(a.nx+b.nx)/2,(a.ny+b.ny)/2),d=`M${xy(a,lo)}L${xy(b,lo)}L${xy(b,hi)}L${xy(a,hi)}Z`;
   buckets.set(fill,(buckets.get(fill)||'')+d);
  }
 }
 const center=motion.points.map((p,i)=>(i?'L':'M')+p[0]+' '+p[1]).join(' ')+'Z';
 return `<path id="ck36-rail-path" d="${center}" fill="none" stroke="none"/><g class="ck41-ceramic-tube">${[...buckets].map(([fill,d])=>`<path d="${d}" fill="${fill}" stroke="${fill}" stroke-width=".35" stroke-linejoin="round"/>`).join('')}</g>`;
}
function perch(){return `<defs><linearGradient id="ck40-wood" x2="0" y2="1"><stop stop-color="#ebc891"/><stop offset=".32" stop-color="#bc8b50"/><stop offset=".7" stop-color="#916038"/><stop offset="1" stop-color="#5b3b27"/></linearGradient></defs><ellipse cx="46" cy="96" rx="63" ry="6" fill="#314327" opacity=".18"/><path d="M-13 80Q40 77 103 81L103 94Q40 90-13 94Z" fill="url(#ck40-wood)" stroke="#795336" stroke-width="1.2"/><ellipse cx="103" cy="87.5" rx="5" ry="6.5" fill="#d7ac72" stroke="#865b38"/><ellipse cx="103" cy="87.5" rx="2.5" ry="3.6" fill="none" stroke="#a67a48"/><path d="M-8 84Q21 81 50 84T96 85M-4 89Q23 86 45 89T94 90" stroke="#f2d2a0" stroke-opacity=".5" fill="none"/><path d="M28 88q8-6 14 0q-7 5-14 0M59 85q14 4 32 1" stroke="#784b2e" stroke-width="1" fill="none"/>`;}
function eyelids(){return `<svg class="ck38-eyelids" viewBox="0 0 1312 1184" aria-hidden="true"><defs><radialGradient id="ck38-lid"><stop offset="0" stop-color="#ffe593"/><stop offset=".7" stop-color="#f8cd6b"/><stop offset="1" stop-color="#dfa441"/></radialGradient></defs><g fill="url(#ck38-lid)"><path d="M488 373C485 275 646 265 663 371C683 486 493 495 488 373Z"/><path d="M834 449C843 346 980 350 1004 445C1023 566 825 564 834 449Z"/></g><g fill="none" stroke="#58311c" stroke-width="12" stroke-linecap="round"><path d="M505 401Q572 445 645 399"/><path d="M850 477Q920 520 988 468"/></g></svg>`;}
function isLanding(){return document.body.dataset.ckV8Tab==='landing';}
function allowed(){return isLanding()&&!document.hidden&&focused&&!reduced.matches;}
function layout(){if(!host||host.clientHeight<1)return;host.style.setProperty('--ck36-visible-height',Math.min(host.clientHeight,innerHeight)+'px');width=host.clientWidth;}
function sync(){if(isLanding())layout();active=allowed();host?.classList.toggle('ck36-paused',!active);if(host)host.dataset.ck36Active=String(active);if(!active){cancelAnimationFrame(frame);frame=0;last=0;}else if(!frame)frame=requestAnimationFrame(tick);}
function paint(dt=0){
 rail3d?.paint(time);
 const positions=[];
 for(let i=0;i<apples.length;i++){
  const u=(time/motion.lapSeconds+i/6)%1,n=u*(samples.length-1),a=samples[Math.floor(n)],b=samples[Math.min(samples.length-1,Math.floor(n)+1)],f=n%1;
  const x=a.x+(b.x-a.x)*f,y=a.y+(b.y-a.y)*f,z=a.z+(b.z-a.z)*f;positions.push({x,y});
  const scale=.84+(z+8)/15*.25;
  // Same .45 rad/sec axial spin as the preceding 3D apples, with a minimum width.
  apples[i].setAttribute('transform',`translate(${x} ${y}) scale(${scale*(.86+.14*Math.cos(time*.45+i*Math.PI/3))} ${scale})`);
 }
 if(birdHead){
  let nearest={i:-1,d:Infinity};positions.forEach((p,i)=>{const d=Math.hypot(p.x-673,p.y-547);if(d<nearest.d)nearest={i,d};});
  if(nearest.d<74&&nearest.i!==peckIndex&&time-peckStarted>1.15){peckStarted=time;peckIndex=nearest.i;host.dataset.ck37Pecks=String(++pecks);}
  if(nearest.d>103&&time-peckStarted>.85)peckIndex=-1;
  const progress=(time-peckStarted)/motion.peckSeconds,peck=progress>=0&&progress<=1?Math.pow(Math.sin(progress*Math.PI),1.1):0;
  const target=30.36*peck+Math.sin(time*.5)*1.14;
  headTilt+=(target-headTilt)*(1-Math.exp(-dt*9.3));
  birdHead.setAttribute('transform',`translate(${peck*5} ${peck*3}) rotate(${headTilt} 45 64)`);
  birdBody.setAttribute('transform',`translate(0 ${Math.sin(time*.67)*.8-peck*1.2})`);
  host.dataset.ck37Peck=String(peck>.08);
 }
 for(const cloud of clouds){const span=1536+cloud.width+160;const x=-cloud.width+((cloud.start+time*cloud.speed)%span);cloud.node.setAttribute('transform',`translate(${x.toFixed(2)} 0)`);}
}
function tick(ms){frame=0;if(!allowed())return;if(last&&ms-last<1000/24){frame=requestAnimationFrame(tick);return;}const dt=last?Math.min((ms-last)/1000,.1):0;last=ms;time+=dt;paint(dt);frames++;frame=requestAnimationFrame(tick);}
function boot(){
 host=document.getElementById('ck-v8-ambient');if(!host){document.addEventListener('DOMContentLoaded',boot,{once:true});return;}
 host.replaceChildren();host.removeAttribute('aria-hidden');host.classList.add('ck36-garden');host.dataset.renderer='artwork-25d';host.dataset.ck37LapSeconds=String(motion.lapSeconds);
 const colors=[['#ff9d78','#ee332c','#a31e20'],['#dbef73','#91c932','#4b8a24'],['#fff2a0','#f8c631','#c28b21']];
 host.innerHTML=`<img class="ck36-background" src="./assets/garden-clean-v37.webp" alt="" fetchpriority="high" decoding="async"><svg class="ck45-cloud-sky" viewBox="0 0 1536 1024" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><filter id="ck45-photo-key" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB"><feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  2.4 2.4 -2.5 0 -.8"/></filter><radialGradient id="ck45-edge" cx="50%" cy="45%" r="70%"><stop offset=".55" stop-color="white"/><stop offset=".85" stop-color="white"/><stop offset="1" stop-color="black"/></radialGradient><mask id="ck45-feather" maskUnits="userSpaceOnUse" x="0" y="0" width="428" height="339"><rect width="428" height="339" fill="url(#ck45-edge)"/></mask><symbol id="ck45-photo-cloud" viewBox="0 0 428 339"><g mask="url(#ck45-feather)"><image href="./assets/sky-reference-v44.png" x="0" y="0" width="428" height="339" filter="url(#ck45-photo-key)"/></g></symbol></defs><g class="ck45-drifter" data-start="520" data-width="380" data-speed="4.2"><use href="#ck45-photo-cloud" x="0" y="38" width="380" height="280" opacity=".83"/></g><g class="ck45-drifter" data-start="1310" data-width="300" data-speed="6.1"><use href="#ck45-photo-cloud" x="0" y="146" width="300" height="216" opacity=".76"/></g><g class="ck45-drifter" data-start="2050" data-width="450" data-speed="3.5"><use href="#ck45-photo-cloud" x="0" y="6" width="450" height="324" opacity=".69"/></g></svg><svg class="ck36-orbit" viewBox="0 0 1536 1024" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${rail()}${Array.from({length:6},(_,i)=>apple(colors[i%3],i)).join('')}<g transform="translate(600 503)"><defs><clipPath id="ck37-bird-upper"><rect width="92" height="63"/></clipPath><clipPath id="ck37-bird-lower"><rect y="57" width="92" height="38"/></clipPath></defs>${perch()}<g id="ck37-bird-body"><image href="./assets/bird-v37.webp" width="92" height="94" preserveAspectRatio="xMidYMid meet" clip-path="url(#ck37-bird-lower)"/><g id="ck37-bird-head"><image href="./assets/bird-v37.webp" width="92" height="94" preserveAspectRatio="xMidYMid meet" clip-path="url(#ck37-bird-upper)"/></g></g></g></svg><div class="ck36-contact ck36-contact-main"></div><button type="button" class="ck36-cub ck36-main" aria-label="아기사자를 눌러 몽당연필 동작 다시 재생"><span class="ck38-main-rig"><img src="./assets/cub-pencil-v36.webp" alt="빨간 몽당연필을 든 웃는 아기사자" decoding="async" draggable="false">${eyelids()}</span></button><div class="ck36-contact ck36-contact-sleep"></div><div class="ck36-cub ck36-sleep"><img src="./assets/cub-sleep-v36.webp" alt="눌린 상자를 베고 잠자는 동생 사자" decoding="async" draggable="false"><img class="ck38-sleep-body" src="./assets/cub-sleep-v36.webp" alt="" aria-hidden="true" draggable="false"></div><button type="button" class="ck36-scroll" aria-label="아래로 스크롤하여 학습 시작">SCROLL DOWN ↓</button>`;
 path=host.querySelector('#ck36-rail-path');samples=motion.points.map(p=>({x:p[0],y:p[1],z:p[2]}));apples=Array.from(host.querySelectorAll('.ck36-apple'));birdHead=host.querySelector('#ck37-bird-head');birdBody=host.querySelector('#ck37-bird-body');clouds=Array.from(host.querySelectorAll('.ck45-drifter'),node=>({node,start:Number(node.dataset.start),width:Number(node.dataset.width),speed:Number(node.dataset.speed)}));layout();paint();
 import('./ck-rail3d-v42.mjs').then(m=>{rail3d=m.mountRail(host,motion);rail3d.paint(time);}).catch(()=>{host.dataset.ck42Renderer='unavailable';});
 host.querySelector('.ck36-main').addEventListener('click',e=>{if(reduced.matches)return;const el=e.currentTarget;el.classList.remove('ck36-press');void el.offsetWidth;el.classList.add('ck36-press');});
 host.querySelector('.ck36-main').addEventListener('animationend',e=>{if(e.animationName==='ck36-press')e.currentTarget.classList.remove('ck36-press');});
 host.querySelector('.ck36-scroll').addEventListener('click',()=>document.querySelector('#main [data-go="home"]')?.click());
 new ResizeObserver(layout).observe(host);window.addEventListener('resize',layout,{passive:true});
 new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['data-ck-v8-tab']});
 window.addEventListener('ck:scene-activity',sync);window.addEventListener('blur',()=>{focused=false;sync()});window.addEventListener('focus',()=>{focused=true;sync()});document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);frame=0},{once:true});sync();
}
window.CK3DPerformance=Object.freeze({getState:()=>({renderer:rail3d?'hybrid-25d-webgl':'artwork-25d',active,idle:!active,frames,landing:isLanding(),webgl:!!rail3d,fpsCap:24})});
const launchDot=()=>import('./ck-dot-landing-v54.js').catch(err=>{console.error('Dot landing could not load; restoring previous garden',err);boot();});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',launchDot,{once:true});else launchDot();
})();
