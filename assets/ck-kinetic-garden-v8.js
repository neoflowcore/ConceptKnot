// ConceptKnot v8 kinetic study garden: original Three.js geometry.
// All active pieces run on ONE 17-second timeline and one CLOSED ball track.
export function buildStudyMachine(THREE, scene, terrain, quality) {
  const center=new THREE.Group();
  center.position.set(0,terrain(0,-29)+1.35,-29);
  scene.add(center);
  const material=(color,roughness=.64)=>new THREE.MeshPhysicalMaterial({
    color,roughness,metalness:0,clearcoat:.25,clearcoatRoughness:.54
  });
  const put=(parent,geometry,mat,x=0,y=0,z=0)=>{
    const obj=new THREE.Mesh(geometry,mat);
    obj.position.set(x,y,z);obj.castShadow=true;obj.receiveShadow=true;
    parent.add(obj);return obj;
  };
  const colors=[0xf05a55,0xf5b92e,0x137cd4,0xf07da5,0x39b27e,0xff824d];
  // The island has an actual ring-shaped surface, not a flat lawn.
  const pit=put(center,new THREE.CylinderGeometry(3.12,2.7,1.8,48),
    material(0x173b33,.98),0,-1.16,0);
  pit.castShadow=false;
  const dark=put(center,new THREE.CircleGeometry(3.1,48),
    new THREE.MeshBasicMaterial({color:0x092b2a,side:THREE.DoubleSide}),0,-.16,0);
  dark.rotation.x=-Math.PI/2;dark.castShadow=false;
  const lawn=put(center,new THREE.RingGeometry(3.5,7.98,60),
    material(0x3b8d46,.94),0,.32,0);
  lawn.rotation.x=-Math.PI/2;lawn.castShadow=false;
  for(const [r,y,width,col] of [[3.53,.12,.24,0xe6bd63],
    [7.5,.34,.81,0x2f8446],[7.94,-.12,.16,0xb1a34a]]){
    const rim=put(center,new THREE.TorusGeometry(r,width,10,64),
      material(col,.72),0,y,0);
    rim.rotation.x=Math.PI/2;
  }
  const blades=quality>1?48:24;
  for(let i=0;i<blades;i++){
    const angle=i*2*Math.PI/blades;
    const grass=put(center,new THREE.ConeGeometry(.13,.62+(i%5)*.1,5),
      material([0x348448,0x78aa43,0x276b4c][i%3],.94),
      Math.cos(angle)*7.43,.84,Math.sin(angle)*7.43);
    grass.rotation.z=.18*Math.sin(i*1.6);
  }
  // Main blue spiral-like 3D ceramic rail: no endpoints.
  const control=[[-12,8,-5],[-9,10.9,-8],[-3,12.5,-8],[4,11.6,-7],
    [10,9.1,-4],[12.4,7,1],[9.1,5,5.2],[3.1,3.8,7.5],
    [-4.4,4.1,7],[-11,5.5,3.8],[-14,7.2,-1.6]].map(p=>new THREE.Vector3(...p));
  const path=new THREE.CatmullRomCurve3(control,true,'centripetal',.46);
  const segments=quality>1?224:148;
  put(center,new THREE.TubeGeometry(path,segments,.3,8,true),material(0x1780c5,.29));
  const highlightPath=new THREE.CatmullRomCurve3(control.map(p=>
    new THREE.Vector3(p.x,p.y+.23,p.z+.15)),true,'centripetal',.46);
  const shine=put(center,new THREE.TubeGeometry(highlightPath,segments,.075,6,true),
    new THREE.MeshBasicMaterial({color:0x9ae9ff,transparent:true,opacity:.78,depthWrite:false}));
  shine.castShadow=false;
  // Colored striped balls have actual rotation proportional to path length.
  const count=quality>1?6:4,balls=[];
  for(let i=0;i<count;i++){
    const carrier=new THREE.Group(),body=new THREE.Group();carrier.add(body);center.add(carrier);
    put(body,new THREE.SphereGeometry(.64,quality>1?24:16,quality>1?16:12),material(colors[i],.31));
    const stripe=put(body,new THREE.TorusGeometry(.635,.085,8,30),material(0xffefd7,.36));
    stripe.rotation.set(.42,.62,0);
    put(body,new THREE.SphereGeometry(.13,8,6),material(0xffe9cc,.38),0,.61,0);
    balls.push({carrier,body,offset:i/count});
  }
  // Funnel at top of loop — same colors as the circulating balls.
  const funnel=new THREE.Group();funnel.position.set(-11.1,12.45,-5.5);funnel.rotation.z=.12;center.add(funnel);
  put(funnel,new THREE.CylinderGeometry(2.13,.52,2.0,28,1,true),
    material(0xffe6c6,.58),0,-.38,0);
  put(funnel,new THREE.CylinderGeometry(.50,.61,1.5,14),
    material(0xdcc08d,.7),0,-1.9,0);
  const bowlLip=put(funnel,new THREE.TorusGeometry(2.13,.16,10,32),
    material(0xfff4dc,.49),0,.64,0);bowlLip.rotation.x=Math.PI/2;
  for(let i=0;i<4;i++)put(funnel,new THREE.SphereGeometry(.39,12,10),
    material(colors[i],.38),(i-1.5)*.77,.83,i%2?-.32:.32);
  put(center,new THREE.BoxGeometry(4.7,.64,1.0),material(0xc47b49,.58),-11.1,9,-5.3).rotation.z=-.11;
  // Hinged textbook on the central lawn.
  const book=new THREE.Group();book.position.set(-5.2,6.25,-1.8);book.rotation.y=.18;center.add(book);
  put(book,new THREE.BoxGeometry(3.4,4.6,.69),material(0x174f41,.52),0,0,-.33);
  put(book,new THREE.BoxGeometry(3.13,4.25,.58),material(0xfff1d8,.87),.08,0,-.24);
  put(book,new THREE.BoxGeometry(.32,4.62,.75),material(0xc79f58,.6),-1.7,0,-.17);
  const cover=new THREE.Group();cover.position.x=-1.7;book.add(cover);
  put(cover,new THREE.BoxGeometry(3.43,4.65,.16),material(0x287351,.5),1.71,0,.12);
  const knot=put(cover,new THREE.TorusGeometry(.57,.12,8,28),
    material(0xf3ca74,.44),1.69,.61,.26);
  knot.rotation.y=.2;
  for(let j=0;j<3;j++)put(cover,new THREE.BoxGeometry(1.68,.08,.025),
    material(0xe0c286,.65),1.69,-.6-j*.48,.24);
  // Moving pencil (not arbitrary bobbing: its angle follows the same lap).
  const pencil=new THREE.Group();pencil.position.set(-8.4,3.1,5.2);center.add(pencil);
  put(pencil,new THREE.CylinderGeometry(.45,.45,5.8,7),material(0xfbb738,.49));
  put(pencil,new THREE.ConeGeometry(.45,1.12,7),material(0xffe0a2,.65),0,-3.42,0).rotation.z=Math.PI;
  put(pencil,new THREE.ConeGeometry(.13,.40,7),material(0x294247,.56),0,-4.04,0).rotation.z=Math.PI;
  put(pencil,new THREE.CylinderGeometry(.46,.46,.64,7),material(0xec7882,.48),0,3.26,0);
  // Spiral memo / progress checklist.
  const memo=new THREE.Group();memo.position.set(7.3,5.03,1.8);memo.rotation.y=-.15;center.add(memo);
  put(memo,new THREE.BoxGeometry(4.8,5.1,.35),material(0xffedcc,.8));
  put(memo,new THREE.BoxGeometry(4.9,.52,.39),material(0xf4a85a,.52),0,2.33,.03);
  for(let i=0;i<6;i++){
    const coil=put(memo,new THREE.TorusGeometry(.18,.065,7,16),
      material(0xb7804e,.52),-1.98+i*.78,2.61,.22);
    coil.rotation.x=.24;
  }
  for(let i=0;i<4;i++){
    const yy=1.25-i*.94;
    const box=put(memo,new THREE.RingGeometry(.16,.25,4),
      material(0x278a66,.58),-1.65,yy,.2);
    box.rotation.z=Math.PI/4;
    put(memo,new THREE.BoxGeometry(2.85,.067,.03),
      material(0x8fb3a0,.75),.24,yy,.23);
  }
  // Chart climbs in phase with arrivals on the right-hand track.
  const chart=new THREE.Group();chart.position.set(10.8,1.12,-3.5);chart.rotation.y=-.26;center.add(chart);
  const heights=[1.55,2.6,3.8,5.15],bars=[];
  for(let i=0;i<4;i++){
    const obj=put(chart,new THREE.BoxGeometry(1.27,1,1.45),
      material([0xeb8d51,0xf4c14f,0x80b454,0x289668][i],.5),
      -2+i*1.47,heights[i]/2,0);
    bars.push({obj,max:heights[i],i});
  }
  const arrow=put(chart,new THREE.ConeGeometry(.42,.95,6),
    material(0x138866,.52),2.48,5.58,0);
  arrow.rotation.z=-.31;
  put(chart,new THREE.CylinderGeometry(.085,.085,2.4,8),
    material(0x19896b,.57),2.24,4.70,0).rotation.z=-.31;
  const ring=put(center,new THREE.TorusGeometry(3.7,.09,6,50),
    new THREE.MeshBasicMaterial({color:0xf8dd90,transparent:true,opacity:.58,depthWrite:false}),0,.64,0);
  ring.rotation.x=Math.PI/2;ring.castShadow=false;
  const lapSeconds=17,pathLength=path.getLength();
  const tangent=new THREE.Vector3(),axis=new THREE.Vector3();
  function animate(seconds){
    const phase=(seconds/lapSeconds)%1,twopi=2*Math.PI;
    for(const ball of balls){
      const u=(phase+ball.offset)%1;
      path.getPointAt(u,ball.carrier.position);
      path.getTangentAt(u,tangent);
      axis.set(0,1,0).cross(tangent);
      if(axis.lengthSq()<.006)axis.set(1,0,0);
      else axis.normalize();
      ball.body.quaternion.setFromAxisAngle(axis,-(seconds/lapSeconds+ball.offset)*pathLength/.64);
    }
    pencil.rotation.z=-.84+.12*Math.sin(twopi*phase);
    cover.rotation.y=.12+.31*(.5+.5*Math.cos(twopi*phase-1.5));
    memo.rotation.z=-.05+.034*Math.sin(twopi*phase-2.0);
    for(const bar of bars){
      const rise=.53+.47*(.5+.5*Math.cos(twopi*phase-bar.i*.62-2.1));
      const y=bar.max*rise;
      bar.obj.scale.y=y;bar.obj.position.y=y/2;
    }
    ring.rotation.z=twopi*phase;
  }
  animate(0);
  return {animate,lapSeconds,ballCount:count,trackClosed:path.closed};
}
