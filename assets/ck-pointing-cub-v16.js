import {mascotKit} from './ck-mascot-kit-v33.js';
// Golden sibling, articulated eyes/paws and pencil; existing replay timeline retained.
export function buildPencilCub(T,scene,heightAt,quality=1){
 const k=mascotKit(T),{m,ball,put}=k,root=new T.Group();scene.add(root);
 root.position.set(0,heightAt(0,2),2);
 const torso=new T.Group();root.add(torso);
 ball(torso,m.fur,0,.80,-.06,.70,.82,.55);ball(torso,m.cream,0,.73,.43,.47,.55,.12);
 const {head,eyes,ears}=k.face();head.position.set(0,1.94,.12);head.rotation.z=-.07;root.add(head);
 for(const s of [-1,1]){const foot=k.paw(root,s*.54,.24,.51,1.12);foot.rotation.z=-s*.16;}
 const stub=new T.Group();stub.position.set(.35,.96,1.00);stub.rotation.z=.10;root.add(stub);
 put(stub,new T.CylinderGeometry(.19,.19,1.05,6),m.red,0,.16,0);
 put(stub,new T.CylinderGeometry(.194,.194,.12,6),k.mat(0xff8d91),0,.75,0);
 put(stub,new T.ConeGeometry(.19,.35,6),k.mat(0xf1d098),0,-.54,0).rotation.z=Math.PI;
 put(stub,new T.ConeGeometry(.066,.16,6),m.dark,0,-.77,0).rotation.z=Math.PI;
 const paw=new T.Group();paw.position.set(.15,1.33,.91);root.add(paw);
 ball(paw,m.fur,.03,0,0,.32,.27,.25);ball(paw,m.cream,.09,.01,.19,.19,.17,.075);
 const arm=ball(root,m.fur,-.48,1.08,.42,.29,.46,.29);arm.rotation.z=-.37;
 const other=ball(root,m.fur,.58,1.10,.42,.27,.40,.26);other.rotation.z=.38;
 k.curve(root,[[-.56,.42,-.25],[-1,.46,-.38],[-1.25,.79,-.33],[-1.22,1.02,-.20]],m.fur,.10);k.tuft(root,-1.22,1.06,-.20,.26,m.tuft);
 k.shadow(root,1.45,1.0);
 function animate(seconds){const p=Math.min(1,seconds/3.6),envelope=Math.sin(p*Math.PI)**2,push=(.5+.5*Math.cos(p*4*Math.PI))*envelope;stub.position.y=.96-.17*push;paw.position.y=1.33-.14*push;head.rotation.x=.08*push;head.rotation.z=-.07+.045*Math.sin(p*Math.PI*2);const blink=seconds>1.4&&seconds<1.56?.16:1;for(const e of eyes)e.scale.y=blink;ears[0].rotation.z=.2+.05*envelope;}
 animate(0);return {root,head,stub,animate,setViewport(){},expression:'golden-baby-open-eyes',pencilPointingDown:true};
}
