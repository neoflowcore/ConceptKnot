const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const js = read('assets/ck-dot-landing-v50.js');
const css = read('assets/ck-dot-landing-v50.css');
assert.ok(js.includes('ck-dot-cumulus-v47.webp'), 'original cloud is retained');
assert.ok(js.includes('const smooth = t * t * (3 - 2 * t)'), 'ground-edge dot taper is smoothstep');
assert.ok(js.includes('dotScale = background ? (1 - .99 * smooth)'), 'large dots shrink gradually into grass');
assert.ok(js.includes('small.node.style.opacity = (.92 * arriving * leaving)'), 'small clouds fade in and out at edges');
assert.ok(js.includes('const start = bounds.left - small.width - margin'), 'clouds recycle only outside actual viewport left');
assert.ok(js.includes('const end = bounds.right + margin'), 'clouds recycle only outside actual viewport right');
assert.ok(js.includes('state.cloudBounds = {'), 'live cloud coordinate bounds');
assert.ok(js.includes('sky?.getBoundingClientRect?.()'), 'true SVG screen geometry');

// Reproduce the CSS centering geometry across narrow / wide viewport layouts.
// Recycling points must never fall inside the physical viewport.
for(const [viewWidth, skyWidth] of [[430,408],[720,684],[1440,1080],[1920,1080]]){
  const scale=1244/skyWidth, offset=(viewWidth-skyWidth)/2;
  const left=(0-offset)*scale, right=(viewWidth-offset)*scale;
  const cloudWidth=174, margin=44;
  const start=left-cloudWidth-margin, end=right+margin;
  assert.ok(start+cloudWidth < left, 'reset start is offscreen on '+viewWidth);
  assert.ok(end > right, 'reset end is offscreen on '+viewWidth);
  for(const speed of [8.2,12]){
    const span=end-start;
    let prior=null, wraps=0;
    for(let time=0;time<360;time+=.08){
      const travelled=(410+time*speed)%span;
      const x=start+travelled;
      if(prior!==null && x<prior-200){
        wraps++;
        assert.ok(prior>right, 'departure is outside the right edge');
        assert.ok(x+cloudWidth<left, 'arrival is outside the left edge');
      }
      prior=x;
    }
    assert.ok(wraps>=1,'cloud wraps at '+viewWidth+'px with '+speed+'u/s');
  }
}
// The transition starts at full dot size and tapers without discontinuous steps.
const taper=y=>{const t=Math.max(0,Math.min(1,(y-.52)/.24));const smooth=t*t*(3-2*t);return 1-.99*smooth};
let prev=1;
for(let y=.52;y<=.761;y+=.002){
 const x=taper(y);assert.ok(x<=prev+1e-12,'radius never grows toward the ground');
 assert.ok(prev-x<.016,'radius gradually fades, no hard step');prev=x;
}
assert.ok(taper(.52)>.99&&taper(.76)<.011,'dot transition is full-size to almost invisible');

