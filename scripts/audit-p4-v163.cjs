/* v163 P4 deterministic structure-only QA; no source writes or remote publishing. */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const read=p=>JSON.parse(fs.readFileSync(path.join(__dirname,'..',p),'utf8'));
const bank=read('data/official-2021-2025.json');
const map=new Map(bank.map(q=>[q.id,q]));
const e=[2021,2022,2023,2024,2025].flatMap(y=>read('data/explanations/official-'+y+'.json').records);
const rows=e.map(entry=>({q:map.get(entry.questionId),entry}));
const Study=require('../assets/ck-p4-public-study-v163.js');
const result=Study.build(rows,{
 optionAudit:require('../assets/ck-p4-option-audit-v160.js'),
 v161:require('../assets/ck-p4-substantive-v161.js'),
 v162:require('../assets/ck-p4-substantive-v162.js'),
 v164:require('../assets/ck-p4-substantive-v164.js')
});
const errors=[...result.errors],s=result.stats;
if(result.ready&&(s.structuralQuestionsChecked!==400||s.structuralOptionsChecked!==2000||
 s.questionLevelStudyDrafts!==400||s.aiOptionCandidates!==400||
 s.allCandidateCoverage!==898||s.optionsWithoutIndependentCandidate!==1102))
 errors.push('Source-lock coverage counts disagree with v162 baseline');
const gates={
 structure:result.ready&&errors.length===0&&s.structuralOptionsChecked===2000,
 study:result.ready&&errors.length===0&&s.questionLevelStudyDrafts===400,
 expert:result.ready&&errors.length===0&&s.expertVerifiedQuestions===400&&
  s.expertVerifiedOptions===2000&&s.officialPdfAttachmentsRead===400,
 official:result.ready&&errors.length===0&&s.officialExplanationsPublished===400
};
const requested=(process.argv.find(a=>a.startsWith('--gate='))||'--gate=structure').slice(7);
const isKnown=Object.hasOwn(gates,requested);
const report={kind:'source-locked-preflight-NOT-expert-content-verification',scope:'2021–2025 official first exam',
 gates,selectedGate:requested,selectedGatePass:isKnown?gates[requested]:false,
 stats:s,errors,warnings:['1102 independent option explanations still unwritten; 2025 all 80 questions have unreviewed five-option drafts',
 'Q-Net announcement != attachment PDF independent review',
 'Historic statutes/case law and independent reviewer evidence not recorded'],
 githubActionsRun:false,localDeviceQA:'NOT_RUN',sourceMutation:false};
process.stdout.write(JSON.stringify(report,null,2)+'\n');
if(!isKnown||!gates[requested])process.exitCode=2;
