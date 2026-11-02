/* v88 personal data diagnostics — read-only until explicit download. */
(function(){
'use strict';
const items=[['recallgraph-first-exam-v1','학습기록'],['ck10-exam-final-v1','최종 정리본'],['ck11-final-page-count','정리본 페이지'],['ck80-explain-drafts-v1','개인 해설'],['ck81-review-workbench-v1','해설 작업대'],['ck82-exam-sessions-v1','실전 기록'],['ck83-personal-concept-links-v1','개념 연결'],['ck84-study-plan-v1','학습계획'],['ck84-personal-materials-v1','개인 교재']];
const safe=s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
function inspect(storage=localStorage){
 return items.map(([key,name])=>{
  try{
   const raw=storage.getItem(key);
   if(raw===null)return {key,name,status:'empty',bytes:0};
   if(key==='ck11-final-page-count')
    return {key,name,status:/^[1-5]$/.test(raw)?'ok':'invalid',bytes:raw.length};
   const data=JSON.parse(raw);
   const validArray=key==='ck10-exam-final-v1';
   if(validArray){
    const valid=Array.isArray(data)&&data.length===5&&data.every(p=>Array.isArray(p)&&p.length===2);
    return {key,name,status:valid?'ok':'invalid',bytes:raw.length};
   }
   if(!data||typeof data!=='object'||Array.isArray(data))return {key,name,status:'invalid',bytes:raw.length};
   const methods={
    'recallgraph-first-exam-v1':()=>['estate','civil'].includes(data.subject)&&
      data.answers&&typeof data.answers==='object'&&!Array.isArray(data.answers)&&
      data.quizAnswers&&typeof data.quizAnswers==='object'&&!Array.isArray(data.quizAnswers)&&
      data.flashVisits&&typeof data.flashVisits==='object'&&!Array.isArray(data.flashVisits),
    'ck80-explain-drafts-v1':()=>Object.entries(data).length<=400&&
      Object.entries(data).every(([id,v])=>/^202[1-5]-(?:[1-9]|[1-7]\d|80)$/.test(id)&&
        v&&typeof v==='object'&&!Array.isArray(v)),
    'ck81-review-workbench-v1':()=>window.CK81Workbench?.sanitizeProgress?.(data),
    'ck82-exam-sessions-v1':()=>window.CK82FullExam?.cleanStore?.(data),
    'ck83-personal-concept-links-v1':()=>window.CK83Links?.sanitize?.(data),
    'ck84-study-plan-v1':()=>window.CK84Plan?.sanitize?.(data),
    'ck84-personal-materials-v1':()=>window.CK84Materials?.sanitize?.(data)
   };
   const valid=methods[key]?Boolean(methods[key]()):true;
   return {key,name,status:valid?'ok':'invalid',bytes:raw.length};
  }catch{return {key,name,status:'invalid',bytes:0};}
 });
}
function downloadRaw(){
 const data={schemaVersion:1,kind:'raw-recovery-only-not-direct-import',capturedAt:new Date().toISOString(),records:{}};
 for(const [key] of items){try{data.records[key]=localStorage.getItem(key);}catch{data.records[key]=null;}}
 const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='ConceptKnot_원본복구용_'+new Date().toISOString().slice(0,10)+'.json';
 document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
}
let root=null;
function render(){
 if(!root)return;
 const values=inspect(),problem=values.filter(x=>x.status==='invalid');
 root.querySelector('[data-v88-body]').innerHTML='<p>읽기 전용 검사 · 데이터를 초기화하거나 수정하지 않습니다. 손상 기록은 복원 전 원본을 보존하세요.</p>'+
 '<div class="ck88-rows">'+values.map(x=>'<div><strong>'+safe(x.name)+'</strong><span>'+
 (x.status==='ok'?'정상 형식':x.status==='empty'?'저장 기록 없음':'손상 의심 · 덮어쓰기 금지')+
 ' · '+x.bytes+'자</span></div>').join('')+'</div>'+
 '<p role="status">'+(problem.length?'검사가 필요한 기록 '+problem.length+'종 · 원본을 먼저 저장하세요.':'구조 오류 감지 없음. 실제 기기 동작 검증은 별도입니다.')+'</p>';
}
function mount(){
 const exists=document.getElementById('ck88-data-diagnostics');if(exists){root=exists;return;}
 const host=document.getElementById('main');if(!host)return;
 root=document.createElement('section');root.id='ck88-data-diagnostics';root.className='ck88-diagnostics';
 root.innerHTML='<div class="ck88-head"><strong>내 학습 데이터 안전 점검</strong><button type="button" data-v88-refresh>진단 새로고침</button>'+
 '<button type="button" data-v88-raw>9종 원본 백업 내려받기</button></div><div data-v88-body></div>';
 host.append(root);render();
}
document.addEventListener('click',event=>{
 const t=event.target.closest?.('[data-v88-refresh],[data-v88-raw]');
 if(!t||!document.getElementById('ck88-data-diagnostics')?.contains(t))return;
 if(t.hasAttribute('data-v88-raw'))downloadRaw();else render();
});
const target=document.getElementById('main');
if(target&&window.MutationObserver)new MutationObserver(()=>{
 if(!document.getElementById('ck88-data-diagnostics')&&
  document.querySelector('#main [data-action="backup"]'))mount();
}).observe(target,{childList:true});
window.CK88Diagnostics=Object.freeze({inspect,mount});
})();