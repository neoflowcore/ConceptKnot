/* ConceptKnot v146: SVG relation geometry only; never captures non-chart UI. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.CK146RelationGesture=api;})(typeof window==='object'?window:null,function(){
'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function pointer(e,box){
 if(!box||!box.width||!box.height)return null;
 const scale=Math.min(box.width/660,box.height/400);
 if(!(scale>0))return null;
 const x=(e.clientX-box.left-(box.width-660*scale)/2)/scale,y=(e.clientY-box.top-(box.height-400*scale)/2)/scale;
 return Number.isFinite(x)&&Number.isFinite(y)&&x>=70&&x<=610&&y>=40&&y<=340?{x,y,scale}:null;
}
function segment(p,a,b){
 const vx=b.x-a.x,vy=b.y-a.y,t=clamp(((p.x-a.x)*vx+(p.y-a.y)*vy)/Math.max(1e-7,vx*vx+vy*vy),0,1);
 return Math.hypot(p.x-a.x-vx*t,p.y-a.y-vy*t);
}
function nearest(e,box,rel,pointerType='touch'){
 const p=pointer(e,box);if(!p||!rel||!(rel.k>=1&&rel.k<=3))return null;
 let best=null;
 for(const kind of ['direct','inverse']){
  let last=null;
  for(let i=0;i<=120;i++){
   const x=.5+4.5*i/120,y=kind==='direct'?rel.k*x:rel.k/x,now={x:70+540*x/5,y:340-300*y/8};
   if(last){const d=segment(p,last,now);if(!best||d<best.distance)best={kind,distance:d};}
   last=now;
  }
 }
 if(!best||best.distance*p.scale>(pointerType==='mouse'?19:34))return null;
 return {kind:best.kind,key:'k',grabX:clamp((p.x-70)*5/540,.5,5),distancePx:best.distance*p.scale};
}
functio¶»§q«^