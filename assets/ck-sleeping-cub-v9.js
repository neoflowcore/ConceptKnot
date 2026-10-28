// ConceptKnot v9 — original resting lion cub modeled from procedural geometry.
// Reference: tawny young lion, rounded dark-backed ears, short muzzle, freckles.
// No copyrighted character geometry or third-party model assets.
export function buildSleepingCub(THREE, scene, heightAt, quality=1) {
  const root = new THREE.Group();
  const cx=4.9, cz=-10.8;
  root.position.set(cx,heightAt(cx,cz)+.16,cz);
  root.rotation.y=-.13;
  root.scale.setScalar(.98);
  scene.add(root);
  const n=quality>1?22:14;
  const matte=(color,rough=.87)=>new THREE.MeshPhysicalMaterial({
    color,roughness:rough,metalness:0,clearcoat:.09,clearcoatRoughness:.88
  });
  const fur=matte(0xd9a065),lit=matte(0xefbd7d),shadow=matte(0xb87c43),
    belly=matte(0xf5d9a8),muzzle=matte(0xf7dabb),earInside=matte(0x724b39),
    dark=matte(0x463729),freckle=matte(0x715139),
    pawShade=matte(0xb68a58),ballBlue=matte(0x2b99b6,.51),stripe=matte(0xf5e3ae,.53);
  const sphereGeo=new THREE.SphereGeometry(1,n,Math.max(10,Math.round(n*.68)));
  const put=(parent,geo,mat,x,y,z,sx=1,sy=1,sz=1)=>{
    const m=new THREE.Mesh(geo,mat);
    m.position.set(x,y,z);m.scale.set(sx,sy,sz);
    m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
  };
  const group=new THREE.Group();root.add(group);
  // Short soft-furred, round-bodied lion cub resting on its stomach.
  const chest=new THREE.Group();group.add(chest);
  const body=put(chest,sphereGeo,fur,-.38,1.05,-.54,1.57,.75,1.27);
  put(chest,sphereGeo,lit,-.76,1.09,.03,.8,.55,.76);
  put(chest,sphereGeo,belly,-.16,.64,.44,.76,.25,.91);
  const hip=put(chest,sphereGeo,shadow,-1.45,.82,-.82,.67,.61,.77);
  // Rear paws fold outward; two broad cream-toed forepaws face the viewer.
  for(const side of [-1,1]){
    put(group,sphereGeo,fur,-1.27,.39,-1.12+side*.56,.54,.40,.49);
    const leg=put(group,sphereGeo,lit,.62,.38,.51+side*.59,.35,.36,.80);
    leg.rotation.z=side*.12;
    const foot=put(group,sphereGeo,lit,.73,.24,1.20+side*.53,.43,.28,.50);
    for(let j=-1;j<=1;j++)put(group,sphereGeo,belly,
      .86+j*.19,.16,1.57+side*.51,.094,.11,.16);
    for(let j=-1;j<=1;j++)put(group,sphereGeo,pawShade,
      .84+j*.19,.19,1.66+side*.51,.023,.04,.027);
  }
  // Small blue-and-gold ball is literally beneath the chin: a pillow.
  const ball=new THREE.Group();ball.position.set(.81,.52,1.99);group.add(ball);
  put(ball,sphereGeo,ballBlue,0,0,0,.66,.66,.66);
  const band=put(ball,new THREE.TorusGeometry(.65,.085,10,32),stripe,0,0,0);
  band.rotation.set(.63,.16,0);
  put(ball,sphereGeo,stripe,0,.64,0,.13,.09,.13);
  // Sleepy head extends slightly forward so the muzzle rests on the ball.
  const head=new THREE.Group();
  head.position.set(.67,1.26,1.00);head.rotation.z=-.11;group.add(head);
  put(head,sphereGeo,fur,0,.10,0,.92,.88,.80);
  put(head,sphereGeo,lit,0,.36,.31,.72,.49,.47);
  // Raised eyebrows and rounded ears with visible inner shadow.
  for(const side of [-1,1]){
    const ear=put(head,sphereGeo,shadow,side*.72,.78,-.26,.34,.39,.23);
    ear.rotation.z=side*.25;
    put(head,sphereGeo,earInside,side*.72,.79,-.034,.20,.24,.06);
  }
  // Cream chin, dark triangular nose and two padded muzzle lobes.
  put(head,sphereGeo,belly,0,-.40,.63,.59,.38,.40);
  for(const side of [-1,1])put(head,sphereGeo,muzzle,side*.31,-.18,.73,.39,.27,.31);
  const nose=put(head,new THREE.ConeGeometry(.17,.23,3),dark,0,-.14,1.03);
  nose.rotation.x=Math.PI/2;
  // Closed eyes drawn as small curved dark lashes (not dark open pupils).
  for(const side of [-1,1]){
    const eye=new THREE.Mesh(new THREE.TorusGeometry(.235,.035,7,18,Math.PI),dark);
    eye.position.set(side*.39,.14,.69);
    eye.rotation.z=side===-1?.15:-.15;
    eye.rotation.x=-.24;
    eye.castShadow=false;head.add(eye);
    const brow=put(head,sphereGeo,shadow,side*.38,.29,.69,.23,.045,.04);
    brow.rotation.z=side*.17;
    // Three recognizable dark freckle spots on each cheek.
    for(const [dx,dy] of [[0,-.22],[.18,-.30],[-.12,-.34]]){
      put(head,sphereGeo,freckle,side*(.27+dx),dy,.990-(Math.abs(dx)*.13),.039,.032,.019);
    }
    // Small whiskers follow the side of the light muzzle.
    for(let i=0;i<2;i++){
      const a=new THREE.Vector3(side*.39,-.28-i*.09,.97);
      const b=new THREE.Vector3(side*(.88+i*.06),-.26-i*.20,.88);
      const curve=new THREE.LineCurve3(a,b);
      const w=put(head,new THREE.TubeGeometry(curve,5,.009,4,false),dark);
      w.castShadow=false;
    }
  }
  put(head,sphereGeo,dark,0,-.40,1.02,.03,.12,.025);
  // Curved short tawny tail with dark tuft, tucked around hind leg.
  const tail=new THREE.Group();tail.position.set(-1.68,.92,-1.27);group.add(tail);
  const tailCurve=new THREE.CatmullRomCurve3([
    new THREE.Vector3(0,0,0),new THREE.Vector3(-.56,.13,-.30),
    new THREE.Vector3(-.79,.34,-.60),new THREE.Vector3(-.70,.54,-.93)
  ]);
  put(tail,new THREE.TubeGeometry(tailCurve,16,.14,8,false),fur);
  put(tail,sphereGeo,shadow,-.70,.57,-.96,.25,.27,.37);
  // Tiny patches across forehead evoke juvenile textured coat.
  for(const [x,y,z] of [[-.27,.60,.53],[.17,.63,.55],[.39,.53,.45],[-.47,.47,.42]]){
    put(head,sphereGeo,shadow,x,y,z,.048,.033,.025);
  }
  const groundShadow=put(root,new THREE.CircleGeometry(2.55,32),
    new THREE.MeshBasicMaterial({color:0x184737,transparent:true,opacity:.20,depthWrite:false}),-.29,.03,.18);
  groundShadow.rotation.x=-Math.PI/2;groundShadow.castShadow=false;
  function animate(time) {
    const breath=Math.sin(time*1.28);
    chest.scale.y=1+.026*breath;
    body.scale.y=.75+.017*breath;
    head.position.y=1.26+.027*breath;
    head.rotation.z=-.11+.025*Math.sin(time*.73);
    // Brief ear twitch every 9 seconds instead of constant random wagging.
    const twitch=Math.pow(Math.max(0,Math.sin(time*2.1)),15);
    const earMotion=.055*twitch;
    head.rotation.y=earMotion;
    tail.rotation.z=.045*Math.sin(time*.62);
    ball.rotation.z=.022*Math.sin(time*.66);
  }
  animate(0);
  return {root,head,tail,ball,animate,expression:"asleep",spotCount:10};
}
