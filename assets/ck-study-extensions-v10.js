/* ConceptKnot v10 — client-only final sheets, export, AI site dock. */
(function(){
'use strict';
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KEY='recallgraph-first-exam-v1',NOTE_KEY='ck10-exam-final-v1';
const providers={
 chatgpt:{name:'ChatGPT',url:'https://chatgpt.com/',logo:'◉'},
 gemini:{name:'Gemini',url:'https://gemini.google.com/app',logo:'✦'},
 claude:{name:'Claude',url:'https://claude.ai/new',logo:'✳'}
};
function current(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}}
const file=(name,text,type='text/plain;charset=utf-8')=>{
 const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2500);
};
function printable(title,body){
 const doc=window.open('','_blank','width=850,height=1100');
 if(!doc){alert('인쇄창이 차단되었습니다. 팝업을 허용해 주세요.');return;}
 // No external network, HTML injected as text only. Browser Print -> Save PDF.
 doc.document.open();
 doc.document.write('<!doctype html><html lang="ko"><meta charset="utf-8"><title>'+escape(title)+'</title><style>@page{size:A4;margin:17mm}body{font:13px/1.65 "Malgun Gothic",sans-serif;color:#152a24}h1{font-size:20px;line-height:1.3}.page{page-break-after:always;min-height:225mm}.page:last-child{page-break-after:auto}h2{font-size:16px;border-bottom:1px solid #aaa;padding-bottom:8px}pre{white-space:pre-wrap;word-break:break-word;font:inherit}.muted{font-size:10px;color:#666}</style><body><h1>'+escape(title)+'</h1>'+body+'</body></html>');
 doc.document.close();doc.focus();setTimeout(()=>doc.print(),300);
}
function exportBoard(kind,key,text){
 const name='ConceptKnot-'+String(key).replace(/[^\w가-힣-]/g,'_');
 if(kind==='txt'){file(name+'.txt',String(text||''));return;}
 printable('ConceptKnot · '+key,'<pre>'+escape(text||'')+'</pre><p class="muted">인쇄 대상에서 PDF로 저장을 선택하세요.</p>');
}
function defaultPages(){
 const s=current(),mistakes=Object.values(s.mistakes||{}).filter(x=>x&&!x.resolved);
 const focus=mistakes.slice(-18).reverse();
 const theoretical=(kind)=>Object.entries(s.chalk?.notes||{}).filter(([k,v])=>v?.text&&k.includes(kind)).slice(-8);
 const board=Object.entries(s.chalk?.notes||{}).filter(([k,v])=>k.startsWith('workspace:')&&v?.text).slice(-12);
 return [
  ['시험장 진입 10분 체크',[
   '① 신분증·수험표·필기구·시계 및 시험장 공지 확인',
   '② 한 과목에 시간 과다 사용하지 않기. 어려운 문항 표시 후 이동',
   '③ 정답은 근거로 판단. 확실하지 않은 문제는 소거법',
   '④ 마지막 5분 OMR 미표기·중복표기 확인',
   '⑤ 최신 법령·판례는 공식 기출 원문 및 최신 기준 우선'
  ].join('\n')],
  ['부동산학개론 — 개념과 계산',[
    '수요·공급 변화와 가격 변화 방향을 분리해서 판단',
    '탄력성=변화율의 비율. 기준값과 부호에 주의',
    '현가·미래가·수익환원 등 공식의 분모와 기간 검산',
    '현금흐름·할인율·기간을 통일하고 단위 점검',
    ...theoretical('estate').map(([k,v])=>'[내 메모 '+k+'] '+v.text.slice(0,300))
  ].join('\n')],
  ['민법 — 성립과 효력',[
    '물권 변동: 등기와 법률행위·법률규정의 구별',
    '대리: 대리권·표시·효과귀속의 순서',
    '무효/취소, 해제/해지, 선의/악의 구분',
    '점유·취득시효·저당권의 요건별 판단',
    ...theoretical('civil').map(([k,v])=>'[내 메모 '+k+'] '+v.text.slice(0,300))
  ].join('\n')],
  ['내가 틀린 문제 — 재확인',focus.length?focus.map((v,i)=>
    (i+1)+'. '+(v.label||v.id)+'\n   정답: '+(v.correct||'공식 원문 재확인')+'\n   '+String(v.why||'').slice(0,170)).join('\n\n'):
    '저장된 미해결 오답이 없습니다.\n공식 기출 문제의 핵심 선지·근거를 여기에 직접 기록하세요.'],
  ['최종 암기 · 직접 작성',board.length?board.map(([k,v])=>'['+k.slice(10)+']\n'+v.text.slice(0,480)).join('\n\n'):
    '나만의 최종 암기 문장을 작성하세요.\n주의: 자동 추출된 내용은 최신 법령 검증을 대신하지 않습니다.']
 ];
}
let pages;
function loadPages(){
 try{const saved=JSON.parse(localStorage.getItem(NOTE_KEY)||'null');if(Array.isArray(saved)&&saved.length===5&&saved.every(x=>Array.isArray(x)&&x.length===2))return saved}catch{}
 return defaultPages();
}
function savePages(){try{localStorage.setItem(NOTE_KEY,JSON.stringify(pages))}catch{}}
function finalMount(){
 const el=document.getElementById('ck10-final-root');if(!el)return;
 if(!pages)pages=loadPages();
 el.innerHTML='<header class="ck10-final-heading"><h1>시험 직전 최종 노트</h1><span>A4 · 1~5장</span></header>'+
 '<div class="ck10-final-actions"><button data-ck10-export="final-txt">전체 TXT</button><button data-ck10-export="final-pdf">PDF 인쇄</button><button data-ck10-final-reset>자동 초안 다시 만들기</button></div>'+
 '<p class="ck10-final-guide">기본 틀과 내 오답·메모를 모아 둔 5쪽 편집형 노트입니다. 저장된 정답과 요약은 시험 직전 공식 원문으로 확인하세요.</p>'+
 pages.map(([title,body],i)=>'<section class="ck10-paper"><span class="ck10-page-label">'+(i+1)+' / 5</span><input aria-label="'+(i+1)+'쪽 제목" data-ck10-final-title="'+i+'" value="'+escape(title)+'"><textarea aria-label="'+(i+1)+'쪽 본문" data-ck10-final-body="'+i+'">'+escape(body)+'</textarea></section>').join('');
}
function finalExport(kind){
 if(!pages)pages=loadPages();
 if(kind==='final-txt')file('ConceptKnot-시험직전-최종노트.txt',pages.map((x,i)=>'['+(i+1)+'/5] '+x[0]+'\n\n'+x[1]).join('\n\n---\n\n'));
 else printable('ConceptKnot · 시험 직전 최종 노트',
 pages.map(([t,b],i)=>'<section class="page"><h2>'+(i+1)+' / 5 · '+escape(t)+'</h2><pre>'+escape(b)+'</pre></section>').join(''));
}
let activeAI='chatgpt';
function dock(){
 let el=document.getElementById('ck10-ai-dock');
 if(el)return el;
 el=document.createElement('aside');el.id='ck10-ai-dock';el.className='ck10-ai-dock';el.hidden=true;
 el.innerHTML='<header><strong>학습 질문</strong><button data-ck10-close aria-label="닫기">×</button></header><nav>'+
 Object.entries(providers).map(([id,p])=>'<button data-ck10-provider="'+id+'">'+p.logo+' '+p.name+'</button>').join('')+
 '</nav><label for="ck10-ai-question">질문</label><textarea id="ck10-ai-question" placeholder="모르는 문제의 근거를 질문하세요."></textarea>'+
 '<div class="ck10-ai-actions"><button data-ck10-copy>질문 복사</button><button data-ck10-open>선택한 서비스 열기 ↗</button></div>'+
 '<p>각 서비스는 본인의 로그인 세션을 사용합니다. 외부 사이트의 보안 제한으로 이 페이지에 채팅창을 직접 넣을 수는 없습니다. 복사한 질문을 열린 서비스에 붙여 넣으세요. API 토큰은 필요하지 않습니다.</p>';
 document.body.appendChild(el);return el;
}
function openDock(provider='chatgpt'){
 activeAI=providers[provider]?provider:'chatgpt';
 const el=dock();el.hidden=false;document.body.classList.add('ck10-dock-open');
 el.querySelectorAll('[data-ck10-provider]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.ck10Provider===activeAI)));
}
function closeDock(){const el=document.getElementById('ck10-ai-dock');if(el)el.hidden=true;document.body.classList.remove('ck10-dock-open')}
document.addEventListener('click',e=>{
 const a=e.target.closest('[data-ck10-ai]');if(a){if(a.tagName==='A')return;e.preventDefault();openDock(a.dataset.ck10Ai);return;}
 const provider=e.target.closest('[data-ck10-provider]');if(provider){openDock(provider.dataset.ck10Provider);return;}
 if(e.target.closest('[data-ck10-close]')){closeDock();return;}
 if(e.target.closest('[data-ck10-copy]')){
  const t=dock().querySelector('textarea').value;
  navigator.clipboard?.writeText(t).then(()=>{dock().querySelector('[data-ck10-copy]').textContent='복사됨 ✓'}).catch(()=>window.prompt('질문을 복사하세요',t));return;
 }
 if(e.target.closest('[data-ck10-open]')){window.open(providers[activeAI].url,'_blank','noopener,noreferrer');return;}
 const exp=e.target.closest('[data-ck10-export]');if(exp){finalExport(exp.dataset.ck10Export);return;}
 if(e.target.closest('[data-ck10-final-reset]')){if(confirm('편집한 최종 노트를 새 초안으로 바꿀까요?')){pages=defaultPages();savePages();finalMount()}return;}
});
document.addEventListener('input',e=>{
 if(e.target.matches('[data-ck10-final-title],[data-ck10-final-body]')){
  const title=e.target.dataset.ck10FinalTitle,body=e.target.dataset.ck10FinalBody;
  const idx=Number(title??body);if(!Number.isInteger(idx)||idx<0||idx>4)return;
  pages[idx][title!==undefined?0:1]=e.target.value.slice(0,10000);savePages();
 }
});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDock()});
new MutationObserver(()=>{if(document.getElementById('ck10-final-root'))finalMount()})
 .observe(document.getElementById('main')||document.body,{childList:true,subtree:false});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',finalMount,{once:true});else finalMount();
