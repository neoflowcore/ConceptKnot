/* Historical v152 audit path; point programmatic consumers to current P4 v154 data.
 * v152's recorded 240/400 figures remain in docs, never presented as current.
 */
'use strict';
const api=require('./audit-p4-v154.cjs');
module.exports=api;
if(require.main===module){
 const r=api.evaluate();
 console.log('Current P4 v154 audit via v152 compatibility entrypoint:',JSON.stringify(r.counts),'issues:',r.issues.length);
 if(r.issues.length)process.exitCode=1;
}
