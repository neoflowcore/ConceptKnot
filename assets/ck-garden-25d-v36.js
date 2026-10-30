// Approved artwork compositing. No WebGL, no third-party renderer, no image-wide bobbing.
(function(){
'use strict';
const motion=window.CKLegacyMotion37;
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),svgNS='http://www.w3.org/2000/svg';
let host,frame=0,last=0,time=0,frames=0,focused=true,samples=[],apples=[],path,active=false,birdHead,birdBody,peckStarted=-100,peckIndex=-1,headTilt=0,clouds=[],width=1536,pecks=0;
function apple(color,id){return `<g class="ck36-apple" data-fruit="${id}"><defs><radialGradient id="fruit${id}" cx=".3" cy=".22"><stop stop-color="${color[0]}"/><stop offset=".55" stop-color="${color[1]}"/><stop offset="1" stop-color="${color[2]}"/></radialGradient></defs><path d="M0 -14 C-8 -23 -28 -17 -27 1 C-26 20 -13 31 -2 26 Q0 24 3 26 C18 29 29 12 27 -3 C25 -20 10 -22 0 -14Z" fill="url(#fruit${id})"/><path d="M0 -14q-1 -13 5 -19" fill="none" stroke="#815333" stroke-width="4" stroke-linecap="round"/><path d="M3 -21q12 -15 24 -10q-4 16 -24 10" fill="#619d2d"/><ellipse cx="-13" cy="-7" rx="5" ry="8" fill="#fff" opacity=".35" transform="rotate(28 -13 -7)"/></g>`;}
function cloud(id){
 const puffs=Array.from({length:5},(_,j)=>{const rx=27+((id*17+j*11)%19),ry=16+((id*7+j*13)%15);return `<ellipse cx="${48+j*43}" cy="${52-Math.sin(j*.83)*11}" rx="${rx}" ry="${ry}" fill="url(#cl${id})"/>`;}).join('');
 return `<svg viewBox="0 0 280 105" aria-hidden="true"><defs><radialGradient id="cl${id}" cx=".32" cy=".16" r=".9"><stop stop-color="#fff"/><stop offset=".5" stop-color="#f6f9fc"/><stop offset=".82" stop-color="#d9e0e6"/><stop offset="1" stop-color="#b9c5cf"/></radialGradient></defs>${puffs}</svg>`;
}
function isLanding(){return document.body.dataset.ckV8Tab==='landing';}
function allowed(){return isLanding()&&!document.hidden&&focused&&!reduced.matches;}
function layout(){if(!host||host.clientHeight<1)return;host.style.setProperty('--ck36-visible-height',Math.min(host.clientHeight,innerHeight)+'px');width=host.clientWidth;}
function sync(){if(isLanding())layout();active=allowed();host?.classList.toggle('ck36-paused',!active);if(host)host.dataset.ck36Active=String(active);if(!active){cancelAnimationFrame(frame);frame=0;last=0;}else if(!frame)frame=requestAnimationFrame(tick);}
function paint(dt=0){
 const positions=[];
 for(let i=0;i<apples.length;i++){
  const u=(time/motion.lapSeconds+i/6)%1,n=u*(samples.length-1),a=samples[Math.floor(n)],b=samples[Math.min(samples.length-1,Math.floor(n)+1)],f=n%1;
  const x=a.x+(b.x-a.x)*f,y=a.y+(b.y-a.y)*f,z=a.z+(b.z-a.z)*f;positions.push({x,y});
  const scale=.84+(z+8)/15*.25;
  // Same .45 rad/sec axial spin as the preceding 3D apples, with a minimum width.
  apples[i].setAttribute('transform',`translate(${x} ${y}) scale(${scale*(.86+.14*Math.cos(time*.45+i*Math.PI/3))} ${scale})`);
 }
 if(birdHead){
  let nearest={i:-1,d:Infinity};positions.forEach((p,i)=>{const d=Math.hypot(p.x-673,p.y-535);if(d<nearest.d)nearest={i,d};});
  if(nearest.d<74&&nearest.i!==peckIndex&&time-peckStarted>1.15){peckStarted=time;peckIndex=nearest.i;host.dataset.ck37Pecks=String(++pecks);}
  if(nearest.d>103&&time-peckStarted>.85)peckIndex=-1;
  const progress=(time-peckStarted)/motion.peckSeconds,peck=progress>=0&&progress<=1?Math.pow(Math.sin(progress*Math.PI),1.1):0;
  const target=30.36*peck+Math.sin(time*.5)*1.14;
  headTilt+=(target-headTilt)*(1-Math.exp(-dt*9.3));
  birdHead.setAttribute('transform',`translate(${peck*5} ${peck*3}) rotate(${headTilt} 45 64)`);
  birdBody.setAttribute('transform',`translate(0 ${Math.sin(time*.67)*.8-peck*1.2})`);
  host.dataset.ck37Peck=String(peck>.08);
 }
 for(let i=0;i<clouds.length;i++){const x=((i*.217*width+time*(2.3+i*.18))%(width+450))-250;clouds[i].style.transform=`translate3d(${x.toFixed(2)}px,0,0)`;}
}
function tick(ms){frame=0;if(!allowed())return;if(last&&ms-last<1000/24){frame=requestAnimationFrame(tick);return;}const dt=last?Math.min((ms-last)/1000,.1):0;last=ms;time+=dt;paint(dt);frames++;frame=requestAnimationFrame(tick);}
function boot(){
 host=document.getElementById('ck-v8-ambient');if(!host){document.addEventListener('DOMContentLoaded',boot,{once:true});return;}
 host.replaceChildren();host.removeAttribute('aria-hidden');host.classList.add('ck36-garden');host.dataset.renderer='artwork-25d';host.dataset.ck37LapSeconds=String(motion.lapSeconds);
 const colors=[['#ff9d78','#ee332c','#a31e20'],['#dbef73','#91c932','#4b8a24'],['#fff2a0','#f8c631','#c28b21']];
 host.innerHTML=`<img class="ck36-background" src="./assets/garden-clean-v37.webp" alt="" fetchpriority="high" decoding="async"><div class="ck36-clouds" aria-hidden="true">${[0,1,2,3,4,5].map(i=>`<div class="ck36-cloud ck36-cloud-${i}">${cloud(i)}</div>`).join('')}</div><svg class="ck36-orbit" viewBox="0 0 1536 1024" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><path id="ck36-rail-path" d="${motion.points.map((p,i)=>(i?'L':'M')+p[0]+' '+p[1]).join(' ')}Z" fill="none" stroke="#0e6bb3" stroke-width="11" stroke-linejoin="round"/><path d="${motion.points.map((p,i)=>(i?'L':'M')+p[0]+' '+p[1]).join(' ')}Z" stroke="#74d6ff" stroke-width="3" fill="none" stroke-linejoin="round" transform="translate(0 -2)" opacity=".8"/>${Array.from({length:6},(_,i)=>apple(colors[i%3],i)).join('')}<g transform="translate(600 491)"><defs><clipPath id="ck37-bird-upper"><rect width="92" height="63"/></clipPath><clipPath id="ck37-bird-lower"><rect y="57" width="92" height="38"/></clipPath></defs><path d="M-5 94H95" stroke="#805834" stroke-width="5" stroke-linecap="round"/><g id="ck37-bird-body"><image href="./assets/bird-v37.webp" width="92" height="94" preserveAspectRatio="xMidYMid meet" clip-path="url(#ck37-bird-lower)"/><g id="ck37-bird-head"><image href="./assets/bird-v37.webp" width="92" height="94" preserveAspectRatio="xMidYMid meet" clip-path="url(#ck37-bird-upper)"/></g></g></g></svg><div class="ck36-contact ck36-contact-main"></div><button type="button" class="ck36-cub ck36-main" aria-label="아기사자를 눌러 몽당연필 동작 다시 재생"><img src="./assets/cub-pencil-v36.webp" alt="빨간 몽당연필을 든 웃는 아기사자" decoding="async" draggable="false"></button><div class="ck36-contact ck36-contact-sleep"></div><div class="ck36-cub ck36-sleep"><img src="./assets/cub-sleep-v36.webp" alt="눌린 상자를 베고 잠자는 동생 사자" decoding="async" draggable="false"></div><button type="button" class="ck36-scroll" aria-label="아래로 스크롤하여 학습 시작">SCROLL DOWN ↓</button>`;
 path=host.querySelector('#ck36-rail-path');samples=motion.points.map(p=>({x:p[0],y:p[1],z:p[2]}));apples=Array.from(host.querySelectorAll('.ck36-apple'));birdHead=host.querySelector('#ck37-bird-head');birdBody=host.querySelector('#ck37-bird-body');clouds=Array.from(host.querySelectorAll('.ck36-cloud'));layout();paint();
 host.querySelector('.ck36-main').addEventListener('click',e=>{if(reduced.matches)return;const el=e.currentTarget;el.classList.remove('ck36-press');void el.offsetWidth;el.classList.add('ck36-press');});
 host.querySelector('.ck36-main').addEventListener('animationend',e=>{if(e.animationName==='ck36-press')e.currentTarget.classList.remove('ck36-press');});
 host.querySelector('.ck36-scroll').addEventListener('click',()=>document.querySelector('#main [data-go="home"]')?.click());
 new ResizeObserver(layout).observe(host);window.addEventListener('resize',layout,{passive:true});
 new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['data-ck-v8-tab']});
 window.addEventListener('ck:scene-activity',sync);window.addEventListener('blur',()=>{focused=false;sync()});window.addEventListener('focus',()=>{focused=true;sync()});document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);frame=0},{once:true});sync();
}
window.CK3DPerformance=Object.freeze({getState:()=>({renderer:'artwork-25d',active,idle:!active,frames,landing:isLanding(),webgl:false,fpsCap:24})});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
