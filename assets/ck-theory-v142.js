/* ConceptKnot P6-B v142 economics scenes. Script loads after CK142Models.
 * Independent, opt-in local state: no writes to CK82/CK129/typing/pen/OCR.
 */
(function(){
 'use strict';
 const models=window.CK142Models;if(!models)return;
 const KEY='ck142-theory-studio-v1',MAX_BYTES=70000;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fmt=n=>Number(n).toLocaleString('ko-KR',{maximumFractionDigits:3});
 const cfg=()=>models.S[selected];
 const sessions=Object.fromEntries(models.ids.map(id=>[id,{
  current:models.initial(id),previous:models.initial(id),past:[],future:[]}]));
 let selected='budget',baseline=false,mode='free',storage=false,level='beginner';
 let drag=null,rangeDraft=null,frame=0,note='이 화면에만 임시 유지 중',lastRoot=null;
 const limited=(n,a,b)=>Math.max(a,Math.min(b,n));
 function deep(x){return JSON.parse(JSON.stringify(x));}
 function checkHistory(obj){
  if(!obj||obj.version!==1||!models.S[obj.selected]||
    !obj.sessions||typeof obj.sessions!=='object')return false;
  for(const id of models.ids){
   const row=obj.sessions[id];
   if(!row||!models.valid(id,row.current)||!models.valid(id,row.previous)||
    !Array.isArray(row.past)||!Array.isArray(row.future)||row.past.length>60||
    row.future.length>60||!row.past.every(s=>models.valid(id,s))||
    !row.future.every(s=>models.valid(id,s)))return false;
  }
  return true;
 }
 function restore(){
  try{
   const raw=localStorage.getItem(KEY);
   if(!raw||raw.length>MAX_BYTES)return;
   const obj=JSON.parse(raw);
   if(obj.optIn!==true||!checkHistory(obj))return;
   selected=obj.selected;
   for(const id of models.ids)sessions[id]=deep(obj.sessions[id]);
   baseline=obj.baseline===true;
   mode=['free','mission','compare'].includes(obj.mode)?obj.mode:'free';
   level=obj.level==='advanced'?'advanced':'beginner';
   storage=true;note='로컬 저장 기록 복원 완료';
  }catch{note='저장된 그래프 상태 검증 실패 · 초기 화면 유지';}
 }
 restore();
 function exportState(){return {version:1,optIn:storage,selected,baseline,mode,level,sessions:deep(sessions)};}
 function save(){
  if(!storage)return;
  try{
   const raw=JSON.stringify(exportState());
   if(raw.length>MAX_BYTES)throw Error('storage size guard');
   localStorage.setItem(KEY,raw);note='별도 그래프 저장 완료 · 원래 학습기록 미변경';
  }catch{note='그래프 저장 실패 · 현재 화면은 유지하나 새로고침 시 없어질 수 있습니다.';}
 }
 function chooseStorage(enabled){
  if(enabled){storage=true;save();return;}
  storage=false;
  try{localStorage.removeItem(KEY);note='그래프 전용 저장 키만 삭제 · 기존 시험기록 보존';}
  catch{note='그래프 전용 기록 삭제 실패';}
 }
 function record(origin){
  const s=sessions[selected];
  if(JSON.stringify(s.current)===JSON.stringify(origin))return false;
  s.past.push({...origin});if(s.past.length>60)s.past.shift();
  s.future=[];s.previous={...origin};
  save();return true;
 }
 function apply(key,value){
  const s=sessions[selected],before={...s.current},next=models.set(selected,before,key,value);
  if(!next)return false;
  s.current=next;record(before);return true;
 }
 function finishDraft(){
  if(drag){const item=drag;drag=null;try{item.svg.releasePointerCapture(item.id);}catch{}
   record(item.before);}
  if(rangeDraft){record(rangeDraft);rangeDraft=null;}
 }
 function cancelDraft(){
  if(drag){const item=drag;drag=null;
   sessions[selected].current=item.before;sessions[selected].previous=item.previous;
   try{item.svg.releasePointerCapture(item.id);}catch{}}
  if(rangeDraft){sessions[selected].current=rangeDraft;rangeDraft=null;}
 }
 function undo(){
  const s=sessions[selected];if(!s.past.length)return false;
  s.future.push({...s.current});s.previous={...s.current};s.current=s.past.pop();save();return true;
 }
 function redo(){
  const s=sessions[selected];if(!s.future.length)return false;
  s.past.push({...s.current});s.previous={...s.current};s.current=s.future.pop();save();return true;
 }
 function reset(){
  const s=sessions[selected],before={...s.current};s.current=models.initial(selected);
  record(before);
 }
 const labels={
  budget:'소득을 증가시키면 예산선이 바깥쪽으로 이동하고, X 가격을 높이면 X 절편만 줄어듭니다.',
  ppf:'X를 증가시키되 자원·기술은 고정하여 한계기회비용 변화를 확인하세요.',
  cost:'관찰 생산량을 움직여 MR=MC가 되는 이윤극대화 수량을 찾으세요.',
  rent:'거리를 늘리고 입찰지대가 어떻게 변하는지 확인하세요.',
  cobweb:'공급 반응 d가 수요 반응 b를 넘으면 조정이 발산하는지 확인하세요.',
  arc:'가격과 수요량 두 쌍을 움직여 호탄력성의 부호와 절댓값을 비교하세요.'
 };
 function mission(){
  const id=selected,s=sessions[id].current,c=models.calc(id,s);
  if(mode!=='mission')return null;
  if(id==='budget')return {task:'소득 I를 160 이상으로 올리고 X·Y 가격을 고정하세요.',done:s.I>=160&&s.px===10&&s.py===10};
  if(id==='ppf')return {task:'생산 X를 75 이상으로 늘리고 곡선 위에서 효율적 점을 유지하세요.',done:s.x>=75&&s.u===1};
  if(id==='cost')return {task:'관찰 생산량 Q를 MR=MC인 Q* 부근(차이 1 이내)으로 이동하세요.',done:Math.abs(s.q-c.optimal)<=1};
  if(id==='rent')return {task:'도심에서 거리를 10 이상으로 늘려 입찰지대를 비교하세요.',done:s.d>=10};
  if(id==='cobweb')return {task:'공급 반응 d를 수요 반응 b보다 크게 만들어 발산형을 관찰하세요.',done:s.d>s.b};
  return {task:'가격이 오를 때 수요량이 감소하도록 두 점을 배치하세요.',done:s.p2>s.p1&&s.q2<s.q1};
 }
 function selectedValues(){
  const s=sessions[selected],old=baseline?models.initial(selected):s.previous;
  return {current:s.current,previous:old,scene:models.drawing(selected,s.current),
   ghost:models.drawing(selected,old),result:models.describe(selected,old,s.current)};
 }
 function xy(x,y,m){
  return [(46+530*x/m.maxX).toFixed(2),(333-286*y/m.maxY).toFixed(2)];
 }
 function svg(){
  const data=selectedValues(),m=data.scene,prev=data.ghost;
  if(!m)return '';
  const paths=(draw,old)=>{
   if(!draw)return '';
   return draw.paths.map(p=>{
    const pts=p.pts.map(([x,y])=>xy(x,y,m));
    if(pts.length<2)return '';
    return '<path class="ck142-line '+(old?'ck142-prev':'ck142-'+p.tone)+
     '" d="'+pts.map((xy,i)=>(i?'L':'M')+xy[0]+' '+xy[1]).join(' ')+'"/>';
   }).join('');
  };
  const points=(draw,old)=>{
   if(!draw)return '';
   return draw.points.filter(p=>p.x>=0&&p.y>=0&&p.x<=m.maxX&&p.y<=m.maxY).map((p,i)=>{
    const [x,y]=xy(p.x,p.y,m);
    return '<g class="'+(old?'ck142-ghost-point':'ck142-current-point')+'">'+
     '<circle cx="'+x+'" cy="'+y+'" r="'+(i===0?7:4)+'"/>'+
     (i<3?'<text x="'+(Number(x)+9)+'" y="'+(Number(y)-9)+'">'+esc(p.label)+'</text>':'')+'</g>';
   }).join('');
  };
  const first=selected==='cobweb'?{x:sessions[selected].current.c+sessions[selected].current.d*sessions[selected].current.p0,y:sessions[selected].current.p0}:selected==='cost'?m.points[1]:m.points[0],handleKey={budget:'alpha',ppf:'x',cost:'q',rent:'d',cobweb:'p0',arc:'q2'}[selected];
  let handle='';
  if(first&&first.x>=0&&first.y>=0&&first.x<=m.maxX&&first.y<=m.maxY){
   const [x,y]=xy(first.x,first.y,m),f=cfg().f[handleKey];
   handle='<g data-ck142-handle="'+handleKey+'" role="slider" tabindex="0" aria-label="'+esc(f[4])+
    '" aria-valuemin="'+f[1]+'" aria-valuemax="'+f[2]+'" aria-valuenow="'+sessions[selected].current[handleKey]+'">'+
    '<circle class="ck142-touch" cx="'+x+'" cy="'+y+'" r="23"/><circle class="ck142-dot" cx="'+x+'" cy="'+y+'" r="10"/>'+
    '<text x="'+x+'" y="'+(Number(y)+27)+'" text-anchor="middle">드래그</text></g>';
  }
  const current=sessions[selected].current;
  const add=(key,x,y,label)=>{
   if(!cfg().f[key]||!Number.isFinite(x)||!Number.isFinite(y)||
      x<0||y<0||x>m.maxX||y>m.maxY)return '';
   const [px,py]=xy(x,y,m),f=cfg().f[key];
   return '<g class="ck142-extra-handle" data-ck142-handle="'+key+'" role="slider" tabindex="0" aria-label="'+esc(label)+
     '" aria-valuemin="'+f[1]+'" aria-valuemax="'+f[2]+'" aria-valuenow="'+current[key]+'">'+
     '<circle class="ck142-touch" cx="'+px+'" cy="'+py+'" r="22"/>'+
     '<circle class="ck142-dot" cx="'+px+'" cy="'+py+'" r="8"/>'+
     '<text x="'+px+'" y="'+(Number(py)-19)+'" text-anchor="middle">'+esc(label)+'</text></g>';
  };
  let extra='';
  if(selected==='budget'){
   const x0=current.I/current.px,y0=current.I/current.py;
   extra+=add('I',x0*.25,y0*.75,'소득 I · 선 이동');
   extra+=add('px',x0,0,'X 절편 · 가격');
   extra+=add('py',0,y0,'Y 절편 · 가격');
  }else if(selected==='ppf'){
   extra+=add('xmax',current.xmax,0,'X 최대');
   extra+=add('ymax',0,current.ymax,'Y 최대');
   extra+=add('u',m.points[0].x,m.points[0].y+8,'효율 안/밖');
  }else if(selected==='cost'){
   extra+=add('A',0,current.A,'MR 절편');
   extra+=add('c',0,current.c,'MC 절편');
  }else if(selected==='rent'){
   extra+=add('R0',0,current.R0,'도심 지대');
   extra+=add('t',10,Math.max(0,current.R0-current.t*10),'거리저항');
  }else if(selected==='cobweb'){
   extra+=add('d',current.c+current.d*20,20,'공급 반응');
  }else if(selected==='arc'){
   extra+=add('p1',current.q1+6,current.p1+5,'이전 가격');
   extra+=add('p2',current.q2+8,current.p2+5,'현재 가격');
   extra+=add('q1',current.q1-6,current.p1-5,'이전 수량');
  }
  let draggable='';
  if(selected==='budget'){
   const budget=m.paths.find(p=>p.label==='예산선');
   if(budget&&budget.pts.length>1){
    const coords=budget.pts.map(q=>xy(q[0],q[1],m));
    draggable='<path class="ck142-line-hit" data-ck142-handle="I" tabindex="0" role="slider" aria-label="예산선 직접 이동 (소득)" aria-valuemin="60" aria-valuemax="240" aria-valuenow="'+current.I+'" d="'+coords.map((p,i)=>(i?'L':'M')+p[0]+' '+p[1]).join(' ')+'"/>';
   }
  }
  const ticksX=Array.from({length:5},(_,i)=>{
   const q=i*m.maxX/4,x=xy(q,0,m)[0];
   return '<text x="'+x+'" y="358" text-anchor="middle">'+fmt(q)+'</text>';
  }).join('');
  const ticksY=Array.from({length:5},(_,i)=>{
   const p=i*m.maxY/4,y=xy(0,p,m)[1];
   return '<text x="38" y="'+(Number(y)+4)+'" text-anchor="end">'+fmt(p)+'</text>';
  }).join('');
  const grid='<g class="ck142-grid">'+Array.from({length:3},(_,i)=>{
   const j=i+1;return '<path d="M 46 '+(333-286*j/4)+' H 576 M '+(46+530*j/4)+' 47 V 333"/>';
  }).join('')+'</g>';
  return '<svg class="ck142-svg" viewBox="0 0 630 395" role="group" aria-label="'+esc(cfg().name)+' 학습용 비교 그래프">'+
   '<defs><clipPath id="ck142-clip"><rect x="46" y="47" width="530" height="286"/></clipPath></defs>'+
   grid+'<path class="ck142-axis" d="M 46 47 V 333 H 576"/>'+
   '<g class="ck142-ticks">'+ticksX+ticksY+'</g><text x="8" y="22">'+esc(cfg().axes[1])+'</text>'+
   '<text x="460" y="386">'+esc(cfg().axes[0])+'</text>'+
   '<g clip-path="url(#ck142-clip)">'+paths(prev,true)+paths(m,false)+points(prev,true)+points(m,false)+'</g>'+draggable+handle+extra+'</svg>';
 }
 function coachView(){
  const m=window.CK143ConceptCoach,ss=sessions[selected];
  return m?.theory(selected,baseline?models.initial(selected):ss.previous,ss.current,models)||
   {tag:'조작해 보세요',kind:'neutral',summary:'선이나 점을 움직이세요.',
    example:'생활 속 상황이 여기에 나타납니다.',caution:'다른 조건은 일정하다고 가정합니다.'};
 }
 function insightHtml(){
  const c=coachView();
  return '<div class="ck143-insight" data-kind="'+esc(c.kind)+'" role="status"><span class="ck143-insight-heading">지금 일어난 개념</span>'+
   '<strong class="ck143-insight-tag">'+esc(c.tag)+'</strong><span class="ck143-insight-short">'+esc(c.summary)+'</span></div>';
 }
 function legendHtml(){
  const draw=models.drawing(selected,sessions[selected].current);if(!draw)return '';
  return '<div class="ck142-legend" aria-label="그래프 선 구분">'+
   draw.paths.map(p=>'<span class="ck142-key ck142-key-'+esc(p.tone)+'">'+esc(p.label)+'</span>').join('')+
   '<span class="ck142-key ck142-key-old">직전 상태(점선)</span></div>';
 }
 function quickTheoryHtml(){
  const view=window.CK144ChangeExplain,session=sessions[selected];
  if(!view)return '';
  const prior=baseline?models.initial(selected):session.previous;
  const v=view.theory(selected,prior,session.current,models);
  const metrics=v.metrics.slice(0,2).map(m=>'<span class="ck145-metric"><small>'+esc(m.label)+
   '</small><strong>'+esc(m.before)+' → '+esc(m.after)+'</strong></span>').join('');
  return '<div class="ck145-live-brief" aria-live="off"><div>'+
   '<span class="ck145-brief-label">곡선 조작 · 즉시 이론</span><strong class="ck145-brief-title">'+esc(v.tag)+'</strong></div>'+
   '<div class="ck145-metric-pair">'+metrics+'</div>'+
   '<p class="ck145-brief-example"><b>쉬운 예시</b> '+esc(v.example)+'</p></div>';
 }
 function transitionHtml(openOverride){
  const model=window.CK144ChangeExplain,view=window.CK144ChangeView;
  if(!model||!view)return '';
  const session=sessions[selected],old=baseline?models.initial(selected):session.previous;
  return view.render(model.theory(selected,old,session.current,models),level,openOverride);
 }
 function panel(){
  const {current,previous,result}=selectedValues();
  if(!result)return '';
  const quiz=mission(),metrics=models.calc(selected,current);
  if(level==='beginner'){
   const c=coachView();
   return '<div class="ck143-plain"><p><strong>쉬운 예시</strong> '+esc(c.example)+'</p>'+
    '<p><strong>헷갈리지 않기</strong> '+esc(c.caution)+'</p>'+
    (quiz?'<p class="ck142-mission" role="status">'+
     (quiz.done?'✓ 미션 성공 · ':'미션 진행 중 · ')+esc(quiz.task)+'</p>':'')+
    '<p class="ck143-learning-hint">‘심화’를 선택하면 수식·절편·이윤·탄력성 계산을 볼 수 있습니다.</p></div>';
  }
  let extra='';
  if(selected==='budget')extra='최적 조합 X='+fmt(metrics.x)+', Y='+fmt(metrics.y)+' · 사용한 예산 '+fmt(metrics.expense);
  if(selected==='ppf')extra='한계 기회비용 '+fmt(metrics.mrt)+' · '+metrics.message;
  if(selected==='cost')extra='관찰 이윤 '+fmt(metrics.profit)+' · 최적 이윤 '+fmt(metrics.maxProfit);
  if(selected==='rent')extra='해당 거리의 지대 '+fmt(metrics.y)+' · 0이 되는 거리 '+fmt(metrics.zeroAt);
  if(selected==='cobweb')extra='12기간 중 유효한 '+metrics.path.length+'개 가격·수량 계산 · '+metrics.message;
  if(selected==='arc')extra='호탄력성 '+(metrics.e===null?'정의 불가':fmt(metrics.e))+' · '+metrics.message;
  const unchanged=Object.keys(current).filter(k=>current[k]===previous[k]).map(k=>cfg().f[k][4]).join(', ')||'없음';
  return '<h4>직전 → 현재 자동 해설</h4><p><strong>조작</strong> '+esc(result.cause)+'</p>'+
   '<p><strong>계산 결과</strong> '+esc(result.result)+'</p>'+
   '<p><strong>고정된 조건</strong> '+esc(unchanged)+'</p>'+
   '<p><strong>핵심</strong> '+esc(extra)+'</p>'+
   '<p><strong>혼동 방지</strong> '+esc(result.caution)+'</p>'+
   '<p class="ck142-assumptions">모형 가정: '+esc(result.assumptions)+'</p>'+
   (quiz?'<p class="ck142-mission" role="status">'+(quiz.done?'✓ 미션 달성 · ':'미션 진행 중 · ')+esc(quiz.task)+'</p>':'');
 }
 function slider(k,f){
  return '<label class="ck142-control"><span>'+esc(f[4])+' <output data-ck142-output="'+k+'">'+fmt(sessions[selected].current[k])+'</output></span>'+
   '<input type="range" data-ck142-control="'+k+'" value="'+sessions[selected].current[k]+
   '" min="'+f[1]+'" max="'+f[2]+'" step="'+f[3]+'" aria-label="'+esc(f[4])+' 조절"/>'+
   '<input type="number" data-ck142-number="'+k+'" value="'+sessions[selected].current[k]+'" min="'+f[1]+'" max="'+f[2]+'" step="'+f[3]+'" aria-label="'+esc(f[4])+' 숫자 입력"/></label>';
 }
 function paint(root){
  if(!root||!root.isConnected)return;
  lastRoot=root;
  root.dataset.ck142Level=level;
  const all=models.ids.map(id=>'<button type="button" data-ck142-topic="'+id+'" aria-pressed="'+(selected===id)+'">'+esc(models.S[id].name)+'</button>').join('');
  root.innerHTML='<header><h3>개념 그래프 심화 실험실 <small>v142 · P6-B4</small></h3>'+
   '<p>가격·비용·생산·거리·시간에 따라 다른 도형을 직접 조작합니다. 가상 수치로 계산하며 기출 원문을 변경하지 않습니다.</p></header>'+
   '<div class="ck142-topics" role="group" aria-label="경제학 주제">'+all+'</div>'+
   '<div class="ck142-modes" role="group" aria-label="학습 모드">'+
   [['free','자유 실험'],['mission','목표 미션'],['compare','전후 비교']].map(p=>
    '<button type="button" data-ck142-mode="'+p[0]+'" aria-pressed="'+(p[0]===mode)+'">'+p[1]+'</button>').join('')+'</div>'+
   '<div class="ck143-level-toggle" role="group" aria-label="설명 난이도">'+
    '<button type="button" data-ck142-level="beginner" aria-pressed="'+(level==='beginner')+'">쉽게 · 생활 예시</button>'+
    '<button type="button" data-ck142-level="advanced" aria-pressed="'+(level==='advanced')+'">심화 · 가격/수량</button></div>'+
   '<div class="ck142-tip">'+esc(labels[selected])+'</div>'+
   '<div class="ck142-layout"><div class="ck142-left">'+
    '<div class="ck142-graph">'+svg()+'</div>'+quickTheoryHtml()+insightHtml()+legendHtml()+
   '<details class="ck143-numeric" '+(level==='advanced'?'open':'')+'><summary>숫자·가격·기울기 정밀 조절 (선택)</summary>'+
   '<div class="ck142-controls">'+Object.entries(cfg().f).map(([k,f])=>slider(k,f)).join('')+'</div></details>'+
   '<div class="ck142-actions"><button type="button" data-ck142-action="undo" '+(sessions[selected].past.length?'':'disabled')+'>이전</button>'+
   '<button type="button" data-ck142-action="redo" '+(sessions[selected].future.length?'':'disabled')+'>다시</button>'+
   '<button type="button" data-ck142-action="reset">초기화</button>'+
   '<label><input type="checkbox" data-ck142-baseline '+(baseline?'checked':'')+'/> 초기 기준선 비교</label></div></div>'+
   '<div class="ck142-right">'+transitionHtml()+
    '<div data-ck142-explain aria-live="polite">'+panel()+'</div>'+
   '<h4>이론·공식 기출 연결</h4><p>'+esc(cfg().theory)+'</p>'+
   '<p>공식기출 연결은 전문가 감수된 개념 태그와 문항 근거가 확보될 때만 활성화합니다. 현재는 검토 중이며 공식 문항 ID를 임의 생성하지 않습니다.</p>'+
   '<button type="button" data-ck142-action="search">원문 800문항 검색으로 이동</button>'+
   '<label class="ck142-opt-in"><input type="checkbox" data-ck142-store '+(storage?'checked':'')+'/> 그래프 실험기록만 기기에 저장 (선택)</label>'+
   '<small data-ck142-status role="status">'+esc(note)+'</small></div></div>';
 }
 function live(root){
  if(!root||!root.isConnected)return;
  const graph=root.querySelector('.ck142-graph'),existing=graph?.querySelector('.ck142-svg');
  const markup=svg();
  if(existing&&markup){existing.innerHTML=markup.slice(markup.indexOf('>')+1,markup.lastIndexOf('</svg>'));}
  else if(graph)graph.innerHTML=markup;
  const explanation=root.querySelector('[data-ck142-explain]');if(explanation)explanation.innerHTML=panel();
  const board=root.querySelector('.ck144-change-board');if(board){
   const wasOpen=board.querySelector?.('.ck145-deep')?.open;
   board.outerHTML=transitionHtml(wasOpen);
  }
  const brief=root.querySelector('.ck145-live-brief');if(brief)brief.outerHTML=quickTheoryHtml();
  const bar=root.querySelector('.ck143-insight');if(bar)bar.outerHTML=insightHtml();
  const legend=root.querySelector('.ck142-legend');if(legend)legend.outerHTML=legendHtml();
  for(const [k,v] of Object.entries(sessions[selected].current)){
   const control=root.querySelector('[data-ck142-control="'+k+'"]');
   const number=root.querySelector('[data-ck142-number="'+k+'"]');
   const out=root.querySelector('[data-ck142-output="'+k+'"]');
   if(control)control.value=String(v);
   // Avoid replacing the number field text while user is typing there.
   if(number&&document.activeElement!==number)number.value=String(v);
   if(out)out.textContent=fmt(v);
  }
  const a=root.querySelector('[data-ck142-action="undo"]'),b=root.querySelector('[data-ck142-action="redo"]');
  if(a)a.disabled=sessions[selected].past.length===0;
  if(b)b.disabled=sessions[selected].future.length===0;
  const status=root.querySelector('[data-ck142-status]');if(status)status.textContent=note;
 }
 function queue(root){
  lastRoot=root;
  if(frame)return;
  frame=(window.requestAnimationFrame||function(cb){cb();return 0;})(()=>{
   frame=0;if(lastRoot?.isConnected)live(lastRoot);
  });
 }
 function mount(chart){
  if(!chart||!chart.isConnected)return false;
  let root=chart.querySelector('#ck142-theory-studio');
  if(root)return true;
  root=document.createElement('section');root.id='ck142-theory-studio';
  root.setAttribute('aria-label','경제학 심화 개념 실험');
  const lab=chart.querySelector('#ck141-concept-lab');
  if(lab)lab.after(root);else chart.append(root);
  paint(root);return true;
 }
 function search(){
  if(!window.CK76Search?.open?.())return false;
  const q=document.getElementById('ck76-search-query');
  if(q){
   const terms={budget:'예산',ppf:'생산가능',cost:'한계비용',rent:'지대',cobweb:'거미집',arc:'탄력성'};
   q.value=terms[selected];
   q.closest('form')?.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
  }
  return true;
 }
 document.addEventListener('click',e=>{
  const root=e.target.closest?.('#ck142-theory-studio');if(!root)return;
  const levelButton=e.target.closest('[data-ck142-level]');
  if(levelButton){cancelDraft();level=levelButton.dataset.ck142Level==='advanced'?'advanced':'beginner';
   save();paint(root);return;}
  const topic=e.target.closest('[data-ck142-topic]'),m=e.target.closest('[data-ck142-mode]');
  if(topic){cancelDraft();selected=topic.dataset.ck142Topic;save();paint(root);return;}
  if(m){cancelDraft();mode=m.dataset.ck142Mode;save();paint(root);return;}
  const btn=e.target.closest('[data-ck142-action]');if(!btn)return;
  const action=btn.dataset.ck142Action;
  cancelDraft();
  if(action==='search'){search();return;}
  if(action==='undo')undo();if(action==='redo')redo();if(action==='reset')reset();
  paint(root);
 });
 document.addEventListener('change',e=>{
  const root=e.target.closest?.('#ck142-theory-studio');if(!root)return;
  if(e.target.matches('[data-ck142-store]')){chooseStorage(e.target.checked);paint(root);return;}
  if(e.target.matches('[data-ck142-baseline]')){baseline=e.target.checked;save();paint(root);return;}
  if(e.target.matches('[data-ck142-number]')){
   const k=e.target.dataset.ck142Number,v=Number(e.target.value);
   if(e.target.value.trim()!==''&&Number.isFinite(v))apply(k,v);
   paint(root);return;
  }
  if(e.target.matches('[data-ck142-control]')){finishDraft();paint(root);}
 });
 document.addEventListener('input',e=>{
  const range=e.target.closest?.('#ck142-theory-studio [data-ck142-control]');
  if(!range)return;const root=range.closest('#ck142-theory-studio');
  if(!rangeDraft)rangeDraft={...sessions[selected].current};
  const val=Number(range.value),next=models.set(selected,rangeDraft,range.dataset.ck142Control,val);
  if(next){sessions[selected].current=next;sessions[selected].previous={...rangeDraft};queue(root);}
 });
 function valueFromPointer(e,task){
  const box=task.svg.getBoundingClientRect();
  if(box.width<=0)return null;
  const graph=task.graph;
  if(!graph)return null;
  const point=window.CK145GraphGesture?.pointer(e,box,630,395);
  const x=point?.x??((e.clientX-box.left)/box.width*630),
   y=point?.y??((e.clientY-box.top)/box.height*395);
  if(!Number.isFinite(x)||!Number.isFinite(y))return null;
  const xValue=limited((x-46)/530*graph.maxX,0,graph.maxX);
  const yValue=limited((333-y)/286*graph.maxY,0,graph.maxY);
  const k=task.key,s=task.before;
  if(task.fromCurve){
   const scale=point?.scale||Math.min(box.width/630,box.height/395);
   if(!(scale>0))return null;
   const dx=(e.clientX-task.initialClientX)/scale/530*graph.maxX;
   const dy=(e.clientY-task.initialClientY)/scale/286*graph.maxY;
   if(selected==='budget'&&k==='I')return Math.abs(dx*s.px)>=Math.abs(dy*s.py)?
     s.I+2*dx*s.px:s.I-2*dy*s.py;
   if(k==='alpha')return s.alpha+dx/Math.max(10,graph.maxX)*.5;
   if(selected==='cobweb'&&k==='c')return s.c+dx;
   if(k==='q2')return s.q2+dx;
   if(['A','c','R0','a','ymax'].includes(k))return s[k]-dy;
  }
  if(selected==='budget'){
   if(k==='alpha')return xValue*s.px/s.I;
   if(k==='px')return s.I/Math.max(xValue,.01);
   if(k==='py')return s.I/Math.max(yValue,.01);
   if(k==='I'){
    const dx=(e.clientX-task.initialClientX)/box.width*630/530*graph.maxX;
    const dy=(e.clientY-task.initialClientY)/box.height*395/286*graph.maxY;
    return Math.abs(dx*s.px)>=Math.abs(dy*s.py)?s.I+2*dx*s.px:s.I-2*dy*s.py;
   }
  }
  if(selected==='ppf'){
   if(k==='x'||k==='xmax')return xValue;
   if(k==='ymax')return yValue;
   if(k==='u'){
    const frontier=s.ymax*(1-(s.x/s.xmax)**s.gamma);
    const dy=(e.clientY-task.initialClientY)/box.height*395/286*graph.maxY;
    return frontier>1e-6?s.u-dy/frontier:s.u;
   }
  }
  if(selected==='cost'){
   if(k==='q')return xValue;
   if(k==='A'||k==='c')return yValue;
  }
  if(selected==='rent'){
   if(k==='d')return xValue;
   if(k==='R0')return yValue;
   if(k==='t')return (s.R0-yValue)/10;
  }
  if(selected==='cobweb'){
   if(k==='p0')return yValue;
   if(k==='d')return (xValue-s.c)/20;
  }
  if(selected==='arc'){
   const dx=(e.clientX-task.initialClientX)/box.width*630/530*graph.maxX;
   const dy=(e.clientY-task.initialClientY)/box.height*395/286*graph.maxY;
   if(k==='q1'||k==='q2')return s[k]+dx;
   if(k==='p1'||k==='p2')return s[k]-dy;
  }
  return yValue;
 }
 function pointerPreview(e){
  if(!drag||drag.id!==e.pointerId)return;
  const v=valueFromPointer(e,drag);
  if(v===null)return;
  let next=models.set(selected,drag.before,drag.key,v);
  if(next&&selected==='ppf'&&drag.key==='x'){
   const frontier=next.ymax*(1-(next.x/next.xmax)**next.gamma);
   const box=drag.svg.getBoundingClientRect();
   const ySvg=(e.clientY-box.top)/box.height*395;
   const yValue=Math.max(0,(333-ySvg)/286*drag.graph.maxY);
   if(frontier>1e-6)next=models.set('ppf',next,'u',yValue/frontier)||next;
  }
  if(next){sessions[selected].current=next;sessions[selected].previous={...drag.before};queue(drag.root);}
 }
 document.addEventListener('pointerdown',e=>{
  if(drag||rangeDraft||e.isPrimary===false||(e.pointerType==='mouse'&&e.button!==0))return;
  const handle=e.target.closest?.('#ck142-theory-studio [data-ck142-handle]');
  const svg=e.target.closest?.('#ck142-theory-studio .ck142-svg')||
   handle?.closest?.('.ck142-svg')||
   handle?.closest?.('#ck142-theory-studio')?.querySelector?.('.ck142-svg');
  const root=svg?.closest?.('#ck142-theory-studio')||handle?.closest?.('#ck142-theory-studio');
  if(!svg||!root)return;
  const graph=models.drawing(selected,sessions[selected].current);
  const nearest=!handle?window.CK145GraphGesture?.nearestTheory(
   e,svg.getBoundingClientRect(),graph,selected,e.pointerType||'touch'):null;
  const key=handle?.dataset?.ck142Handle||nearest?.key;
  if(!key)return;
  drag={id:e.pointerId,svg,root,key,fromCurve:Boolean(nearest),
   before:{...sessions[selected].current},previous:{...sessions[selected].previous},
   graph,initialClientX:e.clientX,initialClientY:e.clientY};
  svg.closest?.('.ck142-graph')?.classList.add('ck142-grabbing');
  try{svg.setPointerCapture(e.pointerId);}catch{}
  if(e.cancelable!==false)e.preventDefault?.();
 },{capture:true,passive:false});
 document.addEventListener('pointermove',e=>{
  if(!drag||drag.id!==e.pointerId)return;
  if(e.cancelable)e.preventDefault();pointerPreview(e);
 },{passive:false});
 function endPointer(e,commit){
  if(!drag||e.pointerId!==drag.id)return;
  const d=drag;
  if(commit)pointerPreview(e);
  drag=null;
  try{d.svg.releasePointerCapture(e.pointerId);}catch{}
  if(commit)record(d.before);
  else {sessions[selected].current=d.before;sessions[selected].previous=d.previous;}
  d.svg.closest?.('.ck142-graph')?.classList.remove('ck142-grabbing');
  paint(d.root);
 }
 document.addEventListener('pointerup',e=>endPointer(e,true));
 document.addEventListener('pointercancel',e=>endPointer(e,false));
 document.addEventListener('lostpointercapture',e=>{
  if(drag&&e.pointerId===drag.id)endPointer(e,false);
 });
 function cancelAll(){if(!drag&&!rangeDraft)return;cancelDraft();if(lastRoot?.isConnected)paint(lastRoot);}
 window.addEventListener('blur',cancelAll);
 window.addEventListener('ck:pen-deactivate',cancelAll);

 window.addEventListener('pagehide',cancelAll);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelAll();});
 document.addEventListener('keydown',e=>{
  const handle=e.target.closest?.('#ck142-theory-studio [data-ck142-handle]');
  if(!handle||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key))return;
  const k=handle.dataset.ck142Handle,f=cfg().f[k];
  if(!f)return;
  e.preventDefault();
  const dir=e.key==='ArrowLeft'||e.key==='ArrowDown'?-1:1;
  const next=e.key==='Home'?f[1]:e.key==='End'?f[2]:
   sessions[selected].current[k]+dir*f[3]*(e.shiftKey?5:1);
  apply(k,next);
  const root=handle.closest('#ck142-theory-studio');
  live(root);
  root.querySelector('[data-ck142-handle="'+k+'"]')?.focus();
 });
 window.CK142Theory=Object.freeze({
  mount,getState:()=>({selected,mode,storage,baseline,session:deep(sessions),note,
   comparison:window.CK144ChangeExplain?.theory(selected,
    baseline?models.initial(selected):sessions[selected].previous,sessions[selected].current,models)}),
  models
 });
})();
