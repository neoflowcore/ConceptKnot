/* ConceptKnot v141 P6-B interactive vector concept laboratory.
 * Isolated opt-in storage; no WebGL, no AI hallucinated source links.
 */
(function(){
 'use strict';
 const math=window.CK141GraphMath;
 if(!math)return;
 const KEY='ck141-concept-lab-v1';
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fmt=n=>Number(n).toLocaleString('ko-KR',{maximumFractionDigits:2});
 const clamp=(n,l,h)=>Math.max(l,Math.min(h,n));
 let history=math.createHistory(),storeEnabled=false,saveMessage='저장하지 않음 (이 화면의 메모리에서만 유지)';
 let relation={x:1,k:2},relationPrevious={x:1,k:2},relationDrag=null,relPast=[],relFuture=[];
 let drag=null,sliderOpen=false,framePending=false,frameRoot=null,compareBase=false;
 function restore(){
  try{
   const s=localStorage.getItem(KEY);
   if(!s||s.length>90000)return;
   const obj=JSON.parse(s);
   if(obj?.version!==1||obj.optIn!==true||!obj.session)return;
   history=math.createHistory(obj.session);
   if(obj.relation&&Number.isFinite(obj.relation.k)&&Number.isFinite(obj.relation.x)&&
    obj.relation.k>=1&&obj.relation.k<=3&&obj.relation.x>=.5&&obj.relation.x<=3){
    relation={...obj.relation};relationPrevious={...obj.relation};
   }
   storeEnabled=true;saveMessage='이 기기에만 저장 중 · 별도 학습 키';
  }catch{saveMessage='저장된 그래프 기록을 읽을 수 없어 기본값으로 시작했습니다.';}
 }
 restore();
 function persist(){
  if(!storeEnabled)return;
  try{
   const text=JSON.stringify({version:1,optIn:true,session:history.export(),relation});
   if(text.length>90000)throw Error('size');
   localStorage.setItem(KEY,text);
   saveMessage='이 기기에만 저장됨 · 공식기출·답안·칠판과 별도';
  }catch{saveMessage='저장 실패: 현재 조작은 화면에 유지되지만 기기에 기록되지 않았습니다.';}
 }
 function setStorage(on){
  if(on){storeEnabled=true;persist();}
  else{
   storeEnabled=false;
   try{localStorage.removeItem(KEY);saveMessage='이 그래프의 저장기록만 삭제했습니다. 공식·개인 학습자료는 그대로입니다.';}
   catch{saveMessage='저장 기록 삭제에 실패했습니다. 브라우저 저장공간을 확인하세요.';}
  }
 }
 const nx=q=>70+540*q/160,py=p=>340-300*p/60;
 const num=n=>Number(n).toFixed(2);
 const linePath=(state,kind)=>{
  const calc=kind==='demand'?math.point:null;
  const value=p=>kind==='demand'?state.a+state.u-state.b*p:state.c+state.v+state.d*p;
  return 'M '+num(nx(value(0)))+' '+num(py(0))+' L '+num(nx(value(60)))+' '+num(py(60));
 };
 function handle(kind,q,p,color,label,val,min,max){
  const x=num(nx(q)),y=num(py(p));
  return '<g class="ck141-handle" data-ck141-drag="'+kind+'" tabindex="0" role="slider" aria-label="'+esc(label)+
   '" aria-valuemin="'+min+'" aria-valuemax="'+max+'" aria-valuenow="'+fmt(val)+'">'+
   '<circle class="ck141-hit" cx="'+x+'" cy="'+y+'" r="22"/><circle class="ck141-handle-core '+color+
   '" cx="'+x+'" cy="'+y+'" r="9" stroke-width="3"/><text x="'+x+'" y="'+(Number(y)-18)+'" text-anchor="middle">'+esc(label)+'</text></g>';
 }
 function marketSvg(){
  const s=history.state,b=compareBase?math.BASE:history.previous,eq=math.solve(s),old=math.solve(b),pt=math.point(s);
  const guides=(e,cls,label)=>{
   if(!e.ok||e.price>60||e.quantity>160)return '';
   const x=num(nx(e.quantity)),y=num(py(e.price));
   return '<g class="'+cls+'"><path d="M '+x+' '+y+' V 340 M '+x+' '+y+' H 70"/>'+
    '<circle cx="'+x+'" cy="'+y+'" r="6"/><text x="'+(Number(x)+12)+'" y="'+(Number(y)-10)+'">'+label+'</text></g>';
  };
  const tickP=[0,10,20,30,40,50,60].map(p=>'<text x="58" y="'+(py(p)+4)+'" text-anchor="end">'+p+'</text>').join('');
  const tickQ=[0,40,80,120,160].map(q=>'<text x="'+nx(q)+'" y="360" text-anchor="middle">'+q+'</text>').join('');
  return '<defs><clipPath id="ck141-clip"><rect x="70" y="40" width="540" height="300"/></clipPath></defs>'+
   '<g class="ck141-grid">'+[10,20,30,40,50,60].map(p=>'<path d="M 70 '+py(p)+' H 610"/>').join('')+
    [40,80,120,160].map(q=>'<path d="M '+nx(q)+' 40 V 340"/>').join('')+'</g>'+
   '<path class="ck141-axis" d="M 70 40 V 340 H 610"/><text x="20" y="27">가격 P</text>'+
   '<text x="541" y="390">수량 Q</text><g class="ck141-ticks">'+tickP+tickQ+'</g>'+
   '<g clip-path="url(#ck141-clip)" class="ck141-past">'+
    '<path class="ck141-demand" d="'+linePath(b,'demand')+'"/>'+
    '<path class="ck141-supply" d="'+linePath(b,'supply')+'"/></g>'+
   '<g clip-path="url(#ck141-clip)" class="ck141-now">'+
    '<path class="ck141-demand" d="'+linePath(s,'demand')+'"/>'+
    '<path class="ck141-supply" d="'+linePath(s,'supply')+'"/></g>'+
   guides(old,'ck141-eq-old','E₀')+guides(eq,'ck141-eq-new','E₁')+
   '<g class="ck141-price-guide"><path d="M 70 '+num(py(s.price))+' H 610"/>'+
    '<text x="575" y="'+num(py(s.price)-8)+'">P='+fmt(s.price)+'</text></g>'+
   handle('demand',s.a+s.u-s.b*20,20,'ck141-demand','D 이동',s.u,-80,80)+
   handle('supply',s.c+s.v+s.d*20,20,'ck141-supply','S 이동',s.v,-80,80)+
   handle('demand-slope',s.a+s.u-s.b*45,45,'ck141-demand','D 기울기',s.b,.5,5)+
   handle('supply-slope',s.c+s.v+s.d*45,45,'ck141-supply','S 기울기',s.d,.5,5)+
   handle('price',Math.max(10,Math.min(150,pt.qd)),s.price,'ck141-price','가격점',s.price,0,60);
 }
 function relationSvg(){
  const {k,x}=relation;
  const toX=x=>70+540*x/5,toY=y=>340-300*y/8;
  const build=fn=>Array.from({length:101},(_,i)=>{
   const xv=.5+4.5*i/100;return (i?' L ':'M ')+num(toX(xv))+' '+num(toY(fn(xv)));
  }).join('');
  const direct=k*x,inverse=k/x;
  return '<defs><clipPath id="ck141-clip"><rect x="70" y="40" width="540" height="300"/></clipPath></defs>'+
   '<g class="ck141-grid">'+[2,4,6,8].map(y=>'<path d="M 70 '+toY(y)+' H 610"/>').join('')+
   [1,2,3,4,5].map(x=>'<path d="M '+toX(x)+' 40 V 340"/>').join('')+'</g>'+
   '<path class="ck141-axis" d="M 70 40 V 340 H 610"/>'+
   '<text x="28" y="28">y</text><text x="595" y="385">x</text>'+
   '<g clip-path="url(#ck141-clip)" class="ck141-now">'+
    '<path class="ck141-demand" d="'+build(x=>k*x)+'"/>'+
    '<path class="ck141-supply" d="'+build(x=>k/x)+'"/></g>'+
   '<path class="ck141-relation-guide" d="M '+toX(x)+' 340 V 40"/>'+
   '<circle class="ck141-rel-point-direct" cx="'+toX(x)+'" cy="'+toY(direct)+'" r="8"/>'+
   '<circle class="ck141-rel-point-inverse" cx="'+toX(x)+'" cy="'+toY(inverse)+'" r="8"/>'+
   '<text x="440" y="70" class="ck141-label-demand">정비례 y=kx</text>'+
   '<text x="440" y="88" class="ck141-label-supply">반비례 y=k/x</text>';
 }
 function input(type,label,value,min,max,step,unit=''){
  return '<label class="ck141-input"><span>'+label+' <output data-ck141-output="'+type+'">'+fmt(value)+unit+'</output></span>'+
   '<input type="range" data-ck141-control="'+type+'" min="'+min+'" max="'+max+'" step="'+step+
   '" value="'+value+'" aria-label="'+esc(label)+'"/></label>';
 }
 function controlHtml(){
  if(history.topic==='relation')return input('relation-x','관측 x',relation.x,.5,3,.1)+
    input('relation-k','공통 계수 k',relation.k,1,3,.1);
  const s=history.state;
  return input('set-demand','수요 이동 u',s.u,-80,80,1)+
   input('set-supply','공급 이동 v',s.v,-80,80,1)+
   input('change-price-point','가격점 P',s.price,0,60,1)+
   input('adjust-demand-slope','수요 기울기 크기 b',s.b,.5,5,.1)+
   input('adjust-supply-slope','공급 기울기 크기 d',s.d,.5,5,.1);
 }
 function narrativeHtml(){
  if(history.topic==='relation'){
   const r=math.relation(relation.k,relation.x),prev=math.relation(relationPrevious.k,relationPrevious.x);
   return '<p><strong>정비례</strong> y='+fmt(r.direct)+' · y/x='+fmt(r.ratio)+
    ' (일정한 계수)</p><p><strong>반비례</strong> y='+fmt(r.inverse)+' · x·y='+fmt(r.product)+
    ' (일정한 곱)</p><p>직전 x='+fmt(prev.x)+' → 현재 x='+fmt(r.x)+
    '. 같은 k에서 x가 커지면 정비례 값은 증가하고 반비례 값은 감소합니다.</p>'+
    '<small>그래프 수치는 학습용 예시이며 공식 기출 원문이 아닙니다.</small>';
  }
  const s=history.state,prev=compareBase?math.BASE:history.previous,eq=math.solve(s),old=math.solve(prev),pt=math.point(s),e=compareBase?math.describe(prev,s,history.action):history.explanation();
  let extra='';
  if(history.topic==='elasticity')
   extra='<p><strong>현재 P='+fmt(pt.price)+'의 점탄력성</strong> 수요 Ed='+
    (pt.demandElasticity===null?'정의되지 않음':fmt(pt.demandElasticity))+
    ', 공급 Es='+(pt.supplyElasticity===null?'정의되지 않음':fmt(pt.supplyElasticity))+
    ' · 수요는 통상 절댓값으로 비교합니다.</p><small>점탄력성 = (dQ/dP)×(P/Q). 기울기나 호탄력성과 같지 않습니다.</small>';
  return '<p><strong>조건 변화</strong> '+esc(e.cause)+'</p><p><strong>결과</strong> '+esc(e.result)+'</p>'+
   '<p><strong>혼동 주의</strong> '+esc(e.caution)+'</p>'+
   '<p><strong>계산</strong> Qd=('+fmt(s.a)+'+'+fmt(s.u)+')−'+fmt(s.b)+'P, '+
    'Qs=('+fmt(s.c)+'+'+fmt(s.v)+')+'+fmt(s.d)+'P.</p>'+
   '<p class="ck141-results">E₀ '+(old.ok?'P '+fmt(old.price)+' · Q '+fmt(old.quantity):'계산 불가')+
    ' → E₁ '+(eq.ok?'P '+fmt(eq.price)+' · Q '+fmt(eq.quantity):'계산 불가')+'</p>'+extra;
 }
 function taskHtml(){
  if(history.mode==='mission')return '<div class="ck141-task"><strong>개념 미션</strong> 공급(u가 아니라 v)을 고정한 채 수요 이동 u를 +20 이상으로 조절하세요.'+
   '<span role="status">'+(history.missionComplete()?' · 목표 달성! 균형가격과 거래량을 비교해 보세요.':' · 목표 확인 전')+'</span></div>';
  if(history.mode==='exam')return '<div class="ck141-task"><strong>기출 재현</strong> 검증된 원문·개념 태그와 연결되는 경우에만 실제 기출 미션을 활성화합니다. 현재는 원문 연결 검토 중입니다.</div>';
  if(history.mode==='compare')return '<div class="ck141-task"><strong>전후 비교</strong> 점선이 직전 상태 E₀, 실선이 현재 상태 E₁입니다. 되돌리기·다시 실행으로 차이를 확인하세요.</div>';
  return '<div class="ck141-task">곡선의 핸들을 가로로 드래그하세요. 가격점은 세로로 이동합니다. 손가락 스크롤은 핸들 밖에서 유지됩니다.</div>';
 }
 function render(root){
  if(!root)return;
  const topics=[['market','수요·공급 균형'],['elasticity','점탄력성'],['relation','비례·반비례']];
  const modes=[['free','자유 조작'],['mission','개념 미션'],['compare','전후 비교'],['exam','기출 재현']];
  root.innerHTML='<div class="ck141-intro"><div><h3>개념 그래프 실험실 <small>P6-B</small></h3>'+
   '<p>직접 움직여 균형점·기울기·비례관계를 계산하는 학습용 가상 모델입니다.</p></div>'+
   '<span class="ck141-legend">점선 E₀ 이전 · 실선 E₁ 현재</span></div>'+
   '<div class="ck141-tabs" role="group" aria-label="개념 주제">'+topics.map(t=>'<button type="button" data-ck141-topic="'+t[0]+
   '" aria-pressed="'+(history.topic===t[0])+'">'+t[1]+'</button>').join('')+'</div>'+
   '<div class="ck141-tabs ck141-modes" role="group" aria-label="학습 모드">'+modes.map(t=>'<button type="button" data-ck141-mode="'+t[0]+
   '" aria-pressed="'+(history.mode===t[0])+'">'+t[1]+'</button>').join('')+'</div>'+
   '<div class="ck141-task-holder">'+taskHtml()+'</div>'+
   '<div class="ck141-columns"><div class="ck141-stage-col"><div class="ck141-stage"><svg class="ck141-live-svg" viewBox="0 0 660 400" aria-label="조작 가능한 학습용 개념 그래프" role="img">'+
   (history.topic==='relation'?relationSvg():marketSvg())+'</svg></div>'+
   '<p class="ck141-axis-note">가격 P: 가상 단위 · 수량 Q: 가상 단위 / 일반 시장 통계·공식 기출 수치 아님</p>'+
   '<div class="ck141-controls">'+controlHtml()+'</div>'+
   '<div class="ck141-actions"><button type="button" data-ck141-act="undo" '+(!(history.topic==='relation'?relPast.length:history.canUndo)?'disabled':'')+'>↶ 이전</button>'+ 
   '<button type="button" data-ck141-act="redo" '+(!(history.topic==='relation'?relFuture.length:history.canRedo)?'disabled':'')+'>↷ 다시</button>'+ 
   '<button type="button" data-ck141-act="reset">초기화</button>'+
   '<label class="ck141-compare-base"><input type="checkbox" data-ck141-compare '+(compareBase?'checked':'')+'/> 초기 E₀ 비교</label></div></div>'+ 
   '<div class="ck141-explain"><h4>변화 원인과 결과</h4><div class="ck141-narrative" aria-live="polite">'+narrativeHtml()+'</div>'+
   '<h4>기본이론·공식 기출</h4>'+
   '<p>부동산학개론 · 수요/공급의 이동과 곡선 위 이동, 균형의 비교정태. 모형은 다른 조건 일정인 경우만 해석합니다.</p>'+
   '<p class="ck141-source">공식 문항-개념 연결은 검수된 출처·태그가 0건이므로 개별 문항을 추측해 연결하지 않습니다.</p>'+
   '<button type="button" data-ck141-act="search">공식 800문항에서 키워드 검색</button>'+
   '<label class="ck141-save"><input type="checkbox" data-ck141-storage '+(storeEnabled?'checked':'')+'/> 이 기기에 그래프 학습 이력 저장 (선택)</label>'+
   '<small class="ck141-save-status" role="status">'+esc(saveMessage)+'</small></div></div>';
 }
 function updateLive(root){
  if(!root)return;
  const svg=root.querySelector('.ck141-live-svg');
  if(svg)svg.innerHTML=history.topic==='relation'?relationSvg():marketSvg();
  const n=root.querySelector('.ck141-narrative');if(n)n.innerHTML=narrativeHtml();
  const undo=root.querySelector('[data-ck141-act="undo"]'),redo=root.querySelector('[data-ck141-act="redo"]');
  if(undo)undo.disabled=!(history.topic==='relation'?relPast.length:history.canUndo);
  if(redo)redo.disabled=!(history.topic==='relation'?relFuture.length:history.canRedo);
  const saved=root.querySelector('.ck141-save-status');if(saved)saved.textContent=saveMessage;
  const task=root.querySelector('.ck141-task-holder');if(task)task.innerHTML=taskHtml();
  for(const input of root.querySelectorAll('[data-ck141-control]')){
   const type=input.dataset.ck141Control;
   let value=type==='relation-x'?relation.x:type==='relation-k'?relation.k:history.state[({
    'set-demand':'u','set-supply':'v','change-price-point':'price',
    'adjust-demand-slope':'b','adjust-supply-slope':'d'})[type]];
   if(Number.isFinite(value)){input.value=String(value);const out=root.querySelector('[data-ck141-output="'+type+'"]');if(out)out.textContent=fmt(value);}
  }
 }
 function queueLive(root){
  frameRoot=root;
  if(framePending)return;
  framePending=true;
  (window.requestAnimationFrame||function(f){f()})(()=>{
   framePending=false;
   const r=frameRoot;frameRoot=null;if(r?.isConnected)updateLive(r);
  });
 }
 function mount(chart){
  if(!chart?.isConnected)return false;
  let root=chart.querySelector('#ck141-concept-lab');
  if(!root){
   root=document.createElement('section');root.id='ck141-concept-lab';
   root.setAttribute('aria-label','인터랙티브 개념 그래프 학습');chart.appendChild(root);
  }
  if(root.dataset.ck141Mounted)return true;
  root.dataset.ck141Mounted='true';render(root);return true;
 }
 function operate(root,kind,value,preview){
  if(kind==='relation-x'||kind==='relation-k'){
   if(!relationDrag)relationDrag={...relation};
   relation[kind==='relation-x'?'x':'k']=clamp(Number(value),kind==='relation-x'?.5:1,3);
   queueLive(root);return;
  }
  if(!math.sanitize(history.state))return;
  if(preview){if(!history.isDragging)history.begin();history.preview(kind,Number(value));queueLive(root);}
  else{history.apply(kind,Number(value));persist();render(root);}
 }
 function finishSlider(root){
  if(history.isDragging){history.finish();persist();}
  if(relationDrag){
   if(relation.x!==relationDrag.x||relation.k!==relationDrag.k){
    relPast.push(relationDrag);if(relPast.length>100)relPast.shift();
    relFuture=[];relationPrevious={...relationDrag};
   }
   relationDrag=null;persist();
  }
  sliderOpen=false;updateLive(root);
 }
 function relAction(action){
  if(action==='reset'){
   relPast.push({...relation});relationPrevious={...relation};
   relation={x:1,k:2};relFuture=[];return true;
  }
  if(action==='undo'&&relPast.length){
   relFuture.push({...relation});relationPrevious={...relation};relation=relPast.pop();return true;
  }
  if(action==='redo'&&relFuture.length){
   relPast.push({...relation});relationPrevious={...relation};relation=relFuture.pop();return true;
  }
  return false;
 }
 function openSearch(){
  if(!window.CK76Search?.open?.())return;
  const q=document.getElementById('ck76-search-query');
  if(q){q.value='수요';q.closest('form')?.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));}
 }
 document.addEventListener('click',e=>{
  const root=e.target.closest?.('#ck141-concept-lab');if(!root)return;
  const topic=e.target.closest('[data-ck141-topic]');
  if(topic){finishSlider(root);if(history.setTopic(topic.dataset.ck141Topic)){persist();render(root);}return;}
  const mode=e.target.closest('[data-ck141-mode]');
  if(mode){finishSlider(root);if(history.setMode(mode.dataset.ck141Mode)){persist();render(root);}return;}
  const act=e.target.closest('[data-ck141-act]');if(!act)return;
  const a=act.dataset.ck141Act;
  if(a==='search'){openSearch();return;}
  if(history.topic==='relation'){relAction(a);}
  else if(a==='reset')history.reset();
  else if(a==='undo')history.undo();
  else if(a==='redo')history.redo();
  persist();render(root);
 });
 document.addEventListener('change',e=>{
  const root=e.target.closest?.('#ck141-concept-lab');if(!root)return;
  if(e.target.matches('[data-ck141-storage]')){setStorage(e.target.checked);render(root);return;}
  if(e.target.matches('[data-ck141-compare]')){compareBase=e.target.checked;render(root);return;}
  if(e.target.matches('[data-ck141-control]'))finishSlider(root);
 });
 document.addEventListener('input',e=>{
  const input=e.target.closest?.('[data-ck141-control]');if(!input)return;
  const root=input.closest('#ck141-concept-lab');if(!root)return;
  sliderOpen=true;operate(root,input.dataset.ck141Control,Number(input.value),true);
 });
 function dragChange(e){
  if(!drag||e.pointerId!==drag.id)return;
  const stage=drag.stage,rect=stage.getBoundingClientRect();
  if(!rect.width||!rect.height)return;
  const dq=(e.clientX-drag.x)*160*660/(540*rect.width);
  const dp=-(e.clientY-drag.y)*60*400/(300*rect.height);
  const s=drag.start,kind=drag.kind;
  let type='',value=0;
  if(kind==='demand'){type='set-demand';value=s.u+dq;}
  else if(kind==='supply'){type='set-supply';value=s.v+dq;}
  else if(kind==='demand-slope'){type='adjust-demand-slope';value=s.b-dq/20;}
  else if(kind==='supply-slope'){type='adjust-supply-slope';value=s.d+dq/20;}
  else if(kind==='price'){type='change-price-point';value=s.price+dp;}
  if(type&&history.preview(type,value))queueLive(drag.root);
 }
 document.addEventListener('pointerdown',e=>{
  const handle=e.target.closest?.('#ck141-concept-lab [data-ck141-drag]');
  if(!handle||drag||e.button!==0||history.topic==='relation')return;
  const stage=handle.closest('.ck141-stage'),root=handle.closest('#ck141-concept-lab');
  if(!stage||!root||!history.begin())return;
  drag={id:e.pointerId,stage,root,kind:handle.dataset.ck141Drag,x:e.clientX,y:e.clientY,start:history.state};
  stage.classList.add('ck141-grabbing');
  try{stage.setPointerCapture(e.pointerId);}catch{}
  e.preventDefault();
 });
 document.addEventListener('pointermove',e=>{
  if(!drag||drag.id!==e.pointerId)return;
  if(e.cancelable)e.preventDefault();
  dragChange(e);
 },{passive:false});
 function finishDrag(e,commit){
  if(!drag||drag.id!==e.pointerId)return;
  const item=drag;
  if(commit){dragChange(e);history.finish();persist();}
  else history.cancel();
  item.stage.classList.remove('ck141-grabbing');
  try{item.stage.releasePointerCapture(e.pointerId);}catch{}
  drag=null;render(item.root);
 }
 document.addEventListener('pointerup',e=>finishDrag(e,true));
 document.addEventListener('pointercancel',e=>finishDrag(e,false));
 document.addEventListener('lostpointercapture',e=>{
  if(drag&&e.pointerId===drag.id)finishDrag(e,false);
 });
 window.addEventListener('ck:pen-deactivate',()=>{if(!drag)return;
  const item=drag;history.cancel();item.stage.classList.remove('ck141-grabbing');drag=null;
  if(item.root.isConnected)render(item.root);
 });
 window.addEventListener('blur',()=>{if(!drag)return;const item=drag;history.cancel();item.stage.classList.remove('ck141-grabbing');drag=null;render(item.root);});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden||!drag)return;const item=drag;history.cancel();item.stage.classList.remove('ck141-grabbing');drag=null;render(item.root);});
 window.addEventListener('pagehide',()=>{if(!drag)return;history.cancel();drag=null;});
 document.addEventListener('keydown',e=>{
  const h=e.target.closest?.('#ck141-concept-lab [data-ck141-drag]');
  if(!h||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key))return;
  const root=h.closest('#ck141-concept-lab'),kind=h.dataset.ck141Drag,s=history.state;
  const delta=(e.key==='ArrowLeft'||e.key==='ArrowDown'?-1:1)*(e.shiftKey?5:1);
  let type='',val=0;
  if(kind==='demand'){type='set-demand';val=s.u+delta;}
  if(kind==='supply'){type='set-supply';val=s.v+delta;}
  if(kind==='demand-slope'){type='adjust-demand-slope';val=s.b+delta*.1;}
  if(kind==='supply-slope'){type='adjust-supply-slope';val=s.d+delta*.1;}
  if(kind==='price'){type='change-price-point';val=s.price+delta;}
  if(e.key==='Home'||e.key==='End')val=e.key==='Home'?(kind.includes('slope')?.5:kind==='price'?0:-80):
   (kind.includes('slope')?5:kind==='price'?60:80);
  if(type){e.preventDefault();history.apply(type,val);persist();updateLive(root);}
 });
 window.CK141ConceptLab=Object.freeze({mount,getState:()=>({
  session:history.export(),storeEnabled,relation:{...relation},saveMessage}),math});
})();