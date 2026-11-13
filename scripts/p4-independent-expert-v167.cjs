/* P4 v167 — independently signed expert attestations for canonical evidence.
 * A valid digital signature proves possession of a key, NOT a person's qualifications.
 * Qualified reviewer identities/independence MUST be checked externally before registration.
 * Never expose private keys or store real reviewer personal details in public source.
 */
'use strict';
const fs=require('node:fs'),crypto=require('node:crypto');
const {validate}=require('./p4-evidence-gate-v166.cjs');
const iso=value=>typeof value==='string'&&/^20\d{2}-\d{2}-\d{2}$/.test(value)&&
  !Number.isNaN(Date.parse(value+'T00:00:00Z'))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;
function claim(option){
 return JSON.stringify(['P4-INDEPENDENT-EXPERT-OPTION-v1',option.optionId,option.canonicalSha256,
  option.optionSha256,option.verdict,option.explanation,option.examPdf,option.finalAnswer,option.rule]);
}
function assess(ledger,roster,attestations){
 const structural=validate(ledger);
 const problems=structural.errors.slice(),verified=new Set();
 if(!structural.passed)return {passed:false,verifiedOptions:0,expertApprovedQuestions:0,errors:problems};
 if(!Array.isArray(roster?.reviewers)||!Array.isArray(attestations?.records))
  return {passed:false,verifiedOptions:0,expertApprovedQuestions:0,errors:['Missing independent reviewer registry or attestation records']};
 const keys=new Map();
 for(const person of roster.reviewers){
  if(!person||typeof person.id!=='string'||keys.has(person.id)||!person.id.trim()||
    person.status!=='externally-checked'||!iso(person.credentialCheckedAt)||
    !person.qualificationReference||!person.qualificationType||!person.independenceCheckedBy||
    !iso(person.independenceCheckedAt)||!person.publicKeyPem){
   problems.push('Invalid or duplicated external reviewer registration');continue;
  }
  try{const key=crypto.createPublicKey(person.publicKeyPem);
   if(key.asymmetricKeyType!=='ed25519')throw Error('Not Ed25519');
   keys.set(person.id,{...person,key});
  }catch{problems.push('Invalid reviewer public key '+person.id);}
 }
 const attest=new Map();
 for(const record of attestations.records){
  if(!record||typeof record.optionId!=='string'||attest.has(record.optionId)){
   problems.push('Duplicate/malformed signed option attestation');continue;
  }
  attest.set(record.optionId,record);
 }
 const byId=new Map(ledger.options.map(o=>[o.optionId,o]));
 for(const [id,entry] of attest){
  const option=byId.get(id),person=keys.get(entry.reviewerId);
  if(!option||!person||option.verdict==='unreviewed'||!entry.signatureBase64||
    !iso(entry.signedAt)||!entry.noConflictOfInterest||entry.authorId===entry.reviewerId||
    entry.authorId===undefined||!entry.authorId||!entry.reviewedPrimaryDocumentIndependently||
    !entry.noSharedDrafting||!entry.reviewedHistoricLawAndCases||
    !entry.independentOfOriginalAuthor||!entry.humanReviewer){
   problems.push('Independent review prerequisites missing for '+id);continue;
  }
  const data=Buffer.from(claim(option)+'\n'+entry.reviewerId+'\n'+entry.authorId+'\n'+entry.signedAt,'utf8');
  const signature=Buffer.from(entry.signatureBase64,'base64');
  if(signature.length!==64||!crypto.verify(null,data,person.key,signature)){
   problems.push('Invalid expert digital signature for '+id);continue;
  }
  verified.add(id);
 }
 let expertApprovedQuestions=0;
 for(const q of ledger.questions){
  if(q.allOptionEvidenceReviewed===true&&q.expertReviewer&&iso(q.signedAt)&&
   Array.from({length:5},(_,i)=>q.questionId+':'+(i+1)).every(id=>verified.has(id)))
   expertApprovedQuestions++;
 }
 return {passed:problems.length===0,verifiedOptions:verified.size,expertApprovedQuestions,
  officialCertifiedQuestions:0,errors:problems,
  warning:'Digital signatures authenticate registered keys only. Qualification, conflicts and source truth require real independent human verification. This tool never certifies Q-Net official commentary.'};
}
if(require.main===module){
 try{const [ledgerPath,rosterPath,attestationsPath]=process.argv.slice(2);
  if(!ledgerPath||!rosterPath||!attestationsPath)throw Error('Usage: node scripts/p4-independent-expert-v167.cjs LEDGER.json REVIEWERS.json ATTESTATIONS.json');
  const load=p=>JSON.parse(fs.readFileSync(p,'utf8'));
  const result=assess(load(ledgerPath),load(rosterPath),load(attestationsPath));
  console.log(JSON.stringify(result,null,2));if(!result.passed)process.exitCode=2;
 }catch(e){console.error(e.message);process.exitCode=2}
}
module.exports={assess,claim};
