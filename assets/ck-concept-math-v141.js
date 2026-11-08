/* ConceptKnot P6-B v141: deterministic, offline concept-graph mathematics.
 * Illustrative market only; never a canonical exam answer or a market forecast.
 * No localStorage or network access in this module.
 */
(function(root, factory){
 'use strict';
 const api=factory();
 if(typeof module==='object' && module.exports)module.exports=api;
 if(root)root.CK141GraphMath=api;
})(typeof window==='object'?window:(typeof globalThis==='object'?globalThis:null),function(){
 'use strict';
 const BASE=Object.freeze({a:120,b:2,c:20,d:2,u:0,v:0,price:25});
 const KEYS=Object.keys(BASE),LIMIT=100,EPS=1e-8;
 const MODES=['free','mission','compare','exam'];
 const TOPICS=['market','elasticity','relation'];
 const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
 const round=(n,d=3)=>Number(Number(n).toFixed(d));
 const copy=s=>Object.fromEntries(KEYS.map(k=>[k,s[k]]));
 const same=(a,b)=>KEYS.every(k=>Math.abs(a[k]-b[k])<EPS);
 function sanitize(raw){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return null;
  const s={};
  for(const k of KEYS){
   if(typeof raw[k]!=='number'||!Number.isFinite(raw[k]))return null;
   s[k]=raw[k];
  }
  if(s.a<0||s.a>300||s.c< -100||s.c>200||
     s.b<.5||s.b>5||s.d<.5||s.d>5||
     s.u< -80||s.u>80||s.v< -80||s.v>80||
     s.price<0||s.price>60)return null;
  return s;
 }
 function demandAt(s,p){return s.a+s.u-s.b*p;}
 function supplyAt(s,p){return s.c+s.v+s.d*p;}
 function solve(s){
  const denominator=s.b+s.d;
  if(!Number.isFinite(denominator)||denominator<=EPS)
   return {ok:false,reason:'기울기 합이 0 이하입니다.'};
  const price=(s.a+s.u-s.c-s.v)/denominator;
  const quantity=demandAt(s,price);
  if(!Number.isFinite(price)||!Number.isFinite(quantity)||price<0||quantity<0)
   return {ok:false,reason:'양의 가격·수량 영역에서 균형을 계산할 수 없습니다.'};
  return {ok:true,price:round(price),quantity:round(quantity)};
 }
 function point(s,p=s.price){
  const qd=demandAt(s,p),qs=supplyAt(s,p);
  return {price:round(p),qd:round(qd),qs:round(qs),
   demandElasticity:qd>EPS?round(-s.b*p/qd):null,
   supplyElasticity:qs>EPS?round(s.d*p/qs):null};
 }
 function transition(state,type,value){
  const s=sanitize(state);
  if(!s)return null;
  const next=copy(s);
  if(type==='reset')return copy(BASE);
  if(!Number.isFinite(value))return null;
  const n=Number(value);
  switch(type){
   case 'set-demand':next.u=clamp(round(n),-80,80);break;
   case 'set-supply':next.v=clamp(round(n),-80,80);break;
   case 'adjust-demand':next.u=clamp(round(s.u+n),-80,80);break;
   case 'adjust-supply':next.v=clamp(round(s.v+n),-80,80);break;
   case 'change-price-point':next.price=clamp(round(n),0,60);break;
   case 'adjust-demand-slope':{
    const b=clamp(round(n),.5,5);
    // Rotation about the price=25 point; Qd(25) remains invariant.
    next.a=round(s.a+(b-s.b)*25);next.b=b;break;
   }
   case 'adjust-supply-slope':{
    const d=clamp(round(n),.5,5);
    // Rotation about price=25; Qs(25) remains invariant.
    next.c=round(s.c-(d-s.d)*25);next.d=d;break;
   }
   default:return null;
  }
  return sanitize(next);
 }
 function direction(n){
  return n>EPS?'증가':n< -EPS?'감소':'불변';
 }
 function describe(before,after,action){
  const prev=solve(before),next=solve(after),p=point(after);
  if(action==='change-price-point'){
   return {cause:'가격점 P='+p.price+'로 이동. 수요·공급곡선은 움직이지 않았습니다.',
    result:'이 가격에서 수요량 '+p.qd+', 공급량 '+p.qs+'. 이 두 수량은 균형거래량이 아닙니다.',
    caution:'자기 가격 변화는 같은 곡선 위의 수요량·공급량 변화이며, 곡선 자체의 이동과 구별해야 합니다.'};
  }
  if(!prev.ok||!next.ok){
   return {cause:'곡선의 조건을 변경했습니다.',result:next.ok?'현재 균형 P='+next.price+', Q='+next.quantity:next.reason,
    caution:'유효한 양(+)의 균형이 없는 경우 증가·감소를 단정하지 않습니다.'};
  }
  const du=after.u-before.u,dv=after.v-before.v;
  const slopeChanged=Math.abs(after.b-before.b)>EPS||Math.abs(after.d-before.d)>EPS;
  let cause='조건이 바뀌지 않았습니다.';
  if(slopeChanged)cause='기울기를 조절했습니다. 가격 25에서의 수량을 고정한 채 곡선을 회전시켰습니다.';
  else if(Math.abs(du)>EPS&&Math.abs(dv)>EPS)cause='수요와 공급의 비가격 요인이 모두 바뀌어 두 곡선이 이동했습니다.';
  else if(Math.abs(du)>EPS)cause='수요의 비가격 요인 변화: 수요곡선 '+(du>0?'우측':'좌측')+' 이동. 공급곡선은 고정했습니다.';
  else if(Math.abs(dv)>EPS)cause='공급의 비가격 요인 변화: 공급곡선 '+(dv>0?'우측':'좌측')+' 이동. 수요곡선은 고정했습니다.';
  const result='균형가격 '+prev.price+' → '+next.price+' ('+direction(next.price-prev.price)+
   ' '+round(Math.abs(next.price-prev.price))+'), 균형거래량 '+prev.quantity+' → '+next.quantity+
   ' ('+direction(next.quantity-prev.quantity)+' '+round(Math.abs(next.quantity-prev.quantity))+').';
  const caution=slopeChanged?'기울기와 가격탄력성은 다른 개념입니다. 교차점 및 점탄력성을 따로 계산합니다.':
    Math.abs(du)>EPS&&Math.abs(dv)>EPS?'두 곡선이 동시에 이동할 때 가격 방향은 상대적인 이동 폭과 기울기에 따라 달라집니다.':
    '곡선 전체의 이동(수요·공급 변화)과 한 곡선 위의 점 이동(수요량·공급량 변화)을 혼동하지 마세요.';
  return {cause,result,caution};
 }
 function relation(k,x){
  if(!Number.isFinite(k)||!Number.isFinite(x)||k<=0||x<=0)return null;
  return {x:round(x),k:round(k),direct:round(k*x),inverse:round(k/x),ratio:round(k),
   product:round(k),description:'정비례는 y/x=k(일정), 반비례는 x·y=k(일정). 두 관계를 혼동하지 않습니다.'};
 }
 function snapshot(h){return {state:copy(h.state),previous:copy(h.previous),action:h.action};}
 function validSnapshot(h){
  if(!h||typeof h!=='object')return null;
  const state=sanitize(h.state),previous=sanitize(h.previous);
  if(!state||!previous||typeof h.action!=='string'||h.action.length>60)return null;
  return {state,previous,action:h.action};
 }
 function createHistory(raw){
  const initial=sanitize(raw?.state)||copy(BASE);
  let h={state:initial,previous:copy(BASE),action:'initial'};
  let past=[],future=[],drag=null;
  let mode='free',topic='market';
  if(raw?.version===1&&Array.isArray(raw.past)&&Array.isArray(raw.future)&&
    raw.past.length<=LIMIT&&raw.future.length<=LIMIT&&
    MODES.includes(raw.mode)&&TOPICS.includes(raw.topic)){
   const current=validSnapshot(raw);
   const p=raw.past.map(validSnapshot),f=raw.future.map(validSnapshot);
   if(current&&p.every(Boolean)&&f.every(Boolean)){h=current;past=p;future=f;mode=raw.mode;topic=raw.topic;}
  }
  const api={
   get state(){return copy(h.state);},get previous(){return copy(h.previous);},
   get action(){return h.action;},get mode(){return mode;},get topic(){return topic;},
   get canUndo(){return past.length>0;},get canRedo(){return future.length>0;},
   get isDragging(){return Boolean(drag);},
   setMode(value){if(!MODES.includes(value))return false;mode=value;return true;},
   setTopic(value){if(!TOPICS.includes(value))return false;topic=value;return true;},
   apply(type,value){
    if(drag)return false;
    const next=transition(h.state,type,value);
    if(!next||same(next,h.state))return false;
    past.push(snapshot(h));if(past.length>LIMIT)past.shift();
    future=[];h={state:next,previous:copy(h.state),action:type};return true;
   },
   begin(){if(drag)return false;drag=snapshot(h);return true;},
   preview(type,value){
    if(!drag)return false;
    const next=transition(drag.state,type,value);
    if(!next)return false;
    h={state:next,previous:copy(drag.state),action:type};return true;
   },
   finish(){
    if(!drag)return false;
    const orig=drag,changed=!same(h.state,orig.state);
    drag=null;
    if(!changed){h=orig;return false;}
    past.push(orig);if(past.length>LIMIT)past.shift();future=[];
    h.previous=copy(orig.state);return true;
   },
   cancel(){if(!drag)return false;h=drag;drag=null;return true;},
   undo(){if(drag||!past.length)return false;
    future.push(snapshot(h));if(future.length>LIMIT)future.shift();h=past.pop();return true;
   },
   redo(){if(drag||!future.length)return false;
    past.push(snapshot(h));if(past.length>LIMIT)past.shift();h=future.pop();return true;
   },
   reset(){return api.apply('reset');},
   export(){return {version:1,...snapshot(h),past:past.map(x=>({...x})),
    future:future.map(x=>({...x})),mode,topic};},
   explanation(){return describe(h.previous,h.state,h.action);},
   missionComplete(){return h.state.u>=20&&Math.abs(h.state.v)<EPS&&
     Math.abs(h.state.b-2)<EPS&&Math.abs(h.state.d-2)<EPS;}
  };
  return api;
 }
 function verifiedLink(occurrence,question,conceptId){
  if(!occurrence||occurrence.verificationStatus!=='verified'||!Array.isArray(occurrence.coreConceptIds)||
   !occurrence.coreConceptIds.includes(conceptId)||!Array.isArray(occurrence.evidenceIds)||
   occurrence.evidenceIds.length===0)return false;
  return Boolean(question&&question.verified===true&&question.subject==='estate'&&
   question.id===occurrence.questionId);
 }
 return Object.freeze({BASE,KEYS,sanitize,copy,solve,point,transition,describe,relation,
  createHistory,verifiedLink,limit:LIMIT});
});
