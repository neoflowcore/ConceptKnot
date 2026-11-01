/* P5 v79: A4 1/3/5-page personal-recall preview. Never edits CK10's saved final pages. */
(function(){
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const take=(s,n)=>String(s??'').trim().slice(0,n);
const today=()=>new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const snapshot=()=>window.CK79Study?.snapshot?.()||{mistakes:[],notes:{},boardNotes:{},review:{},typing:[]};
function activeMistakes(s,subject){
 return (s.mistakes||[]).filter(m=>m?.type==='exam'&&!m.resolved&&m.year&&m.number&&
  (!subject||subject==='all'||m.s===subject)).sort((a,b)=>(b.updated||0)-(a.updated||0)).slice(0,40);
}
function userNotes(s,subject='all'){
 return Object.entries(s.notes||{}).filter(([key,value])=>{
  const id=key.match(/^exam-(\d{4}-\d{1,2})$/)?.[1];
  return id&&take(value,1)&&(!subject||subject==='all'||window.RECALL_OFFICIAL?.[id]?.subject===subject);
 }).slice(-28).reverse().map(([key,value])=>'['+key.slice(5)+'] '+take(value,200));
}
function boardNotes(s,subject='all'){
 return Object.entries(s.boardNotes||{}).filter(([key,value])=>
  value?.text&&(!subject||subject==='all'||key.includes(subject))
 ).slice(-6).map(([key,value])=>'['+key+'] '+take(value.text,200));
}
function explainMistakes(s,subject='all'){
 return activeMistakes(s,subject).map(m=>{
  const id=m.year+'-'+m.number,q=window.RECALL_OFFICIAL?.[id];
  const title=take(q?.question?.replace(/\s+/g,' ')||m.label||'공식 기출 문항',73);
  return '['+id+'] '+title+'\n내 답: '+(m.answer||'미입력')+
   ' / 공식 채점 인정: '+take(m.correct||'확인 필요',50)+
   (s.notes?.['exam-'+id]?'\n내 메모: '+take(s.notes['exam-'+id],110):'');
 });
}
function assemble(lines,maxChars=1650){
 let result='',left=0;
 for(const line of lines){
  const next=String(line??'').trim();
  if(!next)continue;
  if(result.length+next.length+2>maxChars){left++;continue;}
  result+=(result?'\n\n':'')+next;
 }
 if(left)result+='\n\n(나머지 '+left+'개 항목은 원본 학습기록에서 확인)';
 return result||'등록한 개인 오답과 메모가 없습니다. 원문을 읽고 헷갈린 근거를 직접 적어 보세요.';
}
const common=[
 '공식 정답 인정과 모든 선지의 참/거짓을 구분한다. 전원정답은 모든 지문이 옳다는 뜻이 아니다.',
 '부정형 문항: “옳지 않은 것”을 먼저 표시하고 원칙/예외를 분리한다.',
 'ㄱ·ㄴ·ㄷ 조합: 각 진술을 별도로 판단하고 마지막에 선택지와 연결한다.',
 '법령·판례: 해당 시험연도 법률과 현행 개정 내용은 구분하여 공식 원문으로 확인한다.',
 '시간 관리: 1차 80문항 100분, 과목별 40점 이상·평균 60점 목표.',
 '오답 풀이: 이전 선택 이유 → 놓친 조건 → 재풀이 → 같은 개념 다른 기출.'
];
const estate=[
 '학개론은 단위·가격/수량 방향·기간 일치를 먼저 검사한다.',
 '현재가치: PV=FV/(1+r)^n (시험문항에 해당하면 조건·복리 기간을 대조).',
 '직접환원: V=NOI/R (NOI와 환원율의 일치 기간을 확인).',
 '수요 자체 이동과 같은 수요곡선 위 점 이동을 구별한다.',
 '가격탄력성의 크기와 가격하락 시 수요량 증가 방향을 각각 판단한다.',
 '위 일반 공식은 개별 공식 기출의 정답·법령 검수와 별개인 학습 점검표다.'
];
const civil=[
 '민법의 법률 문제마다 적용 시점·당사자·성립 요건을 먼저 검토한다.',
 '무효/취소, 해제/해지, 대리/표현대리, 점유/등기/시효의 요건과 효과를 분리한다.',
 '주택·상가 임대차보호법은 적용 대상·시기·요건을 공식 법령/판례로 확인한다.',
 '2021~2025년 기출의 당시 법령이 현재에도 같다고 추정하지 않는다.',
 '미검수 법령·판례를 최종 암기 규칙으로 확정하지 않는다.'
];
function makePages(count=5,s=snapshot()){
 count=[1,3,5].includes(Number(count))?Number(count):5;
 const missed=activeMistakes(s,'all');
 const cover=['집중 복습용 초안 · '+today(),'미해결 공식 기출 오답 '+missed.length+'건',
  '이 자료는 내 개인 기록과 일반 학습 점검표를 재배열했습니다. 공식 감수 완료 해설이 아닙니다.'];
 const pages=count===1?[
  ['한 장으로 보는 내 오답과 오늘 확인할 것',assemble([...cover,...common.slice(0,5),
   ...explainMistakes(s).slice(0,7),...userNotes(s).slice(0,4)],1500)]
 ]:count===3?[
  ['01 · 시험 직전 점검',assemble([...cover,...common],1700)],
  ['02 · 학개론 계산·그래프·오답',assemble([...estate,...explainMistakes(s,'estate'),...userNotes(s,'estate'),...boardNotes(s,'estate')],1850)],
  ['03 · 민법 원칙/예외·오답',assemble([...civil,...explainMistakes(s,'civil'),...userNotes(s,'civil'),...boardNotes(s,'civil')],1850)]
 ]:[
  ['01 · 시험 직전 공통 체크',assemble([...cover,...common,...explainMistakes(s).slice(0,3)],1500)],
  ['02 · 학개론 개념·계산 빠른 확인',assemble([...estate,...boardNotes(s,'estate')],1800)],
  ['03 · 학개론 개인 오답',assemble([...explainMistakes(s,'estate'),...userNotes(s,'estate')],1900)],
  ['04 · 민법 요건·효과·법령 검증',assemble([...civil,...boardNotes(s,'civil')],1800)],
  ['05 · 민법 개인 오답',assemble([...explainMistakes(s,'civil'),...userNotes(s,'civil')],1900)]
 ];
 return pages.map(([title,body],i)=>({page:i+1,total:count,title,body,
  status:'개인 기록 + 일반 학습 확인 · 공식 해설/현행법 검수 전'}));
}
let currentCount=5,output=[];
function mount(){
 const root=document.getElementById('ck10-final-root');
 const anchor=root?.querySelector('.ck10-final-actions');
 if(!anchor||root.querySelector('[data-ck79-final-tool]'))return;
 const wrap=document.createElement('div');wrap.className='ck79-final-tool';
 wrap.dataset.ck79FinalTool='true';
 wrap.innerHTML='<strong>내 오답 기반 A4 요약본</strong>'+
  '<label>분량 <select data-ck79-final-count aria-label="요약본 장수">'+
  '<option value="1">1장</option><option value="3">3장</option><option value="5" selected>5장</option>'+
  '</select></label><button type="button" data-ck79-final-generate>개인 복습 초안 생성</button>'+
  '<p>위의 직접 편집한 최종 노트는 덮어쓰지 않습니다. 생성된 초안은 별도 미리보기입니다.</p>';
 anchor.after(wrap);
}
function content(){return output.map(p=>p.title+'\n\n'+p.body+'\n\n'+p.status).join('\n\n======\n\n');}
function renderPreview(){
 const root=document.getElementById('ck10-final-root');if(!root)return;
 let container=root.querySelector('[data-ck79-final-preview]');
 if(!container){container=document.createElement('section');container.dataset.ck79FinalPreview='true';container.className='ck79-final-preview';root.append(container);}
 container.innerHTML='<header><strong>개인 복습 초안 · A4 '+currentCount+'장</strong>'+
  '<button type="button" data-ck79-final-copy>복사</button>'+
  '<button type="button" data-ck79-final-txt>TXT 내보내기</button>'+
  '<button type="button" data-ck79-final-print>인쇄·PDF 저장</button></header>'+
  output.map(p=>'<article class="ck79-summary-sheet"><small>'+p.page+'/'+p.total+' · '+esc(p.status)+'</small>'+
   '<h3>'+esc(p.title)+'</h3><pre>'+esc(p.body)+'</pre></article>').join('');
}
function saveTxt(){
 const file=new Blob(['\uFEFF',content()],{type:'text/plain;charset=utf-8'});
 const url=URL.createObjectURL(file),link=document.createElement('a');
 link.href=url;link.download='ConceptKnot-내오답-'+currentCount+'장.txt';document.body.append(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),3500);
}
function printPDF(){
 const popup=window.open('about:blank','_blank','width=890,height=1100');
 if(!popup){alert('인쇄창이 차단됐습니다. 팝업을 허용한 뒤 다시 시도하세요.');return;}
 const paper=output.map(p=>'<section class="ck79-page"><header>CONCEPTKNOT / '+p.page+' / '+p.total+'</header>'+
  '<h1>'+esc(p.title)+'</h1><pre>'+esc(p.body)+'</pre><small>'+esc(p.status)+'</small></section>').join('');
 const html='<!doctype html><html lang="ko"><meta charset="utf-8"><title>ConceptKnot 개인 오답 요약</title>'+
  '<style>@page{size:A4;margin:13mm}*{box-sizing:border-box}body{color:#1b3029;font-family:"Malgun Gothic",sans-serif;font-size:9.5pt;line-height:1.5;margin:0}'+
  '.ck79-page{height:266mm;page-break-after:always;break-after:page;overflow:hidden}'+
  '.ck79-page:last-child{break-after:auto;page-break-after:auto}'+
  '.ck79-page header,.ck79-page small{color:#637b70;font-size:9pt}h1{font-size:18pt;padding:8mm 0 4mm;margin:0 0 5mm;border-bottom:1px solid #bdccc2}'+
  'pre{font:inherit;white-space:pre-wrap;overflow-wrap:anywhere;columns:2;column-gap:7mm}</style>'+
  '<body>'+paper+'</body></html>';
 popup.document.open();popup.document.write(html);popup.document.close();
 popup.focus();setTimeout(()=>popup.print(),300);
}
document.addEventListener('click',e=>{
 const b=e.target.closest?.('[data-ck79-final-generate],[data-ck79-final-copy],[data-ck79-final-txt],[data-ck79-final-print]');
 if(!b)return;
 if(b.hasAttribute('data-ck79-final-generate')){
  const value=document.querySelector('[data-ck79-final-count]')?.value;
  currentCount=[1,3,5].includes(Number(value))?Number(value):5;
  output=makePages(currentCount);renderPreview();
 }else if(b.hasAttribute('data-ck79-final-copy')){
  if(navigator.clipboard?.writeText)navigator.clipboard.writeText(content()).catch(()=>window.prompt('복사할 텍스트',content()));
  else window.prompt('복사할 텍스트',content());
 }else if(b.hasAttribute('data-ck79-final-txt'))saveTxt();
 else if(b.hasAttribute('data-ck79-final-print'))printPDF();
});
let scheduled=false;
function decorate(){scheduled=false;mount();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
const main=document.getElementById('main');
if(main&&window.MutationObserver)new MutationObserver(changes=>{
 if(changes.some(x=>Array.from(x.addedNodes).some(n=>n.nodeType===1&&(n.matches?.('#ck10-final-root,.ck10-final-actions')||
  n.querySelector?.('#ck10-final-root,.ck10-final-actions'))))&&!scheduled){
  scheduled=true;requestAnimationFrame(decorate);
 }
}).observe(main,{childList:true,subtree:true});
window.CK79Final=Object.freeze({makePages,preview:()=>output.slice(),getCount:()=>currentCount});
})();