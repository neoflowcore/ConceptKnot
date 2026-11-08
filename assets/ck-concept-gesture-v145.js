/* ConceptKnot v145: geometry-only pointer targeting for touch, mouse and S Pen.
 * SVG is 660x400; CSS viewBox may have letterboxing on narrow screens.
 * No global input interception and no user-data access.
 */
(function(root,factory){
 'use strict';const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.CK145GraphGesture=api;
})(typeof window==='object'?window:null,function(){
 'use strict';
 const W=660,H=400;
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 function pointer(e,rect,w=W,h=H){
  if(!rect||rect.width<=0||rect.height<=0)return null;
  const scale=Math.min(rect.width/w,rect.height/h);
  if(!(scale>0))return null;
  const offsetX=(rect.width-w*scale)/2,offsetY=(rect.height-h*scale)/2;
  const x=(Number(e.clientX)-rect.left-offsetX)/scale;
  const y=(Number(e.clientY)-rect.top-offsetY)/scale;
  if(!Number.isFinite(x)||!Number.isFinite(y))return null;
  return {x,y,scale,offsetX,offsetY,inside:x>=0&&x<=w&&y>=0&&y<=h};
 }
 const qx=q=>70+540*q/160;
 const yp=p=>340-300*p/60;
 function segmentDistance(x,y,xa,ya,xb,yb){
  const dx=xb-xa,dy=yb-ya,len=dx*dx+dy*dy;
  const t=len>1e-9?clamp(((x-xa)*dx+(y-ya)*dy)/len,0,1):0;
  return Math.hypot(x-(xa+t*dx),y-(ya+t*dy));
 }
 function nearestMarket(e,rect,state,pointerType='touch'){
  const p=pointer(e,rect);
  if(!p||!p.inside||!state)return null;
  const price0=0,price1=60;
  const qd=P=>state.a+state.u-state.b*P;
  const qs=P=>state.c+state.v+state.d*P;
  let candidate=null;
  for(const [kind,value] of [['demand',qd],['supply',qs]]){
   const d=segmentDistance(p.x,p.y,qx(value(price0)),yp(price0),qx(value(price1)),yp(price1));
   if(!candidate||d<candidate.distanceSvg)candidate={kind,distanceSvg:d};
  }
  const distancePx=candidate.distanceSvg*p.scale;
  // Touch/stylus target is deliberately much larger than SVG stroke width.
  const thresholdPx=pointerType==='mouse'?21:36;
  if(distancePx>thresholdPx)return null;
  return {kind:candidate.kind,price:clamp((340-p.y)/5,0,60),distancePx,
   x:p.x,y:p.y,scale:p.scale};
 }
 function nearestTheory(e,rect,scene,id,pointerType='touch'){
  const p=pointer(e,rect,630,395);
  if(!p||!p.inside||!scene?.paths?.length)return null;
  const keys={
   budget:{'예산선':'I','무차별곡선':'alpha'},
   ppf:{PPF:'ymax'},
   cost:{'한계수입 MR':'A','한계비용 MC':'c'},
   rent:{'입찰지대':'R0'},
   cobweb:{'역수요':'a','역공급':'c'},
   arc:{'호 구간':'q2'}
  };
  const accepted=keys[id]||{};
  const toX=x=>46+530*x/scene.maxX,toY=y=>333-286*y/scene.maxY;
  let result=null;
  for(const item of scene.paths){
   const key=accepted[item.label];
   if(!key||!item.pts||item.pts.length<2)continue;
   for(let i=1;i<item.pts.length;i++){
    const a=item.pts[i-1],b=item.pts[i];
    const distanceSvg=segmentDistance(p.x,p.y,toX(a[0]),toY(a[1]),toX(b[0]),toY(b[1]));
    if(!result||distanceSvg<result.distanceSvg)
     result={key,label:item.label,distanceSvg};
   }
  }
  if(!result)return null;
  const distancePx=result.distanceSvg*p.scale;
  if(distancePx>(pointerType==='mouse'?19:34))return null;
  return {key:result.key,label:result.label,distancePx,x:p.x,y:p.y,scale:p.scale};
 }
 return Object.freeze({pointer,nearestMarket,nearestTheory,segmentDistance});
});
