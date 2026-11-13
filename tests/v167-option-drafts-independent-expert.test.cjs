/* v167: option-specific 2021-23 candidate guards and cryptographic expert gate. */
'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),crypto=require('node:crypto');
const fs=require('node:fs'),read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const bank=read('data/official-2021-2025.json'),map=new Map(bank.map(q=>[q.id,q]));
const explanations=[2021,2022,2023,2024,2025].flatMap(y=>read('data/explanations/official-'+y+'.json').records);
const em=new Map(explanations.map(x=>[x.questionId,x]));
const audit=require('../assets/ck-p4-option-audit-v160.js'),Study=require('../assets/ck-p4-public-study-v163.js');
const v167=require('../assets/ck-p4-substantive-v167.js'),ledger=require('../scripts/p4-evidence-gate-v166.cjs');
const expert=require('../scripts/p4-independent-expert-v167.cjs');
const research=read('data/research/v167-2021-2023-estate-126-option-candidates.json');
const deps={optionAudit:audit,v161:require('../assets/ck-p4-substantive-v161.js'),
 v162:require('../assets/ck-p4-substantive-v162.js'),v164:require('../assets/ck-p4-substantive-v164.js'),
 v165:require('../assets/ck-p4-substantive-v165.js'),v167};
const rows=explanations.map(entry=>({q:map.get(entry.questionId),entry}));
test('126 newly authored options are exact original-only and never overwrite pre-existing rationales',()=>{
 A.equal(research.records.length,29);A.equal(v167.count().options,126);
 const byYear={2021:0,2022:0,2023:0},seen=new Set();
 for(const r of research.records){
  const q=map.get(r.id),e=em.get(r.id);
  A.ok(q&&e);A.deepEqual(r.optionTexts,q.options);A.deepEqual(r.officialAccepted,q.correct);
  A.equal(r.year,q.year);A.equal(r.subject,'estate');
  A.ok(q.question.startsWith(r.questionTextFingerprint));
  for(const d of r.optionDrafts){
   const key=r.id+':'+d.option;A.ok(!seen.has(key));seen.add(key);
   A.equal((e.options[d.option-1]?.draftReason||'').trim(),'');
   A.ok(d.text.length>=55);A.equal(d.expertVerdict,'unreviewed');
   const inp={questionId:q.id,year:q.year,questionText:q.question,officialAnswers:q.correct,index:d.option,optionText:q.options[d.option-1]};
   A.equal(v167.get(inp)?.text,d.text);
   for(const alter of [{...inp,optionText:'fabricated'}, {...inp,year:2025},
    {...inp,questionText:'edited original'}, {...inp,officialAnswers:[0]}, {...inp,index:0}])
     A.equal(v167.get(alter),null);
   byYear[q.year]++;
  }
 }
 A.equal(seen.size,126);A.deepEqual(byYear,{2021:50,2022:36,2023:40});
});
test('v167 total coverage and independent expert stats remain distinct',()=>{
 const r=Study.build(rows,deps);A.equal(r.ready,true,r.errors?.join(' | '));
 A.equal(r.stats.aiOptionCandidates,686);
 A.equal(r.stats.existingOptionCandidates,332);
 A.equal(r.stats.answerContextOnly,156);
 A.equal(r.stats.optionsWithoutIndependentCandidate,826);
 A.equal(r.stats.allCandidateCoverage,1174);
 A.equal(r.stats.expertVerifiedOptions,0);
 A.equal(r.stats.expertVerifiedQuestions,0);
 A.equal(r.stats.officialExplanationsPublished,0);
 A.equal(r.options.filter(x=>x.year===2021&&x.tier==='ai_option_candidate').length,50);
 A.equal(r.options.filter(x=>x.year===2022&&x.tier==='ai_option_candidate').length,36);
 A.equal(r.options.filter(x=>x.year===2023&&x.tier==='ai_option_candidate').length,40);
});
test('expert gate rejects unregistered, self-authored, unsigned, edited and duplicate claims',()=>{
 const empty=ledger.baseline();A.equal(empty.options.length,2000);
 A.equal(ledger.validate(empty).passed,true);
 const before=expert.assess(empty,{reviewers:[]},{records:[]});
 A.equal(before.passed,true);A.equal(before.verifiedOptions,0);
 const {publicKey,privateKey}=crypto.generateKeyPairSync('ed25519');
 const {publicKey:authorityKey,privateKey:authorityPrivate}=crypto.generateKeyPairSync('ed25519');
 const roster={reviewers:[{id:'reviewer-1',status:'externally-checked',
   qualificationType:'independent-law-professional',qualificationReference:'external-check-required',
   credentialCheckedAt:'2026-11-13',independenceCheckedBy:'manual-review-committee',
   independenceCheckedAt:'2026-11-13',
   publicKeyPem:publicKey.export({type:'spki',format:'pem'})}]};
 roster.authoritySignedAt='2026-11-13';
 const registryMessage=Buffer.from(JSON.stringify(['P4-REVIEWER-REGISTRY-v1',roster.authoritySignedAt,roster.reviewers]));
 roster.authoritySignatureBase64=crypto.sign(null,registryMessage,authorityPrivate).toString('base64');
 const trusted={trustedAuthorityPublicKey:authorityKey.export({type:'spki',format:'pem'})};
 const a=structuredClone(empty),o=a.options[0];o.verdict='true';o.explanation='Evidence-backed option verdict awaiting human independent review';
 o.examPdf={url:'https://www.q-net.or.kr/example.pdf',page:1,quotedAnchor:'test',checked:true};
 o.finalAnswer={url:'https://www.q-net.or.kr/answer.pdf',page:1,checked:true};
 o.rule={kind:'textbook-principle',primaryUrl:'https://www.law.go.kr/LSW/',pinpoint:'test reference',
  effectiveOn:'2021-10-30',checked:true};
 o.reviewer={name:'reviewer-1',reviewedAt:'2026-11-13',independentOfAuthor:true};
 const stamp='2026-11-13',author='author-1',id='reviewer-1';
 const payload=Buffer.from(expert.claim(o)+'\n'+id+'\n'+author+'\n'+stamp);
 const proof=crypto.sign(null,payload,privateKey).toString('base64');
 const entry={optionId:o.optionId,reviewerId:id,authorId:author,signedAt:stamp,
 signatureBase64:proof,noConflictOfInterest:true,reviewedPrimaryDocumentIndependently:true,
 noSharedDrafting:true,reviewedHistoricLawAndCases:true,independentOfOriginalAuthor:true,humanReviewer:true};
 A.equal(expert.assess(a,roster,{records:[entry]}).passed,false);
 const good=expert.assess(a,roster,{records:[entry]},trusted);
 A.equal(good.passed,true,good.errors.join(' | '));A.equal(good.verifiedOptions,1);
 A.equal(good.expertApprovedQuestions,0);
 const altered=structuredClone(a);altered.options[0].explanation+=' tampered';
 A.equal(expert.assess(altered,roster,{records:[entry]},trusted).passed,false);
 A.equal(expert.assess(a,roster,{records:[{...entry,authorId:id}]},trusted).passed,false);
 A.equal(expert.assess(a,roster,{records:[entry,entry]},trusted).passed,false);
 A.equal(expert.assess(a,{reviewers:[]},{records:[entry]},trusted).passed,false);
 const badRoster=structuredClone(roster);badRoster.reviewers[0].qualificationReference='unverified-change';
 A.equal(expert.assess(a,badRoster,{records:[entry]},trusted).passed,false);
});
test('P4 v167 frontend and offline optional assets match no-autodeploy policy',()=>{
 const html=fs.readFileSync('index.html','utf8'),sw=fs.readFileSync('sw.js','utf8');
 const diag=fs.readFileSync('assets/ck-data-diagnostics-v88.js','utf8');
 const ui=fs.readFileSync('assets/ck-p4-option-audit-ui-v160.js','utf8');
 const script='ck-p4-substantive-v167.js?v=167';
 A.ok(html.includes(script));A.ok(sw.includes(script));A.ok(diag.includes(script));
 A.ok(html.indexOf(script)<html.indexOf('ck-p4-option-audit-ui-v160.js?v=165'));
 A.ok(html.indexOf(script)<html.indexOf('ck-p4-public-study-v163.js?v=165'));
 A.ok(ui.includes('CK167SubstantiveReview?.get?.(r)'));
 A.ok(sw.includes('conceptknot-study-v168-2021-2023-122-option-drafts'));
 A.equal(read('vercel.json').git.deploymentEnabled,false);
});
