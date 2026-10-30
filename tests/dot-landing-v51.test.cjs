const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const js = fs.readFileSync(path.join(root, 'assets/ck-dot-landing-v51.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'assets/ck-dot-landing-v51.css'), 'utf8');
assert.match(js, /host\.appendChild\(seededCloud\(\)\)/);
assert.match(js, /host\.appendChild\(orbit\(\)\)/);
assert.match(js, /host\.appendChild\(bird\(\)\)/);
assert.match(js, /host\.appendChild\(scroll\)/);
assert.doesNotMatch(js, /host\.appendChild\(lineLawn\(\)\)/);
assert.doesNotMatch(js, /host\.appendChild\(notesLayer\(\)\)/);
assert.doesNotMatch(js, /host\.appendChild\(makeCub\(/);
assert.doesNotMatch(js, /host\.appendChild\(backdrop\)/);
assert.doesNotMatch(js, /\sconvertAssets\(\);/);
assert.match(js, /SCROLL DOWN ↓/);
assert.match(js, /ck-dot-landing-v51\.css/);
assert.match(css, /background: #fff !important/);
assert.match(css, /ck-dot-scroll-float-v48 2\.9s/);
assert.match(css, /@media \(max-width:600px\)/);
assert.match(css, /prefers-reduced-motion:reduce/);
assert.doesNotMatch(css, /\.ck-dot-lawn/);
assert.doesNotMatch(css, /\.ck-dot-backdrop/);
assert.doesNotMatch(css, /\.ck-dot-cub/);
let nextFrame=0, frames=new Map(), mutationCallback, scrollClicked=0;
class Elem {
  constructor(tag){ this.tag=tag; this.children=[]; this.attrs={}; this.style={setProperty:(k,v)=>{this.style[k]=v}};
    this.dataset={}; this.clientHeight=900; this.clientWidth=1440; this.className=''; this.listeners={};
    this.classList={add:(...n)=>{this.className=[...new Set([...this.className.split(' '),...n].filter(Boolean))].join(' ')},
      remove:(...n)=>{this.className=this.className.split(' ').filter(x=>!n.includes(x)).join(' ')},
      toggle:(n,on)=>{if(on===false)this.classList.remove(n);else if(on===true||!this.className.split(' ').includes(n))this.classList.add(n);else this.classList.remove(n)}};
  }
  setAttribute(k,v){this.attrs[k]=String(v); if(k==='class')this.className=String(v);if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=String(v)}
  getAttribute(k){return this.attrs[k]??null}
  appendChild(el){el.ownerSVGElement=this.tag==='svg'?this:this.ownerSVGElement;this.children.push(el);return el}
  replaceChildren(...els){this.children=[...els]}
  addEventListener(k,fn){this.listeners[k]=fn}
  getBoundingClientRect(){return this.tag==='svg'&&this.className.includes('ck-dot-cloud')?
    {left:180,right:1260,width:1080,top:20,bottom:340,height:320}:
    {left:0,right:1440,width:1440,top:0,bottom:900,height:900}}
  querySelectorAll(q){const out=[];const has=el=>q.startsWith('.')?el.className.split(' ').includes(q.slice(1)):
    q.startsWith('[data-')?el.attrs[q.slice(1,-1)]!==undefined:false;
    const visit=el=>{for(const c of el.children){if(has(c))out.push(c);visit(c)}};visit(this);return out;}
  click(){this.listeners.click?.()}
}
const host=new Elem('div'),head=new Elem('head'),body=new Elem('body');body.dataset.ckV8Tab='landing';
const doc={body,head,hidden:false,readyState:'complete',hasFocus:()=>true,
  getElementById:id=>id==='ck-v8-ambient'?host:null,
  createElement:t=>new Elem(t),createElementNS:(ns,t)=>new Elem(t),
  querySelector:q=>q==='#main [data-go="home"]'?{click(){scrollClicked++}}:null,
  addEventListener:()=>{}};
const media={matches:false,addEventListener:()=>{}};
const win={innerHeight:900,addEventListener:()=>{},CKLegacyMotion37:{lapSeconds:17,peckSeconds:.62,
  points:Array.from({length:201},(_,i)=>[670+63*Math.cos(Math.PI*2*i/200),563+35*Math.sin(Math.PI*2*i/200),0])}};
const globals={document:doc,window:win,matchMedia:()=>media,Image:class{},
  ResizeObserver:class{observe(){}},MutationObserver:class{constructor(cb){mutationCallback=cb}observe(){}},
  requestAnimationFrame:cb=>{const id=++nextFrame;frames.set(id,cb);return id},
  cancelAnimationFrame:id=>frames.delete(id),Math,Set,Map,Object,String,Number,Array,console};
vm.runInNewContext(js,globals,{timeout:5000});
const find=q=>host.querySelectorAll(q);
for(const sel of ['.ck-dot-lawn','.ck-dot-backdrop','.ck-dot-cub','.ck-dot-main','.ck-dot-sleep','.ck-dot-flower','.ck-dot-notes','.ck-dot-music-note']){
  assert.equal(find(sel).length,0,`foreground must be fully blank: ${sel}`);
}
assert.equal(find('.ck-dot-scroll').length,1,'keep one SCROLL DOWN button');
assert.equal(find('.ck-dot-cloud').length,1,'keep large cumulus');
assert.equal(find('.ck-dot-orbit').length,1,'keep apple orbit');
assert.equal(find('.ck-dot-bird').length,1,'keep owl');
assert.equal(find('[data-dot-apple-color]').length,6,'keep all 6 colored apples');
assert.equal(find('[data-dot-small-cloud]').length,2,'keep both drifting clouds');
const b=find('.ck-dot-scroll')[0];
assert.equal(b.textContent,'SCROLL DOWN ↓');
assert.equal(b.attrs['aria-label'],'아래로 스크롤하여 학습 시작');
b.click();assert.equal(scrollClicked,1,'scroll must activate existing home nav');
const status=win.CK3DPerformance.getState();
assert.equal(status.renderer,'monochrome-dot-v51-blank-foreground');
assert.equal(status.cubs,0);assert.equal(status.flowers,0);
assert.equal(status.lawn,false);assert.equal(status.scrollButton,true);
assert.equal(status.clouds,3);assert.equal(status.apples,6);assert.equal(status.musicNotes,0);
assert.equal(status.fpsCap,24);assert.equal(status.webgl,false);
let before=win.CK3DPerformance.getState().frames;
for(let t=1000;t<10000;t+=70){const arr=[...frames.values()];frames.clear();for(const f of arr)f(t)}
assert.ok(win.CK3DPerformance.getState().frames>before,'sky animation works');
body.dataset.ckV8Tab='home';mutationCallback();
assert.equal(frames.size,0,'no frames on study tabs');assert.equal(host.dataset.ckDotActive,'false');
body.dataset.ckV8Tab='landing';mutationCallback();
assert.equal(frames.size,1,'exactly one animation frame on return');
console.log('ConceptKnot Dot v51: empty foreground + retained scroll & sky PASSED');
