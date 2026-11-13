/* ConceptKnot v171: P4 functional MVP -> theory/graph; non-skipping TTS. */
'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8'),parse=p=>JSON.parse(read(p));
const bank=parse('data/official-2021-2025.json'),byId=new Map(bank.map(x=>[x.id,x]));
const bridge=require('../assets/ck-exam-theory-bridge-v171.js');
const chunks=require('../assets/ck-tts-chunks-v171.js');
const cache='conceptknot-study-v171-p4-mvp-tts-theory-graph';
test('canonical 400 question matching yields provisional theory/graph suggestions, not legal signoff',()=>{
 A.equal(bank.length,400);
 let suggested=0,graph=0;
 for(const q of bank){
  const matches=bridge.match(q);
  A.ok(matches.length<=3);
  if(matches.length)suggested++;
  if(matches.some(m=>m.graph))graph++;
  for(const m of matches){
   A.equal(m.candidateOnly,true);A.equal(m.expertVerified,false);
   A.equal(m.sourcePdfChecked,false);
   A.ok(m.easy.length>15);A.ok(m.example.length>15);
   A.ok(m.advanced.length>20);
  }
 }
 A.equal(suggested,211);A.equal(graph,30);
 A.ok(bridge.match(byId.get('2025-12')).some(x=>x.id==='estate.elasticity.demand'));
 A.ok(bridge.match(byId.get('2021-44')).some(x=>x.id==='civil.declaration'));
 A.equal(bridge.match({...byId.get('2025-12'),verified:false}).length,0);
 A.equal(bridge.match({...byId.get('2025-12'),id:'2025-89'}).length,0);
 A.equal(bridge.match({...byId.get('2025-12'),subject:'civil'}).length,0);
});
test('bridge renders escaped easy/example/deep study links without claiming official audit',()=>{
 const q=byId.get('2025-12'),markup=bridge.panel(q);
 A.match(markup,/기출 풀이 → 핵심 이론 → 도형차트/);
 A.match(markup,/키워드 기반 학습 추천/);
 A.match(markup,/data-ck171-graph/);
 A.match(markup,/심화·주의점/);
 A.match(markup,/도형차트에서 직접 움직이기/);
 A.doesNotMatch(markup,/전문가 검수 완료/);
 const html=bridge.panel({...q,question:'<script>alert(1)</script>',options:q.options});
 A.ok(!html.includes('<script>alert'));
 A.equal(bridge.openGraph('2025-12','does-not-exist'),false);
 const source=read('assets/ck-exam-theory-bridge-v171.js');
 A.ok(source.includes("document.querySelector('[data-go=\"venn\"]')"));
 A.ok(source.includes("CK78Analysis?.open?.(q.year,q.number,back)"));
 A.ok(source.includes("context={id:q.id,rule,configured:false}"));
 A.ok(source.includes("data-ck145-example"));
});
test('sentence-aware Korean TTS splits into bounded chunks and keeps normalized source intact',()=>{
 const text='기준가격은 120만원이며 면적은 84㎡입니다. '+('첫째 조건이 유지되는 상황에서 가격과 수량을 따로 확인해야 합니다. ').repeat(15);
 const words=chunks.prepare(text),joined=words.join('');
 A.ok(words.length>4);
 A.ok(words.every(x=>Array.from(x).length<=112));
 A.ok(words.join(' ').includes('84 제곱미터'));
 const normalized=chunks.normalize(text);
 A.equal(joined.replace(/\s/g,''),normalized.replace(/\s/g,''));
 A.equal(chunks.normalize('LTV 60% 그리고 DSR 30%'), '엘 티 브이 60 퍼센트 그리고 디 에스 알 30 퍼센트');
 const surrogate=chunks.split('가'.repeat(80)+'🦉'+'나'.repeat(100),100);
 A.equal(surrogate.join(''),'가'.repeat(80)+'🦉'+'나'.repeat(100));
 A.ok(surrogate.every(s=>Array.from(s).length<=100));
});
test('OS synthesis failure remains at original index; explicit retry resumes same words once',()=>{
 const file=read('assets/ck-voice-controller-v138.js'),world={};
 vm.runInNewContext(file,{window:world,globalThis:world});
 const calls=[],starts=[],completed=[];let failed=false;
 const clock={set:()=>42,clear:()=>{}};
 const voice={lang:'ko-KR',name:'Korean'};
 const synth={cancel(){},speak(utt){
  calls.push(utt.text);
  if(utt.text==='둘'&&!failed){failed=true;utt.onerror({error:'not-allowed'});return;}
  utt.onstart();starts.push(utt.text);utt.onend();
 }};
 const controller=world.CKVoiceControllerFactory.create({
  synthesis:()=>synth,newUtterance:text=>({text}),getVoices:()=>[voice],selectVoice:()=>voice,
  clock,onComplete:(i,text)=>completed.push([i,text])
 });
 A.equal(controller.play({segments:['하나','둘','셋'],rate:1.5}).ok,false);
 const snapshot=controller.getState();
 A.equal(snapshot.status,'error');A.equal(snapshot.completed,1);
 A.equal(snapshot.failedIndex,1);A.equal(snapshot.lastFailureCode,'not-allowed');
 const ret=controller.retryFailed();A.equal(ret.ok,true);
 A.equal(controller.getState().status,'ended');
 A.equal(controller.getState().completed,3);
 A.equal(completed.map(x=>x[1]).join(','),'하나,둘,셋');
 A.equal(calls.join(','),'하나,둘,둘,셋');
 A.equal(controller.retryFailed().ok,false);
});
test('v171 HTML/SW/manual release lock and 3 reading modes are explicitly connected',()=>{
 const html=read('index.html'),sw=read('sw.js'),diag=read('assets/ck-data-diagnostics-v88.js');
 const ui=read('assets/ck-study-p4-v78.js'),c=read('assets/ck-voice-controller-v138.js'),v=parse('vercel.json');
 A.ok(html.includes('content="v171-p4-mvp-tts-theory-graph"'));
 A.ok(sw.includes("const CACHE='"+cache+"'"));
 A.ok(diag.includes("OFFLINE_CACHE='"+cache+"'"));
 for(const a of ['ck-exam-theory-bridge-v171.js?v=171','ck-exam-theory-bridge-v171.css?v=171',
  'ck-tts-chunks-v171.js?v=171','ck-study-p4-v78.js?v=171','ck-voice-controller-v138.js?v=171']){
  A.ok(html.includes(a),'missing from HTML '+a);
  A.ok(sw.includes(a),'missing from SW '+a);
 }
 A.ok(html.includes("CK171TTSChunks.split(text,112)"));
 A.ok(html.includes("CK171TTSChunks?.normalize?.(str)"));
 A.ok(html.includes("공식 채점상 인정 정답 지문"));
 A.ok(html.includes("retryFailed:()=>ck138Voice?.retryFailed?.()"));
 A.ok(ui.includes('data-ck107-voice-retry'));
 A.ok(c.includes('function retryFailed()'));
 A.equal(v.git.deploymentEnabled,false);
 A.ok(v.buildCommand.includes('verify-p4-release-v171.cjs'));
 A.equal(fs.existsSync('.github/workflows'),false);
 for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))
  if(m[1].trim())A.doesNotThrow(()=>new vm.Script(m[1]));
});
