/* ConceptKnot v15 / native-browser PDF handwriting layer.
   PDF.js renders PDF pages; S Pen/Pointer Events paint on a normalized canvas.
   Files and annotations remain on the user's device. No upload/API token.
 */
(function(){
'use strict';
const PDFJS_URL='https://cdn.jsdelivr.net/npm/pdfjs-dist@6.3.289/build/pdf.mjs';
const WORKER_URL='https://cdn.jsdelivr.net/npm/pdfjs-dist@6.3.289/build/pdf.worker.mjs';
const PDFLIB_URL='https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js';
const ANNOTATION_PREFIX='ck15-ink:';
const INK_BACKUP_FORMAT='conceptknot-pdf-ink',INK_BACKUP_LIMIT=12*1024*1024;
const INK_MAX_PAGES=500,INK_MAX_STROKES=12000,INK_MAX_POINTS=400000;
const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
let pdfjsPromise=null,pdflibPromise=null,session=null,pendingFile=null,pendingYear=0,attachFrame=0;
const els=(host,selector)=>host.querySelector(selector)||(selector==='[data-ck15-scroll]'?host.closest('[data-ck15-scroll]'):null);
function alertStatus(s,message){
 if(s.parent){alertStatus(s.parent,message);return}
 const el=els(s.host,'[data-ck15-status]');
 if(el)el.textContent=message;
}
function pdfjs(){
 if(!pdfjsPromise)pdfjsPromise=import(PDFJS_URL).then(lib=>{
  lib.GlobalWorkerOptions.workerSrc=WORKER_URL;return lib;
 }).catch(err=>{pdfjsPromise=null;throw err});
 return pdfjsPromise;
}
function pdflib(){
 if(window.PDFLib)return Promise.resolve(window.PDFLib);
 if(!pdflibPromise)pdflibPromise=new Promise((resolve,reject)=>{
  const script=document.createElement('script');
  script.src=PDFLIB_URL;script.async=true;script.crossOrigin='anonymous';
  script.onload=()=>window.PDFLib?resolve(window.PDFLib):reject(new Error('PDF 저장 라이브러리가 없습니다.'));
  script.onerror=()=>reject(new Error('PDF 저장 모듈을 연결하지 못했습니다.'));
  document.head.append(script);
 }).catch(err=>{pdflibPromise=null;throw err});
 return pdflibPromise;
}
function annotationId(s){
 const file=s.file||null;
 if(file)return ANNOTATION_PREFIX+s.year+':file:'+encodeURIComponent(file.name)+':'+file.size;
 return ANNOTATION_PREFIX+s.year+':official';
}
function restore(s,keyOverride){
 s.annotationKey=keyOverride||annotationId(s);
 let data=null;s.inkIssue='';s.loadedInkRaw=null;s.inkDirty=false;s.inkBackedUp=false;
 try{
  s.loadedInkRaw=localStorage.getItem(s.annotationKey);
  if(s.loadedInkRaw!==null){
   data=JSON.parse(s.loadedInkRaw);
   if(!data||typeof data!=='object'||Array.isArray(data))
    s.inkIssue='기존 PDF 필기 형식 오류: 저장을 차단했습니다.';
  }
 }catch(e){s.inkIssue='기존 PDF 필기 기록을 읽지 못하여 덮어쓰기를 차단했습니다.';}
 s.annotations=Object.create(null);
 if(data&&typeof data==='object'&&!Array.isArray(data)){
  let total=0;
  for(const [page,items] of Object.entries(data)){
   if(!/^[1-9]\d*$/.test(page)||!Array.isArray(items)||items.length>INK_MAX_STROKES){
    s.inkIssue='PDF 필기 기록의 페이지·획 구조가 손상됐습니다. 자동 덮어쓰기를 차단했습니다.';continue;
   }
   total+=items.length;
   if(total>INK_MAX_STROKES){s.inkIssue='PDF 필기가 안전 검사 한도를 초과합니다. 자동 덮어쓰기를 차단했습니다.';break}
   const lines=[];
   for(const item of items){
    if(!item||!Array.isArray(item.points)||!item.points.length||item.points.length>30000||
     !/^#[0-9a-f]{6}$/i.test(item.color)||!Number.isFinite(item.width)||item.width<1||item.width>65||
     item.points.some(p=>!Array.isArray(p)||p.length<2||!Number.isFinite(p[0])||!Number.isFinite(p[1]))){
     s.inkIssue='PDF 필기의 좌표·색상 구조가 손상됐습니다. 자동 덮어쓰기를 차단했습니다.';continue;
    }
    lines.push({color:item.color,tool:item.tool==='highlighter'?'highlighter':'pen',width:clamp(item.width,1,40),
     points:item.points.map(p=>[clamp(p[0],0,1),clamp(p[1],0,1),clamp(Number(p[2])||.5,.05,1)])});
   }
   s.annotations[page]=lines;
  }
 }
 s.redo=Object.create(null);
}
function persist(s){
 const root=s.parent||s;
 if(root.inkIssue){
  root.inkDirty=true;root.inkBackedUp=false;
  alertStatus(root,root.inkIssue);return false;
 }
 try{
  if(localStorage.getItem(root.annotationKey)!==root.loadedInkRaw){
   root.inkIssue='다른 탭에서 PDF 필기가 변경되었습니다. 현재 필기를 JSON/PDF로 백업한 후 새로고침하세요.';
   root.inkDirty=true;root.inkBackedUp=false;
   alertStatus(root,root.inkIssue);return false;
  }
  const raw=JSON.stringify(root.annotations);
  localStorage.setItem(root.annotationKey,raw);
  root.loadedInkRaw=raw;
  root.inkDirty=false;root.inkBackedUp=false;
  return true;
 }catch(e){
  root.inkDirty=true;root.inkBackedUp=false;
  alertStatus(root,'PDF 필기 저장 실패. JSON/PDF로 먼저 백업하세요 (저장 공간·권한 확인).');
  return false;
 }
}
function strokes(s){const k=String(s.page);return s.annotations[k]||(s.annotations[k]=[])}
function drawPenStroke(ctx,ink,width,height,scale){
 const pts=ink.points;if(!pts?.length)return;
 ctx.globalAlpha=ink.tool==='highlighter'?.32:1;
 ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=ink.color;ctx.fillStyle=ink.color;
 const thickness=p=>ink.width*scale*(.3+1.4*(p[2]||.5));
 ctx.beginPath();ctx.arc(pts[0][0]*width,pts[0][1]*height,Math.max(.5,thickness(pts[0])/2),0,2*Math.PI);ctx.fill();
 for(let i=1;i<pts.length;i++){
  const a=pts[i-1],b=pts[i];ctx.lineWidth=(thickness(a)+thickness(b))/2;
  ctx.beginPath();ctx.moveTo(a[0]*width,a[1]*height);ctx.lineTo(b[0]*width,b[1]*height);ctx.stroke();
 }
 ctx.globalAlpha=1;
}
function redrawInk(s){
 if(!s.host?.isConnected)return;
 const canvas=els(s.host,'[data-ck15-ink-canvas]'),page=els(s.host,'[data-ck15-page]');
 if(!canvas||!page)return;
 const box=page.getBoundingClientRect(),width=box.width,height=box.height;
 if(width<1||height<1)return;
 const ratio=Math.min(window.devicePixelRatio||1,2);
 const cw=Math.max(1,Math.round(width*ratio)),ch=Math.max(1,Math.round(height*ratio));
 if(canvas.width!==cw||canvas.height!==ch){canvas.width=cw;canvas.height=ch}
 canvas.style.width=width+'px';canvas.style.height=height+'px';
 const ctx=canvas.getContext('2d');if(!ctx)return;
 ctx.setTransform(cw/width,0,0,ch/height,0,0);ctx.clearRect(0,0,width,height);
 const draw=strokes(s).concat(s.activeStroke?[s.activeStroke]:[]);
 for(const ink of draw)drawPenStroke(ctx,ink,width,height,s.zoom);
}
function pageMetrics(s){
 if(!s.parent){
  const scroller=els(s.host,'[data-ck15-scroll]');
  scroller?.classList?.toggle('ck17-spread',!!s.spread);
  s.host?.setAttribute?.('data-ck15-view',s.spread?'spread':'single');
 }
 if(!s.baseViewport)return;
 const width=s.baseViewport.width*s.zoom,height=s.baseViewport.height*s.zoom;
 const page=els(s.host,'[data-ck15-page]'),display=els(s.host,'[data-ck15-page-canvas]');
 if(!page||!display)return;
 page.style.width=width+'px';page.style.height=height+'px';
 display.style.width=width+'px';display.style.height=height+'px';
 const output=els(s.host,'[data-ck15-zoom-value]');
 if(output&&document.activeElement!==output)output.value=Math.round(s.zoom*100);
 const count=els(s.host,'[data-ck15-page-label]');
 if(count&&document.activeElement!==count)count.value=s.page;
 const total=els(s.host,'[data-ck42-page-total]');if(total)total.textContent='/'+(s.pdf?.numPages||'—');
 const prev=els(s.host,'[data-ck15-prev]'),next=els(s.host,'[data-ck15-next]');
 if(prev)prev.disabled=s.page<=1;
 if(next)next.disabled=s.page+(s.spread?1:0)>=s.pdf.numPages;
 if(!s.parent){
  const toggle=els(s.host,'[data-ck17-spread]');
  if(toggle){toggle.setAttribute('aria-pressed',String(!!s.spread));toggle.setAttribute('aria-label',s.spread?'PDF 한 페이지씩 보기':'PDF 두 페이지 나란히 보기');toggle.title=s.spread?'한 페이지 보기':'두 페이지 펼쳐보기'}
 }
 if(total&&s.spread)total.textContent='–'+Math.min(s.page+1,s.pdf.numPages)+'/'+s.pdf.numPages;
 if(s.second){s.second.zoom=s.zoom;pageMetrics(s.second)}
 redrawInk(s);
}
function schedulePaint(s,delay=130){
 if(s.paintTimer)clearTimeout(s.paintTimer);
 s.paintTimer=setTimeout(()=>paintPdf(s).catch(err=>alertStatus(s,'PDF 페이지 그리기 실패: '+err.message)),delay);
}
async function paintPdf(s){
 if(!s.pdf||!s.host?.isConnected)return;
 const token=++s.paintToken;
 if(s.renderTask){try{s.renderTask.cancel()}catch(err){}s.renderTask=null}
 const pdfPage=await s.pdf.getPage(s.page);
 if(token!==s.paintToken||!s.host.isConnected)return;
 if(!s.baseViewport){
  const atOne=pdfPage.getViewport({scale:1});
  const scroller=els(s.host,'[data-ck15-scroll]');
  const available=Math.max(100,scroller.clientWidth-(s.spread?36:24));
  const fit=Math.max(.08,Math.min(3,(available/(s.spread?2:1))/atOne.width));
  s.baseViewport={width:atOne.width*fit,height:atOne.height*fit,fit};
 }
 pageMetrics(s);
 const viewport=pdfPage.getViewport({scale:s.baseViewport.fit*s.zoom});
 const ratio=Math.min(2,window.devicePixelRatio||1);
 const temp=document.createElement('canvas');
 temp.width=Math.ceil(viewport.width*ratio);temp.height=Math.ceil(viewport.height*ratio);
 // Prevent oversized device-memory allocations on long/high-resolution exams.
 if(temp.width*temp.height>25000000){const factor=Math.sqrt(25000000/(temp.width*temp.height));temp.width=Math.floor(temp.width*factor);temp.height=Math.floor(temp.height*factor)}
 const ctx=temp.getContext('2d');if(!ctx)throw Error('PDF 캔버스를 만들 수 없습니다.');
 const transform=[temp.width/viewport.width,0,0,temp.height/viewport.height,0,0];
 const job=pdfPage.render({canvasContext:ctx,viewport,transform});
 s.renderTask=job;
 try{await job.promise}catch(err){if(err?.name==='RenderingCancelledException'||token!==s.paintToken)return;throw err}
 finally{if(s.renderTask===job)s.renderTask=null}
 if(token!==s.paintToken||!s.host.isConnected)return;
 const canvas=els(s.host,'[data-ck15-page-canvas]');
 if(!canvas)return;
 canvas.width=temp.width;canvas.height=temp.height;
 canvas.getContext('2d')?.drawImage(temp,0,0);
 redrawInk(s);
 if(!s.parent)await paintSpread(s,token);
 alertStatus(s,'원문 '+s.page+' / '+s.pdf.numPages+'쪽 · '+Math.round(s.zoom*100)+'% · '+strokes(s).length+'획 (로컬 저장)');
}
function releaseSecond(s){
 if(!s.second)return;
 const child=s.second;
 // Persist any unfinished right-page ink before detaching the canvas.
 finishInput(child);
 child.paintToken++;
 if(child.renderTask){try{child.renderTask.cancel()}catch(err){}}
 child.host?.remove();
 s.second=null;
 if(s.activePage===child)s.activePage=s;
}
async function paintSpread(s,token){
 const scroll=els(s.host,'[data-ck15-scroll]');
 if(!scroll)return;
 scroll.classList.toggle('ck17-spread',!!s.spread);
 if(!s.spread||s.page>=s.pdf.numPages){releaseSecond(s);return}
 if(token!==s.paintToken||!s.host.isConnected)return;
 let child=s.second;
 if(!child){
  const host=document.createElement('div');host.className='ck17-second-page';
  host.setAttribute('aria-label','오른쪽 PDF 페이지');
  host.innerHTML='<div class="ck15-pdf-page" data-ck15-page><canvas data-ck15-page-canvas aria-label="오른쪽 PDF 원문"></canvas><canvas data-ck15-ink-canvas aria-label="오른쪽 페이지 필기"></canvas></div>';
  scroll.append(host);
  child={...s,host,parent:s,second:null,spread:false,activeStroke:null,touchPoints:new Map(),gesture:null,pinch:null,renderTask:null,paintToken:0};
  s.second=child;bind(child);
 }
 child.page=s.page+1;child.zoom=s.zoom;child.tool=s.tool;child.color=s.color;child.baseViewport=null;
  setPenMode(child,s.penMode);
 const page=await s.pdf.getPage(child.page);
 if(token!==s.paintToken||!s.host.isConnected||s.second!==child)return;
 const vp=page.getViewport({scale:1});
 child.baseViewport={width:vp.width*s.baseViewport.fit,height:vp.height*s.baseViewport.fit,fit:s.baseViewport.fit};
 await paintPdf(child);
 if(token===s.paintToken)alertStatus(s,'원문 '+s.page+'–'+child.page+' / '+s.pdf.numPages+'쪽 · '+Math.round(s.zoom*100)+'% · 두 페이지 펼쳐보기');
}
function applyZoom(s,newZoom,clientX,clientY){
 if(s.parent){applyZoom(s.parent,newZoom,clientX,clientY);return}
 if(!s.baseViewport)return;
 const scroller=els(s.host,'[data-ck15-scroll]');
 if(!scroller)return;
 const prior=s.zoom,next=clamp(newZoom,.5,4.5);
 if(Math.abs(next-prior)<.005)return;
 const rect=scroller.getBoundingClientRect();
 const x=Number.isFinite(clientX)?clientX-rect.left:rect.width/2;
 const y=Number.isFinite(clientY)?clientY-rect.top:rect.height/2;
 const originX=scroller.scrollLeft+x,originY=scroller.scrollTop+y;
 s.zoom=next;pageMetrics(s);
 scroller.scrollLeft=originX*(next/prior)-x;
 scroller.scrollTop=originY*(next/prior)-y;
 schedulePaint(s);
}
async function goPage(s,page){
 if(!s.pdf)return false;
 finishInput(s);
 if(s.second)finishInput(s.second);
 if(s.inkDirty&&!s.inkBackedUp){
  alertStatus(s,'저장되지 않은 필기가 있습니다. 필기 JSON 백업 또는 필기 PDF 저장 후 페이지를 이동하세요.');
  return false;
 }
 // A page change is not a tab exit: preserve deliberate S Pen mode.
 s.page=clamp(Math.round(page),1,s.pdf.numPages);
 if(s.spread)s.page=1+2*Math.floor((s.page-1)/2);
 releaseSecond(s);
 s.baseViewport=null;s.paintToken++;
 if(s.renderTask){try{s.renderTask.cancel()}catch(err){}s.renderTask=null}
 const scroller=els(s.host,'[data-ck15-scroll]');
 if(scroller){scroller.scrollLeft=0;scroller.scrollTop=0}
 s.activeStroke=null;
 await paintPdf(s);
}
function fallback(s,message){
 if(!s.host?.isConnected)return;
 const body=els(s.host,'[data-ck15-fallback]'),scroll=els(s.host,'[data-ck15-scroll]');
 if(body)body.hidden=false;if(scroll)scroll.hidden=true;
 alertStatus(s,message+' 원문을 별도 창에서 열거나 다운로드한 PDF 파일을 아래에서 선택하세요.');
}
async function loadDocument(s){
 const token=++s.documentToken;
 alertStatus(s,'PDF를 불러오는 중… · 두 페이지 펼쳐보기는 로딩 후 반영됩니다.');
 try{
  const lib=await pdfjs();
  if(token!==s.documentToken||!s.host?.isConnected)return;
  let bytes;
  if(s.file){
   bytes=new Uint8Array(await s.file.arrayBuffer());
  }else{
   const response=await fetch(s.source,{mode:'cors',credentials:'omit'});
   if(!response.ok)throw new Error('HTTP '+response.status);
   const size=Number(response.headers.get('content-length'))||0;
   if(size>85000000)throw new Error('PDF 크기가 85MB를 초과합니다.');
   bytes=new Uint8Array(await response.arrayBuffer());
  }
  if(bytes.length>5){
   const header=String.fromCharCode(...bytes.slice(0,Math.min(1024,bytes.length)));
   if(!header.includes('%PDF-'))throw new Error('PDF 대신 HTML/다른 형식을 받았습니다.');
  }
  if(token!==s.documentToken||!s.host.isConnected)return;
  if(!bytes.length||bytes.length>85000000)throw new Error('PDF 데이터 크기를 확인하세요.');
  s.bytes=bytes;
  const task=lib.getDocument({data:new Uint8Array(bytes)});
  s.loadingTask=task;
  const doc=await task.promise;
  if(token!==s.documentToken||!s.host.isConnected){doc.destroy();return}
  if(s.file&&!await selectFileInkIdentity(s,bytes,token)){doc.destroy();return;}
   if(token!==s.documentToken||!s.host?.isConnected){doc.destroy();return;}
   s.pdf=doc;s.page=Math.min(s.page,doc.numPages);s.baseViewport=null;
   const recoverButton=s.host.querySelector?.('[data-ck117-ink-raw]');
   if(recoverButton)recoverButton.hidden=!((s.inkIssue&&s.loadedInkRaw!==null)||s.legacyReadIssue);
  const body=els(s.host,'[data-ck15-fallback]'),scroll=els(s.host,'[data-ck15-scroll]');
  if(body)body.hidden=true;if(scroll)scroll.hidden=false;
  await paintPdf(s);
 }catch(err){
  if(token===s.documentToken)fallback(s,'PDF 펼쳐보기 뷰어 오류: '+(err?.message||'읽기 오류')+'.'+(s.file?' 파일 형식을 확인하세요.':' PDF를 다운로드한 다음 아래에서 업로드하면 두 페이지 보기와 필기가 가능합니다.'));
 }
}
function pointerPoint(s,event){
 const rect=els(s.host,'[data-ck15-page]').getBoundingClientRect();
 return [clamp((event.clientX-rect.left)/rect.width,0,1),clamp((event.clientY-rect.top)/rect.height,0,1),event.pointerType==='pen'?clamp(event.pressure||.5,.05,1):.5];
}
function hitTest(stroke,x,y,rect){
 const px=x*rect.width,py=y*rect.height;
 for(let i=0;i<stroke.points.length;i++){
  const a=stroke.points[i],b=stroke.points[Math.min(i+1,stroke.points.length-1)],ax=a[0]*rect.width,ay=a[1]*rect.height,bx=b[0]*rect.width,by=b[1]*rect.height;
  const dx=bx-ax,dy=by-ay,t=clamp(((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy||1),0,1);
  if(Math.hypot(px-ax-t*dx,py-ay-t*dy)<13+stroke.width/2)return true;
 }return false;
}
function eraseAt(s,event){
 const point=pointerPoint(s,event),rect=els(s.host,'[data-ck15-page]').getBoundingClientRect(),line=strokes(s),prior=s.erasePoint||point;
 const steps=Math.max(1,Math.ceil(Math.hypot((point[0]-prior[0])*rect.width,(point[1]-prior[1])*rect.height)/6));let changed=false;
 for(let i=line.length-1;i>=0;i--){for(let j=0;j<=steps;j++){const f=j/steps;if(hitTest(line[i],prior[0]+(point[0]-prior[0])*f,prior[1]+(point[1]-prior[1])*f,rect)){line.splice(i,1);changed=true;break;}}}
 s.erasePoint=point;if(changed){
  s.eraseDirty=true;s.redo[String(s.page)]=[];
  const root=s.parent||s;root.inkDirty=true;root.inkBackedUp=false;
  redrawInk(s);
 }
}
function penEraser(event){return window.CKPen60?.eraser(event)===true;}

function commitStroke(s){
 if(!s.activeStroke)return;
 if(s.activeStroke.points.length){
  strokes(s).push(s.activeStroke);s.redo[String(s.page)]=[];
  const root=s.parent||s;root.inkDirty=true;root.inkBackedUp=false;persist(s);
 }
 s.activeStroke=null;
}
function setPenMode(s,on){
 s.penMode=!!on;
 s.host?.classList.toggle('ck59-pdf-spen',!!on);
 s.host?.querySelector('[data-ck15-spen]')?.setAttribute('aria-pressed',String(!!on));
 if(s.second)setPenMode(s.second,on);
}
function finishInput(s){
 if(!s)return;
 if(s.second)finishInput(s.second);
 const id=s.strokePointer;s.strokePointer=null;
 commitStroke(s);
 if(s.eraseDirty){persist(s);s.eraseDirty=false;}
 s.erasing=null;s.erasePoint=null;s.gesture=null;s.pinch=null;s.touchPoints.clear();
 const ink=s.host&&els(s.host,'[data-ck15-ink-canvas]');
 if(id!=null){try{if(ink?.hasPointerCapture(id))ink.releasePointerCapture(id)}catch{}}
 redrawInk(s);
}
function endPenSession(s){
 if(!s)return;
 finishInput(s);
 setPenMode(s,false);
}
function onPointerDown(s,event){
 if(!s.pdf||!s.host.isConnected)return;
 if(event.pointerType==='touch'&&(s.penMode||s.strokePointer!=null))return;
 if(event.pointerType==='pen'&&!window.CKPen60?.contact(event))return;
 if(event.pointerType!=='touch'&&event.pointerType!=='pen'&&event.button!==0)return;
 if(event.pointerType!=='touch'&&s.strokePointer!=null){if(s.strokePointer===event.pointerId)onPointerMove(s,event);return;}
 s.lastZoomGestureMoved=false;
 if(s.parent)s.parent.activePage=s;else s.activePage=s;
 const ink=els(s.host,'[data-ck15-ink-canvas]'),scroller=els(s.host,'[data-ck15-scroll]');
 if(!ink||!scroller)return;
 if(event.pointerType==='touch'){
  s.touchPoints.set(event.pointerId,{x:event.clientX,y:event.clientY});
  if(s.touchPoints.size===1){s.gesture={type:'pan',x:event.clientX,y:event.clientY,left:scroller.scrollLeft,top:scroller.scrollTop};}
  if(s.touchPoints.size>=2){
   s.gesture=null;const touches=[...s.touchPoints.values()];
   s.pinch={distance:Math.hypot(touches[0].x-touches[1].x,touches[0].y-touches[1].y),zoom:s.zoom};
  }
 }else if(s.tool==='eraser'||penEraser(event)){
  s.erasing=event.pointerId;s.erasePoint=null;eraseAt(s,event);
 }else if(event.pointerType!=='pen'&&(event.detail>=2||(s.tool==='hand'&&s.lastTap&&performance.now()-s.lastTap.time<360&&Math.hypot(event.clientX-s.lastTap.x,event.clientY-s.lastTap.y)<12))){
  s.gesture={type:'zoom',x:event.clientX,y:event.clientY,initial:(s.parent||s).zoom,moved:false};
 }else if(s.tool==='pen'||s.tool==='highlighter'||event.pointerType==='pen'){
  s.activeStroke={tool:s.tool==='highlighter'?'highlighter':'pen',color:s.color,width:clamp(s.tool==='highlighter'?s.width*3.1:s.width,1,40),points:[pointerPoint(s,event)]};
 }else{
  s.gesture={type:'pan',x:event.clientX,y:event.clientY,left:scroller.scrollLeft,top:scroller.scrollTop};
 }
 if(s.activeStroke||s.erasing!=null)s.strokePointer=event.pointerId;
 try{ink.setPointerCapture(event.pointerId)}catch(e){}
 event.preventDefault();
}
function onPointerMove(s,event){
 if(!s.pdf||!s.host.isConnected)return;
 if(s.strokePointer==null&&window.CKPen60?.contact(event)){onPointerDown(s,event);return;}
 if(event.pointerType==='touch'&&s.touchPoints.has(event.pointerId)){
  s.touchPoints.set(event.pointerId,{x:event.clientX,y:event.clientY});
  if(s.touchPoints.size>=2&&s.pinch){
   const values=[...s.touchPoints.values()];
   const d=Math.hypot(values[0].x-values[1].x,values[0].y-values[1].y);
   const midX=(values[0].x+values[1].x)/2,midY=(values[0].y+values[1].y)/2;
   applyZoom(s,s.pinch.zoom*(d/Math.max(1,s.pinch.distance)),midX,midY);
   event.preventDefault();return;
  }
 }
 if(s.strokePointer!=null&&s.strokePointer!==event.pointerId)return;
 if(s.strokePointer===event.pointerId&&event.pointerType==='pen'){
  const erasing=penEraser(event)||s.tool==='eraser';
  if(erasing&&s.erasing==null){commitStroke(s);s.erasing=event.pointerId;s.erasePoint=null;}
  else if(!erasing&&s.erasing!=null){
   if(s.eraseDirty){persist(s);s.eraseDirty=false;}
   s.erasing=null;s.erasePoint=null;
   s.activeStroke={tool:s.tool==='highlighter'?'highlighter':'pen',color:s.color,width:clamp(s.tool==='highlighter'?s.width*3.1:s.width,1,40),points:[pointerPoint(s,event)]};
  }
 }
 if(s.erasing===event.pointerId){eraseAt(s,event);event.preventDefault();return;}
 if(s.activeStroke&&s.strokePointer===event.pointerId){
  const coalesced=event.getCoalescedEvents?.()||[event];
  for(const sample of coalesced.length?coalesced:[event])s.activeStroke.points.push(pointerPoint(s,sample));
  redrawInk(s);event.preventDefault();return;
 }
 if(s.gesture?.type==='zoom'){
  const delta=(event.clientY-s.gesture.y)/220;
  if(Math.abs(delta)>.025)s.gesture.moved=true;
  applyZoom(s,s.gesture.initial+delta,s.gesture.x,s.gesture.y);
  event.preventDefault();return;
 }
 if(s.gesture?.type==='pan'){
  if(Math.hypot(event.clientX-s.gesture.x,event.clientY-s.gesture.y)>4)s.gesture.moved=true;
  const scroller=els(s.host,'[data-ck15-scroll]');
  scroller.scrollLeft=s.gesture.left+s.gesture.x-event.clientX;
  scroller.scrollTop=s.gesture.top+s.gesture.y-event.clientY;
  event.preventDefault();
 }
}
function onPointerUp(s,event){
 // Pointerup finalizes the stroke even when S Pen barrel remains pressed.
 const drawing=s.strokePointer===event.pointerId;
 if(!drawing&&!s.touchPoints.has(event.pointerId)&&!s.gesture)return;
 if(drawing){
  s.strokePointer=null;commitStroke(s);
  s.erasing=null;s.erasePoint=null;
  if(s.eraseDirty){persist(s);s.eraseDirty=false;}
 }
 if(event.type==='pointerup')s.lastZoomGestureMoved=s.gesture?.type==='zoom'&&!!s.gesture.moved;
 if(event.type==='pointerup'&&!s.gesture?.moved)s.lastTap={time:performance.now(),x:event.clientX,y:event.clientY};
 s.touchPoints.delete(event.pointerId);if(s.touchPoints.size<2)s.pinch=null;
 s.gesture=null;
 const ink=els(s.host,'[data-ck15-ink-canvas]');
 try{if(ink?.hasPointerCapture(event.pointerId))ink.releasePointerCapture(event.pointerId)}catch{}
 redrawInk(s);
}
function updateTool(s,tool){
 if(s.strokePointer!=null||s.erasing!=null)finishInput(s);
 s.tool=tool;
 if(s.second)updateTool(s.second,tool);
 s.host.querySelectorAll('[data-ck15-tool]').forEach(btn=>btn.setAttribute('aria-pressed',String(btn.dataset.ck15Tool===tool)));
 const ink=els(s.host,'[data-ck15-ink-canvas]');
 if(ink)ink.style.cursor=tool==='hand'?'grab':tool==='eraser'?'cell':'crosshair';
}
function undo(s){
 const list=strokes(s);if(!list.length)return;
 (s.redo[String(s.page)]||(s.redo[String(s.page)]=[])).push(list.pop());
 const root=s.parent||s;root.inkDirty=true;root.inkBackedUp=false;
 persist(s);redrawInk(s);
}
function redo(s){
 const redoStack=s.redo[String(s.page)]||[];
 if(!redoStack.length)return;
 strokes(s).push(redoStack.pop());
 const root=s.parent||s;root.inkDirty=true;root.inkBackedUp=false;
 persist(s);redrawInk(s);
}
function downloadBlob(blob,name){
 const url=URL.createObjectURL(blob);
 const anchor=document.createElement('a');anchor.href=url;anchor.download=name;document.body.append(anchor);anchor.click();anchor.remove();
 setTimeout(()=>URL.revokeObjectURL(url),4000);
}
function annotationCanvas(s,pageNo,width,height){
 const canvas=document.createElement('canvas');
 canvas.width=Math.max(2,Math.round(width));canvas.height=Math.max(2,Math.round(height));
 const ctx=canvas.getContext('2d');if(!ctx)return null;
 for(const stroke of s.annotations[String(pageNo)]||[])drawPenStroke(ctx,stroke,width,height,width/(s.baseViewport?.width||650));
 return canvas;
}
async function exportPdf(s){
 if(!s.bytes?.length)throw Error('PDF 원문이 아직 준비되지 않았습니다.');
 const lib=await pdflib(),out=await lib.PDFDocument.load(s.bytes);
 const pages=out.getPages();
 for(const [page,lines] of Object.entries(s.annotations)){
  const n=Number(page);if(!Array.isArray(lines)||!lines.length||n<1||n>pages.length)continue;
  const dest=pages[n-1],size=dest.getSize();
  // Transparent PNG overlays retain searchable PDF text beneath.
  const ink=annotationCanvas(s,n,Math.min(1600,size.width*2),Math.min(2200,size.height*2));
  if(!ink)continue;
  const png=await out.embedPng(ink.toDataURL('image/png'));
  dest.drawImage(png,{x:0,y:0,width:size.width,height:size.height});
 }
 const data=await out.save();
 downloadBlob(new Blob([data],{type:'application/pdf'}),'ConceptKnot-'+s.year+'-필기.pdf');
 s.inkBackedUp=true;
}

function validateInkBackup(data,pageCount=0){
 if(!data||data.format!==INK_BACKUP_FORMAT||data.version!==1||
  typeof data.documentKey!=='string'||data.documentKey.length>512||
  !data.documentKey.startsWith(ANNOTATION_PREFIX)||
  !data.annotations||typeof data.annotations!=='object'||Array.isArray(data.annotations))return null;
 const clean=Object.create(null),pages=Object.entries(data.annotations);
 if(pages.length>INK_MAX_PAGES)return null;
 let total=0,points=0;
 for(const [page,lines] of pages){
  const n=Number(page);
  if(!/^[1-9]\d*$/.test(page)||n>20000||(pageCount&&n>pageCount)||
   !Array.isArray(lines)||lines.length>INK_MAX_STROKES)return null;
  clean[page]=[];
  for(const line of lines){
   total++;
   if(total>INK_MAX_STROKES||!line||typeof line!=='object'||Array.isArray(line)||
    !['pen','highlighter'].includes(line.tool)||typeof line.color!=='string'||
    !/^#[0-9a-f]{6}$/i.test(line.color)||!Number.isFinite(line.width)||
    line.width<1||line.width>40||!Array.isArray(line.points)||
    line.points.length===0||line.points.length>30000)return null;
   const curve=[];
   for(const p of line.points){
    if(!Array.isArray(p)||(p.length!==2&&p.length!==3)||
     !p.every(v=>Number.isFinite(v)&&v>=0&&v<=1))return null;
    curve.push([p[0],p[1],p.length===3?Math.max(.05,p[2]):.5]);
   }
   points+=curve.length;if(points>INK_MAX_POINTS)return null;
   clean[page].push({color:line.color,tool:line.tool,width:line.width,points:curve});
  }
 }
 return {documentKey:data.documentKey,annotations:clean,pages:pages.length,strokes:total,
  pdfHash:typeof data.pdfHash==='string'&&/^[0-9a-f]{64}$/.test(data.pdfHash)?data.pdfHash:''};
}
async function pdfFingerprint(bytes){
 if(!bytes?.length||!window.crypto?.subtle)return '';
 const digest=await window.crypto.subtle.digest('SHA-256',bytes);
 return Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');
}

async function selectFileInkIdentity(s,bytes,token){
 if(!s.file)return true;
 const oldKey=annotationId(s);
 s.legacyKey=oldKey;
 alertStatus(s,'PDF 내용 지문(SHA-256)과 필기 보관함을 확인하는 중입니다.');
 let digest='';
 try{digest=await pdfFingerprint(bytes)}catch{digest=''}
 if(token!==s.documentToken||!s.host?.isConnected)return false;
 if(!/^[a-f0-9]{64}$/.test(digest)){
  s.documentFingerprint='';
  s.annotationKey=ANNOTATION_PREFIX+s.year+':unverified-session';
  s.loadedInkRaw=null;s.annotations=Object.create(null);s.redo=Object.create(null);
  s.inkIssue='이 브라우저에서 PDF SHA-256을 확인할 수 없어 파일별 필기 자동 저장을 중단했습니다. 필기 JSON/PDF로 수동 백업하세요.';
  alertStatus(s,s.inkIssue);return true;
 }
 const key=ANNOTATION_PREFIX+'v118:'+s.year+':sha256:'+digest;
 s.documentFingerprint=digest;
 restore(s,key);
 if(s.loadedInkRaw!==null){
  if(s.inkIssue)alertStatus(s,s.inkIssue);
  return true;
 }
 // An older version used file name+size alone. Never silently bind that ink to a new PDF.
 let oldRaw=null;
 try{oldRaw=localStorage.getItem(oldKey)}
 catch{alertStatus(s,'이전 방식 필기를 읽지 못했습니다. 기존 저장소를 변경하지 않았습니다.');return true}
 if(oldRaw===null)return true;
 const legacy={year:s.year,file:s.file};
 restore(legacy,oldKey);
 if(legacy.inkIssue){
  s.legacyReadIssue=legacy.inkIssue;
  alertStatus(s,'이전 방식의 필기가 있지만 안전 검사를 통과하지 못했습니다. 기존 키의 원본은 유지됩니다.');
  return true;
 }
 const count=Object.values(legacy.annotations).reduce((n,lines)=>n+lines.length,0);
 if(count===0)return true;
 if(!window.confirm?.('이 PDF와 이름·크기가 같은 이전 버전 필기 '+count+'획을 발견했습니다.\n'
   +'동일한 이름·크기의 다른 PDF 필기일 수도 있습니다. 지금 열린 PDF의 필기임을 직접 확인했을 때만 "확인"을 선택하세요.\n'
   +'기존 저장본은 삭제하지 않습니다. 다른 파일이면 취소를 선택하세요.'))return true;
 if(token!==s.documentToken||!s.host?.isConnected)return false;
 try{
  if(localStorage.getItem(key)!==null||localStorage.getItem(oldKey)!==oldRaw){
   alertStatus(s,'필기 이관 중 다른 탭 변경이 감지됐습니다. 원본을 유지했습니다.');return true;
  }
  localStorage.setItem(key,JSON.stringify(legacy.annotations));
  restore(s,key);
  s.migratedLegacy=true;
  alertStatus(s,'이전 필기 '+count+'획을 현재 PDF 내용 지문으로 별도 복사했습니다. 이전 저장본은 그대로 유지했습니다.');
 }catch{
  s.inkIssue='기존 필기를 새 보관함에 복사하지 못했습니다. 이전 저장본을 유지하고 자동 저장을 차단했습니다.';
  alertStatus(s,s.inkIssue);
 }
 return true;
}
async function renderOcrPage(pageNo){
 const root=session;
 if(!root?.pdf||!root.host?.isConnected)throw Error('먼저 PDF 원문을 여세요.');
 const num=Number(pageNo);
 if(!Number.isInteger(num)||num<1||num>root.pdf.numPages)throw Error('OCR 페이지 번호가 올바르지 않습니다.');
 const stamp=root.documentToken,documentRef=root.pdf;
 const page=await documentRef.getPage(num);
 if(root!==session||stamp!==root.documentToken||!root.host?.isConnected)throw Error('PDF 문서가 변경됐습니다.');
 const view=page.getViewport({scale:1});
 const factor=Math.max(.1,Math.min(2,1600/Math.max(1,view.width),2000/Math.max(1,view.height),
  Math.sqrt(3000000/Math.max(1,view.width*view.height))));
 const viewport=page.getViewport({scale:factor});
 const canvas=document.createElement('canvas');
 canvas.width=Math.max(1,Math.round(viewport.width));
 canvas.height=Math.max(1,Math.round(viewport.height));
 const context=canvas.getContext('2d');
 if(!context)throw Error('OCR 이미지 캔버스를 만들지 못했습니다.');
 const job=page.render({canvasContext:context,viewport});
 try{await job.promise}catch(err){
  if(err?.name==='RenderingCancelledException')throw Error('OCR 렌더링이 취소됐습니다.');
  throw err;
 }
 if(root!==session||stamp!==root.documentToken||!root.host?.isConnected)throw Error('OCR 중 문서가 변경됐습니다.');
 return {canvas,page:num,year:root.year,documentKey:root.annotationKey};
}

function backupDamagedInk(root){
 if(!root?.inkIssue)return false;
 try{
  const text=root.loadedInkRaw!==null?root.loadedInkRaw:
   (root.legacyReadIssue&&root.legacyKey?localStorage.getItem(root.legacyKey):null);
  if(text===null)throw Error('보존할 원본이 없습니다.');
  downloadBlob(new Blob([text],{type:'application/json;charset=utf-8'}),
   'ConceptKnot-'+root.year+'-PDF-손상원본-수정금지.json');
  root.damagedExportRequested=true;
  alertStatus(root,'기존 필기 원본 다운로드를 요청했습니다. 파일이 실제로 저장됐는지 확인하고 복원을 진행하세요.');
  return true;
 }catch(e){alertStatus(root,'기존 필기 원본 보존 오류: '+(e.message||e));return false}
}
async function backupInk(s){
 const root=s.parent||s;
 if(!root?.pdf)return false;
 finishInput(root);
 if(root.second)finishInput(root.second);
 try{
  const data={format:INK_BACKUP_FORMAT,version:1,documentKey:root.annotationKey,
   year:root.year,pdfHash:root.documentFingerprint||await pdfFingerprint(root.bytes),exportedAt:new Date().toISOString(),
   annotations:root.annotations};
  if(session!==root)throw Error('백업 중 PDF 화면이 변경됐습니다.');
  const text=JSON.stringify(data);
  if(text.length>INK_BACKUP_LIMIT)throw Error('필기 JSON이 12MB를 초과합니다. 필기 PDF 저장을 사용하세요.');
  downloadBlob(new Blob([text],{type:'application/json;charset=utf-8'}),
   'ConceptKnot-'+root.year+'-PDF-필기-'+(root.file?'내파일':'기출')+'.json');
  root.inkBackedUp=true;
  alertStatus(root,'PDF 필기 JSON 다운로드를 요청했습니다. 다운로드 파일이 저장됐는지 확인하세요. 전체 학습 백업과 별개입니다.');
  return true;
 }catch(e){alertStatus(root,'필기 JSON 백업 오류: '+(e.message||e));return false}
}
async function restoreInkFile(s,file){
 const root=s.parent||s;
 if(!root?.pdf||!file)return false;
 if(file.size>INK_BACKUP_LIMIT){alertStatus(root,'필기 JSON은 12MB 이하여야 합니다.');return false}
 try{
  if(root.inkDirty&&!root.inkBackedUp)
   throw Error('저장되지 않은 현재 필기를 먼저 JSON/PDF로 백업하세요');
  if(root.inkIssue&&!root.damagedExportRequested)
   throw Error('손상된 필기 원본을 먼저 JSON 파일로 다운로드하세요');
  const text=await file.text();
  if(text.length>INK_BACKUP_LIMIT)throw Error('파일 크기 제한 초과');
  const loaded=validateInkBackup(JSON.parse(text),root.pdf.numPages);
  if(!loaded)throw Error('지원하지 않는 필기 JSON 구조 또는 잘못된 좌표');
  const current=root.documentFingerprint||await pdfFingerprint(root.bytes);
  const matchedKey=loaded.documentKey===root.annotationKey;
  const legacyVerified=!!root.file&&loaded.documentKey===root.legacyKey&&
   !!current&&loaded.pdfHash===current;
  if(!matchedKey&&!legacyVerified)
   throw Error('원본 PDF 또는 저장 키가 일치하지 않습니다. 이전 방식 필기는 SHA-256 일치 확인이 필요합니다');
  if(loaded.pdfHash&&(!current||current!==loaded.pdfHash))
   throw Error('원본 PDF의 SHA-256을 확인할 수 없거나 일치하지 않습니다');
  if(root.file&&!current)throw Error('내용 지문을 확인할 수 없는 PDF는 안전 복원할 수 없습니다');
  if(session!==root||!root.host?.isConnected)throw Error('파일 검사 중 PDF 화면이 변경됐습니다');
  if(localStorage.getItem(root.annotationKey)!==root.loadedInkRaw)
   throw Error('다른 탭에서 PDF 필기가 수정되어 복원을 중단했습니다');
  const existing=Object.values(root.annotations).reduce((sum,lines)=>sum+lines.length,0);
  const warning=(root.inkIssue?'기존 PDF 필기 기록에 읽기 오류가 있습니다. 먼저 손상원본을 보존하세요. ':'')+
   '이 PDF의 필기 '+existing+'획을 백업 파일 '+loaded.strokes+'획으로 교체할까요? 기존 원본은 자동으로 합쳐지지 않습니다.';
  if(!window.confirm?.(warning))return false;
  const raw=JSON.stringify(loaded.annotations);
  localStorage.setItem(root.annotationKey,raw);
  root.annotations=loaded.annotations;
  if(root.second)root.second.annotations=root.annotations;
  root.loadedInkRaw=raw;root.inkIssue='';root.inkDirty=false;root.inkBackedUp=false;
  const recoverButton=root.host?.querySelector?.('[data-ck117-ink-raw]');
  if(recoverButton)recoverButton.hidden=true;
  root.redo=Object.create(null);
  if(root.second)root.second.redo=Object.create(null);
  redrawInk(root);if(root.second)redrawInk(root.second);
  alertStatus(root,'필기 '+loaded.strokes+'획을 로컬 복원했습니다. 원본 PDF 파일은 수정하지 않았습니다.');
  return true;
 }catch(e){alertStatus(root,'필기 JSON 복원 실패: '+(e.message||e)+'. 현재 기록을 유지했습니다.');return false}
}
async function extractVisibleText(s){
 const root=s.parent||s;
 if(!root?.pdf)return false;
 const pageNums=[root.page];
 if(root.spread&&root.page<root.pdf.numPages)pageNums.push(root.page+1);
 try{
  const lines=['ConceptKnot PDF 선택 텍스트 추출','선택 가능한 문자 레이어에서 추출한 초안이며 OCR·원문 검증·정답 검수 완료가 아닙니다.'];
  let total=0;
  for(const no of pageNums){
   const page=await root.pdf.getPage(no),content=await page.getTextContent();
   if(session!==root||!root.host?.isConnected)throw Error('텍스트 추출 중 문서가 변경됐습니다');
   const parts=content.items.filter(x=>typeof x.str==='string');
   const text=parts.map(x=>x.str+(x.hasEOL?'\n':' ')).join('').trim();
   lines.push('','[원본 PDF '+no+'쪽]',text||'(추출 가능한 텍스트 없음: 이미지 스캔 PDF는 OCR이 필요합니다)');
   total+=text.length;
   if(total>250000)throw Error('현재 페이지의 텍스트가 25만 글자를 초과합니다');
  }
  if(total===0){alertStatus(root,'이 페이지에는 선택 가능한 PDF 텍스트가 없습니다. 스캔 이미지 OCR은 별도 작업이 필요합니다.');return false}
  downloadBlob(new Blob(['\uFEFF'+lines.join('\n')],{type:'text/plain;charset=utf-8'}),
   'ConceptKnot-'+root.year+'-PDF-텍스트-'+pageNums.join('-')+'.txt');
  alertStatus(root,'PDF '+pageNums.join('·')+'쪽의 선택형 텍스트 TXT 다운로드를 요청했습니다. 공식 문항 데이터에는 반영하지 않았습니다.');
  return true;
 }catch(e){alertStatus(root,'PDF 텍스트 추출 실패: '+(e?.message||e));return false}
}
function canLeavePdf(){
 if(!session?.host?.isConnected)return true;
 finishInput(session);
 if(session.second)finishInput(session.second);
 if(session.inkDirty&&!session.inkBackedUp){
  alertStatus(session,'저장 실패 필기가 있습니다. 먼저 필기 JSON 백업 또는 PDF 저장을 진행하세요.');
  return false;
 }
 return true;
}
function mountInkTools(s){
 if(s.parent||s.host.querySelector('[data-ck117-pdf-tools]'))return;
 if(!document.querySelector('link[data-ck117-pdf-style]')){
  const link=document.createElement('link');
  link.rel='stylesheet';link.href='./assets/ck-pdf-tools-v117.css';
  link.dataset.ck117PdfStyle='1';document.head.appendChild(link);
 }
 const row=document.createElement('div');row.className='ck117-pdf-tools';row.setAttribute('data-ck117-pdf-tools','');
 row.innerHTML='<button type="button" data-ck117-ink-save>필기 JSON 백업</button>'+
  '<button type="button" data-ck117-ink-load>필기 JSON 복원</button>'+
  '<button type="button" data-ck117-ink-raw>손상원본 보존</button>'+
  '<button type="button" data-ck117-text>현재 PDF 문자 추출</button>'+
  '<input type="file" data-ck117-ink-file accept=".json,application/json" hidden aria-label="필기 백업 JSON 선택">'+
  '<small>필기 JSON은 학습기록 백업과 별도 · 문자 추출은 OCR 아님</small>';
 const save=s.host.querySelector('[data-ck15-save]');
 (save?.parentNode||s.host).appendChild(row);
 const raw=row.querySelector('[data-ck117-ink-raw]');
 if(raw)raw.hidden=!s.inkIssue;
}

async function act(s,button){
 const action=button.dataset;
 if('ck117InkSave' in action){await backupInk(s);return}
 if('ck117InkLoad' in action){s.host.querySelector('[data-ck117-ink-file]')?.click();return}
 if('ck117InkRaw' in action){backupDamagedInk(s);return}
 if('ck117Text' in action){await extractVisibleText(s);return}
 if('ck17Spread'in action){
  finishInput(s);
  if(s.second)finishInput(s.second);
  if(s.inkDirty&&!s.inkBackedUp){
   alertStatus(s,'저장되지 않은 필기가 있습니다. 필기 JSON/PDF 백업 후 펼쳐보기를 변경하세요.');
   return;
  }
  s.spread=!s.spread;
  button.setAttribute('aria-pressed',String(s.spread));
  button.setAttribute('aria-label',s.spread?'PDF 한 페이지씩 보기':'PDF 두 페이지 나란히 보기');
  button.title=s.spread?'한 페이지 보기':'두 페이지 펼쳐보기';
  try{localStorage.setItem('ck17-pdf-spread',String(s.spread))}catch(e){}
  if(!s.pdf){alertStatus(s,'설정이 저장되었습니다. 원문 PDF 로딩 후 자동 적용됩니다.');return}
  s.zoom=1;await goPage(s,s.page);return;
 }
 if('ck15Spen'in action){
  if(s.penMode)endPenSession(s);
  else setPenMode(s,true);
  return;
 }
 if(!s.pdf){alertStatus(s,'PDF 로딩 중이거나 읽기에 실패했습니다. 원문 상태를 확인하세요.');return}
 if(action.ck15Tool){updateTool(s,action.ck15Tool);return}
 if('ck15Zoom'in action){applyZoom(s,s.zoom+(Number(action.ck15Zoom)>0?.2:-.2));return}
 if('ck15Fit'in action){applyZoom(s,1);return}
 if('ck15Prev'in action){goPage(s,s.page-(s.spread?2:1));return}
 if('ck15Next'in action){goPage(s,s.page+(s.spread?2:1));return}
 if('ck15Undo'in action){undo(s.activePage?.host?.isConnected?s.activePage:s);return}
 if('ck15Redo'in action){redo(s.activePage?.host?.isConnected?s.activePage:s);return}
 if('ck15Save'in action){
  button.disabled=true;alertStatus(s,'필기 PDF 파일을 만드는 중…');
  try{await exportPdf(s);alertStatus(s,'필기 PDF를 저장했습니다.')}
  catch(err){alertStatus(s,'PDF 저장 오류: '+err.message+' (온라인 모듈 연결이 필요할 수 있습니다.)')}
  finally{button.disabled=false}
 }
}
function bind(s){
 const host=s.host,ink=els(host,'[data-ck15-ink-canvas]'),scroller=els(host,'[data-ck15-scroll]');
 const save=els(host,'[data-ck15-save]');if(save){save.textContent='PDF 저장';save.setAttribute('aria-label','필기 PDF 저장');}
 const eraser=els(host,'[data-ck15-tool=eraser]');if(eraser)eraser.title='누른 채 드래그하여 지우기';
 if(!ink||!scroller)return;
 if(!s.parent){mountInkTools(s);
  const oldZoom=els(host,'output[data-ck15-zoom-value]'),oldPage=els(host,'output[data-ck15-page-label]');
  if(oldZoom)oldZoom.outerHTML='<label class="ck42-pdf-number"><input data-ck15-zoom-value aria-label="PDF 배율 직접 입력" inputmode="decimal" value="100" size="4">%</label>';
  if(oldPage)oldPage.outerHTML='<label class="ck42-pdf-number"><input data-ck15-page-label aria-label="PDF 페이지 직접 입력" inputmode="numeric" value="1" size="3"><span data-ck42-page-total> / —</span></label>';
  const zoom=els(host,'[data-ck15-zoom-value]'),page=els(host,'[data-ck15-page-label]');
  for(const input of [zoom,page])if(input){
   input.addEventListener('focus',()=>input.select());
   input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();e.stopPropagation();const value=Number(input.value.replace('%','').trim());if(Number.isFinite(value)&&value>0){if(input===zoom)applyZoom(s,value/100);else goPage(s,value);}input.blur();pageMetrics(s);}else if(e.key==='Escape'){input.blur();pageMetrics(s);}});
   input.addEventListener('blur',()=>pageMetrics(s));
  }
 }
 ink.addEventListener('contextmenu',e=>{if(s.penMode||e.pointerType==='pen')e.preventDefault()});
 ink.addEventListener('pointerdown',e=>onPointerDown(s,e));
 ink.addEventListener('pointermove',e=>onPointerMove(s,e));
 for(const ev of ['pointerup','pointercancel','lostpointercapture'])ink.addEventListener(ev,e=>onPointerUp(s,e));
 ink.addEventListener('dblclick',e=>{
  if(s.penMode||s.lastZoomGestureMoved||e.pointerType==='pen')return;
  e.preventDefault();applyZoom(s,s.zoom*1.25,e.clientX,e.clientY);
 });
 if(!s.parent){scroller.addEventListener('wheel',e=>{
  if(!e.ctrlKey&&!e.metaKey)return;
  e.preventDefault();applyZoom(s,s.zoom*(e.deltaY>0?.88:1.12),e.clientX,e.clientY);
 },{passive:false});
 scroller.addEventListener('keydown',e=>{
  if(e.target!==scroller)return;
  if(e.key==='PageDown'||e.key==='PageUp'){
   e.preventDefault();goPage(s.parent||s,(s.parent||s).page+(e.key==='PageDown'?1:-1)*((s.parent||s).spread?2:1));
  }else if(e.key==='+'||e.key==='='){e.preventDefault();applyZoom(s,s.zoom+.2)}
  else if(e.key==='-'){e.preventDefault();applyZoom(s,s.zoom-.2)}
 });
 }
 host.addEventListener('click',e=>{
  const button=e.target.closest('button[data-ck15-spen],button[data-ck15-tool],button[data-ck15-zoom],button[data-ck15-fit],button[data-ck15-prev],button[data-ck15-next],button[data-ck15-undo],button[data-ck15-redo],button[data-ck15-save],button[data-ck17-spread],button[data-ck117-ink-save],button[data-ck117-ink-load],button[data-ck117-ink-raw],button[data-ck117-text]');
  if(!button)return;e.preventDefault();act(s,button);
 });
 host.addEventListener('change',e=>{
  if(!e.target.matches?.('[data-ck117-ink-file]'))return;
  const file=e.target.files?.[0];
  e.target.value='';
  if(file)restoreInkFile(s,file);
 });
 host.addEventListener('input',e=>{
  if(e.target.matches('[data-ck15-width]')){s.width=clamp(Number(e.target.value)||2.8,1,13);if(s.second)s.second.width=s.width;}
  if(e.target.matches('[data-ck15-color]')){s.color=e.target.value;if(s.second)s.second.color=s.color;}
 });
 if(!s.parent&&typeof ResizeObserver==='function'){
  const resize=new ResizeObserver(()=>{if(s.host?.isConnected&&s.pdf&&s.zoom===1){
   s.baseViewport=null;s.paintToken++;schedulePaint(s,180);
  }});
  resize.observe(scroller);
  s.resizeObserver=resize;
 }
 setPenMode(s,false);
 updateTool(s,s.tool);
 const spread=els(host,'[data-ck17-spread]');if(spread){spread.setAttribute('aria-pressed',String(!!s.spread));spread.setAttribute('aria-label',s.spread?'PDF 한 페이지씩 보기':'PDF 두 페이지 나란히 보기')}
}
function attach(){
 attachFrame=0;
 const host=document.querySelector('.ck15-pdf-host');
 if(!host){if(session){endPenSession(session);session.resizeObserver?.disconnect();clearTimeout(session.paintTimer);session.paintToken++;session.host=null;}return}
 if(session?.host===host)return;
 const source=host.dataset.ck15PdfSource,year=Number(host.dataset.ck15PdfYear)||2025;
 const file=pendingYear===year?pendingFile:null;
 const id=file?year+':file:'+file.name+':'+file.size:year+':'+source;
 if(session&&session.id===id&&session.pdf&&session.file===file){
  session.resizeObserver?.disconnect();
  releaseSecond(session);
  endPenSession(session);session.host=host;session.paintToken++;session.baseViewport=null;
  bind(session);paintPdf(session);return;
 }
 if(session){
  endPenSession(session);
  session.documentToken++;session.paintToken++;
  releaseSecond(session);
  if(session.renderTask){try{session.renderTask.cancel()}catch(err){}}
  session.resizeObserver?.disconnect();
  session.loadingTask?.destroy?.().catch?.(()=>{});
 }
 const s={
  penMode:false,strokePointer:null,
  id,source,year,file,host,tool:'hand',color:'#e75b65',width:2.8,
  page:1,zoom:1,paintToken:0,documentToken:0,baseViewport:null,
  annotations:Object.create(null),redo:Object.create(null),
  touchPoints:new Map(),gesture:null,pinch:null,activeStroke:null,pdf:null,bytes:null,renderTask:null
 };
 try{s.spread=localStorage.getItem('ck17-pdf-spread')==='true'}catch(e){s.spread=false}
 session=s;
 if(!file)restore(s);
 else{
  s.annotationKey=annotationId(s);s.legacyKey=s.annotationKey;s.documentFingerprint='';
  s.loadedInkRaw=null;s.inkIssue='';s.inkDirty=false;s.inkBackedUp=false;
 }
 bind(s);loadDocument(s);
}
function scheduleAttach(){
 if(attachFrame)return;
 attachFrame=requestAnimationFrame(attach);
}
document.addEventListener('change',e=>{
 if(e.target.id!=='pdf-upload'||!e.target.files?.[0])return;
 // Capture runs before the inline study engine's bubble listener.
 // Never replace an unsaved ink session with a new local PDF.
 if(session&&session.inkDirty&&!session.inkBackedUp){
  e.preventDefault();e.stopImmediatePropagation();e.target.value='';
  alertStatus(session,'저장되지 않은 PDF 필기가 있어 파일 변경을 차단했습니다. 필기 JSON/PDF를 먼저 백업하세요.');
  return;
 }
 const file=e.target.files[0];
 if(file.type!=='application/pdf'&&!/\.pdf$/i.test(file.name))return;
 pendingFile=file;
 pendingYear=Number(document.querySelector('.ck15-pdf-host')?.dataset.ck15PdfYear||2025);
 // The existing study engine re-renders the PDF panel after the file input changes.
 requestAnimationFrame(scheduleAttach);
},true);
window.addEventListener('storage',event=>{
 if(session&&event.key===session.annotationKey&&event.newValue!==session.loadedInkRaw){
  session.inkIssue='다른 탭에서 PDF 필기 기록이 변경되었습니다. 자동 덮어쓰기를 차단했습니다.';
  const rawButton=session.host?.querySelector?.('[data-ck117-ink-raw]');
  if(rawButton)rawButton.hidden=false;
  alertStatus(session,session.inkIssue);
 }
});
window.addEventListener('beforeunload',event=>{
 if(session?.inkDirty&&!session.inkBackedUp){
  event.preventDefault();event.returnValue='';
 }
});
window.addEventListener('ck:pen-deactivate',()=>endPenSession(session));
window.addEventListener('blur',()=>endPenSession(session));
document.addEventListener('visibilitychange',()=>{if(document.hidden)endPenSession(session)});
document.addEventListener('keydown',e=>{if(e.key==='Escape')endPenSession(session)});
document.addEventListener('pointerdown',e=>{
 if(session?.host&&!session.host.contains(e.target))endPenSession(session);
},true);
function boot(){
 const main=document.getElementById('main');
 if(!main)return;
 new MutationObserver(records=>{
  if(records.some(r=>r.target===main))scheduleAttach();
 }).observe(main,{childList:true});
 scheduleAttach();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
window.CKPDF15=Object.freeze({
 canLeave:canLeavePdf,validateInkBackup,renderOcrPage,
 exportInk:()=>session&&backupInk(session),
 extractText:()=>session&&extractVisibleText(session),
 getState:()=>session?{year:session.year,page:session.page,pages:session.pdf?.numPages||0,zoom:session.zoom,spread:!!session.spread,tool:session.tool,annotationCount:Object.values(session.annotations).reduce((n,lines)=>n+lines.length,0),inkDirty:!!session.inkDirty,inkBackedUp:!!session.inkBackedUp,inkIssue:session.inkIssue||'',documentKey:session.annotationKey||'',fingerprintVerified:!!session.documentFingerprint,migratedLegacy:!!session.migratedLegacy}:null,
 zoom:(scale)=>session&&applyZoom(session,scale),
 page:(page)=>session&&goPage(session,page)
});
})();
