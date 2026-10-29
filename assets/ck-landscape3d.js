import {makeApple,mascotKit} from './ck-mascot-kit-v33.js';
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
// Native CSS resolution at 4K; up to 2x on smaller high-DPI screens.
const MAX_PIXEL_COUNT = 16_777_216;
const INTRO_SECONDS=3.6, FRAME_MS=1000/24;
const QUALITY = LOW_MEMORY ? 0 : MOBILE.matches ? 1 : 2;
const rand = (() => { let seed = 20261028; return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296); })();
const lerp = THREE.MathUtils.lerp;
const clamp = THREE.MathUtils.clamp;
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const scenes = { trees: [], clouds: [], bird: null, machine: null, cub:null, pressCub:null };
const pastel = [0x3c9a55, 0x287a54, 0x76b939, 0x205f49, 0xe7bf47];
const flowerColors = [0xffc44f, 0xff789b, 0xffe28a, 0x6db9f3, 0xff8753];
let root, renderer, camera, scene, foregroundScene, materialCache, clock, frameId = 0;
let resizeObserver, last = 0, pointer = {x: 0, y: 0}, elapsed = 0, firstDraw = false;
let windowFocused=true,lastPaint=0,introDone=false,scrollCue=null,rendererFailed=false,cubButton=null,cubTime=0;
let renderTimer=0;
function queueFrame(){
 if(frameId||renderTimer||!shouldAnimate())return;
 renderTimer=setTimeout(()=>{renderTimer=0;if(shouldAnimate())frameId=requestAnimationFrame(tick)},FRAME_MS);
}
function cancelFrames(){if(frameId)cancelAnimationFrame(frameId);clearTimeout(renderTimer);renderTimer=0;frameId=0;}
let resizeTimer = 0, playTime = 0, activeLast=false, frameCount=0;
const isLanding=()=>document.body?.dataset?.ckV8Tab==='landing';
const shouldAnimate=()=>isLanding()&&windowFocused&&!document.hidden&&!REDUCED.matches;
function synchronizeActivity(){
 const active=shouldAnimate();
 if(root)root.dataset.ck3dActive=String(active);
 if(!active){
  if(!renderer&&!rendererFailed&&isLanding()&&windowFocused&&!document.hidden){createRenderer();return;}
  cancelFrames();last=0;
  if(root)root.dataset.ck3dIdle='true';
  if(activeLast&&renderer){
   // Release full-screen render targets: an invisible 3D canvas is not free.
   renderer.setPixelRatio(1);
   renderer.setSize(1,1,false);
   renderer.domElement.style.display='none';
  }
  activeLast=false;return;
 }
 if(!renderer){createRenderer();return}
 if(!activeLast){
  renderer.domElement.style.display='block';
  resize();
 }
 activeLast=true;
 if(root)root.dataset.ck3dIdle='false';
 queueFrame();
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
    const broad = .88 + .10*Math.sin(x*.065 + z*.022)**2;
    const shade = .86 + .065*Math.cos(z*.094-x*.11) + nr*.12;
    const brush = clamp(broad*shade + .055*Math.sin(x*.41+z*.23),.51,1.17);
    const t = clamp(((-z) - 23) / 120, 0, 1);
    col.setRGB(lerp(.27,.33,t)*brush,lerp(.45,.53,t)*brush,lerp(.10,.15,t)*brush);
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
        vec3 c=mix(vec3(.63,.84,1.0),vec3(.08,.43,.94),t);
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
  const mat = new THREE.MeshLambertMaterial({color:0xffffff,transparent:true,opacity:.9,depthWrite:false});
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
    scenes.clouds.push({group:cloud,speed:.48+rand()*.22});
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
  appleTree(-27,-23,1.6);
  appleTree(28,-26,1.72);
}

