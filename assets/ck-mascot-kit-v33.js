import {attachFace} from './ck-face-atlas-v35.js';
// Shared geometry and palette keep the two siblings recognizably related.
export function mascotKit(T){
 const geo=new T.SphereGeometry(1,32,24);
 const mat=(color,roughness=.72)=>new T.MeshStandardMaterial({color,roughness,metalness:0,emissive:color,emissiveIntensity:.075});
 const m={fur:mat(0xffc14b),light:mat(0xffcf67),cream:mat(0xffedc7),pink:mat(0xefaa8d),nose:mat(0x82442f,.4),dark:mat(0x3d241c),iris:mat(0x70402a,.25),black:mat(0x171821,.17),white:mat(0xffffff,.2),tuft:mat(0xe99631),pad:mat(0xb56f4c),red:mat(0xef484a,.38)};
 if(typeof document!=='undefined'){
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;
  const ctx=canvas.getContext('2d');let seed=33;
  ctx.fillStyle='#888';ctx.fillRect(0,0,128,128);
  for(let i=0;i<2600;i++){seed=(seed*1664525+1013904223)>>>0;const x=seed%128;seed=(seed*1664525+1013904223)>>>0;const y=seed%128;ctx.strokeStyle=i%2?'#aaa':'#666';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+.5,y+2);ctx.stroke();}
  const texture=new T.CanvasTexture(canvas);texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(3,3);
  for(const material of [m.fur,m.light,m.tuft]){material.bumpMap=texture;material.bumpScale=.018;}
 }
 function put(parent,geometry,material,x=0,y=0,z=0,sx=1,sy=1,sz=1){const mesh=new T.Mesh(geometry,material);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);parent.add(mesh);return mesh;}
 const ball=(p,material,x,y,z,sx,sy,sz)=>put(p,geo,material,x,y,z,sx,sy,sz);
 function curve(p,points,material=m.dark,radius=.024){return put(p,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(q=>new T.Vector3(...q))),24,radius,7,false),material);}
 function tuft(p,x,y,z,scale=.24,material=m.fur){const q=ball(p,material,x,y,z,scale*.55,scale,scale*.48);q.rotation.z=-.45;return q;}
 function face(sleeping=false){
  const head=new T.Group(),eyes=[],ears=[];
  ball(head,m.fur,0,0,0,1.0,.89,.74);
  // Cheek fullness and short forehead tufts, rather than an adult mane.
  for(const s of [-1,1]){
   const ear=new T.Group();ear.position.set(s*.77,.65,-.11);ear.rotation.z=-s*.20;head.add(ear);ears.push(ear);
   ball(ear,m.fur,0,0,0,.34,.38,.20);ball(ear,m.pink,0,.01,.17,.225,.26,.055);
   ball(head,m.light,s*.63,-.27,.35,.35,.28,.32);
   tuft(head,s*.81,-.14,.13,.22,m.light).rotation.z=s*.9;
  }
  for(let i=0;i<5;i++){const t=tuft(head,-.21+i*.11,.82+Math.sin(i*.6)*.035,.19,.24-i*.02,m.light);t.rotation.z=-.50+i*.09;}
  // Fine gold silhouette tufts break up the smooth plastic outline.
  const tuftGeo=new T.ConeGeometry(.019,.09,3),coat=new T.InstancedMesh(tuftGeo,m.light,420),dummy=new T.Object3D();
  for(let i=0;i<420;i++){const a=i*2.399,yy=-.60+(i/420)*1.35,r=Math.sqrt(1-yy*yy);const normal=new T.Vector3(Math.cos(a)*r,yy,Math.sin(a)*r);dummy.position.set(normal.x*1.0,normal.y*.89,normal.z*.74);dummy.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),normal);dummy.scale.setScalar(.6+(i%7)*.09);dummy.updateMatrix();coat.setMatrixAt(i,dummy.matrix);}coat.instanceMatrix.needsUpdate=true;head.add(coat);
  const face=attachFace(T,head,sleeping);
  return {head,eyes,ears,face};
 }
 function paw(p,x,y,z,scale=1){const q=new T.Group();q.position.set(x,y,z);q.scale.setScalar(scale);p.add(q);ball(q,m.fur,0,0,0,.37,.275,.31);ball(q,m.cream,0,.015,.19,.32,.23,.13);const pad=ball(q,m.pad,0,-.03,.317,.135,.115,.016);for(let i=0;i<4;i++){const a=(i-1.5)*.55;ball(q,m.fur,Math.sin(a)*.24,.12+Math.cos(a)*.07,.14,.115,.10,.17);ball(q,m.pad,Math.sin(a)*.235,.12+Math.cos(a)*.07,.304,.047,.056,.015);}return q;}
 function shadow(root,rx=1.5,rz=1){const q=put(root,new T.CircleGeometry(1,48),new T.MeshBasicMaterial({color:0x385521,transparent:true,opacity:.16,depthWrite:false}),0,.012,0,rx,rz,1);q.rotation.x=-Math.PI/2;return q;}
 return {m,geo,mat,put,ball,curve,tuft,face,paw,shadow};
}
export function makeApple(T,color=0xef403c,r=.64){
 const root=new T.Group(),geo=new T.SphereGeometry(r,24,18),v=geo.attributes.position;
 for(let i=0;i<v.count;i++){const x=v.getX(i),y=v.getY(i),z=v.getZ(i),a=Math.atan2(z,x),top=Math.max(0,y/r);const lobes=1+.065*Math.cos(5*a)*(Math.abs(y)/r)**2;v.setXYZ(i,x*lobes,y-.14*r*top**7+.045*r*Math.cos(a*5)*(1-top)*top,z*lobes);}
 geo.computeVertexNormals();root.add(new T.Mesh(geo,new T.MeshStandardMaterial({color,roughness:.32,metalness:0})));
 const stem=new T.Mesh(new T.CylinderGeometry(r*.047,r*.063,r*.42,8),new T.MeshStandardMaterial({color:0x79502e,roughness:.9}));stem.position.set(.025,r*1.01,0);stem.rotation.z=-.22;root.add(stem);
 const leaf=new T.Shape();leaf.moveTo(0,0);leaf.quadraticCurveTo(r*.42,r*.36,r*.7,r*.19);leaf.quadraticCurveTo(r*.43,-r*.10,0,0);
 const lm=new T.Mesh(new T.ShapeGeometry(leaf,10),new T.MeshStandardMaterial({color:0x55a836,side:T.DoubleSide,roughness:.8}));lm.position.set(.04,r*1.08,0);lm.rotation.y=-.3;root.add(lm);return root;
}
