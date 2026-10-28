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
 const a=e.target.closest('[data-ck10-ai]');if(a){e.preventDefault();openDock(a.dataset.ck10Ai);return;}
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
document.addEventListener('mousedown',e=>{
 if(e.button!==0||!e.ctrlKey||!e.altKey)return;
 if(!e.target.closest('.ck-v7-board,.ck-v7-content'))return;
 e.preventDefault();openDock(activeAI);
},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDock()});
new MutationObserver(()=>{if(document.getElementById('ck10-final-root'))finalMount()})
 .observe(document.getElementById('main')||document.body,{childList:true,subtree:false});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',finalMount,{once:true});else finalMount();
window.CK10=Object.freeze({exportBoard,finalExport,openDock});
})();
