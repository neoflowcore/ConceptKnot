/* ConceptKnot P6-B v149. Curve-aware pointer geometry and reversible per-figure lesson state.
 * Schematic SVG coordinates are NEVER official exam quantities or market statistics.
 */
(function(root,factory){
 'use strict';const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.CK149GraphMotion=api;
})(typeof window==='object'?window:null,function(){
 'use strict';
 const clamp=(n,min,max)=>Math.min(max,Math.max(min,Number(n)||0));
 const round=n=>Math.round(clamp(n,0,100));
 const direction=c=>Number(c?.shift)<0?-1:1;
 const SIZE={width:560,height:348};
 const defaultSnapshot=(chart,value=0)=>{
  const sign=direction(chart),v=round(value);
  return {value:v,sign,demand:v,supply:v,demandSign:sign,supplySign:sign};
 };
 const copy=s=>({...s});
 const same=(a,b)=>a&&b&&['value','sign','demand','supply','demandSign','supplySign']
  .every(k=>a[k]===b[k]);
 function timeline(chart,initial=0){
  let current=defaultSnapshot(chart,initial),past=[],future=[];
  return {
   get state(){return copy(current)},
   get canUndo(){return past.length>0},
   get canRedo(){return future.length>0},
   get pastCount(){return past.length},
   get futureCount(){return future.length},
   set(s){current=copy(s);return copy(current)},
   commit(before){
    if(!same(before,current)){past.push(copy(before));if(past.length>80)past.shift();future=[];return true}
    return false;
   },
   undo(){if(!past.length)return null;future.push(copy(current));current=past.pop();return copy(current)},
   redo(){if(!future.length)return null;past.push(copy(current));current=future.pop();return copy(current)},
   reset(){const original=defaultSnapshot(chart,0);const was=copy(current);current=original;this.commit(was);return copy(current)}
  };
 }
 function boxPoint(event,rect){
  if(!rect||!Number.isFinite(rect.width)||!Number.isFinite(rect.height)||rect.width<=0||rect.height<=0)return null;
  const scale=Math.min(rect.width/SIZE.width,rect.height/SIZE.height);
  if(!(scale>0))return null;
  const x=(Number(event.clientX)-rect.left-(rect.width-SIZE.width*scale)/2)/scale;
  const y=(Number(event.clientY)-rect.top-(rect.height-SIZE.height*scale)/2)/scale;
  return Number.isFinite(x)&&Number.isFinite(y)?{x,y,scale}:null;
 }
 const segdist=(x,y,a,b)=>{
  const dx=b[0]-a[0],dy=b[1]-a[1];
  const t=clamp(((x-a[0])*dx+(y-a[1])*dy)/Math.max(.000001,dx*dx+dy*dy),0,1);
  return Math.hypot(x-a[0]-dx*t,y-a[1]-dy*t);
 };
 const polylines=chart=>{
  const c=chart||{},type=c.type;
  const demand=[[100,86],[485,286]],supply=[[110,300],[480,80]];
  if(type==='elasticity')return [{kind:'curve',points:[[135,142],[460,220]]},{kind:'curve',points:[[285,65],[320,310]]}];
  if(type==='distance')return [{kind:'curve',points:Array.from({length:30},(_,i)=>{
   const t=i/29,u=1-t;return [u*u*120+2*u*t*255+t*t*485,u*u*85+2*u*t*225+t*t*295];})}];
  if(type==='stock')return [{kind:'curve',points:[[112,260],[210,234],[300,203],[387,176],[472,147]]},
   {kind:'curve',points:[[112,270],[210,270],[210,245],[300,245],[300,224],[387,224],[387,210],[472,210]]}];
  const all=[{kind:'demand',points:demand},{kind:'supply',points:supply}];
  if(type==='along')return all.slice(0,1);
  if(type==='demand')return all.slice(0,1);
  if(type==='supply')return all.slice(1);
  return all;
 };
 function nearest(svg,event,chart){
  if(!svg||!event||!chart)return null;
  const rect=svg.getBoundingClientRect?.(),p=boxPoint(event,rect);if(!p)return null;
  const threshold=event.pointerType==='mouse'?20:35;
  const allowed=polylines(chart).map(x=>x.kind);
  let best=null;
  // Sample the rendered path when the browser provides its geometry. CSS transforms
  // are included by getScreenCTM, so old and new line positions are both hit-testable.
  const paths=Array.from(svg.querySelectorAll?.('.ck21-curve')||[]);
  for(let pathIndex=0;pathIndex<paths.length;pathIndex++){
   const path=paths[pathIndex];
   if(path.closest?.('.ck149-previous-curves'))continue; // Ghost is read-only.
   const kind=chart.type==='elasticity'||chart.type==='distance'||chart.type==='stock'?'curve':
    path.classList?.contains?.('supply')?'supply':'demand';
   if(!allowed.includes(kind))continue;
   if(!path.getTotalLength||!path.getPointAtLength||!path.getScreenCTM)continue;
   try{
    const length=path.getTotalLength(),m=path.getScreenCTM();
    if(!(length>0)||!m)continue;
    const convert=u=>{const point=path.getPointAtLength(length*u);
      return [m.a*point.x+m.c*point.y+m.e,m.b*point.x+m.d*point.y+m.f]};
    let a=convert(0);
    for(let i=1;i<=56;i++){
     const b=convert(i/56),d=segdist(event.clientX,event.clientY,a,b);
     if(!best||d<best.distancePx)best={kind,distancePx:d,pathIndex};
     a=b;
    }
   }catch{}
  }
  // Static fallback supports older SVG implementations and deterministic tests.
  if(!best){
   for(const [pathIndex,line] of polylines(chart).entries()){
    let a=line.points[0];
    for(let i=1;i<line.points.length;i++){
     const b=line.points[i],d=segdist(p.x,p.y,a,b)*p.scale;
     if(!best||d<best.distancePx)best={kind:line.kind,distancePx:d,pathIndex};
     a=b;
    }
   }
  }
  if(!best||best.distancePx>threshold)return null;
  return {...best,pointerX:p.x,pointerY:p.y};
 }
 function drag(snapshot,chart,kind,start,event,rect){
  const p=boxPoint(event,rect),first=boxPoint(start,rect);
  if(!p||!first||!snapshot)return null;
  const dx=p.x-first.x,dy=p.y-first.y;
  if(chart.type==='demand'||chart.type==='supply'||chart.type==='both'){
   const target=chart.type==='both'?(kind==='supply'?'supply':'demand'):chart.type;
   const slope=target==='supply'?-220/370:200/385;
   const delta= Math.abs(dx)>=Math.abs(dy)*.6?dx:-dy/slope;
   const factor=100/Math.max(1,Math.abs(Number(chart.shift)||65));
   const original=chart.type==='both'?snapshot[target]:snapshot.value;
   const origSign=chart.type==='both'?snapshot[target+'Sign']:snapshot.sign;
   const signed=clamp(origSign*original+delta*factor,-100,100);
   const sign=signed<0?-1:signed>0?1:origSign;
   const value=round(Math.abs(signed)),next=copy(snapshot);
   if(chart.type==='both'){
    next[target]=value;next[target+'Sign']=sign;next.value=Math.max(next.demand,next.supply);
   }else{next.value=value;next.sign=sign;next[target]=value;next[target+'Sign']=sign;}
   return next;
  }
  // All other figures have movable observation points, not fabricated
  // slope/elasticity changes. Vertical gestures are available for S Pen.
  const delta=Math.abs(dx)>=Math.abs(dy)*.7?dx/320*100:-dy/215*100;
  return {...snapshot,value:round(snapshot.value+delta)};
 }
 function offsets(chart,s){
  const extent=Math.abs(Number(chart.shift)||55);
  if(chart.type==='demand')return {demand:s.sign*s.value/100*extent,supply:0};
  if(chart.type==='supply')return {demand:0,supply:s.sign*s.value/100*extent};
  if(chart.type==='both')return {demand:s.demandSign*s.demand/100*extent,supply:s.supplySign*s.supply/100*extent};
  return {demand:0,supply:0};
 }
 function equilibrium(d,s){
  const dm=200/385,sm=-220/370;
  const x=(300-86+dm*(100+d)-sm*(110+s))/(dm-sm);
  return {x,y:86+dm*(x-100-d)};
 }
 function outcome(chart,s){
  const shift=offsets(chart,s),start=equilibrium(0,0),end=equilibrium(shift.demand,shift.supply);
  const name=n=>n>1e-5?'증가':n< -1e-5?'감소':'불변';
  return {demand:shift.demand,supply:shift.supply,start,end,
   quantity:name(end.x-start.x),price:name(start.y-end.y),
   schematic:true};
 }
 return Object.freeze({SIZE,round,direction,defaultSnapshot,copy,same,timeline,
  boxPoint,polylines,nearest,drag,offsets,equilibrium,outcome});
});