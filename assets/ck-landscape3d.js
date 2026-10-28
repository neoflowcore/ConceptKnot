import * as THREE from '../vendor/three.module.min.js';

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
const scenes = { trees: [], clouds: [], bird: null, seesaw: null, rollingBalls: [] };
const pastel = [0x75c957, 0x4eb65e, 0x2b9d74, 0x217f63, 0xc0d956];
const flowerColors = [0xffc44f, 0xff789b, 0xffe28a, 0x6db9f3, 0xff8753];
let root, renderer, camera, scene, materialCache, clock, frameId = 0;
let resizeObserver, last = 0, pointer = {x: 0, y: 0}, elapsed = 0, firstDraw = false;
let resizeTimer = 0, playTime = 0;

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
    const brush = .93 + nr + .075 * Math.sin(x * .13 + z * .03) + .035*Math.sin(x*.41+z*.23);
    const t = clamp(((-z) - 23) / 120, 0, 1);
    col.setRGB(lerp(.15, .33, t) * brush, lerp(.52, .66, t) * brush, lerp(.17, .25, t) * brush);
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
function tree(x, z, size, paletteIndex, sways=true) {
  const height = 4.6 * size;
  const group = new THREE.Group();
  group.position.set(x, h(x,z), z);
  const bark = pbr(0x806a51,.92);
  const barkHighlight = pbr(0x9e815c,.9);
  const trunk = mesh(new THREE.CylinderGeometry(.24*size,.38*size,height,9,2),bark);
  trunk.position.y=height/2;
  group.add(trunk);
  const crown = new THREE.Group();
  crown.position.set(0,height*.85,0);
  const sGeo = new THREE.IcosahedronGeometry(1,2);
  const colors=[0x299d62,0x4db75c,0x7acb55,0x127d68,0x239d80,0xacd24a];
  for(let i=0;i<9;i++){
    const a=i*2.399, rr=.2+Math.sqrt(rand())*1.48;
    const xx=Math.cos(a)*rr*size,zz=Math.sin(a)*rr*.56*size,yy=(.1+rand()*1.7)*size;
    const leaf=pbr(colors[(paletteIndex+i)%colors.length],.93,{flatShading:false});
    const blob=sphere(sGeo,leaf,xx,yy,zz,(.94+rand()*.42)*size,(.75+rand()*.46)*size,(.83+rand()*.30)*size);
    crown.add(blob);
  }
  // Small color-varied highlights approximate matte clay leaves / specular edges.
  const highlights=pbr(0x9dd66e,.96,{transparent:true,opacity:.37});
  for(let k=0;k<4;k++){
    const a=k*2.1;
    crown.add(sphere(sGeo,highlights,Math.sin(a)*1.05*size,(1.55+Math.sin(a)*.4)*size,Math.cos(a)*.56*size,.31*size,.24*size,.25*size));
  }
  group.add(crown);
  scene.add(group);
  if(sways)scenes.trees.push({crown,phase:rand()*Math.PI*2,tempo:5.2+rand()*4.2,amp:.015+rand()*.013});
  return group;
}
function trees() {
  // Trees frame the educational props instead of filling the whole valley.
  for(let i=0;i<14;i++){
    const z=-19-rand()*97;
    const side=i%2?-1:1;
    const spread=20+rand()*32+(z<-70?10:0);
    const x=side*spread;
    const size=(.65+rand()*.93)*(z<-65?.79:1);
    tree(x,z,size,i%6,true);
  }
  tree(-28,-4,1.92,2,true);
  tree(29,-9,1.85,4,true);
}
function grass() {
  const count = QUALITY ? 7900 : 2800;
  const geometry = new THREE.ConeGeometry(.045,.64,3);
  geometry.translate(0,.24,0);
  const mat = pbr(0x5aae52,.96,{side:THREE.DoubleSide});
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
    col.setHex(pastel[Math.floor(rand()*pastel.length)]).multiplyScalar(.70+rand()*.4);
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
function booksAndPencils() {
  const shelf=new THREE.Group();
  const bx=18,z=-6; shelf.position.set(bx,h(bx,z),z);
  const colors=[0x2e83b5,0xef8a59,0x69a6a3];
  for(let i=0;i<3;i++){
    const book=mesh(new THREE.BoxGeometry(3.3,.64,2.0),pbr(colors[i],.53,{metalness:.02}));
    book.position.set(i*.15,i*.68+.32,0);
    book.rotation.y=i*.10;
    shelf.add(book);
    const pages=mesh(new THREE.BoxGeometry(2.95,.35,2.04),pbr(0xf0e8ce,.82));
    pages.position.copy(book.position);pages.position.y-=.06;pages.position.x+=.15;
    pages.rotation.copy(book.rotation);shelf.add(pages);
  }
  // No promotional slogan inside scenery. Simple wooden empty slate instead.
  const slate=mesh(new THREE.BoxGeometry(3.2,2.8,.23),pbr(0x1c534e,.75));slate.position.set(4,2.75,0);
  const border=mesh(new THREE.BoxGeometry(3.75,.21,.36),pbr(0xbb8050,.79));
  for(const yy of [1.28,4.21]){const edge=border.clone();edge.position.set(4,yy,.14);shelf.add(edge);}
  const edgeVert=mesh(new THREE.BoxGeometry(.22,3,.32),pbr(0xb77e4f,.78));
  for(const xx of [2.27,5.73]){const edge=edgeVert.clone();edge.position.set(xx,2.75,.14);shelf.add(edge);}
  shelf.add(slate);
  scene.add(shelf);
}

function propFinish(color,roughness=.65) {
  return new THREE.MeshPhysicalMaterial({
    color,roughness,metalness:0,clearcoat:.22,clearcoatRoughness:.7
  });
}
function place(x,z,offset=0){
  const g=new THREE.Group();
  g.position.set(x,h(x,z)+offset,z);
  scene.add(g);
  return g;
}
// Original tactile school objects modelled from geometry, never downloaded art.
function learningPlayground(){
  // Large hexagonal pencil near the left foreground.
  const pencil=place(-19,-7,1.95);
  pencil.rotation.set(.07,-.18,-1.13);
  const yellow=propFinish(0xf9b433,.46);
  const barrel=mesh(new THREE.CylinderGeometry(.4,.4,5.5,7),yellow);
  pencil.add(barrel);
  const wood=mesh(new THREE.ConeGeometry(.41,1.15,7),propFinish(0xffdf9b,.72));
  wood.rotation.z=Math.PI;wood.position.y=-3.29;pencil.add(wood);
  const graphite=mesh(new THREE.ConeGeometry(.14,.44,8),propFinish(0x344657,.52));
  graphite.rotation.z=Math.PI;graphite.position.y=-3.94;pencil.add(graphite);
  const band=mesh(new THREE.CylinderGeometry(.41,.41,.26,12),propFinish(0xe2a25a,.4));
  band.position.y=2.84;pencil.add(band);
  const eraser=mesh(new THREE.CylinderGeometry(.39,.39,.64,12),propFinish(0xef717e,.48));
  eraser.position.y=3.28;pencil.add(eraser);

  // Cream paper notebook with turquoise cover and discrete copper spiral binding.
  const notebook=place(-25,-13,.6);
  notebook.rotation.y=.34;
  notebook.add(mesh(new THREE.BoxGeometry(4.7,.28,3.65),propFinish(0x2483a8,.6)));
  const pages=mesh(new THREE.BoxGeometry(4.4,.12,3.42),propFinish(0xfff2d9,.83));
  pages.position.y=.20;notebook.add(pages);
  for(let k=0;k<6;k++){
    const ring=mesh(new THREE.TorusGeometry(.18,.056,8,18),propFinish(0xeab768,.43));
    ring.rotation.x=Math.PI/2;
    ring.position.set(-2.05+k*.78,.31,-1.68);
    notebook.add(ring);
  }
  for(let k=0;k<5;k++){
    const line=mesh(new THREE.BoxGeometry(3.3,.014,.022),propFinish(0xa2cbd0,.9));
    line.position.set(.15,.268,-.96+k*.46);notebook.add(line);
  }

  // A vertical memo sheet and check mark near the right perimeter.
  const memo=place(28,-12,2.6);
  memo.rotation.y=-.23;
  const sheet=mesh(new THREE.BoxGeometry(3.5,4.4,.23),propFinish(0xffedc6,.8));
  memo.add(sheet);
  const edge=mesh(new THREE.BoxGeometry(3.5,.59,.3),propFinish(0xffb24a,.5));
  edge.position.y=1.9;memo.add(edge);
  for(const x of [-.89,.85]){
    const ring=mesh(new THREE.TorusGeometry(.18,.075,8,20),propFinish(0xe37f31,.42));
    ring.position.set(x,2.18,.2);
    memo.add(ring);
  }
  for(let i=0;i<4;i++){
    const scribble=mesh(new THREE.BoxGeometry(2.15,.035,.017),propFinish(i===1?0x73b6b1:0xc3b88d,.84));
    scribble.position.set(.18,1.02-i*.68,.141);memo.add(scribble);
  }

  // Magnifier: physical ring, transparent lens and angled wooden handle.
  const glass=place(24,-22,3.15);
  glass.rotation.y=-.15;
  const rim=mesh(new THREE.TorusGeometry(1.45,.19,12,42),propFinish(0xf2a543,.36));
  glass.add(rim);
  const lens=mesh(new THREE.CircleGeometry(1.39,42),
    new THREE.MeshPhysicalMaterial({color:0x97d8f5,transparent:true,opacity:.21,depthWrite:false,metalness:0,roughness:.14,side:THREE.DoubleSide}));
  lens.position.z=.07;glass.add(lens);
  const grip=mesh(new THREE.CylinderGeometry(.26,.32,2.7,12),propFinish(0xef9c55,.55));
  grip.position.set(1.45,-1.53,-.07);grip.rotation.z=-.74;glass.add(grip);

  // Cheerful geometry blocks and golden triangular ruler.
  const blocks=place(20,-4,.4);
  const blockColors=[0x177cc7,0xfc854b,0xfed268];
  for(let i=0;i<3;i++){
    const b=mesh(new THREE.BoxGeometry(1.65-i*.2,1.2+i*.18,1.4),propFinish(blockColors[i],.56));
    b.position.set(i*1.18,1.0+i*.34,-i*.33);
    b.rotation.y=i*.15;blocks.add(b);
  }
  const ruler=place(27,-2,.3);
  const rule=mesh(new THREE.BoxGeometry(5.6,.25,.95),propFinish(0xf3a944,.61));
  rule.rotation.y=.58;ruler.add(rule);
  for(let i=0;i<11;i++){
    const tick=mesh(new THREE.BoxGeometry(.025,.018,i%5===0?.52:.25),propFinish(0x93612f,.86));
    tick.position.set(-2.46+i*.49,.14,0);
    ruler.add(tick);
  }

  // The seesaw carries a rolling, visibly striped coral ball.
  const sx=-23,sz=-29;
  const stand=place(sx,sz,.98);
  stand.add(mesh(new THREE.ConeGeometry(.88,1.95,4),propFinish(0x1f9bb1,.55)));
  const pivot=place(sx,sz,2.10);
  const plank=mesh(new THREE.BoxGeometry(7.4,.3,1.18),propFinish(0xf7a73b,.53));
  pivot.add(plank);
  const ball=new THREE.Group();
  ball.position.y=.89;
  ball.add(mesh(new THREE.SphereGeometry(.72,24,16),propFinish(0xf35d55,.4)));
  const stripe=mesh(new THREE.TorusGeometry(.712,.08,10,32),propFinish(0xffd8a2,.47));
  stripe.rotation.y=.56;ball.add(stripe);
  pivot.add(ball);
  scenes.seesaw={pivot,ball,radius:.72};

  // Blue ball rolls over the grass, following the actual triangulated surface.
  const movingRoot=new THREE.Group();
  const movingBody=new THREE.Group();
  movingRoot.add(movingBody);
  movingBody.add(mesh(new THREE.SphereGeometry(.7,24,16),propFinish(0x1984da,.39)));
  const bandBlue=mesh(new THREE.TorusGeometry(.69,.064,10,32),propFinish(0xffd884,.48));
  bandBlue.rotation.y=.35;movingBody.add(bandBlue);
  scene.add(movingRoot);
  scenes.rollingBalls.push({root:movingRoot,body:movingBody,center:19,z:-10,range:4.1,radius:.7,rate:.63,phase:1.3});
}

function bird() {
  const bird=new THREE.Group();
  bird.position.set(-20.5,h(-20.5,1)+8.7,1);
  bird.scale.setScalar(.95);
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
  scenes.bird={group:bird,head};
}
function createRenderer() {
  const host=document.getElementById(HOST_ID);
  if(!host || QUALITY===0 || REDUCED.matches)return;
  // Fail back to the existing textured SVG. Never hide learning content on error.
  const canvas=document.createElement('canvas');
  canvas.className='ck-3d-canvas';canvas.setAttribute('aria-hidden','true');
  canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;z-index:0;';
  const opts={canvas,alpha:false,antialias:!MOBILE.matches,powerPreference:'high-performance',stencil:false,depth:true};
  try{renderer=new THREE.WebGLRenderer(opts);}catch(err){console.info('ConceptKnot uses SVG scenery fallback',err);return;}
  renderer.setClearColor(0x65c6e9,1);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.24;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x9edac0,.0072);
  const hemi=new THREE.HemisphereLight(0xd4f2ff,0x4a8f63,1.94);scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xfff0c6,2.4);
  sun.position.set(-23,46,12);sun.castShadow=true;
  sun.shadow.mapSize.set(1024,1024);
  sun.shadow.camera.left=-50;sun.shadow.camera.right=50;sun.shadow.camera.top=60;sun.shadow.camera.bottom=-40;
  sun.shadow.normalBias=.016;sun.shadow.bias=-.00025;
  scene.add(sun);
  const ambience=new THREE.DirectionalLight(0x9beaff,.42);ambience.position.set(15,16,-20);scene.add(ambience);
  camera=new THREE.PerspectiveCamera(43,1,.1,480);
  camera.position.set(0,10,25);
  camera.lookAt(0,5,-35);
  sky();ground();grass();flowers();diffuseClouds();trees();booksAndPencils();learningPlayground();bird();
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
  if(!REDUCED.matches)frameId=requestAnimationFrame(tick);
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
  camera.position.z=width<850?30:25;
  camera.updateProjectionMatrix();
  if(firstDraw)renderer.render(scene,camera);
}
function onPointer(e){
  if(e.pointerType!=='mouse'||REDUCED.matches)return;
  pointer.x=clamp((e.clientX/window.innerWidth-.5)*2,-1,1);
  pointer.y=clamp((e.clientY/window.innerHeight-.5)*2,-1,1);
}
window.addEventListener('pointerleave',()=>{pointer.x=0;pointer.y=0;},{passive:true});
function onVisibility(){
  if(document.hidden){if(frameId)cancelAnimationFrame(frameId);frameId=0;return;}
  last=0;if(!frameId&&!REDUCED.matches)frameId=requestAnimationFrame(tick);
}
function tick(ms){
  frameId=0;if(!renderer||document.hidden)return;
  const dt=last?Math.min(.05,(ms-last)/1000):0;last=ms;elapsed+=dt;
  const focused=Boolean(document.body?.classList.contains('ck-v8-study-focus'));
  const intensity=focused?.18:1;
  if(!focused)playTime+=dt;
  for(const tr of scenes.trees){const breeze=Math.sin(elapsed*2*Math.PI/tr.tempo+tr.phase)*tr.amp;const cursor=pointer.x*tr.amp*.72;tr.crown.rotation.z=lerp(tr.crown.rotation.z,(breeze+cursor)*intensity,1-Math.exp(-dt*2.3));}
  for(const cl of scenes.clouds){cl.group.position.x+=dt*cl.speed*intensity;if(cl.group.position.x>105)cl.group.position.x=-110;}
  if(scenes.bird){
    const targetX=clamp(pointer.x*0.16,-.16,.16)*intensity;
    const targetY=clamp(-pointer.y*.12,-.12,.12)*intensity;
    const smooth=1-Math.exp(-dt*3.2);
    const head=scenes.bird.head;
    head.rotation.y=lerp(head.rotation.y,targetX,smooth);
    head.rotation.z=lerp(head.rotation.z,targetY+Math.sin(elapsed*.5)*.03*intensity,smooth);
    scenes.bird.group.position.y+=Math.sin(elapsed*.55)*.0008*intensity;
  }
  if(scenes.seesaw){
    const o=scenes.seesaw;
    const travel=Math.sin(playTime*.86)*2.77;
    o.pivot.rotation.z=Math.sin(playTime*.71)*.105;
    o.ball.position.x=travel;
    o.ball.rotation.z=-travel/o.radius;
  }
  for(const ball of scenes.rollingBalls){
    const x=ball.center+Math.sin(playTime*ball.rate+ball.phase)*ball.range;
    ball.root.position.set(x,h(x,ball.z)+ball.radius,ball.z);
    ball.body.rotation.z=-(x-ball.center)/ball.radius;
  }
  camera.position.x=lerp(camera.position.x,pointer.x*.32*intensity,1-Math.exp(-dt*1.2));
  camera.lookAt(0,5,-35);
  renderer.render(scene,camera);
  frameId=requestAnimationFrame(tick);
}
function cleanup(){
  if(frameId)cancelAnimationFrame(frameId);frameId=0;
  resizeObserver?.disconnect();
  if(renderer){renderer.dispose();renderer=null;}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',createRenderer,{once:true});
else createRenderer();