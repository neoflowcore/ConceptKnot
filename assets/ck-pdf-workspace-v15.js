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
function restore(s){
 s.annotationKey=annotationId(s);
 let data=null;
 try{data=JSON.parse(localStorage.getItem(s.annotationKey)||'null')}catch(e){}
 s.annotations=Object.create(null);
 if(data&&typeof data==='object'){
  for(const [page,strokes] of Object.entries(data)){
   if(!/^\d+$/.test(page)||!Array.isArray(strokes))continue;
   s.annotations[page]=strokes.filter(x=>Array.isArray(x?.points)&&x.points.length>0&&x.points.length<30000&&/^#[0-9a-f]{6}$/i.test(x.color)&&Number.isFinite(x.width)).map(x=>({
    color:x.color,width:clamp(x.width,1,20),points:x.points.filter(p=>Array.isArray(p)&&p.length>=2&&Number.isFinite(p[0])&&Number.isFinite(p[1])).map(p=>[clamp(p[0],0,1),clamp(p[1],0,1),clamp(Number(p[2])||.5,.05,1)])
   }));
  }
 }
 s.redo=Object.create(null);
}
function persist(s){
 try{localStorage.setItem(s.annotationKey,JSON.stringify(s.annotations));return true}
 catch(err){alertStatus(s,'필기 저장 공간이 부족합니다. 필기 PDF를 먼저 저장하고 브라우저 공간을 확보하세요.');return false}
}
function strokes(s){const k=String(s.page);return s.annotations[k]||(s.annotations[k]=[])}
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
 for(const ink of draw){
  const points=ink.points;if(!points?.length)continue;
  ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=ink.color;ctx.fillStyle=ink.color;
  ctx.lineWidth=ink.width*s.zoom;
  ctx.beginPath();
  points.forEach((p,i)=>{
   const x=p[0]*width,y=p[1]*height;
   if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
  });
  if(points.length===1){const p=points[0];ctx.arc(p[0]*width,p[1]*height,Math.max(1,ink.width*s.zoom)/2,0,2*Math.PI);ctx.fill()}
  else ctx.stroke();
 }
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
 if(!s.pdf)return;
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
  s.pdf=doc;s.page=Math.min(s.page,doc.numPages);s.baseViewport=null;
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
 s.erasePoint=point;if(changed){s.eraseDirty=true;s.redo[String(s.page)]=[];redrawInk(s);}
}
function onPointerDown(s,event){
 if(!s.pdf||(event.button!==0&&!(event.pointerType==='pen'&&event.button===5))||!s.host.isConnected)return;
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
 }else if(s.tool==='eraser'||event.pointerType==='pen'&&event.button===5){
  s.erasing=event.pointerId;s.erasePoint=null;eraseAt(s,event);
 }else if(event.detail>=2||(s.tool==='hand'&&s.lastTap&&performance.now()-s.lastTap.time<360&&Math.hypot(event.clientX-s.lastTap.x,event.clientY-s.lastTap.y)<12)){
  s.gesture={type:'zoom',x:event.clientX,y:event.clientY,initial:(s.parent||s).zoom,moved:false};
 }else if(s.tool==='pen'||event.pointerType==='pen'){
  s.activeStroke={color:s.color,width:s.width,points:[pointerPoint(s,event)]};
 }else{
  s.gesture={type:'pan',x:event.clientX,y:event.clientY,left:scroller.scrollLeft,top:scroller.scrollTop};
 }
 try{ink.setPointerCapture(event.pointerId)}catch(e){}
 event.preventDefault();
}
function onPointerMove(s,event){
 if(!s.pdf||!s.host.isConnected)return;
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
 if(s.erasing===event.pointerId){eraseAt(s,event);event.preventDefault();return;}
 if(s.activeStroke){
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
 if(event.type==='pointerup')s.lastZoomGestureMoved=s.gesture?.type==='zoom'&&!!s.gesture.moved;
 if(event.type==='pointerup'&&!s.gesture?.moved)s.lastTap={time:performance.now(),x:event.clientX,y:event.clientY};
 if(s.erasing===event.pointerId){s.erasing=null;s.erasePoint=null;if(s.eraseDirty){persist(s);s.eraseDirty=false;alertStatus(s,'드래그한 영역의 필기를 지웠습니다.');}}
 const ink=els(s.host,'[data-ck15-ink-canvas]');
 try{if(ink?.hasPointerCapture(event.pointerId))ink.releasePointerCapture(event.pointerId)}catch(e){}
 if(s.touchPoints.has(event.pointerId))s.touchPoints.delete(event.pointerId);
 if(s.touchPoints.size<2)s.pinch=null;
 if(s.activeStroke){
  if(s.activeStroke.points.length){
   strokes(s).push(s.activeStroke);
   s.redo[String(s.page)]=[];
   persist(s);
  }
  s.activeStroke=null;redrawInk(s);
 }
 s.gesture=null;
}
function updateTool(s,tool){
 s.tool=tool;
 if(s.second)updateTool(s.second,tool);
 s.host.querySelectorAll('[data-ck15-tool]').forEach(btn=>btn.setAttribute('aria-pressed',String(btn.dataset.ck15Tool===tool)));
 const ink=els(s.host,'[data-ck15-ink-canvas]');
 if(ink)ink.style.cursor=tool==='hand'?'grab':tool==='eraser'?'cell':'crosshair';
}
function undo(s){
 const list=strokes(s);if(!list.length)return;
 (s.redo[String(s.page)]||(s.redo[String(s.page)]=[])).push(list.pop());persist(s);redrawInk(s);
}
function redo(s){
 const undoStack=s.redo[String(s.page)]||[];
 if(!undoStack.length)return;strokes(s).push(undoStack.pop());persist(s);redrawInk(s);
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
 for(const stroke of s.annotations[String(pageNo)]||[]){
  if(!stroke.points.length)continue;
  ctx.beginPath();ctx.strokeStyle=stroke.color;ctx.fillStyle=stroke.color;ctx.lineWidth=stroke.width*(width/(s.baseViewport?.width||650));
  ctx.lineCap='round';ctx.lineJoin='round';
  stroke.points.forEach((p,i)=>{
   const x=p[0]*canvas.width,y=p[1]*canvas.height;
   if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
  });
  if(stroke.points.length===1){const p=stroke.points[0];ctx.arc(p[0]*width,p[1]*height,Math.max(1,ctx.lineWidth)/2,0,2*Math.PI);ctx.fill()}
  else ctx.stroke();
 }
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
}
async function act(s,button){
 const action=button.dataset;
 if('ck17Spread'in action){
  s.spread=!s.spread;
  button.setAttribute('aria-pressed',String(s.spread));
  button.setAttribute('aria-label',s.spread?'PDF 한 페이지씩 보기':'PDF 두 페이지 나란히 보기');
  button.title=s.spread?'한 페이지 보기':'두 페이지 펼쳐보기';
  try{localStorage.setItem('ck17-pdf-spread',String(s.spread))}catch(e){}
  if(!s.pdf){alertStatus(s,'설정이 저장되었습니다. 원문 PDF 로딩 후 자동 적용됩니다.');return}
  s.zoom=1;await goPage(s,s.page);return;
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
 if(!s.parent){
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
 ink.addEventListener('pointerdown',e=>onPointerDown(s,e));
 ink.addEventListener('pointermove',e=>onPointerMove(s,e));
 for(const ev of ['pointerup','pointercancel','lostpointercapture'])ink.addEventListener(ev,e=>onPointerUp(s,e));
 ink.addEventListener('dblclick',e=>{
  if(s.lastZoomGestureMoved)return;
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
  const button=e.target.closest('button[data-ck15-tool],button[data-ck15-zoom],button[data-ck15-fit],button[data-ck15-prev],button[data-ck15-next],button[data-ck15-undo],button[data-ck15-redo],button[data-ck15-save],button[data-ck17-spread]');
  if(!button)return;e.preventDefault();act(s,button);
 });
 host.addEventListener('input',e=>{
  if(e.target.matches('[data-ck15-color]')){s.color=e.target.value;if(s.second)s.second.color=s.color;}
 });
 if(!s.parent&&typeof ResizeObserver==='function'){
  const resize=new ResizeObserver(()=>{if(s.host?.isConnected&&s.pdf&&s.zoom===1){
   s.baseViewport=null;s.paintToken++;schedulePaint(s,180);
  }});
  resize.observe(scroller);
  s.resizeObserver=resize;
 }
 updateTool(s,s.tool);
 const spread=els(host,'[data-ck17-spread]');if(spread){spread.setAttribute('aria-pressed',String(!!s.spread));spread.setAttribute('aria-label',s.spread?'PDF 한 페이지씩 보기':'PDF 두 페이지 나란히 보기')}
}
function attach(){
 attachFrame=0;
 const host=document.querySelector('.ck15-pdf-host');
 if(!host){if(session){session.resizeObserver?.disconnect();clearTimeout(session.paintTimer);session.paintToken++;session.host=null;}return}
 if(session?.host===host)return;
 const source=host.dataset.ck15PdfSource,year=Number(host.dataset.ck15PdfYear)||2025;
 const file=pendingYear===year?pendingFile:null;
 const id=file?year+':file:'+file.name+':'+file.size:year+':'+source;
 if(session&&session.id===id&&session.pdf){
  session.resizeObserver?.disconnect();
  releaseSecond(session);
  session.host=host;session.paintToken++;session.baseViewport=null;
  bind(session);paintPdf(session);return;
 }
 if(session){
  session.documentToken++;session.paintToken++;
  releaseSecond(session);
  if(session.renderTask){try{session.renderTask.cancel()}catch(err){}}
  session.resizeObserver?.disconnect();
  session.loadingTask?.destroy?.().catch?.(()=>{});
 }
 const s={
  id,source,year,file,host,tool:'hand',color:'#e75b65',width:2.8,
  page:1,zoom:1,paintToken:0,documentToken:0,baseViewport:null,
  annotations:Object.create(null),redo:Object.create(null),
  touchPoints:new Map(),gesture:null,pinch:null,activeStroke:null,pdf:null,bytes:null,renderTask:null
 };
 try{s.spread=localStorage.getItem('ck17-pdf-spread')==='true'}catch(e){s.spread=false}
 session=s;restore(s);bind(s);loadDocument(s);
}
function scheduleAttach(){
 if(attachFrame)return;
 attachFrame=requestAnimationFrame(attach);
}
document.addEventListener('change',e=>{
 if(e.target.id!=='pdf-upload'||!e.target.files?.[0])return;
 const file=e.target.files[0];
 if(file.type!=='application/pdf'&&!/\.pdf$/i.test(file.name))return;
 pendingFile=file;
 pendingYear=Number(document.querySelector('.ck15-pdf-host')?.dataset.ck15PdfYear||2025);
 // The existing study engine re-renders the PDF panel after the file input changes.
 requestAnimationFrame(scheduleAttach);
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
 getState:()=>session?{year:session.year,page:session.page,pages:session.pdf?.numPages||0,zoom:session.zoom,spread:!!session.spread,tool:session.tool,annotationCount:Object.values(session.annotations).reduce((n,lines)=>n+lines.length,0)}:null,
 zoom:(scale)=>session&&applyZoom(session,scale),
 page:(page)=>session&&goPage(session,page)
});
})();