window.CK10=Object.freeze({exportBoard,finalExport,openDock});
})();


/* v11: optional real browser pop-out split, monochrome brands, printable notes */
(function(){
'use strict';
const SERVICE={
 chatgpt:{name:'ChatGPT',url:'https://chatgpt.com/',icon:'./assets/ck-brand-chatgpt.svg'},
 gemini:{name:'Gemini',url:'https://gemini.google.com/app',icon:'./assets/ck-brand-gemini.svg'},
 claude:{name:'Claude',url:'https://claude.ai/new',icon:'./assets/ck-brand-claude.svg'}
};
let last='chatgpt';
const PAGE_COUNT='ck11-final-page-count';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const maxPages=()=>{let n=5;try{n=Number(localStorage.getItem(PAGE_COUNT)||5)}catch(e){}return Math.max(1,Math.min(5,Math.round(n)||5))};
function status(message){
 const dock=document.getElementById('ck10-ai-dock');if(!dock)return;
 let p=dock.querySelector('.ck11-status');
 if(!p){p=document.createElement('p');p.className='ck11-status';p.setAttribute('role','status');dock.appendChild(p)}
 p.textContent=message;
}
function decorate(){
 document.querySelectorAll('[data-ck10-ai],[data-ck10-provider]').forEach(button=>{
  const id=button.dataset.ck10Ai||button.dataset.ck10Provider;
  if(!SERVICE[id])return;
  // Upgrade old cached button markup to a native link without losing data attributes.
  // Native browser gestures and right-click Split View require a real <a href>.
  if(button.hasAttribute('data-ck10-ai')&&button.tagName!=='A'){
   const anchor=document.createElement('a');
   for(const attr of Array.from(button.attributes)){
    if(attr.name!=='type')anchor.setAttribute(attr.name,attr.value);
   }
   anchor.href=SERVICE[id].url;anchor.target='_blank';anchor.rel='noopener noreferrer';
   button.replaceWith(anchor);button=anchor;
  }
  if(button.hasAttribute('data-ck10-ai')){
   button.href=SERVICE[id].url;button.target='_blank';button.rel='noopener noreferrer';
  }
  if(button.dataset.ck11Logo===id)return;
  const img=document.createElement('img');img.alt='';img.setAttribute('aria-hidden','true');
  img.src=SERVICE[id].icon;img.width=21;img.height=21;
  button.replaceChildren(img);
  if(button.hasAttribute('data-ck10-provider'))button.appendChild(document.createTextNode(' '+SERVICE[id].name));
  button.dataset.ck11Logo=id;
 });
 document.querySelectorAll('.ck-v7-toolrow').forEach(row=>{
  const clear=row.querySelector('[data-ck-v7-command="clear"]');
  if(clear&&!row.querySelector('[data-ck11-eraser]')){
   const b=document.createElement('button');b.type='button';b.dataset.ck11Eraser='true';
   b.className='ck11-eraser';b.title='S Pen 지우개';b.setAttribute('aria-label','S Pen 지우개');
   b.innerHTML='<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M20 14.5 12 22H6l-4-4 11.7-11.7a2 2 0 0 1 2.8 0l3.5 3.5a3 3 0 0 1 0 4.7Z"/><path d="m8 12 6 6M12 22h9"/></svg>';
   clear.before(b);
  }
  const font=row.querySelector('.ck10-font'),slider=font?.querySelector('[data-ck10-font]');
  if(slider&&!font.querySelector('output')){
   const out=document.createElement('output');out.className='ck11-font-size';out.textContent=slider.value+'px';font.append(out);
  }
 });
 const root=document.getElementById('ck10-final-root'),actions=root?.querySelector('.ck10-final-actions');
 if(actions&&!actions.querySelector('[data-ck11-pages]')){
  const label=document.createElement('label');label.className='ck11-page-count';
  label.innerHTML='<span>출력 분량</span><select data-ck11-pages aria-label="최종노트 출력 장수"><option value="1">A4 1장</option><option value="2">A4 2장</option><option value="3">A4 3장</option><option value="4">A4 4장</option><option value="5">A4 5장</option></select>';
  actions.prepend(label);
 }
 if(actions){
  const number=maxPages(),selector=actions.querySelector('[data-ck11-pages]');
  if(selector&&selector.value!==String(number))selector.value=String(number);
  root.querySelectorAll('.ck10-paper').forEach((page,i)=>{const hide=i>=number;if(page.hidden!==hide)page.hidden=hide});
  const label=root.querySelector('.ck10-final-heading span');if(label)label.textContent='A4 · '+number+' / 5장';
 }
}
function selectedText(){
 const value=window.getSelection?.()?.toString().trim();
 const target=document.getElementById('ck10-ai-question');
 if(value&&target&&!target.value.trim())target.value=value.slice(0,4000);
}
function provider(){
 const pressed=document.querySelector('#ck10-ai-dock [data-ck10-provider][aria-pressed="true"]');
 return SERVICE[pressed?.dataset.ck10Provider]?pressed.dataset.ck10Provider:last;
}
// Ported from LexLoom/app/chatgpt-companion.mjs (single right-hand third).
// Best-effort screen geometry; never a privileged/native browser split command.
function companionWindowFeatures(screen){
 const widthAvailable=Number.isFinite(screen?.availWidth)&&screen.availWidth>0
  ?Math.floor(screen.availWidth):1365;
 const heightAvailable=Number.isFinite(screen?.availHeight)&&screen.availHeight>0
  ?Math.floor(screen.availHeight):800;
 const originLeft=Number.isFinite(screen?.availLeft)?Math.floor(screen.availLeft):0;
 const originTop=Number.isFinite(screen?.availTop)?Math.floor(screen.availTop):0;
 const width=Math.min(widthAvailable,Math.max(400,Math.round(widthAvailable/3)));
 const height=Math.max(250,heightAvailable);
 const left=originLeft+widthAvailable-width;
 return 'popup=yes,width='+width+',height='+height+',left='+left+',top='+originTop+',resizable=yes,scrollbars=yes';
}
function externalAI(id){
 id=SERVICE[id]?id:'chatgpt';last=id;
 let popup=null;
 try{
  popup=window.open('about:blank','_blank',companionWindowFeatures(window.screen));
  if(popup){popup.opener=null;popup.location.replace(SERVICE[id].url);popup.focus()}
 }catch(e){if(popup){try{popup.close()}catch(ex){}}popup=null}
 if(!popup){
  status('팝업 차단됨: 링크를 새 탭에서 열 수 있습니다.');
  return false;
 }
 status(SERVICE[id].name+' 오른쪽 보조창 요청 완료. 실제 위치·크기는 브라우저가 결정합니다.');
 return true;
}
function copyQuestion(){
 const text=document.getElementById('ck10-ai-question')?.value||'';
 if(!text.trim()){status('질문을 입력하거나 칠판에서 문장을 선택하세요.');return}
 const done=()=>{const button=document.querySelector('[data-ck10-copy]');if(button)button.textContent='복사됨 ✓';status('복사 완료. AI 창에서 Ctrl+V로 붙여 넣으세요.')};
 const fallback=()=>{
  const node=document.createElement('textarea');node.value=text;node.readOnly=true;node.style.cssText='position:fixed;left:-9999px';
  document.body.append(node);node.select();let ok=false;
  try{ok=document.execCommand('copy')}catch(e){}node.remove();
  if(ok)done();else window.prompt('질문 복사',text);
 };
 if(navigator.clipboard?.writeText)navigator.clipboard.writeText(text).then(done,fallback);else fallback();
}
function txt(name,text){
 const url=URL.createObjectURL(new Blob(['\uFEFF',text],{type:'text/plain;charset=utf-8'}));
 const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),3000);
}
function print(title,body){
 const popup=window.open('about:blank','_blank','width=860,height=1040');
 if(!popup){window.alert('인쇄 창이 차단되었습니다. 팝업을 허용해 주세요.');return}
 popup.document.open();
 popup.document.write('<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>'+esc(title)+'</title><style>@page{size:A4;margin:14mm 15mm}*{box-sizing:border-box}body{font:13px/1.57 Arial,"Malgun Gothic",sans-serif;color:#152d27;margin:0}h1{font-size:20px;margin:0 0 9mm}h2{font-size:17px;margin:0 0 7mm;border-bottom:1px solid #cad8d1;padding-bottom:5mm}pre{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.6;font:inherit}.paper{page-break-after:always;break-after:page}.paper:last-child{page-break-after:auto;break-after:auto}.paper-num{font-size:11px;color:#54746a;margin-bottom:7mm}.ink{margin-top:8mm;padding:8mm;background:#133e39;break-inside:avoid}.ink img{width:100%;height:auto;display:block}@media screen{body{padding:20px;max-width:800px;margin:auto}.paper{padding:10px;border:1px solid #ddd;margin-bottom:20px}}</style></head><body>'+body+'</body></html>');
 popup.document.close();popup.focus();setTimeout(()=>{if(!popup.closed)popup.print()},420);
}
function finalExport(kind){
 const root=document.getElementById('ck10-final-root');if(!root)return;
 const pages=Array.from(root.querySelectorAll('.ck10-paper')).slice(0,maxPages()).map(el=>({
  title:el.querySelector('[data-ck10-final-title]')?.value||'시험 직전 암기',
  body:el.querySelector('[data-ck10-final-body]')?.value||''
 }));
 if(!pages.length)return;
 if(kind==='final-txt'){
  txt('ConceptKnot-최종정리-'+pages.length+'장.txt',pages.map((p,i)=>'['+(i+1)+'/'+pages.length+'] '+p.title+'\r\n\r\n'+p.body).join('\r\n\r\n-----\r\n\r\n'));return;
 }
 if(pages.some(p=>p.body.length>2400)){
  const hint=root.querySelector('.ck10-final-guide');if(hint)hint.textContent='내용이 긴 쪽은 인쇄 시 다음 페이지로 넘어갈 수 있습니다. 원본 내용은 유지됩니다.';
 }
 print('ConceptKnot 최종 노트',pages.map((p,i)=>'<section class="paper"><div class="paper-num">CONCEPTKNOT · '+(i+1)+' / '+pages.length+'</div><h2>'+esc(p.title)+'</h2><pre>'+esc(p.body)+'</pre></section>').join(''));
}
function boardPdf(button){
 const board=button.closest('.ck-v7-board'),key=board?.dataset.ckV7Key||'study';
 const text=board?.querySelector('.chalk-editor textarea')?.value||'';
 let ink='';
 try{
  const state=JSON.parse(localStorage.getItem('recallgraph-first-exam-v1')||'{}');
  const canvas=board?.querySelector('canvas.ck-v7-pen-layer');
  if(Array.isArray(state.ink?.[key])&&state.ink[key].length&&canvas?.width&&canvas.height){
   ink='<div class="ink"><img alt="필기 이미지" src="'+canvas.toDataURL('image/png')+'"></div>';
  }
 }catch(e){}
 print('ConceptKnot 메모', '<section class="paper"><h1>'+esc(key)+'</h1><pre>'+esc(text)+'</pre>'+ink+'</section>');
}
document.addEventListener('click',e=>{
 const target=e.target;if(!target.closest)return;
 const icon=target.closest('[data-ck10-ai]');
 if(icon){
  // LexLoom contract: modified clicks, including Ctrl+Alt, belong to the browser.
  // Do not preventDefault, including for native Chrome/Brave Split View.
  if(e.button!==0||e.ctrlKey||e.altKey||e.metaKey||e.shiftKey||window.innerWidth<720)return;
  // Only consume a plain click when popup actually opens; otherwise follow href.
  if(externalAI(icon.dataset.ck10Ai)){e.preventDefault();e.stopImmediatePropagation()}
  return;
 }
 const menu=target.closest('[data-ck10-provider]');if(menu){last=menu.dataset.ck10Provider;return}
 if(target.closest('[data-ck10-open]')){e.preventDefault();e.stopImmediatePropagation();externalAI(provider());return}
 if(target.closest('[data-ck10-copy]')){e.preventDefault();e.stopImmediatePropagation();copyQuestion();return}
 const output=target.closest('[data-ck10-export]');
 if(output){e.preventDefault();e.stopImmediatePropagation();finalExport(output.dataset.ck10Export);return}
 const eraser=target.closest('[data-ck11-eraser]');
 if(eraser){
  e.preventDefault();e.stopImmediatePropagation();
  const board=eraser.closest('.ck-v7-board'),mode=board?.querySelector('[data-ck9-spen="toggle"]');
  if(mode&&mode.getAttribute('aria-pressed')!=='true')mode.click();
  const tool=document.querySelector('[data-ck9-spen-tool="eraser"]');if(tool)tool.click();
  return;
 }
 const pdf=target.closest('[data-ck-v7-command="pdf"]');
 if(pdf){e.preventDefault();e.stopImmediatePropagation();boardPdf(pdf)}
},true);
document.addEventListener('change',e=>{
 if(!e.target.matches?.('[data-ck11-pages]'))return;
 const value=Math.max(1,Math.min(5,Math.round(Number(e.target.value)||5)));
 try{localStorage.setItem(PAGE_COUNT,String(value))}catch(err){}
 decorate();
});
document.addEventListener('input',e=>{
 if(!e.target.matches?.('[data-ck10-font]'))return;
 const output=e.target.closest('.ck10-font')?.querySelector('output');
 if(output)output.textContent=e.target.value+'px';
});
function monitor(){
 decorate();const main=document.getElementById('main');
 if(!main||!window.MutationObserver)return;
 let pending=false;
 const observer=new MutationObserver(records=>{
  if(pending||!records.some(r=>Array.from(r.addedNodes).some(node=>node.nodeType===1&&
     (node.matches?.('.ck-v7-board,.ck10-final-heading,.ck10-paper,[data-ck10-ai]')||
      node.querySelector?.('.ck-v7-board,.ck10-final-actions,[data-ck10-ai]')))))return;
  pending=true;requestAnimationFrame(()=>{pending=false;decorate()});
 });
 observer.observe(main,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',monitor,{once:true});else monitor();
})();
