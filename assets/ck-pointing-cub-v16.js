// Original second baby lion: presses a short, red, downward-pointing pencil.
export function buildPencilCub(THREE,scene,heightAt,quality=1){
 const root=new THREE.Group(),x=0,z=-1.8;
 root.position.set(x,heightAt(x,z)+.10,z);root.rotation.y=.12;root.scale.setScalar(1.42);scene.add(root);
 // Move forward in perspective rather than faking screen-space enlargement.
 // Portrait framing keeps the head above the bottom navigation cue.
 function setViewport(width,height){
  const portrait=height>width*1.12;
  const depth=portrait?.4:width<900?-.7:-1.8;
  const scale=portrait?1.28:width<900?1.34:1.42;
  root.position.set(x,heightAt(x,depth)+.10,depth);
  root.scale.setScalar(scale);
 }
 const geometry=new THREE.SphereGeometry(1,32,24);
 const mat=(color,roughness=.85)=>new THREE.MeshLambertMaterial({color});
 const tan=mat(0xdaa46a),lit=mat(0xefbf85),cream=mat(0xf9ddad),
  dark=mat(0x46392e),ear=mat(0x774a3a),red=mat(0xe8504b,.5),
  blush=mat(0xff7771,.45),wood=mat(0xf2c791),graphite=mat(0x2b343a),silver=mat(0xddc8bd,.52);
 const add=(parent,g,m,x,y,z,sx=1,sy=1,sz=1)=>{
  const object=new THREE.Mesh(g,m);object.position.set(x,y,z);object.scale.set(sx,sy,sz);
  object.castShadow=true;object.receiveShadow=true;parent.add(object);return object;
 };
 const torso=new THREE.Group();root.add(torso);
 add(torso,geometry,tan,-.21,.70,-.25,.87,.81,.76);
 add(torso,geometry,cream,-.12,.59,.24,.48,.57,.32);
 for(const side of [-1,1]){
  add(root,geometry,tan,side*.57,.20,.47,.44,.28,.53);
  for(let j=-1;j<=1;j++)add(root,geometry,cream,side*.57+j*.14,.13,.88,.096,.102,.13);
 }
 const head=new THREE.Group();head.position.set(-.10,1.72,.28);root.add(head);
 add(head,geometry,tan,0,0,0,.84,.79,.70);
 add(head,geometry,lit,0,.23,.32,.69,.46,.43);
 for(const side of [-1,1]){
  add(head,geometry,tan,side*.67,.64,-.26,.30,.33,.23);
  add(head,geometry,ear,side*.68,.65,-.02,.175,.20,.057);
  // Raised crescent eyes stay in front of the forehead, never buried in it.
  const eyePath=new THREE.CatmullRomCurve3([
   new THREE.Vector3(side*.27-.10,.13,.81),
   new THREE.Vector3(side*.27,.21,.83),
   new THREE.Vector3(side*.27+.10,.13,.81)
  ]);
  add(head,new THREE.TubeGeometry(eyePath,16,.026,6,false),dark,0,0,0);
  add(head,geometry,blush,side*.49,-.12,.74,.105,.065,.025);
  add(head,geometry,cream,side*.23,-.28,.58,.30,.22,.31);
  for(const [dx,dy] of [[.16,-.23],[.31,-.25],[.25,-.35]])
   add(head,geometry,dark,side*dx,dy,.925,.038,.036,.017);
 }
 const nose=add(head,new THREE.ConeGeometry(.12,.19,3),dark,0,-.22,.85);nose.rotation.x=Math.PI/2;
 const smilePath=new THREE.CatmullRomCurve3([
  new THREE.Vector3(-.24,-.40,.91),new THREE.Vector3(-.13,-.49,.94),
  new THREE.Vector3(0,-.52,.95),new THREE.Vector3(.13,-.49,.94),
  new THREE.Vector3(.24,-.40,.91)
 ]);
 add(head,new THREE.TubeGeometry(smilePath,24,.025,6,false),dark,0,0,0);
 add(head,geometry,dark,0,-.36,.945,.019,.07,.018);
 const tail=new THREE.Group();root.add(tail);
 const path=new THREE.CatmullRomCurve3([
  new THREE.Vector3(-.90,.56,-.55),new THREE.Vector3(-1.31,.67,-.85),
  new THREE.Vector3(-1.49,.84,-1.11),new THREE.Vector3(-1.49,1.05,-1.17)
 ]);
 add(tail,new THREE.TubeGeometry(path,12,.105,8,false),tan,0,0,0);
 add(tail,geometry,tan,-1.49,1.05,-1.17,.25,.28,.29);
 const stub=new THREE.Group();stub.position.set(.77,1.17,1.04);stub.rotation.z=.065;root.add(stub);
 add(stub,new THREE.CylinderGeometry(.195,.195,1.02,6),red,0,.13,0);
 add(stub,new THREE.CylinderGeometry(.198,.198,.14,6),blush,0,.69,0);
 add(stub,new THREE.CylinderGeometry(.198,.198,.10,6),silver,0,-.43,0);
 const woodTip=add(stub,new THREE.ConeGeometry(.195,.31,6),wood,0,-.66,0);woodTip.rotation.z=Math.PI;
 const tip=add(stub,new THREE.ConeGeometry(.072,.19,6),graphite,0,-.87,0);tip.rotation.z=Math.PI;
 const arm=add(torso,geometry,tan,.40,.98,.40,.31,.53,.34);arm.rotation.z=-.28;
 const other=add(torso,geometry,lit,-.64,.86,.35,.32,.48,.31);other.rotation.z=.36;
 const paw=new THREE.Group();paw.position.set(.46,1.47,.77);root.add(paw);
 add(paw,geometry,tan,.08,-.13,.24,.31,.26,.34);
 add(paw,geometry,cream,.20,-.23,.48,.23,.12,.16);
 const shadow=add(root,new THREE.CircleGeometry(2.07,28),
  new THREE.MeshBasicMaterial({color:0x183e31,transparent:true,opacity:.19,depthWrite:false}),-.03,.04,.25);
 shadow.rotation.x=-Math.PI/2;shadow.castShadow=false;
 const ring=add(root,new THREE.RingGeometry(.31,.37,34),
  new THREE.MeshBasicMaterial({color:0xffe79c,side:THREE.DoubleSide,transparent:true,opacity:.4,depthWrite:false}),.76,.055,1.05);
 ring.rotation.x=-Math.PI/2;ring.castShadow=false;
 function animate(seconds){
  const progress=Math.max(0,Math.min(1,seconds/3.6));
  const eased=progress*progress*(3-2*progress);
  const envelope=Math.sin(Math.PI*progress)**2;
  const cycle=eased*4*Math.PI;
  const push=.5+.5*Math.cos(cycle);
  stub.position.y=1.17-.14*push;
  paw.position.y=1.47-.12*push;paw.rotation.z=.06*push;
  head.rotation.x=-.02+.105*push;
  head.rotation.z=.032*Math.sin(cycle*.5)*envelope;
  torso.scale.y=1+.012*Math.sin(seconds*1.24)*envelope;
  tail.rotation.z=.06*Math.sin(seconds*.9)*envelope;
  ring.scale.setScalar(1+.32*push);
  ring.material.opacity=.23+.38*push;
 }
 animate(0);
 return {root,head,stub,animate,setViewport,expression:'smiling-freckled-pencil-cub',pencilPointingDown:true,getPush:()=>Math.max(0,Math.min(1,(1.17-stub.position.y)/.14))};
}
