/* ConceptKnot v117 study-analytics evidence: manually run node --test.
 * Avoids network, browser hardware, GitHub Actions and installation artifacts.
 */
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=()=>fs.readFileSync(path.join(__dirname,'..','assets','ck-study-analytics-v83.js'),'utf8');
const DAY=86400000,KST=9*3600000;
const validTime=t=>Number.isFinite(Number(t))&&Number(t)>0;
const dayKey=t=>new Date(Number(t)+KST).toISOString().slice(0,10);
function compute(official){
 const code=source(),start=code.indexOf('function compute('),end=code.indexOf('function barChart(',start);
 assert.ok(start>0&&end>start);
 return new Function('DAY','KST','validTime','dayKey','bank','window',
  code.slice(start,end)+'return compute;')(DAY,KST,validTime,dayKey,()=>official,{});
}
const now=Date.parse('2026-11-04T07:40:00Z');
const sessions=[{status:'submitted',year:2019,submittedAt:now-1000,answers:Array(80).fill(1)}];
const study={typing:[null,{at:now-500,subject:'estate',accuracy:null,cpm:null}],
 recallEvents:[null,{id:'2019-1',at:now-400,outcome:'remember'}]};
test('unloaded 2016-2020 bank never silently reports a scored official attempt',()=>{
 const report=compute({})({study,sessions,official:{},now,days:7});
 assert.deepEqual(report.pendingYears,[2019]);
 assert.equal(report.sessions,1);
 assert.equal(report.accuracy,null);
 assert.equal(report.averageEstate,null);
 assert.equal(report.typingAccuracy,null);
 assert.equal(report.typingCpm,null);
 assert.equal(report.typingCount,1);
 assert.equal(report.recallCount,1);
});
test('fully available official bank correctly scores 80 questions',()=>{
 const official={};
 for(let i=1;i<=80;i++)official['2019-'+i]={id:'2019-'+i,
  verified:true,subject:i<=40?'estate':'civil',correct:[1]};
 const report=compute(official)({study,sessions,official,now,days:7});
 assert.deepEqual(report.pendingYears,[]);
 assert.equal(report.answered,80);assert.equal(report.correct,80);
 assert.equal(report.averageEstate,100);assert.equal(report.averageCivil,100);
 assert.equal(report.accuracy,100);
});
test('analytic data loader can be initiated only by an explicit user click',()=>{
 const code=source();
 assert.match(code,/<button type="button" data-ck83-stats-load-bank>/);
 assert.match(code,/t\.hasAttribute\('data-ck83-stats-load-bank'\)/);
 assert.match(code,/window\.CK89OfficialBank\?\.loadAll/);
 const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
 const sw=fs.readFileSync(path.join(__dirname,'..','sw.js'),'utf8');
 assert.match(html,/ck-study-analytics-v83\.js\?v=117/);
 assert.equal((sw.match(/ck-study-analytics-v83\.js\?v=117/g)||[]).length,2);
});