function appleTree(x,z,size){
 const root=new THREE.Group();root.name='detailed-apple-tree';root.position.set(x,h(x,z),z);root.scale.setScalar(size);scene.add(root);
 // Feathered canopy contact shadow: no hard dark disk against pale grass.
 if(typeof document!=='undefined'){const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d'),gradient=ctx.createRadialGradient(64,64,5,64,64,64);gradient.addColorStop(0,'rgba(47,70,22,.22)');gradient.addColorStop(.55,'rgba(47,70,22,.12)');gradient.addColorStop(1,'rgba(47,70,22,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);const shadow=new THREE.Mesh(new THREE.PlaneGeometry(5.6,4.7),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));shadow.rotation.x=-Math.PI/2;shadow.position.set(.3,.035,.2);root.add(shadow);}
 const bark=pbr(0x987043,.94);
 if(typeof document!=='undefined'){const c=document.createElement('canvas');c.width=128;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#888';ctx.fillRect(0,0,128,128);for(let i=0;i<70;i++){ctx.strokeStyle=i%2?'#555':'#bbb';ctx.lineWidth=1+(i%3);ctx.beginPath();const xx=(i*47)%128;ctx.moveTo(xx,0);ctx.bezierCurveTo(xx+7,40,xx-5,85,xx+2,128);ctx.stroke();}const tx=new THREE.CanvasTexture(c);tx.wrapS=tx.wrapT=THREE.RepeatWrapping;tx.repeat.set(2,3);bark.bumpMap=tx;bark.bumpScale=.055;}

 // Tapered trunk and branching silhouette instead of a cylinder under seven balls.
 const branch=(points,r)=>{const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const g=new THREE.TubeGeometry(curve,12,r,9,false);const v=g.attributes.position;for(let i=0;i<v.count;i++){const taper=1-.55*Math.min(1,Math.max(0,v.getY(i)/6));v.setX(i,v.getX(i)*taper);}g.computeVertexNormals();root.add(mesh(g,bark));};
 branch([[0,0,0],[.08,1.4,.02],[-.12,2.8,0],[.14,4.0,0],[.1,5.3,-.1]],.32);
 for(let i=0;i<6;i++){const a=i*2.399;branch([[0,2.2+i*.2,0],[Math.cos(a)*.65,3.1+i*.15,Math.sin(a)*.6],[Math.cos(a)*1.65,4.1+i*.14,Math.sin(a)*1.35]],.12);}
 // Hundreds of individually oriented, pointed leaves in a rounded canopy.
 const leaf=new THREE.Shape();leaf.moveTo(0,-.23);leaf.bezierCurveTo(-.22,-.07,-.17,.16,0,.30);leaf.bezierCurveTo(.17,.16,.22,-.07,0,-.23);
 const geometry=new THREE.ShapeGeometry(leaf,5),leaves=new THREE.InstancedMesh(geometry,pbr(0xffffff,.94,{side:THREE.DoubleSide}),1150);
 const veinGeo=new THREE.BufferGeometry();veinGeo.setAttribute('position',new THREE.Float32BufferAttribute([-.005,-.23,.005,.005,-.23,.005,-.005,.27,.005,.005,.27,.005],3));veinGeo.setIndex([0,1,2,1,3,2]);veinGeo.computeVertexNormals();
 const veins=new THREE.InstancedMesh(veinGeo,pbr(0xbed271,.92,{side:THREE.DoubleSide}),1150);
 const obj=new THREE.Object3D(),col=new THREE.Color();
 for(let i=0;i<1150;i++){const a=i*2.399,yy=1-2*(i+.5)/1150,r=Math.sqrt(1-yy*yy),jitter=.82+rand()*.26;
  obj.position.set(Math.cos(a)*r*2.25*jitter,4.65+yy*1.7,Math.sin(a)*r*1.9*jitter);
  obj.rotation.set((rand()-.5)*1.3,a,(rand()-.5)*1.6);obj.scale.setScalar(.80+rand()*.65);obj.updateMatrix();leaves.setMatrixAt(i,obj.matrix);veins.setMatrixAt(i,obj.matrix);col.setHex([0x79a949,0x82b34e,0x6fa143,0x8db955][i%4]);leaves.setColorAt(i,col);
 }
 leaves.instanceMatrix.needsUpdate=true;leaves.instanceColor.needsUpdate=true;veins.instanceMatrix.needsUpdate=true;root.add(leaves,veins);
 // Fruit lies on the visible outer shell, so foliage cannot swallow most apples.
 for(let i=0;i<24;i++){const a=i*2.399,yy=-.65+(i%6)*.25,r=Math.sqrt(1-yy*yy);const apple=makeApple(THREE,[0xef403c,0x8acb36,0xffd34a][i%3],.29);apple.name='tree-apple';apple.position.set(Math.cos(a)*r*2.3,4.55+yy*1.5,Math.sin(a)*r*2.0);root.add(apple);}
}

