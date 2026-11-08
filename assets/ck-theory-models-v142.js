/* ConceptKnot v142 independent economic simulations. No network or user-data access. */
(function(root,factory){
 const api=factory();
 if(typeof module==="object" && module.exports)module.exports=api;
 if(root)root.CK142Models=api;
})(typeof window==="object"?window:null,function(){
 "use strict";
 const S={
  budget:{
   name:"예산선·무차별곡선",axes:["X 수량","Y 수량"],
   theory:"두 재화의 예산제약과 Cobb-Douglas 효용 극대화",
   assumption:"소득·가격·선호 외 조건 일정, 내점해, U=X^αY^(1−α)",
   f:{I:[120,60,240,10,"예산 I"],px:[10,5,20,1,"X 가격"],py:[10,5,20,1,"Y 가격"],alpha:[.5,.2,.8,.05,"선호 α"]}},
  ppf:{
   name:"생산가능곡선",axes:["X 생산량","Y 생산량"],
   theory:"기술과 자원이 일정할 때 기회비용과 효율성",
   assumption:"Y=Ymax·(1−(X/Xmax)^γ), γ>1인 오목형 PPF",
   f:{xmax:[100,60,160,10,"X 최대"],ymax:[100,60,160,10,"Y 최대"],gamma:[2,1.2,3,.1,"곡선 휨 γ"],x:[50,0,120,1,"관찰 X"],u:[1,.5,1.2,.05,"가동비율"]}},
  cost:{
   name:"수입·한계비용",axes:["생산량 Q","한계수입·비용"],
   theory:"단일 생산자의 MR=MC 이윤극대화",
   assumption:"P=A−bQ, TC=F+cQ+kQ², 단일 생산자(완전경쟁 아님)",
   f:{A:[100,60,140,5,"수요 절편"],b:[1,.5,2,.1,"수요 기울기"],c:[20,10,60,5,"단위비용"],k:[.5,.2,1,.1,"비용증가"],F:[200,0,700,50,"고정비"],q:[20,0,60,1,"관찰 Q"]}},
  rent:{
   name:"도심거리·지대",axes:["도심에서 거리","입찰지대"],
   theory:"입찰지대와 접근성",
   assumption:"R=max(0,R0−t·d), 용도·교통·규제 등 다른 조건은 고정",
   f:{R0:[120,60,200,10,"도심 지대"],t:[8,2,15,1,"거리저항"],d:[5,0,20,.5,"관찰 거리"]}},
  cobweb:{
   name:"거미집 모형",axes:["수량 Q","가격 P"],
   theory:"전기 가격에 반응하는 공급과 시장 조정",
   assumption:"Q_t=c+d·P_(t−1), P_t=(a−Q_t)/b",
   f:{a:[120,80,160,10,"수요 절편"],b:[2,1,3,.5,"수요 반응"],c:[20,0,50,5,"공급 절편"],d:[1,.5,4,.5,"공급 반응"],p0:[40,10,60,1,"전기 가격"]}},
  arc:{
   name:"호탄력성",axes:["수량 Q","가격 P"],
   theory:"중간점 공식으로 수요의 호탄력성 계산",
   assumption:"같은 수요곡선의 두 점이라고 가정; 점탄력성과 구분",
   f:{p1:[20,5,60,1,"전 가격"],p2:[30,5,60,1,"후 가격"],q1:[90,10,160,5,"전 수량"],q2:[70,10,160,5,"후 수량"]}}
 };
 const ids=Object.keys(S),eps=1e-8;
 const round=x=>Math.round((x+Number.EPSILON)*10000)/10000;
 function initial(id){return Object.fromEntries(Object.entries(S[id].f).map(e=>[e[0],e[1][0]]));}
 function valid(id,s){
  if(!S[id]||!s||typeof s!=="object"||Array.isArray(s))return false;
  for(const key of Object.keys(S[id].f)){
   const v=s[key],rule=S[id].f[key];
   if(typeof v!=="number"||!Number.isFinite(v)||v<rule[1]-eps||v>rule[2]+eps)return false;
  }
  return id!=="ppf"||s.x<=s.xmax;
 }
 function set(id,s,key,value){
  if(!valid(id,s)||!S[id].f[key]||!Number.isFinite(value))return null;
  const f=S[id].f[key],n={...s,[key]:round(Math.max(f[1],Math.min(f[2],value)))};
  if(id==="ppf"&&n.x>n.xmax)n.x=n.xmax;
  return valid(id,n)?n:null;
 }
 function calc(id,s){
  if(!valid(id,s))return null;
  if(id==="budget"){
   const x=s.alpha*s.I/s.px,y=(1-s.alpha)*s.I/s.py;
   return {x:round(x),y:round(y),ix:round(s.I/s.px),iy:round(s.I/s.py),
    slope:round(-s.px/s.py),utility:round(x**s.alpha*y**(1-s.alpha)),
    expense:round(x*s.px+y*s.py),message:"예산을 모두 사용하는 최적 내점"};
  }
  if(id==="ppf"){
   const frontier=s.ymax*(1-(s.x/s.xmax)**s.gamma);
   return {x:s.x,y:round(frontier*s.u),frontier:round(frontier),
    mrt:round(s.ymax*s.gamma*(s.x/s.xmax)**(s.gamma-1)/s.xmax),
    message:s.u>1+eps?"현재 자원으로 불가능":s.u<1-eps?"곡선 안쪽 · 비효율":"곡선 위 · 생산 효율"};
  }
  if(id==="cost"){
   const optimal=Math.max(0,(s.A-s.c)/(2*(s.b+s.k)));
   const profit=q=>(s.A-s.b*q)*q-(s.F+s.c*q+s.k*q*q);
   return {x:s.q,y:round(s.c+2*s.k*s.q),optimal:round(optimal),
    mr:round(s.A-2*s.b*s.q),mc:round(s.c+2*s.k*s.q),
    profit:round(profit(s.q)),maxProfit:round(profit(optimal)),
    message:"단기 이윤 최대화는 MR=MC 또는 Q=0 경계"};
  }
  if(id==="rent")return {x:s.d,y:round(Math.max(0,s.R0-s.t*s.d)),
   zeroAt:round(s.R0/s.t),message:"다른 조건 일정 시 거리 증가에 따라 입찰지대 하락"};
  if(id==="cobweb"){
   const eqP=(s.a-s.c)/(s.b+s.d),eqQ=s.c+s.d*eqP,factor=-s.d/s.b;
   let p=s.p0,stopped=false;const path=[];
   for(let t=1;t<=12;t++){
    const q=s.c+s.d*p,next=(s.a-q)/s.b;
    if(q<0||next<0||!Number.isFinite(next)){stopped=true;break;}
    path.push({t,p:round(next),q:round(q)});p=next;
   }
   const mode=Math.abs(factor)<1-eps?"수렴":Math.abs(factor)>1+eps?"발산":"중립 진동";
   return {x:round(eqQ),y:round(eqP),eqP:round(eqP),eqQ:round(eqQ),
    factor:round(factor),path,stopped,message:mode+(stopped?" · 음수 가격에서 계산 중지":"")};
  }
  const dp=(s.p2-s.p1)/((s.p1+s.p2)/2);
  const elasticity=Math.abs(dp)>eps?((s.q2-s.q1)/((s.q1+s.q2)/2))/dp:null;
  return {x:s.q2,y:s.p2,e:elasticity===null?null:round(elasticity),
   magnitude:elasticity===null?null:round(Math.abs(elasticity)),
   message:elasticity===null?"가격 불변 · 탄력성 정의 불가":elasticity>0?
    "같은 방향 변화 · 다른 조건 변화 여부 검토":"일반적인 수요법칙과 부합"};
 }
 function drawing(id,s){
  const z=calc(id,s);if(!z)return null;
  let maxX=170,maxY=170;
  const paths=[],points=[];
  function line(label,tone,fn,a,b){
   const pts=[];
   for(let i=0;i<=60;i++){
    const x=a+(b-a)*i/60,y=fn(x);
    if(Number.isFinite(y)&&y>=0)pts.push([round(x),round(y)]);
   }
   paths.push({label,tone,pts});
  }
  if(id==="budget"){
   maxX=50;maxY=50;
   line("예산선","blue",x=>(s.I-s.px*x)/s.py,0,z.ix);
   line("무차별곡선","orange",x=>(z.utility/(x**s.alpha))**(1/(1-s.alpha)),.5,30);
   points.push({x:z.x,y:z.y,label:"최적"});
  }else if(id==="ppf"){
   maxX=175;maxY=200;
   line("PPF","blue",x=>s.ymax*(1-(x/s.xmax)**s.gamma),0,s.xmax);
   points.push({x:z.x,y:z.y,label:z.message});
  }else if(id==="cost"){
   maxX=Math.max(65,Math.ceil(z.optimal/10)*10+10);
   maxY=Math.max(160,Math.ceil((s.c+2*s.k*maxX)/20)*20+20,s.A+20);
   line("한계수입 MR","orange",q=>s.A-2*s.b*q,0,maxX);
   line("한계비용 MC","blue",q=>s.c+2*s.k*q,0,maxX);
   points.push({x:z.optimal,y:s.c+2*s.k*z.optimal,label:"Q*"},
    {x:s.q,y:z.mc,label:"관찰"});
  }else if(id==="rent"){
   maxX=22;maxY=210;
   line("입찰지대","orange",d=>Math.max(0,s.R0-s.t*d),0,22);
   points.push({x:z.x,y:z.y,label:"현재"});
  }else if(id==="cobweb"){
   maxX=Math.max(170,Math.ceil(Math.max(z.eqQ,...z.path.map(t=>t.q))/20)*20+20);
   maxY=Math.max(80,Math.ceil(Math.max(z.eqP,...z.path.map(t=>t.p))/10)*10+10);
   line("역수요","orange",q=>(s.a-q)/s.b,0,maxX);
   line("역공급","blue",q=>(q-s.c)/s.d,s.c,maxX);
   points.push({x:z.x,y:z.y,label:"균형"},...z.path.map(p=>({x:p.q,y:p.p,label:"t"+p.t})));
  }else if(id==="arc"){
   maxX=175;maxY=70;
   paths.push({label:"호 구간",tone:"orange",pts:[[s.q1,s.p1],[s.q2,s.p2]]});
   points.push({x:s.q1,y:s.p1,label:"전"},{x:s.q2,y:s.p2,label:"후"});
  }
  return {maxX,maxY,paths,points,axes:S[id].axes};
 }
 function describe(id,old,s){
  const a=calc(id,old),b=calc(id,s);if(!a||!b)return null;
  const changes=Object.keys(S[id].f).filter(k=>old[k]!==s[k]).map(k=>S[id].f[k][4]+" "+old[k]+"→"+s[k]);
  let result="",caution="";
  if(id==="budget"){
   result="최적 소비 X "+a.x+"→"+b.x+", Y "+a.y+"→"+b.y+", 기울기 "+a.slope+"→"+b.slope;
   caution="소득 증가는 예산선 평행 이동, 상대가격 변화는 예산선 회전입니다.";
  }else if(id==="ppf"){
   result="관찰 Y "+a.y+"→"+b.y+", 한계 기회비용 "+a.mrt+"→"+b.mrt+" · "+b.message;
   caution="곡선 위 이동은 생산능력 확장과 다릅니다.";
  }else if(id==="cost"){
   result="관찰 이윤 "+a.profit+"→"+b.profit+", 최적 생산량 "+a.optimal+"→"+b.optimal;
   caution="단일생산자의 MR=MC를 완전경쟁 시장의 P=MC와 동일시하지 않습니다.";
  }else if(id==="rent"){
   result="거리 "+a.x+"→"+b.x+", 입찰지대 "+a.y+"→"+b.y;
   caution="현실 지가는 규제·용도·접근성 등 다양한 변수에 좌우됩니다.";
  }else if(id==="cobweb"){
   result="균형가격 "+a.eqP+"→"+b.eqP+", 균형수량 "+a.eqQ+"→"+b.eqQ+" · "+b.message;
   caution="전기 가격에 반응하는 공급의 조정계수 |d/b|가 수렴·발산을 구분합니다.";
  }else{
   result="호탄력성 "+(a.e===null?"미정":a.e)+"→"+(b.e===null?"미정":b.e)+
    " · 절댓값 "+(b.magnitude===null?"미정":b.magnitude);
   caution="호탄력성은 두 점의 평균변화율, 점탄력성은 한 점의 미분값입니다.";
  }
  return {cause:changes.join(" / ")||"기준 조건 유지",result,caution,assumptions:S[id].assumption,status:b.message};
 }
 return Object.freeze({S,ids,initial,valid,set,calc,drawing,describe});
});
