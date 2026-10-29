// Approved artwork compositing. No WebGL, no third-party renderer, no image-wide bobbing.
(function(){
'use strict';
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),svgNS='http://www.w3.org/2000/svg';
let host,frame=0,last=0,time=0,frames=0,focused=true,samples=[],apples=[],path,active=false;
function apple(color,id){return `<g class="ck36-apple" data-fruit="${id}"><defs><radialGradient id="fruit${id}" cx=".3" cy=".22"><stop stop-color="${color[0]}"/><stop offset=".55" stop-color="${color[1]}"/><stop offset="1" stop-color="${color[2]}"/></radialGradient></defs><path d="M0 -14 C-8 -23 -28 -17 -27 1 C-26 20 -13 31 -2 26 Q0 24 3 26 C18 29 29 12 27 -3 C25 -20 10 -22 0 -14Z" fill="url(#fruit${id})"/><path d="M0 -14q-1 -13 5 -19" fill="none" stroke="#815333" stroke-width="4" stroke-linecap="round"/><path d="M3 -21q12 -15 24 -10q-4 16 -24 10" fill="#619d2d"/><ellipse cx="-13" cy="-7" rx="5" ry="8" fill="#fff" opacity=".35" transform="rotate(28 -13 -7)"/></g>`;}
function cloud(id){return `<svg viewBox="0 0 280 105" aria-hidden="true"><defs><linearGradient id="cl${id}" x2="0" y2="1"><stop stop-color="#fff"/><stop offset=".65" stop-color="#f8fbff"/><stop offset="1" stop-color="#cbd7e0"/></linearGradient></defs><g fill="url(#cl${id})"><ellipse cx="133" cy="73" rx="121" ry="24"/><ellipse cx="58" cy="57" rx="42" ry="28"/><ellipse cx="108" cy="46" rx="47" ry="38"/><ellipse cx="163" cy="35" rx="43" ry="34"/><ellipse cx="208" cy="56" rx="49" ry="29"/></g></svg>`;}
function isLanding(){return document.body.dataset.ckV8Tab==='landing';}
function allowed(){return isLanding()&&!document.hidden&&focused&&!reduced.matches;}
function layout(){if(!host||host.clientHeight<1)return;host.style.setProperty('--ck36-visible-height',Math.min(host.clientHeight,innerHeight)+'px');}
function sync(){if(isLanding())layout();active=allowed();host?.classList.toggle('ck36-paused',!active);if(host)host.dataset.ck36Active=String(active);if(!active){cancelAnimationFrame(frame);frame=0;last=0;}else if(!frame)frame=requestAnimationFrame(tick);}
function paint(){for(let i=0;i<apples.length;i++){const u=(time/19+i/6)%1,n=u*(samples.length-1),a=samples[Math.floor(n)],b=samples[Math.min(samples.length-1,Math.floor(n)+1)],f=n%1;apples[i].setAttribute('transform',`translate(${a.x+(b.x-a.x)*f} ${a.y+(b.y-a.y)*f}) rotate(${Math.sin(time*.65+i)*7})`);}}
function tick(ms){frame=0;if(!allowed())return;if(last&&ms-last<1000/24){frame=requestAnimationFrame(tick);return;}const dt=last?Math.min((ms-last)/1000,.1):0;last=ms;time+=dt;paint();frames++;frame=requestAnimationFrame(tick);}
function boot(){
 host=document.getElementById('ck-v8-ambient');if(!host){document.addEventListener('DOMContentLoaded',boot,{once:true});return;}
 host.replaceChildren();host.removeAttribute('aria-hidden');host.classList.add('ck36-garden');host.dataset.renderer='artwork-25d';
 const colors=[['#ff9d78','#ee332c','#a31e20'],['#dbef73','#91c932','#4b8a24'],['#fff2a0','#f8c631','#c28b21']];
 host.innerHTML=`<img class="ck36-background" src="./assets/garden-plate-v36.webp" alt="" fetchpriority="high" decoding="async"><div class="ck36-clouds" aria-hidden="true">${[0,1,2,3].map(i=>`<div class="ck36-cloud ck36-cloud-${i}">${cloud(i)}</div>`).join('')}</div><svg class="ck36-orbit" viewBox="0 0 1536 1024" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><path id="ck36-rail-path" d="M461 478 C461 461 520 451 551 423 C605 361 712 345 790 359 C910 371 1054 423 1094 475 C1143 533 966 572 807 571 C635 573 492 534 461 478Z" fill="none" stroke="none"/>${Array.from({length:6},(_,i)=>apple(colors[i%3],i)).join('')}</svg><div class="ck36-contact ck36-contact-main"></div><button type="button" class="ck36-cub ck36-main" aria-label="아기사자를 눌러 몽당연필 동작 다시 재생"><img src="./assets/cub-pencil-v36.webp" alt="빨간 몽당연필을 든 웃는 아기사자" decoding="async" draggable="false"></button><div class="ck36-contact ck36-contact-sleep"></div><div class="ck36-cub ck36-sleep"><img src="./assets/cub-sleep-v36.webp" alt="눌린 상자를 베고 잠자는 동생 사자" decoding="async" draggable="false"></div><button type="button" class="ck36-scroll" aria-label="아래로 스크롤하여 학습 시작">SCROLL DOWN ↓</button>`;
 path=host.querySelector('#ck36-rail-path');const length=path.getTotalLength();samples=Array.from({length:721},(_,i)=>path.getPointAtLength(length*i/720));apples=Array.from(host.querySelectorAll('.ck36-apple'));paint();layout();
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
