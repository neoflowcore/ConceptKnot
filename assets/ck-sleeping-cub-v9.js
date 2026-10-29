import {mascotKit} from './ck-mascot-kit-v33.js';
export function buildSleepingCub(T,scene,heightAt,quality=1){
 const k=mascotKit(T),{m,ball,put}=k,root=new T.Group();root.position.set(4.9,heightAt(4.9,-4),-4);scene.add(root);
 const cardboard=new T.Group();root.add(cardboard);
 const kraft=k.mat(0xc2935c),edge=k.mat(0x9e7045);
 // Thin creased panels form a genuinely crushed box, not an intact cube.
 put(cardboard,new T.BoxGeometry(2.9,.12,1.7),kraft,0,.15,.16);
 const flap=put(cardboard,new T.BoxGeometry(1.45,.07,1.70),kraft,-.81,.27,.15);flap.rotation.z=.14;
 const flap2=put(cardboard,new T.BoxGeometry(1.35,.07,1.70),kraft,.62,.24,.15);flap2.rotation.z=-.11;
 for(const s of [-1,1]){const wall=put(cardboard,new T.BoxGeometry(.09,.28,1.7),edge,s*1.4,.17,.16);wall.rotation.z=s*.43;}
 for(let i=0;i<15;i++)put(cardboard,new T.BoxGeometry(.055,.034,.04),edge,-1.3+i*.18,.23,1.03);
 k.curve(cardboard,[[-1.4,.2,1.035],[-.5,.24,1.035],[0,.14,1.035],[.6,.23,1.035],[1.4,.15,1.035]],edge,.018);
 const chest=new T.Group();root.add(chest);
 const body=ball(chest,m.fur,.74,.66,-.24,1.05,.63,.65);body.rotation.z=-.12;
 ball(chest,m.cream,.73,.45,.25,.66,.30,.29);
 const {head,ears}=k.face(true);head.position.set(-.48,.99,.30);head.rotation.z=.23;head.scale.setScalar(.84);root.add(head);
 for(const s of [-1,1])ball(root,m.fur,-.45+s*.30,.39,.85,.29,.17,.27);
 const foot=k.paw(root,1.25,.33,.54,.91);foot.rotation.z=.25;
 k.curve(root,[[1.35,.48,-.29],[1.83,.42,-.15],[2.01,.61,.03],[1.96,.86,.11]],m.fur,.10);k.tuft(root,1.96,.9,.11,.24,m.tuft);
 k.shadow(root,2,1.2);
 function animate(time){const breath=Math.sin(time*1.25);chest.scale.y=1+.024*breath;head.position.y=.99+.009*breath;ears[0].rotation.z=.2+.04*Math.max(0,Math.sin(time*.65))**16;}
 animate(0);return {root,head,animate,expression:'asleep-on-crushed-cardboard',cardboard};
}
