/* Backward-compatible P4 audit entrypoint; source-locked current data audit delegates to v152.
 * Existing programmatic consumers keep their import path. Historical v151 evidence is in docs.
 */
'use strict';
const api=require('./audit-p4-v152.cjs');
module.exports=api;
if(require.main===module){
 const report=api.evaluate();
 console.log('Current P4 audit via v151 alias:',JSON.stringify(report.counts),'issues:',report.issues.length);
 if(report.issues.length)process.exitCode=1;
}
