#!/usr/bin/env node
/* P4 evidence ledger v166: evidence must be entered by humans after reading primary sources.
 * No automatic promotion from AI drafts, answer keys, OCR or notice links.
 * Usage: node scripts/p4-evidence-gate-v166.cjs --init > evidence.json
 *        node scripts/p4-evidence-gate-v166.cjs --check evidence.json
 *        node scripts/p4-evidence-gate-v166.cjs --self-test
 * This tool is intentionally NOT an official certification or publishing service.
 */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const bank=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/official-2021-2025.json'),'utf8'))
 .filter(q=>q.year>=2021&&q.year<=2025).sort((a,b)=>a.year-b.year||a.number-b.number);
const hash=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
const canonical=q=>[q.id,q.year,q.number,q.subject,q.question,q.options,q.correct];
const idOf=(q,i)=>q.id+':'+i;
const required=(x)=>typeof x==='string'&&x.trim().length>0;
const https=(v)=>{try{const u=new URL(v);return u.protocol==='https:'&&!u.username&&!u.password}catch{return false}};
const baseline=()=>{
 const options=bank.flatMap(q=>q.options.map((option,i)=>({
  optionId:idOf(q,i+1),questionId:q.id,year:q.year,number:q.number,
  option:i+1,canonicalSha256:hash(canonical(q)),optionSha256:hash(option),
  verdict:'unreviewed',explanation:'',examPdf:{url:'',page:null,quotedAnchor:'',checked:false},
  finalAnswer:{url:'',page:null,checked:false},
  rule:{kind:'',primaryUrl:'',pinpoint:'',effectiveOn:'',checked:false},
  reviewer:{name:'',reviewedAt:'',independentOfAuthor:false},
  notes:''
 })));
 return {schemaVersion:1,scope:'2021-2025 A-form 400 questions / 2000 options',
  generatedFrom:'data/official-2021-2025.json',options,
  questions:bank.map(q=>({questionId:q.id,canonicalSha256:hash(canonical(q)),
   expertReviewer:'',signedAt:'',allOptionEvidenceReviewed:false,
   specialAnswerReasonChecked:false,officialPublicationAuthorization:''}))};
};
function validate(ledger){
 const errors=[],expected=baseline(),issues=new Map(),seen=new Set(),qseen=new Set();
 const fail=(id,msg)=>{if(errors.length<80)errors.push(id+': '+msg)};
 if(bank.length!==400||expected.options.length!==2000)fail('bank','expected exactly 400 questions/2000 options');
 if(!ledger||ledger.schemaVersion!==1||!Array.isArray(ledger.options)||!Array.isArray(ledger.questions))
  return {passed:false,errors:['ledger: malformed schema'],verifiedOptions:0,reviewedQuestions:0,authorizedQuestions:0};
 if(ledger.options.length!==2000)fail('ledger','expected 2000 option records');
 if(ledger.questions.length!==400)fail('ledger','expected 400 question records');
 let verifiedOptions=0,reviewedQuestions=0,authorizedQuestions=0;
 const expectedMap=new Map(expected.options.map(v=>[v.optionId,v]));
 for(const r of ledger.options){
  const id=r?.optionId||'?'; if(seen.has(id)){fail(id,'duplicate');continue}seen.add(id);
  const e=expectedMap.get(id);
  if(!e){fail(id,'unknown option');continue}
  if(r.questionId!==e.questionId||r.option!==e.option||r.canonicalSha256!==e.canonicalSha256||
     r.optionSha256!==e.optionSha256){fail(id,'canonical question/option drift');continue}
  if(r.verdict==='unreviewed')continue;
  if(!['true','false','context-dependent'].includes(r.verdict)){fail(id,'invalid verdict');continue}
  const pdf=r.examPdf||{},answer=r.finalAnswer||{},rule=r.rule||{},rev=r.reviewer||{};
  const valid=required(r.explanation)&&pdf.checked===true&&https(pdf.url)&&
   Number.isInteger(pdf.page)&&pdf.page>0&&required(pdf.quotedAnchor)&&
   answer.checked===true&&https(answer.url)&&Number.isInteger(answer.page)&&answer.page>0&&
   rule.checked===true&&['statute','precedent','official-data','textbook-principle','calculation'].includes(rule.kind)&&
   https(rule.primaryUrl)&&required(rule.pinpoint)&&/^20\d\d-\d\d-\d\d$/.test(rule.effectiveOn)&&
   required(rev.name)&&!/^ai|automated$/i.test(rev.name.trim())&&
   /^20\d\d-\d\d-\d\d$/.test(rev.reviewedAt)&&rev.independentOfAuthor===true;
  if(!valid){fail(id,'missing source page, historic rule, independent reviewer, or dated evidence');continue}
  verifiedOptions++;
  issues.set(e.questionId,(issues.get(e.questionId)||0)+1);
 }
 const qmap=new Map(expected.questions.map(x=>[x.questionId,x]));
 for(const q of ledger.questions){
  const id=q?.questionId||'?';
  if(qseen.has(id)){fail(id,'duplicate question');continue}qseen.add(id);
  const e=qmap.get(id);if(!e){fail(id,'unknown question');continue}
  if(q.canonicalSha256!==e.canonicalSha256){fail(id,'question drift');continue}
  const original=bank.find(x=>x.id===id);
  const allReviewed=issues.get(id)===5;
  const special=original.correct.length!==1;
  if(q.allOptionEvidenceReviewed===true||required(q.signedAt)||required(q.expertReviewer)||required(q.officialPublicationAuthorization)){
   if(!allReviewed||q.allOptionEvidenceReviewed!==true||!required(q.expertReviewer)||
      !/^20\d\d-\d\d-\d\d$/.test(q.signedAt||'')||
      (special&&q.specialAnswerReasonChecked!==true)){
    fail(id,'question signoff without five verified options or special-answer evidence');continue}
   reviewedQuestions++;
   if(required(q.officialPublicationAuthorization)) {
    // An internal authorization token is not governmental or Q-Net certification.
    authorizedQuestions++;
   }
  }
 }
 for(const id of expectedMap.keys())if(!seen.has(id))fail(id,'missing option');
 for(const id of qmap.keys())if(!qseen.has(id))fail(id,'missing question');
 return {passed:errors.length===0,errors,verifiedOptions,reviewedQuestions,authorizedQuestions,
  officialCertifiedQuestions:0,warning:'Authorization is internal only; no Q-Net or governmental certification is implied.'};
}
const arg=process.argv[2];
if(arg==='--init'){process.stdout.write(JSON.stringify(baseline(),null,2)+'\n')}
else if(arg==='--check'){
 if(!process.argv[3]){console.error('Usage: --check path/to/evidence.json');process.exitCode=2}
 else {try{const result=validate(JSON.parse(fs.readFileSync(process.argv[3],'utf8')));
  console.log(JSON.stringify(result,null,2));if(!result.passed)process.exitCode=2}
 catch(e){console.error('Evidence read/parse failed: '+e.message);process.exitCode=2}}
}else if(arg==='--self-test'){
 const assert=require('node:assert/strict');
 const a=baseline();assert.equal(a.options.length,2000);assert.equal(a.questions.length,400);
 let r=validate(a);assert.equal(r.passed,true);assert.equal(r.verifiedOptions,0);assert.equal(r.reviewedQuestions,0);
 const missing=structuredClone(a);missing.options.pop();assert.equal(validate(missing).passed,false);
 const tampered=structuredClone(a);tampered.options[0].optionSha256='changed';assert.equal(validate(tampered).passed,false);
 const forged=structuredClone(a);forged.options[0].verdict='true';assert.equal(validate(forged).passed,false);
 const promoted=structuredClone(a);promoted.questions[0].allOptionEvidenceReviewed=true;
 assert.equal(validate(promoted).passed,false);
 console.log('P4 evidence gate v166 self-test: 6 checks PASS (schema, empty, missing, drift, forged review, signoff guard)');
}else {console.error('Usage: --init | --check FILE | --self-test');process.exitCode=2}