function grass(){
 // Curved tapered blades in dense near-field tufts, batched into one draw call.
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute([-.045,0,0,.045,0,0,-.025,.25,.025,.025,.25,.025,.045,.51,.09],3));geo.setIndex([0,1,2,1,3,2,2,3,4]);geo.setAttribute('color',new THREE.Float32BufferAttribute([.72,.80,.62,.72,.80,.62,.86,.91,.76,.86,.91,.76,1,1,.91],3));geo.computeVertexNormals();
 const count=QUALITY?24000:9500,inst=new THREE.InstancedMesh(geo,pbr(0xffffff,.96,{side:THREE.DoubleSide,vertexColors:true}),count),obj=new THREE.Object3D(),col=new THREE.Color();
 for(let i=0;i<count;i++){const near=i<count*.7;const x=(rand()-.5)*(near?78:190),z=near?22-rand()*75:-45-rand()*110;obj.position.set(x,h(x,z)+.015,z);obj.rotation.set(0,rand()*Math.PI*2,(rand()-.5)*.35);const scale=.35+rand()*.55;obj.scale.set(scale,scale,scale);obj.updateMatrix();inst.setMatrixAt(i,obj.matrix);col.setHex([0x7fb14e,0x87b856,0x79aa48,0x91be5f,0x80b151][i%5]);inst.setColorAt(i,col);}
 inst.instanceMatrix.needsUpdate=true;inst.instanceColor.needsUpdate=true;scene.add(inst);
}
function flowers(){
 // Actual petals, yellow centers and stalks replace distant colored points.
 const n=QUALITY?1050:340,obj=new THREE.Object3D(),stemGeo=new THREE.CylinderGeometry(.014,.022,.30,4),petalGeo=new THREE.SphereGeometry(1,7,5);
 const petals=new THREE.InstancedMesh(petalGeo,pbr(0xffffff,.87),n*8),centers=new THREE.InstancedMesh(new THREE.SphereGeometry(.065,8,6),pbr(0xffc62f,.86),n),stems=new THREE.InstancedMesh(stemGeo,pbr(0x68a333),n),col=new THREE.Color();
 for(let i=0;i<n;i++){const near=i<n*.8,x=(rand()-.5)*(near?65:160),z=near?18-rand()*67:-45-rand()*100,y=h(x,z),size=.75+rand()*.8;
  obj.position.set(x,y+.17,z);obj.rotation.set(0,0,.08);obj.scale.set(1,size,1);obj.updateMatrix();stems.setMatrixAt(i,obj.matrix);
  obj.position.y=y+.33*size;obj.scale.set(size,size*.5,size);obj.updateMatrix();centers.setMatrixAt(i,obj.matrix);
  for(let j=0;j<8;j++){const a=j*Math.PI/4;obj.position.set(x+Math.cos(a)*.105*size,y+.32*size,z+Math.sin(a)*.105*size);obj.rotation.set(0,-a,0);obj.scale.set(.13*size,.025*size,.048*size);obj.updateMatrix();const k=i*8+j;petals.setMatrixAt(k,obj.matrix);col.setHex(i%5===0?0xffd647:i%11===0?0xffb2c4:0xfffcf0);petals.setColorAt(k,col);}
 }
 petals.instanceColor.needsUpdate=true;for(const group of [petals,centers,stems]){group.instanceMatrix.needsUpdate=true;scene.add(group);}
}
function bird(){
 const bird=new THREE.Group(),bx=-5.55,bz=-21.8;
 bird.position.set(bx,h(bx,bz)+5.85,bz);bird.scale.setScalar(1.12);
 const k=mascotKit(THREE),blue=pbr(0x65bdf6,.68),wingMat=pbr(0x3da4e5,.7),cream=pbr(0xfff4de),orange=pbr(0xffba43),black=pbr(0x191f2c,.22);
 const ball=(parent,mat,x,y,z,sx,sy,sz)=>k.ball(parent,mat,x,y,z,sx,sy,sz);
 ball(bird,blue,0,-.08,0,.68,.76,.52);ball(bird,cream,0,-.18,.43,.48,.52,.16);
 for(const side of [-1,1]){const wing=new THREE.Group();wing.position.set(side*.52,-.04,.02);wing.rotation.z=-side*.45;bird.add(wing);for(let j=0;j<3;j++)ball(wing,wingMat,side*j*.13,-j*.12,.02,.25,.42-j*.04,.13);const foot=ball(bird,orange,side*.23,-.80,.13,.18,.09,.24);}
 const head=new THREE.Group();head.position.set(.30,.72,.04);bird.add(head);
 ball(head,blue,0,0,0,.73,.66,.57);ball(head,cream,0,-.18,.38,.64,.40,.18);
 for(const side of [-1,1]){ball(head,cream,side*.28,.05,.49,.24,.29,.065);ball(head,black,side*.28,.05,.55,.17,.22,.04);ball(head,k.m.white,side*.28-.05,.14,.585,.055,.065,.012);ball(head,k.m.pink,side*.50,-.18,.49,.08,.04,.018);}
 const beak=mesh(new THREE.ConeGeometry(.16,.33,4),orange);beak.rotation.x=Math.PI/2;beak.position.set(0,-.15,.68);head.add(beak);
 for(let i=0;i<3;i++){const tuft=ball(head,blue,(i-1)*.15,.62+i*.015,0,.11,.28,.12);tuft.rotation.z=(1-i)*.3;}
 const perch=mesh(new THREE.CylinderGeometry(.115,.16,3.2,8),pbr(0x956742));perch.rotation.z=Math.PI/2;perch.position.set(0,-.94,0);bird.add(perch);
 scene.add(bird);scenes.bird={group:bird,head,baseY:bird.position.y,peckStarted:-100,peckIndex:-1,beakWorld:{x:bx+.3,y:bird.position.y+.57,z:bz+.72}};
}
function createRenderer() {
  const host=document.getElementById(HOST_ID);
  if(!host || QUALITY===0 || REDUCED.matches || !shouldAnimate() || renderer || rendererFailed)return;
  // Fail back to the existing textured SVG. Never hide learning content on error.
  const canvas=document.createElement('canvas');
  canvas.className='ck-3d-canvas';canvas.setAttribute('aria-hidden','true');
  canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;z-index:0;';
  const opts={canvas,alpha:false,antialias:true,powerPreference:'low-power',stencil:false,depth:true};
  try{renderer=new THREE.WebGLRenderer(opts);}catch(err){rendererFailed=true;console.info('ConceptKnot uses SVG scenery fallback',err);return;}
  renderer.setClearColor(0x65c6e9,1);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.22;
  // Existing cub contact discs provide soft shadows without a shadow-map pass.
  renderer.shadowMap.enabled=false;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0xaddbff,.0038);
  const hemi=new THREE.HemisphereLight(0xffffff,0xd5d9bb,1.65);scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xfff3df,3.0);
  sun.position.set(-23,46,12);sun.castShadow=true;
  sun.shadow.mapSize.set(QUALITY>1?768:512,QUALITY>1?768:512);
  sun.shadow.camera.left=-50;sun.shadow.camera.right=50;sun.shadow.camera.top=60;sun.shadow.camera.bottom=-40;
  sun.shadow.normalBias=.016;sun.shadow.bias=-.00025;
  scene.add(sun);
  const ambience=new THREE.DirectionalLight(0xddebff,.55);ambience.position.set(15,16,-20);scene.add(ambience);
  camera=new THREE.PerspectiveCamera(43,1,.1,480);
  camera.position.set(0,11,26);
  camera.lookAt(0,6,-30);
  sky();ground();grass();flowers();diffuseClouds();trees();
   scenes.machine=buildStudyMachine(THREE,scene,h,QUALITY);
  // True 3D foreground pass: terrain/rail can never cover the baby faces.
  foregroundScene=new THREE.Scene();
  foregroundScene.add(hemi.clone(),sun.clone(),ambience.clone());
  scenes.cub=buildSleepingCub(THREE,foregroundScene,h,QUALITY);
  scenes.pressCub=buildPencilCub(THREE,foregroundScene,h,QUALITY);
   bird();
  host.insertBefore(canvas,host.firstChild);
  createScrollCue(host);
  root=host;
  resize();
  try{drawScene();}catch(err){rendererFailed=true;renderer.dispose();renderer=null;canvas.remove();cubButton?.remove();scrollCue?.remove();host.classList.remove(READY_CLASS);console.info('3D background failed; static background',err);return;}
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
function drawScene(){
 renderer.render(scene,camera);
 if(foregroundScene){renderer.clearDepth();renderer.autoClear=false;renderer.render(foregroundScene,camera);renderer.autoClear=true;}
}
function resize(){
  if(!renderer||!root||!camera||!isLanding())return;
  const width=Math.max(1,root.clientWidth||window.innerWidth),height=Math.max(1,root.clientHeight||window.innerHeight);
  let dpr=Math.min(window.devicePixelRatio||1,2);
  const pixels=width*height*dpr*dpr;
  if(pixels>MAX_PIXEL_COUNT)dpr*=Math.sqrt(MAX_PIXEL_COUNT/pixels);
  renderer.setPixelRatio(dpr);renderer.setSize(width,height,false);
  camera.aspect=width/height;
  // Wider camera at portrait keeps the principal hillside and bird in the safe frame.
  camera.fov=width<600?56:width<900?49:43;
  camera.position.z=width<850?30:26;
  camera.updateProjectionMatrix();
  frameMascots(width,height);
  if(firstDraw&&isLanding()){drawScene();updateScrollCue();}
}
function frameMascots(width,height){
 if(!scenes.pressCub||!scenes.cub)return;
 camera.updateMatrixWorld(true);
 const visibleHeight=Math.min(height,window.innerHeight),portrait=width/visibleHeight<.80;
 function fit(object,cx,bottom,pixelHeight,maxWidth,depth){
  object.rotation.y=.08;object.scale.setScalar(1);object.position.set(0,0,depth);object.updateMatrixWorld(true);
  function screenBounds(){const box=new THREE.Box3().setFromObject(object),xs=[],ys=[];
   for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){const p=new THREE.Vector3(x,y,z).project(camera);xs.push((p.x*.5+.5)*width);ys.push((.5-p.y*.5)*height);}
   return {left:Math.min(...xs),right:Math.max(...xs),top:Math.min(...ys),bottom:Math.max(...ys)};
  }
  let bounds=screenBounds();object.scale.setScalar(Math.min(pixelHeight/(bounds.bottom-bounds.top),maxWidth/(bounds.right-bounds.left)));
  const projectAt=(x,y)=>{const ray=new THREE.Vector3(x/width*2-1,1-y/height*2,.5).unproject(camera).sub(camera.position).normalize();return camera.position.clone().addScaledVector(ray,(depth-camera.position.z)/ray.z);};
  // Correct perspective-projected bounds twice; the head and pencil remain safe.
  for(let i=0;i<3;i++){object.updateMatrixWorld(true);bounds=screenBounds();const origin=projectAt((bounds.left+bounds.right)/2,bounds.bottom),target=projectAt(cx*width,bottom);object.position.add(target.sub(origin));}
 }
 const mainHeight=Math.min(visibleHeight*(portrait?.30:.34),width*(portrait?.56:.31));
 const floor=visibleHeight-68;
 fit(scenes.pressCub.root,portrait?.36:.44,floor,mainHeight,width*(portrait?.58:.30),4);
 fit(scenes.cub.root,portrait?.74:.67,floor-(portrait?mainHeight*.17:6),mainHeight*.62,width*(portrait?.42:.29),-.5);
}
function replayCub(){
 if(!renderer||!shouldAnimate())return;
 cancelFrames();cubTime=0;introDone=false;last=0;
 if(root)root.dataset.ck3dIntroDone='false';
 queueFrame();
}
function createScrollCue(host){
 cubButton=document.createElement('button');cubButton.type='button';
 cubButton.setAttribute('aria-label','사자를 눌러 몽당연필 애니메이션 다시 재생');
 cubButton.title='눌러서 몽당연필 다시 움직이기';
 cubButton.style.cssText='position:absolute;z-index:2;pointer-events:auto;border:0;background:transparent;padding:0;border-radius:35%;cursor:pointer;';
 cubButton.addEventListener('click',replayCub);
 host.append(cubButton);
 scrollCue=document.createElement('button');
 scrollCue.type='button';scrollCue.textContent='SCROLL DOWN ↓';
 scrollCue.setAttribute('aria-label','아래로 스크롤하여 학습 시작');
 scrollCue.style.cssText='position:absolute;z-index:8;pointer-events:auto;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 12px);transform:translateX(-50%);white-space:nowrap;border:1px solid rgba(255,255,255,.5);border-radius:99px;padding:9px 13px;background:rgba(238,247,222,.86);color:#284b38;font:600 clamp(10px,1vw,13px)/1.2 Pretendard,sans-serif;letter-spacing:.12em;opacity:0;visibility:hidden;cursor:pointer;box-shadow:0 3px 14px #244b3320;';
 scrollCue.addEventListener('click',()=>{
  const target=document.querySelector('#main [data-go="home"]');
  if(target)target.click();else window.scrollBy({top:window.innerHeight,behavior:REDUCED.matches?'instant':'smooth'});
 });
 host.append(scrollCue);
}
function updateScrollCue(){
 if(!scrollCue||!scenes.pressCub||!camera)return;
 // Project the real character bounds, so the entire lion and pencil are clickable.
 if(cubButton){
  const box=new THREE.Box3().setFromObject(scenes.pressCub.root);
  const points=[];
  for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z])
   points.push(new THREE.Vector3(x,y,z).project(camera));
  const xs=points.map(p=>(p.x*.5+.5)*root.clientWidth),ys=points.map(p=>(-p.y*.5+.5)*root.clientHeight);
  cubButton.style.left=Math.max(0,Math.min(...xs))+'px';
  cubButton.style.top=Math.max(0,Math.min(...ys))+'px';
  cubButton.style.width=(Math.max(...xs)-Math.min(...xs))+'px';
  cubButton.style.height=(Math.max(...ys)-Math.min(...ys))+'px';
  scrollCue.style.left=Math.max(85,Math.min(root.clientWidth-85,(Math.max(...xs)+Math.min(...xs))/2))+'px';
  scrollCue.style.bottom=Math.max(12,root.clientHeight-Math.min(root.clientHeight,window.innerHeight)+12)+'px';
 }
 // The hint belongs to the viewport, not to the lion's moving paw.
 // Keep the button centered just above the viewport's safe-area bottom.
 const visible=isLanding()&&!document.hidden;
 scrollCue.style.visibility=visible?'visible':'hidden';
 scrollCue.style.opacity=visible?'1':'0';
}
function onPointer(e){
  if(e.pointerType!=='mouse'||!shouldAnimate())return;
  pointer.x=clamp((e.clientX/window.innerWidth-.5)*2,-1,1);
  pointer.y=clamp((e.clientY/window.innerHeight-.5)*2,-1,1);
  // Keep the settled frame entirely idle, including mouse movement.
}
window.addEventListener('pointerleave',()=>{pointer.x=0;pointer.y=0;},{passive:true});
function onVisibility(){synchronizeActivity()}
function tick(ms){
  frameId=0;if(!renderer||!shouldAnimate())return;
  lastPaint=ms;
  const dt=last?Math.min(.1,(ms-last)/1000):FRAME_MS/1000;last=ms;elapsed+=dt;
  const focused=Boolean(document.body?.classList.contains('ck-v8-study-focus'));
  const intensity=focused?.18:1;
  if(!focused){playTime+=dt;cubTime=Math.min(INTRO_SECONDS,cubTime+dt);}
  for(const tr of scenes.trees){const breeze=Math.sin(elapsed*2*Math.PI/tr.tempo+tr.phase)*tr.amp;const cursor=pointer.x*tr.amp*.72;tr.crown.rotation.z=lerp(tr.crown.rotation.z,(breeze+cursor)*intensity,1-Math.exp(-dt*2.3));}
  for(const cl of scenes.clouds){cl.group.position.x+=dt*cl.speed*intensity;if(cl.group.position.x>105)cl.group.position.x=-110;}
  // Time-locked ball passes animate before the bird's peck decisions.
  scenes.machine?.animate(playTime);
  scenes.cub?.animate(playTime);
  scenes.pressCub?.animate(cubTime);
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
  drawScene();
  frameCount++;updateScrollCue();
  if(cubTime>=INTRO_SECONDS&&!introDone){introDone=true;if(root)root.dataset.ck3dIntroDone='true';}
  queueFrame();
}
function cleanup(){
  cancelFrames();
  resizeObserver?.disconnect();
  if(renderer){renderer.domElement.remove();renderer.forceContextLoss?.();renderer.dispose();renderer=null;activeLast=false;}
  cubButton?.remove();scrollCue?.remove();cubButton=null;scrollCue=null;root?.classList.remove(READY_CLASS);
}
function initialize(){
 window.addEventListener('ck:scene-texture-ready',()=>{if(renderer&&isLanding()&&windowFocused&&!document.hidden)drawScene();});
 window.addEventListener('ck:scene-activity',synchronizeActivity);
 window.addEventListener('blur',()=>{windowFocused=false;synchronizeActivity()});
 window.addEventListener('focus',()=>{windowFocused=true;synchronizeActivity()});
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
window.CK3DPerformance=Object.freeze({getState:()=>({active:!!(frameId||renderTimer),idle:!shouldAnimate(),cubSettled:introDone,antialias:true,fpsCap:24,shadowPasses:0,initialized:!!renderer,landing:isLanding(),hidden:document.hidden,frames:frameCount,quality:QUALITY,dpr:renderer?.getPixelRatio?.()||0})});
