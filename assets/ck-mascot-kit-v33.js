// Shared geometry and palette keep the two siblings recognizably related.
export function mascotKit(T){
 const geo=new T.SphereGeometry(1,32,24);
 const mat=(color,roughness=.72)=>new T.MeshStandardMaterial({color,roughness,metalness:0});
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
  ball(head,m.fur,0,0,0,.96,.88,.73);
  // Cheek fullness and short forehead tufts, rather than an adult mane.
  for(const s of [-1,1]){
   const ear=new T.Group();ear.position.set(s*.77,.65,-.11);ear.rotation.z=-s*.20;head.add(ear);ears.push(ear);
   ball(ear,m.fur,0,0,0,.34,.38,.20);ball(ear,m.pink,0,.01,.17,.225,.26,.055);
   ball(head,m.light,s*.63,-.27,.35,.35,.28,.32);
   tuft(head,s*.81,-.14,.13,.22,m.light).rotation.z=s*.9;
   const eye=new T.Group();eye.position.set(s*.365,.10,.635);eye.rotation.y=s*.20;head.add(eye);eyes.push(eye);
   if(sleeping){curve(eye,[[-.20,.025,.09],[-.1,-.045,.13],[0,-.07,.14],[.1,-.045,.13],[.20,.025,.09]],m.dark,.027);}
   else{
    ball(eye,m.cream,0,0,0,.278,.338,.10);
    ball(eye,m.iris,-s*.018,-.016,.075,.225,.279,.075);
    ball(eye,m.black,-s*.025,-.008,.133,.174,.224,.04);
    ball(eye,m.white,-.065,.11,.171,.069,.082,.015);
    ball(eye,m.white,.077,-.098,.175,.029,.032,.012);
   }
   curve(head,[[s*.19,.49,.66],[s*.32,.53,.68],[s*.47,.49,.62]],m.tuft,.038);
  }
  for(let i=0;i<3;i++)tuft(head,-.16+i*.15,.80+i*.035,.19,.24-i*.035,m.light);
  ball(head,m.cream,0,-.43,.55,.54,.37,.28);
  // Open smile beneath two soft muzzle pads.
  if(!sleeping){ball(head,m.dark,0,-.45,.795,.24,.23,.047);ball(head,m.pink,0,-.56,.84,.13,.066,.015);}
  else curve(head,[[-.18,-.43,.85],[0,-.51,.88],[.18,-.43,.85]],m.nose,.021);
  for(const s of [-1,1]){
   ball(head,m.cream,s*.22,-.30,.705,.30,.22,.18);
   for(const [dx,dy] of [[.12,-.25],[.28,-.23],[.21,-.34]])ball(head,m.nose,s*dx,dy,.884,.024,.020,.013);
   ball(head,m.pink,s*.61,-.20,.65,.095,.04,.013);
  }
  const shape=new T.Shape();shape.moveTo(-.145,0);shape.quadraticCurveTo(0,.065,.145,0);shape.quadraticCurveTo(.07,-.13,0,-.14);shape.quadraticCurveTo(-.07,-.13,-.145,0);
  const nose=put(head,new T.ExtrudeGeometry(shape,{depth:.045,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.022,bevelThickness:.02}),m.nose,0,-.255,.876);
  ball(head,m.pink,-.036,-.25,.945,.035,.018,.009);
  return {head,eyes,ears};
 }
 function paw(p,x,y,z,scale=1){const q=new T.Group();q.position.set(x,y,z);q.scale.setScalar(scale);p.add(q);ball(q,m.fur,0,0,0,.34,.25,.30);ball(q,m.pad,0,-.015,.277,.135,.12,.018);for(const s of [-1,0,1])ball(q,m.pad,s*.13,.115,.25,.048,.055,.022);return q;}
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
