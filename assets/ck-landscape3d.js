import * as THREE from '../vendor/three.module.min.js';
import { buildStudyMachine } from './ck-kinetic-garden-v8.js';
import { buildSleepingCub } from './ck-sleeping-cub-v9.js';
import { buildPencilCub } from './ck-pointing-cub-v16.js';

// ConceptKnot 3D Garden v3 — original procedural geometry, not a Clay.com asset.
// Three.js is vendored (MIT) to avoid runtime CDN/network dependencies.
const HOST_ID = 'ck-v8-ambient';
const READY_CLASS = 'ck-3d-ready';
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)');
const MOBILE = matchMedia('(max-width: 850px)');
const LOW_MEMORY = (navigator.deviceMemory || 8) <= 2 || !!navigator.connection?.saveData;
const MAX_PIXEL_COUNT = 5_600_000;
const QUALITY = LOW_MEMORY ? 0 : MOBILE.matches ? 1 : 2;
const rand = (() => { let seed = 20261028; return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296); })();
const lerp = THREE.MathUtils.lerp;
const clamp = THREE.MathUtils.clamp;
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const scenes = { trees: [], clouds: [], bird: null, machine: null, cub:null, pressCub:null };
const pastel = [0x3c9a55, 0x287a54, 0x76b939, 0x205f49, 0xe7bf47];
const flowerColors = [0xffc44f, 0xff789b, 0xffe28a, 0x6db9f3, 0xff8753];
let root, renderer, camera, scene, materialCache, clock, frameId = 0;
let resizeObserver, last = 0, pointer = {x: 0, y: 0}, elapsed = 0, firstDraw = false;
let resizeTimer = 0, playTime = 0;
const isLanding=()=>document.body?.dataset?.ckV8Tab==='landing';
const shouldAnimate=()=>isLanding()&&!document.hidden&&!REDUCED.matches;
function synchronizeActivity(){
 const active=shouldAnimate();
 if(root)root.dataset.ck3dActive=String(active);
 if(!active){if(frameId)cancelAnimationFrame(frameId);frameId=0;last=0;return}
 if(!renderer){createRenderer();return}
 if(!frameId){last=0;frameId=requestAnimationFrame(tick)}
}