assert.equal((js.match(/stampSmallCloud\(cloud, /g)||[]).length,2, 'only 2 drifting small clouds');
assert.ok(js.includes('for(let index=0;index<2;index++)'), 'two viewport-anchored music notes');
assert.ok(js.includes('translate(600 596)'), 'owl is lowered to collision-level fruit');
assert.ok(js.includes('p.x - 670, p.y - 563'), 'fruit alignment target');
assert.ok(css.includes('ck-dot-scroll-float-v48') && css.includes('translate(-50%, -4px)'), 'scroll gently floats without horizontal jump');
assert.ok(css.includes('.ck-dot-paused .ck-dot-scroll'), 'scroll stops in study view');
assert.ok(css.includes('prefers-reduced-motion:reduce'), 'reduced motion supported');
assert.ok(!js.includes("import('./ck-rail3d"), 'no 3d renderer');
let frameId=0,frames=new Map(),cancelled=[],mutationCallback=null;
class E {
  constructor(tag){this.tag=tag;this.children=[];this.attrs={};this.style={setProperty:(n,v)=>{this.style[n]=v}};
    this.dataset={};this.clientHeight=1024;this.clientWidth=1536;this.listeners={};this.className='';
    const self=this;this.classList={add:(...names)=>{self.className=Array.from(new Set((self.className+' '+names.join(' ')).trim().split(' '))).join(' ')},
       remove:(...names)=>{self.className=self.className.split(' ').filter(x=>!names.includes(x)).join(' ')},
       toggle:(name,on)=>{if(on===false)self.classList.remove(name);else if(on===true||!self.className.split(' ').includes(name))self.classList.add(name);else self.classList.remove(name)}};}
  setAttribute(k,v){this.attrs[k]=String(v); if(k==='class')this.className=String(v);
    if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=String(v);}
  getAttribute(k){return this.attrs[k]??null}
  appendChild(n){n.ownerSVGElement=this.tag==='svg'?this:this.ownerSVGElement;this.children.push(n);return n}
  replaceChildren(...nodes){this.children=[...nodes]}
  getBoundingClientRect(){
    if(this.tag==='svg'&&this.className.includes('ck-dot-cloud'))return {left:180,right:1260,width:1080,top:20,bottom:340,height:320};
    return {left:0,right:1440,width:1440,top:0,bottom:900,height:900};
  }
  addEventListener(t,fn){this.listeners[t]=fn}
  querySelectorAll(selector){
    if(selector==='[data-dot-image]')return []; // asynchronous raster conversion is not relevant to animation checks
    const out=[]; const match = el => {
      if(selector.startsWith('[data-'))return el.attrs[selector.slice(1,-1)]!==undefined;
      if(selector.startsWith('.'))return el.className.split(' ').includes(selector.slice(1));
      return false;
    };
    const visit=el=>{for(const c of el.children){if(match(c))out.push(c);visit(c)}};
    visit(this);return out;
  }
}
const host=new E('div'), head=new E('head');
const body=new E('body');body.dataset.ckV8Tab='landing';
const doc={body,head,hidden:false,readyState:'complete',hasFocus:()=>true,
  getElementById:(id)=>id==='ck-v8-ambient'?host:null,
  createElement:tag=>new E(tag),createElementNS:(ns,tag)=>new E(tag),
  querySelector:()=>null,addEventListener:()=>{}};
const fakeMedia={matches:false,addEventListener:()=>{}};
const win={innerHeight:1024,addEventListener:()=>{},CKLegacyMotion37:{lapSeconds:17,peckSeconds:.62,
  points:Array.from({length:201},(_,i)=>[670+63*Math.cos(Math.PI*2*i/200),563+35*Math.sin(Math.PI*2*i/200),0])}};
const sandbox={document:doc,window:win,matchMedia:()=>fakeMedia,Image:class {},
  ResizeObserver:class {observe(){}},MutationObserver:class {constructor(cb){mutationCallback=cb} observe(){}},
  requestAnimationFrame:(fn)=>{const id=++frameId;frames.set(id,fn);return id},
  cancelAnimationFrame:id=>{frames.delete(id);cancelled.push(id)},Math,Set,Map,Object,String,Number,Array,console};
vm.runInNewContext(js,sandbox,{timeout:4000});
const active=win.CK3DPerformance.getState();
assert.equal(active.renderer,'monochrome-dot-v50-seamless-cloud-taper');
assert.equal(active.smallClouds,2);
assert.equal(active.musicNotes,2);
assert.equal(active.flowers,3);
assert.equal(active.webgl,false);
assert.equal(active.fpsCap,24);
assert.equal(host.querySelectorAll('[data-dot-small-cloud]').length,2);
assert.equal(host.querySelectorAll('[data-dot-music-note]').length,2);
assert.equal(host.querySelectorAll('.ck-dot-note-icon').length,2,'both edge notes rendered in the viewport');
const small=host.querySelectorAll('[data-dot-small-cloud]');
const edge=host.querySelectorAll('.ck-dot-cumulus-edge-dot');
const notes=host.querySelectorAll('[data-dot-note-top]');
assert.ok(edge.length>50&&edge.length<100,'limited reactive edge points');
assert.ok(active.movingNoteDots>0&&active.movingNoteDots<100,'only minority of note points active');
assert.equal(active.rgbDots,22,'preserve RGB dots without scope creep');
assert.ok(active.cloudViewportWidth > 1600, 'viewport extent converted from actual SVG pixels');
assert.equal(host.querySelectorAll('[data-dot-apple-color]').length,6,'all colored apples preserved');
assert.equal(host.querySelectorAll('.ck-dot-notes').length,1,'notes front layer exists');
const blinking=host.querySelectorAll('.ck-dot-registered-blink');
assert.equal(blinking.length,1,'one precisely registered closed-eye image, not ellipse masks');
assert.match(blinking[0].src,/ck-dot-lion-closed-v49\.webp$/,'exact-asset blink frame');
assert.equal(host.querySelectorAll('[data-dot-lion-blink]').length,0,'old white ellipse eyelid mask removed');
assert.ok(js.includes('ck-dot-owl-tight-v49.webp'),'trimmed owl asset used');
assert.ok(!js.includes('ck-dot-owl-v47.webp'),'old owl silhouette not displayed');
assert.equal(host.querySelectorAll('.ck-dot-contour').length,2,'lawn curves all stippled');
assert.equal(host.querySelectorAll('.ck-dot-orbit-rail').length,1,'rail rendered as one dotted line');
assert.ok(css.includes('z-index: 7') && css.includes('.ck-dot-notes'),'music notes above lion cutouts');
const first=small[0].getAttribute('transform');
const firstEdge=edge.map(e=>e.getAttribute('cy'));
const firstNote=notes[0].getAttribute('transform');
for(let t=1000;t<15000;t+=60){const framesNow=[...frames.values()];frames.clear();for(const fn of framesNow)fn(t)}
assert.notEqual(small[0].getAttribute('transform'),first,'small cloud drifts');
assert.ok(edge.some((e,i)=>e.getAttribute('cy')!==firstEdge[i]),'cumulus bottom changes locally');
assert.notEqual(notes[0].getAttribute('transform'),firstNote,'top 20 percent music dots move');
assert.ok(win.CK3DPerformance.getState().pecks>0,'owl headbutt loops on apple approach');
// Fast-forward the real scene clock through a complete cloud lap.
// The X-coordinate may jump only when BOTH the old and new positions are invisible.
let wrapCount=0,visibleTeleport=0,partialFades=0,lastCloudX=null,lastCloudOpacity=null;
for(let t=15000;t<250000;t+=80){
  const pending=[...frames.values()];frames.clear();for(const fn of pending)fn(t);
  const transform=small[0].getAttribute('transform');
  const x=Number(transform.match(/translate\((-?[\d.]+)/)[1]);
  const a=Number(small[0].style.opacity);
  if(a>.02&&a<.90)partialFades++;
  if(lastCloudX!==null&&x<lastCloudX-300){
    wrapCount++;
    if(a>.02||lastCloudOpacity>.02)visibleTeleport++;
  }
  lastCloudX=x;lastCloudOpacity=a;
}
assert.ok(wrapCount>=1,'drifting cloud completes at least one lap');
assert.equal(visibleTeleport,0,'cloud wrap must be fully outside the visible viewport');
assert.ok(partialFades>20,'cloud fade in/out transition is gradual, not a sudden image cut');

assert.ok(edge.some(node=>['#ef4348','#42bf67','#4384ee'].includes(node.getAttribute('fill'))),'selected cloud rim dots pulse RGB while small clouds pass');
assert.ok(win.CK3DPerformance.getState().frames>0,'scene animates on landing');
// Simulate a blur and study-tab change. Background animation should not continue.
const cb=host.querySelectorAll('.ck-dot-music-note')[0];
assert.ok(cb);
const moveCount=win.CK3DPerformance.getState().frames;
body.dataset.ckV8Tab='home';
mutationCallback();
assert.equal(win.CK3DPerformance.getState().landing,false);
assert.equal(win.CK3DPerformance.getState().active,false);
assert.equal(frames.size,0,'all animation frames cancelled when study tab opens');
assert.ok(cancelled.length>0,'frame cancellation was invoked');
assert.equal(host.dataset.ckDotActive,'false');
body.dataset.ckV8Tab='landing'; mutationCallback();
assert.equal(win.CK3DPerformance.getState().active,true,'landing animation resumes');
assert.equal(frames.size,1,'only one requestAnimationFrame loop resumes');
assert.match(js,/if \(!canRun\) \{ cancelAnimationFrame\(state\.frame\)/,'study-tab motion cancels clock');
console.log('Dot landing v50 dynamic contract: PASS', {cloudWraps:wrapCount,visibleTeleport,partialFades,clouds:active.clouds,notes:active.musicNotes,reactiveEdgeDots:edge.length,movingNoteDots:active.movingNoteDots,owlBumps:win.CK3DPerformance.getState().pecks,frames:moveCount});
