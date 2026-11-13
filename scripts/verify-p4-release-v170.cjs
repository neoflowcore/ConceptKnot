/* v170 P4 read-only manual deployment verification; no automatic CI trigger. */
'use strict';
const {spawnSync}=require('node:child_process');
const files=[
 'tests/v170-p4-qa-hub-and-scope.test.cjs',
 'tests/v168-122-option-source-locked.test.cjs',
 'tests/v167-option-drafts-independent-expert.test.cjs',
 'tests/v165-2024-estate-160-option-notes.test.cjs',
 'tests/v164-2025-final-200-options.test.cjs',
 'tests/v163-p4-study-publish-audit.test.cjs',
 'tests/v162-substantive-next-100-options.test.cjs',
 'tests/v161-substantive-100-options.test.cjs',
 'tests/v160-2000-option-source-audit.test.cjs',
 'tests/v159-p4-offline.test.cjs',
 'tests/v157-release-guards.test.cjs',
 'tests/v157-offline-readiness.test.cjs',
 'tests/v157-sw-runtime.test.cjs'
];
for(const [name,args] of [
 ['P4 400/2000 structural preflight',['scripts/audit-p4-v163.cjs','--gate=study']],
 ['P4 v166 ledger selftest',['scripts/p4-evidence-gate-v166.cjs','--self-test']],
 ['P4 v167 and legacy integrated tests',['--test',...files]],
 ['P4 readonly release check',['scripts/check-release-readonly.cjs']]
]){
 const result=spawnSync(process.execPath,args,{stdio:'inherit'});
 if(result.error){console.error(name+': '+result.error.message);process.exit(2)}
 if(result.status!==0){console.error(name+' failed: '+result.status);process.exit(result.status||2)}
}
