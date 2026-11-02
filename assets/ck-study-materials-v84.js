/* ConceptKnot v84 personal material notes with opt-in Korean OCR.
 * Extracted text is always UNREVIEWED, never written to official question/answer bank.
 * Local browser OCR; language/model packages are downloaded only after explicit click.
 */
(function(){
'use strict';
const KEY='ck84-personal-materials-v1',MAX_DOCS=35,MAX_TEXT=45000,MAX_TOTAL=600000;
const PDF_URL='https://cdn.jsdelivr.net/npm/pdfjs-dist@6.3.289/build/pdf.mjs';
const PDF_WORKER='https://cdn.jsdelivr.net/npm/pdfjs-dist@6.3.289/build/pdf.worker.mjs';
const OCR_URL='https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s??'').normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
const validId=id=>/^m[0-9a-z]{8,22}$/.test(String(id||''));
const kinds=new Set(['manual','txt','pdf-text','pdf-ocr','image-ocr']);
const validRef=x=>!x||/^20(?:1[6-9]|2[0-5])-(?:[1-9]|[1-7]\d|80)$/.test(String(x));
const official=()=>window.RECALL_OFFICIAL||{};
const empty=()=>({schemaVersion:1,scope:'personal-unpublished-materials',revision:0,documents:[]});
function sanitize(data){
 if(!data||data.schemaVersion!==1||data.scope!=='personal-unpublished-materials'||
  !Number.isInteger(data.revision)||data.revision<0||
  !Array.isArray(data.documents)||data.documents.length>MAX_DOCS)return null;
 let sum=0;const seen=new Set(),clean=empty();clean.revision=data.revision;
 for(const d of data.documents){
  if(!d||!validId(d.id)||seen.has(d.id)||typeof d.title!=='string'||!d.title.trim()||
   d.title.length>120||typeof d.text!=='string'||d.text.length>MAX_TEXT||
   typeof d.note!=='string'||d.note.length>1800||
   !kinds.has(d.kind)||!validRef(d.officialRef)||!Number.isInteger(d.pages)||
   d.pages<0||d.pages>5000)return null;
  seen.add(d.id);sum+=d.text.length+d.note.length;if(sum>MAX_TOTAL)return null;
  clean.documents.push({id:d.id,title:d.title,text:d.text,note:d.note,kind:d.kind,pages:d.pages,
   officialRef:d.officialRef||'',createdAt:Number(d.createdAt)||0,updatedAt:Number(d.updatedAt)||0});
 }
 return clean;
}
function read(){try{return sanitize(JSON.parse(localStorage.getItem(KEY)||'null'))||empty();}catch{return empty();}}
let store=read(),root=null,visible=false,working=false,cancel=false,sourceText='',sourceType='manual',
 sourcePages=0,currentId='',sourceTitle='',message='',query='',lastFile=null,queued=false;
const newId=()=>('m'+Date.now().toString(36)+Math.floor(Math.random()*1679616).toString(36).padStart(4,'0'));
function write(next){
 const checked=sanitize(next);if(!checked)return false;
 try{
  const latest=read();
  if(latest.revision!==store.revision){store=latest;note('다른 탭에서 자료가 변경되었습니다. 현재 편집 내용은 유지합니다. 복사 후 새로 확인해 주세요.');return false;}
  checked.revision=store.revision+1;
  localStorage.setItem(KEY,JSON.stringify(checked));store=checked;return true;
 }catch{note('저장 공간 부족 또는 브라우저 로컬 저장 권한 오류');return false;}
}
function note(t){message=t;const el=root?.querySelector('[data-ck84-mat-status]');if(el)el.textContent=t;}
function parseQuestions(value){
 const lines=String(value||'').split(/\r?\n/),out=[],warnings=[];
 let q=null,opt=-1,page=1;
 const qRx=/^\s*(?:제\s*)?([1-9]\d?|100)\s*[\.\)]\s*(\S.*)$/;
 const oRx=/^\s*(?:([①②③④⑤])|[\(\[]([1-5])[\)\]]|([1-5])\s*[\.\)])\s*(\S.*)$/;
 const marks=['①','②','③','④','⑤'];
 function flush(){
  if(!q)return;
  q.question=q.question.trim();q.options=q.options.map(v=>v.trim());
  q.complete=q.question.length>=6&&q.options.every(Boolean);
  if(!q.complete)warnings.push('문항 '+q.number+': 본문 또는 5개 선지 원문 확인 필요');
  out.push(q);q=null;opt=-1;
 }
 for(const input of lines){
  const s=input.trim();if(!s)continue;
  const pageTag=/^\[(?:PDF|OCR)\s+(\d{1,4})페이지\]$/.exec(s);
  if(pageTag){page=Number(pageTag[1]);continue;}
  const qm=qRx.exec(s);
  if(qm&&(!q||q.options.some(Boolean)||Number(qm[1])===1)){
   flush();if(out.length>=120){warnings.push('미리보기 120문항 제한');break;}
   q={number:Number(qm[1]),page,question:qm[2],options:['','','','',''],complete:false};continue;
  }
  if(!q)continue;
  const om=oRx.exec(s);
  if(om){
   const no=om[1]?marks.indexOf(om[1]):Number(om[2]||om[3])-1;
   if(no>=0&&no<=4){opt=no;q.options[no]+=(q.options[no]?' ':'')+om[4];continue;}
  }
  if(opt>=0)q.options[opt]+=' '+s;else q.question+=' '+s;
 }
 flush();
 const seen=new Set();
 for(const item of out){if(seen.has(item.number))warnings.push('문항 '+item.number+' 번호 중복 감지');seen.add(item.number);}
 return {questions:out,warnings,complete:out.filter(x=>x.complete).length};
}
function orderedText(items,width){
 const rows=(items||[]).filter(v=>typeof v.str==='string'&&v.str.trim()&&Array.isArray(v.transform))
  .map(x=>({x:Number(x.transform[4])||0,y:Number(x.transform[5])||0,text:x.str}));
 if(!rows.length)return '';
 const columns=[rows.filter(x=>x.x<=width/2),rows.filter(x=>x.x>width/2)];
 const result=[];
 for(const col of columns){
  col.sort((a,b)=>b.y-a.y||a.x-b.x);
  let prior=null;
  for(const x of col){if(prior===null||Math.abs(prior-x.y)>3)result.push('\n');result.push(x.text+' ');prior=x.y;}
  if(col.length)result.push('\n');
 }
 return result.join('').trim();
}
let pdfPromise=null,ocrPromise=null,ocrWorker=null;
function pdfjs(){
 if(!pdfPromise)pdfPromise=import(PDF_URL).then(lib=>{lib.GlobalWorkerOptions.workerSrc=PDF_WORKER;return lib;}).catch(e=>{pdfPromise=null;throw e;});
 return pdfPromise;
}
async function worker(){
 if(ocrWorker)return ocrWorker;
 if(!ocrPromise)ocrPromise=new Promise((resolve,reject)=>{
  if(window.Tesseract?.createWorker){resolve(window.Tesseract);return;}
  const tag=document.createElement('script');tag.src=OCR_URL;tag.async=true;tag.crossOrigin='anonymous';
  tag.onload=()=>window.Tesseract?.createWorker?resolve(window.Tesseract):reject(Error('OCR 엔진을 찾지 못했습니다.'));
  tag.onerror=()=>reject(Error('OCR 엔진 네트워크 다운로드 실패'));document.head.append(tag);
 }).finally(()=>{ocrPromise=null;});
 const t=await ocrPromise;
 ocrWorker=await t.createWorker('kor+eng',1,{logger:e=>{
  if(e?.status==='recognizing text'&&Number.isFinite(e.progress))note('OCR '+Math.round(e.progress*100)+'%');
 }});
 return ocrWorker;
}
async function endWorker(){const w=ocrWorker;ocrWorker=null;try{await w?.terminate?.();}catch{}}
async function extractPdf(file,ocr){
 const lib=await pdfjs(),input=await file.arrayBuffer();
 const task=lib.getDocument({data:new Uint8Array(input)}),pdf=await task.promise;
 let text='',processed=0;
 try{
  const count=Math.min(pdf.numPages,ocr?8:12);
  if(ocr)await worker();
  for(let i=1;i<=count;i++){
   if(cancel)throw Error('중단 요청으로 추출이 끝났습니다.');
   note((ocr?'OCR':'PDF 텍스트 추출')+' · '+i+'/'+count+'페이지');
   const page=await pdf.getPage(i);let part='';
   if(ocr){
    const viewport=page.getViewport({scale:1.3}),canvas=document.createElement('canvas');
    canvas.width=Math.round(viewport.width);canvas.height=Math.round(viewport.height);
    const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw Error('Canvas를 생성할 수 없습니다.');
    await page.render({canvasContext:ctx,viewport}).promise;
    const r=await ocrWorker.recognize(canvas);part=String(r?.data?.text||'');
    canvas.width=0;canvas.height=0;
   }else{
    const r=await page.getTextContent();
    part=orderedText(r.items,page.getViewport({scale:1}).width);
   }
   text+='\n['+(ocr?'OCR':'PDF')+' '+i+'페이지]\n'+part.trim()+'\n';
   if(text.length>=MAX_TEXT){text=text.slice(0,MAX_TEXT);break;}
   processed++;page.cleanup();
  }
  return {text,kind:ocr?'pdf-ocr':'pdf-text',pages:processed,totalPages:pdf.numPages};
 }finally{if(ocr)await endWorker();await pdf.destroy().catch(()=>{});}
}
async function extractImage(file){
 const w=await worker();
 try{note('이미지 내 한국어·영문 OCR 인식 중');const result=await w.recognize(file);
  return {text:String(result?.data?.text||'').slice(0,MAX_TEXT),kind:'image-ocr',pages:1,totalPages:1};
 }finally{await endWorker();}
}
async function extract(file,mode){
 if(!file||file.size>25*1024*1024){note('파일은 최대 25MB입니다.');return;}
 if(working){note('현재 파일이 처리 중입니다.');return;}
 working=true;cancel=false;
 try{
  const name=String(file.name||''),pdf=/\.pdf$/i.test(name)||file.type==='application/pdf';
  const image=/\.(png|jpe?g|webp|bmp)$/i.test(name)||file.type?.startsWith('image/');
  let r;
  if(pdf)r=await extractPdf(file,mode==='ocr');
  else if(image)r=await extractImage(file);
  else if(/\.(txt|md)$/i.test(name)||file.type?.startsWith('text/'))
   r={text:(await file.text()).slice(0,MAX_TEXT),kind:'txt',pages:0,totalPages:0};
  else throw Error('지원하지 않는 확장자입니다. PDF, 이미지, TXT, MD만 지원합니다.');
  sourceText=r.text;sourceType=r.kind;sourcePages=r.pages;
  sourceTitle=name.replace(/\.[^.]+$/,'').slice(0,120);currentId='';
  const title=root?.querySelector('[data-ck84-mat-title]'),area=root?.querySelector('[data-ck84-mat-text]');
  if(title)title.value=sourceTitle;if(area)area.value=sourceText;
  const preview=parseQuestions(sourceText);
  note('추출 '+sourceText.length+'자 · 문항 후보 '+preview.questions.length+
   '건 · 형식 완성 후보 '+preview.complete+'건 · 처리 '+r.pages+'/'+r.totalPages+'페이지. 원본 대조 필수.');
  showPreview();return true;
 }catch(e){note('추출 실패: '+(e?.message||'오류')+' · 텍스트를 직접 붙여 넣을 수 있습니다.');return false;}
 finally{working=false;}
}
function findDocuments(keyword,all=store.documents){
 const terms=norm(keyword).split(' ').filter(Boolean);
 return terms.length?all.filter(d=>terms.every(t=>norm(d.title+' '+d.note+' '+d.text).includes(t)))
  .sort((a,b)=>b.updatedAt-a.updatedAt).slice(0,35):[];
}
function findOfficial(keyword){
 const terms=norm(keyword).split(' ').filter(Boolean);
 return terms.length?Object.values(official()).filter(q=>q?.verified&&
  terms.every(t=>norm(q.question+' '+(q.options||[]).join(' ')).includes(t))).slice(0,8):[];
}
function showPreview(){
 const box=root?.querySelector('[data-ck84-mat-preview]');
 if(!box)return;
 const area=root.querySelector('[data-ck84-mat-text]');
 sourceText=String(area?.value||'').slice(0,MAX_TEXT);
 const parsed=parseQuestions(sourceText);
 box.innerHTML='<p>문항 추출 후보 '+parsed.questions.length+'건 · 5선지 구조 후보 '+parsed.complete+
  '건 · 경고 '+parsed.warnings.length+'건 (검증 전)</p>'+
 (parsed.warnings.length?'<details><summary>확인 필요 항목</summary><ul>'+parsed.warnings.slice(0,24).map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></details>':'')+
 parsed.questions.slice(0,35).map(q=>'<details><summary>'+q.number+'번 · '+q.page+'페이지'+(q.complete?' · 5선지 감지':' · 불완전')+
 '</summary><p>'+esc(q.question)+'</p><ol>'+q.options.map(o=>'<li>'+esc(o||'(미감지)')+'</li>').join('')+'</ol></details>').join('');
}
function list(){
 const box=root?.querySelector('[data-ck84-mat-list]');if(!box)return;
 const rows=query?findDocuments(query):store.documents.slice().sort((a,b)=>b.updatedAt-a.updatedAt);
 box.innerHTML=rows.length?rows.map(d=>'<article class="ck84-mat-row"><div><strong>'+esc(d.title)+
 '</strong><small>'+esc(d.kind)+' · '+d.text.length+'자 · '+(d.pages||0)+'페이지'+
 (d.officialRef?' · 기출 '+esc(d.officialRef):'')+'</small></div><div>'+
 '<button type="button" data-ck84-mat-open="'+esc(d.id)+'">열기</button>'+
 '<button type="button" data-ck84-mat-remove="'+esc(d.id)+'">삭제</button></div></article>').join(''):'<p>저장된 교재 자료가 없습니다.</p>';
 const officialBox=root.querySelector('[data-ck84-mat-official]');
 if(officialBox)officialBox.innerHTML=query?'<strong>공식 기출 문구 일치 후보 (개념 동일 여부 미검증)</strong>'+
 findOfficial(query).map(q=>'<button type="button" data-ck84-mat-visit="'+esc(q.id)+'">'+q.year+'년 '+q.number+'번</button>').join(''):
 '<small>검색어를 입력하면 저장된 교재 자료와 기출 문구 후보를 같이 찾습니다.</small>';
}
function startNew(){
 currentId='';sourceText='';sourceTitle='';sourceType='manual';sourcePages=0;
 for(const key of ['title','text','note','ref']){const el=root?.querySelector('[data-ck84-mat-'+key+']');if(el)el.value='';}
 const file=root?.querySelector('[data-ck84-mat-file]');if(file)file.value='';
 showPreview();note('새 개인 자료를 작성할 수 있습니다.');
}
function openDoc(id){
 const d=store.documents.find(d=>d.id===id);if(!d)return;
 currentId=d.id;sourceText=d.text;sourceTitle=d.title;sourceType=d.kind;sourcePages=d.pages;
 for(const [name,value] of Object.entries({title:d.title,text:d.text,note:d.note,ref:d.officialRef})){
  const input=root?.querySelector('[data-ck84-mat-'+name+']');if(input)input.value=value;
 }
 showPreview();note('자료를 열었습니다. 원문을 검토한 뒤 저장하세요.');
}
function save(){
 const get=name=>root?.querySelector('[data-ck84-mat-'+name+']')?.value||'';
 const title=String(get('title')).trim().slice(0,120),text=String(get('text')).slice(0,MAX_TEXT),
 noteText=String(get('note')).slice(0,1800),ref=String(get('ref')).trim();
 if(!title||!(text.trim()||noteText.trim())){note('제목과 자료 본문 또는 메모가 필요합니다.');return;}
 if(!validRef(ref)||ref&&official()[ref]?.verified!==true){note('연결 기출 ID를 확인하세요 (예: 2025-1).');return;}
 const at=Date.now(),prior=store.documents.find(x=>x.id===currentId);
 const row={id:prior?.id||newId(),title,text,note:noteText,kind:sourceType,pages:sourcePages,
  officialRef:ref,createdAt:prior?.createdAt||at,updatedAt:at};
 const docs=prior?store.documents.map(d=>d.id===prior.id?row:d):[row,...store.documents];
 if(docs.length>MAX_DOCS){note('교재 자료는 최대 35건까지만 저장합니다.');return;}
 if(!write({...store,documents:docs})){note('저장 실패: 용량 또는 다른 탭의 변경 사항을 확인하세요.');return;}
 currentId=row.id;note('개인 메모 저장 완료 · PDF 원본 파일은 저장되지 않았습니다.');list();
}
function remove(id){
 const d=store.documents.find(x=>x.id===id);
 if(!d||!window.confirm?.('"'+d.title+'" 개인 자료를 삭제할까요?'))return;
 if(write({...store,documents:store.documents.filter(x=>x.id!==id)})){
  if(currentId===id)startNew();list();note('개인 자료를 삭제했습니다.');
 }
}
function download(){
 const blob=new Blob(['\uFEFF',JSON.stringify(store,null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='ConceptKnot_개인교재자료_'+new Date().toISOString().slice(0,10)+'.json';
 document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
}
async function restore(file){
 if(!file||file.size>1024*1024){note('JSON 백업 최대 1MB입니다.');return;}
 try{
  const fresh=sanitize(JSON.parse((await file.text()).replace(/^\uFEFF/,'')));
  if(!fresh)throw Error('개인 자료 백업 형식이 아닙니다.');
  const overlap=fresh.documents.filter(x=>store.documents.some(y=>y.id===x.id)).length;
  if(overlap&&!window.confirm?.('같은 ID 자료 '+overlap+'건을 교체할까요?'))return;
  const restoredIds=new Set(fresh.documents.map(d=>d.id));
  const merged=[...fresh.documents,...store.documents.filter(d=>!restoredIds.has(d.id))];
  if(!write({...store,documents:merged}))throw Error('저장 용량 또는 다중 탭 충돌');
  list();note('개인 교재 자료 '+fresh.documents.length+'건을 복원했습니다.');
 }catch(e){note('복원 실패 · '+e.message);}
}
function mount(){
 const found=document.getElementById('ck84-materials');if(found){root=found;return;}
 const host=document.getElementById('ck76-search')||document.getElementById('main');if(!host)return;
 root=document.createElement('section');root.id='ck84-materials';root.className='ck84-materials';
 root.innerHTML='<div class="ck84-mat-header"><strong>교재·PDF·OCR 개인 자료실</strong>'+
 '<button type="button" data-ck84-mat-toggle aria-expanded="false">자료실 열기</button></div><div data-ck84-mat-body hidden></div>';
 if(host.id==='main')host.prepend(root);else host.after(root);
}
function paint(){
 if(!root||!visible)return;
 const body=root.querySelector('[data-ck84-mat-body]');body.hidden=false;
 body.innerHTML='<p class="ck84-mat-warning">OCR·PDF 텍스트 분리 결과는 검수 전입니다. 공식 기출 원문·정답에 자동 반영하지 않습니다.</p>'+
 '<div class="ck84-mat-tools"><label>파일 <input type="file" data-ck84-mat-file accept=".pdf,.txt,.md,.png,.jpg,.jpeg,.webp,.bmp,application/pdf,image/*,text/plain"></label>'+
 '<label>PDF 모드 <select data-ck84-mat-mode><option value="text">텍스트 레이어 추출</option>'+
 '<option value="ocr">스캔 PDF OCR(최대 8페이지)</option></select></label>'+
 '<button type="button" data-ck84-mat-extract>텍스트 추출 / OCR 시작</button>'+
 '<button type="button" data-ck84-mat-cancel>중단 요청</button>'+
 '<button type="button" data-ck84-mat-new>새 메모</button></div>'+
 '<p data-ck84-mat-status role="status">'+esc(message)+'</p>'+
 '<div class="ck84-mat-fields"><label>교재 제목 <input data-ck84-mat-title maxlength="120"></label>'+
 '<label>관련 기출 ID (선택) <input data-ck84-mat-ref placeholder="2025-1"></label>'+
 '<label class="ck84-mat-wide">추출·전사한 텍스트 (직접 편집 가능) <textarea data-ck84-mat-text maxlength="45000" rows="8"></textarea></label>'+
 '<label class="ck84-mat-wide">교재 페이지·근거·개인 노트 <textarea data-ck84-mat-note maxlength="1800" rows="3"></textarea></label></div>'+
 '<div class="ck84-mat-buttons"><button type="button" data-ck84-mat-preview>문항/선지 미리보기</button>'+
 '<button type="button" data-ck84-mat-save>개인 자료 저장</button>'+
 '<button type="button" data-ck84-mat-export>전체 자료 JSON 백업</button>'+
 '<button type="button" data-ck84-mat-import>JSON 복원</button>'+
 '<input type="file" data-ck84-mat-import-file hidden accept=".json,application/json"></div>'+
 '<div class="ck84-mat-preview" data-ck84-mat-preview></div>'+
 '<div class="ck84-mat-search"><label>내 교재·공식 문구 통합 검색 <input type="search" data-ck84-mat-search maxlength="120"></label>'+
 '<div data-ck84-mat-official></div><div data-ck84-mat-list></div></div>'+
 '<p class="ck84-mat-warning">OCR은 명시적으로 실행할 때만 외부 CDN에서 JS·한국어 모델을 내려받아 브라우저에서 처리합니다. 원문을 앱 서버로 보내지 않습니다. 오프라인에서는 직접 텍스트를 붙여 넣으세요. 파일 원본은 저장하지 않습니다.</p>';
 if(currentId&&store.documents.some(d=>d.id===currentId))openDoc(currentId);
 else{
  root.querySelector('[data-ck84-mat-title]').value=sourceTitle;
  root.querySelector('[data-ck84-mat-text]').value=sourceText;
 }
 root.querySelector('[data-ck84-mat-search]').value=query;list();showPreview();
}
function toggle(){
 visible=!visible;const body=root?.querySelector('[data-ck84-mat-body]'),button=root?.querySelector('[data-ck84-mat-toggle]');
 if(body)body.hidden=!visible;
 if(button){button.textContent=visible?'자료실 접기':'자료실 열기';button.setAttribute('aria-expanded',String(visible));}
 if(visible)paint();
}
document.addEventListener('click',event=>{
 const t=event.target.closest?.('[data-ck84-mat-toggle],[data-ck84-mat-extract],[data-ck84-mat-cancel],'+
 '[data-ck84-mat-new],[data-ck84-mat-preview],[data-ck84-mat-save],[data-ck84-mat-export],'+
 '[data-ck84-mat-import],[data-ck84-mat-open],[data-ck84-mat-remove],[data-ck84-mat-visit]');
 if(!t||!root?.contains(t))return;
 if(t.hasAttribute('data-ck84-mat-toggle')){toggle();return;}
 if(t.hasAttribute('data-ck84-mat-extract')){
  extract(root.querySelector('[data-ck84-mat-file]')?.files?.[0],root.querySelector('[data-ck84-mat-mode]')?.value);
  return;
 }
 if(t.hasAttribute('data-ck84-mat-cancel')){cancel=true;note('현재 페이지 인식 종료 후 중단됩니다.');return;}
 if(t.hasAttribute('data-ck84-mat-new')){startNew();return;}
 if(t.hasAttribute('data-ck84-mat-preview')){showPreview();return;}
 if(t.hasAttribute('data-ck84-mat-save')){save();return;}
 if(t.hasAttribute('data-ck84-mat-export')){download();return;}
 if(t.hasAttribute('data-ck84-mat-import')){root.querySelector('[data-ck84-mat-import-file]')?.click();return;}
 if(t.hasAttribute('data-ck84-mat-open')){openDoc(t.dataset.ck84MatOpen);return;}
 if(t.hasAttribute('data-ck84-mat-remove')){remove(t.dataset.ck84MatRemove);return;}
 if(t.hasAttribute('data-ck84-mat-visit')){
  const q=official()[t.dataset.ck84MatVisit];if(!q?.verified)return;
  if(q.year>=2021)window.CK78Analysis?.open?.(q.year,q.number,t);
  else window.CK76Study?.openQuestion?.(q.year,q.number,q.subject);
 }
});
document.addEventListener('change',event=>{
 const t=event.target;
 if(t.matches?.('[data-ck84-mat-import-file]')&&root?.contains(t))restore(t.files?.[0]).finally(()=>{t.value='';});
});
document.addEventListener('input',event=>{
 const t=event.target;
 if(t.matches?.('[data-ck84-mat-search]')&&root?.contains(t)){query=t.value;list();}
});
document.addEventListener('storage',event=>{
 if(event.key===KEY){store=read();if(visible){list();note('다른 탭의 자료 변경을 확인했습니다. 기존 입력을 저장하기 전 검토하세요.');}}
});
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;mount();});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
const main=document.getElementById('main');
if(main&&window.MutationObserver)new MutationObserver(changes=>{
 if(!document.getElementById('ck84-materials')&&changes.some(x=>x.addedNodes.length))schedule();
}).observe(main,{subtree:true,childList:true});
window.CK84Materials=Object.freeze({sanitize,parseQuestions,orderedText,findDocuments,findOfficial,
 getDocuments:()=>store.documents.map(x=>({...x})),
 getState:()=>({open:visible,working,documents:store.documents.length,revision:store.revision}),
 open:()=>{mount();if(root&&!visible)toggle();}});
})();