function h(x, z) {
  // Soft, genuinely triangulated terrain. The far hills have separate ridges.
  const far = 5.3 * Math.exp(-Math.pow((z + 74) / 34, 2));
  const back = 3.2 * Math.exp(-Math.pow((z + 38) / 23, 2));
  const near = 0.55 * Math.sin(x * 0.13 + z * 0.05) + 0.32 * Math.cos(z * 0.18 - x * 0.08);
  const roll = 2.1 * Math.sin(x * 0.048 + z * 0.024) + 1.4 * Math.cos(x * 0.082 - z * 0.04);
  return -1.25 + far + back + roll + near;
}
function pbr(color, roughness = .87, extras = {}) {
  return new THREE.MeshStandardMaterial({color, roughness, metalness: 0, ...extras});
}
function drop(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}
function mesh(geom, mat) { return drop(new THREE.Mesh(geom, mat)); }
function sphere(g, mat, x, y, z, sx, sy, sz) {
  const o = mesh(g, mat);
  o.position.set(x, y, z);
  o.scale.set(sx, sy, sz);
  return o;
}
function ground() {
  const width = 198, depth = 242;
  const geom = new THREE.PlaneGeometry(width, depth, 192, 180);
  geom.rotateX(-Math.PI / 2);
  geom.translate(0, 0, -42);
  const pos = geom.attributes.position;
  const colors = [];
  const col = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), y = h(x, z);
    pos.setY(i, y);
    const nr = Math.sin(x * 1.32 + z * 2.17) * .045 + Math.cos(z * 1.59 - x * .62) * .038;
    const broad = .79 + .21*Math.sin(x*.13 + z*.027)**2;
    const shade = .84 + .17*Math.cos(z*.094-x*.11) + nr*.42;
    const brush = clamp(broad*shade + .055*Math.sin(x*.41+z*.23),.51,1.17);
    const t = clamp(((-z) - 23) / 120, 0, 1);
    col.setRGB(lerp(.12,.27,t)*brush,lerp(.40,.57,t)*brush,lerp(.13,.22,t)*brush);
    colors.push(col.r, col.g, col.b);
  }
  geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geom.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({vertexColors:true,roughness:.97,metalness:0});
  const o = mesh(geom, mat);
  o.receiveShadow = true;
  o.castShadow = false;
  scene.add(o);
}
function sky() {
  const geo = new THREE.SphereGeometry(440, 40, 24);
  const mat = new THREE.ShaderMaterial({
    side:THREE.BackSide, depthWrite:false, fog:false,
    uniforms:{},
    vertexShader:'varying vec3 worldPoint; void main(){worldPoint=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:`varying vec3 worldPoint;
      void main(){ float y=normalize(worldPoint).y;
        float t=smoothstep(-.14,.83,y);
        vec3 c=mix(vec3(.67,.87,.91),vec3(.11,.56,.91),t);
        c=mix(c,vec3(.36,.76,.96),pow(t,.52)*.14);
        float glow=pow(max(0.0,dot(normalize(worldPoint),normalize(vec3(-.49,.71,-.5)))),30.0);
        c+=glow*vec3(.22,.20,.14);
        gl_FragColor=vec4(c,1.0);
      }`
  });
  const s = new THREE.Mesh(geo,mat);
  s.frustumCulled = false;
  scene.add(s);
}
function diffuseClouds() {
  const g = new THREE.SphereGeometry(1, 12, 8);
  const mat = new THREE.MeshLambertMaterial({color:0xf9fff9,transparent:true,opacity:.9,depthWrite:false});
  for(let i = 0; i < 15; i++) {
    const cloud = new THREE.Group();
    cloud.position.set((rand()-.5)*150, 17+rand()*16, -85-rand()*70);
    cloud.scale.setScalar(.8+rand()*1.3);
    for(let j = 0; j < 5; j++) {
      const x = (j-2)*2.2;
      const item = sphere(g,mat,x,Math.sin(j*.83)*.7,-rand()*.7,1.6+rand()*1.2,.62+rand()*.9,1.2);
      item.castShadow = false;
      cloud.add(item);
    }
    scenes.clouds.push({group:cloud,speed:.06+rand()*.10});
    scene.add(cloud);
  }
}

function painterCone(radius,height,colorA,colorB,seed){
  // Faceted polygons use per-triangle pigment variation: stronger light/shadow
  // than smooth spheres and a subtly brushed, clay-painted silhouette.
  const geometry=new THREE.ConeGeometry(radius,height,8,3).toNonIndexed();
  const position=geometry.getAttribute('position');
  const colors=new Float32Array(position.count*3);
  const light=new THREE.Color(colorA),shadow=new THREE.Color(colorB),shade=new THREE.Color();
  for(let i=0;i<position.count;i+=3){
    const x=(position.getX(i)+position.getX(i+1)+position.getX(i+2))/3;
    const z=(position.getZ(i)+position.getZ(i+1)+position.getZ(i+2))/3;
    const patch=clamp(.47+.28*(x/(radius||1))+.12*Math.sin(seed+i*1.73+z*.7),.07,.92);
    shade.copy(shadow).lerp(light,patch);
    for(let j=0;j<3;j++){const index=(i+j)*3;colors[index]=shade.r;colors[index+1]=shade.g;colors[index+2]=shade.b;}
  }
  geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
  return mesh(geometry,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.91,metalness:0,flatShading:true}));
}
function tree(x,z,size,paletteIndex,sways=true){
  // A hexagonal colored pencil is the trunk. Layered cone needles make a
  // recognizable pointed pine, not a round lollipop tree.
  const group=new THREE.Group();
  group.position.set(x,h(x,z),z);
  const shaft=mesh(new THREE.CylinderGeometry(.19*size,.23*size,4.4*size,6),
    pbr(paletteIndex%2?0xe6a041:0xf2bd4a,.71,{flatShading:true}));
  shaft.position.y=2.55*size;
  group.add(shaft);
  const ferrule=mesh(new THREE.CylinderGeometry(.23*size,.23*size,.28*size,6),
    pbr(0xc97b4c,.48,{flatShading:true}));
  ferrule.position.y=.46*size;group.add(ferrule);
  const graphite=mesh(new THREE.ConeGeometry(.23*size,.65*size,6),
    pbr(0x263d41,.7,{flatShading:true}));
  graphite.rotation.z=Math.PI;graphite.position.y=.19*size;group.add(graphite);
  // Three colored flat facets on each crown layer vary with sun direction.
  const crown=new THREE.Group();crown.position.y=3.15*size;
  const palette=[[0x3c9b5b,0x153e38],[0x398f56,0x1d5943],[0x66a744,0x2a5841],[0x2c8e65,0x16454a]];
  for(let tier=0;tier<4;tier++){
    const radius=(1.81-tier*.35)*size;
    const coneHeight=(3.65-tier*.42)*size;
    const colors=palette[(paletteIndex+tier)%palette.length];
    const cone=painterCone(radius,coneHeight,colors[0],colors[1],paletteIndex*11+tier*3);
    cone.position.set(0,tier*.71*size,0);
    cone.rotation.y=tier*.29;
    crown.add(cone);
  }
  // Bright needle edge inserts along the lit side, kept sparse.
  const tip=painterCone(.54*size,1.55*size,0x89bd55,0x347e50,paletteIndex);
  tip.position.y=2.37*size;tip.rotation.y=.21;
  crown.add(tip);
  group.add(crown);
  scene.add(group);
  if(sways)scenes.trees.push({crown,phase:rand()*Math.PI*2,tempo:6.3+rand()*4.6,amp:.01+rand()*.008});
  return group;
}
function trees(){
  // Pencil-pines frame both sides and avoid the center interaction track.
  for(let i=0;i<12;i++){
    const z=-23-rand()*96;
    const side=i%2===0?-1:1;
    const x=side*(25+rand()*32+(z<-68?7:0));
    tree(x,z,(.72+rand()*.90)*(z<-75?.85:1),i%4,true);
  }
  tree(-27,-10,1.55,1,true);
  tree(28,-13,1.72,2,true);
}

function grass() {
  const count = QUALITY ? 7900 : 2800;
  const geometry = new THREE.ConeGeometry(.045,.64,3);
  geometry.translate(0,.24,0);
  const mat = pbr(0x328b46,.95,{side:THREE.DoubleSide});
  const grass = new THREE.InstancedMesh(geometry,mat,count);
  grass.castShadow = false;grass.receiveShadow = true;
  const obj=new THREE.Object3D();const col=new THREE.Color();
  for(let i=0;i<count;i++){
    const x=(rand()-.5)*190,z=(rand()-.5)*225-42;
    obj.position.set(x,h(x,z),z);
    obj.rotation.set((rand()-.5)*.5,rand()*Math.PI*2,(rand()-.5)*.31);
    const s=.3+rand()*.7;
    obj.scale.set(s*.7,s*(.5+rand()*.9),s*.7);
    obj.updateMatrix();grass.setMatrixAt(i,obj.matrix);
    col.setHex(pastel[Math.floor(rand()*pastel.length)]).multiplyScalar(.58+rand()*.44);
    grass.setColorAt(i,col);
  }
  grass.instanceMatrix.needsUpdate=true;
  if(grass.instanceColor)grass.instanceColor.needsUpdate=true;
  grass.frustumCulled=false;
  scene.add(grass);
}
function flowerTexture() {
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;
  const ctx=canvas.getContext('2d');
  ctx.translate(64,64);
  const white=['#fff5dc','#f8c2d4','#fae69f','#cbe1ff'];
  for(let i=0;i<5;i++){
    ctx.save();ctx.rotate(i*Math.PI*2/5);
    const grad=ctx.createRadialGradient(0,-20,4,0,-22,23);
    grad.addColorStop(0,'#ffffff');grad.addColorStop(.7,white[i%white.length]);grad.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=grad;ctx.beginPath();ctx.ellipse(0,-21,15,24,0,0,2*Math.PI);ctx.fill();ctx.restore();
  }
  ctx.fillStyle='#edac4f';ctx.beginPath();ctx.arc(0,0,8,0,2*Math.PI);ctx.fill();
  const tx=new THREE.CanvasTexture(canvas);tx.colorSpace=THREE.SRGBColorSpace;
  return tx;
}
function flowers() {
  const count=QUALITY?1500:390;
  const positions=new Float32Array(count*3),colors=new Float32Array(count*3),col=new THREE.Color();
  for(let i=0;i<count;i++){
    const x=(rand()-.5)*184,z=(rand()-.5)*208-35;
    positions.set([x,h(x,z)+.19+rand()*.23,z],i*3);
    col.setHex(flowerColors[Math.floor(rand()*flowerColors.length)]);
    colors.set([col.r,col.g,col.b],i*3);
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(positions,3));g.setAttribute('color',new THREE.BufferAttribute(colors,3));
  const m=new THREE.PointsMaterial({size:.47,map:flowerTexture(),transparent:true,alphaTest:.12,depthWrite:false,vertexColors:true,sizeAttenuation:true});
  const f=new THREE.Points(g,m);f.frustumCulled=false;
  scene.add(f);
}
function bird() {
  const bird=new THREE.Group();
  const bx=-5.55,bz=-21.8;
  bird.position.set(bx,h(bx,bz)+5.85,bz);
  bird.scale.setScalar(1.04);
  const teal=pbr(0x159eb5,.62),blue=pbr(0x137ebe,.52),white=pbr(0xf9f4e7,.92),beak=pbr(0xf3a54d,.58),black=pbr(0x092b3d,.28);
  const ball=new THREE.SphereGeometry(1,20,12);
  bird.add(sphere(ball,blue,0,0,0,.68,.93,.57));
  bird.add(sphere(ball,white,.20,-.17,.43,.43,.57,.21));
  const wing=sphere(ball,teal,-.5,-.16,.37,.42,.69,.25);wing.rotation.z=-.45;bird.add(wing);
  const tail=sphere(ball,blue,-1.04,-.48,-.12,.63,.2,.29);tail.rotation.z=.34;bird.add(tail);
  const head=new THREE.Group();head.position.set(.30,.72,.04);
  head.add(sphere(ball,teal,0,0,0,.58,.55,.56));
  head.add(sphere(ball,white,.27,-.22,.38,.29,.28,.15));
  for(const side of [-1,1]){
    const eye=sphere(ball,black,.29,.13,side*.49,.105,.118,.059);
    head.add(eye);
    const glint=sphere(ball,pbr(0xffffff,.18),.315,.17,side*.55,.03,.04,.024);
    head.add(glint);
  }
  const cone=mesh(new THREE.ConeGeometry(.2,.55,4),beak);
  cone.rotation.z=-Math.PI/2;cone.position.set(.61,-.04,.18);head.add(cone);
  bird.add(head);
  const feet=pbr(0xb97a4b,.72);
  for(const fz of [-.23,.23]){
    const foot=mesh(new THREE.CylinderGeometry(.042,.044,.50,6),feet);
    foot.position.set(.1,-1.0,fz);foot.rotation.z=.15;
    bird.add(foot);
  }
  const perch=mesh(new THREE.CylinderGeometry(.115,.16,3.2,8),pbr(0x785942,.95));
  perch.rotation.z=Math.PI/2;perch.position.set(0,-1.25,0);bird.add(perch);
  scene.add(bird);
  scenes.bird={group:bird,head,baseY:bird.position.y,peckStarted:-100,peckIndex:-1,beakWorld:{x:bx+.91,y:bird.position.y+.72,z:bz+.18}};
}
function createRenderer() {
  const host=document.getElementById(HOST_ID);
  if(!host || QUALITY===0 || REDUCED.matches || !shouldAnimate() || renderer)return;
  // Fail back to the existing textured SVG. Never hide learning content on error.
  const canvas=document.createElement('canvas');
  canvas.className='ck-3d-canvas';canvas.setAttribute('aria-hidden','true');
  canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;z-index:0;';
  const opts={canvas,alpha:false,antialias:!MOBILE.matches,powerPreference:'default',stencil:false,depth:true};
  try{renderer=new THREE.WebGLRenderer(opts);}catch(err){console.info('ConceptKnot uses SVG scenery fallback',err);return;}
  renderer.setClearColor(0x65c6e9,1);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.09;
  renderer.shadowMap.enabled=QUALITY>1;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x72ac9f,.0064);
  const hemi=new THREE.HemisphereLight(0xc7eaff,0x345c43,1.25);scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xffdb9e,2.85);
  sun.position.set(-23,46,12);sun.castShadow=true;
  sun.shadow.mapSize.set(QUALITY>1?768:512,QUALITY>1?768:512);
  sun.shadow.camera.left=-50;sun.shadow.camera.right=50;sun.shadow.camera.top=60;sun.shadow.camera.bottom=-40;
  sun.shadow.normalBias=.016;sun.shadow.bias=-.00025;
  scene.add(sun);
  const ambience=new THREE.DirectionalLight(0x77c4e5,.32);ambience.position.set(15,16,-20);scene.add(ambience);
  camera=new THREE.PerspectiveCamera(43,1,.1,480);
  camera.position.set(0,11,26);
  camera.lookAt(0,6,-30);
  sky();ground();grass();flowers();diffuseClouds();trees();
   scenes.machine=buildStudyMachine(THREE,scene,h,QUALITY);
   scenes.cub=buildSleepingCub(THREE,scene,h,QUALITY);
  scenes.pressCub=buildPencilCub(THREE,scene,h,QUALITY);
   bird();
  host.insertBefore(canvas,host.firstChild);
  root=host;
  resize();
  try{renderer.render(scene,camera);}catch(err){renderer.dispose();canvas.remove();console.info('3D background failed; SVG fallback',err);return;}
  host.classList.add(READY_CLASS);
  host.dataset.renderer='webgl3d';firstDraw=true;
  resizeObserver=new ResizeObserver(()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(resize,80);});
  resizeObserver.observe(host);
  window.addEventListener('resize',resize,{passive:true});
  document.addEventListener('visibilitychange',onVisibility);
  window.addEventListener('pointermove',onPointer,{passive:true});
  window.addEventListener('pagehide',cleanup,{once:true});
  synchronizeActivity();
}
function resize(){
  if(!renderer||!root||!camera)return;
  const width=Math.max(1,root.clientWidth||window.innerWidth),height=Math.max(1,root.clientHeight||window.innerHeight);
  let dpr=Math.min(window.devicePixelRatio||1,MOBILE.matches?1.1:1.5);
  const pixels=width*height*dpr*dpr;
  if(pixels>MAX_PIXEL_COUNT)dpr*=Math.sqrt(MAX_PIXEL_COUNT/pixels);
  renderer.setPixelRatio(dpr);renderer.setSize(width,height,false);
  camera.aspect=width/height;
  // Wider camera at portrait keeps the principal hillside and bird in the safe frame.
  camera.fov=width<600?56:width<900?49:43;
  camera.position.z=width<850?30:26;
  camera.updateProjectionMatrix();
  if(firstDraw&&shouldAnimate())renderer.render(scene,camera);
}
function onPointer(e){
  if(e.pointerType!=='mouse'||!shouldAnimate())return;
  pointer.x=clamp((e.clientX/window.innerWidth-.5)*2,-1,1);
  pointer.y=clamp((e.clientY/window.innerHeight-.5)*2,-1,1);
}
window.addEventListener('pointerleave',()=>{pointer.x=0;pointer.y=0;},{passive:true});
function onVisibility(){synchronizeActivity()}
function tick(ms){
  frameId=0;if(!renderer||!shouldAnimate())return;
  const dt=last?Math.min(.05,(ms-last)/1000):0;last=ms;elapsed+=dt;
  const focused=Boolean(document.body?.classList.contains('ck-v8-study-focus'));
  const intensity=focused?.18:1;
  if(!focused)playTime+=dt;
  for(const tr of scenes.trees){const breeze=Math.sin(elapsed*2*Math.PI/tr.tempo+tr.phase)*tr.amp;const cursor=pointer.x*tr.amp*.72;tr.crown.rotation.z=lerp(tr.crown.rotation.z,(breeze+cursor)*intensity,1-Math.exp(-dt*2.3));}
  for(const cl of scenes.clouds){cl.group.position.x+=dt*cl.speed*intensity;if(cl.group.position.x>105)cl.group.position.x=-110;}
  // Time-locked ball passes animate before the bird's peck decisions.
  scenes.machine?.animate(playTime);
  scenes.cub?.animate(playTime);
  scenes.pressCub?.animate(playTime);
  if(scenes.bird){
    const b=scenes.bird;
    const targetX=clamp(pointer.x*.16,-.16,.16)*intensity;
    const targetY=clamp(-pointer.y*.12,-.12,.12)*intensity;
    const nearest=scenes.machine?.nearestBall(b.beakWorld);
    // The front arc passes near the beak: each entering ball triggers one
    // 0.62-second attempt, with a minimum gap between attempts.
    if(!focused&&nearest&&nearest.distance<2.65&&nearest.index!==b.peckIndex
       &&playTime-b.peckStarted>1.15){
      b.peckStarted=playTime;
      b.peckIndex=nearest.index;
    }
    if(nearest&&nearest.distance>3.7&&playTime-b.peckStarted>.85){
      b.peckIndex=-1;
    }
    const progress=(playTime-b.peckStarted)/.62;
    const peck=!focused&&progress>=0&&progress<=1
      ?Math.pow(Math.sin(progress*Math.PI),1.1):0;
    const smooth=1-Math.exp(-dt*9.3);
    b.head.rotation.y=lerp(b.head.rotation.y,targetX,smooth);
    b.head.rotation.z=lerp(b.head.rotation.z,targetY-.53*peck+Math.sin(elapsed*.5)*.02*intensity,smooth);
    b.head.rotation.x=lerp(b.head.rotation.x,-.17*peck,smooth);
    b.head.position.x=.30+.23*peck;
    b.head.position.y=.72-.15*peck;
    b.group.position.y=b.baseY+Math.sin(elapsed*.67)*.035*intensity-.055*peck;
  }
  camera.position.x=lerp(camera.position.x,pointer.x*.32*intensity,1-Math.exp(-dt*1.2));
  camera.lookAt(0,6,-30);
  renderer.render(scene,camera);
  if(shouldAnimate())frameId=requestAnimationFrame(tick);
}
function cleanup(){
  if(frameId)cancelAnimationFrame(frameId);frameId=0;
  resizeObserver?.disconnect();
  if(renderer){renderer.dispose();renderer=null;}
}
function initialize(){
 const main=document.getElementById('main');
 if(main)new MutationObserver(synchronizeActivity).observe(main,{childList:true});
 new MutationObserver(synchronizeActivity).observe(document.body,{attributes:true,attributeFilter:['data-ck-v8-tab']});
 document.addEventListener('visibilitychange',synchronizeActivity);
 window.addEventListener('pageshow',synchronizeActivity);
 REDUCED.addEventListener?.('change',synchronizeActivity);
 synchronizeActivity();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});
else initialize();
window.CK3DPerformance=Object.freeze({getState:()=>({active:!!frameId,initialized:!!renderer,landing:isLanding(),hidden:document.hidden})});