/* v165 P4 single build verification entrypoint, manual Vercel deployment only. */
'use strict';
const {spawnSync}=require('node:child_process');
const files=["tests/v165-2024-estate-160-option-notes.test.cjs","tests/v164-2025-final-200-options.test.cjs","tests/v163-p4-study-publish-audit.test.cjs","tests/v162-substantive-next-100-options.test.cjs","tests/v161-substantive-100-options.test.cjs","tests/v160-2000-option-source-audit.test.cjs","tests/v159-p4-offline.test.cjs","tests/v157-release-guards.test.cjs","tests/v157-offline-readiness.test.cjs","tests/v157-sw-runtime.test.cjs"];
for(const [label,args] of [
 ['P4 original/source gate',['scripts/audit-p4-v163.cjs','--gate=study']],
 ['P4 integrated Node tests',['--test',...files]]
]){
 const result=spawnSync(process.execPath,args,{stdio:'inherit'});
 if(result.error){process.stderr.write(label+': '+result.error.message+'\n');process.exit(2);}
 if(result.status!==0){process.stderr.write(label+': failed with '+result.status+'\n');process.exit(result.status||2);}
}
